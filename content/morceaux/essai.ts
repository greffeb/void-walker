import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';

// Embarquement d'essai : final des stations de test (#105, #152). La salle d'embarquement garde une capsule déjà alimentée ;
// il reste à y monter, fermer l'écoutille et partir.
//
//   (entrée) ══ salle d'embarquement ══écoutille══ cabine
export const MORCEAU_ESSAI: DefMorceau = {
  id: 'essai',
  famille: 'final',
  pieces: [
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [{ id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false }],
  objets: [
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  entree: 'p-embarquement',
  placesCreature: [],
  demande: ['acces'],
  fournit: ['evacuation'],
};

// Textes du morceau (C-07) : la capsule alimentée ; les noms et les autres descriptions sont dans l'univers. Texte final non
// validé.
export const TEXTES_MORCEAU_ESSAI: TextesMorceau = {
  noms: {},
  descriptions: {
    capsule: [
      'Une capsule de secours arrimée au quai. Un voyant vert indique : alimentée, prête au départ.',
      'La capsule de secours est arrimée au quai. Son voyant d’alimentation est vert.',
    ],
  },
  assistance: {},
};
