// src/engine/index.ts — Public API
// Phase 2: Parser, resolver, and difficulty
// Phase 3: Dice, combat, conditions, oxygen, stalker clock, durability, loot
// Phase 4: Consequences, state, inventory, ship memory, failsafe, processTurn

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

// === Phase 4: State helpers ===
export { checkDeath, applyDeath, updateCharacterHp, clampHp } from './state';

// === Phase 4: Inventory ===
export {
  canAddItem, addItem, removeItem,
  equipItem, unequipItem, applyInventoryToState,
} from './inventory';

// === Phase 4: Ship Memory ===
export {
  createMark, addMark, getMarksForTarget,
  getMarkDCModifier, getMarkPropertyChanges,
} from './shipMemory';

// === Phase 4: Failsafe ===
export {
  getObstacleKey, recordAttempt, resolveObstacle,
  checkFailsafe, getFailsafeDCReduction,
} from './failsafe';

// === Phase 4: Consequences ===
export { buildConsequences, applyConsequences } from './consequences';

// === Phase 4: processTurn ===
export { processTurn } from './processTurn';

// === Phase 6B: Game loop ===
export { initGame, isGameOver, buildVictoryCheckContext } from './game';
export { getSceneContext, formatSuggestionAsInput, sceneHasHealingItem } from './scene';
export { checkVictory, checkAdditionalDefeat, evaluateVictoryCondition } from './victory';
export {
  createThreatDirector, transitionBeat, threatCheck, generateEncounter,
  onCreatureWounded, onCreatureReturns,
} from './threat';
export {
  createVisitState, markRevisit, markItemTaken, markFeatureChanged,
  markObstacleResolved, hasBeenVisited, isItemAvailable, isFeatureChanged,
  isObstacleResolved, getExitsWithStatus, categorizeExits,
} from './backtracking';
export {
  generateSuggestions, scoreCandidate, selectTop3WithVariety,
  isExcludedFromSuggestions, CLASS_PRIMARY_STATS,
} from './suggestions';

// === Chantier 1: Feature/Item State Engine ===
export {
  getFeatureState, setFeatureState, getFeatureDescription,
  setScenarioFlag, unsetScenarioFlag, hasScenarioFlag,
  revealItem, isItemRevealed,
  unlockExit, isExitUnlocked,
} from './featureState';

export {
  resolveScenarioInteraction, resolveItemUseOn,
  NO_INTERACTION_MATCH,
} from './interactionResolver';
export type { InteractionResolution } from './interactionResolver';

export {
  isEnrichedFeature, isEnrichedItem,
} from './scenario';

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
  // Phase 4
  EnvironmentMark, EnvironmentMarkEffect,
  FailsafeType, FailsafeResult, ObstacleState,
  ConsequenceType, Consequence,
  DeathType, DeathResult,
  ActiveCombatState,
  TurnResult, TurnDebugTrace,
} from './types';
export { isReformulation, CONDITION_IDS } from './types';

// === Phase 6B types ===
export type { NpcState, VictoryCheckContext } from './victory';
export type { SuggestionCandidate } from './suggestions';
export type { ExitInfo } from './backtracking';
export type { ThreatCheckResult } from './threat';
export type {
  AssembledScenario, CoreSkeleton, ScenarioModule, PlacedModule,
  LocationGraph, LocationNode, LocationEdge, LocationVisitState,
  VictoryCondition, DefeatCondition, VictoryResult, VictoryType,
  ThreatDirectorState, ThreatEvent, ThreatBehavior,
  NarrativeSkin, ObstacleDefinition, ObstaclePath,
  BlackBoxEntry, GameHistory, KeyEvent, DangerHint,
  SettingDefinition, SessionLength, CoreNodeId,
  // Chantier 1
  FeatureState, ScenarioFeatureDefinition, ScenarioItemDefinition,
  ScenarioInteraction, InteractionTrigger, InteractionResult,
  ItemUseOnDefinition,
} from './scenario';
