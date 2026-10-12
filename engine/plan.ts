// Plan de pont des stations (docs/14-carte.md §4) : pièces en rectangles de cases, portes dans les murs communs, conduits
// tracés, pièces de coque. Les cases ne servent qu'au dessin : aucune grille ni distance n'est affichée (D-015), et aucune
// règle de jeu ne lit le plan (D-078). Le plan ne dépend que du monde (PL-07).

/** Case du plan ; `y` croît vers le bas, comme à l'écran. */
export interface CasePlan {
  readonly x: number;
  readonly y: number;
}

/** Rectangle d'une pièce, en cases entières ; largeur et hauteur d'au moins deux cases (14 §4.1). */
export interface RectPlan {
  readonly x: number;
  readonly y: number;
  readonly largeur: number;
  readonly hauteur: number;
}

/**
 * Plan d'une liaison (14 §4.1) : `rang`, case du mur commun où l'auteur fixe la porte, au milieu par défaut ; `trace`, cases
 * libres et contiguës d'un conduit sans mur commun, la première contre une pièce, la dernière contre l'autre.
 */
export interface PlanLiaison {
  readonly rang?: number;
  readonly trace?: readonly CasePlan[];
}

/** Mur commun de deux pièces : vertical (`v`, à l'abscisse `ligne`) ou horizontal (`h`, à l'ordonnée `ligne`), cases [debut, fin). */
export interface Mur {
  readonly axe: 'v' | 'h';
  readonly ligne: number;
  readonly debut: number;
  readonly fin: number;
}

/** Emplacement d'un passage : ouverture d'une case dans un mur, à la case `rang` de ce mur ; ou tracé d'un conduit. */
export type EmplacementPassage =
  | { readonly type: 'mur'; readonly axe: 'v' | 'h'; readonly ligne: number; readonly rang: number }
  | { readonly type: 'trace'; readonly cases: readonly CasePlan[] };

export const COTES = ['haut', 'droite', 'bas', 'gauche'] as const;
export type Cote = (typeof COTES)[number];

/** Pan de mur de coque : côté de la pièce et cases [debut, fin) le long de ce côté (PL-05). */
export interface PanCoque {
  readonly cote: Cote;
  readonly debut: number;
  readonly fin: number;
}

/** Cases libres exigées devant un pan de coque (PL-05) : la place d'une capsule arrimée ou d'une baie. */
export const PROFONDEUR_COQUE = 4;
/** Portes d'une pièce, au plus (PL-06). */
export const PORTES_MAX = 6;

/** Clé d'une case dans un ensemble de cases occupées : « x,y ». */
export function cleCase(x: number, y: number): string {
  return `${x},${y}`;
}

function casesDe(rects: Iterable<RectPlan>): Set<string> {
  const cases = new Set<string>();
  for (const rect of rects) {
    for (let y = rect.y; y < rect.y + rect.hauteur; y++) for (let x = rect.x; x < rect.x + rect.largeur; x++) cases.add(cleCase(x, y));
  }
  return cases;
}

export function chevauchent(a: RectPlan, b: RectPlan): boolean {
  return a.x < b.x + b.largeur && b.x < a.x + a.largeur && a.y < b.y + b.hauteur && b.y < a.y + a.hauteur;
}

/** Mur commun d'au moins une case ; `null` si les pièces ne se touchent que par un coin, ou pas du tout. */
export function murCommun(a: RectPlan, b: RectPlan): Mur | null {
  const debutY = Math.max(a.y, b.y);
  const finY = Math.min(a.y + a.hauteur, b.y + b.hauteur);
  if (finY > debutY) {
    if (a.x + a.largeur === b.x) return { axe: 'v', ligne: b.x, debut: debutY, fin: finY };
    if (b.x + b.largeur === a.x) return { axe: 'v', ligne: a.x, debut: debutY, fin: finY };
  }
  const debutX = Math.max(a.x, b.x);
  const finX = Math.min(a.x + a.largeur, b.x + b.largeur);
  if (finX > debutX) {
    if (a.y + a.hauteur === b.y) return { axe: 'h', ligne: b.y, debut: debutX, fin: finX };
    if (b.y + b.hauteur === a.y) return { axe: 'h', ligne: a.y, debut: debutX, fin: finX };
  }
  return null;
}

/** Case de la porte quand l'auteur ne la fixe pas : le milieu du mur commun, côté début s'il a un nombre pair de cases. */
export function rangParDefaut(mur: Mur): number {
  return Math.floor((mur.debut + mur.fin - 1) / 2);
}

/** Ouverture dans un mur de la pièce vers une case voisine extérieure ; `null` si la case ne borde aucun de ses murs. */
export function ouvertureVers(piece: RectPlan, voisine: CasePlan): Extract<EmplacementPassage, { type: 'mur' }> | null {
  const dansX = voisine.x >= piece.x && voisine.x < piece.x + piece.largeur;
  const dansY = voisine.y >= piece.y && voisine.y < piece.y + piece.hauteur;
  if (dansY && voisine.x === piece.x - 1) return { type: 'mur', axe: 'v', ligne: piece.x, rang: voisine.y };
  if (dansY && voisine.x === piece.x + piece.largeur) return { type: 'mur', axe: 'v', ligne: piece.x + piece.largeur, rang: voisine.y };
  if (dansX && voisine.y === piece.y - 1) return { type: 'mur', axe: 'h', ligne: piece.y, rang: voisine.x };
  if (dansX && voisine.y === piece.y + piece.hauteur) return { type: 'mur', axe: 'h', ligne: piece.y + piece.hauteur, rang: voisine.x };
  return null;
}

const VOISINS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/**
 * Cases vides qu'on ne rejoint pas depuis l'extérieur sans traverser une pièce (PL-03), par ligne puis par colonne. Le
 * remplissage part du cadre des pièces élargi d'une case, toujours vide.
 */
export function videsEnfermes(rects: readonly RectPlan[]): CasePlan[] {
  if (rects.length === 0) return [];
  const occupees = casesDe(rects);
  const minX = Math.min(...rects.map((rect) => rect.x)) - 1;
  const minY = Math.min(...rects.map((rect) => rect.y)) - 1;
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.largeur));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.hauteur));
  const atteintes = new Set([cleCase(minX, minY)]);
  const file: CasePlan[] = [{ x: minX, y: minY }];
  for (let courante = file.shift(); courante !== undefined; courante = file.shift()) {
    for (const [dx, dy] of VOISINS) {
      const x = courante.x + dx;
      const y = courante.y + dy;
      const cle = cleCase(x, y);
      if (x < minX || x > maxX || y < minY || y > maxY || atteintes.has(cle) || occupees.has(cle)) continue;
      atteintes.add(cle);
      file.push({ x, y });
    }
  }
  const vides: CasePlan[] = [];
  for (let y = minY + 1; y < maxY; y++) {
    for (let x = minX + 1; x < maxX; x++) if (!occupees.has(cleCase(x, y)) && !atteintes.has(cleCase(x, y))) vides.push({ x, y });
  }
  return vides;
}

/** Les PROFONDEUR_COQUE cases devant la case `i` du côté `cote` sont libres. */
function devantLibre(piece: RectPlan, cote: Cote, i: number, occupees: ReadonlySet<string>): boolean {
  for (let k = 1; k <= PROFONDEUR_COQUE; k++) {
    const x = cote === 'gauche' ? piece.x - k : cote === 'droite' ? piece.x + piece.largeur - 1 + k : i;
    const y = cote === 'haut' ? piece.y - k : cote === 'bas' ? piece.y + piece.hauteur - 1 + k : i;
    if (occupees.has(cleCase(x, y))) return false;
  }
  return true;
}

/**
 * Plus long pan de la pièce, d'au moins deux cases, devant lequel PROFONDEUR_COQUE cases sont libres (PL-05) ; à longueur
 * égale, le premier dans l'ordre haut, droite, bas, gauche. `occupees` : cases des pièces et des conduits.
 */
export function panLibre(piece: RectPlan, occupees: ReadonlySet<string>): PanCoque | null {
  let meilleur: PanCoque | null = null;
  for (const cote of COTES) {
    const horizontal = cote === 'haut' || cote === 'bas';
    const debut = horizontal ? piece.x : piece.y;
    const fin = debut + (horizontal ? piece.largeur : piece.hauteur);
    let course = debut;
    for (let i = debut; i <= fin; i++) {
      if (i < fin && devantLibre(piece, cote, i, occupees)) continue;
      const longueur = i - course;
      if (longueur >= 2 && (meilleur === null || longueur > meilleur.fin - meilleur.debut)) meilleur = { cote, debut: course, fin: i };
      course = i + 1;
    }
  }
  return meilleur;
}
