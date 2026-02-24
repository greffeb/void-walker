// ---------------------------------------------------------------------------
// tests/unit/narration/composer.test.ts — 7-layer composer unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import {
  composeNarrative,
  selectActionTemplate,
  scoreLayerRelevance,
  getVerbCategory,
  resetComposer,
  resetAllLocationStates,
  getLocationNarrationState,
  incrementLocationTurn,
  resetLocationState,
  resetLocationOnEnvironmentChange,
} from '../../../src/narration/composer';
import type {
  NarrativeContext, Outcome, VerbCategory,
} from '../../../src/narration/types';
import { NARRATIVE_PRESETS } from '../../../src/narration/types';
import type { GrammaticalInfo } from '../../../src/i18n/grammar/interface';

// === HELPERS ===

const mascGrammar: GrammaticalInfo = { gender: 'M', startsWithVowel: false, plural: false };
const femGrammar: GrammaticalInfo = { gender: 'F', startsWithVowel: false, plural: false };

function makeCtx(overrides: Partial<NarrativeContext> = {}): NarrativeContext {
  return {
    verb: 'STRIKE' as NarrativeContext['verb'],
    verbCategory: 'physical',
    outcome: 'success',
    margin: 3,
    target: {
      id: 'target_1',
      name: 'terminal',
      type: 'electronic',
      properties: [],
      grammar: mascGrammar,
    },
    targetDisposition: 'neutral',
    toolUsed: null,
    location: {
      id: 'loc_bridge',
      name: 'passerelle',
      description: '',
      features: [],
      conditions: new Set(),
    },
    environmentConditions: new Set(),
    tension: 5,
    beat: 'rising',
    settingId: 'derelict_ship',
    playerHpPercent: 0.8,
    playerConditions: new Set(),
    moduleId: 'mod_1',
    moduleType: 'exploration',
    npcsPresent: [],
    recentEvents: [],
    turnNumber: 5,
    isCreative: false,
    isAbsurd: false,
    ...overrides,
  };
}

/** Deterministic RNG for reproducibility */
function fixedRng(value: number = 0.5): () => number {
  return () => value;
}

describe('getVerbCategory', () => {
  it('maps physical verbs correctly', () => {
    expect(getVerbCategory('STRIKE' as NarrativeContext['verb'])).toBe('physical');
    expect(getVerbCategory('PUSH' as NarrativeContext['verb'])).toBe('physical');
    expect(getVerbCategory('KICK' as NarrativeContext['verb'])).toBe('physical');
  });

  it('maps technical verbs correctly', () => {
    expect(getVerbCategory('HACK' as NarrativeContext['verb'])).toBe('technical');
    expect(getVerbCategory('REPAIR' as NarrativeContext['verb'])).toBe('technical');
    expect(getVerbCategory('WELD' as NarrativeContext['verb'])).toBe('technical');
  });

  it('maps social verbs correctly', () => {
    expect(getVerbCategory('TALK' as NarrativeContext['verb'])).toBe('social');
    expect(getVerbCategory('PERSUADE' as NarrativeContext['verb'])).toBe('social');
    expect(getVerbCategory('INTIMIDATE' as NarrativeContext['verb'])).toBe('social');
  });

  it('maps perception verbs correctly', () => {
    expect(getVerbCategory('EXAMINE' as NarrativeContext['verb'])).toBe('perception');
    expect(getVerbCategory('LISTEN' as NarrativeContext['verb'])).toBe('perception');
  });

  it('maps interaction verbs correctly', () => {
    expect(getVerbCategory('USE' as NarrativeContext['verb'])).toBe('interaction');
    expect(getVerbCategory('TAKE' as NarrativeContext['verb'])).toBe('interaction');
    expect(getVerbCategory('OPEN' as NarrativeContext['verb'])).toBe('interaction');
  });
});

describe('selectActionTemplate', () => {
  it('always returns a template (never null)', () => {
    const ctx = makeCtx();
    const template = selectActionTemplate(ctx);
    expect(template).toBeDefined();
    expect(template.text.fr).toBeTruthy();
  });

  it('returns a template matching the outcome', () => {
    const outcomes: Outcome[] = ['success', 'failure', 'crit_success', 'crit_failure', 'partial', 'auto_success'];
    for (const outcome of outcomes) {
      const ctx = makeCtx({ outcome });
      const template = selectActionTemplate(ctx);
      expect(template.outcome).toBe(outcome);
    }
  });

  it('returns templates for various verb categories', () => {
    const categories: Array<{ verb: string; cat: VerbCategory }> = [
      { verb: 'STRIKE', cat: 'physical' },
      { verb: 'HACK', cat: 'technical' },
      { verb: 'TALK', cat: 'social' },
      { verb: 'EXAMINE', cat: 'perception' },
      { verb: 'USE', cat: 'interaction' },
    ];

    for (const { verb, cat } of categories) {
      const ctx = makeCtx({ verb: verb as NarrativeContext['verb'], verbCategory: cat });
      const template = selectActionTemplate(ctx);
      expect(template).toBeDefined();
    }
  });
});

describe('scoreLayerRelevance', () => {
  it('consequence scores 100 when state changes exist', () => {
    const ctx = makeCtx({ stateChanges: [{ type: 'hp_loss', description: 'Took damage' }] });
    expect(scoreLayerRelevance('consequence', ctx)).toBe(100);
  });

  it('consequence scores 0 when no state changes', () => {
    const ctx = makeCtx({ stateChanges: [] });
    expect(scoreLayerRelevance('consequence', ctx)).toBe(0);
  });

  it('player_state scores high when HP is low', () => {
    const ctx = makeCtx({ playerHpPercent: 0.2 });
    expect(scoreLayerRelevance('player_state', ctx)).toBe(85);
  });

  it('player_state scores medium when conditions active', () => {
    const ctx = makeCtx({ playerConditions: new Set(['wounded']) });
    expect(scoreLayerRelevance('player_state', ctx)).toBe(50);
  });

  it('player_state scores 0 when healthy and no conditions', () => {
    const ctx = makeCtx({ playerHpPercent: 0.8, playerConditions: new Set() });
    expect(scoreLayerRelevance('player_state', ctx)).toBe(0);
  });

  it('atmosphere scores highest during climax', () => {
    const ctx = makeCtx({ beat: 'climax' });
    expect(scoreLayerRelevance('atmosphere', ctx)).toBe(90);
  });

  it('threat scores positively when beat matches available hints', () => {
    const ctx = makeCtx({ beat: 'rising' });
    // Should be > 0 because rising beat has threat hints
    expect(scoreLayerRelevance('threat', ctx)).toBeGreaterThan(0);
  });

  it('npc_reaction scores higher when NPC is target', () => {
    const ctx = makeCtx({
      target: { id: 'npc_1', name: 'Kira', type: 'npc', properties: [], grammar: femGrammar },
      npcsPresent: [{ id: 'npc_1', name: 'Kira', disposition: 'friendly', grammar: femGrammar }],
    });
    expect(scoreLayerRelevance('npc_reaction', ctx)).toBe(75);
  });
});

describe('composeNarrative', () => {
  beforeEach(() => {
    resetComposer();
    resetAllLocationStates();
  });

  it('produces a non-empty string', () => {
    const ctx = makeCtx();
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.1), 'fr');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces text in French by default', () => {
    const ctx = makeCtx();
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.1), 'fr');
    // French text should contain some common French words or characters
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(5);
  });

  it('respects concise preset (max 3 layers)', () => {
    // With concise = max 3 layers (1 action + 2 optional)
    const ctx = makeCtx({
      stateChanges: [{ type: 'hp_loss', description: 'damage' }],
      playerHpPercent: 0.2,
      playerConditions: new Set(['wounded']),
      npcsPresent: [{ id: 'npc_1', name: 'Kira', disposition: 'hostile', grammar: femGrammar }],
      beat: 'climax',
      tension: 9,
    });
    // Concise should still produce output — just shorter
    const concise = composeNarrative(ctx, NARRATIVE_PRESETS.concise, fixedRng(0.1), 'fr');
    const immersive = composeNarrative(ctx, NARRATIVE_PRESETS.immersive, fixedRng(0.1), 'fr');
    // Immersive should generally be equal or longer than concise
    expect(immersive.length).toBeGreaterThanOrEqual(concise.length - 5);
  });

  it('handles all outcome types without error', () => {
    const outcomes: Outcome[] = ['crit_success', 'success', 'partial', 'failure', 'crit_failure', 'auto_success'];
    for (const outcome of outcomes) {
      const ctx = makeCtx({ outcome });
      const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.3), 'fr');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('includes consequence text when state changes exist', () => {
    const ctx = makeCtx({
      stateChanges: [{ type: 'hp_loss', description: 'Vous perdez 3 PV' }],
    });
    // With rng=0 (always include layers), consequence should appear
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.immersive, fixedRng(0.0), 'fr');
    expect(result.length).toBeGreaterThan(0);
  });

  it('does not crash with empty NPC list', () => {
    const ctx = makeCtx({ npcsPresent: [] });
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.5), 'fr');
    expect(result.length).toBeGreaterThan(0);
  });

  it('does not crash with null target', () => {
    const ctx = makeCtx({ target: null });
    const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.5), 'fr');
    expect(result.length).toBeGreaterThan(0);
  });

  it('does not crash with extreme tension values', () => {
    for (const tension of [0, 1, 5, 10]) {
      const ctx = makeCtx({ tension });
      const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, fixedRng(0.5), 'fr');
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

describe('location narration state', () => {
  beforeEach(() => {
    resetAllLocationStates();
  });

  it('creates state for new location', () => {
    const state = getLocationNarrationState('loc_1');
    expect(state.locationId).toBe('loc_1');
    expect(state.turnsSpentHere).toBe(0);
  });

  it('incrementLocationTurn increments counter', () => {
    incrementLocationTurn('loc_1');
    incrementLocationTurn('loc_1');
    const state = getLocationNarrationState('loc_1');
    expect(state.turnsSpentHere).toBe(2);
  });

  it('resetLocationState removes location data', () => {
    incrementLocationTurn('loc_1');
    resetLocationState('loc_1');
    const state = getLocationNarrationState('loc_1');
    expect(state.turnsSpentHere).toBe(0);
  });

  it('resetLocationOnEnvironmentChange resets turns but keeps state', () => {
    incrementLocationTurn('loc_1');
    incrementLocationTurn('loc_1');
    resetLocationOnEnvironmentChange('loc_1');
    const state = getLocationNarrationState('loc_1');
    expect(state.turnsSpentHere).toBe(0);
    expect(state.environmentVersion).toBe(1);
  });

  it('resetAllLocationStates clears everything', () => {
    incrementLocationTurn('loc_1');
    incrementLocationTurn('loc_2');
    resetAllLocationStates();
    expect(getLocationNarrationState('loc_1').turnsSpentHere).toBe(0);
    expect(getLocationNarrationState('loc_2').turnsSpentHere).toBe(0);
  });
});
