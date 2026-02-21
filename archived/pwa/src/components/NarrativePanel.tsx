import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

interface NarrativePanelProps {
  onNarrativeComplete?: () => void;
}

export function NarrativePanel({ onNarrativeComplete }: NarrativePanelProps) {
  const narrative = useGameStore((state) => state.currentNarrative);
  const isLoading = useGameStore((state) => state.isLoading);

  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(15); // ms per character
  const callbackRef = useRef(onNarrativeComplete);
  const lastNarrativeRef = useRef<string>('');

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onNarrativeComplete;
  }, [onNarrativeComplete]);

  // Typewriter effect - only depends on narrative text changes
  useEffect(() => {
    // Skip if narrative hasn't actually changed
    if (narrative === lastNarrativeRef.current) {
      return;
    }
    lastNarrativeRef.current = narrative;

    if (!narrative) {
      setDisplayedText('');
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let i = 0;

    const interval = setInterval(() => {
      if (i < narrative.length) {
        setDisplayedText(narrative.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
        callbackRef.current?.();
      }
    }, speedRef.current);

    return () => clearInterval(interval);
  }, [narrative]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  // Skip animation on tap
  const handleTap = () => {
    if (!isComplete && narrative) {
      setDisplayedText(narrative);
      setIsComplete(true);
      onNarrativeComplete?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 bg-[var(--color-void)]"
      onClick={handleTap}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-3xl mb-2 animate-pulse">🌀</div>
            <p className="text-[var(--color-text-dim)]">Génération en cours...</p>
          </div>
        </div>
      ) : (
        <div className="narrative-text animate-fade-in">
          {displayedText}
          {!isComplete && <span className="cursor-blink" />}
        </div>
      )}
    </div>
  );
}
