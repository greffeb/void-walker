#!/usr/bin/env tsx
/* eslint-disable no-console */
// ---------------------------------------------------------------------------
// tests/playtest/autoplay.ts — CLI runner for bot playthrough sessions
// ---------------------------------------------------------------------------
// Examples:
//   npm run playtest:auto -- --bot goal --trace
//   npm run playtest:auto -- --bot goal --seed 12345 --trace
//   npm run playtest:auto -- --runs 50 --bot mixed --report
// ---------------------------------------------------------------------------

import { initGame, isGameOver } from '../../src/engine/game';
import { getSceneContext } from '../../src/engine/scene';
import { processTurn } from '../../src/engine/processTurn';
import { parseAction } from '../../src/engine/parser';
import { buildParserLocaleData } from '../../src/content/parserData';
import { assembleScenario } from '../../src/engine/pacing';
import { LAUNCH_SKELETONS } from '../../src/content/scenarios/index';
import { LAUNCH_SETTINGS } from '../../src/content/settings';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
import { isReformulation } from '../../src/engine/types';
import { createSeededRng } from './bots/index';
import { goalBot } from './bots/goalBot';
import { randomBot } from './bots/randomBot';
import { explorerBot } from './bots/explorerBot';
import { chaoticBot } from './bots/chaoticBot';
import { selectBot } from './bots/registry';
import { toBotState, toBotScene } from './botAdapters';
import { StuckDetector } from './stuckDetector';
import type { BotMode } from './bots/registry';

type SessionOutcome = 'victory' | 'defeat' | 'stuck' | 'timeout';

interface CliOptions {
  runs: number;
  seed: number | null;
  bot: BotMode;
  trace: boolean;
  report: boolean;
  maxTurns: number;
  stuckThreshold: number;
}

interface SessionResult {
  seed: number;
  bot: string;
  skeletonId: string;
  settingId: string;
  sessionLength: string;
  playerClass: string;
  outcome: SessionOutcome;
  turns: number;
}

const parserData = buildParserLocaleData('fr');
const PLAYER_CLASSES = ['marine', 'engineer', 'medic'] as const;
const SESSION_LENGTHS = ['quick', 'standard'] as const;
const DIFFICULTIES = ['survivor'] as const;

function printHelp(): void {
  console.log('Bot autoplay runner');
  console.log('');
  console.log('Options:');
  console.log('  --bot <goal|random|explorer|chaotic|mixed>    Bot mode (default: mixed)');
  console.log('  --runs <n>                   Number of sessions (default: 1)');
  console.log('  --seed <n>                   Base seed (default: random)');
  console.log('  --trace                      Print turn-by-turn details');
  console.log('  --report                     Print aggregated report (auto-on for runs > 1)');
  console.log('  --max-turns <n>              Turn cap per session (default: 200)');
  console.log('  --stuck-threshold <n>        Consecutive same-location turns = stuck (default: 15)');
  console.log('  --help                       Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  npm run playtest:auto -- --bot goal --trace');
  console.log('  npm run playtest:auto -- --bot goal --seed 12345 --trace');
  console.log('  npm run playtest:auto -- --bot explorer --runs 20 --report');
  console.log('  npm run playtest:auto -- --bot chaotic --runs 20 --report');
  console.log('  npm run playtest:auto -- --runs 100 --bot mixed --report');
}

function parseArgs(argv: readonly string[]): CliOptions {
  const args = [...argv];

  const readValue = (flag: string): string | null => {
    const idx = args.indexOf(flag);
    if (idx < 0) return null;
    const next = args[idx + 1];
    return next && !next.startsWith('--') ? next : null;
  };

  if (args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  const botRaw = (readValue('--bot') ?? 'mixed').toLowerCase();
  const bot: BotMode = botRaw === 'goal'
    || botRaw === 'random'
    || botRaw === 'explorer'
    || botRaw === 'chaotic'
    || botRaw === 'mixed'
    ? botRaw
    : 'mixed';

  const runs = Math.max(1, Number.parseInt(readValue('--runs') ?? '1', 10) || 1);
  const seedValue = readValue('--seed');
  const seed = seedValue === null ? null : (Number.parseInt(seedValue, 10) || 0);
  const maxTurns = Math.max(1, Number.parseInt(readValue('--max-turns') ?? '200', 10) || 200);
  const stuckThreshold = Math.max(2, Number.parseInt(readValue('--stuck-threshold') ?? '15', 10) || 15);

  return {
    runs,
    seed,
    bot,
    trace: args.includes('--trace'),
    report: args.includes('--report') || runs > 1,
    maxTurns,
    stuckThreshold,
  };
}

function runSession(seed: number, options: CliOptions, forceTrace: boolean): SessionResult {
  const rng = createSeededRng(seed);
  const skeleton = rng.pick(LAUNCH_SKELETONS);
  const setting = rng.pick(LAUNCH_SETTINGS);
  const sessionLength = rng.pick(SESSION_LENGTHS);
  const playerClass = rng.pick(PLAYER_CLASSES);
  const difficulty = rng.pick(DIFFICULTIES);
  const bot = selectBot(options.bot, rng);
  const engineRng = () => rng.float();

  const scenario = assembleScenario(skeleton, sessionLength, setting, ALL_MODULES, engineRng);
  let state = initGame(scenario, playerClass, difficulty, 'Bot', engineRng);
  const stuckDetector = new StuckDetector(options.stuckThreshold);
  let turns = 0;

  if (forceTrace) {
    console.log(`\n=== Session seed=${seed} bot=${bot.name} skeleton=${skeleton.id} setting=${setting.id} class=${playerClass} length=${sessionLength} ===`);
  }

  while (!isGameOver(state) && turns < options.maxTurns) {
    const botState = toBotState(state);
    const botScene = toBotScene(state);
    const input = bot.makeDecision(botState, botScene, rng);
    const locationBefore = state.playerLocationId ?? 'unknown';
    const hpBefore = `${state.character?.hp ?? 0}/${state.character?.maxHp ?? 0}`;
    const o2Before = state.character?.oxygen ?? 0;

    const context = getSceneContext(state);
    const parsed = parseAction(input, context, parserData);
    const result = processTurn(state, input, context, parserData, engineRng);
    state = result.newState;

    const locationAfter = state.playerLocationId ?? 'unknown';

    if (forceTrace) {
      const moved = locationAfter !== locationBefore ? ' MOVED' : '';
      if (isReformulation(parsed)) {
        console.log(`T${turns} [${locationBefore}->${locationAfter}] HP ${hpBefore} O2 ${o2Before} "${input}"${moved}`);
        console.log(`  parse=reformulation prompt="${parsed.prompt}"`);
      } else {
        console.log(`T${turns} [${locationBefore}->${locationAfter}] HP ${hpBefore} O2 ${o2Before} "${input}"${moved}`);
        console.log(`  parse verb=${parsed.verb} target=${parsed.target?.id ?? 'null'} source=${parsed.target?.source ?? 'null'}`);
      }
      console.log(`  items=${JSON.stringify(botScene.locationItemIds)} exits=${JSON.stringify(botScene.connectedLocationAliases)}`);
    }

    stuckDetector.update(locationAfter);
    if (stuckDetector.isStuck()) {
      if (forceTrace) {
        console.log(`OUTCOME: stuck after ${turns} turns`);
      }
      return {
        seed,
        bot: bot.name,
        skeletonId: skeleton.id,
        settingId: setting.id,
        sessionLength,
        playerClass,
        outcome: 'stuck',
        turns,
      };
    }

    turns++;
  }

  const outcome: SessionOutcome = turns >= options.maxTurns
    ? 'timeout'
    : (state.victoryResult ? 'victory' : 'defeat');

  if (forceTrace) {
    console.log(`OUTCOME: ${outcome} in ${turns} turns`);
  }

  return {
    seed,
    bot: bot.name,
    skeletonId: skeleton.id,
    settingId: setting.id,
    sessionLength,
    playerClass,
    outcome,
    turns,
  };
}

function printSummary(results: readonly SessionResult[], baseSeed: number): void {
  const byOutcome = (o: SessionOutcome) => results.filter(r => r.outcome === o).length;
  const victories = byOutcome('victory');
  const defeats = byOutcome('defeat');
  const stuck = byOutcome('stuck');
  const timeouts = byOutcome('timeout');
  const total = results.length;

  const goalResults = results.filter(r => r.bot === goalBot.name);
  const randomResults = results.filter(r => r.bot === randomBot.name);
  const explorerResults = results.filter(r => r.bot === explorerBot.name);
  const chaoticResults = results.filter(r => r.bot === chaoticBot.name);
  const pct = (n: number, d: number): string => d > 0 ? `${(n / d * 100).toFixed(1)}%` : '0.0%';

  const endSeed = baseSeed + Math.max(0, total - 1);
  console.log(`\n=== Autoplay Report (${total} sessions) ===`);
  console.log(`Seed window: ${baseSeed}..${endSeed}`);
  console.log(`Victory: ${victories} (${pct(victories, total)})`);
  console.log(`Defeat:  ${defeats} (${pct(defeats, total)})`);
  console.log(`Timeout: ${timeouts} (${pct(timeouts, total)})`);
  console.log(`Stuck:   ${stuck} (${pct(stuck, total)})`);

  if (goalResults.length > 0) {
    const goalVictories = goalResults.filter(r => r.outcome === 'victory').length;
    const goalStuck = goalResults.filter(r => r.outcome === 'stuck').length;
    console.log(`Goal bot:   victory ${pct(goalVictories, goalResults.length)}  stuck ${goalStuck}/${goalResults.length}`);
  }
  if (randomResults.length > 0) {
    const randomVictories = randomResults.filter(r => r.outcome === 'victory').length;
    const randomStuck = randomResults.filter(r => r.outcome === 'stuck').length;
    console.log(`Random bot: victory ${pct(randomVictories, randomResults.length)}  stuck ${randomStuck}/${randomResults.length}`);
  }
  if (explorerResults.length > 0) {
    const explorerVictories = explorerResults.filter(r => r.outcome === 'victory').length;
    const explorerStuck = explorerResults.filter(r => r.outcome === 'stuck').length;
    console.log(`Explorer bot: victory ${pct(explorerVictories, explorerResults.length)}  stuck ${explorerStuck}/${explorerResults.length}`);
  }
  if (chaoticResults.length > 0) {
    const chaoticVictories = chaoticResults.filter(r => r.outcome === 'victory').length;
    const chaoticStuck = chaoticResults.filter(r => r.outcome === 'stuck').length;
    console.log(`Chaotic bot: victory ${pct(chaoticVictories, chaoticResults.length)}  stuck ${chaoticStuck}/${chaoticResults.length}`);
  }
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const baseSeed = options.seed ?? Math.floor(Date.now() % 1_000_000);
  const results: SessionResult[] = [];

  for (let i = 0; i < options.runs; i++) {
    const seed = baseSeed + i;
    const traceThisRun = options.trace && i === 0;
    results.push(runSession(seed, options, traceThisRun));
  }

  if (options.report || options.runs > 1) {
    printSummary(results, baseSeed);
  } else {
    const r = results[0]!;
    console.log(`seed=${r.seed} (base=${baseSeed}) bot=${r.bot} outcome=${r.outcome} turns=${r.turns} skeleton=${r.skeletonId} setting=${r.settingId} class=${r.playerClass}`);
  }
}

main();
