// ---------------------------------------------------------------------------
// tests/unit/narration/reexamination.test.ts — Looking again (lot 8)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { selectReexaminationText, OBSERVING_VERBS } from '../../../src/narration/reexamination';
import { REEXAMINATION_SNIPPETS } from '../../../src/content/templates/reexamination';
import { NarrationMemory } from '../../../src/narration/memory';
import { NPC_REACTION_SNIPPETS } from '../../../src/content/templates/npcReactions';

describe('re-examination', () => {
  it('covers the verbs that describe rather than change', () => {
    for (const verb of ['EXAMINE', 'SCAN', 'LISTEN', 'SMELL', 'READ'] as const) {
      expect(OBSERVING_VERBS.has(verb)).toBe(true);
    }
    expect(OBSERVING_VERBS.has('STRIKE')).toBe(false);
  });

  it('says something different on the second, third and fifth look', () => {
    const memory = new NarrationMemory();
    const second = selectReexaminationText('EXAMINE', 1, 'fr', memory);
    const third = selectReexaminationText('EXAMINE', 2, 'fr', memory);
    const insistent = selectReexaminationText('EXAMINE', 5, 'fr', memory);
    expect(new Set([second, third, insistent]).size).toBe(3);
  });

  it('does not repeat itself across a run of looks', () => {
    // The bridge used to answer every repeat with one fixed sentence, which
    // made it the most repeated text in the game.
    const memory = new NarrationMemory();
    const seen = new Set<string>();
    for (let look = 1; look <= 6; look++) {
      seen.add(selectReexaminationText('EXAMINE', look, 'fr', memory));
    }
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  it('keeps the wording within the right sense', () => {
    const memory = new NarrationMemory();
    const texts = new Set<string>();
    for (let i = 0; i < 20; i++) texts.add(selectReexaminationText('LISTEN', 1, 'fr', memory));
    // A "sight" line would be nonsense for LISTEN.
    const sightOnly = REEXAMINATION_SNIPPETS.filter(s => s.sense === 'sight').map(s => s.text.fr);
    for (const wrong of sightOnly) expect(texts.has(wrong)).toBe(false);
  });

  it('every tier has something written for it', () => {
    for (const tier of ['second', 'third', 'insistent'] as const) {
      expect(REEXAMINATION_SNIPPETS.filter(s => s.tier === tier).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every snippet is translated, not left empty', () => {
    for (const snippet of REEXAMINATION_SNIPPETS) {
      expect(snippet.text.fr.length).toBeGreaterThan(0);
      expect(snippet.text.en.length).toBeGreaterThan(0);
    }
  });
});

describe('npc reactions — no cell left with a single wording', () => {
  it('every disposition x outcome pair has at least two variants', () => {
    const counts = new Map<string, number>();
    for (const snippet of NPC_REACTION_SNIPPETS) {
      const key = `${snippet.disposition}:${snippet.outcome}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const thin = [...counts.entries()].filter(([, n]) => n < 2).map(([k]) => k);
    expect(thin).toEqual([]);
  });

  it('auto_success has the most variants — it closes the paragraph (decision X)', () => {
    const autoSuccess = NPC_REACTION_SNIPPETS.filter(s => s.outcome === 'auto_success');
    expect(autoSuccess.length).toBeGreaterThanOrEqual(12);
  });
});
