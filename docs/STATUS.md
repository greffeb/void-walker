# VOID WALKER — STATUS

> **Ce fichier est la source unique de vérité du projet.**
> Si un autre document contredit celui-ci, c'est celui-ci qui a raison.
> Toute reprise de développement commence par lire cette page — et rien d'autre.

**Dernière mise à jour :** 2026-09-10
**Dernier commit de code :** chantier P1bis (survie — trois câblages dormants)
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

### Santé technique (vérifiée le 2026-09-09)

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ 0 erreur, 0 warning |
| `npm run check` (suite complète) | ✅ **2 007 tests / 96 fichiers** (unit + stress + integration) |
| Taille de `src/` | 40 527 lignes |
| CI | `test.yml` (typecheck + lint + test:all) · `deploy-pwa.yml` (GitHub Pages, toutes branches) |

`src/` a **maigri** de 45 274 à 40 527 lignes : la mesure précédente comptait 4 écrans,
5 hooks et 2 panneaux morts, supprimés depuis (décision R).

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

### P1ter — Les 7 points restants · combat

32,8 % contre 40 % visés. Il reste, pour le bot objectif sur 98 parties, **27 morts à
`escalation` et 26 à `boss`** — toutes au contact de l'Oracle. Les PV partent maintenant
d'abord au combat (5,5 par partie contre 10 à 14 de réserve). C'est un arbitrage d'équilibrage,
pas un câblage manquant : à trancher avant de coder.

### P2 — Fermer les issues restantes · petit

Rejouer les reproductions seedées de #61, #77, #60, #72, #75, #81, #84 (§4.4). Trois familles
sur quatre sont déjà traitées à la racine ; il reste à le vérifier et à fermer.

### P3 — UX du rendu narratif (ex-P4a) · ~1 j

Articles, majuscules, redondance action/résultat. Deux défauts précis : `|capitalize` inconnu
de `templateEngine.ts`, et `postProcess` qui contracte « de le » → « du » à tort.

**Règle apprise :** ne jamais commencer une phrase par `{def_target}` ou `{def_tool}` — le slot
rend l'article en minuscule, ce qui produit une minuscule après un point.

### P4 — Variété de confort · optionnel

Douze verbes secondaires à 1 variante par cellule (§4.1). Aucun n'apparaît dans les
répétitions mesurées : à faire seulement si une mesure le justifie.

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
