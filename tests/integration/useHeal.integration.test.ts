// ---------------------------------------------------------------------------
// tests/integration/useHeal.integration.test.ts
// End-to-end guard for Issue #85: a medic USING a medical kit at low HP must
// actually gain HP through the full processTurn pipeline (parse → resolve →
// consequences → apply), not just at the buildConsequences unit level.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { processTurn } from '../../src/engine/processTurn';
import { createInitialGameState } from '../../src/engine/types';
import { buildParserLocaleData } from '../../src/content/parserData';
import { createSeededRng } from '../../src/engine/rng';
import type { GameState, CharacterState, SceneContext } from '../../src/engine/types';

const parserData = buildParserLocaleData('fr');

function makeMedicAtLowHp(): GameState {
  const character: CharacterState = {
    name: 'Medic',
    className: 'medic',
    // FOR is deliberately high so the USE check succeeds deterministically:
    // Issue #85 is about a *successful* use that still healed nothing, so the
    // regression must exercise the success path regardless of the RNG seed.
    stats: { FOR: 20, DEF: 2, AGI: 3, INT: 4, PER: 3, CHA: 2, LCK: 5 },
    hp: 1,
    maxHp: 15,
    oxygen: 79,
    inventory: ['medical_kit'],
    equippedWeapon: null,
    equippedArmor: null,
    conditions: [],
    durability: {},
    actionsInColdZone: 0,
    actionsWithoutRest: 0,
  };
  return {
    ...createInitialGameState(),
    phase: 'playing',
    difficulty: 'explorer',
    character,
  };
}

const context: SceneContext = {
  inventory: [
    {
      id: 'medical_kit', nameKey: 'item.medical_kit' as never,
      properties: ['tangible', 'liftable', 'small', 'usable', 'organic_compatible', 'injectable'] as unknown as never[],
      isVirtual: false, source: 'inventory',
      aliases: ['trousse', 'medicale', 'medkit', 'soin', 'premiers', 'secours', 'kit'],
    },
  ],
  locationItems: [],
  npcs: [],
  environmentFeatures: [],
  connectedLocations: [],
  suggestions: [],
  environmentConditions: [],
  atmosphere: 'pressurized',
  locationId: 'airlock_01',
};

describe('Issue #85 — USE medical kit heals through processTurn', () => {
  it('gains HP and consumes the kit on a successful use', () => {
    const rng = createSeededRng(106701255);
    const state = makeMedicAtLowHp();

    const result = processTurn(state, "j'utilise la trousse de soins", context, parserData, rng);

    // The kit's healingValue is 5; at 1 HP the player must end strictly above 1.
    expect(result.newState.character!.hp).toBeGreaterThan(1);
    // A successful use consumes the kit.
    expect(result.newState.character!.inventory).not.toContain('medical_kit');
  });
});
