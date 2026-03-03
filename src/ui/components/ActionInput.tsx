// ---------------------------------------------------------------------------
// src/ui/components/ActionInput.tsx — Text input + Enter button
// ---------------------------------------------------------------------------

import { useState, useRef, type KeyboardEvent } from 'react';

interface ActionInputProps {
  readonly disabled: boolean;
  readonly onSubmit: (input: string) => void;
}

export function ActionInput({ disabled, onSubmit }: ActionInputProps): JSX.Element {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (): void => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 12px',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--amber-dim)',
        flexShrink: 0,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Que faites-vous ?"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          flex: 1,
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          color: disabled ? 'var(--text-system)' : 'var(--amber-glow)',
          background: 'var(--bg-input)',
          border: '1px solid var(--amber-dim)',
          borderRadius: 'var(--radius)',
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 150ms',
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = 'var(--amber-glow)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--amber-dim)'; }}
      />

      <button
        type="button"
        className="btn-console"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        style={{
          padding: '10px 16px',
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        ▸
      </button>
    </div>
  );
}
