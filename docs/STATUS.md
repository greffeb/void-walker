# VOID WALKER — STATUS

> **Ce fichier est la source unique de vérité du projet.**
> Si un autre document contredit celui-ci, c'est celui-ci qui a raison.
> Toute reprise de développement commence par lire cette page — et rien d'autre.

**Dernière mise à jour :** 2026-09-03
**Dernier commit de code :** `6339e84` (2026-03-08)
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

**Le jeu est jouable de bout en bout et techniquement sain.** Les 10 phases du plan initial
sont livrées à l'exception de la Phase 8 (IA) et de la Phase 9 (polish/lancement). Ce qui reste
n'est plus de la construction : c'est de la **qualité de jeu** — variété narrative, poids de
l'échec, ergonomie du texte.

### Santé technique (vérifiée le 2026-09-03)

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ 0 erreur, 0 warning |
| `npm test` (unitaires) | ✅ **1 717 tests / 64 fichiers** |
| `npm run check` (suite complète) | ✅ **1 843 tests / 84 fichiers** (unit + stress + integration) |
| Taille de `src/` | 45 274 lignes |
| CI | `test.yml` (typecheck + lint + test:all) · `deploy-pwa.yml` (GitHub Pages, toutes branches) |

**Rien n'est cassé.** Le projet a simplement été mis en pause ~6 mois. Il n'y a pas de dette
technique bloquante à rembourser avant de reprendre.

---

## 3. Ce qui est livré

| Phase | Statut | Preuve dans le code |
|---|---|---|
| 0 — Bootstrap + i18n | ✅ Livré | `src/i18n/`, 809 clés FR + EN |
| 1 — Propriétés & verbes | ✅ Livré | 85 propriétés, 78 verbes |
| 2 — Parser | ✅ Livré | `parser.ts`, `resolver.ts`, 6 stratégies de matching |
| 3 — Résolution & combat | ✅ Livré | `dice.ts`, `difficulty.ts`, `combat.ts` |
| 4 — Conséquences & état | ✅ Livré | `consequences.ts`, `state.ts`, chaînes de cascade |
| 5 — Narration | ✅ Livré | composition 7 couches, `composer.ts` — contenu porté à 3 variantes/cellule sur les 12 verbes principaux (P2) |
| 6 — Scénarios & victoire | ✅ Livré | 3 skeletons, 15 modules, `victory.ts`, `threat.ts` |
| 6B — Boucle de jeu | ✅ Livré | `checkVictory` / `threatCheck` / `visitedLocations` câblés dans `processTurn` |
| 7 — UI PWA | ✅ Livré | 8 écrans, 14 composants, thème CRT, carte canvas, chorégraphie de dés, PWA |
| 8 — IA (Gemini) | ⬜ Non démarré | `src/ai/` n'existe pas |
| 9 — Polish & lancement | ⬜ Non démarré | dépend de P1→P4 ci-dessous |

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
| Clés i18n | 809 (FR + EN) |

---

## 4. Ce qui ne va pas — diagnostics chiffrés

Ces quatre constats viennent d'une analyse du code, pas d'une impression. Ils justifient
l'ordre des chantiers du §5.

### 4.1 ~~La narration se répète~~ ✅ résolu par P2 — *2026-09-03*

Les templates sont indexés par cellule `(verbe × type de cible × outcome × tension)` —
c'est la clé que `selectActionTemplate()` utilise réellement pour filtrer.

| Mesure | Avant P2 | Après P2 |
|---|---|---|
| Templates d'action | 443 | **1 003** |
| Cellules couvertes | 425 | 525 |
| Moyenne de variantes / cellule | 1,04 | **1,91** |
| Cellules à une seule variante | 411 (97 %) | 231 (44 %) |
| Verbes avec templates dédiés | 24 / 78 | **39 / 78** |
| Moyenne sur les 12 verbes principaux | 1,03 | **3,00** |

`NarrationMemory` (buffer 10, fallback LRU) fonctionnait déjà correctement : le problème
était un pool à un seul élément, pas le code. Les 12 verbes les plus joués — mesurés sur
60 parties automatisées : `MOVE_TO`, `EXAMINE`, `STRIKE`, `TAKE`, `USE`, `HACK`, `OPEN`,
`TALK`, `REPAIR`, `CUT`, `SHOOT`, `BREAK` — ont désormais exactement 3 variantes par
cellule, garanti par un test unitaire (`tests/unit/narration/contentCoverage.test.ts`).

Quinze verbes qui tombaient sur les fallbacks de catégorie ont reçu des templates dédiés
(2 variantes / cellule) : `PUSH`, `PULL`, `ACTIVATE`, `DEACTIVATE`, `SCAN`, `LISTEN`,
`SMELL`, `JUMP`, `DODGE`, `DISTRACT`, `DECEIVE`, `DROP`, `EQUIP`, `DRINK`, `TOUCH`.

**Reste à faire (non bloquant) :** 9 verbes secondaires restent à 1 variante par cellule
(`READ`, `PERSUADE`, `INTIMIDATE`, `THROW`, `CLIMB`, `HIDE`, `BARRICADE`, `FORCE_OPEN`,
`RUN`), ainsi que `EAT`, `WAIT` et `SELF_HARM`. Reproduire les chiffres :
`npx tsx scripts/analyze-templates.ts`.

### 4.2 L'échec n'a pas de poids — le joueur peut spammer

Deux causes mécaniques, indépendantes, qui se cumulent :

1. **`src/engine/consequences.ts:169`** — les dégâts d'échec hors combat sont `nonLethal` :
   ils ne peuvent pas faire descendre les PV sous 1. Donc **à 1 PV, rater est littéralement
   gratuit**.
2. **`src/engine/failsafe.ts` + `BALANCE.FAILSAFE`** — au-delà du seuil (2 tentatives en
   explorer, 4 en survivor), chaque échec supplémentaire **réduit le DC de 3**.
   Spammer n'est donc pas seulement gratuit : **c'est récompensé**.

Le garde-fou anti-softlock était volontaire. L'effet de bord — le jeu « sur des rails » — ne
l'était pas. Le `stalkerClock` est aujourd'hui la seule vraie pression, et il se remet à zéro
à chaque progression de nœud.

### 4.3 L'ordre et le rendu du texte

`LAYER_ORDER` est figé en dur dans `src/narration/types.ts:74` :
`action_result → sensory → consequence → npc_reaction → atmosphere → player_state → threat`.

`docs/specs/NARRATION_STRUCTURE.md` contient déjà une spec de réordonnancement annotée,
**partiellement appliquée** seulement. C'est le point de départ du chantier P4b, pas une page
blanche.

Défauts de rendu observés en jeu (extrait réel de l'issue #85) :

> « Vous tentez d'utiliser la Trousse médicale. **la** Trousse médicale s'active après un
> instant d'hésitation. Le résultat apparaît : fonctionnel. »

Trois défauts en une phrase : redondance action/résultat, minuscule après un point, texte
générique creux.

### 4.4 Les bugs ouverts

**16 issues ouvertes**, toutes au format `[Playtest]` avec reproduction seedée. Elles se
regroupent en ~6-7 causes racines :

| Cause probable | Issues |
|---|---|
| MOVE_TO vers le lieu où on se trouve déjà | #78, #82, #83 |
| SELF_HARM → environment | #64, #65, #69 |
| EXAMINE → item.multitool | #61, #77 |
| SHOOT → environment | #79, #80 |
| ~~USE trousse médicale : succès mais 0 PV gagné~~ ✅ corrigé | ~~#85~~ |
| Parser / UI divers | #60, #72, #75, #81, #84 |

**Une seule est un bug de gameplay** (#85). Les autres sont cosmétiques ou liées au parser.

---

## 5. Chantiers priorisés

L'ordre compte : chaque chantier dépend de l'état laissé par le précédent.

### ✅ P0 — Remettre la carte à jour · *fait le 2026-09-03*

Création de ce fichier, réorganisation des 30 documents, réécriture de `CLAUDE.md`,
nettoyage des déchets à la racine.

### P1 — Le bug #85, et le triage · ~1 j · *#85 corrigé le 2026-09-03*

✅ **#85 corrigé** : le verbe `USE` sur un consommable de soin (`healingValue`) applique
désormais une conséquence `heal` et consomme l'item sur succès. La cause racine était que
seul `EAT` (items `edible`) lisait `healingValue` ; les kits `injectable` employés via `USE`
tombaient dans le bloc générique où seul un `crit_success` soignait (+1). Fix dans
`src/engine/consequences.ts`, gardes de régression dans `tests/unit/engine/useHeal.test.ts`
et `tests/integration/useHeal.integration.test.ts`.

Triage des 15 autres issues → causes racines regroupées au §4.4 (aucun étiquetage GitHub).

**Pourquoi maintenant :** tant que le soin est cassé, l'équilibrage de la survie est
inobservable — donc P3 est infaisable. Ce n'est pas une correction de bug, c'est une
condition préalable à la mesure.

**Ne pas aller plus loin sur les bugs.** Les 15 autres n'expliquent aucune des frustrations
de jeu identifiées au §4.

### ✅ P2 — Variété narrative · *fait le 2026-09-03*

560 nouveaux templates répartis en deux fichiers :

- `src/content/templates/actionVariants.ts` — +2 variantes sur chacune des 183 cellules des
  12 verbes les plus joués, portant chaque pool à 3 ;
- `src/content/templates/actionCoverage.ts` — templates dédiés pour 15 verbes qui tombaient
  jusqu'ici sur les fallbacks de catégorie.

Correction annexe : 5 templates `EAT` utilisaient `{def_target|capitalize}`, un modificateur
que `templateEngine.ts` ne connaît pas — le slot était remplacé par une chaîne vide. Les
textes ont été reformulés (le support du modificateur relève de P4a).

**Mesure de succès atteinte :** 3,00 variantes/cellule sur les 12 verbes principaux
(1,03 avant), verrouillé par un test unitaire. Chiffres complets au §4.1.

**Règle apprise :** ne jamais commencer une phrase par `{def_target}` ou `{def_tool}` —
le slot rend l'article défini en minuscule (« le sas »), ce qui produit une minuscule après
un point. Le corpus antérieur contient encore ce défaut ; c'est le périmètre de P4a.

### P3 — Poids de l'échec et progression · 3-5 j, conception d'abord

Trancher le design avant d'écrire du code :

- l'échec doit **changer le monde** (outil cassé, créature alertée, voie verrouillée) au lieu
  d'infliger -1 PV plafonné ;
- remplacer la réduction de DC par tentative par une **révélation de voie alternative**
  (« la force ne donnera rien — mais le panneau latéral est mal fixé ») ;
- retirer ou atténuer le plancher `nonLethal` à 1 PV.

**Pourquoi après P2 :** P2 ne casse rien, P3 impose un re-playtest complet. Et P3 a besoin
de #85 corrigé (P1) pour être mesurable.

### P4 — UX de la narration · à découper

- **P4a** (~1 j) : articles, majuscules, redondance action/résultat, mots
  mis en avant. Bugs de `templateEngine` et du moteur de grammaire. Deux défauts précis
  identifiés pendant P2 : le modificateur `|capitalize` n'existe pas dans `templateEngine.ts`,
  et `postProcess` contracte « de le » → « du » même dans du texte français légitime
  (« impossible de le déloger » → « impossible du déloger »).
- **P4b** (gros) : ordre des tronçons et propositions d'action. Repartir de
  `docs/specs/NARRATION_STRUCTURE.md`.

**Pourquoi P4b en dernier :** la refonte de la progression (P3) change ce qu'il faut afficher.
Trancher le `LAYER_ORDER` avant P3, c'est du travail à refaire.

### Pièges connus

- **Attaquer les 16 issues en premier.** Réflexe naturel, rendement le plus faible.
- **Toucher au `LAYER_ORDER` avant P3.**
- **Suivre un document de `docs/archive/`.** Il décrit du travail déjà fait.

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

---

## 8. Tenir ce fichier à jour

Mettre à jour à chaque fin de chantier :

- le §3 quand un système est livré ;
- le §4 quand un diagnostic est résolu (**avec les chiffres re-mesurés**, pas une impression) ;
- le §5 en cochant le chantier et en réévaluant l'ordre du reste ;
- la date en tête.

Les chiffres du §4 sont reproductibles. Ils ont été obtenus par comptage direct sur le code —
si tu les mets à jour, recompte, ne devine pas.
