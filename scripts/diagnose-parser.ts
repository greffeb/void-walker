#!/usr/bin/env tsx
// Diagnostic: test parser resolution for feature interaction commands

import { initGame } from '../src/engine/game';
import { getSceneContext } from '../src/engine/scene';
import { parseAction } from '../src/engine/parser';
import { buildParserLocaleData } from '../src/content/parserData';
import { assembleScenario } from '../src/engine/pacing';
import { ESCAPE_SKELETON } from '../src/content/scenarios/index';

import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { isReformulation } from '../src/engine/types';

const parserData = buildParserLocaleData('fr');
const rng = () => 0.5;
const scenario = assembleScenario(ESCAPE_SKELETON, 'quick', ALL_MODULES, rng);
const state = initGame(scenario, 'marine', 'survivor', 'TestPlayer', rng);
const ctx = getSceneContext(state);

// Show what the parser knows about targets
console.log('=== AVAILABLE TARGETS IN SCENE CONTEXT ===');
console.log('\nItems:');
for (const item of ctx.locationItems) {
  console.log(`  ${item.id}: nameKey=${item.nameKey}, aliases=[${item.aliases.join(', ')}]`);
}
console.log('\nFeatures:');
for (const feat of ctx.environmentFeatures) {
  console.log(`  ${feat.id}: nameKey=${feat.nameKey}, aliases=[${feat.aliases?.join(', ') ?? 'none'}]`);
}
console.log('\nConnected locations:');
for (const loc of ctx.connectedLocations) {
  console.log(`  ${loc.id}: aliases=[${loc.aliases.join(', ')}]`);
}

// Test various commands
const tests = [
  'ouvrir casier de secours',
  'ouvrir casier',
  'examiner casier',
  'ouvrir emergency_locker',
  'examiner terminal',
  'examiner terminal de statut',
  'utiliser scanner sur terminal',
  'activer cryopod',
  'activer pod',
];

console.log('\n=== PARSER RESOLUTION TESTS ===');
for (const input of tests) {
  const result = parseAction(input, ctx, parserData);
  if (isReformulation(result)) {
    console.log(`"${input}" => REFORMULATION: "${result.prompt}"`);
  } else {
    console.log(`"${input}" => verb=${result.verb} target=${result.target?.id ?? 'null'} source=${result.target?.source ?? 'null'} strategy=${result.verbMatch.strategy}`);
  }
}
