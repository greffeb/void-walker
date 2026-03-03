// ---------------------------------------------------------------------------
// src/ui/screens/TitleScreen.tsx — Main menu with Cassette Futurism style
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { useSaveLoad } from '../hooks/useGame';
import { formatTimestamp } from '../utils/formatters';
import '../styles/globals.css';

const CLASS_LABELS: Record<string, string> = {
  marine: 'Marine',
  engineer: 'Ingénieur',
  medic: 'Médecin',
};

export function TitleScreen(): JSX.Element {
  const setScreen = useGameStore(s => s.setScreen);
  const quickStart = useGameStore(s => s.quickStart);
  const { saveSlots, loadGameFromSlot, refreshSaveSlots } = useSaveLoad();

  useEffect(() => {
    void refreshSaveSlots();
  }, [refreshSaveSlots]);

  const autoSave = saveSlots.find(s => s.slot === 0);
  const hasSaves = saveSlots.length > 0;

  const handleNewGame = (): void => {
    setScreen('creation');
  };

  const handleQuickStart = (): void => {
    quickStart();
  };

  const handleContinue = (): void => {
    if (autoSave) {
      void loadGameFromSlot(0);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        padding: '16px',
        background: 'var(--bg-deep)',
      }}
    >
      {/* Title */}
      <h1
        className="crt-glow-strong"
        style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'clamp(24px, 8vw, 48px)',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--amber-glow)',
          marginBottom: '12px',
          textAlign: 'center',
        }}
      >
        VOID WALKER
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          fontStyle: 'italic',
          color: 'var(--amber-dim)',
          marginBottom: '40px',
          textAlign: 'center',
          maxWidth: '300px',
          lineHeight: 1.6,
        }}
      >
        &laquo;&nbsp;Dans le vide, personne ne vous entend lancer un D20.&nbsp;&raquo;
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
        <button
          type="button"
          className="btn-console"
          onClick={handleNewGame}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '13px',
            borderColor: 'var(--amber-glow)',
          }}
        >
          NOUVELLE PARTIE
        </button>

        <button
          type="button"
          className="btn-console"
          onClick={handleQuickStart}
          style={{ width: '100%', padding: '14px', fontSize: '13px' }}
        >
          DÉMARRAGE RAPIDE
          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            classe + stats aléatoires
          </span>
        </button>

        <button
          type="button"
          className="btn-console"
          onClick={handleContinue}
          disabled={!autoSave}
          style={{ width: '100%', padding: '14px', fontSize: '13px' }}
        >
          CONTINUER
          {autoSave && (
            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {autoSave.meta.playerName} — {CLASS_LABELS[autoSave.meta.className] ?? autoSave.meta.className}
              {' '}— Tour {autoSave.meta.turn}
            </span>
          )}
        </button>

        {hasSaves && saveSlots.length > 1 && (
          <div
            style={{
              border: '1px solid var(--amber-dim)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-panel)',
              padding: '8px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CHARGER PARTIE
            </div>
            {saveSlots.map(slot => (
              <button
                key={slot.slot}
                type="button"
                className="btn-console"
                onClick={() => void loadGameFromSlot(slot.slot)}
                style={{ width: '100%', marginBottom: '4px', padding: '8px', fontSize: '11px', textAlign: 'left' }}
              >
                Slot {slot.slot} — {slot.meta.playerName} ({CLASS_LABELS[slot.meta.className] ?? slot.meta.className})
                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-system)' }}>
                  Tour {slot.meta.turn} — {formatTimestamp(slot.timestamp)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Version */}
      <p
        style={{
          position: 'absolute',
          bottom: '16px',
          fontSize: '10px',
          color: 'var(--text-system)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        v0.7.0
      </p>
    </div>
  );
}
