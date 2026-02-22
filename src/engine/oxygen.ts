// ---------------------------------------------------------------------------
// src/engine/oxygen.ts — Zone-based O2 drain, HP drain at 0, restoration
// ---------------------------------------------------------------------------

import type { AtmosphereType } from './types';
import { BALANCE } from './constants';

/** Oxygen state for a player */
export interface OxygenTickState {
  readonly current: number;
  readonly max: number;
}

/**
 * Get O2 drain rate for an atmosphere type, considering EVA suit.
 */
export function getDrainRate(atmosphere: AtmosphereType, hasEvaSuit: boolean): number {
  let rate: number;
  switch (atmosphere) {
    case 'pressurized': rate = BALANCE.OXYGEN.DRAIN_PRESSURIZED; break;
    case 'low_oxygen': rate = BALANCE.OXYGEN.DRAIN_LOW_OXYGEN; break;
    case 'depressurized': rate = BALANCE.OXYGEN.DRAIN_DEPRESSURIZED; break;
    case 'toxic_atmosphere': rate = BALANCE.OXYGEN.DRAIN_TOXIC; break;
  }
  if (hasEvaSuit && rate > 0) {
    rate = Math.floor(rate * BALANCE.OXYGEN.EVA_DRAIN_REDUCTION);
  }
  return rate;
}

/**
 * Tick oxygen: drain based on atmosphere, restore in pressurized zones,
 * and apply HP drain when O2 reaches 0.
 */
export function tickOxygen(
  oxygenState: OxygenTickState,
  atmosphere: AtmosphereType,
  hasEvaSuit: boolean,
): { readonly newOxygen: OxygenTickState; readonly hpDrain: number } {
  const drain = getDrainRate(atmosphere, hasEvaSuit);

  if (drain === 0) {
    // Pressurized: restore O2
    const restored = Math.min(oxygenState.max, oxygenState.current + BALANCE.OXYGEN.RESTORE_RATE_SAFE);
    return {
      newOxygen: { current: restored, max: oxygenState.max },
      hpDrain: 0,
    };
  }

  let newCurrent = oxygenState.current - drain;
  let hpDrain = 0;

  if (newCurrent <= 0) {
    newCurrent = 0;
    hpDrain = BALANCE.OXYGEN.HP_DRAIN_AT_ZERO;
  }

  return {
    newOxygen: { current: newCurrent, max: oxygenState.max },
    hpDrain,
  };
}

/**
 * Use an O2 canister: restore CANISTER_RESTORE O2, capped at max.
 */
export function useOxygenCanister(oxygenState: OxygenTickState): OxygenTickState {
  return {
    current: Math.min(oxygenState.max, oxygenState.current + BALANCE.OXYGEN.CANISTER_RESTORE),
    max: oxygenState.max,
  };
}
