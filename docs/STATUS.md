# VOID WALKER — STATUS

> **Ce fichier est la source unique de vérité du projet.**
> Si un autre document contredit celui-ci, c'est celui-ci qui a raison.
> Toute reprise de développement commence par lire cette page — et rien d'autre.

**Dernière mise à jour :** 2026-09-11
**Dernier commit de code :** correction de 9 défauts du corpus P5, dont un bloquant confirmé
(mécanique d'escorte `rescue` inatteignable) — REG-030 à REG-037
**Derniers bug reports joueurs :** 2026-06-30

---

## 1. Reprise à froid — lire dans cet ordre

1. Cette page, en entier (10 min).
2. `CLAUDE.md` à la racine — commandes, conventions, règles sacrées.
3. Le doc de référence du sous-système sur lequel tu travailles (§7).

**N'ouvre pas `docs/archive/`.** Ces documents décrivent des plans déjà exécutés. Ils sont
conservés pour l'historique, pas pour être suivis. Les suivre te fera refaire du travail
déjà livré — le piège principal de ce dépôt.

---

## 2. Où en est le projet, en une phrase

**Le jeu est jouable de bout en bout, il est gagnable, et un test le prouve en y jouant.**
Les 10 phases du plan initial sont livrées à l'exception de la Phase 8 (IA) et de la Phase 9
(polish/lancement). Un audit phase par phase mené en septembre 2026 a produit 31 décisions
arbitrées et 8 lots de correction, tous livrés (§3bis).

### Santé technique (vérifiée le 2026-09-11)

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ 0 erreur, 0 warning |
| `npm run check` (suite complète) | ✅ **2 062 tests / 100 fichiers** (unit + stress + integration, 1 ignoré) |
| Taille de `src/` | 41 264 lignes (`.ts`) · 44 712 avec les `.tsx` |
| CI | `test.yml` (typecheck + lint + test:all) · `deploy-pwa.yml` (GitHub Pages, toutes branches) |

**Attention à cette ligne :** la mesure précédente (40 527) comptait `src/**/*.ts` seulement ;
celle-ci compte aussi les `.tsx`. À périmètre égal, `src/` est passé de 40 255 à 41 264 lignes
de `.ts` sur ce chantier — +534 pour l'instrument d'audit (`src/content/audit/`,
`featureNames.ts`), +385 pour le moteur et la narration (`sceneDelta.ts`, `sceneLines.ts`), et
le contenu de scénario est **net à l'équilibre** (+258 / −244) : les descriptions ont raccourci
autant qu'elles ont été réécrites. L'UI et le store ont maigri (−43).

La baisse précédente, de 45 274 à 40 527, venait de la suppression de 4 écrans, 5 hooks et
2 panneaux morts (décision R).

---

## 3. Ce qui est livré

| Phase | Statut | Preuve dans le code |
|---|---|---|
| 0 — Bootstrap + i18n | ✅ Livré | `src/i18n/`, FR + EN |
| 1 — Propriétés & verbes | ✅ Livré | 69 propriétés, **85 verbes** (78 + 7 secrets) |
| 2 — Parser | ✅ Livré | `parser.ts`, `resolver.ts` — refondus au lot 5 |
| 3 — Résolution & combat | ✅ Livré | `dice.ts`, `difficulty.ts`, `combat.ts`, `nature.ts` |
| 4 — Conséquences & état | ✅ Livré | `consequences.ts`, `locationState.ts`, `failsafe.ts` |
| 5 — Narration | ✅ Livré | composition 7 couches, `composer.ts` |
| 6 — Scénarios & victoire | ✅ Livré | 3 skeletons, 15 modules, `victory.ts`, `threat.ts` |
| 6B — Boucle de jeu | ✅ Livré | victoire / menace / visites câblées dans `processTurn` |
| 7 — UI PWA | ✅ Livré | écrans, thème CRT, carte, chorégraphie de dés, PWA |
| 8 — IA (Gemini) | ⬜ Non démarré | `src/ai/` n'existe pas |
| 9 — Polish & lancement | ⬜ Non démarré | dépend du §5 |

⚠️ **Ce tableau ne dit que « le système existe ».** L'audit de septembre 2026 a montré que
plusieurs « ✅ Livré » recouvraient du câblage absent : failsafe 1 sur 4, verbes secrets 0 sur 9,
armure jamais appliquée, passif du Medic jamais accordé, sauvegarde automatique jamais
écrite. Ces trous sont bouchés (§3bis), mais la leçon vaut pour la suite : **un livrable de la
forme « X existe » ne remplace pas un livrable de la forme « X consomme Y »**.

---

## 3bis. Audit 2026-09 — 31 décisions, 8 lots

Un audit phase par phase a comparé ce qui était **promis** dans `docs/archive/phases/` à ce que
le code **fait**. Cinq motifs expliquent ~80 % des écarts :

1. **La promesse affichée sans effet** (12 cas) — texte i18n et donnée présents, câblage absent.
2. **Le contournement plutôt que le raccordement** (9) — une branche ajoutée à côté du système.
3. **Le test qui valide le dernier mètre** (5) — l'état gagnant écrit à la main.
4. **La duplication non supprimée après remplacement** (5).
5. **Le type qui ment** (6) — `as StringKey`, `Record<string, …>`, unions élargies.

**Cause racine unique :** chaque phase livrait SON morceau ; la jonction entre données et
mécanique n'a jamais été le livrable de personne.

| Lot | Contenu | État |
|---|---|---|
| 0 | Filet de mesure : détection de blocage réécrite, cliquets, armure récupérée | ✅ |
| 1 | Nettoyage : 11 fichiers morts supprimés, test d'exports orphelins | ✅ |
| 2 | Socle de types : propriété ≠ état, stat par cible, état d'environnement par lieu | ✅ |
| 3 | Pipeline de résolution : un seul système de DC, gradation d'absurdité, LCK sans bonus | ✅ |
| 4 | Le monde réagit : 4 failsafes distincts, conséquences = canal unique, victoire émergente | ✅ |
| 5 | Parser : résolu / ambigu / aucun, politiques en données, négation | ✅ |
| 6 | Personnage : passifs à un point d'application, allocation dans `initGame` | ✅ |
| 7 | Narration & UI : 7 verbes secrets, ordre des couches, réglages, sauvegarde, permadeath | ✅ |
| 8 | Contenu et victoires : répétition narrative, **premières victoires mesurées** | ✅ |
| P1 | Victoire atteignable : l'écran nomme l'acte qui gagne, les portes existent | ✅ |

---

### Systèmes livrés hors plan de phases

- **Interactivité des scénarios** — `ScenarioFeatureDefinition`, `ScenarioInteraction`,
  `featureState.ts`, `interactionResolver.ts`. Les éléments de scénario sont devenus des
  citoyens de première classe du moteur (états, déverrouillage de sorties, révélation d'items).
- **Micro-modules** — 46 pièces adjacentes optionnelles (loot 9 / lore 15 / encounter 10 /
  ambiance 12), placement procédural, perception passive, embuscades de créature.
- **Skeleton themes** — `SkeletonTheme` embarqué dans `CoreSkeleton` (remplace `SettingDefinition`).
- **Chorégraphie de dés** — révélation progressive en 4 actes, haptique, moments clutch.
- **Pression temporelle** — `stalkerClock.ts`, `oxygen.ts`, `threat.ts` (6 beats narratifs).

### Volumes de contenu actuels

| Contenu | Volume |
|---|---|
| Skeletons | 3 (`escape`, `investigate`, `rescue`) |
| Modules de scénario | 15 |
| Micro-modules | 46 |
| Items | 20 |
| NPCs | 5 |
| Templates d'action | 1 003 |
| Réactions PNJ | 44 (au moins 2 par disposition × issue) |
| Textes de second regard | 24 |
| Textes de verbes secrets | 44 |
| Clés i18n | FR + EN, exhaustivité garantie par `StringKey` |
| Règles de lisibilité narrative | 11, toutes à 0 (`scripts/narrative-lint.ts`) |
| Transcripts de relecture | 5 fichiers, `docs/transcripts/` |

---

## 4. Ce qui ne va pas — diagnostics chiffrés

Ces constats viennent de mesures, pas d'impressions. Chaque chiffre est reproductible par le
script cité.

### 4.1 ~~La narration se répète~~ ✅ résolu — *2026-09-09*

Deux passes. La première (P2, 2026-09-03) a écrit 560 templates. La seconde (lot 8) a d'abord
**mesuré ce que le joueur relit vraiment** — `npx tsx scripts/repetition-audit.ts`, 60 parties
graines — au lieu de compter les cellules :

| Mesure | Avant lot 8 | Après |
|---|---|---|
| Répétitions exactes dans une même partie | 194 / 2 170 tours (8,9 %) | **76 / 2 170 (3,5 %)** |
| Tours `EXAMINE` répétés | 50 % | **15 %** |
| Occurrences de la phrase la plus fréquente | 208 | 80 |

La cause n'était pas la pauvreté des templates : c'était le **mécanisme anti-répétition
lui-même**, qui répondait à tout second regard par une phrase fixe écrite en dur dans le pont
de narration. Il répond maintenant par un texte gradué selon l'insistance et accordé au sens
du verbe (`src/content/templates/reexamination.ts`).

**Métrique de cellules, corrigée :** l'ancienne version de cette page annonçait « 91 % de
cellules à variante unique ». La mesure réelle donne **42 %** (200 sur 481) —
`npx tsx scripts/analyze-templates.ts`. Douze verbes secondaires restent à 1 variante
(`EAT`, `READ`, `PERSUADE`, `INTIMIDATE`, `THROW`, `CLIMB`, `HIDE`, `BARRICADE`,
`FORCE_OPEN`, `RUN`, `WAIT`, `SELF_HARM`) ; aucun n'apparaît dans les répétitions mesurées,
ce qui en fait un chantier de confort, pas de qualité.

### 4.1bis ~~Le texte de scénario était illisible~~ ✅ résolu — *2026-09-10*

Le §4.1 mesurait la **répétition** entre tours. Il ne voyait pas la redondance **dans** un
tour, ni le texte que le joueur ne pouvait pas atteindre. Un bug report de cinq minutes de jeu
a révélé neuf défauts de plomberie, tous mesurés, et un corpus de ~660 chaînes françaises
écrites contre la mécanique qui les affiche.

**Ce qui n'allait pas, et pourquoi le §4.1 ne le voyait pas :**

| # | Défaut | Cause |
|---|---|---|
| 1 | Le flavor text entier colorié comme un nom | `visibleFeatures[].name` recevait `pickStateDescription(...)`, pas le nom |
| 2 | Un jet réussi recopiait l'écran | 69 features sans `examineResult` retombaient sur la description déjà affichée |
| 3 | La salle réénumérée à chaque tour | `flattenSceneReminder` appelé inconditionnellement |
| 4 | La salle décrite deux fois | 12 proses de nœud sur 18 commençaient par leur propre titre, 24 inventoriaient leur contenu |
| 5 | L'état affiché ne suivait pas le monde | 24 descriptions d'état inatteignables ; 19 `newState` n'atteignaient pas leur propre description ; 51 `flagSet` sans `newState` |
| 6 | « mm bio cocoon » affiché au joueur | 47 entités sans nom français nulle part |
| 7 | Trois systèmes de noms concurrents | `SCENARIO_NAMES_FR` jamais consulté par le moteur |
| 8 | Un second regard avalait une révélation | la mémoire du narrateur ignorait l'état de la cible |
| 9 | La salle listée deux fois dans le même tour | `buildExamineEnvironmentNarrative`, 4ᵉ énumération concurrente |

**Racine commune :** `descriptions[state]` servait à la fois de nom, d'étiquette d'état et de
texte d'examen. Les rôles sont maintenant séparés — i18n donne le nom, `descriptions[state]`
dit ce qu'un examen révèle dans cet état, la prose du nœud donne l'ambiance.

**L'instrument d'abord.** `npx tsx scripts/narrative-lint.ts` — 11 règles décidables
statiquement, de « la description redit le nom » à « le `newState` n'atteint pas sa propre
description ». `tests/unit/content/narrativeLint.test.ts` les tient **toutes à 0** ; un budget
au-dessus de 0 exige une raison écrite à côté.
`npx tsx scripts/narrative-transcript.ts` écrit tout le texte joueur de chaque scénario dans
`docs/transcripts/` — salle par salle, état par état, via le vrai narrateur. C'est là que la
lisibilité se relit, et c'est ce transcript qui a trouvé la règle R11 que le lint n'avait pas.

| Mesure | Avant | Après |
|---|---|---|
| Répétitions exactes (60 parties, `repetition-audit.ts`) | 76 / 2 147 (3,5 %) | **23 / 2 147 (1,1 %)** |
| Défauts de lisibilité (`narrative-lint.ts`) | 242 | **0** |
| Victoires (200 parties, graine 42, `diag-victory.ts`) | 4 % | 4 % — inchangé |

Le taux de victoire identique est le contrôle : ce chantier a changé ce que le joueur **lit**,
pas ce que le jeu **fait**.

**Corollaires réglés au passage :** `BREAK` était traité comme un synonyme d'`OPEN` et posait
`open`, ce qui rendait mortes les sept descriptions `broken` écrites par les auteurs ;
les singletons de narration fuyaient d'une partie à l'autre dans un même onglet
(`resetNarrationMemory`, appelé par `startNewGame`) ; les `projects` de Vitest n'héritaient pas
du `resolve` racine, donc tout import `@alias` exécuté depuis `src/` cassait sous test ;
`getFeatureDescription` et les trois `reset*` de narration sortent de la liste des orphelins.

**Chantier P3 absorbé** (articles, majuscules, redondance action/résultat) : les slots rendent
désormais un nom d'affichage comme le nom commun qu'il est, `capitaliseSentences` met la
majuscule où une phrase commence, et la règle « ne jamais commencer un template par
`{def_target}` » n'a plus besoin d'être retenue.

### 4.2 ~~L'échec n'a pas de poids~~ ✅ résolu par le lot 4 — *2026-09-09*

Le diagnostic était **incomplet**. La vraie cause n'était pas le réglage du failsafe : c'est
que **3 des 4 types de failsafe n'avaient jamais été construits**. `checkFailsafe` renvoyait
toujours `degraded_bypass`, c'est-à-dire une réduction de DC — donc oui, spammer était
récompensé, parce que c'était la seule réponse que le moteur savait donner.

Les quatre font maintenant quatre choses (`src/engine/failsafe.ts`) :
`degraded_bypass` (DC réduit **et** PV prélevés), `alternate_route` (révèle une voie
inexplorée, sans remise de DC), `narrative_rescue` (ouvre la sortie, pas le butin),
`threat_escalation` (avance l'horloge du rôdeur). Le cauchemar ne désactive plus le filet : il
répond par la menace.

Le plancher `nonLethal` à 1 PV est **conservé** — il protège l'exploration, pas le combat, et
les défaites mesurées sont à 100 % `hp_zero`.

### 4.3 ~~L'ordre du texte~~ ✅ résolu par le lot 7 — *2026-09-09*

`npc_reaction` est passé de la 4e à la 7e position, conformément à la table verrouillée de la
phase 5 et à `NARRATION_STRUCTURE.md` §1.4 : **le code était la dérive, pas les documents**.

Tranché sur des sorties réelles (`npx tsx scripts/layer-order-trial.ts`), pas sur le tableau.
Piège rencontré et à retenir : comparer deux parties rejouées ne compare rien, parce que
l'anti-répétition consomme d'autres variantes. Le script capture les `NarrativeContext` et fait
composer **les mêmes** par les deux ordres, RNG fixe, mémoire remise à zéro.

Restent les défauts de **rendu** (chantier P4a ci-dessous), inchangés :
le modificateur `|capitalize` n'existe pas dans `templateEngine.ts`, et `postProcess`
contracte « de le » → « du » même dans du texte légitime.

### 4.4 Les bugs ouverts

**16 issues ouvertes**, toutes au format `[Playtest]` avec reproduction seedée.

⚠️ L'ancienne version de cette page concluait « une seule est un bug de gameplay ». **C'est
faux** : trois des quatre familles avaient une cause racine dans la résolution de cible, toutes
traitées au lot 5.

| Cause racine | Issues | État |
|---|---|---|
| MOVE_TO vers le lieu où on se trouve déjà | #78, #82, #83 | ✅ pool `here` (décision P2-7) |
| SELF_HARM → environment | #64, #65, #69 | ✅ la cible abstraite n'existe plus (décision N) |
| SHOOT → environment | #79, #80 | ✅ politiques de cible par verbe (décision O) |
| EXAMINE → item.multitool | #61, #77 | à vérifier |
| USE trousse médicale | ~~#85~~ | ✅ corrigé |
| Parser / UI divers | #60, #72, #75, #81, #84 | à vérifier |

**À faire :** rejouer les reproductions seedées des issues restantes avant de les fermer.

### 4.5 ~~Le jeu est gagnable — et il ne l'était mesurablement pas~~ ✅ P1 — *2026-09-09*

Pendant six lots, le filet a mesuré **0 % de victoires** sans que personne demande pourquoi.
Le lot 8 a montré que le 0 % mesurait l'instrument : aucun bot n'ouvrait jamais rien.
Le chantier P1 a montré que **le jeu non plus ne disait jamais qu'on pouvait ouvrir**.

`buildSuggestionCandidates` ne proposait que `examiner` pour une feature : les vrais verbes
venaient uniquement de `node.obstacle.paths`, et `pacing.ts` n'attache d'obstacle qu'aux nœuds
de **module**. Le casier qui contient le badge est sur un nœud **core** — donc en huit parties
complètes, le mot « forcer » n'apparaissait pas une seule fois à l'écran.
`tests/integration/winBySuggestions.test.ts` le prouve : un joueur qui ne tape **que** les
suggestions gagnait 0 fois sur 8 ; il gagne maintenant.

| Mesure (500 parties, graine 42) | Avant lot 8 | Après lot 8 | **Après P1** |
|---|---|---|---|
| Victoires | 0 % | 4,0 % | **9,8 %** |
| Victoires, bot objectif | 0 % | 8,0 % | **19,6 %** |
| Bot objectif bloqué | — | 54/250 | **1/250** |
| Défaites | 232 | 268 | **227** |
| Obstacles résolus | 0,68 | 0,63 | **0,90** |
| Bloqué (total) | 268 | 212 | 224 |
| Couverture de lieux | 67,0 % | 61,0 % | 58,0 % |

Les deux dernières lignes empirent, et c'est **uniquement le bot aléatoire** (223 des 224
parties bloquées). Les portes existent maintenant vraiment : un bot qui n'ouvre rien s'arrête
là où il traversait. Le bot objectif a fait le chemin inverse sur les deux mesures.

**Entonnoir** (`npx tsx scripts/diag-victory.ts`, 200 parties) — chaque partie compte pour un
seul seau, donc un correctif déplacé se lit directement :

| Seau | Avant P1 | Après P1 |
|---|---|---|
| Contenant jamais ouvert | 53,0 % | **27,5 %** |
| Contenant ouvert, objet non pris | 0 % | 21,5 % |
| Objet en main, jamais arrivé | 28,5 % | 40,0 % |
| Victoire | 4,0 % | **11,0 %** |
| Contenant ouvert (bot objectif) | 70,4 % | **99,0 %** |

### 4.6 Ce que P1 a changé

- **Les suggestions lisent les règles de la feature** — ce qui l'ouvre, et quel objet porté
  l'ouvre (`utiliser Couteau sur Casier d'urgence`). Un acte dont le joueur a déjà la clé
  passe devant un jet flatteur pour sa classe (`EQUIPPED_PATH_BONUS`).
- **Les règles posées sur l'objet** (`useOn`) sont proposées aussi : le badge — l'axe entier du
  scénario — n'était jamais nommé, le joueur forçait l'écoutille et mourait.
- **Le combat ne cache plus la sortie.** `fuir` sans destination était rejeté par le parser :
  la seule ligne de fuite proposée ne faisait littéralement rien. Au nœud boss, l'acte qui
  termine la partie était masqué par le combat.
- **Les portes sont des portes** (choix explicite). `LocationEdge.locked` est dérivé à
  l'assemblage des features qui déclarent `revealsExit` ; `isExitUnlocked`, écrit mais jamais
  lu, gouverne maintenant le déplacement, et la carte l'affiche. Une sortie scellée reste
  **nommable** — le moteur répond « encore condamné » (règle sacrée nº1) — mais n'est jamais
  proposée ni franchissable.
- **Un acte dont on a payé le prix réussit.** Décision Z faisait jeter un dé à tout `dc: null`
  sur un verbe qui rencontre de la résistance. Passer le badge sur le lecteur prévu, ou pousser
  une porte dont on vient de rétracter les verrous, n'est pas une tentative aveugle : la
  résistance était le verrou. Z tient toujours pour les règles qui n'exigent rien.
- **`promoteVerb` cassait les clés.** « utiliser le multitool sur le casier » devient `CUT`,
  qui ne correspondait à aucune règle : l'ouverture automatique écrite dans le contenu
  devenait un jet à DC 11. Une règle qui nomme un objet répond à cet objet.
- **Le contenu ne ment plus.** Le badge annonçait « Le passage est libre » alors que la cloison
  restait verrouillée. Et `requiredItem: 'standard_toolkit'` désignait un objet d'INVESTIGATE
  qu'aucune classe ne porte — un des quatre chemins du casier était mort, celui de l'ingénieur.
- **Le harnais lit l'écran** au lieu de rejouer, mal, ce que la scène sait déjà : sa liste de
  « clés portées » écartait le couteau du marine et le multitool de l'ingénieur, précisément
  les deux ouvertures automatiques du casier.

### 4.7 ⚠️ Le filet ne mesure qu'un scénario sur trois

`createSeededRng` est un générateur de Lehmer : le **premier** tirage d'une graine fraîche vaut
≈ `seed/127773`. Pour les graines 42…541, il est toujours < 0,005 — donc
`rng.pick(LAUNCH_SKELETONS)`, premier tirage de `runPlaythrough` **et** de `diag-victory.ts`,
renvoie toujours l'indice 0. **Les 500 parties du filet et les 200 du diagnostic jouent toutes
`escape`.** `investigate` et `rescue` ne sont jamais mesurés.

Non corrigé pendant P1 **délibérément** : décaler le flux RNG rendrait tout avant/après
incomparable (piège explicite du §5). À traiter dans un lot dédié, en repartant d'une ligne de
base neuve.

---

## 5. Chantiers priorisés

### P1 — ~~Rendre la victoire atteignable~~ ✅ livré, cible non atteinte — *2026-09-09*

Trois des quatre pistes sont traitées à la racine (§4.6). La quatrième était hors périmètre.

- ✅ **Le bot aléatoire ne gagne jamais.** Ce n'était pas normal : le jeu ne nommait jamais
  l'acte qui le gagne. Il le nomme maintenant, et `winBySuggestions.test.ts` le prouve en
  ne tapant que ce que l'écran propose. Le bot aléatoire reste à 0 % — il tire ses verbes
  d'une liste figée et ne lit l'écran que 30 % du temps ; la cible de 10 % du §6 de la
  phase 6B mesure ce bot-là, pas le jeu.
- ✅ **Deux gestes par porte.** Le texte ne ment plus, et la suggestion du second geste
  apparaît à l'instant où le drapeau est posé.
- ✅ **Les objets de progression derrière des jets.** Les chemins écrits comme automatiques
  le sont redevenus (badge, couteau, multitool). Le bot objectif ouvre le contenant dans
  99 % des parties, contre 70 %.
- ⬜ **`defeat_entity` et `containment` dorment toujours** — exclu de P1 par décision : ces
  deux types ajoutent des *façons* de gagner, pas un *taux* de victoire.

**La cible §6 de la phase 6B reste loin** : 19,6 % mesurés pour le bot objectif contre 40 %
visés. Le goulot a changé de nature — il n'est plus la lisibilité mais la **survie**.
P1bis (ci-dessous) l'a porté à **32,8 %**.

### P1bis — Survivre jusqu'au pod · ✅ trois câblages dormants — *2026-09-10*

L'entonnoir a d'abord été posé par bot et par nœud, et la réponse était sans ambiguïté :
**pour le bot objectif, 77 pertes sur 77 étaient des morts, zéro blocage.** Pas un problème de
lisibilité ni de navigation — de survie. Trois systèmes livrés ne faisaient rien :

- **L'horloge du rôdeur ne se remettait jamais à zéro.** `resetStalkerClock` était exporté et
  jamais appelé — la liste des exports orphelins le disait depuis le lot 1. Le compteur nommé
  `actionsSinceLastProgression` mesurait donc les tours **écoulés**, pas les tours perdus. Pire :
  passé le seuil `KILL`, `checkStalkerClock` renvoie `kill` **à chaque tour**, soit −5 PV par
  tour à partir du 35ᵉ. Toute partie qui durait était exécutée, quelle que soit sa qualité.
  Le compteur est remis à zéro quand le joueur atteint un lieu où il n'était jamais allé.
- **L'armure ne protégeait personne.** `equippedArmor` est initialisé à `null` et rien ne
  l'écrit jamais. La combinaison EVA — seul objet du jeu à porter `armorValue` — protégeait
  déjà les poumons (le calcul d'O₂ accepte « dans l'inventaire ») mais pas le corps. L'armure
  se lit maintenant comme l'oxygène : sur ce que le joueur porte.
- **Aucun bot ne s'était jamais soigné.** `hasHealingItem` lisait le **sol** alors que l'acte
  qu'il déclenchait puisait dans l'**inventaire** — et le bot ramasse le kit avant d'être
  blessé. Le drapeau était donc faux exactement quand le soin devenait possible. Il nomme
  maintenant l'objet porté, au lieu de taper « kit médical » en dur : un medic ayant bu sa
  trousse gardait un stimulant, et la commande ne désignait plus rien.
- **Un acte qui rend la pièce létale n'est plus suggéré.** Le levier de largage cargo vide la
  soute où se tient le joueur ; il porte un état et un drapeau, donc il passait pour de la
  progression et s'affichait à côté des actes qui gagnent la partie. Le joueur peut toujours le
  tirer — le moteur ne refuse jamais — mais le jeu ne le propose plus.

| Mesure (500 parties, graine 42) | Après lot 8 | Après P1 | **Après P1bis** |
|---|---|---|---|
| Victoires | 4,0 % | 9,8 % | **16,4 %** |
| Victoires, bot objectif | 8,0 % | 19,6 % | **32,8 %** |
| Défaites | 268 | 227 | **175** |
| Obstacles résolus | 0,63 | 0,90 | **0,91** |
| Bloqué | 212 | 224 | 243 |

`maxStuck` monte encore, et toujours pour la même raison : les parties qui étaient exécutées au
tour 35 survivent et se mettent à errer. Les défaites tombent de 227 à 175 — c'est la moitié
honnête de l'échange.

**Non retenu, et pourquoi.** Supprimer l'impôt de 1 PV par échec ordinaire a été essayé et
mesuré : il contredit **REG-017** et un test de régression explicite du lot 4 (« l'échec a du
poids », §4.2). Les deux décisions ne peuvent pas être vraies en même temps ; celle du lot 4
tient jusqu'à arbitrage écrit. Rendre le soin automatique a aussi été essayé : passer par
`isAutoVerb` court-circuite tout le pipeline de conséquences, donc le soin cessait de soigner.

### P1ter — ⚠️ Le chiffre de 34 % mesure la liste de suggestions, pas le jeu

**C'est le constat le plus important de la page.** Les bots du filet lisent tous les
suggestions que la scène leur propose. Le taux de victoire du « bot objectif » mesure donc la
qualité du **classement des trois lignes cliquables**, pas la jouabilité du jeu.

Un troisième profil a été écrit pour le vérifier : `tests/playtest/bots/freePlayBot.ts`. Il
reçoit le vocabulaire de verbes du jeu (via i18n), les noms de ce qui est présent dans la
pièce, et le texte que le jeu vient d'afficher. **Rien ne lui dit quel verbe marche sur quoi.**
Il combine verbe × cible × outil, mémorise ce qu'il a déjà gâché, suit les indices du texte et
privilégie les verbes qui ont payé. Il ne lit jamais une suggestion — un test l'interdit
explicitement.

| Profil, mêmes graines | Victoires |
|---|---|
| `goal_seeker` (lit les suggestions) | **34,0 %** |
| `free_play` (invente ses actions) | **0,0 %** |
| `random` (bruit) | 0,0 % |

`npx vitest run --project stress tests/stress/freePlay.test.ts` (120 parties) :
contenant ouvert **43,3 %**, badge en main **40,8 %**, victoires **0 %**,
**2,11 lieux visités en moyenne** sur six et plus.

Le joueur libre ouvre donc le casier et prend le badge quatre fois sur dix — puis **ne bouge
plus**. Il s'arrête *bloqué*, pas mort.

**Deux défauts trouvés par ce bot en une seule session, qu'aucun bot lisant les suggestions
n'aurait pu montrer :**

- **Observer coûtait des PV.** `examiner Porte blindée` jetait un DC 7 dont l'échec prélevait
  un point de vie. Un joueur curieux était saigné pour avoir regardé.
- **Un `EXAMINE` raté ne renvoyait aucune description.** Le joueur qui regarde la cloison pour
  apprendre qu'un badge l'ouvre n'apprenait rien, au hasard. `isUnresistedVerb` déclarait
  pourtant depuis toujours qu'un verbe d'observation « ne peut pas être refusé » : le pipeline
  générique jetait quand même. Regarder est désormais automatique ; un `EXAMINE` **écrit avec
  son propre DC** (check de perception) reste un jet.

**Ce qui n'est pas tranché.** Le 0 % du joueur libre n'est pas encore un verdict sur le jeu :
ce bot est une v1 et son exploration est faible (2,11 lieux). Savoir si c'est le jeu qui ne
donne aucune raison d'avancer, ou le bot qui est un mauvais touriste, est la prochaine question
— et elle se mesure, elle ne se suppose pas.

### P1quater — Les 6 points restants du bot objectif · combat

34,0 % contre 40 % visés, pour le profil guidé. Les pertes restantes sont des morts au contact
de l'Oracle, à `escalation` et à `boss`. Arbitrage d'équilibrage, pas câblage manquant.

### P2 — Fermer les issues restantes · petit

Rejouer les reproductions seedées de #61, #77, #60, #72, #75, #81, #84 (§4.4). Trois familles
sur quatre sont déjà traitées à la racine ; il reste à le vérifier et à fermer.

### P3 — ~~UX du rendu narratif~~ ✅ résolu — *2026-09-10* · voir §4.1bis

Les majuscules et la redondance action/résultat sont traitées : les slots rendent un nom
d'affichage comme le nom commun qu'il est, et `capitaliseSentences` (dans `composer.ts`) met la
majuscule là où une phrase commence. **La règle « ne jamais commencer une phrase par
`{def_target}` » est périmée** — le slot ne décide plus de la casse de la première lettre.

**Reste ouvert, petit :** `|capitalize` est inconnu de `templateEngine.ts` (aucun template ne
l'utilise aujourd'hui) et `postProcess` contracte « de le » → « du » sans regarder le contexte.
Aucun des deux n'apparaît dans une sortie mesurée.

### P4 — Variété de confort · optionnel

Douze verbes secondaires à 1 variante par cellule (§4.1). Aucun n'apparaît dans les
répétitions mesurées : à faire seulement si une mesure le justifie.

### P5 — ✅ Campagne de playtest IA multi-scénarios · 6 sous-agents, 1 bug racine confirmé — *2026-09-11*

Les 2 057 tests automatisés ne jouent qu'`escape` (§4.7). Six sous-agents ont chacun joué une
partie complète en français, en raisonnant comme un joueur réel (lecture du texte, hypothèse,
action), sur les trois scénarios : `escape`×2, `investigate`×2, `rescue`×2, classes et
difficultés variées, graines 5001-5006. Journaux complets : `scripts/playtest-detailed-12.md`
à `-17.md`.

**Un bug confirmé et corrigé**, trouvé indépendamment par deux sous-agents sur `investigate`
(graines 5003 et 5004) : insérer le noyau de données chiffré dans le terminal de
communications — l'action la plus naturelle, littéralement suggérée par le texte de la
pièce (« un slot pour noyau de données, propre, jamais utilisé ») — décryptait le terminal
mais **n'ouvrait jamais la sortie**. `encrypted_terminal` porte cinq interactions qui
déverrouillent le passage vers `reveal` (USE/HACK/TALK sans objet, USE avec mot de passe,
BREAK) ; la sixième — USE avec l'objet-clé du scénario lui-même — changeait l'état de la
feature et posait son propre drapeau, mais ne portait pas `revealsExit`. La solution la plus
évidente du puzzle était un cul-de-sac. Reproduit à la main (état JSON inspecté directement :
`unlockedExits` restait `{}` après un déchiffrage réussi), corrigé (`revealsExit:
'unlock_to_reveal'` ajouté à l'interaction), reproduit à nouveau avec succès, couvert par
**REG-029** (`tests/unit/engine/regressions.test.ts`). Un audit du reste du contenu
(`escape.ts`, `rescue.ts`, tous les modules) ne montre pas d'autre `useOn` du même genre privé
de `revealsExit` à côté d'un frère qui l'a — mais seul `investigate` avait été rejoué à la main
jusqu'ici.

**~55 autres défauts relevés, non corrigés, à trier :**

| Catégorie | Occurrences (sur 6 parties) | Exemples |
|---|---|---|
| Formulation naturelle → verbe absurde | 8+ | « insérer X dans Y » → DANSE (confirmé 2×) ; « traverser prudemment » / « se faufiler » / « passer par » → CLIMB ; « renforcer » → FORCE_OPEN (sens inversé) |
| Cible non résolue en dialogue | 4+ | TALK/PERSUADE sur un PNJ nommé explicitement résout une cible vide, texte tronqué, PNJ répond mot pour mot identique après échec |
| Accord grammatical | 10+ | « un couchette », « le trappe », « n'a » pour un sujet pluriel, « à le » non contracté, « adaptée » mal accordé |
| Coquille récurrente | 5+ | « s'arrêt'en pleine phrase » (apostrophe orpheline), présente dans au moins 3 scénarios différents — sent une chaîne de template unique |
| Objet non retiré de l'énumération après prise | 3+ | « kit médical basique » reste listé après `TAKE` réussi |
| Question de clarification dupliquée | 4+ | « Que tentez-vous exactement ? » affiché deux fois de suite |
| Mécanique d'escorte (rescue) possiblement absente | 1 rapport | Dr Okonkwo ne suit jamais le joueur malgré la confiance gagnée ; si confirmé, `escort_alive` serait structurellement inatteignable — **à vérifier, pas encore reproduit à la main** |
| Blocages non confirmés | plusieurs | Suspects d'obstacles de module non résolus ou de mauvaise piste suivie par l'agent — aucun `revealsExit` n'existe dans `modules/*.ts` (vérifié), donc mécanisme différent de REG-029, cause non identifiée |

**Piège d'outillage découvert :** deux sous-agents sur six ont rapporté une contamination
croisée de fichier d'état malgré la variable d'environnement `AI_PLAYTEST_SESSION` (ajoutée à
`scripts/ai-playtest.ts` pour cette campagne, isolant chaque session dans son propre fichier).
Cause non déterminée avec certitude — noté pour la prochaine campagne parallèle plutôt que
supposé résolu.

**Prochaine étape suggérée, non commencée :** vérifier à la main la mécanique d'escorte de
`rescue`, isoler la source de la coquille répétée, et trancher entre corriger le vocabulaire
du parser (les verbes absurdes) ou l'étendre par alias ciblés.

### P5bis — ✅ Correction de 9 défauts du corpus P5, un bloquant confirmé — *2026-09-11*

Repris un par un, chaque défaut root-causé par reproduction directe (script jetable ou test),
corrigé au minimum, couvert par une regression `REG-NNN` permanente, `npm run check` repassé
au vert après chaque fix (100 fichiers / 2078 tests à la fin de ce lot).

1. **Coquille « s'arrêt'en pleine phrase »** — `\b` (frontière ASCII) créait une fausse
   coupure après un accent. Lookbehind Unicode `(?<![\p{L}])`. `frenchGrammar.test.ts`.
2. **« insérer X dans Y » → DANSE** — vocabulaire manquant (« insérer » pas alias de USE,
   « dans » pas une préposition cible reconnue), pas un bug du mécanisme de fallback.
   REG-030.
3. **TALK sur PNJ dont l'obstacle est déjà résolu → cible vide** — l'intercept d'obstacle de
   feature se redéclenchait sans vérifier `isObstacleResolved`. REG-031 (et REG-020 ajusté :
   un failsafe `narrative_rescue` s'appuyait sur l'ancien comportement bogué).
4. **Accord « n'a » sur cible plurielle** — deux templates EXAMINE reformulés pour éviter
   l'accord au lieu de le calculer (« Rien... chez X » plutôt que « X n'a... »).
5. **Objet non retiré de l'énumération après prise** (`medkit_basic` vs `medical_kit`) —
   `aliasesOf()` ne comptait que `nameKey`/`id` pour le tie-break `nameExact`, jamais le nom
   d'affichage propre de l'entité ; un item dont l'id ne lit pas comme du français perdait
   contre un item sans rapport dont l'id l'est par coïncidence. REG-032.
6. **EXAMINE sur objet de soin déclenche la narration de USE** — `findItemUseOn` ne vérifie
   que la cible, jamais le verbe déclencheur ; les deux points d'entrée « self-use » dans
   `processTurn.ts` n'étaient pas filtrés par verbe. REG-033.
7. **Question de clarification affichée deux fois** — **pas un bug du moteur/UI** : le CLI de
   playtest (`scripts/ai-playtest.ts`) affichait `trace.reformulationPrompt` PUIS la narration
   (qui est déjà ce même texte pour un tour reformulé). L'UI React réelle n'affiche que la
   narration une fois — corrigé dans le script de playtest par honnêteté, aucun impact
   joueur.
8. **Genre « un couchette », « le trappe »** — deux mécanismes distincts : l'article
   indéfini de énumération de scène vient d'une table JSON par clé i18n (`env.cot` y était
   mis à `'un'`, corrigé en `'une'`) ; l'article défini des templates vient de
   `detectGrammar()` (liste de noms féminins connus), à qui « trappe » manquait. REG-034.
9. **« le Dr Okonkwo » / « à le Dr Okonkwo »** — « Dr » est un titre sans genre propre ;
   `detectGrammar()` lisait le genre sur le premier mot systématiquement. Ajout d'un
   ensemble de titres (« dr », « capt »...) qui reportent la lecture du genre sur le mot
   suivant, et d'Okonkwo comme prénom/nom connu féminin. Corrige aussi la contraction « à »
   comme effet de bord (« à » + « la » ne se contracte jamais ; le vrai bug était le genre).
   REG-034.
10. **🔴 Mécanique d'escorte de `rescue` — confirmée bloquante, corrigée.** Les deux
    interactions de `shuttle_hatch` (victoire primaire ET fin alternative « partir seul »)
    étaient déclenchées par `verb: 'MOVE_TO'`. Or la politique de résolution de cible de
    MOVE_TO ne cherche **que** dans les sorties de la carte et « ici » — jamais dans les
    features d'environnement. Aucune formulation naturelle ne pouvait donc jamais
    résoudre l'écoutille comme cible d'un MOVE_TO : ces trois fins (victoire `escort_alive`,
    abandon, appât) étaient du code mort, structurellement inatteignables. Reproduit avec
    un script direct (`processTurn` avec le flag `escort_active` forcé, verbatim « aller
    vers l'écoutille » → `Où voulez-vous aller ?`). Corrigé en passant les deux interactions
    à `verb: 'USE'` (politique par défaut, qui couvre les features — même motif que
    `escape_pod_hatch` dans `escape.ts`, qui fonctionne déjà). REG-035.
11. **Fuite d'identifiant technique « self » dans la narration** — `buildTargetInfo()`
    cherchait le nom d'une cible réflexive (id `'self'`, `nameKey: 'player.self'`) dans les
    entités de la scène puis, à défaut, testait les préfixes i18n `item.`/`npc.`/`env.` —
    jamais `player.`. Résultat : « vous cacher le self » au lieu de « vous cacher
    vous-même ». Ajout de `player` à la liste de préfixes essayés.
12. **🔴 Deux features au nom quasi identique (« Panneau de symboles A/B ») totalement
    indiscernables — confirmé bloquant, corrigé.** `normalizeInput()` supprimait tout token
    d'un seul caractère sans distinction, y compris la lettre qui distinguait les deux
    panneaux — aucune formulation ne pouvait jamais lever l'ambiguïté. Remplacé par une
    liste précise de résidus d'élision français à ignorer (« l' », « d' », « j' »...) ; les
    autres lettres seules (dont les labels « A »/« B ») survivent désormais. REG-037.

**Restent non traités, connus, non urgents :** verbes absurdes sur formulations créatives
(« traverser prudemment » → CLIMB, « renforcer » → FORCE_OPEN), répliques de PNJ figées après
échec de dialogue répété (anti-répétition qui ne couvre pas ce cas précis), quelques phrases
d'action redondantes (« Vous tentez d'ouvrir X. Vous ouvrez x. »), capitalisation après
virgule en milieu de phrase. Aucun n'a été signalé comme bloquant dans les 6 journaux.

### Pièges connus

- **Suivre un document de `docs/archive/`.** Il décrit du travail déjà fait.
- **Croire un chiffre de cette page sans le re-mesurer.** Deux des quatre diagnostics de la
  version précédente étaient faux (91 % de cellules, « une seule est un bug de gameplay »).
- **Croire que le filet couvre les trois scénarios.** Il n'en joue qu'un (§4.7).
- **Mesurer un taux de victoire agrégé.** Il ne dit pas *où* les parties s'arrêtent, donc il ne
  permet pas d'attribuer un gain. `scripts/diag-victory.ts` range chaque partie dans un seul
  seau et affiche le nœud le plus avancé atteint ; `--trace=<graine>` et `--reaching=<nœud>`
  impriment le détail d'une partie, suggestions comprises.
- **Desserrer un cliquet sans écrire pourquoi.** Les fichiers de stress portent l'historique
  de chaque desserrage ; c'est ce qui permet de distinguer un progrès d'une régression.
- **Comparer deux mesures après un changement qui consomme la RNG.** Le flux se décale et
  les chiffres ne sont plus comparables : il faut isoler l'effet (voir le lot 6).
- **Un mécanisme de fallback interactif (`ScenarioInteraction.trigger.verb`) doit utiliser un
  verbe couvert par la politique de résolution de cible de ce verbe (`TARGET_POLICIES` dans
  `resolver.ts`).** MOVE_TO/RUN ne cherchent QUE dans les sorties et « ici » — jamais dans les
  features d'environnement. Une interaction sur une feature déclenchée par MOVE_TO est du
  code mort silencieux : ni le typecheck ni les tests de contenu statique ne l'attrapent,
  seule une reproduction bout-en-bout via `processTurn` le révèle (voir P5bis §10).

```
docs/
├── STATUS.md          ← CE FICHIER. Source unique de vérité.
├── reference/         Ce que le jeu EST. Docs vivants, font autorité sur le code.
├── process/           Comment on travaille. Méthodologies à suivre.
├── specs/             À implémenter ou partiellement appliqué.
├── roadmap/           Pas commencé.
└── archive/
    ├── phases/        Phases livrées — historique.
    └── delivered/     Specs et plans exécutés — historique.
```

**Règle :** tout document porte un bandeau `> **Statut :**` en tête, juste sous son titre.
Un document sans bandeau est un document dont personne ne connaît l'état — c'est ce qui a
produit le désordre initial.

**Cycle de vie d'un document :**
`specs/` → implémenté → `archive/delivered/` + bandeau mis à jour + ligne ajoutée au §3 ici.

---

## 7. Quel document lire selon le sujet

| Sujet | Document |
|---|---|
| Vision d'ensemble, règles sacrées | `docs/reference/MASTERPLAN.md` |
| Mécaniques de jeu (13 sections) | `docs/reference/GAME_SYSTEMS.md` |
| Parser, verbes, propriétés | `docs/reference/PARSER_DESIGN.md` |
| Scénarios, modules, assemblage | `docs/reference/SCENARIO_DESIGN.md` |
| Ordre des couches narratives | `docs/specs/NARRATION_STRUCTURE.md` |
| Traiter une issue de playtest | `docs/process/ISSUE_RESOLUTION_METHODOLOGY.md` |
| Créer ou tester un module | `docs/process/MODULE_TESTING_METHODOLOGY.md` |
| Lancer un playtest automatisé | `docs/process/AI_PLAYTEST_INSTRUCTIONS.md` |
| Relire le texte d'un scénario | `docs/transcripts/*.md` (régénérer : `npx tsx scripts/narrative-transcript.ts`) |
| Vérifier la lisibilité narrative | `npx tsx scripts/narrative-lint.ts --detail` |

---

## 8. Tenir ce fichier à jour

Mettre à jour à chaque fin de chantier :

- le §3 quand un système est livré ;
- le §4 quand un diagnostic est résolu (**avec les chiffres re-mesurés**, pas une impression) ;
- le §5 en cochant le chantier et en réévaluant l'ordre du reste ;
- la date en tête.

Les chiffres du §4 sont reproductibles. Ils ont été obtenus par comptage direct sur le code —
si tu les mets à jour, recompte, ne devine pas.
