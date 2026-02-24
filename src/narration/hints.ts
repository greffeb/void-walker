// ---------------------------------------------------------------------------
// src/narration/hints.ts — Gameplay hint generator
// ---------------------------------------------------------------------------
// Replaces stale atmosphere with actionable observations after turn 4+
// in the same location. Hints are observations, never instructions.
// ---------------------------------------------------------------------------

import type { NarrativeContext, GameplayHint, HintCategory } from './types';
import type { Locale } from '../i18n/types';
import { getLocale } from '../i18n/index';
import { NarrationMemory } from './memory';
import { HINT_TEMPLATES } from '../content/templates/hints';

// === HINT MEMORY ===

const hintMemory = new NarrationMemory(8);

// === HINT PRIORITY ADJUSTMENT ===

/**
 * Escalate hint priority when player is stuck (5+ turns in same location).
 */
export function adjustHintPriority(hint: GameplayHint, turnsStuck: number): number {
  if (turnsStuck < 5) return hint.priority;

  // Escalate quest-relevant items and exits
  if (hint.category === 'interactable_item' && hint.priority >= 60) {
    return hint.priority + (turnsStuck - 4) * 10;
  }
  if (hint.category === 'exit_visible' || hint.category === 'exit_hidden') {
    return hint.priority + (turnsStuck - 4) * 5;
  }
  return hint.priority;
}

// === HINT SELECTION ===

/**
 * Select a gameplay hint appropriate for the current context.
 * Returns a French (or locale-appropriate) string, or null if no hint available.
 */
export function selectGameplayHint(
  ctx: NarrativeContext,
  turnsInLocation: number,
  locale?: Locale,
): string | null {
  const effectiveLocale = locale ?? getLocale();

  // Determine what types of hints are relevant
  const relevantCategories = getRelevantCategories(ctx);

  // Filter templates by relevant categories
  const candidates = HINT_TEMPLATES.filter(t =>
    relevantCategories.includes(t.category)
  );

  if (candidates.length === 0) return null;

  // Use anti-repetition memory
  const selected = hintMemory.select(candidates, `hint_${ctx.location.id}`);
  if (!selected) return null;

  return effectiveLocale === 'fr' ? selected.text.fr : selected.text.en;
}

/**
 * Determine which hint categories are relevant given the current context.
 */
function getRelevantCategories(ctx: NarrativeContext): readonly HintCategory[] {
  const categories: HintCategory[] = [];

  // Always include general categories
  categories.push('interactable_item');
  categories.push('searchable_area');
  categories.push('exit_visible');

  // Include hidden exits after more turns
  categories.push('exit_hidden');

  // Include NPC state if NPCs present
  if (ctx.npcsPresent.length > 0) {
    categories.push('npc_state');
  }

  // Include environmental change if conditions are active
  if (ctx.environmentConditions.size > 0) {
    categories.push('environmental_change');
  }

  return categories;
}

/** Reset hint memory (e.g., new game) */
export function resetHintMemory(): void {
  hintMemory.reset();
}
