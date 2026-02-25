// ---------------------------------------------------------------------------
// tests/integration/emergentVictory.test.ts — Phase 6B integration test
// ---------------------------------------------------------------------------
// Verifies that all 3 emergent victory types are achievable via direct
// state manipulation + processTurn turn, ensuring checkVictory is wired.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { initGame } from '../../src/engine/game';
import { getSceneContext } from '../../src/engine/scene';
import { processTurn } from '../../src/engine/processTurn';
import { assembleScenario } from '../../src/engine/pacing';
import { buildParserLocaleData } from '../../src/content/parserData';
import { LAUNCH_SKELETONS } from '../../src/content/scenarios/index';
import { LAUNCH_SETTINGS } from '../../src/content/settings';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
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
  const result = processTurn(state, 'attendre', context, parserData, rng);
  return result.newState;
}

function makeState(seed = 1): GameState {
  const rng = seededRng(seed);
  const scenario = assembleScenario(LAUNCH_SKELETONS[0]!, 'quick', LAUNCH_SETTINGS[0]!, ALL_MODULES, rng);
  return initGame(scenario, 'marine', 'survivor', 'T', rng);
}

// ---------------------------------------------------------------------------
// Environmental kill
// ---------------------------------------------------------------------------

describe('emergentVictory: environmental_kill', () => {
  it('triggers victory when boss NPC is in a lethal location and player is safe', () => {
    const rng = seededRng(1);
    let state = makeState(1);

    // Set up: creature in a lethal room, player in a different room
    state = {
      ...state,
      playerLocationId: 'start',
      npcStates: {
        creature: { id: 'creature', locationId: 'boss_room', alive: true },
      },
      lethalLocations: ['boss_room'],
    };

    state = stepTurn(state, rng);

    expect(state.victoryResult).not.toBeNull();
    expect(state.victoryResult!.type).toBe('emergent_environmental_kill');
    expect(state.phase).toBe('victory');
  });

  it('does NOT trigger if player is in the same lethal room as the boss', () => {
    const rng = seededRng(2);
    let state = makeState(2);

    state = {
      ...state,
      playerLocationId: 'boss_room',
      npcStates: {
        creature: { id: 'creature', locationId: 'boss_room', alive: true },
      },
      lethalLocations: ['boss_room'],
    };

    state = stepTurn(state, rng);
    // Player is also in the lethal room — emergent environmental kill should NOT trigger
    // (the player would also die)
    expect(state.victoryResult?.type).not.toBe('emergent_environmental_kill');
  });

  it('does NOT trigger if the NPC is already dead', () => {
    const rng = seededRng(3);
    let state = makeState(3);

    state = {
      ...state,
      playerLocationId: 'start',
      npcStates: {
        creature: { id: 'creature', locationId: 'boss_room', alive: false },
      },
      lethalLocations: ['boss_room'],
    };

    state = stepTurn(state, rng);
    expect(state.victoryResult?.type).not.toBe('emergent_environmental_kill');
  });
});

// ---------------------------------------------------------------------------
// Containment
// ---------------------------------------------------------------------------

describe('emergentVictory: containment', () => {
  it('triggers victory when all exits from boss location are sealed', () => {
    const rng = seededRng(10);
    let state = makeState(10);

    state = {
      ...state,
      playerLocationId: 'start',
      npcStates: {
        creature: { id: 'creature', locationId: 'sealed_room', alive: true },
      },
      fullyContainedLocations: ['sealed_room'],
    };

    state = stepTurn(state, rng);

    expect(state.victoryResult).not.toBeNull();
    expect(state.victoryResult!.type).toBe('emergent_containment');
  });

  it('does NOT trigger if NPC is dead', () => {
    const rng = seededRng(11);
    let state = makeState(11);

    state = {
      ...state,
      playerLocationId: 'start',
      npcStates: {
        creature: { id: 'creature', locationId: 'sealed_room', alive: false },
      },
      fullyContainedLocations: ['sealed_room'],
    };

    state = stepTurn(state, rng);
    expect(state.victoryResult?.type).not.toBe('emergent_containment');
  });
});

// ---------------------------------------------------------------------------
// Self-destruct
// ---------------------------------------------------------------------------

describe('emergentVictory: self_destruct', () => {
  it('triggers victory when selfDestructActive is true', () => {
    const rng = seededRng(20);
    let state = makeState(20);

    state = {
      ...state,
      selfDestructActive: true,
    };

    state = stepTurn(state, rng);

    expect(state.victoryResult).not.toBeNull();
    expect(state.victoryResult!.type).toBe('emergent_self_destruct');
  });

  it('does NOT trigger if selfDestructActive is false', () => {
    const rng = seededRng(21);
    let state = makeState(21);
    expect(state.selfDestructActive).toBe(false);

    state = stepTurn(state, rng);
    expect(state.victoryResult?.type).not.toBe('emergent_self_destruct');
  });
});
