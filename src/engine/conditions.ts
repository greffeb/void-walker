// ---------------------------------------------------------------------------
// src/engine/conditions.ts — 5 status conditions, stat malus, tick, triggers
// ---------------------------------------------------------------------------

import type {
  ConditionId, ConditionDefinition, ActiveCondition, StatBlock, RngFn,
} from './types';
import { BALANCE } from './constants';

/** Static condition definitions */
export const CONDITION_DEFINITIONS: Readonly<Record<ConditionId, ConditionDefinition>> = {
  wounded: {
    id: 'wounded',
    nameKey: 'condition.wounded',
    statMalus: { FOR: -1, AGI: -1 },
    hpDrainPerAction: 0,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'USE medical_kit OR USE stimulant',
  },
  terrified: {
    id: 'terrified',
    nameKey: 'condition.terrified',
    statMalus: { FOR: -1, INT: -1, CHA: -1 },
    hpDrainPerAction: 0,
    specialEffect: 'ALL_ROLLS_MINUS_1',
    durationType: 'timed',
    durationActions: BALANCE.CONDITIONS.TERRIFIED_DURATION,
    cureMethod: 'TIME OR CALM OR USE stimulant',
  },
  cold: {
    id: 'cold',
    nameKey: 'condition.cold',
    statMalus: { AGI: -2, INT: -1 },
    hpDrainPerAction: 0,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'MOVE_TO warm area OR IGNITE',
  },
  poisoned: {
    id: 'poisoned',
    nameKey: 'condition.poisoned',
    statMalus: { FOR: -1 },
    hpDrainPerAction: BALANCE.CONDITIONS.POISONED_HP_DRAIN,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'USE medical_kit OR USE antidote',
  },
  exhausted: {
    id: 'exhausted',
    nameKey: 'condition.exhausted',
    statMalus: { FOR: -1, DEF: -1, AGI: -1 },
    hpDrainPerAction: 0,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'USE ration OR USE stimulant OR WAIT in safe room',
  },
};

/**
 * Apply all condition stat maluses to base stats.
 * Stats floor at 0 (never negative).
 */
export function applyConditionMalus(
  baseStats: StatBlock,
  conditions: readonly ActiveCondition[],
): StatBlock {
  const modified: Record<string, number> = { ...baseStats };
  for (const cond of conditions) {
    const def = CONDITION_DEFINITIONS[cond.id];
    for (const [stat, malus] of Object.entries(def.statMalus)) {
      if (malus !== undefined) {
        modified[stat] = Math.max(0, (modified[stat] ?? 0) + malus);
      }
    }
  }
  return modified as unknown as StatBlock;
}

/**
 * Get the global roll modifier from conditions (e.g., terrified = ALL_ROLLS_MINUS_1).
 */
export function getConditionRollModifier(conditions: readonly ActiveCondition[]): number {
  let mod = 0;
  for (const cond of conditions) {
    const def = CONDITION_DEFINITIONS[cond.id];
    if (def.specialEffect === 'ALL_ROLLS_MINUS_1') {
      mod -= 1;
    }
  }
  return mod;
}

/**
 * Tick all conditions: drain HP for poisoned, decrement timers, remove expired.
 * Returns updated conditions list and total HP drain.
 */
export function tickConditions(
  conditions: readonly ActiveCondition[],
): { readonly updatedConditions: readonly ActiveCondition[]; readonly hpDrain: number } {
  let hpDrain = 0;
  const updated: ActiveCondition[] = [];

  for (const cond of conditions) {
    const def = CONDITION_DEFINITIONS[cond.id];
    hpDrain += def.hpDrainPerAction;

    if (def.durationType === 'timed' && cond.remainingActions !== null) {
      const remaining = cond.remainingActions - 1;
      if (remaining > 0) {
        updated.push({ ...cond, remainingActions: remaining });
      }
      // expired: don't include
    } else {
      updated.push(cond);
    }
  }

  return { updatedConditions: updated, hpDrain };
}

/** Trigger context for condition checks */
export interface ConditionTriggerContext {
  readonly firstThreatEncounter?: boolean;
  readonly criticalFailure?: boolean;
  readonly actionsInColdZone?: number;
  readonly toxicContact?: boolean;
  readonly actionsWithoutRest?: number;
}

/**
 * Check if conditions should trigger based on current state.
 * Returns array of condition IDs to add (caller deduplicates).
 */
export function checkConditionTriggers(
  hp: number,
  maxHp: number,
  existingConditions: readonly ActiveCondition[],
  context: ConditionTriggerContext,
  rng: RngFn = Math.random,
): readonly ConditionId[] {
  const triggers: ConditionId[] = [];
  const existing = new Set(existingConditions.map(c => c.id));

  // Wounded: HP at or below 30%
  if (!existing.has('wounded') && hp / maxHp <= BALANCE.CONDITIONS.WOUNDED_HP_THRESHOLD) {
    triggers.push('wounded');
  }

  // Terrified: first threat encounter or 50% chance on combat critical failure
  if (!existing.has('terrified')) {
    if (context.firstThreatEncounter) triggers.push('terrified');
    else if (context.criticalFailure && rng() < 0.5) triggers.push('terrified');
  }

  // Cold: 3+ actions in cold zone
  if (!existing.has('cold') && (context.actionsInColdZone ?? 0) >= BALANCE.CONDITIONS.COLD_ONSET_ACTIONS) {
    triggers.push('cold');
  }

  // Poisoned: toxic contact
  if (!existing.has('poisoned') && context.toxicContact) {
    triggers.push('poisoned');
  }

  // Exhausted: 10+ actions without rest
  if (!existing.has('exhausted') && (context.actionsWithoutRest ?? 0) >= BALANCE.CONDITIONS.EXHAUSTION_THRESHOLD) {
    triggers.push('exhausted');
  }

  return triggers;
}

/**
 * Add a condition to the active list (no duplicates).
 */
export function addCondition(
  conditions: readonly ActiveCondition[],
  conditionId: ConditionId,
): readonly ActiveCondition[] {
  if (conditions.some(c => c.id === conditionId)) return conditions;
  const def = CONDITION_DEFINITIONS[conditionId];
  return [
    ...conditions,
    {
      id: conditionId,
      remainingActions: def.durationType === 'timed' ? (def.durationActions ?? null) : null,
    },
  ];
}

/**
 * Remove a condition (cure).
 */
export function removeCondition(
  conditions: readonly ActiveCondition[],
  conditionId: ConditionId,
): readonly ActiveCondition[] {
  return conditions.filter(c => c.id !== conditionId);
}
