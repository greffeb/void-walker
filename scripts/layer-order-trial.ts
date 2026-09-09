// Readability trial for decision X.
//
// Compares the two layer orders on the SAME sentences: the playthrough is
// replayed once, the narrative contexts are kept, and the composer is then run
// over them with a fixed RNG and a fresh memory. Only the ordering differs
// between the two runs — anything else would be comparing two different texts.
import { initGame, isGameOver } from '../src/engine/game';
import { getSceneContext } from '../src/engine/scene';
import { processTurn } from '../src/engine/processTurn';
import { assembleScenario } from '../src/engine/pacing';
import { buildParserLocaleData } from '../src/content/parserData';
import { LAUNCH_SKELETONS } from '../src/content/scenarios/index';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { createSeededRng } from '../src/engine/rng';
import { buildNarrativeContext, composeNarrative, resetComposer, NARRATIVE_PRESETS } from '../src/narration/index';
import { LAYER_ORDER } from '../src/narration/types';
import type { NarrativeContext } from '../src/narration/types';
import { randomBot } from '../tests/playtest/bots/randomBot';
import { goalBot } from '../tests/playtest/bots/goalBot';
import { toBotState, toBotScene } from '../tests/playtest/botAdapters';
import { createSeededRng as botRng } from '../tests/playtest/bots/index';
import type { GameState } from '../src/engine/types';

const parserData = buildParserLocaleData('fr');

interface Captured {
  readonly seed: number;
  readonly input: string;
  readonly hasNpc: boolean;
  readonly ctx: NarrativeContext;
}

const captured: Captured[] = [];

for (const seed of [11, 23, 37, 51, 68, 84, 97, 120]) {
  const rng = botRng(seed);
  const engineRng = (): number => rng.float();
  const skeleton = rng.pick(LAUNCH_SKELETONS);
  const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, engineRng);
  const bot = seed % 2 === 0 ? randomBot : goalBot;
  let state: GameState = initGame(scenario, 'marine', 'survivor', 'Kael', createSeededRng(seed));

  let turns = 0;
  while (!isGameOver(state) && turns < 14) {
    const input = bot.makeDecision(toBotState(state), toBotScene(state), rng);
    const context = getSceneContext(state);
    const result = processTurn(state, input, context, parserData, engineRng);
    if (!result.trace.reformulated && result.trace.parsedVerb !== null) {
      captured.push({
        seed,
        input,
        hasNpc: context.npcs.length > 0,
        ctx: buildNarrativeContext(result, context, state),
      });
    }
    state = result.newState;
    turns++;
  }
}

// Same contexts, same RNG, fresh memory: the ordering is the only variable.
resetComposer();
const composeRng = createSeededRng(20260909);
const lines: string[] = [`ordre: ${LAYER_ORDER.join(' > ')}`, ''];
for (const c of captured) {
  const text = composeNarrative(c.ctx, NARRATIVE_PRESETS.immersive, composeRng, 'fr');
  lines.push(`[${c.seed}${c.hasNpc ? ' PNJ' : ''}] > ${c.input}`);
  lines.push(`  ${text}`);
  lines.push('');
}
console.log(lines.join('\n'));
