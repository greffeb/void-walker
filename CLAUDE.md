# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Current Phase:** Phase 6 (COMPLETE) → Ready for Phase 6B
> **Last updated:** 2026-02-25

---

## Commands

```bash
npm test                        # Unit tests (must pass before any commit)
npm run test:watch              # Unit tests in watch mode
npm run test:stress             # Stress tests (run before commit)
npm run test:integration        # Integration tests (run before merge)
npm run test:all                # Unit + stress + integration
npm run test:coverage           # Unit tests with coverage report
npx vitest run tests/unit/engine/types.test.ts  # Run a single test file
npm run dev                     # Dev server at localhost:5173
npm run build                   # Production build (tsc -b && vite build)
npm run preview                 # Preview production build locally
npm run check                   # typecheck + lint + test:all (gate for merges)
npm run typecheck               # tsc --noEmit
npm run lint                    # eslint src/ tests/
npm run lint:fix                # eslint with auto-fix
npm run playtest                # Interactive CLI playtest via tsx
npm run playtest:debug          # Playtest with debug output
npm run playtest:god            # Playtest with god mode (invincible player)
npm run playtest:chaos          # Playtest with chaos mode (random actions)
npm run playtest:auto           # Automated single playthrough
npm run playtest:auto:100       # 100 automated playthroughs with report
```

**Pre-commit gate:** Always run `npm run check` (typecheck + lint + test:all) before any commit or push. Never commit with only `npm test` — ESLint errors and type issues will break CI. The full check command is the single source of truth for commit-readiness.

---

## Current Phase

**Phase 0 — Bootstrap + i18n Foundation** (COMPLETE)
**Phase 1 — Properties, Verbs & Character Data** (COMPLETE)
**Phase 2 — Parser & Action Resolution** (COMPLETE)
**Phase 3 — Resolution & Combat** (COMPLETE)
**Phase 4 — Consequences & State Engine** (COMPLETE)
**Phase 5 — Narrative Composition** (COMPLETE)
**Phase 6 — Scenarios & Victory Conditions** (COMPLETE)

Next: **Phase 6B — Game Loop Integration**
- Read `docs/phases/PHASE_6B_GAME_LOOP_INTEGRATION.md`
- Extend `GameState` with Phase 6 fields (visitedLocations, npcStates, threatDirectorState, victoryResult, scenario)
- `src/engine/game.ts` exists: verify `initGame()`, `isGameOver()`, `buildVictoryCheckContext()` are complete
- Wire `checkVictory`, `threatCheck`, and visit tracking into `processTurn`
- Extend `getSceneContext()` with scenario-aware suggestions and exit exploration status
- Complete deferred stress + integration tests (500 playthroughs, emergent victories, Black Box round-trip)

Then: **Phase 7 — UI (Mobile-First PWA)**
- Read `docs/phases/PHASE_7_UI.md`

**Phase 6 delivered:**
- `src/engine/scenario.ts` — Full type system: CoreSkeleton (6-node), ScenarioModule, AssembledScenario, VictoryCondition (7 types), DefeatCondition (4 types), NarrativeSkin, LocationGraph, BlackBoxEntry, GameHistory
- `src/content/settings.ts` — 3 launch settings (derelict_ship, space_station, alien_ruins) with location role compatibility matrix
- `src/engine/pacing.ts` — `assembleScenario()`, `buildLocationGraph()`, `validateAssembledScenario()`, `isModuleCompatible()`, tension assignment + skin selection
- `src/content/scenarios/` — 3 launch skeletons (escape, investigate, rescue) + index
- `src/content/scenarios/modules/` — 15 modules: 5 universal + 5 category + 5 complex, all 10 module types, each with 3 narrative skins
- `src/engine/victory.ts` — Pure victory/defeat checker: `evaluateVictoryCondition()`, `checkVictory()` (5-priority cascade), `checkAdditionalDefeat()`
- `src/engine/threat.ts` — Threat Director state machine: 6-beat behaviors, encounter/hint/environmental pacing, creature learning (wounded → enraged)
- `src/engine/backtracking.ts` — Immutable `LocationVisitState` transitions + exit exploration status
- `src/engine/suggestions.ts` — 3-suggestion generator with class bias (marine/engineer/medic), skin priority weighting, category variety cap (max 2 per category)
- `src/engine/blackbox.ts` — Death/victory journal generation from `GameHistory`; placement logic (80% death / 30% victory, +0.05 cross-skeleton bonus)
- `tests/playtest/stuckDetector.ts` — Sliding-window stuck detection
- `tests/playtest/bots/` — Random + goal-seeking playtest bots with seeded RNG
- `tests/stress/scenarioCombinations.test.ts` — All 27 skeleton×setting×session combos
- `tests/stress/scenarioAssembly.test.ts` — 100 random assemblies all pass graph validation

**Phase 5 delivered:**
- `src/i18n/grammar/interface.ts` — Abstract GrammarEngine contract (SlotModifier, GrammaticalInfo)
- `src/i18n/grammar/fr.ts` — French grammar engine (articles, contractions, adjective agreement, elision, typography)
- `src/i18n/grammar/en.ts` — English grammar placeholder
- `src/narration/types.ts` — All narration types (NarrativeContext 12 dimensions, 8 template types, NarrativePresets)
- `src/narration/templateEngine.ts` — Slot parser + grammar-aware rendering ({def_target}, {?conditionals}, {target_adj:})
- `src/narration/memory.ts` — NarrationMemory anti-repetition (buffer size 10, LRU fallback, injectable RNG)
- `src/narration/composer.ts` — 7-layer composition engine (priority cascade, budget system, location state tracking)
- `src/narration/hints.ts` — Gameplay hint generator (6 categories, anti-softlock escalation after turn 5+)
- `src/narration/index.ts` — Narration bridge: `narrateForTurn(result, sceneContext, state)` (engine→narration)
- `src/content/templates/actionTemplates.ts` — ~900 action templates (verb × outcome × tension tier)
- `src/content/templates/sensory.ts` — 3 settings × 5 conditions, ~75 sensory snippets
- `src/content/templates/atmosphere.ts` — 3 settings × 4 tension tiers, ~38 atmosphere snippets
- `src/content/templates/conditions.ts` — Player state snippets (low_hp, fatigue, 5 conditions)
- `src/content/templates/npcReactions.ts` — 4 dispositions × outcomes, ~41 NPC reaction snippets
- `src/content/templates/environmental.ts` — 20+ state change types, ~48 consequence snippets
- `src/content/templates/threats.ts` — 6 story beats, ~28 threat hint snippets
- `src/content/templates/hints.ts` — 6 hint categories, ~30 hint templates
- `src/content/templates/secrets.ts` — 9 secret verbs, ~51 secret verb templates

---

## Architecture

```
src/engine/    → Pure game logic (no DOM, no side effects, 100% testable in Node)
src/content/   → Game data as TypeScript constants
src/i18n/      → Synchronous t() function, French primary
src/narration/ → Template-based text generation (no AI needed)
src/ai/        → Optional Gemini Flash enhancement
src/ui/        → React 18 + Zustand (ONLY layer touching DOM)
src/stores/    → Zustand store (single source of truth)
src/services/  → IndexedDB (Dexie.js), PWA service worker
```

**Layer rule:** Dependencies flow downward only.
- Engine **never** imports from UI or AI
- Narration **never** imports from AI
- UI imports from everything above

**Path aliases** available in source and tests: `@engine`, `@content`, `@i18n`, `@narration`, `@ai`, `@ui`, `@stores`, `@services` (configured in tsconfig.json and vite/vitest configs).

---

## Testing

- **TDD workflow:** Write types → write failing tests → implement until green
- **3 Vitest projects** configured in `vitest.config.ts`:
  - `unit` — `tests/unit/**/*.test.ts` (< 5s, run on every save)
  - `stress` — `tests/stress/**/*.test.ts` (120s timeout, before commit)
  - `integration` — `tests/integration/**/*.test.ts` (30s timeout, before merge)
- Coverage threshold: **90%** (branches, functions, lines, statements) on `src/engine/`, `src/narration/`, `src/content/`
- Regression tests in `tests/unit/engine/regressions.test.ts` — **never deleted**
- i18n tests use `beforeEach(() => resetLocale())` for locale isolation

---

## i18n System

- Custom synchronous `t(key, locale?)` function in `src/i18n/index.ts` — no external library
- `StringKey` is a compile-time union type of all valid keys (currently ~400+)
- Default locale is French (`'fr'`); falls back to key string if missing
- All locales are pre-loaded at import time (no async)
- Player-facing strings: French. Internals/comments/variables: English
- **No hardcoded natural-language strings in engine code** — all player-facing text, verb aliases, conjugated forms, compound patterns, stop words, and intent keywords MUST live in i18n locale files. Adding a new language = adding a locale file, not editing engine code.
- Parser linguistic data lives in i18n locale files; `content/parserData.ts` bridges i18n → typed data for the engine via `buildParserLocaleData(locale)`
- **Grammar engine** (`src/i18n/grammar/`): Abstract `GrammarEngine` interface with French (full) and English (placeholder) implementations. Handles articles, contractions, adjective agreement, elision, non-breaking spaces.

---

## Narrative System (Phase 5)

- **7-layer composition:** Action Result (mandatory) + Sensory Detail + Consequence + Atmosphere/Hint + Player State + Threat Hint + NPC Reaction
- **Template slots:** `{def_target}`, `{indef_target}`, `{de_target}`, `{a_target}`, `{part_target}`, conditionals `{?slot:yes|no}`, adjective agreement `{target_adj:adj}`
- **Anti-repetition:** `NarrationMemory` with per-layer buffers (size 10), LRU fallback, injectable RNG
- **3 narrative presets:** concise (3 layers), standard (5), immersive (7)
- **Priority cascade:** verb+target+outcome+tension → verb+outcome → category+outcome → generic fallback
- **Bridge pattern:** Engine never imports narration. `narrateForTurn(result, sceneContext, state)` in `src/narration/index.ts` builds `NarrativeContext` from `TurnResult` and calls `composeNarrative()`
- **Location awareness:** Atmosphere fades after 4 turns, replaced by gameplay hints. Environment changes reset counters.
- **Content:** 8 template files in `src/content/templates/` (~1200 French snippets total)

---

## File Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Engine/content | camelCase | `properties.ts`, `verbs.ts` |
| Tests | camelCase matching source | `properties.test.ts` |
| React components | PascalCase | `StatusBar.tsx` |
| JSON data | kebab-case | `escape-derelict.json` |

---

## Code Style

- TypeScript 5 strict — **no `any`**, no implicit returns, explicit types everywhere
- Pure functions in `src/engine/` — no side effects, no global state
- Immutable state — all transitions return new objects
- `const` over `let`, never `var`
- All balance values imported from `src/engine/constants.ts` (BALANCE) — no magic numbers
- No Prettier — follow existing formatting conventions
- ESLint flat config + typescript-eslint

---

## Sacred Rules (from MASTERPLAN §6)

1. Never say "you can't do that" — say "you can try, but..." with high difficulty
2. Dice results are sacred — no fudging
3. Engine decides, AI narrates — LLM never controls game logic
4. Layers only depend downward
5. Tests before code
6. French player-facing, English internals
7. Offline first
8. Mobile first
9. No BYOK (no API keys from player)
10. No accounts

---

## Key Types (src/engine/types.ts)

- `StatId`: `'FOR' | 'DEF' | 'AGI' | 'INT' | 'PER' | 'CHA' | 'LCK'` (7 stats)
- `PlayerClassName`: `'marine' | 'engineer' | 'medic'`
- `DifficultyLevel`: `'explorer' | 'survivor' | 'nightmare'`
- `PropertyId`: ~71 string literals (physical, material, functional, entity, environmental)
- `VerbId`: 77 string literals (13 FOR + 3 DEF + 22 INT + 4 PER + 14 CHA + 9 AGI + 12 interaction)
- `GameState`: Complete immutable state object
- `TurnResult`: Result of `processTurn(state, input)`
- `BALANCE`: All balance constants from MASTERPLAN §7 + CONTEXT_MODIFIERS
- `ParsedAction`: Parsed player action (verb, target, tool, verbMatch, creative)
- `Reformulation`: Alternative interpretations when input is ambiguous
- `ParseResult`: `ParsedAction | Reformulation`
- `ResolvedTarget`: A resolved game entity (id, nameKey, properties, isVirtual, source)
- `VerbMatch`: Which verb matched and how (strategy 1-6, confidence, isCompound)
- `DifficultyBreakdown`: Full DC calculation breakdown
- `SceneContext`: Lightweight scene view for parser/resolver

## Key Types (src/engine/scenario.ts) — Phase 6

- `CoreSkeleton`: 6-node story structure (start→unlock→reveal→escalation→boss→resolution)
- `CoreNodeId`: `'start' | 'unlock' | 'reveal' | 'escalation' | 'boss' | 'resolution'`
- `ScenarioModule`: Pluggable story segment (type, validSegments, tensionRange, 3 skins, obstacle)
- `NarrativeSkin`: Per-tension-tier presentation (low/mid/high, dcModifier, suggestedPathPriority)
- `VictoryCondition`: 7 types — reach_location, defeat_entity, activate_object, escort_alive, environmental_kill, containment, self_destruct
- `DefeatCondition`: 4 types — player_death, npc_death, time_expired, objective_destroyed
- `VictoryResult`: `{ type: VictoryType; skeletonId: string }` — result of per-turn victory check
- `AssembledScenario`: `{ skeleton, modules, graph, setting, sessionLength }` — ready-to-play game
- `LocationGraph`: `{ nodes: LocationNode[]; edges: LocationEdge[] }` — assembled navigation graph
- `LocationVisitState`: Immutable per-location tracking (itemsTaken, featuresChanged, obstacleResolved)
- `BlackBoxEntry`: Cross-skeleton death/victory journal persisted in IndexedDB
- `GameHistory`: Snapshot for generating a BlackBoxEntry (playerName, classId, keyEvents, etc.)
- `SettingDefinition`: Concrete names for abstract location roles (3 launch settings)
- `SessionLength`: `'quick' | 'standard' | 'extended'` (0 / 3-5 / 8-12 modules)
- `SuggestionCandidate`: Scored action suggestion (verbText, targetText, stat, category, score)

---

## Reference Documents

| When working on... | Read |
|---------------------|------|
| Any phase | `docs/phases/PHASE_N_*.md` + MASTERPLAN §5 |
| Game mechanics | `docs/GAME_SYSTEMS.md` (13 sections) |
| Parser & properties | `docs/PARSER_DESIGN.md` (verb taxonomy, property system) |
| Scenarios & content | `docs/SCENARIO_DESIGN.md` (modular architecture) |
| Overall vision | `docs/MASTERPLAN.md` (the constitution) |
| Archived code patterns | `archived/pwa/src/` (Zustand store, LLM fallback chain) |
