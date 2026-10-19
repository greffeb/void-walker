import {
  ACTIONS,
  apercu,
  COUTS,
  jouer,
  NIVEAUX_RISQUE,
  nouvellePartie,
  observer,
  RAISONS_INDISPONIBILITE,
  RAISONS_REFUS,
  TYPES_DANGER,
  TYPES_EVENEMENT,
  TYPES_SAVOIR,
  type Evenement,
  type Commande,
  type Partie,
  type TypeEvenement,
} from '../engine';
import {
  analyserGabarit,
  CLES_EVACUATION,
  CLES_MOMENT,
  CLES_MORT,
  COMPOSITIONS_CONTROLEES,
  fuitesDeCouches,
  fuitesDuCatalogue,
  MORCEAUX,
  UNIVERS,
  libelleOption,
  lignesListeCarte,
  MORCEAUX_TEXTES,
  nomLisible,
  rendreApercu,
  rendreAssistance,
  rendreConsultation,
  rendreEvenements,
  rendreListeCarte,
  rendreObservation,
  rendreRefus,
  variantesDe,
  ROLES_ALLER_SANS_DESTINATION,
  ROLES_DANGER,
  ROLES_EVENEMENT,
  ROLES_INDISPONIBILITE,
  ROLES_LIBELLE,
  ROLES_MOMENT,
  ROLES_OBSERVATION,
  ROLES_PASSAGE,
  ROLES_PASSAGE_SANS_DESTINATION,
  ROLES_SAVOIR,
  TYPES_AGGRAVATION,
  type Catalogue,
  type EntreeMonde,
  type Refus,
  type TextesMonde,
  type TypeRecit,
} from '../content';
import { fileURLToPath } from 'node:url';
import { CATALOGUE } from './catalogue';
import { empreinteCode, ouvrirCache, purgerCache } from './empreinte-code';
import { dansLeLot, lancerSousLots, lireOptionsLots, type Lot } from './lots';
import { isMainModule } from './repo-files';
import { trouverOption } from './rejouer-parcours';
import { stationDeReference, verifierLibre, verifierStation, type CacheVerdicts } from './verifier-station';

// Contrôles des textes (C-07 §4, AP-08) : NP-01 un événement un texte, NP-02 trous sûrs, D-111 longueur.

const ID_PUBLIC = /\be[0-9a-f]{8}\b/;

/**
 * Moments forts où le récit d'une action peut être plus long (D-111 : premier contact, fin). Garde-fou du contrôle, non
 * décidé : quatre phrases au plus pour ce texte seul.
 */
const MOMENTS_FORTS: readonly TypeEvenement[] = ['premier_contact', 'defaite', 'evacuation'];

/**
 * Nombre d'états distincts explorés en largeur depuis le départ, au plus. AR-01 a trop d'états pour une exploration complète
 * en moins d'une minute : la borne garde le contrôle rapide ; le monde de test, plus petit, reste exploré en entier. Les états
 * des parcours témoins, leurs voisins et des marches au hasard à graine fixe complètent la couverture.
 */
export const MAX_ETATS = 50000;
/**
 * Borne du monde de test, pour qu'il reste exploré en entier : 24 213 états quand le jet peut rater, 89 183 quand il touche
 * toujours (variante V1 de #194), la santé variant davantage.
 */
export const MAX_ETATS_MONDE_TEST = 150000;

/** Borne d'exploration d'une entrée : le monde de test à part. */
export function borneDe(entree: EntreeMonde): number {
  return entree.monde.id === 'monde-test' ? MAX_ETATS_MONDE_TEST : MAX_ETATS;
}
/** Marches au hasard à graine fixe : nombre et longueur, pour atteindre des états profonds (feu propagé, blessures). */
const MARCHES = 40;
const LONGUEUR_MARCHE = 80;

const TYPES_RECIT = TYPES_EVENEMENT.filter((type): type is TypeRecit => type !== 'evacuation' && type !== 'assistance');

export function compterPhrases(texte: string): number {
  return texte.split(/[.!?…]+(?:\s|$)/).filter((morceau) => morceau.trim() !== '').length;
}

function verifierVariantes(erreurs: string[], ou: string, variantes: unknown, roles: readonly string[]): void {
  if (!Array.isArray(variantes) || variantes.length === 0) {
    erreurs.push(`${ou} : aucun texte (NP-01).`);
    return;
  }
  variantes.forEach((variante: unknown, index) => {
    if (typeof variante !== 'string') {
      erreurs.push(`${ou} [${index}] : texte manquant.`);
      return;
    }
    for (const erreur of analyserGabarit(variante, roles)) erreurs.push(`${ou} [${index}] : ${erreur}.`);
  });
}

function verifierGabarit(erreurs: string[], ou: string, gabarit: unknown, roles: readonly string[]): void {
  if (typeof gabarit !== 'string') {
    erreurs.push(`${ou} : aucun texte (NP-01).`);
    return;
  }
  for (const erreur of analyserGabarit(gabarit, roles)) erreurs.push(`${ou} : ${erreur}.`);
}

/**
 * Phrase du récit de fin (D-281) : `ici` toujours, sans la pièce ; `ailleurs`, s'il existe, la nomme ; les formes reprises
 * vont avec les formes qu'elles suivent.
 */
function verifierPhraseFin(erreurs: string[], ou: string, phrase: unknown, roles: readonly string[]): void {
  if (typeof phrase !== 'object' || phrase === null) {
    erreurs.push(`${ou} : aucun texte (NP-01).`);
    return;
  }
  const { ici, ailleurs, iciReprise, ailleursReprise } = phrase as Record<string, unknown>;
  const piece = /\{[^{}:]*:piece\}/;
  verifierGabarit(erreurs, `${ou}, ici`, ici, roles);
  if (typeof ici === 'string' && piece.test(ici)) erreurs.push(`${ou}, ici : redit la pièce.`);
  if (iciReprise !== undefined) verifierGabarit(erreurs, `${ou}, ici après la créature`, iciReprise, roles);
  if (ailleurs !== undefined) {
    verifierGabarit(erreurs, `${ou}, ailleurs`, ailleurs, [...roles, 'piece']);
    if (typeof ailleurs !== 'string' || !piece.test(ailleurs)) erreurs.push(`${ou}, ailleurs : ne nomme pas la pièce.`);
  }
  if (ailleursReprise !== undefined) verifierGabarit(erreurs, `${ou}, ailleurs après la créature`, ailleursReprise, [...roles, 'piece']);
  // Une phrase qui nomme la créature l'a sous toutes ses formes : reprise ici, et ailleurs si elle dit la pièce.
  const incomplete = iciReprise === undefined ? ailleursReprise !== undefined : ailleurs !== undefined && ailleursReprise === undefined;
  if (incomplete) erreurs.push(`${ou} : formes après la créature incomplètes.`);
}

function verifierStructure(erreurs: string[], { monde, textes }: EntreeMonde): void {
  for (const type of TYPES_RECIT) verifierVariantes(erreurs, `événement ${type}`, textes.evenements[type], ROLES_EVENEMENT[type]);
  for (const causes of ['feu', 'griffes_feu'] as const) {
    for (const type of TYPES_AGGRAVATION) verifierVariantes(erreurs, `brûlure ${causes} ${type}`, textes.brulures[causes][type], []);
  }
  for (const causes of ['froid', 'griffes_froid'] as const) {
    for (const type of TYPES_AGGRAVATION) verifierVariantes(erreurs, `gelure ${causes} ${type}`, textes.gelures[causes][type], []);
  }
  for (const cle of CLES_EVACUATION) verifierVariantes(erreurs, `évacuation ${cle}`, textes.evacuations[cle], []);
  for (const type of MOMENTS_FORTS) {
    const variantes = type === 'evacuation' ? CLES_EVACUATION.flatMap((cle) => textes.evacuations[cle]) : textes.evenements[type as TypeRecit];
    for (const variante of variantes as readonly unknown[]) {
      if (typeof variante === 'string' && compterPhrases(variante) > 4) erreurs.push(`événement ${type} : plus de quatre phrases (garde-fou du contrôle).`);
    }
  }
  for (const causes of ['feu', 'griffes_feu'] as const) {
    for (const variante of textes.brulures[causes].defaite as readonly unknown[]) {
      if (typeof variante === 'string' && compterPhrases(variante) > 4) erreurs.push(`brûlure ${causes} defaite : plus de quatre phrases (garde-fou du contrôle).`);
    }
  }
  for (const causes of ['froid', 'griffes_froid'] as const) {
    for (const variante of textes.gelures[causes].defaite as readonly unknown[]) {
      if (typeof variante === 'string' && compterPhrases(variante) > 4) erreurs.push(`gelure ${causes} defaite : plus de quatre phrases (garde-fou du contrôle).`);
    }
  }
  verifierVariantes(erreurs, 'défaite par le vide', textes.asphyxie, []);
  for (const variante of textes.asphyxie as readonly unknown[]) {
    if (typeof variante === 'string' && compterPhrases(variante) > 4) erreurs.push('défaite par le vide : plus de quatre phrases (garde-fou du contrôle).');
  }
  for (const { id } of monde.assistance ?? []) {
    const message = textes.assistance[id] as unknown;
    if (typeof message !== 'string' || message.trim() === '') {
      erreurs.push(`assistance « ${id} » : aucun texte (NP-01).`);
      continue;
    }
    for (const erreur of analyserGabarit(message, [])) erreurs.push(`assistance « ${id} » : ${erreur}.`);
    if (/\d/.test(message)) erreurs.push(`assistance « ${id} » : chiffre dans « ${message} ».`);
  }
  for (const cle of CLES_MOMENT) verifierPhraseFin(erreurs, `fin, moment ${cle}`, textes.fin.moments[cle], ROLES_MOMENT[cle]);
  for (const cle of CLES_MORT) verifierPhraseFin(erreurs, `fin, mort ${cle}`, textes.fin.morts[cle], []);
  for (const [cle, titre] of Object.entries(textes.fin.titres)) verifierGabarit(erreurs, `fin, titre ${cle}`, titre, []);
  verifierGabarit(erreurs, 'fin, réveil', textes.fin.reveil, ['piece']);
  for (const [cle, phrase] of [...Object.entries(textes.fin.sante), ...Object.entries(textes.fin.creature)]) verifierGabarit(erreurs, `fin, départ ${cle}`, phrase, []);
  for (const raison of RAISONS_REFUS) verifierGabarit(erreurs, `refus ${raison}`, textes.refus[raison], []);
  for (const raison of RAISONS_INDISPONIBILITE) {
    verifierGabarit(erreurs, `indisponibilité ${raison}`, textes.indisponibilites[raison], ROLES_INDISPONIBILITE);
  }
  for (const action of ACTIONS) verifierGabarit(erreurs, `libellé ${action}`, textes.libelles[action], ROLES_LIBELLE[action]);
  for (const action of ACTIONS) verifierGabarit(erreurs, `verbe ${action}`, textes.verbes[action], []);
  verifierVariantes(erreurs, 'regarder un passage ouvert', textes.passages.ouvert, ROLES_PASSAGE);
  verifierVariantes(erreurs, 'regarder un passage fermé', textes.passages.ferme, ROLES_PASSAGE);
  verifierVariantes(erreurs, 'regarder un passage ouvert sans destination connue', textes.passages.ouvertSansDestination, ROLES_PASSAGE_SANS_DESTINATION);
  verifierVariantes(erreurs, 'regarder un passage fermé sans destination connue', textes.passages.fermeSansDestination, ROLES_PASSAGE_SANS_DESTINATION);
  verifierGabarit(erreurs, 'libellé aller sans destination connue', textes.allerSansDestination, ROLES_ALLER_SANS_DESTINATION);
  verifierGabarit(erreurs, 'voyant d’une porte étanche sans air derrière', textes.passages.voyantVide, []);
  verifierVariantes(erreurs, 'regarder le vide d’une passerelle', textes.passages.gouffre, ROLES_PASSAGE);
  for (const [cle, roles] of Object.entries(ROLES_OBSERVATION)) {
    verifierGabarit(erreurs, `observation ${cle}`, textes.observation[cle as keyof TextesMonde['observation']], roles);
  }
  for (const niveau of NIVEAUX_RISQUE) verifierGabarit(erreurs, `risque ${niveau}`, textes.apercu.risques[niveau], []);
  for (const cout of COUTS) verifierGabarit(erreurs, `coût ${cout}`, textes.apercu.couts[cout], []);
  for (const type of TYPES_SAVOIR) verifierGabarit(erreurs, `aperçu ${type}`, textes.apercu.savoir[type], ROLES_SAVOIR[type]);
  for (const type of TYPES_DANGER) verifierGabarit(erreurs, `danger ${type}`, textes.apercu.dangers[type], ROLES_DANGER[type]);
  for (const mot of [...Object.values(textes.apercu.risques), ...Object.values(textes.apercu.couts)]) {
    if (/[\d%]/.test(mot)) erreurs.push(`aperçu : chiffre ou pourcentage dans « ${mot} » (C-04 §4.3).`);
  }

  for (const entite of [...monde.pieces, ...monde.liaisons, ...monde.objets, ...(monde.positions ?? [])]) {
    const nom = textes.noms[entite.nom];
    if (nom === undefined) {
      erreurs.push(`nom « ${entite.nom} » sans texte (NP-02).`);
      continue;
    }
    if (nom.texte.trim() === '' || !['m', 'f'].includes(nom.genre) || !['s', 'p'].includes(nom.nombre) || typeof nom.elision !== 'boolean') {
      erreurs.push(`nom « ${entite.nom} » : texte, genre, nombre ou élision manquant (NP-02).`);
    }
  }
  for (const entite of [...monde.pieces, ...monde.objets]) {
    verifierVariantes(erreurs, `description de « ${entite.nom} »`, textes.descriptions[entite.nom], []);
  }
  // PL-04 (14 §4.2) : chaque nom de pièce tient dans son rectangle, avec la place d'une ligne d'état.
  for (const piece of monde.pieces) {
    const nom = textes.noms[piece.nom];
    if (piece.plan === undefined || nom === undefined) continue;
    if (!nomLisible(nom.texte, piece.plan.largeur, piece.plan.hauteur)) {
      erreurs.push(`plan : « ${nom.texte} » ne tient pas dans sa pièce de ${piece.plan.largeur} × ${piece.plan.hauteur} cases (PL-04).`);
    }
  }
}

/** Textes possibles du récit d'un événement, comme le rendu les choisit ; l'assistance n'est pas racontée. */
function variantesRecit(textes: TextesMonde, evenement: Evenement): readonly string[] {
  return evenement.type === 'assistance' ? [] : variantesDe(textes, evenement);
}

/** Phrases qu'une suite d'événements peut produire, toutes variantes confondues ; le maximum ne compte pas les moments forts. */
export interface Bornes {
  readonly minimum: number;
  readonly maximum: number;
  readonly momentFort: boolean;
}

function bornesPhrases(textes: TextesMonde, evenements: readonly Evenement[]): Bornes {
  let minimum = 0;
  let maximum = 0;
  let momentFort = false;
  for (const evenement of evenements) {
    const comptes = variantesRecit(textes, evenement).map(compterPhrases);
    if (comptes.length === 0) continue;
    minimum += Math.min(...comptes);
    if (MOMENTS_FORTS.includes(evenement.type)) momentFort = true;
    else maximum += Math.max(...comptes);
  }
  return { minimum, maximum, momentFort };
}

export function direBornes({ minimum, maximum, momentFort }: Bornes): string {
  if (momentFort) return `au moins ${minimum} phrase(s), au plus ${maximum} hors moment fort`;
  return minimum === maximum ? `${minimum} phrase(s)` : `de ${minimum} à ${maximum} phrase(s) selon les variantes`;
}

/** Récit de plus de quatre phrases rendu hors des pas joués par les parcours témoins, une entrée par état où il a été rendu. */
export interface Avertissement {
  /** Suite des événements de l'action, dans l'ordre. */
  readonly combinaison: string;
  readonly bornes: string;
  readonly message: string;
}

/** Combinaison d'événements en cause, avec le nombre d'états où son récit a dépassé quatre phrases. */
export interface GroupeAvertissements {
  readonly combinaison: string;
  readonly occurrences: number;
  readonly bornes: readonly string[];
}

export function regrouperAvertissements(avertissements: readonly Avertissement[]): GroupeAvertissements[] {
  const groupes = new Map<string, { occurrences: number; bornes: Set<string> }>();
  for (const { combinaison, bornes } of avertissements) {
    const groupe = groupes.get(combinaison) ?? { occurrences: 0, bornes: new Set<string>() };
    groupe.occurrences += 1;
    groupe.bornes.add(bornes);
    groupes.set(combinaison, groupe);
  }
  return [...groupes]
    .map(([combinaison, { occurrences, bornes }]) => ({ combinaison, occurrences, bornes: [...bornes] }))
    .sort((a, b) => b.occurrences - a.occurrences || a.combinaison.localeCompare(b.combinaison));
}

interface Rendu {
  readonly texte: string;
  readonly ou: string;
  /**
   * Récit d'une action engagée : ses événements et ses bornes de phrases (D-111). Plus de quatre phrases est une erreur
   * pour une étape d'un parcours témoin (`temoin`). Ailleurs, c'est un avertissement : D-111 ne dit pas comment raconter
   * une action qui cumule assez d'événements pour dépasser quatre phrases (feu, blessure et menace dans le même pas), à
   * faire arbitrer.
   */
  readonly recit?: { readonly combinaison: string; readonly bornes: Bornes; readonly temoin: boolean };
  /** Aperçu : ni chiffre ni pourcentage (C-04 §4.3). */
  readonly sansChiffre?: true;
}

/** Ce que l'exploration a rendu et relevé ; chaque texte est contrôlé dès qu'il est rendu, sans être gardé. */
interface Exploration {
  /** Types d'événements effectivement racontés. */
  readonly types: Set<TypeEvenement>;
  /** États dont les textes ont été rendus. */
  readonly vus: Set<string>;
  readonly internes: readonly string[];
  readonly erreurs: Set<string>;
  readonly avertissements: Avertissement[];
  /** Étapes des parcours témoins : état de départ et commande jouée (voir `etapeTemoin`). */
  readonly temoins: ReadonlySet<string>;
}

function controler(exploration: Exploration, { texte, ou, recit, sansChiffre }: Rendu): void {
  const { erreurs, internes } = exploration;
  if (/[{}]/.test(texte)) erreurs.add(`${ou} : trou non rempli dans « ${texte} ».`);
  const fuite = internes.find((id) => texte.includes(id));
  if (fuite !== undefined || ID_PUBLIC.test(texte)) erreurs.add(`${ou} : identifiant affiché dans « ${texte} » (NP-02).`);
  if (sansChiffre === true && /[\d%]/.test(texte)) erreurs.add(`${ou} : chiffre ou pourcentage dans « ${texte} » (C-04 §4.3).`);
  if (recit === undefined) return;
  const { minimum, maximum } = recit.bornes;
  const bornes = direBornes(recit.bornes);
  const message = `${ou} : ${bornes} ; 2 à 4 attendues (D-111).`;
  if (minimum < 2 || (maximum > 4 && recit.temoin)) erreurs.add(message);
  else if (maximum > 4) exploration.avertissements.push({ combinaison: recit.combinaison, bornes, message });
}

/** Couverture du contrôle, affichée pour savoir ce qui a réellement été rendu. */
export interface Couverture {
  readonly etats: number;
  /** Tous les états atteignables ont été explorés : la borne n'a pas coupé l'exploration. */
  readonly complete: boolean;
  readonly rendus: readonly TypeEvenement[];
  readonly jamais: readonly TypeEvenement[];
}

/** Clé d'un état pour l'exploration : sans compteur, dés ni mémoire, qu'aucune règle ne lit (14 §3) ; sinon l'espace serait infini. */
function cleEtat(partie: Partie): string {
  return JSON.stringify({ ...partie.etat, actions: 0, generateur: null, memoire: null });
}

/** Rend chaque texte que le joueur peut voir dans cet état et renvoie les parties qui suivent ses actions engagées. */
function visiter({ monde, textes }: EntreeMonde, partie: Partie, exploration: Exploration): Partie[] {
  const { types } = exploration;
  const rendre = (rendu: Rendu): void => controler(exploration, rendu);
  const cle = cleEtat(partie);
  exploration.vus.add(cle);
  const graine = partie.enregistrement.graine;
  const suivantes: Partie[] = [];
  const observation = observer(monde, partie.etat);
  for (const ligne of rendreObservation(textes, observation)) rendre({ texte: ligne, ou: 'observation' });
  for (const ligne of lignesListeCarte(rendreListeCarte(textes, observation.carte))) rendre({ texte: ligne, ou: 'carte', sansChiffre: true });
  for (const option of observation.menu) {
    const { libelle, raison } = libelleOption(textes, option);
    rendre({ texte: libelle, ou: `libellé ${option.action}` });
    if (raison !== null) rendre({ texte: raison, ou: `indisponibilité ${option.action}` });
    const prevu = apercu(monde, partie, option.commande);
    if (prevu.type === 'apercu') {
      const { risque, danger, cout, savoir } = rendreApercu(textes, prevu.apercu);
      for (const texte of [risque, ...(danger === null ? [] : [danger]), cout, ...savoir]) {
        rendre({ texte, ou: `aperçu ${option.action}`, sansChiffre: true });
      }
    }
    const resultat = jouer(monde, partie, option.commande);
    const repere = { graine, action: partie.etat.actions + 1 };
    if (resultat.type === 'consultation') {
      rendre({ texte: rendreConsultation(textes, resultat.consultation, repere), ou: `consultation ${option.action}` });
    } else if (resultat.type === 'engagee') {
      const suite = resultat.evenements.map((evenement) => evenement.type);
      for (const type of suite) types.add(type);
      const combinaison = suite.join(' + ');
      rendre({
        texte: rendreEvenements(textes, resultat.evenements, repere).join(' '),
        ou: `action ${option.action} (${combinaison})`,
        recit: { combinaison, bornes: bornesPhrases(textes, resultat.evenements), temoin: exploration.temoins.has(etapeTemoin(cle, option.commande)) },
      });
      for (const message of rendreAssistance(textes, resultat.evenements)) rendre({ texte: message, ou: 'assistance' });
      suivantes.push(resultat.partie);
    }
  }
  return suivantes;
}

/** Parties qui suivent les actions engagées d'un état, sans rien rendre. */
function successeurs({ monde }: EntreeMonde, partie: Partie): Partie[] {
  const suivantes: Partie[] = [];
  for (const option of observer(monde, partie.etat).menu) {
    const resultat = jouer(monde, partie, option.commande);
    if (resultat.type === 'engagee') suivantes.push(resultat.partie);
  }
  return suivantes;
}

function etapeTemoin(cle: string, commande: Commande): string {
  return `${cle}\n${JSON.stringify(commande)}`;
}

/**
 * Étapes des parcours témoins, calculées d'avance : un état de parcours peut d'abord être atteint comme voisin d'un autre.
 * Un parcours qui échoue s'arrête là ; l'erreur est relevée par l'exploration.
 */
function etapesTemoins({ monde, parcours }: EntreeMonde, depart: Partie): Set<string> {
  const temoins = new Set<string>();
  for (const { etapes } of parcours) {
    let partie = depart;
    for (const etape of etapes) {
      const option = trouverOption(observer(monde, partie.etat), etape);
      const resultat = option === undefined || !option.disponible ? null : jouer(monde, partie, option.commande);
      if (option === undefined || resultat?.type !== 'engagee') break;
      temoins.add(etapeTemoin(cleEtat(partie), option.commande));
      partie = resultat.partie;
    }
  }
  return temoins;
}

/**
 * Rend les textes de trois façons : le long de chaque parcours témoin avec les voisins immédiats de chaque état, en largeur
 * depuis le départ jusqu'à `maxEtats` états, puis par des marches au hasard à graine fixe.
 */
function explorer(
  entree: EntreeMonde,
  version: string,
  maxEtats: number,
): { exploration: Exploration; complete: boolean; typesParcours: Set<TypeEvenement> } {
  const { monde, textes } = entree;
  const internes = [monde.id, ...[...monde.pieces, ...monde.liaisons, ...monde.objets].map((entite) => entite.id)];
  const depart = nouvellePartie(monde, { version, graine: 1 });
  const exploration: Exploration = {
    types: new Set(),
    vus: new Set(),
    internes,
    erreurs: new Set(),
    avertissements: [],
    temoins: etapesTemoins(entree, depart),
  };
  const { types, vus, erreurs } = exploration;
  const rendre = (rendu: Rendu): void => controler(exploration, rendu);
  rendre({ texte: rendreEvenements(textes, depart.derniers, { graine: 1, action: 0 }).join(' '), ou: 'réveil' });
  for (const message of rendreAssistance(textes, depart.derniers)) rendre({ texte: message, ou: 'assistance' });
  for (const evenement of depart.derniers) types.add(evenement.type);
  for (const raison of RAISONS_REFUS) rendre({ texte: rendreRefus(textes, raison), ou: `refus ${raison}` });

  const typesParcours = new Set<TypeEvenement>();
  for (const parcours of entree.parcours) {
    let partie = depart;
    const voir = (courante: Partie): void => {
      const voisines = vus.has(cleEtat(courante)) ? successeurs(entree, courante) : visiter(entree, courante, exploration);
      for (const voisine of voisines) if (!vus.has(cleEtat(voisine))) visiter(entree, voisine, exploration);
    };
    for (const [index, etape] of parcours.etapes.entries()) {
      voir(partie);
      const option = trouverOption(observer(monde, partie.etat), etape);
      const resultat = option === undefined || !option.disponible ? null : jouer(monde, partie, option.commande);
      if (resultat?.type !== 'engagee') {
        erreurs.add(`parcours « ${parcours.nom} », étape ${index + 1} : option absente ou non engagée.`);
        break;
      }
      for (const evenement of resultat.evenements) typesParcours.add(evenement.type);
      partie = resultat.partie;
    }
    voir(partie);
  }

  // Largeur par niveaux : seule la frontière est gardée en mémoire. Les états déjà rendus par les parcours sont développés
  // sans être rendus à nouveau.
  const developpes = new Set<string>();
  let frontiere: Partie[] = [depart];
  while (frontiere.length > 0 && developpes.size < maxEtats) {
    const suivante: Partie[] = [];
    const prevus = new Set<string>();
    for (const partie of frontiere) {
      const cle = cleEtat(partie);
      if (developpes.has(cle)) continue;
      if (developpes.size >= maxEtats) {
        suivante.push(partie);
        continue;
      }
      developpes.add(cle);
      for (const voisine of vus.has(cle) ? successeurs(entree, partie) : visiter(entree, partie, exploration)) {
        const cleVoisine = cleEtat(voisine);
        if (developpes.has(cleVoisine) || prevus.has(cleVoisine)) continue;
        prevus.add(cleVoisine);
        suivante.push(voisine);
      }
    }
    frontiere = suivante;
  }
  const complete = frontiere.every((partie) => developpes.has(cleEtat(partie)));
  developpes.clear();

  for (let marche = 0; marche < MARCHES; marche++) {
    let partie = nouvellePartie(monde, { version, graine: marche + 2 });
    let hasard = marche + 1;
    for (let pas = 0; pas < LONGUEUR_MARCHE; pas++) {
      const suivantes = vus.has(cleEtat(partie)) ? successeurs(entree, partie) : visiter(entree, partie, exploration);
      if (suivantes.length === 0) break;
      // Générateur congruentiel à graine fixe : mêmes marches à chaque contrôle.
      hasard = (hasard * 1103515245 + 12345) % 2147483648;
      partie = suivantes[hasard % suivantes.length] as Partie;
    }
  }
  return { exploration, complete, typesParcours };
}

export interface ResultatTextes {
  readonly erreurs: readonly string[];
  /**
   * Récits de plus de quatre phrases rendus hors des pas joués par les parcours témoins (D-111, à arbitrer) : une entrée par
   * état et par action.
   */
  readonly avertissements: readonly Avertissement[];
  /** Absente si la structure des textes est déjà en erreur. */
  readonly couverture: Couverture | null;
}

export function controlerTextes(entree: EntreeMonde, version = 'controle-textes', maxEtats = MAX_ETATS): ResultatTextes {
  const erreurs: string[] = [];
  verifierStructure(erreurs, entree);
  if (erreurs.length > 0) return { erreurs, avertissements: [], couverture: null };

  let resultat: ReturnType<typeof explorer>;
  try {
    resultat = explorer(entree, version, maxEtats);
  } catch (erreur) {
    return { erreurs: [`rendu impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}`], avertissements: [], couverture: null };
  }
  const { exploration, complete, typesParcours } = resultat;
  const jamais = TYPES_EVENEMENT.filter((type) => !exploration.types.has(type));
  for (const type of jamais) {
    if (typesParcours.has(type)) exploration.erreurs.add(`événement ${type} : atteint par un parcours témoin mais jamais rendu.`);
  }
  return {
    erreurs: [...exploration.erreurs],
    avertissements: [...exploration.avertissements],
    couverture: { etats: exploration.vus.size, complete, rendus: TYPES_EVENEMENT.filter((type) => exploration.types.has(type)), jamais },
  };
}

export function verifierTextes(entree: EntreeMonde, version = 'controle-textes'): string[] {
  return [...controlerTextes(entree, version).erreurs];
}

/**
 * La station d'une composition contrôlée (`COMPOSITIONS_CONTROLEES`, spec L3 §6.4), à la graine de plan vérifiée par
 * `check:stations`. Elle porte pour seul parcours le témoin d'évacuation de `verifierStation`, ou de `verifierLibre` en ordre
 * libre ; sans témoin, elle est refusée.
 * Prouver une station coûte environ une seconde : qui n'en veut qu'une n'appelle pas `entreesAControler`.
 */
export function entreeAControler(catalogue: Catalogue, composition: string): readonly [string, EntreeMonde | Refus] {
  const station = stationDeReference(catalogue, composition);
  if ('refus' in station) return [composition, station];
  // Ordre libre : le témoin de `check:stations`, première cloison d'abord (spec L5 §4.1).
  const libre = station.entree.monde.liaisons.some((liaison) => liaison.verrouillee === true);
  const rapport = libre ? verifierLibre(station.entree) : verifierStation(station.entree);
  const id = station.entree.monde.id;
  if (rapport.parcours === null) return [id, { refus: `Évacuation non prouvée (${rapport.verdict}) : ${rapport.diagnostic}` }];
  return [id, { ...station.entree, parcours: [rapport.parcours] }];
}

/** Mondes du catalogue, puis une station par composition contrôlée. */
export function entreesAControler(catalogue: Catalogue): (readonly [string, EntreeMonde | Refus])[] {
  return [...Object.entries(catalogue.mondes), ...COMPOSITIONS_CONTROLEES.map((composition) => entreeAControler(catalogue, composition))];
}

/** Une ligne de compte rendu de `check:texts`, sur la sortie standard (`log`) ou d'erreur. */
export interface LigneCompteRendu {
  readonly niveau: 'log' | 'warn' | 'error';
  readonly texte: string;
}

/** Compte rendu d'une entrée à contrôler : ses lignes et son nombre d'erreurs. */
export interface CompteRendu {
  readonly lignes: readonly LigneCompteRendu[];
  readonly erreurs: number;
}

export function controlerEntree(id: string, aControler: EntreeMonde | Refus): CompteRendu {
  const lignes: LigneCompteRendu[] = [];
  const dire = (niveau: LigneCompteRendu['niveau'], texte: string): void => {
    lignes.push({ niveau, texte });
  };
  if ('refus' in aControler) {
    dire('error', `${id} : ${aControler.refus}`);
    return { lignes, erreurs: 1 };
  }
  const debut = Date.now();
  const { erreurs, avertissements, couverture } = controlerTextes(aControler, undefined, borneDe(aControler));
  for (const erreur of erreurs) dire('error', `${id} : ${erreur}`);
  if (erreurs.length === 0) dire('log', `${id} : textes complets, trous sûrs, aucun identifiant affiché.`);
  if (couverture !== null) {
    const borne = couverture.complete ? 'exploration complète' : `borne de ${borneDe(aControler)} états atteinte`;
    dire('log', `${id} : ${couverture.etats} états rendus (${borne} ; parcours témoins et voisins, ${MARCHES} marches au hasard) en ${Math.round((Date.now() - debut) / 1000)} s.`);
    dire('log', `${id} : événements racontés ${couverture.rendus.length}/${TYPES_EVENEMENT.length} : ${couverture.rendus.join(', ')}.`);
    if (couverture.jamais.length > 0) dire('warn', `${id} : avertissement, jamais rendus : ${couverture.jamais.join(', ')}.`);
  }
  if (avertissements.length > 0) {
    const groupes = regrouperAvertissements(avertissements);
    dire(
      'warn',
      `${id} : avertissement, ${avertissements.length} récit(s) de plus de quatre phrases hors des pas joués par les parcours témoins (un par état et par action explorés, pas une fréquence en partie), en ${groupes.length} combinaison(s) d’événements (D-111, à arbitrer) :`,
    );
    for (const { combinaison, occurrences, bornes } of groupes) dire('warn', `  ${occurrences} × ${combinaison} — ${bornes.join(' ; ')}`);
  }
  return { lignes, erreurs: erreurs.length };
}

/** Ce que contrôle `check:texts`, dans l'ordre : mondes du catalogue, puis compositions contrôlées. */
export function idsAControler(catalogue: Catalogue): string[] {
  return [...Object.keys(catalogue.mondes), ...COMPOSITIONS_CONTROLEES];
}

/**
 * Lot de `check:texts` (#180) : chaque entrée du lot est contrôlée, ou son compte rendu repris du cache quand le même code l'a
 * déjà rendue sans erreur ; le lot 1 contrôle aussi les couches des textes.
 */
export function controlerLot(lot: Lot, catalogue: Catalogue = CATALOGUE, cache?: CacheVerdicts): CompteRendu & { readonly repris: number } {
  const lignes: LigneCompteRendu[] = [];
  let erreurs = 0;
  let repris = 0;
  for (const id of dansLeLot(idsAControler(catalogue), lot)) {
    const connu = cache?.lire<CompteRendu>(`entree ${id}`);
    if (connu !== undefined) {
      repris++;
      lignes.push(...connu.lignes.map((ligne) => (ligne.niveau === 'log' && ligne.texte.includes(' états rendus ') ? { ...ligne, texte: `${ligne.texte} (repris du cache)` } : ligne)));
      continue;
    }
    const monde = catalogue.mondes[id];
    const compte = controlerEntree(...(monde === undefined ? entreeAControler(catalogue, id) : ([id, monde] as const)));
    lignes.push(...compte.lignes);
    erreurs += compte.erreurs;
    if (compte.erreurs === 0) cache?.ecrire(`entree ${id}`, compte);
  }
  if (lot.numero === 1) {
    const fuites = fuitesDeCouches(MORCEAUX_TEXTES);
    erreurs += fuites.length;
    for (const fuite of fuites) lignes.push({ niveau: 'error', texte: `couches : ${fuite}` });
    if (fuites.length === 0) lignes.push({ niveau: 'log', texte: 'couches : aucun mot de l’univers ni de la menace dans le socle et les morceaux.' });
    const traces = tracesHorsPiste();
    erreurs += traces.length;
    for (const trace of traces) lignes.push({ niveau: 'error', texte: `grandes stations : ${trace}` });
    if (traces.length === 0) lignes.push({ niveau: 'log', texte: 'grandes stations : aucune trace hors de la piste dans les descriptions calmes.' });
  }
  return { lignes, erreurs, repris };
}

/**
 * Descriptions qu’une grande station montre (spec 2026-10-18 §5.4) : celles des morceaux, ou leur variante calme, et celles de
 * l’univers. Aucune ne porte un mot réservé aux traces : dans une grande station, seule la piste en ajoute, et elle dit vrai.
 */
export function tracesHorsPiste(): string[] {
  const morceaux = Object.values(MORCEAUX).filter(({ morceau }) => morceau.grande !== undefined);
  return [
    ...morceaux.flatMap(({ morceau, textes }) => fuitesDuCatalogue({ noms: {}, descriptions: { ...textes.descriptions, ...textes.calmes }, assistance: {} }).map((fuite) => `morceau ${morceau.id}, ${fuite}`)),
    ...fuitesDuCatalogue({ noms: {}, descriptions: UNIVERS.descriptions, assistance: {} }).map((fuite) => `univers, ${fuite}`),
  ];
}

async function principal(): Promise<void> {
  const argumentsCli = process.argv.slice(2);
  const inconnu = argumentsCli.find((argument) => argument !== '--sans-cache' && !argument.startsWith('--lot=') && !argument.startsWith('--processus='));
  if (inconnu !== undefined) throw new Error(`Option inconnue : ${inconnu}.`);
  const { lot, parts, reste } = lireOptionsLots(argumentsCli);
  const debut = Date.now();
  if (parts > 1) {
    const sorties = await lancerSousLots(fileURLToPath(import.meta.url), lot, parts, reste);
    for (const { sortie, erreurs } of sorties) {
      process.stdout.write(sortie);
      process.stderr.write(erreurs);
    }
    const echecs = sorties.filter(({ code }) => code !== 0).length;
    console.log(`check:texts : lot ${lot.numero}/${lot.total} en ${parts} processus, ${Math.round((Date.now() - debut) / 1000)} s.`);
    if (echecs > 0) {
      console.error(`\n${echecs} processus en échec : erreurs dans les textes (docs/contrats/C-07-textes.md §4).`);
      process.exitCode = 1;
    }
    return;
  }
  let cache: CacheVerdicts | undefined;
  if (!argumentsCli.includes('--sans-cache')) {
    const empreinte = empreinteCode(['tools/check-texts.ts']);
    purgerCache('check-texts', empreinte);
    cache = ouvrirCache('check-texts', empreinte);
  }
  const { lignes, erreurs, repris } = controlerLot(lot, CATALOGUE, cache);
  for (const { niveau, texte } of lignes) console[niveau](texte);
  console.log(`check:texts : lot ${lot.numero}/${lot.total}, ${repris} entrée(s) reprise(s) du cache, ${Math.round((Date.now() - debut) / 1000)} s.`);
  if (erreurs > 0) {
    console.error(`\n${erreurs} erreur(s) dans les textes (docs/contrats/C-07-textes.md §4).`);
    process.exitCode = 1;
  }
}

if (isMainModule(import.meta.url)) {
  principal().catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? erreur.stack ?? erreur.message : String(erreur));
    process.exitCode = 1;
  });
}
