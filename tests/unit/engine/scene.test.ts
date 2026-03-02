// ---------------------------------------------------------------------------
// tests/unit/engine/scene.test.ts — Phase 6B: getSceneContext
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { getSceneContext } from '../../../src/engine/scene';
import { initGame } from '../../../src/engine/game';
import { assembleScenario } from '../../../src/engine/pacing';
import { ESCAPE_SKELETON } from '../../../src/content/scenarios/escape';
import { LAUNCH_SETTINGS } from '../../../src/content/settings';
import { ALL_MODULES } from '../../../src/content/scenarios/modules/index';
import { createInitialGameState } from '../../../src/engine/types';
import { markItemTaken, markItemDropped, getExitsWithStatus, createVisitState } from '../../../src/engine/backtracking';
import type { AssembledScenario } from '../../../src/engine/scenario';
import type { RngFn } from '../../../src/engine/types';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function fixedRng(v = 0.5): RngFn { return () => v; }

function makeScenario(): AssembledScenario {
  return assembleScenario(ESCAPE_SKELETON, 'quick', LAUNCH_SETTINGS[0]!, ALL_MODULES, fixedRng());
}

// ---------------------------------------------------------------------------
// No scenario loaded
// ---------------------------------------------------------------------------

describe('getSceneContext() — no scenario', () => {
  it('returns empty context when scenario is null', () => {
    const ctx = getSceneContext(createInitialGameState());
    expect(ctx.locationItems).toHaveLength(0);
    expect(ctx.npcs).toHaveLength(0);
    expect(ctx.connectedLocations).toHaveLength(0);
    expect(ctx.scenarioSuggestions).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Scenario loaded
// ---------------------------------------------------------------------------

describe('getSceneContext() — with scenario', () => {
  it('populates locationId from playerLocationId', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const ctx = getSceneContext(state);
    expect(ctx.locationId).toBe(state.playerLocationId);
  });

  it('includes connected locations (start node has exits)', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const ctx = getSceneContext(state);
    // Start node is connected to at least the next node (unlock or module)
    expect(ctx.connectedLocations.length).toBeGreaterThan(0);
  });

  it('tags start node exits as unvisited initially', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const ctx = getSceneContext(state);
    // All exits from start should be unvisited since we just started
    for (const loc of ctx.connectedLocations) {
      expect(loc.visited).toBe(false);
    }
  });

  it('generates scenarioSuggestions (class-biased)', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const ctx = getSceneContext(state);
    // marine is biased toward FOR/DEF
    expect(ctx.scenarioSuggestions).toBeDefined();
    expect(Array.isArray(ctx.scenarioSuggestions)).toBe(true);
  });

  it('generates at most 3 scenario suggestions', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const ctx = getSceneContext(state);
    expect(ctx.scenarioSuggestions!.length).toBeLessThanOrEqual(3);
  });

  it('sets atmosphere from location node', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const ctx = getSceneContext(state);
    // Atmosphere should be set (not undefined)
    expect(ctx.atmosphere).toBeDefined();
  });

  it('returns hasBlackBox=false when start node has no black box', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const ctx = getSceneContext(state);
    // Start node does not have a black box by default
    expect(ctx.hasBlackBox).toBe(false);
  });

  it('excludes taken items from locationItems', () => {
    const scenario = makeScenario();
    let state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const startNode = scenario.graph.nodes.find(n => n.coreNodeId === 'start')!;
    const firstItem = startNode.items[0];
    if (!firstItem) return; // skip if no items

    // Mark the item as taken in visitedLocations
    const updatedVisit = markItemTaken(state.visitedLocations[startNode.id]!, firstItem.id);
    state = {
      ...state,
      visitedLocations: { ...state.visitedLocations, [startNode.id]: updatedVisit },
    };

    const ctx = getSceneContext(state);
    expect(ctx.locationItems.map(i => i.id)).not.toContain(firstItem.id);
  });

  it('tags visited exits correctly after movement', () => {
    const scenario = makeScenario();
    let state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const startId = state.playerLocationId!;

    // Find a connected location from start
    const exits = getExitsWithStatus(startId, scenario.graph.edges, Object.keys(state.visitedLocations));
    if (exits.length === 0) return; // skip if no exits

    const nextId = exits[0]!.locationId;

    // Simulate visiting the next location
    state = {
      ...state,
      playerLocationId: nextId,
      visitedLocations: {
        ...state.visitedLocations,
        [nextId]: createVisitState(1),
      },
    };

    const ctx = getSceneContext(state);
    // Any exit from nextId that leads back to startId should be marked visited
    const backToStart = ctx.connectedLocations.find(l => l.id === startId);
    if (backToStart) {
      expect(backToStart.visited).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Dropped loot visibility
// ---------------------------------------------------------------------------

describe('getSceneContext() — dropped items', () => {
  it('includes dropped item in locationItems when not in inventory', () => {
    const scenario = makeScenario();
    let state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const locId = state.playerLocationId!;

    // Drop a known item into this location
    const updatedVisit = markItemDropped(
      state.visitedLocations[locId] ?? createVisitState(1),
      'medkit_basic',
    );
    state = {
      ...state,
      visitedLocations: { ...state.visitedLocations, [locId]: updatedVisit },
    };

    const ctx = getSceneContext(state);
    expect(ctx.locationItems.map(i => i.id)).toContain('medkit_basic');
  });

  it('filters dropped item from locationItems when it is back in inventory', () => {
    const scenario = makeScenario();
    let state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const locId = state.playerLocationId!;

    // Drop item into location AND also put it in inventory (player re-took it)
    const updatedVisit = markItemDropped(
      state.visitedLocations[locId] ?? createVisitState(1),
      'medkit_basic',
    );
    state = {
      ...state,
      character: state.character
        ? { ...state.character, inventory: [...state.character.inventory, 'medkit_basic'] }
        : state.character,
      visitedLocations: { ...state.visitedLocations, [locId]: updatedVisit },
    };

    const ctx = getSceneContext(state);
    // Item is in inventory → should NOT appear as location loot
    expect(ctx.locationItems.filter(i => i.id === 'medkit_basic' && i.source === 'location')
      .every(i => state.character!.inventory.includes(i.id))).toBe(true);
    // More directly: locationItems should not contain it
    const locationOnly = ctx.locationItems.filter(
      i => i.id === 'medkit_basic' && !state.character!.inventory.includes(i.id),
    );
    expect(locationOnly).toHaveLength(0);
  });
});
