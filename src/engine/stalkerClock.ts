// ---------------------------------------------------------------------------
// src/engine/stalkerClock.ts — Idle pressure counter, events
// ---------------------------------------------------------------------------

import type { StalkerClockState, StalkerEvent, DifficultyLevel } from './types';
import { BALANCE } from './constants';

/**
 * Increment the stalker clock by one action.
 */
export function tickStalkerClock(state: StalkerClockState): StalkerClockState {
  return {
    ...state,
    actionsSinceLastProgression: state.actionsSinceLastProgression + 1,
  };
}

/**
 * Reset the stalker clock (on node/scene progression).
 */
export function resetStalkerClock(): StalkerClockState {
  return {
    actionsSinceLastProgression: 0,
    warningIssued: false,
    threatArrivalIssued: false,
  };
}

/**
 * Check for stalker events based on current counter and difficulty.
 * Returns the highest-priority event that hasn't been issued yet, or null.
 */
export function checkStalkerClock(
  state: StalkerClockState,
  difficulty: DifficultyLevel,
): StalkerEvent | null {
  const actions = state.actionsSinceLastProgression;
  const thresholds = BALANCE.STALKER_CLOCK;

  // Kill check (only after threat has arrived)
  if (state.threatArrivalIssued && actions >= thresholds.KILL[difficulty]) {
    return { type: 'kill' };
  }

  // Threat arrival check
  if (!state.threatArrivalIssued && actions >= thresholds.THREAT[difficulty]) {
    return { type: 'threat_arrival' };
  }

  // Warning check
  if (!state.warningIssued && actions >= thresholds.WARNING[difficulty]) {
    return { type: 'warning' };
  }

  return null;
}

/**
 * Apply a stalker event to the clock state (mark as issued).
 */
export function applyStalkerEvent(
  state: StalkerClockState,
  event: StalkerEvent,
): StalkerClockState {
  switch (event.type) {
    case 'warning':
      return { ...state, warningIssued: true };
    case 'threat_arrival':
      return { ...state, threatArrivalIssued: true };
    case 'kill':
      return state; // kill doesn't change clock state, just repeats
  }
}
