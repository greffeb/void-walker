import type { Couche, TextesMonde } from './types';

// Univers (13 §7.2) : réveil, départ de la capsule, repères de moment et pièces communes des stations, écrits à la main (C-07) :
// vouvoiement, phrases courtes, un nom par chose (NP-04), rien de non perçu (NP-05). Texte final non validé.

/** Radicaux propres à l'univers : un mot du socle ou d'un morceau qui commence par l'un d'eux est une fuite. */
export const MOTS_UNIVERS: readonly string[] = ['station'];

/** Attentes à la suite (#225) : la station finit par répondre. */
export const ATTENTES_LONGUES = {
  5: 'Un cliquetis court dans les parois, régulier. Comme si la station comptait avec vous.',
  10: 'Les lumières baissent d’un cran, puis reviennent. La station, elle aussi, attend.',
} as const satisfies TextesMonde['attentesLongues'];

export const UNIVERS = {
  noms: {
    vestibule: { texte: 'vestibule', genre: 'm', nombre: 's', elision: false },
    quartiers: { texte: 'quartiers de l’équipage', genre: 'm', nombre: 'p', elision: false },
    embarquement: { texte: 'salle d’embarquement', genre: 'f', nombre: 's', elision: false },
    cabine: { texte: 'cabine de la capsule', genre: 'f', nombre: 's', elision: false },
    porte: { texte: 'porte', genre: 'f', nombre: 's', elision: false },
    porte_grippee: { texte: 'porte grippée', genre: 'f', nombre: 's', elision: false },
    ecoutille: { texte: 'écoutille', genre: 'f', nombre: 's', elision: true },
    capsule: { texte: 'capsule de secours', genre: 'f', nombre: 's', elision: false },
    pupitre: { texte: 'pupitre de départ', genre: 'm', nombre: 's', elision: false },
  },
  descriptions: {
    // Pièce du réveil (13 §8.1) : la porte et sa manœuvre, sans destination ni promesse ; son état est dit par l'observation.
    vestibule: [
      'Un vestibule étroit et nu, éclairé de veilleuses. Une seule porte, ordinaire, qui s’ouvre à la main.',
      'Un petit vestibule aux murs gris, sans meuble. Pour en sortir, une porte ordinaire, à ouvrir à la main.',
    ],
    quartiers: [
      'Des couchettes superposées, des casiers ouverts, des affaires abandonnées en hâte. L’éclairage de service teinte tout de rouge.',
      'Les quartiers de l’équipage sont vides. Une couverture traîne au sol, un gobelet a roulé sous une couchette.',
    ],
    embarquement: [
      'Un quai d’embarquement nu. Une capsule de secours y est arrimée.',
      'Le quai d’embarquement est désert. Contre le quai, une capsule de secours attend.',
    ],
    cabine: [
      'Une cabine étroite, quatre sièges et leurs sangles. Le pupitre de départ occupe tout l’avant.',
      'Des sièges serrés, des sangles, une odeur de plastique neuf. À l’avant, le pupitre de départ.',
    ],
    pupitre: [
      'Le pupitre de départ : un levier sous capot, quelques voyants. Une notice rappelle : écoutille fermée avant le départ.',
      'Un levier de départ protégé par un capot. Une notice rappelle : écoutille fermée, puis départ.',
    ],
  },
  assistance: {},
  evenements: {
    reveil: [
      'Vous vous réveillez dans {le:piece}, la nuque raide. Les lumières de service sont au rouge.',
      'Une secousse vous tire du sommeil. Vous êtes dans {le:piece}, sous un éclairage rouge.',
    ],
    // Le code du post-it tapé au terminal de la salle de surveillance (lot 4, D-356).
    terminal_deverrouille: [
      'Vous tapez le code du post-it. Le terminal accepte : ACCÈS AUTORISÉ.',
      'Vous recopiez le code du post-it, touche après touche. Le terminal accepte : ACCÈS AUTORISÉ.',
    ],
    // Connexion au terminal déverrouillé (lot 4).
    terminal_connecte: [
      'Vous vous connectez au terminal. PLAN DE LA STATION CHARGÉ.',
      'L’écran du terminal s’éclaire. PLAN DE LA STATION CHARGÉ.',
    ],
  },
  // Messages d'IA Station sur un fait vrai (lot 4) : pour elle, une panne ou une anomalie technique, jamais la menace, sans chiffre.
  signesIA: {
    porte: [
      'Porte entre {le:piece} et {le:autre} : intégrité compromise. Une intervention de maintenance a été planifiée. Merci de votre patience.',
      'Porte entre {le:piece} et {le:autre} : verrou hors service. Son remplacement est prévu au prochain cycle d’entretien.',
      'Anomalie mécanique sur la porte entre {le:piece} et {le:autre}. Merci de signaler tout dommage au personnel de bord.',
    ],
    materiel: {
      camera: [
        'Caméra {de:piece} : liaison perdue. Un technicien sera dépêché dès que possible.',
        'Caméra {de:piece} : signal vidéo interrompu. L’incident a été transmis au service technique.',
      ],
      capteur: [
        'Capteur de mouvement {de:piece} : liaison perdue. Aucune action n’est requise de votre part.',
        'Capteur de mouvement {de:piece} : plus aucun signal. Le service technique en a été informé.',
      ],
    },
    passage: [
      '{Nom:piece} : détecteur de présence déclenché, puis revenu au repos. Aucune action n’est requise.',
      '{Nom:piece} : éclairage allumé par le détecteur, puis éteint. Aucune action n’est requise.',
    ],
    presence: [
      '{Nom:piece} : obstruction de la ventilation signalée. Merci de ne pas encombrer les bouches d’aération.',
      '{Nom:piece} : éclairage instable. Une vérification du circuit est en cours.',
      '{Nom:piece} : niveau sonore inhabituel enregistré. Merci de respecter le calme des espaces communs.',
      '{Nom:piece} : courant d’air anormal signalé. Une vérification de la ventilation est programmée.',
    ],
  },
  evacuations: {
    circuit: ['Le circuit tient. La capsule se détache du quai.'],
    bloc: ['Le bloc tient. La capsule se détache du quai.'],
    circuit_bloc: ['Le circuit et le bloc tiennent. La capsule se détache du quai.'],
    reserve: [
      'La capsule part sur sa propre réserve. Elle se détache du quai dans un choc sourd. Derrière le hublot, la station s’éloigne.',
      'Le levier descend ; la réserve de la capsule répond. Un choc, puis plus rien ne vous retient à la station.',
    ],
  },
  // Écran de fin (12 §4.11, D-281, D-283).
  fin: {
    titres: {
      abandon: 'Partie abandonnée.',
      defaite: 'Vous n’avez pas atteint la capsule.',
      evacuation: 'La capsule s’est détachée.',
    },
    reveil: 'Vous vous êtes réveillé dans {le:piece}.',
    sante: {
      indemne: 'Vous partez indemne.',
      blesse: 'Vous partez blessé.',
      critique: 'Vous partez grièvement blessé, mais vivant.',
    },
  },
  observation: {
    evacuee: 'La capsule s’est détachée. Vous avez quitté la station.',
    momentReveil: 'au réveil · {Nom:piece}',
    momentArrivee: 'en arrivant · {Nom:piece}',
    momentEvacuation: 'au départ de la capsule',
    momentPatience: 'en attendant',
    momentSigne: 'en cours de route',
  },
  // Pillage (spec 2026-10-18 §6.6) : une phrase entière, vraie dans toute salle de butin vidée avant le joueur. Elle dit que
  // quelqu'un est passé, jamais qui ni où. Sans mot de trace ni de menace. Écrites par l'assistant principal (D-243).
  pillages: [
    'Quelqu’un est passé avant vous : les tiroirs pendent, ouverts, et il ne reste que des emballages déchirés.',
    'Les étagères ont été vidées à la hâte ; quelques boîtes vides jonchent encore le sol.',
    'Une armoire a été forcée à la pince ; sa serrure pend, tordue, et l’intérieur est vide.',
    'Des emballages de pansements arrachés couvrent le sol, au pied d’un tiroir resté ouvert.',
    'Les casiers ont été ouverts un à un et retournés ; on n’y a laissé que les étiquettes.',
    'Sur une étagère, la poussière dessine encore la forme de ce qui y était rangé.',
    'Quelqu’un a fouillé ici avant vous, méthodiquement : chaque boîte est ouverte, chaque sachet est vide.',
  ],
  attentesLongues: ATTENTES_LONGUES,
} satisfies Couche;

/**
 * Messages d'IA Station d'une station tirée, au réveil, au départ, et à la 15e attente de suite (#152, #225) : sans pièce
 * nommée ni présence signalée, l'une et l'autre dépendant du tirage. Texte final non validé.
 */
export const ASSISTANCE_STATION: Readonly<Record<string, string>> = {
  reveil: 'Évacuation conseillée. Une capsule de secours vous attend à bord ; merci de la rejoindre dans le calme.',
  depart: 'Écoutille fermée, alimentation confirmée. Départ engagé ; bon voyage.',
  patience: 'Aucune activité détectée. Merci de rejoindre la capsule de secours.',
};
