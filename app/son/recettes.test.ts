import {
  chuteDe,
  crepitement,
  dureeRecette,
  ESPACE_SIGNAUX,
  GESTES,
  HAUTEURS_PANNEAU,
  monteeDe,
  NOTES_CREPITEMENT,
  ordonnerSignaux,
  RECETTES_GESTES,
  RECETTES_SIGNAUX,
  recetteIntro,
  SIGNAUX,
  SONS_INTRO,
  DUREE_STATIQUE,
  VOLUME_MAX,
  type ElementSon,
} from './recettes';

/** Hasard rejouable : même graine, mêmes tirages. */
function lcg(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (Math.imul(etat, 1664525) + 1013904223) >>> 0;
    return etat / 2 ** 32;
  };
}

const toutes = (): [string, readonly ElementSon[]][] => [
  ...Object.entries(RECETTES_GESTES),
  ...Object.entries(RECETTES_SIGNAUX),
  ...SONS_INTRO.map((nom): [string, readonly ElementSon[]] => [`intro ${nom}`, recetteIntro(nom, lcg(3))]),
];

describe('recettes des sons (15 §3)', () => {
  it('chaque geste et chaque signal du catalogue a sa recette (15 §2.1, §2.2)', () => {
    expect(Object.keys(RECETTES_GESTES).sort()).toEqual([...GESTES].sort());
    expect(Object.keys(RECETTES_SIGNAUX).sort()).toEqual([...SIGNAUX].sort());
    for (const [nom, recette] of toutes()) expect(recette.length, nom).toBeGreaterThan(0);
  });

  it('un geste dure moins de 300 ms, un signal moins d’une seconde, une fin de partie moins d’une seconde et demie (15 §7)', () => {
    for (const [nom, recette] of Object.entries(RECETTES_GESTES)) expect(dureeRecette(recette), nom).toBeLessThan(0.3);
    for (const [nom, recette] of Object.entries(RECETTES_SIGNAUX)) expect(dureeRecette(recette), nom).toBeLessThan(nom === 'victoire' || nom === 'mort' ? 1.5 : 1);
  });

  it('éléments bien formés : départ positif, fréquences audibles, niveaux sous le plafond commun, montée avant la fin', () => {
    for (const [nom, recette] of toutes()) {
      for (const element of recette) {
        expect(element.t, nom).toBeGreaterThanOrEqual(0);
        expect(element.duree, nom).toBeGreaterThan(0);
        expect(element.f, nom).toBeGreaterThanOrEqual(20);
        expect(element.f, nom).toBeLessThanOrEqual(20000);
        expect(element.vol, nom).toBeGreaterThan(0);
        expect(element.vol, nom).toBeLessThanOrEqual(VOLUME_MAX);
        expect(monteeDe(element) + chuteDe(element), nom).toBeLessThanOrEqual(element.duree + 1e-9);
      }
    }
  });

  it('valeurs du banc : clic, confirmer, bip feutré à la hauteur de chaque panneau, alarme vide', () => {
    expect(RECETTES_GESTES.clic).toEqual([
      { sorte: 'souffle', t: 0, duree: 0.007, f: 3600, q: 2.5, vol: 0.55 },
      { sorte: 'ton', t: 0, duree: 0.004, f: 2400, vol: 0.05 },
    ]);
    expect(RECETTES_GESTES.confirmer).toEqual([
      { sorte: 'souffle', t: 0, duree: 0.006, f: 3600, q: 2.5, vol: 0.35 },
      { sorte: 'ton', t: 0.025, duree: 0.045, f: 990, onde: 'sine', vol: 0.08, montee: 0.004 },
    ]);
    expect(HAUTEURS_PANNEAU).toEqual({ inventaire: 1.19, carte: 0.84, ia: 1 });
    for (const [panneau, hauteur] of Object.entries(HAUTEURS_PANNEAU)) {
      const [bip] = RECETTES_GESTES[`panneau-${panneau}` as 'panneau-ia'];
      expect(bip).toMatchObject({ sorte: 'ton', duree: 0.09, onde: 'sine', vol: 0.16, montee: 0.012, chute: 0.05 });
      expect(bip?.f).toBeCloseTo(660 * hauteur);
      expect(bip?.sorte === 'ton' ? bip.fin : undefined).toBeCloseTo(720 * hauteur);
    }
    expect(RECETTES_SIGNAUX['alarme-vide'].map((element) => [element.t, element.f])).toEqual([
      [0, 180],
      [0.26, 180],
      [0.52, 180],
    ]);
  });

  it('créature : Dissonance, deux tons carrés en triton (233 et 330 Hz) qui tremblent à 8 Hz, 0,7 s', () => {
    expect(RECETTES_SIGNAUX.creature).toEqual([
      { sorte: 'ton', t: 0, duree: 0.7, f: 233, vol: 0.08, passeBas: 1600, trem: 8, montee: 0.02, chute: 0.2 },
      { sorte: 'ton', t: 0, duree: 0.7, f: 330, vol: 0.08, passeBas: 1600, trem: 8, montee: 0.02, chute: 0.2 },
    ]);
  });

  it('mort : Parasite qui s’éteint ; victoire : Bande qui ralentit, puis le clac d’arrêt (D-225)', () => {
    expect(RECETTES_SIGNAUX.mort).toEqual([
      { sorte: 'souffle', t: 0, duree: 0.06, f: 700, filtre: 'lowpass', q: 1, vol: 0.3 },
      { sorte: 'ton', t: 0.02, duree: 1.4, f: 220, fin: 55, vol: 0.12, passeBas: 1500, trem: 40, chute: 0.5 },
    ]);
    expect(RECETTES_SIGNAUX.victoire).toEqual([
      { sorte: 'ton', t: 0, duree: 1.2, f: 440, onde: 'sine', fin: 60, vol: 0.16, montee: 0.01, chute: 0.25 },
      { sorte: 'ton', t: 0, duree: 1.2, f: 660, onde: 'sine', fin: 90, vol: 0.08, montee: 0.01, chute: 0.25 },
      { sorte: 'souffle', t: 0, duree: 1.2, f: 3000, fin: 200, q: 0.8, vol: 0.06 },
      { sorte: 'souffle', t: 1.25, duree: 0.03, f: 600, filtre: 'lowpass', vol: 0.45 },
    ]);
  });

  it('fermer l’inventaire, la carte ou IA Station : le bip feutré de l’ouverture, plus grave et qui descend (D-226)', () => {
    for (const [panneau, hauteur] of Object.entries(HAUTEURS_PANNEAU)) {
      const [ouverture] = RECETTES_GESTES[`panneau-${panneau}` as 'panneau-ia'];
      const [fermeture] = RECETTES_GESTES[`fermer-${panneau}` as 'fermer-ia'];
      expect(fermeture).toMatchObject({ sorte: 'ton', duree: 0.09, onde: 'sine', vol: 0.16, montee: 0.012, chute: 0.05 });
      expect(fermeture?.f).toBeCloseTo(560 * hauteur);
      expect(fermeture?.sorte === 'ton' ? fermeture.fin : undefined).toBeCloseTo(500 * hauteur);
      expect(fermeture?.f ?? 0).toBeLessThan(ouverture?.f ?? 0);
    }
  });

  it('blessure critique : la recette de la blessure, hauteur × 0,75, jouée deux fois à 0,32 s d’écart (15 §2.2)', () => {
    const critique = RECETTES_SIGNAUX['blessure-critique'];
    expect(critique).toHaveLength(RECETTES_SIGNAUX.blessure.length * 2);
    RECETTES_SIGNAUX.blessure.forEach((element, rang) => {
      expect(critique[rang]?.f).toBeCloseTo(element.f * 0.75);
      expect(critique[rang + RECETTES_SIGNAUX.blessure.length]?.t).toBeCloseTo(element.t + 0.32);
    });
  });

  it('crépitement : un tic tous les 36 ms × (0,75 à 1,25), sur trois notes, jamais après la fin de l’écriture', () => {
    expect(crepitement(0.5, () => 0.5)).toHaveLength(14);
    expect(crepitement(0.5, () => 0)).toHaveLength(19);
    expect(crepitement(0.5, () => 0.999999)).toHaveLength(12);
    const hasard = lcg(99);
    for (let essai = 0; essai < 500; essai += 1) {
      const tics = crepitement(0.5, hasard);
      expect(tics.length).toBeGreaterThanOrEqual(12);
      expect(tics.length).toBeLessThanOrEqual(19);
      tics.forEach((tic, rang) => {
        expect(tic.t).toBeLessThan(0.5);
        expect(NOTES_CREPITEMENT).toContain(tic.f);
        expect(tic).toMatchObject({ sorte: 'ton', duree: 0.007, onde: 'sine', vol: 0.07, chute: 0.004 });
        const suivant = tics[rang + 1];
        if (suivant !== undefined) {
          expect(suivant.t - tic.t).toBeGreaterThanOrEqual(0.036 * 0.75 - 1e-9);
          expect(suivant.t - tic.t).toBeLessThanOrEqual(0.036 * 1.25 + 1e-9);
        }
      });
    }
  });

  it('intro (D-311) : la menace est la blessure du jeu ; statique de 0,85 s ; un pas de l’intro dure moins d’une seconde', () => {
    expect(recetteIntro('menace', lcg(1))).toBe(RECETTES_SIGNAUX.blessure);
    for (const nom of SONS_INTRO) expect(dureeRecette(recetteIntro(nom, lcg(9))), nom).toBeLessThan(1);
    const statique = recetteIntro('statique', lcg(5));
    expect(dureeRecette(statique)).toBeLessThanOrEqual(DUREE_STATIQUE + 0.05);
    expect(statique.length).toBeGreaterThan(20);
    // Deux touches de suite ne sonnent pas tout à fait pareil ; les mêmes tirages, si.
    const hasard = lcg(11);
    expect(recetteIntro('clac', hasard)[0]?.f).not.toBe(recetteIntro('clac', hasard)[0]?.f);
    expect(recetteIntro('clac', lcg(4))).toEqual(recetteIntro('clac', lcg(4)));
  });

  it('ordre des signaux : alarme incendie, alarme vide, créature, blessure ou soin, IA Station ; sans doublon (15 §2.4)', () => {
    expect(ordonnerSignaux(['ia', 'soin', 'creature', 'alarme-vide', 'alarme-feu', 'ia'])).toEqual(['alarme-feu', 'alarme-vide', 'creature', 'soin', 'ia']);
    expect(ordonnerSignaux(['victoire', 'ia', 'mort'])).toEqual(['mort', 'ia', 'victoire']);
    expect(ordonnerSignaux([])).toEqual([]);
    expect(ESPACE_SIGNAUX).toBe(0.25);
  });
});
