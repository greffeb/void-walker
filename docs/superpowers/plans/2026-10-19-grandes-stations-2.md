# Grandes stations, livraison 2 : clés dispersées, butin et signal de sortie — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dans une grande station, les objets qui résolvent un obstacle peuvent attendre dans une pièce du catalogue avant leur obstacle (#202), deux ou trois salles en impasse cachent un butin ou ont été pillées (#207), chaque station publiée est prouvée sans son butin et `check:sortie` couvre les grandes stations ; les petites stations restent strictement inchangées.

**Architecture:** l'assembleur ajoute deux étapes pures après la piste, chacune sur sa sous-graine : `engine/cles.ts` (où poser chaque clé) et `engine/butin.ts` (salles de butin, objets, pillage). Le contenu déclare les clés de chaque morceau et la table de butin ; le moteur ne lit que des étiquettes, des segments et des qualités (D-078). La preuve rejoue le témoin du chemin principal et le répare par une recherche locale là où une clé a quitté sa pièce.

**Tech Stack:** TypeScript 6, Vitest 4, tsx pour les outils ; aucune dépendance ajoutée.

**Spec :** `docs/superpowers/specs/2026-10-18-grandes-stations-design.md` (approuvée le 2026-10-19), §6.5, §6.6, §7.3 (clés, butin, noms), §7.4, §11 ; décisions D-319 (clés) et D-320 (butin), numérotées D-318 et D-319 dans la conception. La note de rangement (§6.5, « l'indice ensuite ») est un document : elle vient en livraison 3, avec le contrôle de couverture (§7.3). La refonte du cache des verdicts reste reportée (arbitrage de la livraison 1).

## Global Constraints

- Clés : bidon (M-01), caisse (M-02), bloc (M-03), burette (M-04), combinaison et découpeuse (M-06), planche (M-08). Les commandes fixes ne bougent jamais (interrupteurs, pupitres, console, avertisseur, kit de rustine).
- Pièce d'une clé : sa pièce d'origine, ou une pièce du catalogue d'étiquette compatible accrochée du côté avant de son propre morceau ou dans la zone qui le précède immédiatement ; clés du final : le final ou la zone du dernier chemin ; en ordre libre, la clé d'une branche ne va que du côté avant de sa branche ou dans le tronc (couloir commun et ses annexes).
- Jamais dans le vestibule ; jamais deux clés de morceaux différents dans la même pièce ; au plus une clé encombrante déplacée par station (planche, caisse, bloc) ; une clé large (le bloc) seulement là d'où elle rejoint la capsule sans passage étroit.
- Étiquettes des clés (spec §5.2) : bidon `eau` ; caisse `rangement`, `lourd` ; bloc `lourd` ; burette `outillage` ; combinaison et découpeuse `securite` ; planche `rangement`. La consigne reçoit l'étiquette `lourd`.
- Caisse des grandes stations : portable, encombrante, déplaçable, appui, jamais large ; dans une petite station, elle reste non portable.
- Butin : deux ou trois salles en impasse d'étiquette `butin`, au moins une accrochée à une pièce de la piste ; zéro ou un objet chacune, tiré sans remise ; trousse de soin (soin, 1 dose), burette de réserve (glissant, 1 dose, seulement après la coupe de M-04 si M-04 est dans la station). Poids de départ : vide 2, trousse 1, burette 2 — seuils montrés au porteur avec les mesures.
- Un butin n'a aucune qualité passive (ni encombrant, large, appui, pont, source, alimente, deverrouille, capsule, vitrage, machines, gravité, fermeture, avertisseur). Aucun nom affiché en double dans une station (NP-04).
- Salle de butin vide : une phrase de pillage (couche univers), sans mot réservé aux traces (`MOTS_TRACES`) ni de la menace. Rien dans l'interface ne signale une salle de butin.
- Textes (pillage, butin, variante de la caisse) écrits par l'agent principal, jamais délégués (D-243) ; vrai français, sans pronom substitué (D-281) ; aucun chiffre.
- Petites stations, AR-01, AR-02, stations de test : même monde, même état initial, même menu ; empreintes figées inchangées. Format de sauvegarde inchangé.
- Version du générateur : `g1` jusqu'à la fusion (spec §12) ; la liste est republiée à la fin de cette livraison.
- Commits en français, préfixés comme le dépôt, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Une clé posée hors d'atteinte avant son obstacle** (derrière sa propre coupe, dans l'autre branche de l'ordre libre, dans une pièce qu'on n'atteint qu'après le final). Attendu : jamais ; contrôle « Clés » et test de propriété sur 1 000 tirages (tâche 5).
2. **Le bloc posé là où seul un passage étroit mène à la capsule.** Attendu : il reste chez lui. Test unitaire de `poserCles` sur un monde construit (tâche 2).
3. **Un butin qui donne un avantage passif, ou un nom en double** (« burette » de M-04 et « burette de réserve »). Attendu : table refusée par son test ; noms distincts (tâche 4, tâche 5).
4. **Une sauvegarde de la version de test de la livraison 1** sur un identifiant `g1-…` dont la station a changé. Attendu : reprise refusée (« Sauvegarde incohérente avec son journal »), sauvegarde intacte, jamais reprise sur un autre monde. Test de l'appli (tâche 10).
5. **Un témoin réparé qui passe par un dé ou une blessure**, ou qui ne se rejoue pas sur la station complète (avec son butin). Attendu : refusé, puis recherche directe ; un témoin publié se rejoue avec et sans butin (tâche 6).

---

### Task 1 : déclarations des clés, caisse portable, champs du butin

**Files:**
- Modify: `engine/station.ts` (types `DefCle`, `DefGrandeMorceau.cles`, `DefStationGrande.butin`, `validerMorceau`), `engine/monde.ts` (`DefObjet.butin`, `DefPiece.pillee`, validation déplaçable et portable), `engine/index.ts` (exports)
- Modify: `content/morceaux/m-01.ts`, `m-02.ts`, `m-03.ts`, `m-04.ts`, `m-06.ts`, `m-08.ts` (champ `grande.cles`), `content/catalogue/pieces.ts` (consigne : étiquette `lourd`)
- Test: `engine/station.test.ts`, `engine/monde.test.ts`, `tools/morceaux.test.ts`

**Interfaces:**
- Produces, dans `engine/station.ts` :
  ```ts
  export interface DefCle {
    /** Étiquettes de pièce du catalogue où la clé peut attendre (spec §5.2). */
    readonly etiquettes: readonly string[];
    /** Dans une grande station, un appui déplaçable devient portable et encombrant (la caisse, spec §6.5). */
    readonly portableEnGrande?: true;
  }
  // DefGrandeMorceau gagne : readonly cles?: Readonly<Record<string, DefCle>>;  (clé : id d'objet du morceau)
  export interface EntreeButin { readonly objet: DefObjet; readonly poids: number; readonly apresCoupeDe?: string }
  export interface TableButin { readonly entrees: readonly EntreeButin[]; readonly vide: number; readonly salles: readonly [number, number] }
  // DefStationGrande gagne : readonly butin?: TableButin;
  ```
- Produces, dans `engine/monde.ts` : `DefObjet.butin?: true` ; `DefPiece.pillee?: true`. La validation accepte un objet déplaçable et portable seulement s'il est `appui` et `encombrant`.

- [ ] **Step 1 : tests qui échouent.**
  - `validerMorceau` refuse une clé déclarée qui n'est pas un objet portable du morceau, ou une étiquette vide.
  - `validerMonde` accepte `{ deplacable: true, appui: true, encombrant: true }` (portable) et refuse toujours `{ deplacable: true }` portable sans appui ni encombrant.
  - `tools/morceaux.test.ts` : les six morceaux déclarent exactement les clés de la spec, avec les étiquettes des Global Constraints ; M-02 déclare `portableEnGrande` sur `o-caisse` et rien d'autre ; la consigne porte `lourd`.
- [ ] **Step 2 :** `npx vitest run engine/station.test.ts engine/monde.test.ts tools/morceaux.test.ts` → FAIL.
- [ ] **Step 3 :** types, validations et déclarations.
- [ ] **Step 4 :** → PASS ; `tools/stations.test.ts` (empreintes figées) inchangé et vert.
- [ ] **Step 5 :** commit `engine, content: déclarations des clés et du butin (#202, #207, spec §6.5, §6.6)`.

### Task 2 : pose des clés

**Files:**
- Create: `engine/cles.ts`, `engine/cles.test.ts`
- Modify: `engine/grande.ts` (`etendreGrande`), `engine/pose.ts` (`sousGraine` : étapes `'cles'` et `'butin'`)
- Test: `tools/grande-assemblage.test.ts`

**Interfaces:**
- Consumes: `DefCle` (tâche 1) ; dans `etendreGrande`, les segments, les pièces annexes posées et leur pièce d'accroche, la pièce intérieure de chaque capsule.
- Produces :
  ```ts
  export interface CleAPoser { readonly objet: string; readonly morceau: string; readonly origine: string; readonly cle: DefCle; readonly encombrante: boolean; readonly large: boolean }
  export interface PieceCandidate { readonly id: string; readonly etiquettes: readonly string[]; readonly segment: number; readonly racine: string }
  /** Pièce de chaque clé (son origine si elle ne bouge pas), sur la sous-graine 'cles'. */
  export function poserCles(cles: readonly CleAPoser[], candidates: readonly PieceCandidate[], zones: (cle: CleAPoser) => ReadonlySet<number>, apportable: (piece: string) => boolean, graine: number): ReadonlyMap<string, string>;
  ```
  `racine` : la pièce du chemin principal d'où pend l'annexe (en remontant les couloirs du catalogue). `zones(cle)` : les segments permis (Global Constraints) ; `etendreGrande` les calcule depuis `avant` du morceau, la zone qui précède, le final et, en ordre libre, la branche et le tronc.
- `etendreGrande` déplace chaque objet posé ailleurs (`piece` changée, `position` retirée) et applique `portableEnGrande` (portable, encombrant) que la clé bouge ou non.

- [ ] **Step 1 : tests qui échouent** (`engine/cles.test.ts`, mondes construits) :
  - tirage uniforme parmi l'origine et les candidates permises ; même graine, même résultat ;
  - jamais une candidate hors des zones permises, ni d'étiquette incompatible ;
  - deux clés de morceaux différents jamais dans la même pièce ; combinaison et découpeuse peuvent partager une pièce ;
  - au plus une clé encombrante déplacée ;
  - une clé large ne va jamais dans une pièce dont `apportable` est faux.
- [ ] **Step 2 : test de propriété qui échoue** (`tools/grande-assemblage.test.ts`) : sur 300 graines de vraies compositions (chaîne et ordre libre), chaque clé est dans sa pièce d'origine ou une pièce du catalogue de sa zone permise ; jamais dans le vestibule ; la caisse de M-02 est portable et encombrante, sans position hors de l'atelier ; part des clés déplacées journalisée.
- [ ] **Step 3 :** `npx vitest run engine/cles.test.ts tools/grande-assemblage.test.ts` → FAIL.
- [ ] **Step 4 :** implémentation. `apportable(piece)` : un parcours depuis la pièce vers l'intérieur d'une capsule par les liaisons non étroites, toutes portes supposées ouvertes (logique de `apportablesVers`, `engine/sortie.ts:36-55`).
- [ ] **Step 5 :** → PASS ; `npx vitest run engine tools/stations.test.ts` vert (petites stations inchangées).
- [ ] **Step 6 :** commit `engine: clés dispersées dans les grandes stations (#202, spec §6.5)`.

### Task 3 : salles de butin et pillage (moteur)

**Files:**
- Create: `engine/butin.ts`, `engine/butin.test.ts`
- Modify: `engine/grande.ts`, `engine/actions.ts` (consultation `regarder` : `pillee`), `engine/vocabulaire.ts` (`regarder_piece` gagne `pillee?: true`)

**Interfaces:**
- Consumes: `TableButin` (tâche 1), la piste (`piste.ts`), les segments.
- Produces :
  ```ts
  export interface SalleButin { readonly piece: string; readonly objet: DefObjet | null }
  /** Salles de butin et leur objet ; null si aucune impasse `butin` ne s'accroche à la piste (la graine n'a pas de plan). */
  export function poserButin(impasses: readonly { readonly id: string; readonly etiquettes: readonly string[]; readonly accroche: string; readonly segment: number }[], piste: ReadonlyMap<string, IntensiteTrace>, repaire: string, table: TableButin, segmentApresCoupe: (morceau: string) => number | undefined, graine: number): readonly SalleButin[] | null;
  ```
  `etendreGrande` ajoute chaque objet tiré (id `o-butin-N`, `butin: true`, dans sa salle) et marque `pillee: true` chaque salle restée vide.

- [ ] **Step 1 : tests qui échouent :**
  - deux ou trois salles (`table.salles`), toutes des impasses d'étiquette `butin` ; au moins une accrochée à une pièce de la piste, la plus proche du repaire d'abord ;
  - aucune impasse `butin` sur la piste → `null` ;
  - objets tirés sans remise selon les poids ; une salle vide est `pillee` ; une salle avec objet ne l'est pas ;
  - `apresCoupeDe: 'm-04'` : la burette de réserve ne va que dans un segment au-delà de la coupe de M-04 quand M-04 est là ;
  - « regarder » une pièce pillée rend `{ type: 'regarder_piece', …, pillee: true }` ; une autre pièce, sans le champ.
- [ ] **Step 2 :** `npx vitest run engine/butin.test.ts engine/actions.test.ts` → FAIL.
- [ ] **Step 3 :** implémentation, sous-graine `'butin'`, après la pose des clés (une clé et un butin ne partagent jamais une salle).
- [ ] **Step 4 :** → PASS ; part des graines sans plan mesurée (300 graines) et notée au registre.
- [ ] **Step 5 :** commit `engine: salles de butin et pièces pillées (#207, spec §6.6)`.

### Task 4 : table de butin, textes du butin et du pillage, caisse des grandes stations

**Files:**
- Create: `content/catalogue/butin.ts`
- Modify: `content/catalogue/textes.ts` (noms et descriptions `cat_trousse`, `cat_burette_reserve`), `content/textes/univers.ts` (`pillages`), `content/textes/types.ts` (`TextesMonde.pillages`), `content/textes/couches.ts` (`PILLAGES`), `content/textes/rendu.ts` (phrase de pillage après la trace), `content/ar-01|ar-02|monde-test/textes.ts`, `content/morceaux/m-02.ts` (`calmes.caisse`), `content/stations/grandes.ts` (table passée dans `grande.butin`)
- Test: `tools/catalogue-pieces.test.ts`, `content/textes/rendu.test.ts`, `tools/check-texts.test.ts`

**Interfaces:**
- Produces : `TABLE_BUTIN: TableButin` (vide 2 ; trousse de soin `soin: 1`, poids 1 ; burette de réserve `glissant: 1`, poids 2, `apresCoupeDe: 'm-04'` ; salles `[2, 3]`) ; `PILLAGES: TextesMonde['pillages']`.

- [ ] **Step 1 : tests qui échouent :**
  - invariant : aucun objet de `TABLE_BUTIN` ne porte une qualité passive de la liste des Global Constraints ;
  - noms : « trousse de soin » et « burette de réserve » distincts de tout nom d'objet des morceaux et du catalogue (NP-04) ;
  - pillage : six phrases au moins, une phrase entière chacune, sans chiffre, sans mot de `MOTS_TRACES` ni de `MOTS_MENACE` ;
  - rendu : une pièce pillée lit sa description, sa trace s'il y en a une, puis une phrase de pillage, la même toute la partie ;
  - M-02 en grande station : la description de la caisse ne dit plus qu'elle ne se porte pas (aucun « porté », « porter ») ; en petite station, inchangée ;
  - en grande station, la description de la pièce d'origine de chaque clé ne nomme pas sa clé (spec §6.5, « une pièce ne nomme jamais l'objet qu'elle contient »).
- [ ] **Step 2 :** `npx vitest run tools/catalogue-pieces.test.ts content/textes/rendu.test.ts tools/check-texts.test.ts` → FAIL.
- [ ] **Step 3 :** table et textes, écrits par l'agent principal.
- [ ] **Step 4 :** → PASS ; `npm run check:texts` vert.
- [ ] **Step 5 :** commit `content: table de butin, pillage et caisse portable des grandes stations (#207, #202)`.

### Task 5 : contrôles structurels des clés et du butin

**Files:**
- Modify: `tools/controles-grande.ts`
- Test: `tools/controles-grande.test.ts`

**Interfaces:**
- Consumes: `DefStation` (déclarations des clés), le monde assemblé (`butin`, `pillee`, `trace`).
- Produces : écarts nouveaux de `controlerGrande` : clé hors de sa zone permise ou d'étiquette incompatible ; clé large non apportable ; plus d'une clé encombrante déplacée ; deux clés de morceaux différents dans une pièce ; butin porteur d'une qualité passive ; aucune salle de butin accrochée à la piste ; nom affiché en double, objets compris.

- [ ] **Step 1 : tests qui échouent** : une station construite passe ; chaque écart ci-dessus, provoqué en modifiant une station construite (comme les tests de boucle de la livraison 1), est signalé.
- [ ] **Step 2 :** `npx vitest run tools/controles-grande.test.ts` → FAIL.
- [ ] **Step 3 :** implémentation.
- [ ] **Step 4 :** → PASS ; la propriété « 1 000 tirages, toute station construite passe les contrôles » reste verte.
- [ ] **Step 5 :** commit `tools: contrôles des clés et du butin (#202, #207, spec §7.3)`.

### Task 6 : preuve sans butin, témoin réparé

**Files:**
- Modify: `tools/verifier-station.ts` (option `depart`, `chercherJusqua`), `tools/verifier-grandes.ts` (`sansButin`, `reparerTemoin`, `prouver`)
- Test: `tools/verifier-grandes.test.ts`, `tools/verifier-station.test.ts`

**Interfaces:**
- Produces :
  ```ts
  // OptionsVerification gagne : readonly depart?: Partie;   (la recherche part de cet état au lieu du réveil)
  export function chercherJusqua(entree: EntreeMonde, depart: Partie, but: (etat: EtatPartie) => boolean, maxEtats: number): readonly EtapeParcours[] | null;
  /** Monde sans son butin, même id : la preuve se fait là (spec §7.4). */
  export function sansButin(entree: EntreeMonde): EntreeMonde;
  /** Témoin du chemin principal rejoué ; chaque étape impossible est précédée des gestes trouvés par chercherJusqua (but : l'étape devient disponible), au plus 20 000 états par réparation. */
  export function reparerTemoin(entree: EntreeMonde, etapes: readonly EtapeParcours[]): readonly EtapeParcours[] | null;
  ```
- `prouver` essaie dans l'ordre : témoin du chemin principal tel quel, témoin réparé, recherche directe ; toujours sur `sansButin(entree)`. `temoinValable` refuse dé et blessure comme aujourd'hui.

- [ ] **Step 1 : tests qui échouent :**
  - `chercherJusqua` depuis un état du milieu de partie trouve une clé posée dans une pièce du catalogue ;
  - une grande station dont la planche (ou la caisse) a quitté son morceau est prouvée par témoin réparé, sans dé ni blessure ;
  - ce témoin se rejoue aussi sur la station complète, butin compris ;
  - un témoin réparé qui exigerait un dé est refusé (station construite avec une seule voie sous les yeux de la créature) ;
  - en ordre libre, deux ordres prouvés.
- [ ] **Step 2 :** `npx vitest run tools/verifier-grandes.test.ts tools/verifier-station.test.ts` → FAIL.
- [ ] **Step 3 :** implémentation.
- [ ] **Step 4 :** → PASS ; temps de preuve mesuré sur 20 stations (médiane et pire) et noté au registre.
- [ ] **Step 5 :** commit `tools: preuve sans butin et témoin réparé (#202, #207, spec §7.4)`.

### Task 7 : « plus aucune sortie » sur les grandes stations

**Files:**
- Modify: `tools/verifier-sortie.ts`, `tools/verify.ts` si le lot change
- Test: `tools/verifier-sortie.test.ts`, `engine/sortie.test.ts`

**Interfaces:**
- Produces : `check:sortie` vérifie, en plus de l'existant, un échantillon fixe de grandes stations publiées : les premières de la liste triée qui couvrent chaque clé déplacée (une station par clé) et chaque forme (chaîne, ordre libre), au plus `GRANDES_SORTIE = 12` ; même méthode qu'aujourd'hui (parties au hasard, comparaison à la recherche complète sans dangers).

- [ ] **Step 1 : tests qui échouent** (`engine/sortie.test.ts`, mondes construits ; `tools/verifier-sortie.test.ts`, contre la recherche complète) :
  - caisse portable posée loin de la grille : pas de signal tant qu'on peut l'apporter ; signal quand la grille reste hors de portée et que la caisse ne peut plus revenir ;
  - clé posée loin de son obstacle (planche dans une pièce du catalogue) : pas de signal au départ ;
  - bloc dans une pièce d'où il rejoint la capsule sans passage étroit : pas de signal.
- [ ] **Step 2 :** `npx vitest run engine/sortie.test.ts tools/verifier-sortie.test.ts` → FAIL (ou PASS si la logique couvre déjà le cas : le noter, le test reste).
- [ ] **Step 3 :** échantillon et branchement dans `check:sortie` ; corrections de `engine/sortie.ts` seulement si un test l'exige.
- [ ] **Step 4 :** → PASS ; durée de `npm run check:sortie` mesurée avant et après, notée au registre ; si elle dépasse de plus de 60 s sur 16 processus, réduire `GRANDES_SORTIE` et le dire au porteur.
- [ ] **Step 5 :** commit `tools: check:sortie couvre les grandes stations (D-275, spec §7.4)`.

### Task 8 : bots et mesures du butin

**Files:**
- Modify: `tools/mesurer-difficulte.ts` (option `--sans-butin`, part des clés déplacées, mise hors jeu précoce), `tools/indicateurs-partie.ts` si besoin
- Test: `tools/mesurer-difficulte.test.ts`

**Interfaces:**
- Produces : `mesurerDifficulte({ grandes: true, sansButin: true })` joue les mêmes stations privées de leur butin ; le rapport ajoute une ligne « clés déplacées » (part des clés hors de leur pièce d'origine) et « mise hors jeu avant le final » (D-241, précisée : créature hors jeu ou enfermée avant que le passager n'entre dans le morceau final).

- [ ] **Step 1 : test qui échoue** : sur 20 tirages, la mesure avec et sans butin joue les mêmes stations ; `sansButin` ne trouve aucun objet `butin` dans les mondes joués ; les nouvelles lignes apparaissent.
- [ ] **Step 2 :** `npx vitest run tools/mesurer-difficulte.test.ts` → FAIL.
- [ ] **Step 3 :** implémentation.
- [ ] **Step 4 :** → PASS.
- [ ] **Step 5 :** commit `tools: mesures avec et sans butin (#207, spec §11)`.

### Task 9 : republication et mesures

**Files:**
- Modify: `content/stations/grandes-publiees.ts`, `tools/grandes-temoins.json` (générés)

- [ ] **Step 1 :** `npm run publier:grandes -- --par=2 --essais=8 --processus=14` en arrière-plan ; au moins 500 stations, environ un tiers en ordre libre.
- [ ] **Step 2 :** `npx vitest run tools/verifier-grandes.test.ts tools/grandes.test.ts tools/controles-grande.test.ts` → PASS ; `npm run check:stations` vert.
- [ ] **Step 3 :** `npm run mesurer:difficulte -- --grandes` puis `-- --grandes --sans-butin`, en arrière-plan. Montrer au porteur : évacuations de B2 avec et sans butin (cible 25 à 35 % avec butin), clés déplacées, salles vides, coups encaissés, mise hors jeu précoce, moment de la défaite. Hors de la cible : proposer un réglage des poids, jamais le fixer seul.
- [ ] **Step 4 :** commit `content, tools: grandes stations republiées avec clés et butin (#202, #207, D-326)`.

### Task 10 : appli, CLI, captures

**Files:**
- Modify: `tools/captures.ts`, `app/jeu.test.ts`

- [ ] **Step 1 : tests qui échouent** (`app/jeu.test.ts`) : une sauvegarde d'une station `g1-…` dont le monde a changé (état sauvegardé qui ne correspond plus au journal rejoué) donne `reprise_impossible`, sans écriture, la sauvegarde intacte.
- [ ] **Step 2 :** → FAIL, puis PASS (le moteur refuse déjà un état incohérent : le test l'épingle).
- [ ] **Step 3 :** captures : la fiche d'une clé dans une pièce du catalogue, la fiche d'une salle pillée (« Regarder »), l'inventaire avec la trousse de soin, à 390 et 320 px ; `npm run build && npm run captures` → « Captures : … réussis », code 0.
- [ ] **Step 4 :** commit `app, tools: captures des clés et du butin (#202, #207)`.

### Task 11 : décisions et documents

**Files:**
- Modify: `docs/03-decisions.md` (limites de D-319 et D-320 : étiquettes, poids, part des clés déplacées, mesures), `docs/13-morceaux-lancement.md` (§7.13 livraison 2 : déclarations des clés, table, mesures), `docs/contrats/C-02-monde-entites.md` (tableau des objets : caisse des grandes stations, trousse de soin, burette de réserve), `docs/00-lire-en-premier.md`

- [ ] **Step 1 :** entrées au format du journal ; mesures de la tâche 9.
- [ ] **Step 2 :** `npm run check:links` → vert.
- [ ] **Step 3 :** commit `docs: clés dispersées et butin, livraison 2 (#202, #207)`.

### Task 12 : vérification complète de la livraison 2

- [ ] **Step 1 :** `npm run verify` → toutes les étapes vertes.
- [ ] **Step 2 :** relecture des mesures et des captures par l'agent principal ; écarts aux critères du §11 listés pour le porteur.
- [ ] **Step 3 :** pousser la branche, mettre à jour la PR #230 (livraison 2, mesures, « validation humaine requise »).
- [ ] **Step 4 :** proposer au porteur l'essai sur téléphone : une clé à chercher hors de son morceau, une salle pillée, une trousse trouvée. Livraison 3 ensuite, avec son propre plan.
