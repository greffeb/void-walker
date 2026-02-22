// ---------------------------------------------------------------------------
// tests/unit/engine/loot.test.ts — Loot system unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  pickFromLootTable,
  checkBonusLoot,
  COMBAT_LOOT_TABLE,
  SEARCH_LOOT_TABLE,
} from '../../../src/engine/loot';
import type { RngFn, LootTableEntry } from '../../../src/engine/types';

function fixedRng(value: number): RngFn {
  return () => value;
}

describe('pickFromLootTable', () => {
  const table: LootTableEntry[] = [
    { itemId: 'a', weight: 1 },
    { itemId: 'b', weight: 2 },
    { itemId: 'c', weight: 1 },
  ];

  it('picks first item when rng returns 0', () => {
    expect(pickFromLootTable(table, fixedRng(0))).toBe('a');
  });

  it('picks based on weight distribution', () => {
    // total weight = 4
    // rng = 0.5 → roll = 2.0 → 2.0 - 1 = 1.0 → 1.0 - 2 = -1.0 → 'b'
    expect(pickFromLootTable(table, fixedRng(0.5))).toBe('b');
  });

  it('picks last item when rng approaches 1', () => {
    // rng = 0.99 → roll = 3.96 → -1 = 2.96 → -2 = 0.96 → -1 = -0.04 → 'c'
    expect(pickFromLootTable(table, fixedRng(0.99))).toBe('c');
  });

  it('always returns a valid item from the table', () => {
    for (let i = 0; i < 100; i++) {
      const result = pickFromLootTable(COMBAT_LOOT_TABLE, fixedRng(i / 100));
      expect(COMBAT_LOOT_TABLE.some(e => e.itemId === result)).toBe(true);
    }
  });
});

describe('checkBonusLoot', () => {
  it('returns loot when rng < CHANCE_ON_NAT_20', () => {
    // rng always returns 0.3: first call triggers loot (0.3 < 0.5), second picks from table
    const rng: RngFn = () => 0.3;
    const result = checkBonusLoot('combat', rng);

    expect(result).not.toBeNull();
    expect(result!.isBonus).toBe(true);
    expect(result!.source).toBe('combat');
  });

  it('returns null when rng >= CHANCE_ON_NAT_20', () => {
    const result = checkBonusLoot('combat', fixedRng(0.9));
    expect(result).toBeNull();
  });

  it('uses combat table for combat source', () => {
    const rng = fixedRng(0); // always 0 → first item
    const result = checkBonusLoot('combat', rng);
    expect(result).not.toBeNull();
    expect(result!.itemId).toBe(COMBAT_LOOT_TABLE[0].itemId);
  });

  it('uses search table for search source', () => {
    const rng = fixedRng(0);
    const result = checkBonusLoot('search', rng);
    expect(result).not.toBeNull();
    expect(result!.itemId).toBe(SEARCH_LOOT_TABLE[0].itemId);
  });

  it('uses search table for skill_check source', () => {
    const rng = fixedRng(0);
    const result = checkBonusLoot('skill_check', rng);
    expect(result).not.toBeNull();
  });
});
