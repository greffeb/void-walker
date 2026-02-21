// ---------------------------------------------------------------------------
// src/engine/types.ts — Core type definitions for Void Walker
// ---------------------------------------------------------------------------
// This file is the contract for all subsequent phases.
// All game types and interfaces are defined here.
// ---------------------------------------------------------------------------

// === STAT SYSTEM ===

/** The 6 character stats */
export type StatId = 'FOR' | 'AGI' | 'INT' | 'PER' | 'CHA' | 'LCK';

/** All valid stat IDs as a runtime array */
export const STAT_IDS: readonly StatId[] = [
  'FOR', 'AGI', 'INT', 'PER', 'CHA', 'LCK',
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

/** A passive ability granted by the player's class */
export interface PassiveAbility {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
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
