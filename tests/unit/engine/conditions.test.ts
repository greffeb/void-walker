// ---------------------------------------------------------------------------
// tests/unit/engine/conditions.test.ts — Conditions system unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  CONDITION_DEFINITIONS,
  applyConditionMalus,
  getConditionRollModifier,
  tickConditions,
  checkConditionTriggers,
  addCondition,
  removeCondition,
} from '../../../src/engine/conditions';
import type { ActiveCondition, StatBlock, ConditionId } from '../../../src/engine/types';
import { BALANCE } from '../../../src/engine/constants';

function makeStats(overrides: Partial<Record<string, number>> = {}): StatBlock {
  return {
    FOR: 3, DEF: 3, AGI: 3, INT: 3, PER: 3, CHA: 3, LCK: 3,
    ...overrides,
  } as StatBlock;
}

function makeCond(id: ConditionId, remaining: number | null = null): ActiveCondition {
  return { id, remainingActions: remaining };
}

describe('CONDITION_DEFINITIONS', () => {
  it('defines all 5 conditions', () => {
    const ids: ConditionId[] = ['wounded', 'terrified', 'cold', 'poisoned', 'exhausted'];
    for (const id of ids) {
      expect(CONDITION_DEFINITIONS[id]).toBeDefined();
      expect(CONDITION_DEFINITIONS[id].id).toBe(id);
    }
  });

  it('terrified is timed', () => {
    expect(CONDITION_DEFINITIONS.terrified.durationType).toBe('timed');
    expect(CONDITION_DEFINITIONS.terrified.durationActions).toBe(BALANCE.CONDITIONS.TERRIFIED_DURATION);
  });

  it('poisoned has HP drain', () => {
    expect(CONDITION_DEFINITIONS.poisoned.hpDrainPerAction).toBe(BALANCE.CONDITIONS.POISONED_HP_DRAIN);
  });

  it('wounded is permanent until cured', () => {
    expect(CONDITION_DEFINITIONS.wounded.durationType).toBe('permanent_until_cured');
  });
});

describe('applyConditionMalus', () => {
  it('applies wounded malus (FOR-1, AGI-1)', () => {
    const stats = makeStats({ FOR: 4, AGI: 4 });
    const result = applyConditionMalus(stats, [makeCond('wounded')]);
    expect(result.FOR).toBe(3);
    expect(result.AGI).toBe(3);
    expect(result.INT).toBe(3); // unchanged
  });

  it('applies terrified malus (FOR-1, INT-1, CHA-1)', () => {
    const stats = makeStats({ FOR: 2, INT: 2, CHA: 2 });
    const result = applyConditionMalus(stats, [makeCond('terrified')]);
    expect(result.FOR).toBe(1);
    expect(result.INT).toBe(1);
    expect(result.CHA).toBe(1);
  });

  it('applies cold malus (AGI-2, INT-1)', () => {
    const stats = makeStats({ AGI: 3, INT: 3 });
    const result = applyConditionMalus(stats, [makeCond('cold')]);
    expect(result.AGI).toBe(1);
    expect(result.INT).toBe(2);
  });

  it('applies exhausted malus (FOR-1, DEF-1, AGI-1)', () => {
    const stats = makeStats({ FOR: 2, DEF: 2, AGI: 2 });
    const result = applyConditionMalus(stats, [makeCond('exhausted')]);
    expect(result.FOR).toBe(1);
    expect(result.DEF).toBe(1);
    expect(result.AGI).toBe(1);
  });

  it('floors stats at 0', () => {
    const stats = makeStats({ FOR: 0, AGI: 1 });
    const result = applyConditionMalus(stats, [makeCond('wounded')]);
    expect(result.FOR).toBe(0);
    expect(result.AGI).toBe(0);
  });

  it('stacks multiple conditions', () => {
    const stats = makeStats({ FOR: 4, AGI: 4, DEF: 3 });
    const result = applyConditionMalus(stats, [
      makeCond('wounded'),   // FOR-1, AGI-1
      makeCond('exhausted'), // FOR-1, DEF-1, AGI-1
    ]);
    expect(result.FOR).toBe(2);  // 4 - 1 - 1
    expect(result.AGI).toBe(2);  // 4 - 1 - 1
    expect(result.DEF).toBe(2);  // 3 - 1
  });
});

describe('getConditionRollModifier', () => {
  it('returns -1 when terrified', () => {
    expect(getConditionRollModifier([makeCond('terrified')])).toBe(-1);
  });

  it('returns 0 when no terrified condition', () => {
    expect(getConditionRollModifier([makeCond('wounded')])).toBe(0);
    expect(getConditionRollModifier([])).toBe(0);
  });
});

describe('tickConditions', () => {
  it('drains HP for poisoned', () => {
    const { hpDrain } = tickConditions([makeCond('poisoned')]);
    expect(hpDrain).toBe(BALANCE.CONDITIONS.POISONED_HP_DRAIN);
  });

  it('decrements timed conditions', () => {
    const { updatedConditions } = tickConditions([makeCond('terrified', 3)]);
    expect(updatedConditions).toHaveLength(1);
    expect(updatedConditions[0].remainingActions).toBe(2);
  });

  it('removes timed conditions when they expire', () => {
    const { updatedConditions } = tickConditions([makeCond('terrified', 1)]);
    expect(updatedConditions).toHaveLength(0);
  });

  it('keeps permanent conditions', () => {
    const { updatedConditions } = tickConditions([makeCond('wounded')]);
    expect(updatedConditions).toHaveLength(1);
    expect(updatedConditions[0].id).toBe('wounded');
  });

  it('processes multiple conditions', () => {
    const { updatedConditions, hpDrain } = tickConditions([
      makeCond('wounded'),
      makeCond('poisoned'),
      makeCond('terrified', 1),
    ]);
    expect(hpDrain).toBe(BALANCE.CONDITIONS.POISONED_HP_DRAIN);
    expect(updatedConditions).toHaveLength(2); // wounded + poisoned; terrified expired
    expect(updatedConditions.map(c => c.id)).toEqual(['wounded', 'poisoned']);
  });
});

describe('checkConditionTriggers', () => {
  it('triggers wounded at 30% HP', () => {
    const triggers = checkConditionTriggers(3, 10, [], {});
    expect(triggers).toContain('wounded');
  });

  it('does not trigger wounded above 30% HP', () => {
    const triggers = checkConditionTriggers(4, 10, [], {});
    expect(triggers).not.toContain('wounded');
  });

  it('does not re-trigger existing conditions', () => {
    const triggers = checkConditionTriggers(2, 10, [makeCond('wounded')], {});
    expect(triggers).not.toContain('wounded');
  });

  it('triggers terrified on first threat encounter', () => {
    const triggers = checkConditionTriggers(10, 10, [], { firstThreatEncounter: true });
    expect(triggers).toContain('terrified');
  });

  it('triggers cold after enough actions in cold zone', () => {
    const triggers = checkConditionTriggers(10, 10, [], {
      actionsInColdZone: BALANCE.CONDITIONS.COLD_ONSET_ACTIONS,
    });
    expect(triggers).toContain('cold');
  });

  it('triggers poisoned on toxic contact', () => {
    const triggers = checkConditionTriggers(10, 10, [], { toxicContact: true });
    expect(triggers).toContain('poisoned');
  });

  it('triggers exhausted after threshold actions', () => {
    const triggers = checkConditionTriggers(10, 10, [], {
      actionsWithoutRest: BALANCE.CONDITIONS.EXHAUSTION_THRESHOLD,
    });
    expect(triggers).toContain('exhausted');
  });

  it('terrified on crit failure has 50% chance', () => {
    // Fixed rng < 0.5 → triggers
    const triggers1 = checkConditionTriggers(10, 10, [], { criticalFailure: true }, () => 0.3);
    expect(triggers1).toContain('terrified');

    // Fixed rng >= 0.5 → does not trigger
    const triggers2 = checkConditionTriggers(10, 10, [], { criticalFailure: true }, () => 0.7);
    expect(triggers2).not.toContain('terrified');
  });
});

describe('addCondition', () => {
  it('adds a new condition', () => {
    const result = addCondition([], 'wounded');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('wounded');
    expect(result[0].remainingActions).toBeNull();
  });

  it('sets timer for timed conditions', () => {
    const result = addCondition([], 'terrified');
    expect(result[0].remainingActions).toBe(BALANCE.CONDITIONS.TERRIFIED_DURATION);
  });

  it('does not duplicate existing condition', () => {
    const existing = [makeCond('wounded')];
    const result = addCondition(existing, 'wounded');
    expect(result).toHaveLength(1);
    expect(result).toBe(existing); // same reference
  });
});

describe('removeCondition', () => {
  it('removes a condition', () => {
    const conditions = [makeCond('wounded'), makeCond('poisoned')];
    const result = removeCondition(conditions, 'wounded');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('poisoned');
  });

  it('returns same array if condition not present', () => {
    const conditions = [makeCond('wounded')];
    const result = removeCondition(conditions, 'poisoned');
    expect(result).toHaveLength(1);
  });
});
