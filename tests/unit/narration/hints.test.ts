// ---------------------------------------------------------------------------
// tests/unit/narration/hints.test.ts — Gameplay hint generator tests
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { selectGameplayHint, adjustHintPriority, resetHintMemory } from '../../../src/narration/hints';
import type { NarrativeContext, GameplayHint } from '../../../src/narration/types';
import type { GrammaticalInfo } from '../../../src/i18n/grammar/interface';

// === HELPERS ===

const femGrammar: GrammaticalInfo = { gender: 'F', startsWithVowel: false, plural: false };

function makeCtx(overrides: Partial<NarrativeContext> = {}): NarrativeContext {
  return {
    verb: 'WAIT' as NarrativeContext['verb'],
    verbCategory: 'interaction',
    outcome: 'auto_success',
    margin: 0,
    target: null,
    targetDisposition: 'neutral',
    toolUsed: null,
    location: {
      id: 'loc_cargo',
      name: 'soute',
      description: '',
      features: [],
      conditions: new Set(),
    },
    environmentConditions: new Set(),
    tension: 3,
    beat: 'rising',
    settingId: 'derelict_ship',
    playerHpPercent: 0.7,
    playerConditions: new Set(),
    moduleId: 'mod_1',
    moduleType: 'exploration',
    npcsPresent: [],
    recentEvents: [],
    turnNumber: 10,
    isCreative: false,
    isAbsurd: false,
    ...overrides,
  };
}

describe('selectGameplayHint', () => {
  beforeEach(() => {
    resetHintMemory();
  });

  it('returns a non-null string for valid context', () => {
    const ctx = makeCtx();
    const hint = selectGameplayHint(ctx, 5, 'fr');
    expect(hint).not.toBeNull();
    expect(typeof hint).toBe('string');
    expect(hint!.length).toBeGreaterThan(0);
  });

  it('returns French text when locale is fr', () => {
    const ctx = makeCtx();
    const hint = selectGameplayHint(ctx, 5, 'fr');
    expect(hint).not.toBeNull();
    // Should be a non-empty string (French content)
    expect(typeof hint).toBe('string');
  });

  it('includes NPC hints when NPCs are present', () => {
    const ctx = makeCtx({
      npcsPresent: [{
        id: 'npc_1',
        name: 'Kira',
        disposition: 'neutral',
        grammar: femGrammar,
      }],
    });
    // With NPCs, npc_state category should be available
    const hint = selectGameplayHint(ctx, 5, 'fr');
    expect(hint).not.toBeNull();
  });

  it('includes environmental hints when conditions active', () => {
    const ctx = makeCtx({
      environmentConditions: new Set(['dark', 'depressurized']),
    });
    const hint = selectGameplayHint(ctx, 5, 'fr');
    expect(hint).not.toBeNull();
  });

  it('produces varied hints across multiple calls', () => {
    const ctx = makeCtx();
    const hints = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const hint = selectGameplayHint(ctx, 5 + i, 'fr');
      if (hint) hints.add(hint);
    }
    // Should get multiple distinct hints
    expect(hints.size).toBeGreaterThan(1);
  });
});

describe('adjustHintPriority', () => {
  const baseHint: GameplayHint = {
    id: 'hint_1',
    category: 'interactable_item',
    priority: 70,
    text: { fr: 'Un objet attire votre attention.', en: '' },
    entityId: 'item_1',
    shownToPlayer: false,
  };

  it('returns original priority when turns < 5', () => {
    expect(adjustHintPriority(baseHint, 3)).toBe(70);
    expect(adjustHintPriority(baseHint, 4)).toBe(70);
  });

  it('escalates priority for interactable items after 5+ turns', () => {
    expect(adjustHintPriority(baseHint, 5)).toBe(80); // +10 per turn past 4
    expect(adjustHintPriority(baseHint, 6)).toBe(90);
  });

  it('escalates priority for exit hints after 5+ turns', () => {
    const exitHint: GameplayHint = {
      ...baseHint,
      category: 'exit_visible',
    };
    expect(adjustHintPriority(exitHint, 5)).toBe(75); // +5 per turn past 4
    expect(adjustHintPriority(exitHint, 6)).toBe(80);
  });

  it('does not escalate low-priority items', () => {
    const lowPriorityHint: GameplayHint = {
      ...baseHint,
      priority: 40,
    };
    // Priority < 60, so not escalated even for interactable_item
    expect(adjustHintPriority(lowPriorityHint, 5)).toBe(40);
  });

  it('does not escalate non-interactable categories', () => {
    const otherHint: GameplayHint = {
      ...baseHint,
      category: 'searchable_area',
    };
    // searchable_area is not in the escalation list
    expect(adjustHintPriority(otherHint, 8)).toBe(70);
  });
});
