import { generateurDepuisGraine, suivant } from './des';
import { murCommun, PORTES_MAX, type RectPlan } from './plan';

// Portes de boucle d'une grande station (spec 2026-10-18 §6.4, GE-13) : une à trois portes ordinaires entre deux pièces qui se
// touchent, pour tourner autour d'un bloc de pièces pendant une poursuite. Jamais à travers un obstacle (même segment), jamais
// sur une impasse ni sur la pièce de la créature, et seulement si elles ferment un cycle d'au moins quatre pièces : dans un
// triangle, elle entend les pas et entre directement.

export interface PieceBouclable {
  /** Pièce préfixée. */
  readonly id: string;
  readonly rect: RectPlan;
  readonly segment: number;
  /** Couloir ou passage du catalogue, ou pièce accueillante d'un morceau ; faux pour une impasse ou une autre pièce. */
  readonly bouclable: boolean;
}

export interface BouclePosee {
  readonly id: string;
  readonly entre: readonly [string, string];
  /** Case de la porte sur le mur commun (GE-01). */
  readonly rang: number;
}

/** Mur commun minimal d'une porte (14 §5.2). */
const MUR_MIN = 2;
/** Plus court chemin existant, en liaisons, entre les deux pièces : trois au moins, soit un cycle de quatre pièces. */
const CHEMIN_MIN = 3;

/** Nombre de liaisons du plus court chemin entre deux pièces ; `Infinity` si elles ne se rejoignent pas. */
function distance(voisins: ReadonlyMap<string, readonly string[]>, de: string, vers: string): number {
  const distances = new Map([[de, 0]]);
  const file = [de];
  for (let tete = 0; tete < file.length; tete++) {
    const piece = file[tete];
    if (piece === undefined) break;
    if (piece === vers) return distances.get(piece) ?? Infinity;
    for (const autre of voisins.get(piece) ?? []) {
      if (!distances.has(autre)) {
        distances.set(autre, (distances.get(piece) ?? 0) + 1);
        file.push(autre);
      }
    }
  }
  return Infinity;
}

/**
 * Portes de boucle posées, au plus `voulues`, d'abord dans le segment de la créature, puis dans les segments voisins, puis
 * ailleurs ; aucune si rien ne convient. `liaisons` : le graphe complet, annexes comprises ; `portes` : portes déjà posées.
 */
export function poserBoucles(
  pieces: readonly PieceBouclable[],
  liaisons: readonly (readonly [string, string])[],
  portes: ReadonlyMap<string, number>,
  repaire: string,
  voulues: number,
  graine: number,
): readonly BouclePosee[] {
  let etat = generateurDepuisGraine(graine);
  const tirer = (faces: number): number => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return Math.floor((tirage.valeur / 4294967296) * faces);
  };
  const melanger = <T>(liste: readonly T[]): T[] => {
    const reste = [...liste];
    const melange: T[] = [];
    while (reste.length > 0) melange.push(...reste.splice(tirer(reste.length), 1));
    return melange;
  };

  const voisins = new Map<string, string[]>();
  const relier = (a: string, b: string): void => {
    voisins.set(a, [...(voisins.get(a) ?? []), b]);
    voisins.set(b, [...(voisins.get(b) ?? []), a]);
  };
  for (const [a, b] of liaisons) relier(a, b);
  const nbPortes = new Map(portes);
  const segmentRepaire = pieces.find((piece) => piece.id === repaire)?.segment;

  const candidates = pieces
    .filter((piece) => piece.bouclable && piece.id !== repaire)
    .flatMap((a, rang, liste) => liste.slice(rang + 1).filter((b) => b.segment === a.segment).map((b) => [a, b] as const))
    .filter(([a, b]) => {
      const mur = murCommun(a.rect, b.rect);
      return mur !== null && mur.fin - mur.debut >= MUR_MIN;
    });
  const ecartAuRepaire = (segment: number): number => (segmentRepaire === undefined ? 2 : Math.min(Math.abs(segment - segmentRepaire), 2));
  const ordonnees = [0, 1, 2].flatMap((ecart) => melanger(candidates.filter(([a]) => ecartAuRepaire(a.segment) === ecart)));

  const posees: BouclePosee[] = [];
  for (const [a, b] of ordonnees) {
    if (posees.length >= voulues) break;
    if ((nbPortes.get(a.id) ?? 0) >= PORTES_MAX || (nbPortes.get(b.id) ?? 0) >= PORTES_MAX) continue;
    if ((voisins.get(a.id) ?? []).includes(b.id) || distance(voisins, a.id, b.id) < CHEMIN_MIN) continue;
    const mur = murCommun(a.rect, b.rect);
    if (mur === null) continue;
    posees.push({ id: `l-boucle-${posees.length + 1}`, entre: [a.id, b.id], rang: mur.debut + tirer(mur.fin - mur.debut) });
    relier(a.id, b.id);
    nbPortes.set(a.id, (nbPortes.get(a.id) ?? 0) + 1);
    nbPortes.set(b.id, (nbPortes.get(b.id) ?? 0) + 1);
  }
  return posees;
}
