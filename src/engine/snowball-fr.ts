// ---------------------------------------------------------------------------
// src/engine/snowball-fr.ts — French Snowball stemmer (bundled, ~2KB minified)
// ---------------------------------------------------------------------------
// Faithful TypeScript port of the Snowball French stemming algorithm.
// Reference: https://snowballstem.org/algorithms/french/stemmer.html
// License: BSD (Snowball project)
// ---------------------------------------------------------------------------

/** French vowels */
const VOWELS = new Set('aeiouyâàëéêèïîôûù');

function isVowel(ch: string): boolean {
  return VOWELS.has(ch);
}

/** Safe character access — returns empty string for out-of-bounds */
function at(word: string, i: number): string {
  return i >= 0 && i < word.length ? word.charAt(i) : '';
}

/**
 * Compute RV, R1, R2 regions for a French word.
 */
function computeRegions(word: string): { rv: number; r1: number; r2: number } {
  const len = word.length;

  let rv = len;
  if (len >= 2) {
    if (isVowel(at(word, 0)) && isVowel(at(word, 1))) {
      rv = 3;
    } else if (word.startsWith('par') || word.startsWith('col') || word.startsWith('tap')) {
      rv = 3;
    } else {
      for (let i = 1; i < len; i++) {
        if (isVowel(at(word, i))) {
          rv = i + 1;
          break;
        }
      }
    }
  }

  let r1 = len;
  for (let i = 0; i < len - 1; i++) {
    if (isVowel(at(word, i)) && !isVowel(at(word, i + 1))) {
      r1 = i + 2;
      break;
    }
  }

  let r2 = len;
  for (let i = r1; i < len - 1; i++) {
    if (isVowel(at(word, i)) && !isVowel(at(word, i + 1))) {
      r2 = i + 2;
      break;
    }
  }

  return { rv, r1, r2 };
}

function endsWith(word: string, suffix: string, region: number): boolean {
  if (!word.endsWith(suffix)) return false;
  return word.length - suffix.length >= region;
}

function longestSuffix(word: string, suffixes: readonly string[], region: number): string | null {
  let best: string | null = null;
  for (const s of suffixes) {
    if (endsWith(word, s, region) && (best === null || s.length > best.length)) {
      best = s;
    }
  }
  return best;
}

const STEP1_ANCE = ['ances', 'iqUes', 'ismes', 'ables', 'istes', 'ance', 'iqUe', 'isme', 'able', 'iste', 'eux'] as const;
const STEP1_ATION = ['atrices', 'ateurs', 'ations', 'atrice', 'ateur', 'ation'] as const;
const STEP1_LOGIE = ['logies', 'logie'] as const;
const STEP1_USION = ['usions', 'utions', 'usion', 'ution'] as const;
const STEP1_ENCE = ['ences', 'ence'] as const;
const STEP1_EMENT = ['issements', 'issement', 'ements', 'ement'] as const;
const STEP1_ITE = ['ités', 'ité'] as const;
const STEP1_IF = ['ives', 'ifs', 'ive', 'if'] as const;
const STEP1_EUSE = ['euses', 'euse'] as const;

/**
 * Stem a French word using the Snowball algorithm.
 * Input should be lowercase. Returns the stemmed form.
 */
export function stemFr(input: string): string {
  if (input.length <= 2) return input;

  // Prelude: mark certain i/u/y as consonants
  let word = input.replace(/qu/g, 'qU');

  let result = '';
  for (let i = 0; i < word.length; i++) {
    const ch = at(word, i);
    const prev = at(word, i - 1);
    const next = at(word, i + 1);

    if (ch === 'u' && prev === 'q') {
      result += 'U';
    } else if ((ch === 'u' || ch === 'i') && isVowel(prev) && isVowel(next)) {
      result += ch.toUpperCase();
    } else if (ch === 'y' && (isVowel(prev) || isVowel(next))) {
      result += 'Y';
    } else {
      result += ch;
    }
  }
  word = result;

  const { rv, r1, r2 } = computeRegions(word);
  let changed = false;

  // === Step 1 ===
  const tryStep1 = (): boolean => {
    if (endsWith(word, 'amment', rv)) { word = word.slice(0, -6) + 'ant'; return true; }
    if (endsWith(word, 'emment', rv)) { word = word.slice(0, -6) + 'ent'; return true; }

    for (const s of ['ments', 'ment'] as const) {
      if (endsWith(word, s, rv)) {
        const before = word.length - s.length;
        if (before > 0 && before >= rv && isVowel(at(word, before - 1))) {
          word = word.slice(0, -s.length);
          return true;
        }
      }
    }

    let suffix = longestSuffix(word, STEP1_ANCE, r2);
    if (suffix) { word = word.slice(0, -suffix.length); return true; }

    suffix = longestSuffix(word, STEP1_ATION, r2);
    if (suffix) {
      word = word.slice(0, -suffix.length);
      if (endsWith(word, 'ic', r2)) { word = word.slice(0, -2); }
      else if (word.endsWith('ic')) { word = word.slice(0, -2) + 'iqU'; }
      return true;
    }

    suffix = longestSuffix(word, STEP1_LOGIE, r2);
    if (suffix) { word = word.slice(0, -suffix.length) + 'log'; return true; }

    suffix = longestSuffix(word, STEP1_USION, r2);
    if (suffix) { word = word.slice(0, -suffix.length) + 'u'; return true; }

    suffix = longestSuffix(word, STEP1_ENCE, r2);
    if (suffix) { word = word.slice(0, -suffix.length) + 'ent'; return true; }

    suffix = longestSuffix(word, STEP1_EMENT, r1);
    if (suffix) {
      word = word.slice(0, -suffix.length);
      if (word.endsWith('iv') && word.length - 2 >= r2) {
        word = word.slice(0, -2);
        if (word.endsWith('at') && word.length - 2 >= r2) { word = word.slice(0, -2); }
      } else if (word.endsWith('eus')) {
        if (word.length - 3 >= r2) { word = word.slice(0, -3); }
        else if (word.length - 3 >= r1) { word = word.slice(0, -1); }
      } else if (word.endsWith('abl') && word.length - 3 >= r2) { word = word.slice(0, -3); }
      else if (word.endsWith('iqU') && word.length - 3 >= r2) { word = word.slice(0, -3); }
      return true;
    }

    suffix = longestSuffix(word, STEP1_ITE, r2);
    if (suffix) {
      word = word.slice(0, -suffix.length);
      if (word.endsWith('abil') && word.length - 4 >= r2) { word = word.slice(0, -4); }
      else if (word.endsWith('ic')) {
        if (word.length - 2 >= r2) { word = word.slice(0, -2); }
        else { word = word.slice(0, -2) + 'iqU'; }
      } else if (word.endsWith('iv') && word.length - 2 >= r2) { word = word.slice(0, -2); }
      return true;
    }

    suffix = longestSuffix(word, STEP1_IF, r2);
    if (suffix) {
      word = word.slice(0, -suffix.length);
      if (word.endsWith('at') && word.length - 2 >= r2) {
        word = word.slice(0, -2);
        if (word.endsWith('ic')) {
          if (word.length - 2 >= r2) { word = word.slice(0, -2); }
          else { word = word.slice(0, -2) + 'iqU'; }
        }
      }
      return true;
    }

    if (endsWith(word, 'eaux', r1)) { word = word.slice(0, -4) + 'eau'; return true; }
    if (endsWith(word, 'aux', r1)) { word = word.slice(0, -3) + 'al'; return true; }

    suffix = longestSuffix(word, STEP1_EUSE, r2);
    if (suffix) { word = word.slice(0, -suffix.length); return true; }
    suffix = longestSuffix(word, STEP1_EUSE, r1);
    if (suffix) { word = word.slice(0, -suffix.length) + 'eux'; return true; }

    return false;
  };

  changed = tryStep1();

  // === Step 2a: Verb suffixes starting with i (in RV) ===
  if (!changed) {
    const step2a = [
      'issements', 'issantes', 'issaient', 'issament',
      'issement', 'issante', 'issants', 'issions',
      'issant', 'issait', 'issais', 'issent', 'issiez',
      'issons', 'isses', 'isse', 'îmes', 'îtes',
      'irent', 'irait', 'irais', 'irons', 'iront',
      'irez', 'iras', 'ira', 'ies', 'ie',
      'is', 'it', 'ir', 'i',
    ] as const;

    const suffix = longestSuffix(word, step2a, rv);
    if (suffix) {
      const before = word.length - suffix.length;
      if (before > 0 && !isVowel(at(word, before - 1))) {
        word = word.slice(0, -suffix.length);
        changed = true;
      }
    }
  }

  // === Step 2b: Other verb suffixes (in RV) ===
  if (!changed) {
    const step2b = [
      'eraIent', 'eraient', 'assions', 'assiez', 'assent', 'erions',
      'eriez', 'erons', 'eront', 'antes', 'asses', 'èrent',
      'erait', 'erais', 'aient', 'asse', 'ante', 'ants',
      'âmes', 'âtes', 'eras', 'erai', 'ions',
      'iez', 'ant', 'era', 'ées', 'ais', 'ait',
      'ée', 'er', 'es', 'ez', 'é', 'a',
    ] as const;

    const suffix = longestSuffix(word, step2b, rv);
    if (suffix) {
      word = word.slice(0, -suffix.length);
      changed = true;
      if (word.endsWith('e') && word.length - 1 >= rv) {
        word = word.slice(0, -1);
      }
    }
  }

  // === Step 3 ===
  if (word.endsWith('Y')) { word = word.slice(0, -1) + 'i'; }
  if (word.endsWith('ç')) { word = word.slice(0, -1) + 'c'; }

  // === Step 4: Residual suffix ===
  if (word.length >= 2) {
    const last = at(word, word.length - 1);
    const prev = at(word, word.length - 2);
    if (last === 's' && !'aiouès'.includes(prev)) {
      word = word.slice(0, -1);
    }
  }

  // === Step 5 ===
  if (endsWith(word, 'ion', rv) && word.length - 3 >= r2) {
    const ch = at(word, word.length - 4);
    if (ch === 's' || ch === 't') { word = word.slice(0, -3); }
  } else if (endsWith(word, 'ière', rv)) {
    word = word.slice(0, -4) + 'i';
  } else if (endsWith(word, 'ier', rv)) {
    word = word.slice(0, -3) + 'i';
  } else if (endsWith(word, 'e', rv)) {
    word = word.slice(0, -1);
  }

  // === Step 6: Un-double ===
  if (word.endsWith('enn') || word.endsWith('onn') || word.endsWith('ett') ||
      word.endsWith('ell') || word.endsWith('eill')) {
    word = word.slice(0, -1);
  }

  return word.toLowerCase();
}
