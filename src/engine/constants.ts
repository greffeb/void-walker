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
  TOTAL_CLASS_POINTS: 15,
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
    EXHAUSTION_THRESHOLD: 10,
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

  // === SAVE ===
  SAVE: {
    SLOT_COUNT: 3,
    AUTO_SAVE_INTERVAL_MS: 30_000,
    BLACK_BOX_MAX_ENTRIES: 20,
  },

  // === AI ===
  AI_TIMEOUT_MS: 5_000,
  AI_MAX_REQUESTS_PER_SESSION: 100,
} as const;

/** Type helper for the BALANCE object */
export type BalanceConstants = typeof BALANCE;
