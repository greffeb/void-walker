// Durée d'une partie (#204, D-280) : seul le temps d'écran allumé compte, du réveil à la fin, options ouvertes en cours de
// partie comprises. Gardée sur l'appareil à côté de la partie, hors de la sauvegarde, et jointe aux rapports.

/** Le minuteur de la page compte le temps à ce rythme et le garde sur l'appareil. */
export const BATTEMENT_MS = 5_000;
/** Un écart plus long entre deux comptes est une absence (appareil endormi sans que la page l'ait dit) : il ne compte pas. */
export const ABSENCE_MS = 15_000;
export const CLE_DUREE = 'void-walker:duree';

/** Ce que le chronomètre lit d'une partie : qui elle est, et si elle a déjà commencé. */
export interface PartieChronometree {
  readonly enregistrement: { readonly monde: string; readonly graine: number };
  readonly etat: { readonly actions: number };
}

export interface DependancesChronometre {
  /** Une clé par adresse : chaque version publiée a sa partie, donc sa durée. */
  readonly cle: string;
  readonly lire: (cle: string) => string | null;
  readonly ecrire: (cle: string, valeur: string) => void;
  /** Horloge monotone, en ms. */
  readonly maintenant: () => number;
  /** Page visible au lancement. */
  readonly visible: boolean;
}

export interface Chronometre {
  /** Partie à l'écran, dont le temps court ; `null` : aucune (accueil, fin de partie). */
  suivre(partie: PartieChronometree | null): void;
  /** L'écran s'éteint, l'onglet passe en arrière-plan ou l'appli est quittée. */
  cacher(): void;
  montrer(): void;
  /** Battement du minuteur : compte le temps écoulé et le garde. */
  battre(): void;
  /** Durée de cette partie en secondes ; `null` si elle n'a pas été mesurée depuis son début. */
  secondes(partie: PartieChronometree): number | null;
}

interface Duree {
  readonly monde: string;
  readonly graine: number;
  ms: number;
}

const meme = (duree: Duree, partie: PartieChronometree): boolean =>
  duree.monde === partie.enregistrement.monde && duree.graine === partie.enregistrement.graine;

export function creerChronometre(dependances: DependancesChronometre): Chronometre {
  const { cle, maintenant } = dependances;
  let visible = dependances.visible;
  /** Durée de la dernière partie suivie ; `null` si elle n'est pas mesurée. */
  let suivie: Duree | null = null;
  let partieAffichee: PartieChronometree | null = null;
  /** Dernier instant compté, tant que le temps court. */
  let depuis: number | null = null;

  const lireGardee = (partie: PartieChronometree): Duree | null => {
    try {
      const brut: unknown = JSON.parse(dependances.lire(cle) ?? 'null');
      if (typeof brut !== 'object' || brut === null) return null;
      const { monde, graine, ms } = brut as Record<string, unknown>;
      if (typeof monde !== 'string' || typeof graine !== 'number' || typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return null;
      const gardee = { monde, graine, ms };
      return meme(gardee, partie) ? gardee : null;
    } catch {
      return null;
    }
  };

  const garder = (): void => {
    if (suivie === null) return;
    try {
      dependances.ecrire(cle, JSON.stringify(suivie));
    } catch {
      // Navigation privée ou quota : la durée compte encore pendant la session.
    }
  };

  const compter = (): void => {
    if (depuis === null) return;
    const instant = maintenant();
    const ecart = instant - depuis;
    if (suivie !== null && ecart >= 0 && ecart <= ABSENCE_MS) suivie.ms += ecart;
    depuis = instant;
  };

  const courir = (): void => {
    depuis = visible && partieAffichee !== null ? (depuis ?? maintenant()) : null;
  };

  return {
    suivre(partie) {
      compter();
      garder();
      if (partie !== null && (suivie === null || !meme(suivie, partie))) {
        // Une partie déjà commencée sans durée gardée n'a pas de début mesuré : elle n'est pas mesurée du tout.
        suivie = lireGardee(partie) ?? (partie.etat.actions === 0 ? { monde: partie.enregistrement.monde, graine: partie.enregistrement.graine, ms: 0 } : null);
        garder();
      }
      partieAffichee = partie;
      courir();
    },
    cacher() {
      compter();
      visible = false;
      courir();
      garder();
    },
    montrer() {
      visible = true;
      courir();
    },
    battre() {
      compter();
      garder();
    },
    secondes(partie) {
      compter();
      const duree = suivie !== null && meme(suivie, partie) ? suivie : lireGardee(partie);
      return duree === null ? null : Math.round(duree.ms / 1000);
    },
  };
}
