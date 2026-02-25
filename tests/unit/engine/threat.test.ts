// ---------------------------------------------------------------------------
// tests/unit/engine/threat.test.ts — Threat Director state machine tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  THREAT_BEHAVIORS,
  createThreatDirector,
  transitionBeat,
  onCreatureWounded,
  onCreatureReturns,
  generateEncounter,
  threatCheck,
  MIN_TURNS_BETWEEN_ENCOUNTERS,
  MIN_TURNS_BETWEEN_HINTS,
  WOUNDED_COOLDOWN_TURNS,
  DROUGHT_BONUS,
  DROUGHT_BONUS_THRESHOLD,
} from '../../../src/engine/threat';
import type { RngFn } from '../../../src/engine/threat';
import type { ThreatDirectorState } from '../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// RNG HELPERS
// ---------------------------------------------------------------------------

/** Always returns the same float value (0.0 by default → triggers everything). */
function makeRng(floatVal: number = 0): RngFn {
  return {
    float: () => floatVal,
    pick: <T>(arr: readonly T[]) => arr[0],
  };
}

/** Sequence RNG: each call to float() returns the next value in the sequence. */
function seqRng(values: number[]): RngFn {
  let idx = 0;
  return {
    float: () => values[idx++ % values.length],
    pick: <T>(arr: readonly T[]) => arr[0],
  };
}

function makeDirector(overrides: Partial<ThreatDirectorState> = {}): ThreatDirectorState {
  return {
    ...createThreatDirector('intro'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// THREAT_BEHAVIORS table
// ---------------------------------------------------------------------------

describe('THREAT_BEHAVIORS table', () => {
  it('intro has aggressiveness 0 and encounterChance 0', () => {
    expect(THREAT_BEHAVIORS.intro.aggressiveness).toBe(0);
    expect(THREAT_BEHAVIORS.intro.encounterChance).toBe(0);
    expect(THREAT_BEHAVIORS.intro.visibility).toBe('hidden');
  });

  it('rising has encounterChance 0.05 (rare jump-scare)', () => {
    expect(THREAT_BEHAVIORS.rising.encounterChance).toBe(0.05);
    expect(THREAT_BEHAVIORS.rising.visibility).toBe('hinted');
  });

  it('midpoint has encounterChance 0.10 and aggressiveness 4', () => {
    expect(THREAT_BEHAVIORS.midpoint.encounterChance).toBe(0.10);
    expect(THREAT_BEHAVIORS.midpoint.aggressiveness).toBe(4);
    expect(THREAT_BEHAVIORS.midpoint.visibility).toBe('glimpsed');
  });

  it('escalation has encounterChance 0.30 and aggressiveness 7', () => {
    expect(THREAT_BEHAVIORS.escalation.encounterChance).toBe(0.30);
    expect(THREAT_BEHAVIORS.escalation.aggressiveness).toBe(7);
    expect(THREAT_BEHAVIORS.escalation.visibility).toBe('present');
  });

  it('climax has encounterChance 0.80 and no hints (IT\'S HERE)', () => {
    expect(THREAT_BEHAVIORS.climax.encounterChance).toBe(0.80);
    expect(THREAT_BEHAVIORS.climax.hintChance).toBe(0.0);
    expect(THREAT_BEHAVIORS.climax.narrativeHints).toHaveLength(0);
    expect(THREAT_BEHAVIORS.climax.visibility).toBe('pursuing');
  });

  it('resolution has encounterChance 0 (aftermath)', () => {
    expect(THREAT_BEHAVIORS.resolution.encounterChance).toBe(0);
    expect(THREAT_BEHAVIORS.resolution.visibility).toBe('aftermath');
  });

  it('all 6 beats are defined', () => {
    const beats = ['intro', 'rising', 'midpoint', 'escalation', 'climax', 'resolution'] as const;
    for (const beat of beats) {
      expect(THREAT_BEHAVIORS[beat]).toBeDefined();
    }
  });

  it('aggressiveness escalates through beats', () => {
    expect(THREAT_BEHAVIORS.intro.aggressiveness).toBeLessThan(THREAT_BEHAVIORS.rising.aggressiveness);
    expect(THREAT_BEHAVIORS.rising.aggressiveness).toBeLessThan(THREAT_BEHAVIORS.midpoint.aggressiveness);
    expect(THREAT_BEHAVIORS.midpoint.aggressiveness).toBeLessThan(THREAT_BEHAVIORS.escalation.aggressiveness);
    expect(THREAT_BEHAVIORS.escalation.aggressiveness).toBeLessThan(THREAT_BEHAVIORS.climax.aggressiveness);
  });
});

// ---------------------------------------------------------------------------
// createThreatDirector
// ---------------------------------------------------------------------------

describe('createThreatDirector', () => {
  it('creates director with correct initial state', () => {
    const d = createThreatDirector('rising');
    expect(d.currentBeat).toBe('rising');
    expect(d.encounterCount).toBe(0);
    expect(d.turnsSinceLastEncounter).toBe(0);
    expect(d.turnsSinceLastHint).toBe(0);
    expect(d.hintHistory).toHaveLength(0);
    expect(d.creatureWounded).toBe(false);
    expect(d.creatureEnraged).toBe(false);
    expect(d.woundedCooldown).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// transitionBeat
// ---------------------------------------------------------------------------

describe('transitionBeat', () => {
  it('changes currentBeat while preserving other state', () => {
    const d = makeDirector({ currentBeat: 'intro', encounterCount: 3 });
    const updated = transitionBeat(d, 'escalation');
    expect(updated.currentBeat).toBe('escalation');
    expect(updated.encounterCount).toBe(3);
  });

  it('does not mutate the original', () => {
    const d = createThreatDirector('intro');
    transitionBeat(d, 'climax');
    expect(d.currentBeat).toBe('intro');
  });
});

// ---------------------------------------------------------------------------
// Creature learning
// ---------------------------------------------------------------------------

describe('onCreatureWounded', () => {
  it('sets creatureWounded and woundedCooldown', () => {
    const d = createThreatDirector('escalation');
    const updated = onCreatureWounded(d);
    expect(updated.creatureWounded).toBe(true);
    expect(updated.woundedCooldown).toBe(WOUNDED_COOLDOWN_TURNS);
    expect(updated.creatureEnraged).toBe(false);
  });

  it('does not mutate original', () => {
    const d = createThreatDirector('escalation');
    onCreatureWounded(d);
    expect(d.creatureWounded).toBe(false);
  });
});

describe('onCreatureReturns', () => {
  it('clears wounded state and sets enraged', () => {
    const d = makeDirector({ creatureWounded: true, woundedCooldown: 0 });
    const updated = onCreatureReturns(d);
    expect(updated.creatureWounded).toBe(false);
    expect(updated.creatureEnraged).toBe(true);
    expect(updated.woundedCooldown).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// generateEncounter
// ---------------------------------------------------------------------------

describe('generateEncounter', () => {
  it('intro (agg 0) → stalk, rounds 0', () => {
    const d = createThreatDirector('intro');
    const behavior = THREAT_BEHAVIORS.intro;
    const event = generateEncounter(behavior, d, makeRng(0));
    expect(event.type).toBe('encounter');
    expect(event.subtype).toBe('stalk');
    expect(event.rounds).toBe(0);
  });

  it('rising (agg 2) → stalk only (agg ≤ 3)', () => {
    const d = createThreatDirector('rising');
    const behavior = THREAT_BEHAVIORS.rising;
    // agg=2 ≤ 3, always stalk regardless of rng
    expect(generateEncounter(behavior, d, makeRng(0)).subtype).toBe('stalk');
    expect(generateEncounter(behavior, d, makeRng(0.9)).subtype).toBe('stalk');
  });

  it('midpoint (agg 4) → stalk or ambush (agg 4–6 range)', () => {
    const d = createThreatDirector('midpoint');
    const behavior = THREAT_BEHAVIORS.midpoint;
    // float < 0.5 → stalk
    const stalkEvent = generateEncounter(behavior, d, makeRng(0.4));
    expect(stalkEvent.subtype).toBe('stalk');
    // float >= 0.5 → ambush
    const ambushEvent = generateEncounter(behavior, d, makeRng(0.6));
    expect(ambushEvent.subtype).toBe('ambush');
    expect(ambushEvent.rounds).toBe(1);
  });

  it('escalation (agg 7) → hunt with flee option after 2 rounds', () => {
    const d = createThreatDirector('escalation');
    const behavior = THREAT_BEHAVIORS.escalation;
    const event = generateEncounter(behavior, d, makeRng(0));
    expect(event.subtype).toBe('hunt');
    expect(event.rounds).toBe(-1);
    expect(event.canFlee).toBe(true);
    expect(event.fleeAfterRounds).toBe(2);
  });

  it('climax (agg 10) → pursue, no escape', () => {
    const d = createThreatDirector('climax');
    const behavior = THREAT_BEHAVIORS.climax;
    const event = generateEncounter(behavior, d, makeRng(0));
    expect(event.subtype).toBe('pursue');
    expect(event.rounds).toBe(-1);
    expect(event.canFlee).toBe(false);
  });

  it('enraged creature (+2 agg) escalates encounter type', () => {
    // midpoint (agg 4) + enraged (+2) = agg 6 → still ambush tier
    const d = makeDirector({ currentBeat: 'midpoint', creatureEnraged: true });
    const behavior = THREAT_BEHAVIORS.midpoint;
    const event = generateEncounter(behavior, d, makeRng(0.6));
    // agg 4 + 2 = 6, exactly at boundary → ambush tier
    expect(event.subtype).toBe('ambush');
  });

  it('enraged escalation (agg 9) → hunt tier', () => {
    // escalation (agg 7) + enraged (+2) = agg 9
    const d = makeDirector({ currentBeat: 'escalation', creatureEnraged: true });
    const behavior = THREAT_BEHAVIORS.escalation;
    const event = generateEncounter(behavior, d, makeRng(0));
    expect(event.subtype).toBe('hunt');
  });

  it('enraged climax (agg 12) → pursue tier', () => {
    const d = makeDirector({ currentBeat: 'climax', creatureEnraged: true });
    const behavior = THREAT_BEHAVIORS.climax;
    const event = generateEncounter(behavior, d, makeRng(0));
    expect(event.subtype).toBe('pursue');
  });
});

// ---------------------------------------------------------------------------
// threatCheck — pacing rules
// ---------------------------------------------------------------------------

describe('threatCheck — no event when encounter gap not met', () => {
  it('does not generate encounter before MIN_TURNS gap (even with 100% chance)', () => {
    // Give 100% encounter chance, but turns counter hasn't reached minimum
    const d = makeDirector({
      currentBeat: 'escalation',
      turnsSinceLastEncounter: MIN_TURNS_BETWEEN_ENCOUNTERS - 1,
      turnsSinceLastHint: 0,
    });
    const { event } = threatCheck(d, false, makeRng(0)); // float=0 → triggers if allowed
    // Can't be an encounter (gap not met). Might be hint if hints fire at turn 0.
    expect(event?.type).not.toBe('encounter');
  });

  it('generates encounter exactly at MIN_TURNS gap', () => {
    const d = makeDirector({
      currentBeat: 'escalation', // encounterChance = 0.30
      turnsSinceLastEncounter: MIN_TURNS_BETWEEN_ENCOUNTERS,
      turnsSinceLastHint: 100,
    });
    // float = 0 → always below 0.30 encounterChance
    const { event } = threatCheck(d, false, makeRng(0));
    expect(event?.type).toBe('encounter');
  });
});

describe('threatCheck — encounter increments counter and resets gap', () => {
  it('increments encounterCount and resets turnsSinceLastEncounter on encounter', () => {
    const d = makeDirector({
      currentBeat: 'escalation',
      encounterCount: 2,
      turnsSinceLastEncounter: 10,
    });
    const { updatedDirector } = threatCheck(d, false, makeRng(0));
    expect(updatedDirector.encounterCount).toBe(3);
    expect(updatedDirector.turnsSinceLastEncounter).toBe(0);
  });
});

describe('threatCheck — drought bonus', () => {
  it('applies drought bonus after DROUGHT_BONUS_THRESHOLD turns', () => {
    // Use midpoint beat (encounterChance 0.10)
    // Normal: need float < 0.10. With drought bonus (+0.15): need float < 0.25
    // float = 0.12 → above normal 0.10 but below drought threshold
    const droughtD = makeDirector({
      currentBeat: 'midpoint',
      turnsSinceLastEncounter: DROUGHT_BONUS_THRESHOLD + 1, // above threshold
    });
    // With drought bonus, 0.10 + 0.15 = 0.25 effective chance
    const { event } = threatCheck(droughtD, false, makeRng(0.12));
    expect(event?.type).toBe('encounter');
  });

  it('drought bonus value is correct', () => {
    expect(DROUGHT_BONUS).toBe(0.15);
    expect(DROUGHT_BONUS_THRESHOLD).toBe(8);
  });
});

describe('threatCheck — wounded creature avoidance', () => {
  it('returns no encounter when creature is wounded (avoidance mode)', () => {
    const d = makeDirector({
      currentBeat: 'escalation',
      creatureWounded: true,
      woundedCooldown: 3,
    });
    // float = 0 would normally trigger encounter AND wounded hint
    const { event } = threatCheck(d, false, makeRng(1)); // float=1 → no hint
    expect(event).toBeNull();
  });

  it('decrements woundedCooldown each turn', () => {
    const d = makeDirector({
      currentBeat: 'escalation',
      creatureWounded: true,
      woundedCooldown: 3,
    });
    const { updatedDirector } = threatCheck(d, false, makeRng(1));
    expect(updatedDirector.woundedCooldown).toBe(2);
    expect(updatedDirector.creatureWounded).toBe(true);
  });

  it('transitions to enraged when cooldown reaches 0', () => {
    const d = makeDirector({
      currentBeat: 'escalation',
      creatureWounded: true,
      woundedCooldown: 1,
    });
    const { updatedDirector } = threatCheck(d, false, makeRng(1));
    expect(updatedDirector.woundedCooldown).toBe(0);
    expect(updatedDirector.creatureWounded).toBe(false);
    expect(updatedDirector.creatureEnraged).toBe(true);
  });

  it('may give wounded retreat hint (30% chance)', () => {
    const d = makeDirector({
      currentBeat: 'escalation',
      creatureWounded: true,
      woundedCooldown: 2,
    });
    const { event } = threatCheck(d, false, makeRng(0.1)); // float < 0.30
    expect(event?.type).toBe('hint');
    if (event?.type === 'hint') {
      expect(event.template).toBe('creature_wounded_retreat');
    }
  });
});

describe('threatCheck — module threat suppression', () => {
  it('suppresses random encounters when module has own threat', () => {
    const d = makeDirector({
      currentBeat: 'escalation',
      turnsSinceLastEncounter: 10, // way past gap
    });
    // float=0 would normally trigger encounter, but module suppresses it
    const { event } = threatCheck(d, true, makeRng(1)); // float=1 → nothing
    expect(event).toBeNull();
  });

  it('still fires hints at 50% rate when module suppresses encounters', () => {
    const d = makeDirector({
      currentBeat: 'escalation', // hintChance 0.5, suppressed to 0.25
      turnsSinceLastHint: MIN_TURNS_BETWEEN_HINTS,
    });
    // float=0.1 < 0.5*0.5 = 0.25 → hint should fire
    const { event } = threatCheck(d, true, makeRng(0.1));
    expect(event?.type).toBe('hint');
  });

  it('does not fire hints below suppressed rate', () => {
    const d = makeDirector({
      currentBeat: 'escalation', // hintChance 0.5, suppressed to 0.25
      turnsSinceLastHint: MIN_TURNS_BETWEEN_HINTS,
    });
    // float=0.3 > 0.25 → no hint
    const { event } = threatCheck(d, true, makeRng(0.3));
    expect(event).toBeNull();
  });
});

describe('threatCheck — hint anti-repetition', () => {
  it('picks unused hints first', () => {
    const hints = ['blood_trail', 'distant_scream', 'camera_movement', 'ventilation_sound', 'broken_barricade', 'claw_marks_fresh'];
    const d = makeDirector({
      currentBeat: 'rising',
      turnsSinceLastHint: MIN_TURNS_BETWEEN_HINTS,
      hintHistory: hints.slice(0, 5), // all but 'claw_marks_fresh' are used
    });
    // pick always returns arr[0], so available = ['claw_marks_fresh']
    const { event } = threatCheck(d, false, makeRng(0));
    if (event?.type === 'hint') {
      expect(event.template).toBe('claw_marks_fresh');
    }
  });

  it('hint template is added to history', () => {
    const d = makeDirector({
      currentBeat: 'rising',
      turnsSinceLastHint: MIN_TURNS_BETWEEN_HINTS,
      hintHistory: [],
      turnsSinceLastEncounter: 100, // suppress encounter
    });
    const { updatedDirector, event } = threatCheck(d, false, seqRng([1, 1, 0]));
    // The third float call hits hint chance
    if (event?.type === 'hint') {
      expect(updatedDirector.hintHistory).toContain(event.template);
    }
  });
});

describe('threatCheck — environmental effects', () => {
  it('fires environmental effect at escalation beat (agg 7 ≥ 5)', () => {
    const d = makeDirector({
      currentBeat: 'escalation',
      turnsSinceLastEncounter: 0, // suppress encounter (gap not met)
      turnsSinceLastHint: 0,       // suppress hint (gap not met)
    });
    // float=0 → triggers ENV_EFFECT_CHANCE (0.30)
    const { event } = threatCheck(d, false, makeRng(0));
    expect(event?.type).toBe('environmental');
  });

  it('does NOT fire environmental at intro (agg 0 < 5)', () => {
    const d = makeDirector({
      currentBeat: 'intro',
      turnsSinceLastEncounter: 100,
      turnsSinceLastHint: 0,
    });
    const { event } = threatCheck(d, false, makeRng(0.15));
    // 0.15 < 0.30 would fire env if allowed, but agg=0 blocks it
    // Should be null (no hint possible either - hintChance 0.2 but turnsSinceLastHint=0 < MIN=2)
    if (event) {
      expect(event.type).not.toBe('environmental');
    }
  });
});

describe('threatCheck — counter increments on no event', () => {
  it('increments both counters when no event fires', () => {
    const d = makeDirector({
      currentBeat: 'intro',       // encounterChance = 0
      turnsSinceLastEncounter: 0,
      turnsSinceLastHint: 0,
    });
    // float=1 → nothing fires
    const { event, updatedDirector } = threatCheck(d, false, makeRng(1));
    expect(event).toBeNull();
    expect(updatedDirector.turnsSinceLastEncounter).toBe(1);
    expect(updatedDirector.turnsSinceLastHint).toBe(1);
  });
});
