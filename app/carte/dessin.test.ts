import { pointsTrace, rectCapsule, segmentOuverture } from './dessin';

describe('dessin du plan (14 §2.6)', () => {
  const salle = { x: 6, y: 6, largeur: 4, hauteur: 3 };

  it('capsule arrimée dehors, contre son pan de coque, centrée, trois cases au plus', () => {
    expect(rectCapsule(salle, { cote: 'bas', debut: 6, fin: 10 })).toEqual({ x: 6, y: 9, largeur: 3, hauteur: 2 });
    expect(rectCapsule(salle, { cote: 'droite', debut: 6, fin: 9 })).toEqual({ x: 10, y: 6, largeur: 2, hauteur: 3 });
    expect(rectCapsule(salle, { cote: 'haut', debut: 7, fin: 9 })).toEqual({ x: 7, y: 4, largeur: 2, hauteur: 2 });
    expect(rectCapsule(salle, { cote: 'gauche', debut: 6, fin: 8 })).toEqual({ x: 4, y: 6, largeur: 2, hauteur: 2 });
  });

  it('une ouverture occupe le milieu de sa case de mur', () => {
    expect(segmentOuverture({ type: 'mur', axe: 'v', ligne: 4, rang: 1 })).toEqual({ x1: 4, y1: 1.25, x2: 4, y2: 1.75 });
    expect(segmentOuverture({ type: 'mur', axe: 'h', ligne: 3, rang: 5 })).toEqual({ x1: 5.25, y1: 3, x2: 5.75, y2: 3 });
  });

  it('un conduit passe par le centre de ses cases', () => {
    expect(pointsTrace([{ x: 2, y: 0 }, { x: 3, y: 0 }])).toEqual([
      [2.5, 0.5],
      [3.5, 0.5],
    ]);
  });
});
