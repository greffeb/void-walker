// ---------------------------------------------------------------------------
// src/ui/screens/Phase4Playtest.tsx — Phase 4 verbose debug playtest screen
// ---------------------------------------------------------------------------
// Replaces PlaytestRepl. Shows the full 10-step trace from processTurn(),
// maintains persistent GameState across turns, and provides richer feedback.
// ---------------------------------------------------------------------------

import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { usePhase4Loop } from '../hooks/usePhase4Loop';
import { Phase4FeedbackPanel } from '../components/Phase4FeedbackPanel';
import { CLASSES } from '@content/classes';
import { ITEM_DEFINITIONS } from '@content/items';
import { t } from '@i18n/index';
import type { StringKey } from '@i18n/types';
import type { Situation } from '@content/situationGenerator';
import type { TurnDebugTrace, GameState, DifficultyLevel } from '@engine/types';
import type { PlayerClassName } from '@engine/types';

// === HELPERS ===

function ts(key: string): string {
  return t(key as StringKey);
}

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
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

function clockBar(val: number, max: number): string {
  const total = 15;
  const filled = Math.round((val / max) * total);
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, total - filled));
}

// === OUTCOME COLORS ===

function outcomeColor(outcome: string | null): string {
  switch (outcome) {
    case 'crit_success': return 'text-yellow-300';
    case 'success': return 'text-green-400';
    case 'failure': return 'text-red-400';
    case 'crit_failure': return 'text-red-500';
    default: return 'text-gray-400';
  }
}

function outcomeBorderColor(outcome: string | null): string {
  switch (outcome) {
    case 'crit_success': return 'border-yellow-600 bg-yellow-950/20';
    case 'success': return 'border-green-700 bg-green-950/20';
    case 'failure': return 'border-red-700 bg-red-950/20';
    case 'crit_failure': return 'border-red-600 bg-red-950/30';
    default: return 'border-gray-700 bg-gray-950/20';
  }
}

function outcomeLabel(outcome: string | null): string {
  switch (outcome) {
    case 'crit_success': return 'SUCCES CRITIQUE';
    case 'success': return 'SUCCES';
    case 'failure': return 'ECHEC';
    case 'crit_failure': return 'ECHEC CRITIQUE';
    default: return outcome ?? '—';
  }
}

// === DIFFICULTY SELECT ===

function DifficultySelect({ onSelect }: { readonly onSelect: (d: DifficultyLevel) => void }): JSX.Element {
  const options: { id: DifficultyLevel; label: string; desc: string; color: string }[] = [
    { id: 'explorer', label: 'EXPLORATEUR', desc: 'Seuil anti-blocage: 2 tentatives. Deuxieme chance si mort.', color: 'border-green-700 hover:border-green-500 text-green-400' },
    { id: 'survivor', label: 'SURVIVANT', desc: 'Seuil anti-blocage: 4 tentatives. Deuxieme chance si mort.', color: 'border-yellow-700 hover:border-yellow-500 text-yellow-400' },
    { id: 'nightmare', label: 'CAUCHEMAR', desc: 'Anti-blocage desactive. Mort permanente.', color: 'border-red-700 hover:border-red-500 text-red-400' },
  ];

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[var(--color-void-black)] px-4">
      <h1 className="mb-1 font-mono text-3xl font-bold tracking-widest text-white">VOID WALKER</h1>
      <p className="mb-2 font-mono text-xs text-purple-400 tracking-widest">DEBUG — PHASE 4</p>
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

// === SITUATION CARD ===

function SituationCard({ situation }: { readonly situation: Situation }): JSX.Element {
  const typeColors: Record<string, string> = {
    combat: 'border-red-700 text-red-400 bg-red-950/20',
    exploration: 'border-green-700 text-green-400 bg-green-950/20',
    environmental: 'border-yellow-700 text-yellow-400 bg-yellow-950/20',
    discovery: 'border-cyan-700 text-cyan-400 bg-cyan-950/20',
  };
  const style = typeColors[situation.type] ?? 'border-gray-700 text-gray-400 bg-gray-950/20';
  const [borderCol, textCol, bgCol] = style.split(' ');

  return (
    <div className={`rounded border ${borderCol} ${bgCol} p-3`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-xs font-bold ${textCol}`}>{situation.typeLabel}</span>
        <span className="font-mono text-xs text-gray-500">{situation.locationName}</span>
      </div>
      <p className="font-mono text-sm leading-relaxed text-gray-200">{situation.description}</p>
      {situation.scene.environmentConditions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {situation.scene.environmentConditions.map((cond) => (
            <span key={cond} className="rounded bg-gray-800 px-2 py-0.5 font-mono text-xs text-yellow-400">
              {cond === 'dark' ? 'OBSCURITE' : cond === 'zero_g' ? 'ZERO-G' : cond === 'time_pressure' ? 'URGENCE' : String(cond).toUpperCase()}
            </span>
          ))}
        </div>
      )}
      {situation.scene.suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {situation.scene.suggestions.map((s, i) => (
            <span key={i} className="rounded bg-purple-900/20 px-2 py-0.5 font-mono text-xs text-purple-400">
              {s.verb} {s.target?.nameKey ? ts(s.target.nameKey) : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// === STEP LABEL ===

const STEP_LABELS = [
  '① PARSE',
  '② CREATIVITE',
  '③ CONDITIONS',
  '④ OXYGENE',
  '⑤ RESOLUTION',
  '⑥ CONSEQUENCES',
  '⑦ RIPOSTE NPC',
  '⑧ HORLOGE FANTOME',
  '⑨ DIRECTEUR MENACE',
  '⑩ NARRATION',
];

// === TRACE PANEL ===

function TracePanel({ trace, input }: { readonly trace: TurnDebugTrace; readonly input: string }): JSX.Element {
  const bd = trace.difficultyBreakdown;

  return (
    <div className="rounded border border-gray-700 bg-[var(--color-void-dark)] p-3">
      <div className="mb-3 font-mono text-xs font-bold tracking-widest text-gray-400">
        RESOLUTION — 10 ETAPES
      </div>
      <div className="font-mono text-xs text-gray-600 mb-2">
        Saisie: <span className="text-gray-300">"{input}"</span>
      </div>

      <div className="flex flex-col gap-2">

        {/* Step 1: Parse */}
        <div className={`rounded p-2 ${trace.reformulated ? 'bg-yellow-950/30 border border-yellow-800' : 'bg-gray-900/50'}`}>
          <div className="font-bold text-gray-300">{STEP_LABELS[0]}</div>
          {trace.reformulated ? (
            <div className="text-yellow-400">Reformulation demandee — pas de de</div>
          ) : (
            <div className="text-gray-400">
              <span className="text-purple-400">{trace.parsedVerb ?? '—'}</span>
              {trace.parsedTargetName && <> sur <span className="text-white">{ts(trace.parsedTargetName)}</span></>}
              <span className="ml-2 text-gray-600">
                strategie:{trace.parseStrategy}
                {trace.parseCreative && <span className="ml-1 text-purple-400">[CREATIF]</span>}
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Creativity */}
        <div className="rounded bg-gray-900/50 p-2">
          <div className="font-bold text-gray-300">{STEP_LABELS[1]}</div>
          <div className={trace.creativityMod !== 0 ? 'text-purple-400' : 'text-gray-600'}>
            modificateur: {trace.creativityMod !== 0 ? sign(trace.creativityMod) : '0 (action suggeree)'}
          </div>
        </div>

        {/* Step 3: Conditions */}
        <div className={`rounded p-2 ${trace.conditionHpDrain > 0 ? 'bg-red-950/30 border border-red-900' : 'bg-gray-900/50'}`}>
          <div className="font-bold text-gray-300">{STEP_LABELS[2]}</div>
          {trace.conditionHpDrain > 0
            ? <div className="text-red-400">drainage: -{trace.conditionHpDrain} PV</div>
            : <div className="text-gray-600">aucun drainage</div>}
          {trace.conditionsExpired.length > 0 && (
            <div className="text-gray-500">expires: {trace.conditionsExpired.join(', ')}</div>
          )}
        </div>

        {/* Step 4: Oxygen */}
        <div className={`rounded p-2 ${trace.oxygenHpDrain > 0 ? 'bg-yellow-950/30 border border-yellow-900' : 'bg-gray-900/50'}`}>
          <div className="font-bold text-gray-300">{STEP_LABELS[3]}</div>
          <div className="text-gray-400">
            atm: <span className="text-cyan-400">{trace.atmosphere}</span>
            {' | '}O₂: {trace.o2Before}%
            {trace.o2Before !== trace.o2After && <> → <span className={trace.oxygenHpDrain > 0 ? 'text-red-400' : 'text-gray-400'}>{trace.o2After}%</span></>}
            {trace.oxygenHpDrain > 0 && <span className="ml-2 text-red-400">[-{trace.oxygenHpDrain} PV]</span>}
          </div>
        </div>

        {/* Step 5: Resolution — main block */}
        {!trace.isAutoVerb && trace.outcome ? (
          <div className={`rounded border p-3 ${outcomeBorderColor(trace.outcome)}`}>
            <div className={`font-bold text-base mb-2 ${outcomeColor(trace.outcome)}`}>
              {STEP_LABELS[4]} — {outcomeLabel(trace.outcome)}
            </div>
            {/* Dice formula */}
            <div className="text-cyan-400 mb-1">
              {trace.statId}({trace.effectiveStatValue})
              {' + D20 vs DC '}<span className="font-bold text-white">{trace.effectiveDC}</span>
            </div>
            {/* DC breakdown */}
            {bd && (
              <div className="text-gray-600 text-[11px] mb-1">
                DC: base({bd.base})
                {bd.verbMod !== 0 && <> verbe({sign(bd.verbMod)})</>}
                {bd.compatibilityPenalty !== 0 && <> compat(+{bd.compatibilityPenalty})</>}
                {bd.contextMods !== 0 && <> ctx({sign(bd.contextMods)})</>}
                {bd.creativityMod !== 0 && <> crea({sign(bd.creativityMod)})</>}
                {bd.difficultyPresetMod !== 0 && <> preset({sign(bd.difficultyPresetMod)})</>}
                {' = '}{bd.total}
              </div>
            )}
            {/* Modifiers */}
            {(trace.shipMemoryMod !== 0 || trace.failsafeActivated) && (
              <div className="text-gray-500 text-[11px]">
                {trace.shipMemoryMod !== 0 && <>Memoire navire: {sign(trace.shipMemoryMod)} </>}
                {trace.failsafeActivated && <span className="text-yellow-400">Anti-blocage: -{trace.failsafeDcReduction} DC</span>}
              </div>
            )}
          </div>
        ) : trace.isAutoVerb ? (
          <div className="rounded bg-green-950/20 border border-green-800 p-2">
            <div className="font-bold text-green-400">{STEP_LABELS[4]} — ACTION AUTOMATIQUE</div>
            <div className="text-gray-600">pas de jet de de requis</div>
          </div>
        ) : (
          <div className="rounded bg-gray-900/50 p-2">
            <div className="font-bold text-gray-300">{STEP_LABELS[4]}</div>
            <div className="text-gray-600">—</div>
          </div>
        )}

        {/* Step 6: Consequences */}
        <div className={`rounded p-2 ${trace.consequenceTypes.length > 0 ? 'bg-orange-950/20 border border-orange-900' : 'bg-gray-900/50'}`}>
          <div className="font-bold text-gray-300">{STEP_LABELS[5]}</div>
          {trace.consequenceDetails.length > 0
            ? trace.consequenceDetails.map((d, i) => (
                <div key={i} className="text-orange-400">→ {d}</div>
              ))
            : <div className="text-gray-600">aucune consequence</div>}
          {trace.triggeredConditions.length > 0 && (
            <div className="text-red-400">conditions declenchees: {trace.triggeredConditions.join(', ')}</div>
          )}
          {trace.deathResult && (
            <div className="text-red-500 font-bold">MORT: {trace.deathResult}</div>
          )}
        </div>

        {/* Step 7: NPC reaction */}
        <div className={`rounded p-2 ${trace.npcAttackHit ? 'bg-red-950/30 border border-red-900' : 'bg-gray-900/50'}`}>
          <div className="font-bold text-gray-300">{STEP_LABELS[6]}</div>
          {trace.npcReacted
            ? trace.npcAttackHit
              ? <div className="text-red-400">Attaque recue: -{trace.npcAttackDamage} PV</div>
              : <div className="text-gray-500">NPC a reagi — attaque ratee</div>
            : <div className="text-gray-600">pas de combat actif</div>}
        </div>

        {/* Step 8: Stalker clock */}
        {(() => {
          const CLOCK_MAX = 15;
          const after = trace.stalkerClockAfter;
          const warningThreshold = 10;
          const barColor = after >= warningThreshold ? 'text-red-400' : after >= 7 ? 'text-yellow-400' : 'text-green-400';
          return (
            <div className={`rounded p-2 ${trace.stalkerEventType ? 'bg-red-950/30 border border-red-900' : 'bg-gray-900/50'}`}>
              <div className="font-bold text-gray-300">{STEP_LABELS[7]}</div>
              <div className={`${barColor}`}>
                {trace.stalkerClockBefore} → {after} actions
                {' '}<span className="text-gray-600">{clockBar(after, CLOCK_MAX)} {after}/{CLOCK_MAX}</span>
              </div>
              {trace.stalkerEventType && (
                <div className="text-red-400 font-bold">EVENEMENT: {trace.stalkerEventType}</div>
              )}
            </div>
          );
        })()}

        {/* Step 9: Threat director (placeholder) */}
        <div className="rounded bg-gray-900/50 p-2">
          <div className="font-bold text-gray-300">{STEP_LABELS[8]}</div>
          <div className="text-gray-700">— (Phase 5)</div>
        </div>

        {/* Step 10: Narrative (placeholder) */}
        <div className="rounded bg-gray-900/50 p-2">
          <div className="font-bold text-gray-300">{STEP_LABELS[9]}</div>
          <div className="text-gray-700">— (Phase 5)</div>
        </div>
      </div>
    </div>
  );
}

// === STATE DELTA PANEL ===

function StateDeltaPanel({ gameState, trace }: { readonly gameState: GameState; readonly trace: TurnDebugTrace }): JSX.Element {
  const char = gameState.character;
  if (!char) return <></>;

  const CLOCK_MAX = 15;
  const clockVal = gameState.stalkerClockState.actionsSinceLastProgression;
  const clockBarColor = clockVal >= 10 ? 'text-red-400' : clockVal >= 7 ? 'text-yellow-400' : 'text-green-400';

  // HP color
  const hpPct = char.hp / char.maxHp;
  const hpColor = hpPct < 0.25 ? 'text-red-400' : hpPct < 0.5 ? 'text-yellow-400' : 'text-green-400';
  const hpDelta = trace.oxygenHpDrain + trace.conditionHpDrain + trace.npcAttackDamage;

  return (
    <div className="rounded border border-gray-700 bg-[var(--color-void-dark)] p-3">
      <div className="mb-2 font-mono text-xs font-bold tracking-widest text-gray-400">ETAT APRES CE TOUR</div>
      <div className="flex flex-col gap-2 font-mono text-xs">

        {/* HP */}
        <div>
          <span className="text-gray-500">PV: </span>
          <span className={hpColor}>{hpBar(char.hp, char.maxHp)} {char.hp}/{char.maxHp}</span>
          {hpDelta > 0 && <span className="text-red-400 ml-2">(-{hpDelta})</span>}
        </div>

        {/* O2 */}
        <div>
          <span className="text-gray-500">O₂: </span>
          <span className="text-cyan-400">{o2Bar(char.oxygen)} {char.oxygen}%</span>
        </div>

        {/* Conditions */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-gray-500">Conditions: </span>
          {char.conditions.length === 0
            ? <span className="text-gray-700">aucune</span>
            : char.conditions.map(c => (
                <span
                  key={c.id}
                  className={`rounded px-1.5 py-0.5 ${
                    trace.conditionsExpired.includes(c.id)
                      ? 'bg-gray-800 text-gray-600 line-through'
                      : trace.triggeredConditions.includes(c.id)
                        ? 'bg-red-900/40 text-red-400'
                        : 'bg-gray-800 text-yellow-400'
                  }`}
                >
                  {c.id}({c.remainingActions ?? '∞'})
                </span>
              ))}
        </div>

        {/* Inventory */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-gray-500">Inventaire: </span>
          {char.inventory.length === 0
            ? <span className="text-gray-700">vide</span>
            : char.inventory.map(itemId => {
                const def = ITEM_DEFINITIONS[itemId];
                const name = def ? ts(def.nameKey) : itemId;
                const equipped = itemId === char.equippedWeapon || itemId === char.equippedArmor;
                return (
                  <span
                    key={itemId}
                    className={`rounded px-1.5 py-0.5 ${equipped ? 'bg-purple-900/40 text-purple-300' : 'bg-gray-800 text-gray-500'}`}
                  >
                    {name}{equipped ? '*' : ''}
                  </span>
                );
              })}
        </div>

        {/* Ship Memory */}
        <div>
          <span className="text-gray-500">Memoire navire: </span>
          <span className={gameState.shipMemory.length > 0 ? 'text-blue-400' : 'text-gray-700'}>
            {gameState.shipMemory.length} marques
          </span>
          {gameState.shipMemory.length > 0 && (
            <span className="text-gray-600 ml-2">
              (derniere: {gameState.shipMemory[gameState.shipMemory.length - 1]?.verb ?? '—'})
            </span>
          )}
        </div>

        {/* Stalker clock */}
        <div>
          <span className="text-gray-500">Horloge fantome: </span>
          <span className={clockBarColor}>
            {clockBar(clockVal, CLOCK_MAX)} {clockVal}/{CLOCK_MAX}
          </span>
          {gameState.stalkerClockState.warningIssued && (
            <span className="ml-2 text-yellow-400">[ALERTE]</span>
          )}
        </div>

        {/* Turn */}
        <div>
          <span className="text-gray-500">Tour: </span>
          <span className="text-gray-300">{gameState.turn}</span>
        </div>
      </div>
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
          <div>Classe: {char.className} | Difficulte: {gameState.difficulty}</div>
          <div>Survie: {gameState.turn} tours</div>
          <div>Marques navire: {gameState.shipMemory.length}</div>
          <div>Horloge fantome: {gameState.stalkerClockState.actionsSinceLastProgression}</div>
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

export function Phase4Playtest(): JSX.Element {
  const {
    state, classList, selectDifficulty, selectClass, submitInput, nextSituation, submitFeedback,
  } = usePhase4Loop();

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

  // Restart — reload page to reset everything
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2 shrink-0">
        <span className="font-mono text-sm font-bold text-gray-400">VOID WALKER DEBUG</span>
        <span className="font-mono text-xs text-gray-600">
          {diffLabel[state.difficulty]}
        </span>
        {char && (
          <span className="font-mono text-xs text-gray-500">
            Tour {state.gameState.turn}
            {' | '}
            <span className={char.hp / char.maxHp < 0.3 ? 'text-red-400' : 'text-green-400'}>
              PV:{char.hp}/{char.maxHp}
            </span>
            {' | O₂:'}{char.oxygen}%
          </span>
        )}
      </div>

      {/* Scrollable content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto p-3"
      >
        <div className="mx-auto flex max-w-lg flex-col gap-3">

          {/* Situation card (always shown) */}
          {state.situation && <SituationCard situation={state.situation} />}

          {/* Error display */}
          {state.error && (
            <div className="rounded border border-red-800 bg-red-950/20 p-2 font-mono text-xs text-red-400">
              {state.error}
            </div>
          )}

          {/* === PLAYING PHASE === */}
          {state.loopPhase === 'playing' && (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Entrez une action en francais..."
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

          {/* === POST-TURN PHASE === */}
          {state.loopPhase === 'post_turn' && state.lastTrace && (
            <>
              {/* Trace panel */}
              <TracePanel trace={state.lastTrace} input={state.lastInput} />

              {/* State delta */}
              <StateDeltaPanel gameState={state.gameState} trace={state.lastTrace} />

              {/* Feedback */}
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
