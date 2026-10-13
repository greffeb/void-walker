import { choisirGenre, dureeCarlingue, frottement, GENRES, intervalle, POIDS, tirerCarlingue, type Carlingue, type Genre } from './carlingue';

function lcg(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (Math.imul(etat, 1664525) + 1013904223) >>> 0;
    return etat / 2 ** 32;
  };
}

const dans = (valeur: number, min: number, max: number): void => {
  expect(valeur).toBeGreaterThanOrEqual(min - 1e-9);
  expect(valeur).toBeLessThanOrEqual(max + 1e-9);
};

describe('carlingue qui travaille (15 §3.4, D-219)', () => {
  it('genre pondéré : gémissement 2, craquement 2, pression 2, gong 1', () => {
    expect(POIDS).toEqual({ gemissement: 2, craquement: 2, pression: 2, gong: 1 });
    expect(choisirGenre(() => 0)).toBe('gemissement');
    expect(choisirGenre(() => 2 / 7 - 1e-6)).toBe('gemissement');
    expect(choisirGenre(() => 2 / 7 + 1e-6)).toBe('craquement');
    expect(choisirGenre(() => 4 / 7 + 1e-6)).toBe('pression');
    expect(choisirGenre(() => 6 / 7 + 1e-6)).toBe('gong');
    expect(choisirGenre(() => 0.999999)).toBe('gong');
    const comptes: Record<Genre, number> = { gemissement: 0, craquement: 0, pression: 0, gong: 0 };
    const hasard = lcg(7);
    for (let tirage = 0; tirage < 7000; tirage += 1) comptes[choisirGenre(hasard)] += 1;
    dans(comptes.gong / 7000, 0.12, 0.165);
    for (const genre of ['gemissement', 'craquement', 'pression'] as const) dans(comptes[genre] / 7000, 0.26, 0.31);
  });

  it('un craquement toutes les 20 à 60 s', () => {
    expect(intervalle(() => 0)).toBe(20);
    expect(intervalle(() => 0.5)).toBe(40);
    const hasard = lcg(3);
    const tirages = Array.from({ length: 10000 }, () => intervalle(hasard));
    for (const secondes of tirages) dans(secondes, 20, 60);
    expect(Math.min(...tirages)).toBeLessThan(22);
    expect(Math.max(...tirages)).toBeGreaterThan(58);
  });

  it('frottement : une impulsion par intervalle de 1 / cadence × (0,7 à 1,3), amplitude de 0,4 à 1', () => {
    const fixes = frottement(0.95, () => 10, () => 0.5);
    expect(fixes.map((impulsion) => Number(impulsion.t.toFixed(6)))).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    for (const impulsion of fixes) expect(impulsion.amp).toBeCloseTo(0.7);
    // Cadence trop basse : bornée à 0,5 impulsion par seconde.
    expect(frottement(3, () => 0, () => 0.5).map((impulsion) => impulsion.t)).toEqual([0, 2]);
  });

  it('chaque son tiré reste dans ses bornes et dure moins de 6 s (15 §3.4, §7)', { timeout: 30_000 }, () => {
    const hasard = lcg(11);
    const vus = new Set<Genre>();
    for (let tirage = 0; tirage < 2000; tirage += 1) {
      const son: Carlingue = tirerCarlingue(hasard);
      vus.add(son.genre);
      dans(son.pan, -0.75, 0.75);
      expect(dureeCarlingue(son)).toBeLessThan(6);
      if (son.genre === 'gong') {
        dans(son.base, 55, 82);
        dans(son.passeBas, 1000, 1400);
        expect(son.partiels.map((partiel) => partiel.rapport)).toEqual([1, 1.48, 2.15, 2.71, 3.6, 4.93]);
        expect(son).toMatchObject({ desaccord: 0.25, niveau: 0.6, montee: 0.012, direct: 0.35 });
        expect(son.choc).toEqual({ sorte: 'souffle', t: 0, duree: 0.05, f: 260, filtre: 'lowpass', q: 0.7, vol: 2.5 });
        continue;
      }
      son.impulsions.forEach((impulsion, rang) => {
        dans(impulsion.t, 0, son.duree);
        expect(impulsion.t).toBeLessThan(son.duree);
        dans(impulsion.amp, 0.4, 1);
        const suivante = son.impulsions[rang + 1];
        if (suivante !== undefined) expect(suivante.t).toBeGreaterThan(impulsion.t);
      });
      if (son.genre === 'gemissement') {
        dans(son.duree, 2.2, 3.6);
        expect(son.resonateurs).toHaveLength(4);
        dans((son.resonateurs[0] ?? 0) / 180, 0.85, 1.2);
        expect(son).toMatchObject({ q: 22, passeBas: 1400, vol: 36, direct: 0.4, grain: 0.0012 });
        expect(son.coup).toBeUndefined();
      } else if (son.genre === 'craquement') {
        dans(son.duree, 0.5, 1.1);
        expect(son.resonateurs).toHaveLength(3);
        dans((son.resonateurs[0] ?? 0) / 520, 0.8, 1.25);
        expect(son).toMatchObject({ q: 35, passeBas: 2800, vol: 75, direct: 0.3, grain: 0.0008 });
      } else {
        dans(son.duree, 3, 4.5);
        [70, 113, 182, 260].forEach((frequence, rang) => dans((son.resonateurs[rang] ?? 0) / frequence, 0.9, 1.1));
        expect(son).toMatchObject({ q: 30, passeBas: 700, vol: 150, direct: 0.4, grain: 0.002 });
        expect(son.coup).toEqual({ de: 48, a: 34, glisse: 1.4, duree: 1.5, vol: 1 });
      }
    }
    expect([...vus].sort()).toEqual([...GENRES].sort());
  });
});
