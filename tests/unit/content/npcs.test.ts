// ---------------------------------------------------------------------------
// tests/unit/content/npcs.test.ts — NPC definitions verification
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { NPC_LIST, NPC_DEFINITIONS, resolveNPCProperties } from '../../../src/content/npcs';
import { PROPERTY_IDS } from '../../../src/engine/properties';

const validProps = new Set(PROPERTY_IDS);

describe('NPC_LIST', () => {
  test('has at least 5 NPCs', () => {
    expect(NPC_LIST.length).toBeGreaterThanOrEqual(5);
  });

  test('no duplicate NPC IDs', () => {
    const ids = NPC_LIST.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('NPC_DEFINITIONS has same count as NPC_LIST', () => {
    expect(Object.keys(NPC_DEFINITIONS)).toHaveLength(NPC_LIST.length);
  });

  test('all NPCs have positive HP', () => {
    for (const npc of NPC_LIST) {
      expect(npc.hp).toBeGreaterThan(0);
    }
  });

  test('all NPCs have dodgeChance between 0 and 0.5', () => {
    for (const npc of NPC_LIST) {
      expect(npc.dodgeChance).toBeGreaterThanOrEqual(0);
      expect(npc.dodgeChance).toBeLessThanOrEqual(0.5);
    }
  });
});

describe('resolveNPCProperties', () => {
  test('all NPCs resolve to valid PropertyIds', () => {
    for (const npc of NPC_LIST) {
      const props = resolveNPCProperties(npc.id);
      for (const p of props) {
        expect(validProps.has(p)).toBe(true);
      }
    }
  });

  test('security_robot has robotic and hostile', () => {
    const props = resolveNPCProperties('security_robot');
    expect(props).toContain('robotic');
    expect(props).toContain('hostile');
  });

  test('xenomorph has organic and hostile', () => {
    const props = resolveNPCProperties('xenomorph');
    expect(props).toContain('organic');
    expect(props).toContain('hostile');
  });

  test('unknown NPC returns empty array', () => {
    expect(resolveNPCProperties('nonexistent')).toEqual([]);
  });
});
