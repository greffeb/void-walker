// ---------------------------------------------------------------------------
// tests/stress/scenarioAssembly.test.ts — Phase 6 stress test
// ---------------------------------------------------------------------------
// 100 random assemblies with varying seeds — every one must pass graph
// validation. Catches structural bugs in assembleScenario / buildLocationGraph.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { assembleScenario, validateAssembledScenario } from '../../src/engine/pacing';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
import { LAUNCH_SKELETONS } from '../../src/content/scenarios/index';
import { LAUNCH_SETTINGS } from '../../src/content/settings';
import type { SessionLength } from '../../src/engine/scenario';

const SESSION_LENGTHS: readonly SessionLength[] = ['quick', 'standard', 'extended'];

// ---------------------------------------------------------------------------
// Seeded RNG
// ---------------------------------------------------------------------------

function createSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function rngPick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

// ---------------------------------------------------------------------------
// 100 random assemblies
// ---------------------------------------------------------------------------

describe('scenarioAssembly: 100 random assemblies all pass validation', () => {
  it('all 100 random assemblies produce valid scenarios', () => {
    const failures: string[] = [];
    const BASE_SEED = 2025_06_01;
    const RUNS = 100;

    for (let i = 0; i < RUNS; i++) {
      const rng = createSeededRng(BASE_SEED + i);
      const skeleton = rngPick(rng, LAUNCH_SKELETONS);
      const setting = rngPick(rng, LAUNCH_SETTINGS);
      const sessionLength = rngPick(rng, SESSION_LENGTHS);

      const scenario = assembleScenario(skeleton, sessionLength, setting, ALL_MODULES, rng);
      const validation = validateAssembledScenario(scenario.graph, scenario.skeleton);

      if (!validation.valid) {
        failures.push(
          `Run ${i} (seed ${BASE_SEED + i}, ${skeleton.id}×${setting.id}×${sessionLength}): ` +
          validation.issues.join('; '),
        );
      }
    }

    expect(
      failures,
      `${failures.length} assemblies failed:\n${failures.join('\n')}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Graph structural invariants across 50 random assemblies
// ---------------------------------------------------------------------------

describe('graph structural invariants across 50 random assemblies', () => {
  it('all graphs have a start node', () => {
    for (let i = 0; i < 50; i++) {
      const rng = createSeededRng(9000 + i);
      const skeleton = rngPick(rng, LAUNCH_SKELETONS);
      const setting = rngPick(rng, LAUNCH_SETTINGS);
      const scenario = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, rng);

      const hasStart = scenario.graph.nodes.some(n => n.coreNodeId === 'start');
      expect(hasStart).toBe(true);
    }
  });

  it('all graphs have a resolution (boss) node', () => {
    for (let i = 0; i < 50; i++) {
      const rng = createSeededRng(8000 + i);
      const skeleton = rngPick(rng, LAUNCH_SKELETONS);
      const setting = rngPick(rng, LAUNCH_SETTINGS);
      const scenario = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, rng);

      const hasBoss = scenario.graph.nodes.some(n => n.coreNodeId === 'boss');
      expect(hasBoss).toBe(true);
    }
  });

  it('all graphs have bidirectional edges', () => {
    for (let i = 0; i < 50; i++) {
      const rng = createSeededRng(7000 + i);
      const skeleton = rngPick(rng, LAUNCH_SKELETONS);
      const setting = rngPick(rng, LAUNCH_SETTINGS);
      const scenario = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, rng);

      for (const edge of scenario.graph.edges) {
        if (edge.bidirectional) {
          const reverse = scenario.graph.edges.find(e => e.from === edge.to && e.to === edge.from);
          expect(
            reverse,
            `Missing reverse edge: ${edge.to} → ${edge.from}`,
          ).toBeDefined();
        }
      }
    }
  });

  it('all node IDs are unique within a graph', () => {
    for (let i = 0; i < 50; i++) {
      const rng = createSeededRng(6000 + i);
      const skeleton = rngPick(rng, LAUNCH_SKELETONS);
      const setting = rngPick(rng, LAUNCH_SETTINGS);
      const scenario = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, rng);

      const ids = scenario.graph.nodes.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });

  it('all graph node locations have a nameKey with fr text', () => {
    for (let i = 0; i < 50; i++) {
      const rng = createSeededRng(5000 + i);
      const skeleton = rngPick(rng, LAUNCH_SKELETONS);
      const setting = rngPick(rng, LAUNCH_SETTINGS);
      const scenario = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, rng);

      for (const node of scenario.graph.nodes) {
        expect(node.nameKey.fr, `Node ${node.id} missing fr name`).toBeTruthy();
      }
    }
  });
});
