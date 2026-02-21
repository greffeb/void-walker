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
