// ---------------------------------------------------------------------------
// src/engine/scenarioFlagMapper.ts — Scenario flags → mechanical effects
// ---------------------------------------------------------------------------
// Decision Y: the engine must not know that a flag is called
// `cargo_jettisoned`. Each skeleton declares what its own flags mean, and this
// module only reads that declaration. Pure function — no side effects.
// ---------------------------------------------------------------------------

import type { ScenarioFlagEffect } from './scenario';

/**
 * Mechanical effects derived from scenario flags.
 * These are merged into VictoryCheckContext by buildVictoryCheckContext().
 */
export interface FlagEffects {
  readonly fullyContainedLocations: readonly string[];
  readonly activatedObjects: readonly string[];
  readonly selfDestructActive: boolean;
}

const EMPTY_EFFECTS: FlagEffects = {
  fullyContainedLocations: [],
  activatedObjects: [],
  selfDestructActive: false,
};

function isSatisfied(
  effect: ScenarioFlagEffect,
  flags: Readonly<Record<string, boolean>>,
): boolean {
  if (!effect.requiresAll.every(flag => flags[flag] === true)) return false;
  if (effect.requiresAny === undefined) return true;
  return effect.requiresAny.some(flag => flags[flag] === true);
}

/**
 * Read the skeleton's own flag declarations into mechanical effects.
 * Called by buildVictoryCheckContext() each turn.
 *
 * Lethality is deliberately absent: a room kills because its state says so, not
 * because a flag says it should. That is what locationStates is for.
 */
export function mapScenarioFlags(
  flags: Readonly<Record<string, boolean>> | undefined,
  effects: readonly ScenarioFlagEffect[] | undefined,
): FlagEffects {
  if (!flags || !effects || effects.length === 0) return EMPTY_EFFECTS;

  const fullyContainedLocations: string[] = [];
  const activatedObjects: string[] = [];
  let selfDestructActive = false;

  for (const effect of effects) {
    if (!isSatisfied(effect, flags)) continue;
    if (effect.containsLocations) fullyContainedLocations.push(...effect.containsLocations);
    if (effect.activatesObjects) activatedObjects.push(...effect.activatesObjects);
    if (effect.triggersSelfDestruct === true) selfDestructActive = true;
  }

  return { fullyContainedLocations, activatedObjects, selfDestructActive };
}
