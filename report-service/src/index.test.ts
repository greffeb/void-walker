import type { Github } from './github';
import { GardeRapports, gardeDistante, traiter, type Env, type EspaceGarde, type Garde, type Reponse, type Stockage } from './index';

const ORIGINE = 'https://greffeb.github.io';
const JETON = 'jeton-secret-de-test';

function stockageMemoire(): Stockage & { readonly valeurs: Map<string, unknown> } {
  const valeurs = new Map<string, unknown>();
  return {
    valeurs,
    get: async <T>(cle: string) => structuredClone(valeurs.get(cle)) as T | undefined,
    put: async (cle, valeur) => {
      valeurs.set(cle, structuredClone(valeur));
    },
  };
}

/** Environnement complet : la vraie garde (objet durable) en mémoire, un GitHub factice qui note ses appels. */
function banc(options: { readonly prOuverte?: boolean; readonly echec?: boolean; readonly confirmationEnPanne?: boolean } = {}) {
  const stockage = stockageMemoire();
  const objet = new GardeRapports({ storage: stockage });
  // Les portes d'entrée de Cloudflare ne laissent pas deux demandes s'intercaler autour du stockage : simulées en file.
  let file: Promise<unknown> = Promise.resolve();
  const espace: EspaceGarde = {
    idFromName: (nom) => nom,
    get: () => ({
      fetch: (requete) => {
        const reponse = file.then(() => objet.fetch(requete));
        file = reponse.catch(() => undefined);
        return reponse;
      },
    }),
  };
  const env: Env = { GITHUB_JETON: JETON, DEPOT: 'greffeb/void-walker', ORIGINES: `${ORIGINE},http://localhost:5173`, GARDE: espace };
  const appels: { type: string; numero?: number; titre?: string; corps: string; etiquettes?: readonly string[] }[] = [];
  let suivant = 1;
  const gh: Github = {
    creerIssue: async (titre, corps, etiquettes) => {
      if (options.echec === true) throw new Error('GitHub indisponible');
      appels.push({ type: 'issue', titre, corps, etiquettes });
      return `https://github.com/greffeb/void-walker/issues/${suivant++}`;
    },
    commenter: async (numero, corps) => {
      if (options.echec === true) throw new Error('GitHub indisponible');
      appels.push({ type: 'commentaire', numero, corps });
      return `https://github.com/greffeb/void-walker/pull/${numero}#issuecomment-${suivant++}`;
    },
    prOuverte: async () => options.prOuverte ?? true,
  };
  const distante = gardeDistante(env);
  const garde: Garde = options.confirmationEnPanne === true ? { ...distante, confirmer: () => Promise.reject(new Error('Garde : 500.')) } : distante;
  const envoyer = async (corps: unknown, entetes: Record<string, string> = {}): Promise<{ statut: number; reponse: Reponse; brut: Response }> => {
    const brut = await traiter(
      new Request('https://rapports.example/rapports', {
        method: 'POST',
        headers: { Origin: ORIGINE, 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7', ...entetes },
        body: typeof corps === 'string' ? corps : JSON.stringify(corps),
      }),
      env,
      { garde, gh },
    );
    return { statut: brut.status, reponse: (await brut.clone().json()) as Reponse, brut };
  };
  return { env, gh, appels, stockage, envoyer };
}

const PARTIE = {
  format: 1,
  version: '0.1.0',
  monde: 'ar-01',
  graine: 42,
  actions: [{ commande: { action: 'regarder', cible: 'piece' }, tirages: [] }],
  observation: { piece: 'salon' },
  empreinte: '00aa11bb22cc33',
};

const BUG = { type: 'bug', version: '0.1.0', build: '402', commit: '3f2a9c1', pr: null, commentaire: 'La porte ne s’ouvre pas', partie: PARTIE, ecran: ['Vous êtes dans le salon.'] };

describe('service de rapports (AP-06)', () => {
  it('crée une issue de bug depuis la version publique', async () => {
    const { envoyer, appels } = banc();
    const { statut, reponse, brut } = await envoyer(BUG);
    expect(statut).toBe(201);
    expect(reponse).toEqual({ etat: 'publie', adresse: 'https://github.com/greffeb/void-walker/issues/1' });
    expect(brut.headers.get('Access-Control-Allow-Origin')).toBe(ORIGINE);
    expect(appels).toHaveLength(1);
    expect(appels[0]?.type).toBe('issue');
    expect(appels[0]?.etiquettes).toEqual(['rapport-bug']);
  });

  it('PR-06 : une rafale de rapports identiques ne publie qu’une fois', async () => {
    const { envoyer, appels } = banc();
    const reponses = await Promise.all(Array.from({ length: 10 }, () => envoyer(BUG)));
    expect(appels).toHaveLength(1);
    expect(reponses.filter(({ statut }) => statut === 201)).toHaveLength(1);
    expect(reponses.filter(({ reponse }) => reponse.etat === 'doublon')).toHaveLength(9);
  });

  it('une rafale de rapports différents est arrêtée par le délai', async () => {
    const { envoyer, appels } = banc();
    const reponses = [];
    for (let i = 0; i < 5; i += 1) reponses.push(await envoyer({ ...BUG, commentaire: `essai ${i}` }));
    expect(appels).toHaveLength(1);
    const refus = reponses.slice(1);
    expect(refus.every(({ statut, reponse }) => statut === 429 && reponse.etat === 'trop')).toBe(true);
    expect(Number(refus[0]?.brut.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('#182 : deux adresses du même bloc IPv6 /64 sont un seul appareil, deux blocs en sont deux', async () => {
    const { envoyer, appels } = banc();
    expect((await envoyer({ ...BUG, commentaire: 'a' }, { 'CF-Connecting-IP': '2001:db8:0:0::1' })).statut).toBe(201);
    expect((await envoyer({ ...BUG, commentaire: 'b' }, { 'CF-Connecting-IP': '2001:db8::abcd:2' })).statut).toBe(429);
    expect((await envoyer({ ...BUG, commentaire: 'c' }, { 'CF-Connecting-IP': '2001:db8:0:1::1' })).statut).toBe(201);
    expect(appels).toHaveLength(2);
  });

  it('#184 : la garde en panne après la publication ne fait ni échec ni second envoi', async () => {
    const { envoyer, appels } = banc({ confirmationEnPanne: true });
    expect(await envoyer(BUG)).toMatchObject({ statut: 201, reponse: { etat: 'publie', adresse: 'https://github.com/greffeb/void-walker/issues/1' } });
    expect((await envoyer(BUG)).reponse.etat).toBe('doublon');
    expect(appels).toHaveLength(1);
  });

  it('PR-09 : une partie envoyée depuis une version de test devient un commentaire de sa PR', async () => {
    const { envoyer, appels } = banc({ prOuverte: true });
    const { statut } = await envoyer({ ...BUG, type: 'partie', pr: 142, valide: true, ecran: [] });
    expect(statut).toBe(201);
    expect(appels[0]).toMatchObject({ type: 'commentaire', numero: 142 });
    expect(appels[0]?.corps).toContain('cochée, sans signature');
    expect(appels[0]?.corps).toContain('"empreinte":"00aa11bb22cc33"');
  });

  it('une PR fermée reçoit une issue qui la cite', async () => {
    const { envoyer, appels } = banc({ prOuverte: false });
    await envoyer({ ...BUG, pr: 142 });
    expect(appels[0]?.type).toBe('issue');
    expect(appels[0]?.corps).toContain('PR #142 (fermée)');
  });

  it('GitHub en échec : 502, rien de compté, le même rapport repart ensuite', async () => {
    const enPanne = banc({ echec: true });
    expect((await enPanne.envoyer(BUG)).statut).toBe(502);
    const etat = enPanne.stockage.valeurs.get('etat') as { global: number[]; rapports: object };
    expect(etat.global).toEqual([]);
    expect(etat.rapports).toEqual({});
  });

  it('refuse une origine inconnue, une demande illisible ou trop grande, sans rien publier', async () => {
    const { envoyer, appels } = banc();
    expect((await envoyer(BUG, { Origin: 'https://ailleurs.example' })).statut).toBe(403);
    expect((await envoyer('{pas du json')).statut).toBe(400);
    expect((await envoyer({ ...BUG, type: 'autre' })).statut).toBe(400);
    expect((await envoyer({ ...BUG, commentaire: 'x'.repeat(1001) })).statut).toBe(400);
    expect((await envoyer({ ...BUG, valide: true })).statut).toBe(400);
    expect((await envoyer({ ...BUG, type: 'partie', partie: null })).statut).toBe(400);
    expect((await envoyer({ ...BUG, ecran: ['x'.repeat(250_000)] })).statut).toBe(413);
    expect(appels).toHaveLength(0);
  });

  it('répond au pré-vol CORS des seules origines autorisées', async () => {
    const { env, gh } = banc();
    const prevol = (origine: string) =>
      traiter(new Request('https://rapports.example/rapports', { method: 'OPTIONS', headers: { Origin: origine } }), env, { garde: gardeDistante(env), gh });
    const permis = await prevol('http://localhost:5173');
    expect(permis.status).toBe(204);
    expect(permis.headers.get('Access-Control-Allow-Methods')).toBe('POST');
    expect((await prevol('https://ailleurs.example')).status).toBe(403);
  });

  it('PR-05 et C-10 §5 : ni la clé GitHub ni l’adresse IP ne sortent ou ne sont gardées en clair', async () => {
    const { envoyer, stockage } = banc();
    const { brut } = await envoyer(BUG);
    expect(await brut.text()).not.toContain(JETON);
    const garde = JSON.stringify([...stockage.valeurs.entries()]);
    expect(garde).not.toContain('203.0.113.7');
    expect(garde).not.toContain(JETON);
  });
});
