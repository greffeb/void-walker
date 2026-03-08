// ---------------------------------------------------------------------------
// src/ui/utils/feedback.ts — Feedback submission utilities
// ---------------------------------------------------------------------------
// Extracted from Phase4FeedbackPanel for reuse across playtest UIs.
// Anti-spam, deduplication, offline fallback (localStorage).
// Reports include full reproducibility data for Claude Code debugging.
// ---------------------------------------------------------------------------

// === CONFIG ===

export const MAX_REPORTS_PER_SESSION = 10;
export const REPORT_COOLDOWN_MS = 30_000;
const DEDUP_STORAGE_KEY = 'vw_report_hashes';
const MAX_STORED_HASHES = 100;
const FAILED_REPORTS_KEY = 'vw_failed_reports';
const MAX_FAILED_REPORTS = 20;

const FEEDBACK_ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined;

// === REPORT TYPE ===

/**
 * Full playtest bug report — contains everything needed to reproduce.
 *
 * Reproduction steps for Claude Code:
 * 1. createSeededRng(seed) → rng
 * 2. assembleScenario(getSkeletonById(skeletonId), 'standard', ALL_MODULES, rng)
 * 3. initGame(scenario, playerClass, difficulty, 'Joueur', rng)
 * 4. Replay turnHistory[0..turn-1] via processTurn()
 * 5. The bug occurs at turn N with playerInput
 */
export interface PlaytestReport {
  /** App version identifier (build-<sha7>) */
  readonly appVersion: string;

  // === REPRODUCIBILITY (most important for debugging) ===
  /** RNG seed used for this entire game session */
  readonly seed: number;
  /** Skeleton ID (e.g., 'escape', 'investigate', 'rescue') */
  readonly skeletonId: string;
  /** Setting ID (e.g., 'derelict_ship', 'space_station', 'alien_ruins') */
  readonly settingId: string;
  /** Player class */
  readonly playerClass: string;
  /** Difficulty level */
  readonly difficulty: string;
  /** Turn number where the bug occurred */
  readonly turn: number;
  /** Complete input history from turn 1 to buggy turn (for replay) */
  readonly inputHistory: readonly string[];

  // === CONTEXT AT BUG TURN ===
  /** Current location ID (graph node ID) */
  readonly locationId: string;
  /** Current location display name (French) */
  readonly locationName: string;
  /** Player input that triggered the bug */
  readonly playerInput: string;

  // === PARSER OUTPUT ===
  readonly parsedVerb: string;
  readonly parsedTarget: string;
  readonly parsedTargetName: string;
  readonly parseStrategy: number;
  readonly parseCreative: boolean;

  // === RESOLUTION ===
  readonly isAutoVerb: boolean;
  readonly statId: string;
  readonly effectiveStatValue: number;
  readonly diceNatural: number;
  readonly diceTotal: number;
  readonly diceModifier: number;
  readonly dc: number;
  readonly outcome: string;
  readonly failsafeActivated: boolean;
  readonly failsafeDcReduction: number;
  readonly shipMemoryMod: number;

  // === CONSEQUENCES ===
  readonly consequences: readonly string[];
  readonly consequenceTypes: readonly string[];
  readonly triggeredConditions: readonly string[];
  readonly deathResult: string | null;

  // === NPC ===
  readonly npcReacted: boolean;
  readonly npcAttackHit: boolean;
  readonly npcAttackDamage: number;

  // === NARRATIVE OUTPUT ===
  readonly narration: string;

  // === PLAYER STATE AT BUG TIME ===
  readonly characterHp: number;
  readonly characterMaxHp: number;
  readonly characterO2: number;
  readonly conditions: readonly string[];
  readonly inventory: readonly string[];

  // === SCENE SNAPSHOT ===
  /** Items visible in current location */
  readonly sceneItems: readonly string[];
  /** NPCs present in current location */
  readonly sceneNpcs: readonly string[];
  /** Environment features in current location */
  readonly sceneFeatures: readonly string[];
  /** Connected exits (location IDs) */
  readonly sceneExits: readonly string[];
  /** Environment conditions active */
  readonly sceneConditions: readonly string[];
  /** Suggestions offered to the player */
  readonly sceneSuggestions: readonly string[];

  // === GAME PROGRESS ===
  readonly stalkerClockValue: number;
  readonly currentBeat: string;

  // === META ===
  readonly comment: string;
  readonly timestamp: number;
}

// === HASH / DEDUP ===

export function hashReport(locationName: string, input: string, turn: number): string {
  let hash = 0;
  const str = `${locationName}:${input}:${turn}`;
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

export function storeHash(hash: string): void {
  try {
    const hashes = getStoredHashes();
    hashes.push(hash);
    const trimmed = hashes.length > MAX_STORED_HASHES ? hashes.slice(-MAX_STORED_HASHES) : hashes;
    localStorage.setItem(DEDUP_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable
  }
}

export function isDuplicate(hash: string): boolean {
  return getStoredHashes().includes(hash);
}

// === OFFLINE FALLBACK ===

function saveFailedReport(report: PlaytestReport): void {
  try {
    const raw = localStorage.getItem(FAILED_REPORTS_KEY);
    const existing: PlaytestReport[] = raw ? (JSON.parse(raw) as PlaytestReport[]) : [];
    existing.push(report);
    const trimmed = existing.length > MAX_FAILED_REPORTS ? existing.slice(-MAX_FAILED_REPORTS) : existing;
    localStorage.setItem(FAILED_REPORTS_KEY, JSON.stringify(trimmed));
  } catch {
    // skip silently
  }
}

// === SEND ===

export async function sendReport(report: PlaytestReport): Promise<boolean> {
  if (!FEEDBACK_ENDPOINT) return false;
  try {
    const url = new URL(FEEDBACK_ENDPOINT);
    url.searchParams.set('payload', JSON.stringify(report));
    await fetch(url.toString(), { mode: 'no-cors' });
    return true;
  } catch (err) {
    console.error('[feedback] sendReport failed:', err);
    saveFailedReport(report);
    return false;
  }
}

// === ANTI-SPAM CHECK ===

export interface AntiSpamState {
  reportCount: number;
  lastReportTime: number;
}

export function checkAntiSpam(
  state: AntiSpamState,
  hash: string,
): { allowed: boolean; warning: string } {
  if (state.reportCount >= MAX_REPORTS_PER_SESSION) {
    return { allowed: false, warning: `Limite atteinte (${MAX_REPORTS_PER_SESSION} rapports par session).` };
  }
  const now = Date.now();
  if (now - state.lastReportTime < REPORT_COOLDOWN_MS) {
    const remaining = Math.ceil((REPORT_COOLDOWN_MS - (now - state.lastReportTime)) / 1000);
    return { allowed: false, warning: `Patientez ${remaining}s avant le prochain rapport.` };
  }
  if (isDuplicate(hash)) {
    return { allowed: false, warning: 'Ce rapport a deja ete soumis.' };
  }
  return { allowed: true, warning: '' };
}
