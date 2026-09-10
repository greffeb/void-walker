// Where does a run stop? Plays seeded games and sorts each one into exactly one
// bucket along the gate-item chain, because an aggregate victory rate cannot say
// which fix moved what — and P1 changes the game and the harness together.
import { initGame, isGameOver } from '../src/engine/game';
import { getSceneContext } from '../src/engine/scene';
import { processTurn } from '../src/engine/processTurn';
import { assembleScenario } from '../src/engine/pacing';
import { buildParserLocaleData } from '../src/content/parserData';
import { LAUNCH_SKELETONS } from '../src/content/scenarios/index';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { isEnrichedFeature } from '../src/engine/scenario';
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

const RUNS = Number(process.argv.find(a => a.startsWith('--runs='))?.slice(7) ?? 200);
const TRACE = process.argv.find(a => a.startsWith('--trace='))?.slice(8);
/** Print the trace of the first N runs that got as far as this node. */
const TRACE_REACHING = process.argv.find(a => a.startsWith('--reaching='))?.slice(11);
let tracesPrinted = 0;
const BASE_SEED = 42;
const MAX_TURNS = 200;

/**
 * The buckets, in the order a run is tested against them. Every run lands in
 * exactly one, so the columns sum to the run count and a fix that moves one
 * bucket can be told apart from a fix that moves another.
 */
type Bucket =
  | 'victoire'
  | 'objet_puis_bloque'
  | 'arrive_sans_objet'
  | 'contenant_ouvert_objet_non_pris'
  | 'contenant_jamais_ouvert'
  | 'pas_de_contenant';

const BUCKET_LABELS: Record<Bucket, string> = {
  victoire: 'victoire',
  objet_puis_bloque: 'objet en main, jamais arrive au lieu de victoire',
  arrive_sans_objet: 'arrive au lieu de victoire sans l objet',
  contenant_ouvert_objet_non_pris: 'contenant ouvert, objet jamais pris',
  contenant_jamais_ouvert: 'contenant jamais ouvert',
  pas_de_contenant: 'aucun contenant ne detient l objet',
};

interface RunReport {
  readonly bucket: Bucket;
  readonly skeletonId: string;
  readonly botName: string;
  readonly outcome: 'victory' | 'defeat' | 'stuck' | 'timeout';
  readonly turns: number;
  readonly furthestNode: string;
  readonly hpLostToFailedActions: number;
  readonly hpLostToCombat: number;
  readonly hpLostToStalker: number;
  readonly hpLostToOxygen: number;
  readonly hpLostToConditions: number;
  readonly failedActions: number;
}

/** The spine, in story order: how far a run got is its deepest node on it. */
const SPINE = ['start', 'unlock', 'reveal', 'escalation', 'boss', 'resolution'] as const;

const reports: RunReport[] = [];

for (let i = 0; i < RUNS; i++) {
  const rng = createSeededRng(BASE_SEED + i);
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

  const gateItem = state.scenario!.skeleton.gateItem;
  const victory = state.scenario!.skeleton.primaryVictory;
  const victoryNodeId = state.scenario!.graph.nodes.find(
    n => n.coreNodeId === victory.locationId,
  )?.id ?? victory.locationId;

  // The container holding the gate item, found by what the content declares.
  const gateContainerIds = new Set<string>();
  for (const node of state.scenario!.graph.nodes) {
    for (const feature of node.features) {
      if (isEnrichedFeature(feature) && (feature.contains ?? []).includes(gateItem)) {
        gateContainerIds.add(feature.id);
      }
    }
  }

  const detector = new StuckDetector(15);
  let reachedVictoryNode = false;
  let heldGateItem = false;
  let containerOpened = gateContainerIds.size === 0;
  let hpLostToFailedActions = 0;
  let hpLostToCombat = 0;
  let hpLostToStalker = 0;
  let hpLostToOxygen = 0;
  let hpLostToConditions = 0;
  let failedActions = 0;
  let outcome: RunReport['outcome'] = 'timeout';
  let turns = 0;
  let furthestIndex = 0;
  const buffered: string[] = [];

  while (turns < MAX_TURNS) {
    if (isGameOver(state)) break;
    const hpBefore = state.character?.hp ?? 0;
    const input = bot.makeDecision(toBotState(state), toBotScene(state), rng);
    const context = getSceneContext(state);
    const offered = (context.scenarioSuggestions ?? [])
      .map(c => `${c.verbText} ${c.targetText}`.trim());
    if (TRACE !== undefined && String(BASE_SEED + i) === TRACE) {
      console.log(`[${state.playerLocationId}] ${bot.name} joue "${input}"`);
      console.log(`    propose: ${offered.join(' | ')}`);
    }
    const result = processTurn(state, input, context, parserData, engineRng);
    state = result.newState;
    const { trace } = result;
    const line = `[${state.playerLocationId}] "${input}"`
      + ` -> ${trace.parsedVerb ?? '?'}/${trace.parsedTarget ?? '-'} ${trace.outcome ?? '-'}`
      + ` DC${trace.effectiveDC} hp=${state.character?.hp ?? 0}`
      + `  [offert: ${offered.join(' | ')}]`;
    if (TRACE_REACHING !== undefined) buffered.push(line);
    if (TRACE !== undefined && String(BASE_SEED + i) === TRACE) {
      console.log(`    -> ${trace.parsedVerb ?? '?'}/${trace.parsedTarget ?? '-'}`
        + ` ${trace.outcome ?? '-'} DC${trace.effectiveDC} -> [${state.playerLocationId}]`);
    }

    const lost = Math.max(0, hpBefore - (state.character?.hp ?? 0));
    const stalkerBite = trace.stalkerEventType === 'threat_arrival' ? 2
      : trace.stalkerEventType === 'kill' ? 5
      : 0;
    hpLostToOxygen += trace.oxygenHpDrain;
    hpLostToConditions += trace.conditionHpDrain;
    hpLostToCombat += trace.npcAttackDamage;
    hpLostToStalker += stalkerBite;
    // Whatever the tick, the NPC and the stalker did not take is what the
    // attempt itself cost.
    hpLostToFailedActions += Math.max(
      0,
      lost - trace.oxygenHpDrain - trace.conditionHpDrain - trace.npcAttackDamage - stalkerBite,
    );
    if (trace.outcome === 'failure' || trace.outcome === 'crit_failure') failedActions++;

    for (const containerId of gateContainerIds) {
      if (state.featureStates[containerId]?.openness === 'open') containerOpened = true;
    }
    if (state.character?.inventory.includes(gateItem) === true) heldGateItem = true;
    if (state.playerLocationId === victoryNodeId) reachedVictoryNode = true;
    const coreId = state.scenario!.graph.nodes.find(n => n.id === state.playerLocationId)?.coreNodeId;
    const spineIndex = coreId ? SPINE.indexOf(coreId) : -1;
    if (spineIndex > furthestIndex) furthestIndex = spineIndex;

    turns++;
    detector.update(readProgress(state));
    if (detector.isStuck()) { outcome = 'stuck'; break; }
  }

  if (state.phase === 'victory') outcome = 'victory';
  else if (isGameOver(state)) outcome = 'defeat';
  else if (outcome !== 'stuck') outcome = 'timeout';

  const bucket: Bucket =
    outcome === 'victory' ? 'victoire'
    : heldGateItem ? 'objet_puis_bloque'
    : reachedVictoryNode ? 'arrive_sans_objet'
    : gateContainerIds.size === 0 ? 'pas_de_contenant'
    : containerOpened ? 'contenant_ouvert_objet_non_pris'
    : 'contenant_jamais_ouvert';

  if (TRACE_REACHING !== undefined && SPINE[furthestIndex] === TRACE_REACHING && tracesPrinted < 2) {
    tracesPrinted++;
    console.log(`===== graine ${BASE_SEED + i} (${bot.name}, ${sessionLength}, ${playerClass}) =====`);
    console.log(buffered.slice(-25).join('\n'));
  }

  reports.push({
    bucket,
    skeletonId: skeleton.id,
    botName: bot.name,
    outcome,
    turns,
    furthestNode: SPINE[furthestIndex]!,
    hpLostToFailedActions,
    hpLostToCombat,
    hpLostToStalker,
    hpLostToOxygen,
    hpLostToConditions,
    failedActions,
  });
}

// ---------------------------------------------------------------------------
// REPORT
// ---------------------------------------------------------------------------

const total = reports.length;
const pct = (n: number): string => `${((100 * n) / total).toFixed(1)}%`;
const avg = (pick: (r: RunReport) => number): string =>
  (reports.reduce((s, r) => s + pick(r), 0) / total).toFixed(2);

console.log(`parties: ${total}`);
console.log('');
console.log('--- entonnoir (chaque partie compte pour un seul seau) ---');
const ORDER: Bucket[] = [
  'contenant_jamais_ouvert',
  'contenant_ouvert_objet_non_pris',
  'objet_puis_bloque',
  'arrive_sans_objet',
  'pas_de_contenant',
  'victoire',
];
for (const bucket of ORDER) {
  const n = reports.filter(r => r.bucket === bucket).length;
  console.log(`  ${BUCKET_LABELS[bucket].padEnd(48)} ${String(n).padStart(4)} (${pct(n)})`);
}

console.log('');
console.log('--- entonnoir par bot ---');
for (const botName of ['random', 'goal_seeker']) {
  const botRuns = reports.filter(r => r.botName === botName);
  if (botRuns.length === 0) continue;
  const wins = botRuns.filter(r => r.bucket === 'victoire').length;
  const opened = botRuns.filter(r => r.bucket !== 'contenant_jamais_ouvert').length;
  console.log(`  ${botName.padEnd(12)} parties ${String(botRuns.length).padStart(4)}`
    + `  contenant ouvert ${((100 * opened) / botRuns.length).toFixed(1)}%`
    + `  victoires ${((100 * wins) / botRuns.length).toFixed(1)}%`);
}

console.log('');
console.log('--- issues ---');
for (const o of ['victory', 'defeat', 'stuck', 'timeout'] as const) {
  const n = reports.filter(r => r.outcome === o).length;
  console.log(`  ${o.padEnd(10)} ${String(n).padStart(4)} (${pct(n)})`);
}

console.log('');
console.log('--- PV perdus par partie, par source ---');
console.log(`  tentatives ratees   ${avg(r => r.hpLostToFailedActions)}`);
console.log(`  combat              ${avg(r => r.hpLostToCombat)}`);
console.log(`  rodeur              ${avg(r => r.hpLostToStalker)}`);
console.log(`  oxygene             ${avg(r => r.hpLostToOxygen)}`);
console.log(`  conditions          ${avg(r => r.hpLostToConditions)}`);
console.log(`  actions ratees      ${avg(r => r.failedActions)} par partie`);

console.log('');
console.log('--- noeud le plus avance atteint ---');
for (const botName of ['random', 'goal_seeker']) {
  const botRuns = reports.filter(r => r.botName === botName);
  if (botRuns.length === 0) continue;
  console.log(`  ${botName} (${botRuns.length} parties)`);
  for (const nodeId of SPINE) {
    const stops = botRuns.filter(r => r.furthestNode === nodeId).length;
    const reached = botRuns.filter(
      r => SPINE.indexOf(r.furthestNode as typeof SPINE[number]) >= SPINE.indexOf(nodeId),
    ).length;
    console.log(`    ${nodeId.padEnd(12)} s arrete ici ${String(stops).padStart(4)}`
      + ` (mort ${String(botRuns.filter(r => r.furthestNode === nodeId && r.outcome === 'defeat').length).padStart(3)}`
      + ` / bloque ${String(botRuns.filter(r => r.furthestNode === nodeId && r.outcome === 'stuck').length).padStart(3)})`
      + `   l a atteint ${String(reached).padStart(4)}`
      + ` (${((100 * reached) / botRuns.length).toFixed(1)}%)`);
  }
}

console.log('');
console.log('--- par squelette ---');
for (const skeletonId of new Set(reports.map(r => r.skeletonId))) {
  const runs = reports.filter(r => r.skeletonId === skeletonId);
  const wins = runs.filter(r => r.bucket === 'victoire').length;
  console.log(`  ${skeletonId.padEnd(14)} ${String(runs.length).padStart(4)} parties`
    + `  victoires ${((100 * wins) / runs.length).toFixed(1)}%`);
}
