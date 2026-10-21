import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';

// Carrefour de l'ordre libre (13 §8.3, D-254, D-259, spec L5 §3). Le couloir commun dessert les deux branches et la première
// cloison ; le sas est entre les deux cloisons, la seconde mène au morceau final. Toutes deux sont verrouillées : chacune ne
// s'ouvre qu'une fois sa commande actionnée, au fond de l'une des branches. Ni objet, ni créature, ni danger. Les cloisons
// sont portées ici plutôt que par l'entrée du final, pour laisser M-03 et M-06 intacts (spec L5 §3.2).
//
//   (vestibule) ══ couloir ══cloison 1 (verrouillée)══ sas ══cloison 2 (verrouillée)══ (final)
//                    ╠══ (branche A)
//                    ╚══ (branche B)
export const MORCEAU_CARREFOUR: DefMorceau = {
  id: 'carrefour',
  famille: 'carrefour',
  // Tuile (14 §4.3) : un long couloir, le sas à son bout ; les branches, longues, s'accrochent de part et d'autre du couloir
  // (forme retenue parmi plusieurs essayées : 100 % de plans sur les paires les plus longues, spec L5 §3.2).
  pieces: [
    { id: 'p-couloir', nom: 'couloir_commun', plan: { x: 0, y: 0, largeur: 16, hauteur: 3 } },
    { id: 'p-sas', nom: 'sas', plan: { x: 16, y: 0, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [{ id: 'l-cloison-1', nom: 'cloison_1', entre: ['p-couloir', 'p-sas'], ouverte: false, verrouillee: true }],
  objets: [],
  entree: 'p-couloir',
  sortie: { piece: 'p-sas', porte: { nom: 'cloison_2', verrouillee: true } },
  placesCreature: [],
  demande: [],
  fournit: [],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { accueillantes: { 'p-couloir': 'circulation' }, avant: ['p-couloir'], coupe: ['l-cloison-1'] },
  assistance: [{ id: 'carrefour', quand: { type: 'arrivee', piece: 'p-couloir' } }],
};

/** Identifiant de la première cloison dans la station, et de la seconde, porte entre le carrefour et le final (`l-<de>-<vers>`). */
export const CLOISON_1 = 'carrefour/l-cloison-1';
export const cloison2 = (final: string): string => `l-carrefour-${final}`;

// Textes du morceau (C-07). Texte final non validé.
export const TEXTES_MORCEAU_CARREFOUR: TextesMorceau = {
  // Les deux cloisons s'appellent « cloison » : leur destination les distingue (« la cloison du sas », « la cloison du local
  // énergie ») ; les commandes disent quel verrou elles lèvent, le premier côté couloir, le second au fond du sas.
  noms: {
    couloir_commun: { texte: 'couloir commun', genre: 'm', nombre: 's', elision: false },
    sas: { texte: 'sas', genre: 'm', nombre: 's', elision: false },
    cloison_1: { texte: 'cloison', genre: 'f', nombre: 's', elision: false },
    cloison_2: { texte: 'cloison', genre: 'f', nombre: 's', elision: false },
    commande_1: { texte: 'commande du premier verrou du sas', genre: 'f', nombre: 's', elision: false },
    commande_2: { texte: 'commande du second verrou du sas', genre: 'f', nombre: 's', elision: false },
  },
  descriptions: {
    couloir_commun: [
      'Un long couloir de jonction. Des portes s’ouvrent de part et d’autre ; au bout, une cloison blindée sous un voyant rouge.',
      'Le couloir dessert deux ailes. Tout au bout, une cloison blindée, un voyant rouge au-dessus du cadre.',
    ],
    sas: [
      'Un sas étroit entre deux cloisons blindées. Chacune porte son propre voyant.',
      'Un sas aux parois nues, coincé entre deux cloisons épaisses. Une plaque : « Embarquement, accès contrôlé ».',
    ],
    cloison_1: [
      'Une cloison blindée, sans poignée apparente. Une plaque : « Premier verrou du sas, commandé à distance ».',
      'Une cloison épaisse, côté couloir. Sous le voyant : « Premier verrou du sas ».',
    ],
    cloison_2: [
      'Une cloison blindée au fond du sas. Une plaque : « Second verrou du sas, commandé à distance ».',
      'Une cloison épaisse, sans poignée apparente. Sous le voyant : « Second verrou du sas ».',
    ],
    commande_1: [
      'Un levier sous un capot jaune. Sa plaque : « Premier verrou du sas ».',
      'Une commande murale à levier, marquée « Sas : premier verrou ».',
    ],
    commande_2: [
      'Un levier sous un capot jaune. Sa plaque : « Second verrou du sas ».',
      'Une commande murale à levier, marquée « Sas : second verrou ».',
    ],
  },
  assistance: {
    carrefour:
      'Accès à l’embarquement : le sas a deux verrous. Chacun se lève depuis sa commande, au bout de l’une des deux ailes. L’ordre est libre.',
  },
};
