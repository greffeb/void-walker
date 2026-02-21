// src/engine/index.ts — Public API (expanded in later phases)
// Phase 2: Parser, resolver, and difficulty exports

export { parseAction, normalizeInput, matchVerb, CURATED_FORMS, FRENCH_STOP_WORDS } from './parser';
export { resolveTarget, resolveBodyPart, BODY_PARTS } from './resolver';
export { calculateDifficulty, detectCreativity } from './difficulty';
export { stemFr } from './snowball-fr';
export { checkCompatibility } from './compatibility';
export type {
  ParseResult,
  ParsedAction,
  Reformulation,
  ResolvedTarget,
  VerbMatch,
  VerbMatchStrategy,
  TargetSource,
  DifficultyBreakdown,
  DifficultyInput,
  SceneContext,
  NpcInstance,
  EnvironmentFeatureInstance,
  BodyPartDefinition,
  EnvironmentCondition,
} from './types';
export { isReformulation } from './types';
