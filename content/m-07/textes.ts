import { DESCRIPTIONS_STATION_ESSAI, NOMS_STATION_ESSAI, TEXTES_STATION_ESSAI } from '../textes/station-essai';
import type { TextesMonde } from '../textes/types';

// Textes de la station de test M-07 (C-07) ; le reste est commun aux stations de test. Texte final non validé.
export const TEXTES_M07: TextesMonde = {
  ...TEXTES_STATION_ESSAI,
  noms: {
    ...NOMS_STATION_ESSAI,
    soute: { texte: 'soute', genre: 'f', nombre: 's', elision: false },
    machines: { texte: 'salle des machines', genre: 'f', nombre: 's', elision: false },
    coursive: { texte: 'coursive', genre: 'f', nombre: 's', elision: false },
    interrupteur: { texte: 'interrupteur des machines', genre: 'm', nombre: 's', elision: true },
  },
  descriptions: {
    ...DESCRIPTIONS_STATION_ESSAI,
    soute: [
      'Une soute basse, encombrée de caisses arrimées. L’air y sent l’humidité et le métal.',
      'Des rayonnages, des sangles qui pendent. Au sol, des traînées sombres que vous évitez de regarder.',
    ],
    machines: [
      'Des turbines, des pompes, des conduites qui vibrent. Près de l’entrée, un gros interrupteur commande toute la salle.',
      'Une salle pleine de machines qui cognent et sifflent. Un interrupteur à levier, près de l’entrée, les commande toutes.',
    ],
    coursive: [
      'Une coursive étroite, éclairée par des veilleuses. Au bout, la salle d’embarquement.',
      'Un couloir de service, bas de plafond. Des flèches peintes mènent vers l’embarquement.',
    ],
    interrupteur: [
      'Un interrupteur à levier, gros comme un bras. Une plaque : « Arrêt et relance des machines ».',
      'Un levier massif sous un capot jaune. On peut arrêter les machines, puis les relancer.',
    ],
  },
  assistance: {
    capsule: 'Une capsule de secours est prête au départ, dans la salle d’embarquement, au-delà de la salle des machines.',
    presence: 'Présence non identifiée détectée dans la soute.',
  },
};
