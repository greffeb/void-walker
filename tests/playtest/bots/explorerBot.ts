// ---------------------------------------------------------------------------
// tests/playtest/bots/explorerBot.ts — Coverage-oriented playtest bot
// ---------------------------------------------------------------------------
// Prioritizes broad content interaction:
// heal -> examine items/features/npcs -> talk -> pickup -> suggestions -> explore
// ---------------------------------------------------------------------------

import type { PlaytestBot, BotState, BotScene } from './index';

interface ExplorerMemory {
  lastTurn: number;
  lastLocation: string | null;
  locationStreak: number;
  healAttemptsAtLocation: number;
  examinedItems: Set<string>;
  examinedFeatures: Set<string>;
  examinedNpcs: Set<string>;
  talkedNpcs: Set<string>;
}

function createMemory(): ExplorerMemory {
  return {
    lastTurn: -1,
    lastLocation: null,
    locationStreak: 0,
    healAttemptsAtLocation: 0,
    examinedItems: new Set<string>(),
    examinedFeatures: new Set<string>(),
    examinedNpcs: new Set<string>(),
    talkedNpcs: new Set<string>(),
  };
}

const memory: ExplorerMemory = createMemory();

function maybeResetMemory(state: BotState): void {
  if (state.turn === 0 || state.turn <= memory.lastTurn) {
    const reset = createMemory();
    memory.lastTurn = reset.lastTurn;
    memory.lastLocation = reset.lastLocation;
    memory.locationStreak = reset.locationStreak;
    memory.healAttemptsAtLocation = reset.healAttemptsAtLocation;
    memory.examinedItems = reset.examinedItems;
    memory.examinedFeatures = reset.examinedFeatures;
    memory.examinedNpcs = reset.examinedNpcs;
    memory.talkedNpcs = reset.talkedNpcs;
  }
}

function selectUnseenTarget(
  ids: readonly string[],
  names: readonly string[],
  seen: Set<string>,
): string | null {
  const len = Math.min(ids.length, names.length);
  for (let i = 0; i < len; i++) {
    const id = ids[i];
    const name = names[i];
    if (id !== undefined && name !== undefined && !seen.has(id)) {
      seen.add(id);
      return name;
    }
  }
  return null;
}

function formatMoveTarget(scene: BotScene, index: number): string {
  const id = scene.connectedLocationIds[index];
  if (id) return id.replace(/_/g, ' ');
  return scene.connectedLocationAliases[index] ?? '';
}

export const explorerBot: PlaytestBot = {
  name: 'explorer',

  makeDecision(
    state: BotState,
    scene: BotScene,
    rng: { float(): number; pick<T>(arr: readonly T[]): T },
  ): string {
    maybeResetMemory(state);
    memory.lastTurn = state.turn;

    if (memory.lastLocation === state.playerLocationId) {
      memory.locationStreak += 1;
    } else {
      memory.lastLocation = state.playerLocationId;
      memory.locationStreak = 1;
      memory.healAttemptsAtLocation = 0;
    }

    // 1) Heal when critical.
    if (state.playerHp >= state.playerMaxHp * 0.3) {
      memory.healAttemptsAtLocation = 0;
    }
    if (
      state.playerHp < state.playerMaxHp * 0.3
      && scene.hasHealingItem
      && memory.healAttemptsAtLocation < 2
    ) {
      memory.healAttemptsAtLocation += 1;
      return 'utiliser kit medical';
    }

    // Hard cap on consecutive same-room turns to keep stuck=0 guarantees.
    if (scene.connectedLocationAliases.length > 0 && memory.locationStreak >= 8) {
      const unexploredIndices = scene.connectedLocationIds.flatMap((_, i) => {
        const id = scene.connectedLocationIds[i];
        return id !== undefined && !state.visitedLocationIds.includes(id) ? [i] : [];
      });
      if (unexploredIndices.length > 0) {
        return `aller ${formatMoveTarget(scene, rng.pick(unexploredIndices))}`;
      }
      const allIndices = scene.connectedLocationAliases.map((_, i) => i);
      return `aller ${formatMoveTarget(scene, rng.pick(allIndices))}`;
    }

    // 2) Examine unseen location items.
    const unseenItem = selectUnseenTarget(
      scene.locationItemIds,
      scene.locationItemNames,
      memory.examinedItems,
    );
    if (unseenItem) {
      return `examiner ${unseenItem}`;
    }

    // 3) Examine unseen environment features.
    const unseenFeature = selectUnseenTarget(
      scene.environmentFeatureIds,
      scene.environmentFeatureNames,
      memory.examinedFeatures,
    );
    if (unseenFeature) {
      return `examiner ${unseenFeature}`;
    }

    // 4) Examine unseen NPCs.
    const unseenNpcForExamine = selectUnseenTarget(
      scene.npcIds,
      scene.npcNames,
      memory.examinedNpcs,
    );
    if (unseenNpcForExamine) {
      return `examiner ${unseenNpcForExamine}`;
    }

    // 5) Talk to unseen NPCs.
    const unseenNpcForTalk = selectUnseenTarget(
      scene.npcIds,
      scene.npcNames,
      memory.talkedNpcs,
    );
    if (unseenNpcForTalk) {
      return `parler ${unseenNpcForTalk}`;
    }

    // 5b) Resolve obstacles — obstacles block forward progress, so the explorer
    // must interact with them after examining the current room's content.
    if (scene.hasObstacle && scene.obstacleTargetId !== null) {
      const obstacleVerbs = ['pousser', 'forcer', 'ouvrir', 'hacker', 'utiliser'];
      return `${rng.pick(obstacleVerbs)} ${scene.obstacleTargetId.replace(/_/g, ' ')}`;
    }

    // Emergency anti-loop guard: move periodically before repeating local
    // interactions forever.
    if (
      scene.connectedLocationAliases.length > 0
      && (memory.locationStreak >= 2 || state.turn % 6 === 0)
    ) {
      const unexploredIndices = scene.connectedLocationIds.flatMap((_, i) => {
        const id = scene.connectedLocationIds[i];
        return id !== undefined && !state.visitedLocationIds.includes(id) ? [i] : [];
      });
      if (unexploredIndices.length > 0) {
        return `aller ${formatMoveTarget(scene, rng.pick(unexploredIndices))}`;
      }
      const allIndices = scene.connectedLocationAliases.map((_, i) => i);
      return `aller ${formatMoveTarget(scene, rng.pick(allIndices))}`;
    }

    // 6) Pick up visible items to help progression.
    if (scene.locationItemNames.length > 0) {
      return `prendre ${rng.pick(scene.locationItemNames)}`;
    }

    // 7) Follow top suggestion when available (bounded to avoid local loops).
    if (scene.suggestions.length > 0 && state.turn % 4 !== 0) {
      return scene.suggestions[0]!;
    }

    // 8) Explore unexplored exits first.
    const unexploredIndices = scene.connectedLocationIds.flatMap((_, i) => {
      const id = scene.connectedLocationIds[i];
      return id !== undefined && !state.visitedLocationIds.includes(id) ? [i] : [];
    });
    if (unexploredIndices.length > 0) {
      return `aller ${formatMoveTarget(scene, rng.pick(unexploredIndices))}`;
    }

    // 9) Anti-loop movement when stuck in one room.
    if (scene.connectedLocationAliases.length > 0 && memory.locationStreak >= 4) {
      const allIndices = scene.connectedLocationAliases.map((_, i) => i);
      return `aller ${formatMoveTarget(scene, rng.pick(allIndices))}`;
    }

    // 10) Fallback.
    return 'regarder autour';
  },
};
