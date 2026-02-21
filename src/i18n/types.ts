// ---------------------------------------------------------------------------
// src/i18n/types.ts — Internationalization type definitions
// ---------------------------------------------------------------------------

/** Supported locales */
export type Locale = 'fr' | 'en';

/** All valid locale IDs as a runtime array */
export const LOCALES: readonly Locale[] = ['fr', 'en'] as const;

/** Default locale — French is primary */
export const DEFAULT_LOCALE: Locale = 'fr';

/**
 * All valid i18n string keys.
 * Uses dot-notation for namespacing.
 * This union is the single source of truth for what strings exist.
 */
export type StringKey =
  // UI chrome
  | 'ui.play'
  | 'ui.newGame'
  | 'ui.continue'
  | 'ui.settings'
  | 'ui.quit'
  | 'ui.back'
  | 'ui.confirm'
  | 'ui.cancel'
  | 'ui.loading'
  | 'ui.save'
  | 'ui.load'
  // Character creation
  | 'creation.title'
  | 'creation.chooseName'
  | 'creation.chooseClass'
  | 'creation.distributePoints'
  | 'creation.bonusPoints'
  | 'creation.start'
  // Stats
  | 'stat.FOR'
  | 'stat.AGI'
  | 'stat.INT'
  | 'stat.PER'
  | 'stat.CHA'
  | 'stat.LCK'
  | 'stat.FOR.description'
  | 'stat.AGI.description'
  | 'stat.INT.description'
  | 'stat.PER.description'
  | 'stat.CHA.description'
  | 'stat.LCK.description'
  // Classes
  | 'class.marine'
  | 'class.engineer'
  | 'class.medic'
  | 'class.marine.description'
  | 'class.engineer.description'
  | 'class.medic.description'
  // Difficulty
  | 'difficulty.explorer'
  | 'difficulty.survivor'
  | 'difficulty.nightmare'
  | 'difficulty.explorer.description'
  | 'difficulty.survivor.description'
  | 'difficulty.nightmare.description'
  // Game
  | 'game.turn'
  | 'game.hp'
  | 'game.oxygen'
  | 'game.inventory'
  | 'game.action'
  | 'game.roll'
  | 'game.success'
  | 'game.failure'
  | 'game.critical'
  | 'game.fumble';

/** A locale translation record — maps every StringKey to its translated string */
export type LocaleStrings = Readonly<Record<StringKey, string>>;
