// ---------------------------------------------------------------------------
// tests/unit/content/sceneBuilder.test.ts — Scene builder tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  buildDefaultScene,
  buildCustomScene,
  ITEM_LIST,
  NPC_LIST,
} from '../../../src/content/sceneBuilder';

describe('buildDefaultScene', () => {
  it('returns a valid SceneContext', () => {
    const scene = buildDefaultScene();
    expect(scene).toBeDefined();
    expect(scene.inventory).toBeInstanceOf(Array);
    expect(scene.locationItems).toBeInstanceOf(Array);
    expect(scene.npcs).toBeInstanceOf(Array);
    expect(scene.environmentFeatures).toBeInstanceOf(Array);
    expect(scene.connectedLocations).toBeInstanceOf(Array);
    expect(scene.suggestions).toEqual([]);
    expect(scene.environmentConditions).toEqual([]);
  });

  it('places first 5 items in inventory and next 5 in location', () => {
    const scene = buildDefaultScene();
    const itemIds = ITEM_LIST.map((i) => i.id);
    const expectedInventory = itemIds.slice(0, 5);
    const expectedLocation = itemIds.slice(5, 10);

    expect(scene.inventory.map((t) => t.id)).toEqual(expectedInventory);
    expect(scene.locationItems.map((t) => t.id)).toEqual(expectedLocation);
  });

  it('marks inventory items as source=inventory', () => {
    const scene = buildDefaultScene();
    for (const item of scene.inventory) {
      expect(item.source).toBe('inventory');
    }
  });

  it('marks location items as source=location', () => {
    const scene = buildDefaultScene();
    for (const item of scene.locationItems) {
      expect(item.source).toBe('location');
    }
  });

  it('includes all NPCs', () => {
    const scene = buildDefaultScene();
    expect(scene.npcs.length).toBe(NPC_LIST.length);
  });

  it('all resolved targets have properties', () => {
    const scene = buildDefaultScene();
    for (const t of [...scene.inventory, ...scene.locationItems]) {
      expect(t.properties.length).toBeGreaterThan(0);
    }
  });

  it('includes body parts', () => {
    const scene = buildDefaultScene();
    expect(scene.bodyParts).toBeDefined();
    expect(scene.bodyParts!.length).toBeGreaterThan(0);
  });

  it('includes connected locations', () => {
    const scene = buildDefaultScene();
    expect(scene.connectedLocations.length).toBe(3);
    expect(scene.connectedLocations[0]!.id).toBe('corridor_a');
  });
});

describe('buildCustomScene', () => {
  it('builds scene from specific item IDs', () => {
    const scene = buildCustomScene({
      inventoryIds: ['laser_pistol', 'knife'],
      locationIds: ['datapad'],
    });

    expect(scene.inventory.map((t) => t.id)).toEqual(['laser_pistol', 'knife']);
    expect(scene.locationItems.map((t) => t.id)).toEqual(['datapad']);
  });

  it('ignores unknown item IDs gracefully', () => {
    const scene = buildCustomScene({
      inventoryIds: ['laser_pistol', 'nonexistent_item'],
      locationIds: [],
    });

    expect(scene.inventory.map((t) => t.id)).toEqual(['laser_pistol']);
    expect(scene.locationItems).toEqual([]);
  });

  it('applies environment conditions', () => {
    const scene = buildCustomScene({
      inventoryIds: [],
      locationIds: [],
      conditions: ['dark', 'zero_g'],
    });

    expect(scene.environmentConditions).toEqual(['dark', 'zero_g']);
  });

  it('defaults to empty conditions if not provided', () => {
    const scene = buildCustomScene({
      inventoryIds: [],
      locationIds: [],
    });

    expect(scene.environmentConditions).toEqual([]);
  });
});
