// ---------------------------------------------------------------------------
// src/ui/components/SuggestionButtons.tsx — 2 contextual suggestion buttons
// ---------------------------------------------------------------------------

import type { SuggestionCandidate } from '@engine/suggestions';

interface SuggestionButtonsProps {
  readonly suggestions: readonly SuggestionCandidate[];
  readonly disabled: boolean;
  readonly onSelect: (s: SuggestionCandidate) => void;
}

export function SuggestionButtons({
  suggestions,
  disabled,
  onSelect,
}: SuggestionButtonsProps): JSX.Element | null {
  if (suggestions.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '4px 12px 8px',
        flexShrink: 0,
      }}
    >
      {suggestions.slice(0, 2).map((s, i) => {
        const label = `${s.verbText} ${s.targetText}`;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(s)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: disabled ? 'var(--text-system)' : 'var(--amber-mid)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--amber-dim)',
              borderRadius: 'var(--radius)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'border-color 150ms',
              textTransform: 'none',
            }}
            onMouseEnter={e => { if (!disabled) (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-glow)'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-dim)'; }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
