// ---------------------------------------------------------------------------
// src/ui/components/DiceAnimation.tsx — Full dice roll animation sequence
// ---------------------------------------------------------------------------

import { useDiceAnimation } from '../hooks/useDiceAnimation';
import { GlitchEffect } from './GlitchEffect';
import type { DiceResult } from '@engine/types';

interface DiceAnimationProps {
  readonly diceResult: DiceResult;
  readonly onComplete: () => void;
}

const STAT_LABELS: Record<string, string> = {
  FOR: 'FORCE',
  DEF: 'DÉFENSE',
  AGI: 'AGILITÉ',
  INT: 'INTELLIGENCE',
  PER: 'PERCEPTION',
  CHA: 'CHARISME',
  LCK: 'CHANCE',
};

export function DiceAnimation({ diceResult, onComplete }: DiceAnimationProps): JSX.Element {
  const { phase, displayedNumber } = useDiceAnimation({
    diceResult,
    onComplete,
  });

  const { stat, modifier, difficulty, natural, success, critical, fumble } = diceResult;
  const statLabel = STAT_LABELS[stat] ?? stat;
  const modStr = modifier >= 0 ? `+ ${modifier}` : `− ${Math.abs(modifier)}`;

  // Colors based on result
  let numberColor = 'var(--amber-glow)';
  let flashClass = '';
  let resultText = '';

  if (phase === 'result') {
    if (critical) {
      numberColor = 'var(--crit-gold)';
      flashClass = 'animate-flash-crit';
      resultText = 'CRITIQUE !';
    } else if (fumble) {
      numberColor = 'var(--danger)';
      flashClass = 'animate-flash-failure';
      resultText = 'FUMBLE !';
    } else if (success) {
      numberColor = 'var(--success)';
      flashClass = 'animate-flash-success';
      resultText = 'SUCCÈS';
    } else {
      numberColor = 'var(--danger)';
      flashClass = 'animate-flash-failure';
      resultText = 'ÉCHEC';
    }
  }

  const isFumble = phase === 'result' && fumble;

  return (
    <GlitchEffect active={isFumble} duration={500}>
      <div
        className={flashClass}
        style={{
          position: 'absolute',
          inset: 0,
          top: '48px', // Below StatusBar
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(5, 5, 5, 0.92)',
          zIndex: 100,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Phase 1: DC Display */}
        {phase === 'dc_display' && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--amber-mid)', marginBottom: '8px', letterSpacing: '0.1em' }}>
              {statLabel} {modStr}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase' }}>
              DIFFICULTÉ
            </div>
            <div
              className="crt-glow-strong"
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: '64px',
                fontWeight: 700,
                color: 'var(--amber-glow)',
                letterSpacing: '0.1em',
              }}
            >
              {difficulty}
            </div>
          </div>
        )}

        {/* Phase 2: Rolling */}
        {phase === 'rolling' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              DIFFICULTÉ: {difficulty}
            </div>
            <div
              style={{
                width: '100px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--amber-dim)',
                borderRadius: '4px',
                margin: '0 auto 16px',
              }}
              className="animate-pulse-amber"
            >
              <span
                className="crt-glow"
                style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '48px',
                  fontWeight: 700,
                  color: 'var(--amber-glow)',
                }}
              >
                {displayedNumber}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--amber-mid)' }}>
              {statLabel} {modStr}
            </div>
          </div>
        )}

        {/* Phase 3: Result */}
        {phase === 'result' && (
          <div style={{ textAlign: 'center' }} className="animate-fade-in">
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              DIFFICULTÉ: {difficulty}
            </div>
            <div
              className={`crt-glow-strong ${critical ? 'animate-dice-pulse' : ''} ${fumble ? 'animate-glitch-rgb' : ''}`}
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: '64px',
                fontWeight: 700,
                color: numberColor,
                marginBottom: '12px',
              }}
            >
              {natural}
            </div>
            <div
              className={critical ? 'animate-shake' : ''}
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: numberColor,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              {resultText}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-system)', marginTop: '8px' }}>
              {natural} {modStr} = {natural + modifier} vs {difficulty}
            </div>
          </div>
        )}
      </div>
    </GlitchEffect>
  );
}
