import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { StatusBar } from './StatusBar';
import { NarrativePanel } from './NarrativePanel';
import { SuggestionButtons } from './SuggestionButtons';
import { CustomActionInput } from './CustomActionInput';
import { DiceRoll } from './DiceRoll';
import { QuickActions } from './QuickActions';
import { MapModal } from './MapModal';
import { InventoryModal } from './InventoryModal';
import type { DiceResult } from '../types/game';

export function GameScreen() {
  const phase = useGameStore((state) => state.phase);
  const gameState = useGameStore((state) => state.gameState);
  const isLoading = useGameStore((state) => state.isLoading);
  const isGenerating = useGameStore((state) => state.isGenerating);
  const error = useGameStore((state) => state.error);
  const generateScenario = useGameStore((state) => state.generateScenario);
  const processAction = useGameStore((state) => state.processAction);
  const narrateOutcome = useGameStore((state) => state.narrateOutcome);
  const setPhase = useGameStore((state) => state.setPhase);
  const setNarrative = useGameStore((state) => state.setNarrative);
  const setError = useGameStore((state) => state.setError);

  const [narrativeComplete, setNarrativeComplete] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // Generate scenario when entering scenario-generation phase
  useEffect(() => {
    if (phase === 'scenario-generation' && gameState && !isGenerating) {
      generateScenario();
    }
  }, [phase, gameState, isGenerating, generateScenario]);

  const handleAction = useCallback(async (action: string) => {
    setNarrativeComplete(false);
    await processAction(action);
  }, [processAction]);

  const handleDiceComplete = useCallback(async (result: DiceResult) => {
    await narrateOutcome(result);
  }, [narrateOutcome]);

  const handleRetry = useCallback(() => {
    setError(null);
    if (phase === 'scenario-generation') {
      generateScenario();
    }
  }, [setError, phase, generateScenario]);

  // Game over check
  useEffect(() => {
    if (gameState && gameState.player.hp <= 0) {
      setPhase('game-over');
      setNarrative(`
GAME OVER

Votre aventure prend fin ici. L'obscurité vous a finalement rattrapé.

Les ténèbres du vide vous engloutissent...

[Appuyez sur le bouton pour recommencer]
      `);
    }
  }, [gameState?.player.hp, setPhase, setNarrative]);

  // Scenario generation loading screen
  if (phase === 'scenario-generation') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[var(--color-void)] p-6 text-center">
        <div className="text-6xl mb-6 animate-pulse">🌑</div>
        <h2 className="text-xl font-bold text-[var(--color-text-bright)] mb-4">
          Génération du scénario...
        </h2>
        <p className="text-sm text-[var(--color-text-dim)] mb-6">
          L'IA crée un univers unique pour vous.
          <br />
          Cela peut prendre quelques instants.
        </p>

        {isGenerating && (
          <div className="w-48 h-2 bg-[var(--color-steel)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-accent)] animate-pulse w-3/4"></div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-900/30 rounded-lg border border-red-700">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              className="btn bg-[var(--color-accent)] text-white px-4"
              onClick={handleRetry}
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'game-over') {
    return (
      <div className="flex flex-col h-full">
        <NarrativePanel />
        <div className="p-4 bg-[var(--color-steel)]">
          <button
            className="w-full btn bg-[var(--color-accent)] text-white"
            onClick={() => useGameStore.getState().reset()}
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <NarrativePanel onNarrativeComplete={() => setNarrativeComplete(true)} />

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-900/30 rounded-lg border border-red-700">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            className="text-xs text-red-300 underline mt-1"
            onClick={() => setError(null)}
          >
            Ignorer
          </button>
        </div>
      )}

      {/* Quick actions bar - always visible during play */}
      {(phase === 'playing' || phase === 'dice-roll') && (
        <QuickActions
          onMapClick={() => setShowMap(true)}
          onInventoryClick={() => setShowInventory(true)}
        />
      )}

      {phase === 'dice-roll' && <DiceRoll onComplete={handleDiceComplete} />}

      {phase === 'playing' && narrativeComplete && !isLoading && (
        <>
          <SuggestionButtons onSelect={handleAction} disabled={isLoading} />
          <CustomActionInput onSubmit={handleAction} disabled={isLoading} />
        </>
      )}

      {/* Loading indicator */}
      {isLoading && phase === 'playing' && (
        <div className="p-4 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[var(--color-text-dim)] mt-2">Traitement en cours...</p>
        </div>
      )}

      {/* Modals */}
      <MapModal isOpen={showMap} onClose={() => setShowMap(false)} />
      <InventoryModal isOpen={showInventory} onClose={() => setShowInventory(false)} />
    </div>
  );
}
