import { assemblerStation, jouer, nouvellePartie, observer, type DefStation, type Partie } from '../engine';
import { GRAINE_GRANDE_MAX, numeroter, type Catalogue, type EntreeMonde, type EtapeParcours } from '../content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOGUE } from './catalogue';
import { controlerGrande } from './controles-grande';
import { dansLeLot, type Lot } from './lots';
import { REPO_ROOT } from './repo-files';
import { trouverOption } from './rejouer-parcours';
import { capsuleCoupee, chercherJusqua, cloisonsDuCarrefour, ordreImpose, verifierStation, type OptionsVerification, type RapportStation } from './verifier-station';

// Preuve d'une grande station (spec 2026-10-18 §7, D-326) : les contrôles structurels d'abord, puis une évacuation sans dé ni
// blessure par les vraies règles, sur la station privée de son butin (§7.4). Le chemin principal seul se prouve vite ; son
// témoin, rejoué dans la grande station, en est une preuve s'il mène encore à l'évacuation, tel quel ou réparé d'un détour vers
// chaque clé déplacée. Sinon, la recherche se fait dans la grande station elle-même. En ordre libre, les deux ordres de
// préparation sont prouvés, et chaque cloison coupe la capsule (G-07, G-08).

const VERSION = 'verifier-grandes';
const GRAINE = 20261010;
/** États d'une réparation, par étape du témoin devenue impossible. */
const MAX_REPARATION = 20_000;

export interface LigneGrande {
  readonly station: string;
  readonly verdict: RapportStation['verdict'] | 'ecartee';
  readonly ecarts: readonly string[];
  readonly etats: number;
  readonly secondes: number;
  /** Longueur du témoin du premier ordre ; `null` sans preuve. */
  readonly actions: number | null;
  /**
   * Témoin publié rejoué, témoin du chemin principal rejoué tel quel ou réparé, ou recherche dans la grande station ; en ordre
   * libre, la plus coûteuse des deux. `null` sans preuve tentée, ou quand la recherche directe a été remise à plus tard.
   */
  readonly methode: Methode | null;
  /** Ordre libre : verdict de chaque ordre de préparation. */
  readonly ordres?: readonly [RapportStation['verdict'], RapportStation['verdict']];
  /** Témoins de la preuve, un par ordre de préparation, à publier avec la station ; `null` sans preuve. */
  readonly temoins: readonly (readonly PasTemoin[])[] | null;
}

type Methode = 'publie' | 'temoin' | 'repare' | 'recherche';

/** Un pas de témoin, par identifiants publics : action, cible, paramètre éventuel. */
export type PasTemoin = readonly [action: string, cible: string, parametre?: string];

const compacter = (etapes: readonly EtapeParcours[]): PasTemoin[] =>
  etapes.map((etape) => (etape.parametreId === undefined ? [etape.action, etape.cibleId ?? ''] : [etape.action, etape.cibleId ?? '', etape.parametreId]));

/**
 * Rejeu d’un témoin publié par le menu public, avec les vraies règles (spec §7.4) : il mène à l’évacuation sans dé ni blessure.
 * Rend l’ordre dans lequel les cloisons verrouillées ont été levées, ou `null` si ce n’est pas une preuve.
 */
export function rejouerTemoin(entree: EntreeMonde, pas: readonly PasTemoin[]): string[] | null {
  let partie = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  const levees: string[] = [];
  for (const [action, cible, parametre] of pas) {
    const option = observer(entree.monde, partie.etat).menu.find(
      (candidate) => candidate.action === action && candidate.cible.id === cible && (parametre === undefined ? candidate.parametre === undefined : candidate.parametre?.id === parametre),
    );
    if (option === undefined || !option.disponible) return null;
    const avant = partie.etat.verrous ?? [];
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee' || resultat.tirages.length > 0 || resultat.partie.etat.sante !== 'indemne') return null;
    partie = resultat.partie;
    levees.push(...avant.filter((cloison) => !(partie.etat.verrous ?? []).includes(cloison)));
  }
  return partie.etat.fin === 'evacuation' ? levees : null;
}

/** L'étape jouée par le menu public, engagée sans dé ni blessure ; `null` sinon. */
function jouerSurement(entree: EntreeMonde, partie: Partie, etape: EtapeParcours): Partie | null {
  const option = trouverOption(observer(entree.monde, partie.etat), etape);
  if (option === undefined || !option.disponible) return null;
  const resultat = jouer(entree.monde, partie, option.commande);
  return resultat.type !== 'engagee' || resultat.tirages.length > 0 || resultat.partie.etat.sante !== 'indemne' ? null : resultat.partie;
}

/** Le témoin, rejoué par le menu public avec les vraies règles, mène à l'évacuation sans dé ni blessure. */
export function temoinValable(entree: EntreeMonde, etapes: readonly EtapeParcours[]): boolean {
  let partie: Partie | null = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  for (const etape of etapes) {
    partie = jouerSurement(entree, partie, etape);
    if (partie === null) return false;
  }
  return partie.etat.fin === 'evacuation';
}

/** Monde sans son butin, même id : la preuve se fait là (spec §7.4). */
export function sansButin(entree: EntreeMonde): EntreeMonde {
  return { ...entree, monde: { ...entree.monde, objets: entree.monde.objets.filter((objet) => objet.butin !== true) } };
}

/**
 * Témoin du chemin principal rejoué ; chaque étape impossible est précédée des gestes trouvés par chercherJusqua (but : l'étape
 * devient jouable sans dé ni blessure), au plus 20 000 états par réparation. En ordre libre, `admissible` garde l'ordre imposé
 * (G-07). `null` si une réparation échoue ou si le témoin ne mène pas à l'évacuation.
 */
export function reparerTemoin(entree: EntreeMonde, etapes: readonly EtapeParcours[], options: Pick<OptionsVerification, 'admissible'> = {}): readonly EtapeParcours[] | null {
  const admissible = options.admissible ?? (() => true);
  let partie = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  const repare: EtapeParcours[] = [];
  for (const etape of etapes) {
    const depart = partie;
    // En largeur, le détour le plus court : la priorité au segment le plus avancé s'éloigne d'une clé laissée en arrière.
    // Vide quand l'étape est jouable telle quelle.
    const detour = chercherJusqua(entree, depart, (etat) => jouerSurement(entree, { ...depart, etat }, etape) !== null, MAX_REPARATION, { ...options, priorite: () => 0 });
    if (detour === null) return null;
    for (const geste of [...detour, etape]) {
      const suite = jouerSurement(entree, partie, geste);
      if (suite === null || !admissible(suite.etat)) return null;
      partie = suite;
      repare.push(geste);
    }
  }
  return partie.etat.fin === 'evacuation' ? repare : null;
}

interface Preuve {
  readonly verdict: RapportStation['verdict'];
  readonly etats: number;
  readonly actions: number | null;
  /** `null` : témoin inutilisable et recherche directe remise à plus tard. */
  readonly methode: Methode | null;
  readonly temoin: readonly PasTemoin[] | null;
}

/**
 * Preuve d'un ordre, sur la station privée de son butin (`entree`) : le témoin du chemin principal rejoué tel quel, sinon
 * réparé, sinon, si `directe`, la recherche dans la grande station.
 */
function prouver(
  entree: EntreeMonde,
  base: EntreeMonde,
  options: OptionsVerification,
  ordre: (monde: EntreeMonde['monde']) => Pick<OptionsVerification, 'admissible' | 'priorite'>,
  directe: boolean,
): Preuve {
  const principal = verifierStation(base, { ...options, ...ordre(base.monde) });
  const etapes = principal.verdict === 'prouvee' ? principal.parcours?.etapes ?? null : null;
  const repare = etapes === null ? null : reparerTemoin(entree, etapes, { admissible: ordre(entree.monde).admissible });
  if (etapes !== null && repare !== null) {
    return { verdict: 'prouvee', etats: principal.etats, actions: repare.length, methode: repare.length === etapes.length ? 'temoin' : 'repare', temoin: compacter(repare) };
  }
  if (!directe) return { verdict: 'non_prouvee', etats: principal.etats, actions: null, methode: null, temoin: null };
  const recherche = verifierStation(entree, { ...options, ...ordre(entree.monde) });
  return { verdict: recherche.verdict, etats: principal.etats + recherche.etats, actions: recherche.parcours?.etapes.length ?? null, methode: 'recherche', temoin: recherche.parcours === null ? null : compacter(recherche.parcours.etapes) };
}

/** Le chemin principal seul d'une grande station : sans annexes ni boucles, aux mêmes identifiants et aux mêmes noms. */
export function cheminPrincipal(entree: EntreeMonde, definition: DefStation): EntreeMonde | null {
  const assemblee = assemblerStation({ ...definition, grande: undefined });
  return assemblee.type === 'station' ? numeroter({ monde: assemblee.monde, textes: entree.textes, parcours: [] }) : null;
}

/** Une grande station `g1-…-<graine>`, contrôlée puis prouvée ; sans `directe`, par les témoins du chemin principal seulement. */
export function verifierGrande(catalogue: Catalogue, station: string, options: OptionsVerification = {}, directe = true): LigneGrande {
  const debut = performance.now();
  const tiret = station.lastIndexOf('-');
  const composition = station.slice(0, tiret);
  const graine = Number(station.slice(tiret + 1));
  const conclure = (ligne: Omit<LigneGrande, 'station' | 'secondes'>): LigneGrande => ({ station, ...ligne, secondes: (performance.now() - debut) / 1000 });
  const entree = catalogue.construireGrande(composition, graine);
  const definition: DefStation | { readonly refus: string } = catalogue.definirGrande(composition, graine);
  if ('refus' in entree) return conclure({ verdict: 'non_prouvee', ecarts: [entree.refus], etats: 0, actions: null, methode: null, temoins: null });
  if ('refus' in definition) return conclure({ verdict: 'non_prouvee', ecarts: [definition.refus], etats: 0, actions: null, methode: null, temoins: null });
  const ecarts = controlerGrande(entree, definition);
  if (ecarts.length > 0) return conclure({ verdict: 'ecartee', ecarts, etats: 0, actions: null, methode: null, temoins: null });
  const base = cheminPrincipal(entree, definition);
  if (base === null) return conclure({ verdict: 'non_prouvee', ecarts: ['Chemin principal non assemblé.'], etats: 0, actions: null, methode: null, temoins: null });
  const prive = sansButin(entree);

  const cloisons = cloisonsDuCarrefour(entree.monde);
  if (cloisons.length === 0) {
    const preuve = prouver(prive, base, options, () => ({}), directe);
    return conclure({ verdict: preuve.verdict, ecarts: [], etats: preuve.etats, actions: preuve.actions, methode: preuve.methode, temoins: preuve.temoin === null ? null : [preuve.temoin] });
  }
  const [premiere, seconde] = cloisons;
  if (premiere === undefined || seconde === undefined || cloisons.length !== 2) return conclure({ verdict: 'ecartee', ecarts: ['Deux cloisons verrouillées attendues.'], etats: 0, actions: null, methode: null, temoins: null });
  if (!cloisons.every((cloison) => capsuleCoupee(entree.monde, cloison))) {
    return conclure({ verdict: 'sans_sortie_sure', ecarts: ['Une cloison verrouillée ne coupe pas l’accès à la capsule (G-08).'], etats: 0, actions: null, methode: null, temoins: null });
  }
  const ab = prouver(prive, base, options, (monde) => ordreImpose(monde, premiere, seconde), directe);
  // Le premier ordre sans preuve condamne la graine : le second, jusqu'au plafond, ne changerait rien (#237).
  if (ab.verdict !== 'prouvee') return conclure({ verdict: ab.verdict, ecarts: [], etats: ab.etats, actions: null, methode: ab.methode, temoins: null });
  const ba = prouver(prive, base, options, (monde) => ordreImpose(monde, seconde, premiere), directe);
  const ordres = [ab.verdict, ba.verdict] as const;
  const verdict = ab.verdict === 'prouvee' && ba.verdict === 'prouvee' ? 'prouvee' : ab.verdict === 'prouvee' ? ba.verdict : ab.verdict;
  const methode = ab.methode === null || ba.methode === null ? null : ((['recherche', 'repare'] as const).find((candidate) => ab.methode === candidate || ba.methode === candidate) ?? 'temoin');
  const temoins = ab.temoin === null || ba.temoin === null ? null : [ab.temoin, ba.temoin];
  return conclure({ verdict, ecarts: [], etats: ab.etats + ba.etats, actions: ab.actions, methode, ordres, temoins });
}

/** Grandes stations publiées et leurs témoins (spec §7.2). */
export interface Publication {
  readonly publiees: readonly string[];
  readonly temoins: Readonly<Record<string, readonly (readonly PasTemoin[])[]>>;
}

/**
 * Grandes stations à publier (spec §7.2) : pour chaque grande composition sans refus, les `parComposition` premières graines, à
 * partir de 0 et jusqu'à `essais`, assemblées, contrôlées et prouvées ; triées, avec leurs témoins. Accélérations (#237) : un
 * témoin de `publies` qui se rejoue encore (comme dans `check:stations`) garde sa station sans recherche ; les graines sont
 * d'abord prouvées par le témoin du chemin principal, et la recherche directe ne sert qu'aux graines restées sans preuve, s'il
 * manque des stations.
 */
export function publierGrandes(
  catalogue: Catalogue,
  parComposition: number,
  essais = 12,
  options: OptionsVerification = {},
  journal: (ligne: LigneGrande) => void = () => undefined,
  compositions: readonly string[] = catalogue.grandes.filter((candidate) => candidate.refus === null).map((candidate) => candidate.id),
  publies: Temoins = {},
): Publication {
  const temoins: Record<string, readonly (readonly PasTemoin[])[]> = {};
  for (const composition of compositions) {
    let trouvees = 0;
    const garder = (ligne: LigneGrande): void => {
      journal(ligne);
      if (ligne.verdict === 'prouvee' && ligne.temoins !== null) {
        temoins[ligne.station] = ligne.temoins;
        trouvees++;
      }
    };
    for (const [station, preuve] of Object.entries(publies)) {
      if (trouvees < parComposition && station.slice(0, station.lastIndexOf('-')) === composition) garder({ ...verifierPubliee(catalogue, station, preuve), methode: 'publie' });
    }
    const differees: string[] = [];
    // Une graine sans plan (annexes sans place, aucune boucle) ne coûte presque rien : elle ne compte pas parmi les essais.
    for (let graine = 0, essayees = 0; graine <= GRAINE_GRANDE_MAX && essayees < essais && trouvees < parComposition; graine++) {
      if ('refus' in catalogue.construireGrande(composition, graine)) continue;
      essayees++;
      const station = `${composition}-${graine}`;
      if (station in temoins) continue;
      const ligne = verifierGrande(catalogue, station, options, false);
      if (ligne.verdict === 'non_prouvee' && ligne.methode === null && ligne.ecarts.length === 0) differees.push(station);
      else garder(ligne);
    }
    for (const station of differees) if (trouvees < parComposition) garder(verifierGrande(catalogue, station, options));
  }
  return { publiees: Object.keys(temoins).sort(), temoins };
}

/**
 * Une grande station publiée, vérifiée vite (spec §7.4) : contrôles structurels, puis rejeu de ses témoins publiés avec les vraies
 * règles, sur la station privée de son butin comme la preuve, puis sur la station complète, butin compris, que le joueur
 * parcourt ; en ordre libre, un témoin par ordre de préparation, et chaque cloison coupe la capsule (G-07, G-08).
 */
export function verifierPubliee(catalogue: Catalogue, station: string, temoins: readonly (readonly PasTemoin[])[] | undefined): LigneGrande {
  const debut = performance.now();
  const tiret = station.lastIndexOf('-');
  const composition = station.slice(0, tiret);
  const graine = Number(station.slice(tiret + 1));
  const conclure = (verdict: LigneGrande['verdict'], ecarts: readonly string[]): LigneGrande => ({
    station, verdict, ecarts, etats: 0, secondes: (performance.now() - debut) / 1000, actions: temoins?.[0]?.length ?? null, methode: 'temoin', temoins: temoins ?? null,
  });
  const entree = catalogue.construireGrande(composition, graine);
  const definition = catalogue.definirGrande(composition, graine);
  if ('refus' in entree) return conclure('non_prouvee', [entree.refus]);
  if ('refus' in definition) return conclure('non_prouvee', [definition.refus]);
  const ecarts = controlerGrande(entree, definition);
  if (ecarts.length > 0) return conclure('ecartee', ecarts);
  if (temoins === undefined || temoins.length === 0) return conclure('non_prouvee', ['Témoin absent : relancer npm run publier:grandes.']);
  const rejeux = [sansButin(entree), entree].map((monde) => temoins.map((pas) => rejouerTemoin(monde, pas)));
  if (rejeux.some((levees) => levees.some((ordre) => ordre === null))) return conclure('non_prouvee', ['Témoin publié qui ne mène plus à l’évacuation, avec ou sans le butin : relancer npm run publier:grandes.']);
  const cloisons = cloisonsDuCarrefour(entree.monde);
  if (cloisons.length === 0) return conclure('prouvee', []);
  if (!cloisons.every((cloison) => capsuleCoupee(entree.monde, cloison))) return conclure('sans_sortie_sure', ['Une cloison verrouillée ne coupe pas l’accès à la capsule (G-08).']);
  // Le premier verrou levé du carrefour dit l'ordre ; la porte blindée de M-11, levée en route, n'en dit rien.
  const ordresDistincts = rejeux.every((levees) => new Set(levees.map((ordre) => ordre?.find((cloison) => cloisons.includes(cloison)))).size === cloisons.length);
  return ordresDistincts ? conclure('prouvee', []) : conclure('non_prouvee', ['Ordre libre : un témoin par ordre de préparation attendu (G-07).']);
}

/** Témoins des grandes stations publiées, écrits par `npm run publier:grandes` et rejoués par `check:stations`. */
export const FICHIER_TEMOINS = 'tools/grandes-temoins.json';

export type Temoins = Readonly<Record<string, readonly (readonly PasTemoin[])[]>>;

/** Témoins publiés, par station ; vide si le fichier manque. */
export function lireTemoins(racine = REPO_ROOT): Temoins {
  try {
    return JSON.parse(readFileSync(join(racine, FICHIER_TEMOINS), 'utf8')) as Temoins;
  } catch {
    return {};
  }
}

/** `check:stations` : les grandes stations publiées du lot, vérifiées par le rejeu de leurs témoins. */
export function verifierPublieesDuLot(lot: Lot, catalogue: Catalogue = CATALOGUE, temoins: Temoins = lireTemoins()): LigneGrande[] {
  return dansLeLot(catalogue.publiees, lot).map((station) => verifierPubliee(catalogue, station, temoins[station]));
}

/** Ce qui fait échouer `check:stations` : une grande station publiée qui n'est plus prouvée. */
export function ecartsDesGrandes(lignes: readonly LigneGrande[]): string[] {
  return lignes.filter((ligne) => ligne.verdict !== 'prouvee').map((ligne) => `Grande station publiée ${ligne.station} non prouvée (${ligne.verdict}) : ${ligne.ecarts.join(' ')}`);
}
