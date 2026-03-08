# Skeleton Themes (Settings Cleanup) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Each skeleton IS its theme — remove the independent `SettingDefinition` system and embed theme data directly into skeletons.

**Architecture:** The `SettingDefinition` type and `settings.ts` file are removed. Each `CoreSkeleton` gains a `theme: SkeletonTheme` field containing location names, supported roles, features, and preferred items. The `ModuleCompatibility` type drops `categories`/`settingIds` in favor of `skeletons: string[]`. All functions that took a `setting` parameter now derive theme from `skeleton.theme`.

**Tech Stack:** TypeScript 5, Vitest, pure engine functions

---

### Task 1: Modify types in `src/engine/scenario.ts`

**Files:**
- Modify: `src/engine/scenario.ts`

**Step 1: Add `SkeletonTheme` interface and modify types**

After the `CoreSkeleton` interface definition (line 171), add:

```typescript
/** Theme data embedded in a skeleton (replaces SettingDefinition) */
export interface SkeletonTheme {
  readonly id: string;
  readonly nameKey: LocaleString;
  readonly supportedRoles: readonly string[];
  readonly locationNames: Readonly<Record<string, readonly LocaleString[]>>;
  readonly features: readonly string[];
  readonly preferredItems: readonly string[];
}
```

Add `theme: SkeletonTheme` to `CoreSkeleton`:
```typescript
// After additionalDefeatConditions in CoreSkeleton:
readonly theme: SkeletonTheme;
```

Change `ModuleCompatibility` (lines 220-227) from:
```typescript
export interface ModuleCompatibility {
  readonly universal?: true;
  readonly categories?: readonly SettingCategory[];
  readonly settingIds?: readonly string[];
}
```
to:
```typescript
export interface ModuleCompatibility {
  readonly universal?: true;
  readonly skeletons?: readonly string[];
}
```

Remove `setting` from `AssembledScenario` (line 423).

Change `BlackBoxEntry.settingId` → `themeId` (line 531).
Change `GameHistory.settingId` → `themeId` (line 547).
Change `GameHistory.settingName` → `themeName` (line 548).

Delete `SettingCategory` type (line 334).
Delete `SettingDefinition` interface (lines 337-349).

Remove `SettingDefinition` from the re-export in `src/engine/index.ts` (line 164) and add `SkeletonTheme`.

**Step 2: Run typecheck to see cascade of errors**

Run: `npm run typecheck 2>&1 | head -80`
Expected: Many errors pointing to all files that need updating.

**Step 3: Commit**

```
feat(scenario): replace SettingDefinition with SkeletonTheme on CoreSkeleton
```

---

### Task 2: Migrate theme data into skeletons

**Files:**
- Modify: `src/content/scenarios/escape.ts`
- Modify: `src/content/scenarios/investigate.ts`
- Modify: `src/content/scenarios/rescue.ts`

**Step 1: Add theme data to each skeleton**

Copy the location name pools from `src/content/settings.ts` into each skeleton file.

For ESCAPE skeleton (`escape.ts`), add to the skeleton object:
```typescript
theme: {
  id: 'derelict_ship',
  nameKey: { fr: 'Épave Stellaire', en: 'Derelict Ship' },
  supportedRoles: ['passage', 'control_room', 'storage', 'medical', 'quarters', 'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock'],
  locationNames: { /* copy from DERELICT_SHIP in settings.ts */ },
  features: ['airlock', 'viewport', 'hull_panel', 'life_support', 'cryopod', 'emergency_locker', 'status_terminal'],
  preferredItems: ['EVA_suit', 'plasma_cutter', 'access_keycard', 'welding_torch', 'emergency_flashlight', 'medkit_basic'],
},
```

Same for INVESTIGATE → `space_station` data, RESCUE → `alien_ruins` data.

Add a `ls()` helper to each skeleton file:
```typescript
function ls(fr: string): { fr: string; en: string } { return { fr, en: '' }; }
```

**Step 2: Import SkeletonTheme if needed**

The skeleton files already import `CoreSkeleton` from `@engine/scenario`. The `SkeletonTheme` is embedded in `CoreSkeleton` so no extra import needed.

**Step 3: Commit**

```
feat(scenarios): embed theme data in each skeleton
```

---

### Task 3: Update `pacing.ts` — remove setting parameter

**Files:**
- Modify: `src/engine/pacing.ts`

**Step 1: Update all function signatures**

1. Remove `SettingDefinition` from imports (line 13).
2. `isModuleCompatible(module, setting)` → `isModuleCompatible(module, skeleton: CoreSkeleton)`:
   - Replace category/settingIds logic with: `if (!compat.universal) { if (!compat.skeletons?.includes(skeleton.id)) return false; }`
   - Replace `setting.supportedRoles` with `skeleton.theme.supportedRoles`
3. `resolveLocationName(role, setting, rng, usedNames)` → `resolveLocationName(role, skeleton: CoreSkeleton, rng, usedNames)`:
   - Replace `setting.locationNames[role]` with `skeleton.theme.locationNames[role]`
4. `createNodeFromSkeleton(skeleton, nodeId, setting, rng, usedNames)` → remove `setting` param:
   - Pass `skeleton` to `resolveLocationName` instead of `setting`
5. `createNodeFromModule(loc, pm, moduleIndex, setting, rng, usedNames)` → remove `setting` param, add `skeleton`:
   - Pass `skeleton` to `resolveLocationName`
6. `buildLocationGraph(skeleton, modules, setting, rng)` → `buildLocationGraph(skeleton, modules, rng)`:
   - Remove `setting` param, pass `skeleton` through to all callees
7. `assembleScenario(skeleton, sessionLength, setting, allModules, rng)` → `assembleScenario(skeleton, sessionLength, allModules, rng)`:
   - `isModuleCompatible(m, setting)` → `isModuleCompatible(m, skeleton)`
   - `buildLocationGraph(skeleton, placedWithTension, setting, rng)` → `buildLocationGraph(skeleton, placedWithTension, rng)`
   - Remove `setting` from returned object

**Step 2: Commit**

```
refactor(pacing): remove setting parameter, use skeleton.theme
```

---

### Task 4: Reclassify module compatibility

**Files:**
- Modify: `src/content/scenarios/modules/universal.ts` — no changes needed (already `{ universal: true }`)
- Modify: `src/content/scenarios/modules/category.ts`
- Modify: `src/content/scenarios/modules/complex.ts`
- Modify: `src/content/scenarios/modules/index.ts`

**Step 1: Update category.ts modules**

| Module | Old | New |
|--------|-----|-----|
| `airlock_malfunction_01` | `{ categories: ['space_vessel', 'facility'] }` | `{ skeletons: ['escape', 'investigate'] }` |
| `malfunctioning_android_01` | `{ categories: ['space_vessel', 'facility'] }` | `{ skeletons: ['escape', 'investigate'] }` |
| `alien_mechanism_01` | `{ categories: ['alien'] }` | `{ skeletons: ['rescue'] }` |
| `containment_breach_01` | `{ categories: ['facility'] }` | `{ skeletons: ['investigate'] }` |
| `power_reroute_dilemma_01` | `{ categories: ['space_vessel', 'facility'] }` | `{ universal: true }` |

**Step 2: Update complex.ts modules**

| Module | Old | New |
|--------|-----|-----|
| `patrol_entity_01` | `{ categories: ['space_vessel', 'facility', 'alien'] }` | `{ universal: true }` |
| `flooded_section_01` | `{ categories: ['space_vessel', 'facility'] }` | `{ skeletons: ['escape', 'investigate'] }` |
| `survivor_rescue_01` | `{ categories: ['space_vessel', 'facility'] }` | `{ universal: true }` |
| `terminal_decrypt_01` | `{ categories: ['space_vessel', 'facility'] }` | `{ skeletons: ['investigate'] }` |
| `explosive_decompression_risk_01` | `{ categories: ['space_vessel', 'facility'] }` | `{ skeletons: ['escape', 'investigate'] }` |

Note: `survivor_rescue_01` uses role `quarters` which is in escape+investigate but NOT rescue. So it stays exclusive unless we adapt. Per spec §4.2, it should be universal — we need to check if its `locationRole` field is compatible. Its location role is `quarters` which is not in `alien_ruins.supportedRoles`. Looking at the module more carefully:
- `survivor_rescue_01` uses `role: 'quarters'` — NOT in alien_ruins
- Per spec, it's listed as universal — but the role check would fail for rescue
- Resolution: Mark as universal, the `isModuleCompatible` role check will naturally filter it out for rescue. Actually no — per the new `isModuleCompatible`, role checking is separate from skeleton checking. A universal module with a role not in the theme will be filtered out by the role check. So `survivor_rescue_01` can be `{ universal: true }` and it'll only actually be available for skeletons whose theme supports `quarters`.

Same for `power_reroute_dilemma_01` — its role is `engineering` (line 264 category.ts, need to check). Let me verify: it uses `role: 'engineering'` which is in escape+investigate but not rescue. So `{ universal: true }` works — the role filter handles it.

**Step 3: Rename `category.ts` to `exclusive.ts`**

Per spec §6.1, rename the file. Update `index.ts` imports accordingly.

**Step 4: Update index.ts comments**

Change the comment from `// Category (5)` to `// Exclusive (5)` and reflect that `power_reroute_dilemma_01` is now universal (move it to universal section in ALL_MODULES or just update the comment).

**Step 5: Commit**

```
refactor(modules): reclassify compatibility from categories to skeletons
```

---

### Task 5: Update Black Box system

**Files:**
- Modify: `src/engine/blackbox.ts`

**Step 1: Update field references**

- `generateEntryId`: change parameter name from `settingId` to `themeId`, update format string
- `buildDeathJournal`: change `history.settingName` → `history.themeName`
- `generateBlackBoxJournal`: change `history.settingId` → `history.themeId` in the returned object
- `BLACK_BOX_PLACEMENT_CONFIG.matchBy`: change from `'setting'` to `'theme'`

**Step 2: Commit**

```
refactor(blackbox): settingId → themeId in BlackBoxEntry and GameHistory
```

---

### Task 6: Delete `src/content/settings.ts`

**Files:**
- Delete: `src/content/settings.ts`

**Step 1: Delete the file**

```bash
rm src/content/settings.ts
```

**Step 2: Commit**

```
chore: remove settings.ts (data migrated to skeletons)
```

---

### Task 7: Update all consumers — stores, hooks, scripts

**Files:**
- Modify: `src/stores/gameStore.ts`
- Modify: `src/ui/hooks/useScenarioLoop.ts`
- Modify: `scripts/ai-playtest.ts`
- Modify: `scripts/testModule.ts`
- Modify: `scripts/diagnose.ts`
- Modify: `scripts/diagnose-parser.ts`
- Modify: `scripts/diagnose-winpath.ts`
- Modify: `scripts/build_scenario_poc.ts`
- Modify: `tests/playtest/autoplay.ts`
- Modify: `src/engine/index.ts`

**Step 1: gameStore.ts**

- Remove: `import { LAUNCH_SETTINGS } from '@content/settings';`
- Remove: `const setting = LAUNCH_SETTINGS[...];`
- Change: `assembleScenario(skeleton, 'standard', setting, ALL_MODULES, _rng)` → `assembleScenario(skeleton, 'standard', ALL_MODULES, _rng)`

**Step 2: useScenarioLoop.ts**

Same pattern — remove LAUNCH_SETTINGS import and setting variable, remove setting from assembleScenario call.

**Step 3: Scripts**

For each script:
- Remove `import { LAUNCH_SETTINGS } from '../src/content/settings';`
- Remove `import type { SettingDefinition } from '../src/engine/scenario';`
- Remove `const setting = LAUNCH_SETTINGS[...];`
- Change `assembleScenario(skeleton, ..., setting, ALL_MODULES, rng)` → `assembleScenario(skeleton, ..., ALL_MODULES, rng)`

For `ai-playtest.ts` specifically — it has a `--setting` CLI flag. This should be removed since each skeleton now determines its own theme. Remove the setting CLI option and the setting lookup logic.

**Step 4: engine/index.ts**

Remove `SettingDefinition` from the re-export list. Add `SkeletonTheme`.

**Step 5: Commit**

```
refactor: remove all LAUNCH_SETTINGS references from stores, hooks, scripts
```

---

### Task 8: Update all tests

**Files:**
- Delete: `tests/unit/content/settings.test.ts`
- Modify: `tests/stress/scenarioCombinations.test.ts`
- Modify: `tests/stress/scenarioAssembly.test.ts`
- Modify: `tests/stress/botProfiles.test.ts`
- Modify: `tests/stress/scenarioWalkthrough.test.ts`
- Modify: `tests/unit/engine/pacing.test.ts`
- Modify: `tests/unit/content/scenarios/modules.test.ts`
- Modify: `tests/unit/engine/blackbox.test.ts`
- Modify: `tests/unit/engine/game.test.ts`
- Modify: `tests/integration/scenarioCompletion.test.ts`
- Modify: `tests/integration/emergentVictory.test.ts`
- Modify: `tests/integration/scenarioInteraction.test.ts`
- Modify: `tests/integration/blackBox.test.ts`
- Modify or create: `tests/unit/content/scenarios/skeletons.test.ts`

**Step 1: Delete settings.test.ts**

```bash
rm tests/unit/content/settings.test.ts
```

**Step 2: Update scenarioCombinations.test.ts**

Remove LAUNCH_SETTINGS import. Change 3×3×3 loop to 3×3 loop (skeleton × sessionLength only). Remove `setting` from assembleScenario calls. Remove `scenario.setting.id` assertions.

**Step 3: Update scenarioAssembly.test.ts**

Remove LAUNCH_SETTINGS import. Remove `rngPick(rng, LAUNCH_SETTINGS)` — not needed. Remove `setting` from all assembleScenario calls.

**Step 4: Update pacing.test.ts**

Update `isModuleCompatible` test fixtures: instead of passing a SettingDefinition, pass a CoreSkeleton with a theme. Update compatibility field from `categories` to `skeletons`.

**Step 5: Update modules.test.ts**

Remove LAUNCH_SETTINGS import. Replace `isModuleCompatible(module, setting)` with `isModuleCompatible(module, skeleton)` using skeletons from LAUNCH_SKELETONS.

**Step 6: Update blackbox.test.ts**

Change `settingId` → `themeId`, `settingName` → `themeName` in test fixtures.

**Step 7: Update game.test.ts**

Remove LAUNCH_SETTINGS import. Remove setting from assembleScenario calls.

**Step 8: Update integration tests**

All integration tests that call assembleScenario: remove setting parameter and LAUNCH_SETTINGS import.

**Step 9: Update stress tests (botProfiles, scenarioWalkthrough)**

Remove LAUNCH_SETTINGS import. Remove `rng.pick(LAUNCH_SETTINGS)`. Remove setting from assembleScenario calls.

**Step 10: Update autoplay.ts**

Remove LAUNCH_SETTINGS import. Remove `rng.pick(LAUNCH_SETTINGS)`. Remove setting from assembleScenario call.

**Step 11: Add skeleton theme validation tests**

In `tests/unit/content/scenarios/skeletons.test.ts`, add tests for:
- Each skeleton has a `theme` with valid `id`
- Each theme has 20+ names per supported role
- All location names are non-empty French strings
- Supported roles are non-empty arrays

**Step 12: Commit**

```
test: update all tests for skeleton theme system
```

---

### Task 9: Run full test suite

**Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: 0 errors (may need to fix unused imports)

**Step 3: Run unit tests**

Run: `npm test`
Expected: All pass

**Step 4: Run stress tests**

Run: `npm run test:stress`
Expected: All pass

**Step 5: Run integration tests**

Run: `npm run test:integration`
Expected: All pass

**Step 6: Run full check**

Run: `npm run check`
Expected: 0 failures

**Step 7: Commit if any fixes were needed**

```
fix: address test/lint issues from skeleton theme migration
```

---

### Task 10: AI Playtest verification

**Step 1: Start a new game**

Run: `npx tsx scripts/ai-playtest.ts new-game --seed=42 --class=marine --difficulty=survivor`

Verify:
- Game starts without errors
- Scene displays correctly with location names from the theme
- No references to "setting" in output

**Step 2: Play 10+ turns**

Follow AI_PLAYTEST_INSTRUCTIONS.md — play as a real player would, document in `scripts/playtest-detailed-N.md`.

**Step 3: Verify skeleton theme is working**

- Location names should match the skeleton's theme
- All game mechanics should work as before
- No crashes or missing data
