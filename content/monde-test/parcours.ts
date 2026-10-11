import type { Parcours } from '../types';

// Parcours témoin : prendre l'objet, ouvrir (porte bruyante : la créature approche), passer, poser.
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
    objetsIci: ['carnet', 'trousse'],
    inventaire: [],
    // Les portes de la cabine et de la soute.
    passagesOuverts: ['porte', 'porte'],
    actions: 4,
  },
};
