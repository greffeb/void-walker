import { chevauchent, cleCase, murCommun, ouvertureVers, panLibre, rangParDefaut, videsEnfermes, type RectPlan } from './plan';

// Géométrie du plan de pont (docs/14-carte.md §4) : y croît vers le bas, comme à l'écran.

const r = (x: number, y: number, largeur: number, hauteur: number): RectPlan => ({ x, y, largeur, hauteur });

describe('géométrie du plan (14 §4.1)', () => {
  it('deux pièces côte à côte ont un mur commun, dans un sens comme dans l’autre ; un coin ou un écart ne suffit pas', () => {
    expect(murCommun(r(0, 0, 4, 3), r(4, 1, 3, 3))).toEqual({ axe: 'v', ligne: 4, debut: 1, fin: 3 });
    expect(murCommun(r(4, 1, 3, 3), r(0, 0, 4, 3))).toEqual({ axe: 'v', ligne: 4, debut: 1, fin: 3 });
    expect(murCommun(r(0, 0, 4, 3), r(1, 3, 2, 2))).toEqual({ axe: 'h', ligne: 3, debut: 1, fin: 3 });
    expect(murCommun(r(0, 0, 2, 2), r(2, 2, 2, 2))).toBeNull();
    expect(murCommun(r(0, 0, 2, 2), r(3, 0, 2, 2))).toBeNull();
  });

  it('la porte se place au milieu du mur commun, côté début quand il a un nombre pair de cases', () => {
    expect(rangParDefaut({ axe: 'v', ligne: 4, debut: 0, fin: 3 })).toBe(1);
    expect(rangParDefaut({ axe: 'h', ligne: 3, debut: 4, fin: 8 })).toBe(5);
    expect(rangParDefaut({ axe: 'h', ligne: 6, debut: 8, fin: 10 })).toBe(8);
  });

  it('chevauchement : une case partagée suffit ; un mur partagé ne compte pas (PL-01)', () => {
    expect(chevauchent(r(0, 0, 3, 3), r(2, 2, 3, 3))).toBe(true);
    expect(chevauchent(r(0, 0, 3, 3), r(3, 0, 3, 3))).toBe(false);
  });

  it('ouverture dans le mur d’une pièce vers une case voisine ; rien vers un coin', () => {
    const piece = r(2, 2, 3, 2);
    expect(ouvertureVers(piece, { x: 1, y: 3 })).toEqual({ type: 'mur', axe: 'v', ligne: 2, rang: 3 });
    expect(ouvertureVers(piece, { x: 5, y: 2 })).toEqual({ type: 'mur', axe: 'v', ligne: 5, rang: 2 });
    expect(ouvertureVers(piece, { x: 3, y: 1 })).toEqual({ type: 'mur', axe: 'h', ligne: 2, rang: 3 });
    expect(ouvertureVers(piece, { x: 4, y: 4 })).toEqual({ type: 'mur', axe: 'h', ligne: 4, rang: 4 });
    expect(ouvertureVers(piece, { x: 1, y: 1 })).toBeNull();
    expect(ouvertureVers(piece, { x: 3, y: 3 })).toBeNull();
  });

  it('vide enfermé : une cour entourée de pièces est refusée case par case ; un renfoncement ouvert passe (PL-03)', () => {
    const haut = r(0, 0, 6, 2);
    const gauche = r(0, 2, 2, 2);
    const droite = r(4, 2, 2, 2);
    const bas = r(0, 4, 6, 2);
    expect(videsEnfermes([haut, gauche, droite, bas])).toEqual([
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ]);
    expect(videsEnfermes([haut, gauche, bas])).toEqual([]);
    expect(videsEnfermes([])).toEqual([]);
  });

  it('pan de coque : le plus long, d’au moins deux cases, avec quatre cases libres devant ; à égalité, haut, droite, bas, gauche (PL-05)', () => {
    const piece = r(0, 0, 4, 3);
    expect(panLibre(piece, new Set())).toEqual({ cote: 'haut', debut: 0, fin: 4 });
    const voisins = new Set([cleCase(0, -1), cleCase(1, -1), cleCase(2, -1), cleCase(3, -1), cleCase(4, 0), cleCase(4, 1), cleCase(4, 2)]);
    expect(panLibre(piece, voisins)).toEqual({ cote: 'bas', debut: 0, fin: 4 });
    // Une case occupée à quatre cases de profondeur coupe encore le pan.
    const loin = new Set([cleCase(0, -4), cleCase(5, 1), cleCase(1, 5), cleCase(-4, 0)]);
    expect(panLibre(r(0, 0, 2, 2), loin)).toBeNull();
    loin.delete(cleCase(-4, 0));
    expect(panLibre(r(0, 0, 2, 2), loin)).toEqual({ cote: 'gauche', debut: 0, fin: 2 });
  });
});
