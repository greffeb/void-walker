// ---------------------------------------------------------------------------
// tests/unit/engine/passives.test.ts — Class passives (decision G)
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  passiveOf,
  passiveEffectOf,
  passiveValueOf,
  applyHealingPassive,
  repairDifficultyModifier,
} from '../../../src/engine/passives';
import { calculateDifficulty } from '../../../src/engine/difficulty';
import { buildConsequences, applyConsequences } from '../../../src/engine/consequences';
import { BALANCE } from '../../../src/engine/constants';
import { CLASSES } from '../../../src/content/classes';
import type { GameState, SceneContext, ResolvedTarget, PlayerClassName } from '../../../src/engine/types';
import { createInitialGameState } from '../../../src/engine/types';
import type { PropertyId } from '../../../src/engine/properties';

const CLASS_NAMES: readonly PlayerClassName[] = ['marine', 'engineer', 'medic'];

function makeScene(): SceneContext {
  return {
    inventory: [], locationItems: [], npcs: [], environmentFeatures: [],
    connectedLocations: [], suggestions: [], environmentConditions: [],
  };
}

function makeState(className: PlayerClassName, hp: number): GameState {
  const base = createInitialGameState();
  return {
    ...base,
    character: {
      name: 'T', className, stats: CLASSES[className].baseStats,
      hp, maxHp: 20, oxygen: 100, inventory: [],
      equippedWeapon: null, equippedArmor: null, conditions: [],
      durability: {}, actionsInColdZone: 0, actionsWithoutRest: 0,
    },
  };
}

describe('passives — one place reads a class', () => {
  test('every class declares a passive with an effect', () => {
    for (const className of CLASS_NAMES) {
      const passive = passiveOf(className);
      expect(passive.effect).toBeTruthy();
      expect(passiveEffectOf(className)).toBe(passive.effect);
      expect(passiveValueOf(className)).toBe(passive.value);
    }
  });

  test('the marine is the one who hits harder', () => {
    expect(passiveEffectOf('marine')).toBe('COMBAT_DAMAGE_BONUS');
    expect(passiveValueOf('marine')).toBe(1);
    expect(passiveEffectOf('engineer')).not.toBe('COMBAT_DAMAGE_BONUS');
    expect(passiveEffectOf('medic')).not.toBe('COMBAT_DAMAGE_BONUS');
  });
});

describe('HEALING_BONUS — the medic passive that was advertised and never granted', () => {
  test('the medic restores more than the item is worth', () => {
    const value = passiveValueOf('medic') ?? 0;
    expect(applyHealingPassive(5, 'medic')).toBe(5 + value);
  });

  test('other classes restore exactly what the item is worth', () => {
    expect(applyHealingPassive(5, 'marine')).toBe(5);
    expect(applyHealingPassive(5, 'engineer')).toBe(5);
  });

  test('a passive never turns nothing into something', () => {
    // A failed treatment heals 0. Without this guard the medic would gain HP
    // from a heal that did not happen.
    expect(applyHealingPassive(0, 'medic')).toBe(0);
  });

  test('applied on the real heal path, not just in the helper', () => {
    const ration: ResolvedTarget = {
      id: 'ration', nameKey: 'item.ration',
      properties: ['edible'] as PropertyId[], isVirtual: false, source: 'inventory',
    };
    const consequences = buildConsequences('EAT', ration, 'success');
    const scene = makeScene();
    const rng = (): number => 0.5;

    const medic = applyConsequences(makeState('medic', 5), consequences, scene, rng);
    const marine = applyConsequences(makeState('marine', 5), consequences, scene, rng);

    expect(medic.character!.hp).toBeGreaterThan(marine.character!.hp);
    expect(medic.character!.hp - marine.character!.hp).toBe(passiveValueOf('medic'));
  });
});

describe('REPAIR_ALL_BROKEN — the engineer passive reaches the generic check', () => {
  test('only the engineer repairs without a penalty', () => {
    expect(repairDifficultyModifier('engineer')).toBe(0);
    expect(repairDifficultyModifier('marine')).toBe(BALANCE.DURABILITY.NON_ENGINEER_REPAIR_PENALTY);
    expect(repairDifficultyModifier('medic')).toBe(BALANCE.DURABILITY.NON_ENGINEER_REPAIR_PENALTY);
  });

  test('repairing is harder for anyone else', () => {
    const machine: ResolvedTarget = {
      id: 'generator', nameKey: 'env.generator',
      properties: ['mechanical', 'easily_repairable'] as PropertyId[],
      isVirtual: false, source: 'environment',
    };
    const input = {
      verb: 'REPAIR' as const,
      target: machine,
      tool: null,
      playerStats: CLASSES.engineer.baseStats,
      difficultyLevel: 'survivor' as const,
      creative: false,
    };
    const engineer = calculateDifficulty({ ...input, playerClass: 'engineer' as const });
    const marine = calculateDifficulty({ ...input, playerClass: 'marine' as const });

    expect(marine.total - engineer.total).toBe(BALANCE.DURABILITY.NON_ENGINEER_REPAIR_PENALTY);
  });

  test('the penalty only applies to repairing', () => {
    const machine: ResolvedTarget = {
      id: 'generator', nameKey: 'env.generator',
      properties: ['mechanical'] as PropertyId[], isVirtual: false, source: 'environment',
    };
    const input = {
      verb: 'EXAMINE' as const,
      target: machine,
      tool: null,
      playerStats: CLASSES.engineer.baseStats,
      difficultyLevel: 'survivor' as const,
      creative: false,
    };
    expect(calculateDifficulty({ ...input, playerClass: 'marine' as const }).total)
      .toBe(calculateDifficulty({ ...input, playerClass: 'engineer' as const }).total);
  });
});
