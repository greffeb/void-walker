import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';

// M-07 — Salle des machines (13 §3, D-163, D-173, D-234, D-235), morceau de chemin. Les quartiers ouvrent sur la soute, où
// attend la créature, et sur la salle des machines ; la porte grippée de la salle mène à la coursive, d'où l'on sort vers le
// morceau suivant. Les règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   soute ══porte══ quartiers ══porte══ salle des machines ══porte grippée══ coursive ══porte══ (suite)
export const MORCEAU_M07: DefMorceau = {
  id: 'm-07',
  famille: 'chemin',
  // Tuile (14 §4.3) : soute, quartiers, salle des machines et coursive en rang.
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-soute', nom: 'soute', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-machines', nom: 'machines', machines: true, plan: { x: 8, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-coursive', nom: 'coursive', plan: { x: 12, y: 0, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-quartiers-soute', nom: 'porte', entre: ['p-quartiers', 'p-soute'], ouverte: true },
    { id: 'l-quartiers-machines', nom: 'porte', entre: ['p-quartiers', 'p-machines'], ouverte: false },
    { id: 'l-machines-coursive', nom: 'porte_grippee', entre: ['p-machines', 'p-coursive'], ouverte: false, bruyante: true },
  ],
  objets: [{ id: 'o-interrupteur', nom: 'interrupteur', piece: 'p-machines', portable: false, machines: 'p-machines' }],
  entree: 'p-quartiers',
  sortie: { piece: 'p-coursive', porte: { nom: 'porte' } },
  placesCreature: ['p-soute'],
  demande: [],
  fournit: ['acces'],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { obstacle: 'creature', accueillantes: { 'p-quartiers': 'vie', 'p-soute': 'fret', 'p-coursive': 'circulation' }, avant: ['p-quartiers', 'p-soute', 'p-machines'], coupe: ['l-machines-coursive'] },
};

// Textes du morceau (C-07). Texte final non validé.
export const TEXTES_MORCEAU_M07: TextesMorceau = {
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
  // Grande station (spec 2026-10-18 §5.4) : la soute sans trace ; la piste de la créature en ajoute, là où elle est passée.
  calmes: {
    soute: [
      'Une soute basse, encombrée de caisses arrimées. L’air y sent l’humidité et le métal.',
      'Des rayonnages, des sangles qui pendent. Une étiquette de pesée claque doucement dans un courant d’air.',
    ],
  },
  // Document des grandes stations (bible docs/17-univers.md §5) : un témoignage sur l'obstacle.
  documents: {
    doc_mot_bastien: {
      puce: { texte: 'mot de Bastien', genre: 'm', nombre: 's', elision: false },
      support: 'note',
      ou: 'écrite au crayon gras, scotchée à la paroi',
      corps: [
        'Les machines tournaient si fort qu’on ne s’entendait plus.',
        'On en a profité pour forcer la porte grippée, dans un raffut de tous les diables, et personne n’est venu voir.',
        'Mais de dedans, on n’aurait rien entendu venir non plus.',
      ],
      signature: 'Bastien',
    },
  },
  assistance: {},
};
