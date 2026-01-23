import { useGameStore } from '../stores/gameStore';

export function TitleScreen() {
  const setPhase = useGameStore((state) => state.setPhase);
  const apiKey = useGameStore((state) => state.apiKey);

  const handleStart = () => {
    if (apiKey) {
      setPhase('character-creation');
    } else {
      setPhase('api-key-setup');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[var(--color-void)] p-6 text-center">
      {/* Logo/Title */}
      <div className="mb-8">
        <div className="text-6xl mb-4">🌑</div>
        <h1 className="text-3xl font-bold tracking-wider text-[var(--color-accent)]">
          VOID WALKER
        </h1>
        <p className="text-sm text-[var(--color-text-dim)] mt-2">
          RPG spatial horrifique
        </p>
      </div>

      {/* Subtitle */}
      <p className="text-[var(--color-text-dim)] mb-8 max-w-xs">
        Une expérience narrative unique, générée par IA.
        Chaque partie est différente.
      </p>

      {/* Start button */}
      <button
        className="btn bg-[var(--color-accent)] text-white px-8 mb-4"
        onClick={handleStart}
      >
        Nouvelle partie
      </button>

      {/* API Key status */}
      <p className="text-xs text-[var(--color-text-dim)]">
        {apiKey ? (
          <span className="text-[var(--color-success)]">✓ Clé API configurée</span>
        ) : (
          <span>Configuration requise</span>
        )}
      </p>

      {/* Version info */}
      <div className="absolute bottom-4 text-xs text-[var(--color-text-dim)]">
        PWA v0.1.0 • Powered by Gemini
      </div>
    </div>
  );
}
