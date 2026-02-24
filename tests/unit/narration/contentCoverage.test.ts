// ---------------------------------------------------------------------------
// tests/unit/narration/contentCoverage.test.ts — Content template coverage
// ---------------------------------------------------------------------------
// Ensures all template arrays are non-empty, structurally valid, and cover
// the necessary dimensions (outcomes, settings, beats, dispositions, etc.)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { ACTION_TEMPLATES, GENERIC_FALLBACKS } from '../../../src/content/templates/actionTemplates';
import { SENSORY_POOLS } from '../../../src/content/templates/sensory';
import { ATMOSPHERE_SNIPPETS } from '../../../src/content/templates/atmosphere';
import { PLAYER_STATE_SNIPPETS } from '../../../src/content/templates/conditions';
import { NPC_REACTION_SNIPPETS } from '../../../src/content/templates/npcReactions';
import { CONSEQUENCE_SNIPPETS } from '../../../src/content/templates/environmental';
import { THREAT_HINT_SNIPPETS } from '../../../src/content/templates/threats';
import { HINT_TEMPLATES } from '../../../src/content/templates/hints';
import { SECRET_VERB_TEMPLATES } from '../../../src/content/templates/secrets';
import type { Outcome, TensionTier, BeatZone, Disposition, HintCategory } from '../../../src/narration/types';

describe('ACTION_TEMPLATES', () => {
  it('array is non-empty', () => {
    expect(ACTION_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('every template has required fields', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.outcome).toBeTruthy();
      expect(t.text.fr).toBeTruthy();
      expect(t.category).toBeTruthy();
    }
  });

  it('all IDs are unique', () => {
    const ids = ACTION_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('GENERIC_FALLBACKS cover all outcomes', () => {
    const outcomes: Outcome[] = ['crit_success', 'success', 'partial', 'failure', 'crit_failure', 'auto_success'];
    for (const outcome of outcomes) {
      expect(GENERIC_FALLBACKS[outcome]).toBeDefined();
      expect(GENERIC_FALLBACKS[outcome].text.fr).toBeTruthy();
    }
  });
});

describe('SENSORY_POOLS', () => {
  it('has at least one setting', () => {
    expect(Object.keys(SENSORY_POOLS).length).toBeGreaterThan(0);
  });

  it('derelict_ship setting has a default pool', () => {
    const pool = SENSORY_POOLS['derelict_ship'];
    expect(pool).toBeDefined();
    expect(pool['default']).toBeDefined();
    expect(pool['default'].length).toBeGreaterThan(0);
  });

  it('every snippet has required fields', () => {
    for (const [setting, pools] of Object.entries(SENSORY_POOLS)) {
      for (const [_condition, snippets] of Object.entries(pools)) {
        for (const s of snippets) {
          expect(s.id).toBeTruthy();
          expect(s.setting).toBe(setting);
          expect(s.text.fr).toBeTruthy();
        }
      }
    }
  });

  it('all IDs are unique across all settings', () => {
    const ids: string[] = [];
    for (const pools of Object.values(SENSORY_POOLS)) {
      for (const snippets of Object.values(pools)) {
        for (const s of snippets) {
          ids.push(s.id);
        }
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('ATMOSPHERE_SNIPPETS', () => {
  it('array is non-empty', () => {
    expect(ATMOSPHERE_SNIPPETS.length).toBeGreaterThan(0);
  });

  it('covers derelict_ship setting', () => {
    const ds = ATMOSPHERE_SNIPPETS.filter(s => s.setting === 'derelict_ship');
    expect(ds.length).toBeGreaterThan(0);
  });

  it('covers all tension tiers', () => {
    const tiers: Array<TensionTier | 'climax'> = ['low', 'mid', 'high', 'climax'];
    for (const tier of tiers) {
      const match = ATMOSPHERE_SNIPPETS.filter(s => s.tensionTier === tier);
      expect(match.length).toBeGreaterThan(0);
    }
  });

  it('every snippet has French text', () => {
    for (const s of ATMOSPHERE_SNIPPETS) {
      expect(s.text.fr).toBeTruthy();
    }
  });
});

describe('PLAYER_STATE_SNIPPETS', () => {
  it('array is non-empty', () => {
    expect(PLAYER_STATE_SNIPPETS.length).toBeGreaterThan(0);
  });

  it('covers low_hp type', () => {
    const lowHp = PLAYER_STATE_SNIPPETS.filter(s => s.type === 'low_hp');
    expect(lowHp.length).toBeGreaterThan(0);
  });

  it('covers mild_fatigue type', () => {
    const fatigue = PLAYER_STATE_SNIPPETS.filter(s => s.type === 'mild_fatigue');
    expect(fatigue.length).toBeGreaterThan(0);
  });

  it('covers at least one condition-specific snippet', () => {
    const conditions = PLAYER_STATE_SNIPPETS.filter(s => s.type === 'condition');
    expect(conditions.length).toBeGreaterThan(0);
  });
});

describe('NPC_REACTION_SNIPPETS', () => {
  it('array is non-empty', () => {
    expect(NPC_REACTION_SNIPPETS.length).toBeGreaterThan(0);
  });

  it('covers all dispositions', () => {
    const dispositions: Disposition[] = ['hostile', 'neutral', 'friendly', 'frightened'];
    for (const d of dispositions) {
      const match = NPC_REACTION_SNIPPETS.filter(s => s.disposition === d);
      expect(match.length).toBeGreaterThan(0);
    }
  });

  it('every snippet has French text', () => {
    for (const s of NPC_REACTION_SNIPPETS) {
      expect(s.text.fr).toBeTruthy();
    }
  });
});

describe('CONSEQUENCE_SNIPPETS', () => {
  it('array is non-empty', () => {
    expect(CONSEQUENCE_SNIPPETS.length).toBeGreaterThan(0);
  });

  it('covers hp_loss and item_gained state change types', () => {
    const hpLoss = CONSEQUENCE_SNIPPETS.filter(s => s.stateChangeType === 'hp_loss');
    const itemGained = CONSEQUENCE_SNIPPETS.filter(s => s.stateChangeType === 'item_gained');
    expect(hpLoss.length).toBeGreaterThan(0);
    expect(itemGained.length).toBeGreaterThan(0);
  });

  it('all IDs are unique', () => {
    const ids = CONSEQUENCE_SNIPPETS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('THREAT_HINT_SNIPPETS', () => {
  it('array is non-empty', () => {
    expect(THREAT_HINT_SNIPPETS.length).toBeGreaterThan(0);
  });

  it('covers all story beats', () => {
    const beats: BeatZone[] = ['intro', 'rising', 'midpoint', 'escalation', 'climax', 'resolution'];
    for (const beat of beats) {
      const match = THREAT_HINT_SNIPPETS.filter(s => s.beat === beat);
      expect(match.length).toBeGreaterThan(0);
    }
  });
});

describe('HINT_TEMPLATES', () => {
  it('array is non-empty', () => {
    expect(HINT_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('covers all hint categories', () => {
    const categories: HintCategory[] = [
      'interactable_item', 'searchable_area', 'exit_visible',
      'exit_hidden', 'npc_state', 'environmental_change',
    ];
    for (const cat of categories) {
      const match = HINT_TEMPLATES.filter(t => t.category === cat);
      expect(match.length).toBeGreaterThan(0);
    }
  });
});

describe('SECRET_VERB_TEMPLATES', () => {
  it('array is non-empty', () => {
    expect(SECRET_VERB_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('covers multiple secret verbs', () => {
    const verbs = new Set(SECRET_VERB_TEMPLATES.map(t => t.verb));
    expect(verbs.size).toBeGreaterThanOrEqual(5);
  });

  it('has discovery, effect, and rejection types', () => {
    const types = new Set(SECRET_VERB_TEMPLATES.map(t => t.type));
    expect(types.has('discovery')).toBe(true);
    expect(types.has('effect')).toBe(true);
    expect(types.has('rejection')).toBe(true);
  });

  it('every template has French text', () => {
    for (const t of SECRET_VERB_TEMPLATES) {
      expect(t.text.fr).toBeTruthy();
    }
  });
});
