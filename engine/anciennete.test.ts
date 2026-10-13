import { LONGTEMPS, palier } from './anciennete';

describe('ancienneté en paliers (D-151, 14 §3.2)', () => {
  it('une action au plus : à l’instant ; deux à cinq : un moment ; six et plus : longtemps', () => {
    expect([0, 1, 2, 5, 6, 40].map(palier)).toEqual(['instant', 'instant', 'moment', 'moment', 'longtemps', 'longtemps']);
    expect(LONGTEMPS).toBe(6);
  });
});
