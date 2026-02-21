// ---------------------------------------------------------------------------
// tests/stress/generators/itemGenerator.ts — Synthetic item generator for stress tests
// ---------------------------------------------------------------------------

import type { PropertyId } from '../../../src/engine/properties';
import { PROPERTY_IDS } from '../../../src/engine/properties';

/** A synthetic item for stress testing */
export interface SyntheticItem {
  readonly id: string;
  readonly props: readonly PropertyId[];
}

/**
 * Deterministic LCG (Linear Congruential Generator) for reproducible tests.
 * Parameters from Numerical Recipes.
 */
function createLCG(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state;
  };
}

/**
 * Generates `count` synthetic items with deterministic, rotating property subsets.
 * Each item gets 1-8 properties selected via LCG from the full property list.
 */
export function generateSyntheticItems(count: number, seed: number = 42): readonly SyntheticItem[] {
  const rng = createLCG(seed);
  const propCount = PROPERTY_IDS.length;
  const items: SyntheticItem[] = [];

  for (let i = 0; i < count; i++) {
    const numProps = (rng() % 8) + 1; // 1–8 properties
    const props = new Set<PropertyId>();

    for (let j = 0; j < numProps; j++) {
      const idx = rng() % propCount;
      props.add(PROPERTY_IDS[idx]!);
    }

    items.push({
      id: `synthetic_${i}`,
      props: [...props],
    });
  }

  return items;
}
