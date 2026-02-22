// ---------------------------------------------------------------------------
// src/engine/combat.ts — Player attack, NPC attack, flee, weak points
// ---------------------------------------------------------------------------

import type {
  StatBlock, CombatNPCState, PlayerAttackResult, NPCAttackResult,
  FleeResult, RetreatResult, DiceResult, RngFn, WeakPoint, LootDrop, AggressionPattern,
} from './types';
import type { VerbId } from './verbs';
import type { ItemDefinition } from '../content/items';
import { BALANCE } from './constants';
import { rollCheck, rollD20, rollDodge, rollPassiveDodge, rollLuckBonus, defaultRng } from './dice';
import { checkBonusLoot } from './loot';

// === PLAYER ATTACK ===

/** Verbs that use INT instead of FOR for damage (exploit/tech attacks) */
const EXPLOIT_VERBS: readonly VerbId[] = [
  'SABOTAGE', 'HACK', 'ELECTRIFY', 'REPROGRAM', 'OVERRIDE',
];

/**
 * Check if a verb is an INT-based exploit attack.
 */
export function isExploitVerb(verb: VerbId): boolean {
  return (EXPLOIT_VERBS as readonly string[]).includes(verb);
}

/**
 * Calculate base damage for a player attack.
 * - Exploit (SABOTAGE, HACK, etc.): INT * EXPLOIT_INT_MULTIPLIER + weapon.damageBonus
 * - SHOOT: weapon.damageBonus + floor(AGI / 2)
 * - Melee: FOR + weapon.damageBonus
 * - Unarmed: max(UNARMED_BASE_DAMAGE, FOR)
 * - IMPROVISE_WEAPON: ceil(base * 0.75)
 * - Marine passive: +value
 */
export function calculateBaseDamage(
  forStat: number,
  agiStat: number,
  weapon: Pick<ItemDefinition, 'damageBonus' | 'type'> | null,
  verb: VerbId,
  passiveEffect: string,
  passiveValue: number | null,
  intStat: number = 0,
): number {
  let base: number;

  if (isExploitVerb(verb)) {
    base = Math.floor(intStat * BALANCE.COMBAT.EXPLOIT_INT_MULTIPLIER) + (weapon?.damageBonus ?? 0);
  } else if (verb === 'SHOOT' && weapon) {
    base = (weapon.damageBonus ?? 0) + Math.floor(agiStat / BALANCE.COMBAT.SHOOT_DAMAGE_AGI_DIVISOR);
  } else if (verb === 'IMPROVISE_WEAPON') {
    base = Math.ceil(forStat * BALANCE.COMBAT.IMPROVISED_WEAPON_MULTIPLIER);
  } else if (weapon) {
    base = forStat + (weapon.damageBonus ?? 0);
  } else {
    base = Math.max(BALANCE.COMBAT.UNARMED_BASE_DAMAGE, forStat);
  }

  // Marine passive: COMBAT_DAMAGE_BONUS
  if (passiveEffect === 'COMBAT_DAMAGE_BONUS' && passiveValue !== null) {
    base += passiveValue;
  }

  return Math.max(1, base);
}

/**
 * Resolve a full player attack against an NPC.
 */
export function resolvePlayerAttack(
  playerStats: StatBlock,
  weapon: Pick<ItemDefinition, 'damageBonus' | 'type'> | null,
  verb: VerbId,
  npc: CombatNPCState,
  rollResult: DiceResult,
  passiveEffect: string,
  passiveValue: number | null,
  rng: RngFn = defaultRng,
): PlayerAttackResult {
  const miss: PlayerAttackResult = {
    hit: false, npcDodged: false, damageDealt: 0,
    weakPointHit: false, npcKilled: false, critical: false,
    itemBroke: false, bonusLoot: null,
  };

  // Miss
  if (!rollResult.success) return miss;

  // NPC dodge
  if (rollDodge(npc.dodgeChance, rng)) {
    return { ...miss, npcDodged: true };
  }

  // Calculate damage
  let damage = calculateBaseDamage(
    playerStats.FOR, playerStats.AGI, weapon, verb, passiveEffect, passiveValue,
    playerStats.INT,
  );

  // Weak point multiplier
  let weakPointHit = false;
  if (npc.weakPointDiscovered && npc.weakPoint) {
    if ((npc.weakPoint.targetVerbs as readonly string[]).includes(verb)) {
      damage = Math.floor(damage * npc.weakPoint.damageMultiplier);
      weakPointHit = true;
    }
  }

  // NPC defense reduction
  damage = Math.max(1, damage - npc.defense);

  // Critical hit multiplier (nat 20)
  const critical = rollResult.critical;
  if (critical) {
    damage = Math.floor(damage * BALANCE.COMBAT.CRITICAL_HIT_MULTIPLIER);
  }

  const npcKilled = npc.hp - damage <= 0;

  // Bonus loot on nat 20
  let bonusLoot: LootDrop | null = null;
  if (critical) {
    bonusLoot = checkBonusLoot('combat', rng);
  }

  return {
    hit: true, npcDodged: false, damageDealt: damage,
    weakPointHit, npcKilled, critical, itemBroke: false, bonusLoot,
  };
}

// === NPC ATTACK ===

/**
 * Calculate ambush bonus for first-round surprise attacks.
 * Returns AMBUSH_FIRST_ROUND_BONUS on round 1, 0 otherwise.
 */
export function calculateAmbushBonus(
  pattern: AggressionPattern,
  combatRound: number,
): number {
  if (pattern !== 'ambush' || combatRound !== 1) return 0;
  return BALANCE.COMBAT.AMBUSH_FIRST_ROUND_BONUS;
}

/**
 * Calculate berserk attack bonus based on HP ratio.
 * +1 per 25% HP lost.
 */
export function calculateBerserkBonus(
  pattern: AggressionPattern,
  currentHp: number,
  maxHp: number,
): number {
  if (pattern !== 'berserk') return 0;
  const hpLostRatio = 1 - (currentHp / maxHp);
  const quartersLost = Math.floor(hpLostRatio * 4);
  return quartersLost * BALANCE.COMBAT.BERSERK_ATK_BONUS_PER_QUARTER;
}

/**
 * Determine if an NPC attacks this round based on aggression pattern.
 */
export function shouldNPCAttack(
  pattern: AggressionPattern,
  combatRound: number,
  wasAttackedThisTurn: boolean,
  npcHp: number,
  npcMaxHp: number,
): boolean {
  switch (pattern) {
    case 'aggressive': return true;
    case 'berserk': return true;
    case 'defensive': return wasAttackedThisTurn;
    case 'ambush': return true; // ambush: always attacks (first round is surprise — handled by caller)
    case 'retreating': return npcHp / npcMaxHp > 0.25;
  }
}

/**
 * Resolve NPC attack against the player.
 * NPC roll: D20 + npc.attack + berserkBonus vs 10 + player.AGI + player.DEF + randomLCK
 */
export function resolveNPCAttack(
  npcAttack: number,
  npcPattern: AggressionPattern,
  npcHp: number,
  npcMaxHp: number,
  playerStats: StatBlock,
  equippedArmorValue: number,
  difficultyDamageMultiplier: number,
  rng: RngFn = defaultRng,
): NPCAttackResult {
  const npcRoll = rollD20(rng);
  const berserkBonus = calculateBerserkBonus(npcPattern, npcHp, npcMaxHp);
  const npcTotal = npcRoll + npcAttack + berserkBonus;

  const luckBonus = rollLuckBonus(playerStats.LCK, rng);
  const playerDefense = BALANCE.COMBAT.NPC_HIT_BASE_DC +
    playerStats.AGI + playerStats.DEF + luckBonus;

  // NPC must beat (strict >) player defense
  if (npcTotal <= playerDefense) {
    return { hit: false, dodged: false, damageDealt: 0, berserkBonus };
  }

  // Passive dodge check
  if (rollPassiveDodge(playerStats.AGI, rng)) {
    return { hit: false, dodged: true, damageDealt: 0, berserkBonus };
  }

  // Damage calculation
  let damage = Math.max(1, (npcAttack + berserkBonus) - playerStats.DEF - equippedArmorValue);
  damage = Math.max(1, Math.floor(damage * difficultyDamageMultiplier));

  return { hit: true, dodged: false, damageDealt: damage, berserkBonus };
}

// === FLEE ===

/**
 * Attempt to flee combat.
 * Roll: D20 + AGI + randomLCK vs npc.fleeDC.
 * Success: combat ends, no parting attack.
 * Failure: NPC gets a free attack.
 */
export function attemptFlee(
  playerStats: StatBlock,
  npc: CombatNPCState,
  equippedArmorValue: number,
  difficultyDamageMultiplier: number,
  rng: RngFn = defaultRng,
): FleeResult {
  const roll = rollCheck('AGI', playerStats.AGI, playerStats.LCK, npc.fleeDC, 0, rng);

  if (roll.success) {
    return { success: true, roll, npcFreeAttack: null };
  }

  // Failed flee: NPC gets free attack
  const freeAttack = resolveNPCAttack(
    npc.attack, npc.aggressionPattern, npc.hp, npc.maxHp,
    playerStats, equippedArmorValue, difficultyDamageMultiplier, rng,
  );

  return { success: false, roll, npcFreeAttack: freeAttack };
}

/**
 * Attempt a partial retreat (back off without ending combat).
 * Easier than fleeing (DC reduced by RETREAT_DC_REDUCTION), but no free attack on failure.
 * Success gives the player distance — they stay in combat but gain breathing room.
 */
export function attemptRetreat(
  playerStats: StatBlock,
  npc: CombatNPCState,
  rng: RngFn = defaultRng,
): RetreatResult {
  const retreatDC = Math.max(1, npc.fleeDC - BALANCE.COMBAT.RETREAT_DC_REDUCTION);
  const roll = rollCheck('AGI', playerStats.AGI, playerStats.LCK, retreatDC, 0, rng);
  return { success: roll.success, roll };
}

// === WEAK POINT DISCOVERY ===

/**
 * Check if a weak point should auto-discover this round.
 */
export function checkWeakPointAutoDiscover(combatRound: number): boolean {
  return combatRound >= BALANCE.COMBAT.WEAK_POINT_AUTO_DISCOVER_ROUND;
}

/**
 * Check if a weak point hint should be shown.
 */
export function shouldShowWeakPointHint(combatRound: number): boolean {
  return combatRound >= BALANCE.COMBAT.WEAK_POINT_HINT_ROUND;
}

/**
 * Check if a verb can discover a weak point (EXAMINE, SCAN).
 */
export function canDiscoverWeakPoint(
  verb: VerbId,
  weakPoint: WeakPoint,
  hasScannerTool: boolean,
): boolean {
  if (verb === 'EXAMINE' && weakPoint.discoverMethod === 'examine') return true;
  if (verb === 'SCAN' && hasScannerTool) {
    return weakPoint.discoverMethod === 'scan' || weakPoint.discoverMethod === 'examine';
  }
  return false;
}
