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
        gap: '12px',
        padding: '6px 12px 10px',
        flexShrink: 0,
      }}
    >
      {suggestions.slice(0, 2).map((s, i) => {
        const label = `${s.verbText} ${s.targetText}`;
        return (
          <button
            key={i}
            type="button"
            className="btn-console"
            onClick={() => onSelect(s)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '12px 10px',
              fontSize: '20px',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
