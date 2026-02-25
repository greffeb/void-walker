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
        { id: 'scanner_device', examineResult: { fr: 'Scanner portable multi-fréquence. Détecte les anomalies biologiques et électroniques dans un rayon de 10 mètres. La batterie est chargée à 89%.', en: '' } },
        { id: 'standard_toolkit', examineResult: { fr: 'Trousse à outils standard d\'intervention. Contient tournevis magnétiques, pince multifonction, et testeur de circuits. Tout le nécessaire pour les réparations de base.', en: '' } },
        { id: 'encrypted_data_core', hidden: true, examineResult: { fr: 'Un noyau de données lourdement chiffré — protocole militaire de niveau 4. Il contient les logs de la station des dernières 72 heures. La clé de déchiffrement doit être quelque part sur la station.', en: '' } },
      ],
      features: [
        { id: 'docking_airlock', initialState: 'open', examineResult: { fr: 'Le sas d\'amarrage est ouvert — votre navette est arrimée de l\'autre côté. Les indicateurs de pression sont normaux. Au moins l\'atmosphère est respirable.', en: '' } },
        { id: 'cargo_manifest_terminal', initialState: 'intact', examineResult: { fr: 'Le manifeste cargo révèle que la station a reçu un chargement non-répertorié il y a 3 mois : "Matériel de recherche avancée — Autorisation Directrice Vasquez uniquement". Pas de détail sur le contenu.', en: '' } },
        { id: 'docking_clamps', initialState: 'intact', examineResult: { fr: 'Les pinces d\'amarrage maintiennent votre navette en position. Le système de largage rapide est fonctionnel — pour un départ précipité si nécessaire.', en: '' } },
      ],
      exits: ['unlock'],
    },
    unlock: {
      locationRole: 'control_room',
      items: [],
      features: [
        { id: 'encrypted_terminal', initialState: 'locked', examineResult: { fr: 'Terminal de communications principal. L\'écran affiche "ACCÈS RESTREINT — CLÉ DE CHIFFREMENT REQUISE". Un noyau de données compatible pourrait déverrouiller les logs de la station.', en: '' } },
        { id: 'maintenance_terminal', initialState: 'damaged', examineResult: { fr: 'Terminal de maintenance auxiliaire. L\'écran est fissuré mais certaines fonctions sont accessibles. Les journaux de maintenance montrent des interventions non autorisées sur le système de confinement — datées d\'il y a 72 heures exactement.', en: '' } },
        { id: 'director_notes_clipboard', initialState: 'intact', examineResult: { fr: 'Le bloc-notes de la directrice. Des notes manuscrites : "Compte à rebours lancé. 72h avant procédure d\'évacuation automatique. Vérifier que les logs sont effacés AVANT." Le reste est raturé avec insistance.', en: '' } },
      ],
      exits: ['start', 'reveal'],
    },
    reveal: {
      locationRole: 'quarters',
      items: [
        { id: 'director_keycard', examineResult: { fr: 'Badge personnel de la Directrice Vasquez. Niveau d\'accès maximal. Un post-it collé au dos porte un code : "7-2-9-4". Sa négligence pourrait vous sauver.', en: '' } },
        { id: 'incriminating_files', examineResult: { fr: 'Dossiers compromettants : correspondance entre Vasquez et le consortium Heliox. Polices d\'assurance sur la station gonflées de 400%. Plan de sabotage détaillé, cibles de confinement identifiées, calendrier de destruction programmé. La preuve irréfutable.', en: '' } },
      ],
      features: [
        { id: 'director_terminal', initialState: 'intact', examineResult: { fr: 'Le terminal personnel de Vasquez. Les fichiers révèlent tout : la défaillance du confinement était planifiée. Fraude à l\'assurance — la station vaut plus détruite qu\'en activité. L\'équipage était sacrifié dès le départ.', en: '' } },
        { id: 'wall_safe', initialState: 'locked', examineResult: { fr: 'Coffre-fort mural encastré. Serrure à code numérique — 4 chiffres. La surface est rayée autour du clavier, signe d\'utilisation fréquente.', en: '' } },
        { id: 'evacuation_map', initialState: 'intact', examineResult: { fr: 'Plan d\'évacuation de la station. Les routes vers la baie d\'amarrage et la salle du réacteur sont marquées. Une note au feutre rouge indique : "Balise de secours — Niveau 4, Chambre Est".', en: '' } },
      ],
      exits: ['unlock', 'escalation'],
    },
    escalation: {
      locationRole: 'hazard_zone',
      items: [],
      features: [
        { id: 'reactor_core', initialState: 'damaged', examineResult: { fr: 'Le cœur du réacteur pulse de manière irrégulière. Les instruments indiquent une déstabilisation progressive — conséquence directe du sabotage de Vasquez. Temps estimé avant masse critique : indéterminé mais limité.', en: '' } },
        { id: 'ai_core_node_a', initialState: 'intact', examineResult: { fr: 'Nœud primaire de l\'IA de station. Le processeur tourne à pleine capacité — il exécute un programme d\'effacement massif des logs. Désactiver ce nœud réduirait la capacité de l\'IA de 50%.', en: '' } },
        { id: 'ai_core_node_b', initialState: 'intact', examineResult: { fr: 'Nœud secondaire de l\'IA. Redéploiement en cours — l\'IA consolide ses défenses ici. Désactiver les deux nœuds mettrait l\'IA hors service, mais les systèmes vitaux de la station aussi.', en: '' } },
        { id: 'override_terminal', initialState: 'locked', examineResult: { fr: 'Terminal de neutralisation d\'urgence. Permet de redémarrer l\'IA en mode sécurisé — mais nécessite le badge de la directrice et un code d\'accès.', en: '' } },
      ],
      exits: ['reveal', 'boss'],
    },
    boss: {
      locationRole: 'control_room',
      items: [],
      features: [
        { id: 'emergency_beacon', initialState: 'locked', examineResult: { fr: 'La balise de secours — votre objectif. Le système de transmission est intact mais verrouillé par l\'IA. L\'antenne est orientée vers le secteur de la flotte de secours. Il suffit d\'activer la transmission avec les preuves à bord.', en: '' } },
        { id: 'comms_array_panel', initialState: 'intact', examineResult: { fr: 'Panneau du réseau de communications. Les fréquences de la flotte sont encore programmées. Le signal pourrait également être rerouté par l\'antenne extérieure pour une portée maximale.', en: '' } },
        { id: 'ai_final_lock', initialState: 'intact', examineResult: { fr: 'Dernière couche de sécurité de l\'IA. Un champ de force électronique protège la balise. Le contourner demande soit de neutraliser l\'IA, soit de trouver une faille dans le système de défense.', en: '' } },
      ],
      exits: ['escalation', 'resolution'],
    },
    resolution: {
      locationRole: 'hub',
      items: [],
      features: [
        { id: 'beacon_transmission_screen', initialState: 'intact', examineResult: { fr: 'L\'écran de transmission affiche : "SIGNAL TRANSMIS — PORTÉE ESTIMÉE : 12 PARSECS". La vérité voyage désormais à travers le vide. Vasquez ne s\'en tirera pas.', en: '' } },
      ],
      exits: ['boss'],
    },
  },

  additionalDefeatConditions: [
    { type: 'objective_destroyed' },
  ],
};
