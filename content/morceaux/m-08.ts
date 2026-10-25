import type { DefMorceau } from '../../engine';
import { TEXTES_PROPRES_M08 } from '../m-08/textes';
import { repris } from '../textes/couches';
import type { TextesMorceau } from '../textes/types';

// M-08 — Passerelle effondrée (13 §3, D-164, D-169, D-236), morceau de chemin. Les quartiers ouvrent sur l'atelier, où se
// trouve la planche ; leur porte grippée mène à la galerie nord, coupée par un vide. De l'autre bord, la galerie sud donne sur
// le magasin, où attend la créature, et sur le morceau suivant. Les règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   atelier ══porte══ quartiers ══porte grippée══ galerie nord ┄┄vide┄┄ galerie sud ══porte══ (suite)
//                                                                             ╚══porte══ magasin
export const MORCEAU_M08: DefMorceau = {
  id: 'm-08',
  famille: 'chemin',
  // Tuile (14 §4.3) : atelier, quartiers et galerie nord en haut ; galerie sud et magasin dessous.
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-atelier', nom: 'atelier', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-ouest', nom: 'ouest', plan: { x: 8, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-est', nom: 'est', plan: { x: 8, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-magasin', nom: 'magasin', plan: { x: 12, y: 3, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-quartiers-atelier', nom: 'porte', entre: ['p-quartiers', 'p-atelier'], ouverte: true },
    { id: 'l-quartiers-ouest', nom: 'porte_grippee', entre: ['p-quartiers', 'p-ouest'], ouverte: false, bruyante: true },
    { id: 'l-ouest-est', nom: 'vide', entre: ['p-ouest', 'p-est'], ouverte: true, gouffre: true },
    { id: 'l-est-magasin', nom: 'porte', entre: ['p-est', 'p-magasin'], ouverte: false },
  ],
  objets: [{ id: 'o-planche', nom: 'planche', piece: 'p-atelier', pont: true, encombrant: true }],
  entree: 'p-quartiers',
  sortie: { piece: 'p-est', porte: { nom: 'porte' } },
  placesCreature: ['p-magasin'],
  demande: [],
  fournit: ['acces'],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { obstacle: 'materiel', accueillantes: { 'p-quartiers': 'vie', 'p-atelier': 'technique', 'p-magasin': 'technique' }, avant: ['p-atelier', 'p-quartiers', 'p-ouest'], coupe: ['l-ouest-est'], cles: { 'o-planche': { etiquettes: ['rangement'] } } },
  // La tuile retournée de haut en bas, la galerie d'entrée passe au sud de la carte et l'autre au nord (#296).
  nomsRetournes: { 'p-ouest': { axe: 'y', nom: 'ouest_sud' }, 'p-est': { axe: 'y', nom: 'est_nord' } },
  assistance: [{ id: 'passerelle', quand: { type: 'arrivee', piece: 'p-ouest' } }],
};

// Textes du morceau (C-07) : galeries, vide, planche et message d'arrivée repris de la station de test M-08 ; l'atelier sans
// le touret ni la planche, qui peut en être ôtée ; le magasin écrit pour ce morceau. Texte final non validé.
export const TEXTES_MORCEAU_M08: TextesMorceau = {
  noms: {
    atelier: repris(TEXTES_PROPRES_M08.noms, 'atelier'),
    ouest: repris(TEXTES_PROPRES_M08.noms, 'ouest'),
    est: repris(TEXTES_PROPRES_M08.noms, 'est'),
    ouest_sud: { texte: 'galerie sud', genre: 'f', nombre: 's', elision: false },
    est_nord: { texte: 'galerie nord', genre: 'f', nombre: 's', elision: false },
    magasin: { texte: 'magasin', genre: 'm', nombre: 's', elision: false },
    vide: repris(TEXTES_PROPRES_M08.noms, 'vide'),
    planche: repris(TEXTES_PROPRES_M08.noms, 'planche'),
  },
  descriptions: {
    atelier: [
      'Un atelier de maintenance aux établis renversés. Des outils jonchent le sol.',
      'Des établis, des étaux, de la limaille sur le sol. Quelques outils pendent encore au tableau mural.',
    ],
    ouest: repris(TEXTES_PROPRES_M08.descriptions, 'ouest'),
    est: repris(TEXTES_PROPRES_M08.descriptions, 'est'),
    ouest_sud: [
      'La passerelle de la galerie s’arrête net : son milieu s’est effondré. Au-delà du vide, dans l’obscurité, on devine la galerie nord.',
      'Un tablier de métal tordu, puis plus rien : un vide noir coupe la galerie en deux. La partie nord se perd dans l’ombre.',
    ],
    est_nord: [
      'La partie nord de la galerie, à l’aplomb du vide. Deux portes s’ouvrent dans la paroi.',
      'Un bout de passerelle accroché à la paroi, au-dessus du vide. Deux portes mènent plus loin.',
    ],
    magasin: [
      'Un magasin de pièces détachées. Des bacs étiquetés montent jusqu’au plafond ; plusieurs gisent renversés.',
      'Des casiers grillagés, des bacs de visserie, un comptoir de distribution. Le fond du magasin reste sombre.',
    ],
    planche: repris(TEXTES_PROPRES_M08.descriptions, 'planche'),
  },
  // Grande station (spec 2026-10-18 §5.4) : l'atelier et le magasin sans trace ; la piste de la créature en ajoute, là où elle est passée.
  calmes: {
    atelier: [
      'Un atelier de maintenance aux établis encombrés. Des outils traînent sur les plans de travail.',
      'Des établis, des étaux, de la limaille sur le sol. Quelques outils pendent encore au tableau mural.',
    ],
    magasin: [
      'Un magasin de pièces détachées. Des bacs étiquetés montent jusqu’au plafond, rangés par taille.',
      'Des casiers grillagés, des bacs de visserie, un comptoir de distribution. Le fond du magasin reste sombre.',
    ],
  },
  // Documents des grandes stations (bible docs/17-univers.md §5) : un témoignage sur l'obstacle et la note de la planche déplacée.
  documents: {
    doc_message_odile: {
      puce: { texte: 'message d’Odile', genre: 'm', nombre: 's', elision: false },
      support: 'message',
      ou: 'sur un enregistreur de poche, calé contre la paroi',
      corps: [
        '[voix calme] Nous avions couché la planche en travers du vide, et j’ai regardé Marc traverser le premier. Elle a plié en son milieu, mais elle a tenu.',
        '[un temps] Nous l’avons retirée derrière nous, pour que rien ne nous suive. Sous un poids plus lourd qu’un homme, de toute façon, elle aurait cédé.',
      ],
    },
    doc_mot_nadia: {
      puce: { texte: 'mot de Nadia', genre: 'm', nombre: 's', elision: false },
      support: 'note',
      ou: 'scotchée de travers, à hauteur des yeux',
      corps: ['Planche du chantier rangée dans {le:piece}.', 'La reprendre sans prévenir, c’est la corvée de nettoyage pendant un mois.'],
      signature: 'Nadia',
    },
  },
  assistance: {
    passerelle: repris(TEXTES_PROPRES_M08.assistance, 'passerelle'),
  },
};
