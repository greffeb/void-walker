import { generateurDepuisGraine, suivant } from './des';
import type { DefCle } from './station';

// Clés dispersées d'une grande station (spec 2026-10-18 §6.5) : un objet qui résout un obstacle peut attendre dans une pièce du
// catalogue plutôt que dans sa pièce d'origine. Les règles lisent étiquettes, segments et qualités, jamais un nom (D-078).

export interface CleAPoser {
  /** Objet préfixé. */
  readonly objet: string;
  readonly morceau: string;
  /** Pièce préfixée où le morceau le pose. */
  readonly origine: string;
  readonly cle: DefCle;
  /** Planche, caisse, bloc : une seule déplacée par station. */
  readonly encombrante: boolean;
  /** Ne va que là d'où on l'apporte à la capsule. */
  readonly large: boolean;
}

export interface PieceCandidate {
  readonly id: string;
  readonly etiquettes: readonly string[];
  readonly segment: number;
  /** Pièce du chemin principal d'où pend l'annexe, en remontant les couloirs du catalogue. */
  readonly racine: string;
}

/**
 * Pièce de chaque clé (son origine si elle ne bouge pas), sur la sous-graine 'cles' : tirage uniforme, dans l'ordre donné, entre
 * l'origine et les candidates d'une étiquette de la clé que `permise` accepte. Une pièce ne garde que des clés d'un même morceau ;
 * une seule clé encombrante est déplacée ; une clé large ne va que dans une pièce `apportable`.
 */
export function poserCles(
  cles: readonly CleAPoser[],
  candidates: readonly PieceCandidate[],
  permise: (cle: CleAPoser, candidate: PieceCandidate) => boolean,
  apportable: (piece: string) => boolean,
  graine: number,
): ReadonlyMap<string, string> {
  let alea = generateurDepuisGraine(graine);
  const tirer = (faces: number): number => {
    const tirage = suivant(alea);
    alea = tirage.etat;
    return Math.floor((tirage.valeur / 4294967296) * faces);
  };
  const occupees = new Map<string, string>();
  const poses = new Map<string, string>();
  let encombranteDeplacee = false;
  for (const cle of cles) {
    const libres =
      cle.encombrante && encombranteDeplacee ? []
      : candidates.filter(
          (candidate) =>
            candidate.etiquettes.some((etiquette) => cle.cle.etiquettes.includes(etiquette)) &&
            permise(cle, candidate) &&
            (occupees.get(candidate.id) ?? cle.morceau) === cle.morceau &&
            (!cle.large || apportable(candidate.id)),
        );
    const piece = [cle.origine, ...libres.map((candidate) => candidate.id)][tirer(libres.length + 1)] ?? cle.origine;
    poses.set(cle.objet, piece);
    if (piece === cle.origine) continue;
    occupees.set(piece, cle.morceau);
    encombranteDeplacee ||= cle.encombrante;
  }
  return poses;
}
