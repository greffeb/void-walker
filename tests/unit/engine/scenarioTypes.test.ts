// ---------------------------------------------------------------------------
// tests/unit/engine/scenarioTypes.test.ts — Chantier 1 type guard tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import type { FeatureDefinition, ItemDefinition } from '../../../src/engine/scenario';
import { isEnrichedFeature, isEnrichedItem } from '../../../src/engine/scenario';
import type { ScenarioFeatureDefinition, ScenarioItemDefinition } from '../../../src/engine/scenario';

describe('isEnrichedFeature', () => {
  it('returns true when featureType is present', () => {
    const def: ScenarioFeatureDefinition = {
      id: 'blast_door',
      featureType: 'door',
    };
    expect(isEnrichedFeature(def)).toBe(true);
  });

  it('returns true when interactions are present', () => {
    const def: ScenarioFeatureDefinition = {
      id: 'emergency_locker',
      interactions: [
        {
          trigger: { verb: 'OPEN', dc: null },
          onSuccess: { newState: 'open' },
        },
      ],
    };
    expect(isEnrichedFeature(def)).toBe(true);
  });

  it('returns true when aliases are present', () => {
    const def: ScenarioFeatureDefinition = {
      id: 'vent_cover',
      aliases: { fr: ['grille de ventilation'], en: ['vent grate'] },
    };
    expect(isEnrichedFeature(def)).toBe(true);
  });

  it('returns true when descriptions are present', () => {
    const def: ScenarioFeatureDefinition = {
      id: 'status_terminal',
      descriptions: { intact: { fr: 'Écran allumé', en: 'Screen on' } },
    };
    expect(isEnrichedFeature(def)).toBe(true);
  });

  it('returns false for legacy FeatureDefinition without enriched fields', () => {
    const def: FeatureDefinition = {
      id: 'old_panel',
      initialState: 'intact',
      examineResult: { fr: 'Vieux panneau', en: 'Old panel' },
    };
    expect(isEnrichedFeature(def)).toBe(false);
  });
});

describe('isEnrichedItem', () => {
  it('returns true when itemType is present', () => {
    const def: ScenarioItemDefinition = {
      id: 'access_keycard',
      itemType: 'key_item',
    };
    expect(isEnrichedItem(def)).toBe(true);
  });

  it('returns true when aliases are present', () => {
    const def: ScenarioItemDefinition = {
      id: 'oxygen_canister',
      aliases: { fr: ['bouteille d\'oxygène', 'O2'], en: ['oxygen tank', 'O2'] },
    };
    expect(isEnrichedItem(def)).toBe(true);
  });

  it('returns true when useOn is present', () => {
    const def: ScenarioItemDefinition = {
      id: 'keycard',
      useOn: [
        {
          targetId: 'security_panel',
          interaction: {
            trigger: { verb: 'USE', dc: null },
            onSuccess: { flagSet: 'bulkhead_unlocked' },
          },
        },
      ],
    };
    expect(isEnrichedItem(def)).toBe(true);
  });

  it('returns false for legacy ItemDefinition without enriched fields', () => {
    const def: ItemDefinition = {
      id: 'old_note',
      hidden: false,
      examineResult: { fr: 'Une vieille note', en: 'An old note' },
    };
    expect(isEnrichedItem(def)).toBe(false);
  });

  it('ScenarioFeatureDefinition structurally extends FeatureDefinition', () => {
    const enriched: ScenarioFeatureDefinition = {
      id: 'test_feature',
      initialState: 'locked',
      examineResult: { fr: 'Test', en: 'Test' },
      featureType: 'container',
    };
    // Can be assigned to FeatureDefinition slot
    const base: FeatureDefinition = enriched;
    expect(base.id).toBe('test_feature');
    expect(base.initialState).toBe('locked');
  });
});
