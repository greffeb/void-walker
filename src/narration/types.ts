// ---------------------------------------------------------------------------
// src/narration/types.ts — Narrative system type definitions
// ---------------------------------------------------------------------------
// All template/snippet types, narrative context, and composition interfaces.
// ---------------------------------------------------------------------------

import type { GrammaticalInfo } from '../i18n/grammar/interface';
import type { VerbId } from '../engine/verbs';
import type { PropertyId } from '../engine/properties';
import type { StoryBeat, ConditionId } from '../engine/types';

// === VERB CATEGORY ===

/** High-level verb categories for template fallback */
export type VerbCategory = 'physical' | 'technical' | 'social' | 'perception' | 'interaction' | 'creative';

// === OUTCOME TYPE ===

/** Narrative outcome type — maps from engine RollOutcome plus auto_success */
export type Outcome = 'crit_success' | 'success' | 'partial' | 'failure' | 'crit_failure' | 'auto_success';

// === TENSION TIER ===

/** Tension tier for template selection */
export type TensionTier = 'low' | 'mid' | 'high';

/** Convert numeric tension (1-10) to tier */
export function tensionTier(tension: number): TensionTier {
  if (tension <= 3) return 'low';
  if (tension <= 7) return 'mid';
  return 'high';
}

// === DISPOSITION ===

/** NPC disposition toward the player */
export type Disposition = 'hostile' | 'neutral' | 'friendly' | 'frightened';

// === BEAT ZONE (alias for StoryBeat) ===

export type BeatZone = StoryBeat;

// === LOCALE STRING ===

/** Locale-keyed strings for templates */
export interface LocaleString {
  readonly fr: string;
  readonly en: string;
}

// === HINT CATEGORY ===

export type HintCategory =
  | 'interactable_item'
  | 'searchable_area'
  | 'exit_visible'
  | 'exit_hidden'
  | 'npc_state'
  | 'environmental_change';

// === LAYER TYPES ===

/** The 6 optional layer types (Layer 1: action is always mandatory) */
export type LayerType =
  | 'sensory'
  | 'consequence'
  | 'atmosphere'
  | 'player_state'
  | 'threat'
  | 'npc_reaction';

// === TARGET INFO ===

export interface TargetInfo {
  readonly id: string;
  readonly name: string;
  readonly type: string;              // Property tag(s) like 'electronic', 'breakable'
  readonly properties: readonly PropertyId[];
  readonly bodyPart?: string;
  readonly grammar: GrammaticalInfo;
}

// === ITEM INFO ===

export interface ItemInfo {
  readonly id: string;
  readonly name: string;
  readonly grammar: GrammaticalInfo;
}

// === LOCATION INFO ===

export interface LocationInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly conditions: ReadonlySet<string>;
}

// === NPC INFO ===

export interface NpcInfo {
  readonly id: string;
  readonly name: string;
  readonly disposition: Disposition;
  readonly grammar: GrammaticalInfo;
}

// === STATE CHANGE ===

export interface StateChange {
  readonly type: string;
  readonly description: string;
}

// === MODULE TYPE ===

export type ModuleType =
  | 'blocked_passage'
  | 'patrol_enemy'
  | 'puzzle'
  | 'social_encounter'
  | 'exploration'
  | 'combat'
  | 'boss';

// === NARRATIVE CONTEXT ===

/** The 12 context dimensions driving narrative composition */
export interface NarrativeContext {
  // 1. VERB — What action was performed
  readonly verb: VerbId;
  readonly verbCategory: VerbCategory;

  // 2. OUTCOME — How the dice resolved
  readonly outcome: Outcome;
  readonly margin: number;

  // 3. TARGET — What was the action applied to
  readonly target: TargetInfo | null;
  readonly targetDisposition: Disposition;

  // 4. TOOL — What item was used (if any)
  readonly toolUsed: ItemInfo | null;

  // 5. LOCATION — Where it happened
  readonly location: LocationInfo;
  readonly environmentConditions: ReadonlySet<string>;

  // 6. TENSION — Current story tension level
  readonly tension: number;
  readonly beat: BeatZone;

  // 7. SETTING — World theme
  readonly settingId: string;

  // 8. PLAYER STATE — Physical condition
  readonly playerHpPercent: number;
  readonly playerConditions: ReadonlySet<string>;

  // 9. MODULE CONTEXT — Which scenario module we're in
  readonly moduleId: string;
  readonly moduleType: ModuleType;

  // 10. NPC PRESENT — Are NPCs watching/reacting
  readonly npcsPresent: readonly NpcInfo[];

  // 11. HISTORY — What happened recently
  readonly recentEvents: readonly string[];
  readonly turnNumber: number;

  // 12. CREATIVITY — Was this a creative/unusual action
  readonly isCreative: boolean;
  readonly isAbsurd: boolean;

  // STATE CHANGES (from consequence engine)
  readonly stateChanges?: readonly StateChange[];
}

// === NARRATIVE SETTINGS ===

/** Narrative length preset */
export type NarrativePreset = 'concise' | 'standard' | 'immersive';

/** Settings that control narrative output */
export interface NarrativeSettings {
  readonly preset: NarrativePreset;
  readonly maxLayers: 3 | 5 | 7;
}

/** The three narrative presets */
export const NARRATIVE_PRESETS: Readonly<Record<NarrativePreset, NarrativeSettings>> = {
  concise:   { preset: 'concise',   maxLayers: 3 },
  standard:  { preset: 'standard',  maxLayers: 5 },
  immersive: { preset: 'immersive', maxLayers: 7 },
};

// === TEMPLATE TYPES ===

/** Action template (Layer 1) */
export interface ActionTemplate {
  readonly id: string;
  readonly verb: VerbId | null;        // null = category-level fallback
  readonly targetType: PropertyId | null; // null = any target
  readonly outcome: Outcome;
  readonly tension: TensionTier;
  readonly category: VerbCategory;
  readonly text: LocaleString;
}

/** Sensory detail snippet (Layer 2) */
export interface SensorySnippet {
  readonly id: string;
  readonly setting: string;            // 'derelict_ship' | 'alien_ruins' | ...
  readonly condition: string;          // 'default' | 'dark' | 'on_fire' | ...
  readonly text: LocaleString;
}

/** Atmosphere snippet (Layer 4) */
export interface AtmosphereSnippet {
  readonly id: string;
  readonly setting: string;
  readonly tensionTier: TensionTier | 'climax';
  readonly text: LocaleString;
}

/** Player state snippet (Layer 5) */
export interface PlayerStateSnippet {
  readonly id: string;
  readonly type: 'low_hp' | 'mild_fatigue' | 'condition';
  readonly condition?: ConditionId;
  readonly text: LocaleString;
}

/** NPC reaction snippet (Layer 7) */
export interface NpcReactionSnippet {
  readonly id: string;
  readonly disposition: Disposition;
  readonly outcome: Outcome;
  readonly text: LocaleString;
}

/** Consequence snippet (Layer 3) */
export interface ConsequenceSnippet {
  readonly id: string;
  readonly stateChangeType: string;
  readonly text: LocaleString;
}

/** Threat hint snippet (Layer 6) */
export interface ThreatHintSnippet {
  readonly id: string;
  readonly beat: BeatZone;
  readonly text: LocaleString;
}

/** Gameplay hint template */
export interface GameplayHintTemplate {
  readonly id: string;
  readonly category: HintCategory;
  readonly text: LocaleString;
}

/** Secret verb template */
export interface SecretVerbTemplate {
  readonly id: string;
  readonly verb: string;
  readonly type: 'discovery' | 'effect' | 'rejection';
  readonly rejectionTier?: 'blocked' | 'annoyed';
  readonly context?: string;
  readonly text: LocaleString;
}

// === SCORED LAYER (internal to composer) ===

export interface ScoredLayer {
  readonly layer: LayerType;
  readonly score: number;
  readonly render: () => string | null;
}

// === LOCATION NARRATION STATE ===

export interface LocationNarrationState {
  readonly locationId: string;
  turnsSpentHere: number;
  atmosphereShownCount: number;
  sensoryIdsUsedHere: Set<string>;
  hintsShown: Set<string>;
  environmentVersion: number;
}

// === SECRET VERB USAGE ===

export interface SecretVerbUsage {
  readonly verbId: string;
  readonly scopeKey: string;
  timesAttempted: number;
  readonly firstUseTurn: number;
}

export interface SecretVerbResult {
  readonly allowed: boolean;
  readonly rejectionTier?: 'blocked' | 'annoyed';
}

// === GAMEPLAY HINT (runtime) ===

export interface GameplayHint {
  readonly id: string;
  readonly category: HintCategory;
  readonly priority: number;
  readonly text: LocaleString;
  readonly entityId: string;
  readonly shownToPlayer: boolean;
}
