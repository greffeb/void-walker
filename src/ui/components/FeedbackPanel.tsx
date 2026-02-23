// ---------------------------------------------------------------------------
// src/ui/components/FeedbackPanel.tsx — Thumbs up/down + comment + GitHub issue
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

// === GITHUB ISSUE CONFIG ===

const GITHUB_OWNER = 'greffeb';
const GITHUB_REPO = 'void-walker';

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
    // Prune if too many
    const trimmed = hashes.length > MAX_STORED_HASHES
      ? hashes.slice(-MAX_STORED_HASHES)
      : hashes;
    localStorage.setItem(DEDUP_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

/** Generate a GitHub issue URL with pre-filled content */
function generateIssueUrl(report: FeedbackReport): string {
  const title = `[Playtest] ${report.thumbs === 'down' ? 'Bug/Issue' : 'Feedback'}: ${report.parsedVerb} sur ${report.parsedTarget}`;

  const body = [
    `## Rapport de playtest`,
    ``,
    `**Type:** ${report.thumbs === 'up' ? 'Pouce en haut' : 'Pouce en bas'}`,
    `**Classe:** ${report.playerClass}`,
    `**Date:** ${new Date(report.timestamp).toISOString()}`,
    ``,
    `### Situation`,
    `- **Type:** ${report.situationType}`,
    `- **Lieu:** ${report.locationName}`,
    `- **Description:** ${report.situationDescription}`,
    ``,
    `### Action du joueur`,
    `- **Commande:** \`${report.playerInput}\``,
    `- **Verbe:** ${report.parsedVerb}`,
    `- **Cible:** ${report.parsedTarget}`,
    ``,
    `### Resolution`,
    `- **De (naturel):** ${report.diceNatural}`,
    `- **Total:** ${report.diceTotal}`,
    `- **DC:** ${report.dc}`,
    `- **Resultat:** ${report.outcome}`,
    ``,
    report.comment ? `### Commentaire du joueur\n${report.comment}\n` : '',
    `---`,
    `*Genere automatiquement par le systeme de playtest Void Walker*`,
  ].filter(Boolean).join('\n');

  const labels = report.thumbs === 'down' ? 'playtest,bug' : 'playtest,feedback';

  const params = new URLSearchParams({
    title,
    body,
    labels,
  });

  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/new?${params.toString()}`;
}

// === COMPONENT ===

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
  const [submitted, setSubmitted] = useState(false);
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
    setSubmitted(false);
    setShowComment(false);
    setSpamWarning('');
  }, [situation.id, resolution.input]);

  const checkAntiSpam = (): boolean => {
    // Rate limit
    if (reportCount >= MAX_REPORTS_PER_SESSION) {
      setSpamWarning(`Limite atteinte (${MAX_REPORTS_PER_SESSION} rapports par session).`);
      return false;
    }

    // Cooldown
    const now = Date.now();
    if (now - lastReportTime.current < REPORT_COOLDOWN_MS) {
      const remaining = Math.ceil((REPORT_COOLDOWN_MS - (now - lastReportTime.current)) / 1000);
      setSpamWarning(`Veuillez patienter ${remaining}s avant le prochain rapport.`);
      return false;
    }

    // Dedup
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
    setSubmitted(true);
    onFeedback('up');
  };

  const handleThumbsDown = (): void => {
    setThumbs('down');
    setShowComment(true);
  };

  const handleSubmitReport = (): void => {
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

    // Store dedup hash
    const hash = hashReport(situation.id, resolution.input);
    storeHash(hash);
    lastReportTime.current = Date.now();

    // Open GitHub issue in new tab
    const url = generateIssueUrl(report);
    window.open(url, '_blank', 'noopener,noreferrer');

    setSubmitted(true);
    onFeedback('down', comment);
  };

  const handleSkipReport = (): void => {
    setSubmitted(true);
    onFeedback('down', comment || undefined);
  };

  // Already submitted — show "next" button
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 pt-3">
        <div className="font-mono text-xs text-gray-500">
          {thumbs === 'up' ? 'Merci !' : 'Rapport enregistre.'}
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
            onClick={handleSubmitReport}
            className="flex-1 rounded border border-red-700 bg-transparent px-3 py-2 font-mono text-xs font-bold text-red-400 transition-colors hover:bg-red-900/30 active:bg-red-800/50"
          >
            SIGNALER SUR GITHUB
          </button>
          <button
            type="button"
            onClick={handleSkipReport}
            className="rounded border border-gray-700 bg-transparent px-3 py-2 font-mono text-xs text-gray-400 transition-colors hover:bg-gray-800/30"
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
