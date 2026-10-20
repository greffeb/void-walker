import type { DefMorceau } from '../../engine';
import { TEXTES_AR01 } from '../ar-01/textes';
import { repris } from '../textes/couches';
import type { TextesMorceau } from '../textes/types';

// M-04 — Salle d'observation (13 §3, D-234, D-244, D-252), morceau de chemin repris d'AR-01. La salle de contrôle garde la
// burette et le test de l'avertisseur, dont l'émetteur est dans l'alcôve de l'observation ; sa cloison bruyante mène à la
// salle d'observation, où attend la créature, puis au morceau suivant par une cloison fermée. La salle n'est pas contre la
// coque (spec L4 §3.5). Les règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   salle de contrôle ══cloison bruyante══ salle d'observation [alcôve] ══cloison══ (suite)
export const MORCEAU_M04: DefMorceau = {
  id: 'm-04',
  famille: 'chemin',
  // Tuile (14 §4.3) : les deux pièces en rang.
  pieces: [
    { id: 'p-controle', nom: 'controle', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-observation', nom: 'observation', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [{ id: 'l-controle-observation', nom: 'cloison', entre: ['p-controle', 'p-observation'], ouverte: false, bruyante: true }],
  objets: [
    { id: 'o-burette', nom: 'burette', piece: 'p-controle', glissant: 1 },
    { id: 'o-avertisseur', nom: 'avertisseur', piece: 'p-controle', portable: false, avertisseur: { piece: 'p-observation', alcove: true } },
  ],
  entree: 'p-controle',
  sortie: { piece: 'p-observation', porte: { nom: 'cloison' } },
  placesCreature: ['p-observation'],
  demande: [],
  fournit: ['acces'],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { obstacle: 'creature', accueillantes: { 'p-controle': 'commandement' }, avant: ['p-controle'], coupe: ['l-controle-observation'], cles: { 'o-burette': { etiquettes: ['outillage'] } } },
};

// Textes du morceau (C-07) : la cloison, la burette et le nom du test d'avertisseur repris d'AR-01 ; la description du test
// réécrite, car celle d'AR-01 nomme la « baie » ; les deux salles écrites pour ce morceau, sans vitrage sur l'espace. Aucun
// message d'IA Station. Texte final non validé.
export const TEXTES_MORCEAU_M04: TextesMorceau = {
  noms: {
    controle: { texte: 'salle de contrôle', genre: 'f', nombre: 's', elision: false },
    observation: { texte: 'salle d’observation', genre: 'f', nombre: 's', elision: false },
    cloison: repris(TEXTES_AR01.noms, 'cloison'),
    burette: repris(TEXTES_AR01.noms, 'burette'),
    avertisseur: repris(TEXTES_AR01.noms, 'avertisseur'),
  },
  descriptions: {
    controle: [
      'Une salle de contrôle aux tables couvertes de voyants morts. Des sièges à roulettes ont été repoussés contre les murs.',
      'Des claviers abandonnés, des gobelets oubliés sur les tables. La salle de contrôle sent le café froid.',
    ],
    observation: [
      'Une salle d’observation plongée dans la pénombre. Une paroi opaque isole une alcôve d’équipement.',
      'Des sièges tournés vers un grand mur d’écrans, tous noirs. Au fond, une paroi opaque cache une alcôve d’équipement.',
    ],
    burette: repris(TEXTES_AR01.descriptions, 'burette'),
    avertisseur: [
      'Un bouton de test d’avertisseur. Un plan situe l’émetteur dans une alcôve de la salle d’observation ; le test sonne un court moment.',
      'Le test d’avertisseur commande un émetteur placé dans une alcôve de la salle d’observation. Le cycle de test est bref.',
    ],
  },
  // Documents des grandes stations (bible docs/17-univers.md §5) : un témoignage sur l'obstacle et la note de la burette déplacée.
  documents: {
    doc_message_sami: {
      puce: { texte: 'message de Sami', genre: 'm', nombre: 's', elision: false },
      support: 'message',
      ou: 'sur un enregistreur de poche, coincé dans un recoin',
      corps: [
        '[chuchoté] Ici Sami, sûreté. Nous avons vidé une burette sur le seuil de la cloison.',
        '[un choc sourd, puis un raclement] Ce qui nous suivait a glissé de tout son long sur l’huile.',
        '[souffle court] Nous passons, maintenant.',
      ],
    },
    doc_pense_bete: {
      puce: { texte: 'pense-bête', genre: 'm', nombre: 's', elision: false },
      support: 'note',
      ou: 'collée à la paroi, à hauteur d’épaule',
      corps: ['Burette d’huile rangée dans {le:piece}, avec les graisses.', 'Quand on emprunte, on rapporte.'],
      signature: 'Bastien',
    },
  },
  assistance: {},
};
