// ---------------------------------------------------------------------------
// src/content/parserData.ts — Bridge between i18n locale data and engine parser
// ---------------------------------------------------------------------------
// Lives in content layer so it can import from i18n (engine cannot).
// Builds typed ParserLocaleData from locale strings for the parser to consume.
// ---------------------------------------------------------------------------

import { t } from '../i18n';
import type { Locale, StringKey } from '../i18n/types';
import { VERB_IDS } from '../engine/verbs';
import type { VerbId } from '../engine/verbs';
import { stemFr } from '../engine/snowball-fr';
import type { ParserLocaleData, CompoundPattern } from '../engine/types';

// === HELPERS ===

/**
 * Normalize a single alias form: lowercase, strip accents, trim.
 * Multi-word aliases are returned as-is (spaces preserved) for compound matching.
 */
function normalizeForm(form: string): string {
  return form
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// === BUILDERS ===

/**
 * Build the verbForms map from i18n verb.{ID}.aliases keys.
 * Each key contains a comma-separated list of ALL recognizable forms.
 */
function buildVerbForms(locale: Locale): ReadonlyMap<string, VerbId> {
  const map = new Map<string, VerbId>();

  for (const verbId of VERB_IDS) {
    const aliasesKey = `verb.${verbId}.aliases` as StringKey;
    const aliasStr = t(aliasesKey, locale);
    if (!aliasStr || aliasStr === aliasesKey) continue;

    for (const raw of aliasStr.split(',')) {
      const normalized = normalizeForm(raw);
      if (normalized.length === 0) continue;

      // Register the form as-is.  Multi-word forms (e.g. "utiliser comme arme")
      // are stored but only matchable via compound patterns, not strategy-1
      // single-token lookup.  We intentionally do NOT split multi-word aliases
      // into individual words — that would pollute the map (e.g. "utiliser"
      // would be stolen by IMPROVISE_WEAPON before USE gets registered).
      if (!map.has(normalized)) {
        map.set(normalized, verbId);
      }
    }
  }

  return map;
}

/**
 * Build the stemmed alias index from verbForms.
 * Only stems ≥3 chars are indexed; first verb wins.
 */
function buildStemmedIndex(verbForms: ReadonlyMap<string, VerbId>): ReadonlyMap<string, VerbId> {
  const index = new Map<string, VerbId>();

  for (const [form, verbId] of verbForms) {
    // Only stem single-word forms
    if (form.includes(' ')) continue;
    const stemmed = stemFr(form);
    if (stemmed.length >= 3 && !index.has(stemmed)) {
      index.set(stemmed, verbId);
    }
  }

  return index;
}

/**
 * Build compound patterns from i18n parser.compounds key.
 * Format: "VERB:token1+token2,VERB:token1+token2+token3,..."
 * Returns sorted by token count descending.
 */
function buildCompoundPatterns(locale: Locale): readonly CompoundPattern[] {
  const raw = t('parser.compounds', locale);
  if (!raw || raw === 'parser.compounds') return [];

  const patterns: CompoundPattern[] = [];

  for (const entry of raw.split(',')) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx < 0) continue;

    const verb = entry.slice(0, colonIdx).trim() as VerbId;
    const tokensStr = entry.slice(colonIdx + 1).trim();
    const tokens = tokensStr.split('+').map((t) => normalizeForm(t)).filter((t) => t.length > 0);

    if (tokens.length > 0 && VERB_IDS.includes(verb)) {
      patterns.push({ tokens, verb });
    }
  }

  // Sort by token count descending (longer patterns matched first)
  patterns.sort((a, b) => b.tokens.length - a.tokens.length);

  return patterns;
}

/**
 * Build stop words set from i18n parser.stopWords key.
 */
function buildStopWords(locale: Locale): ReadonlySet<string> {
  const raw = t('parser.stopWords', locale);
  if (!raw || raw === 'parser.stopWords') return new Set();

  return new Set(
    raw.split(',')
      .map((w) => normalizeForm(w))
      .filter((w) => w.length > 0),
  );
}

/**
 * Build intent keywords map from i18n parser.intents key.
 * Format: "VERB:keyword,VERB:keyword,..."
 */
function buildIntentKeywords(locale: Locale): ReadonlyMap<string, VerbId> {
  const raw = t('parser.intents', locale);
  if (!raw || raw === 'parser.intents') return new Map();

  const map = new Map<string, VerbId>();

  for (const entry of raw.split(',')) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx < 0) continue;

    const verb = entry.slice(0, colonIdx).trim() as VerbId;
    const keyword = normalizeForm(entry.slice(colonIdx + 1));

    if (keyword.length > 0 && VERB_IDS.includes(verb) && !map.has(keyword)) {
      map.set(keyword, verb);
    }
  }

  return map;
}

/**
 * Build obstacle verb map from i18n 'parser.obstacleVerbs' key.
 * Format: "VERBID:englishVerb,..." — keys are lowercase English authoring verbs,
 * values are VerbIds. Used by scene.ts to resolve obstacle path verbs to
 * localized display names without any hardcoded strings in the engine.
 */
export function buildObstacleVerbMap(locale: Locale): ReadonlyMap<string, VerbId> {
  const raw = t('parser.obstacleVerbs', locale);
  if (!raw || raw === 'parser.obstacleVerbs') return new Map();

  const map = new Map<string, VerbId>();
  for (const entry of raw.split(',')) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx < 0) continue;
    const verb = entry.slice(0, colonIdx).trim() as VerbId;
    const keyword = normalizeForm(entry.slice(colonIdx + 1));
    if (keyword.length > 0 && VERB_IDS.includes(verb) && !map.has(keyword)) {
      map.set(keyword, verb);
    }
  }
  return map;
}

/**
 * Build preposition set from i18n key.
 */
function buildPrepositions(key: StringKey, locale: Locale): ReadonlySet<string> {
  const raw = t(key, locale);
  if (!raw || raw === key) return new Set();

  return new Set(
    raw.split(',')
      .map((w) => normalizeForm(w))
      .filter((w) => w.length > 0),
  );
}

/**
 * Build generic NPC reference tokens from i18n parser.genericNpcRefs key.
 * These are pronouns and generic enemy words that resolve to the primary NPC
 * when exactly one NPC is present in the scene.
 */
function buildGenericNpcRefs(locale: Locale): ReadonlySet<string> {
  const raw = t('parser.genericNpcRefs', locale);
  if (!raw || raw === 'parser.genericNpcRefs') return new Set();

  return new Set(
    raw.split(',')
      .map((w) => normalizeForm(w))
      .filter((w) => w.length > 0),
  );
}

// === PUBLIC API ===

/**
 * Build complete parser locale data from i18n for the given locale.
 * This is the bridge between the i18n system and the engine parser.
 * Call once at app startup or when locale changes.
 */
export function buildParserLocaleData(locale: Locale = 'fr'): ParserLocaleData {
  const verbForms = buildVerbForms(locale);
  const stemmedIndex = buildStemmedIndex(verbForms);
  const compoundPatterns = buildCompoundPatterns(locale);
  const stopWords = buildStopWords(locale);
  const intentKeywords = buildIntentKeywords(locale);
  const targetPrepositions = buildPrepositions('parser.prepositions.target', locale);
  const toolPrepositions = buildPrepositions('parser.prepositions.tool', locale);
  const genericNpcRefs = buildGenericNpcRefs(locale);
  const obstacleVerbMap = buildObstacleVerbMap(locale);

  return {
    verbForms,
    compoundPatterns,
    stopWords,
    intentKeywords,
    stemmedIndex,
    targetPrepositions,
    toolPrepositions,
    genericNpcRefs,
    obstacleVerbMap,
  };
}
