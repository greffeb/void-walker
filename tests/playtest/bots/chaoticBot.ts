// ---------------------------------------------------------------------------
// tests/playtest/bots/chaoticBot.ts — Absurd/failsafe stress bot
// ---------------------------------------------------------------------------
// Prioritizes bizarre action chains and obstacle pressure to stress:
// parser absurdity handling, compatibility penalties, and anti-softlock paths.
// ---------------------------------------------------------------------------

import { FUZZ_INPUTS } from './index';
import type { PlaytestBot, BotState, BotScene } from './index';

const FORCED_MOVE_INTERVAL = 8;

export const CHAOTIC_ABSURD_VERBS = [
  'manger',
  'boire',
  'lancer',
  'casser',
  'seduire',
  'interroger',
  'mordre',
  'caresser',
] as const;

const OBSTACLE_PRESSURE_VERBS = [
  'manger',
  'boire',
  'lancer',
  'seduire',
  'interroger',
  'casser',
] as const;

const ODD_FALLBACK_TARGETS = [
  'le mur',
  'le vide',
  'la poussiere',
  'mes bottes',
  'la porte',
] as const;

interface ChaoticMemory {
  lastTurn: number;
  lastLocation: string | null;
  locationStreak: number;
}

function createMemory(): ChaoticMemory {
  return {
    lastTurn: -1,
    lastLocation: null,
    locationStreak: 0,
  };
}

const memory: ChaoticMemory = createMemory();

function maybeResetMemory(state: BotState): void {
  if (state.turn === 0 || state.turn <= memory.lastTurn) {
    const reset = createMemory();
    memory.lastTurn = reset.lastTurn;
    memory.lastLocation = reset.lastLocation;
    memory.locationStreak = reset.locationStreak;
  }
}

function pickAbsurdTarget(scene: BotScene, rng: { pick<T>(arr: readonly T[]): T }): string {
  const dynamicTargets: string[] = [
    ...scene.locationItemNames,
    ...scene.environmentFeatureNames,
    ...scene.npcNames,
  ];
  const pool = dynamicTargets.length > 0 ? dynamicTargets : [...ODD_FALLBACK_TARGETS];
  return rng.pick(pool);
}

export const chaoticBot: PlaytestBot = {
  name: 'chaotic',

  makeDecision(
    state: BotState,
    scene: BotScene,
    rng: { float(): number; pick<T>(arr: readonly T[]): T },
  ): string {
    maybeResetMemory(state);
    memory.lastTurn = state.turn;

    if (memory.lastLocation === state.playerLocationId) {
      memory.locationStreak += 1;
    } else {
      memory.lastLocation = state.playerLocationId;
      memory.locationStreak = 1;
    }

    // Strong anti-stuck movement guard.
    if (
      scene.connectedLocationAliases.length > 0
      && (state.turn % FORCED_MOVE_INTERVAL === 0 || memory.locationStreak >= 5)
    ) {
      return `aller ${rng.pick(scene.connectedLocationAliases)}`;
    }

    // Obstacle pressure mode: repeatedly hammer obstacle target with odd verbs.
    if (scene.hasObstacle && scene.obstacleTargetId !== null) {
      return `${rng.pick(OBSTACLE_PRESSURE_VERBS)} ${scene.obstacleTargetId}`;
    }

    const roll = rng.float();

    // 82% absurd targeted commands.
    if (roll < 0.82) {
      const verb = rng.pick(CHAOTIC_ABSURD_VERBS);
      return `${verb} ${pickAbsurdTarget(scene, rng)}`;
    }

    // 8% suggestions.
    if (roll < 0.90 && scene.suggestions.length > 0) {
      return rng.pick(scene.suggestions);
    }

    // 8% movement.
    if (roll < 0.98 && scene.connectedLocationAliases.length > 0) {
      return `aller ${rng.pick(scene.connectedLocationAliases)}`;
    }

    // 5% pure fuzz.
    return rng.pick(FUZZ_INPUTS);
  },
};
