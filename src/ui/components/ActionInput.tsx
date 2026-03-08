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
        border: '2px solid var(--amber-glow)',
        background: 'var(--bg-panel)',
        padding: '5px 10px',
        margin: '0 12px 8px',
        flexShrink: 0,
      }}
    >
      <span style={{ marginRight: '10px', color: 'var(--amber-glow)', fontSize: '22px', lineHeight: '40px' }}>&gt;</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="_"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          flex: 1,
          padding: '8px 0',
          fontFamily: 'var(--font-mono)',
          fontSize: '22px',
          color: disabled ? 'var(--text-system)' : 'var(--amber-glow)',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
          textShadow: '0 0 4px rgba(255, 176, 0, 0.4)',
        }}
      />
    </div>
  );
}
