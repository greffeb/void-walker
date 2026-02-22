// ---------------------------------------------------------------------------
// tests/stress/conditionStacking.test.ts — All 5 conditions stacked, stats valid
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  CONDITION_DEFINITIONS,
  applyConditionMalus,
  getConditionRollModifier,
  tickConditions,
  addCondition,
  checkConditionTriggers,
} from '../../src/engine/conditions';
import type { ActiveCondition, StatBlock } from '../../src/engine/types';
import { STAT_IDS, CONDITION_IDS } from '../../src/engine/types';

function makeStats(base: number): StatBlock {
  const block: Record<string, number> = {};
  for (const stat of STAT_IDS) block[stat] = base;
  return block as unknown as StatBlock;
}

describe('Condition stacking stress test', () => {
  test('all 5 conditions stacked: no stat goes below 0', () => {
    // Test with every possible base stat value 0-5
    for (let base = 0; base <= 5; base++) {
      const stats = makeStats(base);
      const allConditions: ActiveCondition[] = CONDITION_IDS.map(id => ({
        id,
        remainingActions: CONDITION_DEFINITIONS[id].durationType === 'timed'
          ? (CONDITION_DEFINITIONS[id].durationActions ?? null)
          : null,
      }));

      const modified = applyConditionMalus(stats, allConditions);

      for (const stat of STAT_IDS) {
        expect(modified[stat]).toBeGreaterThanOrEqual(0);
        expect(modified[stat]).not.toBeNaN();
        expect(Number.isInteger(modified[stat])).toBe(true);
      }
    }
  });

  test('all 5 conditions: roll modifier is correct', () => {
    const allConditions: ActiveCondition[] = CONDITION_IDS.map(id => ({
      id, remainingActions: null,
    }));
    const mod = getConditionRollModifier(allConditions);
    // Only terrified gives -1
    expect(mod).toBe(-1);
  });

  test('timed conditions expire after correct number of ticks', () => {
    const timedConditions = CONDITION_IDS
      .filter(id => CONDITION_DEFINITIONS[id].durationType === 'timed');

    for (const condId of timedConditions) {
      const duration = CONDITION_DEFINITIONS[condId].durationActions!;
      let conditions: readonly ActiveCondition[] = addCondition([], condId);

      for (let tick = 0; tick < duration; tick++) {
        const { updatedConditions } = tickConditions(conditions);
        if (tick < duration - 1) {
          expect(updatedConditions).toHaveLength(1);
          expect(updatedConditions[0].remainingActions).toBe(duration - tick - 1);
        } else {
          expect(updatedConditions).toHaveLength(0);
        }
        conditions = updatedConditions;
      }
    }
  });

  test('poisoned drains exactly POISONED_HP_DRAIN per tick for 100 ticks', () => {
    const conditions: ActiveCondition[] = [{ id: 'poisoned', remainingActions: null }];
    let totalDrain = 0;

    for (let i = 0; i < 100; i++) {
      const { hpDrain } = tickConditions(conditions);
      totalDrain += hpDrain;
      expect(hpDrain).toBeGreaterThan(0);
    }

    expect(totalDrain).toBe(100);
  });

  test('adding same condition twice does not duplicate', () => {
    for (const condId of CONDITION_IDS) {
      let conditions: readonly ActiveCondition[] = [];
      conditions = addCondition(conditions, condId);
      conditions = addCondition(conditions, condId);
      expect(conditions).toHaveLength(1);
    }
  });

  test('condition triggers never produce duplicates with existing conditions', () => {
    const rng = () => 0.3; // deterministic, triggers terrified on crit_failure

    for (let hp = 1; hp <= 20; hp++) {
      const existing: ActiveCondition[] = CONDITION_IDS.map(id => ({
        id, remainingActions: null,
      }));

      const triggers = checkConditionTriggers(hp, 20, existing, {
        firstThreatEncounter: true,
        criticalFailure: true,
        actionsInColdZone: 10,
        toxicContact: true,
        actionsWithoutRest: 20,
      }, rng);

      // Should trigger nothing since all conditions already exist
      expect(triggers).toHaveLength(0);
    }
  });
});
