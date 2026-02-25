// ---------------------------------------------------------------------------
// tests/unit/playtest/stuckDetector.test.ts — StuckDetector unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { StuckDetector } from '../../playtest/stuckDetector';

describe('StuckDetector', () => {
  it('is not stuck when fewer than threshold turns recorded', () => {
    const d = new StuckDetector(5);
    d.update('room_a');
    d.update('room_a');
    d.update('room_a');
    expect(d.isStuck()).toBe(false);
  });

  it('detects stuck after threshold identical locations', () => {
    const d = new StuckDetector(5);
    for (let i = 0; i < 5; i++) d.update('room_a');
    expect(d.isStuck()).toBe(true);
  });

  it('is NOT stuck when player moved at least once in the window', () => {
    const d = new StuckDetector(5);
    d.update('room_a');
    d.update('room_a');
    d.update('room_b'); // moved!
    d.update('room_a');
    d.update('room_a');
    expect(d.isStuck()).toBe(false);
  });

  it('sliding window — forgets old history beyond threshold', () => {
    const d = new StuckDetector(3);
    d.update('room_a'); // turn 1 — will be forgotten
    d.update('room_b'); // turn 2 — will be forgotten
    d.update('room_c'); // now in window: [c]
    d.update('room_c'); // window: [c, c]
    d.update('room_c'); // window: [c, c, c] — stuck!
    expect(d.isStuck()).toBe(true);
  });

  it('threshold of 1 detects stuck after single turn', () => {
    const d = new StuckDetector(1);
    d.update('room_a');
    expect(d.isStuck()).toBe(true);
  });

  it('recordedTurns increments but caps at threshold', () => {
    const d = new StuckDetector(5);
    expect(d.recordedTurns).toBe(0);
    d.update('a');
    expect(d.recordedTurns).toBe(1);
    for (let i = 0; i < 10; i++) d.update('a');
    expect(d.recordedTurns).toBe(5); // capped at threshold
  });

  it('reset clears history and isStuck returns false', () => {
    const d = new StuckDetector(3);
    d.update('room_a');
    d.update('room_a');
    d.update('room_a');
    expect(d.isStuck()).toBe(true);
    d.reset();
    expect(d.isStuck()).toBe(false);
    expect(d.recordedTurns).toBe(0);
  });
});
