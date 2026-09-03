# Phase 4 — Consequences & State Engine

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré.
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **Status:** PENDING
> **Duration:** 1 week
> **Prerequisites:** Phase 3 complete
> **Reference docs:** `GAME_SYSTEMS.md` (SS8-SS9, SS13), `SCENARIO_DESIGN.md` (SS3)

---

## Brainstorm Gate

- [ ] Confirm chain reaction max cascade depth (5)
- [ ] Review Ship Memory mark catalog (all mark types)
- [ ] Confirm failsafe threshold per difficulty preset
- [ ] Decide on state immutability strategy (spread vs Immer)

## Deliverables

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Immutable state transition system | `src/engine/state.ts` | Unit: state never mutated, always returns new |
| 2 | Consequence engine (action outcomes -> state changes) | `src/engine/consequences.ts` | Unit: every consequence type applies correctly |
| 3 | Chain reactions (IGNITE flammable -> room on_fire -> O2 drain) | `src/engine/consequences.ts` | Unit: chains terminate at depth 5 |
| 4 | Environmental propagation (depressurize room, fire spread, flooding) | `src/engine/consequences.ts` | Unit: fire spreads with 3-turn delay |
| 5 | Ship Memory marks (failed actions mark environment) | `src/engine/shipMemory.ts` | Unit: FORCE_OPEN fail -> damaged_frame, DC -2 |
| 6 | Ship Memory DC modifiers (same action easier, new approaches revealed) | `src/engine/shipMemory.ts` | Unit: sameActionDCMod and otherActionDCMod apply |
| 7 | Ship Memory property changes (target gains/loses properties) | `src/engine/shipMemory.ts` | Unit: door gains `damaged_frame`, loses `sealed` |
| 8 | Anti-softlock failsafe system | `src/engine/failsafe.ts` | Unit: triggers at correct threshold per difficulty |
| 9 | Failsafe types (degraded_bypass, narrative_rescue, threat_escalation, alternate_route) | `src/engine/failsafe.ts` | Unit: each type produces valid state change |
| 10 | Obstacle state tracking (attempts, paths tried, resolved flag) | `src/engine/failsafe.ts` | Unit: pathsAttempted set grows correctly |
| 11 | `processTurn()` orchestrator (full turn execution order) | `src/engine/index.ts` | Integration: 13-step execution order correct |
| 12 | Inventory management (add, remove, use, equip, broken state) | `src/engine/inventory.ts` | Unit: equip, use consumable, break/repair |
| 13 | Death check (knockout/second_chance/permadeath per difficulty) | `src/engine/state.ts` | Unit: Explorer knocks out, Nightmare permadeaths |
| 14 | Stress test: consequence chains | `tests/stress/consequenceChains.test.ts` | Every chain terminates, no infinite loops |
| 15 | Stress test: anti-softlock | `tests/stress/antiSoftlock.test.ts` | Every obstacle passable within 10 worst-case attempts |
| 16 | Integration test: 100-turn random games | `tests/integration/multiTurn.test.ts` | State never corrupts, no NaN/undefined |

## Acceptance Criteria

```bash
npm test                    # All unit tests pass
npm run test:stress         # Chains terminate, all obstacles passable
npm run test:integration    # 100-turn games: state never corrupts
```

## Key Design Decisions (Locked In)

- State is immutable: every function returns new state (no mutations)
- Chain reaction max depth: 5 (prevent infinite cascades)
- Fire spreads with 3-turn delay (BALANCE.FIRE_SPREAD_DELAY)
- Ship Memory marks are permanent for the duration of the scenario
- Failsafe thresholds: Explorer 2, Survivor 4, Nightmare disabled
- `processTurn()` follows the exact 13-step execution order from GAME_SYSTEMS.md SS13
- Death check happens twice per turn: after player action AND after NPC reaction

## Turn Execution Order (from GAME_SYSTEMS.md SS13)

```
1. Player input -> ParsedAction
2. Creativity check -> DC bonus
3. Condition tick -> HP drain, timer decrement
4. Oxygen tick -> O2 drain, HP drain if O2 = 0
5. Action resolution -> D20 roll
6. Consequence application -> state changes, condition triggers, death check
7. NPC reaction -> NPC attacks/flees, death check again
8. Stalker clock check -> increment, threshold events
9. Threat director check -> encounter roll
10. Narrative composition (placeholder -- Phase 5)
```

## Definition of Done

- [ ] `processTurn(state, input)` returns new state + narrative + suggestions
- [ ] Chain reactions: IGNITE -> fire -> O2 drain, terminates correctly
- [ ] Ship Memory: 7+ mark types implemented, DC modifiers apply
- [ ] Failsafe: triggers at correct thresholds, all 4 types work
- [ ] 100-turn random games: 0 state corruption, 0 NaN
- [ ] All obstacles passable in stress test
- [ ] CLAUDE.md updated for Phase 5
