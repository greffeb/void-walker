import { assemblerStation, jouer, nouvellePartie, observer, type DefStation } from '../engine';
import { GRAINE_GRANDE_MAX, numeroter, type Catalogue, type EntreeMonde, type EtapeParcours } from '../content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOGUE } from './catalogue';
import { controlerGrande } from './controles-grande';
import { dansLeLot, type Lot } from './lots';
import { REPO_ROOT } from './repo-files';
import { trouverOption } from './rejouer-parcours';
import { capsuleCoupee, ordreImpose, verifierStation, type OptionsVerification, type RapportStation } from './verifier-station';

// Preuve d'une grande station (spec 2026-10-18 §7, D-303) : les contrôles structurels d'abord, puis une évacuation sans dé ni
// blessure par les vraies règles. Le chemin principal seul se prouve vite ; son témoin, rejoué dans la grande station, en est
// une preuve s'il mène encore à l'évacuation (§7.4). Sinon, la recherche se fait dans la grande station elle-même. En ordre
// libre, les deux ordres de préparation sont prouvés, et chaque cloison coupe la capsule (G-07, G-08).

const VERSION = 'verifier-grandes';
const GRAINE = 20261010;

export interface LigneGrande {
  readonly station: string;
  readonly verdict: RapportStation['verdict'] | 'ecartee';
  readonly ecarts: readonly string[];
  readonly etats: number;
  readonly secondes: number;
  /** Longueur du témoin du premier ordre ; `null` sans preuve. */
  readonly actions: number | null;
  /** Témoin du chemin principal rejoué, ou recherche dans la grande station. */
  readonly methode: 'temoin' | 'recherche' | null;
  /** Ordre libre : verdict de chaque ordre de préparation. */
  readonly ordres?: readonly [RapportStation['verdict'], RapportStation['verdict']];
  /** Témoins de la preuve, un par ordre de préparation, à publier avec la station ; `null` sans preuve. */
  readonly temoins: readonly (readonly PasTemoin[])[] | null;
}

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

/** Le témoin, rejoué par le menu public avec les vraies règles, mène à l'évacuation sans dé ni blessure. */
export function temoinValable(entree: EntreeMonde, etapes: readonly EtapeParcours[]): boolean {
  let partie = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  for (const etape of etapes) {
    const option = trouverOption(observer(entree.monde, partie.etat), etape);
    if (option === undefined || !option.disponible) return false;
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee' || resultat.tirages.length > 0 || resultat.partie.etat.sante !== 'indemne') return false;
    partie = resultat.partie;
  }
  return partie.etat.fin === 'evacuation';
}

interface Preuve {
  readonly verdict: RapportStation['verdict'];
  readonly etats: number;
  readonly actions: number | null;
  readonly methode: 'temoin' | 'recherche';
  readonly temoin: readonly PasTemoin[] | null;
}

/** Preuve d'un ordre : le témoin du chemin principal rejoué, sinon la recherche dans la grande station. */
function prouver(
  entree: EntreeMonde,
  base: EntreeMonde,
  options: OptionsVerification,
  ordre: (monde: EntreeMonde['monde']) => Pick<OptionsVerification, 'admissible' | 'priorite'>,
): Preuve {
  const principal = verifierStation(base, { ...options, ...ordre(base.monde) });
  if (principal.verdict === 'prouvee' && principal.parcours !== null && temoinValable(entree, principal.parcours.etapes)) {
    return { verdict: 'prouvee', etats: principal.etats, actions: principal.parcours.etapes.length, methode: 'temoin', temoin: compacter(principal.parcours.etapes) };
  }
  const directe = verifierStation(entree, { ...options, ...ordre(entree.monde) });
  return { verdict: directe.verdict, etats: principal.etats + directe.etats, actions: directe.parcours?.etapes.length ?? null, methode: 'recherche', temoin: directe.parcours === null ? null : compacter(directe.parcours.etapes) };
}

/** Le chemin principal seul d'une grande station : sans annexes ni boucles, aux mêmes identifiants et aux mêmes noms. */
export function cheminPrincipal(entree: EntreeMonde, definition: DefStation): EntreeMonde | null {
  const assemblee = assemblerStation({ ...definition, grande: undefined });
  return assemblee.type === 'station' ? numeroter({ monde: assemblee.monde, textes: entree.textes, parcours: [] }) : null;
}

/** Une grande station `g1-…-<graine>`, contrôlée puis prouvée. */
export function verifierGrande(catalogue: Catalogue, station: string, options: OptionsVerification = {}): LigneGrande {
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

  const cloisons = entree.monde.liaisons.filter((liaison) => liaison.verrouillee === true).map((liaison) => liaison.id);
  if (cloisons.length === 0) {
    const preuve = prouver(entree, base, options, () => ({}));
    return conclure({ verdict: preuve.verdict, ecarts: [], etats: preuve.etats, actions: preuve.actions, methode: preuve.methode, temoins: preuve.temoin === null ? null : [preuve.temoin] });
  }
  const [premiere, seconde] = cloisons;
  if (premiere === undefined || seconde === undefined || cloisons.length !== 2) return conclure({ verdict: 'ecartee', ecarts: ['Deux cloisons verrouillées attendues.'], etats: 0, actions: null, methode: null, temoins: null });
  if (!cloisons.every((cloison) => capsuleCoupee(entree.monde, cloison))) {
    return conclure({ verdict: 'sans_sortie_sure', ecarts: ['Une cloison verrouillée ne coupe pas l’accès à la capsule (G-08).'], etats: 0, actions: null, methode: null, temoins: null });
  }
  const [ab, ba] = [prouver(entree, base, options, (monde) => ordreImpose(monde, premiere, seconde)), prouver(entree, base, options, (monde) => ordreImpose(monde, seconde, premiere))];
  const ordres = [ab.verdict, ba.verdict] as const;
  const verdict = ab.verdict === 'prouvee' && ba.verdict === 'prouvee' ? 'prouvee' : ab.verdict === 'prouvee' ? ba.verdict : ab.verdict;
  const methode = ab.methode === 'recherche' || ba.methode === 'recherche' ? 'recherche' : 'temoin';
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
 * partir de 0 et jusqu'à `essais`, assemblées, contrôlées et prouvées ; triées, avec leurs témoins.
 */
export function publierGrandes(
  catalogue: Catalogue,
  parComposition: number,
  essais = 12,
  options: OptionsVerification = {},
  journal: (ligne: LigneGrande) => void = () => undefined,
  compositions: readonly string[] = catalogue.grandes.filter((candidate) => candidate.refus === null).map((candidate) => candidate.id),
): Publication {
  const temoins: Record<string, readonly (readonly PasTemoin[])[]> = {};
  for (const composition of compositions) {
    let trouvees = 0;
    // Une graine sans plan (annexes sans place, aucune boucle) ne coûte presque rien : elle ne compte pas parmi les essais.
    for (let graine = 0, essayees = 0; graine <= GRAINE_GRANDE_MAX && essayees < essais && trouvees < parComposition; graine++) {
      if ('refus' in catalogue.construireGrande(composition, graine)) continue;
      essayees++;
      const ligne = verifierGrande(catalogue, `${composition}-${graine}`, options);
      journal(ligne);
      if (ligne.verdict === 'prouvee' && ligne.temoins !== null) {
        temoins[ligne.station] = ligne.temoins;
        trouvees++;
      }
    }
  }
  return { publiees: Object.keys(temoins).sort(), temoins };
}

/**
 * Une grande station publiée, vérifiée vite (spec §7.4) : contrôles structurels, puis rejeu de ses témoins publiés avec les vraies
 * règles ; en ordre libre, un témoin par ordre de préparation, et chaque cloison coupe la capsule (G-07, G-08).
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
  const levees = temoins.map((pas) => rejouerTemoin(entree, pas));
  if (levees.some((ordre) => ordre === null)) return conclure('non_prouvee', ['Témoin publié qui ne mène plus à l’évacuation : relancer npm run publier:grandes.']);
  const cloisons = entree.monde.liaisons.filter((liaison) => liaison.verrouillee === true).map((liaison) => liaison.id);
  if (cloisons.length === 0) return conclure('prouvee', []);
  if (!cloisons.every((cloison) => capsuleCoupee(entree.monde, cloison))) return conclure('sans_sortie_sure', ['Une cloison verrouillée ne coupe pas l’accès à la capsule (G-08).']);
  const premieres = new Set(levees.map((ordre) => ordre?.[0]));
  return premieres.size === cloisons.length ? conclure('prouvee', []) : conclure('non_prouvee', ['Ordre libre : un témoin par ordre de préparation attendu (G-07).']);
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
