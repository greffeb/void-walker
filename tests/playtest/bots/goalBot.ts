// ---------------------------------------------------------------------------
// tests/playtest/bots/goalBot.ts — Phase 6: Goal-seeking playtest bot
// ---------------------------------------------------------------------------
// Simulates a "reasonable player." Tests completability.
// Prioritizes: heal → pick up items → use suggestions → explore → backtrack.
// ---------------------------------------------------------------------------

import type { PlaytestBot, BotState, BotScene } from './index';

/**
 * Tries spent on one shut thing before the bot concludes it will not budge.
 * A player who cannot open a locker gives up and walks away; without a budget
 * the bot hammered the same lid until the run stalled, and coverage collapsed
 * from 67 % to 43 %.
 */
const ATTEMPTS_PER_ACT = 2;

/** How many times each proposed act was tried, per run. */
const attempts = new Map<string, number>();
let lastTurn = -1;

function resetOnNewRun(state: BotState): void {
  if (state.turn === 0 || state.turn <= lastTurn) attempts.clear();
  lastTurn = state.turn;
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

    // Priority 2: leave while you still can. The bot had no self-preservation
    // at all: it traded blows at 3 HP with the escape pod open beside it, and
    // died one step from the end of the game. A player walks.
    const unexplored = scene.connectedLocationAliases.filter((_, i) => {
      const id = scene.connectedLocationIds[i];
      return id !== undefined && !state.visitedLocationIds.includes(id);
    });
    if (state.playerHp < state.playerMaxHp * 0.4 && unexplored.length > 0) {
      return `aller ${rng.pick(unexplored)}`;
    }

    // Priority 3: pick up useful items in this location
    if (scene.locationItemIds.length > 0 && scene.locationItemNames.length > 0) {
      return `prendre ${rng.pick(scene.locationItemNames)}`;
    }

    // Priority 4: do what the scene says can be done about what is in the way.
    // This used to be hand-rolled here — "ouvrir" or "forcer" against a list of
    // shut features the adapter derived itself — which was written when the
    // scene named no such act. It does now, including which carried item opens
    // what, so a reasonable player reads it instead of guessing.
    const worthTrying = scene.obstacleSuggestions.filter(
      act => (attempts.get(`${state.playerLocationId}:${act}`) ?? 0) < ATTEMPTS_PER_ACT,
    );
    if (worthTrying.length > 0) {
      const act = worthTrying[0]!;
      const key = `${state.playerLocationId}:${act}`;
      attempts.set(key, (attempts.get(key) ?? 0) + 1);
      return act;
    }

    // Priority 4: engage with remaining suggestions, but force movement every
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
