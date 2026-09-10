# VOID WALKER — STATUS

> **Ce fichier est la source unique de vérité du projet.**
> Si un autre document contredit celui-ci, c'est celui-ci qui a raison.
> Toute reprise de développement commence par lire cette page — et rien d'autre.

**Dernière mise à jour :** 2026-09-10
**Dernier commit de code :** lisibilité narrative (lint à 11 règles, tout le texte de scénario relu)
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

### Santé technique (vérifiée le 2026-09-10)

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ 0 erreur, 0 warning |
| `npm run check` (suite complète) | ✅ **2 057 tests / 98 fichiers** (unit + stress + integration, 1 ignoré) |
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

### 4.5 Le jeu est gagnable — et il ne l'était mesurablement pas

Pendant six lots, le filet a mesuré **0 % de victoires** sans que personne demande pourquoi.
Le diagnostic (`npx tsx scripts/diag-victory.ts`) tient en deux lignes : sur 200 parties,
**35 % atteignent le lieu de victoire et 0 % possèdent l'objet requis**. Le badge dort dans un
casier verrouillé, et aucun des deux bots n'avait jamais essayé d'ouvrir quoi que ce soit.

**Le 0 % mesurait l'instrument, pas le jeu.** `tests/integration/winByPlaying.test.ts` le
prouve en tapant les commandes, sans écrire un seul champ d'état — contrairement à
`scenarioCompletion`, qui téléporte le joueur et lui met l'objet dans les mains.

| Mesure (500 parties, graine 42) | Avant | Après |
|---|---|---|
| Victoires | 0 % | **4,0 %** (bot objectif 8,0 %) |
| Bloqué | 268 | **212** |
| Couverture de lieux | 67,0 % | 61,0 % |
| Obstacles résolus | 0,68 | 0,63 |

Les deux cliquets de progression baissent parce que les tours passés à forcer un casier ne
sont pas des tours passés à marcher — et ce sont eux qui achètent les victoires.

**La cible §6 de la phase 6B reste loin** : 40 % pour le bot objectif, 10 % pour l'aléatoire.
C'est le chantier P1 ci-dessous.

---

## 5. Chantiers priorisés

### P1 — Rendre la victoire atteignable · le seul chantier de fond restant

4 % de victoires prouve que le chemin existe ; 40 % est la cible. Les pistes, par ordre de
rendement estimé :

- **Le bot aléatoire ne gagne jamais (0/250).** Vérifier si c'est normal ou si la partie exige
  une séquence qu'un joueur ne devine pas — c'est la même question que « le jeu est-il
  lisible ? ».
- **Deux gestes par porte.** Le badge déverrouille mais n'ouvre pas ; il faut ensuite pousser.
  C'est défendable, mais rien ne le dit au joueur au moment où il utilise le badge.
- **Les objets de progression sont derrière des jets.** Forcer le casier coûte des PV et peut
  échouer plusieurs fois ; c'est la principale source de défaite mesurée.
- **`defeat_entity` et `containment` ne sont utilisés par aucun scénario** — deux des sept
  types de victoire dorment.

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

### Pièges connus

- **Suivre un document de `docs/archive/`.** Il décrit du travail déjà fait.
- **Croire un chiffre de cette page sans le re-mesurer.** Deux des quatre diagnostics de la
  version précédente étaient faux (91 % de cellules, « une seule est un bug de gameplay »).
- **Desserrer un cliquet sans écrire pourquoi.** Les fichiers de stress portent l'historique
  de chaque desserrage ; c'est ce qui permet de distinguer un progrès d'une régression.
- **Comparer deux mesures après un changement qui consomme la RNG.** Le flux se décale et
  les chiffres ne sont plus comparables : il faut isoler l'effet (voir le lot 6).

---

## 6. Organisation de la documentation

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
