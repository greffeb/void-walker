// ---------------------------------------------------------------------------
// tests/unit/content/scenarios/rescueEnriched.test.ts
// ---------------------------------------------------------------------------
// Structural validation of the enriched RESCUE skeleton (Chantier 5).
// Ensures all features have featureType, aliases, descriptions, interactions;
// all items have itemType, aliases; hidden items have revealedBy; gate items
// have useOn; cross-references are valid.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { RESCUE_SKELETON } from '../../../../src/content/scenarios/rescue';
import {
  isEnrichedFeature,
  isEnrichedItem,
  type ScenarioFeatureDefinition,
  type ScenarioItemDefinition,
} from '../../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All node locations from the RESCUE skeleton */
const allNodes = Object.entries(RESCUE_SKELETON.nodeLocations);

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

/** Set of all NPC IDs across all nodes */
function allNpcIds(): Set<string> {
  const ids = new Set<string>();
  for (const [, loc] of allNodes) {
    if (loc.npcs) {
      for (const npc of loc.npcs) {
        ids.add(npc.id);
      }
    }
  }
  return ids;
}

/** Known scenario flags documented in the RESCUE spec */
const KNOWN_FLAGS = new Set([
  'shuttle_searched',
  'breach_sealed',
  'breach_examined',
  'beacon_repaired',
  'backup_beacon_active',
  'corridor_cleared_tool',
  'corridor_plasma_cut',
  'detour_found',
  'noise_made_unlock',
  'okonkwo_found',
  'okonkwo_trusts',
  'okonkwo_patched',
  'okonkwo_stabilized',
  'escort_active',
  'acoustic_info_received',
  'project_hunter_read',
  'creature_learns_discovered',
  'barricade_dismantled',
  'acoustic_potential_noted',
  'creature_repelled_escalation',
  'creature_distracted',
  'creature_contained',
  'blast_door_widened',
  'extraction_door_opened',
  'both_in_shuttle',
  'okonkwo_abandoned',
  'okonkwo_used_as_bait',
]);

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('RESCUE skeleton — enriched structural validation', () => {
  const features = allFeatures();
  const items = allItems();
  const featureIds = allFeatureIds();
  const itemIds = allItemIds();
  const npcIds = allNpcIds();

  // =========================================================================
  // 1. All features have a featureType
  // =========================================================================
  it('1. all features have a featureType', () => {
    for (const { nodeId, feature } of features) {
      expect(
        isEnrichedFeature(feature),
        `Feature "${feature.id}" in node "${nodeId}" is not enriched`,
      ).toBe(true);
      expect(
        feature.featureType,
        `Feature "${feature.id}" in node "${nodeId}" has no featureType`,
      ).toBeDefined();
    }
  });

  // =========================================================================
  // 2. All interactive features have at least 1 interaction
  // =========================================================================
  it('2. all non-decorative features have interactions', () => {
    for (const { nodeId, feature } of features) {
      if (feature.decorative) continue;
      expect(
        feature.interactions?.length,
        `Feature "${feature.id}" in node "${nodeId}" has no interactions and is not decorative`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // =========================================================================
  // 3. All features have aliases.fr with at least 2 entries
  // =========================================================================
  it('3. all features have at least 2 FR aliases', () => {
    for (const { nodeId, feature } of features) {
      expect(
        feature.aliases?.fr?.length,
        `Feature "${feature.id}" in node "${nodeId}" has fewer than 2 FR aliases`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  // =========================================================================
  // 4. All features have descriptions for at least their initialState
  // =========================================================================
  it('4. all features have description for their initialState', () => {
    for (const { nodeId, feature } of features) {
      const state = feature.initialState ?? 'intact';
      expect(
        feature.descriptions?.[state],
        `Feature "${feature.id}" in node "${nodeId}" has no description for state "${state}"`,
      ).toBeDefined();
      expect(
        feature.descriptions?.[state]?.fr?.length,
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
      expect(
        item.itemType,
        `Item "${item.id}" in node "${nodeId}" has no itemType`,
      ).toBeDefined();
    }
  });

  // =========================================================================
  // 6. All items have at least 2 FR aliases
  // =========================================================================
  it('6. all items have at least 2 FR aliases', () => {
    for (const { nodeId, item } of items) {
      expect(
        item.aliases?.fr?.length,
        `Item "${item.id}" in node "${nodeId}" has fewer than 2 FR aliases`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  // =========================================================================
  // 7. All hidden items have a revealedBy
  // =========================================================================
  it('7. all hidden items have a revealedBy', () => {
    for (const { nodeId, item } of items) {
      if (!item.hidden) continue;
      expect(
        item.revealedBy,
        `Hidden item "${item.id}" in node "${nodeId}" has no revealedBy`,
      ).toBeDefined();
    }
  });

  // =========================================================================
  // 8. Gate item (medical_stabilizer) has useOn for dr_okonkwo
  // =========================================================================
  it('8. medical_stabilizer has useOn for dr_okonkwo', () => {
    const stabilizer = items.find(i => i.item.id === 'medical_stabilizer');
    expect(stabilizer).toBeDefined();
    const useOnTarget = stabilizer!.item.useOn?.find(u => u.targetId === 'dr_okonkwo');
    expect(useOnTarget).toBeDefined();
  });

  // =========================================================================
  // 9. sonic_emitter_component has 3+ useOn targets
  // =========================================================================
  it('9. sonic_emitter_component has at least 3 useOn targets', () => {
    const emitter = items.find(i => i.item.id === 'sonic_emitter_component');
    expect(emitter).toBeDefined();
    expect(emitter!.item.useOn?.length).toBeGreaterThanOrEqual(3);
  });

  // =========================================================================
  // 10. Each "contains" references an item that exists in the scenario
  // =========================================================================
  it('10. each contains references an existing scenario item', () => {
    for (const { nodeId, feature } of features) {
      if (!feature.contains) continue;
      for (const containedId of feature.contains) {
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
      if (!item.revealedBy) continue;
      expect(
        featureIds.has(item.revealedBy.featureId),
        `Item "${item.id}" in "${nodeId}" revealedBy feature "${item.revealedBy.featureId}" which doesn't exist`,
      ).toBe(true);
    }
  });

  // =========================================================================
  // 12. Each useOn.targetId references an existing feature OR NPC
  // =========================================================================
  it('12. each useOn.targetId references an existing feature or NPC', () => {
    const validTargets = new Set([...featureIds, ...npcIds]);
    for (const { nodeId, item } of items) {
      if (!item.useOn) continue;
      for (const use of item.useOn) {
        expect(
          validTargets.has(use.targetId),
          `Item "${item.id}" in "${nodeId}" useOn target "${use.targetId}" doesn't exist as feature or NPC`,
        ).toBe(true);
      }
    }
  });

  // =========================================================================
  // 13. Each interaction requiredItem references a scenario item
  // =========================================================================
  it('13. each interaction requiredItem references a known item', () => {
    const knownItems = new Set([...itemIds]);

    for (const { nodeId, feature } of features) {
      if (!feature.interactions) continue;
      for (const interaction of feature.interactions) {
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
      if (!feature.interactions) continue;
      for (const interaction of feature.interactions) {
        if (interaction.trigger.requiredFlag) {
          expect(
            KNOWN_FLAGS.has(interaction.trigger.requiredFlag),
            `Feature "${feature.id}" in "${nodeId}" requires unknown flag "${interaction.trigger.requiredFlag}"`,
          ).toBe(true);
        }
      }
    }

    // Also check useOn items
    for (const { nodeId, item } of items) {
      if (!item.useOn) continue;
      for (const use of item.useOn) {
        if (use.interaction.trigger.requiredFlag) {
          expect(
            KNOWN_FLAGS.has(use.interaction.trigger.requiredFlag),
            `Item "${item.id}" in "${nodeId}" useOn requires unknown flag "${use.interaction.trigger.requiredFlag}"`,
          ).toBe(true);
        }
      }
    }
  });

  // =========================================================================
  // COUNTS: verify entity counts
  // =========================================================================
  it('has exactly 7 items across all nodes', () => {
    expect(items.length).toBe(7);
  });

  it('has exactly 16 features across all nodes', () => {
    expect(features.length).toBe(16);
  });

  it('has 1 decorative feature (shuttle_cockpit)', () => {
    const decorative = features.filter(f => f.feature.decorative === true);
    expect(decorative.length).toBe(1);
    expect(decorative[0].feature.id).toBe('shuttle_cockpit');
  });

  it('has 4 hidden items', () => {
    const hidden = items.filter(i => i.item.hidden === true);
    expect(hidden.length).toBe(4);
  });

  it('has 2 NPCs', () => {
    expect(npcIds.size).toBe(2);
    expect(npcIds.has('dr_okonkwo')).toBe(true);
    expect(npcIds.has('creature_hunter')).toBe(true);
  });

  // =========================================================================
  // CONTAINERS: every contained item is hidden and in the same node
  // =========================================================================
  it('every contained item is hidden and in the same node as its container', () => {
    for (const { nodeId, feature } of features) {
      if (!feature.contains) continue;
      for (const containedId of feature.contains) {
        const item = items.find(i => i.item.id === containedId);
        expect(item).toBeDefined();
        expect(
          item!.item.hidden,
          `Contained item "${containedId}" should be hidden`,
        ).toBe(true);
        expect(
          item!.nodeId,
          `Item "${containedId}" (in "${item!.nodeId}") doesn't match container "${feature.id}" (in "${nodeId}")`,
        ).toBe(nodeId);
      }
    }
  });

  // =========================================================================
  // FLAGS: all flagSet values in interactions are documented flags
  // =========================================================================
  it('all flagSet values are documented flags', () => {
    for (const { nodeId, feature } of features) {
      if (!feature.interactions) continue;
      for (const interaction of feature.interactions) {
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
      if (!item.useOn) continue;
      for (const use of item.useOn) {
        if (use.interaction.onSuccess.flagSet) {
          expect(
            KNOWN_FLAGS.has(use.interaction.onSuccess.flagSet),
            `Item "${item.id}" in "${nodeId}" useOn sets unknown flag "${use.interaction.onSuccess.flagSet}"`,
          ).toBe(true);
        }
      }
    }
  });

  // =========================================================================
  // RESCUE-SPECIFIC: 3 victory paths
  // =========================================================================
  it('primary victory is escort_alive for dr_okonkwo', () => {
    expect(RESCUE_SKELETON.primaryVictory.type).toBe('escort_alive');
    expect(RESCUE_SKELETON.primaryVictory.npcId).toBe('dr_okonkwo');
  });

  it('alternative victory is reach_location (resolution)', () => {
    const alt = RESCUE_SKELETON.alternativeVictory;
    expect(alt).toBeDefined();
    expect(alt.type).toBe('reach_location');
    expect(alt.locationId).toBe('resolution');
  });

  it('emergent victory via creature_contained flag exists in interactions', () => {
    const allFlagSets: string[] = [];
    // Check feature interactions
    for (const { feature } of features) {
      if (!feature.interactions) continue;
      for (const interaction of feature.interactions) {
        if (interaction.onSuccess.flagSet) allFlagSets.push(interaction.onSuccess.flagSet);
      }
    }
    // Check item useOn
    for (const { item } of items) {
      if (!item.useOn) continue;
      for (const use of item.useOn) {
        if (use.interaction.onSuccess.flagSet) allFlagSets.push(use.interaction.onSuccess.flagSet);
      }
    }
    expect(allFlagSets).toContain('creature_contained');
  });

  // =========================================================================
  // RESCUE-SPECIFIC: NPC Dr. Okonkwo has cooperative disposition (hp 4)
  // =========================================================================
  it('dr_okonkwo is cooperative with hp 4', () => {
    for (const [, loc] of allNodes) {
      for (const npc of loc.npcs ?? []) {
        if (npc.id === 'dr_okonkwo') {
          expect(npc.disposition).toBe('cooperative');
          expect(npc.hpOverride).toBe(4);
          return;
        }
      }
    }
    expect.fail('dr_okonkwo not found');
  });

  // =========================================================================
  // RESCUE-SPECIFIC: collapsed_corridor has 4+ interaction paths
  // =========================================================================
  it('collapsed_corridor has at least 4 interaction paths', () => {
    const corridor = features.find(f => f.feature.id === 'collapsed_corridor');
    expect(corridor).toBeDefined();
    expect(corridor!.feature.interactions?.length).toBeGreaterThanOrEqual(4);
  });

  // =========================================================================
  // RESCUE-SPECIFIC: moral choice at boss (shuttle_hatch)
  // =========================================================================
  it('shuttle_hatch has at least 2 enter/use interactions (moral choice)', () => {
    const hatch = features.find(f => f.feature.id === 'shuttle_hatch');
    expect(hatch).toBeDefined();
    expect(hatch!.feature.interactions?.length).toBeGreaterThanOrEqual(2);
  });

  // =========================================================================
  // RESCUE-SPECIFIC: defeat condition is npc_death for dr_okonkwo
  // =========================================================================
  it('has npc_death defeat condition for dr_okonkwo', () => {
    expect(RESCUE_SKELETON.additionalDefeatConditions).toBeDefined();
    const npcDeath = RESCUE_SKELETON.additionalDefeatConditions!.find(
      d => d.type === 'npc_death');
    expect(npcDeath).toBeDefined();
    expect(npcDeath!.npcId).toBe('dr_okonkwo');
  });
});
