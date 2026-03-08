// ---------------------------------------------------------------------------
// src/content/scenarios/escape.ts — ESCAPE skeleton: "Fuir l'Épave"
// ---------------------------------------------------------------------------
// Fantasy: Dead Space × Alien. Wake up, survive, get out.
// 6 core nodes, gate item: access_keycard, boss type: escape
// ---------------------------------------------------------------------------
// Chantier 2: Fully enriched nodeLocations with ScenarioFeatureDefinition
// and ScenarioItemDefinition — mechanical interactions, properties, aliases.
// ---------------------------------------------------------------------------

import type { CoreSkeleton, ScenarioFeatureDefinition, ScenarioItemDefinition, LocaleString } from '@engine/scenario';

function ls(fr: string): LocaleString { return { fr, en: '' }; }

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
  useOn: [{
    targetId: 'self',
    interaction: {
      trigger: { verb: 'USE', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Vous appliquez les bandages compressifs et l\'antiseptique sur vos blessures. La dose d\'analgésique atténue la douleur.',
          en: 'You apply the compression bandages and antiseptic to your wounds. The painkiller dose eases the pain.',
        },
        consequences: [{ type: 'heal', targetId: 'player', amount: 4 }],
        consumeItem: true,
      },
    },
  }],
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
      fr: 'Le terminal fonctionne — l\'écran affiche le plan du vaisseau et les rapports système. '
        + 'Le diagnostic montre 47 capsules cryogéniques : 46 en défaillance critique (alimentation coupée il y a 6 mois), '
        + '1 éjectée en urgence (la vôtre). Le support vie est en mode minimal. '
        + 'Le pont des pods d\'évasion est marqué au niveau inférieur — '
        + 'mais un point de contrôle de sécurité bloque l\'accès.',
      en: 'Terminal operational — ship layout and system reports on screen. '
        + '47 cryopods: 46 in critical failure, 1 emergency-ejected (yours). '
        + 'Escape pod deck marked on lower level — security checkpoint blocks access.',
    },
  },
  readableContent: {
    fr: '[ RAPPORT SYSTÈME — USS MERIDIAN ]\n\n'
      + 'CAPSULES CRYOGÉNIQUES : 46/47 en défaillance (coupure alimentation — 6 mois)\n'
      + 'CAPSULE #17 (VOTRE CAPSULE) : éjection d\'urgence il y a 4h03\n'
      + 'ÉQUIPAGE ACTIF : 0/47\n'
      + 'SUPPORT VIE : MODE MINIMAL (37% capacité)\n'
      + 'CONFINEMENT : NIVEAU 5 — ACTIF DEPUIS 6 MOIS\n'
      + 'PONT INFÉRIEUR : PODS D\'ÉVASION (accès via point de contrôle — badge niv. 3 requis)\n\n'
      + '[ DERNIÈRE ENTRÉE AUTOMATIQUE ]\n'
      + '2247-09-15 03:41 — Alerte biologique niveau 5. Protocole ORACLE activé.\n'
      + '2247-09-15 04:12 — Sections 4-7 scellées par le Capitaine Reeves.\n'
      + '2247-09-15 04:58 — Perte de contact avec toutes les équipes de confinement.\n'
      + '2247-09-15 05:30 — Support vie basculé en mode minimal automatique.\n'
      + '[ Plus aucune entrée depuis 6 mois ]',
    en: '[ SYSTEM REPORT — USS MERIDIAN ]\n\n'
      + 'CRYOPODS: 46/47 critical failure (power cut — 6 months)\n'
      + 'POD #17 (YOURS): emergency ejection 4h03 ago\n'
      + 'ACTIVE CREW: 0/47\n'
      + 'LIFE SUPPORT: MINIMAL MODE (37% capacity)\n'
      + 'CONTAINMENT: LEVEL 5 — ACTIVE 6 MONTHS\n'
      + 'LOWER DECK: ESCAPE PODS (access via checkpoint — level 3 badge required)\n\n'
      + '[ LAST AUTO ENTRY ]\n'
      + '2247-09-15 03:41 — Bio alert level 5. ORACLE protocol activated.\n'
      + '2247-09-15 04:12 — Sections 4-7 sealed by Captain Reeves.\n'
      + '2247-09-15 04:58 — Contact lost with all containment teams.\n'
      + '2247-09-15 05:30 — Life support switched to auto minimal mode.\n'
      + '[ No further entries for 6 months ]',
  },
  interactions: [
    // READ active state — richer report narrative
    {
      trigger: { verb: ['READ', 'EXAMINE', 'SCAN'], requiredState: 'active', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Le rapport système confirme le pire. 47 membres d\'équipage, aucun actif. '
            + 'La dernière activité humaine remonte à 6 mois — une cascade d\'alertes biologiques, '
            + 'des sections scellées, puis le silence. Le plan du vaisseau indique les pods d\'évasion '
            + 'au pont inférieur, derrière un point de contrôle de sécurité.',
          en: 'The system report confirms the worst. 47 crew, none active. Last human activity: 6 months ago — '
            + 'a cascade of biological alerts, sealed sections, then silence. '
            + 'The ship map shows escape pods on the lower deck, behind a security checkpoint.',
        },
        flagSet: 'terminal_read',
      },
    },
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
      fr: 'Le casier d\'urgence est ouvert. L\'éclairage de secours éclaire l\'intérieur : '
        + 'deux emplacements moulés — l\'un pour un badge d\'accès, l\'autre pour une bonbonne d\'oxygène. '
        + 'L\'étiquette "URGENCE — NE PAS RETIRER SAUF ÉVACUATION" est à moitié décollée.',
      en: 'Emergency locker open. Two molded slots inside — one for an access badge, one for an oxygen canister. '
        + 'The label "EMERGENCY — DO NOT REMOVE EXCEPT DURING EVACUATION" is half peeled off.',
    },
    empty: {
      fr: 'Le casier d\'urgence, grand ouvert et vide. Les emplacements moulés gardent la forme '
        + 'du badge et de la bonbonne qui s\'y trouvaient. Plus rien d\'utile ici.',
      en: 'Emergency locker, wide open and empty. The molded slots retain the shape of what was inside. Nothing useful here.',
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
      fr: 'Cloison blindée de sécurité. Épaisse d\'au moins 15 centimètres d\'acier renforcé. '
        + 'Les verrous magnétiques sont engagés — le voyant du panneau adjacent indique '
        + 'qu\'un badge de niveau 3 ou supérieur est requis. '
        + 'Des griffures profondes marquent le métal côté couloir. '
        + 'Quelque chose a essayé de passer. Quelque chose de gros.',
      en: 'Armored security bulkhead. 15cm of reinforced steel. Magnetic locks engaged — '
        + 'level 3+ badge required. Deep scratches on the corridor side. '
        + 'Something tried to get through. Something large.',
    },
    open: {
      fr: 'La cloison blindée est ouverte — les verrous magnétiques sont rétractés. '
        + 'Le couloir au-delà s\'enfonce dans l\'obscurité. L\'air qui en provient est '
        + 'plus froid, plus sec. Un silence pesant règne de l\'autre côté.',
      en: 'Bulkhead open — magnetic locks retracted. The corridor beyond stretches into darkness. '
        + 'Colder, drier air. Heavy silence on the other side.',
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
      fr: 'Grille de ventilation standard. Les vis sont oxydées — '
        + 'le conduit derrière semble assez large pour s\'y faufiler. '
        + 'Un courant d\'air froid en sort — il mène quelque part de l\'autre côté de la cloison. '
        + 'Une alternative au point de contrôle de sécurité, pour ceux qui n\'ont pas peur '
        + 'des espaces confinés.',
      en: 'Standard vent cover. Oxidized screws — the duct behind looks wide enough to crawl through. '
        + 'Cold air flows from it — leads past the bulkhead. '
        + 'An alternative to the security checkpoint, for those unafraid of tight spaces.',
    },
    open: {
      fr: 'La grille de ventilation est ouverte. Le conduit s\'enfonce dans l\'obscurité — '
        + 'étroit, poussiéreux, mais praticable. Des traces de griffures marquent les parois '
        + 'du conduit. Vous n\'êtes pas le premier à passer par là. '
        + 'Le passage mène de l\'autre côté de la cloison blindée.',
      en: 'Vent cover removed. The duct stretches into darkness — narrow, dusty, but passable. '
        + 'Scratch marks on the duct walls. You\'re not the first to come through here. '
        + 'The passage leads past the armored bulkhead.',
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
      fr: 'Le terminal personnel du Capitaine Reeves. L\'écran affiche plusieurs entrées de journal — '
        + 'datées des dernières 48 heures avant la catastrophe. Les entrées deviennent de plus en plus '
        + 'frénétiques. La dernière mentionne un "Projet ORACLE" et un dossier classifié. '
        + 'Le datapad du capitaine repose à côté, séparé du terminal.',
      en: 'Captain Reeves\' personal terminal. Multiple log entries from the last 48 hours before the disaster. '
        + 'The entries grow increasingly frantic. The last mentions a "Project ORACLE" and a classified file. '
        + 'The captain\'s datapad rests beside it, separate from the terminal.',
    },
    searched: {
      fr: 'Le terminal du Capitaine Reeves, fouillé. Les tiroirs ont été ouverts — '
        + 'une petite clé magnétique a été trouvée sous des papiers froissés. '
        + 'Les entrées de journal sont toujours lisibles à l\'écran. '
        + 'Le Projet ORACLE hante chaque ligne.',
      en: 'Captain Reeves\' terminal, searched. A small magnetic key found under crumpled papers. '
        + 'The journal entries are still readable on screen. Project ORACLE haunts every line.',
    },
  },
  readableContent: {
    fr: '[ TERMINAL PERSONNEL — CAPITAINE REEVES ]\n\n'
      + 'ENTRÉE 2247-09-14 : Projet ORACLE — Le spécimen Alpha a franchi le confinement de niveau 3. '
      + 'Les biologistes disent que c\'est "prévu dans le protocole d\'adaptation". '
      + 'Je n\'y crois plus. J\'ai ordonné le doublement des gardes.\n\n'
      + 'ENTRÉE 2247-09-15 01:00 : L\'équipe de nuit ne répond plus. Sections 4 et 5 silencieuses. '
      + 'Je vais sceller manuellement. Si ça ne suffit pas, les pods sont notre dernier recours.\n\n'
      + 'ENTRÉE 2247-09-15 03:30 : C\'est une arme. Le spécimen Alpha n\'est pas un "sujet d\'étude" — '
      + 'c\'est une arme biologique commandée par le Commandement. Dossier classifié ORACLE trouvé '
      + 'dans les fichiers du Dr. Nakamura. Nous étions des cobayes. Tous.\n\n'
      + 'ENTRÉE 2247-09-15 04:45 : [ENTRÉE FINALE — voir datapad]',
    en: '[ PERSONAL TERMINAL — CAPTAIN REEVES ]\n\n'
      + 'ENTRY 2247-09-14: Project ORACLE — Specimen Alpha breached level 3 containment. '
      + 'Biologists say it\'s "expected in the adaptation protocol". I don\'t believe them anymore. '
      + 'I ordered double guards.\n\n'
      + 'ENTRY 2247-09-15 01:00: Night team isn\'t responding. Sections 4 and 5 silent. '
      + 'Going to seal manually. If that\'s not enough, the pods are our last resort.\n\n'
      + 'ENTRY 2247-09-15 03:30: It\'s a weapon. Specimen Alpha is not a "study subject" — '
      + 'it\'s a bioweapon commissioned by Command. Classified ORACLE file found in Dr. Nakamura\'s files. '
      + 'We were test subjects. All of us.\n\n'
      + 'ENTRY 2247-09-15 04:45: [FINAL ENTRY — see datapad]',
  },
  interactions: [
    // READ searched state — re-read ORACLE journal after finding EVA key
    {
      trigger: { verb: ['READ', 'EXAMINE', 'SCAN'], requiredState: 'searched', dc: null },
      onSuccess: {
        narrative: {
          fr: 'Vous relisez les entrées du terminal. Reeves avait compris : '
            + 'le spécimen Alpha n\'était pas un sujet d\'étude mais une arme biologique '
            + 'commandée par le Commandement. Projet ORACLE. L\'équipage entier servait de terrain de test. '
            + 'La clé EVA que vous avez trouvée était son plan de secours.',
          en: 'You re-read the terminal entries. Reeves had figured it out: Project ORACLE was a weapons program. '
            + 'The entire crew was a test field. The EVA key you found was his backup plan.',
        },
        flagSet: 'oracle_revealed',
      },
    },
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
      fr: 'Le casier EVA est ouvert. La combinaison spatiale blanche repose sur son support, '
        + 'casque intégré et réserve d\'oxygène en place. L\'étiquette indique : '
        + '"Autonomie 30 min — Pression : 1 ATM — Température : -40°C à +120°C".',
      en: 'EVA locker open. White space suit on its mount, helmet and O₂ reserve in place. '
        + 'Label reads: "Autonomy 30 min — Pressure: 1 ATM — Temp: -40°C to +120°C".',
    },
    empty: {
      fr: 'Le casier EVA, vide. Le support de combinaison nu, les attaches ouvertes. '
        + 'Des fragments de vitre craquent sous vos pieds si vous avez forcé l\'ouverture.',
      en: 'EVA locker, empty. Bare suit mount, open clasps. Glass fragments crunch underfoot if you forced it open.',
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
      fr: 'Le panneau de support vie a été réparé. L\'écran affiche : '
        + '"O₂ — STABILISÉ — 43% CAPACITÉ". Le ventilateur tourne, l\'air circule. '
        + 'Ce n\'est pas idéal, mais la chute d\'oxygène est stoppée. '
        + 'Vous avez gagné un répit précieux.',
      en: 'Life support panel repaired. Screen shows "O₂ — STABILIZED — 43% CAPACITY". '
        + 'The drop has stopped. You\'ve bought precious time.',
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
    // HACK / BYPASS (INT DC 12) — partial fix
    {
      trigger: {
        verb: ['HACK', 'UNLOCK'],
        requiredState: 'damaged',
        stat: 'INT',
        dc: 12,
      },
      onSuccess: {
        newState: 'repaired',
        narrative: {
          fr: 'Vous ne pouvez pas réparer les câbles arrachés, mais vous pouvez contourner le circuit endommagé. '
            + 'Le système redémarre en mode dégradé — 30% de capacité au lieu de 43%. '
            + 'Mieux que rien. La chute d\'O₂ ralentit considérablement.',
          en: 'You can\'t fix the torn cables, but you can bypass the damaged circuit. '
            + 'The system restarts in degraded mode — 30% capacity instead of 43%. Better than nothing.',
        },
        flagSet: 'o2_stabilized',
        removeProperties: ['broken'],
      },
      onFailure: {
        narrative: {
          fr: 'Le circuit est trop endommagé pour un bypass propre. Des étincelles jaillissent. '
            + 'Il faudra une vraie réparation.',
          en: 'The circuit is too damaged for a clean bypass. Sparks fly. Real repairs needed.',
        },
      },
    },
    // FORCE_OPEN / REPAIR (FOR DC 13) — brute reconnection
    {
      trigger: {
        verb: ['FORCE_OPEN', 'REPAIR'],
        requiredState: 'damaged',
        stat: 'FOR',
        dc: 13,
      },
      onSuccess: {
        newState: 'repaired',
        narrative: {
          fr: 'Vous arrachez les câbles morts, dénudez les fils avec les dents, '
            + 'et reconnectez le circuit à mains nues. Un arc électrique vous mord les doigts — '
            + 'mais le ventilateur redémarre. L\'air afflue. Méthode brute, résultat efficace.',
          en: 'You rip dead cables, strip wires with your teeth, reconnect the circuit bare-handed. '
            + 'An electric arc bites your fingers — but the fan restarts. Air flows. Brutal method, effective result.',
        },
        flagSet: 'o2_stabilized',
        removeProperties: ['broken'],
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
      onFailure: {
        narrative: {
          fr: 'Les câbles résistent. Un choc électrique vous repousse — '
            + 'le circuit de support vie est plus complexe qu\'il n\'y paraît.',
          en: 'The cables resist. An electric shock pushes you back — '
            + 'the life support circuit is more complex than it looks.',
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
      fr: 'Le conduit est complètement détruit. Les câbles pendent, inertes — '
        + 'plus d\'étincelles, plus de courant. L\'espace où la barre métallique était coincée '
        + 'est vide. Le pont inférieur n\'a plus d\'alimentation de secours.',
      en: 'Conduit completely destroyed. Dead cables hang — no sparks, no current. '
        + 'The space where the metal bar was jammed is empty. The lower deck has no backup power.',
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
    // TALK (CHA DC 14) — distract the creature
    {
      trigger: {
        verb: 'TALK',
        requiredState: 'locked',
        stat: 'CHA',
        dc: 14,
      },
      onSuccess: {
        narrative: {
          fr: 'Vous parlez. Pas des mots — des sons. Graves, réguliers, comme un battement de cœur. '
            + 'La créature s\'immobilise. Ses yeux trop humains vous fixent avec une curiosité '
            + 'terrifiante. Un instant de flottement — puis elle recule d\'un pas. '
            + 'Juste assez pour que vous atteigniez l\'écoutille. '
            + 'Elle ne vous laisse pas partir — elle vous observe partir.',
          en: 'You speak. Not words — sounds. Low, rhythmic, like a heartbeat. '
            + 'The creature freezes. Its too-human eyes watch with terrifying curiosity. '
            + 'It steps back — just enough for you to reach the hatch.',
        },
        flagSet: 'creature_distracted',
      },
      onFailure: {
        narrative: {
          fr: 'La créature siffle et avance d\'un pas. Votre voix ne fait que l\'agiter. '
            + 'Communiquer avec une arme biologique programmée pour tuer — '
            + 'mauvaise idée, en fin de compte.',
          en: 'The creature hisses and advances. Your voice only agitates it. '
            + 'Communicating with a bioweapon built to kill — bad idea, in the end.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
    // OPEN with creature_distracted (INT DC 8 — reduced because creature isn't interfering)
    {
      trigger: {
        verb: ['OPEN', 'HACK', 'ACTIVATE'],
        requiredState: 'locked',
        requiredFlag: 'creature_distracted',
        stat: 'INT',
        dc: 8,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'La créature vous observe, immobile. Vos doigts tremblent sur le lecteur — '
            + 'mais cette fois, pas d\'interférence. Le firmware cède. L\'écoutille s\'ouvre. '
            + 'Vous ne regardez pas la créature en entrant dans le pod.',
          en: 'The creature watches, motionless. Your fingers tremble on the reader — '
            + 'but this time, no interference. The firmware yields. The hatch opens. '
            + 'You don\'t look at the creature as you enter the pod.',
        },
        flagSet: 'pod_hatch_open',
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'resolution',
      },
    },
    // EXAMINE (PER DC 12) — spot the maintenance bypass
    {
      trigger: {
        verb: 'EXAMINE',
        requiredState: 'locked',
        stat: 'PER',
        dc: 12,
      },
      onSuccess: {
        narrative: {
          fr: 'En examinant l\'écoutille de près, vous remarquez que le panneau de maintenance latéral '
            + 'n\'est pas soudé — juste clipsé. Derrière, les câbles du mécanisme de verrouillage '
            + 'sont accessibles. Un court-circuit bien placé suffirait.',
          en: 'The side maintenance panel isn\'t welded — just clipped. '
            + 'Behind it, the locking mechanism cables are accessible. A targeted short-circuit would do it.',
        },
        flagSet: 'hatch_bypass_found',
      },
    },
    // OPEN with hatch_bypass_found (INT DC 6 — very easy once the bypass is spotted)
    {
      trigger: {
        verb: ['OPEN', 'HACK', 'ACTIVATE'],
        requiredState: 'locked',
        requiredFlag: 'hatch_bypass_found',
        stat: 'INT',
        dc: 6,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le panneau de maintenance se déclipse. Deux fils, un court-circuit — '
            + 'l\'écoutille s\'ouvre en silence. Pas besoin de badge quand on sait regarder.',
          en: 'Maintenance panel unclips. Two wires, one short — the hatch opens silently. '
            + 'No badge needed when you know where to look.',
        },
        flagSet: 'pod_hatch_open',
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
    // HACK / UNLOCK (INT DC 12) — bypass the safety cover electronically
    {
      trigger: {
        verb: ['HACK', 'UNLOCK'],
        requiredState: 'intact',
        stat: 'INT',
        dc: 12,
      },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: 'Le levier est mécanique, mais le cache de sécurité est électronique. '
            + 'Vous court-circuitez le verrouillage du cache — il saute. '
            + 'Ensuite, le levier tombe presque tout seul. '
            + 'Les portes de la soute s\'ouvrent sur le vide. '
            + 'La créature hurle — puis le silence.',
          en: 'The lever is mechanical, but the safety cover is electronic. '
            + 'You bypass the cover lock. The lever falls almost by itself. '
            + 'Cargo bay doors open to the void. The creature screams — then silence.',
        },
        flagSet: 'cargo_jettisoned',
      },
      onFailure: {
        narrative: {
          fr: 'Le verrouillage du cache résiste à votre manipulation. '
            + 'Le mécanisme de sécurité est plus robuste que prévu.',
          en: 'The cover lock resists your attempt. The safety mechanism is more robust than expected.',
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
      fr: 'Le panneau affiche "DÉCOMPRESSION EN COURS — SOUTE" en rouge clignotant. '
        + 'À travers les hublots, vous voyez les portes de soute s\'ouvrir — '
        + 'l\'air, les débris, tout est aspiré dans le vide. '
        + 'Si la créature était dans la soute, elle n\'y est plus.',
      en: 'Panel flashes "DECOMPRESSION IN PROGRESS — CARGO BAY". Through the viewports, '
        + 'cargo bay doors open — air and debris sucked into the void. '
        + 'If the creature was in the bay, it\'s no longer there.',
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
          fr: 'Le protocole de brèche s\'active — les joints de coque de la soute se fissurent volontairement. '
            + 'Ce n\'est pas une éjection franche comme le levier — c\'est une hémorragie lente. '
            + 'L\'air s\'échappe, la pression chute. Vous sentez vos oreilles se boucher. '
            + 'La créature hurle — un son presque humain — avant d\'être aspirée centimètre par centimètre '
            + 'vers la brèche. Ça prend plus longtemps. C\'est pire.',
          en: 'Hull breach protocol activates — cargo bay seals crack deliberately. '
            + 'Not a clean ejection like the lever — a slow hemorrhage. '
            + 'Air escapes, pressure drops. Your ears pop. '
            + 'The creature screams — almost human — before being drawn centimeter by centimeter toward the breach. '
            + 'It takes longer. It\'s worse.',
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
          fr: 'Le panneau résiste à vos coups. Un fragment de métal se détache et vous entaille le bras. '
            + 'Le boîtier est plus renforcé qu\'il n\'y paraît.',
          en: 'The panel withstands your blows. A metal fragment cuts your arm. The casing is more reinforced than it looks.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
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
    fr: 'Vous vous réveillez seul dans les entrailles d\'un vaisseau-cargo en dérive, l\'USS Meridian. '
      + 'Votre capsule cryogénique s\'est ouverte d\'urgence — les 46 autres sont mortes depuis 6 mois. '
      + 'Les alarmes hurlent. L\'éclairage de secours peint les couloirs en rouge sang. '
      + 'Quelque chose rôde dans les sections abandonnées — quelque chose qui a tué tout l\'équipage. '
      + 'Trouvez un moyen d\'atteindre les pods d\'évasion. Fuyez. Ne regardez pas en arrière.',
    en: 'You wake alone in a drifting cargo ship, the USS Meridian. '
      + 'Your cryopod opened on emergency — the other 46 have been dead for 6 months. '
      + 'Something roams the abandoned sections. Reach the escape pods. Run.',
  },

  nodes: [
    {
      id: 'start',
      role: 'entry',
      beat: 'intro',
      tension: 2,
      descriptionKey: {
        fr: 'Baie des Capsules Cryogéniques — Vous ouvrez les yeux. Froid mordant. Obscurité presque totale. '
          + 'Le couvercle de votre capsule est ouvert — éjection d\'urgence. '
          + 'Autour de vous, 46 autres capsules. Silencieuses. Leurs voyants sont morts depuis longtemps. '
          + 'L\'éclairage de secours rougeoie faiblement. Un terminal de statut clignote contre le mur, '
          + 'et un casier d\'urgence attend dans l\'ombre. '
          + 'Vous êtes seul. Et quelque chose a coupé le courant il y a 4 heures.',
        en: 'Cryopod Bay — You open your eyes. Biting cold. Near-total darkness. '
          + '46 other pods, all dead. Emergency lighting glows faintly. '
          + 'A status terminal flickers. An emergency locker waits in the shadows.',
      },
    },
    {
      id: 'unlock',
      role: 'gate',
      beat: 'rising',
      tension: 4,
      descriptionKey: {
        fr: 'Point de Contrôle de Sécurité — Une cloison blindée barre le couloir, '
          + 'épaisse comme un coffre-fort. Le panneau de sécurité adjacent exige un badge de niveau 3. '
          + 'Des griffures profondes marquent le métal — quelque chose a tenté de forcer le passage '
          + 'depuis l\'autre côté. Sans succès. Ou avec succès, justement — impossible de savoir. '
          + 'Une grille de ventilation au plafond offre peut-être une alternative '
          + 'pour ceux qui n\'ont pas peur du noir et des espaces confinés.',
        en: 'Security Checkpoint — An armored bulkhead blocks the corridor. Badge reader demands level 3+. '
          + 'Deep scratches on the metal from the other side. '
          + 'A ceiling vent might offer an alternative route.',
      },
    },
    {
      id: 'reveal',
      role: 'midpoint',
      beat: 'midpoint',
      tension: 6,
      descriptionKey: {
        fr: 'Quartiers du Capitaine — Le bureau personnel du Capitaine Reeves. '
          + 'Des papiers froissés jonchent le sol. Le terminal personnel est encore allumé — '
          + 'les dernières entrées de journal clignotent à l\'écran. '
          + 'Un datapad repose sur le bureau, séparé du terminal, comme s\'il avait été posé là '
          + 'délibérément pour que quelqu\'un le trouve. '
          + 'Le hublot d\'observation montre l\'extérieur : le vaisseau dérive, des sections entières '
          + 'arrachées et exposées au vide. L\'USS Meridian est en train de mourir.',
        en: 'Captain\'s Quarters — Captain Reeves\' office. Crumpled papers on the floor. '
          + 'Personal terminal still on. A datapad on the desk, deliberately placed. '
          + 'Through the viewport: the ship drifts, sections torn away.',
      },
    },
    {
      id: 'escalation',
      role: 'escalation',
      beat: 'escalation',
      tension: 8,
      descriptionKey: {
        fr: 'Centre de Survie — L\'air est rare. Chaque respiration compte. '
          + 'Le panneau de support vie est en miettes — griffures profondes, câbles arrachés. '
          + 'La créature est venue ici en premier. Elle savait ce qu\'elle faisait. '
          + 'Un casier de combinaison EVA est verrouillé contre le mur — '
          + 'la seule protection contre l\'asphyxie progressive. '
          + 'La valve de reroutage O₂ et le conduit d\'énergie principal offrent '
          + 'des options de survie pour ceux qui savent improviser. '
          + 'Le passage vers le pont inférieur est droit devant. Chaque seconde ici vous coûte de l\'air.',
        en: 'Life Support Hub — Air is thin. The life support panel is shredded. '
          + 'An EVA suit locker, an O₂ valve, a power conduit — survival options for those who improvise. '
          + 'The lower deck is straight ahead. Every second here costs air.',
      },
    },
    {
      id: 'boss',
      role: 'climax',
      beat: 'climax',
      tension: 10,
      descriptionKey: {
        fr: 'Soute / Pont des Pods — L\'air est presque irrespirable. '
          + 'L\'écoutille du pod d\'évasion est là, à portée de main — mais un lecteur de badge '
          + 'contrôle l\'accès. Et entre vous et la sortie : la créature. '
          + 'Le Spécimen Alpha, Projet ORACLE. Biomasse noire, griffes d\'acier organique, '
          + 'et une intelligence terrifiante dans ses yeux trop humains. '
          + 'Le levier de largage cargo est à votre gauche. '
          + 'Le panneau de contrôle des joints de coque est à votre droite. '
          + 'Le pod est droit devant. C\'est elle ou vous.',
        en: 'Cargo Bay / Pod Deck — Air nearly gone. The escape pod hatch is right there — '
          + 'but a badge reader controls access. And between you and the exit: the creature. '
          + 'Jettison lever on the left. Hull breach panel on the right. Pod straight ahead.',
      },
    },
    {
      id: 'resolution',
      role: 'epilogue',
      beat: 'resolution',
      tension: 3,
      descriptionKey: {
        fr: 'Pod d\'Évasion — Le sas se referme derrière vous. Le silence. '
          + 'Pas le silence de la mort — le silence de la sécurité. '
          + 'Le pod s\'éjecte avec un souffle pneumatique. '
          + 'Depuis le hublot, vous regardez l\'USS Meridian rapetisser dans l\'obscurité — '
          + 'un point de lumière avalé par le noir de l\'espace. '
          + 'Quelque part là-dedans, le Spécimen Alpha attend le prochain visiteur. '
          + 'Mais pas vous. Plus jamais vous.',
        en: 'Escape Pod — The airlock seals behind you. Silence — not death\'s silence, safety\'s silence. '
          + 'Through the porthole, the USS Meridian shrinks into darkness.',
      },
    },
  ],

  gateItem: 'access_keycard',
  gateItemLocation: 'start',

  revelation: {
    fr: 'La créature qui rôde dans le vaisseau n\'est pas un accident. '
      + 'Projet ORACLE — programme d\'armement biologique classifié du Commandement Spatial. '
      + 'Le "Spécimen Alpha" a été délibérément embarqué à bord de l\'USS Meridian '
      + 'pour un test d\'adaptation en environnement confiné. L\'équipage de 47 personnes '
      + 'servait de cobayes involontaires. Le Dr. Nakamura savait. Le Commandement savait. '
      + 'Quand le spécimen a franchi le confinement, le Capitaine Reeves a compris — trop tard. '
      + 'Il a scellé les sections, sacrifié les équipes piégées, '
      + 'et laissé son journal comme dernier témoignage. '
      + 'Vous n\'êtes pas un survivant par chance. Vous êtes le dernier sujet de test.',
    en: 'The creature is no accident. Project ORACLE — classified bioweapons program. '
      + 'Specimen Alpha was deliberately placed aboard the USS Meridian for a confined-environment adaptation test. '
      + 'The crew of 47 were unwitting test subjects. You are the last one.',
  },
  escalationTrigger: {
    fr: 'La créature a appris. Ce n\'est plus un prédateur aveugle — c\'est un chasseur stratégique. '
      + 'Elle a ciblé le système de support vie : les câbles d\'alimentation arrachés '
      + 'avec une précision chirurgicale. L\'O₂ chute dans tout le vaisseau — 3% par minute. '
      + 'L\'éclairage meurt section par section, plongeant les couloirs dans un noir absolu. '
      + 'Votre lampe torche est désormais votre meilleur ami. '
      + 'Il reste peut-être 20 minutes d\'air respirable. '
      + 'Les pods d\'évasion sont au pont inférieur. La créature le sait aussi.',
    en: 'The creature has learned. It targeted life support — cables torn with surgical precision. '
      + 'O₂ drops 3% per minute. Lighting dies section by section. Maybe 20 minutes of breathable air left. '
      + 'The escape pods are on the lower deck. The creature knows it too.',
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
    fr: 'La soute possède un système de largage d\'urgence — un levier mécanique, '
      + 'pas de l\'électronique. Mais il y a aussi le panneau de contrôle des joints de coque : '
      + 'forcer une décompression localisée est possible si vous savez pirater le système. '
      + 'Dans les deux cas, si la créature est dans la soute au moment de la manœuvre... '
      + 'le vide spatial ne fait pas de prisonniers.',
    en: 'The cargo bay has both a mechanical jettison lever and a hull breach control panel. '
      + 'If the creature is in the bay when either activates... '
      + 'the void of space takes no prisoners.',
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

  theme: {
    id: 'derelict_ship',
    nameKey: { fr: 'Épave Stellaire', en: 'Derelict Ship' },
    supportedRoles: [
      'passage', 'control_room', 'storage', 'medical', 'quarters',
      'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock',
    ],
    locationNames: {
      passage: [
        ls('Coursive principale'), ls('Coursive latérale'), ls('Couloir de service'),
        ls('Couloir résidentiel'), ls('Passage étroit'), ls('Conduit de maintenance'),
        ls('Coursive arrière'), ls('Passerelle suspendue'), ls('Tunnel de câbles'),
        ls('Coursive pressurisée'), ls('Corridor est'), ls('Corridor ouest'),
        ls('Couloir d\'accès'), ls('Passage de secours'), ls('Coursive commerciale'),
        ls('Couloir technique'), ls('Passerelle de communication'), ls('Passage blindé'),
        ls('Coursive de fuite'), ls('Tunnel de survie'), ls('Corridor principal'),
        ls('Passerelle inférieure'),
      ],
      control_room: [
        ls('Passerelle de commandement'), ls('Salle de contrôle principale'),
        ls('Poste de pilotage'), ls('Centre de navigation'), ls('Salle des opérations'),
        ls('Poste de commandement'), ls('Salle de surveillance'), ls('Centre de contrôle'),
        ls('Tableau de bord principal'), ls('Poste de vigie'), ls('Salle de coordination'),
        ls('Centre de gestion'), ls('Poste de contrôle auxiliaire'), ls('Salle des instruments'),
        ls('Centre de commandement tactique'), ls('Poste de navigation avancé'),
        ls('Salle de contrôle de secours'), ls('Centre d\'opérations'),
        ls('Poste de pilotage secondaire'), ls('Salle de contrôle des moteurs'),
        ls('Centre de coordination du vaisseau'), ls('Poste de commandement arrière'),
      ],
      storage: [
        ls('Soute principale'), ls('Soute secondaire'), ls('Cale à provisions'),
        ls('Entrepôt de fret'), ls('Soute de fret'), ls('Compartiment de stockage'),
        ls('Réserve d\'équipement'), ls('Soute d\'armement'), ls('Cale arrière'),
        ls('Soute sous pression'), ls('Entrepôt d\'urgence'), ls('Dépôt de matériel'),
        ls('Soute réfrigérée'), ls('Cale de chargement'), ls('Soute de ravitaillement'),
        ls('Compartiment de réserve'), ls('Dépôt de composants'), ls('Soute avant'),
        ls('Cale à outils'), ls('Soute de matériel médical'), ls('Entrepôt de fret lourd'),
        ls('Cale de stockage secondaire'),
      ],
      medical: [
        ls('Infirmerie principale'), ls('Infirmerie de bord'), ls('Salle de soins'),
        ls('Infirmerie d\'urgence'), ls('Centre médical'), ls('Salle d\'opérations médicales'),
        ls('Poste de premiers secours'), ls('Infirmerie secondaire'), ls('Salle de cryogénie médicale'),
        ls('Centre de traumatologie'), ls('Infirmerie chirurgicale'), ls('Salle de triage'),
        ls('Infirmerie de quarantaine'), ls('Centre de décontamination'), ls('Salle de soins intensifs'),
        ls('Infirmerie de recherche'), ls('Compartiment médical'), ls('Poste de soin d\'urgence'),
        ls('Salle de diagnostic'), ls('Centre de soins avancé'), ls('Infirmerie principale de pont'),
        ls('Salle de médecine d\'urgence'),
      ],
      quarters: [
        ls('Cabines de l\'équipage'), ls('Cabines résidentielles'), ls('Dortoirs de l\'équipage'),
        ls('Quartiers d\'officiers'), ls('Cabines de couchage'), ls('Zone de vie de l\'équipage'),
        ls('Module résidentiel'), ls('Compartiments de repos'), ls('Quartiers du personnel'),
        ls('Cabines de navigation'), ls('Quartiers du capitaine'), ls('Cabines de l\'ingénierie'),
        ls('Quartiers médicaux'), ls('Module de repos'), ls('Cabines visiteurs'),
        ls('Compartiments résidentiels'), ls('Zone de récupération'), ls('Cabines de garde'),
        ls('Quartiers de sécurité'), ls('Module de vie'), ls('Cabines de pont supérieur'),
        ls('Quartiers d\'équipage arrière'),
      ],
      hub: [
        ls('Carrefour des coursives'), ls('Jonction centrale'), ls('Nœud de distribution'),
        ls('Carrefour principal'), ls('Intersection des couloirs'), ls('Carrefour de service'),
        ls('Jonction de maintenance'), ls('Nœud de circulation'), ls('Carrefour d\'urgence'),
        ls('Jonction de sécurité'), ls('Centre de distribution'), ls('Carrefour technique'),
        ls('Nœud central de navigation'), ls('Carrefour des sections'), ls('Jonction des systèmes'),
        ls('Carrefour de commandement'), ls('Nœud d\'aiguillage'), ls('Carrefour de fuite'),
        ls('Jonction pressurisée'), ls('Centre de communication'), ls('Nœud de jonction principal'),
        ls('Carrefour des modules'),
      ],
      dead_end: [
        ls('Cul-de-sac de maintenance'), ls('Impasse technique'), ls('Compartiment sans issue'),
        ls('Alcôve de service'), ls('Renfoncement de câbles'), ls('Cul-de-sac arrière'),
        ls('Impasse blindée'), ls('Compartiment isolé'), ls('Alcôve de stockage'),
        ls('Cul-de-sac résidentiel'), ls('Impasse de service'), ls('Compartiment de secours'),
        ls('Alcôve d\'urgence'), ls('Renfoncement de sécurité'), ls('Cul-de-sac technique'),
        ls('Impasse de navigation'), ls('Compartiment verrouillé'), ls('Alcôve de maintenance'),
        ls('Impasse pressurisée'), ls('Renfoncement aveugle'), ls('Cul-de-sac de câblage'),
        ls('Compartiment de dérivation'),
      ],
      hazard_zone: [
        ls('Salle des moteurs'), ls('Chambre de réacteur'), ls('Compartiment de propulsion'),
        ls('Zone de radiation'), ls('Salle de générateur'), ls('Chambre de fusion'),
        ls('Zone de carburant'), ls('Compartiment de refroidissement'), ls('Salle des turbines'),
        ls('Zone d\'explosion'), ls('Chambre de fission'), ls('Zone de décompression'),
        ls('Salle de pression critique'), ls('Compartiment de plasma'), ls('Zone de fuite de carburant'),
        ls('Chambre de combustion'), ls('Zone de haute tension'), ls('Salle de réfrigération critique'),
        ls('Compartiment de radioactivité'), ls('Zone de risque chimique'),
        ls('Salle des propulseurs principaux'), ls('Chambre d\'éjection des déchets'),
      ],
      engineering: [
        ls('Compartiment technique principal'), ls('Salle de maintenance'), ls('Zone de réparation'),
        ls('Atelier de l\'ingénierie'), ls('Compartiment des systèmes'), ls('Salle des machines'),
        ls('Zone d\'entretien'), ls('Atelier de mécanique'), ls('Compartiment électrique'),
        ls('Salle de l\'ingénierie avancée'), ls('Zone de diagnostic technique'), ls('Atelier de soudure'),
        ls('Compartiment des circuits'), ls('Salle de contrôle des systèmes'),
        ls('Zone de maintenance préventive'), ls('Atelier d\'assemblage'),
        ls('Compartiment de réparation d\'urgence'), ls('Salle des équipements'),
        ls('Zone de mécanique avancée'), ls('Atelier de navigation'),
        ls('Compartiment de l\'ingénierie secondaire'), ls('Salle de diagnostic des pannes'),
      ],
      airlock: [
        ls('Sas principal'), ls('Sas de secours'), ls('Sas d\'embarquement'),
        ls('Sas EVA'), ls('Sas de décontamination'), ls('Sas d\'urgence'),
        ls('Sas de transfert'), ls('Sas d\'amarrage'), ls('Sas secondaire'),
        ls('Sas de fret'), ls('Sas de maintenance extérieure'), ls('Sas de sortie'),
        ls('Sas blindé'), ls('Sas de quarantaine'), ls('Sas de convoyage'),
        ls('Sas d\'accès extérieur'), ls('Sas de pressurisation'), ls('Sas de survie'),
        ls('Sas arrière'), ls('Sas central'), ls('Sas d\'évacuation'),
        ls('Sas de départ EVA'),
      ],
    },
    features: ['airlock', 'viewport', 'hull_panel', 'life_support', 'cryopod', 'emergency_locker', 'status_terminal'],
    preferredItems: ['EVA_suit', 'plasma_cutter', 'access_keycard', 'welding_torch', 'emergency_flashlight', 'medkit_basic'],
  },
};
