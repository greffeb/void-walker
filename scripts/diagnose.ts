#!/usr/bin/env tsx
// Diagnostic script — play the game manually and inspect state

import { initGame, isGameOver } from '../src/engine/game';
import { getSceneContext, formatSuggestionAsInput } from '../src/engine/scene';
import { processTurn } from '../src/engine/processTurn';
import { buildParserLocaleData } from '../src/content/parserData';
import { assembleScenario } from '../src/engine/pacing';
import { ESCAPE_SKELETON, INVESTIGATE_SKELETON } from '../src/content/scenarios/index';
import { LAUNCH_SETTINGS } from '../src/content/settings';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';

const parserData = buildParserLocaleData('fr');
const rng = () => 0.5;
const setting = LAUNCH_SETTINGS[0]!; // derelict_ship

// --- ESCAPE scenario ---
console.log('\n========== ESCAPE SKELETON ==========');
const escScenario = assembleScenario(ESCAPE_SKELETON, 'quick', setting, ALL_MODULES, rng);
let escState = initGame(escScenario, 'marine', 'survivor', 'TestPlayer', rng);

// Inspect graph nodes
console.log('Graph nodes:');
for (const node of escScenario.graph.nodes) {
  console.log(`  ${node.id} (${node.coreNodeId ?? 'module'}) atmo=${node.atmosphere} items=[${node.items.map(i => i.id)}] features=[${node.features.map(f => f.id)}] npcs=[${(node.npcs ?? []).map(n => n.id)}]`);
}
console.log('Graph edges:');
for (const edge of escScenario.graph.edges) {
  console.log(`  ${edge.from} <-> ${edge.to} locked=${edge.locked}`);
}

// Inspect initial scene
const ctx = getSceneContext(escState);
console.log('\nInitial scene at', escState.playerLocationId);
console.log('  Atmosphere:', ctx.atmosphere);
console.log('  Items:', ctx.locationItems.map(i => `${i.id}(${i.nameKey})`));
console.log('  Features:', ctx.environmentFeatures.map(f => `${f.id}(${f.nameKey})`));
console.log('  NPCs:', ctx.npcs.map(n => n.id));
console.log('  Exits:', ctx.connectedLocations.map(l => `${l.id}(${l.aliases[0]})`));
console.log('  Suggestions:', (ctx.scenarioSuggestions ?? []).map(s => formatSuggestionAsInput(s)));
console.log('  SceneDesc obstacle:', ctx.sceneDescription?.obstacleHint);

// Try some actions
const actions = [
  'examiner terminal de statut',
  'ouvrir casier de secours',
  'prendre lampe torche',
  'aller couloir de maintenance',
  'examiner cloison blindee',
  'activer balise de secours',
  'regarder autour',
];

for (const input of actions) {
  console.log(`\n--- Action: "${input}" ---`);
  const result = processTurn(escState, input, getSceneContext(escState), parserData, rng);
  escState = result.newState;
  console.log('  Narrative:', result.narrative.substring(0, 100) || '(empty)');
  console.log('  Dice:', result.diceRoll ? `${result.diceRoll.natural}+${result.diceRoll.modifier}=${result.diceRoll.total} vs DC${result.trace.effectiveDC} => ${result.trace.outcome}` : 'none');
  console.log('  Location:', escState.playerLocationId);
  console.log('  HP:', escState.character?.hp, '/', escState.character?.maxHp);
  console.log('  O2:', escState.character?.oxygen);
  console.log('  Inventory:', escState.character?.inventory);
  console.log('  Flags:', escState.scenarioFlags);
  console.log('  Trace verb:', result.trace.parsedVerb, 'target:', result.trace.parsedTarget);
  console.log('  Scenario interaction:', result.trace.scenarioInteractionMatched ? 'YES' : 'no');
  console.log('  GameOver:', isGameOver(escState));
  const newCtx = getSceneContext(escState);
  console.log('  New suggestions:', (newCtx.scenarioSuggestions ?? []).map(s => formatSuggestionAsInput(s)));
}

// --- Check victory conditions ---
console.log('\n========== VICTORY CONDITIONS ==========');
console.log('Escape primary:', JSON.stringify(ESCAPE_SKELETON.primaryVictory));
console.log('Escape alt:', JSON.stringify(ESCAPE_SKELETON.alternativeVictory));
console.log('Investigate primary:', JSON.stringify(INVESTIGATE_SKELETON.primaryVictory));
console.log('Investigate alt:', JSON.stringify(INVESTIGATE_SKELETON.alternativeVictory));

// --- Check threat director ---
console.log('\n========== THREAT DIRECTOR STATE ==========');
console.log('Initial threat state:', JSON.stringify(escState.threatDirectorState, null, 2));
console.log('Stalker clock:', JSON.stringify(escState.stalkerClockState, null, 2));
console.log('Active combat:', escState.activeCombat);
