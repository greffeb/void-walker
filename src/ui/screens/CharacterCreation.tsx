// ---------------------------------------------------------------------------
// src/ui/screens/CharacterCreation.tsx — 4-step creation flow
// ---------------------------------------------------------------------------

import { useCreation } from '../hooks/useGame';
import { CLASSES, CLASS_LIST } from '@content/classes';
import { BALANCE } from '@engine/constants';
import { statBar, ts } from '../utils/formatters';
import type { DifficultyLevel, StatId } from '@engine/types';

// ---------------------------------------------------------------------------
// SHARED LAYOUT
// ---------------------------------------------------------------------------

function CreationLayout({
  title,
  children,
  onBack,
  onNext,
  nextLabel = 'SUIVANT ▸',
  nextDisabled = false,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly onBack?: () => void;
  readonly onNext?: () => void;
  readonly nextLabel?: string;
  readonly nextDisabled?: boolean;
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        padding: '16px',
        background: 'var(--bg-deep)',
        overflow: 'auto',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-title)',
          fontSize: '14px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--amber-glow)',
          marginBottom: '24px',
          textAlign: 'center',
        }}
      >
        {title}
      </h2>

      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>

      <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
        {onBack && (
          <button
            type="button"
            className="btn-console"
            onClick={onBack}
            style={{ flex: 1, padding: '12px' }}
          >
            ◂ RETOUR
          </button>
        )}
        {onNext && (
          <button
            type="button"
            className="btn-console"
            onClick={onNext}
            disabled={nextDisabled}
            style={{
              flex: 1,
              padding: '12px',
              borderColor: nextDisabled ? undefined : 'var(--amber-glow)',
            }}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 1: DIFFICULTY
// ---------------------------------------------------------------------------

const DIFFICULTIES: readonly {
  id: DifficultyLevel;
  label: string;
  desc: string;
  detail: string;
}[] = [
  {
    id: 'explorer',
    label: 'EXPLORATEUR',
    desc: 'Mode détente.',
    detail: 'HP bonus, pas de permadeath.',
  },
  {
    id: 'survivor',
    label: 'SURVIVANT',
    desc: "L'expérience prévue.",
    detail: 'Permadeath activé.',
  },
  {
    id: 'nightmare',
    label: 'CAUCHEMAR',
    desc: 'Pas de filet de sécurité.',
    detail: 'Bonne chance.',
  },
];

function DifficultyStep(): JSX.Element {
  const { difficulty, setDifficulty, advance } = useCreation();

  return (
    <CreationLayout
      title="SÉLECTIONNEZ LA DIFFICULTÉ"
      onNext={() => { if (difficulty) advance(); }}
      nextDisabled={!difficulty}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
        {DIFFICULTIES.map(d => {
          const selected = difficulty === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              style={{
                textAlign: 'left',
                padding: '16px',
                background: selected ? 'var(--amber-bg)' : 'var(--bg-panel)',
                border: `1px solid ${selected ? 'var(--amber-glow)' : 'var(--amber-dim)'}`,
                borderRadius: 'var(--radius)',
                color: 'var(--amber-glow)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                transition: 'border-color 150ms',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                {selected ? '▸ ' : '  '}{d.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--amber-mid)' }}>{d.desc}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{d.detail}</div>
            </button>
          );
        })}
      </div>
    </CreationLayout>
  );
}

// ---------------------------------------------------------------------------
// STEP 2: CLASS SELECT
// ---------------------------------------------------------------------------

/** Stats to display: exclude LCK from the creation view */
const DISPLAY_STATS: readonly StatId[] = ['FOR', 'DEF', 'AGI', 'INT', 'PER', 'CHA'];

function ClassStep(): JSX.Element {
  const { selectedClass, selectClass, advance, back } = useCreation();

  return (
    <CreationLayout
      title="CHOISISSEZ VOTRE RÔLE"
      onBack={back}
      onNext={() => { if (selectedClass) advance(); }}
      nextDisabled={!selectedClass}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
        {CLASS_LIST.map(cls => {
          const selected = selectedClass === cls.id;
          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => selectClass(cls.id)}
              style={{
                textAlign: 'left',
                padding: '14px',
                background: selected ? 'var(--amber-bg)' : 'var(--bg-panel)',
                border: `1px solid ${selected ? 'var(--amber-glow)' : 'var(--amber-dim)'}`,
                borderRadius: 'var(--radius)',
                color: 'var(--amber-glow)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                transition: 'border-color 150ms',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                {ts(cls.nameKey).toUpperCase()}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {ts(cls.descriptionKey)}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', lineHeight: 1.8 }}>
                {DISPLAY_STATS.map(stat => (
                  <div key={stat} style={{ color: 'var(--amber-mid)' }}>
                    {stat} {statBar(cls.baseStats[stat])}
                  </div>
                ))}
                <div style={{ color: 'var(--success)', marginTop: '4px' }}>
                  HP: {cls.startingHp}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </CreationLayout>
  );
}

// ---------------------------------------------------------------------------
// STEP 3: BONUS POINTS
// ---------------------------------------------------------------------------

function BonusStep(): JSX.Element {
  const { selectedClass, bonusPoints, setBonusPoint, advance, back } = useCreation();
  if (!selectedClass) return <div />;

  const classDef = CLASSES[selectedClass];
  const totalUsed = Object.values(bonusPoints).reduce<number>((a, b) => a + (b ?? 0), 0);
  const remaining = BALANCE.BONUS_POINTS - totalUsed;

  return (
    <CreationLayout
      title={`POINTS BONUS : ${remaining} restant${remaining !== 1 ? 's' : ''}`}
      onBack={back}
      onNext={advance}
      nextDisabled={remaining !== 0}
    >
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {DISPLAY_STATS.map(stat => {
          const base = classDef.baseStats[stat];
          const bonus = bonusPoints[stat] ?? 0;
          const total = base + bonus;
          const canAdd = remaining > 0 && total < BALANCE.STAT_MAX;
          const canSub = bonus > 0;

          return (
            <div
              key={stat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
              }}
            >
              <span style={{ width: '36px', color: 'var(--amber-glow)' }}>{stat}</span>
              <span style={{ flex: 1, color: 'var(--amber-mid)', fontSize: '11px' }}>
                {statBar(total)}
              </span>
              <button
                type="button"
                className="btn-console"
                onClick={() => setBonusPoint(stat, -1)}
                disabled={!canSub}
                style={{ padding: '6px 10px', fontSize: '12px', minWidth: '32px' }}
              >
                −
              </button>
              <button
                type="button"
                className="btn-console"
                onClick={() => setBonusPoint(stat, 1)}
                disabled={!canAdd}
                style={{ padding: '6px 10px', fontSize: '12px', minWidth: '32px' }}
              >
                +
              </button>
            </div>
          );
        })}

        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '16px', textAlign: 'center' }}>
          Max par stat : {BALANCE.STAT_MAX}
        </p>
      </div>
    </CreationLayout>
  );
}

// ---------------------------------------------------------------------------
// STEP 4: NAME
// ---------------------------------------------------------------------------

const RANDOM_NAMES: readonly string[] = [
  'Alix', 'Bastien', 'Camille', 'Darius', 'Elara', 'Farid',
  'Gaël', 'Héloïse', 'Idriss', 'Jade', 'Kael', 'Léonie',
  'Marceau', 'Noé', 'Oriane', 'Pavel', 'Quinn', 'Raphaël',
  'Solène', 'Théo', 'Ulysse', 'Véga', 'Wren', 'Xéna',
];

function NameStep(): JSX.Element {
  const { playerName, setPlayerName, startNewGame, back } = useCreation();

  const randomize = (): void => {
    const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] ?? 'Joueur';
    setPlayerName(name);
  };

  return (
    <CreationLayout
      title="IDENTIFICATION"
      onBack={back}
      onNext={startNewGame}
      nextLabel="LANCER ▸"
    >
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px',
          }}
        >
          NOM
        </label>

        <input
          type="text"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          maxLength={24}
          style={{
            width: '100%',
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '16px',
            color: 'var(--amber-glow)',
            background: 'var(--bg-input)',
            border: '1px solid var(--amber-dim)',
            borderRadius: 'var(--radius)',
            outline: 'none',
            textAlign: 'center',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--amber-glow)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--amber-dim)'; }}
        />

        <button
          type="button"
          className="btn-console"
          onClick={randomize}
          style={{ marginTop: '16px', padding: '10px 20px', fontSize: '11px' }}
        >
          NOM ALÉATOIRE ⟳
        </button>
      </div>
    </CreationLayout>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------

export function CharacterCreation(): JSX.Element {
  const { step } = useCreation();

  switch (step) {
    case 'difficulty': return <DifficultyStep />;
    case 'class':      return <ClassStep />;
    case 'bonus':      return <BonusStep />;
    case 'name':       return <NameStep />;
  }
}
