import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';

// M-03 — Énergie (13 §3, D-249), morceau final. Le local énergie a la console du circuit de départ et le bloc d'énergie ; la
// réserve voisine est la place de la créature ; la salle d'embarquement garde une capsule non alimentée. Réarmer le circuit
// (relais bruyant) ou porter le bloc jusqu'à la capsule l'alimente. Les règles lisent les qualités déclarées ici (D-078).
//
//   (entrée) ══ local énergie ══porte══ réserve
//                    ╚══porte══ salle d'embarquement ══écoutille══ cabine
export const MORCEAU_M03: DefMorceau = {
  id: 'm-03',
  famille: 'final',
  // Tuile (14 §4.3) : local énergie et réserve en rang, la salle d'embarquement sous le local, contre la coque.
  pieces: [
    { id: 'p-energie', nom: 'energie', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-reserve', nom: 'reserve', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 0, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'l-energie-reserve', nom: 'porte', entre: ['p-energie', 'p-reserve'], ouverte: true },
    { id: 'l-energie-embarquement', nom: 'porte', entre: ['p-energie', 'p-embarquement'], ouverte: false },
    { id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false },
  ],
  objets: [
    { id: 'o-console', nom: 'console', piece: 'p-energie', portable: false, alimente: 'o-capsule' },
    { id: 'o-bloc', nom: 'bloc', piece: 'p-energie', large: true, encombrant: true, source: true },
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine' } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  entree: 'p-energie',
  placesCreature: ['p-reserve'],
  demande: ['acces'],
  fournit: ['evacuation'],
  assistance: [{ id: 'energie', quand: { type: 'arrivee', piece: 'p-energie' } }],
};

// Textes du morceau (C-07) : noms et message d'arrivée repris d'AR-01 ; descriptions écrites pour ce morceau, sans nommer de
// pièce voisine. Texte final non validé.
export const TEXTES_MORCEAU_M03: TextesMorceau = {
  noms: {
    energie: { texte: 'local énergie', genre: 'm', nombre: 's', elision: false },
    reserve: { texte: 'réserve', genre: 'f', nombre: 's', elision: false },
    console: { texte: 'console de départ', genre: 'f', nombre: 's', elision: false },
    bloc: { texte: 'bloc d’énergie', genre: 'm', nombre: 's', elision: false },
  },
  descriptions: {
    energie: [
      'Des armoires électriques ronronnent à peine. Contre un mur, une console surmontée d’un gros relais.',
      'Le local énergie est tiède. Des câbles courent le long des murs jusqu’à une console et son relais.',
    ],
    reserve: [
      'Une réserve étroite, des étagères chargées de cartons et de pièces détachées. Le fond reste dans l’ombre.',
      'Des étagères jusqu’au plafond, des cartons éventrés. La lumière n’atteint pas le fond de la réserve.',
    ],
    console: [
      'Une console marquée « circuit de départ », avec son levier de réarmement. Sur le relais, une étiquette : « bruyant ».',
      'La console du circuit de départ. Au-dessus, un gros relais ; une étiquette prévient qu’il claque fort au réarmement.',
    ],
    bloc: [
      'Un bloc d’énergie de secours, lourd et chargé. Son connecteur s’adapte aux capsules ; il faut les deux bras pour le porter.',
      'Un bloc d’énergie large et pesant, muni d’un connecteur pour capsule de secours. Il occupe les deux bras.',
    ],
    capsule: [
      'Une capsule de secours arrimée au quai. Une plaque indique deux alimentations : le circuit de départ, ou une source branchée sous la trappe.',
      'La capsule de secours est arrimée au quai. Sous une trappe, un connecteur accepte une source compatible ; une plaque renvoie aussi au circuit de départ.',
    ],
  },
  assistance: {
    energie: 'Le circuit de départ se réarme depuis sa console ; son relais est bruyant. Une source locale compatible peut aussi alimenter la capsule.',
  },
};
