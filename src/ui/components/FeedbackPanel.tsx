// ---------------------------------------------------------------------------
// src/ui/components/FeedbackPanel.tsx — Thumbs up/down + comment + silent submit
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import type { FeedbackReport } from '../hooks/useGameLoop';
import type { Situation } from '@content/situationGenerator';
import type { ResolutionData } from '../hooks/useGameLoop';

// === ANTI-SPAM CONFIG ===

/** Max reports per session */
const MAX_REPORTS_PER_SESSION = 10;
/** Minimum ms between reports */
const REPORT_COOLDOWN_MS = 30_000;
/** localStorage key for tracking submitted report hashes */
const DEDUP_STORAGE_KEY = 'vw_report_hashes';
/** Max stored hashes before pruning */
const MAX_STORED_HASHES = 100;
/** localStorage key for reports that failed to send (endpoint down) */
const FAILED_REPORTS_KEY = 'vw_failed_reports';
/** Max failed reports to store locally */
const MAX_FAILED_REPORTS = 20;

// === FEEDBACK ENDPOINT ===

const FEEDBACK_ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined;

// === HELPERS ===

/** Simple hash for deduplication */
function hashReport(situationId: string, input: string): string {
  let hash = 0;
  const str = `${situationId}:${input}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/** Get stored report hashes from localStorage */
function getStoredHashes(): string[] {
  try {
    const raw = localStorage.getItem(DEDUP_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

/** Store a new hash */
function storeHash(hash: string): void {
  try {
    const hashes = getStoredHashes();
    hashes.push(hash);
    const trimmed = hashes.length > MAX_STORED_HASHES
      ? hashes.slice(-MAX_STORED_HASHES)
      : hashes;
    localStorage.setItem(DEDUP_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

/** Save a failed report to localStorage for potential retry */
function saveFailedReport(report: FeedbackReport): void {
  try {
    const raw = localStorage.getItem(FAILED_REPORTS_KEY);
    const existing: FeedbackReport[] = raw ? (JSON.parse(raw) as FeedbackReport[]) : [];
    existing.push(report);
    const trimmed = existing.length > MAX_FAILED_REPORTS
      ? existing.slice(-MAX_FAILED_REPORTS)
      : existing;
    localStorage.setItem(FAILED_REPORTS_KEY, JSON.stringify(trimmed));
  } catch {
    // silently skip
  }
}

/**
 * Send a feedback report to the configured endpoint.
 * Uses text/plain content-type to avoid CORS preflight with Google Apps Script.
 * Returns true on success, false on failure (caller handles graceful degradation).
 */
async function sendFeedback(report: FeedbackReport): Promise<boolean> {
  if (!FEEDBACK_ENDPOINT) return false;
  try {
    await fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(report),
    });
    return true;
  } catch (err) {
    console.error('[FeedbackPanel] sendFeedback failed:', err);
    return false;
  }
}

// === COMPONENT ===

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

interface FeedbackPanelProps {
  readonly situation: Situation;
  readonly resolution: ResolutionData;
  readonly onFeedback: (thumbs: 'up' | 'down', comment?: string) => void;
  readonly onNext: () => void;
  readonly reportCount: number;
}

export function FeedbackPanel({
  situation,
  resolution,
  onFeedback,
  onNext,
  reportCount,
}: FeedbackPanelProps): JSX.Element {
  const [thumbs, setThumbs] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [showComment, setShowComment] = useState(false);
  const [spamWarning, setSpamWarning] = useState('');
  const lastReportTime = useRef(0);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Focus comment box when it appears
  useEffect(() => {
    if (showComment && commentRef.current) {
      commentRef.current.focus();
    }
  }, [showComment]);

  // Reset when situation/resolution changes
  useEffect(() => {
    setThumbs(null);
    setComment('');
    setSubmitState('idle');
    setShowComment(false);
    setSpamWarning('');
  }, [situation.id, resolution.input]);

  const checkAntiSpam = (): boolean => {
    if (reportCount >= MAX_REPORTS_PER_SESSION) {
      setSpamWarning(`Limite atteinte (${MAX_REPORTS_PER_SESSION} rapports par session).`);
      return false;
    }

    const now = Date.now();
    if (now - lastReportTime.current < REPORT_COOLDOWN_MS) {
      const remaining = Math.ceil((REPORT_COOLDOWN_MS - (now - lastReportTime.current)) / 1000);
      setSpamWarning(`Veuillez patienter ${remaining}s avant le prochain rapport.`);
      return false;
    }

    const hash = hashReport(situation.id, resolution.input);
    const stored = getStoredHashes();
    if (stored.includes(hash)) {
      setSpamWarning('Ce rapport a deja ete soumis.');
      return false;
    }

    return true;
  };

  const handleThumbsUp = (): void => {
    setThumbs('up');
    setSubmitState('sent');
    onFeedback('up');

    // Silent background ping — does not block UI
    const report: FeedbackReport = {
      situationId: situation.id,
      situationType: situation.type,
      situationDescription: situation.description,
      locationName: situation.locationName,
      playerInput: resolution.input,
      parsedVerb: resolution.verb,
      parsedTarget: resolution.targetId,
      diceNatural: resolution.diceResult.natural,
      diceTotal: resolution.diceResult.total,
      dc: resolution.dc,
      outcome: resolution.outcome,
      playerClass: '',
      thumbs: 'up',
      comment: '',
      timestamp: Date.now(),
    };
    void sendFeedback(report);
  };

  const handleThumbsDown = (): void => {
    setThumbs('down');
    setShowComment(true);
  };

  const handleSubmitReport = async (): Promise<void> => {
    if (!checkAntiSpam()) return;

    const report: FeedbackReport = {
      situationId: situation.id,
      situationType: situation.type,
      situationDescription: situation.description,
      locationName: situation.locationName,
      playerInput: resolution.input,
      parsedVerb: resolution.verb,
      parsedTarget: resolution.targetId,
      diceNatural: resolution.diceResult.natural,
      diceTotal: resolution.diceResult.total,
      dc: resolution.dc,
      outcome: resolution.outcome,
      playerClass: '',
      thumbs: 'down',
      comment,
      timestamp: Date.now(),
    };

    // Store dedup hash before sending
    const hash = hashReport(situation.id, resolution.input);
    storeHash(hash);
    lastReportTime.current = Date.now();

    setSubmitState('sending');
    const ok = await sendFeedback(report);

    if (ok) {
      setSubmitState('sent');
    } else {
      // Endpoint down or missing — save locally, still mark as done
      saveFailedReport(report);
      setSubmitState('error');
    }

    onFeedback('down', comment);
  };

  const handleSkipReport = (): void => {
    setSubmitState('sent');
    onFeedback('down', comment || undefined);
  };

  // Already submitted — show "next" button
  if (submitState === 'sent' || submitState === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 pt-3">
        <div className="font-mono text-xs text-gray-500">
          {thumbs === 'up'
            ? 'Merci !'
            : submitState === 'error'
              ? 'Erreur reseau — feedback sauvegarde localement.'
              : 'Rapport envoye.'}
        </div>
        <button
          type="button"
          onClick={onNext}
          className="rounded border border-purple-600 bg-transparent px-6 py-2 font-mono text-sm font-bold tracking-wider text-purple-400 transition-colors hover:bg-purple-900/30 active:bg-purple-800/50"
        >
          SITUATION SUIVANTE
        </button>
      </div>
    );
  }

  // Show comment form after thumbs down
  if (showComment) {
    return (
      <div className="flex flex-col gap-3 pt-3">
        <div className="font-mono text-xs text-gray-400">
          Qu'est-ce qui n'a pas fonctionne ? (facultatif)
        </div>
        <textarea
          ref={commentRef}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[60px] rounded border border-gray-700 bg-[var(--color-void-dark)] px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-gray-600 focus:border-purple-600"
          placeholder="Decrivez le probleme..."
          maxLength={500}
        />
        {spamWarning && (
          <div className="font-mono text-xs text-yellow-400">{spamWarning}</div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { void handleSubmitReport(); }}
            disabled={submitState === 'sending'}
            className="flex-1 rounded border border-red-700 bg-transparent px-3 py-2 font-mono text-xs font-bold text-red-400 transition-colors hover:bg-red-900/30 active:bg-red-800/50 disabled:opacity-50"
          >
            {submitState === 'sending' ? 'ENVOI...' : 'ENVOYER LE RAPPORT'}
          </button>
          <button
            type="button"
            onClick={handleSkipReport}
            disabled={submitState === 'sending'}
            className="rounded border border-gray-700 bg-transparent px-3 py-2 font-mono text-xs text-gray-400 transition-colors hover:bg-gray-800/30 disabled:opacity-50"
          >
            PASSER
          </button>
        </div>
      </div>
    );
  }

  // Initial state — show thumbs buttons
  return (
    <div className="flex flex-col items-center gap-2 pt-3">
      <div className="font-mono text-xs text-gray-500">
        Cette resolution vous semble correcte ?
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleThumbsUp}
          className="rounded border border-green-700 bg-transparent px-5 py-2 font-mono text-lg transition-colors hover:bg-green-900/30 active:bg-green-800/50"
          title="Correct"
        >
          <span className="text-green-400">OK</span>
        </button>
        <button
          type="button"
          onClick={handleThumbsDown}
          className="rounded border border-red-700 bg-transparent px-5 py-2 font-mono text-lg transition-colors hover:bg-red-900/30 active:bg-red-800/50"
          title="Probleme"
        >
          <span className="text-red-400">KO</span>
        </button>
      </div>
    </div>
  );
}
