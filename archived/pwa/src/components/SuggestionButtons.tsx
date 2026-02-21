import { useGameStore } from '../stores/gameStore';

interface SuggestionButtonsProps {
  onSelect: (action: string) => void;
  disabled?: boolean;
}

export function SuggestionButtons({ onSelect, disabled }: SuggestionButtonsProps) {
  const suggestions = useGameStore((state) => state.suggestions);

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-[var(--color-steel)] border-t border-[var(--color-panel)]">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          className="btn bg-[var(--color-panel)] hover:bg-[var(--color-accent)]/20
                     border border-[var(--color-accent)]/30 text-left
                     disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
        >
          <span className="text-[var(--color-accent)] mr-2">{index + 1}.</span>
          {suggestion}
        </button>
      ))}
    </div>
  );
}
