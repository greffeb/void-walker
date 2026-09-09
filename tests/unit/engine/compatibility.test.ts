// ---------------------------------------------------------------------------
// tests/unit/engine/compatibility.test.ts — Compatibility checker verification
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { checkCompatibility } from '../../../src/engine/compatibility';
import type { PropertyId } from '../../../src/engine/properties';
import { BALANCE } from '../../../src/engine/constants';

describe('checkCompatibility()', () => {
  test('HACK on electronic+secured target: COMPATIBLE', () => {
    const result = checkCompatibility({
      verbId: 'HACK',
      targetProps: ['tangible', 'electronic', 'secured'],
      playerToolProps: [],
    });
    expect(result.compatible).toBe(true);
    expect(result.difficultyPenalty).toBe(0);
    expect(result.auto).toBe(false);
  });

  test('HACK on non-electronic target: INCOMPATIBLE', () => {
    const result = checkCompatibility({
      verbId: 'HACK',
      targetProps: ['tangible', 'visible'],
      playerToolProps: [],
    });
    expect(result.compatible).toBe(false);
    expect(result.requiresCritical).toBe(true);
  });

  test('THROW on liftable target: COMPATIBLE via first OR clause', () => {
    const result = checkCompatibility({
      verbId: 'THROW',
      targetProps: ['tangible', 'liftable'],
      playerToolProps: [],
    });
    expect(result.compatible).toBe(true);
  });

  test('THROW on small target: COMPATIBLE via second OR clause', () => {
    const result = checkCompatibility({
      verbId: 'THROW',
      targetProps: ['tangible', 'small'],
      playerToolProps: [],
    });
    expect(result.compatible).toBe(true);
  });

  test('CUT without bladed tool: BLOCKING condition', () => {
    const result = checkCompatibility({
      verbId: 'CUT',
      targetProps: ['tangible', 'cuttable'],
      playerToolProps: [],
    });
    expect(result.toolBlocking).toBe(true);
    expect(result.difficultyPenalty).toBeGreaterThanOrEqual(5);
  });

  test('CUT with bladed tool: COMPATIBLE', () => {
    const result = checkCompatibility({
      verbId: 'CUT',
      targetProps: ['tangible', 'cuttable'],
      playerToolProps: ['bladed'],
    });
    expect(result.compatible).toBe(true);
    expect(result.toolBlocking).toBe(false);
  });

  test('TAKE is auto (no roll)', () => {
    const result = checkCompatibility({
      verbId: 'TAKE',
      targetProps: ['tangible', 'liftable'],
      playerToolProps: [],
    });
    expect(result.auto).toBe(true);
  });

  test('WAIT is always auto with no requirements', () => {
    const result = checkCompatibility({
      verbId: 'WAIT',
      targetProps: [],
      playerToolProps: [],
    });
    expect(result.auto).toBe(true);
    expect(result.compatible).toBe(true);
  });

  test('LISTEN needs no target properties', () => {
    const result = checkCompatibility({
      verbId: 'LISTEN',
      targetProps: [],
      playerToolProps: [],
    });
    expect(result.compatible).toBe(true);
  });

  test('TALK on sentient target: COMPATIBLE', () => {
    const result = checkCompatibility({
      verbId: 'TALK',
      targetProps: ['sentient', 'alive', 'organic', 'tangible', 'visible'],
      playerToolProps: [],
    });
    expect(result.compatible).toBe(true);
  });

  test('TALK on non-sentient target: INCOMPATIBLE', () => {
    const result = checkCompatibility({
      verbId: 'TALK',
      targetProps: ['tangible', 'metallic'],
      playerToolProps: [],
    });
    expect(result.compatible).toBe(false);
    expect(result.severity).toBe('absurd');
  });

  test('incompatible penalty never exceeds max', () => {
    const maxPenalty = BALANCE.MAX_DIFFICULTY - BALANCE.BASE_DIFFICULTY;
    const result = checkCompatibility({
      verbId: 'HACK',
      targetProps: ['tangible'],
      playerToolProps: [],
    });
    expect(result.difficultyPenalty).toBeLessThanOrEqual(maxPenalty);
  });

  test('SHOOT without ranged weapon: BLOCKING', () => {
    const result = checkCompatibility({
      verbId: 'SHOOT',
      targetProps: ['tangible'],
      playerToolProps: [],
    });
    expect(result.toolBlocking).toBe(true);
    expect(result.compatible).toBe(false);
  });

  test('SHOOT with ranged weapon: COMPATIBLE', () => {
    const result = checkCompatibility({
      verbId: 'SHOOT',
      targetProps: ['tangible'],
      playerToolProps: ['ranged'],
    });
    expect(result.compatible).toBe(true);
    expect(result.toolBlocking).toBe(false);
  });

  test('WELD without heat_source: BLOCKING', () => {
    const result = checkCompatibility({
      verbId: 'WELD',
      targetProps: ['metallic'],
      playerToolProps: [],
    });
    expect(result.toolBlocking).toBe(true);
  });

  test('WELD with heat_source on metallic target: COMPATIBLE', () => {
    const result = checkCompatibility({
      verbId: 'WELD',
      targetProps: ['metallic'],
      playerToolProps: ['heat_source'],
    });
    expect(result.compatible).toBe(true);
  });

  test('both props missing and tool missing: combined penalty', () => {
    const result = checkCompatibility({
      verbId: 'WELD',
      targetProps: ['tangible'], // not metallic
      playerToolProps: [], // no heat_source
    });
    expect(result.compatible).toBe(false);
    expect(result.toolBlocking).toBe(true);
    // one missing property (3) + missing tool (5)
    expect(result.difficultyPenalty).toBe(8);
  });
});

// === DECISION F: THE THREE DEGREES ===

describe('action severity', () => {
  const DOOR: readonly PropertyId[] =
    ['tangible', 'visible', 'openable', 'lockable', 'mechanical', 'breakable', 'metallic'];
  const CORPSE: readonly PropertyId[] = ['tangible', 'visible', 'dead', 'organic', 'heavy'];
  const ROBOT: readonly PropertyId[] =
    ['tangible', 'visible', 'robotic', 'electronic', 'mechanical', 'metallic'];

  test('a satisfied clause is compatible and costs nothing', () => {
    const result = checkCompatibility({ verbId: 'OPEN', targetProps: DOOR, playerToolProps: [] });
    expect(result.severity).toBe('compatible');
    expect(result.difficultyPenalty).toBe(0);
    expect(result.requiresCritical).toBe(false);
  });

  test('eating a corpse is unsuited, not absurd — a body could be edible', () => {
    const result = checkCompatibility({ verbId: 'EAT', targetProps: CORPSE, playerToolProps: [] });
    expect(result.severity).toBe('unsuited');
    expect(result.requiresCritical).toBe(false);
    expect(result.difficultyPenalty).toBeGreaterThan(0);
  });

  test('eating a door is absurd — and still allowed, on a critical', () => {
    const result = checkCompatibility({ verbId: 'EAT', targetProps: DOOR, playerToolProps: [] });
    expect(result.severity).toBe('absurd');
    expect(result.requiresCritical).toBe(true);
  });

  test('seducing a robot is unsuited: something about it is already a being', () => {
    const result = checkCompatibility({ verbId: 'SEDUCE', targetProps: ROBOT, playerToolProps: [] });
    expect(result.severity).toBe('unsuited');
  });

  test('seducing a door is absurd: nothing about it is a being', () => {
    const result = checkCompatibility({ verbId: 'SEDUCE', targetProps: DOOR, playerToolProps: [] });
    expect(result.severity).toBe('absurd');
  });

  test('an absurd action carries no DC surcharge — the critical is the cost', () => {
    const result = checkCompatibility({ verbId: 'EAT', targetProps: DOOR, playerToolProps: [] });
    expect(result.difficultyPenalty).toBe(0);
  });

  test('the penalty grows with the number of missing properties', () => {
    // HACK wants electronic AND secured.
    const one = checkCompatibility({
      verbId: 'HACK', targetProps: ['tangible', 'electronic'], playerToolProps: [],
    });
    const two = checkCompatibility({
      verbId: 'HACK', targetProps: ['tangible', 'programmable'], playerToolProps: [],
    });
    expect(one.severity).toBe('unsuited');
    expect(two.severity).toBe('unsuited');
    expect(two.difficultyPenalty).toBeGreaterThan(one.difficultyPenalty);
    expect(one.difficultyPenalty).toBe(BALANCE.CONTEXT_MODIFIERS.UNSUITED_PER_MISSING_PROPERTY);
  });

  test('the nearest clause wins: distance is measured on the closest reading', () => {
    // REPAIR accepts mechanical OR electronic; a door satisfies the first outright.
    const result = checkCompatibility({ verbId: 'REPAIR', targetProps: DOOR, playerToolProps: [] });
    expect(result.severity).toBe('compatible');
  });

  test('a wrong state is unsuited, never absurd', () => {
    // FORCE_OPEN wants an openable target that is locked; this one is open.
    const result = checkCompatibility({
      verbId: 'FORCE_OPEN',
      targetProps: DOOR,
      playerToolProps: [],
      targetState: { openness: 'open', lock: 'unlocked' },
    });
    expect(result.severity).toBe('unsuited');
    expect(result.requiresCritical).toBe(false);
  });

  test('reports the nature it judged on', () => {
    expect(checkCompatibility({ verbId: 'OPEN', targetProps: DOOR, playerToolProps: [] }).nature)
      .toBe('machine');
    expect(checkCompatibility({ verbId: 'OPEN', targetProps: CORPSE, playerToolProps: [] }).nature)
      .toBe('organic');
  });
});
