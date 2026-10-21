import { hacher } from './hachage';

// Dé de rencontre de la créature mobile (spec créature mobile §rencontre) : tous les `rythme` actions, une face de dé décide de ce que
// fait la créature. Le tirage ne lit que la graine de partie et le numéro d'action : rien n'entre au journal, ni la preuve, ni le
// rejeu, ni la sauvegarde ne changent.

/** Normal ; seuil à mesurer. */
export const RYTHME_RENCONTRE = 3;
export const FACES_RENCONTRE = 6;

function entier32(clef: string): number {
  return Number.parseInt(hacher(clef).slice(-8), 16);
}

/** Face du dé (1 à 6) à cette action, ou null hors du rythme. */
export function faceRencontre(graine: number, action: number, rythme: number): number | null {
  if (action % rythme !== 0) return null;
  return 1 + (entier32(`rencontre:${graine}:${action}`) % FACES_RENCONTRE);
}

/** Entier 32 bits pour choisir parmi les pièces voisines quand la créature erre. */
export function tirageErrance(graine: number, action: number): number {
  return entier32(`errance:${graine}:${action}`);
}
