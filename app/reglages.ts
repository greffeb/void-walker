// Réglages d'affichage, gardés sur l'appareil hors de la sauvegarde de partie (12 §4.10, D-186).

export interface Reglages {
  /** « Effet machine à écrire » [OUI] / [NON]. */
  readonly machineAEcrire: boolean;
}

export const CLE_REGLAGES = 'void-walker:reglages';

const PAR_DEFAUT: Reglages = { machineAEcrire: true };

/** Réglages enregistrés ; illisibles ou absents, ceux par défaut. */
export function lireReglages(lire: (cle: string) => string | null): Reglages {
  try {
    const brut: unknown = JSON.parse(lire(CLE_REGLAGES) ?? 'null');
    if (typeof brut !== 'object' || brut === null) return PAR_DEFAUT;
    return { machineAEcrire: !('machineAEcrire' in brut) || brut.machineAEcrire !== false };
  } catch {
    return PAR_DEFAUT;
  }
}
