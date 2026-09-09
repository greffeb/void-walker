// ---------------------------------------------------------------------------
// scripts/severity-matrix.ts — Decision F: review the 78 verbs × 5 natures grid
// ---------------------------------------------------------------------------
// Prints, for every verb, the severity a bare archetype of each nature would
// get. Run once, read it, then freeze the verdict in a regression test.
//   npx tsx scripts/severity-matrix.ts
// ---------------------------------------------------------------------------

import { VERB_IDS } from '../src/engine/verbs';
import { checkCompatibility } from '../src/engine/compatibility';
import { NATURES } from '../src/engine/nature';
import type { Nature } from '../src/engine/nature';
import { resolveProperties } from '../src/engine/properties';
import type { PropertyId } from '../src/engine/properties';

// A representative bare target for each nature, built from real archetypes.
const ARCHETYPE: Readonly<Record<Nature, readonly PropertyId[]>> = {
  inert: resolveProperties({ objectCategory: 'item', baseType: 'misc' }),
  machine: resolveProperties({ objectCategory: 'environment', baseType: 'door' }),
  organic: resolveProperties({ objectCategory: 'npc', baseType: 'creature' }),
  data: resolveProperties({ objectCategory: 'item', baseType: 'data' }),
  space: resolveProperties({ objectCategory: 'environment', baseType: 'vent' }),
};

const MARK = { compatible: ' ok ', unsuited: ' ~~ ', absurd: ' XX ' } as const;

const counts: Record<string, number> = { compatible: 0, unsuited: 0, absurd: 0 };

console.log(`verb            ${NATURES.map(n => n.padEnd(4).slice(0, 4)).join('|')}`);
console.log('-'.repeat(16 + NATURES.length * 5));

for (const verb of VERB_IDS) {
  const cells = NATURES.map(nature => {
    const result = checkCompatibility({
      verbId: verb,
      targetProps: ARCHETYPE[nature],
      playerToolProps: [],
    });
    counts[result.severity] = (counts[result.severity] ?? 0) + 1;
    return MARK[result.severity];
  });
  console.log(`${verb.padEnd(16)}${cells.join('|')}`);
}

console.log('-'.repeat(16 + NATURES.length * 5));
const total = VERB_IDS.length * NATURES.length;
for (const [severity, count] of Object.entries(counts)) {
  console.log(`${severity.padEnd(12)} ${String(count).padStart(4)}  ${(100 * count / total).toFixed(1)}%`);
}

// Emit the frozen table for the regression test.
console.log('\n--- paste into tests/unit/engine/severityMatrix.test.ts ---\n');
for (const verb of VERB_IDS) {
  const row = NATURES.map(nature => checkCompatibility({
    verbId: verb,
    targetProps: ARCHETYPE[nature],
    playerToolProps: [],
  }).severity[0]).join('');
  console.log(`  ${verb}: '${row}',`);
}
