// ---------------------------------------------------------------------------
// src/content/scenarios/modules/universal.ts — 5 Universal Modules
// ---------------------------------------------------------------------------
// These modules work in any setting (as long as role is supported).
// ---------------------------------------------------------------------------

import type { ScenarioModule, NarrativeSkin } from '@engine/scenario';

function ls(fr: string) { return { fr, en: '' }; }

// ---------------------------------------------------------------------------
// SHARED SKIN FACTORIES
// ---------------------------------------------------------------------------

function makeSkins(
  lowEntry: string, midEntry: string, highEntry: string,
  lowObs: string, midObs: string, highObs: string,
): [NarrativeSkin, NarrativeSkin, NarrativeSkin] {
  return [
    {
      tension: 'low', entryDescription: ls(lowEntry), revisitDescription: ls('Vous repassez par là.'),
      obstacleDescription: ls(lowObs), dcModifier: 0, suggestedPathPriority: ['INT', 'PER'],
      ambientSnippets: [ls('L\'air est immobile.'), ls('Un bourdonnement lointain.'), ls('Silence.'), ls('Poussiéreux, mais intact.')],
    },
    {
      tension: 'mid', entryDescription: ls(midEntry), revisitDescription: ls('L\'endroit vous semble différent maintenant.'),
      obstacleDescription: ls(midObs), dcModifier: 1, suggestedPathPriority: ['AGI', 'INT'],
      ambientSnippets: [ls('Le métal grince sous vos pieds.'), ls('Une lumière clignote.'), ls('Quelque chose a changé ici.'), ls('Tension dans l\'air.')],
    },
    {
      tension: 'high', entryDescription: ls(highEntry), revisitDescription: ls('Chaque seconde compte.'),
      obstacleDescription: ls(highObs), dcModifier: 2, suggestedPathPriority: ['FOR', 'AGI'],
      ambientSnippets: [ls('Sang. Frais.'), ls('Un bruit. Proche.'), ls('Fuyez ou combattez.'), ls('Pas le temps.')],
    },
  ];
}

// ---------------------------------------------------------------------------
// MODULE 1: blocked_passage_01 — Passage Bloqué
// ---------------------------------------------------------------------------

export const BLOCKED_PASSAGE_01: ScenarioModule = {
  id: 'blocked_passage_01',
  type: 'blocked_passage',
  validSegments: ['start-unlock', 'unlock-reveal'],
  tensionRange: [2, 7],
  compatibility: { universal: true },
  locations: [
    {
      id: 'main',
      role: 'passage',
      onCriticalPath: true,
      features: [
        { id: 'blocked_door', initialState: 'locked' },
        { id: 'vent_hatch', initialState: 'intact' },
        { id: 'security_panel_local', initialState: 'damaged' },
      ],
      items: [],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'blocked_door',
    description: ls('Une porte massive bloque le passage. Les mécanismes d\'ouverture sont grippés ou verrouillés.'),
    paths: [
      { id: 'force', stat: 'FOR', dc: 12, description: ls('Forcer la porte'), verbs: ['push', 'break', 'smash'] },
      { id: 'hack', stat: 'INT', dc: 11, description: ls('Pirater le panneau de sécurité'), verbs: ['hack', 'use', 'examine'] },
      { id: 'vent', stat: 'AGI', dc: 10, description: ls('Ramper dans le conduit de maintenance'), verbs: ['crawl', 'climb', 'squeeze'] },
    ],
    failsafeType: 'degraded_bypass',
  },
  skins: makeSkins(
    'Un couloir ordinaire. Une porte. Elle ne s\'ouvre pas.',
    'La porte est verrouillée. Et quelque chose approche de l\'autre côté.',
    'La porte. Maintenant. Trouvez un moyen.',
    'Elle cède peut-être avec assez de force, ou de finesse.',
    'Il faut passer. Vite. Trois options se présentent.',
    'Forcez-la. Piratez-la. Rampez. Choisissez maintenant.',
  ),
  locationRole: 'passage',
  locale: {
    fr: { entryPrefix: 'Vous entrez dans', obstaclePrefix: 'Un obstacle bloque', successSuffix: 'Le passage est libre.', failureSuffix: 'Pas encore.' },
    en: { entryPrefix: 'You enter', obstaclePrefix: 'An obstacle blocks', successSuffix: 'The way is clear.', failureSuffix: 'Not yet.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 2: wounded_survivor_01 — Survivant Blessé
// ---------------------------------------------------------------------------

export const WOUNDED_SURVIVOR_01: ScenarioModule = {
  id: 'wounded_survivor_01',
  type: 'npc_encounter',
  validSegments: ['start-unlock', 'unlock-reveal'],
  tensionRange: [2, 6],
  compatibility: { universal: true },
  locations: [
    {
      id: 'main',
      role: 'medical',
      onCriticalPath: true,
      features: [
        { id: 'medical_cabinet', initialState: 'locked' },
        { id: 'cot', initialState: 'intact' },
      ],
      items: [
        { id: 'medkit_basic' },
      ],
      npcs: [
        { id: 'wounded_crew_member', disposition: 'neutral' },
      ],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'wounded_crew_member',
    description: ls('Un membre d\'équipage blessé. Entre la peur et la souffrance, il possède des informations critiques — si vous pouvez établir le contact.'),
    paths: [
      { id: 'heal', stat: 'INT', dc: 10, description: ls('Soigner le blessé'), verbs: ['heal', 'use', 'treat'] },
      { id: 'persuade', stat: 'CHA', dc: 11, description: ls('Persuader pour obtenir des informations'), verbs: ['talk', 'persuade', 'calm'] },
      { id: 'intimidate', stat: 'CHA', dc: 13, description: ls('Intimider pour des réponses rapides'), verbs: ['intimidate', 'threaten'] },
      { id: 'loot', stat: 'AGI', dc: 9, description: ls('Fouiller discrètement et partir'), verbs: ['search', 'loot', 'take'] },
    ],
    failsafeType: 'narrative_rescue',
  },
  skins: makeSkins(
    'Une forme humaine dans l\'ombre. Elle respire.',
    'Quelqu\'un est blessé ici. Votre présence les a alertés.',
    'Un survivant. Blessé, terrifié. Chaque seconde sans soins les rapproche de la mort.',
    'Il peut parler si vous l\'aidez — ou si vous insistez.',
    'Vous pouvez le soigner, négocier, ou prendre ce dont vous avez besoin.',
    'Vite. Soignez-le, parlez-lui, ou saisissez ce qu\'il faut et partez.',
  ),
  locationRole: 'medical',
  locale: {
    fr: { entryPrefix: 'Vous entrez dans', obstaclePrefix: 'Un survivant', successSuffix: 'Contact établi.', failureSuffix: 'Il ne répond plus.' },
    en: { entryPrefix: 'You enter', obstaclePrefix: 'A survivor', successSuffix: 'Contact made.', failureSuffix: 'They no longer respond.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 3: dark_room_01 — Salle Plongée dans le Noir
// ---------------------------------------------------------------------------

export const DARK_ROOM_01: ScenarioModule = {
  id: 'dark_room_01',
  type: 'environmental',
  validSegments: ['start-unlock', 'unlock-reveal', 'reveal-escalation'],
  tensionRange: [3, 8],
  compatibility: { universal: true },
  locations: [
    {
      id: 'main',
      role: 'hub',
      onCriticalPath: true,
      features: [
        { id: 'light_fixture', initialState: 'broken' },
        { id: 'power_relay', initialState: 'damaged' },
        { id: 'emergency_glow_strip', initialState: 'intact' },
      ],
      items: [
        { id: 'emergency_flashlight', hidden: true },
      ],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'light_fixture',
    description: ls('Obscurité totale. Vous ne voyez pas à un mètre. Des bruits. Des formes. Peut-être des menaces.'),
    paths: [
      { id: 'find_light', stat: 'PER', dc: 10, description: ls('Chercher une source de lumière'), verbs: ['search', 'examine', 'look'] },
      { id: 'navigate_blind', stat: 'AGI', dc: 12, description: ls('Traverser à tâtons'), verbs: ['move', 'go', 'navigate'] },
      { id: 'repair_lights', stat: 'INT', dc: 11, description: ls('Réparer le réseau électrique'), verbs: ['repair', 'fix', 'hack'] },
      { id: 'brute', stat: 'FOR', dc: 13, description: ls('Avancer en force, quoi qu\'il arrive'), verbs: ['push', 'force', 'charge'] },
    ],
    failsafeType: 'degraded_bypass',
  },
  skins: makeSkins(
    'La lumière est éteinte ici. Vos yeux s\'adaptent lentement.',
    'Obscurité. Quelque chose se déplace dans le noir.',
    'Noir absolu. Vous ne savez pas ce qui attend là-dedans.',
    'Cherchez de la lumière ou trouvez votre chemin autrement.',
    'Réparez, trouvez une torche, ou traversez dans l\'obscurité.',
    'Maintenant. Dans le noir. Ou rebroussez chemin.',
  ),
  locationRole: 'hub',
  locale: {
    fr: { entryPrefix: 'Vous entrez dans', obstaclePrefix: 'L\'obscurité règne', successSuffix: 'Vous pouvez voir à nouveau.', failureSuffix: 'Le noir persiste.' },
    en: { entryPrefix: 'You enter', obstaclePrefix: 'Darkness rules', successSuffix: 'You can see again.', failureSuffix: 'The darkness persists.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 4: supply_cache_01 — Cache de Ravitaillement
// ---------------------------------------------------------------------------

export const SUPPLY_CACHE_01: ScenarioModule = {
  id: 'supply_cache_01',
  type: 'resource_cache',
  validSegments: ['start-unlock', 'unlock-reveal'],
  tensionRange: [2, 5],
  compatibility: { universal: true },
  locations: [
    {
      id: 'main',
      role: 'storage',
      onCriticalPath: true,
      features: [
        { id: 'supply_container', initialState: 'locked' },
        { id: 'inventory_manifest', initialState: 'intact' },
      ],
      items: [],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'supply_container',
    description: ls('Un conteneur de ravitaillement d\'urgence. Fermé. Ce qu\'il contient pourrait faire la différence.'),
    paths: [
      { id: 'unlock', stat: 'INT', dc: 10, description: ls('Crocheter ou déchiffrer le verrou'), verbs: ['hack', 'unlock', 'open'] },
      { id: 'break', stat: 'FOR', dc: 12, description: ls('Forcer l\'ouverture'), verbs: ['break', 'smash', 'force'] },
      { id: 'trade', stat: 'CHA', dc: 10, description: ls('Négocier avec un NPC présent'), verbs: ['talk', 'trade', 'persuade'] },
    ],
    failsafeType: 'alternate_route',
  },
  skins: makeSkins(
    'Un vieux conteneur de stockage. Il y a peut-être quelque chose d\'utile dedans.',
    'Un conteneur de secours. Fermé à clé. Ce qu\'il contient pourrait vous sauver.',
    'Temps compté. Le conteneur est là. Ouvrez-le.',
    'Peut-être une serrure simple, peut-être plus.',
    'Ouvrez-le vite — force ou technique.',
    'Forcez ou crochetez. Maintenant.',
  ),
  locationRole: 'storage',
  locale: {
    fr: { entryPrefix: 'Vous découvrez', obstaclePrefix: 'Un conteneur fermé', successSuffix: 'Le contenu est vôtre.', failureSuffix: 'Le conteneur résiste.' },
    en: { entryPrefix: 'You discover', obstaclePrefix: 'A locked container', successSuffix: 'The contents are yours.', failureSuffix: 'The container resists.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 5: ambush_01 — Embuscade
// ---------------------------------------------------------------------------

export const AMBUSH_01: ScenarioModule = {
  id: 'ambush_01',
  type: 'ambush',
  validSegments: ['unlock-reveal', 'reveal-escalation', 'escalation-boss'],
  tensionRange: [5, 9],
  compatibility: { universal: true },
  locations: [
    {
      id: 'main',
      role: 'passage',
      onCriticalPath: true,
      features: [
        { id: 'cover_crates', initialState: 'intact' },
        { id: 'ambush_choke_point', initialState: 'intact' },
        { id: 'ventilation_shaft', initialState: 'intact' },
      ],
      items: [],
      npcs: [
        { id: 'ambush_creature', disposition: 'hostile' },
      ],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'ambush_creature',
    description: ls('Quelque chose vous attendait. L\'embuscade est déclenchée. Réagissez.'),
    paths: [
      { id: 'fight', stat: 'FOR', dc: 13, description: ls('Combattre'), verbs: ['attack', 'fight', 'shoot'] },
      { id: 'flee', stat: 'AGI', dc: 12, description: ls('Fuir'), verbs: ['flee', 'run', 'escape'] },
      { id: 'bluff', stat: 'CHA', dc: 14, description: ls('Feindre la confiance'), verbs: ['bluff', 'talk', 'distract'] },
      { id: 'environment', stat: 'INT', dc: 12, description: ls('Utiliser l\'environnement'), verbs: ['use', 'trigger', 'throw'] },
    ],
    failsafeType: 'threat_escalation',
  },
  skins: makeSkins(
    'Quelque chose se déplace dans les ombres devant vous.',
    'Un bruit sec. Une silhouette. L\'embuscade est en cours.',
    'Elle jaillit de l\'obscurité. L\'embuscade. Réagissez maintenant.',
    'Vous avez le temps de choisir votre réponse.',
    'Combat, fuite, ou ruse — vite.',
    'Combat ou fuite. Maintenant. Pas le temps de penser.',
  ),
  locationRole: 'passage',
  locale: {
    fr: { entryPrefix: 'Vous entrez dans', obstaclePrefix: 'Embuscade !', successSuffix: 'Vous avez survécu.', failureSuffix: 'Vous n\'avez pas pu éviter les dommages.' },
    en: { entryPrefix: 'You enter', obstaclePrefix: 'Ambush!', successSuffix: 'You survived.', failureSuffix: 'You couldn\'t avoid the damage.' },
  },
};
