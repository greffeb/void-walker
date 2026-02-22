// ---------------------------------------------------------------------------
// tests/stress/combatSimulation.test.ts — 1000 combat encounters, no NaN or impossible values
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  resolvePlayerAttack,
  resolveNPCAttack,
  attemptFlee,
  calculateBaseDamage,
  calculateBerserkBonus,
} from '../../src/engine/combat';
import { rollCheck } from '../../src/engine/dice';
import type { StatBlock, CombatNPCState } from '../../src/engine/types';
import { NPC_LIST } from '../../src/content/npcs';
import { ITEM_LIST } from '../../src/content/items';

function randomStats(rng: () => number): StatBlock {
  const s = () => Math.floor(rng() * 6);
  return { FOR: s(), DEF: s(), AGI: s(), INT: s(), PER: s(), CHA: s(), LCK: s() } as StatBlock;
}

function makeNpcState(npcDef: typeof NPC_LIST[0], rng: () => number): CombatNPCState {
  return {
    definitionId: npcDef.id,
    hp: npcDef.hp,
    maxHp: npcDef.hp,
    attack: npcDef.attack ?? npcDef.damage,
    defense: npcDef.defense ?? 0,
    dodgeChance: npcDef.dodgeChance,
    fleeDC: npcDef.fleeDC ?? 10,
    aggressionPattern: npcDef.aggressionPattern,
    weakPoint: npcDef.weakPoint ? {
      ...npcDef.weakPoint,
      targetVerbs: [...npcDef.weakPoint.targetVerbs],
      targetProperties: [...npcDef.weakPoint.targetProperties],
    } : null,
    weakPointDiscovered: rng() > 0.5,
    combatRound: Math.floor(rng() * 5) + 1,
  };
}

// Seeded PRNG for reproducibility
function createSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('Combat simulation stress test', () => {
  test('1000 player attacks produce valid results', () => {
    const rng = createSeededRng(42);
    const weapons = ITEM_LIST.filter(i => i.type === 'weapon');

    for (let i = 0; i < 1000; i++) {
      const stats = randomStats(rng);
      const npcDef = NPC_LIST[Math.floor(rng() * NPC_LIST.length)];
      const npc = makeNpcState(npcDef, rng);
      const weapon = rng() > 0.3 ? weapons[Math.floor(rng() * weapons.length)] : null;
      const verb = rng() > 0.5 ? 'STRIKE' as const : 'SHOOT' as const;

      const roll = rollCheck('FOR', stats.FOR, stats.LCK, 13, 0, rng);
      const result = resolvePlayerAttack(
        stats, weapon ? { damageBonus: weapon.damageBonus ?? 0, type: weapon.type } : null,
        verb, npc, roll, '', null, rng,
      );

      expect(result.damageDealt).not.toBeNaN();
      expect(result.damageDealt).toBeGreaterThanOrEqual(0);
      if (result.hit && !result.npcDodged) {
        expect(result.damageDealt).toBeGreaterThanOrEqual(1);
      }
      expect(typeof result.npcKilled).toBe('boolean');
      expect(typeof result.weakPointHit).toBe('boolean');
      expect(typeof result.critical).toBe('boolean');
    }
  });

  test('1000 NPC attacks produce valid results', () => {
    const rng = createSeededRng(123);

    for (let i = 0; i < 1000; i++) {
      const stats = randomStats(rng);
      const npcDef = NPC_LIST[Math.floor(rng() * NPC_LIST.length)];
      const attack = npcDef.attack ?? npcDef.damage;
      const armor = Math.floor(rng() * 4);
      const mult = [0.5, 1.0, 1.5][Math.floor(rng() * 3)];

      const result = resolveNPCAttack(
        attack, npcDef.aggressionPattern,
        Math.floor(rng() * npcDef.hp) + 1, npcDef.hp,
        stats, armor, mult, rng,
      );

      expect(result.damageDealt).not.toBeNaN();
      expect(result.damageDealt).toBeGreaterThanOrEqual(0);
      if (result.hit) {
        expect(result.damageDealt).toBeGreaterThanOrEqual(1);
      }
      expect(result.berserkBonus).not.toBeNaN();
      expect(result.berserkBonus).toBeGreaterThanOrEqual(0);
    }
  });

  test('1000 flee attempts always return a result', () => {
    const rng = createSeededRng(999);

    for (let i = 0; i < 1000; i++) {
      const stats = randomStats(rng);
      const npcDef = NPC_LIST[Math.floor(rng() * NPC_LIST.length)];
      const npc = makeNpcState(npcDef, rng);

      const result = attemptFlee(stats, npc, 0, 1.0, rng);

      expect(typeof result.success).toBe('boolean');
      expect(result.roll).toBeDefined();
      expect(result.roll.natural).toBeGreaterThanOrEqual(1);
      expect(result.roll.natural).toBeLessThanOrEqual(20);
      expect(result.roll.stat).toBe('AGI');

      if (!result.success) {
        expect(result.npcFreeAttack).not.toBeNull();
        expect(result.npcFreeAttack!.damageDealt).toBeGreaterThanOrEqual(0);
      } else {
        expect(result.npcFreeAttack).toBeNull();
      }
    }
  });

  test('berserk bonus increases as NPC HP drops', () => {
    for (let maxHp = 10; maxHp <= 30; maxHp += 5) {
      let prevBonus = 0;
      for (let hp = maxHp; hp >= 1; hp--) {
        const bonus = calculateBerserkBonus('berserk', hp, maxHp);
        expect(bonus).toBeGreaterThanOrEqual(prevBonus);
        expect(bonus).not.toBeNaN();
        prevBonus = bonus;
      }
    }
  });

  test('base damage is always >= 1', () => {
    const rng = createSeededRng(777);
    const weapons = ITEM_LIST.filter(i => i.type === 'weapon');
    const verbs = ['STRIKE', 'SHOOT', 'CUT', 'IMPROVISE_WEAPON'] as const;

    for (let i = 0; i < 500; i++) {
      const forStat = Math.floor(rng() * 6);
      const agiStat = Math.floor(rng() * 6);
      const weapon = rng() > 0.5 ? weapons[Math.floor(rng() * weapons.length)] : null;
      const verb = verbs[Math.floor(rng() * verbs.length)];

      const dmg = calculateBaseDamage(
        forStat, agiStat,
        weapon ? { damageBonus: weapon.damageBonus ?? 0, type: weapon.type } : null,
        verb, '', null,
      );
      expect(dmg).toBeGreaterThanOrEqual(1);
      expect(dmg).not.toBeNaN();
    }
  });
});
