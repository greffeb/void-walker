import { generateurDepuisGraine, type EtatGenerateur } from './des';
import { dosesDe, indexer, type DefLiaison, type DefMonde, type DefObjet } from './monde';
import type { RefObjet, RefPassage, RefPiece, RefPosition, Sante, SourceEvacuation } from './vocabulaire';

export type EmplacementObjet =
  | { readonly type: 'piece'; readonly piece: string; readonly position?: string }
  /** `enfile` : une protection portée sur soi, pas en main (C-02 §4.1, D-072/D-073). */
  | { readonly type: 'passager'; readonly enfile?: true }
  /** Installé dans une capsule : ni au sol ni porté. */
  | { readonly type: 'installe'; readonly dans: string };

/** Dernier indice perçu non encore inspecté (C-03 §4.2). */
export interface Indice {
  readonly piece: string;
  /** Départ du passager vu par la créature : elle ne le suit que par ce passage (D-177). */
  readonly par: string | null;
}

/** Créature (C-02 §4.2) : emplacement, dernier indice, premier contact annoncé, ralentissements. */
export interface EtatCreature {
  /** `null` une fois expulsée : elle n'a plus de position dans la station (VP-04). */
  readonly piece: string | null;
  /** Neutralisée par le vide, pour de bon : inerte sur place, ou expulsée (D-062) ; absente tant qu'elle est active. */
  readonly neutralisee?: 'inerte' | 'expulsee';
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
  /** Liaisons sans signalétique dont le passager connaît la destination, dans l'ordre du monde ; jamais oubliées (K-05). */
  readonly decouvertes: readonly string[];
  /** Consoles dont le circuit est activé, dans l'ordre du monde. */
  readonly actives: readonly string[];
  /** Vitrages extérieurs percés, brèches ouvertes, dans l'ordre du monde (C-02 §4.4). */
  readonly breches: readonly string[];
  /** Vitrages rebouchés et pas percés de nouveau, dans l'ordre du monde (D-066/D-068). */
  readonly rebouchees: readonly string[];
  /** Conclusion autre que la défaite : la capsule est partie. */
  readonly fin: 'evacuation' | null;
  /** Messages d'assistance déjà reçus, dans l'ordre de réception. */
  readonly messages: readonly string[];
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
    decouvertes: [],
    actives: [],
    breches: [],
    rebouchees: [],
    fin: null,
    messages: (monde.assistance ?? []).filter((message) => message.quand.type === 'reveil').map((message) => message.id),
  };
}

export function liaisonsDe(monde: DefMonde, piece: string): DefLiaison[] {
  return monde.liaisons.filter((liaison) => liaison.entre.includes(piece));
}

/** Une signalétique annonce la destination ; une liaison cachée n'en a pas. */
export function signalee(liaison: DefLiaison): boolean {
  return liaison.sansSignaletique !== true && liaison.cachee === undefined;
}

export function destinationConnue(etat: EtatPartie, liaison: DefLiaison): boolean {
  return signalee(liaison) || etat.decouvertes.includes(liaison.id);
}

/** Une liaison cachée n'existe pas, pour le passager, depuis sa pièce cachée tant qu'elle n'est pas découverte (K-05). */
export function perceptible(etat: EtatPartie, liaison: DefLiaison, depuis: string): boolean {
  return liaison.cachee !== depuis || etat.decouvertes.includes(liaison.id);
}

/** Liaisons de la pièce que le passager perçoit ; les règles physiques, elles, lisent `liaisonsDe`. */
export function liaisonsVisibles(monde: DefMonde, etat: EtatPartie, piece: string): DefLiaison[] {
  return liaisonsDe(monde, piece).filter((liaison) => perceptible(etat, liaison, piece));
}

/** On n'ouvre ni ne ferme une liaison manoeuvrée que depuis sa pièce de manoeuvre. */
export function manoeuvrable(liaison: DefLiaison, depuis: string): boolean {
  return liaison.manoeuvre === undefined || liaison.manoeuvre === depuis;
}

/** Ajoute la liaison aux découvertes, dans l'ordre du monde. */
export function decouvrir(monde: DefMonde, etat: EtatPartie, liaison: string): readonly string[] {
  if (etat.decouvertes.includes(liaison)) return etat.decouvertes;
  return monde.liaisons.filter((candidate) => candidate.id === liaison || etat.decouvertes.includes(candidate.id)).map((candidate) => candidate.id);
}

/** Un objet large porté interdit les liaisons étroites (D-044). */
export function porteLarge(monde: DefMonde, etat: EtatPartie): boolean {
  return objetsPortes(monde, etat).some((objet) => objet.large === true);
}

/** Ce qui alimente la capsule : un circuit activé qui la vise, puis une source installée dedans ; à défaut, sa propre réserve. */
export function sourcesDe(monde: DefMonde, etat: EtatPartie, capsule: string): SourceEvacuation[] {
  const circuit = monde.objets.some((objet) => objet.alimente === capsule && etat.actives.includes(objet.id));
  const bloc = monde.objets.some((objet) => {
    const emplacement = etat.objets[objet.id];
    return objet.source === true && emplacement?.type === 'installe' && emplacement.dans === capsule;
  });
  const sources: SourceEvacuation[] = [...(circuit ? (['circuit'] as const) : []), ...(bloc ? (['bloc'] as const) : [])];
  if (sources.length === 0 && indexer(monde).objets.get(capsule)?.capsule?.alimentee === true) return ['reserve'];
  return sources;
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

/** Portés en main : tout ce que le passager porte, sauf la combinaison enfilée. */
export function objetsEnMain(monde: DefMonde, etat: EtatPartie): DefObjet[] {
  return monde.objets.filter((objet) => {
    const emplacement = etat.objets[objet.id];
    return emplacement?.type === 'passager' && emplacement.enfile !== true;
  });
}

/** Protection enfilée, s'il y en a une (D-060). */
export function protectionEnfilee(monde: DefMonde, etat: EtatPartie): DefObjet | undefined {
  return monde.objets.find((objet) => {
    const emplacement = etat.objets[objet.id];
    return objet.protection === true && emplacement?.type === 'passager' && emplacement.enfile === true;
  });
}

/**
 * Pièces sans air, dans l'ordre du monde : reliées à une brèche ouverte par des passages ouverts ou jamais étanches ; ni
 * valeur intermédiaire ni délai (C-03 §5.4, D-061/D-067).
 */
export function piecesSansAir(monde: DefMonde, etat: EtatPartie): string[] {
  if (etat.breches.length === 0) return [];
  const atteintes = new Set<string>();
  for (const objet of monde.objets) {
    const emplacement = etat.objets[objet.id];
    if (etat.breches.includes(objet.id) && emplacement?.type === 'piece') atteintes.add(emplacement.piece);
  }
  const file = [...atteintes];
  for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
    for (const liaison of liaisonsDe(monde, piece)) {
      const voisine = autreCote(liaison, piece);
      if (atteintes.has(voisine) || (etat.liaisons[liaison.id] !== true && liaison.nonEtanche !== true)) continue;
      atteintes.add(voisine);
      file.push(voisine);
    }
  }
  return monde.pieces.filter((piece) => atteintes.has(piece.id)).map((piece) => piece.id);
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

/** La créature n'a pas été neutralisée par le vide : elle perçoit et réagit (D-062). */
export function creatureActive(etat: EtatPartie): boolean {
  return etat.creature !== null && etat.creature.neutralisee === undefined;
}

/** La créature active est dans la pièce du passager et le voit : hors de l'alcôve (AR-01 §11.3, C-06 §2). */
export function creatureEnVue(etat: EtatPartie): boolean {
  return creatureActive(etat) && etat.creature?.piece === etat.piece && etat.creature.alcove !== true;
}

/** Le corps inerte de la créature est dans la pièce du passager (D-062). */
export function corpsIci(etat: EtatPartie): boolean {
  return etat.creature?.neutralisee === 'inerte' && etat.creature.piece === etat.piece;
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
    vers: destinationConnue(etat, liaison) ? refPiece(monde, vers) : null,
    signale: signalee(liaison),
    feu: ouvert && enFeu(etat, vers),
    huile: huilee(etat, liaison.id, depuis),
    // Seule une porte étanche porte un voyant d'air (VP-03).
    vide: liaison.nonEtanche !== true && piecesSansAir(monde, etat).includes(vers),
  };
}
