#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// scripts/ai-playtest.ts — AI-driven turn-by-turn playtest tool
// ---------------------------------------------------------------------------
// Usage:
//   npx tsx scripts/ai-playtest.ts --init [--skeleton escape|investigate|rescue] [--seed N] [--class marine|engineer|medic] [--setting derelict_ship|space_station|alien_ruins]
//   npx tsx scripts/ai-playtest.ts --cmd "examiner environnement"
//   npx tsx scripts/ai-playtest.ts --cmd "aller soute principale"
//   npx tsx scripts/ai-playtest.ts --batch commands.txt
//
// State is persisted to scripts/.ai-playtest-state.json between calls.
// ---------------------------------------------------------------------------

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { initGame, isGameOver } from '../src/engine/game';
import { getSceneContext } from '../src/engine/scene';
import { processTurn } from '../src/engine/processTurn';
import { buildParserLocaleData } from '../src/content/parserData';
import { assembleScenario } from '../src/engine/pacing';
import { LAUNCH_SKELETONS } from '../src/content/scenarios/index';
import { LAUNCH_SETTINGS } from '../src/content/settings';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { narrateForTurn } from '../src/narration/index';
import { t } from '../src/i18n/index';
import type { StringKey } from '../src/i18n/types';
import type { GameState, SceneContext } from '../src/engine/types';
import type { AssembledScenario, SessionLength, CoreSkeleton } from '../src/engine/scenario';
import type { SettingDefinition } from '../src/content/settings';
import type { PlayerClassName, DifficultyLevel } from '../src/engine/types';

const STATE_FILE = path.join(__dirname, '.ai-playtest-state.json');
const parserData = buildParserLocaleData('fr');

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32)
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// State persistence
// ---------------------------------------------------------------------------
function saveState(state: GameState, scenario: AssembledScenario, seed: number): void {
  // GameState includes scenario, so just save the state + seed
  const data = JSON.stringify({ state, seed }, null, 2);
  fs.writeFileSync(STATE_FILE, data, 'utf-8');
}

function loadState(): { state: GameState; seed: number } | null {
  if (!fs.existsSync(STATE_FILE)) return null;
  const raw = fs.readFileSync(STATE_FILE, 'utf-8');
  const parsed = JSON.parse(raw) as { state: GameState; seed: number };
  return parsed;
}

// ---------------------------------------------------------------------------
// Scene display — shows what a player would see
// ---------------------------------------------------------------------------
function displayScene(state: GameState, context: SceneContext): void {
  const char = state.character!;
  console.log('\n' + '═'.repeat(60));
  console.log(`  Tour ${state.turn} | HP: ${char.hp}/${char.maxHp} | O₂: ${char.oxygen}% | Beat: ${state.currentBeat}`);
  if (state.activeCombat) {
    const npc = state.activeCombat.npc;
    console.log(`  ⚔️  COMBAT: ${npc.definitionId} HP:${npc.hp}/${npc.maxHp} Round:${state.activeCombat.round}`);
  }
  if (char.conditions.length > 0) {
    console.log(`  Conditions: ${char.conditions.map(c => c.id).join(', ')}`);
  }
  console.log(`  Inventaire: ${char.inventory.length > 0 ? char.inventory.map(id => {
    const name = t(`item.${id}` as StringKey);
    return name !== `item.${id}` ? name : id;
  }).join(', ') : '(vide)'}`);
  console.log('═'.repeat(60));

  // Scene description
  if (context.sceneDescription) {
    const sd = context.sceneDescription;
    console.log(`\n📍 ${sd.locationDescription}`);
    if (sd.obstacleHint) {
      console.log(`\n⚠️  Obstacle: ${sd.obstacleHint}`);
    }
    if (sd.visibleItems.length > 0) {
      console.log(`\n📦 Objets: ${sd.visibleItems.map(i => i.name).join(', ')}`);
    }
    if (sd.visibleFeatures.length > 0) {
      console.log(`🔧 Éléments: ${sd.visibleFeatures.map(f => f.name).join(', ')}`);
    }
    if (sd.visibleNpcs.length > 0) {
      console.log(`👤 PNJ: ${sd.visibleNpcs.map(n => n.name).join(', ')}`);
    }
    if (sd.exits.length > 0) {
      const exitStr = sd.exits.map(e => `${e.name}${e.visited ? '' : ' (inexploré)'}`).join(', ');
      console.log(`🚪 Sorties: ${exitStr}`);
    }
  }

  // Suggestions
  if (context.scenarioSuggestions && context.scenarioSuggestions.length > 0) {
    console.log(`\n💡 Suggestions: ${context.scenarioSuggestions.map(s => `${s.verbText} ${s.targetText}`).join(' | ')}`);
  }
}

// ---------------------------------------------------------------------------
// Play one turn
// ---------------------------------------------------------------------------
function playTurn(state: GameState, command: string, seed: number): GameState {
  const rng = mulberry32(seed + state.turn * 7919);
  const context = getSceneContext(state);

  console.log(`\n> ${command}`);

  const result = processTurn(state, command, context, parserData, rng);
  const newState = result.newState;

  // Generate narrative via the narration bridge
  const narrative = narrateForTurn(result, context, state);

  // Display trace info
  const tr = result.trace;
  if (tr.reformulated) {
    console.log(`\n❓ Reformulation: ${tr.reformulationPrompt}`);
  } else {
    const verb = tr.parsedVerb ?? '?';
    const target = tr.parsedTargetName ?? tr.parsedTarget ?? '-';
    const strategy = `S${tr.parseStrategy}`;
    let outcomeStr = '';
    if (tr.outcome) {
      const roll = result.diceRoll;
      outcomeStr = ` → ${tr.outcome}${roll ? ` (d20=${roll.natural} +${roll.modifier}=${roll.total} vs DC${tr.effectiveDC})` : ''}`;
    } else if (tr.isAutoVerb) {
      outcomeStr = ' → auto';
    }
    console.log(`[${verb} ${target} ${strategy}${outcomeStr}]`);
  }

  // Display narrative
  if (narrative) {
    console.log(`\n${narrative}`);
  }

  // Show consequences
  if (tr.conditionHpDrain > 0) {
    console.log(`  💀 Drain conditions: -${tr.conditionHpDrain} HP`);
  }
  if (tr.oxygenHpDrain > 0) {
    console.log(`  💨 Asphyxie: -${tr.oxygenHpDrain} HP (O₂: ${tr.o2Before}→${tr.o2After}%)`);
  }
  if (tr.npcReacted && tr.npcAttackHit) {
    console.log(`  ⚔️  NPC attaque: -${tr.npcAttackDamage} HP`);
  }
  if (tr.stalkerEventType) {
    console.log(`  🕐 Stalker: ${tr.stalkerEventType}`);
  }
  if (tr.scenarioInteractionMatched) {
    console.log(`  🎯 Interaction scénario réussie`);
  }

  // Check game end
  if (newState.phase === 'defeat') {
    console.log('\n💀 DÉFAITE — Vous êtes mort.');
    if (tr.deathResult) console.log(`  Cause: ${tr.deathResult}`);
  } else if (newState.phase === 'victory') {
    console.log(`\n🏆 VICTOIRE — ${newState.victoryResult?.type ?? 'inconnue'}`);
  }

  // Show new scene
  if (newState.phase === 'playing') {
    const newContext = getSceneContext(newState);
    displayScene(newState, newContext);
  }

  // Save state
  saveState(newState, newState.scenario!, seed);

  return newState;
}

// ---------------------------------------------------------------------------
// Init command
// ---------------------------------------------------------------------------
function initializeGame(
  skeletonId: string,
  settingId: string,
  classId: string,
  seed: number,
): GameState {
  const skeleton = LAUNCH_SKELETONS.find(s => s.id === skeletonId);
  if (!skeleton) {
    console.error(`Unknown skeleton: ${skeletonId}. Available: ${LAUNCH_SKELETONS.map(s => s.id).join(', ')}`);
    process.exit(1);
  }
  const setting = LAUNCH_SETTINGS.find(s => s.id === settingId);
  if (!setting) {
    console.error(`Unknown setting: ${settingId}. Available: ${LAUNCH_SETTINGS.map(s => s.id).join(', ')}`);
    process.exit(1);
  }

  const rng = mulberry32(seed);
  const scenario = assembleScenario(skeleton, 'standard', setting as SettingDefinition, ALL_MODULES, rng);
  const state = initGame(scenario, classId as PlayerClassName, 'survivor', 'Joueur', rng);

  // Display initial scene
  console.log(`\n🎮 Nouvelle partie initialisée`);
  console.log(`  Scénario: ${skeleton.id} | Lieu: ${settingId} | Classe: ${classId} | Seed: ${seed}`);

  const context = getSceneContext(state);
  displayScene(state, context);

  saveState(state, scenario, seed);
  return state;
}

// ---------------------------------------------------------------------------
// Batch command — play multiple commands from a file
// ---------------------------------------------------------------------------
function runBatch(commandFile: string): void {
  const saved = loadState();
  if (!saved) {
    console.error('No saved state. Run --init first.');
    process.exit(1);
  }

  const commands = fs.readFileSync(commandFile, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  let state = saved.state;
  const seed = saved.seed;

  for (const cmd of commands) {
    if (isGameOver(state)) {
      console.log('\n🛑 Partie terminée. Commandes restantes ignorées.');
      break;
    }
    state = playTurn(state, cmd, seed);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--init')) {
    const readValue = (flag: string, def: string): string => {
      const idx = args.indexOf(flag);
      return idx >= 0 && args[idx + 1] ? args[idx + 1]! : def;
    };
    const skeleton = readValue('--skeleton', 'escape');
    const setting = readValue('--setting', 'derelict_ship');
    const classId = readValue('--class', 'marine');
    const seed = Number.parseInt(readValue('--seed', String(Date.now() % 100000)), 10);
    initializeGame(skeleton, setting, classId, seed);
    return;
  }

  if (args.includes('--cmd')) {
    const idx = args.indexOf('--cmd');
    const cmd = args[idx + 1];
    if (!cmd) {
      console.error('Missing command after --cmd');
      process.exit(1);
    }
    const saved = loadState();
    if (!saved) {
      console.error('No saved state. Run --init first.');
      process.exit(1);
    }
    if (isGameOver(saved.state)) {
      console.log('🛑 Partie terminée. Utilisez --init pour recommencer.');
      process.exit(0);
    }
    playTurn(saved.state, cmd, saved.seed);
    return;
  }

  if (args.includes('--batch')) {
    const idx = args.indexOf('--batch');
    const file = args[idx + 1];
    if (!file) {
      console.error('Missing file after --batch');
      process.exit(1);
    }
    runBatch(file);
    return;
  }

  // Default: show current state
  const saved = loadState();
  if (saved) {
    const context = getSceneContext(saved.state);
    displayScene(saved.state, context);
  } else {
    console.log('No saved state. Use --init to start a new game.');
    console.log('Usage:');
    console.log('  npx tsx scripts/ai-playtest.ts --init [--skeleton escape] [--seed 42]');
    console.log('  npx tsx scripts/ai-playtest.ts --cmd "examiner environnement"');
    console.log('  npx tsx scripts/ai-playtest.ts --batch commands.txt');
  }
}

main();
