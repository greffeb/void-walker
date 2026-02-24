// ---------------------------------------------------------------------------
// src/ui/screens/NarrativePlaytest.tsx — Narrative playtest screen
// ---------------------------------------------------------------------------
// Immersive narrative experience: scene description → player input →
// composed French narration + compact dice info bar.
// ---------------------------------------------------------------------------

import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { useNarrativeLoop } from '../hooks/useNarrativeLoop';
import { Phase4FeedbackPanel } from '../components/Phase4FeedbackPanel';
import { CLASSES } from '@content/classes';
import { t } from '@i18n/index';
import type { StringKey } from '@i18n/types';
import type { Situation } from '@content/situationGenerator';
import type { TurnDebugTrace, DiceResult, DifficultyLevel, GameState } from '@engine/types';
import type { PlayerClassName } from '@engine/types';

// === HELPERS ===

function ts(key: string): string {
  return t(key as StringKey);
}

function hpBar(hp: number, maxHp: number): string {
  const total = 10;
  const filled = Math.round((hp / maxHp) * total);
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, total - filled));
}

function o2Bar(o2: number): string {
  const total = 10;
  const filled = Math.round((o2 / 100) * total);
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, total - filled));
}

// === OUTCOME STYLING ===

function outcomeColor(outcome: string | null): string {
  switch (outcome) {
    case 'crit_success': return 'text-yellow-300';
    case 'success': return 'text-green-400';
    case 'failure': return 'text-red-400';
    case 'crit_failure': return 'text-red-500';
    default: return 'text-gray-400';
  }
}

function outcomeLabel(outcome: string | null): string {
  switch (outcome) {
    case 'crit_success': return 'CRITIQUE !';
    case 'success': return 'SUCCES';
    case 'partial': return 'PARTIEL';
    case 'failure': return 'ECHEC';
    case 'crit_failure': return 'FUMBLE !';
    default: return outcome ?? '—';
  }
}

function outcomeBorderColor(outcome: string | null): string {
  switch (outcome) {
    case 'crit_success': return 'border-yellow-700/50';
    case 'success': return 'border-green-700/50';
    case 'failure': return 'border-red-700/50';
    case 'crit_failure': return 'border-red-600/50';
    default: return 'border-gray-700/50';
  }
}

// === DIFFICULTY SELECT ===

function DifficultySelect({ onSelect }: { readonly onSelect: (d: DifficultyLevel) => void }): JSX.Element {
  const options: { id: DifficultyLevel; label: string; desc: string; color: string }[] = [
    { id: 'explorer', label: 'EXPLORATEUR', desc: 'Mode decouverte. Anti-blocage genereux.', color: 'border-green-700 hover:border-green-500 text-green-400' },
    { id: 'survivor', label: 'SURVIVANT', desc: 'Experience standard. Tension equilibree.', color: 'border-yellow-700 hover:border-yellow-500 text-yellow-400' },
    { id: 'nightmare', label: 'CAUCHEMAR', desc: 'Mort permanente. Pas de filet de securite.', color: 'border-red-700 hover:border-red-500 text-red-400' },
  ];

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[var(--color-void-black)] px-4">
      <h1 className="mb-2 font-mono text-3xl font-bold tracking-widest text-white">VOID WALKER</h1>
      <p className="mb-8 font-mono text-xs text-gray-500">Choisissez la difficulte</p>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`rounded border ${opt.color} bg-[var(--color-void-dark)] p-4 text-left font-mono transition-colors`}
          >
            <div className="mb-1 text-sm font-bold">{opt.label}</div>
            <div className="text-xs text-gray-500">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// === CLASS SELECT ===

function ClassSelect({
  classList,
  difficulty,
  onSelect,
}: {
  readonly classList: readonly { id: PlayerClassName; nameKey: string; descriptionKey: string }[];
  readonly difficulty: DifficultyLevel;
  readonly onSelect: (c: PlayerClassName) => void;
}): JSX.Element {
  const diffLabel: Record<DifficultyLevel, string> = {
    explorer: 'EXPLORATEUR',
    survivor: 'SURVIVANT',
    nightmare: 'CAUCHEMAR',
  };

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[var(--color-void-black)] px-4">
      <h1 className="mb-1 font-mono text-3xl font-bold tracking-widest text-white">VOID WALKER</h1>
      <p className="mb-6 font-mono text-xs text-gray-500">
        {diffLabel[difficulty]} — Choisissez votre classe
      </p>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {classList.map((cls) => {
          const classDef = CLASSES[cls.id];
          const stats = classDef.baseStats;
          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => onSelect(cls.id)}
              className="rounded border border-gray-700 bg-[var(--color-void-dark)] p-3 text-left font-mono transition-colors hover:border-purple-600 hover:bg-purple-950/20"
            >
              <div className="mb-1 text-sm font-bold text-purple-400">
                {ts(cls.nameKey).toUpperCase()}
              </div>
              <div className="mb-1 text-xs text-gray-400">{ts(cls.descriptionKey)}</div>
              <div className="text-xs text-gray-600">
                FOR:{stats.FOR} DEF:{stats.DEF} AGI:{stats.AGI} INT:{stats.INT}
                {' '}PER:{stats.PER} CHA:{stats.CHA} LCK:{stats.LCK} | PV:{classDef.startingHp}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// === SCENE CARD ===

function SceneCard({ situation }: { readonly situation: Situation }): JSX.Element {
  const typeIcons: Record<string, string> = {
    combat: '⚔',
    exploration: '🔍',
    environmental: '⚠',
    discovery: '✦',
  };
  const icon = typeIcons[situation.type] ?? '●';

  return (
    <div className="rounded border border-gray-800 bg-gray-950/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="font-mono text-sm font-bold text-gray-200">{situation.locationName}</span>
        {situation.scene.environmentConditions.length > 0 && (
          <div className="ml-auto flex gap-1">
            {situation.scene.environmentConditions.map((cond) => (
              <span key={cond} className="rounded bg-gray-800/80 px-1.5 py-0.5 font-mono text-[10px] text-yellow-500/80">
                {cond === 'dark' ? 'OBSCURITE' : cond === 'zero_g' ? 'ZERO-G' : cond === 'time_pressure' ? 'URGENCE' : String(cond).toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="font-mono text-sm leading-relaxed text-gray-300">{situation.description}</p>
      {situation.scene.suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {situation.scene.suggestions.map((s, i) => (
            <span key={i} className="rounded bg-purple-900/15 px-2 py-0.5 font-mono text-[11px] text-purple-400/70">
              {s.verb} {s.target?.nameKey ? ts(s.target.nameKey) : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// === DICE INFO BAR ===

function DiceInfoBar({
  trace,
  diceRoll,
}: {
  readonly trace: TurnDebugTrace;
  readonly diceRoll: DiceResult | null;
}): JSX.Element {
  // Reformulation — no dice to show
  if (trace.reformulated) {
    return (
      <div className="font-mono text-xs text-yellow-400/80">
        ↳ Reformulation demandee
      </div>
    );
  }

  const verb = trace.parsedVerb ?? '?';
  const targetName = trace.parsedTargetName ? ts(trace.parsedTargetName) : null;

  // Auto verb — no dice roll
  if (trace.isAutoVerb) {
    return (
      <div className="font-mono text-xs text-gray-500">
        <span className="text-purple-400">{verb}</span>
        {targetName && <> sur <span className="text-gray-300">{targetName}</span></>}
        <span className="ml-2 text-green-400/60">— automatique</span>
      </div>
    );
  }

  // Normal resolution with dice
  const stat = trace.statId ?? '?';
  const statVal = trace.effectiveStatValue;
  const dc = trace.effectiveDC;
  const outcome = trace.outcome;

  return (
    <div className="font-mono text-xs text-gray-500">
      <span className="text-purple-400">{verb}</span>
      {targetName && <> sur <span className="text-gray-300">{targetName}</span></>}
      {diceRoll && (
        <span className="ml-2">
          {stat}({statVal}) + D20(<span className="text-cyan-400">{diceRoll.natural}</span>)
          {diceRoll.modifier !== 0 && <>{diceRoll.modifier > 0 ? '+' : ''}{diceRoll.modifier}</>}
          {' '}= {diceRoll.total} vs DC {dc}
        </span>
      )}
      {outcome && (
        <span className={`ml-2 font-bold ${outcomeColor(outcome)}`}>
          → {outcomeLabel(outcome)}
        </span>
      )}
    </div>
  );
}

// === NARRATIVE CARD ===

function NarrativeCard({
  narration,
  trace,
  diceRoll,
}: {
  readonly narration: string;
  readonly trace: TurnDebugTrace;
  readonly diceRoll: DiceResult | null;
}): JSX.Element {
  const borderColor = trace.reformulated
    ? 'border-yellow-700/40'
    : outcomeBorderColor(trace.outcome);

  return (
    <div className={`rounded border ${borderColor} bg-gray-950/30 p-4`}>
      {/* Narrative text */}
      <div className="mb-3 font-mono text-sm leading-relaxed text-gray-100">
        {narration || <span className="italic text-gray-600">Pas de narration disponible.</span>}
      </div>

      {/* Compact dice info */}
      <div className="border-t border-gray-800/50 pt-2">
        <DiceInfoBar trace={trace} diceRoll={diceRoll} />
      </div>

      {/* Consequences — brief lines */}
      {trace.consequenceDetails.length > 0 && (
        <div className="mt-2 border-t border-gray-800/50 pt-2">
          {trace.consequenceDetails.map((d, i) => (
            <div key={i} className="font-mono text-xs text-orange-400/80">→ {d}</div>
          ))}
        </div>
      )}

      {/* NPC attack */}
      {trace.npcAttackHit && (
        <div className="mt-1 font-mono text-xs text-red-400">
          ⚔ Attaque recue: -{trace.npcAttackDamage} PV
        </div>
      )}
    </div>
  );
}

// === DEFEAT SCREEN ===

function DefeatScreen({ gameState, onRestart }: { readonly gameState: GameState; readonly onRestart: () => void }): JSX.Element {
  const char = gameState.character;
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[var(--color-void-black)] px-4">
      <div className="mb-4 font-mono text-4xl font-bold text-red-500 tracking-widest">
        VOUS ETES MORT
      </div>
      {char && (
        <div className="mb-6 font-mono text-xs text-gray-500 text-center">
          <div>Classe: {ts(`class.${char.className}`)} | Difficulte: {gameState.difficulty}</div>
          <div>Survie: {gameState.turn} tours</div>
        </div>
      )}
      <button
        type="button"
        onClick={onRestart}
        className="rounded border border-gray-600 bg-transparent px-6 py-2 font-mono text-sm text-gray-300 transition-colors hover:border-purple-600 hover:text-purple-400"
      >
        RECOMMENCER
      </button>
    </div>
  );
}

// === MAIN COMPONENT ===

export function NarrativePlaytest(): JSX.Element {
  const {
    state, classList, selectDifficulty, selectClass, submitInput, nextSituation, submitFeedback,
  } = useNarrativeLoop();

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on phase change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [state.loopPhase, state.lastTrace]);

  // Focus input when playing
  useEffect(() => {
    if (state.loopPhase === 'playing') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.loopPhase, state.situation?.id]);

  const handleSubmit = (): void => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    submitInput(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRestart = (): void => {
    window.location.reload();
  };

  // === PHASES ===

  if (state.loopPhase === 'difficulty_select') {
    return <DifficultySelect onSelect={selectDifficulty} />;
  }

  if (state.loopPhase === 'class_select') {
    return (
      <ClassSelect
        classList={classList}
        difficulty={state.difficulty}
        onSelect={selectClass}
      />
    );
  }

  if (state.loopPhase === 'defeat') {
    return <DefeatScreen gameState={state.gameState} onRestart={handleRestart} />;
  }

  // === GAME PHASES: playing + post_turn ===

  const char = state.gameState.character;
  const diffLabel: Record<DifficultyLevel, string> = {
    explorer: 'EXP',
    survivor: 'SUR',
    nightmare: 'CAU',
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--color-void-black)]">
      {/* Header bar — compact status */}
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2 shrink-0">
        <span className="font-mono text-sm font-bold text-gray-400">VOID WALKER</span>
        <span className="font-mono text-xs text-gray-600">{diffLabel[state.difficulty]}</span>
        {char && (
          <span className="font-mono text-xs text-gray-500">
            T{state.gameState.turn}
            {' '}
            <span className={char.hp / char.maxHp < 0.3 ? 'text-red-400' : 'text-green-400'}>
              {hpBar(char.hp, char.maxHp)} {char.hp}/{char.maxHp}
            </span>
            {' '}
            <span className="text-cyan-400/70">O₂ {o2Bar(char.oxygen)} {char.oxygen}%</span>
          </span>
        )}
      </div>

      {/* Scrollable content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-3">
        <div className="mx-auto flex max-w-lg flex-col gap-3">

          {/* Scene card */}
          {state.situation && <SceneCard situation={state.situation} />}

          {/* Error display */}
          {state.error && (
            <div className="rounded border border-red-800 bg-red-950/20 p-2 font-mono text-xs text-red-400">
              {state.error}
            </div>
          )}

          {/* === PLAYING — input bar === */}
          {state.loopPhase === 'playing' && (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Que faites-vous ?"
                className="flex-1 rounded border border-gray-700 bg-[var(--color-void-dark)] px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-600"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                className="rounded border border-purple-700 bg-transparent px-4 py-2 font-mono text-sm font-bold text-purple-400 transition-colors hover:bg-purple-900/30 disabled:opacity-40"
              >
                OK
              </button>
            </div>
          )}

          {/* === POST-TURN — narrative + feedback === */}
          {state.loopPhase === 'post_turn' && state.lastTrace && (
            <>
              {/* Player input echo */}
              <div className="font-mono text-xs text-gray-500">
                &gt; <span className="text-gray-300">{state.lastInput}</span>
              </div>

              {/* Narrative card */}
              <NarrativeCard
                narration={state.lastNarration ?? ''}
                trace={state.lastTrace}
                diceRoll={state.lastDiceRoll}
              />

              {/* Feedback + next situation */}
              {state.situation && (
                <div className="rounded border border-gray-800 bg-[var(--color-void-dark)] p-3">
                  <Phase4FeedbackPanel
                    situation={state.situation}
                    input={state.lastInput}
                    gameState={state.gameState}
                    trace={state.lastTrace}
                    diceRoll={state.lastDiceRoll}
                    onFeedback={submitFeedback}
                    onNext={nextSituation}
                    reportCount={state.feedbackCount}
                  />
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
