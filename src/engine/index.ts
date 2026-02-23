// src/engine/index.ts — Public API
// Phase 2: Parser, resolver, and difficulty
// Phase 3: Dice, combat, conditions, oxygen, stalker clock, durability, loot

// === Phase 2 ===
export { parseAction, normalizeInput, matchVerb } from './parser';
export type { CompoundPattern } from './parser';
export { resolveTarget, resolveBodyPart, BODY_PARTS } from './resolver';
export { calculateDifficulty, detectCreativity } from './difficulty';
export { stemFr } from './snowball-fr';
export { checkCompatibility } from './compatibility';

// === Phase 3: Dice ===
export {
  rollD20, rollLuckBonus, rollCheck, classifyOutcome,
  rollDodge, rollPassiveDodge, defaultRng,
} from './dice';

// === Phase 3: Combat ===
export {
  calculateBaseDamage, resolvePlayerAttack,
  calculateAmbushBonus, calculateBerserkBonus,
  shouldNPCAttack, resolveNPCAttack,
  attemptFlee, attemptRetreat, isExploitVerb,
  checkWeakPointAutoDiscover, shouldShowWeakPointHint, canDiscoverWeakPoint,
} from './combat';

// === Phase 3: Conditions ===
export {
  CONDITION_DEFINITIONS,
  applyConditionMalus, getConditionRollModifier,
  tickConditions, checkConditionTriggers,
  addCondition, removeCondition,
} from './conditions';

// === Phase 3: Oxygen ===
export { getDrainRate, tickOxygen, useOxygenCanister } from './oxygen';

// === Phase 3: Stalker Clock ===
export {
  tickStalkerClock, resetStalkerClock,
  checkStalkerClock, applyStalkerEvent,
} from './stalkerClock';

// === Phase 3: Durability ===
export {
  checkItemBreakage, canRepairItem, getRepairDC,
  breakItem, incrementCombatUses, createItemDurabilityState, repairItem,
} from './durability';

// === Phase 3: Loot ===
export {
  checkBonusLoot, pickFromLootTable,
  COMBAT_LOOT_TABLE, SEARCH_LOOT_TABLE,
} from './loot';

// === Types ===
export type {
  // Phase 2
  ParseResult, ParsedAction, Reformulation,
  ResolvedTarget, VerbMatch, VerbMatchStrategy, TargetSource,
  DifficultyBreakdown, DifficultyInput,
  SceneContext, NpcInstance, EnvironmentFeatureInstance,
  BodyPartDefinition, EnvironmentCondition,
  // Phase 3
  RngFn, RollOutcome,
  WeakPoint, CombatNPCState, PlayerAttackResult, NPCAttackResult, FleeResult, RetreatResult,
  ConditionId, ConditionDefinition, ActiveCondition,
  AtmosphereType,
  StalkerEventType, StalkerEvent, StalkerClockState,
  ItemDurabilityState,
  LootDrop, LootTableEntry,
  // Action history
  ActionRecord,
} from './types';
export { isReformulation, CONDITION_IDS } from './types';
