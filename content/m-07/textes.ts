import { reunir } from '../textes/couches';
import type { TextesMonde, TextesMorceau } from '../textes/types';

// Textes propres à la station de test M-07 (C-07) ; le reste vient du socle, de l'univers et de la menace. Texte final non validé.
export const TEXTES_PROPRES_M07: TextesMorceau = {
  noms: {
    soute: { texte: 'soute', genre: 'f', nombre: 's', elision: false },
    machines: { texte: 'salle des machines', genre: 'f', nombre: 's', elision: false },
    coursive: { texte: 'coursive', genre: 'f', nombre: 's', elision: false },
    interrupteur: { texte: 'interrupteur des machines', genre: 'm', nombre: 's', elision: true },
  },
  descriptions: {
    soute: [
      'Une soute basse, encombrée de caisses arrimées. L’air y sent l’humidité et le métal.',
      'Des rayonnages, des sangles qui pendent. Au sol, des traînées sombres que vous évitez de regarder.',
    ],
    machines: [
      'Des turbines, des pompes, des conduites qui vibrent. Près de l’entrée, un gros interrupteur commande toute la salle.',
      'Une salle pleine de machines qui cognent et sifflent. Un interrupteur à levier, près de l’entrée, les commande toutes.',
    ],
    coursive: [
      'Une coursive étroite, éclairée par des veilleuses. Au bout, une porte.',
      'Un couloir de service, bas de plafond, qui finit sur une porte.',
    ],
    interrupteur: [
      'Un interrupteur à levier, gros comme un bras. Une plaque : « Arrêt et relance des machines ».',
      'Un levier massif sous un capot jaune. On peut arrêter les machines, puis les relancer.',
    ],
  },
  assistance: {
    capsule: 'Une capsule de secours est prête au départ, dans la salle d’embarquement.',
    presence: 'Présence non identifiée détectée dans la soute.',
  },
};

export const TEXTES_M07: TextesMonde = reunir([TEXTES_PROPRES_M07]);
