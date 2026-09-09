// ---------------------------------------------------------------------------
// tests/unit/orphanExports.test.ts — guards against write-only data
// ---------------------------------------------------------------------------
// Audit motif 1: a registry is authored, a type is declared, a locale string is
// translated — and nothing ever reads it. No test failed, because orphan data
// breaks nothing. This test makes that failure mode visible and ratcheted.
//
// KNOWN_ORPHANS may only ever shrink. Adding an entry requires a reason.
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const SCAN_DIRS = ['src/content', 'src/engine', 'src/narration'];
// Production code only: a test or a script importing a registry does not prove
// the game uses it.
const SEARCH_DIRS = ['src'];

/**
 * Exports with no consumer anywhere in `src/`. The list may only ever shrink.
 * Each group names the audit decision that will resolve it.
 */
const KNOWN_ORPHANS: Readonly<Record<string, string>> = {
  // --- Decision C, slice 1: state axes, consumed by slices C2 and C3. The
  // stale-entry test below forces these lines to be removed once wired.
  STATE_IDS: 'C — scaffolding, wired in C2',
  makeEntityState: 'C — scaffolding, wired in C2',
  matchesState: 'C — scaffolding, wired in C3',
  resistsOpening: 'C — scaffolding, wired in C3',

  // --- Durability: the whole Phase 3 module (deliverables 4-6) is never called.
  // Items never break on a fumble, improvised weapons never degrade, and the
  // Engineer repair passive is unreachable.
  breakItem: 'durability never wired into processTurn',
  repairItem: 'durability never wired into processTurn',
  canRepairItem: 'durability never wired into processTurn',
  getRepairDC: 'durability never wired into processTurn',
  checkItemBreakage: 'durability never wired into processTurn',
  createItemDurabilityState: 'durability never wired into processTurn',
  incrementCombatUses: 'durability never wired into processTurn',

  // --- Inventory: processTurn mutates state inline instead of using these.
  equipItem: 'processTurn edits inventory inline',
  unequipItem: 'processTurn edits inventory inline',
  applyInventoryToState: 'processTurn edits inventory inline',

  // --- Combat: ambush bonus and creature learning (Phase 6 §6.6) never invoked.
  calculateAmbushBonus: 'combat: ambush bonus never applied',
  onCreatureWounded: 'combat: creature learning never invoked',
  shouldNPCAttack: 'combat: aggression patterns never consulted',

  // --- Weak points (Phase 3 deliverable 9). These were wired ONLY in the
  // unrouted playtest hooks deleted under decision R, so in the shipped game a
  // weak point can never be discovered and its damage multiplier never applies.
  // Re-wire in lot 3, alongside the combat rework of decision S.
  canDiscoverWeakPoint: 'P3 #9 — weak point discovery only ever lived in dead code',
  checkWeakPointAutoDiscover: 'P3 #9 — round-3 auto-discovery only ever lived in dead code',
  shouldShowWeakPointHint: 'P3 #9 — weak point hinting only ever lived in dead code',

  // --- Scene/class helpers whose only consumers were the deleted playtest screens.
  CLASS_LIST: 'only consumed by the deleted playtest screens',
  generateSituation: 'only consumed by the deleted playtest screens',
  // Synthetic scene scaffolding: production builds scenes from the assembled
  // scenario via getSceneContext, so these are test-only fixtures.
  buildDefaultScene: 'test-only scene fixture',

  // --- Black Box (Phase 6 §7): journals are never generated or placed.
  generateBlackBoxJournal: 'black box never generated in production',
  shouldPlaceBlackBox: 'black box never placed in production',

  // --- Micro-modules: placement helpers unused by the turn loop.
  getMicroModuleNodeId: 'micro-modules: helper never called',
  getMicroModulesAtParent: 'micro-modules: helper never called',
  revealHiddenMicroModule: 'micro-modules: perception reveal never called',

  // --- Narration location state: the atmosphere cooldown reset on environment
  // change is specified as LOCKED in Phase 5 §8 and never triggered.
  resetComposer: 'narration: location state reset never called',
  resetComposerForSetting: 'narration: location state reset never called',
  resetAllLocationStates: 'narration: location state reset never called',
  resetLocationState: 'narration: location state reset never called',
  resetLocationOnEnvironmentChange: 'narration: cooldown reset on env change never called',
  resetEntryCounter: 'narration: entry counter reset never called',
  resetHintMemory: 'narration: hint memory reset never called',
  adjustHintPriority: 'narration: hint priority never adjusted',
  renderTemplateWithSlots: 'narration: alternate renderer unused',

  // --- Ship memory: Phase 4 deliverable 7 (targets gain/lose properties).
  getMarkPropertyChanges: 'P4 #7 — mark property changes never applied',

  // --- Decision U: consequences must become the only channel for world change.
  markFeatureChanged: 'U — consequences must be the only channel for world change',

  // --- Decision W: secret verb content written, mechanic never built (P5-1).
  SECRET_VERB_TEMPLATES: 'W — wire secret verbs into the verb registry',

  // --- Decision H: character creation lives in the UI store, not the engine.
  validateAllocation: 'H — move bonus allocation into initGame',
  createCharacterCreationState: 'H — move bonus allocation into initGame',

  // --- Assorted engine helpers with no caller.
  getConditionRollModifier: 'conditions: roll modifier never applied',
  resetStalkerClock: 'stalker clock never reset on node progression',
  useOxygenCanister: 'oxygen: canister use never wired',
  hasBeenVisited: 'backtracking helper unused',
  isFeatureChanged: 'backtracking helper unused',
  isExitUnlocked: 'backtracking helper unused',
  categorizeExits: 'backtracking helper unused',
  isExcludedFromSuggestions: 'suggestions helper unused',
  sceneHasHealingItem: 'scene helper unused',
  getFeatureDescription: 'feature description helper unused',
  buildCustomScene: 'scene builder helper unused',
  generateSituationOfType: 'situation generator helper unused',
  getScenarioNameFr: 'scenario naming helper unused',

  // --- Runtime value lists mirroring a union type, used only by tests.
  STAT_IDS: 'runtime mirror of a union type, test-only',
  ITEM_TYPES: 'runtime mirror of a union type, test-only',
  NPC_TYPES: 'runtime mirror of a union type, test-only',
  CONDITION_IDS: 'runtime mirror of a union type, test-only',
  DIFFICULTY_LEVELS: 'runtime mirror of a union type, test-only',
  PLAYER_CLASS_NAMES: 'runtime mirror of a union type, test-only',
  ENVIRONMENT_FEATURE_TYPES: 'runtime mirror of a union type, test-only',
  // Nothing displays property names, which is why the 4 missing i18n keys of
  // audit finding P1-4 went unnoticed.
  PROPERTY_REGISTRY: 'P1-4 — property metadata never displayed',
};

// ---------------------------------------------------------------------------

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

// Only data and behaviour. An exported type with no external consumer is
// harmless; an exported registry with none is the failure mode we are hunting.
const EXPORT_RE = /^export\s+(?:const|function)\s+([A-Za-z_][A-Za-z0-9_]*)/gm;

interface ExportedSymbol {
  readonly name: string;
  readonly file: string;
}

function collectExports(): ExportedSymbol[] {
  const symbols: ExportedSymbol[] = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      // Barrel files re-export everything; they prove nothing about consumption.
      if (file.endsWith('index.ts')) continue;
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(EXPORT_RE)) {
        symbols.push({ name: match[1]!, file: relative(ROOT, file).replace(/\\/g, '/') });
      }
    }
  }
  return symbols;
}

/** `export { X } from './x'` forwards a symbol without using it. */
const RE_EXPORT_RE = /export\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"]\s*;?/g;

function collectSearchCorpus(): Map<string, string> {
  const corpus = new Map<string, string>();
  for (const dir of SEARCH_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const source = readFileSync(file, 'utf8').replace(RE_EXPORT_RE, '');
      corpus.set(relative(ROOT, file).replace(/\\/g, '/'), source);
    }
  }
  return corpus;
}

const exportedSymbols = collectExports();
const corpus = collectSearchCorpus();

/**
 * A symbol is an orphan when its identifier appears nowhere beyond its own
 * declaration — not in another file, not even in the file that declares it.
 * Being used only internally is a needless export, not write-only data.
 */
function isConsumed(symbol: ExportedSymbol): boolean {
  const identifier = new RegExp(`\\b${symbol.name}\\b`, 'g');
  for (const [path, source] of corpus) {
    const occurrences = source.match(identifier)?.length ?? 0;
    const threshold = path === symbol.file ? 1 : 0;
    if (occurrences > threshold) return true;
  }
  return false;
}

describe('orphan exports', () => {
  const orphans = exportedSymbols
    .filter(s => !isConsumed(s))
    .map(s => s.name)
    .filter((name, i, all) => all.indexOf(name) === i)
    .sort();

  test('no export is written without a consumer, beyond the known list', () => {
    const unexpected = orphans.filter(name => !(name in KNOWN_ORPHANS));
    expect(
      unexpected,
      `New orphan export(s). Either wire them up or add them to KNOWN_ORPHANS with a reason:\n  ${unexpected.join('\n  ')}`,
    ).toEqual([]);
  });

  test('the known-orphan list has no stale entries', () => {
    const stale = Object.keys(KNOWN_ORPHANS).filter(name => !orphans.includes(name));
    expect(
      stale,
      `These are no longer orphans — remove them from KNOWN_ORPHANS:\n  ${stale.join('\n  ')}`,
    ).toEqual([]);
  });
});
