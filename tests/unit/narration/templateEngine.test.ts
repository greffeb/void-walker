// ---------------------------------------------------------------------------
// tests/unit/narration/templateEngine.test.ts — Template slot engine tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { renderTemplate, renderTemplateWithSlots, detectSelfReference, getGrammarEngine } from '../../../src/narration/templateEngine';
import { selectActionTemplate } from '../../../src/narration/composer';
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

// ---------------------------------------------------------------------------
// Regression: conditional with nested {slot} reference (issues #22 #23 #24)
// The old regex /\{\?(\w+):([^}]*?)\|([^}]*?)\}/ stopped at the first }
// inside {def_tool}, leaving the conditional unresolved.
// Fix: regex now allows one level of nested {…} in true/false branches.
// ---------------------------------------------------------------------------
describe('renderTemplate — nested slot inside conditional (issue #23 regression)', () => {
  it('resolves {?tool_used: via {def_tool}|} when tool is present', () => {
    const ctx = makeCtx({
      target: makeTarget({ name: 'porte blindée', grammar: femGrammar }),
      toolUsed: { id: 'laser_pistol', name: 'Pistolet laser', grammar: mascGrammar },
    });
    const result = renderTemplate(
      'Vous forcez {def_target}{?tool_used: via {def_tool}|}.',
      ctx, 'fr',
    );
    // Must not contain raw template syntax
    expect(result).not.toMatch(/\{/);
    expect(result).toContain('via le Pistolet laser');
  });

  it('resolves {?tool_used: via {def_tool}|} to empty when tool absent', () => {
    const ctx = makeCtx({
      target: makeTarget({ name: 'porte blindée', grammar: femGrammar }),
      toolUsed: null,
    });
    const result = renderTemplate(
      'Vous forcez {def_target}{?tool_used: via {def_tool}|}.',
      ctx, 'fr',
    );
    expect(result).not.toMatch(/\{/);
    expect(result).not.toContain('via');
    expect(result).toContain('Vous forcez');
  });

  it('resolves {?tool_used: avec {def_tool}|} pattern used in BARRICADE/FORCE_OPEN templates', () => {
    const ctx = makeCtx({
      toolUsed: { id: 'multitool', name: 'Multitool', grammar: mascGrammar },
    });
    const result = renderTemplate(
      'Action réussie{?tool_used: avec {def_tool}|}.',
      ctx, 'fr',
    );
    expect(result).not.toMatch(/\{/);
    expect(result).toContain('avec le Multitool');
  });
});

// ---------------------------------------------------------------------------
// Regression: BARRICADE, FORCE_OPEN, RUN templates exist and are contextually
// appropriate (issues #22, #23, #24)
// ---------------------------------------------------------------------------
describe('selectActionTemplate — BARRICADE / FORCE_OPEN / RUN have dedicated templates', () => {
  function makeComposerCtx(verb: NarrativeContext['verb'], outcome: NarrativeContext['outcome']): NarrativeContext {
    return makeCtx({ verb, verbCategory: 'physical', outcome, tension: 5 });
  }

  it('BARRICADE success does not select a physical fallback mentioning "appliquez votre force"', () => {
    const ctx = makeComposerCtx('BARRICADE', 'success');
    const tpl = selectActionTemplate(ctx);
    expect(tpl.text.fr).not.toContain('appliquez votre force');
    expect(tpl.verb).toBe('BARRICADE');
  });

  it('FORCE_OPEN success selects a dedicated FORCE_OPEN template', () => {
    const ctx = makeComposerCtx('FORCE_OPEN', 'success');
    const tpl = selectActionTemplate(ctx);
    expect(tpl.verb).toBe('FORCE_OPEN');
    expect(tpl.text.fr).not.toContain('appliquez votre force');
  });

  it('RUN success selects a dedicated RUN template', () => {
    const ctx = makeComposerCtx('RUN', 'success');
    const tpl = selectActionTemplate(ctx);
    expect(tpl.verb).toBe('RUN');
    expect(tpl.text.fr).not.toContain('appliquez votre force');
  });

  it('RUN crit_success renders without raw template syntax', () => {
    const ctx = makeComposerCtx('RUN', 'crit_success');
    const tpl = selectActionTemplate(ctx);
    const rendered = renderTemplate(tpl.text.fr, ctx, 'fr');
    expect(rendered).not.toMatch(/\{/);
    expect(rendered.length).toBeGreaterThan(5);
  });

  it('BARRICADE failure renders without raw template syntax', () => {
    const ctx = makeComposerCtx('BARRICADE', 'failure');
    const tpl = selectActionTemplate(ctx);
    const rendered = renderTemplate(tpl.text.fr, ctx, 'fr');
    expect(rendered).not.toMatch(/\{/);
  });

  it('FORCE_OPEN with tool renders correctly via nested conditional', () => {
    const ctx = makeCtx({
      verb: 'FORCE_OPEN',
      verbCategory: 'physical',
      outcome: 'success',
      tension: 5,
      target: makeTarget({ name: 'Porte blindée', grammar: femGrammar }),
      toolUsed: { id: 'multitool', name: 'Multitool', grammar: mascGrammar },
    });
    const tpl = selectActionTemplate(ctx);
    const rendered = renderTemplate(tpl.text.fr, ctx, 'fr');
    expect(rendered).not.toMatch(/\{/);
    // When tool is present, template branch should mention it
    expect(rendered).toContain('Multitool');
  });
});
