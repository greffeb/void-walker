// ---------------------------------------------------------------------------
// tests/playtest/stuckDetector.ts — Phase 6: Stuck detection for playtest bots
// ---------------------------------------------------------------------------
// Detects when a bot is stuck in the same location for too many turns.
// ---------------------------------------------------------------------------

/**
 * Detects when a bot has been in the same location for N consecutive turns.
 * Used by the stress test runner to break infinite loops.
 */
export class StuckDetector {
  private readonly history: string[] = [];
  private readonly threshold: number;

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  /** Record the player's current location this turn. */
  update(locationId: string): void {
    this.history.push(locationId);
    if (this.history.length > this.threshold) {
      this.history.shift();
    }
  }

  /**
   * Returns true if the bot has been in the same location for the full
   * threshold duration without moving.
   */
  isStuck(): boolean {
    if (this.history.length < this.threshold) return false;
    return this.history.every(id => id === this.history[0]);
  }

  /** Reset the detector (e.g. when the bot moves to a new location). */
  reset(): void {
    this.history.length = 0;
  }

  /** How many turns have been recorded so far. */
  get recordedTurns(): number {
    return this.history.length;
  }
}
