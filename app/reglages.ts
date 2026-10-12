// Réglages d'affichage, gardés sur l'appareil hors de la sauvegarde de partie (12 §4.10, D-186).

/** Taille du texte : récit à 17, 19 ou 22 px, le reste à proportion (12 §4.10). */
export const TAILLES = ['standard', 'grande', 'tres_grande'] as const;
export type Taille = (typeof TAILLES)[number];

export interface Reglages {
  readonly taille: Taille;
  /** « Lignes de balayage » [OUI] / [NON] (12 §2.3). */
  readonly balayage: boolean;
  /** « Effet machine à écrire » [OUI] / [NON]. */
  readonly machineAEcrire: boolean;
}

export const CLE_REGLAGES = 'void-walker:reglages';

export const REGLAGES_PAR_DEFAUT: Reglages = { taille: 'standard', balayage: true, machineAEcrire: true };

/** Réglages enregistrés ; un réglage illisible ou absent prend sa valeur par défaut. */
export function lireReglages(lire: (cle: string) => string | null): Reglages {
  try {
    const brut: unknown = JSON.parse(lire(CLE_REGLAGES) ?? 'null');
    if (typeof brut !== 'object' || brut === null) return REGLAGES_PAR_DEFAUT;
    const { taille, balayage, machineAEcrire } = brut as Record<string, unknown>;
    return {
      taille: TAILLES.find((connue) => connue === taille) ?? REGLAGES_PAR_DEFAUT.taille,
      balayage: balayage !== false,
      machineAEcrire: machineAEcrire !== false,
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
