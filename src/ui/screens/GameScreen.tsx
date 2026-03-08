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
    pendingDifficultyBreakdown,
    hasSeenFullAnimation,
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

      {/* Navigation Bar (modals) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          padding: '8px 12px 12px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => openModal('map')}
          style={{
            background: 'transparent',
            color: activeModal === 'map' ? 'var(--amber-glow)' : 'var(--amber-dim)',
            border: '2px solid',
            borderColor: activeModal === 'map' ? 'var(--amber-glow)' : 'var(--amber-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            padding: '6px 16px',
            cursor: 'pointer',
            transition: 'all 100ms',
            textShadow: activeModal === 'map' ? '0 0 5px var(--amber-glow)' : 'none',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.color = 'var(--amber-glow)';
            (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-glow)';
            (e.target as HTMLButtonElement).style.background = 'rgba(255, 176, 0, 0.1)';
          }}
          onMouseLeave={e => {
            if (activeModal !== 'map') {
              (e.target as HTMLButtonElement).style.color = 'var(--amber-dim)';
              (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-dim)';
            }
            (e.target as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          ❖ CARTE
        </button>
        <button
          type="button"
          onClick={() => openModal('inventory')}
          style={{
            background: 'transparent',
            color: activeModal === 'inventory' ? 'var(--amber-glow)' : 'var(--amber-dim)',
            border: '2px solid',
            borderColor: activeModal === 'inventory' ? 'var(--amber-glow)' : 'var(--amber-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            padding: '6px 16px',
            cursor: 'pointer',
            transition: 'all 100ms',
            textShadow: activeModal === 'inventory' ? '0 0 5px var(--amber-glow)' : 'none',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.color = 'var(--amber-glow)';
            (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-glow)';
            (e.target as HTMLButtonElement).style.background = 'rgba(255, 176, 0, 0.1)';
          }}
          onMouseLeave={e => {
            if (activeModal !== 'inventory') {
              (e.target as HTMLButtonElement).style.color = 'var(--amber-dim)';
              (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-dim)';
            }
            (e.target as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          ▤ INV
        </button>
        <button
          type="button"
          onClick={() => openModal('settings')}
          style={{
            background: 'transparent',
            color: activeModal === 'settings' ? 'var(--amber-glow)' : 'var(--amber-dim)',
            border: '2px solid',
            borderColor: activeModal === 'settings' ? 'var(--amber-glow)' : 'var(--amber-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            padding: '6px 16px',
            cursor: 'pointer',
            transition: 'all 100ms',
            textShadow: activeModal === 'settings' ? '0 0 5px var(--amber-glow)' : 'none',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.color = 'var(--amber-glow)';
            (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-glow)';
            (e.target as HTMLButtonElement).style.background = 'rgba(255, 176, 0, 0.1)';
          }}
          onMouseLeave={e => {
            if (activeModal !== 'settings') {
              (e.target as HTMLButtonElement).style.color = 'var(--amber-dim)';
              (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-dim)';
            }
            (e.target as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          ⚙ SYS
        </button>
      </div>

      {/* Dice Animation Overlay */}
      {isDiceAnimating && pendingDiceResult && pendingDifficultyBreakdown && (
        <DiceAnimation
          diceResult={pendingDiceResult}
          difficultyBreakdown={pendingDifficultyBreakdown}
          canSkip={hasSeenFullAnimation}
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
