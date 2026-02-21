# VOID WALKER — Master Plan

> **The constitution.** Every line of code traces back to this document.
> Last updated: 2026-02-21 | Status: **PRE-DEVELOPMENT**

---

## Table of Contents

1. [Vision Recap](#1-vision-recap)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Development Cycle](#3-development-cycle)
4. [Testing Philosophy](#4-testing-philosophy)
5. [Phase Overview & Navigation](#5-phase-overview--navigation)
6. [Sacred Rules](#6-sacred-rules)
7. [Balance Constants](#7-balance-constants)
8. [Deployment & Infrastructure](#8-deployment--infrastructure)
9. [Future: Native App Path](#9-future-native-app-path)

---

## 1. Vision Recap

**Void Walker** is a mobile-first space horror RPG where every action the player
can imagine is valid. A procedural engine generates unique scenarios, resolves
creative actions through a property-based system, rolls dice for tension, and
narrates outcomes — all without requiring an internet connection.

An optional AI layer enhances narration when available, but the game is **100%
playable offline** with pre-written templates and procedural generation.

### Core Pillars (Immutable)

| # | Pillar | Meaning |
|---|--------|---------|
| 1 | **Creative agency** | The player can attempt *anything*. The engine never says "you can't do that" — only "you can try, but..." |
| 2 | **Emergent storytelling** | Actions have real consequences. Shooting a window depressurizes the room and can kill the monster, winning the game through a path nobody designed. |
| 3 | **Meaningful dice** | D20 rolls are sacred. The engine decides difficulty, the dice decide fate. No fudging. |
| 4 | **Atmospheric horror** | Dead Space x Alien: Isolation x tabletop RPG. Environmental storytelling over jump scares. |
| 5 | **Zero friction** | No account, no API key, no download. Open the URL and play. |

### Target Experience

- **Platform:** PWA — Android, iOS, desktop browsers
- **First input to gameplay:** < 60 seconds
- **Session length:** 5 minutes to 2 hours
- **Language:** French (player-facing), English (engine internals)
- **Offline:** Full gameplay with bundled scenarios and template narration
- **Online bonus:** AI-enhanced narration via free-tier Gemini Flash

---

## 2. Architecture Decisions

### 2.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript 5 (strict) | Type safety, Claude Code native |
| **Framework** | React 18 | Mobile perf, ecosystem, PWA support |
| **Build** | Vite 5+ | Fast HMR, optimized builds, PWA plugin |
| **State** | Zustand | 3KB, simple, no boilerplate |
| **Testing** | Vitest | Vite-native, fast, same config |
| **Styling** | Tailwind CSS 4 | Utility-first, mobile-first by default |
| **Storage** | IndexedDB (Dexie.js) | Offline persistence, large data |
| **PWA** | vite-plugin-pwa (Workbox) | Service worker, install prompt, caching |
| **Hosting** | GitHub Pages | Free, CI/CD via GitHub Actions |
| **AI (optional)** | Gemini Flash via Cloudflare Worker | Free tier, rate limiting, CORS proxy |

### 2.2 Architectural Principles

```
+---------------------------------------------------------+
|                     UI LAYER                            |
|            React Components + Zustand                   |
|         (the ONLY layer that touches the DOM)           |
+---------------------------------------------------------+
|                   AI LAYER (optional)                   |
|          Gemini Flash narrator + suggestions            |
|     (enhances narration -- game works without it)       |
+---------------------------------------------------------+
|                 NARRATION LAYER                         |
|        Template engine + French text utils              |
|       (always available, zero dependencies)             |
+---------------------------------------------------------+
|                  ENGINE LAYER                           |
|   Properties - Verbs - Parser - Resolver                |
|   Dice - Combat - Conditions - Consequences             |
|   Victory - Pacing - Stalker Clock - Ship Memory        |
|  (pure functions, zero side effects, 100% testable)     |
+---------------------------------------------------------+
|                 CONTENT LAYER                           |
|    Items - Scenarios - Templates - Settings             |
|         (JSON data, bundled in the PWA)                 |
+---------------------------------------------------------+
```

**Rule: Layers only depend downward.** The engine never imports from UI.
The narration never imports from AI. This means the engine can be tested
in pure Node.js with zero browser dependencies.

### 2.3 Project Structure

```
void-walker/
|
+-- docs/                          <- Design documents
|   +-- MASTERPLAN.md              <- YOU ARE HERE
|   +-- GAME_SYSTEMS.md            <- Game mechanics reference
|   +-- PARSER_DESIGN.md           <- Parser & property system reference
|   +-- SCENARIO_DESIGN.md         <- Scenario & content architecture
|   +-- phases/                    <- Phase-by-phase specs
|       +-- PHASE_0_BOOTSTRAP.md
|       +-- PHASE_1_PROPERTIES_VERBS.md
|       +-- PHASE_2_ACTION_PARSER.md
|       +-- PHASE_3_RESOLUTION_COMBAT.md
|       +-- PHASE_4_CONSEQUENCES_STATE.md
|       +-- PHASE_5_NARRATIVE.md
|       +-- PHASE_6_SCENARIOS_VICTORY.md
|       +-- PHASE_7_UI.md
|       +-- PHASE_8_AI.md
|       +-- PHASE_9_POLISH_LAUNCH.md
|
+-- CLAUDE.md                      # Claude Code instructions (updated each phase)
+-- package.json
+-- vitest.config.ts
+-- tsconfig.json
|
+-- src/
|   +-- engine/                    # PURE GAME LOGIC (no UI, no AI, no side effects)
|   |   +-- types.ts               #   All game types and interfaces
|   |   +-- properties.ts          #   Property registry and inheritance
|   |   +-- verbs.ts               #   Verb registry, aliases (FR+EN), requirements
|   |   +-- parser.ts              #   Free text -> structured action
|   |   +-- resolver.ts            #   Tokens -> game entities (items, NPCs, features)
|   |   +-- compatibility.ts       #   Verb x properties compatibility checks
|   |   +-- difficulty.ts          #   Difficulty calculation with context modifiers
|   |   +-- dice.ts                #   D20 + stat + modifier vs difficulty
|   |   +-- combat.ts              #   Combat resolution, NPC attacks, weak points
|   |   +-- conditions.ts          #   Status conditions (wounded, terrified, etc.)
|   |   +-- oxygen.ts              #   Zone-based O2 system
|   |   +-- durability.ts          #   Item breakage and repair
|   |   +-- stalkerClock.ts        #   Hidden idle pressure system
|   |   +-- shipMemory.ts          #   Environmental marks from failed actions
|   |   +-- failsafe.ts            #   Anti-softlock failsafe system
|   |   +-- state.ts               #   Immutable state transitions
|   |   +-- inventory.ts           #   Add, remove, use, equip items
|   |   +-- consequences.ts        #   Action outcomes -> world state changes
|   |   +-- victory.ts             #   Victory/defeat condition checker
|   |   +-- pacing.ts              #   Story beat progression and enforcement
|   |   +-- suggestions.ts         #   Context-aware action suggestions
|   |   +-- save.ts                #   Save state management, permadeath
|   |   +-- index.ts               #   Public API: processTurn(state, input) -> TurnResult
|   |
|   +-- content/                   # GAME DATA (JSON + TypeScript constants)
|   |   +-- items.ts               #   All items with properties
|   |   +-- npcs.ts                #   NPC archetypes with properties
|   |   +-- environments.ts        #   Environmental features with properties
|   |   +-- classes.ts             #   3 player classes (marine, engineer, medic)
|   |   +-- settings.ts            #   Setting themes (derelict ship, alien ruins...)
|   |   +-- templates/             #   Narrative template collections
|   |   |   +-- physical.ts        #     STRIKE, THROW, BREAK...
|   |   |   +-- technical.ts       #     HACK, REPAIR, SABOTAGE...
|   |   |   +-- social.ts          #     PERSUADE, INTIMIDATE, DECEIVE...
|   |   |   +-- creative.ts        #     IMPROVISE_WEAPON, IMPROVISE_SHIELD...
|   |   |   +-- environmental.ts   #     Depressurization, fire, flooding...
|   |   |   +-- absurd.ts          #     Eating a robot, seducing a door...
|   |   |   +-- sensory.ts         #     Sensory detail pools per setting
|   |   |   +-- conditions.ts      #     Condition-based narrative snippets
|   |   |   +-- secrets.ts         #     Secret verb narratives
|   |   +-- scenarios/             #   Pre-built scenario JSONs
|   |       +-- escape_derelict.json
|   |       +-- alien_ruins.json
|   |       +-- station_outbreak.json
|   |       +-- prison_break.json
|   |       +-- generation_ship.json
|   |
|   +-- i18n/                      # INTERNATIONALIZATION
|   |   +-- index.ts               #   t() function, locale loader
|   |   +-- types.ts               #   StringKey type (union of all valid keys)
|   |   +-- locales/
|   |       +-- fr.ts              #   French strings (primary)
|   |       +-- en.ts              #   English strings
|   |
|   +-- narration/                 # TEXT GENERATION (no AI needed)
|   |   +-- templateEngine.ts      #   Slot-based template rendering
|   |   +-- french.ts              #   French grammar (articles, accords, conjugation)
|   |   +-- composer.ts            #   7-layer narrative composition
|   |   +-- memory.ts              #   Recently-used buffer (prevents repetition)
|   |
|   +-- ai/                        # OPTIONAL AI ENHANCEMENT
|   |   +-- client.ts              #   Gemini Flash client with fallback
|   |   +-- narrator.ts            #   Replaces template narration when available
|   |   +-- suggestions.ts         #   AI-generated action suggestions
|   |   +-- proxy.ts               #   Cloudflare Worker proxy config
|   |
|   +-- ui/                        # REACT UI (mobile-first)
|   |   +-- App.tsx                #   Root component + routing
|   |   +-- screens/
|   |   |   +-- TitleScreen.tsx
|   |   |   +-- CharacterCreation.tsx
|   |   |   +-- GameScreen.tsx
|   |   |   +-- EndScreen.tsx
|   |   +-- components/
|   |   |   +-- StatusBar.tsx
|   |   |   +-- NarrativePanel.tsx
|   |   |   +-- SuggestionButtons.tsx
|   |   |   +-- ActionInput.tsx
|   |   |   +-- DiceAnimation.tsx
|   |   |   +-- MapModal.tsx
|   |   |   +-- InventoryModal.tsx
|   |   |   +-- SettingsModal.tsx
|   |   +-- hooks/
|   |   |   +-- useGame.ts
|   |   |   +-- useTypewriter.ts
|   |   |   +-- useDiceAnimation.ts
|   |   +-- styles/
|   |       +-- theme.ts           #   Horror color palette, typography
|   |
|   +-- stores/
|   |   +-- gameStore.ts           #   Zustand: single source of truth
|   |
|   +-- services/
|       +-- storage.ts             #   IndexedDB via Dexie.js
|       +-- pwa.ts                 #   Service worker registration
|
+-- tests/
|   +-- unit/                      # FAST (< 5s total, run on every save)
|   |   +-- engine/
|   |       +-- properties.test.ts
|   |       +-- verbs.test.ts
|   |       +-- parser.test.ts
|   |       +-- resolver.test.ts
|   |       +-- compatibility.test.ts
|   |       +-- difficulty.test.ts
|   |       +-- dice.test.ts
|   |       +-- combat.test.ts
|   |       +-- conditions.test.ts
|   |       +-- oxygen.test.ts
|   |       +-- durability.test.ts
|   |       +-- stalkerClock.test.ts
|   |       +-- shipMemory.test.ts
|   |       +-- failsafe.test.ts
|   |       +-- consequences.test.ts
|   |       +-- victory.test.ts
|   |       +-- pacing.test.ts
|   |       +-- regressions.test.ts
|   |
|   +-- stress/                    # EXHAUSTIVE (10-120s, run before commit)
|   |   +-- allVerbsAllItems.test.ts
|   |   +-- parserFuzzing.test.ts
|   |   +-- consequenceChains.test.ts
|   |   +-- combatSimulation.test.ts
|   |   +-- conditionStacking.test.ts
|   |   +-- oxygenEdgeCases.test.ts
|   |   +-- antiSoftlock.test.ts
|   |   +-- scenarioWalkthrough.test.ts
|   |   +-- generators/
|   |       +-- itemGenerator.ts
|   |       +-- stateGenerator.ts
|   |       +-- inputGenerator.ts
|   |
|   +-- integration/               # MULTI-SYSTEM (5-30s, run before merge)
|   |   +-- fullTurn.test.ts
|   |   +-- multiTurn.test.ts
|   |   +-- combatEncounter.test.ts
|   |   +-- emergentVictory.test.ts
|   |   +-- scenarioCompletion.test.ts
|   |
|   +-- playtest/                  # INTERACTIVE (manual + automated)
|       +-- cli.ts                 #   Terminal-based playtest tool
|       +-- autoplay.ts            #   Automated random playthrough
|       +-- record.ts              #   Record session for regression
|       +-- replay.ts              #   Replay recorded session
|
+-- public/
|   +-- icons/                     #   PWA icons (192, 512)
|   +-- screenshots/               #   PWA install screenshots
|   +-- manifest.json              #   Handled by vite-plugin-pwa
|
+-- .github/
|   +-- workflows/
|       +-- test.yml               #   Run tests on every push
|       +-- deploy.yml             #   Build + deploy to GitHub Pages
|
+-- worker/                        #   Cloudflare Worker (AI proxy)
    +-- src/
    |   +-- index.ts
    +-- wrangler.toml
    +-- package.json
```

---

## 3. Development Cycle

### 3.1 CLAUDE.md Contract

Every phase produces an updated `CLAUDE.md` that serves as Claude Code's
instruction manual. This file is the **single source of truth** for how
to work in the codebase.

```markdown
# CLAUDE.md structure (updated each phase)

## Quick Commands
npm test              # Unit tests (must pass before any commit)
npm run test:stress   # Stress tests (run when asked or before merge)
npm run test:all      # Everything
npm run dev           # Dev server at localhost:5173
npm run build         # Production build
npm run playtest      # Interactive CLI playtest

## Current Phase
Phase X -- [name]

## Architecture Rules
[layer dependencies, naming conventions, etc.]

## Testing Rules
[what tests to run when, coverage thresholds]

## File Conventions
[where to put what, naming patterns]
```

### 3.2 Development Cycle (Every Feature)

```
+-----------------------------------------------------+
|  1. BRAINSTORM SESSION (Human + Claude chat)         |
|     Define exactly what we're building               |
|     Human provides personal requirements             |
|     Output: detailed spec for the feature            |
+-----------------------------------------------------+
|  2. TYPES FIRST (Claude Code)                        |
|     Write TypeScript interfaces and types            |
|     These are the contract                           |
+-----------------------------------------------------+
|  3. TESTS FIRST (Claude Code)                        |
|     Write unit tests that define expected behavior   |
|     Write stress tests for combinatorial coverage    |
|     All tests FAIL at this point (red)               |
+-----------------------------------------------------+
|  4. IMPLEMENT (Claude Code)                          |
|     Write code until all tests pass (green)          |
|     Claude Code runs `npm test` to verify            |
+-----------------------------------------------------+
|  5. VERIFY (Claude Code)                             |
|     Run `npm run test:stress` -- all pass            |
|     Run `npm run test:all` -- all pass               |
|     Check coverage thresholds                        |
+-----------------------------------------------------+
|  6. PLAYTEST (Human)                                 |
|     Human runs `npm run playtest` or `npm run dev`   |
|     Tests the "feel" -- does it play well?           |
|     Reports issues -> back to step 3 (add test)     |
+-----------------------------------------------------+
|  7. COMMIT (Claude Code)                             |
|     Conventional commit message                      |
|     GitHub Actions runs tests + deploys              |
+-----------------------------------------------------+
```

### 3.3 Claude Code Test Integration

All test output is designed to be **parseable by Claude Code**:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    reporters: ['verbose'],
    typecheck: { enabled: true },
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/narration/**', 'src/content/**'],
      reporter: ['text', 'text-summary'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
```

**NPM scripts designed for Claude Code:**

```jsonc
{
  "scripts": {
    // === TESTS (Claude Code runs these) ===
    "test":             "vitest run",
    "test:watch":       "vitest watch",
    "test:stress":      "vitest run --project stress",
    "test:integration": "vitest run --project integration",
    "test:all":         "vitest run --project unit --project stress --project integration",
    "test:coverage":    "vitest run --coverage",

    // === QUALITY (Claude Code runs before commit) ===
    "typecheck":  "tsc --noEmit",
    "lint":       "eslint src/ tests/",
    "lint:fix":   "eslint src/ tests/ --fix",
    "check":      "npm run typecheck && npm run lint && npm run test:all",

    // === DEV (Human uses these) ===
    "dev":        "vite",
    "build":      "tsc -b && vite build",
    "preview":    "vite preview",

    // === PLAYTEST (Human or Claude Code) ===
    "playtest":        "tsx tests/playtest/cli.ts",
    "playtest:debug":  "tsx tests/playtest/cli.ts --debug",
    "playtest:god":    "tsx tests/playtest/cli.ts --god",
    "playtest:chaos":  "tsx tests/playtest/cli.ts --chaos",
    "playtest:auto":   "tsx tests/playtest/autoplay.ts",
    "playtest:auto:100": "tsx tests/playtest/autoplay.ts --runs 100 --report"
  }
}
```

### 3.4 Claude Code Conventions

```
COMMIT MESSAGES:
  feat(engine): add property inheritance system
  fix(parser): "tirer sur" now correctly maps to SHOOT
  test(stress): add 1000-item x all-verbs combinatorial test
  docs: update CLAUDE.md for Phase 2
  refactor(engine): extract difficulty modifiers to constants

BRANCH STRATEGY:
  main              <- always deployable, tests pass
  dev               <- integration branch
  phase-N/feature   <- feature branches

FILE NAMING:
  src/engine/*.ts       -> camelCase (properties.ts, verbs.ts)
  tests/**/*.test.ts    -> camelCase matching source (properties.test.ts)
  src/content/*.ts      -> camelCase
  src/ui/components/*.tsx -> PascalCase (StatusBar.tsx)
  *.json                -> kebab-case (escape-derelict.json)

CODE STYLE:
  - All engine functions are PURE (no side effects, no global state)
  - All state changes return NEW state (immutable)
  - All player-facing strings in French
  - All engine internals, comments, logs in English
  - Explicit types everywhere (no `any`, no implicit returns)
  - Prefer `const` over `let`, never `var`
```

---

## 4. Testing Philosophy

### The Four Test Levels

| Level | Name | Speed | When | What it catches |
|-------|------|-------|------|-----------------|
| 1 | **Unit** | < 5s | Every save | Logic errors, edge cases, regressions |
| 2 | **Stress** | 10-120s | Before commit | Combinatorial explosions, missing templates, crashes on weird input |
| 3 | **Integration** | 5-30s | Before merge | Multi-system interactions, state corruption, victory path bugs |
| 4 | **Playtest** | Manual | Each phase | "Feel", pacing, fun factor, narrative quality |

### Stress Test Manifesto

> "If a player can imagine it, does the engine handle it?"

```
STRESS TEST: all-verbs x all-items
  50+ verbs x 1000+ items x 10 game states = 500,000+ combinations
  Every combination must return a valid result (never throw)
  Difficulty must always be between 2-25

STRESS TEST: parser fuzzing
  5000 random inputs (valid, gibberish, adversarial, multilingual)
  Parser must never throw
  No input should cause infinite loops or hangs (< 50ms per parse)

STRESS TEST: consequence chains
  Every consequence rule must be triggered at least once
  Chain reactions must terminate (max cascade depth = 5)
  Environmental changes must be consistent

STRESS TEST: combat simulation
  1000 random combat encounters across all difficulty presets
  NPC weak points always discoverable within 3 rounds
  Flee always possible (even if DC is high)
  No combat produces NaN or negative values

STRESS TEST: condition stacking
  All 5 conditions applied simultaneously -> stats never go below 0
  Condition timers decrement correctly, cures work

STRESS TEST: oxygen edge cases
  O2 depletion -> HP drain transition is smooth
  EVA suit halves drain correctly
  Pressurized zone restores O2

STRESS TEST: anti-softlock
  Every obstacle passable within 10 attempts (worst case: all nat 1)
  Failsafe triggers at correct threshold per difficulty

STRESS TEST: scenario walkthrough
  For each scenario: 100 random playthroughs
  Every playthrough must end (victory or defeat, never stuck)
  At least 1 alternative victory path must exist
```

### Regression Test Protocol

Every bug found -> write a test that reproduces it -> fix it -> test stays forever.

```typescript
// tests/unit/engine/regressions.test.ts
// This file only grows. Tests are never removed.

describe('Regressions', () => {
  test('BUG-001 (2026-02-20): "tirer" disambiguated by "sur"', () => { ... });
  test('BUG-002 (2026-02-21): thrown item must leave inventory', () => { ... });
});
```

---

## 5. Phase Overview & Navigation

### Phase Summary

| Phase | Name | Duration | Gate | Status |
|-------|------|----------|------|--------|
| **0** | Bootstrap + i18n Foundation | 1 day | `npm run check` passes | PENDING |
| **1** | Properties, Verbs & Character Data | 1 week | 500K combo stress tests pass | PENDING |
| **2** | Action Parser | 1 week | 5000 fuzzed inputs survive | PENDING |
| **3** | Resolution & Combat Engine | 2 weeks | 1000 combat simulations stable | PENDING |
| **4** | Consequences & State Engine | 1 week | 100-turn random games, state never corrupts | PENDING |
| **5** | Narrative Templates | 1.5 weeks | Every verb x outcome has template coverage | PENDING |
| **6** | Scenarios & Victory | 2 weeks | 500 auto-playthroughs complete | PENDING |
| | **ENGINE COMPLETE** | | | |
| **7** | UI (Mobile-First PWA) | 2 weeks | Playable on phone | PENDING |
| **8** | AI Enhancement Layer | 1 week | Works with and without AI | PENDING |
| **9** | Polish, PWA & Launch | 2 weeks | Lighthouse > 90, 10 beta testers | PENDING |

**Total: ~15 weeks**

### Navigation Guide

**When starting a phase, always read:**
1. This document (`MASTERPLAN.md`) — rules, dev cycle, conventions
2. The phase file (`docs/phases/PHASE_X_*.md`) — what to build
3. Reference docs as indicated below

**Which reference doc to read per phase:**

| Phase | Reference Docs Needed |
|-------|----------------------|
| 0 (Bootstrap) | None — self-contained |
| 1 (Properties) | `PARSER_DESIGN.md` (verbs, properties) + `GAME_SYSTEMS.md` Section 1 (stats, classes) |
| 2 (Parser) | `PARSER_DESIGN.md` (full doc) |
| 3 (Resolution) | `GAME_SYSTEMS.md` Sections 1-7 (combat, conditions, O2, durability, stalker clock) |
| 4 (Consequences) | `GAME_SYSTEMS.md` Sections 8-9, 13 (Ship Memory, save, turn execution order) + `SCENARIO_DESIGN.md` Section 3 (anti-softlock) |
| 5 (Narrative) | `SCENARIO_DESIGN.md` Section 7 (narrative variety) + `GAME_SYSTEMS.md` Section 11 (secret verbs) |
| 6 (Scenarios) | `SCENARIO_DESIGN.md` (full doc) + `GAME_SYSTEMS.md` Section 10 (Black Box) |
| 7 (UI) | `GAME_SYSTEMS.md` Section 9 (save system) |
| 8 (AI) | None beyond phase file |
| 9 (Polish) | None beyond phase file |

---

## 6. Sacred Rules

### The 10 Inviolable Rules

| # | Rule | Why |
|---|------|-----|
| 1 | **Never say "you can't do that"** | Say "you can try, but..." with high difficulty |
| 2 | **Dice results are sacred** | If the dice say fail, the narrative is a fail. Period. |
| 3 | **Engine decides, AI narrates** | The LLM never controls game logic, only prose |
| 4 | **Layers only depend downward** | Engine never imports from UI or AI |
| 5 | **Tests before code** | Write the test, see it fail, then implement |
| 6 | **French player-facing, English internals** | No exceptions |
| 7 | **Offline first** | Every feature must work without internet |
| 8 | **Mobile first** | Desktop is nice-to-have, mobile is must-have |
| 9 | **No BYOK** | Player never needs to provide an API key |
| 10 | **No accounts** | Open URL, play immediately |

---

## 7. Balance Constants

```typescript
const BALANCE = {
  // === DIFFICULTY ===
  BASE_DIFFICULTY: 10,
  MIN_DIFFICULTY: 2,
  MAX_DIFFICULTY: 25,
  ABSURD_DIFFICULTY_FLOOR: 23,

  // === STATS ===
  STAT_MIN: 0,
  STAT_MAX: 5,
  BONUS_POINTS: 2,
  TOTAL_CLASS_POINTS: 15,
  INVENTORY_SLOTS: 8,

  // === COMBAT ===
  COMBAT: {
    UNARMED_BASE_DAMAGE: 1,
    IMPROVISED_WEAPON_MULTIPLIER: 0.75,
    CRITICAL_HIT_MULTIPLIER: 1.5,
    PASSIVE_DODGE_AGI_THRESHOLD: 3,
    PASSIVE_DODGE_CHANCE: 0.1,
    NPC_HIT_BASE_DC: 10,
    BERSERK_ATK_BONUS_PER_QUARTER: 1,
    WEAK_POINT_HINT_ROUND: 2,
    WEAK_POINT_AUTO_DISCOVER_ROUND: 3,
    ENVIRONMENTAL_KILL_MULTIPLIER: 10,
    CORNERED_FLEE_DC: 16,
  },

  // === STALKER CLOCK ===
  STALKER_CLOCK: {
    WARNING:  { explorer: 20, survivor: 15, nightmare: 10 },
    THREAT:   { explorer: 30, survivor: 22, nightmare: 15 },
    KILL:     { explorer: 999, survivor: 35, nightmare: 20 },
  },

  // === CREATIVITY ===
  CREATIVITY: {
    DIFFERENT_FROM_SUGGESTIONS_BONUS: -2,
    NOVEL_COMBO_BONUS: -1,
    ABSURD_BUT_POSSIBLE_BONUS: -3,
  },

  // === OXYGEN ===
  OXYGEN: {
    MAX: 100,
    DRAIN_PRESSURIZED: 0,
    DRAIN_LOW_OXYGEN: 3,
    DRAIN_DEPRESSURIZED: 8,
    DRAIN_TOXIC: 5,
    HP_DRAIN_AT_ZERO: 3,
    RESTORE_RATE_SAFE: 33,
    CANISTER_RESTORE: 50,
    EVA_DRAIN_REDUCTION: 0.5,
  },

  // === CONDITIONS ===
  CONDITIONS: {
    WOUNDED_HP_THRESHOLD: 0.3,
    TERRIFIED_DURATION: 5,
    COLD_ONSET_ACTIONS: 3,
    EXHAUSTION_THRESHOLD: 10,
    POISONED_HP_DRAIN: 1,
  },

  // === DURABILITY ===
  DURABILITY: {
    IMPROVISED_WEAPON_MAX_USES: 2,
    REPAIR_BASE_DC: 12,
    NON_ENGINEER_REPAIR_PENALTY: 3,
  },

  // === PACING ===
  SCENES_QUICK: 10,
  SCENES_STANDARD: 20,
  SCENES_EXTENDED: 40,
  BEAT_INTRO: 0.10,
  BEAT_RISING: 0.35,
  BEAT_MIDPOINT: 0.10,
  BEAT_ESCALATION: 0.30,
  BEAT_CLIMAX: 0.10,
  BEAT_RESOLUTION: 0.05,

  // === CONSEQUENCES ===
  MAX_CASCADE_DEPTH: 5,
  FIRE_SPREAD_DELAY: 3,

  // === SAVE ===
  SAVE: {
    SLOT_COUNT: 3,
    AUTO_SAVE_INTERVAL_MS: 30000,
    BLACK_BOX_MAX_ENTRIES: 20,
  },

  // === AI ===
  AI_TIMEOUT_MS: 5000,
  AI_MAX_REQUESTS_PER_SESSION: 100,
} as const;
```

---

## 8. Deployment & Infrastructure

### GitHub Pages (Primary)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - uses: actions/deploy-pages@v4
```

### Cloudflare Worker (AI Proxy -- Phase 8)

```
Free tier: 100,000 requests/day
Rate limit: 10 requests/minute per IP
Purpose: hide API key, CORS proxy, rate limiting
```

---

## 9. Future: Native App Path

> **Priority: ULTRA LOW.** Only relevant if the PWA succeeds.

| Approach | Effort | Result |
|----------|--------|--------|
| **Capacitor** (recommended) | Low | Wraps PWA in native WebView |
| **TWA** (Trusted Web Activity) | Lowest | Android only, runs PWA in Chrome |
| **React Native rebuild** | Very high | Full rewrite, engine layer reusable |

The engine layer (`src/engine/`) is 100% portable since it has zero DOM dependencies.

---

> *"Dans le vide, personne ne vous entend lancer un D20."*
> -- Void Walker tagline
