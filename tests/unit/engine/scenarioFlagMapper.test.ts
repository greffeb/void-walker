// ---------------------------------------------------------------------------
// tests/unit/engine/scenarioFlagMapper.test.ts — Decision Y
// ---------------------------------------------------------------------------
// The mapper reads what a skeleton declares. It knows no flag names of its own.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { mapScenarioFlags } from '../../../src/engine/scenarioFlagMapper';
import type { ScenarioFlagEffect } from '../../../src/engine/scenario';
import { LAUNCH_SKELETONS } from '../../../src/content/scenarios/index';

const BEACON: ScenarioFlagEffect = {
  requiresAll: ['evidence_transmitted'],
  activatesObjects: ['emergency_beacon'],
};

const SCUTTLE: ScenarioFlagEffect = {
  requiresAll: ['reactor_killed'],
  requiresAny: ['shuttle_released', 'clamps_sabotaged'],
  triggersSelfDestruct: true,
};

const CAGE: ScenarioFlagEffect = {
  requiresAll: ['creature_contained'],
  containsLocations: ['boss'],
};

describe('mapScenarioFlags', () => {
  it('returns empty effects when there are no flags', () => {
    const result = mapScenarioFlags(undefined, [BEACON]);
    expect(result.fullyContainedLocations).toEqual([]);
    expect(result.activatedObjects).toEqual([]);
    expect(result.selfDestructActive).toBe(false);
  });

  it('returns empty effects when the skeleton declared nothing', () => {
    const result = mapScenarioFlags({ evidence_transmitted: true }, undefined);
    expect(result.activatedObjects).toEqual([]);
  });

  it('applies an effect whose flags are all set', () => {
    const result = mapScenarioFlags({ evidence_transmitted: true }, [BEACON]);
    expect(result.activatedObjects).toContain('emergency_beacon');
  });

  it('ignores an effect whose flags are not set', () => {
    const result = mapScenarioFlags({ some_other_flag: true }, [BEACON]);
    expect(result.activatedObjects).toEqual([]);
  });

  it('requiresAny needs one of the alternatives, not all of them', () => {
    expect(mapScenarioFlags({ reactor_killed: true }, [SCUTTLE]).selfDestructActive).toBe(false);
    expect(mapScenarioFlags({ reactor_killed: true, shuttle_released: true }, [SCUTTLE]).selfDestructActive).toBe(true);
    expect(mapScenarioFlags({ reactor_killed: true, clamps_sabotaged: true }, [SCUTTLE]).selfDestructActive).toBe(true);
  });

  it('accumulates every satisfied effect', () => {
    const result = mapScenarioFlags(
      { evidence_transmitted: true, creature_contained: true },
      [BEACON, SCUTTLE, CAGE],
    );
    expect(result.activatedObjects).toContain('emergency_beacon');
    expect(result.fullyContainedLocations).toContain('boss');
    expect(result.selfDestructActive).toBe(false);
  });
});

describe('decision Y: no scenario vocabulary inside the engine', () => {
  it('every shipped skeleton declares its own flag meanings', () => {
    for (const skeleton of LAUNCH_SKELETONS) {
      expect(skeleton.flagEffects, skeleton.id).toBeDefined();
    }
  });

  it('offers no way to declare a location lethal — that is world state, not a flag', () => {
    const effect = { requiresAll: ['anything'] } as ScenarioFlagEffect;
    expect('makesLethal' in effect).toBe(false);
    expect(Object.keys(mapScenarioFlags({ anything: true }, [effect])))
      .toEqual(['fullyContainedLocations', 'activatedObjects', 'selfDestructActive']);
  });
});
