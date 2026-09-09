// ---------------------------------------------------------------------------
// src/engine/secretVerbs.ts — Easter-egg verbs and how the game tires of them
// ---------------------------------------------------------------------------
// Decision W. Seven verbs the game never suggests. They always succeed, they
// change nothing mechanically, and the only thing that varies is how the world
// answers: the first time is a discovery, the next few land, and past that the
// game stops playing along.
//
// The engine only counts and grades. The words live in narration.
// ---------------------------------------------------------------------------

import type { VerbId } from './verbs';
import { SECRET_VERBS } from './verbs';
import { BALANCE } from './constants';
import type { GameState } from './types';

/** How the world answers this particular use. */
export type SecretVerbTier = 'discovery' | 'effect' | 'annoyed' | 'blocked';

/** True if the verb is one the game never proposes. */
export function isSecretVerb(verb: VerbId): boolean {
  return SECRET_VERBS.has(verb);
}

/** Which tier the n-th use falls into (1-based). */
export function tierForUse(useCount: number): SecretVerbTier {
  if (useCount <= 1) return 'discovery';
  if (useCount <= BALANCE.SECRET_VERB.EFFECT_USES) return 'effect';
  if (useCount <= BALANCE.SECRET_VERB.BLOCKED_USES) return 'annoyed';
  return 'blocked';
}

/**
 * Record one use of a secret verb.
 * Returns the new state and the tier this use earned.
 */
export function useSecretVerb(
  state: GameState,
  verb: VerbId,
): { readonly state: GameState; readonly tier: SecretVerbTier } {
  const useCount = (state.secretVerbUses[verb] ?? 0) + 1;
  return {
    state: { ...state, secretVerbUses: { ...state.secretVerbUses, [verb]: useCount } },
    tier: tierForUse(useCount),
  };
}
