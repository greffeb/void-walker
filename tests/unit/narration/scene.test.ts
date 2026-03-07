// ---------------------------------------------------------------------------
// tests/unit/narration/scene.test.ts — narrateScene() restructured output
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { narrateScene } from '../../../src/narration/scene';
import type { SceneDescription } from '../../../src/engine/types';

const baseSD: SceneDescription = {
  locationName: 'Baie des Capsules Cryogéniques',
  locationDescription: 'Vous ouvrez les yeux. Froid mordant.',
  obstacleHint: null,
  visibleItems: [],
  visibleFeatures: [],
  visibleNpcs: [],
  exits: [],
};

describe('narrateScene restructured output', () => {
  it('new_game: scenarioIntro populated, locationDescription populated, intro is just location name', () => {
    const sd = { ...baseSD, scenarioIntro: 'Intro du scénario.' };
    const result = narrateScene(sd, 'new_game', 'fr');
    expect(result.scenarioIntro).toBe('Intro du scénario.');
    expect(result.locationDescription).toBe('Vous ouvrez les yeux. Froid mordant.');
    const introText = result.intro.map(t => t.value).join('');
    expect(introText).toBe('Baie des Capsules Cryogéniques');
    expect(introText).not.toMatch(/Vous/);
  });

  it('enter: scenarioIntro null, locationDescription populated', () => {
    const result = narrateScene(baseSD, 'enter', 'fr');
    expect(result.scenarioIntro).toBeNull();
    expect(result.locationDescription).toBe('Vous ouvrez les yeux. Froid mordant.');
    const introText = result.intro.map(t => t.value).join('');
    expect(introText).toBe('Baie des Capsules Cryogéniques');
  });

  it('revisit: scenarioIntro null, locationDescription null, intro is revisit phrase', () => {
    const result = narrateScene(baseSD, 'revisit', 'fr');
    expect(result.scenarioIntro).toBeNull();
    expect(result.locationDescription).toBeNull();
    const introText = result.intro.map(t => t.value).join('');
    expect(introText).toMatch(/[Vv]ous revenez/);
    expect(introText).toMatch(/baie/i);
  });

  it('empty locationDescription becomes null', () => {
    const sd = { ...baseSD, locationDescription: '' };
    const result = narrateScene(sd, 'enter', 'fr');
    expect(result.locationDescription).toBeNull();
  });
});
