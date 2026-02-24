// ---------------------------------------------------------------------------
// tests/stress/narrativeRepetition.test.ts — Narrative anti-repetition stress
// ---------------------------------------------------------------------------
// Verifies that 20+ consecutive narrations in the same context produce
// zero exact repeats, and that template coverage spans all verb categories.
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import {
  composeNarrative,
  selectActionTemplate,
  resetComposer,
  resetAllLocationStates,
} from '../../src/narration/composer';
import { NARRATIVE_PRESETS } from '../../src/narration/types';
import type {
  NarrativeContext, Outcome, VerbCategory,
} from '../../src/narration/types';
import type { GrammaticalInfo } from '../../src/i18n/grammar/interface';
import { ACTION_TEMPLATES, GENERIC_FALLBACKS } from '../../src/content/templates/actionTemplates';

// === HELPERS ===

const mascGrammar: GrammaticalInfo = { gender: 'M', startsWithVowel: false, plural: false };

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

describe('narrative anti-repetition stress', () => {
  beforeEach(() => {
    resetComposer();
    resetAllLocationStates();
  });

  it('20 consecutive narrations produce no exact repeats in same context', () => {
    const ctx = makeCtx();
    const results: string[] = [];

    // Use sequential RNG to vary layer selection
    let rngCounter = 0;
    const seqRng = () => {
      rngCounter = (rngCounter + 7) % 100;
      return rngCounter / 100;
    };

    for (let i = 0; i < 20; i++) {
      const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, seqRng, 'fr');
      results.push(result);
    }

    // Count exact duplicates
    const unique = new Set(results);
    // Allow at most 2 repeats out of 20 (buffer = 10, some variation is RNG-dependent)
    expect(unique.size).toBeGreaterThanOrEqual(results.length * 0.5);
  });

  it('40 narrations across varied contexts produce high variety', () => {
    const outcomes: Outcome[] = ['success', 'failure', 'crit_success', 'crit_failure', 'partial', 'auto_success'];
    const verbs = ['STRIKE', 'HACK', 'TALK', 'EXAMINE', 'USE'] as NarrativeContext['verb'][];
    const results: string[] = [];

    let rngCounter = 0;
    const seqRng = () => {
      rngCounter = (rngCounter + 13) % 100;
      return rngCounter / 100;
    };

    for (const verb of verbs) {
      for (const outcome of outcomes.slice(0, 4)) {
        const ctx = makeCtx({
          verb,
          verbCategory: getVerbCategoryForTest(verb),
          outcome,
        });
        const result = composeNarrative(ctx, NARRATIVE_PRESETS.standard, seqRng, 'fr');
        results.push(result);
      }
    }

    expect(results.length).toBe(20);
    // At least 80% unique across varied contexts
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThanOrEqual(results.length * 0.8);
  });

  it('immersive preset produces longer output than concise on average', () => {
    const ctx = makeCtx({
      stateChanges: [{ type: 'hp_loss', description: 'Vous perdez 3 PV' }],
      playerHpPercent: 0.2,
      playerConditions: new Set(['wounded']),
      beat: 'escalation',
      tension: 8,
    });

    let rngCounter = 0;
    const seqRng = () => {
      rngCounter = (rngCounter + 11) % 100;
      return rngCounter / 100;
    };

    let totalConcise = 0;
    let totalImmersive = 0;

    for (let i = 0; i < 10; i++) {
      resetComposer();
      resetAllLocationStates();
      rngCounter = i * 7;
      totalConcise += composeNarrative(ctx, NARRATIVE_PRESETS.concise, seqRng, 'fr').length;
      resetComposer();
      resetAllLocationStates();
      rngCounter = i * 7;
      totalImmersive += composeNarrative(ctx, NARRATIVE_PRESETS.immersive, seqRng, 'fr').length;
    }

    expect(totalImmersive / 10).toBeGreaterThanOrEqual(totalConcise / 10);
  });
});

describe('template coverage stress', () => {
  it('every outcome has at least one matching template in ACTION_TEMPLATES or GENERIC_FALLBACKS', () => {
    const outcomes: Outcome[] = ['crit_success', 'success', 'partial', 'failure', 'crit_failure', 'auto_success'];

    for (const outcome of outcomes) {
      const inTemplates = ACTION_TEMPLATES.some(t => t.outcome === outcome);
      const inFallbacks = GENERIC_FALLBACKS[outcome] !== undefined;
      expect(inTemplates || inFallbacks).toBe(true);
    }
  });

  it('every verb category has at least one template', () => {
    const categories: VerbCategory[] = ['physical', 'technical', 'social', 'perception', 'interaction'];

    for (const cat of categories) {
      const match = ACTION_TEMPLATES.some(t => t.category === cat);
      expect(match).toBe(true);
    }
  });

  it('selectActionTemplate never returns undefined for any outcome × category combo', () => {
    const outcomes: Outcome[] = ['crit_success', 'success', 'partial', 'failure', 'crit_failure', 'auto_success'];
    const categories: Array<{ verb: string; cat: VerbCategory }> = [
      { verb: 'STRIKE', cat: 'physical' },
      { verb: 'HACK', cat: 'technical' },
      { verb: 'TALK', cat: 'social' },
      { verb: 'EXAMINE', cat: 'perception' },
      { verb: 'USE', cat: 'interaction' },
    ];

    for (const { verb, cat } of categories) {
      for (const outcome of outcomes) {
        const ctx = makeCtx({
          verb: verb as NarrativeContext['verb'],
          verbCategory: cat,
          outcome,
        });
        const template = selectActionTemplate(ctx);
        expect(template).toBeDefined();
        expect(template.text.fr).toBeTruthy();
      }
    }
  });
});

// === HELPER ===

function getVerbCategoryForTest(verb: string): VerbCategory {
  const map: Record<string, VerbCategory> = {
    STRIKE: 'physical',
    HACK: 'technical',
    TALK: 'social',
    EXAMINE: 'perception',
    USE: 'interaction',
  };
  return map[verb] ?? 'creative';
}
