// Measures narrative repetition as the player experiences it: plays seeded
// games, records every produced narrative, and reports exact repeats per verb.
import { initGame, isGameOver } from '../src/engine/game';
import { getSceneContext } from '../src/engine/scene';
import { processTurn } from '../src/engine/processTurn';
import { assembleScenario } from '../src/engine/pacing';
import { buildParserLocaleData } from '../src/content/parserData';
import { LAUNCH_SKELETONS } from '../src/content/scenarios/index';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { createSeededRng } from '../src/engine/rng';
import { narrateForTurn, NARRATIVE_PRESETS } from '../src/narration/index';
import { randomBot } from '../tests/playtest/bots/randomBot';
import { goalBot } from '../tests/playtest/bots/goalBot';
import { toBotState, toBotScene } from '../tests/playtest/botAdapters';
import { createSeededRng as botRng } from '../tests/playtest/bots/index';
import type { GameState } from '../src/engine/types';

const parserData = buildParserLocaleData('fr');

interface VerbStat {
  uses: number;
  distinct: Set<string>;
  repeats: number;
}

const byVerb = new Map<string, VerbStat>();
const textCounts = new Map<string, number>();
let totalTurns = 0;
let totalRepeats = 0;

for (let i = 0; i < 60; i++) {
  const seed = 500 + i;
  const rng = botRng(seed);
  const engineRng = (): number => rng.float();
  const skeleton = rng.pick(LAUNCH_SKELETONS);
  const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, engineRng);
  const bot = i % 2 === 0 ? randomBot : goalBot;
  let state: GameState = initGame(scenario, 'marine', 'survivor', 'Kael', createSeededRng(seed));

  // Repetition is per playthrough: seeing the same sentence twice in one run is
  // what the player notices.
  const seenThisRun = new Set<string>();

  let turns = 0;
  while (!isGameOver(state) && turns < 40) {
    const input = bot.makeDecision(toBotState(state), toBotScene(state), rng);
    const context = getSceneContext(state);
    const result = processTurn(state, input, context, parserData, engineRng);
    let text = '';
    try {
      text = narrateForTurn(result, context, state, NARRATIVE_PRESETS.standard, 'fr');
    } catch { /* narration failure is not what we measure here */ }

    const verb = result.trace.parsedVerb ?? 'NONE';
    if (text.length > 0 && !result.trace.reformulated) {
      totalTurns++;
      const stat = byVerb.get(verb) ?? { uses: 0, distinct: new Set<string>(), repeats: 0 };
      stat.uses++;
      stat.distinct.add(text);
      if (seenThisRun.has(text)) { stat.repeats++; totalRepeats++; }
      seenThisRun.add(text);
      byVerb.set(verb, stat);
      textCounts.set(text, (textCounts.get(text) ?? 0) + 1);
    }
    state = result.newState;
    turns++;
  }
}

console.log(`tours narres: ${totalTurns}  repetitions exactes: ${totalRepeats} (${(100 * totalRepeats / totalTurns).toFixed(1)}%)`);
console.log('');
console.log('verbe            usages  distincts  repetitions  taux');
const rows = [...byVerb.entries()].sort((a, b) => b[1].repeats - a[1].repeats);
for (const [verb, s] of rows) {
  if (s.uses < 5) continue;
  console.log(
    `${verb.padEnd(16)}${String(s.uses).padStart(6)}${String(s.distinct.size).padStart(11)}${String(s.repeats).padStart(13)}  ${(100 * s.repeats / s.uses).toFixed(0)}%`,
  );
}

console.log('\n--- phrases les plus repetees ---');
const worst = [...textCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [text, count] of worst) {
  console.log(`${String(count).padStart(5)}  ${text.slice(0, 110)}`);
}
