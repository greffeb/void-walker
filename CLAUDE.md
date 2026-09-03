# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Where the project stands, what to work on next, and why:** read
> [`docs/STATUS.md`](docs/STATUS.md). It is the single source of truth.
> This file covers only *how* to work in the repo — commands, architecture, conventions.
>
> **Do not treat `docs/archive/` as a plan.** Those documents describe work already
> delivered. Following them means redoing finished work — the main trap in this repo.

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

**Pre-commit gate:** Always run `npm run check` (typecheck + lint + test:all) before any commit or push. Never commit with only `npm test` — ESLint errors and type issues will break CI. The full check command is the single source of truth for commit-readiness. Fix **all** errors AND warnings before committing — warnings in CI are treated as errors.

---

## Architecture

```
src/engine/    → Pure game logic (no DOM, no side effects, 100% testable in Node)
src/content/   → Game data as TypeScript constants
src/i18n/      → Synchronous t() function, French primary
src/narration/ → Template-based text generation (no AI needed)
src/ai/        → Optional Gemini Flash enhancement (NOT STARTED — see docs/roadmap/)
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
- `StringKey` is a compile-time union type of all valid keys (809 keys, FR + EN)
- Default locale is French (`'fr'`); falls back to key string if missing
- All locales are pre-loaded at import time (no async)
- Player-facing strings: French. Internals/comments/variables: English
- **No hardcoded natural-language strings in engine code** — all player-facing text, verb aliases, conjugated forms, compound patterns, stop words, and intent keywords MUST live in i18n locale files. Adding a new language = adding a locale file, not editing engine code.
- Parser linguistic data lives in i18n locale files; `content/parserData.ts` bridges i18n → typed data for the engine via `buildParserLocaleData(locale)`
- **Grammar engine** (`src/i18n/grammar/`): Abstract `GrammarEngine` interface with French (full) and English (placeholder) implementations. Handles articles, contractions, adjective agreement, elision, non-breaking spaces.

---

## Narrative System

- **7-layer composition:** Action Result (mandatory) + Sensory Detail + Consequence + Atmosphere/Hint + Player State + Threat Hint + NPC Reaction
- **Layer order** is hardcoded in `src/narration/types.ts` (`LAYER_ORDER`)
- **Template slots:** `{def_target}`, `{indef_target}`, `{de_target}`, `{a_target}`, `{part_target}`, conditionals `{?slot:yes|no}`, adjective agreement `{target_adj:adj}`
- **Anti-repetition:** `NarrationMemory` with per-layer buffers (size 10), LRU fallback, injectable RNG
- **3 narrative presets:** concise (3 layers), standard (5), immersive (7)
- **Priority cascade:** verb+target+outcome+tension → verb+outcome → category+outcome → generic fallback
- **Bridge pattern:** Engine never imports narration. `narrateForTurn(result, sceneContext, state)` in `src/narration/index.ts` builds `NarrativeContext` from `TurnResult` and calls `composeNarrative()`
- **Location awareness:** Atmosphere fades after 4 turns, replaced by gameplay hints. Environment changes reset counters.
- **Content:** 10 template files in `src/content/templates/`, 443 action templates

> ⚠️ Template coverage is thin: 91% of `(verb × outcome × tension)` cells hold a single
> variant, so the anti-repetition system has nothing to choose from. See `docs/STATUS.md` §4.1.

---

## File Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Engine/content | camelCase | `properties.ts`, `verbs.ts` |
| Tests | camelCase matching source | `properties.test.ts` |
| React components | PascalCase | `StatusBar.tsx` |
| JSON data | kebab-case | `escape-derelict.json` |
| Docs | see `docs/STATUS.md` §6 — every doc carries a `> **Statut :**` banner |

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
- `PropertyId`: 85 string literals (physical, material, functional, entity, environmental)
- `VerbId`: 78 string literals
- `GameState`: Complete immutable state object
- `TurnResult`: Result of `processTurn(state, input)`
- `BALANCE`: All balance constants from MASTERPLAN §7 + CONTEXT_MODIFIERS
- `ParsedAction`: Parsed player action (verb, target, tool, verbMatch, creative)
- `Reformulation`: Alternative interpretations when input is ambiguous
- `ParseResult`: `ParsedAction | Reformulation`
- `ResolvedTarget`: A resolved game entity (id, nameKey, properties, isVirtual, source)
- `VerbMatch`: Which verb matched and how (strategy 1-6, confidence, isCompound)
- `DifficultyBreakdown`: Full DC calculation breakdown (+ `namedLines` for dice choreography)
- `SceneContext`: Lightweight scene view for parser/resolver

## Key Types (src/engine/scenario.ts)

- `CoreSkeleton`: 6-node story structure (start→unlock→reveal→escalation→boss→resolution)
- `CoreNodeId`: `'start' | 'unlock' | 'reveal' | 'escalation' | 'boss' | 'resolution'`
- `SkeletonTheme`: Concrete names for abstract location roles, embedded in `CoreSkeleton`
- `ScenarioModule`: Pluggable story segment (type, validSegments, tensionRange, 3 skins, obstacle)
- `NarrativeSkin`: Per-tension-tier presentation (low/mid/high, dcModifier, suggestedPathPriority)
- `ScenarioFeatureDefinition` / `ScenarioItemDefinition`: Scenario elements as first-class engine citizens
- `ScenarioInteraction`: Declarative trigger→result rule (`newState`, `revealsItems`, exit unlocking)
- `MicroModule`: Optional side room attached to a core node (`loot` | `lore` | `encounter` | `ambiance`)
- `VictoryCondition`: 7 types — reach_location, defeat_entity, activate_object, escort_alive, environmental_kill, containment, self_destruct
- `DefeatCondition`: 4 types — player_death, npc_death, time_expired, objective_destroyed
- `VictoryResult`: `{ type: VictoryType; skeletonId: string }` — result of per-turn victory check
- `AssembledScenario`: `{ skeleton, modules, graph, sessionLength }` — ready-to-play game
- `LocationGraph`: `{ nodes: LocationNode[]; edges: LocationEdge[] }` — assembled navigation graph
- `LocationVisitState`: Immutable per-location tracking (itemsTaken, featuresChanged, obstacleResolved)
- `BlackBoxEntry`: Cross-skeleton death/victory journal persisted in IndexedDB
- `GameHistory`: Snapshot for generating a BlackBoxEntry (playerName, classId, keyEvents, etc.)
- `SessionLength`: `'quick' | 'standard' | 'extended'` (0 / 3-5 / 8-12 modules)
- `SuggestionCandidate`: Scored action suggestion (verbText, targetText, stat, category, score)

---

## Reference Documents

| When working on... | Read |
|---------------------|------|
| **Anything — start here** | [`docs/STATUS.md`](docs/STATUS.md) |
| Overall vision | `docs/reference/MASTERPLAN.md` (the constitution) |
| Game mechanics | `docs/reference/GAME_SYSTEMS.md` (13 sections) |
| Parser & properties | `docs/reference/PARSER_DESIGN.md` (verb taxonomy, property system) |
| Scenarios & content | `docs/reference/SCENARIO_DESIGN.md` (modular architecture) |
| Narrative layer order | `docs/specs/NARRATION_STRUCTURE.md` (partially applied) |
| Fixing a playtest issue | `docs/process/ISSUE_RESOLUTION_METHODOLOGY.md` |
| Building/testing a module | `docs/process/MODULE_TESTING_METHODOLOGY.md` |
| Running an automated playtest | `docs/process/AI_PLAYTEST_INSTRUCTIONS.md` |
| Archived code patterns | `archived/pwa/src/` (Zustand store, LLM fallback chain) |
