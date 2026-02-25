// ---------------------------------------------------------------------------
// src/content/scenarios/escape.ts — ESCAPE skeleton: "Fuir l'Épave"
// ---------------------------------------------------------------------------
// Fantasy: Dead Space × Alien. Wake up, survive, get out.
// 6 core nodes, gate item: access_keycard, boss type: escape
// ---------------------------------------------------------------------------

import type { CoreSkeleton } from '@engine/scenario';

export const ESCAPE_SKELETON: CoreSkeleton = {
  id: 'escape',
  nameKey: { fr: 'Fuir l\'Épave', en: 'Escape the Wreck' },
  descriptionKey: {
    fr: 'Réveillez-vous seul dans les ruines d\'un vaisseau mourant. Les alarmes hurlent. L\'éclairage de secours rougeoie. Survivez. Fuyez.',
    en: 'Wake up alone in the ruins of a dying ship. Alarms scream. Emergency lighting glows red. Survive. Escape.',
  },

  nodes: [
    {
      id: 'start',
      role: 'entry',
      beat: 'intro',
      tension: 2,
      descriptionKey: {
        fr: 'Baie des Capsules Cryogéniques — Vous vous réveillez. Froide. Sombre. La capsule s\'est ouverte automatiquement. Pourquoi ?',
        en: 'Cryopod Bay — You wake up. Cold. Dark. The pod opened automatically. Why?',
      },
    },
    {
      id: 'unlock',
      role: 'gate',
      beat: 'rising',
      tension: 4,
      descriptionKey: {
        fr: 'Point de Contrôle de Sécurité — Une cloison blindée bloque le passage. Il faut un badge d\'accès, ou une autre solution.',
        en: 'Security Checkpoint — An armored bulkhead blocks the way. Need an access keycard, or another solution.',
      },
    },
    {
      id: 'reveal',
      role: 'midpoint',
      beat: 'midpoint',
      tension: 6,
      descriptionKey: {
        fr: 'Quartiers du Capitaine — Le journal de bord révèle tout. Vous êtes le dernier survivant. La créature est une arme expérimentale.',
        en: 'Captain\'s Quarters — The ship log reveals everything. You are the last survivor. The creature is an experimental weapon.',
      },
    },
    {
      id: 'escalation',
      role: 'escalation',
      beat: 'escalation',
      tension: 8,
      descriptionKey: {
        fr: 'Centre de Survie — La créature a endommagé le support vie. L\'O₂ baisse. Vous devez atteindre les pods d\'évasion avant d\'asphyxier.',
        en: 'Life Support Hub — The creature damaged life support. O₂ is dropping. Reach the escape pods before you asphyxiate.',
      },
    },
    {
      id: 'boss',
      role: 'climax',
      beat: 'climax',
      tension: 10,
      descriptionKey: {
        fr: 'Soute / Pont des Pods — La créature bloque le corridor des pods d\'évasion. C\'est elle ou vous.',
        en: 'Cargo Bay / Pod Deck — The creature blocks the escape pod corridor. It\'s her or you.',
      },
    },
    {
      id: 'resolution',
      role: 'epilogue',
      beat: 'resolution',
      tension: 3,
      descriptionKey: {
        fr: 'Pod d\'Évasion / Vide — Depuis le hublot, vous regardez le vaisseau rapetisser dans l\'obscurité.',
        en: 'Escape Pod / Void — Through the porthole, you watch the ship shrink into darkness.',
      },
    },
  ],

  gateItem: 'access_keycard',
  gateItemLocation: 'start',

  revelation: {
    fr: 'La créature est une arme bio-expérimentale — Projet ORACLE. L\'équipage a tenté de la confiner. Échec. Vous êtes le seul survivant.',
    en: 'The creature is a bio-experimental weapon — Project ORACLE. The crew tried to contain it. Failed. You are the last survivor.',
  },
  escalationTrigger: {
    fr: 'La créature a saboté le support vie. L\'O₂ chute dans tout le vaisseau. L\'éclairage s\'éteint par sections.',
    en: 'The creature sabotaged life support. O₂ drops ship-wide. Lighting dies section by section.',
  },

  bossType: 'escape',

  primaryVictory: {
    type: 'reach_location',
    locationId: 'resolution',
    requiredItem: 'access_keycard',
  },
  alternativeVictory: {
    type: 'environmental_kill',
    entityId: 'creature_oracle',
  },
  emergentVictoryHint: {
    fr: 'La soute peut être éjectée dans le vide. Si la créature est dedans...',
    en: 'The cargo bay can be jettisoned into the void. If the creature is inside...',
  },

  nodeLocations: {
    start: {
      locationRole: 'hub',
      items: [
        { id: 'emergency_flashlight' },
        { id: 'medkit_basic' },
        { id: 'access_keycard', hidden: true },
      ],
      features: [
        { id: 'cryopod', initialState: 'broken' },
        { id: 'status_terminal', initialState: 'damaged' },
        { id: 'emergency_locker', initialState: 'locked' },
      ],
      exits: ['unlock'],
    },
    unlock: {
      locationRole: 'control_room',
      items: [],
      features: [
        { id: 'security_panel', initialState: 'intact' },
        { id: 'bulkhead_door', initialState: 'locked' },
        { id: 'vent_cover', initialState: 'intact' },
      ],
      exits: ['start', 'reveal'],
    },
    reveal: {
      locationRole: 'quarters',
      items: [
        { id: 'captain_log_datapad' },
        { id: 'EVA_suit_locker_key', hidden: true },
      ],
      features: [
        { id: 'captain_terminal', initialState: 'intact' },
        { id: 'viewport', initialState: 'intact' },
        { id: 'EVA_suit_locker', initialState: 'locked' },
      ],
      exits: ['unlock', 'escalation'],
    },
    escalation: {
      locationRole: 'engineering',
      items: [
        { id: 'oxygen_canister', hidden: true },
      ],
      features: [
        { id: 'life_support_panel', initialState: 'damaged' },
        { id: 'o2_reroute_valve', initialState: 'intact' },
        { id: 'power_conduit', initialState: 'damaged' },
      ],
      exits: ['reveal', 'boss'],
    },
    boss: {
      locationRole: 'airlock',
      items: [],
      npcs: [
        { id: 'creature_oracle', disposition: 'hostile' },
      ],
      features: [
        { id: 'escape_pod_hatch', initialState: 'locked' },
        { id: 'cargo_jettison_lever', initialState: 'intact' },
        { id: 'hull_breach_panel', initialState: 'intact' },
      ],
      exits: ['escalation', 'resolution'],
    },
    resolution: {
      locationRole: 'passage',
      items: [],
      features: [
        { id: 'pod_viewport', initialState: 'intact' },
      ],
      exits: ['boss'],
    },
  },

  additionalDefeatConditions: [
    { type: 'time_expired', resource: 'o2' },
  ],
};
