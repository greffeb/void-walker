#!/usr/bin/env tsx
// Diagnostic: Test USE <item> ON <target> and feature interactions

import { initGame } from '../src/engine/game';
import { getSceneContext } from '../src/engine/scene';
import { processTurn } from '../src/engine/processTurn';
import { parseAction } from '../src/engine/parser';
import { buildParserLocaleData } from '../src/content/parserData';
import { assembleScenario } from '../src/engine/pacing';
import { ESCAPE_SKELETON, INVESTIGATE_SKELETON } from '../src/content/scenarios/index';
import { LAUNCH_SETTINGS } from '../src/content/settings';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { isReformulation } from '../src/engine/types';
import type { GameState } from '../src/engine/types';

const parserData = buildParserLocaleData('fr');
const rng = () => 0.5;
const setting = LAUNCH_SETTINGS[0]!;

// ===== ESCAPE: Try to complete the game step by step =====
console.log('\n===== TRYING TO WIN ESCAPE SCENARIO =====');
const escScenario = assembleScenario(ESCAPE_SKELETON, 'quick', setting, ALL_MODULES, rng);
let state: GameState = initGame(escScenario, 'marine', 'survivor', 'TestPlayer', rng);

function doAction(s: GameState, input: string): GameState {
  const ctx = getSceneContext(s);
  const parsed = parseAction(input, ctx, parserData);
  const result = processTurn(s, input, ctx, parserData, rng);
  const p = isReformulation(parsed)
    ? `REFORMULATION: "${parsed.prompt}"`
    : `verb=${parsed.verb} target=${parsed.target?.id ?? 'null'} tool=${parsed.tool?.id ?? 'null'}`;
  console.log(`  "${input}" → ${p}`);
  console.log(`    loc=${result.newState.playerLocationId} HP=${result.newState.character?.hp}/${result.newState.character?.maxHp} O2=${result.newState.character?.oxygen}`);
  console.log(`    narrative="${result.narrative.substring(0, 80) || '(empty)'}"`);
  console.log(`    flags=${JSON.stringify(result.newState.scenarioFlags)}`);
  console.log(`    featureStates=${JSON.stringify(result.newState.featureStates)}`);
  console.log(`    gameOver=${result.newState.phase}`);
  return result.newState;
}

// Step 1: Open the emergency locker to reveal keycard
state = doAction(state, 'ouvrir casier');
// Step 2: Check feature states
console.log('  ★ emergency_locker feature state:', state.featureStates['emergency_locker']);
// Step 3: Take revealed items
console.log('  ★ Available items now:');
const ctx2 = getSceneContext(state);
console.log('    items:', ctx2.locationItems.map(i => i.id));
state = doAction(state, 'prendre badge');
state = doAction(state, 'prendre bonbonne oxygene');
console.log('  ★ Inventory:', state.character?.inventory);

// Step 4: Navigate to resolution with keycard
state = doAction(state, 'aller centre de gestion');  // unlock
state = doAction(state, 'aller cabines de couchage'); // reveal
state = doAction(state, 'aller zone de carburant');   // escalation (if exit exists)
state = doAction(state, 'aller centre de gestion');   // boss
state = doAction(state, 'aller jonction pressurisée'); // resolution
console.log('  ★ At resolution with inventory:', state.character?.inventory);
console.log('  ★ Phase:', state.phase, 'VictoryResult:', state.victoryResult);

// ===== INVESTIGATE: Try to complete primary victory =====
console.log('\n===== TRYING TO WIN INVESTIGATE SCENARIO =====');
const invScenario = assembleScenario(INVESTIGATE_SKELETON, 'quick', setting, ALL_MODULES, rng);
let invState: GameState = initGame(invScenario, 'engineer', 'survivor', 'TestPlayer', rng);

// Take items from start
invState = doAction(invState, 'prendre scanner');
invState = doAction(invState, 'prendre outils');
invState = doAction(invState, 'prendre data core');

// Navigate to reveal to get incriminating_files
invState = doAction(invState, 'aller salle de coordination');
invState = doAction(invState, 'aller cabines de couchage');
invState = doAction(invState, 'prendre dossiers');

// Navigate to escalation
invState = doAction(invState, 'aller zone de carburant');
// Try to disable AI
invState = doAction(invState, 'pirater noeud ia');

// Navigate to boss
invState = doAction(invState, 'aller centre de gestion');
// Try to activate beacon
invState = doAction(invState, 'activer balise');
// If beacon is locked, try hacking
invState = doAction(invState, 'pirater balise');
// Try activating again
invState = doAction(invState, 'activer balise');

console.log('  ★ Final state:', invState.phase, 'Victory:', invState.victoryResult);
console.log('  ★ Flags:', invState.scenarioFlags);
console.log('  ★ Features:', invState.featureStates);
