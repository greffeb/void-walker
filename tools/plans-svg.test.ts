import { MONDES, type EntreeMonde } from '../content';
import { dessinerPlan } from './plans-svg';

const AR01 = MONDES['ar-01'] as EntreeMonde;

describe('rendu d’auteur des plans (14 §4.3)', () => {
  it('dessine chaque pièce avec son nom en capitales, chaque ouverture et la capsule dehors ; jamais la cabine', () => {
    const svg = dessinerPlan(AR01);
    expect(svg.startsWith('<svg')).toBe(true);
    for (const ligne of ['SALON DE', 'TRANSIT', 'LOCAL ÉNERGIE', 'D’EMBARQUEMENT']) expect(svg).toContain(`>${ligne}</text>`);
    expect(svg).not.toContain('CABINE DE LA CAPSULE');
    // Fond, six pièces, une capsule.
    expect(svg.match(/<rect /g)).toHaveLength(8);
    // Sept ouvertures, et des tirets pour la grille et le panneau.
    expect(svg.match(/<line /g)).toHaveLength(9);
    expect(svg).not.toMatch(/NaN|undefined/);
  });

  it('refuse un monde sans plan', () => {
    const sansPlan = { ...AR01, monde: { ...AR01.monde, pieces: AR01.monde.pieces.map((piece) => ({ id: piece.id, nom: piece.nom })) } };
    expect(() => dessinerPlan(sansPlan)).toThrow('aucun plan');
  });
});
