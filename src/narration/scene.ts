// ---------------------------------------------------------------------------
// src/narration/scene.ts — Prose scene description with interactive tokens
// ---------------------------------------------------------------------------
// Converts a SceneDescription into a structured NarratedScene whose tokens
// can be rendered independently by the CLI (ANSI codes) and the UI (JSX/CSS).
// All player-facing strings come from i18n. Grammar article data (un/une) is
// stored in locale files as JSON, keeping language specifics out of the engine.
// ---------------------------------------------------------------------------

import type { SceneDescription } from '../engine/types';
import type { SceneDelta } from '../engine/sceneDelta';
import { EMPTY_SCENE_DELTA, isSceneUnchanged } from '../engine/sceneDelta';
import type { Locale } from '../i18n/types';
import { t } from '../i18n/index';
import { detectGrammar } from './index';
import { getGrammarEngine } from './templateEngine';
import type { GrammarEngine } from '../i18n/grammar/interface';

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
  /** Scenario intro shown ONCE at new_game. null otherwise. */
  readonly scenarioIntro: string | null;
  /** Location intro tokens: just the name for enter/new_game, "Vous revenez dans [lieu]." for revisit. */
  readonly intro:    readonly SceneToken[];
  /** Rich flavour text for the location. null on revisit. */
  readonly locationDescription: string | null;
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
  /**
   * The short recap, built only from what changed since last turn. Empty when
   * nothing moved — which is most turns, and why the full enumeration used to
   * be reprinted pointlessly after every action.
   */
  readonly recap:    readonly SceneToken[];
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

/**
 * Returns true if the name already starts with a French determiner or possessive,
 * so that we skip prepending a separate indefinite article.
 */
const FRENCH_DETERMINERS = new Set([
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
  'le', 'la', 'les', "l'",
]);
function startsWithDeterminer(name: string): boolean {
  const first = name.toLowerCase().split(' ')[0] ?? '';
  return FRENCH_DETERMINERS.has(first);
}

/** Lowercase the first letter of a string (for use within a sentence). */
function sentenceCase(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/**
 * Prefix a definite article unless the name already carries a determiner.
 * Exit names are bare location names, and "une sortie vers atelier de
 * robotique" is not French.
 */
function withDeterminer(name: string, grammar: GrammarEngine): string {
  const lower = sentenceCase(name);
  if (startsWithDeterminer(lower)) return lower;
  return grammar.resolveSlot('def', lower, detectGrammar(name));
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
 * @param sd        — the raw scene description from getSceneContext()
 * @param introMode — 'new_game' | 'enter' | 'revisit'
 * @param locale    — active locale ('fr' | 'en')
 */
export function narrateScene(
  sd: SceneDescription,
  introMode: SceneIntroMode,
  locale: Locale,
  delta: SceneDelta = EMPTY_SCENE_DELTA,
): NarratedScene {
  // --- Article lookup tables (locale-specific, from i18n JSON strings) ---
  const itemArticles    = parseArticleMap(t('grammar.item_articles',    locale));
  const featureArticles = parseArticleMap(t('grammar.feature_articles', locale));

  const grammar = getGrammarEngine(locale);
  const grammarInfo = detectGrammar(sd.locationName);

  // --- Scenario intro (only on new_game) ---
  const scenarioIntro: string | null = (introMode === 'new_game' && sd.scenarioIntro !== null && sd.scenarioIntro !== undefined)
    ? sd.scenarioIntro
    : null;

  // --- Location description (null on revisit) ---
  const locationDescription: string | null = introMode !== 'revisit' && sd.locationDescription
    ? sd.locationDescription
    : null;

  // --- Intro tokens ---
  let intro: SceneToken[];
  if (introMode === 'revisit') {
    // "Vous revenez dans [article+lieu]."
    const revisitPhrase = t('scene.intro_revisit', locale);
    const articlePlusName = grammar.resolveSlot('def', sentenceCase(sd.locationName), grammarInfo);
    intro = [
      { kind: 'text',     value: revisitPhrase + ' ' },
      { kind: 'location', value: articlePlusName },
      { kind: 'text',     value: '.' },
    ];
  } else {
    // new_game or enter: just the bare location name token
    intro = [
      { kind: 'location', value: sd.locationName },
    ];
  }

  // --- Features sentence ---
  const featureIntro = t('scene.features_intro', locale);
  const featureSegments = sd.visibleFeatures.map(f => {
    const seg: SceneToken[] = [];
    if (!startsWithDeterminer(f.name)) {
      const article = articleFor(`env.${f.id}`, featureArticles);
      seg.push({ kind: 'text', value: article + ' ' });
    }
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
    const seg: SceneToken[] = [];
    if (!startsWithDeterminer(i.name)) {
      const article = articleFor(`item.${i.id}`, itemArticles);
      seg.push({ kind: 'text', value: article + ' ' });
    }
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
    const exitPhrase = t(unexplored.length > 1 ? 'scene.exits_new_plural' : 'scene.exits_new', locale);
    const segs = unexplored.map(e => {
      const seg: SceneToken[] = [{ kind: 'exit', value: withDeterminer(e.name, grammar), visited: false }];
      return seg as readonly SceneToken[];
    });
    exitTokens.push(...buildSentenceTokens(
      [{ kind: 'text', value: exitPhrase + ' ' }],
      segs,
    ));
  }

  if (explored.length > 0) {
    if (exitTokens.length > 0) exitTokens.push({ kind: 'text', value: ' ' });
    const knownPhrase = t(explored.length > 1 ? 'scene.exits_known_plural' : 'scene.exits_known', locale);
    const segs = explored.map(e => {
      const seg: SceneToken[] = [{ kind: 'exit', value: withDeterminer(e.name, grammar), visited: true }];
      return seg as readonly SceneToken[];
    });
    exitTokens.push(...buildSentenceTokens(
      [{ kind: 'text', value: knownPhrase + ' ' }],
      segs,
    ));
  }

  return {
    scenarioIntro,
    intro,
    locationDescription,
    features,
    items,
    npcs,
    exits: exitTokens,
    obstacle: sd.obstacleHint,
    recap:    buildRecap(sd, delta, locale, grammar, featureArticles, itemArticles),
    prompt:   t('scene.prompt', locale),
  };
}

// ---------------------------------------------------------------------------
// RECAP — only what moved
// ---------------------------------------------------------------------------

/**
 * The post-action recap. One short line per kind of change, naming only the
 * elements involved, so that a turn where nothing moved says nothing.
 */
function buildRecap(
  sd: SceneDescription,
  delta: SceneDelta,
  locale: Locale,
  grammar: GrammarEngine,
  featureArticles: Readonly<Record<string, string>>,
  itemArticles: Readonly<Record<string, string>>,
): readonly SceneToken[] {
  if (isSceneUnchanged(delta)) return [];

  const lines: SceneToken[][] = [];

  const changed = sd.visibleFeatures.filter(f => delta.changedFeatures.includes(f.id));
  if (changed.length > 0) {
    lines.push([
      { kind: 'text', value: t('scene.recap_changed', locale) + ' ' },
      ...joinSegments(changed.map(f => [
        { kind: 'feature', value: definiteName(f.name, grammar) } as SceneToken,
      ])),
      { kind: 'text', value: '.' },
    ]);
  }

  const appeared = sd.visibleItems.filter(i => delta.appearedItems.includes(i.id));
  if (appeared.length > 0) {
    lines.push([
      { kind: 'text', value: t('scene.recap_appeared', locale) + ' ' },
      ...joinSegments(appeared.map(i => indefiniteSegment(i, itemArticles, 'item'))),
      { kind: 'text', value: '.' },
    ]);
  }

  if (delta.newExits.length > 0) {
    lines.push([
      { kind: 'text', value: t('scene.recap_new_exit', locale) + ' ' },
      ...joinSegments(delta.newExits.map(name => [
        { kind: 'exit', value: withDeterminer(name, grammar), visited: false } as SceneToken,
      ])),
      { kind: 'text', value: '.' },
    ]);
  }

  const arrived = sd.visibleNpcs.filter(n => delta.arrivedNpcs.includes(n.id));
  if (arrived.length > 0) {
    lines.push([
      { kind: 'text', value: t('scene.recap_arrived', locale) + ' ' },
      ...joinSegments(arrived.map(n => [{ kind: 'npc', value: n.name } as SceneToken])),
      { kind: 'text', value: '.' },
    ]);
  }

  const result: SceneToken[] = [];
  for (const line of lines) {
    if (result.length > 0) result.push({ kind: 'text', value: ' ' });
    result.push(...line);
  }
  void featureArticles;
  return result;
}

/** Comma-and-"ainsi que" joining, without the trailing period. */
function joinSegments(segments: readonly (readonly SceneToken[])[]): readonly SceneToken[] {
  const joined = buildSentenceTokens([], segments);
  // buildSentenceTokens closes with a period; the caller supplies its own.
  return joined.slice(0, -1);
}

/** "le terminal de communications" — the recap points at something known. */
function definiteName(name: string, grammar: GrammarEngine): string {
  const lower = sentenceCase(name);
  if (startsWithDeterminer(lower)) return lower;
  return grammar.resolveSlot('def', lower, detectGrammar(name));
}

function indefiniteSegment(
  entity: { readonly id: string; readonly name: string },
  articles: Readonly<Record<string, string>>,
  kind: 'item' | 'feature',
): readonly SceneToken[] {
  const seg: SceneToken[] = [];
  if (!startsWithDeterminer(entity.name)) {
    seg.push({ kind: 'text', value: articleFor(`${kind}.${entity.id}`, articles) + ' ' });
  }
  seg.push({ kind, value: sentenceCase(entity.name) });
  return seg;
}
