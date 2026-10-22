import { MENACE, MOTS_MENACE, MOTS_TRACES } from './menace';
import { SOCLE } from './socle';
import type { Couche, TextesMonde, TextesMorceau } from './types';
import { MOTS_UNIVERS, UNIVERS } from './univers';

// Textes par couches (13 §7.2) : socle, univers, menace et morceaux réunis en un seul jeu de textes, et contrôle qu'aucun mot
// de l'univers ni de la menace ne se glisse dans le socle ou un morceau.

function estSection(valeur: unknown): valeur is object {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

/** Ajoute `source` à `cible` section par section, sans toucher aux couches ; une clé déjà définie garde le même texte. */
function ajouter(cible: Record<string, unknown>, source: object, chemin: string): void {
  for (const [cle, valeur] of Object.entries(source) as [string, unknown][]) {
    const ou = chemin === '' ? cle : `${chemin}.${cle}`;
    const deja = cible[cle];
    if (estSection(valeur) && (deja === undefined || estSection(deja))) {
      const section = (deja ?? {}) as Record<string, unknown>;
      cible[cle] = section;
      ajouter(section, valeur, ou);
    } else if (deja === undefined) {
      cible[cle] = valeur;
    } else if (JSON.stringify(deja) !== JSON.stringify(valeur)) {
      throw new Error(`Texte « ${ou} » défini deux fois, avec deux textes différents.`);
    }
  }
}

/** Texte d'une clé repris tel quel d'un autre jeu de textes, celui d'une station de test ; une clé absente lève une erreur. */
export function repris<T>(table: Readonly<Record<string, T>>, cle: string): T {
  const texte = Object.hasOwn(table, cle) ? table[cle] : undefined;
  if (texte === undefined) throw new Error(`Texte « ${cle} » absent : rien à reprendre.`);
  return texte;
}

/** Socle + univers + menace + morceaux (+ messages propres à la station) ; une clé définie deux fois avec deux textes différents lève une erreur. */
export function reunir(morceaux: readonly TextesMorceau[], assistance: Readonly<Record<string, string>> = {}): TextesMonde {
  // Le nom de puce d'un document est son nom affiché : il rejoint `noms` sous la clé du document (spec 2026-10-18 §8.5).
  const puces = morceaux.map(({ documents = {} }) => ({ noms: Object.fromEntries(Object.entries(documents).map(([cle, { puce }]) => [cle, puce])) }));
  const textes: Record<string, unknown> = { documents: {} };
  for (const couche of [SOCLE, UNIVERS, MENACE, ...morceaux, ...puces, { assistance }]) ajouter(textes, couche, '');
  return textes as unknown as TextesMonde;
}

/** Textes de fin des trois couches (D-281), repris tels quels par les mondes écrits en entier (AR-01, AR-02, monde de test). */
export const FIN: TextesMonde['fin'] = reunir([]).fin;

/** Bruits de station du socle (spec 2026-10-18 §5.5), repris par les mondes écrits en entier, qui n’en font jamais entendre. */
export const BRUITS_STATION: TextesMonde['evenements']['bruit_station'] = reunir([]).evenements.bruit_station;

/** Pose d’un appui à une position (demande du porteur), reprise par les mondes écrits en entier, où la caisse ne se porte jamais. */
export const POSE_POSITION: TextesMonde['evenements']['objet_pose_position'] = reunir([]).evenements.objet_pose_position;

/** Libellé de « poser » à une position (demande du porteur), repris par les mondes écrits en entier, où la caisse ne se porte jamais. */
export const POSER_A_POSITION: TextesMonde['poserAPosition'] = reunir([]).poserAPosition;

/** Phrases de trace de la couche menace (spec 2026-10-18 §5.4), reprises par les mondes écrits en entier, qui n’en montrent jamais. */
export const TRACES: TextesMonde['traces'] = reunir([]).traces;

/** Écoute porte par porte de la couche menace (lot 2 de la créature mobile), reprise par les mondes écrits en entier. */
export const TEXTES_ECOUTE: TextesMonde['ecoute'] = reunir([]).ecoute;

/** Phrases d'attente qui précèdent une écoute, de la couche menace, reprises par les mondes écrits en entier. */
export const ATTENTE_ECOUTE: TextesMonde['attenteEcoute'] = reunir([]).attenteEcoute;

/** Bips et pose du capteur de la couche menace (lot 3 de la créature mobile), repris par les mondes écrits en entier. */
export const TEXTES_CAPTEUR: TextesMonde['capteur'] = reunir([]).capteur;
export const TEXTES_POSE_CAPTEUR: TextesMonde['capteurPose'] = reunir([]).capteurPose;

/** Phrases de pillage de la couche univers (spec 2026-10-18 §6.6), reprises par les mondes écrits en entier, qui n’en montrent jamais. */
export const PILLAGES: TextesMonde['pillages'] = reunir([]).pillages;

/** Étiquettes des supports de document du socle (spec 2026-10-18 §8.4), reprises par les mondes écrits en entier, qui n’en portent aucun. */
export const SUPPORTS: TextesMonde['supports'] = reunir([]).supports;

/** Texte en minuscules (français) et en forme NFC : pour comparer sans la casse. */
export function minuscules(texte: string): string {
  return texte.normalize('NFC').toLocaleLowerCase('fr');
}

/** Mots d'un texte, sans ses trous : `{le:objet}` n'est pas un mot. */
function mots(texte: string): string[] {
  return texte.replace(/\{[^}]*\}/g, ' ').match(/\p{L}+/gu) ?? [];
}

/** Les trois listes de mots réservés : celles de l'univers, de la menace et des traces (spec 2026-10-18 §5.4, §8.4). */
export type Reserve = 'univers' | 'menace' | 'traces';

const RESERVES: Readonly<Record<Reserve, { readonly libelle: string; readonly radicaux: readonly string[] }>> = {
  univers: { libelle: 'mot de l’univers', radicaux: MOTS_UNIVERS.map(minuscules) },
  menace: { libelle: 'mot de la menace', radicaux: MOTS_MENACE.map(minuscules) },
  traces: { libelle: 'mot réservé aux traces', radicaux: MOTS_TRACES.map(minuscules) },
};

/**
 * Mots d'un texte qui portent un radical réservé de l'une des listes `interdits`, casse ignorée : chacun est dit « « mot »,
 * mot de la menace » (ou de l'univers, ou réservé aux traces). Un mot porte un radical s'il commence par lui ; un radical qui
 * finit par « $ » ne vaut que pour le mot exact (« sang », pas « sangle »). Les trous ne sont pas des mots.
 */
export function motsReserves(texte: string, interdits: readonly Reserve[]): string[] {
  return mots(texte).flatMap((mot) => {
    const bas = minuscules(mot);
    const reserve = interdits.find((nom) => RESERVES[nom].radicaux.some((radical) => (radical.endsWith('$') ? bas === radical.slice(0, -1) : bas.startsWith(radical))));
    return reserve === undefined ? [] : [`« ${mot} », ${RESERVES[reserve].libelle}`];
  });
}

/** Fuites d'un arbre de textes (chaînes, variantes, sections), chacune dite avec son chemin : `ou, chemin : « mot », liste.` */
function fuitesDe(ou: string, arbre: unknown, interdits: readonly Reserve[], chemin = ''): string[] {
  if (typeof arbre === 'string') return motsReserves(arbre, interdits).map((fuite) => `${ou}, ${chemin} : ${fuite}.`);
  if (Array.isArray(arbre)) return arbre.flatMap((variante: unknown, index) => fuitesDe(ou, variante, interdits, `${chemin} [${index}]`));
  if (!estSection(arbre)) return [];
  return (Object.entries(arbre) as [string, unknown][]).flatMap(([cle, sous]) => fuitesDe(ou, sous, interdits, chemin === '' ? cle : `${chemin}.${cle}`));
}

/** Fuites : un mot du socle ou d'un morceau qui commence par un radical de l'univers ou de la menace, casse ignorée. */
export function fuitesDeCouches(morceaux: Readonly<Record<string, TextesMorceau>>, socle: Couche = SOCLE): string[] {
  return [
    ...fuitesDe('socle', socle, ['univers', 'menace']),
    ...Object.entries(morceaux).flatMap(([id, textes]) => fuitesDe(`morceau ${id}`, textes, ['univers', 'menace'])),
  ];
}

/**
 * Fuites des couches elles-mêmes (spec 2026-10-18 §8.4), dans les deux sens : l'univers sans mot de la menace ni des traces,
 * la menace sans « station » (« à bord », « ici »).
 */
export function fuitesDesCouches(univers: Couche = UNIVERS, menace: Couche = MENACE): string[] {
  return [...fuitesDe('univers', univers, ['menace', 'traces']), ...fuitesDe('menace', menace, ['univers'])];
}

/**
 * Fuites d’un texte du catalogue (spec 2026-10-18 §5.3) : couche univers, il peut dire « station », mais ni un mot de la menace
 * ni un mot réservé aux traces, qui viennent de la piste.
 */
export function fuitesDuCatalogue(textes: TextesMorceau): string[] {
  // Noms et descriptions partagent leurs clés : on les lit l'un après l'autre, sans qu'une description écrase un nom.
  const textesParCle = [...Object.entries(textes.noms).map(([cle, nom]) => [cle, [nom.texte]] as const), ...Object.entries(textes.descriptions).map(([cle, variantes]) => [cle, variantes as readonly string[]] as const)];
  return textesParCle.flatMap(([cle, textesCle]) => textesCle.flatMap((texte) => motsReserves(texte, ['menace', 'traces']).map((fuite) => `catalogue, ${cle} : ${fuite}.`)));
}
