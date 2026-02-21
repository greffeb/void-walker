# Phase 0 — Bootstrap + i18n Foundation

> **Status:** PENDING
> **Duration:** 1 day
> **Prerequisites:** None
> **Reference docs:** None (self-contained)

---

## Brainstorm Gate

- [ ] Confirm Node.js version (20 LTS)
- [ ] Confirm Tailwind CSS 4 compatibility with Vite 5+
- [ ] Confirm Dexie.js version for IndexedDB

## Deliverables

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Initialize project (Vite + React + TS strict) | `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts` | Build succeeds |
| 2 | Set up test infrastructure (unit, stress, integration projects) | `vitest.config.ts`, `tests/` directory structure | `npm test` runs |
| 3 | Install dependencies (Zustand, Dexie, Tailwind, vite-plugin-pwa) | `package.json` | `npm run build` succeeds |
| 4 | Create `src/engine/types.ts` with core type definitions | `src/engine/types.ts` | TypeScript compiles |
| 5 | Create i18n system: `t()` function + FR/EN locale files | `src/i18n/index.ts`, `src/i18n/types.ts`, `src/i18n/locales/fr.ts`, `src/i18n/locales/en.ts` | Unit: t() returns correct locale |
| 6 | Create `StatId`, `DifficultyLevel`, `DifficultySettings` types | `src/engine/types.ts` | TypeScript compiles |
| 7 | Create initial `CLAUDE.md` | `CLAUDE.md` | Human review |
| 8 | Set up ESLint + Prettier config | `.eslintrc.cjs`, `.prettierrc` | `npm run lint` passes |
| 9 | Create GitHub Actions CI workflow | `.github/workflows/test.yml` | Push triggers tests |

## Acceptance Criteria

```bash
npm run check              # Typecheck + lint + tests all pass
npm test                   # Unit tests pass (even if few)
npm run build              # Production build succeeds
```

## Key Design Decisions (Locked In)

- TypeScript strict mode (no `any`, no implicit returns)
- Vitest with 3 test project configs: unit, stress, integration
- `t()` function is synchronous, no external i18n library
- French is the default/primary locale
- Engine types defined first as the contract for all subsequent phases

## Definition of Done

- [ ] `npm run check` passes
- [ ] `npm run build` produces a working bundle
- [ ] `t('ui.play')` returns `'Jouer'` in FR, `'Play'` in EN
- [ ] Core types (`StatId`, `DifficultyLevel`, `GameState` stub) compile
- [ ] `CLAUDE.md` written and accurate for Phase 1
- [ ] Directory structure matches MASTERPLAN.md SS2.3
