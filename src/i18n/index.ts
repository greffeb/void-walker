// ---------------------------------------------------------------------------
// src/i18n/index.ts — Synchronous i18n system
// ---------------------------------------------------------------------------
// Usage:
//   import { t, setLocale, getLocale } from '@i18n';
//   t('ui.play')          // -> 'Jouer' (default FR)
//   setLocale('en');
//   t('ui.play')          // -> 'Play'
// ---------------------------------------------------------------------------

import type { Locale, StringKey, LocaleStrings } from './types';
import { DEFAULT_LOCALE } from './types';
import { fr } from './locales/fr';
import { en } from './locales/en';

/** All loaded locale data */
const locales: Readonly<Record<Locale, LocaleStrings>> = { fr, en };

/** Current active locale */
let currentLocale: Locale = DEFAULT_LOCALE;

/**
 * Get the translated string for a given key in the current locale.
 * Returns the key itself if no translation is found (safe fallback).
 */
export function t(key: StringKey, locale?: Locale): string {
  const targetLocale = locale ?? currentLocale;
  const strings = locales[targetLocale];
  return strings[key] ?? key;
}

/** Set the active locale */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/** Get the current active locale */
export function getLocale(): Locale {
  return currentLocale;
}

/** Reset locale to default (primarily for testing) */
export function resetLocale(): void {
  currentLocale = DEFAULT_LOCALE;
}

// Re-export types for convenience
export type { Locale, StringKey, LocaleStrings } from './types';
export { DEFAULT_LOCALE, LOCALES } from './types';
