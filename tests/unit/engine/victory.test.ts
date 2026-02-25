// ---------------------------------------------------------------------------
// tests/unit/engine/victory.test.ts — Victory & Defeat condition tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  evaluateVictoryCondition,
  evaluateDefeatCondition,
  checkVictory,
  checkAdditionalDefeat,
} from '../../../src/engine/victory';
import type { VictoryCheckContext } from '../../../src/engine/victory';
import type { VictoryCondition, DefeatCondition, CoreSkeleton } from '../../../src/engine/scenario';
import { ESCAPE_SKELETON } from '../../../src/content/scenarios/escape';

// ---------------------------------------------------------------------------
// TEST HELPERS
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<VictoryCheckContext> = {}): VictoryCheckContext {
  return {
    playerLocationId: 'start',
    playerInventory: [],
    npcStates: {},
    activatedObjects: [],
    lethalLocations: [],
    fullyContainedLocations: [],
    destroyedObjectives: [],
    selfDestructActive: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// evaluateVictoryCondition
// ---------------------------------------------------------------------------

describe('evaluateVictoryCondition — reach_location', () => {
  it('true when player at target location (no item required)', () => {
    const cond: VictoryCondition = { type: 'reach_location', locationId: 'resolution' };
    expect(evaluateVictoryCondition(cond, makeCtx({ playerLocationId: 'resolution' }))).toBe(true);
  });

  it('false when player at wrong location', () => {
    const cond: VictoryCondition = { type: 'reach_location', locationId: 'resolution' };
    expect(evaluateVictoryCondition(cond, makeCtx({ playerLocationId: 'start' }))).toBe(false);
  });

  it('true when player at location WITH required item', () => {
    const cond: VictoryCondition = { type: 'reach_location', locationId: 'resolution', requiredItem: 'access_keycard' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      playerLocationId: 'resolution',
      playerInventory: ['access_keycard', 'medkit'],
    }))).toBe(true);
  });

  it('false when player at location but MISSING required item', () => {
    const cond: VictoryCondition = { type: 'reach_location', locationId: 'resolution', requiredItem: 'access_keycard' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      playerLocationId: 'resolution',
      playerInventory: ['medkit'],
    }))).toBe(false);
  });
});

describe('evaluateVictoryCondition — defeat_entity', () => {
  it('true when entity exists and is not alive', () => {
    const cond: VictoryCondition = { type: 'defeat_entity', entityId: 'boss' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      npcStates: { boss: { id: 'boss', locationId: 'boss_room', alive: false } },
    }))).toBe(true);
  });

  it('false when entity is still alive', () => {
    const cond: VictoryCondition = { type: 'defeat_entity', entityId: 'boss' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      npcStates: { boss: { id: 'boss', locationId: 'boss_room', alive: true } },
    }))).toBe(false);
  });

  it('false when entity does not exist in state', () => {
    const cond: VictoryCondition = { type: 'defeat_entity', entityId: 'boss' };
    expect(evaluateVictoryCondition(cond, makeCtx())).toBe(false);
  });
});

describe('evaluateVictoryCondition — activate_object', () => {
  it('true when object activated (no item required)', () => {
    const cond: VictoryCondition = { type: 'activate_object', objectId: 'emergency_beacon' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      activatedObjects: ['emergency_beacon'],
    }))).toBe(true);
  });

  it('false when object not in activated list', () => {
    const cond: VictoryCondition = { type: 'activate_object', objectId: 'emergency_beacon' };
    expect(evaluateVictoryCondition(cond, makeCtx())).toBe(false);
  });

  it('true when activated AND required item present', () => {
    const cond: VictoryCondition = { type: 'activate_object', objectId: 'emergency_beacon', requiredItem: 'incriminating_files' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      activatedObjects: ['emergency_beacon'],
      playerInventory: ['incriminating_files'],
    }))).toBe(true);
  });

  it('false when activated but missing required item', () => {
    const cond: VictoryCondition = { type: 'activate_object', objectId: 'emergency_beacon', requiredItem: 'incriminating_files' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      activatedObjects: ['emergency_beacon'],
    }))).toBe(false);
  });
});

describe('evaluateVictoryCondition — escort_alive', () => {
  it('true when NPC alive at target location', () => {
    const cond: VictoryCondition = { type: 'escort_alive', npcId: 'dr_okonkwo', locationId: 'resolution' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      npcStates: { dr_okonkwo: { id: 'dr_okonkwo', locationId: 'resolution', alive: true } },
    }))).toBe(true);
  });

  it('false when NPC alive but at wrong location', () => {
    const cond: VictoryCondition = { type: 'escort_alive', npcId: 'dr_okonkwo', locationId: 'resolution' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      npcStates: { dr_okonkwo: { id: 'dr_okonkwo', locationId: 'boss_room', alive: true } },
    }))).toBe(false);
  });

  it('false when NPC dead at target location', () => {
    const cond: VictoryCondition = { type: 'escort_alive', npcId: 'dr_okonkwo', locationId: 'resolution' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      npcStates: { dr_okonkwo: { id: 'dr_okonkwo', locationId: 'resolution', alive: false } },
    }))).toBe(false);
  });
});

describe('evaluateVictoryCondition — environmental_kill', () => {
  it('true when entity alive in lethal location (player elsewhere)', () => {
    const cond: VictoryCondition = { type: 'environmental_kill', entityId: 'creature_oracle' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      playerLocationId: 'safe_room',
      npcStates: { creature_oracle: { id: 'creature_oracle', locationId: 'cargo_bay', alive: true } },
      lethalLocations: ['cargo_bay'],
    }))).toBe(true);
  });

  it('false when player also in lethal location (no safe kill)', () => {
    const cond: VictoryCondition = { type: 'environmental_kill', entityId: 'creature_oracle' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      playerLocationId: 'cargo_bay',
      npcStates: { creature_oracle: { id: 'creature_oracle', locationId: 'cargo_bay', alive: true } },
      lethalLocations: ['cargo_bay'],
    }))).toBe(false);
  });

  it('false when entity location is not lethal', () => {
    const cond: VictoryCondition = { type: 'environmental_kill', entityId: 'creature_oracle' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      playerLocationId: 'safe_room',
      npcStates: { creature_oracle: { id: 'creature_oracle', locationId: 'cargo_bay', alive: true } },
      lethalLocations: [],
    }))).toBe(false);
  });

  it('false when entity is already dead', () => {
    const cond: VictoryCondition = { type: 'environmental_kill', entityId: 'creature_oracle' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      playerLocationId: 'safe_room',
      npcStates: { creature_oracle: { id: 'creature_oracle', locationId: 'cargo_bay', alive: false } },
      lethalLocations: ['cargo_bay'],
    }))).toBe(false);
  });
});

describe('evaluateVictoryCondition — containment', () => {
  it('true when entity alive in fully contained location', () => {
    const cond: VictoryCondition = { type: 'containment', entityId: 'creature_oracle' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      npcStates: { creature_oracle: { id: 'creature_oracle', locationId: 'boss_room', alive: true } },
      fullyContainedLocations: ['boss_room'],
    }))).toBe(true);
  });

  it('false when entity location not contained', () => {
    const cond: VictoryCondition = { type: 'containment', entityId: 'creature_oracle' };
    expect(evaluateVictoryCondition(cond, makeCtx({
      npcStates: { creature_oracle: { id: 'creature_oracle', locationId: 'boss_room', alive: true } },
      fullyContainedLocations: [],
    }))).toBe(false);
  });
});

describe('evaluateVictoryCondition — self_destruct', () => {
  it('true when selfDestructActive is true', () => {
    const cond: VictoryCondition = { type: 'self_destruct' };
    expect(evaluateVictoryCondition(cond, makeCtx({ selfDestructActive: true }))).toBe(true);
  });

  it('false when selfDestructActive is false', () => {
    const cond: VictoryCondition = { type: 'self_destruct' };
    expect(evaluateVictoryCondition(cond, makeCtx({ selfDestructActive: false }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// evaluateDefeatCondition
// ---------------------------------------------------------------------------

describe('evaluateDefeatCondition', () => {
  it('player_death always returns false (handled externally)', () => {
    const cond: DefeatCondition = { type: 'player_death' };
    expect(evaluateDefeatCondition(cond, makeCtx())).toBe(false);
  });

  it('npc_death: true when NPC exists and is dead', () => {
    const cond: DefeatCondition = { type: 'npc_death', npcId: 'dr_okonkwo' };
    expect(evaluateDefeatCondition(cond, makeCtx({
      npcStates: { dr_okonkwo: { id: 'dr_okonkwo', locationId: null, alive: false } },
    }))).toBe(true);
  });

  it('npc_death: false when NPC is still alive', () => {
    const cond: DefeatCondition = { type: 'npc_death', npcId: 'dr_okonkwo' };
    expect(evaluateDefeatCondition(cond, makeCtx({
      npcStates: { dr_okonkwo: { id: 'dr_okonkwo', locationId: 'reveal', alive: true } },
    }))).toBe(false);
  });

  it('npc_death: false when NPC not in state', () => {
    const cond: DefeatCondition = { type: 'npc_death', npcId: 'dr_okonkwo' };
    expect(evaluateDefeatCondition(cond, makeCtx())).toBe(false);
  });

  it('time_expired always returns false (handled externally)', () => {
    const cond: DefeatCondition = { type: 'time_expired', resource: 'o2' };
    expect(evaluateDefeatCondition(cond, makeCtx())).toBe(false);
  });

  it('objective_destroyed: true when destroyedObjectives is non-empty', () => {
    const cond: DefeatCondition = { type: 'objective_destroyed' };
    expect(evaluateDefeatCondition(cond, makeCtx({
      destroyedObjectives: ['emergency_beacon'],
    }))).toBe(true);
  });

  it('objective_destroyed: false when nothing destroyed', () => {
    const cond: DefeatCondition = { type: 'objective_destroyed' };
    expect(evaluateDefeatCondition(cond, makeCtx())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkVictory — priority order
// ---------------------------------------------------------------------------

describe('checkVictory', () => {
  it('returns null when no conditions are met', () => {
    expect(checkVictory(makeCtx(), ESCAPE_SKELETON)).toBeNull();
  });

  it('returns primary victory when primary condition is met', () => {
    const ctx = makeCtx({
      playerLocationId: 'resolution',
      playerInventory: ['access_keycard'],
    });
    const result = checkVictory(ctx, ESCAPE_SKELETON);
    expect(result?.type).toBe('primary');
    expect(result?.skeletonId).toBe('escape');
  });

  it('returns alternative victory when primary is not met but alternative is', () => {
    const ctx = makeCtx({
      playerLocationId: 'start',  // Not at resolution
      npcStates: {
        creature_oracle: { id: 'creature_oracle', locationId: 'cargo_bay', alive: true },
      },
      lethalLocations: ['cargo_bay'],
    });
    const result = checkVictory(ctx, ESCAPE_SKELETON);
    // ESCAPE's alternativeVictory IS an environmental_kill — triggered as designed path → 'alternative'
    expect(result?.type).toBe('alternative');
    expect(result?.skeletonId).toBe('escape');
  });

  it('returns emergent_environmental_kill when enemy in lethal room, player safe', () => {
    const skeleton = {
      ...ESCAPE_SKELETON,
      primaryVictory: { type: 'reach_location' as const, locationId: 'resolution', requiredItem: 'access_keycard' },
      alternativeVictory: { type: 'defeat_entity' as const, entityId: 'other_entity' },
    } as CoreSkeleton;

    const ctx = makeCtx({
      playerLocationId: 'safe_room',
      npcStates: {
        boss_entity: { id: 'boss_entity', locationId: 'fire_room', alive: true },
      },
      lethalLocations: ['fire_room'],
    });
    const result = checkVictory(ctx, skeleton);
    expect(result?.type).toBe('emergent_environmental_kill');
  });

  it('returns emergent_containment when enemy location is fully sealed', () => {
    const skeleton = {
      ...ESCAPE_SKELETON,
      primaryVictory: { type: 'reach_location' as const, locationId: 'unreachable' },
      alternativeVictory: { type: 'defeat_entity' as const, entityId: 'nobody' },
    } as CoreSkeleton;

    const ctx = makeCtx({
      npcStates: {
        boss_entity: { id: 'boss_entity', locationId: 'sealed_room', alive: true },
      },
      fullyContainedLocations: ['sealed_room'],
    });
    const result = checkVictory(ctx, skeleton);
    expect(result?.type).toBe('emergent_containment');
  });

  it('returns emergent_self_destruct when selfDestructActive', () => {
    const skeleton = {
      ...ESCAPE_SKELETON,
      primaryVictory: { type: 'reach_location' as const, locationId: 'unreachable' },
      alternativeVictory: { type: 'defeat_entity' as const, entityId: 'nobody' },
    } as CoreSkeleton;

    const ctx = makeCtx({ selfDestructActive: true });
    const result = checkVictory(ctx, skeleton);
    expect(result?.type).toBe('emergent_self_destruct');
  });

  it('primary takes priority over emergent', () => {
    // Both primary and emergent_environmental_kill are satisfied
    const ctx = makeCtx({
      playerLocationId: 'resolution',
      playerInventory: ['access_keycard'],
      npcStates: {
        creature_oracle: { id: 'creature_oracle', locationId: 'fire_room', alive: true },
      },
      lethalLocations: ['fire_room'],
    });
    const result = checkVictory(ctx, ESCAPE_SKELETON);
    expect(result?.type).toBe('primary');
  });
});

// ---------------------------------------------------------------------------
// checkAdditionalDefeat
// ---------------------------------------------------------------------------

describe('checkAdditionalDefeat', () => {
  const conditions: DefeatCondition[] = [
    { type: 'npc_death', npcId: 'dr_okonkwo' },
    { type: 'objective_destroyed' },
  ];

  it('returns null when no conditions triggered', () => {
    expect(checkAdditionalDefeat(makeCtx(), conditions)).toBeNull();
  });

  it('returns first triggered condition', () => {
    const ctx = makeCtx({
      npcStates: { dr_okonkwo: { id: 'dr_okonkwo', locationId: null, alive: false } },
    });
    const result = checkAdditionalDefeat(ctx, conditions);
    expect(result?.type).toBe('npc_death');
  });

  it('returns objective_destroyed if objectives destroyed', () => {
    const ctx = makeCtx({ destroyedObjectives: ['beacon'] });
    const result = checkAdditionalDefeat(ctx, conditions);
    expect(result?.type).toBe('objective_destroyed');
  });

  it('works with empty conditions array', () => {
    expect(checkAdditionalDefeat(makeCtx(), [])).toBeNull();
  });
});
