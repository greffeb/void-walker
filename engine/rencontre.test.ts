import { faceRencontre, tirageErrance } from './rencontre';

describe('dé de rencontre', () => {
  it('hors du rythme, pas de jet', () => {
    expect(faceRencontre(7, 4, 3)).toBeNull();
  });
  it('même graine, même action : même face', () => {
    expect(faceRencontre(7, 6, 3)).toBe(faceRencontre(7, 6, 3));
  });
  it('les six faces sortent à peu près autant', () => {
    const comptes = [0, 0, 0, 0, 0, 0];
    for (let action = 1; action <= 6000; action++) {
      const face = (faceRencontre(11, action, 1) ?? 1) - 1;
      comptes[face] = (comptes[face] ?? 0) + 1;
    }
    for (const compte of comptes) expect(compte).toBeGreaterThan(850);
  });
  it('le tirage d’errance est un entier stable', () => {
    expect(tirageErrance(7, 6)).toBe(tirageErrance(7, 6));
    expect(Number.isInteger(tirageErrance(7, 6))).toBe(true);
  });
});
