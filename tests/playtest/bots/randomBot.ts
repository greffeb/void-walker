// ---------------------------------------------------------------------------
// tests/playtest/bots/randomBot.ts — Phase 6: Random playtest bot
// ---------------------------------------------------------------------------
// Catches crashes, infinite loops, and missing templates.
// Simple but powerful — makes completely random decisions.
// ---------------------------------------------------------------------------

import type { PlaytestBot, BotState, BotScene } from './index';
import { FUZZ_INPUTS } from './index';

export const randomBot: PlaytestBot = {
  name: 'random',

  makeDecision(
    _state: BotState,
    scene: BotScene,
    rng: { float(): number; pick<T>(arr: readonly T[]): T },
  ): string {
    const roll = rng.float();

    // 40%: move to a random connected location (boosted to prevent stuck)
    if (roll < 0.40 && scene.connectedLocationAliases.length > 0) {
      return `aller ${rng.pick(scene.connectedLocationAliases)}`;
    }

    // 30%: pick a random suggestion
    if (roll < 0.70 && scene.suggestions.length > 0) {
      return rng.pick(scene.suggestions);
    }

    // 20%: interact with a random visible item
    if (roll < 0.90 && scene.locationItemNames.length > 0) {
      const itemName = rng.pick(scene.locationItemNames);
      const verb = rng.pick(['examiner', 'prendre', 'utiliser', 'pousser'] as const);
      return `${verb} ${itemName}`;
    }

    // 10%: completely random/fuzz input
    return rng.pick(FUZZ_INPUTS);
  },
};
