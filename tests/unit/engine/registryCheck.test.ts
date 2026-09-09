// ---------------------------------------------------------------------------
// tests/unit/engine/registryCheck.test.ts — Decision AA
// ---------------------------------------------------------------------------
// The audit found two parallel registries with no crossing and no collision
// detection (T3 / P6-6). This test is the crossing: it assembles every shipped
// skeleton many times and asserts no name resolves to two different things.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { findRegistryConflicts } from '../../../src/engine/registryCheck';
import { assembleScenario } from '../../../src/engine/pacing';
import { LAUNCH_SKELETONS } from '../../../src/content/scenarios/index';
import { ALL_MODULES } from '../../../src/content/scenarios/modules/index';
import { ALL_MICRO_MODULES } from '../../../src/content/microModules/index';
import type { AssembledScenario, LocationNode } from '../../../src/engine/scenario';
import type { SessionLength } from '../../../src/engine/scenario';

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const LENGTHS: readonly SessionLength[] = ['quick', 'standard', 'extended'];

describe('findRegistryConflicts', () => {
  it('reports an id that appears in two locations', () => {
    const scenario = {
      graph: {
        nodes: [
          { id: 'a', features: [], items: [{ id: 'keycard' }], npcs: [] },
          { id: 'b', features: [], items: [{ id: 'keycard' }], npcs: [] },
        ] as unknown as LocationNode[],
        edges: [],
      },
    } as unknown as AssembledScenario;

    const conflicts = findRegistryConflicts(scenario);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.kind).toBe('duplicate_item');
    expect(conflicts[0]!.locations).toEqual(['a', 'b']);
  });

  it('reports a scenario definition that contradicts the generic entry', () => {
    const scenario = {
      graph: {
        // The generic scanner is a tool; calling it a weapon cannot be merged.
        nodes: [{
          id: 'a', features: [], npcs: [],
          items: [{ id: 'scanner', itemType: 'weapon' }],
        }] as unknown as LocationNode[],
        edges: [],
      },
    } as unknown as AssembledScenario;

    expect(findRegistryConflicts(scenario).map(c => c.kind)).toContain('contradicts_generic');
  });

  it('accepts a scenario enriching a generic entry without contradicting it', () => {
    const scenario = {
      graph: {
        nodes: [{
          id: 'a', features: [], npcs: [],
          items: [{ id: 'scanner', itemType: 'tool', aliases: { fr: ['sonde'], en: ['probe'] } }],
        }] as unknown as LocationNode[],
        edges: [],
      },
    } as unknown as AssembledScenario;

    expect(findRegistryConflicts(scenario)).toEqual([]);
  });

  it('is silent on a clean scenario', () => {
    const scenario = {
      graph: {
        nodes: [
          { id: 'a', features: [], items: [{ id: 'scn_only_alpha' }], npcs: [] },
          { id: 'b', features: [], items: [{ id: 'scn_only_beta' }], npcs: [] },
        ] as unknown as LocationNode[],
        edges: [],
      },
    } as unknown as AssembledScenario;

    expect(findRegistryConflicts(scenario)).toEqual([]);
  });
});

describe('the shipped content has one namespace', () => {
  it('assembles every skeleton at every length without a name resolving twice', () => {
    const problems: string[] = [];

    for (const skeleton of LAUNCH_SKELETONS) {
      for (const length of LENGTHS) {
        for (let seed = 1; seed <= 12; seed++) {
          const scenario = assembleScenario(
            skeleton, length, ALL_MODULES, seededRng(seed * 7919), ALL_MICRO_MODULES,
          );
          for (const conflict of findRegistryConflicts(scenario)) {
            problems.push(
              `${skeleton.id}/${length}/seed${seed}: ${conflict.kind} "${conflict.id}" in ${conflict.locations.join(', ')}`,
            );
          }
        }
      }
    }

    expect([...new Set(problems)]).toEqual([]);
  });
});
