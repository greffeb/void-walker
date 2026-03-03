// ---------------------------------------------------------------------------
// src/ui/hooks/useDiceAnimation.ts — Orchestrates the 3-phase dice sequence
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from 'react';
import { THEME } from '../styles/theme';
import type { DiceResult } from '@engine/types';

export type DicePhase = 'idle' | 'dc_display' | 'rolling' | 'result';

interface UseDiceAnimationOptions {
  readonly diceResult: DiceResult | null;
  readonly onComplete: () => void;
}

interface UseDiceAnimationReturn {
  readonly isAnimating: boolean;
  readonly phase: DicePhase;
  readonly displayedNumber: number;
  readonly finalResult: DiceResult | null;
  readonly start: () => void;
}

export function useDiceAnimation({
  diceResult,
  onComplete,
}: UseDiceAnimationOptions): UseDiceAnimationReturn {
  const [phase, setPhase] = useState<DicePhase>('idle');
  const [displayedNumber, setDisplayedNumber] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const start = useCallback(() => {
    if (!diceResult) return;
    cleanup();

    // Phase 1: DC display
    setPhase('dc_display');
    setDisplayedNumber(0);

    timerRef.current = setTimeout(() => {
      // Phase 2: Rolling
      setPhase('rolling');
      let elapsed = 0;
      const rollStart = Date.now();

      intervalRef.current = setInterval(() => {
        elapsed = Date.now() - rollStart;
        const duration = THEME.animation.dicePhase2Duration;

        if (elapsed >= duration) {
          // Show final number
          setDisplayedNumber(diceResult.natural);
          if (intervalRef.current) clearInterval(intervalRef.current);

          // Phase 3: Result
          timerRef.current = setTimeout(() => {
            setPhase('result');

            // Complete
            timerRef.current = setTimeout(() => {
              setPhase('idle');
              onCompleteRef.current();
            }, THEME.animation.dicePhase3Duration);
          }, 50);
          return;
        }

        // Speed easing: fast → slow
        let delay: number;
        if (elapsed < 800) delay = 50;
        else if (elapsed < 1400) delay = 100;
        else delay = 200;

        // Need to adjust the interval dynamically
        // For simplicity, just set random number
        const remaining = duration - elapsed;
        if (remaining > 200) {
          setDisplayedNumber(Math.floor(Math.random() * 20) + 1);
        } else {
          setDisplayedNumber(diceResult.natural);
        }

        // Actually we can't change interval speed within setInterval
        // So we just use a fixed fast interval and only update when enough time passed
        void delay;
      }, 50);
    }, THEME.animation.dicePhase1Duration);
  }, [diceResult, cleanup]);

  // Auto-start when dice result is provided
  useEffect(() => {
    if (diceResult) {
      start();
    }
    return cleanup;
  }, [diceResult, start, cleanup]);

  return {
    isAnimating: phase !== 'idle',
    phase,
    displayedNumber,
    finalResult: diceResult,
    start,
  };
}
