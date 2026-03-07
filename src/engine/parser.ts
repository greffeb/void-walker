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
import { resolveTarget } from './resolver';

// Re-export CompoundPattern for tests that reference it
export type { CompoundPattern } from './types';

// === INPUT NORMALIZATION ===

/**
 * Normalize raw input into clean tokens.
 * Pipeline: lowercase → strip accents → apostrophe→space → remove punct →
 * split on whitespace → drop single chars → remove stop words
 *
 * @param stopWords - Locale-specific stop words. If omitted, no stop word filtering.
 */
export function normalizeInput(raw: string, stopWords?: ReadonlySet<string>): string[] {
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

  // Drop single-character tokens
  const filtered = rawTokens.filter((t) => t.length > 1);

  // Remove stop words (if provided)
  const tokens = stopWords
    ? filtered.filter((t) => !stopWords.has(t))
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
 */
export function normalizeInputKeepPrepositions(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];

  let text = raw.toLowerCase();
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  text = text.replace(/[''ʼ`]/g, ' ');
  text = text.replace(/[^\w\s-]/g, '');

  return text.split(/\s+/).filter((t) => t.length > 1);
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
 * Match a verb from normalized tokens using a 5-strategy cascade.
 * All linguistic data comes from localeData (built from i18n locale files).
 *
 * Strategies:
 * 1. Direct form lookup (localeData.verbForms — merged alias + conjugated forms)
 * 3. Snowball stem match (localeData.stemmedIndex)
 * 4. Prefix match (4+ chars against localeData.verbForms)
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
      confidence: 0.9,
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
        confidence: 0.95,
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
        confidence: 0.8,
        isCompound: false,
      };
    }
  }

  // Strategy 4: Prefix match (4+ chars) — excludes multi-word forms (handled by compound matching)
  for (const token of s14tokens) {
    if (token.length < 4) continue;
    const prefix = token.slice(0, 4);
    for (const [form, verbId] of localeData.verbForms) {
      if (form.startsWith(prefix) && form.length >= 4 && !form.includes(' ')) {
        return {
          verb: verbId,
          strategy: 4 as VerbMatchStrategy,
          confidence: 0.6,
          isCompound: false,
        };
      }
    }
  }

  // Strategy 6: Semantic fallback (intent keywords — uses all tokens for broadest coverage)
  for (const token of tokens) {
    const verb = localeData.intentKeywords.get(token);
    if (verb) {
      return {
        verb,
        strategy: 6 as VerbMatchStrategy,
        confidence: 0.4,
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
          confidence: 0.3,
          isCompound: false,
        };
      }
    }
  }

  return null;
}

// === VERB PROMOTION ===

/**
 * Promote generic verbs to specific ones based on target/tool properties.
 * Pure engine logic — no linguistic data needed.
 *
 * Rules:
 * - USE + target/tool has 'ranged' → SHOOT
 * - USE + target/tool has 'bladed' → CUT
 * - USE + target/tool has 'electronic' + 'programmable' → HACK
 */
function promoteVerb(
  verb: VerbId,
  target: ResolvedTarget | null,
  tool: ResolvedTarget | null,
): VerbId {
  if (verb !== 'USE') return verb;

  // Check both target and tool properties for promotion cues
  const allProperties = new Set<string>();
  if (target?.properties) {
    for (const p of target.properties) allProperties.add(p);
  }
  if (tool?.properties) {
    for (const p of tool.properties) allProperties.add(p);
  }

  if (allProperties.has('ranged')) return 'SHOOT';
  if (allProperties.has('bladed')) return 'CUT';
  if (allProperties.has('electronic') && allProperties.has('programmable')) return 'HACK';

  return verb;
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
  // Search in fullTokens (which keeps prepositions) for splitting points
  for (let i = 1; i < fullTokens.length; i++) {
    const token = fullTokens[i];
    if (!token) continue;

    // Check for target prepositions (sur, vers, contre)
    if (localeData.targetPrepositions.has(token)) {
      // Tokens after the preposition = target
      const afterPrep = fullTokens.slice(i + 1)
        .filter((t) => !localeData.stopWords.has(t) && t.length > 1);
      // Tokens before the preposition (skip first = verb) = possible tool
      const beforePrep = fullTokens.slice(1, i)
        .filter((t) => !localeData.stopWords.has(t) && t.length > 1);

      if (afterPrep.length > 0) {
        return { targetTokens: afterPrep, toolTokens: beforePrep };
      }
    }

    // Check for tool prepositions (avec)
    if (localeData.toolPrepositions.has(token)) {
      // Tokens after the preposition = tool
      const afterPrep = fullTokens.slice(i + 1)
        .filter((t) => !localeData.stopWords.has(t) && t.length > 1);
      // Tokens before the preposition (skip first = verb) = target
      const beforePrep = fullTokens.slice(1, i)
        .filter((t) => !localeData.stopWords.has(t) && t.length > 1);

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
    const target = resolveTarget(tokens, verbId, context);
    const verbMatch: VerbMatch = {
      verb: verbId,
      strategy: 6 as VerbMatchStrategy,
      confidence: 0.2,
      isCompound: false,
    };
    interpretations.push({
      verb: verbId,
      target,
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
    prompt: 'Que tentez-vous exactement ?',
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

  const tokens = normalizeInput(rawInput, localeData.stopWords);
  const fullTokens = normalizeInputKeepPrepositions(rawInput);

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
  // Pass genericNpcRefs so pronoun/generic-reference tokens ("lui", "ennemi") resolve
  // to the primary NPC when exactly one NPC is present in the scene.
  // Pass verbForms so the resolver can filter i18n verb forms (e.g. "attaque" for STRIKE)
  // in addition to VERB_REGISTRY static aliases.
  let target = resolveTarget(
    targetTokens, verbMatch.verb, context,
    localeData.genericNpcRefs, localeData.batchTakeTokens, localeData.verbForms,
  );

  // Resolve tool if we found tool tokens (no genericNpcRefs — tools are physical items)
  const tool = toolTokens.length > 0
    ? resolveTarget(toolTokens, verbMatch.verb, context)
    : null;

  // Reflexive pronoun detection: "je me soigne", "se protéger", etc.
  // When fullTokens contain a reflexive pronoun (me, se, nous) and the resolver
  // fell back to abstract environment (no explicit target found), override to self.
  // This prevents "je me soigne" → USE → environment, producing USE → self instead.
  const REFLEXIVE_PRONOUNS: ReadonlySet<string> = new Set(['me', 'se', 'nous']);
  if (
    target !== null
    && target.id === 'environment'
    && target.source === 'abstract'
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
  // The resolver returns null (0 or multiple unmatched items) rather than the
  // abstract environment fallback for TAKE, so we can catch it cleanly here.
  if (verbMatch.verb === 'TAKE' && (target === null || target.source === 'abstract')) {
    return {
      type: 'reformulation',
      rawInput,
      interpretations: [],
      prompt: localeData.takeNoTargetPrompt,
    };
  }

  // MOVE_TO / movement verb with no specific destination.
  // "je m'en vais", "partir", "je pars" → verb matches MOVE_TO but the
  // resolver finds no connected location target (falls back to abstract).
  // Fix: auto-resolve to the single exit, or prompt for clarification.
  if (MOVEMENT_VERBS.has(verbMatch.verb)
      && (target === null || target.source === 'abstract')) {
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

  // Verb promotion: upgrade generic verbs based on target/tool properties
  const promotedVerb = promoteVerb(verbMatch.verb, target, tool);
  const finalVerbMatch = promotedVerb !== verbMatch.verb
    ? { ...verbMatch, verb: promotedVerb }
    : verbMatch;

  // Detect creativity (is this different from suggestions?)
  const creative = context.suggestions.length > 0 &&
    !context.suggestions.some((s) =>
      s.verb === finalVerbMatch.verb && s.target?.id === target?.id,
    );

  const action: ParsedAction = {
    verb: finalVerbMatch.verb,
    target,
    tool,
    rawInput,
    tokens,
    verbMatch: finalVerbMatch,
    creative,
  };

  return action;
}
