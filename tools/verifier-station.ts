import { assemblerStation, empreinte, nouvellePartie, observer, jouer, type DefMonde, type Des, type EtatPartie, type OptionMenu, type Partie } from '../engine';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { avecDroneEn, placesDuDrone } from '../engine/drone';
import {
  COMPOSITIONS_PUBLIEES,
  creerCatalogue,
  MORCEAUX,
  type Catalogue,
  type Composition,
  type EntreeMonde,
  type EntreeMorceau,
  type EtapeParcours,
  type Parcours,
  type Refus,
} from '../content';
import { CATALOGUE } from './catalogue';
import { executerParcours, trouverOption } from './rejouer-parcours';
import { fileURLToPath } from 'node:url';
import { empreinteCode, ouvrirCache, purgerCache } from './empreinte-code';
import { dansLeLot, lancerSousLots, lireOptionsLots, type Lot } from './lots';
import { isMainModule } from './repo-files';

const VERSION = 'verifier-station';
const GRAINE = 20261010;
const MAX_ETATS = 150000;
/** Graines de plan essayées, à partir de 0, pour la station de référence d'une composition. */
const ESSAIS_GRAINE = 50;
/** 14 §5.6 : par chemin, au moins 95 % de plans trouvés, sur 100 graines dans `check:stations` (#180), 1 000 en mode complet. */
export const TIRAGES_PLANS = 100;
export const TIRAGES_PLANS_COMPLET = 1000;
const POURCENT_PLANS = 95;
/** Hasard des tirages mesurés : les mêmes à chaque mesure. */
const GRAINE_TIRAGES = 20261015;

export interface OptionsVerification {
  readonly maxEtats?: number;
  /** États permis à la recherche (ex. un ordre imposé entre les deux commandes de l'ordre libre) ; les autres sont écartés. */
  readonly admissible?: (etat: EtatPartie) => boolean;
  /** Priorité d'un état, la plus haute développée d'abord ; par défaut, le rang du morceau du passager (spec L3 §6.2). */
  readonly priorite?: (etat: EtatPartie) => number;
  /** La recherche part de cet état au lieu du réveil ; pour `chercherEtat` et `chercherJusqua` seulement, le témoin de `verifierStation` se rejouant du réveil. */
  readonly depart?: Partie;
}

export interface RapportStation {
  readonly verdict: 'prouvee' | 'sans_sortie_sure' | 'non_prouvee';
  readonly etats: number;
  readonly secondes: number;
  readonly diagnostic: string;
  readonly parcours: Parcours | null;
  readonly ecartes: { readonly des: number; readonly blessures: number };
}

export function cleEtatRegles(etat: EtatPartie): string {
  return JSON.stringify({ ...etat, actions: 0, generateur: null, memoire: null, reperes: null, messages: [], visitees: [] });
}

function plafond(options: OptionsVerification): number {
  const maxEtats = options.maxEtats ?? MAX_ETATS;
  if (!Number.isSafeInteger(maxEtats) || maxEtats < 1) throw new RangeError('Le plafond doit être un entier positif.');
  return maxEtats;
}

function sansJournal(partie: Partie): Partie {
  return { ...partie, enregistrement: { ...partie.enregistrement, actions: [] }, derniers: [] };
}

function etapeDe(option: OptionMenu): EtapeParcours {
  const vers = option.cible.sorte === 'passage' ? option.cible.vers?.nom : undefined;
  const parametre = option.parametre?.sorte === 'passage' ? option.parametre.vers?.nom : option.parametre?.nom;
  return {
    action: option.action,
    cible: option.cible.nom,
    cibleId: option.cible.id,
    ...(vers === undefined ? {} : { vers }),
    ...(parametre === undefined ? {} : { parametre }),
    ...(option.parametre === undefined ? {} : { parametreId: option.parametre.id }),
  };
}

interface Parent {
  readonly precedent: number;
  readonly etape: EtapeParcours;
}

/** Étapes du nœud de départ jusqu'au nœud `fin`. */
function etapesJusqua(parents: readonly (Parent | null)[], fin: number): EtapeParcours[] {
  const etapes: EtapeParcours[] = [];
  let indice = fin;
  while (indice > 0) {
    const parent = parents[indice];
    if (parent === undefined || parent === null) throw new Error('Chaîne du témoin incomplète.');
    etapes.push(parent.etape);
    indice = parent.precedent;
  }
  return etapes.reverse();
}

function temoin(entree: EntreeMonde, parents: readonly (Parent | null)[], fin: number): Parcours {
  const etapes = etapesJusqua(parents, fin);
  let partie = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  for (const etape of etapes) {
    const option = trouverOption(observer(entree.monde, partie.etat), etape);
    if (option === undefined || !option.disponible) throw new Error('Commande du témoin introuvable.');
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee' || resultat.tirages.length > 0 || resultat.partie.etat.sante !== 'indemne') throw new Error('Témoin non sûr.');
    partie = resultat.partie;
  }
  const observation = observer(entree.monde, partie.etat);
  const parcours: Parcours = {
    nom: `${entree.monde.id} : preuve automatique sans dé ni blessure`,
    etapes,
    attendu: {
      piece: observation.piece.nom,
      objetsIci: observation.objets.map((objet) => objet.nom),
      inventaire: observation.inventaire.map((objet) => objet.nom),
      passagesOuverts: observation.passages.filter((passage) => passage.ouvert).map((passage) => passage.nom),
      actions: observation.actions,
      issue: 'evacuation',
      sante: 'indemne',
      sansDe: true,
    },
  };
  const rapport = executerParcours(entree, parcours, VERSION, GRAINE);
  if (rapport.erreurs.length > 0) throw new Error(`Rejeu de la preuve refusé : ${rapport.erreurs.join('; ')}`);
  return parcours;
}

/** Rang du morceau de chaque pièce, dans l'ordre de `monde.pieces` (préfixe avant « / ») ; 0 pour une pièce sans préfixe. */
export function rangsDesMorceaux(monde: DefMonde): (piece: string) => number {
  const morceau = (piece: string): string | null => {
    const barre = piece.indexOf('/');
    return barre < 0 ? null : piece.slice(0, barre);
  };
  const rangs = new Map<string, number>();
  for (const { id } of monde.pieces) {
    const prefixe = morceau(id);
    if (prefixe !== null && !rangs.has(prefixe)) rangs.set(prefixe, rangs.size);
  }
  return (piece) => {
    const prefixe = morceau(piece);
    return prefixe === null ? 0 : rangs.get(prefixe) ?? 0;
  };
}

/**
 * Priorité de recherche d’une grande station (spec 2026-10-18 §7.4) : le segment de la pièce du passager, le plus avancé d’abord ;
 * sans segment (petites stations), le rang de son morceau, comme avant.
 */
export function rangsDesSegments(monde: DefMonde): (piece: string) => number {
  if (!monde.pieces.some((piece) => piece.segment !== undefined)) return rangsDesMorceaux(monde);
  const segments = new Map(monde.pieces.map((piece) => [piece.id, piece.segment ?? 0]));
  return (piece) => segments.get(piece) ?? 0;
}

export interface Recherche {
  readonly issue: 'trouve' | 'epuise' | 'plafond';
  /** Premier état qui satisfait le but, journal vidé ; `null` sinon. */
  readonly partie: Partie | null;
  readonly etats: number;
}

interface Exploration extends Recherche {
  /** Le dernier nœud est l'état trouvé, s'il y en a un. */
  readonly parents: readonly (Parent | null)[];
  readonly ecartes: { readonly des: number; readonly blessures: number };
}

interface Seau {
  readonly indices: number[];
  /** Premier nœud non développé. */
  tete: number;
}

/**
 * Sans dé ni blessure : d'abord le premier nœud non développé du morceau le plus avancé, puis dans l'ordre d'arrivée
 * (spec L3 §6.2). Même graphe qu'en largeur ; sans préfixe, tout est au rang 0 et c'est la largeur.
 */
function explorer(entree: EntreeMonde, but: (etat: EtatPartie) => boolean, maxEtats: number, options: OptionsVerification = {}): Exploration {
  const rangDe = rangsDesSegments(entree.monde);
  const admissible = options.admissible ?? (() => true);
  const rang = options.priorite ?? ((etat: EtatPartie): number => rangDe(etat.piece));
  const initiale = sansJournal(options.depart ?? nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE }));
  const vus = new Set([cleEtatRegles(initiale.etat)]);
  const parents: (Parent | null)[] = [null];
  // Parallèle à `parents` ; la partie est libérée une fois développée.
  const noeuds: (Partie | undefined)[] = [initiale];
  const seaux: Seau[] = [];
  const ecartes = { des: 0, blessures: 0 };
  const conclure = (issue: Recherche['issue'], partie: Partie | null = null): Exploration => ({ issue, partie, etats: vus.size, parents, ecartes });
  const ranger = (indice: number, partie: Partie): void => {
    (seaux[rang(partie.etat)] ??= { indices: [], tete: 0 }).indices.push(indice);
  };
  const prochain = (): number | undefined => {
    for (let r = seaux.length - 1; r >= 0; r--) {
      const seau = seaux[r];
      if (seau !== undefined && seau.tete < seau.indices.length) return seau.indices[seau.tete++];
    }
    return undefined;
  };
  if (but(initiale.etat)) return conclure('trouve', initiale);
  ranger(0, initiale);
  for (let indice = prochain(); indice !== undefined; indice = prochain()) {
    const partie = noeuds[indice];
    noeuds[indice] = undefined;
    if (partie === undefined) throw new Error('État de recherche absent.');
    for (const option of observer(entree.monde, partie.etat).menu) {
      if (!option.disponible || option.action === 'regarder') continue;
      const resultat = jouer(entree.monde, partie, option.commande);
      if (resultat.type !== 'engagee') continue;
      if (resultat.tirages.length > 0) { ecartes.des++; continue; }
      if (resultat.partie.etat.sante !== 'indemne') { ecartes.blessures++; continue; }
      if (!admissible(resultat.partie.etat)) continue;
      const cle = cleEtatRegles(resultat.partie.etat);
      if (vus.has(cle)) continue;
      if (vus.size >= maxEtats) return conclure('plafond');
      vus.add(cle);
      const suivante = sansJournal(resultat.partie);
      parents.push({ precedent: indice, etape: etapeDe(option) });
      noeuds.push(suivante);
      if (but(suivante.etat)) return conclure('trouve', suivante);
      ranger(noeuds.length - 1, suivante);
    }
  }
  return conclure('epuise');
}

/** Recherche sans dé ni blessure (mêmes transitions que `verifierStation`), d'abord dans le morceau le plus avancé (spec L3 §6.2). */
export function chercherEtat(entree: EntreeMonde, but: (etat: EtatPartie) => boolean, options: OptionsVerification = {}): Recherche {
  const { issue, partie, etats } = explorer(entree, but, plafond(options), options);
  return { issue, partie, etats };
}

/**
 * Gestes sans dé ni blessure qui mènent de `depart` à un état où `but` est vrai (spec 2026-10-18 §7.4) : mêmes transitions que
 * `verifierStation` ; vide si `depart` le satisfait déjà, `null` si la recherche s'épuise ou atteint `maxEtats`.
 */
export function chercherJusqua(
  entree: EntreeMonde,
  depart: Partie,
  but: (etat: EtatPartie) => boolean,
  maxEtats: number,
  options: Pick<OptionsVerification, 'admissible' | 'priorite'> = {},
): readonly EtapeParcours[] | null {
  const { issue, parents } = explorer(entree, but, plafond({ maxEtats }), { ...options, depart });
  return issue === 'trouve' ? etapesJusqua(parents, parents.length - 1) : null;
}

/** Morceau d'une pièce préfixée (« m-07/p-soute » → « m-07 ») ; `null` sans préfixe. */
export function morceauDe(piece: string): string | null {
  const barre = piece.indexOf('/');
  return barre < 0 ? null : piece.slice(0, barre);
}

/**
 * Ordre libre (spec L5 §4) : la recherche où la cloison `premiere` est déverrouillée avant `seconde`. Seuls les états où
 * `seconde` n'est pas levée avant `premiere` sont admis ; la priorité va à l'étape suivante (la branche de la commande
 * attendue, puis le final), puis au carrefour, puis au reste.
 */
export function ordreImpose(monde: DefMonde, premiere: string, seconde: string): Required<Pick<OptionsVerification, 'admissible' | 'priorite'>> {
  const brancheDe = (cloison: string): string | null => {
    const commande = monde.objets.find((objet) => objet.deverrouille === cloison);
    return commande === undefined ? null : morceauDe(commande.piece);
  };
  const capsule = monde.objets.find((objet) => objet.capsule !== undefined);
  const etapes = [brancheDe(premiere), brancheDe(seconde), capsule === undefined ? null : morceauDe(capsule.piece)];
  const leve = (etat: EtatPartie, cloison: string): boolean => etat.verrous?.includes(cloison) !== true;
  // Grande station : après les deux cloisons, le troisième chemin puis le final, le segment le plus avancé d’abord (spec 2026-10-18 §7.4).
  const grande = monde.pieces.some((piece) => piece.segment !== undefined);
  const segmentDe = rangsDesSegments(monde);
  // Chemin principal d'une grande station (sans segments) : le troisième chemin, entre le sas et le final, compte comme
  // l'approche du final ; sans lui, la recherche n'y avance pas et s'arrête au plafond (#237). Les petites stations n'en ont pas.
  const rangDe = rangsDesMorceaux(monde);
  const rangCarrefour = rangDe('carrefour/');
  const troisieme = (ici: string | null, piece: string): boolean => ici !== null && ici !== etapes[0] && ici !== etapes[1] && rangDe(piece) > rangCarrefour;
  return {
    admissible: (etat) => leve(etat, premiere) || !leve(etat, seconde),
    priorite: (etat) => {
      const etape = leve(etat, premiere) ? (leve(etat, seconde) ? 2 : 1) : 0;
      const ici = morceauDe(etat.piece);
      const proche = ici === etapes[etape] ? 3 : etape === 2 && troisieme(ici, etat.piece) ? 2 : ici === 'carrefour' ? 1 : 0;
      if (!grande) return etape * 4 + proche;
      return etape * 1000 + (etape === 2 ? 10 + segmentDe(etat.piece) : proche);
    },
  };
}

export function verifierStation(entree: EntreeMonde, options: OptionsVerification = {}): RapportStation {
  const debut = performance.now();
  const maxEtats = plafond(options);
  const { issue, etats, parents, ecartes } = explorer(entree, (etat) => etat.fin === 'evacuation', maxEtats, options);
  const conclure = (verdict: RapportStation['verdict'], diagnostic: string, parcours: Parcours | null = null): RapportStation => ({
    verdict, diagnostic, parcours, etats, secondes: (performance.now() - debut) / 1000, ecartes,
  });
  if (issue === 'plafond') return conclure('non_prouvee', `Recherche interrompue au plafond de ${maxEtats} états : évacuation non prouvée.`);
  if (issue === 'trouve') {
    const parcours = temoin(entree, parents, parents.length - 1);
    return conclure('prouvee', `Évacuation sans dé ni blessure prouvée en ${parcours.etapes.length} actions ; témoin et export rejoués.`, parcours);
  }
  return conclure('sans_sortie_sure', `Aucune évacuation sans dé ni blessure après exploration complète : ${ecartes.des} transitions avec dé, ${ecartes.blessures} avec blessure écartées.`);
}

/**
 * Sans `cloison`, aucune suite de liaisons ne relie le départ à une capsule ni à son intérieur, quelles que soient leurs qualités
 * (étroites, hautes, cachées, gouffres, grilles) : aucune action, aucun dé ne peut alors mener à l'évacuation (spec L5 §4.2).
 */
export function capsuleCoupee(monde: DefMonde, cloison: string): boolean {
  const atteintes = new Set([monde.depart]);
  const file = [monde.depart];
  for (let piece = file.pop(); piece !== undefined; piece = file.pop()) {
    for (const liaison of monde.liaisons) {
      if (liaison.id === cloison || !liaison.entre.includes(piece)) continue;
      const autre = liaison.entre[0] === piece ? liaison.entre[1] : liaison.entre[0];
      if (!atteintes.has(autre)) {
        atteintes.add(autre);
        file.push(autre);
      }
    }
  }
  return monde.objets.every((objet) => objet.capsule === undefined || (!atteintes.has(objet.piece) && !atteintes.has(objet.capsule.interieur)));
}

export interface RapportLibre extends RapportStation {
  /** Verdict de chaque ordre : cloison 1 puis 2, et 2 puis 1. */
  readonly ordres: readonly [RapportStation['verdict'], RapportStation['verdict']];
  /** Chaque cloison, verrouillée, coupe toute capsule du départ. */
  readonly coupees: boolean;
}

/** Cloisons verrouillées du carrefour de l'ordre libre (D-259) ; la porte blindée de M-11 (#203), verrouillée elle aussi, n'en est pas. */
export function cloisonsDuCarrefour(monde: DefMonde): string[] {
  return monde.liaisons.filter((liaison) => liaison.verrouillee === true && liaison.entre.some((piece) => morceauDe(piece) === 'carrefour')).map((liaison) => liaison.id);
}

/**
 * Ordre libre (spec L5 §4) : prouvée seulement si les deux ordres de préparation mènent à l'évacuation sans dé ni blessure,
 * témoins rejoués, et si chaque cloison coupe à elle seule l'accès à la capsule. Les états et les temps s'additionnent ;
 * le témoin rendu est celui du premier ordre.
 */
export function verifierLibre(entree: EntreeMonde, options: OptionsVerification = {}): RapportLibre {
  const cloisons = cloisonsDuCarrefour(entree.monde);
  const [premiere, seconde] = cloisons;
  if (premiere === undefined || seconde === undefined || cloisons.length !== 2) throw new Error(`${entree.monde.id} : deux cloisons verrouillées attendues.`);
  // Contrôles sans recherche d'abord : chaque cloison coupe la capsule, et les deux commandes sont dans deux morceaux différents.
  const coupees = cloisons.every((cloison) => capsuleCoupee(entree.monde, cloison));
  const commandes = entree.monde.objets.filter((objet) => objet.deverrouille !== undefined && cloisons.includes(objet.deverrouille));
  const morceauxCommandes = new Set(commandes.map((objet) => morceauDe(objet.piece)));
  const refuser = (diagnostic: string): RapportLibre => ({
    verdict: 'sans_sortie_sure', etats: 0, secondes: 0, ecartes: { des: 0, blessures: 0 }, ordres: ['sans_sortie_sure', 'sans_sortie_sure'], coupees, parcours: null, diagnostic,
  });
  if (!coupees) return refuser('Une cloison verrouillée ne coupe pas l’accès à la capsule : une branche pourrait être sautée.');
  if (morceauxCommandes.size !== 2) return refuser('Les deux commandes ne sont pas dans deux branches différentes : une branche pourrait être sautée.');
  const [ab, ba] = [
    verifierStation(entree, { ...options, ...ordreImpose(entree.monde, premiere, seconde) }),
    verifierStation(entree, { ...options, ...ordreImpose(entree.monde, seconde, premiere) }),
  ] as const;
  const ordres = [ab.verdict, ba.verdict] as const;
  const etats = ab.etats + ba.etats;
  const secondes = ab.secondes + ba.secondes;
  const ecartes = { des: ab.ecartes.des + ba.ecartes.des, blessures: ab.ecartes.blessures + ba.ecartes.blessures };
  const commun = { etats, secondes, ecartes, ordres, coupees };
  if (ab.verdict === 'prouvee' && ba.verdict === 'prouvee') {
    return { ...commun, verdict: 'prouvee', parcours: ab.parcours, diagnostic: `Évacuation sans dé ni blessure prouvée en ${ab.parcours?.etapes.length} actions, première cloison d’abord, et en ${ba.parcours?.etapes.length} actions, seconde d’abord ; témoins et exports rejoués ; chaque cloison coupe la capsule.` };
  }
  const echec = ab.verdict === 'prouvee' ? ba : ab;
  const trouve = ab.verdict === 'prouvee' || ba.verdict === 'prouvee';
  const prefixe = trouve ? 'Un seul des deux ordres prouvé. ' : '';
  return { ...commun, verdict: echec.verdict, parcours: null, diagnostic: `${prefixe}${ab.verdict === 'prouvee' ? 'Seconde cloison d’abord' : 'Première cloison d’abord'} : ${echec.diagnostic}` };
}

/** Nombre de liaisons, quelles qu'elles soient, de chaque pièce à la plus proche des `sources`. */
function distancesDepuis(monde: DefMonde, sources: readonly string[]): Map<string, number> {
  const distances = new Map(sources.map((source) => [source, 0]));
  const file = [...sources];
  for (let tete = 0; tete < file.length; tete++) {
    const piece = file[tete];
    if (piece === undefined) break;
    const distance = distances.get(piece) ?? 0;
    for (const liaison of monde.liaisons) {
      if (!liaison.entre.includes(piece)) continue;
      const autre = liaison.entre[0] === piece ? liaison.entre[1] : liaison.entre[0];
      if (!distances.has(autre)) {
        distances.set(autre, distance + 1);
        file.push(autre);
      }
    }
  }
  return distances;
}

export type MiseHorsJeu = 'possible' | 'impossible' | 'indeterminee';

/** La créature est hors jeu (tombée, inerte, expulsée) ou enfermée : dans une chambre froide dont toutes les portes sont fermées (D-241). */
export function creatureHorsJeu(monde: DefMonde, etat: EtatPartie): boolean {
  const creature = etat.creature;
  if (creature === null) return false;
  if (creature.neutralisee !== undefined) return true;
  const piece = monde.pieces.find((candidate) => candidate.id === creature.piece);
  return piece?.froide === true && monde.liaisons.every((liaison) => !liaison.entre.includes(piece.id) || etat.liaisons[liaison.id] !== true);
}

/**
 * D-241 (spec L5 §5) : la créature peut-elle être mise hors jeu ou enfermée, sans dé ni blessure et sans que le passager entre
 * dans le morceau final (celui de la capsule) ? Seuls un gouffre, une chambre froide ou un vitrage extérieur le permettent :
 * sans aucun d'eux hors du final, c'est impossible sans recherche. Une recherche au plafond est « indéterminée ».
 */
export function mesurerMiseHorsJeu(entree: EntreeMonde, options: OptionsVerification = {}): MiseHorsJeu {
  const { monde } = entree;
  const capsule = monde.objets.find((objet) => objet.capsule !== undefined);
  const final = capsule === undefined ? null : morceauDe(capsule.piece);
  const horsFinal = (piece: string): boolean => morceauDe(piece) !== final;
  const moyens =
    monde.liaisons.some((liaison) => liaison.gouffre === true && liaison.entre.some(horsFinal)) ||
    monde.pieces.some((piece) => piece.froide === true && horsFinal(piece.id)) ||
    monde.objets.some((objet) => objet.vitrageExterieur === true && horsFinal(objet.piece));
  if (!moyens) return 'impossible';
  // Priorité aux états où la créature est la plus proche d'un piège (bord d'un gouffre, chambre froide), puis au rang du
  // morceau du passager : même graphe, même verdict une fois épuisé, mais le but est trouvé bien plus tôt.
  const pieges = new Set([
    ...monde.liaisons.filter((liaison) => liaison.gouffre === true).flatMap((liaison) => liaison.entre),
    ...monde.pieces.filter((piece) => piece.froide === true).map((piece) => piece.id),
  ]);
  const distances = distancesDepuis(monde, [...pieges]);
  // Sans piège joignable (un vitrage seul), toutes les distances valent `loin` : la priorité reste le rang du passager.
  const loin = Math.max(0, ...distances.values()) + 1;
  const rangDe = rangsDesMorceaux(monde);
  const rangs = new Set(monde.pieces.map((piece) => rangDe(piece.id))).size;
  // En ordre libre, d'abord les verrous levés : sans eux, une créature partie du final ne peut pas en sortir.
  const cloisons = monde.liaisons.filter((liaison) => liaison.verrouillee === true).length;
  const priorite = (etat: EtatPartie): number => {
    const piece = etat.creature?.piece;
    const distance = piece === null || piece === undefined ? 0 : distances.get(piece) ?? loin;
    const levees = cloisons - (etat.verrous?.length ?? 0);
    return (levees * (loin + 1) + loin - distance) * rangs + rangDe(etat.piece);
  };
  const { issue } = chercherEtat(entree, (etat) => creatureHorsJeu(monde, etat), { ...options, priorite, admissible: (etat) => horsFinal(etat.piece) });
  return issue === 'trouve' ? 'possible' : issue === 'epuise' ? 'impossible' : 'indeterminee';
}

class DemandeDe extends Error {
  constructor(readonly faces: number) { super('Tirage à explorer.'); }
}

export function explorerDes<Resultat>(executer: (des: Des) => Resultat): Resultat[] {
  const resultats: Resultat[] = [];
  const prefixes: number[][] = [[]];
  while (prefixes.length > 0) {
    const prefixe = prefixes.pop();
    if (prefixe === undefined) throw new Error('Préfixe de dés absent.');
    let position = 0;
    try {
      resultats.push(executer({ lancer: (faces) => {
        const face = prefixe[position++];
        if (face === undefined) throw new DemandeDe(faces);
        return face;
      } }));
    } catch (erreur) {
      if (!(erreur instanceof DemandeDe)) throw erreur;
      if (!Number.isSafeInteger(erreur.faces) || erreur.faces < 1) throw new RangeError('Nombre de faces invalide.', { cause: erreur });
      for (let face = erreur.faces; face >= 1; face--) prefixes.push([...prefixe, face]);
    }
  }
  return resultats;
}

export interface MesureStation {
  readonly verdict: 'complete' | 'non_prouvee';
  readonly etats: number;
  readonly transitions: number;
  readonly branchesDes: number;
  readonly evacuations: number;
  readonly defaites: number;
  readonly secondes: number;
  readonly diagnostic: string;
}

export function mesurerStation(entree: EntreeMonde, options: OptionsVerification = {}): MesureStation {
  const debut = performance.now();
  const maxEtats = plafond(options);
  const initiale = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  const vus = new Set([cleEtatRegles(initiale.etat)]);
  const file: (Partie | undefined)[] = [sansJournal(initiale)];
  let transitions = 0;
  let branchesDes = 0;
  let evacuations = 0;
  let defaites = 0;
  const conclure = (verdict: MesureStation['verdict'], diagnostic: string): MesureStation => ({
    verdict, diagnostic, etats: vus.size, transitions, branchesDes, evacuations, defaites, secondes: (performance.now() - debut) / 1000,
  });
  for (let position = 0; position < file.length; position++) {
    const partie = file[position];
    file[position] = undefined;
    if (partie === undefined) throw new Error('État de mesure absent.');
    for (const option of observer(entree.monde, partie.etat).menu) {
      if (!option.disponible || option.action === 'regarder') continue;
      for (const resultat of explorerDes((des) => jouer(entree.monde, partie, option.commande, des))) {
        if (resultat.type !== 'engagee') continue;
        transitions++;
        if (resultat.tirages.length > 0) branchesDes++;
        const cle = cleEtatRegles(resultat.partie.etat);
        if (vus.has(cle)) continue;
        if (vus.size >= maxEtats) return conclure('non_prouvee', `Mesure interrompue au plafond de ${maxEtats} états : graphe incomplet.`);
        vus.add(cle);
        if (resultat.partie.etat.fin === 'evacuation') evacuations++;
        else if (resultat.partie.etat.sante === 'vaincu') defaites++;
        else file.push(sansJournal(resultat.partie));
      }
    }
  }
  return conclure('complete', 'Graphe complet : toutes les commandes et toutes les faces de dés explorées.');
}

export interface LigneCatalogue {
  readonly composition: string;
  readonly verdict: RapportStation['verdict'] | 'refusee';
  /** Graine de plan vérifiée ; `null` si la composition est refusée ou sans plan. */
  readonly graine: number | null;
  readonly etats: number;
  readonly secondes: number;
  /** Longueur du témoin ; `null` si la composition n'est pas prouvée. */
  readonly actions: number | null;
  readonly diagnostic: string;
  /** `empreinte({ morceau, textes })` par morceau inclus, dans l'ordre de la station. */
  readonly empreintes: Readonly<Record<string, string>>;
  /** Ordre libre : verdict de chaque ordre de préparation (spec L5 §4). */
  readonly ordres?: RapportLibre['ordres'];
}

export interface MesurePlans {
  /** Morceaux de la station, ex. 'vestibule + m-07 + m-03'. */
  readonly chemin: string;
  readonly tirages: number;
  readonly trouves: number;
  readonly msMoyenne: number;
  readonly msMax: number;
}

export interface MesureTirages {
  readonly tirages: number;
  readonly reussis: number;
  readonly msMoyenne: number;
  readonly msMax: number;
  /** Stations obtenues par final : 'm-03', 'm-06'. */
  readonly finals: Readonly<Record<string, number>>;
  /** Par nombre de morceaux de chemin : '1', '2'. */
  readonly chemins: Readonly<Record<string, number>>;
  /** Par morceau de chemin et final. */
  readonly morceaux: Readonly<Record<string, number>>;
  /** Par place de la créature (`composition.creature`). */
  readonly places: Readonly<Record<string, number>>;
}

/** Départ, chemins et final d'une composition (13 §7.1, spec L3 §4.1). */
function morceauxDe(composition: Composition): EntreeMorceau[] {
  const departs = Object.values(MORCEAUX).filter(({ morceau }) => morceau.famille === 'depart');
  const [depart] = departs;
  if (depart === undefined || departs.length > 1) throw new Error('Un seul morceau de départ attendu.');
  const carrefour = composition.forme === 'libre' ? ['carrefour'] : [];
  return [depart, ...[...carrefour, ...composition.chemins, composition.final].map((id) => {
    const entree = Object.hasOwn(MORCEAUX, id) ? MORCEAUX[id] : undefined;
    if (entree === undefined) throw new Error(`Morceau ${id} absent.`);
    return entree;
  })];
}

/** Station d'une composition à la plus petite graine de plan, à partir de 0, qui donne un plan : celle que l'on vérifie. */
export function stationDeReference(catalogue: Catalogue, composition: string): { readonly graine: number; readonly entree: EntreeMonde } | Refus {
  let dernier = '';
  for (let graine = 0; graine < ESSAIS_GRAINE; graine++) {
    const station = catalogue.construire(composition, graine);
    if (!('refus' in station)) return { graine, entree: station };
    dernier = station.refus;
  }
  return { refus: `Composition ${composition} : aucune station pour les graines de plan 0 à ${ESSAIS_GRAINE - 1} ; dernier motif : ${dernier}` };
}

/**
 * Chaque composition possible, publiée ou non, vérifiée sur sa station de référence : la preuve vaut pour toutes ses graines,
 * aucune règle ne lisant le plan (D-078). Une composition refusée par la table l'est sans assemblage ni vérification.
 */
export function verifierCatalogue(catalogue: Catalogue, options: OptionsVerification = {}): LigneCatalogue[] {
  return catalogue.compositions.map((composition) => verifierComposition(catalogue, composition, options));
}

/**
 * Une station à drone vaut pour toutes ses graines, donc pour chaque place où l'assemblage peut tirer le drone (#270) : chacune
 * est prouvée, jusqu'à la première qui échoue ; états et durées s'additionnent, et le diagnostic nomme la place en échec.
 */
export function verifierChaquePlace<Rapport extends RapportStation>(entree: EntreeMonde, verifier: (entree: EntreeMonde) => Rapport): Rapport {
  const drone = entree.monde.objets.find((objet) => objet.drone !== undefined);
  const places = drone === undefined ? [] : placesDuDrone(entree.monde, drone.id);
  if (drone === undefined || places.length === 0) return verifier(entree);
  let total: Rapport | null = null;
  for (const place of places) {
    const rapport = verifier({ ...entree, monde: avecDroneEn(entree.monde, drone.id, place) });
    total = total === null ? rapport : { ...rapport, etats: total.etats + rapport.etats, secondes: total.secondes + rapport.secondes };
    if (rapport.verdict !== 'prouvee') return { ...total, diagnostic: `Drone en ${place} : ${rapport.diagnostic}` };
  }
  return total ?? verifier(entree);
}

/** Une composition, vérifiée sur sa station de référence ; refusée par la table ou par sa place, sans assemblage ni recherche. */
/**
 * Plafond relevé pour les compositions qui contiennent ces morceaux (#232) : M-12 multiplie les états (six portes, phases du
 * drone) ; `m10-m12-m03-stockage` demande 405 000 états, `m12-m01-m03-palier` 253 000. Les autres gardent `MAX_ETATS`, pour
 * que leur verdict, et donc la liste publiée, ne change pas. Un plafond demandé explicitement l'emporte.
 */
export const PLAFONDS_ELARGIS: Readonly<Record<string, number>> = { 'm-12': 600000 };

export function optionsDe(composition: Composition, options: OptionsVerification): OptionsVerification {
  if (options.maxEtats !== undefined) return options;
  const plafond = Math.max(MAX_ETATS, ...[...composition.chemins, composition.final].map((morceau) => PLAFONDS_ELARGIS[morceau] ?? 0));
  return plafond === MAX_ETATS ? options : { ...options, maxEtats: plafond };
}

/** `empreinte({ morceau, textes })` de chaque morceau de la composition, dans l'ordre de la station. */
export function empreintesDe(composition: Composition): Record<string, string> {
  return Object.fromEntries(morceauxDe(composition).map(({ morceau, textes }) => [morceau.id, empreinte({ morceau, textes })]));
}

export function verifierComposition(catalogue: Catalogue, composition: Composition, options: OptionsVerification = {}): LigneCatalogue {
  const empreintes = empreintesDe(composition);
  const sansVerification = (verdict: LigneCatalogue['verdict'], diagnostic: string): LigneCatalogue => ({
    composition: composition.id, verdict, graine: null, etats: 0, secondes: 0, actions: null, diagnostic, empreintes,
  });
  if (composition.refus !== null) return sansVerification('refusee', composition.refus);
  const station = stationDeReference(catalogue, composition.id);
  if ('refus' in station) return sansVerification('non_prouvee', station.refus);
  const recherche = optionsDe(composition, options);
  const libre = composition.forme === 'libre' ? verifierChaquePlace(station.entree, (entree) => verifierLibre(entree, recherche)) : null;
  const { verdict, etats, secondes, diagnostic, parcours } = libre ?? verifierChaquePlace(station.entree, (entree) => verifierStation(entree, recherche));
  const actions = parcours === null ? null : parcours.etapes.length;
  const ordres = libre === null ? {} : { ordres: libre.ordres };
  return { composition: composition.id, verdict, graine: station.graine, etats, secondes, actions, diagnostic, empreintes, ...ordres };
}

/** Ce qui fait échouer `check:stations` : publiée non prouvée, prouvée non publiée, moins de 95 % de plans (14 §5.6). */
export function ecartsDuCatalogue(lignes: readonly LigneCatalogue[], publiees: readonly string[], plans: readonly MesurePlans[]): string[] {
  const ecarts: string[] = [];
  for (const composition of publiees) {
    const ligne = lignes.find((candidate) => candidate.composition === composition);
    if (ligne === undefined) ecarts.push(`Composition publiée ${composition} absente du catalogue.`);
    else if (ligne.verdict !== 'prouvee') ecarts.push(`Composition publiée ${composition} non prouvée (${ligne.verdict}).`);
  }
  for (const { composition, verdict } of lignes) {
    if (verdict === 'prouvee' && !publiees.includes(composition)) ecarts.push(`Composition ${composition} prouvée mais non publiée.`);
  }
  for (const { chemin, tirages, trouves } of plans) {
    if (trouves * 100 < tirages * POURCENT_PLANS) ecarts.push(`Plans ${chemin} : ${trouves} trouvés sur ${tirages}, moins de ${POURCENT_PLANS} %.`);
  }
  return ecarts;
}

/** Un chemin de plans par suite de morceaux permise, avec la première composition qui la porte, dans l'ordre du catalogue. */
export function cheminsDesPlans(catalogue: Catalogue = CATALOGUE): (readonly [string, Composition])[] {
  const chemins = new Map<string, Composition>();
  for (const composition of catalogue.compositions) {
    const chemin = morceauxDe(composition).map(({ morceau }) => morceau.id).join(' + ');
    if (composition.refus === null && !chemins.has(chemin)) chemins.set(chemin, composition);
  }
  return [...chemins];
}

/** Plans d'un chemin, graines 0 à `tirages` - 1 : plans trouvés et temps d'`assemblerStation`, échecs compris. */
export function mesurerPlan(chemin: string, composition: Composition, tirages: number, catalogue: Catalogue = CATALOGUE): MesurePlans {
  let trouves = 0;
  let total = 0;
  let msMax = 0;
  for (let graine = 0; graine < tirages; graine++) {
    const debut = performance.now();
    const station = catalogue.definir(composition.id, graine);
    if ('refus' in station) throw new Error(station.refus);
    const resultat = assemblerStation(station);
    const ms = performance.now() - debut;
    if (resultat.type === 'station') trouves++;
    total += ms;
    msMax = Math.max(msMax, ms);
  }
  return { chemin, tirages, trouves, msMoyenne: total / tirages, msMax };
}

/** Plans de chaque chemin permis, graines 0 à `tirages` - 1. */
export function mesurerPlans(tirages: number): MesurePlans[] {
  return cheminsDesPlans().map(([chemin, composition]) => mesurerPlan(chemin, composition, tirages));
}

/**
 * Tirages complets d'un catalogue neuf, retirages compris, au hasard à graine fixe : stations obtenues et temps de `tirer`,
 * puis finals, nombres de chemins, morceaux et places des stations obtenues.
 */
export function mesurerTirages(tirages: number): MesureTirages {
  const catalogue = creerCatalogue(assemblerStation);
  const parId = new Map(catalogue.compositions.map((composition) => [composition.id, composition]));
  const finals: Record<string, number> = {};
  const chemins: Record<string, number> = {};
  const morceaux: Record<string, number> = {};
  const places: Record<string, number> = {};
  const compter = (table: Record<string, number>, cle: string): void => {
    table[cle] = (table[cle] ?? 0) + 1;
  };
  let etat = generateurDepuisGraine(GRAINE_TIRAGES);
  const hasard = (): number => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur;
  };
  let reussis = 0;
  let total = 0;
  let msMax = 0;
  for (let rang = 0; rang < tirages; rang++) {
    const debut = performance.now();
    const resultat = catalogue.tirer(hasard);
    const ms = performance.now() - debut;
    total += ms;
    msMax = Math.max(msMax, ms);
    if ('refus' in resultat) continue;
    reussis++;
    // Station `<composition>-<graine>`.
    const id = resultat.monde.id;
    const composition = parId.get(id.slice(0, id.lastIndexOf('-')));
    if (composition === undefined) throw new Error(`Composition de la station ${id} absente du catalogue.`);
    compter(finals, composition.final);
    compter(chemins, String(composition.chemins.length));
    for (const morceau of [...composition.chemins, composition.final]) compter(morceaux, morceau);
    compter(places, composition.creature);
  }
  return { tirages, reussis, msMoyenne: total / tirages, msMax, finals, chemins, morceaux, places };
}


/** Stations écrites en entier (et M-07, M-10 assemblées seules), vérifiées avant le catalogue. */
export const MONDES_DE_REFERENCE: readonly string[] = ['ar-01', 'ar-02', 'm-07', 'm-08', 'm-09', 'm-10', 'm-12'];

/** Ce que vérifie `check:stations` (#180) : verdicts, puis plans de chaque chemin. */
export interface ResultatLot {
  readonly mondes: readonly ({ readonly monde: string } & RapportStation)[];
  readonly lignes: readonly LigneCatalogue[];
  readonly plans: readonly MesurePlans[];
  /** Verdicts et plans repris du cache, sans recherche. */
  readonly repris: number;
}

/** Cache des verdicts : une entrée par station, composition ou chemin, pour une empreinte du code de ce fichier. */
export interface CacheVerdicts {
  lire<T>(cle: string): T | undefined;
  ecrire(cle: string, valeur: unknown): void;
}

/**
 * Le lot `lot` de `check:stations` : stations de référence, compositions et chemins de plans de rang `lot`. Avec `cache`, un
 * verdict déjà rendu par le même code est repris (l'empreinte du code est celle du dossier du cache) ; les options de
 * recherche changent la clé.
 */
export function verifierLot(
  lot: Lot,
  { catalogue = CATALOGUE, tirages = TIRAGES_PLANS, options = {}, cache }: { readonly catalogue?: Catalogue; readonly tirages?: number; readonly options?: OptionsVerification; readonly cache?: CacheVerdicts } = {},
): ResultatLot {
  let repris = 0;
  const suffixe = options.maxEtats === undefined ? '' : ` max ${options.maxEtats}`;
  const avecCache = <T>(cle: string, calculer: () => T): T => {
    const connu = cache?.lire<T>(`${cle}${suffixe}`);
    if (connu !== undefined) {
      repris++;
      return connu;
    }
    const valeur = calculer();
    cache?.ecrire(`${cle}${suffixe}`, valeur);
    return valeur;
  };
  const mondes = dansLeLot(MONDES_DE_REFERENCE, lot).map((id) => {
    const entree = catalogue.mondes[id];
    if (entree === undefined) throw new Error(`Station inconnue : ${id}.`);
    return avecCache(`monde ${id}`, () => ({ monde: id, ...verifierStation(entree, options) }));
  });
  const lignes = dansLeLot(catalogue.compositions, lot).map((composition) =>
    avecCache(`composition ${composition.id} ${JSON.stringify(empreintesDe(composition))}`, () => verifierComposition(catalogue, composition, options)),
  );
  const plans = dansLeLot(cheminsDesPlans(catalogue), lot).map(([chemin, composition]) =>
    avecCache(`plans ${chemin} ${tirages}`, () => mesurerPlan(chemin, composition, tirages, catalogue)),
  );
  return { mondes, lignes, plans, repris };
}

/**
 * Écarts d'un lot : ceux du catalogue (`ecartsDuCatalogue`) restreints aux compositions du lot, plus une station de
 * référence non prouvée. Une composition publiée absente du catalogue revient au lot 1.
 */
export function ecartsDuLot(resultat: ResultatLot, lot: Lot, catalogue: Catalogue = CATALOGUE, publiees: readonly string[] = COMPOSITIONS_PUBLIEES): string[] {
  const duLot = new Set(dansLeLot(catalogue.compositions, lot).map((composition) => composition.id));
  const connues = new Set(catalogue.compositions.map((composition) => composition.id));
  const publieesDuLot = publiees.filter((id) => duLot.has(id) || (!connues.has(id) && lot.numero === 1));
  return [
    ...resultat.mondes.filter((rapport) => rapport.verdict !== 'prouvee').map((rapport) => `Station de référence ${rapport.monde} non prouvée (${rapport.verdict}) : ${rapport.diagnostic}`),
    ...ecartsDuCatalogue(resultat.lignes, publieesDuLot, resultat.plans),
  ];
}

const OPTIONS_CLI = ['--mesurer', '--complet', '--sans-cache'];
const OPTIONS_CLI_VALEUR = ['--max-etats=', '--lot=', '--processus=', '--plans='];

async function principal(): Promise<void> {
  const argumentsCli = process.argv.slice(2);
  const inconnu = argumentsCli.find((argument) => argument.startsWith('--') && !OPTIONS_CLI.includes(argument) && !OPTIONS_CLI_VALEUR.some((prefixe) => argument.startsWith(prefixe)));
  if (inconnu !== undefined) throw new Error(`Option inconnue : ${inconnu}.`);
  const valeur = (prefixe: string): string | undefined => argumentsCli.find((argument) => argument.startsWith(prefixe))?.slice(prefixe.length);
  const mesure = argumentsCli.includes('--mesurer');
  const complet = argumentsCli.includes('--complet');
  const limite = valeur('--max-etats=');
  const options = limite === undefined ? {} : { maxEtats: Number(limite) };
  const demandes = argumentsCli.filter((argument) => !argument.startsWith('--'));

  if (demandes.length > 0 || mesure) {
    for (const id of demandes.length > 0 ? demandes : MONDES_DE_REFERENCE) {
      const entree = CATALOGUE.mondes[id];
      if (entree === undefined) throw new Error(`Station inconnue : ${id}.`);
      const rapport = mesure ? mesurerStation(entree, options) : verifierStation(entree, options);
      console.log(JSON.stringify({ monde: id, ...rapport }));
      if (rapport.verdict !== (mesure ? 'complete' : 'prouvee')) process.exitCode = 1;
    }
    return;
  }

  const { lot, parts, reste } = lireOptionsLots(argumentsCli);
  const debut = performance.now();
  const duree = (): string => `${((performance.now() - debut) / 1000).toFixed(1)} s`;
  // Mode complet (#180) : 1 000 plans par chemin, sans cache, puis les 1 000 tirages de NOUVELLE PARTIE.
  const sansCache = complet || argumentsCli.includes('--sans-cache');
  const textePlans = valeur('--plans=');
  const tirages = textePlans === undefined ? (complet ? TIRAGES_PLANS_COMPLET : TIRAGES_PLANS) : Number(textePlans);
  if (!Number.isSafeInteger(tirages) || tirages < 1) throw new RangeError(`Nombre de plans invalide : ${textePlans}.`);

  if (parts > 1) {
    const passer = [
      ...reste.filter((argument) => !argument.startsWith('--plans=') && argument !== '--complet' && argument !== '--sans-cache'),
      `--plans=${tirages}`,
      ...(sansCache ? ['--sans-cache'] : []),
    ];
    const sorties = await lancerSousLots(fileURLToPath(import.meta.url), lot, parts, passer);
    for (const { sortie, erreurs } of sorties) {
      process.stdout.write(sortie);
      process.stderr.write(erreurs);
    }
    if (complet) console.log(JSON.stringify({ tirer: 'catalogue.tirer', ...mesurerTirages(TIRAGES_PLANS_COMPLET) }));
    const echecs = sorties.filter(({ code }) => code !== 0).length;
    console.error(`check:stations : lot ${lot.numero}/${lot.total} en ${parts} processus, ${duree()}${echecs > 0 ? `, ${echecs} processus en échec` : ''}.`);
    if (echecs > 0) process.exitCode = 1;
    return;
  }

  let cache: CacheVerdicts | undefined;
  if (!sansCache) {
    const empreinte = empreinteCode(['tools/verifier-station.ts']);
    purgerCache('check-stations', empreinte);
    cache = ouvrirCache('check-stations', empreinte);
  }
  const resultat = verifierLot(lot, { tirages, options, cache });
  for (const ligne of [...resultat.mondes, ...resultat.lignes, ...resultat.plans]) console.log(JSON.stringify(ligne));
  if (complet) console.log(JSON.stringify({ tirer: 'catalogue.tirer', ...mesurerTirages(TIRAGES_PLANS_COMPLET) }));
  // Grandes stations publiées (spec 2026-10-18 §7.4) : rejeu de leurs témoins, rapide ; import dynamique, le module importe celui-ci.
  const { ecartsDesGrandes, verifierPublieesDuLot } = await import('./verifier-grandes');
  const grandes = verifierPublieesDuLot(lot);
  for (const ligne of grandes) console.log(JSON.stringify({ ...ligne, temoins: undefined }));
  const ecarts = [...ecartsDuLot(resultat, lot), ...ecartsDesGrandes(grandes)];
  for (const ecart of ecarts) console.error(ecart);
  const total = resultat.mondes.length + resultat.lignes.length + resultat.plans.length + grandes.length;
  console.error(`check:stations : lot ${lot.numero}/${lot.total}, ${total} verdicts (${tirages} plans par chemin) dont ${resultat.repris} repris du cache, ${duree()}.`);
  if (ecarts.length > 0) process.exitCode = 1;
}

if (isMainModule(import.meta.url)) {
  principal().catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? erreur.stack ?? erreur.message : String(erreur));
    process.exitCode = 1;
  });
}
