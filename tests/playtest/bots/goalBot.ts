// ---------------------------------------------------------------------------
// tests/playtest/bots/goalBot.ts — Phase 6: Goal-seeking playtest bot
// ---------------------------------------------------------------------------
// Simulates a "reasonable player." Tests completability.
// Prioritizes: heal → pick up items → use suggestions → explore → backtrack.
// ---------------------------------------------------------------------------

import type { PlaytestBot, BotState, BotScene } from './index';

/**
 * Tries spent on one shut thing before the bot concludes it will not budge.
 * Measured over 500 seeded runs: 2 gives the most victories (4.0 %) at the
 * least cost in exploration; 3 and 4 spend more turns and more HP for fewer
 * wins, because forcing a lid hurts.
 */
const ATTEMPTS_PER_FEATURE = 2;

/**
 * How many times each shut feature was worked on, per run.
 *
 * A player who cannot open a locker gives up and walks away; without this
 * budget the bot hammered the same lid until the run stalled, and coverage
 * collapsed from 67 % to 43 %.
 */
const attempts = new Map<string, number>();
let lastTurn = -1;

function resetOnNewRun(state: BotState): void {
  if (state.turn === 0 || state.turn <= lastTurn) attempts.clear();
  lastTurn = state.turn;
}

function worthTrying(names: readonly string[], locationId: string): string[] {
  return names.filter(name => (attempts.get(`${locationId}:${name}`) ?? 0) < ATTEMPTS_PER_FEATURE);
}

function noteAttempt(name: string, locationId: string): void {
  const key = `${locationId}:${name}`;
  attempts.set(key, (attempts.get(key) ?? 0) + 1);
}

export const goalBot: PlaytestBot = {
  name: 'goal_seeker',

  makeDecision(
    state: BotState,
    scene: BotScene,
    rng: { float(): number; pick<T>(arr: readonly T[]): T },
  ): string {
    resetOnNewRun(state);

    // Priority 1: heal if critically low HP (< 30%)
    if (state.playerHp < state.playerMaxHp * 0.3 && scene.hasHealingItem) {
      return 'utiliser kit médical';
    }

    // Priority 2: pick up useful items in this location
    if (scene.locationItemIds.length > 0 && scene.locationItemNames.length > 0) {
      return `prendre ${rng.pick(scene.locationItemNames)}`;
    }

    // Priority 3: open what is shut, here and now — a player does not walk past
    // a locker they can force. Bounded, because a player who cannot open it
    // gives up rather than hammering the lid until the run stalls.
    const openable = worthTrying(scene.closedFeatureNames, state.playerLocationId);
    if (openable.length > 0) {
      const target = rng.pick(openable);
      noteAttempt(target, state.playerLocationId);
      if (scene.carriedKeyNames.length > 0 && rng.float() < 0.5) {
        return `utiliser ${rng.pick(scene.carriedKeyNames)} sur ${target}`;
      }
      return rng.float() < 0.5 ? `ouvrir ${target}` : `forcer ${target}`;
    }

    // Priority 4: engage with obstacle suggestions, but force movement every
    // 5 turns to avoid local loops.
    if (scene.suggestions.length > 0) {
      if (state.turn % 5 !== 0) {
        return scene.suggestions[0]!;
      }
    }

    // Priority 5: explore unexplored exits
    const unexploredIds = scene.connectedLocationIds.filter(
      id => !state.visitedLocationIds.includes(id),
    );
    if (unexploredIds.length > 0 && scene.connectedLocationAliases.length > 0) {
      const unexploredAliases = scene.connectedLocationAliases.filter((_, i) => {
        const id = scene.connectedLocationIds[i];
        return id !== undefined && !state.visitedLocationIds.includes(id);
      });
      const targets = unexploredAliases.length > 0 ? unexploredAliases : scene.connectedLocationAliases;
      return `aller ${rng.pick(targets)}`;
    }

    // Priority 6: backtrack to any known location
    if (scene.connectedLocationAliases.length > 0) {
      return `aller ${rng.pick(scene.connectedLocationAliases)}`;
    }

    // Fallback: examine surroundings
    return 'regarder autour';
  },
};
