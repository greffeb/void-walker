// ---------------------------------------------------------------------------
// src/ui/hooks/useDiceAnimation.ts — 4-act dice choreography hook
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from 'react';
import { haptic } from './useHaptic';
import type { DiceResult, DifficultyBreakdown } from '@engine/types';

export type DicePhase =
  | 'idle'
  | 'dc_lines'    // Act 1: DC modifier lines appear one by one
  | 'dc_total'    // Act 2: DC total with impact
  | 'rolling'     // Act 3: die spinning with slowdown
  | 'roll_lines'  // Act 4: bonus lines appear one by one
  | 'result';     // Final result

interface UseDiceAnimationOptions {
  readonly diceResult: DiceResult | null;
  readonly difficultyBreakdown: DifficultyBreakdown | null;
  readonly canSkip: boolean;
  readonly onComplete: () => void;
}

interface UseDiceAnimationReturn {
  readonly phase: DicePhase;
  readonly visibleDcLines: number;
  readonly showDcTotal: boolean;
  readonly displayedDieNumber: number;
  readonly visibleRollLines: number;
  readonly showResult: boolean;
  readonly handleSkipTap: () => void;
}

const TIMING = {
  LINE_DELAY: 300,
  PAUSE_AFTER_DC_LINES: 600,
  DC_TOTAL_HOLD: 600,
  ROLL_DURATION: 2000,
  PAUSE_AFTER_ROLL_LINES: 600,
  RESULT_DELAY: 300,
  RESULT_HOLD: 2000,
  CRIT_HOLD: 4000,
} as const;

export function useDiceAnimation({
  diceResult,
  difficultyBreakdown,
  canSkip,
  onComplete,
}: UseDiceAnimationOptions): UseDiceAnimationReturn {
  const [phase, setPhase] = useState<DicePhase>('idle');
  const [visibleDcLines, setVisibleDcLines] = useState(0);
  const [showDcTotal, setShowDcTotal] = useState(false);
  const [displayedDieNumber, setDisplayedDieNumber] = useState(1);
  const [visibleRollLines, setVisibleRollLines] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  // Filtered DC lines (only non-zero values)
  const filteredDcLines = difficultyBreakdown?.namedLines.filter(l => l.value !== 0) ?? [];

  // Roll bonus lines count: stat value + luck (if non-zero)
  const rollLineCount = diceResult
    ? (diceResult.luckBonus > 0 ? 2 : 1)
    : 0;

  const handleSkipTap = useCallback(() => {
    if (!canSkip || phase === 'idle' || phase === 'result') return;

    cleanup();
    setVisibleDcLines(filteredDcLines.length);
    setShowDcTotal(true);
    setDisplayedDieNumber(diceResult?.natural ?? 1);
    setVisibleRollLines(rollLineCount);
    setShowResult(true);
    setPhase('result');

    timerRef.current = setTimeout(() => {
      onCompleteRef.current();
    }, 800);
  }, [canSkip, phase, cleanup, diceResult, filteredDcLines.length, rollLineCount]);

  useEffect(() => {
    if (!diceResult || !difficultyBreakdown) return;

    // Reset state
    setPhase('idle');
    setVisibleDcLines(0);
    setShowDcTotal(false);
    setDisplayedDieNumber(1);
    setVisibleRollLines(0);
    setShowResult(false);

    let cancelled = false;

    const delay = (ms: number): Promise<void> => new Promise<void>(resolve => {
      timerRef.current = setTimeout(() => { if (!cancelled) resolve(); }, ms);
    });

    async function run(): Promise<void> {
      // Captured non-null at effect entry — guaranteed by the outer guard
      const result = diceResult;
      const breakdown = difficultyBreakdown;
      if (!result || !breakdown) return;

      const dcLines = breakdown.namedLines.filter(l => l.value !== 0);

      // === ACT 1: DC lines ===
      setPhase('dc_lines');
      for (let i = 0; i < dcLines.length; i++) {
        await delay(TIMING.LINE_DELAY);
        if (cancelled) return;
        setVisibleDcLines(i + 1);
        haptic(10);
      }
      await delay(TIMING.PAUSE_AFTER_DC_LINES);
      if (cancelled) return;

      // === ACT 2: DC total ===
      setPhase('dc_total');
      setShowDcTotal(true);
      haptic(50);
      await delay(TIMING.DC_TOTAL_HOLD);
      if (cancelled) return;

      // === ACT 3: Rolling ===
      setPhase('rolling');
      const rollStart = Date.now();

      await new Promise<void>(resolve => {
        function tick(): void {
          if (cancelled) { resolve(); return; }
          const elapsed = Date.now() - rollStart;
          if (elapsed >= TIMING.ROLL_DURATION) {
            setDisplayedDieNumber(result!.natural);
            haptic(30);
            resolve();
            return;
          }
          const remaining = TIMING.ROLL_DURATION - elapsed;
          if (remaining > 200) {
            setDisplayedDieNumber(Math.floor(Math.random() * 20) + 1);
            haptic(5);
          } else {
            setDisplayedDieNumber(result!.natural);
          }
          const nextDelay =
            elapsed < 800  ? 50
            : elapsed < 1400 ? 100
            : 200;
          timerRef.current = setTimeout(tick, nextDelay);
        }
        tick();
      });

      if (cancelled) return;

      // NAT 20 or NAT 1 — skip Act 4
      if (result.natural === 20 || result.natural === 1) {
        haptic(80);
        setShowResult(true);
        setPhase('result');
        await delay(TIMING.CRIT_HOLD);
        if (cancelled) return;
        onCompleteRef.current();
        return;
      }

      // === ACT 4: Roll bonus lines ===
      setPhase('roll_lines');
      const bonusLineCount = result.luckBonus > 0 ? 2 : 1;
      for (let i = 0; i < bonusLineCount; i++) {
        await delay(TIMING.LINE_DELAY);
        if (cancelled) return;
        setVisibleRollLines(i + 1);
        haptic(10);
      }
      await delay(TIMING.PAUSE_AFTER_ROLL_LINES);
      if (cancelled) return;
      await delay(TIMING.RESULT_DELAY);
      if (cancelled) return;

      // === RESULT ===
      setPhase('result');
      setShowResult(true);
      haptic(80);
      await delay(TIMING.RESULT_HOLD);
      if (cancelled) return;
      onCompleteRef.current();
    }

    void run();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [diceResult, difficultyBreakdown, cleanup]);

  return {
    phase,
    visibleDcLines,
    showDcTotal,
    displayedDieNumber,
    visibleRollLines,
    showResult,
    handleSkipTap,
  };
}
