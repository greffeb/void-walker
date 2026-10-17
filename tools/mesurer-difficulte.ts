import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { assemblerStation, CAUSES, type Cause } from '../engine';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { COMPOSITIONS_PUBLIEES, creerCatalogue, type Catalogue, type Composition } from '../content';
import { creerBot, jouerAvecBot, PLAFOND_ACTIONS, PROFILS, type Profil } from './bots';
import type { IndicateursPartie } from './indicateurs-partie';
import { lireVerdicts } from './mesurer-tirages';
import { mediane } from './mesurer-parties';
import { isMainModule } from './repo-files';
import { empreintesDe, verifierComposition, type LigneCatalogue } from './verifier-station';

// Rapport de difficulté (#194 §2.4) : les bots jouent les mêmes stations tirées, avec les mêmes graines, pour chaque variante.
// B0 est le chemin prouvé par `check:stations` (sa station de référence) ; B1 à B3 jouent par le menu public. Zone verte : rien
// ne change au jeu. Hors de `verify` ; les tests gardent le rendu et la reproductibilité.

/** Hasard des stations et des parties mesurées : le même à chaque mesure, pour comparer les variantes. */
export const GRAINE_DIFFICULTE = 20261017;
export const PARTIES = 1000;

/** Numéro et nom de chaque profil dans le rapport (#194 §2.3). */
export const NOMS_PROFILS: Readonly<Record<Profil, string>> = { aleatoire: 'B1, aléatoire', prudent: 'B2, prudent', presse: 'B3, pressé' };

export interface MesureProfil {
  readonly parties: number;
  readonly evacuations: number;
  readonly defaites: number;
  /** Plafond d'actions atteint sans fin. */
  readonly abandons: number;
  /** Actions des parties évacuées. */
  readonly actionsEvacuees: readonly number[];
  readonly des: number;
  readonly coups: number;
  /** Coups reçus de chaque cause, toutes parties. */
  readonly parCause: Readonly<Record<Cause, number>>;
  readonly sansContact: number;
  readonly horsJeu: number;
  readonly sansSortie: number;
}

export interface MesureMorceau {
  readonly parties: number;
  readonly evacuations: number;
  readonly defaites: number;
}

export interface MesuresDifficulte {
  readonly variante: string;
  readonly commit: string;
  readonly graine: number;
  readonly parties: number;
  readonly compositions: { readonly publiees: number; readonly tirees: number };
  /** B0 : verdict de la composition de chaque partie, et longueur de son témoin. */
  readonly prouve: { readonly prouvees: number; readonly longueurs: readonly number[] };
  readonly profils: Readonly<Record<Profil, MesureProfil>>;
  /** Pour le profil de référence (B2), par morceau de la station. */
  readonly morceaux: Readonly<Record<string, MesureMorceau>>;
  readonly secondes: number;
}

function hasardDepuis(graine: number): () => number {
  let etat = generateurDepuisGraine(graine);
  return () => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur;
  };
}

const vide = (): MesureProfil => ({
  parties: 0, evacuations: 0, defaites: 0, abandons: 0, actionsEvacuees: [], des: 0, coups: 0,
  parCause: Object.fromEntries(CAUSES.map((cause) => [cause, 0])) as Record<Cause, number>, sansContact: 0, horsJeu: 0, sansSortie: 0,
});

function ajouter(mesure: MesureProfil, partie: IndicateursPartie): MesureProfil {
  const parCause = { ...mesure.parCause };
  for (const cause of CAUSES) parCause[cause] += partie.parCause[cause];
  return {
    parties: mesure.parties + 1,
    evacuations: mesure.evacuations + (partie.issue === 'evacuation' ? 1 : 0),
    defaites: mesure.defaites + (partie.issue === 'defaite' ? 1 : 0),
    abandons: mesure.abandons + (partie.issue === 'en_cours' ? 1 : 0),
    actionsEvacuees: partie.issue === 'evacuation' ? [...mesure.actionsEvacuees, partie.actions] : mesure.actionsEvacuees,
    des: mesure.des + partie.des,
    coups: mesure.coups + partie.coups,
    parCause,
    sansContact: mesure.sansContact + (partie.premierContact === null ? 1 : 0),
    horsJeu: mesure.horsJeu + (partie.horsJeu === null ? 0 : 1),
    sansSortie: mesure.sansSortie + (partie.sansSortie === null ? 0 : 1),
  };
}

/** Graine du bot pour une partie : différente par profil, la même d'une variante à l'autre. */
const graineDuBot = (rang: number, profil: Profil): number => (rang * PROFILS.length + PROFILS.indexOf(profil)) >>> 0;

export interface OptionsDifficulte {
  readonly catalogue?: Catalogue;
  readonly parties?: number;
  readonly variante?: string;
  readonly commit?: string;
  /** Lignes de `check:stations` du même commit ; une composition absente est vérifiée ici, une fois. */
  readonly verdicts?: ReadonlyMap<string, LigneCatalogue>;
  readonly profils?: readonly Profil[];
  readonly plafond?: number;
  /** Vérification d'une composition sans verdict lu : `verifierComposition` par défaut. */
  readonly verifier?: (catalogue: Catalogue, composition: Composition) => LigneCatalogue;
}

export function mesurerDifficulte(options: OptionsDifficulte = {}): MesuresDifficulte {
  const debut = performance.now();
  const catalogue = options.catalogue ?? creerCatalogue(assemblerStation);
  const parties = options.parties ?? PARTIES;
  const profils = options.profils ?? PROFILS;
  const parId = new Map(catalogue.compositions.map((composition) => [composition.id, composition]));
  const lignes = new Map(options.verdicts ?? []);
  const ligneDe = (composition: Composition): LigneCatalogue => {
    const connue = lignes.get(composition.id);
    if (connue !== undefined && JSON.stringify(connue.empreintes) === JSON.stringify(empreintesDe(composition))) return connue;
    const ligne = (options.verifier ?? verifierComposition)(catalogue, composition);
    lignes.set(composition.id, ligne);
    return ligne;
  };
  const mesures = Object.fromEntries(PROFILS.map((profil) => [profil, vide()])) as Record<Profil, MesureProfil>;
  const morceaux: Record<string, MesureMorceau> = {};
  const tirees = new Set<string>();
  let prouvees = 0;
  const longueurs: number[] = [];
  const hasard = hasardDepuis(GRAINE_DIFFICULTE);
  for (let rang = 0; rang < parties; rang++) {
    const station = catalogue.tirer(hasard);
    const graine = hasard();
    if ('refus' in station) throw new Error(station.refus);
    const id = station.monde.id;
    const composition = parId.get(id.slice(0, id.lastIndexOf('-')));
    if (composition === undefined) throw new Error(`Composition de la station ${id} absente du catalogue.`);
    tirees.add(composition.id);
    const ligne = ligneDe(composition);
    if (ligne.verdict === 'prouvee') {
      prouvees++;
      if (ligne.actions !== null) longueurs.push(ligne.actions);
    }
    for (const profil of profils) {
      const { indicateurs } = jouerAvecBot(station, creerBot(profil, graineDuBot(rang, profil)), graine, options.plafond ?? PLAFOND_ACTIONS);
      mesures[profil] = ajouter(mesures[profil], indicateurs);
      if (profil !== 'prudent') continue;
      for (const morceau of [...composition.chemins, composition.final]) {
        const avant = morceaux[morceau] ?? { parties: 0, evacuations: 0, defaites: 0 };
        morceaux[morceau] = {
          parties: avant.parties + 1,
          evacuations: avant.evacuations + (indicateurs.issue === 'evacuation' ? 1 : 0),
          defaites: avant.defaites + (indicateurs.issue === 'defaite' ? 1 : 0),
        };
      }
    }
  }
  const retenus = Object.fromEntries(profils.map((profil) => [profil, mesures[profil]])) as Record<Profil, MesureProfil>;
  return {
    variante: options.variante ?? 'V0',
    commit: options.commit ?? 'inconnu',
    graine: GRAINE_DIFFICULTE,
    parties,
    compositions: { publiees: COMPOSITIONS_PUBLIEES.length, tirees: tirees.size },
    prouve: { prouvees, longueurs },
    profils: retenus,
    morceaux,
    secondes: (performance.now() - debut) / 1000,
  };
}

const virgule = (nombre: number, decimales = 1): string => nombre.toFixed(decimales).replace('.', ',');
const pourcent = (part: number, total: number): string => `${total === 0 ? '0' : virgule((part * 100) / total)} %`;

/** Valeur au rang p (de 0 à 1) des valeurs triées, la plus proche par le bas. */
export function centile(valeurs: readonly number[], p: number): number {
  if (valeurs.length === 0) return 0;
  const triees = [...valeurs].sort((a, b) => a - b);
  return triees[Math.min(triees.length - 1, Math.floor(p * triees.length))] ?? 0;
}

function causes(parCause: Readonly<Record<Cause, number>>): string {
  const presentes = CAUSES.filter((cause) => parCause[cause] > 0).map((cause) => `${cause} ${parCause[cause]}`);
  return presentes.length === 0 ? '—' : presentes.join(', ');
}

/** Rapport Markdown, au format de #194 §2.4. */
export function enMarkdown(mesures: MesuresDifficulte): string {
  const { parties, prouve } = mesures;
  const lignesProfils = (Object.entries(mesures.profils) as [Profil, MesureProfil][]).map(([profil, m]) => {
    const evacuees = m.actionsEvacuees;
    const actions = evacuees.length === 0 ? '—' : `${virgule(mediane(evacuees))} ; ${centile(evacuees, 0.9)}`;
    return `| ${NOMS_PROFILS[profil]} | ${pourcent(m.evacuations, m.parties)} | ${pourcent(m.defaites, m.parties)} | ${pourcent(m.abandons, m.parties)} | ${actions} | ${virgule(m.des / Math.max(1, m.parties), 2)} | ${virgule(m.coups / Math.max(1, m.parties), 2)} | ${causes(m.parCause)} | ${pourcent(m.sansContact, m.parties)} | ${pourcent(m.horsJeu, m.parties)} | ${pourcent(m.sansSortie, m.parties)} |`;
  });
  const morceaux = Object.entries(mesures.morceaux)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([morceau, m]) => `| ${morceau} | ${m.parties} | ${pourcent(m.evacuations, m.parties)} | ${pourcent(m.defaites, m.parties)} |`);
  const b0 = prouve.longueurs.length === 0 ? '—' : `${virgule(mediane(prouve.longueurs))} ; ${centile(prouve.longueurs, 0.9)}`;
  return [
    `**Rapport de difficulté** · variante ${mesures.variante} · commit ${mesures.commit} · graine de mesure ${mesures.graine} · ${parties} parties par profil`,
    '',
    `Stations : ${mesures.compositions.publiees} compositions publiées, ${mesures.compositions.tirees} tirées dans cette mesure. Plafond : ${PLAFOND_ACTIONS} actions par partie de bot.`,
    '',
    '| Profil | Évacuation | Défaite | Abandon | Actions des évacuations (médiane ; 9 sur 10 en dessous de) | Dés lancés par partie | Coups reçus par partie | Coups par cause, en tout | Jamais de contact | Créature hors jeu | Plus aucune sortie |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |',
    `| B0, chemin prouvé | ${pourcent(prouve.prouvees, parties)} | 0 % | — | ${b0} | 0 | 0 | — | — | — | — |`,
    ...lignesProfils,
    '',
    'B2, prudent, par morceau de la station (une station compte pour chacun de ses morceaux) :',
    '',
    '| Morceau | Parties | Évacuation | Défaite |',
    '| --- | ---: | ---: | ---: |',
    ...morceaux,
    '',
    `B0 : témoin de \`check:stations\` sur la station de référence de chaque composition, pas sur la station tirée. Les bots ne voient que ce que voit le joueur ; ils mesurent, ils ne prouvent rien. Mesure faite en ${virgule(mesures.secondes, 0)} s.`,
  ].join('\n');
}

function commitCourant(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'inconnu';
  }
}

if (isMainModule(import.meta.url)) {
  const argumentsCli = process.argv.slice(2);
  const valeur = (nom: string): string | undefined => argumentsCli.find((argument) => argument.startsWith(`--${nom}=`))?.slice(nom.length + 3);
  const inconnue = argumentsCli.find((argument) => !['--parties=', '--verdicts=', '--variante='].some((prefixe) => argument.startsWith(prefixe)));
  if (inconnue !== undefined) throw new Error(`Option inconnue : ${inconnue}.`);
  const texte = valeur('parties');
  const parties = texte === undefined ? PARTIES : Number(texte);
  if (!Number.isInteger(parties) || parties < 1) throw new Error(`Nombre de parties invalide : ${String(texte)}.`);
  const fichier = valeur('verdicts');
  const verdicts = fichier === undefined ? new Map<string, LigneCatalogue>() : lireVerdicts(readFileSync(fichier, 'utf8'));
  console.log(enMarkdown(mesurerDifficulte({ parties, verdicts, variante: valeur('variante') ?? 'V0', commit: commitCourant() })));
}
