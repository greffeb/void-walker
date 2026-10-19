import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';

// M-10 — Chambre froide (13 §3, D-166, D-170, D-234, D-239, D-240), morceau de chemin. La chambre froide a deux portes : vers
// l'antichambre, où se trouve le pupitre de fermeture, et vers l'entrepôt, où attend la créature. L'entrepôt donne aussi sur la
// coursive, dont la porte grippée mène au morceau suivant. Les règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   quartiers ══porte══ antichambre ══porte══ chambre froide ══porte══ entrepôt
//       ╚══porte══ coursive ═══════════════════porte════════════════════╝
//                    ╚══porte grippée══ (suite)
export const MORCEAU_M10: DefMorceau = {
  id: 'm-10',
  famille: 'chemin',
  // Tuile (14 §4.3) : antichambre, chambre froide et entrepôt en haut ; quartiers et coursive dessous.
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers', plan: { x: 0, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-antichambre', nom: 'antichambre', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-chambre', nom: 'chambre', froide: true, plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-entrepot', nom: 'entrepot', plan: { x: 8, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-coursive', nom: 'coursive', plan: { x: 4, y: 3, largeur: 8, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-quartiers-antichambre', nom: 'porte', entre: ['p-quartiers', 'p-antichambre'], ouverte: true },
    { id: 'l-antichambre-chambre', nom: 'porte', entre: ['p-antichambre', 'p-chambre'], ouverte: false },
    { id: 'l-chambre-entrepot', nom: 'porte', entre: ['p-chambre', 'p-entrepot'], ouverte: true },
    { id: 'l-entrepot-coursive', nom: 'porte', entre: ['p-entrepot', 'p-coursive'], ouverte: true },
    { id: 'l-quartiers-coursive', nom: 'porte', entre: ['p-quartiers', 'p-coursive'], ouverte: false },
  ],
  objets: [
    { id: 'o-fermeture', nom: 'fermeture', piece: 'p-antichambre', portable: false, fermeture: 'p-chambre' },
    { id: 'o-compresseur', nom: 'compresseur', piece: 'p-chambre', portable: false, avertisseur: { piece: 'p-chambre' } },
  ],
  entree: 'p-quartiers',
  sortie: { piece: 'p-coursive', porte: { nom: 'porte_grippee', bruyante: true } },
  placesCreature: ['p-entrepot'],
  demande: [],
  fournit: ['acces'],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { obstacle: 'creature', accueillantes: { 'p-quartiers': 'vie', 'p-entrepot': 'fret', 'p-coursive': 'circulation' }, avant: ['p-quartiers', 'p-antichambre', 'p-chambre', 'p-entrepot', 'p-coursive'], coupe: ['sortie'] },
};

// Textes du morceau (C-07). Texte final non validé.
export const TEXTES_MORCEAU_M10: TextesMorceau = {
  noms: {
    antichambre: { texte: 'antichambre', genre: 'f', nombre: 's', elision: true },
    chambre: { texte: 'chambre froide', genre: 'f', nombre: 's', elision: false },
    entrepot: { texte: 'entrepôt', genre: 'm', nombre: 's', elision: true },
    coursive: { texte: 'coursive', genre: 'f', nombre: 's', elision: false },
    fermeture: { texte: 'pupitre de fermeture', genre: 'm', nombre: 's', elision: false },
    compresseur: { texte: 'compresseur', genre: 'm', nombre: 's', elision: false },
  },
  descriptions: {
    antichambre: [
      'Une antichambre carrelée, des blouses isothermes pendues aux patères. Un pupitre commande les portes de la chambre froide.',
      'Des patères, des gants épais, une odeur de javel. Près de la porte de la chambre froide, un pupitre de fermeture.',
    ],
    chambre: [
      'Une chambre froide aux parois givrées. Le souffle se change en buée ; le froid mord aussitôt.',
      'Des rayonnages couverts de givre, un compresseur au fond. Le froid vous saisit dès le seuil.',
    ],
    entrepot: [
      'Un entrepôt aux allées sombres, des caisses empilées jusqu’au plafond.',
      'Des palettes, des caisses, des allées où la lumière ne va pas.',
    ],
    coursive: [
      'Une coursive de service. Au bout, une porte au mécanisme visiblement grippé.',
      'Un couloir bas, éclairé de veilleuses. La porte du bout a un mécanisme rouillé.',
    ],
    fermeture: [
      'Un pupitre à gros boutons : « Fermeture d’urgence, chambre froide ». Il ferme ses deux portes d’un coup.',
      'Un pupitre de fermeture. Une étiquette : « Ferme les portes de la chambre froide ».',
    ],
    compresseur: [
      'Un compresseur massif, au fond de la chambre. Un bouton le relance pour un cycle de froid, dans un vacarme régulier.',
      'Le compresseur de la chambre froide, à l’arrêt. Lancé, il gronde un long moment.',
    ],
  },
  assistance: {},
};
