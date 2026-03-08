// ---------------------------------------------------------------------------
// src/ui/components/StatusBar.tsx — HP, O2, conditions, turn counter
// ---------------------------------------------------------------------------

import { hpBar, hpColor, o2Bar, conditionEmoji, ts } from '../utils/formatters';
import type { CharacterState } from '@engine/types';

interface StatusBarProps {
  readonly character: CharacterState;
  readonly turn: number;
  readonly inCombat: boolean;
}

export function StatusBar({ character, turn, inCombat }: StatusBarProps): JSX.Element {
  const { hp, maxHp, oxygen, conditions } = character;
  const pct = hp / maxHp;
  const showO2 = oxygen < 100;
  const lowHp = pct <= 0.3;

  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'var(--bg-panel)',
        borderBottom: '2px solid var(--amber-glow)',
        fontFamily: 'var(--font-mono)',
        fontSize: '18px',
        flexShrink: 0,
      }}
    >
      {/* Top row: HP + O2 + Turn */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* HP */}
        <span style={{ color: hpColor(hp, maxHp) }} className={lowHp ? 'animate-hp-low' : undefined}>
          ▼ {hp}/{maxHp} {hpBar(hp, maxHp, 10)}
        </span>

        {/* O2 */}
        {showO2 && (
          <span style={{ color: oxygen <= 20 ? 'var(--danger)' : 'var(--crt-orange)' }}>
            O₂ {o2Bar(oxygen)} {oxygen}%
          </span>
        )}

        {/* Combat indicator */}
        {inCombat && (
          <span style={{ color: 'var(--danger)' }}>⚔ COMBAT</span>
        )}

        {/* Turn */}
        <span style={{ marginLeft: 'auto', color: 'var(--text-system)' }}>T:{turn}</span>
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
          {conditions.slice(0, 3).map(c => (
            <span
              key={c.id}
              style={{
                fontSize: '16px',
                color: 'var(--crt-orange)',
                background: 'rgba(230, 90, 34, 0.1)',
                padding: '1px 6px',
                border: '1px solid rgba(230, 90, 34, 0.3)',
              }}
            >
              {conditionEmoji(c.id)} {ts(`condition.${c.id}`)}
              {c.remainingActions !== null && ` (${c.remainingActions})`}
            </span>
          ))}
          {conditions.length > 3 && (
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              +{conditions.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
