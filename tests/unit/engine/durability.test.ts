// ---------------------------------------------------------------------------
// tests/unit/engine/durability.test.ts — Durability system unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  checkItemBreakage,
  canRepairItem,
  getRepairDC,
  breakItem,
  incrementCombatUses,
  createItemDurabilityState,
  repairItem,
} from '../../../src/engine/durability';
import type { DiceResult } from '../../../src/engine/types';
import type { PropertyId } from '../../../src/engine/properties';
import { BALANCE } from '../../../src/engine/constants';

function makeDiceResult(overrides: Partial<DiceResult> = {}): DiceResult {
  return {
    natural: 10, stat: 'FOR', statValue: 3, luckBonus: 1,
    modifier: 0, total: 14, difficulty: 12, success: true,
    critical: false, fumble: false,
    ...overrides,
  };
}

describe('checkItemBreakage', () => {
  it('weapons never break from normal combat verbs', () => {
    const fumble = makeDiceResult({ natural: 1, fumble: true });
    const props: PropertyId[] = ['fragile', 'metallic'];
    expect(checkItemBreakage(props, 'weapon', 'STRIKE', fumble, 0)).toBe(false);
    expect(checkItemBreakage(props, 'weapon', 'SHOOT', fumble, 0)).toBe(false);
  });

  it('fragile non-weapon items break on nat 1', () => {
    const fumble = makeDiceResult({ natural: 1, fumble: true });
    const props: PropertyId[] = ['fragile', 'electronic'];
    expect(checkItemBreakage(props, 'tool', 'USE', fumble, 0)).toBe(true);
  });

  it('non-fragile items do not break on nat 1', () => {
    const fumble = makeDiceResult({ natural: 1, fumble: true });
    const props: PropertyId[] = ['metallic', 'rigid'];
    expect(checkItemBreakage(props, 'tool', 'USE', fumble, 0)).toBe(false);
  });

  it('improvised weapons break after max uses', () => {
    const normal = makeDiceResult();
    const props: PropertyId[] = ['metallic'];
    const maxUses = BALANCE.DURABILITY.IMPROVISED_WEAPON_MAX_USES;
    expect(checkItemBreakage(props, 'tool', 'IMPROVISE_WEAPON', normal, maxUses)).toBe(true);
    expect(checkItemBreakage(props, 'tool', 'IMPROVISE_WEAPON', normal, maxUses - 1)).toBe(false);
  });

  it('non-weapon items used as STRIKE break after max uses', () => {
    const normal = makeDiceResult();
    const props: PropertyId[] = ['metallic'];
    const maxUses = BALANCE.DURABILITY.IMPROVISED_WEAPON_MAX_USES;
    expect(checkItemBreakage(props, 'tool', 'STRIKE', normal, maxUses)).toBe(true);
  });
});

describe('canRepairItem', () => {
  it('returns true for easily_repairable items regardless of passive', () => {
    const props: PropertyId[] = ['easily_repairable', 'metallic'];
    expect(canRepairItem(props, 'COMBAT_DAMAGE_BONUS')).toBe(true);
    expect(canRepairItem(props, 'REPAIR_ALL_BROKEN')).toBe(true);
  });

  it('returns false for items without easily_repairable', () => {
    const props: PropertyId[] = ['metallic', 'electronic'];
    expect(canRepairItem(props, 'REPAIR_ALL_BROKEN')).toBe(false);
  });
});

describe('getRepairDC', () => {
  it('returns base DC for engineer', () => {
    expect(getRepairDC('REPAIR_ALL_BROKEN')).toBe(BALANCE.DURABILITY.REPAIR_BASE_DC);
  });

  it('returns base DC + penalty for non-engineer', () => {
    expect(getRepairDC('COMBAT_DAMAGE_BONUS')).toBe(
      BALANCE.DURABILITY.REPAIR_BASE_DC + BALANCE.DURABILITY.NON_ENGINEER_REPAIR_PENALTY,
    );
  });
});

describe('breakItem', () => {
  it('sets broken to true', () => {
    const state = createItemDurabilityState();
    const broken = breakItem(state);
    expect(broken.broken).toBe(true);
    expect(broken.combatUses).toBe(0);
  });
});

describe('incrementCombatUses', () => {
  it('increments combat uses by 1', () => {
    const state = createItemDurabilityState();
    const updated = incrementCombatUses(state);
    expect(updated.combatUses).toBe(1);
    expect(updated.broken).toBe(false);
  });
});

describe('repairItem', () => {
  it('resets broken and combatUses', () => {
    const state = { broken: true, combatUses: 3 };
    const repaired = repairItem(state);
    expect(repaired.broken).toBe(false);
    expect(repaired.combatUses).toBe(0);
  });
});
