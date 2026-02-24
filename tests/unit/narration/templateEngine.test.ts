// ---------------------------------------------------------------------------
// tests/unit/narration/templateEngine.test.ts — Template slot engine tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { renderTemplate, renderTemplateWithSlots, detectSelfReference, getGrammarEngine } from '../../../src/narration/templateEngine';
import type { NarrativeContext, TargetInfo, LocationInfo } from '../../../src/narration/types';
import type { GrammaticalInfo } from '../../../src/i18n/grammar/interface';

// === TEST HELPERS ===

const mascGrammar: GrammaticalInfo = { gender: 'M', startsWithVowel: false, plural: false };
const femGrammar: GrammaticalInfo = { gender: 'F', startsWithVowel: false, plural: false };
const mascVowelGrammar: GrammaticalInfo = { gender: 'M', startsWithVowel: true, plural: false };

function makeTarget(overrides: Partial<TargetInfo> = {}): TargetInfo {
  return {
    id: 'target_1',
    name: 'terminal',
    type: 'electronic',
    properties: [],
    grammar: mascGrammar,
    ...overrides,
  };
}

function makeLocation(): LocationInfo {
  return {
    id: 'loc_bridge',
    name: 'passerelle',
    description: '',
    features: [],
    conditions: new Set(),
  };
}

function makeCtx(overrides: Partial<NarrativeContext> = {}): NarrativeContext {
  return {
    verb: 'HACK' as NarrativeContext['verb'],
    verbCategory: 'technical',
    outcome: 'success',
    margin: 3,
    target: makeTarget(),
    targetDisposition: 'neutral',
    toolUsed: null,
    location: makeLocation(),
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

describe('getGrammarEngine', () => {
  it('returns French engine for "fr" locale', () => {
    const engine = getGrammarEngine('fr');
    expect(engine.locale).toBe('fr');
  });

  it('returns English engine for "en" locale', () => {
    const engine = getGrammarEngine('en');
    expect(engine.locale).toBe('en');
  });
});

describe('renderTemplate', () => {
  it('returns plain text unchanged', () => {
    const result = renderTemplate('Vous avancez prudemment.', null, 'fr');
    expect(result).toContain('Vous avancez prudemment');
  });

  it('resolves {actor} to "Vous"', () => {
    const ctx = makeCtx();
    const result = renderTemplate('{actor} frappe.', ctx, 'fr');
    expect(result).toContain('Vous');
  });

  it('resolves {def_target} with definite article', () => {
    const ctx = makeCtx({
      target: makeTarget({ name: 'terminal', grammar: mascGrammar }),
    });
    const result = renderTemplate('Vous examinez {def_target}.', ctx, 'fr');
    expect(result).toContain('le terminal');
  });

  it('resolves {def_target} with elision for vowels', () => {
    const ctx = makeCtx({
      target: makeTarget({ name: 'écran', grammar: mascVowelGrammar }),
    });
    const result = renderTemplate('Vous examinez {def_target}.', ctx, 'fr');
    expect(result).toContain("l'écran");
  });

  it('resolves {indef_target} with indefinite article', () => {
    const ctx = makeCtx({
      target: makeTarget({ name: 'clé', grammar: femGrammar }),
    });
    const result = renderTemplate('Vous trouvez {indef_target}.', ctx, 'fr');
    expect(result).toContain('une clé');
  });

  it('resolves {de_target} with contraction', () => {
    const ctx = makeCtx({
      target: makeTarget({ name: 'terminal', grammar: mascGrammar }),
    });
    const result = renderTemplate("Vous vous approchez {de_target}.", ctx, 'fr');
    expect(result).toContain('du terminal');
  });

  it('resolves {a_target} with contraction', () => {
    const ctx = makeCtx({
      target: makeTarget({ name: 'terminal', grammar: mascGrammar }),
    });
    const result = renderTemplate('Vous accédez {a_target}.', ctx, 'fr');
    expect(result).toContain('au terminal');
  });

  it('resolves {def_tool} when tool is present', () => {
    const ctx = makeCtx({
      toolUsed: { id: 'tool_1', name: 'tournevis', grammar: mascGrammar },
    });
    const result = renderTemplate('Vous utilisez {def_tool}.', ctx, 'fr');
    expect(result).toContain('le tournevis');
  });

  it('resolves {npc_name} slot', () => {
    const ctx = makeCtx({
      npcsPresent: [{
        id: 'npc_1',
        name: 'Kira',
        disposition: 'friendly',
        grammar: femGrammar,
      }],
    });
    const result = renderTemplate('{npc_name} observe.', ctx, 'fr');
    expect(result).toContain('Kira');
  });

  it('replaces missing slots with empty string', () => {
    const ctx = makeCtx({ target: null });
    const result = renderTemplate('Vous frappez {def_target}.', ctx, 'fr');
    // Target is null, so {def_target} resolves to empty
    expect(result).not.toContain('{def_target}');
  });
});

describe('renderTemplate — conditionals', () => {
  it('resolves {?slot:yes|no} to yes when slot present', () => {
    const ctx = makeCtx({
      toolUsed: { id: 'tool_1', name: 'tournevis', grammar: mascGrammar },
    });
    const result = renderTemplate(
      'Vous frappez{?tool_used: avec {def_tool}| à mains nues}.',
      ctx, 'fr',
    );
    expect(result).toContain('avec le tournevis');
  });

  it('resolves {?slot:yes|no} to no when slot absent', () => {
    const ctx = makeCtx({ toolUsed: null });
    const result = renderTemplate(
      'Vous frappez{?tool_used: avec {def_tool}| à mains nues}.',
      ctx, 'fr',
    );
    expect(result).toContain('à mains nues');
  });
});

describe('renderTemplate — adjective agreement', () => {
  it('resolves {target_adj:adjective} with gender agreement', () => {
    const ctx = makeCtx({
      target: makeTarget({ name: 'porte', grammar: femGrammar }),
    });
    const result = renderTemplate('{def_target} est {target_adj:ouvert}.', ctx, 'fr');
    expect(result).toContain('ouverte');
  });
});

describe('renderTemplateWithSlots', () => {
  it('renders with explicit slot overrides', () => {
    const result = renderTemplateWithSlots(
      'Vous examinez {target}.',
      { target: 'le panneau' },
      'fr',
    );
    expect(result).toContain('le panneau');
  });

  it('handles missing overrides gracefully', () => {
    const result = renderTemplateWithSlots(
      'Vous touchez {target}.',
      {},
      'fr',
    );
    expect(result).not.toContain('{target}');
  });
});

describe('detectSelfReference', () => {
  it('returns true when NPC is the same entity as target', () => {
    const ctx = makeCtx({
      target: makeTarget({ id: 'npc_kira' }),
      npcsPresent: [{
        id: 'npc_kira',
        name: 'Kira',
        disposition: 'friendly',
        grammar: femGrammar,
      }],
    });
    expect(detectSelfReference(ctx)).toBe(true);
  });

  it('returns false when target is not an NPC', () => {
    const ctx = makeCtx({
      target: makeTarget({ id: 'terminal_1' }),
      npcsPresent: [{
        id: 'npc_kira',
        name: 'Kira',
        disposition: 'friendly',
        grammar: femGrammar,
      }],
    });
    expect(detectSelfReference(ctx)).toBe(false);
  });

  it('returns false when no target', () => {
    const ctx = makeCtx({ target: null });
    expect(detectSelfReference(ctx)).toBe(false);
  });
});
