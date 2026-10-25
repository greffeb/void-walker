import { assemblerStation, empreinte, jouer, menu, nouvellePartie, observer, type DefStation, type Partie } from '../engine';
import { GRAINE_GRANDE_MAX, numeroter, type Catalogue, type EntreeMonde, type EtapeParcours } from '../content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOGUE } from './catalogue';
import { controlerGrande } from './controles-grande';
import { dansLeLot, type Lot } from './lots';
import { REPO_ROOT } from './repo-files';
import { trouverOption } from './rejouer-parcours';
import { capsuleCoupee, cloisonsDuCarrefour, type RapportStation } from './verifier-station';
import { construireTemoin } from './construire-temoin';
import { actualiserVersionGrande, transposerTemoins } from './temoins-portables';

// Chaque station est contrôlée puis accompagnée d'un parcours construit, rejoué avec les vraies règles, sans dé ni
// blessure, avec et sans butin (D-326). En ordre libre, un parcours par ordre ; aucune recherche globale d'états.

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
  /** Preuve publiée rejouée ou parcours construit ; `null` si aucun parcours n'a abouti. */
  readonly methode: Methode | null;
  /** Ordre libre : verdict de chaque ordre de préparation. */
  readonly ordres?: readonly [RapportStation['verdict'], RapportStation['verdict']];
  /** Témoins de la preuve, un par ordre de préparation, à publier avec la station ; `null` sans preuve. */
  readonly temoins: readonly (readonly PasTemoin[])[] | null;
}

type Methode = 'publie' | 'construit';

/** Un pas de témoin, par identifiants publics : action, cible, paramètre éventuel. */
export type PasTemoin = readonly [action: string, cible: string, parametre?: string];


/**
 * Rejeu d’un témoin publié par le menu public, avec les vraies règles (spec §7.4) : il mène à l’évacuation sans dé ni blessure.
 * Rend l’ordre dans lequel les cloisons verrouillées ont été levées, ou `null` si ce n’est pas une preuve.
 */
export function rejouerTemoin(avecErrance: EntreeMonde, pas: readonly PasTemoin[]): string[] | null {
  const entree = sansErrance(avecErrance);
  let partie = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  const levees: string[] = [];
  for (const [action, cible, parametre] of pas) {
    const option = menu(entree.monde, partie.etat).find(
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
export function temoinValable(avecErrance: EntreeMonde, etapes: readonly EtapeParcours[]): boolean {
  const entree = sansErrance(avecErrance);
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

/** Monde sans son dé de rencontre : la preuve se fait sans errance de la créature (spec créature mobile §preuve). */
export function sansErrance(entree: EntreeMonde): EntreeMonde {
  const monde = { ...entree.monde };
  delete monde.rencontre;
  return { ...entree, monde };
}


/** Le chemin principal seul d'une grande station : sans annexes ni boucles, aux mêmes identifiants et aux mêmes noms. */
export function cheminPrincipal(entree: EntreeMonde, definition: DefStation): EntreeMonde | null {
  const assemblee = assemblerStation({ ...definition, grande: undefined });
  return assemblee.type === 'station' ? numeroter({ monde: assemblee.monde, textes: entree.textes, parcours: [] }) : null;
}

/** Construit une évacuation, puis la vérifie intégralement ; deux parcours en ordre libre (G-07, G-08). */
export function verifierGrande(catalogue: Catalogue, station: string): LigneGrande {
  const debut = performance.now();
  const tiret = station.lastIndexOf('-');
  const entree = catalogue.construireGrande(station.slice(0, tiret), Number(station.slice(tiret + 1)));
  const echouer = (ecart: string): LigneGrande => ({ station, verdict: 'non_prouvee', ecarts: [ecart], etats: 0, secondes: (performance.now() - debut) / 1000, actions: null, methode: null, temoins: null });
  if ('refus' in entree) return echouer(entree.refus);
  const definition = catalogue.definirGrande(station.slice(0, tiret), Number(station.slice(tiret + 1)));
  if ('refus' in definition) return echouer(definition.refus);
  const ecarts = controlerGrande(entree, definition);
  if (ecarts.length > 0) return { ...echouer(ecarts.join(' ')), verdict: 'ecartee', ecarts };
  const prive = sansErrance(sansButin(entree));
  const cloisons = cloisonsDuCarrefour(prive.monde);
  if (cloisons.length !== 0 && cloisons.length !== 2) return echouer('Deux cloisons verrouillées attendues.');
  if (!cloisons.every((cloison) => capsuleCoupee(prive.monde, cloison))) return { ...echouer('Une cloison verrouillée ne coupe pas l’accès à la capsule (G-08).'), verdict: 'sans_sortie_sure' };
  const ordres = cloisons.length === 0 ? [undefined] : [cloisons, [...cloisons].reverse()];
  const temoins: (readonly PasTemoin[])[] = [];
  for (const ordre of ordres) {
    const temoin = construireTemoin(prive, ordre);
    if (temoin === null) return echouer(`Parcours sûr non construit${ordre === undefined ? '' : ` pour l’ordre ${ordre.join(' puis ')}`}.`);
    temoins.push(temoin);
  }
  const resultat = verifierCertificat(entree, temoins);
  return { station, ...resultat, etats: 0, secondes: (performance.now() - debut) / 1000, actions: temoins[0]?.length ?? null, methode: 'construit', temoins, ...(cloisons.length === 2 && resultat.verdict === 'prouvee' ? { ordres: ['prouvee', 'prouvee'] as const } : {}) };
}

/** Grandes stations publiées et leurs témoins (spec §7.2). */
export interface Publication {
  readonly publiees: readonly string[];
  readonly temoins: Readonly<Record<string, readonly (readonly PasTemoin[])[]>>;
  /** Compositions restées sans station, recherchées ou passées. */
  readonly sansStation: SansStation;
}

/**
 * Compositions sans station (#237) : l'empreinte de leur définition (morceaux, catalogue de pièces, butin, documents) et du
 * moteur, et les graines essayées. Tant qu'elles ne changent pas, la publication ne les recherche plus.
 */
export type SansStation = Readonly<Record<string, { readonly empreinte: string; readonly essais: number }>>;

/** Empreinte d'une grande composition : sa définition, graine et identifiant mis à part, et le code du moteur. */
export function empreinteComposition(catalogue: Catalogue, composition: string, moteur: string): string {
  const definition = catalogue.definirGrande(composition, 0);
  return empreinte(['refus' in definition ? definition : { ...definition, id: '', graine: 0 }, moteur]);
}

/** Réutilise les certificats encore valables, sinon construit les parcours des premières graines assemblables. */
export function publierGrandes(
  catalogue: Catalogue,
  parComposition: number,
  essais = 12,
  journal: (ligne: LigneGrande) => void = () => undefined,
  compositions: readonly string[] = catalogue.grandes.filter((candidate) => candidate.refus === null).map((candidate) => candidate.id),
  publies: Temoins = {},
  connues: SansStation = {},
  moteur = '',
): Publication {
  const temoins: Record<string, readonly (readonly PasTemoin[])[]> = {};
  const sansStation: Record<string, SansStation[string]> = {};
  const certificats = new Map<string, [string, Temoins[string]][]>();
  for (const [station, preuve] of Object.entries(publies)) {
    const composition = actualiserVersionGrande(station.slice(0, station.lastIndexOf('-')));
    const groupe = certificats.get(composition) ?? [];
    groupe.push([station, preuve]);
    certificats.set(composition, groupe);
  }
  for (const composition of compositions) {
    const marque = { empreinte: empreinteComposition(catalogue, composition, moteur), essais };
    const connue = connues[composition];
    if (connue !== undefined && connue.empreinte === marque.empreinte && connue.essais >= essais) {
      sansStation[composition] = connue;
      continue;
    }
    let trouvees = 0;
    const garder = (ligne: LigneGrande): void => {
      journal(ligne);
      if (ligne.verdict === 'prouvee' && ligne.temoins !== null) {
        temoins[ligne.station] = ligne.temoins;
        trouvees++;
      }
    };
    for (const [ancienne, preuve] of certificats.get(composition) ?? []) {
      const station = actualiserVersionGrande(ancienne);
      if (trouvees >= parComposition || station.slice(0, station.lastIndexOf('-')) !== composition || station in temoins) continue;
      if (station === ancienne) garder({ ...verifierPubliee(catalogue, station, preuve), methode: 'publie' });
      else {
        const entree = catalogue.construireGrande(composition, Number(station.slice(station.lastIndexOf('-') + 1)));
        if ('refus' in entree) continue;
        // Les ids publics sont salés par le monde ; seules les entités encore présentes peuvent être transposées.
        const source = { ...entree, monde: { ...entree.monde, id: ancienne } };
        const transposes = transposerTemoins(source, entree, preuve);
        if (transposes !== null) garder({ ...verifierPubliee(catalogue, station, transposes), methode: 'publie' });
      }
    }
    // Une graine sans plan (annexes sans place, aucune boucle) ne coûte presque rien : elle ne compte pas parmi les essais.
    for (let graine = 0, essayees = 0; graine <= GRAINE_GRANDE_MAX && essayees < essais && trouvees < parComposition; graine++) {
      if ('refus' in catalogue.construireGrande(composition, graine)) continue;
      essayees++;
      const station = `${composition}-${graine}`;
      if (station in temoins) continue;
      garder(verifierGrande(catalogue, station));
    }
    if (trouvees === 0) sansStation[composition] = marque;
  }
  return { publiees: Object.keys(temoins).sort(), temoins, sansStation };
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
    station, verdict, ecarts, etats: 0, secondes: (performance.now() - debut) / 1000, actions: temoins?.[0]?.length ?? null, methode: 'publie', temoins: temoins ?? null,
  });
  const entree = catalogue.construireGrande(composition, graine);
  const definition = catalogue.definirGrande(composition, graine);
  if ('refus' in entree) return conclure('non_prouvee', [entree.refus]);
  if ('refus' in definition) return conclure('non_prouvee', [definition.refus]);
  const ecarts = controlerGrande(entree, definition);
  if (ecarts.length > 0) return conclure('ecartee', ecarts);
  const resultat = verifierCertificat(entree, temoins);
  return conclure(resultat.verdict, resultat.ecarts);
}

/** Même validation pour un certificat construit ou relu, sur le monde déjà assemblé et contrôlé. */
function verifierCertificat(entree: EntreeMonde, temoins: readonly (readonly PasTemoin[])[] | undefined): Pick<LigneGrande, 'verdict' | 'ecarts'> {
  if (temoins === undefined || temoins.length === 0) return { verdict: 'non_prouvee', ecarts: ['Témoin absent : relancer npm run publier:grandes.'] };
  const rejeux = [sansButin(entree), entree].map((monde) => temoins.map((pas) => rejouerTemoin(monde, pas)));
  if (rejeux.some((levees) => levees.some((ordre) => ordre === null))) return { verdict: 'non_prouvee', ecarts: ['Témoin publié qui ne mène plus à l’évacuation, avec ou sans le butin : relancer npm run publier:grandes.'] };
  const cloisons = cloisonsDuCarrefour(entree.monde);
  if (cloisons.length === 0) return { verdict: 'prouvee', ecarts: [] };
  if (!cloisons.every((cloison) => capsuleCoupee(entree.monde, cloison))) return { verdict: 'sans_sortie_sure', ecarts: ['Une cloison verrouillée ne coupe pas l’accès à la capsule (G-08).'] };
  // Le premier verrou levé du carrefour dit l'ordre ; la porte blindée de M-11, levée en route, n'en dit rien.
  const ordresDistincts = rejeux.every((levees) => new Set(levees.map((ordre) => ordre?.find((cloison) => cloisons.includes(cloison)))).size === cloisons.length);
  return ordresDistincts ? { verdict: 'prouvee', ecarts: [] } : { verdict: 'non_prouvee', ecarts: ['Ordre libre : un témoin par ordre de préparation attendu (G-07).'] };
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

/** Compositions sans station, écrites par `npm run publier:grandes` (#237). */
export const FICHIER_SANS_STATION = 'tools/grandes-sans-station.json';

/** Compositions sans station connues ; vide si le fichier manque. */
export function lireSansStation(racine = REPO_ROOT): SansStation {
  try {
    return JSON.parse(readFileSync(join(racine, FICHIER_SANS_STATION), 'utf8')) as SansStation;
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
