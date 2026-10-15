import { TEXTES_MORCEAU_ESSAI } from '../morceaux/essai';
import { reunir } from '../textes/couches';
import type { TextesMonde, TextesMorceau } from '../textes/types';

// Textes propres à la station de test M-09 (C-07) ; la capsule vient de l'embarquement d'essai, le reste du socle, de l'univers
// et de la menace. Texte final non validé.
export const TEXTES_PROPRES_M09: TextesMorceau = {
  noms: {
    sas_ouest: { texte: 'sas ouest', genre: 'm', nombre: 's', elision: false },
    transfert: { texte: 'coursive de transfert', genre: 'f', nombre: 's', elision: false },
    sas_est: { texte: 'sas est', genre: 'm', nombre: 's', elision: false },
    soute: { texte: 'soute', genre: 'f', nombre: 's', elision: false },
    burette: { texte: 'burette d’huile', genre: 'f', nombre: 's', elision: false },
    interrupteur: { texte: 'interrupteur de gravité', genre: 'm', nombre: 's', elision: true },
  },
  descriptions: {
    sas_ouest: [
      'Un sas étroit au bout de la coursive de transfert. Au mur, un interrupteur de gravité sous un capot rouge.',
      'Un petit sas aux parois nues. Un interrupteur de gravité y commande la coursive de transfert.',
    ],
    transfert: [
      'Une longue coursive tapissée de poignées. Ici, plus rien ne pèse.',
      'Un tube de métal, des barreaux tout du long. Des débris flottent dans l’air immobile.',
    ],
    sas_est: [
      'Un sas étroit au bout de la coursive de transfert. Au mur, un interrupteur de gravité sous un capot rouge.',
      'Un petit sas aux parois nues. Un interrupteur de gravité y commande la coursive de transfert.',
    ],
    soute: [
      'Une soute basse, encombrée de caisses arrimées. L’air y sent l’humidité et le métal.',
      'Des rayonnages, des sangles qui pendent. Au sol, des traînées sombres que vous évitez de regarder.',
    ],
    burette: [
      'Une burette d’huile de machine, à moitié pleine. Versée au sol, elle le rendrait glissant.',
      'Une burette à long bec, pleine d’une huile épaisse. De quoi rendre un sol glissant.',
    ],
    interrupteur: [
      'Un interrupteur sous un capot rouge. Une plaque : « Gravité, coursive de transfert ».',
      'Un gros interrupteur à deux positions. Il coupe ou rétablit la gravité de la coursive de transfert.',
    ],
  },
  assistance: {
    capsule: 'Une capsule de secours est prête au départ, dans la salle d’embarquement.',
    gravite: 'Gravité coupée dans la coursive de transfert. Déplacements lents.',
  },
};

export const TEXTES_M09: TextesMonde = reunir([TEXTES_PROPRES_M09, TEXTES_MORCEAU_ESSAI]);
