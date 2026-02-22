// ---------------------------------------------------------------------------
// src/engine/loot.ts — Bonus loot tables and nat-20 loot check
// ---------------------------------------------------------------------------

import type { LootDrop, LootTableEntry, RngFn } from './types';
import { BALANCE } from './constants';
import { defaultRng } from './dice';

/** Default combat loot table */
export const COMBAT_LOOT_TABLE: readonly LootTableEntry[] = [
  { itemId: 'ration', weight: 3 },
  { itemId: 'stimulant', weight: 2 },
  { itemId: 'medical_kit', weight: 1 },
  { itemId: 'oxygen_canister', weight: 1 },
];

/** Default search loot table */
export const SEARCH_LOOT_TABLE: readonly LootTableEntry[] = [
  { itemId: 'ration', weight: 3 },
  { itemId: 'cable', weight: 2 },
  { itemId: 'duct_tape', weight: 2 },
  { itemId: 'stimulant', weight: 1 },
];

/**
 * Pick a random item from a weighted loot table.
 */
export function pickFromLootTable(
  table: readonly LootTableEntry[],
  rng: RngFn = defaultRng,
): string {
  const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * totalWeight;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return entry.itemId;
  }
  // Fallback (should never reach here with valid table)
  const last = table[table.length - 1];
  return last ? last.itemId : '';
}

/**
 * Check for bonus loot on a natural 20.
 * 50% chance (BONUS_LOOT.CHANCE_ON_NAT_20) to trigger a loot drop.
 * Returns LootDrop or null.
 */
export function checkBonusLoot(
  source: 'combat' | 'search' | 'skill_check',
  rng: RngFn = defaultRng,
): LootDrop | null {
  if (rng() >= BALANCE.BONUS_LOOT.CHANCE_ON_NAT_20) return null;

  const table = source === 'combat' ? COMBAT_LOOT_TABLE : SEARCH_LOOT_TABLE;
  const itemId = pickFromLootTable(table, rng);

  return { itemId, source, isBonus: true };
}
