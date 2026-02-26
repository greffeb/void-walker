// ---------------------------------------------------------------------------
// tests/unit/engine/sceneEnriched.test.ts — Chantier 3, C3-1, C3-2, C3-3
// ---------------------------------------------------------------------------
// Tests for enriched feature/item resolution in scene.ts:
// - C3-1: featureDefToInstance resolves enriched properties + state
// - C3-2: getSceneContext filters items by revealedBy
// - C3-3: enriched aliases are injected into scene targets
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { getSceneContext } from '../../../src/engine/scene';
import { createInitialGameState } from '../../../src/engine/types';
import type { GameState } from '../../../src/engine/types';
import type {
  AssembledScenario, LocationGraph, LocationNode,
  ScenarioFeatureDefinition, ScenarioItemDefinition,
} from '../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// MINIMAL FIXTURES
// ---------------------------------------------------------------------------

function makeFeature(overrides: Partial<ScenarioFeatureDefinition> & { id: string }): ScenarioFeatureDefinition {
  return {
    featureType: 'container',
    initialState: 'intact',
    aliases: { fr: ['feature'], en: ['feature'] },
    descriptions: {
      default: { fr: 'Une feature.', en: 'A feature.' },
    },
    ...overrides,
  } as ScenarioFeatureDefinition;
}

function makeItem(overrides: Partial<ScenarioItemDefinition> & { id: string }): ScenarioItemDefinition {
  return {
    itemType: 'generic',
    aliases: { fr: ['objet'], en: ['item'] },
    description: { fr: 'Un objet.', en: 'An item.' },
    ...overrides,
  } as ScenarioItemDefinition;
}

function makeNode(overrides: Partial<LocationNode> = {}): LocationNode {
  return {
    id: 'test_room',
    nameKey: { fr: 'Salle de test', en: 'Test room' },
    features: [],
    items: [],
    npcs: [],
    atmosphere: 'pressurized',
    isCoreNode: true,
    coreNodeId: 'start',
    beat: 'intro',
    ...overrides,
  } as LocationNode;
}

function makeScenario(nodes: LocationNode[]): AssembledScenario {
  const edges = nodes.length > 1
    ? [{ from: nodes[0]!.id, to: nodes[1]!.id, locked: false }]
    : [];
  return {
    skeleton: {
      id: 'escape',
      name: { fr: 'Test', en: 'Test' },
      nodes: [],
      victoryConditions: [],
      additionalDefeatConditions: [],
    },
    modules: [],
    graph: { nodes, edges } as LocationGraph,
    setting: { id: 'derelict_ship', name: { fr: 'Test', en: 'Test' }, locationNames: {} } as unknown as import('../../../src/engine/scenario').SettingDefinition,
    sessionLength: 'quick',
  } as AssembledScenario;
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    turn: 1,
    difficulty: 'survivor',
    scenarioId: 'escape',
    character: {
      name: 'Test',
      className: 'marine',
      stats: { FOR: 3, DEF: 2, AGI: 2, INT: 1, PER: 2, CHA: 1, LCK: 1 },
      hp: 20,
      maxHp: 25,
      oxygen: 100,
      inventory: [],
      equippedWeapon: null,
      equippedArmor: null,
      conditions: [],
      durability: {},
      actionsInColdZone: 0,
      actionsWithoutRest: 0,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// C3-1: ENRICHED FEATURE RESOLUTION
// ---------------------------------------------------------------------------

describe('C3-1: scene.ts enriched feature resolution', () => {
  it('feature with featureType:"container" resolves container/openable properties', () => {
    const feat = makeFeature({ id: 'locker', featureType: 'container', initialState: 'intact' });
    const node = makeNode({ id: 'start', features: [feat], items: [] });
    const scenario = makeScenario([node]);
    const state = makeState({ scenario, playerLocationId: 'start', visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } } });

    const ctx = getSceneContext(state);
    const resolved = ctx.environmentFeatures.find(f => f.id === 'locker');
    expect(resolved).toBeDefined();
    expect(resolved!.properties).toContain('openable');
  });

  it('feature in "locked" state has locked property, not open', () => {
    const feat = makeFeature({ id: 'door', featureType: 'door', initialState: 'locked' });
    const node = makeNode({ id: 'start', features: [feat], items: [] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
      featureStates: { door: 'locked' },
    });

    const ctx = getSceneContext(state);
    const resolved = ctx.environmentFeatures.find(f => f.id === 'door');
    expect(resolved).toBeDefined();
    expect(resolved!.properties).toContain('locked');
    expect(resolved!.properties).not.toContain('open');
  });

  it('feature in "open" state has open property, not locked', () => {
    const feat = makeFeature({ id: 'door', featureType: 'door', initialState: 'locked' });
    const node = makeNode({ id: 'start', features: [feat], items: [] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
      featureStates: { door: 'open' },
    });

    const ctx = getSceneContext(state);
    const resolved = ctx.environmentFeatures.find(f => f.id === 'door');
    expect(resolved).toBeDefined();
    expect(resolved!.properties).toContain('open');
    expect(resolved!.properties).not.toContain('locked');
  });

  it('enriched item with itemType:"weapon" resolves weapon properties', () => {
    const item = makeItem({ id: 'knife', itemType: 'weapon' });
    const node = makeNode({ id: 'start', features: [], items: [item] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
    });

    const ctx = getSceneContext(state);
    const resolved = ctx.locationItems.find(i => i.id === 'knife');
    expect(resolved).toBeDefined();
    // Weapon type should have weapon-like properties
    expect(resolved!.properties).toContain('tangible');
  });

  it('feature without enrichment falls back to [tangible, visible]', () => {
    // A plain feature definition (no featureType, not enriched)
    const plainFeat = { id: 'plain_thing' } as unknown as ScenarioFeatureDefinition;
    const node = makeNode({ id: 'start', features: [plainFeat], items: [] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
    });

    const ctx = getSceneContext(state);
    const resolved = ctx.environmentFeatures.find(f => f.id === 'plain_thing');
    expect(resolved).toBeDefined();
    expect(resolved!.properties).toEqual(['tangible', 'visible']);
  });

  it('item without enrichment falls back to [tangible, liftable, small]', () => {
    const plainItem = { id: 'plain_item' } as unknown as ScenarioItemDefinition;
    const node = makeNode({ id: 'start', features: [], items: [plainItem] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
    });

    const ctx = getSceneContext(state);
    const resolved = ctx.locationItems.find(i => i.id === 'plain_item');
    expect(resolved).toBeDefined();
    expect(resolved!.properties).toEqual(['tangible', 'liftable', 'small']);
  });
});

// ---------------------------------------------------------------------------
// C3-2: ITEM VISIBILITY (revealedBy)
// ---------------------------------------------------------------------------

describe('C3-2: scene.ts item filtering by revealedBy', () => {
  const locker = makeFeature({
    id: 'locker',
    featureType: 'container',
    initialState: 'locked',
  });

  const hiddenItem = makeItem({
    id: 'keycard',
    itemType: 'key_item',
    hidden: true,
    revealedBy: { featureId: 'locker', requiredState: 'open' },
  });

  it('item without revealedBy is always visible', () => {
    const visibleItem = makeItem({ id: 'flashlight', itemType: 'tool' });
    const node = makeNode({ id: 'start', features: [locker], items: [visibleItem] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
    });

    const ctx = getSceneContext(state);
    expect(ctx.locationItems.find(i => i.id === 'flashlight')).toBeDefined();
  });

  it('item with revealedBy is hidden when feature not in required state', () => {
    const node = makeNode({ id: 'start', features: [locker], items: [hiddenItem] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
      featureStates: { locker: 'locked' },
    });

    const ctx = getSceneContext(state);
    expect(ctx.locationItems.find(i => i.id === 'keycard')).toBeUndefined();
  });

  it('item with revealedBy is visible when feature in required state', () => {
    const node = makeNode({ id: 'start', features: [locker], items: [hiddenItem] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
      featureStates: { locker: 'open' },
    });

    const ctx = getSceneContext(state);
    expect(ctx.locationItems.find(i => i.id === 'keycard')).toBeDefined();
  });

  it('item is visible when explicitly revealed in state.revealedItems', () => {
    const node = makeNode({ id: 'start', features: [locker], items: [hiddenItem] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
      featureStates: { locker: 'locked' },  // NOT open
      revealedItems: { locker: true },        // But revealedItems says yes
    });

    const ctx = getSceneContext(state);
    expect(ctx.locationItems.find(i => i.id === 'keycard')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// C3-3: ENRICHED ALIASES
// ---------------------------------------------------------------------------

describe('C3-3: scene.ts enriched aliases injection', () => {
  it('enriched feature aliases include inline French aliases', () => {
    const feat = makeFeature({
      id: 'emergency_locker',
      featureType: 'container',
      aliases: { fr: ['casier', 'casier d\'urgence', 'armoire'], en: ['locker', 'emergency locker'] },
    });
    const node = makeNode({ id: 'start', features: [feat], items: [] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
    });

    const ctx = getSceneContext(state);
    const resolved = ctx.environmentFeatures.find(f => f.id === 'emergency_locker');
    expect(resolved).toBeDefined();
    expect(resolved!.aliases).toContain('casier');
    expect(resolved!.aliases).toContain('casier d\'urgence');
  });

  it('enriched item aliases include inline French aliases', () => {
    const item = makeItem({
      id: 'access_keycard',
      itemType: 'key_item',
      aliases: { fr: ['badge', 'badge d\'acces', 'keycard', 'carte'], en: ['keycard'] },
    });
    const node = makeNode({ id: 'start', features: [], items: [item] });
    const scenario = makeScenario([node]);
    const state = makeState({
      scenario,
      playerLocationId: 'start',
      visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
    });

    const ctx = getSceneContext(state);
    const resolved = ctx.locationItems.find(i => i.id === 'access_keycard');
    expect(resolved).toBeDefined();
    expect(resolved!.aliases).toContain('badge');
    expect(resolved!.aliases).toContain('badge d\'acces');
  });
});
