// ---------------------------------------------------------------------------
// tests/playtest/bots/registry.ts — Playtest bot registry and selection
// ---------------------------------------------------------------------------

import { goalBot } from './goalBot';
import { randomBot } from './randomBot';
import { explorerBot } from './explorerBot';
import { chaoticBot } from './chaoticBot';
import type { PlaytestBot } from './index';

export type BotMode = 'goal' | 'random' | 'explorer' | 'chaotic' | 'mixed';

export const BOT_REGISTRY = {
  goal: goalBot,
  random: randomBot,
  explorer: explorerBot,
  chaotic: chaoticBot,
} as const;

export const ALL_BOTS: readonly PlaytestBot[] = [
  goalBot,
  randomBot,
  explorerBot,
  chaoticBot,
];

export function selectBot(mode: BotMode, rng: { float(): number }): PlaytestBot {
  if (mode === 'goal') return goalBot;
  if (mode === 'random') return randomBot;
  if (mode === 'explorer') return explorerBot;
  if (mode === 'chaotic') return chaoticBot;
  return rng.float() < 0.5 ? randomBot : goalBot;
}
