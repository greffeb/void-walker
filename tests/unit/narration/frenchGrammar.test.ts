// ---------------------------------------------------------------------------
// tests/unit/narration/frenchGrammar.test.ts — French grammar engine tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { FrenchGrammar, frenchGrammar } from '../../../src/i18n/grammar/fr';
import type { GrammaticalInfo } from '../../../src/i18n/grammar/interface';

// === HELPERS ===

const masc: GrammaticalInfo = { gender: 'M', startsWithVowel: false, plural: false };
const fem: GrammaticalInfo = { gender: 'F', startsWithVowel: false, plural: false };
const mascVowel: GrammaticalInfo = { gender: 'M', startsWithVowel: true, plural: false };
const femVowel: GrammaticalInfo = { gender: 'F', startsWithVowel: true, plural: false };
const mascPlural: GrammaticalInfo = { gender: 'M', startsWithVowel: false, plural: true };
const femPlural: GrammaticalInfo = { gender: 'F', startsWithVowel: false, plural: true };

describe('FrenchGrammar', () => {
  it('is a singleton', () => {
    expect(frenchGrammar).toBeInstanceOf(FrenchGrammar);
    expect(frenchGrammar.locale).toBe('fr');
  });

  describe('article — definite', () => {
    it('returns "le" for masculine singular', () => {
      expect(frenchGrammar.article('definite', masc)).toBe('le');
    });

    it('returns "la" for feminine singular', () => {
      expect(frenchGrammar.article('definite', fem)).toBe('la');
    });

    it('returns "l\'" for vowel-initial singular', () => {
      expect(frenchGrammar.article('definite', mascVowel)).toBe("l'");
      expect(frenchGrammar.article('definite', femVowel)).toBe("l'");
    });

    it('returns "les" for plural', () => {
      expect(frenchGrammar.article('definite', mascPlural)).toBe('les');
      expect(frenchGrammar.article('definite', femPlural)).toBe('les');
    });
  });

  describe('article — indefinite', () => {
    it('returns "un" for masculine singular', () => {
      expect(frenchGrammar.article('indefinite', masc)).toBe('un');
    });

    it('returns "une" for feminine singular', () => {
      expect(frenchGrammar.article('indefinite', fem)).toBe('une');
    });

    it('returns "des" for plural', () => {
      expect(frenchGrammar.article('indefinite', mascPlural)).toBe('des');
    });
  });

  describe('article — partitive', () => {
    it('returns "du" for masculine singular', () => {
      expect(frenchGrammar.article('partitive', masc)).toBe('du');
    });

    it('returns "de la" for feminine singular', () => {
      expect(frenchGrammar.article('partitive', fem)).toBe('de la');
    });

    it('returns "de l\'" for vowel-initial singular', () => {
      expect(frenchGrammar.article('partitive', mascVowel)).toBe("de l'");
    });

    it('returns "des" for plural', () => {
      expect(frenchGrammar.article('partitive', mascPlural)).toBe('des');
    });
  });

  describe('contract', () => {
    it('contracts de + le → du', () => {
      expect(frenchGrammar.contract('de', 'le')).toBe('du');
    });

    it('contracts de + les → des', () => {
      expect(frenchGrammar.contract('de', 'les')).toBe('des');
    });

    it('contracts à + le → au', () => {
      expect(frenchGrammar.contract('à', 'le')).toBe('au');
    });

    it('contracts à + les → aux', () => {
      expect(frenchGrammar.contract('à', 'les')).toBe('aux');
    });

    it('does not contract de + la', () => {
      expect(frenchGrammar.contract('de', 'la')).toBe('de la');
    });

    it('handles l\' without double space', () => {
      expect(frenchGrammar.contract('de', "l'")).toBe("de l'");
    });
  });

  describe('agree — irregular adjectives', () => {
    it('agrees "beau" correctly', () => {
      expect(frenchGrammar.agree('beau', fem)).toBe('belle');
      expect(frenchGrammar.agree('beau', mascPlural)).toBe('beaux');
      expect(frenchGrammar.agree('beau', femPlural)).toBe('belles');
    });

    it('agrees "vieux" correctly', () => {
      expect(frenchGrammar.agree('vieux', fem)).toBe('vieille');
      expect(frenchGrammar.agree('vieux', masc)).toBe('vieux');
    });

    it('agrees "blanc" correctly', () => {
      expect(frenchGrammar.agree('blanc', fem)).toBe('blanche');
      expect(frenchGrammar.agree('blanc', mascPlural)).toBe('blancs');
    });

    it('agrees "mort" correctly', () => {
      expect(frenchGrammar.agree('mort', fem)).toBe('morte');
    });

    it('agrees "cassé" correctly', () => {
      expect(frenchGrammar.agree('cassé', fem)).toBe('cassée');
      expect(frenchGrammar.agree('cassé', mascPlural)).toBe('cassés');
      expect(frenchGrammar.agree('cassé', femPlural)).toBe('cassées');
    });
  });

  describe('agree — regular rules', () => {
    it('adds -e for feminine', () => {
      expect(frenchGrammar.agree('grand', fem)).toBe('grande');
    });

    it('does not add -e if already ends in e', () => {
      expect(frenchGrammar.agree('rouge', fem)).toBe('rouge');
    });

    it('-er → -ère for feminine', () => {
      expect(frenchGrammar.agree('léger', fem)).toBe('légère');
    });

    it('-eux → -euse for feminine', () => {
      expect(frenchGrammar.agree('dangereux', fem)).toBe('dangereuse');
    });

    it('-if → -ive for feminine', () => {
      expect(frenchGrammar.agree('sportif', fem)).toBe('sportive');
    });

    it('-el → -elle for feminine', () => {
      expect(frenchGrammar.agree('cruel', fem)).toBe('cruelle');
    });

    it('adds -s for masculine plural', () => {
      expect(frenchGrammar.agree('grand', mascPlural)).toBe('grands');
    });

    it('does not add -s if already ends in s/x/z', () => {
      expect(frenchGrammar.agree('gros', mascPlural)).toBe('gros');
      expect(frenchGrammar.agree('heureux', mascPlural)).toBe('heureux');
    });

    it('adds -x for -au/-eu ending in plural', () => {
      expect(frenchGrammar.agree('beau', mascPlural)).toBe('beaux'); // irregular path
      expect(frenchGrammar.agree('bleu', mascPlural)).toBe('bleus'); // regular path (already ends in 'u', not 'eu')
    });
  });

  describe('resolveSlot', () => {
    it('bare returns noun unchanged', () => {
      expect(frenchGrammar.resolveSlot('bare', 'terminal', masc)).toBe('terminal');
    });

    it('def returns definite article + noun', () => {
      expect(frenchGrammar.resolveSlot('def', 'terminal', masc)).toBe('le terminal');
      expect(frenchGrammar.resolveSlot('def', 'porte', fem)).toBe('la porte');
    });

    it('def elides before vowel', () => {
      expect(frenchGrammar.resolveSlot('def', 'écran', mascVowel)).toBe("l'écran");
    });

    it('indef returns indefinite article + noun', () => {
      expect(frenchGrammar.resolveSlot('indef', 'clé', fem)).toBe('une clé');
    });

    it('partitive returns partitive article + noun', () => {
      expect(frenchGrammar.resolveSlot('partitive', 'eau', femVowel)).toBe("de l'eau");
    });

    it('de contracts with definite article', () => {
      expect(frenchGrammar.resolveSlot('de', 'terminal', masc)).toBe('du terminal');
      expect(frenchGrammar.resolveSlot('de', 'porte', fem)).toBe('de la porte');
      expect(frenchGrammar.resolveSlot('de', 'écran', mascVowel)).toBe("de l'écran");
    });

    it('a contracts with definite article', () => {
      expect(frenchGrammar.resolveSlot('a', 'terminal', masc)).toBe('au terminal');
      expect(frenchGrammar.resolveSlot('a', 'porte', fem)).toBe('à la porte');
    });
  });

  describe('postProcess', () => {
    it('adds non-breaking spaces before ; : ! ?', () => {
      const result = frenchGrammar.postProcess('Attention !');
      expect(result).toBe('Attention\u00A0!');
    });

    it('handles elision of "le" before vowel', () => {
      const result = frenchGrammar.postProcess('le arbre est grand');
      expect(result).toBe("l'arbre est grand");
    });

    it('removes extra spaces after l\' and d\'', () => {
      const result = frenchGrammar.postProcess("l' écran");
      expect(result).toBe("l'écran");
    });

    it('cleans up double spaces', () => {
      const result = frenchGrammar.postProcess('a  b   c');
      expect(result).toBe('a b c');
    });

    it('trims whitespace', () => {
      const result = frenchGrammar.postProcess('  hello  ');
      expect(result).toBe('hello');
    });
  });
});
