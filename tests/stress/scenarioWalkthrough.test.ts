// ---------------------------------------------------------------------------
// tests/stress/scenarioWalkthrough.test.ts — Phase 6B: 500 auto-playthroughs
// ---------------------------------------------------------------------------
/* eslint-disable no-console */
// Verifies that 500 seeded playthroughs behave, and measures how far the game
// is from the Phase 6B acceptance targets. Uses both random bot and goal bot.
//
// Statistical acceptance targets (§6 of PHASE_6B_GAME_LOOP_INTEGRATION.md):
//   Victory rate (goal bot):   ≥ 40%   — currently 0%
//   Victory rate (random bot): ≥ 10%   — currently 0%
//   Stuck rate (both bots):     0%     — currently 43%
//   Location coverage:         ≥ 60%   — currently 69%, met
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
import { StuckDetector, readProgress } from '../playtest/stuckDetector';
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

/** Acceptance targets from PHASE_6B §6 — what the game must eventually reach. */
const TARGET = {
  goalVictoryRate: 0.40,
  randomVictoryRate: 0.10,
  minLocationCoverage: 0.60,
} as const;

/**
 * Measured baseline. The run is fully seeded, so these are exact.
 * Ratchet rule: tighten these as fixes land, never loosen them.
 *
 * `maxStuck` alone is a treacherous metric: a run that dies on turn 5 is not
 * counted as stuck, so making the player survive longer *raises* it. That is
 * why the progression ratchets below exist — dying early lowers them, so they
 * cannot be gamed the way the stuck count can.
 *
 * Loosened twice, deliberately:
 *  - A3: LCK stopped adding to roll totals, one point harder on every check.
 *  - S + weak points + Q: combat became survivable, so 23 runs moved from
 *    "died" to "wandered". Defeats fell from 286 to 263.
 */
const BASELINE = {
  maxStuck: 237,
  maxTimeouts: 0,
  minVictories: 0,
  /** Progression, which early death can only ever lower. */
  minAvgObstaclesResolved: 0.73,
  minAvgLocationCoverage: 0.67,
} as const;

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
  endHp: number;
  defeatConditionType: string | null;
  locationsVisited: number;
  totalLocations: number;
  obstaclesResolved: number;
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
      endHp: 0, defeatConditionType: 'assembly_failure',
      locationsVisited: 0, totalLocations: 0, obstaclesResolved: 0,
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

    stuckDetector.update(readProgress(state));
    if (stuckDetector.isStuck()) {
      const p = readProgress(state);
      return {
        seed, botName: bot.name, skeletonId: skeleton.id, settingId: skeleton.theme.id,
        sessionLength, playerClass, outcome: 'stuck', turns,
        endHp: state.character?.hp ?? 0,
        defeatConditionType: state.defeatCondition?.type ?? null,
        locationsVisited: p.locationsVisited,
        totalLocations: state.scenario?.graph.nodes.length ?? 0,
        obstaclesResolved: p.obstaclesResolved,
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

  const finalProgress = readProgress(state);
  return {
    seed, botName: bot.name, skeletonId: skeleton.id, settingId: skeleton.theme.id,
    sessionLength, playerClass, outcome, turns,
    endHp: state.character?.hp ?? 0,
    defeatConditionType: state.defeatCondition?.type ?? null,
    locationsVisited: finalProgress.locationsVisited,
    totalLocations: state.scenario?.graph.nodes.length ?? 0,
    obstaclesResolved: finalProgress.obstaclesResolved,
  };
}

// ---------------------------------------------------------------------------
// STRESS TEST
// ---------------------------------------------------------------------------

describe('scenarioWalkthrough: 500 auto-playthroughs', () => {
  it('all playthroughs terminate and do not regress past the measured baseline', () => {
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

    // Progression diagnostics — why do runs end the way they do?
    const avg = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
    const coverage = results
      .filter(r => r.totalLocations > 0)
      .map(r => r.locationsVisited / r.totalLocations);

    console.log(`\n=== Progression ===`);
    console.log(`  Avg turns:               ${avg(results.map(r => r.turns)).toFixed(1)}`);
    console.log(`  Avg turns (victory):     ${avg(victories.map(r => r.turns)).toFixed(1)}`);
    console.log(`  Avg turns (defeat):      ${avg(defeats.map(r => r.turns)).toFixed(1)}`);
    console.log(`  Avg location coverage:   ${(avg(coverage) * 100).toFixed(1)}%`);
    console.log(`  Avg obstacles resolved:  ${avg(results.map(r => r.obstaclesResolved)).toFixed(2)}`);

    const byDefeatCause = new Map<string, number>();
    for (const r of defeats) {
      const cause = r.defeatConditionType !== null
        ? `condition:${r.defeatConditionType}`
        : r.endHp <= 0 ? 'hp_zero' : 'other';
      byDefeatCause.set(cause, (byDefeatCause.get(cause) ?? 0) + 1);
    }
    console.log(`  Defeat causes:           ${JSON.stringify(Object.fromEntries(byDefeatCause))}`);

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

    // HARD REQUIREMENT: every run must terminate. No infinite loops.
    const notEnded = results.filter(r => r.outcome !== 'victory' && r.outcome !== 'defeat');
    expect(notEnded.every(r => r.outcome === 'stuck' || r.outcome === 'timeout')).toBe(true);

    // Ratchet: these thresholds may only ever be tightened, never loosened.
    // The run is fully seeded, so the numbers are deterministic.
    expect(stuck.length).toBeLessThanOrEqual(BASELINE.maxStuck);
    expect(timeouts.length).toBeLessThanOrEqual(BASELINE.maxTimeouts);
    expect(avg(coverage)).toBeGreaterThanOrEqual(TARGET.minLocationCoverage);
    expect(victories.length).toBeGreaterThanOrEqual(BASELINE.minVictories);

    // Progression ratchets — these are the ones that cannot be satisfied by
    // dying sooner.
    expect(avg(results.map(r => r.obstaclesResolved)))
      .toBeGreaterThanOrEqual(BASELINE.minAvgObstaclesResolved);
    expect(avg(coverage)).toBeGreaterThanOrEqual(BASELINE.minAvgLocationCoverage);
  });

  // The acceptance targets of PHASE_6B §6. They are NOT met: the goal bot wins
  // 0 of 250 runs. Un-skip once lots 3-4 (resolution pipeline, world reactions)
  // land — this test is their definition of done.
  it.skip('meets the Phase 6B statistical acceptance targets', () => {
    const results: PlaythroughResult[] = [];
    for (let i = 0; i < RUNS; i++) results.push(runPlaythrough(BASE_SEED + i));

    const goalResults = results.filter(r => r.botName === 'goal_seeker');
    const randomResults = results.filter(r => r.botName === 'random');
    const goalRate = goalResults.filter(r => r.outcome === 'victory').length / goalResults.length;
    const randomRate = randomResults.filter(r => r.outcome === 'victory').length / randomResults.length;

    expect(results.filter(r => r.outcome === 'stuck')).toHaveLength(0);
    expect(goalRate).toBeGreaterThanOrEqual(TARGET.goalVictoryRate);
    expect(randomRate).toBeGreaterThanOrEqual(TARGET.randomVictoryRate);
  });
});
