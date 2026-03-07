// ---------------------------------------------------------------------------
// src/ui/components/NarrativePanel.tsx — Scrollable narrative with typewriter
// ---------------------------------------------------------------------------

import { useRef, useEffect } from 'react';
import { useTypewriter } from '../hooks/useTypewriter';
import type { TurnEntry } from '@stores/gameStore';
import type { NarratedScene, SceneToken } from '@narration/scene';
import { BugReportButton } from './BugReportButton';

// ---------------------------------------------------------------------------
// SCENE TOKEN RENDERER
// ---------------------------------------------------------------------------

const TOKEN_COLORS: Record<string, string> = {
  location: 'var(--amber-glow)',
  feature: 'var(--cyan)',
  item: 'var(--success)',
  npc: 'var(--warning)',
  exit: 'var(--text-secondary)',
  text: 'var(--text-narrative)',
};

function SceneTokenSpan({ token }: { readonly token: SceneToken }): JSX.Element {
  const color = TOKEN_COLORS[token.kind] ?? 'var(--text-narrative)';
  const bold = token.kind === 'location' || token.kind === 'npc';
  return (
    <span style={{ color, fontWeight: bold ? 600 : 400 }}>
      {token.value}
    </span>
  );
}

function NarratedSceneBlock({ scene, showIntro = true }: { readonly scene: NarratedScene; readonly showIntro?: boolean }): JSX.Element {
  return (
    <div style={{ marginBottom: '8px', lineHeight: 1.6 }}>
      {/* Scenario intro (new_game only) */}
      {showIntro && scene.scenarioIntro && (
        <div style={{ color: 'var(--text-narrative)', marginBottom: '8px' }}>
          {scene.scenarioIntro}
        </div>
      )}

      {/* Location name + rich description joined with em-dash */}
      {showIntro && scene.intro.length > 0 && (
        <div>
          {scene.intro.map((tok, j) => <SceneTokenSpan key={j} token={tok} />)}
          {scene.locationDescription && (
            <span style={{ color: 'var(--text-narrative)' }}>
              {' — '}{scene.locationDescription}
            </span>
          )}
        </div>
      )}

      {/* Obstacle */}
      {scene.obstacle && (
        <div style={{ color: 'var(--warning)', fontStyle: 'italic' }}>
          {scene.obstacle}
        </div>
      )}

      {/* Interactive elements */}
      {[scene.features, scene.items, scene.npcs, scene.exits]
        .filter(s => s.length > 0)
        .map((tokens, i) => (
          <div key={i}>
            {tokens.map((tok, j) => <SceneTokenSpan key={j} token={tok} />)}
          </div>
        ))}

      {/* Prompt */}
      <div style={{ color: 'var(--text-system)', fontStyle: 'italic' }}>
        {scene.prompt}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CLIPPED SCENE RENDERER — renders colored tokens up to maxChars characters,
// where maxChars maps 1:1 to the plain-text output of flattenSceneToText().
// ---------------------------------------------------------------------------

type RenderLine =
  | { readonly kind: 'scenario-intro'; readonly text: string }
  | { readonly kind: 'blank' }
  | { readonly kind: 'location-intro'; readonly tokens: readonly SceneToken[]; readonly locationDesc: string | null }
  | { readonly kind: 'tokens'; readonly tokens: readonly SceneToken[] }
  | { readonly kind: 'obstacle'; readonly text: string }
  | { readonly kind: 'prompt'; readonly text: string };

function lineTextLength(line: RenderLine): number {
  switch (line.kind) {
    case 'scenario-intro': return line.text.length;
    case 'blank':          return 0; // empty string in join
    case 'location-intro': {
      const base = line.tokens.map(t => t.value).join('').length;
      return line.locationDesc ? base + ' — '.length + line.locationDesc.length : base;
    }
    case 'tokens':   return line.tokens.reduce((s, t) => s + t.value.length, 0);
    case 'obstacle': return line.text.length;
    case 'prompt':   return line.text.length;
  }
}

function renderClippedScene(
  scene: NarratedScene,
  showIntro: boolean,
  maxChars: number,
): JSX.Element | null {
  if (maxChars <= 0) return null;

  // Build allLines in EXACTLY the same order as flattenSceneToText()
  const allLines: RenderLine[] = [];

  if (showIntro) {
    if (scene.scenarioIntro) {
      allLines.push({ kind: 'scenario-intro', text: scene.scenarioIntro });
      allLines.push({ kind: 'blank' });
    }
    if (scene.intro.length > 0) {
      allLines.push({ kind: 'location-intro', tokens: scene.intro, locationDesc: scene.locationDescription });
    }
  }

  if (scene.obstacle) {
    allLines.push({ kind: 'obstacle', text: scene.obstacle });
  }

  for (const s of [scene.features, scene.items, scene.npcs, scene.exits]) {
    if (s.length > 0) allLines.push({ kind: 'tokens', tokens: s });
  }

  allLines.push({ kind: 'prompt', text: scene.prompt });

  const elements: JSX.Element[] = [];
  let rem = maxChars;

  for (let i = 0; i < allLines.length; i++) {
    if (rem <= 0) break;
    const isLast = i === allLines.length - 1;
    const line = allLines[i]!;
    const lineLen = lineTextLength(line);

    if (line.kind === 'scenario-intro') {
      const visible = line.text.slice(0, rem);
      rem -= visible.length;
      elements.push(
        <div key={i} style={{ color: 'var(--text-narrative)', marginBottom: '8px' }}>{visible}</div>
      );
    } else if (line.kind === 'blank') {
      // blank separator between scenarioIntro and intro — consumes 0 chars (empty string in join)
      // but '\n' separator still consumed below
      elements.push(<div key={i}>&nbsp;</div>);
    } else if (line.kind === 'location-intro') {
      // Render intro tokens up to rem, then em-dash + locationDesc if budget remains
      const tokensText = line.tokens.map(t => t.value).join('');
      let lineRem = Math.min(rem, lineLen);
      rem -= lineRem;

      const tokElems: JSX.Element[] = [];
      let tokRem = Math.min(lineRem, tokensText.length);
      lineRem -= tokRem;

      for (let ti = 0; ti < line.tokens.length && tokRem > 0; ti++) {
        const tok = line.tokens[ti]!;
        const visible = tok.value.slice(0, tokRem);
        tokRem -= visible.length;
        tokElems.push(
          <span
            key={ti}
            style={{
              color: TOKEN_COLORS[tok.kind] ?? 'var(--text-narrative)',
              fontWeight: (tok.kind === 'location' || tok.kind === 'npc') ? 600 : 400,
            }}
          >
            {visible}
          </span>
        );
      }

      // Render em-dash + locationDesc if budget remains and desc exists
      let descElem: JSX.Element | null = null;
      if (line.locationDesc && lineRem > 0) {
        const sep = ' — ';
        const sepVisible = sep.slice(0, lineRem);
        lineRem -= sepVisible.length;
        const descVisible = line.locationDesc.slice(0, lineRem);
        descElem = (
          <span style={{ color: 'var(--text-narrative)' }}>
            {sepVisible}{descVisible}
          </span>
        );
      }

      elements.push(<div key={i}>{tokElems}{descElem}</div>);
    } else if (line.kind === 'tokens') {
      let lineRem = Math.min(rem, lineLen);
      rem -= lineRem;
      const tokElems: JSX.Element[] = [];
      for (let ti = 0; ti < line.tokens.length && lineRem > 0; ti++) {
        const tok = line.tokens[ti]!;
        const visible = tok.value.slice(0, lineRem);
        lineRem -= visible.length;
        tokElems.push(
          <span
            key={ti}
            style={{
              color: TOKEN_COLORS[tok.kind] ?? 'var(--text-narrative)',
              fontWeight: (tok.kind === 'location' || tok.kind === 'npc') ? 600 : 400,
            }}
          >
            {visible}
          </span>
        );
      }
      elements.push(<div key={i}>{tokElems}</div>);
    } else if (line.kind === 'obstacle') {
      const visible = line.text.slice(0, rem);
      rem -= visible.length;
      elements.push(
        <div key={i} style={{ color: 'var(--warning)', fontStyle: 'italic' }}>{visible}</div>
      );
    } else {
      // prompt
      const visible = line.text.slice(0, rem);
      rem -= visible.length;
      elements.push(
        <div key={i} style={{ color: 'var(--text-system)', fontStyle: 'italic' }}>{visible}</div>
      );
    }

    // Each line is separated by '\n' in flattenSceneToText (join('\n')); consume that char.
    if (!isLast && rem > 0) {
      rem -= 1;
    }
  }

  return <div style={{ lineHeight: 1.6 }}>{elements}</div>;
}

// ---------------------------------------------------------------------------
// OUTCOME DISPLAY
// ---------------------------------------------------------------------------

function outcomeColor(outcome: string | null): string {
  switch (outcome) {
    case 'crit_success': return 'var(--crit-gold)';
    case 'success': return 'var(--success)';
    case 'failure': return 'var(--danger)';
    case 'crit_failure': return 'var(--danger)';
    default: return 'var(--text-system)';
  }
}

function outcomeLabel(outcome: string | null): string {
  switch (outcome) {
    case 'crit_success': return 'CRITIQUE !';
    case 'success': return 'SUCCÈS';
    case 'failure': return 'ÉCHEC';
    case 'crit_failure': return 'FUMBLE !';
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// TURN CARD
// ---------------------------------------------------------------------------

function TurnCard({ entry }: { readonly entry: TurnEntry }): JSX.Element {
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Separator + KO button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ color: 'var(--text-system)', fontSize: '10px' }}>
          ── Tour {entry.id} ──────────
        </div>
        <BugReportButton entry={entry} />
      </div>

      {/* Player input */}
      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
        &gt; {entry.input}
      </div>

      {/* Dice result (compact) */}
      {entry.diceRoll && !entry.trace.isAutoVerb && (() => {
        const dr = entry.diceRoll;
        const bonusParts: string[] = [];
        if (dr.statValue !== 0) bonusParts.push(`${dr.stat}(${dr.statValue > 0 ? '+' : ''}${dr.statValue})`);
        if (dr.luckBonus !== 0) bonusParts.push(`LCK(${dr.luckBonus > 0 ? '+' : ''}${dr.luckBonus})`);
        if (dr.modifier !== 0) bonusParts.push(`${dr.modifier > 0 ? '+' : ''}${dr.modifier}`);
        const bonusStr = bonusParts.length > 0 ? ' ' + bonusParts.join(' ') : '';
        return (
          <div style={{ fontSize: '10px', color: outcomeColor(entry.trace.outcome), marginBottom: '4px' }}>
            🎲 D20({dr.natural}){bonusStr} = {dr.total} vs DC {dr.difficulty}
            {' '}{outcomeLabel(entry.trace.outcome)}
          </div>
        );
      })()}

      {/* Narrative text */}
      {entry.narrative && (
        <div className="animate-fade-in crt-text" style={{ color: 'var(--text-narrative)', fontSize: '15px', lineHeight: 1.6, textShadow: '0 0 4px rgba(224, 160, 48, 0.4)' }}>
          {entry.narrative}
        </div>
      )}

      {/* Scene state after turn */}
      {entry.sceneIntro && (
        <div className="animate-fade-in" style={{ fontSize: '15px' }}>
          <NarratedSceneBlock scene={entry.sceneIntro} showIntro={entry.introMode !== null} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PANEL
// ---------------------------------------------------------------------------

interface NarrativePanelProps {
  readonly turnHistory: readonly TurnEntry[];
  readonly currentNarrative: string;
  readonly welcomeNarrative: NarratedScene | null;
  readonly typewriterComplete: boolean;
  readonly pendingEntry: TurnEntry | null;
  readonly onSkip: () => void;
  readonly onTypewriterDone: () => void;
}

export function NarrativePanel({
  turnHistory,
  currentNarrative,
  welcomeNarrative,
  typewriterComplete,
  pendingEntry,
  onSkip,
  onTypewriterDone,
}: NarrativePanelProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  const isFirstTurn = turnHistory.length === 0 && currentNarrative === '';
  const textToType = isFirstTurn ? '' : currentNarrative;
  const { displayedText, isComplete, skip } = useTypewriter({
    text: textToType,
    enabled: !typewriterComplete && textToType.length > 0,
    onComplete: onTypewriterDone,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turnHistory.length, displayedText]);

  // If typewriter finished externally (skipped), sync local state
  useEffect(() => {
    if (typewriterComplete && !isComplete && textToType.length > 0) {
      skip();
    }
  }, [typewriterComplete, isComplete, skip, textToType]);

  const handleClick = (): void => {
    if (!isComplete) {
      skip();
      onSkip();
    }
  };

  // Compute which portion of the typewriter text belongs to narrative vs scene.
  //
  // For location change (introMode !== null):
  //   currentNarrative = flattenSceneToText(sceneIntro, true)  — scene only, no narrative prefix
  //   → all displayedText goes to renderClippedScene, narrativeVisible = ''
  //
  // For same location (introMode === null):
  //   currentNarrative = narrative + "\n\n" + flattenSceneReminder(sceneIntro)
  //   → narrativeVisible = first narrativeLen chars; charsInScene = revealed - narrativeLen - 2
  //   → renderClippedScene with showIntro=false (reminder has no intro)
  const sceneIntro = pendingEntry?.sceneIntro ?? null;
  const pendingIntroMode = pendingEntry?.introMode ?? null;
  const charsRevealed = displayedText.length;

  let narrativeVisible: string;
  let charsInScene: number;
  let showSceneIntro: boolean;

  if (pendingIntroMode !== null) {
    // Location change: full scene typewriter, no plain narrative prefix
    narrativeVisible = '';
    charsInScene = charsRevealed;
    showSceneIntro = true;
  } else if (sceneIntro !== null) {
    // Same location: narrative prefix + "\n\n" + reminder
    const narrativeLen = pendingEntry?.narrative.length ?? 0;
    narrativeVisible = displayedText.slice(0, narrativeLen);
    charsInScene = Math.max(0, charsRevealed - narrativeLen - 2);
    showSceneIntro = false;
  } else {
    narrativeVisible = displayedText;
    charsInScene = 0;
    showSceneIntro = false;
  }

  return (
    <div
      ref={scrollRef}
      onClick={handleClick}
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        fontFamily: 'var(--font-mono)',
        fontSize: '15px',
        lineHeight: 1.6,
        cursor: isComplete ? 'default' : 'pointer',
      }}
    >
      {/* Welcome narrative (first scene) */}
      {welcomeNarrative && turnHistory.length === 0 && (
        <NarratedSceneBlock scene={welcomeNarrative} />
      )}

      {/* History */}
      {turnHistory.map(entry => (
        <TurnCard key={entry.id} entry={entry} />
      ))}

      {/* Typewriter: narrative (plain amber) + scene (colored tokens), both at 15px */}
      {!isFirstTurn && displayedText && (
        <div style={{ fontSize: '15px', lineHeight: 1.6 }}>
          {narrativeVisible && (
            <div style={{ color: 'var(--text-narrative)', whiteSpace: 'pre-line' }}>
              {narrativeVisible}
            </div>
          )}
          {sceneIntro !== null && renderClippedScene(sceneIntro, showSceneIntro, charsInScene)}
          {!isComplete && (
            <span className="animate-cursor-blink" style={{ color: 'var(--amber-glow)' }}>█</span>
          )}
        </div>
      )}
    </div>
  );
}
