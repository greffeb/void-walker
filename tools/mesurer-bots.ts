import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assemblerStation, jouer, nouvellePartie, observer, type Commande } from '../engine';
import { creerCatalogue, type Catalogue } from '../content';
import { BASES, creerBot, jouerAvecBot, optionsJouables, PLAFOND_ACTIONS, PROFILS, VARIANTES, type Profil, type Variante } from './bots';
import { botTemoin, botVoyant } from './bots-reference';
import type { IndicateursPartie } from './indicateurs-partie';
import { dansLeLot, lancerSousLots, lireOptionsLots, LOT_UNIQUE, type Lot } from './lots';
import { centile, graineDuBot, hasardDepuis, GRAINE_DIFFICULTE, PARTIES } from './mesurer-difficulte';
import { isMainModule } from './repo-files';
import { FINS, RAISONS_PERDU, SuiviRythme, type Fin, type RaisonPerdu, type Rythme } from './rythme-partie';
import { lireTemoins } from './verifier-grandes';
import { morceauDe } from './verifier-station';

// Mesure des bots (2026-11) : tous les bots jouent les grandes stations de `mesurer:difficulte --grandes`, mêmes stations et
// mêmes graines, et chaque partie finit dans une catégorie nommée, avec son rythme. Les bots à un seul défaut jouent avec la
// graine de l'averti : leurs parties se comparent une à une aux siennes. Zone verte : rien ne change au jeu. Hors de `verify`.

export const REFERENCES = ['temoin', 'voyant'] as const;
export type Reference = (typeof REFERENCES)[number];
export type NomBot = Profil | Variante | Reference;
export const BOTS: readonly NomBot[] = [...PROFILS, ...(Object.keys(VARIANTES) as Variante[]), ...REFERENCES];

/** Nom de chaque bot dans le rapport. */
export const NOMS: Readonly<Record<NomBot, string>> = {
  aleatoire: 'B1, aléatoire',
  prudent: 'B2, prudent',
  presse: 'B3, pressé',
  averti: 'B4, averti',
  'sans-fermer': 'averti qui ne ferme jamais',
  'ferme-tout': 'averti qui ferme chaque porte',
  'sans-lire': 'averti qui ne lit pas',
  'sans-ecouter': 'averti qui n’écoute pas',
  'sans-traces': 'averti sourd aux traces',
  discret: 'averti qui évite le bruit',
  'sans-fuir': 'averti qui ne fuit pas',
  enchaine: 'averti qui enchaîne ses gestes',
  expert: 'expert (les réglages gagnants réunis)',
  'prudent-enchaine': 'prudent qui enchaîne ses gestes',
  'casse-cou': 'casse-cou (prudent qui ignore la créature)',
  temoin: 'référence : chemin prouvé, à l’aveugle',
  voyant: 'référence omnisciente : chemin prouvé, voit 8 coups devant',
};

export interface PartieMesuree {
  readonly rang: number;
  readonly station: string;
  /** Morceaux de la station (« m-01 »…), sans le vestibule, le carrefour ni les annexes. */
  readonly morceaux: readonly string[];
  readonly bot: NomBot;
  /** Longueur du chemin prouvé de la station. */
  readonly temoin: number;
  readonly indicateurs: IndicateursPartie;
  readonly rythme: Rythme;
  readonly ms: number;
}

export interface OptionsBots {
  readonly catalogue?: Catalogue;
  readonly parties?: number;
  readonly bots?: readonly NomBot[];
  readonly lot?: Lot;
  readonly plafond?: number;
}

/** Joue les parties du lot : les stations et les graines sont celles de `mesurer:difficulte --grandes`, rang par rang. */
export function jouerParties(options: OptionsBots = {}): PartieMesuree[] {
  const catalogue = options.catalogue ?? creerCatalogue(assemblerStation);
  const plafond = options.plafond ?? PLAFOND_ACTIONS;
  const hasard = hasardDepuis(GRAINE_DIFFICULTE);
  const temoins = lireTemoins();
  const rangs = new Set(dansLeLot(Array.from({ length: options.parties ?? PARTIES }, (_, rang) => rang), options.lot ?? LOT_UNIQUE));
  const mesurees: PartieMesuree[] = [];
  for (let rang = 0; rang < (options.parties ?? PARTIES); rang++) {
    const station = catalogue.tirerGrande(hasard);
    const graine = hasard();
    if ('refus' in station) throw new Error(station.refus);
    if (!rangs.has(rang)) continue;
    const temoin = temoins[station.monde.id]?.[0];
    if (temoin === undefined) throw new Error(`Station ${station.monde.id} sans témoin publié.`);
    const morceaux = [...new Set(station.monde.pieces.map((piece) => morceauDe(piece.id) ?? ''))].filter((morceau) => morceau.startsWith('m-'));
    for (const nom of options.bots ?? BOTS) {
      const debut = performance.now();
      const bot =
        nom === 'temoin' ? botTemoin(temoin)
        : nom === 'voyant' ? botVoyant(station, graine, temoin)
        : creerBot(nom, graineDuBot(rang, nom in BASES ? BASES[nom as Variante] : (nom as Profil)));
      const suivi = new SuiviRythme(station.monde, nouvellePartie(station.monde, { version: 'bot', graine }), temoin);
      const { indicateurs } = jouerAvecBot(station, bot, graine, plafond, suivi.noter);
      mesurees.push({ rang, station: station.monde.id, morceaux, bot: nom, temoin: temoin.length, indicateurs, rythme: suivi.resultat(indicateurs, plafond), ms: performance.now() - debut });
    }
  }
  return mesurees;
}

/**
 * Vitesse du moteur seul, pour juger d'une recherche ou d'un apprentissage : le chemin prouvé des premières stations rejoué
 * `tours` fois, d'abord par `jouer` seul, puis avec l'observation publique de chaque pas. Rend aussi la taille de ce que voit
 * un bot : options engageantes par pas et poids de l'observation.
 */
export function mesurerMoteur(stations = 50, tours = 20, catalogue: Catalogue = creerCatalogue(assemblerStation)): string {
  const hasard = hasardDepuis(GRAINE_DIFFICULTE);
  const temoins = lireTemoins();
  const jeux = Array.from({ length: stations }, () => {
    const station = catalogue.tirerGrande(hasard);
    const graine = hasard();
    if ('refus' in station) throw new Error(station.refus);
    return { monde: station.monde, graine, pas: temoins[station.monde.id]?.[0] ?? [] };
  });
  const rejouer = (observe: boolean): { readonly actions: number; readonly options: number; readonly octets: number; readonly secondes: number } => {
    let [actions, options, octets] = [0, 0, 0];
    const debut = performance.now();
    for (let tour = 0; tour < tours; tour++) {
      for (const { monde, graine, pas } of jeux) {
        let partie = nouvellePartie(monde, { version: 'bot', graine });
        for (const [action, cible, parametre] of pas) {
          const resultat = jouer(monde, partie, { action, cible, ...(parametre === undefined ? {} : { parametre }) } as Commande);
          if (resultat.type !== 'engagee') break;
          partie = resultat.partie;
          actions++;
          if (!observe) continue;
          const observation = observer(monde, partie.etat);
          options += optionsJouables(observation).length;
          if (tour === 0) octets += JSON.stringify(observation).length;
        }
      }
    }
    return { actions, options, octets, secondes: (performance.now() - debut) / 1000 };
  };
  const seul = rejouer(false);
  const vu = rejouer(true);
  return [
    `**Vitesse du moteur** · ${stations} stations, chemin prouvé rejoué ${tours} fois, un seul processus`,
    '',
    `- \`jouer\` seul : ${Math.round(seul.actions / seul.secondes)} actions par seconde, soit ${Math.round((stations * tours) / seul.secondes)} parties de chemin prouvé par seconde.`,
    `- \`jouer\` puis \`observer\` : ${Math.round(vu.actions / vu.secondes)} actions par seconde.`,
    `- Options engageantes par pas : ${virgule(vu.options / Math.max(1, vu.actions))} en moyenne. Observation publique : ${Math.round((vu.octets * tours) / Math.max(1, vu.actions) / 1000)} ko en JSON par pas.`,
  ].join('\n');
}

const virgule = (nombre: number, decimales = 1): string => nombre.toFixed(decimales).replace('.', ',');
const pourcent = (part: number, total: number): string => (total === 0 ? '—' : `${virgule((part * 100) / total)} %`);

/** Médiane et quartiles : « 105 [62–171] » ; « — » sans valeur. */
export function quartiles(valeurs: readonly number[], decimales = 0): string {
  if (valeurs.length === 0) return '—';
  const [q1, q2, q3] = [0.25, 0.5, 0.75].map((p) => virgule(centile(valeurs, p), decimales));
  return `${q2} [${q1}–${q3}]`;
}

const presents = (valeurs: readonly (number | null)[]): number[] => valeurs.filter((valeur): valeur is number => valeur !== null);

/** Écart apparié du taux d'évacuation, en points, avec son intervalle à 95 % : mêmes stations, mêmes graines, partie par partie. */
export function ecartApparie(base: readonly PartieMesuree[], autre: readonly PartieMesuree[]): { readonly ecart: number; readonly marge: number; readonly gagnees: number; readonly perdues: number } {
  const evacuees = new Set(base.filter((partie) => partie.rythme.fin === 'evacuation').map((partie) => partie.rang));
  const rangs = new Set(base.map((partie) => partie.rang));
  let gagnees = 0;
  let perdues = 0;
  let total = 0;
  for (const partie of autre) {
    if (!rangs.has(partie.rang)) continue;
    total++;
    const evacuee = partie.rythme.fin === 'evacuation';
    if (evacuee && !evacuees.has(partie.rang)) gagnees++;
    if (!evacuee && evacuees.has(partie.rang)) perdues++;
  }
  if (total === 0) return { ecart: 0, marge: 0, gagnees, perdues };
  const ecart = (gagnees - perdues) / total;
  const variance = Math.max(0, (gagnees + perdues) / total - ecart * ecart) / total;
  return { ecart: ecart * 100, marge: 1.96 * Math.sqrt(variance) * 100, gagnees, perdues };
}

const LIBELLES_FIN: Readonly<Record<Fin, string>> = {
  evacuation: 'Évacuation', creature: 'Tué par la créature', environnement: 'Tué par le feu, le froid ou le vide', sans_sortie: 'Plus aucune sortie', perdu: 'Perdu (plafond)', interrompu: 'Interrompu',
};

const LIBELLES_RAISON: Readonly<Record<RaisonPerdu, string>> = {
  passage_jamais_pris: 'passage ouvert, jamais pris',
  porte_jamais_ouverte: 'porte qu’il pouvait ouvrir, jamais ouverte',
  geste_jamais_choisi: 'geste proposé au menu, jamais choisi',
  geste_jamais_propose: 'geste jamais proposé (il lui manquait quelque chose)',
  passage_bloque: 'passage vu, jamais praticable, sans geste manquant',
  passage_jamais_vu: 'passage jamais vu',
  chemin_parcouru: 'tous les passages du chemin franchis',
};

/** Les plus fréquents d'abord : « m-02 31 %, m-08 22 % ». */
function palmares(valeurs: readonly string[], combien: number): string {
  const comptes = new Map<string, number>();
  for (const valeur of valeurs) comptes.set(valeur, (comptes.get(valeur) ?? 0) + 1);
  return [...comptes].sort(([a, n], [b, m]) => m - n || (a < b ? -1 : 1)).slice(0, combien).map(([valeur, compte]) => `${valeur} ${pourcent(compte, valeurs.length)}`).join(', ') || '—';
}

/** Rapport Markdown : fins, rythme, gestes comparés à l'averti, parties perdues, références. */
export function enMarkdown(parties: readonly PartieMesuree[], commit = 'inconnu'): string {
  const bots = BOTS.filter((bot) => parties.some((partie) => partie.bot === bot));
  const de = (bot: NomBot): PartieMesuree[] => parties.filter((partie) => partie.bot === bot);
  const joueurs = bots.filter((bot) => !(REFERENCES as readonly string[]).includes(bot));
  const nombre = Math.max(0, ...bots.map((bot) => de(bot).length));
  const fins = bots.map((bot) => {
    const siennes = de(bot);
    return `| ${NOMS[bot]} | ${FINS.map((fin) => pourcent(siennes.filter((partie) => partie.rythme.fin === fin).length, siennes.length)).join(' | ')} |`;
  });
  const rythme = bots.map((bot) => {
    const r = de(bot).map((partie) => partie.rythme);
    const finies = r.filter((partie) => partie.fin === 'evacuation' || partie.fin === 'creature' || partie.fin === 'environnement');
    const moments = finies.filter((partie) => partie.premierContact !== null).map((partie) => ((partie.premierContact ?? 0) * 100) / partie.actions);
    return `| ${NOMS[bot]} | ${quartiles(r.filter((partie) => partie.fin === 'evacuation').map((partie) => partie.actions))} | ${quartiles(presents(r.map((partie) => partie.premierSigne)))} | ${quartiles(presents(r.map((partie) => partie.premierContact)))} | ${moments.length === 0 ? '—' : `${quartiles(moments)} %`} | ${pourcent(finies.filter((partie) => partie.premierContact === null).length, finies.length)} | ${pourcent(r.filter((partie) => partie.premierContact !== null && partie.fin === 'evacuation').length, r.filter((partie) => partie.premierContact !== null).length)} | ${quartiles(r.map((partie) => partie.faceAFace))} | ${virgule(r.reduce((somme, partie) => somme + partie.griffes, 0) / Math.max(1, r.length), 2)} | ${quartiles(r.filter((partie) => partie.premierContact !== null).map((partie) => partie.poursuite))} | ${pourcent(r.filter((partie) => partie.sansMenace > 0).length, r.length)} | ${quartiles(r.map((partie) => partie.calme))} | ${quartiles(r.map((partie) => partie.allersRetours))} | ${quartiles(r.map((partie) => partie.actions / partie.pieces), 1)} |`;
  });
  const morts = bots.flatMap((bot) => {
    const tuees = de(bot).filter((partie) => partie.rythme.fin === 'creature');
    if (tuees.length === 0) return [];
    const sursis = presents(tuees.map((partie) => partie.rythme.sursis));
    return [`| ${NOMS[bot]} | ${tuees.length} | ${quartiles(tuees.map((partie) => partie.rythme.actions))} | ${quartiles(sursis)} | ${pourcent(sursis.filter((valeur) => valeur <= 5).length, sursis.length)} | ${pourcent(tuees.filter((partie) => (partie.indicateurs.avancementDefaite ?? 0) > 0.5).length, tuees.length)} |`];
  });
  const base = de('averti');
  const evacuations = (liste: readonly PartieMesuree[]): string => pourcent(liste.filter((partie) => partie.rythme.fin === 'evacuation').length, liste.length);
  const gestes = joueurs.filter((bot): bot is Variante => bot in VARIANTES && de(BASES[bot as Variante]).length > 0).map((bot) => {
    const siennes = de(bot);
    const { ecart, marge, gagnees, perdues } = ecartApparie(de(BASES[bot]), siennes);
    const moyenne = (valeur: (rythme: Rythme) => number): string => virgule(siennes.reduce((somme, partie) => somme + valeur(partie.rythme), 0) / Math.max(1, siennes.length));
    return `| ${NOMS[bot]} | ${BASES[bot]} | ${evacuations(siennes)} | ${ecart >= 0 ? '+' : '−'}${virgule(Math.abs(ecart))} | [${virgule(ecart - marge)} ; ${virgule(ecart + marge)}] | ${gagnees} | ${perdues} | ${moyenne((r) => r.attentes)} | ${moyenne((r) => r.fermetures)} | ${quartiles(siennes.filter((partie) => partie.rythme.fin === 'evacuation').map((partie) => partie.rythme.actions))} |`;
  });
  const perdus = joueurs.flatMap((bot) => {
    const siennes = de(bot).flatMap((partie) => (partie.rythme.perdu === null ? [] : [partie.rythme.perdu]));
    if (siennes.length === 0) return [];
    return [`| ${NOMS[bot]} | ${siennes.length} | ${RAISONS_PERDU.map((raison) => pourcent(siennes.filter((perdu) => perdu.raison === raison).length, siennes.length)).join(' | ')} | ${quartiles(siennes.map((perdu) => perdu.piecesALaFin))} | ${quartiles(siennes.map((perdu) => perdu.attentesALaFin))} |`];
  });
  const ou = joueurs.flatMap((bot) => {
    const siennes = de(bot).flatMap((partie) => (partie.rythme.perdu === null ? [] : [partie.rythme.perdu]));
    if (siennes.length === 0) return [];
    return [`| ${NOMS[bot]} | ${palmares(siennes.map((perdu) => perdu.frontiere ?? 'aucun'), 5)} | ${palmares(siennes.flatMap((perdu) => (perdu.geste === null ? [] : [perdu.geste])), 5)} |`];
  });
  // Par morceau, pour le bot averti : part des parties qui contiennent le morceau et s'y arrêtent, perdues.
  const morceaux = [...new Set(base.flatMap((partie) => partie.morceaux))].sort().map((morceau) => {
    const avec = base.filter((partie) => partie.morceaux.includes(morceau));
    const compte = (fin: Fin): number => avec.filter((partie) => partie.rythme.fin === fin).length;
    return `| ${morceau} | ${avec.length} | ${pourcent(compte('evacuation'), avec.length)} | ${pourcent(compte('creature'), avec.length)} | ${pourcent(compte('environnement'), avec.length)} | ${pourcent(compte('perdu') + compte('sans_sortie'), avec.length)} | ${pourcent(avec.filter((partie) => partie.rythme.perdu?.frontiere === morceau).length, avec.length)} |`;
  });
  const vitesse = bots.map((bot) => {
    const siennes = de(bot);
    const secondes = siennes.reduce((somme, partie) => somme + partie.ms, 0) / 1000;
    const actions = siennes.reduce((somme, partie) => somme + partie.rythme.actions, 0);
    return `| ${NOMS[bot]} | ${virgule(siennes.length / secondes)} | ${Math.round(actions / secondes)} |`;
  });
  const longueurs = [...new Map(parties.map((partie) => [partie.rang, partie.temoin])).values()];
  return [
    `**Mesure des bots** · commit ${commit} · graine de mesure ${GRAINE_DIFFICULTE} · ${nombre} grandes stations, celles de \`mesurer:difficulte --grandes\` · plafond ${PLAFOND_ACTIONS} actions`,
    '',
    `Chemin prouvé des stations tirées : ${quartiles(longueurs)} actions (médiane [quartiles]). Partout, « 105 [62–171] » se lit : médiane 105, la moitié des parties entre 62 et 171.`,
    '',
    '### Comment finissent les parties',
    '',
    `| Bot | ${FINS.map((fin) => LIBELLES_FIN[fin]).join(' | ')} |`,
    `| --- | ${FINS.map(() => '---:').join(' | ')} |`,
    ...fins,
    '',
    '### Rythme',
    '',
    '| Bot | Durée des évacuations (actions) | Premier signe (action) | Premier contact (action) | Moment du contact dans la partie (parties finies) | Parties finies sans rencontre | Évacuation après un contact | Face-à-face par partie | Coups de griffes par partie (moyenne) | Actions en poursuite (parties avec contact) | Créature hors jeu ou enfermée avant la fin | Plus longue suite sans événement (actions) | Allers-retours | Actions par pièce visitée |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rythme,
    '',
    '### Quand la créature tue',
    '',
    '| Bot | Morts par la créature | Action de la mort | Actions entre le premier contact et la mort | Morts dans les 5 actions après le contact | Morts dans la seconde moitié de la station |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...morts,
    ...(gestes.length === 0 ? [] : [
      '',
      '### Ce que vaut chaque geste',
      '',
      `Chaque ligne est un profil d’origine avec un seul réglage changé (l’expert en change plusieurs), sur les mêmes stations et les mêmes graines : l’averti évacue ${evacuations(base)} des parties, le prudent ${evacuations(de('prudent'))}. L’écart est en points d’évacuation ; un intervalle qui contient 0 ne prouve rien.`,
      '',
      '| Bot | Comparé à | Évacuation | Écart (points) | Intervalle à 95 % | Parties gagnées | Parties perdues | Attentes par partie | Portes fermées par partie | Durée des évacuations (actions) |',
      '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...gestes,
    ]),
    '',
    '### Parties perdues : où le bot s’est arrêté sur le chemin prouvé',
    '',
    `Parties au plafond ou sans sortie. On cherche le premier passage du chemin prouvé que le bot n’a jamais franchi, et pourquoi. Les deux dernières colonnes regardent ses ${200} dernières actions.`,
    '',
    `| Bot | Parties | ${RAISONS_PERDU.map((raison) => LIBELLES_RAISON[raison]).join(' | ')} | Pièces parcourues à la fin | Attentes à la fin |`,
    `| --- | ---: | ${RAISONS_PERDU.map(() => '---:').join(' | ')} | ---: | ---: |`,
    ...perdus,
    '',
    '| Bot | Morceau du passage jamais franchi | Geste du chemin prouvé qui manquait |',
    '| --- | --- | --- |',
    ...ou,
    ...(morceaux.length === 0 ? [] : [
      '',
      '### Bot averti, par morceau de la station',
      '',
      'Une station compte pour chacun de ses morceaux. Dernière colonne : parties perdues dont le passage jamais franchi est dans ce morceau.',
      '',
      '| Morceau | Parties | Évacuation | Tué par la créature | Tué par l’environnement | Perdu | Perdu dans ce morceau |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...morceaux,
    ]),
    '',
    '### Vitesse',
    '',
    '| Bot | Parties par seconde | Actions par seconde |',
    '| --- | ---: | ---: |',
    ...vitesse,
  ].join('\n');
}

if (isMainModule(import.meta.url)) {
  const { lot, parts, reste } = lireOptionsLots(process.argv.slice(2));
  const valeur = (nom: string): string | undefined => reste.find((argument) => argument.startsWith(`--${nom}=`))?.slice(nom.length + 3);
  if (reste.includes('--moteur')) {
    console.log(mesurerMoteur());
    process.exit(0);
  }
  const inconnue = reste.find((argument) => argument !== '--brut' && !['--parties=', '--bots=', '--json=', '--depuis=', '--commit='].some((prefixe) => argument.startsWith(prefixe)));
  if (inconnue !== undefined) throw new Error(`Option inconnue : ${inconnue}. Options : --parties=<n> --bots=a,b --processus=<n> --json=<fichier> --depuis=<fichier> --moteur.`);
  const parties = Number(valeur('parties') ?? PARTIES);
  if (!Number.isInteger(parties) || parties < 1) throw new Error(`Nombre de parties invalide : ${String(valeur('parties'))}.`);
  const bots = valeur('bots')?.split(',') as NomBot[] | undefined;
  const etranger = bots?.find((bot) => !BOTS.includes(bot));
  if (etranger !== undefined) throw new Error(`Bot inconnu : ${etranger}. Bots : ${BOTS.join(', ')}.`);
  const depuis = valeur('depuis');
  let mesurees: PartieMesuree[];
  if (depuis !== undefined) mesurees = JSON.parse(readFileSync(depuis, 'utf8')) as PartieMesuree[];
  else if (parts > 1) {
    // Un sous-processus par lot de rangs ; chacun rend ses parties en JSON, une par ligne.
    const sorties = await lancerSousLots(fileURLToPath(import.meta.url), lot, parts, [...reste.filter((argument) => !argument.startsWith('--json=')), '--brut']);
    const echec = sorties.find(({ code }) => code !== 0);
    if (echec !== undefined) throw new Error(`Un processus de mesure a échoué : ${echec.erreurs}`);
    mesurees = sorties.flatMap(({ sortie }) => sortie.split('\n').filter((ligne) => ligne.startsWith('{')).map((ligne) => JSON.parse(ligne) as PartieMesuree)).sort((a, b) => a.rang - b.rang);
  } else mesurees = jouerParties({ parties, lot, ...(bots === undefined ? {} : { bots }) });
  const json = valeur('json');
  if (json !== undefined) writeFileSync(json, JSON.stringify(mesurees));
  if (reste.includes('--brut')) for (const partie of mesurees) console.log(JSON.stringify(partie));
  else {
    const { execFileSync } = await import('node:child_process');
    let commit = valeur('commit') ?? 'inconnu';
    if (commit === 'inconnu') try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* hors d'un dépôt */ }
    console.log(enMarkdown(mesurees, commit));
  }
}
