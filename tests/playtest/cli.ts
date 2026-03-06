#!/usr/bin/env tsx
/* eslint-disable no-console */
// ---------------------------------------------------------------------------
// tests/playtest/cli.ts — Interactive REPL for Phase 2 parser testing
// ---------------------------------------------------------------------------
// Usage:
//   npm run playtest           Interactive REPL
//   npm run playtest:debug     Show parse internals (strategy, confidence, tokens)
//   npm run playtest:god       Set all stats to max (5)
//   npm run playtest:chaos     Random scene on each turn
// ---------------------------------------------------------------------------

import * as readline from 'node:readline';
import { parseAction } from '../../src/engine/parser';
import { BODY_PARTS } from '../../src/engine/resolver';
import { calculateDifficulty } from '../../src/engine/difficulty';
import { buildParserLocaleData } from '../../src/content/parserData';

const localeData = buildParserLocaleData('fr');
import { isReformulation } from '../../src/engine/types';
import { VERB_REGISTRY, VERB_IDS, AUTO_VERBS } from '../../src/engine/verbs';
import { ITEM_LIST, ITEM_DEFINITIONS, resolveItemProperties } from '../../src/content/items';
import { NPC_LIST, NPC_DEFINITIONS, resolveNPCProperties } from '../../src/content/npcs';
import { ENVIRONMENT_FEATURE_LIST, ENVIRONMENT_FEATURE_DEFINITIONS, resolveEnvironmentProperties } from '../../src/content/environments';
import { getEntityAliases } from '../../src/content/helpers';
import { t } from '../../src/i18n';
import type {
  SceneContext,
  ResolvedTarget,
  NpcInstance,
  EnvironmentFeatureInstance,
  BodyPartDefinition,
  DifficultyLevel,
  StatBlock,
} from '../../src/engine/types';

// === CLI COLORS ===

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// === FLAGS ===

const args = process.argv.slice(2);
const DEBUG = args.includes('--debug');
const GOD_MODE = args.includes('--god');
const CHAOS = args.includes('--chaos');

// === SCENE BUILDER ===

function buildDefaultScene(): SceneContext {
  // Inventory: first 5 items
  const itemIds = ITEM_LIST.map((item) => item.id);
  const inventory: ResolvedTarget[] = itemIds.slice(0, 5).flatMap((id) => {
    const def = ITEM_DEFINITIONS[id];
    if (!def) return [];
    return [{
      id,
      nameKey: def.nameKey,
      properties: resolveItemProperties(id),
      isVirtual: false,
      source: 'inventory' as const,
      aliases: [
        ...getEntityAliases(def.aliasesKey, def.nameKey),
        ...id.replace(/_/g, ' ').split(' '),
      ],
    }];
  });

  // Location items: next 5
  const locationItems: ResolvedTarget[] = itemIds.slice(5, 10).flatMap((id) => {
    const def = ITEM_DEFINITIONS[id];
    if (!def) return [];
    return [{
      id,
      nameKey: def.nameKey,
      properties: resolveItemProperties(id),
      isVirtual: false,
      source: 'location' as const,
      aliases: [
        ...getEntityAliases(def.aliasesKey, def.nameKey),
        ...id.replace(/_/g, ' ').split(' '),
      ],
    }];
  });

  // All NPCs
  const npcs: NpcInstance[] = NPC_LIST.flatMap((npcDef) => {
    const def = NPC_DEFINITIONS[npcDef.id];
    if (!def) return [];
    return [{
      id: npcDef.id,
      definitionId: npcDef.id,
      nameKey: def.nameKey,
      aliases: [
        ...getEntityAliases(def.aliasesKey, def.nameKey),
        ...npcDef.id.replace(/_/g, ' ').split(' '),
      ],
      properties: resolveNPCProperties(npcDef.id),
      hp: def.hp,
    }];
  });

  // All environment features
  const environmentFeatures: EnvironmentFeatureInstance[] = ENVIRONMENT_FEATURE_LIST.flatMap((fDef) => {
    const def = ENVIRONMENT_FEATURE_DEFINITIONS[fDef.id];
    if (!def) return [];
    return [{
      id: fDef.id,
      definitionId: fDef.id,
      nameKey: def.nameKey,
      aliases: [
        ...getEntityAliases(def.aliasesKey, def.nameKey),
        ...fDef.id.replace(/_/g, ' ').split(' '),
      ],
      properties: resolveEnvironmentProperties(fDef.id),
    }];
  });

  // Body parts with locale-aware aliases
  const bodyParts: BodyPartDefinition[] = [...BODY_PARTS.entries()].map(([_id, def]) => ({
    id: def.id,
    nameKey: def.nameKey,
    aliases: getEntityAliases(
      `${def.nameKey}.aliases` as import('../../src/i18n/types').StringKey,
      def.nameKey as import('../../src/i18n/types').StringKey,
    ),
    baseProperties: [...def.baseProperties],
  }));

  return {
    inventory,
    locationItems,
    npcs,
    environmentFeatures,
    connectedLocations: [
      { id: 'corridor_a', aliases: ['corridor', 'couloir'] },
      { id: 'sas_b', aliases: ['sas', 'airlock', 'sas-b'] },
      { id: 'infirmerie', aliases: ['infirmerie', 'medbay'] },
    ],
    suggestions: [],
    environmentConditions: [],
    bodyParts,
  };
}

function buildChaosScene(): SceneContext {
  const scene = buildDefaultScene();
  // Randomly toggle conditions
  const conditions: ('dark' | 'zero_g' | 'time_pressure')[] = [];
  if (Math.random() > 0.5) conditions.push('dark');
  if (Math.random() > 0.7) conditions.push('zero_g');
  if (Math.random() > 0.6) conditions.push('time_pressure');
  return { ...scene, environmentConditions: conditions };
}

// === DISPLAY HELPERS ===

function printBanner(): void {
  console.log(`\n${C.magenta}${C.bold}╔═══════════════════════════════════════╗${C.reset}`);
  console.log(`${C.magenta}${C.bold}║     VOID WALKER — Parser Playtest     ║${C.reset}`);
  console.log(`${C.magenta}${C.bold}╚═══════════════════════════════════════╝${C.reset}`);
  console.log(`${C.dim}Phase 2: Parser & Action Resolution${C.reset}`);
  if (DEBUG) console.log(`${C.yellow}[DEBUG MODE]${C.reset}`);
  if (GOD_MODE) console.log(`${C.green}[GOD MODE] Toutes les stats à 5${C.reset}`);
  if (CHAOS) console.log(`${C.red}[CHAOS MODE] Scène aléatoire chaque tour${C.reset}`);
  console.log();
}

function printScene(scene: SceneContext): void {
  console.log(`${C.cyan}${C.bold}── Scène ──${C.reset}`);
  console.log(`${C.cyan}Inventaire:${C.reset} ${scene.inventory.map((i) => i.id).join(', ') || '(vide)'}`);
  console.log(`${C.cyan}Au sol:${C.reset} ${scene.locationItems.map((i) => i.id).join(', ') || '(rien)'}`);
  console.log(`${C.cyan}PNJ:${C.reset} ${scene.npcs.map((n) => n.id).join(', ') || '(aucun)'}`);
  console.log(`${C.cyan}Environnement:${C.reset} ${scene.environmentFeatures.map((f) => f.id).join(', ') || '(rien)'}`);
  console.log(`${C.cyan}Sorties:${C.reset} ${scene.connectedLocations.map((l) => l.id).join(', ') || '(aucune)'}`);
  if (scene.environmentConditions.length > 0) {
    console.log(`${C.yellow}Conditions:${C.reset} ${scene.environmentConditions.join(', ')}`);
  }
  console.log();
}

function printHelp(): void {
  console.log(`${C.bold}Commandes spéciales:${C.reset}`);
  console.log(`  ${C.cyan}/help${C.reset}     Affiche cette aide`);
  console.log(`  ${C.cyan}/scene${C.reset}    Affiche la scène actuelle`);
  console.log(`  ${C.cyan}/verbs${C.reset}    Liste les 77 verbes disponibles`);
  console.log(`  ${C.cyan}/items${C.reset}    Liste les objets`);
  console.log(`  ${C.cyan}/parts${C.reset}    Liste les parties du corps ciblables`);
  console.log(`  ${C.cyan}/quit${C.reset}     Quitte le REPL`);
  console.log();
  console.log(`${C.dim}Tapez une action en français: "frapper le robot", "examiner la porte", etc.${C.reset}`);
  console.log();
}

function printVerbs(): void {
  console.log(`${C.bold}77 verbes disponibles:${C.reset}`);
  const perLine = 6;
  for (let i = 0; i < VERB_IDS.length; i += perLine) {
    const chunk = VERB_IDS.slice(i, i + perLine);
    const line = chunk.map((v) => {
      const auto = AUTO_VERBS.has(v) ? `${C.green}*` : C.white;
      return `${auto}${v.padEnd(20)}${C.reset}`;
    }).join('');
    console.log(`  ${line}`);
  }
  console.log(`${C.dim}  * = action automatique (pas de jet)${C.reset}`);
  console.log();
}

function printBodyParts(scene: SceneContext): void {
  console.log(`${C.bold}Parties du corps ciblables:${C.reset}`);
  const parts = scene.bodyParts && scene.bodyParts.length > 0
    ? scene.bodyParts
    : [...BODY_PARTS.values()];
  for (const part of parts) {
    console.log(`  ${C.yellow}${part.id}${C.reset}: aliases=[${part.aliases.join(', ')}] props=[${part.baseProperties.join(', ')}]`);
  }
  console.log(`${C.dim}  Usage: "frapper la tête du robot", "couper les griffes de l'alien"${C.reset}`);
  console.log();
}

function printItems(scene: SceneContext): void {
  console.log(`${C.bold}Objets en jeu:${C.reset}`);
  console.log(`  ${C.green}Inventaire:${C.reset}`);
  for (const item of scene.inventory) {
    console.log(`    ${item.id} [${item.properties.join(', ')}]`);
  }
  console.log(`  ${C.yellow}Au sol:${C.reset}`);
  for (const item of scene.locationItems) {
    console.log(`    ${item.id} [${item.properties.join(', ')}]`);
  }
  console.log();
}

function printResult(result: ReturnType<typeof parseAction>, scene: SceneContext, stats: StatBlock, difficulty: DifficultyLevel): void {
  if (isReformulation(result)) {
    console.log(`\n${C.yellow}${C.bold}⚠ Reformulation nécessaire${C.reset}`);
    console.log(`${C.yellow}  ${result.prompt}${C.reset}`);
    console.log(`${C.dim}  Interprétations possibles:${C.reset}`);
    for (let i = 0; i < result.interpretations.length; i++) {
      const interp = result.interpretations[i];
      if (interp) {
        const targetStr = interp.target ? ` → ${interp.target.id}` : '';
        console.log(`    ${C.cyan}${i + 1}.${C.reset} ${interp.verb}${targetStr}`);
      }
    }
    console.log();
    return;
  }

  // Parsed action
  const action = result;
  const isAuto = AUTO_VERBS.has(action.verb);

  console.log(`\n${C.green}${C.bold}✓ Action analysée${C.reset}`);
  console.log(`  ${C.bold}Verbe:${C.reset}  ${C.green}${action.verb}${C.reset} (${t(VERB_REGISTRY[action.verb].nameKey)})`);

  if (action.target) {
    const virtualTag = action.target.isVirtual ? ` ${C.magenta}[virtuel]${C.reset}` : '';
    console.log(`  ${C.bold}Cible:${C.reset}  ${C.cyan}${action.target.id}${C.reset} (source: ${action.target.source})${virtualTag}`);
    if (DEBUG) {
      console.log(`  ${C.dim}  Props: [${action.target.properties.join(', ')}]${C.reset}`);
    }
  } else {
    console.log(`  ${C.bold}Cible:${C.reset}  ${C.dim}(aucune — intransitif)${C.reset}`);
  }

  if (action.creative) {
    console.log(`  ${C.magenta}★ Action créative !${C.reset}`);
  }

  // Difficulty
  if (isAuto) {
    console.log(`  ${C.bold}DC:${C.reset}     ${C.green}AUTO (pas de jet nécessaire)${C.reset}`);
  } else {
    const diff = calculateDifficulty({
      verb: action.verb,
      target: action.target,
      tool: action.tool,
      playerStats: stats,
      difficultyLevel: difficulty,
      creative: action.creative,
      environmentConditions: scene.environmentConditions,
    });

    const dcColor = diff.total <= 8 ? C.green : diff.total <= 14 ? C.yellow : C.red;
    console.log(`  ${C.bold}DC:${C.reset}     ${dcColor}${diff.total}${C.reset}`);

    if (DEBUG) {
      console.log(`  ${C.dim}Détails:`);
      for (const d of diff.details) {
        console.log(`    ${d}`);
      }
      console.log(C.reset);
    }
  }

  // Debug info
  if (DEBUG) {
    console.log(`  ${C.dim}── Debug ──${C.reset}`);
    console.log(`  ${C.dim}Stratégie: ${action.verbMatch.strategy} (${strategyName(action.verbMatch.strategy)})${C.reset}`);
    console.log(`  ${C.dim}Confiance: ${(action.verbMatch.confidence * 100).toFixed(0)}%${C.reset}`);
    console.log(`  ${C.dim}Composé: ${action.verbMatch.isCompound}${C.reset}`);
    if (action.verbMatch.compoundTokens) {
      console.log(`  ${C.dim}Tokens composés: [${action.verbMatch.compoundTokens.join(', ')}]${C.reset}`);
    }
    console.log(`  ${C.dim}Tokens: [${action.tokens.join(', ')}]${C.reset}`);
  }

  console.log();
}

function strategyName(s: number): string {
  switch (s) {
    case 1: return 'alias exact';
    case 2: return 'forme conjuguée';
    case 3: return 'radical Snowball';
    case 4: return 'préfixe 4+ cars';
    case 5: return 'motif composé';
    case 6: return 'sémantique';
    default: return `inconnu (${s})`;
  }
}

// === MAIN REPL ===

function main(): void {
  printBanner();

  let scene = CHAOS ? buildChaosScene() : buildDefaultScene();
  const stats: StatBlock = GOD_MODE
    ? { FOR: 5, DEF: 5, AGI: 5, INT: 5, PER: 5, CHA: 5, LCK: 5 }
    : { FOR: 4, DEF: 3, AGI: 3, INT: 3, PER: 3, CHA: 2, LCK: 3 };
  const difficulty: DifficultyLevel = 'survivor';

  printScene(scene);
  printHelp();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${C.bold}${C.magenta}> ${C.reset}`,
  });

  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    // Special commands
    if (input.startsWith('/')) {
      const cmd = input.toLowerCase();
      switch (cmd) {
        case '/help':
          printHelp();
          break;
        case '/scene':
          printScene(scene);
          break;
        case '/verbs':
          printVerbs();
          break;
        case '/items':
          printItems(scene);
          break;
        case '/parts':
          printBodyParts(scene);
          break;
        case '/quit':
        case '/exit':
        case '/q':
          console.log(`\n${C.dim}Au revoir, astronaute.${C.reset}\n`);
          rl.close();
          process.exit(0);
          return;
        default:
          console.log(`${C.red}Commande inconnue: ${cmd}${C.reset}`);
          console.log(`${C.dim}Tapez /help pour la liste des commandes${C.reset}`);
      }
      rl.prompt();
      return;
    }

    // Chaos mode: randomize scene each turn
    if (CHAOS) {
      scene = buildChaosScene();
    }

    // Parse the action
    const start = performance.now();
    const result = parseAction(input, scene, localeData);
    const elapsed = performance.now() - start;

    printResult(result, scene, stats, difficulty);

    if (DEBUG) {
      console.log(`${C.dim}  Parse time: ${elapsed.toFixed(1)}ms${C.reset}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(`\n${C.dim}Session terminée.${C.reset}\n`);
    process.exit(0);
  });
}

main();
