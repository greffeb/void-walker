import type { Parcours } from '../types';

// Parcours sûr de la fiche M-08 (docs/13-morceaux-lancement.md §3) dans sa station de test : rapporter la planche, la poser,
// traverser, la retirer derrière soi.
const PLANCHE: Parcours = {
  nom: 'M-08 — Poser la planche, traverser, la retirer',
  etapes: [
    { action: 'aller', cible: 'porte', vers: 'atelier' },
    { action: 'prendre', cible: 'planche' },
    { action: 'aller', cible: 'porte', vers: 'quartiers' },
    // Grincement dans les quartiers : la réserve, fermée, ne l'entend pas.
    { action: 'ouvrir', cible: 'porte_grippee', vers: 'ouest' },
    { action: 'aller', cible: 'porte_grippee', vers: 'ouest' },
    { action: 'placer', cible: 'planche', parametre: 'est' },
    { action: 'aller', cible: 'vide', vers: 'est' },
    { action: 'prendre', cible: 'planche' },
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
    inventaire: ['planche'],
    passagesOuverts: [],
    actions: 14,
    issue: 'evacuation',
    sante: 'indemne',
    sansDe: true,
  },
};

export const PARCOURS_M08: readonly Parcours[] = [PLANCHE];
