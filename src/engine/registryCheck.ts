// ---------------------------------------------------------------------------
// src/engine/registryCheck.ts — One namespace for everything the player can name
// ---------------------------------------------------------------------------
// Decision AA. Items and features live in two places: the generic registries in
// src/content, and the definitions written inline in each scenario. Resolution
// already crosses both — the content registry is consulted first, the scenario
// definition second — which means a collision does not fail loudly. It silently
// hands the player the wrong object.
//
// This module makes collisions visible: at assembly, and in a test that runs
// over everything shipped.
// ---------------------------------------------------------------------------

import type { AssembledScenario, LocationNode, LocationGraph } from './scenario';
import { isEnrichedItem, isEnrichedFeature } from './scenario';
import { ITEM_DEFINITIONS } from '../content/items';
import { ENVIRONMENT_FEATURE_DEFINITIONS } from '../content/environments';

/** A name that resolves to more than one thing, or to the wrong one. */
export interface RegistryConflict {
  readonly kind: 'duplicate_item' | 'duplicate_feature' | 'duplicate_npc' | 'contradicts_generic';
  readonly id: string;
  /** Where it was seen, most recent first. */
  readonly locations: readonly string[];
}

function collectDuplicates(
  nodes: readonly LocationNode[],
  pick: (node: LocationNode) => readonly { readonly id: string }[],
  kind: RegistryConflict['kind'],
): RegistryConflict[] {
  const seen = new Map<string, string[]>();
  for (const node of nodes) {
    for (const entry of pick(node)) {
      const places = seen.get(entry.id) ?? [];
      places.push(node.id);
      seen.set(entry.id, places);
    }
  }
  return [...seen.entries()]
    .filter(([, places]) => places.length > 1)
    .map(([id, locations]) => ({ kind, id, locations }));
}

/**
 * Every conflict in an assembled scenario.
 *
 * Two rules:
 *  - the same id must not appear in two locations, or "take the keycard" means
 *    two different keycards depending on where you stand;
 *  - a scenario definition may enrich a generic id, but it must not contradict
 *    it. Declaring a different type is the one case the merge cannot reconcile.
 */
export function findRegistryConflicts(scenario: AssembledScenario): readonly RegistryConflict[] {
  const nodes = scenario.graph.nodes;
  const conflicts: RegistryConflict[] = [
    ...collectDuplicates(nodes, n => n.items ?? [], 'duplicate_item'),
    ...collectDuplicates(nodes, n => n.features, 'duplicate_feature'),
    ...collectDuplicates(nodes, n => n.npcs ?? [], 'duplicate_npc'),
  ];

  for (const node of nodes) {
    for (const item of node.items ?? []) {
      const generic = ITEM_DEFINITIONS[item.id];
      if (generic === undefined || !isEnrichedItem(item)) continue;
      if (item.itemType !== undefined && item.itemType !== generic.type) {
        conflicts.push({ kind: 'contradicts_generic', id: item.id, locations: [node.id] });
      }
    }
    for (const feature of node.features) {
      const generic = ENVIRONMENT_FEATURE_DEFINITIONS[feature.id];
      if (generic === undefined || !isEnrichedFeature(feature)) continue;
      if (feature.featureType !== undefined && feature.featureType !== generic.type) {
        conflicts.push({ kind: 'contradicts_generic', id: feature.id, locations: [node.id] });
      }
    }
  }

  return conflicts;
}

/**
 * Drop every entity id that has already been placed elsewhere in the graph.
 * Assembly picks modules at random, so two of them can carry the same medkit;
 * without this, taking one of them makes the other a ghost the parser still
 * resolves. Core skeleton nodes come first, so they win.
 */
export function dedupeGraphEntities(graph: LocationGraph): LocationGraph {
  const seenItems = new Set<string>();
  const seenFeatures = new Set<string>();
  const seenNpcs = new Set<string>();

  const keepOnce = <T extends { readonly id: string }>(
    entries: readonly T[] | undefined,
    seen: Set<string>,
  ): readonly T[] => {
    if (entries === undefined) return [];
    const kept: T[] = [];
    for (const entry of entries) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      kept.push(entry);
    }
    return kept;
  };

  return {
    ...graph,
    nodes: graph.nodes.map(node => ({
      ...node,
      items: keepOnce(node.items, seenItems),
      features: keepOnce(node.features, seenFeatures),
      npcs: keepOnce(node.npcs, seenNpcs),
    })),
  };
}
