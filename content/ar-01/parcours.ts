import type { Parcours } from '../types';

// Parcours témoins d'AR-01 (docs/08-aventure-reference.md §13) : un engagement par étape, depuis l'état résultant du précédent.
// Les étapes nomment ce que le menu affiche ; un passage dont la destination est encore inconnue se vise par son seul nom.

const P_A: Parcours = {
  nom: 'P-A — Maintenance, circuit, accès découvert',
  etapes: [
    { action: 'aller', cible: 'porte', vers: 'atelier' },
    { action: 'deplacer', cible: 'caisse', parametre: 'sous_grille' },
    { action: 'ouvrir', cible: 'grille' },
    { action: 'aller', cible: 'grille' },
    { action: 'ouvrir', cible: 'panneau' },
    { action: 'aller', cible: 'panneau', vers: 'embarquement' },
    { action: 'fermer', cible: 'cloison', vers: 'observation' },
    { action: 'aller', cible: 'panneau', vers: 'energie' },
    { action: 'activer', cible: 'console' },
    { action: 'aller', cible: 'panneau', vers: 'embarquement' },
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
    actions: 14,
    issue: 'evacuation',
    sante: 'indemne',
    sansDe: true,
  },
};

const P_B: Parcours = {
  nom: 'P-B — Voie normale, bloc et avertisseur',
  etapes: [
    { action: 'aller', cible: 'porte', vers: 'atelier' },
    { action: 'prendre', cible: 'bidon' },
    { action: 'aller', cible: 'porte', vers: 'salon' },
    { action: 'ouvrir', cible: 'cloison', vers: 'galerie' },
    { action: 'arroser', cible: 'bidon', parametre: 'galerie' },
    { action: 'aller', cible: 'cloison', vers: 'galerie' },
    { action: 'ouvrir', cible: 'cloison', vers: 'energie' },
    { action: 'aller', cible: 'cloison', vers: 'energie' },
    { action: 'prendre', cible: 'bloc' },
    { action: 'declencher', cible: 'avertisseur' },
    { action: 'ouvrir', cible: 'cloison', vers: 'observation' },
    { action: 'aller', cible: 'cloison', vers: 'observation' },
    { action: 'aller', cible: 'cloison', vers: 'embarquement' },
    { action: 'fermer', cible: 'cloison', vers: 'observation' },
    { action: 'installer', cible: 'bloc' },
    { action: 'ouvrir', cible: 'ecoutille', vers: 'cabine' },
    { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
    { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
    { action: 'lancer', cible: 'pupitre' },
  ],
  attendu: {
    piece: 'cabine',
    objetsIci: ['pupitre'],
    // Le bidon vide reste porté (AR-01 §11.2).
    inventaire: ['bidon'],
    passagesOuverts: [],
    actions: 19,
    issue: 'evacuation',
    sante: 'indemne',
    sansDe: true,
  },
};

const P_C: Parcours = {
  nom: 'P-C — Bloc et seuil huilé',
  etapes: [
    { action: 'aller', cible: 'porte', vers: 'atelier' },
    { action: 'prendre', cible: 'burette' },
    { action: 'deplacer', cible: 'caisse', parametre: 'sous_grille' },
    { action: 'ouvrir', cible: 'grille' },
    { action: 'aller', cible: 'grille' },
    { action: 'verser', cible: 'burette', parametre: 'observation' },
    { action: 'prendre', cible: 'bloc' },
    { action: 'ouvrir', cible: 'cloison', vers: 'observation' },
    { action: 'aller', cible: 'cloison', vers: 'observation' },
    { action: 'aller', cible: 'cloison', vers: 'embarquement' },
    { action: 'fermer', cible: 'cloison', vers: 'observation' },
    { action: 'installer', cible: 'bloc' },
    { action: 'ouvrir', cible: 'ecoutille', vers: 'cabine' },
    { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
    { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
    { action: 'lancer', cible: 'pupitre' },
  ],
  attendu: {
    piece: 'cabine',
    objetsIci: ['pupitre'],
    // La burette vide reste portée (AR-01 §11.2).
    inventaire: ['burette'],
    passagesOuverts: [],
    actions: 16,
    issue: 'evacuation',
    sante: 'indemne',
    sansDe: true,
  },
};

export const PARCOURS_AR01: readonly Parcours[] = [P_A, P_B, P_C];
