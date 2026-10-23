import type { CasePlan, EmplacementPassage, PanCoque, RectPlan } from '../../engine';

// Géométrie de dessin du plan, en cases (14 §2.6) : la même pour le rendu d'auteur des plans (tools) et pour l'écran de la carte.

/** Profondeur de la capsule arrimée dehors, en cases : elle tient dans les quatre cases libres de la coque (PL-05). */
export const PROFONDEUR_CAPSULE = 2;

/** Capsule arrimée contre le pan de coque de sa salle : trois cases de long au plus, centrée sur le pan (14 §2.6). */
export function rectCapsule(piece: RectPlan, pan: PanCoque): RectPlan {
  const longueur = Math.min(3, pan.fin - pan.debut);
  const debut = pan.debut + Math.floor((pan.fin - pan.debut - longueur) / 2);
  switch (pan.cote) {
    case 'haut':
      return { x: debut, y: piece.y - PROFONDEUR_CAPSULE, largeur: longueur, hauteur: PROFONDEUR_CAPSULE };
    case 'bas':
      return { x: debut, y: piece.y + piece.hauteur, largeur: longueur, hauteur: PROFONDEUR_CAPSULE };
    case 'gauche':
      return { x: piece.x - PROFONDEUR_CAPSULE, y: debut, largeur: PROFONDEUR_CAPSULE, hauteur: longueur };
    case 'droite':
      return { x: piece.x + piece.largeur, y: debut, largeur: PROFONDEUR_CAPSULE, hauteur: longueur };
  }
}

/** Demi-largeur d'une porte sur l'écran de la carte, en cases : plus large que les tirets, pour se voir au dézoom. */
export const DEMI_PORTE = 0.32;

/** Segment d'une ouverture dans son mur, en cases : par défaut la moitié centrale de sa case. */
export function segmentOuverture(ouverture: Extract<EmplacementPassage, { type: 'mur' }>, demi = 0.25): { x1: number; y1: number; x2: number; y2: number } {
  const debut = ouverture.rang + 0.5 - demi;
  const fin = ouverture.rang + 0.5 + demi;
  return ouverture.axe === 'v'
    ? { x1: ouverture.ligne, y1: debut, x2: ouverture.ligne, y2: fin }
    : { x1: debut, y1: ouverture.ligne, x2: fin, y2: ouverture.ligne };
}

/** Points d'un conduit tracé : le centre de chacune de ses cases. */
export function pointsTrace(cases: readonly CasePlan[]): (readonly [number, number])[] {
  return cases.map((etape) => [etape.x + 0.5, etape.y + 0.5] as const);
}
