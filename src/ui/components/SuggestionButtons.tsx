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
              fontSize: '12px',
              fontWeight: 600,
              color: disabled ? 'var(--text-system)' : 'var(--amber-mid)',
              background: 'var(--bg-surface)',
              border: '2px solid var(--amber-dim)',
              borderBottomWidth: disabled ? '2px' : '3px',
              borderRadius: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'all 100ms',
              textTransform: 'uppercase',
            }}
            onMouseEnter={e => {
              if (!disabled) {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-glow)';
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--bg-input)';
              }
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-dim)';
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface)';
              (e.target as HTMLButtonElement).style.borderBottomWidth = '3px';
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
            onMouseDown={e => {
              if (!disabled) {
                (e.target as HTMLButtonElement).style.borderBottomWidth = '2px';
                (e.target as HTMLButtonElement).style.transform = 'translateY(1px)';
              }
            }}
            onMouseUp={e => {
              if (!disabled) {
                (e.target as HTMLButtonElement).style.borderBottomWidth = '3px';
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              }
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
