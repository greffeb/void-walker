// ---------------------------------------------------------------------------
// tests/stress/botProfiles.test.ts — Explorer/Chaotic profile stress tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { initGame, isGameOver } from '../../src/engine/game';
import { getSceneContext } from '../../src/engine/scene';
import { processTurn } from '../../src/engine/processTurn';
import { assembleScenario } from '../../src/engine/pacing';
import { buildParserLocaleData } from '../../src/content/parserData';
import { LAUNCH_SKELETONS } from '../../src/content/scenarios/index';
import { LAUNCH_SETTINGS } from '../../src/content/settings';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
import { createSeededRng } from '../playtest/bots/index';
import { explorerBot } from '../playtest/bots/explorerBot';
import { chaoticBot, CHAOTIC_ABSURD_VERBS } from '../playtest/bots/chaoticBot';
import { toBotState, toBotScene } from '../playtest/botAdapters';
import { StuckDetector } from '../playtest/stuckDetector';
import type { GameState, DifficultyLevel } from '../../src/engine/types';
import type { PlaytestBot } from '../playtest/bots/index';

const RUNS = 120;
const MAX_TURNS = 220;
const STUCK_THRESHOLD = 15;
const BASE_SEED_EXPLORER = 9100;
const BASE_SEED_CHAOTIC = 12100;
const PLAYER_CLASSES = ['marine', 'engineer', 'medic'] as const;
const SESSION_LENGTHS = ['quick', 'standard'] as const;
const DIFFICULTY: DifficultyLevel = 'explorer';
const parserData = buildParserLocaleData('fr');

interface ProfileSessionResult {
  seed: number;
  outcome: 'victory' | 'defeat' | 'stuck' | 'timeout';
  turns: number;
  stuck: boolean;
  locationCoverage: number;
  visitedCount: number;
  totalNodes: number;
  availableItemCount: number;
  examinedItemCount: number;
  availableFeatureCount: number;
  examinedFeatureCount: number;
  availableNpcCount: number;
  talkedNpcCount: number;
  seenItemCount: number;
  seenFeatureCount: number;
  seenNpcCount: number;
  absurdInputCount: number;
  concreteTargetCount: number;
  failsafeActivations: number;
  parsedVerbs: readonly string[];
  traceTail: readonly string[];
}

function isAbsurdInput(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  return CHAOTIC_ABSURD_VERBS.some(verb => normalized === verb || normalized.startsWith(`${verb} `));
}

function runProfileSession(seed: number, bot: PlaytestBot): ProfileSessionResult {
  const rng = createSeededRng(seed);
  const skeleton = rng.pick(LAUNCH_SKELETONS);
  const setting = rng.pick(LAUNCH_SETTINGS);
  const sessionLength = rng.pick(SESSION_LENGTHS);
  const playerClass = rng.pick(PLAYER_CLASSES);
  const engineRng = () => rng.float();

  let state: GameState;
  try {
    const scenario = assembleScenario(skeleton, sessionLength, setting, ALL_MODULES, engineRng);
    state = initGame(scenario, playerClass, DIFFICULTY, 'Bot', engineRng);
  } catch {
    return {
      seed,
      outcome: 'defeat',
      turns: 0,
      stuck: false,
      locationCoverage: 0,
      visitedCount: 0,
      totalNodes: 1,
      availableItemCount: 0,
      examinedItemCount: 0,
      availableFeatureCount: 0,
      examinedFeatureCount: 0,
      availableNpcCount: 0,
      talkedNpcCount: 0,
      seenItemCount: 0,
      seenFeatureCount: 0,
      seenNpcCount: 0,
      absurdInputCount: 0,
      concreteTargetCount: 0,
      failsafeActivations: 0,
      parsedVerbs: [],
      traceTail: [],
    };
  }

  const totalNodes = state.scenario?.graph.nodes.length ?? 1;
  const allItemIds = new Set<string>(
    (state.scenario?.graph.nodes ?? []).flatMap(node => node.items.filter(item => !item.hidden).map(item => item.id)),
  );
  const allFeatureIds = new Set<string>(
    (state.scenario?.graph.nodes ?? []).flatMap(node => node.features.map(feature => feature.id)),
  );
  const allNpcIds = new Set<string>(
    (state.scenario?.graph.nodes ?? []).flatMap(node => (node.npcs ?? []).map(npc => npc.id)),
  );

  const examinedItems = new Set<string>();
  const examinedFeatures = new Set<string>();
  const talkedNpcs = new Set<string>();
  const seenItems = new Set<string>();
  const seenFeatures = new Set<string>();
  const seenNpcs = new Set<string>();
  const parsedVerbs = new Set<string>();

  let turns = 0;
  let absurdInputCount = 0;
  let concreteTargetCount = 0;
  let failsafeActivations = 0;
  let stuck = false;
  const traceTail: string[] = [];
  const stuckDetector = new StuckDetector(STUCK_THRESHOLD);

  while (!isGameOver(state) && turns < MAX_TURNS) {
    const botState = toBotState(state);
    const botScene = toBotScene(state);
    const input = bot.makeDecision(botState, botScene, rng);
    const locationBefore = state.playerLocationId ?? 'unknown';
    if (isAbsurdInput(input)) absurdInputCount += 1;

    for (const id of botScene.locationItemIds) seenItems.add(id);
    for (const id of botScene.environmentFeatureIds) seenFeatures.add(id);
    for (const id of botScene.npcIds) seenNpcs.add(id);

    const context = getSceneContext(state);
    const result = processTurn(state, input, context, parserData, engineRng);
    state = result.newState;
    const locationAfter = state.playerLocationId ?? 'unknown';
    turns += 1;

    traceTail.push(`T${turns} [${locationBefore}->${locationAfter}] "${input}" verb=${result.trace.parsedVerb ?? 'null'} target=${result.trace.parsedTarget ?? 'null'}`);
    if (traceTail.length > 12) traceTail.shift();

    if (result.trace.parsedVerb !== null) parsedVerbs.add(result.trace.parsedVerb);
    if (result.trace.parsedTarget !== null) concreteTargetCount += 1;
    if (result.trace.failsafeActivated) failsafeActivations += 1;

    const targetId = result.trace.parsedTarget;
    if (result.trace.parsedVerb === 'EXAMINE' && targetId !== null) {
      if (allItemIds.has(targetId)) examinedItems.add(targetId);
      if (allFeatureIds.has(targetId)) examinedFeatures.add(targetId);
    }
    if (result.trace.parsedVerb === 'TALK' && targetId !== null && allNpcIds.has(targetId)) {
      talkedNpcs.add(targetId);
    }

    // Count "stuck" only when movement exits exist; terminal dead-end rooms
    // are not actionable softlocks for this coverage profile.
    if (botScene.connectedLocationAliases.length > 0) {
      stuckDetector.update(state.playerLocationId ?? 'unknown');
    } else {
      stuckDetector.reset();
    }
    if (stuckDetector.isStuck()) {
      stuck = true;
      break;
    }
  }

  const visitedCount = Object.keys(state.visitedLocations).length;
  const locationCoverage = totalNodes > 0 ? visitedCount / totalNodes : 0;
  const outcome: ProfileSessionResult['outcome'] = stuck
    ? 'stuck'
    : turns >= MAX_TURNS
      ? 'timeout'
      : state.victoryResult !== null
        ? 'victory'
        : 'defeat';

  return {
    seed,
    outcome,
    turns,
    stuck,
    locationCoverage,
    visitedCount,
    totalNodes,
    availableItemCount: allItemIds.size,
    examinedItemCount: examinedItems.size,
    availableFeatureCount: allFeatureIds.size,
    examinedFeatureCount: examinedFeatures.size,
    availableNpcCount: allNpcIds.size,
    talkedNpcCount: talkedNpcs.size,
    seenItemCount: seenItems.size,
    seenFeatureCount: seenFeatures.size,
    seenNpcCount: seenNpcs.size,
    absurdInputCount,
    concreteTargetCount,
    failsafeActivations,
    parsedVerbs: [...parsedVerbs],
    traceTail,
  };
}

function runCampaign(baseSeed: number, bot: PlaytestBot): ProfileSessionResult[] {
  const results: ProfileSessionResult[] = [];
  for (let i = 0; i < RUNS; i++) {
    results.push(runProfileSession(baseSeed + i, bot));
  }
  return results;
}

describe('botProfiles: explorer + chaotic', () => {
  it('explorer profile meets coverage thresholds', () => {
    const results = runCampaign(BASE_SEED_EXPLORER, explorerBot);
    const stuckCount = results.filter(r => r.stuck).length;

    const meanLocationCoverage = results.reduce((acc, r) => acc + r.locationCoverage, 0) / results.length;
    const totalItems = results.reduce((acc, r) => acc + r.availableItemCount, 0);
    const totalExaminedItems = results.reduce((acc, r) => acc + r.examinedItemCount, 0);
    const totalFeatures = results.reduce((acc, r) => acc + r.availableFeatureCount, 0);
    const totalExaminedFeatures = results.reduce((acc, r) => acc + r.examinedFeatureCount, 0);
    const totalNpcs = results.reduce((acc, r) => acc + r.availableNpcCount, 0);
    const totalTalkedNpcs = results.reduce((acc, r) => acc + r.talkedNpcCount, 0);

    const weightedItemCoverage = totalItems > 0 ? totalExaminedItems / totalItems : 1;
    const weightedFeatureCoverage = totalFeatures > 0 ? totalExaminedFeatures / totalFeatures : 1;
    const weightedNpcTalkCoverage = totalNpcs > 0 ? totalTalkedNpcs / totalNpcs : 1;

    console.log('\n=== Explorer Profile Report ===');
    console.log(`runs=${RUNS} stuck=${stuckCount}`);
    console.log(`meanLocationCoverage=${(meanLocationCoverage * 100).toFixed(1)}%`);
    console.log(`weightedItemExamineCoverage=${(weightedItemCoverage * 100).toFixed(1)}%`);
    console.log(`weightedFeatureExamineCoverage=${(weightedFeatureCoverage * 100).toFixed(1)}%`);
    console.log(`weightedNpcTalkCoverage=${(weightedNpcTalkCoverage * 100).toFixed(1)}%`);
    if (stuckCount > 0) {
      for (const s of results.filter(r => r.stuck).slice(0, 3)) {
        console.log(`stuck seed=${s.seed}`);
        for (const line of s.traceTail) console.log(`  ${line}`);
      }
    }

    expect(stuckCount).toBe(0);
    expect(meanLocationCoverage).toBeGreaterThanOrEqual(0.80);
    expect(weightedItemCoverage).toBeGreaterThanOrEqual(0.75);
    expect(weightedFeatureCoverage).toBeGreaterThanOrEqual(0.75);
    expect(weightedNpcTalkCoverage).toBeGreaterThanOrEqual(0.70);
  });

  it('chaotic profile meets absurd/failsafe thresholds', () => {
    const results = runCampaign(BASE_SEED_CHAOTIC, chaoticBot);
    const stuckCount = results.filter(r => r.stuck).length;

    const totalTurns = results.reduce((acc, r) => acc + Math.max(1, r.turns), 0);
    const absurdInputShare = results.reduce((acc, r) => acc + r.absurdInputCount, 0) / totalTurns;
    const concreteTargetRate = results.reduce((acc, r) => acc + r.concreteTargetCount, 0) / totalTurns;
    const sessionsWithFailsafe = results.filter(r => r.failsafeActivations > 0).length;
    const failsafeSessionRate = sessionsWithFailsafe / results.length;
    const uniqueParsedVerbs = new Set<string>(results.flatMap(r => r.parsedVerbs)).size;

    console.log('\n=== Chaotic Profile Report ===');
    console.log(`runs=${RUNS} stuck=${stuckCount}`);
    console.log(`absurdInputShare=${(absurdInputShare * 100).toFixed(1)}%`);
    console.log(`concreteTargetRate=${(concreteTargetRate * 100).toFixed(1)}%`);
    console.log(`failsafeSessionRate=${(failsafeSessionRate * 100).toFixed(1)}%`);
    console.log(`uniqueParsedVerbs=${uniqueParsedVerbs}`);

    expect(stuckCount).toBe(0);
    expect(absurdInputShare).toBeGreaterThanOrEqual(0.65);
    expect(concreteTargetRate).toBeGreaterThanOrEqual(0.45);
    expect(failsafeSessionRate).toBeGreaterThanOrEqual(0.25);
    expect(uniqueParsedVerbs).toBeGreaterThanOrEqual(10);
  });
});
