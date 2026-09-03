// ---------------------------------------------------------------------------
// tests/unit/engine/useHeal.test.ts — USE verb on healing consumables (Issue #85)
// ---------------------------------------------------------------------------
// A medic USING a medical kit / stimulant must restore HP. Regression guard for
// #85: "USE trousse de soins → succès mais 0 PV gagné".
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { buildConsequences } from '../../../src/engine/consequences';
import { ITEM_DEFINITIONS } from '../../../src/content/items';
import type { ResolvedTarget } from '../../../src/engine/types';

function makeItemTarget(id: string): ResolvedTarget {
  const def = ITEM_DEFINITIONS[id];
  return {
    id,
    nameKey: def.nameKey,
    // Properties are irrelevant to USE-heal detection (it keys off healingValue).
    properties: def.extra_props ?? [],
    isVirtual: false,
    source: 'inventory',
  };
}

describe('USE on healing consumable (Issue #85)', () => {
  test('USE medical_kit on success heals by its healingValue and consumes the item', () => {
    const target = makeItemTarget('medical_kit');
    const result = buildConsequences('USE', target, 'success');

    const heal = result.find(c => c.type === 'heal');
    expect(heal).toBeDefined();
    expect(heal?.targetId).toBe('player');
    expect(heal?.amount).toBe(5); // medical_kit healingValue

    const consume = result.find(c => c.type === 'inventory_remove');
    expect(consume?.itemId).toBe('medical_kit');
  });

  test('USE stimulant on crit_success heals by its healingValue', () => {
    const target = makeItemTarget('stimulant');
    const result = buildConsequences('USE', target, 'crit_success');

    const heal = result.find(c => c.type === 'heal');
    expect(heal?.amount).toBe(3); // stimulant healingValue
  });

  test('USE medical_kit on failure does not heal and does not consume the kit', () => {
    const target = makeItemTarget('medical_kit');
    const result = buildConsequences('USE', target, 'failure');

    expect(result.find(c => c.type === 'heal')).toBeUndefined();
    expect(result.find(c => c.type === 'inventory_remove')).toBeUndefined();
  });

  test('USE on a non-healing item does not produce a heal', () => {
    const target = makeItemTarget('scanner');
    const result = buildConsequences('USE', target, 'success');

    expect(result.find(c => c.type === 'heal')).toBeUndefined();
  });
});
