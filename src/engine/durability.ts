// ---------------------------------------------------------------------------
// src/engine/durability.ts — Item breakage, improvised weapon degradation, repair
// ---------------------------------------------------------------------------

import type { DiceResult, ItemDurabilityState, PassiveEffectId } from './types';
import type { VerbId } from './verbs';
import type { PropertyId } from './properties';
import { BALANCE } from './constants';

/** Combat verbs that use a weapon normally */
const WEAPON_COMBAT_VERBS: readonly VerbId[] = [
  'STRIKE', 'CUT', 'THROW', 'SHOOT',
];

/** Verbs that count as improvised weapon usage */
const IMPROVISED_COMBAT_VERBS: readonly VerbId[] = [
  'STRIKE', 'CUT', 'THROW', 'IMPROVISE_WEAPON',
];

/**
 * Check if an item breaks after use.
 * - Fragile items break on nat 1 (critical failure)
 * - Non-weapon items used in combat break after IMPROVISED_WEAPON_MAX_USES
 */
export function checkItemBreakage(
  itemProps: readonly PropertyId[],
  itemType: string,
  verb: VerbId,
  rollResult: DiceResult,
  combatUses: number,
): boolean {
  // Normal weapons don't break from combat
  if (itemType === 'weapon' && (WEAPON_COMBAT_VERBS as readonly string[]).includes(verb)) {
    return false;
  }

  // Fragile items break on nat 1
  if (itemProps.includes('fragile') && rollResult.fumble) {
    return true;
  }

  // Improvised weapons break after max uses
  const isImprovisedUse = verb === 'IMPROVISE_WEAPON' ||
    (itemType !== 'weapon' && (IMPROVISED_COMBAT_VERBS as readonly string[]).includes(verb));
  if (isImprovisedUse && combatUses >= BALANCE.DURABILITY.IMPROVISED_WEAPON_MAX_USES) {
    return true;
  }

  return false;
}

/**
 * Check if a player can repair a given item.
 * Engineer passive (REPAIR_ALL_BROKEN): can repair any easily_repairable item.
 * Others: only easily_repairable items.
 * Note: all repairable items in the game use the easily_repairable property.
 */
export function canRepairItem(
  itemProps: readonly PropertyId[],
  passiveEffect: PassiveEffectId,
): boolean {
  if (!itemProps.includes('easily_repairable')) return false;
  // Engineer can always repair easily_repairable items
  if (passiveEffect === 'REPAIR_ALL_BROKEN') return true;
  // Others can also repair easily_repairable items
  return true;
}

/**
 * Calculate repair DC for an item.
 * Non-engineers get a penalty.
 */
export function getRepairDC(passiveEffect: PassiveEffectId): number {
  const base = BALANCE.DURABILITY.REPAIR_BASE_DC;
  const penalty = passiveEffect === 'REPAIR_ALL_BROKEN'
    ? 0
    : BALANCE.DURABILITY.NON_ENGINEER_REPAIR_PENALTY;
  return base + penalty;
}

/**
 * Apply item breakage: returns updated durability state with broken = true.
 */
export function breakItem(state: ItemDurabilityState): ItemDurabilityState {
  return { broken: true, combatUses: state.combatUses };
}

/**
 * Increment combat uses for an improvised weapon.
 */
export function incrementCombatUses(state: ItemDurabilityState): ItemDurabilityState {
  return { ...state, combatUses: state.combatUses + 1 };
}

/**
 * Create a fresh durability state for a new item.
 */
export function createItemDurabilityState(): ItemDurabilityState {
  return { broken: false, combatUses: 0 };
}

/**
 * Repair an item: returns updated durability state with broken = false, combatUses reset.
 */
export function repairItem(_state: ItemDurabilityState): ItemDurabilityState {
  return { broken: false, combatUses: 0 };
}
