// ---------------------------------------------------------------------------
// tests/stress/allVerbsAllItems.test.ts — 500K+ verb×item compatibility combos
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { VERB_IDS, AUTO_VERBS } from '../../src/engine/verbs';
import { checkCompatibility } from '../../src/engine/compatibility';
import { BALANCE } from '../../src/engine/constants';
import { generateSyntheticItems } from './generators/itemGenerator';

// 77 verbs × 7000 items = 539,000 combos
const SYNTHETIC_COUNT = 7000;
const syntheticItems = generateSyntheticItems(SYNTHETIC_COUNT);

const maxPenalty = BALANCE.MAX_DIFFICULTY - BALANCE.BASE_DIFFICULTY;

describe('stress: all verbs × all synthetic items', () => {
  test(`generates ${SYNTHETIC_COUNT} synthetic items`, () => {
    expect(syntheticItems.length).toBe(SYNTHETIC_COUNT);
  });

  test(`runs ${VERB_IDS.length} × ${SYNTHETIC_COUNT} = ${VERB_IDS.length * SYNTHETIC_COUNT}+ compatibility checks without throwing`, () => {
    const failures: string[] = [];
    let count = 0;

    for (const verbId of VERB_IDS) {
      for (const item of syntheticItems) {
        const result = checkCompatibility({
          verbId,
          targetProps: item.props,
          playerToolProps: item.props,
        });

        if (typeof result.compatible !== 'boolean') {
          failures.push(`${verbId}×${item.id}: compatible not boolean`);
        }
        if (typeof result.auto !== 'boolean') {
          failures.push(`${verbId}×${item.id}: auto not boolean`);
        }
        if (typeof result.toolBlocking !== 'boolean') {
          failures.push(`${verbId}×${item.id}: toolBlocking not boolean`);
        }
        if (typeof result.difficultyPenalty !== 'number') {
          failures.push(`${verbId}×${item.id}: difficultyPenalty not number`);
        }
        if (result.difficultyPenalty < 0 || result.difficultyPenalty > maxPenalty) {
          failures.push(`${verbId}×${item.id}: penalty ${result.difficultyPenalty} out of [0, ${maxPenalty}]`);
        }

        count++;
      }
    }

    expect(failures).toEqual([]);
    expect(count).toBe(VERB_IDS.length * SYNTHETIC_COUNT);
  });

  test('auto verbs remain auto regardless of target properties', () => {
    const failures: string[] = [];

    for (const verbId of VERB_IDS) {
      if (!AUTO_VERBS.has(verbId)) continue;

      for (const item of syntheticItems) {
        const result = checkCompatibility({
          verbId,
          targetProps: item.props,
          playerToolProps: [],
        });

        if (!result.auto) {
          failures.push(`${verbId}×${item.id}: expected auto=true`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  test('all penalties are within [0, maxPenalty] range', () => {
    const failures: string[] = [];

    for (const verbId of VERB_IDS) {
      for (const item of syntheticItems) {
        const result = checkCompatibility({
          verbId,
          targetProps: item.props,
          playerToolProps: [],
        });

        if (result.difficultyPenalty < 0 || result.difficultyPenalty > maxPenalty) {
          failures.push(`${verbId}×${item.id}: penalty ${result.difficultyPenalty}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
