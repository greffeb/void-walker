// Réglages d'affichage et de son, gardés sur l'appareil hors de la sauvegarde de partie (12 §4.10, D-186, D-220).

/** Taille du texte : récit à 17, 19 ou 22 px, le reste à proportion (12 §4.10). */
export const TAILLES = ['standard', 'grande', 'tres_grande'] as const;
export type Taille = (typeof TAILLES)[number];

export interface Reglages {
  readonly taille: Taille;
  /** « Lignes de balayage » [OUI] / [NON] (12 §2.3). */
  readonly balayage: boolean;
  /** « Effet machine à écrire » [OUI] / [NON]. */
  readonly machineAEcrire: boolean;
  /** Rails du son, de 0 à 100 (15 §4, D-220, D-223). */
  readonly general: number;
  readonly effets: number;
  readonly ambiance: number;
  /** Carte révélée : toute la station et la créature ; lu seulement dans une version de test (PR). */
  readonly carteRevelee: boolean;
}

export const CLE_REGLAGES = 'void-walker:reglages';

export const REGLAGES_PAR_DEFAUT: Reglages = { taille: 'standard', balayage: true, machineAEcrire: true, general: 80, effets: 80, ambiance: 60, carteRevelee: false };

/** Niveau de 0 à 100, arrondi ; illisible : sa valeur par défaut. */
function niveau(valeur: unknown, defaut: number): number {
  return typeof valeur === 'number' && Number.isFinite(valeur) ? Math.round(Math.min(100, Math.max(0, valeur))) : defaut;
}

/** Réglages enregistrés ; un réglage illisible ou absent prend sa valeur par défaut. */
export function lireReglages(lire: (cle: string) => string | null): Reglages {
  try {
    const brut: unknown = JSON.parse(lire(CLE_REGLAGES) ?? 'null');
    if (typeof brut !== 'object' || brut === null) return REGLAGES_PAR_DEFAUT;
    const { taille, balayage, machineAEcrire, general, effets, ambiance, carteRevelee } = brut as Record<string, unknown>;
    return {
      taille: TAILLES.find((connue) => connue === taille) ?? REGLAGES_PAR_DEFAUT.taille,
      balayage: balayage !== false,
      machineAEcrire: machineAEcrire !== false,
      general: niveau(general, REGLAGES_PAR_DEFAUT.general),
      effets: niveau(effets, REGLAGES_PAR_DEFAUT.effets),
      ambiance: niveau(ambiance, REGLAGES_PAR_DEFAUT.ambiance),
      carteRevelee: carteRevelee === true,
    };
  } catch {
    return REGLAGES_PAR_DEFAUT;
  }
}

/** Garde les réglages sur l'appareil ; `false` si le navigateur refuse (navigation privée, quota). */
export function ecrireReglages(ecrire: (cle: string, valeur: string) => void, reglages: Reglages): boolean {
  try {
    ecrire(CLE_REGLAGES, JSON.stringify(reglages));
    return true;
  } catch {
    return false;
  }
}
