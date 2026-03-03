// ---------------------------------------------------------------------------
// src/ui/components/GlitchEffect.tsx — Reusable glitch effect wrapper
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';

interface GlitchEffectProps {
  readonly active: boolean;
  readonly duration?: number;
  readonly children: React.ReactNode;
}

/**
 * Wraps children with a CSS glitch effect when `active` is true.
 * Auto-deactivates after `duration` ms.
 */
export function GlitchEffect({
  active,
  duration = 500,
  children,
}: GlitchEffectProps): JSX.Element {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    if (!active) return;
    setGlitching(true);
    const timer = setTimeout(() => setGlitching(false), duration);
    return () => clearTimeout(timer);
  }, [active, duration]);

  return (
    <div
      style={glitching ? {
        animation: `glitch-slice ${duration}ms ease-in-out`,
      } : undefined}
    >
      {children}
    </div>
  );
}
