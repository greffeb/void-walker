// ---------------------------------------------------------------------------
// src/engine/dice.ts — Dice rolling, LCK effects, outcome classification
// ---------------------------------------------------------------------------
// Foundation for all resolution: D20 + stat vs DC.
// LCK never adds to a total (decision A3): it widens the critical window and
// can negate a natural 1. All functions are pure with injectable RNG.
// ---------------------------------------------------------------------------

import type { StatId, DiceResult, RollOutcome, RngFn } from './types';
import { BALANCE } from './constants';

/** Default RNG using Math.random */
export const defaultRng: RngFn = () => Math.random();

/**
 * Roll a D20. Returns 1–20.
 */
export function rollD20(rng: RngFn = defaultRng): number {
  return Math.floor(rng() * 20) + 1;
}

/**
 * Lowest natural roll that counts as a critical success.
 * LCK 0 → 20 (only a nat 20). LCK 5 → 18.
 */
export function critThreshold(lck: number): number {
  const widening = Math.floor(Math.max(0, lck) / BALANCE.LUCK.CRIT_WINDOW_DIVISOR);
  return 20 - widening;
}

/**
 * Roll LCK's chance to negate a bad extreme — a natural 1, or an incoming hit.
 * Probability is lck / NEGATION_DENOMINATOR. LCK 0 never negates.
 */
export function rollLuckNegation(lck: number, rng: RngFn = defaultRng): boolean {
  if (lck <= 0) return false;
  return rng() < lck / BALANCE.LUCK.NEGATION_DENOMINATOR;
}

/**
 * Classify the outcome of a roll based on natural value and total vs DC.
 * A natural at or above `threshold` is a critical success regardless of total.
 * A natural 1 is a critical failure unless LCK negated it.
 */
export function classifyOutcome(
  natural: number,
  total: number,
  difficulty: number,
  threshold: number = 20,
  fumbleNegated: boolean = false,
): RollOutcome {
  if (natural >= threshold) return 'crit_success';
  if (natural === 1 && !fumbleNegated) return 'crit_failure';
  if (total >= difficulty) return 'success';
  return 'failure';
}

/**
 * Perform a full skill check: D20 + statValue + modifier vs DC.
 * LCK is spent on the crit window and on negating a natural 1, never on the total.
 */
export function rollCheck(
  stat: StatId,
  statValue: number,
  lck: number,
  difficulty: number,
  modifier: number = 0,
  rng: RngFn = defaultRng,
  requiresCritical: boolean = false,
): DiceResult {
  const natural = rollD20(rng);
  const threshold = critThreshold(lck);
  // Only consume RNG on the roll that can actually be negated, so a change of
  // luck never shifts the rest of the sequence for an unrelated roll.
  const fumbleNegated = natural === 1 && rollLuckNegation(lck, rng);
  const total = natural + statValue + modifier;
  const outcome = classifyOutcome(natural, total, difficulty, threshold, fumbleNegated);
  const critical = outcome === 'crit_success';

  return {
    natural,
    stat,
    statValue,
    critThreshold: threshold,
    fumbleNegated,
    modifier,
    total,
    difficulty,
    // An absurd action can only be carried by a critical: the total is irrelevant.
    success: requiresCritical ? critical : (critical || outcome === 'success'),
    critical,
    fumble: outcome === 'crit_failure',
  };
}

/**
 * Read the verdict back off a completed roll.
 * The only correct way to classify a DiceResult: it already carries the crit
 * window, the fumble reprieve and any critical-only requirement.
 */
export function outcomeOf(roll: DiceResult): RollOutcome {
  if (roll.critical) return 'crit_success';
  if (roll.fumble) return 'crit_failure';
  return roll.success ? 'success' : 'failure';
}

/**
 * Roll for NPC dodge. Returns true if the NPC dodges.
 */
export function rollDodge(dodgeChance: number, rng: RngFn = defaultRng): boolean {
  return rng() < dodgeChance;
}

/**
 * Roll for passive player dodge (AGI >= threshold grants PASSIVE_DODGE_CHANCE).
 * Returns true if the player dodges.
 */
export function rollPassiveDodge(agi: number, rng: RngFn = defaultRng): boolean {
  if (agi < BALANCE.COMBAT.PASSIVE_DODGE_AGI_THRESHOLD) return false;
  return rng() < BALANCE.COMBAT.PASSIVE_DODGE_CHANCE;
}
