import type { DefMorceau } from '../../engine';
import { TEXTES_AR01 } from '../ar-01/textes';
import { repris } from '../textes/couches';
import type { TextesMorceau } from '../textes/types';

// M-02 — Grille haute et caisse (13 §3, D-044, D-244), morceau de chemin repris d'AR-01. L'atelier, où attend la créature,
// garde la caisse au centre ; haut sur sa cloison, la grille étroite d'un conduit mène à la salle des pompes et au morceau
// suivant. Il faut un appui sous la grille pour l'atteindre ; la créature, trop large, ne passe jamais le conduit. Les
// règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   atelier maintenance ══grille haute, étroite══ salle des pompes ══porte══ (suite)
export const MORCEAU_M02: DefMorceau = {
  id: 'm-02',
  famille: 'chemin',
  // Tuile (14 §4.3) : les deux pièces en rang.
  pieces: [
    { id: 'p-atelier', nom: 'atelier', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-pompes', nom: 'pompes', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    {
      id: 'l-atelier-pompes',
      nom: 'grille',
      entre: ['p-atelier', 'p-pompes'],
      ouverte: false,
      etroite: true,
      sonAuTravers: true,
      haute: 'p-atelier',
      sansSignaletique: true,
    },
  ],
  positions: [
    { id: 'pos-sous-grille', nom: 'sous_grille', piece: 'p-atelier', sous: 'l-atelier-pompes' },
    { id: 'pos-centre', nom: 'centre', piece: 'p-atelier' },
  ],
  objets: [{ id: 'o-caisse', nom: 'caisse', piece: 'p-atelier', position: 'pos-centre', portable: false, deplacable: true, appui: true }],
  entree: 'p-atelier',
  sortie: { piece: 'p-pompes', porte: { nom: 'porte' } },
  placesCreature: ['p-atelier'],
  demande: [],
  fournit: ['acces'],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { obstacle: 'materiel', accueillantes: { 'p-atelier': 'technique', 'p-pompes': 'technique' }, avant: ['p-atelier'], coupe: ['l-atelier-pompes'], cles: { 'o-caisse': { etiquettes: ['rangement', 'lourd'], portableEnGrande: true } } },
};

// Textes du morceau (C-07) : le nom de l'atelier, la grille, la position sous la grille et la caisse repris d'AR-01 ; la
// description de l'atelier et la position au centre réécrites, sans « l'atelier » seul, nom affiché d'une pièce de M-08 ; la
// salle des pompes écrite pour ce morceau. Aucun message d'IA Station. Texte final non validé.
export const TEXTES_MORCEAU_M02: TextesMorceau = {
  noms: {
    atelier: repris(TEXTES_AR01.noms, 'atelier'),
    pompes: { texte: 'salle des pompes', genre: 'f', nombre: 's', elision: false },
    grille: repris(TEXTES_AR01.noms, 'grille'),
    sous_grille: repris(TEXTES_AR01.noms, 'sous_grille'),
    centre: { texte: 'au centre de la pièce', genre: 'm', nombre: 's', elision: false },
    caisse: repris(TEXTES_AR01.noms, 'caisse'),
  },
  descriptions: {
    atelier: [
      'Des établis, des casiers, des outils rangés. Haut sur la cloison, une grille de conduit ; sa poignée est hors de portée sans appui.',
      'Une odeur d’huile froide flotte entre les établis. Tout en haut de la cloison, une grille ferme un conduit ; il faudrait un appui stable pour l’atteindre.',
    ],
    pompes: [
      'Une salle basse, encombrée de pompes et de vannes. Leurs carters sont froids ; une odeur d’eau croupie flotte.',
      'Des pompes alignées sur leurs socles, à l’arrêt. Des tuyaux épais montent vers le plafond et s’y perdent.',
    ],
    caisse: repris(TEXTES_AR01.descriptions, 'caisse'),
  },
  assistance: {},
};
