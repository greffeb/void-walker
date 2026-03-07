// ---------------------------------------------------------------------------
// src/stores/sceneHelpers.ts — Pure helper functions for NarratedScene → text
// ---------------------------------------------------------------------------
// Extracted here so unit tests can import without pulling in the full store
// (which depends on Zustand, Dexie/IndexedDB, and other browser-only modules).
// ---------------------------------------------------------------------------

import type { NarratedScene } from '@narration/scene';

/**
 * Flatten a NarratedScene to a plain text string for the typewriter.
 *
 * Order matches NarrativePanel's NarratedSceneBlock and renderClippedScene:
 *   scenarioIntro (+ blank line)
 *   intro (+ " — " + locationDescription if present)
 *   obstacle
 *   features / items / npcs / exits
 *   prompt
 */
export function flattenSceneToText(scene: NarratedScene, showIntro: boolean): string {
  const lines: string[] = [];

  if (showIntro) {
    // Scenario intro (new_game only)
    if (scene.scenarioIntro) {
      lines.push(scene.scenarioIntro);
      lines.push(''); // blank separator line
    }
    // Location name + optional rich description
    if (scene.intro.length > 0) {
      const introText = scene.intro.map(tok => tok.value).join('');
      lines.push(scene.locationDescription ? `${introText} — ${scene.locationDescription}` : introText);
    }
  }

  // Obstacle
  if (scene.obstacle) lines.push(scene.obstacle);

  // Interactive elements
  for (const tokens of [scene.features, scene.items, scene.npcs, scene.exits]) {
    if (tokens.length > 0) lines.push(tokens.map(tok => tok.value).join(''));
  }

  lines.push(scene.prompt);
  return lines.join('\n');
}

/** Post-action reminder: only interactive elements + prompt (no intro, no description). */
export function flattenSceneReminder(scene: NarratedScene): string {
  const lines: string[] = [];
  for (const tokens of [scene.features, scene.items, scene.npcs, scene.exits]) {
    if (tokens.length > 0) lines.push(tokens.map(tok => tok.value).join(''));
  }
  lines.push(scene.prompt);
  return lines.join('\n');
}
