// ---------------------------------------------------------------------------
// tests/unit/engine/stalkerClock.test.ts — Stalker clock unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  tickStalkerClock,
  resetStalkerClock,
  checkStalkerClock,
  applyStalkerEvent,
} from '../../../src/engine/stalkerClock';
import type { StalkerClockState } from '../../../src/engine/types';
import { BALANCE } from '../../../src/engine/constants';

function makeClockState(overrides: Partial<StalkerClockState> = {}): StalkerClockState {
  return {
    actionsSinceLastProgression: 0,
    warningIssued: false,
    threatArrivalIssued: false,
    ...overrides,
  };
}

describe('tickStalkerClock', () => {
  it('increments counter by 1', () => {
    const state = makeClockState({ actionsSinceLastProgression: 5 });
    const result = tickStalkerClock(state);
    expect(result.actionsSinceLastProgression).toBe(6);
  });

  it('preserves other fields', () => {
    const state = makeClockState({ warningIssued: true, threatArrivalIssued: true });
    const result = tickStalkerClock(state);
    expect(result.warningIssued).toBe(true);
    expect(result.threatArrivalIssued).toBe(true);
  });
});

describe('resetStalkerClock', () => {
  it('resets all fields', () => {
    const result = resetStalkerClock();
    expect(result.actionsSinceLastProgression).toBe(0);
    expect(result.warningIssued).toBe(false);
    expect(result.threatArrivalIssued).toBe(false);
  });
});

describe('checkStalkerClock', () => {
  it('returns null when under warning threshold', () => {
    const state = makeClockState({ actionsSinceLastProgression: 5 });
    expect(checkStalkerClock(state, 'survivor')).toBeNull();
  });

  it('returns warning when at warning threshold', () => {
    const state = makeClockState({
      actionsSinceLastProgression: BALANCE.STALKER_CLOCK.WARNING.survivor,
    });
    const event = checkStalkerClock(state, 'survivor');
    expect(event).not.toBeNull();
    expect(event!.type).toBe('warning');
  });

  it('returns threat_arrival when at threat threshold', () => {
    const state = makeClockState({
      actionsSinceLastProgression: BALANCE.STALKER_CLOCK.THREAT.survivor,
      warningIssued: true,
    });
    const event = checkStalkerClock(state, 'survivor');
    expect(event).not.toBeNull();
    expect(event!.type).toBe('threat_arrival');
  });

  it('returns kill when at kill threshold and threat issued', () => {
    const state = makeClockState({
      actionsSinceLastProgression: BALANCE.STALKER_CLOCK.KILL.survivor,
      warningIssued: true,
      threatArrivalIssued: true,
    });
    const event = checkStalkerClock(state, 'survivor');
    expect(event).not.toBeNull();
    expect(event!.type).toBe('kill');
  });

  it('explorer never reaches kill (threshold 999)', () => {
    const state = makeClockState({
      actionsSinceLastProgression: 100,
      warningIssued: true,
      threatArrivalIssued: true,
    });
    const event = checkStalkerClock(state, 'explorer');
    expect(event).toBeNull();
  });

  it('nightmare has lower thresholds', () => {
    const state = makeClockState({
      actionsSinceLastProgression: BALANCE.STALKER_CLOCK.WARNING.nightmare,
    });
    const event = checkStalkerClock(state, 'nightmare');
    expect(event).not.toBeNull();
    expect(event!.type).toBe('warning');
  });
});

describe('applyStalkerEvent', () => {
  it('marks warning as issued', () => {
    const state = makeClockState();
    const result = applyStalkerEvent(state, { type: 'warning' });
    expect(result.warningIssued).toBe(true);
    expect(result.threatArrivalIssued).toBe(false);
  });

  it('marks threat_arrival as issued', () => {
    const state = makeClockState({ warningIssued: true });
    const result = applyStalkerEvent(state, { type: 'threat_arrival' });
    expect(result.threatArrivalIssued).toBe(true);
  });

  it('kill does not change state', () => {
    const state = makeClockState({ warningIssued: true, threatArrivalIssued: true });
    const result = applyStalkerEvent(state, { type: 'kill' });
    expect(result).toEqual(state);
  });
});
