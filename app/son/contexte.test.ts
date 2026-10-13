import { annoncerTexte, sonDeFermeture, sonDuToucher } from './contexte';
import { SILENCE, type Son } from './moteur';
import type { Signal } from './recettes';

/** Élément touché, tel que `closest` le voit : son `data-son` ou celui d'un parent, ou rien. */
const touche = (son: string | null, tagName = 'SPAN') => ({
  tagName,
  closest: (selecteur: string) => (selecteur === '[data-son]' && son !== null ? { getAttribute: (nom: string) => (nom === 'data-son' ? son : null) } : null),
});

describe('son d’un toucher (15 §2.1, D-217)', () => {
  it('le data-son de l’élément touché ou de son plus proche parent', () => {
    expect(sonDuToucher(touche('confirmer', 'BUTTON'))).toBe('confirmer');
    expect(sonDuToucher(touche('panneau-carte'))).toBe('panneau-carte');
    expect(sonDuToucher(touche('fermer', 'DIV'))).toBe('fermer');
  });

  it('rien sans data-son, avec une valeur inconnue, ou sur un champ (l’étiquette d’un segment a déjà sonné)', () => {
    expect(sonDuToucher(touche(null))).toBeNull();
    expect(sonDuToucher(touche('tonnerre'))).toBeNull();
    expect(sonDuToucher(touche('clic', 'INPUT'))).toBeNull();
    for (const cible of [null, undefined, {}, 'clic', 42]) expect(sonDuToucher(cible)).toBeNull();
  });
});

describe('son d’Échap (D-226)', () => {
  /** Élément qui a le focus, dans une bulle marquée data-son-fermer, ou hors de toute bulle marquée. */
  const dans = (fermeture: string | null) => ({
    closest: (selecteur: string) => (selecteur === '[data-son-fermer]' && fermeture !== null ? { getAttribute: (nom: string) => (nom === 'data-son-fermer' ? fermeture : null) } : null),
  });

  it('le son de fermeture de la bulle qui a le focus ; le tic des bulles sinon', () => {
    expect(sonDeFermeture(dans('fermer-inventaire'))).toBe('fermer-inventaire');
    expect(sonDeFermeture(dans('fermer-carte'))).toBe('fermer-carte');
    expect(sonDeFermeture(dans(null))).toBe('fermer');
    expect(sonDeFermeture(dans('tonnerre'))).toBe('fermer');
    expect(sonDeFermeture(null)).toBe('fermer');
  });
});

describe('annonce d’un nouveau texte', () => {
  it('une seule fois par texte : double effet du mode strict, retour des options', () => {
    const recus: [boolean, readonly Signal[]][] = [];
    const espion: Son = { ...SILENCE, nouveauTexte: (ecriture, signaux) => recus.push([ecriture, signaux]) };
    const premier = {};
    const second = {};
    annoncerTexte(espion, premier, true, ['ia']);
    annoncerTexte(espion, premier, false, []);
    annoncerTexte(espion, second, false, ['soin']);
    expect(recus).toEqual([
      [true, ['ia']],
      [false, ['soin']],
    ]);
  });
});
