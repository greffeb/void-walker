// ---------------------------------------------------------------------------
// src/services/autoSave.ts — Debounced auto-save (decision AD)
// ---------------------------------------------------------------------------
// The run is written after every turn. Without a debounce, a player firing
// actions back to back queues one IndexedDB write per action; with one, only
// the last state of a burst is written — and a burst that ends the game is
// flushed at once, because there is no later turn to carry it.
// ---------------------------------------------------------------------------

export interface AutoSaver {
  /** Ask for a write. Replaces any write already waiting. */
  schedule: () => void;
  /** Write now, cancelling any wait. */
  flush: () => Promise<void>;
  /** Drop a pending write without performing it. */
  cancel: () => void;
  /** True while a write is waiting. */
  isPending: () => boolean;
}

export function createAutoSaver(save: () => Promise<void>, delayMs: number): AutoSaver {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    schedule: () => {
      cancel();
      timer = setTimeout(() => {
        timer = null;
        void save();
      }, delayMs);
    },
    flush: async () => {
      cancel();
      await save();
    },
    cancel,
    isPending: () => timer !== null,
  };
}
