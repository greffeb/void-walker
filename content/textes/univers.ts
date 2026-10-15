import type { Couche } from './types';

// Univers (13 §7.2) : réveil, départ de la capsule, repères de moment et pièces communes des stations, écrits à la main (C-07) :
// vouvoiement, phrases courtes, un nom par chose (NP-04), rien de non perçu (NP-05). Texte final non validé.

/** Radicaux propres à l'univers : un mot du socle ou d'un morceau qui commence par l'un d'eux est une fuite. */
export const MOTS_UNIVERS: readonly string[] = ['station'];

export const UNIVERS = {
  noms: {
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
    capsule: [
      'Une capsule de secours arrimée au quai. Un voyant vert indique : alimentée, prête au départ.',
      'La capsule de secours est arrimée au quai. Son voyant d’alimentation est vert.',
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
  observation: {
    evacuee: 'La capsule s’est détachée. Vous avez quitté la station.',
    momentReveil: 'au réveil · {Nom:piece}',
    momentArrivee: 'en arrivant · {Nom:piece}',
    momentEvacuation: 'au départ de la capsule',
  },
} satisfies Couche;
