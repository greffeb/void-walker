// ---------------------------------------------------------------------------
// src/content/helpers.ts — Content-layer helpers for locale-aware alias resolution
// ---------------------------------------------------------------------------
// Lives in content layer so it can import from i18n (engine cannot).
// ---------------------------------------------------------------------------

import { t } from '../i18n';
import type { Locale, StringKey } from '../i18n/types';

/** Stop words per locale — filtered from tokenized display names */
const STOP_WORDS: Readonly<Record<Locale, ReadonlySet<string>>> = {
  fr: new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
    'et', 'ou', 'en', 'a', 'd',
  ]),
  en: new Set([
    'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'and', 'or',
  ]),
};

/**
 * Tokenize a display name into normalized tokens for a given locale.
 * Returns lowercase tokens with accents stripped, no stop words, no 1-char tokens.
 */
function tokenizeDisplayName(nameKey: StringKey, locale: Locale): string[] {
  const display = t(nameKey, locale);
  if (!display || display === nameKey) return [];

  const stops = STOP_WORDS[locale] ?? new Set<string>();
  return display
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip accents
    .replace(/['']/g, ' ')             // apostrophe → space
    .replace(/[^a-z0-9\s]/g, '')       // strip punctuation
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stops.has(w));
}

/**
 * Get all aliases for an entity from i18n, combining:
 * 1. Comma-separated alias string from the `.aliases` key
 * 2. Auto-tokenized display name (nameKey)
 *
 * Returns a deduplicated array of normalized lowercase strings.
 */
export function getEntityAliases(
  aliasesKey: StringKey,
  nameKey: StringKey,
  locale?: Locale,
): string[] {
  const effectiveLocale: Locale = locale ?? 'fr';

  // 1. Parse comma-separated aliases from i18n
  const aliasStr = t(aliasesKey, effectiveLocale);
  const explicit: string[] = (aliasStr && aliasStr !== aliasesKey)
    ? aliasStr.split(',').map((s) => s.trim().toLowerCase()).filter((s) => s.length > 0)
    : [];

  // 2. Auto-tokenize display name
  const nameTokens = tokenizeDisplayName(nameKey, effectiveLocale);

  // 3. Deduplicate
  const seen = new Set<string>();
  const result: string[] = [];
  for (const alias of [...explicit, ...nameTokens]) {
    if (!seen.has(alias)) {
      seen.add(alias);
      result.push(alias);
    }
  }
  return result;
}
