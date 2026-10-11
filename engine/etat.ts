import { generateurDepuisGraine, type EtatGenerateur } from './des';
import { indexer, type DefLiaison, type DefMonde, type DefObjet } from './monde';
import type { RefObjet, RefPassage, RefPiece, Sante } from './vocabulaire';

export type EmplacementObjet = { readonly type: 'piece'; readonly piece: string } | { readonly type: 'passager' };

/** Dernier indice perçu non encore inspecté (C-03 §4.2). */
export interface Indice {
  readonly piece: string;
  /** Départ du passager vu par la créature : elle ne le suit que par ce passage (D-177). */
  readonly par: string | null;
}

/** Créature (C-02 §4.2) : emplacement, dernier indice, premier contact annoncé. */
export interface EtatCreature {
  readonly piece: string;
  readonly indice: Indice | null;
  readonly contact: boolean;
  /** L'action qui suit le premier contact est libre : ni dé ni blessure (C-03 §4.4, D-184). */
  readonly repit: boolean;
}

/** Dernière vue de la créature (D-180) : actions confirmées depuis, plafonné à « il y a longtemps » (D-151) pour un état fini. */
export interface VueCreature {
  readonly piece: string;
  readonly depuis: number;
}

/** Dernier bruit de la créature entendu (D-181) : pièce d'où il venait et liaison qui le laissait passer (OP-01). */
export interface BruitCreature {
  readonly piece: string;
  readonly par: string;
}

/** Ce que le passager sait de la créature ; voir une pièce vide efface ce qui la concerne. */
export interface Reperes {
  readonly vue: VueCreature | null;
  readonly entendue: BruitCreature | null;
}

/** État complet d'une partie : sérialisable en JSON, jamais montré tel quel au joueur. */
export interface EtatPartie {
  readonly piece: string;
  readonly objets: Readonly<Record<string, EmplacementObjet>>;
  /** Vrai quand la liaison est ouverte ; un seul état vu des deux côtés (C-02 §3). */
  readonly liaisons: Readonly<Record<string, boolean>>;
  readonly visitees: readonly string[];
  readonly actions: number;
  readonly generateur: EtatGenerateur;
  /** `null` dans un monde sans créature. */
  readonly creature: EtatCreature | null;
  readonly reperes: Reperes;
  readonly sante: Sante;
  /** Doses restantes des objets de soin (C-02 §4.3). */
  readonly doses: Readonly<Record<string, number>>;
}

export function etatInitial(monde: DefMonde, graine: number): EtatPartie {
  indexer(monde);
  return {
    piece: monde.depart,
    objets: Object.fromEntries(monde.objets.map((objet) => [objet.id, { type: 'piece', piece: objet.piece }])),
    liaisons: Object.fromEntries(monde.liaisons.map((liaison) => [liaison.id, liaison.ouverte])),
    visitees: [monde.depart],
    actions: 0,
    generateur: generateurDepuisGraine(graine),
    creature: monde.creature === undefined ? null : { piece: monde.creature.piece, indice: null, contact: false, repit: false },
    reperes: { vue: null, entendue: null },
    sante: 'indemne',
    doses: Object.fromEntries(monde.objets.flatMap((objet) => (objet.soin === undefined ? [] : [[objet.id, objet.soin]]))),
  };
}

export function liaisonsDe(monde: DefMonde, piece: string): DefLiaison[] {
  return monde.liaisons.filter((liaison) => liaison.entre.includes(piece));
}

export function autreCote(liaison: DefLiaison, piece: string): string {
  return liaison.entre[0] === piece ? liaison.entre[1] : liaison.entre[0];
}

export function objetsDans(monde: DefMonde, etat: EtatPartie, piece: string): DefObjet[] {
  return monde.objets.filter((objet) => {
    const emplacement = etat.objets[objet.id];
    return emplacement?.type === 'piece' && emplacement.piece === piece;
  });
}

export function objetsPortes(monde: DefMonde, etat: EtatPartie): DefObjet[] {
  return monde.objets.filter((objet) => etat.objets[objet.id]?.type === 'passager');
}

function publicDe(monde: DefMonde, id: string): string {
  const publicId = indexer(monde).versPublic.get(id);
  if (publicId === undefined) throw new Error(`Entité inconnue : ${id}.`);
  return publicId;
}

export function refPiece(monde: DefMonde, id: string): RefPiece {
  const piece = indexer(monde).pieces.get(id);
  if (piece === undefined) throw new Error(`Pièce inconnue : ${id}.`);
  return { sorte: 'piece', id: publicDe(monde, id), nom: piece.nom };
}

export function refObjet(monde: DefMonde, id: string): RefObjet {
  const objet = indexer(monde).objets.get(id);
  if (objet === undefined) throw new Error(`Objet inconnu : ${id}.`);
  return { sorte: 'objet', id: publicDe(monde, id), nom: objet.nom };
}

export function refPassage(monde: DefMonde, etat: EtatPartie, liaison: DefLiaison, depuis: string): RefPassage {
  return {
    sorte: 'passage',
    id: publicDe(monde, liaison.id),
    nom: liaison.nom,
    ouvert: etat.liaisons[liaison.id] === true,
    vers: refPiece(monde, autreCote(liaison, depuis)),
  };
}
