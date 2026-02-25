// ---------------------------------------------------------------------------
// tests/unit/content/scenarios/skeletons.test.ts — Skeleton validation tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { ESCAPE_SKELETON } from '../../../../src/content/scenarios/escape';
import { INVESTIGATE_SKELETON } from '../../../../src/content/scenarios/investigate';
import { RESCUE_SKELETON } from '../../../../src/content/scenarios/rescue';
import { LAUNCH_SKELETONS, getSkeletonById } from '../../../../src/content/scenarios/index';
import type { CoreSkeleton } from '../../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// SHARED VALIDATION HELPER
// ---------------------------------------------------------------------------

function validateSkeleton(skeleton: CoreSkeleton): void {
  describe(`skeleton: ${skeleton.id}`, () => {
    it('has a valid ID and locale strings', () => {
      expect(skeleton.id).toBeTruthy();
      expect(skeleton.nameKey.fr).toBeTruthy();
      expect(skeleton.descriptionKey.fr).toBeTruthy();
    });

    it('has exactly 6 nodes in correct order', () => {
      expect(skeleton.nodes).toHaveLength(6);
      expect(skeleton.nodes[0].id).toBe('start');
      expect(skeleton.nodes[1].id).toBe('unlock');
      expect(skeleton.nodes[2].id).toBe('reveal');
      expect(skeleton.nodes[3].id).toBe('escalation');
      expect(skeleton.nodes[4].id).toBe('boss');
      expect(skeleton.nodes[5].id).toBe('resolution');
    });

    it('nodes have correct roles', () => {
      expect(skeleton.nodes[0].role).toBe('entry');
      expect(skeleton.nodes[1].role).toBe('gate');
      expect(skeleton.nodes[2].role).toBe('midpoint');
      expect(skeleton.nodes[3].role).toBe('escalation');
      expect(skeleton.nodes[4].role).toBe('climax');
      expect(skeleton.nodes[5].role).toBe('epilogue');
    });

    it('nodes have correct beats', () => {
      expect(skeleton.nodes[0].beat).toBe('intro');
      expect(skeleton.nodes[1].beat).toBe('rising');
      expect(skeleton.nodes[2].beat).toBe('midpoint');
      expect(skeleton.nodes[3].beat).toBe('escalation');
      expect(skeleton.nodes[4].beat).toBe('climax');
      expect(skeleton.nodes[5].beat).toBe('resolution');
    });

    it('tension rises to boss and drops at resolution', () => {
      const tensions = skeleton.nodes.map(n => n.tension);
      // Boss should be highest (at least 9)
      expect(tensions[4]).toBeGreaterThanOrEqual(9); // boss
      // Resolution should drop significantly
      expect(tensions[5]).toBeLessThan(tensions[4]);
      // General upward trend: start < unlock < reveal < escalation < boss
      expect(tensions[0]).toBeLessThan(tensions[1]);
      expect(tensions[1]).toBeLessThan(tensions[2]);
      expect(tensions[2]).toBeLessThan(tensions[3]);
      expect(tensions[3]).toBeLessThan(tensions[4]);
    });

    it('has gate item and gate item location', () => {
      expect(skeleton.gateItem).toBeTruthy();
      expect(skeleton.gateItemLocation).toBeTruthy();
    });

    it('gate item location is a valid node ID', () => {
      const validIds = skeleton.nodes.map(n => n.id);
      expect(validIds).toContain(skeleton.gateItemLocation);
    });

    it('has revelation and escalation trigger with fr text', () => {
      expect(skeleton.revelation.fr).toBeTruthy();
      expect(skeleton.escalationTrigger.fr).toBeTruthy();
    });

    it('has a valid boss type', () => {
      const validTypes = ['combat', 'puzzle', 'escape', 'choice'];
      expect(validTypes).toContain(skeleton.bossType);
    });

    it('has primary and alternative victory conditions', () => {
      expect(skeleton.primaryVictory).toBeDefined();
      expect(skeleton.primaryVictory.type).toBeTruthy();
      expect(skeleton.alternativeVictory).toBeDefined();
      expect(skeleton.alternativeVictory.type).toBeTruthy();
    });

    it('primary and alternative victories are different types', () => {
      expect(skeleton.primaryVictory.type).not.toBe(skeleton.alternativeVictory.type);
    });

    it('has nodeLocations for all 6 nodes', () => {
      const nodeIds = ['start', 'unlock', 'reveal', 'escalation', 'boss', 'resolution'];
      for (const id of nodeIds) {
        expect(skeleton.nodeLocations[id as keyof typeof skeleton.nodeLocations],
          `Missing nodeLocations entry for node: ${id}`
        ).toBeDefined();
      }
    });

    it('all node locations have a locationRole', () => {
      for (const [id, loc] of Object.entries(skeleton.nodeLocations)) {
        expect(loc.locationRole, `Node '${id}' missing locationRole`).toBeTruthy();
      }
    });

    it('all node locations have items and features arrays', () => {
      for (const [id, loc] of Object.entries(skeleton.nodeLocations)) {
        expect(Array.isArray(loc.items), `Node '${id}' missing items array`).toBe(true);
        expect(Array.isArray(loc.features), `Node '${id}' missing features array`).toBe(true);
      }
    });

    it('gate item appears in the gate item location', () => {
      const gateLoc = skeleton.nodeLocations[skeleton.gateItemLocation as keyof typeof skeleton.nodeLocations];
      const gateItem = skeleton.gateItem;
      // Check items OR features (gate item might be listed in features as a key)
      const hasItem = gateLoc.items.some(item => item.id === gateItem);
      const hasFeature = gateLoc.features.some(f => f.id === gateItem);
      // Also check: the gate item might be in any item list with hidden flag
      expect(hasItem || hasFeature,
        `Gate item '${gateItem}' not found in location '${skeleton.gateItemLocation}'`
      ).toBe(true);
    });

    it('node descriptions have fr text', () => {
      for (const node of skeleton.nodes) {
        expect(node.descriptionKey.fr, `Node '${node.id}' missing fr description`).toBeTruthy();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// SKELETON TESTS
// ---------------------------------------------------------------------------

describe('ESCAPE_SKELETON', () => {
  it('has the escape ID', () => { expect(ESCAPE_SKELETON.id).toBe('escape'); });
  it('has the correct French name', () => { expect(ESCAPE_SKELETON.nameKey.fr).toContain('Épave'); });
  it('gate item is access_keycard', () => { expect(ESCAPE_SKELETON.gateItem).toBe('access_keycard'); });
  it('boss type is escape', () => { expect(ESCAPE_SKELETON.bossType).toBe('escape'); });
  it('primary victory reaches resolution with keycard', () => {
    expect(ESCAPE_SKELETON.primaryVictory.type).toBe('reach_location');
    if (ESCAPE_SKELETON.primaryVictory.type === 'reach_location') {
      expect(ESCAPE_SKELETON.primaryVictory.requiredItem).toBe('access_keycard');
    }
  });
  it('alternative victory is environmental kill', () => {
    expect(ESCAPE_SKELETON.alternativeVictory.type).toBe('environmental_kill');
  });
  it('has O2 defeat condition', () => {
    const o2Defeat = ESCAPE_SKELETON.additionalDefeatConditions?.find(
      d => d.type === 'time_expired'
    );
    expect(o2Defeat).toBeDefined();
  });
});

validateSkeleton(ESCAPE_SKELETON);

describe('INVESTIGATE_SKELETON', () => {
  it('has the investigate ID', () => { expect(INVESTIGATE_SKELETON.id).toBe('investigate'); });
  it('has the correct French name', () => { expect(INVESTIGATE_SKELETON.nameKey.fr).toBeTruthy(); });
  it('gate item is encrypted_data_core', () => { expect(INVESTIGATE_SKELETON.gateItem).toBe('encrypted_data_core'); });
  it('boss type is puzzle', () => { expect(INVESTIGATE_SKELETON.bossType).toBe('puzzle'); });
  it('primary victory activates the beacon', () => {
    expect(INVESTIGATE_SKELETON.primaryVictory.type).toBe('activate_object');
  });
  it('alternative victory is self_destruct', () => {
    expect(INVESTIGATE_SKELETON.alternativeVictory.type).toBe('self_destruct');
  });
  it('has objective_destroyed defeat condition', () => {
    const objDefeat = INVESTIGATE_SKELETON.additionalDefeatConditions?.find(
      d => d.type === 'objective_destroyed'
    );
    expect(objDefeat).toBeDefined();
  });
});

validateSkeleton(INVESTIGATE_SKELETON);

describe('RESCUE_SKELETON', () => {
  it('has the rescue ID', () => { expect(RESCUE_SKELETON.id).toBe('rescue'); });
  it('has the correct French name', () => { expect(RESCUE_SKELETON.nameKey.fr).toBeTruthy(); });
  it('gate item is medical_stabilizer', () => { expect(RESCUE_SKELETON.gateItem).toBe('medical_stabilizer'); });
  it('boss type is choice', () => { expect(RESCUE_SKELETON.bossType).toBe('choice'); });
  it('primary victory escorts npc alive', () => {
    expect(RESCUE_SKELETON.primaryVictory.type).toBe('escort_alive');
    if (RESCUE_SKELETON.primaryVictory.type === 'escort_alive') {
      expect(RESCUE_SKELETON.primaryVictory.npcId).toBe('dr_okonkwo');
    }
  });
  it('has NPC death defeat condition for dr_okonkwo', () => {
    const npcDefeat = RESCUE_SKELETON.additionalDefeatConditions?.find(
      d => d.type === 'npc_death'
    );
    expect(npcDefeat).toBeDefined();
    if (npcDefeat?.type === 'npc_death') {
      expect(npcDefeat.npcId).toBe('dr_okonkwo');
    }
  });
  it('has dr_okonkwo NPC in reveal location', () => {
    const revealLoc = RESCUE_SKELETON.nodeLocations.reveal;
    expect(revealLoc.npcs?.some(n => n.id === 'dr_okonkwo')).toBe(true);
  });
});

validateSkeleton(RESCUE_SKELETON);

// ---------------------------------------------------------------------------
// LAUNCH_SKELETONS registry tests
// ---------------------------------------------------------------------------

describe('LAUNCH_SKELETONS', () => {
  it('has exactly 3 skeletons', () => {
    expect(LAUNCH_SKELETONS).toHaveLength(3);
  });

  it('contains escape, investigate, rescue', () => {
    const ids = LAUNCH_SKELETONS.map(s => s.id);
    expect(ids).toContain('escape');
    expect(ids).toContain('investigate');
    expect(ids).toContain('rescue');
  });

  it('all skeleton IDs are unique', () => {
    const ids = LAUNCH_SKELETONS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getSkeletonById', () => {
  it('finds each skeleton by ID', () => {
    expect(getSkeletonById('escape')).toBeDefined();
    expect(getSkeletonById('investigate')).toBeDefined();
    expect(getSkeletonById('rescue')).toBeDefined();
  });

  it('returns undefined for unknown ID', () => {
    expect(getSkeletonById('unknown')).toBeUndefined();
  });
});
