// ---------------------------------------------------------------------------
// tests/unit/engine/inventory.test.ts — Inventory management
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  canAddItem, addItem, removeItem,
  equipItem, unequipItem, applyInventoryToState,
} from '../../../src/engine/inventory';
import { createInitialGameState } from '../../../src/engine/types';
import { BALANCE } from '../../../src/engine/constants';
import type { CharacterState, GameState } from '../../../src/engine/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCharacter(
  inventory: string[] = [],
  equippedWeapon: string | null = null,
  equippedArmor: string | null = null,
): CharacterState {
  return {
    name: 'Test',
    className: 'marine',
    stats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 2 },
    hp: 14,
    maxHp: 14,
    oxygen: 100,
    inventory,
    equippedWeapon,
    equippedArmor,
    conditions: [],
    durability: {},
    actionsInColdZone: 0,
    actionsWithoutRest: 0,
  };
}

function makeStateWithChar(
  inventory: string[] = [],
  equippedWeapon: string | null = null,
  equippedArmor: string | null = null,
): GameState {
  const base = createInitialGameState();
  return {
    ...base,
    phase: 'playing',
    character: makeCharacter(inventory, equippedWeapon, equippedArmor),
  };
}

const FULL_INVENTORY = Array.from({ length: BALANCE.INVENTORY_SLOTS }, (_, i) => `item_${i}`);

// ---------------------------------------------------------------------------
// canAddItem
// ---------------------------------------------------------------------------

describe('canAddItem', () => {
  it('returns true when inventory is empty', () => {
    expect(canAddItem([])).toBe(true);
  });

  it('returns true when inventory has 7 of 8 items', () => {
    expect(canAddItem(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toBe(true);
  });

  it('returns false when inventory is at cap (8)', () => {
    expect(canAddItem(FULL_INVENTORY)).toBe(false);
  });

  it('cap matches BALANCE.INVENTORY_SLOTS', () => {
    const almostFull = Array.from({ length: BALANCE.INVENTORY_SLOTS - 1 }, (_, i) => `x_${i}`);
    expect(canAddItem(almostFull)).toBe(true);
    expect(canAddItem([...almostFull, 'one_more'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addItem
// ---------------------------------------------------------------------------

describe('addItem', () => {
  it('adds item to empty inventory', () => {
    const result = addItem([], 'laser_pistol');
    expect(result.success).toBe(true);
    expect(result.inventory).toContain('laser_pistol');
    expect(result.inventory).toHaveLength(1);
  });

  it('adds item to non-empty inventory', () => {
    const result = addItem(['knife'], 'ration');
    expect(result.success).toBe(true);
    expect(result.inventory).toContain('knife');
    expect(result.inventory).toContain('ration');
  });

  it('fails when inventory is full', () => {
    const result = addItem(FULL_INVENTORY, 'extra_item');
    expect(result.success).toBe(false);
    expect(result.inventory).toHaveLength(BALANCE.INVENTORY_SLOTS);
    expect(result.inventory).not.toContain('extra_item');
  });

  it('does not mutate original inventory', () => {
    const original = ['knife'];
    addItem(original, 'ration');
    expect(original).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------

describe('removeItem', () => {
  it('removes existing item', () => {
    const result = removeItem(['knife', 'ration'], 'knife');
    expect(result.success).toBe(true);
    expect(result.inventory).not.toContain('knife');
    expect(result.inventory).toContain('ration');
  });

  it('fails when item not in inventory', () => {
    const result = removeItem(['knife'], 'laser_pistol');
    expect(result.success).toBe(false);
    expect(result.inventory).toContain('knife');
  });

  it('removes first occurrence only (no duplicates in normal play)', () => {
    const result = removeItem(['knife', 'knife'], 'knife');
    expect(result.success).toBe(true);
    expect(result.inventory).toHaveLength(1);
    expect(result.inventory).toContain('knife');
  });

  it('does not mutate original inventory', () => {
    const original = ['knife', 'ration'];
    removeItem(original, 'knife');
    expect(original).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// equipItem
// ---------------------------------------------------------------------------

describe('equipItem', () => {
  it('equips weapon slot', () => {
    const char = makeCharacter(['laser_pistol']);
    const updated = equipItem(char, 'laser_pistol', 'weapon');
    expect(updated.equippedWeapon).toBe('laser_pistol');
  });

  it('equips armor slot', () => {
    const char = makeCharacter(['eva_suit']);
    const updated = equipItem(char, 'eva_suit', 'armor');
    expect(updated.equippedArmor).toBe('eva_suit');
  });

  it('equipping when item not in inventory returns character unchanged', () => {
    const char = makeCharacter(['knife']);
    const updated = equipItem(char, 'laser_pistol', 'weapon');
    expect(updated.equippedWeapon).toBeNull();
  });

  it('equipping replaces previous equipped item in slot', () => {
    const char = makeCharacter(['laser_pistol', 'multitool'], 'multitool');
    const updated = equipItem(char, 'laser_pistol', 'weapon');
    expect(updated.equippedWeapon).toBe('laser_pistol');
  });

  it('does not mutate original character', () => {
    const char = makeCharacter(['laser_pistol']);
    equipItem(char, 'laser_pistol', 'weapon');
    expect(char.equippedWeapon).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// unequipItem
// ---------------------------------------------------------------------------

describe('unequipItem', () => {
  it('clears weapon slot', () => {
    const char = makeCharacter(['laser_pistol'], 'laser_pistol');
    const updated = unequipItem(char, 'weapon');
    expect(updated.equippedWeapon).toBeNull();
  });

  it('clears armor slot', () => {
    const char = makeCharacter(['eva_suit'], null, 'eva_suit');
    const updated = unequipItem(char, 'armor');
    expect(updated.equippedArmor).toBeNull();
  });

  it('no-ops when slot already empty', () => {
    const char = makeCharacter([]);
    const updated = unequipItem(char, 'weapon');
    expect(updated.equippedWeapon).toBeNull();
  });

  it('does not mutate original', () => {
    const char = makeCharacter(['laser_pistol'], 'laser_pistol');
    unequipItem(char, 'weapon');
    expect(char.equippedWeapon).toBe('laser_pistol');
  });
});

// ---------------------------------------------------------------------------
// applyInventoryToState
// ---------------------------------------------------------------------------

describe('applyInventoryToState', () => {
  it('updates inventory and equipped slots in state', () => {
    const state = makeStateWithChar(['knife']);
    const updated = applyInventoryToState(
      state, ['laser_pistol', 'knife'], 'laser_pistol', null,
    );
    expect(updated.character!.inventory).toEqual(['laser_pistol', 'knife']);
    expect(updated.character!.equippedWeapon).toBe('laser_pistol');
    expect(updated.character!.equippedArmor).toBeNull();
  });

  it('returns state unchanged when character is null', () => {
    const state = createInitialGameState();
    const updated = applyInventoryToState(state, ['knife'], null, null);
    expect(updated.character).toBeNull();
  });

  it('does not mutate original state', () => {
    const state = makeStateWithChar(['knife']);
    applyInventoryToState(state, ['ration'], null, null);
    expect(state.character!.inventory).toEqual(['knife']);
  });
});
