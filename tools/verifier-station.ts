import { assemblerStation, empreinte, nouvellePartie, observer, jouer, type DefMonde, type Des, type EtatPartie, type OptionMenu, type Partie } from '../engine';
import { generateurDepuisGraine, suivant } from '../engine/des';
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
import { isMainModule } from './repo-files';

const VERSION = 'verifier-station';
const GRAINE = 20261010;
const MAX_ETATS = 150000;
/** Graines de plan essayées, à partir de 0, pour la station de référence d'une composition. */
const ESSAIS_GRAINE = 50;
/** 14 §5.6 : sur 1 000 tirages, au moins 95 % de plans trouvés. */
const TIRAGES_PLANS = 1000;
const POURCENT_PLANS = 95;
/** Hasard des tirages mesurés : les mêmes à chaque mesure. */
const GRAINE_TIRAGES = 20261015;

export interface OptionsVerification {
  readonly maxEtats?: number;
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

function temoin(entree: EntreeMonde, parents: readonly (Parent | null)[], fin: number): Parcours {
  const etapes: EtapeParcours[] = [];
  let indice = fin;
  while (indice > 0) {
    const parent = parents[indice];
    if (parent === undefined || parent === null) throw new Error('Chaîne du témoin incomplète.');
    etapes.push(parent.etape);
    indice = parent.precedent;
  }
  etapes.reverse();
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
function explorer(entree: EntreeMonde, but: (etat: EtatPartie) => boolean, maxEtats: number): Exploration {
  const rang = rangsDesMorceaux(entree.monde);
  const initiale = sansJournal(nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE }));
  const vus = new Set([cleEtatRegles(initiale.etat)]);
  const parents: (Parent | null)[] = [null];
  // Parallèle à `parents` ; la partie est libérée une fois développée.
  const noeuds: (Partie | undefined)[] = [initiale];
  const seaux: Seau[] = [];
  const ecartes = { des: 0, blessures: 0 };
  const conclure = (issue: Recherche['issue'], partie: Partie | null = null): Exploration => ({ issue, partie, etats: vus.size, parents, ecartes });
  const ranger = (indice: number, partie: Partie): void => {
    (seaux[rang(partie.etat.piece)] ??= { indices: [], tete: 0 }).indices.push(indice);
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
  const { issue, partie, etats } = explorer(entree, but, plafond(options));
  return { issue, partie, etats };
}

export function verifierStation(entree: EntreeMonde, options: OptionsVerification = {}): RapportStation {
  const debut = performance.now();
  const maxEtats = plafond(options);
  const { issue, etats, parents, ecartes } = explorer(entree, (etat) => etat.fin === 'evacuation', maxEtats);
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
  return [depart, ...[...composition.chemins, composition.final].map((id) => {
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
  return catalogue.compositions.map((composition): LigneCatalogue => {
    const empreintes = Object.fromEntries(morceauxDe(composition).map(({ morceau, textes }) => [morceau.id, empreinte({ morceau, textes })]));
    const sansVerification = (verdict: LigneCatalogue['verdict'], diagnostic: string): LigneCatalogue => ({
      composition: composition.id, verdict, graine: null, etats: 0, secondes: 0, actions: null, diagnostic, empreintes,
    });
    if (composition.refus !== null) return sansVerification('refusee', composition.refus);
    const station = stationDeReference(catalogue, composition.id);
    if ('refus' in station) return sansVerification('non_prouvee', station.refus);
    const { verdict, etats, secondes, diagnostic, parcours } = verifierStation(station.entree, options);
    const actions = parcours === null ? null : parcours.etapes.length;
    return { composition: composition.id, verdict, graine: station.graine, etats, secondes, actions, diagnostic, empreintes };
  });
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

/** Plans de chaque chemin permis, graines 0 à `tirages` - 1 : plans trouvés et temps d'`assemblerStation`, échecs compris. */
export function mesurerPlans(tirages: number): MesurePlans[] {
  const chemins = new Map<string, Composition>();
  for (const composition of CATALOGUE.compositions) {
    const chemin = morceauxDe(composition).map(({ morceau }) => morceau.id).join(' + ');
    if (composition.refus === null && !chemins.has(chemin)) chemins.set(chemin, composition);
  }
  return [...chemins].map(([chemin, composition]) => {
    const morceaux = morceauxDe(composition).map(({ morceau }) => morceau);
    let trouves = 0;
    let total = 0;
    let msMax = 0;
    for (let graine = 0; graine < tirages; graine++) {
      const debut = performance.now();
      const resultat = assemblerStation({ id: `${composition.id}-${graine}`, morceaux, creature: composition.creature, graine });
      const ms = performance.now() - debut;
      if (resultat.type === 'station') trouves++;
      total += ms;
      msMax = Math.max(msMax, ms);
    }
    return { chemin, tirages, trouves, msMoyenne: total / tirages, msMax };
  });
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

if (isMainModule(import.meta.url)) {
  const argumentsCli = process.argv.slice(2);
  const mesure = argumentsCli.includes('--mesurer');
  const inconnu = argumentsCli.find((argument) => argument.startsWith('--') && argument !== '--mesurer' && !argument.startsWith('--max-etats='));
  if (inconnu !== undefined) throw new Error(`Option inconnue : ${inconnu}.`);
  const limite = argumentsCli.find((argument) => argument.startsWith('--max-etats='));
  const options = limite === undefined ? {} : { maxEtats: Number(limite.slice('--max-etats='.length)) };
  const demandes = argumentsCli.filter((argument) => !argument.startsWith('--'));
  for (const id of demandes.length > 0 ? demandes : ['ar-01', 'ar-02', 'm-07', 'm-08', 'm-09', 'm-10']) {
    const entree = CATALOGUE.mondes[id];
    if (entree === undefined) throw new Error(`Station inconnue : ${id}.`);
    const rapport = mesure ? mesurerStation(entree, options) : verifierStation(entree, options);
    console.log(JSON.stringify({ monde: id, ...rapport }));
    if (rapport.verdict !== (mesure ? 'complete' : 'prouvee')) process.exitCode = 1;
  }
  if (demandes.length === 0 && !mesure) {
    const lignes = verifierCatalogue(CATALOGUE, options);
    for (const ligne of lignes) console.log(JSON.stringify(ligne));
    const plans = mesurerPlans(TIRAGES_PLANS);
    for (const plan of plans) console.log(JSON.stringify(plan));
    console.log(JSON.stringify({ tirer: 'catalogue.tirer', ...mesurerTirages(TIRAGES_PLANS) }));
    const ecarts = ecartsDuCatalogue(lignes, COMPOSITIONS_PUBLIEES, plans);
    for (const ecart of ecarts) console.error(ecart);
    if (ecarts.length > 0) process.exitCode = 1;
  }
}