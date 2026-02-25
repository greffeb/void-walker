// ---------------------------------------------------------------------------
// src/content/scenarios/modules/category.ts — 5 Category Modules
// ---------------------------------------------------------------------------
// These modules work only in specific setting categories.
// ---------------------------------------------------------------------------

import type { ScenarioModule, NarrativeSkin } from '@engine/scenario';

function ls(fr: string) { return { fr, en: '' }; }

function makeSkins(
  lowEntry: string, midEntry: string, highEntry: string,
  lowObs: string, midObs: string, highObs: string,
): [NarrativeSkin, NarrativeSkin, NarrativeSkin] {
  return [
    {
      tension: 'low', entryDescription: ls(lowEntry), revisitDescription: ls('De retour ici.'),
      obstacleDescription: ls(lowObs), dcModifier: 0, suggestedPathPriority: ['INT', 'PER'],
      ambientSnippets: [ls('Calme technique.'), ls('Systèmes en veille.'), ls('Bruit de fond.'), ls('Stable pour l\'instant.')],
    },
    {
      tension: 'mid', entryDescription: ls(midEntry), revisitDescription: ls('La situation a changé.'),
      obstacleDescription: ls(midObs), dcModifier: 1, suggestedPathPriority: ['AGI', 'INT'],
      ambientSnippets: [ls('Alarme lointaine.'), ls('Pression anormale.'), ls('Les systèmes montrent des anomalies.'), ls('Quelque chose cloche.')],
    },
    {
      tension: 'high', entryDescription: ls(highEntry), revisitDescription: ls('Plus de temps à perdre.'),
      obstacleDescription: ls(highObs), dcModifier: 2, suggestedPathPriority: ['FOR', 'AGI'],
      ambientSnippets: [ls('Urgence.'), ls('Ça se dégrade vite.'), ls('Agissez maintenant.'), ls('Chaque seconde compte.')],
    },
  ];
}

// ---------------------------------------------------------------------------
// MODULE 6: airlock_malfunction_01 — Défaillance du Sas
// ---------------------------------------------------------------------------

export const AIRLOCK_MALFUNCTION_01: ScenarioModule = {
  id: 'airlock_malfunction_01',
  type: 'environmental',
  validSegments: ['unlock-reveal', 'reveal-escalation'],
  tensionRange: [4, 8],
  compatibility: { categories: ['space_vessel', 'facility'] },
  locations: [
    {
      id: 'main',
      role: 'airlock',
      onCriticalPath: true,
      features: [
        { id: 'airlock_breach', initialState: 'damaged' },
        { id: 'weld_point', initialState: 'intact' },
        { id: 'override_panel', initialState: 'damaged' },
      ],
      items: [],
      atmosphere: 'low_oxygen',
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'airlock_breach',
    description: ls('Une brèche dans l\'airlock. L\'air s\'échappe. Si vous ne la colmatez pas, l\'atmosphère va se raréfier rapidement.'),
    paths: [
      { id: 'weld', stat: 'FOR', dc: 13, description: ls('Souder la brèche au chalumeau'), verbs: ['weld', 'seal', 'repair'] },
      { id: 'override', stat: 'INT', dc: 12, description: ls('Activer le protocole d\'urgence via le panneau'), verbs: ['hack', 'use', 'activate'] },
      { id: 'eva', stat: 'AGI', dc: 0, description: ls('Utiliser la combinaison EVA (succès automatique si disponible)'), verbs: ['wear', 'use', 'equip'], requiredItem: 'EVA_suit' },
    ],
    failsafeType: 'degraded_bypass',
  },
  skins: makeSkins(
    'Un sas avec une légère anomalie de pression. Rien d\'urgent.',
    'Le sas présente une brèche active. L\'O₂ fuit.',
    'Brèche critique. Colmatez maintenant ou asphyxiez.',
    'Plusieurs méthodes pour sceller la fuite.',
    'Vite — soudez, neutralisez le panneau, ou utilisez votre combinaison.',
    'Colmatez ou mourez. Tout de suite.',
  ),
  locationRole: 'airlock',
  locale: {
    fr: { entryPrefix: 'Vous accédez au', obstaclePrefix: 'Brèche atmosphérique', successSuffix: 'L\'atmosphère est stable.', failureSuffix: 'L\'air continue de fuir.' },
    en: { entryPrefix: 'You access the', obstaclePrefix: 'Atmospheric breach', successSuffix: 'Atmosphere stabilized.', failureSuffix: 'Air continues to leak.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 7: malfunctioning_android_01 — Androïde Défaillant
// ---------------------------------------------------------------------------

export const MALFUNCTIONING_ANDROID_01: ScenarioModule = {
  id: 'malfunctioning_android_01',
  type: 'npc_encounter',
  validSegments: ['start-unlock', 'unlock-reveal'],
  tensionRange: [3, 7],
  compatibility: { categories: ['space_vessel', 'facility'] },
  locations: [
    {
      id: 'main',
      role: 'engineering',
      onCriticalPath: true,
      features: [
        { id: 'android_station', initialState: 'damaged' },
        { id: 'override_port', initialState: 'intact' },
        { id: 'power_shutoff', initialState: 'intact' },
      ],
      items: [
        { id: 'android_override_code', hidden: true },
      ],
      npcs: [
        { id: 'malfunctioning_android', disposition: 'hostile' },
      ],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'malfunctioning_android',
    description: ls('Un androïde de service dont la programmation a déraillé. Il considère tout intrus comme une menace. Neutralisez-le ou trouvez un moyen de le contourner.'),
    paths: [
      { id: 'reason', stat: 'CHA', dc: 12, description: ls('Raisonner avec ses protocoles de sécurité'), verbs: ['talk', 'persuade', 'calm'] },
      { id: 'disable', stat: 'INT', dc: 13, description: ls('Accéder au port de neutralisation'), verbs: ['hack', 'disable', 'use'] },
      { id: 'fight', stat: 'FOR', dc: 14, description: ls('Combattre physiquement'), verbs: ['attack', 'fight', 'smash'] },
      { id: 'code', stat: 'PER', dc: 11, description: ls('Trouver le code d\'arrêt dans ses fichiers'), verbs: ['search', 'examine', 'look'] },
    ],
    failsafeType: 'narrative_rescue',
  },
  skins: makeSkins(
    'Un androïde de maintenance agit de façon erratique dans le couloir.',
    'L\'androïde vous détecte. Son comportement est anormal — il est en boucle d\'erreur.',
    'L\'androïde est en mode protection maximale. Il vous attaquera si vous approchez.',
    'Parlez-lui, piratez-le, ou trouvez son code d\'arrêt.',
    'Raisonnez-le, désactivez-le, ou combattez-le.',
    'Neutralisez-le immédiatement — par la parole, le piratage, ou la force.',
  ),
  locationRole: 'engineering',
  locale: {
    fr: { entryPrefix: 'Vous entrez dans', obstaclePrefix: 'Un androïde défaillant', successSuffix: 'L\'androïde est neutralisé.', failureSuffix: 'L\'androïde est toujours actif.' },
    en: { entryPrefix: 'You enter', obstaclePrefix: 'A malfunctioning android', successSuffix: 'The android is neutralized.', failureSuffix: 'The android is still active.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 8: alien_mechanism_01 — Mécanisme Extraterrestre
// ---------------------------------------------------------------------------

export const ALIEN_MECHANISM_01: ScenarioModule = {
  id: 'alien_mechanism_01',
  type: 'terminal_puzzle',
  validSegments: ['unlock-reveal', 'reveal-escalation'],
  tensionRange: [4, 8],
  compatibility: { categories: ['alien'] },
  locations: [
    {
      id: 'main',
      role: 'ritual_chamber',
      onCriticalPath: true,
      features: [
        { id: 'alien_mechanism', initialState: 'intact' },
        { id: 'symbol_panel_a', initialState: 'intact' },
        { id: 'symbol_panel_b', initialState: 'intact' },
        { id: 'psionic_node', initialState: 'intact' },
      ],
      items: [
        { id: 'translator_device', hidden: true },
      ],
    },
  ],
  sideRooms: [
    {
      id: 'side_study',
      role: 'crystal_cave',
      onCriticalPath: false,
      features: [
        { id: 'alien_inscription', initialState: 'intact' },
        { id: 'void_shard', initialState: 'intact' },
      ],
      items: [
        { id: 'translator_device' },
      ],
    },
  ],
  obstacle: {
    targetId: 'alien_mechanism',
    description: ls('Un mécanisme extraterrestre d\'une technologie incompréhensible. Il pulse doucement. Il attend quelque chose.'),
    paths: [
      { id: 'decipher', stat: 'INT', dc: 14, description: ls('Déchiffrer les symboles et activer la séquence'), verbs: ['examine', 'study', 'decipher'] },
      { id: 'force_activate', stat: 'FOR', dc: 12, description: ls('Forcer l\'activation en brute'), verbs: ['push', 'activate', 'press'] },
      { id: 'psionic', stat: 'CHA', dc: 13, description: ls('Attunement psionic avec le mécanisme'), verbs: ['pray', 'touch', 'focus', 'concentrate'] },
    ],
    failsafeType: 'alternate_route',
  },
  skins: makeSkins(
    'Un objet alien. Mystérieux, pas immédiatement menaçant.',
    'Le mécanisme alien pulse. Il réagit à votre présence.',
    'Le mécanisme alien s\'intensifie. Il faut agir maintenant.',
    'Prenez le temps de comprendre — ou tentez votre chance.',
    'Déchiffrez, forcez, ou accordez-vous à lui.',
    'Activez-le. Maintenant. N\'importe comment.',
  ),
  locationRole: 'ritual_chamber',
  locale: {
    fr: { entryPrefix: 'Vous entrez dans', obstaclePrefix: 'Un mécanisme alien', successSuffix: 'Le mécanisme réagit.', failureSuffix: 'Le mécanisme reste inerte.' },
    en: { entryPrefix: 'You enter', obstaclePrefix: 'An alien mechanism', successSuffix: 'The mechanism responds.', failureSuffix: 'The mechanism remains inert.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 9: containment_breach_01 — Brèche de Confinement
// ---------------------------------------------------------------------------

export const CONTAINMENT_BREACH_01: ScenarioModule = {
  id: 'containment_breach_01',
  type: 'environmental',
  validSegments: ['reveal-escalation', 'escalation-boss'],
  tensionRange: [6, 9],
  compatibility: { categories: ['facility'] },
  locations: [
    {
      id: 'main',
      role: 'hazard_zone',
      onCriticalPath: true,
      features: [
        { id: 'containment_field', initialState: 'broken' },
        { id: 'resealing_unit', initialState: 'damaged' },
        { id: 'evacuation_panel', initialState: 'intact' },
      ],
      items: [],
      atmosphere: 'toxic_atmosphere',
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'containment_field',
    description: ls('Le champ de confinement est tombé. Un spécimen — ou pire — s\'est échappé. L\'atmosphère est compromise.'),
    paths: [
      { id: 'reseal', stat: 'INT', dc: 14, description: ls('Restaurer le champ de confinement'), verbs: ['repair', 'restore', 'activate'] },
      { id: 'evacuate', stat: 'AGI', dc: 12, description: ls('Évacuer la section avant d\'être affecté'), verbs: ['flee', 'evacuate', 'run'] },
      { id: 'fight_specimen', stat: 'FOR', dc: 15, description: ls('Combattre le spécimen échappé'), verbs: ['attack', 'fight', 'shoot'] },
    ],
    failsafeType: 'threat_escalation',
  },
  skins: makeSkins(
    'Une alarme discrète. Le champ de confinement montre des signes de faiblesse.',
    'La brèche est active. L\'atmosphère se détériore. Agissez vite.',
    'Confinement rompu. Danger immédiat. Chaque seconde aggrave la situation.',
    'Signes de problème — le champ peut encore être restauré.',
    'Restaurez le confinement, fuyez, ou affrontez ce qui s\'est échappé.',
    'Restaurez ou fuyez. L\'atmosphère vous tue si vous restez.',
  ),
  locationRole: 'hazard_zone',
  locale: {
    fr: { entryPrefix: 'Vous pénétrez dans', obstaclePrefix: 'Brèche de confinement', successSuffix: 'La situation est sous contrôle.', failureSuffix: 'La brèche persiste.' },
    en: { entryPrefix: 'You enter', obstaclePrefix: 'Containment breach', successSuffix: 'Situation under control.', failureSuffix: 'The breach persists.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 10: power_reroute_dilemma_01 — Dilemme du Réacheminement
// ---------------------------------------------------------------------------

export const POWER_REROUTE_DILEMMA_01: ScenarioModule = {
  id: 'power_reroute_dilemma_01',
  type: 'moral_choice',
  validSegments: ['unlock-reveal'],
  tensionRange: [4, 7],
  compatibility: { categories: ['space_vessel', 'facility'] },
  locations: [
    {
      id: 'main',
      role: 'control_room',
      onCriticalPath: true,
      features: [
        { id: 'power_distribution_panel', initialState: 'damaged' },
        { id: 'medbay_feed_circuit', initialState: 'intact' },
        { id: 'door_feed_circuit', initialState: 'damaged' },
      ],
      items: [],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'power_distribution_panel',
    description: ls('Le panneau de distribution est endommagé. Vous pouvez réacheminer l\'énergie vers le sas (ouvre votre chemin, le survivant dans l\'infirmerie meurt) ou vers l\'infirmerie (sauve le survivant, votre chemin reste bloqué).'),
    paths: [
      { id: 'reroute_to_doors', stat: 'INT', dc: 11, description: ls('Réacheminer vers les portes — votre chemin s\'ouvre'), verbs: ['reroute', 'use', 'repair', 'hack'] },
      { id: 'reroute_to_medbay', stat: 'INT', dc: 11, description: ls('Réacheminer vers l\'infirmerie — le survivant est sauvé'), verbs: ['reroute', 'use', 'repair', 'hack'] },
      { id: 'override_both', stat: 'INT', dc: 16, description: ls('Trouver un compromis instable (très difficile)'), verbs: ['hack', 'override', 'improvise'] },
    ],
    failsafeType: 'alternate_route',
  },
  skins: makeSkins(
    'Un panneau de distribution d\'énergie. Il y a un choix à faire.',
    'Le panneau est là. Ce que vous choisirez aura des conséquences.',
    'Un panneau. Un choix. Quelqu\'un en paiera le prix.',
    'Deux options, un coût moral. Réfléchissez.',
    'Portes ou infirmerie. L\'une ou l\'autre — pas les deux.',
    'Maintenant. Choisissez. Il n\'y a pas de bonne réponse.',
  ),
  locationRole: 'control_room',
  locale: {
    fr: { entryPrefix: 'Vous entrez dans', obstaclePrefix: 'Dilemme énergétique', successSuffix: 'Décision prise.', failureSuffix: 'Impossible de satisfaire les deux.' },
    en: { entryPrefix: 'You enter', obstaclePrefix: 'Power dilemma', successSuffix: 'Decision made.', failureSuffix: 'Cannot satisfy both.' },
  },
};
