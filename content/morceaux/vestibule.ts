import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';

// Vestibule de réveil (13 §8.1, D-257, GP-04) : une pièce sans danger, sans objet ni créature, et une porte ordinaire vers la
// suite, fermée au départ. Ses noms et sa description sont dans l'univers ; le morceau n'a pas de texte propre.
export const MORCEAU_VESTIBULE: DefMorceau = {
  id: 'vestibule',
  famille: 'depart',
  pieces: [{ id: 'p-vestibule', nom: 'vestibule', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } }],
  liaisons: [],
  objets: [],
  entree: 'p-vestibule',
  sortie: { piece: 'p-vestibule', porte: { nom: 'porte' } },
  placesCreature: [],
  demande: [],
  fournit: [],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { accueillantes: {}, avant: ['p-vestibule'], coupe: [] },
};

export const TEXTES_MORCEAU_VESTIBULE: TextesMorceau = { noms: {}, descriptions: {}, assistance: {} };
