import type { Parcours } from '../types';

// Parcours témoins d'AR-02 (docs/09-aventure-reference-vide.md §8) : un engagement par étape, depuis l'état résultant du précédent.
// Les étapes nomment ce que le menu affiche.

const PREPARATION: Parcours['etapes'] = [
  { action: 'aller', cible: 'porte', vers: 'local' },
  { action: 'enfiler', cible: 'combinaison' },
  { action: 'prendre', cible: 'decoupeuse' },
  { action: 'aller', cible: 'porte', vers: 'coursive' },
  { action: 'ouvrir', cible: 'porte', vers: 'panoramique' },
  { action: 'aller', cible: 'porte', vers: 'panoramique' },
];

const EMBARQUER: Parcours['etapes'] = [
  { action: 'aller', cible: 'porte_grippee', vers: 'embarquement' },
  { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
  { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
  { action: 'lancer', cible: 'pupitre' },
];

const ARRIVEE_EQUIPEE: Parcours['attendu'] = {
  piece: 'cabine',
  objetsIci: ['pupitre'],
  // La combinaison enfilée et la découpeuse restent sur le passager.
  inventaire: ['combinaison', 'decoupeuse'],
  passagesOuverts: [],
  actions: 12,
  issue: 'evacuation',
  sante: 'indemne',
  sansDe: true,
};

const P_V1: Parcours = {
  nom: 'P-V1 — Vider l’embarquement',
  etapes: [
    ...PREPARATION,
    { action: 'percer', cible: 'baie' },
    { action: 'ouvrir', cible: 'porte_grippee', vers: 'embarquement' },
    ...EMBARQUER,
  ],
  attendu: ARRIVEE_EQUIPEE,
};

const P_V2: Parcours = {
  nom: 'P-V2 — Attirer puis percer',
  etapes: [
    ...PREPARATION,
    { action: 'ouvrir', cible: 'porte_grippee', vers: 'embarquement' },
    { action: 'percer', cible: 'baie' },
    ...EMBARQUER,
  ],
  attendu: ARRIVEE_EQUIPEE,
};

// Pas 4 : action libre qui suit la première rencontre, sans dé ni blessure (D-184, D-193).
const P_V3: Parcours = {
  nom: 'P-V3 — Passer en force',
  etapes: [
    { action: 'ouvrir', cible: 'porte', vers: 'panoramique' },
    { action: 'aller', cible: 'porte', vers: 'panoramique' },
    { action: 'ouvrir', cible: 'porte_grippee', vers: 'embarquement' },
    { action: 'aller', cible: 'porte_grippee', vers: 'embarquement' },
    { action: 'fermer', cible: 'porte_grippee', vers: 'panoramique' },
    { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
    { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
    { action: 'lancer', cible: 'pupitre' },
  ],
  attendu: {
    piece: 'cabine',
    objetsIci: ['pupitre'],
    inventaire: [],
    passagesOuverts: [],
    actions: 8,
    issue: 'evacuation',
    sante: 'indemne',
    sansDe: true,
  },
};

export const PARCOURS_AR02: readonly Parcours[] = [P_V1, P_V2, P_V3];
