// ---------------------------------------------------------------------------
// tests/unit/content/items.test.ts — Item definitions verification
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { ITEM_LIST, ITEM_DEFINITIONS, resolveItemProperties } from '../../../src/content/items';
import { PROPERTY_IDS } from '../../../src/engine/properties';

const validProps = new Set(PROPERTY_IDS);

describe('ITEM_LIST', () => {
  test('has at least 20 items', () => {
    expect(ITEM_LIST.length).toBeGreaterThanOrEqual(20);
  });

  test('no duplicate item IDs', () => {
    const ids = ITEM_LIST.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('ITEM_DEFINITIONS has same count as ITEM_LIST', () => {
    expect(Object.keys(ITEM_DEFINITIONS)).toHaveLength(ITEM_LIST.length);
  });
});

describe('resolveItemProperties', () => {
  test('all items resolve to valid PropertyIds', () => {
    for (const item of ITEM_LIST) {
      const props = resolveItemProperties(item.id);
      for (const p of props) {
        expect(validProps.has(p)).toBe(true);
      }
    }
  });

  test('laser_pistol has ranged and electronic', () => {
    const props = resolveItemProperties('laser_pistol');
    expect(props).toContain('ranged');
    expect(props).toContain('electronic');
  });

  test('metal_bar is not small', () => {
    const props = resolveItemProperties('metal_bar');
    expect(props).not.toContain('small');
  });

  test('knife has bladed and sharp', () => {
    const props = resolveItemProperties('knife');
    expect(props).toContain('bladed');
    expect(props).toContain('sharp');
  });

  test('ration is edible', () => {
    const props = resolveItemProperties('ration');
    expect(props).toContain('edible');
  });

  test('unknown item returns empty array', () => {
    expect(resolveItemProperties('nonexistent')).toEqual([]);
  });
});
