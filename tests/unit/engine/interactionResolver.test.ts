// ---------------------------------------------------------------------------
// tests/unit/engine/interactionResolver.test.ts — Decision Z
// ---------------------------------------------------------------------------
// The resolver matches rules. It never decides an outcome: the engine rolls,
// then hands the verdict back through applyInteractionOutcome.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../../../src/engine/types';
import {
  findScenarioInteraction,
  findItemUseOn,
  applyInteractionOutcome,
} from '../../../src/engine/interactionResolver';
import type { ScenarioFeatureDefinition, ScenarioItemDefinition, ScenarioInteraction } from '../../../src/engine/scenario';
import { setFeatureState, setScenarioFlag } from '../../../src/engine/featureState';

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
// MATCHING
// ---------------------------------------------------------------------------

describe('findScenarioInteraction', () => {
  it('finds nothing when targetDef is null', () => {
    expect(findScenarioInteraction('OPEN', 'anything', null, makeState())).toBeNull();
  });

  it('finds nothing when targetDef has no interactions', () => {
    const def: ScenarioFeatureDefinition = { id: 'plain', featureType: 'panel' };
    expect(findScenarioInteraction('EXAMINE', 'plain', def, makeState())).toBeNull();
  });

  it('matches interaction by verb', () => {
    const match = findScenarioInteraction('OPEN', 'emergency_locker', lockedLocker, makeState());
    expect(match?.interaction).toBe(autoSuccessInteraction);
  });

  it('matches interaction with verb array (OPEN)', () => {
    expect(findScenarioInteraction('OPEN', 'locker2', lockerWithVerbArray, makeState())).not.toBeNull();
  });

  it('matches interaction with verb array (HACK)', () => {
    expect(findScenarioInteraction('HACK', 'locker2', lockerWithVerbArray, makeState())).not.toBeNull();
  });

  it('finds nothing when verb does not match', () => {
    expect(findScenarioInteraction('EXAMINE', 'emergency_locker', lockedLocker, makeState())).toBeNull();
  });

  it('respects requiredState condition — matches when state matches', () => {
    const state = setFeatureState(makeState(), 'statelocker', 'open');
    const match = findScenarioInteraction('TAKE', 'statelocker', stateGuardedLocker, state);
    expect(match).not.toBeNull();
    expect(applyInteractionOutcome(match!, true).itemsToReveal).toContain('medkit');
  });

  it('respects requiredState condition — no match when state differs', () => {
    expect(findScenarioInteraction('TAKE', 'statelocker', stateGuardedLocker, makeState())).toBeNull();
  });

  it('respects requiredItem condition — matches when item in inventory', () => {
    const state = makeState({ character: { ...makeState().character!, inventory: ['access_keycard'] } });
    const match = findScenarioInteraction('USE', 'security_panel', panel, state);
    expect(match).not.toBeNull();
    expect(applyInteractionOutcome(match!, true).flagToSet).toBe('door_unlocked');
  });

  it('respects requiredItem condition — no match when item missing', () => {
    expect(findScenarioInteraction('USE', 'security_panel', panel, makeState())).toBeNull();
  });

  it('respects requiredFlag condition — matches when flag set', () => {
    const state = setScenarioFlag(makeState(), 'power_on');
    const match = findScenarioInteraction('ACTIVATE', 'reactor', flagPanel, state);
    expect(match).not.toBeNull();
    expect(applyInteractionOutcome(match!, true).newFeatureStates).toEqual(['active']);
  });

  it('carries an ordered token list, for an interaction that moves two axes', () => {
    // `active` sets activity and power but leaves the lock alone, so a terminal
    // told only 'active' stays locked and keeps describing itself as locked.
    const terminal: ScenarioFeatureDefinition = {
      id: 'encrypted_terminal',
      initialState: 'locked',
      featureType: 'terminal',
      interactions: [{ trigger: { verb: 'HACK', dc: null }, onSuccess: { newState: ['unlocked', 'active'] } }],
    };
    const match = findScenarioInteraction('HACK', 'encrypted_terminal', terminal, makeState());
    expect(applyInteractionOutcome(match!, true).newFeatureStates).toEqual(['unlocked', 'active']);
  });

  it('respects requiredFlag condition — no match when flag unset', () => {
    expect(findScenarioInteraction('ACTIVATE', 'reactor', flagPanel, makeState())).toBeNull();
  });

  it('first matching interaction wins (priority order)', () => {
    const state = makeState({ character: { ...makeState().character!, inventory: ['master_key'] } });
    const match = findScenarioInteraction('OPEN', 'priority_locker', priorityLocker, state);
    expect(applyInteractionOutcome(match!, true).flagToSet).toBe('used_key');
  });

  it('falls through to second interaction when first conditions not met', () => {
    const match = findScenarioInteraction('OPEN', 'priority_locker', priorityLocker, makeState());
    expect(match?.interaction.trigger.dc).toBe(12);
  });

  it('never rolls: repeated calls are identical and carry no outcome', () => {
    const a = findScenarioInteraction('FORCE_OPEN', 'heavy_locker', lockerWithDC, makeState());
    const b = findScenarioInteraction('FORCE_OPEN', 'heavy_locker', lockerWithDC, makeState());
    expect(a).toEqual(b);
    expect(a?.interaction).toBe(dcInteraction);
  });
});

// ---------------------------------------------------------------------------
// APPLYING — the engine decides, the rule reacts
// ---------------------------------------------------------------------------

describe('applyInteractionOutcome', () => {
  it('returns the onSuccess result on success', () => {
    const match = findScenarioInteraction('OPEN', 'emergency_locker', lockedLocker, makeState())!;
    const result = applyInteractionOutcome(match, true);
    expect(result.newFeatureStates).toEqual(['open']);
    expect(result.itemsToReveal).toContain('oxygen_canister');
  });

  it('returns the onFailure result on failure', () => {
    const match = findScenarioInteraction('FORCE_OPEN', 'heavy_locker', lockerWithDC, makeState())!;
    const result = applyInteractionOutcome(match, false);
    expect(result.success).toBe(false);
    expect(result.consequences.length).toBeGreaterThan(0);
    expect(result.newFeatureStates).toEqual([]);
  });

  it('returns an inert result when onFailure is absent', () => {
    const def: ScenarioFeatureDefinition = {
      id: 'hard_lock',
      interactions: [{ trigger: { verb: 'FORCE_OPEN', stat: 'FOR', dc: 25 }, onSuccess: { newState: 'open' } }],
    };
    const match = findScenarioInteraction('FORCE_OPEN', 'hard_lock', def, makeState())!;
    const result = applyInteractionOutcome(match, false);
    expect(result.consequences).toHaveLength(0);
    expect(result.newFeatureStates).toEqual([]);
  });

  it('consumes the required item only when the rule asks for it', () => {
    const def: ScenarioFeatureDefinition = {
      id: 'slot',
      interactions: [{
        trigger: { verb: 'USE', requiredItem: 'fuse', dc: null },
        onSuccess: { consumeItem: true },
      }],
    };
    const state = makeState({ character: { ...makeState().character!, inventory: ['fuse'] } });
    const match = findScenarioInteraction('USE', 'slot', def, state)!;
    expect(applyInteractionOutcome(match, true).itemToConsume).toBe('fuse');
    expect(applyInteractionOutcome(match, false).itemToConsume).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ITEM USE ON
// ---------------------------------------------------------------------------

describe('findItemUseOn', () => {
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
    const match = findItemUseOn('access_keycard', keycard, 'security_panel');
    expect(match).not.toBeNull();
    const result = applyInteractionOutcome(match!, true);
    expect(result.flagToSet).toBe('bulkhead_unlocked');
    expect(result.exitToUnlock).toBe('escape_corridor');
  });

  it('finds nothing when no useOn for the given target', () => {
    expect(findItemUseOn('access_keycard', keycard, 'wrong_target')).toBeNull();
  });

  it('finds nothing for non-enriched item def', () => {
    expect(findItemUseOn('plain_item', { id: 'plain_item' }, 'any_target')).toBeNull();
  });
});
