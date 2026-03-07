// ---------------------------------------------------------------------------
// tests/unit/stores/gameStore.test.ts — Unit tests for exported helpers
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { flattenSceneToText, flattenSceneReminder } from '../../../src/stores/sceneHelpers';
import type { NarratedScene } from '@narration/scene';

const baseScene: NarratedScene = {
  scenarioIntro: null,
  intro: [{ kind: 'location', value: 'Baie Cryo' }],
  locationDescription: null,
  obstacle: null,
  features: [{ kind: 'text', value: 'Vous voyez un terminal.' }],
  items: [],
  npcs: [],
  exits: [{ kind: 'exit', value: 'Sortie vers couloir.', visited: false }],
  prompt: 'Que faites-vous ?',
};

describe('flattenSceneToText', () => {
  it('showIntro=true: renders intro + elements + prompt', () => {
    const text = flattenSceneToText(baseScene, true);
    expect(text).toContain('Baie Cryo');
    expect(text).toContain('Vous voyez un terminal.');
    expect(text).toContain('Que faites-vous ?');
  });

  it('showIntro=false: skips intro, renders elements + prompt', () => {
    const text = flattenSceneToText(baseScene, false);
    expect(text).not.toContain('Baie Cryo');
    expect(text).toContain('Vous voyez un terminal.');
  });

  it('with scenarioIntro and locationDescription: renders both in order', () => {
    const scene: NarratedScene = {
      ...baseScene,
      scenarioIntro: 'Intro scénario.',
      intro: [{ kind: 'location', value: 'Baie Cryo' }],
      locationDescription: 'Froid mordant.',
    };
    const text = flattenSceneToText(scene, true);
    // scenarioIntro comes first
    expect(text.indexOf('Intro scénario.')).toBeLessThan(text.indexOf('Baie Cryo'));
    // intro + description joined with " — "
    expect(text).toContain('Baie Cryo — Froid mordant.');
  });

  it('revisit with null locationDescription: no em-dash', () => {
    const scene: NarratedScene = {
      ...baseScene,
      intro: [
        { kind: 'text', value: 'Vous revenez dans ' },
        { kind: 'location', value: 'la baie cryo' },
        { kind: 'text', value: '.' },
      ],
      locationDescription: null,
    };
    const text = flattenSceneToText(scene, true);
    expect(text).toContain('Vous revenez dans la baie cryo.');
    expect(text).not.toContain('—');
  });

  it('obstacle appears before features in output', () => {
    const scene: NarratedScene = {
      ...baseScene,
      obstacle: 'Un obstacle bloque le passage.',
    };
    const text = flattenSceneToText(scene, true);
    const obstacleIdx = text.indexOf('Un obstacle bloque le passage.');
    const featuresIdx = text.indexOf('Vous voyez un terminal.');
    expect(obstacleIdx).toBeGreaterThanOrEqual(0);
    expect(featuresIdx).toBeGreaterThanOrEqual(0);
    expect(obstacleIdx).toBeLessThan(featuresIdx);
  });

  it('scenarioIntro blank separator is present in output', () => {
    const scene: NarratedScene = {
      ...baseScene,
      scenarioIntro: 'Intro scénario.',
    };
    const text = flattenSceneToText(scene, true);
    // blank line between scenarioIntro and intro
    expect(text).toContain('Intro scénario.\n\nBaie Cryo');
  });

  it('showIntro=false: scenarioIntro and locationDescription are suppressed', () => {
    const scene: NarratedScene = {
      ...baseScene,
      scenarioIntro: 'Intro scénario.',
      locationDescription: 'Froid mordant.',
    };
    const text = flattenSceneToText(scene, false);
    expect(text).not.toContain('Intro scénario.');
    expect(text).not.toContain('Froid mordant.');
    expect(text).toContain('Vous voyez un terminal.');
  });
});

describe('flattenSceneReminder', () => {
  it('produces only elements + prompt, no intro or description', () => {
    const scene: NarratedScene = {
      scenarioIntro: 'ignore',
      intro: [{ kind: 'location', value: 'ignore' }],
      locationDescription: 'ignore',
      obstacle: null,
      features: [{ kind: 'text', value: 'Vous voyez un terminal.' }],
      items: [{ kind: 'text', value: 'Vous remarquez un couteau.' }],
      npcs: [],
      exits: [{ kind: 'exit', value: 'Sortie.', visited: false }],
      prompt: 'Que faites-vous ?',
    };
    const text = flattenSceneReminder(scene);
    expect(text).not.toContain('ignore');
    expect(text).toContain('Vous voyez un terminal.');
    expect(text).toContain('Vous remarquez un couteau.');
    expect(text).toContain('Que faites-vous ?');
  });

  it('reminder does not include obstacle', () => {
    const scene: NarratedScene = {
      ...baseScene,
      obstacle: 'Obstacle bloquant.',
    };
    const text = flattenSceneReminder(scene);
    expect(text).not.toContain('Obstacle bloquant.');
  });
});
