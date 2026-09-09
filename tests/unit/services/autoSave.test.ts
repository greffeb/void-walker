// ---------------------------------------------------------------------------
// tests/unit/services/autoSave.test.ts — Debounced auto-save (decision AD)
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAutoSaver } from '../../../src/services/autoSave';

describe('createAutoSaver', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does not write immediately', () => {
    const save = vi.fn(async () => {});
    createAutoSaver(save, 1000).schedule();
    expect(save).not.toHaveBeenCalled();
  });

  it('writes once the wait has passed', () => {
    const save = vi.fn(async () => {});
    createAutoSaver(save, 1000).schedule();
    vi.advanceTimersByTime(1000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('a burst of turns writes once, not once per turn', () => {
    const save = vi.fn(async () => {});
    const saver = createAutoSaver(save, 1000);
    for (let i = 0; i < 8; i++) {
      saver.schedule();
      vi.advanceTimersByTime(100);
    }
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flush writes at once and cancels the wait', async () => {
    const save = vi.fn(async () => {});
    const saver = createAutoSaver(save, 1000);
    saver.schedule();
    await saver.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(saver.isPending()).toBe(false);
    // The end of a run has no later turn to carry the write.
    vi.advanceTimersByTime(5000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('cancel drops the pending write', () => {
    const save = vi.fn(async () => {});
    const saver = createAutoSaver(save, 1000);
    saver.schedule();
    saver.cancel();
    vi.advanceTimersByTime(5000);
    expect(save).not.toHaveBeenCalled();
  });

  it('reports whether a write is waiting', () => {
    const saver = createAutoSaver(async () => {}, 1000);
    expect(saver.isPending()).toBe(false);
    saver.schedule();
    expect(saver.isPending()).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(saver.isPending()).toBe(false);
  });
});
