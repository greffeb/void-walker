// ---------------------------------------------------------------------------
// src/narration/sceneLines.ts — The one layout of a narrated scene
// ---------------------------------------------------------------------------
// A scene was laid out in three places that had to agree character for
// character: the plain-text flattener feeding the typewriter, the clipped
// renderer that colours tokens up to N characters, and the committed-history
// block. The typewriter clips by character count, so any disagreement shifted
// the cursor or truncated mid-token — and the comment "keep in sync with
// flattenSceneToText" was the only thing holding it together.
//
// There is now one ordered line list. Everything else renders it.
// ---------------------------------------------------------------------------

import type { NarratedScene, SceneToken } from './scene';

/** How much of a scene to lay out. */
export type SceneLayout =
  /** Arriving somewhere: intro, description, the full room. */
  | 'full'
  /** Staying put: only what changed, then the prompt. */
  | 'recap';

export type SceneLine =
  | { readonly kind: 'scenario-intro'; readonly text: string }
  | { readonly kind: 'blank' }
  | { readonly kind: 'location-intro'; readonly tokens: readonly SceneToken[]; readonly locationDesc: string | null }
  | { readonly kind: 'tokens'; readonly tokens: readonly SceneToken[] }
  | { readonly kind: 'obstacle'; readonly text: string }
  | { readonly kind: 'prompt'; readonly text: string };

/** Separator between a location's name and its description. */
export const LOCATION_DESC_SEPARATOR = ' — ';

/** The lines of a scene, in reading order. */
export function buildSceneLines(scene: NarratedScene, layout: SceneLayout): readonly SceneLine[] {
  const lines: SceneLine[] = [];

  if (layout === 'full') {
    if (scene.scenarioIntro) {
      lines.push({ kind: 'scenario-intro', text: scene.scenarioIntro });
      lines.push({ kind: 'blank' });
    }
    if (scene.intro.length > 0) {
      lines.push({ kind: 'location-intro', tokens: scene.intro, locationDesc: scene.locationDescription });
    }
    if (scene.obstacle) lines.push({ kind: 'obstacle', text: scene.obstacle });
    for (const tokens of [scene.features, scene.items, scene.npcs, scene.exits]) {
      if (tokens.length > 0) lines.push({ kind: 'tokens', tokens });
    }
  } else if (scene.recap.length > 0) {
    lines.push({ kind: 'tokens', tokens: scene.recap });
  }

  lines.push({ kind: 'prompt', text: scene.prompt });
  return lines;
}

/** The plain text of one line — the unit the typewriter counts. */
export function sceneLineText(line: SceneLine): string {
  switch (line.kind) {
    case 'scenario-intro': return line.text;
    case 'blank':          return '';
    case 'location-intro': {
      const base = line.tokens.map(t => t.value).join('');
      return line.locationDesc ? base + LOCATION_DESC_SEPARATOR + line.locationDesc : base;
    }
    case 'tokens':   return line.tokens.map(t => t.value).join('');
    case 'obstacle': return line.text;
    case 'prompt':   return line.text;
  }
}

/** The whole scene as plain text, newline-separated. */
export function sceneLinesToText(lines: readonly SceneLine[]): string {
  return lines.map(sceneLineText).join('\n');
}
