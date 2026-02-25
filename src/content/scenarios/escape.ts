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
        { id: 'emergency_flashlight', examineResult: { fr: 'Une lampe torche de secours standard. La batterie indique 73%. Assez pour éclairer votre chemin dans les sections sombres.', en: '' } },
        { id: 'medkit_basic', examineResult: { fr: 'Kit médical d\'urgence. Contient des bandages compressifs, un antiseptique et une dose d\'analgésique. Suffisant pour traiter une blessure légère.', en: '' } },
        { id: 'access_keycard', hidden: true, examineResult: { fr: 'Un badge d\'accès de niveau 3 — celui du technicien Chen. Encore actif. Il devrait ouvrir la cloison de sécurité.', en: '' } },
      ],
      features: [
        { id: 'cryopod', initialState: 'broken', examineResult: { fr: 'Votre capsule cryogénique. Le couvercle s\'est ouvert d\'urgence — le voyant indique une coupure de courant il y a 4 heures. Le gel cryogénique a coulé sur le sol. Les autres capsules sont vides. Depuis longtemps.', en: '' } },
        { id: 'status_terminal', initialState: 'damaged', examineResult: { fr: 'L\'écran clignote entre des bribes de données : "ALERTE CONFINEMENT — NIVEAU 5"... "Équipage : 0/47 actifs"... "Support vie : CRITIQUE". La date affichée montre que 6 mois se sont écoulés depuis votre mise en cryo.', en: '' } },
        { id: 'emergency_locker', initialState: 'locked', examineResult: { fr: 'Casier d\'urgence standard. Le verrou magnétique est actif mais la serrure semble fragilisée par les vibrations. Un outil adapté pourrait l\'ouvrir.', en: '' } },
      ],
      exits: ['unlock'],
    },
    unlock: {
      locationRole: 'control_room',
      items: [],
      features: [
        { id: 'security_panel', initialState: 'intact', examineResult: { fr: 'Le panneau de sécurité affiche un lecteur de badge et un digicode. Le système accepte les badges de niveau 3 ou supérieur. Des griffures profondes marquent le métal autour du panneau — quelque chose a essayé de l\'arracher.', en: '' } },
        { id: 'bulkhead_door', initialState: 'locked', examineResult: { fr: 'Porte blindée de 15 centimètres d\'épaisseur. Verrouillage magnétique actif. Aucune force brute ne l\'ouvrira — mais le conduit de ventilation à côté pourrait offrir un passage alternatif.', en: '' } },
        { id: 'vent_cover', initialState: 'intact', examineResult: { fr: 'Grille de ventilation standard. Les vis sont rouillées mais le passage derrière semble assez large pour s\'y glisser. Un courant d\'air froid en sort — il mène quelque part.', en: '' } },
      ],
      exits: ['start', 'reveal'],
    },
    reveal: {
      locationRole: 'quarters',
      items: [
        { id: 'captain_log_datapad', examineResult: { fr: 'Le dernier journal du Capitaine Reeves. Entrée finale : "Projet ORACLE hors contrôle. Le spécimen Alpha a éliminé les équipes de confinement. J\'ai scellé les sections 4 à 7. Si quelqu\'un lit ceci... fuyez. Ne tentez pas de la combattre. Fuyez."', en: '' } },
        { id: 'EVA_suit_locker_key', hidden: true, examineResult: { fr: 'Une petite clé magnétique cachée sous les papiers du capitaine. L\'étiquette indique "Casier EVA — Pont 3".', en: '' } },
      ],
      features: [
        { id: 'captain_terminal', initialState: 'intact', examineResult: { fr: 'Le terminal du capitaine contient des fichiers classifiés : rapports sur le "Projet ORACLE" — une arme biologique expérimentale développée en secret. L\'équipage n\'était pas au courant. Le spécimen s\'est échappé il y a 6 mois. 47 membres d\'équipage. 0 survivants confirmés.', en: '' } },
        { id: 'viewport', initialState: 'intact', examineResult: { fr: 'Le hublot donne sur le vide spatial. Le vaisseau dérive, sa trajectoire n\'est plus contrôlée. Des débris flottent le long de la coque — morceaux de blindage arrachés. De l\'extérieur.', en: '' } },
        { id: 'EVA_suit_locker', initialState: 'locked', examineResult: { fr: 'Casier contenant une combinaison EVA complète. Le verrou magnétique nécessite une clé spécifique. La combinaison à l\'intérieur semble intacte — elle protégerait contre la dépressurisation.', en: '' } },
      ],
      exits: ['unlock', 'escalation'],
    },
    escalation: {
      locationRole: 'engineering',
      items: [
        { id: 'oxygen_canister', hidden: true, examineResult: { fr: 'Bonbonne d\'oxygène de secours. La jauge indique une charge complète — suffisante pour 30 minutes de respiration en zone dépressurisée.', en: '' } },
      ],
      features: [
        { id: 'life_support_panel', initialState: 'damaged', examineResult: { fr: 'Le panneau de support vie affiche des données alarmantes : O₂ en chute libre dans les sections 1 à 5. Des marques de griffes ont endommagé les câbles principaux. La créature a délibérément saboté le système.', en: '' } },
        { id: 'o2_reroute_valve', initialState: 'intact', examineResult: { fr: 'Valve de reroutage d\'urgence. En position ouverte, elle détournerait les réserves d\'O₂ vers le pont des pods d\'évasion — juste assez pour atteindre la sortie.', en: '' } },
        { id: 'power_conduit', initialState: 'damaged', examineResult: { fr: 'Conduit d\'énergie principal. Les câbles sont sectionnés net — pas un accident, un acte délibéré. L\'alimentation des sections extérieures est coupée.', en: '' } },
      ],
      exits: ['reveal', 'boss'],
    },
    boss: {
      locationRole: 'airlock',
      items: [],
      npcs: [
        { id: 'creature_oracle', disposition: 'hostile', talkSuccess: { fr: 'La créature émet un son guttural, presque... intelligent. Elle vous observe avec une curiosité terrifiante, comme si elle vous étudiait. Un instant de flottement — elle n\'attaque pas immédiatement.', en: '' }, talkFailure: { fr: 'Votre voix ne fait que l\'agiter davantage. La créature siffle et ses griffes raclent le métal. Communiquer avec elle est impossible — elle n\'est que faim et instinct.', en: '' } },
      ],
      features: [
        { id: 'escape_pod_hatch', initialState: 'locked', examineResult: { fr: 'L\'écoutille du pod d\'évasion. Le mécanisme est intact mais verrouillé — il faut un badge de niveau 3 ou forcer le panneau. Au-delà, la liberté.', en: '' } },
        { id: 'cargo_jettison_lever', initialState: 'intact', examineResult: { fr: 'Levier de largage d\'urgence de la soute cargo. En position active, il ouvrirait les portes extérieures de la soute — éjectant tout son contenu dans le vide. Y compris toute créature qui s\'y trouverait.', en: '' } },
        { id: 'hull_breach_panel', initialState: 'intact', examineResult: { fr: 'Panneau de contrôle de la brèche de coque. Les indicateurs montrent une micro-fissure au niveau 3. Amplifier cette brèche dépressuriserait la zone — dangereux, mais potentiellement utile.', en: '' } },
      ],
      exits: ['escalation', 'resolution'],
    },
    resolution: {
      locationRole: 'passage',
      items: [],
      features: [
        { id: 'pod_viewport', initialState: 'intact', examineResult: { fr: 'À travers le hublot, le vaisseau s\'éloigne — masse sombre et silencieuse contre les étoiles. Un point lumineux pulse encore dans sa coque. Puis plus rien. C\'est fini.', en: '' } },
      ],
      exits: ['boss'],
    },
  },

  additionalDefeatConditions: [
    { type: 'time_expired', resource: 'o2' },
  ],
};
