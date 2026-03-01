// ---------------------------------------------------------------------------
// src/ui/screens/PlaytestScreen.tsx — Minimal playtest UI for friends
// ---------------------------------------------------------------------------
// Real scenario game loop: location, HP, inventory, 2 suggestions,
// narrative history with per-turn bug reporting.
// ---------------------------------------------------------------------------

import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { useScenarioLoop, type TurnEntry, type ScenarioLoopState } from '../hooks/useScenarioLoop';
import { BugReportButton } from '../components/BugReportButton';
import { CLASSES } from '@content/classes';
import { ITEM_DEFINITIONS } from '@content/items';
import { t } from '@i18n/index';
import { formatSuggestionAsInput } from '@engine/scene';
import { narrateScene } from '@narration/scene';
import type { SceneToken } from '@narration/scene';
import type { StringKey } from '@i18n/types';
import type { DifficultyLevel, PlayerClassName, GameState } from '@engine/types';
import type { SuggestionCandidate } from '@engine/suggestions';
import type { AntiSpamState } from '../utils/feedback';

// === HELPERS ===

function ts(key: string): string {
  return t(key as StringKey);
}

function hpBar(hp: number, maxHp: number): string {
  const total = 10;
  const filled = Math.round((hp / maxHp) * total);
  return '\u2588'.repeat(Math.max(0, filled)) + '\u2591'.repeat(Math.max(0, total - filled));
}

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
    default: return outcome ?? '';
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

function translateInventory(inventory: readonly string[]): string {
  if (inventory.length === 0) return 'vide';
  return inventory.map(id => {
    const def = ITEM_DEFINITIONS[id];
    return def ? ts(def.nameKey) : id;
  }).join(', ');
}

// === SCENE TOKEN RENDERER ===

function SceneTokenSpan({ token }: { readonly token: SceneToken }): JSX.Element {
  switch (token.kind) {
    case 'text':     return <>{token.value}</>;
    case 'location': return <span className="font-bold text-white">{token.value}</span>;
    case 'feature':  return <span className="text-yellow-400">{token.value}</span>;
    case 'item':     return <span className="text-green-400">{token.value}</span>;
    case 'npc':      return <span className="text-fuchsia-400">{token.value}</span>;
    case 'exit':     return token.visited
      ? <span className="text-gray-400">{token.value}</span>
      : <span className="text-cyan-400">{token.value}</span>;
  }
}

function ProseLine({ tokens }: { readonly tokens: readonly SceneToken[] }): JSX.Element {
  return (
    <div>
      {tokens.map((tok, i) => <SceneTokenSpan key={i} token={tok} />)}
    </div>
  );
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
      <p className="mb-1 font-mono text-xs text-purple-400">PLAYTEST ALPHA</p>
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

// === NARRATIVE CARD ===

function NarrativeCard({
  entry,
  loopState,
  antiSpam,
  onReported,
}: {
  readonly entry: TurnEntry;
  readonly loopState: ScenarioLoopState;
  readonly antiSpam: AntiSpamState;
  readonly onReported: (turnId: number) => void;
}): JSX.Element {
  const { trace, diceRoll, narrative } = entry;
  const borderColor = trace.reformulated
    ? 'border-yellow-700/40'
    : outcomeBorderColor(trace.outcome);

  return (
    <div className={`rounded border ${borderColor} bg-gray-950/30 p-3`}>
      {/* Player input echo */}
      <div className="mb-2 font-mono text-xs text-gray-500">
        &gt; <span className="text-gray-300">{entry.input}</span>
      </div>

      {/* Narrative text */}
      <div className="mb-2 font-mono text-sm leading-relaxed text-gray-100">
        {narrative || <span className="italic text-gray-600">Pas de narration disponible.</span>}
      </div>

      {/* Dice info bar */}
      {!trace.reformulated && (
        <div className="mb-1 font-mono text-xs text-gray-500">
          {trace.parsedVerb && <span className="text-purple-400">{trace.parsedVerb}</span>}
          {trace.parsedTargetName && <> sur <span className="text-gray-300">{ts(trace.parsedTargetName)}</span></>}
          {trace.isAutoVerb && <span className="ml-2 text-green-400/60">— automatique</span>}
          {diceRoll && !trace.isAutoVerb && (
            <span className="ml-2">
              {trace.statId}({trace.effectiveStatValue}) + D20(<span className="text-cyan-400">{diceRoll.natural}</span>)
              {diceRoll.modifier !== 0 && <>{diceRoll.modifier > 0 ? '+' : ''}{diceRoll.modifier}</>}
              {' '}= {diceRoll.total} vs DC {trace.effectiveDC}
            </span>
          )}
          {trace.outcome && (
            <span className={`ml-2 font-bold ${outcomeColor(trace.outcome)}`}>
              {outcomeLabel(trace.outcome)}
            </span>
          )}
        </div>
      )}

      {/* Consequences */}
      {trace.consequenceDetails.length > 0 && (
        <div className="mb-1">
          {trace.consequenceDetails.map((d, i) => (
            <div key={i} className="font-mono text-xs text-orange-400/80">{d}</div>
          ))}
        </div>
      )}

      {/* NPC attack */}
      {trace.npcAttackHit && (
        <div className="mb-1 font-mono text-xs text-red-400">
          Attaque recue: -{trace.npcAttackDamage} PV
        </div>
      )}

      {/* Post-action scene — updated room state after the action */}
      {entry.resultScene && (() => {
        const scene = narrateScene(entry.resultScene, entry.introMode ?? 'revisit', 'fr');
        const hasContent = scene.features.length > 0
          || scene.items.length > 0 || scene.npcs.length > 0 || scene.exits.length > 0;
        if (!hasContent) return null;
        const showIntro = entry.introMode !== null && scene.intro.length > 0;
        return (
          <div className="mt-2 border-t border-gray-800/50 pt-2 font-mono text-sm leading-relaxed text-gray-300">
            {showIntro && <ProseLine tokens={scene.intro} />}
            {scene.features.length > 0 && <div className={showIntro ? 'mt-1' : ''}><ProseLine tokens={scene.features} /></div>}
            {scene.items.length > 0    && <div className="mt-1"><ProseLine tokens={scene.items} /></div>}
            {scene.npcs.length > 0     && <div className="mt-1"><ProseLine tokens={scene.npcs} /></div>}
            {scene.exits.length > 0    && <div className="mt-1"><ProseLine tokens={scene.exits} /></div>}
            {scene.obstacle            && <div className="mt-1 italic text-orange-400/80">{scene.obstacle}</div>}
            <div className="mt-1 text-gray-500">{scene.prompt}</div>
          </div>
        );
      })()}

      {/* Bug report */}
      <div className="flex justify-end">
        <BugReportButton
          entry={entry}
          loopState={loopState}
          antiSpam={antiSpam}
          onReported={onReported}
        />
      </div>
    </div>
  );
}

// === SUGGESTION BUTTONS ===

function SuggestionButtons({
  suggestions,
  onSelect,
}: {
  readonly suggestions: readonly SuggestionCandidate[];
  readonly onSelect: (s: SuggestionCandidate) => void;
}): JSX.Element | null {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex gap-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(s)}
          className="flex-1 rounded border border-purple-800/60 bg-purple-950/20 px-2 py-1.5 font-mono text-xs text-purple-300 transition-colors hover:border-purple-600 hover:bg-purple-900/30 active:bg-purple-800/40"
        >
          {formatSuggestionAsInput(s)}
        </button>
      ))}
    </div>
  );
}

// === GAME OVER SCREEN ===

function GameOverScreen({
  victory,
  gameState,
  onRestart,
}: {
  readonly victory: boolean;
  readonly gameState: GameState;
  readonly onRestart: () => void;
}): JSX.Element {
  const char = gameState.character;
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[var(--color-void-black)] px-4">
      <div className={`mb-4 font-mono text-4xl font-bold tracking-widest ${victory ? 'text-green-400' : 'text-red-500'}`}>
        {victory ? 'VICTOIRE' : 'VOUS ETES MORT'}
      </div>
      {char && (
        <div className="mb-6 font-mono text-xs text-gray-500 text-center">
          <div>Classe: {ts(`class.${char.className}`)} | Difficulte: {gameState.difficulty}</div>
          <div>Survie: {gameState.turn} tours</div>
          {gameState.victoryResult && (
            <div className="mt-1 text-green-400/70">Type: {gameState.victoryResult.type}</div>
          )}
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

export function PlaytestScreen(): JSX.Element {
  const {
    state, classList, selectDifficulty, selectClass,
    submitInput, submitSuggestion, markReported, restart,
    suggestions, locationName, sceneDescription,
  } = useScenarioLoop();

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastReportTimeRef = useRef(0);

  // Anti-spam state for bug reports
  const antiSpam: AntiSpamState = {
    reportCount: state.feedbackCount,
    lastReportTime: lastReportTimeRef.current,
  };

  // Auto-scroll on new turn
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [state.turnHistory.length]);

  // Focus input
  useEffect(() => {
    if (state.phase === 'playing') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.phase, state.turnHistory.length]);

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

  const handleSuggestion = (s: SuggestionCandidate): void => {
    submitSuggestion(s);
    setInputValue('');
  };

  const handleReported = (turnId: number): void => {
    lastReportTimeRef.current = Date.now();
    markReported(turnId);
  };

  // === PHASE ROUTING ===

  if (state.phase === 'difficulty_select') {
    return <DifficultySelect onSelect={selectDifficulty} />;
  }

  if (state.phase === 'class_select') {
    return (
      <ClassSelect
        classList={classList}
        difficulty={state.difficulty}
        onSelect={selectClass}
      />
    );
  }

  if (state.phase === 'victory' || state.phase === 'defeat') {
    return (
      <GameOverScreen
        victory={state.phase === 'victory'}
        gameState={state.gameState}
        onRestart={restart}
      />
    );
  }

  // === PLAYING ===

  const char = state.gameState.character;
  const inventory = char?.inventory ?? [];

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--color-void-black)]">
      {/* Header: location + HP */}
      <div className="shrink-0 border-b border-gray-800 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-gray-200">{locationName}</span>
          <span className="font-mono text-xs text-gray-600">T{state.gameState.turn}</span>
        </div>
        {char && (
          <div className="mt-0.5 font-mono text-xs">
            <span className={char.hp / char.maxHp < 0.3 ? 'text-red-400' : 'text-green-400'}>
              PV {hpBar(char.hp, char.maxHp)} {char.hp}/{char.maxHp}
            </span>
            <span className="ml-3 text-cyan-400/70">O2 {char.oxygen}%</span>
          </div>
        )}
      </div>

      {/* Exit panel — always visible navigation context */}
      {sceneDescription && sceneDescription.exits.length > 0 && (
        <div className="shrink-0 border-b border-gray-800/50 px-3 py-1">
          <div className="font-mono text-xs text-gray-500">
            Sorties : {sceneDescription.exits.map((e, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                <span className={e.visited ? 'text-gray-500' : 'text-cyan-400/70'}>{e.name}</span>
                {!e.visited && <span className="text-cyan-400/40"> ?</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable narrative history */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-3">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {/* Welcome message on first turn — prose narration with highlighted tokens */}
          {state.turnHistory.length === 0 && sceneDescription && (() => {
            const scene = narrateScene(sceneDescription, 'new_game', 'fr');
            return (
              <div className="rounded border border-gray-800 bg-gray-950/40 p-3 font-mono text-sm leading-relaxed text-gray-300">
                {scene.intro.length > 0    && <ProseLine tokens={scene.intro} />}
                {scene.features.length > 0 && <div className="mt-1"><ProseLine tokens={scene.features} /></div>}
                {scene.items.length > 0    && <div className="mt-1"><ProseLine tokens={scene.items} /></div>}
                {scene.npcs.length > 0     && <div className="mt-1"><ProseLine tokens={scene.npcs} /></div>}
                {scene.exits.length > 0    && <div className="mt-1"><ProseLine tokens={scene.exits} /></div>}
                {scene.obstacle            && <div className="mt-1 italic text-orange-400/80">{scene.obstacle}</div>}
                <div className="mt-2 text-gray-500">{scene.prompt}</div>
              </div>
            );
          })()}

          {/* Turn history */}
          {state.turnHistory.map((entry) => (
            <NarrativeCard
              key={entry.id}
              entry={entry}
              loopState={state}
              antiSpam={antiSpam}
              onReported={handleReported}
            />
          ))}

          {/* Error display */}
          {state.error && (
            <div className="rounded border border-red-800 bg-red-950/20 p-2 font-mono text-xs text-red-400">
              {state.error}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar: inventory + suggestions + input */}
      <div className="shrink-0 border-t border-gray-800 px-3 py-2">
        <div className="mx-auto max-w-lg">
          {/* Inventory */}
          <div className="mb-2 font-mono text-xs text-gray-500">
            Inventaire: <span className="text-gray-400">{translateInventory(inventory)}</span>
          </div>

          {/* Suggestions */}
          <div className="mb-2">
            <SuggestionButtons suggestions={suggestions} onSelect={handleSuggestion} />
          </div>

          {/* Input */}
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
        </div>
      </div>
    </div>
  );
}
