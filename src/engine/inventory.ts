// ---------------------------------------------------------------------------
// src/engine/inventory.ts — Item management (add, remove, equip, unequip)
// ---------------------------------------------------------------------------

import type { GameState, CharacterState } from './types';
import { BALANCE } from './constants';

/**
 * Check if an item can be added to the inventory (not at slot cap).
 */
export function canAddItem(inventory: readonly string[]): boolean {
  return inventory.length < BALANCE.INVENTORY_SLOTS;
}

/**
 * Add an item to the inventory.
 * Returns success=false if inventory is at BALANCE.INVENTORY_SLOTS cap.
 */
export function addItem(
  inventory: readonly string[],
  itemId: string,
): { readonly success: boolean; readonly inventory: readonly string[] } {
  if (!canAddItem(inventory)) {
    return { success: false, inventory };
  }
  return { success: true, inventory: [...inventory, itemId] };
}

/**
 * Remove an item from the inventory (first occurrence).
 * Returns success=false if the item is not present.
 */
export function removeItem(
  inventory: readonly string[],
  itemId: string,
): { readonly success: boolean; readonly inventory: readonly string[] } {
  const idx = inventory.indexOf(itemId);
  if (idx === -1) {
    return { success: false, inventory };
  }
  const next = [...inventory];
  next.splice(idx, 1);
  return { success: true, inventory: next };
}

/**
 * Equip an item from the character's inventory to the given slot.
 * No-ops if the item is not in the character's inventory.
 */
export function equipItem(
  character: CharacterState,
  itemId: string,
  slot: 'weapon' | 'armor',
): CharacterState {
  if (!character.inventory.includes(itemId)) return character;
  if (slot === 'weapon') {
    return { ...character, equippedWeapon: itemId };
  }
  return { ...character, equippedArmor: itemId };
}

/**
 * Unequip the item in the given slot (sets to null).
 */
export function unequipItem(
  character: CharacterState,
  slot: 'weapon' | 'armor',
): CharacterState {
  if (slot === 'weapon') {
    return { ...character, equippedWeapon: null };
  }
  return { ...character, equippedArmor: null };
}

/**
 * Apply updated inventory, equippedWeapon, and equippedArmor to the game state.
 * Returns unchanged state if character is null.
 */
export function applyInventoryToState(
  state: GameState,
  newInventory: readonly string[],
  equippedWeapon: string | null,
  equippedArmor: string | null,
): GameState {
  if (state.character === null) return state;
  return {
    ...state,
    character: {
      ...state.character,
      inventory: newInventory,
      equippedWeapon,
      equippedArmor,
    },
  };
}
