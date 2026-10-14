import type { Parcours } from '../types';

// Parcours sûrs de la fiche M-10 (docs/13-morceaux-lancement.md §3, D-170, D-239) dans sa station de test : un engagement par
// étape. La créature enfermée, la porte grippée de la coursive s'ouvre sans qu'elle l'entende.

const PAR_LA_COURSIVE: Parcours['etapes'] = [
  { action: 'aller', cible: 'porte', vers: 'quartiers' },
  { action: 'ouvrir', cible: 'porte', vers: 'coursive' },
  { action: 'aller', cible: 'porte', vers: 'coursive' },
  { action: 'ouvrir', cible: 'porte_grippee', vers: 'embarquement' },
  { action: 'aller', cible: 'porte_grippee', vers: 'embarquement' },
  { action: 'ouvrir', cible: 'ecoutille', vers: 'cabine' },
  { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
  { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
  { action: 'lancer', cible: 'pupitre' },
];

const PARTI: Omit<Parcours['attendu'], 'actions'> = {
  piece: 'cabine',
  objetsIci: ['pupitre'],
  inventaire: [],
  passagesOuverts: [],
  issue: 'evacuation',
  sante: 'indemne',
  sansDe: true,
};

// Le compresseur l'attire dans la chambre, sous les yeux du passager : l'action qui suit le premier contact est libre (D-184),
// il ressort par l'autre porte, puis ferme la chambre au pupitre. Deux actions dans le froid, aucune blessure (D-240).
const COMPRESSEUR: Parcours = {
  nom: 'M-10 — Compresseur, ressortir, fermer au pupitre',
  etapes: [
    { action: 'aller', cible: 'porte', vers: 'antichambre' },
    { action: 'ouvrir', cible: 'porte', vers: 'chambre' },
    { action: 'aller', cible: 'porte', vers: 'chambre' },
    { action: 'declencher', cible: 'compresseur' },
    { action: 'aller', cible: 'porte', vers: 'antichambre' },
    { action: 'boucler', cible: 'fermeture' },
    ...PAR_LA_COURSIVE,
  ],
  attendu: { ...PARTI, actions: 15 },
};

// Se faire suivre à travers la chambre, ressortir par l'autre porte et la refermer derrière elle (D-170, D-239).
const POURSUITE: Parcours = {
  nom: 'M-10 — Se faire suivre, refermer derrière elle',
  etapes: [
    { action: 'aller', cible: 'porte', vers: 'antichambre' },
    { action: 'ouvrir', cible: 'porte', vers: 'chambre' },
    { action: 'aller', cible: 'porte', vers: 'chambre' },
    { action: 'aller', cible: 'porte', vers: 'entrepot' },
    { action: 'aller', cible: 'porte', vers: 'chambre' },
    { action: 'aller', cible: 'porte', vers: 'antichambre' },
    { action: 'fermer', cible: 'porte', vers: 'chambre' },
    ...PAR_LA_COURSIVE,
  ],
  attendu: { ...PARTI, actions: 16 },
};

export const PARCOURS_M10: readonly Parcours[] = [COMPRESSEUR, POURSUITE];
