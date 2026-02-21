# Phase 6 — Scenarios & Victory

> **Status:** PENDING
> **Duration:** 2 weeks
> **Prerequisites:** Phase 5 complete
> **Reference docs:** `SCENARIO_DESIGN.md` (full doc), `GAME_SYSTEMS.md` (SS10)

---

## Brainstorm Gate

- [ ] Confirm 3 launch skeletons (which 3 of 5?)
- [ ] Confirm 15 launch modules (distribution across tiers/categories)
- [ ] Review module narrative skins -- are 3 per module sufficient?
- [ ] Confirm Black Box placement logic (rising beat, side room)
- [ ] Review victory condition alternatives per skeleton
- [ ] Confirm 3 launch settings (which 3 of 8?)

## Week 1: Scenario Architecture & Content

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Core skeleton data structure and loader | `src/engine/victory.ts`, `src/content/scenarios/` | Unit: skeleton validates (4 nodes, gate item, victory conditions) |
| 2 | Module data structure with compatibility tags | `src/content/scenarios/` | Unit: every module has 3+ resolution paths |
| 3 | Scenario assembly algorithm (skeleton + modules by session length) | `src/engine/pacing.ts` | Unit: quick=0, standard=3-5, extended=8-12 modules |
| 4 | Module compatibility filter (universal/category/setting) | `src/engine/pacing.ts` | Unit: alien_ruins modules excluded from derelict_ship |
| 5 | Location name resolution (abstract roles -> setting-specific names) | `src/engine/pacing.ts` | Unit: "passage" in derelict_ship -> "Coursive principale" |
| 6 | Tension curve validation (no drops > 2, peak >= 9) | `src/engine/pacing.ts` | Unit: invalid curves rejected |
| 7 | Beat zone assignment (modules get beats based on segment position) | `src/engine/pacing.ts` | Unit: intro modules get low tension, escalation gets high |
| 8 | 3 core skeletons written (Escape, Investigate, Rescue) | `src/content/scenarios/` | Unit: each has valid gate, revelation, boss, 2 victory paths |
| 9 | 15 modules written (5 universal, 5 mid-tier, 5 high-tier) | `src/content/scenarios/` | Unit: each has 3-5 paths, 3 narrative skins |
| 10 | 3 settings fully fleshed out (derelict_ship, alien_ruins, space_station) | `src/content/settings.ts` | Unit: 20+ location names, features, preferred items |

## Week 2: Victory, Black Box, Threat Director, Integration

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 11 | Victory condition checker (primary + alternative) | `src/engine/victory.ts` | Unit: both victory paths trigger correctly |
| 12 | Graph builder (skeleton + modules -> connected location graph) | `src/engine/pacing.ts` | Unit: no orphan nodes, all paths exist |
| 13 | Graph validator (completable, victory reachable) | `src/engine/pacing.ts` | Unit: every assembled scenario is completable |
| 14 | Threat director (per-beat behavior, encounter chances) | `src/engine/pacing.ts` | Unit: encounter chance increases with beat |
| 15 | Threat director narrative hints (atmospheric templates per beat) | `src/content/templates/` | Unit: hints exist for all 6 beats |
| 16 | Backtracking support (free movement, revisit descriptions, revisit events) | `src/engine/state.ts` | Unit: revisited rooms show past-tense descriptions |
| 17 | Progress indicators (explored vs unexplored exits) | `src/engine/suggestions.ts` | Unit: exits list shows exploration status |
| 18 | Black Box entry generation (journal from game history) | `src/engine/save.ts` | Unit: death/victory produce valid journal entry |
| 19 | Black Box placement (side room in rising beat of subsequent game) | `src/engine/pacing.ts` | Unit: placed only if previous run exists for same scenario |
| 20 | Black Box storage (IndexedDB, max 20 entries FIFO) | `src/services/storage.ts` | Unit: 21st entry deletes oldest |
| 21 | Context-aware action suggestions (3 suggestions, exclude secret verbs) | `src/engine/suggestions.ts` | Unit: suggestions are valid, relevant, never secret |
| 22 | Stress test: 500 auto-playthroughs | `tests/stress/scenarioWalkthrough.test.ts` | Every playthrough ends (victory or defeat, never stuck) |
| 23 | Integration test: full scenario completion | `tests/integration/scenarioCompletion.test.ts` | Start-to-end with multiple paths |

## Acceptance Criteria

```bash
npm test                    # All unit tests pass
npm run test:stress         # 500 auto-playthroughs complete
npm run test:integration    # Full scenario completions succeed
```

## Key Design Decisions (Locked In)

- 3 skeletons for launch, 5 total planned
- 15 modules for launch, 30-35 total planned
- 3 settings for launch, 8 total planned
- Module narrative skins: 3 per module (low/mid/high tension)
- DC scales +/-1 per tension delta from module's base tension
- Black Box entries stored in IndexedDB, max 20, separate from save slots
- Black Box placed in side room during rising beat (not critical path)
- Suggestions: always 3, never include secret verbs, context-weighted
- Graph validation: every assembled scenario must be completable and have reachable victory

## Definition of Done

- [ ] 3 skeletons, 15 modules, 3 settings: all fully authored with locale strings
- [ ] `assembleScenario()` produces valid, completable graphs
- [ ] Tension curves validated on every assembly
- [ ] Victory conditions: primary + alternative both testable
- [ ] Black Box: generates journal, stores in IndexedDB, places in future games
- [ ] Threat director: hints escalate, encounters scale with beat
- [ ] 500 auto-playthroughs: 0 stuck games, all end in victory or defeat
- [ ] ENGINE COMPLETE milestone reached
- [ ] CLAUDE.md updated for Phase 7
