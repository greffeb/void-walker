# Carte, livraison 1 : plans des stations — plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:subagent-driven-development (recommandée) ou superpowers:executing-plans, tâche par tâche. Les étapes se cochent (`- [ ]`).

**Goal :** chaque pièce d'un monde porte un rectangle en cases et chaque liaison une porte ou un tracé ; un vérifieur refuse un plan impossible à dessiner ; AR-01, AR-02 et le monde de test ont leur plan, montré au porteur en captures.

**Architecture :** le format et la géométrie vivent dans un module du moteur sans dépendance (`engine/plan.ts`), appelé par `validerMonde` : un monde au plan invalide n'est pas jouable, comme un monde mal formé. La règle PL-04 (un nom tient dans sa pièce) a besoin des textes : elle vit dans `content/`, et le contrôle des textes l'applique à chaque monde. Un rendu d'auteur en SVG (`tools/plans-svg.ts`), qui partage sa géométrie de dessin avec le futur écran (`app/carte/dessin.ts`), produit les captures des plans.

**Tech Stack :** TypeScript strict (`noUncheckedIndexedAccess`), Vitest à globales, Playwright pour les captures, `npm run verify`.

**Spec :** [docs/14-carte.md](../../14-carte.md) §4.1 à §4.3 et §7 (livraison 1) ; décisions D-201, D-204, D-206, D-207, D-214 de [docs/03-decisions.md](../../03-decisions.md).

**Essai à blanc :** le 2026-10-12, le code de ce plan a été appliqué tel quel dans une copie jetable du dépôt : 420 tests, typage, lint, règles d'import et captures verts. Copie supprimée ; ce n'est pas une implémentation.

## Global Constraints

- `engine/` n'importe que `engine/` ; `content/` n'importe du moteur que des types ; `app/` importe app, engine, content ; `tools/` importe tout (check-imports).
- Ni `Math.random`, ni `Date`, ni `performance` dans `engine/` et `content/`. Tests de `engine/` et `content/` : globales de Vitest (`describe`, `it`, `expect` sans import), aucun paquet npm importé.
- Aucune règle de jeu ne lit le plan ni un nom (D-078) ; les cases servent au dessin seulement, aucune grille ni distance n'est affichée (D-015).
- Rectangle en cases entières, largeur et hauteur d'au moins 2 ; dans un monde, toutes les pièces dessinées ont un rectangle, ou aucune ; une sous-position n'en a jamais (14 §4.1).
- Porte au milieu du mur commun, case fixable par l'auteur ; liaison sans mur commun : tracé de cases libres et contiguës qui touche les deux pièces (14 §4.1).
- PL-01 aucun chevauchement ; PL-02 mur commun d'au moins une case ou tracé valide ; PL-03 aucun vide enfermé ; PL-04 nom à 34 px par case avec une ligne d'état, 8,32 px par caractère, marges de 8 px, lignes de 17 px ; PL-05 pièce de coque : un pan d'au moins deux cases devant quatre cases libres ; PL-06 six portes au plus ; PL-07 le plan ne dépend que du monde.
- Pièces de coque : vitrage extérieur, salle d'embarquement d'une capsule, ou déclarée (`coque: true`) ; le sas extérieur n'existe pas encore dans le moteur.
- Commentaires en français avec la référence (« 14 §4.2 PL-03 », « D-204 »). Messages de commit « #97 : … », terminés par la ligne Co-Authored-By de la session ; description de PR terminée par la ligne de génération de la session.
- Zone orange : `npm run verify` vert, relecture indépendante, captures des plans montrées au porteur ; fusion seulement avec son accord. Ne jamais écrire qu'une validation humaine a eu lieu.
- Branche `contenu/97-plans`, depuis la principale à jour une fois la conception (`conception/97-carte`) fusionnée ; sinon depuis `conception/97-carte`.

## Review Focus

- Porte fixée par l'auteur sur la première ou la dernière case du mur commun : acceptée ; une case plus loin : refusée (test en tâche 2).
- Deux pièces qui ne se touchent que par un coin, reliées sans tracé : refus PL-02 et monde injouable (test en tâche 2).
- Monde planifié à moitié (une pièce oubliée) : erreur « pièce sans plan », `nouvellePartie` lève une erreur (test en tâche 2).
- Liaison vers une sous-position (écoutille de la cabine) : aucun plan exigé ; un plan fourni est refusé (test en tâche 2).
- Cour intérieure entourée de pièces : PL-03 nomme chaque case enfermée ; un renfoncement ouvert passe (test en tâche 1).

---

## Structure des fichiers

| Fichier | Rôle |
| --- | --- |
| `engine/plan.ts` (créé) | Types du format, géométrie (murs, ouvertures, vides, pans de coque), vérifieur PL-01 à PL-03, PL-05, PL-06, emplacements |
| `engine/plan.test.ts` (créé) | Tests de la géométrie et du vérifieur |
| `engine/monde.ts` | Champs `plan` et `coque` de `DefPiece`, `plan` de `DefLiaison` ; `validerMonde` appelle `validerPlan` |
| `engine/index.ts` | Exports du plan |
| `content/textes/lisibilite.ts` (créé) | PL-04 : coupe d'un nom en lignes, place restante ; mêmes mesures pour l'écran |
| `content/textes/lisibilite.test.ts` (créé) | Tests de PL-04 |
| `content/index.ts` | Exports de la lisibilité |
| `content/monde-test/monde.ts`, `content/ar-01/monde.ts`, `content/ar-02/monde.ts` | Plans des trois mondes |
| `tools/check-texts.ts`, `tools/check-texts.test.ts` | PL-04 appliqué aux noms de chaque monde |
| `tools/plans.test.ts` (créé) | Contraintes de 14 §4.3 sur les trois mondes |
| `app/carte/dessin.ts` (créé), `app/carte/dessin.test.ts` (créé) | Géométrie de dessin partagée : capsule arrimée, segment d'ouverture, points d'un conduit |
| `tools/plans-svg.ts` (créé), `tools/plans-svg.test.ts` (créé) | Rendu d'auteur d'un plan en SVG |
| `tools/captures.ts` | Captures des trois plans et section du commentaire de PR |
| `docs/14-carte.md`, `docs/contrats/C-02-monde-entites.md`, `docs/00-lire-en-premier.md` | Statut et renvois |

---

### Task 1 : géométrie du plan

**Files :**
- Create : `engine/plan.ts`
- Test : `engine/plan.test.ts`

**Interfaces :**
- Consumes : rien.
- Produces : types `CasePlan {x, y}`, `RectPlan {x, y, largeur, hauteur}`, `PlanLiaison {rang?, trace?}`, `Mur {axe: 'v'|'h', ligne, debut, fin}`, `EmplacementPassage` (`{type:'mur', axe, ligne, rang}` | `{type:'trace', cases}`), `Cote` et `COTES` (`'haut'|'droite'|'bas'|'gauche'`), `PanCoque {cote, debut, fin}` ; constantes `PROFONDEUR_COQUE = 4`, `PORTES_MAX = 6` ; fonctions `cleCase(x, y): string`, `chevauchent(a, b): boolean`, `murCommun(a, b): Mur | null`, `rangParDefaut(mur): number`, `ouvertureVers(piece, voisine): EmplacementPassage de type 'mur' | null`, `videsEnfermes(rects): CasePlan[]`, `panLibre(piece, occupees: ReadonlySet<string>): PanCoque | null`.

- [ ] **Step 1 : écrire les tests qui échouent**

Créer `engine/plan.test.ts` :

```ts
import { chevauchent, cleCase, murCommun, ouvertureVers, panLibre, rangParDefaut, videsEnfermes, type RectPlan } from './plan';

// Géométrie du plan de pont (docs/14-carte.md §4) : y croît vers le bas, comme à l'écran.

const r = (x: number, y: number, largeur: number, hauteur: number): RectPlan => ({ x, y, largeur, hauteur });

describe('géométrie du plan (14 §4.1)', () => {
  it('deux pièces côte à côte ont un mur commun, dans un sens comme dans l’autre ; un coin ou un écart ne suffit pas', () => {
    expect(murCommun(r(0, 0, 4, 3), r(4, 1, 3, 3))).toEqual({ axe: 'v', ligne: 4, debut: 1, fin: 3 });
    expect(murCommun(r(4, 1, 3, 3), r(0, 0, 4, 3))).toEqual({ axe: 'v', ligne: 4, debut: 1, fin: 3 });
    expect(murCommun(r(0, 0, 4, 3), r(1, 3, 2, 2))).toEqual({ axe: 'h', ligne: 3, debut: 1, fin: 3 });
    expect(murCommun(r(0, 0, 2, 2), r(2, 2, 2, 2))).toBeNull();
    expect(murCommun(r(0, 0, 2, 2), r(3, 0, 2, 2))).toBeNull();
  });

  it('la porte se place au milieu du mur commun, côté début quand il a un nombre pair de cases', () => {
    expect(rangParDefaut({ axe: 'v', ligne: 4, debut: 0, fin: 3 })).toBe(1);
    expect(rangParDefaut({ axe: 'h', ligne: 3, debut: 4, fin: 8 })).toBe(5);
    expect(rangParDefaut({ axe: 'h', ligne: 6, debut: 8, fin: 10 })).toBe(8);
  });

  it('chevauchement : une case partagée suffit ; un mur partagé ne compte pas (PL-01)', () => {
    expect(chevauchent(r(0, 0, 3, 3), r(2, 2, 3, 3))).toBe(true);
    expect(chevauchent(r(0, 0, 3, 3), r(3, 0, 3, 3))).toBe(false);
  });

  it('ouverture dans le mur d’une pièce vers une case voisine ; rien vers un coin', () => {
    const piece = r(2, 2, 3, 2);
    expect(ouvertureVers(piece, { x: 1, y: 3 })).toEqual({ type: 'mur', axe: 'v', ligne: 2, rang: 3 });
    expect(ouvertureVers(piece, { x: 5, y: 2 })).toEqual({ type: 'mur', axe: 'v', ligne: 5, rang: 2 });
    expect(ouvertureVers(piece, { x: 3, y: 1 })).toEqual({ type: 'mur', axe: 'h', ligne: 2, rang: 3 });
    expect(ouvertureVers(piece, { x: 4, y: 4 })).toEqual({ type: 'mur', axe: 'h', ligne: 4, rang: 4 });
    expect(ouvertureVers(piece, { x: 1, y: 1 })).toBeNull();
    expect(ouvertureVers(piece, { x: 3, y: 3 })).toBeNull();
  });

  it('vide enfermé : une cour entourée de pièces est refusée case par case ; un renfoncement ouvert passe (PL-03)', () => {
    const haut = r(0, 0, 6, 2);
    const gauche = r(0, 2, 2, 2);
    const droite = r(4, 2, 2, 2);
    const bas = r(0, 4, 6, 2);
    expect(videsEnfermes([haut, gauche, droite, bas])).toEqual([
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ]);
    expect(videsEnfermes([haut, gauche, bas])).toEqual([]);
    expect(videsEnfermes([])).toEqual([]);
  });

  it('pan de coque : le plus long, d’au moins deux cases, avec quatre cases libres devant ; à égalité, haut, droite, bas, gauche (PL-05)', () => {
    const piece = r(0, 0, 4, 3);
    expect(panLibre(piece, new Set())).toEqual({ cote: 'haut', debut: 0, fin: 4 });
    const voisins = new Set([cleCase(0, -1), cleCase(1, -1), cleCase(2, -1), cleCase(3, -1), cleCase(4, 0), cleCase(4, 1), cleCase(4, 2)]);
    expect(panLibre(piece, voisins)).toEqual({ cote: 'bas', debut: 0, fin: 4 });
    // Une case occupée à quatre cases de profondeur coupe encore le pan.
    const loin = new Set([cleCase(0, -4), cleCase(5, 1), cleCase(1, 5), cleCase(-4, 0)]);
    expect(panLibre(r(0, 0, 2, 2), loin)).toBeNull();
    loin.delete(cleCase(-4, 0));
    expect(panLibre(r(0, 0, 2, 2), loin)).toEqual({ cote: 'gauche', debut: 0, fin: 2 });
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run engine/plan.test.ts`
Expected : FAIL, « Failed to resolve import "./plan" ».

- [ ] **Step 3 : écrire le module**

Créer `engine/plan.ts` :

```ts
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
```

- [ ] **Step 4 : lancer les tests, constater le succès**

Run : `npx vitest run engine/plan.test.ts`
Expected : PASS, 6 tests.

- [ ] **Step 5 : lint et types**

Run : `npx eslint engine/plan.ts engine/plan.test.ts --max-warnings 0 && npx tsc -b`
Expected : aucune sortie d'erreur.

- [ ] **Step 6 : commit**

```bash
git add engine/plan.ts engine/plan.test.ts
git commit -m "#97 : géométrie du plan de pont (murs, ouvertures, vides enfermés, pans de coque)"
```

---

### Task 2 : format du plan dans le monde et vérifieur

**Files :**
- Modify : `engine/plan.ts` (ajouts en fin de fichier et import en tête)
- Modify : `engine/monde.ts` (interfaces `DefPiece`, `DefLiaison` ; fin de `validerMonde`)
- Modify : `engine/index.ts`
- Test : `engine/plan.test.ts` (nouveau bloc `describe`)

**Interfaces :**
- Consumes : tâche 1 (`casesDe`, `chevauchent`, `murCommun`, `rangParDefaut`, `ouvertureVers`, `videsEnfermes`, `panLibre`, `cleCase`, `PORTES_MAX`).
- Produces : `DefPiece.plan?: RectPlan`, `DefPiece.coque?: boolean`, `DefLiaison.plan?: PlanLiaison` ; `validerPlan(monde): string[]` (appelée par `validerMonde`) ; `piecesDeCoque(monde): string[]` (ordre du monde) ; `panDeCoque(monde, piece): PanCoque | null` ; `emplacementDe(monde, liaison): EmplacementPassage | null` (null sans plan ou vers une sous-position) ; exports de `engine/index.ts` : `COTES`, `emplacementDe`, `murCommun`, `panDeCoque`, `piecesDeCoque`, types `CasePlan`, `Cote`, `EmplacementPassage`, `PanCoque`, `PlanLiaison`, `RectPlan`.

- [ ] **Step 1 : écrire les tests qui échouent**

En tête de `engine/plan.test.ts`, remplacer l'import existant par :

```ts
import {
  chevauchent,
  cleCase,
  emplacementDe,
  murCommun,
  ouvertureVers,
  panDeCoque,
  panLibre,
  piecesDeCoque,
  rangParDefaut,
  validerPlan,
  videsEnfermes,
  type RectPlan,
} from './plan';
import { nouvellePartie, validerMonde, type DefLiaison, type DefMonde, type DefPiece } from './index';
```

Puis, en fin de fichier :

```ts
// Trois pièces en L et une cabine : la plus petite station qui passe le vérifieur.
//   ┌───┬───┐
//   │ a │ b │   b contre la coque, cabine k à bord de b
//   ├───┼───┘
//   │ c │
//   └───┘
const PLAN: DefMonde = {
  id: 'essai-plan',
  depart: 'a',
  pieces: [
    { id: 'a', nom: 'a', plan: { x: 0, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'b', nom: 'b', plan: { x: 3, y: 0, largeur: 3, hauteur: 2 }, coque: true },
    { id: 'c', nom: 'c', plan: { x: 0, y: 2, largeur: 3, hauteur: 2 } },
    { id: 'k', nom: 'k', sousPosition: true },
  ],
  liaisons: [
    { id: 'ab', nom: 'porte', entre: ['a', 'b'], ouverte: true },
    { id: 'ac', nom: 'porte', entre: ['a', 'c'], ouverte: false, plan: { rang: 0 } },
    { id: 'bk', nom: 'ecoutille', entre: ['b', 'k'], ouverte: false },
  ],
  objets: [],
};

function avecPieces(monde: DefMonde, changements: Readonly<Record<string, Partial<DefPiece>>>, ajouts: readonly DefPiece[] = []): DefMonde {
  return { ...monde, pieces: [...monde.pieces.map((piece) => ({ ...piece, ...changements[piece.id] })), ...ajouts] };
}

function avecLiaisons(monde: DefMonde, changements: Readonly<Record<string, Partial<DefLiaison>>>, ajouts: readonly DefLiaison[] = []): DefMonde {
  return { ...monde, liaisons: [...monde.liaisons.map((liaison) => ({ ...liaison, ...changements[liaison.id] })), ...ajouts] };
}

function liaison(monde: DefMonde, id: string): DefLiaison {
  const trouvee = monde.liaisons.find((candidate) => candidate.id === id);
  if (trouvee === undefined) throw new Error(`Liaison ${id} absente.`);
  return trouvee;
}

describe('vérifieur du plan (14 §4.2)', () => {
  it('un plan correct passe ; portes au milieu ou fixées, rien pour la cabine', () => {
    expect(validerMonde(PLAN)).toEqual([]);
    expect(emplacementDe(PLAN, liaison(PLAN, 'ab'))).toEqual({ type: 'mur', axe: 'v', ligne: 3, rang: 0 });
    expect(emplacementDe(PLAN, liaison(PLAN, 'ac'))).toEqual({ type: 'mur', axe: 'h', ligne: 2, rang: 0 });
    expect(emplacementDe(PLAN, liaison(PLAN, 'bk'))).toBeNull();
    expect(panDeCoque(PLAN, 'b')).toEqual({ cote: 'haut', debut: 3, fin: 6 });
  });

  it('un monde sans aucun plan reste valide (tests du moteur) ; un plan de liaison seul est refusé', () => {
    const sansPlan: DefMonde = { ...PLAN, pieces: PLAN.pieces.map((piece) => ({ id: piece.id, nom: piece.nom, sousPosition: piece.sousPosition })) };
    expect(validerMonde({ ...sansPlan, liaisons: PLAN.liaisons.map((lien) => ({ ...lien, plan: undefined })) })).toEqual([]);
    expect(validerMonde(sansPlan)).toContain('ac : plan de liaison sans plan des pièces.');
  });

  it('tout ou rien : une pièce oubliée rend le monde injouable', () => {
    const oubli = avecPieces(PLAN, { c: { plan: undefined } });
    expect(validerMonde(oubli)).toContain('c : pièce sans plan, alors que d’autres en ont un.');
    expect(() => nouvellePartie(oubli, { version: 'v', graine: 1 })).toThrow('pièce sans plan');
  });

  it('rectangle en cases entières, deux cases au moins de chaque côté', () => {
    expect(validerMonde(avecPieces(PLAN, { c: { plan: { x: 0, y: 2, largeur: 1, hauteur: 2 } } }))).toContain(
      'c : rectangle invalide (cases entières, au moins 2 × 2).',
    );
    expect(validerMonde(avecPieces(PLAN, { c: { plan: { x: 0, y: 2.5, largeur: 3, hauteur: 2 } } }))).toContain(
      'c : rectangle invalide (cases entières, au moins 2 × 2).',
    );
  });

  it('PL-01 : deux pièces qui se chevauchent', () => {
    expect(validerMonde(avecPieces(PLAN, { c: { plan: { x: 1, y: 1, largeur: 3, hauteur: 2 } } }))).toContain('a et c : pièces qui se chevauchent (PL-01).');
  });

  it('PL-02 : un coin ne fait pas un mur commun', () => {
    const coin = avecPieces(PLAN, { c: { plan: { x: 3, y: 2, largeur: 3, hauteur: 2 } } });
    expect(validerMonde(coin)).toContain('ac : ni mur commun ni tracé de conduit (PL-02).');
    expect(() => nouvellePartie(coin, { version: 'v', graine: 1 })).toThrow('PL-02');
  });

  it('PL-02 : une porte fixée va de la première à la dernière case du mur commun, pas au-delà', () => {
    expect(validerMonde(avecLiaisons(PLAN, { ac: { plan: { rang: 2 } } }))).toEqual([]);
    expect(validerMonde(avecLiaisons(PLAN, { ac: { plan: { rang: 3 } } }))).toContain('ac : porte hors du mur commun (PL-02).');
    expect(validerMonde(avecLiaisons(PLAN, { ac: { plan: { rang: -1 } } }))).toContain('ac : porte hors du mur commun (PL-02).');
  });

  it('deux liaisons à la même ouverture sont refusées', () => {
    const double = avecLiaisons(PLAN, {}, [{ id: 'ab2', nom: 'porte', entre: ['b', 'a'], ouverte: false }]);
    expect(validerMonde(double)).toContain('ab et ab2 : même ouverture.');
  });

  it('PL-02 : un conduit relie deux pièces sans mur commun par des cases libres et contiguës', () => {
    const conduit: DefMonde = {
      id: 'essai-conduit',
      depart: 'a',
      pieces: [
        { id: 'a', nom: 'a', plan: { x: 0, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'b', nom: 'b', plan: { x: 4, y: 0, largeur: 2, hauteur: 2 } },
      ],
      liaisons: [{ id: 'ab', nom: 'conduit', entre: ['a', 'b'], ouverte: false, plan: { trace: [{ x: 2, y: 0 }, { x: 3, y: 0 }] } }],
      objets: [],
    };
    expect(validerMonde(conduit)).toEqual([]);
    expect(emplacementDe(conduit, liaison(conduit, 'ab'))).toEqual({ type: 'trace', cases: [{ x: 2, y: 0 }, { x: 3, y: 0 }] });
    const casse = (trace: readonly { x: number; y: number }[]): string[] => validerMonde(avecLiaisons(conduit, { ab: { plan: { trace } } }));
    expect(casse([{ x: 2, y: 0 }, { x: 3, y: 1 }])).toContain('ab : tracé de conduit invalide (PL-02).');
    expect(casse([{ x: 2, y: 0 }])).toContain('ab : tracé de conduit invalide (PL-02).');
    expect(casse([{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }])).toContain('ab : tracé de conduit invalide (PL-02).');
    expect(casse([])).toContain('ab : tracé de conduit invalide (PL-02).');
    expect(validerMonde(avecLiaisons(conduit, { ab: { plan: { rang: 0, trace: [{ x: 2, y: 0 }, { x: 3, y: 0 }] } } }))).toContain('ab : porte et tracé à la fois.');
    expect(validerMonde(avecLiaisons(conduit, { ab: { plan: undefined } }))).toContain('ab : ni mur commun ni tracé de conduit (PL-02).');
  });

  it('une sous-position n’a jamais de plan, ni sa liaison', () => {
    expect(validerMonde(avecPieces(PLAN, { k: { plan: { x: 6, y: 0, largeur: 2, hauteur: 2 } } }))).toContain('k : sous-position avec un plan.');
    expect(validerMonde(avecLiaisons(PLAN, { bk: { plan: { rang: 0 } } }))).toContain('bk : plan d’une liaison vers une sous-position.');
  });

  it('PL-03 : une cour intérieure est refusée', () => {
    const cour: DefMonde = {
      id: 'essai-cour',
      depart: 'n',
      pieces: [
        { id: 'n', nom: 'n', plan: { x: 0, y: 0, largeur: 6, hauteur: 2 } },
        { id: 'o', nom: 'o', plan: { x: 0, y: 2, largeur: 2, hauteur: 2 } },
        { id: 'e', nom: 'e', plan: { x: 4, y: 2, largeur: 2, hauteur: 2 } },
        { id: 's', nom: 's', plan: { x: 0, y: 4, largeur: 6, hauteur: 2 } },
      ],
      liaisons: [],
      objets: [],
    };
    expect(validerMonde(cour)).toEqual([
      'Vide enfermé entre les pièces en (2, 2) (PL-03).',
      'Vide enfermé entre les pièces en (3, 2) (PL-03).',
      'Vide enfermé entre les pièces en (2, 3) (PL-03).',
      'Vide enfermé entre les pièces en (3, 3) (PL-03).',
    ]);
  });

  it('PL-05 : une pièce à vitrage extérieur entourée de pièces n’a pas de coque dégagée', () => {
    const croix: DefMonde = {
      id: 'essai-croix',
      depart: 'centre',
      pieces: [
        { id: 'centre', nom: 'centre', plan: { x: 0, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'est', nom: 'est', plan: { x: 2, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'sud', nom: 'sud', plan: { x: 0, y: 2, largeur: 2, hauteur: 2 } },
        { id: 'ouest', nom: 'ouest', plan: { x: -2, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'nord', nom: 'nord', plan: { x: 0, y: -2, largeur: 2, hauteur: 2 } },
      ],
      liaisons: [],
      objets: [{ id: 'hublot', nom: 'hublot', piece: 'centre', portable: false, vitrageExterieur: true }],
    };
    expect(piecesDeCoque(croix)).toEqual(['centre']);
    expect(validerMonde(croix)).toEqual(['centre : pièce de coque sans pan dégagé (PL-05).']);
  });

  it('pièces de coque : déclarées, à vitrage extérieur ou d’embarquement d’une capsule, dans l’ordre du monde', () => {
    const capsule = { ...PLAN, objets: [{ id: 'capsule', nom: 'capsule', piece: 'a', portable: false, capsule: { interieur: 'k' } }] };
    expect(piecesDeCoque(PLAN)).toEqual(['b']);
    expect(piecesDeCoque(avecLiaisons(capsule, {}, [{ id: 'ak', nom: 'ecoutille', entre: ['a', 'k'], ouverte: false }]))).toEqual(['a', 'b']);
  });

  it('PL-06 : sept portes sur une même pièce, c’est trop', () => {
    const voisines: DefPiece[] = [
      ...[0, 2, 4, 6].map((x) => ({ id: `h${x}`, nom: 'voisine', plan: { x, y: -2, largeur: 2, hauteur: 2 } })),
      ...[0, 2, 4].map((x) => ({ id: `b${x}`, nom: 'voisine', plan: { x, y: 2, largeur: 2, hauteur: 2 } })),
    ];
    const etoile: DefMonde = {
      id: 'essai-etoile',
      depart: 'hub',
      pieces: [{ id: 'hub', nom: 'hub', plan: { x: 0, y: 0, largeur: 8, hauteur: 2 } }, ...voisines],
      liaisons: voisines.map((voisine) => ({ id: `l-${voisine.id}`, nom: 'porte', entre: ['hub', voisine.id] as const, ouverte: true })),
      objets: [],
    };
    expect(validerMonde(etoile)).toEqual(['hub : 7 portes, six au plus (PL-06).']);
  });

  it('PL-07 : le plan ne dépend que du monde', () => {
    const copie = JSON.parse(JSON.stringify(PLAN)) as DefMonde;
    expect(validerPlan(copie)).toEqual(validerPlan(PLAN));
    expect(PLAN.liaisons.map((lien) => emplacementDe(copie, lien))).toEqual(PLAN.liaisons.map((lien) => emplacementDe(PLAN, lien)));
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run engine/plan.test.ts`
Expected : FAIL (« emplacementDe is not a function » ou erreur de type à l'import).

- [ ] **Step 3 : ajouter les champs du format dans `engine/monde.ts`**

En tête de `engine/monde.ts`, sous `import { hacher } from './hachage';` :

```ts
import { validerPlan, type PlanLiaison, type RectPlan } from './plan';
```

Dans `DefPiece`, après le champ `sousPosition` :

```ts
  /** Rectangle sur le plan de pont (14 §4.1) ; toutes les pièces dessinées d'un monde en ont un, ou aucune. */
  readonly plan?: RectPlan;
  /** Contre la coque sans vitrage déclaré, comme une baie d'observation (14 §4.1) : PL-05 s'y applique. */
  readonly coque?: boolean;
```

Dans `DefLiaison`, après le champ `nonEtanche` :

```ts
  /** Porte fixée dans le mur commun, ou tracé d'un conduit sans mur commun (14 §4.1). */
  readonly plan?: PlanLiaison;
```

Dans `validerMonde`, remplacer la dernière ligne `return erreurs;` par :

```ts
  // Un plan impossible à dessiner rend le monde injouable, comme une station sans chemin sûr (14 §1).
  erreurs.push(...validerPlan(monde));
  return erreurs;
```

- [ ] **Step 4 : ajouter le vérifieur et les emplacements dans `engine/plan.ts`**

En tête de `engine/plan.ts`, avant le commentaire d'introduction :

```ts
import type { DefLiaison, DefMonde } from './monde';
```

(Import de types seulement : `monde.ts` importe `plan.ts` à l'exécution, l'inverse n'existe pas.)

En fin de fichier :

```ts
/** Pièces de coque (14 §4.1) : déclarées, à vitrage extérieur, ou d'embarquement d'une capsule ; dans l'ordre du monde. */
export function piecesDeCoque(monde: DefMonde): string[] {
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
```

- [ ] **Step 5 : exporter depuis `engine/index.ts`**

Après la ligne `export { idPublic, validerMonde, … } from './monde';`, ajouter :

```ts
export {
  COTES,
  emplacementDe,
  murCommun,
  panDeCoque,
  piecesDeCoque,
  type CasePlan,
  type Cote,
  type EmplacementPassage,
  type PanCoque,
  type PlanLiaison,
  type RectPlan,
} from './plan';
```

- [ ] **Step 6 : lancer les tests du plan, puis tous les tests du moteur**

Run : `npx vitest run engine/plan.test.ts`
Expected : PASS, 21 tests.

Run : `npx vitest run engine`
Expected : PASS ; les mondes de test du moteur n'ont pas de plan et restent valides.

- [ ] **Step 7 : lint, types, imports**

Run : `npx eslint engine --max-warnings 0 && npx tsc -b && npm run check:imports`
Expected : aucune erreur.

- [ ] **Step 8 : commit**

```bash
git add engine/plan.ts engine/plan.test.ts engine/monde.ts engine/index.ts
git commit -m "#97 : format du plan dans le monde et vérifieur PL-01 à PL-03, PL-05 à PL-07"
```

---

### Task 3 : lisibilité des noms (PL-04)

**Files :**
- Create : `content/textes/lisibilite.ts`
- Test : `content/textes/lisibilite.test.ts`
- Modify : `content/index.ts`

**Interfaces :**
- Consumes : rien.
- Produces : constantes `CARACTERE_PX = 8.32`, `MARGE_PX = 8`, `LIGNE_PX = 17`, `CASE_PX = 34` ; `caracteresParLigne(largeurPx): number` ; `couperTexte(texte, largeurPx): string[] | null` ; `nomSurPlan(texte): string` (capitales) ; `placeDuNom(texte, largeur, hauteur, casePx = CASE_PX): { lignes: readonly string[]; libres: number } | null` ; `nomLisible(texte, largeur, hauteur): boolean`. Exportés par `content/index.ts`. La livraison 3 s'en sert pour masquer les noms au zoom.

- [ ] **Step 1 : écrire les tests qui échouent**

Créer `content/textes/lisibilite.test.ts` :

```ts
import { caracteresParLigne, couperTexte, nomLisible, nomSurPlan, placeDuNom } from './lisibilite';

describe('lisibilité des noms sur le plan (14 §4.2 PL-04)', () => {
  it('8,32 px par caractère, 8 px de marge de chaque côté', () => {
    expect(caracteresParLigne(4 * 34)).toBe(14);
    expect(caracteresParLigne(3 * 34)).toBe(10);
    expect(caracteresParLigne(2 * 34)).toBe(6);
  });

  it('capitales françaises ; accents et apostrophe typographique comptent pour un caractère', () => {
    expect(nomSurPlan('salle d’embarquement')).toBe('SALLE D’EMBARQUEMENT');
    expect(couperTexte('SALLE D’EMBARQUEMENT', 4 * 34)).toEqual(['SALLE', 'D’EMBARQUEMENT']);
    expect(couperTexte('LOCAL ÉNERGIE', 4 * 34)).toEqual(['LOCAL ÉNERGIE']);
  });

  it('coupe aux espaces, jamais dans un mot', () => {
    expect(couperTexte('SALON DE TRANSIT', 4 * 34)).toEqual(['SALON DE', 'TRANSIT']);
    expect(couperTexte('ATELIER MAINTENANCE', 3 * 34)).toBeNull();
  });

  it('garde la place d’une ligne d’état : deux cases de haut portent deux lignes de nom', () => {
    expect(placeDuNom('salle d’embarquement', 4, 2)).toEqual({ lignes: ['SALLE', 'D’EMBARQUEMENT'], libres: 1 });
    expect(nomLisible('salle d’embarquement', 4, 2)).toBe(true);
    expect(nomLisible('salle d’embarquement', 3, 3)).toBe(false);
    expect(nomLisible('cabines du personnel', 2, 2)).toBe(false);
    expect(nomLisible('cabine de repos prolongé', 3, 2)).toBe(false);
  });

  it('à l’écran, un nom qui ne tient plus au zoom courant disparaît (14 §2.3)', () => {
    expect(placeDuNom('cabine', 3, 2, 34)).toEqual({ lignes: ['CABINE'], libres: 2 });
    expect(placeDuNom('cabine', 3, 2, 17)).toBeNull();
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run content/textes/lisibilite.test.ts`
Expected : FAIL, import introuvable.

- [ ] **Step 3 : écrire le module**

Créer `content/textes/lisibilite.ts` :

```ts
// Lisibilité des noms sur le plan (14 §4.2 PL-04, §2.4) : capitales de 13 px en 600, interlettrage de 0,04 em, police à chasse
// fixe. Mêmes mesures pour le vérifieur des plans et pour l'écran de la carte, qui masque un nom qui ne tient plus (14 §2.3).

/** Largeur d'un caractère : 13 × 0,6 px de chasse et 13 × 0,04 px d'interlettrage. */
export const CARACTERE_PX = 8.32;
export const MARGE_PX = 8;
export const LIGNE_PX = 17;
/** Une case du plan à la taille de texte STANDARD (14 §2.3). */
export const CASE_PX = 34;

export function caracteresParLigne(largeurPx: number): number {
  return Math.floor((largeurPx - 2 * MARGE_PX) / CARACTERE_PX);
}

/** Coupe un texte en lignes de mots entiers qui tiennent dans la largeur ; `null` si un mot seul dépasse. */
export function couperTexte(texte: string, largeurPx: number): string[] | null {
  const max = caracteresParLigne(largeurPx);
  const lignes: string[] = [];
  for (const mot of texte.split(/\s+/).filter((morceau) => morceau !== '')) {
    if ([...mot].length > max) return null;
    const derniere = lignes[lignes.length - 1];
    if (derniere !== undefined && [...derniere].length + 1 + [...mot].length <= max) lignes[lignes.length - 1] = `${derniere} ${mot}`;
    else lignes.push(mot);
  }
  return lignes;
}

/** Nom d'une pièce tel que le plan l'écrit : en capitales (14 §2.4). */
export function nomSurPlan(texte: string): string {
  return texte.toLocaleUpperCase('fr-FR');
}

/** Lignes du nom dans la pièce et lignes restantes pour les états ; `null` si le nom ne tient pas à cette taille de case. */
export function placeDuNom(
  texte: string,
  largeur: number,
  hauteur: number,
  casePx: number = CASE_PX,
): { readonly lignes: readonly string[]; readonly libres: number } | null {
  const lignes = couperTexte(nomSurPlan(texte), largeur * casePx);
  if (lignes === null) return null;
  const total = Math.floor((hauteur * casePx - 2 * MARGE_PX) / LIGNE_PX);
  return lignes.length > total ? null : { lignes, libres: total - lignes.length };
}

/** PL-04 : à 34 px par case, le nom tient avec la place d'une ligne d'état. */
export function nomLisible(texte: string, largeur: number, hauteur: number): boolean {
  return (placeDuNom(texte, largeur, hauteur)?.libres ?? 0) >= 1;
}
```

- [ ] **Step 4 : exporter depuis `content/index.ts`**

Après la ligne `export { analyserGabarit, … } from './textes/gabarit';` :

```ts
export { CARACTERE_PX, caracteresParLigne, CASE_PX, couperTexte, LIGNE_PX, MARGE_PX, nomLisible, nomSurPlan, placeDuNom } from './textes/lisibilite';
```

- [ ] **Step 5 : lancer les tests, lint, types**

Run : `npx vitest run content/textes/lisibilite.test.ts && npx eslint content --max-warnings 0 && npx tsc -b`
Expected : PASS, 5 tests ; aucune erreur.

- [ ] **Step 6 : commit**

```bash
git add content/textes/lisibilite.ts content/textes/lisibilite.test.ts content/index.ts
git commit -m "#97 : lisibilité des noms sur le plan (PL-04)"
```

---

### Task 4 : plans d'AR-01, d'AR-02 et du monde de test

**Files :**
- Modify : `content/monde-test/monde.ts`, `content/ar-01/monde.ts`, `content/ar-02/monde.ts`
- Modify : `tools/check-texts.ts` (fin de `verifierStructure`), `tools/check-texts.test.ts`
- Test : `tools/plans.test.ts` (créé)

**Interfaces :**
- Consumes : tâche 2 (`validerMonde`, `emplacementDe`, `panDeCoque`, `piecesDeCoque`), tâche 3 (`nomLisible`).
- Produces : les trois mondes avec plan ; PL-04 appliqué par `npm run check:texts`. Plans retenus (en cases) :

```text
AR-01 (12 × 9, capsule sous l'embarquement)        AR-02 (11 × 6)                   Monde de test (6 × 4)
┌──────────┬──────────┐                            ┌───────┬─────────┬─────────┐    ┌───────┬───────┐
│ SALON DE │ ATELIER  │                            │ LOCAL │ CABINES │ SALLE   │    │CABINE │ATELIER│
│ TRANSIT  │MAINTENAN.│                            │  DE   │   DU    │PANORAMI.│    ├───────┴───────┤
├──────────┼──────────┼──────────┐                 │SÉCUR. │PERSONNEL├─────────┤    │     SOUTE     │
│  LOCAL   │  LOCAL   │   BAIE   │ coque           └───────┴─────────┤ SALLE   │    └───────────────┘
│TECHNIQUE │ ÉNERGIE  │D’OBSERV. │                                   │D’EMBARQ.│
└──────────┴────┬─────┴────┬─────┘                                   └─────────┘
                │  SALLE   │ coque
                │D’EMBARQ. │
                └──────────┘
```

- [ ] **Step 1 : écrire les tests qui échouent**

Créer `tools/plans.test.ts` :

```ts
import { emplacementDe, panDeCoque, piecesDeCoque, validerMonde, type DefMonde } from '../engine';
import { MONDES, nomLisible, type EntreeMonde } from '../content';

// Plans dessinés à la main (14 §4.3) : AR-01, AR-02 et le monde de test passent le vérifieur et les contraintes de leur fiche.

function entree(id: string): EntreeMonde {
  const trouvee = MONDES[id];
  if (trouvee === undefined) throw new Error(`Monde ${id} absent.`);
  return trouvee;
}

function liaison(monde: DefMonde, id: string) {
  const trouvee = monde.liaisons.find((candidate) => candidate.id === id);
  if (trouvee === undefined) throw new Error(`Liaison ${id} absente.`);
  return trouvee;
}

describe('plans des stations (14 §4.3)', () => {
  it.each(['monde-test', 'ar-01', 'ar-02'])('%s : plan valide, chaque pièce dessinée, chaque nom lisible, chaque liaison placée', (id) => {
    const { monde, textes } = entree(id);
    expect(validerMonde(monde)).toEqual([]);
    for (const piece of monde.pieces) {
      if (piece.sousPosition === true) {
        expect(piece.plan).toBeUndefined();
        continue;
      }
      const plan = piece.plan;
      if (plan === undefined) throw new Error(`${piece.id} sans plan.`);
      expect(nomLisible(textes.noms[piece.nom]?.texte ?? '', plan.largeur, plan.hauteur)).toBe(true);
    }
    for (const lien of monde.liaisons) {
      const versCabine = lien.entre.some((piece) => monde.pieces.find((candidate) => candidate.id === piece)?.sousPosition === true);
      expect(emplacementDe(monde, lien) === null).toBe(versCabine);
    }
  });

  it('AR-01 : le panneau caché passe par un mur commun ; la baie d’observation et la salle d’embarquement touchent la coque', () => {
    const { monde } = entree('ar-01');
    expect(emplacementDe(monde, liaison(monde, 'l-energie-embarquement'))).toEqual({ type: 'mur', axe: 'h', ligne: 6, rang: 6 });
    expect(piecesDeCoque(monde)).toEqual(['p-observation', 'p-embarquement']);
    expect(panDeCoque(monde, 'p-embarquement')).toEqual({ cote: 'bas', debut: 6, fin: 10 });
  });

  it('AR-02 : la salle panoramique, dont la baie peut être percée, et la salle d’embarquement touchent la coque', () => {
    const { monde } = entree('ar-02');
    expect(piecesDeCoque(monde)).toEqual(['p-panoramique', 'p-embarquement']);
    expect(panDeCoque(monde, 'p-panoramique')).toEqual({ cote: 'haut', debut: 7, fin: 11 });
    expect(panDeCoque(monde, 'p-embarquement')).toEqual({ cote: 'bas', debut: 7, fin: 11 });
  });
});
```

Ajouter dans `tools/check-texts.test.ts`, dans le `describe('contrôle des textes (C-07)')`, après le test « une action sans verbe… » :

```ts
  it('un nom de pièce trop long pour son plan fait échouer le contrôle (PL-04)', () => {
    const long = avecTextes((textes) => ({
      ...textes,
      noms: { ...textes.noms, cabine: { texte: 'cabine de repos prolongé', genre: 'f', nombre: 's', elision: false } },
    }));
    expect(verifierTextes(long)).toContain('plan : « cabine de repos prolongé » ne tient pas dans sa pièce de 3 × 2 cases (PL-04).');
  });
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run tools/plans.test.ts tools/check-texts.test.ts -t "plan"`
Expected : FAIL (« sans plan », message PL-04 absent).

- [ ] **Step 3 : plan du monde de test**

Dans `content/monde-test/monde.ts`, remplacer le tableau `pieces` par :

```ts
  // Plan (14 §4.3) : cabine et atelier côte à côte, la soute en dessous, touchant les deux.
  pieces: [
    { id: 'piece-cabine', nom: 'cabine', plan: { x: 0, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'piece-atelier', nom: 'atelier', plan: { x: 3, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'piece-soute', nom: 'soute', plan: { x: 0, y: 2, largeur: 6, hauteur: 2 } },
  ],
```

- [ ] **Step 4 : plan d'AR-01**

Dans `content/ar-01/monde.ts`, remplacer le tableau `pieces` par :

```ts
  // Plan (14 §4.3) : salon et atelier en haut, local technique et local énergie dessous, la baie d'observation à l'est contre
  // la coque, la salle d'embarquement sous l'énergie et la baie, sa capsule arrimée dessous. Le panneau caché s'ouvre dans le
  // mur commun du local énergie et de l'embarquement.
  pieces: [
    { id: 'p-salon', nom: 'salon', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-atelier', nom: 'atelier', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-galerie', nom: 'galerie', feu: true, plan: { x: 0, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-energie', nom: 'energie', plan: { x: 4, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-observation', nom: 'observation', coque: true, plan: { x: 8, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 6, y: 6, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
```

Les liaisons ne changent pas : chaque porte se place au milieu de son mur commun.

- [ ] **Step 5 : plan d'AR-02**

Dans `content/ar-02/monde.ts`, remplacer le tableau `pieces` par :

```ts
  // Plan (14 §4.3) : local de sécurité, cabines du personnel et salle panoramique en rang, la salle d'embarquement sous la
  // panoramique ; la baie et la capsule donnent sur la coque.
  pieces: [
    { id: 'p-coursive', nom: 'coursive', plan: { x: 3, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-local', nom: 'local', plan: { x: 0, y: 0, largeur: 3, hauteur: 3 } },
    { id: 'p-panoramique', nom: 'panoramique', plan: { x: 7, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 7, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
```

- [ ] **Step 6 : PL-04 dans le contrôle des textes**

Dans `tools/check-texts.ts`, ajouter `nomLisible,` à l'import depuis `'../content'` (ordre alphabétique, après `MONDES,`). Dans `verifierStructure`, après la boucle `for (const entite of [...monde.pieces, ...monde.objets])` qui vérifie les descriptions, ajouter :

```ts
  // PL-04 (14 §4.2) : chaque nom de pièce tient dans son rectangle, avec la place d'une ligne d'état.
  for (const piece of monde.pieces) {
    const nom = textes.noms[piece.nom];
    if (piece.plan === undefined || nom === undefined) continue;
    if (!nomLisible(nom.texte, piece.plan.largeur, piece.plan.hauteur)) {
      erreurs.push(`plan : « ${nom.texte} » ne tient pas dans sa pièce de ${piece.plan.largeur} × ${piece.plan.hauteur} cases (PL-04).`);
    }
  }
```

- [ ] **Step 7 : lancer les tests ciblés, puis toute la suite**

Run : `npx vitest run tools/plans.test.ts tools/check-texts.test.ts`
Expected : PASS.

Run : `npm test`
Expected : PASS ; rien d'autre ne change, aucune règle ne lit le plan.

- [ ] **Step 8 : contrôle des textes complet**

Run : `npm run check:texts`
Expected : « textes complets, trous sûrs, aucun identifiant affiché » pour les trois mondes.

- [ ] **Step 9 : commit**

```bash
git add content/monde-test/monde.ts content/ar-01/monde.ts content/ar-02/monde.ts tools/check-texts.ts tools/check-texts.test.ts tools/plans.test.ts
git commit -m "#97 : plans d'AR-01, d'AR-02 et du monde de test ; PL-04 dans le contrôle des textes"
```

---

### Task 5 : rendu d'auteur des plans et captures

**Files :**
- Create : `app/carte/dessin.ts`, `app/carte/dessin.test.ts`
- Create : `tools/plans-svg.ts`, `tools/plans-svg.test.ts`
- Modify : `tools/captures.ts`

**Interfaces :**
- Consumes : tâche 2 (`emplacementDe`, `panDeCoque`, `piecesDeCoque`, types), tâche 3 (`CASE_PX`, `LIGNE_PX`, `MARGE_PX`, `nomSurPlan`, `placeDuNom`).
- Produces : `app/carte/dessin.ts` — `PROFONDEUR_CAPSULE = 2`, `rectCapsule(piece: RectPlan, pan: PanCoque): RectPlan`, `segmentOuverture(ouverture): { x1, y1, x2, y2 }` (en cases, raccourci d'un quart de chaque côté), `pointsTrace(cases): (readonly [number, number])[]` (centres des cases) ; la livraison 3 dessine l'écran avec ces fonctions. `tools/plans-svg.ts` — `dessinerPlan(entree: EntreeMonde): string`. Captures : une étape « Plan — <monde> » par monde, suite `'plans'`.

- [ ] **Step 1 : écrire les tests qui échouent**

Créer `app/carte/dessin.test.ts` :

```ts
import { pointsTrace, rectCapsule, segmentOuverture } from './dessin';

describe('dessin du plan (14 §2.6)', () => {
  const salle = { x: 6, y: 6, largeur: 4, hauteur: 3 };

  it('capsule arrimée dehors, contre son pan de coque, centrée, trois cases au plus', () => {
    expect(rectCapsule(salle, { cote: 'bas', debut: 6, fin: 10 })).toEqual({ x: 6, y: 9, largeur: 3, hauteur: 2 });
    expect(rectCapsule(salle, { cote: 'droite', debut: 6, fin: 9 })).toEqual({ x: 10, y: 6, largeur: 2, hauteur: 3 });
    expect(rectCapsule(salle, { cote: 'haut', debut: 7, fin: 9 })).toEqual({ x: 7, y: 4, largeur: 2, hauteur: 2 });
    expect(rectCapsule(salle, { cote: 'gauche', debut: 6, fin: 8 })).toEqual({ x: 4, y: 6, largeur: 2, hauteur: 2 });
  });

  it('une ouverture occupe le milieu de sa case de mur', () => {
    expect(segmentOuverture({ type: 'mur', axe: 'v', ligne: 4, rang: 1 })).toEqual({ x1: 4, y1: 1.25, x2: 4, y2: 1.75 });
    expect(segmentOuverture({ type: 'mur', axe: 'h', ligne: 3, rang: 5 })).toEqual({ x1: 5.25, y1: 3, x2: 5.75, y2: 3 });
  });

  it('un conduit passe par le centre de ses cases', () => {
    expect(pointsTrace([{ x: 2, y: 0 }, { x: 3, y: 0 }])).toEqual([
      [2.5, 0.5],
      [3.5, 0.5],
    ]);
  });
});
```

Créer `tools/plans-svg.test.ts` :

```ts
import { MONDES, type EntreeMonde } from '../content';
import { dessinerPlan } from './plans-svg';

const AR01 = MONDES['ar-01'] as EntreeMonde;

describe('rendu d’auteur des plans (14 §4.3)', () => {
  it('dessine chaque pièce avec son nom en capitales, chaque ouverture et la capsule dehors ; jamais la cabine', () => {
    const svg = dessinerPlan(AR01);
    expect(svg.startsWith('<svg')).toBe(true);
    for (const ligne of ['SALON DE', 'TRANSIT', 'LOCAL ÉNERGIE', 'D’EMBARQUEMENT']) expect(svg).toContain(`>${ligne}</text>`);
    expect(svg).not.toContain('CABINE DE LA CAPSULE');
    // Fond, six pièces, une capsule.
    expect(svg.match(/<rect /g)).toHaveLength(8);
    // Sept ouvertures, et des tirets pour la grille et le panneau.
    expect(svg.match(/<line /g)).toHaveLength(9);
    expect(svg).not.toMatch(/NaN|undefined/);
  });

  it('refuse un monde sans plan', () => {
    const sansPlan = { ...AR01, monde: { ...AR01.monde, pieces: AR01.monde.pieces.map((piece) => ({ id: piece.id, nom: piece.nom })) } };
    expect(() => dessinerPlan(sansPlan)).toThrow('aucun plan');
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run app/carte/dessin.test.ts tools/plans-svg.test.ts`
Expected : FAIL, modules introuvables.

- [ ] **Step 3 : écrire la géométrie de dessin**

Créer `app/carte/dessin.ts` :

```ts
import type { CasePlan, EmplacementPassage, PanCoque, RectPlan } from '../../engine';

// Géométrie de dessin du plan, en cases (14 §2.6) : la même pour le rendu d'auteur des plans (tools) et pour l'écran de la carte.

/** Profondeur de la capsule arrimée dehors, en cases : elle tient dans les quatre cases libres de la coque (PL-05). */
export const PROFONDEUR_CAPSULE = 2;

/** Capsule arrimée contre le pan de coque de sa salle : trois cases de long au plus, centrée sur le pan (14 §2.6). */
export function rectCapsule(piece: RectPlan, pan: PanCoque): RectPlan {
  const longueur = Math.min(3, pan.fin - pan.debut);
  const debut = pan.debut + Math.floor((pan.fin - pan.debut - longueur) / 2);
  switch (pan.cote) {
    case 'haut':
      return { x: debut, y: piece.y - PROFONDEUR_CAPSULE, largeur: longueur, hauteur: PROFONDEUR_CAPSULE };
    case 'bas':
      return { x: debut, y: piece.y + piece.hauteur, largeur: longueur, hauteur: PROFONDEUR_CAPSULE };
    case 'gauche':
      return { x: piece.x - PROFONDEUR_CAPSULE, y: debut, largeur: PROFONDEUR_CAPSULE, hauteur: longueur };
    case 'droite':
      return { x: piece.x + piece.largeur, y: debut, largeur: PROFONDEUR_CAPSULE, hauteur: longueur };
  }
}

/** Segment d'une ouverture dans son mur, en cases : la moitié centrale de sa case. */
export function segmentOuverture(ouverture: Extract<EmplacementPassage, { type: 'mur' }>): { x1: number; y1: number; x2: number; y2: number } {
  const debut = ouverture.rang + 0.25;
  const fin = ouverture.rang + 0.75;
  return ouverture.axe === 'v'
    ? { x1: ouverture.ligne, y1: debut, x2: ouverture.ligne, y2: fin }
    : { x1: debut, y1: ouverture.ligne, x2: fin, y2: ouverture.ligne };
}

/** Points d'un conduit tracé : le centre de chacune de ses cases. */
export function pointsTrace(cases: readonly CasePlan[]): (readonly [number, number])[] {
  return cases.map((etape) => [etape.x + 0.5, etape.y + 0.5] as const);
}
```

- [ ] **Step 4 : écrire le rendu d'auteur**

Créer `tools/plans-svg.ts` :

```ts
import { emplacementDe, panDeCoque, piecesDeCoque, type DefLiaison, type RectPlan } from '../engine';
import { CASE_PX, LIGNE_PX, MARGE_PX, nomSurPlan, placeDuNom, type EntreeMonde } from '../content';
import { pointsTrace, rectCapsule, segmentOuverture } from '../app/carte/dessin';

// Rendu d'auteur d'un plan (14 §4.3) : toutes les pièces, portes, conduits et capsules d'un monde, pour que le porteur juge les
// plans avant fusion. Ce n'est pas l'écran de la carte : ni mémoire du passager, ni état. Couleurs de D-211.

const COULEURS = { fond: '#050A06', surface: '#0B140D', vert: '#5CFF7A', texte: '#A6F5B0', secondaire: '#62B06D', bordure: '#3E7046' } as const;
/** Cases de marge autour du plan. */
const MARGE_CASES = 1;

function echapper(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cadre(rects: readonly RectPlan[]): RectPlan {
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  const largeur = Math.max(...rects.map((rect) => rect.x + rect.largeur)) - x;
  const hauteur = Math.max(...rects.map((rect) => rect.y + rect.hauteur)) - y;
  return { x, y, largeur, hauteur };
}

/** Grille, conduit étroit, panneau, passage sans signalétique : ouverture en tirets (14 §2.6). */
function enTirets(liaison: DefLiaison): boolean {
  return liaison.etroite === true || liaison.nonEtanche === true || liaison.sansSignaletique === true || liaison.cachee !== undefined;
}

export function dessinerPlan({ monde, textes }: EntreeMonde): string {
  const pieces = monde.pieces.flatMap((piece) => (piece.plan === undefined ? [] : [{ piece, rect: piece.plan }]));
  if (pieces.length === 0) throw new Error(`${monde.id} : aucun plan.`);
  const capsules = monde.objets.flatMap((objet) => {
    const rect = monde.pieces.find((piece) => piece.id === objet.piece)?.plan;
    const pan = objet.capsule === undefined ? null : panDeCoque(monde, objet.piece);
    return rect === undefined || pan === null ? [] : [rectCapsule(rect, pan)];
  });
  const boite = cadre([...pieces.map(({ rect }) => rect), ...capsules]);
  const px = (cases: number): number => cases * CASE_PX;
  const ox = (x: number): number => px(x - boite.x + MARGE_CASES);
  const oy = (y: number): number => px(y - boite.y + MARGE_CASES);
  const largeur = px(boite.largeur + 2 * MARGE_CASES);
  const hauteur = px(boite.hauteur + 2 * MARGE_CASES);
  const coque = piecesDeCoque(monde);
  const elements: string[] = [];
  for (const { piece, rect } of pieces) {
    const mur = coque.includes(piece.id) ? COULEURS.vert : COULEURS.secondaire;
    elements.push(`<rect x="${ox(rect.x)}" y="${oy(rect.y)}" width="${px(rect.largeur)}" height="${px(rect.hauteur)}" fill="${COULEURS.surface}" stroke="${mur}" stroke-width="2"/>`);
    const nom = textes.noms[piece.nom]?.texte ?? piece.nom;
    const lignes = placeDuNom(nom, rect.largeur, rect.hauteur)?.lignes ?? [nomSurPlan(nom)];
    lignes.forEach((ligne, index) => {
      const y = oy(rect.y) + MARGE_PX + LIGNE_PX * index + 13;
      elements.push(
        `<text x="${ox(rect.x) + MARGE_PX}" y="${y}" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="600" letter-spacing="0.52" fill="${COULEURS.texte}">${echapper(ligne)}</text>`,
      );
    });
  }
  for (const capsule of capsules) {
    elements.push(`<rect x="${ox(capsule.x)}" y="${oy(capsule.y)}" width="${px(capsule.largeur)}" height="${px(capsule.hauteur)}" rx="${CASE_PX / 2}" fill="none" stroke="${COULEURS.vert}" stroke-width="2"/>`);
  }
  for (const liaison of monde.liaisons) {
    const emplacement = emplacementDe(monde, liaison);
    if (emplacement === null) continue;
    if (emplacement.type === 'trace') {
      const points = pointsTrace(emplacement.cases).map(([x, y]) => `${ox(x)},${oy(y)}`).join(' ');
      elements.push(`<polyline points="${points}" fill="none" stroke="${COULEURS.bordure}" stroke-width="2" stroke-dasharray="4 4"/>`);
      continue;
    }
    const { x1, y1, x2, y2 } = segmentOuverture(emplacement);
    const segment = `x1="${ox(x1)}" y1="${oy(y1)}" x2="${ox(x2)}" y2="${oy(y2)}"`;
    elements.push(`<line ${segment} stroke="${COULEURS.fond}" stroke-width="5"/>`);
    if (enTirets(liaison)) elements.push(`<line ${segment} stroke="${COULEURS.secondaire}" stroke-width="2" stroke-dasharray="3 3"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}" role="img" aria-label="Plan ${echapper(monde.id)}"><rect width="${largeur}" height="${hauteur}" fill="${COULEURS.fond}"/>${elements.join('')}</svg>`;
}
```

- [ ] **Step 5 : lancer les tests**

Run : `npx vitest run app/carte/dessin.test.ts tools/plans-svg.test.ts`
Expected : PASS, 5 tests.

- [ ] **Step 6 : brancher les plans dans les captures**

Dans `tools/captures.ts` :

1. Ajouter l'import `import { dessinerPlan } from './plans-svg';` après `import { rejouerExport } from './rejouer-export';`.
2. Dans `EtapeCapture`, remplacer `readonly suite: 'monde-test' | 'ar-01' | 'ar-02';` par `readonly suite: 'monde-test' | 'ar-01' | 'ar-02' | 'plans';` et compléter son commentaire : « … AR-02, ou les plans des stations ».
3. Avant `/** Une partie du commentaire : bilan, images, puis texte affiché à chaque étape. */`, ajouter :

```ts
/** Plans des stations (14 §4.3) : rendu d'auteur de chaque monde, montré au porteur avant fusion. */
async function capturerPlans(navigateur: Browser, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const contexte = await navigateur.newContext({ viewport: REFERENCE, locale: 'fr-FR' });
  const page = await contexte.newPage();
  for (const [id, entree] of Object.entries(MONDES)) {
    try {
      await page.setContent(`<!doctype html><html lang="fr"><body style="margin:0;background:#050A06">${dessinerPlan(entree)}</body></html>`);
      await capturer(page, `Plan — ${id}`);
    } catch (erreur) {
      erreurs.push(`${id} : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    }
  }
  await contexte.close();
}
```

4. Dans `commentaire(...)`, ajouter le paramètre `erreursPlans: readonly string[],` après `erreursAr02: readonly string[],`, et, après l'appel `...partieCommentaire('AR-02, parcours P-V1', …)`, ajouter :

```ts
    ...partieCommentaire(
      'Plans des stations (#97)',
      etapes.filter((etape) => etape.suite === 'plans'),
      erreursPlans,
      ['Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. À juger par le porteur avant fusion.'],
    ),
```

5. Dans `capturer()` : déclarer `const erreursPlans: string[] = [];` après `const erreursAr02: string[] = [];` ; après le bloc `try { await parcoursAr02(...) } catch …`, ajouter :

```ts
    // Plans des stations (#97) : rendu d'auteur, dans un contexte neuf.
    suite = 'plans';
    try {
      await capturerPlans(navigateur, capturerPage, erreursPlans);
    } catch (erreur) {
      erreursPlans.push(erreur instanceof Error ? erreur.message : String(erreur));
    }
```

6. Toujours dans `capturer()`, remplacer la ligne `const resultat = { … erreursAr02, etapes };` par la même avec `erreursPlans` après `erreursAr02`, l'appel `commentaire(etapes, erreurs, erreursAr01, erreursAr02, installable, horsLigne)` par `commentaire(etapes, erreurs, erreursAr01, erreursAr02, erreursPlans, installable, horsLigne)`, et compléter le `return` : `…, ...erreursAr02.map((erreur) => \`AR-02 : ${erreur}\`), ...erreursPlans.map((erreur) => \`Plans : ${erreur}\`)]`.

- [ ] **Step 7 : lancer les captures en local et regarder les plans**

Run : `npm run build && npm run captures`
Expected : « Captures : … réussis » ; trois images « Plan — monde-test », « Plan — ar-01 », « Plan — ar-02 » dans `captures/`, listées dans `captures/commentaire.md` sous « Plans des stations (#97) ». Ouvrir les trois images : pièces sans chevauchement, noms lisibles, portes dans les murs, capsule sous l'embarquement d'AR-01 et sous celui d'AR-02.

- [ ] **Step 8 : lint, types, imports, commit**

Run : `npx eslint app tools --max-warnings 0 && npx tsc -b && npm run check:imports`
Expected : aucune erreur.

```bash
git add app/carte/dessin.ts app/carte/dessin.test.ts tools/plans-svg.ts tools/plans-svg.test.ts tools/captures.ts
git commit -m "#97 : rendu d'auteur des plans et captures des trois stations"
```

---

### Task 6 : documents, vérification complète, PR

**Files :**
- Modify : `docs/14-carte.md` (bloc de statut), `docs/contrats/C-02-monde-entites.md` (§2 et ligne d'implémentation), `docs/00-lire-en-premier.md` (reprise #97)

**Interfaces :**
- Consumes : tâches 1 à 5.
- Produces : documents de reprise à jour ; PR de la livraison 1.

- [ ] **Step 1 : renvoi dans C-02**

Dans `docs/contrats/C-02-monde-entites.md` §2, après la puce « **Séparation opaque interne :** … », ajouter :

```markdown
- **Plan de pont (D-201, D-204) :** chaque pièce peut porter un rectangle en cases, chaque liaison une porte fixée ou le tracé d'un conduit, une pièce la mention « contre la coque » ; format et vérifieur en [14 §4](../14-carte.md). Les cases servent au dessin seulement : aucune grille ni distance n'est affichée (D-015), aucune règle ne lit le plan.
```

Dans la ligne « **Implémentation et tests :** » de l'en-tête, ajouter à la fin, avant le point final : « ; plan de pont des pièces et des liaisons (14 §4) proposé par #97, livraison 1 ».

- [ ] **Step 2 : statut de la spec et reprise**

Dans `docs/14-carte.md`, remplacer la ligne `> **Implémentation :** absente. …` par :

```markdown
> **Implémentation :** livraison 1 (format du plan, vérifieur PL-01 à PL-07, plans d'AR-01, d'AR-02 et du monde de test, captures) proposée par #97 ; mémoire et écran absents. Un prototype jetable, hors dépôt, a mesuré la génération des plans (§6) ; aucun de ses fichiers n'est conservé.
```

Dans `docs/00-lire-en-premier.md`, à la fin du paragraphe de reprise « #97 (carte) : … », ajouter : « Livraison 1 (plans) proposée : format, vérifieur et plans des trois mondes, montrés en captures ; mémoire et écran à suivre. » ; mettre la ligne « **Mise à jour :** » à la date du jour avec « livraison 1 de la carte #97 proposée ».

- [ ] **Step 3 : vérification complète**

Run : `npm run verify`
Expected : « Vérification complète : toutes les étapes sont vertes. »

- [ ] **Step 4 : commit**

```bash
git add docs/14-carte.md docs/contrats/C-02-monde-entites.md docs/00-lire-en-premier.md
git commit -m "#97 : statut de la livraison 1 (plans) dans la spec, C-02 et la reprise"
```

- [ ] **Step 5 : relecture indépendante**

Demander au profil `relecteur` une relecture du diff de la branche contre la principale, avec la spec `docs/14-carte.md` §4 et ce plan. Traiter ses points bloquants, relancer `npm run verify`.

- [ ] **Step 6 : PR, avec l'accord du porteur**

Demander au porteur s'il est d'accord pour pousser la branche et ouvrir la PR. Après son accord :

```bash
git push -u origin contenu/97-plans
gh pr create --title "#97 : carte, livraison 1 — plans des stations" --body-file .void-walker/pr-97-plans.md
```

Description, écrite dans ce fichier (dossier ignoré par git) : critères ↔ preuves (format 14 §4.1 → `engine/plan.test.ts` ; PL-01 à PL-07 → tests nommés ; PL-04 → `content/textes/lisibilite.test.ts` et `npm run check:texts` ; plans de 14 §4.3 → `tools/plans.test.ts` ; captures des trois plans → commentaire de la version de test), limites (sas extérieur absent du moteur ; génération des plans dans #106), « Zone orange : fusion sur accord du porteur, après qu'il a jugé les plans en captures ».
