# Narration Restructure Implementation Plan

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — plan d'exécution de la restructuration narrative.
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the narrative layer ordering and scene display to produce more natural French text — adding an "Action" layer before the result, reordering NPC/Atmosphere layers, and showing rich location descriptions + interactive element reminders after each action.

**Architecture:** 8 tasks covering types → engine → narration → store → UI. Each task is testable in isolation. Design doc: `docs/archive/delivered/2026-03-07-narration-restructure-design.md`. Tests are written before implementation (TDD).

**Tech Stack:** TypeScript 5 strict, Vitest, React 18, Zustand. Commands: `npm test`, `npm run lint`, `npm run typecheck`.

---

## Overview of changes

| # | File | Change |
|---|------|--------|
| 1 | `src/engine/types.ts` | Add `scenarioIntro?: string` to `SceneDescription` |
| 2 | `src/engine/scene.ts` | Pass `scenarioIntro` through `buildSceneDescription()` + `getSceneContext()` |
| 3 | `src/narration/scene.ts` | Enrich `NarratedScene` interface + update `narrateScene()` logic |
| 4 | `src/narration/types.ts` | Add `'action'` to `LayerType`, export `LAYER_ORDER` |
| 5 | `src/content/templates/actionPhrases.ts` | New file — verb infinitive + direct form mappings |
| 6 | `src/narration/composer.ts` | Add `buildActionPhrase()`, restructure `composeNarrative()` |
| 7 | `src/stores/gameStore.ts` | Update `flattenSceneToText()`, add `flattenSceneReminder()`, update `submitAction` |
| 8 | `src/ui/components/NarrativePanel.tsx` | Update `NarratedSceneBlock` + `renderClippedScene` |
| 9 | `scripts/testModule.ts` + `scripts/ai-playtest.ts` | Update `displayScene()` for new NarratedScene shape |

**Run after every task:**
```bash
npm test
npm run typecheck
```

**Run before final commit:**
```bash
npm run check
```

---

## Task 1: Add `scenarioIntro` to `SceneDescription`

**Files:**
- Modify: `src/engine/types.ts` (around line 659)

### Step 1: Write the failing test

In `tests/unit/engine/scene.test.ts`, find or add a test that verifies `buildSceneDescription` output shape. Add:

```typescript
it('SceneDescription has scenarioIntro field (optional)', () => {
  // Just a type-level check — if this compiles, it passes
  const sd: SceneDescription = {
    locationName: 'Test',
    locationDescription: 'A room.',
    scenarioIntro: 'The world ends.',  // ← this field must exist
    obstacleHint: null,
    visibleItems: [],
    visibleFeatures: [],
    visibleNpcs: [],
    exits: [],
  };
  expect(sd.scenarioIntro).toBe('The world ends.');
});

it('SceneDescription scenarioIntro is optional (undefined by default)', () => {
  const sd: SceneDescription = {
    locationName: 'Test',
    locationDescription: 'A room.',
    obstacleHint: null,
    visibleItems: [],
    visibleFeatures: [],
    visibleNpcs: [],
    exits: [],
  };
  expect(sd.scenarioIntro).toBeUndefined();
});
```

### Step 2: Run test to verify it fails

```bash
npx vitest run tests/unit/engine/scene.test.ts --reporter=verbose
```

Expected: TypeScript compile error — `scenarioIntro` does not exist on `SceneDescription`.

### Step 3: Add `scenarioIntro` to `SceneDescription`

In `src/engine/types.ts`, in the `SceneDescription` interface (around line 659), add one line after `locationDescription`:

```typescript
export interface SceneDescription {
  readonly locationName: string;
  readonly locationDescription: string;
  /** Rich scenario intro text (skeleton description) — shown ONCE at new_game only. */
  readonly scenarioIntro?: string;
  readonly obstacleHint: string | null;
  readonly visibleItems: readonly { readonly id: string; readonly name: string }[];
  readonly visibleFeatures: readonly { readonly id: string; readonly name: string }[];
  readonly visibleNpcs: readonly { readonly id: string; readonly name: string }[];
  readonly exits: readonly { readonly name: string; readonly visited: boolean }[];
}
```

### Step 4: Run tests to verify they pass

```bash
npx vitest run tests/unit/engine/scene.test.ts --reporter=verbose
npm run typecheck
```

Expected: PASS. No type errors.

### Step 5: Commit

```bash
git add src/engine/types.ts tests/unit/engine/scene.test.ts
git commit -m "feat(narration): add scenarioIntro field to SceneDescription"
```

---

## Task 2: Pass `scenarioIntro` through `buildSceneDescription` and `getSceneContext`

**Files:**
- Modify: `src/engine/scene.ts` (lines ~180-204 for `getSceneContext`, ~326-380 for `buildSceneDescription`)

### Step 1: Read the current code

Read `src/engine/scene.ts` lines 160-205 and 320-380 to understand:
- `buildSceneDescription(node, visitState, connectedLocations, featureStates, skeletonDescription)` — current signature
- `getSceneContext()` — currently passes `skeletonDescription` as the node's own description, not the skeleton-level intro

The spec clarifies:
- `scenarioIntro` = skeleton's top-level description (shown once at start node, first visit)
- `locationDescription` = the node's own skin description (already handled)

### Step 2: Write failing tests

In `tests/unit/engine/scene.test.ts`, add:

```typescript
describe('getSceneContext scenarioIntro', () => {
  it('start node first visit: scenarioIntro comes from skeleton.descriptionKey', () => {
    // Build a minimal GameState with a scenario that has a skeleton description
    // and current location = start node, visitCount = 0
    // (Adapt to your test fixture helpers)
    const state = buildTestState({ currentLocationId: 'loc_start', visitedLocations: {} });
    const ctx = getSceneContext(state);
    expect(ctx.sceneDescription?.scenarioIntro).toBeDefined();
    expect(typeof ctx.sceneDescription?.scenarioIntro).toBe('string');
  });

  it('non-start node: scenarioIntro is undefined', () => {
    const state = buildTestState({ currentLocationId: 'loc_unlock', visitedLocations: { loc_start: 1 } });
    const ctx = getSceneContext(state);
    expect(ctx.sceneDescription?.scenarioIntro).toBeUndefined();
  });

  it('start node second visit: scenarioIntro is undefined', () => {
    const state = buildTestState({ currentLocationId: 'loc_start', visitedLocations: { loc_start: 1 } });
    const ctx = getSceneContext(state);
    expect(ctx.sceneDescription?.scenarioIntro).toBeUndefined();
  });
});
```

Note: If `buildTestState` doesn't exist, adapt to whatever test fixtures are used in existing `scene.test.ts` tests. Look at `tests/unit/engine/scene.test.ts` for the pattern.

### Step 3: Run to verify failure

```bash
npx vitest run tests/unit/engine/scene.test.ts --reporter=verbose
```

### Step 4: Implement in `src/engine/scene.ts`

**4a. Update `buildSceneDescription` signature** (around line 326):

```typescript
function buildSceneDescription(
  node: LocationNode,
  visitState: LocationVisitState | undefined,
  connectedLocations: readonly { id: string; aliases: readonly string[]; displayName?: string; visited?: boolean }[],
  featureStates: Readonly<Record<string, string>>,
  skeletonDescription: string | undefined,
  scenarioIntro: string | undefined,   // ← ADD this parameter
): SceneDescription {
  // ... existing body unchanged, just add scenarioIntro to the return object:
  return {
    locationName,
    locationDescription,
    scenarioIntro,           // ← ADD this line
    obstacleHint,
    visibleItems,
    visibleFeatures,
    visibleNpcs,
    exits,
  };
}
```

**4b. Update the call in `getSceneContext`** (around line 188):

First, compute `scenarioIntro` before calling `buildSceneDescription`:

```typescript
// --- Scenario intro (only at start node, first visit) ---
let scenarioIntro: string | undefined;
if (scenario && node.coreNodeId === 'start') {
  const visitCount = visitState?.visitCount ?? 0;
  if (visitCount <= 1) {
    scenarioIntro = scenario.skeleton.descriptionKey?.fr;
  }
}

const sceneDescription = buildSceneDescription(
  node, visitState, connectedLocations, state.featureStates ?? {},
  skeletonDescription,
  scenarioIntro,          // ← ADD this argument
);
```

Check that `skeletonDescription` is now only the *node* description (not the skeleton-level text). Look at the existing code around line 180-188 to see how `skeletonDescription` is currently set — it already comes from `skeletonNode?.descriptionKey.fr` which is the node description, not the skeleton global description. The skeleton global description is at `scenario.skeleton.descriptionKey?.fr` — that's the new `scenarioIntro`.

### Step 5: Run tests

```bash
npx vitest run tests/unit/engine/scene.test.ts --reporter=verbose
npm run typecheck
```

### Step 6: Commit

```bash
git add src/engine/scene.ts tests/unit/engine/scene.test.ts
git commit -m "feat(narration): pass scenarioIntro through getSceneContext"
```

---

## Task 3: Enrich `NarratedScene` interface and update `narrateScene()`

**Files:**
- Modify: `src/narration/scene.ts`
- Modify: `tests/unit/narration/` (find existing scene test or create one)

### Step 1: Write failing tests

In `tests/unit/narration/scene.test.ts` (create if not exists), add:

```typescript
import { narrateScene, type NarratedScene } from '../../../src/narration/scene';
import type { SceneDescription } from '../../../src/engine/types';

const baseSceneDesc: SceneDescription = {
  locationName: 'Baie des Capsules Cryogéniques',
  locationDescription: 'Vous ouvrez les yeux. Froid mordant.',
  obstacleHint: null,
  visibleItems: [],
  visibleFeatures: [],
  visibleNpcs: [],
  exits: [],
};

describe('narrateScene restructured output', () => {
  it('new_game: scenarioIntro is populated when SceneDescription has it', () => {
    const sd = { ...baseSceneDesc, scenarioIntro: 'Vous vous réveillez seul dans les entrailles…' };
    const result = narrateScene(sd, 'new_game', 'fr');
    expect(result.scenarioIntro).toBe('Vous vous réveillez seul dans les entrailles…');
    expect(result.locationDescription).toBe('Vous ouvrez les yeux. Froid mordant.');
    // Intro should be just the location name (not a full phrase)
    const introText = result.intro.map(t => t.value).join('');
    expect(introText).toContain('Baie des Capsules Cryogéniques');
    expect(introText).not.toMatch(/Vous.*dans/);
  });

  it('enter: scenarioIntro is null, locationDescription is populated', () => {
    const result = narrateScene(baseSceneDesc, 'enter', 'fr');
    expect(result.scenarioIntro).toBeNull();
    expect(result.locationDescription).toBe('Vous ouvrez les yeux. Froid mordant.');
  });

  it('revisit: scenarioIntro is null, locationDescription is null', () => {
    const result = narrateScene(baseSceneDesc, 'revisit', 'fr');
    expect(result.scenarioIntro).toBeNull();
    expect(result.locationDescription).toBeNull();
    const introText = result.intro.map(t => t.value).join('');
    expect(introText).toMatch(/[Vv]ous revenez/);
    expect(introText).toContain('baie');
  });

  it('enter with no locationDescription: locationDescription is null', () => {
    const sd = { ...baseSceneDesc, locationDescription: '' };
    const result = narrateScene(sd, 'enter', 'fr');
    expect(result.locationDescription).toBeNull();
  });
});
```

### Step 2: Run to verify failure

```bash
npx vitest run tests/unit/narration/scene.test.ts --reporter=verbose
```

Expected: FAIL — `scenarioIntro` and `locationDescription` do not exist on `NarratedScene`.

### Step 3: Update `NarratedScene` interface in `src/narration/scene.ts`

Replace the current `NarratedScene` interface (lines 30-45):

```typescript
export interface NarratedScene {
  /** Scenario intro — skeleton-level description shown ONCE at new_game. null in all other modes. */
  readonly scenarioIntro: string | null;
  /** Location intro tokens: just the name for enter/new_game, "Vous revenez dans [lieu]." for revisit. */
  readonly intro:    readonly SceneToken[];
  /** Rich flavour text for the location. null on revisit (already seen). */
  readonly locationDescription: string | null;
  /** "Vous voyez autour de vous [feature], [feature] ainsi qu'[feature]." */
  readonly features: readonly SceneToken[];
  /** "Parmi les débris, vous remarquez [item] ainsi qu'[item]." */
  readonly items:    readonly SceneToken[];
  /** "Vous apercevez [npc]." */
  readonly npcs:     readonly SceneToken[];
  /** "Vous distinguez une sortie vers [exit]." + optional backtrack exits */
  readonly exits:    readonly SceneToken[];
  /** Obstacle hint text, or null if none / already resolved */
  readonly obstacle: string | null;
  /** "Que faites-vous ?" */
  readonly prompt:   string;
}
```

### Step 4: Remove the `INTRO_KEY` map and update `narrateScene()`

The current `narrateScene()` uses a single intro phrase from i18n for all modes. The new logic is:
- `new_game` / `enter` → intro tokens are just the location name (a `location` token)
- `revisit` → "Vous revenez dans [article+lieu]."

Replace the `INTRO_KEY` constant and the intro-building block inside `narrateScene()`:

```typescript
// Remove INTRO_KEY constant entirely

export function narrateScene(
  sd: SceneDescription,
  introMode: SceneIntroMode,
  locale: Locale,
): NarratedScene {
  const itemArticles    = parseArticleMap(t('grammar.item_articles', locale));
  const featureArticles = parseArticleMap(t('grammar.feature_articles', locale));

  const grammar = getGrammarEngine(locale);
  const grammarInfo = detectGrammar(sd.locationName);

  // --- Scenario intro (new_game only) ---
  const scenarioIntro = sd.scenarioIntro ?? null;

  // --- Intro tokens and location description ---
  let intro: SceneToken[];
  let locationDescription: string | null;

  if (introMode === 'revisit') {
    // "Vous revenez dans [article+lieu]."
    const introPhrase = t('scene.intro_revisit', locale);
    const articlePlusName = grammar.resolveSlot('def', sentenceCase(sd.locationName), grammarInfo);
    intro = [
      { kind: 'text',     value: introPhrase + ' ' },
      { kind: 'location', value: articlePlusName },
      { kind: 'text',     value: '.' },
    ];
    locationDescription = null;
  } else {
    // new_game or enter: just the location name as a bold token
    intro = [{ kind: 'location', value: sd.locationName }];
    locationDescription = sd.locationDescription || null;
  }

  // --- The rest (features, items, npcs, exits) is UNCHANGED ---
  // ... keep existing code for featureSegments, itemSegments, npcSegments, exitTokens

  return {
    scenarioIntro,
    intro,
    locationDescription,
    features,
    items,
    npcs,
    exits: exitTokens,
    obstacle: sd.obstacleHint,
    prompt: t('scene.prompt', locale),
  };
}
```

**Important:** The `scene.intro_revisit` i18n key already exists (it was used in the INTRO_KEY map). `scene.intro_new` and `scene.intro_enter` are no longer needed in code but keep them in locale files for now (don't delete i18n keys).

### Step 5: Run tests

```bash
npx vitest run tests/unit/narration/scene.test.ts --reporter=verbose
npm run typecheck
```

Fix any TypeScript errors. Common issues:
- Callers of `narrateScene()` that render `scene.intro` expecting full phrases — they'll now get just a name token. This is intentional.
- `NarratedScene` consumers in `gameStore.ts` and `NarrativePanel.tsx` will need updating (done in later tasks).

### Step 6: Commit

```bash
git add src/narration/scene.ts tests/unit/narration/scene.test.ts
git commit -m "feat(narration): enrich NarratedScene with scenarioIntro + locationDescription"
```

---

## Task 4: Add `'action'` to `LayerType` and export `LAYER_ORDER`

**Files:**
- Modify: `src/narration/types.ts`

### Step 1: Write the failing test

In `tests/unit/narration/composer.test.ts`, add:

```typescript
import { LAYER_ORDER } from '../../../src/narration/types';

describe('LAYER_ORDER constant', () => {
  it('exports LAYER_ORDER in narrative position order', () => {
    expect(LAYER_ORDER).toEqual([
      'action_result',
      'sensory',
      'consequence',
      'npc_reaction',
      'atmosphere',
      'player_state',
      'threat',
    ]);
  });
});
```

### Step 2: Run to verify failure

```bash
npx vitest run tests/unit/narration/composer.test.ts --reporter=verbose
```

### Step 3: Update `src/narration/types.ts`

Replace the `LayerType` type and add the `LAYER_ORDER` constant. Find the `LayerType` definition (around line 64):

```typescript
/** The optional layer types — 'action' layer is built separately and always first */
export type LayerType =
  | 'action_result'    // Layer 2 (mandatory — was layer 1 before)
  | 'sensory'          // Layer 3
  | 'consequence'      // Layer 4
  | 'npc_reaction'     // Layer 5 (moved up from 7)
  | 'atmosphere'       // Layer 6 (moved down from 4)
  | 'player_state'     // Layer 7
  | 'threat';          // Layer 8

/** Canonical narrative position order for final output sorting */
export const LAYER_ORDER: readonly LayerType[] = [
  'action_result',
  'sensory',
  'consequence',
  'npc_reaction',
  'atmosphere',
  'player_state',
  'threat',
] as const;
```

Note: The existing `LayerType` was `'action'` ... wait, looking at the current code it's just `'sensory' | 'consequence' | 'atmosphere' | 'player_state' | 'threat' | 'npc_reaction'`. The spec renames the "Action Result" (what is currently the mandatory Layer 1) to `'action_result'`, but that's an internal scoring concept. The `ScoredLayer.layer` field only applies to the *optional* candidates. Since `action_result` was never in `LayerType` before (it was always mandatory and never a candidate), adding it to `LAYER_ORDER` for sorting is purely for the ordered-output step.

The simplest approach: just add `LAYER_ORDER` as the sorted position array for the candidates. The `LayerType` union doesn't need `'action'` added — the new action phrase is built separately and never goes through the scoring system.

### Step 4: Update `scoreLayerRelevance` in `src/narration/composer.ts`

The current `scoreLayerRelevance` doesn't have `'action_result'` as a case. Since `LayerType` is changing, the switch must cover all values. Add a case or verify TypeScript won't complain. Since `action_result` is in `LAYER_ORDER` for sorting but won't actually be in `candidates[]`, this should be fine — but update the scoring function to match the new ordering:

```typescript
export function scoreLayerRelevance(layer: LayerType, ctx: NarrativeContext): number {
  switch (layer) {
    case 'consequence':
      return (ctx.stateChanges?.length ?? 0) > 0 ? 95 : 0;
    case 'sensory':
      return ctx.outcome === 'auto_success' ? 20 : 60;
    case 'npc_reaction': {
      const directlyInvolved = ctx.npcsPresent.some(npc => npc.id === ctx.target?.id);
      return directlyInvolved ? 80 : 40;   // ← increased from 75/40
    }
    case 'atmosphere':
      return ctx.beat === 'climax' ? 90 : 30 + ctx.tension * 5;
    case 'player_state':
      return ctx.playerHpPercent < 0.3 ? 85
        : ctx.playerConditions.size > 0 ? 50
        : 0;
    case 'threat':
      return hasThreatHint(ctx) ? 70 : 0;
  }
}
```

### Step 5: Run tests

```bash
npx vitest run tests/unit/narration/composer.test.ts --reporter=verbose
npm run typecheck
```

### Step 6: Commit

```bash
git add src/narration/types.ts src/narration/composer.ts tests/unit/narration/composer.test.ts
git commit -m "feat(narration): add LAYER_ORDER constant, reorder layer scores"
```

---

## Task 5: Create `actionPhrases.ts` with verb conjugation tables

**Files:**
- Create: `src/content/templates/actionPhrases.ts`

### Step 1: Write the failing test

In `tests/unit/narration/composer.test.ts`, add:

```typescript
import { getInfinitiveVerbText, getDirectVerbText } from '../../../src/content/templates/actionPhrases';

describe('actionPhrases', () => {
  it('getInfinitiveVerbText returns French infinitive for HACK', () => {
    expect(getInfinitiveVerbText('HACK', 'fr')).toBe('pirater');
  });

  it('getDirectVerbText returns French conjugated form for TAKE', () => {
    expect(getDirectVerbText('TAKE', 'fr')).toBe('ramassez');
  });

  it('getInfinitiveVerbText returns English infinitive for EXAMINE', () => {
    expect(getInfinitiveVerbText('EXAMINE', 'en')).toBe('examine');
  });

  it('getDirectVerbText falls back to infinitive for unknown verb in EN', () => {
    // Just verify it returns a string
    expect(typeof getDirectVerbText('WAIT', 'en')).toBe('string');
  });
});
```

### Step 2: Run to verify failure

```bash
npx vitest run tests/unit/narration/composer.test.ts --reporter=verbose
```

### Step 3: Create `src/content/templates/actionPhrases.ts`

```typescript
// ---------------------------------------------------------------------------
// src/content/templates/actionPhrases.ts — Verb text for action phrase (Layer 1)
// ---------------------------------------------------------------------------
// Maps VerbId → infinitive form (for "Vous tentez de [inf]…")
//           → direct/conjugated form (for "Vous [conj]…" on auto_success)
// ---------------------------------------------------------------------------

import type { VerbId } from '../../engine/verbs';
import type { Locale } from '../../i18n/types';

interface VerbForms {
  readonly infinitive: { readonly fr: string; readonly en: string };
  readonly direct:     { readonly fr: string; readonly en: string };
}

const VERB_FORMS: Readonly<Record<VerbId, VerbForms>> = {
  // FOR
  STRIKE:           { infinitive: { fr: 'frapper',          en: 'strike' },        direct: { fr: 'frappez',          en: 'strike' } },
  PUSH:             { infinitive: { fr: 'pousser',          en: 'push' },           direct: { fr: 'poussez',          en: 'push' } },
  PULL:             { infinitive: { fr: 'tirer',            en: 'pull' },           direct: { fr: 'tirez',            en: 'pull' } },
  LIFT:             { infinitive: { fr: 'soulever',         en: 'lift' },           direct: { fr: 'soulevez',         en: 'lift' } },
  KICK:             { infinitive: { fr: 'donner un coup de pied à', en: 'kick' },   direct: { fr: 'donnez un coup de pied à', en: 'kick' } },
  BREAK:            { infinitive: { fr: 'briser',           en: 'break' },          direct: { fr: 'brisez',           en: 'break' } },
  BEND:             { infinitive: { fr: 'tordre',           en: 'bend' },           direct: { fr: 'tordez',           en: 'bend' } },
  CUT:              { infinitive: { fr: 'couper',           en: 'cut' },            direct: { fr: 'coupez',           en: 'cut' } },
  FORCE_OPEN:       { infinitive: { fr: 'forcer',           en: 'force open' },     direct: { fr: 'forcez',           en: 'force open' } },
  BITE:             { infinitive: { fr: 'mordre',           en: 'bite' },           direct: { fr: 'mordez',           en: 'bite' } },
  SQUEEZE:          { infinitive: { fr: 'comprimer',        en: 'squeeze' },        direct: { fr: 'comprimez',        en: 'squeeze' } },
  IMPROVISE_WEAPON: { infinitive: { fr: 'improviser une arme avec', en: 'improvise a weapon from' }, direct: { fr: 'improvisez une arme avec', en: 'improvise a weapon from' } },
  SACRIFICE:        { infinitive: { fr: 'sacrifier',        en: 'sacrifice' },      direct: { fr: 'sacrifiez',        en: 'sacrifice' } },
  SELF_HARM:        { infinitive: { fr: 'vous blesser',     en: 'harm yourself' },  direct: { fr: 'vous blessez',     en: 'harm yourself' } },
  // DEF
  BLOCK:            { infinitive: { fr: 'bloquer',          en: 'block' },          direct: { fr: 'bloquez',          en: 'block' } },
  IMPROVISE_SHIELD: { infinitive: { fr: 'improviser un bouclier avec', en: 'improvise a shield from' }, direct: { fr: 'improvisez un bouclier avec', en: 'improvise a shield from' } },
  BARRICADE:        { infinitive: { fr: 'barricader',       en: 'barricade' },      direct: { fr: 'barricadez',       en: 'barricade' } },
  // INT
  READ:             { infinitive: { fr: 'lire',             en: 'read' },           direct: { fr: 'lisez',            en: 'read' } },
  HACK:             { infinitive: { fr: 'pirater',          en: 'hack' },           direct: { fr: 'piratez',          en: 'hack' } },
  REPAIR:           { infinitive: { fr: 'réparer',          en: 'repair' },         direct: { fr: 'réparez',          en: 'repair' } },
  DISASSEMBLE:      { infinitive: { fr: 'démonter',         en: 'disassemble' },    direct: { fr: 'démontez',         en: 'disassemble' } },
  ASSEMBLE:         { infinitive: { fr: 'assembler',        en: 'assemble' },       direct: { fr: 'assemblez',        en: 'assemble' } },
  ACTIVATE:         { infinitive: { fr: 'activer',          en: 'activate' },       direct: { fr: 'activez',          en: 'activate' } },
  DEACTIVATE:       { infinitive: { fr: 'désactiver',       en: 'deactivate' },     direct: { fr: 'désactivez',       en: 'deactivate' } },
  REPROGRAM:        { infinitive: { fr: 'reprogrammer',     en: 'reprogram' },      direct: { fr: 'reprogrammez',     en: 'reprogram' } },
  LOCK:             { infinitive: { fr: 'verrouiller',      en: 'lock' },           direct: { fr: 'verrouillez',      en: 'lock' } },
  UNLOCK:           { infinitive: { fr: 'déverrouiller',    en: 'unlock' },         direct: { fr: 'déverrouillez',    en: 'unlock' } },
  WELD:             { infinitive: { fr: 'souder',           en: 'weld' },           direct: { fr: 'soudez',           en: 'weld' } },
  PLUG:             { infinitive: { fr: 'brancher',         en: 'plug in' },        direct: { fr: 'branchez',         en: 'plug in' } },
  OVERRIDE:         { infinitive: { fr: 'outrepasser',      en: 'override' },       direct: { fr: 'outrepassez',      en: 'override' } },
  SABOTAGE:         { infinitive: { fr: 'saboter',          en: 'sabotage' },       direct: { fr: 'sabotez',          en: 'sabotage' } },
  SET_TRAP:         { infinitive: { fr: 'poser un piège',   en: 'set a trap' },     direct: { fr: 'posez un piège',   en: 'set a trap' } },
  IMPROVISE_TOOL:   { infinitive: { fr: 'improviser un outil avec', en: 'improvise a tool from' }, direct: { fr: 'improvisez un outil avec', en: 'improvise a tool from' } },
  WEDGE:            { infinitive: { fr: 'caler',            en: 'wedge' },          direct: { fr: 'calez',            en: 'wedge' } },
  IGNITE:           { infinitive: { fr: 'enflammer',        en: 'ignite' },         direct: { fr: 'enflammez',        en: 'ignite' } },
  FLOOD:            { infinitive: { fr: 'inonder',          en: 'flood' },          direct: { fr: 'inondez',          en: 'flood' } },
  ELECTRIFY:        { infinitive: { fr: 'électrifier',      en: 'electrify' },      direct: { fr: 'électrifiez',      en: 'electrify' } },
  TIE:              { infinitive: { fr: 'attacher',         en: 'tie' },            direct: { fr: 'attachez',         en: 'tie' } },
  COVER:            { infinitive: { fr: 'couvrir',          en: 'cover' },          direct: { fr: 'couvrez',          en: 'cover' } },
  // PER
  EXAMINE:          { infinitive: { fr: 'examiner',         en: 'examine' },        direct: { fr: 'examinez',         en: 'examine' } },
  LISTEN:           { infinitive: { fr: 'écouter',          en: 'listen to' },      direct: { fr: 'écoutez',          en: 'listen to' } },
  SMELL:            { infinitive: { fr: 'sentir',           en: 'smell' },          direct: { fr: 'sentez',           en: 'smell' } },
  SCAN:             { infinitive: { fr: 'scanner',          en: 'scan' },           direct: { fr: 'scannez',          en: 'scan' } },
  // CHA
  TALK:             { infinitive: { fr: 'parler à',         en: 'talk to' },        direct: { fr: 'parlez à',         en: 'talk to' } },
  PERSUADE:         { infinitive: { fr: 'persuader',        en: 'persuade' },       direct: { fr: 'persuadez',        en: 'persuade' } },
  INTIMIDATE:       { infinitive: { fr: 'intimider',        en: 'intimidate' },     direct: { fr: 'intimidez',        en: 'intimidate' } },
  DECEIVE:          { infinitive: { fr: 'tromper',          en: 'deceive' },        direct: { fr: 'trompez',          en: 'deceive' } },
  DISTRACT:         { infinitive: { fr: 'distraire',        en: 'distract' },       direct: { fr: 'distrayez',        en: 'distract' } },
  BARTER:           { infinitive: { fr: 'marchander avec',  en: 'barter with' },    direct: { fr: 'marchandez avec',  en: 'barter with' } },
  SEDUCE:           { infinitive: { fr: 'séduire',          en: 'seduce' },         direct: { fr: 'séduisez',         en: 'seduce' } },
  COMMAND:          { infinitive: { fr: 'commander',        en: 'command' },        direct: { fr: 'commandez',        en: 'command' } },
  CALM:             { infinitive: { fr: 'calmer',           en: 'calm' },           direct: { fr: 'calmez',           en: 'calm' } },
  PROVOKE:          { infinitive: { fr: 'provoquer',        en: 'provoke' },        direct: { fr: 'provoquez',        en: 'provoke' } },
  PLEAD:            { infinitive: { fr: 'implorer',         en: 'plead with' },     direct: { fr: 'implorez',         en: 'plead with' } },
  INTERROGATE:      { infinitive: { fr: 'interroger',       en: 'interrogate' },    direct: { fr: 'interrogez',       en: 'interrogate' } },
  SIGNAL:           { infinitive: { fr: 'signaler',         en: 'signal' },         direct: { fr: 'signalez',         en: 'signal' } },
  LURE:             { infinitive: { fr: 'attirer',          en: 'lure' },           direct: { fr: 'attirez',          en: 'lure' } },
  // AGI
  THROW:            { infinitive: { fr: 'lancer',           en: 'throw' },          direct: { fr: 'lancez',           en: 'throw' } },
  SHOOT:            { infinitive: { fr: 'tirer sur',        en: 'shoot' },          direct: { fr: 'tirez sur',        en: 'shoot' } },
  CLIMB:            { infinitive: { fr: 'escalader',        en: 'climb' },          direct: { fr: 'escaladez',        en: 'climb' } },
  JUMP:             { infinitive: { fr: 'sauter',           en: 'jump' },           direct: { fr: 'sautez',           en: 'jump' } },
  DODGE:            { infinitive: { fr: 'esquiver',         en: 'dodge' },          direct: { fr: 'esquivez',         en: 'dodge' } },
  SWIM:             { infinitive: { fr: 'nager',            en: 'swim' },           direct: { fr: 'nagez',            en: 'swim' } },
  RUN:              { infinitive: { fr: 'courir',           en: 'run' },            direct: { fr: 'courez',           en: 'run' } },
  HIDE:             { infinitive: { fr: 'vous cacher',      en: 'hide' },           direct: { fr: 'vous cachez',      en: 'hide' } },
  STACK:            { infinitive: { fr: 'empiler',          en: 'stack' },          direct: { fr: 'empilez',          en: 'stack' } },
  // Interaction / Auto
  USE:              { infinitive: { fr: 'utiliser',         en: 'use' },            direct: { fr: 'utilisez',         en: 'use' } },
  OPEN:             { infinitive: { fr: 'ouvrir',           en: 'open' },           direct: { fr: 'ouvrez',           en: 'open' } },
  CLOSE:            { infinitive: { fr: 'fermer',           en: 'close' },          direct: { fr: 'fermez',           en: 'close' } },
  TAKE:             { infinitive: { fr: 'ramasser',         en: 'take' },           direct: { fr: 'ramassez',         en: 'take' } },
  DROP:             { infinitive: { fr: 'poser',            en: 'drop' },           direct: { fr: 'posez',            en: 'drop' } },
  GIVE:             { infinitive: { fr: 'donner',           en: 'give' },           direct: { fr: 'donnez',           en: 'give' } },
  EQUIP:            { infinitive: { fr: 'équiper',          en: 'equip' },          direct: { fr: 'équipez',          en: 'equip' } },
  EAT:              { infinitive: { fr: 'consommer',        en: 'eat' },            direct: { fr: 'consommez',        en: 'eat' } },
  DRINK:            { infinitive: { fr: 'boire',            en: 'drink' },          direct: { fr: 'buvez',            en: 'drink' } },
  MOVE_TO:          { infinitive: { fr: 'vous diriger vers', en: 'move to' },       direct: { fr: 'vous dirigez vers', en: 'move to' } },
  WAIT:             { infinitive: { fr: 'attendre',         en: 'wait' },           direct: { fr: 'attendez',         en: 'wait' } },
  TOUCH:            { infinitive: { fr: 'toucher',          en: 'touch' },          direct: { fr: 'touchez',          en: 'touch' } },
};

/** Returns the infinitive form of a verb for "Vous tentez de [infinitive] [target]." */
export function getInfinitiveVerbText(verb: VerbId, locale: Locale): string {
  return VERB_FORMS[verb]?.infinitive[locale] ?? verb.toLowerCase();
}

/** Returns the direct/conjugated form for "Vous [direct] [target]." on auto_success. */
export function getDirectVerbText(verb: VerbId, locale: Locale): string {
  return VERB_FORMS[verb]?.direct[locale] ?? VERB_FORMS[verb]?.infinitive[locale] ?? verb.toLowerCase();
}
```

### Step 4: Run tests

```bash
npx vitest run tests/unit/narration/composer.test.ts --reporter=verbose
npm run typecheck
```

### Step 5: Commit

```bash
git add src/content/templates/actionPhrases.ts tests/unit/narration/composer.test.ts
git commit -m "feat(narration): add verb infinitive/conjugated form tables for action phrases"
```

---

## Task 6: Add `buildActionPhrase()` and restructure `composeNarrative()`

**Files:**
- Modify: `src/narration/composer.ts`

### Step 1: Write failing tests

In `tests/unit/narration/composer.test.ts`, add:

```typescript
import { composeNarrative, LAYER_ORDER } from '../../../src/narration/composer';
import { NARRATIVE_PRESETS } from '../../../src/narration/types';
// Use an existing makeCtx helper from the test file, or define a minimal one

describe('composer 8-layer restructured', () => {
  it('output starts with action phrase before action result', () => {
    const ctx = makeCtx({
      verb: 'HACK',
      target: { id: 'terminal_1', type: 'feature', displayName: undefined, name: 'terminal de sécurité', properties: ['electronic'], grammar: { gender: 'masculine', number: 'singular', isProperNoun: false } },
      outcome: 'success',
    });
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.1), 'fr');
    expect(result).toMatch(/^Vous tentez de pirater/);
  });

  it('auto-success uses direct form (not "tentez de")', () => {
    const ctx = makeCtx({
      verb: 'TAKE',
      target: { id: 'metal_bar', type: 'item', name: 'barre de métal', properties: [], grammar: { gender: 'feminine', number: 'singular', isProperNoun: false } },
      outcome: 'auto_success',
    });
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.1), 'fr');
    expect(result).toMatch(/^Vous ramassez/);
    expect(result).not.toContain('tentez');
  });

  it('WAIT with no target produces a valid action phrase', () => {
    const ctx = makeCtx({ verb: 'WAIT', target: null, outcome: 'auto_success' });
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.concise, fixedRng(0.1), 'fr');
    expect(result).toMatch(/^Vous attendez/);
  });
});

// Helper (adapt to existing patterns in the file)
function fixedRng(val: number) { return () => val; }
```

**Note:** Check if `makeCtx` already exists in `tests/unit/narration/composer.test.ts`. It likely does — look for it and adapt accordingly. If the test file doesn't have `makeCtx`, look at `tests/unit/narration/bridge.test.ts` for how `NarrativeContext` is constructed in tests.

### Step 2: Run to verify failure

```bash
npx vitest run tests/unit/narration/composer.test.ts --reporter=verbose
```

### Step 3: Add `buildActionPhrase()` to `src/narration/composer.ts`

Add the import at the top of `src/narration/composer.ts`:

```typescript
import { getInfinitiveVerbText, getDirectVerbText } from '../content/templates/actionPhrases';
```

Add the function before `composeNarrative()`:

```typescript
/**
 * Build the action phrase (Layer 1) — always shown first.
 *
 * Auto-success: "Vous [direct] [target]."
 * Rolled action: "Vous tentez de [infinitive] [target]."
 * No target: "Vous [direct/infinitive]."
 */
function buildActionPhrase(ctx: NarrativeContext, locale: Locale): string {
  const grammar = getGrammarEngine(locale);
  const targetName = ctx.target?.name ?? '';
  const grammarInfo = ctx.target ? { gender: ctx.target.grammar.gender, number: ctx.target.grammar.number, isProperNoun: ctx.target.grammar.isProperNoun } : null;

  if (ctx.outcome === 'auto_success') {
    const verbText = getDirectVerbText(ctx.verb, locale);
    if (!targetName) return `Vous ${verbText}.`;
    const targetWithArticle = grammarInfo
      ? grammar.resolveSlot('def', targetName, grammarInfo)
      : targetName;
    return `Vous ${verbText} ${targetWithArticle}.`;
  }

  // Rolled action
  const verbText = getInfinitiveVerbText(ctx.verb, locale);
  if (!targetName) return `Vous tentez de ${verbText}.`;
  const targetWithArticle = grammarInfo
    ? grammar.resolveSlot('def', targetName, grammarInfo)
    : targetName;
  return `Vous tentez de ${verbText} ${targetWithArticle}.`;
}
```

### Step 4: Restructure `composeNarrative()`

Find the `composeNarrative()` function and replace the section from "// ── LAYER 1: ACTION RESULT" to the end of the `selected` loop.

**Current pattern:**
```typescript
const parts: string[] = [renderTemplate(actionText, ctx, effectiveLocale)];
// ... candidates ...
const selected = sorted.slice(0, budget - 1);
for (const layer of selected) { ... }
```

**New pattern:**
```typescript
// ── LAYER 1: ACTION (mandatory, always first) ──
const actionPhrase = buildActionPhrase(ctx, effectiveLocale);
const parts: string[] = [actionPhrase];

// ── LAYER 2: ACTION RESULT (mandatory, always second) ──
const actionTemplate = selectActionTemplate(ctx);
const actionText = effectiveLocale === 'fr' ? actionTemplate.text.fr : actionTemplate.text.en;
parts.push(renderTemplate(actionText, ctx, effectiveLocale));

// ── Score all optional layers (3–8) ──
// ... (candidates array — UNCHANGED, just move NPC before atmosphere in the push order)
// Note: NPC is now pushed at a higher probability position. The order of push to candidates[]
// doesn't matter — scoring + final sort by LAYER_ORDER handles position.

// After layer 7 (NPC), move the NPC block BEFORE the atmosphere block:
// Swap the order of "Layer 4: ATMOSPHERE" and "Layer 7: NPC" candidate pushes

// ── Select top layers within budget ──
const sorted = [...candidates].sort((a, b) => b.score - a.score);
const selected = sorted.slice(0, budget - 2); // -2: action + action_result already included

// ── Reorder selected layers into narrative position order ──
const ordered = [...selected].sort(
  (a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer)
);

for (const layer of ordered) {
  const rawText = layer.render();
  if (rawText) {
    parts.push(renderTemplate(rawText, ctx, effectiveLocale));
  }
}
```

**Also export `LAYER_ORDER` from composer (re-export from types):**
```typescript
export { LAYER_ORDER } from './types';
```

### Step 5: Run tests

```bash
npx vitest run tests/unit/narration/composer.test.ts --reporter=verbose
npx vitest run tests/unit/narration/ --reporter=verbose
npm run typecheck
```

Fix any failures. Common issues:
- `budget - 2` might cut too many layers for `concise` (budget=3 → only 1 optional). Verify: concise=3, so budget-2=1 optional layer — correct per spec.
- Template rendering of the action phrase may need `grammar.postProcess()` adjustment.

### Step 6: Commit

```bash
git add src/narration/composer.ts src/content/templates/actionPhrases.ts tests/unit/narration/composer.test.ts
git commit -m "feat(narration): add action phrase layer + reorder NPC before atmosphere"
```

---

## Task 7: Update `flattenSceneToText`, add `flattenSceneReminder`, update `submitAction`

**Files:**
- Modify: `src/stores/gameStore.ts`

### Step 1: Read current `flattenSceneToText` and `submitAction`

Read `src/stores/gameStore.ts` lines 200-220 (flattenSceneToText) and 404-540 (submitAction).

### Step 2: Write failing tests

Look at `tests/unit/stores/` if it exists, or add to an integration test. Since gameStore is a Zustand store (hard to unit-test directly), focus on testing the helper functions by extracting them or testing via the store API. Check existing test files for the pattern used.

Add to an appropriate test file:

```typescript
describe('flattenSceneToText restructured', () => {
  it('new_game: scenarioIntro + locationName — description + elements', () => {
    const scene: NarratedScene = {
      scenarioIntro: 'Vous vous réveillez seul…',
      intro: [{ kind: 'location', value: 'Baie Cryo' }],
      locationDescription: 'Froid mordant.',
      obstacle: null,
      features: [{ kind: 'text', value: 'Vous voyez un terminal.' }],
      items: [],
      npcs: [],
      exits: [{ kind: 'exit', value: 'Sortie vers couloir.', visited: false }],
      prompt: 'Que faites-vous ?',
    };
    const text = flattenSceneToText(scene, true);
    expect(text).toContain('Vous vous réveillez seul…');
    expect(text).toContain('Baie Cryo — Froid mordant.');
    expect(text).toContain('Vous voyez un terminal.');
    expect(text).toContain('Que faites-vous ?');
  });

  it('revisit: no scenarioIntro, no description', () => {
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
  it('produces only elements + prompt, no intro or description', () => {
    const scene: NarratedScene = {
      scenarioIntro: 'ignore',
      intro: [{ kind: 'location', value: 'ignore' }],
      locationDescription: 'ignore',
      obstacle: null,
      features: [{ kind: 'text', value: 'Vous voyez un terminal.' }],
      items: [{ kind: 'text', value: 'Vous remarquez un couteau.' }],
      npcs: [],
      exits: [{ kind: 'exit', value: 'Sortie vers couloir.', visited: false }],
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

Note: `flattenSceneToText` and `flattenSceneReminder` are currently module-internal. To test them, either:
- Export them from `gameStore.ts` (add `export` keyword)
- Or test them only through integration tests

The simplest approach: export both functions for testability.

### Step 3: Update `flattenSceneToText` in `src/stores/gameStore.ts`

Replace the current `flattenSceneToText` function (lines ~203-215):

```typescript
export function flattenSceneToText(scene: NarratedScene, showIntro: boolean): string {
  const lines: string[] = [];

  // Scenario intro (new_game only)
  if (showIntro && scene.scenarioIntro) {
    lines.push(scene.scenarioIntro);
    lines.push(''); // blank line separator
  }

  // Intro + location description
  if (showIntro && scene.intro.length > 0) {
    const introText = scene.intro.map(tok => tok.value).join('');
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

  // Interactive elements
  for (const tokens of [scene.features, scene.items, scene.npcs, scene.exits]) {
    if (tokens.length > 0) {
      lines.push(tokens.map(tok => tok.value).join(''));
    }
  }

  lines.push(scene.prompt);
  return lines.join('\n');
}

/** Post-action reminder: only interactive elements + prompt (no intro, no description). */
export function flattenSceneReminder(scene: NarratedScene): string {
  const lines: string[] = [];
  for (const tokens of [scene.features, scene.items, scene.npcs, scene.exits]) {
    if (tokens.length > 0) {
      lines.push(tokens.map(tok => tok.value).join(''));
    }
  }
  lines.push(scene.prompt);
  return lines.join('\n');
}
```

### Step 4: Update `submitAction` narrative assembly

Find the section in `submitAction` (around line 513-519) where `fullNarrative` is assembled. Replace:

```typescript
// OLD:
const sceneText = sceneIntro
  ? flattenSceneToText(sceneIntro, introMode !== null)
  : '';
const fullNarrative = sceneText ? `${narrative}\n\n${sceneText}` : narrative;
```

With:

```typescript
// NEW:
let fullNarrative: string;
if (introMode !== null) {
  // Location change: show full scene (intro + description + elements)
  fullNarrative = sceneIntro ? flattenSceneToText(sceneIntro, true) : narrative;
} else {
  // Same location: narrative + reminder of interactive elements
  const reminder = sceneIntro ? flattenSceneReminder(sceneIntro) : '';
  fullNarrative = reminder ? `${narrative}\n\n${reminder}` : narrative;
}
```

Also check `onDiceAnimationComplete` (around line 542) — it likely has similar logic. Update the same way.

### Step 5: Run tests

```bash
npm test
npm run typecheck
```

Fix TypeScript errors. Common: `NarratedScene` shape change breaks existing code that accesses `scene.intro` expecting full sentence tokens.

### Step 6: Commit

```bash
git add src/stores/gameStore.ts
git commit -m "feat(narration): update flattenSceneToText + add flattenSceneReminder, new assembly logic"
```

---

## Task 8: Update `NarrativePanel.tsx`

**Files:**
- Modify: `src/ui/components/NarrativePanel.tsx`

### Step 1: Read the full current file

Read `src/ui/components/NarrativePanel.tsx`. Specifically understand:
- `NarratedSceneBlock` (lines 34-60)
- `renderClippedScene` (lines 72-~150)

### Step 2: Update `NarratedSceneBlock`

Replace the `NarratedSceneBlock` function body:

```tsx
function NarratedSceneBlock({ scene, showIntro = true }: { readonly scene: NarratedScene; readonly showIntro?: boolean }): JSX.Element {
  return (
    <div style={{ marginBottom: '8px', lineHeight: 1.6 }}>
      {/* Scenario intro (new_game only) */}
      {showIntro && scene.scenarioIntro && (
        <div style={{ color: 'var(--text-narrative)', marginBottom: '12px' }}>
          {scene.scenarioIntro}
        </div>
      )}

      {/* Location intro + rich description */}
      {showIntro && scene.intro.length > 0 && (
        <div>
          {scene.intro.map((tok, j) => <SceneTokenSpan key={j} token={tok} />)}
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

      {/* Interactive elements */}
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

### Step 3: Update `renderClippedScene`

The `renderClippedScene` function uses `allLines` built from sections. It needs to account for `scenarioIntro` and `locationDescription`. The char budget must match `flattenSceneToText`.

Replace the `allLines` construction (around lines 79-91):

```typescript
function renderClippedScene(
  scene: NarratedScene,
  showIntro: boolean,
  maxChars: number,
): JSX.Element | null {
  if (maxChars <= 0) return null;

  // Build the lines in the same order as flattenSceneToText
  type RenderLine =
    | { readonly kind: 'text-block'; readonly text: string; readonly color: string }
    | { readonly kind: 'tokens'; readonly tokens: readonly SceneToken[]; readonly locationDesc?: string }
    | { readonly kind: 'obstacle'; readonly text: string }
    | { readonly kind: 'prompt'; readonly text: string };

  const allLines: RenderLine[] = [];

  if (showIntro) {
    if (scene.scenarioIntro) {
      allLines.push({ kind: 'text-block', text: scene.scenarioIntro, color: 'var(--text-narrative)' });
      allLines.push({ kind: 'text-block', text: '', color: 'var(--text-narrative)' }); // blank line
    }
    if (scene.intro.length > 0) {
      allLines.push({ kind: 'tokens', tokens: scene.intro, locationDesc: scene.locationDescription ?? undefined });
    }
  }

  if (scene.obstacle) {
    allLines.push({ kind: 'obstacle', text: scene.obstacle });
  }

  for (const s of [scene.features, scene.items, scene.npcs, scene.exits]) {
    if (s.length > 0) allLines.push({ kind: 'tokens', tokens: s });
  }

  allLines.push({ kind: 'prompt', text: scene.prompt });

  // ... render loop (adapt existing logic to handle new line kinds)
  // For 'text-block': render as <div style={{ color }}>{text}</div>
  // For 'tokens': render tokens + optional locationDesc after
  // For 'obstacle' and 'prompt': existing logic unchanged
}
```

**Note:** The clipping logic counts characters. For `text-block` lines (scenarioIntro, locationDescription), count the `.length` of the text string. Adapt the existing character-counting loop accordingly.

### Step 4: Run visual check with dev server

```bash
npm run dev
```

Open browser, start a new game, verify:
- First screen shows scenario intro, then location name, then description
- After an action: narrative text followed by element reminder
- On revisit: "Vous revenez dans…" without description

### Step 5: Run tests

```bash
npm test
npm run typecheck
```

### Step 6: Commit

```bash
git add src/ui/components/NarrativePanel.tsx
git commit -m "feat(ui): update NarrativePanel for new NarratedScene shape (scenarioIntro + locationDescription)"
```

---

## Task 9: Update `scripts/testModule.ts` and `scripts/ai-playtest.ts`

**Files:**
- Modify: `scripts/testModule.ts`
- Modify: `scripts/ai-playtest.ts`

### Step 1: Read both files

Search for `displayScene` or any function that renders a `NarratedScene` to the console:

```bash
grep -n "NarratedScene\|displayScene\|narrateScene\|intro\|features\|items\|npcs\|exits" scripts/testModule.ts scripts/ai-playtest.ts
```

### Step 2: Update scene rendering in `testModule.ts`

Find the function that prints scene tokens to the console (likely using ANSI chalk/color codes). Update it to handle the new `NarratedScene` fields:

```typescript
function displayScene(scene: NarratedScene, showIntro: boolean): void {
  if (showIntro && scene.scenarioIntro) {
    console.log(white(scene.scenarioIntro));
    console.log();
  }

  if (showIntro && scene.intro.length > 0) {
    const introText = scene.intro.map(tok => tok.value).join('');
    if (scene.locationDescription) {
      console.log(yellow(bold(introText)) + white(' — ' + scene.locationDescription));
    } else {
      console.log(yellow(bold(introText)));
    }
  }

  if (scene.obstacle) {
    console.log(red(italic(scene.obstacle)));
  }

  for (const tok of scene.features) {
    if (tok.kind === 'feature') process.stdout.write(cyan(tok.value));
    else process.stdout.write(tok.value);
  }
  if (scene.features.length > 0) console.log();

  // items, npcs, exits — similar pattern with their respective colors
  // ...

  console.log(gray(italic(scene.prompt)));
}
```

Adapt to the actual ANSI helpers used in these scripts (they may use `chalk`, `kleur`, or raw ANSI codes — check the imports).

### Step 3: Update `ai-playtest.ts` similarly

Apply the same displayScene changes.

### Step 4: Verify scripts run without errors

```bash
npm run playtest:auto
```

Expected: single playthrough completes, scene displays correctly in terminal.

### Step 5: Commit

```bash
git add scripts/testModule.ts scripts/ai-playtest.ts
git commit -m "feat(scripts): update scene display for new NarratedScene shape"
```

---

## Task 10: Final verification and full test suite

### Step 1: Run the complete test suite

```bash
npm run check
```

Expected: all tests pass, no TypeScript errors, no ESLint warnings.

### Step 2: Run stress tests

```bash
npm run test:stress
```

### Step 3: Manual playtest checklist

```bash
npm run playtest
```

Verify:
- [ ] At new_game: scenario intro appears first (paragraph), then `LocationName — rich description`
- [ ] First enter into a new location: `LocationName — rich description`, elements, prompt
- [ ] Revisit: `Vous revenez dans [lieu].`, elements only, no description
- [ ] After any non-movement action: narrative text ends with element reminder + prompt
- [ ] Narrative text starts with "Vous tentez de…" (rolled) or "Vous [verb]…" (auto)
- [ ] NPC reaction appears before atmosphere snippet in narrative text
- [ ] Items already taken don't appear in reminder

### Step 4: Final commit

```bash
git add -A
git commit -m "feat(narration): restructure narrative layers — action phrase + rich location + element reminders"
```

---

## Troubleshooting

**"Property 'scenarioIntro' does not exist on type 'NarratedScene'"**
→ Task 3 (scene.ts interface) not complete. Re-check.

**"Argument of type 'X' is not assignable to parameter 'Y'"**
→ `buildSceneDescription` signature changed in Task 2. Update callers.

**Tests fail with "undefined is not iterable"**
→ Some `NarratedScene` consumers still use the old shape. Search for `scene.intro` and `scene.features` usages with `grep -rn "\.intro\b\|\.features\b" src/`.

**`flattenSceneToText` char count mismatch with clipping**
→ Ensure `renderClippedScene` counts `scenarioIntro.length + 1` (for newline) when `scenarioIntro` is present.

**NPC reaction missing from output**
→ Verify `budget - 2` calculation: for `standard` (budget=5), that's 3 optional layers = action_result + sensory + consequence + npc + atmosphere (5 total). Wait — action and action_result are BOTH mandatory. Budget=5 means: action (1) + action_result (1) + 3 optional. So `selected = sorted.slice(0, budget - 2)` gives `sorted.slice(0, 3)` → 3 optional layers. Correct.
