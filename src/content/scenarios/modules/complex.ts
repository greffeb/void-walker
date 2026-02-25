// ---------------------------------------------------------------------------
// src/content/scenarios/modules/complex.ts — 5 Complex Modules (High Tension)
// ---------------------------------------------------------------------------
// High-tension modules for segments C and D.
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
      ambientSnippets: [ls('Tension perceptible.'), ls('Méfiez-vous.'), ls('Quelque chose a changé.'), ls('Ce n\'est pas fini.')],
    },
    {
      tension: 'mid', entryDescription: ls(midEntry), revisitDescription: ls('La menace n\'a pas disparu.'),
      obstacleDescription: ls(midObs), dcModifier: 1, suggestedPathPriority: ['AGI', 'INT'],
      ambientSnippets: [ls('Du sang frais.'), ls('Un grondement.'), ls('Réfléchissez vite.'), ls('Danger imminent.')],
    },
    {
      tension: 'high', entryDescription: ls(highEntry), revisitDescription: ls('C\'est pire qu\'avant.'),
      obstacleDescription: ls(highObs), dcModifier: 2, suggestedPathPriority: ['FOR', 'AGI'],
      ambientSnippets: [ls('Hurlez intérieurement. Agissez.'), ls('Pas le temps. Bougez.'), ls('Tout peut finir ici.'), ls('Survivez.')],
    },
  ];
}

// ---------------------------------------------------------------------------
// MODULE 11: patrol_entity_01 — Entité en Patrouille
// ---------------------------------------------------------------------------

export const PATROL_ENTITY_01: ScenarioModule = {
  id: 'patrol_entity_01',
  type: 'patrol_enemy',
  validSegments: ['reveal-escalation', 'escalation-boss'],
  tensionRange: [6, 10],
  compatibility: { categories: ['space_vessel', 'facility', 'alien'] },
  locations: [
    {
      id: 'main',
      role: 'passage',
      onCriticalPath: true,
      features: [
        { id: 'patrol_zone', initialState: 'intact' },
        { id: 'stealth_cover', initialState: 'intact' },
        { id: 'distraction_point', initialState: 'intact' },
        { id: 'trap_spot', initialState: 'intact' },
      ],
      items: [],
      npcs: [
        { id: 'patrol_entity', disposition: 'hostile' },
      ],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'patrol_entity',
    description: ls('Une entité en patrouille. Elle couvre la zone de manière régulière. Passez sous son radar — ou forcez le passage.'),
    paths: [
      { id: 'stealth', stat: 'AGI', dc: 14, description: ls('Se faufiler discrètement'), verbs: ['sneak', 'hide', 'crawl'] },
      { id: 'fight', stat: 'FOR', dc: 15, description: ls('Attaquer frontalement'), verbs: ['attack', 'fight', 'shoot'] },
      { id: 'distract', stat: 'INT', dc: 12, description: ls('Créer une distraction pour l\'attirer ailleurs'), verbs: ['throw', 'distract', 'use'] },
      { id: 'lure', stat: 'CHA', dc: 13, description: ls('L\'attirer dans un autre couloir'), verbs: ['lure', 'call', 'signal'] },
      { id: 'trap', stat: 'INT', dc: 14, description: ls('Poser un piège dans sa trajectoire'), verbs: ['set', 'trap', 'prepare'] },
    ],
    failsafeType: 'narrative_rescue',
  },
  skins: makeSkins(
    'Quelque chose surveille ce couloir. Son rythme est régulier.',
    'L\'entité patrouille. Elle n\'a pas encore détecté votre présence.',
    'Elle est LÀ. En patrouille. Proche. Attendez ou agissez.',
    'Vous pouvez la contourner — avec soin.',
    'Furtivité, distraction, ou affrontement direct.',
    'Furtivité ou combat. Vite, avant qu\'elle revienne.',
  ),
  locationRole: 'passage',
  locale: {
    fr: { entryPrefix: 'Vous entrez prudemment dans', obstaclePrefix: 'Une entité en patrouille', successSuffix: 'Vous avez dépassé la patrouille.', failureSuffix: 'L\'entité vous a repéré.' },
    en: { entryPrefix: 'You cautiously enter', obstaclePrefix: 'A patrolling entity', successSuffix: 'You passed the patrol.', failureSuffix: 'The entity spotted you.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 12: flooded_section_01 — Section Inondée
// ---------------------------------------------------------------------------

export const FLOODED_SECTION_01: ScenarioModule = {
  id: 'flooded_section_01',
  type: 'environmental',
  validSegments: ['reveal-escalation', 'escalation-boss'],
  tensionRange: [6, 9],
  compatibility: { categories: ['space_vessel', 'facility'] },
  locations: [
    {
      id: 'main',
      role: 'hazard_zone',
      onCriticalPath: true,
      features: [
        { id: 'flood_zone', initialState: 'damaged' },
        { id: 'valve_control', initialState: 'intact' },
        { id: 'pipe_reroute', initialState: 'damaged' },
        { id: 'submerged_passage', initialState: 'intact' },
      ],
      items: [],
      atmosphere: 'low_oxygen',
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'flood_zone',
    description: ls('La section est noyée sous un mètre d\'eau chargée de résidus chimiques. Les câbles électriques immergés rendent le passage du côté force extrêmement dangereux.'),
    paths: [
      { id: 'valve', stat: 'INT', dc: 13, description: ls('Trouver et fermer la vanne d\'alimentation'), verbs: ['use', 'turn', 'close'] },
      { id: 'swim', stat: 'FOR', dc: 14, description: ls('Nager à travers (risque électrique)'), verbs: ['swim', 'wade', 'cross'] },
      { id: 'swim_agi', stat: 'AGI', dc: 12, description: ls('Traverser avec agilité en évitant les câbles'), verbs: ['swim', 'dodge', 'cross'] },
      { id: 'reroute_pipes', stat: 'INT', dc: 15, description: ls('Réacheminer la plomberie pour drainer la section'), verbs: ['repair', 'reroute', 'fix'] },
    ],
    failsafeType: 'degraded_bypass',
  },
  skins: makeSkins(
    'Une légère accumulation d\'eau. La vanne fuit quelque part.',
    'La section est à moitié submergée. Des câbles flottent dans l\'eau.',
    'Inondation. Câbles sous tension. Passage dangereux dans les deux sens.',
    'Trouvez la vanne ou traversez avec soin.',
    'Vanne, nage habile, ou réacheminement — mais pas le passage électrifié imprudent.',
    'Traversez maintenant. Vite. Prudemment.',
  ),
  locationRole: 'hazard_zone',
  locale: {
    fr: { entryPrefix: 'Vous atteignez', obstaclePrefix: 'Section inondée', successSuffix: 'Vous avez traversé.', failureSuffix: 'La traversée a coûté.' },
    en: { entryPrefix: 'You reach', obstaclePrefix: 'Flooded section', successSuffix: 'You crossed it.', failureSuffix: 'The crossing cost you.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 13: survivor_rescue_01 — Sauvetage d'un Survivant Piégé
// ---------------------------------------------------------------------------

export const SURVIVOR_RESCUE_01: ScenarioModule = {
  id: 'survivor_rescue_01',
  type: 'rescue',
  validSegments: ['unlock-reveal', 'reveal-escalation'],
  tensionRange: [5, 8],
  compatibility: { categories: ['space_vessel', 'facility'] },
  locations: [
    {
      id: 'main',
      role: 'quarters',
      onCriticalPath: true,
      features: [
        { id: 'debris_trap', initialState: 'intact' },
        { id: 'restraint_lock', initialState: 'locked' },
        { id: 'structural_beam', initialState: 'damaged' },
      ],
      items: [],
      npcs: [
        { id: 'trapped_survivor', disposition: 'neutral', hpOverride: 3 },
      ],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'trapped_survivor',
    description: ls('Un survivant piégé sous des débris ou derrière une porte verrouillée. Libérez-le — il peut devenir un allié temporaire, ou mourir si vous n\'agissez pas.'),
    paths: [
      { id: 'cut', stat: 'FOR', dc: 11, description: ls('Couper les restraintes ou déplacer les débris'), verbs: ['cut', 'break', 'move'] },
      { id: 'hack_lock', stat: 'INT', dc: 12, description: ls('Pirater la serrure'), verbs: ['hack', 'unlock', 'open'] },
      { id: 'calm', stat: 'CHA', dc: 10, description: ls('Calmer le survivant et guider sa libération'), verbs: ['talk', 'calm', 'guide'] },
    ],
    failsafeType: 'narrative_rescue',
  },
  skins: makeSkins(
    'Quelqu\'un est piégé ici. Pas de danger immédiat pour vous.',
    'Un survivant est pris au piège. Vous entendez sa voix, faible.',
    'Survivant piégé. Vous avez peu de temps avant que sa situation empire.',
    'Plusieurs façons de le libérer — force, technique, ou persuasion.',
    'Libérez-le vite — force, piratage, ou paroles apaisantes.',
    'Libérez-le maintenant. Il n\'a plus beaucoup de temps.',
  ),
  locationRole: 'quarters',
  locale: {
    fr: { entryPrefix: 'Vous entrez dans', obstaclePrefix: 'Un survivant est piégé', successSuffix: 'Le survivant est libre.', failureSuffix: 'Le survivant n\'a pas pu être libéré.' },
    en: { entryPrefix: 'You enter', obstaclePrefix: 'A survivor is trapped', successSuffix: 'The survivor is free.', failureSuffix: 'The survivor couldn\'t be freed.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 14: terminal_decrypt_01 — Décryptage de Terminal
// ---------------------------------------------------------------------------

export const TERMINAL_DECRYPT_01: ScenarioModule = {
  id: 'terminal_decrypt_01',
  type: 'terminal_puzzle',
  validSegments: ['unlock-reveal', 'reveal-escalation'],
  tensionRange: [4, 8],
  compatibility: { categories: ['space_vessel', 'facility'] },
  locations: [
    {
      id: 'main',
      role: 'control_room',
      onCriticalPath: true,
      features: [
        { id: 'encrypted_terminal', initialState: 'locked' },
        { id: 'log_archive', initialState: 'intact' },
      ],
      items: [
        { id: 'data_chip', hidden: true },
      ],
    },
  ],
  sideRooms: [
    {
      id: 'server_side',
      role: 'server_room',
      onCriticalPath: false,
      features: [
        { id: 'backup_server', initialState: 'damaged' },
        { id: 'physical_log_binder', initialState: 'intact' },
      ],
      items: [
        { id: 'access_password_note', hidden: true },
      ],
    },
  ],
  obstacle: {
    targetId: 'encrypted_terminal',
    description: ls('Un terminal chiffré à plusieurs couches. La procédure complète : trouver le mot de passe dans les archives, pirater l\'accès, ou faire parler un opérateur restant. Révèle des données lore + accès à une Black Box optionnelle.'),
    paths: [
      { id: 'find_password', stat: 'PER', dc: 11, description: ls('Trouver le mot de passe dans les journaux'), verbs: ['search', 'examine', 'read'] },
      { id: 'hack', stat: 'INT', dc: 13, description: ls('Pirater directement'), verbs: ['hack', 'bypass', 'crack'] },
      { id: 'social', stat: 'CHA', dc: 12, description: ls('Faire parler un opérateur ou une IA encore active'), verbs: ['talk', 'persuade', 'ask'] },
    ],
    failsafeType: 'alternate_route',
  },
  skins: makeSkins(
    'Un terminal. Chiffré, mais pas impossible.',
    'Terminal chiffré. Les données dedans pourraient changer la donne.',
    'Terminal sous haute sécurité. Décryptez ou cherchez un autre moyen.',
    'Cherchez le mot de passe, hackez, ou faites parler quelqu\'un.',
    'Trois approches : perquisition, piratage, social.',
    'Ouvrez-le. Maintenant. Les données à l\'intérieur valent le risque.',
  ),
  locationRole: 'control_room',
  locale: {
    fr: { entryPrefix: 'Vous découvrez', obstaclePrefix: 'Terminal chiffré', successSuffix: 'Les données sont accessibles.', failureSuffix: 'Le terminal résiste au décryptage.' },
    en: { entryPrefix: 'You discover', obstaclePrefix: 'Encrypted terminal', successSuffix: 'Data is accessible.', failureSuffix: 'The terminal resists decryption.' },
  },
};

// ---------------------------------------------------------------------------
// MODULE 15: explosive_decompression_risk_01 — Risque de Décompression Explosive
// ---------------------------------------------------------------------------

export const EXPLOSIVE_DECOMPRESSION_RISK_01: ScenarioModule = {
  id: 'explosive_decompression_risk_01',
  type: 'blocked_passage',
  validSegments: ['reveal-escalation', 'escalation-boss'],
  tensionRange: [7, 10],
  compatibility: { categories: ['space_vessel', 'facility'] },
  locations: [
    {
      id: 'main',
      role: 'airlock',
      onCriticalPath: true,
      features: [
        { id: 'weakened_hull_section', initialState: 'damaged' },
        { id: 'careful_path_markers', initialState: 'intact' },
        { id: 'seal_point', initialState: 'intact' },
      ],
      items: [],
      atmosphere: 'low_oxygen',
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'weakened_hull_section',
    description: ls('Le passage avant présente un risque de décompression explosive. La coque est fragilisée. Tout mouvement brutal peut provoquer une brèche. Traversez avec méthode — ou acceptez les conséquences.'),
    paths: [
      { id: 'careful', stat: 'INT', dc: 14, description: ls('Traverser avec méthode, en testant chaque point d\'appui'), verbs: ['move', 'crawl', 'cross'] },
      { id: 'reckless', stat: 'FOR', dc: 12, description: ls('Forcer le passage rapidement (perte O₂/PV)'), verbs: ['run', 'charge', 'rush'], isCreative: false },
      { id: 'seal', stat: 'INT', dc: 13, description: ls('Colmater le point faible pour sécuriser le passage'), verbs: ['seal', 'repair', 'weld'] },
    ],
    failsafeType: 'degraded_bypass',
  },
  skins: makeSkins(
    'Un passage avec quelques zones fragilisées. Soyez prudent.',
    'Le passage est dangereux. La coque pourrait céder.',
    'Risque de décompression explosive immédiat. Un seul faux mouvement.',
    'Traversez avec soin — ou trouvez un autre chemin.',
    'Méthode, force brute avec conséquences, ou colmatage préventif.',
    'Traversez. Maintenant. Prudemment. Un faux pas et c\'est la décompression.',
  ),
  locationRole: 'airlock',
  locale: {
    fr: { entryPrefix: 'Vous atteignez', obstaclePrefix: 'Zone de décompression', successSuffix: 'Passage sécurisé.', failureSuffix: 'La traversée a coûté.' },
    en: { entryPrefix: 'You reach', obstaclePrefix: 'Decompression zone', successSuffix: 'Passage secured.', failureSuffix: 'The crossing cost you.' },
  },
};
