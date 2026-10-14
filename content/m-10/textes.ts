import { DESCRIPTIONS_STATION_ESSAI, NOMS_STATION_ESSAI, TEXTES_STATION_ESSAI } from '../textes/station-essai';
import type { TextesMonde } from '../textes/types';

// Textes de la station de test M-10 (C-07) ; le reste est commun aux stations de test. Texte final non validé.
export const TEXTES_M10: TextesMonde = {
  ...TEXTES_STATION_ESSAI,
  noms: {
    ...NOMS_STATION_ESSAI,
    antichambre: { texte: 'antichambre', genre: 'f', nombre: 's', elision: true },
    chambre: { texte: 'chambre froide', genre: 'f', nombre: 's', elision: false },
    entrepot: { texte: 'entrepôt', genre: 'm', nombre: 's', elision: true },
    coursive: { texte: 'coursive', genre: 'f', nombre: 's', elision: false },
    fermeture: { texte: 'pupitre de fermeture', genre: 'm', nombre: 's', elision: false },
    compresseur: { texte: 'compresseur', genre: 'm', nombre: 's', elision: false },
  },
  descriptions: {
    ...DESCRIPTIONS_STATION_ESSAI,
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
      'Une coursive de service. Au bout, une porte au mécanisme visiblement grippé mène à l’embarquement.',
      'Un couloir bas, éclairé de veilleuses. La porte de l’embarquement, au bout, a un mécanisme rouillé.',
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
  assistance: {
    capsule: 'Une capsule de secours est prête au départ, dans la salle d’embarquement.',
    presence: 'Présence non identifiée détectée dans l’entrepôt.',
  },
};
