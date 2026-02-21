// ---------------------------------------------------------------------------
// tests/unit/engine/difficulty.test.ts — Difficulty calculator unit tests
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { detectCreativity, calculateDifficulty } from '../../../src/engine/difficulty';
import { BALANCE } from '../../../src/engine/constants';
import type { DifficultyInput, ParsedAction, ResolvedTarget, StatBlock, VerbMatch, VerbMatchStrategy } from '../../../src/engine/types';
import type { VerbId } from '../../../src/engine/verbs';
import type { PropertyId } from '../../../src/engine/properties';

// === TEST HELPERS ===

function makeStats(overrides: Partial<StatBlock> = {}): StatBlock {
  return {
    FOR: 3, DEF: 3, AGI: 3, INT: 3, PER: 3, CHA: 3, LCK: 3,
    ...overrides,
  };
}

function makeTarget(id: string, props: PropertyId[] = [], source: 'inventory' | 'location' | 'npc' | 'environment' | 'abstract' = 'npc'): ResolvedTarget {
  return {
    id,
    nameKey: `item.${id}`,
    properties: props,
    isVirtual: false,
    source,
  };
}

function makeAction(verb: VerbId, target: ResolvedTarget | null = null): ParsedAction {
  return {
    verb,
    target,
    tool: null,
    rawInput: '',
    tokens: [],
    verbMatch: { verb, strategy: 1 as VerbMatchStrategy, confidence: 1, isCompound: false },
    creative: false,
  };
}

function makeInput(overrides: Partial<DifficultyInput> = {}): DifficultyInput {
  return {
    verb: 'STRIKE' as VerbId,
    target: makeTarget('robot', ['hostile', 'robotic'] as PropertyId[]),
    tool: null,
    playerStats: makeStats(),
    difficultyLevel: 'survivor',
    creative: false,
    ...overrides,
  };
}

// === CREATIVITY DETECTION ===

describe('detectCreativity()', () => {
  test('returns 0 when no suggestions', () => {
    const action = makeAction('STRIKE');
    expect(detectCreativity(action, [])).toBe(0);
  });

  test('returns 0 when action matches a suggestion', () => {
    const target = makeTarget('robot');
    const action = makeAction('STRIKE', target);
    const suggestions = [makeAction('STRIKE', target)];
    expect(detectCreativity(action, suggestions)).toBe(0);
  });

  test('returns negative bonus when different from suggestions', () => {
    const action = makeAction('HACK', makeTarget('door'));
    const suggestions = [makeAction('STRIKE', makeTarget('robot'))];
    const bonus = detectCreativity(action, suggestions);
    expect(bonus).toBeLessThan(0);
  });

  test('novel verb gets extra bonus', () => {
    const action = makeAction('HACK', makeTarget('door'));
    const suggestions = [makeAction('STRIKE', makeTarget('robot'))];
    const bonus = detectCreativity(action, suggestions);
    // Should include DIFFERENT_FROM_SUGGESTIONS_BONUS + NOVEL_COMBO_BONUS
    expect(bonus).toBe(
      BALANCE.CREATIVITY.DIFFERENT_FROM_SUGGESTIONS_BONUS +
      BALANCE.CREATIVITY.NOVEL_COMBO_BONUS,
    );
  });
});

// === DIFFICULTY CALCULATOR ===

describe('calculateDifficulty()', () => {
  test('auto verbs have DC 0', () => {
    const result = calculateDifficulty(makeInput({ verb: 'TAKE' as VerbId }));
    expect(result.total).toBe(0);
    expect(result.details).toContain('Action automatique (DC 0)');
  });

  test('base difficulty is BALANCE.BASE_DIFFICULTY', () => {
    const result = calculateDifficulty(makeInput());
    expect(result.base).toBe(BALANCE.BASE_DIFFICULTY);
  });

  test('total is clamped to [MIN, MAX]', () => {
    // Use a very difficult scenario
    const result = calculateDifficulty(makeInput({
      verb: 'HACK' as VerbId,
      target: makeTarget('organic_blob', [] as PropertyId[]),
      difficultyLevel: 'nightmare',
      environmentConditions: ['dark', 'zero_g', 'time_pressure'],
      playerConditions: ['wounded'],
    }));
    expect(result.total).toBeLessThanOrEqual(BALANCE.MAX_DIFFICULTY);
    expect(result.total).toBeGreaterThanOrEqual(BALANCE.MIN_DIFFICULTY);
  });

  test('explorer preset gives -2 mod', () => {
    const result = calculateDifficulty(makeInput({ difficultyLevel: 'explorer' }));
    expect(result.difficultyPresetMod).toBe(-2);
  });

  test('nightmare preset gives +2 mod', () => {
    const result = calculateDifficulty(makeInput({ difficultyLevel: 'nightmare' }));
    expect(result.difficultyPresetMod).toBe(2);
  });

  test('survivor preset gives 0 mod', () => {
    const result = calculateDifficulty(makeInput({ difficultyLevel: 'survivor' }));
    expect(result.difficultyPresetMod).toBe(0);
  });

  test('hostile target increases difficulty', () => {
    const hostile = makeInput({
      target: makeTarget('robot', ['hostile'] as PropertyId[]),
    });
    const neutral = makeInput({
      target: makeTarget('robot', [] as PropertyId[]),
    });
    const hostileResult = calculateDifficulty(hostile);
    const neutralResult = calculateDifficulty(neutral);
    expect(hostileResult.contextMods).toBeGreaterThan(neutralResult.contextMods);
  });

  test('friendly target decreases difficulty', () => {
    const friendly = makeInput({
      target: makeTarget('npc', ['friendly'] as PropertyId[]),
    });
    const neutral = makeInput({
      target: makeTarget('npc', [] as PropertyId[]),
    });
    const friendlyResult = calculateDifficulty(friendly);
    const neutralResult = calculateDifficulty(neutral);
    expect(friendlyResult.total).toBeLessThanOrEqual(neutralResult.total);
  });

  test('darkness increases difficulty', () => {
    const dark = makeInput({ environmentConditions: ['dark'] });
    const light = makeInput({ environmentConditions: [] });
    const darkResult = calculateDifficulty(dark);
    const lightResult = calculateDifficulty(light);
    expect(darkResult.total).toBeGreaterThan(lightResult.total);
  });

  test('wounded player increases difficulty', () => {
    const wounded = makeInput({ playerConditions: ['wounded'] });
    const healthy = makeInput({ playerConditions: [] });
    const woundedResult = calculateDifficulty(wounded);
    const healthyResult = calculateDifficulty(healthy);
    expect(woundedResult.total).toBeGreaterThan(healthyResult.total);
  });

  test('breakdown has all required fields', () => {
    const result = calculateDifficulty(makeInput());
    expect(typeof result.base).toBe('number');
    expect(typeof result.verbMod).toBe('number');
    expect(typeof result.compatibilityPenalty).toBe('number');
    expect(typeof result.contextMods).toBe('number');
    expect(typeof result.creativityMod).toBe('number');
    expect(typeof result.difficultyPresetMod).toBe('number');
    expect(typeof result.total).toBe('number');
    expect(Array.isArray(result.details)).toBe(true);
    expect(result.details.length).toBeGreaterThan(0);
  });

  test('creativity reduces difficulty', () => {
    const suggestion = makeAction('EXAMINE', makeTarget('door'));
    const creative = makeInput({
      verb: 'HACK' as VerbId,
      target: makeTarget('door', ['electronic', 'secured'] as PropertyId[]),
      creative: true,
      suggestions: [suggestion],
    });
    const normal = makeInput({
      verb: 'HACK' as VerbId,
      target: makeTarget('door', ['electronic', 'secured'] as PropertyId[]),
      creative: false,
    });
    const creativeResult = calculateDifficulty(creative);
    const normalResult = calculateDifficulty(normal);
    expect(creativeResult.creativityMod).toBeLessThanOrEqual(normalResult.creativityMod);
  });

  test('appropriate tool provides bonus', () => {
    // SHOOT requires 'ranged' tool prop
    const withTool = makeInput({
      verb: 'SHOOT' as VerbId,
      tool: makeTarget('pistol', ['ranged'] as PropertyId[], 'inventory'),
    });
    const withoutTool = makeInput({
      verb: 'SHOOT' as VerbId,
      tool: null,
    });
    const withResult = calculateDifficulty(withTool);
    const withoutResult = calculateDifficulty(withoutTool);
    expect(withResult.total).toBeLessThan(withoutResult.total);
  });
});
