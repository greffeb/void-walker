// ---------------------------------------------------------------------------
// tests/unit/content/scenarios/investigateEnriched.test.ts
// ---------------------------------------------------------------------------
// Structural validation of the enriched INVESTIGATE skeleton (Chantier 4).
// Ensures all features have featureType, aliases, descriptions, interactions;
// all items have itemType, aliases; hidden items have revealedBy; gate items
// have useOn; cross-references are valid.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { INVESTIGATE_SKELETON } from '../../../../src/content/scenarios/investigate';
import {
  isEnrichedFeature,
  isEnrichedItem,
  type ScenarioFeatureDefinition,
  type ScenarioItemDefinition,
} from '../../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All node locations from the INVESTIGATE skeleton */
const allNodes = Object.entries(INVESTIGATE_SKELETON.nodeLocations);

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
  'manifest_read',
  'manifest_hacked',
  'airlock_sealed_by_player',
  'shuttle_released',
  'clamps_sabotaged',
  'password_found',
  'fraud_note_deciphered',
  'comms_unlocked',
  'hack_attempt_logged',
  'ai_alerted',
  'terminal_destroyed',
  'terminal_decrypted',
  'evidence_partially_lost',
  'maintenance_logs_read',
  'maintenance_control',
  'camera_evidence_found',
  'maintenance_terminal_repaired',
  'revelation_read',
  'classified_evidence_recovered',
  'vasquez_location_found',
  'safe_scanned',
  'admin_badge_found',
  'beacon_location_known',
  'trap_suspected',
  'noise_made_reveal',
  'sabotage_evidence_reactor',
  'reactor_sabotage_confirmed',
  'reactor_stabilized',
  'reactor_killed',
  'ai_weakened',
  'ai_scan_revealed',
  'node_a_disabled',
  'node_a_exposed',
  'ai_fully_disabled',
  'ai_talked_down',
  'ai_lockdown_escalation',
  'override_terminal_repaired',
  'override_admin_access',
  'ai_safe_mode',
  'beacon_active',
  'comms_amplified',
  'comms_direct_access',
  'evidence_transmitted',
  'final_lock_opened',
  'ai_lock_opened',
  'beacon_authorized',
  'lock_bypass_found',
]);

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('INVESTIGATE skeleton — enriched structural validation', () => {
  const features = allFeatures();
  const items = allItems();
  const featureIds = allFeatureIds();
  const itemIds = allItemIds();

  // =========================================================================
  // 1. All features have a featureType
  // =========================================================================
  it('1. all features have a featureType', () => {
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
  it('3. all non-decorative features have at least 2 FR aliases', () => {
    for (const { nodeId, feature } of features) {
      const enriched = feature;
      if (enriched.decorative) continue;
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
  // 8. Gate item (encrypted_data_core) has useOn for encrypted_terminal
  // =========================================================================
  it('8. encrypted_data_core has useOn for encrypted_terminal', () => {
    const core = items.find(i => i.item.id === 'encrypted_data_core');
    expect(core).toBeDefined();
    const enriched = core!.item;
    const terminalUseOn = enriched.useOn?.find(u => u.targetId === 'encrypted_terminal');
    expect(terminalUseOn).toBeDefined();
  });

  // =========================================================================
  // 9. Victory item (incriminating_files) has useOn for emergency_beacon
  // =========================================================================
  it('9. incriminating_files has useOn for emergency_beacon', () => {
    const files = items.find(i => i.item.id === 'incriminating_files');
    expect(files).toBeDefined();
    const enriched = files!.item;
    const beaconUseOn = enriched.useOn?.find(u => u.targetId === 'emergency_beacon');
    expect(beaconUseOn).toBeDefined();
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
  it('12. each useOn.targetId references an existing feature', () => {
    for (const { nodeId, item } of items) {
      const enriched = item;
      if (!enriched.useOn) continue;
      for (const use of enriched.useOn) {
        expect(
          featureIds.has(use.targetId),
          `Item "${item.id}" in "${nodeId}" useOn target "${use.targetId}" doesn't exist as a feature`,
        ).toBe(true);
      }
    }
  });

  // =========================================================================
  // 13. Each interaction requiredItem references a scenario item or registry
  // =========================================================================
  it('13. each interaction requiredItem references a known item', () => {
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
  it('has exactly 5 items across all nodes', () => {
    expect(items.length).toBe(5);
  });

  it('has exactly 18 features across all nodes', () => {
    expect(features.length).toBe(18);
  });

  it('has 1 decorative feature', () => {
    const decorative = features.filter(f =>
      (f.feature).decorative === true);
    expect(decorative.length).toBe(1);
  });

  it('has 2 hidden items', () => {
    const hidden = items.filter(i => (i.item).hidden === true);
    expect(hidden.length).toBe(2);
  });

  // =========================================================================
  // ADDITIONAL: verify the contains items match the hidden items
  // =========================================================================
  it('every contained item is hidden and in the same node as its container', () => {
    for (const { nodeId, feature } of features) {
      const enriched = feature;
      if (!enriched.contains) continue;
      for (const containedId of enriched.contains) {
        const item = items.find(i => i.item.id === containedId);
        expect(item).toBeDefined();
        expect(
          (item!.item).hidden,
          `Contained item "${containedId}" should be hidden`,
        ).toBe(true);
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

  // =========================================================================
  // INVESTIGATE-SPECIFIC: encrypted_terminal has 5 paths (gate node)
  // =========================================================================
  it('encrypted_terminal has at least 5 interactions (5 paths)', () => {
    const et = features.find(f => f.feature.id === 'encrypted_terminal');
    expect(et).toBeDefined();
    expect(et!.feature.interactions?.length).toBeGreaterThanOrEqual(5);
  });

  // =========================================================================
  // INVESTIGATE-SPECIFIC: scenarioFlagMapper integration
  // =========================================================================
  it('evidence_transmitted flag exists in KNOWN_FLAGS for victory path', () => {
    expect(KNOWN_FLAGS.has('evidence_transmitted')).toBe(true);
  });

  it('reactor_killed and shuttle escape flags exist for self-destruct path', () => {
    expect(KNOWN_FLAGS.has('reactor_killed')).toBe(true);
    expect(KNOWN_FLAGS.has('shuttle_released')).toBe(true);
    expect(KNOWN_FLAGS.has('clamps_sabotaged')).toBe(true);
  });

  // =========================================================================
  // INVESTIGATE-SPECIFIC: director_keycard has useOn for override_terminal
  // =========================================================================
  it('director_keycard has useOn for override_terminal', () => {
    const keycard = items.find(i => i.item.id === 'director_keycard');
    expect(keycard).toBeDefined();
    const enriched = keycard!.item;
    const overrideUseOn = enriched.useOn?.find(u => u.targetId === 'override_terminal');
    expect(overrideUseOn).toBeDefined();
  });

  // =========================================================================
  // INVESTIGATE-SPECIFIC: scanner_device has useOn targets
  // =========================================================================
  it('scanner_device has at least 2 useOn targets', () => {
    const scanner = items.find(i => i.item.id === 'scanner_device');
    expect(scanner).toBeDefined();
    expect(scanner!.item.useOn?.length).toBeGreaterThanOrEqual(2);
  });

  // =========================================================================
  // INVESTIGATE-SPECIFIC: all useOn item interactions target existing features
  // =========================================================================
  it('all useOn targets reference features that exist in the skeleton', () => {
    for (const { nodeId, item } of items) {
      const enriched = item;
      if (!enriched.useOn) continue;
      for (const use of enriched.useOn) {
        expect(
          featureIds.has(use.targetId),
          `Item "${item.id}" in "${nodeId}" useOn targets non-existent feature "${use.targetId}"`,
        ).toBe(true);
      }
    }
  });

  // =========================================================================
  // INVESTIGATE-SPECIFIC: useOn requiredFlag values are in KNOWN_FLAGS
  // =========================================================================
  it('all useOn trigger requiredFlags are documented', () => {
    for (const { nodeId, item } of items) {
      const enriched = item;
      if (!enriched.useOn) continue;
      for (const use of enriched.useOn) {
        if (use.interaction.trigger.requiredFlag) {
          expect(
            KNOWN_FLAGS.has(use.interaction.trigger.requiredFlag),
            `Item "${item.id}" in "${nodeId}" useOn requires unknown flag "${use.interaction.trigger.requiredFlag}"`,
          ).toBe(true);
        }
      }
    }
  });
});
