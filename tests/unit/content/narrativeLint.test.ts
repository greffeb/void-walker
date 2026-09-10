// ---------------------------------------------------------------------------
// tests/unit/content/narrativeLint.test.ts — Readability budgets, at zero
// ---------------------------------------------------------------------------
// Each rule has a budget, used as a ratchet (the idiom of the stress files):
// a count that only ever goes down is the difference between "we cleaned the
// text once" and "the text stays clean". Lowering a budget is progress;
// raising one needs a reason written next to it.
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

/** Every rule holds at zero, since 2026-09-10. A budget above 0 needs a reason. */
const BUDGETS: Readonly<Record<RuleId, number>> = {
  R1_nom_redit:           0,
  R2_desc_trop_longue:    0,
  R3_etat_muet:           0,
  R4_noeud_titre:         0,
  R5_noeud_inventaire:    0,
  R6_coaching:            0,
  R7_etat_inatteignable:  0,
  R8_flag_sans_etat:      0,
  R9_sans_nom_fr:         0,
  R10_ponctuation:        0,
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

describe('R10 tells an ellipsis from a doubled terminator', () => {
  // The rule exists for "Des passages sont raturés avec insistance.." — a period
  // glued onto a sentence that already had one. An ellipsis is deliberate prose.
  const lintOne = (fr: string): number => lintNarrative(
    [],
    [{
      id: 'm', type: 'blocked_passage', validSegments: [], tensionRange: [1, 2],
      compatibility: { universal: true }, skins: [],
      locations: [{
        id: 'l', role: 'passage', onCriticalPath: true, items: [],
        features: [{
          id: 'door', initialState: 'locked',
          descriptions: { locked: { fr, en: '' }, open: { fr: 'ouverte', en: '' } },
        }],
      }],
    }] as unknown as Parameters<typeof lintNarrative>[1],
    [],
  ).filter(f => f.rule === 'R10_ponctuation').length;

  it('accepts an ellipsis', () => {
    expect(lintOne('Si la créature est là quand vous tirez... tout part dans le vide.')).toBe(0);
  });

  it('rejects a period glued onto a finished sentence', () => {
    expect(lintOne('Des passages sont raturés avec insistance..')).toBe(1);
  });

  it('rejects a period followed by a comma', () => {
    expect(lintOne('Le verrou est actif., un voyant le confirme')).toBe(1);
  });
});
