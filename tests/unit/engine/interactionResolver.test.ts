// ---------------------------------------------------------------------------
// tests/unit/engine/interactionResolver.test.ts — Chantier 1
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../../../src/engine/types';
import {
  resolveScenarioInteraction,
  resolveItemUseOn,
  NO_INTERACTION_MATCH,
} from '../../../src/engine/interactionResolver';
import type { ScenarioFeatureDefinition, ScenarioItemDefinition, ScenarioInteraction } from '../../../src/engine/scenario';
import { setFeatureState, setScenarioFlag } from '../../../src/engine/featureState';
import { defaultRng } from '../../../src/engine/dice';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<ReturnType<typeof createInitialGameState>> = {}) {
  return {
    ...createInitialGameState(),
    character: {
      name: 'Test',
      className: 'marine' as const,
      stats: { FOR: 3, DEF: 2, AGI: 2, INT: 2, PER: 2, CHA: 2, LCK: 0 },
      hp: 20, maxHp: 20, oxygen: 100,
      inventory: [],
      equippedWeapon: null, equippedArmor: null,
      conditions: [], durability: {},
      actionsInColdZone: 0, actionsWithoutRest: 0,
    },
    ...overrides,
  };
}

const autoSuccessInteraction: ScenarioInteraction = {
  trigger: { verb: 'OPEN', dc: null },
  onSuccess: { newState: 'open', revealsItems: ['oxygen_canister'] },
};

const lockedLocker: ScenarioFeatureDefinition = {
  id: 'emergency_locker',
  initialState: 'locked',
  featureType: 'container',
  interactions: [autoSuccessInteraction],
};

const verbArrayInteraction: ScenarioInteraction = {
  trigger: { verb: ['OPEN', 'HACK'] as const, dc: null },
  onSuccess: { newState: 'open' },
};

const lockerWithVerbArray: ScenarioFeatureDefinition = {
  id: 'locker2',
  interactions: [verbArrayInteraction],
};

const dcInteraction: ScenarioInteraction = {
  trigger: { verb: 'FORCE_OPEN', stat: 'FOR', dc: 12 },
  onSuccess: { newState: 'open' },
  onFailure: { consequences: [{ type: 'damage', amount: 1 }] },
};

const lockerWithDC: ScenarioFeatureDefinition = {
  id: 'heavy_locker',
  interactions: [dcInteraction],
};

const stateGuardedInteraction: ScenarioInteraction = {
  trigger: { verb: 'TAKE', requiredState: 'open', dc: null },
  onSuccess: { revealsItems: ['medkit'] },
};

const stateGuardedLocker: ScenarioFeatureDefinition = {
  id: 'statelocker',
  interactions: [stateGuardedInteraction],
};

const itemGuardedInteraction: ScenarioInteraction = {
  trigger: { verb: 'USE', requiredItem: 'access_keycard', dc: null },
  onSuccess: { flagSet: 'door_unlocked' },
};

const panel: ScenarioFeatureDefinition = {
  id: 'security_panel',
  interactions: [itemGuardedInteraction],
};

const flagGuardedInteraction: ScenarioInteraction = {
  trigger: { verb: 'ACTIVATE', requiredFlag: 'power_on', dc: null },
  onSuccess: { newState: 'active' },
};

const flagPanel: ScenarioFeatureDefinition = {
  id: 'reactor',
  interactions: [flagGuardedInteraction],
};

// Priority test — keycard check first, then brute force
const priorityLocker: ScenarioFeatureDefinition = {
  id: 'priority_locker',
  interactions: [
    { trigger: { verb: 'OPEN', requiredItem: 'master_key', dc: null }, onSuccess: { newState: 'open', flagSet: 'used_key' } },
    { trigger: { verb: 'OPEN', dc: 12 }, onSuccess: { newState: 'open' } },
  ],
};

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------

describe('resolveScenarioInteraction', () => {
  it('returns NO_INTERACTION_MATCH when targetDef is null', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('OPEN', 'anything', null, state, 'loc1', defaultRng);
    expect(result.matched).toBe(false);
    expect(result).toBe(NO_INTERACTION_MATCH);
  });

  it('returns NO_INTERACTION_MATCH when targetDef has no interactions', () => {
    const state = makeState();
    const def: ScenarioFeatureDefinition = { id: 'plain', featureType: 'panel' };
    const result = resolveScenarioInteraction('EXAMINE', 'plain', def, state, 'loc1', defaultRng);
    expect(result.matched).toBe(false);
  });

  it('matches interaction by verb', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('OPEN', 'emergency_locker', lockedLocker, state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
    expect(result.success).toBe(true);
    expect(result.newFeatureState).toBe('open');
  });

  it('matches interaction with verb array (OPEN)', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('OPEN', 'locker2', lockerWithVerbArray, state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
  });

  it('matches interaction with verb array (HACK)', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('HACK', 'locker2', lockerWithVerbArray, state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
  });

  it('returns NO_INTERACTION_MATCH when verb does not match', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('EXAMINE', 'emergency_locker', lockedLocker, state, 'loc1', defaultRng);
    expect(result.matched).toBe(false);
  });

  it('respects requiredState condition — matches when state matches', () => {
    const state = setFeatureState(makeState(), 'statelocker', 'open');
    const result = resolveScenarioInteraction('TAKE', 'statelocker', stateGuardedLocker, state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
    expect(result.itemsToReveal).toContain('medkit');
  });

  it('respects requiredState condition — no match when state differs', () => {
    const state = makeState(); // statelocker is 'intact' by default
    const result = resolveScenarioInteraction('TAKE', 'statelocker', stateGuardedLocker, state, 'loc1', defaultRng);
    expect(result.matched).toBe(false);
  });

  it('respects requiredItem condition — matches when item in inventory', () => {
    const state = makeState({ character: { ...makeState().character!, inventory: ['access_keycard'] } });
    const result = resolveScenarioInteraction('USE', 'security_panel', panel, state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
    expect(result.flagToSet).toBe('door_unlocked');
  });

  it('respects requiredItem condition — no match when item missing', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('USE', 'security_panel', panel, state, 'loc1', defaultRng);
    expect(result.matched).toBe(false);
  });

  it('respects requiredFlag condition — matches when flag set', () => {
    const state = setScenarioFlag(makeState(), 'power_on');
    const result = resolveScenarioInteraction('ACTIVATE', 'reactor', flagPanel, state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
    expect(result.newFeatureState).toBe('active');
  });

  it('respects requiredFlag condition — no match when flag unset', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('ACTIVATE', 'reactor', flagPanel, state, 'loc1', defaultRng);
    expect(result.matched).toBe(false);
  });

  it('auto-success when dc is null', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('OPEN', 'emergency_locker', lockedLocker, state, 'loc1', defaultRng);
    expect(result.success).toBe(true);
    expect(result.diceRoll).toBeNull();
  });

  it('performs dice roll when dc is a number', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('FORCE_OPEN', 'heavy_locker', lockerWithDC, state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
    expect(result.diceRoll).not.toBeNull();
  });

  it('returns onSuccess result on success (dc=null)', () => {
    const state = makeState();
    const result = resolveScenarioInteraction('OPEN', 'emergency_locker', lockedLocker, state, 'loc1', defaultRng);
    expect(result.newFeatureState).toBe('open');
    expect(result.itemsToReveal).toContain('oxygen_canister');
  });

  it('returns onFailure result on failure with perfect-fail rng', () => {
    const failRng = () => 0.0001; // always rolls 1 on D20 → fumble
    const state = makeState();
    const result = resolveScenarioInteraction('FORCE_OPEN', 'heavy_locker', lockerWithDC, state, 'loc1', failRng);
    // Even on failure, matched should be true
    expect(result.matched).toBe(true);
    if (!result.success) {
      expect(result.consequences.length).toBeGreaterThan(0);
    }
  });

  it('returns empty result when onFailure absent and roll fails', () => {
    const noFailureInteraction: ScenarioInteraction = {
      trigger: { verb: 'FORCE_OPEN', stat: 'FOR', dc: 25 }, // very hard
      onSuccess: { newState: 'open' },
      // no onFailure
    };
    const def: ScenarioFeatureDefinition = { id: 'hard_lock', interactions: [noFailureInteraction] };
    const failRng = () => 0.0001;
    const state = makeState();
    const result = resolveScenarioInteraction('FORCE_OPEN', 'hard_lock', def, state, 'loc1', failRng);
    expect(result.matched).toBe(true);
    if (!result.success) {
      expect(result.consequences.length).toBe(0);
      expect(result.newFeatureState).toBeNull();
    }
  });

  it('first matching interaction wins (priority order)', () => {
    const state = makeState({ character: { ...makeState().character!, inventory: ['master_key'] } });
    const result = resolveScenarioInteraction('OPEN', 'priority_locker', priorityLocker, state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
    // Should have matched the key-based one (flagSet = 'used_key'), not the brute-force one
    expect(result.flagToSet).toBe('used_key');
    expect(result.diceRoll).toBeNull(); // auto-success
  });

  it('falls through to second interaction when first conditions not met', () => {
    const state = makeState(); // no master_key in inventory
    const result = resolveScenarioInteraction('OPEN', 'priority_locker', priorityLocker, state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
    // Should have used the dc-based second interaction
    expect(result.diceRoll).not.toBeNull();
  });
});

describe('resolveItemUseOn', () => {
  const keycard: ScenarioItemDefinition = {
    id: 'access_keycard',
    itemType: 'key_item',
    useOn: [
      {
        targetId: 'security_panel',
        interaction: {
          trigger: { verb: 'USE', dc: null },
          onSuccess: { flagSet: 'bulkhead_unlocked', revealsExit: 'escape_corridor' },
        },
      },
    ],
  };

  it('matches useOn definition for correct target', () => {
    const state = makeState();
    const result = resolveItemUseOn('access_keycard', keycard, 'security_panel', state, 'loc1', defaultRng);
    expect(result.matched).toBe(true);
    expect(result.flagToSet).toBe('bulkhead_unlocked');
    expect(result.exitToUnlock).toBe('escape_corridor');
  });

  it('returns NO_MATCH when no useOn for the given target', () => {
    const state = makeState();
    const result = resolveItemUseOn('access_keycard', keycard, 'wrong_target', state, 'loc1', defaultRng);
    expect(result.matched).toBe(false);
  });

  it('returns NO_MATCH for non-enriched item def', () => {
    const plainItem = { id: 'plain_item' };
    const state = makeState();
    const result = resolveItemUseOn('plain_item', plainItem, 'any_target', state, 'loc1', defaultRng);
    expect(result.matched).toBe(false);
  });
});
