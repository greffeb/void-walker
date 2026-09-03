# Phase 6B — Game Loop Integration

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — victoire, menace et suivi de visite câblés dans `processTurn`.
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **Status:** PENDING
> **Duration:** 1 week
> **Prerequisites:** Phase 6 complete
> **Inserts between:** Phase 6 (Scenarios & Victory) and Phase 7 (UI)
> **Reference docs:** `docs/reference/SCENARIO_DESIGN.md`, `docs/reference/GAME_SYSTEMS.md` (§9 Save, §11 Victory)

---

## Why This Phase Exists

Phase 6 delivered all the scenario data types and pure engine functions in isolation. Phase 7
(UI) needs `processTurn`, `initGame`, and `getSceneContext` to be scenario-aware so that the
`useGame` hook can drive a real end-to-end playthrough. Phase 6B wires the two together.

**Everything built in Phase 6B is pure engine code** — no DOM, no React, no Zustand. It
completes the engine layer before the UI is built on top.

---

## 1. Brainstorm Gate — Resolved

| Question | Decision |
|----------|----------|
| Where do scenario fields live in GameState? | Extend existing `GameState` in `src/engine/types.ts` with scenario-specific fields (no new god object) |
| How does `initGame` know which scenario to use? | Takes `AssembledScenario` as a parameter; caller (UI layer) is responsible for calling `assembleScenario` first |
| Does `processTurn` call `checkVictory` every turn? | Yes — pure function, cheap, called after action resolution |
| How does the threat director persist? | As `threatDirectorState: ThreatDirectorState` inside `GameState` |
| How do NPC states persist? | As `npcStates: Record<string, NpcState>` in `GameState`, initialized from the assembled graph |
| How do visited locations persist? | As `visitedLocations: Record<string, LocationVisitState>` in `GameState` |
| How are suggestions wired? | `getSceneContext()` calls `generateSuggestions()` with candidates built from current location's obstacle paths |

---

## 2. GameState Extensions

Add to `GameState` in `src/engine/types.ts`:

```typescript
// === Phase 6B additions ===
/** The fully assembled scenario for this game (null until game starts). */
readonly scenario: AssembledScenario | null;
/** Per-location visit tracking (keys are LocationNode IDs). */
readonly visitedLocations: Readonly<Record<string, LocationVisitState>>;
/** Per-NPC alive/location state (keys are NPC IDs). */
readonly npcStates: Readonly<Record<string, NpcState>>;
/** Object/feature IDs that have been activated (e.g. emergency_beacon). */
readonly activatedObjects: readonly string[];
/** Location IDs currently lethally hazardous. */
readonly lethalLocations: readonly string[];
/** Location IDs where ALL graph exits are currently sealed. */
readonly fullyContainedLocations: readonly string[];
/** Key objective IDs permanently destroyed. */
readonly destroyedObjectives: readonly string[];
/** Whether self-destruct has been activated and player is in a safe zone. */
readonly selfDestructActive: boolean;
/** The threat director state machine (persists across turns). */
readonly threatDirectorState: ThreatDirectorState;
/** Victory result, set when checkVictory() returns non-null. */
readonly victoryResult: VictoryResult | null;
/** Defeat condition that triggered game over, if any. */
readonly defeatCondition: DefeatCondition | null;
/** Number of items used so far (for stress test reporting). */
readonly itemsUsedCount: number;
/** Total encounters triggered so far (for stress test reporting). */
readonly encounterCount: number;
```

Update `createInitialGameState()` to include null/empty defaults for all new fields.

---

## 3. New Engine Functions

### 3.1 `initGame` — `src/engine/game.ts`

```typescript
/**
 * Initialize a complete game state from an assembled scenario and player class.
 * This is the single entry point for starting a new game.
 */
export function initGame(
  scenario: AssembledScenario,
  playerClass: PlayerClassName,
  difficulty: DifficultyLevel,
  playerName: string,
  rng: RngFn,
): GameState
```

Responsibilities:
- Create `CharacterState` from class + difficulty
- Place player at `scenario.graph.nodes.find(n => n.coreNodeId === 'start').id`
- Initialize `npcStates` from all `NpcDefinition`s in the graph
- Initialize `threatDirectorState` via `createThreatDirector('intro')`
- Initialize `visitedLocations` with the start node as first visit
- Return a complete `GameState` ready for `processTurn`

### 3.2 `isGameOver` — `src/engine/game.ts`

```typescript
/** True if the game has ended (victory OR defeat). */
export function isGameOver(state: GameState): boolean
```

Returns `state.victoryResult !== null || state.defeatCondition !== null || state.character?.hp <= 0`.

### 3.3 `buildVictoryCheckContext` — `src/engine/game.ts`

```typescript
/** Build the minimal context snapshot for victory checking. */
export function buildVictoryCheckContext(state: GameState): VictoryCheckContext
```

Extracts all required fields from `GameState` into the pure `VictoryCheckContext` shape.

### 3.4 `getSceneContext` extension — `src/engine/game.ts` or `src/engine/scene.ts`

Extend existing `getSceneContext(state)` to:
- Populate `suggestions` using `generateSuggestions(candidates, playerClass, activeSkin)`
  where candidates are built from the current location's `obstacle.paths`
- Populate `connectedLocations` from graph edges, tagged with visit status via `getExitsWithStatus`
- Populate `hasBlackBox` when the current location's `hasBlackBox` flag is set

---

## 4. Turn Loop Integration (`processTurn` additions)

After action resolution, `processTurn` must:

1. **Update visit state** — on movement, call `markRevisit` or `createVisitState` for the new location
2. **Check victory** — call `checkVictory(buildVictoryCheckContext(state), state.scenario.skeleton)` and set `victoryResult` if non-null
3. **Check additional defeat** — call `checkAdditionalDefeat(ctx, skeleton.additionalDefeatConditions)` and set `defeatCondition` if triggered
4. **Run threat director** — call `threatCheck(director, currentLocationHasThreat, rng)` and apply the returned event (encounter/hint/environmental)
5. **Advance beat** — when the player reaches a new core node, call `transitionBeat` on the director

```
processTurn(state, input) {
  1. parse input → ParseResult
  2. resolve action → apply consequences → newState
  3. if movement: update visitedLocations[newLocationId]
  4. build VictoryCheckContext from newState
  5. if victoryResult = checkVictory(ctx, skeleton): newState.victoryResult = victoryResult
  6. else if defeatCondition = checkAdditionalDefeat(ctx, skeleton.additionalDefeatConditions):
       newState.defeatCondition = defeatCondition
  7. { event, updatedDirector } = threatCheck(newState.threatDirectorState, ...)
     apply threat event to newState, newState.threatDirectorState = updatedDirector
  8. return TurnResult
}
```

---

## 5. Deliverables

### Week 1: Core Integration

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Extend `GameState` with Phase 6B fields | `src/engine/types.ts` | Unit: `createInitialGameState()` has correct defaults |
| 2 | `initGame(scenario, class, difficulty, name, rng)` | `src/engine/game.ts` | Unit: starts at start node; all NPCs initialized; threat director at intro beat |
| 3 | `isGameOver(state)` | `src/engine/game.ts` | Unit: true on victoryResult, defeatCondition, hp ≤ 0 |
| 4 | `buildVictoryCheckContext(state)` | `src/engine/game.ts` | Unit: all fields correctly extracted from state |
| 5 | Wire `checkVictory` into `processTurn` | `src/engine/processTurn.ts` | Unit: moving to victory location sets victoryResult |
| 6 | Wire `checkAdditionalDefeat` into `processTurn` | `src/engine/processTurn.ts` | Unit: NPC death triggers defeatCondition |
| 7 | Wire `threatCheck` into `processTurn` | `src/engine/processTurn.ts` | Unit: threat events appear in TurnResult after 3+ turns |
| 8 | Wire visit tracking into `processTurn` (movement actions) | `src/engine/processTurn.ts` | Unit: revisited rooms show correct visitCount |
| 9 | Extend `getSceneContext` with scenario-aware suggestions | `src/engine/scene.ts` | Unit: suggestions generated from obstacle paths; class-biased |
| 10 | Extend `getSceneContext` with exit exploration status | `src/engine/scene.ts` | Unit: unexplored exits appear first |

### Integration Tests (deferred from Phase 6)

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 11 | **Stress test: 500 auto-playthroughs** | `tests/stress/scenarioWalkthrough.test.ts` | 0% stuck (HARD), >10% victory (random bot), >40% victory (goal bot) |
| 12 | Integration test: full scenario completion (all 3 skeletons) | `tests/integration/scenarioCompletion.test.ts` | Primary + alternative victory reachable |
| 13 | Integration test: emergent victory paths | `tests/integration/emergentVictory.test.ts` | Env kill, containment, self-destruct all achievable |
| 14 | Integration test: Black Box round-trip | `tests/integration/blackBox.test.ts` | Die → journal generated → placed → found next game |

---

## 6. Statistical Acceptance Targets (Stress Test)

```
Victory rate (goal-seeking bot):     ≥ 40%
Victory rate (random bot):           ≥ 10%
Stuck rate (both bots):              0%   ← HARD REQUIREMENT
Average turns to completion:         15-40 (standard session)
Average turns to death:              8-25
Locations visited (goal bot, std):   ≥ 60% of available locations
Emergent victory rate (goal bot):    ≤ 15%
```

---

## 7. Acceptance Criteria

```bash
npm test                   # All unit tests pass (including game.ts + processTurn wiring)
npm run test:stress        # 500 auto-playthroughs complete (0 stuck)
npm run test:integration   # All 3 skeletons completable via primary + alternative victory
npm run test:integration   # All 3 emergent victory types achievable
npm run test:integration   # Black Box round-trip works end-to-end
npm run check              # Typecheck + lint + all tests pass
```

---

## 8. Key Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| `initGame` location | `src/engine/game.ts` (new file) | Clean separation from types; imports scenario + victory + threat + backtracking |
| `processTurn` wiring | Additive — extend existing function | Minimizes diff; all existing tests continue to pass |
| Victory check timing | After every action resolution | Cheap pure function; ensures immediate feedback |
| Threat check timing | After victory check | Threat events are narrative, not gameplay-blocking |
| NPC state initialization | From graph NPC definitions at `initGame` | Single source of truth; all NPCs start alive at their spawn location |
| `getSceneContext` suggestion source | Current location's `obstacle.paths` (if obstacle unresolved) | Matches Phase 6 spec; falls back to empty if obstacle already resolved |

---

## 9. Definition of Done

- [ ] `initGame` creates a valid `GameState` for any assembled scenario
- [ ] `processTurn` calls `checkVictory` every turn
- [ ] Moving to the primary victory location sets `victoryResult`
- [ ] Bot stress runner (Phase 6 bots) can drive a complete game to victory or death
- [ ] 0% stuck rate across 500 seeded playthroughs
- [ ] All 3 skeletons have reachable primary victory paths
- [ ] All 3 emergent victory types triggerable via goal bot
- [ ] Black Box entry generated and retrievable after death
- [ ] `npm run check` passes with 0 errors
