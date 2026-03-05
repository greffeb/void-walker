// ---------------------------------------------------------------------------
// src/ui/screens/EndScreen.tsx — Game Over / Victory screen
// ---------------------------------------------------------------------------
// Shows victory or defeat recap, stats summary, and navigation buttons.
// On death, shows a KO bug report button so players can report weird deaths.
// ---------------------------------------------------------------------------

import { useGameStore } from '@stores/gameStore';
import { BugReportButton } from '../components/BugReportButton';
import type { VictoryResult, DefeatCondition } from '@engine/scenario';

export function EndScreen(): JSX.Element {
  const gameState = useGameStore((s) => s.gameState);
  const turnHistory = useGameStore((s) => s.turnHistory);
  const restart = useGameStore((s) => s.restart);

  const isVictory = gameState.phase === 'victory';
  const character = gameState.character;
  const victoryResult = gameState.victoryResult;
  const defeatCondition = gameState.defeatCondition;

  const lastEntry = turnHistory.length > 0 ? turnHistory[turnHistory.length - 1]! : null;

  const accentColor = isVictory ? 'var(--success)' : 'var(--danger)';
  const title = isVictory ? 'MISSION ACCOMPLIE' : 'FIN DE TRANSMISSION';
  const icon = isVictory ? '◆' : '✕';

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: 'var(--bg-deep)',
        padding: '24px 16px',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '48px',
          color: accentColor,
          marginBottom: '12px',
          animation: isVictory ? 'pulse-amber 2s ease-in-out infinite' : undefined,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h1
        className="font-title"
        style={{
          fontSize: '24px',
          letterSpacing: '0.15em',
          color: accentColor,
          marginBottom: '8px',
        }}
      >
        {title}
      </h1>

      {/* Subtitle / cause */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--amber-dim)',
          marginBottom: '24px',
          maxWidth: '320px',
        }}
      >
        {isVictory
          ? victoryLabel(victoryResult)
          : defeatLabel(defeatCondition)}
      </p>

      {/* Stats summary */}
      {character && (
        <div
          style={{
            width: '100%',
            maxWidth: '320px',
            border: `1px solid ${accentColor}`,
            borderRadius: '4px',
            padding: '16px',
            marginBottom: '24px',
            background: 'var(--bg-panel)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: 'var(--amber-dim)',
              fontFamily: 'var(--font-title)',
              marginBottom: '12px',
              borderBottom: '1px solid var(--amber-dim)',
              paddingBottom: '4px',
            }}
          >
            RAPPORT DE MISSION
          </div>

          <StatRow label="Personnage" value={character.name} />
          <StatRow label="Classe" value={classLabel(character.className)} />
          <StatRow label="Tours survécus" value={String(gameState.turn)} />
          <StatRow label="HP final" value={`${character.hp}/${character.maxHp}`} />
          <StatRow label="O₂ final" value={`${character.oxygen}%`} />
          <StatRow label="Objets restants" value={String(character.inventory.length)} />
          <StatRow label="Actions jouées" value={String(turnHistory.length)} />
          {gameState.encounterCount > 0 && (
            <StatRow label="Rencontres" value={String(gameState.encounterCount)} />
          )}
          {gameState.itemsUsedCount > 0 && (
            <StatRow label="Objets utilisés" value={String(gameState.itemsUsedCount)} />
          )}
        </div>
      )}

      {/* KO bug report (death screen only) */}
      {!isVictory && lastEntry && (
        <div style={{ width: '100%', maxWidth: '320px', marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--amber-dim)',
              justifyContent: 'center',
            }}
          >
            <span>Mort suspecte ?</span>
            <BugReportButton entry={lastEntry} />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '280px' }}>
        <button
          type="button"
          className="btn-console"
          onClick={() => {
            restart();
          }}
          style={{
            padding: '12px 20px',
            fontSize: '13px',
            border: `1px solid ${accentColor}`,
            color: accentColor,
          }}
        >
          ▸ NOUVELLE PARTIE
        </button>
        <button
          type="button"
          className="btn-console"
          onClick={restart}
          style={{
            padding: '10px 20px',
            fontSize: '12px',
          }}
        >
          MENU PRINCIPAL
        </button>
      </div>

      {/* Version */}
      <div
        style={{
          marginTop: '32px',
          fontSize: '10px',
          color: 'var(--amber-dim)',
          fontFamily: 'var(--font-mono)',
          opacity: 0.5,
        }}
      >
        VOID WALKER — TRANSMISSION TERMINÉE
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 0',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
      }}
    >
      <span style={{ color: 'var(--amber-dim)' }}>{label}</span>
      <span style={{ color: 'var(--amber-glow)' }}>{value}</span>
    </div>
  );
}

function victoryLabel(result: VictoryResult | null): string {
  if (!result) return 'Vous avez survécu.';
  switch (result.type) {
    case 'primary': return 'Objectif principal accompli.';
    case 'alternative': return 'Victoire alternative — une voie inattendue.';
    case 'emergent_environmental_kill': return 'L\'environnement lui-même a eu raison de la menace.';
    case 'emergent_containment': return 'La menace a été confinée. Pour l\'instant.';
    case 'emergent_self_destruct': return 'Auto-destruction activée. Vous avez survécu. Pas le vaisseau.';
    default: return 'Mission accomplie.';
  }
}

function defeatLabel(cond: DefeatCondition | null): string {
  if (!cond) return 'Transmission perdue.';
  switch (cond.type) {
    case 'player_death': return 'Votre signal vital s\'est éteint.';
    case 'npc_death': return 'Un allié crucial n\'a pas survécu.';
    case 'time_expired': return 'L\'oxygène s\'est épuisé. Le silence revient.';
    case 'objective_destroyed': return 'L\'objectif a été détruit. Mission échouée.';
    default: return 'Fin de transmission.';
  }
}

function classLabel(c: string): string {
  switch (c) {
    case 'marine': return 'Marine';
    case 'engineer': return 'Ingénieur';
    case 'medic': return 'Médecin';
    default: return c;
  }
}
