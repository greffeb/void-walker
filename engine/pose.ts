import { generateurDepuisGraine, suivant } from './des';
import {
  caseDevant,
  casesDe,
  chevauchent,
  cleCase,
  murCommun,
  panLibre,
  piecesDeCoque,
  PORTES_MAX,
  PROFONDEUR_COQUE,
  videsEnfermes,
  type RectPlan,
} from './plan';
import type { DefMorceau } from './station';

// Plan du chemin principal d'une station (14 §5.2, GE-01 à GE-07) : les tuiles des morceaux se posent une à une, avec retour
// en arrière, chacune telle que dessinée ou retournée sur un seul axe. Le hasard ne vient que de la graine du plan (GE-06).

export interface Pose {
  /** Par identifiant de pièce préfixé. */
  readonly rects: ReadonlyMap<string, RectPlan>;
  /** `rang` de chaque porte entre morceaux, par identifiant de liaison. */
  readonly portes: ReadonlyMap<string, number>;
}

export function prefixer(morceau: string, id: string): string {
  return `${morceau}/${id}`;
}

/** Identifiant de la porte entre un morceau et le suivant. */
export function porteEntre(depuis: string, vers: string): string {
  return `l-${depuis}-${vers}`;
}

/** Proportion visée du cadre, largeur sur hauteur : celle de l'écran (GE-04). */
const PROPORTION = 0.76;
/** Mur commun minimal entre deux morceaux (14 §5.2). */
const MUR_MIN = 2;
/**
 * Candidats évalués, au plus, pour chercher le plan d'une graine : au-delà, aucun plan. Une chaîne sans solution ne se
 * parcourt pas en entier (14 §5.6) ; un compte et non une durée, pour que la graine seule décide du plan (GE-06).
 */
export const BUDGET_POSE = 2000;

/** Retournement d'une tuile : jamais sur les deux axes, ce serait un demi-tour (GE-02). */
type Miroir = 'aucun' | 'x' | 'y';
const MIROIRS: readonly Miroir[] = ['aucun', 'x', 'y'];

interface Placement {
  readonly miroir: Miroir;
  readonly dx: number;
  readonly dy: number;
}

interface PieceTuile {
  readonly id: string;
  readonly rect: RectPlan;
  readonly coque: boolean;
}

interface Tuile {
  /** Pièces dessinées, en coordonnées locales. */
  readonly pieces: readonly PieceTuile[];
  readonly entree: PieceTuile;
  /** Pièce d'où part la porte vers le morceau suivant, s'il y en a un. */
  readonly sortie?: PieceTuile;
  /** Porte depuis le morceau précédent, s'il y en a un. */
  readonly porte?: string;
}

function placer(rect: RectPlan, { miroir, dx, dy }: Placement): RectPlan {
  const x = miroir === 'x' ? -rect.x - rect.largeur : rect.x;
  const y = miroir === 'y' ? -rect.y - rect.hauteur : rect.y;
  return { x: x + dx, y: y + dy, largeur: rect.largeur, hauteur: rect.hauteur };
}

/** Tuile du morceau ; `null` si une pièce d'attache n'est pas dessinée. */
function tuileDe(morceau: DefMorceau, avant: DefMorceau | undefined, apres: DefMorceau | undefined): Tuile | null {
  const coque = new Set(piecesDeCoque(morceau));
  const pieces = morceau.pieces.flatMap((piece) =>
    piece.plan === undefined ? [] : [{ id: prefixer(morceau.id, piece.id), rect: piece.plan, coque: coque.has(piece.id) }],
  );
  const dessinee = (id: string): PieceTuile | undefined => pieces.find((piece) => piece.id === prefixer(morceau.id, id));
  const entree = dessinee(morceau.entree);
  const sortie = apres === undefined || morceau.sortie === undefined ? undefined : dessinee(morceau.sortie.piece);
  if (entree === undefined || (apres !== undefined && sortie === undefined)) return null;
  return { pieces, entree, ...(sortie === undefined ? {} : { sortie }), ...(avant === undefined ? {} : { porte: porteEntre(avant.id, morceau.id) }) };
}

/** Une pièce aurait plus de PORTES_MAX portes (PL-06), portes intérieures et portes entre morceaux comprises. */
function tropDePortes(morceaux: readonly DefMorceau[]): boolean {
  const portes = new Map<string, number>();
  const compter = (piece: string): void => {
    portes.set(piece, (portes.get(piece) ?? 0) + 1);
  };
  morceaux.forEach((morceau, rang) => {
    const dessinees = new Set(morceau.pieces.filter((piece) => piece.plan !== undefined).map((piece) => piece.id));
    for (const liaison of morceau.liaisons) {
      if (liaison.entre.every((piece) => dessinees.has(piece))) for (const piece of liaison.entre) compter(prefixer(morceau.id, piece));
    }
    const apres = morceaux[rang + 1];
    if (morceau.sortie !== undefined && apres !== undefined) {
      compter(prefixer(morceau.id, morceau.sortie.piece));
      compter(prefixer(apres.id, apres.entree));
    }
  });
  return [...portes.values()].some((nombre) => nombre > PORTES_MAX);
}

/** Placements où l'entrée touche la sortie posée par un mur d'au moins MUR_MIN cases : chaque miroir, chaque côté, chaque glissement. */
function accroches(sortie: RectPlan, entree: RectPlan): Placement[] {
  const placements: Placement[] = [];
  for (const miroir of MIROIRS) {
    const retournee = placer(entree, { miroir, dx: 0, dy: 0 });
    const vers = (x: number, y: number): void => {
      placements.push({ miroir, dx: x - retournee.x, dy: y - retournee.y });
    };
    for (let x = sortie.x - retournee.largeur + MUR_MIN; x <= sortie.x + sortie.largeur - MUR_MIN; x++) {
      vers(x, sortie.y - retournee.hauteur);
      vers(x, sortie.y + sortie.hauteur);
    }
    for (let y = sortie.y - retournee.hauteur + MUR_MIN; y <= sortie.y + sortie.hauteur - MUR_MIN; y++) {
      vers(sortie.x - retournee.largeur, y);
      vers(sortie.x + sortie.largeur, y);
    }
  }
  return placements;
}

/** Écart du cadre des pièces à la proportion visée, arrondi au quart (GE-04). */
function ecart(rects: readonly RectPlan[]): number {
  const largeur = Math.max(...rects.map((rect) => rect.x + rect.largeur)) - Math.min(...rects.map((rect) => rect.x));
  const hauteur = Math.max(...rects.map((rect) => rect.y + rect.hauteur)) - Math.min(...rects.map((rect) => rect.y));
  return Math.round(Math.abs(largeur / hauteur - PROPORTION) * 4) / 4;
}

/**
 * Cases réservées devant les coques une fois la tuile posée ; `null` si elle chevauche une pièce (PL-01), occupe une case
 * réservée, laisse une de ses coques sans pan dégagé (GE-07) ou enferme un vide (GE-03).
 */
function poser(posees: readonly PieceTuile[], tuile: readonly PieceTuile[], reservees: ReadonlySet<string>): ReadonlySet<string> | null {
  for (const piece of tuile) {
    if (posees.some((posee) => chevauchent(posee.rect, piece.rect))) return null;
    for (const cle of casesDe([piece.rect])) if (reservees.has(cle)) return null;
  }
  const rects = [...posees, ...tuile].map((piece) => piece.rect);
  const occupees = casesDe(rects);
  const reserve = new Set(reservees);
  for (const piece of tuile.filter((candidate) => candidate.coque)) {
    const pan = panLibre(piece.rect, occupees);
    if (pan === null) return null;
    for (let i = pan.debut; i < pan.fin; i++) {
      for (let k = 1; k <= PROFONDEUR_COQUE; k++) {
        const devant = caseDevant(piece.rect, pan.cote, i, k);
        reserve.add(cleCase(devant.x, devant.y));
      }
    }
  }
  return videsEnfermes(rects).length > 0 ? null : reserve;
}

/** Plan des tuiles posées dans l'ordre du chemin ; `null` si aucune pose ne convient dans le budget. */
export function poserTuiles(morceaux: readonly DefMorceau[], graine: number): Pose | null {
  return rechercherPose(morceaux, graine).pose;
}

/** Recherche du plan, arrêtée après `budget` candidats passés aux contrôles de `poser` ; `evalues` en donne le nombre. */
export function rechercherPose(
  morceaux: readonly DefMorceau[],
  graine: number,
  budget = BUDGET_POSE,
): { readonly pose: Pose | null; readonly evalues: number } {
  const tuiles: Tuile[] = [];
  for (const [rang, morceau] of morceaux.entries()) {
    const tuile = tuileDe(morceau, morceaux[rang - 1], morceaux[rang + 1]);
    if (tuile === null) return { pose: null, evalues: 0 };
    tuiles.push(tuile);
  }
  if (tropDePortes(morceaux)) return { pose: null, evalues: 0 };
  let evalues = 0;
  let etat = generateurDepuisGraine(graine);
  const tirer = (faces: number): number => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return Math.floor((tirage.valeur / 4294967296) * faces);
  };
  const melanger = <T>(liste: readonly T[]): T[] => {
    const reste = [...liste];
    const melange: T[] = [];
    while (reste.length > 0) melange.push(...reste.splice(tirer(reste.length), 1));
    return melange;
  };
  const chercher = (rang: number, posees: readonly PieceTuile[], reservees: ReadonlySet<string>, portes: ReadonlyMap<string, number>, sortie?: RectPlan): Pose | null => {
    const tuile = tuiles[rang];
    if (tuile === undefined) return { rects: new Map(posees.map((piece) => [piece.id, piece.rect])), portes };
    // Première tuile : sans translation, seul son miroir est tiré.
    const placements = rang === 0 ? MIROIRS.map((miroir) => ({ miroir, dx: 0, dy: 0 })) : sortie === undefined ? [] : accroches(sortie, tuile.entree.rect);
    const candidats = melanger(placements)
      .map((placement) => {
        const pieces = tuile.pieces.map((piece) => ({ ...piece, rect: placer(piece.rect, placement) }));
        return { placement, pieces, ecart: ecart([...posees, ...pieces].map((piece) => piece.rect)) };
      })
      .sort((a, b) => a.ecart - b.ecart);
    for (const { placement, pieces } of candidats) {
      // Budget épuisé : chaque niveau de la recherche s'arrête à son tour.
      if (evalues >= budget) return null;
      evalues++;
      const reserve = poser(posees, pieces, reservees);
      if (reserve === null) continue;
      const mur = sortie === undefined ? null : murCommun(sortie, placer(tuile.entree.rect, placement));
      const avecPorte = mur === null || tuile.porte === undefined ? portes : new Map(portes).set(tuile.porte, mur.debut + tirer(mur.fin - mur.debut));
      const suite = chercher(rang + 1, [...posees, ...pieces], reserve, avecPorte, tuile.sortie === undefined ? undefined : placer(tuile.sortie.rect, placement));
      if (suite !== null) return suite;
    }
    return null;
  };
  const pose = chercher(0, [], new Set(), new Map());
  return { pose, evalues };
}
