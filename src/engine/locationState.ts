// ---------------------------------------------------------------------------
// src/engine/locationState.ts — Mutable state of a location
// ---------------------------------------------------------------------------
// A room can catch fire, flood or lose pressure. Those are states of the place,
// independent from each other and from what the room contains. Same design as
// entityState: closed axes, all optional, an absent axis meaning "never stated".
// ---------------------------------------------------------------------------

import type { EnvironmentCondition, AtmosphereType } from './types';

export type PressureState = 'pressurized' | 'depressurized';
export type FireState = 'burning' | 'clear';
export type FloodState = 'flooded' | 'dry';
export type LightState = 'lit' | 'dark';
export type GravityState = 'normal' | 'zero_g';

export interface LocationState {
  readonly pressure?: PressureState;
  readonly fire?: FireState;
  readonly flood?: FloodState;
  readonly light?: LightState;
  readonly gravity?: GravityState;
}

/** Every token content or consequences may write. */
export type LocationStateId =
  | PressureState
  | FireState
  | FloodState
  | LightState
  | GravityState;

export const LOCATION_STATE_IDS: readonly LocationStateId[] = [
  'pressurized', 'depressurized',
  'burning', 'clear',
  'flooded', 'dry',
  'lit', 'dark',
  'normal', 'zero_g',
] as const;

/**
 * Apply one token, along with what it physically implies: losing pressure kills
 * artificial gravity and smothers a fire, flooding puts one out.
 */
export function applyLocationToken(state: LocationState, token: LocationStateId): LocationState {
  switch (token) {
    case 'pressurized':
      return { ...state, pressure: 'pressurized' };
    case 'depressurized':
      return { ...state, pressure: 'depressurized', gravity: 'zero_g', fire: 'clear' };
    case 'burning':
      return { ...state, fire: 'burning' };
    case 'clear':
      return { ...state, fire: 'clear' };
    case 'flooded':
      return { ...state, flood: 'flooded', fire: 'clear' };
    case 'dry':
      return { ...state, flood: 'dry' };
    case 'lit':
      return { ...state, light: 'lit' };
    case 'dark':
      return { ...state, light: 'dark' };
    case 'normal':
      return { ...state, gravity: 'normal' };
    case 'zero_g':
      return { ...state, gravity: 'zero_g' };
  }
}

/** The conditions the difficulty and narration layers read. */
export function deriveConditions(state: LocationState): EnvironmentCondition[] {
  const conditions: EnvironmentCondition[] = [];
  if (state.light === 'dark') conditions.push('dark');
  if (state.gravity === 'zero_g') conditions.push('zero_g');
  if (state.fire === 'burning') conditions.push('on_fire');
  if (state.flood === 'flooded') conditions.push('flooded');
  if (state.pressure === 'depressurized') conditions.push('depressurized');
  return conditions;
}

/** True when the location is lethal to an unprotected player. */
export function isLethalLocation(state: LocationState): boolean {
  return state.pressure === 'depressurized' || state.fire === 'burning';
}

/** Starting state of a location, from the atmosphere its node declares. */
export function locationStateFromAtmosphere(atmosphere: AtmosphereType): LocationState {
  return atmosphere === 'depressurized'
    ? { pressure: 'depressurized', gravity: 'zero_g' }
    : { pressure: 'pressurized' };
}
