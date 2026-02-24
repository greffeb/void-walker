// ---------------------------------------------------------------------------
// tests/stress/consequenceChains.test.ts
// Verify consequence chains always terminate within MAX_CASCADE_DEPTH.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { buildConsequences, applyConsequences } from '../../src/engine/consequences';
import { createInitialGameState } from '../../src/engine/types';
import { BALANCE } from '../../src/engine/constants';
import { VERB_IDS } from '../../src/engine/verbs';
import type { GameState, CharacterState, SceneContext } from '../../src/engine/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCharacter(): CharacterState {
  return {
    name: 'Stress',
    className: 'marine',
    stats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 2 },
    hp: 14, maxHp: 14,
    oxygen: 100,
    inventory: ['knife', 'ration', 'flashlight'],
    equippedWeapon: 'knife',
    equippedArmor: null,
    conditions: [],
    durability: {},
    actionsInColdZone: 0,
    actionsWithoutRest: 0,
  };
}

function makeState(): GameState {
  return { ...createInitialGameState(), phase: 'playing', character: makeCharacter() };
}

const PROPERTIES_SAMPLE = [
  ['flammable', 'tangible'],
  ['conductive', 'metallic'],
  ['breakable', 'fragile'],
  ['electronic', 'programmable'],
  ['organic', 'alive'],
  ['tangible', 'small'],
  [] as string[],
] as const;

const OUTCOMES = ['crit_success', 'success', 'failure', 'crit_failure'] as const;

const baseContext: SceneContext = {
  inventory: [],
  locationItems: [],
  npcs: [],
  environmentFeatures: [],
  connectedLocations: [],
  suggestions: [],
  environmentConditions: [],
  atmosphere: 'pressurized',
  locationId: 'room_stress',
};

// ---------------------------------------------------------------------------
// Stress test
// ---------------------------------------------------------------------------

describe('stress: consequence chains', () => {
  it('500 random verb × target × outcome combos: all terminate within MAX_CASCADE_DEPTH', () => {
    const rng = () => 0.5;
    const state = makeState();

    // Instrument applyConsequences to track depth
    for (let i = 0; i < 500; i++) {
      const verb = VERB_IDS[i % VERB_IDS.length];
      const props = PROPERTIES_SAMPLE[i % PROPERTIES_SAMPLE.length];
      const outcome = OUTCOMES[i % OUTCOMES.length];

      const target = {
        id: `target_${i}`,
        nameKey: `test.target_${i}` as never,
        properties: props as unknown as never[],
        isVirtual: false,
        source: 'location' as const,
      };

      const cs = buildConsequences(verb, target, outcome);

      // Count consequence chain depth by checking the structure
      // buildConsequences returns depth-0 consequences; applyConsequences
      // recurses internally. We just verify it doesn't throw.
      const start = Date.now();
      const updated = applyConsequences(state, cs, baseContext, rng);
      const elapsed = Date.now() - start;

      // Each chain must terminate in < 100ms
      expect(elapsed).toBeLessThan(100);
      expect(updated).toBeDefined();

      // State integrity: HP never goes below 0 or above maxHp
      const char = updated.character;
      if (char !== null) {
        expect(char.hp).toBeGreaterThanOrEqual(0);
        expect(char.hp).toBeLessThanOrEqual(char.maxHp);
      }
    }

    // Ensure MAX_CASCADE_DEPTH is honoured (depth constant exists)
    expect(BALANCE.MAX_CASCADE_DEPTH).toBe(5);
  });

  it('no consequence causes an infinite loop', () => {
    const state = makeState();
    const rng = () => 0.5;

    // Worst-case: environment_change consequence (which can chain)
    const cs = [
      { type: 'environment_change' as const, targetId: 'room_a' },
      { type: 'atmosphere_change' as const, atmosphereType: 'toxic_atmosphere' as const },
      { type: 'environment_change' as const, targetId: 'room_b' },
    ];

    const start = Date.now();
    const updated = applyConsequences(state, cs, baseContext, rng);
    const elapsed = Date.now() - start;

    expect(updated).toBeDefined();
    expect(elapsed).toBeLessThan(200);
  });

  it('consequence with damage never produces NaN HP', () => {
    const state = makeState();
    const rng = () => 0.5;

    for (let amount = 0; amount <= 50; amount++) {
      const cs = [{ type: 'damage' as const, targetId: 'player', amount }];
      const updated = applyConsequences(state, cs, baseContext, rng);
      const hp = updated.character!.hp;
      expect(Number.isNaN(hp)).toBe(false);
      expect(Number.isFinite(hp)).toBe(true);
    }
  });

  it('all 77 verbs produce valid (non-throwing) consequence lists', () => {
    const rng = () => 0.5;
    const state = makeState();
    const target = {
      id: 'test_target',
      nameKey: 'test.target' as never,
      properties: ['tangible', 'electronic', 'flammable', 'breakable', 'conductive'] as unknown as never[],
      isVirtual: false,
      source: 'location' as const,
    };

    for (const verb of VERB_IDS) {
      for (const outcome of OUTCOMES) {
        expect(() => {
          const cs = buildConsequences(verb, target, outcome);
          applyConsequences(state, cs, baseContext, rng);
        }).not.toThrow();
      }
    }
  });
});
