// ---------------------------------------------------------------------------
// src/content/scenarios/index.ts — Scenario content exports
// ---------------------------------------------------------------------------

export { ESCAPE_SKELETON } from './escape';
export { INVESTIGATE_SKELETON } from './investigate';
export { RESCUE_SKELETON } from './rescue';

import { ESCAPE_SKELETON } from './escape';
import { INVESTIGATE_SKELETON } from './investigate';
import { RESCUE_SKELETON } from './rescue';
import type { CoreSkeleton } from '@engine/scenario';

/** All 3 launch skeletons */
export const LAUNCH_SKELETONS: readonly CoreSkeleton[] = [
  ESCAPE_SKELETON,
  INVESTIGATE_SKELETON,
  RESCUE_SKELETON,
] as const;

/** Look up a skeleton by ID */
export function getSkeletonById(id: string): CoreSkeleton | undefined {
  return LAUNCH_SKELETONS.find(s => s.id === id);
}
