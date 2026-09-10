// ---------------------------------------------------------------------------
// tests/stress/freePlay.test.ts — the player nobody prompted
// ---------------------------------------------------------------------------
// `scenarioWalkthrough` measures two bots that are either told exactly what to
// do (the goal bot reads the scene's own three suggestions) or told nothing at
// all (the random bot draws from four verbs and fuzz). Neither is a player.
//
// A clickable list that leads to victory does not prove the game is playable:
// it proves the list is well ranked. This file measures the other thing — a
// player who invents verb/target/tool combinations from the room in front of
// them and the words the game has shown them, and never reads a suggestion.
//
// It wins nothing yet. That is the point of measuring it: the gap between 34 %
// for the prompted bot and 0 % here is the size of the problem, and the
// ratchets below are on *progress*, which is what has to move first.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
/* eslint-disable no-console */
import { initGame, isGameOver } from '../../src/engine/game';
import { getSceneContext } from '../../src/engine/scene';
import { processTurn } from '../../src/engine/processTurn';
import { assembleScenario } from '../../src/engine/pacing';
import { buildParserLocaleData } from '../../src/content/parserData';
import { ESCAPE_SKELETON } from '../../src/content/scenarios/escape';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
import { createSeededRng } from '../playtest/bots/index';
import { freePlayBot } from '../playtest/bots/freePlayBot';
import { toBotState, toBotScene } from '../playtest/botAdapters';
import { StuckDetector, readProgress } from '../playtest/stuckDetector';
import type { GameState, PlayerClassName } from '../../src/engine/types';

const RUNS = 120;
const BASE_SEED = 7000;
const MAX_TURNS = 200;
const STUCK_THRESHOLD = 15;
const CLASSES: readonly PlayerClassName[] = ['marine', 'engineer', 'medic'];

const parserData = buildParserLocaleData('fr');

interface FreeRun {
  readonly gateItemHeld: boolean;
  readonly containerOpened: boolean;
  readonly locationsVisited: number;
  readonly won: boolean;
  readonly crashed: string | null;
}

function playFreely(seed: number): FreeRun {
  const rng = createSeededRng(seed);
  const engineRng = (): number => rng.float();
  const playerClass = CLASSES[seed % CLASSES.length]!;
  const scenario = assembleScenario(ESCAPE_SKELETON, 'quick', ALL_MODULES, engineRng);
  let state: GameState = initGame(scenario, playerClass, 'survivor', 'Bot', engineRng);

  const gateItem = state.scenario!.skeleton.gateItem;
  const detector = new StuckDetector(STUCK_THRESHOLD);
  let gateItemHeld = false;
  let containerOpened = false;
  let lastNarrative = '';

  try {
    for (let turn = 0; turn < MAX_TURNS && !isGameOver(state); turn++) {
      const input = freePlayBot.makeDecision(
        toBotState(state), toBotScene(state, lastNarrative), rng,
      );
      const context = getSceneContext(state);
      const result = processTurn(state, input, context, parserData, engineRng);
      state = result.newState;
      lastNarrative = result.narrative;

      if (state.featureStates['emergency_locker']?.openness === 'open') containerOpened = true;
      if (state.character?.inventory.includes(gateItem) === true) gateItemHeld = true;

      detector.update(readProgress(state));
      if (detector.isStuck()) break;
    }
  } catch (error) {
    return {
      gateItemHeld, containerOpened, won: false,
      locationsVisited: Object.keys(state.visitedLocations).length,
      crashed: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    gateItemHeld,
    containerOpened,
    won: state.victoryResult !== null,
    locationsVisited: Object.keys(state.visitedLocations).length,
    crashed: null,
  };
}

/**
 * Measured on the seeds below. Progress ratchets, not a victory rate: the free
 * player wins 0 of 120, so a victory threshold would have nothing to hold.
 * These may only ever be tightened.
 *
 * `avgLocationsVisited` of 2.1 out of six-plus rooms is the loudest number
 * here: this player opens the locker and takes the badge four times in ten,
 * then stays put until the stuck detector cuts the run. Whether that is the
 * game giving no reason to move on, or this bot being a poor tourist, is the
 * next thing to find out — not something to assume.
 */
const BASELINE = {
  minContainerOpenedShare: 0.40,
  minGateItemShare: 0.38,
  minAvgLocationsVisited: 2.0,
} as const;

describe('freePlay: 120 games invented rather than prompted', () => {
  it('never crashes, and makes measurable progress without reading a suggestion', () => {
    const runs = Array.from({ length: RUNS }, (_, i) => playFreely(BASE_SEED + i));

    const crashes = runs.filter(r => r.crashed !== null);
    const opened = runs.filter(r => r.containerOpened);
    const held = runs.filter(r => r.gateItemHeld);
    const wins = runs.filter(r => r.won);
    const avgLocations = runs.reduce((s, r) => s + r.locationsVisited, 0) / runs.length;

    console.log('\n=== Free Play Report ===');
    console.log(`runs=${RUNS}`);
    console.log(`containerOpened=${((100 * opened.length) / RUNS).toFixed(1)}%`);
    console.log(`gateItemHeld=${((100 * held.length) / RUNS).toFixed(1)}%`);
    console.log(`victories=${((100 * wins.length) / RUNS).toFixed(1)}%`);
    console.log(`avgLocationsVisited=${avgLocations.toFixed(2)}`);

    expect(crashes.map(c => c.crashed)).toEqual([]);
    expect(opened.length / RUNS).toBeGreaterThanOrEqual(BASELINE.minContainerOpenedShare);
    expect(held.length / RUNS).toBeGreaterThanOrEqual(BASELINE.minGateItemShare);
    expect(avgLocations).toBeGreaterThanOrEqual(BASELINE.minAvgLocationsVisited);
  });

  it('is not secretly reading the suggestions', () => {
    // The whole value of this bot is that it is blind to them. If it ever picks
    // a line verbatim from the scene's list, this file stops measuring anything
    // the walkthrough test does not already cover.
    const source = freePlayBot.makeDecision.toString();
    expect(source).not.toContain('obstacleSuggestions');
    expect(source).not.toContain('scene.suggestions');
  });
});
