// ---------------------------------------------------------------------------
// src/engine/constants.ts — Balance constants from MASTERPLAN §7
// ---------------------------------------------------------------------------
// All balance values are imported from here. Never hardcode magic numbers.
// ---------------------------------------------------------------------------

/** Master balance constants — readonly and imported by all engine modules */
export const BALANCE = {
  // === DIFFICULTY ===
  BASE_DIFFICULTY: 10,
  MIN_DIFFICULTY: 2,
  MAX_DIFFICULTY: 25,
  ABSURD_DIFFICULTY_FLOOR: 23,

  // === STATS ===
  STAT_MIN: 0,
  STAT_MAX: 5,
  BONUS_POINTS: 2,
  TOTAL_CLASS_POINTS: 18,
  INVENTORY_SLOTS: 8,

  // === COMBAT ===
  COMBAT: {
    UNARMED_BASE_DAMAGE: 1,
    IMPROVISED_WEAPON_MULTIPLIER: 0.75,
    CRITICAL_HIT_MULTIPLIER: 1.5,
    PASSIVE_DODGE_AGI_THRESHOLD: 3,
    PASSIVE_DODGE_CHANCE: 0.1,
    NPC_HIT_BASE_DC: 10,
    BERSERK_ATK_BONUS_PER_QUARTER: 1,
    WEAK_POINT_HINT_ROUND: 2,
    WEAK_POINT_AUTO_DISCOVER_ROUND: 3,
    ENVIRONMENTAL_KILL_MULTIPLIER: 10,
    CORNERED_FLEE_DC: 16,
    SHOOT_DAMAGE_AGI_DIVISOR: 2,
    AMBUSH_FIRST_ROUND_BONUS: 3,
    EXPLOIT_INT_MULTIPLIER: 1.0,
    RETREAT_DC_REDUCTION: 5,
  },

  // === BONUS LOOT ===
  BONUS_LOOT: {
    CHANCE_ON_NAT_20: 0.5,
  },

  // === STALKER CLOCK ===
  STALKER_CLOCK: {
    WARNING: { explorer: 20, survivor: 15, nightmare: 10 },
    THREAT: { explorer: 30, survivor: 22, nightmare: 15 },
    KILL: { explorer: 999, survivor: 35, nightmare: 20 },
  },

  // === CREATIVITY ===
  CREATIVITY: {
    DIFFERENT_FROM_SUGGESTIONS_BONUS: -2,
    NOVEL_COMBO_BONUS: -1,
    ABSURD_BUT_POSSIBLE_BONUS: -3,
  },

  // === OXYGEN ===
  OXYGEN: {
    MAX: 100,
    DRAIN_PRESSURIZED: 0,
    DRAIN_LOW_OXYGEN: 3,
    DRAIN_DEPRESSURIZED: 8,
    DRAIN_TOXIC: 5,
    HP_DRAIN_AT_ZERO: 3,
    RESTORE_RATE_SAFE: 33,
    CANISTER_RESTORE: 50,
    EVA_DRAIN_REDUCTION: 0.5,
  },

  // === CONDITIONS ===
  CONDITIONS: {
    WOUNDED_HP_THRESHOLD: 0.3,
    TERRIFIED_DURATION: 5,
    COLD_ONSET_ACTIONS: 3,
    EXHAUSTION_THRESHOLD: 15,
    POISONED_HP_DRAIN: 1,
  },

  // === DURABILITY ===
  DURABILITY: {
    IMPROVISED_WEAPON_MAX_USES: 2,
    REPAIR_BASE_DC: 12,
    NON_ENGINEER_REPAIR_PENALTY: 3,
  },

  // === PACING ===
  SCENES_QUICK: 10,
  SCENES_STANDARD: 20,
  SCENES_EXTENDED: 40,
  BEAT_INTRO: 0.10,
  BEAT_RISING: 0.35,
  BEAT_MIDPOINT: 0.10,
  BEAT_ESCALATION: 0.30,
  BEAT_CLIMAX: 0.10,
  BEAT_RESOLUTION: 0.05,

  // === CONSEQUENCES ===
  MAX_CASCADE_DEPTH: 5,
  FIRE_SPREAD_DELAY: 3,
  /** Damage dealt to player on non-combat action failure */
  FAILURE_DAMAGE: 1,
  /** Damage dealt to player on non-combat critical failure */
  CRIT_FAILURE_DAMAGE: 2,
  /** Damage dealt to player on successful SELF_HARM (instant kill) */
  SELF_HARM_LETHAL_DAMAGE: 999,
  /** Damage dealt when player tries to eat a sharp/bladed/pointed object */
  EAT_SHARP_DAMAGE: 1,
  /** Damage dealt when player tries to eat a toxic/corrosive/radioactive object */
  EAT_TOXIC_DAMAGE: 3,

  // === FAILSAFE (anti-softlock) ===
  FAILSAFE: {
    /** Attempt threshold before failsafe activates (per difficulty) */
    THRESHOLD: { explorer: 2, survivor: 4, nightmare: 6 } as const,
    /** HP cost of a degraded_bypass intervention (per difficulty) */
    COST: { explorer: 1, survivor: 3, nightmare: 5 } as const,
    /** Whether failsafe can activate (Nightmare = threat escalation, not DC help) */
    ENABLED: { explorer: true, survivor: true, nightmare: false } as const,
    /** Base DC reduction applied at threshold (increases each extra attempt) */
    BASE_DC_REDUCTION: 3,
  },

  // === SAVE ===
  SAVE: {
    SLOT_COUNT: 3,
    AUTO_SAVE_INTERVAL_MS: 30_000,
    BLACK_BOX_MAX_ENTRIES: 20,
  },

  // === CONTEXT MODIFIERS ===
  CONTEXT_MODIFIERS: {
    COOPERATIVE_TARGET: -3,
    HOSTILE_TARGET: 3,
    FORTIFIED_TARGET: 5,
    APPROPRIATE_TOOL: -2,
    WRONG_TOOL: 2,
    NO_TOOL_WHEN_NEEDED: 5,
    IN_DARKNESS: 2,
    ZERO_GRAVITY: 2,
    TIME_PRESSURE: 2,
    WOUNDED_PLAYER: 1,
    TERRIFIED_PLAYER: 1,
    HIGH_RELEVANT_STAT_THRESHOLD: 4,
    HIGH_RELEVANT_STAT_BONUS: -1,
    ABSURD_MIN_BONUS: 5,
    ABSURD_MAX_BONUS: 15,
  },

  // === AI ===
  AI_TIMEOUT_MS: 5_000,
  AI_MAX_REQUESTS_PER_SESSION: 100,

  // === MICRO-MODULES ===
  MICRO_MODULES: {
    /** DC reduction for active EXAMINE/SEARCH check (vs passive) */
    ACTIVE_PER_DC_REDUCTION: 2,
    /** Turns in parent node before hint system auto-reveals hidden micro-modules */
    HINT_REVEAL_TURN_THRESHOLD: 4,
    /** Turns a creature lingers in a micro-module if the player doesn't enter */
    CREATURE_LINGER_TURNS: 3,
    /** Expected micro-module count ranges per session length */
    SLOT_COUNTS: {
      quick: { min: 1, max: 2 },
      standard: { min: 6, max: 10 },
      extended: { min: 12, max: 18 },
    },
    /** Type weight reduction when a type is over-represented */
    OVERREP_HEAVY_THRESHOLD: 3,
    OVERREP_HEAVY_FACTOR: 0.3,
    OVERREP_LIGHT_THRESHOLD: 2,
    OVERREP_LIGHT_FACTOR: 0.6,
    /** Base weights per beat for each micro-module type */
    TYPE_WEIGHTS: {
      intro:      { loot: 2, lore: 3, encounter: 1, ambiance: 4 },
      rising:     { loot: 3, lore: 3, encounter: 2, ambiance: 2 },
      midpoint:   { loot: 2, lore: 4, encounter: 2, ambiance: 2 },
      escalation: { loot: 3, lore: 2, encounter: 3, ambiance: 2 },
      climax:     { loot: 1, lore: 1, encounter: 3, ambiance: 1 },
      resolution: { loot: 1, lore: 2, encounter: 1, ambiance: 3 },
    },
  },
} as const;

/** Type helper for the BALANCE object */
export type BalanceConstants = typeof BALANCE;
