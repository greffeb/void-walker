# Grandes stations, livraison 1 : annexes, boucles, piste et publication — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NOUVELLE PARTIE tire une grande station de 21 à 28 pièces (trois chemins, final, 6 à 10 pièces du catalogue, une à trois portes de boucle, une piste de traces, des bruits de station), prise dans une liste publiée où chaque station est prouvée ; les petites stations restent strictement inchangées.

**Architecture:** l'assembleur du moteur (`engine/station.ts`) garde la pose du chemin principal et, quand `DefStation.grande` est présent, y ajoute trois étapes pures dans de nouveaux modules (`annexes.ts`, `boucles.ts`, `piste.ts`), chacune sur sa sous-graine. Le contenu décrit le catalogue des pièces, les déclarations des morceaux et les compositions D-292 (`content/stations/grandes.ts`) ; les outils prouvent chaque station et écrivent la liste publiée. Les clés restent chez elles (livraison 2) ; aucun document (livraison 3).

**Tech Stack:** TypeScript 6, Vitest 4, React 19 (appli), tsx pour les outils ; aucun ajout de dépendance.

**Spec :** `docs/superpowers/specs/2026-10-18-grandes-stations-design.md` (approuvée le 2026-10-19). Les §5, §6.1 à §6.4, §6.7, §7, §9.3, §10, §11 et §12.1 sont couverts ici ; §6.5, §6.6 (clés, butin, pillage) relèvent de la livraison 2 ; §8, §9.1, §9.2 (lore, documents) de la livraison 3. Le contrôle de couverture (§7.3, « chaque pièce du catalogue porte au moins une chose ») s'active en livraison 3, quand les documents existent.

## Global Constraints

- Une grande station : vestibule, deux chemins matériels (M-01, M-02, M-08, M-09), un troisième chemin matériel ou de type créature qui l'accueille (M-04, M-05, M-07, M-10), un final (M-03, M-06) ; place de la créature dans le troisième chemin ou le final (D-292).
- Annexes : `clamp(24 − pièces dessinées des morceaux, 6, 10)` ; total 21 à 28 pièces dessinées (D-290).
- Boucles : une à trois, même segment, cycle d'au moins quatre pièces, jamais sur une impasse ni sur la pièce de la créature, touchent seulement un couloir ou un passage du catalogue ou une pièce accueillante de morceau (§6.4).
- Piste : de 3 à 6 portes entre l'origine et le repaire ; trace « forte » à 2 portes ou moins du repaire, « légère » au-delà ; jamais dans la pièce de départ (§5.4).
- Bruit de station : une chance sur 7 par action engagée, avant le premier contact, dans une grande station seulement, sans rien écrire dans l'état (§5.5).
- Identifiant : `g1-` + composition + `-` + graine, graine de 0 à 9 999, 40 caractères au plus (§4.3).
- Liste publiée : au moins 500 stations prouvées (§7.2).
- Assemblage : au moins 95 % de plans trouvés, moins de 50 ms par station sur PC, preuve non comprise (§11).
- Petites stations, AR-01, AR-02, stations de test : même monde, même état initial, même menu ; les tests d'empreinte figés de `tools/stations.test.ts` restent verts sans modification de leurs valeurs (§4.2).
- Aucune règle du moteur ne lit un nom de pièce ou d'objet (D-078) : seulement des qualités, étiquettes, formes, catégories, segments.
- Textes (noms et descriptions du catalogue, variantes calmes, traces, bruits) écrits par l'agent principal, jamais délégués (D-243) ; phrases entières, sans pronom substitué (D-281) ; vouvoiement là où le jeu parle au joueur ; aucun chiffre.
- Le format de sauvegarde ne change pas (zone rouge sinon).
- Commits en français, préfixés comme le dépôt (`engine: …`, `content: …`, `tools: …`, `app: …`, `docs: …`), terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Une annexe ou une boucle accrochée à une pièce d'énigme** (chambre froide, galerie en feu, zone sans gravité, bords du vide, salle des machines, panoramique, sas, vestibule) changerait une énigme validée sans que la preuve le voie. Attendu : jamais. Test de propriété sur 1 000 tirages (tâche 8).
2. **Une sauvegarde ou un rapport d'une petite station** après la mise à jour. Attendu : même monde, même empreinte, reprise identique. Tests figés (tâche 6) et test de reprise (tâche 12).
3. **Une graine sans plan ou avec moins de 6 annexes posées.** Attendu : `sans_plan`, puis une autre graine ; jamais une station plus petite que 21 pièces ni plus grande que 28. Test de propriété (tâche 7).
4. **Une trace hors de la piste, ou dans le vestibule.** Attendu : chaque pièce marquée est sur le plus court chemin de l'origine au repaire, jamais au départ. Test de propriété (tâche 5).
5. **Un couloir chargé à 320 px** : six portes possibles, plus les objets ; le dock défile sans masquer la navigation. Capture (tâche 12).

---

### Task 1 : déclarations des morceaux pour les grandes stations

**Files:**
- Modify: `engine/station.ts` (types, `validerMorceau`)
- Modify: `engine/index.ts` (exports)
- Modify: `content/morceaux/vestibule.ts`, `carrefour.ts`, `m-01.ts` à `m-10.ts` (champ `grande`)
- Test: `engine/station.test.ts`, `tools/morceaux.test.ts`

**Interfaces:**
- Produces, dans `engine/station.ts` :
  ```ts
  export type FamilleMorceau = 'depart' | 'chemin' | 'carrefour' | 'final' | 'annexe';
  export type CategoriePiece = 'vie' | 'technique' | 'circulation' | 'science' | 'commandement' | 'evacuation' | 'fret';
  export type FormeAnnexe = 'impasse' | 'passage' | 'couloir';
  export interface DefAnnexe {
    readonly categorie: CategoriePiece;
    readonly forme: FormeAnnexe;
    /** Étiquettes lues par la pose des clés, du butin et des documents (spec §5.2) ; jamais un nom. */
    readonly etiquettes: readonly string[];
    /** Porte vers la pièce d'accroche au départ ; 'tiree' : ouverte une fois sur deux, selon la graine (spec §6.1). */
    readonly porte: 'ouverte' | 'fermee' | 'tiree';
    /** Ne s'accroche qu'à un couloir du catalogue qui dessert déjà une pièce portant cette étiquette (GE-10). */
    readonly surCouloirDe?: string;
  }
  export interface DefGrandeMorceau {
    /** Chemin dont le seul obstacle est la créature, ou obstacle matériel (D-292) ; absent pour départ, carrefour, final. */
    readonly obstacle?: 'materiel' | 'creature';
    /** Pièces où une annexe peut s'accrocher, avec leur catégorie (GE-08, GE-09). */
    readonly accueillantes: Readonly<Record<string, CategoriePiece>>;
    /** Pièces situées avant la coupe de l'obstacle (spec §6.3). */
    readonly avant: readonly string[];
    /** Liaisons intérieures à franchir pour passer d'avant à après ; 'sortie' désigne la porte de sortie du morceau. */
    readonly coupe: readonly string[];
  }
  // DefMorceau gagne : readonly annexe?: DefAnnexe; readonly grande?: DefGrandeMorceau;
  ```
- `validerMorceau(morceau)` ajoute ces erreurs : famille `annexe` sans `annexe` ou l'inverse ; annexe avec une sortie, une place de créature, ou autre chose qu'une seule pièce dessinée ; `grande.accueillantes` ou `grande.avant` qui nomme une pièce inconnue ; `grande.coupe` qui nomme une liaison inconnue (autre que `'sortie'`).
- Les familles `annexe` n'ont plus l'erreur « morceau sans sortie ».

**Déclarations à écrire (décidées par l'agent principal, d'après 13 §3 et la spec §6.1) :**

| Morceau | obstacle | accueillantes (catégorie) | avant | coupe |
| --- | --- | --- | --- | --- |
| vestibule | — | aucune (D-257) | p-vestibule | aucune |
| carrefour | — | p-couloir (circulation) | p-couloir | l-cloison-1 |
| m-01 | materiel | p-poste (technique), p-palier (circulation) | p-poste | l-poste-galerie |
| m-02 | materiel | p-atelier (technique), p-pompes (technique) | p-atelier | l-atelier-pompes |
| m-03 | — | p-energie (technique), p-reserve (technique) | p-energie, p-reserve | l-energie-embarquement |
| m-04 | creature | p-controle (commandement) | p-controle | l-controle-observation |
| m-05 | creature | p-service (technique), p-quai (fret) | p-service | l-service-tri, l-service-quai |
| m-06 | — | p-couloir (circulation) | p-couloir, p-local | l-couloir-panoramique |
| m-07 | creature | p-quartiers (vie), p-soute (fret), p-coursive (circulation) | p-quartiers, p-soute, p-machines | l-machines-coursive |
| m-08 | materiel | p-quartiers (vie), p-atelier (technique), p-magasin (technique) | p-atelier, p-quartiers, p-ouest | l-ouest-est |
| m-09 | materiel | p-quartiers (vie), p-cale (fret) | p-quartiers, p-sas-ouest | l-sas-ouest-transfert |
| m-10 | creature | p-quartiers (vie), p-entrepot (fret), p-coursive (circulation) | toutes ses pièces | sortie |

Exclues partout : pièces à feu, froides, à gravité commutable et pièces qui touchent la zone, bords du vide, salle des machines, panoramique, sas, embarquement, cabine.

- [ ] **Step 1 : tests qui échouent.** Dans `engine/station.test.ts` :
  - `validerMorceau refuse une annexe avec une sortie` → erreurs contiennent `annexe avec une sortie` ;
  - `validerMorceau refuse une annexe à deux pièces` ;
  - `validerMorceau refuse une coupe inconnue` → message contient l'identifiant ;
  - `validerMorceau accepte coupe ['sortie']`.
  Dans `tools/morceaux.test.ts` :
  - `chaque morceau de MORCEAUX a une déclaration grande valide` (sauf l'essai) : `validerMorceau(morceau)` vide ;
  - `aucune pièce accueillante n'est une pièce à règle spéciale` : aucune des pièces de `accueillantes` n'a `feu`, `froide`, `gravite`, `machines`, ni n'est l'intérieur d'une capsule, ni ne porte un objet `vitrageExterieur`, ni ne touche une liaison `gouffre` ou `verrouillee`, ni une pièce à `gravite` ;
  - `chaque chemin déclare obstacle` (famille `chemin`) et aucun autre ne le fait.
- [ ] **Step 2 :** `npx vitest run engine/station.test.ts tools/morceaux.test.ts` → FAIL.
- [ ] **Step 3 :** types et `validerMorceau` dans `engine/station.ts`, exports dans `engine/index.ts`, champ `grande` dans les douze morceaux selon le tableau.
- [ ] **Step 4 :** `npx vitest run engine/station.test.ts tools/morceaux.test.ts tools/stations.test.ts` → PASS, empreintes figées inchangées : l'assembleur ne recopie ni `grande` ni `annexe` dans le monde, car il ne recopie que `pieces`, `liaisons` et `objets`.
- [ ] **Step 5 :** commit `engine, content: déclarations des morceaux pour les grandes stations (#205, spec §6.1, §6.3)`.

### Task 2 : catalogue des pièces sans obstacle

**Files:**
- Create: `content/catalogue/pieces.ts` (quinze `DefMorceau` de famille `annexe`)
- Create: `content/catalogue/textes.ts` (noms et descriptions calmes, couche univers, **écrits par l'agent principal**)
- Create: `content/catalogue/index.ts` (`CATALOGUE_PIECES: Readonly<Record<string, EntreeMorceau>>`)
- Modify: `content/index.ts` (exports), `content/textes/couches.ts` (`fuitesDuCatalogue`)
- Test: `content/catalogue/catalogue.test.ts`

**Interfaces:**
- Produces : `CATALOGUE_PIECES`, clé = identifiant de l'annexe (`'a-couchettes'`, …) ; chaque pièce a l'id `p-piece` ; clés de texte préfixées `cat_` (`cat_couchettes`) pour ne jamais rencontrer une clé de morceau ou de l'univers (spec §4.2).
- `fuitesDuCatalogue(textes: TextesMorceau): string[]` : mots de la menace (`MOTS_MENACE`) ou réservés aux traces (`MOTS_TRACES`, tâche 11) dans un nom ou une description calme. Le mot « station » y est permis (couche univers).

**Contenu (spec §5.2), tuiles en cases, hauteur 3 sauf mention :**

| id | nom affiché | catégorie | forme | étiquettes | porte | tuile |
| --- | --- | --- | --- | --- | --- | --- |
| a-couchettes | couchettes | vie | impasse | couchage, document, butin | tiree | 4 × 3 |
| a-sanitaires | sanitaires | vie | impasse (`surCouloirDe: 'couchage'`) | eau, document | tiree | 3 × 3 |
| a-refectoire | réfectoire | vie | passage | document | tiree | 6 × 3 |
| a-cambuse | cambuse | vie | impasse | eau, document, butin | tiree | 3 × 3 |
| a-infirmerie | infirmerie | vie | impasse | soin, document, butin | fermee | 4 × 3 |
| a-buanderie | buanderie | vie | impasse | eau, document, butin | tiree | 4 × 3 |
| a-outillage | salle d'outillage | technique | impasse | outillage, rangement, document | tiree | 4 × 3 |
| a-consigne | consigne | technique | impasse | rangement, document, butin | fermee | 4 × 3 |
| a-depot | dépôt | technique | impasse | rangement, lourd, document | fermee | 4 × 3 |
| a-vestiaire | vestiaire | technique | impasse | securite, document | tiree | 3 × 3 |
| a-ventilation | salle de ventilation | technique | impasse | outillage, document | fermee | 4 × 3 |
| a-couloir | couloir | circulation | couloir | document | tiree | 8 × 2 |
| a-plateforme | plateforme de fret | fret | passage | origine, lourd, document | tiree | 6 × 4 |
| a-bureau-fret | bureau du fret | commandement | impasse | document | tiree | 3 × 3 |
| a-laboratoire | laboratoire | science | impasse | document, butin | fermee | 4 × 3 |

Les noms tiennent dans leur tuile (PL-04, `nomLisible`) ; si l'un ne tient pas, la tuile s'élargit d'une case.

**Textes.** Pour chaque pièce : un `Nom` complet (genre, nombre, élision) et deux ou trois descriptions **calmes**, de deux à trois phrases, sans trace ni mot de la menace, au ton « froid et décalé » des pièces abandonnées existantes (`content/textes/univers.ts:28-29`). Une description sur trois environ porte un bruit de station lointain (« Quelque part derrière la cloison, un ventilateur tourne à vide. »). Aucune ne nomme un objet qui pourrait s'y trouver, ni une pièce voisine.

- [ ] **Step 1 : tests qui échouent** (`content/catalogue/catalogue.test.ts`) :
  - `quinze pièces, famille annexe, une pièce dessinée chacune` (`validerMorceau` vide pour chacune) ;
  - `chaque nom tient dans sa pièce` (`nomLisible` vrai) ;
  - `chaque pièce a de deux à trois descriptions, de deux à trois phrases` (`compterPhrases` de `tools/check-texts.ts`) ;
  - `aucun nom du catalogue ne reprend un nom de morceau` : nom affiché distinct de tout nom de pièce de `MORCEAUX` et des noms de l'univers, et sans les mots `réserve`, `poste`, `coursive`, `atelier`, `magasin`, `entrepôt`, `soute`, `cabine`, `quai` ;
  - `fuitesDuCatalogue est vide` ;
  - `aucun chiffre` dans les noms et descriptions ;
  - `les clés de texte commencent par cat_`.
- [ ] **Step 2 :** `npx vitest run content/catalogue/catalogue.test.ts` → FAIL.
- [ ] **Step 3 :** données (`pieces.ts`), puis écriture des textes (`textes.ts`) par l'agent principal, puis `fuitesDuCatalogue`.
- [ ] **Step 4 :** test → PASS ; `npm run typecheck`.
- [ ] **Step 5 :** commit `content: catalogue des pièces sans obstacle (#206, spec §5)`.

### Task 3 : pose des annexes

**Files:**
- Create: `engine/annexes.ts`
- Modify: `engine/pose.ts` (exporter `accroches`, `poser`, `placer`, le type `PieceTuile`, et `sousGraine`)
- Test: `engine/annexes.test.ts`

**Interfaces:**
- Consumes : `DefMorceau`, `DefAnnexe`, `DefGrandeMorceau` (tâche 1) ; `Pose` de `poserTuiles`.
- Produces :
  ```ts
  /** Sous-graine d'une étape de l'assemblage (spec §6.2) : hachage de la graine et du nom de l'étape. */
  export function sousGraine(graine: number, etape: 'annexes' | 'boucles' | 'piste' | 'portes'): number; // dans pose.ts
  export interface AnnexePosee {
    /** Identifiant d'instance, ex. 'a3-couchettes' ; préfixe des pièces et de la porte. */
    readonly instance: string;
    readonly annexe: DefMorceau;
    readonly rect: RectPlan;
    /** Pièce préfixée où elle s'accroche (pièce accueillante de morceau, ou couloir du catalogue). */
    readonly accroche: string;
    /** Rang de la porte sur le mur commun (GE-01). */
    readonly rangPorte: number;
    readonly ouverte: boolean;
  }
  export function poserAnnexes(
    principales: ReadonlyMap<string, RectPlan>,        // pièces du chemin principal, préfixées
    portes: ReadonlyMap<string, number>,                // nombre de portes déjà sur chaque pièce préfixée
    accueillantes: ReadonlyMap<string, CategoriePiece>, // pièces préfixées
    coques: ReadonlySet<string>,                        // pièces de coque déjà posées
    catalogue: readonly DefMorceau[],
    nombre: number,
    graine: number,
  ): readonly AnnexePosee[] | null;
  ```
- Règles (spec §6.1, §6.2, GE-07, GE-09 à GE-11, PL-01, PL-06) :
  - tirage des annexes par la graine : un couloir si `nombre ≤ 7`, deux sinon ; au plus deux fois la même annexe, sauf le couloir ; `a-sanitaires` seulement si `a-couchettes` est tiré ;
  - pose une à une sans retour en arrière (§5.3) : couloirs d'abord, accrochés à une pièce accueillante ; puis les autres, accrochées à un couloir du catalogue de préférence, sinon à une pièce accueillante ;
  - une annexe de catégorie `vie` ne s'accroche jamais à une pièce de catégorie `technique` (GE-09) ;
  - rien ne s'accroche à une impasse ni à un passage ; un couloir reçoit de deux à quatre pièces (GE-11) ;
  - `surCouloirDe` : seulement à un couloir qui dessert déjà une pièce portant cette étiquette (GE-10) ;
  - au plus six portes par pièce (PL-06) ; pas de chevauchement, pas de case réservée devant une coque, pas de vide enfermé (réutiliser `poser`) ;
  - une annexe sans place essaie une autre pièce d'accroche, puis on tire une autre annexe ;
  - **retour `null` si moins de 6 annexes posées**.

- [ ] **Step 1 : tests qui échouent** (`engine/annexes.test.ts`), sur une tuile principale synthétique de trois pièces accueillantes :
  - `pose exactement le nombre demandé quand la place le permet` (8) ;
  - `même graine, même pose` (GE-06) ; `deux graines, deux poses` ;
  - `aucune annexe ne chevauche une autre pièce` ;
  - `aucune pièce ne dépasse six portes` ;
  - `une impasse ne reçoit rien` ; `un couloir reçoit de deux à quatre pièces` ;
  - `les sanitaires sont sur un couloir qui dessert des couchettes` ;
  - `une annexe de vie n'est jamais accrochée à une pièce technique` ;
  - `null quand moins de six annexes tiennent` (une seule pièce accueillante, cernée) ;
  - `moins de 5 ms par pose` sur 200 graines (moyenne).
- [ ] **Step 2 :** `npx vitest run engine/annexes.test.ts` → FAIL.
- [ ] **Step 3 :** `sousGraine` (dans `pose.ts`, via `hacher` de `engine/hachage.ts`), exports, puis `poserAnnexes`.
- [ ] **Step 4 :** test → PASS ; `npx vitest run engine/pose.test.ts` reste vert.
- [ ] **Step 5 :** commit `engine: pose des annexes une à une (#205, GE-09 à GE-11)`.

### Task 4 : portes de boucle

**Files:**
- Create: `engine/boucles.ts`
- Test: `engine/boucles.test.ts`

**Interfaces:**
- Produces :
  ```ts
  export interface PieceBouclable {
    readonly id: string;           // préfixée
    readonly rect: RectPlan;
    readonly segment: number;
    /** Couloir ou passage du catalogue, ou pièce accueillante de morceau ; faux pour une impasse ou une autre pièce. */
    readonly bouclable: boolean;
  }
  export interface BouclePosee { readonly id: string; readonly entre: readonly [string, string]; readonly rang: number }
  export function poserBoucles(
    pieces: readonly PieceBouclable[],
    liaisons: readonly (readonly [string, string])[],  // graphe complet, annexes comprises
    portes: ReadonlyMap<string, number>,
    repaire: string,
    voulues: number,                                    // 1 à 3
    graine: number,
  ): readonly BouclePosee[];
  ```
- Règles (spec §6.4) : deux pièces bouclables, voisines par un mur d'au moins deux cases (`murCommun`), non reliées, même segment, ni l'une ni l'autre le repaire, plus court chemin existant entre elles d'au moins trois liaisons (cycle d'au moins quatre pièces), six portes au plus. Ordre de préférence : segment du repaire, puis segments voisins (±1), puis les autres ; mélange par la graine dans chaque groupe. Identifiants `l-boucle-1`, `l-boucle-2`, … ; zéro boucle possible si aucune paire ne convient.

- [ ] **Step 1 : tests qui échouent** :
  - `relie seulement deux pièces du même segment` ;
  - `jamais le repaire` ; `jamais une pièce non bouclable` ;
  - `ferme un cycle d'au moins quatre pièces` (sur un triangle possible, refuse) ;
  - `préfère le segment du repaire` ;
  - `au plus voulues boucles, zéro si rien ne convient` ;
  - `même graine, mêmes boucles`.
- [ ] **Step 2 :** `npx vitest run engine/boucles.test.ts` → FAIL.
- [ ] **Step 3 :** `poserBoucles`.
- [ ] **Step 4 :** → PASS.
- [ ] **Step 5 :** commit `engine: portes de boucle sans contournement (#205, GE-13)`.

### Task 5 : piste et traces

**Files:**
- Create: `engine/piste.ts`
- Modify: `engine/monde.ts` (`DefPiece.trace`), `engine/vocabulaire.ts` (`Consultation` de pièce), `engine/actions.ts` (`regarder.consulter`)
- Modify: `content/textes/menace.ts` (`traces`), `content/textes/types.ts`, `content/textes/rendu.ts` (`rendreConsultation`)
- Test: `engine/piste.test.ts`, `content/textes/rendu.test.ts` (ou le fichier de test de rendu existant)

**Interfaces:**
- Produces :
  ```ts
  export type IntensiteTrace = 'legere' | 'forte';
  // DefPiece gagne : readonly trace?: IntensiteTrace;
  // Consultation : | { readonly type: 'regarder_piece'; readonly cible: RefPiece; readonly trace?: IntensiteTrace }
  export const PISTE_MIN = 3;
  export const PISTE_MAX = 6;
  export const TRACE_FORTE = 2;
  export function tracerPiste(
    pieces: readonly { readonly id: string; readonly etiquettes?: readonly string[] }[],
    liaisons: readonly (readonly [string, string])[],
    depart: string,
    repaire: string,
    graine: number,
  ): ReadonlyMap<string, IntensiteTrace>;
  ```
- Règles (spec §5.4) : l'origine est une pièce à étiquette `origine` située entre `PISTE_MIN` et `PISTE_MAX` portes du repaire ; à défaut, une pièce quelconque à cette distance, hors départ, tirée par la graine ; la piste est un plus court chemin de l'origine au repaire (en cas d'égalité, choix par la graine) ; chaque pièce de la piste, repaire compris, reçoit `forte` à `TRACE_FORTE` portes ou moins du repaire, `legere` au-delà ; jamais la pièce de départ ; aucune pièce hors piste.
- `regarder.consulter` recopie `DefPiece.trace` dans la consultation de pièce (absent si la pièce n'en a pas : petites stations inchangées).
- `MENACE.traces: { legere: Variantes; forte: Variantes }` : six à huit phrases chacune, **écrites par l'agent principal**, une phrase entière chacune, vraies quelle que soit la pièce (« Des éraflures profondes zèbrent le bas de la porte. », « Une traînée sombre, encore poisseuse, file vers la porte. »). `rendreConsultation` ajoute, pour une pièce marquée, une phrase de `traces[intensite]` après la description, choisie avec le repère `graine:trace:id`.

- [ ] **Step 1 : tests qui échouent** (`engine/piste.test.ts`) :
  - `chaque pièce marquée est sur un plus court chemin de l'origine au repaire` (propriété sur 300 graines d'un graphe synthétique de 25 pièces) ;
  - `forte à deux portes ou moins du repaire, légère au-delà` ;
  - `jamais la pièce de départ` ;
  - `préfère une origine étiquetée origine` ;
  - `piste de 3 à 6 portes quand le graphe le permet` ;
  - `même graine, même piste`.
  Dans le test de rendu : `regarder une pièce marquée ajoute une phrase de trace` ; `une pièce sans trace garde sa description seule` ; `même partie, même phrase`.
- [ ] **Step 2 :** `npx vitest run engine/piste.test.ts content/textes` → FAIL.
- [ ] **Step 3 :** `tracerPiste`, champ `trace`, consultation, textes `traces` (agent principal), rendu.
- [ ] **Step 4 :** → PASS ; `npx vitest run tools/stations.test.ts tools/check-texts.test.ts` verts (aucune petite station n'a de trace).
- [ ] **Step 5 :** commit `engine, content: piste de la créature et traces vraies (#206, spec §5.4)`.

### Task 6 : assemblage d'une grande station

**Files:**
- Modify: `engine/station.ts` (`DefStation.grande`, `assemblerStation`)
- Modify: `engine/monde.ts` (`DefPiece.segment`, `DefPiece.categorie`, `DefPiece.forme`, `DefMonde.boucles`, `DefMonde.bruitsStation`)
- Test: `engine/station.test.ts`, `tools/stations.test.ts`

**Interfaces:**
- Consumes : tâches 1, 3, 4, 5.
- Produces :
  ```ts
  export interface DefStationGrande {
    /** Version du générateur, 1 pour ce lot (spec §4.3). */
    readonly version: number;
    readonly catalogue: readonly DefMorceau[];
    /** Nombre d'annexes à poser (spec §4.1). */
    readonly annexes: number;
    /** Portes de boucle voulues, 1 à 3 (spec §6.4). */
    readonly boucles: number;
  }
  // DefStation gagne : readonly grande?: DefStationGrande;
  // DefPiece gagne : readonly segment?: number; readonly categorie?: CategoriePiece; readonly forme?: FormeAnnexe;
  // DefMonde gagne : readonly boucles?: readonly string[]; readonly bruitsStation?: true;
  ```
- Quand `grande` est présent, `assemblerStation`, après la pose du chemin principal :
  1. calcule le **segment** de chaque pièce de morceau : `2 × rang du morceau + (pièce hors de grande.avant ? 1 : 0)` ;
  2. appelle `poserAnnexes` (sous-graine `annexes`) ; `null` → `{ type: 'sans_plan' }` ;
  3. construit les pièces d'annexe (`prefixer(instance, 'p-piece')`, avec `segment` de la pièce d'accroche, `categorie`, `forme`) et leurs portes (`l-<instance>`, `plan: { rang }`, ouverte selon `porte`, tirée sur la sous-graine `portes`) ;
  4. appelle `poserBoucles` (sous-graine `boucles`) ; les boucles sont des portes ordinaires fermées au départ, listées dans `monde.boucles` ;
  5. appelle `tracerPiste` (sous-graine `piste`) et pose `trace` sur les pièces ;
  6. pose `bruitsStation: true` ;
  7. valide le tout par `validerMonde`.
- Sans `grande`, le monde est **identique** à aujourd'hui, octet pour octet.

- [ ] **Step 1 : tests qui échouent** (`engine/station.test.ts`, sur une station grande de test faite des vrais morceaux M-01, M-08, M-07, M-03 et du catalogue) :
  - `une grande station a 21 à 28 pièces dessinées` ;
  - `même identifiant et même graine, même monde` (GE-06 étendue : `JSON.stringify` égal) ;
  - `aucune annexe n'est accrochée hors d'une pièce accueillante ou d'un couloir du catalogue` ;
  - `chaque pièce a un segment, les annexes celui de leur accroche` ;
  - `bruitsStation vrai, boucles listées` ;
  - `sans grande, le monde ne change pas` : pour chaque composition de `COMPOSITIONS_CONTROLEES`, empreinte égale à la valeur figée existante.
- [ ] **Step 2 :** `npx vitest run engine/station.test.ts tools/stations.test.ts` → FAIL.
- [ ] **Step 3 :** implémentation dans `assemblerStation`, fonctions d'aide privées dans `engine/station.ts` (ou `engine/grande.ts` si `station.ts` dépasse 400 lignes).
- [ ] **Step 4 :** → PASS, avec les empreintes figées inchangées.
- [ ] **Step 5 :** commit `engine: assemblage d'une grande station en trois temps (#205, spec §6.2)`.

### Task 7 : compositions D-292 et catalogue des grandes stations

**Files:**
- Create: `content/stations/grandes.ts`
- Create: `content/stations/grandes-publiees.ts` (`GRANDES_PUBLIEES: readonly string[]`, vide jusqu'à la tâche 9)
- Modify: `content/stations/catalogue.ts` (`Catalogue`, `creerCatalogue`), `content/morceaux/carrefour.ts` (si `cloison2` dépend du final), `content/textes/types.ts` (`TextesMorceau.calmes`)
- Test: `tools/grandes.test.ts`

**Interfaces:**
- Consumes : tâches 1, 2, 6.
- Produces :
  ```ts
  export const VERSION_GENERATEUR = 1;
  export const GRAINE_GRANDE_MAX = 9999;
  export interface CompositionGrande {
    /** 'g1-<chemins>-<final>-<place>' ou 'g1-ol-<A>-<B>-<C>-<final>-<place>'. */
    readonly id: string;
    readonly forme: 'chaine' | 'libre';
    /** Trois chemins dans l'ordre de la station ; en ordre libre, les branches A et B (matérielles) puis C. */
    readonly chemins: readonly string[];
    readonly final: string;
    readonly creature: string;
    readonly annexes: number;
    readonly refus: string | null;
  }
  // Catalogue gagne :
  readonly grandes: readonly CompositionGrande[];
  /** Grandes stations publiées, prouvées : 'g1-…-<graine>' (spec §7.2). */
  readonly publiees: readonly string[];
  /** Pile ou face sur le final (D-253), une station sur trois en ordre libre (D-270), puis une station publiée au hasard ; `composition` force une grande composition. */
  tirerGrande(hasard: () => number, composition?: string): EntreeMonde | Refus;
  /** Grande station exacte, publiée ou non, pour l'outil de publication. */
  construireGrande(composition: string, graine: number): EntreeMonde | Refus;
  // creerCatalogue(assembler, table, publiees, grandesPubliees = GRANDES_PUBLIEES)
  ```
- `prevoirGrandes(table)` : compositions D-292 (chaîne : couples ordonnés de chemins matériels × troisième chemin × final × place ; ordre libre : paires non ordonnées de matériels, branche A au plus petit numéro). La place est celle du troisième chemin s'il est de type créature, sinon celle du troisième chemin matériel ou celle du final. Toutes les paires de morceaux de la station passent `PAIRES`. `annexes = clamp(24 − pièces dessinées, 6, 10)`.
- `definirGrande(composition, graine)` : en chaîne, `[vestibule, c1, c2, c3, final]` ; en ordre libre, accroches vestibule → couloir, couloir → A, couloir → B, sas → C, sortie de C → final (D-257, D-270), commandes dans A et B comme aujourd'hui (D-259). La cloison 2 mène désormais à C : la commande de B vise `cloison2(C)` (`content/morceaux/carrefour.ts:33`, `l-carrefour-<morceau>`), et le test de l'ordre libre le vérifie.
- `TextesMorceau` gagne `calmes?: Readonly<Record<string, Variantes>>` (`content/textes/types.ts`), rempli en tâche 11. Ajoute `grande: { version: 1, catalogue, annexes, boucles: 3 }`.
- Textes : `reunir` des morceaux, puis du catalogue, puis remplacement des descriptions par `TextesMorceau.calmes` quand elles existent (tâche 11), puis `numeroter`.
- `resoudre(id)` : un identifiant `g<n>-…` avec `n ≠ VERSION_GENERATEUR` rend `{ refus: 'Station d’une version précédente des stations : la partie ne peut pas être reprise.' }` ; un identifiant `g1-…` absent de `publiees` est refusé ; sinon `construireGrande`.

- [ ] **Step 1 : tests qui échouent** (`tools/grandes.test.ts`) :
  - `chaque grande composition a deux chemins matériels et la créature dans le troisième chemin ou le final` ;
  - `un chemin de type créature n'est tiré que s'il accueille la créature` ;
  - `nombre de compositions` : la valeur réelle, consignée et figée par le test (environ 192 en chaîne et 96 en ordre libre avant refus) ;
  - `identifiant de 40 caractères au plus avec la graine 9999` ;
  - `en ordre libre, le vestibule donne sur le couloir commun et C suit le sas` ;
  - `annexes = clamp(24 − pièces des morceaux, 6, 10)` ;
  - `construireGrande assemble 21 à 28 pièces, pour 100 graines par composition, au moins 95 % de plans` (propriété, Review Focus 3) ;
  - `resoudre refuse g2-… avec le message de version` et `refuse une g1 non publiée` ;
  - `les petites compositions et tirer sont inchangés` (comptes 536, 368, 168 de `tools/stations.test.ts`).
- [ ] **Step 2 :** `npx vitest run tools/grandes.test.ts tools/stations.test.ts` → FAIL.
- [ ] **Step 3 :** `grandes.ts`, extension du catalogue.
- [ ] **Step 4 :** → PASS.
- [ ] **Step 5 :** commit `content: compositions des grandes stations, créature tardive (#205, D-292)`.

### Task 8 : contrôles structurels

**Files:**
- Create: `tools/controles-grande.ts`
- Test: `tools/controles-grande.test.ts`

**Interfaces:**
- Produces :
  ```ts
  /** Écarts d'une grande station aux règles de la spec §7.3 ; vide si elle les tient. Parcours de graphe, sans recherche d'états. */
  export function controlerGrande(entree: EntreeMonde, composition: CompositionGrande): string[];
  ```
- Contrôles de cette livraison :
  - **coupes** : pour chaque morceau qui déclare une coupe, on calcule l'ensemble U des pièces inatteignables depuis le départ dans le graphe du seul chemin principal, la coupe retirée ; dans le graphe complet (annexes et boucles comprises), la coupe retirée, U reste inatteignable (GE-13) ;
  - **accroches** : chaque porte d'annexe touche une pièce accueillante ou un couloir du catalogue ;
  - **boucles** : même segment, aucune impasse, pas le repaire, cycle d'au moins quatre pièces ;
  - **vestibule** : une seule porte, aucun objet ;
  - **architecture** : GE-09 (aucune annexe de vie accrochée à une pièce technique), GE-10, GE-11, PL-06 ;
  - **piste** : chaque pièce marquée est sur un plus court chemin de l'origine au repaire, jamais le départ ;
  - **taille** : 21 à 28 pièces dessinées ;
  - **noms** : aucun nom affiché en double dans la station (après `numeroter`).

- [ ] **Step 1 : tests qui échouent** :
  - `une station construite passe tous les contrôles` (cinq compositions variées, chaîne et ordre libre) ;
  - `une boucle ajoutée à travers la coupe de M-08 est signalée` (monde modifié à la main) ;
  - `une annexe accrochée à la chambre froide est signalée` ;
  - `une trace dans le vestibule est signalée` ;
  - **propriété (Review Focus 1)** : sur 1 000 tirages de `construireGrande` (compositions et graines tirées à graine fixe), `controlerGrande` est vide pour toute station construite. Le test est marqué lent, exécuté dans `verify`.
- [ ] **Step 2 :** `npx vitest run tools/controles-grande.test.ts` → FAIL.
- [ ] **Step 3 :** `controlerGrande`.
- [ ] **Step 4 :** → PASS.
- [ ] **Step 5 :** commit `tools: contrôles structurels des grandes stations (#205, spec §7.3)`.

### Task 9 : preuve, publication et CI

**Files:**
- Create: `tools/publier-grandes.ts` (script `publier:grandes` dans `package.json`)
- Modify: `tools/verifier-station.ts` (priorité par segment, lots des grandes stations, cache), `tools/empreinte-code.ts` (exclusion de `content/`), `tools/verifier-sortie.ts` (grandes stations), `.github/workflows/verification.yml` (lots si besoin), `content/stations/grandes-publiees.ts` (liste générée)
- Test: `tools/verifier-station.test.ts`, `tools/publier-grandes.test.ts`

**Interfaces:**
- Produces :
  ```ts
  /** Priorité de recherche : le segment de la pièce du passager si le monde en a, sinon le rang du morceau (spec §7.4). */
  export function rangsDesSegments(monde: DefMonde): (piece: string) => number;
  export interface LigneGrande {
    readonly station: string;
    readonly verdict: RapportStation['verdict'] | 'ecartee';
    readonly ecarts: readonly string[];
    readonly etats: number;
    readonly secondes: number;
    readonly actions: number | null;
    readonly ordres?: RapportLibre['ordres'];
  }
  export function verifierGrande(catalogue: Catalogue, station: string, options?: OptionsVerification): LigneGrande;
  /** Écrit content/stations/grandes-publiees.ts : pour chaque grande composition sans refus, les PAR_COMPOSITION premières graines, à partir de 0, assemblées, contrôlées et prouvées. */
  export function publierGrandes(catalogue: Catalogue, parComposition: number): string[];
  ```
- `verifierGrande` : `controlerGrande` d'abord (écarts → `ecartee`), puis `verifierLibre` ou `verifierStation` avec `priorite: rangsDesSegments`. Si la recherche atteint le plafond, la station n'est pas publiée. La preuve guidée par témoin (spec §7.4) n'est écrite que si la mesure de cette tâche montre plus de 10 % de stations non prouvées au plafond.
- `PAR_COMPOSITION = 2` au départ, ajusté pour atteindre au moins 500 stations publiées ; la valeur retenue et le temps sont consignés dans 13.
- `check:stations` vérifie aussi chaque station de `GRANDES_PUBLIEES` (dans les lots) et échoue si l'une n'est pas `prouvee`.
- **Cache refondu** (spec §7.4) : dossier = empreinte du code de `engine/` et des outils du vérifieur, sans `content/` ; clé d'une entrée = `empreinte(monde assemblé sans textes)` + version de la recherche + options, pour les petites comme pour les grandes stations.
- `check:sortie` parcourt aussi `GRANDES_PUBLIEES`, avec ses lots.

- [ ] **Step 1 : tests qui échouent** :
  - `rangsDesSegments suit DefPiece.segment` ;
  - `verifierGrande prouve une grande station construite` (une en chaîne, une en ordre libre, dans les deux ordres) ;
  - `verifierGrande écarte une station qui échoue un contrôle` ;
  - `publierGrandes ne garde que des stations prouvées, triées, sans doublon` (sur trois compositions, `parComposition` 1) ;
  - `une retouche de texte ne change pas la clé de cache d'une station` ;
  - `ecartsDuLot signale une grande station publiée non prouvée`.
- [ ] **Step 2 :** `npx vitest run tools/verifier-station.test.ts tools/publier-grandes.test.ts` → FAIL.
- [ ] **Step 3 :** implémentation ; puis `npm run publier:grandes` (en arrière-plan, long) pour remplir `grandes-publiees.ts`.
- [ ] **Step 4 :** tests → PASS ; `npm run check:stations` et `npm run check:sortie` verts ; temps relevés.
- [ ] **Step 5 :** commit `tools, content: preuve et liste des grandes stations publiées (#205, D-303)`.

### Task 10 : bruits de station

**Files:**
- Create: `engine/bruits.ts`
- Modify: `engine/vocabulaire.ts` (`'bruit_station'` dans `TYPES_EVENEMENT` et `Evenement`), `engine/partie.ts` (`jouer`), `content/textes/socle.ts` (`evenements.bruit_station`), `content/textes/fin.ts` et `app/son/` (le nouvel événement ne donne ni moment de fin ni son)
- Test: `engine/bruits.test.ts`, `engine/partie.test.ts`

**Interfaces:**
- Produces :
  ```ts
  export const FREQUENCE_BRUIT_STATION = 7;
  /** Vrai une action sur sept environ, selon la seule graine de partie et le numéro d'action (spec §5.5). */
  export function bruitDeStation(graine: number, action: number): boolean;
  // Evenement gagne : | { readonly type: 'bruit_station' }
  ```
- Dans `jouer` : après les messages d'arrivée, si `monde.bruitsStation === true`, la partie n'est ni vaincue ni finie, la créature n'a pas eu de contact (`creature?.contact !== true`), et `bruitDeStation(enregistrement.graine, actions + 1)` est vrai, on ajoute `{ type: 'bruit_station' }` aux événements. Rien n'entre dans `EtatPartie`.
- `SOCLE.evenements.bruit_station` : une douzaine de phrases, **écrites par l'agent principal**, sans mot de l'univers (« station ») ni de la menace, au vocabulaire distinct de celui de la créature (« Quelque part, la coque craque longuement. », « La ventilation s'arrête, puis repart avec un hoquet. »).

- [ ] **Step 1 : tests qui échouent** :
  - `bruitDeStation est déterministe et vaut environ 1/7` (sur 7 000 actions, entre 850 et 1 150) ;
  - `une grande station émet des bruits avant le contact, jamais après` ;
  - `une petite station n'en émet jamais` (parcours témoins des `COMPOSITIONS_CONTROLEES`, événements identiques) ;
  - `l'état est le même avec ou sans bruit` (`cleEtatRegles` égale) ;
  - `check:texts : chaque type d'événement a un texte` (NP-01) reste vert.
- [ ] **Step 2 :** `npx vitest run engine/bruits.test.ts engine/partie.test.ts` → FAIL.
- [ ] **Step 3 :** implémentation et textes.
- [ ] **Step 4 :** → PASS ; `npm run typecheck` (les `switch` exhaustifs de `fin.ts` et `app/son/` traitent le nouveau type).
- [ ] **Step 5 :** commit `engine, content: bruits de station avant la rencontre (#205, spec §5.5)`.

### Task 11 : variantes calmes des morceaux et mots réservés aux traces

**Files:**
- Modify: `content/textes/menace.ts` (`MOTS_TRACES`), morceaux concernés (`m-03.ts`, `m-05.ts`, `m-07.ts`, `m-08.ts`, et tout autre que le contrôle signale ; champ `calmes` défini en tâche 7), `tools/check-texts.ts`
- Test: `tools/check-texts.test.ts`

**Interfaces:**
- Produces : `MOTS_TRACES: readonly string[]`, radicaux réservés aux traces : `sang`, `traînée`, `éventr`, `renvers`, `poiss`, `lacér`, `griff`, `douceâtre`, `éclabouss`.
- `calmes[cle]` : description calme d'une pièce de morceau, **écrite par l'agent principal**, utilisée seulement par les grandes stations (tâche 7). Les petites stations gardent `descriptions[cle]`.
- `check:texts` : toute description utilisée par une grande station (catalogue, `calmes`, ou `descriptions` d'une pièce de morceau sans variante calme) ne contient aucun mot de `MOTS_TRACES`.

- [ ] **Step 1 : test qui échoue** : `aucune description calme d'une grande station ne porte de trace` (sur toutes les pièces de `MORCEAUX` et du catalogue).
- [ ] **Step 2 :** `npx vitest run tools/check-texts.test.ts` → FAIL, avec la liste des pièces à réécrire.
- [ ] **Step 3 :** variantes calmes écrites par l'agent principal pour chaque pièce signalée.
- [ ] **Step 4 :** → PASS ; `npm run check:texts` vert.
- [ ] **Step 5 :** commit `content: variantes calmes des pièces de morceau (#206, spec §5.4)`.

### Task 12 : appli, carte et dock

**Files:**
- Modify: `app/jeu.ts` (`preparerLancement`), `app/carte/vue.ts` (bornes de zoom, si la capture le demande), `tools/captures.ts`
- Test: `app/jeu.test.ts`, captures

**Interfaces:**
- `preparerLancement` :
  - adresse nue et NOUVELLE PARTIE → `catalogue.tirerGrande(hasard)` ;
  - `?station=<grande composition>` → `tirerGrande(hasard, composition)` ;
  - `?station=<petite composition>` → `tirer` comme aujourd'hui ;
  - `?station=<identifiant exact>` → `resoudre`.
  - Une partie enregistrée qui se résout reprend, petite ou grande (Review Focus 2).
- Captures : `parcoursGrandeStation` dans `tools/captures.ts`. Il fait trois captures : carte de la station entière au zoom d'ensemble, à 390 et à 320 px ; un couloir du catalogue chargé, à 320 px. Il les soumet à `verifierEcran`, qui contrôle : aucun chiffre, cibles de 44 px, six lignes de récit, défilement du dock. Si les noms disparaissent au zoom d'ensemble, `ZOOM_MIN`/`zoomMin` (`app/carte/vue.ts:93-96`) s'ajuste et le choix est montré au porteur.

- [ ] **Step 1 : tests qui échouent** (`app/jeu.test.ts`) :
  - `une nouvelle partie tire une grande station publiée` (identifiant commence par `g1-` et appartient à `publiees`) ;
  - `?station=<petite composition> tire une petite station` ;
  - `une sauvegarde d'une petite station reprend sur le même monde` (empreinte du monde et de l'état égales avant et après) ;
  - `une sauvegarde g2-… ne reprend pas et tire une grande station, sans écraser la sauvegarde`.
- [ ] **Step 2 :** `npx vitest run app/jeu.test.ts` → FAIL.
- [ ] **Step 3 :** `preparerLancement`, puis `parcoursGrandeStation`.
- [ ] **Step 4 :** tests → PASS ; `npm run captures` vert ; captures relues par l'agent principal.
- [ ] **Step 5 :** commit `app: nouvelle partie dans une grande station ; captures de carte et de dock (#205, D-205)`.

### Task 13 : bots et mesures

**Files:**
- Modify: `tools/bots.ts`, `tools/indicateurs-partie.ts`, `tools/mesurer-difficulte.ts`
- Test: `tools/bots.test.ts`, `tools/indicateurs-partie.test.ts`, `tools/mesurer-difficulte.test.ts`

**Interfaces:**
- `PLAFOND_ACTIONS = 600` ; issue `en_cours` comptée à part, comme aujourd'hui.
- `aVoir` (`tools/bots.ts:113-121`) : une pièce visitée ne redevient « à voir » que si l'un de ses passages était bloqué (refus ou indisponibilité vue) et que l'objet pris depuis peut le débloquer : appui pour une liaison haute, pont pour un gouffre, extinction pour un feu.
- `PROFILS` gagne `'averti'` : comme `prudent`, mais il regarde chaque pièce à sa première visite (consultation gratuite). Avant le premier contact, il pénalise de 200 points les passages non ouverts d'une pièce où il a lu une trace `forte`.
- `IndicateursPartie` gagne : `actionPremierContact` (existe) ; `sansContact: boolean` ; `boucleEnPoursuite: boolean` (une porte de `monde.boucles` franchie après le premier contact) ; `momentDefaite: number | null` (action de la défaite divisée par le nombre d'actions de la partie).
- `mesurer:difficulte -- --grandes` : 1 000 tirages par `tirerGrande` à graine fixe. Il rend le rapport #194 §2.4 étendu :
  - évacuations par profil ;
  - part sans contact ;
  - médiane d'actions avant le contact ;
  - actions et pièces visitées ;
  - part des poursuites par une boucle ;
  - répartition du moment de la défaite ;
  - comparaison avec les petites stations.

- [ ] **Step 1 : tests qui échouent** :
  - `aVoir ne rouvre pas une pièce sans passage bloqué quand l'inventaire change` ;
  - `le profil averti évite une pièce marquée forte avant le contact` (monde de test à deux chemins) ;
  - `indicateurs : sansContact, boucleEnPoursuite, momentDefaite` sur des parties construites ;
  - `mesurer-difficulte --grandes tourne sur 20 tirages et rend les nouvelles lignes`.
- [ ] **Step 2 :** `npx vitest run tools/bots.test.ts tools/indicateurs-partie.test.ts tools/mesurer-difficulte.test.ts` → FAIL.
- [ ] **Step 3 :** implémentation.
- [ ] **Step 4 :** → PASS. Puis lancer `npm run mesurer:difficulte -- --grandes` en arrière-plan. **Alerte au porteur** si la part sans contact dépasse 10 % ou si la médiane d'actions de B2 avant le contact dépasse 45 (spec §10, §11). Chiffres consignés dans 13.
- [ ] **Step 5 :** commit `tools: bots et mesures des grandes stations (#205, spec §11)`.

### Task 14 : décisions, documents et galerie

**Files:**
- Modify:
  - `docs/03-decisions.md` : D-290 à D-304, D-276 et D-279 validées, lignes « Modifiée par » et « Précisée par », index, date ;
  - `docs/06-contrats.md` : Q-204 à Q-219, prochain numéro ;
  - `docs/13-morceaux-lancement.md` : §3 déclarations, §7 mesures de la livraison 1 ;
  - `docs/14-carte.md` : §5.3 à §5.6, GE-08, GE-13, libellé de D-208 ;
  - `docs/12-interface-ecrans.md` : §1.5, en vue de la livraison 3 ;
  - `docs/contrats/C-03*.md`, `C-08*.md` ;
  - `docs/02-roadmap.md` ;
  - `docs/00-lire-en-premier.md` ;
  - `docs/superpowers/specs/2026-10-18-grandes-stations-design.md` : la phrase sur la sauvegarde d'une autre version suit ce que fait l'appli (tâche 12).
- Create: galerie des plans des grandes stations (`npm run captures` ou `tools/plans-svg.ts`), jointe à la PR.

- [ ] **Step 1 :** entrées de décision au format du journal (exemple D-280, `03:2257-2271`), réponses du porteur mot pour mot (annexe A de la spec).
- [ ] **Step 2 :** `npm run check:links` vert.
- [ ] **Step 3 :** galerie générée, relue.
- [ ] **Step 4 :** commit `docs: décisions et documents des grandes stations, livraison 1 (#205, #206, D-290 à D-304)`.

### Task 15 : vérification complète de la livraison 1

- [ ] **Step 1 :** `npm run verify` → vert (lint, types, imports, liens, tests, `check:texts`, `check:stations`, `check:sortie`).
- [ ] **Step 2 :** relecture des mesures (tâches 9 et 13) et des captures (tâche 12) par l'agent principal ; écarts au critère du §11 listés pour le porteur.
- [ ] **Step 3 :** pousser la branche, ouvrir la PR en brouillon (D-304), avec galerie, mesures et mention « validation humaine requise ».
- [ ] **Step 4 :** demander au porteur l'essai sur téléphone s'il le souhaite. Livraison 2 ensuite, sur la même branche, avec son propre plan.
