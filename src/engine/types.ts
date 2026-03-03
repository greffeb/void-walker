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
  readonly conditions: readonly ActiveCondition[];
  /** Per-item durability tracking (broken state, combat uses) */
  readonly durability: Readonly<Record<string, ItemDurabilityState>>;
  /** Actions spent in cold/depressurized zone (for cold condition trigger) */
  readonly actionsInColdZone: number;
  /** Actions since last rest (for exhaustion condition trigger) */
  readonly actionsWithoutRest: number;
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
  /** Full stalker clock state (replaces the old `stalkerClock: number` field) */
  readonly stalkerClockState: StalkerClockState;
  readonly sceneCount: number;
  readonly log: readonly string[];
  readonly actionHistory: readonly ActionRecord[];
  // === Phase 4 additions ===
  /** Environment marks created by failed actions (Ship Memory) */
  readonly shipMemory: readonly EnvironmentMark[];
  /** Obstacle attempt tracking keyed by `${locationId}:${targetId}` */
  readonly obstacleAttempts: Readonly<Record<string, ObstacleState>>;
  /** Whether the player has used their one Survivor second chance */
  readonly secondChanceUsed: boolean;
  /** Currently active combat encounter, or null if not in combat */
  readonly activeCombat: ActiveCombatState | null;
  // === Phase 6B additions ===
  /** The fully assembled scenario for this game (null until game starts). */
  readonly scenario: import('./scenario').AssembledScenario | null;
  /** Per-location visit tracking (keys are LocationNode IDs). */
  readonly visitedLocations: Readonly<Record<string, import('./scenario').LocationVisitState>>;
  /** Per-NPC alive/location state (keys are NPC IDs). */
  readonly npcStates: Readonly<Record<string, import('./victory').NpcState>>;
  /** Object/feature IDs that have been activated (e.g. emergency_beacon). */
  readonly activatedObjects: readonly string[];
  /** Location IDs currently lethally hazardous. */
  readonly lethalLocations: readonly string[];
  /** Location IDs where ALL graph exits are currently sealed. */
  readonly fullyContainedLocations: readonly string[];
  /** Key objective IDs permanently destroyed. */
  readonly destroyedObjectives: readonly string[];
  /** Whether self-destruct has been activated and player is in a safe zone. */
  readonly selfDestructActive: boolean;
  /** The threat director state machine (persists across turns). */
  readonly threatDirectorState: import('./scenario').ThreatDirectorState;
  /** Victory result, set when checkVictory() returns non-null. */
  readonly victoryResult: import('./scenario').VictoryResult | null;
  /** Defeat condition that triggered game over, if any. */
  readonly defeatCondition: import('./scenario').DefeatCondition | null;
  /** Number of items used so far (for stress test reporting). */
  readonly itemsUsedCount: number;
  /** Total encounters triggered so far (for stress test reporting). */
  readonly encounterCount: number;
  /** Current location ID in the scenario graph (null before game starts). */
  readonly playerLocationId: string | null;
  // === Chantier 1 additions ===
  /** Per-feature mutable state. Key = featureId, value = current FeatureState.
   *  Initialized from each feature's `initialState` at game start. */
  readonly featureStates: Readonly<Record<string, string>>;
  /** Items revealed by container openings or other interactions.
   *  Key = itemId, value = true when revealed.
   *  Items WITHOUT `revealedBy` in their definition are always visible. */
  readonly revealedItems: Readonly<Record<string, boolean>>;
  /** Exits unlocked by interactions.
   *  Key = composite `${fromLocationId}:${toLocationId}`, value = true. */
  readonly unlockedExits: Readonly<Record<string, boolean>>;
  /** Scenario-wide flags set by interactions.
   *  Key = flag name (string), value = true when set. */
  readonly scenarioFlags: Readonly<Record<string, boolean>>;
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
    stalkerClockState: {
      actionsSinceLastProgression: 0,
      warningIssued: false,
      threatArrivalIssued: false,
    },
    sceneCount: 0,
    log: [],
    actionHistory: [],
    shipMemory: [],
    obstacleAttempts: {},
    secondChanceUsed: false,
    activeCombat: null,
    // === Phase 6B defaults ===
    scenario: null,
    visitedLocations: {},
    npcStates: {},
    activatedObjects: [],
    lethalLocations: [],
    fullyContainedLocations: [],
    destroyedObjectives: [],
    selfDestructActive: false,
    threatDirectorState: {
      currentBeat: 'intro',
      encounterCount: 0,
      turnsSinceLastEncounter: 0,
      turnsSinceLastHint: 0,
      hintHistory: [],
      creatureWounded: false,
      creatureEnraged: false,
      woundedCooldown: 0,
    },
    victoryResult: null,
    defeatCondition: null,
    itemsUsedCount: 0,
    encounterCount: 0,
    playerLocationId: null,
    // === Chantier 1 defaults ===
    featureStates: {},
    revealedItems: {},
    unlockedExits: {},
    scenarioFlags: {},
  };
}

// === TURN RESULT ===

/** The result of processing a single player turn */
export interface TurnResult {
  readonly newState: GameState;
  readonly narrative: string;
  readonly diceRoll: DiceResult | null;
  readonly suggestions: readonly string[];
  readonly trace: TurnDebugTrace;
}

/** Per-step debug trace populated by processTurn() for the playtest UI */
export interface TurnDebugTrace {
  // Step 1: Parse
  readonly reformulated: boolean;
  readonly reformulationPrompt: string | null;
  readonly parsedVerb: import('./verbs').VerbId | null;
  readonly parsedTarget: string | null;
  readonly parsedTargetName: string | null;
  readonly parseStrategy: number;
  readonly parseCreative: boolean;

  // Step 2: Creativity
  readonly creativityMod: number;

  // Step 3: Condition tick
  readonly conditionHpDrain: number;
  readonly conditionsExpired: readonly string[];

  // Step 4: Oxygen tick
  readonly atmosphere: string;
  readonly o2Before: number;
  readonly o2After: number;
  readonly oxygenHpDrain: number;

  // Step 5: Action resolution
  readonly isAutoVerb: boolean;
  readonly statId: StatId | null;
  readonly effectiveStatValue: number;
  readonly shipMemoryMod: number;
  readonly failsafeActivated: boolean;
  readonly failsafeDcReduction: number;
  readonly difficultyBreakdown: DifficultyBreakdown | null;
  readonly effectiveDC: number;
  readonly outcome: RollOutcome | null;

  // Step 6: Consequences
  readonly consequenceTypes: readonly ConsequenceType[];
  readonly consequenceDetails: readonly string[];
  readonly triggeredConditions: readonly string[];
  readonly deathResult: DeathType | null;

  // Step 7: NPC reaction
  readonly npcReacted: boolean;
  readonly npcAttackHit: boolean;
  readonly npcAttackDamage: number;

  // Step 8: Stalker clock
  readonly stalkerClockBefore: number;
  readonly stalkerClockAfter: number;
  readonly stalkerEventType: string | null;

  // Step 4b: Scenario interaction (Chantier 3)
  readonly scenarioInteractionMatched?: boolean;
  readonly scenarioNarrativeOverride?: import('./scenario').LocaleString | null;
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
  | 'wiring'
  | 'mechanical';

/** All valid environment feature types as a runtime array */
export const ENVIRONMENT_FEATURE_TYPES: readonly EnvironmentFeatureType[] = [
  'door', 'window', 'terminal', 'vent', 'pipe',
  'panel', 'camera', 'airlock', 'container', 'wiring',
  'mechanical',
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

// === PARSER LOCALE DATA ===

/** Multi-word pattern that overrides single-token verb matching */
export interface CompoundPattern {
  readonly tokens: readonly string[];
  readonly verb: import('./verbs').VerbId;
}

/**
 * Locale-specific linguistic data for the parser.
 * Built from i18n by `content/parserData.ts` — never hardcoded in engine.
 */
export interface ParserLocaleData {
  /** All recognized verb forms mapped to VerbId (aliases + conjugated forms) */
  readonly verbForms: ReadonlyMap<string, import('./verbs').VerbId>;
  /** Compound action patterns (sorted by token count desc) */
  readonly compoundPatterns: readonly CompoundPattern[];
  /** Stop words to filter from input */
  readonly stopWords: ReadonlySet<string>;
  /** Intent keywords for semantic fallback (strategy 6) */
  readonly intentKeywords: ReadonlyMap<string, import('./verbs').VerbId>;
  /** Pre-stemmed alias index for strategy 3 */
  readonly stemmedIndex: ReadonlyMap<string, import('./verbs').VerbId>;
  /** Prepositions that indicate the target (sur, vers, contre) */
  readonly targetPrepositions: ReadonlySet<string>;
  /** Prepositions that indicate the tool (avec) */
  readonly toolPrepositions: ReadonlySet<string>;
  /**
   * Generic NPC reference tokens (lui, ennemi, adversaire, etc.).
   * When a target token matches one of these AND exactly one NPC is present,
   * the resolver defaults to that NPC instead of the abstract environment fallback.
   */
  readonly genericNpcRefs: ReadonlySet<string>;
  /**
   * Tokens that signal "take all items" intent (tout, tous, everything, etc.).
   * Sourced from 'parser.batchTakeTokens' i18n key.
   */
  readonly batchTakeTokens: ReadonlySet<string>;
  /**
   * Maps English obstacle path verbs to VerbIds for suggestion display.
   * Sourced from 'parser.obstacleVerbs' i18n key. Keys are lowercase English
   * authoring verbs (heal, hack, crawl…); values are VerbIds (USE, HACK, CLIMB…).
   */
  readonly obstacleVerbMap: ReadonlyMap<string, import('./verbs').VerbId>;
  /** Prompt shown when TAKE is used with no identifiable target. */
  readonly takeNoTargetPrompt: string;
}

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
  readonly connectedLocations: readonly {
    readonly id: string;
    readonly aliases: readonly string[];
    /** French display name for this location (from scenario nameKey). */
    readonly displayName?: string;
    /** Whether this location has already been visited (Phase 6B). */
    readonly visited?: boolean;
  }[];
  readonly suggestions: readonly ParsedAction[];
  readonly environmentConditions: readonly EnvironmentCondition[];
  /** Body part definitions with locale-aware aliases (injected by content layer) */
  readonly bodyParts?: readonly BodyPartDefinition[];
  // === Phase 4 additions ===
  /** Current zone atmosphere (drives O2 drain in processTurn) */
  readonly atmosphere?: AtmosphereType;
  /** Current location ID (used by Ship Memory and failsafe) */
  readonly locationId?: string;
  // === Phase 6B additions ===
  /** Scenario-aware suggestions from obstacle paths (display layer). */
  readonly scenarioSuggestions?: readonly import('./suggestions').SuggestionCandidate[];
  /** Whether the current location contains a Black Box journal. */
  readonly hasBlackBox?: boolean;
  /** Structured scene description for UI display and narration enrichment. */
  readonly sceneDescription?: SceneDescription;
}

/** Structured description of the current scene for UI display and narration. */
export interface SceneDescription {
  /** Actual location name (from nameKey.fr) — used in intro sentence. */
  readonly locationName: string;
  /** Location flavor text (entry or revisit description from skin). */
  readonly locationDescription: string;
  /** Obstacle hint when unresolved, null otherwise. */
  readonly obstacleHint: string | null;
  /** Items visible in the location (not yet taken). */
  readonly visibleItems: readonly { readonly id: string; readonly name: string }[];
  /** Environment features in the location. */
  readonly visibleFeatures: readonly { readonly id: string; readonly name: string }[];
  /** NPCs present in the location. */
  readonly visibleNpcs: readonly { readonly id: string; readonly name: string }[];
  /** Connected locations with visit status. */
  readonly exits: readonly { readonly name: string; readonly visited: boolean }[];
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

// ===========================================================================
// === PHASE 4: CONSEQUENCES & STATE ENGINE ===================================
// ===========================================================================

// === SHIP MEMORY ===

/** The persistent effect a failed action leaves on a target */
export interface EnvironmentMarkEffect {
  readonly propertiesAdded?: readonly import('./properties').PropertyId[];
  readonly propertiesRemoved?: readonly import('./properties').PropertyId[];
  /** DC modifier for the same verb on this target again (negative = easier) */
  readonly sameActionDCMod: number;
  /** DC modifier for any other verb on this target (negative = easier) */
  readonly otherActionDCMod: number;
  /** Whether the noise alerts nearby NPCs */
  readonly noiseGenerated: boolean;
  /** Optional new feature ID that becomes visible as a result of this mark */
  readonly newApproachRevealed?: string;
}

/** A Ship Memory mark — a failed action permanently marks the environment */
export interface EnvironmentMark {
  readonly locationId: string;
  readonly targetId: string;
  readonly verb: import('./verbs').VerbId;
  readonly outcome: 'failure' | 'critical_failure';
  readonly effect: EnvironmentMarkEffect;
  readonly turn: number;
}

// === FAILSAFE ===

/** The four types of anti-softlock intervention */
export type FailsafeType =
  | 'degraded_bypass'     // DC reduced, HP cost to bypass obstacle
  | 'narrative_rescue'    // Story event opens alternate path
  | 'threat_escalation'   // Threat arrives (Nightmare mode only)
  | 'alternate_route';    // Hidden route revealed by mark

/** Result of the failsafe check */
export interface FailsafeResult {
  readonly type: FailsafeType;
  readonly activated: boolean;
  /** DC reduction applied this turn (for degraded_bypass) */
  readonly dcReduction?: number;
  /** i18n key for the hint/event narrative */
  readonly hintKey?: string;
}

/** Tracks all attempts on a single obstacle */
export interface ObstacleState {
  /** Composite key: `${locationId}:${targetId}` */
  readonly obstacleKey: string;
  readonly attemptCount: number;
  readonly pathsAttempted: readonly import('./verbs').VerbId[];
  readonly resolved: boolean;
}

// === CONSEQUENCES ===

/** The types of state changes a consequence can produce */
export type ConsequenceType =
  | 'damage'
  | 'heal'
  | 'condition_add'
  | 'condition_remove'
  | 'inventory_add'
  | 'inventory_remove'
  | 'item_break'
  | 'environment_change'    // e.g., room becomes on_fire
  | 'ship_memory_mark'
  | 'atmosphere_change'
  | 'npc_killed'
  | 'npc_flee'
  | 'npc_relocate';

/** A single state-change instruction produced by an action outcome */
export interface Consequence {
  readonly type: ConsequenceType;
  /** ID of the entity being affected (item, NPC, feature, or 'player') */
  readonly targetId?: string;
  /** Numeric amount (HP delta for damage/heal, etc.) */
  readonly amount?: number;
  readonly conditionId?: ConditionId;
  readonly itemId?: string;
  readonly atmosphereType?: AtmosphereType;
  readonly propertyId?: import('./properties').PropertyId;
  /** Target location for npc_relocate consequences. */
  readonly locationId?: string;
  /** NPC ID for npc_relocate consequences. */
  readonly npcId?: string;
  /** When true, damage cannot reduce HP below 1 (exploration failures). */
  readonly nonLethal?: boolean;
}

// === DEATH ===

/** The three ways the game handles a player reaching 0 HP */
export type DeathType = 'knockout' | 'second_chance' | 'permadeath';

/** Result of the death check — how to handle the player's 0 HP state */
export interface DeathResult {
  readonly type: DeathType;
  readonly hpRestored: number;
}

// === ACTIVE COMBAT ===

/** State of the currently active combat encounter */
export interface ActiveCombatState {
  readonly npc: CombatNPCState;
  /** ID of the NPC instance in the scene context */
  readonly npcInstanceId: string;
  readonly round: number;
}
