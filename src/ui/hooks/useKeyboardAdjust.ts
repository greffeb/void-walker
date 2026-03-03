// ---------------------------------------------------------------------------
// src/ui/hooks/useKeyboardAdjust.ts — Mobile keyboard viewport adjustment
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';

/**
 * Detects when the mobile keyboard opens by monitoring visualViewport resize.
 * Returns `true` when keyboard is likely open (viewport height decreased).
 */
export function useKeyboardAdjust(): boolean {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const initialHeight = vv.height;

    function onResize(): void {
      if (!vv) return;
      // Keyboard is considered open if viewport shrinks > 100px
      setKeyboardOpen(initialHeight - vv.height > 100);
    }

    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  return keyboardOpen;
}
