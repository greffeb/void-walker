import type { DefMorceau } from '../../engine';
import { TEXTES_AR01 } from '../ar-01/textes';
import { repris } from '../textes/couches';
import type { TextesMorceau } from '../textes/types';

// M-05 — Panneau et passage caché (13 §3, D-244, D-256, K-05), morceau de chemin repris d'AR-01. Du local de service, une
// porte mène à la salle de tri, où attend la créature, puis au hall de chargement et au morceau suivant. Le panneau étroit
// du local relie directement le hall : vu du local, un passage fermé sans destination ; invisible du hall avant sa
// découverte. Les règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   local de service ══porte══ salle de tri
//          ║ panneau caché          ║ porte
//   hall de chargement, sous les deux ══porte══ (suite)
export const MORCEAU_M05: DefMorceau = {
  id: 'm-05',
  famille: 'chemin',
  // Tuile (14 §4.3) : le local et la salle de tri en rang, le hall dessous, sur toute la largeur.
  pieces: [
    { id: 'p-service', nom: 'service', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-tri', nom: 'tri', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-quai', nom: 'quai', plan: { x: 0, y: 3, largeur: 8, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-service-tri', nom: 'porte', entre: ['p-service', 'p-tri'], ouverte: false },
    { id: 'l-tri-quai', nom: 'porte', entre: ['p-tri', 'p-quai'], ouverte: false },
    { id: 'l-service-quai', nom: 'panneau', entre: ['p-service', 'p-quai'], ouverte: false, etroite: true, cachee: 'p-quai' },
  ],
  objets: [],
  entree: 'p-service',
  sortie: { piece: 'p-quai', porte: { nom: 'porte' } },
  placesCreature: ['p-tri'],
  demande: [],
  fournit: ['acces'],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { obstacle: 'creature', accueillantes: { 'p-service': 'technique', 'p-quai': 'fret' }, avant: ['p-service'], coupe: ['l-service-tri', 'l-service-quai'] },
};

// Textes du morceau (C-07) : le panneau repris d'AR-01 ; les trois pièces écrites pour ce morceau, sans « quai », réservé à
// l'embarquement. Le local montre le panneau, qu'on y voit ; le hall n'en dit rien, car il y est caché (C-06 §5). Aucun
// message d'IA Station. Texte final non validé.
export const TEXTES_MORCEAU_M05: TextesMorceau = {
  noms: {
    service: { texte: 'local de service', genre: 'm', nombre: 's', elision: false },
    tri: { texte: 'salle de tri', genre: 'f', nombre: 's', elision: false },
    quai: { texte: 'hall de chargement', genre: 'm', nombre: 's', elision: false },
    panneau: repris(TEXTES_AR01.noms, 'panneau'),
  },
  descriptions: {
    service: [
      'Un local de service encombré d’étagères. Dans un angle, un panneau porte une poignée et des marques d’ouverture.',
      'Le local de service est tiède et silencieux. Dans un coin, un panneau montre une poignée usée et des marques d’ouverture.',
    ],
    tri: [
      'Une salle de tri aux tapis roulants immobiles. Des colis éventrés jonchent le sol.',
      'Des bacs de tri, des étiquettes partout, un tapis arrêté net. L’air sent le carton humide.',
    ],
    quai: [
      'Un hall de chargement haut de plafond. Des marques au sol délimitent les aires de dépôt.',
      'Le hall de chargement est désert. Des sangles d’arrimage pendent aux anneaux du mur.',
    ],
  },
  // Grande station (spec 2026-10-18 §5.4) : la salle de tri sans trace ; la piste de la créature en ajoute, là où elle est passée.
  calmes: {
    tri: [
      'Une salle de tri aux tapis roulants immobiles. Des colis attendent encore sur les bandes, l’adresse tournée vers le plafond.',
      'Des bacs de tri, des étiquettes partout, un tapis arrêté net. L’air sent le carton humide.',
    ],
  },
  // Document des grandes stations (bible docs/17-univers.md §5) : le passage caché à mots couverts, permis dans ce morceau (D-323).
  documents: {
    doc_note_joel: {
      puce: { texte: 'note de Joël', genre: 'f', nombre: 's', elision: false },
      support: 'note',
      ou: 'écrite sur une serviette en papier, scotchée à la paroi',
      corps: [
        'Ceux du tri sont toujours les premiers à table, même les jours de gros arrivage.',
        'Ils ont leur raccourci, paraît-il, derrière un panneau.',
        'Il faut rentrer le ventre ; moi, je n’y passerais pas.',
      ],
      signature: 'Joël',
    },
  },
  assistance: {},
};
