import {
  autreCote,
  cleZone,
  creatureEnVue,
  enFeu,
  huilee,
  liaisonsDe,
  liaisonsVisibles,
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
import { LONGTEMPS, palier } from './anciennete';
import type { Danger, Evenement, NiveauRisque, Palier } from './vocabulaire';

// Réaction de la créature (C-03 §3 étape 4, §4) : perception réelle, une réaction par action engagée, sans patrouille.

export type Intensite = 'normal' | 'fort';

/** Son produit pendant l'action, actif pendant la réaction de ce pas ; `alcove` : sa source est dans l'alcôve de la pièce. */
export interface SonEmis {
  readonly piece: string;
  readonly intensite: Intensite;
  readonly alcove?: boolean;
}

const FORCE: Readonly<Record<Intensite, number>> = { normal: 1, fort: 2 };

/** Réactions perdues après une glissade sur un sol huilé inconnu (C-03 §5.2). */
export const REACTIONS_PERDUES = 2;

function laissePasserLeSon(etat: EtatPartie, liaison: DefLiaison): boolean {
  return etat.liaisons[liaison.id] === true || liaison.sonAuTravers === true;
}

/**
 * La créature est large : elle ne franchit qu'une liaison ouverte et non étroite, jamais une cloison fermée (D-044, D-047) ;
 * elle n'entre jamais dans une pièce en feu (D-189).
 */
function praticable(etat: EtatPartie, liaison: DefLiaison, depuis: string): boolean {
  return etat.liaisons[liaison.id] === true && liaison.etroite !== true && !enFeu(etat, autreCote(liaison, depuis));
}

/** Plus court chemin de liaisons acceptées, dans l'ordre stable du monde ; `null` si aucun. */
function chemin(
  monde: DefMonde,
  depart: string,
  arrivee: string,
  accepte: (liaison: DefLiaison, depuis: string) => boolean,
): DefLiaison[] | null {
  const venu = new Map<string, DefLiaison | null>([[depart, null]]);
  const file = [depart];
  for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
    if (piece === arrivee) break;
    for (const liaison of liaisonsDe(monde, piece)) {
      const voisine = autreCote(liaison, piece);
      if (venu.has(voisine) || !accepte(liaison, piece)) continue;
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
  const voie = chemin(monde, depuis, cible, (liaison, piece) => praticable(etat, liaison, piece));
  if (voie !== null) return voie[0];
  const premier = chemin(monde, depuis, cible, (liaison) => laissePasserLeSon(etat, liaison))?.[0];
  return premier !== undefined && praticable(etat, premier, depuis) ? premier : undefined;
}

interface Percu {
  readonly evenement: Evenement;
  /** Bruit entendu : pièce d'où il vient et liaison qui le laisse passer ; absent quand il la voit. */
  readonly entendue?: BruitCreature;
}

/**
 * Ce que le passager perçoit d'un mouvement : il la voit entrer ou glisser dans sa pièce, ou l'entend bouger dans une pièce
 * voisine (OP-01). `glisse` : la pièce où elle a glissé, s'il y en a une.
 */
function percuParLePassager(
  monde: DefMonde,
  etat: EtatPartie,
  liaison: DefLiaison,
  depart: string,
  arrivee: string,
  glisse: string | null,
): Percu | undefined {
  const passage = refPassage(monde, etat, liaison, etat.piece === depart ? depart : arrivee);
  if (glisse === etat.piece) return { evenement: { type: 'creature_glisse', passage } };
  if (arrivee === etat.piece) return { evenement: { type: 'creature_entre', passage } };
  for (const piece of [arrivee, depart]) {
    const voisine = liaisonsVisibles(monde, etat, etat.piece).find((lien) => autreCote(lien, etat.piece) === piece && laissePasserLeSon(etat, lien));
    if (voisine !== undefined) {
      return { evenement: { type: 'bruit_creature', passage: refPassage(monde, etat, voisine, etat.piece) }, entendue: { piece, par: voisine.id } };
    }
  }
  return undefined;
}

interface Reponse {
  readonly creature: EtatCreature;
  readonly evenements: Evenement[];
  readonly entendue?: BruitCreature;
  /** Liaison qu'elle a franchie jusqu'au bout pendant cette réaction. */
  readonly franchie?: string;
}

/** Créature encore active, donc dans la station (D-062). */
type CreatureActive = EtatCreature & { readonly piece: string };

/**
 * Franchir `liaison` vers l'indice (C-03 §5.2) : un sol huilé connu se franchit prudemment, en deux réactions ; inconnu, elle
 * glisse là où il se trouve, côté arrivée d'abord, sa réaction s'arrête et les deux suivantes sont perdues.
 */
function franchir(monde: DefMonde, etat: EtatPartie, creature: CreatureActive, liaison: DefLiaison, indice: Indice): Reponse {
  const depart = creature.piece;
  const arrivee = autreCote(liaison, depart);
  const zones = [arrivee, depart].filter((piece) => huilee(etat, liaison.id, piece));
  const inconnue = zones.find((piece) => !creature.connues.includes(cleZone({ liaison: liaison.id, piece })));
  if (zones.length > 0 && inconnue === undefined && creature.engagee !== liaison.id) {
    return { creature: { ...creature, indice, engagee: liaison.id }, evenements: [] };
  }
  const glisse = inconnue ?? null;
  const piece = glisse ?? arrivee;
  const suite: EtatCreature = {
    ...creature,
    piece,
    alcove: false,
    engagee: null,
    indice: piece === indice.piece ? null : indice,
    ...(glisse === null
      ? {}
      : { perdues: REACTIONS_PERDUES, connues: [...creature.connues, cleZone({ liaison: liaison.id, piece: glisse })].sort() }),
  };
  // Glissée sans changer de pièce, elle est vue si le passager y est, entendue s'il est à côté.
  const percu = percuParLePassager(monde, etat, liaison, depart, piece, glisse);
  const passee = piece === arrivee ? { franchie: liaison.id } : {};
  if (percu === undefined) return { creature: suite, evenements: [], ...passee };
  return { creature: suite, evenements: [percu.evenement], ...passee, ...(percu.entendue === undefined ? {} : { entendue: percu.entendue }) };
}

/** Une réaction (C-03 §4.2) : joueur visible, sinon son actif, sinon dernier indice, sinon attendre. */
function reaction(
  monde: DefMonde,
  etat: EtatPartie,
  creature: CreatureActive,
  sons: readonly SonEmis[],
  depuis: string,
  franchie: string | undefined,
  interceptee: boolean,
): Reponse {
  if (interceptee) {
    // Le jet consomme sa réaction (C-04 §4.2, D-055) ; s'il est parti, elle l'a vu prendre ce passage (D-177).
    const parti = creature.piece === depuis && etat.piece !== depuis;
    return { creature: { ...creature, indice: parti ? { piece: etat.piece, par: franchie ?? null } : null }, evenements: [] };
  }
  // Après une glissade, réactions perdues : ni mouvement ni regard (C-03 §5.2, T-05).
  if (creature.perdues > 0) return { creature: { ...creature, perdues: creature.perdues - 1 }, evenements: [] };
  if (creature.piece === etat.piece && !creature.alcove) {
    // L'avertissement donne une action pour réagir avant toute conséquence hostile (C-03 §4.4).
    return { creature: { ...creature, indice: null, engagee: null }, evenements: creature.contact ? [{ type: 'menace' }] : [] };
  }
  if (creature.piece === depuis && !creature.alcove) {
    // Elle l'a vu partir : sa réaction est de retenir le passage pris, qu'elle suivra au pas suivant (D-177).
    return { creature: { ...creature, indice: { piece: etat.piece, par: franchie ?? null }, engagee: null }, evenements: [] };
  }
  const son = sonRetenu(monde, etat, creature.piece, sons);
  if (son !== undefined && son.piece === creature.piece) {
    // Elle rejoint la source, dans l'alcôve ou hors d'elle : repositionnement local, puis elle y cherche (C-03 §4.3, §5.1).
    return { creature: { ...creature, indice: null, engagee: null, alcove: son.alcove === true }, evenements: [] };
  }
  const indice: Indice | null = son === undefined ? creature.indice : { piece: son.piece, par: null };
  if (indice === null) return { creature, evenements: [] };
  if (indice.piece === creature.piece) return { creature: { ...creature, indice: null }, evenements: [] };
  // Sortir de l'alcôve est un repositionnement local : une réaction (C-03 §4.3).
  if (creature.alcove) return { creature: { ...creature, indice, alcove: false }, evenements: [] };
  const liaison = indice.par === null ? pasVers(monde, etat, creature.piece, indice.piece) : passageSuivi(monde, etat, creature.piece, indice);
  if (liaison === undefined) return { creature: { ...creature, indice, engagee: null }, evenements: [] };
  return franchir(monde, etat, creature, liaison, indice);
}

/** Le passage qu'elle l'a vu prendre, s'il lui est encore praticable : une porte refermée ou un passage étroit l'arrête (D-177). */
function passageSuivi(monde: DefMonde, etat: EtatPartie, depuis: string, indice: Indice): DefLiaison | undefined {
  const liaison = liaisonsDe(monde, depuis).find((lien) => lien.id === indice.par && autreCote(lien, depuis) === indice.piece);
  return liaison !== undefined && praticable(etat, liaison, depuis) ? liaison : undefined;
}


/**
 * Ce que le passager retient à la fin du pas : la dernière vue et le dernier bruit, chacun gardé à part (D-180, D-181).
 * Ce qu'il voit de sa pièce remplace ce qu'il en savait : la créature, ou la pièce vide. La voir fait oublier le bruit,
 * puisqu'on sait où elle est ; sinon un bruit ne vieillit pas.
 */
function retenir(etat: EtatPartie, entendue: BruitCreature | undefined): Reperes {
  const { vue, entendue: bruit } = etat.reperes;
  const ici = etat.piece;
  if (creatureEnVue(etat)) return { vue: { piece: ici, depuis: 0 }, entendue: null };
  return {
    vue: vue === null || vue.piece === ici ? null : { ...vue, depuis: Math.min(vue.depuis + 1, LONGTEMPS) },
    entendue: entendue ?? (bruit?.piece === ici ? null : bruit),
  };
}

/**
 * Étapes 4 et 5 d'un pas (C-03 §3) : la réaction, puis l'annonce du premier contact si la créature et le passager se retrouvent.
 * `depuis` : pièce du passager avant l'action ; `franchie` : liaison qu'il vient de prendre, s'il a changé de pièce ;
 * `interceptee` : un jet d'interception a déjà consommé la réaction de ce pas.
 */
export function reagir(
  monde: DefMonde,
  etat: EtatPartie,
  sons: readonly SonEmis[],
  depuis: string,
  franchie: string | undefined,
  interceptee: boolean,
): { etat: EtatPartie; evenements: Evenement[] } {
  if (etat.creature === null) return { etat, evenements: [] };
  const { piece } = etat.creature;
  // Inerte ou expulsée, elle ne réagit plus jamais ; le passager retient seulement ce qu'il voit (D-062).
  if (etat.creature.neutralisee !== undefined || piece === null) {
    return { etat: { ...etat, creature: { ...etat.creature, repit: false }, reperes: retenir(etat, undefined) }, evenements: [] };
  }
  const reponse = reaction(monde, etat, { ...etat.creature, piece }, sons, depuis, franchie, interceptee);
  // Le répit ne vaut que pour l'action qui suit le premier contact (D-184).
  const creature = etat.creature.repit ? sansGarde({ ...reponse.creature, repit: false }) : reponse.creature;
  const apres: EtatPartie = { ...etat, creature };
  const suite: EtatPartie = { ...apres, reperes: retenir(apres, reponse.entendue) };
  if (creatureEnVue(suite) && !creature.contact) {
    // Entrée dans sa pièce, elle se tient devant le passage qu'elle vient de franchir (D-195).
    const garde = creature.piece === suite.piece && piece !== suite.piece && reponse.franchie !== undefined ? { garde: reponse.franchie } : {};
    return {
      etat: { ...suite, creature: { ...creature, contact: true, repit: true, ...garde } },
      evenements: [...reponse.evenements, { type: 'premier_contact' }],
    };
  }
  return { etat: suite, evenements: reponse.evenements };
}

function sansGarde(creature: EtatCreature): EtatCreature {
  const { garde, ...reste } = creature;
  return garde === undefined ? creature : reste;
}

/** Ancienneté d'une vue (D-151), en type de danger. */
function anciennete(vue: VueCreature): `creature_vue_${Palier}` {
  return `creature_vue_${palier(vue.depuis)}` as const;
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
