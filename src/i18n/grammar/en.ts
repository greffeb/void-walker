// ---------------------------------------------------------------------------
// src/i18n/grammar/en.ts — English grammar engine (placeholder)
// ---------------------------------------------------------------------------
// English has trivial grammar compared to French.
// This exists for API completeness and future localization.
// ---------------------------------------------------------------------------

import type { GrammarEngine, GrammaticalInfo, SlotModifier } from './interface';

/** English grammar engine — minimal since English lacks gender agreement */
export class EnglishGrammar implements GrammarEngine {
  readonly locale = 'en';

  article(
    type: 'definite' | 'indefinite' | 'partitive',
    info: GrammaticalInfo,
  ): string {
    if (type === 'definite') return 'the';
    if (type === 'partitive') return 'some';
    return info.startsWithVowel ? 'an' : 'a';
  }

  contract(preposition: string, article: string): string {
    return `${preposition} ${article}`;
  }

  agree(adjective: string, _info: GrammaticalInfo): string {
    return adjective; // English adjectives don't agree
  }

  resolveSlot(modifier: SlotModifier, noun: string, info: GrammaticalInfo): string {
    switch (modifier) {
      case 'bare':
        return noun;
      case 'def':
        return `the ${noun}`;
      case 'indef':
        return `${info.startsWithVowel ? 'an' : 'a'} ${noun}`;
      case 'partitive':
        return `some ${noun}`;
      case 'de':
        return `of the ${noun}`;
      case 'a':
        return `to the ${noun}`;
    }
  }

  postProcess(text: string): string {
    return text.replace(/ {2,}/g, ' ').trim();
  }
}

/** Singleton English grammar engine */
export const englishGrammar = new EnglishGrammar();
