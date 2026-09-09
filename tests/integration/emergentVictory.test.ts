// ---------------------------------------------------------------------------
// tests/integration/emergentVictory.test.ts — Decisions Y and P6B-4
// ---------------------------------------------------------------------------
// This test used to write `lethalLocations: ['boss_room']` by hand and then
// play one turn. It validated the last metre and never the road, which is why
// the missing §5.2 safeguards went unnoticed for a whole phase.
//
// It now arms the trap through the world: a consequence depressurizes the room,
// and the victory check reads that state. The safeguards are what it asserts.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { initGame, buildVictoryCheckContext } from '../../src/engine/game';
import { getSceneContext } from '../../src/engine/scene';
import { processTurn } from '../../src/engine/processTurn';
import { applyConsequences } from '../../src/engine/consequences';
import { assembleScenario } from '../../src/engine/pacing';
import { buildParserLocaleData } from '../../src/content/parserData';
import { LAUNCH_SKELETONS } from '../../src/content/scenarios/index';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
import { isLethalLocation } from '../../src/engine/locationState';
import type { GameState } from '../../src/engine/types';

const parserData = buildParserLocaleData('fr');

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function stepTurn(state: GameState, rng: () => number): GameState {
  const context = getSceneContext(state);
  return processTurn(state, 'attendre', context, parserData, rng).newState;
}

function makeState(seed = 1): GameState {
  const rng = seededRng(seed);
  const scenario = assembleScenario(LAUNCH_SKELETONS[0]!, 'quick', ALL_MODULES, rng);
  return initGame(scenario, 'marine', 'survivor', 'T', rng);
}

/** The story has reached the point where the ship is allowed to kill for you. */
function atEscalation(state: GameState): GameState {
  const node = state.scenario!.graph.nodes.find(n => n.isCoreNode && n.beat === 'escalation');
  expect(node, 'skeleton must have an escalation node').toBeDefined();
  return {
    ...state,
    visitedLocations: {
      ...state.visitedLocations,
      [node!.id]: { firstVisited: 0, visitCount: 1, itemsTaken: [], featuresChanged: [], droppedItems: [], obstacleResolved: true },
    },
  };
}

/** Arm the trap the way the game does: through a consequence on the world. */
function depressurize(state: GameState, locationId: string, rng: () => number): GameState {
  return applyConsequences(
    state,
    [{ type: 'environment_change', locationId, locationState: 'depressurized' }],
    getSceneContext(state),
    rng,
  );
}

function withCreatureIn(state: GameState, locationId: string, alive = true): GameState {
  return {
    ...state,
    npcStates: {
      creature: { id: 'creature', locationId, state: { vitality: alive ? 'alive' : 'dead' } },
    },
  };
}

// ---------------------------------------------------------------------------
// The road, not the last metre
// ---------------------------------------------------------------------------

describe('emergentVictory: the trap is armed through the world', () => {
  it('a consequence makes the room lethal — no test ever writes lethalLocations', () => {
    const rng = seededRng(1);
    const state = depressurize(makeState(1), 'boss_room', rng);

    expect(isLethalLocation(state.locationStates['boss_room']!)).toBe(true);
    expect(buildVictoryCheckContext(state).lethalLocations).toContain('boss_room');
  });

  it('kills the creature once the trap has had a turn to settle', () => {
    const rng = seededRng(1);
    let state = withCreatureIn(atEscalation(makeState(1)), 'boss_room');
    state = { ...state, playerLocationId: 'start' };
    state = depressurize(state, 'boss_room', rng);

    // The turn the trap was armed: the check refuses (§5.2).
    state = stepTurn(state, rng);
    expect(state.victoryResult).toBeNull();

    // The turn after: the vacuum has had its time.
    state = stepTurn(state, rng);
    expect(state.victoryResult).not.toBeNull();
    expect(state.victoryResult!.type).toBe('emergent_environmental_kill');
    expect(state.phase).toBe('victory');
  });
});

// ---------------------------------------------------------------------------
// §5.2 safeguards — what the old test could not have caught
// ---------------------------------------------------------------------------

describe('emergentVictory: §5.2 safeguards', () => {
  it('refuses a same-turn kill: arming the trap is not springing it', () => {
    const rng = seededRng(5);
    let state = withCreatureIn(atEscalation(makeState(5)), 'boss_room');
    state = { ...state, playerLocationId: 'start' };
    state = depressurize(state, 'boss_room', rng);

    const ctx = buildVictoryCheckContext(state);
    expect(ctx.lethalLocations).toContain('boss_room');
    expect(ctx.establishedLethalLocations).not.toContain('boss_room');
  });

  it('refuses an emergent victory before the story has escalated', () => {
    const rng = seededRng(6);
    let state = withCreatureIn(makeState(6), 'boss_room'); // never went past the start
    state = { ...state, playerLocationId: 'start' };
    state = depressurize(state, 'boss_room', rng);
    state = stepTurn(state, rng);

    expect(buildVictoryCheckContext(state).beat).toBe('intro');
    expect(state.victoryResult?.type).not.toBe('emergent_environmental_kill');
  });

  it('refuses to hand the win to a player standing in the same vacuum', () => {
    const rng = seededRng(7);
    let state = withCreatureIn(atEscalation(makeState(7)), 'boss_room');
    state = { ...state, playerLocationId: 'boss_room' };
    state = depressurize(state, 'boss_room', rng);
    state = stepTurn(state, rng);

    expect(state.victoryResult?.type).not.toBe('emergent_environmental_kill');
  });

  it('refuses to kill a corpse twice', () => {
    const rng = seededRng(8);
    let state = withCreatureIn(atEscalation(makeState(8)), 'boss_room', false);
    state = { ...state, playerLocationId: 'start' };
    state = depressurize(state, 'boss_room', rng);
    state = stepTurn(state, rng);

    expect(state.victoryResult?.type).not.toBe('emergent_environmental_kill');
  });

  it('a room that is made safe again stops counting', () => {
    const rng = seededRng(9);
    let state = withCreatureIn(atEscalation(makeState(9)), 'boss_room');
    state = { ...state, playerLocationId: 'start' };
    state = depressurize(state, 'boss_room', rng);
    state = applyConsequences(
      state,
      [{ type: 'environment_change', locationId: 'boss_room', locationState: 'pressurized' }],
      getSceneContext(state),
      rng,
    );
    state = stepTurn(state, rng);

    expect(state.victoryResult?.type).not.toBe('emergent_environmental_kill');
  });
});

// ---------------------------------------------------------------------------
// Containment and self-destruct
// ---------------------------------------------------------------------------

describe('emergentVictory: containment', () => {
  it('triggers once the story has escalated and every exit is sealed', () => {
    const rng = seededRng(10);
    let state = withCreatureIn(atEscalation(makeState(10)), 'sealed_room');
    state = { ...state, playerLocationId: 'start', fullyContainedLocations: ['sealed_room'] };

    state = stepTurn(state, rng);
    expect(state.victoryResult?.type).toBe('emergent_containment');
  });

  it('does not trigger before escalation', () => {
    const rng = seededRng(11);
    let state = withCreatureIn(makeState(11), 'sealed_room');
    state = { ...state, playerLocationId: 'start', fullyContainedLocations: ['sealed_room'] };

    state = stepTurn(state, rng);
    expect(state.victoryResult?.type).not.toBe('emergent_containment');
  });

  it('does not trigger on a dead NPC', () => {
    const rng = seededRng(12);
    let state = withCreatureIn(atEscalation(makeState(12)), 'sealed_room', false);
    state = { ...state, playerLocationId: 'start', fullyContainedLocations: ['sealed_room'] };

    state = stepTurn(state, rng);
    expect(state.victoryResult?.type).not.toBe('emergent_containment');
  });
});

describe('emergentVictory: self_destruct', () => {
  it('triggers once the story has escalated', () => {
    const rng = seededRng(20);
    let state = { ...atEscalation(makeState(20)), selfDestructActive: true };

    state = stepTurn(state, rng);
    expect(state.victoryResult).not.toBeNull();
    expect(state.victoryResult!.type).toBe('emergent_self_destruct');
  });

  it('does not trigger while nothing is counting down', () => {
    const rng = seededRng(21);
    let state = atEscalation(makeState(21));
    expect(state.selfDestructActive).toBe(false);

    state = stepTurn(state, rng);
    expect(state.victoryResult?.type).not.toBe('emergent_self_destruct');
  });
});
