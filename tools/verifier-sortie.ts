import { idPublic, jouer, nouvellePartie, observer, prefixer, type DefMonde, type EtatPartie, type OptionMenu, type Partie } from '../engine';
import { COMPOSITIONS_PUBLIEES, MORCEAUX, VERSION_GENERATEUR, type Catalogue } from '../content';
import { CATALOGUE } from './catalogue';
import { fileURLToPath } from 'node:url';
import { dansLeLot, lancerSousLots, lireOptionsLots } from './lots';
import { isMainModule } from './repo-files';
import { cleEtatRegles, MONDES_DE_REFERENCE, rangsDesMorceaux, stationDeReference } from './verifier-station';

// Contrôle du signal « plus aucune sortie » (D-085, D-275) : parties au hasard, dés compris ; à chaque état atteint, le signal
// est comparé à une recherche complète du moteur sur le même état, sans créature, feu, froid ni brèche, qui ne ferment aucun
// passage. Un seul désaccord, ou une recherche qui n'aboutit pas, fait échouer le contrôle. Mondes de référence, stations
// courtes publiées, puis un échantillon de grandes stations publiées (spec 2026-10-18 §7.4), sans perte exprès des ponts.

const VERSION = 'verifier-sortie';
const MAX_ETATS = 400_000;
export const PARTIES_PAR_STATION = 4;
export const ACTIONS_PAR_PARTIE = 80;
/** Grandes stations publiées vérifiées au plus (spec 2026-10-18 §7.4). */
export const GRANDES_SORTIE = 12;

export interface StationEchantillon {
  readonly station: string;
  /** Clés déplacées que cette station est la première à couvrir, ou le chemin qu'elle est la première à porter. */
  readonly couvre: readonly string[];
}

/**
 * Échantillon fixe de grandes stations publiées, dans l'ordre de la liste triée : la première qui déplace chaque clé pas encore
 * couverte (clé déclarée par son morceau, hors de sa pièce d'origine), puis la première en chaîne de chaque chemin encore absent
 * (M-12, qui n'a pas de clé, #236). Pas de station pour l'ordre libre : elle ne couvre aucune
 * clé, chaque état y coûte une recherche de 6 à 10 s, et les stations courtes en ordre libre couvrent déjà les cloisons.
 */
export function echantillonGrandes(catalogue: Catalogue): StationEchantillon[] {
  // Pièce d'origine de chaque clé, préfixée comme dans le monde assemblé.
  const origines = new Map(
    Object.values(MORCEAUX).flatMap(({ morceau }) =>
      Object.keys(morceau.grande?.cles ?? {}).map((id) => [prefixer(morceau.id, id), prefixer(morceau.id, morceau.objets.find((objet) => objet.id === id)?.piece ?? '')] as const),
    ),
  );
  const restantes = new Set(origines.keys());
  const echantillon: StationEchantillon[] = [];
  // Chaque station s'assemble pour lire ses clés : on s'arrête dès qu'elles sont toutes couvertes.
  for (const id of [...catalogue.publiees].sort()) {
    if (restantes.size === 0) break;
    const entree = catalogue.resoudre(id);
    if ('refus' in entree) throw new Error(entree.refus);
    const deplacees = entree.monde.objets.filter((objet) => restantes.has(objet.id) && objet.piece !== origines.get(objet.id)).map((objet) => objet.id);
    if (deplacees.length === 0) continue;
    echantillon.push({ station: id, couvre: deplacees });
    for (const cle of deplacees) restantes.delete(cle);
  }
  const cheminsDe = (station: string): readonly string[] => catalogue.grandes.find((composition) => station.startsWith(`${composition.id}-`))?.chemins ?? [];
  const portes = new Set(echantillon.flatMap(({ station }) => cheminsDe(station)));
  const chaines = [...catalogue.publiees].sort().filter((id) => !id.startsWith(`g${VERSION_GENERATEUR}-ol-`));
  for (const { morceau } of Object.values(MORCEAUX).filter(({ morceau }) => morceau.famille === 'chemin' && !portes.has(morceau.id))) {
    const station = chaines.find((id) => cheminsDe(id).includes(morceau.id));
    if (station === undefined || portes.has(morceau.id)) continue;
    echantillon.push({ station, couvre: [morceau.id] });
    for (const chemin of cheminsDe(station)) portes.add(chemin);
  }
  return echantillon.slice(0, GRANDES_SORTIE);
}

/**
 * Le même état, sans créature, feu, froid, brèche ni blessure : ce que la recherche complète explore, remis ainsi à chaque pas.
 * Aucun d'eux n'ouvre de passage ; les ôter ne retire donc aucune évacuation possible.
 */
export function etatSansDangers(etat: EtatPartie): EtatPartie {
  return { ...etat, creature: null, feu: [], expositions: [], breches: [], sante: 'indemne', froid: 0, alarmes: [] };
}

export type Verdict = 'evacuation' | 'aucune' | 'plafond';

/** Gestes qu'un chemin vers la capsule peut demander quand rien ne menace (mode `elague`) : le reste ne fait qu'ajouter des états. */
const GESTES_UTILES: ReadonlySet<string> = new Set(['aller', 'ouvrir', 'prendre', 'poser', 'deplacer', 'placer', 'actionner', 'activer', 'installer', 'lancer', 'deriver', 'fermer',
  'envoyer', 'replacer', 'rearmer', 'reprendre_drone', 'attendre']);

/**
 * Recherche complète depuis `etat` ; épuisée sans évacuation : `aucune`. L'ordre ne change que la vitesse : d'abord les états
 * les plus avancés (cloisons levées, circuit activé, source installée), puis le morceau le plus avancé, dans l'ordre d'arrivée.
 * `elague` : seulement les gestes utiles, sur les objets qui servent au chemin (pont, appui, source, carte d'un lecteur), et « fermer » dans la
 * cabine ; un chemin trouvé ainsi est une vraie évacuation, mais « aucune » n'y prouve rien.
 */
export function chercherEvacuation(
  monde: DefMonde,
  etat: EtatPartie,
  { maxEtats = MAX_ETATS, elague = false, morts }: { readonly maxEtats?: number; readonly elague?: boolean; readonly morts?: Set<string> } = {},
): { verdict: Verdict; etats: number } {
  const exiges = new Set(monde.objets.flatMap((objet) => (objet.exige === undefined ? [] : [objet.exige])));
  const utiles = new Set(monde.objets.filter((objet) => objet.pont === true || objet.appui === true || objet.source === true || exiges.has(objet.id)
    || objet.drone !== undefined || objet.obstacle !== undefined).map((objet) => idPublic(monde.id, objet.id)));
  const cabines = new Set(monde.objets.flatMap((objet) => (objet.depart === undefined ? [] : [objet.piece])));
  const garder = (option: OptionMenu, etatCourant: EtatPartie): boolean => {
    if (!elague) return true;
    if (!GESTES_UTILES.has(option.action)) return false;
    // Attendre ne sert qu'à laisser rouler ou tirer un drone en route (#270).
    if (option.action === 'attendre') return Object.values(etatCourant.drones?.phases ?? {}).some((phase) => ['trajet', 'roule', 'traction'].includes(phase));
    if (['envoyer', 'replacer', 'rearmer', 'reprendre_drone'].includes(option.action)) return utiles.has(option.commande.cible);
    if (option.action === 'fermer') return cabines.has(etatCourant.piece);
    if (option.action === 'prendre' || option.action === 'poser') return utiles.has(option.commande.cible);
    return true;
  };
  const rang = rangsDesMorceaux(monde);
  const verrous = etat.verrous?.length ?? 0;
  const avance = (e: EtatPartie): number =>
    1000 * (verrous - (e.verrous?.length ?? 0) + e.actives.length + Object.values(e.objets).filter((o) => o.type === 'installe').length) + rang(e.piece);
  const depart = { ...nouvellePartie(monde, { version: VERSION, graine: 1 }), etat: etatSansDangers(etat) };
  const vus = new Set([cleEtatRegles(depart.etat)]);
  // Tout état d'une recherche complète épuisée sans évacuation n'en mène à aucune : inutile d'y revenir.
  if (morts?.has(cleEtatRegles(depart.etat)) === true) return { verdict: 'aucune', etats: 0 };
  const seaux = new Map<number, { file: Partie[]; tete: number }>();
  const ranger = (partie: Partie): void => {
    const priorite = avance(partie.etat);
    const seau = seaux.get(priorite) ?? { file: [], tete: 0 };
    seau.file.push(partie);
    seaux.set(priorite, seau);
  };
  const prochain = (): Partie | undefined => {
    for (const priorite of [...seaux.keys()].sort((a, b) => b - a)) {
      const seau = seaux.get(priorite);
      if (seau !== undefined && seau.tete < seau.file.length) {
        const partie = seau.file[seau.tete];
        seau.file[seau.tete++] = undefined as unknown as Partie;
        return partie;
      }
    }
    return undefined;
  };
  ranger(depart);
  for (let partie = prochain(); partie !== undefined; partie = prochain()) {
    for (const option of observer(monde, partie.etat).menu) {
      if (!option.disponible || option.action === 'regarder' || !garder(option, partie.etat)) continue;
      const resultat = jouer(monde, partie, option.commande);
      if (resultat.type !== 'engagee') continue;
      if (resultat.partie.etat.fin === 'evacuation') return { verdict: 'evacuation', etats: vus.size };
      const etatSuivant = etatSansDangers(resultat.partie.etat);
      const cle = cleEtatRegles(etatSuivant);
      if (vus.has(cle) || morts?.has(cle) === true) continue;
      if (vus.size >= maxEtats) return { verdict: 'plafond', etats: vus.size };
      vus.add(cle);
      ranger({ ...resultat.partie, etat: etatSuivant, enregistrement: { ...resultat.partie.enregistrement, actions: [] }, derniers: [] });
    }
  }
  if (!elague && morts !== undefined) for (const cle of vus) morts.add(cle);
  return { verdict: 'aucune', etats: vus.size };
}

export interface RapportSortie {
  readonly station: string;
  readonly etats: number;
  readonly signaux: number;
  readonly ecarts: readonly string[];
  readonly secondes: number;
}

/** Hasard des parties : un générateur simple à graine fixe, pour des contrôles identiques d'une fois à l'autre. */
function hasard(graine: number): () => number {
  let x = graine >>> 0 || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

/**
 * `parties` parties au hasard de `actions` actions au plus ; chaque état distinct est comparé à la recherche complète. `pertes` :
 * à chaque pas, chaque pont perdu exprès dans chaque vide.
 */
export function verifierSortie(station: string, monde: DefMonde, parties = PARTIES_PAR_STATION, actions = ACTIONS_PAR_PARTIE, pertes = true): RapportSortie {
  const debut = performance.now();
  const verdicts = new Map<string, boolean>();
  const ecarts: string[] = [];
  let signaux = 0;
  const ponts = pertes ? monde.objets.filter((objet) => objet.pont === true) : [];
  const gouffres = monde.liaisons.filter((liaison) => liaison.gouffre === true);
  const morts = new Set<string>();
  const comparer = (etat: EtatPartie, ou: string): void => {
    const cle = cleEtatRegles(etat);
    if (verdicts.has(cle)) return;
    const { sansSortie } = observer(monde, etat);
    // Sans signal, un chemin trouvé parmi les gestes utiles suffit à le confirmer ; sinon, la recherche sur tous les gestes.
    const elaguee = sansSortie ? null : chercherEvacuation(monde, etat, { elague: true });
    const { verdict, etats } = elaguee?.verdict === 'evacuation' ? elaguee : chercherEvacuation(monde, etat, { morts });
    const ouverte = verdict === 'evacuation';
    verdicts.set(cle, ouverte);
    if (sansSortie) signaux++;
    if (verdict === 'plafond') ecarts.push(`${station} ${ou} : recherche au plafond (${etats} états).`);
    else if (sansSortie === ouverte) ecarts.push(`${station} ${ou} : signal ${sansSortie ? 'présent' : 'absent'}, recherche : ${verdict} (${etats} états).`);
  };
  for (let numero = 0; numero < parties; numero++) {
    const tirer = hasard(numero + 1);
    let partie = nouvellePartie(monde, { version: VERSION, graine: numero + 1 });
    let mort = false;
    for (let pas = 0; pas <= actions; pas++) {
      const observation = observer(monde, partie.etat);
      if (!observation.terminee) {
        const ou = `partie ${numero + 1} pas ${pas}`;
        comparer(partie.etat, ou);
        // Perte exprès : chaque pont encore là, tombé dans chaque vide, depuis le même état (G-03).
        for (const pont of ponts) {
          if (partie.etat.objets[pont.id]?.type === 'perdu') continue;
          for (const gouffre of gouffres) {
            comparer({ ...partie.etat, objets: { ...partie.etat.objets, [pont.id]: { type: 'perdu', liaison: gouffre.id } } }, `${ou}, ${pont.id} perdu`);
          }
        }
      }
      // Le signal ne se retire pas : une fois venu, il reste jusqu'à la fin de la partie (D-144).
      if (mort && !observation.sansSortie && !observation.terminee) ecarts.push(`${station} partie ${numero + 1} pas ${pas} : signal retiré.`);
      mort ||= observation.sansSortie;
      if (observation.terminee) break;
      // Au hasard, mais d'abord sans blessure, puis sans mourir, tant qu'un autre geste l'évite : les parties vont plus loin.
      const options = observation.menu.filter((option) => option.disponible && option.action !== 'regarder');
      let suite: Partie | undefined;
      let repli: Partie | undefined;
      while (options.length > 0 && suite === undefined) {
        const [option] = options.splice(Math.floor(tirer() * options.length), 1);
        if (option === undefined) break;
        const resultat = jouer(monde, partie, option.commande);
        if (resultat.type !== 'engagee') throw new Error(`${station} : option du menu refusée.`);
        if (resultat.partie.etat.sante === partie.etat.sante) suite = resultat.partie;
        else if (repli === undefined || (repli.etat.sante === 'vaincu' && resultat.partie.etat.sante !== 'vaincu')) repli = resultat.partie;
      }
      suite ??= repli;
      if (suite === undefined) break;
      partie = { ...suite, enregistrement: { ...suite.enregistrement, actions: [] }, derniers: [] };
    }
  }
  return { station, etats: verdicts.size, signaux, ecarts, secondes: (performance.now() - debut) / 1000 };
}

async function principal(): Promise<void> {
  const argumentsCli = process.argv.slice(2);
  const demandes = argumentsCli.filter((argument) => !argument.startsWith('--'));
  const { lot, parts, reste } = lireOptionsLots(argumentsCli);
  const debut = performance.now();
  if (parts > 1) {
    const sorties = await lancerSousLots(fileURLToPath(import.meta.url), lot, parts, reste);
    for (const { sortie, erreurs } of sorties) {
      process.stdout.write(sortie);
      process.stderr.write(erreurs);
    }
    const echecs = sorties.filter(({ code }) => code !== 0).length;
    console.error(`check:sortie : lot ${lot.numero}/${lot.total} en ${parts} processus, ${((performance.now() - debut) / 1000).toFixed(1)} s${echecs > 0 ? `, ${echecs} processus en échec` : ''}.`);
    if (echecs > 0) process.exitCode = 1;
    return;
  }
  const echantillon = demandes.length > 0 ? [] : echantillonGrandes(CATALOGUE);
  const couvre = new Map(echantillon.map((grande) => [grande.station, grande.couvre]));
  const stations = dansLeLot(demandes.length > 0 ? demandes : [...MONDES_DE_REFERENCE, ...COMPOSITIONS_PUBLIEES, ...couvre.keys()], lot);
  let ecarts = 0;
  for (const id of stations) {
    const reference = CATALOGUE.mondes[id];
    const grande = CATALOGUE.publiees.includes(id);
    const station = reference ?? (grande ? CATALOGUE.resoudre(id) : stationDeReference(CATALOGUE, id));
    if ('refus' in station) throw new Error(station.refus);
    // Sans perte exprès dans une grande station : un pont perdu avant le vide laisse tout le début de la station à épuiser,
    // au-delà de 1,5 million d'états pour la recherche complète.
    const rapport = verifierSortie(id, 'entree' in station ? station.entree.monde : station.monde, PARTIES_PAR_STATION, ACTIONS_PAR_PARTIE, !grande);
    console.log(JSON.stringify({ station: id, couvre: couvre.get(id), etats: rapport.etats, signaux: rapport.signaux, secondes: Number(rapport.secondes.toFixed(2)) }));
    for (const ecart of rapport.ecarts) console.error(ecart);
    ecarts += rapport.ecarts.length;
  }
  console.error(`check:sortie : lot ${lot.numero}/${lot.total}, ${stations.length} stations, ${ecarts} écart(s).`);
  if (ecarts > 0) process.exitCode = 1;
}

if (isMainModule(import.meta.url)) {
  principal().catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? erreur.stack ?? erreur.message : String(erreur));
    process.exitCode = 1;
  });
}
