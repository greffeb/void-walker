// ---------------------------------------------------------------------------
// src/content/scenarios/investigate.ts — INVESTIGATE skeleton: "Signal Perdu"
// ---------------------------------------------------------------------------
// Fantasy: Investigate a station gone silent. Uncover a conspiracy.
// 6 core nodes, gate item: encrypted_data_core, boss type: puzzle
// ---------------------------------------------------------------------------

import type { CoreSkeleton } from '@engine/scenario';

export const INVESTIGATE_SKELETON: CoreSkeleton = {
  id: 'investigate',
  nameKey: { fr: 'Signal Perdu', en: 'Lost Signal' },
  descriptionKey: {
    fr: 'La Station Phoebe-7 est silencieuse depuis 72 heures. Votre mission : découvrir ce qui s\'est passé. Revenir vivant.',
    en: 'Station Phoebe-7 has been silent for 72 hours. Your mission: find out what happened. Come back alive.',
  },

  nodes: [
    {
      id: 'start',
      role: 'entry',
      beat: 'intro',
      tension: 2,
      descriptionKey: {
        fr: 'Baie d\'Amarrage — Vous avez accosté avec la Station Phoebe-7. Silencieuse depuis 72 heures. L\'airlock s\'ouvre.',
        en: 'Docking Bay — You\'ve docked with Station Phoebe-7. Silent for 72 hours. The airlock opens.',
      },
    },
    {
      id: 'unlock',
      role: 'gate',
      beat: 'rising',
      tension: 4,
      descriptionKey: {
        fr: 'Centre de Communications — Un terminal chiffré bloque l\'accès aux données critiques de la station.',
        en: 'Comms Center — An encrypted terminal blocks access to the station\'s critical data.',
      },
    },
    {
      id: 'reveal',
      role: 'midpoint',
      beat: 'midpoint',
      tension: 6,
      descriptionKey: {
        fr: 'Bureau de la Directrice — Les fichiers de Vasquez révèlent tout. La catastrophe était planifiée. Fraude à l\'assurance.',
        en: 'Director\'s Office — Vasquez\'s files reveal everything. The catastrophe was planned. Insurance fraud.',
      },
    },
    {
      id: 'escalation',
      role: 'escalation',
      beat: 'escalation',
      tension: 8,
      descriptionKey: {
        fr: 'Niveau Réacteur — Le réacteur se déstabilise — conséquence du sabotage. L\'IA de la station vous est désormais hostile.',
        en: 'Reactor Level — The reactor is destabilizing — consequence of the sabotage. The station AI is now hostile to you.',
      },
    },
    {
      id: 'boss',
      role: 'climax',
      beat: 'climax',
      tension: 9,
      descriptionKey: {
        fr: 'Chambre de la Balise — L\'IA a verrouillé la salle de la balise de secours. Dernière couche de sécurité.',
        en: 'Beacon Chamber — The AI has locked down the emergency beacon room. Final security layer.',
      },
    },
    {
      id: 'resolution',
      role: 'epilogue',
      beat: 'resolution',
      tension: 3,
      descriptionKey: {
        fr: 'Signal transmis — La vérité voyage à travers le vide vers une flotte de secours.',
        en: 'Signal transmitted — The truth travels through the void toward a rescue fleet.',
      },
    },
  ],

  gateItem: 'encrypted_data_core',
  gateItemLocation: 'start',

  revelation: {
    fr: 'La Directrice Vasquez a délibérément provoqué la défaillance du confinement. Fraude à l\'assurance — la station vaut plus détruite. L\'équipage était sacrifiable.',
    en: 'Director Vasquez deliberately caused the containment failure. Insurance fraud — the station is worth more destroyed. The crew was expendable.',
  },
  escalationTrigger: {
    fr: 'Le réacteur se déstabilise — conséquence du sabotage de Vasquez. L\'IA de la station, programmée pour effacer les preuves, devient hostile.',
    en: 'The reactor destabilizes — consequence of Vasquez\'s sabotage. The station AI, programmed to destroy evidence, turns hostile.',
  },

  bossType: 'puzzle',

  primaryVictory: {
    type: 'activate_object',
    objectId: 'emergency_beacon',
    requiredItem: 'incriminating_files',
  },
  alternativeVictory: {
    type: 'self_destruct',
  },
  emergentVictoryHint: {
    fr: 'Le signal de la balise peut être rerouté par le réseau de communications... si vous avez les composants.',
    en: 'The beacon signal can be rerouted through the comms array... if you have the components.',
  },

  nodeLocations: {
    start: {
      locationRole: 'airlock',
      items: [
        { id: 'scanner_device' },
        { id: 'standard_toolkit' },
        { id: 'encrypted_data_core', hidden: true },
      ],
      features: [
        { id: 'docking_airlock', initialState: 'open' },
        { id: 'cargo_manifest_terminal', initialState: 'intact' },
        { id: 'docking_clamps', initialState: 'intact' },
      ],
      exits: ['unlock'],
    },
    unlock: {
      locationRole: 'control_room',
      items: [],
      features: [
        { id: 'encrypted_terminal', initialState: 'locked' },
        { id: 'maintenance_terminal', initialState: 'damaged' },
        { id: 'director_notes_clipboard', initialState: 'intact' },
      ],
      exits: ['start', 'reveal'],
    },
    reveal: {
      locationRole: 'quarters',
      items: [
        { id: 'director_keycard' },
        { id: 'incriminating_files' },
      ],
      features: [
        { id: 'director_terminal', initialState: 'intact' },
        { id: 'wall_safe', initialState: 'locked' },
        { id: 'evacuation_map', initialState: 'intact' },
      ],
      exits: ['unlock', 'escalation'],
    },
    escalation: {
      locationRole: 'hazard_zone',
      items: [],
      features: [
        { id: 'reactor_core', initialState: 'damaged' },
        { id: 'ai_core_node_a', initialState: 'intact' },
        { id: 'ai_core_node_b', initialState: 'intact' },
        { id: 'override_terminal', initialState: 'locked' },
      ],
      exits: ['reveal', 'boss'],
    },
    boss: {
      locationRole: 'control_room',
      items: [],
      features: [
        { id: 'emergency_beacon', initialState: 'locked' },
        { id: 'comms_array_panel', initialState: 'intact' },
        { id: 'ai_final_lock', initialState: 'intact' },
      ],
      exits: ['escalation', 'resolution'],
    },
    resolution: {
      locationRole: 'hub',
      items: [],
      features: [
        { id: 'beacon_transmission_screen', initialState: 'intact' },
      ],
      exits: ['boss'],
    },
  },

  additionalDefeatConditions: [
    { type: 'objective_destroyed' },
  ],
};
