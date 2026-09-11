// ---------------------------------------------------------------------------
// src/engine/resolver.ts — Target resolution and body part virtual objects
// ---------------------------------------------------------------------------
// Resolves natural language tokens to game entities in priority order:
// inventory → location items → NPCs → NPC body parts → environment → abstract
// ---------------------------------------------------------------------------

import type { VerbId } from './verbs';
import { stemFr } from './snowball-fr';
import type { PropertyId } from './properties';
import type {
  ResolvedTarget,
  TargetSource,
  SceneContext,
  NpcInstance,
  BodyPartDefinition,
} from './types';

// === GENERIC EXIT TOKENS ===
// Vague movement words that should resolve to the best available connected location
const GENERIC_EXIT_TOKENS = new Set([
  'sortie', 'sorties', 'porte', 'portes', 'passage', 'passages',
  'couloir', 'couloirs', 'inexplore', 'inexploree', 'suivant', 'suivante',
  'autre', 'autres', 'prochain', 'prochaine', 'direction',
]);


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
 * Check if two same-length strings differ by exactly one adjacent transposition
 * (Damerau-Levenshtein distance 1 for swaps).
 * E.g. "rouelau" vs "rouleau" → positions 3-4 are swapped ('e'↔'l').
 * Only called for strings of length ≥ 5.
 */
function isAdjacentTransposition(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const diffs: number[] = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      diffs.push(i);
      if (diffs.length > 2) return false;
    }
  }
  if (diffs.length !== 2) return false;
  const i = diffs[0]!;
  const j = diffs[1]!;
  return j === i + 1 && a[i] === b[j] && a[j] === b[i];
}

/**
 * Score how well a set of tokens designates an entity.
 * Each token contributes its *best* alias match, not the sum over aliases —
 * otherwise an entity that lists many overlapping aliases outranks the one
 * actually named, and "examiner câble" reaches the wiring instead of the cable.
 *
 * Scoring tiers, per token:
 *   10 — exact match
 *    5 — substring match (alias ≥3 chars)
 *    5 — edit-distance-1 (single typo, both ≥6 chars)
 *    5 — adjacent transposition (swap of two adjacent chars, both ≥6 chars)
 *    3 — 4-char prefix match
 */
function tokenMatchScore(tokens: readonly string[], aliases: readonly string[]): number {
  let score = 0;
  for (const token of tokens) {
    let best = 0;
    for (const alias of aliases) {
      // Normalize alias for matching
      const normalizedAlias = alias
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      let here = 0;
      if (normalizedAlias === token) {
        here = 10; // Exact match
      } else if (normalizedAlias.length >= 3 && (normalizedAlias.includes(token) || token.includes(normalizedAlias))) {
        here = 5; // Partial match (alias must be ≥3 chars to avoid 'ai' matching 'airlock')
      } else if (token.length >= 6 && normalizedAlias.length >= 6 && isEditDistance1(token, normalizedAlias)) {
        here = 5; // Edit-distance-1 (single typo in 6+ char words)
      } else if (token.length >= 6 && normalizedAlias.length >= 6 && isAdjacentTransposition(token, normalizedAlias)) {
        here = 5; // Adjacent transposition typo (e.g. "rouelau" → "rouleau")
      } else if (token.length >= 4 && normalizedAlias.length >= 4 && normalizedAlias.startsWith(token.slice(0, 4))) {
        here = 3; // Prefix match (both must be ≥4 chars)
      }
      if (here > best) best = here;
    }
    score += best;
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
 * What the resolver concluded (decision N).
 *
 * The old signature returned `ResolvedTarget | null`, which conflated three
 * different answers into two values: "I found it", "there is nothing to find",
 * and "the player named something vague, here is the room". The third was
 * encoded as an abstract target that three separate blocks in the parser then
 * had to detect and undo.
 */
export type TargetResolution =
  | { readonly kind: 'resolved'; readonly target: ResolvedTarget }
  | { readonly kind: 'ambiguous'; readonly candidates: readonly ResolvedTarget[] }
  | { readonly kind: 'none' };

/** Where a candidate came from. */
export type TargetPool =
  | 'inventory' | 'location_item' | 'npc' | 'environment' | 'exit' | 'here';

/**
 * How a verb looks for its object. Data, not branches: the old resolver had a
 * block per verb, each added by a playtest issue (decision O).
 */
interface TargetPolicy {
  /** Pools searched. Best score wins; earlier pools win ties. */
  readonly pools: readonly TargetPool[];
  /** When nothing scores, take the only entry of this pool if there is exactly one. */
  readonly soleFallback?: TargetPool;
  /** The verb takes no object at all. */
  readonly intransitive?: boolean;
}

const EVERYTHING_HERE: readonly TargetPool[] =
  ['inventory', 'location_item', 'npc', 'environment', 'here'];

const DEFAULT_POLICY: TargetPolicy = { pools: EVERYTHING_HERE };

const MOVEMENT_POLICY: TargetPolicy = { pools: ['exit', 'here'] };

const TARGET_POLICIES: Partial<Record<VerbId, TargetPolicy>> = {
  MOVE_TO: MOVEMENT_POLICY,
  RUN: MOVEMENT_POLICY,
  CLIMB: { pools: ['environment', 'exit', 'here'] },
  // Taking reaches for what is lying here, or for the container holding it.
  // Inventory comes last: it is how "prends la lampe" answers "you have it".
  TAKE: { pools: ['location_item', 'environment', 'inventory'], soleFallback: 'location_item' },
  // Verbs that act on the player, not on a thing.
  WAIT: { pools: [], intransitive: true },
  LISTEN: { pools: [], intransitive: true },
  SMELL: { pools: [], intransitive: true },
  DODGE: { pools: [], intransitive: true },
  HIDE: { pools: [], intransitive: true },
  BLOCK: { pools: [], intransitive: true },
  SIGNAL: { pools: [], intransitive: true },
  JUMP: { pools: [], intransitive: true },
  SWIM: { pools: [], intransitive: true },
};

/** Below this, a match is a coincidence rather than a designation (P2-5). */
const MIN_MATCH_SCORE = 5;

/** Two candidates this close are not distinguishable — ask instead of guessing. */
const AMBIGUITY_MARGIN = 0;

interface Candidate {
  readonly target: ResolvedTarget;
  readonly score: number;
  readonly pool: TargetPool;
  /** The token is the entity's own name, not merely one of its aliases. */
  readonly nameExact: boolean;
}

function aliasesOf(entity: {
  readonly id: string;
  readonly nameKey: string;
  readonly aliases?: readonly string[];
}): { readonly name: readonly string[]; readonly all: readonly string[] } {
  // Every builder in scene.ts puts the display name at aliases[1] — the
  // convention is [id, displayName, ...more]. Its words count as "the
  // entity's own name" too: without this, a scenario item whose id does not
  // read as French ("medkit_basic") lost a nameExact tie to an unrelated
  // registry item whose id happened to split into the exact words the player
  // typed ("medical_kit" → "medical" + "kit"), even though the registry item
  // was not present in the room at all.
  const displayNameWords = entity.aliases?.[1]?.split(/\s+/) ?? [];
  const name = [
    ...nameKeyToAliases(entity.nameKey),
    ...entity.id.replace(/_/g, ' ').split(' '),
    ...displayNameWords,
  ];
  // The display name is stored as one multi-word alias ("kit médical basique").
  // Kept whole, each of its words could only ever score a substring match, so a
  // player typing the exact name they read on screen scored less than an
  // unrelated item whose English id happened to contain "kit".
  const declared = entity.aliases ?? [];
  const words = declared.flatMap(a => (a.includes(' ') ? a.split(/\s+/) : []));
  return { name, all: [...new Set([...declared, ...words, ...name])] };
}

function scoreEntity(
  tokens: readonly string[],
  entity: { readonly id: string; readonly nameKey: string; readonly aliases?: readonly string[] },
): { score: number; nameExact: boolean } {
  const { name, all } = aliasesOf(entity);
  return {
    score: tokenMatchScore(tokens, all),
    nameExact: tokenMatchScore(tokens, name) >= 10,
  };
}

function collectCandidates(
  tokens: readonly string[],
  pools: readonly TargetPool[],
  context: SceneContext,
): Candidate[] {
  const found: Candidate[] = [];

  const consider = (
    pool: TargetPool,
    entity: { readonly id: string; readonly nameKey: string; readonly aliases?: readonly string[] },
    build: () => ResolvedTarget,
  ): void => {
    const { score, nameExact } = scoreEntity(tokens, entity);
    if (score < MIN_MATCH_SCORE) return;
    found.push({ target: build(), score, pool, nameExact });
  };

  for (const pool of pools) {
    switch (pool) {
      case 'inventory':
        for (const item of context.inventory) consider(pool, item, () => item);
        break;

      case 'location_item':
        for (const item of context.locationItems) consider(pool, item, () => item);
        break;

      case 'npc':
        for (const npc of context.npcs) {
          consider(pool, npc, () => ({
            id: npc.id, nameKey: npc.nameKey, properties: npc.properties,
            isVirtual: false, source: 'npc' as TargetSource, state: npc.state,
          }));
        }
        break;

      case 'environment':
        for (const feature of context.environmentFeatures) {
          consider(pool, feature, () => ({
            id: feature.id, nameKey: feature.nameKey, properties: feature.properties,
            isVirtual: false, source: 'environment' as TargetSource, state: feature.state,
          }));
        }
        break;

      case 'exit':
        for (const loc of context.connectedLocations) {
          consider(pool, { id: loc.id, nameKey: loc.displayName ?? loc.id, aliases: loc.aliases }, () => ({
            id: loc.id, nameKey: loc.displayName ?? loc.id, properties: [],
            isVirtual: false, source: 'connected_location' as TargetSource,
          }));
        }
        break;

      // P2-7: the room you are standing in is nameable. Without it, "aller au
      // sas" while in the airlock silently walked you somewhere else.
      case 'here': {
        const here = context.locationId;
        if (here === undefined) break;
        const name = context.sceneDescription?.locationName ?? here;
        consider(pool, { id: here, nameKey: name, aliases: [name] }, () => ({
          id: here, nameKey: name, properties: [],
          isVirtual: false, source: 'current_location' as TargetSource,
        }));
        break;
      }
    }
  }

  return found;
}

/**
 * Resolve natural language tokens to a game entity.
 *
 * Three stages, in order: collect every entity the verb may look at, score each
 * against the tokens, then arbitrate. Which pools a verb looks at is data
 * (TARGET_POLICIES), not a branch.
 */
export function resolveTargets(
  tokens: readonly string[],
  verb: VerbId,
  context: SceneContext,
  genericNpcRefs?: ReadonlySet<string>,
  batchTakeTokens?: ReadonlySet<string>,
  verbForms?: ReadonlyMap<string, VerbId>,
): TargetResolution {
  const policy = TARGET_POLICIES[verb] ?? DEFAULT_POLICY;
  if (policy.intransitive === true) return { kind: 'none' };
  if (tokens.length === 0) return { kind: 'none' };

  // Words that name the verb cannot also name its object.
  const verbAliasTokens = new Set<string>();
  const verbAliasStems = new Set<string>();
  if (verbForms) {
    for (const [form, formVerb] of verbForms) {
      if (formVerb !== verb) continue;
      for (const word of form.split(/\s+/)) {
        if (word.length > 1) {
          verbAliasTokens.add(word);
          verbAliasStems.add(stemFr(word));
        }
      }
    }
  }
  const targetTokens = tokens.filter(
    t => !verbAliasTokens.has(t) && !verbAliasStems.has(stemFr(t)),
  );
  const searchTokens = targetTokens.length > 0 ? targetTokens : tokens;

  // A body part is a compound designation ("la tête du robot"), not a pool.
  if (policy.pools.includes('npc')) {
    const bodyPart = resolveBodyPart(searchTokens, context.npcs, context.bodyParts);
    if (bodyPart) return { kind: 'resolved', target: bodyPart };
  }

  // "prendre tout" reaches for whatever is here.
  if (verb === 'TAKE' && batchTakeTokens !== undefined && context.locationItems.length > 0) {
    if (searchTokens.some(t => batchTakeTokens.has(t))) {
      return { kind: 'resolved', target: context.locationItems[0]! };
    }
  }

  const candidates = collectCandidates(searchTokens, policy.pools, context);

  if (candidates.length > 0) {
    const poolRank = (pool: TargetPool): number => policy.pools.indexOf(pool);
    candidates.sort((a, b) =>
      b.score - a.score
      || Number(b.nameExact) - Number(a.nameExact)
      || poolRank(a.pool) - poolRank(b.pool),
    );

    const best = candidates[0]!;
    // An entity called by its own name beats one that merely lists the word as
    // an alias; otherwise an exact tie is a genuine question, not a coin flip.
    // A rival from a *lower-priority pool* is not a question: the order declared
    // in TARGET_POLICIES is precisely the author's answer (TAKE reaches for the
    // floor before the pack). Only a tie inside one pool is worth asking about.
    const rivals = candidates.filter(c =>
      c.target.id !== best.target.id
      && c.pool === best.pool
      && best.score - c.score <= AMBIGUITY_MARGIN
      && c.nameExact === best.nameExact,
    );
    if (rivals.length > 0) {
      return { kind: 'ambiguous', candidates: [best.target, ...rivals.map(r => r.target)] };
    }
    return { kind: 'resolved', target: best.target };
  }

  // Vague movement words: head somewhere new rather than refuse. Only somewhere
  // *new*: sending the player back the way they came is not "moving on", and in
  // a room gated by an obstacle it walked them out instead of letting them try.
  if (policy.pools.includes('exit') && searchTokens.some(t => GENERIC_EXIT_TOKENS.has(t))) {
    const unexplored = context.connectedLocations.filter(l => !l.visited);
    const pick = unexplored[0];
    if (pick !== undefined) {
      return {
        kind: 'resolved',
        target: {
          id: pick.id, nameKey: pick.displayName ?? pick.id, properties: [],
          isVirtual: false, source: 'connected_location' as TargetSource,
        },
      };
    }
  }

  // A generic reference works when there is only one thing it could mean.
  if (context.npcs.length === 1 && policy.pools.includes('npc')) {
    const npc = context.npcs[0]!;
    const referred = genericNpcRefs !== undefined
      && searchTokens.some(t => genericNpcRefs.has(t));
    // A pronoun stripped as a stop word leaves no target tokens at all.
    if (referred || targetTokens.length === 0) {
      return {
        kind: 'resolved',
        target: {
          id: npc.id, nameKey: npc.nameKey, properties: npc.properties,
          isVirtual: false, source: 'npc' as TargetSource, state: npc.state,
        },
      };
    }
  }

  if (policy.soleFallback !== undefined) {
    const pool = policy.soleFallback === 'location_item' ? context.locationItems : [];
    if (pool.length === 1) return { kind: 'resolved', target: pool[0]! };
  }

  return { kind: 'none' };
}
