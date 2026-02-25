// ---------------------------------------------------------------------------
// src/engine/suggestions.ts — Phase 6: Context-Aware Action Suggestions
// ---------------------------------------------------------------------------
// Always exactly 3 suggestions (or fewer if not enough candidates).
// Never includes secret/Easter-egg verbs.
// Weighted by obstacle paths, class strengths, and active narrative skin.
// ---------------------------------------------------------------------------

import type { StatId, PlayerClassName } from './types';
import type { NarrativeSkin } from './scenario';

// ---------------------------------------------------------------------------
// SUGGESTION CANDIDATE
// ---------------------------------------------------------------------------

/** A scored suggestion candidate before top-3 selection. */
export interface SuggestionCandidate {
  /** Human-readable verb text (in FR, e.g., "examiner") */
  readonly verbText: string;
  /** Human-readable target text (in FR, e.g., "le terminal") */
  readonly targetText: string;
  /** The primary stat this action uses */
  readonly stat: StatId;
  /** Category for variety balancing */
  readonly category: 'obstacle' | 'item' | 'npc' | 'movement' | 'environment';
  /** Computed score (higher = shown first) */
  readonly score: number;
}

// ---------------------------------------------------------------------------
// CLASS BIASES — primary stats per class
// ---------------------------------------------------------------------------

/** Primary stats for each player class (higher-scoring in suggestions). */
export const CLASS_PRIMARY_STATS: Readonly<Record<PlayerClassName, readonly StatId[]>> = {
  marine: ['FOR', 'DEF'],
  engineer: ['INT', 'AGI'],
  medic: ['CHA', 'INT'],
};

// ---------------------------------------------------------------------------
// SUGGESTION EXCLUSION — verbs never shown in suggestions
// ---------------------------------------------------------------------------

/**
 * Verb IDs that must never appear in suggestions.
 * These are Easter-egg / special verbs that reward player curiosity,
 * not prompted interaction.
 */
export const SUGGESTION_EXCLUDED_VERB_IDS = new Set([
  'WAIT',       // Easter-egg use; always available but not prompted
  'SACRIFICE',  // High-stakes, should be discovered organically
]);

/** Returns true if a verb ID should be excluded from suggestions. */
export function isExcludedFromSuggestions(verbId: string): boolean {
  return SUGGESTION_EXCLUDED_VERB_IDS.has(verbId);
}

// ---------------------------------------------------------------------------
// SCORING
// ---------------------------------------------------------------------------

/** Base score per suggestion category. */
const CATEGORY_BASE_SCORES: Readonly<Record<SuggestionCandidate['category'], number>> = {
  obstacle: 5,      // Highest: obstacle paths are the core gameplay action
  item: 3,
  npc: 3,
  movement: 2,
  environment: 1,
};

/** Bonus score if stat matches player's class primary stats. */
export const CLASS_STAT_BONUS = 2;

/** Bonus score if stat is in active skin's suggestedPathPriority. */
export const SKIN_PRIORITY_BONUS = 1;

/** Max candidates per category for variety balancing. */
export const MAX_PER_CATEGORY = 2;

/**
 * Score a single candidate given the player's class and active narrative skin.
 * Returns the numeric score (higher = prioritized).
 */
export function scoreCandidate(
  candidate: Omit<SuggestionCandidate, 'score'>,
  playerClass: PlayerClassName,
  activeSkin: NarrativeSkin | null,
): number {
  let score = CATEGORY_BASE_SCORES[candidate.category];

  if (CLASS_PRIMARY_STATS[playerClass].includes(candidate.stat)) {
    score += CLASS_STAT_BONUS;
  }

  if (activeSkin?.suggestedPathPriority.includes(candidate.stat) === true) {
    score += SKIN_PRIORITY_BONUS;
  }

  return score;
}

// ---------------------------------------------------------------------------
// TOP-3 SELECTION WITH VARIETY
// ---------------------------------------------------------------------------

/**
 * Select the top 3 candidates from a scored list with variety balancing.
 *
 * Variety rule: at most MAX_PER_CATEGORY (2) candidates from the same category.
 * Falls back to best-score overflow if fewer than 3 diverse candidates exist.
 */
export function selectTop3WithVariety(
  candidates: readonly SuggestionCandidate[],
): readonly SuggestionCandidate[] {
  if (candidates.length <= 3) return candidates;

  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const selected: SuggestionCandidate[] = [];
  const categoryCounts = new Map<string, number>();

  // First pass: up to MAX_PER_CATEGORY per category
  for (const candidate of sorted) {
    if (selected.length >= 3) break;
    const count = categoryCounts.get(candidate.category) ?? 0;
    if (count < MAX_PER_CATEGORY) {
      selected.push(candidate);
      categoryCounts.set(candidate.category, count + 1);
    }
  }

  // Second pass: fill remaining slots if < 3 (variety satisfied)
  if (selected.length < 3) {
    for (const candidate of sorted) {
      if (selected.length >= 3) break;
      if (!selected.includes(candidate)) {
        selected.push(candidate);
      }
    }
  }

  return selected;
}

// ---------------------------------------------------------------------------
// GENERATE SUGGESTIONS — main entry point
// ---------------------------------------------------------------------------

/**
 * Generate the final top-3 suggestions from a raw candidate list.
 *
 * @param candidates - Unscored candidates from obstacles, items, NPCs, movement, environment
 * @param playerClass - Player's class for stat bias
 * @param activeSkin - Current narrative skin for tension priority bias (nullable)
 * @returns Up to 3 SuggestionCandidates sorted by relevance
 */
export function generateSuggestions(
  candidates: readonly Omit<SuggestionCandidate, 'score'>[],
  playerClass: PlayerClassName,
  activeSkin: NarrativeSkin | null,
): readonly SuggestionCandidate[] {
  const scored: SuggestionCandidate[] = candidates.map(c => ({
    ...c,
    score: scoreCandidate(c, playerClass, activeSkin),
  }));

  return selectTop3WithVariety(scored);
}
