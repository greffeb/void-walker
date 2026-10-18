import { exporter, type DefMonde, type ExportPartie } from '../engine';
import type { Jeu } from './jeu';
import { attester, type Signataire, type Validation } from './validation';

// Rapports des joueurs (C-10 §3, D-142) : « Signaler un bug » et « Envoyer ma partie » partent au service de rapports,
// qui crée l'issue ou commente la PR testée. Sans réseau, le rapport est gardé sur l'appareil et repart seul (RP-03, PR-01).

export type TypeRapport = 'bug' | 'partie';

/** Corps envoyé au service (report-service/src/rapport.ts, `Demande`). Rien qui identifie le joueur (C-09 SP-04). */
export interface Rapport {
  readonly type: TypeRapport;
  readonly version: string;
  readonly build: string;
  readonly commit: string;
  /** PR de la version de test (D-132) ; `null` pour la version publique. */
  readonly pr: number | null;
  readonly commentaire: string;
  /** Case « je valide » (D-096) ; jamais une validation sans signature (C-10 §4, #108). */
  readonly valide: boolean;
  /** Export rejouable (C-09 §5) jusqu'à l'action en cours ; `null` pour un bug signalé sans partie. */
  readonly partie: ExportPartie | null;
  /** Texte affiché au moment du rapport (RP-01). */
  readonly ecran: readonly string[];
  /** « Je valide » signé par le téléphone (C-10 §4) ; 
ull pour un simple retour. */
  readonly validation: Validation | null;
  /** Secondes d'écran allumé de la partie jointe (#204) ; `null` si elle n'a pas été mesurée depuis son début. */
  readonly duree: number | null;
}

/**
 * Ce que voit le joueur après ENVOYER. `envoye` : arrivé ; `garde` : sans réseau, gardé et renvoyé plus tard ; `trop` :
 * le service demande d'attendre, gardé aussi ; `refuse` : le service n'en veut pas ; `perdu` : ni envoyé ni gardé ;
 * `patience` : un rapport vient de partir, le jeu n'en envoie pas un autre tout de suite.
 */
export type Retour = 'envoye' | 'garde' | 'trop' | 'refuse' | 'perdu' | 'patience';

export const COMMENTAIRE_MAX = 1000;
/** Rapports gardés au plus sur l'appareil. */
export const FILE_MAX = 10;
/** Délai du jeu entre deux envois, en plus de celui du service (D-095). */
export const PATIENCE_MS = 20_000;
export const CLE_FILE = 'void-walker:rapports-en-attente';

export interface DependancesRapports {
  /** Adresse du service (POST). */
  readonly adresse: string;
  readonly appeler: (adresse: string, init: RequestInit) => Promise<Pick<Response, 'status'>>;
  /** Stockage de l'appareil (localStorage), commun à toutes les versions publiées : chaque rapport dit où il va. */
  readonly lire: (cle: string) => string | null;
  readonly ecrire: (cle: string, valeur: string) => void;
  readonly maintenant: () => number;
}

export interface Rapports {
  envoyer(rapport: Rapport): Promise<Retour>;
  /** Renvoie les rapports gardés, du plus ancien au plus récent ; s'arrête au premier qui ne passe pas. */
  renvoyer(): Promise<void>;
  enAttente(): number;
  abonner(ecouteur: () => void): () => void;
}

/** Version affichée dans les options (D-227) : ce que le rapport dit du jeu qui l'envoie. */
export interface Construction {
  readonly version: string;
  readonly build: string;
  readonly commit: string;
  /** Numéro de PR d'une version de test, vide sinon. */
  readonly pr: string;
}

/** Rapport de la partie affichée (RP-01, RP-02) : export jusqu'à l'action en cours ; pour un bug, l'écran affiché. */
export function composerRapport(
  monde: DefMonde,
  construction: Construction,
  type: TypeRapport,
  jeu: Jeu | null,
  commentaire: string,
  valide: boolean,
  duree: number | null = null,
): Rapport {
  const { version, build, commit, pr } = construction;
  return {
    type,
    version,
    build,
    commit,
    pr: /^\d+$/.test(pr) ? Number(pr) : null,
    commentaire: commentaire.trim(),
    valide: type === 'partie' && valide,
    partie: jeu === null ? null : exporter(monde, jeu.partie),
    ecran: type === 'bug' && jeu !== null ? [...jeu.recit, ...jeu.assistance] : [],
    validation: null,
    duree,
  };
}

/**
 * « Je valide » d'une partie finie, depuis une version de test : le téléphone signe (C-10 §4). Une partie qui n'est pas
 * allée au bout ne valide pas (D-099) ; si le téléphone ne sait pas signer, la case part sans signature, simple retour.
 */
export async function signerRapport(rapport: Rapport, signataire: Signataire | undefined): Promise<Rapport> {
  if (!rapport.valide || rapport.pr === null || rapport.partie === null || signataire === undefined) return rapport;
  const attestation = await attester(rapport.partie, { pr: rapport.pr, commit: rapport.commit }, rapport.commentaire);
  if (attestation === null) return { ...rapport, valide: false };
  try {
    return { ...rapport, validation: await signataire.signer(attestation) };
  } catch {
    return rapport;
  }
}

type Issue = 'arrive' | 'refuse' | 'plus_tard_trop' | 'plus_tard';

async function poster(dependances: DependancesRapports, rapport: Rapport): Promise<Issue> {
  try {
    const { status } = await dependances.appeler(dependances.adresse, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rapport),
    });
    // 200 : doublon d'un rapport déjà publié ; 201 : publié.
    if (status === 200 || status === 201) return 'arrive';
    if (status === 429) return 'plus_tard_trop';
    if (status >= 400 && status < 500) return 'refuse';
    return 'plus_tard';
  } catch {
    return 'plus_tard';
  }
}

export function creerRapports(dependances: DependancesRapports): Rapports {
  const ecouteurs = new Set<() => void>();
  let dernierEnvoi = Number.NEGATIVE_INFINITY;
  let renvoiEnCours: Promise<void> | null = null;

  const lireFile = (): Rapport[] => {
    try {
      const brut = JSON.parse(dependances.lire(CLE_FILE) ?? '[]') as unknown;
      return Array.isArray(brut) ? (brut as Rapport[]) : [];
    } catch {
      return [];
    }
  };
  let enAttente = lireFile().length;
  const ecrireFile = (file: readonly Rapport[]): boolean => {
    try {
      dependances.ecrire(CLE_FILE, JSON.stringify(file));
    } catch {
      return false;
    }
    enAttente = file.length;
    for (const ecouteur of ecouteurs) ecouteur();
    return true;
  };
  const garder = (rapport: Rapport): boolean => {
    const file = lireFile();
    return file.length < FILE_MAX && ecrireFile([...file, rapport]);
  };

  const renvoyer = (): Promise<void> => {
    renvoiEnCours ??= (async () => {
      try {
        for (;;) {
          const [premier] = lireFile();
          if (premier === undefined) return;
          const issue = await poster(dependances, premier);
          if (issue === 'plus_tard' || issue === 'plus_tard_trop') return;
          // Arrivé, ou refusé pour de bon : il quitte la file dans les deux cas.
          if (!ecrireFile(lireFile().slice(1))) return;
        }
      } finally {
        renvoiEnCours = null;
      }
    })();
    return renvoiEnCours;
  };

  return {
    async envoyer(rapport) {
      if (dependances.maintenant() - dernierEnvoi < PATIENCE_MS) return 'patience';
      const issue = await poster(dependances, rapport);
      if (issue === 'refuse') return 'refuse';
      if (issue === 'arrive') {
        dernierEnvoi = dependances.maintenant();
        void renvoyer();
        return 'envoye';
      }
      if (!garder(rapport)) return 'perdu';
      return issue === 'plus_tard_trop' ? 'trop' : 'garde';
    },
    renvoyer,
    enAttente: () => enAttente,
    abonner(ecouteur) {
      ecouteurs.add(ecouteur);
      return () => ecouteurs.delete(ecouteur);
    },
  };
}
