import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { hasSaves } from '../services/storage';
import { SaveLoadModal } from './SaveLoadModal';
import { OptionsMenu } from './OptionsMenu';
import type { SessionType } from '../services/prompts';

export function TitleScreen() {
  const setPhase = useGameStore((state) => state.setPhase);
  const apiKey = useGameStore((state) => state.apiKey);
  const loadApiKey = useGameStore((state) => state.loadApiKey);
  const sessionType = useGameStore((state) => state.sessionType);
  const setSessionType = useGameStore((state) => state.setSessionType);
  const refreshSaves = useGameStore((state) => state.refreshSaves);

  const [hasSavedGames, setHasSavedGames] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    // Load API key from storage
    loadApiKey();

    // Check for saved games
    checkSaves();
  }, [loadApiKey]);

  const checkSaves = async () => {
    const exists = await hasSaves();
    setHasSavedGames(exists);
    if (exists) {
      refreshSaves();
    }
  };

  const handleStart = () => {
    if (apiKey) {
      setPhase('character-creation');
    } else {
      setPhase('api-key-setup');
    }
  };

  const handleContinue = () => {
    setShowSaveModal(true);
  };

  const sessionOptions: { type: SessionType; label: string; desc: string }[] = [
    { type: 'quick', label: 'Rapide', desc: '5 min' },
    { type: 'standard', label: 'Standard', desc: '30 min' },
    { type: 'extended', label: 'Longue', desc: '2h' },
  ];

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
      <p className="text-[var(--color-text-dim)] mb-6 max-w-xs">
        Une expérience narrative unique, générée par IA.
        Chaque partie est différente.
      </p>

      {/* Session Type Selector */}
      <div className="mb-6 w-full max-w-xs">
        <p className="text-xs text-[var(--color-text-dim)] mb-2">Durée de session</p>
        <div className="flex gap-2">
          {sessionOptions.map(({ type, label, desc }) => (
            <button
              key={type}
              className={`flex-1 btn text-xs py-2 ${
                sessionType === type
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-steel)] text-[var(--color-text)]'
              }`}
              onClick={() => setSessionType(type)}
            >
              <div>{label}</div>
              <div className="text-[10px] opacity-70">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3 w-full max-w-xs">
        {/* New Game Button */}
        <button
          className="w-full btn bg-[var(--color-accent)] text-white px-8"
          onClick={handleStart}
        >
          Nouvelle partie
        </button>

        {/* Continue Button (if saves exist) */}
        {hasSavedGames && (
          <button
            className="w-full btn bg-[var(--color-steel)] text-[var(--color-text)] px-8"
            onClick={handleContinue}
          >
            Continuer
          </button>
        )}

        {/* Options Button */}
        <button
          className="w-full btn bg-[var(--color-void)] text-[var(--color-text-dim)] text-sm"
          onClick={() => setShowOptions(true)}
        >
          Options
        </button>
      </div>

      {/* API Key status */}
      <p className="text-xs text-[var(--color-text-dim)] mt-6">
        {apiKey ? (
          <span className="text-[var(--color-success)]">✓ Clé API configurée</span>
        ) : (
          <span>Configuration requise</span>
        )}
      </p>

      {/* Version info */}
      <div className="absolute bottom-4 text-xs text-[var(--color-text-dim)]">
        PWA v0.2.0 • Powered by Gemini
      </div>

      {/* Modals */}
      <SaveLoadModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} />
      <OptionsMenu isOpen={showOptions} onClose={() => setShowOptions(false)} />
    </div>
  );
}
