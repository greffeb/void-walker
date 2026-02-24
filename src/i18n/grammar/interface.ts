// ---------------------------------------------------------------------------
// src/i18n/grammar/interface.ts — Abstract GrammarEngine contract
// ---------------------------------------------------------------------------
// Every supported language implements this interface.
// Template authors write grammar-aware slot prefixes ({def_target}, {a_target})
// and the engine resolves them automatically.
// ---------------------------------------------------------------------------

/** How a slot's noun should be modified */
export type SlotModifier = 'bare' | 'def' | 'indef' | 'partitive' | 'de' | 'a';

/** All valid slot modifiers as a runtime array */
export const SLOT_MODIFIERS: readonly SlotModifier[] = [
  'bare', 'def', 'indef', 'partitive', 'de', 'a',
] as const;

/** Grammatical metadata for a noun in a specific language */
export interface GrammaticalInfo {
  readonly gender: 'M' | 'F' | 'N';  // N = neutral (English, future languages)
  readonly startsWithVowel: boolean;
  readonly plural: boolean;
}

/** The contract every language grammar engine must satisfy */
export interface GrammarEngine {
  /** Locale code (e.g., 'fr', 'en') */
  readonly locale: string;

  /** Returns the correct article for a noun */
  article(
    type: 'definite' | 'indefinite' | 'partitive',
    info: GrammaticalInfo,
  ): string;

  /** Applies adjective agreement (gender + number) */
  agree(adjective: string, info: GrammaticalInfo): string;

  /** Handles preposition + article contractions */
  contract(preposition: string, article: string): string;

  /** Resolves a grammar-aware slot (e.g., 'def' + 'terminal') */
  resolveSlot(
    modifier: SlotModifier,
    noun: string,
    info: GrammaticalInfo,
  ): string;

  /** Language-specific post-processing (elision, spacing, etc.) */
  postProcess(text: string): string;
}
