import type { Parcours } from '../types';

// Parcours témoin de l'issue #89 : prendre l'objet, ouvrir, passer, poser.
export const PARCOURS_MONDE_TEST: Parcours = {
  nom: 'Prendre le carnet, ouvrir, passer, poser',
  etapes: [
    { action: 'prendre', cible: 'carnet' },
    { action: 'ouvrir', cible: 'porte' },
    { action: 'aller', cible: 'porte', vers: 'atelier' },
    { action: 'poser', cible: 'carnet' },
  ],
  attendu: {
    piece: 'atelier',
    objetsIci: ['carnet'],
    inventaire: [],
    passagesOuverts: ['porte'],
    actions: 4,
  },
};
