# L2 (#152) — Première station tirée : plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans, tâche par tâche. Les étapes se suivent par cases à cocher (`- [ ]`).

**But :** NOUVELLE PARTIE tire une petite station (vestibule, M-07 ou M-10, M-03) assemblée de morceaux, avec son plan, parmi des compositions prouvées à la construction.

**Architecture :** le moteur gagne un module d'assemblage (`engine/station.ts`, `engine/pose.ts`) qui transforme une chaîne de morceaux en `DefMonde` avec son plan, sans aucune règle de jeu nouvelle. Le contenu décrit les morceaux, la table des paires, les textes par couches et un catalogue qui reçoit l'assembleur en paramètre (le contenu n'importe que des types du moteur). L'appli, la CLI et les outils créent ce catalogue avec l'assembleur du moteur.

**Pile :** TypeScript 6, React 19, Vitest 4, tsx ; aucun paquet ajouté.

**Spec :** [docs/superpowers/specs/2026-10-15-premiere-station-tiree-design.md](../specs/2026-10-15-premiere-station-tiree-design.md) — à lire avec ce plan. Sources : issue #152, `docs/13-morceaux-lancement.md` §3, §4.1, §7, §8 ; `docs/14-carte.md` §4, §5 ; `docs/contrats/C-08-stations-fins.md`.

## Contraintes globales

- Imports (`docs/10-architecture.md` §3, `npm run check:imports`) : `engine/` n'importe que `engine/` ; `content/` n'importe que `content/` et des **types** de `engine/` ; `app/`, `cli/`, `tools/` importent `engine/` et `content/`.
- Aucune règle de jeu ne change : pas de modification de `engine/actions.ts`, `creature.ts`, `etat.ts`, `observation.ts`, `partie.ts`, `carte.ts`, `feu.ts`, `froid.ts`, `vide.ts`, `sante.ts`.
- Format de sauvegarde inchangé : `FORMAT_ENREGISTREMENT = 1`, l'identifiant de station va dans le champ `monde` (zone rouge sinon, C-10 §6).
- Identifiant de station : `<composition>-<graine du plan>`, motif `^[a-z0-9-]{1,40}$` (forme acceptée par `report-service/src/rapport.ts`). Composition : `<chemin>-<final>-<place>`, ex. `m07-m03-soute`. Graine : entier décimal de 0 à 4294967295, sans zéro de tête.
- Compositions publiées, dans cet ordre : `m07-m03-reserve`, `m07-m03-soute`, `m10-m03-entrepot`, `m10-m03-reserve`.
- Places de la créature : M-07 `soute` ; M-10 `entrepot` ; M-03 `reserve` (porte local–réserve **ouverte** au départ). Jamais dans le vestibule.
- Portes entre morceaux fermées au départ (D-252), sauf `sortiesOuvertes` des stations de test (m-07 seulement).
- Plan : miroir sur un seul axe ou aucun, jamais de rotation (GE-02) ; mur commun d'au moins **2** cases entre morceaux (PL-02) ; au plus `PORTES_MAX = 6` portes par pièce (PL-06) ; `PROFONDEUR_COQUE = 4` cases réservées devant la coque dès la pose (GE-07) ; aucun vide enfermé (GE-03) ; proportion visée largeur ≈ **0,76** × hauteur (GE-04) ; même graine, même plan (GE-06).
- Critères plan (14 §5.6) : sur **1 000** tirages, au moins **95 %** de plans trouvés ; moins de **50 ms** par station sur PC (mesuré, pas asserté).
- Hasard : jamais `Math.random` (AP-02). Plan : générateur `generateurDepuisGraine`/`suivant` de `engine/des.ts`. Appli : `crypto.getRandomValues` ; CLI : `randomInt`.
- Textes du jeu en français, vouvoiement, écrits à la main (C-07) ; aucun numéro de décision dans un texte montré au joueur, sauf le motif d'un refus de `?station=` (paramètre de test).
- Ne pas affaiblir un test sans le dire dans la PR. Un test qui citait un identifiant interne de m-07 ou m-10 (`p-soute`…) passe au préfixe (`m-07/p-soute`) avec la même assertion.
- Messages de commit sans accents (encodage pwsh). Vérification complète : `npm run verify`.

## Points de vigilance

Entrées que la spec implique sans qu'une tâche les exerce d'office ; chacune a son test dans la tâche indiquée.

1. **Changer de station ne doit pas renvoyer à l'accueil** : l'effet de démarrage d'`App` dépend aujourd'hui de `[env]` ; si `env` devient un état qui change à NOUVELLE PARTIE, l'écran repart à l'accueil. Attendu : réveil de la nouvelle station. → Tâche 8, capture « Station tirée — nouvelle partie ».
2. **Sauvegarde à l'adresse nue dont le monde n'est plus résoluble** (identifiant de station d'une ancienne liste, texte quelconque) : attendu « reprise impossible », la sauvegarde n'est pas écrasée tant que le joueur ne commence pas. → Tâche 8, test `preparerLancement`.
3. **`?station=` / `--station` mal formé** (majuscules, graine > 4294967295, zéro de tête, `toString`, `__proto__`, vide) : refus avec motif, jamais d'exception. → Tâche 5, test du catalogue.
4. **La graine du plan ne doit rien changer aux règles** : deux graines donnent le même `DefMonde` à `id` et `plan` près (ordre des tableaux compris), sinon la preuve d'une composition ne vaut plus pour toutes ses graines. → Tâche 2.
5. **Rapport envoyé depuis une station tirée** : l'export doit passer `lireDemande` du service de rapports. → Tâche 5.

---

### Tâche 1 : Format du morceau et assemblage sans plan

**Fichiers :**
- Créer : `engine/station.ts`
- Modifier : `engine/index.ts` (exports)
- Test : `engine/station.test.ts`

**Interfaces :**
- Produit (exporté par `engine/index.ts`) :

```ts
export type FamilleMorceau = 'depart' | 'chemin' | 'final';
export type Apport = 'acces' | 'evacuation';
/** Porte de sortie vers le morceau suivant, décrite par le morceau. */
export type DefPorteSortie = Omit<DefLiaison, 'id' | 'entre' | 'ouverte' | 'plan'>;
export interface DefMorceau {
  readonly id: string;                         // 'vestibule', 'm-07', 'm-10', 'm-03', 'essai'
  readonly famille: FamilleMorceau;
  readonly pieces: readonly DefPiece[];        // `plan` en coordonnées locales (tuile) ; sous-positions sans plan
  readonly liaisons: readonly DefLiaison[];    // intérieures, sans `plan`
  readonly objets: readonly DefObjet[];
  readonly positions?: readonly DefPosition[];
  readonly entree: string;                     // pièce d'entrée ; pour un départ, pièce du réveil
  readonly sortie?: { readonly piece: string; readonly porte: DefPorteSortie }; // absente pour un final
  readonly placesCreature: readonly string[];
  readonly demande: readonly Apport[];
  readonly fournit: readonly Apport[];
  readonly assistance?: readonly DefAssistance[];
}
export interface DefStation {
  readonly id: string;                         // devient `monde.id`
  readonly morceaux: readonly DefMorceau[];    // ordre du chemin ; le premier donne le départ, le dernier est un final
  readonly creature: string;                   // pièce préfixée, ex. 'm-07/p-soute'
  readonly graine: number;                     // graine du plan
  readonly assistance?: readonly DefAssistance[];
  readonly sortiesOuvertes?: readonly string[]; // stations de test : morceaux dont la porte de sortie est ouverte au départ
}
export type ResultatAssemblage =
  | { readonly type: 'station'; readonly monde: DefMonde }
  | { readonly type: 'sans_plan' }
  | { readonly type: 'invalide'; readonly erreurs: readonly string[] };
export type Assembleur = (station: DefStation) => ResultatAssemblage;
export function prefixer(morceau: string, id: string): string;   // `${morceau}/${id}`
export function validerMorceau(morceau: DefMorceau): string[];
export const assemblerStation: Assembleur;
```

- [ ] **Étape 1 : écrire les tests qui échouent** dans `engine/station.test.ts`, avec deux petits morceaux de test écrits dans le fichier (un départ d'une pièce, un final avec embarquement, cabine, capsule alimentée, pupitre ; tuiles 4 × 3) :
  - `validerMorceau` : `[]` pour les deux ; une erreur pour chacun de : liaison qui porte `plan`, pièce dessinée sans `plan`, `entree` inconnue, place de créature inconnue, final avec `sortie`, chemin sans `sortie`, final qui ne fournit pas `evacuation`.
  - `prefixer('m-07', 'p-soute') === 'm-07/p-soute'`.
  - Assemblage : chaque identifiant de pièce, liaison, objet, position est préfixé, ainsi que toutes les références (`entre`, `piece`, `capsule.interieur`, `alimente`, `depart`, `machines`, `gravite`, `fermeture`, `avertisseur.piece`, `haute`, `cachee`, `manoeuvre`, `position`, `sous`, `quand.piece`) ; `monde.id === station.id` ; `monde.depart === prefixer(premier.id, premier.entree)` ; `monde.creature.piece === station.creature`.
  - Porte entre morceaux : id `l-<a.id>-<b.id>`, `entre: [sortie préfixée, entrée suivante préfixée]`, champs de `porte` recopiés, `ouverte: false` ; `ouverte: true` si `sortiesOuvertes` contient le morceau.
  - Ordre : pièces, objets, positions concaténés dans l'ordre des morceaux ; liaisons = pour chaque morceau ses liaisons puis sa porte de sortie ; assistance = celle de la station puis celle des morceaux.
  - `invalide` avec motif pour : créature hors des `placesCreature` des morceaux ; créature dans la pièce de départ ; dernier morceau non final ; une `demande` non fournie par un morceau précédent ; morceau invalide.
  - Le monde produit passe `validerMonde` (ces cas de test n'ont pas encore de plan : supprimer `plan` des pièces dans cette tâche).
- [ ] **Étape 2 : lancer** `npx vitest run engine/station.test.ts` — attendu : échec, module absent.
- [ ] **Étape 3 : implémenter** `engine/station.ts`. Dans cette tâche, `assemblerStation` retire tous les `plan` (le plan arrive en tâche 2), puis appelle `validerMonde` : erreurs → `invalide`.
- [ ] **Étape 4 : lancer** `npx vitest run engine/station.test.ts` puis `npm run typecheck` et `npm run check:imports` — attendu : vert.
- [ ] **Étape 5 : commit** `engine: format du morceau et assemblage des stations (#152)`.

### Tâche 2 : Plan du chemin principal

**Fichiers :**
- Créer : `engine/pose.ts`
- Modifier : `engine/station.ts` (utiliser la pose ; ne plus retirer les plans)
- Test : `engine/pose.test.ts`, `engine/station.test.ts`

**Interfaces :**
- Consomme : `DefMorceau` (tâche 1) ; `chevauchent`, `murCommun`, `videsEnfermes`, `panLibre`, `cleCase`, `PORTES_MAX`, `PROFONDEUR_COQUE`, `piecesDeCoque` de `engine/plan.ts` ; `generateurDepuisGraine`, `suivant` de `engine/des.ts`.
- Produit :

```ts
export interface Pose {
  readonly rects: ReadonlyMap<string, RectPlan>;   // par identifiant de pièce préfixé
  readonly portes: ReadonlyMap<string, number>;    // `rang` de chaque porte entre morceaux, par identifiant de liaison
}
export function poserTuiles(morceaux: readonly DefMorceau[], graine: number): Pose | null;
```

Algorithme (que la signature ne fixe pas) : recherche en profondeur avec retour en arrière, une tuile après l'autre.
- Miroirs possibles : aucun, `x` (x' = −x − largeur), `y` (y' = −y − hauteur). Première tuile : miroir tiré, sans translation.
- Tuile suivante : pour chaque miroir, chaque côté de la pièce de sortie posée et chaque glissement qui laisse un mur commun d'au moins 2 cases avec la pièce d'entrée, une translation candidate.
- Candidat refusé si : chevauchement (PL-01) ; case réservée devant une coque ; vide enfermé dans l'ensemble posé (GE-03) ; plus de 6 portes à une pièce, portes intérieures comprises (PL-06) ; pièce de coque de la tuile sans `panLibre` — sinon les cases de ce pan, sur `PROFONDEUR_COQUE`, sont réservées (GE-07).
- Ordre des candidats : mélangés par le générateur, puis triés de façon stable par |largeur ÷ hauteur − 0,76| du cadre des pièces posées, arrondi au quart (GE-04).
- Porte entre morceaux : case tirée dans `[mur.debut, mur.fin)` (GE-01).
- Aucune solution : `null`. Le générateur ne sert qu'au plan.

- [ ] **Étape 1 : écrire les tests qui échouent** (`engine/pose.test.ts`, mêmes morceaux de test que la tâche 1 plus un chemin de trois pièces en rang) :
  - `poserTuiles(m, g)` deux fois → résultats égaux (GE-06) ; sur 50 graines, au moins deux plans différents.
  - Pour 200 graines : chaque porte entre morceaux sur un mur commun d'au moins 2 cases, `rang` dans le mur ; aucune paire de rectangles ne se chevauche ; `videsEnfermes` vide ; chaque pièce de coque a un `panLibre`.
  - Aucune rotation : chaque tuile garde ses largeurs et hauteurs.
  - Une chaîne impossible → `null` : pièce de sortie qui porte déjà 6 portes intérieures (un couloir 6 × 2 bordé de six pièces 2 × 2), si bien que la porte entre morceaux en ferait 7 (PL-06).
- [ ] **Étape 2 : écrire les tests qui échouent** dans `engine/station.test.ts` :
  - le monde assemblé a un plan pour chaque pièce dessinée, les portes entre morceaux portent `plan.rang`, et passe `validerMonde` ;
  - **vigilance 4** : pour deux graines dont les plans diffèrent, les deux mondes sont égaux une fois retirés `id` et tous les champs `plan` (comparaison profonde, ordre des tableaux compris) ;
  - `poserTuiles` → `null` donne `{ type: 'sans_plan' }`.
- [ ] **Étape 3 : lancer** `npx vitest run engine/pose.test.ts engine/station.test.ts` — attendu : échec.
- [ ] **Étape 4 : implémenter** `poserTuiles` et son usage dans `assemblerStation`.
- [ ] **Étape 5 : lancer** les mêmes tests, puis `npm run lint`, `npm run typecheck` — attendu : vert.
- [ ] **Étape 6 : commit** `engine: plan du chemin principal des stations (#152)`.

### Tâche 3 : Textes par couches

**Fichiers :**
- Créer : `content/textes/socle.ts`, `content/textes/univers.ts`, `content/textes/menace.ts`, `content/textes/couches.ts`
- Modifier : `content/textes/station-essai.ts` (devient la réunion des couches), `content/textes/morceaux.ts` (les clés de griffes passent dans la menace), `content/m-07/textes.ts`, `content/m-08/textes.ts`, `content/m-09/textes.ts`, `content/m-10/textes.ts`, `tools/check-texts.ts`, `content/index.ts`
- Test : `tools/couches.test.ts`

**Interfaces :**
- Produit :

```ts
export interface TextesMorceau {
  readonly noms: Readonly<Record<string, Nom>>;
  readonly descriptions: Readonly<Record<string, Variantes>>;
  readonly assistance: Readonly<Record<string, string>>;
}
export const MOTS_UNIVERS: readonly string[];  // radicaux, ex. 'station'
export const MOTS_MENACE: readonly string[];   // radicaux, ex. 'créature', 'griff'
/** Socle + univers + menace + morceaux (+ messages propres à la station) ; une clé définie deux fois avec deux textes différents lève une erreur. */
export function reunir(morceaux: readonly TextesMorceau[], assistance?: Readonly<Record<string, string>>): TextesMonde;
/** Fuites : un mot du socle ou d'un morceau qui commence par un radical de l'univers ou de la menace, casse ignorée. */
export function fuitesDeCouches(morceaux: Readonly<Record<string, TextesMorceau>>): string[];
```

Répartition : **socle** = refus, libellés, verbes, savoir, aperçus (risques, coûts), passages, observation neutre, règles des dangers et des morceaux ; **univers** = réveil, évacuations, repères de moment, noms et descriptions de vestibule, embarquement, cabine, capsule, pupitre, porte, porte grippée, écoutille, messages d'IA Station `reveil` et `depart` des stations tirées ; **menace** = clés qui décrivent la créature, ses bruits et ses coups (`bruit_creature`, `creature_entre`, `premier_contact`, `menace`, aggravations, défaite, `creature_glisse`, `creature_expulsee`, `creature_inerte`, `griffes_feu`, `griffes_froid`, `creature_a_bord`, observations et dangers de la créature…). Le contrôle de fuites tranche les cas limites.

- [ ] **Étape 1 : relever l'existant** : script jetable `.void-walker/empreintes-textes.ts` qui imprime `empreinte(textes)` de `ar-01`, `ar-02`, `monde-test`, `m-08`, `m-09` (assistance retirée pour `m-08`, `m-09`) ; le lancer et garder la sortie.
- [ ] **Étape 2 : écrire les tests qui échouent** (`tools/couches.test.ts`) :
  - `fuitesDeCouches(MORCEAUX_TEXTES)` vaut `[]`, où `MORCEAUX_TEXTES` regroupe les textes de morceau existants (les textes propres aux stations de test m-07 à m-10 jusqu'à la tâche 4) ;
  - une copie du socle avec « La créature » ajouté à un refus → une fuite qui nomme la clé et le mot ;
  - `reunir` lève une erreur si deux morceaux donnent deux textes différents à la même clé ;
  - `TEXTES_STATION_ESSAI` est la réunion du socle, de l'univers et de la menace.
- [ ] **Étape 3 : lancer** `npx vitest run tools/couches.test.ts` — attendu : échec.
- [ ] **Étape 4 : implémenter** les couches et `reunir` ; `check:texts` appelle `fuitesDeCouches` et échoue sur la moindre fuite.
- [ ] **Étape 5 : relancer le script de l'étape 1** — attendu : sortie identique.
- [ ] **Étape 6 : réécrire** sans nommer de pièce voisine : message `capsule` de `m-07`, `m-08`, `m-09` ; description `coursive` de `m-07` et `m-10`. Phrases courtes, vouvoiement, rien de non perçu.
- [ ] **Étape 7 : lancer** `npm run check:texts` puis `npx vitest run tools` — attendu : vert.
- [ ] **Étape 8 : commit** `content: textes par couches socle, univers, menace (#152)`.

### Tâche 4 : Morceaux et stations de test refaites

**Fichiers :**
- Créer : `content/morceaux/vestibule.ts`, `content/morceaux/m-07.ts`, `content/morceaux/m-10.ts`, `content/morceaux/m-03.ts`, `content/morceaux/essai.ts`, `content/morceaux/index.ts`, `content/stations/catalogue.ts`
- Supprimer : `content/m-07/monde.ts`, `content/m-10/monde.ts`
- Modifier : `content/m-07/textes.ts`, `content/m-10/textes.ts` (ne gardent que les messages propres à la station de test), `content/index.ts`, `tools/morceaux.test.ts`, `tools/plans.test.ts`, `tools/verifier-station.ts`, `tools/verifier-station.test.ts`, `tools/check-texts.ts`, `tools/rejouer-parcours.ts`, `tools/captures.ts` (`capturerPlans`), `app/son/declencheurs.test.ts`, `tools/couches.test.ts`
- Créer : `tools/catalogue.ts`, `app/catalogue.ts`
- Test : `tools/stations.test.ts`

**Interfaces :**
- Consomme : `DefMorceau`, `DefStation`, `Assembleur` (types, tâche 1) ; `TextesMorceau`, `reunir` (tâche 3).
- Produit :

```ts
// content/morceaux/index.ts
export const MORCEAUX: Readonly<Record<string, { readonly morceau: DefMorceau; readonly textes: TextesMorceau }>>; // vestibule, m-07, m-10, m-03, essai
// content/stations/catalogue.ts (exporté par content/index.ts)
export interface Catalogue {
  /** AR-01, AR-02, monde de test, m-07 à m-10 ; m-07 et m-10 assemblés. */
  readonly mondes: Readonly<Record<string, EntreeMonde>>;
}
export function creerCatalogue(assembler: Assembleur): Catalogue;
// tools/catalogue.ts et app/catalogue.ts
export const CATALOGUE: Catalogue; // creerCatalogue(assemblerStation)
```

`MONDES` reste exporté sans `m-07` ni `m-10` ; tout code qui parcourt les mondes fixes passe à `CATALOGUE.mondes`.

Données (même ordre de pièces et de liaisons qu'aujourd'hui) :
- **vestibule** : `p-vestibule` (4 × 3), départ ; sortie `{ piece: 'p-vestibule', porte: { nom: 'porte' } }` ; aucune place, aucun objet.
- **m-07** : pièces, liaisons, objet et tuile de `content/m-07/monde.ts` sans embarquement ni cabine ; entrée `p-quartiers` ; sortie `{ piece: 'p-coursive', porte: { nom: 'porte' } }` ; places `['p-soute']` ; fournit `acces`.
- **m-10** : de même depuis `content/m-10/monde.ts` ; sortie `{ piece: 'p-coursive', porte: { nom: 'porte_grippee', bruyante: true } }` ; places `['p-entrepot']` ; fournit `acces`.
- **m-03** (final) : `p-energie` (0,0,4,3) entrée, `p-reserve` (4,0,4,3), `p-embarquement` (0,3,4,3), `p-cabine` sous-position ; liaisons `energie–reserve` porte ouverte, `energie–embarquement` porte fermée, `embarquement–cabine` écoutille fermée ; objets `o-console` (alimente la capsule), `o-bloc` (large, encombrant, source), `o-capsule` non alimentée, `o-pupitre` ; places `['p-reserve']` ; demande `acces`, fournit `evacuation` ; assistance `{ id: 'energie', quand: arrivée p-energie }`.
- **essai** (final des stations de test) : `p-embarquement` (4 × 3), `p-cabine`, capsule **alimentée**, pupitre ; demande `acces`, fournit `evacuation`.
- Textes du morceau : noms, descriptions, messages d'arrivée ; `m-03` reprend les noms et le message `energie` d'AR-01, ses descriptions sont réécrites sans le panneau de service d'AR-01 ; `reserve` : « réserve » (f).
- **Stations de test** : `m-07` = `{ id: 'm-07', morceaux: [m-07, essai], creature: 'm-07/p-soute', graine: 1, sortiesOuvertes: ['m-07'], assistance: [capsule et presence au réveil] }` ; `m-10` de même avec `m-10/p-entrepot`, sans `sortiesOuvertes`. Textes = `reunir([morceau, essai], messages de la station)` ; parcours inchangés.

- [ ] **Étape 1 : écrire les tests qui échouent** (`tools/stations.test.ts`) : chaque morceau de `MORCEAUX` passe `validerMorceau` ; `CATALOGUE.mondes['m-07']` et `['m-10']` existent, passent `validerMonde`, ont la créature en `m-07/p-soute` et `m-10/p-entrepot`, la porte de sortie de m-07 ouverte et celle de m-10 fermée ; les identifiants de `CATALOGUE.mondes` sont ceux de `MONDES` plus `m-07` et `m-10`.
- [ ] **Étape 2 : lancer** `npx vitest run tools/stations.test.ts` — attendu : échec.
- [ ] **Étape 3 : implémenter** les morceaux, `creerCatalogue` (mondes fixes seulement), `tools/catalogue.ts`, `app/catalogue.ts`.
- [ ] **Étape 4 : basculer** les consommateurs listés vers `CATALOGUE.mondes` ; dans `tools/morceaux.test.ts`, préfixer les identifiants internes cités (`p-soute` → `m-07/p-soute`, `p-chambre` → `m-10/p-chambre`…) sans changer les assertions.
- [ ] **Étape 5 : lancer** `npx vitest run tools app/son` puis `npm run check:stations`, `npm run parcours`, `npm run check:texts` — attendu : vert, parcours de m-07 et m-10 inchangés (mêmes noms, mêmes `attendu`), m-07 et m-10 prouvées.
- [ ] **Étape 6 : commit** `content: morceaux vestibule, M-07, M-10, M-03 ; stations de test assemblees (#152)`.

### Tâche 5 : Table des paires, compositions, résolution et tirage

**Fichiers :**
- Créer : `content/stations/paires.ts`
- Modifier : `content/stations/catalogue.ts`, `content/index.ts`
- Test : `tools/stations.test.ts`

**Interfaces :**
- Produit :

```ts
// content/stations/paires.ts
export interface LignePaire { readonly a: string; readonly b: string; readonly verdict: 'permise' | 'jamais'; readonly regle: string } // a < b, 'M-01'…'M-10'
export const PAIRES: readonly LignePaire[];
// content/stations/catalogue.ts
export interface Refus { readonly refus: string }
export interface Composition {
  readonly id: string;              // 'm07-m03-soute'
  readonly chemin: string;          // 'm-07'
  readonly final: string;           // 'm-03'
  readonly creature: string;        // 'm-07/p-soute'
  readonly refus: string | null;    // motif de la table, avant tout plan
}
export const COMPOSITIONS_PUBLIEES: readonly string[];
export interface Catalogue {
  readonly mondes: Readonly<Record<string, EntreeMonde>>;
  /** Toutes les compositions possibles : chaque chemin × chaque final × chaque place de ces deux morceaux. */
  readonly compositions: readonly Composition[];
  /** Monde fixe, ou station exacte `<composition>-<graine>`. */
  resoudre(id: string): EntreeMonde | Refus;
  /** Final à pile ou face parmi les finals publiés, composition publiée au hasard, graine du plan ; `composition` force la composition. */
  tirer(hasard: () => number, composition?: string): EntreeMonde | Refus;
}
export function creerCatalogue(assembler: Assembleur, table?: readonly LignePaire[]): Catalogue;
/** Pièces du même nom numérotées dans toute la station (D-208) : `coursive` → `coursive_a`, « coursive A ». */
export function numeroter(entree: EntreeMonde): EntreeMonde;
```

Règles : seule la paire chemin–final passe par la table (le vestibule et `essai` n'en sont pas) ; paire absente → `Paire M-03 + M-07 absente de la table : refusée par défaut.` ; paire `jamais` → sa `regle`. Une composition refusée, inconnue ou non publiée est refusée **sans appeler l'assembleur**. Station tirée : morceaux `[vestibule, chemin, m-03]`, assistance de station `reveil` (réveil) et `depart` (évacuation), aucun message de présence, textes `reunir`, puis `numeroter`, `parcours: []`. `hasard()` rend un entier de 0 à 4294967295. Au tirage, graine sans plan : nouvelle graine, 50 essais au plus, puis refus ; un identifiant exact dont la graine n'a pas de plan est refusé. Résultats mémorisés par identifiant.

- [ ] **Étape 1 : écrire les tests qui échouent** (`tools/stations.test.ts`) :
  - `PAIRES` : 45 lignes, chaque paire non ordonnée de M-01 à M-10 une seule fois, `a < b`, seule M-03 + M-06 `jamais`.
  - `compositions` : exactement les 4 identifiants publiés, sans refus.
  - **G-02** : `creerCatalogue(espion, PAIRES sans M-03 + M-07)` ; `tirer(h, 'm07-m03-soute')` et `resoudre('m07-m03-soute-42')` rendent un refus qui contient « M-03 + M-07 » ; l'espion n'est jamais appelé.
  - **Vigilance 3** : `resoudre` refuse sans lever pour `''`, `'M07-M03-SOUTE-1'`, `'m07-m03-soute-4294967296'`, `'m07-m03-soute-007'`, `'m07-m03-soute'`, `'toString'`, `'__proto__'`, `'m07-m03-inconnue-1'`.
  - `resoudre('m07-m03-soute-2718281828')` deux fois → même objet `monde` ; départ `vestibule/p-vestibule`, créature `m-07/p-soute`, porte du vestibule et portes entre morceaux fermées ; `resoudre(id).monde.id === id`.
  - **GP-04** (13 §8.1), pour chaque composition publiée : au départ, aucune créature ni objet dans le vestibule ; « aller » par sa porte indisponible (fermée) ; « regarder » ne change pas l'état ; ouvrir puis franchir la porte sont disponibles et engagés sans dé.
  - PL-04 : sur 50 stations tirées, chaque nom de pièce tient dans son rectangle (`nomLisible`).
  - `tirer` avec un hasard à graine fixe, 200 fois : toujours une composition publiée, chaque composition au moins une fois, identifiant conforme à `^[a-z0-9-]{1,40}$`.
  - **Vigilance 5** : l'export d'une partie neuve d'une station tirée passe `lireDemande` de `report-service/src/rapport.ts` (`ok: true`).
  - `numeroter` : une station de test qui porte deux pièces `coursive` (deux chemins de test écrits dans le fichier) donne `coursive_a`, `coursive_b`, noms « coursive A », « coursive B », mêmes genre et descriptions ; une station sans doublon reste identique.
- [ ] **Étape 2 : lancer** `npx vitest run tools/stations.test.ts` — attendu : échec.
- [ ] **Étape 3 : implémenter** `PAIRES` (transcription de 13 §4.1, règles recopiées), compositions, `resoudre`, `tirer`, `numeroter`.
- [ ] **Étape 4 : lancer** `npx vitest run tools/stations.test.ts` puis `npm run lint`, `npm run typecheck` — attendu : vert.
- [ ] **Étape 5 : commit** `content: table des paires, compositions et tirage des stations (#152)`.

### Tâche 6 : Catalogue vérifié à la construction

**Fichiers :**
- Modifier : `tools/verifier-station.ts`, `tools/check-texts.ts`
- Test : `tools/verifier-station.test.ts`

**Interfaces :**
- Consomme : `Catalogue`, `COMPOSITIONS_PUBLIEES` (tâche 5), `verifierStation` (L1), `empreinte`, `assemblerStation`.
- Produit :

```ts
export interface LigneCatalogue {
  readonly composition: string;
  readonly verdict: RapportStation['verdict'] | 'refusee';
  readonly etats: number;
  readonly secondes: number;
  readonly diagnostic: string;
  readonly empreintes: Readonly<Record<string, string>>; // empreinte({ morceau, textes }) par morceau
}
export function verifierCatalogue(catalogue: Catalogue, options?: OptionsVerification): LigneCatalogue[];
export interface MesurePlans { readonly chemin: string; readonly tirages: number; readonly trouves: number; readonly msMoyenne: number; readonly msMax: number }
export function mesurerPlans(tirages: number): MesurePlans[];
```

Chaque composition non refusée est vérifiée sur une graine de plan fixe (aucune règle ne lit le plan, D-078 ; tâche 2) ; une composition refusée l'est sans lancer le vérifieur (`etats: 0`). `npm run check:stations` sans argument : mondes fixes comme aujourd'hui, puis une ligne JSON par composition, puis une ligne par chemin pour 1 000 plans ; code de sortie non nul si une composition publiée n'est pas prouvée, si une composition prouvée n'est pas publiée, ou si moins de 95 % des plans sont trouvés.

- [ ] **Étape 1 : écrire les tests qui échouent** :
  - `verifierCatalogue(CATALOGUE)` : les 4 compositions `prouvee` ; l'ensemble prouvé égale `COMPOSITIONS_PUBLIEES` ; chaque ligne a une empreinte par morceau inclus, stable d'un appel à l'autre.
  - Avec un catalogue sans M-03 + M-07 : les deux compositions M-07 `refusee`, `etats: 0`, motif de la table.
  - Mesure attendue sur la maquette jetable : `m07-m03-soute` 15 actions, `m07-m03-reserve` 16, `m10-m03-entrepot` 14, `m10-m03-reserve` 16 ; un écart n'est pas une erreur en soi, mais se signale dans la PR.
  - `mesurerPlans(1000)` : pour chaque chemin, `trouves ≥ 950`.
- [ ] **Étape 2 : lancer** `npx vitest run tools/verifier-station.test.ts` — attendu : échec.
- [ ] **Étape 3 : implémenter** ; `check:texts` contrôle aussi une station par composition publiée (graine fixe).
- [ ] **Étape 4 : lancer** `npm run check:stations` et `npm run check:texts` — attendu : vert ; noter les temps.
- [ ] **Étape 5 : commit** `tools: catalogue des stations verifie a la construction (#152)`.

### Tâche 7 : CLI et rejeu d'export

**Fichiers :**
- Modifier : `cli/partie-cli.ts`, `cli/main.ts`, `tools/rejouer-export.ts`
- Test : `cli/partie-cli.test.ts`, `tools/rejouer-export.test.ts`

**Interfaces :**
- Consomme : `Catalogue` (tâche 5) ; `cli/main.ts` crée `creerCatalogue(assemblerStation)`, `tools/rejouer-export.ts` prend `CATALOGUE` de `tools/catalogue.ts`.
- Produit : `choisirEntree(argv: readonly string[], catalogue: Catalogue, es: EntreesSorties): EntreeMonde | string` remplace `choisirMonde`.

Règles : `--station <id>` (composition → `tirer(es.graineAleatoire, id)`, identifiant exact → `resoudre`) ; `--monde <id>` → `catalogue.mondes` ; `nouvelle` sans option → `tirer` ; autre commande → monde de la partie enregistrée par `resoudre`, sinon `tirer`. Refus → `Station refusée : <motif>` et code 1. Aide : ligne `--station <id>` ; `--monde <id>` « (à la reprise, le monde de la partie enregistrée ; sinon une station tirée) ». `npm run rejouer` résout `fichier.monde` par `CATALOGUE.resoudre`.

- [ ] **Étape 1 : écrire les tests qui échouent** : `nouvelle` sans option avec `graineAleatoire` fixe → station dont l'identifiant est une composition publiée suivie d'une graine ; `voir` ensuite reprend la même station ; `--station m07-m03-soute` → composition forcée ; `--station m07-m03-soute-2718281828` → cette station exacte ; `--station m07-m03-inconnue-1` → message de refus, code 1 ; `--monde ar-01` → AR-01 ; une partie enregistrée sur AR-01 reprend sur AR-01 ; un export de station tirée se rejoue identique.
- [ ] **Étape 2 : lancer** `npx vitest run cli tools/rejouer-export.test.ts` — attendu : échec.
- [ ] **Étape 3 : implémenter.**
- [ ] **Étape 4 : lancer** les mêmes tests, puis `npm run cli -- nouvelle --partie .void-walker/l2.json` et `npm run cli -- voir --partie .void-walker/l2.json` — attendu : vert, réveil dans le vestibule.
- [ ] **Étape 5 : commit** `cli: NOUVELLE tire une station, --station en force une (#152)`.

### Tâche 8 : Appli

**Fichiers :**
- Modifier : `app/jeu.ts`, `app/main.tsx`, `app/App.tsx`, `tools/captures.ts`
- Test : `app/jeu.test.ts`, `app/EcranJeu.test.tsx` (ou nouveau `app/App.test.tsx` pour `EcranRefus`)

**Interfaces :**
- Consomme : `Catalogue` (tâche 5), `CATALOGUE` de `app/catalogue.ts`.
- Produit :

```ts
// app/jeu.ts — remplace `mondeDemande`
export type Demande =
  | { readonly type: 'monde'; readonly id: string }    // ?monde= connu
  | { readonly type: 'station'; readonly id: string }  // ?station=, prioritaire sur ?monde=
  | { readonly type: 'tirage' };                       // adresse nue, ou ?monde= inconnu
export function demandeDe(recherche: string, mondes: Readonly<Record<string, EntreeMonde>>): Demande;
/** `base` pour le tirage ; `${base}?monde=<id>` ; `${base}?station=<id>`. */
export function cleStockage(base: string, demande: Demande): string;
export interface Lancement {
  readonly entree: EntreeMonde | null;   // null si refus
  readonly refus: string | null;
  /** NOUVELLE PARTIE : autre station tirée (tirage) ; même composition, autre plan (?station=<composition>) ; sinon le même monde. */
  readonly suivante: () => EntreeMonde;
}
/** Tirage : le monde de la partie enregistrée s'il se résout, sinon une station tirée ; ne lit que le champ `enregistrement.monde`. */
export function preparerLancement(demande: Demande, catalogue: Catalogue, stockage: Stockage, hasard: () => number): Promise<Lancement>;
// app/App.tsx
// App reçoit en plus `nouvelleStation?: () => EntreeMonde` ; garde `env` dans un état ; NOUVELLE PARTIE prend `nouvelleStation()`,
// REJOUER CETTE STATION garde `env` ; l'effet de démarrage ne se relance pas quand `env` change (vigilance 1).
export function EcranRefus({ motif }: { readonly motif: string }); // accueil, motif, « Nouvelle partie » désactivé
```

`main.tsx` attend `preparerLancement` avant le rendu (attente au premier niveau), rend `EcranRefus` si refus, sinon `App`. AR-01 n'est plus le monde par défaut : `?monde=ar-01` a sa propre partie ; une partie AR-01 enregistrée à l'adresse nue se reprend toujours.

- [ ] **Étape 1 : écrire les tests qui échouent** (`app/jeu.test.ts`, stockage en mémoire) :
  - `demandeDe` : `''` → tirage ; `?monde=ar-01` → monde ; `?monde=inconnu`, `?monde=toString` → tirage ; `?station=m07-m03-soute` → station ; `?station=x&monde=ar-01` → station.
  - `cleStockage` : les trois formes.
  - `preparerLancement` tirage : stockage vide → station tirée avec le hasard fourni ; partie AR-01 enregistrée → AR-01 ; partie d'une station enregistrée → cette station ; `suivante()` deux fois avec un hasard qui avance → deux identifiants différents.
  - **Vigilance 2** : partie enregistrée sur `m99-m03-x-1` → une station tirée, puis `charger` de l'environnement rend `reprise_impossible` et le stockage contient toujours l'ancienne partie.
  - `?station=` refusé → `{ entree: null, refus: motif }` ; `?station=m07-m03-soute` → `suivante()` garde la composition et change la graine.
  - `EcranRefus` (rendu statique) : motif affiché, bouton « Nouvelle partie » `disabled`.
- [ ] **Étape 2 : lancer** `npx vitest run app` — attendu : échec.
- [ ] **Étape 3 : implémenter** `jeu.ts`, `App.tsx`, `main.tsx`.
- [ ] **Étape 4 : captures** (`tools/captures.ts`) : les parcours d'AR-01 passent de l'adresse nue à `?monde=ar-01` ; nouvelles étapes « Station tirée — réveil » et « Station tirée — plan » sur `?station=m07-m03-soute-2718281828` ; « Station tirée — rejouer » (même `enregistrement.monde`, autre graine) ; « Station tirée — nouvelle partie » à l'adresse nue (identifiant différent, écran de réveil, **vigilance 1**) ; « Station refusée » sur `?station=m07-m03-inconnue-1` ; `capturerPlans` ajoute « Plan — station <id> » pour 6 stations tirées par chemin (galerie).
- [ ] **Étape 5 : lancer** `npx vitest run app`, `npm run build`, `npm run captures` — attendu : vert, aucune erreur de capture.
- [ ] **Étape 6 : commit** `app: NOUVELLE PARTIE tire une station, REJOUER garde la meme (#152)`.

### Tâche 9 : Vérification complète et documents de reprise

**Fichiers :**
- Modifier : `docs/13-morceaux-lancement.md` (§7 : mesures de L2, tableau du catalogue), `docs/14-carte.md` (§5.6 : mesures des plans), `docs/superpowers/specs/2026-10-15-premiere-station-tiree-design.md` (statut : implémenté), autres documents de reprise touchés

- [ ] **Étape 1 : lancer** `npm run verify` — attendu : « toutes les étapes sont vertes ».
- [ ] **Étape 2 : écrire** dans 13 §7 le tableau du catalogue (composition, verdict, états, temps, actions du témoin, empreintes) et dans 14 §5.6 le taux de plans et les temps mesurés, sans les présenter comme des assertions.
- [ ] **Étape 3 : lancer** `npm run check:links` — attendu : vert.
- [ ] **Étape 4 : commit** `docs: mesures de la premiere station tiree (#152)`.

Suite hors plan (workflow `gestion-issues`) : relecture indépendante (`relecteur`), partie CLI d'un `playtester` sur une station tirée, PR avec `Closes #152`, ligne `Captures : Station tirée ; Station refusée ; Plan — station`, tableau du catalogue, galerie, et la mention **validation humaine requise** : une partie au bout sur téléphone par morceau inclus (M-03, M-07, M-10). Zone orange : fusion seulement avec l'accord du porteur.
