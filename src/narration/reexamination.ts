// ---------------------------------------------------------------------------
// src/narration/reexamination.ts — Looking at the same thing again
// ---------------------------------------------------------------------------

import type { VerbId } from '../engine/verbs';
import type { Locale } from '../i18n/types';
import type { ReexaminationSnippet, ReexaminationTier } from '../content/templates/reexamination';
import { REEXAMINATION_SNIPPETS } from '../content/templates/reexamination';
import type { NarrationMemory } from './memory';

/** Verbs that describe rather than change, and can therefore be repeated. */
export const OBSERVING_VERBS: ReadonlySet<VerbId> = new Set<VerbId>([
  'EXAMINE', 'SCAN', 'LISTEN', 'SMELL', 'READ',
]);

const SENSE_OF: Partial<Record<VerbId, ReexaminationSnippet['sense']>> = {
  EXAMINE: 'sight',
  SCAN: 'sight',
  LISTEN: 'sound',
  SMELL: 'smell',
  READ: 'read',
};

function tierFor(previousLooks: number): ReexaminationTier {
  if (previousLooks <= 1) return 'second';
  if (previousLooks === 2) return 'third';
  return 'insistent';
}

/**
 * What the player is told when they look at the same thing again.
 *
 * @param previousLooks - How many times this pair was already narrated (≥ 1).
 */
export function selectReexaminationText(
  verb: VerbId,
  previousLooks: number,
  locale: Locale,
  memory: NarrationMemory,
): string {
  const tier = tierFor(previousLooks);
  const sense = SENSE_OF[verb];
  const pool = REEXAMINATION_SNIPPETS.filter(
    s => s.tier === tier && (s.sense === undefined || s.sense === sense),
  );
  const chosen = memory.select(pool, `reexamination_${tier}`) ?? pool[0];
  if (!chosen) return REEXAMINATION_SNIPPETS[0]!.text.fr;
  return locale === 'fr' ? chosen.text.fr : (chosen.text.en || chosen.text.fr);
}
