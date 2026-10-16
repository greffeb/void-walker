/**
 * Installation de l'appli sur l'écran d'accueil (#174, docs/16-installation-pwa.md). Ce que les options proposent dépend du navigateur :
 * Chrome, Edge et les autres Chromium laissent la page ouvrir leur boîte d'installation (`beforeinstallprompt`) ; Safari sur iPhone
 * et Firefox sur Android n'ont pas d'invite, on y montre seulement le chemin dans leur menu. Ailleurs, rien n'est proposé.
 * Aussi dans une version de test : le porteur valide sur celle de la PR, il doit pouvoir y essayer l'installation (son manifeste porte
 * le numéro de PR dans son nom). Jamais dans l'appli déjà installée.
 */

/**
 * `indisponible` : rien à proposer. `invite` : la boîte du navigateur peut s'ouvrir ; `en_cours` : elle est ouverte. `refusee` et
 * `installee` : réponse du joueur à cette boîte. `guide_ios` et `guide_firefox` : pas d'invite, une aide pas à pas.
 */
export type EtatInstallation = 'indisponible' | 'invite' | 'en_cours' | 'refusee' | 'installee' | 'guide_ios' | 'guide_firefox';

/** Ce dont on se sert de `BeforeInstallPromptEvent` (Chromium ; absent des types du DOM). */
export interface InviteInstallation extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

export interface DependancesInstallation {
  readonly ecouter: (type: 'beforeinstallprompt' | 'appinstalled', ecouteur: (evenement: Event) => void) => void;
  /** `navigator.userAgent`. */
  readonly agent: string;
  /** `navigator.maxTouchPoints` : un iPad récent se présente comme un Mac. */
  readonly pointsTactiles: number;
  /** Ouvert depuis l'écran d'accueil : `display-mode` standalone, fullscreen ou minimal-ui, ou `navigator.standalone`. */
  readonly modeAppli: () => boolean;
  /** Clé du drapeau « installée » : une par adresse, car `localStorage` est commun à la version principale et aux versions de test. */
  readonly cle: string;
  /** Stockage de l'appareil (localStorage). */
  readonly lire: (cle: string) => string | null;
  readonly ecrire: (cle: string, valeur: string) => void;
}

export interface Installation {
  readonly etat: () => EtatInstallation;
  readonly abonner: (ecouteur: () => void) => () => void;
  /** Ouvre la boîte d'installation du navigateur. À appeler dans le geste du joueur : sans lui, le navigateur la refuse. */
  readonly proposer: () => void;
}

/** Début de la clé qui garde que l'appli est installée, pour ne plus l'expliquer là où aucun événement ne le dit. */
export const CLE_INSTALLATION = 'void-walker:installation';

/** Navigateurs d'iPhone qui ne sont pas Safari : leur menu porte d'autres noms (16 §3.1), l'aide ne les vise pas. */
const AUTRES_NAVIGATEURS_IOS = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|YaBrowser/;

export function estSafariIos(agent: string, pointsTactiles: number): boolean {
  const ios = /iPhone|iPad|iPod/.test(agent) || (agent.includes('Macintosh') && pointsTactiles > 1);
  return ios && /Safari\//.test(agent) && !AUTRES_NAVIGATEURS_IOS.test(agent);
}

export function estFirefoxAndroid(agent: string): boolean {
  return agent.includes('Android') && /Firefox\//.test(agent);
}

function dejaInstallee(lire: (cle: string) => string | null, cle: string): boolean {
  try {
    const brut: unknown = JSON.parse(lire(cle) ?? 'null');
    return typeof brut === 'object' && brut !== null && (brut as Record<string, unknown>)['installee'] === true;
  } catch {
    return false;
  }
}

/** Échec (navigation privée, quota) : sans conséquence, le drapeau n'est qu'un confort. */
function garderInstallee(ecrire: (cle: string, valeur: string) => void, cle: string): void {
  try {
    ecrire(cle, JSON.stringify({ installee: true }));
  } catch {
    // rien à faire
  }
}

export function piloterInstallation(dependances: DependancesInstallation): Installation {
  const { ecouter, agent, pointsTactiles, modeAppli, cle, lire, ecrire } = dependances;
  const enModeAppli = modeAppli();
  // Premier lancement depuis l'écran d'accueil : l'appli est installée, les onglets du navigateur n'ont plus à l'expliquer
  // (sur Android ; l'iPhone garde le stockage de l'appli à part).
  if (enModeAppli) garderInstallee(ecrire, cle);
  const guide: EtatInstallation = estSafariIos(agent, pointsTactiles) ? 'guide_ios' : estFirefoxAndroid(agent) ? 'guide_firefox' : 'indisponible';
  let etat: EtatInstallation = enModeAppli || dejaInstallee(lire, cle) ? 'indisponible' : guide;
  let invite: InviteInstallation | null = null;
  const ecouteurs = new Set<() => void>();
  // Lecture hors du rétrécissement de TypeScript : l'événement `appinstalled` change l'état pendant les `await`.
  const lireEtat = (): EtatInstallation => etat;

  const changer = (nouvel: EtatInstallation): void => {
    if (nouvel === etat) return;
    etat = nouvel;
    for (const ecouteur of ecouteurs) ecouteur();
  };

  // Un événement n'arrive que si l'appli est installable et pas encore installée : il l'emporte sur tout état gardé.
  ecouter('beforeinstallprompt', (evenement) => {
    if (enModeAppli) return;
    evenement.preventDefault();
    invite = evenement as InviteInstallation;
    changer('invite');
  });
  ecouter('appinstalled', () => {
    invite = null;
    garderInstallee(ecrire, cle);
    changer('installee');
  });

  async function demander(courante: InviteInstallation): Promise<void> {
    try {
      // `prompt()` part avant tout `await`, donc dans le geste du joueur.
      await courante.prompt();
      const { outcome } = await courante.userChoice;
      if (lireEtat() === 'installee') return;
      if (outcome === 'accepted') {
        garderInstallee(ecrire, cle);
        changer('installee');
      } else {
        changer('refusee');
      }
    } catch {
      changer('refusee');
    }
  }

  return {
    etat: lireEtat,
    abonner: (ecouteur) => {
      ecouteurs.add(ecouteur);
      return () => {
        ecouteurs.delete(ecouteur);
      };
    },
    proposer: () => {
      const courante = invite;
      if (courante === null || etat !== 'invite') return;
      // Un événement ne sert qu'une fois ; le navigateur en renverra un autre plus tard s'il le juge utile.
      invite = null;
      changer('en_cours');
      void demander(courante);
    },
  };
}
