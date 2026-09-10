// ---------------------------------------------------------------------------
// tests/unit/content/narrativeLint.test.ts — Readability budgets, at zero
// ---------------------------------------------------------------------------
// Each rule has a budget, used as a ratchet (the idiom of the stress files):
// a count that only ever goes down is the difference between "we cleaned the
// text once" and "the text stays clean". Lowering a budget is progress;
// raising one needs a reason written next to it.
//
// Target for every rule is 0. The values below are where each rule stands.
//
// Report: `npx tsx scripts/narrative-lint.ts --detail`
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { resetLocale } from '../../../src/i18n/index';
import { LAUNCH_SKELETONS } from '../../../src/content/scenarios/index';
import { ALL_MODULES } from '../../../src/content/scenarios/modules/index';
import { ALL_MICRO_MODULES } from '../../../src/content/microModules/index';
import { lintNarrative, countByRule, normalise, shingleOverlap } from '../../../src/content/audit/narrativeLint';
import type { RuleId } from '../../../src/content/audit/narrativeLint';

/** Ratchet. Target is 0 everywhere; these are the counts still outstanding. */
const BUDGETS: Readonly<Record<RuleId, number>> = {
  R1_nom_redit:          56,
  R2_desc_trop_longue:   30,
  R3_etat_muet:           0,
  R4_noeud_titre:         0,  // atteint 2026-09-10 : 18 proses de lieu réécrites
  R5_noeud_inventaire:    0,  // atteint 2026-09-10 : l'énumération ne se dit plus deux fois
  R6_coaching:            0,  // atteint 2026-09-10
  R7_etat_inatteignable:  0,  // atteint 2026-09-10 : BREAK casse au lieu d'ouvrir, tokens d'état en liste
  R8_flag_sans_etat:      0,  // atteint 2026-09-10 : 12 états manquants posés, 11 exceptions motivées
  R9_sans_nom_fr:         0,  // atteint 2026-09-10 : 51 noms FR/EN ajoutés
  R10_ponctuation:        2,
};

describe('narrative readability lint', () => {
  beforeEach(() => { resetLocale(); });

  const findings = lintNarrative(LAUNCH_SKELETONS, ALL_MODULES, ALL_MICRO_MODULES);
  const counts = countByRule(findings);

  for (const [rule, budget] of Object.entries(BUDGETS) as [RuleId, number][]) {
    it(`${rule} stays within ${budget}`, () => {
      const actual = counts[rule] ?? 0;
      const offenders = findings
        .filter(f => f.rule === rule)
        .slice(0, 10)
        .map(f => `${f.where}/${f.entity}: ${f.detail}`)
        .join('\n');
      expect(actual, `${actual} > ${budget}\n${offenders}`).toBeLessThanOrEqual(budget);
    });
  }
});

describe('lint helpers', () => {
  it('normalise strips accents, case and punctuation', () => {
    expect(normalise("L'ÉCRAN rouge-sang !")).toBe('l ecran rouge sang');
  });

  it('shingleOverlap sees identical text', () => {
    const s = 'le terminal affiche une erreur de confinement du reacteur principal';
    expect(shingleOverlap(s, s)).toBe(1);
  });

  it('shingleOverlap sees unrelated text', () => {
    expect(shingleOverlap(
      'le terminal affiche une erreur de confinement',
      'la porte blindee resiste a vos coups repetes',
    )).toBe(0);
  });

  it('shingleOverlap ignores text too short to shingle', () => {
    expect(shingleOverlap('trop court', 'trop court')).toBe(0);
  });
});
