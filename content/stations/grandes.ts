import type { DefAccroche, DefCommande, DefMorceau, DefStation } from '../../engine';
import { PIECES_CATALOGUE, TABLE_BUTIN } from '../catalogue';
import { MORCEAUX, type EntreeMorceau } from '../morceaux';
import { CLOISON_1, cloison2 } from '../morceaux/carrefour';
import { RESERVE_DOCUMENTS } from '../textes/documents';
import { court, premierRefus, type LignePaire } from './paires';
import { sansConflit } from './textes-station';

// Grandes stations (spec 2026-10-18 §4, D-290, D-292) : vestibule, deux chemins matériels, un troisième chemin, un final, et de
// six à dix pièces du catalogue. La créature attend dans le troisième chemin ou le final ; un chemin dont le seul obstacle est
// la créature n'est tiré que s'il l'accueille. En ordre libre, les deux branches sont les chemins matériels, et le troisième
// suit le sas (D-257, D-270).

/** Version du générateur des grandes stations : un identifiant d'une autre version ne se reconstruit pas (spec §4.3). */
export const VERSION_GENERATEUR = 1;
/** Graines des grandes stations : de 0 à 9 999, pour tenir dans 40 caractères (spec §4.3). */
export const GRAINE_GRANDE_MAX = 9999;
/** Une grande station compte environ 24 pièces dessinées : les annexes complètent les morceaux, de 6 à 10 (spec §4.1). */
const PIECES_VISEES = 24;
const ANNEXES_MIN = 6;
const ANNEXES_MAX = 10;
/** Portes de boucle voulues (spec §6.4). */
const BOUCLES = 3;

export interface CompositionGrande {
  /** 'g1-<chemins>-<final>-<place>', ou 'g1-ol-<A>-<B>-<C>-<final>-<place>' en ordre libre. */
  readonly id: string;
  readonly forme: 'chaine' | 'libre';
  /** Trois chemins dans l'ordre de la station ; en ordre libre, les branches A et B (matérielles), puis C. */
  readonly chemins: readonly string[];
  readonly final: string;
  /** Pièce préfixée, ex. 'm-07/p-soute'. */
  readonly creature: string;
  readonly annexes: number;
  /** Motif de la première paire refusée, ou `null`. */
  readonly refus: string | null;
}

/** Une grande composition et ses morceaux : chemins puis final, sans le vestibule ni le carrefour. */
export interface GrandePrevue {
  readonly composition: CompositionGrande;
  readonly morceaux: readonly EntreeMorceau[];
}

const VESTIBULE = MORCEAUX.vestibule;
const CARREFOUR = MORCEAUX.carrefour;

function exiger(entree: EntreeMorceau | undefined, id: string): EntreeMorceau {
  if (entree === undefined) throw new Error(`Morceau ${id} absent.`);
  return entree;
}

const dessinees = (morceaux: readonly DefMorceau[]): number => morceaux.reduce((total, morceau) => total + morceau.pieces.filter((piece) => piece.plan !== undefined).length, 0);

/** Toutes les grandes compositions, triées par identifiant. */
export function prevoirGrandes(table: readonly LignePaire[]): GrandePrevue[] {
  const entrees = Object.values(MORCEAUX);
  const chemins = entrees.filter(({ morceau }) => morceau.famille === 'chemin');
  const materiels = chemins.filter(({ morceau }) => morceau.grande?.obstacle === 'materiel');
  const finals = entrees.filter(({ morceau }) => morceau.famille === 'final' && morceau.grande !== undefined && morceau.id !== 'essai');
  const vestibule = exiger(VESTIBULE, 'vestibule');
  const carrefour = exiger(CARREFOUR, 'carrefour');
  const paires = (forme: CompositionGrande['forme']): EntreeMorceau[][] =>
    materiels.flatMap((a, rang) => (forme === 'chaine' ? materiels.filter((b) => b !== a) : materiels.slice(rang + 1)).map((b) => [a, b]));
  const prevues = (['chaine', 'libre'] as const).flatMap((forme) =>
    paires(forme).flatMap(([a, b]) =>
      chemins
        .filter((c) => c !== a && c !== b)
        .flatMap((c) =>
          finals.flatMap((final) => {
            // La créature dans le troisième chemin ; dans le final aussi si ce chemin a un obstacle matériel (D-292).
            const hotes = c.morceau.grande?.obstacle === 'creature' ? [c] : [c, final];
            const suite = [a, b, c].filter((entree): entree is EntreeMorceau => entree !== undefined);
            const refus = premierRefus(table, suite.map((entree) => entree.morceau), final.morceau);
            const avant = forme === 'libre' ? [vestibule, carrefour] : [vestibule];
            const annexes = Math.min(ANNEXES_MAX, Math.max(ANNEXES_MIN, PIECES_VISEES - dessinees([...avant, ...suite, final].map((entree) => entree.morceau))));
            return hotes.flatMap((hote) =>
              hote.morceau.placesCreature.map((place): GrandePrevue => {
                const nom = hote.morceau.pieces.find((piece) => piece.id === place)?.nom ?? place;
                const id = [`g${VERSION_GENERATEUR}`, ...(forme === 'libre' ? ['ol'] : []), ...[...suite, final].map((entree) => court(entree.morceau)), nom].join('-');
                const composition = { id, forme, chemins: suite.map((entree) => entree.morceau.id), final: final.morceau.id, creature: `${hote.morceau.id}/${place}`, annexes, refus };
                return { composition, morceaux: [...suite, final] };
              }),
            );
          }),
        ),
    ),
  );
  return prevues.sort((x, y) => (x.composition.id < y.composition.id ? -1 : 1));
}

/**
 * Pièce de la commande d'une branche, au-delà de son obstacle (13 §8.3) : sa pièce de sortie, sauf pour M-10, dont la coursive
 * de sortie se rejoint sans rien franchir ; sa commande est dans l'entrepôt (spec L5 §3.3).
 */
const PIECES_COMMANDE: Readonly<Record<string, string>> = { 'm-10': 'p-entrepot' };

/** Morceaux à texte calme (spec §5.4) : dans une grande station, une pièce de morceau prend sa variante calme si elle en a une. */
function calme(entree: EntreeMorceau): EntreeMorceau {
  const { calmes } = entree.textes;
  return calmes === undefined ? entree : { ...entree, textes: { ...entree.textes, descriptions: { ...entree.textes.descriptions, ...calmes } } };
}

/** Station d'une grande composition pour une graine, et les morceaux dont viennent ses textes. */
export function definirGrande({ composition, morceaux }: GrandePrevue, graine: number): { readonly station: DefStation; readonly entrees: readonly EntreeMorceau[] } {
  const commun = {
    id: `${composition.id}-${graine}`,
    creature: composition.creature,
    graine,
    assistance: [
      { id: 'reveil', quand: { type: 'reveil' } },
      { id: 'depart', quand: { type: 'evacuation' } },
    ] as const,
    grande: { version: VERSION_GENERATEUR, catalogue: PIECES_CATALOGUE, annexes: composition.annexes, boucles: BOUCLES, butin: TABLE_BUTIN, documents: RESERVE_DOCUMENTS },
  };
  const vestibule = exiger(VESTIBULE, 'vestibule');
  if (composition.forme === 'chaine') {
    const entrees = sansConflit([vestibule, ...morceaux].map(calme));
    return { station: { ...commun, morceaux: entrees.map((entree) => entree.morceau) }, entrees };
  }
  const entrees = sansConflit([vestibule, exiger(CARREFOUR, 'carrefour'), ...morceaux].map(calme));
  const [depart, carrefour, a, b, c, final] = entrees.map((entree) => entree.morceau);
  if (depart?.sortie === undefined || carrefour?.sortie === undefined || a?.sortie === undefined || b?.sortie === undefined || c?.sortie === undefined || final === undefined) {
    throw new Error(`Composition ${composition.id} : morceaux de l’ordre libre incomplets.`);
  }
  const porte = { nom: 'porte' };
  // Le troisième chemin suit le sas, le final suit le troisième chemin ; les branches partent du couloir commun.
  const accroches: DefAccroche[] = [
    { depuis: depart.id, piece: depart.sortie.piece, vers: carrefour.id, porte: depart.sortie.porte },
    { depuis: carrefour.id, piece: carrefour.sortie.piece, vers: c.id, porte: carrefour.sortie.porte },
    { depuis: c.id, piece: c.sortie.piece, vers: final.id, porte: c.sortie.porte },
    { depuis: carrefour.id, piece: carrefour.entree, vers: a.id, porte },
    { depuis: carrefour.id, piece: carrefour.entree, vers: b.id, porte },
  ];
  const commandes: DefCommande[] = [
    { id: 'o-commande-1', nom: 'commande_1', morceau: a.id, piece: PIECES_COMMANDE[a.id] ?? a.sortie.piece, cloison: CLOISON_1 },
    { id: 'o-commande-2', nom: 'commande_2', morceau: b.id, piece: PIECES_COMMANDE[b.id] ?? b.sortie.piece, cloison: cloison2(c.id) },
  ];
  return { station: { ...commun, morceaux: [depart, carrefour, a, b, c, final], accroches, commandes }, entrees };
}
