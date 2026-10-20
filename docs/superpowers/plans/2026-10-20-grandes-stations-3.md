# Grandes stations, livraison 3 : lore, documents et notes de rangement — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** chaque grande station porte cinq à sept documents à lire (vie de la station, histoire de la créature, tentatives sur les obstacles, notes de rangement qui disent où une clé est partie), tirés d'une réserve d'une quarantaine écrite à la main et cohérente avec une bible ; l'appli et la CLI les montrent sur une fiche propre à leur support ; rien d'autre ne change au jeu.

**Architecture:** le contenu décrit la réserve sous forme d'emplacements (couche, étape, étiquettes, morceau, clé désignée) ; l'assembleur ajoute une étape pure après le butin, `engine/documents.ts`, sur sa sous-graine, qui pose des objets fixes sans qualité et, pour une note de rangement, la pièce qu'elle désigne. Le contenu choisit le corps par hachage et remplit le seul trou permis, la pièce d'une note. Un rendu structuré, commun à l'appli et à la CLI, remplace la chaîne unique de `rendreConsultation` pour un document.

**Tech Stack:** TypeScript 6, React 19 (appli), Vitest 4, Playwright (captures) ; aucune dépendance ajoutée.

**Spec :** `docs/superpowers/specs/2026-10-18-grandes-stations-design.md` (approuvée le 2026-10-19) : §7.3 (couverture), §8 (lore), §9 (interface), §11 (textes, interface, bot averti) ; décisions D-299 (univers), D-300 (documents), D-301 (fiche dans la bulle), numérotées D-298 à D-300 dans la conception. Maquette retenue : variante B de `docs/maquette/documents.html`.

## Global Constraints

- Cinq supports : note manuscrite, journal de terminal, message enregistré, inscription, affiche de la compagnie (§8.4). Une à cinq phrases, ou au plus cinq lignes de journal.
- Cinq à sept documents par station, jamais au vestibule ; une station ne montre jamais deux documents du même nom de puce (NP-04).
- Réserve d'environ 40 : univers 8, menace 12 (3 par étape : premiers signes, disparition, confinement, derniers mots), morceaux 8, notes de rangement 8 (une par clé déplaçable — bidon, caisse, bloc, burette, combinaison, découpeuse, planche — et une pour la trousse de soin).
- Une note de rangement est toujours posée quand sa clé a quitté son morceau, dans la pièce qui fait face à l'obstacle (la pièce de la coupe du morceau côté avant) ; le trou `{le:piece}` (formes `le`, `de`, `a`) désigne la vraie pièce de la clé, lettre comprise. C'est le seul trou permis dans un document.
- Un document de morceau n'apparaît que si son morceau est dans la station ; il est posé côté avant du morceau, au plus près de l'obstacle, ou dans une annexe de la pièce qui lui fait face.
- Les documents de la menace sont posés dans l'ordre du trajet : étape 1 près du réveil, étape 4 près de la fin.
- Honnêteté (C-05) : un document ne contredit jamais l'état réel et n'affirme rien d'une pièce du plan, sauf par le trou rempli à l'assemblage.
- Chiffres permis dans le corps d'un document seulement (heures, dates, codes, numéros) ; ailleurs, aucun chiffre à l'écran (12 §1.5). Le nom de puce et la ligne « où » n'en portent pas.
- Couches (§8.4) : univers sans mot de la menace ni vocabulaire des traces ; menace sans « station » ; morceaux sans aucun mot réservé.
- Écriture : la bible (`docs/17-univers.md`) et tous les documents sont écrits par l'agent principal (D-243), puis relus par un relecteur indépendant (D-116) ; français soigné, phrases entières, sans pronom substitué (D-281) ; le passager au masculin, vouvoyé ; IA Station ne change pas.
- Un document est un objet fixe, non portable, sans qualité ; « regarder » est gratuit et n'est pas enregistré (D-014). Rien ne le signale dans le dock ni sur la carte (§9.4).
- Petites stations, AR-01, AR-02, stations de test : inchangées ; empreintes figées inchangées ; format de sauvegarde inchangé. Version du générateur : `g1` jusqu'à la fusion.
- Commits en français, préfixés comme le dépôt, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Une note de rangement qui ment** : la pièce qu'elle nomme ne contient pas (ou plus, au départ) la clé, ou la lettre de la pièce est fausse. Attendu : jamais ; contrôle et propriété sur toutes les stations publiées (tâche 7).
2. **Un chiffre hors du corps d'un document** (nom de puce, ligne « où », récit, rappel), ou le contrôle des chiffres des captures qui bloque un journal horodaté. Attendu : chiffres seulement dans le corps (tâche 6, tâche 9).
3. **Un document long à 320 px** (journal de cinq lignes, message avec didascalies) qui déborde de la bulle ou cache la navigation ; le lecteur d'écran qui lit le texte sans le support. Attendu : la fiche défile, support puis texte (tâche 8, captures tâche 9).
4. **Un document de morceau ou de menace hors de propos** : document d'un morceau absent, étape 4 au réveil, document dans le vestibule. Attendu : jamais (tâche 7).
5. **Une sauvegarde de la livraison 2** sur une station qui a désormais des documents. Attendu : reprise refusée, sauvegarde intacte (le moteur le fait déjà ; propriété épinglée en tâche 9).

---

### Task 1 : documents dans le moteur

**Files:**
- Modify: `engine/monde.ts` (`DefObjet.document`, `DefObjet.designe`, validation), `engine/station.ts` (`EmplacementDocument`, `ReserveDocuments`, `DefStationGrande.documents`), `engine/actions.ts` et `engine/vocabulaire.ts` (consultation d'un document), `engine/index.ts`
- Test: `engine/environnement.test.ts` (ou `engine/monde.test.ts`), `engine/actions.test.ts`

**Interfaces:**
- Produces :
  ```ts
  // engine/monde.ts — DefObjet gagne :
  readonly document?: true;          // objet fixe à lire, sans qualité
  readonly designe?: string;          // note de rangement : pièce qu'elle nomme (id interne)
  // engine/station.ts
  export type CoucheDocument = 'univers' | 'menace' | 'morceau' | 'rangement';
  export interface EmplacementDocument {
    readonly id: string;              // clé de texte du document (section `documents` du contenu)
    readonly couche: CoucheDocument;
    readonly etape?: 1 | 2 | 3 | 4;   // menace
    readonly etiquettes?: readonly string[]; // univers : étiquettes de pièce du catalogue acceptées
    readonly morceau?: string;        // morceau, rangement : morceau du document
    readonly cle?: string;            // rangement : objet désigné (id d'objet du morceau, ou 'butin:soin' pour la trousse)
  }
  export interface ReserveDocuments { readonly emplacements: readonly EmplacementDocument[]; readonly parStation: readonly [number, number] }
  // DefStationGrande gagne : readonly documents?: ReserveDocuments;
  ```
- La consultation « regarder » d'un objet document rend `{ type: 'regarder_document', cible, designe?: RefPiece }` (référence publique de la pièce nommée, pour remplir le trou).

- [ ] **Step 1 : tests qui échouent** : `validerMonde` refuse un document portable, ou porteur d'une qualité (même liste que l'invariant du butin, plus `butin`) ; refuse `designe` sans `document` ou vers une pièce absente ; « regarder » un document rend `regarder_document` avec `designe` en référence publique ; un document n'apparaît dans aucun autre menu que « regarder ».
- [ ] **Step 2 :** `npx vitest run engine` → FAIL.
- [ ] **Step 3 :** types, validations, consultation.
- [ ] **Step 4 :** → PASS ; `tools/stations.test.ts` vert sans retouche des empreintes.
- [ ] **Step 5 :** commit `engine: documents à lire et notes de rangement (#209, spec §8.5)`.

### Task 2 : pose des documents

**Files:**
- Create: `engine/documents.ts`, `engine/documents.test.ts`
- Modify: `engine/grande.ts` (`etendreGrande` : étape après le butin, sous-graine `'documents'` ; boucle de couverture), `engine/pose.ts` (`sousGraine` : étape `'documents'`)
- Test: `tools/grande-assemblage.test.ts`

**Interfaces:**
- Produces :
  ```ts
  export interface PieceDocument { readonly id: string; readonly etiquettes: readonly string[]; readonly morceau: string | null; readonly rang: number; readonly catalogue: boolean }
  export interface DocumentPose { readonly emplacement: EmplacementDocument; readonly piece: string; readonly designe?: string }
  /** Documents de la station, sur la sous-graine 'documents' ; `depart` n'en reçoit jamais. */
  export function poserDocuments(reserve: ReserveDocuments, pieces: readonly PieceDocument[], clesDeplacees: ReadonlyMap<string, { readonly piece: string; readonly face: string }>, trousse: string | null, morceaux: ReadonlySet<string>, depart: string, graine: number): readonly DocumentPose[];
  ```
  `rang` : distance en portes depuis le départ, pour l'ordre du trajet ; `face` : pièce de la coupe du morceau de la clé, côté avant ; `trousse` : pièce de la trousse de soin s'il y en a une.

**Règles de pose (choix de l'agent, la spec les laisse au constructeur, §14), dans l'ordre :**
1. Nombre tiré dans `parStation` (5 à 7).
2. Une note de rangement pour chaque clé déplacée, dans sa pièce `face`, qui désigne la pièce de la clé (obligatoire, même au-delà du nombre tiré).
3. Un document de morceau par morceau présent, tant qu'il reste de la place : sa pièce `face`, sinon une annexe pendue à cette pièce.
4. Les documents de la menace, une étape par tiers du trajet (`rang` rapporté au plus grand) : 1 et 2 dans le premier tiers, 3 dans le deuxième, 4 dans le dernier, autant que la place le permet, au moins un.
5. Les documents de l'univers, dans les pièces du catalogue dont une étiquette est acceptée.
6. La note de la trousse, s'il reste de la place et qu'une trousse est posée.
Pièces : les pièces du catalogue d'abord, celles qui ne portent encore rien (clé, butin, bout de boucle, trace, document) en priorité ; jamais deux documents dans une même pièce ; jamais le vestibule ; aucun nom de puce en double (deux emplacements de même nom de puce ne sont jamais tirés ensemble).
**Couverture (§7.3).** Après la pose, si une pièce du catalogue ne porte rien, `etendreGrande` refait l'assemblage avec une annexe de moins (jamais sous 6) ; sans couverture à 6, la graine n'a pas de plan.

- [ ] **Step 1 : tests qui échouent** (`engine/documents.test.ts`, mondes construits) : nombre dans `parStation` hors notes obligatoires ; une note par clé déplacée, dans `face`, avec `designe` = pièce de la clé ; aucun document de morceau absent ; étapes de la menace croissantes avec `rang` ; jamais `depart`, jamais deux documents par pièce ; priorité aux pièces vides ; même graine, même pose.
- [ ] **Step 2 : test de propriété qui échoue** (`tools/grande-assemblage.test.ts`) : sur 300 graines de vraies compositions avec une réserve d'essai, chaque pièce du catalogue porte au moins une chose ; part des graines sans plan avant et après l'étape, et part des stations à moins d'annexes, journalisées.
- [ ] **Step 3 :** `npx vitest run engine/documents.test.ts tools/grande-assemblage.test.ts` → FAIL.
- [ ] **Step 4 :** implémentation ; l'étape ne tourne que si `grande.documents` est défini.
- [ ] **Step 5 :** → PASS ; mesures notées au registre.
- [ ] **Step 6 :** commit `engine: documents posés dans les grandes stations (#209, spec §8.4, §7.3)`.

### Task 3 : rendu structuré d'un document

**Files:**
- Create: `content/textes/document.ts`, `content/textes/document.test.ts`
- Modify: `content/textes/types.ts` (`TextesMorceau.documents`, `TexteDocument`), `content/textes/rendu.ts` (`rendreConsultation` délègue), `content/index.ts`

**Interfaces:**
- Produces :
  ```ts
  export type SupportDocument = 'note' | 'journal' | 'message' | 'inscription' | 'affiche';
  export interface TexteDocument {
    readonly puce: Nom;               // nom de puce affiché, avec genre, nombre et élision ; sans chiffre
    readonly support: SupportDocument;
    readonly ou: string;              // ligne « où », vraie dans toute pièce que ses étiquettes autorisent
    readonly corps: readonly string[]; // paragraphes ; pour un journal, lignes « hh:mm  texte »
    readonly signature?: string;       // note : prénom de l'auteur
  }
  export interface DocumentRendu { readonly support: SupportDocument; readonly libelleSupport: string; readonly ou: string; readonly corps: readonly { readonly texte: string; readonly heure?: string; readonly didascalie?: boolean }[]; readonly signature?: string; readonly piece?: string }
  export function rendreDocument(textes: TextesMonde, consultation: Extract<Consultation, { type: 'regarder_document' }>): DocumentRendu;
  ```
  Le nom de puce d'un document est son nom affiché : la réunion des textes (`couches.ts`) l'ajoute aux `noms` sous la clé du document, pour que `nomDe` et la numérotation le traitent comme tout objet ; `piece` est le nom rempli du trou, pour le souligner à l'écran. Pour la chaîne de `rendreConsultation` (lecteur d'écran, historique) : support, « où », puis le corps.

- [ ] **Step 1 : tests qui échouent** : un journal rend une ligne par entrée, avec son heure à part ; un message sépare les didascalies entre crochets ; une note de rangement remplit `{le:piece}`, `{de:piece}`, `{a:piece}` avec le nom de la pièce désignée, lettre comprise ; un trou autre que `piece` lève une erreur ; un document sans `designe` qui porte un trou lève une erreur.
- [ ] **Step 2 :** `npx vitest run content/textes/document.test.ts` → FAIL.
- [ ] **Step 3 :** implémentation.
- [ ] **Step 4 :** → PASS.
- [ ] **Step 5 :** commit `content: rendu structuré d'un document (#209, spec §8.5)`.

### Task 4 : bible et réserve de documents (agent principal)

**Files:**
- Create: `docs/17-univers.md`, `content/textes/documents.ts` (documents de l'univers, de la menace et note de la trousse)
- Modify: `content/morceaux/m-0x.ts` (documents de morceau et notes de rangement de leurs clés, section `documents`)

Écrit par l'agent principal, jamais délégué (D-243) ; puis relu par un relecteur indépendant sur la qualité et la cohérence avec la bible (D-116).

- [ ] **Step 1 :** la bible : cadre (§8.1), chronologie de l'incident en quatre étapes (§8.2), membres d'équipage (prénom, métier, voix), lieux hors du plan (jamais le nom d'une pièce de morceau ou du catalogue), règles d'écriture ; interdite au playtester comme 08 et 09.
- [ ] **Step 2 :** la réserve : 8 univers, 12 menace (3 par étape, indices vrais de §8.2 : bruit, conduits étroits, froid, feu, porte forcée — D-279 validée), 8 morceaux (un témoignage pour huit des dix morceaux, au choix de l'agent principal, dont l'indice à mots couverts du passage caché de M-05), 8 notes de rangement ; chaque document a son auteur, ne dit d'aucun autre auteur qu'il est vivant ou mort, et respecte longueur, support et couche.
- [ ] **Step 3 :** relecture indépendante (qualité, bible, honnêteté) ; corrections par l'agent principal.
- [ ] **Step 4 :** commit `docs, content: bible et réserve de documents (#209, D-299, D-300)`.

### Task 5 : réserve branchée dans les grandes stations

**Files:**
- Modify: `content/stations/grandes.ts` (`grande.documents`), `content/textes/couches.ts` (réunion des documents), `content/catalogue/index.ts` si besoin
- Test: `tools/catalogue-pieces.test.ts` ou un nouveau `tools/documents.test.ts`

**Interfaces:**
- Produces : `RESERVE_DOCUMENTS: ReserveDocuments` (`parStation: [5, 7]`), dérivée des textes : chaque texte a un emplacement et chaque emplacement un texte.

- [ ] **Step 1 : tests qui échouent** : bijection textes ↔ emplacements ; 8 notes de rangement, une par clé déclarée (`grande.cles`) plus la trousse ; 12 documents de la menace, 3 par étape ; une vraie grande station porte 5 à 7 documents (plus les notes obligatoires), chacun avec son texte rendu.
- [ ] **Step 2 :** → FAIL ; **Step 3 :** branchement ; **Step 4 :** → PASS.
- [ ] **Step 5 :** commit `content: documents dans les grandes stations (#209)`.

### Task 6 : contrôle des textes

**Files:**
- Modify: `tools/check-texts.ts`, `content/textes/couches.ts` (fuites dans les deux sens)
- Test: `tools/check-texts.test.ts`, `tools/couches.test.ts`

- [ ] **Step 1 : tests qui échouent** : `check:texts` contrôle toute la réserve par `rendreDocument`, sans station de référence : structure, trou (seulement `piece`, seulement dans une note de rangement), couche et mots réservés (univers : ni menace ni traces ; menace : pas « station » ; morceaux : aucun mot réservé), longueur (une à cinq phrases, au plus cinq lignes de journal), noms de puce distincts, aucun chiffre dans la puce ni la ligne « où » ; il contrôle aussi directement les phrases de pillage, de trace et de bruit (reporté de la livraison 2) ; et quelques grandes stations publiées par exploration.
- [ ] **Step 2 :** → FAIL ; **Step 3 :** implémentation ; **Step 4 :** → PASS ; `npm run check:texts` vert.
- [ ] **Step 5 :** commit `tools: check:texts contrôle les documents (#209, spec §11)`.

### Task 7 : contrôles structurels des documents

**Files:**
- Modify: `tools/controles-grande.ts`
- Test: `tools/controles-grande.test.ts`

- [ ] **Step 1 : tests qui échouent** (une station construite passe ; chaque écart, provoqué sur une station construite, est signalé) : document au vestibule ; plus ou moins de documents que permis ; document d'un morceau absent ; note de rangement absente pour une clé déplacée, ailleurs que dans la pièce `face`, ou dont `designe` n'est pas la pièce de la clé au départ ; étapes de la menace hors de l'ordre du trajet ; nom de puce en double ; pièce du catalogue qui ne porte rien (couverture §7.3).
- [ ] **Step 2 :** → FAIL ; **Step 3 :** implémentation ; **Step 4 :** → PASS ; la propriété « 1 000 tirages » reste verte.
- [ ] **Step 5 :** commit `tools: contrôles des documents (#209, spec §7.3)`.

### Task 8 : fiche document dans l'appli et dans la CLI

**Files:**
- Modify: `app/jeu.ts` (`consulter` rend aussi la structure), `app/EcranJeu.tsx` et `app/bulle.tsx` (fiche document, variante B), `app/styles.css`, `cli/partie-cli.ts`
- Test: `app/EcranJeu.test.tsx`, `cli/partie-cli.test.ts`

**Interfaces:**
- Consumes : `rendreDocument`, `DocumentRendu` (tâche 3).

- [ ] **Step 1 : tests qui échouent** : la bulle d'un document montre, en haut, le support en capitales et la ligne « où », puis le corps dans la typographie de son support (note en italique avec filet et signature à droite ; journal dans un cadre, heures en colonne ; message avec didascalies en couleur secondaire ; inscription en grandes capitales ; affiche sous un double cadre) ; la pièce remplie est soulignée en pointillé ; le lecteur d'écran lit le support puis le texte ; « regarder » un document n'engage aucune action et n'écrit rien ; la CLI affiche le support, la ligne « où », puis le corps avec ses retours à la ligne.
- [ ] **Step 2 :** → FAIL ; **Step 3 :** implémentation d'après `docs/maquette/documents.html`, variante B ; **Step 4 :** → PASS.
- [ ] **Step 5 :** commit `app, cli: fiche document (#209, D-301)`.

### Task 9 : bots, republication, mesures et captures

**Files:**
- Modify: `tools/bots.ts` (profil averti), `tools/captures.ts` (vérification des chiffres : corps d'un document épargné), `content/stations/grandes-publiees.ts`, `tools/grandes-temoins.json` (générés), `app/jeu.test.ts`
- Test: `tools/bots.test.ts`

- [ ] **Step 1 : test qui échoue** : le profil averti regarde chaque document à sa première visite et, après une note de rangement, va vers la pièce qu'elle nomme (monde construit, comme le test de la trace forte de la livraison 1).
- [ ] **Step 2 :** → FAIL ; **Step 3 :** implémentation ; **Step 4 :** → PASS.
- [ ] **Step 5 :** test de reprise (épingle, sans phase rouge) : une sauvegarde faite sur la station sans ses documents, chargée sur la station avec, donne `reprise_impossible`, sauvegarde intacte.
- [ ] **Step 6 :** republication (`npm run publier:grandes -- --par=2 --essais=8 --processus=14`, en arrière-plan) ; au moins 500 stations, environ un tiers en ordre libre ; `check:stations` vert.
- [ ] **Step 7 :** `npm run mesurer:difficulte -- --grandes` et `-- --grandes --sans-butin` ; montrer au porteur : B2 et B4, abandons, comparaison avec la livraison 2 (hypothèse : les notes de rangement font baisser les abandons).
- [ ] **Step 8 :** captures à 390 et 320 px : une fiche de chaque support, dont une note de rangement avec sa pièce soulignée et un journal horodaté ; la carte et le dock de couloir chargé restent ; les noms de la carte au zoom d'ensemble sont jugés sur les captures et, s'ils ne se lisent pas, les bornes de zoom sont ajustées et montrées au porteur (§9.3) ; `npm run build && npm run captures` → « réussis », code 0.
- [ ] **Step 9 :** commits `tools: le profil averti lit les documents (#209, spec §11)`, `content, tools: grandes stations republiées avec documents (#209)`, `tools: captures des documents (#209)`.

### Task 10 : décisions et documents

**Files:**
- Modify: `docs/03-decisions.md` (limites de D-299 à D-301 : règles de pose, mesures), `docs/12-interface-ecrans.md` (§3.5, §4.4 : fiche document ; §1 principe 5 : exception déjà notée), `docs/contrats/C-06-observation-connaissances.md` (§5 : notes de rangement), `docs/contrats/C-07-textes.md` (§2, §6 : exceptions de D-300), `docs/13-morceaux-lancement.md` (§7.12 livraison 3), `docs/00-lire-en-premier.md`, renvois vers §7.11 et §7.12 (13, 02, 14, C-08 §7, D-291, D-303)

- [ ] **Step 1 :** entrées au format du journal ; mesures de la tâche 9 ; la bible reliée depuis 00 et 13.
- [ ] **Step 2 :** `npm run check:links` → vert.
- [ ] **Step 3 :** commit `docs: lore et documents, livraison 3 (#209, D-299 à D-301)`.

### Task 11 : vérification complète de la livraison 3

- [ ] **Step 1 :** `npm run verify` → toutes les étapes vertes.
- [ ] **Step 2 :** relecture des mesures et des captures par l'agent principal ; écarts aux critères du §11 listés pour le porteur.
- [ ] **Step 3 :** relecture finale de toute la livraison, puis pousser la branche et mettre à jour la PR #230 (trois livraisons, mesures, « validation humaine requise »).
- [ ] **Step 4 :** proposer au porteur l'essai sur téléphone (une note de rangement suivie jusqu'à sa clé, un journal, un message) ; la fusion attend son accord (D-304) et le passage de chaque morceau dans une grande station (D-302).
