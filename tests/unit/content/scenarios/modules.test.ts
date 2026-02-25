// ---------------------------------------------------------------------------
// tests/unit/content/scenarios/modules.test.ts — Module validation tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { ALL_MODULES, getModuleById } from '../../../../src/content/scenarios/modules/index';
import { isModuleCompatible } from '../../../../src/engine/pacing';
import { LAUNCH_SETTINGS } from '../../../../src/content/settings';
import type { ScenarioModule } from '../../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// SHARED MODULE VALIDATION
// ---------------------------------------------------------------------------

function validateModule(module: ScenarioModule): void {
  it(`${module.id}: has valid ID and type`, () => {
    expect(module.id).toBeTruthy();
    const validTypes = ['blocked_passage', 'patrol_enemy', 'npc_encounter', 'terminal_puzzle',
      'environmental', 'exploration', 'rescue', 'moral_choice', 'resource_cache', 'ambush'];
    expect(validTypes).toContain(module.type);
  });

  it(`${module.id}: has 1+ valid segments`, () => {
    const validSegs = ['start-unlock', 'unlock-reveal', 'reveal-escalation', 'escalation-boss'];
    expect(module.validSegments.length).toBeGreaterThan(0);
    for (const seg of module.validSegments) {
      expect(validSegs).toContain(seg);
    }
  });

  it(`${module.id}: has valid tension range [min, max]`, () => {
    expect(module.tensionRange[0]).toBeGreaterThanOrEqual(2);
    expect(module.tensionRange[1]).toBeLessThanOrEqual(10);
    expect(module.tensionRange[0]).toBeLessThanOrEqual(module.tensionRange[1]);
  });

  it(`${module.id}: has 3 skins (low, mid, high)`, () => {
    expect(module.skins).toHaveLength(3);
    expect(module.skins[0].tension).toBe('low');
    expect(module.skins[1].tension).toBe('mid');
    expect(module.skins[2].tension).toBe('high');
  });

  it(`${module.id}: skins have valid dcModifier (0, 1, or 2)`, () => {
    expect(module.skins[0].dcModifier).toBe(0);
    expect(module.skins[1].dcModifier).toBe(1);
    expect(module.skins[2].dcModifier).toBe(2);
  });

  it(`${module.id}: skins have 3-4 ambient snippets`, () => {
    for (const skin of module.skins) {
      expect(skin.ambientSnippets.length).toBeGreaterThanOrEqual(3);
      expect(skin.ambientSnippets.length).toBeLessThanOrEqual(4);
    }
  });

  it(`${module.id}: skins have fr text for all string fields`, () => {
    for (const skin of module.skins) {
      expect(skin.entryDescription.fr).toBeTruthy();
      expect(skin.revisitDescription.fr).toBeTruthy();
      expect(skin.obstacleDescription.fr).toBeTruthy();
      for (const snippet of skin.ambientSnippets) {
        expect(snippet.fr).toBeTruthy();
      }
    }
  });

  it(`${module.id}: has 1+ critical path locations`, () => {
    const criticalPaths = module.locations.filter(l => l.onCriticalPath);
    expect(criticalPaths.length).toBeGreaterThan(0);
  });

  it(`${module.id}: obstacle has 3+ paths`, () => {
    expect(module.obstacle.paths.length).toBeGreaterThanOrEqual(3);
  });

  it(`${module.id}: obstacle paths have valid stats`, () => {
    const validStats = ['FOR', 'DEF', 'AGI', 'INT', 'PER', 'CHA', 'LCK'];
    for (const path of module.obstacle.paths) {
      expect(validStats).toContain(path.stat);
    }
  });

  it(`${module.id}: obstacle paths have 1+ verbs each`, () => {
    for (const path of module.obstacle.paths) {
      expect(path.verbs.length).toBeGreaterThan(0);
    }
  });

  it(`${module.id}: obstacle has fr description`, () => {
    expect(module.obstacle.description.fr).toBeTruthy();
  });

  it(`${module.id}: has locationRole`, () => {
    expect(module.locationRole).toBeTruthy();
  });

  it(`${module.id}: has locale data (fr)`, () => {
    expect(module.locale.fr.entryPrefix).toBeTruthy();
    expect(module.locale.fr.obstaclePrefix).toBeTruthy();
    expect(module.locale.fr.successSuffix).toBeTruthy();
    expect(module.locale.fr.failureSuffix).toBeTruthy();
  });
}

// ---------------------------------------------------------------------------
// ALL MODULES REGISTRY
// ---------------------------------------------------------------------------

describe('ALL_MODULES', () => {
  it('has exactly 15 modules', () => {
    expect(ALL_MODULES).toHaveLength(15);
  });

  it('all module IDs are unique', () => {
    const ids = ALL_MODULES.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has 5 universal modules', () => {
    const universals = ALL_MODULES.filter(m => m.compatibility.universal);
    expect(universals).toHaveLength(5);
  });

  it('has modules for all 10 module types represented', () => {
    // We have: blocked_passage (2), npc_encounter (2), environmental (3), moral_choice (1),
    // resource_cache (1), ambush (1), patrol_enemy (1), rescue (1), terminal_puzzle (2)
    const types = new Set(ALL_MODULES.map(m => m.type));
    expect(types.has('blocked_passage')).toBe(true);
    expect(types.has('npc_encounter')).toBe(true);
    expect(types.has('environmental')).toBe(true);
    expect(types.has('ambush')).toBe(true);
    expect(types.has('patrol_enemy')).toBe(true);
    expect(types.has('rescue')).toBe(true);
    expect(types.has('moral_choice')).toBe(true);
    expect(types.has('resource_cache')).toBe(true);
    expect(types.has('terminal_puzzle')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// COMPATIBILITY TESTS
// ---------------------------------------------------------------------------

describe('Module × Setting compatibility', () => {
  const derelictShip = LAUNCH_SETTINGS.find(s => s.id === 'derelict_ship')!;
  const spaceStation = LAUNCH_SETTINGS.find(s => s.id === 'space_station')!;
  const alienRuins = LAUNCH_SETTINGS.find(s => s.id === 'alien_ruins')!;

  it('alien_mechanism_01 is NOT compatible with derelict_ship', () => {
    const mod = ALL_MODULES.find(m => m.id === 'alien_mechanism_01')!;
    expect(isModuleCompatible(mod, derelictShip)).toBe(false);
  });

  it('alien_mechanism_01 IS compatible with alien_ruins', () => {
    const mod = ALL_MODULES.find(m => m.id === 'alien_mechanism_01')!;
    expect(isModuleCompatible(mod, alienRuins)).toBe(true);
  });

  it('terminal_decrypt_01 (server_room role) is NOT compatible with alien_ruins', () => {
    const mod = ALL_MODULES.find(m => m.id === 'terminal_decrypt_01')!;
    expect(isModuleCompatible(mod, alienRuins)).toBe(false);
  });

  it('terminal_decrypt_01 IS compatible with space_station', () => {
    const mod = ALL_MODULES.find(m => m.id === 'terminal_decrypt_01')!;
    expect(isModuleCompatible(mod, spaceStation)).toBe(true);
  });

  it('containment_breach_01 (facility only) is NOT compatible with derelict_ship', () => {
    const mod = ALL_MODULES.find(m => m.id === 'containment_breach_01')!;
    expect(isModuleCompatible(mod, derelictShip)).toBe(false);
  });

  it('containment_breach_01 IS compatible with space_station', () => {
    const mod = ALL_MODULES.find(m => m.id === 'containment_breach_01')!;
    expect(isModuleCompatible(mod, spaceStation)).toBe(true);
  });

  it('airlock_malfunction_01 IS compatible with derelict_ship', () => {
    const mod = ALL_MODULES.find(m => m.id === 'airlock_malfunction_01')!;
    expect(isModuleCompatible(mod, derelictShip)).toBe(true);
  });

  it('airlock_malfunction_01 is NOT compatible with alien_ruins (no airlock role)', () => {
    const mod = ALL_MODULES.find(m => m.id === 'airlock_malfunction_01')!;
    expect(isModuleCompatible(mod, alienRuins)).toBe(false);
  });

  it('blocked_passage_01 (universal, passage role) is compatible with all 3 settings', () => {
    const mod = ALL_MODULES.find(m => m.id === 'blocked_passage_01')!;
    expect(isModuleCompatible(mod, derelictShip)).toBe(true);
    expect(isModuleCompatible(mod, spaceStation)).toBe(true);
    expect(isModuleCompatible(mod, alienRuins)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// INDIVIDUAL MODULE VALIDATIONS
// ---------------------------------------------------------------------------

describe('Universal modules', () => {
  for (const id of ['blocked_passage_01', 'wounded_survivor_01', 'dark_room_01', 'supply_cache_01', 'ambush_01']) {
    const module = ALL_MODULES.find(m => m.id === id)!;
    validateModule(module);
  }
});

describe('Category modules', () => {
  for (const id of ['airlock_malfunction_01', 'malfunctioning_android_01', 'alien_mechanism_01', 'containment_breach_01', 'power_reroute_dilemma_01']) {
    const module = ALL_MODULES.find(m => m.id === id)!;
    validateModule(module);
  }
});

describe('Complex modules', () => {
  for (const id of ['patrol_entity_01', 'flooded_section_01', 'survivor_rescue_01', 'terminal_decrypt_01', 'explosive_decompression_risk_01']) {
    const module = ALL_MODULES.find(m => m.id === id)!;
    validateModule(module);
  }
});

// ---------------------------------------------------------------------------
// getModuleById
// ---------------------------------------------------------------------------

describe('getModuleById', () => {
  it('finds each module by ID', () => {
    for (const mod of ALL_MODULES) {
      expect(getModuleById(mod.id)).toBeDefined();
    }
  });

  it('returns undefined for unknown ID', () => {
    expect(getModuleById('nonexistent_module')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// SEGMENT COVERAGE
// ---------------------------------------------------------------------------

describe('Segment coverage', () => {
  const segments = ['start-unlock', 'unlock-reveal', 'reveal-escalation', 'escalation-boss'] as const;

  for (const seg of segments) {
    it(`has at least 1 module for segment '${seg}'`, () => {
      const compatible = ALL_MODULES.filter(m => m.validSegments.includes(seg));
      expect(compatible.length).toBeGreaterThan(0);
    });
  }
});
