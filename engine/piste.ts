import { generateurDepuisGraine, suivant } from './des';
import type { IntensiteTrace } from './monde';

// Piste de la créature dans une grande station (spec 2026-10-18 §5.4) : le trajet qu'elle a pris, d'une origine jusqu'à sa place
// de départ, le repaire. Chaque pièce de la piste porte une trace, forte près du repaire, légère au-delà ; les autres n'en ont
// aucune. Le signe dit vrai (« elle est passée par ici ») sans tout dire : une pièce calme n'est pas une pièce sûre.

/** Longueur de la piste, en portes, entre l'origine et le repaire. */
export const PISTE_MIN = 3;
export const PISTE_MAX = 6;
/** Une trace est forte à deux portes ou moins du repaire. */
export const TRACE_FORTE = 2;

/**
 * Intensité de trace par pièce de la piste. L'origine porte l'étiquette « origine » si une telle pièce est à la bonne distance,
 * sinon toute autre pièce à cette distance, hors départ ; la piste est un plus court chemin jusqu'au repaire, tiré par la graine
 * parmi les plus courts. Le départ n'est jamais marqué.
 */
export function tracerPiste(
  pieces: readonly { readonly id: string; readonly etiquettes?: readonly string[] }[],
  liaisons: readonly (readonly [string, string])[],
  depart: string,
  repaire: string,
  graine: number,
): ReadonlyMap<string, IntensiteTrace> {
  let etat = generateurDepuisGraine(graine);
  const tirer = (faces: number): number => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return Math.floor((tirage.valeur / 4294967296) * faces);
  };
  const voisins = new Map<string, string[]>();
  for (const [a, b] of liaisons) {
    voisins.set(a, [...(voisins.get(a) ?? []), b]);
    voisins.set(b, [...(voisins.get(b) ?? []), a]);
  }
  const auRepaire = new Map([[repaire, 0]]);
  const file = [repaire];
  for (let tete = 0; tete < file.length; tete++) {
    const piece = file[tete];
    if (piece === undefined) break;
    for (const autre of voisins.get(piece) ?? []) {
      if (!auRepaire.has(autre)) {
        auRepaire.set(autre, (auRepaire.get(piece) ?? 0) + 1);
        file.push(autre);
      }
    }
  }
  const distance = (piece: string): number => auRepaire.get(piece) ?? Infinity;
  const possibles = pieces.filter(({ id }) => id !== depart && id !== repaire && distance(id) <= PISTE_MAX);
  const aBonneDistance = possibles.filter(({ id }) => distance(id) >= PISTE_MIN);
  const etiquetees = aBonneDistance.filter(({ etiquettes }) => etiquettes?.includes('origine') === true);
  // Sans pièce à bonne distance, la plus éloignée de celles qui restent : une piste courte vaut mieux qu'aucune.
  const plusLoin = Math.max(-1, ...possibles.map(({ id }) => distance(id)));
  const parmi = etiquetees.length > 0 ? etiquetees : aBonneDistance.length > 0 ? aBonneDistance : possibles.filter(({ id }) => distance(id) === plusLoin);
  const piste = new Map<string, IntensiteTrace>();
  const marquer = (piece: string): void => {
    if (piece !== depart) piste.set(piece, distance(piece) <= TRACE_FORTE ? 'forte' : 'legere');
  };
  let courante = parmi[tirer(parmi.length)]?.id ?? repaire;
  marquer(courante);
  while (courante !== repaire) {
    const plusPres = (voisins.get(courante) ?? []).filter((autre) => distance(autre) === distance(courante) - 1);
    courante = plusPres[tirer(plusPres.length)] ?? repaire;
    marquer(courante);
  }
  return piste;
}
