import type { DiceResult, StatName, Player, ActionType } from '../types/game';

/**
 * Roll a D20 (1-20)
 */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Get the relevant stat for an action type
 */
export function getRelevantStat(actionType: ActionType): StatName {
  const mapping: Record<ActionType, StatName> = {
    combat: 'FOR',
    exploration: 'FOR',
    technical: 'INT',
    social: 'CHA',
    other: 'INT'
  };
  return mapping[actionType];
}

/**
 * Calculate modifier from inventory items
 */
export function getItemModifier(player: Player, stat: StatName): number {
  return player.inventory
    .filter(item => item.statBonus?.stat === stat)
    .reduce((sum, item) => sum + (item.statBonus?.bonus ?? 0), 0);
}

/**
 * Perform a dice check
 * D20 + stat (1-5) + modifier vs difficulty (1-20)
 * Natural 1 = critical failure (always fails)
 * Natural 20 = critical success (always succeeds)
 */
export function rollCheck(
  statValue: number,
  modifier: number,
  difficulty: number,
  stat: StatName
): DiceResult {
  const roll = rollD20();
  const total = roll + statValue + modifier;

  // Natural 1 = critical failure (always fails)
  if (roll === 1) {
    return {
      roll,
      total,
      success: false,
      critical: true,
      stat,
      statValue,
      modifier,
      difficulty
    };
  }

  // Natural 20 = critical success (always succeeds)
  if (roll === 20) {
    return {
      roll,
      total,
      success: true,
      critical: true,
      stat,
      statValue,
      modifier,
      difficulty
    };
  }

  // Standard success check
  return {
    roll,
    total,
    success: total >= difficulty,
    critical: false,
    stat,
    statValue,
    modifier,
    difficulty
  };
}

/**
 * Award XP for a successful roll
 * 10 successes = +1 stat (max 5)
 */
export function awardXP(player: Player, stat: StatName): Player {
  const progress = { ...player.statProgress };
  progress[stat] = (progress[stat] ?? 0) + 1;

  // Level up: 10 successes = +1 stat (max 5)
  if (progress[stat] >= 10 && player.stats[stat] < 5) {
    return {
      ...player,
      stats: {
        ...player.stats,
        [stat]: player.stats[stat] + 1
      },
      statProgress: {
        ...progress,
        [stat]: 0 // Reset progress
      }
    };
  }

  return {
    ...player,
    statProgress: progress
  };
}

/**
 * Get difficulty description in French
 */
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 5) return 'Trivial';
  if (difficulty <= 8) return 'Facile';
  if (difficulty <= 12) return 'Moyen';
  if (difficulty <= 15) return 'Difficile';
  if (difficulty <= 18) return 'Très difficile';
  return 'Extrême';
}

/**
 * Get result description in French
 */
export function getResultLabel(result: DiceResult): string {
  if (result.critical && result.success) return 'SUCCÈS CRITIQUE !';
  if (result.critical && !result.success) return 'ÉCHEC CRITIQUE !';
  if (result.success) return 'Succès';
  return 'Échec';
}
