import { DESCRIPTIONS_STATION_ESSAI, NOMS_STATION_ESSAI, TEXTES_STATION_ESSAI } from '../textes/station-essai';
import type { TextesMonde } from '../textes/types';

// Textes de la station de test M-08 (C-07) ; le reste est commun aux stations de test. Texte final non validé.
export const TEXTES_M08: TextesMonde = {
  ...TEXTES_STATION_ESSAI,
  noms: {
    ...NOMS_STATION_ESSAI,
    atelier: { texte: 'atelier', genre: 'm', nombre: 's', elision: true },
    ouest: { texte: 'bord ouest de la passerelle', genre: 'm', nombre: 's', elision: false },
    est: { texte: 'bord est de la passerelle', genre: 'm', nombre: 's', elision: false },
    reserve: { texte: 'réserve', genre: 'f', nombre: 's', elision: false },
    vide: { texte: 'vide', genre: 'm', nombre: 's', elision: false },
    planche: { texte: 'planche', genre: 'f', nombre: 's', elision: false },
    touret: { texte: 'touret de câble', genre: 'm', nombre: 's', elision: false },
  },
  descriptions: {
    ...DESCRIPTIONS_STATION_ESSAI,
    atelier: [
      'Un atelier de maintenance aux établis renversés. Contre le mur, une longue planche et un touret de câble.',
      'Des établis, des outils épars, une odeur de graisse. Une longue planche est appuyée contre la paroi.',
    ],
    ouest: [
      'La passerelle s’arrête net : son milieu s’est effondré. De l’autre côté du vide, l’obscurité ; on devine le bord est.',
      'Un tablier de métal tordu, puis plus rien : un vide noir coupe la salle en deux. Le bord est se perd dans l’ombre.',
    ],
    est: [
      'Le bord est de la passerelle, à l’aplomb du vide. Deux portes s’ouvrent dans la paroi.',
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
    capsule: 'Une capsule de secours est prête au départ, dans la salle d’embarquement, au-delà de la passerelle.',
    passerelle: 'Passerelle effondrée. Franchissement interdit sans équipement.',
  },
};
