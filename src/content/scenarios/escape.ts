// ---------------------------------------------------------------------------
// src/content/scenarios/escape.ts — ESCAPE skeleton: "Fuir l'Épave"
// ---------------------------------------------------------------------------
// Fantasy: Dead Space × Alien. Wake up, survive, get out.
// 6 core nodes, gate item: access_keycard, boss type: escape
// ---------------------------------------------------------------------------
// Chantier 2: Fully enriched nodeLocations with ScenarioFeatureDefinition
// and ScenarioItemDefinition — mechanical interactions, properties, aliases.
// ---------------------------------------------------------------------------

import type { CoreSkeleton, ScenarioFeatureDefinition, ScenarioItemDefinition } from '@engine/scenario';

// ============================= ITEMS ========================================

// --- START node items ---

const emergency_flashlight: ScenarioItemDefinition = {
  id: 'emergency_flashlight',
  itemType: 'tool',
  extraProperties: ['light_source', 'small'],
  aliases: {
    fr: ['lampe', 'lampe torche', 'lampe de secours', 'torche', 'flashlight', 'lampe electrique'],
    en: ['flashlight', 'torch', 'emergency flashlight', 'light', 'lamp'],
  },
  description: {
    fr: 'Une lampe torche de secours standard. La batterie indique 73%. Assez pour éclairer votre chemin dans les sections sombres.',
    en: 'A standard emergency flashlight. Battery at 73%. Enough to light your way through dark sections.',
  },
};

const medkit_basic: ScenarioItemDefinition = {
  id: 'medkit_basic',
  itemType: 'consumable',
  extraProperties: ['organic_compatible'],
  aliases: {
    fr: ['kit', 'kit medical', 'medkit', 'trousse', 'trousse medicale', 'soins', 'pansement'],
    en: ['medkit', 'med kit', 'first aid', 'medical kit', 'bandage'],
  },
  description: {
    fr: 'Kit médical d\'urgence. Contient des bandages compressifs, un antiseptique et une dose d\'analgésique. Suffisant pour traiter une blessure légère.',
    en: 'Emergency medical kit. Contains compression bandages, antiseptic, and a painkiller dose. Enough for a minor wound.',
  },
};

const access_keycard: ScenarioItemDefinition = {
  id: 'access_keycard',
  hidden: true,
  itemType: 'key_item',
  extraProperties: ['electronic', 'flat', 'data_storage'],
  aliases: {
    fr: ['badge', 'badge d\'acces', 'keycard', 'carte', 'carte d\'acces', 'badge chen', 'pass', 'badge magnetique'],
    en: ['keycard', 'access keycard', 'access card', 'badge', 'card', 'pass', 'key card'],
  },
  description: {
    fr: 'Un badge d\'accès de niveau 3 — celui du technicien Chen. Encore actif. Il devrait ouvrir la cloison de sécurité.',
    en: 'A level 3 access keycard — Technician Chen\'s. Still active. Should open the security bulkhead.',
  },
  revealedBy: {
    featureId: 'emergency_locker',
    requiredState: 'open',
  },
  useOn: [
    {
      targetId: 'security_panel',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Vous passez le badge sur le lecteur. Bip. Le voyant passe au vert. La cloison blindée gronde — les verrous magnétiques se rétractent un à un. Le passage est libre.',
            en: 'You swipe the badge on the reader. Beep. The indicator turns green. The bulkhead groans — magnetic locks retract one by one. The way is clear.',
          },
          flagSet: 'bulkhead_unlocked',
        },
      },
    },
    {
      targetId: 'escape_pod_hatch',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Le badge active l\'écoutille du pod. Les joints pneumatiques sifflent — la porte s\'ouvre sur l\'intérieur exigu de la capsule d\'évasion.',
            en: 'The badge activates the pod hatch. Pneumatic seals hiss — the door opens to the cramped escape pod interior.',
          },
          flagSet: 'pod_hatch_open',
        },
      },
    },
  ],
};

const oxygen_canister: ScenarioItemDefinition = {
  id: 'oxygen_canister',
  hidden: true,
  itemType: 'consumable',
  extraProperties: ['metallic', 'sealed', 'heavy'],
  removeProperties: ['small'],
  aliases: {
    fr: ['bonbonne', 'bonbonne d\'oxygene', 'oxygene', 'bouteille', 'bouteille o2', 'bonbonne o2', 'canister'],
    en: ['canister', 'oxygen canister', 'oxygen', 'o2 tank', 'o2 canister', 'tank'],
  },
  description: {
    fr: 'Bonbonne d\'oxygène de secours scellée. La jauge indique un remplissage complet. Utilisable pour restaurer votre réserve d\'O₂ en cas de dépressurisation.',
    en: 'Sealed emergency oxygen canister. Gauge shows full. Can restore your O₂ reserve in case of depressurization.',
  },
  revealedBy: {
    featureId: 'emergency_locker',
    requiredState: 'open',
  },
};

// --- REVEAL node items ---

const captain_log_datapad: ScenarioItemDefinition = {
  id: 'captain_log_datapad',
  itemType: 'data',
  extraProperties: ['electronic', 'readable', 'data_storage', 'small'],
  aliases: {
    fr: ['datapad', 'datapad du capitaine', 'journal', 'tablette', 'journal de bord', 'pad'],
    en: ['datapad', 'captain log', 'captain datapad', 'tablet', 'log', 'pad'],
  },
  description: {
    fr: 'Le dernier journal du Capitaine Reeves. L\'écran affiche la dernière entrée — tremblante, écrite à la hâte.',
    en: 'Captain Reeves\' final log. The screen shows the last entry — shaky, hastily written.',
  },
  readableContent: {
    fr: '[ JOURNAL DU CAPITAINE REEVES — ENTRÉE FINALE ]\n\nProjet ORACLE hors de contrôle. Le spécimen Alpha a éliminé les équipes de confinement. J\'ai scellé les sections 4 à 7.\n\nSi quelqu\'un lit ceci... fuyez.\nNe tentez pas de la combattre.\nFuyez.',
    en: '[ CAPTAIN REEVES LOG — FINAL ENTRY ]\n\nProject ORACLE out of control. Specimen Alpha eliminated containment teams. I sealed sections 4 through 7.\n\nIf anyone reads this... run.\nDon\'t try to fight it.\nRun.',
  },
};

const EVA_suit_locker_key: ScenarioItemDefinition = {
  id: 'EVA_suit_locker_key',
  hidden: true,
  itemType: 'key_item',
  extraProperties: ['small', 'flat'],
  aliases: {
    fr: ['cle', 'cle magnetique', 'cle eva', 'cle du casier', 'petite cle'],
    en: ['key', 'magnetic key', 'eva key', 'locker key', 'small key'],
  },
  description: {
    fr: 'Une petite clé magnétique. L\'étiquette indique "Casier EVA — Pont 3".',
    en: 'A small magnetic key. The label reads "EVA Locker — Deck 3".',
  },
  revealedBy: {
    featureId: 'captain_terminal',
    requiredState: 'searched',
  },
  useOn: [
    {
      targetId: 'EVA_suit_locker',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'La clé magnétique s\'insère parfaitement. Le verrou claque — le casier EVA s\'ouvre, révélant une combinaison spatiale intacte.',
            en: 'The magnetic key fits perfectly. The lock clicks — the EVA locker opens, revealing an intact space suit.',
          },
          revealsItems: ['eva_suit'],
        },
      },
    },
  ],
};

// --- ESCALATION node items ---

const eva_suit: ScenarioItemDefinition = {
  id: 'eva_suit',
  hidden: true,
  itemType: 'key_item',
  extraProperties: ['equippable', 'sealed', 'synthetic', 'heavy'],
  removeProperties: ['small'],
  aliases: {
    fr: ['combinaison', 'combinaison eva', 'combinaison spatiale', 'scaphandre', 'suit'],
    en: ['suit', 'eva suit', 'space suit', 'spacesuit'],
  },
  description: {
    fr: 'Combinaison EVA intacte. Autonomie d\'oxygène personnelle de 30 minutes. Protection contre le vide et les variations de pression.',
    en: 'Intact EVA suit. Personal oxygen autonomy of 30 minutes. Protection against vacuum and pressure changes.',
  },
  revealedBy: {
    featureId: 'EVA_suit_locker',
    requiredState: 'open',
  },
};

const makeshift_weapon: ScenarioItemDefinition = {
  id: 'makeshift_weapon',
  hidden: true,
  itemType: 'weapon',
  extraProperties: ['metallic', 'rigid', 'blunt', 'heavy'],
  removeProperties: ['small'],
  aliases: {
    fr: ['barre', 'barre metallique', 'barre de metal', 'arme', 'arme improvisee', 'gourdin'],
    en: ['bar', 'metal bar', 'weapon', 'makeshift weapon', 'club', 'improvised weapon'],
  },
  description: {
    fr: 'Une barre métallique arrachée au conduit d\'énergie. Lourde et solide — pas l\'arme la plus élégante, mais elle fera mal.',
    en: 'A metal bar torn from the power conduit. Heavy and solid — not the most elegant weapon, but it\'ll hurt.',
  },
  revealedBy: {
    featureId: 'power_conduit',
    requiredState: 'broken',
  },
};

// ============================= FEATURES =====================================

// --- START node features ---

const cryopod: ScenarioFeatureDefinition = {
  id: 'cryopod',
  initialState: 'broken',
  featureType: 'container',
  extraProperties: ['electronic', 'large', 'broken'],
  removeProperties: ['openable', 'lockable'],
  aliases: {
    fr: ['capsule', 'capsule cryogenique', 'cryopod', 'pod', 'cryo', 'capsule cryo', 'lit', 'caisson'],
    en: ['cryopod', 'pod', 'capsule', 'cryo pod', 'cryo capsule', 'bed'],
  },
  descriptions: {
    broken: {
      fr: 'Votre capsule cryogénique. Le couvercle s\'est ouvert d\'urgence — le voyant indique une coupure de courant il y a 4 heures. Le gel cryogénique a coulé sur le sol, formant une flaque translucide. Les autres capsules sont vides. Depuis longtemps.',
      en: 'Your cryogenic pod. The lid opened on emergency power — the indicator shows a power cut 4 hours ago. Cryogenic gel has pooled on the floor. The other pods are empty. Have been for a while.',
    },
  },
  decorative: true,
};

const status_terminal: ScenarioFeatureDefinition = {
  id: 'status_terminal',
  initialState: 'damaged',
  featureType: 'terminal',
  extraProperties: ['breakable'],
  aliases: {
    fr: ['terminal', 'terminal de statut', 'ecran', 'console', 'moniteur', 'ordinateur'],
    en: ['terminal', 'status terminal', 'screen', 'console', 'monitor', 'computer'],
  },
  descriptions: {
    damaged: {
      fr: 'L\'écran clignote entre des bribes de données : "ALERTE CONFINEMENT — NIVEAU 5"... "Équipage : 0/47 actifs"... "Support vie : CRITIQUE". La date affichée montre que 6 mois se sont écoulés depuis votre mise en cryo.',
      en: 'The screen flickers between data fragments: "CONTAINMENT ALERT — LEVEL 5"... "Crew: 0/47 active"... "Life support: CRITICAL".',
    },
    active: {
      fr: 'Le terminal fonctionne de nouveau. Les données défilent : diagnostics système, journaux d\'alertes, carte du vaisseau partiellement corrompue.',
      en: 'The terminal is working again. Data scrolls: system diagnostics, alert logs, partially corrupted ship map.',
    },
  },
  readableContent: {
    fr: '[ JOURNAL SYSTÈME — ENTRÉE AUTOMATIQUE ]\nJ+0h : Coupure réacteur principal. Bascule sur auxiliaire.\nJ+2h : Brèche secteur 4. Équipe d\'endiguement dépêchée.\nJ+3h : Contact perdu avec équipe d\'endiguement.\nJ+4h : ALERTE CONFINEMENT NIVEAU 5 — toutes sections.\nJ+6h : Support vie — basculement mode dégradé.\nJ+168h (7j) : Dernière activité de l\'équipage détectée.\n[ FIN DES ENTRÉES ]',
    en: '[ SYSTEM LOG — AUTO ENTRY ]\nT+0h: Main reactor failure. Switched to auxiliary.\nT+2h: Breach in sector 4. Containment team dispatched.\nT+3h: Lost contact with containment team.\nT+4h: CONTAINMENT ALERT LEVEL 5 — all sections.\nT+6h: Life support — degraded mode.\nT+168h (7d): Last crew activity detected.\n[ END OF ENTRIES ]',
  },
  interactions: [
    // READ — auto-success, display content
    {
      trigger: { verb: ['READ', 'EXAMINE', 'HACK', 'SCAN'], dc: null },
      onSuccess: {
        narrative: {
          fr: 'L\'écran stabilise son affichage. Vous parcourez les entrées du journal système. L\'histoire se dessine — coupure réacteur, brèche, équipe perdue, confinement. Le dernier signe de vie de l\'équipage remonte à plus de six mois.',
          en: 'The screen stabilizes. You read through the system log entries. The story unfolds — reactor failure, breach, lost team, containment. The last crew activity was over six months ago.',
        },
        newState: 'active',
        flagSet: 'terminal_read',
      },
    },
    // REPAIR (INT DC 8) — terminal works better
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 8 },
      onSuccess: {
        narrative: {
          fr: 'Quelques connexions ressoudées. L\'écran cesse de clignoter et affiche un plan partiel du vaisseau. La baie des pods d\'évasion est marquée au pont inférieur.',
          en: 'A few reconnected wires. The screen stops flickering and shows a partial ship map. The escape pod deck is marked on the lower level.',
        },
        newState: 'active',
        flagSet: 'ship_map_found',
      },
      onFailure: {
        narrative: {
          fr: 'Un arc électrique vous force à retirer la main. L\'écran continue de clignoter — mais les bribes de données restent lisibles.',
          en: 'An electrical arc forces your hand back. The screen keeps flickering — but the data fragments remain readable.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
  ],
};

const emergency_locker: ScenarioFeatureDefinition = {
  id: 'emergency_locker',
  initialState: 'locked',
  featureType: 'container',
  extraProperties: ['metallic', 'lockable'],
  aliases: {
    fr: ['casier', 'casier d\'urgence', 'casier de secours', 'locker', 'placard', 'armoire', 'casier urgence', 'coffre'],
    en: ['locker', 'emergency locker', 'cabinet', 'storage', 'emergency cabinet'],
  },
  contains: ['access_keycard', 'oxygen_canister'],
  descriptions: {
    locked: {
      fr: 'Casier d\'urgence standard. Le verrou magnétique est actif — un voyant rouge clignotant le confirme. La serrure semble fragilisée par les vibrations du vaisseau. Un outil adapté, de la force brute, ou un peu d\'ingéniosité pourrait en venir à bout.',
      en: 'Standard emergency locker. The magnetic lock is active — a blinking red light confirms it. The lock seems weakened by the ship\'s vibrations. The right tool, brute force, or some ingenuity could break it open.',
    },
    open: {
      fr: 'Le casier d\'urgence est ouvert. L\'intérieur est visible — éclairé par la faible lueur de l\'éclairage de secours.',
      en: 'The emergency locker is open. The interior is visible — lit by the faint glow of emergency lighting.',
    },
    empty: {
      fr: 'Le casier d\'urgence, grand ouvert. Il est vide maintenant.',
      en: 'The emergency locker, wide open. It\'s empty now.',
    },
  },
  interactions: [
    // FORCE_OPEN / BREAK / OPEN / KICK (FOR DC 10)
    {
      trigger: {
        verb: ['FORCE_OPEN', 'BREAK', 'OPEN', 'KICK'],
        requiredState: 'locked',
        stat: 'FOR',
        dc: 10,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le métal cède dans un crissement. Le verrou magnétique saute — le casier s\'ouvre. À l\'intérieur : un badge d\'accès et une bonbonne d\'oxygène de secours.',
          en: 'The metal gives way with a screech. The magnetic lock breaks — the locker opens. Inside: an access keycard and an emergency oxygen canister.',
        },
        revealsItems: ['access_keycard', 'oxygen_canister'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
      onFailure: {
        narrative: {
          fr: 'La serrure résiste. Vos mains glissent sur le métal froid. Le verrou magnétique tient bon — mais vous sentez du jeu. Un autre essai, peut-être.',
          en: 'The lock holds. Your hands slip on cold metal. The magnetic lock holds — but you feel some give. Another try, maybe.',
        },
      },
    },
    // HACK / UNLOCK (INT DC 8)
    {
      trigger: {
        verb: ['HACK', 'UNLOCK'],
        requiredState: 'locked',
        stat: 'INT',
        dc: 8,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Vous faites sauter le circuit du verrou magnétique en court-circuitant les bornes. Clic. Le casier s\'ouvre en douceur. Un badge d\'accès et une bonbonne d\'oxygène reposent à l\'intérieur.',
          en: 'You short-circuit the magnetic lock terminals. Click. The locker opens smoothly. An access keycard and an oxygen canister sit inside.',
        },
        revealsItems: ['access_keycard', 'oxygen_canister'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
      onFailure: {
        narrative: {
          fr: 'Un arc électrique vous mord les doigts. Le circuit a résisté — mais le boîtier du verrou fume légèrement.',
          en: 'An electric arc bites your fingers. The circuit held — but the lock housing is slightly smoking.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
    // USE standard_toolkit (auto-success)
    {
      trigger: {
        verb: 'USE',
        requiredState: 'locked',
        requiredItem: 'standard_toolkit',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'La trousse à outils fait le travail. Trois vis, un levier improvisé, et le verrou cède sans résistance. Le casier contient un badge d\'accès et une bonbonne d\'oxygène.',
          en: 'The toolkit does the job. Three screws, an improvised lever, and the lock gives way. The locker holds an access keycard and an oxygen canister.',
        },
        revealsItems: ['access_keycard', 'oxygen_canister'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
    },
    // USE knife (auto-success)
    {
      trigger: {
        verb: 'USE',
        requiredState: 'locked',
        requiredItem: 'knife',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'La lame du couteau s\'insère dans la fente du verrou. Un mouvement sec — le mécanisme cède. Le casier s\'ouvre.',
          en: 'The knife blade slides into the lock slot. A sharp twist — the mechanism gives. The locker opens.',
        },
        revealsItems: ['access_keycard', 'oxygen_canister'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
    },
  ],
};

// --- UNLOCK node features ---

const security_panel: ScenarioFeatureDefinition = {
  id: 'security_panel',
  initialState: 'active',
  featureType: 'panel',
  extraProperties: ['electronic', 'secured', 'powered'],
  aliases: {
    fr: ['panneau', 'panneau de securite', 'lecteur', 'lecteur de badge', 'digicode', 'panneau securite', 'terminal de securite'],
    en: ['panel', 'security panel', 'badge reader', 'keypad', 'security terminal'],
  },
  descriptions: {
    active: {
      fr: 'Le panneau de sécurité affiche un lecteur de badge et un digicode. Le système accepte les badges de niveau 3 ou supérieur. Des griffures profondes marquent le métal autour — quelque chose a essayé de l\'arracher.',
      en: 'The security panel shows a badge reader and keypad. The system accepts level 3+ badges. Deep scratches mark the surrounding metal — something tried to tear it off.',
    },
    deactivated: {
      fr: 'Le panneau de sécurité est éteint. Le lecteur de badge ne répond plus. Mais les verrous de la cloison se sont rétractés.',
      en: 'The security panel is dark. The badge reader is dead. But the bulkhead locks have retracted.',
    },
  },
  interactions: [
    // HACK (INT DC 12)
    {
      trigger: {
        verb: ['HACK', 'REPROGRAM'],
        requiredState: 'active',
        stat: 'INT',
        dc: 12,
      },
      onSuccess: {
        newState: 'deactivated',
        narrative: {
          fr: 'Vos doigts courent sur le digicode. Combinaison après combinaison — jusqu\'à trouver une faille dans le firmware. Le voyant passe au vert. Les verrous de la cloison claquent en s\'ouvrant.',
          en: 'Your fingers race across the keypad. Combination after combination — until you find a firmware exploit. The indicator turns green. The bulkhead locks slam open.',
        },
        flagSet: 'bulkhead_unlocked',
      },
      onFailure: {
        narrative: {
          fr: 'Le système détecte vos tentatives et verrouille temporairement le digicode. Trente secondes de lockout. Vous entendez quelque chose bouger dans les conduits au-dessus.',
          en: 'The system detects your attempts and temporarily locks the keypad. Thirty-second lockout. You hear something moving in the ducts above.',
        },
        consequences: [{ type: 'condition_add', conditionId: 'terrified' }],
      },
    },
    // BREAK / FORCE_OPEN / KICK (FOR DC 14) — destroy the panel
    {
      trigger: {
        verb: ['BREAK', 'FORCE_OPEN', 'KICK'],
        requiredState: 'active',
        stat: 'FOR',
        dc: 14,
      },
      onSuccess: {
        newState: 'deactivated',
        narrative: {
          fr: 'Vous arrachez la plaque frontale du panneau. Les fils exposés — un court-circuit volontaire. Étincelles. Le verrou magnétique perd son alimentation. La cloison se déverrouille par défaut.',
          en: 'You rip off the panel\'s face plate. Exposed wires — a deliberate short circuit. Sparks. The magnetic lock loses power. The bulkhead defaults to unlocked.',
        },
        flagSet: 'bulkhead_unlocked',
        consequences: [{ type: 'damage', targetId: 'player', amount: 2 }],
      },
      onFailure: {
        narrative: {
          fr: 'Le panneau résiste — le métal est plus solide qu\'il n\'y paraît. Vos poings n\'ont fait que des bosses superficielles.',
          en: 'The panel holds — the metal is tougher than it looks. Your fists only left surface dents.',
        },
      },
    },
  ],
};

const bulkhead_door: ScenarioFeatureDefinition = {
  id: 'bulkhead_door',
  initialState: 'locked',
  featureType: 'door',
  extraProperties: ['heavy', 'sealed'],
  aliases: {
    fr: ['cloison', 'porte blindee', 'cloison blindee', 'porte', 'bulkhead', 'porte de securite', 'sas'],
    en: ['bulkhead', 'door', 'bulkhead door', 'blast door', 'security door'],
  },
  descriptions: {
    locked: {
      fr: 'Porte blindée de 15 centimètres d\'épaisseur. Verrouillage magnétique actif. Aucune force brute ne l\'ouvrira directement — le panneau de sécurité contrôle les verrous. Le conduit de ventilation à côté pourrait offrir un passage alternatif.',
      en: 'Fifteen-centimeter thick armored door. Magnetic lock active. No brute force will open it directly — the security panel controls the locks. The vent duct nearby might offer an alternate passage.',
    },
    open: {
      fr: 'La porte blindée est ouverte. Les verrous magnétiques sont rétractés dans le cadre. Au-delà, le couloir mène vers les quartiers de l\'équipage.',
      en: 'The bulkhead is open. Magnetic locks retracted into the frame. Beyond, the corridor leads to crew quarters.',
    },
  },
  interactions: [
    // OPEN (auto-success if flag set)
    {
      trigger: {
        verb: ['OPEN', 'PUSH', 'MOVE_TO'],
        requiredState: 'locked',
        requiredFlag: 'bulkhead_unlocked',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Les verrous ont été désactivés. La porte blindée coulisse lourdement sur ses rails, révélant le couloir au-delà.',
          en: 'The locks have been deactivated. The bulkhead slides heavily along its rails, revealing the corridor beyond.',
        },
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
      },
    },
    // FORCE_OPEN without flag → near-impossible (FOR DC 20)
    {
      trigger: {
        verb: ['FORCE_OPEN', 'BREAK', 'KICK', 'PUSH', 'OPEN'],
        requiredState: 'locked',
        stat: 'FOR',
        dc: 20,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Par un effort surhumain, vous parvenez à tordre suffisamment le cadre pour vous faufiler. Le métal grince et proteste — votre corps aussi.',
          en: 'Through superhuman effort, you manage to bend the frame enough to squeeze through. The metal groans and protests — so does your body.',
        },
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
        consequences: [{ type: 'damage', targetId: 'player', amount: 3 }],
      },
      onFailure: {
        narrative: {
          fr: '15 centimètres d\'acier blindé. Vous n\'avez aucune chance à mains nues — il faut désactiver les verrous depuis le panneau, ou trouver un autre passage.',
          en: '15 centimeters of armored steel. No chance bare-handed — deactivate the locks from the panel, or find another way.',
        },
      },
    },
  ],
};

const vent_cover: ScenarioFeatureDefinition = {
  id: 'vent_cover',
  initialState: 'intact',
  featureType: 'vent',
  extraProperties: ['metallic', 'breakable'],
  aliases: {
    fr: ['grille', 'grille de ventilation', 'ventilation', 'conduit', 'bouche d\'aeration', 'grille aeration', 'vent'],
    en: ['vent', 'vent cover', 'grate', 'ventilation', 'duct', 'air duct', 'vent grate'],
  },
  descriptions: {
    intact: {
      fr: 'Grille de ventilation standard. Les vis sont rouillées mais le passage derrière semble assez large pour s\'y glisser. Un courant d\'air froid en sort — il mène quelque part de l\'autre côté de la cloison.',
      en: 'Standard ventilation grate. Rusted screws, but the passage behind seems wide enough to squeeze through. Cold air flows from it — leads somewhere past the bulkhead.',
    },
    open: {
      fr: 'La grille de ventilation a été retirée. Le conduit sombre s\'ouvre béant — assez large pour ramper, pas pour se tenir debout.',
      en: 'The vent cover has been removed. The dark duct gapes open — wide enough to crawl, not to stand.',
    },
  },
  interactions: [
    // OPEN (AGI DC 8) — unscrew
    {
      trigger: {
        verb: 'OPEN',
        requiredState: 'intact',
        stat: 'AGI',
        dc: 8,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Les vis rouillées cèdent une à une. La grille tombe avec un clang métallique. Le conduit de ventilation s\'ouvre devant vous — étroit, sombre, mais praticable.',
          en: 'The rusted screws give way one by one. The grate clangs to the floor. The ventilation duct opens before you — narrow, dark, but passable.',
        },
        removeProperties: ['sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
      },
      onFailure: {
        narrative: {
          fr: 'Les vis sont trop rouillées — vos doigts glissent. La dernière vis refuse de bouger.',
          en: 'The screws are too rusted — your fingers slip. The last screw won\'t budge.',
        },
      },
    },
    // BREAK / KICK / FORCE_OPEN (FOR DC 10)
    {
      trigger: {
        verb: ['BREAK', 'KICK', 'FORCE_OPEN'],
        requiredState: 'intact',
        stat: 'FOR',
        dc: 10,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Un coup de pied bien placé. La grille se tord et se détache du mur. Bruyant — mais efficace. Le conduit est ouvert.',
          en: 'A well-placed kick. The grate bends and detaches from the wall. Noisy — but effective. The duct is open.',
        },
        removeProperties: ['sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
      },
      onFailure: {
        narrative: {
          fr: 'La grille vibre sous le coup mais tient. Vos orteils, eux, protestent.',
          en: 'The grate vibrates from the impact but holds. Your toes, however, protest.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
    // CLIMB (AGI DC 10, if already open) — traverse the duct
    {
      trigger: {
        verb: 'CLIMB',
        requiredState: 'open',
        stat: 'AGI',
        dc: 10,
      },
      onSuccess: {
        narrative: {
          fr: 'Vous rampez dans le conduit de ventilation. Sombre. Étroit. Les parois métalliques résonnent sous vos mouvements. Après une dizaine de mètres, vous émergez de l\'autre côté de la cloison.',
          en: 'You crawl through the vent duct. Dark. Tight. Metal walls echo your movements. After ten meters, you emerge on the other side of the bulkhead.',
        },
      },
      onFailure: {
        narrative: {
          fr: 'Le conduit se rétrécit. Vous restez coincé un instant — la panique monte — avant de parvenir à reculer.',
          en: 'The duct narrows. You get stuck for a moment — panic rises — before managing to back out.',
        },
        consequences: [{ type: 'condition_add', conditionId: 'terrified' }],
      },
    },
    // USE standard_toolkit (auto-success)
    {
      trigger: {
        verb: 'USE',
        requiredState: 'intact',
        requiredItem: 'standard_toolkit',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le tournevis de la trousse fait sauter les vis rouillées sans effort. La grille se détache proprement.',
          en: 'The toolkit\'s screwdriver pops the rusted screws effortlessly. The grate comes off cleanly.',
        },
        removeProperties: ['sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
      },
    },
  ],
};

// --- REVEAL node features ---

const captain_terminal: ScenarioFeatureDefinition = {
  id: 'captain_terminal',
  initialState: 'active',
  featureType: 'terminal',
  extraProperties: ['secured', 'data_storage'],
  aliases: {
    fr: ['terminal', 'terminal du capitaine', 'ordinateur', 'console', 'ecran', 'poste du capitaine'],
    en: ['terminal', 'captain terminal', 'computer', 'console', 'captain computer', 'workstation'],
  },
  descriptions: {
    active: {
      fr: 'Le terminal du capitaine. L\'écran affiche le logo "PROJET ORACLE" en rouge — fichiers classifiés, rapports d\'incidents, journal personnel. Quelqu\'un a essayé d\'effacer les données, mais le processus a été interrompu.',
      en: 'The captain\'s terminal. The screen shows the "PROJECT ORACLE" logo in red — classified files, incident reports, personal log. Someone tried to erase the data, but the process was interrupted.',
    },
    searched: {
      fr: 'Le terminal du capitaine, fouillé. Tous les fichiers accessibles ont été lus. Un tiroir sous la console est entrouvert.',
      en: 'The captain\'s terminal, searched. All accessible files have been read. A drawer under the console is ajar.',
    },
  },
  readableContent: {
    fr: '[ PROJET ORACLE — DOSSIER CAPITAINE REEVES ]\n\nLe spécimen Alpha a été récupéré sur le site de fouilles d\'Éridani-IV.\nOrganisme unique — capacités de régénération cellulaire sans précédent.\nLe consortium veut un prototype d\'arme biologique avant la fin du trimestre.\n\nJ\'ai exprimé mes réserves. On m\'a dit de me taire.\n\n[ DERNIER RAPPORT ]\nLe spécimen s\'est libéré. Trois équipes de confinement éliminées en 6 heures.\nJ\'ai scellé les sections 4 à 7. Ça ne suffira pas.\nSi quelqu\'un lit ceci : fuyez. Ne tentez pas de la combattre. Fuyez.',
    en: '[ PROJECT ORACLE — CAPTAIN REEVES FILE ]\n\nSpecimen Alpha was recovered from the Eridani-IV dig site.\nUnique organism — unprecedented cellular regeneration.\nThe consortium wants a bioweapon prototype by end of quarter.\n\nI raised concerns. Was told to shut up.\n\n[ FINAL REPORT ]\nThe specimen broke free. Three containment teams eliminated in 6 hours.\nI sealed sections 4 through 7. It won\'t be enough.\nIf anyone reads this: run. Don\'t try to fight it. Run.',
  },
  interactions: [
    // READ (auto-success) — read ORACLE files
    {
      trigger: { verb: ['READ', 'EXAMINE', 'SCAN'], dc: null },
      onSuccess: {
        narrative: {
          fr: 'Vous parcourez les fichiers du Projet ORACLE. L\'histoire se dévoile — un organisme extraterrestre transformé en arme biologique. Le capitaine Reeves savait. L\'équipage entier a été sacrifié pour un prototype militaire.',
          en: 'You read through the Project ORACLE files. The story unfolds — an alien organism weaponized. Captain Reeves knew. The entire crew was sacrificed for a military prototype.',
        },
        flagSet: 'oracle_revealed',
      },
    },
    // HACK / SEARCH (INT DC 10) — find hidden EVA key
    {
      trigger: {
        verb: ['HACK', 'EXAMINE'],
        requiredState: 'active',
        stat: 'INT',
        dc: 10,
      },
      onSuccess: {
        newState: 'searched',
        narrative: {
          fr: 'En fouillant les fichiers système, vous tombez sur un dossier personnel verrouillé. À l\'intérieur — des photos de famille du capitaine, et dans un tiroir déverrouillé par l\'accès : une petite clé magnétique étiquetée "Casier EVA — Pont 3".',
          en: 'Digging through system files, you find a locked personal folder. Inside — the captain\'s family photos, and in a drawer unlocked by the access: a small magnetic key labeled "EVA Locker — Deck 3".',
        },
        revealsItems: ['EVA_suit_locker_key'],
        flagSet: 'oracle_revealed',
      },
      onFailure: {
        narrative: {
          fr: 'Le système de sécurité résiste à vos tentatives. Vous pouvez lire les rapports ORACLE, mais les fichiers personnels du capitaine restent verrouillés.',
          en: 'The security system resists. You can read the ORACLE reports, but the captain\'s personal files remain locked.',
        },
        flagSet: 'oracle_revealed',
      },
    },
  ],
};

const viewport: ScenarioFeatureDefinition = {
  id: 'viewport',
  initialState: 'intact',
  featureType: 'window',
  extraProperties: ['large', 'rigid'],
  aliases: {
    fr: ['hublot', 'fenetre', 'vitre', 'viewport', 'baie vitree'],
    en: ['viewport', 'window', 'porthole', 'observation window'],
  },
  descriptions: {
    intact: {
      fr: 'Le hublot d\'observation donne sur l\'extérieur. Le vaisseau dérive — des sections entières sont arrachées, exposant des ponts au vide. Des débris flottent dans le silence de l\'espace. Le vaisseau est mourant.',
      en: 'The observation viewport looks outside. The ship drifts — entire sections torn away, decks exposed to vacuum. Debris floats in the silence of space. The ship is dying.',
    },
  },
  decorative: true,
};

// --- ESCALATION node features ---

const EVA_suit_locker: ScenarioFeatureDefinition = {
  id: 'EVA_suit_locker',
  initialState: 'locked',
  featureType: 'container',
  extraProperties: ['metallic', 'lockable', 'large'],
  aliases: {
    fr: ['casier eva', 'casier de combinaison', 'casier spatial', 'armoire eva', 'casier', 'combinaison'],
    en: ['eva locker', 'suit locker', 'space suit locker', 'eva cabinet', 'locker'],
  },
  contains: ['eva_suit'],
  descriptions: {
    locked: {
      fr: 'Casier de combinaison EVA — verrouillé. La serrure accepte une clé magnétique spécifique. À travers la vitre, vous apercevez une combinaison spatiale intacte.',
      en: 'EVA suit locker — locked. The lock takes a specific magnetic key. Through the glass, you can see an intact space suit.',
    },
    open: {
      fr: 'Le casier EVA est ouvert. La combinaison spatiale est accessible.',
      en: 'The EVA locker is open. The space suit is accessible.',
    },
    empty: {
      fr: 'Le casier EVA, vide. La combinaison a été prise.',
      en: 'The EVA locker, empty. The suit has been taken.',
    },
  },
  interactions: [
    // FORCE_OPEN / BREAK (FOR DC 12)
    {
      trigger: {
        verb: ['FORCE_OPEN', 'BREAK'],
        requiredState: 'locked',
        stat: 'FOR',
        dc: 12,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'La vitre du casier explose sous le choc. Vous dégagez les éclats — la combinaison EVA est intacte à l\'intérieur.',
          en: 'The locker glass shatters. You clear the shards — the EVA suit inside is intact.',
        },
        revealsItems: ['eva_suit'],
        removeProperties: ['locked'],
        addProperties: ['open', 'broken'],
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
      onFailure: {
        narrative: {
          fr: 'La vitre se fissure mais tient. Le casier est solide.',
          en: 'The glass cracks but holds. The locker is sturdy.',
        },
      },
    },
    // HACK / UNLOCK (INT DC 11)
    {
      trigger: {
        verb: ['HACK', 'UNLOCK'],
        requiredState: 'locked',
        stat: 'INT',
        dc: 11,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le verrou électronique cède à votre manipulation. Le casier s\'ouvre — la combinaison EVA vous attend.',
          en: 'The electronic lock yields. The locker opens — the EVA suit awaits.',
        },
        revealsItems: ['eva_suit'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
      onFailure: {
        narrative: {
          fr: 'Le système de verrouillage résiste. Il faudra la clé ou plus de force.',
          en: 'The lock system resists. You\'ll need the key or more force.',
        },
      },
    },
  ],
};

const life_support_panel: ScenarioFeatureDefinition = {
  id: 'life_support_panel',
  initialState: 'damaged',
  featureType: 'panel',
  extraProperties: ['electronic', 'broken', 'powered'],
  aliases: {
    fr: ['panneau', 'panneau support vie', 'support vie', 'systeme o2', 'panneau o2', 'controle oxygene'],
    en: ['panel', 'life support', 'life support panel', 'o2 system', 'oxygen control'],
  },
  descriptions: {
    damaged: {
      fr: 'Le panneau de contrôle du support vie est endommagé — des griffures profondes ont arraché des câbles. L\'écran clignote : "O₂ SYSTÈME — DÉFAILLANCE CRITIQUE". La réparation semble possible mais complexe.',
      en: 'The life support control panel is damaged — deep scratches tore out cables. The screen flickers: "O₂ SYSTEM — CRITICAL FAILURE". Repair seems possible but complex.',
    },
    repaired: {
      fr: 'Le panneau de support vie a été réparé. L\'écran affiche "O₂ — STABILISÉ". Le système fonctionne en mode dégradé mais tient.',
      en: 'The life support panel has been repaired. The screen shows "O₂ — STABILIZED". The system runs in degraded mode but holds.',
    },
  },
  interactions: [
    // REPAIR (INT DC 14)
    {
      trigger: {
        verb: 'REPAIR',
        requiredState: 'damaged',
        stat: 'INT',
        dc: 14,
      },
      onSuccess: {
        newState: 'repaired',
        narrative: {
          fr: 'Câble par câble, vous reconnectez le système. Le ventilateur redémarre — l\'air frais afflue. L\'écran affiche "O₂ STABILISÉ". Vous avez gagné du temps.',
          en: 'Cable by cable, you reconnect the system. The fan restarts — fresh air flows. Screen reads "O₂ STABILIZED". You\'ve bought time.',
        },
        flagSet: 'o2_stabilized',
        removeProperties: ['broken'],
      },
      onFailure: {
        narrative: {
          fr: 'Un câble mal rebranché — étincelles. Le système crashe et redémarre. Toujours en défaillance. Vous toussez dans l\'air qui s\'appauvrit.',
          en: 'A misconnected cable — sparks. The system crashes and restarts. Still failing. You cough in the thinning air.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
  ],
};

const o2_reroute_valve: ScenarioFeatureDefinition = {
  id: 'o2_reroute_valve',
  initialState: 'closed',
  featureType: 'mechanical',
  extraProperties: ['metallic'],
  removeProperties: ['electronic'],
  aliases: {
    fr: ['valve', 'valve o2', 'vanne', 'valve oxygene', 'reroutage', 'valve de reroutage'],
    en: ['valve', 'o2 valve', 'reroute valve', 'oxygen valve'],
  },
  descriptions: {
    closed: {
      fr: 'Valve de reroutage d\'O₂ — fermée. En la tournant, vous pourriez sceller les sections non-essentielles et concentrer l\'oxygène restant dans les zones habitées.',
      en: 'O₂ reroute valve — closed. Turning it could seal non-essential sections and concentrate remaining oxygen in inhabited zones.',
    },
    open: {
      fr: 'La valve est ouverte. L\'oxygène est rerouté vers les sections essentielles. Des bruits de portes hermétiques qui se ferment résonnent dans les couloirs lointains.',
      en: 'The valve is open. Oxygen rerouted to essential sections. Sounds of hermetic doors sealing echo from distant corridors.',
    },
  },
  interactions: [
    // OPEN / USE / ACTIVATE (FOR DC 12) — seal sections, buy O2 time
    {
      trigger: {
        verb: ['OPEN', 'USE', 'ACTIVATE'],
        requiredState: 'closed',
        stat: 'FOR',
        dc: 12,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'La valve résiste puis cède. Un grondement sourd parcourt le vaisseau — les portes hermétiques se ferment dans les sections non-essentielles. L\'air ici semble un peu plus respirable.',
          en: 'The valve resists then gives. A low rumble through the ship — hermetic doors seal in non-essential sections. The air here feels slightly more breathable.',
        },
        flagSet: 'sections_sealed',
      },
      onFailure: {
        narrative: {
          fr: 'La valve est grippée par la corrosion. Vous n\'arrivez pas à la tourner — vos mains glissent sur le métal humide.',
          en: 'The valve is seized by corrosion. You can\'t turn it — hands slip on wet metal.',
        },
      },
    },
  ],
};

const power_conduit: ScenarioFeatureDefinition = {
  id: 'power_conduit',
  initialState: 'damaged',
  featureType: 'pipe',
  extraProperties: ['conductive', 'broken', 'large'],
  aliases: {
    fr: ['conduit', 'conduit d\'energie', 'tuyau', 'canalisation', 'cable', 'conduit electrique'],
    en: ['conduit', 'power conduit', 'pipe', 'cable', 'power line'],
  },
  contains: ['makeshift_weapon'],
  descriptions: {
    damaged: {
      fr: 'Conduit d\'énergie principal — éventré. Des câbles pendent et des étincelles jaillissent par intermittence. Une barre métallique semble récupérable dans les décombres.',
      en: 'Main power conduit — ripped open. Cables dangle and sparks fly intermittently. A metal bar looks salvageable from the debris.',
    },
    broken: {
      fr: 'Le conduit est complètement détruit. Les câbles sont morts — plus d\'étincelles. La barre métallique a été arrachée.',
      en: 'The conduit is completely destroyed. Cables are dead — no more sparks. The metal bar has been pulled out.',
    },
  },
  interactions: [
    // BREAK / TAKE / PULL (FOR DC 8) — retrieve the bar
    {
      trigger: {
        verb: ['BREAK', 'TAKE', 'PULL'],
        requiredState: 'damaged',
        stat: 'FOR',
        dc: 8,
      },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: 'Vous arrachez une barre métallique solide des décombres du conduit. Lourde, rigide — ça fera une arme improvisée acceptable.',
          en: 'You wrench a solid metal bar from the conduit debris. Heavy, rigid — it\'ll make a decent improvised weapon.',
        },
        revealsItems: ['makeshift_weapon'],
      },
      onFailure: {
        narrative: {
          fr: 'Une étincelle vous brûle la main au moment où vous agrippez la barre. Vous lâchez prise.',
          en: 'A spark burns your hand as you grip the bar. You let go.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
  ],
};

// --- BOSS node features ---

const escape_pod_hatch: ScenarioFeatureDefinition = {
  id: 'escape_pod_hatch',
  initialState: 'locked',
  featureType: 'door',
  extraProperties: ['electronic', 'sealed', 'heavy'],
  aliases: {
    fr: ['ecoutille', 'ecoutille pod', 'porte du pod', 'pod', 'pod d\'evasion', 'capsule de sauvetage', 'sas pod'],
    en: ['hatch', 'pod hatch', 'escape pod', 'pod door', 'escape hatch'],
  },
  descriptions: {
    locked: {
      fr: 'L\'écoutille du pod d\'évasion. Un lecteur de badge contrôle l\'accès — niveau 3 requis. Au-delà : la capsule de sauvetage. La sortie.',
      en: 'The escape pod hatch. A badge reader controls access — level 3 required. Beyond: the lifeboat. The way out.',
    },
    open: {
      fr: 'L\'écoutille est ouverte. L\'intérieur exigu du pod d\'évasion est visible — un siège, des commandes minimales, un hublot. La liberté.',
      en: 'The hatch is open. The cramped pod interior is visible — a seat, minimal controls, a porthole. Freedom.',
    },
  },
  interactions: [
    // HACK (INT DC 14)
    {
      trigger: {
        verb: ['HACK', 'UNLOCK', 'REPROGRAM'],
        requiredState: 'locked',
        stat: 'INT',
        dc: 14,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le firmware du lecteur cède sous vos doigts experts. L\'écoutille déverrouille — les joints pneumatiques sifflent. Le pod d\'évasion vous attend.',
          en: 'The reader firmware yields to your expert fingers. The hatch unlocks — pneumatic seals hiss. The escape pod awaits.',
        },
        flagSet: 'pod_hatch_open',
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'resolution',
      },
      onFailure: {
        narrative: {
          fr: 'Le système de sécurité du pod est plus robuste que le reste du vaisseau. Vos tentatives échouent.',
          en: 'The pod\'s security system is more robust than the rest of the ship. Your attempts fail.',
        },
      },
    },
    // FORCE_OPEN (FOR DC 16) — very difficult
    {
      trigger: {
        verb: ['FORCE_OPEN', 'BREAK', 'KICK'],
        requiredState: 'locked',
        stat: 'FOR',
        dc: 16,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Les joints cèdent sous un effort titanesque. L\'écoutille s\'ouvre dans un grincement de métal torturé. Le pod est accessible.',
          en: 'The seals give under titanic effort. The hatch opens with a screech of tortured metal. The pod is accessible.',
        },
        flagSet: 'pod_hatch_open',
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'resolution',
        consequences: [{ type: 'damage', targetId: 'player', amount: 2 }],
      },
      onFailure: {
        narrative: {
          fr: 'L\'écoutille ne bouge pas d\'un millimètre. Scellée hermétiquement — il faudra un badge ou pirater le lecteur.',
          en: 'The hatch doesn\'t budge. Hermetically sealed — you\'ll need a badge or hack the reader.',
        },
      },
    },
    // OPEN with flag (auto-success, already unlocked by keycard)
    {
      trigger: {
        verb: ['OPEN', 'MOVE_TO'],
        requiredState: 'locked',
        requiredFlag: 'pod_hatch_open',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le badge a déjà déverrouillé l\'écoutille. Vous poussez — elle s\'ouvre. Le pod d\'évasion est là.',
          en: 'The badge already unlocked the hatch. You push — it opens. The escape pod is there.',
        },
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'resolution',
      },
    },
  ],
};

const cargo_jettison_lever: ScenarioFeatureDefinition = {
  id: 'cargo_jettison_lever',
  initialState: 'intact',
  featureType: 'mechanical',
  extraProperties: ['metallic'],
  removeProperties: ['electronic'],
  aliases: {
    fr: ['levier', 'levier de largage', 'levier cargo', 'manette', 'ejecteur', 'largage'],
    en: ['lever', 'jettison lever', 'cargo lever', 'eject lever', 'jettison'],
  },
  descriptions: {
    intact: {
      fr: 'Levier de largage d\'urgence de la soute. Protégé par un cache de sécurité rouge. Si la créature est dans la soute quand vous tirez... la soute entière est éjectée dans le vide.',
      en: 'Emergency cargo jettison lever. Protected by a red safety cover. If the creature is in the cargo bay when you pull... the entire bay is ejected into the void.',
    },
    activated: {
      fr: 'Le levier est en position basse. Les portes de la soute se sont ouvertes sur le vide — tout ce qui n\'était pas arrimé a été aspiré.',
      en: 'The lever is in the down position. The cargo bay doors opened to the void — everything unsecured was sucked out.',
    },
  },
  interactions: [
    // PULL / ACTIVATE / USE / PUSH (FOR DC 10)
    {
      trigger: {
        verb: ['PULL', 'ACTIVATE', 'USE', 'PUSH'],
        requiredState: 'intact',
        stat: 'FOR',
        dc: 10,
      },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: 'Vous arrachez le cache de sécurité et tirez le levier de toutes vos forces. Un grondement assourdissant — les portes de la soute s\'ouvrent sur le vide. Tout est aspiré — y compris la créature. Ses hurlements se perdent dans le silence de l\'espace.',
          en: 'You rip off the safety cover and pull the lever with all your strength. A deafening rumble — the cargo bay doors open to the void. Everything is sucked out — including the creature. Its screams are lost in the silence of space.',
        },
        flagSet: 'cargo_jettisoned',
      },
      onFailure: {
        narrative: {
          fr: 'Le levier résiste — le mécanisme est grippé. Vous sentez qu\'il bouge, mais pas assez.',
          en: 'The lever resists — the mechanism is seized. You feel it move, but not enough.',
        },
      },
    },
  ],
};

const hull_breach_panel: ScenarioFeatureDefinition = {
  id: 'hull_breach_panel',
  initialState: 'intact',
  featureType: 'panel',
  extraProperties: ['electronic', 'breakable'],
  aliases: {
    fr: ['panneau', 'panneau de breche', 'panneau coque', 'controle decompression', 'systeme breche'],
    en: ['panel', 'breach panel', 'hull panel', 'decompression control', 'hull breach panel'],
  },
  descriptions: {
    intact: {
      fr: 'Panneau de contrôle des joints de coque. L\'écran affiche les zones pressurisées et dépressurisées du vaisseau. Un protocole d\'urgence permet de forcer une décompression localisée.',
      en: 'Hull seal control panel. The screen shows pressurized and depressurized ship zones. An emergency protocol allows forcing a localized decompression.',
    },
    activated: {
      fr: 'Le panneau affiche "DÉCOMPRESSION EN COURS — SOUTE". Les voyants clignotent en rouge. L\'air se raréfie dans la zone.',
      en: 'The panel shows "DECOMPRESSION IN PROGRESS — CARGO BAY". Indicators flash red. Air is thinning in the area.',
    },
  },
  interactions: [
    // HACK / ACTIVATE / USE / REPROGRAM (INT DC 15) — emergent victory
    {
      trigger: {
        verb: ['HACK', 'ACTIVATE', 'USE', 'REPROGRAM'],
        requiredState: 'intact',
        stat: 'INT',
        dc: 15,
      },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: 'Vous reprogrammez le protocole d\'urgence pour forcer une brèche localisée dans la soute. Le sifflement de l\'air aspiré emplit la pièce. Dans la soute, la créature lutte contre le vide — puis est arrachée. Silence.',
          en: 'You reprogram the emergency protocol to force a localized breach in the cargo bay. The hiss of escaping air fills the room. In the cargo bay, the creature fights the vacuum — then is torn away. Silence.',
        },
        flagSet: 'cargo_depressurized',
      },
      onFailure: {
        narrative: {
          fr: 'Le système de sécurité bloque votre tentative. Accès refusé — les protocoles anti-décompression sont robustes.',
          en: 'The security system blocks your attempt. Access denied — anti-decompression protocols are robust.',
        },
      },
    },
    // BREAK / FORCE_OPEN (FOR DC 13) — smash the panel to force breach
    {
      trigger: {
        verb: ['BREAK', 'FORCE_OPEN'],
        requiredState: 'intact',
        stat: 'FOR',
        dc: 13,
      },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: 'Vous fracassez le panneau. Les circuits exposés court-circuitent — et déclenchent le protocole de brèche. La soute se dépressurise violemment.',
          en: 'You smash the panel. Exposed circuits short — triggering the breach protocol. The cargo bay depressurizes violently.',
        },
        flagSet: 'cargo_depressurized',
        consequences: [{ type: 'damage', targetId: 'player', amount: 2 }],
      },
      onFailure: {
        narrative: {
          fr: 'Le panneau résiste à vos coups. Le boîtier est renforcé.',
          en: 'The panel withstands your blows. The casing is reinforced.',
        },
      },
    },
  ],
};

// --- RESOLUTION node features ---

const pod_viewport: ScenarioFeatureDefinition = {
  id: 'pod_viewport',
  initialState: 'intact',
  featureType: 'window',
  extraProperties: ['small'],
  aliases: {
    fr: ['hublot', 'hublot du pod', 'fenetre', 'vitre'],
    en: ['viewport', 'porthole', 'window', 'pod window'],
  },
  descriptions: {
    intact: {
      fr: 'Depuis le hublot du pod, vous regardez le vaisseau rapetisser dans l\'obscurité. Un point de lumière de moins en moins distinct, avalé par le noir de l\'espace. C\'est fini.',
      en: 'Through the pod\'s porthole, you watch the ship shrink into darkness. A point of light growing dimmer, swallowed by the black of space. It\'s over.',
    },
  },
  decorative: true,
};

// ============================= SKELETON =====================================

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
        emergency_flashlight,
        medkit_basic,
        access_keycard,
        oxygen_canister,
      ],
      features: [
        cryopod,
        status_terminal,
        emergency_locker,
      ],
      exits: ['unlock'],
    },
    unlock: {
      locationRole: 'control_room',
      items: [],
      features: [
        security_panel,
        bulkhead_door,
        vent_cover,
      ],
      exits: ['start', 'reveal'],
    },
    reveal: {
      locationRole: 'quarters',
      items: [
        captain_log_datapad,
        EVA_suit_locker_key,
      ],
      features: [
        captain_terminal,
        viewport,
      ],
      exits: ['unlock', 'escalation'],
    },
    escalation: {
      locationRole: 'engineering',
      atmosphere: 'low_oxygen',
      items: [
        eva_suit,
        makeshift_weapon,
      ],
      features: [
        EVA_suit_locker,
        life_support_panel,
        o2_reroute_valve,
        power_conduit,
      ],
      exits: ['reveal', 'boss'],
    },
    boss: {
      locationRole: 'airlock',
      atmosphere: 'depressurized',
      items: [],
      npcs: [
        {
          id: 'creature_oracle',
          disposition: 'hostile',
          talkSuccess: {
            fr: 'La créature émet un son guttural, presque... intelligent. Elle vous observe avec une curiosité terrifiante, comme si elle vous étudiait. Un instant de flottement — elle n\'attaque pas immédiatement.',
            en: '',
          },
          talkFailure: {
            fr: 'Votre voix ne fait que l\'agiter davantage. La créature siffle et ses griffes raclent le métal. Communiquer avec elle est impossible — elle n\'est que faim et instinct.',
            en: '',
          },
        },
      ],
      features: [
        escape_pod_hatch,
        cargo_jettison_lever,
        hull_breach_panel,
      ],
      exits: ['escalation', 'resolution'],
    },
    resolution: {
      locationRole: 'passage',
      items: [],
      features: [
        pod_viewport,
      ],
      exits: ['boss'],
    },
  },

  additionalDefeatConditions: [
    { type: 'time_expired', resource: 'o2' },
  ],
};
