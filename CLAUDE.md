# CLAUDE.md — Void Walker Coding Instructions

> **Current Phase:** 0 (Bootstrap) → Ready for Phase 1
> **Last updated:** 2026-02-21

---

## Quick Commands

```bash
npm test              # Unit tests (must pass before any commit)
npm run test:stress   # Stress tests (run when asked or before merge)
npm run test:all      # Unit + stress + integration
npm run dev           # Dev server at localhost:5173
npm run build         # Production build (tsc -b && vite build)
npm run check         # typecheck + lint + test:all (gate for merges)
npm run typecheck     # tsc --noEmit
npm run lint          # eslint src/ tests/
npm run playtest      # Interactive CLI playtest via tsx
```

---

## Current Phase

**Phase 0 — Bootstrap + i18n Foundation** (COMPLETE)

Next: **Phase 1 — Properties, Verbs & Character Data**
- Read `docs/phases/PHASE_1_PROPERTIES_VERBS.md`
- Read `docs/PARSER_DESIGN.md` (verbs, properties)
- Read `docs/GAME_SYSTEMS.md` Section 1 (stats, classes)

---

## Architecture Rules

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

---

## Testing Rules

- **TDD workflow:** Write types → write failing tests → implement until green
- **Unit tests** (`tests/unit/`): < 5s total, run on every save
- **Stress tests** (`tests/stress/`): 10-120s, run before commit
- **Integration tests** (`tests/integration/`): 5-30s, run before merge
- Coverage threshold: **90%** (branches, functions, lines, statements)
- Regression tests in `tests/unit/engine/regressions.test.ts` — **never deleted**

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
- French for all player-facing strings; English for internals, comments, variable names
- All balance values imported from `src/engine/constants.ts` (BALANCE) — no magic numbers

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

- `StatId`: `'FOR' | 'AGI' | 'INT' | 'PER' | 'CHA' | 'LCK'`
- `PlayerClassName`: `'marine' | 'engineer' | 'medic'`
- `DifficultyLevel`: `'explorer' | 'survivor' | 'nightmare'`
- `GameState`: Complete immutable state object
- `TurnResult`: Result of `processTurn(state, input)`
- `BALANCE`: All balance constants from MASTERPLAN §7
