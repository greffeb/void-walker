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
  feature: 'var(--amber-mid)',
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
  const sections: readonly (readonly SceneToken[])[] = [
    ...(showIntro ? [scene.intro] : []),
    scene.features,
    scene.items,
    scene.npcs,
    scene.exits,
  ].filter((s) => s.length > 0);

  return (
    <div style={{ marginBottom: '8px', lineHeight: 1.6 }}>
      {sections.map((tokens, i) => (
        <div key={i}>
          {tokens.map((tok, j) => <SceneTokenSpan key={j} token={tok} />)}
        </div>
      ))}
      {scene.obstacle && (
        <div style={{ color: 'var(--warning)', fontStyle: 'italic' }}>
          {scene.obstacle}
        </div>
      )}
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
  | { readonly kind: 'tokens'; readonly tokens: readonly SceneToken[] }
  | { readonly kind: 'obstacle'; readonly text: string }
  | { readonly kind: 'prompt'; readonly text: string };

function renderClippedScene(
  scene: NarratedScene,
  showIntro: boolean,
  maxChars: number,
): JSX.Element | null {
  if (maxChars <= 0) return null;

  const sections = [
    ...(showIntro ? [scene.intro] : []),
    scene.features,
    scene.items,
    scene.npcs,
    scene.exits,
  ].filter((s) => s.length > 0);

  const allLines: RenderLine[] = [
    ...sections.map(tokens => ({ kind: 'tokens' as const, tokens })),
    ...(scene.obstacle ? [{ kind: 'obstacle' as const, text: scene.obstacle }] : []),
    { kind: 'prompt' as const, text: scene.prompt },
  ];

  const elements: JSX.Element[] = [];
  let rem = maxChars;

  for (let i = 0; i < allLines.length; i++) {
    if (rem <= 0) break;
    const isLast = i === allLines.length - 1;
    const line = allLines[i]!;

    if (line.kind === 'tokens') {
      const lineLen = line.tokens.reduce((s, t) => s + t.value.length, 0);
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
    } else {
      const visible = line.text.slice(0, rem);
      rem -= visible.length;
      const style = line.kind === 'obstacle'
        ? { color: 'var(--warning)', fontStyle: 'italic' as const }
        : { color: 'var(--text-system)', fontStyle: 'italic' as const };
      elements.push(<div key={i} style={style}>{visible}</div>);
    }

    // Each line is separated by '\n' in flattenSceneToText; consume that char.
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
      {entry.diceRoll && !entry.trace.isAutoVerb && (
        <div style={{ fontSize: '10px', color: outcomeColor(entry.trace.outcome), marginBottom: '4px' }}>
          🎲 {entry.diceRoll.natural}+{entry.diceRoll.modifier} = {entry.diceRoll.total} vs DC {entry.diceRoll.difficulty}
          {' '}{outcomeLabel(entry.trace.outcome)}
        </div>
      )}

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
  // currentNarrative = narrative + "\n\n" + flattenSceneToText(sceneIntro)
  // The '\n\n' separator is 2 chars, so charsInScene = max(0, revealed - narrativeLen - 2).
  const sceneIntro = pendingEntry?.sceneIntro ?? null;
  const narrativeLen = sceneIntro !== null ? (pendingEntry?.narrative.length ?? 0) : 0;
  const charsRevealed = displayedText.length;
  const narrativeVisible = sceneIntro !== null
    ? displayedText.slice(0, narrativeLen)
    : displayedText;
  const charsInScene = sceneIntro !== null
    ? Math.max(0, charsRevealed - narrativeLen - 2)
    : 0;
  const showSceneIntro = pendingEntry !== null ? pendingEntry.introMode !== null : false;

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
