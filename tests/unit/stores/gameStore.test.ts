// ---------------------------------------------------------------------------
// tests/unit/stores/gameStore.test.ts — Unit tests for exported helpers
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { flattenSceneToText, flattenSceneReminder, assembleTurnText } from '../../../src/stores/sceneHelpers';
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
  recap: [],
  prompt: 'Que faites-vous ?',
};

describe('flattenSceneToText', () => {
  it('showIntro=true: renders intro + elements + prompt', () => {
    const text = flattenSceneToText(baseScene, 'full');
    expect(text).toContain('Baie Cryo');
    expect(text).toContain('Vous voyez un terminal.');
    expect(text).toContain('Que faites-vous ?');
  });

  it("layout 'recap': no intro, no room — only what changed", () => {
    const text = flattenSceneToText(baseScene, 'recap');
    expect(text).not.toContain('Baie Cryo');
    expect(text).not.toContain('Vous voyez un terminal.');
    expect(text).toBe('Que faites-vous ?');
  });

  it('with scenarioIntro and locationDescription: renders both in order', () => {
    const scene: NarratedScene = {
      ...baseScene,
      scenarioIntro: 'Intro scénario.',
      intro: [{ kind: 'location', value: 'Baie Cryo' }],
      locationDescription: 'Froid mordant.',
    };
    const text = flattenSceneToText(scene, 'full');
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
    const text = flattenSceneToText(scene, 'full');
    expect(text).toContain('Vous revenez dans la baie cryo.');
    expect(text).not.toContain('—');
  });

  it('obstacle appears before features in output', () => {
    const scene: NarratedScene = {
      ...baseScene,
      obstacle: 'Un obstacle bloque le passage.',
    };
    const text = flattenSceneToText(scene, 'full');
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
    const text = flattenSceneToText(scene, 'full');
    // blank line between scenarioIntro and intro
    expect(text).toContain('Intro scénario.\n\nBaie Cryo');
  });

  it("layout 'recap': scenarioIntro and locationDescription are suppressed", () => {
    const scene: NarratedScene = {
      ...baseScene,
      scenarioIntro: 'Intro scénario.',
      locationDescription: 'Froid mordant.',
      recap: [{ kind: 'text', value: 'Désormais : le terminal.' }],
    };
    const text = flattenSceneToText(scene, 'recap');
    expect(text).not.toContain('Intro scénario.');
    expect(text).not.toContain('Froid mordant.');
    expect(text).toContain('Désormais : le terminal.');
  });
});

describe('flattenSceneReminder', () => {
  it('says nothing but the prompt when nothing moved', () => {
    // The whole room used to be reprinted after every single action, so a turn
    // spent examining one terminal ended with the room listed again.
    const text = flattenSceneReminder(baseScene);
    expect(text).toBe('Que faites-vous ?');
    expect(text).not.toContain('Vous voyez un terminal.');
  });

  it('carries the recap when something moved, and nothing else', () => {
    const scene: NarratedScene = {
      ...baseScene,
      scenarioIntro: 'ignore',
      intro: [{ kind: 'location', value: 'ignore' }],
      locationDescription: 'ignore',
      items: [{ kind: 'text', value: 'ignore' }],
      recap: [{ kind: 'text', value: 'Désormais : ' }, { kind: 'feature', value: 'le terminal' }],
    };
    const text = flattenSceneReminder(scene);
    expect(text).toContain('Désormais : le terminal');
    expect(text).toContain('Que faites-vous ?');
    expect(text).not.toContain('ignore');
  });

  it('does not repeat the obstacle', () => {
    const text = flattenSceneReminder({ ...baseScene, obstacle: 'Obstacle bloquant.' });
    expect(text).not.toContain('Obstacle bloquant.');
  });
});

describe('assembleTurnText', () => {
  it('same room, nothing moved: the action line, then the prompt', () => {
    const text = assembleTurnText('Vous examinez le terminal.', baseScene, null);
    expect(text).toBe('Vous examinez le terminal.\n\nQue faites-vous ?');
  });

  it('a move keeps the action line and prints the room it arrives in', () => {
    // The move narrative used to be discarded in favour of the scene alone.
    const text = assembleTurnText('Vous gagnez le centre de coordination.', baseScene, 'enter');
    expect(text).toContain('Vous gagnez le centre de coordination.');
    expect(text).toContain('Baie Cryo');
    expect(text).toContain('Que faites-vous ?');
  });

  it('falls back to the narrative alone when there is no scene', () => {
    expect(assembleTurnText('Rien ne bouge.', null, null)).toBe('Rien ne bouge.');
    expect(assembleTurnText('Rien ne bouge.', null, 'enter')).toBe('Rien ne bouge.');
  });
});
