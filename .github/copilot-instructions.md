# Project Guidelines — Void Walker

> Space horror RPG. The game is playable end to end; Phases 0–7 are delivered.
> **Current state, priorities and open problems live in [docs/STATUS.md](../docs/STATUS.md)** — read it first.
> `archived/` holds the pre-rewrite code, kept as reference patterns only.

## Architecture

```
src/engine/    → Pure game logic (zero DOM deps, zero side effects, 100% testable in Node.js)
src/content/   → Game data as TypeScript constants (items, NPCs, classes, scenarios, templates)
src/i18n/      → Synchronous t() function, French primary locale
src/narration/ → Template-based text generation (no AI needed)
src/ai/        → Optional Gemini Flash enhancement (game works without it)
src/ui/        → React 18 + Zustand (the ONLY layer touching the DOM)
src/stores/    → Zustand store (single source of truth)
src/services/  → IndexedDB (Dexie.js), PWA service worker
```

**Layer rule:** Dependencies flow downward only. Engine never imports from UI or AI. Narration never imports from AI.

## Code Style

- **TypeScript 5 strict** — no `any`, no implicit returns, explicit types everywhere
- **Pure functions** in `src/engine/` — no side effects, no global state
- **Immutable state** — all transitions return new objects
- **French** for all player-facing strings; **English** for internals, comments, variable names
- `const` over `let`, never `var`
- Components: PascalCase (`StatusBar.tsx`). Engine/content: camelCase (`properties.ts`). JSON: kebab-case
- **No hardcoded natural language in engine code** — use the i18n system for all linguistic data (verb aliases, conjugated forms, parser patterns). Adding a new language = adding a locale file, not editing engine code
- ESLint flat config + `typescript-eslint`. No Prettier — follow existing formatting
- Reference patterns: [archived/pwa/src/stores/gameStore.ts](../archived/pwa/src/stores/gameStore.ts) (Zustand), [archived/pwa/src/services/llmClient.ts](../archived/pwa/src/services/llmClient.ts) (LLM fallback chain)

## Build and Test

```bash
# All commands run from project root (not archived/)
npm install           # Install deps
npm run dev           # Vite dev server at localhost:5173
npm run build         # tsc -b && vite build
npm test              # Vitest unit tests (must pass before any commit)
npm run test:stress   # Combinatorial/fuzz tests (before commit)
npm run test:all      # Unit + stress + integration
npm run check         # typecheck + lint + test:all (gate for merges)
npm run typecheck     # tsc --noEmit
npm run lint          # eslint src/ tests/
npm run playtest      # Interactive CLI playtest via tsx
```

**TDD workflow:** Write types → write failing tests → implement until green → run stress tests → verify coverage ≥ 90%.

**Pre-commit gate:** Always run `npm run check` (typecheck + lint + test:all) before any commit or push. Never commit with only `npm test` — ESLint errors and type issues will break CI. The full check command is the single source of truth for commit-readiness. Fix **all** errors AND warnings before committing — warnings in CI are treated as errors.

## Project Conventions

- **STATUS.md is the map** — current state and priorities live in [docs/STATUS.md](../docs/STATUS.md). Read it before picking up work
- **MASTERPLAN.md is the constitution** — every decision traces to [docs/reference/MASTERPLAN.md](../docs/reference/MASTERPLAN.md)
- **`docs/archive/` is history, not a plan** — those documents describe delivered work. Following them means redoing it
- **Regression tests never deleted** — bugs get a test in `tests/unit/engine/regressions.test.ts` that stays forever
- **7-stat system:** FOR (Force), DEF (Défense), AGI (Agilité), INT (Intelligence), PER (Perception), CHA (Charisme), LCK (Chance)
- **3 player classes:** Marine (combat), Engineer (technical), Medic (support)
- **Balance constants** defined in `MASTERPLAN.md` §7 — do not hardcode magic numbers, import from constants
- Game uses D20 rolls; dice results are sacred (never fudged)
- Engine never says "you can't do that" — always allows attempts with appropriate difficulty
- No accounts, no API keys required from player, no BYOK

## Integration Points

- **Gemini Flash** via Cloudflare Worker proxy — Phase 8, **not started**; `src/ai/` does not exist yet
- **IndexedDB** via Dexie.js — offline persistence for saves, scenarios, settings
- **GitHub Pages** — deployed by `.github/workflows/deploy-pwa.yml` (branch previews enabled)
- **vite-plugin-pwa** + Workbox — service worker, install prompt, offline caching

## Reference Documents

| When working on... | Read |
|---------------------|------|
| **Anything — start here** | [docs/STATUS.md](../docs/STATUS.md) (state, priorities, known problems) |
| Overall vision | [docs/reference/MASTERPLAN.md](../docs/reference/MASTERPLAN.md) (the constitution) |
| Game mechanics | [docs/reference/GAME_SYSTEMS.md](../docs/reference/GAME_SYSTEMS.md) (13 sections) |
| Parser & properties | [docs/reference/PARSER_DESIGN.md](../docs/reference/PARSER_DESIGN.md) (verb taxonomy, property system) |
| Scenarios & content | [docs/reference/SCENARIO_DESIGN.md](../docs/reference/SCENARIO_DESIGN.md) (modular architecture) |
| Narrative layer order | [docs/specs/NARRATION_STRUCTURE.md](../docs/specs/NARRATION_STRUCTURE.md) (partially applied) |
| Working practices | [docs/process/](../docs/process/) (issue resolution, module testing, playtests) |
| Archived code reference | [archived/pwa/src/](../archived/pwa/src/) (working PWA, old architecture) |
