import {
  ACTIONS,
  apercu,
  CLE_TROUSSE,
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
  type CoucheDocument,
  type EmplacementDocument,
  type Evenement,
  type Commande,
  type Partie,
  type RefObjet,
  type RefPiece,
  type TypeEvenement,
} from '../engine';
import {
  analyserGabarit,
  CATALOGUE_PIECES,
  CLES_EVACUATION,
  CLES_MOMENT,
  CLES_MORT,
  COMPOSITIONS_CONTROLEES,
  DOCUMENTS,
  EMPLACEMENTS_DOCUMENTS,
  fuitesDeCouches,
  fuitesDesCouches,
  fuitesDuCatalogue,
  MENACE,
  minuscules,
  MORCEAUX,
  motsReserves,
  SOCLE,
  TEXTES_CATALOGUE,
  UNIVERS,
  libelleOption,
  lignesListeCarte,
  MORCEAUX_TEXTES,
  nomDe,
  nomLisible,
  rendreApercu,
  rendreAssistance,
  rendreConsultation,
  rendreDocument,
  rendreEvenements,
  rendreListeCarte,
  rendreObservation,
  rendreRefus,
  reunir,
  variantesDe,
  ROLES_ALLER_SANS_DESTINATION,
  ROLES_POSER_A_POSITION,
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
  type CompositionGrande,
  type DocumentRendu,
  type EntreeMonde,
  type EntreeMorceau,
  type Nom,
  type Refus,
  type Reserve,
  type TexteDocument,
  type TextesMonde,
  type TypeRecit,
} from '../content';
import { fileURLToPath } from 'node:url';
import { CATALOGUE } from './catalogue';
import { empreinteCode, ouvrirCache, purgerCache } from './empreinte-code';
import { dansLeLot, lancerSousLots, lireOptionsLots, type Lot } from './lots';
import { isMainModule } from './repo-files';
import { trouverOption } from './rejouer-parcours';
import { cloisonsDuCarrefour, stationDeReference, verifierLibre, verifierStation, type CacheVerdicts } from './verifier-station';

// Contrôles des textes (C-07 §4, AP-08) : NP-01 un événement un texte, NP-02 trous sûrs, D-111 longueur ; et, sans station,
// la réserve de documents des grandes stations, leurs phrases de pillage, de trace et de bruit (spec 2026-10-18 §11).

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

/**
 * Borne d'une grande station : son espace d'états dépasse de loin ce qu'une exploration rend en quelques secondes. Les
 * documents sont rendus dès les premières salles (trois à quatre sur cinq à sept dès 5 000 états, trois à cinq à 50 000) : la
 * borne garde chaque grande station à une dizaine de secondes.
 */
export const MAX_ETATS_GRANDE = 10000;

/** Identifiant d'une grande station publiée : `g<version>-<composition>-<graine>`, la composition d'un côté, la graine de l'autre. */
const GRANDE = /^(g\d+-.+)-(\d+)$/;

/** Borne d'exploration d'une entrée : le monde de test et les grandes stations à part. */
export function borneDe(entree: EntreeMonde): number {
  const { id } = entree.monde;
  return id === 'monde-test' ? MAX_ETATS_MONDE_TEST : GRANDE.test(id) ? MAX_ETATS_GRANDE : MAX_ETATS;
}
/** Marches au hasard à graine fixe : nombre et longueur, pour atteindre des états profonds (feu propagé, blessures). */
const MARCHES = 40;
const LONGUEUR_MARCHE = 80;

const TYPES_RECIT = TYPES_EVENEMENT.filter((type): type is TypeRecit => type !== 'evacuation' && type !== 'assistance' && type !== 'ecoute' && type !== 'capteur' && type !== 'capteur_pose');

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
  for (const [cle, variantes] of Object.entries(textes.ecoute)) verifierVariantes(erreurs, `écoute ${cle}`, variantes, ['passage']);
  verifierVariantes(erreurs, 'attente avant écoute', textes.attenteEcoute, []);
  for (const [cle, variantes] of Object.entries(textes.capteur)) verifierVariantes(erreurs, `capteur ${cle}`, variantes, []);
  for (const [cle, variantes] of Object.entries(textes.capteurPose)) verifierVariantes(erreurs, `pose du capteur ${cle}`, variantes, []);
  verifierVariantes(erreurs, 'attente dans le vacarme', textes.attenteVacarme, []);
  for (const [cle, phrase] of Object.entries(textes.attentesLongues)) verifierGabarit(erreurs, `attente longue ${cle}`, phrase, []);
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
  verifierGabarit(erreurs, 'libellé poser à une position', textes.poserAPosition, ROLES_POSER_A_POSITION);
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
  for (const piece of monde.pieces) verifierVariantes(erreurs, `description de « ${piece.nom} »`, textes.descriptions[piece.nom], []);
  for (const objet of monde.objets) {
    // Un document n'a pas de description : son texte est dans la section `documents` (spec 2026-10-18 §8.5).
    if (objet.document !== true) verifierVariantes(erreurs, `description de « ${objet.nom} »`, textes.descriptions[objet.nom], []);
    else if (!Object.hasOwn(textes.documents, objet.nom)) erreurs.push(`document « ${objet.nom} » : aucun texte (NP-01).`);
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
      const { consultation } = resultat;
      rendre({ texte: rendreConsultation(textes, consultation, repere), ou: `consultation ${option.action}` });
      // Un document : sa puce et sa ligne « où » sans chiffre ; son corps en a le droit (spec 2026-10-18 §8.4, C-04 §4.3).
      if (consultation.type === 'regarder_document') {
        const { nom } = consultation.cible;
        rendre({ texte: nomDe(textes, consultation.cible).texte, ou: `document ${nom}, puce`, sansChiffre: true });
        rendre({ texte: rendreDocument(textes, consultation).ou, ou: `document ${nom}, ligne « où »`, sansChiffre: true });
      }
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
 * libre ; sans témoin, elle est refusée. Une grande station publiée `g<version>-…-<graine>` se construit telle quelle, sans parcours :
 * l'exploration seule la parcourt.
 * Prouver une station coûte environ une seconde : qui n'en veut qu'une n'appelle pas `entreesAControler`.
 */
export function entreeAControler(catalogue: Catalogue, composition: string): readonly [string, EntreeMonde | Refus] {
  const [, grande, graine] = GRANDE.exec(composition) ?? [];
  if (grande !== undefined && graine !== undefined) return [composition, catalogue.construireGrande(grande, Number(graine))];
  const station = stationDeReference(catalogue, composition);
  if ('refus' in station) return [composition, station];
  // Ordre libre : le témoin de `check:stations`, première cloison d'abord (spec L5 §4.1).
  const libre = cloisonsDuCarrefour(station.entree.monde).length > 0;
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

/**
 * Trois grandes stations publiées (spec 2026-10-18 §11), choisies dans l'ordre de la liste publiée : la première en chaîne, la
 * première en ordre libre, la première, parmi les autres, qui porte la note d'une clé déplacée. Une station qui ne se construit
 * plus (liste périmée) est sautée ; le choix suit la liste, qu'une republication renouvelle sans retouche d'ici.
 */
export function grandesAControler(catalogue: Catalogue): string[] {
  const forme = (id: string): CompositionGrande['forme'] | undefined => catalogue.grandes.find((composition) => composition.id === GRANDE.exec(id)?.[1])?.forme;
  const aUneCle = ({ monde }: EntreeMonde): boolean =>
    monde.objets.some((objet) => objet.document === true && objet.designe !== undefined && EMPLACEMENTS_DOCUMENTS.find((emplacement) => emplacement.id === objet.nom)?.cle !== CLE_TROUSSE);
  const premiere = (convient: (id: string) => boolean, cle = false): string[] => {
    for (const id of catalogue.publiees) {
      if (!convient(id)) continue;
      const entree = entreeAControler(catalogue, id)[1];
      if (!('refus' in entree) && (!cle || aUneCle(entree))) return [id];
    }
    return [];
  };
  const chaine = premiere((id) => forme(id) === 'chaine');
  const libre = premiere((id) => forme(id) === 'libre');
  return [...chaine, ...libre, ...premiere((id) => !chaine.includes(id) && !libre.includes(id), true)];
}

/** Ce que contrôle `check:texts`, dans l'ordre : mondes du catalogue, compositions contrôlées, puis trois grandes stations publiées. */
export function idsAControler(catalogue: Catalogue): string[] {
  return [...Object.keys(catalogue.mondes), ...COMPOSITIONS_CONTROLEES, ...grandesAControler(catalogue)];
}

/**
 * Lot de `check:texts` (#180) : chaque entrée du lot est contrôlée, ou son compte rendu repris du cache quand le même code l'a
 * déjà rendue sans erreur ; le lot 1 contrôle aussi les textes sans station (couches, traces, documents, phrases).
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
    const communs = controlerTextesCommuns();
    lignes.push(...communs.lignes);
    erreurs += communs.erreurs;
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

// Réserve de documents des grandes stations (spec 2026-10-18 §8.4, §8.5, §11, #209) : chaque document est rendu par `rendreDocument`,
// sans station de référence, puis contrôlé : structure, trous, couche et mots réservés, longueur, chiffres, noms de puce.

/** Ce que contrôle `controlerReserve` : les places, les textes communs (univers, menace, trousse) et les morceaux, avec leurs clés. */
export interface SourcesReserve {
  readonly emplacements: readonly EmplacementDocument[];
  readonly communs: Readonly<Record<string, TexteDocument>>;
  readonly morceaux: Readonly<Record<string, EntreeMorceau>>;
}

export const SOURCES_RESERVE: SourcesReserve = { emplacements: EMPLACEMENTS_DOCUMENTS, communs: DOCUMENTS, morceaux: MORCEAUX };

/** Mots que chaque couche d'un document ne dit jamais (spec §8.4). */
const INTERDITS: Readonly<Record<CoucheDocument, readonly Reserve[]>> = {
  univers: ['menace', 'traces'],
  menace: ['univers'],
  morceau: ['univers', 'menace', 'traces'],
  rangement: ['univers', 'menace', 'traces'],
};

/** Un trou qui nomme la pièce : « le », « de » ou « a », avec ou sans majuscule. */
const TROU_PIECE = /\{(?:le|de|a):piece\}/i;
const TROU_INTERDIT = 'trou interdit : le seul trou est la pièce, dans le corps d’une note de rangement.';
const SANS_TEXTE = { noms: {}, descriptions: {}, assistance: {} };

/** Noms affichés des pièces et des objets des morceaux, du catalogue et de l'univers, en minuscules : une puce n'en reprend aucun (bible §6). */
function nomsDesLieux(): Set<string> {
  const noms = [UNIVERS.noms, TEXTES_CATALOGUE.noms, ...Object.values(MORCEAUX_TEXTES).map((textes) => textes.noms)];
  return new Set(noms.flatMap((table) => Object.values(table).map((nom) => minuscules(nom.texte))));
}

/** Une pièce du catalogue : la clé de son nom et son nom. */
export interface PieceReserve {
  readonly cle: string;
  readonly nom: Nom;
}

/** Pièces du catalogue qui peuvent recevoir une clé de l'une de ces étiquettes (spec §5.2). */
export function piecesPour(etiquettes: readonly string[]): PieceReserve[] {
  return Object.values(CATALOGUE_PIECES).flatMap(({ morceau }) => {
    const cle = morceau.pieces[0]?.nom ?? '';
    const nom = TEXTES_CATALOGUE.noms[cle];
    return nom !== undefined && morceau.annexe?.etiquettes.some((etiquette) => etiquettes.includes(etiquette)) === true ? [{ cle, nom }] : [];
  });
}

/** Une à cinq phrases hors didascalies, ou une à cinq lignes pour un journal (spec §8.4). */
function longueurDuDocument(rendu: DocumentRendu): string | null {
  const journal = rendu.support === 'journal';
  const nombre = journal ? rendu.corps.length : rendu.corps.reduce((total, ligne) => total + (ligne.didascalie === true ? 0 : compterPhrases(ligne.texte)), 0);
  return nombre >= 1 && nombre <= 5 ? null : `${nombre} ${journal ? 'ligne(s) de journal' : 'phrase(s)'}, une à cinq attendues.`;
}

/**
 * Rend un document par `rendreDocument` : tel quel, ou, pour une note de rangement (`pieces` non nul), une fois par pièce du
 * catalogue où sa clé peut aller, sous son nom puis numérotée (« consigne B »). Une erreur de rendu s'ajoute à `erreurs` et
 * arrête les rendus de ce document.
 */
function rendreLaPlace(erreurs: string[], ou: string, textes: TextesMonde, cible: RefObjet, pieces: readonly PieceReserve[] | null): DocumentRendu[] {
  const regards: { libelle: string; textes: TextesMonde; designe?: RefPiece }[] =
    pieces === null
      ? [{ libelle: 'rendu', textes }]
      : pieces.flatMap(({ cle, nom }) =>
          [[cle, nom.texte], [`${cle}_b`, `${nom.texte} B`]].map(([nomPiece = '', texte = '']) => ({
            libelle: `rendu avec « ${texte} »`,
            textes: { ...textes, noms: { ...textes.noms, [nomPiece]: { ...nom, texte } } },
            designe: { sorte: 'piece', id: `e${nomPiece}`, nom: nomPiece },
          })),
        );
  const rendus: DocumentRendu[] = [];
  for (const { libelle, textes: lesTextes, designe } of regards) {
    try {
      rendus.push(rendreDocument(lesTextes, { type: 'regarder_document', cible, ...(designe === undefined ? {} : { designe }) }));
    } catch (erreur) {
      erreurs.push(`${ou}, ${libelle} : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
      break;
    }
  }
  return rendus;
}

function analyserReserve({ emplacements, communs, morceaux }: SourcesReserve): { readonly erreurs: string[]; readonly rendus: ReadonlyMap<string, readonly DocumentRendu[]> } {
  const erreurs: string[] = [];
  const rendusParDocument = new Map<string, readonly DocumentRendu[]>();
  const lu = (table: Readonly<Record<string, TexteDocument>> | undefined, id: string): TexteDocument | undefined => (table !== undefined && Object.hasOwn(table, id) ? table[id] : undefined);
  const definitions = new Map<string, number>();
  for (const id of [...Object.keys(communs), ...Object.values(morceaux).flatMap(({ textes }) => Object.keys(textes.documents ?? {}))]) definitions.set(id, (definitions.get(id) ?? 0) + 1);
  const places = new Set(emplacements.map((emplacement) => emplacement.id));
  for (const [id, nombre] of definitions) {
    if (!places.has(id)) erreurs.push(`document ${id} : texte sans place.`);
    if (nombre > 1) erreurs.push(`document ${id} : texte défini deux fois.`);
  }

  const lieux = nomsDesLieux();
  const puces = new Map<string, string>();
  for (const { id, couche, morceau, cle } of emplacements) {
    const ou = `document ${id}`;
    if (couche === 'morceau' && morceau === undefined) erreurs.push(`${ou} : document de morceau sans morceau.`);
    if (couche === 'rangement') {
      if (cle === undefined) erreurs.push(`${ou} : note de rangement sans clé.`);
      if (morceau === undefined && cle !== CLE_TROUSSE) erreurs.push(`${ou} : note de rangement sans morceau.`);
    }
    const entree = morceau === undefined ? undefined : morceaux[morceau];
    if (morceau !== undefined && entree === undefined) erreurs.push(`${ou} : morceau ${morceau} inconnu.`);
    const texte = lu(morceau === undefined ? communs : entree?.textes.documents, id);
    if (texte === undefined) {
      erreurs.push(`${ou} : place sans texte.`);
      continue;
    }

    const champs: [string, string][] = [['puce', texte.puce.texte], ['ligne « où »', texte.ou]];
    if (texte.signature !== undefined) champs.push(['signature', texte.signature]);
    texte.corps.forEach((ligne, rang) => champs.push([`corps [${rang}]`, ligne]));
    for (const [champ, valeur] of champs) {
      const corps = champ.startsWith('corps');
      if (/[{}]/.test(valeur) && !(corps && couche === 'rangement')) erreurs.push(`${ou}, ${champ} : ${TROU_INTERDIT}`);
      for (const fuite of motsReserves(valeur, INTERDITS[couche])) erreurs.push(`${ou}, ${champ} : ${fuite}.`);
      if (!corps && /[\d%]/.test(valeur)) erreurs.push(`${ou}, ${champ} : chiffre ou pourcentage dans « ${valeur} » (C-04 §4.3).`);
    }
    if (couche === 'rangement' && !texte.corps.some((ligne) => TROU_PIECE.test(ligne))) erreurs.push(`${ou} : note de rangement qui ne nomme pas la pièce.`);
    // Un papier glissé près de la clé : une note manuscrite, ni message, ni journal, ni affiche, ni inscription.
    if (couche === 'rangement' && texte.support !== 'note') erreurs.push(`${ou} : note de rangement qui n’est pas une note manuscrite (support « ${texte.support} »).`);

    const nom = minuscules(texte.puce.texte);
    const autre = puces.get(nom);
    if (autre !== undefined) erreurs.push(`${ou} : nom de puce « ${texte.puce.texte} » déjà celui du document ${autre}.`);
    else puces.set(nom, id);
    if (lieux.has(nom)) erreurs.push(`${ou} : nom de puce « ${texte.puce.texte} » déjà celui d’une pièce ou d’un objet.`);

    // Le rendu : une note de rangement désigne chaque pièce du catalogue où sa clé peut aller, sous son nom puis numérotée.
    let pieces: readonly PieceReserve[] | null = null;
    if (couche === 'rangement' && cle !== undefined) {
      const etiquettes = cle === CLE_TROUSSE ? ['butin'] : entree?.morceau.grande?.cles?.[cle]?.etiquettes;
      if (etiquettes === undefined) {
        erreurs.push(`${ou} : clé « ${cle} » inconnue du morceau ${morceau ?? ''}.`);
        continue;
      }
      pieces = piecesPour(etiquettes);
      if (pieces.length === 0) erreurs.push(`${ou} : aucune pièce du catalogue ne peut recevoir sa clé.`);
    }
    let textes: TextesMonde;
    try {
      textes = reunir([entree?.textes ?? SANS_TEXTE, TEXTES_CATALOGUE, { ...SANS_TEXTE, documents: morceau === undefined ? { [id]: texte } : {} }]);
    } catch (erreur) {
      erreurs.push(`${ou}, réunion des textes : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
      continue;
    }
    const rendus = rendreLaPlace(erreurs, ou, textes, { sorte: 'objet', id: `e${id}`, nom: id }, couche === 'rangement' ? (pieces ?? []) : null);
    rendusParDocument.set(id, rendus);
    const trop = rendus[0] === undefined ? null : longueurDuDocument(rendus[0]);
    if (trop !== null) erreurs.push(`${ou} : ${trop}`);
  }
  return { erreurs, rendus: rendusParDocument };
}

/**
 * Toute la réserve, sans station de référence : chaque place a un texte et chaque texte une place ; une note de rangement, note
 * manuscrite, a une clé et un morceau sauf la trousse ; le seul trou est la pièce, dans le corps d'une note de rangement ; aucun mot réservé
 * de la couche ; une à cinq phrases ; aucun chiffre dans la puce, la ligne « où » ni la signature (le corps en a le droit) ; des
 * noms de puce distincts entre eux et de tout nom de pièce ou d'objet. Chaque document est rendu par `rendreDocument` : une
 * note de rangement avec chaque pièce du catalogue où sa clé peut aller, et avec une pièce numérotée (« consigne B »), et nomme
 * cette pièce.
 */
export function controlerReserve(sources: SourcesReserve = SOURCES_RESERVE): string[] {
  return analyserReserve(sources).erreurs;
}

/** Ce que le contrôle a rendu de chaque document, par identifiant : une fois, ou, pour une note de rangement, une fois par pièce nommée puis lettrée. */
export function rendusDeLaReserve(sources: SourcesReserve = SOURCES_RESERVE): ReadonlyMap<string, readonly DocumentRendu[]> {
  return analyserReserve(sources).rendus;
}

/** Phrases de pillage, de trace et de bruit de station, comme le contenu les écrit (spec 2026-10-18 §5.4, §5.5, §6.6). */
export interface PhrasesControlees {
  readonly pillages: readonly string[];
  readonly traces: Readonly<Record<string, readonly string[]>>;
  readonly bruits: readonly string[];
}

export const PHRASES_REELLES: PhrasesControlees = { pillages: UNIVERS.pillages, traces: MENACE.traces, bruits: SOCLE.evenements.bruit_station };

/** Chaque phrase : sans trou, non vide, de une à quatre phrases, sans mot des listes interdites. */
function verifierPhrases(erreurs: string[], ou: string, phrases: unknown, interdits: readonly Reserve[]): void {
  verifierVariantes(erreurs, ou, phrases, []);
  if (!Array.isArray(phrases)) return;
  phrases.forEach((phrase: unknown, rang) => {
    if (typeof phrase !== 'string' || analyserGabarit(phrase, []).length > 0) return;
    for (const fuite of motsReserves(phrase, interdits)) erreurs.push(`${ou} [${rang}] : ${fuite}.`);
    const nombre = compterPhrases(phrase);
    if (nombre < 1 || nombre > 4) erreurs.push(`${ou} [${rang}] : ${nombre} phrase(s), une à quatre attendues.`);
  });
}

/** Pillages (univers : ni menace ni traces), traces (menace : jamais « station »), bruits de station (ni menace ni traces). */
export function controlerPhrases({ pillages, traces, bruits }: PhrasesControlees = PHRASES_REELLES): string[] {
  const erreurs: string[] = [];
  verifierPhrases(erreurs, 'pillages', pillages, ['menace', 'traces']);
  for (const [intensite, phrases] of Object.entries(traces)) verifierPhrases(erreurs, `traces.${intensite}`, phrases, ['univers']);
  verifierPhrases(erreurs, 'bruits de station', bruits, ['menace', 'traces']);
  return erreurs;
}

/** Les textes que `check:texts` contrôle sans station, dans le lot 1 : couches, traces, documents, phrases. */
export function controlerTextesCommuns(): CompteRendu {
  const lignes: LigneCompteRendu[] = [];
  let erreurs = 0;
  const dire = (prefixe: string, fautes: readonly string[], bon: string): void => {
    erreurs += fautes.length;
    for (const faute of fautes) lignes.push({ niveau: 'error', texte: `${prefixe} : ${faute}` });
    if (fautes.length === 0) lignes.push({ niveau: 'log', texte: bon });
  };
  dire('couches', fuitesDeCouches(MORCEAUX_TEXTES), 'couches : aucun mot de l’univers ni de la menace dans le socle et les morceaux.');
  dire('couches', fuitesDesCouches(), 'couches : l’univers sans mot de la menace ni des traces, la menace sans « station ».');
  dire('grandes stations', tracesHorsPiste(), 'grandes stations : aucune trace hors de la piste dans les descriptions calmes.');
  dire('documents', controlerReserve(), 'documents : toute la réserve rendue sans station ; structure, trous, couches, longueur, chiffres et puces sûrs.');
  dire('phrases', controlerPhrases(), 'phrases : pillages, traces et bruits de station sûrs.');
  return { lignes, erreurs };
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
