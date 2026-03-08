// ---------------------------------------------------------------------------
// tests/unit/engine/initGameEnriched.test.ts — Chantier 3, C3-9
// ---------------------------------------------------------------------------
// Tests that initGame() populates featureStates from scenario definitions.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { initGame } from '../../../src/engine/game';
import { assembleScenario } from '../../../src/engine/pacing';
import { ESCAPE_SKELETON } from '../../../src/content/scenarios/escape';
import { ALL_MODULES } from '../../../src/content/scenarios/modules/index';
import type { RngFn } from '../../../src/engine/types';

function fixedRng(v = 0.42): RngFn { return () => v; }

describe('C3-9: initGame populates featureStates', () => {
  const scenario = assembleScenario(
    ESCAPE_SKELETON,
    'quick',
    ALL_MODULES,
    fixedRng(),
  );

  const state = initGame(scenario, 'marine', 'survivor', 'Test', fixedRng());

  it('emergency_locker starts as "locked"', () => {
    expect(state.featureStates['emergency_locker']).toBe('locked');
  });

  it('cryopod starts as "broken"', () => {
    expect(state.featureStates['cryopod']).toBe('broken');
  });

  it('revealedItems, unlockedExits, scenarioFlags are empty objects', () => {
    expect(state.revealedItems).toEqual({});
    expect(state.unlockedExits).toEqual({});
    expect(state.scenarioFlags).toEqual({});
  });
});
