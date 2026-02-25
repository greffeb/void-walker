// ---------------------------------------------------------------------------
// src/ui/components/BugReportButton.tsx — Per-turn bug report button
// ---------------------------------------------------------------------------
// Discreet KO button on each narrative card. Expands to comment field
// + send button on click. Report includes full reproducibility data:
// seed, skeleton, setting, class, difficulty, full input history.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import type { TurnEntry, ScenarioLoopState } from '../hooks/useScenarioLoop';
import {
  sendReport, checkAntiSpam, hashReport, storeHash,
  type PlaytestReport, type AntiSpamState,
} from '../utils/feedback';

interface BugReportButtonProps {
  readonly entry: TurnEntry;
  readonly loopState: ScenarioLoopState;
  readonly antiSpam: AntiSpamState;
  readonly onReported: (turnId: number) => void;
}

type ReportState = 'idle' | 'open' | 'sending' | 'sent' | 'error';

export function BugReportButton({
  entry,
  loopState,
  antiSpam,
  onReported,
}: BugReportButtonProps): JSX.Element {
  const [reportState, setReportState] = useState<ReportState>(entry.reported ? 'sent' : 'idle');
  const [comment, setComment] = useState('');
  const [warning, setWarning] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (reportState === 'open' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [reportState]);

  if (reportState === 'sent') {
    return (
      <span className="font-mono text-[10px] text-gray-600">rapport envoye</span>
    );
  }

  if (reportState === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setReportState('open')}
        className="rounded px-1.5 py-0.5 font-mono text-xs text-gray-600 transition-colors hover:bg-red-950/30 hover:text-red-400"
        title="Signaler un probleme"
      >
        KO
      </button>
    );
  }

  const { gameState, seed, turnHistory } = loopState;
  const char = gameState.character;
  const { trace, diceRoll, sceneSnapshot } = entry;

  const handleSend = async (): Promise<void> => {
    const hash = hashReport(entry.locationName, entry.input, entry.id);
    const check = checkAntiSpam(antiSpam, hash);
    if (!check.allowed) {
      setWarning(check.warning);
      return;
    }

    // Build full input history for replay (all turns up to and including this one)
    const inputHistory = turnHistory
      .filter(t => t.id <= entry.id)
      .map(t => t.input);

    const report: PlaytestReport = {
      // Reproducibility
      seed,
      skeletonId: gameState.scenarioId ?? '',
      settingId: gameState.scenario?.setting.id ?? '',
      playerClass: char?.className ?? '',
      difficulty: gameState.difficulty,
      turn: entry.id,
      inputHistory,

      // Context
      locationId: sceneSnapshot.locationId,
      locationName: entry.locationName,
      playerInput: entry.input,

      // Parser
      parsedVerb: trace.parsedVerb ?? '',
      parsedTarget: trace.parsedTarget ?? '',
      parsedTargetName: trace.parsedTargetName ?? '',
      parseStrategy: trace.parseStrategy,
      parseCreative: trace.parseCreative,

      // Resolution
      isAutoVerb: trace.isAutoVerb,
      statId: trace.statId ?? '',
      effectiveStatValue: trace.effectiveStatValue,
      diceNatural: diceRoll?.natural ?? 0,
      diceTotal: diceRoll?.total ?? 0,
      diceModifier: diceRoll?.modifier ?? 0,
      dc: trace.effectiveDC,
      outcome: trace.outcome ?? '',
      failsafeActivated: trace.failsafeActivated,
      failsafeDcReduction: trace.failsafeDcReduction,
      shipMemoryMod: trace.shipMemoryMod,

      // Consequences
      consequences: trace.consequenceDetails,
      consequenceTypes: trace.consequenceTypes,
      triggeredConditions: trace.triggeredConditions,
      deathResult: trace.deathResult,

      // NPC
      npcReacted: trace.npcReacted,
      npcAttackHit: trace.npcAttackHit,
      npcAttackDamage: trace.npcAttackDamage,

      // Narrative
      narration: entry.narrative,

      // Player state
      characterHp: char?.hp ?? 0,
      characterMaxHp: char?.maxHp ?? 0,
      characterO2: char?.oxygen ?? 0,
      conditions: char?.conditions.map(c => c.id) ?? [],
      inventory: char?.inventory ?? [],

      // Scene
      sceneItems: sceneSnapshot.items,
      sceneNpcs: sceneSnapshot.npcs,
      sceneFeatures: sceneSnapshot.features,
      sceneExits: sceneSnapshot.exits,
      sceneConditions: sceneSnapshot.conditions,
      sceneSuggestions: sceneSnapshot.suggestions,

      // Game progress
      stalkerClockValue: gameState.stalkerClockState.actionsSinceLastProgression,
      currentBeat: gameState.currentBeat,

      // Meta
      comment,
      timestamp: Date.now(),
    };

    storeHash(hash);
    setReportState('sending');
    const ok = await sendReport(report);
    setReportState(ok ? 'sent' : 'error');
    onReported(entry.id);
  };

  if (reportState === 'error') {
    return (
      <span className="font-mono text-[10px] text-yellow-500">erreur reseau — sauvegarde local</span>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5 border-t border-gray-800/50 pt-2">
      <textarea
        ref={textareaRef}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[40px] rounded border border-gray-700 bg-[var(--color-void-dark)] px-2 py-1 font-mono text-xs text-white outline-none placeholder:text-gray-600 focus:border-red-600"
        placeholder="Qu'est-ce qui ne va pas ?"
        maxLength={500}
      />
      {warning && <div className="font-mono text-[10px] text-yellow-400">{warning}</div>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { void handleSend(); }}
          disabled={reportState === 'sending'}
          className="rounded border border-red-700 bg-transparent px-2 py-1 font-mono text-[10px] font-bold text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50"
        >
          {reportState === 'sending' ? 'ENVOI...' : 'ENVOYER'}
        </button>
        <button
          type="button"
          onClick={() => { setReportState('idle'); setComment(''); setWarning(''); }}
          className="rounded px-2 py-1 font-mono text-[10px] text-gray-500 transition-colors hover:text-gray-300"
        >
          ANNULER
        </button>
      </div>
    </div>
  );
}
