// ---------------------------------------------------------------------------
// src/engine/shipMemory.ts — Ship Memory mark creation and querying
// ---------------------------------------------------------------------------
// Failed actions permanently mark the environment, changing DC modifiers
// and sometimes revealing new interaction possibilities.
// ---------------------------------------------------------------------------

import type {
  EnvironmentMark, EnvironmentMarkEffect,
} from './types';
import type { VerbId } from './verbs';
import type { PropertyId } from './properties';

// ---------------------------------------------------------------------------
// Mark catalog — 7 verb×target combinations that leave marks
// ---------------------------------------------------------------------------

interface MarkTemplate {
  /** Target must include at least one of these properties to match */
  readonly requiredProperties: readonly PropertyId[];
  readonly effect: EnvironmentMarkEffect;
}

const MARK_CATALOG: Readonly<Partial<Record<VerbId, MarkTemplate>>> = {
  FORCE_OPEN: {
    requiredProperties: ['openable', 'secured', 'lockable'],
    effect: {
      propertiesRemoved: ['sealed'],
      sameActionDCMod: -2,
      otherActionDCMod: -1,
      noiseGenerated: true,
    },
  },
  HACK: {
    requiredProperties: ['electronic', 'programmable'],
    effect: {
      sameActionDCMod: -1,
      otherActionDCMod: -2,
      noiseGenerated: false,
      newApproachRevealed: 'maintenance_port',
    },
  },
  BREAK: {
    requiredProperties: ['breakable', 'transparent', 'fragile'],
    effect: {
      propertiesRemoved: ['sealed'],
      sameActionDCMod: -3,
      otherActionDCMod: -1,
      noiseGenerated: true,
    },
  },
  STRIKE: {
    requiredProperties: ['alive', 'robotic', 'hostile', 'neutral', 'sentient'],
    effect: {
      sameActionDCMod: 0,
      otherActionDCMod: -1,
      noiseGenerated: true,
    },
  },
  REPAIR: {
    requiredProperties: ['electronic', 'mechanical', 'broken', 'powered'],
    effect: {
      sameActionDCMod: -1,
      otherActionDCMod: -2,
      noiseGenerated: false,
      newApproachRevealed: 'exposed_wiring',
    },
  },
  UNLOCK: {
    requiredProperties: ['lockable', 'secured', 'locked'],
    effect: {
      sameActionDCMod: -1,
      otherActionDCMod: 0,
      noiseGenerated: false,
    },
  },
  CLIMB: {
    requiredProperties: ['climbable'],
    effect: {
      sameActionDCMod: -1,
      otherActionDCMod: -1,
      noiseGenerated: false,
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a Ship Memory mark for a failed action.
 * Returns null if the verb×target combination is not in the catalog.
 *
 * Only called for 'failure' and 'critical_failure' outcomes.
 */
export function createMark(
  locationId: string,
  targetId: string,
  verb: VerbId,
  targetProperties: readonly PropertyId[],
  outcome: 'failure' | 'critical_failure',
  turn: number,
): EnvironmentMark | null {
  const template = MARK_CATALOG[verb];
  if (!template) return null;

  // At least one required property must be present on the target
  const propertiesSet = new Set<string>(targetProperties);
  const hasMatch = template.requiredProperties.some(p => propertiesSet.has(p as string));
  if (!hasMatch) return null;

  return {
    locationId,
    targetId,
    verb,
    outcome,
    effect: template.effect,
    turn,
  };
}

/**
 * Add a mark to a Ship Memory array (immutably).
 */
export function addMark(
  shipMemory: readonly EnvironmentMark[],
  mark: EnvironmentMark,
): readonly EnvironmentMark[] {
  return [...shipMemory, mark];
}

/**
 * Get all marks for a specific target in a specific location.
 */
export function getMarksForTarget(
  shipMemory: readonly EnvironmentMark[],
  locationId: string,
  targetId: string,
): readonly EnvironmentMark[] {
  return shipMemory.filter(m => m.locationId === locationId && m.targetId === targetId);
}

/**
 * Sum the DC modifier from a set of marks for the given verb.
 * - If the mark verb matches currentVerb: apply sameActionDCMod
 * - Otherwise: apply otherActionDCMod
 *
 * Negative values make the action easier; callers add this to the base DC.
 */
export function getMarkDCModifier(
  marks: readonly EnvironmentMark[],
  currentVerb: VerbId,
): number {
  let total = 0;
  for (const mark of marks) {
    if (mark.verb === currentVerb) {
      total += mark.effect.sameActionDCMod;
    } else {
      total += mark.effect.otherActionDCMod;
    }
  }
  return total;
}

/**
 * Collect all property additions and removals across a set of marks.
 * Duplicate property IDs are deduplicated.
 */
export function getMarkPropertyChanges(
  marks: readonly EnvironmentMark[],
): { readonly added: readonly PropertyId[]; readonly removed: readonly PropertyId[] } {
  const added = new Set<PropertyId>();
  const removed = new Set<PropertyId>();

  for (const mark of marks) {
    mark.effect.propertiesAdded?.forEach(p => added.add(p));
    mark.effect.propertiesRemoved?.forEach(p => removed.add(p));
  }

  return {
    added: [...added],
    removed: [...removed],
  };
}
