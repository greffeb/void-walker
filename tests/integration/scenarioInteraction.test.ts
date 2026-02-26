// ---------------------------------------------------------------------------
// tests/integration/scenarioInteraction.test.ts — Chantier 1 integration
// ---------------------------------------------------------------------------
// Verifies end-to-end scenario interaction flow:
// enriched features/items → processTurn → GameState mutations
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { processTurn } from '../../src/engine/processTurn';
import { getSceneContext } from '../../src/engine/scene';
import { createInitialGameState } from '../../src/engine/types';
import { getFeatureState, hasScenarioFlag, isItemRevealed, isExitUnlocked } from '../../src/engine/featureState';
import { buildParserLocaleData } from '../../src/content/parserData';
import type { GameState, CharacterState } from '../../src/engine/types';
import type {
  AssembledScenario, LocationNode, LocationEdge,
  ScenarioFeatureDefinition, ScenarioItemDefinition,
  CoreSkeleton, CoreSkeletonNode,
} from '../../src/engine/scenario';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const parserData = buildParserLocaleData('fr');

function makeCharacter(inv: string[] = []): CharacterState {
  return {
    name: 'TestBotIntegration',
    className: 'marine',
    stats: { FOR: 5, DEF: 2, AGI: 2, INT: 4, PER: 2, CHA: 2, LCK: 0 },
    hp: 20, maxHp: 20, oxygen: 100,
    inventory: inv,
    equippedWeapon: null, equippedArmor: null,
    conditions: [], durability: {},
    actionsInColdZone: 0, actionsWithoutRest: 0,
  };
}

// Enriched feature definitions
const emergencyLocker: ScenarioFeatureDefinition = {
  id: 'emergency_locker',
  initialState: 'locked',
  featureType: 'container',
  aliases: { fr: ['armoire de secours', 'armoire'], en: ['locker', 'emergency locker'] },
  descriptions: {
    locked: { fr: 'L\'armoire est verrouillée.', en: 'The locker is locked.' },
    open: { fr: 'L\'armoire est ouverte.', en: 'The locker is open.' },
  },
  interactions: [
    {
      trigger: { verb: 'OPEN', requiredState: 'locked', stat: 'FOR', dc: 8 },
      onSuccess: { newState: 'open', revealsItems: ['oxygen_canister'] },
      onFailure: { consequences: [{ type: 'damage', amount: 1, targetId: 'player' }] },
    },
    {
      trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 6 },
      onSuccess: { newState: 'open', revealsItems: ['oxygen_canister'] },
    },
  ],
};

const statusTerminal: ScenarioFeatureDefinition = {
  id: 'status_terminal',
  featureType: 'terminal',
  aliases: { fr: ['terminal', 'console'], en: ['terminal'] },
  readableContent: { fr: 'JOURNAL: SYSTÈMES NOMINAUX.', en: 'LOG: SYSTEMS NOMINAL.' },
  interactions: [
    {
      trigger: { verb: 'READ', dc: null },
      onSuccess: { narrative: { fr: 'JOURNAL: SYSTÈMES NOMINAUX.', en: 'LOG: SYSTEMS NOMINAL.' } },
    },
  ],
};

const securityPanel: ScenarioFeatureDefinition = {
  id: 'security_panel',
  featureType: 'panel',
  aliases: { fr: ['panneau de sécurité', 'panneau'], en: ['security panel', 'panel'] },
  interactions: [
    {
      trigger: { verb: 'USE', requiredItem: 'access_keycard', dc: null },
      onSuccess: { flagSet: 'bulkhead_unlocked', revealsExit: 'next_location' },
    },
  ],
};

const ventCover: ScenarioFeatureDefinition = {
  id: 'vent_cover',
  featureType: 'vent',
  aliases: { fr: ['grille de ventilation', 'grille'], en: ['vent cover', 'vent'] },
  interactions: [
    {
      trigger: { verb: 'OPEN', dc: null },
      onSuccess: { newState: 'open', revealsExit: 'vent_passage' },
    },
  ],
};

const oxygenCanister: ScenarioItemDefinition = {
  id: 'oxygen_canister',
  itemType: 'consumable',
  aliases: { fr: ['bouteille d\'oxygène', 'oxygène'], en: ['oxygen canister', 'oxygen'] },
  revealedBy: { featureId: 'emergency_locker', requiredState: 'open' },
};

// Build a minimal skeleton satisfying the CoreSkeleton type
function makeMinimalSkeleton(): CoreSkeleton {
  const makeNode = (id: CoreSkeletonNode['id'], beat: CoreSkeletonNode['beat']): CoreSkeletonNode => ({
    id,
    role: 'entry' as const,
    beat,
    tension: 1,
    descriptionKey: { fr: 'Nœud', en: 'Node' },
  });
  return {
    id: 'test_skeleton',
    nameKey: { fr: 'Test', en: 'Test' },
    descriptionKey: { fr: 'Test skeleton', en: 'Test skeleton' },
    nodes: [
      makeNode('start', 'intro'),
      makeNode('unlock', 'rising'),
      makeNode('reveal', 'midpoint'),
      makeNode('escalation', 'escalation'),
      makeNode('boss', 'climax'),
      makeNode('resolution', 'resolution'),
    ],
    gateItem: 'access_keycard',
    gateItemLocation: 'start',
    revelation: { fr: 'Révélation', en: 'Revelation' },
    escalationTrigger: { fr: 'Escalade', en: 'Escalation' },
    bossType: 'combat',
    primaryVictory: { type: 'reach_location', locationId: 'resolution_loc' },
    alternativeVictory: { type: 'self_destruct' },
    nodeLocations: {
      start: { locationRole: 'entry', items: [], features: [], exits: [] },
      unlock: { locationRole: 'gate', items: [], features: [], exits: [] },
      reveal: { locationRole: 'midpoint', items: [], features: [], exits: [] },
      escalation: { locationRole: 'escalation', items: [], features: [], exits: [] },
      boss: { locationRole: 'climax', items: [], features: [], exits: [] },
      resolution: { locationRole: 'epilogue', items: [], features: [], exits: [] },
    },
  } as unknown as CoreSkeleton;
}

function makeScenarioWithNode(
  features: ScenarioFeatureDefinition[],
  items: ScenarioItemDefinition[],
): AssembledScenario {
  const startNode: LocationNode = {
    id: 'loc_start',
    nameKey: { fr: 'Salle de départ', en: 'Start Room' },
    role: 'entry',
    beat: 'intro',
    tension: 1,
    isCoreNode: true,
    coreNodeId: 'start',
    onCriticalPath: true,
    atmosphere: 'pressurized',
    features: features as unknown as import('../../src/engine/scenario').FeatureDefinition[],
    items: items as unknown as import('../../src/engine/scenario').ItemDefinition[],
  };

  const edges: LocationEdge[] = [];
  const skeleton = makeMinimalSkeleton();

  return {
    skeleton,
    modules: [],
    graph: { nodes: [startNode], edges },
    setting: {
      id: 'test_setting',
      nameKey: { fr: 'Test', en: 'Test' },
      categories: ['facility'],
      supportedRoles: ['entry'],
      locationNames: { entry: [{ fr: 'Salle de départ', en: 'Start Room' }] },
      features: [],
      preferredItems: [],
    },
    sessionLength: 'quick',
  };
}

function makeGameStateWithScenario(
  features: ScenarioFeatureDefinition[],
  items: ScenarioItemDefinition[],
  inv: string[] = [],
): GameState {
  const scenario = makeScenarioWithNode(features, items);
  const base = createInitialGameState();

  // Build initial featureStates
  const featureStates: Record<string, string> = {};
  for (const f of features) {
    if (f.initialState) featureStates[f.id] = f.initialState;
  }

  return {
    ...base,
    phase: 'playing',
    character: makeCharacter(inv),
    scenario,
    playerLocationId: 'loc_start',
    visitedLocations: { loc_start: { firstVisited: 0, visitCount: 1, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
    featureStates,
  };
}

// Always-success RNG (rolls max on D20 → natural 20)
const alwaysSucceedRng = () => 0.9999;
// Always-fail RNG (rolls 1 on D20 → natural 1)
const alwaysFailRng = () => 0.0001;

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------

describe('Chantier 1 Integration: scenario interactions', () => {

  it('1. OPEN locked container (success) → items revealed', () => {
    const state = makeGameStateWithScenario([emergencyLocker], [oxygenCanister]);
    // Verify locker starts locked
    expect(getFeatureState(state, 'emergency_locker')).toBe('locked');

    // Run interaction via processTurn with "ouvrir armoire" and always-success RNG
    const context = getSceneContext(state);
    const result = processTurn(state, 'ouvrir armoire', context, parserData, alwaysSucceedRng);
    const newState = result.newState;

    expect(getFeatureState(newState, 'emergency_locker')).toBe('open');
    expect(newState.revealedItems['oxygen_canister']).toBe(true);
  });

  it('2. Feature state persists across turns', () => {
    const state = makeGameStateWithScenario([emergencyLocker], [oxygenCanister]);
    const ctx1 = getSceneContext(state);
    const afterOpen = processTurn(state, 'ouvrir armoire', ctx1, parserData, alwaysSucceedRng).newState;

    expect(getFeatureState(afterOpen, 'emergency_locker')).toBe('open');

    // Examine on next turn — state should still be 'open'
    const ctx2 = getSceneContext(afterOpen);
    const afterExamine = processTurn(afterOpen, 'examiner armoire', ctx2, parserData, alwaysSucceedRng).newState;
    expect(getFeatureState(afterExamine, 'emergency_locker')).toBe('open');
  });

  it('3. Use item on target → flag set', () => {
    const state = makeGameStateWithScenario([securityPanel], [], ['access_keycard']);
    const context = getSceneContext(state);
    const result = processTurn(state, 'utiliser badge sur panneau', context, parserData, alwaysSucceedRng);
    expect(hasScenarioFlag(result.newState, 'bulkhead_unlocked')).toBe(true);
  });

  it('4. Read terminal → narrative override from interaction', () => {
    const state = makeGameStateWithScenario([statusTerminal], []);
    const context = getSceneContext(state);
    const result = processTurn(state, 'lire terminal', context, parserData, alwaysSucceedRng);
    // Narrative override should contain the log text
    expect(result.narrative).toContain('JOURNAL');
  });

  it('5. Revealed item becomes visible after container opened', () => {
    const state = makeGameStateWithScenario([emergencyLocker], [oxygenCanister]);

    // Before opening: oxygen_canister should not be in locationItems
    const ctx1 = getSceneContext(state);
    const itemsBefore = ctx1.locationItems.map(i => i.id);
    expect(itemsBefore).not.toContain('oxygen_canister');

    // Open the locker
    const afterOpen = processTurn(state, 'ouvrir armoire', ctx1, parserData, alwaysSucceedRng).newState;

    // After opening: oxygen_canister should appear in locationItems
    const ctx2 = getSceneContext(afterOpen);
    const itemsAfter = ctx2.locationItems.map(i => i.id);
    expect(itemsAfter).toContain('oxygen_canister');
  });

  it('6. Failed interaction applies failure consequences (damage)', () => {
    const state = makeGameStateWithScenario([emergencyLocker], [oxygenCanister]);
    const hpBefore = state.character!.hp;
    const context = getSceneContext(state);
    const result = processTurn(state, 'ouvrir armoire', context, parserData, alwaysFailRng);
    // On failure: locker stays locked, player takes damage
    expect(getFeatureState(result.newState, 'emergency_locker')).toBe('locked');
    expect(result.newState.character!.hp).toBeLessThan(hpBefore);
  });

  it('7. Auto-success interaction reveals exit', () => {
    const state = makeGameStateWithScenario([ventCover], []);
    const context = getSceneContext(state);
    const result = processTurn(state, 'ouvrir grille', context, parserData, alwaysSucceedRng);
    expect(getFeatureState(result.newState, 'vent_cover')).toBe('open');
    expect(isExitUnlocked(result.newState, 'loc_start', 'vent_passage')).toBe(true);
  });

  it('8. Scene.ts resolves enriched feature with properties from featureType', () => {
    const state = makeGameStateWithScenario([emergencyLocker], []);
    const context = getSceneContext(state);
    const lockerFeature = context.environmentFeatures.find(f => f.id === 'emergency_locker');
    expect(lockerFeature).toBeDefined();
    // container featureType should give tangible, metallic, etc.
    expect(lockerFeature!.properties).toContain('tangible');
    // locked state should add 'locked' property
    expect(lockerFeature!.properties).toContain('locked');
  });

  it('9. Scene.ts resolves enriched item with properties from itemType', () => {
    // Make locker already open so oxygen_canister is revealed
    const state = makeGameStateWithScenario([emergencyLocker], [oxygenCanister]);
    const stateWithOpenLocker = {
      ...state,
      featureStates: { emergency_locker: 'open' },
      revealedItems: { oxygen_canister: true },
    };
    const context = getSceneContext(stateWithOpenLocker);
    const itemInScene = context.locationItems.find(i => i.id === 'oxygen_canister');
    expect(itemInScene).toBeDefined();
    // consumable itemType should give tangible, edible/drinkable etc.
    expect(itemInScene!.properties).toContain('tangible');
  });

  it('10. Standard pipeline works for non-enriched targets (no regression)', () => {
    // Use a plain FeatureDefinition (no featureType, no interactions)
    const plainFeature = { id: 'old_panel', initialState: 'intact' as const };
    const state = makeGameStateWithScenario([plainFeature as ScenarioFeatureDefinition], []);
    const context = getSceneContext(state);

    // Should not throw, should run standard pipeline
    const result = processTurn(state, 'examiner panneau', context, parserData, alwaysSucceedRng);
    expect(result.newState).toBeDefined();
    // Feature state unchanged (no interactions)
    expect(getFeatureState(result.newState, 'old_panel')).toBe('intact');
  });

  it('11. isItemRevealed: item with revealedBy is not visible until state matches', () => {
    const state = makeGameStateWithScenario([emergencyLocker], [oxygenCanister]);
    const enriched = oxygenCanister;
    // Initially locked — not revealed
    expect(isItemRevealed(state, enriched)).toBe(false);
    // After unlock
    const opened = { ...state, featureStates: { emergency_locker: 'open' } };
    expect(isItemRevealed(opened, enriched)).toBe(true);
  });

  it('12. enriched feature aliases are recognized by parser (via scene context)', () => {
    const state = makeGameStateWithScenario([emergencyLocker], []);
    const context = getSceneContext(state);
    // The enriched locker should appear in environment features
    const lockerFeature = context.environmentFeatures.find(f => f.id === 'emergency_locker');
    expect(lockerFeature).toBeDefined();
    // Aliases should include the FR aliases from the definition
    expect(lockerFeature!.aliases).toContain('armoire de secours');
  });
});
