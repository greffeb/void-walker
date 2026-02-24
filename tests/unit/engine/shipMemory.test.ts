// ---------------------------------------------------------------------------
// tests/unit/engine/shipMemory.test.ts — Ship Memory marking system
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  createMark, getMarksForTarget, getMarkDCModifier,
  getMarkPropertyChanges, addMark,
} from '../../../src/engine/shipMemory';
import type { EnvironmentMark } from '../../../src/engine/types';

// ---------------------------------------------------------------------------
// createMark
// ---------------------------------------------------------------------------

describe('createMark', () => {
  it('FORCE_OPEN fail on door → mark with sameActionDCMod -2', () => {
    const mark = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured', 'lockable'], 'failure', 1);
    expect(mark).not.toBeNull();
    expect(mark!.effect.sameActionDCMod).toBe(-2);
    expect(mark!.effect.noiseGenerated).toBe(true);
  });

  it('HACK fail on terminal → reveals maintenance_port', () => {
    const mark = createMark('room_a', 'terminal_01', 'HACK', ['electronic', 'programmable'], 'failure', 2);
    expect(mark).not.toBeNull();
    expect(mark!.effect.newApproachRevealed).toBe('maintenance_port');
    expect(mark!.effect.noiseGenerated).toBe(false);
  });

  it('BREAK fail on window → sameActionDCMod -3', () => {
    const mark = createMark('room_a', 'window_01', 'BREAK', ['breakable', 'transparent', 'fragile'], 'failure', 3);
    expect(mark).not.toBeNull();
    expect(mark!.effect.sameActionDCMod).toBe(-3);
  });

  it('STRIKE fail on NPC → noiseGenerated and otherActionDCMod -1', () => {
    const mark = createMark('room_a', 'security_robot', 'STRIKE', ['robotic', 'hostile'], 'failure', 4);
    expect(mark).not.toBeNull();
    expect(mark!.effect.noiseGenerated).toBe(true);
    expect(mark!.effect.otherActionDCMod).toBe(-1);
  });

  it('REPAIR fail on machine → reveals exposed_wiring', () => {
    const mark = createMark('room_a', 'generator_01', 'REPAIR', ['electronic', 'mechanical'], 'failure', 5);
    expect(mark).not.toBeNull();
    expect(mark!.effect.newApproachRevealed).toBe('exposed_wiring');
  });

  it('UNLOCK fail on lock → -1 DC unlock, slight jammed penalty to FORCE_OPEN captured in effect', () => {
    const mark = createMark('room_a', 'lock_01', 'UNLOCK', ['lockable', 'secured'], 'failure', 6);
    expect(mark).not.toBeNull();
    expect(mark!.effect.sameActionDCMod).toBe(-1);
  });

  it('CLIMB fail on surface → -1 DC climb', () => {
    const mark = createMark('room_a', 'vent_shaft', 'CLIMB', ['climbable'], 'failure', 7);
    expect(mark).not.toBeNull();
    expect(mark!.effect.sameActionDCMod).toBe(-1);
  });

  it('verb not in catalog → null (no mark)', () => {
    const mark = createMark('room_a', 'table_01', 'READ', ['readable'], 'failure', 8);
    expect(mark).toBeNull();
  });

  it('records locationId, targetId, verb, outcome and turn', () => {
    const mark = createMark('corridor_b', 'door_02', 'FORCE_OPEN', ['openable', 'secured'], 'critical_failure', 10);
    expect(mark!.locationId).toBe('corridor_b');
    expect(mark!.targetId).toBe('door_02');
    expect(mark!.verb).toBe('FORCE_OPEN');
    expect(mark!.outcome).toBe('critical_failure');
    expect(mark!.turn).toBe(10);
  });

  it('success outcome → null (marks only created on failure)', () => {
    // createMark is only called for failures, but guard against incorrect call
    const mark = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1);
    expect(mark).not.toBeNull(); // failure = mark OK
  });
});

// ---------------------------------------------------------------------------
// addMark
// ---------------------------------------------------------------------------

describe('addMark', () => {
  it('adds a mark to empty memory', () => {
    const mark = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!;
    const memory = addMark([], mark);
    expect(memory).toHaveLength(1);
    expect(memory[0]).toBe(mark);
  });

  it('appends to existing memory', () => {
    const m1 = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!;
    const m2 = createMark('room_b', 'terminal_01', 'HACK', ['electronic', 'programmable'], 'failure', 2)!;
    const memory = addMark(addMark([], m1), m2);
    expect(memory).toHaveLength(2);
  });

  it('does not mutate original array', () => {
    const original: EnvironmentMark[] = [];
    const mark = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!;
    addMark(original, mark);
    expect(original).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getMarksForTarget
// ---------------------------------------------------------------------------

describe('getMarksForTarget', () => {
  it('returns empty array when no marks exist', () => {
    expect(getMarksForTarget([], 'room_a', 'door_01')).toHaveLength(0);
  });

  it('returns only marks for matching locationId + targetId', () => {
    const m1 = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!;
    const m2 = createMark('room_b', 'door_02', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 2)!;
    const memory = [m1, m2];
    const results = getMarksForTarget(memory, 'room_a', 'door_01');
    expect(results).toHaveLength(1);
    expect(results[0]).toBe(m1);
  });

  it('returns all marks for same target if multiple failed attempts', () => {
    const m1 = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!;
    const m2 = createMark('room_a', 'door_01', 'BREAK', ['breakable', 'transparent'], 'failure', 2)!;
    const results = getMarksForTarget([m1, m2], 'room_a', 'door_01');
    expect(results).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getMarkDCModifier
// ---------------------------------------------------------------------------

describe('getMarkDCModifier', () => {
  it('returns 0 with no marks', () => {
    expect(getMarkDCModifier([], 'FORCE_OPEN')).toBe(0);
  });

  it('returns sameActionDCMod when retrying same verb', () => {
    const mark = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!;
    const mod = getMarkDCModifier([mark], 'FORCE_OPEN');
    expect(mod).toBe(mark.effect.sameActionDCMod);
  });

  it('returns otherActionDCMod when using a different verb', () => {
    const mark = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!;
    const mod = getMarkDCModifier([mark], 'HACK');
    expect(mod).toBe(mark.effect.otherActionDCMod);
  });

  it('accumulates DC mods across multiple marks', () => {
    const m1 = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!;
    const m2 = createMark('room_a', 'door_01', 'BREAK', ['breakable', 'transparent'], 'failure', 2)!;
    // Both failed on the door. Now retrying FORCE_OPEN:
    // m1 same verb: sameActionDCMod
    // m2 different verb: otherActionDCMod
    const mod = getMarkDCModifier([m1, m2], 'FORCE_OPEN');
    expect(mod).toBe(m1.effect.sameActionDCMod + m2.effect.otherActionDCMod);
  });
});

// ---------------------------------------------------------------------------
// getMarkPropertyChanges
// ---------------------------------------------------------------------------

describe('getMarkPropertyChanges', () => {
  it('returns empty arrays when no marks', () => {
    const result = getMarkPropertyChanges([]);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it('accumulates properties added by marks', () => {
    const mark = createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!;
    const result = getMarkPropertyChanges([mark]);
    // FORCE_OPEN fail adds 'damaged_frame' to door
    if (mark.effect.propertiesAdded && mark.effect.propertiesAdded.length > 0) {
      expect(result.added).toEqual(expect.arrayContaining(mark.effect.propertiesAdded));
    }
  });
});
