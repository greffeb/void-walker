// ---------------------------------------------------------------------------
// src/i18n/grammar/fr.ts — French grammar engine
// ---------------------------------------------------------------------------
// Handles articles, adjective agreement, contractions, elision, and
// French typographic conventions for the narrative composition system.
// ---------------------------------------------------------------------------

import type { GrammarEngine, GrammaticalInfo, SlotModifier } from './interface';

/** Irregular adjectives that don't follow standard agreement rules */
const IRREGULAR_ADJECTIVES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'beau':    { ms: 'beau',    fs: 'belle',    mp: 'beaux',    fp: 'belles' },
  'nouveau': { ms: 'nouveau', fs: 'nouvelle', mp: 'nouveaux', fp: 'nouvelles' },
  'vieux':   { ms: 'vieux',   fs: 'vieille',  mp: 'vieux',    fp: 'vieilles' },
  'blanc':   { ms: 'blanc',   fs: 'blanche',  mp: 'blancs',   fp: 'blanches' },
  'sec':     { ms: 'sec',     fs: 'sèche',    mp: 'secs',     fp: 'sèches' },
  'épais':   { ms: 'épais',   fs: 'épaisse',  mp: 'épais',    fp: 'épaisses' },
  'long':    { ms: 'long',    fs: 'longue',   mp: 'longs',    fp: 'longues' },
  'gros':    { ms: 'gros',    fs: 'grosse',   mp: 'gros',     fp: 'grosses' },
  'faux':    { ms: 'faux',    fs: 'fausse',   mp: 'faux',     fp: 'fausses' },
  'doux':    { ms: 'doux',    fs: 'douce',    mp: 'doux',     fp: 'douces' },
  'mort':    { ms: 'mort',    fs: 'morte',    mp: 'morts',    fp: 'mortes' },
  'ouvert':  { ms: 'ouvert',  fs: 'ouverte',  mp: 'ouverts',  fp: 'ouvertes' },
  'actif':   { ms: 'actif',   fs: 'active',   mp: 'actifs',   fp: 'actives' },
  'neuf':    { ms: 'neuf',    fs: 'neuve',    mp: 'neufs',    fp: 'neuves' },
  'fermé':   { ms: 'fermé',   fs: 'fermée',   mp: 'fermés',   fp: 'fermées' },
  'cassé':   { ms: 'cassé',   fs: 'cassée',   mp: 'cassés',   fp: 'cassées' },
  'brisé':   { ms: 'brisé',   fs: 'brisée',   mp: 'brisés',   fp: 'brisées' },
  'endommagé': { ms: 'endommagé', fs: 'endommagée', mp: 'endommagés', fp: 'endommagées' },
  'détruit': { ms: 'détruit', fs: 'détruite', mp: 'détruits', fp: 'détruites' },
  'rouillé': { ms: 'rouillé', fs: 'rouillée', mp: 'rouillés', fp: 'rouillées' },
  'tordu':   { ms: 'tordu',   fs: 'tordue',   mp: 'tordus',   fp: 'tordues' },
  // -eu exception: "bleu" takes -s not -x in plural
  'bleu':    { ms: 'bleu',    fs: 'bleue',    mp: 'bleus',    fp: 'bleues' },
};

/** Common French words with aspirated h (no elision: "le hasard", NOT "l'hasard") */
const ASPIRATED_H_WORDS = new Set([
  'hasard', 'haut', 'haute', 'hauts', 'hautes', 'hauteur',
  'honte', 'hors', 'hurler', 'hibou', 'haricot', 'haricots',
  'héros', 'hache', 'haches', 'hamac', 'hamacs', 'hangar', 'hangars',
  'harpon', 'harpons', 'haine', 'hameau', 'hameaux', 'harpe',
  'haie', 'haies', 'hall', 'halls', 'halte', 'hamster',
  'handicap', 'harem', 'hareng', 'harengs', 'harnais',
  'hussard', 'hutte', 'huttes', 'hublot', 'hublots',
]);

function genderPluralKey(info: GrammaticalInfo): string {
  const g = info.gender === 'F' ? 'f' : 'm';
  const n = info.plural ? 'p' : 's';
  return `${g}${n}`;
}

/** French article/contraction/agreement engine */
export class FrenchGrammar implements GrammarEngine {
  readonly locale = 'fr';

  article(
    type: 'definite' | 'indefinite' | 'partitive',
    info: GrammaticalInfo,
  ): string {
    if (type === 'definite') {
      if (info.plural) return 'les';
      if (info.startsWithVowel) return "l'";
      return info.gender === 'M' ? 'le' : 'la';
    }
    if (type === 'indefinite') {
      if (info.plural) return 'des';
      return info.gender === 'M' ? 'un' : 'une';
    }
    // partitive
    if (info.plural) return 'des';
    if (info.startsWithVowel) return "de l'";
    return info.gender === 'M' ? 'du' : 'de la';
  }

  contract(preposition: string, article: string): string {
    // Mandatory contractions in French
    if (preposition === 'de' && article === 'le') return 'du';
    if (preposition === 'de' && article === 'les') return 'des';
    if (preposition === 'à' && article === 'le') return 'au';
    if (preposition === 'à' && article === 'les') return 'aux';
    // No contraction with la, l', un, une, des
    if (article === "l'") return `${preposition} l'`;
    return `${preposition} ${article}`;
  }

  agree(adjective: string, info: GrammaticalInfo): string {
    // Check irregular table first
    const key = genderPluralKey(info);
    const irregular = IRREGULAR_ADJECTIVES[adjective];
    if (irregular?.[key]) return irregular[key];

    // Regular agreement rules
    let result = adjective;

    // Feminine: add -e (unless already ends in -e)
    if (info.gender === 'F' && !result.endsWith('e')) {
      // Special suffix patterns
      if (result.endsWith('er')) {
        result = result.slice(0, -2) + 'ère';
      } else if (result.endsWith('eux')) {
        result = result.slice(0, -3) + 'euse';
      } else if (result.endsWith('if')) {
        result = result.slice(0, -2) + 'ive';
      } else if (result.endsWith('el')) {
        result = result + 'le';
      } else {
        result = result + 'e';
      }
    }

    // Plural: add -s (unless already ends in -s, -x, -z)
    if (info.plural && !/[sxz]$/.test(result)) {
      if (result.endsWith('au') || result.endsWith('eu')) {
        result = result + 'x';
      } else {
        result = result + 's';
      }
    }

    return result;
  }

  resolveSlot(modifier: SlotModifier, noun: string, info: GrammaticalInfo): string {
    switch (modifier) {
      case 'bare':
        return noun;
      case 'def': {
        const art = this.article('definite', info);
        return info.startsWithVowel && !info.plural ? `${art}${noun}` : `${art} ${noun}`;
      }
      case 'indef':
        return `${this.article('indefinite', info)} ${noun}`;
      case 'partitive': {
        const part = this.article('partitive', info);
        return info.startsWithVowel && !info.plural ? `${part}${noun}` : `${part} ${noun}`;
      }
      case 'de': {
        const defArt = this.article('definite', info);
        const contracted = this.contract('de', defArt);
        // Handle l' case: "de l'écran" not "de l' écran"
        if (info.startsWithVowel && !info.plural) {
          return `${contracted}${noun}`;
        }
        return `${contracted} ${noun}`;
      }
      case 'a': {
        const defArt = this.article('definite', info);
        const contracted = this.contract('à', defArt);
        if (info.startsWithVowel && !info.plural) {
          return `${contracted}${noun}`;
        }
        return `${contracted} ${noun}`;
      }
    }
  }

  postProcess(text: string): string {
    return text
      // Mandatory contractions: "de le" → "du", "de les" → "des", "à le" → "au", "à les" → "aux"
      .replace(/\bde le\b/gi, 'du')
      .replace(/\bde les\b/gi, 'des')
      .replace(/\bà le\b/gi, 'au')
      .replace(/\bà les\b/gi, 'aux')
      // Elision: "le arbre" → "l'arbre" (catch any missed by slot resolution)
      // Note: 'h' excluded — aspirated-h handled by startsWithVowel flag in slot resolution
      .replace(/\b(le|la|de|ne|se|je|me|te|que) ([aeéèêëiîïoôuûüy])/gi,
        (_, word: string, vowel: string) => `${word.slice(0, -1)}'${vowel}`)
      // Elision for mute-h words (not in aspirated-h list)
      .replace(/\b(le|la|de|ne|se|je|me|te|que) (h\w*)/gi,
        (match, word: string, hWord: string) => {
          const bare = hWord.toLowerCase().split(/\s/)[0] ?? '';
          if (ASPIRATED_H_WORDS.has(bare)) return match; // Keep "le hasard"
          return `${word.slice(0, -1)}'${hWord}`; // Elide "l'homme"
        })
      // French typography: non-breaking space before ; : ! ?
      .replace(/ ?([;:!?])/g, '\u00A0$1')
      // Clean up double spaces
      .replace(/ {2,}/g, ' ')
      // Clean up space after l' or d'
      .replace(/([ld]') /gi, '$1')
      .trim();
  }
}

/** Singleton French grammar engine */
export const frenchGrammar = new FrenchGrammar();
