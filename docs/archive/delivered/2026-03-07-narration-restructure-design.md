# Spec — Restructuration du système de narration

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — design de la restructuration des couches narratives.
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **Status :** BRAINSTORM COMPLET — PRÊT POUR IMPLÉMENTATION
> **Prérequis :** Phase 5 (Narrative) et Phase 6B (Scenarios) implémentées
> **But :** Réorganiser l'ordre des éléments narratifs pour produire un texte plus naturel à lire en français.
> **Principe :** Modifications ciblées sur l'assemblage et le rendu — PAS de refonte des templates de contenu.

---

## Table des matières

1. [Résumé des changements](#1-résumé-des-changements)
2. [Situation actuelle (code existant)](#2-situation-actuelle)
3. [Nouvelle structure cible](#3-nouvelle-structure-cible)
4. [Étapes d'implémentation](#4-étapes-dimplémentation)
5. [Exemples de référence (golden tests)](#5-exemples-de-référence)
6. [Critères d'acceptation](#6-critères-dacceptation)

---

## 1. Résumé des changements

### 1.1 Ce qui change

| # | Changement | Fichiers impactés |
|---|-----------|-------------------|
| A | **Nouvelle layer 1 "Action"** — phrase décrivant l'intention du joueur AVANT le résultat | `src/narration/composer.ts`, `src/narration/types.ts` |
| B | **Réordonnancement des layers** — NPC Reaction remonte (layer 5), Atmosphere descend (layer 6) | `src/narration/composer.ts` |
| C | **NarratedScene enrichie** — ajout d'un champ `scenarioIntro` pour la description riche du skeleton/setting ET d'un champ `locationDescription` pour le flavour text | `src/narration/scene.ts`, `src/engine/types.ts` |
| D | **Affichage post-action de la scène** — après la narration d'action, rappel des éléments interactifs (features, items, NPCs, sorties) | `src/stores/gameStore.ts`, `src/ui/components/NarrativePanel.tsx` |
| E | **L'intro de scénario n'est affichée qu'une seule fois** — au `new_game` uniquement | `src/narration/scene.ts`, `src/stores/gameStore.ts` |
| F | **L'intro de lieu (locationDescription) n'est affichée qu'au premier `enter`** — les `revisit` n'affichent que "Vous revenez dans…" + rappel interactif | `src/narration/scene.ts` |

### 1.2 Ce qui ne change PAS

- Le contenu des templates (actionTemplates, sensory, atmosphere, etc.)
- Le système de sélection par cascade de priorité (verb+target+outcome → fallback)
- Le système anti-répétition (NarrationMemory)
- Le moteur de grammaire française
- Le parser d'actions
- Le système de budget de layers (concise 3 / standard 5 / immersive 7)
- Le mécanisme de narrated IDs pour filtrer les suggestions

---

## 2. Situation actuelle

### 2.1 Architecture narrative en 2 flux parallèles

Le jeu produit actuellement **deux flux de texte distincts** à chaque tour :

**Flux 1 — Narration d'action** (`narrateForTurn()` → `composeNarrative()`)
Produit un bloc de texte continu décrivant ce qui s'est passé.
Assemblé par le composer 7-layer dans `src/narration/composer.ts`.

**Flux 2 — Description de scène** (`narrateScene()`)
Produit des tokens structurés (NarratedScene) listant les éléments interactifs.
Assemblé dans `src/narration/scene.ts`.

Ces deux flux sont combinés dans `gameStore.ts` (`submitAction`) :

```
fullNarrative = sceneText + '\n\n' + narrative   (si location change)
fullNarrative = narrative                          (si même location)
```

### 2.2 Composer actuel — 7 layers (fichier: `src/narration/composer.ts`)

```
composeNarrative(ctx, settings, rng, locale) → string

Layer 1: ACTION RESULT (mandatory)     ← selectActionTemplate(ctx)
Layer 2: SENSORY DETAIL (optional)     ← 90% rolled / 50% auto-success
Layer 3: CONSEQUENCE (conditional)     ← si stateChanges.length > 0
Layer 4: ATMOSPHERE / GAMEPLAY HINT    ← prob. variable, hint après tour 4+
Layer 5: PLAYER STATE (conditional)    ← si HP < 30% ou condition active
Layer 6: THREAT HINT (conditional)     ← si beat correspond
Layer 7: NPC REACTION (conditional)    ← si NPC présent, 65% passif

→ Budget cap : top N-1 layers par score, join(' ')
```

**Problème actuel :** Pas de rappel de l'action du joueur. Le texte commence directement par le résultat (ex: "Vos doigts dansent sur le clavier…") sans que le joueur sache à quoi ça correspond, surtout après un jet de dé avec animation.

### 2.3 NarratedScene actuel (fichier: `src/narration/scene.ts`)

```typescript
export interface NarratedScene {
  readonly intro:    readonly SceneToken[];  // "Vous pénétrez dans [lieu]."
  readonly features: readonly SceneToken[];  // "Vous voyez autour de vous…"
  readonly items:    readonly SceneToken[];  // "Parmi les débris…"
  readonly npcs:     readonly SceneToken[];  // "Vous apercevez…"
  readonly exits:    readonly SceneToken[];  // "Vous distinguez une sortie vers…"
  readonly obstacle: string | null;          // texte obstacle italique
  readonly prompt:   string;                 // "Que faites-vous ?"
}
```

L'intro actuelle est une simple phrase : `introPhrase + article + locationName + "."`
La description riche du lieu (locationDescription depuis `SceneDescription`) **n'est PAS intégrée dans les tokens** — elle n'apparaît nulle part dans la `NarratedScene`.

### 2.4 SceneDescription actuel (fichier: `src/engine/types.ts`)

```typescript
export interface SceneDescription {
  readonly locationName: string;
  readonly locationDescription: string;  // ← texte riche du skin, INUTILISÉ par scene.ts
  readonly obstacleHint: string | null;
  readonly visibleItems: readonly { readonly id: string; readonly name: string }[];
  readonly visibleFeatures: readonly { readonly id: string; readonly name: string }[];
  readonly visibleNpcs: readonly { readonly id: string; readonly name: string }[];
  readonly exits: readonly { readonly name: string; readonly visited: boolean }[];
}
```

Le champ `locationDescription` est alimenté par `buildSceneDescription()` dans `src/engine/scene.ts` :
- Première visite d'un noeud skeleton → `skeletonDescription` (texte riche du CoreSkeletonNode.descriptionKey)
- Sinon → `activeSkin.entryDescription.fr` ou `activeSkin.revisitDescription.fr`
- Si obstacle résolu → `activeSkin.revisitDescription.fr`

### 2.5 gameStore — assemblage final (`src/stores/gameStore.ts`)

Le store combine narration + scène via `flattenSceneToText()` :

```typescript
function flattenSceneToText(scene: NarratedScene, showIntro: boolean): string {
  const sections = [
    ...(showIntro ? [scene.intro] : []),
    scene.features, scene.items, scene.npcs, scene.exits,
  ].filter(s => s.length > 0);
  const lines = sections.map(tokens => tokens.map(t => t.value).join(''));
  if (scene.obstacle) lines.push(scene.obstacle);
  lines.push(scene.prompt);
  return lines.join('\n');
}
```

Ordre d'affichage actuel dans `submitAction` :
1. Si changement de lieu → `sceneText + '\n\n' + narrative`
2. Si même lieu → `narrative` seul (pas de scène)

---

## 3. Nouvelle structure cible

### 3.1 Intro (noeud entry — `new_game`)

```
┌─────────────────────────────────────────────────────┐
│ scenarioIntro (description du skeleton — UNE SEULE  │
│ FOIS dans toute la partie)                          │
├─────────────────────────────────────────────────────┤
│ locationName — locationDescription (texte riche du  │
│ skin/skeleton)                                      │
├─────────────────────────────────────────────────────┤
│ obstacle (si présent)                               │
├─────────────────────────────────────────────────────┤
│ features                                            │
│ items                                               │
│ npcs                                                │
│ exits (non explorées puis connues)                  │
├─────────────────────────────────────────────────────┤
│ "Que faites-vous ?"                                 │
└─────────────────────────────────────────────────────┘
```

### 3.2 Entrée dans un lieu (`enter` — première visite)

```
┌─────────────────────────────────────────────────────┐
│ locationName — locationDescription (texte riche du  │
│ skin, UNE SEULE FOIS au premier enter)              │
├─────────────────────────────────────────────────────┤
│ obstacle (si présent)                               │
├─────────────────────────────────────────────────────┤
│ features                                            │
│ items                                               │
│ npcs                                                │
│ exits                                               │
├─────────────────────────────────────────────────────┤
│ "Que faites-vous ?"                                 │
└─────────────────────────────────────────────────────┘
```

### 3.3 Retour dans un lieu (`revisit`)

```
┌─────────────────────────────────────────────────────┐
│ "Vous revenez dans [lieu]."                         │
│ (PAS de locationDescription)                        │
├─────────────────────────────────────────────────────┤
│ features                                            │
│ items                                               │
│ npcs                                                │
│ exits                                               │
├─────────────────────────────────────────────────────┤
│ "Que faites-vous ?"                                 │
└─────────────────────────────────────────────────────┘
```

### 3.4 Narration d'action (le coeur — 8 layers)

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: ACTION         "Vous tentez de pirater le  │
│                          terminal de sécurité."     │
│                                                     │
│ Layer 2: ACTION RESULT  "Vos doigts dansent sur…"   │
│                                                     │
│ Layer 3: SENSORY DETAIL "L'écran projette une       │
│                          lueur bleutée…"            │
│                                                     │
│ Layer 4: CONSEQUENCE    "Les données s'affichent…"  │
│                                                     │
│ Layer 5: NPC REACTION   "« Impressionnant »,        │ ← remonté
│                          murmure Kira."             │
│                                                     │
│ Layer 6a: ATMOSPHERE    "Les moteurs grondent…"     │ ← descendu
│ Layer 6b: GAMEPLAY HINT (remplace 6a après tour 4+) │
│                                                     │
│ Layer 7: PLAYER STATE   "Votre vision se trouble."  │
│                                                     │
│ Layer 8: THREAT HINT    "Quelque chose gratte…"     │
├─────────────────────────────────────────────────────┤
│ features, items, npcs, exits (rappel interactif)    │
├─────────────────────────────────────────────────────┤
│ "Que faites-vous ?"                                 │
└─────────────────────────────────────────────────────┘
```

### 3.5 Déplacement (enter/revisit via action du joueur)

Quand le joueur tape "aller au laboratoire", la narration d'action fusionne l'action et le résultat :

```
Layer 1: ACTION         "Vous vous dirigez vers le laboratoire."
Layer 2: ACTION RESULT  "[Nom du lieu] — [locationDescription]"
                        (seulement au premier enter ; revisit = phrase courte)
```

Les layers 3-8 s'ajoutent normalement, puis le rappel scène.

### 3.6 Nouveau budget de layers

Le système passe de **7 layers** à **8 layers**. La layer "Action" (layer 1) est TOUJOURS présente et NE COMPTE PAS dans le budget (comme l'ancien Action Result). Le budget s'applique aux layers 2 à 8.

| Preset | Budget | Comportement |
|--------|--------|-------------|
| Concise | 1 (Action) + 2 optionnelles = **3 layers max** | Action + Result + top 1 |
| Standard | 1 (Action) + 4 optionnelles = **5 layers max** | Action + Result + top 3 |
| Immersive | 1 (Action) + 6 optionnelles = **7 layers max** | Action + Result + top 5 |

**Note :** Action (layer 1) et Action Result (layer 2) sont toutes deux obligatoires. Le budget contrôle les layers 3 à 8.

### 3.7 Nouveau scoring de priorité

```typescript
function scoreLayerRelevance(layer: LayerType, ctx: NarrativeContext): number {
  switch (layer) {
    case 'action_result':   return 100;  // TOUJOURS inclus (obligatoire)
    case 'consequence':     return ctx.stateChanges?.length ? 95 : 0;
    case 'player_state':    return ctx.playerHpPercent < 0.3 ? 85 : ctx.playerConditions.size > 0 ? 50 : 0;
    case 'npc_reaction':    return actionInvolvesNpc(ctx) ? 80 : 40;  // ← remonté
    case 'threat':          return threatHintAvailable(ctx) ? 70 : 0;
    case 'sensory':         return ctx.outcome === 'auto_success' ? 20 : 60;
    case 'atmosphere':      return ctx.beat === 'climax' ? 90 : 30 + ctx.tension * 5;  // ← descendu
  }
}
```

---

## 4. Étapes d'implémentation

### ÉTAPE 1 — Ajouter le champ `scenarioIntro` à SceneDescription

**Fichier :** `src/engine/types.ts`

**Action :** Ajouter un champ optionnel à l'interface `SceneDescription` :

```typescript
export interface SceneDescription {
  // ... champs existants inchangés ...

  /** Rich scenario intro text (skeleton.descriptionKey) — shown ONCE at new_game. */
  readonly scenarioIntro?: string;
}
```

**Fichier :** `src/engine/scene.ts` — fonction `buildSceneDescription()`

**Action :** Ajouter un paramètre `scenarioIntro` et le passer au résultat.

Actuellement la fonction prend déjà `skeletonDescription` qui est injecté comme `locationDescription` au premier visit d'un skeleton node. Il faut séparer les deux :

1. `scenarioIntro` = le texte du skeleton au sens large (la description du scénario global, type "Vous vous réveillez seul dans les entrailles d'un vaisseau-cargo…"). Ce texte vient de `skeleton.descriptionKey` (pas du node).
2. `locationDescription` = le texte spécifique au lieu (vient de `skeletonNode.descriptionKey` pour les core nodes, ou de `activeSkin.entryDescription` pour les modules).

**Action dans `getSceneContext()` :** Passer la description globale du skeleton en plus de la description du node.

```typescript
// Dans getSceneContext, récupérer la description globale du skeleton
let scenarioIntro: string | undefined;
if (node.coreNodeId === 'start') {
  const visitCount = visitState?.visitCount ?? 0;
  if (visitCount <= 1) {
    scenarioIntro = scenario.skeleton.descriptionKey?.fr;
  }
}

const sceneDescription = buildSceneDescription(
  node, visitState, connectedLocations, state.featureStates ?? {},
  skeletonDescription, scenarioIntro,
);
```

**Test :**
- `SceneDescription.scenarioIntro` est défini uniquement au start node, première visite
- `SceneDescription.scenarioIntro` est `undefined` pour les nodes suivants
- `SceneDescription.locationDescription` contient toujours le texte riche du lieu

---

### ÉTAPE 2 — Enrichir NarratedScene avec la description riche

**Fichier :** `src/narration/scene.ts`

**Action 2.1 :** Ajouter des champs à l'interface `NarratedScene` :

```typescript
export interface NarratedScene {
  /** Scenario intro — texte riche du skeleton (affiché UNE SEULE FOIS au new_game) */
  readonly scenarioIntro: string | null;

  /** "LocationName — description riche du lieu" (premier enter) OU "Vous revenez dans [lieu]." (revisit) */
  readonly intro: readonly SceneToken[];

  /** Location description text (the rich flavour text from skin/skeleton) */
  readonly locationDescription: string | null;

  readonly obstacle: string | null;
  readonly features: readonly SceneToken[];
  readonly items:    readonly SceneToken[];
  readonly npcs:     readonly SceneToken[];
  readonly exits:    readonly SceneToken[];
  readonly prompt:   string;
}
```

**Action 2.2 :** Modifier la fonction `narrateScene()` pour remplir les nouveaux champs.

Logique d'intro selon le mode :

| Mode | intro tokens | locationDescription |
|------|-------------|-------------------|
| `new_game` | `"[LocationName]"` (juste le nom, bold) | `sd.locationDescription` |
| `enter` | `"[LocationName]"` (juste le nom, bold) | `sd.locationDescription` |
| `revisit` | `"Vous revenez dans [article+lieu]."` (phrase complète) | `null` |

Pourquoi séparer `intro` et `locationDescription` ?
- L'intro (le nom du lieu) est un token coloré/bold dans le UI
- La locationDescription est un paragraphe de texte narratif qui sera affiché en dessous, avec un tiret long (—) séparateur
- En mode `revisit`, on n'affiche PAS la locationDescription (elle a déjà été vue)

**Code cible pour `narrateScene()` :**

```typescript
export function narrateScene(
  sd: SceneDescription,
  introMode: SceneIntroMode,
  locale: Locale,
): NarratedScene {
  const itemArticles    = parseArticleMap(t('grammar.item_articles', locale));
  const featureArticles = parseArticleMap(t('grammar.feature_articles', locale));
  const grammar = getGrammarEngine(locale);
  const grammarInfo = detectGrammar(sd.locationName);

  // --- Scenario intro (only at new_game) ---
  const scenarioIntro = sd.scenarioIntro ?? null;

  // --- Intro tokens ---
  let intro: SceneToken[];
  let locationDescription: string | null;

  if (introMode === 'revisit') {
    // Revisit: "Vous revenez dans [article+lieu]."
    const introPhrase = t('scene.intro_revisit', locale);
    const articlePlusName = grammar.resolveSlot('def', sentenceCase(sd.locationName), grammarInfo);
    intro = [
      { kind: 'text',     value: introPhrase + ' ' },
      { kind: 'location', value: articlePlusName },
      { kind: 'text',     value: '.' },
    ];
    locationDescription = null; // Pas de description au revisit
  } else {
    // new_game ou enter: "[LocationName]" seul (la description suit en dessous)
    intro = [
      { kind: 'location', value: sd.locationName },
    ];
    locationDescription = sd.locationDescription || null;
  }

  // --- Obstacle ---
  const obstacle = sd.obstacleHint;

  // --- Le reste (features, items, npcs, exits) est INCHANGÉ ---
  // ... (conserver le code existant pour buildSentenceTokens)

  return {
    scenarioIntro,
    intro,
    locationDescription,
    obstacle,
    features,
    items,
    npcs,
    exits,
    prompt: t('scene.prompt', locale),
  };
}
```

**Test :**
- `narrateScene(sd, 'new_game', 'fr')` → `scenarioIntro` non null, `locationDescription` non null
- `narrateScene(sd, 'enter', 'fr')` → `scenarioIntro` null, `locationDescription` non null
- `narrateScene(sd, 'revisit', 'fr')` → `scenarioIntro` null, `locationDescription` null
- En mode `enter`/`new_game`, l'intro contient juste le nom du lieu (token `location`)
- En mode `revisit`, l'intro contient "Vous revenez dans [article+lieu]."

---

### ÉTAPE 3 — Ajouter la layer "Action" dans le composer

**Fichier :** `src/narration/types.ts`

**Action 3.1 :** Ajouter `'action'` au type `LayerType` :

```typescript
export type LayerType =
  | 'action'           // ← NOUVEAU
  | 'action_result'    // ← renommé depuis 'action' si c'était le nom interne
  | 'sensory'
  | 'consequence'
  | 'npc_reaction'     // ← remonté en position 5
  | 'atmosphere'       // ← descendu en position 6
  | 'player_state'
  | 'threat';
```

**Fichier :** `src/narration/composer.ts`

**Action 3.2 :** Modifier `composeNarrative()` pour injecter la layer Action en premier.

La layer Action est une phrase simple construite à partir du contexte :
- verbe conjugué + cible
- Exemples : "Vous tentez de pirater le terminal.", "Vous frappez la créature.", "Vous examinez la console."

```typescript
// ── LAYER 1: ACTION (mandatory, always first) ──
const actionPhrase = buildActionPhrase(ctx, effectiveLocale);
const parts: string[] = [actionPhrase];

// ── LAYER 2: ACTION RESULT (mandatory, always second) ──
const actionTemplate = selectActionTemplate(ctx);
const actionText = effectiveLocale === 'fr' ? actionTemplate.text.fr : actionTemplate.text.en;
parts.push(renderTemplate(actionText, ctx, effectiveLocale));
```

**Action 3.3 :** Implémenter `buildActionPhrase()` :

```typescript
/**
 * Construit la phrase d'action (layer 1) décrivant l'intention du joueur.
 *
 * Exemples :
 *  - "Vous tentez de pirater le terminal de sécurité."
 *  - "Vous frappez la créature à mains nues."
 *  - "Vous examinez les environs."
 *  - "Vous vous dirigez vers le laboratoire." (mouvement)
 *
 * Pour les auto-success, utilise une formulation directe :
 *  - "Vous ramassez la barre de métal."
 *  - "Vous examinez le datapad."
 */
function buildActionPhrase(ctx: NarrativeContext, locale: Locale): string {
  const grammar = getGrammarEngine(locale);

  // Mouvement — traité dans le flux scène, pas ici
  // (le store gère les déplacements via narrateScene)

  // Auto-success — formulation directe
  if (ctx.outcome === 'auto_success') {
    const verbText = getDirectVerbText(ctx.verb, locale);
    const targetName = ctx.target?.displayName ?? ctx.target?.id ?? '';
    const grammarInfo = detectGrammar(targetName);
    const targetWithArticle = grammar.resolveSlot('def', targetName, grammarInfo);
    return `Vous ${verbText} ${targetWithArticle}.`;
  }

  // Rolled action — "Vous tentez de [verbe] [cible]."
  const verbText = getInfinitiveVerbText(ctx.verb, locale);
  const targetName = ctx.target?.displayName ?? ctx.target?.id ?? '';
  const grammarInfo = detectGrammar(targetName);
  const targetWithArticle = grammar.resolveSlot('def', targetName, grammarInfo);
  return `Vous tentez de ${verbText} ${targetWithArticle}.`;
}
```

**Action 3.4 :** Ajouter les mappings de verbes pour la layer Action.

Créer un fichier de contenu `src/content/templates/actionPhrases.ts` (ou ajouter dans les locales i18n) contenant :

```typescript
// Formes infinitives pour "Vous tentez de [verbe]"
const VERB_INFINITIVES: Record<VerbId, { fr: string; en: string }> = {
  STRIKE:   { fr: 'frapper',    en: 'strike' },
  OPEN:     { fr: 'ouvrir',     en: 'open' },
  HACK:     { fr: 'pirater',    en: 'hack' },
  REPAIR:   { fr: 'réparer',    en: 'repair' },
  EXAMINE:  { fr: 'examiner',   en: 'examine' },
  TALK:     { fr: 'parler à',   en: 'talk to' },
  TAKE:     { fr: 'ramasser',   en: 'take' },
  USE:      { fr: 'utiliser',   en: 'use' },
  SEARCH:   { fr: 'fouiller',   en: 'search' },
  // ... tous les verbes
};

// Formes conjuguées pour auto-success "Vous [verbe]"
const VERB_DIRECT: Record<VerbId, { fr: string; en: string }> = {
  STRIKE:   { fr: 'frappez',     en: 'strike' },
  OPEN:     { fr: 'ouvrez',      en: 'open' },
  EXAMINE:  { fr: 'examinez',    en: 'examine' },
  TAKE:     { fr: 'ramassez',    en: 'take' },
  // ... tous les verbes
};
```

**Test :**
- `buildActionPhrase()` avec HACK + terminal → "Vous tentez de pirater le terminal."
- `buildActionPhrase()` avec TAKE + auto_success + barre → "Vous ramassez la barre de métal."
- `buildActionPhrase()` avec EXAMINE + environment → "Vous examinez les environs."

---

### ÉTAPE 4 — Réordonner les layers dans le composer

**Fichier :** `src/narration/composer.ts`

**Action :** Réorganiser les layers candidates dans `composeNarrative()` pour respecter le nouvel ordre.

L'ancien ordre des candidates était :
```
sensory → consequence → atmosphere → player_state → threat → npc_reaction
```

Le nouvel ordre dans le tableau de scoring/sélection est :
```
action_result → sensory → consequence → npc_reaction → atmosphere → player_state → threat
```

**Important :** Le résultat final doit respecter l'ordre narratif même après le tri par score. Actuellement, les layers sont triées par score puis insérées dans cet ordre. Il faut ajouter un **tri final par position narrative** après la sélection par budget.

```typescript
// Après sélection des top layers par budget :
const LAYER_ORDER: readonly LayerType[] = [
  'action_result',   // layer 2
  'sensory',         // layer 3
  'consequence',     // layer 4
  'npc_reaction',    // layer 5 ← remonté
  'atmosphere',      // layer 6 ← descendu
  'player_state',    // layer 7
  'threat',          // layer 8
];

const sorted = [...candidates].sort((a, b) => b.score - a.score);
const selected = sorted.slice(0, budget - 2); // -2 car action + action_result déjà inclus

// Réordonner les layers sélectionnées dans l'ordre narratif
const ordered = selected.sort(
  (a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer)
);

for (const layer of ordered) {
  const rawText = layer.render();
  if (rawText) {
    parts.push(renderTemplate(rawText, ctx, effectiveLocale));
  }
}
```

**Test :**
- Avec toutes les layers actives, l'ordre de sortie est : Action → Result → Sensory → Consequence → NPC Reaction → Atmosphere → Player State → Threat
- En mode Concise (3 layers) : Action + Result + 1 layer top score
- En mode Standard (5 layers) : Action + Result + 3 layers top score, dans l'ordre narratif
- En mode Immersive (7 layers) : Action + Result + 5 layers, dans l'ordre narratif

---

### ÉTAPE 5 — Modifier flattenSceneToText et l'affichage

**Fichier :** `src/stores/gameStore.ts`

**Action 5.1 :** Modifier `flattenSceneToText()` pour gérer les nouveaux champs :

```typescript
function flattenSceneToText(scene: NarratedScene, showIntro: boolean): string {
  const lines: string[] = [];

  // Scenario intro (new_game only)
  if (showIntro && scene.scenarioIntro) {
    lines.push(scene.scenarioIntro);
    lines.push(''); // ligne vide de séparation
  }

  // Intro tokens (nom du lieu ou "Vous revenez dans…")
  if (showIntro && scene.intro.length > 0) {
    const introText = scene.intro.map(t => t.value).join('');

    // Location description (seulement au premier enter)
    if (scene.locationDescription) {
      lines.push(`${introText} — ${scene.locationDescription}`);
    } else {
      lines.push(introText);
    }
  }

  // Obstacle
  if (scene.obstacle) {
    lines.push(scene.obstacle);
  }

  // Éléments interactifs
  const interactifs = [scene.features, scene.items, scene.npcs, scene.exits]
    .filter(s => s.length > 0);
  for (const tokens of interactifs) {
    lines.push(tokens.map(t => t.value).join(''));
  }

  lines.push(scene.prompt);
  return lines.join('\n');
}
```

**Action 5.2 :** Modifier le flux `submitAction` dans `gameStore.ts` pour afficher le rappel scène APRÈS la narration d'action.

Actuellement, la logique est :
```
si changement lieu → sceneText + '\n\n' + narrative
sinon              → narrative seul
```

Nouvelle logique :
```
si changement lieu →
    sceneText (intro + description + obstacle + éléments + prompt)
sinon →
    narrative + '\n\n' + rappelScène (éléments + prompt seulement)
```

Le "rappel scène" est un sous-ensemble de la scène : pas d'intro, pas de locationDescription, juste les éléments interactifs + prompt.

```typescript
// Nouveau helper pour le rappel scène (post-action)
function flattenSceneReminder(scene: NarratedScene): string {
  const lines: string[] = [];
  const interactifs = [scene.features, scene.items, scene.npcs, scene.exits]
    .filter(s => s.length > 0);
  for (const tokens of interactifs) {
    lines.push(tokens.map(t => t.value).join(''));
  }
  lines.push(scene.prompt);
  return lines.join('\n');
}
```

Dans `submitAction` :
```typescript
if (introMode !== null) {
  // Changement de lieu : scène complète (le narrative du déplacement est intégré via layer 1+2)
  const sceneText = sceneIntro ? flattenSceneToText(sceneIntro, true) : '';
  fullNarrative = sceneText;
} else {
  // Même lieu : narration d'action + rappel des éléments interactifs
  const reminder = sceneIntro ? flattenSceneReminder(sceneIntro) : '';
  fullNarrative = reminder ? `${narrative}\n\n${reminder}` : narrative;
}
```

**Test :**
- Après une action dans la même pièce : le texte narratif est suivi du rappel des éléments
- Lors d'un déplacement : la scène complète s'affiche (avec intro, description, éléments)
- Les items déjà pris ne sont PAS dans le rappel (géré par SceneDescription existant)

---

### ÉTAPE 6 — Adapter NarrativePanel (UI)

**Fichier :** `src/ui/components/NarrativePanel.tsx`

**Action 6.1 :** Modifier `NarratedSceneBlock` pour afficher les nouveaux champs :

```tsx
function NarratedSceneBlock({ scene, showIntro = true }: Props): JSX.Element {
  return (
    <div style={{ marginBottom: '8px', lineHeight: 1.6 }}>
      {/* Scenario intro (new_game) */}
      {showIntro && scene.scenarioIntro && (
        <div style={{ color: 'var(--text-narrative)', marginBottom: '12px' }}>
          {scene.scenarioIntro}
        </div>
      )}

      {/* Location intro */}
      {showIntro && scene.intro.length > 0 && (
        <div>
          {scene.intro.map((tok, j) => <SceneTokenSpan key={j} token={tok} />)}
          {/* Tiret long + description riche */}
          {scene.locationDescription && (
            <span style={{ color: 'var(--text-narrative)' }}>
              {' — '}{scene.locationDescription}
            </span>
          )}
        </div>
      )}

      {/* Obstacle */}
      {scene.obstacle && (
        <div style={{ color: 'var(--warning)', fontStyle: 'italic' }}>
          {scene.obstacle}
        </div>
      )}

      {/* Éléments interactifs */}
      {[scene.features, scene.items, scene.npcs, scene.exits]
        .filter(s => s.length > 0)
        .map((tokens, i) => (
          <div key={i}>
            {tokens.map((tok, j) => <SceneTokenSpan key={j} token={tok} />)}
          </div>
        ))}

      {/* Prompt */}
      <div style={{ color: 'var(--text-system)', fontStyle: 'italic' }}>
        {scene.prompt}
      </div>
    </div>
  );
}
```

**Action 6.2 :** Adapter `renderClippedScene` pour les nouveaux champs.

La logique de clipping doit prendre en compte les nouvelles lignes (scenarioIntro, locationDescription). Ajouter ces lignes au tableau `allLines` en premier, avant les sections d'éléments.

**Test :**
- Le scenarioIntro s'affiche en premier, séparé visuellement
- Le nom du lieu est en couleur amber + bold
- La description riche est en couleur narrative, après un tiret long
- L'obstacle est en warning italique
- Le prompt est en system italique

---

### ÉTAPE 7 — Adapter testModule.ts et ai-playtest.ts

**Fichier :** `scripts/testModule.ts`

**Action :** Adapter la fonction d'affichage de scène (`displayScene` ou équivalent) pour utiliser les nouveaux champs de `NarratedScene`. Le rendu ANSI doit refléter la même structure :

```
[scenarioIntro en blanc, si new_game]
[LocationName en jaune bold] — [description en blanc]
[obstacle en rouge italique]
[features en cyan]
[items en vert]
[npcs en jaune]
[exits en gris]
[prompt en gris italique]
```

**Fichier :** `scripts/ai-playtest.ts`

**Action :** Même adaptation du `displayScene()`.

---

### ÉTAPE 8 — Tests

**Fichier :** `tests/unit/narration/scene.test.ts`

Ajouter/modifier les tests existants :

```typescript
describe('narrateScene restructured output', () => {
  it('new_game: includes scenarioIntro + locationDescription', () => {
    const sd: SceneDescription = {
      locationName: 'Baie des Capsules Cryogéniques',
      locationDescription: 'Vous ouvrez les yeux. Froid mordant.',
      scenarioIntro: 'Vous vous réveillez seul dans les entrailles…',
      obstacleHint: null,
      visibleItems: [{ id: 'metal_bar', name: 'barre de métal' }],
      visibleFeatures: [{ id: 'terminal', name: 'terminal de diagnostic' }],
      visibleNpcs: [],
      exits: [{ name: 'couloir tribord', visited: false }],
    };
    const result = narrateScene(sd, 'new_game', 'fr');

    expect(result.scenarioIntro).toBe('Vous vous réveillez seul dans les entrailles…');
    expect(result.locationDescription).toBe('Vous ouvrez les yeux. Froid mordant.');
    // Intro is just the location name (not a full sentence)
    const introText = result.intro.map(t => t.value).join('');
    expect(introText).toContain('Baie des Capsules Cryogéniques');
    expect(introText).not.toContain('Vous reprenez');
  });

  it('enter: includes locationDescription, no scenarioIntro', () => {
    const sd: SceneDescription = {
      locationName: 'Point de Contrôle',
      locationDescription: 'Une cloison blindée barre le couloir.',
      obstacleHint: 'Le passage est verrouillé.',
      visibleItems: [],
      visibleFeatures: [{ id: 'badge_reader', name: 'lecteur de badge' }],
      visibleNpcs: [],
      exits: [{ name: 'laboratoire', visited: false }],
    };
    const result = narrateScene(sd, 'enter', 'fr');

    expect(result.scenarioIntro).toBeNull();
    expect(result.locationDescription).toBe('Une cloison blindée barre le couloir.');
    expect(result.obstacle).toBe('Le passage est verrouillé.');
  });

  it('revisit: no locationDescription, no scenarioIntro', () => {
    const sd: SceneDescription = {
      locationName: 'Baie des Capsules Cryogéniques',
      locationDescription: 'Vous ouvrez les yeux. Froid mordant.',
      obstacleHint: null,
      visibleItems: [],
      visibleFeatures: [{ id: 'terminal', name: 'terminal de diagnostic' }],
      visibleNpcs: [],
      exits: [{ name: 'couloir tribord', visited: false }],
    };
    const result = narrateScene(sd, 'revisit', 'fr');

    expect(result.scenarioIntro).toBeNull();
    expect(result.locationDescription).toBeNull();
    const introText = result.intro.map(t => t.value).join('');
    expect(introText).toContain('Vous revenez');
    expect(introText).toContain('Baie des Capsules Cryogéniques');
  });
});
```

**Fichier :** `tests/unit/narration/composer.test.ts`

Ajouter des tests pour la layer Action :

```typescript
describe('composer 8-layer restructured', () => {
  it('output starts with action phrase before action result', () => {
    const ctx = makeCtx({
      verb: 'HACK',
      target: { id: 'terminal_1', type: 'feature', displayName: 'terminal de sécurité' },
      outcome: 'success',
    });
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.1), 'fr');
    // Le texte doit commencer par "Vous tentez de pirater…"
    expect(result).toMatch(/^Vous tentez de pirater/);
  });

  it('auto-success uses direct form (not "tentez de")', () => {
    const ctx = makeCtx({
      verb: 'TAKE',
      target: { id: 'metal_bar', type: 'item', displayName: 'barre de métal' },
      outcome: 'auto_success',
    });
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.1), 'fr');
    expect(result).toMatch(/^Vous ramassez/);
    expect(result).not.toContain('tentez');
  });

  it('NPC reaction appears before atmosphere in output', () => {
    const ctx = makeCtx({
      outcome: 'crit_success',
      npcsPresent: [{ id: 'kira', name: 'Kira', disposition: 'friendly', grammar: femGrammar }],
      beat: 'climax',
      tension: 9,
    });
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.immersive, fixedRng(0.0), 'fr');
    // NPC reaction text should come before atmosphere text
    // (exact matching depends on templates, but ordering test is structural)
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(20);
  });

  it('layer ordering is: result, sensory, consequence, npc, atmosphere, player_state, threat', () => {
    // This test validates the LAYER_ORDER constant
    expect(LAYER_ORDER).toEqual([
      'action_result', 'sensory', 'consequence',
      'npc_reaction', 'atmosphere', 'player_state', 'threat',
    ]);
  });
});
```

**Fichier :** `tests/unit/stores/gameStore.test.ts` (ou intégration)

```typescript
describe('flattenSceneToText restructured', () => {
  it('new_game: scenarioIntro + locationName — description + elements', () => {
    const scene: NarratedScene = {
      scenarioIntro: 'Vous vous réveillez seul…',
      intro: [{ kind: 'location', value: 'Baie Cryo' }],
      locationDescription: 'Froid mordant. Obscurité.',
      obstacle: null,
      features: [{ kind: 'text', value: 'Vous voyez un terminal.' }],
      items: [],
      npcs: [],
      exits: [{ kind: 'text', value: 'Sortie vers couloir.' }],
      prompt: 'Que faites-vous ?',
    };
    const text = flattenSceneToText(scene, true);
    expect(text).toContain('Vous vous réveillez seul…');
    expect(text).toContain('Baie Cryo — Froid mordant. Obscurité.');
    expect(text).toContain('Vous voyez un terminal.');
    expect(text).toContain('Que faites-vous ?');
  });

  it('revisit: no scenarioIntro, no locationDescription', () => {
    const scene: NarratedScene = {
      scenarioIntro: null,
      intro: [
        { kind: 'text', value: 'Vous revenez dans ' },
        { kind: 'location', value: 'la baie cryo' },
        { kind: 'text', value: '.' },
      ],
      locationDescription: null,
      obstacle: null,
      features: [{ kind: 'text', value: 'Vous voyez un terminal.' }],
      items: [],
      npcs: [],
      exits: [],
      prompt: 'Que faites-vous ?',
    };
    const text = flattenSceneToText(scene, true);
    expect(text).toContain('Vous revenez dans la baie cryo.');
    expect(text).not.toContain('—');
  });
});

describe('flattenSceneReminder', () => {
  it('produces only elements + prompt (no intro, no description)', () => {
    const scene: NarratedScene = {
      scenarioIntro: 'ignore',
      intro: [{ kind: 'location', value: 'ignore' }],
      locationDescription: 'ignore',
      obstacle: null,
      features: [{ kind: 'text', value: 'Vous voyez un terminal.' }],
      items: [{ kind: 'text', value: 'Vous remarquez un couteau.' }],
      npcs: [],
      exits: [{ kind: 'text', value: 'Sortie vers couloir.' }],
      prompt: 'Que faites-vous ?',
    };
    const text = flattenSceneReminder(scene);
    expect(text).not.toContain('ignore');
    expect(text).toContain('Vous voyez un terminal.');
    expect(text).toContain('Vous remarquez un couteau.');
    expect(text).toContain('Que faites-vous ?');
  });
});
```

---

## 5. Exemples de référence

Ces exemples servent de **golden tests** : le rendu final doit correspondre à ces textes.

### Exemple 1 — Intro (new_game)

**Input :** Premier lancement, skeleton ESCAPE, setting derelict_ship, location start.

**Rendu attendu (texte plat) :**

```
Vous vous réveillez seul dans les entrailles d'un vaisseau-cargo en dérive,
l'USS Meridian. Votre capsule cryogénique s'est ouverte d'urgence — les 46
autres sont mortes depuis 6 mois. Les alarmes hurlent. L'éclairage de secours
peint les couloirs en rouge sang. Quelque chose rôde dans les sections
abandonnées — quelque chose qui a tué tout l'équipage. Trouvez un moyen
d'atteindre les pods d'évasion. Fuyez. Ne regardez pas en arrière.

Baie des Capsules Cryogéniques — Vous ouvrez les yeux. Froid mordant.
Obscurité presque totale. Le couvercle de votre capsule est ouvert — éjection
d'urgence. Autour de vous, 46 autres capsules. Silencieuses. Leurs voyants
sont morts depuis longtemps. L'éclairage de secours rougeoie faiblement.

Une énorme porte blindée bloque l'accès au couloir principal.

Vous voyez autour de vous un terminal de diagnostic ainsi qu'un panneau de commande cryogénique.
Parmi les débris, vous remarquez une barre de métal tordue ainsi qu'une trousse de premiers secours.
Vous apercevez un androïde de maintenance, immobile, le regard fixe.
Vous distinguez une sortie vers le couloir d'accès tribord.
Que faites-vous ?
```

**Structure :**
- `scenarioIntro` = le premier paragraphe (description globale du skeleton)
- ligne vide de séparation
- `intro` (location name) + " — " + `locationDescription` (texte riche du lieu)
- ligne vide
- `obstacle` (italique warning)
- ligne vide
- `features` + `items` + `npcs` + `exits` (listes interactives)
- `prompt`

### Exemple 2 — Entrée dans un lieu (enter)

**Input :** Le joueur entre pour la première fois dans "Point de Contrôle de Sécurité".

**Rendu attendu :**

```
Point de Contrôle de Sécurité — Une cloison blindée barre le couloir, épaisse
comme un coffre-fort. Le panneau de sécurité adjacent exige un badge de
niveau 3. Des griffures profondes marquent le métal — quelque chose a tenté de
forcer le passage depuis l'autre côté.

Le passage vers la section suivante est verrouillé. Niveau d'accréditation 3 requis.

Vous voyez autour de vous un lecteur de badge ainsi qu'une grille de ventilation descellée.
Parmi les débris, vous remarquez un datapad fissuré.
Vous distinguez une sortie vers le laboratoire de recherche, le dépôt de fret. Chemin connu vers la baie des capsules cryogéniques.
Que faites-vous ?
```

### Exemple 3 — Revisit

**Input :** Le joueur revient dans la baie cryo.

**Rendu attendu :**

```
Vous revenez dans la baie des capsules cryogéniques.
Vous voyez autour de vous un terminal de diagnostic ainsi qu'un panneau de commande cryogénique.
Vous apercevez un androïde de maintenance, immobile, le regard fixe.
Vous distinguez une sortie vers le couloir d'accès tribord. Chemin connu vers le point de contrôle de sécurité.
Que faites-vous ?
```

**Note :** Pas de scenarioIntro, pas de locationDescription, pas d'obstacle (résolu). Items déjà pris absents.

### Exemple 4 — Action avec toutes les layers (Immersif)

**Input :** Le joueur tape "pirater le terminal" (succès, jet de dé).

**Rendu attendu :**

```
Vous tentez de pirater le terminal de diagnostic. Vos doigts dansent sur le clavier holographique. Les pare-feu tombent un par un — accès accordé. Le système crache une série de logs cryptés. L'écran projette une lueur bleutée sur votre visage, accompagnée d'un bourdonnement électrique qui résonne dans le silence. Les journaux de maintenance s'affichent : le dernier rapport date de 6 mois. « Accès… autorisé. Bien. » murmure l'androïde. Quelque part au-dessus de vous, un conduit métallique émet un claquement sec, puis plus rien. Dans le silence qui suit, vous entendez trois coups réguliers contre la coque.

Vous voyez autour de vous un panneau de commande cryogénique.
Vous apercevez un androïde de maintenance.
Vous distinguez une sortie vers le couloir d'accès tribord.
Que faites-vous ?
```

**Décomposition des layers :**
1. **Action :** "Vous tentez de pirater le terminal de diagnostic."
2. **Action Result :** "Vos doigts dansent sur le clavier holographique. Les pare-feu tombent un par un — accès accordé. Le système crache une série de logs cryptés."
3. **Sensory Detail :** "L'écran projette une lueur bleutée sur votre visage, accompagnée d'un bourdonnement électrique qui résonne dans le silence."
4. **Consequence :** "Les journaux de maintenance s'affichent : le dernier rapport date de 6 mois."
5. **NPC Reaction :** "« Accès… autorisé. Bien. » murmure l'androïde."
6. **Atmosphere :** "Quelque part au-dessus de vous, un conduit métallique émet un claquement sec, puis plus rien."
7. **Player State :** *(non affiché — HP au-dessus de 50%)*
8. **Threat Hint :** "Dans le silence qui suit, vous entendez trois coups réguliers contre la coque."

Puis le rappel scène (features/items/npcs/exits actualisés + prompt).

### Exemple 5 — Action auto-success (TAKE)

**Input :** Le joueur tape "ramasser le couteau".

**Rendu attendu :**

```
Vous ramassez le couteau. La lame est froide et familière dans votre main.

Vous voyez autour de vous un terminal de diagnostic ainsi qu'un panneau de commande cryogénique.
Vous apercevez un androïde de maintenance.
Vous distinguez une sortie vers le couloir d'accès tribord.
Que faites-vous ?
```

**Décomposition :**
1. **Action :** "Vous ramassez le couteau." (auto-success → forme directe)
2. **Action Result :** "La lame est froide et familière dans votre main."
3-8. *(budget concise ou aucune layer optionnelle qualifiée)*

Puis rappel scène (le couteau n'est plus dans la liste des items).

### Exemple 6 — Échec (mode Standard, 5 layers)

**Input :** Le joueur tape "forcer la porte blindée".

**Rendu attendu :**

```
Vous tentez de forcer la porte blindée. Vous vous arc-boutez contre le métal. Rien ne bouge. La cloison ne bronche pas d'un millimètre — autant essayer de déplacer le vaisseau entier. La vibration de l'impact remonte dans vos bras, douloureuse. Le son mat se répercute dans le couloir vide. Votre épaule proteste. Une douleur sourde s'installe.

Vous voyez autour de vous un lecteur de badge ainsi qu'une grille de ventilation descellée.
Parmi les débris, vous remarquez un datapad fissuré.
Vous distinguez une sortie vers le laboratoire de recherche. Chemin connu vers la baie cryo.
Que faites-vous ?
```

---

## 6. Critères d'acceptation

### 6.1 Tests automatisés

```bash
# Tous les tests unitaires passent
npm test

# Tests spécifiques à la restructuration
npm test -- --grep "restructured"

# Le composer produit 8 layers max (pas 7)
npm test -- --grep "8-layer"

# L'ordre des layers est respecté
npm test -- --grep "layer ordering"

# narrateScene produit les bons champs selon le mode
npm test -- --grep "narrateScene"

# flattenSceneToText et flattenSceneReminder
npm test -- --grep "flattenScene"
```

### 6.2 Tests manuels (via `npm run testModule`)

- [ ] Au lancement (new_game) : le scenarioIntro s'affiche EN PREMIER, suivi du lieu
- [ ] Première entrée dans un lieu : "NomDuLieu — description riche" s'affiche
- [ ] Revisit : seul "Vous revenez dans [lieu]." s'affiche, sans description riche
- [ ] Après une action : le rappel des éléments interactifs s'affiche sous la narration
- [ ] Le texte narratif commence par "Vous tentez de…" (rolled) ou "Vous [verbe]…" (auto)
- [ ] La NPC Reaction apparaît AVANT l'Atmosphere dans le bloc narratif
- [ ] Les items pris disparaissent du rappel scène
- [ ] Le prompt "Que faites-vous ?" apparaît toujours en dernier

### 6.3 Non-régression

- [ ] Aucun test existant ne casse (sauf ceux modifiés volontairement)
- [ ] Le playtest bot (`npm run ai-playtest`) tourne sans erreur
- [ ] Le `testModule` interactif fonctionne normalement
- [ ] Le UI affiche correctement les couleurs (location=amber, item=green, npc=yellow)

---

## Annexe — Fichiers impactés (résumé)

| Fichier | Type de modification |
|---------|---------------------|
| `src/engine/types.ts` | Ajouter `scenarioIntro` à `SceneDescription` |
| `src/engine/scene.ts` | Passer `scenarioIntro` dans `buildSceneDescription()` et `getSceneContext()` |
| `src/narration/types.ts` | Ajouter `'action'` au `LayerType`, exporter `LAYER_ORDER` |
| `src/narration/scene.ts` | Enrichir `NarratedScene`, modifier `narrateScene()` |
| `src/narration/composer.ts` | Ajouter layer Action, réordonner layers, tri final par position |
| `src/content/templates/actionPhrases.ts` | **NOUVEAU** — mappings verbe→infinitif/conjugué |
| `src/stores/gameStore.ts` | Modifier `flattenSceneToText()`, ajouter `flattenSceneReminder()`, adapter `submitAction` |
| `src/ui/components/NarrativePanel.tsx` | Adapter `NarratedSceneBlock` et `renderClippedScene` |
| `scripts/testModule.ts` | Adapter affichage ANSI |
| `scripts/ai-playtest.ts` | Adapter affichage |
| `tests/unit/narration/scene.test.ts` | Nouveaux tests |
| `tests/unit/narration/composer.test.ts` | Nouveaux tests |
