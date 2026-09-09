// Why does nobody win? Plays seeded games and reports, per run, how far the
// player got against the victory condition.
import { initGame, isGameOver } from '../src/engine/game';
import { getSceneContext } from '../src/engine/scene';
import { processTurn } from '../src/engine/processTurn';
import { assembleScenario } from '../src/engine/pacing';
import { buildParserLocaleData } from '../src/content/parserData';
import { LAUNCH_SKELETONS } from '../src/content/scenarios/index';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { randomBot } from '../tests/playtest/bots/randomBot';
import { goalBot } from '../tests/playtest/bots/goalBot';
import { toBotState, toBotScene } from '../tests/playtest/botAdapters';
import { StuckDetector, readProgress } from '../tests/playtest/stuckDetector';
import { createSeededRng } from '../tests/playtest/bots/index';
import type { GameState, DifficultyLevel, PlayerClassName, SessionLength } from '../src/engine/types';

const parserData = buildParserLocaleData('fr');
const SESSION_LENGTHS: SessionLength[] = ['quick', 'standard'];
const PLAYER_CLASSES: PlayerClassName[] = ['marine', 'engineer', 'medic'];
const DIFFICULTIES: DifficultyLevel[] = ['survivor'];

let reachedVictoryNode = 0;
let hadRequiredItem = 0;
let both = 0;
let runs = 0;
const missingItemBy = new Map<string, number>();
const victoryTypes = new Map<string, number>();
let lockerRuns = 0;
let lockerOpenedRuns = 0;
let keycardRevealedRuns = 0;
let keycardInSceneRuns = 0;

for (let i = 0; i < 200; i++) {
  const rng = createSeededRng(42 + i);
  const skeleton = rng.pick(LAUNCH_SKELETONS);
  const sessionLength = rng.pick(SESSION_LENGTHS);
  const playerClass = rng.pick(PLAYER_CLASSES);
  const difficulty = rng.pick(DIFFICULTIES);
  const bot = rng.float() < 0.5 ? randomBot : goalBot;
  const engineRng = (): number => rng.float();

  let state: GameState;
  try {
    const scenario = assembleScenario(skeleton, sessionLength, ALL_MODULES, engineRng);
    state = initGame(scenario, playerClass, difficulty, 'Bot', engineRng);
  } catch { continue; }
  runs++;

  const victory = state.scenario!.skeleton.primaryVictory;
  victoryTypes.set(victory.type, (victoryTypes.get(victory.type) ?? 0) + 1);
  const victoryNodeId = state.scenario!.graph.nodes.find(
    n => n.coreNodeId === victory.locationId,
  )?.id ?? victory.locationId;

  const detector = new StuckDetector(15);
  let sawVictoryNode = false;
  let sawItem = false;
  let sawBoth = false;
  let lockerPresent = false;
  let lockerOpened = false;
  let keycardRevealed = false;
  let keycardSeenInScene = false;
  let turns = 0;
  for (const node of state.scenario!.graph.nodes) {
    if (node.features.some(f => f.id === 'emergency_locker')) lockerPresent = true;
  }
  while (!isGameOver(state) && turns < 200) {
    const input = bot.makeDecision(toBotState(state), toBotScene(state), rng);
    const context = getSceneContext(state);
    if (context.locationItems.some(i => i.id === 'access_keycard')) keycardSeenInScene = true;
    state = processTurn(state, input, context, parserData, engineRng).newState;
    if (state.featureStates['emergency_locker']?.openness === 'open') lockerOpened = true;
    if (state.revealedItems['access_keycard'] === true) keycardRevealed = true;

    const atNode = state.playerLocationId === victoryNodeId;
    const hasItem = victory.requiredItem === undefined
      || (state.character?.inventory.includes(victory.requiredItem) ?? false);
    if (atNode) sawVictoryNode = true;
    if (hasItem) sawItem = true;
    if (atNode && hasItem) sawBoth = true;

    detector.update(readProgress(state));
    if (detector.isStuck()) break;
    turns++;
  }
  if (lockerPresent) lockerRuns++;
  if (lockerOpened) lockerOpenedRuns++;
  if (keycardRevealed) keycardRevealedRuns++;
  if (keycardSeenInScene) keycardInSceneRuns++;
  if (sawVictoryNode) reachedVictoryNode++;
  if (sawItem) hadRequiredItem++;
  if (sawBoth) both++;
  if (sawVictoryNode && !sawItem && victory.requiredItem !== undefined) {
    missingItemBy.set(victory.requiredItem, (missingItemBy.get(victory.requiredItem) ?? 0) + 1);
  }
}

console.log(`parties: ${runs}`);
console.log(`types de victoire: ${JSON.stringify(Object.fromEntries(victoryTypes))}`);
console.log(`atteint le lieu de victoire : ${reachedVictoryNode} (${(100 * reachedVictoryNode / runs).toFixed(0)}%)`);
console.log(`a possede l'objet requis     : ${hadRequiredItem} (${(100 * hadRequiredItem / runs).toFixed(0)}%)`);
console.log(`les deux en meme temps       : ${both} (${(100 * both / runs).toFixed(0)}%)`);
console.log(`arrive sans l'objet, par objet: ${JSON.stringify(Object.fromEntries(missingItemBy))}`);
console.log('--- chemin du badge ---');
console.log(`casier present dans le graphe : ${lockerRuns}`);
console.log(`casier ouvert                 : ${lockerOpenedRuns}`);
console.log(`badge revele                  : ${keycardRevealedRuns}`);
console.log(`badge visible dans la scene   : ${keycardInSceneRuns}`);
