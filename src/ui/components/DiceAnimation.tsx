// ---------------------------------------------------------------------------
// src/ui/components/DiceAnimation.tsx — 4-act cinematic dice roll sequence
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

/** Single modifier line (DC side or bonus side) */
function DcLine({ line, isNew }: { line: DifficultyLine; isNew: boolean }): JSX.Element {
  const label = resolveLabel(line);
  const sign = line.value > 0 ? '+' : '';
  const colorClass =
    line.category === 'penalty' ? 'dc-line--penalty'
    : line.category === 'bonus'  ? 'dc-line--bonus'
    : 'dc-line--base';

  return (
    <div className={`dc-line ${colorClass} ${isNew ? 'animate-impact-small' : ''}`}>
      <span className="dc-label">{label}</span>
      <span className="dc-value">{sign}{line.value}</span>
    </div>
  );
}

export function DiceAnimation({
  diceResult, difficultyBreakdown, canSkip, onComplete,
}: DiceAnimationProps): JSX.Element {
  const {
    phase, visibleDcLines, showDcTotal, displayedDieNumber,
    visibleRollLines, showResult, handleSkipTap,
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

  let resultKey: StringKey;
  let resultColorClass: string;
  let flashClass = '';

  if (isCrit) {
    resultKey = 'dice.result.critSuccess';
    resultColorClass = 'dice-result--crit';
    flashClass = 'animate-flash-crit';
  } else if (isFumble) {
    resultKey = 'dice.result.critFailure';
    resultColorClass = 'dice-result--fumble';
    flashClass = 'animate-flash-failure';
  } else if (isSuccess) {
    resultKey = 'dice.result.success';
    resultColorClass = 'dice-result--success';
    flashClass = 'animate-flash-success';
  } else {
    resultKey = 'dice.result.failure';
    resultColorClass = 'dice-result--failure';
    flashClass = 'animate-flash-failure';
  }

  const isRolling = phase === 'rolling' || phase === 'roll_lines' || phase === 'result';
  const showBonusLines = (phase === 'roll_lines' || phase === 'result') && !isCrit && !isFumble;

  return (
    <GlitchEffect active={isFumble && showResult} duration={500}>
      <div
        className={`dice-overlay ${showResult ? flashClass : ''}`}
        onClick={handleSkipTap}
        role="button"
        tabIndex={0}
        aria-label="Skip dice animation"
      >
        {/* === ACT 1+2: DC Section === */}
        <div className="dice-section dice-section--dc">
          {dcLines.slice(0, visibleDcLines).map((line, i) => (
            <DcLine key={i} line={line} isNew={i === visibleDcLines - 1} />
          ))}

          {showDcTotal && (
            <>
              <hr className="dc-separator" />
              <div className="dc-line dc-total animate-impact-large">
                <span>{t('dice.dc.toBeat')}</span>
                <span>{effectiveDC}</span>
              </div>
            </>
          )}
        </div>

        {/* === ACT 3: Die === */}
        {isRolling && (
          <div className="dice-section dice-section--roll">
            <div className="dc-reminder">DC: {effectiveDC}</div>
            <div className={`dice-number ${showResult ? resultColorClass : ''} ${isCrit && showResult ? 'animate-dice-pulse' : ''} ${isFumble && showResult ? 'animate-glitch-rgb' : ''}`}>
              🎲 {displayedDieNumber}
            </div>
          </div>
        )}

        {/* === ACT 4: Roll bonus lines === */}
        {showBonusLines && (
          <div className="dice-section dice-section--bonuses">
            {rollLines.slice(0, visibleRollLines).map((line, i) => (
              <DcLine key={i} line={line} isNew={i === visibleRollLines - 1} />
            ))}
            {visibleRollLines >= rollLines.length && (
              <>
                <hr className="dc-separator" />
                <div className="dc-line dc-total">
                  <span>{t('dice.roll.total')}</span>
                  <span>{displayTotal}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* === RESULT === */}
        {showResult && (
          <div className={`dice-result ${resultColorClass} ${isCrit ? 'animate-shake' : ''}`}>
            {t(resultKey)}
            {!isCrit && !isFumble && (
              <span className="dice-result-margin">
                ({isSuccess ? '+' : ''}{diceResult.total - effectiveDC})
              </span>
            )}
          </div>
        )}
      </div>
    </GlitchEffect>
  );
}
