// Sons du terminal en données (15 §3) : aucun audio ici. Valeurs du banc d'écoute (docs/maquette/banc-sons.html), qui fait foi.

export type Onde = 'square' | 'sine' | 'triangle' | 'sawtooth';
export type Filtre = 'bandpass' | 'lowpass' | 'highpass';

/** Oscillateur (15 §3.1) ; temps et durées en secondes depuis le départ du son, `vol` : niveau crête avant les bus. */
export interface Ton {
  readonly sorte: 'ton';
  readonly t: number;
  readonly duree: number;
  readonly f: number;
  /** Fréquence atteinte en fin de son, par glissement exponentiel. */
  readonly fin?: number;
  /** Carré par défaut. */
  readonly onde?: Onde;
  readonly vol: number;
  readonly passeBas?: number;
  /** Modulation d'amplitude carrée, en Hz (bourdonnement). */
  readonly trem?: number;
  readonly montee?: number;
  readonly chute?: number;
}

/** Bruit blanc filtré (15 §3.1) ; passe-bande et Q 1 par défaut. */
export interface Souffle {
  readonly sorte: 'souffle';
  readonly t: number;
  readonly duree: number;
  readonly f: number;
  readonly q?: number;
  readonly filtre?: Filtre;
  /** Fréquence du filtre atteinte en fin de son, par glissement exponentiel (bande qui ralentit). */
  readonly fin?: number;
  readonly vol: number;
  readonly montee?: number;
  readonly chute?: number;
}

export type ElementSon = Ton | Souffle;
export type Recette = readonly ElementSon[];

/** Montée : 2 ms pour un ton, 1 ms pour un souffle, sauf mention (15 §3.1). */
export function monteeDe(element: ElementSon): number {
  return element.montee ?? (element.sorte === 'ton' ? 0.002 : 0.001);
}

/** Chute : min(30 ms, durée / 2), sauf mention (15 §3.1). */
export function chuteDe(element: ElementSon): number {
  return element.chute ?? Math.min(0.03, element.duree / 2);
}

export function dureeRecette(recette: Recette): number {
  return recette.reduce((fin, element) => Math.max(fin, element.t + element.duree), 0);
}

export function decaler(recette: Recette, de: number): ElementSon[] {
  return recette.map((element) => ({ ...element, t: element.t + de }));
}

/** Gestes de l'interface (15 §2.1, D-217) : la valeur de l'attribut `data-son` des boutons. */
export const GESTES = ['clic', 'bulle', 'fermer', 'panneau-inventaire', 'panneau-carte', 'panneau-ia', 'confirmer', 'refus'] as const;
export type Geste = (typeof GESTES)[number];

/** Signaux du terminal (15 §2.2, D-218, D-224, D-225), dans l'ordre où ils se jouent (15 §2.4). */
export const SIGNAUX = ['alarme-feu', 'alarme-vide', 'creature', 'blessure', 'blessure-critique', 'mort', 'soin', 'ia', 'victoire'] as const;
export type Signal = (typeof SIGNAUX)[number];

export function ordonnerSignaux(signaux: readonly Signal[]): Signal[] {
  return SIGNAUX.filter((signal) => signaux.includes(signal));
}

/** Silence entre la fin d'un signal et le début du suivant (15 §2.4). */
export const ESPACE_SIGNAUX = 0.25;

/** Plafond commun des niveaux crête des bruitages (15 §7). */
export const VOLUME_MAX = 0.6;

const ton = (t: number, duree: number, f: number, autres: Partial<Omit<Ton, 'sorte' | 't' | 'duree' | 'f'>> & { readonly vol: number }): Ton => ({
  sorte: 'ton',
  t,
  duree,
  f,
  ...autres,
});

const souffle = (t: number, duree: number, f: number, autres: Partial<Omit<Souffle, 'sorte' | 't' | 'duree' | 'f'>> & { readonly vol: number }): Souffle => ({
  sorte: 'souffle',
  t,
  duree,
  f,
  ...autres,
});

/** Bip feutré des trois boutons de navigation, à la hauteur de chacun (15 §3.2). */
export const HAUTEURS_PANNEAU = { inventaire: 1.19, carte: 0.84, ia: 1 } as const;

const bipFeutre = (hauteur: number): Recette => [ton(0, 0.09, 660 * hauteur, { onde: 'sine', fin: 720 * hauteur, vol: 0.16, montee: 0.012, chute: 0.05 })];

const blessure = (hauteur: number): Recette => [
  souffle(0, 0.04, 700 * hauteur, { filtre: 'lowpass', q: 1, vol: 0.3 }),
  ton(0.02, 0.13, 220 * hauteur, { vol: 0.09, passeBas: 1500, trem: 40 }),
];

/** Bruitages des gestes (15 §2.1, §3.2). */
export const RECETTES_GESTES: Readonly<Record<Geste, Recette>> = {
  clic: [souffle(0, 0.007, 3600, { q: 2.5, vol: 0.55 }), ton(0, 0.004, 2400, { vol: 0.05 })],
  bulle: [souffle(0, 0.004, 3000, { q: 2.5, vol: 0.2 }), souffle(0.03, 0.004, 3600, { q: 2.5, vol: 0.16 })],
  fermer: [souffle(0, 0.004, 2400, { q: 2.5, vol: 0.18 })],
  'panneau-inventaire': bipFeutre(HAUTEURS_PANNEAU.inventaire),
  'panneau-carte': bipFeutre(HAUTEURS_PANNEAU.carte),
  'panneau-ia': bipFeutre(HAUTEURS_PANNEAU.ia),
  confirmer: [souffle(0, 0.006, 3600, { q: 2.5, vol: 0.35 }), ton(0.025, 0.045, 990, { onde: 'sine', vol: 0.08, montee: 0.004 })],
  refus: [0, 0.11].flatMap((de) => [ton(de, 0.07, 120, { vol: 0.12, passeBas: 1400 }), souffle(de, 0.07, 900, { q: 1.2, vol: 0.12 })]),
};

/** Signaux du terminal (15 §2.2, §3.2). */
export const RECETTES_SIGNAUX: Readonly<Record<Signal, Recette>> = {
  'alarme-feu': [0, 1, 2, 3, 4, 5].map((rang) => ton(rang * 0.09, 0.05, 1400, { vol: 0.06, chute: 0.01 })),
  'alarme-vide': [0, 0.26, 0.52].map((de) => ton(de, 0.16, 180, { vol: 0.14, passeBas: 1200, chute: 0.03 })),
  // Dissonance (D-224) : triton qui tremble, à la première rencontre de la créature.
  creature: [233, 330].map((f) => ton(0, 0.7, f, { vol: 0.08, passeBas: 1600, trem: 8, montee: 0.02, chute: 0.2 })),
  blessure: blessure(1),
  'blessure-critique': [...blessure(0.75), ...decaler(blessure(0.75), 0.32)],
  // Parasite qui s'éteint (D-225) : le bourdonnement de la blessure ralentit et descend.
  mort: [souffle(0, 0.06, 700, { filtre: 'lowpass', q: 1, vol: 0.3 }), ton(0.02, 1.4, 220, { fin: 55, vol: 0.12, passeBas: 1500, trem: 40, chute: 0.5 })],
  soin: [
    ton(0, 0.12, 523, { onde: 'sine', vol: 0.16, montee: 0.02, chute: 0.06 }),
    ton(0.12, 0.16, 784, { onde: 'sine', vol: 0.15, montee: 0.02, chute: 0.1 }),
  ],
  ia: [0, 0.07, 0.14].map((de) => ton(de, 0.028, 1600, { vol: 0.07 })),
  // Bande qui ralentit (D-225) : un magnétoscope qu'on arrête, puis le clac du mécanisme.
  victoire: [
    ton(0, 1.2, 440, { onde: 'sine', fin: 60, vol: 0.16, montee: 0.01, chute: 0.25 }),
    ton(0, 1.2, 660, { onde: 'sine', fin: 90, vol: 0.08, montee: 0.01, chute: 0.25 }),
    souffle(0, 1.2, 3000, { fin: 200, q: 0.8, vol: 0.06 }),
    souffle(1.25, 0.03, 600, { filtre: 'lowpass', vol: 0.45 }),
  ],
};

/** Crépitement de l'écriture (15 §2.3, §3.2) : un tic tous les 36 ms × (0,75 à 1,25), sur une note tirée parmi trois. */
export const PAS_CREPITEMENT = 0.036;
export const NOTES_CREPITEMENT = [1200, 1500, 1800] as const;

export function crepitement(duree: number, hasard: () => number): Ton[] {
  const tics: Ton[] = [];
  for (let t = 0; t < duree; t += PAS_CREPITEMENT * (0.75 + hasard() * 0.5)) {
    const note = NOTES_CREPITEMENT[Math.min(NOTES_CREPITEMENT.length - 1, Math.floor(hasard() * NOTES_CREPITEMENT.length))] ?? NOTES_CREPITEMENT[0];
    tics.push(ton(t, 0.007, note, { onde: 'sine', vol: 0.07, chute: 0.004 }));
  }
  return tics;
}

/** Grain cassette des bruitages (15 §3.2) : saturation douce (tanh) puis passe-bas ; l'ambiance n'y passe pas. */
export const GRAIN = { saturation: 2.2, passeBas: 5200, q: 0.5 } as const;

/** Fond brun (15 §3.3) : bruit blanc stéréo de 9 s en boucle, deux passe-bas, gain 5, fondu d'entrée de 0,8 s. */
export const FOND = { duree: 9, filtres: [90, 260], q: 0.5, gain: 5, fondu: 0.8 } as const;
