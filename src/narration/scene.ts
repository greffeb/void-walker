// ---------------------------------------------------------------------------
// src/narration/scene.ts — Prose scene description with interactive tokens
// ---------------------------------------------------------------------------
// Converts a SceneDescription into a structured NarratedScene whose tokens
// can be rendered independently by the CLI (ANSI codes) and the UI (JSX/CSS).
// All player-facing strings come from i18n. Grammar article data (un/une) is
// stored in locale files as JSON, keeping language specifics out of the engine.
// ---------------------------------------------------------------------------

import type { SceneDescription } from '../engine/types';
import type { Locale, StringKey } from '../i18n/types';
import { t } from '../i18n/index';
import { detectGrammar } from './index';
import { getGrammarEngine } from './templateEngine';

export type SceneIntroMode = 'new_game' | 'enter' | 'revisit';

// ---------------------------------------------------------------------------
// TOKEN TYPES — structured output for multi-renderer support
// ---------------------------------------------------------------------------

export type SceneToken =
  | { readonly kind: 'text';     readonly value: string }
  | { readonly kind: 'location'; readonly value: string }
  | { readonly kind: 'feature';  readonly value: string }
  | { readonly kind: 'item';     readonly value: string }
  | { readonly kind: 'npc';      readonly value: string }
  | { readonly kind: 'exit';     readonly value: string; readonly visited: boolean };

export interface NarratedScene {
  /** "Vous reprenez conscience dans [location]." or "[location]." on revisit */
  readonly intro:    readonly SceneToken[];
  /** "Vous voyez autour de vous [feature], [feature] ainsi qu'[feature]." */
  readonly features: readonly SceneToken[];
  /** "Parmi les débris, vous remarquez [item] ainsi qu'[item]." */
  readonly items:    readonly SceneToken[];
  /** "Vous apercevez [npc]." */
  readonly npcs:     readonly SceneToken[];
  /** "Vous distinguez une sortie vers [exit]." + optional backtrack exits */
  readonly exits:    readonly SceneToken[];
  /** Obstacle hint text, or null if none / already resolved */
  readonly obstacle: string | null;
  /** "Que faites-vous ?" */
  readonly prompt:   string;
}

// ---------------------------------------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------------------------------------

/** Parse the JSON article map stored in an i18n string value. */
function parseArticleMap(raw: string): Readonly<Record<string, string>> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // fall through
  }
  return {};
}

/** Look up the indefinite article for an entity by its i18n key, defaulting to 'un'. */
function articleFor(iKey: string, map: Readonly<Record<string, string>>): string {
  return map[iKey] ?? 'un';
}

/** Lowercase the first letter of a string (for use within a sentence). */
function sentenceCase(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/**
 * Whether the first visible character of the rendered segment starts with
 * a French vowel sound (used for "ainsi que" vs "ainsi qu'" elision).
 */
function startsWithVowelSound(tokens: readonly SceneToken[]): boolean {
  for (const tok of tokens) {
    const v = tok.value.trimStart();
    if (v.length > 0) {
      return 'aeiouéèêëàâùûîïœæ'.includes(v.charAt(0).toLowerCase());
    }
  }
  return false;
}

/**
 * Build a flat token array representing an intro-phrase + enumerated list + period.
 *
 * introTokens — tokens for the phrase that precedes the list (e.g. "Vous voyez ")
 * segments    — each segment is the tokens for one list item
 *
 * Output: introTokens + item₁ [, item₂ [ ainsi qu'|que item_n]] .
 */
function buildSentenceTokens(
  introTokens: readonly SceneToken[],
  segments: readonly (readonly SceneToken[])[],
): readonly SceneToken[] {
  if (segments.length === 0) return [];

  const result: SceneToken[] = [...introTokens];
  const last = segments[segments.length - 1] ?? [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i] ?? [];
    result.push(...seg);

    if (i < segments.length - 2) {
      result.push({ kind: 'text', value: ', ' });
    } else if (i === segments.length - 2) {
      const usesElision = startsWithVowelSound(last);
      result.push({ kind: 'text', value: usesElision ? " ainsi qu'" : ' ainsi que ' });
    }
  }

  result.push({ kind: 'text', value: '.' });
  return result;
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------

/**
 * Convert a SceneDescription into a NarratedScene of structured tokens.
 *
 * @param sd         — the raw scene description from getSceneContext()
 * @param isNewEntry — true on first visit (uses intro_new phrasing)
 * @param locale     — active locale ('fr' | 'en')
 */
const INTRO_KEY: Record<SceneIntroMode, StringKey> = {
  new_game: 'scene.intro_new',
  enter:    'scene.intro_enter',
  revisit:  'scene.intro_revisit',
};

export function narrateScene(
  sd: SceneDescription,
  introMode: SceneIntroMode,
  locale: Locale,
): NarratedScene {
  // --- Article lookup tables (locale-specific, from i18n JSON strings) ---
  const itemArticles    = parseArticleMap(t('grammar.item_articles',    locale));
  const featureArticles = parseArticleMap(t('grammar.feature_articles', locale));

  // --- Intro sentence ---
  const introPhrase = t(INTRO_KEY[introMode], locale);

  const grammar = getGrammarEngine(locale);
  const grammarInfo = detectGrammar(sd.locationName);
  const articlePlusName = grammar.resolveSlot('def', sentenceCase(sd.locationName), grammarInfo);
  const intro: SceneToken[] = [
    { kind: 'text',     value: introPhrase + ' ' },
    { kind: 'location', value: articlePlusName },
    { kind: 'text',     value: '.' },
  ];
  if (sd.locationDescription) {
    intro.push({ kind: 'text', value: ' ' + sd.locationDescription });
  }

  // --- Features sentence ---
  const featureIntro = t('scene.features_intro', locale);
  const featureSegments = sd.visibleFeatures.map(f => {
    const article = articleFor(`env.${f.id}`, featureArticles);
    const seg: SceneToken[] = [];
    seg.push({ kind: 'text',    value: article + ' ' });
    seg.push({ kind: 'feature', value: sentenceCase(f.name) });
    return seg as readonly SceneToken[];
  });
  const features = buildSentenceTokens(
    [{ kind: 'text', value: featureIntro + ' ' }],
    featureSegments,
  );

  // --- Items sentence ---
  const itemIntro = t('scene.items_intro', locale);
  const itemSegments = sd.visibleItems.map(i => {
    const article = articleFor(`item.${i.id}`, itemArticles);
    const seg: SceneToken[] = [];
    seg.push({ kind: 'text', value: article + ' ' });
    seg.push({ kind: 'item', value: sentenceCase(i.name) });
    return seg as readonly SceneToken[];
  });
  const items = buildSentenceTokens(
    [{ kind: 'text', value: itemIntro + ' ' }],
    itemSegments,
  );

  // --- NPCs sentence ---
  const npcIntro = t('scene.npcs_intro', locale);
  const npcSegments = sd.visibleNpcs.map(n => {
    const seg: SceneToken[] = [{ kind: 'npc', value: n.name }];
    return seg as readonly SceneToken[];
  });
  const npcs = buildSentenceTokens(
    [{ kind: 'text', value: npcIntro + ' ' }],
    npcSegments,
  );

  // --- Exits sentence ---
  const unexplored = sd.exits.filter(e => !e.visited);
  const explored   = sd.exits.filter(e => e.visited);

  const exitTokens: SceneToken[] = [];

  if (unexplored.length > 0) {
    const exitPhrase = t('scene.exits_new', locale);
    const segs = unexplored.map(e => {
      const seg: SceneToken[] = [{ kind: 'exit', value: e.name, visited: false }];
      return seg as readonly SceneToken[];
    });
    exitTokens.push(...buildSentenceTokens(
      [{ kind: 'text', value: exitPhrase + ' ' }],
      segs,
    ));
  }

  if (explored.length > 0) {
    if (exitTokens.length > 0) exitTokens.push({ kind: 'text', value: ' ' });
    const knownPhrase = t('scene.exits_known', locale);
    const segs = explored.map(e => {
      const seg: SceneToken[] = [{ kind: 'exit', value: e.name, visited: true }];
      return seg as readonly SceneToken[];
    });
    exitTokens.push(...buildSentenceTokens(
      [{ kind: 'text', value: knownPhrase + ' ' }],
      segs,
    ));
  }

  return {
    intro,
    features,
    items,
    npcs,
    exits: exitTokens,
    obstacle: sd.obstacleHint,
    prompt:   t('scene.prompt', locale),
  };
}
