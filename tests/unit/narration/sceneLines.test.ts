// ---------------------------------------------------------------------------
// tests/unit/narration/sceneLines.test.ts — One layout, three renderers
// ---------------------------------------------------------------------------
// The typewriter clips a scene by character count, so the plain text it counts
// and the JSX it draws must agree exactly. That agreement used to rest on a
// comment ("keep in sync with flattenSceneToText") across three files.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { buildSceneLines, sceneLineText, sceneLinesToText, LOCATION_DESC_SEPARATOR } from '../../../src/narration/sceneLines';
import { flattenSceneToText, flattenSceneReminder } from '../../../src/stores/sceneHelpers';
import type { NarratedScene } from '../../../src/narration/scene';

const scene: NarratedScene = {
  scenarioIntro: 'La station est silencieuse depuis 72 heures.',
  intro: [{ kind: 'location', value: 'Centre de coordination' }],
  locationDescription: 'Les ventilateurs des consoles tournent encore.',
  obstacle: 'Une cloison blindée barre le couloir.',
  features: [
    { kind: 'text', value: 'Vous voyez autour de vous ' },
    { kind: 'feature', value: 'un terminal' },
    { kind: 'text', value: '.' },
  ],
  items: [{ kind: 'text', value: 'Parmi les débris, vous remarquez un couteau.' }],
  npcs: [{ kind: 'npc', value: 'Kira' }],
  exits: [{ kind: 'exit', value: "l'atrium technique", visited: false }],
  recap: [{ kind: 'text', value: 'Désormais : ' }, { kind: 'feature', value: 'le terminal' }],
  prompt: 'Que faites-vous ?',
};

describe('buildSceneLines', () => {
  it("'full' lays out intro, description, obstacle, room, prompt — in that order", () => {
    const kinds = buildSceneLines(scene, 'full').map(l => l.kind);
    expect(kinds).toEqual([
      'scenario-intro', 'blank', 'location-intro', 'obstacle',
      'tokens', 'tokens', 'tokens', 'tokens', 'prompt',
    ]);
  });

  it("'recap' lays out only the recap and the prompt", () => {
    expect(buildSceneLines(scene, 'recap').map(l => l.kind)).toEqual(['tokens', 'prompt']);
  });

  it("'recap' with nothing changed is the prompt alone", () => {
    expect(buildSceneLines({ ...scene, recap: [] }, 'recap').map(l => l.kind)).toEqual(['prompt']);
  });

  it('joins a location name to its description with the shared separator', () => {
    const line = buildSceneLines(scene, 'full').find(l => l.kind === 'location-intro')!;
    expect(sceneLineText(line)).toBe(
      `Centre de coordination${LOCATION_DESC_SEPARATOR}Les ventilateurs des consoles tournent encore.`,
    );
  });
});

describe('the plain text and the line list agree, character for character', () => {
  // This is what the typewriter's clipping depends on.
  for (const layout of ['full', 'recap'] as const) {
    it(`layout '${layout}': total length is the sum of line lengths plus newlines`, () => {
      const lines = buildSceneLines(scene, layout);
      const text = sceneLinesToText(lines);
      const sum = lines.reduce((n, l) => n + sceneLineText(l).length, 0);
      expect(text.length).toBe(sum + (lines.length - 1));
    });

    it(`layout '${layout}': every line appears verbatim in the flattened text`, () => {
      const lines = buildSceneLines(scene, layout);
      const text = sceneLinesToText(lines);
      for (const line of lines) {
        const value = sceneLineText(line);
        if (value.length > 0) expect(text).toContain(value);
      }
    });
  }

  it('the store flatteners are the same layout under another name', () => {
    expect(flattenSceneToText(scene, 'full')).toBe(sceneLinesToText(buildSceneLines(scene, 'full')));
    expect(flattenSceneReminder(scene)).toBe(sceneLinesToText(buildSceneLines(scene, 'recap')));
  });
});
