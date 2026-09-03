# Dice Roll Choreography Implementation Plan

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — plan d'exécution de `SPEC_DICE_CHOREOGRAPHY.md`.
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the dice roll into a 4-act cinematic sequence with progressive DC breakdown reveal, haptic feedback, and clutch moments (NAT 1/20 specials, skip-to-result).

**Architecture:** Engine adds `namedLines: DifficultyLine[]` to `DifficultyBreakdown`; store gains `pendingDifficultyBreakdown` + `hasSeenFullAnimation`; `useDiceAnimation` hook and `DiceAnimation` component are fully rewritten to orchestrate the 4 acts with timing constants.

**Tech Stack:** TypeScript 5 strict, React 18, Zustand, Vitest, CSS animations, `navigator.vibrate()` for haptic.

---

## Codebase Context

Key files you'll touch:
- `src/i18n/types.ts` — `StringKey` union (add ~20 new keys)
- `src/i18n/locales/fr.ts` and `src/i18n/locales/en.ts` — translations
- `src/engine/constants.ts` — `BALANCE.CONTEXT_MODIFIERS`
- `src/engine/types.ts` — `DifficultyLine` type + `DifficultyBreakdown.namedLines`
- `src/engine/difficulty.ts` — `getPlayerConditionMods()` + `calculateDifficulty()`
- `src/engine/processTurn.ts` — remove `conditionRollMod`, inject ship memory into namedLines
- `tests/unit/engine/difficulty.test.ts` — new namedLines tests
- `src/ui/hooks/useHaptic.ts` — create (new file)
- `src/stores/gameStore.ts` — add `pendingDifficultyBreakdown`, `hasSeenFullAnimation`
- `src/ui/hooks/useDiceAnimation.ts` — full rewrite
- `src/ui/components/DiceAnimation.tsx` — full rewrite
- `src/ui/styles/animations.css` — add 6 new keyframe animations + dice overlay styles
- `src/ui/screens/GameScreen.tsx` — pass `pendingDifficultyBreakdown` to `DiceAnimation`

Key findings from codebase exploration:
- `TurnResult` does NOT expose `difficultyBreakdown` directly — it lives inside `result.trace.difficultyBreakdown`
- Store already has `pendingDiceResult`/`isDiceAnimating` but NOT `pendingDifficultyBreakdown` or `hasSeenFullAnimation`
- `getPlayerConditionMods()` in `difficulty.ts` handles `wounded` but NOT `terrified` (terrified is applied as a roll modifier in `processTurn.ts` via inline `conditionRollMod`)
- `AUTO_VERBS` check at top of `calculateDifficulty()` must return `namedLines: []`
- CSS vars available: `--amber-glow`, `--crit-gold`, `--success`, `--danger`, `--text-system`, `--font-mono`, `--font-display` (Orbitron)

Validation commands:
- `npm run build` — TypeScript compile check
- `npm test` — unit test suite
- `npm run check` — full gate (typecheck + lint + all tests)

---

## Task 1: Add StringKeys to i18n types

**Files:**
- Modify: `src/i18n/types.ts`

**Step 1: Open the file and find the end of the StringKey union**

Look for the last `|` line in the `export type StringKey =` block. Add the new keys after existing ones.

**Step 2: Add the new keys**

Add these lines at the end of the `StringKey` union (before the closing semicolon):

```typescript
  // --- Dice roll UI — DC modifiers ---
  | 'dice.modifier.incompatible'
  | 'dice.modifier.noTool'
  | 'dice.modifier.toolAdapted'
  | 'dice.modifier.toolWrong'
  | 'dice.modifier.dark'
  | 'dice.modifier.zeroG'
  | 'dice.modifier.timePressure'
  | 'dice.modifier.targetHostile'
  | 'dice.modifier.targetArmored'
  | 'dice.modifier.targetCooperative'
  | 'dice.modifier.targetAttached'
  | 'dice.modifier.wounded'
  | 'dice.modifier.terrified'
  | 'dice.modifier.highStat'
  | 'dice.modifier.creative'
  | 'dice.modifier.shipMemory'
  // --- Dice roll UI — structural labels ---
  | 'dice.dc.toBeat'
  | 'dice.roll.luck'
  | 'dice.roll.total'
  // --- Dice roll UI — results ---
  | 'dice.result.success'
  | 'dice.result.failure'
  | 'dice.result.critSuccess'
  | 'dice.result.critFailure'
```

**Step 3: Verify**

Run: `npm run build`
Expected: Compiles. TypeScript will enforce that every new key gets a translation.

**Step 4: Commit**

```bash
git add src/i18n/types.ts
git commit -m "feat(i18n): add StringKeys for dice choreography UI"
```

---

## Task 2: Add French translations

**Files:**
- Modify: `src/i18n/locales/fr.ts`

**Step 1: Find the right place**

The file is a big object literal. Find a suitable section (after existing game keys) and add:

```typescript
  // Dice choreography
  'dice.modifier.incompatible':      'Action incompatible',
  'dice.modifier.noTool':            'Outil absent',
  'dice.modifier.toolAdapted':       'Outil adapté',
  'dice.modifier.toolWrong':         'Mauvais outil',
  'dice.modifier.dark':              'Obscurité',
  'dice.modifier.zeroG':             'Apesanteur',
  'dice.modifier.timePressure':      'Pression temporelle',
  'dice.modifier.targetHostile':     'Cible hostile',
  'dice.modifier.targetArmored':     'Cible blindée',
  'dice.modifier.targetCooperative': 'Cible coopérative',
  'dice.modifier.targetAttached':    'Membre attaché',
  'dice.modifier.wounded':           'Blessé',
  'dice.modifier.terrified':         'Terrifié',
  'dice.modifier.highStat':          '{stat} élevé',
  'dice.modifier.creative':          'Créatif',
  'dice.modifier.shipMemory':        'Mémoire du vaisseau',
  'dice.dc.toBeat':                  'À battre',
  'dice.roll.luck':                  'Chance',
  'dice.roll.total':                 'Total',
  'dice.result.success':             'SUCCÈS',
  'dice.result.failure':             'ÉCHEC',
  'dice.result.critSuccess':         'CRITIQUE !',
  'dice.result.critFailure':         'FUMBLE !',
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add src/i18n/locales/fr.ts
git commit -m "feat(i18n): add French translations for dice choreography"
```

---

## Task 3: Add English translations

**Files:**
- Modify: `src/i18n/locales/en.ts`

**Step 1: Add the translations**

Same pattern as FR. Add:

```typescript
  // Dice choreography
  'dice.modifier.incompatible':      'Incompatible action',
  'dice.modifier.noTool':            'No tool',
  'dice.modifier.toolAdapted':       'Right tool',
  'dice.modifier.toolWrong':         'Wrong tool',
  'dice.modifier.dark':              'Darkness',
  'dice.modifier.zeroG':             'Zero gravity',
  'dice.modifier.timePressure':      'Time pressure',
  'dice.modifier.targetHostile':     'Hostile target',
  'dice.modifier.targetArmored':     'Armored target',
  'dice.modifier.targetCooperative': 'Cooperative target',
  'dice.modifier.targetAttached':    'Attached limb',
  'dice.modifier.wounded':           'Wounded',
  'dice.modifier.terrified':         'Terrified',
  'dice.modifier.highStat':          'High {stat}',
  'dice.modifier.creative':          'Creative',
  'dice.modifier.shipMemory':        'Ship memory',
  'dice.dc.toBeat':                  'To beat',
  'dice.roll.luck':                  'Luck',
  'dice.roll.total':                 'Total',
  'dice.result.success':             'SUCCESS',
  'dice.result.failure':             'FAILURE',
  'dice.result.critSuccess':         'CRITICAL!',
  'dice.result.critFailure':         'FUMBLE!',
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add src/i18n/locales/en.ts
git commit -m "feat(i18n): add English translations for dice choreography"
```

---

## Task 4: Add TERRIFIED_PLAYER constant

**Files:**
- Modify: `src/engine/constants.ts`

**Step 1: Locate CONTEXT_MODIFIERS**

In `constants.ts`, find `CONTEXT_MODIFIERS:` block. Currently ends at `ABSURD_MAX_BONUS: 15,`.

Add `TERRIFIED_PLAYER: 1,` directly after `WOUNDED_PLAYER: 1,`:

```typescript
    WOUNDED_PLAYER: 1,
    TERRIFIED_PLAYER: 1,        // ← NEW
    HIGH_RELEVANT_STAT_THRESHOLD: 4,
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles.

**Step 3: Commit**

```bash
git add src/engine/constants.ts
git commit -m "feat(engine): add TERRIFIED_PLAYER DC modifier constant"
```

---

## Task 5: Add DifficultyLine type and namedLines to DifficultyBreakdown

**Files:**
- Modify: `src/engine/types.ts`

**Step 1: Add the DifficultyLine interface**

Find the `DifficultyBreakdown` interface in `types.ts` (around line 553). Add this new interface just BEFORE it:

```typescript
/** A single named line in the DC decomposition, for UI display */
export interface DifficultyLine {
  /**
   * i18n key — never hardcoded text.
   * For the base line, use VERB_REGISTRY[verb].nameKey.
   */
  labelKey: StringKey;
  /** Optional params for interpolation. Ex: { stat: 'INT' } for 'dice.modifier.highStat' */
  labelParams?: Record<string, string>;
  /** Signed value (+2, -3). Lines with value === 0 are omitted by the UI. */
  value: number;
  /** Determines color styling in the UI */
  category: 'base' | 'penalty' | 'bonus';
}
```

**Step 2: Add namedLines to DifficultyBreakdown**

In the `DifficultyBreakdown` interface, add:

```typescript
export interface DifficultyBreakdown {
  readonly base: number;
  readonly verbMod: number;
  readonly compatibilityPenalty: number;
  readonly contextMods: number;
  readonly creativityMod: number;
  readonly difficultyPresetMod: number;
  readonly total: number;
  readonly details: readonly string[];
  /** Named lines for the dice choreography UI. Populated by calculateDifficulty(). */
  readonly namedLines: readonly DifficultyLine[];
}
```

**Step 3: Add StringKey import if not present**

Check if `StringKey` is imported in `types.ts`. It likely is already used for nameKey. If not, it comes from `@i18n/types`. Check the import at top of file.

**Step 4: Patch all literal DifficultyBreakdown objects**

TypeScript will now error on every place that builds a `DifficultyBreakdown` without `namedLines`. Run `npm run build` and fix each error by adding `namedLines: []`.

Key places to check (from grep):
- `src/engine/difficulty.ts` — the `AUTO_VERBS` early return AND the main `return` at end (will be fixed in Task 6 & 7)
- `src/ui/hooks/useGameLoop.ts` — any mock breakdowns (grep: `difficultyBreakdown:`)
- `src/ui/hooks/useReplEngine.ts` — same
- Any test files that construct a literal `DifficultyBreakdown`

For each place that's NOT `difficulty.ts` (which we'll fix properly in Task 7), just add `namedLines: []` to the literal.

**Step 5: Verify**

Run: `npm run build`
Expected: Compiles with zero TypeScript errors.

**Step 6: Commit**

```bash
git add src/engine/types.ts src/ui/hooks/useGameLoop.ts src/ui/hooks/useReplEngine.ts
git commit -m "feat(engine): add DifficultyLine type and namedLines to DifficultyBreakdown"
```

---

## Task 6: Move terrified penalty from roll modifier to DC

**Files:**
- Modify: `src/engine/difficulty.ts`
- Modify: `src/engine/processTurn.ts`

### Part A — difficulty.ts: Add terrified to getPlayerConditionMods()

**Step 1: Locate `getPlayerConditionMods()`**

Find the function (currently around line 171). It currently handles `wounded` and high-stat bonus.

**Step 2: Add terrified handling after the wounded block**

```typescript
  // Wounded penalty
  if (playerConditions.includes('wounded')) {
    mod += BALANCE.CONTEXT_MODIFIERS.WOUNDED_PLAYER;
    details.push('Joueur blessé');
  }

  // Terrified penalty (DC +1) — replaces the roll modifier in processTurn
  if (playerConditions.includes('terrified')) {
    mod += BALANCE.CONTEXT_MODIFIERS.TERRIFIED_PLAYER;
    details.push('terrified'); // internal key, NOT FR text
  }
```

**Step 3: Verify difficulty.ts compiles**

Run: `npm run build`
Expected: No new errors.

### Part B — processTurn.ts: Remove conditionRollMod

**Step 4: Find and remove conditionRollMod**

Search for `conditionRollMod` in `processTurn.ts` (around line 791). Remove these lines:

```typescript
const conditionRollMod = current.character!.conditions.some(
  c => c.id === 'terrified',
) ? -1 : 0;
```

**Step 5: Update rollCheck call**

Find: `diceRoll = rollCheck(statId, statValue, lck, effectiveDC, conditionRollMod, rng);`
Change to: `diceRoll = rollCheck(statId, statValue, lck, effectiveDC, 0, rng);`

**Step 6: Run tests**

Run: `npm test`
Expected: All tests pass. If any test was checking `conditionRollMod` behavior directly, update it to expect DC +1 instead of roll -1.

**Step 7: Commit**

```bash
git add src/engine/difficulty.ts src/engine/processTurn.ts
git commit -m "fix(engine): move terrified from roll modifier to DC penalty"
```

---

## Task 7: Build namedLines in calculateDifficulty()

**Files:**
- Modify: `src/engine/difficulty.ts`

**Step 1: Add imports**

At top of `difficulty.ts`, ensure `DifficultyLine` is imported from `@engine/types` and `StringKey` from `@i18n/types`:

```typescript
import type { DifficultyLine, ... } from './types';
import type { StringKey } from '@i18n/types';
```

**Step 2: Fix the AUTO_VERBS early return**

Find the `if (AUTO_VERBS.has(input.verb))` block and add `namedLines: []`:

```typescript
  if (AUTO_VERBS.has(input.verb)) {
    return {
      base: 0, verbMod: 0, compatibilityPenalty: 0,
      contextMods: 0, creativityMod: 0, difficultyPresetMod: 0,
      total: 0, details: ['Action automatique (DC 0)'],
      namedLines: [],
    };
  }
```

**Step 3: Build namedLines at the end of calculateDifficulty()**

After the `clamp` logic and `details.push('Total: ...')` line, add the namedLines construction BEFORE the `return`. The variables `base`, `verbMod`, `compatibilityPenalty`, `difficultyPresetMod`, `toolResult`, `envResult`, `disposition`, `creativityMod`, `playerResult` are already in scope.

```typescript
  // === NAMED LINES FOR UI DECOMPOSITION ===
  const namedLines: DifficultyLine[] = [];

  // 1. Base line: verb nameKey + combined base+verbMod+preset
  const baseTotal = base + verbMod + difficultyPresetMod;
  namedLines.push({
    labelKey: VERB_REGISTRY[input.verb].nameKey,
    value: baseTotal,
    category: 'base',
  });

  // 2. Incompatibility
  if (compatibilityPenalty > 0) {
    namedLines.push({
      labelKey: 'dice.modifier.incompatible',
      value: compatibilityPenalty,
      category: 'penalty',
    });
  }

  // 3. Tool
  if (toolResult.mod !== 0) {
    const toolKey: StringKey = toolResult.mod < 0
      ? 'dice.modifier.toolAdapted'
      : toolResult.mod >= 5
        ? 'dice.modifier.noTool'
        : 'dice.modifier.toolWrong';
    namedLines.push({
      labelKey: toolKey,
      value: toolResult.mod,
      category: toolResult.mod < 0 ? 'bonus' : 'penalty',
    });
  }

  // 4. Environment — one line per active condition
  const envKeyMap: Partial<Record<EnvironmentCondition, StringKey>> = {
    dark:          'dice.modifier.dark',
    zero_g:        'dice.modifier.zeroG',
    time_pressure: 'dice.modifier.timePressure',
  };
  for (const condition of input.environmentConditions ?? []) {
    const key = envKeyMap[condition];
    if (key) {
      const singleMod =
        condition === 'dark'          ? BALANCE.CONTEXT_MODIFIERS.IN_DARKNESS
        : condition === 'zero_g'     ? BALANCE.CONTEXT_MODIFIERS.ZERO_GRAVITY
        : BALANCE.CONTEXT_MODIFIERS.TIME_PRESSURE;
      namedLines.push({ labelKey: key, value: singleMod, category: 'penalty' });
    }
  }

  // 5. Target disposition
  if (disposition.mod !== 0) {
    const normalizedDetail = disposition.detail.toLowerCase();
    let dispKey: StringKey = 'dice.modifier.targetHostile'; // fallback
    if (normalizedDetail.includes('coopérative') || normalizedDetail.includes('cooperative')) {
      dispKey = 'dice.modifier.targetCooperative';
    } else if (normalizedDetail.includes('fortifié') || normalizedDetail.includes('fortified') || normalizedDetail.includes('blindée') || normalizedDetail.includes('armored')) {
      dispKey = 'dice.modifier.targetArmored';
    }
    namedLines.push({
      labelKey: dispKey,
      value: disposition.mod,
      category: disposition.mod > 0 ? 'penalty' : 'bonus',
    });
  }

  // 6. Attached target (body parts)
  if (input.target?.properties.includes('attached' as PropertyId)) {
    namedLines.push({
      labelKey: 'dice.modifier.targetAttached',
      value: 3,
      category: 'penalty',
    });
  }

  // 7. Player conditions
  if (input.playerConditions?.includes('wounded')) {
    namedLines.push({
      labelKey: 'dice.modifier.wounded',
      value: BALANCE.CONTEXT_MODIFIERS.WOUNDED_PLAYER,
      category: 'penalty',
    });
  }
  if (input.playerConditions?.includes('terrified')) {
    namedLines.push({
      labelKey: 'dice.modifier.terrified',
      value: BALANCE.CONTEXT_MODIFIERS.TERRIFIED_PLAYER,
      category: 'penalty',
    });
  }

  // 8. High stat bonus
  const nlStatId = VERB_STATS[input.verb] as StatId | undefined;
  if (nlStatId && input.playerStats[nlStatId] >= BALANCE.CONTEXT_MODIFIERS.HIGH_RELEVANT_STAT_THRESHOLD) {
    namedLines.push({
      labelKey: 'dice.modifier.highStat',
      labelParams: { stat: nlStatId },
      value: BALANCE.CONTEXT_MODIFIERS.HIGH_RELEVANT_STAT_BONUS,
      category: 'bonus',
    });
  }

  // 9. Creativity
  if (creativityMod !== 0) {
    namedLines.push({
      labelKey: 'dice.modifier.creative',
      value: creativityMod,
      category: 'bonus',
    });
  }

  // NOTE: Ship Memory injected AFTER calculateDifficulty() in processTurn.ts
  // NOTE: Failsafe is NEVER shown in the UI
```

**Step 4: Update the return statement**

Replace `return { base, verbMod, ... details };` with:

```typescript
  return {
    base, verbMod, compatibilityPenalty, contextMods, creativityMod,
    difficultyPresetMod, total, details,
    namedLines,
  };
```

**Step 5: Verify**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/engine/difficulty.ts
git commit -m "feat(engine): build namedLines in calculateDifficulty for dice UI"
```

---

## Task 8: Inject Ship Memory into namedLines in processTurn.ts

**Files:**
- Modify: `src/engine/processTurn.ts`

**Step 1: Find shipMemoryMod calculation**

Search for `const shipMemoryMod = getMarkDCModifier(` in `processTurn.ts` (around line 765).

**Step 2: Add namedLines injection after shipMemoryMod is computed**

After `const totalDC = breakdown.total + shipMemoryMod + failsafeMod;` (or wherever `shipMemoryMod` is used), add:

```typescript
    // Inject Ship Memory into namedLines (not done in calculateDifficulty since it needs targetId)
    if (shipMemoryMod !== 0) {
      breakdown = {
        ...breakdown,
        namedLines: [
          ...breakdown.namedLines,
          {
            labelKey: 'dice.modifier.shipMemory' as StringKey,
            value: shipMemoryMod,
            category: 'bonus' as const,
          },
        ],
      };
    }
```

Note: The `breakdown` variable must be declared with `let` not `const` for this to work (or check how it's declared). If it's `const`, use a new variable `const finalBreakdown = { ...breakdown, namedLines: [...] }` and use that going forward.

**Step 3: Add StringKey import if needed**

`StringKey` must be imported from `@i18n/types` in `processTurn.ts` if not already imported.

**Step 4: Verify**

Run: `npm test`
Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/engine/processTurn.ts
git commit -m "feat(engine): inject ship memory modifier into namedLines"
```

---

## Task 9: Write unit tests for namedLines

**Files:**
- Modify: `tests/unit/engine/difficulty.test.ts`

**Step 1: Find existing test structure**

Open `difficulty.test.ts` and understand the existing `DifficultyInput` factory pattern used.

**Step 2: Add the following tests**

Add a `describe('namedLines')` block with these tests. Use `VERB_REGISTRY` to check verb nameKey values. The test file should already import from `@engine/difficulty`, `@engine/types`, `@engine/constants`.

```typescript
describe('namedLines', () => {
  const baseInput = (): DifficultyInput => ({
    verb: 'HACK',
    target: null,
    tool: null,
    playerStats: { FOR: 2, DEF: 2, AGI: 2, INT: 2, PER: 2, CHA: 2, LCK: 2 },
    difficultyLevel: 'survivor',
    creative: false,
    environmentConditions: [],
    playerConditions: [],
  });

  it('TEST 1: terrified increases DC by TERRIFIED_PLAYER', () => {
    const without = calculateDifficulty(baseInput());
    const with_ = calculateDifficulty({ ...baseInput(), playerConditions: ['terrified'] });
    expect(with_.total).toBeGreaterThan(without.total);
    expect(with_.total - without.total).toBe(BALANCE.CONTEXT_MODIFIERS.TERRIFIED_PLAYER);
  });

  it('TEST 2: terrified appears in namedLines', () => {
    const result = calculateDifficulty({ ...baseInput(), playerConditions: ['terrified'] });
    const line = result.namedLines.find(l => l.labelKey === 'dice.modifier.terrified');
    expect(line).toBeDefined();
    expect(line!.value).toBe(BALANCE.CONTEXT_MODIFIERS.TERRIFIED_PLAYER);
    expect(line!.category).toBe('penalty');
  });

  it('TEST 3: namedLines contains only non-zero value lines', () => {
    const result = calculateDifficulty(baseInput());
    for (const line of result.namedLines) {
      expect(line.value).not.toBe(0);
    }
  });

  it('TEST 4: first namedLine is the base verb line', () => {
    const result = calculateDifficulty(baseInput());
    expect(result.namedLines[0]?.labelKey).toBe(VERB_REGISTRY['HACK'].nameKey);
    expect(result.namedLines[0]?.category).toBe('base');
  });

  it('TEST 5: tool adapted → bonus line', () => {
    // SHOOT with a ranged weapon tool (needs a tool with 'ranged' property)
    // Adjust verb/tool combo to what the codebase supports
    const result = calculateDifficulty({
      ...baseInput(),
      verb: 'SHOOT',
      tool: { id: 'gun', nameKey: 'item.gun', properties: ['ranged' as PropertyId], isVirtual: false, source: 'inventory' },
    });
    const line = result.namedLines.find(l => l.labelKey === 'dice.modifier.toolAdapted');
    expect(line).toBeDefined();
    expect(line!.category).toBe('bonus');
    expect(line!.value).toBeLessThan(0);
  });

  it('TEST 6: no tool when needed → penalty line', () => {
    const result = calculateDifficulty({ ...baseInput(), verb: 'SHOOT', tool: null });
    const line = result.namedLines.find(l => l.labelKey === 'dice.modifier.noTool' || l.labelKey === 'dice.modifier.toolWrong');
    expect(line).toBeDefined();
    expect(line!.category).toBe('penalty');
  });

  it('TEST 7: darkness → penalty line', () => {
    const result = calculateDifficulty({ ...baseInput(), environmentConditions: ['dark'] });
    const line = result.namedLines.find(l => l.labelKey === 'dice.modifier.dark');
    expect(line).toBeDefined();
    expect(line!.value).toBe(BALANCE.CONTEXT_MODIFIERS.IN_DARKNESS);
  });

  it('TEST 8: high INT stat → bonus line with labelParams', () => {
    const result = calculateDifficulty({
      ...baseInput(),
      verb: 'HACK',
      playerStats: { FOR: 2, DEF: 2, AGI: 2, INT: 5, PER: 2, CHA: 2, LCK: 2 },
    });
    const line = result.namedLines.find(l => l.labelKey === 'dice.modifier.highStat');
    expect(line).toBeDefined();
    expect(line!.labelParams).toEqual({ stat: 'INT' });
    expect(line!.category).toBe('bonus');
  });

  it('TEST 9: creativity → bonus line', () => {
    const suggestions: ParsedAction[] = [
      { verb: 'SHOOT', target: null, tool: null, verbMatch: { verb: 'SHOOT', strategy: 1, confidence: 1, isCompound: false }, creative: false },
    ];
    const result = calculateDifficulty({ ...baseInput(), verb: 'HACK', creative: true, suggestions });
    const line = result.namedLines.find(l => l.labelKey === 'dice.modifier.creative');
    // Only present if creativityMod !== 0
    if (result.namedLines.some(l => l.labelKey === 'dice.modifier.creative')) {
      expect(line!.category).toBe('bonus');
    }
  });

  it('TEST 10: auto verb → namedLines is empty', () => {
    // TAKE is an auto verb (DC 0)
    const result = calculateDifficulty({ ...baseInput(), verb: 'TAKE' });
    expect(result.namedLines).toHaveLength(0);
  });
});
```

**Step 3: Run tests to verify they pass**

Run: `npm test`
Expected: All new tests pass. If any fail, debug the namedLines construction logic.

**Step 4: Commit**

```bash
git add tests/unit/engine/difficulty.test.ts
git commit -m "test(engine): add namedLines unit tests for difficulty calculator"
```

---

## Task 10: Create useHaptic hook

**Files:**
- Create: `src/ui/hooks/useHaptic.ts`

**Step 1: Create the file**

```typescript
// ---------------------------------------------------------------------------
// src/ui/hooks/useHaptic.ts — Haptic feedback via navigator.vibrate()
// Silently does nothing on desktop or unsupported browsers.
// ---------------------------------------------------------------------------

/**
 * Trigger haptic vibration. Silent if not supported.
 * @param durationMs — Vibration duration in milliseconds
 */
export function haptic(durationMs: number): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(durationMs);
    }
  } catch {
    // Haptic is never critical — swallow any errors
  }
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles.

**Step 3: Commit**

```bash
git add src/ui/hooks/useHaptic.ts
git commit -m "feat(ui): add haptic feedback utility"
```

---

## Task 11: Update Zustand store

**Files:**
- Modify: `src/stores/gameStore.ts`

**Step 1: Add new fields to GameStore interface**

Find `isDiceAnimating: boolean;` in the `GameStore` interface. Add two new fields right after it:

```typescript
  isDiceAnimating: boolean;
  pendingDiceResult: DiceResult | null;
  pendingDifficultyBreakdown: DifficultyBreakdown | null;  // NEW
  hasSeenFullAnimation: boolean;                            // NEW
```

**Step 2: Update the `onDiceAnimationComplete` signature**

The existing action signature is fine. But we need to:
1. Set `hasSeenFullAnimation: true` in `onDiceAnimationComplete`
2. Reset `hasSeenFullAnimation: false` on `startNewGame()` and `restart()`

**Step 3: Add `DifficultyBreakdown` import**

In the imports section, `DifficultyBreakdown` needs to come from `@engine/types`. It's likely already imported. If not, add it.

**Step 4: Initialize the new fields**

In the store object literal (where `isDiceAnimating: false` is), add:

```typescript
  isDiceAnimating: false,
  pendingDiceResult: null,
  pendingDifficultyBreakdown: null,  // NEW
  hasSeenFullAnimation: false,        // NEW
```

**Step 5: Update submitAction to pass difficultyBreakdown**

In `submitAction`, find the `if (hasDice)` block that calls `set(...)`. Add `pendingDifficultyBreakdown`:

```typescript
      if (hasDice) {
        set({
          isDiceAnimating: true,
          pendingDiceResult: result.diceRoll,
          pendingDifficultyBreakdown: result.trace.difficultyBreakdown,  // ← NEW
          pendingNarrative: narrative,
          pendingTurnEntry: entry,
          // ... rest unchanged
        });
      }
```

**Step 6: Update onDiceAnimationComplete**

Add `hasSeenFullAnimation: true` and clear `pendingDifficultyBreakdown`:

```typescript
  onDiceAnimationComplete: () => {
    const { pendingNarrative, pendingTurnEntry, turnHistory, gameState } = get();
    const gameOver = isGameOver(gameState);
    set({
      isDiceAnimating: false,
      pendingDiceResult: null,
      pendingDifficultyBreakdown: null,  // ← NEW
      hasSeenFullAnimation: true,         // ← NEW
      turnHistory: pendingTurnEntry ? [...turnHistory, pendingTurnEntry] : turnHistory,
      // ... rest unchanged
    });
  },
```

**Step 7: Reset hasSeenFullAnimation on startNewGame and restart**

In `startNewGame()` set block, add:
```typescript
  hasSeenFullAnimation: false,
```

In `restart()` set block, add:
```typescript
  pendingDifficultyBreakdown: null,
  hasSeenFullAnimation: false,
```

**Step 8: Verify**

Run: `npm run build`
Expected: Compiles without errors.

**Step 9: Commit**

```bash
git add src/stores/gameStore.ts
git commit -m "feat(store): add pendingDifficultyBreakdown and hasSeenFullAnimation"
```

---

## Task 12: Rewrite useDiceAnimation hook

**Files:**
- Modify: `src/ui/hooks/useDiceAnimation.ts`

**Step 1: Full rewrite**

Replace the entire file content with:

```typescript
// ---------------------------------------------------------------------------
// src/ui/hooks/useDiceAnimation.ts — 4-act dice choreography hook
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from 'react';
import { haptic } from './useHaptic';
import type { DiceResult, DifficultyBreakdown } from '@engine/types';

export type DicePhase =
  | 'idle'
  | 'dc_lines'    // Act 1: DC modifier lines appear one by one
  | 'dc_total'    // Act 2: DC total with impact
  | 'rolling'     // Act 3: die spinning with slowdown
  | 'roll_lines'  // Act 4: bonus lines appear one by one
  | 'result';     // Final result

interface UseDiceAnimationOptions {
  readonly diceResult: DiceResult | null;
  readonly difficultyBreakdown: DifficultyBreakdown | null;
  readonly canSkip: boolean;
  readonly onComplete: () => void;
}

interface UseDiceAnimationReturn {
  readonly phase: DicePhase;
  readonly visibleDcLines: number;
  readonly showDcTotal: boolean;
  readonly displayedDieNumber: number;
  readonly visibleRollLines: number;
  readonly showResult: boolean;
  readonly handleSkipTap: () => void;
}

const TIMING = {
  LINE_DELAY: 150,
  PAUSE_AFTER_DC_LINES: 300,
  DC_TOTAL_HOLD: 600,
  ROLL_DURATION: 2000,
  PAUSE_AFTER_ROLL_LINES: 200,
  RESULT_DELAY: 300,
  RESULT_HOLD: 1500,
  CRIT_HOLD: 2000,
} as const;

export function useDiceAnimation({
  diceResult,
  difficultyBreakdown,
  canSkip,
  onComplete,
}: UseDiceAnimationOptions): UseDiceAnimationReturn {
  const [phase, setPhase] = useState<DicePhase>('idle');
  const [visibleDcLines, setVisibleDcLines] = useState(0);
  const [showDcTotal, setShowDcTotal] = useState(false);
  const [displayedDieNumber, setDisplayedDieNumber] = useState(1);
  const [visibleRollLines, setVisibleRollLines] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  // Filtered DC lines (only non-zero values)
  const filteredDcLines = difficultyBreakdown?.namedLines.filter(l => l.value !== 0) ?? [];

  // Roll bonus lines: stat value + luck (if non-zero)
  const rollLines = diceResult
    ? [
        { statValue: diceResult.statValue },
        ...(diceResult.luckBonus > 0 ? [{ luckBonus: diceResult.luckBonus }] : []),
      ]
    : [];
  const rollLineCount = rollLines.length;

  const completeAnimation = useCallback(() => {
    cleanup();
    timerRef.current = setTimeout(() => {
      onCompleteRef.current();
    }, 0);
  }, [cleanup]);

  const handleSkipTap = useCallback(() => {
    if (!canSkip || phase === 'idle' || phase === 'result') return;

    cleanup();
    setVisibleDcLines(filteredDcLines.length);
    setShowDcTotal(true);
    setDisplayedDieNumber(diceResult?.natural ?? 1);
    setVisibleRollLines(rollLineCount);
    setShowResult(true);
    setPhase('result');

    timerRef.current = setTimeout(() => {
      onCompleteRef.current();
    }, 800);
  }, [canSkip, phase, cleanup, diceResult, filteredDcLines.length, rollLineCount]);

  useEffect(() => {
    if (!diceResult || !difficultyBreakdown) return;

    // Reset state
    setPhase('idle');
    setVisibleDcLines(0);
    setShowDcTotal(false);
    setDisplayedDieNumber(1);
    setVisibleRollLines(0);
    setShowResult(false);

    let cancelled = false;

    const delay = (ms: number) => new Promise<void>(resolve => {
      timerRef.current = setTimeout(() => { if (!cancelled) resolve(); }, ms);
    });

    async function run() {
      if (!diceResult || !difficultyBreakdown) return;

      const dcLines = difficultyBreakdown.namedLines.filter(l => l.value !== 0);

      // === ACT 1: DC lines ===
      setPhase('dc_lines');
      for (let i = 0; i < dcLines.length; i++) {
        await delay(TIMING.LINE_DELAY);
        if (cancelled) return;
        setVisibleDcLines(i + 1);
        haptic(10);
      }
      await delay(TIMING.PAUSE_AFTER_DC_LINES);
      if (cancelled) return;

      // === ACT 2: DC total ===
      setPhase('dc_total');
      setShowDcTotal(true);
      haptic(50);
      await delay(TIMING.DC_TOTAL_HOLD);
      if (cancelled) return;

      // === ACT 3: Rolling ===
      setPhase('rolling');
      const rollStart = Date.now();

      await new Promise<void>(resolve => {
        function tick() {
          if (cancelled) { resolve(); return; }
          const elapsed = Date.now() - rollStart;
          if (elapsed >= TIMING.ROLL_DURATION) {
            setDisplayedDieNumber(diceResult.natural);
            haptic(30);
            resolve();
            return;
          }
          const remaining = TIMING.ROLL_DURATION - elapsed;
          if (remaining > 200) {
            setDisplayedDieNumber(Math.floor(Math.random() * 20) + 1);
            haptic(5);
          } else {
            setDisplayedDieNumber(diceResult.natural);
          }
          const nextDelay =
            elapsed < 800  ? 50
            : elapsed < 1400 ? 100
            : 200;
          timerRef.current = setTimeout(tick, nextDelay);
        }
        tick();
      });

      if (cancelled) return;

      // NAT 20 or NAT 1 — skip Act 4
      if (diceResult.natural === 20 || diceResult.natural === 1) {
        haptic(80);
        setShowResult(true);
        setPhase('result');
        await delay(TIMING.CRIT_HOLD);
        if (cancelled) return;
        onCompleteRef.current();
        return;
      }

      // === ACT 4: Roll bonus lines ===
      setPhase('roll_lines');
      const bonusLineCount = diceResult.luckBonus > 0 ? 2 : 1;
      for (let i = 0; i < bonusLineCount; i++) {
        await delay(TIMING.LINE_DELAY);
        if (cancelled) return;
        setVisibleRollLines(i + 1);
        haptic(10);
      }
      await delay(TIMING.PAUSE_AFTER_ROLL_LINES);
      if (cancelled) return;
      await delay(TIMING.RESULT_DELAY);
      if (cancelled) return;

      // === RESULT ===
      setPhase('result');
      setShowResult(true);
      haptic(80);
      await delay(TIMING.RESULT_HOLD);
      if (cancelled) return;
      onCompleteRef.current();
    }

    void run();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [diceResult, difficultyBreakdown, cleanup]);

  return {
    phase,
    visibleDcLines,
    showDcTotal,
    displayedDieNumber,
    visibleRollLines,
    showResult,
    handleSkipTap,
  };
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles.

**Step 3: Commit**

```bash
git add src/ui/hooks/useDiceAnimation.ts
git commit -m "feat(ui): rewrite useDiceAnimation with 4-act choreography"
```

---

## Task 13: Rewrite DiceAnimation component

**Files:**
- Modify: `src/ui/components/DiceAnimation.tsx`

**Step 1: Full rewrite**

Replace entire file with:

```tsx
// ---------------------------------------------------------------------------
// src/ui/components/DiceAnimation.tsx — 4-act cinematic dice roll sequence
// ---------------------------------------------------------------------------

import { useDiceAnimation } from '../hooks/useDiceAnimation';
import { GlitchEffect } from './GlitchEffect';
import { t } from '@i18n/index';
import type { DiceResult, DifficultyBreakdown, DifficultyLine } from '@engine/types';
import type { StringKey } from '@i18n/types';

interface DiceAnimationProps {
  readonly diceResult: DiceResult;
  readonly difficultyBreakdown: DifficultyBreakdown;
  readonly canSkip: boolean;
  readonly onComplete: () => void;
}

/** Single modifier line (DC side or bonus side) */
function DcLine({ line, isNew }: { line: DifficultyLine; isNew: boolean }) {
  const label = line.labelParams
    ? t(line.labelKey, line.labelParams)
    : t(line.labelKey);
  const sign = line.value > 0 ? '+' : '';
  const colorClass =
    line.category === 'penalty' ? 'dc-line--penalty'
    : line.category === 'bonus'  ? 'dc-line--bonus'
    : 'dc-line--base';

  return (
    <div className={`dc-line ${colorClass} ${isNew ? 'animate-impact-small' : ''}`}>
      <span className="dc-label">{label}</span>
      <span className="dc-value">{sign}{line.value}</span>
    </div>
  );
}

export function DiceAnimation({
  diceResult, difficultyBreakdown, canSkip, onComplete,
}: DiceAnimationProps): JSX.Element {
  const {
    phase, visibleDcLines, showDcTotal, displayedDieNumber,
    visibleRollLines, showResult, handleSkipTap,
  } = useDiceAnimation({ diceResult, difficultyBreakdown, canSkip, onComplete });

  // DC lines (filter zero-value lines)
  const dcLines = difficultyBreakdown.namedLines.filter(l => l.value !== 0);

  // Roll bonus lines: stat + luck
  const rollLines: DifficultyLine[] = [];
  rollLines.push({
    labelKey: ('stat.' + diceResult.stat) as StringKey,
    value: diceResult.statValue,
    category: 'bonus',
  });
  if (diceResult.luckBonus > 0) {
    rollLines.push({
      labelKey: 'dice.roll.luck',
      value: diceResult.luckBonus,
      category: 'bonus',
    });
  }

  const effectiveDC = diceResult.difficulty;
  const displayTotal = diceResult.total > 20 ? '≥ 20' : String(diceResult.total);

  const isCrit = diceResult.critical;
  const isFumble = diceResult.fumble;
  const isSuccess = diceResult.success;

  let resultKey: StringKey;
  let resultColorClass: string;
  let flashClass = '';

  if (isCrit) {
    resultKey = 'dice.result.critSuccess';
    resultColorClass = 'dice-result--crit';
    flashClass = 'animate-flash-crit';
  } else if (isFumble) {
    resultKey = 'dice.result.critFailure';
    resultColorClass = 'dice-result--fumble';
    flashClass = 'animate-flash-failure';
  } else if (isSuccess) {
    resultKey = 'dice.result.success';
    resultColorClass = 'dice-result--success';
    flashClass = 'animate-flash-success';
  } else {
    resultKey = 'dice.result.failure';
    resultColorClass = 'dice-result--failure';
    flashClass = 'animate-flash-failure';
  }

  const isRolling = phase === 'rolling' || phase === 'roll_lines' || phase === 'result';
  const showBonusLines = (phase === 'roll_lines' || phase === 'result') && !isCrit && !isFumble;

  return (
    <GlitchEffect active={isFumble && showResult} duration={500}>
      <div
        className={`dice-overlay ${showResult ? flashClass : ''}`}
        onClick={handleSkipTap}
        role="button"
        tabIndex={0}
        aria-label="Skip dice animation"
      >
        {/* === ACT 1+2: DC Section === */}
        <div className="dice-section dice-section--dc">
          {dcLines.slice(0, visibleDcLines).map((line, i) => (
            <DcLine key={i} line={line} isNew={i === visibleDcLines - 1} />
          ))}

          {showDcTotal && (
            <>
              <hr className="dc-separator" />
              <div className="dc-line dc-total animate-impact-large">
                <span>{t('dice.dc.toBeat')}</span>
                <span>{effectiveDC}</span>
              </div>
            </>
          )}
        </div>

        {/* === ACT 3: Die === */}
        {isRolling && (
          <div className="dice-section dice-section--roll">
            <div className="dc-reminder">DC: {effectiveDC}</div>
            <div className={`dice-number ${showResult ? resultColorClass : ''} ${isCrit && showResult ? 'animate-dice-pulse' : ''} ${isFumble && showResult ? 'animate-glitch-rgb' : ''}`}>
              🎲 {displayedDieNumber}
            </div>
          </div>
        )}

        {/* === ACT 4: Roll bonus lines === */}
        {showBonusLines && (
          <div className="dice-section dice-section--bonuses">
            {rollLines.slice(0, visibleRollLines).map((line, i) => (
              <DcLine key={i} line={line} isNew={i === visibleRollLines - 1} />
            ))}
            {visibleRollLines >= rollLines.length && (
              <>
                <hr className="dc-separator" />
                <div className="dc-line dc-total">
                  <span>{t('dice.roll.total')}</span>
                  <span>{displayTotal}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* === RESULT === */}
        {showResult && (
          <div className={`dice-result ${resultColorClass} ${isCrit ? 'animate-shake' : ''}`}>
            {t(resultKey)}
            {!isCrit && !isFumble && (
              <span className="dice-result-margin">
                ({isSuccess ? '+' : ''}{diceResult.total - effectiveDC})
              </span>
            )}
          </div>
        )}
      </div>
    </GlitchEffect>
  );
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles. Check that `t()` usage compiles — if `t()` doesn't accept a second params argument, check the i18n `index.ts` signature.

**Step 3: Commit**

```bash
git add src/ui/components/DiceAnimation.tsx
git commit -m "feat(ui): rewrite DiceAnimation with 4-act choreography"
```

---

## Task 14: Add CSS animations and dice overlay styles

**Files:**
- Modify: `src/ui/styles/animations.css`

**Step 1: Append to the animations file**

Add the following at the end of `animations.css`:

```css
/* === DICE CHOREOGRAPHY ANIMATIONS === */

/* Impact small — each DC/bonus line appearing */
@keyframes impact-small {
  0%   { transform: scale(1.06); opacity: 0.7; }
  100% { transform: scale(1);    opacity: 1; }
}
.animate-impact-small {
  animation: impact-small 120ms ease-out;
}

/* Impact large — DC total + result */
@keyframes impact-large {
  0%   { transform: scale(1.15); opacity: 0.5; }
  50%  { transform: scale(1.02); }
  100% { transform: scale(1);    opacity: 1; }
}
.animate-impact-large {
  animation: impact-large 300ms ease-out;
}

/* Flash crit (gold) */
@keyframes flash-crit {
  0%   { box-shadow: inset 0 0 0 3px var(--crit-gold); }
  50%  { box-shadow: inset 0 0 60px 10px var(--crit-gold); }
  100% { box-shadow: inset 0 0 0 0 transparent; }
}
.animate-flash-crit {
  animation: flash-crit 600ms ease-out;
}

/* Flash success (green) */
@keyframes flash-success {
  0%   { box-shadow: inset 0 0 0 3px var(--success); }
  50%  { box-shadow: inset 0 0 40px 8px var(--success); }
  100% { box-shadow: inset 0 0 0 0 transparent; }
}
.animate-flash-success {
  animation: flash-success 500ms ease-out;
}

/* Flash failure (red) */
@keyframes flash-failure {
  0%   { box-shadow: inset 0 0 0 3px var(--danger); }
  50%  { box-shadow: inset 0 0 40px 8px var(--danger); }
  100% { box-shadow: inset 0 0 0 0 transparent; }
}
.animate-flash-failure {
  animation: flash-failure 500ms ease-out;
}

/* === DICE OVERLAY LAYOUT === */

.dice-overlay {
  position: absolute;
  inset: 0;
  top: 48px; /* below StatusBar */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(5, 5, 5, 0.94);
  z-index: 100;
  font-family: var(--font-mono);
  padding: 24px 20px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  cursor: pointer;
}

.dice-section {
  width: 100%;
  max-width: 320px;
}

.dc-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  padding: 2px 0;
  letter-spacing: 0.05em;
}

.dc-line--base {
  font-size: 15px;
  color: var(--amber-glow);
  font-weight: bold;
  margin-bottom: 4px;
}

.dc-line--penalty .dc-value { color: var(--danger); }
.dc-line--bonus   .dc-value { color: var(--success); }

.dc-total {
  font-size: 20px;
  font-weight: bold;
  color: var(--amber-glow);
  text-shadow: 0 0 12px var(--amber-glow);
  letter-spacing: 0.1em;
}

.dc-separator {
  border: none;
  border-top: 1px solid var(--text-system);
  margin: 6px 0;
  opacity: 0.4;
}

.dc-reminder {
  font-size: 12px;
  color: var(--text-system);
  opacity: 0.5;
  text-align: center;
  margin-bottom: 8px;
}

.dice-number {
  font-size: 48px;
  font-family: var(--font-display);
  color: var(--amber-glow);
  text-align: center;
  text-shadow: 0 0 20px var(--amber-glow);
  margin: 12px 0;
}

.dice-result {
  font-size: 24px;
  font-family: var(--font-display);
  text-align: center;
  letter-spacing: 0.15em;
  margin-top: 12px;
}

.dice-result--success { color: var(--success); text-shadow: 0 0 10px var(--success); }
.dice-result--failure { color: var(--danger);  text-shadow: 0 0 10px var(--danger); }
.dice-result--crit    { color: var(--crit-gold); text-shadow: 0 0 20px var(--crit-gold); }
.dice-result--fumble  { color: var(--danger);  text-shadow: 0 0 20px var(--danger); }

.dice-result-margin {
  font-size: 14px;
  opacity: 0.6;
  margin-left: 8px;
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Compiles (CSS files don't generate TS errors).

**Step 3: Commit**

```bash
git add src/ui/styles/animations.css
git commit -m "feat(ui): add dice choreography CSS animations and overlay styles"
```

---

## Task 15: Wire up GameScreen integration

**Files:**
- Modify: `src/ui/screens/GameScreen.tsx`
- Modify: `src/ui/hooks/useGame.ts` (if it exposes store selectors)

**Step 1: Check what GameScreen currently reads from store**

Search `GameScreen.tsx` for the `useGame` or `useGameStore` selector. It currently selects `isDiceAnimating`, `pendingDiceResult`, `onDiceAnimationComplete`.

**Step 2: Add new selectors**

Wherever the store is selected in `GameScreen.tsx` (or the intermediate `useGame` hook), add:
```typescript
pendingDifficultyBreakdown: s.pendingDifficultyBreakdown,
hasSeenFullAnimation: s.hasSeenFullAnimation,
```

**Step 3: Update the DiceAnimation render condition**

Find:
```tsx
{isDiceAnimating && pendingDiceResult && (
  <DiceAnimation
    diceResult={pendingDiceResult}
    onComplete={onDiceAnimationComplete}
  />
)}
```

Replace with:
```tsx
{isDiceAnimating && pendingDiceResult && pendingDifficultyBreakdown && (
  <DiceAnimation
    diceResult={pendingDiceResult}
    difficultyBreakdown={pendingDifficultyBreakdown}
    canSkip={hasSeenFullAnimation}
    onComplete={onDiceAnimationComplete}
  />
)}
```

**Step 4: Also update useGame.ts selectors if needed**

If `useGame.ts` has a selector hook that forwards specific fields, add `pendingDifficultyBreakdown` and `hasSeenFullAnimation` there.

**Step 5: Verify**

Run: `npm run build`
Expected: Compiles with zero errors.

**Step 6: Final test gate**

Run: `npm run check`
Expected: All pass (typecheck + lint + unit + stress + integration tests).

**Step 7: Commit**

```bash
git add src/ui/screens/GameScreen.tsx src/ui/hooks/useGame.ts
git commit -m "feat(ui): wire dice choreography into GameScreen"
```

---

## Manual Test Checklist (§15.4 from spec)

After all tasks complete, test in browser with `npm run dev`:

```
□ 1 DC modifier → 1 line appears, then DC total
□ 6+ DC modifiers → scroll works on narrow viewport
□ NAT 20 → gold flash immediately, no Act 4, text "CRITIQUE !"
□ NAT 1 → glitch effect, no Act 4, text "FUMBLE !"
□ Tight success (total = DC) → "SUCCÈS (+0)"
□ Near miss (total = DC-1) → "ÉCHEC (-1)"
□ failsafe active (total > 20) → displays "≥ 20" not real total
□ luckBonus = 0 → no "Chance" line in Act 4
□ Skip tap works AFTER first full animation
□ Skip tap does NOT work on first animation of session
□ Animation does not block StatusBar (HP/O2 visible)
□ Input disabled during animation
□ After animation, typewriter starts
```

---

## Summary of Execution Order

| # | Task | Key Files | Gate |
|---|------|-----------|------|
| 1 | StringKeys | `src/i18n/types.ts` | `npm run build` |
| 2 | FR translations | `src/i18n/locales/fr.ts` | `npm run build` |
| 3 | EN translations | `src/i18n/locales/en.ts` | `npm run build` |
| 4 | TERRIFIED_PLAYER constant | `src/engine/constants.ts` | `npm run build` |
| 5 | DifficultyLine + namedLines type | `src/engine/types.ts` + patch sites | `npm run build` |
| 6 | terrified → DC | `src/engine/difficulty.ts` + `processTurn.ts` | `npm test` |
| 7 | namedLines construction | `src/engine/difficulty.ts` | `npm test` |
| 8 | Ship memory injection | `src/engine/processTurn.ts` | `npm test` |
| 9 | namedLines unit tests | `tests/unit/engine/difficulty.test.ts` | `npm test` |
| 10 | useHaptic | `src/ui/hooks/useHaptic.ts` | `npm run build` |
| 11 | Store updates | `src/stores/gameStore.ts` | `npm run build` |
| 12 | useDiceAnimation rewrite | `src/ui/hooks/useDiceAnimation.ts` | `npm run build` |
| 13 | DiceAnimation rewrite | `src/ui/components/DiceAnimation.tsx` | `npm run build` |
| 14 | CSS animations | `src/ui/styles/animations.css` | `npm run build` |
| 15 | GameScreen integration | `src/ui/screens/GameScreen.tsx` | `npm run check` |
