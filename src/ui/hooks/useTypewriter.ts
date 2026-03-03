// ---------------------------------------------------------------------------
// src/ui/hooks/useTypewriter.ts — Character-by-character reveal hook
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef } from 'react';
import { THEME } from '../styles/theme';

interface UseTypewriterOptions {
  readonly text: string;
  readonly speed?: number;
  readonly onComplete?: () => void;
  readonly enabled?: boolean;
}

interface UseTypewriterReturn {
  readonly displayedText: string;
  readonly isComplete: boolean;
  readonly skip: () => void;
}

export function useTypewriter({
  text,
  speed = THEME.animation.typewriterSpeed,
  onComplete,
  enabled = true,
}: UseTypewriterOptions): UseTypewriterReturn {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(!enabled);
  const indexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reset when text changes
  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);

    const interval = setInterval(() => {
      indexRef.current++;
      if (indexRef.current >= text.length) {
        setDisplayedText(text);
        setIsComplete(true);
        onCompleteRef.current?.();
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  const skip = useCallback(() => {
    if (isComplete) return;
    setDisplayedText(text);
    setIsComplete(true);
    onCompleteRef.current?.();
  }, [text, isComplete]);

  return { displayedText, isComplete, skip };
}
