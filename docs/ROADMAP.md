# 🚀 VOID WALKER — Master Development Roadmap

> **The founding stone.** Every line of code traces back to this document.
> Last updated: 2026-02-20 | Status: **PRE-DEVELOPMENT**

---

## Table of Contents

1. [Vision Recap](#1-vision-recap)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Claude Code Workflow](#3-claude-code-workflow)
4. [Testing Philosophy](#4-testing-philosophy)
5. [Phase 0 — Project Bootstrap](#5-phase-0--project-bootstrap)
6. [Phase 1 — Property System & Verb Registry](#6-phase-1--property-system--verb-registry)
7. [Phase 2 — Action Parser](#7-phase-2--action-parser)
8. [Phase 3 — Dice, State & Consequences Engine](#8-phase-3--dice-state--consequences-engine)
9. [Phase 4 — Narrative Templates](#9-phase-4--narrative-templates)
10. [Phase 5 — Scenarios & Victory System](#10-phase-5--scenarios--victory-system)
11. [Phase 6 — UI (Mobile-First PWA)](#11-phase-6--ui-mobile-first-pwa)
12. [Phase 7 — AI Enhancement Layer](#12-phase-7--ai-enhancement-layer)
13. [Phase 8 — Polish, PWA & Launch](#13-phase-8--polish-pwa--launch)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Future: Native App Path](#15-future-native-app-path)
16. [Reference: Key Design Rules](#16-reference-key-design-rules)

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
| 4 | **Atmospheric horror** | Dead Space × Alien: Isolation × tabletop RPG. Environmental storytelling over jump scares. |
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
┌──────────────────────────────────────────────────────┐
│                     UI LAYER                         │
│            React Components + Zustand                │
│         (the ONLY layer that touches the DOM)        │
├──────────────────────────────────────────────────────┤
│                   AI LAYER (optional)                │
│          Gemini Flash narrator + suggestions         │
│     (enhances narration — game works without it)     │
├──────────────────────────────────────────────────────┤
│                 NARRATION LAYER                      │
│        Template engine + French text utils           │
│       (always available, zero dependencies)          │
├──────────────────────────────────────────────────────┤
│                  ENGINE LAYER                        │
│   Properties • Verbs • Parser • Resolver             │
│   Dice • Consequences • Victory • Pacing             │
│  (pure functions, zero side effects, 100% testable)  │
├──────────────────────────────────────────────────────┤
│                 CONTENT LAYER                        │
│    Items • Scenarios • Templates • Settings          │
│         (JSON data, bundled in the PWA)              │
└──────────────────────────────────────────────────────┘
```

**Rule: Layers only depend downward.** The engine never imports from UI.
The narration never imports from AI. This means the engine can be tested
in pure Node.js with zero browser dependencies.

### 2.3 Project Structure

```
void-walker/
│
├── ROADMAP.md                  ← YOU ARE HERE
├── CLAUDE.md                   # Claude Code instructions
├── package.json                # Root workspace config
├── vitest.config.ts            # Test configuration
├── tsconfig.json               # TypeScript config
│
├── src/
│   ├── engine/                 # 🎯 PURE GAME LOGIC (no UI, no AI, no side effects)
│   │   ├── types.ts            #    All game types and interfaces
│   │   ├── properties.ts       #    Property registry and inheritance
│   │   ├── verbs.ts            #    Verb registry, aliases (FR+EN), requirements
│   │   ├── parser.ts           #    Free text → structured action
│   │   ├── resolver.ts         #    Tokens → game entities (items, NPCs, features)
│   │   ├── compatibility.ts    #    Verb × properties compatibility checks
│   │   ├── difficulty.ts       #    Difficulty calculation with context modifiers
│   │   ├── dice.ts             #    D20 + stat + modifier vs difficulty
│   │   ├── state.ts            #    Immutable state transitions
│   │   ├── inventory.ts        #    Add, remove, use, equip items
│   │   ├── consequences.ts     #    Action outcomes → world state changes
│   │   ├── victory.ts          #    Victory/defeat condition checker
│   │   ├── pacing.ts           #    Story beat progression and enforcement
│   │   ├── suggestions.ts      #    Context-aware action suggestions
│   │   └── index.ts            #    Public API: processTurn(state, input) → TurnResult
│   │
│   ├── content/                # 📦 GAME DATA (JSON + TypeScript constants)
│   │   ├── items.ts            #    All items with properties
│   │   ├── npcs.ts             #    NPC archetypes with properties
│   │   ├── environments.ts     #    Environmental features with properties
│   │   ├── settings.ts         #    Setting themes (derelict ship, alien ruins...)
│   │   ├── templates/          #    Narrative template collections
│   │   │   ├── physical.ts     #      STRIKE, THROW, BREAK...
│   │   │   ├── technical.ts    #      HACK, REPAIR, SABOTAGE...
│   │   │   ├── social.ts       #      PERSUADE, INTIMIDATE, DECEIVE...
│   │   │   ├── creative.ts     #      IMPROVISE_WEAPON, IMPROVISE_SHIELD...
│   │   │   ├── environmental.ts #     Depressurization, fire, flooding...
│   │   │   └── absurd.ts       #      Eating a robot, seducing a door...
│   │   └── scenarios/          #    Pre-built scenario JSONs
│   │       ├── escape_derelict.json
│   │       ├── alien_ruins.json
│   │       ├── station_outbreak.json
│   │       ├── prison_break.json
│   │       └── generation_ship.json
│   │
│   ├── narration/              # 📝 TEXT GENERATION (no AI needed)
│   │   ├── templateEngine.ts   #    Slot-based template rendering
│   │   ├── french.ts           #    French grammar (articles, accords, conjugation)
│   │   └── composer.ts         #    Assembles narrative from TurnResult
│   │
│   ├── ai/                     # 🤖 OPTIONAL AI ENHANCEMENT
│   │   ├── client.ts           #    Gemini Flash client with fallback
│   │   ├── narrator.ts         #    Replaces template narration when available
│   │   ├── suggestions.ts      #    AI-generated action suggestions
│   │   └── proxy.ts            #    Cloudflare Worker proxy config
│   │
│   ├── ui/                     # 📱 REACT UI (mobile-first)
│   │   ├── App.tsx             #    Root component + routing
│   │   ├── screens/
│   │   │   ├── TitleScreen.tsx
│   │   │   ├── CharacterCreation.tsx
│   │   │   ├── GameScreen.tsx
│   │   │   └── EndScreen.tsx
│   │   ├── components/
│   │   │   ├── StatusBar.tsx
│   │   │   ├── NarrativePanel.tsx
│   │   │   ├── SuggestionButtons.tsx
│   │   │   ├── ActionInput.tsx
│   │   │   ├── DiceAnimation.tsx
│   │   │   ├── MapModal.tsx
│   │   │   ├── InventoryModal.tsx
│   │   │   └── SettingsModal.tsx
│   │   ├── hooks/
│   │   │   ├── useGame.ts
│   │   │   ├── useTypewriter.ts
│   │   │   └── useDiceAnimation.ts
│   │   └── styles/
│   │       └── theme.ts        #    Horror color palette, typography
│   │
│   ├── stores/
│   │   └── gameStore.ts        #    Zustand: single source of truth
│   │
│   └── services/
│       ├── storage.ts          #    IndexedDB via Dexie.js
│       └── pwa.ts              #    Service worker registration, update prompt
│
├── tests/
│   ├── unit/                   # ⚡ FAST (< 5s total, run on every save)
│   │   └── engine/
│   │       ├── properties.test.ts
│   │       ├── verbs.test.ts
│   │       ├── parser.test.ts
│   │       ├── resolver.test.ts
│   │       ├── compatibility.test.ts
│   │       ├── difficulty.test.ts
│   │       ├── dice.test.ts
│   │       ├── consequences.test.ts
│   │       ├── victory.test.ts
│   │       ├── pacing.test.ts
│   │       └── regressions.test.ts
│   │
│   ├── stress/                 # 🔥 EXHAUSTIVE (10-120s, run before commit)
│   │   ├── allVerbsAllItems.test.ts
│   │   ├── parserFuzzing.test.ts
│   │   ├── consequenceChains.test.ts
│   │   ├── scenarioWalkthrough.test.ts
│   │   └── generators/
│   │       ├── itemGenerator.ts
│   │       ├── stateGenerator.ts
│   │       └── inputGenerator.ts
│   │
│   ├── integration/            # 🔗 MULTI-SYSTEM (5-30s, run before merge)
│   │   ├── fullTurn.test.ts
│   │   ├── multiTurn.test.ts
│   │   ├── emergentVictory.test.ts
│   │   └── scenarioCompletion.test.ts
│   │
│   └── playtest/               # 🎮 INTERACTIVE (manual + automated)
│       ├── cli.ts              #    Terminal-based playtest tool
│       ├── autoplay.ts         #    Automated random playthrough
│       ├── record.ts           #    Record session for regression
│       └── replay.ts           #    Replay recorded session
│
├── public/
│   ├── icons/                  #    PWA icons (192, 512)
│   ├── screenshots/            #    PWA install screenshots
│   └── manifest.json           #    Handled by vite-plugin-pwa
│
├── .github/
│   └── workflows/
│       ├── test.yml            #    Run tests on every push
│       └── deploy.yml          #    Build + deploy to GitHub Pages
│
└── worker/                     #    Cloudflare Worker (AI proxy)
    ├── src/
    │   └── index.ts
    ├── wrangler.toml
    └── package.json
```

---

## 3. Claude Code Workflow

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
Phase X — [name]

## Architecture Rules
[layer dependencies, naming conventions, etc.]

## Testing Rules
[what tests to run when, coverage thresholds]

## File Conventions
[where to put what, naming patterns]
```

### 3.2 Development Cycle (Every Feature)

```
┌─────────────────────────────────────────────────────┐
│  1. BRAINSTORM SESSION (Human + Claude chat)        │
│     Define exactly what we're building              │
│     Human provides personal requirements            │
│     Output: detailed spec for the feature           │
├─────────────────────────────────────────────────────┤
│  2. TYPES FIRST (Claude Code)                       │
│     Write TypeScript interfaces and types           │
│     These are the contract                          │
├─────────────────────────────────────────────────────┤
│  3. TESTS FIRST (Claude Code)                       │
│     Write unit tests that define expected behavior  │
│     Write stress tests for combinatorial coverage   │
│     All tests FAIL at this point (red)              │
├─────────────────────────────────────────────────────┤
│  4. IMPLEMENT (Claude Code)                         │
│     Write code until all tests pass (green)         │
│     Claude Code runs `npm test` to verify           │
├─────────────────────────────────────────────────────┤
│  5. VERIFY (Claude Code)                            │
│     Run `npm run test:stress` — all pass            │
│     Run `npm run test:all` — all pass               │
│     Check coverage thresholds                       │
├─────────────────────────────────────────────────────┤
│  6. PLAYTEST (Human)                                │
│     Human runs `npm run playtest` or `npm run dev`  │
│     Tests the "feel" — does it play well?           │
│     Reports issues → back to step 3 (add test)     │
├─────────────────────────────────────────────────────┤
│  7. COMMIT (Claude Code)                            │
│     Conventional commit message                     │
│     GitHub Actions runs tests + deploys             │
└─────────────────────────────────────────────────────┘
```

### 3.3 Claude Code Test Integration

All test output is designed to be **parseable by Claude Code**:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Default: unit tests (fast, on every save)
    include: ['tests/unit/**/*.test.ts'],
    
    // Reporter: verbose for Claude Code readability
    reporters: ['verbose'],
    
    // Named test groups
    typecheck: { enabled: true },
    
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/narration/**', 'src/content/**'],
      reporter: ['text', 'text-summary'],  // text output for Claude Code
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
    "test":          "vitest run",                          // Unit only, fast
    "test:watch":    "vitest watch",                        // Dev mode
    "test:stress":   "vitest run --project stress",         // Combinatorial
    "test:integration": "vitest run --project integration", // Multi-system
    "test:all":      "vitest run --project unit --project stress --project integration",
    "test:coverage":  "vitest run --coverage",              // With coverage report
    
    // === QUALITY (Claude Code runs before commit) ===
    "typecheck":     "tsc --noEmit",
    "lint":          "eslint src/ tests/",
    "lint:fix":      "eslint src/ tests/ --fix",
    "check":         "npm run typecheck && npm run lint && npm run test:all",
    
    // === DEV (Human uses these) ===
    "dev":           "vite",                                // Dev server :5173
    "build":         "tsc -b && vite build",                // Production build
    "preview":       "vite preview",                        // Preview build
    
    // === PLAYTEST (Human or Claude Code) ===
    "playtest":      "tsx tests/playtest/cli.ts",           // Interactive
    "playtest:debug":"tsx tests/playtest/cli.ts --debug",   // Show internals
    "playtest:god":  "tsx tests/playtest/cli.ts --god",     // All rolls succeed
    "playtest:chaos":"tsx tests/playtest/cli.ts --chaos",   // Random outcomes
    "playtest:auto": "tsx tests/playtest/autoplay.ts",      // Automated run
    "playtest:auto:100": "tsx tests/playtest/autoplay.ts --runs 100 --report" // Batch
  }
}
```

**Automated playtest with machine-readable output:**

```typescript
// tests/playtest/autoplay.ts
// Claude Code can run this and parse the JSON output

interface PlaytestReport {
  runsCompleted: number;
  runsFailed: number;          // Crashes, not game-overs
  averageTurns: number;
  victories: number;
  defeats: number;
  emergentVictories: number;   // Won through creative path
  uniqueVerbsUsed: Set<string>;
  unresolvedInputs: string[];  // Inputs that triggered reformulation
  errors: { turn: number; input: string; error: string }[];
}

// Output: tests/playtest/reports/autoplay-{timestamp}.json
```

### 3.4 Claude Code Conventions

```
COMMIT MESSAGES:
  feat(engine): add property inheritance system
  fix(parser): "tirer sur" now correctly maps to SHOOT
  test(stress): add 1000-item × all-verbs combinatorial test
  docs: update CLAUDE.md for Phase 2
  refactor(engine): extract difficulty modifiers to constants

BRANCH STRATEGY:
  main              ← always deployable, tests pass
  dev               ← integration branch
  phase-N/feature   ← feature branches

FILE NAMING:
  src/engine/*.ts       → camelCase (properties.ts, verbs.ts)
  tests/**/*.test.ts    → camelCase matching source (properties.test.ts)
  src/content/*.ts      → camelCase
  src/ui/components/*.tsx → PascalCase (StatusBar.tsx)
  *.json                → kebab-case (escape-derelict.json)

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

The stress tests are the **backbone** of quality. They answer:

> "If a player can imagine it, does the engine handle it?"

```
STRESS TEST: all-verbs × all-items
├── 50+ verbs × 1000+ items × 10 game states = 500,000+ combinations
├── Every combination must return a valid result (never throw)
├── Every allowed combination must have a narrative template
├── Difficulty must always be between 1-30
└── Stat must always be FOR, INT, or CHA

STRESS TEST: parser fuzzing  
├── 5000 random inputs (valid, gibberish, adversarial, multilingual)
├── Parser must never throw
├── Parser must always return a ParseResult with 0+ actions
└── No input should cause infinite loops or hangs (< 50ms per parse)

STRESS TEST: consequence chains
├── Every consequence rule must be triggered at least once
├── Chain reactions must terminate (no infinite loops)
├── Environmental changes must be consistent (can't be pressurized AND depressurized)
└── NPC deaths must properly update victory conditions

STRESS TEST: scenario walkthrough
├── For each scenario: 100 random playthroughs
├── Every playthrough must end (victory or defeat, never stuck)
├── Primary victory path must be achievable
├── At least 1 alternative victory path must exist
└── Average playthrough: 10-25 turns (not too short, not too long)
```

### Regression Test Protocol

Every bug found → write a test that reproduces it → fix it → test stays forever.

```typescript
// tests/unit/engine/regressions.test.ts
// This file only grows. Tests are never removed.

describe('Regressions', () => {
  // Each test is tagged with bug ID and date
  test('BUG-001 (2026-02-20): "tirer" disambiguated by "sur"', () => { ... });
  test('BUG-002 (2026-02-21): thrown item must leave inventory', () => { ... });
  test('BUG-003 (2026-02-22): EVA suit protects from vacuum', () => { ... });
});
```

---

## 5. Phase 0 — Project Bootstrap

> **Goal:** Empty project that builds, tests, deploys. Zero game logic.

### 🧠 Brainstorm Gate

Before starting Phase 0, confirm with the human:
- [ ] GitHub repo name and structure
- [ ] Node version (20 LTS recommended)
- [ ] Any personal preferences for tooling, linting rules, formatting

### Deliverables

| # | Task | Verification |
|---|------|-------------|
| 1 | Initialize Vite + React + TypeScript project | `npm run dev` starts |
| 2 | Configure TypeScript strict mode | `npm run typecheck` passes |
| 3 | Install and configure Vitest | `npm test` runs (1 placeholder test) |
| 4 | Configure test groups (unit/stress/integration) | `npm run test:stress` runs |
| 5 | Install and configure Tailwind CSS 4 | Utility classes work in dev |
| 6 | Install Zustand, Dexie.js | Imports resolve |
| 7 | Configure vite-plugin-pwa | PWA manifest generated in build |
| 8 | Set up GitHub Actions: test.yml | Push triggers test run |
| 9 | Set up GitHub Actions: deploy.yml | Push to main deploys to GH Pages |
| 10 | Write CLAUDE.md for Phase 0 | Claude Code can navigate the project |
| 11 | Folder structure created (empty index.ts files) | Structure matches 2.3 |
| 12 | ESLint configured (strict, no `any`) | `npm run lint` passes |

### Acceptance Criteria

```bash
npm test          # ✅ 1 test passes
npm run typecheck # ✅ No errors
npm run lint      # ✅ No errors  
npm run build     # ✅ Produces dist/ with PWA manifest
npm run dev       # ✅ Shows React app at localhost:5173
# GitHub Actions   # ✅ Tests pass, deploys to GitHub Pages
```

### Phase 0 Definition of Done

- [ ] `npm run check` passes (typecheck + lint + all tests)
- [ ] GitHub Pages shows a blank "Void Walker" page
- [ ] PWA is installable on Android/iOS (blank page, but installable)
- [ ] Claude Code can run all commands and read all output
- [ ] CLAUDE.md is written and accurate

---

## 6. Phase 1 — Property System & Verb Registry

> **Goal:** The foundational data layer. Every item, NPC, and environmental feature
> has properties. Every player verb is defined with aliases and requirements.

### 🧠 Brainstorm Gate

Before starting Phase 1, brainstorm session to define:
- [ ] Final property list (review/adjust the ~60 properties)
- [ ] Final verb list (review/adjust the ~50 verbs)
- [ ] Property inheritance rules (type defaults + overrides)
- [ ] Absurdity thresholds (when is something "absurd" vs "impossible"?)
- [ ] Human reviews all FR/EN verb aliases for completeness

### Deliverables

| # | Task | Test coverage |
|---|------|--------------|
| 1 | `src/engine/types.ts` — all game types | TypeScript compilation |
| 2 | `src/engine/properties.ts` — property registry + inheritance | Unit: every type inherits correctly |
| 3 | `src/engine/verbs.ts` — verb registry + all aliases | Unit: every alias resolves |
| 4 | `src/engine/compatibility.ts` — verb × property checks | Unit: every verb/prop combo |
| 5 | `src/content/items.ts` — all items with properties | Unit: every item has valid props |
| 6 | `src/content/npcs.ts` — NPC archetypes with properties | Unit: every NPC has valid props |
| 7 | `src/content/environments.ts` — env features with properties | Unit: every feature has valid props |
| 8 | Stress: 1000 items × all verbs × 10 states | All return valid results |
| 9 | Update CLAUDE.md | Accurate for Phase 1 code |

### Acceptance Criteria

```bash
npm test                    # ✅ All unit tests pass
npm run test:stress         # ✅ 500,000+ combinations, zero crashes
npm run typecheck           # ✅ No errors
```

### Key Design Decisions (Locked In)

**Compatibility never blocks, only increases difficulty:**
```typescript
type CompatibilityResult =
  | { compatible: true; difficultyMod: number }
  | { compatible: false; absurd: true; difficultyMod: number; flavor: string }
  | { compatible: false; impossible: true; reason: string };

// "impossible" is reserved for physics violations (teleportation, time travel)
// "absurd" is for eating metal, seducing a door — allowed but DC 23+
// Everything else is "compatible" with varying difficulty
```

---

## 7. Phase 2 — Action Parser

> **Goal:** Transform free-text player input (FR or EN) into structured actions
> that the engine can resolve.

### 🧠 Brainstorm Gate

Before starting Phase 2, brainstorm session to define:
- [ ] Tokenization strategy (stemming? lemmatization? simple prefix?)
- [ ] Compound action grammar ("arracher X pour Y", "utiliser X sur Y")
- [ ] Disambiguation rules ("tirer" = PULL or SHOOT depending on context)
- [ ] Target resolution priority (inventory > location items > NPCs > features)
- [ ] Body part virtual object generation (robot_arm, creature_leg, etc.)
- [ ] Reformulation UX (when parser can't understand, what do we show?)
- [ ] Human provides list of 50+ "creative player inputs" for the test suite

### Deliverables

| # | Task | Test coverage |
|---|------|--------------|
| 1 | `src/engine/parser.ts` — tokenizer + verb matcher | Unit: all verbs resolve from FR+EN |
| 2 | `src/engine/resolver.ts` — target resolver | Unit: items, NPCs, features, body parts |
| 3 | `src/engine/difficulty.ts` — difficulty calculator | Unit: base + modifiers + context |
| 4 | Compound action detection | Unit: "arracher pour servir de massue" |
| 5 | Disambiguation logic | Unit: "tirer sur" vs "tirer" |
| 6 | Reformulation fallback | Unit: gibberish → suggestions |
| 7 | Stress: 5000 random inputs | Parser never throws |
| 8 | Stress: 200 curated creative inputs | Correct parsing |
| 9 | Playtest CLI (basic) | Can type actions, see parsed output |
| 10 | Update CLAUDE.md | Accurate for Phase 2 code |

### Acceptance Criteria

```bash
npm test                    # ✅ All unit tests pass
npm run test:stress         # ✅ 5000 fuzzed inputs, zero crashes
npm run playtest:debug      # ✅ Type actions, see parse results
```

---

## 8. Phase 3 — Dice, State & Consequences Engine

> **Goal:** Complete action resolution. From parsed action to new game state,
> including dice rolls, state changes, environmental consequences, and chain
> reactions.

### 🧠 Brainstorm Gate

Before starting Phase 3, brainstorm session to define:
- [ ] Complete consequence rules list (depressurization, fire, flooding, etc.)
- [ ] Chain reaction limits (max cascade depth? timing?)
- [ ] Environmental propagation rules (fire spreads through open doors, etc.)
- [ ] NPC reaction system (hostile NPC acts on player's turn? between turns?)
- [ ] Item creation from actions (detached robot arm → improvised weapon)
- [ ] HP/oxygen damage tables
- [ ] State immutability strategy (immer? manual spread? structuredClone?)

### Deliverables

| # | Task | Test coverage |
|---|------|--------------|
| 1 | `src/engine/dice.ts` — D20 system | Unit: nat1, nat20, modifiers, edge cases |
| 2 | `src/engine/state.ts` — immutable state transitions | Unit: every transition produces valid state |
| 3 | `src/engine/inventory.ts` — inventory management | Unit: add, remove, use, equip, full/empty |
| 4 | `src/engine/consequences.ts` — consequence rules engine | Unit: every rule triggers correctly |
| 5 | `src/engine/index.ts` — `processTurn()` public API | Integration: full turn pipeline |
| 6 | Environmental chain reactions | Integration: fire spread, depressurization |
| 7 | NPC state changes (damage, death, disposition) | Integration: combat, social outcomes |
| 8 | Item creation from actions | Integration: detach limb → new weapon |
| 9 | Stress: consequence chains always terminate | No infinite loops |
| 10 | Stress: random 100-turn games never corrupt state | State always valid |
| 11 | Playtest CLI with dice rolls | Can play full turns |
| 12 | Update CLAUDE.md | Accurate for Phase 3 code |

### Acceptance Criteria

```bash
npm test                    # ✅ All unit tests pass
npm run test:stress         # ✅ Consequence chains terminate, state never corrupts
npm run test:integration    # ✅ Full turn pipeline works
npm run playtest            # ✅ Can play multiple turns with dice and consequences
```

---

## 9. Phase 4 — Narrative Templates

> **Goal:** Every action outcome produces atmospheric French narrative text
> through a template system. No AI required.

### 🧠 Brainstorm Gate

Before starting Phase 4, brainstorm session to define:
- [ ] Template slot format and rendering engine design
- [ ] French grammar rules needed (articles, accords, conjugation)
- [ ] Narrative tone per story beat (calm, tense, desperate)
- [ ] Number of templates per verb category (target: 5-10 per combo)
- [ ] Absurd action template style (humorous? deadpan?)
- [ ] Environmental consequence narration style
- [ ] Human reviews sample templates for quality and tone

### Deliverables

| # | Task | Test coverage |
|---|------|--------------|
| 1 | `src/narration/templateEngine.ts` — slot renderer | Unit: all slot types render |
| 2 | `src/narration/french.ts` — grammar utilities | Unit: articles, accords, plurals |
| 3 | `src/narration/composer.ts` — TurnResult → narrative | Unit: every outcome type produces text |
| 4 | Templates: physical verbs (STRIKE, THROW, BREAK...) | ≥5 per verb × 5 outcomes |
| 5 | Templates: technical verbs (HACK, REPAIR, SABOTAGE...) | ≥5 per verb × 5 outcomes |
| 6 | Templates: social verbs (PERSUADE, INTIMIDATE...) | ≥5 per verb × 5 outcomes |
| 7 | Templates: creative/absurd actions | ≥10 generic templates |
| 8 | Templates: environmental events | Depressurization, fire, flood, power cut |
| 9 | Stress: every verb × outcome has ≥1 template | No empty narration |
| 10 | Playtest CLI with full narration | Reads like a real game |
| 11 | Update CLAUDE.md | Accurate for Phase 4 code |

### Acceptance Criteria

```bash
npm test                    # ✅ All unit tests pass
npm run test:stress         # ✅ Every verb × outcome has template coverage
npm run playtest            # ✅ Full atmospheric gameplay in terminal
# Human:                    # ✅ "This reads like a real space horror RPG"
```

---

## 10. Phase 5 — Scenarios & Victory System

> **Goal:** Playable scenarios with multiple victory paths, including emergent
> ones. Procedural scenario generation from modular building blocks.

### 🧠 Brainstorm Gate

Before starting Phase 5, brainstorm session to define:
- [ ] Scenario JSON schema (locations, connections, items, NPCs, features, victory)
- [ ] Modular building blocks format (graph fragments + content pools)
- [ ] Procedural generation algorithm (assembly rules, anti-softlock guarantees)
- [ ] Victory condition types (primary, alternative, emergent)
- [ ] Pacing system integration (story beats, scene progression triggers)
- [ ] How environmental kills trigger emergent victories
- [ ] Minimum 5 handcrafted scenarios (human co-writes with Claude)
- [ ] Scenario difficulty tuning

### Deliverables

| # | Task | Test coverage |
|---|------|--------------|
| 1 | `src/engine/scenario.ts` — scenario types and loader | Unit: valid scenario parsing |
| 2 | `src/engine/victory.ts` — all condition types | Unit: primary, alternative, emergent |
| 3 | `src/engine/pacing.ts` — story beats + enforcement | Unit: beat transitions, ending rules |
| 4 | `src/content/scenarios/` — 5 handcrafted scenarios | Integration: each completable |
| 5 | Procedural scenario generator | Stress: 100 generated, all completable |
| 6 | Emergent victory through consequences | Integration: env kill → alt victory |
| 7 | `src/engine/suggestions.ts` — context-aware suggestions | Unit: 3 relevant suggestions per state |
| 8 | Stress: 100 random playthroughs per scenario | All end, none stuck |
| 9 | Full playtest CLI with scenarios | Complete game sessions |
| 10 | Update CLAUDE.md | Accurate for Phase 5 code |

### Acceptance Criteria

```bash
npm test                    # ✅ All tests pass
npm run test:stress         # ✅ 100 playthroughs per scenario, all end
npm run test:integration    # ✅ Emergent victories work
npm run playtest            # ✅ Can play full game sessions, multiple endings
npm run playtest:auto:100   # ✅ 100 automated runs, all complete
# Human:                    # ✅ "I discovered a creative way to win!"
```

### 🏁 ENGINE COMPLETE MILESTONE

At this point, the game engine is **feature-complete**. Everything after this
is presentation (UI) and enhancement (AI). The engine can be fully tested
and played through the CLI tool.

---

## 11. Phase 6 — UI (Mobile-First PWA)

> **Goal:** A beautiful, touch-friendly interface that makes the engine
> accessible on any phone.

### 🧠 Brainstorm Gate

Before starting Phase 6, brainstorm session to define:
- [ ] Visual design direction (color palette, typography, animations)
- [ ] Screen flow (title → character creation → game → end)
- [ ] Component behavior specs (typewriter speed, dice animation timing)
- [ ] Accessibility requirements (contrast, touch target sizes, screen reader?)
- [ ] Landscape support? (or portrait-locked)
- [ ] Human provides reference screenshots or mood boards

### Deliverables

| # | Task | Test coverage |
|---|------|--------------|
| 1 | `App.tsx` + screen routing | Component test |
| 2 | `TitleScreen.tsx` | Visual check |
| 3 | `CharacterCreation.tsx` | Component test: creates valid player |
| 4 | `GameScreen.tsx` (orchestrator) | Component test: manages game flow |
| 5 | `StatusBar.tsx` (HP, O2, location, beat) | Component test: renders all states |
| 6 | `NarrativePanel.tsx` (typewriter effect) | Component test: displays text |
| 7 | `SuggestionButtons.tsx` (3 touch targets) | Component test: triggers actions |
| 8 | `ActionInput.tsx` (free text input) | Component test: submits text |
| 9 | `DiceAnimation.tsx` (suspense roll) | Component test: shows result |
| 10 | `MapModal.tsx` (location grid) | Component test: shows connections |
| 11 | `InventoryModal.tsx` (item cards) | Component test: shows items |
| 12 | `gameStore.ts` (Zustand) | Unit: state management |
| 13 | Mobile responsive testing | Visual: 360px to 768px |
| 14 | Touch interaction testing | Manual on real device |
| 15 | Update CLAUDE.md | Accurate for Phase 6 code |

### Acceptance Criteria

```bash
npm test                    # ✅ All tests pass (engine + components)
npm run build               # ✅ Production build succeeds
npm run dev                 # ✅ Full game playable at localhost:5173
# Mobile:                   # ✅ Playable on Android Chrome + iOS Safari
# Lighthouse:               # ✅ PWA score > 90
```

### Mobile Compatibility Targets

| Platform | Browser | Min Version | Status |
|----------|---------|-------------|--------|
| Android | Chrome | 90+ | Primary target |
| Android | Firefox | 100+ | Must work |
| Android | Samsung Internet | 15+ | Must work |
| iOS | Safari | 15.4+ | Must work (PWA install) |
| iOS | Chrome | Latest | Should work (limited PWA) |
| Desktop | Chrome | 90+ | Should work |
| Desktop | Firefox | 100+ | Should work |
| Desktop | Safari | 15+ | Should work |

---

## 12. Phase 7 — AI Enhancement Layer

> **Goal:** When online, an AI narrator replaces template text with richer,
> more contextual prose. When offline or rate-limited, the game seamlessly
> falls back to templates.

### 🧠 Brainstorm Gate

Before starting Phase 7, brainstorm session to define:
- [ ] Cloudflare Worker proxy design (rate limiting, CORS, caching)
- [ ] Gemini Flash prompt design for narration enhancement
- [ ] Fallback triggering logic (timeout, error, quota exceeded)
- [ ] How AI suggestions differ from engine-generated ones
- [ ] Cost projections and rate limiting strategy
- [ ] Privacy considerations (what data hits the API?)

### Deliverables

| # | Task | Test coverage |
|---|------|--------------|
| 1 | `worker/` — Cloudflare Worker proxy | Manual: deploy and test |
| 2 | `src/ai/client.ts` — API client with timeout + fallback | Unit: fallback triggers correctly |
| 3 | `src/ai/narrator.ts` — AI narration enhancement | Integration: AI text replaces template |
| 4 | `src/ai/suggestions.ts` — AI action suggestions | Integration: 3 contextual suggestions |
| 5 | Graceful degradation testing | Integration: AI off → templates work |
| 6 | Rate limiting per session | Unit: respects limits |
| 7 | Update CLAUDE.md | Accurate for Phase 7 code |

### Acceptance Criteria

```bash
npm test                    # ✅ All tests pass
npm run build               # ✅ Build succeeds
# With AI:                  # ✅ Richer narration, better suggestions
# Without AI:               # ✅ Game plays identically with templates
# Rate limited:             # ✅ Seamless fallback mid-session
```

---

## 13. Phase 8 — Polish, PWA & Launch

> **Goal:** Production-ready PWA. Installable, offline-capable, performant,
> and fun.

### 🧠 Brainstorm Gate

Before starting Phase 8, brainstorm session to define:
- [ ] PWA install experience (prompt timing, splash screen)
- [ ] Offline strategy (which scenarios bundled, SW caching rules)
- [ ] Save/load UX (auto-save? manual? multiple slots?)
- [ ] Settings UI (language preference, AI toggle, accessibility)
- [ ] Scenario browser UX (saved, generated, presets)
- [ ] Sound effects? (optional, low priority)
- [ ] Analytics? (privacy-first, optional)
- [ ] Launch checklist and beta tester group

### Deliverables

| # | Task | Test coverage |
|---|------|--------------|
| 1 | PWA service worker configuration | Manual: install on Android + iOS |
| 2 | Offline gameplay with bundled scenarios | Manual: airplane mode test |
| 3 | Save/load game state (IndexedDB) | Integration: save, close, reload |
| 4 | Scenario browser modal | Component test |
| 5 | Settings modal | Component test |
| 6 | Cache busting strategy | Manual: deploy update, verify |
| 7 | Performance optimization | Lighthouse: perf > 90 |
| 8 | Lighthouse PWA audit | Score > 90 |
| 9 | Cross-browser testing | All targets from Phase 6 |
| 10 | Beta testing (5-10 testers) | Feedback report |
| 11 | Final CLAUDE.md | Complete project guide |

### Launch Checklist

- [ ] All tests pass: `npm run check`
- [ ] Lighthouse scores: Performance > 90, PWA > 90, Accessibility > 90
- [ ] Installable on Android (Chrome "Add to Home Screen")
- [ ] Installable on iOS (Safari "Add to Home Screen")
- [ ] Offline gameplay works (airplane mode)
- [ ] Save/load works across sessions
- [ ] < 3 second initial load on 4G
- [ ] < 200ms action response time
- [ ] 5 scenarios playable
- [ ] No console errors in production build
- [ ] README updated with play URL

---

## 14. Deployment & Infrastructure

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
      - run: npm run check    # typecheck + lint + all tests

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

**URL:** `https://{username}.github.io/void-walker/`

### Vite Configuration for GitHub Pages

```typescript
// vite.config.ts
export default defineConfig({
  base: '/void-walker/',  // GitHub Pages subpath
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Void Walker',
        short_name: 'VoidWalker',
        description: 'RPG spatial horrifique',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/void-walker/',
        start_url: '/void-walker/',
      },
    }),
  ],
});
```

### Cloudflare Worker (AI Proxy — Phase 7)

```
Free tier: 100,000 requests/day
Rate limit: 10 requests/minute per IP
Purpose: hide API key, CORS proxy, rate limiting
```

---

## 15. Future: Native App Path

> **Priority: ULTRA LOW.** Only relevant if the PWA succeeds.

The PWA is designed to be **wrappable** into a native app later:

| Approach | Effort | Result |
|----------|--------|--------|
| **Capacitor** (recommended) | Low | Wraps PWA in native WebView, access to native APIs |
| **TWA** (Trusted Web Activity) | Lowest | Android only, runs PWA in Chrome |
| **React Native rebuild** | Very high | Full rewrite, but engine layer reusable |

**Capacitor path (when ready):**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Void Walker" com.voidwalker.app
npx cap add android
npx cap add ios
npm run build && npx cap sync
# Open in Android Studio / Xcode
```

The engine layer (`src/engine/`) is 100% portable since it has zero DOM
dependencies. Only `src/ui/` would need adaptation for React Native.

---

## 16. Reference: Key Design Rules

### The Sacred Rules (Never Violate)

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

### Game Balancing Constants

```typescript
// These are tuning knobs, adjusted during playtesting

const BALANCE = {
  // Difficulty
  BASE_DIFFICULTY: 10,
  MIN_DIFFICULTY: 2,
  MAX_DIFFICULTY: 25,        // Nat 20 can still succeed
  ABSURD_DIFFICULTY_FLOOR: 23,
  CREATIVE_BONUS: -2,        // Reward creative actions
  
  // Player
  STARTING_HP: { min: 8, max: 12 },  // By class
  MAX_STAT: 5,
  XP_PER_LEVEL: 10,
  INVENTORY_SLOTS: 8,
  
  // Pacing  
  SCENES_QUICK: 10,
  SCENES_STANDARD: 20,
  SCENES_EXTENDED: 40,
  
  // Story beats (% of total scenes)
  BEAT_INTRO: 0.10,
  BEAT_RISING: 0.35,
  BEAT_MIDPOINT: 0.10,
  BEAT_ESCALATION: 0.30,
  BEAT_CLIMAX: 0.10,
  BEAT_RESOLUTION: 0.05,
  
  // Consequences
  MAX_CASCADE_DEPTH: 5,      // Prevent infinite chain reactions
  FIRE_SPREAD_DELAY: 3,      // Turns before fire spreads
  VACUUM_DAMAGE_PER_TURN: 5,
  
  // AI
  AI_TIMEOUT_MS: 5000,       // Fallback to templates after 5s
  AI_MAX_REQUESTS_PER_SESSION: 100,
} as const;
```

---

## Phase Summary

| Phase | Name | Duration | Key Output | Gate |
|-------|------|----------|-----------|------|
| **0** | Bootstrap | 1 day | Empty project that builds + deploys | `npm run check` ✅ |
| **1** | Properties & Verbs | 1 week | 60 properties, 50 verbs, 500K combo test | Stress tests pass |
| **2** | Action Parser | 1 week | Free text → structured actions | 5000 fuzzed inputs survive |
| **3** | Dice & Consequences | 1.5 weeks | Full action resolution + chain reactions | 100-turn random games stable |
| **4** | Narrative Templates | 1.5 weeks | Atmospheric French text for every outcome | "Reads like a real RPG" |
| **5** | Scenarios & Victory | 2 weeks | 5 scenarios, emergent victories | 500 auto-playthroughs complete |
| **6** | UI | 2 weeks | Mobile-first PWA interface | Playable on phone |
| **7** | AI Layer | 1 week | Optional AI narration + fallback | Works with and without AI |
| **8** | Polish & Launch | 2 weeks | Production-ready, beta tested | Lighthouse > 90, 10 testers |

**Total estimated duration: 12-14 weeks**

---

> *"Dans le vide, personne ne vous entend lancer un D20."*
> — Void Walker tagline
