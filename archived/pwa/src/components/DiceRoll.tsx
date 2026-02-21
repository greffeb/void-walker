import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getDifficultyLabel, getResultLabel } from '../utils/dice';
import type { DiceResult } from '../types/game';

interface DiceRollProps {
  onComplete: (result: DiceResult) => void;
}

export function DiceRoll({ onComplete }: DiceRollProps) {
  const pendingRoll = useGameStore((state) => state.pendingDiceRoll);
  const gameState = useGameStore((state) => state.gameState);
  const performDiceRoll = useGameStore((state) => state.performDiceRoll);

  const [phase, setPhase] = useState<'intro' | 'rolling' | 'result'>('intro');
  const [displayNumber, setDisplayNumber] = useState(20);
  const [result, setResult] = useState<DiceResult | null>(null);

  // Rolling animation
  useEffect(() => {
    if (phase !== 'rolling') return;

    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= duration) {
        // Perform actual roll
        const actualResult = performDiceRoll();
        if (actualResult) {
          setResult(actualResult);
          setDisplayNumber(actualResult.roll);
          setPhase('result');
        }
        clearInterval(interval);
      } else {
        // Random numbers during animation
        setDisplayNumber(Math.floor(Math.random() * 20) + 1);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, performDiceRoll]);

  const handleRoll = () => {
    setPhase('rolling');
  };

  const handleContinue = () => {
    if (result) {
      onComplete(result);
    }
  };

  if (!pendingRoll || !gameState) return null;

  const difficultyLabel = getDifficultyLabel(pendingRoll.difficulty);
  const stat = pendingRoll.actionType === 'combat' || pendingRoll.actionType === 'exploration' ? 'FOR'
    : pendingRoll.actionType === 'technical' ? 'INT'
    : pendingRoll.actionType === 'social' ? 'CHA' : 'INT';
  const statValue = gameState.player.stats[stat];

  return (
    <div className="bg-[var(--color-steel)] border-t border-[var(--color-panel)] p-4">
      {/* Context - Why we're rolling */}
      <div className="mb-4 p-3 bg-[var(--color-void)] rounded-lg border border-[var(--color-panel)]">
        <p className="text-sm text-[var(--color-text-dim)] mb-1">Action :</p>
        <p className="text-[var(--color-text)]">{pendingRoll.action}</p>
      </div>

      {/* Roll info */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm">
          <span className="text-[var(--color-text-dim)]">Type : </span>
          <span className="text-[var(--color-accent)]">{pendingRoll.actionType.toUpperCase()}</span>
        </div>
        <div className="text-sm">
          <span className="text-[var(--color-text-dim)]">Stat : </span>
          <span className="text-[var(--color-success)]">{stat} ({statValue})</span>
        </div>
        <div className="text-sm">
          <span className="text-[var(--color-text-dim)]">Diff : </span>
          <span className="text-[var(--color-warning)]">{pendingRoll.difficulty}</span>
          <span className="text-[var(--color-text-dim)] text-xs ml-1">({difficultyLabel})</span>
        </div>
      </div>

      {/* Dice display - compact inline version */}
      <div className="flex items-center gap-4">
        {/* Dice */}
        <div
          className={`
            w-16 h-16 rounded-lg flex-shrink-0
            flex items-center justify-center
            text-2xl font-bold
            ${phase === 'rolling' ? 'dice-rolling bg-[var(--color-panel)]' : ''}
            ${phase === 'result' && result?.critical && result.success ? 'bg-[var(--color-success)]' : ''}
            ${phase === 'result' && result?.critical && !result.success ? 'bg-[var(--color-accent)]' : ''}
            ${phase === 'result' && !result?.critical && result?.success ? 'bg-[var(--color-success)]/70' : ''}
            ${phase === 'result' && !result?.critical && !result?.success ? 'bg-[var(--color-accent)]/70' : ''}
            ${phase === 'intro' ? 'bg-[var(--color-panel)]' : ''}
            border border-white/20
            transition-colors duration-300
          `}
        >
          {phase === 'intro' ? '🎲' : displayNumber}
        </div>

        {/* Result or roll button */}
        <div className="flex-1">
          {phase === 'intro' && (
            <button
              className="w-full btn bg-[var(--color-accent)] text-white"
              onClick={handleRoll}
            >
              🎲 Lancer le dé
            </button>
          )}

          {phase === 'rolling' && (
            <p className="text-center text-[var(--color-text-dim)] animate-pulse">
              Le destin décide...
            </p>
          )}

          {phase === 'result' && result && (
            <div className="animate-fade-in">
              <p className={`
                text-lg font-bold mb-1
                ${result.success ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}
              `}>
                {getResultLabel(result)}
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mb-2">
                {result.roll} + {result.statValue}
                {result.modifier !== 0 && ` + ${result.modifier}`}
                {' = '}
                <span className="text-white">{result.total}</span>
                {' vs '}
                <span className="text-[var(--color-warning)]">{result.difficulty}</span>
              </p>
              <button
                className="w-full btn bg-[var(--color-panel)] border border-[var(--color-text-dim)] text-sm"
                onClick={handleContinue}
              >
                Voir le résultat →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
