// ---------------------------------------------------------------------------
// tests/unit/engine/microModules.test.ts — Micro-Module System unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  computeSlots,
  computeTypeWeights,
  weightedPick,
  fillMicroModuleSlots,
  buildMicroModuleNodes,
  initMicroModuleStates,
  processPassivePerceptionCheck,
  processActivePerceptionCheck,
  revealHiddenMicroModule,
  checkHintReveal,
  activateCreatureAmbush,
  tickCreatureAmbush,
  resolveCreatureConfrontation,
  markMicroModuleVisited,
  getMicroModuleNodeId,
  getMicroModulesAtParent,
} from '../../../src/engine/microModules';
import type { RngFn, GameState } from '../../../src/engine/types';
import type {
  LocationNode,
  LocationGraph,
  CoreSkeleton,
  MicroModule,
  PlacedMicroModule,
  MicroModuleState,
  LoreFragment,
  AssembledScenario,
} from '../../../src/engine/scenario';
import { BALANCE } from '../../../src/engine/constants';

// ---------------------------------------------------------------------------
// TEST UTILITIES
// ---------------------------------------------------------------------------

function fixedRng(value: number): RngFn { return () => value; }

function ls(fr: string): LocaleString { return { fr, en: '' }; }

// ---------------------------------------------------------------------------
// MINIMAL FIXTURES
// ---------------------------------------------------------------------------

function makeNode(overrides: Partial<LocationNode> = {}): LocationNode {
  return {
    id: 'test_node',
    nameKey: ls('Test Node'),
    role: 'passage',
    beat: 'rising',
    tension: 4,
    isCoreNode: false,
    onCriticalPath: false,
    items: [],
    features: [],
    atmosphere: 'pressurized',
    ...overrides,
  };
}

function makeCoreNode(coreNodeId: string, beat: string = 'intro'): LocationNode {
  return makeNode({
    id: coreNodeId,
    coreNodeId,
    beat: beat as LocationNode['beat'],
    isCoreNode: true,
  });
}

function makeMicroModule(overrides: Partial<MicroModule> = {}): MicroModule {
  return {
    id: 'mm_test',
    type: 'loot',
    validParentRoles: ['passage', 'hub', 'dead_end'],
    validBeats: ['rising', 'midpoint'],
    visibility: 'open',
    locationRole: 'dead_end',
    features: [],
    locale: {
      fr: {
        description: 'Test module.',
        hintText: 'A hint.',
        revisitDescription: 'Revisited.',
      },
    },
    ...overrides,
  } as MicroModule;
}

function makeMinimalSkeleton(overrides: Partial<CoreSkeleton> = {}): CoreSkeleton {
  return {
    id: 'escape',
    nameKey: ls('Test'),
    descriptionKey: ls('A test skeleton'),
    nodes: [],
    gateItem: 'access_keycard',
    gateItemLocation: 'start',
    revelation: ls('The truth'),
    escalationTrigger: ls('Things get worse'),
    bossType: 'escape',
    primaryVictory: { type: 'reach_location', locationId: 'resolution' },
    alternativeVictory: { type: 'reach_location', locationId: 'resolution' },
    emergentVictoryHint: ls('Be creative'),
    additionalDefeatConditions: [],
    nodeLocations: {},
    theme: {
      id: 'derelict_ship',
      nameKey: ls('Derelict'),
      supportedRoles: ['passage', 'control_room', 'storage', 'medical', 'quarters', 'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock'],
      locationNames: {
        passage: [ls('Couloir A'), ls('Couloir B'), ls('Couloir C')],
        dead_end: [ls('Impasse A'), ls('Impasse B'), ls('Impasse C')],
        hub: [ls('Carrefour A'), ls('Carrefour B')],
        storage: [ls('Soute A'), ls('Soute B')],
        control_room: [ls('Contrôle A'), ls('Contrôle B')],
        medical: [ls('Infirmerie A')],
        quarters: [ls('Quartiers A')],
        hazard_zone: [ls('Zone danger A')],
        engineering: [ls('Atelier A')],
        airlock: [ls('Sas A')],
      },
      features: [],
      preferredItems: [],
    },
    ...overrides,
  } as CoreSkeleton;
}

function makeGameStateWithScenario(
  placed: readonly PlacedMicroModule[],
  mmStates: Readonly<Record<string, MicroModuleState>>,
  overrides: Partial<GameState> = {},
): GameState {
  return {
    turn: 5,
    playerLocationId: 'test_node',
    character: {
      name: 'Test',
      classId: 'marine',
      stats: { FOR: 3, DEF: 2, AGI: 3, INT: 2, PER: 3, CHA: 1, LCK: 1 },
      hp: 20,
      maxHp: 20,
      o2: 100,
      inventory: [{ id: 'torch', nameKey: ls('Torche'), properties: ['light_source'] }],
      equippedWeapon: null,
      equippedArmor: null,
      conditions: [],
      durability: {},
      actionsInColdZone: 0,
      actionsWithoutRest: 0,
    },
    scenario: {
      skeleton: makeMinimalSkeleton(),
      modules: [],
      graph: {
        nodes: [makeNode()],
        edges: [],
      },
      sessionLength: 'standard',
      placedMicroModules: placed,
    } as unknown as AssembledScenario,
    visitedLocations: {
      test_node: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false },
    },
    microModuleStates: mmStates,
    scenarioFlags: {},
    ...overrides,
  } as unknown as GameState;
}

function makeLoreFragment(id: string, beat: string = 'rising'): LoreFragment {
  return {
    id,
    text: ls(`Lore text for ${id}`),
    compatibleSupports: ['data_terminal', 'environmental_trace'],
    validBeats: [beat as LoreFragment['validBeats'][number]],
    feedsBlackBox: true,
  };
}

// ===========================================================================
// TESTS
// ===========================================================================

// ---------------------------------------------------------------------------
// computeSlots
// ---------------------------------------------------------------------------

describe('computeSlots', () => {
  it('returns 0 for start core node', () => {
    expect(computeSlots(makeCoreNode('start'), 'standard')).toBe(0);
  });

  it('returns 0 for resolution core node', () => {
    expect(computeSlots(makeCoreNode('resolution'), 'standard')).toBe(0);
  });

  it('returns 0 for boss core node', () => {
    expect(computeSlots(makeCoreNode('boss', 'climax'), 'standard')).toBe(0);
  });

  it('quick mode: 1 slot for unlock/reveal, 0 otherwise', () => {
    expect(computeSlots(makeCoreNode('unlock', 'rising'), 'quick')).toBe(1);
    expect(computeSlots(makeCoreNode('reveal', 'midpoint'), 'quick')).toBe(1);
    expect(computeSlots(makeCoreNode('escalation', 'escalation'), 'quick')).toBe(0);
    expect(computeSlots(makeNode({ beat: 'rising' }), 'quick')).toBe(0);
  });

  it('standard mode: beat-based allocation', () => {
    expect(computeSlots(makeNode({ beat: 'intro' }), 'standard')).toBe(1);
    expect(computeSlots(makeNode({ beat: 'rising' }), 'standard')).toBe(2);
    expect(computeSlots(makeNode({ beat: 'midpoint' }), 'standard')).toBe(1);
    expect(computeSlots(makeNode({ beat: 'escalation' }), 'standard')).toBe(1);
    expect(computeSlots(makeNode({ beat: 'climax' }), 'standard')).toBe(0);
    expect(computeSlots(makeNode({ beat: 'resolution' }), 'standard')).toBe(0);
  });

  it('extended mode uses same beat-based logic as standard', () => {
    expect(computeSlots(makeNode({ beat: 'rising' }), 'extended')).toBe(2);
    expect(computeSlots(makeNode({ beat: 'escalation' }), 'extended')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// computeTypeWeights
// ---------------------------------------------------------------------------

describe('computeTypeWeights', () => {
  it('returns base weights when no modules placed', () => {
    const weights = computeTypeWeights([], 'rising');
    expect(weights).toEqual(BALANCE.MICRO_MODULES.TYPE_WEIGHTS.rising);
  });

  it('applies light dampening at light threshold', () => {
    const placed: PlacedMicroModule[] = Array.from({ length: BALANCE.MICRO_MODULES.OVERREP_LIGHT_THRESHOLD }, (_, i) => ({
      microModule: makeMicroModule({ id: `mm_loot_${i}`, type: 'loot' }),
      parentNodeId: 'n',
      creatureActive: false,
    }));
    const weights = computeTypeWeights(placed, 'rising');
    const base = BALANCE.MICRO_MODULES.TYPE_WEIGHTS.rising;
    expect(weights.loot).toBeCloseTo(base.loot * BALANCE.MICRO_MODULES.OVERREP_LIGHT_FACTOR);
    expect(weights.encounter).toBe(base.encounter); // unaffected
  });

  it('applies heavy dampening at heavy threshold', () => {
    const placed: PlacedMicroModule[] = Array.from({ length: BALANCE.MICRO_MODULES.OVERREP_HEAVY_THRESHOLD }, (_, i) => ({
      microModule: makeMicroModule({ id: `mm_enc_${i}`, type: 'encounter' }),
      parentNodeId: 'n',
      creatureActive: false,
    }));
    const weights = computeTypeWeights(placed, 'midpoint');
    const base = BALANCE.MICRO_MODULES.TYPE_WEIGHTS.midpoint;
    expect(weights.encounter).toBeCloseTo(base.encounter * BALANCE.MICRO_MODULES.OVERREP_HEAVY_FACTOR);
    expect(weights.lore).toBe(base.lore);
  });
});

// ---------------------------------------------------------------------------
// weightedPick
// ---------------------------------------------------------------------------

describe('weightedPick', () => {
  it('picks the only candidate when there is one', () => {
    const mm = makeMicroModule({ id: 'solo' });
    const result = weightedPick([mm], { loot: 1, lore: 1, encounter: 1, ambiance: 1 }, fixedRng(0));
    expect(result.id).toBe('solo');
  });

  it('favors higher-weighted types', () => {
    const loot = makeMicroModule({ id: 'mm_loot', type: 'loot' });
    const encounter = makeMicroModule({ id: 'mm_enc', type: 'encounter' });
    // Weight loot 100x more
    const weights = { loot: 100, lore: 0, encounter: 1, ambiance: 0 };
    // With rng close to 0, should pick the first high-weight option
    const result = weightedPick([loot, encounter], weights, fixedRng(0.01));
    expect(result.id).toBe('mm_loot');
  });
});

// ---------------------------------------------------------------------------
// fillMicroModuleSlots
// ---------------------------------------------------------------------------

describe('fillMicroModuleSlots', () => {
  const unlockNode = makeNode({
    id: 'unlock', coreNodeId: 'unlock', beat: 'rising', isCoreNode: true,
    role: 'passage',
  });
  const revealNode = makeNode({
    id: 'reveal', coreNodeId: 'reveal', beat: 'midpoint', isCoreNode: true,
    role: 'hub',
  });
  const startNode = makeNode({
    id: 'start', coreNodeId: 'start', beat: 'intro', isCoreNode: true,
    role: 'hub',
  });

  const graph: LocationGraph = {
    nodes: [startNode, unlockNode, revealNode],
    edges: [
      { from: 'start', to: 'unlock', bidirectional: true },
      { from: 'unlock', to: 'reveal', bidirectional: true },
    ],
  };

  const modules: readonly MicroModule[] = [
    makeMicroModule({ id: 'mm_a', validParentRoles: ['passage', 'hub'], validBeats: ['rising', 'midpoint'] }),
    makeMicroModule({ id: 'mm_b', validParentRoles: ['passage', 'hub'], validBeats: ['rising', 'midpoint'], type: 'lore' }),
    makeMicroModule({ id: 'mm_c', validParentRoles: ['passage', 'hub'], validBeats: ['rising', 'midpoint'], type: 'encounter' }),
    makeMicroModule({ id: 'mm_d', validParentRoles: ['passage', 'hub'], validBeats: ['rising', 'midpoint'], type: 'ambiance' }),
    makeMicroModule({ id: 'mm_e', validParentRoles: ['passage', 'hub'], validBeats: ['rising', 'midpoint'] }),
  ];

  it('does not place in start/resolution/boss core nodes', () => {
    const placed = fillMicroModuleSlots(graph, makeMinimalSkeleton(), modules, 'standard', fixedRng(0.5));
    const parentIds = placed.map(p => p.parentNodeId);
    expect(parentIds).not.toContain('start');
  });

  it('no duplicate micro-module IDs across placements', () => {
    const placed = fillMicroModuleSlots(graph, makeMinimalSkeleton(), modules, 'standard', fixedRng(0.3));
    const ids = placed.map(p => p.microModule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('respects validParentRoles filter', () => {
    const restrictedMMs = [
      makeMicroModule({ id: 'mm_storage_only', validParentRoles: ['storage'], validBeats: ['rising'] }),
    ];
    // unlock node has role 'passage', not 'storage'
    const placed = fillMicroModuleSlots(graph, makeMinimalSkeleton(), restrictedMMs, 'standard', fixedRng(0.5));
    expect(placed.length).toBe(0);
  });

  it('respects validSkeletons filter', () => {
    const rescueOnly = [
      makeMicroModule({ id: 'mm_rescue', validSkeletons: ['rescue'], validParentRoles: ['passage'], validBeats: ['rising'] }),
    ];
    const skeleton = makeMinimalSkeleton({ id: 'escape' });
    const placed = fillMicroModuleSlots(graph, skeleton, rescueOnly, 'standard', fixedRng(0.5));
    expect(placed.length).toBe(0);
  });

  it('assigns lore fragment to lore-type modules', () => {
    const loreModule = makeMicroModule({
      id: 'mm_lore_test', type: 'lore',
      validParentRoles: ['passage', 'hub'], validBeats: ['rising', 'midpoint'],
      loreData: { supportType: 'data_terminal', accessStat: 'INT', accessDC: 10, loreText: ls(''), failureText: ls(''), feedsBlackBox: true },
    });
    const lorePool: LoreFragment[] = [
      makeLoreFragment('frag_1', 'rising'),
      makeLoreFragment('frag_2', 'midpoint'),
    ];
    const skeleton = makeMinimalSkeleton({ lorePool });
    const placed = fillMicroModuleSlots(graph, skeleton, [loreModule], 'standard', fixedRng(0.5));
    const lorePlaced = placed.filter(p => p.microModule.type === 'lore');
    if (lorePlaced.length > 0) {
      expect(lorePlaced[0]!.assignedLoreFragment).toBeDefined();
    }
  });

  it('quick mode places only on unlock/reveal core nodes', () => {
    const placed = fillMicroModuleSlots(graph, makeMinimalSkeleton(), modules, 'quick', fixedRng(0.5));
    for (const p of placed) {
      const node = graph.nodes.find(n => n.id === p.parentNodeId);
      expect(node?.coreNodeId).toMatch(/^(unlock|reveal)$/);
    }
  });
});

// ---------------------------------------------------------------------------
// buildMicroModuleNodes
// ---------------------------------------------------------------------------

describe('buildMicroModuleNodes', () => {
  const parentNode = makeNode({ id: 'parent', role: 'passage', beat: 'rising' });
  const mm = makeMicroModule({ id: 'mm_test_build', locationRole: 'dead_end' });
  const placed: PlacedMicroModule[] = [
    { microModule: mm, parentNodeId: 'parent', creatureActive: false },
  ];

  it('creates one node per placed micro-module', () => {
    const { nodes, edges } = buildMicroModuleNodes(placed, makeMinimalSkeleton(), [parentNode], fixedRng(0.5), new Set());
    expect(nodes.length).toBe(1);
    expect(edges.length).toBe(1);
  });

  it('node is linked bidirectionally to parent', () => {
    const { edges } = buildMicroModuleNodes(placed, makeMinimalSkeleton(), [parentNode], fixedRng(0.5), new Set());
    expect(edges[0]!.from).toBe('parent');
    expect(edges[0]!.bidirectional).toBe(true);
  });

  it('node is marked as micro-module with correct IDs', () => {
    const { nodes } = buildMicroModuleNodes(placed, makeMinimalSkeleton(), [parentNode], fixedRng(0.5), new Set());
    expect(nodes[0]!.isMicroModule).toBe(true);
    expect(nodes[0]!.microModuleId).toBe('mm_test_build');
    expect(nodes[0]!.parentNodeId).toBe('parent');
  });

  it('inherits beat and tension from parent node', () => {
    const { nodes } = buildMicroModuleNodes(placed, makeMinimalSkeleton(), [parentNode], fixedRng(0.5), new Set());
    expect(nodes[0]!.beat).toBe('rising');
    expect(nodes[0]!.tension).toBe(parentNode.tension);
  });
});

// ---------------------------------------------------------------------------
// initMicroModuleStates
// ---------------------------------------------------------------------------

describe('initMicroModuleStates', () => {
  it('open modules start revealed', () => {
    const placed: PlacedMicroModule[] = [
      { microModule: makeMicroModule({ id: 'mm_open', visibility: 'open' }), parentNodeId: 'p', creatureActive: false },
    ];
    const states = initMicroModuleStates(placed);
    expect(states.mm_open!.revealed).toBe(true);
  });

  it('hidden modules start unrevealed', () => {
    const placed: PlacedMicroModule[] = [
      { microModule: makeMicroModule({ id: 'mm_hidden', visibility: 'hidden', hiddenDC: 12 }), parentNodeId: 'p', creatureActive: false },
    ];
    const states = initMicroModuleStates(placed);
    expect(states.mm_hidden!.revealed).toBe(false);
  });

  it('all states start unvisited with no creature', () => {
    const placed: PlacedMicroModule[] = [
      { microModule: makeMicroModule({ id: 'mm_x' }), parentNodeId: 'p', creatureActive: false },
    ];
    const states = initMicroModuleStates(placed);
    expect(states.mm_x!.visited).toBe(false);
    expect(states.mm_x!.creatureActive).toBe(false);
    expect(states.mm_x!.creatureTurnsRemaining).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// processPassivePerceptionCheck
// ---------------------------------------------------------------------------

describe('processPassivePerceptionCheck', () => {
  const hiddenMM = makeMicroModule({ id: 'mm_hidden_test', visibility: 'hidden', hiddenDC: 12 });

  function makeStateWithHidden(): GameState {
    const placed: PlacedMicroModule[] = [
      { microModule: hiddenMM, parentNodeId: 'test_node', creatureActive: false },
    ];
    const states: Record<string, MicroModuleState> = {
      mm_hidden_test: {
        microModuleId: 'mm_hidden_test',
        revealed: false,
        visited: false,
        passiveCheckDone: false,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    return makeGameStateWithScenario(placed, states);
  }

  it('reveals hidden module when roll >= DC', () => {
    // rng=0.99 → roll=20, +PER(3) = 23 >= 12 → revealed
    const result = processPassivePerceptionCheck(makeStateWithHidden(), 'test_node', 3, fixedRng(0.99));
    expect(result.microModuleStates.mm_hidden_test!.revealed).toBe(true);
    expect(result.microModuleStates.mm_hidden_test!.passiveCheckDone).toBe(true);
  });

  it('does not reveal when roll < DC', () => {
    // rng=0.0 → roll=1, +PER(3) = 4 < 12 → not revealed
    const result = processPassivePerceptionCheck(makeStateWithHidden(), 'test_node', 3, fixedRng(0.0));
    expect(result.microModuleStates.mm_hidden_test!.revealed).toBe(false);
    expect(result.microModuleStates.mm_hidden_test!.passiveCheckDone).toBe(true);
  });

  it('does not re-check if passiveCheckDone is true', () => {
    const state = makeStateWithHidden();
    const done: GameState = {
      ...state,
      microModuleStates: {
        ...state.microModuleStates,
        mm_hidden_test: {
          ...state.microModuleStates.mm_hidden_test!,
          passiveCheckDone: true,
        },
      },
    };
    // Even with a high roll, should not change
    const result = processPassivePerceptionCheck(done, 'test_node', 10, fixedRng(0.99));
    expect(result.microModuleStates.mm_hidden_test!.revealed).toBe(false);
  });

  it('returns unchanged state when no scenario', () => {
    const noScenario = { ...makeStateWithHidden(), scenario: null } as unknown as GameState;
    const result = processPassivePerceptionCheck(noScenario, 'test_node', 5, fixedRng(0.99));
    expect(result).toBe(noScenario);
  });
});

// ---------------------------------------------------------------------------
// processActivePerceptionCheck
// ---------------------------------------------------------------------------

describe('processActivePerceptionCheck', () => {
  it('uses reduced DC (DC - ACTIVE_PER_DC_REDUCTION)', () => {
    const mm = makeMicroModule({ id: 'mm_active_test', visibility: 'hidden', hiddenDC: 12 });
    const placed: PlacedMicroModule[] = [
      { microModule: mm, parentNodeId: 'test_node', creatureActive: false },
    ];
    const states: Record<string, MicroModuleState> = {
      mm_active_test: {
        microModuleId: 'mm_active_test',
        revealed: false,
        visited: false,
        passiveCheckDone: false,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    const state = makeGameStateWithScenario(placed, states);

    // Effective DC = 12 - 2 = 10. rng=0.49 → roll=10, +PER(3) = 13 >= 10 → revealed
    const { newState, revealed } = processActivePerceptionCheck(state, 'test_node', 3, fixedRng(0.49));
    expect(revealed).toContain('mm_active_test');
    expect(newState.microModuleStates.mm_active_test!.revealed).toBe(true);
  });

  it('returns empty revealed array when nothing found', () => {
    const state = makeGameStateWithScenario([], {});
    const { revealed } = processActivePerceptionCheck(state, 'test_node', 5, fixedRng(0.99));
    expect(revealed).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// revealHiddenMicroModule
// ---------------------------------------------------------------------------

describe('revealHiddenMicroModule', () => {
  it('sets revealed to true', () => {
    const states: Record<string, MicroModuleState> = {
      mm_x: {
        microModuleId: 'mm_x',
        revealed: false,
        visited: false,
        passiveCheckDone: false,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    const state = makeGameStateWithScenario([], states);
    const result = revealHiddenMicroModule(state, 'mm_x');
    expect(result.microModuleStates.mm_x!.revealed).toBe(true);
  });

  it('returns unchanged state if already revealed', () => {
    const states: Record<string, MicroModuleState> = {
      mm_x: {
        microModuleId: 'mm_x',
        revealed: true,
        visited: false,
        passiveCheckDone: true,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    const state = makeGameStateWithScenario([], states);
    const result = revealHiddenMicroModule(state, 'mm_x');
    expect(result).toBe(state); // same reference = no change
  });
});

// ---------------------------------------------------------------------------
// checkHintReveal
// ---------------------------------------------------------------------------

describe('checkHintReveal', () => {
  it('does not reveal if visit count < threshold', () => {
    const mm = makeMicroModule({ id: 'mm_hint', visibility: 'hidden', hiddenDC: 15 });
    const placed: PlacedMicroModule[] = [
      { microModule: mm, parentNodeId: 'test_node', creatureActive: false },
    ];
    const states: Record<string, MicroModuleState> = {
      mm_hint: {
        microModuleId: 'mm_hint',
        revealed: false,
        visited: false,
        passiveCheckDone: true,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    const state = makeGameStateWithScenario(placed, states, {
      visitedLocations: {
        test_node: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false },
      },
    });
    const { revealed } = checkHintReveal(state, 'test_node');
    expect(revealed).toEqual([]);
  });

  it('auto-reveals after enough turns in parent node', () => {
    const mm = makeMicroModule({ id: 'mm_hint2', visibility: 'hidden', hiddenDC: 15 });
    const placed: PlacedMicroModule[] = [
      { microModule: mm, parentNodeId: 'test_node', creatureActive: false },
    ];
    const states: Record<string, MicroModuleState> = {
      mm_hint2: {
        microModuleId: 'mm_hint2',
        revealed: false,
        visited: false,
        passiveCheckDone: true,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    const state = makeGameStateWithScenario(placed, states, {
      visitedLocations: {
        test_node: {
          visitCount: BALANCE.MICRO_MODULES.HINT_REVEAL_TURN_THRESHOLD + 1,
          firstVisitTurn: 0,
          itemsTaken: [],
          featuresChanged: [],
          obstacleResolved: false,
        },
      },
    });
    const { newState, revealed } = checkHintReveal(state, 'test_node');
    expect(revealed).toContain('mm_hint2');
    expect(newState.microModuleStates.mm_hint2!.revealed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// activateCreatureAmbush
// ---------------------------------------------------------------------------

describe('activateCreatureAmbush', () => {
  it('sets creatureActive and linger turns', () => {
    const states: Record<string, MicroModuleState> = {
      mm_creature: {
        microModuleId: 'mm_creature',
        revealed: true,
        visited: false,
        passiveCheckDone: true,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    const state = makeGameStateWithScenario([], states);
    const result = activateCreatureAmbush(state, 'mm_creature');
    expect(result.microModuleStates.mm_creature!.creatureActive).toBe(true);
    expect(result.microModuleStates.mm_creature!.creatureTurnsRemaining).toBe(BALANCE.MICRO_MODULES.CREATURE_LINGER_TURNS);
  });
});

// ---------------------------------------------------------------------------
// tickCreatureAmbush
// ---------------------------------------------------------------------------

describe('tickCreatureAmbush', () => {
  it('decrements creature timer', () => {
    const states: Record<string, MicroModuleState> = {
      mm_c: {
        microModuleId: 'mm_c',
        revealed: true,
        visited: false,
        passiveCheckDone: true,
        creatureActive: true,
        creatureTurnsRemaining: 3,
      },
    };
    const state = makeGameStateWithScenario([], states);
    const result = tickCreatureAmbush(state);
    expect(result.microModuleStates.mm_c!.creatureTurnsRemaining).toBe(2);
    expect(result.microModuleStates.mm_c!.creatureActive).toBe(true);
  });

  it('deactivates creature when timer reaches 0', () => {
    const states: Record<string, MicroModuleState> = {
      mm_c: {
        microModuleId: 'mm_c',
        revealed: true,
        visited: false,
        passiveCheckDone: true,
        creatureActive: true,
        creatureTurnsRemaining: 1,
      },
    };
    const state = makeGameStateWithScenario([], states);
    const result = tickCreatureAmbush(state);
    expect(result.microModuleStates.mm_c!.creatureActive).toBe(false);
    expect(result.microModuleStates.mm_c!.creatureTurnsRemaining).toBe(0);
  });

  it('returns unchanged state when no active creatures', () => {
    const states: Record<string, MicroModuleState> = {
      mm_c: {
        microModuleId: 'mm_c',
        revealed: true,
        visited: true,
        passiveCheckDone: true,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    const state = makeGameStateWithScenario([], states);
    const result = tickCreatureAmbush(state);
    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// resolveCreatureConfrontation
// ---------------------------------------------------------------------------

describe('resolveCreatureConfrontation', () => {
  const ambushMM = makeMicroModule({
    id: 'mm_ambush',
    creatureAmbush: {
      minThreatLevel: 4,
      confrontationType: 'flee',
      confrontationDC: 12,
      confrontationStat: 'AGI',
      failureConsequence: 'damage',
      damageAmount: 5,
    },
  });

  function makeAmbushState(): GameState {
    const placed: PlacedMicroModule[] = [
      { microModule: ambushMM, parentNodeId: 'test_node', creatureActive: true },
    ];
    const states: Record<string, MicroModuleState> = {
      mm_ambush: {
        microModuleId: 'mm_ambush',
        revealed: true,
        visited: false,
        passiveCheckDone: true,
        creatureActive: true,
        creatureTurnsRemaining: 3,
      },
    };
    return makeGameStateWithScenario(placed, states);
  }

  it('success: deactivates creature, no damage', () => {
    // rng=0.99 → roll=20, +AGI(3) = 23 >= 12 → success
    const { newState, success } = resolveCreatureConfrontation(makeAmbushState(), 'mm_ambush', fixedRng(0.99));
    expect(success).toBe(true);
    expect(newState.microModuleStates.mm_ambush!.creatureActive).toBe(false);
    expect(newState.character!.hp).toBe(20); // no damage
  });

  it('failure: applies damage and pushes player back', () => {
    // rng=0.0 → roll=1, +AGI(3) = 4 < 12 → failure
    const { newState, success, consequence } = resolveCreatureConfrontation(makeAmbushState(), 'mm_ambush', fixedRng(0.0));
    expect(success).toBe(false);
    expect(consequence).toBe('damage');
    expect(newState.character!.hp).toBe(15); // 20 - 5
    expect(newState.playerLocationId).toBe('test_node'); // pushed back to parent
    expect(newState.microModuleStates.mm_ambush!.creatureActive).toBe(false);
  });

  it('item_loss consequence drops last inventory item', () => {
    const itemLossMM = makeMicroModule({
      id: 'mm_itemloss',
      creatureAmbush: {
        minThreatLevel: 4,
        confrontationType: 'flee',
        confrontationDC: 25, // very high DC to ensure failure
        confrontationStat: 'AGI',
        failureConsequence: 'item_loss',
      },
    });
    const placed: PlacedMicroModule[] = [
      { microModule: itemLossMM, parentNodeId: 'test_node', creatureActive: true },
    ];
    const states: Record<string, MicroModuleState> = {
      mm_itemloss: {
        microModuleId: 'mm_itemloss',
        revealed: true,
        visited: false,
        passiveCheckDone: true,
        creatureActive: true,
        creatureTurnsRemaining: 3,
      },
    };
    const state = makeGameStateWithScenario(placed, states);
    const { newState } = resolveCreatureConfrontation(state, 'mm_itemloss', fixedRng(0.0));
    expect(newState.character!.inventory.length).toBe(0); // was 1
  });

  it('status_effect consequence applies wounded condition', () => {
    const statusMM = makeMicroModule({
      id: 'mm_status',
      creatureAmbush: {
        minThreatLevel: 4,
        confrontationType: 'hide',
        confrontationDC: 25,
        confrontationStat: 'PER',
        failureConsequence: 'status_effect',
      },
    });
    const placed: PlacedMicroModule[] = [
      { microModule: statusMM, parentNodeId: 'test_node', creatureActive: true },
    ];
    const states: Record<string, MicroModuleState> = {
      mm_status: {
        microModuleId: 'mm_status',
        revealed: true,
        visited: false,
        passiveCheckDone: true,
        creatureActive: true,
        creatureTurnsRemaining: 3,
      },
    };
    const state = makeGameStateWithScenario(placed, states);
    const { newState } = resolveCreatureConfrontation(state, 'mm_status', fixedRng(0.0));
    expect(newState.character!.conditions.some(c => c.id === 'wounded')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// markMicroModuleVisited
// ---------------------------------------------------------------------------

describe('markMicroModuleVisited', () => {
  it('sets visited to true', () => {
    const states: Record<string, MicroModuleState> = {
      mm_v: {
        microModuleId: 'mm_v',
        revealed: true,
        visited: false,
        passiveCheckDone: true,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    const state = makeGameStateWithScenario([], states);
    const result = markMicroModuleVisited(state, 'mm_v');
    expect(result.microModuleStates.mm_v!.visited).toBe(true);
  });

  it('returns same reference if already visited', () => {
    const states: Record<string, MicroModuleState> = {
      mm_v: {
        microModuleId: 'mm_v',
        revealed: true,
        visited: true,
        passiveCheckDone: true,
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    };
    const state = makeGameStateWithScenario([], states);
    const result = markMicroModuleVisited(state, 'mm_v');
    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// getMicroModuleNodeId
// ---------------------------------------------------------------------------

describe('getMicroModuleNodeId', () => {
  it('returns expected format', () => {
    expect(getMicroModuleNodeId('mm_loot_kit', 'unlock')).toBe('mm_mm_loot_kit_unlock');
  });
});

// ---------------------------------------------------------------------------
// getMicroModulesAtParent
// ---------------------------------------------------------------------------

describe('getMicroModulesAtParent', () => {
  it('returns only modules at the specified parent', () => {
    const placed: PlacedMicroModule[] = [
      { microModule: makeMicroModule({ id: 'a' }), parentNodeId: 'n1', creatureActive: false },
      { microModule: makeMicroModule({ id: 'b' }), parentNodeId: 'n2', creatureActive: false },
      { microModule: makeMicroModule({ id: 'c' }), parentNodeId: 'n1', creatureActive: false },
    ];
    const result = getMicroModulesAtParent({ placedMicroModules: placed }, 'n1');
    expect(result.length).toBe(2);
    expect(result.map(p => p.microModule.id)).toEqual(['a', 'c']);
  });

  it('handles undefined placedMicroModules gracefully', () => {
    const result = getMicroModulesAtParent({ placedMicroModules: undefined } as never, 'n1');
    expect(result).toEqual([]);
  });
});
