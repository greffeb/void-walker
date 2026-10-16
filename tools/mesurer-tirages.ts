import { readFileSync } from 'node:fs';
import { assemblerStation } from '../engine';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { COMPOSITIONS_PUBLIEES, creerCatalogue, type Catalogue, type Composition } from '../content';
import { isMainModule } from './repo-files';
import { mesurerMiseHorsJeu, stationDeReference, verifierComposition, type LigneCatalogue, type MiseHorsJeu } from './verifier-station';

// Mesures sur 1 000 tirages (#155, spec L5 §5) : variété et équilibre des stations tirées, rejets classés par motif, plans, et
// part des stations où la créature peut être mise hors jeu ou enfermée avant le problème final (D-241). Rien ne change au
// tirage : ces mesures servent au porteur. Hors de `verify` ; les tests gardent les seuils.

/** Hasard des tirages mesurés : le même à chaque mesure. */
export const GRAINE_MESURE = 20261016;
export const TIRAGES = 1000;

export type Forme = 'chaine-un' | 'chaine-deux' | 'libre';
export type Motif = 'acceptee' | 'paire_refusee' | 'place_ecartee' | 'pas_de_plan' | 'pas_de_chemin_sur' | 'non_prouvee' | 'un_seul_ordre';

export interface Frequences {
  readonly finals: Readonly<Record<string, number>>;
  readonly formes: Readonly<Record<string, number>>;
  readonly morceaux: Readonly<Record<string, number>>;
  readonly places: Readonly<Record<string, number>>;
}

export interface MesuresTirages {
  readonly tirages: number;
  /** Tirages réels de NOUVELLE PARTIE (`catalogue.tirer`). */
  readonly reels: Frequences & {
    readonly obtenues: number;
    /** Stations tirées dont la composition n'est pas prouvée : toujours 0 attendu. */
    readonly nonProuvees: readonly string[];
    readonly miseHorsJeu: Readonly<Record<MiseHorsJeu, number>>;
    /** Créature hors du morceau final au départ. */
    readonly horsDuFinal: number;
    /** Compositions distinctes tirées. */
    readonly distinctes: number;
  };
  /** Candidats tirés de la même façon parmi toutes les compositions possibles, avant publication. */
  readonly candidats: {
    readonly motifs: Readonly<Record<Motif, number>>;
    readonly plansTrouves: number;
    readonly plansCherches: number;
    readonly msMoyenne: number;
    readonly msMax: number;
  };
}

function hasardDepuis(graine: number): () => number {
  let etat = generateurDepuisGraine(graine);
  return () => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur;
  };
}

function compter(table: Record<string, number>, cle: string): void {
  table[cle] = (table[cle] ?? 0) + 1;
}

export function formeDe(composition: Composition): Forme {
  if (composition.forme === 'libre') return 'libre';
  return composition.chemins.length === 1 ? 'chaine-un' : 'chaine-deux';
}

/** Motif d'un candidat dont la table et le plan sont passés, selon le verdict de sa composition. */
export function motifDuVerdict(ligne: LigneCatalogue): Motif {
  if (ligne.verdict === 'prouvee') return 'acceptee';
  if (ligne.ordres !== undefined && ligne.ordres.includes('prouvee')) return 'un_seul_ordre';
  if (ligne.verdict === 'refusee') return ligne.diagnostic.startsWith('Paire') ? 'paire_refusee' : 'place_ecartee';
  return ligne.verdict === 'sans_sortie_sure' ? 'pas_de_chemin_sur' : 'non_prouvee';
}

/**
 * `verdicts` : lignes de `check:stations` déjà calculées, par composition ; les compositions absentes sont vérifiées ici, une
 * fois chacune, sur leur station de référence.
 */
export function mesurerTirages(
  catalogue: Catalogue = creerCatalogue(assemblerStation),
  tirages = TIRAGES,
  verdicts: ReadonlyMap<string, LigneCatalogue> = new Map(),
): MesuresTirages {
  const lignes = new Map(verdicts);
  const parId = new Map(catalogue.compositions.map((composition) => [composition.id, composition]));
  const ligneDe = (composition: Composition): LigneCatalogue => {
    const connue = lignes.get(composition.id);
    if (connue !== undefined) return connue;
    const ligne = verifierComposition(catalogue, composition);
    lignes.set(composition.id, ligne);
    return ligne;
  };
  const horsJeu = new Map<string, MiseHorsJeu>();
  const horsJeuDe = (composition: Composition): MiseHorsJeu => {
    const connue = horsJeu.get(composition.id);
    if (connue !== undefined) return connue;
    const station = stationDeReference(catalogue, composition.id);
    if ('refus' in station) throw new Error(station.refus);
    const mesure = mesurerMiseHorsJeu(station.entree);
    horsJeu.set(composition.id, mesure);
    return mesure;
  };

  // Tirages réels.
  const finals: Record<string, number> = {};
  const formes: Record<string, number> = {};
  const morceaux: Record<string, number> = {};
  const places: Record<string, number> = {};
  const miseHorsJeu: Record<MiseHorsJeu, number> = { possible: 0, impossible: 0, indeterminee: 0 };
  const nonProuvees: string[] = [];
  const distinctes = new Set<string>();
  let obtenues = 0;
  let horsDuFinal = 0;
  const hasard = hasardDepuis(GRAINE_MESURE);
  for (let rang = 0; rang < tirages; rang++) {
    const station = catalogue.tirer(hasard);
    if ('refus' in station) continue;
    obtenues++;
    const id = station.monde.id;
    const composition = parId.get(id.slice(0, id.lastIndexOf('-')));
    if (composition === undefined) throw new Error(`Composition de la station ${id} absente du catalogue.`);
    distinctes.add(composition.id);
    if (ligneDe(composition).verdict !== 'prouvee') nonProuvees.push(id);
    compter(finals, composition.final);
    compter(formes, formeDe(composition));
    for (const morceau of [...composition.chemins, composition.final]) compter(morceaux, morceau);
    compter(places, composition.creature);
    if (!composition.creature.startsWith(`${composition.final}/`)) horsDuFinal++;
    miseHorsJeu[horsJeuDe(composition)]++;
  }

  // Candidats, parmi toutes les compositions : pile ou face du final, puis pur hasard parmi les siennes (D-253), puis la graine.
  const motifs: Record<Motif, number> = {
    acceptee: 0, paire_refusee: 0, place_ecartee: 0, pas_de_plan: 0, pas_de_chemin_sur: 0, non_prouvee: 0, un_seul_ordre: 0,
  };
  const tous = catalogue.compositions;
  const finalsPossibles = [...new Set(tous.map((composition) => composition.final))];
  const hasardCandidats = hasardDepuis(GRAINE_MESURE + 1);
  let plansCherches = 0;
  let plansTrouves = 0;
  let msTotal = 0;
  let msMax = 0;
  for (let rang = 0; rang < tirages; rang++) {
    const final = finalsPossibles[hasardCandidats() % finalsPossibles.length];
    const parmi = tous.filter((composition) => composition.final === final);
    const composition = parmi[hasardCandidats() % parmi.length];
    const graine = hasardCandidats();
    if (composition === undefined) throw new Error('Aucune composition candidate.');
    if (composition.refus !== null) {
      motifs[composition.refus.startsWith('Paire') ? 'paire_refusee' : 'place_ecartee']++;
      continue;
    }
    plansCherches++;
    const debut = performance.now();
    const station = catalogue.construire(composition.id, graine);
    const ms = performance.now() - debut;
    msTotal += ms;
    msMax = Math.max(msMax, ms);
    if ('refus' in station) {
      motifs.pas_de_plan++;
      continue;
    }
    plansTrouves++;
    motifs[motifDuVerdict(ligneDe(composition))]++;
  }
  return {
    tirages,
    reels: { finals, formes, morceaux, places, obtenues, nonProuvees, miseHorsJeu, horsDuFinal, distinctes: distinctes.size },
    candidats: { motifs, plansTrouves, plansCherches, msMoyenne: plansCherches === 0 ? 0 : msTotal / plansCherches, msMax },
  };
}

const NOMS_MOTIFS: Readonly<Record<Motif, string>> = {
  acceptee: 'acceptées',
  paire_refusee: 'paire refusée',
  place_ecartee: 'place de la créature écartée (D-268)',
  pas_de_plan: 'pas de plan',
  pas_de_chemin_sur: 'pas de chemin sûr',
  non_prouvee: 'non prouvée (plafond)',
  un_seul_ordre: 'un seul des deux ordres prouvé',
};

const pourcent = (part: number, total: number): string => `${total === 0 ? 0 : ((part * 100) / total).toFixed(1).replace('.', ',')} %`;

function liste(table: Readonly<Record<string, number>>): string {
  return Object.entries(table)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([cle, nombre]) => `${cle} ${nombre}`)
    .join(', ');
}

/** Tableaux Markdown, pour la PR et 13 §7.8. */
export function enMarkdown(mesures: MesuresTirages): string {
  const { reels, candidats, tirages } = mesures;
  const rejets = Object.entries(candidats.motifs) as [Motif, number][];
  return [
    `**Tirages réels** (NOUVELLE PARTIE, ${tirages} tirages, graine ${GRAINE_MESURE}) : ${reels.obtenues} stations, ${reels.distinctes} compositions distinctes.`,
    '',
    '| Mesure | Résultat |',
    '| --- | --- |',
    `| Finals | ${liste(reels.finals)} |`,
    `| Formes | ${liste(reels.formes)} |`,
    `| Morceaux | ${liste(reels.morceaux)} |`,
    `| Places de la créature | ${liste(reels.places)} |`,
    `| Stations non prouvées proposées | ${reels.nonProuvees.length} |`,
    `| Créature hors jeu ou enfermée possible avant le final (D-241) | ${reels.miseHorsJeu.possible} sur ${reels.obtenues} (${pourcent(reels.miseHorsJeu.possible, reels.obtenues)}) ; impossible ${reels.miseHorsJeu.impossible} ; indéterminée ${reels.miseHorsJeu.indeterminee} |`,
    `| Créature hors du morceau final au départ | ${reels.horsDuFinal} sur ${reels.obtenues} (${pourcent(reels.horsDuFinal, reels.obtenues)}) |`,
    '',
    `**Candidats** (${tirages} tirages parmi toutes les compositions possibles, avant publication, graine ${GRAINE_MESURE + 1}) :`,
    '',
    '| Motif | Candidats |',
    '| --- | ---: |',
    ...rejets.map(([motif, nombre]) => `| ${NOMS_MOTIFS[motif]} | ${nombre} |`),
    '',
    `**Plans** : ${candidats.plansTrouves} trouvés sur ${candidats.plansCherches} cherchés (${pourcent(candidats.plansTrouves, candidats.plansCherches)}), ${candidats.msMoyenne.toFixed(2).replace('.', ',')} ms en moyenne et ${candidats.msMax.toFixed(2).replace('.', ',')} ms au plus par station, textes compris.`,
  ].join('\n');
}

/** Lignes JSON de `npm run check:stations`, par composition. */
export function lireVerdicts(texte: string): Map<string, LigneCatalogue> {
  const lignes = new Map<string, LigneCatalogue>();
  for (const brute of texte.split('\n')) {
    if (!brute.startsWith('{')) continue;
    const ligne = JSON.parse(brute) as Partial<LigneCatalogue>;
    if (typeof ligne.composition === 'string' && typeof ligne.verdict === 'string') lignes.set(ligne.composition, ligne as LigneCatalogue);
  }
  return lignes;
}

if (isMainModule(import.meta.url)) {
  const argumentsCli = process.argv.slice(2);
  const fichier = argumentsCli.find((argument) => argument.startsWith('--verdicts='))?.slice('--verdicts='.length);
  const inconnu = argumentsCli.find((argument) => !argument.startsWith('--verdicts='));
  if (inconnu !== undefined) throw new Error(`Option inconnue : ${inconnu}.`);
  const verdicts = fichier === undefined ? new Map<string, LigneCatalogue>() : lireVerdicts(readFileSync(fichier, 'utf8'));
  const catalogue = creerCatalogue(assemblerStation);
  const mesures = mesurerTirages(catalogue, TIRAGES, verdicts);
  console.log(enMarkdown(mesures));
  const publiees = new Set(COMPOSITIONS_PUBLIEES);
  const horsPublication = mesures.reels.nonProuvees.filter((id) => !publiees.has(id.slice(0, id.lastIndexOf('-'))));
  if (mesures.reels.nonProuvees.length > 0) {
    console.error(`Stations non prouvées proposées : ${mesures.reels.nonProuvees.join(', ')} (${horsPublication.length} hors publication).`);
    process.exitCode = 1;
  }
}
