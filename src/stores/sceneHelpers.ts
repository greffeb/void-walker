// ---------------------------------------------------------------------------
// src/stores/sceneHelpers.ts — NarratedScene → text, for the typewriter
// ---------------------------------------------------------------------------
// Kept out of the store so unit tests can import it without pulling in Zustand,
// Dexie/IndexedDB and the rest of the browser-only modules.
//
// The layout itself lives in @narration/sceneLines, shared with the renderer:
// the typewriter clips by character count, so text and JSX must agree exactly.
// ---------------------------------------------------------------------------

import type { NarratedScene } from '@narration/scene';
import type { SceneLayout } from '@narration/sceneLines';
import { buildSceneLines, sceneLinesToText } from '@narration/sceneLines';

/**
 * Flatten a NarratedScene to plain text for the typewriter.
 *
 * `layout` used to be a `showIntro` boolean, whose false branch meant "the room
 * but no intro" — a shape production never asked for and which no longer exists
 * now that a same-room turn prints only what changed.
 */
export function flattenSceneToText(scene: NarratedScene, layout: SceneLayout = 'full'): string {
  return sceneLinesToText(buildSceneLines(scene, layout));
}

/**
 * Post-action recap: only what changed, then the prompt.
 *
 * This used to reprint the room in full — features, items, NPCs, exits — after
 * every single action, so a turn spent examining one terminal ended with the
 * whole room listed again. Now a turn where nothing moved says nothing, and the
 * prompt carries it.
 */
export function flattenSceneReminder(scene: NarratedScene): string {
  return sceneLinesToText(buildSceneLines(scene, 'recap'));
}

/**
 * The text a turn ends with, assembled once.
 *
 * `submitAction` and `onDiceAnimationComplete` each had their own copy of this,
 * so every change to the shape of a turn had to be made twice.
 */
export function assembleTurnText(
  narrative: string,
  scene: NarratedScene | null,
  introMode: 'new_game' | 'enter' | 'revisit' | null,
): string {
  // A move prints the room it arrives in, after the line that got us there.
  if (introMode !== null) {
    if (!scene) return narrative;
    const full = flattenSceneToText(scene, 'full');
    return narrative ? `${narrative}\n${full}` : full;
  }
  const reminder = scene ? flattenSceneReminder(scene) : '';
  return reminder ? `${narrative}\n\n${reminder}` : narrative;
}
