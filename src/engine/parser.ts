// ---------------------------------------------------------------------------
// src/engine/parser.ts — Natural language parser for player actions
// ---------------------------------------------------------------------------
// 5-strategy verb matching cascade, input normalization, compound detection,
// semantic fallback, verb promotion, preposition-aware splitting, and
// reformulation prompt generation.
//
// All linguistic data (verb forms, compounds, stop words, intents) comes from
// ParserLocaleData, built by content/parserData.ts from i18n locale files.
// No hardcoded natural-language strings in this module.
// ---------------------------------------------------------------------------

import type { VerbId } from './verbs';
import { MOVEMENT_VERBS } from './verbs';
import { stemFr } from './snowball-fr';
import type {
  VerbMatch,
  VerbMatchStrategy,
  ParsedAction,
  Reformulation,
  ParseResult,
  SceneContext,
  ParserLocaleData,
  CompoundPattern,
  ResolvedTarget,
} from './types';
import { resolveTargets } from './resolver';

// Re-export CompoundPattern for tests that reference it
export type { CompoundPattern } from './types';

// === INPUT NORMALIZATION ===

/** Single-letter remnants left behind by French elision ("l'ennemi" -> "l",
 * "d'un" -> "d"...). Genuine noise, unlike a meaningful single-letter token
 * such as a label ("panneau A"/"panneau B") or the verb "a". */
const ELISION_REMNANTS: ReadonlySet<string> = new Set(['l', 'd', 'j', 'n', 'm', 's', 't', 'c']);

/**
 * Normalize raw input into clean tokens.
 * Pipeline: lowercase → strip accents → apostrophe→space → remove punct →
 * split on whitespace → drop single chars → remove stop words
 *
 * @param stopWords - Locale-specific stop words. If omitted, no stop word filtering.
 * @param negationWords - Removed too, but only after the caller has read them.
 */
export function normalizeInput(
  raw: string,
  stopWords?: ReadonlySet<string>,
  negationWords?: ReadonlySet<string>,
): string[] {
  if (!raw || typeof raw !== 'string') return [];

  let text = raw.toLowerCase();

  // Strip diacritics (NFD decompose + remove combining marks)
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Apostrophes → spaces (l'ennemi → l ennemi)
  text = text.replace(/[''ʼ`]/g, ' ');

  // Remove all punctuation except hyphens (keep compound words)
  text = text.replace(/[^\w\s-]/g, '');

  // Split on whitespace
  const rawTokens = text.split(/\s+/).filter((t) => t.length > 0);

  // A hyphen may join a real compound ("sas-b") or be leftover punctuation
  // ("tube-metallique"). Keep both readings and let scoring decide.
  const expanded = rawTokens.flatMap(t =>
    t.includes('-') ? [t, ...t.split('-')] : [t],
  );

  // Drop single-character tokens, EXCEPT the small fixed set of French
  // elision remnants ("l'ennemi" -> "l", "d'un" -> "d"...) — those are noise
  // and must go, but blanket-dropping ALL single characters also ate
  // meaningful single-letter labels ("panneau A" vs "panneau B"), making two
  // otherwise-identical features permanently indistinguishable by any
  // phrasing (REG-037).
  const filtered = expanded.filter((t) => t.length > 1 || !ELISION_REMNANTS.has(t));

  // Remove stop words (if provided)
  const tokens = stopWords
    ? filtered.filter((t) => !stopWords.has(t) && !(negationWords?.has(t) ?? false))
    : filtered;

  // Deduplicate and cap at 30 tokens to guard against pathological input.
  // Keep both the first 15 and last 15 unique tokens so that suffix-pattern
  // inputs like "<filler> tirer sur robot securite" still match correctly.
  const deduped = [...new Set(tokens)];
  if (deduped.length <= 30) return deduped;
  return [...deduped.slice(0, 15), ...deduped.slice(-15)];
}

/**
 * Normalize with stop words preserved (for compound detection where
 * prepositions like "sur" matter).
 *
 * @param prepositions - Declared prepositions. Single-character tokens are dropped
 *   as noise unless a locale declares them (French "a" in "aller a la passerelle");
 *   without this, `parser.prepositions.target` could declare a preposition the
 *   engine then threw away.
 */
export function normalizeInputKeepPrepositions(
  raw: string,
  prepositions?: ReadonlySet<string>,
): string[] {
  if (!raw || typeof raw !== 'string') return [];

  let text = raw.toLowerCase();
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  text = text.replace(/['’ʼ`]/g, ' ');
  text = text.replace(/[^\w\s-]/g, '');

  return text
    .split(/\s+/)
    .filter((t) => t.length > 1 || (prepositions?.has(t) ?? false) || !ELISION_REMNANTS.has(t));
}


// === ENTITY ALIAS COLLECTION ===

/**
 * Collect all normalized alias tokens from the scene context.
 * Used to prevent entity-name tokens from hijacking verb matching.
 * e.g. "scanner" (a location item) should not match verb SCAN.
 */
export function collectEntityAliasTokens(context: SceneContext): ReadonlySet<string> {
  const tokenSet = new Set<string>();

  const addAliasString = (alias: string): void => {
    const norm = alias.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const word of norm.split(/[\s_-]+/)) {
      if (word.length > 1) tokenSet.add(word);
    }
  };

  const addFromItem = (item: { readonly aliases?: readonly string[]; readonly nameKey: string; readonly id: string }): void => {
    for (const alias of item.aliases ?? []) addAliasString(alias);
    // nameKey parts (e.g. 'item.scanner' → 'scanner')
    const namePart = item.nameKey.split('.').pop() ?? '';
    for (const part of namePart.split('_')) { if (part.length > 1) tokenSet.add(part); }
    // id parts
    for (const part of item.id.split('_')) { if (part.length > 1) tokenSet.add(part); }
  };

  for (const item of context.inventory) addFromItem(item);
  for (const item of context.locationItems) addFromItem(item);
  for (const npc of context.npcs) addFromItem({ aliases: npc.aliases, nameKey: npc.nameKey, id: npc.id });
  for (const feat of context.environmentFeatures) addFromItem({ aliases: feat.aliases, nameKey: feat.nameKey, id: feat.id });

  return tokenSet;
}

// === VERB MATCHING ===

/**
 * Check for compound patterns in the full (non-stop-word-filtered) tokens.
 * Returns the matching compound or null.
 */
function matchCompound(
  fullTokens: readonly string[],
  compoundPatterns: readonly CompoundPattern[],
): CompoundPattern | null {
  for (const pattern of compoundPatterns) {
    // Check if all pattern tokens appear in order in the input
    let patternIdx = 0;
    for (const token of fullTokens) {
      if (patternIdx < pattern.tokens.length && token === pattern.tokens[patternIdx]) {
        patternIdx++;
      }
      if (patternIdx === pattern.tokens.length) {
        return pattern;
      }
    }
  }
  return null;
}

/**
 * Bounded Levenshtein distance. Returns `max + 1` as soon as the budget is blown,
 * so callers can compare against `max` without paying for the full matrix.
 */
function boundedDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i, ...new Array<number>(b.length).fill(0)];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min((row[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      row[j] = value;
      if (value < best) best = value;
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length] ?? max + 1;
}

/**
 * Strategy 4 — the player did not write a known form, but came close.
 *
 * Two distinct accidents are covered, both measured as a distance:
 *  - **typo**: "examner" for "examiner" → Levenshtein distance, budget 1 below
 *    6 characters, 2 beyond;
 *  - **truncation**: "interro" for "interroger" → the form starts with the token,
 *    distance = the number of characters the player did not type.
 *
 * The nearest form wins. **A tie between two different verbs is a refusal**, not a
 * coin toss: "atta" is 4 characters away from both "attaquer" (STRIKE) and
 * "attacher" (TIE), so it resolves to nothing and the input is reformulated.
 * This is what separates this strategy from the previous one, which returned the
 * first hit in the insertion order of the form Map.
 */
function nearestVerbForm(token: string, verbForms: ReadonlyMap<string, VerbId>): VerbId | null {
  if (token.length < 4) return null;
  const typoBudget = token.length < 6 ? 1 : token.length < 9 ? 2 : 3;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestVerb: VerbId | null = null;
  let tied = false;

  for (const [form, verbId] of verbForms) {
    if (form.length < 4 || form.includes(' ')) continue;
    const distance = form.startsWith(token)
      ? form.length - token.length
      : boundedDistance(token, form, typoBudget);
    if (distance > typoBudget && !form.startsWith(token)) continue;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestVerb = verbId;
      tied = false;
    } else if (distance === bestDistance && verbId !== bestVerb) {
      tied = true;
    }
  }

  return tied ? null : bestVerb;
}

/**
 * Match a verb from normalized tokens using a 5-strategy cascade.
 * All linguistic data comes from localeData (built from i18n locale files).
 *
 * Strategies:
 * 1. Direct form lookup (localeData.verbForms — merged alias + conjugated forms)
 * 3. Snowball stem match (localeData.stemmedIndex)
 * 4. Nearest known form (typo or truncation, ties refused)
 * 5. Compound action detection (localeData.compoundPatterns)
 * 6. Semantic fallback (localeData.intentKeywords)
 *
 * Strategy 5 is checked first despite its number, because compound patterns
 * have the highest specificity for multi-word inputs. Numbering preserved
 * for backward compatibility with existing test expectations.
 *
 * @param entityTokens - Optional set of entity alias tokens to skip for strategies 1-4.
 *   This prevents entity names (e.g. "scanner" as a location item) from hijacking verb matching.
 *   If all tokens are entity tokens, falls back to using all tokens.
 */
export function matchVerb(
  tokens: readonly string[],
  fullTokens: readonly string[],
  localeData: ParserLocaleData,
  entityTokens?: ReadonlySet<string>,
): VerbMatch | null {
  // Strategy 5 first: compound detection (highest specificity for multi-word patterns)
  const compound = matchCompound(fullTokens, localeData.compoundPatterns);
  if (compound) {
    return {
      verb: compound.verb,
      strategy: 5 as VerbMatchStrategy,
      isCompound: true,
      compoundTokens: compound.tokens,
    };
  }

  // For strategies 1-4, prefer tokens that are NOT known entity aliases.
  // This prevents "scanner" (item) → SCAN or "porte" (blast_door) → LIFT.
  // Fall back to all tokens if filtering leaves nothing.
  const verbPriorityTokens = entityTokens
    ? tokens.filter((t) => !entityTokens.has(t))
    : tokens;
  const s14tokens = verbPriorityTokens.length > 0 ? verbPriorityTokens : tokens;

  // Strategy 1: Direct form lookup from locale data
  for (const token of s14tokens) {
    const verb = localeData.verbForms.get(token);
    if (verb) {
      return {
        verb,
        strategy: 1 as VerbMatchStrategy,
        isCompound: false,
      };
    }
  }

  // Strategy 3: Snowball stem match
  for (const token of s14tokens) {
    const stemmed = stemFr(token);
    const verb = localeData.stemmedIndex.get(stemmed);
    if (verb) {
      return {
        verb,
        strategy: 3 as VerbMatchStrategy,
        isCompound: false,
      };
    }
  }

  // Strategy 4: nearest known form (typo or truncation), deterministic.
  for (const token of s14tokens) {
    const verb = nearestVerbForm(token, localeData.verbForms);
    if (verb) {
      return {
        verb,
        strategy: 4 as VerbMatchStrategy,
        isCompound: false,
      };
    }
  }

  // Strategy 6: Semantic fallback (intent keywords — uses all tokens for broadest coverage)
  for (const token of tokens) {
    const verb = localeData.intentKeywords.get(token);
    if (verb) {
      return {
        verb,
        strategy: 6 as VerbMatchStrategy,
        isCompound: false,
      };
    }
    // Also try stemmed version against intent keywords
    const stemmed = stemFr(token);
    for (const [keyword, verbId] of localeData.intentKeywords) {
      const stemmedKeyword = stemFr(keyword);
      if (stemmed === stemmedKeyword) {
        return {
          verb: verbId,
          strategy: 6 as VerbMatchStrategy,
          isCompound: false,
        };
      }
    }
  }

  return null;
}

// === VERB PROMOTION ===

/** What the player meant, once the object in their hand is taken into account. */
interface Promotion {
  readonly verb: VerbId;
  readonly target: ResolvedTarget | null;
  readonly tool: ResolvedTarget | null;
}

/**
 * Property cues that turn a generic USE into a specific act.
 *
 * `role` says what the object carrying the cue actually is:
 *  - `instrument` — you act *with* it (a gun, a blade), so it becomes the tool
 *    and the act needs someone to point it at;
 *  - `object` — you act *on* it (a terminal), so it stays the target and the
 *    promotion changes nothing but the verb.
 * Without this distinction, "utiliser le terminal" either shot at the terminal
 * or stayed a plain USE for want of a victim.
 */
const PROMOTION_CUES: readonly {
  readonly needs: readonly string[];
  readonly verb: VerbId;
  readonly role: 'instrument' | 'object';
}[] = [
  { needs: ['ranged'], verb: 'SHOOT', role: 'instrument' },
  { needs: ['bladed'], verb: 'CUT', role: 'instrument' },
  { needs: ['electronic', 'programmable'], verb: 'HACK', role: 'object' },
];

function cueFor(
  properties: readonly string[] | undefined,
  role?: 'instrument' | 'object',
): VerbId | null {
  if (!properties) return null;
  const set = new Set(properties);
  for (const cue of PROMOTION_CUES) {
    if (role !== undefined && cue.role !== role) continue;
    if (cue.needs.every(p => set.has(p))) return cue.verb;
  }
  return null;
}

/**
 * Promote a generic USE to the specific act the object affords.
 *
 * Decision M: promotion must move the object into the role it actually plays.
 * "utiliser le pistolet" is not "tirer sur le pistolet" — the pistol is the
 * instrument, and the target is whatever is in front of you. The old version
 * changed the verb and left the object as the target, so a player asking to use
 * their gun shot at it.
 *
 * A complement the player wrote themselves is never overruled.
 */
function promoteVerb(
  verb: VerbId,
  target: ResolvedTarget | null,
  tool: ResolvedTarget | null,
  context: SceneContext,
): Promotion {
  if (verb !== 'USE') return { verb, target, tool };

  // The player named an instrument: promote on it, leave the roles alone.
  const toolCue = cueFor(tool?.properties, 'instrument');
  if (toolCue !== null) return { verb: toolCue, target, tool };
  if (tool !== null) return { verb, target, tool };

  if (target === null) return { verb, target, tool };

  // Acting *on* the object: only the verb changes. You do not break into your
  // own device, so a datapad in your pack stays a plain USE.
  const objectCue = target.source === 'inventory'
    ? null
    : cueFor(target.properties, 'object');
  if (objectCue !== null) return { verb: objectCue, target, tool };

  // The cue is on the object itself, with no complement written: the object
  // becomes the instrument, and the act needs a new object.
  const targetCue = cueFor(target.properties, 'instrument');
  if (targetCue === null) return { verb, target, tool };

  const onlyNpc = context.npcs.length === 1 ? context.npcs[0] : undefined;
  const newTarget: ResolvedTarget | null = onlyNpc !== undefined
    ? {
        id: onlyNpc.id, nameKey: onlyNpc.nameKey, properties: onlyNpc.properties,
        isVirtual: false, source: 'npc' as import('./types').TargetSource, state: onlyNpc.state,
      }
    : null;

  // Nothing to point it at: leave the plain USE rather than invent a victim.
  if (newTarget === null) return { verb, target, tool };

  return { verb: targetCue, target: newTarget, tool: target };
}

// === PREPOSITION-AWARE SPLITTING ===

/**
 * Split tokens around prepositions for target/tool detection.
 *
 * Example: "lance couteau sur membre equipage"
 * → target preposition "sur" found → targetTokens: ["membre", "equipage"],
 *   toolTokens: ["couteau"] (between verb and preposition)
 *
 * Example: "ouvre porte avec levier"
 * → tool preposition "avec" found → targetTokens: ["porte"],
 *   toolTokens: ["levier"]
 *
 * If no preposition found, returns all tokens as targetTokens.
 */
function splitOnPrepositions(
  tokens: readonly string[],
  fullTokens: readonly string[],
  localeData: ParserLocaleData,
): { targetTokens: readonly string[]; toolTokens: readonly string[] } {
  // Drop stop words and elision noise, but keep meaningful single-letter
  // tokens (a label like "panneau A"/"panneau B" — see REG-037).
  const clean = (list: readonly string[]): string[] => list.filter(
    (t) => !localeData.stopWords.has(t) && (t.length > 1 || !ELISION_REMNANTS.has(t)),
  );

  // Search in fullTokens (which keeps prepositions) for splitting points
  for (let i = 1; i < fullTokens.length; i++) {
    const token = fullTokens[i];
    if (!token) continue;

    // Check for target prepositions (sur, vers, contre)
    if (localeData.targetPrepositions.has(token)) {
      // Tokens after the preposition = target
      const afterPrep = clean(fullTokens.slice(i + 1));
      // Tokens before the preposition (skip first = verb) = possible tool
      const beforePrep = clean(fullTokens.slice(1, i));

      if (afterPrep.length > 0) {
        return { targetTokens: afterPrep, toolTokens: beforePrep };
      }
    }

    // Check for tool prepositions (avec)
    if (localeData.toolPrepositions.has(token)) {
      // Tokens after the preposition = tool
      const afterPrep = clean(fullTokens.slice(i + 1));
      // Tokens before the preposition (skip first = verb) = target
      const beforePrep = clean(fullTokens.slice(1, i));

      if (afterPrep.length > 0) {
        return {
          targetTokens: beforePrep.length > 0 ? beforePrep : tokens,
          toolTokens: afterPrep,
        };
      }
    }
  }

  // No preposition found — all tokens are potential target tokens
  return { targetTokens: tokens, toolTokens: [] };
}

// === REFORMULATION ===

/**
 * Generate a reformulation when the parser can't determine the player's intent.
 * Produces 2-3 best-guess interpretations based on partial matches.
 */
export function generateReformulation(
  rawInput: string,
  tokens: readonly string[],
  context: SceneContext,
  localeData: ParserLocaleData,
): Reformulation {
  const interpretations: ParsedAction[] = [];

  // Try to find partial verb matches and construct interpretations
  const candidateVerbs: VerbId[] = [];

  // Check if any token partially matches a verb form
  for (const token of tokens) {
    if (token.length < 3) continue;
    for (const [form, verbId] of localeData.verbForms) {
      if (form.includes(token) || token.includes(form.slice(0, 3))) {
        if (!candidateVerbs.includes(verbId)) {
          candidateVerbs.push(verbId);
        }
      }
    }
    if (candidateVerbs.length >= 3) break;
  }

  // If no partial matches, suggest common verbs
  if (candidateVerbs.length === 0) {
    candidateVerbs.push('EXAMINE', 'STRIKE', 'USE');
  }

  // Build interpretations (max 3)
  for (const verbId of candidateVerbs.slice(0, 3)) {
    const resolution = resolveTargets(tokens, verbId, context, undefined, undefined, localeData.verbForms);
    const verbMatch: VerbMatch = {
      verb: verbId,
      strategy: 6 as VerbMatchStrategy,
      isCompound: false,
    };
    interpretations.push({
      verb: verbId,
      target: resolution.kind === 'resolved' ? resolution.target : null,
      tool: null,
      rawInput,
      tokens,
      verbMatch,
      creative: false,
    });
  }

  return {
    type: 'reformulation',
    rawInput,
    interpretations,
    prompt: localeData.reformulationPrompt,
  };
}

// === TOP-LEVEL PARSER ===

/**
 * Parse raw player input into a `ParsedAction` or `Reformulation`.
 *
 * Pipeline:
 * 1. Normalize input (with locale-specific stop words)
 * 2. Match verb (5-strategy cascade from locale data)
 * 3. If no verb → generate reformulation
 * 4. Split on prepositions for target/tool separation
 * 5. Resolve target and tool
 * 6. Promote generic verbs (USE → SHOOT/CUT/HACK) based on properties
 * 7. Assemble ParsedAction
 */
export function parseAction(
  rawInput: string,
  context: SceneContext,
  localeData: ParserLocaleData,
): ParseResult {
  if (!rawInput || typeof rawInput !== 'string' || rawInput.trim().length === 0) {
    return generateReformulation(rawInput ?? '', [], context, localeData);
  }

  const tokens = normalizeInput(rawInput, localeData.stopWords, localeData.negationWords);
  const fullTokens = normalizeInputKeepPrepositions(
    rawInput,
    new Set([...localeData.targetPrepositions, ...localeData.toolPrepositions]),
  );

  // "ne pas toucher l'androïde" used to reach the engine as "toucher
  // l'androïde", because the negation sat in the stop word list (P2-13).
  if (fullTokens.some(t => localeData.negationWords.has(t))) {
    return {
      type: 'refusal',
      rawInput,
      message: localeData.negationAcknowledged,
    };
  }

  if (tokens.length === 0) {
    return generateReformulation(rawInput, [], context, localeData);
  }

  // Collect entity alias tokens so we can skip them when matching verbs.
  // e.g. "scanner" is a location item alias → don't treat it as verb SCAN.
  const entityTokens = collectEntityAliasTokens(context);

  // Match verb
  const verbMatch = matchVerb(tokens, fullTokens, localeData, entityTokens);

  if (!verbMatch) {
    return generateReformulation(rawInput, tokens, context, localeData);
  }

  // Split on prepositions for target/tool separation
  const { targetTokens, toolTokens } = splitOnPrepositions(tokens, fullTokens, localeData);

  // Resolve target from target-specific tokens (or all tokens if no preposition split).
  const resolution = resolveTargets(
    targetTokens, verbMatch.verb, context,
    localeData.genericNpcRefs, localeData.batchTakeTokens, localeData.verbForms,
  );

  // The player named something the scene offers twice. Ask, do not guess (N).
  if (resolution.kind === 'ambiguous') {
    return {
      type: 'reformulation',
      rawInput,
      interpretations: resolution.candidates.map(candidate => ({
        verb: verbMatch.verb,
        target: candidate,
        tool: null,
        rawInput,
        tokens,
        verbMatch,
        creative: false,
      })),
      prompt: localeData.reformulationPrompt,
    };
  }

  let target: ResolvedTarget | null = resolution.kind === 'resolved' ? resolution.target : null;

  // Resolve tool if we found tool tokens (no genericNpcRefs — tools are physical items)
  const toolResolution = toolTokens.length > 0
    ? resolveTargets(toolTokens, verbMatch.verb, context, undefined, undefined, localeData.verbForms)
    : null;
  const tool = toolResolution?.kind === 'resolved' ? toolResolution.target : null;

  // Reflexive pronoun detection: "je me soigne", "se protéger", etc.
  // Not for movement: "se déplacer" is simply moving, and reading the player as
  // the thing being moved turned the suggestion into a no-op.
  const REFLEXIVE_PRONOUNS: ReadonlySet<string> = new Set(['me', 'se', 'nous']);
  if (
    target === null
    && !MOVEMENT_VERBS.has(verbMatch.verb)
    && fullTokens.some(t => REFLEXIVE_PRONOUNS.has(t))
  ) {
    target = {
      id: 'self',
      nameKey: 'player.self',
      properties: [],
      isVirtual: false,
      source: 'abstract' as import('./types').TargetSource,
    };
  }

  // TAKE with no identifiable target → ask the player to specify.
  if (verbMatch.verb === 'TAKE' && target === null) {
    return {
      type: 'reformulation',
      rawInput,
      interpretations: [],
      prompt: localeData.takeNoTargetPrompt,
    };
  }

  // P2-7: the player named the room they are already in.
  if (target !== null && target.source === 'current_location') {
    return {
      type: 'reformulation',
      rawInput,
      interpretations: [],
      prompt: localeData.alreadyHerePrompt,
    };
  }

  // MOVE_TO / movement verb with no specific destination.
  // "je m'en vais", "partir", "je pars" → verb matches MOVE_TO but the
  // resolver finds no connected location target.
  //
  // A room still gated by its obstacle keeps only the way the player came in.
  // Walking them back out is not what "je me déplace" means there, so the
  // destination is left open and the engine reads the move as an attempt to get
  // through — which is the only way a path worded entirely in movement verbs
  // ("traverser à tâtons") can ever be tried.
  const gatedRoom = context.sceneDescription?.obstacleHint !== null
    && context.sceneDescription?.obstacleHint !== undefined
    && context.connectedLocations.length > 0
    && context.connectedLocations.every(l => l.visited === true);
  if (MOVEMENT_VERBS.has(verbMatch.verb) && target === null && !gatedRoom) {
    if (context.connectedLocations.length === 1) {
      // Single exit → auto-resolve to that location
      const loc = context.connectedLocations[0]!;
      target = {
        id: loc.id,
        nameKey: loc.displayName ?? loc.id,
        properties: [],
        isVirtual: false,
        source: 'connected_location' as import('./types').TargetSource,
      };
    } else if (context.connectedLocations.length > 1) {
      // Multiple exits → ask the player where they want to go
      return {
        type: 'reformulation',
        rawInput,
        interpretations: [],
        prompt: localeData.moveNoTargetPrompt,
      };
    } else {
      // No exits → tell the player there's nowhere to go
      return {
        type: 'reformulation',
        rawInput,
        interpretations: [],
        prompt: localeData.moveNoExitPrompt,
      };
    }
  }

  // Verb promotion: a generic USE becomes the act the object affords, and the
  // object takes the role it actually plays (decision M).
  const promotion = promoteVerb(verbMatch.verb, target, tool, context);
  const finalVerbMatch = promotion.verb !== verbMatch.verb
    ? { ...verbMatch, verb: promotion.verb }
    : verbMatch;

  // Detect creativity (is this different from suggestions?)
  const creative = context.suggestions.length > 0 &&
    !context.suggestions.some((s) =>
      s.verb === finalVerbMatch.verb && s.target?.id === promotion.target?.id,
    );

  const action: ParsedAction = {
    verb: finalVerbMatch.verb,
    target: promotion.target,
    tool: promotion.tool,
    rawInput,
    tokens,
    verbMatch: finalVerbMatch,
    creative,
  };

  return action;
}
