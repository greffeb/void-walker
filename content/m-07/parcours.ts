import type { Parcours } from '../types';

// Parcours sûrs de la fiche M-07 (docs/13-morceaux-lancement.md §3) dans sa station de test : un engagement par étape.

const EMBARQUER: Parcours['etapes'] = [
  { action: 'aller', cible: 'porte', vers: 'embarquement' },
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

// Machines en marche, la porte grippée s'ouvre dans la salle : son grincement n'en sort pas, la créature reste dans la soute (T-15).
const VACARME: Parcours = {
  nom: 'M-07 — Gestes bruyants couverts par les machines',
  etapes: [
    { action: 'ouvrir', cible: 'porte', vers: 'machines' },
    { action: 'aller', cible: 'porte', vers: 'machines' },
    { action: 'ouvrir', cible: 'porte_grippee', vers: 'coursive' },
    { action: 'aller', cible: 'porte_grippee', vers: 'coursive' },
    ...EMBARQUER,
  ],
  attendu: { ...PARTI, actions: 9 },
};

// La relance attire la créature de la soute dans la salle (T-16) ; le passager repart par l'autre porte et la referme.
const RELANCE: Parcours = {
  nom: 'M-07 — Relancer pour l’attirer, repartir par l’autre porte',
  etapes: [
    { action: 'ouvrir', cible: 'porte', vers: 'machines' },
    { action: 'aller', cible: 'porte', vers: 'machines' },
    { action: 'ouvrir', cible: 'porte_grippee', vers: 'coursive' },
    { action: 'arreter', cible: 'interrupteur' },
    { action: 'relancer', cible: 'interrupteur' },
    { action: 'aller', cible: 'porte_grippee', vers: 'coursive' },
    { action: 'fermer', cible: 'porte_grippee', vers: 'machines' },
    ...EMBARQUER,
  ],
  attendu: { ...PARTI, actions: 12 },
};

export const PARCOURS_M07: readonly Parcours[] = [VACARME, RELANCE];
