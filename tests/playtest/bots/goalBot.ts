// ---------------------------------------------------------------------------
// tests/playtest/bots/goalBot.ts — Phase 6: Goal-seeking playtest bot
// ---------------------------------------------------------------------------
// Simulates a "reasonable player." Tests completability.
// Prioritizes: heal → pick up items → use suggestions → explore → backtrack.
// ---------------------------------------------------------------------------

import type { PlaytestBot, BotState, BotScene } from './index';

export const goalBot: PlaytestBot = {
  name: 'goal_seeker',

  makeDecision(
    state: BotState,
    scene: BotScene,
    rng: { float(): number; pick<T>(arr: readonly T[]): T },
  ): string {
    // Priority 1: heal if critically low HP (< 30%)
    if (state.playerHp < state.playerMaxHp * 0.3 && scene.hasHealingItem) {
      return 'utiliser kit médical';
    }

    // Priority 2: pick up useful items in this location
    if (scene.locationItemIds.length > 0 && scene.locationItemNames.length > 0) {
      return `prendre ${rng.pick(scene.locationItemNames)}`;
    }

    // Priority 3: engage with obstacle suggestions, but force movement every
    // 5 turns to avoid local loops.
    if (scene.suggestions.length > 0) {
      if (state.turn % 5 !== 0) {
        return scene.suggestions[0]!;
      }
    }

    // Priority 4: explore unexplored exits
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

    // Priority 5: backtrack to any known location
    if (scene.connectedLocationAliases.length > 0) {
      return `aller ${rng.pick(scene.connectedLocationAliases)}`;
    }

    // Fallback: examine surroundings
    return 'regarder autour';
  },
};
