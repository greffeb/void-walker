// ---------------------------------------------------------------------------
// src/engine/passives.ts — Class passive abilities: the single application point
// ---------------------------------------------------------------------------
// Decision G. A passive used to be read three different ways: the Engineer's
// through `durability.ts`, the Marine's through a hardcoded `className ===
// 'marine'` in `processTurn`, and the Medic's not at all — its i18n text
// promised "+2 HP per healing item" that no code ever granted.
//
// Every site that grants a class advantage now goes through this module, and no
// site outside it names a class.
// ---------------------------------------------------------------------------

import { CLASSES } from '../content/classes';
import { BALANCE } from './constants';
import type { PassiveAbility, PassiveEffectId, PlayerClassName } from './types';

/** The passive a class carries. */
export function passiveOf(className: PlayerClassName): PassiveAbility {
  return CLASSES[className].passiveAbility;
}

/** What the passive does — the value combat and repair code branch on. */
export function passiveEffectOf(className: PlayerClassName): PassiveEffectId {
  return passiveOf(className).effect;
}

/** How much it is worth, when it is a quantity. */
export function passiveValueOf(className: PlayerClassName): number | null {
  return passiveOf(className).value;
}

/**
 * Healing restored once the class is taken into account.
 *
 * The Medic's HEALING_BONUS applies to a real heal only: a passive that turns
 * nothing into something would let a failed treatment restore HP.
 */
export function applyHealingPassive(amount: number, className: PlayerClassName): number {
  if (amount <= 0) return amount;
  const passive = passiveOf(className);
  if (passive.effect !== 'HEALING_BONUS' || passive.value === null) return amount;
  return amount + passive.value;
}

/**
 * What a repair costs someone the Engineer's training did not cover.
 *
 * Same figure item durability has always charged, expressed as a modifier so
 * the generic REPAIR check carries it too.
 */
export function repairDifficultyModifier(className: PlayerClassName): number {
  return passiveEffectOf(className) === 'REPAIR_ALL_BROKEN'
    ? 0
    : BALANCE.DURABILITY.NON_ENGINEER_REPAIR_PENALTY;
}
