// ---------------------------------------------------------------------------
// tests/unit/engine/regressions.test.ts — Named regression tests
// NEVER DELETE entries from this file. Add new ones when bugs are fixed.
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { normalizeInput, matchVerb, parseAction } from '../../../src/engine/parser';
import { resolveTargets } from '../../../src/engine/resolver';
import { buildParserLocaleData, buildObstacleVerbMap } from '../../../src/content/parserData';
import type { SceneContext, NpcInstance, EnvironmentFeatureInstance, GameState, ResolvedTarget } from '../../../src/engine/types';
import type { VerbId } from '../../../src/engine/verbs';
import type { PropertyId } from '../../../src/engine/properties';
import { MOVEMENT_VERBS } from '../../../src/engine/verbs';
import { buildConsequences, applyConsequences } from '../../../src/engine/consequences';
import { findItemUseOn, applyInteractionOutcome } from '../../../src/engine/interactionResolver';
import { isEnrichedItem } from '../../../src/engine/scenario';
import { BALANCE } from '../../../src/engine/constants';
import { getFeatureDescription } from '../../../src/engine/featureState';
import { makeEntityState } from '../../../src/engine/entityState';
import { ACTION_TEMPLATES } from '../../../src/content/templates/actionTemplates';
import { ITEM_DEFINITIONS } from '../../../src/content/items';
import { ATMOSPHERE_SNIPPETS } from '../../../src/content/templates/atmosphere';
import { THREAT_HINT_SNIPPETS } from '../../../src/content/templates/threats';
import { createSeededRng } from '../../../src/engine/rng';
import { getSkeletonById } from '../../../src/content/scenarios';
import { ALL_MODULES } from '../../../src/content/scenarios/modules';
import { assembleScenario } from '../../../src/engine/pacing';
import { initGame } from '../../../src/engine/game';
import { getSceneContext } from '../../../src/engine/scene';
import { processTurn } from '../../../src/engine/processTurn';
import { isObstacleResolved } from '../../../src/engine/backtracking';
import { detectGrammar } from '../../../src/narration/index';
import { t } from '../../../src/i18n';

const localeData = buildParserLocaleData('fr');

/**
 * These regressions were written against `resolveTarget`, which returned one
 * value for three different answers. Decision N split it; the helper keeps the
 * original assertions readable by flattening "resolved" back to a target.
 */
function resolveTarget(
  tokens: readonly string[],
  verb: VerbId,
  context: SceneContext,
  genericNpcRefs?: ReadonlySet<string>,
  batchTakeTokens?: ReadonlySet<string>,
  forms?: ReadonlyMap<string, VerbId>,
): ResolvedTarget | null {
  const resolution = resolveTargets(tokens, verb, context, genericNpcRefs, batchTakeTokens, forms);
  return resolution.kind === 'resolved' ? resolution.target : null;
}

function makeNpc(id: string, aliases: string[], props: PropertyId[] = []): NpcInstance {
  return { id, definitionId: id, nameKey: `npc.${id}`, aliases, properties: props, hp: 10 };
}

function makeFeature(id: string, aliases: string[], props: PropertyId[] = []): EnvironmentFeatureInstance {
  return { id, definitionId: id, nameKey: `env.${id}`, aliases, properties: props };
}

function makeContext(overrides: Partial<SceneContext> = {}): SceneContext {
  return {
    inventory: [], locationItems: [], npcs: [], environmentFeatures: [],
    connectedLocations: [], suggestions: [], environmentConditions: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// REG-001: "attaquer" parsed as TIE instead of STRIKE
// Filed: 2026-02-21 | Fixed: 2026-02-21 | parser.ts CURATED_FORMS
// ---------------------------------------------------------------------------
describe('REG-001: attaquer → STRIKE not TIE', () => {
  test('matchVerb("attaquer") → STRIKE via strategy ≤ 2', () => {
    const result = matchVerb(['attaquer'], ['attaquer'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.strategy).toBe(1);
  });

  test('parseAction("attaquer le robot") verb → STRIKE', () => {
    const ctx = makeContext({ npcs: [makeNpc('security_robot', ['robot'], ['robotic'] as PropertyId[])] });
    const result = parseAction('attaquer le robot', ctx, localeData);
    expect('verb' in result && result.verb).toBe('STRIKE');
  });
});

// ---------------------------------------------------------------------------
// REG-002: Environment targets resolved as NPCs via short/prefix alias match
// Filed: 2026-02-21 | Fixed: 2026-02-21 | resolver.ts tokenMatchScore + NPC threshold
// ---------------------------------------------------------------------------
describe('REG-002: environment vs NPC disambiguation', () => {
  const ai = makeNpc('station_ai', ['ia', 'intelligence', 'ordinateur'], []);
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['robotic'] as PropertyId[]);
  const camera = makeFeature('security_camera', ['camera', 'securite', 'surveillance'], []);
  const airlock = makeFeature('main_airlock', ['airlock', 'sas', 'ecluse'], ['metallic'] as PropertyId[]);

  test('"airlock" resolves to main_airlock, not station_ai (short alias "ai" substring bug)', () => {
    const ctx = makeContext({ npcs: [ai], environmentFeatures: [airlock] });
    const result = resolveTarget(['airlock'], 'OPEN', ctx);
    expect(result?.id).toBe('main_airlock');
    expect(result?.source).toBe('environment');
  });

  test('"camera securite" resolves to security_camera, not security_robot (prefix "secu" bug)', () => {
    const ctx = makeContext({ npcs: [robot], environmentFeatures: [camera] });
    const result = resolveTarget(['camera', 'securite'], 'EXAMINE', ctx);
    expect(result?.id).toBe('security_camera');
    expect(result?.source).toBe('environment');
  });
});

// ---------------------------------------------------------------------------
// REG-003: Body-part targeting yields whole NPC instead of virtual part
// Filed: 2026-02-21 | Fixed: 2026-02-21 | resolver.ts priority order (body parts before NPCs)
// ---------------------------------------------------------------------------
describe('REG-003: body-part targeting resolves to virtual part', () => {
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['robotic', 'metallic'] as PropertyId[]);
  const xenomorph = makeNpc('xenomorph', ['alien', 'creature'], ['organic'] as PropertyId[]);
  const headDef = {
    id: 'head', nameKey: 'bodypart.head' as const,
    aliases: ['tete', 'crane'], baseProperties: ['fragile'] as PropertyId[],
  };
  const clawDef = {
    id: 'claw', nameKey: 'bodypart.claw' as const,
    aliases: ['griffe', 'serre'], baseProperties: ['sharp', 'bladed'] as PropertyId[],
  };
  const ctx = makeContext({ npcs: [robot, xenomorph], bodyParts: [headDef, clawDef] });

  test('"tete robot" → security_robot_head (not whole security_robot)', () => {
    const result = resolveTarget(['tete', 'robot'], 'STRIKE', ctx);
    expect(result?.id).toBe('security_robot_head');
    expect(result?.source).toBe('npc_part');
    expect(result?.isVirtual).toBe(true);
  });

  test('"griffe alien" → xenomorph_claw (not whole xenomorph)', () => {
    const result = resolveTarget(['griffe', 'alien'], 'CUT', ctx);
    expect(result?.id).toBe('xenomorph_claw');
    expect(result?.source).toBe('npc_part');
  });
});

// ---------------------------------------------------------------------------
// REG-004: Long/repeated token input causes >50ms parse time
// Filed: 2026-02-21 | Fixed: 2026-02-21 | parser.ts normalizeInput dedup+cap
// ---------------------------------------------------------------------------
describe('REG-004: normalizeInput deduplicates and caps tokens', () => {
  test('1000 repetitions of "robot" deduplicate to 1 token', () => {
    const tokens = normalizeInput('frapper ' + 'robot '.repeat(1000));
    const robotCount = tokens.filter((t) => t === 'robot').length;
    expect(robotCount).toBe(1);
    expect(tokens.length).toBeLessThanOrEqual(30);
  });

  test('50 distinct tokens are capped at 30', () => {
    const words = Array.from({ length: 50 }, (_, i) => `mot${String(i).padStart(2, '0')}`).join(' ');
    const tokens = normalizeInput(words);
    expect(tokens.length).toBeLessThanOrEqual(30);
  });
});

// ---------------------------------------------------------------------------
// REG-005: "je donne un coup de couteau" → GIVE instead of CUT/STRIKE
// Filed: 2026-07-18 | Fixed: 2026-07-18 | i18n compound patterns
// ---------------------------------------------------------------------------
describe('REG-005: "donne un coup de couteau" → CUT compound', () => {
  const alien = makeNpc('xenomorph', ['alien', 'creature'], ['organic', 'hostile'] as PropertyId[]);
  const knife = {
    id: 'knife', nameKey: 'item.knife', properties: ['metallic', 'sharp', 'bladed', 'small'] as PropertyId[],
    isVirtual: false as const, source: 'inventory' as const, aliases: ['couteau'],
  };
  const ctx = makeContext({ npcs: [alien], inventory: [knife] });

  test('matchVerb detects compound "donne+coup+couteau" → CUT', () => {
    const fullTokens = ['je', 'donne', 'un', 'coup', 'de', 'couteau'];
    const tokens = ['donne', 'coup', 'couteau'];
    const result = matchVerb(tokens, fullTokens, localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('CUT');
    expect(result?.isCompound).toBe(true);
  });

  test('matchVerb detects compound "donne+coup" → STRIKE', () => {
    const fullTokens = ['je', 'donne', 'un', 'coup'];
    const tokens = ['donne', 'coup'];
    const result = matchVerb(tokens, fullTokens, localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.isCompound).toBe(true);
  });

  test('parseAction("je donne un coup de couteau à l\'alien") → verb CUT', () => {
    const result = parseAction("je donne un coup de couteau à l'alien", ctx, localeData);
    expect('verb' in result && result.verb).toBe('CUT');
  });
});

// ---------------------------------------------------------------------------
// REG-006: "j'utilise mon pistolet" → USE instead of SHOOT (verb promotion)
// Filed: 2026-07-18 | Fixed: 2026-07-18 | parser.ts promoteVerb()
// ---------------------------------------------------------------------------
describe('REG-006: USE + ranged weapon → SHOOT promotion', () => {
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['robotic'] as PropertyId[]);
  const pistol = {
    id: 'laser_pistol', nameKey: 'item.laser_pistol',
    properties: ['electronic', 'ranged', 'light_source', 'small'] as PropertyId[],
    isVirtual: false as const, source: 'inventory' as const, aliases: ['pistolet', 'laser'],
  };
  const ctx = makeContext({ npcs: [robot], inventory: [pistol] });

  test('parseAction("j\'utilise mon pistolet") → verb promoted to SHOOT', () => {
    const result = parseAction("j'utilise mon pistolet", ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('SHOOT');
    }
  });

  test('parseAction("utiliser le couteau") → CUT with the knife as instrument', () => {
    // Decision M (2026-09-10) rewrote the second half of this regression.
    // The original fix promoted the verb but left the knife as the *target*, so
    // the player cut their own knife. Promotion now moves the object into the
    // role it plays: the knife is the instrument, the alien is what gets cut.
    const knife = {
      id: 'knife', nameKey: 'item.knife',
      properties: ['metallic', 'sharp', 'bladed', 'small'] as PropertyId[],
      isVirtual: false as const, source: 'inventory' as const, aliases: ['couteau'],
    };
    const alien = makeNpc('xenomorph', ['xenomorphe', 'alien'], ['organic'] as PropertyId[]);
    const ctx2 = makeContext({ inventory: [knife], npcs: [alien] });
    const result = parseAction('utiliser le couteau', ctx2, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('CUT');
      expect(result.tool?.id).toBe('knife');
      expect(result.target?.id).toBe('xenomorph');
    }
  });

  test('parseAction("utiliser le couteau") with nothing to cut stays a plain USE', () => {
    // Rather than invent a victim — or cut the knife, which was the bug.
    const knife = {
      id: 'knife', nameKey: 'item.knife',
      properties: ['metallic', 'sharp', 'bladed', 'small'] as PropertyId[],
      isVirtual: false as const, source: 'inventory' as const, aliases: ['couteau'],
    };
    const ctx2 = makeContext({ inventory: [knife] });
    const result = parseAction('utiliser le couteau', ctx2, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('USE');
      expect(result.target?.id).toBe('knife');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-007: "je lance mon couteau sur le membre d'équipage" → target=knife
// Filed: 2026-07-18 | Fixed: 2026-07-18 | parser.ts splitOnPrepositions()
// ---------------------------------------------------------------------------
describe('REG-007: preposition-aware target resolution', () => {
  const crew = makeNpc('crew_member', ['membre', 'equipage', 'membre equipage'], ['sentient', 'human'] as PropertyId[]);
  const knife = {
    id: 'knife', nameKey: 'item.knife',
    properties: ['metallic', 'sharp', 'bladed', 'small'] as PropertyId[],
    isVirtual: false as const, source: 'inventory' as const, aliases: ['couteau'],
  };
  const ctx = makeContext({ npcs: [crew], inventory: [knife] });

  test('parseAction("je lance mon couteau sur le membre d\'équipage") → target=crew, tool=knife', () => {
    const result = parseAction("je lance mon couteau sur le membre d'équipage", ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('THROW');
      expect(result.target?.id).toBe('crew_member');
      expect(result.tool?.id).toBe('knife');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-008: "je poignarde l'alien" → unrecognized verb
// Filed: 2026-07-18 | Fixed: 2026-07-18 | i18n verb.STRIKE.aliases
// ---------------------------------------------------------------------------
describe('REG-008: "poignarder" recognized as STRIKE', () => {
  const alien = makeNpc('xenomorph', ['alien', 'creature'], ['organic', 'hostile'] as PropertyId[]);
  const ctx = makeContext({ npcs: [alien] });

  test('matchVerb("poignarde") → STRIKE', () => {
    const result = matchVerb(['poignarde'], ['poignarde'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
  });

  test('parseAction("je poignarde l\'alien") → verb STRIKE', () => {
    const result = parseAction("je poignarde l'alien", ctx, localeData);
    expect('verb' in result && result.verb).toBe('STRIKE');
  });
});

// ---------------------------------------------------------------------------
// REG-009: "j'éclaire la pièce" → unrecognized verb
// Filed: 2026-07-18 | Fixed: 2026-07-18 | i18n verb.ACTIVATE.aliases
// ---------------------------------------------------------------------------
describe('REG-009: "éclairer" recognized as ACTIVATE', () => {
  test('matchVerb("eclaire") → ACTIVATE', () => {
    const result = matchVerb(['eclaire'], ['eclaire'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('ACTIVATE');
  });

  test('parseAction("j\'éclaire la pièce") → verb ACTIVATE', () => {
    const ctx = makeContext({
      environmentFeatures: [makeFeature('room', ['piece', 'salle'], [])],
    });
    const result = parseAction("j'éclaire la pièce", ctx, localeData);
    expect('verb' in result && result.verb).toBe('ACTIVATE');
  });
});

// ---------------------------------------------------------------------------
// REG-010: "j'accède au terminal" → unrecognized verb
// Filed: 2026-07-18 | Fixed: 2026-07-18 | i18n verb.HACK.aliases
// ---------------------------------------------------------------------------
describe('REG-010: "accéder" recognized as HACK', () => {
  test('matchVerb("accede") → HACK', () => {
    const result = matchVerb(['accede'], ['accede'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('HACK');
  });

  test('parseAction("j\'accède au terminal") → verb HACK', () => {
    const ctx = makeContext({
      environmentFeatures: [makeFeature('terminal', ['terminal', 'console'], ['electronic', 'programmable'] as PropertyId[])],
    });
    const result = parseAction("j'accède au terminal", ctx, localeData);
    expect('verb' in result && result.verb).toBe('HACK');
  });
});

// ---------------------------------------------------------------------------
// REG-011: "j'utilise le terminal" → incompatibility (terminal lacks 'usable')
// Filed: 2026-07-18 | Fixed: 2026-07-18 | properties.ts TYPE_BASE_PROPERTIES
// ---------------------------------------------------------------------------
describe('REG-011: terminal type has usable property', () => {
  // This test is at the properties level — verifying the fix is in place
  test('terminal type includes usable in base properties', async () => {
    const { TYPE_BASE_PROPERTIES } = await import('../../../src/engine/properties');
    expect(TYPE_BASE_PROPERTIES.environment.terminal).toContain('usable');
  });
});

// ---------------------------------------------------------------------------
// REG-012: "je lui tire dessus" → PULL instead of SHOOT
// Issue: #25 | Filed: 2026-02-25 | Fixed: 2026-02-25
// Root cause: compound SHOOT:tire+dessus was missing; "tire" alone mapped to PULL (first-wins).
// Fix: added SHOOT:tire+dessus / tirer+dessus / tirez+dessus compounds (fr.ts).
// ---------------------------------------------------------------------------
describe('REG-012: "tire dessus" → SHOOT via compound, not PULL', () => {
  const xenomorph = makeNpc('xenomorph', ['xenomorphe', 'alien', 'creature'], ['organic', 'hostile'] as PropertyId[]);
  const ctxWithNpc = makeContext({ npcs: [xenomorph] });

  test('matchVerb detects compound "tire+dessus" → SHOOT', () => {
    const fullTokens = ['je', 'lui', 'tire', 'dessus'];
    const tokens = ['tire', 'dessus'];
    const result = matchVerb(tokens, fullTokens, localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('SHOOT');
    expect(result?.isCompound).toBe(true);
  });

  test('parseAction("je lui tire dessus") → verb SHOOT, target xenomorph', () => {
    const result = parseAction('je lui tire dessus', ctxWithNpc, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('SHOOT');
      expect(result.target?.id).toBe('xenomorph');
    }
  });

  test('parseAction("je tire sur le xenomorphe") → verb SHOOT (existing compound)', () => {
    const result = parseAction('je tire sur le xenomorphe', ctxWithNpc, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('SHOOT');
    }
  });

  // Guard: pulling a physical object must not become SHOOT
  test('parseAction("je tire la poignée") → verb PULL (no compound, first-wins)', () => {
    const door = makeFeature('blast_door', ['porte', 'blindee', 'poignee'], ['metallic'] as PropertyId[]);
    const ctxWithDoor = makeContext({ environmentFeatures: [door] });
    const result = parseAction('je tire la poignée', ctxWithDoor, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('PULL');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-013: "se mettre à couvert" parsed as IGNITE instead of HIDE
// Filed: 2026-02-25 | Fixed: 2026-02-25 | parser.ts S4 multi-word exclusion,
//   i18n/locales/fr.ts HIDE aliases + compound patterns
// ---------------------------------------------------------------------------
describe('REG-013: "se mettre à couvert" → HIDE not IGNITE', () => {
  test('matchVerb detects compound "mettre+couvert" → HIDE', () => {
    const tokens = ['mettre', 'couvert'];
    const fullTokens = ['se', 'mettre', 'a', 'couvert'];
    const result = matchVerb(tokens, fullTokens, localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('HIDE');
  });

  test('parseAction("se mettre à couvert") → verb HIDE', () => {
    const ctx = makeContext();
    const result = parseAction('se mettre à couvert', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('HIDE');
    }
  });

  // Guard: "mettre le feu" must still match IGNITE, not be broken by the fix
  test('parseAction("mettre le feu") → verb IGNITE (compound still works)', () => {
    const crate = makeFeature('crate', ['caisse'], ['flammable'] as PropertyId[]);
    const ctx = makeContext({ environmentFeatures: [crate] });
    const result = parseAction('mettre le feu à la caisse', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('IGNITE');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-014: RUN verb not treated as movement — player stays in same location
// Filed: 2026-02-25 | Fixed: 2026-02-25 | verbs.ts MOVEMENT_VERBS,
//   processTurn.ts step 9a + combat flee movement
// ---------------------------------------------------------------------------
describe('REG-014: RUN is a movement verb', () => {
  test('MOVEMENT_VERBS includes RUN and CLIMB', () => {
    expect(MOVEMENT_VERBS.has('RUN')).toBe(true);
    expect(MOVEMENT_VERBS.has('CLIMB')).toBe(true);
    expect(MOVEMENT_VERBS.has('MOVE_TO')).toBe(true);
  });

  test('parseAction("courir vers le couloir") → verb RUN', () => {
    const corridor = { id: 'corridor', name: 'couloir', aliases: ['couloir', 'corridor'] };
    const ctx = makeContext({ connectedLocations: [corridor] });
    const result = parseAction('courir vers le couloir', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('RUN');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-015: Resolved obstacle still shows initial dark description
// Filed: 2026-02-25 | Fixed: 2026-02-25 | scene.ts buildSceneDescription
//   uses revisitDescription when obstacleResolved
// (Full integration test deferred — unit confirms scene.ts logic)
// ---------------------------------------------------------------------------
describe('REG-015: obstacleResolved uses revisit description', () => {
  test('scene module exports getSceneContext', async () => {
    // Structural check: getSceneContext (which calls buildSceneDescription) exists
    const scene = await import('../../../src/engine/scene');
    expect(typeof scene.getSceneContext).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// REG-016: Medkit self-use falls through to generic D20 instead of auto-heal
// Filed: 2026-02-25 | Fixed: 2026-02-25 | escape.ts medkit_basic useOn 'self',
//   processTurn.ts self-use inventory item path
// ---------------------------------------------------------------------------
describe('REG-016: medkit_basic has useOn self-heal interaction', () => {
  test('medkit_basic in escape skeleton is an enriched item with useOn', async () => {
    const escape = await import('../../../src/content/scenarios/escape');
    const skeleton = escape.ESCAPE_SKELETON;
    // Find medkit_basic in the skeleton's nodeLocations
    let medkit: import('../../../src/engine/scenario').ItemDefinition | undefined;
    for (const loc of Object.values(skeleton.nodeLocations)) {
      const found = (loc as { items: readonly { id: string }[] }).items.find(
        (i: { id: string }) => i.id === 'medkit_basic',
      );
      if (found) { medkit = found as import('../../../src/engine/scenario').ItemDefinition; break; }
    }
    expect(medkit).toBeDefined();
    expect(isEnrichedItem(medkit!)).toBe(true);
  });

  test('findItemUseOn matches medkit self-use and heals on success', () => {
    // Import the medkit definition directly from escape skeleton
    // Build a minimal enriched item for the test
    const medkitDef = {
      id: 'medkit_basic',
      itemType: 'consumable' as const,
      aliases: { fr: ['medkit'], en: ['medkit'] },
      useOn: [{
        targetId: 'self',
        interaction: {
          trigger: { verb: 'USE' as const, dc: null },
          onSuccess: {
            consequences: [{ type: 'heal' as const, targetId: 'player', amount: 4 }],
            consumeItem: true,
          },
        },
      }],
    };

    const match = findItemUseOn('medkit_basic', medkitDef, 'self');
    expect(match).not.toBeNull();
    const result = applyInteractionOutcome(match!, true);
    expect(result.success).toBe(true);
    expect(result.consequences).toEqual([{ type: 'heal', targetId: 'player', amount: 4 }]);
    expect(result.itemToConsume).toBe('medkit_basic');
  });
});

// ---------------------------------------------------------------------------
// REG-017: Generic exploration failure damage can kill at 1 HP
// Filed: 2026-02-25 | Fixed: 2026-02-25 | consequences.ts nonLethal flag,
//   constants.ts FAILURE_DAMAGE/CRIT_FAILURE_DAMAGE
// ---------------------------------------------------------------------------
describe('REG-017: exploration failure damage is nonLethal', () => {
  test('buildConsequences marks failure damage as nonLethal', () => {
    const target = {
      id: 'valve',
      nameKey: 'env.valve',
      properties: ['metallic'] as PropertyId[],
      isVirtual: false,
      source: 'environment' as const,
    };
    const consequences = buildConsequences('REPAIR', target, 'failure');
    const dmg = consequences.find(c => c.type === 'damage');
    expect(dmg).toBeDefined();
    expect(dmg!.nonLethal).toBe(true);
    expect(dmg!.amount).toBe(BALANCE.FAILURE_DAMAGE);
  });

  test('buildConsequences marks crit_failure damage as nonLethal', () => {
    const target = {
      id: 'flood_zone',
      nameKey: 'env.flood_zone',
      properties: ['liquid'] as PropertyId[],
      isVirtual: false,
      source: 'environment' as const,
    };
    const consequences = buildConsequences('MOVE_TO', target, 'crit_failure');
    const dmg = consequences.find(c => c.type === 'damage');
    expect(dmg).toBeDefined();
    expect(dmg!.nonLethal).toBe(true);
    expect(dmg!.amount).toBe(BALANCE.CRIT_FAILURE_DAMAGE);
  });

  test('nonLethal damage cannot reduce HP below 1', () => {
    const state = {
      character: { hp: 1, maxHp: 10, stats: {}, inventory: [], conditions: [] },
      scenario: null,
      difficulty: 'survivor',
    } as unknown as import('../../../src/engine/types').GameState;
    const ctx = makeContext();
    const rng = () => 0.5;
    const result = applyConsequences(
      state,
      [{ type: 'damage', targetId: 'player', amount: 2, nonLethal: true }],
      ctx, rng,
    );
    expect(result.character.hp).toBe(1);
  });

  test('lethal damage (combat) CAN reduce HP to 0', () => {
    const state = {
      character: { hp: 1, maxHp: 10, stats: {}, inventory: [], conditions: [] },
      scenario: null,
      difficulty: 'survivor',
    } as unknown as import('../../../src/engine/types').GameState;
    const ctx = makeContext();
    const rng = () => 0.5;
    const result = applyConsequences(
      state,
      [{ type: 'damage', targetId: 'player', amount: 2, nonLethal: false }],
      ctx, rng,
    );
    expect(result.character.hp).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// REG-009: "armoire médicale" resolved to item.medical_kit instead of env feature
// Filed: 2026-02-25 | Fixed: 2026-02-25 | resolver.ts unified candidate comparison
// ---------------------------------------------------------------------------
describe('REG-009: armoire médicale → env feature, not inventory medical_kit', () => {
  test('resolveTarget prefers env feature over inventory item when env scores higher', () => {
    const ctx = makeContext({
      inventory: [{ id: 'medical_kit', definitionId: 'medical_kit', nameKey: 'item.medical_kit', aliases: ['kit', 'trousse', 'kit médical', 'kit medical', 'trousse médicale', 'trousse medicale', 'trousse de soins', 'kit de soins', 'medkit'], properties: ['medical' as PropertyId, 'consumable' as PropertyId], quantity: 1 }],
      environmentFeatures: [makeFeature('medical_cabinet', ['armoire', 'armoire medicale', 'placard medical', 'meuble medical'], ['openable' as PropertyId, 'container' as PropertyId])],
    });
    const result = resolveTarget(['armoire', 'medicale'], 'EXAMINE', ctx);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('medical_cabinet');
  });
});

// ---------------------------------------------------------------------------
// REG-010: Container still described as "scellé" after OPEN
// Filed: 2026-02-25 | Fixed: 2026-02-25 | featureState.ts + processTurn.ts
// ---------------------------------------------------------------------------
describe('REG-010: getFeatureDescription returns open-state text after state change', () => {
  test('supply_container shows different text for locked vs open', () => {
    // Simulate a basic feature with descriptions
    const featureDef = {
      id: 'supply_container',
      descriptions: {
        locked: { fr: 'Un conteneur scellé.', en: '' },
        open: { fr: 'Le conteneur est ouvert.', en: '' },
      },
    };
    const lockedText = getFeatureDescription(featureDef, makeEntityState('locked'), 'fr');
    const openText = getFeatureDescription(featureDef, makeEntityState('open'), 'fr');
    expect(lockedText).toContain('scellé');
    expect(openText).toContain('ouvert');
    expect(lockedText).not.toBe(openText);
  });
});

// ---------------------------------------------------------------------------
// REG-011: No READ templates exist (falls to tech category fallback)
// Filed: 2026-02-25 | Fixed: 2026-02-25 | actionTemplates.ts READ_TEMPLATES
// ---------------------------------------------------------------------------
describe('REG-011: READ templates exist for all outcomes', () => {
  test('ACTION_TEMPLATES includes READ templates for key outcomes', () => {
    const readTemplates = ACTION_TEMPLATES.filter(t => t.verb === 'READ');
    expect(readTemplates.length).toBeGreaterThanOrEqual(10);
    const outcomes = new Set(readTemplates.map(t => t.outcome));
    expect(outcomes.has('success')).toBe(true);
    expect(outcomes.has('failure')).toBe(true);
    expect(outcomes.has('auto_success')).toBe(true);
    expect(outcomes.has('crit_success')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// REG-012: USE on NPC shows "batterie morte" (tech-device narration)
// Filed: 2026-02-25 | Fixed: 2026-02-25 | actionTemplates.ts alive USE templates
// ---------------------------------------------------------------------------
describe('REG-012: USE templates with alive targetType exist', () => {
  test('ACTION_TEMPLATES includes USE templates with alive targetType', () => {
    const aliveUseTemplates = ACTION_TEMPLATES.filter(
      t => t.verb === 'USE' && t.targetType === 'alive'
    );
    expect(aliveUseTemplates.length).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// REG-013: Atmosphere/threat snippet pools too small for anti-repetition
// Filed: 2026-02-25 | Fixed: 2026-02-25 | atmosphere.ts, threats.ts expanded
// ---------------------------------------------------------------------------
describe('REG-013: expanded atmosphere and threat snippet pools', () => {
  test('each setting has ≥7 atmosphere snippets per tension tier (low/mid/high)', () => {
    for (const setting of ['derelict_ship', 'alien_ruins', 'space_station'] as const) {
      for (const tier of ['low', 'mid', 'high'] as const) {
        const pool = ATMOSPHERE_SNIPPETS.filter(
          s => s.setting === setting && s.tensionTier === tier
        );
        expect(pool.length, `${setting}/${tier}`).toBeGreaterThanOrEqual(7);
      }
    }
  });

  test('each beat has ≥6 threat hint snippets', () => {
    for (const beat of ['intro', 'rising', 'midpoint', 'escalation', 'climax', 'resolution'] as const) {
      const pool = THREAT_HINT_SNIPPETS.filter(
        s => s.beat === beat
      );
      expect(pool.length, `beat:${beat}`).toBeGreaterThanOrEqual(6);
    }
  });
});

// ---------------------------------------------------------------------------
// REG-018: PUSH on env.blocked_door succeeds but obstacle not resolved
// Filed: 2026-03-03 | Issue #47 | processTurn.ts — feature-obstacle intercept
// The obstacle path intercept only existed inside the activeCombat block
// (Issue #49 NPC-obstacle). Feature-type obstacles like blocked_door fell
// through to the generic D20 path which used a wrong DC and never marked
// the obstacle resolved nor changed the feature state.
// ---------------------------------------------------------------------------
describe('REG-018: PUSH on blocked_door resolves obstacle (Issue #47)', () => {
  test('successful PUSH on blocked_door marks obstacle resolved and feature open', () => {
    // Use the exact seed from Issue #47
    const rng = createSeededRng(1541823379);
    const skeleton = getSkeletonById('rescue')!;
    const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
    let state = initGame(scenario, 'marine', 'explorer', 'Joueur', rng);
    const parserData = buildParserLocaleData('fr');

    // Turn 1: move to the location with the blocked door
    const ctx1 = getSceneContext(state);
    const r1 = processTurn(state, 'aller passage de membranes', ctx1, parserData, rng);
    state = r1.newState;

    // Verify we are at a location with the blocked_door obstacle
    expect(state.playerLocationId).not.toBeNull();
    const currentNode = state.scenario!.graph.nodes.find(
      n => n.id === state.playerLocationId,
    );
    expect(currentNode?.obstacle?.targetId).toBe('blocked_door');

    // Turn 2: push the blocked door
    const ctx2 = getSceneContext(state);
    const r2 = processTurn(state, 'pousser Porte bloquée', ctx2, parserData, rng);
    state = r2.newState;

    // The obstacle path DC anchors the base (12); context modifiers still
    // apply on top, so the effective DC is not the raw authored number.
    expect(r2.trace.difficultyBreakdown?.base).toBe(12);
    expect(r2.trace.effectiveDC).toBeGreaterThan(0);
    // Stat should be FOR (the force path stat)
    expect(r2.trace.statId).toBe('FOR');

    // If the roll succeeded, the obstacle must be resolved and feature state 'open'
    if (r2.trace.outcome === 'success' || r2.trace.outcome === 'crit_success') {
      const vs = state.visitedLocations[state.playerLocationId!];
      expect(vs?.obstacleResolved).toBe(true);
      // Feature state should be 'open'
      const featureStates = state.featureStates ?? {};
      expect(featureStates['blocked_door']?.openness).toBe('open');
    }
  });

  test('feature-obstacle path anchors the DC on the authored value', () => {
    // Use the exact seed from Issue #47 — verifies the base comes from the
    // obstacle definition (12 for the 'force' path) rather than BASE_DIFFICULTY.
    const rng = createSeededRng(1541823379);
    const skeleton = getSkeletonById('rescue')!;
    const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
    let state = initGame(scenario, 'marine', 'explorer', 'Joueur', rng);
    const parserData = buildParserLocaleData('fr');

    // Move to the blocked door location
    const ctx1 = getSceneContext(state);
    const r1 = processTurn(state, 'aller passage de membranes', ctx1, parserData, rng);
    state = r1.newState;

    // Verify the obstacle exists
    const node = state.scenario!.graph.nodes.find(n => n.id === state.playerLocationId);
    const forcePath = node?.obstacle?.paths.find(p => p.id === 'force');
    expect(forcePath).toBeDefined();
    expect(forcePath!.dc).toBe(12);

    // Push the door — the base must come from the obstacle path, and the
    // difficulty preset must still reach it (decision Z, constat P6-5).
    const ctx2 = getSceneContext(state);
    const r2 = processTurn(state, 'pousser Porte bloquée', ctx2, parserData, rng);
    expect(r2.trace.difficultyBreakdown?.base).toBe(12);
    expect(r2.trace.difficultyBreakdown?.difficultyPresetMod).toBe(-2);
    expect(r2.trace.statId).toBe('FOR');
  });
});

// ---------------------------------------------------------------------------
// REG-019: Unresolved obstacles must block movement to unvisited locations
// Filed: 2026-03-03 | scene.ts, processTurn.ts — obstacle gate
// Obstacles were purely cosmetic: getSceneContext() showed all exits and
// processTurn() allowed unconditional movement. Now:
// - getSceneContext() hides unvisited exits when obstacle is unresolved
// - processTurn() blocks movement to unvisited locations through obstacles
// - Backtracking to already-visited locations is always allowed
// ---------------------------------------------------------------------------
describe('REG-019: Obstacles block movement to unvisited locations', () => {
  test('getSceneContext hides unvisited exits when obstacle is unresolved', () => {
    const rng = createSeededRng(1541823379);
    const skeleton = getSkeletonById('rescue')!;
    const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
    let state = initGame(scenario, 'marine', 'explorer', 'Joueur', rng);
    const parserData = buildParserLocaleData('fr');

    // Move to the location with the blocked_door obstacle
    const ctx1 = getSceneContext(state);
    const r1 = processTurn(state, 'aller passage de membranes', ctx1, parserData, rng);
    state = r1.newState;

    // Confirm we are at a node with an obstacle
    const node = state.scenario!.graph.nodes.find(n => n.id === state.playerLocationId);
    expect(node?.obstacle).toBeDefined();
    expect(isObstacleResolved(state.visitedLocations[state.playerLocationId!])).toBe(false);

    // Scene context should only show visited (backtrack) exits, not unvisited forward exits
    const ctx2 = getSceneContext(state);
    const connectedIds = ctx2.connectedLocations.map(l => l.id);
    for (const loc of connectedIds) {
      // Every shown exit should be an already-visited location
      expect(state.visitedLocations[loc]).toBeDefined();
    }
  });

  test('processTurn blocks movement to unvisited location through obstacle (defense-in-depth)', () => {
    const rng = createSeededRng(1541823379);
    const skeleton = getSkeletonById('rescue')!;
    const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
    let state = initGame(scenario, 'marine', 'explorer', 'Joueur', rng);
    const parserData = buildParserLocaleData('fr');

    // Move to the obstacle location
    const ctx1 = getSceneContext(state);
    const r1 = processTurn(state, 'aller passage de membranes', ctx1, parserData, rng);
    state = r1.newState;

    // Find an unvisited connected location (a forward exit beyond the obstacle)
    const allEdges = state.scenario!.graph.edges.filter(
      e => e.from === state.playerLocationId || e.to === state.playerLocationId,
    );
    const unvisitedNeighbor = allEdges
      .map(e => e.from === state.playerLocationId ? e.to : e.from)
      .find(id => !state.visitedLocations[id]);

    if (unvisitedNeighbor) {
      // Get the node for the unvisited neighbor
      const neighborNode = state.scenario!.graph.nodes.find(n => n.id === unvisitedNeighbor);
      expect(neighborNode).toBeDefined();

      // Build a context that artificially includes the hidden exit.
      // This simulates defense-in-depth: scene filter is layer 1, engine block is layer 2.
      const ctx2 = getSceneContext(state);
      const spoofedCtx: SceneContext = {
        ...ctx2,
        connectedLocations: [
          ...ctx2.connectedLocations,
          { id: unvisitedNeighbor, aliases: [neighborNode!.id], visited: false },
        ],
      };
      const r2 = processTurn(state, `aller ${neighborNode!.id}`, spoofedCtx, parserData, rng);

      // Movement should be blocked — player stays at the same location
      expect(r2.newState.playerLocationId).toBe(state.playerLocationId);
      expect(r2.trace.movementBlocked).toBe(true);
    }
  });

  test('backtracking to visited location is allowed even with unresolved obstacle', () => {
    const rng = createSeededRng(1541823379);
    const skeleton = getSkeletonById('rescue')!;
    const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
    let state = initGame(scenario, 'marine', 'explorer', 'Joueur', rng);
    const parserData = buildParserLocaleData('fr');

    // Remember the start location
    const startLocationId = state.playerLocationId;

    // Move to the obstacle location
    const ctx1 = getSceneContext(state);
    const r1 = processTurn(state, 'aller passage de membranes', ctx1, parserData, rng);
    state = r1.newState;
    const obstacleLocationId = state.playerLocationId;

    // Obstacle should be unresolved
    expect(isObstacleResolved(state.visitedLocations[obstacleLocationId!])).toBe(false);

    // Backtrack to the start location (which IS visited)
    const ctx2 = getSceneContext(state);
    // The start location should appear in connected locations
    const startVisible = ctx2.connectedLocations.some(l => l.id === startLocationId);
    expect(startVisible).toBe(true);

    // Actually attempt to move back - should succeed
    const r2 = processTurn(state, `aller ${startLocationId}`, ctx2, parserData, rng);
    expect(r2.newState.playerLocationId).toBe(startLocationId);
    // movementBlocked should NOT be set
    expect(r2.trace.movementBlocked).not.toBe(true);
  });

  test('after resolving obstacle, forward exits become available', () => {
    const rng = createSeededRng(42);
    const skeleton = getSkeletonById('rescue')!;
    const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
    let state = initGame(scenario, 'marine', 'explorer', 'Joueur', rng);
    const parserData = buildParserLocaleData('fr');

    // Move to the obstacle location
    const ctx1 = getSceneContext(state);
    const r1 = processTurn(state, 'aller passage de membranes', ctx1, parserData, rng);
    state = r1.newState;

    const obstacleNode = state.scenario!.graph.nodes.find(n => n.id === state.playerLocationId);
    if (!obstacleNode?.obstacle) return; // skip if this seed doesn't produce an obstacle node

    // Count exits before resolving
    const ctxBefore = getSceneContext(state);
    const exitsBefore = ctxBefore.connectedLocations.length;

    // Try to resolve the obstacle multiple times until success
    for (let i = 0; i < 10; i++) {
      if (isObstacleResolved(state.visitedLocations[state.playerLocationId!])) break;
      const ctx = getSceneContext(state);
      const r = processTurn(state, 'pousser la porte', ctx, parserData, rng);
      state = r.newState;
    }

    // If obstacle is now resolved, forward exits should be available
    if (isObstacleResolved(state.visitedLocations[state.playerLocationId!])) {
      const ctxAfter = getSceneContext(state);
      expect(ctxAfter.connectedLocations.length).toBeGreaterThanOrEqual(exitsBefore);
    }
  });
});

// ---------------------------------------------------------------------------
// REG-020: NPC-obstacle intercept — targeting an NPC that is an obstacle targetId
// Filed: 2026-03-03 | Fixed: 2026-03-03 | processTurn.ts feature-obstacle intercept extended
// When an obstacle's targetId is an NPC (e.g. malfunctioning_android), actions on that
// NPC should trigger obstacle path matching, and on success, neutralize the NPC.
// ---------------------------------------------------------------------------
describe('REG-020: NPC-obstacle intercept resolves obstacle and neutralizes NPC', () => {
  // Map from VerbId to a French verb the parser will understand
  const VERB_ID_TO_FRENCH: Record<string, string> = {
    USE: 'utiliser',
    TALK: 'parler',
    PERSUADE: 'persuader',
    CALM: 'calmer',
    INTIMIDATE: 'intimider',
    STRIKE: 'attaquer',
    SHOOT: 'tirer',
    HACK: 'pirater',
    EXAMINE: 'examiner',
    SEARCH: 'chercher',
    RUN: 'fuir',
    ACTIVATE: 'activer',
    DECEIVE: 'bluffer',
    THROW: 'lancer',
    DISTRACT: 'distraire',
  };

  // Create a minimal scenario with exactly one NPC-obstacle node
  function createNpcObstacleScenario(): ReturnType<typeof assembleScenario> {
    const rng = createSeededRng(20260303);
    const skeleton = getSkeletonById('investigate')!;
    return assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
  }

  function findNpcObstacleNode(scenario: ReturnType<typeof assembleScenario>): {
    nodeId: string;
    npcId: string;
    obstacle: { targetId: string; paths: Array<{ stat: string; dc: number; verbs: string[] }> };
  } | undefined {
    for (const node of scenario.graph.nodes) {
      if (node.obstacle && node.npcs?.some(n => n.id === node.obstacle!.targetId)) {
        return { nodeId: node.id, npcId: node.obstacle.targetId, obstacle: node.obstacle };
      }
    }
    return undefined;
  }

  test('action on NPC-obstacle target triggers obstacle path matching', () => {
    const scenario = createNpcObstacleScenario();
    const npcObstacle = findNpcObstacleNode(scenario);
    if (!npcObstacle) return; // Skip if this scenario doesn't have an NPC obstacle

    let state = initGame(scenario, 'engineer', 'explorer', 'Technicien', createSeededRng(20260303));
    const parserData = buildParserLocaleData('fr');
    const obstacleVerbMap = buildObstacleVerbMap('fr');

    // Teleport player to the NPC-obstacle node
    state = { ...state, playerLocationId: npcObstacle.nodeId };
    // Initialize visit state
    state = {
      ...state,
      visitedLocations: {
        ...state.visitedLocations,
        [npcObstacle.nodeId]: { obstacleResolved: false, itemsTaken: [], featuresChanged: {} },
      },
    };

    // Find a path whose verb can be mapped to a French parser verb
    let matchedPath: typeof npcObstacle.obstacle.paths[number] | undefined;
    let frenchVerb: string | undefined;
    for (const path of npcObstacle.obstacle.paths) {
      for (const v of path.verbs) {
        const verbId = obstacleVerbMap.get(v.toLowerCase());
        if (verbId && VERB_ID_TO_FRENCH[verbId]) {
          matchedPath = path;
          frenchVerb = VERB_ID_TO_FRENCH[verbId];
          break;
        }
      }
      if (matchedPath) break;
    }

    if (!matchedPath || !frenchVerb) return; // Skip if no usable path found

    const ctx = getSceneContext(state);
    const result = processTurn(state, `${frenchVerb} ${npcObstacle.npcId}`, ctx, parserData, createSeededRng(999));

    // The action should have been routed to obstacle handling
    // Either succeeded or failed (dice-dependent), but NOT generic D20
    expect(result.trace.statId).toBe(matchedPath.stat);
    // The authored path DC anchors the base; context modifiers apply on top.
    expect(result.trace.difficultyBreakdown?.base).toBe(matchedPath.dc);
  });

  test('successful NPC-obstacle path resolution neutralizes NPC', () => {
    const scenario = createNpcObstacleScenario();
    const npcObstacle = findNpcObstacleNode(scenario);
    if (!npcObstacle) return;

    const parserData = buildParserLocaleData('fr');
    const obstacleVerbMap = buildObstacleVerbMap('fr');
    const rng = createSeededRng(20260303);
    let state = initGame(scenario, 'marine', 'explorer', 'Soldat', rng);

    // Teleport player to the NPC-obstacle node
    state = { ...state, playerLocationId: npcObstacle.nodeId };
    state = {
      ...state,
      visitedLocations: {
        ...state.visitedLocations,
        [npcObstacle.nodeId]: { obstacleResolved: false, itemsTaken: [], featuresChanged: {} },
      },
    };

    // Find the lowest DC path that maps to a French verb
    const sortedPaths = [...npcObstacle.obstacle.paths].sort((a, b) => a.dc - b.dc);
    let frenchVerb: string | undefined;
    let usablePath: typeof sortedPaths[number] | undefined;
    for (const path of sortedPaths) {
      for (const v of path.verbs) {
        const verbId = obstacleVerbMap.get(v.toLowerCase());
        if (verbId && VERB_ID_TO_FRENCH[verbId]) {
          frenchVerb = VERB_ID_TO_FRENCH[verbId];
          usablePath = path;
          break;
        }
      }
      if (usablePath) break;
    }
    if (!usablePath || !frenchVerb) return; // Skip if no usable path

    const npcId = npcObstacle.npcId;

    let success = false;
    for (let i = 0; i < 30 && !success; i++) {
      // REG-031 stopped this intercept from re-firing once the obstacle is
      // already resolved — including when a `narrative_rescue` failsafe beat
      // the player to it after enough failures. That is now correctly a
      // no-op, not a mechanism this test exercises: if the failsafe wins the
      // race, there is nothing left to assert here.
      if (isObstacleResolved(state.visitedLocations[npcObstacle.nodeId])) return;

      const ctx = getSceneContext(state);
      const attemptRng = createSeededRng(i * 12345);
      const result = processTurn(state, `${frenchVerb} ${npcId}`, ctx, parserData, attemptRng);

      if (result.trace.outcome === 'success' || result.trace.outcome === 'crit_success') {
        success = true;
        state = result.newState;
        // Verify NPC is neutralized
        expect(state.npcStates[npcId]?.state.vitality).toBe('dead');
        // Verify obstacle is resolved
        expect(isObstacleResolved(state.visitedLocations[npcObstacle.nodeId])).toBe(true);
      } else {
        state = result.newState;
      }
    }

    // At least one attempt should have succeeded
    expect(success).toBe(true);
  });

  test('all 4 malfunctioning_android paths are recognized', () => {
    // Directly test that MALFUNCTIONING_ANDROID_01 module has all expected paths
    const module = ALL_MODULES.find(m => m.id === 'malfunctioning_android_01');
    expect(module).toBeDefined();
    expect(module!.obstacle).toBeDefined();

    const pathIds = module!.obstacle.paths.map(p => `${p.stat}:${p.verbs.join(',')}`);
    // reason: CHA (talk/persuade/calm)
    expect(pathIds.some(p => p.includes('CHA') && p.includes('talk'))).toBe(true);
    // disable: INT (hack/disable/use)
    expect(pathIds.some(p => p.includes('INT') && p.includes('hack'))).toBe(true);
    // fight: FOR (attack/fight/smash)
    expect(pathIds.some(p => p.includes('FOR') && p.includes('attack'))).toBe(true);
    // code: PER (search/examine/look)
    expect(pathIds.some(p => p.includes('PER') && p.includes('examine'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// REG-021: TAKE on container feature auto-adds revealed item to inventory (Issue #46)
// Bug: "prendre découpeur plasma industriel" targets plasma_cutter_rack (container
// feature) instead of the hidden plasma_cutter item. The rack's TAKE interaction
// correctly reveals the item but didn't add it to inventory — requiring a second TAKE.
// Fix: when a TAKE-triggered scenario interaction reveals items, auto-add them to
// inventory immediately.
// ---------------------------------------------------------------------------

describe('REG-021: container TAKE auto-adds revealed item to inventory (Issue #46)', () => {
  function buildRescueAtUnlockNode() {
    const rng = createSeededRng(46);
    const skeleton = getSkeletonById('rescue')!;
    const scenario = assembleScenario(skeleton, 'quick', ALL_MODULES, rng);

    // Find the node that has plasma_cutter_rack
    const unlockNode = scenario.graph.nodes.find(
      n => n.features.some(f => f.id === 'plasma_cutter_rack'),
    );
    expect(unlockNode).toBeDefined();

    let state = initGame(scenario, 'marine', 'explorer', 'Joueur', rng);
    // Teleport to the node containing plasma_cutter_rack
    state = {
      ...state,
      playerLocationId: unlockNode!.id,
      visitedLocations: {
        ...state.visitedLocations,
        [unlockNode!.id]: { obstacleResolved: false, itemsTaken: [], featuresChanged: {} },
      },
    };
    return { state, nodeId: unlockNode!.id };
  }

  test('plasma_cutter ends up in inventory after single TAKE command', () => {
    const { state } = buildRescueAtUnlockNode();
    const parserData = buildParserLocaleData('fr');
    const rng = createSeededRng(46);

    const ctx = getSceneContext(state);
    const result = processTurn(state, 'prendre découpeur plasma', ctx, parserData, rng);

    // plasma_cutter must be in inventory — no second TAKE required
    expect(result.newState.character!.inventory).toContain('plasma_cutter');
  });

  test('"découpeur plasma industriel" also adds plasma_cutter to inventory', () => {
    const { state } = buildRescueAtUnlockNode();
    const parserData = buildParserLocaleData('fr');
    const rng = createSeededRng(46);

    const ctx = getSceneContext(state);
    const result = processTurn(state, 'prendre découpeur plasma industriel', ctx, parserData, rng);

    expect(result.newState.character!.inventory).toContain('plasma_cutter');
  });

  test('plasma_cutter is not visible in scene after TAKE (marked as taken)', () => {
    const { state, nodeId } = buildRescueAtUnlockNode();
    const parserData = buildParserLocaleData('fr');
    const rng = createSeededRng(46);

    const ctx = getSceneContext(state);
    const result = processTurn(state, 'prendre découpeur plasma', ctx, parserData, rng);

    const visitState = result.newState.visitedLocations[nodeId];
    expect(visitState?.itemsTaken).toContain('plasma_cutter');
  });
});

// ---------------------------------------------------------------------------
// REG-022: OPEN on container feature via D20 does not reveal contained items (Issue #53)
// Bug: "j'ouvre le coffre fort" targets wall_safe (seed 474751722, turn 20).
// No scenario interaction matched (player lacked password_found flag), so the
// standard D20 pipeline handled OPEN. It set featureState to 'open' but never
// called revealItem for the feature's `contains` list → director_keycard
// stayed hidden and no content description appeared.
// Fix: in processTurn's D20 OPEN branch, when the feature is an enriched
// container, call revealItem for each item in `contains`.
// ---------------------------------------------------------------------------

describe('REG-022: OPEN on container feature via D20 reveals contained items (Issue #53)', () => {
  function buildStateAtWallSafe() {
    // Use marine/explorer for high FOR (5) and low DC to ensure D20 success
    const rng = createSeededRng(474751722);
    const skeleton = getSkeletonById('investigate')!;
    const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);

    // Find the node containing wall_safe
    const wallSafeNode = scenario.graph.nodes.find(
      n => n.features.some(f => f.id === 'wall_safe'),
    );
    expect(wallSafeNode).toBeDefined();

    // Init as marine/explorer for high FOR and low DC
    let state = initGame(scenario, 'marine', 'explorer', 'Joueur', rng);
    // Teleport player to wall_safe node, without password_found flag
    state = {
      ...state,
      playerLocationId: wallSafeNode!.id,
      scenarioFlags: {},  // no password_found → forces D20 fallback
      visitedLocations: {
        ...state.visitedLocations,
        [wallSafeNode!.id]: { obstacleResolved: false, itemsTaken: [], featuresChanged: {} },
      },
    };
    return { state, nodeId: wallSafeNode!.id };
  }

  test('director_keycard is revealed when OPEN on wall_safe succeeds via D20', () => {
    const { state } = buildStateAtWallSafe();
    const parserData = buildParserLocaleData('fr');
    const rng = createSeededRng(474751722);

    const ctx = getSceneContext(state);
    const result = processTurn(state, 'ouvrir le coffre', ctx, parserData, rng);

    // If the D20 succeeded, director_keycard must be revealed (Issue #53 fix)
    if (result.trace.outcome === 'success' || result.trace.outcome === 'crit_success') {
      expect(result.newState.revealedItems['director_keycard']).toBe(true);
      expect(result.newState.featureStates['wall_safe']?.openness).toBe('open');
    }
  });

  test('wall_safe OPEN via scenario interaction (password_found) still reveals keycard', () => {
    const { state } = buildStateAtWallSafe();
    const parserData = buildParserLocaleData('fr');
    const rng = createSeededRng(474751722);

    // Set password_found flag → scenario interaction fires (dc: null, auto-success)
    const stateWithPassword = { ...state, scenarioFlags: { password_found: true } };
    const ctx = getSceneContext(stateWithPassword);
    const result = processTurn(stateWithPassword, 'ouvrir le coffre', ctx, parserData, rng);

    // Scenario interaction is auto-success → items must be revealed
    expect(result.newState.revealedItems['director_keycard']).toBe(true);
    expect(result.newState.featureStates['wall_safe']?.openness).toBe('open');
  });
});

// ---------------------------------------------------------------------------
// REG-023: "j'attaque" (no target) falls to abstract environment instead of NPC
// Filed: 2026-03-07 | Fixed: 2026-03-07 | resolver.ts verbForms filtering (Issue #71)
// Root cause: Resolver filtered verb tokens using only VERB_REGISTRY static aliases
// (frapper, taper…), but "attaque" comes from i18n verbForms. Token not filtered →
// single-NPC fallback never triggered → abstract environment returned.
// ---------------------------------------------------------------------------
describe('REG-023: "j\'attaque" with 1 NPC auto-targets NPC (Issue #71)', () => {
  const creature = makeNpc('ambush_creature', ['créature', 'creature', 'creature embusquee'],
    ['organic', 'hostile', 'alive'] as PropertyId[]);

  test('"j\'attaque" with 1 NPC → STRIKE → NPC target', () => {
    const ctx = makeContext({ npcs: [creature] });
    const result = parseAction("j'attaque", ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('STRIKE');
      expect(result.target?.id).toBe('ambush_creature');
      expect(result.target?.source).toBe('npc');
    }
  });

  test('"attaque" token is filtered as STRIKE verb form, not matched as target', () => {
    const ctx = makeContext({ npcs: [creature] });
    const target = resolveTarget(
      ['attaque'], 'STRIKE', ctx,
      localeData.genericNpcRefs, localeData.batchTakeTokens, localeData.verbForms,
    );
    expect(target?.id).toBe('ambush_creature');
    expect(target?.source).toBe('npc');
  });

  test('"j\'attaque" with 0 NPCs → STRIKE with no target (no crash)', () => {
    // Decision N (2026-09-10): "there is no one here" is its own answer. It used
    // to be dressed up as a successful resolution onto a target called
    // 'environment', which the parser then had to detect and undo.
    const ctx = makeContext({});
    const result = parseAction("j'attaque", ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('STRIKE');
      expect(result.target).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// REG-024: "j'attache la créature avec le cable" → environment instead of NPC
// Filed: 2026-03-07 | Fixed: 2026-03-07 | resolver.ts verbForms filtering (Issue #73)
// Root cause: Same verb token filtering gap as REG-023. With verbForms passed to
// resolver, "attache" is properly filtered as TIE, leaving "creature" as target.
// ---------------------------------------------------------------------------
describe('REG-024: "j\'attache la créature avec le cable" → TIE → NPC (Issue #73)', () => {
  const creature = makeNpc('ambush_creature', ['créature', 'creature', 'creature embusquee'],
    ['organic', 'hostile', 'alive'] as PropertyId[]);

  test('TIE + "creature" tokens → NPC target, cable as tool', () => {
    const ctx = makeContext({
      npcs: [creature],
      inventory: [
        { id: 'cable', nameKey: 'item.cable', properties: ['flexible', 'long'] as PropertyId[],
          aliases: ['cable', 'câble'] },
      ],
    });
    const result = parseAction("j'attache la créature avec le cable", ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('TIE');
      expect(result.target?.id).toBe('ambush_creature');
      expect(result.target?.source).toBe('npc');
      expect(result.tool?.id).toBe('cable');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-025: "je me soigne" → USE → environment instead of self-target
// Filed: 2026-03-07 | Fixed: 2026-03-07 | parser.ts reflexive pronoun detection (Issue #74)
// Root cause: "me" is a stop word → stripped. "soigne" → USE. No target tokens
// remain → falls to abstract environment. Fix: detect reflexive pronouns (me, se)
// in fullTokens and override abstract environment to self-target.
// ---------------------------------------------------------------------------
describe('REG-025: "je me soigne" → USE → self-target (Issue #74)', () => {
  test('"je me soigne" → USE → self target, not environment', () => {
    const ctx = makeContext({});
    const result = parseAction('je me soigne', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('USE');
      expect(result.target?.id).toBe('self');
      expect(result.target?.source).toBe('abstract');
    }
  });

  test('"se soigner" → USE → self target', () => {
    const ctx = makeContext({});
    const result = parseAction('se soigner', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.target?.id).toBe('self');
    }
  });

  test('"je me protège" → reflexive self-target when no NPC', () => {
    const ctx = makeContext({});
    const result = parseAction('je me protège', ctx, localeData);
    // "se protéger" is BLOCK compound → may be intransitive → null target is also valid
    expect('verb' in result).toBe(true);
  });

  test('reflexive does NOT override when explicit target found: "je me jette sur la porte"', () => {
    const ctx = makeContext({
      environmentFeatures: [
        makeFeature('blast_door', ['porte', 'porte blindée'], ['heavy', 'metallic'] as PropertyId[]),
      ],
    });
    const result = parseAction('je me jette sur la porte', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result && result.target) {
      // Target should be the door, not self
      expect(result.target.id).not.toBe('self');
    }
  });
});

// REG-026: "je me tire une balle dans la tête" → PULL → environment
// Issue #66: "tirer" matched PULL (tirer=to pull) instead of SHOOT.
// Fix: Added compound pattern SHOOT:tire+balle so "tirer une balle" → SHOOT.
// Combined with reflexive pronoun detection, "je me tire une balle" → SHOOT → self.
describe('REG-026: "je me tire une balle" → SHOOT → self-target (Issue #66)', () => {
  test('"je me tire une balle dans la tête" → SHOOT (not PULL)', () => {
    const ctx = makeContext({});
    const result = parseAction('je me tire une balle dans la tête', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('SHOOT');
      expect(result.verbMatch.isCompound).toBe(true);
    }
  });

  test('"je me tire une balle" → self-target via reflexive pronoun', () => {
    const ctx = makeContext({});
    const result = parseAction('je me tire une balle', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('SHOOT');
      expect(result.target?.id).toBe('self');
      expect(result.target?.source).toBe('abstract');
    }
  });

  test('"tire une balle" without reflexive → SHOOT (no self-target override)', () => {
    const ctx = makeContext({});
    const result = parseAction('tire une balle', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('SHOOT');
      expect(result.target?.id).not.toBe('self');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-027: "je m'en vais" / "je pars" / "partir" → no movement
// Issue #58: Departure phrases correctly match MOVE_TO but the resolver found
// no specific destination (target=environment/abstract). Movement step 9a
// requires source=connected_location so the player stayed in place.
// Fix: After MOVE_TO is matched with no specific destination, auto-resolve to
// the single exit (1 exit), prompt "Où voulez-vous aller ?" (2+ exits), or
// "Il n'y a nulle part où aller" (0 exits). Also added "pars", "partez",
// "partons", "partir", "part" to MOVE_TO aliases + compound patterns for
// "en+vais", "en+aller", etc.
// ---------------------------------------------------------------------------
describe('REG-027: departure phrases trigger movement (Issue #58)', () => {
  test('"je m\'en vais" matches MOVE_TO verb', () => {
    const ctx = makeContext({
      connectedLocations: [{ id: 'corridor_a', aliases: ['corridor'], visited: false }],
    });
    const result = parseAction("je m'en vais", ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('MOVE_TO');
    }
  });

  test('"je pars" matches MOVE_TO verb', () => {
    const ctx = makeContext({
      connectedLocations: [{ id: 'corridor_a', aliases: ['corridor'], visited: false }],
    });
    const result = parseAction('je pars', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('MOVE_TO');
    }
  });

  test('"partir" matches MOVE_TO verb', () => {
    const ctx = makeContext({
      connectedLocations: [{ id: 'corridor_a', aliases: ['corridor'], visited: false }],
    });
    const result = parseAction('partir', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('MOVE_TO');
    }
  });

  test('single exit → auto-resolves to that exit', () => {
    const ctx = makeContext({
      connectedLocations: [{ id: 'corridor_a', aliases: ['corridor'], visited: false }],
    });
    const result = parseAction("je m'en vais", ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('MOVE_TO');
      expect(result.target?.id).toBe('corridor_a');
      expect(result.target?.source).toBe('connected_location');
    }
  });

  test('multiple exits → reformulation asking where to go', () => {
    const ctx = makeContext({
      connectedLocations: [
        { id: 'corridor_a', aliases: ['corridor'], visited: false },
        { id: 'corridor_b', aliases: ['couloir'], visited: true },
      ],
    });
    const result = parseAction("je m'en vais", ctx, localeData);
    expect('type' in result && result.type === 'reformulation').toBe(true);
    if ('prompt' in result) {
      expect(result.prompt).toBe('Où voulez-vous aller ?');
    }
  });

  test('no exits → reformulation saying nowhere to go', () => {
    const ctx = makeContext({ connectedLocations: [] });
    const result = parseAction("je m'en vais", ctx, localeData);
    expect('type' in result && result.type === 'reformulation').toBe(true);
    if ('prompt' in result) {
      expect(result.prompt).toContain('nulle part');
    }
  });

  test('"je pars" with single exit → auto-resolves', () => {
    const ctx = makeContext({
      connectedLocations: [{ id: 'room_b', aliases: ['salle'], visited: false }],
    });
    const result = parseAction('je pars', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('MOVE_TO');
      expect(result.target?.id).toBe('room_b');
      expect(result.target?.source).toBe('connected_location');
    }
  });

  test('full game integration: "je m\'en vais" moves player with single exit', () => {
    const rng = createSeededRng(58);
    const skeleton = getSkeletonById('escape')!;
    const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
    const state = initGame(scenario, 'marine', 'explorer', 'Joueur', rng);

    const ctx = getSceneContext(state);
    // Start location typically has exactly one exit
    if (ctx.connectedLocations.length === 1) {
      const result = processTurn(state, "je m'en vais", ctx, localeData, rng);
      expect(result.newState.playerLocationId).not.toBe(state.playerLocationId);
      expect(result.trace.parsedVerb).toBe('MOVE_TO');
      expect(result.trace.parsedTarget).toBe(ctx.connectedLocations[0]!.id);
    }
  });

  // Issue #76: rescue skeleton nodeLocations used roles (medical, airlock)
  // not present in theme.supportedRoles/locationNames → fallback "Zone inconnue (role)"
  test('GH-76: all skeleton core node roles must have location names in theme', () => {
    const skeletonIds = ['escape', 'investigate', 'rescue'] as const;
    for (const skId of skeletonIds) {
      const skeleton = getSkeletonById(skId)!;
      for (const [nodeId, locDef] of Object.entries(skeleton.nodeLocations)) {
        const role = (locDef as { locationRole: string }).locationRole;
        expect(
          skeleton.theme.supportedRoles,
          `${skId}: core node "${nodeId}" uses role "${role}" not in supportedRoles`,
        ).toContain(role);
        const names = skeleton.theme.locationNames[role];
        expect(
          names && names.length > 0,
          `${skId}: core node "${nodeId}" uses role "${role}" with no names in locationNames`,
        ).toBe(true);
      }
    }
  });

  test('GH-76: no assembled scenario produces fallback "Zone inconnue" names', () => {
    const skeletonIds = ['escape', 'investigate', 'rescue'] as const;
    for (const skId of skeletonIds) {
      const rng = createSeededRng(1012452977);
      const skeleton = getSkeletonById(skId)!;
      const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
      const badNodes = scenario.graph.nodes.filter(n => n.nameKey.fr.includes('Zone inconnue'));
      expect(
        badNodes.map(n => n.nameKey.fr),
        `${skId}: found fallback location names`,
      ).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// REG-028: equipped armor was hardcoded to 0 in processTurn (audit P3-3)
// ---------------------------------------------------------------------------
// The correct lookup only existed in the unrouted playtest hooks, so wearing
// the EVA suit reduced no damage at all in the shipped game.

describe('REG-028: equipped armor reduces damage taken', () => {
  // Constant RNG: both runs roll identically, so the only variable is armor.
  const constantRng = (): number => 0.99;

  function combatGame(equippedArmor: string | null): GameState {
    const skeleton = getSkeletonById('escape')!;
    const scenario = assembleScenario(skeleton, 'quick', ALL_MODULES, createSeededRng(28));
    const base = initGame(scenario, 'marine', 'survivor', 'Test', createSeededRng(28));
    return {
      ...base,
      character: {
        ...base.character!,
        equippedArmor,
        inventory: equippedArmor !== null ? [equippedArmor] : [],
      },
      activeCombat: {
        npc: {
          definitionId: 'security_robot',
          hp: 20, maxHp: 20, attack: 10, defense: 2,
          dodgeChance: 0, fleeDC: 12,
          aggressionPattern: 'aggressive',
          weakPoint: null, weakPointDiscovered: false, combatRound: 1,
        },
        npcInstanceId: 'security_robot',
        round: 1,
      },
    };
  }

  test('EVA suit absorbs exactly its armorValue on an identical NPC attack', () => {
    const parserData = buildParserLocaleData('fr');

    const bare = combatGame(null);
    const armored = combatGame('eva_suit');

    const bareResult = processTurn(bare, 'attendre', getSceneContext(bare), parserData, constantRng);
    const armoredResult = processTurn(armored, 'attendre', getSceneContext(armored), parserData, constantRng);

    const bareDamage = bare.character!.hp - bareResult.newState.character!.hp;
    const armoredDamage = armored.character!.hp - armoredResult.newState.character!.hp;

    expect(bareDamage).toBeGreaterThan(0);
    expect(armoredDamage).toBeLessThan(bareDamage);
    expect(bareDamage - armoredDamage).toBe(ITEM_DEFINITIONS.eva_suit!.armorValue);
  });
});

// ---------------------------------------------------------------------------
// REG-029: solving a gate with the gate item didn't open the gate (Issue found
// by a free-play AI playtest campaign — the harness only ever plays escape,
// so investigate's own gate had never been walked end to end).
// ---------------------------------------------------------------------------
// `encrypted_terminal` has five interactions that unlock the way to `reveal`
// (USE/HACK/TALK with no item, USE with a found password, BREAK). The sixth —
// USE with the actual gate item, `encrypted_data_core`, inserted into the slot
// the room's own text describes — decrypted the terminal and set its own flag,
// but carried no `revealsExit`. The most natural solution to the puzzle the
// scenario is built around was the one that didn't open the door.

describe('REG-029: using the gate item on its terminal unlocks the way onward', () => {
  test('encrypted_data_core USE on encrypted_terminal unlocks unlock→reveal', () => {
    const skeleton = getSkeletonById('investigate')!;
    const scenario = assembleScenario(skeleton, 'quick', ALL_MODULES, createSeededRng(1));
    const base = initGame(scenario, 'engineer', 'explorer', 'Test', createSeededRng(1));
    const state: GameState = {
      ...base,
      playerLocationId: 'unlock',
      visitedLocations: { ...base.visitedLocations, unlock: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], droppedItems: [], obstacleResolved: false } },
      character: { ...base.character!, inventory: ['encrypted_data_core'] },
    };
    const parserData = buildParserLocaleData('fr');

    const result = processTurn(
      state, 'utiliser le noyau de donnees sur le terminal de communication',
      getSceneContext(state), parserData, createSeededRng(1),
    );

    expect(result.newState.scenarioFlags['terminal_decrypted']).toBe(true);
    expect(result.newState.unlockedExits['unlock:reveal']).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// REG-030: "insérer X dans Y" fell to the DANCE easter egg instead of USE
// (found by the same AI playtest campaign, on two different seeds)
// ---------------------------------------------------------------------------
// "insérer" named no verb's alias, so the parser's last resort — a random
// secret/easter-egg verb, by design for genuinely nonsense input — caught a
// player typing the exact action the room's own text had just suggested.
// "dans" was also absent from `parser.prepositions.target`, so even a
// correctly-verbed phrase would have failed to attach its object as the target.
describe('REG-030: "inserer X dans Y" resolves to USE, not a secret verb', () => {
  const terminal = makeFeature('encrypted_terminal', ['terminal', 'terminal de communication'], ['electronic']);
  const core = {
    id: 'encrypted_data_core', nameKey: 'item.encrypted_data_core',
    properties: ['electronic', 'small'] as PropertyId[],
    isVirtual: false as const, source: 'inventory' as const, aliases: ['noyau', 'noyau de donnees'],
  };
  const ctx = makeContext({ environmentFeatures: [terminal], inventory: [core] });

  test('parseAction("inserer le noyau de donnees dans le terminal") → USE, not DANCE', () => {
    const result = parseAction('inserer le noyau de donnees dans le terminal', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('USE');
      expect(result.target?.id).toBe('encrypted_terminal');
      expect(result.tool?.id).toBe('encrypted_data_core');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-031: talking to a resolved NPC-obstacle re-ran the obstacle check and
// lost the target (found by the same AI playtest campaign)
// ---------------------------------------------------------------------------
// wounded_crew_member's obstacle lists 'talk' among its persuade-path verbs.
// The feature-obstacle intercept (Issue #47) matched verb+target against the
// obstacle regardless of whether it had already been resolved — so healing
// the NPC first (a different path) didn't stop every later "parler à ..."
// from re-entering obstacle handling. That path has no scenario narrative for
// an NPC (only features/items carry ScenarioInteraction), so the generic
// template rendered with no target at all: "Vous tentez de parler à. Vous
// engagez la conversation avec ." — exactly what the transcript showed, even
// though the exact on-screen name was typed back verbatim.
describe('REG-031: an already-resolved NPC-obstacle stops intercepting later verbs', () => {
  function buildAtWoundedCrewNode() {
    const rng = createSeededRng(31);
    const skeleton = getSkeletonById('escape')!;
    const scenario = assembleScenario(skeleton, 'standard', ALL_MODULES, rng);
    const node = scenario.graph.nodes.find(
      n => n.obstacle?.targetId === 'wounded_crew_member',
    );
    if (!node) return null;
    const state = initGame(scenario, 'medic', 'explorer', 'Joueur', rng);
    return {
      state: {
        ...state,
        playerLocationId: node.id,
        visitedLocations: {
          ...state.visitedLocations,
          // Already resolved through a different path (e.g. healing), same
          // as the transcript: obstacle beaten, conversation should be plain.
          [node.id]: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], droppedItems: [], obstacleResolved: true },
        },
      },
      nodeId: node.id,
    };
  }

  test('TALK on the NPC resolves a real target once the obstacle is already beaten', () => {
    const found = buildAtWoundedCrewNode();
    if (!found) return; // module not placed on this seed's assembly — nothing to verify
    const { state } = found;
    const parserData = buildParserLocaleData('fr');

    const result = processTurn(
      state, "parler au membre d'equipage blesse",
      getSceneContext(state), parserData, createSeededRng(31),
    );

    expect(result.trace.parsedVerb).toBe('TALK');
    expect(result.trace.parsedTarget).toBe('wounded_crew_member');
  });
});

// ---------------------------------------------------------------------------
// REG-032: a scenario item's own display name didn't count as its "name"
// (found by the same AI playtest campaign — a medic typed the exact name the
// screen showed, "prendre kit medical", and took the wrong item)
// ---------------------------------------------------------------------------
// `medkit_basic` (a scenario-only item, on the floor) and `medical_kit` (the
// global registry item, already in a medic's starting inventory) both scored
// 20 on "kit medical" — the alias-splitting fix for multi-word names put
// "kit"/"medical" in both entities' candidate pools. The tie-break, "nameExact"
// beats "not name exact", only ever looked at nameKey- and id-derived words:
// `medical_kit`'s id happens to *be* the two French words "medical" + "kit",
// so it won nameExact by coincidence, while medkit_basic's id ("medkit_basic")
// does not read as French at all. The location item — the one actually in the
// room — lost to inventory. `aliases[1]` (every scene.ts builder's own display
// name) now counts as "the entity's own name" too.
describe('REG-032: an entity\'s own display name counts toward nameExact, not just its id', () => {
  const medkitBasic: ResolvedTarget = {
    id: 'medkit_basic', nameKey: 'item.medkit_basic', properties: [],
    isVirtual: false, source: 'location',
    aliases: ['medkit_basic', 'kit médical basique', 'kit', 'kit medical', 'medkit', 'trousse', 'trousse medicale', 'soins', 'pansement'],
  };
  const medicalKit: ResolvedTarget = {
    id: 'medical_kit', nameKey: 'item.medical_kit', properties: [],
    isVirtual: false, source: 'inventory',
    aliases: ['medical_kit', 'trousse médicale', 'trousse', 'medicale', 'medkit', 'soin', 'premiers', 'secours', 'kit'],
  };
  const ctx = makeContext({ inventory: [medicalKit], locationItems: [medkitBasic] });

  test('"prendre kit medical" takes the item on the floor, not the unrelated one already carried', () => {
    const result = parseAction('prendre kit medical', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('TAKE');
      expect(result.target?.id).toBe('medkit_basic');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-033: EXAMINE on a self-healing item consumed it and played the heal
// narrative (found by the same AI playtest campaign, in two scenarios)
// ---------------------------------------------------------------------------
// `findItemUseOn` matches by target id ('self') only — it never checks which
// verb the player typed. The self-use lookup that makes "utiliser la trousse"
// heal the player had no verb guard either, so "examiner la trousse" matched
// the exact same useOn('self') entry and consumed the kit while narrating a
// medical application, instead of returning its `examineResult` description.
describe('REG-033: EXAMINE on a self-heal item describes it instead of using it', () => {
  function buildAtStartWithMedkit() {
    const rng = createSeededRng(16);
    const skeleton = getSkeletonById('escape')!;
    const scenario = assembleScenario(skeleton, 'quick', ALL_MODULES, rng);
    const state = initGame(scenario, 'medic', 'explorer', 'Joueur', rng);
    return {
      ...state,
      character: { ...state.character!, inventory: [...state.character!.inventory, 'medkit_basic'] },
    };
  }

  test('EXAMINE does not consume the item or heal the player', () => {
    const state = buildAtStartWithMedkit();
    const parserData = buildParserLocaleData('fr');
    const hpBefore = state.character.hp;

    const result = processTurn(
      state, 'examiner le kit medical basique',
      getSceneContext(state), parserData, createSeededRng(16),
    );

    expect(result.trace.parsedVerb).toBe('EXAMINE');
    expect(result.newState.character!.hp).toBe(hpBefore);
    expect(result.newState.character!.inventory).toContain('medkit_basic');
  });

  test('USE still heals and consumes the item as before', () => {
    const state = buildAtStartWithMedkit();
    const parserData = buildParserLocaleData('fr');
    const hurt = { ...state, character: { ...state.character, hp: Math.max(1, state.character.hp - 3) } };

    const result = processTurn(
      hurt, 'utiliser le kit medical basique',
      getSceneContext(hurt), parserData, createSeededRng(16),
    );

    expect(result.trace.parsedVerb).toBe('USE');
    expect(result.newState.character!.hp).toBeGreaterThan(hurt.character.hp);
  });
});

// ---------------------------------------------------------------------------
// REG-034: gender bugs found by the AI playtest campaign — "le trappe",
// "un couchette", "le Dr Okonkwo" (should be "la")
// ---------------------------------------------------------------------------
describe('REG-034: "trappe", "couchette" and titled NPC names get the right gender', () => {
  test('detectGrammar treats "trappe" (and compounds) as feminine', () => {
    expect(detectGrammar('trappe de déviation maintenance').gender).toBe('F');
    expect(detectGrammar('Trappe de ventilation').gender).toBe('F');
  });

  test('env.cot ("Couchette") has the feminine indefinite article', () => {
    const map = JSON.parse(t('grammar.feature_articles', 'fr')) as Record<string, string>;
    expect(map['env.cot']).toBe('une');
  });

  test('a civil title ("Dr") does not force masculine gender — the name after it decides', () => {
    expect(detectGrammar('Dr Okonkwo').gender).toBe('F');
  });
});

// ---------------------------------------------------------------------------
// REG-035: rescue's primary victory (and both alternative endings) were
// structurally unreachable — the shuttle_hatch interactions were gated on
// verb MOVE_TO, but MOVE_TO's target-resolution policy only ever searches
// exits/here, never environment features. No natural phrasing could ever
// resolve a feature as a MOVE_TO target, so boarding the shuttle (the only
// way to reach `escort_alive`) could never fire. Fixed by using USE instead
// (default policy, includes environment — matches escape_pod_hatch's
// pattern in escape.ts).
// ---------------------------------------------------------------------------
describe('REG-035: boarding the rescue shuttle (escort_alive victory) is reachable', () => {
  function atBossWithEscortActive(seed: number) {
    const rng = createSeededRng(seed);
    const skeleton = getSkeletonById('rescue')!;
    const scenario = assembleScenario(skeleton, 'quick', ALL_MODULES, rng);
    const state = initGame(scenario, 'medic', 'explorer', 'Joueur', createSeededRng(seed));
    const boss = scenario.graph.nodes.find(n => n.coreNodeId === 'boss');
    if (!boss) return null;
    return {
      ...state,
      playerLocationId: boss.id,
      scenarioFlags: { ...state.scenarioFlags, okonkwo_found: true, escort_active: true },
    };
  }

  test('"utiliser l\'ecoutille" with escort_active relocates Okonkwo and wins the game', () => {
    const state = atBossWithEscortActive(1);
    if (state === null) return; // module placement didn't include a boss node on this seed
    const parserData = buildParserLocaleData('fr');
    const ctx = getSceneContext(state);

    const result = processTurn(state, "utiliser l'ecoutille", ctx, parserData, createSeededRng(1));

    expect(result.trace.parsedVerb).toBe('USE');
    expect(result.trace.parsedTarget).toBe('shuttle_hatch');
    expect(result.newState.npcStates['dr_okonkwo']?.locationId).toBe('resolution');
    expect(result.newState.phase).toBe('victory');
    expect(result.newState.victoryResult?.type).toBe('primary');
  });

  test('the shuttle_hatch interactions are no longer gated on the unreachable MOVE_TO verb', async () => {
    const rescue = await import('../../../src/content/scenarios/rescue');
    const boss = rescue.RESCUE_SKELETON.nodeLocations.boss;
    const hatch = boss.features.find(f => f.id === 'shuttle_hatch');
    expect(hatch).toBeDefined();
    for (const interaction of hatch!.interactions ?? []) {
      const verbs = Array.isArray(interaction.trigger.verb) ? interaction.trigger.verb : [interaction.trigger.verb];
      expect(verbs).not.toContain('MOVE_TO');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-037: two features named identically except for a trailing single-letter
// label ("Panneau de symboles A" / "...B") were permanently indistinguishable
// — normalizeInput() blanket-dropped every single-character token, including
// the very letter that told the two apart, no matter how the player phrased
// it. Fixed to only drop the small fixed set of French elision remnants
// ("l'ennemi" -> "l") and keep other single-letter tokens (labels, "a"/"b").
// ---------------------------------------------------------------------------
describe('REG-037: single-letter labels ("panneau ... A" vs "... B") survive tokenization', () => {
  const panelA = makeFeature('symbol_panel_a', ['panneau', 'de', 'symboles', 'a'], ['tangible'] as PropertyId[]);
  const panelB = makeFeature('symbol_panel_b', ['panneau', 'de', 'symboles', 'b'], ['tangible'] as PropertyId[]);
  const ctx = makeContext({ environmentFeatures: [panelA, panelB] });

  test('normalizeInput keeps a trailing single-letter label', () => {
    const tokens = normalizeInput('examiner le panneau de symboles a', localeData.stopWords);
    expect(tokens).toContain('a');
  });

  test('normalizeInput still drops elision remnants ("l\'ennemi" -> not "l")', () => {
    const tokens = normalizeInput("regarder l'ennemi", localeData.stopWords);
    expect(tokens).not.toContain('l');
    expect(tokens).toContain('ennemi');
  });

  test('"examiner le panneau de symboles a" resolves to panel A, not panel B', () => {
    const result = parseAction('examiner le panneau de symboles a', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.target?.id).toBe('symbol_panel_a');
    }
  });

  test('"examiner le panneau de symboles b" resolves to panel B, not panel A', () => {
    const result = parseAction('examiner le panneau de symboles b', ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.target?.id).toBe('symbol_panel_b');
    }
  });
});