// ---------------------------------------------------------------------------
// src/content/scenarios/modules/universal.ts — 5 Universal Modules
// ---------------------------------------------------------------------------
// These modules work in any setting (as long as role is supported).
// ---------------------------------------------------------------------------

import type { ScenarioModule, NarrativeSkin, ScenarioFeatureDefinition } from '@engine/scenario';

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
        {
          id: 'blocked_door',
          featureType: 'door',
          initialState: 'locked',
          aliases: {
            fr: ['porte', 'porte bloquée', 'porte bloquee', 'porte renforcée', 'porte renforcee'],
            en: ['door', 'blocked door', 'reinforced door'],
          },
          examineResult: { fr: 'Une porte renforcée en alliage. Le mécanisme d\'ouverture est bloqué — grippage mécanique ou verrouillage de sécurité. Des marques de griffes entourent le cadre. Le panneau de contrôle adjacent semble encore alimenté. En bas, une trappe de ventilation pourrait offrir une alternative.', en: '' },
          descriptions: {
            locked: { fr: 'porte bloquée', en: '' },
            open: { fr: 'porte ouverte', en: '' },
          },
          interactions: [
            // OPEN when panel has been bypassed → auto-success
            {
              trigger: { verb: 'OPEN', requiredState: 'locked', requiredFlag: 'panel_bypassed', dc: null },
              onSuccess: {
                newState: 'open',
                resolveObstacle: true,
                narrative: { fr: 'Grâce au panneau court-circuité, la porte s\'ouvre sans résistance. Le passage est libre.', en: '' },
              },
            },
            // OPEN without flag → hint to use other methods
            {
              trigger: { verb: 'OPEN', requiredState: 'locked', dc: null },
              onSuccess: {
                narrative: { fr: 'La porte est verrouillée. Le mécanisme refuse de répondre. Il faudrait forcer le passage, pirater le panneau de sécurité, ou trouver une autre voie.', en: '' },
              },
            },
            {
              trigger: { verb: ['PUSH', 'FORCE_OPEN', 'BREAK'], requiredState: 'locked', stat: 'FOR', dc: 12 },
              onSuccess: {
                newState: 'open',
                resolveObstacle: true,
                narrative: { fr: 'Vous forcez la porte avec un grognement d\'effort. Le métal cède dans un crissement strident. Le passage est libre.', en: '' },
              },
              onFailure: {
                narrative: { fr: 'La porte résiste. Vos muscles brûlent mais elle ne bouge pas d\'un millimètre. Il faudra une autre approche.', en: '' },
              },
            },
            {
              trigger: { verb: ['HACK', 'USE', 'REPAIR'], requiredState: 'locked', stat: 'INT', dc: 11 },
              onSuccess: {
                newState: 'open',
                resolveObstacle: true,
                narrative: { fr: 'Vous court-circuitez le panneau de sécurité. Un déclic, puis la porte coulisse lentement. Le chemin s\'ouvre.', en: '' },
              },
              onFailure: {
                narrative: { fr: 'Les circuits crépitent mais le verrouillage tient bon. Le système de sécurité est plus robuste que prévu.', en: '' },
              },
            },
          ],
        } satisfies ScenarioFeatureDefinition as ScenarioFeatureDefinition,
        {
          id: 'vent_hatch',
          featureType: 'vent',
          initialState: 'closed',
          aliases: {
            fr: ['trappe', 'trappe ventilation', 'trappe de ventilation', 'ventilation', 'conduit', 'conduit ventilation', 'aeration', 'bouche'],
            en: ['hatch', 'vent', 'vent hatch', 'ventilation', 'duct'],
          },
          examineResult: { fr: 'Trappe de ventilation au ras du sol. Étroite mais praticable pour quelqu\'un de souple. De l\'air circule — elle mène bien de l\'autre côté.', en: '' },
          descriptions: {
            closed: { fr: 'trappe de ventilation', en: '' },
            open: { fr: 'trappe de ventilation ouverte', en: '' },
          },
          interactions: [
            {
              trigger: { verb: 'OPEN', requiredState: 'closed', dc: null },
              onSuccess: {
                newState: 'open',
                narrative: { fr: 'Vous ouvrez la trappe de ventilation. Un courant d\'air frais s\'échappe du conduit sombre qui s\'ouvre devant vous.', en: '' },
              },
            },
            {
              trigger: { verb: 'CLIMB', requiredState: 'open', stat: 'AGI', dc: 10 },
              onSuccess: {
                resolveObstacle: true,
                narrative: { fr: 'Vous vous glissez dans le conduit de ventilation. L\'espace est étroit, mais vous parvenez à ramper jusqu\'à l\'autre côté.', en: '' },
              },
              onFailure: {
                narrative: { fr: 'Le conduit est trop étroit. Vous vous coincez un instant avant de reculer, griffé par les parois métalliques.', en: '' },
                consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
              },
            },
            {
              trigger: { verb: 'CLIMB', requiredState: 'closed', dc: null },
              onSuccess: {
                narrative: { fr: 'La trappe est fermée. Il faudrait d\'abord l\'ouvrir.', en: '' },
              },
            },
          ],
        } satisfies ScenarioFeatureDefinition as ScenarioFeatureDefinition,
        {
          id: 'security_panel_local',
          featureType: 'panel',
          initialState: 'damaged',
          aliases: {
            fr: ['panneau', 'panneau securite', 'panneau de securite', 'panneau controle', 'panneau de controle', 'controle', 'securite'],
            en: ['panel', 'security panel', 'control panel'],
          },
          examineResult: { fr: 'Panneau de contrôle endommagé. Certains circuits sont encore actifs — un technicien compétent pourrait court-circuiter le verrouillage de la porte.', en: '' },
          descriptions: {
            damaged: { fr: 'panneau de sécurité local', en: '' },
            bypassed: { fr: 'panneau de sécurité court-circuité', en: '' },
          },
          interactions: [
            {
              trigger: { verb: ['HACK', 'OVERRIDE', 'REPAIR'], requiredState: 'damaged', stat: 'INT', dc: 11 },
              onSuccess: {
                newState: 'bypassed',
                flagSet: 'panel_bypassed',
                narrative: { fr: 'Vous court-circuitez le panneau de sécurité. Un voyant passe au vert — le verrouillage de la porte est désactivé. Vous pouvez maintenant l\'ouvrir.', en: '' },
              },
              onFailure: {
                narrative: { fr: 'Les circuits crépitent sous vos doigts mais le système résiste. Le verrouillage reste actif.', en: '' },
                consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
              },
            },
            {
              trigger: { verb: ['HACK', 'OVERRIDE', 'REPAIR'], requiredState: 'bypassed', dc: null },
              onSuccess: {
                narrative: { fr: 'Le panneau est déjà court-circuité. La porte devrait s\'ouvrir maintenant.', en: '' },
              },
            },
          ],
        } satisfies ScenarioFeatureDefinition as ScenarioFeatureDefinition,
      ],
      items: [],
    },
  ],
  sideRooms: [],
  obstacle: {
    targetId: 'blocked_door',
    description: ls('Une porte massive bloque le passage. Les mécanismes d\'ouverture sont grippés ou verrouillés.'),
    paths: [
      { id: 'force', stat: 'FOR', dc: 12, description: ls('Forcer la porte'), verbs: ['push', 'break', 'smash', 'force'] },
      { id: 'hack', stat: 'INT', dc: 11, description: ls('Pirater le panneau de sécurité'), verbs: ['hack', 'repair', 'override'] },
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
        { id: 'medical_cabinet', initialState: 'locked', examineResult: { fr: 'Armoire médicale standard. Verrouillée par un code — mais le panneau est fissuré. Contient probablement des fournitures de premier secours et peut-être de la morphine.', en: '' } },
        { id: 'cot', initialState: 'intact', examineResult: { fr: 'Lit de camp pliant taché de sang. Quelqu\'un a été soigné ici — ou a essayé. Les draps sont trempés mais les signes sont récents.', en: '' } },
      ],
      items: [
        { id: 'medkit_basic', examineResult: { fr: 'Kit médical de base. Compresses hémostatiques, désinfectant, seringue d\'adrénaline. Suffisant pour stabiliser un blessé léger.', en: '' } },
      ],
      npcs: [
        { id: 'wounded_crew_member', disposition: 'neutral', talkSuccess: { fr: '"Merci... merci. Je m\'appelle Torres. Technicien de maintenance. Écoutez — j\'ai vu ce qui s\'est passé. La créature... elle vient des labos inférieurs. Elle chasse par le son. Les conduits de ventilation — c\'est son territoire. Évitez-les si vous pouvez. Et... le capitaine. Il savait. Il savait depuis le début."', en: '' }, talkFailure: { fr: 'Le blessé recule en grimaçant. "Laissez-moi tranquille ! Vous êtes l\'un d\'entre eux ? Non... non, je ne dirai rien. Soignez-moi d\'abord. Après, on parlera." La confiance se mérite ici.', en: '' } },
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
        {
          id: 'light_fixture',
          initialState: 'broken',
          featureType: 'panel',
          aliases: { fr: ['luminaire', 'plafonnier', 'lampe', 'lumiere', 'eclairage'], en: ['light', 'fixture', 'lamp'] },
          examineResult: { fr: 'Plafonnier brisé. Le tube est éclaté et les fils pendent. Il ne fonctionnera plus, mais le réseau électrique derrière est peut-être intact.', en: '' },
          descriptions: {
            broken: { fr: 'Un plafonnier brisé pend du plafond. Le tube est éclaté.', en: '' },
            functional: { fr: 'Le plafonnier diffuse une lumière blanche stable.', en: '' },
          },
          interactions: [
            {
              trigger: { verb: 'ACTIVATE', requiredState: 'broken', requiredFlag: 'power_relay_repaired', dc: null },
              onSuccess: {
                narrative: { fr: 'Vous actionnez l\'interrupteur. Le plafonnier grésille, puis s\'allume. La lumière blanche inonde la pièce — vous pouvez voir à nouveau.', en: '' },
                newState: 'functional',
                resolveObstacle: true,
              },
            },
            {
              trigger: { verb: 'ACTIVATE', requiredState: 'broken', dc: null },
              onSuccess: {
                narrative: { fr: 'L\'interrupteur ne répond pas. Le circuit d\'alimentation est coupé — il faudrait réparer le relais d\'énergie d\'abord.', en: '' },
              },
            },
            {
              trigger: { verb: 'REPAIR', requiredState: 'broken', stat: 'INT', dc: 12 },
              onSuccess: {
                narrative: { fr: 'Vous reconnectez les fils du plafonnier et remplacez le tube éclaté avec un segment de la bande d\'urgence. La lumière revient — faible mais suffisante.', en: '' },
                newState: 'functional',
                resolveObstacle: true,
              },
              onFailure: {
                narrative: { fr: 'Les fils crépitent entre vos doigts. Le tube reste mort. Il faudrait peut-être d\'abord rétablir l\'alimentation.', en: '' },
                consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
              },
            },
          ],
        } satisfies ScenarioFeatureDefinition as ScenarioFeatureDefinition,
        {
          id: 'power_relay',
          initialState: 'damaged',
          featureType: 'wiring',
          aliases: { fr: ['relais', 'relais énergie', 'relais alimentation', 'alimentation'], en: ['relay', 'power relay'] },
          examineResult: { fr: 'Relais d\'alimentation auxiliaire. Endommagé mais pas détruit. Avec les bonnes manipulations, il pourrait alimenter le circuit d\'éclairage de cette section.', en: '' },
          descriptions: {
            damaged: { fr: 'Un relais d\'alimentation endommagé. Des câbles arrachés pendent.', en: '' },
            functional: { fr: 'Le relais d\'alimentation ronronne doucement — circuit rétabli.', en: '' },
          },
          interactions: [
            {
              trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 10 },
              onSuccess: {
                narrative: { fr: 'Vous reconnectez les câbles arrachés du relais. Un cliquetis, puis un ronronnement stable. Le circuit d\'alimentation est rétabli — le luminaire peut être activé.', en: '' },
                newState: 'functional',
                flagSet: 'power_relay_repaired',
              },
              onFailure: {
                narrative: { fr: 'Un arc électrique vous repousse. Le relais reste inerte. Il faudra réessayer.', en: '' },
                consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
              },
            },
          ],
        } satisfies ScenarioFeatureDefinition as ScenarioFeatureDefinition,
        { id: 'emergency_glow_strip', initialState: 'intact', examineResult: { fr: 'Bande luminescente d\'urgence au sol. Émet une faible lueur verte — suffisante pour voir vos pieds, pas pour explorer. Elle mène vers la sortie opposée.', en: '' } },
      ],
      items: [
        { id: 'emergency_flashlight', hidden: true, examineResult: { fr: 'Lampe torche d\'urgence. Batteries faibles mais encore fonctionnelle. Sa lumière révèle les détails de la salle — et potentiellement votre position.', en: '' } },
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
        { id: 'supply_container', initialState: 'locked', examineResult: { fr: 'Conteneur de ravitaillement d\'urgence scellé. Le code de verrouillage est un standard militaire — crochettable avec les bons outils, ou forçable avec suffisamment de force.', en: '' }, descriptions: { locked: { fr: 'Conteneur de ravitaillement d\'urgence scellé. Le code de verrouillage est un standard militaire — crochettable avec les bons outils, ou forçable avec suffisamment de force.', en: '' }, open: { fr: 'Le conteneur est ouvert. Les compartiments internes sont accessibles — rations entamées, emplacements vides, quelques fournitures éparses. Quelqu\'un est passé avant vous.', en: '' } } },
        { id: 'inventory_manifest', initialState: 'intact', examineResult: { fr: 'Manifeste d\'inventaire affiché sur le côté. Liste le contenu : rations, médicaments, outils, et... une entrée barrée à l\'encre noire. Quelqu\'un a retiré quelque chose avant vous.', en: '' } },
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
        { id: 'cover_crates', initialState: 'intact', examineResult: { fr: 'Caisses de cargo empilées. Offrent un couvert décent contre une attaque frontale. Assez lourdes pour bloquer un passage si renversées.', en: '' } },
        { id: 'ambush_choke_point', initialState: 'intact', examineResult: { fr: 'Goulot d\'étranglement naturel entre les structures. Position tactique — un seul adversaire peut passer à la fois. Idéal pour une défense ou un piège.', en: '' } },
        { id: 'ventilation_shaft', initialState: 'intact', examineResult: { fr: 'Conduit de ventilation ouvert. Juste assez large pour s\'y faufiler. Mais les griffures à l\'intérieur suggèrent que la créature l\'utilise aussi.', en: '' } },
      ],
      items: [],
      npcs: [
        { id: 'ambush_creature', disposition: 'hostile', talkSuccess: { fr: 'La créature hésite. Votre voix l\'a surprise — un son qu\'elle n\'attendait pas. Ce n\'est pas de la compréhension, mais un instinct de pause face à l\'inconnu. Ça ne durera pas.', en: '' }, talkFailure: { fr: 'La créature bondit sans hésitation. Vos mots ne sont que du bruit pour elle — un bruit qui confirme votre position.', en: '' } },
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
