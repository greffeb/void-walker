// ---------------------------------------------------------------------------
// src/engine/compatibility.ts — Verb-target compatibility checker
// ---------------------------------------------------------------------------

import type { PropertyId } from './properties';
import type { VerbId } from './verbs';
import { VERB_REGISTRY, AUTO_VERBS } from './verbs';
import { BALANCE } from './constants';

// === TYPES ===

/** Input to the compatibility checker */
export interface CompatibilityInput {
  readonly verbId: VerbId;
  readonly targetProps: readonly PropertyId[];
  readonly playerToolProps: readonly PropertyId[];
}

/** Result of a compatibility check */
export interface CompatibilityResult {
  readonly compatible: boolean;
  readonly auto: boolean;
  readonly toolBlocking: boolean;
  readonly difficultyPenalty: number;
  readonly failedClause: string | null;
}

// === CONSTANTS ===

const INCOMPATIBLE_PROPS_PENALTY = 5;
const MISSING_TOOL_PENALTY = 5;

// === CHECKER ===

/**
 * Checks whether a verb can be applied to a target given the player's tools.
 * Never throws — always returns a valid result.
 *
 * - compatible: true if all property requirements AND tool requirements are met
 * - auto: true if the verb requires no dice roll
 * - toolBlocking: true if the verb requires a tool the player doesn't have
 * - difficultyPenalty: additional DC penalty for incompatible actions (0 if compatible)
 * - failedClause: human-readable description of what failed (null if compatible)
 */
export function checkCompatibility(input: CompatibilityInput): CompatibilityResult {
  const verb = VERB_REGISTRY[input.verbId];

  const isAuto = AUTO_VERBS.has(input.verbId);
  const targetSet = new Set(input.targetProps);
  const toolSet = new Set(input.playerToolProps);

  const { targetProps: clauses, requiredToolProp } = verb.requirements;

  // Check target property requirements (OR between clauses, AND within)
  let propsSatisfied = false;
  let failedClause: string | null = null;

  if (clauses.length === 0) {
    propsSatisfied = true;
  } else {
    for (const clause of clauses) {
      if (clause.every((prop: PropertyId) => targetSet.has(prop))) {
        propsSatisfied = true;
        break;
      }
    }
    if (!propsSatisfied) {
      failedClause = clauses.map((c: readonly PropertyId[]) => c.join('+')).join(' OR ');
    }
  }

  // Check tool requirement
  const toolBlocking = requiredToolProp !== null && !toolSet.has(requiredToolProp);

  const compatible = propsSatisfied && !toolBlocking;
  let penalty = 0;

  if (!propsSatisfied) {
    penalty += INCOMPATIBLE_PROPS_PENALTY;
  }
  if (toolBlocking) {
    penalty += MISSING_TOOL_PENALTY;
  }

  // Cap penalty at maximum possible
  const maxPenalty = BALANCE.MAX_DIFFICULTY - BALANCE.BASE_DIFFICULTY;
  penalty = Math.min(penalty, maxPenalty);

  return {
    compatible,
    auto: isAuto,
    toolBlocking,
    difficultyPenalty: penalty,
    failedClause,
  };
}
