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
 * Check if two strings are within edit distance 1 (one insertion, deletion, or substitution).
 * Only called on strings of length >= 4 to avoid false positives on short words.
 */
function isEditDistance1(a: string, b: string): boolean {
  const la = a.length;
  const lb = b.length;
  const diff = la - lb;
  if (diff < -1 || diff > 1) return false;
  if (diff === 0) {
    // Substitution: exactly 1 char differs
    let diffs = 0;
    for (let i = 0; i < la; i++) {
      if (a[i] !== b[i]) {
        diffs++;
        if (diffs > 1) return false;
      }
    }
    return diffs === 1;
  }
  // Insertion/deletion: shorter must be a subsequence of longer with 1 gap
  const shorter = diff < 0 ? a : b;
  const longer = diff < 0 ? b : a;
  let si = 0;
  let li = 0;
  let skipped = 0;
  while (si < shorter.length && li < longer.length) {
    if (shorter[si] === longer[li]) {
      si++;
      li++;
    } else {
      li++;
      skipped++;
      if (skipped > 1) return false;
    }
  }
  return true;
}

/**
 * Score how well a set of tokens matches a set of aliases.
 * Returns 0 for no match, higher for better match.
 *
 * Scoring tiers:
 *   10 — exact match
 *    5 — substring match (alias ≥3 chars)
 *    4 — edit-distance-1 (typo tolerance, both ≥4 chars)
 *    3 — 4-char prefix match
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
      } else if (normalizedAlias.length >= 3 && (normalizedAlias.includes(token) || token.includes(normalizedAlias))) {
        score += 5; // Partial match (alias must be ≥3 chars to avoid 'ai' matching 'airlock')
      } else if (token.length >= 6 && normalizedAlias.length >= 6 && isEditDistance1(token, normalizedAlias)) {
        score += 5; // Edit-distance-1 (single typo in 6+ char words — avoids short-word false positives)
      } else if (token.length >= 4 && normalizedAlias.length >= 4 && normalizedAlias.startsWith(token.slice(0, 4))) {
        score += 3; // Prefix match (both must be ≥4 chars)
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
 * 3. NPC body parts (virtual objects) — before whole-NPC so body targeting wins
 * 4. NPCs (whole entity)
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
    const aliases = [...new Set([
      ...(item.aliases ?? []),
      ...nameKeyToAliases(item.nameKey),
      ...item.id.replace(/_/g, ' ').split(' '),
    ])];
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
    const aliases = [...new Set([
      ...(item.aliases ?? []),
      ...nameKeyToAliases(item.nameKey),
      ...item.id.replace(/_/g, ' ').split(' '),
    ])];
    const score = tokenMatchScore(searchTokens, aliases);
    if (score > bestScore) {
      bestScore = score;
      bestTarget = item;
    }
  }
  if (bestTarget && bestScore >= 5) {
    return bestTarget;
  }

  // 3. NPC body parts (virtual objects) — checked before whole-NPC so that
  //    "frapper la tête du robot" → security_robot_head, not security_robot
  const bodyPart = resolveBodyPart(searchTokens, context.npcs, context.bodyParts);
  if (bodyPart) {
    return bodyPart;
  }

  // 4+5. NPCs and environment features — global best-score comparison.
  //   Prevents NPC aliases ("securite" on security_robot) from shadowing
  //   higher-scoring environment entities ("camera"+"securite" on security_camera).
  let npcBestScore = 0;
  let npcBestTarget: ResolvedTarget | null = null;
  for (const npc of context.npcs) {
    const aliases = [...new Set([
      ...npc.aliases,
      ...nameKeyToAliases(npc.nameKey),
      ...npc.id.replace(/_/g, ' ').split(' '),
    ])];
    const score = tokenMatchScore(searchTokens, aliases);
    if (score > npcBestScore) {
      npcBestScore = score;
      npcBestTarget = {
        id: npc.id,
        nameKey: npc.nameKey,
        properties: npc.properties,
        isVirtual: false,
        source: 'npc' as TargetSource,
      };
    }
  }

  let envBestScore = 0;
  let envBestTarget: ResolvedTarget | null = null;
  for (const feature of context.environmentFeatures) {
    const aliases = [...new Set([
      ...feature.aliases,
      ...nameKeyToAliases(feature.nameKey),
      ...feature.id.replace(/_/g, ' ').split(' '),
    ])];
    const score = tokenMatchScore(searchTokens, aliases);
    if (score > envBestScore) {
      envBestScore = score;
      envBestTarget = {
        id: feature.id,
        nameKey: feature.nameKey,
        properties: feature.properties,
        isVirtual: false,
        source: 'environment' as TargetSource,
      };
    }
  }

  // 6. Connected locations (for movement verbs) — checked BEFORE environment
  //   to prevent "aller sas-b" from matching a partial alias on main_airlock.
  const movementVerbs: ReadonlySet<VerbId> = new Set(['MOVE_TO', 'RUN', 'CLIMB']);
  if (movementVerbs.has(verb)) {
    let locBestScore = 0;
    let locBestTarget: ResolvedTarget | null = null;
    for (const loc of context.connectedLocations) {
      const aliases = [...loc.aliases, ...loc.id.replace(/_/g, ' ').split(' ')];
      const score = tokenMatchScore(searchTokens, aliases);
      if (score > locBestScore) {
        locBestScore = score;
        locBestTarget = {
          id: loc.id,
          nameKey: loc.id,
          properties: [],
          isVirtual: false,
          source: 'connected_location' as TargetSource,
        };
      }
    }
    // Connected location wins if it scores at all and beats environment
    if (locBestTarget && locBestScore > 0 && locBestScore >= envBestScore) {
      return locBestTarget;
    }
  }

  // Return whichever of NPC / environment scores higher.
  // NPCs require score ≥ 5; environment requires score ≥ 3.
  // When both qualify, the higher scorer wins (breaks camera/robot confusion).
  const npcQualifies = npcBestTarget !== null && npcBestScore >= 5;
  const envQualifies = envBestTarget !== null && envBestScore >= 3;

  if (npcQualifies && envQualifies) {
    return envBestScore > npcBestScore ? envBestTarget : npcBestTarget;
  }
  if (npcQualifies) return npcBestTarget;
  if (envQualifies) return envBestTarget;

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
