#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// scripts/ai-playtest.ts — AI-driven turn-by-turn playtest tool
// ---------------------------------------------------------------------------
// Usage:
//   npx tsx scripts/ai-playtest.ts new-game --seed=1234 --class=explorer --difficulty=explorer
//   npx tsx scripts/ai-playtest.ts --input="je ramasse la trousse"
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
import type { AssembledScenario } from '../src/engine/scenario';
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
function saveState(state: GameState, seed: number): void {
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
function displayScene(state: GameState, context: SceneContext, isNewGameIntro = false): void {
  const sd = context.sceneDescription;
  const location = sd?.locationDescription
    ?? (state.playerLocationId !== null ? t(`location.${state.playerLocationId}` as StringKey) : 'Lieu inconnu');

  if (isNewGameIntro) {
    console.log(`Vous reprenez conscience dans ${location}. ${location}`);
  } else {
    console.log(`\n${location}`);
  }

  const visibleItems = sd?.visibleItems ?? [];
  const visibleFeatures = sd?.visibleFeatures ?? [];

  if (visibleItems.length > 0) {
    console.log(`Vous remarquez : ${visibleItems.map(i => i.name).join(', ')}.`);
  }

  if (visibleFeatures.length > 0) {
    console.log(`L'environnement : ${visibleFeatures.map(f => f.name).join(', ')}.`);
  }

  const exits = sd?.exits ?? [];
  if (exits.length > 0) {
    console.log(`Sorties : ${exits.map(e => `${e.name} [${e.visited ? 'exploré' : 'inexplore'}]`).join(', ')}`);
  }

  console.log('Que faites-vous ?');
}

function getFlagValue(args: readonly string[], flag: string): string | undefined {
  const prefix = `${flag}=`;
  const inline = args.find(arg => arg.startsWith(prefix));
  if (inline !== undefined) {
    return inline.slice(prefix.length);
  }

  const idx = args.indexOf(flag);
  if (idx >= 0) {
    const next = args[idx + 1];
    if (next !== undefined && !next.startsWith('--')) {
      return next;
    }
  }

  return undefined;
}

function normalizeClassId(classId: string): PlayerClassName {
  if (classId === 'explorer') {
    return 'marine';
  }
  if (classId === 'marine' || classId === 'engineer' || classId === 'medic') {
    return classId;
  }
  console.error('Unknown class. Available: marine, engineer, medic. Alias: explorer -> marine');
  process.exit(1);
}

function normalizeDifficulty(difficulty: string): DifficultyLevel {
  if (difficulty === 'explorer' || difficulty === 'survivor' || difficulty === 'nightmare') {
    return difficulty;
  }
  console.error('Unknown difficulty. Available: explorer, survivor, nightmare');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Play one turn
// ---------------------------------------------------------------------------
function playTurn(state: GameState, command: string, seed: number): GameState {
  const rng = mulberry32(seed + state.turn * 7919);
  const context = getSceneContext(state);

  const result = processTurn(state, command, context, parserData, rng);
  const newState = result.newState;

  // Generate narrative via the narration bridge
  const narrative = narrateForTurn(result, context, state);

  // Display action summary
  const tr = result.trace;
  if (tr.reformulated) {
    console.log(`${tr.reformulationPrompt ?? 'Je ne suis pas sûr de comprendre votre action.'}`);
  } else {
    const verb = tr.parsedVerb ?? '?';
    const target = tr.parsedTargetName ?? tr.parsedTarget ?? '-';
    const mode = tr.isAutoVerb ? 'automatique' : (tr.outcome ?? 'résolution');
    console.log(`${verb} sur ${target}— ${mode}`);
  }

  // Display narrative
  if (narrative) {
    console.log(narrative);
  }

  // Check game end
  if (newState.phase === 'defeat') {
    console.log('💀 DÉFAITE — Vous êtes mort.');
    if (tr.deathResult) console.log(`  Cause: ${tr.deathResult}`);
  } else if (newState.phase === 'victory') {
    console.log(`🏆 VICTOIRE — ${newState.victoryResult?.type ?? 'inconnue'}`);
  }

  // Show new scene
  if (newState.phase === 'playing') {
    const newContext = getSceneContext(newState);
    displayScene(newState, newContext);
  }

  // Save state
  saveState(newState, seed);

  return newState;
}

// ---------------------------------------------------------------------------
// Init command
// ---------------------------------------------------------------------------
function initializeGame(
  skeletonId: string | undefined,
  settingId: string | undefined,
  classId: string,
  difficulty: string,
  seed: number,
): GameState {
  const rng = mulberry32(seed);
  const skeleton = skeletonId === undefined
    ? LAUNCH_SKELETONS[Math.floor(rng() * LAUNCH_SKELETONS.length)]
    : LAUNCH_SKELETONS.find(s => s.id === skeletonId);
  if (!skeleton) {
    console.error(`Unknown skeleton: ${skeletonId}. Available: ${LAUNCH_SKELETONS.map(s => s.id).join(', ')}`);
    process.exit(1);
  }
  const setting = settingId === undefined
    ? LAUNCH_SETTINGS[Math.floor(rng() * LAUNCH_SETTINGS.length)]
    : LAUNCH_SETTINGS.find(s => s.id === settingId);
  if (!setting) {
    console.error(`Unknown setting: ${settingId}. Available: ${LAUNCH_SETTINGS.map(s => s.id).join(', ')}`);
    process.exit(1);
  }

  const scenario = assembleScenario(skeleton, 'standard', setting as SettingDefinition, ALL_MODULES, rng);
  const normalizedClass = normalizeClassId(classId);
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const state = initGame(scenario, normalizedClass, normalizedDifficulty, 'Joueur', rng);

  // Display initial scene
  const context = getSceneContext(state);
  displayScene(state, context, true);

  saveState(state, seed);
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
  const primaryCommand = args.find(arg => !arg.startsWith('--'));

  const inputCommand = getFlagValue(args, '--input') ?? getFlagValue(args, '--cmd');

  if (args.includes('--init') || primaryCommand === 'new-game') {
    const skeleton = getFlagValue(args, '--skeleton');
    const setting = getFlagValue(args, '--setting');
    const classId = getFlagValue(args, '--class') ?? 'marine';
    const difficulty = getFlagValue(args, '--difficulty') ?? 'survivor';
    const seedRaw = getFlagValue(args, '--seed') ?? String(Date.now() % 100000);
    const seed = Number.parseInt(seedRaw, 10);
    initializeGame(skeleton, setting, classId, difficulty, Number.isNaN(seed) ? 0 : seed);
    return;
  }

  if (inputCommand) {
    if (!inputCommand.trim()) {
      console.error('Missing command text after --input or --cmd');
      process.exit(1);
    }
    const saved = loadState();
    if (!saved) {
      console.error('No saved state. Run new-game first.');
      process.exit(1);
    }
    if (isGameOver(saved.state)) {
      console.log('🛑 Partie terminée. Utilisez new-game pour recommencer.');
      process.exit(0);
    }
    playTurn(saved.state, inputCommand, saved.seed);
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
    console.log('No saved state. Use new-game (or --init) to start a new game.');
    console.log('Usage:');
    console.log('  npx tsx scripts/ai-playtest.ts new-game --seed=1234 --class=explorer --difficulty=explorer');
    console.log('  npx tsx scripts/ai-playtest.ts --input="je ramasse la trousse"');
    console.log('  npx tsx scripts/ai-playtest.ts --init [--skeleton escape] [--seed 42] [--class marine] [--difficulty survivor]');
    console.log('  npx tsx scripts/ai-playtest.ts --cmd "examiner environnement"');
    console.log('  npx tsx scripts/ai-playtest.ts --batch commands.txt');
  }
}

main();
