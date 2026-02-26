// ---------------------------------------------------------------------------
// tests/unit/engine/scenarioFlagMapper.test.ts — Chantier 3, Étape 2
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import { mapScenarioFlags } from '../../../src/engine/scenarioFlagMapper';

describe('mapScenarioFlags', () => {
  it('returns empty effects for null/undefined flags', () => {
    const result = mapScenarioFlags(undefined, 'escape');
    expect(result.lethalLocations).toEqual([]);
    expect(result.fullyContainedLocations).toEqual([]);
    expect(result.activatedObjects).toEqual([]);
    expect(result.selfDestructActive).toBe(false);
  });

  it('returns empty effects for null skeletonId', () => {
    const result = mapScenarioFlags({ 'cargo_jettisoned': true }, null);
    expect(result.lethalLocations).toEqual([]);
  });

  it('escape + cargo_jettisoned → boss in lethalLocations', () => {
    const result = mapScenarioFlags({ 'cargo_jettisoned': true }, 'escape');
    expect(result.lethalLocations).toContain('boss');
  });

  it('escape + cargo_depressurized → boss in lethalLocations', () => {
    const result = mapScenarioFlags({ 'cargo_depressurized': true }, 'escape');
    expect(result.lethalLocations).toContain('boss');
  });

  it('escape + no relevant flags → empty', () => {
    const result = mapScenarioFlags({ 'some_other_flag': true }, 'escape');
    expect(result.lethalLocations).toEqual([]);
  });

  it('investigate + evidence_transmitted → beacon in activatedObjects', () => {
    const result = mapScenarioFlags({ 'evidence_transmitted': true }, 'investigate');
    expect(result.activatedObjects).toContain('emergency_beacon');
  });

  it('investigate + reactor_killed + shuttle_released → selfDestructActive', () => {
    const result = mapScenarioFlags({ 'reactor_killed': true, 'shuttle_released': true }, 'investigate');
    expect(result.selfDestructActive).toBe(true);
  });

  it('unknown skeleton → empty effects', () => {
    const result = mapScenarioFlags({ 'cargo_jettisoned': true }, 'unknown_skeleton');
    expect(result.lethalLocations).toEqual([]);
    expect(result.activatedObjects).toEqual([]);
    expect(result.selfDestructActive).toBe(false);
  });
});
