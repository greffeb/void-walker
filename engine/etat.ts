import { generateurDepuisGraine, type EtatGenerateur } from './des';
import { dosesDe, indexer, type DefLiaison, type DefMonde, type DefObjet } from './monde';
import type { RefObjet, RefPassage, RefPiece, RefPosition, Sante } from './vocabulaire';

export type EmplacementObjet =
  | { readonly type: 'piece'; readonly piece: string; readonly position?: string }
  | { readonly type: 'passager' };

/** Dernier indice perçu non encore inspecté (C-03 §4.2). */
export interface Indice {
  readonly piece: string;
  /** Départ du passager vu par la créature : elle ne le suit que par ce passage (D-177). */
  readonly par: string | null;
}

/** Créature (C-02 §4.2) : emplacement, dernier indice, premier contact annoncé, ralentissements. */
export interface EtatCreature {
  readonly piece: string;
  readonly indice: Indice | null;
  readonly contact: boolean;
  /** L'action qui suit le premier contact est libre : ni dé ni blessure (C-03 §4.4, D-184). */
  readonly repit: boolean;
  /** Dans l'alcôve de sa pièce, derrière la paroi opaque : elle ne voit pas le reste de la pièce (AR-01 §11.3). */
  readonly alcove: boolean;
  /** Réactions perdues restantes après une glissade (C-03 §5.2), de 2 à 0. */
  readonly perdues: number;
  /** Sols huilés qu'elle connaît (clés de zone) : elle les franchit prudemment (C-03 §5.2). */
  readonly connues: readonly string[];
  /** Passage huilé connu sur lequel elle s'est engagée : elle le franchira à la réaction suivante (C-03 §5.2). */
  readonly engagee: string | null;
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

/** Sol glissant au pied d'une liaison, du côté de `piece` (C-02 §4.4, D-190). */
export interface ZoneHuile {
  readonly liaison: string;
  readonly piece: string;
}

/** Test de l'avertisseur en cours (C-03 §5.1) : réactions encore couvertes par le son, celle du pas en cours comprise. */
export interface Alarme {
  readonly objet: string;
  readonly restant: number;
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
  /** Doses restantes des objets à doses : soin, extinction, liquide glissant (C-02 §4.3). */
  readonly doses: Readonly<Record<string, number>>;
  /** Pièces en feu, dans l'ordre du monde (C-03 §5.3). */
  readonly feu: readonly string[];
  /** Liaisons ouvertes depuis un foyer à la fin de l'action précédente : première exposition comptée (C-03 §5.3). */
  readonly expositions: readonly string[];
  readonly huile: readonly ZoneHuile[];
  readonly alarme: Alarme | null;
}

export function cleZone(zone: ZoneHuile): string {
  return `${zone.liaison}@${zone.piece}`;
}

export function etatInitial(monde: DefMonde, graine: number): EtatPartie {
  indexer(monde);
  return {
    piece: monde.depart,
    objets: Object.fromEntries(
      monde.objets.map((objet) => [objet.id, { type: 'piece', piece: objet.piece, ...(objet.position === undefined ? {} : { position: objet.position }) }]),
    ),
    liaisons: Object.fromEntries(monde.liaisons.map((liaison) => [liaison.id, liaison.ouverte])),
    visitees: [monde.depart],
    actions: 0,
    generateur: generateurDepuisGraine(graine),
    creature:
      monde.creature === undefined
        ? null
        : { piece: monde.creature.piece, indice: null, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null },
    reperes: { vue: null, entendue: null },
    sante: 'indemne',
    doses: Object.fromEntries(
      monde.objets.flatMap((objet) => {
        const doses = dosesDe(objet);
        return doses === undefined ? [] : [[objet.id, doses]];
      }),
    ),
    feu: monde.pieces.filter((piece) => piece.feu === true).map((piece) => piece.id),
    expositions: [],
    huile: [],
    alarme: null,
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

export function enFeu(etat: EtatPartie, piece: string): boolean {
  return etat.feu.includes(piece);
}

export function huilee(etat: EtatPartie, liaison: string, piece: string): boolean {
  return etat.huile.some((zone) => zone.liaison === liaison && zone.piece === piece);
}

/** Un appui stable est placé sous la liaison, du côté où elle est haute (C-02 §5, W-01). */
export function appuiSous(monde: DefMonde, etat: EtatPartie, liaison: string): boolean {
  const positions = indexer(monde).positions;
  return monde.objets.some((objet) => {
    const emplacement = etat.objets[objet.id];
    if (objet.appui !== true || emplacement?.type !== 'piece' || emplacement.position === undefined) return false;
    return positions.get(emplacement.position)?.sous === liaison;
  });
}

/** Liaison haute de ce côté et sans appui dessous : on ne l'atteint pas (12 §4.5). */
export function horsDePortee(monde: DefMonde, etat: EtatPartie, liaison: DefLiaison, depuis: string): boolean {
  return liaison.haute === depuis && !appuiSous(monde, etat, liaison.id);
}

/** La créature est dans la pièce du passager et le voit : hors de l'alcôve (AR-01 §11.3, C-06 §2). */
export function creatureEnVue(etat: EtatPartie): boolean {
  return etat.creature !== null && etat.creature.piece === etat.piece && !etat.creature.alcove;
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

export function refPosition(monde: DefMonde, id: string): RefPosition {
  const position = indexer(monde).positions.get(id);
  if (position === undefined) throw new Error(`Position inconnue : ${id}.`);
  return { sorte: 'position', id: publicDe(monde, id), nom: position.nom };
}

export function refPassage(monde: DefMonde, etat: EtatPartie, liaison: DefLiaison, depuis: string): RefPassage {
  const ouvert = etat.liaisons[liaison.id] === true;
  const vers = autreCote(liaison, depuis);
  return {
    sorte: 'passage',
    id: publicDe(monde, liaison.id),
    nom: liaison.nom,
    ouvert,
    vers: refPiece(monde, vers),
    feu: ouvert && enFeu(etat, vers),
    huile: huilee(etat, liaison.id, depuis),
  };
}
