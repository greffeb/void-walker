// ---------------------------------------------------------------------------
// tests/unit/engine/combat.test.ts — Combat system unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  calculateBaseDamage,
  resolvePlayerAttack,
  calculateAmbushBonus,
  calculateBerserkBonus,
  shouldNPCAttack,
  resolveNPCAttack,
  attemptFlee,
  attemptRetreat,
  isExploitVerb,
  checkWeakPointAutoDiscover,
  shouldShowWeakPointHint,
  canDiscoverWeakPoint,
} from '../../../src/engine/combat';
import type {
  StatBlock, CombatNPCState, DiceResult, RngFn, WeakPoint,
} from '../../../src/engine/types';
import { BALANCE } from '../../../src/engine/constants';

function makeStats(overrides: Partial<Record<string, number>> = {}): StatBlock {
  return {
    FOR: 3, DEF: 3, AGI: 3, INT: 3, PER: 3, CHA: 3, LCK: 2,
    ...overrides,
  } as StatBlock;
}

function makeNpc(overrides: Partial<CombatNPCState> = {}): CombatNPCState {
  return {
    definitionId: 'security_robot',
    hp: 15, maxHp: 15,
    attack: 4, defense: 2, dodgeChance: 0.1, fleeDC: 10,
    aggressionPattern: 'aggressive',
    weakPoint: null, weakPointDiscovered: false, combatRound: 1,
    ...overrides,
  };
}

function makeDice(overrides: Partial<DiceResult> = {}): DiceResult {
  return {
    natural: 15, stat: 'FOR', statValue: 3, luckBonus: 1,
    modifier: 0, total: 19, difficulty: 13, success: true,
    critical: false, fumble: false,
    ...overrides,
  };
}

function fixedRng(value: number): RngFn {
  return () => value;
}

function sequenceRng(values: number[]): RngFn {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

// === PLAYER ATTACK ===

describe('calculateBaseDamage', () => {
  it('melee: FOR + weapon damage', () => {
    const dmg = calculateBaseDamage(4, 3, { damageBonus: 2, type: 'weapon' }, 'STRIKE', '', null);
    expect(dmg).toBe(6); // 4 + 2
  });

  it('unarmed: max(1, FOR)', () => {
    const dmg = calculateBaseDamage(3, 3, null, 'STRIKE', '', null);
    expect(dmg).toBe(3);
  });

  it('unarmed minimum is UNARMED_BASE_DAMAGE', () => {
    const dmg = calculateBaseDamage(0, 0, null, 'STRIKE', '', null);
    expect(dmg).toBe(BALANCE.COMBAT.UNARMED_BASE_DAMAGE);
  });

  it('SHOOT: weaponDamage + floor(AGI/2)', () => {
    const dmg = calculateBaseDamage(1, 4, { damageBonus: 3, type: 'weapon' }, 'SHOOT', '', null);
    expect(dmg).toBe(3 + 2); // 3 + floor(4/2)
  });

  it('IMPROVISE_WEAPON: ceil(FOR * 0.75)', () => {
    const dmg = calculateBaseDamage(4, 3, null, 'IMPROVISE_WEAPON', '', null);
    expect(dmg).toBe(Math.ceil(4 * 0.75)); // 3
  });

  it('marine passive adds bonus', () => {
    const dmg = calculateBaseDamage(3, 3, null, 'STRIKE', 'COMBAT_DAMAGE_BONUS', 1);
    expect(dmg).toBe(3 + 1);
  });

  it('minimum damage is 1', () => {
    const dmg = calculateBaseDamage(0, 0, null, 'IMPROVISE_WEAPON', '', null);
    expect(dmg).toBeGreaterThanOrEqual(1);
  });
});

describe('resolvePlayerAttack', () => {
  it('miss when roll fails', () => {
    const result = resolvePlayerAttack(
      makeStats(), null, 'STRIKE', makeNpc(), makeDice({ success: false }),
      '', null,
    );
    expect(result.hit).toBe(false);
    expect(result.damageDealt).toBe(0);
  });

  it('NPC dodge prevents hit', () => {
    const result = resolvePlayerAttack(
      makeStats(), null, 'STRIKE', makeNpc({ dodgeChance: 1.0 }), makeDice(),
      '', null, fixedRng(0.5), // rng < 1.0 → dodge
    );
    expect(result.hit).toBe(false);
    expect(result.npcDodged).toBe(true);
  });

  it('deals damage on hit', () => {
    const result = resolvePlayerAttack(
      makeStats({ FOR: 4 }), { damageBonus: 2, type: 'weapon' }, 'STRIKE',
      makeNpc({ dodgeChance: 0, defense: 1 }), makeDice(),
      '', null, fixedRng(0.99), // no dodge
    );
    expect(result.hit).toBe(true);
    expect(result.damageDealt).toBeGreaterThan(0);
  });

  it('applies weak point multiplier', () => {
    const wp: WeakPoint = {
      id: 'cooling', nameKey: 'wp.cooling', discoverMethod: 'examine',
      targetVerbs: ['STRIKE'], targetProperties: [], damageMultiplier: 2.5,
      hintKey: '', exploitKey: '',
    };
    const npc = makeNpc({
      dodgeChance: 0, defense: 0,
      weakPoint: wp, weakPointDiscovered: true,
    });
    const result = resolvePlayerAttack(
      makeStats({ FOR: 4 }), null, 'STRIKE', npc, makeDice(),
      '', null, fixedRng(0.99),
    );
    expect(result.weakPointHit).toBe(true);
    expect(result.damageDealt).toBeGreaterThan(4); // base 4 * 2.5 = 10
  });

  it('critical hit applies multiplier', () => {
    const npc = makeNpc({ dodgeChance: 0, defense: 0 });
    const result = resolvePlayerAttack(
      makeStats({ FOR: 4 }), null, 'STRIKE', npc,
      makeDice({ natural: 20, critical: true }),
      '', null, fixedRng(0.99),
    );
    expect(result.critical).toBe(true);
    expect(result.damageDealt).toBe(Math.floor(4 * BALANCE.COMBAT.CRITICAL_HIT_MULTIPLIER));
  });

  it('nat 20 can trigger bonus loot', () => {
    const npc = makeNpc({ dodgeChance: 0, defense: 0 });
    // rng: first call dodge (0.99 → no dodge), then bonus loot check (0.1 < 0.5 → loot), then pick (0.1)
    const rng = sequenceRng([0.99, 0.1, 0.1]);
    const result = resolvePlayerAttack(
      makeStats({ FOR: 4 }), null, 'STRIKE', npc,
      makeDice({ natural: 20, critical: true }),
      '', null, rng,
    );
    expect(result.bonusLoot).not.toBeNull();
  });

  it('detects NPC killed', () => {
    const npc = makeNpc({ hp: 1, dodgeChance: 0, defense: 0 });
    const result = resolvePlayerAttack(
      makeStats({ FOR: 4 }), null, 'STRIKE', npc, makeDice(),
      '', null, fixedRng(0.99),
    );
    expect(result.npcKilled).toBe(true);
  });
});

// === NPC ATTACK ===

describe('calculateBerserkBonus', () => {
  it('returns 0 for non-berserk patterns', () => {
    expect(calculateBerserkBonus('aggressive', 5, 20)).toBe(0);
    expect(calculateBerserkBonus('defensive', 5, 20)).toBe(0);
  });

  it('returns 0 at full HP', () => {
    expect(calculateBerserkBonus('berserk', 20, 20)).toBe(0);
  });

  it('returns +1 at 75% HP (25% lost)', () => {
    expect(calculateBerserkBonus('berserk', 15, 20)).toBe(1);
  });

  it('returns +2 at 50% HP', () => {
    expect(calculateBerserkBonus('berserk', 10, 20)).toBe(2);
  });

  it('returns +3 at 25% HP', () => {
    expect(calculateBerserkBonus('berserk', 5, 20)).toBe(3);
  });
});

describe('shouldNPCAttack', () => {
  it('aggressive always attacks', () => {
    expect(shouldNPCAttack('aggressive', 5, false, 10, 10)).toBe(true);
  });

  it('berserk always attacks', () => {
    expect(shouldNPCAttack('berserk', 5, false, 10, 10)).toBe(true);
  });

  it('defensive only attacks if attacked', () => {
    expect(shouldNPCAttack('defensive', 1, false, 10, 10)).toBe(false);
    expect(shouldNPCAttack('defensive', 1, true, 10, 10)).toBe(true);
  });

  it('ambush always attacks (first-strike bonus handled separately)', () => {
    expect(shouldNPCAttack('ambush', 1, false, 10, 10)).toBe(true);
    expect(shouldNPCAttack('ambush', 2, false, 10, 10)).toBe(true);
    expect(shouldNPCAttack('ambush', 5, false, 10, 10)).toBe(true);
  });

  it('retreating stops attacking below 25% HP', () => {
    expect(shouldNPCAttack('retreating', 1, false, 3, 10)).toBe(true);
    expect(shouldNPCAttack('retreating', 1, false, 2, 10)).toBe(false);
  });
});

describe('resolveNPCAttack', () => {
  it('NPC misses when roll too low', () => {
    // NPC roll: floor(0.05 * 20) + 1 = 2, total = 2 + 4 = 6
    // Player defense: 10 + 3 + 3 + luckBonus(rng=0.5, LCK=2 → floor(0.5*3)=1) = 17
    const rng = sequenceRng([0.05, 0.5]);
    const result = resolveNPCAttack(4, 'aggressive', 15, 15, makeStats(), 0, 1.0, rng);
    expect(result.hit).toBe(false);
  });

  it('NPC hits when roll high enough', () => {
    // NPC roll: floor(0.95 * 20) + 1 = 20, total = 20 + 4 = 24
    // Player defense: 10 + 3 + 3 + luck(0→0) = 16
    // 24 > 16 → hit
    // Passive dodge: AGI 3 >= 3 → check, rng 0.99 → no dodge
    const rng = sequenceRng([0.95, 0, 0.99]);
    const result = resolveNPCAttack(4, 'aggressive', 15, 15, makeStats(), 0, 1.0, rng);
    expect(result.hit).toBe(true);
    expect(result.damageDealt).toBeGreaterThan(0);
  });

  it('armor reduces damage', () => {
    // NPC roll: 20, total = 24
    // Player def: 10 + 3 + 3 + 0 = 16
    // damage = max(1, 4 - 3 - 2) = max(1, -1) = 1
    const rng = sequenceRng([0.95, 0, 0.99]);
    const result = resolveNPCAttack(4, 'aggressive', 15, 15, makeStats(), 2, 1.0, rng);
    expect(result.damageDealt).toBe(1);
  });

  it('berserk bonus increases damage', () => {
    // Berserk at 50% HP = +2 bonus
    const rng = sequenceRng([0.95, 0, 0.99]);
    const result = resolveNPCAttack(4, 'berserk', 10, 20, makeStats({ DEF: 0, AGI: 0 }), 0, 1.0, rng);
    expect(result.berserkBonus).toBe(2);
    expect(result.damageDealt).toBeGreaterThanOrEqual(4 + 2); // attack + berserk
  });

  it('difficulty multiplier scales damage', () => {
    const rng1 = sequenceRng([0.95, 0, 0.99]);
    const normal = resolveNPCAttack(4, 'aggressive', 15, 15, makeStats({ DEF: 0, AGI: 0, LCK: 0 }), 0, 1.0, rng1);

    const rng2 = sequenceRng([0.95, 0, 0.99]);
    const nightmare = resolveNPCAttack(4, 'aggressive', 15, 15, makeStats({ DEF: 0, AGI: 0, LCK: 0 }), 0, 1.5, rng2);

    expect(nightmare.damageDealt).toBeGreaterThan(normal.damageDealt);
  });
});

// === FLEE ===

describe('attemptFlee', () => {
  it('succeeds when roll passes', () => {
    // D20: floor(0.95 * 20) + 1 = 20 (nat 20 → crit success)
    // LCK bonus: floor(0 * 3) = 0
    const rng = sequenceRng([0.95, 0]);
    const result = attemptFlee(makeStats(), makeNpc({ fleeDC: 10 }), 0, 1.0, rng);
    expect(result.success).toBe(true);
    expect(result.npcFreeAttack).toBeNull();
  });

  it('fails when roll too low', () => {
    // D20: floor(0.05 * 20) + 1 = 2
    // LCK: 0
    // Total: 2 + 3(AGI) + 0 = 5 < 10
    const rng = sequenceRng([0.05, 0, /* free attack rng */ 0.95, 0, 0.99]);
    const result = attemptFlee(makeStats(), makeNpc({ fleeDC: 10 }), 0, 1.0, rng);
    expect(result.success).toBe(false);
    expect(result.npcFreeAttack).not.toBeNull();
  });

  it('NPC gets free attack on failed flee', () => {
    // Fail the flee, then NPC attacks
    const rng = sequenceRng([0.05, 0, 0.95, 0, 0.99]);
    const result = attemptFlee(
      makeStats({ AGI: 1, LCK: 0 }),
      makeNpc({ fleeDC: 15, attack: 5 }),
      0, 1.0, rng,
    );
    expect(result.success).toBe(false);
    expect(result.npcFreeAttack).not.toBeNull();
  });

  it('flee roll uses AGI stat', () => {
    const rng = sequenceRng([0.5, 0.5]);
    const result = attemptFlee(makeStats({ AGI: 4 }), makeNpc({ fleeDC: 10 }), 0, 1.0, rng);
    expect(result.roll.stat).toBe('AGI');
    expect(result.roll.statValue).toBe(4);
  });
});

// === WEAK POINTS ===

describe('checkWeakPointAutoDiscover', () => {
  it('returns false before auto-discover round', () => {
    expect(checkWeakPointAutoDiscover(1)).toBe(false);
    expect(checkWeakPointAutoDiscover(2)).toBe(false);
  });

  it('returns true at auto-discover round', () => {
    expect(checkWeakPointAutoDiscover(BALANCE.COMBAT.WEAK_POINT_AUTO_DISCOVER_ROUND)).toBe(true);
  });
});

describe('shouldShowWeakPointHint', () => {
  it('returns false before hint round', () => {
    expect(shouldShowWeakPointHint(1)).toBe(false);
  });

  it('returns true at hint round', () => {
    expect(shouldShowWeakPointHint(BALANCE.COMBAT.WEAK_POINT_HINT_ROUND)).toBe(true);
  });
});

describe('canDiscoverWeakPoint', () => {
  const examineWp: WeakPoint = {
    id: 'wp1', nameKey: '', discoverMethod: 'examine',
    targetVerbs: ['STRIKE'], targetProperties: [],
    damageMultiplier: 2.0, hintKey: '', exploitKey: '',
  };
  const scanWp: WeakPoint = {
    id: 'wp2', nameKey: '', discoverMethod: 'scan',
    targetVerbs: ['SHOOT'], targetProperties: [],
    damageMultiplier: 2.5, hintKey: '', exploitKey: '',
  };
  const combatHintWp: WeakPoint = {
    id: 'wp3', nameKey: '', discoverMethod: 'combat_hint',
    targetVerbs: ['STRIKE'], targetProperties: [],
    damageMultiplier: 3.0, hintKey: '', exploitKey: '',
  };

  it('EXAMINE discovers examine weak points', () => {
    expect(canDiscoverWeakPoint('EXAMINE', examineWp, false)).toBe(true);
  });

  it('EXAMINE does not discover scan weak points', () => {
    expect(canDiscoverWeakPoint('EXAMINE', scanWp, false)).toBe(false);
  });

  it('SCAN with scanner discovers scan weak points', () => {
    expect(canDiscoverWeakPoint('SCAN', scanWp, true)).toBe(true);
  });

  it('SCAN with scanner also discovers examine weak points', () => {
    expect(canDiscoverWeakPoint('SCAN', examineWp, true)).toBe(true);
  });

  it('SCAN without scanner fails', () => {
    expect(canDiscoverWeakPoint('SCAN', scanWp, false)).toBe(false);
  });

  it('combat_hint weak points not discoverable by verbs', () => {
    expect(canDiscoverWeakPoint('EXAMINE', combatHintWp, false)).toBe(false);
    expect(canDiscoverWeakPoint('SCAN', combatHintWp, true)).toBe(false);
  });

  it('non-discovery verbs always return false', () => {
    expect(canDiscoverWeakPoint('STRIKE', examineWp, false)).toBe(false);
    expect(canDiscoverWeakPoint('HACK', scanWp, true)).toBe(false);
  });
});

// === AMBUSH BONUS ===

describe('calculateAmbushBonus', () => {
  it('returns bonus on round 1 for ambush pattern', () => {
    expect(calculateAmbushBonus('ambush', 1)).toBe(BALANCE.COMBAT.AMBUSH_FIRST_ROUND_BONUS);
  });

  it('returns 0 after round 1 for ambush pattern', () => {
    expect(calculateAmbushBonus('ambush', 2)).toBe(0);
    expect(calculateAmbushBonus('ambush', 5)).toBe(0);
  });

  it('returns 0 for non-ambush patterns', () => {
    expect(calculateAmbushBonus('aggressive', 1)).toBe(0);
    expect(calculateAmbushBonus('berserk', 1)).toBe(0);
    expect(calculateAmbushBonus('defensive', 1)).toBe(0);
  });
});

// === EXPLOIT VERBS ===

describe('isExploitVerb', () => {
  it('recognizes INT-based exploit verbs', () => {
    expect(isExploitVerb('SABOTAGE')).toBe(true);
    expect(isExploitVerb('HACK')).toBe(true);
    expect(isExploitVerb('ELECTRIFY')).toBe(true);
    expect(isExploitVerb('REPROGRAM')).toBe(true);
    expect(isExploitVerb('OVERRIDE')).toBe(true);
  });

  it('returns false for non-exploit verbs', () => {
    expect(isExploitVerb('STRIKE')).toBe(false);
    expect(isExploitVerb('SHOOT')).toBe(false);
    expect(isExploitVerb('EXAMINE')).toBe(false);
  });
});

describe('calculateBaseDamage with INT exploits', () => {
  it('SABOTAGE uses INT for damage', () => {
    const dmg = calculateBaseDamage(1, 1, null, 'SABOTAGE', '', null, 5);
    expect(dmg).toBe(5); // INT 5 * 1.0
  });

  it('HACK with weapon adds damageBonus', () => {
    const dmg = calculateBaseDamage(1, 1, { damageBonus: 2, type: 'weapon' }, 'HACK', '', null, 4);
    expect(dmg).toBe(6); // INT 4 + weapon 2
  });

  it('exploit minimum is 1', () => {
    const dmg = calculateBaseDamage(0, 0, null, 'SABOTAGE', '', null, 0);
    expect(dmg).toBe(1);
  });
});

// === RETREAT ===

describe('attemptRetreat', () => {
  it('uses reduced DC compared to flee', () => {
    // High roll → easy retreat
    const rng = sequenceRng([0.95, 0]);
    const result = attemptRetreat(makeStats(), makeNpc({ fleeDC: 10 }), rng);
    expect(result.success).toBe(true);
    // DC should be fleeDC - RETREAT_DC_REDUCTION = 10 - 5 = 5
    expect(result.roll.difficulty).toBe(10 - BALANCE.COMBAT.RETREAT_DC_REDUCTION);
  });

  it('has no free attack on failure', () => {
    const rng = sequenceRng([0.05, 0]);
    const result = attemptRetreat(makeStats({ AGI: 0, LCK: 0 }), makeNpc({ fleeDC: 15 }), rng);
    expect(result.success).toBe(false);
    // RetreatResult has no npcFreeAttack field
    expect('npcFreeAttack' in result).toBe(false);
  });

  it('retreat DC never goes below 1', () => {
    const rng = sequenceRng([0.95, 0]);
    const result = attemptRetreat(makeStats(), makeNpc({ fleeDC: 3 }), rng);
    expect(result.roll.difficulty).toBeGreaterThanOrEqual(1);
  });
});
