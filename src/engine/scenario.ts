// ---------------------------------------------------------------------------
// src/engine/scenario.ts — Phase 6: Scenario & Victory Condition Types
// ---------------------------------------------------------------------------
// Defines the type system for the modular scenario engine:
// CoreSkeleton (6-node structure) + ScenarioModule + AssembledScenario
// ---------------------------------------------------------------------------

import type { StatId, StoryBeat, FailsafeType, AtmosphereType } from './types';

// ---------------------------------------------------------------------------
// LOCALE STRING — inline bilingual content (fr required, en post-launch)
// ---------------------------------------------------------------------------

/** Inline bilingual string for scenario content (not an i18n key) */
export interface LocaleString {
  readonly fr: string;
  readonly en: string;
}

// ---------------------------------------------------------------------------
// ITEM / NPC / FEATURE DEFINITIONS — content placement in locations
// ---------------------------------------------------------------------------

/** An item placed in a scenario location */
export interface ItemDefinition {
  readonly id: string;
  readonly hidden?: boolean;       // Requires search to find
  readonly conditional?: string;   // Only present if this flag is set in state
}

/** An NPC placed in a scenario location */
export interface NpcDefinition {
  readonly id: string;
  readonly disposition?: 'hostile' | 'neutral' | 'friendly' | 'cooperative';
  readonly hpOverride?: number;
}

/** An environment feature placed in a scenario location */
export interface FeatureDefinition {
  readonly id: string;
  readonly initialState?: 'intact' | 'damaged' | 'broken' | 'locked' | 'open';
}

// ---------------------------------------------------------------------------
// NODE LOCATION DEF — location within a skeleton node
// ---------------------------------------------------------------------------

/** A location defined within a core skeleton node */
export interface NodeLocationDef {
  /** Abstract role (e.g., 'control_room', 'passage') */
  readonly locationRole: string;
  readonly items: readonly ItemDefinition[];
  readonly npcs?: readonly NpcDefinition[];
  readonly features: readonly FeatureDefinition[];
  /** Connected node IDs */
  readonly exits: readonly string[];
}

// ---------------------------------------------------------------------------
// CORE SKELETON — 6-node story structure
// ---------------------------------------------------------------------------

/** Node roles for the 6-beat story structure */
export type NodeRole = 'entry' | 'gate' | 'midpoint' | 'escalation' | 'climax' | 'epilogue';

/** Node IDs for the 6-beat story structure */
export type CoreNodeId = 'start' | 'unlock' | 'reveal' | 'escalation' | 'boss' | 'resolution';

/** One node in the core skeleton (fixed position) */
export interface CoreSkeletonNode {
  readonly id: CoreNodeId;
  readonly role: NodeRole;
  readonly beat: StoryBeat;
  readonly tension: number;
  readonly descriptionKey: LocaleString;
}

// ---------------------------------------------------------------------------
// VICTORY / DEFEAT CONDITIONS
// ---------------------------------------------------------------------------

/** All victory condition variants */
export type VictoryCondition =
  // Designed victories (per-skeleton)
  | { readonly type: 'reach_location'; readonly locationId: string; readonly requiredItem?: string }
  | { readonly type: 'defeat_entity'; readonly entityId: string }
  | { readonly type: 'activate_object'; readonly objectId: string; readonly requiredItem?: string }
  | { readonly type: 'escort_alive'; readonly npcId: string; readonly locationId: string }
  // Emergent victories (global, checked every turn)
  | { readonly type: 'environmental_kill'; readonly entityId: string }
  | { readonly type: 'containment'; readonly entityId: string }
  | { readonly type: 'self_destruct' };

/** All defeat condition variants */
export type DefeatCondition =
  | { readonly type: 'player_death' }
  | { readonly type: 'npc_death'; readonly npcId: string }
  | { readonly type: 'time_expired'; readonly resource: 'o2' }
  | { readonly type: 'objective_destroyed' };

/** Boss encounter type */
export type BossType = 'combat' | 'puzzle' | 'escape' | 'choice';

// ---------------------------------------------------------------------------
// CORE SKELETON
// ---------------------------------------------------------------------------

/** The 6-node story skeleton — fixed structure, setting-agnostic */
export interface CoreSkeleton {
  readonly id: string;
  readonly nameKey: LocaleString;
  readonly descriptionKey: LocaleString;
  /** Exactly 6 nodes in story-beat order */
  readonly nodes: readonly [
    CoreSkeletonNode & { id: 'start' },
    CoreSkeletonNode & { id: 'unlock' },
    CoreSkeletonNode & { id: 'reveal' },
    CoreSkeletonNode & { id: 'escalation' },
    CoreSkeletonNode & { id: 'boss' },
    CoreSkeletonNode & { id: 'resolution' },
  ];

  /** Item required to pass the UNLOCK node */
  readonly gateItem: string;
  /** Location where the gate item is found (must be reachable before unlock) */
  readonly gateItemLocation: string;

  /** What truth is revealed at the REVEAL node */
  readonly revelation: LocaleString;
  /** What goes wrong after REVEAL */
  readonly escalationTrigger: LocaleString;

  /** Final challenge type */
  readonly bossType: BossType;

  /** Designed victory paths */
  readonly primaryVictory: VictoryCondition;
  readonly alternativeVictory: VictoryCondition;
  /** Optional extra emergent victory path */
  readonly emergentVictoryHint?: LocaleString;

  /** Per-node location definitions (abstract roles, setting provides concrete names) */
  readonly nodeLocations: Readonly<Record<CoreNodeId, NodeLocationDef>>;

  /** Defeat conditions beyond standard player_death */
  readonly additionalDefeatConditions?: readonly DefeatCondition[];
}

// ---------------------------------------------------------------------------
// SEGMENT IDS — 4 segments between the 6 nodes
// ---------------------------------------------------------------------------

/** The 4 inter-node segments where modules can be placed */
export type SegmentId =
  | 'start-unlock'
  | 'unlock-reveal'
  | 'reveal-escalation'
  | 'escalation-boss';

// ---------------------------------------------------------------------------
// NARRATIVE SKIN — per-tension-tier presentation
// ---------------------------------------------------------------------------

/** One of three narrative presentations for a module */
export interface NarrativeSkin {
  readonly tension: 'low' | 'mid' | 'high';
  readonly entryDescription: LocaleString;
  readonly revisitDescription: LocaleString;
  readonly obstacleDescription: LocaleString;
  /** Adds to all DC checks within this module when this skin is active */
  readonly dcModifier: number;
  /** Which stat paths to surface first in suggestions */
  readonly suggestedPathPriority: readonly StatId[];
  /** 3-4 atmospheric one-liners for variety */
  readonly ambientSnippets: readonly LocaleString[];
}

// ---------------------------------------------------------------------------
// MODULE TYPES
// ---------------------------------------------------------------------------

/** The 10 module archetypes */
export type ModuleType =
  | 'blocked_passage'
  | 'patrol_enemy'
  | 'npc_encounter'
  | 'terminal_puzzle'
  | 'environmental'
  | 'exploration'
  | 'rescue'
  | 'moral_choice'
  | 'resource_cache'
  | 'ambush';

/** Compatibility filter for a scenario module */
export interface ModuleCompatibility {
  /** If set, module works in any setting */
  readonly universal?: true;
  /** If set, module requires a setting in these categories */
  readonly categories?: readonly SettingCategory[];
  /** If set, module only works in these specific settings */
  readonly settingIds?: readonly string[];
}

// ---------------------------------------------------------------------------
// OBSTACLE — the challenge in a module
// ---------------------------------------------------------------------------

/** One resolution path for an obstacle */
export interface ObstaclePath {
  readonly id: string;
  readonly stat: StatId;
  readonly dc: number;
  readonly description: LocaleString;
  /** Verb aliases that hint which actions trigger this path */
  readonly verbs: readonly string[];
  /** Whether this is a creative/unusual solution */
  readonly isCreative?: boolean;
  /** Whether this path requires a specific item */
  readonly requiredItem?: string;
}

/** The obstacle in a module (the challenge players must resolve) */
export interface ObstacleDefinition {
  /** The environmental feature or target ID being interacted with */
  readonly targetId: string;
  /** 3+ resolution paths */
  readonly paths: readonly ObstaclePath[];
  readonly failsafeType?: FailsafeType;
  readonly description: LocaleString;
}

// ---------------------------------------------------------------------------
// MODULE LOCATION DEF — locations within a module
// ---------------------------------------------------------------------------

/** A location within a scenario module */
export interface ModuleLocationDef {
  readonly id: string;
  /** Abstract location role (resolved to setting-specific name at assembly) */
  readonly role: string;
  readonly onCriticalPath: boolean;
  readonly features: readonly FeatureDefinition[];
  readonly items?: readonly ItemDefinition[];
  readonly npcs?: readonly NpcDefinition[];
  readonly atmosphere?: AtmosphereType;
}

// ---------------------------------------------------------------------------
// MODULE LOCALE DATA
// ---------------------------------------------------------------------------

/** Locale-specific strings for a module */
export interface ModuleLocaleData {
  readonly entryPrefix: string;         // "Vous entrez dans..."
  readonly obstaclePrefix: string;      // "Un obstacle bloque..."
  readonly successSuffix: string;       // "Vous avez réussi..."
  readonly failureSuffix: string;       // "Vous avez échoué..."
}

// ---------------------------------------------------------------------------
// SCENARIO MODULE — pluggable story segment
// ---------------------------------------------------------------------------

/** A pluggable story segment that can be inserted into any skeleton */
export interface ScenarioModule {
  readonly id: string;
  readonly type: ModuleType;
  /** Which skeleton segments this module can be placed in */
  readonly validSegments: readonly SegmentId[];
  /** Tension range [min, max] for which this module is appropriate */
  readonly tensionRange: readonly [number, number];
  readonly compatibility: ModuleCompatibility;

  // Layout
  /** 1-3 critical-path locations */
  readonly locations: readonly ModuleLocationDef[];
  /** 0-2 optional side rooms */
  readonly sideRooms: readonly ModuleLocationDef[];

  // Content
  readonly npcs?: readonly NpcDefinition[];
  readonly items?: readonly ItemDefinition[];
  readonly obstacle: ObstacleDefinition;

  // Narrative — exactly 3 skins (low, mid, high)
  readonly skins: readonly [NarrativeSkin, NarrativeSkin, NarrativeSkin];

  /** Abstract role used to match against setting's supportedRoles */
  readonly locationRole: string;

  // Locale
  readonly locale: Readonly<{ fr: ModuleLocaleData; en: ModuleLocaleData }>;
}

// ---------------------------------------------------------------------------
// SETTING DEFINITIONS
// ---------------------------------------------------------------------------

/** Category tags for settings */
export type SettingCategory = 'space_vessel' | 'facility' | 'alien';

/** A game setting (provides concrete names for abstract location roles) */
export interface SettingDefinition {
  readonly id: string;
  readonly nameKey: LocaleString;
  readonly categories: readonly SettingCategory[];
  /** Abstract roles this setting supports */
  readonly supportedRoles: readonly string[];
  /** Maps each role to 20+ location name variants */
  readonly locationNames: Readonly<Record<string, readonly LocaleString[]>>;
  /** Setting-specific environmental features */
  readonly features: readonly string[];
  /** Items more commonly found in this setting */
  readonly preferredItems: readonly string[];
}

// ---------------------------------------------------------------------------
// SESSION LENGTH
// ---------------------------------------------------------------------------

/** Player-selectable session length */
export type SessionLength = 'quick' | 'standard' | 'extended';

// ---------------------------------------------------------------------------
// PLACED MODULE — a module assigned to a segment in an assembled scenario
// ---------------------------------------------------------------------------

/** A module placed into a specific segment of an assembled scenario */
export interface PlacedModule {
  readonly module: ScenarioModule;
  readonly segment: SegmentId;
  /** Position within the segment (0-indexed) */
  readonly index: number;
  /** Tension value assigned to this placement */
  readonly assignedTension: number;
  /** Active skin selected based on assignedTension */
  readonly activeSkin: NarrativeSkin;
}

// ---------------------------------------------------------------------------
// LOCATION GRAPH — the assembled navigation graph
// ---------------------------------------------------------------------------

/** A single node in the assembled location graph */
export interface LocationNode {
  readonly id: string;
  readonly nameKey: LocaleString;
  readonly role: string;
  readonly beat: StoryBeat;
  readonly tension: number;
  /** Whether this is a skeleton core node (vs. a module node) */
  readonly isCoreNode: boolean;
  readonly coreNodeId?: CoreNodeId;
  readonly moduleId?: string;
  readonly onCriticalPath: boolean;
  readonly items: readonly ItemDefinition[];
  readonly npcs?: readonly NpcDefinition[];
  readonly features: readonly FeatureDefinition[];
  readonly obstacle?: ObstacleDefinition;
  readonly atmosphere: AtmosphereType;
  /** Active narrative skin for this location (from placed module) */
  readonly activeSkin?: NarrativeSkin;
  /** Whether this location contains a Black Box journal */
  readonly hasBlackBox?: boolean;
}

/** A directed edge in the location graph */
export interface LocationEdge {
  readonly from: string;
  readonly to: string;
  readonly bidirectional: boolean;
}

/** The complete assembled location navigation graph */
export interface LocationGraph {
  readonly nodes: readonly LocationNode[];
  readonly edges: readonly LocationEdge[];
}

// ---------------------------------------------------------------------------
// ASSEMBLED SCENARIO — fully built game ready to play
// ---------------------------------------------------------------------------

/** A fully assembled scenario ready to start */
export interface AssembledScenario {
  readonly skeleton: CoreSkeleton;
  readonly modules: readonly PlacedModule[];
  readonly graph: LocationGraph;
  readonly setting: SettingDefinition;
  readonly sessionLength: SessionLength;
  /** Black Box placement, if a previous journal was found */
  readonly blackBoxLocationId?: string;
}

// ---------------------------------------------------------------------------
// LOCATION VISIT STATE — backtracking support
// ---------------------------------------------------------------------------

/** Tracks the state of a location across revisits */
export interface LocationVisitState {
  /** Turn number of first visit */
  readonly firstVisited: number;
  readonly visitCount: number;
  /** Item IDs that have been taken (no longer present) */
  readonly itemsTaken: readonly string[];
  /** Feature IDs that have been changed */
  readonly featuresChanged: readonly string[];
  readonly obstacleResolved: boolean;
}

// ---------------------------------------------------------------------------
// THREAT DIRECTOR — horror pacing state machine
// ---------------------------------------------------------------------------

/** Threat director per-beat configuration */
export interface ThreatBehavior {
  /** How visible the threat is */
  readonly visibility: 'hidden' | 'hinted' | 'glimpsed' | 'present' | 'pursuing' | 'aftermath';
  /** 0–10 aggressiveness level */
  readonly aggressiveness: number;
  /** Per-turn probability of a combat encounter */
  readonly encounterChance: number;
  /** Per-turn probability of an atmospheric hint */
  readonly hintChance: number;
  /** Environmental effects that can trigger */
  readonly environmentalEffects: readonly string[];
  /** Narrative hint templates */
  readonly narrativeHints: readonly string[];
}

/** Encounter subtypes based on aggressiveness */
export type EncounterSubtype = 'stalk' | 'ambush' | 'hunt' | 'pursue';

/** An event generated by the threat director */
export type ThreatEvent =
  | { readonly type: 'encounter'; readonly subtype: EncounterSubtype; readonly rounds: number; readonly canFlee?: boolean; readonly fleeAfterRounds?: number }
  | { readonly type: 'environmental'; readonly effect: string }
  | { readonly type: 'hint'; readonly template: string };

/** Threat director state (immutable snapshot stored in GameState) */
export interface ThreatDirectorState {
  readonly currentBeat: StoryBeat;
  readonly encounterCount: number;
  readonly turnsSinceLastEncounter: number;
  readonly turnsSinceLastHint: number;
  /** No Set in immutable state — use array with dedup */
  readonly hintHistory: readonly string[];
  readonly creatureWounded: boolean;
  /** +2 aggressiveness when creature returns from wound */
  readonly creatureEnraged: boolean;
  readonly woundedCooldown: number;
}

// ---------------------------------------------------------------------------
// VICTORY RESULT — outcome of a victory check
// ---------------------------------------------------------------------------

/** Classification of which victory was achieved */
export type VictoryType =
  | 'primary'
  | 'alternative'
  | 'emergent_environmental_kill'
  | 'emergent_containment'
  | 'emergent_self_destruct';

/** Result of a per-turn victory check */
export interface VictoryResult {
  readonly type: VictoryType;
  readonly skeletonId: string;
}

// ---------------------------------------------------------------------------
// BLACK BOX — persistent death/victory journals
// ---------------------------------------------------------------------------

/** A key event from a game's history */
export interface KeyEvent {
  readonly turn: number;
  readonly description: LocaleString;
  readonly type: 'discovery' | 'combat' | 'death' | 'choice' | 'escape';
}

/** A hint about dangers encountered (for the journal) */
export interface DangerHint {
  readonly description: LocaleString;
}

/** A Black Box journal entry persisted across games */
export interface BlackBoxEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly playerName: string;
  readonly classId: string;
  readonly skeletonId: string;
  readonly settingId: string;
  readonly difficulty: string;
  readonly outcome: 'victory' | 'death';
  readonly turnsPlayed: number;
  readonly causeOfDeath?: string;
  readonly journalEntry: LocaleString;
  readonly keyEvents: readonly KeyEvent[];
  readonly hints: readonly DangerHint[];
}

/** Game history snapshot for generating a Black Box entry */
export interface GameHistory {
  readonly playerName: string;
  readonly className: string;
  readonly classId: string;
  readonly skeletonId: string;
  readonly settingId: string;
  readonly settingName: string;
  readonly difficulty: string;
  readonly turnsPlayed: number;
  readonly causeOfDeath?: string;
  readonly victoryVerb?: string;
  readonly keyEvents: readonly KeyEvent[];
}

// ---------------------------------------------------------------------------
// VALIDATION RESULT — scenario assembly check
// ---------------------------------------------------------------------------

/** Result of validating an assembled scenario */
export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly string[];
}
