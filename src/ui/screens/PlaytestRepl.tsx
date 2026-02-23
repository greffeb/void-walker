// ---------------------------------------------------------------------------
// src/ui/screens/PlaytestRepl.tsx — Game loop screen
// ---------------------------------------------------------------------------
// Situation → User Input → Resolution + Dice → Feedback → Next Situation
// Mobile-first, card-based layout. Replaces old terminal REPL.
// ---------------------------------------------------------------------------

import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { useGameLoop, type ResolutionData } from '../hooks/useGameLoop';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { t } from '@i18n/index';
import type { StringKey } from '@i18n/types';
import type { Situation } from '@content/situationGenerator';
import { CLASSES } from '@content/classes';
import { ITEM_DEFINITIONS } from '@content/items';

// === HELPERS ===

function ts(key: string): string {
  return t(key as StringKey);
}

// === SUB-COMPONENTS ===

/** Situation card — displays the current situation */
function SituationCard({ situation }: { readonly situation: Situation }): JSX.Element {
  const typeColors: Record<string, string> = {
    combat: 'border-red-700 text-red-400',
    exploration: 'border-green-700 text-green-400',
    environmental: 'border-yellow-700 text-yellow-400',
    discovery: 'border-cyan-700 text-cyan-400',
  };
  const color = typeColors[situation.type] ?? 'border-gray-700 text-gray-400';
  const bgColors: Record<string, string> = {
    combat: 'bg-red-950/20',
    exploration: 'bg-green-950/20',
    environmental: 'bg-yellow-950/20',
    discovery: 'bg-cyan-950/20',
  };
  const bg = bgColors[situation.type] ?? 'bg-gray-950/20';

  return (
    <div className={`rounded border ${color.split(' ')[0]} ${bg} p-3`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-xs font-bold ${color.split(' ')[1]}`}>
          {situation.typeLabel}
        </span>
        <span className="font-mono text-xs text-gray-500">
          {situation.locationName}
        </span>
      </div>
      <p className="font-mono text-sm leading-relaxed text-gray-200">
        {situation.description}
      </p>
      {situation.scene.environmentConditions.length > 0 && (
        <div className="mt-2 flex gap-2">
          {situation.scene.environmentConditions.map((cond) => (
            <span
              key={cond}
              className="rounded bg-gray-800 px-2 py-0.5 font-mono text-xs text-yellow-400"
            >
              {cond === 'dark' ? 'OBSCURITE' : cond === 'zero_g' ? 'ZERO-G' : cond === 'time_pressure' ? 'URGENCE' : String(cond).toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Resolution display — shows dice roll and outcome */
function ResolutionDisplay({ resolution }: { readonly resolution: ResolutionData }): JSX.Element {
  const outcomeColors: Record<string, string> = {
    crit_success: 'text-yellow-300 border-yellow-600',
    success: 'text-green-400 border-green-700',
    failure: 'text-red-400 border-red-700',
    crit_failure: 'text-red-500 border-red-600',
  };
  const color = outcomeColors[resolution.outcome] ?? 'text-gray-400 border-gray-700';

  if (resolution.auto) {
    return (
      <div className="rounded border border-green-800 bg-green-950/20 p-3">
        <div className="font-mono text-sm text-green-400">
          ACTION AUTOMATIQUE : {resolution.verbName} {resolution.targetName}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded border ${color.split(' ')[1]} bg-[var(--color-void-dark)] p-3`}>
      {/* Outcome header */}
      <div className={`mb-2 font-mono text-lg font-bold ${color.split(' ')[0]}`}>
        {resolution.outcomeLabel}
      </div>

      {/* Action summary */}
      <div className="mb-3 font-mono text-sm text-gray-300">
        <span className="text-purple-400">{resolution.verbName}</span>
        {' sur '}
        <span className="text-white">{resolution.targetName}</span>
        {resolution.creative && (
          <span className="ml-2 rounded bg-purple-900/50 px-1.5 py-0.5 text-xs text-purple-300">
            CREATIF
          </span>
        )}
      </div>

      {/* Dice roll */}
      <div className="mb-2 rounded bg-[var(--color-void-black)] p-2">
        <div className="font-mono text-sm text-cyan-400">
          D20({resolution.diceResult.natural})
          {' + '}{resolution.stat}({resolution.statValue})
          {resolution.diceResult.luckBonus > 0 && <>{' + '}LCK({resolution.diceResult.luckBonus})</>}
          {' = '}<span className="font-bold text-white">{resolution.diceResult.total}</span>
          {' vs DC '}<span className="font-bold text-white">{resolution.dc}</span>
        </div>
      </div>

      {/* DC breakdown */}
      <div className="mb-2 font-mono text-xs text-gray-500">
        DC: base({resolution.difficultyBreakdown.base})
        {resolution.difficultyBreakdown.verbMod !== 0 && <> verbe({resolution.difficultyBreakdown.verbMod > 0 ? '+' : ''}{resolution.difficultyBreakdown.verbMod})</>}
        {resolution.difficultyBreakdown.compatibilityPenalty !== 0 && <> compat(+{resolution.difficultyBreakdown.compatibilityPenalty})</>}
        {resolution.difficultyBreakdown.contextMods !== 0 && <> ctx({resolution.difficultyBreakdown.contextMods > 0 ? '+' : ''}{resolution.difficultyBreakdown.contextMods})</>}
        {resolution.difficultyBreakdown.creativityMod !== 0 && <> crea({resolution.difficultyBreakdown.creativityMod})</>}
        {resolution.difficultyBreakdown.presetMod !== 0 && <> preset({resolution.difficultyBreakdown.presetMod > 0 ? '+' : ''}{resolution.difficultyBreakdown.presetMod})</>}
      </div>

      {/* Combat details */}
      {resolution.combat && (
        <div className="mt-3 border-t border-gray-800 pt-2">
          {resolution.combat.fled ? (
            <div className={`font-mono text-sm ${resolution.combat.fleeSuccess ? 'text-green-400' : 'text-red-400'}`}>
              {resolution.combat.fleeSuccess
                ? 'Fuite reussie ! Vous echappez au combat.'
                : 'Fuite echouee ! L\'ennemi riposte.'}
            </div>
          ) : resolution.combat.hit ? (
            <div className="font-mono text-sm">
              <span className="text-orange-400">
                {resolution.combat.damageDealt} degats infliges a {resolution.combat.npcName}
                {resolution.combat.critical && ' [CRITIQUE]'}
                {resolution.combat.weakPointHit && ' [POINT FAIBLE]'}
              </span>
              <div className="mt-1 text-xs text-gray-500">
                PV ennemi: {resolution.combat.npcHpBefore} {'->'} {resolution.combat.npcHpAfter}
              </div>
              {resolution.combat.npcKilled && (
                <div className="mt-1 font-bold text-green-400">ENNEMI VAINCU !</div>
              )}
            </div>
          ) : (
            <div className="font-mono text-sm text-gray-400">
              {resolution.combat.npcDodged
                ? `${resolution.combat.npcName} esquive votre attaque !`
                : 'Attaque ratee.'}
            </div>
          )}
        </div>
      )}

      {/* Difficulty details */}
      {resolution.difficultyDetails.length > 0 && (
        <div className="mt-2 font-mono text-xs text-gray-600">
          {resolution.difficultyDetails.join(' | ')}
        </div>
      )}
    </div>
  );
}

// === MAIN COMPONENT ===

export function PlaytestRepl(): JSX.Element {
  const {
    state, selectClass, submitAction, submitFeedback, nextSituation, classList,
  } = useGameLoop();

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on phase change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [state.phase, state.resolution]);

  // Focus input when in situation phase
  useEffect(() => {
    if (state.phase === 'situation') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.phase, state.situation?.id]);

  const handleSubmit = (): void => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    submitAction(trimmed);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // === CLASS SELECT PHASE ===
  if (state.phase === 'class_select') {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-[var(--color-void-black)] px-4">
        <h1 className="mb-2 font-mono text-3xl font-bold tracking-widest text-white">
          VOID WALKER
        </h1>
        <p className="mb-6 font-mono text-xs text-gray-500">
          Playtest — Boucle de jeu
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          {classList.map((cls) => {
            const classDef = CLASSES[cls.id];
            const stats = classDef.baseStats;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => selectClass(cls.id)}
                className="rounded border border-gray-700 bg-[var(--color-void-dark)] p-3 text-left font-mono transition-colors hover:border-purple-600 hover:bg-purple-950/20 active:bg-purple-900/30"
              >
                <div className="mb-1 text-sm font-bold text-purple-400">
                  {ts(cls.nameKey).toUpperCase()}
                </div>
                <div className="mb-1 text-xs text-gray-400">
                  {ts(cls.descriptionKey)}
                </div>
                <div className="text-xs text-gray-600">
                  FOR:{stats.FOR} DEF:{stats.DEF} AGI:{stats.AGI} INT:{stats.INT} PER:{stats.PER} CHA:{stats.CHA} LCK:{stats.LCK} | PV:{classDef.startingHp}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === GAME LOOP PHASES ===
  const char = state.character;

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--color-void-black)]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="font-mono text-sm font-bold text-gray-400">VOID WALKER</span>
        <span className="font-mono text-xs text-gray-500">
          Tour {state.turnCount}
        </span>
        {char && (
          <span className="font-mono text-xs text-gray-500">
            {ts(`class.${char.className}` as StringKey).toUpperCase()} | PV:{char.hp}/{char.maxHp}
          </span>
        )}
      </div>

      {/* Scrollable content area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto p-3"
        onClick={() => state.phase === 'situation' && inputRef.current?.focus()}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {/* Character inventory quick view */}
          {char && (
            <div className="flex flex-wrap gap-1.5">
              {char.inventory.slice(0, 6).map((itemId) => {
                const itemDef = ITEM_DEFINITIONS[itemId];
                const name = itemDef ? ts(itemDef.nameKey) : itemId;
                const isEquipped = itemId === char.equippedWeapon || itemId === char.equippedArmor;
                return (
                  <span
                    key={itemId}
                    className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                      isEquipped
                        ? 'bg-purple-900/40 text-purple-300'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {name}{isEquipped ? ' *' : ''}
                  </span>
                );
              })}
            </div>
          )}

          {/* Situation card */}
          {state.situation && (
            <SituationCard situation={state.situation} />
          )}

          {/* Error display */}
          {state.error && (
            <div className="rounded border border-yellow-700 bg-yellow-950/20 p-2 font-mono text-xs text-yellow-400">
              {state.error}
            </div>
          )}

          {/* Resolution display */}
          {state.resolution && (state.phase === 'resolution' || state.phase === 'feedback') && (
            <ResolutionDisplay resolution={state.resolution} />
          )}

          {/* Feedback panel */}
          {state.resolution && state.situation && (state.phase === 'resolution' || state.phase === 'feedback') && (
            <FeedbackPanel
              situation={state.situation}
              resolution={state.resolution}
              onFeedback={submitFeedback}
              onNext={nextSituation}
              reportCount={state.feedback.filter((f) => f.thumbs === 'down').length}
            />
          )}
        </div>
      </div>

      {/* Input area — only visible during situation phase */}
      {state.phase === 'situation' && (
        <div className="border-t border-gray-800 bg-[var(--color-void-dark)] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-purple-400">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none bg-transparent font-mono text-sm text-white outline-none placeholder:text-gray-600"
              placeholder="Que faites-vous ?"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="send"
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded bg-purple-700 px-3 py-1 font-mono text-xs font-bold text-white active:bg-purple-600"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Player death overlay */}
      {char && char.hp <= 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
          <div className="font-mono text-2xl font-bold text-red-500">VOUS ETES MORT</div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded border border-red-700 px-6 py-2 font-mono text-sm text-red-400 transition-colors hover:bg-red-950/30"
          >
            RECOMMENCER
          </button>
        </div>
      )}
    </div>
  );
}
