import {
  autreCote,
  liaisonsDe,
  refPassage,
  refPiece,
  type BruitCreature,
  type EtatCreature,
  type EtatPartie,
  type Indice,
  type Reperes,
  type VueCreature,
} from './etat';
import { indexer, type DefLiaison, type DefMonde } from './monde';
import type { Danger, Evenement, NiveauRisque } from './vocabulaire';

// Réaction de la créature (C-03 §3 étape 4, §4) : perception réelle, une réaction par action engagée, sans patrouille.

export type Intensite = 'normal' | 'fort';

/** Son produit pendant l'action, actif pendant la réaction de ce pas. */
export interface SonEmis {
  readonly piece: string;
  readonly intensite: Intensite;
}

const FORCE: Readonly<Record<Intensite, number>> = { normal: 1, fort: 2 };

function laissePasserLeSon(etat: EtatPartie, liaison: DefLiaison): boolean {
  return etat.liaisons[liaison.id] === true || liaison.sonAuTravers === true;
}

/** La créature est large : elle ne franchit qu'une liaison ouverte et non étroite, jamais une cloison fermée (D-044, D-047). */
function praticable(etat: EtatPartie, liaison: DefLiaison): boolean {
  return etat.liaisons[liaison.id] === true && liaison.etroite !== true;
}

/** Plus court chemin de liaisons acceptées, dans l'ordre stable du monde ; `null` si aucun. */
function chemin(monde: DefMonde, depart: string, arrivee: string, accepte: (liaison: DefLiaison) => boolean): DefLiaison[] | null {
  const venu = new Map<string, DefLiaison | null>([[depart, null]]);
  const file = [depart];
  for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
    if (piece === arrivee) break;
    for (const liaison of liaisonsDe(monde, piece)) {
      const voisine = autreCote(liaison, piece);
      if (venu.has(voisine) || !accepte(liaison)) continue;
      venu.set(voisine, liaison);
      file.push(voisine);
    }
  }
  if (!venu.has(arrivee)) return null;
  const pas: DefLiaison[] = [];
  for (let piece = arrivee, liaison = venu.get(piece); liaison !== null && liaison !== undefined; liaison = venu.get(piece)) {
    pas.unshift(liaison);
    piece = autreCote(liaison, piece);
  }
  return pas;
}

/** Son actif retenu (C-03 §4.2) : le plus fort parmi ceux qui arrivent jusqu'à elle ; à égalité, le plus récent. */
export function sonRetenu(monde: DefMonde, etat: EtatPartie, depuis: string, sons: readonly SonEmis[]): SonEmis | undefined {
  let retenu: SonEmis | undefined;
  for (const son of sons) {
    if (chemin(monde, depuis, son.piece, (liaison) => laissePasserLeSon(etat, liaison)) === null) continue;
    if (retenu === undefined || FORCE[son.intensite] >= FORCE[retenu.intensite]) retenu = son;
  }
  return retenu;
}

/**
 * Un pas vers l'indice : par une voie réellement praticable, sinon le long du chemin du son jusqu'à la
 * séparation qui la bloque (C-03 §4.3). Au plus une liaison franchie.
 */
function pasVers(monde: DefMonde, etat: EtatPartie, depuis: string, cible: string): DefLiaison | undefined {
  const voie = chemin(monde, depuis, cible, (liaison) => praticable(etat, liaison));
  if (voie !== null) return voie[0];
  const premier = chemin(monde, depuis, cible, (liaison) => laissePasserLeSon(etat, liaison))?.[0];
  return premier !== undefined && praticable(etat, premier) ? premier : undefined;
}

interface Percu {
  readonly evenement: Evenement;
  /** Bruit entendu : pièce d'où il vient et liaison qui le laisse passer ; absent quand il la voit entrer. */
  readonly entendue?: BruitCreature;
}

/** Ce que le passager perçoit d'un mouvement : il le voit entrer, ou l'entend bouger dans une pièce voisine (OP-01). */
function percuParLePassager(monde: DefMonde, etat: EtatPartie, liaison: DefLiaison, depart: string, arrivee: string): Percu | undefined {
  if (arrivee === etat.piece) return { evenement: { type: 'creature_entre', passage: refPassage(monde, etat, liaison, etat.piece) } };
  for (const piece of [arrivee, depart]) {
    const voisine = liaisonsDe(monde, etat.piece).find((lien) => autreCote(lien, etat.piece) === piece && laissePasserLeSon(etat, lien));
    if (voisine !== undefined) {
      return { evenement: { type: 'bruit_creature', passage: refPassage(monde, etat, voisine, etat.piece) }, entendue: { piece, par: voisine.id } };
    }
  }
  return undefined;
}

/** Une réaction (C-03 §4.2) : joueur visible, sinon son actif, sinon dernier indice, sinon attendre. */
function reaction(
  monde: DefMonde,
  etat: EtatPartie,
  creature: EtatCreature,
  sons: readonly SonEmis[],
  depuis: string,
  franchie: string | undefined,
): { creature: EtatCreature; evenements: Evenement[]; entendue?: BruitCreature } {
  if (creature.piece === etat.piece) {
    // L'avertissement donne une action pour réagir avant toute conséquence hostile (C-03 §4.4).
    return { creature: { ...creature, indice: null }, evenements: creature.contact ? [{ type: 'menace' }] : [] };
  }
  if (creature.piece === depuis) {
    // Elle l'a vu partir : sa réaction est de retenir le passage pris, qu'elle suivra au pas suivant (D-177).
    return { creature: { ...creature, indice: { piece: etat.piece, par: franchie ?? null } }, evenements: [] };
  }
  const son = sonRetenu(monde, etat, creature.piece, sons);
  const indice: Indice | null = son === undefined ? creature.indice : { piece: son.piece, par: null };
  if (indice === null) return { creature, evenements: [] };
  if (indice.piece === creature.piece) return { creature: { ...creature, indice: null }, evenements: [] };
  const liaison = indice.par === null ? pasVers(monde, etat, creature.piece, indice.piece) : passageSuivi(monde, etat, creature.piece, indice);
  if (liaison === undefined) return { creature: { ...creature, indice }, evenements: [] };
  const arrivee = autreCote(liaison, creature.piece);
  const percu = percuParLePassager(monde, etat, liaison, creature.piece, arrivee);
  const suite: EtatCreature = { piece: arrivee, indice: arrivee === indice.piece ? null : indice, contact: creature.contact };
  if (percu === undefined) return { creature: suite, evenements: [] };
  return { creature: suite, evenements: [percu.evenement], ...(percu.entendue === undefined ? {} : { entendue: percu.entendue }) };
}

/** Le passage qu'elle l'a vu prendre, s'il lui est encore praticable : une porte refermée ou un passage étroit l'arrête (D-177). */
function passageSuivi(monde: DefMonde, etat: EtatPartie, depuis: string, indice: Indice): DefLiaison | undefined {
  const liaison = liaisonsDe(monde, depuis).find((lien) => lien.id === indice.par && autreCote(lien, depuis) === indice.piece);
  return liaison !== undefined && praticable(etat, liaison) ? liaison : undefined;
}

/** Seuil de « il y a longtemps », en actions confirmées (D-151). */
const LONGTEMPS = 6;

/**
 * Ce que le passager retient à la fin du pas : la dernière vue et le dernier bruit, chacun gardé à part (D-180, D-181).
 * Ce qu'il voit de sa pièce remplace ce qu'il en savait : la créature, ou la pièce vide. La voir fait oublier le bruit,
 * puisqu'on sait où elle est ; sinon un bruit ne vieillit pas.
 */
function retenir(etat: EtatPartie, creature: EtatCreature, entendue: BruitCreature | undefined): Reperes {
  const { vue, entendue: bruit } = etat.reperes;
  const ici = etat.piece;
  if (creature.piece === ici) return { vue: { piece: ici, depuis: 0 }, entendue: null };
  return {
    vue: vue === null || vue.piece === ici ? null : { ...vue, depuis: Math.min(vue.depuis + 1, LONGTEMPS) },
    entendue: entendue ?? (bruit?.piece === ici ? null : bruit),
  };
}

/**
 * Étapes 4 et 5 d'un pas (C-03 §3) : la réaction, puis l'annonce du premier contact si la créature et le passager se retrouvent.
 * `depuis` : pièce du passager avant l'action ; `franchie` : liaison qu'il vient de prendre, s'il a changé de pièce.
 */
export function reagir(
  monde: DefMonde,
  etat: EtatPartie,
  sons: readonly SonEmis[],
  depuis: string,
  franchie: string | undefined,
): { etat: EtatPartie; evenements: Evenement[] } {
  if (etat.creature === null) return { etat, evenements: [] };
  const { creature, evenements, entendue } = reaction(monde, etat, etat.creature, sons, depuis, franchie);
  const suite: EtatPartie = { ...etat, creature, reperes: retenir(etat, creature, entendue) };
  if (creature.piece === etat.piece && !creature.contact) {
    return { etat: { ...suite, creature: { ...creature, contact: true } }, evenements: [...evenements, { type: 'premier_contact' }] };
  }
  return { etat: suite, evenements };
}

/** Ancienneté d'une vue (D-151) : 1 action au plus, 2 à 5, 6 et plus. */
function anciennete(vue: VueCreature): 'creature_vue_instant' | 'creature_vue_moment' | 'creature_vue_longtemps' {
  if (vue.depuis <= 1) return 'creature_vue_instant';
  return vue.depuis < LONGTEMPS ? 'creature_vue_moment' : 'creature_vue_longtemps';
}

/**
 * Danger connu derrière un passage vers `piece`, d'après les repères du passager seulement (C-06 §4) : vue à l'instant ou
 * il y a un moment, élevé ; vue il y a longtemps, modéré (D-180) ; entendue, modéré (D-181). Le plus haut l'emporte ;
 * à égalité, le bruit, situé par son passage.
 */
export function dangerConnu(monde: DefMonde, etat: EtatPartie, piece: string): { risque: NiveauRisque; danger: Danger } | null {
  const { vue, entendue } = etat.reperes;
  const type = vue?.piece === piece ? anciennete(vue) : null;
  if (type !== null && type !== 'creature_vue_longtemps') return { risque: 'eleve', danger: { type, piece: refPiece(monde, piece) } };
  const liaison = entendue?.piece === piece ? indexer(monde).liaisons.get(entendue.par) : undefined;
  if (liaison !== undefined) {
    return { risque: 'modere', danger: { type: 'creature_entendue', passage: refPassage(monde, etat, liaison, autreCote(liaison, piece)) } };
  }
  return type === null ? null : { risque: 'modere', danger: { type, piece: refPiece(monde, piece) } };
}
