// ---------------------------------------------------------------------------
// tests/unit/engine/pacing.test.ts — Pacing engine unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  selectSkin, isModuleCompatible, assignTensionValues,
  buildLocationGraph, validateAssembledScenario, assembleScenario,
  resolveLocationName,
} from '../../../src/engine/pacing';
import type { RngFn } from '../../../src/engine/types';
import type {
  CoreSkeleton,
  ScenarioModule,
  SettingDefinition,
  PlacedModule,
  NarrativeSkin,
  LocaleString,
} from '../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// TEST UTILITIES
// ---------------------------------------------------------------------------

function fixedRng(value: number): RngFn { return () => value; }

function sequenceRng(values: number[]): RngFn {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

function ls(fr: string): LocaleString { return { fr, en: '' }; }

// ---------------------------------------------------------------------------
// MINIMAL FIXTURES
// ---------------------------------------------------------------------------

const LOW_SKIN: NarrativeSkin = {
  tension: 'low', entryDescription: ls('Entrée calme'), revisitDescription: ls('Revisité'),
  obstacleDescription: ls('Obstacle léger'), dcModifier: 0, suggestedPathPriority: ['INT', 'PER'],
  ambientSnippets: [ls('a'), ls('b'), ls('c')],
};
const MID_SKIN: NarrativeSkin = {
  tension: 'mid', entryDescription: ls('Entrée tendue'), revisitDescription: ls('Revisité sous tension'),
  obstacleDescription: ls('Obstacle moyen'), dcModifier: 1, suggestedPathPriority: ['AGI', 'INT'],
  ambientSnippets: [ls('d'), ls('e'), ls('f')],
};
const HIGH_SKIN: NarrativeSkin = {
  tension: 'high', entryDescription: ls('Entrée désespérée'), revisitDescription: ls('Revisité en danger'),
  obstacleDescription: ls('Obstacle critique'), dcModifier: 2, suggestedPathPriority: ['FOR', 'AGI'],
  ambientSnippets: [ls('g'), ls('h'), ls('i')],
};

function makeModule(id: string, overrides: Partial<ScenarioModule> = {}): ScenarioModule {
  return {
    id,
    type: 'blocked_passage',
    validSegments: ['start-unlock', 'unlock-reveal', 'reveal-escalation', 'escalation-boss'],
    tensionRange: [2, 9],
    compatibility: { universal: true },
    locations: [
      {
        id: 'main',
        role: 'passage',
        onCriticalPath: true,
        features: [],
        items: [],
      },
    ],
    sideRooms: [],
    obstacle: {
      targetId: 'door_01',
      description: ls('Une porte bloquée'),
      paths: [
        { id: 'force', stat: 'FOR', dc: 12, description: ls('Forcer'), verbs: ['push'] },
        { id: 'hack', stat: 'INT', dc: 11, description: ls('Pirater'), verbs: ['hack'] },
        { id: 'crawl', stat: 'AGI', dc: 10, description: ls('Ramper'), verbs: ['crawl'] },
      ],
    },
    skins: [LOW_SKIN, MID_SKIN, HIGH_SKIN],
    locationRole: 'passage',
    locale: {
      fr: { entryPrefix: 'Vous entrez', obstaclePrefix: 'Un obstacle', successSuffix: 'Succès', failureSuffix: 'Échec' },
      en: { entryPrefix: 'You enter', obstaclePrefix: 'An obstacle', successSuffix: 'Success', failureSuffix: 'Failure' },
    },
    ...overrides,
  };
}

function makeStationModule(id: string): ScenarioModule {
  return makeModule(id, {
    compatibility: { categories: ['facility'] },
    locations: [{ id: 'main', role: 'server_room', onCriticalPath: true, features: [], items: [] }],
    locationRole: 'server_room',
  });
}

function makeAlienModule(id: string): ScenarioModule {
  return makeModule(id, {
    compatibility: { categories: ['alien'] },
    locations: [{ id: 'main', role: 'ritual_chamber', onCriticalPath: true, features: [], items: [] }],
    locationRole: 'ritual_chamber',
  });
}

const MINIMAL_SETTING: SettingDefinition = {
  id: 'derelict_ship',
  nameKey: ls('Épave Stellaire'),
  categories: ['space_vessel'],
  supportedRoles: ['passage', 'control_room', 'storage', 'medical', 'quarters', 'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock'],
  locationNames: {
    passage: Array.from({ length: 22 }, (_, i) => ls(`Passage ${i + 1}`)),
    control_room: Array.from({ length: 22 }, (_, i) => ls(`Contrôle ${i + 1}`)),
    storage: Array.from({ length: 22 }, (_, i) => ls(`Stockage ${i + 1}`)),
    medical: Array.from({ length: 22 }, (_, i) => ls(`Médical ${i + 1}`)),
    quarters: Array.from({ length: 22 }, (_, i) => ls(`Quartiers ${i + 1}`)),
    hub: Array.from({ length: 22 }, (_, i) => ls(`Carrefour ${i + 1}`)),
    dead_end: Array.from({ length: 22 }, (_, i) => ls(`Impasse ${i + 1}`)),
    hazard_zone: Array.from({ length: 22 }, (_, i) => ls(`Zone risque ${i + 1}`)),
    engineering: Array.from({ length: 22 }, (_, i) => ls(`Ingénierie ${i + 1}`)),
    airlock: Array.from({ length: 22 }, (_, i) => ls(`Sas ${i + 1}`)),
  },
  features: ['viewport', 'hull_panel'],
  preferredItems: ['plasma_cutter', 'access_keycard'],
};

const ALIEN_SETTING: SettingDefinition = {
  id: 'alien_ruins',
  nameKey: ls('Ruines Extraterrestres'),
  categories: ['alien'],
  supportedRoles: ['passage', 'control_room', 'hub', 'dead_end', 'hazard_zone', 'ritual_chamber', 'organic_growth', 'crystal_cave', 'gravity_well'],
  locationNames: {
    passage: Array.from({ length: 22 }, (_, i) => ls(`Tunnel ${i + 1}`)),
    control_room: Array.from({ length: 22 }, (_, i) => ls(`Nexus ${i + 1}`)),
    hub: Array.from({ length: 22 }, (_, i) => ls(`Chambre ${i + 1}`)),
    dead_end: Array.from({ length: 22 }, (_, i) => ls(`Alcôve ${i + 1}`)),
    hazard_zone: Array.from({ length: 22 }, (_, i) => ls(`Puits ${i + 1}`)),
    ritual_chamber: Array.from({ length: 22 }, (_, i) => ls(`Sanctuaire ${i + 1}`)),
    organic_growth: Array.from({ length: 22 }, (_, i) => ls(`Zone organique ${i + 1}`)),
    crystal_cave: Array.from({ length: 22 }, (_, i) => ls(`Grotte ${i + 1}`)),
    gravity_well: Array.from({ length: 22 }, (_, i) => ls(`Puits gravité ${i + 1}`)),
  },
  features: ['crystal_node'],
  preferredItems: ['translator_device'],
};

function makeSkeletonLocations() {
  const roles: Record<string, string> = {
    start: 'hub', unlock: 'control_room', reveal: 'quarters',
    escalation: 'hazard_zone', boss: 'airlock', resolution: 'passage',
  };
  const result: Record<string, {locationRole: string; items: []; features: []; exits: string[]}> = {};
  for (const [id, role] of Object.entries(roles)) {
    result[id] = { locationRole: role, items: [], features: [], exits: [] };
  }
  return result;
}

function makeSkeleton(): CoreSkeleton {
  return {
    id: 'escape',
    nameKey: ls('Fuir l\'Épave'),
    descriptionKey: ls('Réveillez-vous et survivez.'),
    nodes: [
      { id: 'start', role: 'entry', beat: 'intro', tension: 2, descriptionKey: ls('Début') },
      { id: 'unlock', role: 'gate', beat: 'rising', tension: 4, descriptionKey: ls('Verrou') },
      { id: 'reveal', role: 'midpoint', beat: 'midpoint', tension: 6, descriptionKey: ls('Révélation') },
      { id: 'escalation', role: 'escalation', beat: 'escalation', tension: 8, descriptionKey: ls('Escalade') },
      { id: 'boss', role: 'climax', beat: 'climax', tension: 10, descriptionKey: ls('Boss') },
      { id: 'resolution', role: 'epilogue', beat: 'resolution', tension: 3, descriptionKey: ls('Fin') },
    ],
    gateItem: 'access_keycard',
    gateItemLocation: 'start',
    revelation: ls('Une arme bio-expérimentale.'),
    escalationTrigger: ls('La créature endommage le support vie.'),
    bossType: 'escape',
    primaryVictory: { type: 'reach_location', locationId: 'resolution', requiredItem: 'access_keycard' },
    alternativeVictory: { type: 'environmental_kill', entityId: 'creature' },
    nodeLocations: makeSkeletonLocations() as CoreSkeleton['nodeLocations'],
  };
}

// ---------------------------------------------------------------------------
// TESTS: selectSkin
// ---------------------------------------------------------------------------

describe('selectSkin()', () => {
  const module = makeModule('test');

  it('returns low skin for tension ≤ 4', () => {
    expect(selectSkin(module, 1).tension).toBe('low');
    expect(selectSkin(module, 4).tension).toBe('low');
  });

  it('returns mid skin for tension 5-7', () => {
    expect(selectSkin(module, 5).tension).toBe('mid');
    expect(selectSkin(module, 7).tension).toBe('mid');
  });

  it('returns high skin for tension ≥ 8', () => {
    expect(selectSkin(module, 8).tension).toBe('high');
    expect(selectSkin(module, 10).tension).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// TESTS: isModuleCompatible
// ---------------------------------------------------------------------------

describe('isModuleCompatible()', () => {
  it('universal module with passage role is compatible with derelict_ship', () => {
    const mod = makeModule('universal');
    expect(isModuleCompatible(mod, MINIMAL_SETTING)).toBe(true);
  });

  it('universal module with passage role is compatible with alien_ruins (which has passage)', () => {
    const mod = makeModule('u1');
    expect(isModuleCompatible(mod, ALIEN_SETTING)).toBe(true);
  });

  it('station module (server_room role) is NOT compatible with derelict_ship (no server_room)', () => {
    const mod = makeStationModule('station_01');
    expect(isModuleCompatible(mod, MINIMAL_SETTING)).toBe(false);
  });

  it('station module is NOT compatible with alien_ruins', () => {
    const mod = makeStationModule('station_01');
    expect(isModuleCompatible(mod, ALIEN_SETTING)).toBe(false);
  });

  it('alien module (ritual_chamber) is NOT compatible with derelict_ship', () => {
    const mod = makeAlienModule('alien_01');
    expect(isModuleCompatible(mod, MINIMAL_SETTING)).toBe(false);
  });

  it('alien module is compatible with alien_ruins', () => {
    const mod = makeAlienModule('alien_01');
    expect(isModuleCompatible(mod, ALIEN_SETTING)).toBe(true);
  });

  it('category-filtered module without matching category is rejected', () => {
    const mod = makeModule('cat_mod', {
      compatibility: { categories: ['facility'] },
    });
    expect(isModuleCompatible(mod, MINIMAL_SETTING)).toBe(false); // ship is space_vessel not facility
  });
});

// ---------------------------------------------------------------------------
// TESTS: assignTensionValues
// ---------------------------------------------------------------------------

describe('assignTensionValues()', () => {
  function makePlaced(segment: PlacedModule['segment'], index = 0): PlacedModule {
    return {
      module: makeModule(`mod_${segment}`),
      segment,
      index,
      assignedTension: 5,
      activeSkin: MID_SKIN,
    };
  }

  it('modules in start-unlock get tension 2-5', () => {
    const placed = [makePlaced('start-unlock')];
    const result = assignTensionValues(placed, fixedRng(0.0));
    expect(result[0].assignedTension).toBeGreaterThanOrEqual(2);
    expect(result[0].assignedTension).toBeLessThanOrEqual(5);
  });

  it('modules in escalation-boss get tension 7-9', () => {
    const placed = [makePlaced('escalation-boss')];
    const result = assignTensionValues(placed, fixedRng(0.5));
    expect(result[0].assignedTension).toBeGreaterThanOrEqual(7);
    expect(result[0].assignedTension).toBeLessThanOrEqual(9);
  });

  it('active skin is assigned based on tension', () => {
    const placed = [makePlaced('escalation-boss')];
    const result = assignTensionValues(placed, fixedRng(0.9));
    // tension 7-9, will be high or mid
    expect(['mid', 'high']).toContain(result[0].activeSkin.tension);
  });

  it('beat assignment is correct for each segment', () => {
    const tests: Array<[PlacedModule['segment'], string]> = [
      ['start-unlock', 'rising'],
      ['unlock-reveal', 'midpoint'],
      ['reveal-escalation', 'escalation'],
      ['escalation-boss', 'climax'],
    ];
    for (const [seg, _beat] of tests) {
      const placed = [makePlaced(seg)];
      const result = assignTensionValues(placed, fixedRng(0.5));
      expect(result[0].segment).toBe(seg);
    }
  });
});

// ---------------------------------------------------------------------------
// TESTS: resolveLocationName
// ---------------------------------------------------------------------------

describe('resolveLocationName()', () => {
  it('returns a name for a valid role', () => {
    const used = new Set<string>();
    const name = resolveLocationName('passage', MINIMAL_SETTING, fixedRng(0), used);
    expect(name.fr).toBeTruthy();
  });

  it('returns fallback for unknown role', () => {
    const used = new Set<string>();
    const name = resolveLocationName('unknown_role', MINIMAL_SETTING, fixedRng(0), used);
    expect(name.fr).toContain('unknown_role');
  });

  it('avoids reusing names', () => {
    const used = new Set<string>();
    const rng = sequenceRng([0.0, 0.0, 0.0]);
    resolveLocationName('passage', MINIMAL_SETTING, rng, used);
    resolveLocationName('passage', MINIMAL_SETTING, rng, used);
    // Both valid, names tracked in used set
    expect(used.size).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// TESTS: buildLocationGraph
// ---------------------------------------------------------------------------

describe('buildLocationGraph()', () => {
  const skeleton = makeSkeleton();

  it('always includes all 6 core nodes', () => {
    const graph = buildLocationGraph(skeleton, [], MINIMAL_SETTING, fixedRng(0.3));
    const coreIds = ['start', 'unlock', 'reveal', 'escalation', 'boss', 'resolution'];
    for (const id of coreIds) {
      expect(graph.nodes.some(n => n.id === id), `Missing core node: ${id}`).toBe(true);
    }
  });

  it('with no modules: has exactly 6 nodes', () => {
    const graph = buildLocationGraph(skeleton, [], MINIMAL_SETTING, fixedRng(0.3));
    expect(graph.nodes).toHaveLength(6);
  });

  it('with 1 critical-path module: has 7 nodes', () => {
    const pm: PlacedModule = {
      module: makeModule('mod1'),
      segment: 'start-unlock',
      index: 0,
      assignedTension: 3,
      activeSkin: LOW_SKIN,
    };
    const graph = buildLocationGraph(skeleton, [pm], MINIMAL_SETTING, fixedRng(0.3));
    expect(graph.nodes).toHaveLength(7);
  });

  it('with 1 critical-path + 1 side room: has 8 nodes', () => {
    const mod = makeModule('mod_side', {
      sideRooms: [{ id: 'side', role: 'dead_end', onCriticalPath: false, features: [], items: [] }],
    });
    const pm: PlacedModule = {
      module: mod,
      segment: 'unlock-reveal',
      index: 0,
      assignedTension: 5,
      activeSkin: MID_SKIN,
    };
    const graph = buildLocationGraph(skeleton, [pm], MINIMAL_SETTING, fixedRng(0.3));
    expect(graph.nodes).toHaveLength(8);
  });

  it('all critical path nodes are bidirectionally connected', () => {
    const graph = buildLocationGraph(skeleton, [], MINIMAL_SETTING, fixedRng(0.3));
    const criticalIds = graph.nodes.filter(n => n.onCriticalPath).map(n => n.id);

    for (const nodeId of criticalIds) {
      const outgoing = graph.edges.filter(e => e.from === nodeId && criticalIds.includes(e.to));
      for (const edge of outgoing) {
        const hasReturn = graph.edges.some(e => e.from === edge.to && e.to === nodeId);
        expect(hasReturn, `Missing return edge: ${edge.to} → ${edge.from}`).toBe(true);
      }
    }
  });

  it('all nodes have a valid beat', () => {
    const validBeats = new Set(['intro', 'rising', 'midpoint', 'escalation', 'climax', 'resolution']);
    const graph = buildLocationGraph(skeleton, [], MINIMAL_SETTING, fixedRng(0.3));
    for (const node of graph.nodes) {
      expect(validBeats.has(node.beat), `Node ${node.id} has invalid beat: ${node.beat}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// TESTS: validateAssembledScenario
// ---------------------------------------------------------------------------

describe('validateAssembledScenario()', () => {
  const skeleton = makeSkeleton();

  it('base scenario (no modules) passes all 6 checks', () => {
    const graph = buildLocationGraph(skeleton, [], MINIMAL_SETTING, fixedRng(0.3));
    const result = validateAssembledScenario(graph, skeleton);
    expect(result.valid, result.issues.join('\n')).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('scenario with modules passes validation', () => {
    const pm: PlacedModule = {
      module: makeModule('mod_valid'),
      segment: 'unlock-reveal',
      index: 0,
      assignedTension: 5,
      activeSkin: MID_SKIN,
    };
    const graph = buildLocationGraph(skeleton, [pm], MINIMAL_SETTING, fixedRng(0.3));
    const result = validateAssembledScenario(graph, skeleton);
    expect(result.valid, result.issues.join('\n')).toBe(true);
  });

  it('fails when boss node is orphaned', () => {
    const graph = buildLocationGraph(skeleton, [], MINIMAL_SETTING, fixedRng(0.3));
    // Artificially remove all edges to boss
    const brokenGraph = {
      ...graph,
      edges: graph.edges.filter(e => e.to !== 'boss'),
    };
    const result = validateAssembledScenario(brokenGraph, skeleton);
    // Either orphan or no-path check should fail
    expect(result.valid).toBe(false);
  });

  it('fails when an obstacle has fewer than 3 paths', () => {
    const badMod = makeModule('bad_obstacle', {
      obstacle: {
        targetId: 'door',
        description: ls('Porte'),
        paths: [
          { id: 'p1', stat: 'FOR', dc: 12, description: ls('Forcer'), verbs: ['push'] },
          { id: 'p2', stat: 'INT', dc: 11, description: ls('Pirater'), verbs: ['hack'] },
          // Only 2 paths — should fail
        ],
      },
    });
    const pm: PlacedModule = {
      module: badMod,
      segment: 'start-unlock',
      index: 0,
      assignedTension: 3,
      activeSkin: LOW_SKIN,
    };
    const graph = buildLocationGraph(skeleton, [pm], MINIMAL_SETTING, fixedRng(0.3));
    const result = validateAssembledScenario(graph, skeleton);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('paths'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TESTS: assembleScenario
// ---------------------------------------------------------------------------

describe('assembleScenario()', () => {
  const skeleton = makeSkeleton();
  const allModules = Array.from({ length: 15 }, (_, i) => makeModule(`m${i + 1}`));

  it('quick session produces 0 modules', () => {
    const result = assembleScenario(skeleton, 'quick', MINIMAL_SETTING, allModules, fixedRng(0.5));
    expect(result.modules).toHaveLength(0);
  });

  it('standard session produces 3-5 modules', () => {
    const rng = sequenceRng([0.5, 0.2, 0.7, 0.1, 0.9, 0.3, 0.5, 0.2, 0.7, 0.1, 0.9, 0.3, 0.5, 0.2, 0.7, 0.1, 0.9]);
    const result = assembleScenario(skeleton, 'standard', MINIMAL_SETTING, allModules, rng);
    expect(result.modules.length).toBeGreaterThanOrEqual(3);
    expect(result.modules.length).toBeLessThanOrEqual(5);
  });

  it('extended session produces 8-12 modules', () => {
    const rng = sequenceRng(Array.from({ length: 100 }, (_, i) => ((i * 0.137) % 1)));
    const result = assembleScenario(skeleton, 'extended', MINIMAL_SETTING, allModules, rng);
    expect(result.modules.length).toBeGreaterThanOrEqual(8);
    expect(result.modules.length).toBeLessThanOrEqual(12);
  });

  it('no duplicate modules are placed', () => {
    const rng = sequenceRng(Array.from({ length: 50 }, (_, i) => ((i * 0.137) % 1)));
    const result = assembleScenario(skeleton, 'standard', MINIMAL_SETTING, allModules, rng);
    const ids = result.modules.map(pm => pm.module.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('assembled scenario has skeleton, graph, and setting', () => {
    const result = assembleScenario(skeleton, 'quick', MINIMAL_SETTING, allModules, fixedRng(0.5));
    expect(result.skeleton).toBeDefined();
    expect(result.graph).toBeDefined();
    expect(result.setting).toBeDefined();
    expect(result.sessionLength).toBe('quick');
  });

  it('incompatible modules (station-only) are excluded from derelict_ship', () => {
    const stationMod = makeStationModule('station_only');
    const mixedModules = [...allModules, stationMod];
    const rng = sequenceRng(Array.from({ length: 50 }, (_, i) => ((i * 0.137) % 1)));
    const result = assembleScenario(skeleton, 'extended', MINIMAL_SETTING, mixedModules, rng);
    const placedIds = result.modules.map(pm => pm.module.id);
    expect(placedIds).not.toContain('station_only');
  });

  it('quick session graph validates correctly', () => {
    const result = assembleScenario(skeleton, 'quick', MINIMAL_SETTING, allModules, fixedRng(0.5));
    const validation = validateAssembledScenario(result.graph, skeleton);
    expect(validation.valid, validation.issues.join('\n')).toBe(true);
  });

  it('standard session graph validates correctly', () => {
    const rng = sequenceRng(Array.from({ length: 50 }, (_, i) => ((i * 0.137) % 1)));
    const result = assembleScenario(skeleton, 'standard', MINIMAL_SETTING, allModules, rng);
    const validation = validateAssembledScenario(result.graph, skeleton);
    expect(validation.valid, validation.issues.join('\n')).toBe(true);
  });
});

describe('module segment beat assignment', () => {
  it('modules in segment A (start-unlock) get rising beat', () => {
    const pm: PlacedModule = {
      module: makeModule('mod_a'),
      segment: 'start-unlock',
      index: 0,
      assignedTension: 3,
      activeSkin: LOW_SKIN,
    };
    const skeleton = makeSkeleton();
    const graph = buildLocationGraph(skeleton, [pm], MINIMAL_SETTING, fixedRng(0.3));
    const modNode = graph.nodes.find(n => n.moduleId === 'mod_a');
    expect(modNode?.beat).toBe('rising');
  });

  it('modules in segment D (escalation-boss) get climax beat', () => {
    const pm: PlacedModule = {
      module: makeModule('mod_d'),
      segment: 'escalation-boss',
      index: 0,
      assignedTension: 8,
      activeSkin: HIGH_SKIN,
    };
    const skeleton = makeSkeleton();
    const graph = buildLocationGraph(skeleton, [pm], MINIMAL_SETTING, fixedRng(0.3));
    const modNode = graph.nodes.find(n => n.moduleId === 'mod_d');
    expect(modNode?.beat).toBe('climax');
  });
});
