# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Current Phase:** Phase 1 (COMPLETE) → Ready for Phase 2
> **Last updated:** 2026-02-21

---

## Commands

```bash
npm test                        # Unit tests (must pass before any commit)
npm run test:watch              # Unit tests in watch mode
npm run test:stress             # Stress tests (run before commit)
npm run test:all                # Unit + stress + integration
npx vitest run tests/unit/engine/types.test.ts  # Run a single test file
npm run dev                     # Dev server at localhost:5173
npm run build                   # Production build (tsc -b && vite build)
npm run check                   # typecheck + lint + test:all (gate for merges)
npm run typecheck               # tsc --noEmit
npm run lint                    # eslint src/ tests/
npm run lint:fix                # eslint with auto-fix
npm run playtest                # Interactive CLI playtest via tsx
npm run playtest:debug          # Playtest with debug output
```

---

## Current Phase

**Phase 0 — Bootstrap + i18n Foundation** (COMPLETE)
**Phase 1 — Properties, Verbs & Character Data** (COMPLETE)

Next: **Phase 2 — Parser & Action Resolution**
- Read `docs/phases/PHASE_2_PARSER.md`
- Read `docs/PARSER_DESIGN.md` (parser architecture)
- Read `docs/GAME_SYSTEMS.md` Section 2 (action resolution)

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
