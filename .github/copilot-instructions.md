# Project Guidelines — Void Walker

> Space horror RPG rewrite. **Status: PRE-DEVELOPMENT.** All existing code is in `archived/` as reference only. The rewrite starts fresh at root following `docs/MASTERPLAN.md`.

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
- Reference patterns: [archived/pwa/src/stores/gameStore.ts](archived/pwa/src/stores/gameStore.ts) (Zustand), [archived/pwa/src/services/llmClient.ts](archived/pwa/src/services/llmClient.ts) (LLM fallback chain)

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

## Project Conventions

- **MASTERPLAN.md is the constitution** — every decision traces to [docs/MASTERPLAN.md](docs/MASTERPLAN.md)
- **Phase-driven development** — 10 phases (0–9). Read the phase spec at `docs/phases/PHASE_X_*.md` before starting work
- **Regression tests never deleted** — bugs get a test in `tests/unit/engine/regressions.test.ts` that stays forever
- **6-stat system:** FOR (Force), AGI (Agilité), INT (Intelligence), PER (Perception), CHA (Charisme), LCK (Chance)
- **3 player classes:** Marine (combat), Engineer (technical), Medic (support)
- **Balance constants** defined in `MASTERPLAN.md` §7 — do not hardcode magic numbers, import from constants
- Game uses D20 rolls; dice results are sacred (never fudged)
- Engine never says "you can't do that" — always allows attempts with appropriate difficulty
- No accounts, no API keys required from player, no BYOK

## Integration Points

- **Gemini Flash** via Cloudflare Worker proxy (Phase 8) — enhances narration, never controls game logic
- **IndexedDB** via Dexie.js — offline persistence for saves, scenarios, settings
- **GitHub Pages** — deployment via `.github/workflows/` (existing workflow needs path updates)
- **vite-plugin-pwa** + Workbox — service worker, install prompt, offline caching

## Reference Documents

| When working on... | Read |
|---------------------|------|
| Game mechanics | [docs/GAME_SYSTEMS.md](docs/GAME_SYSTEMS.md) (1495 lines, 13 sections) |
| Parser & properties | [docs/PARSER_DESIGN.md](docs/PARSER_DESIGN.md) (685 lines, verb taxonomy, property system) |
| Scenarios & content | [docs/SCENARIO_DESIGN.md](docs/SCENARIO_DESIGN.md) (958 lines, modular architecture) |
| Any phase | [docs/phases/PHASE_N_*.md](docs/phases/) + MASTERPLAN §5 for which reference docs to read |
| Archived code reference | [archived/pwa/src/](archived/pwa/src/) (working PWA, old architecture) |
