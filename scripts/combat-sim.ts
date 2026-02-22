// scripts/combat-sim.ts — Combat simulation diagnostic output
// Run with: npx tsx scripts/combat-sim.ts

import { rollCheck, rollLuckBonus } from '../src/engine/dice';
import {
  resolvePlayerAttack, resolveNPCAttack, attemptFlee, calculateBerserkBonus,
} from '../src/engine/combat';
import { NPC_LIST } from '../src/content/npcs';
import type { CombatNPCState, StatBlock } from '../src/engine/types';

// Seeded PRNG for reproducibility
let seed = 42;
const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// Marine stats
const marine: StatBlock = { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 3 };
const robot = NPC_LIST[0]; // security_robot

console.log('=== COMBAT SIMULATION: Marine vs Security Robot ===');
console.log(`Marine: FOR ${marine.FOR}  DEF ${marine.DEF}  AGI ${marine.AGI}  LCK ${marine.LCK}`);
console.log(`Robot:  HP ${robot.hp}  ATK ${robot.attack ?? robot.damage}  DEF ${robot.defense ?? 0}  dodge ${robot.dodgeChance}  fleeDC ${robot.fleeDC ?? 10}`);
console.log('');

let npcState: CombatNPCState = {
  definitionId: robot.id,
  hp: robot.hp,
  maxHp: robot.hp,
  attack: robot.attack ?? robot.damage,
  defense: robot.defense ?? 0,
  dodgeChance: robot.dodgeChance,
  fleeDC: robot.fleeDC ?? 10,
  aggressionPattern: robot.aggressionPattern,
  weakPoint: robot.weakPoint ? {
    ...robot.weakPoint,
    targetVerbs: [...robot.weakPoint.targetVerbs],
    targetProperties: [...robot.weakPoint.targetProperties],
  } : null,
  weakPointDiscovered: false,
  combatRound: 1,
};

let playerHp = 14;

for (let round = 1; round <= 6; round++) {
  console.log(`--- Round ${round} ---`);

  // Player attacks
  const roll = rollCheck('FOR', marine.FOR, marine.LCK, 13, 0, rng);
  const critTag = roll.critical ? ' (CRIT!)' : roll.fumble ? ' (FUMBLE!)' : '';
  console.log(`  Player roll: D20=${roll.natural} + FOR(${roll.statValue}) + LCK(${roll.luckBonus}) = ${roll.total} vs DC 13 → ${roll.success ? 'HIT' : 'MISS'}${critTag}`);

  const atk = resolvePlayerAttack(
    marine,
    { damageBonus: 1, type: 'weapon' },
    'STRIKE', npcState, roll, '', null, rng,
  );
  if (atk.hit && !atk.npcDodged) {
    const tags = [
      atk.weakPointHit ? 'WEAK POINT!' : '',
      atk.critical ? 'CRIT x1.5!' : '',
    ].filter(Boolean).join(' ');
    console.log(`  → Damage dealt: ${atk.damageDealt} ${tags}`);
    if (atk.bonusLoot) console.log(`  → BONUS LOOT: ${atk.bonusLoot.itemId}`);
    npcState = { ...npcState, hp: Math.max(0, npcState.hp - atk.damageDealt) };
  } else if (atk.npcDodged) {
    console.log(`  → NPC dodged the attack!`);
  } else {
    console.log(`  → Miss!`);
  }
  console.log(`  Robot HP: ${npcState.hp}/${npcState.maxHp}`);

  if (npcState.hp <= 0) { console.log('\n*** ROBOT DESTROYED ***'); break; }

  // NPC attacks back
  const npcAtk = resolveNPCAttack(
    npcState.attack, npcState.aggressionPattern,
    npcState.hp, npcState.maxHp,
    marine, 0, 1.0, rng,
  );
  if (npcAtk.hit && !npcAtk.dodged) {
    playerHp = Math.max(0, playerHp - npcAtk.damageDealt);
    console.log(`  Robot attacks → HIT! Damage: ${npcAtk.damageDealt}`);
  } else if (npcAtk.dodged) {
    console.log(`  Robot attacks → Player dodged!`);
  } else {
    console.log(`  Robot attacks → MISS`);
  }
  console.log(`  Marine HP: ${playerHp}/14`);

  if (playerHp <= 0) { console.log('\n*** MARINE DOWN ***'); break; }

  npcState = { ...npcState, combatRound: npcState.combatRound + 1 };
  console.log('');
}

// === FLEE SIMULATION ===
console.log('\n=== FLEE SIMULATION ===');
for (let i = 1; i <= 5; i++) {
  const flee = attemptFlee(marine, npcState, 0, 1.0, rng);
  console.log(`  Attempt ${i}: D20=${flee.roll.natural} + AGI(${flee.roll.statValue}) + LCK(${flee.roll.luckBonus}) = ${flee.roll.total} vs DC ${npcState.fleeDC} → ${flee.success ? 'ESCAPED!' : 'FAILED'}`);
  if (!flee.success && flee.npcFreeAttack) {
    const fa = flee.npcFreeAttack;
    console.log(`    Free attack: ${fa.hit ? `HIT for ${fa.damageDealt} dmg` : 'MISS'}`);
  }
  if (flee.success) break;
}

// === BERSERK SCALING ===
console.log('\n=== BERSERK SCALING (parasitized_crewmember, pattern: berserk) ===');
const bNpc = NPC_LIST[3]; // parasitized_crewmember
const bAtk = bNpc.attack ?? bNpc.damage;
for (let hp = bNpc.hp; hp >= 1; hp -= 2) {
  const bonus = calculateBerserkBonus('berserk', hp, bNpc.hp);
  console.log(`  HP ${String(hp).padStart(2)}/${bNpc.hp} → berserk bonus: +${bonus}  (total ATK: ${bAtk + bonus})`);
}

// === LUCK DISTRIBUTION ===
console.log('\n=== LUCK BONUS DISTRIBUTION (LCK=3, 20 rolls) ===');
const luckRolls: number[] = [];
for (let i = 0; i < 20; i++) luckRolls.push(rollLuckBonus(3, rng));
console.log(`  Rolls: ${luckRolls.join(', ')}`);
const avg = luckRolls.reduce((a, b) => a + b, 0) / luckRolls.length;
console.log(`  Average: ${avg.toFixed(2)} (expected ~1.5)`);

// === XENOMORPH ENCOUNTER ===
console.log('\n=== XENOMORPH ENCOUNTER (high-danger) ===');
const xeno = NPC_LIST[1];
const xAtk = xeno.attack ?? xeno.damage;
let xenoState: CombatNPCState = {
  definitionId: xeno.id, hp: xeno.hp, maxHp: xeno.hp,
  attack: xAtk, defense: xeno.defense ?? 0,
  dodgeChance: xeno.dodgeChance, fleeDC: xeno.fleeDC ?? 14,
  aggressionPattern: xeno.aggressionPattern,
  weakPoint: xeno.weakPoint ? {
    ...xeno.weakPoint,
    targetVerbs: [...xeno.weakPoint.targetVerbs],
    targetProperties: [...xeno.weakPoint.targetProperties],
  } : null,
  weakPointDiscovered: false, combatRound: 1,
};
console.log(`Xenomorph: HP ${xeno.hp}  ATK ${xAtk}  DEF ${xeno.defense ?? 0}  dodge ${xeno.dodgeChance}  fleeDC ${xeno.fleeDC ?? 14}  pattern: ${xeno.aggressionPattern}`);

for (let round = 1; round <= 4; round++) {
  console.log(`--- Round ${round} ---`);
  const roll = rollCheck('FOR', marine.FOR, marine.LCK, 15, 0, rng);
  console.log(`  Player roll: D20=${roll.natural} + FOR(${roll.statValue}) + LCK(${roll.luckBonus}) = ${roll.total} vs DC 15 → ${roll.success ? 'HIT' : 'MISS'}${roll.critical ? ' (CRIT!)' : ''}${roll.fumble ? ' (FUMBLE!)' : ''}`);

  const xAtk2 = resolvePlayerAttack(
    marine, { damageBonus: 2, type: 'weapon' }, 'STRIKE', xenoState, roll, '', null, rng,
  );
  if (xAtk2.hit && !xAtk2.npcDodged) {
    console.log(`  → Damage: ${xAtk2.damageDealt}${xAtk2.critical ? ' (CRIT!)' : ''}`);
    xenoState = { ...xenoState, hp: Math.max(0, xenoState.hp - xAtk2.damageDealt) };
  } else {
    console.log(`  → ${xAtk2.npcDodged ? 'Xeno dodged!' : 'Miss!'}`);
  }
  console.log(`  Xeno HP: ${xenoState.hp}/${xenoState.maxHp}`);

  if (xenoState.hp <= 0) { console.log('\n*** XENOMORPH KILLED ***'); break; }

  const xenoHit = resolveNPCAttack(xenoState.attack, xenoState.aggressionPattern, xenoState.hp, xenoState.maxHp, marine, 1, 1.0, rng);
  const berserk = calculateBerserkBonus(xenoState.aggressionPattern, xenoState.hp, xenoState.maxHp);
  if (xenoHit.hit && !xenoHit.dodged) {
    console.log(`  Xeno attacks → HIT! Damage: ${xenoHit.damageDealt} (berserk +${berserk})`);
  } else {
    console.log(`  Xeno attacks → ${xenoHit.dodged ? 'Player dodged!' : 'MISS'}`);
  }
  xenoState = { ...xenoState, combatRound: xenoState.combatRound + 1 };
  console.log('');
}
