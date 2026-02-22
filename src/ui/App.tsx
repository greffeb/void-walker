import { useState } from 'react';
import { PlaytestRepl } from './screens/PlaytestRepl';

export function App(): JSX.Element {
  const [started, setStarted] = useState(false);

  if (started) {
    return <PlaytestRepl />;
  }

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[var(--color-void-black)]">
      <h1 className="mb-2 font-mono text-4xl font-bold tracking-widest text-white">
        VOID WALKER
      </h1>
      <p className="mb-8 font-mono text-sm text-gray-500">
        Playtest REPL — Parser & Combat
      </p>
      <button
        type="button"
        onClick={() => setStarted(true)}
        className="rounded border border-purple-600 bg-transparent px-8 py-3 font-mono text-lg font-bold tracking-wider text-purple-400 transition-colors hover:bg-purple-900/30 active:bg-purple-800/50"
      >
        COMMENCER
      </button>
      <p className="mt-6 max-w-xs text-center font-mono text-xs text-gray-600">
        Phase 3 — Résolution & Combat
        <br />
        Tapez des commandes en français pour tester le parser, lancer des combats et résoudre des jets de dés.
      </p>
    </div>
  );
}
