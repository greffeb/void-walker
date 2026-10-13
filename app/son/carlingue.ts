// Carlingue qui travaille (15 §3.4, D-219) : tirages purs, rendus par le moteur. Valeurs du banc d'écoute.

import type { Souffle } from './recettes';

export const GENRES = ['gemissement', 'craquement', 'pression', 'gong'] as const;
export type Genre = (typeof GENRES)[number];

/** Mélange : le gong deux fois plus rare que les autres (D-219). */
export const POIDS: Readonly<Record<Genre, number>> = { gemissement: 2, craquement: 2, pression: 2, gong: 1 };

/** Secondes entre deux sons de la carlingue (rythme rare). */
export const INTERVALLE = { min: 20, max: 60 } as const;

/** Réverbération de coque : réponse de 3,8 s, décroissance exp(−1,6 t), retour 0,9. */
export const COQUE = { duree: 3.8, decroissance: 1.6, retour: 0.9 } as const;

/** Un son de carlingue part 50 ms après sa programmation. */
export const DEPART_CARLINGUE = 0.05;

export interface Impulsion {
  readonly t: number;
  readonly amp: number;
}

/** Tôle qui frotte : impulsions dans des résonateurs, puis passe-bas et enveloppe (15 §3.4). */
export interface Frottement {
  readonly genre: 'gemissement' | 'craquement' | 'pression';
  readonly duree: number;
  readonly impulsions: readonly Impulsion[];
  /** Durée d'une impulsion, en secondes. */
  readonly grain: number;
  readonly resonateurs: readonly number[];
  readonly q: number;
  readonly passeBas: number;
  readonly vol: number;
  /** Part du son envoyée sans réverbération. */
  readonly direct: number;
  readonly pan: number;
  /** Coup sourd au départ de la pression : sinus de `de` à `a` Hz en `glisse` s. */
  readonly coup?: { readonly de: number; readonly a: number; readonly glisse: number; readonly duree: number; readonly vol: number };
}

/** Un coup de masse loin sur la coque. */
export interface Gong {
  readonly genre: 'gong';
  readonly base: number;
  readonly partiels: readonly { readonly rapport: number; readonly niveau: number; readonly duree: number }[];
  /** Chaque partiel est joué deux fois, à ± `desaccord` × rapport Hz. */
  readonly desaccord: number;
  readonly niveau: number;
  readonly montee: number;
  readonly choc: Souffle;
  readonly passeBas: number;
  readonly direct: number;
  readonly pan: number;
}

export type Carlingue = Frottement | Gong;

const entre = (hasard: () => number, min: number, max: number): number => min + hasard() * (max - min);

export function choisirGenre(hasard: () => number): Genre {
  const total = GENRES.reduce((somme, genre) => somme + POIDS[genre], 0);
  let reste = hasard() * total;
  for (const genre of GENRES) {
    reste -= POIDS[genre];
    if (reste < 0) return genre;
  }
  return 'gong';
}

export function intervalle(hasard: () => number): number {
  return entre(hasard, INTERVALLE.min, INTERVALLE.max);
}

/** La tôle accroche, glisse, accroche : `cadence(u)` impulsions par seconde, u de 0 à 1 ; au moins 0,5 par seconde. */
export function frottement(duree: number, cadence: (u: number) => number, hasard: () => number): Impulsion[] {
  const impulsions: Impulsion[] = [];
  for (let t = 0; t < duree; ) {
    impulsions.push({ t, amp: entre(hasard, 0.4, 1) });
    t += (1 / Math.max(0.5, cadence(t / duree))) * entre(hasard, 0.7, 1.3);
  }
  return impulsions;
}

const panoramique = (hasard: () => number): number => entre(hasard, -0.75, 0.75);

function gemissement(hasard: () => number): Frottement {
  const duree = entre(hasard, 2.2, 3.6);
  const bas = entre(hasard, 7, 10);
  const haut = entre(hasard, 16, 26);
  const hauteur = entre(hasard, 0.85, 1.2);
  return {
    genre: 'gemissement',
    duree,
    impulsions: frottement(duree, (u) => bas + (haut - bas) * Math.sin(Math.PI * u) + entre(hasard, -2, 2), hasard),
    grain: 0.0012,
    resonateurs: [180, 297, 431, 612].map((frequence) => frequence * hauteur),
    q: 22,
    passeBas: 1400,
    vol: 36,
    direct: 0.4,
    pan: panoramique(hasard),
  };
}

function craquement(hasard: () => number): Frottement {
  const duree = entre(hasard, 0.5, 1.1);
  const hauteur = entre(hasard, 0.8, 1.25);
  return {
    genre: 'craquement',
    duree,
    impulsions: frottement(duree, () => entre(hasard, 3, 14), hasard),
    grain: 0.0008,
    resonateurs: [520, 1310, 2380].map((frequence) => frequence * hauteur),
    q: 35,
    passeBas: 2800,
    vol: 75,
    direct: 0.3,
    pan: panoramique(hasard),
  };
}

function pression(hasard: () => number): Frottement {
  const duree = entre(hasard, 3, 4.5);
  return {
    genre: 'pression',
    duree,
    impulsions: frottement(duree, (u) => 4 + 6 * u + entre(hasard, -1, 1), hasard),
    grain: 0.002,
    resonateurs: [70, 113, 182, 260].map((frequence) => frequence * entre(hasard, 0.9, 1.1)),
    q: 30,
    passeBas: 700,
    vol: 150,
    direct: 0.4,
    pan: panoramique(hasard),
    coup: { de: 48, a: 34, glisse: 1.4, duree: 1.5, vol: 1 },
  };
}

function gong(hasard: () => number): Gong {
  return {
    genre: 'gong',
    base: entre(hasard, 55, 82),
    partiels: [
      { rapport: 1, niveau: 1, duree: 5.5 },
      { rapport: 1.48, niveau: 0.7, duree: 4.2 },
      { rapport: 2.15, niveau: 0.55, duree: 3.4 },
      { rapport: 2.71, niveau: 0.4, duree: 2.6 },
      { rapport: 3.6, niveau: 0.25, duree: 1.9 },
      { rapport: 4.93, niveau: 0.12, duree: 1.3 },
    ],
    desaccord: 0.25,
    niveau: 0.6,
    montee: 0.012,
    choc: { sorte: 'souffle', t: 0, duree: 0.05, f: 260, filtre: 'lowpass', q: 0.7, vol: 2.5 },
    passeBas: entre(hasard, 1000, 1400),
    direct: 0.35,
    pan: panoramique(hasard),
  };
}

const TIRAGES: Readonly<Record<Genre, (hasard: () => number) => Carlingue>> = { gemissement, craquement, pression, gong };

export function tirerCarlingue(hasard: () => number): Carlingue {
  return TIRAGES[choisirGenre(hasard)](hasard);
}

/** Durée du son, réverbération non comprise. */
export function dureeCarlingue(son: Carlingue): number {
  if (son.genre === 'gong') return Math.max(...son.partiels.map((partiel) => partiel.duree));
  return Math.max(son.duree, son.coup?.duree ?? 0);
}
