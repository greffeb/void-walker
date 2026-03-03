// ---------------------------------------------------------------------------
// src/ui/screens/GameScreen.tsx — Main gameplay screen orchestrator
// ---------------------------------------------------------------------------

import { useGameStore } from '@stores/gameStore';
import { StatusBar } from '../components/StatusBar';
import { NarrativePanel } from '../components/NarrativePanel';
import { ActionInput } from '../components/ActionInput';
import { SuggestionButtons } from '../components/SuggestionButtons';
import { DiceAnimation } from '../components/DiceAnimation';
import { MapModal } from '../components/MapModal';
import { InventoryModal } from '../components/InventoryModal';
import { SettingsModal } from '../components/SettingsModal';

export function GameScreen(): JSX.Element {
  const {
    gameState,
    turnHistory,
    currentNarrative,
    welcomeNarrative,
    suggestions,
    isProcessingTurn,
    isDiceAnimating,
    pendingDiceResult,
    pendingTurnEntry,
    typewriterComplete,
    activeModal,
    error,
    submitAction,
    submitSuggestion,
    onDiceAnimationComplete,
    skipTypewriter,
    setTypewriterComplete,
    openModal,
    closeModal,
  } = useGameStore();

  const character = gameState.character;
  const inputDisabled = isProcessingTurn || isDiceAnimating || !typewriterComplete;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--bg-deep)',
        position: 'relative',
      }}
    >
      {/* Status Bar */}
      {character && (
        <StatusBar
          character={character}
          turn={gameState.turn}
          inCombat={gameState.activeCombat !== null}
        />
      )}

      {/* Narrative Panel */}
      <NarrativePanel
        turnHistory={turnHistory}
        currentNarrative={currentNarrative}
        welcomeNarrative={welcomeNarrative}
        typewriterComplete={typewriterComplete}
        pendingEntry={pendingTurnEntry}
        onSkip={skipTypewriter}
        onTypewriterDone={setTypewriterComplete}
      />

      {/* Error display */}
      {error && (
        <div
          style={{
            padding: '8px 12px',
            fontSize: '11px',
            color: 'var(--danger)',
            background: 'var(--danger-dim)',
            borderTop: '1px solid var(--danger)',
            fontFamily: 'var(--font-mono)',
            flexShrink: 0,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Suggestions */}
      {!isDiceAnimating && (
        <SuggestionButtons
          suggestions={suggestions}
          disabled={inputDisabled}
          onSelect={submitSuggestion}
        />
      )}

      {/* Action Input */}
      <ActionInput
        disabled={inputDisabled}
        onSubmit={submitAction}
      />

      {/* Action Bar (modals) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          padding: '6px 12px 10px',
          background: 'var(--bg-panel)',
          borderTop: '1px solid var(--amber-dim)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          className="btn-console"
          onClick={() => openModal('map')}
          style={{ padding: '6px 14px', fontSize: '10px' }}
        >
          ◈ CARTE
        </button>
        <button
          type="button"
          className="btn-console"
          onClick={() => openModal('inventory')}
          style={{ padding: '6px 14px', fontSize: '10px' }}
        >
          ◫ INV
        </button>
        <button
          type="button"
          className="btn-console"
          onClick={() => openModal('settings')}
          style={{ padding: '6px 14px', fontSize: '10px' }}
        >
          ⚙
        </button>
      </div>

      {/* Dice Animation Overlay */}
      {isDiceAnimating && pendingDiceResult && (
        <DiceAnimation
          diceResult={pendingDiceResult}
          onComplete={onDiceAnimationComplete}
        />
      )}

      {/* Modals */}
      {activeModal === 'map' && (
        <MapModal onClose={closeModal} />
      )}
      {activeModal === 'inventory' && (
        <InventoryModal onClose={closeModal} />
      )}
      {activeModal === 'settings' && (
        <SettingsModal onClose={closeModal} />
      )}
    </div>
  );
}
