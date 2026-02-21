import { useState } from 'react';

interface CustomActionInputProps {
  onSubmit: (action: string) => void;
  disabled?: boolean;
}

export function CustomActionInput({ onSubmit, disabled }: CustomActionInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setValue('');
    }
  };

  if (!isExpanded) {
    return (
      <div className="p-3 bg-[var(--color-steel)] border-t border-[var(--color-panel)]">
        <button
          className="w-full btn bg-[var(--color-void)] border border-dashed
                     border-[var(--color-text-dim)] text-[var(--color-text-dim)]
                     hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
        >
          💬 Action personnalisée...
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 bg-[var(--color-steel)] border-t border-[var(--color-panel)]">
      <div className="flex flex-col gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Que faites-vous ?"
          className="w-full p-3 bg-[var(--color-void)] border border-[var(--color-panel)]
                     rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-dim)]
                     focus:outline-none focus:border-[var(--color-accent)]
                     resize-none min-h-[80px]"
          autoFocus
          disabled={disabled}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 btn bg-[var(--color-void)] border border-[var(--color-text-dim)]
                       text-[var(--color-text-dim)]"
            onClick={() => {
              setIsExpanded(false);
              setValue('');
            }}
          >
            Annuler
          </button>
          <button
            className="flex-1 btn bg-[var(--color-accent)] text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
