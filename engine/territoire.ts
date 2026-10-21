import { hacher } from './hachage';
import type { DefLiaison, DefObjet, DefPiece } from './monde';

// Territoire de départ des grandes stations (spec créature mobile §territoire) : à l'assemblage, des portes s'ouvrent autour du
// repaire jusqu'à ce que la créature atteigne la part voulue de la station. Statique : aucun état de partie.

export interface PlanTerritoire {
  /** Pièces des morceaux et annexes. */
  readonly pieces: readonly DefPiece[];
  readonly objets: readonly DefObjet[];
  /** Toutes les liaisons, boucles comprises. */
  readonly liaisons: readonly DefLiaison[];
  readonly depart: string;
  readonly creature: string;
  readonly segments: ReadonlyMap<string, number>;
}

/** Pièces atteintes depuis le repaire par des liaisons ouvertes, ni étroites ni gouffre. */
function atteintes(creature: string, liaisons: readonly DefLiaison[]): Set<string> {
  const vues = new Set([creature]);
  for (let ajout = true; ajout; ) {
    ajout = false;
    for (const liaison of liaisons) {
      if (!liaison.ouverte || liaison.etroite === true || liaison.gouffre === true) continue;
      const [a, b] = liaison.entre;
      if (vues.has(a) === vues.has(b)) continue;
      vues.add(vues.has(a) ? b : a);
      ajout = true;
    }
  }
  return vues;
}

/** Morceau d'une pièce ou d'une liaison préfixée (`prefixer`) ; vide sans préfixe. */
const morceauDe = (id: string): string => id.slice(0, Math.max(id.indexOf('/'), 0));

/**
 * Porte intérieure d'un morceau : ses deux côtés et elle-même portent le même préfixe. Chaque morceau garde son énigme (D-293) ;
 * seules les portes entre morceaux, d'annexe et de boucle s'ouvrent, aucun morceau ne déclarant encore de porte ouvrable (spec
 * créature mobile §3.1).
 */
function interieureAuMorceau(liaison: DefLiaison): boolean {
  const morceau = morceauDe(liaison.id);
  return morceau !== '' && liaison.entre.every((piece) => morceauDe(piece) === morceau);
}

/** `plan.liaisons`, certaines passées à `ouverte: true` (jamais enfoncées : elles se referment) ; `etendue` de 0 à 1. */
export function ouvrirTerritoire(plan: PlanTerritoire, etendue: number, graine: number): DefLiaison[] {
  const pieces = new Map(plan.pieces.map((piece) => [piece.id, piece]));
  const passages = new Set(plan.objets.flatMap((objet) => (objet.obstacle === undefined ? [] : [objet.obstacle.passage])));
  const interieurs = new Set(plan.objets.flatMap((objet) => (objet.capsule === undefined ? [] : [objet.capsule.interieur])));
  const vitrees = new Set(plan.objets.flatMap((objet) => (objet.vitrageExterieur === true ? [objet.piece] : [])));
  const coteSur = (id: string): boolean => {
    const piece = pieces.get(id);
    // Une pièce sans segment connu reste du côté du départ : on n'y ouvre rien.
    return (
      id !== plan.depart &&
      (plan.segments.get(id) ?? 0) !== 0 &&
      piece !== undefined &&
      piece.feu !== true &&
      piece.froide !== true &&
      piece.machines !== true &&
      piece.gravite === undefined &&
      !vitrees.has(id)
    );
  };
  const eligible = (liaison: DefLiaison): boolean =>
    liaison.etroite !== true &&
    liaison.gouffre !== true &&
    liaison.blindee !== true &&
    liaison.verrouillee !== true &&
    liaison.nonEtanche !== true &&
    liaison.manoeuvre === undefined &&
    liaison.cachee === undefined &&
    liaison.haute === undefined &&
    !passages.has(liaison.id) &&
    !liaison.entre.some((piece) => interieurs.has(piece)) &&
    !interieureAuMorceau(liaison) &&
    liaison.entre.every(coteSur);

  const liaisons = [...plan.liaisons];
  const cible = Math.ceil(etendue * plan.pieces.length);
  for (let tour = 0, territoire = atteintes(plan.creature, liaisons); territoire.size < cible; tour++, territoire = atteintes(plan.creature, liaisons)) {
    const bord = liaisons
      .filter((liaison) => !liaison.ouverte && territoire.has(liaison.entre[0]) !== territoire.has(liaison.entre[1]) && eligible(liaison))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (bord.length === 0) break;
    const choisie = bord[Number.parseInt(hacher(`${graine}:${tour}`).slice(-8), 16) % bord.length]!;
    liaisons[liaisons.indexOf(choisie)] = { ...choisie, ouverte: true };
  }
  return liaisons;
}
