import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';

// M-11 — Sas de sécurité (13 §3, #203), morceau de chemin. Le poste de sécurité donne sur le sas par une porte blindée,
// verrouillée : son lecteur ne lève le verrou qu'avec la carte de sécurité en main, rangée au vestiaire. La créature attend
// dans la remise, fermée, au-delà du vestiaire : on n'a pas besoin de l'ouvrir. Elle ne force jamais la porte blindée. Les
// règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   poste de sécurité ══porte (ouverte)══ vestiaire (carte) ══porte (fermée)══ remise (créature)
//        ╚══porte blindée (verrouillée, lecteur)══ sas de sécurité ══porte══ (suite)
export const MORCEAU_M11: DefMorceau = {
  id: 'm-11',
  famille: 'chemin',
  // Tuile (14 §4.3) : poste et vestiaire en haut ; sas et remise dessous. Le sas sous le poste : seule forme essayée qui
  // donne un plan à toutes les chaînes, M-09 puis M-11 puis M-06 comprise (#203).
  pieces: [
    { id: 'p-poste', nom: 'poste_securite', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-vestiaire', nom: 'vestiaire', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-sas', nom: 'sas_securite', plan: { x: 0, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-remise', nom: 'remise', plan: { x: 4, y: 3, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-poste-sas', nom: 'porte_blindee', entre: ['p-poste', 'p-sas'], ouverte: false, verrouillee: true, blindee: true },
    { id: 'l-poste-vestiaire', nom: 'porte', entre: ['p-poste', 'p-vestiaire'], ouverte: true },
    { id: 'l-vestiaire-remise', nom: 'porte', entre: ['p-vestiaire', 'p-remise'], ouverte: false },
  ],
  objets: [
    { id: 'o-lecteur', nom: 'lecteur', piece: 'p-poste', portable: false, deverrouille: 'l-poste-sas', exige: 'o-carte' },
    { id: 'o-carte', nom: 'carte_securite', piece: 'p-vestiaire' },
  ],
  entree: 'p-poste',
  sortie: { piece: 'p-sas', porte: { nom: 'porte' } },
  placesCreature: ['p-remise'],
  demande: [],
  fournit: ['acces'],
  // Grandes stations (spec 2026-10-18 §6.1) : déclaré, pas encore tiré (13 §7.14, reprise de main).
  grande: { obstacle: 'materiel', accueillantes: { 'p-poste': 'commandement' }, avant: ['p-poste', 'p-vestiaire', 'p-remise'], coupe: ['l-poste-sas'] },
};

// Textes du morceau (C-07). Texte final non validé.
export const TEXTES_MORCEAU_M11: TextesMorceau = {
  noms: {
    poste_securite: { texte: 'poste de sécurité', genre: 'm', nombre: 's', elision: false },
    sas_securite: { texte: 'sas de sécurité', genre: 'm', nombre: 's', elision: false },
    vestiaire: { texte: 'vestiaire', genre: 'm', nombre: 's', elision: false },
    remise: { texte: 'remise', genre: 'f', nombre: 's', elision: false },
    porte_blindee: { texte: 'porte blindée', genre: 'f', nombre: 's', elision: false },
    lecteur: { texte: 'lecteur de carte', genre: 'm', nombre: 's', elision: false },
    carte_securite: { texte: 'carte de sécurité', genre: 'f', nombre: 's', elision: false },
  },
  descriptions: {
    poste_securite: [
      'Un poste de sécurité, des écrans éteints sur un comptoir. Une porte blindée, un lecteur de carte à côté.',
      'Un comptoir, une chaise renversée, des écrans morts. Au mur, une porte blindée et son lecteur de carte.',
    ],
    sas_securite: [
      'Une salle de sécurité aux parois renforcées. Des marques au sol indiquent où attendre.',
      'Une salle étroite aux murs blindés, éclairée d’une lumière blanche. Une plaque : « Accès contrôlé ».',
    ],
    vestiaire: [
      'Un vestiaire, des casiers métalliques, un banc au milieu.',
      'Des casiers entrouverts, des tenues pendues, une odeur de renfermé.',
    ],
    remise: [
      'Une remise sombre, des étagères chargées de cartons.',
      'Des étagères, des cartons éventrés, des recoins où la lumière ne va pas.',
    ],
    porte_blindee: [
      'Une porte blindée, épaisse, aux charnières massives. Rien ne la ferait céder.',
      'Une lourde porte blindée. Elle ne s’ouvre qu’une fois son verrou levé.',
    ],
    lecteur: [
      'Un lecteur de carte, une fente et un voyant. Il attend une carte de sécurité.',
      'Un boîtier gris près de la porte blindée. Une étiquette : « Présentez votre carte ».',
    ],
    carte_securite: [
      'Une carte plastifiée, une puce dorée. Elle porte la mention « Accès contrôlé ».',
      'Une carte de sécurité, un peu usée. Imprimé au dos : « Accès contrôlé ».',
    ],
  },
  // Grandes stations (spec 2026-10-18 §5.4) : sans mot de trace, les traces viennent de la piste de la créature.
  calmes: {
    poste_securite: [
      'Un poste de sécurité, des écrans éteints sur un comptoir. Une porte blindée, un lecteur de carte à côté.',
      'Un comptoir, une chaise poussée contre le mur, des écrans morts. Au mur, une porte blindée et son lecteur de carte.',
    ],
    remise: [
      'Une remise sombre, des étagères chargées de cartons.',
      'Des étagères, des cartons empilés, des recoins où la lumière ne va pas.',
    ],
  },
  assistance: {},
};
