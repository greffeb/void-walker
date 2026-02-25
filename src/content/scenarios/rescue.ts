// ---------------------------------------------------------------------------
// src/content/scenarios/rescue.ts — RESCUE skeleton: "Dernier Signal"
// ---------------------------------------------------------------------------
// Fantasy: Someone is alive in there. Get them out.
// 6 core nodes, gate item: medical_stabilizer, boss type: choice
// ---------------------------------------------------------------------------

import type { CoreSkeleton } from '@engine/scenario';

export const RESCUE_SKELETON: CoreSkeleton = {
  id: 'rescue',
  nameKey: { fr: 'Dernier Signal', en: 'Last Signal' },
  descriptionKey: {
    fr: 'Un signal de détresse pulse depuis les profondeurs. Quelqu\'un est encore en vie. Allez le chercher.',
    en: 'A distress signal pulses from the depths. Someone is still alive. Go get them.',
  },

  nodes: [
    {
      id: 'start',
      role: 'entry',
      beat: 'intro',
      tension: 2,
      descriptionKey: {
        fr: 'Site de Crash — Votre navette s\'est écrasée à l\'approche. Coque percée. Un signal de détresse pulse depuis l\'intérieur.',
        en: 'Crash Site — Your shuttle crashed on approach. Hull breached. A distress signal pulses from deeper inside.',
      },
    },
    {
      id: 'unlock',
      role: 'gate',
      beat: 'rising',
      tension: 4,
      descriptionKey: {
        fr: 'Point de Triage — Un couloir effondré bloque le passage. Il faut un stabilisateur médical pour soigner la survivante — et un chemin pour y arriver.',
        en: 'Triage Point — A collapsed corridor blocks the way. Need a medical stabilizer to treat the survivor — and a path to reach her.',
      },
    },
    {
      id: 'reveal',
      role: 'midpoint',
      beat: 'midpoint',
      tension: 6,
      descriptionKey: {
        fr: 'Emplacement de la Survivante — La Dr. Okonkwo. Blessée, consciente. Elle connaît la faiblesse de la créature. Et l\'unique chemin de sortie traverse son territoire de chasse.',
        en: 'Survivor\'s Location — Dr. Okonkwo. Wounded but conscious. She knows the creature\'s weakness. And the only exit goes through its hunting ground.',
      },
    },
    {
      id: 'escalation',
      role: 'escalation',
      beat: 'escalation',
      tension: 8,
      descriptionKey: {
        fr: 'La Traque — Vous escortez une blessée. Chaque déplacement est calculé. La créature a détecté le sang de la Dr. Okonkwo.',
        en: 'The Hunt Begins — You\'re escorting a wounded NPC. Movement is calculated. The creature has detected Dr. Okonkwo\'s blood.',
      },
    },
    {
      id: 'boss',
      role: 'climax',
      beat: 'climax',
      tension: 10,
      descriptionKey: {
        fr: 'Point d\'Extraction — La navette est en vue. La créature vous coupe la route. Un choix impossible s\'impose.',
        en: 'Exit Point — The shuttle is in sight. The creature cuts you off. An impossible choice looms.',
      },
    },
    {
      id: 'resolution',
      role: 'epilogue',
      beat: 'resolution',
      tension: 3,
      descriptionKey: {
        fr: 'Décollage — La navette décolle. Ce qui s\'est passé ensuite dépend de vos choix.',
        en: 'Liftoff — The shuttle takes off. What happened next depends on your choices.',
      },
    },
  ],

  gateItem: 'medical_stabilizer',
  gateItemLocation: 'start',

  revelation: {
    fr: 'La Dr. Okonkwo est la chercheuse principale — et la créature était son expérience. Elle connaît sa faiblesse : la sensibilité sonore. La culpabilité la rend prête à tout pour aider.',
    en: 'Dr. Okonkwo is the lead researcher — and the creature was her experiment. She knows its weakness: sound sensitivity. Guilt makes her ready to help at any cost.',
  },
  escalationTrigger: {
    fr: 'Vous escortez maintenant une blessée. Les déplacements sont ralentis. La créature a détecté l\'odeur du sang. La chasse commence.',
    en: 'You\'re now escorting a wounded NPC. Movement is slower. The creature has detected the scent of blood. The hunt begins.',
  },

  bossType: 'choice',

  primaryVictory: {
    type: 'escort_alive',
    npcId: 'dr_okonkwo',
    locationId: 'resolution',
  },
  alternativeVictory: {
    type: 'reach_location',
    locationId: 'resolution',
  },
  emergentVictoryHint: {
    fr: 'L\'émetteur sonique combiné avec l\'acoustique de la zone pourrait confiner la créature...',
    en: 'The sonic emitter combined with the zone\'s acoustics could permanently trap the creature...',
  },

  nodeLocations: {
    start: {
      locationRole: 'dead_end',
      items: [
        { id: 'first_aid_kit' },
        { id: 'medical_stabilizer', hidden: true },
      ],
      features: [
        { id: 'crashed_shuttle', initialState: 'damaged' },
        { id: 'hull_breach', initialState: 'open' },
        { id: 'salvageable_parts', initialState: 'intact' },
        { id: 'emergency_beacon_broken', initialState: 'broken' },
      ],
      exits: ['unlock'],
    },
    unlock: {
      locationRole: 'medical',
      items: [],
      features: [
        { id: 'collapsed_corridor', initialState: 'broken' },
        { id: 'maintenance_detour_hatch', initialState: 'intact' },
        { id: 'plasma_cutter_rack', initialState: 'intact' },
      ],
      exits: ['start', 'reveal'],
    },
    reveal: {
      locationRole: 'medical',
      items: [
        { id: 'research_notes' },
        { id: 'sonic_emitter_component' },
      ],
      npcs: [
        { id: 'dr_okonkwo', disposition: 'cooperative', hpOverride: 4 },
      ],
      features: [
        { id: 'survivor_barricade', initialState: 'intact' },
        { id: 'research_terminal', initialState: 'damaged' },
      ],
      exits: ['unlock', 'escalation'],
    },
    escalation: {
      locationRole: 'passage',
      items: [],
      npcs: [
        { id: 'creature_hunter', disposition: 'hostile' },
      ],
      features: [
        { id: 'acoustic_walls', initialState: 'intact' },
        { id: 'distraction_rack', initialState: 'intact' },
        { id: 'blast_door_partial', initialState: 'damaged' },
      ],
      exits: ['reveal', 'boss'],
    },
    boss: {
      locationRole: 'airlock',
      items: [],
      npcs: [
        { id: 'creature_hunter', disposition: 'hostile' },
      ],
      features: [
        { id: 'shuttle_hatch', initialState: 'open' },
        { id: 'acoustic_trap_point', initialState: 'intact' },
        { id: 'extraction_bay_door', initialState: 'damaged' },
      ],
      exits: ['escalation', 'resolution'],
    },
    resolution: {
      locationRole: 'hub',
      items: [],
      features: [
        { id: 'shuttle_cockpit', initialState: 'intact' },
      ],
      exits: ['boss'],
    },
  },

  additionalDefeatConditions: [
    { type: 'npc_death', npcId: 'dr_okonkwo' },
  ],
};
