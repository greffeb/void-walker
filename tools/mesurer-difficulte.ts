import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { assemblerStation, CAUSES, prefixer, type Cause, type DefMonde } from '../engine';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { COMPOSITIONS_PUBLIEES, creerCatalogue, MORCEAUX, type Catalogue, type Composition } from '../content';
import { creerBot, jouerAvecBot, PLAFOND_ACTIONS, PROFILS, type Profil } from './bots';
import type { IndicateursPartie } from './indicateurs-partie';
import { lireVerdicts } from './mesurer-tirages';
import { mediane } from './mesurer-parties';
import { isMainModule } from './repo-files';
import { lireTemoins, sansButin } from './verifier-grandes';
import { empreintesDe, verifierComposition, type LigneCatalogue } from './verifier-station';

// Rapport de difficulté (#194 §2.4) : les bots jouent les mêmes stations tirées, avec les mêmes graines, pour chaque variante.
// B0 est le chemin prouvé par `check:stations` (sa station de référence) ; B1 à B3 jouent par le menu public. Zone verte : rien
// ne change au jeu. Hors de `verify` ; les tests gardent le rendu et la reproductibilité.

/** Hasard des stations et des parties mesurées : le même à chaque mesure, pour comparer les variantes. */
export const GRAINE_DIFFICULTE = 20261017;
export const PARTIES = 1000;

/** Numéro et nom de chaque profil dans le rapport (#194 §2.3). */
export const NOMS_PROFILS: Readonly<Record<Profil, string>> = { aleatoire: 'B1, aléatoire', prudent: 'B2, prudent', presse: 'B3, pressé', averti: 'B4, averti' };

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
  /** Parties où la créature était hors jeu ou enfermée avant que le passager entre dans le morceau final (D-241). */
  readonly horsJeuAvantFinal: number;
  readonly sansSortie: number;
  /** Rythme (spec 2026-10-18 §11) : action du premier contact, des parties qui en ont eu un. */
  readonly actionsAvantContact: readonly number[];
  /** Pièces visitées de chaque partie. */
  readonly piecesVisitees: readonly number[];
  /** Parties où une boucle a servi après la rencontre. */
  readonly boucles: number;
  /** Défaites dans la seconde moitié de la station (avancement au-delà de la moitié). */
  readonly defaitesTardives: number;
  /** Parties abandonnées au plafond sans aucune rencontre : le bot s'est perdu, la station n'y est pour rien (elle est prouvée). */
  readonly abandonsSansContact: number;
  readonly evacueesSansContact: number;
  /** Moment de la rencontre dans chaque partie finie qui en a eu une : action du contact sur actions de la partie. */
  readonly momentsContact: readonly number[];
}

export interface MesureMorceau {
  readonly parties: number;
  readonly evacuations: number;
  readonly defaites: number;
}

/** Grandes stations tirées, quel que soit le profil : lues sur la station tirée, butin compris (spec 2026-10-18 §6.5, §6.6). */
export interface MesureStations {
  /** Identifiants des stations tirées, dans l'ordre du tirage : les mêmes avec et sans butin. */
  readonly ids: readonly string[];
  /** Clés déclarées par les morceaux des stations, et celles que l'assemblage pose hors de la pièce d'origine du morceau. */
  readonly cles: number;
  readonly clesDeplacees: number;
  /** Salles de butin (pillée, ou garnie d'un objet de butin), et celles que le pillage a laissées vides. */
  readonly sallesDeButin: number;
  readonly sallesVides: number;
  /** Objets de butin dans les mondes joués : aucun quand la mesure se fait sans butin. */
  readonly objetsDeButin: number;
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
  /** Mesure faite sur les grandes stations publiées. */
  readonly grandes?: boolean;
  readonly stations?: MesureStations;
  /** Les mêmes stations, jouées privées de leur butin. */
  readonly sansButin?: boolean;
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
  parCause: Object.fromEntries(CAUSES.map((cause) => [cause, 0])) as Record<Cause, number>, sansContact: 0, horsJeu: 0, horsJeuAvantFinal: 0, sansSortie: 0,
  actionsAvantContact: [], piecesVisitees: [], boucles: 0, defaitesTardives: 0, abandonsSansContact: 0, evacueesSansContact: 0, momentsContact: [],
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
    horsJeuAvantFinal: mesure.horsJeuAvantFinal + (partie.horsJeuAvantFinal ? 1 : 0),
    sansSortie: mesure.sansSortie + (partie.sansSortie === null ? 0 : 1),
    actionsAvantContact: partie.premierContact === null ? mesure.actionsAvantContact : [...mesure.actionsAvantContact, partie.premierContact],
    piecesVisitees: [...mesure.piecesVisitees, partie.piecesVisitees],
    boucles: mesure.boucles + (partie.boucleEnPoursuite ? 1 : 0),
    defaitesTardives: mesure.defaitesTardives + ((partie.avancementDefaite ?? 0) > 0.5 ? 1 : 0),
    abandonsSansContact: mesure.abandonsSansContact + (partie.issue === 'en_cours' && partie.premierContact === null ? 1 : 0),
    evacueesSansContact: mesure.evacueesSansContact + (partie.issue === 'evacuation' && partie.premierContact === null ? 1 : 0),
    momentsContact: partie.issue === 'en_cours' || partie.premierContact === null ? mesure.momentsContact : [...mesure.momentsContact, partie.premierContact / partie.actions],
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
  /** Grandes stations publiées (spec 2026-10-18 §11) : B0 est leur témoin publié, sans recherche. */
  readonly grandes?: boolean;
  /** Avec `grandes` : les mêmes stations tirées, jouées sans leurs objets de butin (`sansButin` de verifier-grandes). */
  readonly sansButin?: boolean;
}

/** Clés que les morceaux de la station déclarent, et parmi elles celles que l'assemblage a posées hors de leur pièce d'origine. */
function clesDeLaStation(monde: DefMonde): { readonly cles: number; readonly deplacees: number } {
  let cles = 0;
  let deplacees = 0;
  for (const { morceau } of Object.values(MORCEAUX)) {
    for (const id of Object.keys(morceau.grande?.cles ?? {})) {
      const objet = monde.objets.find((candidat) => candidat.id === prefixer(morceau.id, id));
      if (objet === undefined) continue; // le morceau n'est pas dans cette station
      cles++;
      if (objet.piece !== prefixer(morceau.id, morceau.objets.find((origine) => origine.id === id)?.piece ?? '')) deplacees++;
    }
  }
  return { cles, deplacees };
}

/** Salles de butin : pillées, ou qui tiennent encore un objet de butin ; vides : les pillées. */
function sallesDeButinDe(monde: DefMonde): { readonly salles: number; readonly vides: number } {
  const garnies = new Set(monde.objets.filter((objet) => objet.butin === true).map((objet) => objet.piece));
  const salles = monde.pieces.filter((piece) => piece.pillee === true || garnies.has(piece.id));
  return { salles: salles.length, vides: salles.filter((piece) => piece.pillee === true).length };
}

export function mesurerDifficulte(options: OptionsDifficulte = {}): MesuresDifficulte {
  if (options.sansButin === true && options.grandes !== true) throw new Error('Option --sans-butin sans --grandes : le butin n’existe que dans les grandes stations.');
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
  const grandes = options.grandes === true ? new Map(catalogue.grandes.map((composition) => [composition.id, composition])) : null;
  const temoins = grandes === null ? {} : lireTemoins();
  const stations = { ids: [] as string[], cles: 0, clesDeplacees: 0, sallesDeButin: 0, sallesVides: 0, objetsDeButin: 0 };
  for (let rang = 0; rang < parties; rang++) {
    const station = grandes === null ? catalogue.tirer(hasard) : catalogue.tirerGrande(hasard);
    const graine = hasard();
    if ('refus' in station) throw new Error(station.refus);
    const id = station.monde.id;
    const composition = (grandes ?? parId).get(id.slice(0, id.lastIndexOf('-')));
    if (composition === undefined) throw new Error(`Composition de la station ${id} absente du catalogue.`);
    tirees.add(composition.id);
    // Sans butin, la station est la même (même id, mêmes graines) mais jouée privée de ses objets de butin ; ses indicateurs se lisent sur la station tirée.
    const jouee = options.sansButin === true ? sansButin(station) : station;
    if (grandes !== null) {
      const cles = clesDeLaStation(station.monde);
      const salles = sallesDeButinDe(station.monde);
      stations.ids.push(id);
      stations.cles += cles.cles;
      stations.clesDeplacees += cles.deplacees;
      stations.sallesDeButin += salles.salles;
      stations.sallesVides += salles.vides;
      stations.objetsDeButin += jouee.monde.objets.filter((objet) => objet.butin === true).length;
      const temoin = temoins[id]?.[0];
      if (temoin !== undefined) {
        prouvees++;
        longueurs.push(temoin.length);
      }
    } else {
      const ligne = ligneDe(composition as Composition);
      if (ligne.verdict === 'prouvee') {
        prouvees++;
        if (ligne.actions !== null) longueurs.push(ligne.actions);
      }
    }
    for (const profil of profils) {
      const { indicateurs } = jouerAvecBot(jouee, creerBot(profil, graineDuBot(rang, profil)), graine, options.plafond ?? PLAFOND_ACTIONS);
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
    compositions: { publiees: grandes === null ? COMPOSITIONS_PUBLIEES.length : catalogue.grandes.filter((composition) => composition.refus === null).length, tirees: tirees.size },
    prouve: { prouvees, longueurs },
    profils: retenus,
    morceaux,
    secondes: (performance.now() - debut) / 1000,
    ...(grandes === null ? {} : { grandes: true, stations }),
    ...(options.sansButin === true ? { sansButin: true } : {}),
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
  const medianeOuTiret = (valeurs: readonly number[]): string => (valeurs.length === 0 ? '—' : virgule(mediane(valeurs)));
  const rythme = (Object.entries(mesures.profils) as [Profil, MesureProfil][]).map(
    ([profil, m]) => `| ${NOMS_PROFILS[profil]} | ${medianeOuTiret(m.actionsAvantContact)} | ${medianeOuTiret(m.piecesVisitees)} | ${pourcent(m.boucles, m.parties - m.sansContact)} | ${pourcent(m.defaitesTardives, m.defaites)} | ${pourcent(m.sansContact - m.abandonsSansContact, m.parties - m.abandons)} | ${pourcent(m.evacueesSansContact, m.evacuations)} | ${m.momentsContact.length === 0 ? '—' : `${Math.round(mediane(m.momentsContact) * 100)} %`} |`,
  );
  const stationsEnClair = mesures.stations === undefined ? [] : [
    '',
    `Clés et butin (spec 2026-10-18 §6.5, §6.6), sur les stations tirées, quel que soit le profil. Clé déplacée : posée hors de la pièce d'origine de son morceau. Salle vide : salle de butin que le pillage a laissée vide.`,
    '',
    `- Clés déplacées : ${pourcent(mesures.stations.clesDeplacees, mesures.stations.cles)} (${mesures.stations.clesDeplacees} sur ${mesures.stations.cles} clés déclarées)`,
    `- Salles vides : ${pourcent(mesures.stations.sallesVides, mesures.stations.sallesDeButin)} (${mesures.stations.sallesVides} sur ${mesures.stations.sallesDeButin} salles de butin)`,
    `- Objets de butin dans les mondes joués : ${mesures.stations.objetsDeButin}`,
  ];
  const horsJeuAvantFinal = (Object.entries(mesures.profils) as [Profil, MesureProfil][]).map(([profil, m]) => `| ${NOMS_PROFILS[profil]} | ${pourcent(m.horsJeuAvantFinal, m.parties)} |`);
  return [
    `**Rapport de difficulté** · variante ${mesures.variante} · commit ${mesures.commit} · graine de mesure ${mesures.graine} · ${parties} parties par profil`,
    '',
    `Stations : ${mesures.compositions.publiees} ${mesures.grandes === true ? 'grandes compositions' : 'compositions'} publiées, ${mesures.compositions.tirees} tirées dans cette mesure. Plafond : ${PLAFOND_ACTIONS} actions par partie de bot.${mesures.sansButin === true ? ' Les mêmes stations, butin retiré des mondes joués.' : ''}`,
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
    'Rythme de la partie (spec 2026-10-18 §11) :',
    '',
    '| Profil | Actions avant la rencontre (médiane) | Pièces visitées (médiane) | Poursuites par une boucle (parties avec rencontre) | Défaites dans la seconde moitié de la station | Jamais de contact (parties finies) | Évacuations sans rencontre | Moment de la rencontre dans la partie (médiane) |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rythme,
    '',
    'Mise hors jeu avant le final (D-241) : créature hors jeu ou enfermée avant que le passager entre dans une pièce du morceau final, part des parties :',
    '',
    '| Profil | Mise hors jeu avant le final |',
    '| --- | ---: |',
    ...horsJeuAvantFinal,
    ...stationsEnClair,
    '',
    `B0 : ${mesures.grandes === true ? 'témoin publié de la station tirée (`npm run publier:grandes`), rejoué par `check:stations`' : 'témoin de `check:stations` sur la station de référence de chaque composition, pas sur la station tirée'}. Les bots ne voient que ce que voit le joueur ; ils mesurent, ils ne prouvent rien. Mesure faite en ${virgule(mesures.secondes, 0)} s.`,
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
  const inconnue = argumentsCli.find((argument) => !['--grandes', '--sans-butin'].includes(argument) && !['--parties=', '--verdicts=', '--variante='].some((prefixe) => argument.startsWith(prefixe)));
  if (inconnue !== undefined) throw new Error(`Option inconnue : ${inconnue}.`);
  const texte = valeur('parties');
  const parties = texte === undefined ? PARTIES : Number(texte);
  if (!Number.isInteger(parties) || parties < 1) throw new Error(`Nombre de parties invalide : ${String(texte)}.`);
  const fichier = valeur('verdicts');
  const verdicts = fichier === undefined ? new Map<string, LigneCatalogue>() : lireVerdicts(readFileSync(fichier, 'utf8'));
  const grandes = argumentsCli.includes('--grandes');
  console.log(enMarkdown(mesurerDifficulte({ parties, verdicts, grandes, sansButin: argumentsCli.includes('--sans-butin'), variante: valeur('variante') ?? 'V0', commit: commitCourant() })));
}
