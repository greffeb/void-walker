// ---------------------------------------------------------------------------
// tests/unit/engine/secretVerbs.test.ts — Easter-egg verbs (decision W)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { isSecretVerb, tierForUse, useSecretVerb } from '../../../src/engine/secretVerbs';
import { SECRET_VERBS, VERB_REGISTRY, VERB_IDS } from '../../../src/engine/verbs';
import { SUGGESTION_EXCLUDED_VERB_IDS, isExcludedFromSuggestions } from '../../../src/engine/suggestions';
import { BALANCE } from '../../../src/engine/constants';
import { createInitialGameState } from '../../../src/engine/types';
import { buildParserLocaleData } from '../../../src/content/parserData';
import { parseAction } from '../../../src/engine/parser';
import { isReformulation, isRefusal } from '../../../src/engine/types';
import { selectSecretVerbText } from '../../../src/narration/secretVerbs';
import { SECRET_VERB_TEMPLATES } from '../../../src/content/templates/secrets';
import type { SceneContext } from '../../../src/engine/types';
import type { VerbId } from '../../../src/engine/verbs';

const localeData = buildParserLocaleData('fr');

const EXPECTED: readonly VerbId[] = [
  'PRAY', 'DANCE', 'NAME', 'SING', 'APOLOGIZE', 'WHISPER', 'REMEMBER',
];

function emptyScene(): SceneContext {
  return {
    inventory: [], locationItems: [], npcs: [], environmentFeatures: [],
    connectedLocations: [], suggestions: [], environmentConditions: [],
  };
}

describe('the seven secret verbs exist', () => {
  it('all seven are in the registry, marked secret', () => {
    for (const verb of EXPECTED) {
      expect(VERB_IDS).toContain(verb);
      expect(VERB_REGISTRY[verb].secret).toBe(true);
      expect(isSecretVerb(verb)).toBe(true);
    }
    expect(SECRET_VERBS.size).toBe(EXPECTED.length);
  });

  it('an ordinary verb is not secret', () => {
    expect(isSecretVerb('STRIKE')).toBe(false);
    expect(isSecretVerb('EXAMINE')).toBe(false);
  });

  it('each one can be typed in French', () => {
    // Before decision W they were unparsable: "prier" was routed to TOUCH by a
    // workaround in the obstacle verb map.
    const inputs: Readonly<Record<string, VerbId>> = {
      'prier': 'PRAY',
      'danser': 'DANCE',
      'nommer la créature': 'NAME',
      'chanter': 'SING',
      "s'excuser": 'APOLOGIZE',
      'chuchoter': 'WHISPER',
      'se souvenir': 'REMEMBER',
    };
    for (const [input, verb] of Object.entries(inputs)) {
      const result = parseAction(input, emptyScene(), localeData);
      expect(isReformulation(result) || isRefusal(result)).toBe(false);
      if (isReformulation(result) || isRefusal(result)) continue;
      expect(result.verb).toBe(verb);
    }
  });

  it('the game never proposes them', () => {
    for (const verb of EXPECTED) {
      expect(isExcludedFromSuggestions(verb)).toBe(true);
      expect(SUGGESTION_EXCLUDED_VERB_IDS.has(verb)).toBe(true);
    }
  });
});

describe('the world tires of a repeated gesture', () => {
  it('first use is a discovery, then it lands, then it wears out', () => {
    expect(tierForUse(1)).toBe('discovery');
    expect(tierForUse(2)).toBe('effect');
    expect(tierForUse(BALANCE.SECRET_VERB.EFFECT_USES)).toBe('effect');
    expect(tierForUse(BALANCE.SECRET_VERB.EFFECT_USES + 1)).toBe('annoyed');
    expect(tierForUse(BALANCE.SECRET_VERB.BLOCKED_USES)).toBe('annoyed');
    expect(tierForUse(BALANCE.SECRET_VERB.BLOCKED_USES + 1)).toBe('blocked');
  });

  it('each verb wears out on its own count', () => {
    let state = createInitialGameState();
    for (let i = 0; i < BALANCE.SECRET_VERB.BLOCKED_USES + 1; i++) {
      state = useSecretVerb(state, 'PRAY').state;
    }
    expect(useSecretVerb(state, 'PRAY').tier).toBe('blocked');
    expect(useSecretVerb(state, 'SING').tier).toBe('discovery');
  });

  it('the count is kept in the state, not in a module variable', () => {
    const fresh = createInitialGameState();
    const after = useSecretVerb(fresh, 'DANCE').state;
    expect(fresh.secretVerbUses.DANCE).toBeUndefined();
    expect(after.secretVerbUses.DANCE).toBe(1);
  });
});

describe('the templates written in phase 5 are finally read', () => {
  it('every secret verb has words for its discovery', () => {
    for (const verb of EXPECTED) {
      const text = selectSecretVerbText(verb, 'discovery', 'fr', () => 0);
      expect(text).not.toBeNull();
      expect(text!.length).toBeGreaterThan(0);
    }
  });

  it('a worn-out gesture is answered by a rejection, not by its discovery', () => {
    const discovery = selectSecretVerbText('PRAY', 'discovery', 'fr', () => 0);
    const annoyed = selectSecretVerbText('PRAY', 'annoyed', 'fr', () => 0);
    const blocked = selectSecretVerbText('PRAY', 'blocked', 'fr', () => 0);
    expect(annoyed).not.toBe(discovery);
    expect(blocked).not.toBe(discovery);
    expect(blocked).not.toBe(annoyed);
  });

  it('a setting-specific variant wins when the content wrote one', () => {
    const generic = selectSecretVerbText('PRAY', 'effect', 'fr', () => 0);
    const inRuins = selectSecretVerbText('PRAY', 'effect', 'fr', () => 0, 'alien_ruins');
    expect(inRuins).not.toBe(generic);
    expect(inRuins).toContain('ruines');
  });

  it('a tier nobody wrote falls back rather than printing nothing', () => {
    // DANCE has an "annoyed" rejection but no "blocked" one.
    const hasBlocked = SECRET_VERB_TEMPLATES.some(
      t => t.verb === 'DANCE' && t.rejectionTier === 'blocked',
    );
    expect(hasBlocked).toBe(false);
    expect(selectSecretVerbText('DANCE', 'blocked', 'fr', () => 0)).not.toBeNull();
  });
});
