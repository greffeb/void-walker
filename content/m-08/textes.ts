import { reunir } from '../textes/couches';
import type { TextesMonde, TextesMorceau } from '../textes/types';

// Textes propres à la station de test M-08 (C-07) ; le reste vient du socle, de l'univers et de la menace. Texte final non validé.
export const TEXTES_PROPRES_M08: TextesMorceau = {
  noms: {
    atelier: { texte: 'atelier', genre: 'm', nombre: 's', elision: true },
    ouest: { texte: 'galerie nord', genre: 'f', nombre: 's', elision: false },
    est: { texte: 'galerie sud', genre: 'f', nombre: 's', elision: false },
    reserve: { texte: 'réserve', genre: 'f', nombre: 's', elision: false },
    vide: { texte: 'vide', genre: 'm', nombre: 's', elision: false },
    planche: { texte: 'planche', genre: 'f', nombre: 's', elision: false },
    touret: { texte: 'touret de câble', genre: 'm', nombre: 's', elision: false },
  },
  descriptions: {
    atelier: [
      'Un atelier de maintenance aux établis renversés. Contre le mur, une longue planche et un touret de câble.',
      'Des établis, des outils épars, une odeur de graisse. Une longue planche est appuyée contre la paroi.',
    ],
    ouest: [
      'La passerelle de la galerie s’arrête net : son milieu s’est effondré. Au-delà du vide, dans l’obscurité, on devine la galerie sud.',
      'Un tablier de métal tordu, puis plus rien : un vide noir coupe la galerie en deux. La partie sud se perd dans l’ombre.',
    ],
    est: [
      'La partie sud de la galerie, à l’aplomb du vide. Deux portes s’ouvrent dans la paroi.',
      'Un bout de passerelle accroché à la paroi, au-dessus du vide. Deux portes mènent plus loin.',
    ],
    reserve: [
      'Une réserve encombrée de caisses éventrées. Il y règne une odeur âcre.',
      'Des étagères renversées, des caisses ouvertes. Quelque chose a fouillé ici.',
    ],
    planche: [
      'Une longue planche de coffrage, épaisse et lourde. Assez longue pour enjamber un trou, pas pour un grand poids.',
      'Une planche de bois épaisse, plus longue que vous. Elle plie un peu en son milieu.',
    ],
    touret: [
      'Un touret de câble électrique, lourd et malcommode. Il faut les deux bras pour le porter.',
      'Une bobine de câble sur son touret, presque pleine. Elle pèse son poids.',
    ],
  },
  assistance: {
    capsule: 'Une capsule de secours est prête au départ, dans la salle d’embarquement.',
    passerelle: 'Passerelle effondrée. Franchissement interdit sans équipement.',
  },
};

export const TEXTES_M08: TextesMonde = reunir([TEXTES_PROPRES_M08]);
