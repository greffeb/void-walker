import type { DefLiaison, DefMonde } from './monde';

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

export function casesDe(rects: Iterable<RectPlan>): Set<string> {
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

/** Case à `k` cases devant la case `i` du côté `cote` de la pièce. */
export function caseDevant(piece: RectPlan, cote: Cote, i: number, k: number): CasePlan {
  return {
    x: cote === 'gauche' ? piece.x - k : cote === 'droite' ? piece.x + piece.largeur - 1 + k : i,
    y: cote === 'haut' ? piece.y - k : cote === 'bas' ? piece.y + piece.hauteur - 1 + k : i,
  };
}

/** Les PROFONDEUR_COQUE cases devant la case `i` du côté `cote` sont libres. */
function devantLibre(piece: RectPlan, cote: Cote, i: number, occupees: ReadonlySet<string>): boolean {
  for (let k = 1; k <= PROFONDEUR_COQUE; k++) {
    const { x, y } = caseDevant(piece, cote, i, k);
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

/** Pièces de coque (14 §4.1) : déclarées, à vitrage extérieur, ou d'embarquement d'une capsule ; dans l'ordre du monde, ou du morceau. */
export function piecesDeCoque(monde: Pick<DefMonde, 'pieces' | 'objets'>): string[] {
  const parObjet = new Set(monde.objets.filter((objet) => objet.vitrageExterieur === true || objet.capsule !== undefined).map((objet) => objet.piece));
  return monde.pieces.filter((piece) => piece.coque === true || parObjet.has(piece.id)).map((piece) => piece.id);
}

function rectDe(monde: DefMonde, piece: string): RectPlan | undefined {
  return monde.pieces.find((candidate) => candidate.id === piece)?.plan;
}

/** Cases occupées par les pièces et par les conduits : rien ne s'y pose devant une coque (PL-05). */
function occupation(monde: DefMonde): Set<string> {
  const occupees = casesDe(monde.pieces.flatMap((piece) => (piece.plan === undefined ? [] : [piece.plan])));
  for (const liaison of monde.liaisons) for (const etape of liaison.plan?.trace ?? []) occupees.add(cleCase(etape.x, etape.y));
  return occupees;
}

/** Pan de coque dégagé de la pièce (PL-05), où s'arrime une capsule ; `null` sans plan ou sans pan libre. */
export function panDeCoque(monde: DefMonde, piece: string): PanCoque | null {
  const rect = rectDe(monde, piece);
  return rect === undefined ? null : panLibre(rect, occupation(monde));
}

/** Emplacement d'une liaison sur le plan : son tracé, ou sa porte dans le mur commun ; `null` sans plan ou vers une sous-position. */
export function emplacementDe(monde: DefMonde, liaison: DefLiaison): EmplacementPassage | null {
  const trace = liaison.plan?.trace;
  if (trace !== undefined) return { type: 'trace', cases: trace };
  const [a, b] = liaison.entre.map((piece) => rectDe(monde, piece));
  if (a === undefined || b === undefined) return null;
  const mur = murCommun(a, b);
  return mur === null ? null : { type: 'mur', axe: mur.axe, ligne: mur.ligne, rang: liaison.plan?.rang ?? rangParDefaut(mur) };
}

function rectValide(rect: RectPlan): boolean {
  return [rect.x, rect.y, rect.largeur, rect.hauteur].every(Number.isInteger) && rect.largeur >= 2 && rect.hauteur >= 2;
}

/** Tracé de conduit : cases entières, libres, contiguës, la première contre une pièce et la dernière contre l'autre. */
function traceValide(trace: readonly CasePlan[], a: RectPlan, b: RectPlan, pieces: ReadonlySet<string>): boolean {
  const premiere = trace[0];
  const derniere = trace[trace.length - 1];
  if (premiere === undefined || derniere === undefined) return false;
  const libres = trace.every((etape) => Number.isInteger(etape.x) && Number.isInteger(etape.y) && !pieces.has(cleCase(etape.x, etape.y)));
  const contigues = trace.every((etape, index) => {
    const avant = trace[index - 1];
    return avant === undefined || Math.abs(avant.x - etape.x) + Math.abs(avant.y - etape.y) === 1;
  });
  const relie = (depart: RectPlan, arrivee: RectPlan): boolean => ouvertureVers(depart, premiere) !== null && ouvertureVers(arrivee, derniere) !== null;
  return libres && contigues && (relie(a, b) || relie(b, a));
}

/**
 * Erreurs du plan d'un monde (14 §4.2 : PL-01 à PL-03, PL-05, PL-06) ; un monde sans aucun plan n'en a pas. PL-04 se vérifie
 * avec les textes (content/textes/lisibilite.ts) ; PL-07 tient à ce que tout se calcule depuis le monde seul.
 */
export function validerPlan(monde: DefMonde): string[] {
  const erreurs: string[] = [];
  const sousPositions = new Set(monde.pieces.filter((piece) => piece.sousPosition === true).map((piece) => piece.id));
  for (const piece of monde.pieces) if (sousPositions.has(piece.id) && piece.plan !== undefined) erreurs.push(`${piece.id} : sous-position avec un plan.`);
  const dessinees = monde.pieces.filter((piece) => !sousPositions.has(piece.id));
  if (dessinees.every((piece) => piece.plan === undefined)) {
    for (const liaison of monde.liaisons) if (liaison.plan !== undefined) erreurs.push(`${liaison.id} : plan de liaison sans plan des pièces.`);
    return erreurs;
  }
  const rects = new Map<string, RectPlan>();
  for (const piece of dessinees) {
    if (piece.plan === undefined) erreurs.push(`${piece.id} : pièce sans plan, alors que d’autres en ont un.`);
    else if (!rectValide(piece.plan)) erreurs.push(`${piece.id} : rectangle invalide (cases entières, au moins 2 × 2).`);
    else rects.set(piece.id, piece.plan);
  }
  const liste = [...rects];
  liste.forEach(([id, rect], index) => {
    for (const [autre, autreRect] of liste.slice(index + 1)) if (chevauchent(rect, autreRect)) erreurs.push(`${id} et ${autre} : pièces qui se chevauchent (PL-01).`);
  });
  const pieces = casesDe(rects.values());
  const portes = new Map<string, number>();
  const ouvertures = new Map<string, string>();
  for (const liaison of monde.liaisons) {
    if (liaison.entre.some((piece) => sousPositions.has(piece))) {
      if (liaison.plan !== undefined) erreurs.push(`${liaison.id} : plan d’une liaison vers une sous-position.`);
      continue;
    }
    const [a, b] = liaison.entre.map((piece) => rects.get(piece));
    // Pièce sans plan ou rectangle invalide : déjà signalé.
    if (a === undefined || b === undefined) continue;
    for (const piece of liaison.entre) portes.set(piece, (portes.get(piece) ?? 0) + 1);
    const rang = liaison.plan?.rang;
    const trace = liaison.plan?.trace;
    if (trace !== undefined) {
      if (rang !== undefined) erreurs.push(`${liaison.id} : porte et tracé à la fois.`);
      if (!traceValide(trace, a, b, pieces)) erreurs.push(`${liaison.id} : tracé de conduit invalide (PL-02).`);
      continue;
    }
    const mur = murCommun(a, b);
    if (mur === null) {
      erreurs.push(`${liaison.id} : ni mur commun ni tracé de conduit (PL-02).`);
      continue;
    }
    if (rang !== undefined && !(Number.isInteger(rang) && rang >= mur.debut && rang < mur.fin)) {
      erreurs.push(`${liaison.id} : porte hors du mur commun (PL-02).`);
      continue;
    }
    const cle = `${mur.axe}${mur.ligne}/${rang ?? rangParDefaut(mur)}`;
    const deja = ouvertures.get(cle);
    if (deja === undefined) ouvertures.set(cle, liaison.id);
    else erreurs.push(`${deja} et ${liaison.id} : même ouverture.`);
  }
  for (const [piece, nombre] of portes) if (nombre > PORTES_MAX) erreurs.push(`${piece} : ${nombre} portes, six au plus (PL-06).`);
  for (const vide of videsEnfermes([...rects.values()])) erreurs.push(`Vide enfermé entre les pièces en (${vide.x}, ${vide.y}) (PL-03).`);
  const devant = occupation(monde);
  for (const piece of piecesDeCoque(monde)) {
    const rect = rects.get(piece);
    if (rect !== undefined && panLibre(rect, devant) === null) erreurs.push(`${piece} : pièce de coque sans pan dégagé (PL-05).`);
  }
  return erreurs;
}

/** Bout d'un conduit du côté d'une pièce : l'ouverture dans son mur, seule montrée tant que sa destination est inconnue (14 §2.6). */
export function entreeDeConduit(monde: DefMonde, liaison: DefLiaison, piece: string): EmplacementPassage | null {
  const trace = liaison.plan?.trace;
  const rect = rectDe(monde, piece);
  if (trace === undefined || rect === undefined) return null;
  for (const etape of [trace[0], trace[trace.length - 1]]) {
    const ouverture = etape === undefined ? null : ouvertureVers(rect, etape);
    if (ouverture !== null) return ouverture;
  }
  return null;
}
