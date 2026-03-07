// ---------------------------------------------------------------------------
// src/ui/components/DiceAnimation.tsx — 4-act cinematic dice roll sequence
// ---------------------------------------------------------------------------
// Terminal-style dice overlay matching the CRT mockup aesthetic:
//   Orange border + bright corner brackets, big glowing center number,
//   scanlines, progress bar, DC & bonus modifier lines.
// ---------------------------------------------------------------------------

import { useDiceAnimation } from '../hooks/useDiceAnimation';
import { GlitchEffect } from './GlitchEffect';
import { t } from '@i18n/index';
import type { DiceResult, DifficultyBreakdown, DifficultyLine } from '@engine/types';
import type { StringKey } from '@i18n/types';

interface DiceAnimationProps {
  readonly diceResult: DiceResult;
  readonly difficultyBreakdown: DifficultyBreakdown;
  readonly canSkip: boolean;
  readonly onComplete: () => void;
}

/** Resolve a DifficultyLine label with optional param interpolation */
function resolveLabel(line: DifficultyLine): string {
  const raw = t(line.labelKey);
  if (!line.labelParams) return raw;
  return Object.entries(line.labelParams).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, v),
    raw,
  );
}

/** Format a signed value for display (uses minus sign − for negatives) */
function formatValue(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return String(value);
}

/** Single modifier line (DC side or bonus side) */
function ModifierLine({ line, visible }: {
  readonly line: DifficultyLine;
  readonly visible: boolean;
}): JSX.Element {
  const label = resolveLabel(line);
  const colorClass =
    line.category === 'penalty' ? 'dice-mod--penalty'
    : line.category === 'bonus'  ? 'dice-mod--bonus'
    : 'dice-mod--base';

  return (
    <div className={`dice-mod ${colorClass} ${visible ? 'dice-mod--visible' : ''}`}>
      <span className="dice-mod__label">{label}</span>
      <span className="dice-mod__value">{line.category === 'base' ? String(line.value) : formatValue(line.value)}</span>
    </div>
  );
}

export function DiceAnimation({
  diceResult, difficultyBreakdown, canSkip, onComplete,
}: DiceAnimationProps): JSX.Element {
  const {
    phase, visibleDcLines, showDcTotal, displayedDieNumber,
    rollProgress, visibleRollLines, showResult, handleSkipTap,
  } = useDiceAnimation({ diceResult, difficultyBreakdown, canSkip, onComplete });

  // DC lines (filter zero-value lines)
  const dcLines = difficultyBreakdown.namedLines.filter(l => l.value !== 0);

  // Roll bonus lines: stat + luck
  const rollLines: DifficultyLine[] = [
    {
      labelKey: `stat.${diceResult.stat}` as StringKey,
      value: diceResult.statValue,
      category: 'bonus',
    },
  ];
  if (diceResult.luckBonus > 0) {
    rollLines.push({
      labelKey: 'dice.roll.luck',
      value: diceResult.luckBonus,
      category: 'bonus',
    });
  }

  const effectiveDC = diceResult.difficulty;
  const displayTotal = diceResult.total > 20 ? '≥ 20' : String(diceResult.total);

  const isCrit = diceResult.critical;
  const isFumble = diceResult.fumble;
  const isSuccess = diceResult.success;

  // Result classification
  let resultKey: StringKey;
  let verdictClass: string;

  if (isCrit) {
    resultKey = 'dice.result.critSuccess';
    verdictClass = 'dice-verdict--crit';
  } else if (isFumble) {
    resultKey = 'dice.result.critFailure';
    verdictClass = 'dice-verdict--fumble';
  } else if (isSuccess) {
    resultKey = 'dice.result.success';
    verdictClass = 'dice-verdict--success';
  } else {
    resultKey = 'dice.result.failure';
    verdictClass = 'dice-verdict--fail';
  }

  // Die number color class
  const dieColorClass =
    isCrit && showResult  ? 'dice-die--crit'
    : isFumble && showResult ? 'dice-die--fumble'
    : '';

  const isRolling = phase === 'rolling' || phase === 'roll_lines' || phase === 'result';
  const showBonusLines = (phase === 'roll_lines' || phase === 'result') && !isCrit && !isFumble;

  // Status text
  let statusText = '';
  let statusClass = '';
  if (phase === 'rolling') {
    statusText = t('dice.status.rolling');
    statusClass = 'dice-status--rolling';
  } else if (showResult && isCrit) {
    statusText = 'Nat 20 !';
    statusClass = 'dice-status--crit';
  } else if (showResult && isFumble) {
    statusText = 'Nat 1...';
    statusClass = 'dice-status--fumble';
  } else if (showResult && isSuccess) {
    statusText = `${diceResult.total} ≥ ${effectiveDC}`;
    statusClass = 'dice-status--success';
  } else if (showResult) {
    statusText = `${diceResult.total} < ${effectiveDC}`;
    statusClass = 'dice-status--fail';
  }

  return (
    <GlitchEffect active={isFumble && showResult} duration={500}>
      <div
        className="dice-overlay"
        onClick={handleSkipTap}
        role="button"
        tabIndex={0}
        aria-label="Skip dice animation"
      >
        {/* CRT vignette inside the overlay */}
        <div className="dice-overlay__vignette" />

        {/* Terminal box */}
        <div className="dice-terminal">
          {/* Corner brackets */}
          <div className="dice-terminal__corner dice-terminal__corner--tl" />
          <div className="dice-terminal__corner dice-terminal__corner--tr" />
          <div className="dice-terminal__corner dice-terminal__corner--bl" />
          <div className="dice-terminal__corner dice-terminal__corner--br" />

          {/* === ACT 1+2: DC Section (top) === */}
          <div className="dice-section dice-section--dc">
            {dcLines.map((line, i) => (
              <ModifierLine key={i} line={line} visible={i < visibleDcLines} />
            ))}

            {showDcTotal && (
              <>
                <hr className="dice-sep dice-sep--visible" />
                <div className="dice-total dice-total--dc dice-total--visible">
                  <span className="dice-total__label">{t('dice.dc.toBeat')}</span>
                  <span className="dice-total__value">{effectiveDC}</span>
                </div>
              </>
            )}
          </div>

          {/* === ACT 3: Die roll (center) === */}
          {isRolling && (
            <div className="dice-section dice-section--roll">
              <div className={`dice-dc-reminder ${showDcTotal ? 'dice-dc-reminder--visible' : ''}`}>
                DC: {effectiveDC}
              </div>
              <div className="dice-die-wrap">
                <div className={`dice-die ${phase === 'rolling' ? 'dice-die--rolling' : ''} ${dieColorClass} ${isCrit && showResult ? 'dice-die--pulse' : ''}`}>
                  {displayedDieNumber}
                </div>
                {isCrit && showResult && (
                  <div className="dice-die-glitch dice-die-glitch--active">
                    {displayedDieNumber}
                  </div>
                )}
              </div>

              {/* Progress bar (visible during roll) */}
              <div className={`dice-bar ${phase === 'rolling' ? 'dice-bar--visible' : ''}`}>
                <div className="dice-bar__fill" style={{ width: `${rollProgress * 100}%` }} />
              </div>
              <div className={`dice-status ${statusClass} ${isRolling ? 'dice-status--visible' : ''}`}>
                <span className="dice-status__msg">{statusText}</span>
                {showResult && <span className="dice-status__info">×20</span>}
              </div>
            </div>
          )}

          {/* === ACT 4: Roll bonus lines (bottom) === */}
          {showBonusLines && (
            <div className="dice-section dice-section--bonuses">
              {rollLines.map((line, i) => (
                <ModifierLine key={i} line={line} visible={i < visibleRollLines} />
              ))}
              {visibleRollLines >= rollLines.length && (
                <>
                  <hr className="dice-sep dice-sep--visible" />
                  <div className="dice-total dice-total--bonus dice-total--visible">
                    <span className="dice-total__label">{t('dice.roll.total')}</span>
                    <span className="dice-total__value">{displayTotal}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* === RESULT verdict === */}
          {showResult && (
            <div className={`dice-verdict ${verdictClass} ${isCrit ? 'dice-verdict--shake' : ''}`}>
              {t(resultKey)}
              {!isCrit && !isFumble && (
                <span className="dice-verdict__margin">
                  ({isSuccess ? '+' : ''}{diceResult.total - effectiveDC})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </GlitchEffect>
  );
}
