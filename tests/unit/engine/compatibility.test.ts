// ---------------------------------------------------------------------------
// tests/unit/engine/compatibility.test.ts — Compatibility checker verification
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { checkCompatibility } from '../../../src/engine/compatibility';
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

  test('HACK on non-electronic target: INCOMPATIBLE with penalty', () => {
    const result = checkCompatibility({
      verbId: 'HACK',
      targetProps: ['tangible', 'visible'],
      playerToolProps: [],
    });
    expect(result.compatible).toBe(false);
    expect(result.difficultyPenalty).toBeGreaterThanOrEqual(5);
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

  test('TALK on non-sentient target: INCOMPATIBLE with penalty', () => {
    const result = checkCompatibility({
      verbId: 'TALK',
      targetProps: ['tangible', 'metallic'],
      playerToolProps: [],
    });
    expect(result.compatible).toBe(false);
    expect(result.difficultyPenalty).toBeGreaterThan(0);
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
    expect(result.difficultyPenalty).toBe(10); // 5 + 5
  });
});
