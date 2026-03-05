// ---------------------------------------------------------------------------
// src/ui/components/BugReportButton.tsx — Discreet KO button per turn card
// ---------------------------------------------------------------------------
// Expands to comment field + ENVOYER button on click.
// Report includes full reproducibility data: seed, skeleton, setting,
// class, difficulty, complete input history up to that turn.
// Sends to Google Apps Script endpoint (VITE_FEEDBACK_ENDPOINT).
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import type { TurnEntry } from '@stores/gameStore';
import {
  sendReport, checkAntiSpam, hashReport, storeHash,
} from '../utils/feedback';
import { getAppVersion } from '../utils/appVersion';
import type { SceneToken } from '@narration/scene';

const APP_VERSION = getAppVersion();

// Module-level session anti-spam (resets on page reload).
let _reportCount = 0;
let _lastReportTime = 0;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function tokensOfKind(tokens: readonly SceneToken[], kind: string): string[] {
  return tokens.filter(t => t.kind === kind).map(t => t.value);
}

function buildNarration(entry: TurnEntry): string {
  const parts: string[] = [];
  if (entry.narrative) parts.push(entry.narrative);
  if (entry.sceneIntro) {
    const scene = entry.sceneIntro;
    const showIntro = entry.introMode !== null;
    const sections = [
      ...(showIntro ? [scene.intro] : []),
      scene.features, scene.items, scene.npcs, scene.exits,
    ].filter(s => s.length > 0);
    for (const tokens of sections) parts.push(tokens.map(t => t.value).join(''));
    if (scene.obstacle) parts.push(scene.obstacle);
    parts.push(scene.prompt);
  }
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

type ReportState = 'idle' | 'open' | 'sending' | 'sent' | 'error';

interface BugReportButtonProps {
  readonly entry: TurnEntry;
}

export function BugReportButton({ entry }: BugReportButtonProps): JSX.Element {
  const [reportState, setReportState] = useState<ReportState>('idle');
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
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-system)' }}>
        rapport envoyé
      </span>
    );
  }

  if (reportState === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setReportState('open')}
        title="Signaler un problème"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: 'var(--danger)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 2px',
          letterSpacing: '0.05em',
          opacity: 0.7,
          transition: 'opacity 150ms',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '1';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '0.7';
        }}
      >
        KO
      </button>
    );
  }

  if (reportState === 'error') {
    return (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--warning)' }}>
        erreur réseau
      </span>
    );
  }

  const handleSend = async (): Promise<void> => {
    const hash = hashReport(entry.locationName, entry.input, entry.id);
    const check = checkAntiSpam({ reportCount: _reportCount, lastReportTime: _lastReportTime }, hash);
    if (!check.allowed) {
      setWarning(check.warning);
      return;
    }

    // Read store state at submission time (no subscription needed).
    const { seed, gameState, turnHistory } = useGameStore.getState();
    const char = gameState.character;
    const { trace, diceRoll } = entry;

    const inputHistory = turnHistory
      .filter(t => t.id <= entry.id)
      .map(t => t.input);

    const sceneIntro = entry.sceneIntro;
    const report = {
      appVersion: APP_VERSION,

      // Reproducibility
      seed,
      skeletonId: gameState.scenario?.skeleton.id ?? gameState.scenarioId ?? '',
      settingId: gameState.scenario?.setting.id ?? '',
      playerClass: char?.className ?? '',
      difficulty: gameState.difficulty,
      turn: entry.id,
      inputHistory,

      // Context
      locationId: entry.locationName,
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
      narration: buildNarration(entry),

      // Player state
      characterHp: char?.hp ?? 0,
      characterMaxHp: char?.maxHp ?? 0,
      characterO2: char?.oxygen ?? 0,
      conditions: char?.conditions.map(c => c.id) ?? [],
      inventory: char?.inventory ?? [],

      // Scene (extracted from sceneIntro tokens)
      sceneItems: sceneIntro ? tokensOfKind(sceneIntro.items, 'item') : [],
      sceneNpcs: sceneIntro ? tokensOfKind(sceneIntro.npcs, 'npc') : [],
      sceneFeatures: sceneIntro ? tokensOfKind(sceneIntro.features, 'feature') : [],
      sceneExits: sceneIntro ? tokensOfKind(sceneIntro.exits, 'exit') : [],
      sceneConditions: [] as readonly string[],
      sceneSuggestions: [] as readonly string[],

      // Game progress
      stalkerClockValue: gameState.stalkerClockState.actionsSinceLastProgression,
      currentBeat: gameState.currentBeat,

      // Meta
      comment,
      timestamp: Date.now(),
    };

    storeHash(hash);
    _reportCount++;
    _lastReportTime = Date.now();

    setReportState('sending');
    const ok = await sendReport(report);
    setReportState(ok ? 'sent' : 'error');
  };

  // 'open' or 'sending' state — show form
  return (
    <div
      style={{
        marginTop: '8px',
        padding: '8px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--danger-dim)',
        borderRadius: 'var(--radius)',
      }}
      onClick={e => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Qu'est-ce qui ne va pas ?"
        maxLength={500}
        style={{
          width: '100%',
          minHeight: '40px',
          background: 'var(--bg-input)',
          border: '1px solid var(--text-system)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-narrative)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          padding: '4px 8px',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
        onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--danger)'; }}
        onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--text-system)'; }}
      />
      {warning && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--warning)', marginTop: '4px' }}>
          {warning}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button
          type="button"
          onClick={() => { void handleSend(); }}
          disabled={reportState === 'sending'}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--danger)',
            background: 'none',
            border: '1px solid var(--danger-dim)',
            borderRadius: 'var(--radius)',
            padding: '4px 10px',
            cursor: reportState === 'sending' ? 'not-allowed' : 'pointer',
            opacity: reportState === 'sending' ? 0.5 : 1,
            transition: 'border-color 150ms',
          }}
          onMouseEnter={e => { if (reportState !== 'sending') (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--danger)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--danger-dim)'; }}
        >
          {reportState === 'sending' ? 'ENVOI…' : 'ENVOYER'}
        </button>
        <button
          type="button"
          onClick={() => { setReportState('idle'); setComment(''); setWarning(''); }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-system)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
          }}
        >
          ANNULER
        </button>
      </div>
    </div>
  );
}
