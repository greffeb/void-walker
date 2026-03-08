// ---------------------------------------------------------------------------
// src/content/scenarios/modules/exclusive.ts — 5 Exclusive Modules
// ---------------------------------------------------------------------------
// These modules work only in specific skeletons.
// ---------------------------------------------------------------------------

import type { ScenarioModule, NarrativeSkin, ScenarioFeatureDefinition } from '@engine/scenario';
import type { VerbId } from '@engine/verbs';
// Note: VerbId is still used in interaction triggers below (power_reroute_dilemma_01)

function ls(fr: string): { fr: string; en: string } { return { fr, en: '' }; }

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
  compatibility: { skeletons: ['escape', 'investigate'] },
  locations: [
    {
      id: 'main',
      role: 'airlock',
      onCriticalPath: true,
      features: [
        { id: 'airlock_breach', initialState: 'damaged', examineResult: { fr: 'Brèche dans la paroi du sas. L\'air s\'échappe en sifflant — la dépressurisation est lente mais constante. Le bord est assez régulier pour être soudé.', en: '' } },
        { id: 'weld_point', initialState: 'intact', examineResult: { fr: 'Point de soudure possible le long de la brèche. Un chalumeau ou un équipement de soudage pourrait sceller l\'ouverture. Travail physique, mais faisable.', en: '' } },
        { id: 'override_panel', initialState: 'damaged', examineResult: { fr: 'Panneau de contrôle du protocole d\'urgence du sas. Circuit partiellement fonctionnel — un technicien pourrait déclencher la fermeture d\'urgence à distance.', en: '' } },
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
  compatibility: { skeletons: ['escape', 'investigate'] },
  locations: [
    {
      id: 'main',
      role: 'engineering',
      onCriticalPath: true,
      features: [
        { id: 'android_station', initialState: 'damaged', examineResult: { fr: 'Station de recharge et de maintenance de l\'androïde. L\'écran de diagnostic affiche des erreurs en cascade — corruption mémoire, boucles logiques, défaillance des protocoles de base.', en: '' } },
        { id: 'override_port', initialState: 'intact', examineResult: { fr: 'Port de neutralisation d\'urgence à l\'arrière de la station. Interface standard — si vous pouvez accéder physiquement à l\'androïde, vous pourriez le désactiver par ici.', en: '' } },
        { id: 'power_shutoff', initialState: 'intact', examineResult: { fr: 'Coupe-circuit local. Couperait l\'alimentation de toute la section — y compris l\'androïde, mais aussi l\'éclairage et la ventilation.', en: '' } },
      ],
      items: [
        { id: 'android_override_code', hidden: true, examineResult: { fr: 'Carte mémoire contenant le code d\'arrêt d\'urgence de l\'androïde. Séquence alphanumérique de 12 caractères. Si injectée dans son port de maintenance, arrêt immédiat.', en: '' } },
      ],
      npcs: [
        { id: 'malfunctioning_android', disposition: 'hostile', talkSuccess: { fr: '"ERREUR... ERREUR... Protocole de reconnaissance... activé. Vous êtes... personnel autorisé ? Identification... acceptez... attendez. Je... je dysfonction. Veuillez me... désactiver. Mon port de maintenance est à l\'arrière de ma station. Le code est... dans mes fichiers."', en: '' }, talkFailure: { fr: '"ALERTE INTRUSION. Personnel non autorisé détecté. Protocole de défense activé. NEUTRALISATION IMMINENTE." L\'androïde avance, bras mécaniques levés.', en: '' } },
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
  compatibility: { skeletons: ['rescue'] },
  locations: [
    {
      id: 'main',
      role: 'ritual_chamber',
      onCriticalPath: true,
      features: [
        { id: 'alien_mechanism', initialState: 'intact', examineResult: { fr: 'Mécanisme extraterrestre d\'une technologie indéchiffrable. Il pulse d\'une lumière bleu-violet au rythme d\'un battement cardiaque. Il attend quelque chose — un contact, un signal, une volonté.', en: '' } },
        { id: 'symbol_panel_a', initialState: 'intact', examineResult: { fr: 'Panneau couvert de symboles alien organisés en spirale. Certains brillent faiblement quand vous les effleurez. Il y a un motif — une séquence logique, peut-être.', en: '' } },
        { id: 'symbol_panel_b', initialState: 'intact', examineResult: { fr: 'Second panneau de symboles, complémentaire au premier. Les motifs sont différents mais liés. Ensemble, ils forment peut-être une clé d\'activation.', en: '' } },
        { id: 'psionic_node', initialState: 'intact', examineResult: { fr: 'Nœud psionique — un cristal flottant qui vibre à une fréquence sub-sonique. Toucher le cristal provoque un vertige et des visions fugaces d\'espaces inconnus.', en: '' } },
      ],
      items: [
        { id: 'translator_device', hidden: true, examineResult: { fr: 'Dispositif de traduction alien. Petit, organique, chaud au toucher. En le tenant près des panneaux de symboles, des fragments de sens émergent dans votre esprit.', en: '' } },
      ],
    },
  ],
  sideRooms: [
    {
      id: 'side_study',
      role: 'crystal_cave',
      onCriticalPath: false,
      features: [
        { id: 'alien_inscription', initialState: 'intact', examineResult: { fr: 'Inscriptions gravées dans la roche cristalline. Les symboles sont similaires à ceux du mécanisme central. Elles racontent une histoire — ou donnent des instructions.', en: '' } },
        { id: 'void_shard', initialState: 'intact', examineResult: { fr: 'Éclat du Vide — un fragment de cristal noir qui absorbe la lumière. Il est froid au toucher et vibre imperceptiblement. La réalité semble moins stable autour de lui.', en: '' } },
      ],
      items: [
        { id: 'translator_device', examineResult: { fr: 'Dispositif de traduction alien trouvé dans la grotte latérale. En le tenant, les inscriptions deviennent des pensées compréhensibles.', en: '' } },
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
  compatibility: { skeletons: ['investigate'] },
  locations: [
    {
      id: 'main',
      role: 'hazard_zone',
      onCriticalPath: true,
      features: [
        { id: 'containment_field', initialState: 'broken', examineResult: { fr: 'Champ de confinement électromagnétique — complètement effondré. Les émetteurs sont grillés. Quelque chose de puissant a forcé le passage de l\'intérieur.', en: '' } },
        { id: 'resealing_unit', initialState: 'damaged', examineResult: { fr: 'Unité de re-scellement d\'urgence. Endommagée mais réparable. Avec les bonnes manipulations, elle pourrait restaurer le champ de confinement à 60% de sa capacité.', en: '' } },
        { id: 'evacuation_panel', initialState: 'intact', examineResult: { fr: 'Panneau d\'évacuation de section. Permet de sceller et purger cette zone entière. Solution radicale mais efficace — tout ce qui est à l\'intérieur sera exposé au vide.', en: '' } },
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
  compatibility: { universal: true },
  locations: [
    {
      id: 'main',
      role: 'control_room',
      onCriticalPath: true,
      features: [
        {
          id: 'power_distribution_panel',
          initialState: 'damaged',
          examineResult: { fr: 'Panneau de distribution énergétique principal de la section. Deux circuits prioritaires : sas (évacuation) et infirmerie (survie du blessé). L\'énergie disponible ne suffit que pour l\'un des deux.', en: '' },
          interactions: [
            {
              trigger: { verb: ['HACK', 'IMPROVISE_TOOL'] as VerbId[], stat: 'INT', dc: 16 },
              onSuccess: {
                newState: 'repaired',
                flagSet: 'survivor_saved',
                resolveObstacle: true,
                narrative: { fr: 'Vous trouvez un compromis instable. Les deux circuits sont alimentés — pour l\'instant.', en: '' },
              },
              onFailure: {
                narrative: { fr: 'Le panneau résiste à votre tentative de surcharge. Les circuits restent bloqués.', en: '' },
              },
            },
          ],
        } as ScenarioFeatureDefinition,
        { id: 'medbay_feed_circuit', initialState: 'intact', examineResult: { fr: 'Circuit d\'alimentation de l\'infirmerie. Alimenté, le matériel médical peut maintenir le survivant en vie. Déconnecté, les machines s\'arrêtent en 3 minutes.', en: '' } },
        {
          id: 'door_feed_circuit',
          initialState: 'damaged',
          examineResult: { fr: 'Circuit d\'alimentation des portes de section. Endommagé mais réparable. S\'il est alimenté, les portes s\'ouvrent et votre chemin se débloque. Sinon, il faudra trouver un autre passage.', en: '' },
          interactions: [
            {
              trigger: { verb: ['REPAIR', 'USE', 'HACK'] as VerbId[], stat: 'INT', dc: 11 },
              onSuccess: {
                newState: 'activated',
                consequences: [{ type: 'npc_killed', npcId: 'survivant_infirmerie' }],
                resolveObstacle: true,
                narrative: { fr: 'Vous réacheminez l\'énergie vers les portes. Les machines de l\'infirmerie s\'éteignent en silence.', en: '' },
              },
              onFailure: {
                narrative: { fr: 'Vous ne parvenez pas à réacheminer le circuit.', en: '' },
              },
            },
          ],
        } as ScenarioFeatureDefinition,
      ],
      items: [],
    },
  ],
  sideRooms: [],
  npcs: [{ id: 'survivant_infirmerie', disposition: 'friendly' }],
  obstacle: {
    targetId: 'power_distribution_panel',
    description: ls('Le panneau de distribution est endommagé. Des circuits prioritaires nécessitent votre attention.'),
    paths: [
      { id: 'reroute_to_doors', stat: 'INT', dc: 11, description: ls('Réacheminer vers les portes — votre chemin s\'ouvre'), verbs: ['repair', 'use', 'hack'] },
      { id: 'reroute_to_medbay', stat: 'INT', dc: 11, description: ls('Réacheminer vers l\'infirmerie — le survivant est sauvé'), verbs: ['repair', 'use', 'hack'] },
      { id: 'override_both', stat: 'INT', dc: 16, description: ls('Trouver un compromis instable (très difficile)'), verbs: ['hack', 'override', 'improvise_tool'] },
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
