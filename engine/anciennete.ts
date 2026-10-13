import type { Palier } from './vocabulaire';

// Ancienneté d'un regard (D-151, 14 §3.2) : la même pour la dernière vue de la créature et pour la carte.

/** Seuil de « il y a longtemps », en actions confirmées. */
export const LONGTEMPS = 6;

/** 1 action au plus : à l'instant ; 2 à 5 : il y a un moment ; 6 et plus : il y a longtemps. */
export function palier(ecart: number): Palier {
  if (ecart <= 1) return 'instant';
  return ecart < LONGTEMPS ? 'moment' : 'longtemps';
}
