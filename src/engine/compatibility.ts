// ---------------------------------------------------------------------------
// src/engine/compatibility.ts — Verb-target compatibility checker
// ---------------------------------------------------------------------------

import type { PropertyId } from './properties';
import type { EntityState } from './entityState';
import { matchesState } from './entityState';
import type { Nature } from './nature';
import { natureOf, canBear } from './nature';
import type { VerbId } from './verbs';
import { VERB_REGISTRY, AUTO_VERBS } from './verbs';
import { BALANCE } from './constants';

// === TYPES ===

/** How far the target is from what the verb needs (decision F) */
export type ActionSeverity = 'compatible' | 'unsuited' | 'absurd';

/** Input to the compatibility checker */
export interface CompatibilityInput {
  readonly verbId: VerbId;
  readonly targetProps: readonly PropertyId[];
  readonly playerToolProps: readonly PropertyId[];
  readonly targetState?: EntityState;
}

/** Result of a compatibility check */
export interface CompatibilityResult {
  readonly compatible: boolean;
  readonly auto: boolean;
  readonly toolBlocking: boolean;
  /** Total surcharge for a standalone reading: properties + missing tool. */
  readonly difficultyPenalty: number;
  /**
   * Surcharge owed to the target alone. The DC calculator uses this one and
   * prices the tool itself, which it does more finely.
   */
  readonly propertyPenalty: number;
  readonly failedClause: string | null;
  readonly severity: ActionSeverity;
  /** True when only a critical can carry the action — never an outright refusal. */
  readonly requiresCritical: boolean;
  readonly nature: Nature;
}

// === CONSTANTS ===

const MISSING_TOOL_PENALTY = 5;

// === CHECKER ===

/** The clause the target is closest to satisfying, and what it still lacks. */
function nearestClause(
  clauses: readonly (readonly PropertyId[])[],
  targetSet: ReadonlySet<PropertyId>,
): readonly PropertyId[] {
  let best: readonly PropertyId[] = [];
  let bestCount = Number.POSITIVE_INFINITY;

  for (const clause of clauses) {
    const missing = clause.filter(prop => !targetSet.has(prop));
    if (missing.length < bestCount) {
      bestCount = missing.length;
      best = missing;
      if (bestCount === 0) break;
    }
  }

  return best;
}

/**
 * Checks whether a verb can be applied to a target given the player's tools.
 * Never throws, and never refuses — an inconceivable action becomes one that
 * only a critical can carry.
 *
 * - compatible: true if all property requirements AND tool requirements are met
 * - auto: true if the verb requires no dice roll
 * - toolBlocking: true if the verb requires a tool the player doesn't have
 * - difficultyPenalty: DC surcharge, proportional to how much the target lacks
 * - failedClause: human-readable description of what failed (null if compatible)
 */
export function checkCompatibility(input: CompatibilityInput): CompatibilityResult {
  const verb = VERB_REGISTRY[input.verbId];

  const isAuto = AUTO_VERBS.has(input.verbId);
  const targetSet = new Set(input.targetProps);
  const toolSet = new Set(input.playerToolProps);
  const nature = natureOf(input.targetProps);

  const { targetProps: clauses, requiredToolProp, requiredState } = verb.requirements;

  // Check target property requirements (OR between clauses, AND within)
  const missing = clauses.length === 0 ? [] : nearestClause(clauses, targetSet);
  let propsSatisfied = missing.length === 0;
  let severity: ActionSeverity = 'compatible';
  let failedClause: string | null = null;

  if (!propsSatisfied) {
    failedClause = clauses.map((c: readonly PropertyId[]) => c.join('+')).join(' OR ');
    const conceivable = missing.every(prop => canBear(input.targetProps, prop, nature));
    severity = conceivable ? 'unsuited' : 'absurd';
  }

  // Wrong state is a different failure from wrong nature: unlocking an already
  // unlocked door is pointless, not absurd.
  if (propsSatisfied && requiredState !== undefined && !matchesState(input.targetState ?? {}, requiredState)) {
    propsSatisfied = false;
    severity = 'unsuited';
    failedClause = Object.entries(requiredState).map(([axis, value]) => `${axis}=${String(value)}`).join('+');
  }

  // Check tool requirement
  const toolBlocking = requiredToolProp !== null && !toolSet.has(requiredToolProp);

  const compatible = propsSatisfied && !toolBlocking;
  let propertyPenalty = 0;

  if (severity === 'unsuited') {
    // Distance, not a flat verdict: one missing property is a stretch, three is a leap.
    propertyPenalty = BALANCE.CONTEXT_MODIFIERS.UNSUITED_PER_MISSING_PROPERTY
      * Math.max(1, missing.length);
  }

  // Cap penalty at maximum possible
  const maxPenalty = BALANCE.MAX_DIFFICULTY - BALANCE.BASE_DIFFICULTY;
  propertyPenalty = Math.min(propertyPenalty, maxPenalty);
  const difficultyPenalty = Math.min(
    propertyPenalty + (toolBlocking ? MISSING_TOOL_PENALTY : 0),
    maxPenalty,
  );

  return {
    compatible,
    auto: isAuto,
    toolBlocking,
    difficultyPenalty,
    propertyPenalty,
    failedClause,
    severity,
    requiresCritical: severity === 'absurd',
    nature,
  };
}
