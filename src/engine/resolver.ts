// ---------------------------------------------------------------------------
// src/engine/resolver.ts — Target resolution and body part virtual objects
// ---------------------------------------------------------------------------
// Resolves natural language tokens to game entities in priority order:
// inventory → location items → NPCs → NPC body parts → environment → abstract
// ---------------------------------------------------------------------------

import type { VerbId } from './verbs';
import { VERB_REGISTRY } from './verbs';
import { stemFr } from './snowball-fr';
import type { PropertyId } from './properties';
import type {
  ResolvedTarget,
  TargetSource,
  SceneContext,
  NpcInstance,
  BodyPartDefinition,
} from './types';

// === BODY PART DEFINITIONS ===

/** Standard body parts that can be targeted on NPCs */
export const BODY_PARTS: ReadonlyMap<string, BodyPartDefinition> = new Map([
  ['arm', {
    id: 'arm',
    nameKey: 'bodypart.arm',
    aliases: [],
    baseProperties: ['blunt', 'holdable'] as PropertyId[],
  }],
  ['head', {
    id: 'head',
    nameKey: 'bodypart.head',
    aliases: [],
    baseProperties: ['fragile'] as PropertyId[],
  }],
  ['leg', {
    id: 'leg',
    nameKey: 'bodypart.leg',
    aliases: [],
    baseProperties: ['blunt'] as PropertyId[],
  }],
  ['claw', {
    id: 'claw',
    nameKey: 'bodypart.claw',
    aliases: [],
    baseProperties: ['sharp', 'bladed'] as PropertyId[],
  }],
  ['tail', {
    id: 'tail',
    nameKey: 'bodypart.tail',
    aliases: [],
    baseProperties: ['blunt', 'flexible'] as PropertyId[],
  }],
  ['antenna', {
    id: 'antenna',
    nameKey: 'bodypart.antenna',
    aliases: [],
    baseProperties: ['fragile', 'electronic'] as PropertyId[],
  }],
  ['torso', {
    id: 'torso',
    nameKey: 'bodypart.torso',
    aliases: [],
    baseProperties: ['large'] as PropertyId[],
  }],
]);

// === TOKEN MATCHING HELPERS ===

/**
 * Score how well a set of tokens matches a set of aliases.
 * Returns 0 for no match, higher for better match.
 */
function tokenMatchScore(tokens: readonly string[], aliases: readonly string[]): number {
  let score = 0;
  for (const token of tokens) {
    for (const alias of aliases) {
      // Normalize alias for matching
      const normalizedAlias = alias
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (normalizedAlias === token) {
        score += 10; // Exact match
      } else if (normalizedAlias.includes(token) || token.includes(normalizedAlias)) {
        score += 5; // Partial match
      } else if (token.length >= 4 && normalizedAlias.startsWith(token.slice(0, 4))) {
        score += 3; // Prefix match
      }
    }
  }
  return score;
}

/**
 * Extract aliases from a nameKey (e.g., 'item.pistolet_laser' → ['pistolet', 'laser']).
 * Returns tokens suitable for matching.
 */
function nameKeyToAliases(nameKey: string): string[] {
  // Extract the part after the last dot, split on underscores
  const parts = nameKey.split('.');
  const name = parts[parts.length - 1] ?? nameKey;
  return name.split('_').map((s) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  );
}

// === BODY PART RESOLUTION ===

/**
 * Detect possessive structure ("X du/de Y") and resolve body part + NPC.
 * Returns a virtual ResolvedTarget or null.
 * Uses bodyPartDefs (locale-enriched) if provided, otherwise falls back to BODY_PARTS.
 */
export function resolveBodyPart(
  tokens: readonly string[],
  npcs: readonly NpcInstance[],
  bodyPartDefs?: readonly BodyPartDefinition[],
): ResolvedTarget | null {
  // Build list of body parts to check: prefer locale-enriched defs, fall back to static BODY_PARTS
  const parts: readonly BodyPartDefinition[] = bodyPartDefs && bodyPartDefs.length > 0
    ? bodyPartDefs
    : [...BODY_PARTS.values()];

  // Look for body part tokens
  for (const partDef of parts) {
    const partAliases = partDef.aliases.map((a) =>
      a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    );

    const hasPartToken = tokens.some((t) => partAliases.includes(t));
    if (!hasPartToken) continue;

    // Look for an NPC in the remaining tokens
    for (const npc of npcs) {
      const npcAliases = [
        ...npc.aliases,
        ...nameKeyToAliases(npc.nameKey),
      ];
      const npcScore = tokenMatchScore(tokens, npcAliases);
      if (npcScore > 0) {
        // Build virtual object: NPC material props + body part props + 'attached'
        const npcMaterialProps = npc.properties.filter((p) =>
          ['metallic', 'organic', 'synthetic', 'mechanical', 'electronic', 'robotic'].includes(p),
        );
        const combinedProps: PropertyId[] = [
          ...partDef.baseProperties,
          ...npcMaterialProps,
          'attached' as PropertyId,
          'tangible' as PropertyId,
          'visible' as PropertyId,
        ];
        // Deduplicate
        const uniqueProps = [...new Set(combinedProps)] as PropertyId[];

        return {
          id: `${npc.id}_${partDef.id}`,
          nameKey: partDef.nameKey,
          properties: uniqueProps,
          isVirtual: true,
          source: 'npc_part' as TargetSource,
        };
      }
    }
  }

  return null;
}

// === MAIN TARGET RESOLVER ===

/**
 * Resolve natural language tokens to a game target entity.
 *
 * Priority order:
 * 1. Player inventory items
 * 2. Location items
 * 3. NPCs (whole entity)
 * 4. NPC body parts (virtual objects)
 * 5. Environment features
 * 6. Connected locations (for movement verbs)
 * 7. Abstract/environment fallback
 *
 * Returns null for intransitive verbs (WAIT, LISTEN with no target).
 */
export function resolveTarget(
  tokens: readonly string[],
  verb: VerbId,
  context: SceneContext,
): ResolvedTarget | null {
  if (tokens.length === 0) return null;

  // Filter out tokens that are verb aliases (don't match them as targets)
  // Uses both exact match and stem comparison to catch conjugated forms
  const verbEntry = VERB_REGISTRY[verb];
  const verbAliasTokens = new Set<string>();
  const verbAliasStems = new Set<string>();
  for (const alias of verbEntry.aliases.fr) {
    const normalizedAlias = alias
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    for (const word of normalizedAlias.split(/\s+/)) {
      if (word.length > 1) {
        verbAliasTokens.add(word);
        verbAliasStems.add(stemFr(word));
      }
    }
  }
  const targetTokens = tokens.filter((t) =>
    !verbAliasTokens.has(t) && !verbAliasStems.has(stemFr(t)),
  );

  // If no target tokens remain, check if verb is intransitive
  if (targetTokens.length === 0) {
    const intransitiveVerbs: ReadonlySet<VerbId> = new Set([
      'WAIT', 'LISTEN', 'SMELL', 'DODGE', 'RUN', 'HIDE', 'BLOCK',
      'SIGNAL', 'JUMP', 'SWIM',
    ]);
    if (intransitiveVerbs.has(verb)) {
      return null;
    }
    // For transitive verbs with no target tokens, try matching against the full tokens
    // (the verb token itself might overlap with a target name)
    if (tokens.length > 0) {
      // Fall through to matching with original tokens
    } else {
      return null;
    }
  }

  const searchTokens = targetTokens.length > 0 ? targetTokens : tokens;

  // 1. Inventory items
  let bestScore = 0;
  let bestTarget: ResolvedTarget | null = null;

  for (const item of context.inventory) {
    const aliases = [
      ...(item.aliases ?? []),
      ...nameKeyToAliases(item.nameKey),
      ...item.id.replace(/_/g, ' ').split(' '),
    ];
    const score = tokenMatchScore(searchTokens, aliases);
    if (score > bestScore) {
      bestScore = score;
      bestTarget = item;
    }
  }
  if (bestTarget && bestScore >= 5) {
    return bestTarget;
  }

  // 2. Location items
  bestScore = 0;
  bestTarget = null;
  for (const item of context.locationItems) {
    const aliases = [
      ...(item.aliases ?? []),
      ...nameKeyToAliases(item.nameKey),
      ...item.id.replace(/_/g, ' ').split(' '),
    ];
    const score = tokenMatchScore(searchTokens, aliases);
    if (score > bestScore) {
      bestScore = score;
      bestTarget = item;
    }
  }
  if (bestTarget && bestScore >= 5) {
    return bestTarget;
  }

  // 3. NPCs
  bestScore = 0;
  let bestNpc: ResolvedTarget | null = null;
  for (const npc of context.npcs) {
    const aliases = [
      ...npc.aliases,
      ...nameKeyToAliases(npc.nameKey),
      ...npc.id.replace(/_/g, ' ').split(' '),
    ];
    const score = tokenMatchScore(searchTokens, aliases);
    if (score > bestScore) {
      bestScore = score;
      bestNpc = {
        id: npc.id,
        nameKey: npc.nameKey,
        properties: npc.properties,
        isVirtual: false,
        source: 'npc' as TargetSource,
      };
    }
  }
  if (bestNpc && bestScore >= 3) {
    return bestNpc;
  }

  // 4. NPC body parts (virtual objects)
  const bodyPart = resolveBodyPart(searchTokens, context.npcs, context.bodyParts);
  if (bodyPart) {
    return bodyPart;
  }

  // 5. Environment features
  bestScore = 0;
  bestTarget = null;
  for (const feature of context.environmentFeatures) {
    const aliases = [
      ...feature.aliases,
      ...nameKeyToAliases(feature.nameKey),
      ...feature.id.replace(/_/g, ' ').split(' '),
    ];
    const score = tokenMatchScore(searchTokens, aliases);
    if (score > bestScore) {
      bestScore = score;
      bestTarget = {
        id: feature.id,
        nameKey: feature.nameKey,
        properties: feature.properties,
        isVirtual: false,
        source: 'environment' as TargetSource,
      };
    }
  }
  if (bestTarget && bestScore >= 3) {
    return bestTarget;
  }

  // 6. Connected locations (for movement verbs)
  const movementVerbs: ReadonlySet<VerbId> = new Set(['MOVE_TO', 'RUN', 'CLIMB']);
  if (movementVerbs.has(verb)) {
    for (const loc of context.connectedLocations) {
      const aliases = [...loc.aliases, ...loc.id.replace(/_/g, ' ').split(' ')];
      const score = tokenMatchScore(searchTokens, aliases);
      if (score > 0) {
        return {
          id: loc.id,
          nameKey: loc.id,
          properties: [],
          isVirtual: false,
          source: 'connected_location' as TargetSource,
        };
      }
    }
  }

  // 7. Abstract fallback — return null for intransitive verbs,
  // or an abstract environment target for transitive verbs
  const intransitiveVerbs: ReadonlySet<VerbId> = new Set([
    'WAIT', 'LISTEN', 'SMELL', 'DODGE', 'RUN', 'HIDE', 'BLOCK',
    'SIGNAL', 'JUMP', 'SWIM',
  ]);
  if (intransitiveVerbs.has(verb)) {
    return null;
  }

  // Return abstract environment target
  return {
    id: 'environment',
    nameKey: 'environment',
    properties: [],
    isVirtual: false,
    source: 'abstract' as TargetSource,
  };
}
