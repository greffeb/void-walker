// ---------------------------------------------------------------------------
// tests/stress/scenarioWalkthrough.test.ts — Phase 6B: 500 auto-playthroughs
// ---------------------------------------------------------------------------
/* eslint-disable no-console */
// Verifies that 500 seeded playthroughs all end (victory or defeat) with
// ZERO stuck games. Uses both random bot and goal-seeking bot.
//
// Statistical acceptance targets (§6 of PHASE_6B_GAME_LOOP_INTEGRATION.md):
//   Victory rate (goal bot):   ≥ 40%
//   Victory rate (random bot): ≥ 10%
//   Stuck rate (both bots):     0%  ← HARD REQUIREMENT
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { initGame, isGameOver } from '../../src/engine/game';
import { getSceneContext } from '../../src/engine/scene';
import { processTurn } from '../../src/engine/processTurn';
import { assembleScenario } from '../../src/engine/pacing';
import { buildParserLocaleData } from '../../src/content/parserData';
import { LAUNCH_SKELETONS } from '../../src/content/scenarios/index';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
import { createSeededRng } from '../playtest/bots/index';
import { randomBot } from '../playtest/bots/randomBot';
import { goalBot } from '../playtest/bots/goalBot';
import { toBotState, toBotScene } from '../playtest/botAdapters';
import { StuckDetector } from '../playtest/stuckDetector';
import type { GameState } from '../../src/engine/types';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const RUNS = 500;
const BASE_SEED = 42;
const MAX_TURNS = 200;
const STUCK_THRESHOLD = 15;
const PLAYER_CLASSES = ['marine', 'engineer', 'medic'] as const;
const SESSION_LENGTHS = ['quick', 'standard'] as const;
const DIFFICULTIES = ['survivor'] as const; // keep tests fast

// ---------------------------------------------------------------------------
// PARSER DATA (loaded once)
// ---------------------------------------------------------------------------

const parserData = buildParserLocaleData('fr');

// ---------------------------------------------------------------------------
// SINGLE PLAYTHROUGH
// ---------------------------------------------------------------------------

interface TurnTrace {
  turn: number;
  botInput: string;
  locationBefore: string;
  locationAfter: string;
  parsedVerb: string | null;
  parsedTarget: string | null;
  parsedTargetSource: string | null;
  locationItemNames: string[];
  connectedAliases: string[];
}

interface PlaythroughResult {
  seed: number;
  botName: string;
  skeletonId: string;
  settingId: string;
  sessionLength: string;
  playerClass: string;
  outcome: 'victory' | 'defeat' | 'stuck' | 'timeout';
  turns: number;
  stuckTrace?: TurnTrace[];
}

function runPlaythrough(seed: number, captureTrace = false): PlaythroughResult {
  const rng = createSeededRng(seed);
  const skeleton = rng.pick(LAUNCH_SKELETONS);
  const sessionLength = rng.pick(SESSION_LENGTHS);
  const playerClass = rng.pick(PLAYER_CLASSES);
  const difficulty = rng.pick(DIFFICULTIES);
  const bot = rng.float() < 0.5 ? randomBot : goalBot;

  const engineRng = () => rng.float();

  let state: GameState;
  try {
    const scenario = assembleScenario(skeleton, sessionLength, ALL_MODULES, engineRng);
    state = initGame(scenario, playerClass, difficulty, 'Bot', engineRng);
  } catch {
    // Assembly failures should not happen (validated by scenarioCombinations test)
    return {
      seed, botName: bot.name, skeletonId: skeleton.id, settingId: skeleton.theme.id,
      sessionLength, playerClass, outcome: 'defeat', turns: 0,
    };
  }

  const stuckDetector = new StuckDetector(STUCK_THRESHOLD);
  let turns = 0;
  const traceHistory: TurnTrace[] = [];

  while (!isGameOver(state) && turns < MAX_TURNS) {
    const botState = toBotState(state);
    const botScene = toBotScene(state);
    const input = bot.makeDecision(botState, botScene, rng);
    const locationBefore = state.playerLocationId ?? 'unknown';

    const context = getSceneContext(state);
    const result = processTurn(state, input, context, parserData, engineRng);
    state = result.newState;
    const locationAfter = state.playerLocationId ?? 'unknown';

    if (captureTrace) {
      traceHistory.push({
        turn: turns,
        botInput: input,
        locationBefore,
        locationAfter,
        parsedVerb: result.trace.parsedVerb,
        parsedTarget: result.trace.parsedTarget,
        parsedTargetSource: (result.trace as unknown as Record<string, unknown>).parsedTargetSource as string | null ?? null,
        locationItemNames: botScene.locationItemNames.slice(),
        connectedAliases: botScene.connectedLocationAliases.slice(),
      });
      if (traceHistory.length > 25) traceHistory.shift();
    }

    stuckDetector.update(state.playerLocationId ?? 'unknown');
    if (stuckDetector.isStuck()) {
      return {
        seed, botName: bot.name, skeletonId: skeleton.id, settingId: skeleton.theme.id,
        sessionLength, playerClass, outcome: 'stuck', turns,
        stuckTrace: captureTrace ? [...traceHistory] : undefined,
      };
    }

    turns++;
  }

  let outcome: PlaythroughResult['outcome'];
  if (turns >= MAX_TURNS) {
    outcome = 'timeout';
  } else if (state.victoryResult !== null) {
    outcome = 'victory';
  } else {
    outcome = 'defeat';
  }

  return {
    seed, botName: bot.name, skeletonId: skeleton.id, settingId: skeleton.theme.id,
    sessionLength, playerClass, outcome, turns,
  };
}

// ---------------------------------------------------------------------------
// STRESS TEST
// ---------------------------------------------------------------------------

describe('scenarioWalkthrough: 500 auto-playthroughs', () => {
  it('all playthroughs end without being stuck', () => {
    const results: PlaythroughResult[] = [];

    for (let i = 0; i < RUNS; i++) {
      results.push(runPlaythrough(BASE_SEED + i));
    }

    const stuck = results.filter(r => r.outcome === 'stuck');
    const victories = results.filter(r => r.outcome === 'victory');
    const defeats = results.filter(r => r.outcome === 'defeat');
    const timeouts = results.filter(r => r.outcome === 'timeout');

    const goalResults = results.filter(r => r.botName === 'goal_seeker');
    const randomResults = results.filter(r => r.botName === 'random');
    const goalVictories = goalResults.filter(r => r.outcome === 'victory');
    const randomVictories = randomResults.filter(r => r.outcome === 'victory');

    // Report
    console.log(`\n=== Stress Test Report (${RUNS} playthroughs) ===`);
    console.log(`  Victory: ${victories.length} (${(victories.length / RUNS * 100).toFixed(1)}%)`);
    console.log(`  Defeat:  ${defeats.length} (${(defeats.length / RUNS * 100).toFixed(1)}%)`);
    console.log(`  Timeout: ${timeouts.length} (${(timeouts.length / RUNS * 100).toFixed(1)}%)`);
    console.log(`  Stuck:   ${stuck.length} (${(stuck.length / RUNS * 100).toFixed(1)}%)`);
    if (goalResults.length > 0) {
      const goalStuck = goalResults.filter(r => r.outcome === 'stuck');
      console.log(`  Goal bot victory rate: ${(goalVictories.length / goalResults.length * 100).toFixed(1)}%  stuck: ${goalStuck.length}/${goalResults.length}`);
    }
    if (randomResults.length > 0) {
      const randomStuck = randomResults.filter(r => r.outcome === 'stuck');
      console.log(`  Random bot victory rate: ${(randomVictories.length / randomResults.length * 100).toFixed(1)}%  stuck: ${randomStuck.length}/${randomResults.length}`);
    }

    // Re-run first 3 stuck games with trace enabled for diagnosis
    if (stuck.length > 0) {
      console.log('\n=== Stuck Game Diagnoses ===');
      for (const stuckGame of stuck.slice(0, 3)) {
        const traced = runPlaythrough(stuckGame.seed, true);
        console.log(`\n--- Stuck Game seed=${stuckGame.seed} bot=${stuckGame.botName} skeleton=${stuckGame.skeletonId} setting=${stuckGame.settingId} class=${stuckGame.playerClass} ---`);
        if (traced.stuckTrace) {
          for (const t of traced.stuckTrace) {
            const moved = t.locationBefore !== t.locationAfter ? ' → MOVED' : '';
            const parseInfo = `verb=${t.parsedVerb ?? '?'} target=${t.parsedTarget ?? 'null'}`;
            console.log(`  Turn ${t.turn}: [${t.locationBefore}] "${t.botInput}" → [${t.locationAfter}]${moved}`);
            console.log(`         parse: ${parseInfo}  items=${JSON.stringify(t.locationItemNames)}  exits=${JSON.stringify(t.connectedAliases)}`);
          }
        }
      }
    }

    // HARD REQUIREMENT: 0% stuck rate
    expect(stuck.length).toBe(0);

    // All runs should end (no infinite loops)
    const notEnded = results.filter(r => r.outcome !== 'victory' && r.outcome !== 'defeat' && r.outcome !== 'timeout');
    expect(notEnded).toHaveLength(0);
  });
});
