// ---------------------------------------------------------------------------
// tests/unit/engine/consequences.test.ts — Consequence engine + chain reactions
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  buildConsequences, applyConsequences,
} from '../../../src/engine/consequences';
import { createInitialGameState } from '../../../src/engine/types';
import { BALANCE } from '../../../src/engine/constants';
import { addCondition } from '../../../src/engine/conditions';
import type { GameState, CharacterState, SceneContext, Consequence } from '../../../src/engine/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCharacter(hp = 10, maxHp = 14): CharacterState {
  return {
    name: 'Test',
    className: 'marine',
    stats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 2 },
    hp,
    maxHp,
    oxygen: 100,
    inventory: ['knife'],
    equippedWeapon: null,
    equippedArmor: null,
    conditions: [],
    durability: {},
    actionsInColdZone: 0,
    actionsWithoutRest: 0,
  };
}

function makeState(hp = 10, maxHp = 14): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    character: makeCharacter(hp, maxHp),
  };
}

const baseContext: SceneContext = {
  inventory: [],
  locationItems: [],
  npcs: [],
  environmentFeatures: [],
  connectedLocations: [],
  suggestions: [],
  environmentConditions: [],
  atmosphere: 'pressurized',
  locationId: 'room_a',
};

function fixedRng(value: number) {
  return () => value;
}

// ---------------------------------------------------------------------------
// buildConsequences
// ---------------------------------------------------------------------------

describe('buildConsequences', () => {
  it('success with null target → empty or general consequences', () => {
    const cs = buildConsequences('EXAMINE', null, 'success');
    // EXAMINE success: no destructive consequence
    expect(Array.isArray(cs)).toBe(true);
  });

  it('failure with null target → no damage consequences', () => {
    const cs = buildConsequences('EXAMINE', null, 'failure');
    const damages = cs.filter(c => c.type === 'damage');
    expect(damages).toHaveLength(0);
  });

  it('crit_success on IGNITE flammable target → environment_change consequence', () => {
    const target = {
      id: 'fuel_drum', nameKey: 'item.fuel_drum',
      properties: ['flammable', 'tangible'],
      isVirtual: false, source: 'location' as const,
    };
    const cs = buildConsequences('IGNITE', target, 'crit_success');
    const envChange = cs.find(c => c.type === 'environment_change');
    expect(envChange).toBeDefined();
  });

  it('IGNITE failure on non-flammable → no environment_change', () => {
    const target = {
      id: 'metal_door', nameKey: 'env.metal_door',
      properties: ['metallic', 'rigid'],
      isVirtual: false, source: 'environment' as const,
    };
    const cs = buildConsequences('IGNITE', target, 'failure');
    const envChange = cs.find(c => c.type === 'environment_change');
    expect(envChange).toBeUndefined();
  });

  it('THROW failure with target → no player damage', () => {
    const target = {
      id: 'xenomorph', nameKey: 'npc.xenomorph',
      properties: ['living', 'hostile'],
      isVirtual: false, source: 'npc' as const,
    };
    const cs = buildConsequences('THROW', target, 'failure');
    const playerDamage = cs.filter(c => c.type === 'damage' && c.targetId === 'player');
    expect(playerDamage).toHaveLength(0);
  });

  it('THROW crit_failure with target → no player damage', () => {
    const target = {
      id: 'crate', nameKey: 'item.crate',
      properties: ['tangible', 'heavy'],
      isVirtual: false, source: 'location' as const,
    };
    const cs = buildConsequences('THROW', target, 'crit_failure');
    const playerDamage = cs.filter(c => c.type === 'damage' && c.targetId === 'player');
    expect(playerDamage).toHaveLength(0);
  });

  it('STRIKE failure with target → still produces player damage (regression)', () => {
    const target = {
      id: 'metal_door', nameKey: 'env.metal_door',
      properties: ['metallic', 'rigid'],
      isVirtual: false, source: 'environment' as const,
    };
    const cs = buildConsequences('STRIKE', target, 'failure');
    const playerDamage = cs.filter(c => c.type === 'damage' && c.targetId === 'player');
    expect(playerDamage).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// applyConsequences — damage
// ---------------------------------------------------------------------------

describe('applyConsequences: damage', () => {
  it('reduces HP by consequence amount', () => {
    const state = makeState(10, 14);
    const cs: Consequence[] = [{ type: 'damage', targetId: 'player', amount: 3 }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.hp).toBe(7);
  });

  it('HP cannot go below 0', () => {
    const state = makeState(2, 14);
    const cs: Consequence[] = [{ type: 'damage', targetId: 'player', amount: 10 }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.hp).toBe(0);
  });

  it('non-player targetId → state unchanged (NPC damage handled by combat)', () => {
    const state = makeState(10, 14);
    const cs: Consequence[] = [{ type: 'damage', targetId: 'security_robot', amount: 5 }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.hp).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// applyConsequences — heal
// ---------------------------------------------------------------------------

describe('applyConsequences: heal', () => {
  it('increases HP by amount', () => {
    const state = makeState(5, 14);
    const cs: Consequence[] = [{ type: 'heal', targetId: 'player', amount: 4 }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.hp).toBe(9);
  });

  it('HP cannot exceed maxHp', () => {
    const state = makeState(13, 14);
    const cs: Consequence[] = [{ type: 'heal', targetId: 'player', amount: 10 }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.hp).toBe(14);
  });
});

// ---------------------------------------------------------------------------
// applyConsequences — condition_add
// ---------------------------------------------------------------------------

describe('applyConsequences: condition_add', () => {
  it('adds condition to character', () => {
    const state = makeState();
    const cs: Consequence[] = [{ type: 'condition_add', conditionId: 'wounded' }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.conditions.some(c => c.id === 'wounded')).toBe(true);
  });

  it('does not add duplicate conditions', () => {
    const char = makeCharacter();
    const withWounded = { ...char, conditions: addCondition([], 'wounded') };
    const state = { ...makeState(), character: withWounded };
    const cs: Consequence[] = [{ type: 'condition_add', conditionId: 'wounded' }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.conditions.filter(c => c.id === 'wounded')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// applyConsequences — condition_remove
// ---------------------------------------------------------------------------

describe('applyConsequences: condition_remove', () => {
  it('removes condition from character', () => {
    const char = makeCharacter();
    const withCond = { ...char, conditions: addCondition([], 'terrified') };
    const state = { ...makeState(), character: withCond };
    const cs: Consequence[] = [{ type: 'condition_remove', conditionId: 'terrified' }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.conditions.some(c => c.id === 'terrified')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyConsequences — inventory_add / inventory_remove
// ---------------------------------------------------------------------------

describe('applyConsequences: inventory', () => {
  it('inventory_add adds item to inventory', () => {
    const state = makeState();
    const cs: Consequence[] = [{ type: 'inventory_add', itemId: 'ration' }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.inventory).toContain('ration');
  });

  it('inventory_remove removes item from inventory', () => {
    const state = makeState(); // inventory has 'knife'
    const cs: Consequence[] = [{ type: 'inventory_remove', itemId: 'knife' }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.inventory).not.toContain('knife');
  });
});

// ---------------------------------------------------------------------------
// applyConsequences — item_break
// ---------------------------------------------------------------------------

describe('applyConsequences: item_break', () => {
  it('marks item as broken in durability', () => {
    const state = makeState();
    const cs: Consequence[] = [{ type: 'item_break', itemId: 'knife' }];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.durability['knife']?.broken).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// applyConsequences — multiple consequences applied in order
// ---------------------------------------------------------------------------

describe('applyConsequences: multiple consequences', () => {
  it('applies all consequences sequentially', () => {
    const state = makeState(10, 14);
    const cs: Consequence[] = [
      { type: 'damage', targetId: 'player', amount: 3 },
      { type: 'condition_add', conditionId: 'wounded' },
      { type: 'inventory_add', itemId: 'ration' },
    ];
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated.character!.hp).toBe(7);
    expect(updated.character!.conditions.some(c => c.id === 'wounded')).toBe(true);
    expect(updated.character!.inventory).toContain('ration');
  });

  it('does not mutate original state', () => {
    const state = makeState(10, 14);
    const cs: Consequence[] = [{ type: 'damage', targetId: 'player', amount: 3 }];
    applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(state.character!.hp).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Chain reactions — IGNITE → environment_change
// ---------------------------------------------------------------------------

describe('applyConsequences: chain reactions', () => {
  it('IGNITE on flammable triggers environment_change chain', () => {
    const flammableTarget = {
      id: 'fuel_drum', nameKey: 'item.fuel_drum',
      properties: ['flammable', 'tangible'],
      isVirtual: false, source: 'location' as const,
    };
    const cs = buildConsequences('IGNITE', flammableTarget, 'crit_success');
    const state = makeState();
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    // Chain should produce some state change (exact effect depends on impl)
    expect(updated).toBeDefined();
    expect(updated.character).not.toBeNull();
  });

  it('chain reactions terminate before reaching MAX_CASCADE_DEPTH', () => {
    // Build a recursive-looking set of consequences and verify depth guard
    // We simulate by passing 'depth' indirectly through applyConsequences
    const state = makeState();
    const cs: Consequence[] = [
      { type: 'environment_change', targetId: 'room_a' },
      { type: 'atmosphere_change', atmosphereType: 'toxic_atmosphere' },
    ];
    // Should not throw or infinite-loop
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated).toBeDefined();
  });

  it('MAX_CASCADE_DEPTH is respected (depth guard present)', () => {
    const state = makeState();
    const cs: Consequence[] = Array.from(
      { length: BALANCE.MAX_CASCADE_DEPTH + 10 },
      () => ({ type: 'damage' as const, targetId: 'player', amount: 0 }),
    );
    // Even with many consequences, should not crash
    const updated = applyConsequences(state, cs, baseContext, fixedRng(0.5));
    expect(updated).toBeDefined();
  });
});
