import {
  assourdie,
  autreCote,
  cleZone,
  creatureEnVue,
  enFeu,
  huilee,
  liaisonsDe,
  liaisonsVisibles,
  pontSur,
  refObjet,
  refPassage,
  refPiece,
  sansGravite,
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

/**
 * Son produit pendant l'action, actif pendant la réaction de ce pas ; `alcove` : sa source est dans l'alcôve de la pièce ;
 * `relance` : le grand bruit des machines qui repartent, le seul qui sorte de leur salle (D-163).
 */
export interface SonEmis {
  readonly piece: string;
  readonly intensite: Intensite;
  readonly alcove?: boolean;
  readonly relance?: boolean;
}

const FORCE: Readonly<Record<Intensite, number>> = { normal: 1, fort: 2 };

/** Réactions perdues après une glissade sur un sol huilé inconnu (C-03 §5.2). */
export const REACTIONS_PERDUES = 2;

/** Réactions de plus pour dériver, gravité coupée, jusqu'à un autre passage de la zone (D-165, D-237). */
export const REACTIONS_DERIVE = 2;

function laissePasserLeSon(etat: EtatPartie, liaison: DefLiaison): boolean {
  return etat.liaisons[liaison.id] === true || liaison.sonAuTravers === true;
}

/**
 * La créature est large : elle ne franchit qu'une liaison ouverte et non étroite, jamais une cloison fermée (D-044, D-047) ;
 * elle n'entre jamais dans une pièce en feu (D-189). Un vide ne se franchit que sur un pont, qu'elle croit solide (D-164).
 */
function praticable(monde: DefMonde, etat: EtatPartie, liaison: DefLiaison, depuis: string): boolean {
  if (liaison.gouffre === true && pontSur(monde, etat, liaison.id) === undefined) return false;
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

/**
 * Un son arrive jusqu'à `depuis` par des liaisons qui le laissent passer, sans naître, entrer ni passer dans une salle des
 * machines en marche ; seule la relance sort de sa salle (D-163, D-235).
 */
function entendu(monde: DefMonde, etat: EtatPartie, depuis: string, son: SonEmis): boolean {
  const couverte = (piece: string): boolean => assourdie(monde, etat, piece) && !(son.relance === true && piece === son.piece);
  if (couverte(depuis) || couverte(son.piece)) return false;
  return chemin(monde, depuis, son.piece, (liaison, piece) => laissePasserLeSon(etat, liaison) && !couverte(autreCote(liaison, piece))) !== null;
}

/** Son actif retenu (C-03 §4.2) : le plus fort parmi ceux qui arrivent jusqu'à elle ; à égalité, le plus récent. */
export function sonRetenu(monde: DefMonde, etat: EtatPartie, depuis: string, sons: readonly SonEmis[]): SonEmis | undefined {
  let retenu: SonEmis | undefined;
  for (const son of sons) {
    if (!entendu(monde, etat, depuis, son)) continue;
    if (retenu === undefined || FORCE[son.intensite] >= FORCE[retenu.intensite]) retenu = son;
  }
  return retenu;
}

/**
 * Un pas vers l'indice : par une voie réellement praticable, sinon le long du chemin du son jusqu'à la
 * séparation qui la bloque (C-03 §4.3). Au plus une liaison franchie.
 */
function pasVers(monde: DefMonde, etat: EtatPartie, depuis: string, cible: string): DefLiaison | undefined {
  const voie = chemin(monde, depuis, cible, (liaison, piece) => praticable(monde, etat, liaison, piece));
  if (voie !== null) return voie[0];
  const premier = chemin(monde, depuis, cible, (liaison) => laissePasserLeSon(etat, liaison))?.[0];
  return premier !== undefined && praticable(monde, etat, premier, depuis) ? premier : undefined;
}

interface Percu {
  readonly evenement: Evenement;
  /** Bruit entendu : pièce d'où il vient et liaison qui le laisse passer ; absent quand il la voit. */
  readonly entendue?: BruitCreature;
}

/**
 * Ce que le passager perçoit d'un mouvement : il la voit entrer ou glisser dans sa pièce, ou l'entend bouger dans une pièce
 * voisine (OP-01), sauf si l'un ou l'autre est dans une salle des machines en marche (D-163). `glisse` : la pièce où elle a
 * glissé, s'il y en a une.
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
  if (assourdie(monde, etat, etat.piece)) return undefined;
  for (const piece of [arrivee, depart]) {
    if (assourdie(monde, etat, piece)) continue;
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
  /** Pont fragile tombé avec elle dans ce vide (D-164). */
  readonly perdu?: { readonly objet: string; readonly liaison: string };
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
  // Sur le pont fragile, elle tombe avant d'atteindre l'autre bord, sauf si elle glisse avant de s'y engager (D-164).
  if (liaison.gouffre === true && glisse !== depart) return tomber(monde, etat, creature, liaison);
  const piece = glisse ?? arrivee;
  // Dans une zone à gravité commutable, elle se tient au bord du passage par où elle est entrée (D-237).
  const bord = piece === arrivee && indexer(monde).pieces.get(arrivee)?.gravite !== undefined ? { bord: liaison.id } : piece === depart ? bordDe(creature) : {};
  const suite: EtatCreature = {
    ...sans(creature, 'derive', 'bord'),
    ...bord,
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

/** La créature sans ces champs facultatifs. */
function sans(creature: EtatCreature, ...cles: readonly ('bord' | 'derive' | 'garde')[]): EtatCreature {
  const copie = { ...creature };
  for (const cle of cles) delete copie[cle];
  return copie;
}

function bordDe(creature: EtatCreature): Pick<EtatCreature, 'bord'> {
  return creature.bord === undefined ? {} : { bord: creature.bord };
}

/**
 * Elle s'engage sur le pont fragile : il cède, elle tombe, neutralisée pour de bon, et le pont est perdu (D-164). Le passager
 * l'entend s'il est sur l'un des deux bords (D-236), ou dans une pièce voisine de l'un d'eux par un passage qui laisse passer
 * le son, comme tout mouvement de la créature (OP-01), sauf dans le vacarme d'une salle des machines (D-163).
 */
function tomber(monde: DefMonde, etat: EtatPartie, creature: CreatureActive, liaison: DefLiaison): Reponse {
  const pont = pontSur(monde, etat, liaison.id);
  const tombee: EtatCreature = { ...sans(creature, 'derive', 'bord', 'garde'), piece: null, neutralisee: 'tombee', indice: null, engagee: null, alcove: false, repit: false };
  if (pont === undefined) throw new Error(`Aucun pont sur ${liaison.id}.`);
  const perdu = { objet: pont.id, liaison: liaison.id };
  if (liaison.entre.includes(etat.piece)) {
    return { creature: tombee, evenements: [{ type: 'pont_cede', objet: refObjet(monde, pont.id), passage: refPassage(monde, etat, liaison, etat.piece) }], perdu };
  }
  const voisine = assourdie(monde, etat, etat.piece)
    ? undefined
    : liaisonsVisibles(monde, etat, etat.piece).find(
        (lien) => liaison.entre.includes(autreCote(lien, etat.piece)) && laissePasserLeSon(etat, lien) && !assourdie(monde, etat, autreCote(lien, etat.piece)),
      );
  const evenements: Evenement[] = voisine === undefined ? [] : [{ type: 'chute_entendue', passage: refPassage(monde, etat, voisine, etat.piece) }];
  return { creature: tombee, evenements, perdu };
}

/**
 * Gravité coupée, avant de franchir un autre passage que celui au bord duquel elle se tient, elle dérive jusqu'à lui deux
 * réactions (D-237) ; `undefined` si elle peut le franchir tout de suite.
 */
function deriver(etat: EtatPartie, creature: CreatureActive, liaison: DefLiaison, indice: Indice): Reponse | undefined {
  if (!sansGravite(etat, creature.piece) || creature.bord === liaison.id) return undefined;
  const restant = (creature.derive?.vers === liaison.id ? creature.derive.restant : REACTIONS_DERIVE) - 1;
  const reste = sans(creature, 'derive') as CreatureActive;
  if (restant > 0) return { creature: { ...reste, indice, engagee: null, derive: { vers: liaison.id, restant } }, evenements: [] };
  return { creature: { ...reste, indice, engagee: null, bord: liaison.id }, evenements: [] };
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
  return deriver(etat, creature, liaison, indice) ?? franchir(monde, etat, creature, liaison, indice);
}

/** Le passage qu'elle l'a vu prendre, s'il lui est encore praticable : une porte refermée ou un passage étroit l'arrête (D-177). */
function passageSuivi(monde: DefMonde, etat: EtatPartie, depuis: string, indice: Indice): DefLiaison | undefined {
  const liaison = liaisonsDe(monde, depuis).find((lien) => lien.id === indice.par && autreCote(lien, depuis) === indice.piece);
  return liaison !== undefined && praticable(monde, etat, liaison, depuis) ? liaison : undefined;
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
  const reponse = reagirRalentie(monde, etat, { ...etat.creature, piece }, sons, depuis, franchie, interceptee);
  // Le répit ne vaut que pour l'action qui suit le premier contact (D-184).
  const creature = etat.creature.repit ? sansGarde({ ...reponse.creature, repit: false }) : reponse.creature;
  const objets = reponse.perdu === undefined ? etat.objets : { ...etat.objets, [reponse.perdu.objet]: { type: 'perdu', liaison: reponse.perdu.liaison } as const };
  const apres: EtatPartie = { ...etat, objets, creature };
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

/**
 * Ralentie par le froid, elle n'agit qu'une réaction sur deux : la réaction sautée ne compte ni pour les réactions perdues de
 * l'huile ni pour sa dérive, qui se comptent sur celles qui restent (MX-01).
 */
function reagirRalentie(
  monde: DefMonde,
  etat: EtatPartie,
  creature: CreatureActive,
  sons: readonly SonEmis[],
  depuis: string,
  franchie: string | undefined,
  interceptee: boolean,
): Reponse {
  if (creature.ralentie === undefined) return reaction(monde, etat, creature, sons, depuis, franchie, interceptee);
  // Un jet d'interception a déjà pris la réaction de ce pas : la suivante est sautée.
  if (creature.ralentie.saute && !interceptee) return { creature: { ...creature, ralentie: { saute: false } }, evenements: [] };
  const reponse = reaction(monde, etat, creature, sons, depuis, franchie, interceptee);
  return reponse.creature.neutralisee === undefined ? { ...reponse, creature: { ...reponse.creature, ralentie: { saute: true } } } : reponse;
}

function sansGarde(creature: EtatCreature): EtatCreature {
  return creature.garde === undefined ? creature : sans(creature, 'garde');
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
