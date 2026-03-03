// ---------------------------------------------------------------------------
// src/ui/utils/formatters.ts — Display helpers for the UI
// ---------------------------------------------------------------------------

import { ITEM_DEFINITIONS } from '@content/items';
import { t } from '@i18n/index';
import type { StringKey } from '@i18n/types';
import type { ConditionId } from '@engine/types';

/** Translate a string key safely. */
export function ts(key: string): string {
  return t(key as StringKey);
}

/** Build an ASCII HP bar: ████░░░░ */
export function hpBar(hp: number, maxHp: number, width = 10): string {
  const filled = Math.max(0, Math.round((hp / maxHp) * width));
  return '\u2588'.repeat(filled) + '\u2591'.repeat(Math.max(0, width - filled));
}

/** HP color class based on percentage. */
export function hpColor(hp: number, maxHp: number): string {
  const pct = hp / maxHp;
  if (pct > 0.6) return 'var(--success)';
  if (pct > 0.3) return 'var(--warning)';
  return 'var(--danger)';
}

/** Stat bar for character creation: ████░░ 4/6 */
export function statBar(value: number, max = 6): string {
  const filled = Math.max(0, Math.min(value, max));
  return '\u2588'.repeat(filled) + '\u2591'.repeat(max - filled) + ` ${value}/${max}`;
}

/** Translate an inventory item ID to its French name. */
export function itemName(id: string): string {
  const def = ITEM_DEFINITIONS[id];
  return def ? ts(def.nameKey) : id;
}

/** Condition emoji map. */
const CONDITION_EMOJI: Record<ConditionId, string> = {
  wounded: '🩸',
  poisoned: '☣',
  cold: '❄',
  exhausted: '😓',
  terrified: '😱',
};

export function conditionEmoji(id: ConditionId): string {
  return CONDITION_EMOJI[id] ?? '⚠';
}

/** Format O2 as a compact bar. */
export function o2Bar(oxygen: number, width = 6): string {
  const filled = Math.max(0, Math.round((oxygen / 100) * width));
  return '\u25C9'.repeat(filled) + '\u25CB'.repeat(Math.max(0, width - filled));
}

/** Format a timestamp to a date string. */
export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
