// ---------------------------------------------------------------------------
// tests/unit/engine/eat.test.ts — EAT verb mechanics tests
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { buildConsequences, getEatTier } from '../../../src/engine/consequences';
import { BALANCE } from '../../../src/engine/constants';
import type { ResolvedTarget } from '../../../src/engine/types';

// === HELPERS ===

function makeTarget(props: string[]): ResolvedTarget {
  return {
    id: 'test_item',
    nameKey: 'item.test' as import('../../../src/i18n/types').StringKey,
    properties: props as import('../../../src/engine/properties').PropertyId[],
    isVirtual: false,
    source: 'inventory',
  };
}

// ---------------------------------------------------------------------------
// getEatTier — tier detection by property priority
// ---------------------------------------------------------------------------

describe('getEatTier', () => {
  test('null target → generic', () => {
    expect(getEatTier(null)).toBe('generic');
  });

  test('edible property → edible tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'small', 'edible']))).toBe('edible');
  });

  test('drinkable (without edible) → drinkable tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'liquid', 'drinkable']))).toBe('drinkable');
  });

  test('edible takes priority over drinkable', () => {
    expect(getEatTier(makeTarget(['edible', 'drinkable']))).toBe('edible');
  });

  test('alive → alive tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'alive', 'organic']))).toBe('alive');
  });

  test('sentient → alive tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'sentient', 'alive']))).toBe('alive');
  });

  test('heavy without small → oversized tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'heavy', 'metallic']))).toBe('oversized');
  });

  test('heavy WITH small → not oversized (use next tier)', () => {
    // small+heavy+metallic → inorganic (metallic takes priority over generic)
    expect(getEatTier(makeTarget(['tangible', 'small', 'heavy', 'metallic']))).toBe('inorganic');
  });

  test('toxic → toxic tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'small', 'toxic']))).toBe('toxic');
  });

  test('corrosive → toxic tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'liquid', 'corrosive']))).toBe('toxic');
  });

  test('radioactive → toxic tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'small', 'radioactive']))).toBe('toxic');
  });

  test('sharp → sharp tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'holdable', 'small', 'metallic', 'sharp']))).toBe('sharp');
  });

  test('bladed → sharp tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'holdable', 'small', 'metallic', 'bladed']))).toBe('sharp');
  });

  test('pointed → sharp tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'small', 'pointed']))).toBe('sharp');
  });

  test('toxic takes priority over sharp', () => {
    expect(getEatTier(makeTarget(['toxic', 'sharp']))).toBe('toxic');
  });

  test('metallic → inorganic tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'holdable', 'small', 'metallic']))).toBe('inorganic');
  });

  test('synthetic → inorganic tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'small', 'synthetic']))).toBe('inorganic');
  });

  test('electronic → inorganic tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'small', 'electronic', 'readable']))).toBe('inorganic');
  });

  test('dead+organic → dead_organic tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'dead', 'organic']))).toBe('dead_organic');
  });

  test('dead without organic → generic (not dead_organic)', () => {
    expect(getEatTier(makeTarget(['tangible', 'dead', 'metallic']))).toBe('inorganic');
  });

  test('no special properties → generic tier', () => {
    expect(getEatTier(makeTarget(['tangible', 'liftable', 'small', 'flat']))).toBe('generic');
  });
});

// ---------------------------------------------------------------------------
// buildConsequences — EAT mechanical effects
// ---------------------------------------------------------------------------

describe('buildConsequences EAT', () => {
  test('eating edible item heals player', () => {
    const target = makeTarget(['tangible', 'small', 'edible', 'organic']);
    const result = buildConsequences('EAT', target, 'auto_success');
    const healConsequence = result.find(c => c.type === 'heal');
    expect(healConsequence).toBeDefined();
    expect(healConsequence?.targetId).toBe('player');
    expect((healConsequence?.amount ?? 0) > 0).toBe(true);
  });

  test('eating edible item removes it from inventory', () => {
    const target = makeTarget(['tangible', 'small', 'edible', 'organic']);
    const result = buildConsequences('EAT', target, 'auto_success');
    const removeConsequence = result.find(c => c.type === 'inventory_remove');
    expect(removeConsequence).toBeDefined();
    expect(removeConsequence?.itemId).toBe(target.id);
  });

  test('eating drinkable-only item has no mechanical consequences', () => {
    const target = makeTarget(['tangible', 'liquid', 'drinkable']);
    const result = buildConsequences('EAT', target, 'auto_success');
    expect(result.find(c => c.type === 'damage')).toBeUndefined();
    expect(result.find(c => c.type === 'heal')).toBeUndefined();
  });

  test('eating alive entity has no damage consequences', () => {
    const target = makeTarget(['tangible', 'alive', 'organic']);
    const result = buildConsequences('EAT', target, 'auto_success');
    expect(result.find(c => c.type === 'damage')).toBeUndefined();
  });

  test('eating oversized item has no consequences', () => {
    const target = makeTarget(['tangible', 'heavy', 'metallic']);
    const result = buildConsequences('EAT', target, 'auto_success');
    expect(result.find(c => c.type === 'damage')).toBeUndefined();
    expect(result.find(c => c.type === 'heal')).toBeUndefined();
  });

  test('eating toxic item deals EAT_TOXIC_DAMAGE to player', () => {
    const target = makeTarget(['tangible', 'small', 'toxic']);
    const result = buildConsequences('EAT', target, 'auto_success');
    const damage = result.find(c => c.type === 'damage');
    expect(damage).toBeDefined();
    expect(damage?.targetId).toBe('player');
    expect(damage?.amount).toBe(BALANCE.EAT_TOXIC_DAMAGE);
  });

  test('eating corrosive item deals EAT_TOXIC_DAMAGE', () => {
    const target = makeTarget(['tangible', 'liquid', 'corrosive']);
    const result = buildConsequences('EAT', target, 'auto_success');
    const damage = result.find(c => c.type === 'damage');
    expect(damage?.amount).toBe(BALANCE.EAT_TOXIC_DAMAGE);
  });

  test('eating sharp item deals EAT_SHARP_DAMAGE to player', () => {
    const target = makeTarget(['tangible', 'holdable', 'small', 'metallic', 'sharp', 'bladed']);
    const result = buildConsequences('EAT', target, 'auto_success');
    const damage = result.find(c => c.type === 'damage');
    expect(damage).toBeDefined();
    expect(damage?.targetId).toBe('player');
    expect(damage?.amount).toBe(BALANCE.EAT_SHARP_DAMAGE);
  });

  test('eating bladed item deals EAT_SHARP_DAMAGE', () => {
    const target = makeTarget(['tangible', 'holdable', 'small', 'metallic', 'bladed']);
    const result = buildConsequences('EAT', target, 'auto_success');
    const damage = result.find(c => c.type === 'damage');
    expect(damage?.amount).toBe(BALANCE.EAT_SHARP_DAMAGE);
  });

  test('eating sharp item damage is non-lethal', () => {
    const target = makeTarget(['tangible', 'sharp']);
    const result = buildConsequences('EAT', target, 'auto_success');
    const damage = result.find(c => c.type === 'damage');
    expect(damage?.nonLethal).toBe(true);
  });

  test('eating toxic item damage is non-lethal', () => {
    const target = makeTarget(['tangible', 'toxic']);
    const result = buildConsequences('EAT', target, 'auto_success');
    const damage = result.find(c => c.type === 'damage');
    expect(damage?.nonLethal).toBe(true);
  });

  test('eating inorganic item has no consequences', () => {
    const target = makeTarget(['tangible', 'holdable', 'small', 'metallic']);
    const result = buildConsequences('EAT', target, 'auto_success');
    expect(result.find(c => c.type === 'damage')).toBeUndefined();
    expect(result.find(c => c.type === 'heal')).toBeUndefined();
  });

  test('eating dead organic has no consequences', () => {
    const target = makeTarget(['tangible', 'dead', 'organic']);
    const result = buildConsequences('EAT', target, 'auto_success');
    expect(result.find(c => c.type === 'damage')).toBeUndefined();
    expect(result.find(c => c.type === 'heal')).toBeUndefined();
  });

  test('eating generic item has no consequences', () => {
    const target = makeTarget(['tangible', 'flat']);
    const result = buildConsequences('EAT', target, 'auto_success');
    expect(result.find(c => c.type === 'damage')).toBeUndefined();
    expect(result.find(c => c.type === 'heal')).toBeUndefined();
  });

  test('null target for EAT has no consequences', () => {
    const result = buildConsequences('EAT', null, 'auto_success');
    expect(result.find(c => c.type === 'damage')).toBeUndefined();
    expect(result.find(c => c.type === 'heal')).toBeUndefined();
  });

  test('EAT outcome does not matter - consequences based on tier only', () => {
    // EAT is auto, outcome is always auto_success, but we verify behavior is consistent
    const target = makeTarget(['edible']);
    const resultAuto = buildConsequences('EAT', target, 'auto_success');
    const resultSuccess = buildConsequences('EAT', target, 'success');
    expect(resultAuto.find(c => c.type === 'heal')).toBeDefined();
    expect(resultSuccess.find(c => c.type === 'heal')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// EAT verb requirements — only 'edible' should qualify
// ---------------------------------------------------------------------------

describe('EAT verb requirements', () => {
  test('EAT requirements only include edible (not small)', async () => {
    const { VERB_REGISTRY } = await import('../../../src/engine/verbs');
    const eatDef = VERB_REGISTRY.EAT;
    const { targetProps } = eatDef.requirements;
    // Should only have one clause: ['edible']
    expect(targetProps).toHaveLength(1);
    expect(targetProps[0]).toEqual(['edible']);
  });
});
