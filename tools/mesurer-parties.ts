import { readFileSync } from 'node:fs';
import { lireExport, type ExportPartie } from '../engine';
import { extraireDuree, extrairePartie, MARQUEUR } from '../report-service/src/rapport';
import { CATALOGUE } from './catalogue';
import { rejouerPourMesure, type IndicateursPartie, type IssueMesuree } from './indicateurs-partie';
import { isMainModule } from './repo-files';

// Parties humaines (#194 §2.1) : relit les rapports envoyés depuis le jeu, rejoue chaque partie avec le moteur actuel, en
// tire les indicateurs de difficulté et, à décisions identiques, ce qu'aurait donné un autre seuil d'esquive. Zone verte : rien
// ne change au jeu. Les rapports se lisent sur GitHub par son API publique, sans jeton (GITHUB_TOKEN s'il est défini).

export const DEPOT = 'greffeb/void-walker';
/** Seuil du contrefactuel par défaut : le jet touche de 1 à 6, aucune esquive (variante V1 de #194). */
export const SEUIL_SANS_ESQUIVE = 6;

const ADRESSE = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:issues|pull)\/(\d+)(?:#issuecomment-(\d+))?$/;

export interface Rapport {
  /** Adresse de l'issue ou du commentaire, ou chemin du fichier. */
  readonly adresse: string;
  readonly corps: string;
}

export type LecteurJson = (chemin: string) => Promise<unknown>;

/** GET sur l'API de GitHub (`chemin` : « repos/… »). */
export const lireApiGithub: LecteurJson = async (chemin) => {
  const jeton = process.env.GITHUB_TOKEN;
  const reponse = await fetch(`https://api.github.com/${chemin}`, {
    headers: { accept: 'application/vnd.github+json', ...(jeton === undefined || jeton === '' ? {} : { authorization: `Bearer ${jeton}` }) },
  });
  if (!reponse.ok) throw new Error(`GitHub a répondu ${reponse.status} pour ${chemin}.`);
  return reponse.json();
};

interface ElementGithub {
  readonly html_url?: unknown;
  readonly body?: unknown;
}

async function toutesLesPages(lire: LecteurJson, chemin: string): Promise<ElementGithub[]> {
  const elements: ElementGithub[] = [];
  for (let page = 1; ; page++) {
    const lot = await lire(`${chemin}${chemin.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    if (!Array.isArray(lot)) throw new Error(`Réponse inattendue pour ${chemin}.`);
    elements.push(...(lot as ElementGithub[]));
    if (lot.length < 100) return elements;
  }
}

/** Issues et commentaires (de PR comprises) du dépôt qui portent un rapport de partie. */
export async function rapportsDuDepot(depot: string = DEPOT, lire: LecteurJson = lireApiGithub): Promise<Rapport[]> {
  const elements = [...(await toutesLesPages(lire, `repos/${depot}/issues?state=all`)), ...(await toutesLesPages(lire, `repos/${depot}/issues/comments`))];
  return elements
    .filter((element) => typeof element.body === 'string' && element.body.includes(MARQUEUR) && typeof element.html_url === 'string')
    .map((element) => ({ adresse: element.html_url as string, corps: element.body as string }));
}

/** Une source : adresse d'une issue ou d'un commentaire de rapport, ou fichier (export, ou texte d'un rapport). */
export async function lireRapport(source: string, lire: LecteurJson = lireApiGithub, lireFichier = (chemin: string) => readFileSync(chemin, 'utf8')): Promise<Rapport> {
  const adresse = ADRESSE.exec(source);
  if (adresse === null) return { adresse: source, corps: lireFichier(source) };
  const [, depot, numero, commentaire] = adresse;
  const element = (await lire(commentaire === undefined ? `repos/${depot}/issues/${numero}` : `repos/${depot}/issues/comments/${commentaire}`)) as ElementGithub;
  if (typeof element.body !== 'string') throw new Error(`Pas de texte pour ${source}.`);
  return { adresse: source, corps: element.body };
}

/** Ce que l'export dit seul, sans rejeu : la partie telle qu'elle a été jouée, avec le moteur de sa version. */
export interface PartieJouee {
  readonly issue: IssueMesuree;
  readonly actions: number;
  readonly sante: IndicateursPartie['sante'];
  readonly des: number;
  /**
   * Jets qui ont touché : comptés par le rejeu quand il est identique ; sinon de 1 à 3, le seuil de toutes les versions
   * publiées jusqu'ici (D-055).
   */
  readonly touches: number;
}

export interface Contrefactuel {
  readonly issue: IssueMesuree;
  readonly actions: number;
  /** Exact : rejoué par le moteur actuel ; approché : compté sur les tirages de l'export seulement (soins et feu ignorés). */
  readonly exact: boolean;
}

export interface PartieMesuree {
  readonly adresse: string;
  readonly monde: string;
  /** Station tirée, pas un monde de référence ni de test. */
  readonly tiree: boolean;
  /** Secondes d'écran allumé, lues dans le tableau du rapport (#204) ; `null` si non mesurée ou pour un export seul. */
  readonly duree: number | null;
  readonly jouee: PartieJouee;
  /** Rejouée à l'identique par le moteur actuel ; sinon, pourquoi pas. */
  readonly rejeu: { readonly identique: true } | { readonly identique: false; readonly motif: string };
  /** Indicateurs du rejeu, seulement s'il est identique : premier contact, coups par cause, créature hors jeu. */
  readonly indicateurs: IndicateursPartie | null;
  /** À décisions identiques, avec le seuil du contrefactuel. */
  readonly contrefactuel: Contrefactuel;
}

/** Seuil des versions jouées jusqu'ici : le jet touche de 1 à 3 (D-055). */
export const SEUIL_JOUE = 3;
const PALIERS: readonly IndicateursPartie['sante'][] = ['indemne', 'blesse', 'critique', 'vaincu'];

export function partieJouee(fichier: ExportPartie): PartieJouee {
  const tirages = fichier.actions.flatMap((entree) => entree.tirages);
  const { issue, sante } = fichier.observation;
  return {
    issue: issue ?? (sante === 'vaincu' ? 'defaite' : 'en_cours'),
    actions: fichier.actions.length,
    sante,
    des: tirages.length,
    touches: tirages.filter((tirage) => tirage <= SEUIL_JOUE).length,
  };
}

/**
 * Contrefactuel compté sur l'export seul : chaque jet de plus qui touche au nouveau seuil ajoute une aggravation à la santé
 * finale ; la défaite tombe au jet qui épuise les paliers. Approché : les soins et le feu pris entre deux jets sont ignorés.
 */
export function contrefactuelApproche(fichier: ExportPartie, seuil: number): Contrefactuel {
  const jouee = partieJouee(fichier);
  if (jouee.issue === 'defaite' || seuil <= SEUIL_JOUE) return { issue: jouee.issue, actions: jouee.actions, exact: false };
  let restants = PALIERS.length - 1 - PALIERS.indexOf(jouee.sante);
  for (const [index, entree] of fichier.actions.entries()) {
    restants -= entree.tirages.filter((tirage) => tirage > SEUIL_JOUE && tirage <= seuil).length;
    if (restants <= 0) return { issue: 'defaite', actions: index + 1, exact: false };
  }
  return { issue: jouee.issue, actions: jouee.actions, exact: false };
}

async function exportDe(rapport: Rapport): Promise<ExportPartie | null> {
  const json = rapport.corps.trimStart().startsWith('{') ? rapport.corps : await extrairePartie(rapport.corps);
  return json === null ? null : lireExport(JSON.parse(json) as unknown);
}

/** Mesure une partie envoyée ; `null` si le rapport n'en contient pas. */
export async function mesurerRapport(rapport: Rapport, seuil: number = SEUIL_SANS_ESQUIVE): Promise<PartieMesuree | null> {
  const fichier = await exportDe(rapport);
  if (fichier === null) return null;
  const base = { adresse: rapport.adresse, monde: fichier.monde, tiree: !Object.hasOwn(CATALOGUE.mondes, fichier.monde), duree: extraireDuree(rapport.corps), jouee: partieJouee(fichier) };
  const approche = contrefactuelApproche(fichier, seuil);
  const entree = CATALOGUE.resoudre(fichier.monde);
  if ('refus' in entree) return { ...base, rejeu: { identique: false, motif: `monde introuvable aujourd'hui (${entree.refus})` }, indicateurs: null, contrefactuel: approche };
  const rejeu = rejouerPourMesure(entree.monde, fichier, fichier.empreinte);
  if (!rejeu.identique) {
    const motif = rejeu.divergence === null ? 'état final différent' : `diverge à l'action ${rejeu.divergence.action} (${rejeu.divergence.motif})`;
    return { ...base, rejeu: { identique: false, motif }, indicateurs: null, contrefactuel: approche };
  }
  const autre = rejouerPourMesure(entree.monde, fichier, undefined, seuil).indicateurs;
  // Rejouée à l'identique, la partie dit elle-même quels jets ont touché, au seuil de sa version.
  const jouee = { ...base.jouee, touches: rejeu.indicateurs.parCause.griffes };
  return { ...base, jouee, rejeu: { identique: true }, indicateurs: rejeu.indicateurs, contrefactuel: { issue: autre.issue, actions: autre.actions, exact: true } };
}

const ISSUES: Readonly<Record<IssueMesuree, string>> = { evacuation: 'évacuation', defaite: 'défaite', en_cours: 'en cours' };
const SANTES: Readonly<Record<IndicateursPartie['sante'], string>> = { indemne: 'indemne', blesse: 'blessé', critique: 'critique', vaincu: '—' };

const virgule = (nombre: number, decimales = 1): string => nombre.toFixed(decimales).replace('.', ',');
const minutes = (secondes: number): string => `${virgule(secondes / 60)} min`;

export function mediane(valeurs: readonly number[]): number {
  if (valeurs.length === 0) return 0;
  const triees = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(triees.length / 2);
  return triees.length % 2 === 1 ? (triees[milieu] ?? 0) : ((triees[milieu - 1] ?? 0) + (triees[milieu] ?? 0)) / 2;
}

function coupsEnClair(indicateurs: IndicateursPartie): string {
  const parCause = Object.entries(indicateurs.parCause).filter(([, nombre]) => nombre > 0).map(([cause, nombre]) => `${cause} ${nombre}`);
  return parCause.length === 0 ? String(indicateurs.coups) : `${indicateurs.coups} (${parCause.join(', ')})`;
}

/** Numéro de l'issue ou de la PR, puis du commentaire : pour trier dans l'ordre d'envoi. */
function rang(adresse: string): [number, number] {
  const numero = Number(/\/(?:issues|pull)\/(\d+)/.exec(adresse)?.[1] ?? Number.MAX_SAFE_INTEGER);
  return [numero, Number(/#issuecomment-(\d+)/.exec(adresse)?.[1] ?? 0)];
}

function lien(adresse: string): string {
  const numero = /\/(?:issues|pull)\/(\d+)/.exec(adresse)?.[1];
  return numero === undefined ? adresse : `[#${numero}](${adresse})`;
}

function contrefactuelEnClair(partie: PartieMesuree): string {
  const { contrefactuel: autre, jouee } = partie;
  const texte = autre.issue === jouee.issue && autre.actions === jouee.actions ? 'inchangée' : `${ISSUES[autre.issue]} à l'action ${autre.actions}`;
  return autre.exact ? texte : `${texte} (approché)`;
}

/** Tableau Markdown des parties, puis la synthèse des parties finies sur une station tirée. */
export function enMarkdown(parties: readonly PartieMesuree[], seuil: number = SEUIL_SANS_ESQUIVE): string {
  const triees = [...parties].sort((a, b) => {
    const [x, y] = [rang(a.adresse), rang(b.adresse)];
    return x[0] - y[0] || x[1] - y[1];
  });
  const finies = triees.filter((partie) => partie.tiree && partie.jouee.issue !== 'en_cours');
  const enTete = `Avec le jet qui touche de 1 à ${seuil}`;
  const lignes = triees.map((partie) => {
    const { jouee, indicateurs: i } = partie;
    const rejeu = partie.rejeu.identique ? 'identique' : partie.rejeu.motif;
    const coups = i === null ? '—' : coupsEnClair(i);
    const contact = i === null ? '—' : String(i.premierContact ?? 'jamais');
    const horsJeu = i === null ? '—' : String(i.horsJeu ?? 'non');
    return `| ${lien(partie.adresse)} | ${partie.monde} | ${jouee.actions} | ${partie.duree === null ? '—' : minutes(partie.duree)} | ${ISSUES[jouee.issue]} | ${SANTES[jouee.sante]} | ${jouee.des} | ${jouee.touches} | ${coups} | ${contact} | ${horsJeu} | ${rejeu} | ${contrefactuelEnClair(partie)} |`;
  });
  const part = (nombre: number): string => `${nombre} sur ${finies.length}`;
  const durees = finies.flatMap((partie) => (partie.duree === null ? [] : [partie.duree]));
  const moyenne = (valeurs: readonly number[]): string => virgule(valeurs.length === 0 ? 0 : valeurs.reduce((somme, valeur) => somme + valeur, 0) / valeurs.length);
  return [
    `**Parties humaines** : ${triees.length} rapports avec une partie, dont ${finies.length} finies sur une station tirée (la synthèse ne compte qu'elles).`,
    '',
    `| Partie | Monde | Actions | Durée | Issue | Santé finale | Dés lancés | Jets qui ont touché | Coups reçus, par cause | Premier contact (action) | Créature hors jeu (action) | Rejeu par le moteur actuel | ${enTete} |`,
    '| --- | --- | ---: | ---: | --- | --- | ---: | ---: | --- | ---: | ---: | --- | --- |',
    ...lignes,
    '',
    '| Synthèse : parties finies sur une station tirée | Résultat |',
    '| --- | --- |',
    `| Évacuations | ${part(finies.filter((partie) => partie.jouee.issue === 'evacuation').length)} |`,
    `| Défaites | ${part(finies.filter((partie) => partie.jouee.issue === 'defaite').length)} |`,
    `| Actions, médiane | ${virgule(mediane(finies.map((partie) => partie.jouee.actions)))} |`,
    `| Durée, médiane | ${durees.length === 0 ? '—' : minutes(mediane(durees))} (${part(durees.length)} mesurées) |`,
    `| Dés lancés par partie, moyenne | ${moyenne(finies.map((partie) => partie.jouee.des))} |`,
    `| Parties sans aucun dé | ${part(finies.filter((partie) => partie.jouee.des === 0).length)} |`,
    `| Évacuées indemnes | ${part(finies.filter((partie) => partie.jouee.issue === 'evacuation' && partie.jouee.sante === 'indemne').length)} |`,
    `| ${enTete}, à décisions identiques : issue changée | ${part(finies.filter((partie) => partie.contrefactuel.issue !== partie.jouee.issue).length)} |`,
    '',
    "Le contrefactuel garde les mêmes commandes : un joueur blessé aurait sans doute joué autrement. C'est une indication, pas une mesure. Il est exact quand le moteur actuel rejoue la partie à l'identique ; sinon, il est compté sur les seuls tirages de l'export (approché).",
  ].join('\n');
}

export async function mesurerParties(rapports: readonly Rapport[], seuil: number = SEUIL_SANS_ESQUIVE): Promise<PartieMesuree[]> {
  const parties: PartieMesuree[] = [];
  for (const rapport of rapports) {
    const partie = await mesurerRapport(rapport, seuil);
    if (partie !== null) parties.push(partie);
  }
  return parties;
}

function lireSeuil(argumentsCli: readonly string[]): number {
  const texte = argumentsCli.find((argument) => argument.startsWith('--seuil='))?.slice('--seuil='.length);
  if (texte === undefined) return SEUIL_SANS_ESQUIVE;
  const seuil = Number(texte);
  if (!Number.isInteger(seuil) || seuil < 0 || seuil > 6) throw new Error(`Seuil invalide : ${texte} (entier de 0 à 6).`);
  return seuil;
}

if (isMainModule(import.meta.url)) {
  const argumentsCli = process.argv.slice(2);
  const options = argumentsCli.filter((argument) => argument.startsWith('--'));
  const inconnue = options.find((option) => !option.startsWith('--seuil=') && option !== '--depot');
  if (inconnue !== undefined) throw new Error(`Option inconnue : ${inconnue}.`);
  const sources = argumentsCli.filter((argument) => !argument.startsWith('--'));
  if (sources.length === 0 && !options.includes('--depot')) {
    console.error('Usage : npm run mesurer:parties -- --depot | <adresse d’un rapport | fichier>… [--seuil=6]');
    process.exitCode = 1;
  } else {
    const seuil = lireSeuil(argumentsCli);
    const rapports = [...(options.includes('--depot') ? await rapportsDuDepot() : []), ...(await Promise.all(sources.map((source) => lireRapport(source))))];
    console.log(enMarkdown(await mesurerParties(rapports, seuil), seuil));
  }
}
