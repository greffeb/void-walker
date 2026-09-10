// ---------------------------------------------------------------------------
// src/content/featureNames.ts — One place that answers "what is this called?"
// ---------------------------------------------------------------------------
// Three systems used to answer that question differently: the environment
// registry via its nameKey, a raw `env.<id>` i18n lookup, and a hand-kept map
// in scenarioNames.ts that the engine never consulted. The same feature could
// therefore surface as a proper French name in the inventory and as
// "mm bio cocoon" in the room description.
//
// i18n is the single source (CLAUDE.md: no player-facing strings in code).
// This module resolves a feature or item id to its French display name, and
// returns null when no name exists — so the audit can count what is missing
// instead of a de-underscored id reaching the player.
// ---------------------------------------------------------------------------

import { t } from '../i18n/index';
import type { Locale, StringKey } from '../i18n/types';
import { ENVIRONMENT_FEATURE_DEFINITIONS } from './environments';
import { ITEM_DEFINITIONS } from './items';
import { NPC_DEFINITIONS } from './npcs';

/** t() echoes the key back when it is missing; that is how we detect absence. */
function lookup(key: string, locale?: Locale): string | null {
  const resolved = t(key as StringKey, locale);
  return resolved === key ? null : resolved;
}

/**
 * Display name of a scenario or registry feature, or null when unnamed.
 * Registry entries win: they carry the canonical key.
 */
export function featureDisplayName(id: string, locale?: Locale): string | null {
  const def = ENVIRONMENT_FEATURE_DEFINITIONS[id];
  if (def) return t(def.nameKey, locale);
  return lookup(`env.${id}`, locale);
}

/** Display name of a scenario or registry item, or null when unnamed. */
export function itemDisplayName(id: string, locale?: Locale): string | null {
  const def = ITEM_DEFINITIONS[id];
  if (def) return t(def.nameKey, locale);
  return lookup(`item.${id}`, locale);
}

/** Display name of an NPC, or null when unnamed. */
export function npcDisplayName(id: string, locale?: Locale): string | null {
  const def = NPC_DEFINITIONS[id];
  if (def) return t(def.nameKey, locale);
  return lookup(`npc.${id}`, locale);
}

/**
 * Name for display, with the de-underscored id as a last resort.
 * Use where a string is mandatory; prefer the nullable form when the caller
 * can report the gap instead of papering over it.
 */
export function displayNameOrId(name: string | null, id: string): string {
  return name ?? id.replace(/_/g, ' ');
}
