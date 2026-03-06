// ---------------------------------------------------------------------------
// src/ui/hooks/useHaptic.ts — Haptic feedback via navigator.vibrate()
// Silently does nothing on desktop or unsupported browsers.
// ---------------------------------------------------------------------------

/**
 * Trigger haptic vibration. Silent if not supported.
 * @param durationMs — Vibration duration in milliseconds
 */
export function haptic(durationMs: number): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(durationMs);
    }
  } catch {
    // Haptic is never critical — swallow any errors
  }
}
