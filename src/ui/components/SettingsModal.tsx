// ---------------------------------------------------------------------------
// src/ui/components/SettingsModal.tsx — Settings / pause modal
// ---------------------------------------------------------------------------
// Options: save manually, narration verbosity (future), quit to title.
// Audio toggle placeholder for Phase 9.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { Modal } from './Modal';

interface Props {
  readonly onClose: () => void;
}

export function SettingsModal({ onClose }: Props): JSX.Element {
  const saveGameToSlot = useGameStore((s) => s.saveGameToSlot);
  const restart = useGameStore((s) => s.restart);
  const gameState = useGameStore((s) => s.gameState);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmQuit, setConfirmQuit] = useState(false);

  async function handleSave(): Promise<void> {
    setSaveStatus('saving');
    try {
      await saveGameToSlot(0);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  function handleQuit(): void {
    if (!confirmQuit) {
      setConfirmQuit(true);
      return;
    }
    restart();
  }

  return (
    <Modal title="PARAMÈTRES" icon="⚙" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Game info */}
        <Section title="PARTIE">
          <InfoRow label="Tour" value={String(gameState.turn)} />
          <InfoRow label="Difficulté" value={difficultyLabel(gameState.difficulty)} />
          <InfoRow label="Personnage" value={gameState.character?.name ?? '—'} />
        </Section>

        {/* Save */}
        <Section title="SAUVEGARDE">
          <button
            type="button"
            className="btn-console"
            onClick={() => void handleSave()}
            disabled={saveStatus === 'saving'}
            style={{ width: '100%', padding: '10px' }}
          >
            {saveStatus === 'idle' && '▸ SAUVEGARDER'}
            {saveStatus === 'saving' && '⏳ SAUVEGARDE…'}
            {saveStatus === 'saved' && '✓ SAUVEGARDÉ'}
            {saveStatus === 'error' && '✕ ERREUR'}
          </button>
          <p style={{ fontSize: '16px', color: 'var(--amber-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            Sauvegarde dans l'emplacement automatique (slot 0).
          </p>
        </Section>

        {/* Audio placeholder */}
        <Section title="AUDIO">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              fontFamily: 'var(--font-mono)',
              fontSize: '18px',
              color: 'var(--amber-dim)',
              borderBottom: '1px dashed #333',
            }}
          >
            <span>Effets sonores</span>
            <span style={{ opacity: 0.5 }}>BIENTÔT</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              fontFamily: 'var(--font-mono)',
              fontSize: '18px',
              color: 'var(--amber-dim)',
            }}
          >
            <span>Musique</span>
            <span style={{ opacity: 0.5 }}>BIENTÔT</span>
          </div>
        </Section>

        {/* Quit */}
        <Section title="QUITTER">
          <button
            type="button"
            className="btn-console btn-danger"
            onClick={handleQuit}
            style={{ width: '100%', padding: '10px' }}
          >
            {confirmQuit ? '⚠ CONFIRMER — QUITTER SANS SAUVEGARDER' : '✕ RETOUR AU MENU'}
          </button>
          {confirmQuit && (
            <button
              type="button"
              className="btn-console"
              onClick={() => setConfirmQuit(false)}
              style={{ width: '100%', padding: '8px', marginTop: '6px' }}
            >
              ANNULER
            </button>
          )}
        </Section>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div
      style={{
        border: '2px solid var(--amber-dim)',
        padding: '12px',
        position: 'relative',
        marginTop: '8px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '10px',
          background: 'var(--bg-deep)',
          padding: '0 6px',
          fontSize: '16px',
          letterSpacing: '0.15em',
          color: 'var(--amber-glow)',
          fontFamily: 'var(--font-title)',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        fontFamily: 'var(--font-mono)',
        fontSize: '18px',
        borderBottom: '1px dashed #333',
      }}
    >
      <span style={{ color: 'var(--amber-dim)' }}>{label}</span>
      <span style={{ color: 'var(--crt-cyan)' }}>{value}</span>
    </div>
  );
}

function difficultyLabel(d: string): string {
  switch (d) {
    case 'explorer': return 'Explorateur';
    case 'survivor': return 'Survivant';
    case 'nightmare': return 'Cauchemar';
    default: return d;
  }
}
