// ---------------------------------------------------------------------------
// tests/unit/engine/snowball-fr.test.ts — French Snowball stemmer tests
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { stemFr } from '../../../src/engine/snowball-fr';

describe('stemFr()', () => {
  test('returns empty string for empty input', () => {
    expect(stemFr('')).toBe('');
  });

  test('returns single char as-is', () => {
    // stemFr does NOT lowercase — the parser normalizes before stemming
    expect(stemFr('a')).toBe('a');
  });

  test('stems common French verb infinitives', () => {
    // The exact stems don't matter for matching — what matters is that
    // conjugated forms of the same verb produce the SAME stem.
    const frapper1 = stemFr('frapper');
    const frapper2 = stemFr('frappe');
    const frapper3 = stemFr('frappez');
    // All should produce the same stem
    expect(frapper1).toBe(frapper2);
    expect(frapper2).toBe(frapper3);
  });

  test('stems "examiner" conjugations to similar roots', () => {
    const base = stemFr('examiner');
    const conj = stemFr('examine');
    // Base and simple conjugation should match
    expect(base).toBe(conj);
    // All forms should be non-empty strings
    const stems = ['examiner', 'examine', 'examinez', 'examinons'].map(stemFr);
    for (const s of stems) {
      expect(s.length).toBeGreaterThan(0);
      // All should share a common prefix
      expect(s.startsWith('examin')).toBe(true);
    }
  });

  test('stems "ouvrir" conjugations consistently', () => {
    const stems = ['ouvrir', 'ouvre', 'ouvrez'].map(stemFr);
    const unique = new Set(stems);
    expect(unique.size).toBe(1);
  });

  test('different verbs produce different stems', () => {
    expect(stemFr('frapper')).not.toBe(stemFr('examiner'));
    expect(stemFr('ouvrir')).not.toBe(stemFr('fermer'));
    expect(stemFr('courir')).not.toBe(stemFr('nager'));
  });

  test('handles accented characters', () => {
    // Should produce a result without throwing
    const result = stemFr('détruire');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('is deterministic', () => {
    const word = 'attaquer';
    expect(stemFr(word)).toBe(stemFr(word));
    expect(stemFr(word)).toBe(stemFr(word));
  });

  test('short words are returned as-is or minimally processed', () => {
    const result = stemFr('le');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('never throws on arbitrary strings', () => {
    const inputs = [
      'abcdefghijklmnopqrstuvwxyz',
      '123',
      'αβγ',
      'a',
      'aa',
      'aaa',
      '   ',
      'hello-world',
      'l\'ennemi',
    ];
    for (const input of inputs) {
      expect(() => stemFr(input)).not.toThrow();
    }
  });

  test('stems produce reasonable-length outputs', () => {
    const words = ['frapper', 'examiner', 'attaquer', 'communiquer', 'désassembler'];
    for (const word of words) {
      const stem = stemFr(word);
      expect(stem.length).toBeGreaterThan(0);
      expect(stem.length).toBeLessThanOrEqual(word.length);
    }
  });
});
