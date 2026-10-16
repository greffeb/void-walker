// Worker Cloudflare du service de rapports (AP-06, D-134) : POST /rapports, JSON dans le corps, HTTPS seulement.

import { cleAppareil, confirmer, ETAT_VIDE, liberer, reserver, type Decision, type EtatGarde } from './garde';
import { github, type Github } from './github';
import { composer, empreinteRapport, ErreurTaille, hacher, lireDemande, TAILLE_MAX_DEMANDE, type Demande } from './rapport';

/** Types minimaux de l'environnement Workers, pour ne dépendre d'aucun paquet. */
export interface EspaceGarde {
  idFromName(nom: string): unknown;
  get(id: unknown): { fetch(requete: Request): Promise<Response> };
}

export interface Env {
  /** Clé GitHub limitée aux issues et commentaires de ce dépôt ; secret du Worker, non relisible (D-134). */
  readonly GITHUB_JETON: string;
  /** « propriétaire/dépôt ». */
  readonly DEPOT: string;
  /** Origines autorisées, séparées par des virgules. */
  readonly ORIGINES: string;
  readonly GARDE: EspaceGarde;
}

export interface Stockage {
  get<T>(cle: string): Promise<T | undefined>;
  put(cle: string, valeur: unknown): Promise<void>;
}

/** Réponse au jeu. `publie` et `doublon` : le rapport est arrivé, le jeu peut l'oublier. */
export type Reponse =
  | { readonly etat: 'publie'; readonly adresse: string }
  | { readonly etat: 'doublon'; readonly adresse: string | null }
  | { readonly etat: 'trop'; readonly apresSecondes: number }
  | { readonly etat: 'refuse'; readonly raison: string }
  | { readonly etat: 'echec' };

function enTetesCors(origine: string | null, env: Env): Record<string, string> {
  if (origine === null || !origineAutorisee(origine, env)) return {};
  return { 'Access-Control-Allow-Origin': origine, Vary: 'Origin' };
}

function origineAutorisee(origine: string, env: Env): boolean {
  return env.ORIGINES.split(',')
    .map((permise) => permise.trim())
    .includes(origine);
}

function repondre(corps: Reponse, statut: number, cors: Record<string, string>, autres: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors, ...autres } });
}

/** Le dialogue avec l'objet durable, sous forme d'appels. */
export interface Garde {
  reserver(adresseIp: string, empreinte: string): Promise<{ readonly decision: Decision; readonly appareil: string; readonly moment: number }>;
  confirmer(empreinte: string, adresse: string): Promise<void>;
  liberer(appareil: string, empreinte: string, moment: number): Promise<void>;
}

export function gardeDistante(env: Env): Garde {
  const objet = env.GARDE.get(env.GARDE.idFromName('garde'));
  const appeler = async <T>(corps: unknown): Promise<T> => {
    const reponse = await objet.fetch(new Request('https://garde/', { method: 'POST', body: JSON.stringify(corps) }));
    if (!reponse.ok) throw new Error(`Garde : ${reponse.status}.`);
    return (await reponse.json()) as T;
  };
  return {
    reserver: (adresseIp, empreinte) => appeler({ op: 'reserver', adresseIp, empreinte }),
    confirmer: async (empreinte, adresse) => {
      await appeler({ op: 'confirmer', empreinte, adresse });
    },
    liberer: async (appareil, empreinte, moment) => {
      await appeler({ op: 'liberer', appareil, empreinte, moment });
    },
  };
}

/** Publie le rapport : commentaire sur la PR ouverte d'une version de test, sinon issue (D-093, D-132). */
async function publier(demande: Demande, gh: Github): Promise<string> {
  if (demande.pr !== null) {
    if (await gh.prOuverte(demande.pr)) {
      const { corps } = await composer(demande, { enCommentaire: true });
      return gh.commenter(demande.pr, corps);
    }
    const { titre, corps, etiquettes } = await composer(demande, { enCommentaire: false, prFermee: true });
    return gh.creerIssue(titre, corps, etiquettes);
  }
  const { titre, corps, etiquettes } = await composer(demande, { enCommentaire: false });
  return gh.creerIssue(titre, corps, etiquettes);
}

export async function traiter(requete: Request, env: Env, dependances: { readonly garde: Garde; readonly gh: Github }): Promise<Response> {
  const origine = requete.headers.get('Origin');
  const cors = enTetesCors(origine, env);
  const url = new URL(requete.url);

  if (requete.method === 'OPTIONS') {
    if (Object.keys(cors).length === 0) return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' },
    });
  }
  if (url.pathname !== '/rapports') return new Response('Service de rapports de Void Walker.\n', { status: url.pathname === '/' ? 200 : 404 });
  if (requete.method !== 'POST') return repondre({ etat: 'refuse', raison: 'POST seulement' }, 405, cors, { Allow: 'POST, OPTIONS' });
  if (origine === null || !origineAutorisee(origine, env)) return repondre({ etat: 'refuse', raison: 'origine non autorisée' }, 403, cors);

  const texte = await requete.text();
  if (texte.length > TAILLE_MAX_DEMANDE) return repondre({ etat: 'refuse', raison: 'rapport trop grand' }, 413, cors);
  let donnees: unknown;
  try {
    donnees = JSON.parse(texte);
  } catch {
    return repondre({ etat: 'refuse', raison: 'JSON illisible' }, 400, cors);
  }
  const lecture = lireDemande(donnees);
  if (!lecture.ok) return repondre({ etat: 'refuse', raison: lecture.raison }, 400, cors);
  const { demande } = lecture;

  const empreinte = await empreinteRapport(demande);
  const adresseIp = cleAppareil(requete.headers.get('CF-Connecting-IP') ?? 'inconnue');
  const { decision, appareil, moment } = await dependances.garde.reserver(adresseIp, empreinte);
  if (decision.type === 'doublon') return repondre({ etat: 'doublon', adresse: decision.adresse }, 200, cors);
  if (decision.type === 'trop') {
    const apresSecondes = Math.ceil(decision.apresMs / 1000);
    return repondre({ etat: 'trop', apresSecondes }, 429, cors, { 'Retry-After': String(apresSecondes) });
  }

  let adresse: string;
  try {
    adresse = await publier(demande, dependances.gh);
  } catch (erreur) {
    await dependances.garde.liberer(appareil, empreinte, moment);
    if (erreur instanceof ErreurTaille) return repondre({ etat: 'refuse', raison: 'rapport trop grand' }, 413, cors);
    // Seul le statut est journalisé : ni la clé, ni le contenu du rapport.
    console.error(`Publication impossible : ${erreur instanceof Error ? erreur.message : 'erreur inconnue'}`);
    return repondre({ etat: 'echec' }, 502, cors);
  }
  try {
    await dependances.garde.confirmer(empreinte, adresse);
  } catch {
    // Publié quand même (#184) : la réservation reste et arrête un renvoi pendant une minute ; le jeu, lui, ne renvoie pas.
    console.error('Confirmation de la garde impossible après publication.');
  }
  return repondre({ etat: 'publie', adresse }, 201, cors);
}

export default {
  fetch(requete: Request, env: Env): Promise<Response> {
    return traiter(requete, env, { garde: gardeDistante(env), gh: github(env.GITHUB_JETON, env.DEPOT) });
  },
};

/**
 * Objet durable de l'anti-abus (RP-03). Les adresses IP n'y entrent que hachées avec un sel tiré par l'objet lui-même,
 * qui ne le quitte jamais ; tout ce qu'il garde s'efface en un jour au plus.
 */
export class GardeRapports {
  // Cloudflare passe aussi l'environnement en second argument ; l'objet n'en a pas besoin.
  constructor(private readonly etatObjet: { readonly storage: Stockage }) {}

  async fetch(requete: Request): Promise<Response> {
    const corps = (await requete.json()) as Record<string, unknown>;
    const stockage = this.etatObjet.storage;
    const maintenant = Date.now();
    // Lire l'état juste avant de l'écrire, sans autre attente entre les deux : les portes d'entrée de l'objet durable
    // empêchent alors une autre demande de s'intercaler (une attente hors stockage, comme le hachage, ne la retiendrait pas).
    const lireEtat = async (): Promise<EtatGarde> => (await stockage.get<EtatGarde>('etat')) ?? ETAT_VIDE;
    const json = (valeur: unknown): Response => new Response(JSON.stringify(valeur), { headers: { 'Content-Type': 'application/json' } });
    const texte = (cle: string): string => {
      const valeur = corps[cle];
      if (typeof valeur !== 'string') throw new Error(`Champ ${cle} manquant.`);
      return valeur;
    };
    switch (corps.op) {
      case 'reserver': {
        const appareil = await hacher(`${await this.sel()}|${texte('adresseIp')}`);
        const resultat = reserver(await lireEtat(), appareil, texte('empreinte'), maintenant);
        await stockage.put('etat', resultat.etat);
        return json({ decision: resultat.decision, appareil, moment: maintenant });
      }
      case 'confirmer':
        await stockage.put('etat', confirmer(await lireEtat(), texte('empreinte'), texte('adresse'), maintenant));
        return json({});
      case 'liberer': {
        const moment = corps.moment;
        if (typeof moment !== 'number') throw new Error('Champ moment manquant.');
        await stockage.put('etat', liberer(await lireEtat(), texte('appareil'), texte('empreinte'), moment));
        return json({});
      }
      default:
        return new Response('Opération inconnue.', { status: 400 });
    }
  }

  private async sel(): Promise<string> {
    const connu = await this.etatObjet.storage.get<string>('sel');
    if (connu !== undefined) return connu;
    const sel = [...crypto.getRandomValues(new Uint8Array(32))].map((octet) => octet.toString(16).padStart(2, '0')).join('');
    await this.etatObjet.storage.put('sel', sel);
    return sel;
  }
}
