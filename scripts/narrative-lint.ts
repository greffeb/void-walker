#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// scripts/narrative-lint.ts — Counts readability defects in scenario text
// ---------------------------------------------------------------------------
// Usage:
//   npx tsx scripts/narrative-lint.ts            # summary per rule
//   npx tsx scripts/narrative-lint.ts --detail   # every finding
//   npx tsx scripts/narrative-lint.ts --rule R7  # one rule, in detail
// ---------------------------------------------------------------------------

import { LAUNCH_SKELETONS } from '../src/content/scenarios/index';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { ALL_MICRO_MODULES } from '../src/content/microModules/index';
import { lintNarrative, countByRule } from '../src/content/audit/narrativeLint';
import type { Finding, RuleId } from '../src/content/audit/narrativeLint';

const RULE_LABELS: Readonly<Record<RuleId, string>> = {
  R1_nom_redit:           'la description redit le nom de l\'élément',
  R2_desc_trop_longue:    'description d\'état trop longue',
  R3_etat_muet:           'deux états disent la même chose',
  R4_noeud_titre:         'la prose du lieu commence par son titre',
  R5_noeud_inventaire:    'la prose du lieu énumère son contenu',
  R6_coaching:            'le texte dit au joueur quoi faire',
  R7_etat_inatteignable:  'description d\'état jamais affichable',
  R8_flag_sans_etat:      'flagSet sans newState (l\'objet ne change pas d\'air)',
  R9_sans_nom_fr:         'aucun nom français',
  R10_ponctuation:        'ponctuation doublée',
};

const args = process.argv.slice(2);
const detail = args.includes('--detail');
const ruleArg = args.find(a => a.startsWith('--rule'))?.split('=')[1]
  ?? (args.includes('--rule') ? args[args.indexOf('--rule') + 1] : undefined);

const findings = lintNarrative(LAUNCH_SKELETONS, ALL_MODULES, ALL_MICRO_MODULES);
const counts = countByRule(findings);

const ruleIds = Object.keys(RULE_LABELS) as RuleId[];

console.log('');
console.log('règle                    n   défaut');
console.log('─────────────────────── ───  ─────────────────────────────────────────────');
let total = 0;
for (const rule of ruleIds) {
  const n = counts[rule] ?? 0;
  total += n;
  const mark = n === 0 ? ' ' : '!';
  console.log(`${mark} ${rule.padEnd(22)}${String(n).padStart(3)}  ${RULE_LABELS[rule]}`);
}
console.log('─────────────────────── ───');
console.log(`  ${'TOTAL'.padEnd(22)}${String(total).padStart(3)}`);
console.log('');

function show(list: readonly Finding[]): void {
  const byWhere = new Map<string, Finding[]>();
  for (const f of list) {
    const arr = byWhere.get(f.where) ?? [];
    arr.push(f);
    byWhere.set(f.where, arr);
  }
  for (const [where, arr] of [...byWhere.entries()].sort()) {
    console.log(`── ${where} (${arr.length})`);
    for (const f of arr) console.log(`   ${f.rule.padEnd(22)} ${f.entity.padEnd(42)} ${f.detail}`);
    console.log('');
  }
}

if (ruleArg) {
  const wanted = findings.filter(f => f.rule.startsWith(ruleArg));
  console.log(`--- ${wanted.length} occurrence(s) pour ${ruleArg} ---\n`);
  show(wanted);
} else if (detail) {
  show(findings);
} else if (total > 0) {
  console.log('`--detail` pour tout voir, `--rule R7` pour une règle.');
}

process.exitCode = total === 0 ? 0 : 1;
