// ---------------------------------------------------------------------------
// src/engine/types.ts — Core type definitions for Void Walker
// ---------------------------------------------------------------------------
// This file is the contract for all subsequent phases.
// All game types and interfaces are defined here.
// ---------------------------------------------------------------------------

import { BALANCE } from './constants';

// === STAT SYSTEM ===

/** The 7 character stats */
export type StatId = 'FOR' | 'DEF' | 'AGI' | 'INT' | 'PER' | 'CHA' | 'LCK';

/** All valid stat IDs as a runtime array */
export const STAT_IDS: readonly StatId[] = [
  'FOR', 'DEF', 'AGI', 'INT', 'PER', 'CHA', 'LCK',
] as const;

/** A stat block mapping each stat to its numeric value (0–5) */
export type StatBlock = Readonly<Record<StatId, number>>;

// === PLAYER CLASS ===

/** The 3 player classes */
export type PlayerClassName = 'marine' | 'engineer' | 'medic';

/** All valid player class names as a runtime array */
export const PLAYER_CLASS_NAMES: readonly PlayerClassName[] = [
  'marine', 'engineer', 'medic',
] as const;

/** Passive ability effect identifiers */
export type PassiveEffectId = 'COMBAT_DAMAGE_BONUS' | 'REPAIR_ALL_BROKEN' | 'HEALING_BONUS';

/** A passive ability granted by the player's class */
export interface PassiveAbility {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly effect: PassiveEffectId;
  readonly value: number | null;
}

/** Full definition of a player class */
export interface PlayerClass {
  readonly id: PlayerClassName;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly flavorKey: string;
  readonly baseStats: StatBlock;
  readonly startingHp: number;
  readonly startingItems: readonly string[];
  readonly passiveAbility: PassiveAbility;
}

// === DIFFICULTY ===

/** The 3 difficulty presets */
export type DifficultyLevel = 'explorer' | 'survivor' | 'nightmare';

/** All valid difficulty levels as a runtime array */
export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  'explorer', 'survivor', 'nightmare',
] as const;

/** Per-difficulty tuning values */
export interface DifficultySettings {
  readonly level: DifficultyLevel;
  readonly labelKey: string;
  readonly descriptionKey: string;
  /** Modifier applied to base difficulty of all checks */
  readonly difficultyModifier: number;
  /** HP multiplier for the player */
  readonly hpMultiplier: number;
  /** Whether permadeath is enabled */
  readonly permadeath: boolean;
  /** Stalker clock thresholds */
  readonly stalkerClock: {
    readonly warning: number;
    readonly threat: number;
    readonly kill: number;
  };
}

// === CHARACTER STATE ===

/** The player character's current state */
export interface CharacterState {
  readonly name: string;
  readonly className: PlayerClassName;
  readonly stats: StatBlock;
  readonly hp: number;
  readonly maxHp: number;
  readonly oxygen: number;
  readonly inventory: readonly string[];
  readonly equippedWeapon: string | null;
  readonly equippedArmor: string | null;
  readonly conditions: readonly string[];
}

// === GAME STATE ===

/** Story beat progression */
export type StoryBeat =
  | 'intro'
  | 'rising'
  | 'midpoint'
  | 'escalation'
  | 'climax'
  | 'resolution';

/** High-level game phase */
export type GamePhase =
  | 'title'
  | 'character_creation'
  | 'playing'
  | 'combat'
  | 'victory'
  | 'defeat';

/** The complete game state — single source of truth, fully immutable */
export interface GameState {
  readonly phase: GamePhase;
  readonly difficulty: DifficultyLevel;
  readonly character: CharacterState | null;
  readonly turn: number;
  readonly scenarioId: string | null;
  readonly currentBeat: StoryBeat;
  readonly stalkerClock: number;
  readonly sceneCount: number;
  readonly log: readonly string[];
  readonly actionHistory: readonly ActionRecord[];
}

/** Structured record of a single player action (for history & bug reports) */
export interface ActionRecord {
  readonly input: string;
  readonly parsedVerb: string | null;
  readonly targetId: string | null;
  readonly diceResult: DiceResult | null;
  readonly outcome: string;
  readonly timestamp: number;
}

/** Factory for a blank initial game state */
export function createInitialGameState(): GameState {
  return {
    phase: 'title',
    difficulty: 'survivor',
    character: null,
    turn: 0,
    scenarioId: null,
    currentBeat: 'intro',
    stalkerClock: 0,
    sceneCount: 0,
    log: [],
    actionHistory: [],
  };
}

// === TURN RESULT ===

/** The result of processing a single player turn */
export interface TurnResult {
  readonly newState: GameState;
  readonly narrative: string;
  readonly diceRoll: DiceResult | null;
  readonly suggestions: readonly string[];
}

/** Result of a single dice roll */
export interface DiceResult {
  readonly natural: number;
  readonly stat: StatId;
  readonly statValue: number;
  readonly luckBonus: number;
  readonly modifier: number;
  readonly total: number;
  readonly difficulty: number;
  readonly success: boolean;
  readonly critical: boolean;
  readonly fumble: boolean;
}

// === ITEM TYPES ===

/** Item archetype categories for property inheritance */
export type ItemType = 'tool' | 'weapon' | 'consumable' | 'key_item' | 'data' | 'misc';

/** All valid item types as a runtime array */
export const ITEM_TYPES: readonly ItemType[] = [
  'tool', 'weapon', 'consumable', 'key_item', 'data', 'misc',
] as const;

// === NPC TYPES ===

/** NPC archetype categories for property inheritance */
export type NPCType = 'human' | 'android' | 'robot' | 'creature' | 'corpse' | 'wreck';

/** All valid NPC types as a runtime array */
export const NPC_TYPES: readonly NPCType[] = [
  'human', 'android', 'robot', 'creature', 'corpse', 'wreck',
] as const;

/** NPC behavior patterns in combat */
export type AggressionPattern =
  | 'aggressive'
  | 'defensive'
  | 'ambush'
  | 'retreating'
  | 'berserk';

// === ENVIRONMENT FEATURE TYPES ===

/** Environment feature categories for property inheritance */
export type EnvironmentFeatureType =
  | 'door'
  | 'window'
  | 'terminal'
  | 'vent'
  | 'pipe'
  | 'panel'
  | 'camera'
  | 'airlock'
  | 'container'
  | 'wiring';

/** All valid environment feature types as a runtime array */
export const ENVIRONMENT_FEATURE_TYPES: readonly EnvironmentFeatureType[] = [
  'door', 'window', 'terminal', 'vent', 'pipe',
  'panel', 'camera', 'airlock', 'container', 'wiring',
] as const;

// === CHARACTER CREATION ===

/** State of the character creation process */
export interface CharacterCreationState {
  readonly selectedClass: PlayerClassName | null;
  readonly bonusPointsRemaining: number;
  readonly bonusAllocation: Readonly<Partial<Record<StatId, number>>>;
}

/** Factory for initial character creation state */
export function createCharacterCreationState(): CharacterCreationState {
  return {
    selectedClass: null,
    bonusPointsRemaining: BALANCE.BONUS_POINTS,
    bonusAllocation: {},
  };
}

/**
 * Validates a bonus point allocation against class base stats.
 * Total bonus must equal BALANCE.BONUS_POINTS (2), no negative values,
 * no final stat may exceed BALANCE.STAT_MAX (5).
 */
export function validateAllocation(
  classStats: StatBlock,
  bonus: Readonly<Partial<Record<StatId, number>>>,
): boolean {
  const totalBonus = Object.values(bonus).reduce<number>((a, b) => a + (b ?? 0), 0);
  if (totalBonus !== BALANCE.BONUS_POINTS) return false;
  for (const [stat, bonusVal] of Object.entries(bonus)) {
    if (bonusVal === undefined || bonusVal < 0) return false;
    const base = classStats[stat as StatId];
    if (base === undefined) return false;
    if (base + bonusVal > BALANCE.STAT_MAX) return false;
  }
  return true;
}

/** Result of completing character creation */
export interface PlayerCreationResult {
  readonly name: string;
  readonly classId: PlayerClassName;
  readonly stats: StatBlock;
  readonly maxHp: number;
  readonly hp: number;
  readonly inventory: readonly string[];
}

// === PARSER TYPES (Phase 2) ===

/** Where a resolved target was found */
export type TargetSource =
  | 'inventory'
  | 'location'
  | 'npc'
  | 'npc_part'
  | 'environment'
  | 'connected_location'
  | 'abstract';

/** A resolved target entity with its properties */
export interface ResolvedTarget {
  readonly id: string;
  readonly nameKey: string;
  readonly properties: readonly import('./properties').PropertyId[];
  readonly isVirtual: boolean;
  readonly source: TargetSource;
  readonly aliases?: readonly string[];
}

/** Which verb-matching strategy was used (1 = highest priority) */
export type VerbMatchStrategy = 1 | 2 | 3 | 4 | 5 | 6;

/** Result of verb matching in the parser */
export interface VerbMatch {
  readonly verb: import('./verbs').VerbId;
  readonly strategy: VerbMatchStrategy;
  readonly confidence: number;
  readonly isCompound: boolean;
  readonly compoundTokens?: readonly string[];
}

/** A fully parsed player action */
export interface ParsedAction {
  readonly verb: import('./verbs').VerbId;
  readonly target: ResolvedTarget | null;
  readonly tool: ResolvedTarget | null;
  readonly rawInput: string;
  readonly tokens: readonly string[];
  readonly verbMatch: VerbMatch;
  readonly creative: boolean;
}

/** An alternative interpretation offered when input is ambiguous */
export interface Reformulation {
  readonly type: 'reformulation';
  readonly rawInput: string;
  readonly interpretations: readonly ParsedAction[];
  readonly prompt: string;
}

/** Type guard: is the parse result a reformulation? */
export function isReformulation(result: ParseResult): result is Reformulation {
  return (result as Reformulation).type === 'reformulation';
}

/** The result of parsing player input: either a clear action or a reformulation */
export type ParseResult = ParsedAction | Reformulation;

/** Breakdown of how difficulty was calculated */
export interface DifficultyBreakdown {
  readonly base: number;
  readonly verbMod: number;
  readonly compatibilityPenalty: number;
  readonly contextMods: number;
  readonly creativityMod: number;
  readonly difficultyPresetMod: number;
  readonly total: number;
  readonly details: readonly string[];
}

/** Input to the difficulty calculator */
export interface DifficultyInput {
  readonly verb: import('./verbs').VerbId;
  readonly target: ResolvedTarget | null;
  readonly tool: ResolvedTarget | null;
  readonly playerStats: StatBlock;
  readonly difficultyLevel: DifficultyLevel;
  readonly creative: boolean;
  readonly environmentConditions?: readonly EnvironmentCondition[];
  readonly playerConditions?: readonly string[];
  readonly suggestions?: readonly ParsedAction[];
}

/** Environmental conditions that affect difficulty */
export type EnvironmentCondition = 'dark' | 'zero_g' | 'time_pressure';

/** Instance of an NPC in a scene (for the resolver) */
export interface NpcInstance {
  readonly id: string;
  readonly definitionId: string;
  readonly nameKey: string;
  readonly aliases: readonly string[];
  readonly properties: readonly import('./properties').PropertyId[];
  readonly hp: number;
  readonly bodyParts?: readonly BodyPartDefinition[];
}

/** A body part that can be targeted on an NPC */
export interface BodyPartDefinition {
  readonly id: string;
  readonly nameKey: string;
  readonly aliases: readonly string[];
  readonly baseProperties: readonly import('./properties').PropertyId[];
}

/** Instance of an environment feature in a scene (for the resolver) */
export interface EnvironmentFeatureInstance {
  readonly id: string;
  readonly definitionId: string;
  readonly nameKey: string;
  readonly aliases: readonly string[];
  readonly properties: readonly import('./properties').PropertyId[];
}

/** Lightweight view of the current scene for the parser/resolver */
export interface SceneContext {
  readonly inventory: readonly ResolvedTarget[];
  readonly locationItems: readonly ResolvedTarget[];
  readonly npcs: readonly NpcInstance[];
  readonly environmentFeatures: readonly EnvironmentFeatureInstance[];
  readonly connectedLocations: readonly { readonly id: string; readonly aliases: readonly string[] }[];
  readonly suggestions: readonly ParsedAction[];
  readonly environmentConditions: readonly EnvironmentCondition[];
  /** Body part definitions with locale-aware aliases (injected by content layer) */
  readonly bodyParts?: readonly BodyPartDefinition[];
}

// === PHASE 3: RESOLUTION & COMBAT TYPES ===

/** Injectable random number generator for testability. Returns [0, 1). */
export type RngFn = () => number;

/** Classified outcome of a dice roll */
export type RollOutcome = 'crit_success' | 'success' | 'failure' | 'crit_failure';

// === COMBAT TYPES ===

/** Weak point on an NPC */
export interface WeakPoint {
  readonly id: string;
  readonly nameKey: string;
  readonly discoverMethod: 'examine' | 'scan' | 'combat_hint' | 'lore';
  readonly targetVerbs: readonly import('./verbs').VerbId[];
  readonly targetProperties: readonly import('./properties').PropertyId[];
  readonly damageMultiplier: number;
  readonly hintKey: string;
  readonly exploitKey: string;
}

/** Runtime combat state for an NPC in an encounter */
export interface CombatNPCState {
  readonly definitionId: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly attack: number;
  readonly defense: number;
  readonly dodgeChance: number;
  readonly fleeDC: number;
  readonly aggressionPattern: AggressionPattern;
  readonly weakPoint: WeakPoint | null;
  readonly weakPointDiscovered: boolean;
  readonly combatRound: number;
}

/** Result of a player attacking an NPC */
export interface PlayerAttackResult {
  readonly hit: boolean;
  readonly npcDodged: boolean;
  readonly damageDealt: number;
  readonly weakPointHit: boolean;
  readonly npcKilled: boolean;
  readonly critical: boolean;
  readonly itemBroke: boolean;
  readonly bonusLoot: LootDrop | null;
}

/** Result of an NPC attacking the player */
export interface NPCAttackResult {
  readonly hit: boolean;
  readonly dodged: boolean;
  readonly damageDealt: number;
  readonly berserkBonus: number;
}

/** Result of attempting to flee combat */
export interface FleeResult {
  readonly success: boolean;
  readonly roll: DiceResult;
  readonly npcFreeAttack: NPCAttackResult | null;
}

/** Result of attempting a partial retreat (back off without ending combat) */
export interface RetreatResult {
  readonly success: boolean;
  readonly roll: DiceResult;
}

// === CONDITION TYPES ===

/** Condition identifiers */
export type ConditionId = 'wounded' | 'terrified' | 'cold' | 'poisoned' | 'exhausted';

/** All valid condition IDs as a runtime array */
export const CONDITION_IDS: readonly ConditionId[] = [
  'wounded', 'terrified', 'cold', 'poisoned', 'exhausted',
] as const;

/** A condition definition (static data) */
export interface ConditionDefinition {
  readonly id: ConditionId;
  readonly nameKey: string;
  readonly statMalus: Readonly<Partial<Record<StatId, number>>>;
  readonly hpDrainPerAction: number;
  readonly specialEffect: string | null;
  readonly durationType: 'permanent_until_cured' | 'timed';
  readonly durationActions?: number;
  readonly cureMethod: string;
}

/** Active condition on a player (runtime) */
export interface ActiveCondition {
  readonly id: ConditionId;
  readonly remainingActions: number | null;
}

// === OXYGEN TYPES ===

/** Atmosphere type for zones */
export type AtmosphereType = 'pressurized' | 'low_oxygen' | 'depressurized' | 'toxic_atmosphere';

// === STALKER CLOCK TYPES ===

/** Stalker clock event type */
export type StalkerEventType = 'warning' | 'threat_arrival' | 'kill';

/** A stalker clock event */
export interface StalkerEvent {
  readonly type: StalkerEventType;
}

/** Stalker clock state */
export interface StalkerClockState {
  readonly actionsSinceLastProgression: number;
  readonly warningIssued: boolean;
  readonly threatArrivalIssued: boolean;
}

// === DURABILITY TYPES ===

/** Item durability state (runtime per-item) */
export interface ItemDurabilityState {
  readonly broken: boolean;
  readonly combatUses: number;
}

// === LOOT TYPES ===

/** Loot drop from bonus loot on nat 20 */
export interface LootDrop {
  readonly itemId: string;
  readonly source: 'combat' | 'search' | 'skill_check';
  readonly isBonus: boolean;
}

/** Loot table entry */
export interface LootTableEntry {
  readonly itemId: string;
  readonly weight: number;
}
