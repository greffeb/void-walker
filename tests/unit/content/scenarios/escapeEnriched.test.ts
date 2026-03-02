// ---------------------------------------------------------------------------
// tests/unit/content/scenarios/escapeEnriched.test.ts
// ---------------------------------------------------------------------------
// Structural validation of the enriched ESCAPE skeleton (Chantier 2).
// Ensures all features have featureType, aliases, descriptions, interactions;
// all items have itemType, aliases; hidden items have revealedBy; gate items
// have useOn; cross-references are valid.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { ESCAPE_SKELETON } from '../../../../src/content/scenarios/escape';
import {
  isEnrichedFeature,
  isEnrichedItem,
  type ScenarioFeatureDefinition,
  type ScenarioItemDefinition,
} from '../../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All node locations from the ESCAPE skeleton */
const allNodes = Object.entries(ESCAPE_SKELETON.nodeLocations);

/** Collect all features across all nodes */
function allFeatures(): { nodeId: string; feature: ScenarioFeatureDefinition }[] {
  const result: { nodeId: string; feature: ScenarioFeatureDefinition }[] = [];
  for (const [nodeId, loc] of allNodes) {
    for (const f of loc.features) {
      result.push({ nodeId, feature: f as ScenarioFeatureDefinition });
    }
  }
  return result;
}

/** Collect all items across all nodes */
function allItems(): { nodeId: string; item: ScenarioItemDefinition }[] {
  const result: { nodeId: string; item: ScenarioItemDefinition }[] = [];
  for (const [nodeId, loc] of allNodes) {
    for (const i of loc.items) {
      result.push({ nodeId, item: i as ScenarioItemDefinition });
    }
  }
  return result;
}

/** Set of all feature IDs across all nodes */
function allFeatureIds(): Set<string> {
  return new Set(allFeatures().map(f => f.feature.id));
}

/** Set of all item IDs across all nodes */
function allItemIds(): Set<string> {
  return new Set(allItems().map(i => i.item.id));
}

/** Known scenario flags documented in the spec */
const KNOWN_FLAGS = new Set([
  'terminal_read',
  'ship_map_found',
  'bulkhead_unlocked',
  'oracle_revealed',
  'o2_stabilized',
  'sections_sealed',
  'pod_hatch_open',
  'cargo_jettisoned',
  'cargo_depressurized',
  'creature_distracted',
  'hatch_bypass_found',
]);

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('ESCAPE skeleton — enriched structural validation', () => {
  const features = allFeatures();
  const items = allItems();
  const featureIds = allFeatureIds();
  const itemIds = allItemIds();

  // =========================================================================
  // 1. All features have a featureType
  // =========================================================================
  it('1. all features have a featureType (except decorative)', () => {
    for (const { nodeId, feature } of features) {
      expect(
        isEnrichedFeature(feature),
        `Feature "${feature.id}" in node "${nodeId}" is not enriched`,
      ).toBe(true);
      const enriched = feature;
      expect(
        enriched.featureType,
        `Feature "${feature.id}" in node "${nodeId}" has no featureType`,
      ).toBeDefined();
    }
  });

  // =========================================================================
  // 2. All interactive features have at least 1 interaction
  // =========================================================================
  it('2. all non-decorative features have interactions', () => {
    for (const { nodeId, feature } of features) {
      const enriched = feature;
      if (enriched.decorative) continue;
      expect(
        enriched.interactions?.length,
        `Feature "${feature.id}" in node "${nodeId}" has no interactions and is not decorative`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // =========================================================================
  // 3. All features have aliases.fr with at least 2 entries
  // =========================================================================
  it('3. all features have at least 2 FR aliases', () => {
    for (const { nodeId, feature } of features) {
      const enriched = feature;
      expect(
        enriched.aliases?.fr?.length,
        `Feature "${feature.id}" in node "${nodeId}" has fewer than 2 FR aliases`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  // =========================================================================
  // 4. All features have descriptions for at least their initialState
  // =========================================================================
  it('4. all features have description for their initialState', () => {
    for (const { nodeId, feature } of features) {
      const enriched = feature;
      const state = enriched.initialState ?? 'intact';
      expect(
        enriched.descriptions?.[state],
        `Feature "${feature.id}" in node "${nodeId}" has no description for state "${state}"`,
      ).toBeDefined();
      expect(
        enriched.descriptions?.[state]?.fr?.length,
        `Feature "${feature.id}" in "${nodeId}" has empty FR description for state "${state}"`,
      ).toBeGreaterThan(0);
    }
  });

  // =========================================================================
  // 5. All items have an itemType
  // =========================================================================
  it('5. all items have an itemType', () => {
    for (const { nodeId, item } of items) {
      expect(
        isEnrichedItem(item),
        `Item "${item.id}" in node "${nodeId}" is not enriched`,
      ).toBe(true);
      const enriched = item;
      expect(
        enriched.itemType,
        `Item "${item.id}" in node "${nodeId}" has no itemType`,
      ).toBeDefined();
    }
  });

  // =========================================================================
  // 6. All items have at least 2 FR aliases
  // =========================================================================
  it('6. all items have at least 2 FR aliases', () => {
    for (const { nodeId, item } of items) {
      const enriched = item;
      expect(
        enriched.aliases?.fr?.length,
        `Item "${item.id}" in node "${nodeId}" has fewer than 2 FR aliases`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  // =========================================================================
  // 7. All hidden items have a revealedBy
  // =========================================================================
  it('7. all hidden items have a revealedBy', () => {
    for (const { nodeId, item } of items) {
      const enriched = item;
      if (!enriched.hidden) continue;
      expect(
        enriched.revealedBy,
        `Hidden item "${item.id}" in node "${nodeId}" has no revealedBy`,
      ).toBeDefined();
    }
  });

  // =========================================================================
  // 8. Gate item (access_keycard) has useOn for security_panel
  // =========================================================================
  it('8. access_keycard has useOn for security_panel', () => {
    const keycard = items.find(i => i.item.id === 'access_keycard');
    expect(keycard).toBeDefined();
    const enriched = keycard!.item;
    const panelUseOn = enriched.useOn?.find(u => u.targetId === 'security_panel');
    expect(panelUseOn).toBeDefined();
  });

  // =========================================================================
  // 9. Gate item has useOn for escape_pod_hatch
  // =========================================================================
  it('9. access_keycard has useOn for escape_pod_hatch', () => {
    const keycard = items.find(i => i.item.id === 'access_keycard');
    expect(keycard).toBeDefined();
    const enriched = keycard!.item;
    const hatchUseOn = enriched.useOn?.find(u => u.targetId === 'escape_pod_hatch');
    expect(hatchUseOn).toBeDefined();
  });

  // =========================================================================
  // 10. Each "contains" references an item that exists in the scenario
  // =========================================================================
  it('10. each contains references an existing scenario item', () => {
    for (const { nodeId, feature } of features) {
      const enriched = feature;
      if (!enriched.contains) continue;
      for (const containedId of enriched.contains) {
        expect(
          itemIds.has(containedId),
          `Feature "${feature.id}" in "${nodeId}" contains "${containedId}" which doesn't exist`,
        ).toBe(true);
      }
    }
  });

  // =========================================================================
  // 11. Each revealedBy.featureId references a feature that exists
  // =========================================================================
  it('11. each revealedBy.featureId references an existing feature', () => {
    for (const { nodeId, item } of items) {
      const enriched = item;
      if (!enriched.revealedBy) continue;
      expect(
        featureIds.has(enriched.revealedBy.featureId),
        `Item "${item.id}" in "${nodeId}" revealedBy feature "${enriched.revealedBy.featureId}" which doesn't exist`,
      ).toBe(true);
    }
  });

  // =========================================================================
  // 12. Each useOn.targetId references an existing feature
  // =========================================================================
  it('12. each useOn.targetId references an existing feature or special target', () => {
    // 'self' is a special targetId for self-use items (e.g., medkit → heal player)
    const specialTargets = new Set(['self']);
    for (const { nodeId, item } of items) {
      const enriched = item;
      if (!enriched.useOn) continue;
      for (const use of enriched.useOn) {
        expect(
          featureIds.has(use.targetId) || specialTargets.has(use.targetId),
          `Item "${item.id}" in "${nodeId}" useOn target "${use.targetId}" doesn't exist as a feature or special target`,
        ).toBe(true);
      }
    }
  });

  // =========================================================================
  // 13. Each interaction requiredItem references a scenario item or registry
  // =========================================================================
  it('13. each interaction requiredItem references a known item', () => {
    // Items that exist in the global registry but not in this scenario
    const registryItems = new Set(['standard_toolkit', 'knife']);
    const knownItems = new Set([...itemIds, ...registryItems]);

    for (const { nodeId, feature } of features) {
      const enriched = feature;
      if (!enriched.interactions) continue;
      for (const interaction of enriched.interactions) {
        if (interaction.trigger.requiredItem) {
          expect(
            knownItems.has(interaction.trigger.requiredItem),
            `Feature "${feature.id}" in "${nodeId}" requires unknown item "${interaction.trigger.requiredItem}"`,
          ).toBe(true);
        }
      }
    }
  });

  // =========================================================================
  // 14. Each interaction requiredFlag corresponds to a documented flag
  // =========================================================================
  it('14. each interaction requiredFlag is a documented flag', () => {
    for (const { nodeId, feature } of features) {
      const enriched = feature;
      if (!enriched.interactions) continue;
      for (const interaction of enriched.interactions) {
        if (interaction.trigger.requiredFlag) {
          expect(
            KNOWN_FLAGS.has(interaction.trigger.requiredFlag),
            `Feature "${feature.id}" in "${nodeId}" requires unknown flag "${interaction.trigger.requiredFlag}"`,
          ).toBe(true);
        }
      }
    }
  });

  // =========================================================================
  // ADDITIONAL: verify entity counts
  // =========================================================================
  it('has exactly 8 items across all nodes', () => {
    expect(items.length).toBe(8);
  });

  it('has exactly 16 features across all nodes', () => {
    expect(features.length).toBe(16);
  });

  it('has 3 decorative features', () => {
    const decorative = features.filter(f =>
      (f.feature).decorative === true);
    expect(decorative.length).toBe(3);
  });

  it('has 5 hidden items', () => {
    const hidden = items.filter(i => (i.item).hidden === true);
    expect(hidden.length).toBe(5);
  });

  // =========================================================================
  // ADDITIONAL: verify the contains items match the hidden items
  // =========================================================================
  it('every contained item is hidden and in the same node as its container', () => {
    for (const { nodeId, feature } of features) {
      const enriched = feature;
      if (!enriched.contains) continue;
      for (const containedId of enriched.contains) {
        // Find the item
        const item = items.find(i => i.item.id === containedId);
        expect(item).toBeDefined();
        // Item should be hidden
        expect(
          (item!.item).hidden,
          `Contained item "${containedId}" should be hidden`,
        ).toBe(true);
        // Item should be in the same node as its container
        expect(
          item!.nodeId,
          `Item "${containedId}" (in node "${item!.nodeId}") doesn't match container feature "${feature.id}" (in node "${nodeId}")`,
        ).toBe(nodeId);
      }
    }
  });

  // =========================================================================
  // ADDITIONAL: all flagSet values in interactions are documented flags
  // =========================================================================
  it('all flagSet values are documented flags', () => {
    for (const { nodeId, feature } of features) {
      const enriched = feature;
      if (!enriched.interactions) continue;
      for (const interaction of enriched.interactions) {
        if (interaction.onSuccess.flagSet) {
          expect(
            KNOWN_FLAGS.has(interaction.onSuccess.flagSet),
            `Feature "${feature.id}" in "${nodeId}" sets unknown flag "${interaction.onSuccess.flagSet}"`,
          ).toBe(true);
        }
        if (interaction.onFailure?.flagSet) {
          expect(
            KNOWN_FLAGS.has(interaction.onFailure.flagSet),
            `Feature "${feature.id}" in "${nodeId}" failure sets unknown flag "${interaction.onFailure.flagSet}"`,
          ).toBe(true);
        }
      }
    }

    // Also check useOn items
    for (const { nodeId, item } of items) {
      const enriched = item;
      if (!enriched.useOn) continue;
      for (const use of enriched.useOn) {
        if (use.interaction.onSuccess.flagSet) {
          expect(
            KNOWN_FLAGS.has(use.interaction.onSuccess.flagSet),
            `Item "${item.id}" in "${nodeId}" useOn sets unknown flag "${use.interaction.onSuccess.flagSet}"`,
          ).toBe(true);
        }
      }
    }
  });
});
