import type { Parcours } from '../types';

// Parcours sûr de la fiche M-09 (docs/13-morceaux-lancement.md §3) dans sa station de test : traverser la zone sans gravité,
// une action de plus pour dériver jusqu'à l'autre bout (D-237), pendant que la créature reste dans la soute.
const TRAVERSEE: Parcours = {
  nom: 'M-09 — Traverser en dérivant',
  etapes: [
    { action: 'ouvrir', cible: 'porte', vers: 'sas_ouest' },
    { action: 'aller', cible: 'porte', vers: 'sas_ouest' },
    { action: 'aller', cible: 'porte', vers: 'transfert' },
    { action: 'deriver', cible: 'porte', vers: 'sas_est' },
    { action: 'aller', cible: 'porte', vers: 'sas_est' },
    { action: 'ouvrir', cible: 'porte', vers: 'embarquement' },
    { action: 'aller', cible: 'porte', vers: 'embarquement' },
    { action: 'ouvrir', cible: 'ecoutille', vers: 'cabine' },
    { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
    { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
    { action: 'lancer', cible: 'pupitre' },
  ],
  attendu: {
    piece: 'cabine',
    objetsIci: ['pupitre'],
    inventaire: [],
    passagesOuverts: [],
    actions: 11,
    issue: 'evacuation',
    sante: 'indemne',
    sansDe: true,
  },
};

export const PARCOURS_M09: readonly Parcours[] = [TRAVERSEE];
