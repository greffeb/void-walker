// ---------------------------------------------------------------------------
// src/ui/components/Phase4FeedbackPanel.tsx — Rich Phase 4 feedback panel
// ---------------------------------------------------------------------------
// Extended feedback with full game state snapshot for Phase 4 debug playtest.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import type { Situation } from '@content/situationGenerator';
import type { GameState, TurnDebugTrace, DiceResult } from '@engine/types';

// === ANTI-SPAM CONFIG ===

const MAX_REPORTS_PER_SESSION = 10;
const REPORT_COOLDOWN_MS = 30_000;
const DEDUP_STORAGE_KEY = 'vw_p4_report_hashes';
const MAX_STORED_HASHES = 100;
const FAILED_REPORTS_KEY = 'vw_p4_failed_reports';
const MAX_FAILED_REPORTS = 20;

// === FEEDBACK ENDPOINT ===

const FEEDBACK_ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined;

// === REPORT TYPE ===

interface Phase4FeedbackReport {
  readonly situationId: string;
  readonly situationType: string;
  readonly situationDescription: string;
  readonly locationName: string;
  readonly playerInput: string;
  readonly parsedVerb: string;
  readonly parsedTarget: string;
  readonly diceNatural: number;
  readonly diceTotal: number;
  readonly dc: number;
  readonly outcome: string;
  readonly narration: string;
  readonly playerClass: string;
  readonly thumbs: 'up' | 'down';
  readonly comment: string;
  readonly timestamp: number;
  // Phase 4 extras
  readonly difficulty: string;
  readonly turn: number;
  readonly characterHp: number;
  readonly characterMaxHp: number;
  readonly characterO2: number;
  readonly conditions: readonly string[];
  readonly inventory: readonly string[];
  readonly shipMemoryMarks: number;
  readonly stalkerClockValue: number;
  readonly consequences: readonly string[];
  readonly deathResult: string | null;
}

// === HELPERS ===

function hashReport(situationId: string, input: string): string {
  let hash = 0;
  const str = `${situationId}:${input}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

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

function storeHash(hash: string): void {
  try {
    const hashes = getStoredHashes();
    hashes.push(hash);
    const trimmed = hashes.length > MAX_STORED_HASHES ? hashes.slice(-MAX_STORED_HASHES) : hashes;
    localStorage.setItem(DEDUP_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable — skip silently
  }
}

function saveFailedReport(report: Phase4FeedbackReport): void {
  try {
    const raw = localStorage.getItem(FAILED_REPORTS_KEY);
    const existing: Phase4FeedbackReport[] = raw ? (JSON.parse(raw) as Phase4FeedbackReport[]) : [];
    existing.push(report);
    const trimmed = existing.length > MAX_FAILED_REPORTS ? existing.slice(-MAX_FAILED_REPORTS) : existing;
    localStorage.setItem(FAILED_REPORTS_KEY, JSON.stringify(trimmed));
  } catch {
    // skip silently
  }
}

async function sendFeedback(report: Phase4FeedbackReport): Promise<boolean> {
  if (!FEEDBACK_ENDPOINT) return false;
  try {
    const url = new URL(FEEDBACK_ENDPOINT);
    url.searchParams.set('payload', JSON.stringify(report));
    await fetch(url.toString(), { mode: 'no-cors' });
    return true;
  } catch (err) {
    console.error('[Phase4FeedbackPanel] sendFeedback failed:', err);
    return false;
  }
}

// === PROPS ===

interface Phase4FeedbackPanelProps {
  readonly situation: Situation;
  readonly input: string;
  readonly gameState: GameState;
  readonly trace: TurnDebugTrace | null;
  readonly diceRoll: DiceResult | null;
  readonly narration?: string;
  readonly onFeedback: (thumbs: 'up' | 'down', comment?: string) => void;
  readonly onNext: () => void;
  readonly reportCount: number;
}

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

// === COMPONENT ===

export function Phase4FeedbackPanel({
  situation,
  input,
  gameState,
  trace,
  diceRoll,
  narration = '',
  onFeedback,
  onNext,
  reportCount,
}: Phase4FeedbackPanelProps): JSX.Element {
  const [thumbs, setThumbs] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [showComment, setShowComment] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [spamWarning, setSpamWarning] = useState('');
  const lastReportTime = useRef(0);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showComment && commentRef.current) {
      commentRef.current.focus();
    }
  }, [showComment]);

  useEffect(() => {
    setThumbs(null);
    setComment('');
    setSubmitState('idle');
    setShowComment(false);
    setShowSnapshot(false);
    setSpamWarning('');
  }, [situation.id, input]);

  const char = gameState.character;

  function buildReport(t: 'up' | 'down'): Phase4FeedbackReport {
    return {
      situationId: situation.id,
      situationType: situation.type,
      situationDescription: situation.description,
      locationName: situation.locationName,
      playerInput: input,
      parsedVerb: trace?.parsedVerb ?? '',
      parsedTarget: trace?.parsedTarget ?? '',
      diceNatural: diceRoll?.natural ?? 0,
      diceTotal: diceRoll?.total ?? 0,
      dc: trace?.effectiveDC ?? 0,
      outcome: trace?.outcome ?? '',
      narration,
      playerClass: char?.className ?? '',
      thumbs: t,
      comment,
      timestamp: Date.now(),
      difficulty: gameState.difficulty,
      turn: gameState.turn,
      characterHp: char?.hp ?? 0,
      characterMaxHp: char?.maxHp ?? 0,
      characterO2: char?.oxygen ?? 0,
      conditions: char?.conditions.map(c => c.id) ?? [],
      inventory: char?.inventory ?? [],
      shipMemoryMarks: gameState.shipMemory.length,
      stalkerClockValue: gameState.stalkerClockState.actionsSinceLastProgression,
      consequences: trace?.consequenceDetails ?? [],
      deathResult: trace?.deathResult ?? null,
    };
  }

  const checkAntiSpam = (): boolean => {
    if (reportCount >= MAX_REPORTS_PER_SESSION) {
      setSpamWarning(`Limite atteinte (${MAX_REPORTS_PER_SESSION} rapports par session).`);
      return false;
    }
    const now = Date.now();
    if (now - lastReportTime.current < REPORT_COOLDOWN_MS) {
      const remaining = Math.ceil((REPORT_COOLDOWN_MS - (now - lastReportTime.current)) / 1000);
      setSpamWarning(`Patientez ${remaining}s avant le prochain rapport.`);
      return false;
    }
    const hash = hashReport(situation.id, input);
    if (getStoredHashes().includes(hash)) {
      setSpamWarning('Ce rapport a deja ete soumis.');
      return false;
    }
    return true;
  };

  const handleThumbsUp = (): void => {
    setThumbs('up');
    setSubmitState('sent');
    onFeedback('up');
    void sendFeedback(buildReport('up'));
  };

  const handleThumbsDown = (): void => {
    setThumbs('down');
    setShowComment(true);
  };

  const handleSubmitReport = async (): Promise<void> => {
    if (!checkAntiSpam()) return;
    const report = buildReport('down');
    storeHash(hashReport(situation.id, input));
    lastReportTime.current = Date.now();
    setSubmitState('sending');
    const ok = await sendFeedback(report);
    if (ok) {
      setSubmitState('sent');
    } else {
      saveFailedReport(report);
      setSubmitState('error');
    }
    onFeedback('down', comment);
  };

  const handleSkipReport = (): void => {
    setSubmitState('sent');
    onFeedback('down', comment || undefined);
  };

  // Submitted — show next button
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
          SCENE SUIVANTE →
        </button>
      </div>
    );
  }

  // Comment form after thumbs down
  if (showComment) {
    return (
      <div className="flex flex-col gap-3 pt-3">
        <div className="font-mono text-xs text-gray-400">Qu'est-ce qui n'a pas fonctionne ? (facultatif)</div>
        <textarea
          ref={commentRef}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[60px] rounded border border-gray-700 bg-[var(--color-void-dark)] px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-gray-600 focus:border-purple-600"
          placeholder="Decrivez le probleme..."
          maxLength={500}
        />

        {/* Game state snapshot (collapsible) */}
        <button
          type="button"
          onClick={() => setShowSnapshot(v => !v)}
          className="text-left font-mono text-xs text-gray-600 underline hover:text-gray-400"
        >
          {showSnapshot ? '▲ Masquer snapshot' : '▼ Snapshot etat du jeu'}
        </button>
        {showSnapshot && char && (
          <div className="rounded border border-gray-800 bg-gray-950/50 p-2 font-mono text-xs text-gray-500">
            <div>Classe: {char.className} | Difficulte: {gameState.difficulty}</div>
            <div>PV: {char.hp}/{char.maxHp} | O2: {char.oxygen}%</div>
            <div>Conditions: {char.conditions.map(c => c.id).join(', ') || '—'}</div>
            <div>Inventaire: {char.inventory.join(', ') || '—'}</div>
            <div>Memoire navire: {gameState.shipMemory.length} marques</div>
            <div>Horloge fantome: {gameState.stalkerClockState.actionsSinceLastProgression}</div>
            <div>Tour: {gameState.turn}</div>
          </div>
        )}

        {spamWarning && <div className="font-mono text-xs text-yellow-400">{spamWarning}</div>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { void handleSubmitReport(); }}
            disabled={submitState === 'sending'}
            className="flex-1 rounded border border-red-700 bg-transparent px-3 py-2 font-mono text-xs font-bold text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50"
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

  // Initial thumbs buttons
  return (
    <div className="flex flex-col items-center gap-2 pt-3">
      <div className="font-mono text-xs text-gray-500">Cette resolution vous semble correcte ?</div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleThumbsUp}
          className="rounded border border-green-700 bg-transparent px-5 py-2 font-mono text-lg transition-colors hover:bg-green-900/30"
          title="Correct"
        >
          <span className="text-green-400">OK</span>
        </button>
        <button
          type="button"
          onClick={handleThumbsDown}
          className="rounded border border-red-700 bg-transparent px-5 py-2 font-mono text-lg transition-colors hover:bg-red-900/30"
          title="Probleme"
        >
          <span className="text-red-400">KO</span>
        </button>
      </div>
    </div>
  );
}
