// ---------------------------------------------------------------------------
// src/ui/screens/PlaytestRepl.tsx — Web REPL for parser & combat testing
// ---------------------------------------------------------------------------
// Mobile-friendly terminal interface. Touch-optimized: big input, auto-scroll.
// ---------------------------------------------------------------------------

import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { useReplEngine, type ReplLine } from '../hooks/useReplEngine';

// === LINE COLORS ===

function lineColor(type: ReplLine['type']): string {
  switch (type) {
    case 'system': return 'text-purple-400';
    case 'input': return 'text-gray-400';
    case 'success': return 'text-green-400';
    case 'error': return 'text-red-400';
    case 'warning': return 'text-yellow-400';
    case 'combat': return 'text-orange-400';
    case 'dice': return 'text-cyan-400';
    case 'info':
    default: return 'text-gray-300';
  }
}

// === COMPONENT ===

export function PlaytestRepl(): JSX.Element {
  const { state, submitInput } = useReplEngine();
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [state.lines.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (): void => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      const next = [...prev, trimmed];
      return next.length > 50 ? next.slice(-50) : next;
    });
    setHistoryIndex(-1);
    submitInput(trimmed);
    setInputValue('');

    // Refocus after submit (mobile keyboards can lose focus)
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInputValue(history[newIndex] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= history.length) {
        setHistoryIndex(-1);
        setInputValue('');
      } else {
        setHistoryIndex(newIndex);
        setInputValue(history[newIndex] ?? '');
      }
    }
  };

  // Mode indicator
  const modeLabel = state.mode === 'combat' ? '⚔ COMBAT' : state.mode === 'exploration' ? '◈ EXPLORATION' : '◉ TITRE';
  const modeColor = state.mode === 'combat' ? 'text-red-400' : state.mode === 'exploration' ? 'text-green-400' : 'text-purple-400';

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--color-void-black)]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="font-mono text-sm font-bold text-gray-400">VOID WALKER</span>
        <span className={`font-mono text-xs font-bold ${modeColor}`}>{modeLabel}</span>
        {state.character && (
          <span className="font-mono text-xs text-gray-500">
            PV:{state.character.hp}/{state.character.maxHp}
          </span>
        )}
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {state.lines.map((ln, i) => (
          <div key={i} className={`${lineColor(ln.type)} whitespace-pre-wrap break-words`}>
            {ln.text || '\u00a0'}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 bg-[var(--color-void-dark)] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-purple-400">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none bg-transparent font-mono text-sm text-white outline-none placeholder:text-gray-600"
            placeholder="Tapez une commande..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="send"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-purple-700 px-3 py-1 font-mono text-xs font-bold text-white active:bg-purple-600"
          >
            ↵
          </button>
        </div>
      </div>
    </div>
  );
}
