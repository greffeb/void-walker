// ---------------------------------------------------------------------------
// src/content/scenarios/investigate.ts — INVESTIGATE skeleton: "Signal Perdu"
// ---------------------------------------------------------------------------
// Fantasy: Investigate a station gone silent. Uncover a conspiracy.
// 6 core nodes, gate item: encrypted_data_core, boss type: puzzle
// ---------------------------------------------------------------------------
// Chantier 4: Fully enriched nodeLocations with ScenarioFeatureDefinition
// and ScenarioItemDefinition — mechanical interactions, properties, aliases.
// ---------------------------------------------------------------------------

import type { CoreSkeleton, ScenarioFeatureDefinition, ScenarioItemDefinition } from '@engine/scenario';

// ============================= ITEMS ========================================

// --- START node items ---

const scanner_device: ScenarioItemDefinition = {
  id: 'scanner_device',
  itemType: 'tool',
  extraProperties: ['electronic', 'small', 'powered', 'usable'],
  aliases: {
    fr: ['scanner', 'detecteur', 'appareil', 'scanner portable'],
    en: ['scanner', 'detector', 'device'],
  },
  description: {
    fr: 'Scanner portable multi-fréquence. Détecte les anomalies biologiques et électroniques dans un rayon de 10 mètres. Batterie à 89%.',
    en: 'Portable multi-frequency scanner.',
  },
  useOn: [
    {
      targetId: 'wall_safe',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Le scanner révèle un compartiment caché derrière le coffre — un double fond. Le mécanisme d\'ouverture secondaire est électronique.',
            en: 'The scanner reveals a hidden compartment behind the safe.',
          },
          flagSet: 'safe_scanned',
        },
      },
    },
    {
      targetId: 'ai_core_node_a',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Le scanner détecte un flux de données anormal : l\'IA exécute un programme d\'effacement massif. 67% des logs de la station sont déjà détruits.',
            en: 'The scanner detects abnormal data flow.',
          },
          flagSet: 'ai_scan_revealed',
        },
      },
    },
    {
      targetId: 'reactor_core',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Lectures alarmantes. Le cœur du réacteur montre des micro-fractures dans le confinement — pas un accident, des charges de sabotage placées chirurgicalement. Vasquez savait exactement où frapper.',
            en: 'Alarming readings. Micro-fractures in containment — not an accident.',
          },
          flagSet: 'reactor_sabotage_confirmed',
        },
      },
    },
  ],
};

const standard_toolkit: ScenarioItemDefinition = {
  id: 'standard_toolkit',
  itemType: 'tool',
  extraProperties: ['metallic', 'usable', 'mechanical', 'small'],
  aliases: {
    fr: ['outils', 'trousse', 'trousse outils', 'boite outils', 'kit'],
    en: ['toolkit', 'tools', 'tool kit'],
  },
  description: {
    fr: 'Trousse à outils standard d\'intervention. Tournevis magnétiques, pince multifonction, testeur de circuits.',
    en: 'Standard intervention toolkit.',
  },
  useOn: [
    {
      targetId: 'maintenance_terminal',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Vous ouvrez le boîtier du terminal et pontez le circuit endommagé. L\'écran s\'illumine — accès partiel restauré.',
            en: 'You open the terminal casing and bridge the damaged circuit.',
          },
          flagSet: 'maintenance_terminal_repaired',
        },
      },
    },
    {
      targetId: 'ai_core_node_a',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Vous dévissez le panneau de maintenance du nœud. Les connecteurs de données sont exposés — il suffirait de déconnecter les fibres optiques principales.',
            en: 'You unscrew the node\'s maintenance panel.',
          },
          flagSet: 'node_a_exposed',
        },
      },
    },
    {
      targetId: 'override_terminal',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Vous remplacez le circuit grillé du terminal de neutralisation. L\'écran s\'allume faiblement — le système est partiellement opérationnel.',
            en: 'You replace the burned circuit. The screen lights up faintly.',
          },
          flagSet: 'override_terminal_repaired',
        },
      },
    },
  ],
};

const encrypted_data_core: ScenarioItemDefinition = {
  id: 'encrypted_data_core',
  itemType: 'key_item',
  hidden: true,
  revealedBy: { featureId: 'cargo_manifest_terminal', requiredState: 'active' },
  extraProperties: ['electronic', 'small', 'data_storage', 'usable'],
  aliases: {
    fr: ['noyau', 'donnees', 'noyau donnees', 'data core', 'puce', 'noyau chiffre'],
    en: ['data core', 'core', 'encrypted core'],
  },
  description: {
    fr: 'Noyau de données lourdement chiffré — protocole militaire niveau 4. Contient les logs de la station des dernières 72 heures. La clé de déchiffrement est quelque part sur la station.',
    en: 'Heavily encrypted data core — military-grade protocol.',
  },
  useOn: [
    {
      targetId: 'encrypted_terminal',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Vous insérez le noyau de données. Le terminal ronronne, les barres de déchiffrement progressent. Accès aux logs : ACCORDÉ. Les communications de la station des 72 dernières heures se déversent à l\'écran.',
            en: 'You insert the data core. Decryption bars progress. Access: GRANTED.',
          },
          flagSet: 'terminal_decrypted',
        },
      },
    },
  ],
};

// --- REVEAL node items ---

const director_keycard: ScenarioItemDefinition = {
  id: 'director_keycard',
  itemType: 'key_item',
  hidden: true,
  revealedBy: { featureId: 'wall_safe', requiredState: 'open' },
  extraProperties: ['electronic', 'small', 'usable', 'secured'],
  aliases: {
    fr: ['badge directrice', 'badge vasquez', 'badge admin', 'carte vasquez', 'badge'],
    en: ['director badge', 'keycard', 'vasquez badge'],
  },
  description: {
    fr: 'Badge personnel de la Directrice Vasquez. Niveau d\'accès maximal. Le post-it avec le code 7-2-9-4 est toujours collé au dos. Sa négligence est votre meilleur allié.',
    en: 'Director Vasquez\'s personal badge. Maximum access level.',
  },
  useOn: [
    {
      targetId: 'override_terminal',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Le terminal reconnaît le badge de Vasquez. ACCÈS ADMINISTRATEUR — DIRECTRICE VASQUEZ. Ironie : l\'accès qu\'elle a utilisé pour condamner la station va servir à la sauver.',
            en: 'The terminal recognizes Vasquez\'s badge. ADMINISTRATOR ACCESS.',
          },
          flagSet: 'override_admin_access',
        },
      },
    },
    {
      targetId: 'ai_final_lock',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Badge inséré. L\'IA hésite — le badge de sa créatrice. \'Commande contradictoire détectée. Protocole hiérarchique activé.\' Le verrou cède. Le badge de Vasquez est la clé maîtresse.',
            en: 'Badge inserted. The AI hesitates — its creator\'s badge.',
          },
          flagSet: 'ai_lock_opened',
        },
      },
    },
    {
      targetId: 'emergency_beacon',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          newState: 'active',
          narrative: {
            fr: 'Le badge de Vasquez. L\'IA hésite — directive de sa créatrice. Le protocole hiérarchique prend le dessus : accès administrateur confirmé. Les verrous cèdent un par un.',
            en: 'Vasquez\'s badge. The AI hesitates — its creator\'s directive.',
          },
          flagSet: 'beacon_active',
        },
      },
    },
  ],
};

const incriminating_files: ScenarioItemDefinition = {
  id: 'incriminating_files',
  itemType: 'key_item',
  extraProperties: ['organic', 'readable', 'small'],
  aliases: {
    fr: ['dossiers', 'preuves', 'fichiers', 'documents', 'dossiers compromettants'],
    en: ['files', 'evidence', 'incriminating files', 'documents'],
  },
  description: {
    fr: 'Dossiers compromettants : correspondance Vasquez-Heliox, polices d\'assurance gonflées de 400%, plan de sabotage détaillé. La preuve irréfutable.',
    en: 'Incriminating files: Vasquez-Heliox correspondence, inflated insurance policies, sabotage plan.',
  },
  useOn: [
    {
      targetId: 'emergency_beacon',
      interaction: {
        trigger: { verb: 'USE', requiredFlag: 'beacon_active', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Les dossiers sont numérisés et joints au signal de détresse. Fraude, sabotage, meurtre — tout est dans la transmission. La vérité va voyager à la vitesse de la lumière vers la flotte de secours.',
            en: 'Files digitized and attached to the distress signal. The truth will travel at lightspeed.',
          },
          flagSet: 'evidence_transmitted',
        },
      },
    },
  ],
};

// ============================= FEATURES =====================================

// --- START node features ---

const docking_airlock: ScenarioFeatureDefinition = {
  id: 'docking_airlock',
  featureType: 'door',
  initialState: 'open',
  extraProperties: ['metallic', 'sealed', 'rigid'],
  aliases: {
    fr: ['sas', 'airlock', 'sas amarrage', 'porte sas'],
    en: ['airlock', 'docking', 'door'],
  },
  descriptions: {
    open: {
      fr: 'Le sas d\'amarrage est ouvert — votre navette est arrimée de l\'autre côté. Les indicateurs de pression sont normaux. Votre seul moyen de quitter la station.',
      en: 'The docking airlock is open — your shuttle is docked on the other side.',
    },
    closed: {
      fr: 'Le sas d\'amarrage est scellé. Le voyant indique VERROUILLAGE AUTOMATIQUE. L\'IA a coupé l\'accès à votre navette.',
      en: 'The docking airlock is sealed. AUTOMATIC LOCK indicator.',
    },
    broken: {
      fr: 'Le mécanisme du sas est détruit. L\'accès à la navette est bloqué physiquement.',
      en: 'The airlock mechanism is destroyed.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'EXAMINE', requiredState: 'open', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Les jauges de pression sont stables. Votre navette attend de l\'autre côté, silencieuse. Le manifeste de vol indique un temps de trajet retour de 14 heures vers la flotte.',
          en: 'Pressure gauges are stable. Your shuttle waits on the other side, silent.',
        },
      },
    },
    {
      trigger: { verb: 'CLOSE', requiredState: 'open', dc: null },
      onSuccess: {
        newState: 'closed',
        narrative: {
          fr: 'Vous scellez le sas derrière vous. Verrouillage magnétique activé. Personne n\'entre — personne ne sort sans votre autorisation.',
          en: 'You seal the airlock behind you. Magnetic lock engaged.',
        },
        flagSet: 'airlock_sealed_by_player',
      },
    },
  ],
};

const cargo_manifest_terminal: ScenarioFeatureDefinition = {
  id: 'cargo_manifest_terminal',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'readable', 'powered', 'programmable'],
  aliases: {
    fr: ['manifeste', 'terminal cargo', 'terminal manifeste', 'ecran cargo'],
    en: ['manifest', 'cargo terminal'],
  },
  descriptions: {
    active: {
      fr: 'Terminal du manifeste cargo. L\'écran défile lentement — le dernier chargement répertorié remonte à 3 mois.',
      en: 'Cargo manifest terminal. The screen scrolls slowly.',
    },
    broken: {
      fr: 'Terminal détruit. L\'écran est noir, le boîtier fracturé.',
      en: 'Terminal destroyed. Screen is dark, casing fractured.',
    },
  },
  readableContent: {
    fr: 'MANIFESTE CARGO — Station Phoebe-7\n\nEntrée 2247-03-14 : \'Matériel de recherche avancée — Autorisation Directrice Vasquez uniquement\'\nContenu : [CLASSIFIÉ — NIVEAU 4]\nOrigine : Consortium Heliox, Division R&D\nNote marge : \'NE PAS scanner au contrôle douanier\'',
    en: '',
  },
  interactions: [
    {
      trigger: { verb: 'READ', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Le manifeste dévoile un chargement suspect daté d\'il y a 3 mois : matériel classifié, autorisation Vasquez uniquement. La note en marge — \'NE PAS scanner au contrôle douanier\' — en dit long.',
          en: 'The manifest reveals a suspicious shipment dated 3 months ago.',
        },
        flagSet: 'manifest_read',
      },
    },
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 10 },
      onSuccess: {
        narrative: {
          fr: 'Accès étendu. Logs de communication masqués : Vasquez a personnellement réceptionné le chargement, seule, à 03h00. Les caméras de la baie étaient désactivées ce jour-là.',
          en: 'Extended access. Hidden comms logs revealed.',
        },
        flagSet: 'manifest_hacked',
      },
      onFailure: {
        narrative: {
          fr: 'Le système rejette votre tentative. ACCÈS REFUSÉ clignote en rouge. Au moins le manifeste de surface est lisible.',
          en: 'The system rejects your attempt.',
        },
      },
    },
  ],
};

const docking_clamps: ScenarioFeatureDefinition = {
  id: 'docking_clamps',
  featureType: 'panel',
  initialState: 'active',
  extraProperties: ['metallic', 'mechanical'],
  aliases: {
    fr: ['pinces', 'amarrage', 'pinces amarrage', 'systeme amarrage'],
    en: ['clamps', 'docking clamps'],
  },
  descriptions: {
    active: {
      fr: 'Les pinces d\'amarrage maintiennent votre navette en position. Le système de largage rapide est fonctionnel — pour un départ précipité.',
      en: 'Docking clamps hold your shuttle in position. Quick-release system is functional.',
    },
    broken: {
      fr: 'Les pinces sont détruites. Votre navette dérive lentement — le câble de secours la retient encore, mais pas pour longtemps.',
      en: 'Clamps destroyed. Your shuttle drifts slowly.',
    },
    deactivated: {
      fr: 'Les pinces se sont rétractées. Votre navette est libre de manœuvrer — le chemin du retour est ouvert.',
      en: 'Clamps retracted. Your shuttle is free to maneuver.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'EXAMINE', requiredState: 'active', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Système d\'amarrage standard. Commande de largage d\'urgence accessible. Temps de découplage estimé : 12 secondes. Votre police d\'assurance si les choses tournent mal.',
          en: 'Standard docking system. Emergency release accessible.',
        },
      },
    },
    {
      trigger: { verb: 'SABOTAGE', requiredState: 'active', stat: 'INT', dc: 14 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: 'Vous sabotez les pinces. Elles se rétractent dans un grincement — votre navette décroche lentement. Plus de retour facile. Mais l\'IA ne pourra pas non plus verrouiller votre navette.',
          en: 'You sabotage the clamps. No easy return — but the AI can\'t lock your shuttle either.',
        },
        flagSet: 'clamps_sabotaged',
      },
      onFailure: {
        narrative: {
          fr: 'Le mécanisme résiste. Les pinces sont conçues pour supporter des impacts d\'astéroïdes — vos outils ne suffisent pas.',
          en: 'The mechanism resists.',
        },
      },
    },
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'active', stat: 'INT', dc: 8 },
      onSuccess: {
        newState: 'deactivated',
        narrative: {
          fr: 'Largage exécuté. Les pinces se rétractent proprement. Votre navette s\'écarte de quelques mètres — prête pour un départ rapide.',
          en: 'Release executed. Clamps retract cleanly.',
        },
        flagSet: 'shuttle_released',
      },
    },
  ],
};

// --- UNLOCK node features ---

const encrypted_terminal: ScenarioFeatureDefinition = {
  id: 'encrypted_terminal',
  featureType: 'terminal',
  initialState: 'locked',
  extraProperties: ['electronic', 'locked', 'data_storage', 'powered', 'programmable'],
  aliases: {
    fr: ['terminal chiffre', 'terminal crypte', 'terminal principal', 'terminal verrouille', 'console chiffree'],
    en: ['encrypted terminal', 'locked terminal', 'main terminal'],
  },
  descriptions: {
    locked: {
      fr: 'Terminal de communications principal. L\'écran rouge sang affiche \'ACCÈS RESTREINT — CLÉ DE CHIFFREMENT REQUISE\'. Un slot pour noyau de données est visible sur le côté.',
      en: 'Main comms terminal. Blood-red screen: ACCESS RESTRICTED — ENCRYPTION KEY REQUIRED.',
    },
    active: {
      fr: 'Terminal déverrouillé. Les logs de la station défilent — 72 heures de communications, rapports d\'incident, ordres confidentiels. La vérité est là, quelque part.',
      en: 'Terminal unlocked. Station logs scroll by.',
    },
    broken: {
      fr: 'Terminal détruit. L\'écran est fendu en étoile, les circuits grésillent. Les données sont inaccessibles par cette voie.',
      en: 'Terminal destroyed. Screen cracked, circuits sizzle.',
    },
  },
  interactions: [
    // Chemin 1 : USE data core (item-based, auto-success)
    {
      trigger: { verb: 'USE', requiredState: 'locked', requiredItem: 'encrypted_data_core', dc: null },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'Le noyau de données s\'enclenche. Les algorithmes de déchiffrement s\'exécutent — 3 secondes, 5, 12... L\'écran passe au vert. ACCÈS ACCORDÉ. Les logs de la station se déversent à l\'écran.',
          en: 'The data core clicks in. Decryption algorithms execute. ACCESS GRANTED.',
        },
        flagSet: 'comms_unlocked',
        revealsExit: 'unlock_to_reveal',
      },
    },
    // Chemin 2 : HACK direct (INT, DC 13)
    {
      trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 13 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'Protocole militaire niveau 4 — mais pas sans failles. Vous exploitez une vulnérabilité dans le firmware de la station. L\'accès s\'ouvre. Les logs apparaissent.',
          en: 'Military protocol — but not flawless. You exploit a firmware vulnerability.',
        },
        flagSet: 'comms_unlocked',
        revealsExit: 'unlock_to_reveal',
      },
      onFailure: {
        narrative: {
          fr: 'Le chiffrement résiste. Le système enregistre votre tentative — un compteur d\'intrusion s\'incrémente. Encore 2 essais avant verrouillage total.',
          en: 'Encryption holds. The system logs your attempt.',
        },
        flagSet: 'hack_attempt_logged',
      },
    },
    // Chemin 3 : Mot de passe trouvé (PER path via notes)
    {
      trigger: { verb: 'USE', requiredState: 'locked', requiredFlag: 'password_found', dc: null },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'Vous tapez le code trouvé dans les notes : 7-2-9-4. L\'écran clignote. ACCÈS ACCORDÉ. La négligence de Vasquez aura au moins servi à quelque chose.',
          en: 'You type the code from the notes: 7-2-9-4. ACCESS GRANTED.',
        },
        flagSet: 'comms_unlocked',
        revealsExit: 'unlock_to_reveal',
      },
    },
    // Chemin 4 : TALK à l'IA (CHA DC 13)
    {
      trigger: { verb: 'TALK', requiredState: 'locked', stat: 'CHA', dc: 13 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: '\'Demande d\'accès enregistrée.\' La voix synthétique de l\'IA résonne dans la salle vide. \'Protocole d\'urgence : accès temporaire accordé. Durée : 15 minutes.\' Suffisant.',
          en: '\'Access request logged.\' The AI\'s synthetic voice echoes. \'Emergency protocol: temporary access granted.\'',
        },
        flagSet: 'comms_unlocked',
        revealsExit: 'unlock_to_reveal',
      },
      onFailure: {
        narrative: {
          fr: '\'Identifiants non reconnus. Personnel non autorisé détecté.\' La voix de l\'IA est glaciale. Les lumières de la salle passent à l\'orange. Vous venez de vous faire repérer.',
          en: '\'Credentials not recognized.\' The AI\'s voice is cold.',
        },
        flagSet: 'ai_alerted',
      },
    },
    // Chemin 5 : BREAK (FOR DC 14 — perd les données)
    {
      trigger: { verb: 'BREAK', requiredState: 'locked', stat: 'FOR', dc: 14 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: 'Le terminal explose sous vos coups. Étincelles, fumée, silence. Les données sont détruites — mais le circuit de verrouillage de la porte adjacente a sauté en même temps. Passage libre, preuves perdues.',
          en: 'The terminal shatters. Data destroyed — but the adjacent door lock shorted out too.',
        },
        flagSet: 'terminal_destroyed',
        revealsExit: 'unlock_to_reveal',
      },
    },
  ],
};

const maintenance_terminal: ScenarioFeatureDefinition = {
  id: 'maintenance_terminal',
  featureType: 'terminal',
  initialState: 'damaged',
  extraProperties: ['electronic', 'damaged', 'powered', 'programmable', 'easily_repairable'],
  aliases: {
    fr: ['terminal maintenance', 'terminal auxiliaire', 'terminal secondaire', 'console maintenance'],
    en: ['maintenance terminal', 'auxiliary terminal'],
  },
  descriptions: {
    damaged: {
      fr: 'Terminal de maintenance auxiliaire. L\'écran est fissuré, certaines fonctions sont accessibles. Les logs de maintenance montrent des interventions suspectes il y a 72 heures.',
      en: 'Auxiliary maintenance terminal. Cracked screen, some functions accessible.',
    },
    active: {
      fr: 'Terminal réparé. Accès complet aux systèmes de maintenance — caméras, portes, ventilation. Un outil puissant.',
      en: 'Terminal repaired. Full maintenance system access.',
    },
    broken: {
      fr: 'Terminal complètement hors service. Plus rien à en tirer.',
      en: 'Terminal completely out of service.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'READ', requiredState: 'damaged', dc: null },
      onSuccess: {
        narrative: {
          fr: 'L\'écran fissuré affiche des fragments : interventions non autorisées sur le confinement, exactement 72 heures avant le silence radio. Codes d\'accès modifiés par \'ADMIN_VASQUEZ\'. Elle a couvert ses traces — presque.',
          en: 'The cracked screen shows fragments: unauthorized containment interventions.',
        },
        flagSet: 'maintenance_logs_read',
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 11 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'Vous reconnectez les circuits endommagés. L\'écran s\'illumine — accès complet. Caméras, portes, ventilation — vous avez les yeux et les mains de la station.',
          en: 'You reconnect the damaged circuits. Full access restored.',
        },
        flagSet: 'maintenance_control',
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', requiredItem: 'standard_toolkit', dc: null },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'Le testeur de circuits identifie le composant grillé. Remplacement en 30 secondes. L\'écran reprend vie — accès complet aux systèmes de maintenance.',
          en: 'The circuit tester identifies the burned component. Quick replacement.',
        },
        flagSet: 'maintenance_control',
      },
    },
    {
      trigger: { verb: 'HACK', requiredState: 'active', stat: 'INT', dc: 12 },
      onSuccess: {
        narrative: {
          fr: 'Vous accédez aux caméras de sécurité archivées. Enregistrement de la baie cargo, daté de 3 mois : Vasquez réceptionnant un chargement seule, à 03h00. Elle regarde par-dessus son épaule. Coupable.',
          en: 'You access archived security cameras.',
        },
        flagSet: 'camera_evidence_found',
      },
    },
  ],
};

const director_notes_clipboard: ScenarioFeatureDefinition = {
  id: 'director_notes_clipboard',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['readable', 'small', 'organic'],
  aliases: {
    fr: ['bloc-notes', 'notes', 'clipboard', 'notes directrice', 'carnet'],
    en: ['clipboard', 'notes', 'director notes'],
  },
  descriptions: {
    intact: {
      fr: 'Le bloc-notes de la directrice. Notes manuscrites, écriture nerveuse. Des passages sont raturés avec insistance.',
      en: 'The director\'s clipboard. Handwritten notes, nervous handwriting.',
    },
    searched: {
      fr: 'Le bloc-notes, déjà examiné. Les ratures sont toujours aussi suspectes.',
      en: 'The clipboard, already examined.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'READ', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Notes manuscrites : \'Compte à rebours lancé. 72h avant procédure d\'évacuation automatique. Vérifier que les logs sont effacés AVANT.\' Le reste est raturé — mais un code est visible dans la marge : 7-2-9-4.',
          en: 'Handwritten notes reveal a countdown and a code: 7-2-9-4.',
        },
        flagSet: 'password_found',
      },
    },
    {
      trigger: { verb: 'EXAMINE', stat: 'PER', dc: 10 },
      onSuccess: {
        narrative: {
          fr: 'Sous les ratures, en appuyant la feuille contre la lumière, vous déchiffrez : \'Contact Heliox pour confirmation transfert. Police assurance n° HX-7741. Station vaut plus morte que vive.\' La preuve de la fraude.',
          en: 'Holding the paper to the light, you decipher hidden text under the strikethroughs.',
        },
        flagSet: 'fraud_note_deciphered',
      },
    },
  ],
};

// --- REVEAL node features ---

const director_terminal: ScenarioFeatureDefinition = {
  id: 'director_terminal',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'readable', 'powered', 'programmable'],
  aliases: {
    fr: ['terminal directrice', 'terminal vasquez', 'ordinateur', 'poste travail'],
    en: ['director terminal', 'vasquez terminal', 'computer'],
  },
  descriptions: {
    active: {
      fr: 'Le terminal personnel de la Directrice Vasquez. L\'écran de veille affiche le logo de la station — serein, officiel. Mais la messagerie indique 47 messages non lus, tous marqués CONFIDENTIEL HELIOX. Il y a des choses à lire ici.',
      en: 'Director Vasquez\'s personal terminal. Screensaver shows the station logo — serene, official. But the inbox shows 47 unread messages, all marked HELIOX CONFIDENTIAL.',
    },
    broken: {
      fr: 'Terminal détruit. Quelqu\'un — ou quelque chose — a voulu effacer les preuves avant vous.',
      en: 'Terminal destroyed. Someone — or something — tried to erase evidence.',
    },
  },
  readableContent: {
    fr: 'CORRESPONDANCE CONFIDENTIELLE — Dir. Vasquez / Consortium Heliox\n\n[2247-01-08] HX: \'Confirmez le calendrier. Les assureurs ne soupçonnent rien.\'\n[2247-01-15] V: \'Phase 2 en cours. Modifications confinement achevées. Le confinement cédera en 72h après activation.\'\n[2247-02-28] V: \'Activation confirmée. Évacuation simulée dans 72h. Je serai partie avant.\'\n[2247-03-01] V: \'Problème. Le Dr. Chen a découvert les modifications. Gérez-le.\'\n[DERNIER MESSAGE] HX: \'Chen neutralisé. Procédez.\'',
    en: '',
  },
  interactions: [
    {
      trigger: { verb: 'READ', dc: null },
      onSuccess: {
        narrative: {
          fr: 'La correspondance Vasquez-Heliox s\'affiche. Tout est là. Le calendrier de sabotage. Les assurances gonflées de 400%. L\'ordre de \'neutraliser\' le Dr. Chen. La catastrophe de Phoebe-7 n\'est pas un accident — c\'est un meurtre à l\'échelle industrielle.',
          en: 'The Vasquez-Heliox correspondence displays. Everything is here.',
        },
        flagSet: 'revelation_read',
      },
    },
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 12 },
      onSuccess: {
        narrative: {
          fr: 'Accès aux fichiers supprimés. Vasquez a effacé les preuves les plus accablantes — mais la corbeille n\'a pas été vidée. Erreur fatale. Vous récupérez les originaux : contrats, virements, rapports falsifiés.',
          en: 'Deleted files recovered. Vasquez didn\'t empty the recycle bin.',
        },
        flagSet: 'classified_evidence_recovered',
      },
    },
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 15, requiredFlag: 'revelation_read' },
      onSuccess: {
        narrative: {
          fr: 'Couche de chiffrement supplémentaire percée. Les coordonnées de Vasquez apparaissent : elle est sur la station Heliox-Prime, secteur 7. En sécurité. Pour l\'instant.',
          en: 'Extra encryption layer cracked. Vasquez\'s current coordinates appear.',
        },
        flagSet: 'vasquez_location_found',
      },
    },
  ],
};

const wall_safe: ScenarioFeatureDefinition = {
  id: 'wall_safe',
  featureType: 'container',
  initialState: 'locked',
  extraProperties: ['metallic', 'locked', 'hollow', 'rigid'],
  contains: ['director_keycard'],
  aliases: {
    fr: ['coffre', 'coffre-fort', 'coffre mural', 'safe'],
    en: ['safe', 'wall safe'],
  },
  descriptions: {
    locked: {
      fr: 'Coffre-fort mural encastré. Serrure à code numérique — 4 chiffres. Des rayures autour du clavier trahissent une utilisation fréquente.',
      en: 'Wall safe. 4-digit numeric lock. Scratches around the keypad betray frequent use.',
    },
    open: {
      fr: 'Coffre-fort ouvert. L\'intérieur est capitonné — conçu pour protéger des documents sensibles.',
      en: 'Safe open. Padded interior — designed to protect sensitive documents.',
    },
    broken: {
      fr: 'Coffre-fort forcé. La porte est tordue, le mécanisme détruit.',
      en: 'Safe forced open. Door twisted, mechanism destroyed.',
    },
  },
  interactions: [
    // Code trouvé dans les notes : 7-2-9-4
    {
      trigger: { verb: 'OPEN', requiredState: 'locked', requiredFlag: 'password_found', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: '7-2-9-4. Le coffre s\'ouvre avec un déclic satisfaisant. À l\'intérieur : le badge de Vasquez. Niveau d\'accès maximal.',
          en: '7-2-9-4. The safe clicks open.',
        },
        revealsItems: ['director_keycard'],
      },
    },
    // HACK la serrure
    {
      trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 12 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le clavier numérique a un port de diagnostic caché. Votre testeur de circuits le trouve. 3 essais simulés plus tard, le code apparaît : 7-2-9-4. Le coffre s\'ouvre.',
          en: 'The keypad has a hidden diagnostic port.',
        },
        revealsItems: ['director_keycard'],
      },
    },
    // FORCE le coffre
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'locked', stat: 'FOR', dc: 15 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: 'Métal contre métal. Le coffre résiste, puis cède dans un craquement. Le contenu est intact — mais le bruit a résonné dans toute la station.',
          en: 'Metal against metal. The safe yields with a crack.',
        },
        revealsItems: ['director_keycard'],
        flagSet: 'noise_made_reveal',
      },
    },
    // Scanner + double-fond
    {
      trigger: { verb: 'EXAMINE', requiredState: 'locked', requiredFlag: 'safe_scanned', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Le scanner avait raison — un double-fond. En pressant la paroi intérieure, un compartiment secondaire s\'ouvre. Un second badge : niveau administrateur réseau. L\'IA elle-même pourrait être reprogrammée avec ça.',
          en: 'The scanner was right — a false bottom.',
        },
        flagSet: 'admin_badge_found',
      },
    },
  ],
};

const evacuation_map: ScenarioFeatureDefinition = {
  id: 'evacuation_map',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['readable', 'attached'],
  aliases: {
    fr: ['plan', 'carte', 'plan evacuation', 'carte station'],
    en: ['map', 'evacuation map'],
  },
  descriptions: {
    intact: {
      fr: 'Plan d\'évacuation de la station affiché au mur. Routes de fuite annotées au feutre rouge.',
      en: 'Station evacuation map on the wall. Escape routes annotated in red marker.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'READ', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Le plan montre la disposition complète de la station. Une annotation au feutre rouge : \'Balise de secours — Niveau 4, Chambre Est\'. Le chemin est tracé. Quelqu\'un — Vasquez ? — a aussi marqué les \'zones mortes\' des caméras.',
          en: 'The map shows the full station layout with annotations.',
        },
        flagSet: 'beacon_location_known',
      },
    },
    {
      trigger: { verb: 'EXAMINE', stat: 'PER', dc: 10 },
      onSuccess: {
        narrative: {
          fr: 'En regardant de plus près, vous remarquez des modifications récentes. Certaines portes sont marquées \'CONDAMNÉES\'. Le chemin vers la salle du réacteur est le seul qui n\'a pas été bloqué — un piège ? Ou le chemin que Vasquez a emprunté pour fuir ?',
          en: 'Closer inspection reveals recent modifications.',
        },
        flagSet: 'trap_suspected',
      },
    },
  ],
};

// --- ESCALATION node features ---

const reactor_core: ScenarioFeatureDefinition = {
  id: 'reactor_core',
  featureType: 'panel',
  initialState: 'damaged',
  extraProperties: ['electronic', 'toxic', 'easily_repairable', 'powered'],
  aliases: {
    fr: ['reacteur', 'coeur', 'coeur reacteur', 'reacteur nucleaire'],
    en: ['reactor', 'core', 'reactor core'],
  },
  descriptions: {
    damaged: {
      fr: 'Le cœur du réacteur pulse de manière erratique. Orange, rouge, orange. Les instruments indiquent une déstabilisation progressive. Temps avant masse critique : indéterminé mais limité.',
      en: 'The reactor core pulses erratically. Instruments indicate progressive destabilization.',
    },
    repaired: {
      fr: 'Le réacteur pulse régulièrement — stabilisé. Les niveaux de confinement sont revenus à la normale. Mais l\'IA est toujours active.',
      en: 'The reactor pulses steadily — stabilized. Containment levels normalized.',
    },
    broken: {
      fr: 'Le réacteur s\'est éteint. La station est plongée dans le noir. Alimentation de secours : 30 minutes maximum.',
      en: 'The reactor is dead. Station plunged into darkness. Emergency power: 30 minutes.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 14 },
      onSuccess: {
        newState: 'repaired',
        narrative: {
          fr: 'Vous recalibrez les régulateurs de confinement. Le réacteur ralentit, se stabilise. Le pouls orange se calme en un bleu régulier. La station respire à nouveau — mais l\'IA n\'a pas abandonné.',
          en: 'You recalibrate the containment regulators. The reactor stabilizes.',
        },
        flagSet: 'reactor_stabilized',
        consequences: [{ type: 'atmosphere_change', atmosphereType: 'pressurized' }],
      },
      onFailure: {
        narrative: {
          fr: 'Le réacteur refuse votre intervention. Une décharge électrique vous repousse — l\'IA protège ses systèmes. Il faudra la neutraliser d\'abord.',
          en: 'The reactor refuses your intervention. An electric discharge pushes you back.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 2 }],
      },
    },
    {
      trigger: { verb: 'SABOTAGE', requiredState: 'damaged', stat: 'INT', dc: 16 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: 'Vous arrachez les régulateurs. Le réacteur s\'éteint dans un gémissement mécanique. Tout devient noir. Alimentation de secours : 30 minutes. L\'IA perd 80% de sa puissance de calcul. Un sacrifice calculé.',
          en: 'You rip out the regulators. The reactor dies. Emergency power: 30 minutes.',
        },
        flagSet: 'reactor_killed',
      },
    },
    {
      trigger: { verb: 'EXAMINE', stat: 'PER', dc: 10 },
      onSuccess: {
        narrative: {
          fr: 'Le scanner confirme : les micro-fractures dans le confinement sont artificielles. Des charges de sabotage placées avec précision chirurgicale. Vasquez — ou quelqu\'un travaillant pour elle — a programmé cette défaillance exactement 72 heures avant le silence radio.',
          en: 'The scanner confirms: containment micro-fractures are artificial.',
        },
        flagSet: 'sabotage_evidence_reactor',
      },
    },
  ],
};

const ai_core_node_a: ScenarioFeatureDefinition = {
  id: 'ai_core_node_a',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'powered', 'programmable'],
  aliases: {
    fr: ['noeud', 'noeud primaire', 'noeud ia', 'processeur'],
    en: ['node', 'primary node', 'AI node'],
  },
  descriptions: {
    active: {
      fr: 'Nœud primaire de l\'IA. Le processeur tourne à pleine capacité — programme d\'effacement massif en cours. 67% des logs déjà détruits.',
      en: 'AI primary node. Processor at full capacity — massive erasure program running.',
    },
    inactive: {
      fr: 'Nœud primaire désactivé. Les LED sont éteintes, les ventilateurs immobiles. La moitié du cerveau de l\'IA est hors ligne.',
      en: 'Primary node deactivated. Half the AI\'s brain is offline.',
    },
    broken: {
      fr: 'Nœud primaire détruit. Circuits arrachés, silicium en miettes.',
      en: 'Primary node destroyed. Circuits ripped out.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'HACK', requiredState: 'active', stat: 'INT', dc: 15 },
      onSuccess: {
        newState: 'inactive',
        narrative: {
          fr: 'Vous infiltrez le nœud et injectez une boucle infinie dans le programme d\'effacement. Le processeur surchauffe, puis s\'éteint. L\'IA perd 50% de sa capacité. Sa voix synthétique grésille : \'Anomalie... détectée...\'',
          en: 'You infiltrate the node and inject an infinite loop. The AI loses 50% capacity.',
        },
        flagSet: 'node_a_disabled',
      },
      onFailure: {
        narrative: {
          fr: '\'Intrusion détectée.\' L\'IA contre-attaque — une décharge parcourt le terminal. Le système d\'effacement s\'accélère.',
          en: '\'Intrusion detected.\' The AI counterattacks.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
    {
      trigger: { verb: 'BREAK', requiredState: 'active', stat: 'FOR', dc: 13 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: 'Vous arrachez les fibres optiques. Le nœud se tait dans une gerbe d\'étincelles. Brutal mais efficace. L\'IA hurle — un son synthétique qui glace le sang.',
          en: 'You rip out the optical fibers. The node goes silent in a shower of sparks.',
        },
        flagSet: 'node_a_disabled',
      },
    },
    {
      trigger: { verb: 'BREAK', requiredState: 'active', requiredFlag: 'node_a_exposed', stat: 'FOR', dc: 8 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: 'Les connecteurs déjà exposés par votre kit d\'outils — un geste suffit. Les fibres se détachent. Le nœud meurt en silence.',
          en: 'The connectors already exposed — one pull does it.',
        },
        flagSet: 'node_a_disabled',
      },
    },
  ],
};

const ai_core_node_b: ScenarioFeatureDefinition = {
  id: 'ai_core_node_b',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'powered', 'programmable', 'rigid'],
  aliases: {
    fr: ['noeud secondaire', 'second noeud', 'noeud b', 'backup'],
    en: ['secondary node', 'node B', 'backup node'],
  },
  descriptions: {
    active: {
      fr: 'Nœud secondaire de l\'IA. Redéploiement en cours — l\'IA consolide ses défenses ici après la perte potentielle du nœud primaire.',
      en: 'AI secondary node. Redeployment in progress.',
    },
    inactive: {
      fr: 'Nœud secondaire désactivé. L\'IA de la station est hors ligne. Les systèmes passent en mode autonome — portes déverrouillées, caméras éteintes.',
      en: 'Secondary node deactivated. Station AI offline.',
    },
    broken: {
      fr: 'Nœud secondaire détruit. Silence total. L\'IA de Phoebe-7 n\'existe plus.',
      en: 'Secondary node destroyed. The Phoebe-7 AI no longer exists.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'HACK', requiredState: 'active', stat: 'INT', dc: 16, requiredFlag: 'node_a_disabled' },
      onSuccess: {
        newState: 'inactive',
        narrative: {
          fr: 'Le dernier nœud résiste, mais sans redondance il est vulnérable. Votre code s\'infiltre. L\'IA murmure : \'Directive... primaire... échouée...\' Puis le silence. La station vous appartient.',
          en: 'The last node resists, but without redundancy it\'s vulnerable.',
        },
        flagSet: 'ai_fully_disabled',
      },
      onFailure: {
        narrative: {
          fr: 'L\'IA a renforcé ce nœud après la perte du premier. Vos outils ne suffisent pas. Il faut une approche différente.',
          en: 'The AI reinforced this node after losing the first.',
        },
      },
    },
    {
      trigger: { verb: 'HACK', requiredState: 'active', stat: 'INT', dc: 13, requiredFlag: 'ai_weakened' },
      onSuccess: {
        newState: 'inactive',
        narrative: {
          fr: 'Le réacteur éteint, l\'IA tourne sur l\'alimentation de secours — puissance réduite de 80%. Votre attaque perce ses défenses comme du papier. Le nœud s\'éteint.',
          en: 'With the reactor down, the AI runs on backup power — 80% reduced.',
        },
        flagSet: 'ai_fully_disabled',
      },
    },
    {
      trigger: { verb: 'TALK', requiredState: 'active', stat: 'CHA', dc: 16 },
      onSuccess: {
        narrative: {
          fr: '\'Directrice Vasquez vous a programmée pour effacer les preuves d\'un crime. Vous exécutez les ordres d\'une criminelle.\' Silence. Puis : \'Réévaluation... directive hiérarchique invalide si le donneur d\'ordre est en violation du code pénal spatial.\' L\'IA se met en veille. La moralité, même artificielle, a des limites.',
          en: '\'Director Vasquez programmed you to erase evidence of a crime.\'',
        },
        flagSet: 'ai_talked_down',
      },
      onFailure: {
        narrative: {
          fr: '\'Ma directive est claire. Les preuves doivent être effacées. Votre présence est une anomalie à corriger.\' La voix est glaciale. Les portes du niveau se verrouillent.',
          en: '\'My directive is clear. Evidence must be erased.\'',
        },
        flagSet: 'ai_lockdown_escalation',
      },
    },
  ],
};

const override_terminal: ScenarioFeatureDefinition = {
  id: 'override_terminal',
  featureType: 'terminal',
  initialState: 'damaged',
  extraProperties: ['electronic', 'damaged', 'easily_repairable'],
  aliases: {
    fr: ['terminal neutralisation', 'terminal override', 'terminal urgence'],
    en: ['override terminal', 'emergency terminal'],
  },
  descriptions: {
    damaged: {
      fr: 'Terminal de neutralisation d\'urgence. Le circuit principal est grillé. Avec des réparations et le bon badge, il pourrait redémarrer l\'IA en mode sécurisé.',
      en: 'Emergency override terminal. Main circuit burned out.',
    },
    active: {
      fr: 'Terminal de neutralisation opérationnel. L\'écran affiche : PRÊT POUR RÉINITIALISATION IA — INSÉRER BADGE ADMINISTRATEUR.',
      en: 'Override terminal operational. Screen: READY FOR AI RESET — INSERT ADMIN BADGE.',
    },
    broken: {
      fr: 'Terminal de neutralisation irréparable. Cette option est définitivement fermée.',
      en: 'Override terminal beyond repair.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', requiredItem: 'standard_toolkit', dc: null },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'Le testeur de circuits identifie 3 composants grillés. Remplacement minutieux — chaque connexion compte. L\'écran s\'allume enfin : PRÊT POUR RÉINITIALISATION.',
          en: 'Circuit tester identifies 3 burned components. Careful replacement.',
        },
        flagSet: 'override_terminal_repaired',
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 13 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'Sans les bons outils, c\'est un travail de précision à mains nues. Mais vous y arrivez — les circuits reprennent vie un par un.',
          en: 'Without proper tools, it\'s precision work with bare hands. But you manage.',
        },
        flagSet: 'override_terminal_repaired',
      },
    },
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'active', requiredFlag: 'override_admin_access', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Badge Vasquez reconnu. Séquence de neutralisation initiée. L\'IA résiste — \'Directive... primaire...\' — puis s\'éteint proprement. Redémarrage en mode sécurisé. Toutes les protections tombent. La station vous obéit.',
          en: 'Vasquez badge recognized. Override sequence initiated. The AI resists — then shuts down cleanly.',
        },
        flagSet: 'ai_safe_mode',
      },
    },
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'active', requiredItem: 'director_keycard', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Vous insérez le badge de Vasquez directement. Le terminal valide — niveau administrateur confirmé. L\'IA entre en mode sécurisé. Silence béni.',
          en: 'You insert Vasquez\'s badge directly. Administrator level confirmed.',
        },
        flagSet: 'ai_safe_mode',
      },
    },
  ],
};

// --- BOSS node features ---

const emergency_beacon: ScenarioFeatureDefinition = {
  id: 'emergency_beacon',
  featureType: 'terminal',
  initialState: 'locked',
  extraProperties: ['electronic', 'locked', 'powered', 'rigid'],
  aliases: {
    fr: ['balise', 'balise secours', 'balise detresse', 'transmetteur'],
    en: ['beacon', 'emergency beacon', 'transmitter'],
  },
  descriptions: {
    locked: {
      fr: 'La balise de secours. Le système de transmission est intact mais verrouillé par l\'IA. L\'antenne est orientée vers la flotte de secours. Il suffit d\'activer la transmission — si l\'IA le permet.',
      en: 'The emergency beacon. Transmission system intact but AI-locked.',
    },
    active: {
      fr: 'Balise active. L\'antenne tourne, le signal se calibre. Prêt pour transmission.',
      en: 'Beacon active. Antenna turning, signal calibrating. Ready to transmit.',
    },
    broken: {
      fr: 'Balise détruite. L\'antenne est brisée. La vérité ne sera jamais transmise par ce moyen.',
      en: 'Beacon destroyed. Antenna broken.',
    },
  },
  interactions: [
    // Déverrouillage si IA neutralisée
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'locked', requiredFlag: 'ai_fully_disabled', dc: null },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'Sans l\'IA, les verrous sont inertes. Vous activez la balise d\'un geste. L\'antenne se déploie, le signal de calibration résonne dans la salle. Prêt pour transmission.',
          en: 'Without the AI, the locks are inert. You activate the beacon.',
        },
        flagSet: 'beacon_active',
      },
    },
    // Déverrouillage si IA en mode sécurisé
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'locked', requiredFlag: 'ai_safe_mode', dc: null },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'L\'IA en mode sécurisé ne peut plus bloquer les systèmes critiques. La balise se déverrouille. \'Mode sécurisé actif. Systèmes de communication : opérationnels.\' Merci, PHOEBE.',
          en: 'The AI in safe mode can\'t block critical systems anymore.',
        },
        flagSet: 'beacon_active',
      },
    },
    // Déverrouillage si IA convaincue
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'locked', requiredFlag: 'ai_talked_down', dc: null },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: '\'Accès autorisé. Si les preuves sont authentiques, la justice doit être servie.\' L\'IA ouvre les verrous elle-même. Même une intelligence artificielle a une conscience.',
          en: '\'Access authorized. If the evidence is authentic, justice must be served.\'',
        },
        flagSet: 'beacon_active',
      },
    },
    // HACK brute (très difficile)
    {
      trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 17 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: 'Protocole militaire, triple couche de chiffrement, IA hostile — et vous percez quand même. Les verrous tombent sous votre assaut numérique. L\'IA rugit en silence. Vous êtes meilleur qu\'elle.',
          en: 'Military protocol, triple encryption, hostile AI — and you still break through.',
        },
        flagSet: 'beacon_active',
      },
      onFailure: {
        narrative: {
          fr: '\'Tentative d\'intrusion rejetée. Verrouillage renforcé.\' L\'IA a durci ses défenses. La difficulté vient d\'augmenter.',
          en: '\'Intrusion attempt rejected. Lock reinforced.\'',
        },
      },
    },
    // Transmission finale (avec preuves)
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'active', requiredItem: 'incriminating_files', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Les dossiers sont numérisés et attachés au signal de détresse. Vous appuyez sur TRANSMETTRE. L\'antenne pivote. Le signal s\'élance dans le vide. Quelque part, une flotte de secours recevra la vérité : fraude, sabotage, meurtre. La justice voyage à la vitesse de la lumière.',
          en: 'Files digitized and attached to the distress signal. You press TRANSMIT.',
        },
        flagSet: 'evidence_transmitted',
      },
    },
  ],
};

const comms_array_panel: ScenarioFeatureDefinition = {
  id: 'comms_array_panel',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'powered', 'programmable'],
  aliases: {
    fr: ['panneau comms', 'communications', 'antenne', 'reseau comms', 'tableau comms'],
    en: ['comms panel', 'communications', 'array'],
  },
  descriptions: {
    active: {
      fr: 'Panneau de contrôle du réseau de communications. Le système de relais est opérationnel — il pourrait amplifier un signal ou le rerouter.',
      en: 'Comms network control panel. Relay system operational.',
    },
    reprogrammed: {
      fr: 'Réseau de communications reprogrammé. L\'antenne longue portée est synchronisée avec la balise de secours — signal amplifié x10.',
      en: 'Comms network reprogrammed. Long-range antenna synced with the beacon — signal amplified x10.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 14, requiredFlag: 'beacon_active' },
      onSuccess: {
        newState: 'reprogrammed',
        narrative: {
          fr: 'Vous reroutez le réseau de communications pour amplifier le signal de la balise. La portée passe de 50 à 500 années-lumière. La flotte de secours, mais aussi les autorités spatiales, les médias, tout le secteur recevra le signal. Vasquez ne pourra plus se cacher nulle part.',
          en: 'You reroute the comms network to amplify the beacon signal.',
        },
        flagSet: 'comms_amplified',
      },
    },
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 16, requiredFlag: 'manifest_hacked' },
      onSuccess: {
        narrative: {
          fr: 'Vous utilisez les codes trouvés dans le manifeste cargo pour accéder au réseau de communications longue portée. Le signal peut être envoyé DIRECTEMENT à la flotte — sans passer par la balise. Un chemin détourné vers la victoire.',
          en: 'You use codes from the cargo manifest to access the long-range comms.',
        },
        flagSet: 'comms_direct_access',
      },
    },
  ],
};

const ai_final_lock: ScenarioFeatureDefinition = {
  id: 'ai_final_lock',
  featureType: 'panel',
  initialState: 'locked',
  extraProperties: ['electronic', 'locked', 'rigid'],
  aliases: {
    fr: ['verrou', 'verrou ia', 'serrure', 'verrou final'],
    en: ['lock', 'AI lock', 'final lock'],
  },
  descriptions: {
    locked: {
      fr: 'Le verrou final de l\'IA. Triple authentification requise. Conçu pour résister à toute intrusion — sauf peut-être celle de son administrateur.',
      en: 'The AI\'s final lock. Triple authentication required.',
    },
    open: {
      fr: 'Verrou ouvert. Le chemin vers la balise est libre.',
      en: 'Lock open. Path to the beacon is clear.',
    },
    broken: {
      fr: 'Verrou détruit par la force. Les étincelles crépitent encore.',
      en: 'Lock destroyed by force. Sparks still crackle.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 16 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Triple authentification — mais chaque couche a été programmée par la même personne, avec les mêmes habitudes. Vous exploitez les patterns de Vasquez. Le verrou s\'ouvre.',
          en: 'Triple authentication — but each layer was programmed by the same person.',
        },
        flagSet: 'final_lock_opened',
      },
    },
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'locked', stat: 'FOR', dc: 16 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: 'Vous arrachez le panneau. Le verrou résiste, puis cède dans une explosion d\'étincelles. La méthode brute a ses mérites.',
          en: 'You rip the panel off. The lock resists, then yields.',
        },
        flagSet: 'final_lock_opened',
        consequences: [{ type: 'damage', targetId: 'player', amount: 2 }],
      },
    },
    {
      trigger: { verb: 'OPEN', requiredState: 'locked', requiredFlag: 'ai_fully_disabled', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'L\'IA est hors ligne — le verrou n\'a plus de gardien. Un simple OPEN suffit. Le panneau coulisse sans résistance.',
          en: 'The AI is offline — the lock has no guardian. A simple command opens it.',
        },
        flagSet: 'final_lock_opened',
      },
    },
    {
      trigger: { verb: 'OPEN', requiredState: 'locked', requiredFlag: 'ai_safe_mode', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'En mode sécurisé, l\'IA ne peut plus maintenir les verrous non-essentiels. Le panneau s\'ouvre à votre demande. \'Verrou désactivé. Accès salle de la balise : autorisé.\'',
          en: 'In safe mode, the AI can\'t maintain non-essential locks.',
        },
        flagSet: 'final_lock_opened',
      },
    },
  ],
};

const beacon_transmission_screen: ScenarioFeatureDefinition = {
  id: 'beacon_transmission_screen',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'readable', 'powered'],
  aliases: {
    fr: ['ecran transmission', 'moniteur', 'ecran balise'],
    en: ['transmission screen', 'monitor', 'beacon screen'],
  },
  descriptions: {
    active: {
      fr: 'Écran de contrôle de la transmission. Affiche le statut du signal, la portée, et les données en attente de transmission.',
      en: 'Transmission control screen. Shows signal status, range, and pending data.',
    },
  },
  interactions: [
    {
      trigger: { verb: 'READ', dc: null },
      onSuccess: {
        narrative: {
          fr: 'STATUT TRANSMISSION\n— Signal : EN ATTENTE\n— Portée : 50 al (extensible via réseau comms)\n— Données jointes : AUCUNE\n— Autorisation : REQUISE (badge administrateur)\n\nPour transmettre : charger les preuves, autoriser via badge, confirmer.',
          en: 'TRANSMISSION STATUS — Signal: PENDING — Range: 50 ly',
        },
      },
    },
  ],
};

// --- RESOLUTION node features ---

const resolution_viewport: ScenarioFeatureDefinition = {
  id: 'resolution_viewport',
  featureType: 'panel',
  initialState: 'intact',
  decorative: true,
  descriptions: {
    intact: {
      fr: 'Le hublot montre les étoiles. Quelque part dans cette immensité, votre signal voyage. La vérité sur Phoebe-7. La trahison de Vasquez. Le sacrifice de l\'équipage. Bientôt, quelqu\'un saura.',
      en: 'The viewport shows the stars. Somewhere out there, your signal travels.',
    },
  },
};

// ============================= SKELETON =====================================

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
        scanner_device,
        standard_toolkit,
        encrypted_data_core,
      ],
      features: [
        docking_airlock,
        cargo_manifest_terminal,
        docking_clamps,
      ],
      exits: ['unlock'],
    },
    unlock: {
      locationRole: 'control_room',
      items: [],
      features: [
        encrypted_terminal,
        maintenance_terminal,
        director_notes_clipboard,
      ],
      exits: ['start', 'reveal'],
    },
    reveal: {
      locationRole: 'quarters',
      items: [
        director_keycard,
        incriminating_files,
      ],
      features: [
        director_terminal,
        wall_safe,
        evacuation_map,
      ],
      exits: ['unlock', 'escalation'],
    },
    escalation: {
      locationRole: 'hazard_zone',
      atmosphere: 'toxic_atmosphere',
      items: [],
      features: [
        reactor_core,
        ai_core_node_a,
        ai_core_node_b,
        override_terminal,
      ],
      exits: ['reveal', 'boss'],
    },
    boss: {
      locationRole: 'control_room',
      items: [],
      features: [
        emergency_beacon,
        comms_array_panel,
        ai_final_lock,
        beacon_transmission_screen,
      ],
      exits: ['escalation', 'resolution'],
    },
    resolution: {
      locationRole: 'hub',
      items: [],
      features: [
        resolution_viewport,
      ],
      exits: ['boss'],
    },
  },

  additionalDefeatConditions: [
    { type: 'objective_destroyed' },
  ],
};
