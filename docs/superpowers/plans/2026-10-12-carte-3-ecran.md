# Carte, livraison 3 : écran de la carte — plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:subagent-driven-development (recommandée) ou superpowers:executing-plans, tâche par tâche. Les étapes se cochent (`- [ ]`).

**Goal :** le bouton CARTE ouvre, au milieu de la navigation, un écran vert plein écran : plan de pont centré sur le passager, glisser et pincer, fiche d'une pièce au toucher, vue LISTE équivalente ; gratuit et sans effet sur la partie.

**Architecture :** l'écran lit seulement `observation.carte` (livraison 2) et les textes du contenu. La géométrie d'écran (zoom, glissement, ce qui tient dans une pièce) est pure et testée (`app/carte/vue.ts`) ; le dessin (`PlanCarte`) superpose des traits SVG et des boutons de pièce ; `EcranCarte` tient le mode plan/liste, la fiche et la mesure de la zone. Les bulles existantes passent dans `app/bulle.tsx` pour être partagées sans import circulaire.

**Tech Stack :** React 19, TypeScript strict, CSS à jetons, Vitest (`renderToStaticMarkup`), Playwright pour les captures.

**Spec :** [docs/14-carte.md](../../14-carte.md) §2 (tout), §9 ; [12 — interface](../../12-interface-ecrans.md) §2.6, §3.5, §3.6, §7 ; D-201, D-205, D-209 à D-212.

**Prérequis :** livraisons 1 et 2 fusionnées (`app/carte/dessin.ts`, `observation.carte`, `content/textes/carte.ts`).

**Essai à blanc :** le 2026-10-12, le code de ce plan, après ceux des livraisons 1 et 2, a été appliqué tel quel dans une copie jetable : tests de l'appli, typage, lint (règles React comprises) et captures verts, carte comprise (glisser, fiche au clavier, retour système, texte très grand, voyants d'AR-02). Copie supprimée ; ce n'est pas une implémentation, et rien n'a été essayé sur un vrai téléphone.

## Global Constraints

- Couleurs : jetons `--vert-fond #050A06`, `--vert-surface #0B140D`, `--vert #5CFF7A`, `--vert-texte #A6F5B0`, `--vert-secondaire #62B06D`, `--vert-signal #DDFFB8`, `--vert-bordure #3E7046`, `--vert-separateur #1F3A24` (14 §2.2) ; vidéo inverse des étiquettes : `vert-fond` sur `vert` ou sur `vert-signal`.
- Une case vaut 34 px en STANDARD, puis 38 et 44 px : `calc(34px * var(--echelle))` (14 §2.3). Zoom de la vue de toute la partie connue jusqu'au double de l'échelle de base ; ni bouton « recentrer » ni « vue d'ensemble ».
- Pièce actuelle : murs 3 px `vert`, « @ VOUS » ; visitée : murs 2 px `vert-secondaire`, sol `vert-surface`, nom 13/600 `vert-texte`, ancienneté 12 `vert-secondaire` ; connue : contour en pointillé `vert-bordure`, sans sol, nom `vert-secondaire` (14 §2.4). Priorité : nom, puis états jamais coupés, puis ancienneté.
- États : motif de sol et étiquette (D-209) — hachures `vert` à 22 % et FEU ; points `vert-signal` et VIDE ○ ; losange `vert` avec un point et CRÉATURE (14 §2.5).
- Portes : ouverture ; trait fin si fermée ; tirets pour grille, conduit, panneau ; voyant ● air / ○ vide ; « ? » si la destination est inconnue ; capsule arrimée dehors ; jamais la cabine (14 §2.6).
- Fiche : bulle ancrée sur un voile ; nom, « ── ÉTAT VU ── », « ── OBJETS VUS ── », rien d'autre, aucun « aller ici » (14 §2.7, D-210).
- Aucun chiffre affiché (12 §1) ; jamais la couleur seule (12 §2.6) ; cible tactile d'au moins 44 × 44 px ; focus rendu à l'élément d'origine (12 §7) ; aucun glissement animé (mouvement réduit respecté par construction).
- Gratuit (D-014) : ouvrir, parcourir, fermer la carte ne jouent aucune action et n'écrivent rien.
- Lint React du projet : pas d'appel synchrone à un `setState` dans le corps d'un effet (`react-hooks/set-state-in-effect`), pas de lecture de `ref` pendant le rendu, aucun avertissement (`--max-warnings 0`).
- Commits « #97 : … », terminés par la ligne Co-Authored-By de la session ; description de PR terminée par la ligne de génération de la session. Zone orange, **validation humaine requise** sur téléphone : ne jamais l'écrire comme faite. Branche `interface/97-carte` depuis la principale à jour.

## Review Focus

- Glisser en partant d'une pièce puis lever le doigt dessus : aucune fiche ne s'ouvre (vérifié dans les captures, tâche 6).
- Taille de texte « Très grande » : noms et étiquettes tiennent ou disparaissent, rien ne déborde, cibles d'au moins 44 px (captures, tâche 6 ; indépendance à l'échelle testée en tâche 2).
- Retour système avec la carte ouverte : la carte se ferme, le focus revient sur CARTE, la partie ne change pas (captures, tâche 6).
- Monde sans plan : la carte s'ouvre en liste, sans bouton PLAN (test en tâche 4).
- Clavier seul : Échap ferme la fiche puis la carte, le focus revient à la pièce puis à CARTE (captures, tâche 6).

---

## Structure des fichiers

| Fichier | Rôle |
| --- | --- |
| `app/bulle.tsx` (créé) | `garderFocus`, `Bulle`, `BulleAncree` déplacées d'`EcranJeu.tsx` ; classe de bulle au choix |
| `content/textes/carte.ts`, `content/textes/carte.test.ts` | Mots de l'écran, fiche, libellés accessibles |
| `content/index.ts` | Exports |
| `app/carte/vue.ts` (créé), `app/carte/vue.test.ts` (créé) | Vue du plan : cadre, ouverture centrée, zoom, glissement, bornes, cibles, étiquettes |
| `app/carte/PlanCarte.tsx` (créé) | Dessin SVG et boutons de pièce ; gestes |
| `app/carte/ListeCarte.tsx`, `app/carte/FicheCarte.tsx`, `app/carte/EcranCarte.tsx` (créés) | Vue LISTE, fiche, écran entier |
| `app/carte/carte.test.tsx` (créé) | Tests de rendu de l'écran |
| `app/styles.css` | Jetons verts, styles de la carte, bouton CARTE en colonne 2 |
| `app/EcranJeu.tsx`, `app/EcranJeu.test.tsx` | Bouton CARTE, zone ouverte « carte » |
| `tools/captures.ts` | Parcours de la carte sur téléphone simulé |
| `docs/14-carte.md`, `docs/contrats/C-06-observation-connaissances.md`, `docs/00-lire-en-premier.md` | Statut |

---

### Task 1 : bulles partagées

**Files :**
- Create : `app/bulle.tsx`
- Modify : `app/EcranJeu.tsx`

**Interfaces :**
- Consumes : rien.
- Produces : `app/bulle.tsx` exporte `garderFocus(evenement: KeyboardEvent<HTMLElement>, fermer: () => void): void`, `Bulle`, `BulleAncree({ ancre: HTMLElement, classe?: string, etape, titre, fermer, … })` (`classe` par défaut `'bulle-objet'`). Aucun changement de comportement.

- [ ] **Step 1 : déplacer les trois fonctions**

Créer `app/bulle.tsx` avec cet en-tête :

```tsx
import { useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { placerBulle } from './ecran';

// Bulles (12 §3.5, §3.6) : dialogue nommé, focus piégé, Échap qui referme ; partagées par l'écran de jeu et la carte.
```

Puis couper d'`app/EcranJeu.tsx`, avec leur commentaire de documentation, les fonctions `garderFocus`, `Bulle` et `BulleAncree`, et les coller telles quelles dans `app/bulle.tsx`, chacune précédée de `export`. Remplacer ensuite la signature et le retour de `BulleAncree` par :

```tsx
export function BulleAncree({
  ancre,
  etape,
  classe = 'bulle-objet',
  ...props
}: Omit<Parameters<typeof Bulle>[0], 'zone' | 'classe'> & { readonly ancre: HTMLElement; readonly classe?: string }) {
```

et sa dernière ligne `return <Bulle zone={zone} classe="bulle-objet" etape={etape} {...props} />;` par `return <Bulle zone={zone} classe={classe} etape={etape} {...props} />;`.

Dans `app/EcranJeu.tsx`, ajouter `import { Bulle, BulleAncree, garderFocus } from './bulle';` et retirer des imports de `'react'` et de `'./ecran'` ce que le compilateur signale comme inutilisé (`type KeyboardEvent`, `placerBulle`).

- [ ] **Step 2 : vérifier que rien ne change**

Run : `npx tsc -b && npx eslint app --max-warnings 0 && npx vitest run app`
Expected : aucune erreur ; tous les tests de l'appli passent, sans modification.

- [ ] **Step 3 : commit**

```bash
git add app/bulle.tsx app/EcranJeu.tsx
git commit -m "#97 : bulles partagées dans app/bulle.tsx, classe de bulle au choix"
```

---

### Task 2 : mots de l'écran, fiche et libellés accessibles

**Files :**
- Modify : `content/textes/carte.ts` (objet `MOTS_CARTE`, nouvelles fonctions), `content/textes/carte.test.ts`, `content/index.ts`

**Interfaces :**
- Consumes : livraison 2 (`MOTS_CARTE`, `nomCarte`, `etatsDe`, `regardDe`).
- Produces : clés de `MOTS_CARTE` ajoutées : `titrePlan`, `titreListe`, `liste`, `plan`, `fermer`, `vous` (« @ VOUS »), `vousEtesIci`, `etatVu`, `objetsVus`, `rienVu`, `aucunObjet`, `pasVisitee`, `libellePlan`, `libellePlanSeul` ; type `FicheTexte { titre; sousTitre; etats: readonly string[]; objets: readonly string[] | null }` ; `ficheDe(textes, piece): FicheTexte` ; `libellePlan(textes, carte): string` ; `libellePiece(textes, piece): string`. Exportés par `content/index.ts`.

- [ ] **Step 1 : écrire les tests qui échouent**

Dans `content/textes/carte.test.ts`, compléter les imports : `import type { CartePublique, PieceCarte, RefPiece } from '../../engine';` et `import { ficheDe, libellePiece, libellePlan, lignesListeCarte, rendreListeCarte } from './carte';`. Ajouter en fin de fichier :

```ts
function vue(nom: string): PieceCarte {
  const trouvee = CARTE.pieces.find((piece) => piece.piece.nom === nom);
  if (trouvee === undefined) throw new Error(`Pièce ${nom} absente.`);
  return trouvee;
}

describe('fiche et libellés de la carte (14 §2.7, §2.9)', () => {
  it('fiche d’une pièce visitée : le nom, le moment du regard, l’état vu, les objets vus ; rien d’autre', () => {
    expect(ficheDe(TEXTES_AR01, vue('atelier'))).toEqual({
      titre: 'ATELIER MAINTENANCE',
      sousTitre: '@ vous',
      etats: ['rien de particulier'],
      objets: ['▸ Caisse', '▸ Burette d’huile'],
    });
    expect(ficheDe(TEXTES_AR01, vue('energie'))).toEqual({
      titre: 'LOCAL ÉNERGIE',
      sousTitre: 'vu à l’instant',
      etats: ['CRÉATURE, vue il y a un moment'],
      objets: ['aucun objet'],
    });
  });

  it('fiche d’une pièce pas encore visitée : son nom, « pas encore visitée », ce que sa porte ou son voyant ont montré', () => {
    expect(ficheDe(TEXTES_AR01, vue('galerie'))).toEqual({ titre: 'LOCAL TECHNIQUE', sousTitre: 'pas encore visitée', etats: ['FEU, vu il y a un moment'], objets: null });
  });

  it('libellés pour le lecteur d’écran : où est le passager, et chaque pièce avec son statut et ses états', () => {
    expect(libellePlan(TEXTES_AR01, CARTE)).toBe('Plan de la station ; vous êtes dans l’atelier maintenance. La vue liste dit la même chose en texte.');
    expect(libellePlan(TEXTES_AR01, { pieces: [], passages: [], capsules: [], aBord: null })).toBe('Plan de la station. La vue liste dit la même chose en texte.');
    expect(libellePiece(TEXTES_AR01, vue('atelier'))).toBe('Atelier maintenance, vous êtes ici');
    expect(libellePiece(TEXTES_AR01, vue('salon'))).toBe('Salon de transit, vu il y a longtemps');
    expect(libellePiece(TEXTES_AR01, vue('galerie'))).toBe('Local technique, pas encore visitée, FEU, vu il y a un moment');
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run content/textes/carte.test.ts`
Expected : FAIL, `ficheDe` introuvable.

- [ ] **Step 3 : écrire les mots et les fonctions**

Dans `content/textes/carte.ts`, ajouter `remplir` à l'import depuis `'./gabarit'` (`import { former, remplir } from './gabarit';`). Dans `MOTS_CARTE`, ajouter en tête de l'objet :

```ts
  titrePlan: 'CARTE // RELEVÉ',
  titreListe: 'CARTE // LISTE',
  liste: 'LISTE',
  plan: 'PLAN',
  fermer: 'FERMER LA CARTE',
  vous: '@ VOUS',
  vousEtesIci: 'vous êtes ici',
  etatVu: '── ÉTAT VU ──',
  objetsVus: '── OBJETS VUS ──',
  rienVu: 'rien de particulier',
  aucunObjet: 'aucun objet',
  pasVisitee: 'pas encore visitée',
  libellePlan: 'Plan de la station ; vous êtes dans {le:piece}. La vue liste dit la même chose en texte.',
  libellePlanSeul: 'Plan de la station. La vue liste dit la même chose en texte.',
```

En fin de fichier :

```ts
/** Fiche d'une pièce (14 §2.7) : `objets` vaut `null` pour une pièce pas encore visitée. */
export interface FicheTexte {
  readonly titre: string;
  readonly sousTitre: string;
  readonly etats: readonly string[];
  readonly objets: readonly string[] | null;
}

/** Fiche d'une pièce : son nom, l'état vu et les objets vus au dernier regard, rien d'autre (D-210). */
export function ficheDe(textes: TextesMonde, piece: PieceCarte): FicheTexte {
  const titre = nomCarte(textes, piece.piece);
  const etats = etatsDe(piece);
  if (piece.statut === 'connue') return { titre, sousTitre: MOTS_CARTE.pasVisitee, etats, objets: null };
  return {
    titre,
    sousTitre: regardDe(piece) ?? MOTS_CARTE.ici,
    etats: etats.length === 0 ? [MOTS_CARTE.rienVu] : etats,
    objets: piece.objets.length === 0 ? [MOTS_CARTE.aucunObjet] : piece.objets.map(({ objet }) => `▸ ${former('Nom', nomDe(textes, objet))}`),
  };
}

/** Libellé du plan pour le lecteur d'écran (14 §2.9) : où est le passager ; la vue liste dit la même chose. */
export function libellePlan(textes: TextesMonde, carte: CartePublique): string {
  const actuelle = carte.pieces.find((piece) => piece.statut === 'actuelle');
  return actuelle === undefined ? MOTS_CARTE.libellePlanSeul : remplir(MOTS_CARTE.libellePlan, { piece: nomDe(textes, actuelle.piece) });
}

/** Nom accessible d'une pièce du plan : son nom, son statut, ses états (14 §2.9). */
export function libellePiece(textes: TextesMonde, piece: PieceCarte): string {
  const statut = piece.statut === 'actuelle' ? MOTS_CARTE.vousEtesIci : piece.statut === 'connue' ? MOTS_CARTE.pasVisitee : regardDe(piece);
  return [former('Nom', nomDe(textes, piece.piece)), ...(statut === null ? [] : [statut]), ...etatsDe(piece)].join(', ');
}
```

Dans `content/index.ts`, compléter l'export depuis `'./textes/carte'` avec `ficheDe`, `libellePiece`, `libellePlan` et `type FicheTexte`.

- [ ] **Step 4 : lancer les tests, lint, types, commit**

Run : `npx vitest run content && npx eslint content --max-warnings 0 && npx tsc -b`
Expected : PASS ; aucune erreur.

```bash
git add content/textes/carte.ts content/textes/carte.test.ts content/index.ts
git commit -m "#97 : mots de l'écran de la carte, fiche et libellés accessibles"
```

---

### Task 3 : vue du plan à l'écran

**Files :**
- Create : `app/carte/vue.ts`, `app/carte/vue.test.ts`

**Interfaces :**
- Consumes : livraison 1 (`rectCapsule`, `CASE_PX`, `caracteresParLigne`, `couperTexte`, `placeDuNom`), tâche 2 (`MOTS_CARTE`).
- Produces : types `Vue { zoom; x; y }`, `Taille { largeur; hauteur }`, `Point { x; y }`, `BoitePx { gauche; haut; largeur; hauteur }`, `Marque = 'vous' | 'feu' | 'vide' | 'creature'`, `Etiquettes { nom: readonly string[]; etats: readonly (readonly Marque[])[]; anciennete: readonly string[] }` ; constantes `ZOOM_MAX = 2`, `SEUIL_GLISSER_PX = 8`, `MARGE_VUE_PX = 16`, `CIBLE_MIN_PX = 44`, `TEXTE_MARQUE: Record<Marque, string>` ; fonctions `cadreConnu(carte): RectPlan | null`, `zoomMin(cadre, zone, casePx): number`, `vueInitiale(carte, zone, casePx): Vue`, `glisser(vue, dx, dy): Vue`, `pincer(vue, facteur, centre, min): Vue`, `borner(vue, cadre, zone, casePx): Vue`, `enPixels(rect, vue, casePx): BoitePx`, `zoneTouchable(boite): BoitePx`, `etiquettes(piece, nom, anciennete: string | null, zoom): Etiquettes`. `casePx` est la case mesurée au zoom 1 (34 px fois l'échelle du texte).

- [ ] **Step 1 : écrire les tests qui échouent**

Créer `app/carte/vue.test.ts` :

```ts
import type { CartePublique, PieceCarte, RectPlan, RefPiece } from '../../engine';
import { borner, cadreConnu, CIBLE_MIN_PX, enPixels, etiquettes, glisser, pincer, vueInitiale, ZOOM_MAX, zoneTouchable, zoomMin } from './vue';

const ref = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });

function piece(nom: string, rect: RectPlan | null, autres: Partial<PieceCarte> = {}): PieceCarte {
  return { piece: ref(nom), statut: 'visitee', rect, regard: 'instant', feu: null, vide: false, creature: null, objets: [], distance: 1, ...autres };
}

const CARTE: CartePublique = {
  pieces: [
    piece('salon', { x: 0, y: 0, largeur: 4, hauteur: 3 }),
    piece('atelier', { x: 4, y: 0, largeur: 4, hauteur: 3 }, { statut: 'actuelle', distance: 0 }),
    piece('embarquement', { x: 6, y: 6, largeur: 4, hauteur: 3 }),
  ],
  passages: [],
  capsules: [{ objet: { sorte: 'objet', id: 'e-capsule', nom: 'capsule' }, piece: ref('embarquement'), pan: { cote: 'bas', debut: 6, fin: 10 } }],
  aBord: null,
};

const ZONE = { largeur: 390, hauteur: 600 };

describe('vue du plan (14 §2.3)', () => {
  it('cadre de la partie connue, capsule arrimée comprise ; aucun sans plan', () => {
    expect(cadreConnu(CARTE)).toEqual({ x: 0, y: 0, largeur: 10, hauteur: 11 });
    expect(cadreConnu({ ...CARTE, pieces: CARTE.pieces.map((vue) => ({ ...vue, rect: null })), capsules: [] })).toBeNull();
  });

  it('s’ouvre à l’échelle de base, centrée sur la pièce actuelle (D-205)', () => {
    expect(vueInitiale(CARTE, ZONE, 34)).toEqual({ zoom: 1, x: 195 - 6 * 34, y: 300 - 1.5 * 34 });
  });

  it('se pince de la vue de toute la partie connue jusqu’au double de l’échelle de base', () => {
    const min = zoomMin({ x: 0, y: 0, largeur: 20, hauteur: 30 }, ZONE, 34);
    expect(min).toBeCloseTo((390 - 32) / (20 * 34));
    expect(zoomMin({ x: 0, y: 0, largeur: 4, hauteur: 3 }, ZONE, 34)).toBe(1);
    const vue = { zoom: 1, x: 0, y: 0 };
    expect(pincer(vue, 2, { x: 100, y: 50 }, min)).toEqual({ zoom: 2, x: -100, y: -50 });
    expect(pincer(vue, 10, { x: 0, y: 0 }, min).zoom).toBe(ZOOM_MAX);
    expect(pincer(vue, 0.01, { x: 0, y: 0 }, min).zoom).toBeCloseTo(min);
  });

  it('glisser déplace le plan, qui ne quitte jamais tout à fait l’écran', () => {
    const cadre = { x: 0, y: 0, largeur: 10, hauteur: 11 };
    expect(glisser({ zoom: 1, x: 10, y: 10 }, -30, 5)).toEqual({ zoom: 1, x: -20, y: 15 });
    expect(borner({ zoom: 1, x: -1000, y: 0 }, cadre, ZONE, 34)).toEqual({ zoom: 1, x: CIBLE_MIN_PX - 340, y: 0 });
    expect(borner({ zoom: 1, x: 0, y: 0 }, cadre, ZONE, 34)).toEqual({ zoom: 1, x: 0, y: 0 });
  });

  it('une pièce se touche sur au moins 44 × 44 px, même réduite (14 §2.9)', () => {
    const boite = enPixels({ x: 1, y: 2, largeur: 2, hauteur: 2 }, { zoom: 0.5, x: 10, y: 20 }, 34);
    expect(boite).toEqual({ gauche: 27, haut: 54, largeur: 34, hauteur: 34 });
    expect(zoneTouchable(boite)).toEqual({ gauche: 22, haut: 49, largeur: 44, hauteur: 44 });
  });

  it('étiquettes : le nom, puis les états entiers, puis l’ancienneté, selon la place au zoom courant (14 §2.4)', () => {
    const energie = piece('energie', { x: 0, y: 0, largeur: 4, hauteur: 3 }, { feu: 'moment', creature: 'moment' });
    expect(etiquettes(energie, 'local énergie', 'vu il y a un moment', 1)).toEqual({
      nom: ['LOCAL ÉNERGIE'],
      etats: [['feu', 'creature']],
      anciennete: ['vu il y a un', 'moment'],
    });
    // À mi-échelle, « ÉNERGIE » ne tient plus : plus aucun texte ; motif et losange restent dessinés.
    expect(etiquettes(energie, 'local énergie', 'vu il y a un moment', 0.5)).toEqual({ nom: [], etats: [], anciennete: [] });
    // Deux cases : le nom, deux lignes d'état ; « CRÉATURE » est trop large et disparaît.
    const cabine = piece('cabine', { x: 0, y: 0, largeur: 2, hauteur: 2 }, { statut: 'actuelle', vide: true, creature: 'instant' });
    expect(etiquettes(cabine, 'cabine', null, 1)).toEqual({ nom: ['CABINE'], etats: [['vous'], ['vide']], anciennete: [] });
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run app/carte/vue.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : écrire la vue**

Créer `app/carte/vue.ts` :

```ts
import type { CartePublique, PieceCarte, RectPlan } from '../../engine';
import { caracteresParLigne, CASE_PX, couperTexte, MOTS_CARTE, placeDuNom } from '../../content';
import { rectCapsule } from './dessin';

// Vue du plan à l'écran (14 §2.3) : position et zoom, gestes, et ce qui tient dans chaque pièce à l'échelle courante (14 §2.4).

/** Position et zoom du plan ; zoom 1 : une case vaut 34 px fois l'échelle du texte. */
export interface Vue {
  readonly zoom: number;
  /** Position de la case (0, 0) du plan dans la zone, en px. */
  readonly x: number;
  readonly y: number;
}

export interface Taille {
  readonly largeur: number;
  readonly hauteur: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface BoitePx {
  readonly gauche: number;
  readonly haut: number;
  readonly largeur: number;
  readonly hauteur: number;
}

/** Zoom maximal : le double de l'échelle de base (14 §2.3) ; borne à juger sur téléphone (14 §9). */
export const ZOOM_MAX = 2;
/** Au-delà de ce déplacement, un toucher devient un glissement : il n'ouvre pas de fiche. */
export const SEUIL_GLISSER_PX = 8;
/** Marge autour de la partie connue vue en entier. */
export const MARGE_VUE_PX = 16;
/** Cible tactile minimale (12 §7, 14 §2.9), et part du plan gardée à l'écran quand on glisse. */
export const CIBLE_MIN_PX = 44;

/** Étiquettes d'état sur le plan (14 §2.5) ; « vous » est le repère de la pièce actuelle. */
export type Marque = 'vous' | 'feu' | 'vide' | 'creature';

export const TEXTE_MARQUE: Readonly<Record<Marque, string>> = {
  vous: MOTS_CARTE.vous,
  feu: MOTS_CARTE.feu,
  vide: MOTS_CARTE.vide,
  creature: MOTS_CARTE.creature,
};

export interface Etiquettes {
  readonly nom: readonly string[];
  readonly etats: readonly (readonly Marque[])[];
  readonly anciennete: readonly string[];
}

/** Cadre de la partie connue, capsules comprises, en cases ; `null` dans un monde sans plan. */
export function cadreConnu(carte: CartePublique): RectPlan | null {
  const rects = carte.pieces.flatMap((piece) => (piece.rect === null ? [] : [piece.rect]));
  for (const capsule of carte.capsules) {
    const salle = carte.pieces.find((piece) => piece.piece.id === capsule.piece.id)?.rect;
    if (salle !== null && salle !== undefined) rects.push(rectCapsule(salle, capsule.pan));
  }
  if (rects.length === 0) return null;
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  return {
    x,
    y,
    largeur: Math.max(...rects.map((rect) => rect.x + rect.largeur)) - x,
    hauteur: Math.max(...rects.map((rect) => rect.y + rect.hauteur)) - y,
  };
}

/** Zoom minimal : toute la partie connue tient dans la zone ; jamais plus que l'échelle de base (14 §2.3). */
export function zoomMin(cadre: RectPlan, zone: Taille, casePx: number): number {
  const ajuste = Math.min((zone.largeur - 2 * MARGE_VUE_PX) / (cadre.largeur * casePx), (zone.hauteur - 2 * MARGE_VUE_PX) / (cadre.hauteur * casePx));
  return Math.max(0.1, Math.min(1, ajuste));
}

/** À l'ouverture : échelle de base, la pièce actuelle au centre de la zone (14 §2.1, D-205). */
export function vueInitiale(carte: CartePublique, zone: Taille, casePx: number): Vue {
  const centre = carte.pieces.find((piece) => piece.statut === 'actuelle')?.rect ?? cadreConnu(carte);
  if (centre === null || centre === undefined) return { zoom: 1, x: 0, y: 0 };
  return {
    zoom: 1,
    x: zone.largeur / 2 - (centre.x + centre.largeur / 2) * casePx,
    y: zone.hauteur / 2 - (centre.y + centre.hauteur / 2) * casePx,
  };
}

export function glisser(vue: Vue, dx: number, dy: number): Vue {
  return { ...vue, x: vue.x + dx, y: vue.y + dy };
}

/** Pincer, ou molette : zoom autour d'un point de la zone, borné de `min` à ZOOM_MAX. */
export function pincer(vue: Vue, facteur: number, centre: Point, min: number): Vue {
  const zoom = Math.min(ZOOM_MAX, Math.max(min, vue.zoom * facteur));
  const rapport = zoom / vue.zoom;
  return { zoom, x: centre.x - (centre.x - vue.x) * rapport, y: centre.y - (centre.y - vue.y) * rapport };
}

/** Garde au moins une cible du plan dans la zone : on ne le perd jamais en glissant. */
export function borner(vue: Vue, cadre: RectPlan, zone: Taille, casePx: number): Vue {
  const echelle = casePx * vue.zoom;
  const gauche = vue.x + cadre.x * echelle;
  const droite = vue.x + (cadre.x + cadre.largeur) * echelle;
  const haut = vue.y + cadre.y * echelle;
  const bas = vue.y + (cadre.y + cadre.hauteur) * echelle;
  const dx = droite < CIBLE_MIN_PX ? CIBLE_MIN_PX - droite : gauche > zone.largeur - CIBLE_MIN_PX ? zone.largeur - CIBLE_MIN_PX - gauche : 0;
  const dy = bas < CIBLE_MIN_PX ? CIBLE_MIN_PX - bas : haut > zone.hauteur - CIBLE_MIN_PX ? zone.hauteur - CIBLE_MIN_PX - haut : 0;
  return dx === 0 && dy === 0 ? vue : { ...vue, x: vue.x + dx, y: vue.y + dy };
}

/** Rectangle du plan à l'écran, en px. */
export function enPixels(rect: RectPlan, vue: Vue, casePx: number): BoitePx {
  const echelle = casePx * vue.zoom;
  return { gauche: vue.x + rect.x * echelle, haut: vue.y + rect.y * echelle, largeur: rect.largeur * echelle, hauteur: rect.hauteur * echelle };
}

/** Zone touchable d'une pièce : son rectangle, agrandi autour de son centre jusqu'à 44 px de côté (14 §2.9). */
export function zoneTouchable(boite: BoitePx): BoitePx {
  const largeur = Math.max(CIBLE_MIN_PX, boite.largeur);
  const hauteur = Math.max(CIBLE_MIN_PX, boite.hauteur);
  return { gauche: boite.gauche - (largeur - boite.largeur) / 2, haut: boite.haut - (hauteur - boite.hauteur) / 2, largeur, hauteur };
}

const RIEN: Etiquettes = { nom: [], etats: [], anciennete: [] };

/**
 * Ce qui tient dans la pièce au zoom courant (14 §2.3, §2.4) : le nom d'abord, puis les étiquettes d'état, jamais coupées, puis
 * l'ancienneté. Ce qui ne tient pas disparaît ; murs, motifs et losange restent. Le texte et la case grandissent ensemble avec la
 * taille du texte : les mesures de PL-04 valent à toutes les tailles.
 */
export function etiquettes(piece: PieceCarte, nom: string, anciennete: string | null, zoom: number): Etiquettes {
  if (piece.rect === null) return RIEN;
  const casePx = CASE_PX * zoom;
  const place = placeDuNom(nom, piece.rect.largeur, piece.rect.hauteur, casePx);
  if (place === null) return RIEN;
  const max = caracteresParLigne(piece.rect.largeur * casePx);
  const marques: Marque[] = [
    ...(piece.statut === 'actuelle' ? (['vous'] as const) : []),
    ...(piece.feu === null ? [] : (['feu'] as const)),
    ...(piece.vide ? (['vide'] as const) : []),
    ...(piece.creature === null ? [] : (['creature'] as const)),
  ];
  let libres = place.libres;
  const etats: Marque[][] = [];
  for (const marque of marques) {
    const longueur = [...TEXTE_MARQUE[marque]].length;
    // Une étiquette ne se coupe jamais : trop large, elle disparaît, le motif de sol reste.
    if (longueur > max) continue;
    const ligne = etats[etats.length - 1];
    const occupee = ligne?.reduce((somme, autre) => somme + [...TEXTE_MARQUE[autre]].length + 1, 0);
    if (ligne !== undefined && occupee !== undefined && occupee + longueur <= max) ligne.push(marque);
    else if (libres > 0) {
      etats.push([marque]);
      libres -= 1;
    }
  }
  const lignes = anciennete === null ? null : couperTexte(anciennete, piece.rect.largeur * casePx);
  return { nom: place.lignes, etats, anciennete: lignes !== null && lignes.length <= libres ? lignes : [] };
}
```

- [ ] **Step 4 : lancer les tests, lint, types, commit**

Run : `npx vitest run app/carte/vue.test.ts && npx eslint app --max-warnings 0 && npx tsc -b`
Expected : PASS, 6 tests ; aucune erreur.

```bash
git add app/carte/vue.ts app/carte/vue.test.ts
git commit -m "#97 : vue du plan à l'écran (ouverture centrée, zoom, glissement, étiquettes)"
```

---

### Task 4 : écran de la carte

**Files :**
- Create : `app/carte/PlanCarte.tsx`, `app/carte/ListeCarte.tsx`, `app/carte/FicheCarte.tsx`, `app/carte/EcranCarte.tsx`, `app/carte/carte.test.tsx`
- Modify : `app/styles.css`

**Interfaces :**
- Consumes : tâche 1 (`BulleAncree`, `garderFocus`), tâche 2 (`MOTS_CARTE`, `ficheDe`, `libellePiece`, `libellePlan`, `rendreListeCarte`, `nomDe`, `regardDe`, `FicheTexte`, `BlocListe`), tâche 3 (vue), livraison 1 (`segmentOuverture`, `pointsTrace`, `rectCapsule`).
- Produces : `EcranCarte({ carte: CartePublique; textes: TextesMonde; fermer: () => void })` ; `PlanCarte(props: PropsPlan)` avec `PropsPlan { carte; textes; vue: Vue; casePx: number; zoomMin: number; changerVue: (maj: (vue: Vue) => Vue) => void; toucher: (piece: PieceCarte, bouton: HTMLButtonElement) => void; ouverte: string | null }` ; `ListeCarte({ blocs })` ; `FicheCarte({ fiche: FicheTexte; ancre: HTMLElement; fermer })`. Classes CSS : `.carte`, `.carte-piece[data-statut]`, `.carte-etiquette[data-marque]`, `.voyant-air`, `.voyant-vide`, `.ouverture-fermee`, `.ouverture-tirets`, `.capsule`, `.losange`, `.nav-carte`.

- [ ] **Step 1 : écrire les tests qui échouent**

Créer `app/carte/carte.test.tsx` :

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { nouvellePartie, observer, type CartePublique, type PieceCarte, type RectPlan, type RefPiece } from '../../engine';
import { ficheDe, MONDES, rendreListeCarte, type EntreeMonde } from '../../content';
import { EcranCarte } from './EcranCarte';
import { FicheCarte } from './FicheCarte';
import { ListeCarte } from './ListeCarte';
import { PlanCarte } from './PlanCarte';
import type { Vue } from './vue';

const { monde: AR01, textes } = MONDES['ar-01'] as EntreeMonde;
const rien = (): void => undefined;

const ref = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });

function vue(nom: string, statut: PieceCarte['statut'], rect: RectPlan, autres: Partial<PieceCarte> = {}): PieceCarte {
  return { piece: ref(nom), statut, rect, regard: statut === 'connue' ? null : 'instant', feu: null, vide: false, creature: null, objets: [], distance: 1, ...autres };
}

// Une carte écrite à la main avec les noms d'AR-01 : chaque élément du dessin y figure une fois.
const CARTE: CartePublique = {
  pieces: [
    vue('salon', 'visitee', { x: 0, y: 0, largeur: 4, hauteur: 3 }, { regard: 'moment', vide: true, creature: 'moment' }),
    vue('atelier', 'actuelle', { x: 4, y: 0, largeur: 4, hauteur: 3 }, { feu: 'instant', distance: 0 }),
    vue('galerie', 'connue', { x: 0, y: 3, largeur: 4, hauteur: 3 }),
    vue('embarquement', 'visitee', { x: 4, y: 3, largeur: 4, hauteur: 3 }, { regard: 'longtemps' }),
  ],
  passages: [
    {
      id: 'e-p1',
      nom: 'porte',
      vuDepuis: [ref('salon'), ref('atelier')],
      entre: [ref('salon'), ref('atelier')],
      ouvert: true,
      dessin: 'porte',
      voyant: 'vide',
      emplacement: { type: 'mur', axe: 'v', ligne: 4, rang: 1 },
    },
    {
      id: 'e-p2',
      nom: 'cloison',
      vuDepuis: [ref('salon')],
      entre: [ref('salon'), ref('galerie')],
      ouvert: false,
      dessin: 'porte',
      voyant: 'air',
      emplacement: { type: 'mur', axe: 'h', ligne: 3, rang: 1 },
    },
    { id: 'e-p3', nom: 'grille', vuDepuis: [ref('atelier')], entre: null, ouvert: false, dessin: 'tirets', voyant: null, emplacement: { type: 'mur', axe: 'h', ligne: 3, rang: 5 } },
  ],
  capsules: [{ objet: { sorte: 'objet', id: 'e-capsule', nom: 'capsule' }, piece: ref('embarquement'), pan: { cote: 'bas', debut: 4, fin: 8 } }],
  aBord: null,
};

/** Texte de la page, sans balises ni attributs. */
function texte(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function plan(carte: CartePublique = CARTE, position: Vue = { zoom: 1, x: 0, y: 0 }): string {
  return renderToStaticMarkup(
    <PlanCarte carte={carte} textes={textes} vue={position} casePx={34} zoomMin={0.5} changerVue={rien} toucher={rien} ouverte={null} />,
  );
}

describe('écran de la carte (14 §2)', () => {
  it('plan : chaque pièce connue est un bouton nommé, avec son statut ; aucun chiffre', () => {
    const html = plan();
    expect(html.match(/<button/g)).toHaveLength(4);
    expect(html).toContain('data-statut="actuelle"');
    expect(html).toContain('aria-label="Atelier maintenance, vous êtes ici, FEU, vu à l’instant"');
    expect(html).toContain('aria-label="Local technique, pas encore visitée"');
    expect(texte(html)).toContain('@ VOUS');
    expect(texte(html)).not.toMatch(/\d/);
  });

  it('états par motif et étiquette : hachures et FEU, points et VIDE ○, losange et CRÉATURE (D-209)', () => {
    const html = plan();
    expect(html.match(/url\(#carte-hachures\)/g)).toHaveLength(1);
    expect(html.match(/url\(#carte-points\)/g)).toHaveLength(1);
    expect(html.match(/class="losange"/g)).toHaveLength(1);
    for (const etiquette of ['FEU', 'VIDE ○', 'CRÉATURE']) expect(texte(html)).toContain(etiquette);
  });

  it('portes : ouverture, trait fin si fermée, tirets, voyants d’air, « ? » ; capsule arrimée dehors (14 §2.6)', () => {
    const html = plan();
    expect(html.match(/class="ouverture"/g)).toHaveLength(3);
    expect(html.match(/class="ouverture-fermee"/g)).toHaveLength(1);
    expect(html.match(/class="ouverture-tirets"/g)).toHaveLength(1);
    expect(html).toContain('class="voyant voyant-vide"');
    expect(html).toContain('class="voyant voyant-air"');
    expect(html).toContain('>?</text>');
    expect(html.match(/class="capsule"/g)).toHaveLength(1);
  });

  it('réduite, la carte garde murs et motifs, et efface les noms qui ne tiennent plus (14 §2.3)', () => {
    const html = plan(CARTE, { zoom: 0.5, x: 0, y: 0 });
    expect(texte(html)).not.toContain('MAINTENANCE');
    expect(html.match(/url\(#carte-hachures\)/g)).toHaveLength(1);
    expect(html.match(/<button/g)).toHaveLength(4);
  });

  it('AR-01 au départ : le salon de transit et ses deux sorties, rien d’autre (K-01)', () => {
    const carte = observer(AR01, nouvellePartie(AR01, { version: 'v', graine: 1 }).etat).carte;
    const html = plan(carte);
    expect(html.match(/<button/g)).toHaveLength(3);
    expect(texte(html)).toContain('SALON DE TRANSIT');
  });

  it('vue LISTE : les mêmes mots que la commande carte de la CLI (K-07)', () => {
    const blocs = rendreListeCarte(textes, CARTE);
    const lu = texte(renderToStaticMarkup(<ListeCarte blocs={blocs} />));
    for (const bloc of blocs) {
      expect(lu).toContain(bloc.titre);
      for (const entree of bloc.entrees) {
        expect(lu).toContain(entree.titre);
        expect(lu).toContain(entree.details.join(' · '));
      }
    }
  });

  it('fiche : le nom, l’état vu, les objets vus ; rien d’autre, aucun « aller ici » (14 §2.7)', () => {
    const atelier = CARTE.pieces[1] as PieceCarte;
    const html = renderToStaticMarkup(<FicheCarte fiche={ficheDe(textes, atelier)} ancre={{} as HTMLElement} fermer={rien} />);
    expect(html).toContain('role="dialog"');
    // En-tête de la bulle partagée : le titre, puis « ✕ » (nommé « Fermer » par un attribut) ; puis le corps.
    expect(texte(html)).toBe('ATELIER MAINTENANCE ✕ @ vous ── ÉTAT VU ── FEU, vu à l’instant ── OBJETS VUS ── aucun objet');
    const galerie = CARTE.pieces[2] as PieceCarte;
    expect(texte(renderToStaticMarkup(<FicheCarte fiche={ficheDe(textes, galerie)} ancre={{} as HTMLElement} fermer={rien} />))).not.toContain('OBJETS VUS');
  });

  it('écran : dialogue plein écran, CARTE // RELEVÉ, LISTE, FERMER LA CARTE ; plan nommé pour le lecteur d’écran', () => {
    const html = renderToStaticMarkup(<EcranCarte carte={CARTE} textes={textes} fermer={rien} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    for (const mot of ['CARTE // RELEVÉ', 'LISTE', 'FERMER LA CARTE']) expect(texte(html)).toContain(mot);
    expect(html).toContain('aria-label="Plan de la station ; vous êtes dans l’atelier maintenance. La vue liste dit la même chose en texte."');
  });

  it('monde sans plan : la carte s’ouvre en liste, sans bouton PLAN', () => {
    const sansPlan: CartePublique = { ...CARTE, pieces: CARTE.pieces.map((piece) => ({ ...piece, rect: null })), capsules: [] };
    const lu = texte(renderToStaticMarkup(<EcranCarte carte={sansPlan} textes={textes} fermer={rien} />));
    expect(lu).toContain('CARTE // LISTE');
    expect(lu).toContain('── ICI ──');
    expect(lu).not.toMatch(/\bPLAN\b/);
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run app/carte/carte.test.tsx`
Expected : FAIL, modules introuvables.

- [ ] **Step 3 : écrire le plan dessiné**

Créer `app/carte/PlanCarte.tsx` :

```tsx
import { useRef, type PointerEvent, type WheelEvent } from 'react';
import type { CartePublique, PassageCarte, PieceCarte } from '../../engine';
import { libellePiece, nomDe, regardDe, type TextesMonde } from '../../content';
import { pointsTrace, rectCapsule, segmentOuverture } from './dessin';
import { enPixels, etiquettes, glisser, pincer, SEUIL_GLISSER_PX, TEXTE_MARQUE, zoneTouchable, type Point, type Vue } from './vue';

export interface PropsPlan {
  readonly carte: CartePublique;
  readonly textes: TextesMonde;
  readonly vue: Vue;
  /** Une case au zoom 1, mesurée à l'écran : 34 px fois l'échelle du texte (14 §2.3). */
  readonly casePx: number;
  readonly zoomMin: number;
  readonly changerVue: (maj: (vue: Vue) => Vue) => void;
  readonly toucher: (piece: PieceCarte, bouton: HTMLButtonElement) => void;
  /** Pièce dont la fiche est ouverte, par identifiant public. */
  readonly ouverte: string | null;
}

/** Losange de la créature (14 §2.5), avec son point, dans le coin de la pièce. */
function Losange({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g className="losange">
      <polygon points={`${x},${y - 7} ${x + 7},${y} ${x},${y + 7} ${x - 7},${y}`} />
      <circle cx={x} cy={y} r="1.5" />
    </g>
  );
}

/** Ouverture d'un passage (14 §2.6) : dans son mur, ou tracé d'un conduit découvert. */
function Ouverture({ passage, point }: { readonly passage: PassageCarte; readonly point: (x: number, y: number) => Point }) {
  const emplacement = passage.emplacement;
  if (emplacement === null) return null;
  if (emplacement.type === 'trace') {
    const points = pointsTrace(emplacement.cases).map(([x, y]) => {
      const p = point(x, y);
      return `${p.x},${p.y}`;
    });
    return <polyline className="conduit" points={points.join(' ')} />;
  }
  const { x1, y1, x2, y2 } = segmentOuverture(emplacement);
  const a = point(x1, y1);
  const b = point(x2, y2);
  const segment = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  const milieu = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return (
    <g>
      <line className="ouverture" {...segment} />
      {passage.dessin === 'tirets' ? <line className="ouverture-tirets" {...segment} /> : !passage.ouvert && <line className="ouverture-fermee" {...segment} />}
      {passage.voyant !== null && <circle className={`voyant voyant-${passage.voyant}`} cx={milieu.x} cy={milieu.y} r="4" />}
      {passage.entre === null && (
        <text className="ouverture-inconnue" x={milieu.x + 6} y={milieu.y - 6}>
          ?
        </text>
      )}
    </g>
  );
}

/**
 * Plan de pont (14 §2.4 à §2.6) : traits en SVG, pièces en boutons par-dessus. Glisser d'un doigt le parcourt, pincer le zoome
 * (14 §2.3) ; un toucher sans glissement ouvre la fiche d'une pièce. Aucune animation.
 */
export function PlanCarte({ carte, textes, vue, casePx, zoomMin, changerVue, toucher, ouverte }: PropsPlan) {
  const doigts = useRef(new Map<number, Point>());
  const depart = useRef<Point | null>(null);
  const glisse = useRef(false);
  const echelle = casePx * vue.zoom;
  const point = (x: number, y: number): Point => ({ x: vue.x + x * echelle, y: vue.y + y * echelle });

  const appuyer = (evenement: PointerEvent<HTMLDivElement>): void => {
    doigts.current.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
    if (doigts.current.size === 1) {
      glisse.current = false;
      depart.current = { x: evenement.clientX, y: evenement.clientY };
    }
  };
  const bouger = (evenement: PointerEvent<HTMLDivElement>): void => {
    const avant = doigts.current.get(evenement.pointerId);
    if (avant === undefined) return;
    const maintenant = { x: evenement.clientX, y: evenement.clientY };
    const autre = [...doigts.current].find(([id]) => id !== evenement.pointerId)?.[1];
    if (autre === undefined) {
      const origine = depart.current;
      // Sous le seuil, c'est encore un toucher : il pourra ouvrir une fiche.
      if (!glisse.current && origine !== null && Math.hypot(maintenant.x - origine.x, maintenant.y - origine.y) < SEUIL_GLISSER_PX) return;
      glisse.current = true;
      doigts.current.set(evenement.pointerId, maintenant);
      changerVue((courante) => glisser(courante, maintenant.x - avant.x, maintenant.y - avant.y));
      return;
    }
    glisse.current = true;
    doigts.current.set(evenement.pointerId, maintenant);
    const ecartAvant = Math.hypot(avant.x - autre.x, avant.y - autre.y);
    if (ecartAvant === 0) return;
    const facteur = Math.hypot(maintenant.x - autre.x, maintenant.y - autre.y) / ecartAvant;
    const boite = evenement.currentTarget.getBoundingClientRect();
    const centre = { x: (maintenant.x + autre.x) / 2 - boite.left, y: (maintenant.y + autre.y) / 2 - boite.top };
    changerVue((courante) => pincer(courante, facteur, centre, zoomMin));
  };
  const lever = (evenement: PointerEvent<HTMLDivElement>): void => {
    doigts.current.delete(evenement.pointerId);
  };
  // Molette, ou pincement d'un pavé tactile : le même zoom, autour du pointeur.
  const molette = (evenement: WheelEvent<HTMLDivElement>): void => {
    const boite = evenement.currentTarget.getBoundingClientRect();
    const centre = { x: evenement.clientX - boite.left, y: evenement.clientY - boite.top };
    const facteur = evenement.deltaY < 0 ? 1.1 : 1 / 1.1;
    changerVue((courante) => pincer(courante, facteur, centre, zoomMin));
  };

  return (
    <div className="carte-plan" onPointerDown={appuyer} onPointerMove={bouger} onPointerUp={lever} onPointerCancel={lever} onWheel={molette}>
      <svg className="carte-traits" aria-hidden="true">
        <defs>
          <pattern id="carte-hachures" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect className="motif-feu" width="3" height="8" />
          </pattern>
          <pattern id="carte-points" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle className="motif-vide" cx="4" cy="4" r="1.5" />
          </pattern>
        </defs>
        {carte.pieces.map((piece) => {
          if (piece.rect === null) return null;
          const { gauche, haut, largeur, hauteur } = enPixels(piece.rect, vue, casePx);
          const forme = { x: gauche, y: haut, width: largeur, height: hauteur };
          return (
            <g key={piece.piece.id}>
              {piece.statut !== 'connue' && <rect className="sol" {...forme} />}
              {piece.feu !== null && <rect className="motif" fill="url(#carte-hachures)" {...forme} />}
              {piece.vide && <rect className="motif" fill="url(#carte-points)" {...forme} />}
              <rect className={`mur mur-${piece.statut}`} {...forme} />
              {piece.creature !== null && <Losange x={gauche + largeur - 12} y={haut + 12} />}
            </g>
          );
        })}
        {carte.capsules.map((capsule) => {
          const salle = carte.pieces.find((piece) => piece.piece.id === capsule.piece.id)?.rect;
          if (salle === null || salle === undefined) return null;
          const { gauche, haut, largeur, hauteur } = enPixels(rectCapsule(salle, capsule.pan), vue, casePx);
          return <rect key={capsule.objet.id} className="capsule" x={gauche} y={haut} width={largeur} height={hauteur} rx={Math.min(largeur, hauteur) / 2} />;
        })}
        {carte.passages.map((passage) => (
          <Ouverture key={passage.id} passage={passage} point={point} />
        ))}
      </svg>
      {carte.pieces.map((piece) => {
        if (piece.rect === null) return null;
        const cible = zoneTouchable(enPixels(piece.rect, vue, casePx));
        const textesPiece = etiquettes(piece, nomDe(textes, piece.piece).texte, regardDe(piece), vue.zoom);
        return (
          <button
            key={piece.piece.id}
            type="button"
            className="carte-piece"
            data-statut={piece.statut}
            aria-label={libellePiece(textes, piece)}
            aria-haspopup="dialog"
            aria-expanded={ouverte === piece.piece.id}
            style={{ left: cible.gauche, top: cible.haut, width: cible.largeur, height: cible.hauteur }}
            // Un clic au clavier (detail 0) ouvre toujours ; un toucher qui a glissé n'ouvre rien.
            onClick={(evenement) => {
              if (evenement.detail > 0 && glisse.current) return;
              toucher(piece, evenement.currentTarget);
            }}
          >
            <span className="carte-textes" aria-hidden="true">
              {textesPiece.nom.map((ligne) => (
                <span key={ligne} className="carte-nom">
                  {ligne}
                </span>
              ))}
              {textesPiece.etats.map((ligne) => (
                <span key={ligne.join(' ')} className="carte-etats">
                  {ligne.map((marque) => (
                    <span key={marque} className="carte-etiquette" data-marque={marque}>
                      {TEXTE_MARQUE[marque]}
                    </span>
                  ))}
                </span>
              ))}
              {textesPiece.anciennete.map((ligne) => (
                <span key={ligne} className="carte-anciennete">
                  {ligne}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4 : écrire la liste, la fiche et l'écran**

Créer `app/carte/ListeCarte.tsx` :

```tsx
import { MOTS_CARTE, type BlocListe } from '../../content';

/** Vue LISTE (14 §2.8) : le même contenu que le plan, en texte, pour le lecteur d'écran et les grandes tailles de texte. */
export function ListeCarte({ blocs }: { readonly blocs: readonly BlocListe[] }) {
  return (
    <div className="carte-liste">
      {blocs.map((bloc) => (
        <section key={bloc.titre} className="carte-bloc" aria-label={bloc.titre}>
          <h3 className="carte-bloc-titre">{`── ${bloc.titre} ──`}</h3>
          {bloc.entrees.length === 0 ? (
            <p className="carte-aucune">{MOTS_CARTE.aucune}</p>
          ) : (
            <ul>
              {bloc.entrees.map((entree, index) => (
                <li key={index}>
                  <span className="carte-entree-titre">{entree.titre}</span>
                  {entree.details.length > 0 && <span className="carte-entree-details">{` ${entree.details.join(' · ')}`}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
```

Créer `app/carte/FicheCarte.tsx` :

```tsx
import { MOTS_CARTE, type FicheTexte } from '../../content';
import { BulleAncree } from '../bulle';

/** Fiche d'une pièce (14 §2.7, D-210) : bulle ancrée sur la pièce, gratuite ; le nom, l'état vu, les objets vus, rien d'autre. */
export function FicheCarte({ fiche, ancre, fermer }: { readonly fiche: FicheTexte; readonly ancre: HTMLElement; readonly fermer: () => void }) {
  return (
    <BulleAncree ancre={ancre} classe="bulle-objet bulle-carte" etape={fiche.titre} titre={fiche.titre} fermer={fermer}>
      <p className="fiche-sous-titre">{fiche.sousTitre}</p>
      {fiche.etats.length > 0 && (
        <>
          <p className="fiche-section">{MOTS_CARTE.etatVu}</p>
          <ul className="fiche-liste">
            {fiche.etats.map((etat) => (
              <li key={etat}>{etat}</li>
            ))}
          </ul>
        </>
      )}
      {fiche.objets !== null && (
        <>
          <p className="fiche-section">{MOTS_CARTE.objetsVus}</p>
          <ul className="fiche-liste">
            {fiche.objets.map((objet, index) => (
              <li key={index}>{objet}</li>
            ))}
          </ul>
        </>
      )}
    </BulleAncree>
  );
}
```

Créer `app/carte/EcranCarte.tsx` :

```tsx
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { CartePublique, PieceCarte } from '../../engine';
import { ficheDe, libellePlan, MOTS_CARTE, rendreListeCarte, type TextesMonde } from '../../content';
import { garderFocus } from '../bulle';
import { FicheCarte } from './FicheCarte';
import { ListeCarte } from './ListeCarte';
import { PlanCarte } from './PlanCarte';
import { borner, cadreConnu, vueInitiale, zoomMin, type Taille, type Vue } from './vue';

/** Fiche ouverte : la pièce, par identifiant public, et son bouton, qui reprend le focus à la fermeture (12 §7). */
interface FicheOuverte {
  readonly piece: string;
  readonly ancre: HTMLButtonElement;
}

interface Mesure {
  readonly taille: Taille;
  readonly casePx: number;
}

/** Zone du plan : mesure sa taille et la case à l'échelle du texte ; s'ouvre centrée sur la pièce actuelle (D-205). */
function ZonePlan({
  carte,
  textes,
  ouverte,
  toucher,
}: {
  readonly carte: CartePublique;
  readonly textes: TextesMonde;
  readonly ouverte: string | null;
  readonly toucher: (piece: PieceCarte, bouton: HTMLButtonElement) => void;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const etalon = useRef<HTMLDivElement>(null);
  const [mesure, setMesure] = useState<Mesure | null>(null);
  const [vue, setVue] = useState<Vue | null>(null);
  const cadre = cadreConnu(carte);
  useLayoutEffect(() => {
    const element = zone.current;
    const reference = etalon.current;
    if (element === null || reference === null) return;
    // La taille de la zone et l'échelle du texte se lisent à l'écran ; l'observateur les relit quand elles changent.
    const observateur = new ResizeObserver(() => {
      const boite = element.getBoundingClientRect();
      const casePx = reference.getBoundingClientRect().width;
      if (casePx > 0) setMesure({ taille: { largeur: boite.width, hauteur: boite.height }, casePx });
    });
    observateur.observe(element);
    observateur.observe(reference);
    return () => observateur.disconnect();
  }, []);
  const initiale = mesure === null ? null : vueInitiale(carte, mesure.taille, mesure.casePx);
  const affichee = vue ?? initiale;
  const minimum = cadre === null || mesure === null ? 1 : zoomMin(cadre, mesure.taille, mesure.casePx);
  const changerVue = (maj: (courante: Vue) => Vue): void => {
    if (cadre === null || mesure === null || initiale === null) return;
    setVue((courante) => borner(maj(courante ?? initiale), cadre, mesure.taille, mesure.casePx));
  };
  return (
    <div ref={zone} className="carte-zone" role="group" aria-label={libellePlan(textes, carte)}>
      <div ref={etalon} className="carte-etalon" aria-hidden="true" />
      {mesure !== null && affichee !== null && (
        <PlanCarte carte={carte} textes={textes} vue={affichee} casePx={mesure.casePx} zoomMin={minimum} changerVue={changerVue} toucher={toucher} ouverte={ouverte} />
      )}
    </div>
  );
}

/**
 * Carte (14 §2) : plein écran vert, plan ou liste ; l'ouvrir, la parcourir et la fermer sont gratuits (D-014). FERMER LA CARTE,
 * Échap ou le retour système la referment ; une fiche ouverte se ferme d'abord.
 */
export function EcranCarte({ carte, textes, fermer }: { readonly carte: CartePublique; readonly textes: TextesMonde; readonly fermer: () => void }) {
  const avecPlan = carte.pieces.some((piece) => piece.rect !== null);
  const [mode, setMode] = useState<'plan' | 'liste'>(avecPlan ? 'plan' : 'liste');
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const zone = useRef<HTMLElement>(null);
  const idTitre = useId();
  useLayoutEffect(() => {
    zone.current?.focus();
  }, []);
  const fermerFiche = (): void => {
    const ancre = fiche?.ancre;
    setFiche(null);
    ancre?.focus();
  };
  const ouverte = fiche === null ? undefined : carte.pieces.find((piece) => piece.piece.id === fiche.piece);
  return (
    <section
      ref={zone}
      className="carte"
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitre}
      tabIndex={-1}
      onKeyDown={(evenement) => {
        // La fiche a traité la touche (Échap, Tab à ses bords) ; sinon une fiche ouverte se ferme avant la carte.
        if (evenement.defaultPrevented) return;
        if (fiche === null) {
          garderFocus(evenement, fermer);
        } else if (evenement.key === 'Escape') {
          evenement.preventDefault();
          fermerFiche();
        }
      }}
    >
      <header className="carte-entete">
        <h2 id={idTitre} className="carte-titre">
          {mode === 'plan' ? MOTS_CARTE.titrePlan : MOTS_CARTE.titreListe}
        </h2>
        {avecPlan && (
          <button
            type="button"
            className="carte-bascule"
            onClick={() => {
              setFiche(null);
              setMode(mode === 'plan' ? 'liste' : 'plan');
            }}
          >
            {mode === 'plan' ? MOTS_CARTE.liste : MOTS_CARTE.plan}
          </button>
        )}
      </header>
      {mode === 'plan' ? (
        <ZonePlan carte={carte} textes={textes} ouverte={fiche?.piece ?? null} toucher={(piece, ancre) => setFiche({ piece: piece.piece.id, ancre })} />
      ) : (
        <ListeCarte blocs={rendreListeCarte(textes, carte)} />
      )}
      <button type="button" className="carte-fermer" onClick={fermer}>
        {MOTS_CARTE.fermer}
      </button>
      {fiche !== null && ouverte !== undefined && (
        <>
          <div className="voile carte-voile" data-testid="voile-carte" onClick={fermerFiche} />
          <FicheCarte fiche={ficheDe(textes, ouverte)} ancre={fiche.ancre} fermer={fermerFiche} />
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 5 : jetons et styles**

Dans `app/styles.css`, dans `:root`, après `--blanc-surface: #0a0e0f;` :

```css
  /* Carte (14 §2.2, D-211) : vert phosphore, propre à la carte comme le cyan à l'inventaire et le blanc à IA Station. */
  --vert-fond: #050a06;
  --vert-surface: #0b140d;
  --vert: #5cff7a;
  --vert-texte: #a6f5b0;
  --vert-secondaire: #62b06d;
  --vert-signal: #ddffb8;
  --vert-bordure: #3e7046;
  --vert-separateur: #1f3a24;
```

Remplacer le commentaire `/* IA STATION à sa place, la troisième : CARTE viendra au milieu (12 §4.3). */` par `/* IA STATION à sa place, la troisième ; CARTE au milieu (12 §4.3, 14 §2.1). */`, et ajouter après le bloc `.navigation .nav-ia[aria-expanded='true'] { … }` :

```css
.navigation .nav-carte {
  grid-column: 2;
}

.navigation .nav-carte[aria-expanded='true'] {
  color: var(--vert-texte);
  border-color: var(--vert);
  box-shadow: inset 0 0 0 1px var(--vert);
}
```

En fin de fichier :

```css
/* Carte (14 §2) : plein écran vert, au-dessus du jeu ; ni transition ni glissement animé (14 §2.3). */
.carte {
  position: fixed;
  inset: 0;
  z-index: 9;
  display: flex;
  flex-direction: column;
  max-width: 30rem;
  margin: 0 auto;
  color: var(--vert-texte);
  background: var(--vert-fond);
}

.carte:focus {
  outline: none;
}

.carte :focus-visible {
  outline: 2px solid var(--vert-signal);
  outline-offset: 2px;
}

.carte-entete {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px 8px;
  border-bottom: 1px solid var(--vert-separateur);
}

.carte-titre {
  margin: 0;
  font-size: calc(17px * var(--echelle));
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--vert);
}

.carte-bascule {
  min-width: 44px;
  min-height: 44px;
  padding: 4px 12px;
  font: inherit;
  font-size: calc(13px * var(--echelle));
  letter-spacing: 0.04em;
  color: var(--vert-texte);
  background: transparent;
  border: 1px solid var(--vert-bordure);
}

.carte-zone {
  position: relative;
  flex: 1;
  overflow: hidden;
  touch-action: none;
}

.carte-etalon {
  position: absolute;
  width: calc(34px * var(--echelle));
  height: 0;
  visibility: hidden;
}

.carte-plan {
  position: absolute;
  inset: 0;
}

.carte-traits {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.carte-traits .sol {
  fill: var(--vert-surface);
}

.carte-traits .mur {
  fill: none;
  stroke: var(--vert-secondaire);
  stroke-width: 2;
}

.carte-traits .mur-actuelle {
  stroke: var(--vert);
  stroke-width: 3;
}

.carte-traits .mur-connue {
  stroke: var(--vert-bordure);
  stroke-dasharray: 6 4;
}

.carte-traits .motif-feu {
  fill: var(--vert);
  opacity: 0.22;
}

.carte-traits .motif-vide {
  fill: var(--vert-signal);
}

.carte-traits .ouverture {
  stroke: var(--vert-fond);
  stroke-width: 5;
}

.carte-traits .ouverture-fermee {
  stroke: var(--vert-texte);
  stroke-width: 1;
}

.carte-traits .ouverture-tirets,
.carte-traits .conduit {
  fill: none;
  stroke: var(--vert-secondaire);
  stroke-width: 2;
  stroke-dasharray: 3 3;
}

.carte-traits .ouverture-inconnue {
  font-size: calc(12px * var(--echelle));
  font-weight: 600;
  fill: var(--vert-texte);
}

.carte-traits .voyant-air {
  fill: var(--vert-signal);
}

.carte-traits .voyant-vide {
  fill: var(--vert-fond);
  stroke: var(--vert-signal);
  stroke-width: 1.5;
}

.carte-traits .capsule {
  fill: none;
  stroke: var(--vert-secondaire);
  stroke-width: 2;
}

.carte-traits .losange polygon {
  fill: none;
  stroke: var(--vert);
  stroke-width: 2;
}

.carte-traits .losange circle {
  fill: var(--vert);
}

.carte-piece {
  position: absolute;
  display: block;
  padding: calc(8px * var(--echelle));
  overflow: hidden;
  text-align: left;
  font: inherit;
  color: var(--vert-texte);
  background: transparent;
  border: none;
}

.carte-piece[aria-expanded='true'] {
  outline: 2px solid var(--vert-signal);
  outline-offset: -2px;
}

.carte-textes {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.carte-nom,
.carte-etiquette {
  font-size: calc(13px * var(--echelle));
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.carte-nom {
  line-height: calc(17px * var(--echelle));
}

.carte-piece[data-statut='actuelle'] .carte-nom {
  color: var(--vert);
}

.carte-piece[data-statut='connue'] .carte-nom {
  color: var(--vert-secondaire);
}

.carte-etats {
  display: flex;
  gap: calc(8px * var(--echelle));
  line-height: calc(17px * var(--echelle));
}

/* Étiquettes d'état en vidéo inverse (14 §2.5) ; « @ VOUS » en vert, sans fond. */
.carte-etiquette {
  color: var(--vert-fond);
  background: var(--vert);
}

.carte-etiquette[data-marque='vide'] {
  background: var(--vert-signal);
}

.carte-etiquette[data-marque='vous'] {
  color: var(--vert);
  background: none;
}

.carte-anciennete {
  font-size: calc(12px * var(--echelle));
  line-height: calc(17px * var(--echelle));
  color: var(--vert-secondaire);
  white-space: nowrap;
}

.carte-liste {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.carte-bloc-titre {
  margin: 12px 0 4px;
  font-size: calc(13px * var(--echelle));
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--vert-secondaire);
}

.carte-liste ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.carte-liste li {
  padding: 4px 0;
  font-size: calc(15px * var(--echelle));
  border-bottom: 1px solid var(--vert-separateur);
}

.carte-entree-titre {
  font-weight: 600;
}

.carte-entree-details,
.carte-aucune {
  color: var(--vert-secondaire);
}

.carte-aucune {
  margin: 0;
}

.carte-fermer {
  flex: none;
  min-height: 50px;
  margin: 8px 16px max(16px, env(safe-area-inset-bottom));
  font: inherit;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--vert-fond);
  background: var(--vert);
  border: none;
}

.carte-voile {
  z-index: 6;
}

/* Fiche d'une pièce : la bulle des puces, en vert (D-211). */
.bulle-carte {
  --couleur-menu: var(--vert);
  --texte-menu: var(--vert-texte);
  --secondaire-menu: var(--vert-secondaire);
  --surface-menu: var(--vert-surface);
  --filet-menu: var(--vert-separateur);
}

.fiche-sous-titre,
.fiche-section {
  margin: 0;
  color: var(--vert-secondaire);
}

.fiche-section {
  margin-top: 8px;
  font-size: calc(12px * var(--echelle));
  letter-spacing: 0.04em;
}

.fiche-liste {
  margin: 0;
  padding: 0;
  list-style: none;
}
```

- [ ] **Step 5b : lancer les tests**

Run : `npx vitest run app/carte`
Expected : PASS, 15 tests (6 de la vue, 9 de l'écran).

- [ ] **Step 6 : lint, types, commit**

Run : `npx eslint app --max-warnings 0 && npx tsc -b && npm run check:imports`
Expected : aucune erreur, aucun avertissement des règles React.

```bash
git add app/carte/PlanCarte.tsx app/carte/ListeCarte.tsx app/carte/FicheCarte.tsx app/carte/EcranCarte.tsx app/carte/carte.test.tsx app/styles.css
git commit -m "#97 : écran de la carte (plan, gestes, fiche, liste) en vert phosphore"
```

---

### Task 5 : bouton CARTE dans la navigation

**Files :**
- Modify : `app/EcranJeu.tsx` (constantes de navigation, type `Ouverte`, voile, rendu, `<nav>`), `app/EcranJeu.test.tsx`

**Interfaces :**
- Consumes : tâche 4 (`EcranCarte`).
- Produces : bouton `.nav-carte` (« Carte », colonne 2) qui ouvre `EcranCarte` par `ouvrir({ zone: 'carte' }, bouton)` ; `fermer` et le retour système la referment et rendent le focus au bouton.

- [ ] **Step 1 : mettre le test de navigation à jour**

Dans `app/EcranJeu.test.tsx`, remplacer le test « navigation : INVENTAIRE et IA STATION, … » par :

```tsx
  it('navigation : INVENTAIRE, CARTE et IA STATION, boutons texte sans pictogramme qui ouvrent une bulle ou une fenêtre', async () => {
    const nav = entre(rendre(await commencer(env), undefined, true, ['reveil']), '<nav', '</nav>');
    expect(nav.match(/<button/g)).toHaveLength(3);
    // Coupure possible à la syllabe en texte agrandi (trait d'union conditionnel), invisible sinon.
    expect(texte(nav)).toBe('Inven­taire Carte IA Sta­tion');
    expect(nav.match(/aria-haspopup="dialog" aria-expanded="false"/g)).toHaveLength(3);
    expect(nav).toContain('class="nav-carte"');
    expect(nav).not.toMatch(/<svg|<img/);
  });
```

Dans le test « pendant l’enregistrement d’une action, aucune bulle ne s’ouvre sur l’état d’avant (C-01 §4) », CARTE compte parmi les boutons qui ouvrent un dialogue, désactivés pendant l'enregistrement ; remplacer :

```tsx
    // Carnet, porte, grille, « → ATELIER » (ouverte), INVENTAIRE et IA STATION ; « ⊘ SOUTE » n'ouvre rien.
    expect(ouvrants).toHaveLength(6);
```

par :

```tsx
    // Carnet, porte, grille, « → ATELIER » (ouverte), INVENTAIRE, CARTE et IA STATION ; « ⊘ SOUTE » n'ouvre rien.
    expect(ouvrants).toHaveLength(7);
```

- [ ] **Step 2 : lancer le test, constater l'échec**

Run : `npx vitest run app/EcranJeu.test.tsx -t "navigation|enregistrement"`
Expected : FAIL (deux boutons de navigation au lieu de trois ; six boutons ouvrants au lieu de sept).

- [ ] **Step 3 : brancher la carte**

Dans `app/EcranJeu.tsx` :

1. Ajouter l'import `import { EcranCarte } from './carte/EcranCarte';`.
2. Après `const NAV_IA = 'IA Sta­tion';`, ajouter `const NAV_CARTE = 'Carte';`.
3. Dans le type `Ouverte`, ajouter le membre `| { readonly zone: 'carte' }` et compléter son commentaire : « … ou la fenêtre d'IA Station, ou la carte (14 §2.1). »
4. Remplacer `{ouverte !== null && (` qui précède le `<div className={… 'voile' …}` par `{ouverte !== null && ouverte.zone !== 'carte' && (` : la carte occupe tout l'écran, sans voile.
5. Après la ligne `{ouverte?.zone === 'ia' && <ModaleIA … />}`, ajouter :

```tsx
      {/* Carte (14 §2) : gratuite (D-014) ; elle ne lit que l'observation publique. */}
      {ouverte?.zone === 'carte' && <EcranCarte carte={observation.carte} textes={textes} fermer={fermer} />}
```

6. Dans `<nav className="navigation" …>`, entre le bouton `nav-inventaire` et le commentaire du bouton `nav-ia`, ajouter :

```tsx
          <button
            type="button"
            className="nav-carte"
            aria-haspopup="dialog"
            aria-expanded={ouverte?.zone === 'carte'}
            aria-label="Carte"
            disabled={occupe}
            onClick={(evenement) => ouvrir({ zone: 'carte' }, evenement.currentTarget)}
          >
            {NAV_CARTE}
          </button>
```

- [ ] **Step 4 : lancer les tests de l'appli, lint, types**

Run : `npx vitest run app && npx eslint app --max-warnings 0 && npx tsc -b`
Expected : PASS ; aucune erreur.

- [ ] **Step 5 : essai dans le navigateur**

Run : `npm run build && npx vite preview` puis ouvrir l'adresse affichée dans le navigateur intégré en 390 × 844 : nouvelle partie, CARTE, glisser, LISTE, PLAN, toucher une pièce visitée, ✕, FERMER LA CARTE. Le récit et le dock sont inchangés après fermeture.

- [ ] **Step 6 : commit**

```bash
git add app/EcranJeu.tsx app/EcranJeu.test.tsx
git commit -m "#97 : bouton CARTE au milieu de la navigation"
```

---

### Task 6 : captures de la carte sur téléphone simulé

**Files :**
- Modify : `tools/captures.ts`

**Interfaces :**
- Consumes : tâches 4 et 5 (sélecteurs `.nav-carte`, `.carte`, `.carte-piece[data-statut]`, `.voyant`, dialogues nommés par `MOTS_CARTE`).
- Produces : suite de captures `'carte'` et section « Carte (#97) » du commentaire de PR.

- [ ] **Step 1 : écrire le parcours de la carte**

Dans `tools/captures.ts` :

1. Ajouter `MOTS_CARTE` à l'import depuis `'../content'`.
2. Dans `EtapeCapture`, ajouter `'carte'` à l'union de `suite`.
3. Avant `/** Plans des stations (14 §4.3) : … */`, ajouter :

```ts
/** Aucun chiffre sur la carte, aucun texte qui déborde de sa pièce, puis les règles de tout écran : cibles de 44 px, pas de débordement (12 §1, §7). */
async function verifierCarte(page: Page, ou: string, erreurs: string[]): Promise<void> {
  if (/\d/.test(await page.locator('.carte').innerText())) erreurs.push(`${ou} : un chiffre est affiché sur la carte.`);
  const debordent = await page
    .locator('.carte-piece')
    .evaluateAll((boutons) =>
      boutons.filter((bouton) => bouton.scrollWidth > bouton.clientWidth + 1 || bouton.scrollHeight > bouton.clientHeight + 1).map((bouton) => bouton.getAttribute('aria-label') ?? ''),
    );
  for (const piece of debordent) erreurs.push(`${ou} : le texte de « ${piece} » déborde de sa pièce (PL-04).`);
  await verifierEcran(page, ou, erreurs);
}

/**
 * Carte (#97, 14 §2) : au départ d'AR-01 puis après les cinq premiers pas de P-C (le passager est au local énergie) ; glisser,
 * fiche au clavier, liste, retour système, texte très grand ; AR-02 pour les voyants d'air. Gratuite (D-014).
 */
async function parcoursCarte(navigateur: Browser, racine: string, ar01: EntreeMonde, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const etapes = ar01.parcours.find((parcours) => parcours.nom.startsWith('P-C'))?.etapes;
  if (etapes === undefined) {
    erreurs.push('Parcours P-C absent d’AR-01.');
    return;
  }
  const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const page = await contexte.newPage();
  await page.goto(racine);
  await nouvelleDepuisAccueil(page);
  const bouton = page.locator('.nav-carte');
  const carte = page.getByRole('dialog', { name: MOTS_CARTE.titrePlan });
  const focusSur = (cible: Locator): Promise<boolean> => cible.evaluate((element) => element === document.activeElement);
  // La zone du plan se mesure après l'ouverture : on attend les pièces dessinées avant de compter ou de capturer.
  const ouvrirCarte = async (): Promise<void> => {
    await bouton.click();
    await carte.locator('.carte-piece').first().waitFor();
  };

  // Départ : le salon et ses deux sorties (K-01) ; fermer par Échap ne change rien et rend le focus à CARTE.
  const avant = await partieEnregistree(page);
  await ouvrirCarte();
  await capturer(page, 'Carte — départ d’AR-01');
  await verifierCarte(page, 'Carte, départ', erreurs);
  const pieces = await carte.locator('.carte-piece').count();
  if (pieces !== 3) erreurs.push(`Carte, départ : ${pieces} pièces au lieu de trois (salon, atelier, local technique).`);
  await page.keyboard.press('Escape');
  await carte.waitFor({ state: 'detached' });
  if (!(await focusSur(bouton))) erreurs.push('Carte fermée par Échap : le focus ne revient pas sur CARTE.');
  // Retour système : même chose.
  await ouvrirCarte();
  await page.evaluate(() => window.history.back());
  await carte.waitFor({ state: 'detached' });
  if (!(await focusSur(bouton))) erreurs.push('Carte fermée par le retour système : le focus ne revient pas sur CARTE.');
  if ((await partieEnregistree(page)) !== avant) erreurs.push('Carte : l’ouvrir et la fermer a changé la partie (D-014).');

  // Cinq pas de P-C : atelier, burette, caisse sous la grille, grille ouverte puis franchie.
  await rejouer(page, gestesDuParcours(ar01, etapes).slice(0, 5));
  await ouvrirCarte();
  await capturer(page, 'Carte — au local énergie : pièces visitées, connues, panneau « ? »');
  await verifierCarte(page, 'Carte, local énergie', erreurs);

  // Glisser fait parcourir le plan, sans ouvrir de fiche.
  const actuelle = carte.locator('.carte-piece[data-statut="actuelle"]');
  const debut = await actuelle.boundingBox();
  if (debut === null) erreurs.push('Carte : pièce actuelle introuvable.');
  else {
    await page.mouse.move(debut.x + debut.width / 2, debut.y + debut.height / 2);
    await page.mouse.down();
    await page.mouse.move(debut.x + debut.width / 2 - 60, debut.y + debut.height / 2 - 40, { steps: 6 });
    await page.mouse.up();
    const fin = await actuelle.boundingBox();
    if (fin === null || Math.abs(fin.x - (debut.x - 60)) > 2 || Math.abs(fin.y - (debut.y - 40)) > 2) erreurs.push('Carte : glisser ne déplace pas le plan.');
    if ((await page.getByRole('dialog').count()) !== 1) erreurs.push('Carte : un glissement a ouvert une fiche.');
  }

  // Fiche de l'atelier, au clavier ; Échap la ferme et rend le focus à la pièce.
  const atelier = carte.getByRole('button', { name: /^Atelier maintenance, vu/ });
  await atelier.focus();
  await page.keyboard.press('Enter');
  const fiche = page.getByRole('dialog', { name: 'ATELIER MAINTENANCE' });
  await fiche.waitFor();
  await capturer(page, 'Carte — fiche de l’atelier : état vu, objets vus');
  if (!(await fiche.innerText()).includes(MOTS_CARTE.objetsVus)) erreurs.push('Fiche : « OBJETS VUS » absent.');
  await page.keyboard.press('Escape');
  await fiche.waitFor({ state: 'detached' });
  if (!(await focusSur(atelier))) erreurs.push('Fiche fermée : le focus ne revient pas sur la pièce.');

  // Vue LISTE, puis retour au plan et fermeture.
  await carte.getByRole('button', { name: MOTS_CARTE.liste, exact: true }).click();
  await page.getByRole('dialog', { name: MOTS_CARTE.titreListe }).waitFor();
  await capturer(page, 'Carte — vue liste');
  await verifierCarte(page, 'Carte, liste', erreurs);
  await page.getByRole('button', { name: MOTS_CARTE.plan, exact: true }).click();
  await page.getByRole('button', { name: MOTS_CARTE.fermer }).click();
  await carte.waitFor({ state: 'detached' });

  // Texte très grand : noms et étiquettes tiennent ou s'effacent, rien ne déborde.
  await ouvrirOptions(page);
  await choisirTaille(page, 'Très grande');
  await page.getByRole('button', { name: exactement('Reprendre la partie') }).click();
  await page.getByTestId('recit').waitFor();
  await ouvrirCarte();
  await capturer(page, 'Carte — texte très grand');
  await verifierCarte(page, 'Carte, texte très grand', erreurs);
  await page.getByRole('button', { name: MOTS_CARTE.fermer }).click();
  await contexte.close();

  // AR-02 au départ : voyants d'air sur les portes étanches (OP-04).
  const autre = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const page02 = await autre.newPage();
  await page02.goto(`${racine}?monde=ar-02`);
  await nouvelleDepuisAccueil(page02);
  await page02.locator('.nav-carte').click();
  await page02.getByRole('dialog', { name: MOTS_CARTE.titrePlan }).locator('.carte-piece').first().waitFor();
  if ((await page02.locator('.carte .voyant').count()) === 0) erreurs.push('AR-02 : aucun voyant d’air sur la carte.');
  await capturer(page02, 'Carte — départ d’AR-02 : voyants d’air');
  await verifierCarte(page02, 'Carte, AR-02', erreurs);
  await autre.close();
}
```

4. Dans `commentaire(...)`, ajouter le paramètre `erreursCarte: readonly string[],` après `erreursPlans: readonly string[],` et, avant la partie « Plans des stations (#97) » :

```ts
    ...partieCommentaire(
      'Carte (#97)',
      etapes.filter((etape) => etape.suite === 'carte'),
      erreursCarte,
      ['AR-01 au départ et au local énergie (cinq pas de P-C), fiche, liste, texte très grand ; AR-02 au départ. **Validation humaine requise** sur téléphone : lisibilité, gestes, bornes du zoom (14 §9).'],
    ),
```

5. Dans `capturer()` : déclarer `const erreursCarte: string[] = [];` ; après le bloc d'AR-02 et avant celui des plans :

```ts
    // Carte (#97) : AR-01 puis AR-02, dans des contextes neufs.
    suite = 'carte';
    try {
      await parcoursCarte(navigateur, racine, ar01, capturerPage, erreursCarte);
    } catch (erreur) {
      erreursCarte.push(erreur instanceof Error ? erreur.message : String(erreur));
    }
```

puis ajouter `erreursCarte` à `resultat`, à l'appel de `commentaire(...)` (après `erreursPlans`) et au `return` (`...erreursCarte.map((erreur) => \`Carte : ${erreur}\`)`).

- [ ] **Step 2 : lancer les captures et regarder chaque image**

Run : `npm run build && npm run captures`
Expected : « Captures : … réussis » ; six images « Carte — … » dans `captures/`. Regarder chacune : pièce actuelle centrée à l'ouverture, murs et étiquettes lisibles, « ? » sur le panneau vu du local énergie, capsule absente tant que l'embarquement n'est pas visité, voyants sur les portes d'AR-02.

- [ ] **Step 3 : lint, types, commit**

Run : `npx eslint tools --max-warnings 0 && npx tsc -b`

```bash
git add tools/captures.ts
git commit -m "#97 : captures de la carte sur téléphone simulé"
```

---

### Task 7 : documents, vérification complète, PR

**Files :**
- Modify : `docs/14-carte.md` (lignes « Statut » et « Implémentation »), `docs/contrats/C-06-observation-connaissances.md` (ligne « Implémentation et tests »), `docs/00-lire-en-premier.md` (reprise #97)

**Interfaces :**
- Consumes : tâches 1 à 6.
- Produces : documents à jour ; PR de la livraison 3, validation humaine requise.

- [ ] **Step 1 : statuts**

Dans `docs/14-carte.md`, ligne « **Implémentation :** » : « livraisons 1 (plans) et 2 (mémoire) fusionnées ; livraison 3 (écran) proposée, à valider sur téléphone par le porteur. » (adapter « fusionnées » à l'état réel des deux premières PR). Dans C-06, remplacer « écran de la carte absent » par « écran de la carte proposé par #97, livraison 3, à valider sur téléphone ». Dans `docs/00-lire-en-premier.md`, compléter la reprise #97 : « Livraison 3 (écran vert, plan, fiche, liste) proposée, validation humaine requise. »

- [ ] **Step 2 : vérification complète**

Run : `npm run verify`
Expected : « Vérification complète : toutes les étapes sont vertes. »

- [ ] **Step 3 : commit**

```bash
git add docs/14-carte.md docs/contrats/C-06-observation-connaissances.md docs/00-lire-en-premier.md
git commit -m "#97 : statut de la livraison 3 (écran de la carte)"
```

- [ ] **Step 4 : relecture indépendante**

Demander au profil `relecteur` une relecture du diff contre la principale avec `docs/14-carte.md` §2 et ce plan ; points prioritaires : aucun chiffre ni identifiant affiché, aucune action jouée depuis la carte, focus et retour système, contraste des jetons. Traiter ses points bloquants, relancer `npm run verify`.

- [ ] **Step 5 : PR, avec l'accord du porteur**

Demander au porteur s'il est d'accord pour pousser et ouvrir la PR. Après son accord :

```bash
git push -u origin interface/97-carte
gh pr create --title "#97 : carte, livraison 3 — écran de la carte" --body-file .void-walker/pr-97-ecran.md
```

Description, écrite dans ce fichier (dossier ignoré par git) : critères ↔ preuves (14 §2.1 accès → test de navigation et captures ; §2.2 jetons → `app/styles.css` ; §2.3 échelle et gestes → `app/carte/vue.test.ts`, captures « glisser » et « texte très grand » ; §2.4 à §2.6 → `app/carte/carte.test.tsx` ; §2.7 fiche → test et capture ; §2.8 liste → test K-07 et capture ; §2.9 accessibilité → libellés, focus, captures ; §2.10 → K-13 de la livraison 2), limites (bornes du zoom et seuil d'effacement des noms à juger sur téléphone, 14 §9 ; pincement non simulé par les captures), et en tête : « **Validation humaine requise** : à essayer sur téléphone par le porteur avant fusion. Zone orange. »
