// ---------------------------------------------------------------------------
// tests/stress/scenarioCombinations.test.ts — Phase 6 stress test
// ---------------------------------------------------------------------------
// Verifies all 27 skeleton × setting × session-length combinations
// produce valid, fully-connected scenario graphs.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { assembleScenario, validateAssembledScenario } from '../../src/engine/pacing';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
import { LAUNCH_SKELETONS } from '../../src/content/scenarios/index';
import { LAUNCH_SETTINGS } from '../../src/content/settings';
import type { SessionLength } from '../../src/engine/scenario';

const SESSION_LENGTHS: readonly SessionLength[] = ['quick', 'standard', 'extended'];

// ---------------------------------------------------------------------------
// Seeded RNG (deterministic)
// ---------------------------------------------------------------------------

function createSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// 27 combinations: 3 skeletons × 3 settings × 3 session lengths
// ---------------------------------------------------------------------------

describe('scenarioCombinations: all 27 combinations assemble valid scenarios', () => {
  for (const skeleton of LAUNCH_SKELETONS) {
    for (const setting of LAUNCH_SETTINGS) {
      for (const sessionLength of SESSION_LENGTHS) {
        it(`${skeleton.id} × ${setting.id} × ${sessionLength}`, () => {
          const seed = skeleton.id.length * 31 + setting.id.length * 17 + sessionLength.length;
          const rng = createSeededRng(seed);

          const scenario = assembleScenario(skeleton, sessionLength, setting, ALL_MODULES, rng);

          // Must have the right skeleton, setting, and session length
          expect(scenario.skeleton.id).toBe(skeleton.id);
          expect(scenario.setting.id).toBe(setting.id);
          expect(scenario.sessionLength).toBe(sessionLength);

          // Must have a valid graph
          const validation = validateAssembledScenario(scenario.graph, scenario.skeleton);
          expect(
            validation.valid,
            `${skeleton.id}×${setting.id}×${sessionLength} failed: ${validation.issues.join(', ')}`,
          ).toBe(true);

          // Graph must have nodes
          expect(scenario.graph.nodes.length).toBeGreaterThan(0);

          // Graph must have at least the 6 core nodes
          const coreNodeCount = scenario.graph.nodes.filter(n => n.isCoreNode).length;
          expect(coreNodeCount).toBe(6);
        });
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Quick session: exactly 6 core nodes, 0 modules
// ---------------------------------------------------------------------------

describe('quick session has 0 modules', () => {
  for (const skeleton of LAUNCH_SKELETONS) {
    it(`${skeleton.id} quick session has no placed modules`, () => {
      const rng = createSeededRng(42);
      const setting = LAUNCH_SETTINGS[0]!;
      const scenario = assembleScenario(skeleton, 'quick', setting, ALL_MODULES, rng);
      expect(scenario.modules).toHaveLength(0);
      expect(scenario.graph.nodes).toHaveLength(6);
    });
  }
});

// ---------------------------------------------------------------------------
// Standard session: 3-5 modules placed
// ---------------------------------------------------------------------------

describe('standard session places 3-5 modules', () => {
  for (const skeleton of LAUNCH_SKELETONS) {
    it(`${skeleton.id} standard session module count in range`, () => {
      let totalModules = 0;
      const RUNS = 5;
      for (let i = 0; i < RUNS; i++) {
        const rng = createSeededRng(1000 + i);
        const setting = LAUNCH_SETTINGS[0]!;
        const scenario = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, rng);
        totalModules += scenario.modules.length;
      }
      // Average should be around 3-5
      const avg = totalModules / RUNS;
      expect(avg).toBeGreaterThanOrEqual(2);
      expect(avg).toBeLessThanOrEqual(6);
    });
  }
});

// ---------------------------------------------------------------------------
// Module uniqueness: no module appears twice in the same scenario
// ---------------------------------------------------------------------------

describe('module uniqueness within a scenario', () => {
  it('no module ID appears twice across 27 combinations', () => {
    for (const skeleton of LAUNCH_SKELETONS) {
      for (const setting of LAUNCH_SETTINGS) {
        for (const sessionLength of SESSION_LENGTHS) {
          const rng = createSeededRng(99);
          const scenario = assembleScenario(skeleton, sessionLength, setting, ALL_MODULES, rng);
          const moduleIds = scenario.modules.map(p => p.module.id);
          const uniqueIds = new Set(moduleIds);
          expect(uniqueIds.size).toBe(moduleIds.length);
        }
      }
    }
  });
});
