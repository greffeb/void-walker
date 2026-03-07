#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// scripts/testModule.ts — Testeur de module interactif
// ---------------------------------------------------------------------------
//
// USAGE
//   npx tsx scripts/testModule.ts           # Liste tous les modules testables
//   npx tsx scripts/testModule.ts 8         # Lance le module #8
//
// NPM SCRIPTS à ajouter dans package.json :
//   "testModule": "tsx scripts/testModule.ts"
//
// Puis :
//   npm run testModule                      # Liste
//   npm run testModule -- 8                 # Test module #8
//
// En session interactive :
//   > examiner la porte                     # Commande normale
//   > quit                                  # Quitter + rapport
// ---------------------------------------------------------------------------

import * as readline from 'node:readline';
import { initGame, isGameOver } from '../src/engine/game';
import { getSceneContext } from '../src/engine/scene';
import { processTurn } from '../src/engine/processTurn';
import { buildParserLocaleData } from '../src/content/parserData';
import { assembleScenario } from '../src/engine/pacing';
import { LAUNCH_SKELETONS } from '../src/content/scenarios/index';
import { LAUNCH_SETTINGS } from '../src/content/settings';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { narrateForTurn } from '../src/narration/index';
import { narrateScene } from '../src/narration/scene';
import type { SceneToken, NarratedScene, SceneIntroMode } from '../src/narration/scene';
import { NARRATIVE_PRESETS } from '../src/narration/types';
import { t } from '../src/i18n/index';
import type { StringKey } from '../src/i18n/types';
import type { GameState, TurnResult, DiceResult, DifficultyBreakdown, SceneContext } from '../src/engine/types';
import type { LocationVisitState } from '../src/engine/scenario';

// ---------------------------------------------------------------------------
// Couleurs ANSI
// ---------------------------------------------------------------------------

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  amber:   '\x1b[33m',
  bgDim:   '\x1b[48;5;236m',
};

const parserData = buildParserLocaleData('fr');

// ---------------------------------------------------------------------------
// Render scene tokens with ANSI colors
// ---------------------------------------------------------------------------

function renderTokens(tokens: readonly SceneToken[]): string {
  return tokens.map(tok => {
    switch (tok.kind) {
      case 'text':     return tok.value;
      case 'location': return `${C.bold}${C.white}${tok.value}${C.reset}`;
      case 'feature':  return `${C.yellow}${tok.value}${C.reset}`;
      case 'item':     return `${C.green}${tok.value}${C.reset}`;
      case 'npc':      return `${C.magenta}${tok.value}${C.reset}`;
      case 'exit':     return tok.visited
        ? `${C.dim}${C.cyan}${tok.value}${C.reset}`
        : `${C.cyan}${tok.value}${C.reset}`;
    }
  }).join('');
}

// ---------------------------------------------------------------------------
// Display full scene description (prose narrative)
// ---------------------------------------------------------------------------

function displayFullScene(state: GameState, introMode: SceneIntroMode): void {
  const ctx = getSceneContext(state);
  const sd = ctx.sceneDescription;
  if (!sd) {
    console.log(`\n  ${C.dim}[Aucune description de scène disponible]${C.reset}`);
    return;
  }

  const scene: NarratedScene = narrateScene(sd, introMode, 'fr');
  const w = 60;
  const dash = '─'.repeat(w);

  console.log(`\n${C.cyan}${dash}${C.reset}`);

  // Scenario intro (new_game only)
  if (scene.scenarioIntro) {
    console.log(`  ${C.white}${scene.scenarioIntro}${C.reset}`);
    console.log('');
  }

  // Intro (location name + optional em-dash + locationDescription)
  if (scene.intro.length > 0) {
    const introText = renderTokens(scene.intro);
    if (scene.locationDescription && introMode !== 'revisit') {
      console.log(`  ${introText}${C.dim} — ${C.reset}${C.dim}${scene.locationDescription}${C.reset}`);
    } else {
      console.log(`  ${introText}`);
    }
  }

  // Obstacle hint (before interactive elements)
  if (scene.obstacle) {
    console.log(`\n  ${C.yellow}⚠ ${scene.obstacle}${C.reset}`);
  }

  // Features
  if (scene.features.length > 0) {
    console.log(`  ${renderTokens(scene.features)}`);
  }

  // Items
  if (scene.items.length > 0) {
    console.log(`  ${renderTokens(scene.items)}`);
  }

  // NPCs
  if (scene.npcs.length > 0) {
    console.log(`  ${renderTokens(scene.npcs)}`);
  }

  // Exits
  if (scene.exits.length > 0) {
    console.log(`  ${renderTokens(scene.exits)}`);
  }

  console.log(`${C.cyan}${dash}${C.reset}`);
}

// ---------------------------------------------------------------------------
// Display dice roll with full breakdown
// ---------------------------------------------------------------------------

function displayDiceRoll(
  diceRoll: DiceResult | null,
  breakdown: DifficultyBreakdown | null,
  isAutoVerb: boolean,
): void {
  if (!diceRoll || isAutoVerb) return;

  const { natural, stat, statValue, luckBonus, modifier, total, difficulty, success, critical, fumble } = diceRoll;

  // Determine roll status
  let status: string;
  let statusColor: string;
  if (critical) {
    status = '✨ CRITIQUE !';
    statusColor = C.green + C.bold;
  } else if (fumble) {
    status = '💥 FUMBLE !';
    statusColor = C.red + C.bold;
  } else if (success) {
    status = '✓ Succès';
    statusColor = C.green;
  } else {
    status = '✗ Échec';
    statusColor = C.red;
  }

  // Build roll formula
  const parts: string[] = [`🎲 ${C.bold}${natural}${C.reset}`];
  if (statValue !== 0) {
    const sign = statValue > 0 ? '+' : '';
    parts.push(`${C.cyan}${stat}(${sign}${statValue})${C.reset}`);
  }
  if (luckBonus > 0) {
    parts.push(`${C.magenta}Chance(+${luckBonus})${C.reset}`);
  }
  if (modifier !== 0) {
    const sign = modifier > 0 ? '+' : '';
    parts.push(`${C.dim}Mods(${sign}${modifier})${C.reset}`);
  }

  const rollLine = `  ${parts.join(' ')} = ${C.bold}${total}${C.reset}`;

  // Build DC breakdown
  let dcLine = `  ${C.dim}DC ${difficulty}${C.reset}`;
  if (breakdown) {
    const dcParts: string[] = [];
    if (breakdown.base !== 0) dcParts.push(`base:${breakdown.base}`);
    if (breakdown.verbMod !== 0) dcParts.push(`verbe:${breakdown.verbMod > 0 ? '+' : ''}${breakdown.verbMod}`);
    if (breakdown.compatibilityPenalty !== 0) dcParts.push(`compat:+${breakdown.compatibilityPenalty}`);
    if (breakdown.contextMods !== 0) dcParts.push(`ctx:${breakdown.contextMods > 0 ? '+' : ''}${breakdown.contextMods}`);
    if (breakdown.creativityMod !== 0) dcParts.push(`créa:${breakdown.creativityMod > 0 ? '+' : ''}${breakdown.creativityMod}`);
    if (breakdown.difficultyPresetMod !== 0) dcParts.push(`diff:${breakdown.difficultyPresetMod > 0 ? '+' : ''}${breakdown.difficultyPresetMod}`);
    if (dcParts.length > 0) {
      dcLine = `  ${C.dim}DC: ${dcParts.join(' ')} = ${breakdown.total}${C.reset}`;
    }
  }

  // Display
  console.log('');
  console.log(rollLine);
  console.log(dcLine);
  console.log(`  ${statusColor}${status}${C.reset}`);

  // Detailed breakdown reasons
  if (breakdown && breakdown.details.length > 0) {
    for (const detail of breakdown.details) {
      console.log(`    ${C.dim}• ${detail}${C.reset}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Display immersive narration
// ---------------------------------------------------------------------------

function displayNarration(
  result: TurnResult,
  sceneContext: SceneContext,
  prevState: GameState,
): void {
  // Handle reformulation (ambiguous input)
  if (result.trace.reformulated) {
    console.log(`\n  ${C.yellow}❓ ${result.trace.reformulationPrompt ?? result.narrative}${C.reset}`);
    return;
  }

  // Generate immersive narrative
  const narrative = narrateForTurn(result, sceneContext, prevState, NARRATIVE_PRESETS.immersive, 'fr');

  if (narrative && narrative.trim()) {
    console.log(`\n  ${C.amber}${narrative}${C.reset}`);
  }
}

// ---------------------------------------------------------------------------
// Display player vital stats (compact)
// ---------------------------------------------------------------------------

function displayVitalStats(state: GameState): void {
  if (!state.character) return;

  const { hp, maxHp } = state.character;
  const hpColor = hp > maxHp * 0.5 ? C.green : hp > maxHp * 0.25 ? C.yellow : C.red;
  let statsLine = `  ${C.dim}HP${C.reset} ${hpColor}${bar(hp, maxHp)} ${hp}/${maxHp}${C.reset}`;

  const o2 = (state.character as { oxygen?: number }).oxygen;
  if (typeof o2 === 'number') {
    const o2Color = o2 > 50 ? C.cyan : o2 > 20 ? C.yellow : C.red;
    statsLine += `   ${C.dim}O₂${C.reset} ${o2Color}${bar(o2, 100)} ${o2}%${C.reset}`;
  }

  console.log(statsLine);
}

// ---------------------------------------------------------------------------
// Display inventory
// ---------------------------------------------------------------------------

function displayInventory(state: GameState): void {
  const ctx = getSceneContext(state);
  const items = ctx.inventory ?? [];

  console.log(`\n  ${C.bold}${C.cyan}━━━ INVENTAIRE ━━━${C.reset}`);

  if (items.length === 0) {
    console.log(`  ${C.dim}(vide)${C.reset}`);
  } else {
    for (const item of items) {
      const name = t(item.nameKey as StringKey);
      const equipped = state.character?.equippedWeapon === item.id ? ` ${C.yellow}[équipé]${C.reset}` : '';
      console.log(`  ${C.green}• ${name}${C.reset}${equipped}`);
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// RNG mulberry32 (meilleure distribution que LCG)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return (): number => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Catalogue des modules (index 1-based pour l'utilisateur)
// ---------------------------------------------------------------------------

type ModuleEntry = {
  number:      number;
  id:          string;
  type:        string;
  category:    'universal' | 'category' | 'complex';
  locationIds: string[];
};

const MODULE_CATALOG: ModuleEntry[] = ALL_MODULES.map((mod, i) => {
  const id = mod.id;
  let category: 'universal' | 'category' | 'complex' = 'universal';
  if (['airlock_malfunction_01', 'malfunctioning_android_01', 'alien_mechanism_01',
       'containment_breach_01', 'power_reroute_dilemma_01'].includes(id)) {
    category = 'category';
  } else if (['patrol_entity_01', 'flooded_section_01', 'survivor_rescue_01',
              'terminal_decrypt_01', 'explosive_decompression_risk_01'].includes(id)) {
    category = 'complex';
  }
  // Extraire les location IDs depuis la définition du module
  const locationIds: string[] = ((mod as any).locations ?? []).map((l: any) => l.id as string);

  return { number: i + 1, id, type: mod.type, category, locationIds };
});

// ---------------------------------------------------------------------------
// Affichage de la liste
// ---------------------------------------------------------------------------

function printModuleList(): void {
  const w = 53;
  const line = '═'.repeat(w);
  const dash = '─'.repeat(w);

  console.log('');
  console.log(`${C.bold}${C.cyan}${line}${C.reset}`);
  console.log(`${C.bold}${C.amber}  VOID WALKER — Modules Testables${C.reset}`);
  console.log(`${C.bold}${C.cyan}${line}${C.reset}`);
  console.log('');

  const typeColor: Record<string, string> = {
    blocked_passage:  C.blue,
    patrol_enemy:     C.red,
    npc_encounter:    C.magenta,
    terminal_puzzle:  C.cyan,
    environmental:    C.yellow,
    exploration:      C.green,
    rescue:           C.magenta,
    moral_choice:     C.yellow,
    resource_cache:   C.green,
    ambush:           C.red,
  };

  const sections: Array<{ label: string; cat: ModuleEntry['category'] }> = [
    { label: 'UNIVERSEL  (5)', cat: 'universal' },
    { label: 'CATÉGORIE  (5)', cat: 'category'  },
    { label: 'COMPLEXE   (5)', cat: 'complex'   },
  ];

  for (const { label, cat } of sections) {
    console.log(`  ${C.dim}── ${label} ──${C.reset}`);
    const entries = MODULE_CATALOG.filter(e => e.category === cat);
    for (const e of entries) {
      const num   = String(e.number).padStart(2, ' ');
      const col   = typeColor[e.type] ?? C.white;
      const idPad = e.id.padEnd(36, ' ');
      console.log(`  ${C.bold}${C.yellow}[${num}]${C.reset}  ${col}${idPad}${C.reset}${C.dim}(${e.type})${C.reset}`);
    }
    console.log('');
  }

  console.log(`${C.dim}  ${dash}${C.reset}`);
  console.log(`${C.dim}  Lancer un test  :  npx tsx scripts/testModule.ts <numéro>${C.reset}`);
  console.log(`${C.dim}  Exemple         :  npx tsx scripts/testModule.ts 8${C.reset}`);
  console.log(`${C.dim}  Avec npm        :  npm run testModule -- 8${C.reset}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Trouver un scénario contenant le module cible
// ---------------------------------------------------------------------------

type FoundScenario = {
  state:            GameState;
  rng:              () => number;  // RNG persistant pour les tours
  gameSeed:         number;        // Pour affichage seulement
  moduleLocationId: string;
};

function findScenarioWithModule(entry: ModuleEntry, maxSeeds = 300): FoundScenario | null {
  const skeleton = LAUNCH_SKELETONS[0]!;  // ESCAPE — la plus simple
  const setting  = LAUNCH_SETTINGS[0]!;   // derelict_ship

  for (let seedOffset = 0; seedOffset < maxSeeds; seedOffset++) {
    const gameSeed = 1000 + seedOffset;

    // Première passe : vérifier si le module est dans le scénario
    const rng1 = mulberry32(gameSeed);
    let scenario: ReturnType<typeof assembleScenario>;
    try {
      scenario = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, rng1);
    } catch {
      continue;
    }

    // Chercher un node dont l'id correspond aux locations du module
    let moduleLocationId: string | undefined;
    if (entry.locationIds.length > 0) {
      const found = scenario.graph.nodes.find((n: any) => entry.locationIds.includes(n.id));
      moduleLocationId = found?.id;
    }
    // Fallback : chercher par coreNodeId contenant le module id
    if (!moduleLocationId) {
      const found = scenario.graph.nodes.find(
        (n: any) => n.sourceModuleId === entry.id || n.moduleId === entry.id
      );
      moduleLocationId = found?.id;
    }

    if (!moduleLocationId) continue;

    // Deuxième passe : recréer le même scénario + initGame avec le rng qui continue
    const rng2 = mulberry32(gameSeed);
    let scenario2: ReturnType<typeof assembleScenario>;
    try {
      scenario2 = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, rng2);
    } catch {
      continue;
    }
    // rng2 est maintenant à l'état post-assembly, idéal pour initGame
    const baseState = initGame(scenario2, 'marine', 'survivor', 'Testeur', rng2);

    // Téléporter le joueur directement au module cible
    const initialVisit: LocationVisitState = {
      firstVisited: 0,
      visitCount: 1,
      itemsTaken: [],
      featuresChanged: [],
      obstacleResolved: false,
      droppedItems: [],
    };
    const state: GameState = {
      ...baseState,
      playerLocationId: moduleLocationId,
      visitedLocations: {
        ...baseState.visitedLocations,
        [moduleLocationId]: initialVisit,
      },
    };

    // Retourner le RNG persistant (pas le seed) pour les tours de jeu
    return { state, rng: rng2, gameSeed, moduleLocationId };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Affichage d'un résultat de tour
// ---------------------------------------------------------------------------

function bar(value: number, max: number, width = 10): string {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, width - filled));
}

function displaySceneStatus(state: GameState): void {
  const ctx = getSceneContext(state);

  // Localisation
  const locId = ctx.locationId ?? state.playerLocationId ?? '?';
  console.log(`\n  ${C.bold}${C.cyan}▸ ${locId}${C.reset}`);

  // Stats vitales
  if (state.character) {
    const { hp, maxHp } = state.character;
    const hpColor = hp > maxHp * 0.5 ? C.green : hp > maxHp * 0.25 ? C.yellow : C.red;
    let statsLine = `  ${C.dim}HP${C.reset} ${hpColor}${bar(hp, maxHp)} ${hp}/${maxHp}${C.reset}`;
    const o2 = (state.character as any).oxygen;
    if (typeof o2 === 'number') {
      const o2Color = o2 > 50 ? C.cyan : o2 > 20 ? C.yellow : C.red;
      statsLine += `   ${C.dim}O₂${C.reset} ${o2Color}${bar(o2, 100)} ${o2}%${C.reset}`;
    }
    console.log(statsLine);
  }

  // Éléments visibles
  const items    = (ctx.locationItems          ?? []).map((i: any) => i.id ?? i.nameKey);
  const features = (ctx.environmentFeatures    ?? []).map((f: any) => f.id ?? f.nameKey);
  const npcs     = (ctx.npcs                   ?? []).map((n: any) => n.id ?? n.nameKey);
  const exits    = (ctx.connectedLocations      ?? []).map((l: any) => l.id ?? l.aliases?.[0] ?? '?');

  if (items.length)    console.log(`  ${C.dim}Objets   :${C.reset} ${items.join(', ')}`);
  if (features.length) console.log(`  ${C.dim}Éléments :${C.reset} ${features.join(', ')}`);
  if (npcs.length)     console.log(`  ${C.dim}PNJs     :${C.reset} ${npcs.join(', ')}`);
  if (exits.length)    console.log(`  ${C.dim}Sorties  :${C.reset} ${exits.join(', ')}`);

  // Suggestions
  const rawSuggestions: unknown[] = ctx.scenarioSuggestions ?? (ctx as any).suggestions ?? [];
  if (rawSuggestions.length > 0) {
    const fmt = rawSuggestions.slice(0, 3).map(s => {
      if (typeof s === 'string') return s;
      const any = s as any;
      return any.inputText ?? any.action ?? any.verb ?? JSON.stringify(s);
    });
    console.log(`  ${C.dim}Suggestions : ${fmt.map(s => `"${s}"`).join('   ')}${C.reset}`);
  }
}

// ---------------------------------------------------------------------------
// Session interactive
// ---------------------------------------------------------------------------

async function runModuleTest(moduleNumber: number): Promise<void> {
  const entry = MODULE_CATALOG[moduleNumber - 1];
  if (!entry) {
    console.error(`\n${C.red}  Module #${moduleNumber} introuvable. Maximum : ${ALL_MODULES.length}${C.reset}\n`);
    process.exit(1);
  }

  const w = 53;
  console.log('');
  console.log(`${C.bold}${C.cyan}${'═'.repeat(w)}${C.reset}`);
  console.log(`${C.bold}  TEST MODULE ${C.yellow}#${moduleNumber}${C.reset}`);
  console.log(`${C.bold}  ${C.amber}${entry.id}${C.reset}`);
  console.log(`${C.bold}  Type : ${C.magenta}${entry.type}${C.reset}`);
  console.log(`${C.bold}${C.cyan}${'═'.repeat(w)}${C.reset}`);
  console.log('');
  process.stdout.write(`${C.dim}  Recherche d'un scénario contenant ce module...${C.reset}`);

  const found = findScenarioWithModule(entry);

  if (!found) {
    console.log(` ${C.red}ÉCHEC${C.reset}\n`);
    console.error(`${C.red}  Impossible de générer un scénario avec "${entry.id}".${C.reset}`);
    console.error(`${C.dim}  Ce module est peut-être filtré pour le skeleton ESCAPE + setting derelict_ship.${C.reset}`);
    console.error(`${C.dim}  Essayez d'élargir la recherche dans findScenarioWithModule().${C.reset}\n`);
    process.exit(1);
  }

  console.log(` ${C.green}OK (seed ${found.gameSeed})${C.reset}`);
  console.log(`${C.dim}  Location du module : ${found.moduleLocationId}${C.reset}`);
  console.log('');
  console.log(`${C.bold}${C.yellow}  OBJECTIF : Résoudre l'obstacle du module et rejoindre la zone suivante.${C.reset}`);
  console.log(`${C.dim}  Tapez "quit" pour terminer et voir votre rapport.${C.reset}`);
  console.log(`${C.dim}  Tapez "regarder" pour inspecter votre environnement.${C.reset}`);
  console.log(`${C.dim}  Tapez "inventaire" pour voir vos objets.${C.reset}`);
  console.log('');
  console.log(`${C.cyan}${'─'.repeat(w)}${C.reset}\n`);

  let currentState = found.state;

  // Suivi de la progression
  let moduleReached  = true;  // On démarre directement dans le module
  let moduleCleared  = false;   // vrai si le joueur quitte la zone du module
  let turnCount      = 0;
  let prevFlags: Readonly<Record<string, boolean>> = { ...currentState.scenarioFlags };

  // Afficher la scène initiale avec narration immersive (mode 'enter' car on arrive dans le module)
  console.log(`\n${C.bold}${C.yellow}  ★ Vous êtes téléporté dans la zone du module ! Résolvez l'obstacle.${C.reset}`);
  displayVitalStats(currentState);
  displayFullScene(currentState, 'enter');

  // ── REPL ──────────────────────────────────────────────────────────────

  const rl = readline.createInterface({
    input:    process.stdin,
    output:   process.stdout,
    terminal: true,
  });

  // Gestion propre de Ctrl+C
  rl.on('SIGINT', () => {
    rl.close();
  });

  const prompt = (): void => {
    process.stdout.write(`\n${C.bold}${C.amber}> ${C.reset}`);
  };

  prompt();

  for await (const rawLine of rl) {
    const input = rawLine.trim();

    if (!input) { prompt(); continue; }

    // ── Commandes méta ──
    if (['quit', 'exit', 'quitter', 'sortir'].includes(input.toLowerCase())) {
      rl.close();
      break;
    }

    if (['aide', 'help', '?'].includes(input.toLowerCase())) {
      console.log(`\n  ${C.dim}Commandes disponibles :${C.reset}`);
      console.log(`  ${C.dim}  regarder / examiner <objet> / prendre <objet> / utiliser <objet>${C.reset}`);
      console.log(`  ${C.dim}  aller <direction> / parler <pnj> / attaquer <cible>${C.reset}`);
      console.log(`  ${C.dim}  inventaire / état / quit${C.reset}`);
      prompt();
      continue;
    }

    // Commande inventaire
    if (['inventaire', 'inv', 'i'].includes(input.toLowerCase())) {
      displayInventory(currentState);
      prompt();
      continue;
    }

    if (isGameOver(currentState)) {
      console.log(`\n${C.yellow}  La partie est terminée. Tapez "quit" pour voir le rapport.${C.reset}`);
      prompt();
      continue;
    }

    // ── Tour de jeu ──
    turnCount++;
    const prevState    = currentState;
    const prevLocation = currentState.playerLocationId;

    try {
      const ctx    = getSceneContext(currentState);
      const result = processTurn(currentState, input, ctx, parserData, found.rng);
      currentState  = result.newState;

      // Narration immersive (7 couches)
      displayNarration(result, ctx, prevState);

      // Lancer de dés avec breakdown complet
      displayDiceRoll(
        result.diceRoll,
        result.trace.difficultyBreakdown,
        result.trace.isAutoVerb,
      );

      // ── Suivi module ──

      // A-t-on atteint la zone du module ?
      if (currentState.playerLocationId === found.moduleLocationId && !moduleReached) {
        moduleReached = true;
        console.log(`\n${C.bold}${C.yellow}  ★ Vous êtes dans la zone du module ! Résolvez l'obstacle.${C.reset}`);
      }

      // A-t-on quitté la zone du module après l'avoir atteinte ?
      if (moduleReached && !moduleCleared && currentState.playerLocationId !== found.moduleLocationId) {
        moduleCleared = true;
        console.log(`\n${C.bold}${C.green}  ✅ Obstacle franchi ! Vous avez quitté la zone du module.${C.reset}`);
      }

      // Flag changé pendant le séjour dans le module ?
      if (moduleReached && !moduleCleared) {
        const newFlags = currentState.scenarioFlags ?? {};
        const changedFlags = Object.keys(newFlags).filter(k => newFlags[k] !== prevFlags[k]);
        if (changedFlags.length > 0) {
          console.log(`  ${C.dim}[Flags modifiés : ${changedFlags.join(', ')}]${C.reset}`);
        }
        prevFlags = { ...newFlags };
      }

      // Déterminer le mode d'intro de la scène
      const newLocation = currentState.playerLocationId;
      let introMode: SceneIntroMode = 'revisit';
      if (newLocation && newLocation !== prevLocation) {
        // Vérifier si déjà visité
        const wasVisited = newLocation in (prevState.visitedLocations ?? {});
        introMode = wasVisited ? 'revisit' : 'enter';
      }

      // Afficher stats et scène complète
      displayVitalStats(currentState);
      displayFullScene(currentState, introMode);

      // Victoire / défaite engine
      if (currentState.phase === 'victory') {
        moduleCleared = true;
        console.log(`\n${C.bold}${C.green}  🏆  VICTOIRE ! Scénario terminé.${C.reset}`);
        rl.close();
        break;
      }
      if (isGameOver(currentState)) {
        console.log(`\n${C.red}  💀  Défaite. Tapez "quit" pour voir le rapport.${C.reset}`);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n${C.red}  [Erreur engine : ${msg}]${C.reset}`);
    }

    prompt();
  }

  // ── Rapport final ────────────────────────────────────────────────────

  const w2 = 53;
  console.log('');
  console.log(`${C.bold}${C.cyan}${'═'.repeat(w2)}${C.reset}`);
  console.log(`${C.bold}  RAPPORT — Module #${moduleNumber} : ${C.amber}${entry.id}${C.reset}`);
  console.log(`${C.cyan}${'─'.repeat(w2)}${C.reset}`);
  console.log(`  Tours joués      : ${C.bold}${turnCount}${C.reset}`);
  console.log(`  Module atteint   : ${moduleReached ? `${C.green}✓ Oui${C.reset}` : `${C.red}✗ Non${C.reset}`}`);
  console.log(`  Obstacle résolu  : ${moduleCleared ? `${C.green}✓ Oui${C.reset}` : `${C.red}✗ Non${C.reset}`}`);
  if (currentState.character) {
    console.log(`  HP final         : ${currentState.character.hp}/${currentState.character.maxHp}`);
  }
  console.log(`${C.cyan}${'─'.repeat(w2)}${C.reset}`);

  if (moduleCleared) {
    console.log('');
    console.log(`${C.bold}${C.green}  ✅  MODULE PASSÉ — "${entry.id}" fonctionne correctement.${C.reset}`);
  } else if (moduleReached) {
    console.log('');
    console.log(`${C.yellow}  ⚠   Module atteint mais obstacle non résolu.${C.reset}`);
    console.log(`${C.dim}  Vérifiez les chemins de résolution (paths) et les flags requis.${C.reset}`);
  } else {
    console.log('');
    console.log(`${C.dim}  Module non atteint durant cette session.${C.reset}`);
    console.log(`${C.dim}  Le module est à la location : ${found.moduleLocationId}${C.reset}`);
  }

  console.log(`${C.bold}${C.cyan}${'═'.repeat(w2)}${C.reset}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--list') || args.includes('-l')) {
  printModuleList();
} else {
  const num = Number.parseInt(args[0]!, 10);
  if (Number.isNaN(num) || num < 1 || num > ALL_MODULES.length) {
    console.error(`\n${C.red}  Numéro invalide : "${args[0]}". Choisissez entre 1 et ${ALL_MODULES.length}.${C.reset}\n`);
    process.exit(1);
  }
  runModuleTest(num).catch(err => {
    console.error(`\n${C.red}  Erreur fatale : ${err instanceof Error ? err.message : String(err)}${C.reset}\n`);
    process.exit(1);
  });
}
