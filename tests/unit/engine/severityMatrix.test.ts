// ---------------------------------------------------------------------------
// tests/unit/engine/severityMatrix.test.ts — Decision F: the frozen grid
// ---------------------------------------------------------------------------
// The full 78 verbs x 5 natures severity grid, reviewed once and frozen here.
// Regenerate with: npx tsx scripts/severity-matrix.ts
// A diff in this table is a deliberate design change, never a side effect.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { VERB_IDS } from '../../../src/engine/verbs';
import type { VerbId } from '../../../src/engine/verbs';
import { checkCompatibility } from '../../../src/engine/compatibility';
import { NATURES } from '../../../src/engine/nature';
import type { Nature } from '../../../src/engine/nature';
import { resolveProperties } from '../../../src/engine/properties';
import type { PropertyId } from '../../../src/engine/properties';

/** A bare archetype for each nature, so every cell reads the same way. */
const ARCHETYPE: Readonly<Record<Nature, readonly PropertyId[]>> = {
  inert: resolveProperties({ objectCategory: 'item', baseType: 'misc' }),
  machine: resolveProperties({ objectCategory: 'environment', baseType: 'door' }),
  organic: resolveProperties({ objectCategory: 'npc', baseType: 'creature' }),
  data: resolveProperties({ objectCategory: 'item', baseType: 'data' }),
  space: resolveProperties({ objectCategory: 'environment', baseType: 'vent' }),
};

/** One character per nature, in NATURES order: c=compatible, u=unsuited, a=absurd. */
const FROZEN: Readonly<Record<VerbId, string>> = {
  STRIKE: 'ccccc',
  PUSH: 'ccccc',
  PULL: 'ccccc',
  LIFT: 'cuucu',
  KICK: 'ccccc',
  BREAK: 'ucuuu',
  BEND: 'uuuuu',
  CUT: 'uuuuu',
  FORCE_OPEN: 'uuaau',
  BITE: 'uuucu',
  SQUEEZE: 'uuucu',
  IMPROVISE_WEAPON: 'cuucu',
  SACRIFICE: 'ccccc',
  SELF_HARM: 'ccccc',
  BLOCK: 'ccccc',
  IMPROVISE_SHIELD: 'uuuuu',
  BARRICADE: 'ucaac',
  READ: 'uuucu',
  HACK: 'auaua',
  REPAIR: 'ucaau',
  DISASSEMBLE: 'ucaau',
  ASSEMBLE: 'uuaau',
  ACTIVATE: 'acaua',
  DEACTIVATE: 'acaua',
  REPROGRAM: 'auaua',
  LOCK: 'ucaau',
  UNLOCK: 'uuaau',
  WELD: 'ucuau',
  PLUG: 'auaaa',
  OVERRIDE: 'auaua',
  SABOTAGE: 'ucaau',
  SET_TRAP: 'ccccc',
  IMPROVISE_TOOL: 'ccccc',
  WEDGE: 'uuuuu',
  IGNITE: 'uuuau',
  FLOOD: 'ccccc',
  ELECTRIFY: 'uuuau',
  TIE: 'ccccc',
  COVER: 'uuaau',
  EXAMINE: 'ccccc',
  LISTEN: 'ccccc',
  SMELL: 'ccccc',
  SCAN: 'ccccc',
  TALK: 'aauaa',
  PERSUADE: 'aauaa',
  INTIMIDATE: 'aauaa',
  DECEIVE: 'aauaa',
  DISTRACT: 'aauaa',
  BARTER: 'aauaa',
  SEDUCE: 'aauaa',
  COMMAND: 'aauaa',
  CALM: 'aauaa',
  PROVOKE: 'aauaa',
  PLEAD: 'aauaa',
  INTERROGATE: 'aauaa',
  SIGNAL: 'ccccc',
  LURE: 'aauaa',
  THROW: 'cuucu',
  SHOOT: 'ccccc',
  CLIMB: 'uuaac',
  JUMP: 'ccccc',
  DODGE: 'ccccc',
  SWIM: 'ccccc',
  RUN: 'ccccc',
  HIDE: 'ccccc',
  STACK: 'cuucu',
  USE: 'uuaau',
  OPEN: 'ucaac',
  CLOSE: 'ucaac',
  TAKE: 'cuucu',
  DROP: 'ccccc',
  GIVE: 'aauaa',
  EQUIP: 'uuaau',
  EAT: 'aauaa',
  DRINK: 'uuuau',
  MOVE_TO: 'ccccc',
  WAIT: 'ccccc',
  TOUCH: 'ccccc',
};

function rowFor(verb: VerbId): string {
  return NATURES.map(nature => checkCompatibility({
    verbId: verb,
    targetProps: ARCHETYPE[nature],
    playerToolProps: [],
  }).severity[0]).join('');
}

describe('severity matrix', () => {
  it('matches the reviewed grid for all 78 verbs', () => {
    const drift: string[] = [];
    for (const verb of VERB_IDS) {
      const actual = rowFor(verb);
      if (actual !== FROZEN[verb]) drift.push(`${verb}: ${FROZEN[verb]} -> ${actual}`);
    }
    expect(drift).toEqual([]);
  });

  it('covers every verb', () => {
    expect(Object.keys(FROZEN).sort()).toEqual([...VERB_IDS].sort());
  });

  it('keeps the three severities in use — no collapse to a single verdict', () => {
    const seen = new Set(VERB_IDS.flatMap(v => rowFor(v).split('')));
    expect([...seen].sort()).toEqual(['a', 'c', 'u']);
  });
});
