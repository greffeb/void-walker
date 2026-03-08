// ---------------------------------------------------------------------------
// src/content/scenarios/rescue.ts — RESCUE skeleton: "Dernier Signal"
// ---------------------------------------------------------------------------
// Fantasy: Someone is alive in there. Get them out.
// 6 core nodes, gate item: medical_stabilizer, boss type: choice
// Enriched in Chantier 5: features, items, NPCs with full interactions.
// ---------------------------------------------------------------------------

import type { CoreSkeleton, LoreFragment, ScenarioFeatureDefinition, ScenarioItemDefinition, LocaleString } from '@engine/scenario';

function ls(fr: string): LocaleString { return { fr, en: '' }; }

// =====================================================================
// ITEMS — START node
// =====================================================================

const first_aid_kit: ScenarioItemDefinition = {
  id: 'first_aid_kit',
  itemType: 'consumable',
  extraProperties: ['organic_compatible', 'small'],
  aliases: {
    fr: ['trousse', 'premiers soins', 'kit medical', 'soins', 'trousse soins'],
    en: ['first aid', 'kit', 'medical kit', 'bandages'],
  },
  description: {
    fr: "Trousse de premiers soins recuperee de la navette. Compresses, desinfectant, garrot. Pas suffisant pour une blessure grave, mais utile en urgence.",
    en: "First aid kit from the shuttle. Not enough for serious injuries, but useful in emergencies.",
  },
  examineResult: {
    fr: "Trousse de premiers soins recuperee de la navette. Compresses, desinfectant, garrot. Pas suffisant pour stabiliser une blessure grave.",
    en: "",
  },
  useOn: [
    {
      targetId: 'self',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Vous appliquez les compresses et le desinfectant sur vos blessures. Le garrot ralentit un saignement. Ce n'est pas grand chose, mais suffisant pour tenir.",
            en: "You apply the bandages and antiseptic to your wounds. The tourniquet slows the bleeding. Not much, but enough to keep going.",
          },
          consequences: [{ type: 'heal', amount: 3, targetId: 'player' }],
          consumeItem: true,
        },
      },
    },
    {
      targetId: 'dr_okonkwo',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Vous appliquez les compresses sur ses plaies les plus visibles. Le garrot stoppe un saignement au bras. Ce n'est pas suffisant pour la stabiliser — il faut un stabilisateur medical — mais elle respire un peu mieux.",
            en: "You apply bandages to the worst wounds. Not enough to stabilize, but she breathes a bit easier.",
          },
          consequences: [{ type: 'heal', amount: 2, targetId: 'dr_okonkwo' }],
          consumeItem: true,
          flagSet: 'okonkwo_patched',
        },
      },
    },
  ],
};

const medical_stabilizer: ScenarioItemDefinition = {
  id: 'medical_stabilizer',
  itemType: 'key_item',
  hidden: true,
  revealedBy: { featureId: 'crashed_shuttle', requiredState: 'open' },
  extraProperties: ['electronic', 'small', 'usable'],
  aliases: {
    fr: ['stabilisateur', 'stabilisateur medical', 'stab', 'appareil medical'],
    en: ['stabilizer', 'medical stabilizer', 'med device'],
  },
  description: {
    fr: "Stabilisateur medical de niveau hospitalier. Maintient un patient en etat stable pendant plusieurs heures. Exactement ce qu'il faut pour la survivante blessee.",
    en: "Hospital-grade medical stabilizer. Keeps a patient stable for hours.",
  },
  examineResult: {
    fr: "Stabilisateur medical de niveau hospitalier. Ce dispositif peut maintenir un patient en etat stable pendant plusieurs heures — exactement ce qu'il faut pour la survivante blessee.",
    en: "",
  },
  useOn: [
    {
      targetId: 'dr_okonkwo',
      interaction: {
        trigger: { verb: 'USE', requiredFlag: 'okonkwo_found', dc: null },
        onSuccess: {
          narrative: {
            fr: "Vous activez le stabilisateur et le fixez sur sa blessure principale. Les moniteurs passent au vert. La Dr. Okonkwo ouvre les yeux plus grand, la douleur recule. 'Merci. Je... je peux marcher maintenant. Sortons d'ici — ensemble.'",
            en: "You activate the stabilizer. Her monitors turn green. 'Thank you. I can walk now. Let's get out — together.'",
          },
          flagSet: 'escort_active',
          consumeItem: true,
        },
      },
    },
  ],
};

const salvage_tool: ScenarioItemDefinition = {
  id: 'salvage_tool',
  itemType: 'tool',
  hidden: true,
  revealedBy: { featureId: 'salvageable_parts', requiredState: 'empty' },
  extraProperties: ['metallic', 'usable', 'mechanical', 'small'],
  aliases: {
    fr: ['outil', 'outil recuperation', 'outil fortune', 'levier'],
    en: ['tool', 'salvage tool', 'lever'],
  },
  description: {
    fr: "Outil de recuperation multifonction. Levier, coupeur, soudeur de fortune. L'allie du survivaliste.",
    en: "Multi-function salvage tool. Lever, cutter, makeshift welder.",
  },
  examineResult: {
    fr: "Outil de recuperation multifonction. Levier, coupeur, soudeur de fortune.",
    en: "",
  },
  useOn: [
    {
      targetId: 'collapsed_corridor',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "L'outil de recuperation fait levier sur les poutres effondrees. Le metal grince, cede. Un passage etroit mais praticable s'ouvre dans les decombres.",
            en: "The salvage tool levers the collapsed beams. A narrow passage opens.",
          },
          flagSet: 'corridor_cleared_tool',
        },
      },
    },
    {
      targetId: 'blast_door_partial',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Vous bloquez l'outil dans le mecanisme de la porte blindee et forcez. Le metal grince — la porte s'ouvre de 30 centimetres supplementaires. Assez pour passer.",
            en: "You jam the tool into the blast door mechanism and force it.",
          },
          flagSet: 'blast_door_widened',
        },
      },
    },
    {
      targetId: 'extraction_bay_door',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "L'outil sert de levier pour forcer le mecanisme endommage. La porte de la baie d'extraction coulisse — la navette est de l'autre cote.",
            en: "The tool levers the damaged mechanism. The extraction bay door slides open.",
          },
          flagSet: 'extraction_door_opened',
        },
      },
    },
  ],
};

// =====================================================================
// ITEMS — UNLOCK node
// =====================================================================

const plasma_cutter: ScenarioItemDefinition = {
  id: 'plasma_cutter',
  itemType: 'tool',
  hidden: true,
  revealedBy: { featureId: 'plasma_cutter_rack', requiredState: 'empty' },
  extraProperties: ['electronic', 'large', 'powered', 'ranged'],
  aliases: {
    fr: ['decoupeur', 'decoupeur plasma', 'plasma', 'chalumeau'],
    en: ['cutter', 'plasma cutter', 'plasma'],
  },
  description: {
    fr: "Decoupeur plasma industriel. Coupe le metal comme du beurre. Bruyant, limite en batterie, mais devastateur.",
    en: "Industrial plasma cutter. Cuts metal like butter. Loud, battery-limited, devastating.",
  },
  examineResult: {
    fr: "Decoupeur plasma industriel. Puissant assez pour couper a travers les poutres effondrees, mais le bruit attirerait l'attention.",
    en: "",
  },
  useOn: [
    {
      targetId: 'collapsed_corridor',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Le plasma tranche les poutres dans une gerbe d'etincelles bleues. Le passage s'ouvre — mais le rugissement du decoupeur a resonne dans toute la station.",
            en: "Plasma slices through the beams in a shower of blue sparks.",
          },
          flagSet: 'corridor_plasma_cut',
        },
      },
    },
    {
      targetId: 'creature_hunter',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Le faisceau plasma touche la creature. Elle hurle — un son qui vous transperce — et recule, la chair cauterisee. Blessee, pas vaincue. Mais vous avez gagne un repit.",
            en: "The plasma beam hits the creature. It screams and recoils, cauterized.",
          },
          consequences: [{ type: 'damage', amount: 4, targetId: 'creature_hunter' }],
        },
      },
    },
  ],
};

// =====================================================================
// ITEMS — REVEAL node
// =====================================================================

const research_notes: ScenarioItemDefinition = {
  id: 'research_notes',
  itemType: 'data',
  extraProperties: ['organic', 'readable', 'small'],
  aliases: {
    fr: ['notes', 'notes recherche', 'cahier', 'carnet', 'rapport'],
    en: ['notes', 'research notes', 'journal', 'report'],
  },
  description: {
    fr: "Notes de recherche d'Okonkwo. Projet Chasseur — sensibilite acoustique extreme. Les hautes frequences la desorientent. L'information qui pourrait vous sauver la vie.",
    en: "Okonkwo's research notes. Project Hunter — extreme sound sensitivity.",
  },
  examineResult: {
    fr: "Notes de recherche detaillant le Projet Chasseur — une creature modifiee genetiquement. Point cle : sensibilite acoustique extreme.",
    en: "",
  },
  readableContent: {
    fr: "PROJET CHASSEUR — Sensibilite acoustique : hautes frequences (15-20 kHz) provoquent desorientation. Frequences > 20 kHz : douleur, paralysie temporaire.",
    en: "",
  },
  useOn: [],
};

const sonic_emitter_component: ScenarioItemDefinition = {
  id: 'sonic_emitter_component',
  itemType: 'key_item',
  extraProperties: ['electronic', 'small', 'usable', 'component'],
  aliases: {
    fr: ['emetteur', 'composant sonique', 'emetteur sonique', 'composant', 'sonique'],
    en: ['emitter', 'sonic emitter', 'sonic component', 'component'],
  },
  description: {
    fr: "Composant d'emetteur sonique haute frequence. Utilise dans les experiences d'Okonkwo. Combine avec l'acoustique d'une zone confinee, il pourrait neutraliser la creature.",
    en: "High-frequency sonic emitter component. Combined with acoustics, could neutralize the creature.",
  },
  examineResult: {
    fr: "Composant d'emetteur sonique haute frequence. Combine avec l'acoustique d'une zone confinee, il pourrait neutraliser ou pieger la creature.",
    en: "",
  },
  useOn: [
    {
      targetId: 'creature_hunter',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Vous activez le composant sonique. Un hurlement ultrasonique — inaudible pour vous, devastateur pour la creature. Elle se tord de douleur, recule. Un repit precieux.",
            en: "You activate the sonic component. An ultrasonic shriek — devastating for the creature.",
          },
          consequences: [{ type: 'damage', amount: 3, targetId: 'creature_hunter' }],
          flagSet: 'creature_repelled_escalation',
        },
      },
    },
    {
      targetId: 'acoustic_trap_point',
      interaction: {
        trigger: { verb: 'USE', requiredFlag: 'acoustic_info_received', dc: null },
        onSuccess: {
          narrative: {
            fr: "Vous fixez le composant sonique au point de piege acoustique. L'activation declenche une cascade de resonance — les murs acoustiques amplifient le signal x100. Un mur de son invisible, infranchissable pour la creature. Confinee. Neutralisee. Pour toujours.",
            en: "You attach the sonic component to the acoustic trap point. Resonance cascade. The creature is trapped.",
          },
          flagSet: 'creature_contained',
          consumeItem: true,
        },
      },
    },
    {
      targetId: 'acoustic_walls',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Vous activez le composant contre les parois acoustiques. Le son se repercute violemment — la creature hurle et s'enfuit du couloir. Le chemin est libre, temporairement.",
            en: "You activate the component against the acoustic walls. The creature flees.",
          },
          flagSet: 'creature_repelled_escalation',
        },
      },
    },
    {
      targetId: 'emergency_beacon_broken',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Le composant sonique remplace l'antenne brisee — meme gamme de frequences. La balise emet a nouveau. Mais vous venez de sacrifier votre seule arme contre la creature.",
            en: "The sonic component replaces the broken antenna. But you just sacrificed your only weapon.",
          },
          flagSet: 'backup_beacon_active',
          consumeItem: true,
        },
      },
    },
  ],
};

// =====================================================================
// ITEMS — ESCALATION node
// =====================================================================

const distraction_device: ScenarioItemDefinition = {
  id: 'distraction_device',
  itemType: 'consumable',
  hidden: true,
  revealedBy: { featureId: 'distraction_rack', requiredState: 'empty' },
  extraProperties: ['electronic', 'small'],
  aliases: {
    fr: ['grenade', 'leurre', 'diversion', 'grenade flash', 'generateur bruit'],
    en: ['grenade', 'decoy', 'distraction', 'flash', 'noise maker'],
  },
  description: {
    fr: "Grenade flash + generateur de bruit. Combines, ils creent une diversion parfaite — lumiere aveuglante et son desorientant. Usage unique.",
    en: "Flash grenade + noise generator. A perfect distraction. Single use.",
  },
  examineResult: {
    fr: "Grenade flash et generateur de bruit. Utiles pour creer une diversion et detourner la creature.",
    en: "",
  },
  useOn: [
    {
      targetId: 'creature_hunter',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Flash ! Le blanc aveuglant se combine avec le hurlement du generateur de bruit. La creature se tord, desorientee, et s'eloigne en titubant vers les ombres. Le leurre a marche — vous avez une fenetre de quelques minutes.",
            en: "Flash! Blinding white combines with the noise generator's scream. The creature staggers away.",
          },
          consumeItem: true,
          flagSet: 'creature_distracted',
        },
      },
    },
  ],
};

// =====================================================================
// FEATURES — START node
// =====================================================================

const crashed_shuttle: ScenarioFeatureDefinition = {
  id: 'crashed_shuttle',
  featureType: 'container',
  initialState: 'damaged',
  extraProperties: ['metallic', 'large', 'damaged'],
  contains: ['medical_stabilizer'],
  aliases: {
    fr: ['navette', 'shuttle', 'vaisseau', 'navette ecrasee', 'epave'],
    en: ['shuttle', 'crashed shuttle', 'ship', 'wreck'],
  },
  descriptions: {
    damaged: {
      fr: "Votre navette, ecrasee a l'approche. Le cockpit est deforme au-dela de toute reparation. La soute arriere est partiellement accessible — des debris bloquent l'acces complet.",
      en: "",
    },
    open: {
      fr: "La soute de la navette est dégagée. De la fumée s'échappe encore des circuits brûlés. Les compartiments de rangement sont ouverts — la plupart vides ou détruits. Le moteur principal est en miettes, le réservoir percé. Cette navette ne redécollera jamais.",
      en: "",
    },
  },
  examineResult: {
    fr: "Votre navette, ecrasee a l'approche. Le cockpit est deforme mais la soute arriere est accessible.",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'EXAMINE', requiredState: 'damaged', dc: null },
      onSuccess: {
        narrative: {
          fr: "La soute arriere contient du materiel d'urgence. Un compartiment medical est visible mais coince sous une poutre tordue. Le moteur principal est en miettes — il faudra trouver un autre moyen de partir.",
          en: "The rear cargo hold contains emergency supplies. A medical compartment is visible but jammed.",
        },
      },
    },
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', stat: 'FOR', dc: 10 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Vous arrachez la poutre tordue. Le metal grince, cede. Le compartiment medical s'ouvre — un stabilisateur medical de niveau hospitalier.",
          en: "You wrench the twisted beam away. The medical compartment opens.",
        },
        revealsItems: ['medical_stabilizer'],
      },
      onFailure: {
        narrative: {
          fr: "La poutre refuse de bouger. Le metal est tordu a un angle impossible. Il faudra plus de force — ou un outil.",
          en: "The beam refuses to budge.",
        },
      },
    },
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', requiredItem: 'salvage_tool', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "L'outil de recuperation fait levier. La poutre se plie, liberant le compartiment medical. Le stabilisateur est intact, pret a l'emploi.",
          en: "The salvage tool levers the beam aside.",
        },
        revealsItems: ['medical_stabilizer'],
      },
    },
    {
      trigger: { verb: 'SCAN', requiredState: 'damaged', stat: 'PER', dc: 9 },
      onSuccess: {
        narrative: {
          fr: "Fouillant les débris du cockpit, vous trouvez un outil de récupération encore fonctionnel. Le compartiment médical reste bloqué, mais l'outil pourrait aider à faire levier.",
          en: "Searching the cockpit debris, you find a salvage tool still operational.",
        },
        revealsItems: ['salvage_tool'],
        flagSet: 'shuttle_searched',
      },
    },
  ],
};

const hull_breach: ScenarioFeatureDefinition = {
  id: 'hull_breach',
  featureType: 'panel',
  initialState: 'open',
  extraProperties: ['metallic', 'toxic', 'easily_repairable', 'large'],
  aliases: {
    fr: ['breche', 'trou', 'breche coque', 'ouverture'],
    en: ['breach', 'hull breach', 'hole'],
  },
  descriptions: {
    open: {
      fr: "Une breche beante dans la coque exterieure. Les bords sont dechiquetes — l'impact venait de dehors. L'air s'echappe lentement.",
      en: "",
    },
    closed: {
      fr: "La breche est colmatee. Un travail de fortune, mais l'air ne fuit plus.",
      en: "",
    },
  },
  examineResult: {
    fr: "Une breche beante dans la coque exterieure. Les bords sont dechiquetes vers l'interieur — l'impact venait de dehors.",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'open', stat: 'INT', dc: 12 },
      onSuccess: {
        newState: 'closed',
        narrative: {
          fr: "Vous utilisez des plaques de debris et du cablage pour improviser un colmatage. Pas joli, mais etanche. La fuite d'air s'arrete.",
          en: "You improvise a patch from debris plates and wiring. The air leak stops.",
        },
        flagSet: 'breach_sealed',
        consequences: [{ type: 'atmosphere_change', atmosphereType: 'pressurized' }],
      },
      onFailure: {
        narrative: {
          fr: "Les plaques de debris ne tiennent pas. La breche est trop irreguliere. Il faudrait de meilleurs materiaux.",
          en: "The debris plates don't hold. The breach is too irregular.",
        },
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'open', requiredItem: 'salvage_tool', dc: null },
      onSuccess: {
        newState: 'closed',
        narrative: {
          fr: "L'outil de recuperation decoupe des plaques aux bonnes dimensions. Soudage de fortune — la breche est scellee. L'atmosphere se stabilise.",
          en: "The salvage tool cuts plates to size. Makeshift welding seals the breach.",
        },
        flagSet: 'breach_sealed',
        consequences: [{ type: 'atmosphere_change', atmosphereType: 'pressurized' }],
      },
    },
    {
      trigger: { verb: 'EXAMINE', requiredState: 'open', dc: null },
      onSuccess: {
        narrative: {
          fr: "Les marques d'impact sont violentes — pas un asteroide, quelque chose de biologique. Des griffures profondes dans le metal. Ce qui a perce cette coque ne venait pas de l'espace. Ca venait de l'interieur.",
          en: "The impact marks are violent — not an asteroid, something biological.",
        },
        flagSet: 'breach_examined',
      },
    },
  ],
};

const salvageable_parts: ScenarioFeatureDefinition = {
  id: 'salvageable_parts',
  featureType: 'container',
  initialState: 'intact',
  extraProperties: ['metallic', 'small', 'liftable'],
  contains: ['salvage_tool'],
  aliases: {
    fr: ['pieces', 'debris', 'composants', 'pieces recuperables', 'bric-a-brac'],
    en: ['parts', 'salvageable parts', 'debris', 'components'],
  },
  descriptions: {
    intact: {
      fr: "Pieces recuperables eparpillees dans les debris : cablage, composants electroniques, outils de fortune. De quoi improviser.",
      en: "",
    },
    empty: {
      fr: "Les debris utiles ont deja ete recuperes. Il ne reste que de la ferraille inutile.",
      en: "",
    },
  },
  examineResult: {
    fr: "Pieces recuperables eparpillees dans les debris : cablage, composants electroniques, outils. De quoi improviser des reparations.",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'SCAN', stat: 'PER', dc: 8 },
      onSuccess: {
        newState: 'empty',
        narrative: {
          fr: "Vous fouillez les debris methodiquement. Un outil de recuperation multifonction — encore operationnel. Et des composants electroniques qui pourraient servir pour des reparations.",
          en: "You search the debris methodically. A multi-function salvage tool — still operational.",
        },
        revealsItems: ['salvage_tool'],
      },
    },
    {
      trigger: { verb: 'TAKE', requiredState: 'intact', dc: null },
      onSuccess: {
        newState: 'empty',
        narrative: {
          fr: "Vous ramassez ce qui semble utile : un outil de recuperation, des cables, quelques composants. Le reste est de la ferraille.",
          en: "You grab what looks useful.",
        },
        revealsItems: ['salvage_tool'],
      },
    },
  ],
};

const emergency_beacon_broken: ScenarioFeatureDefinition = {
  id: 'emergency_beacon_broken',
  featureType: 'terminal',
  initialState: 'broken',
  extraProperties: ['electronic', 'broken', 'easily_repairable'],
  aliases: {
    fr: ['balise', 'balise detresse', 'balise cassee', 'emetteur'],
    en: ['beacon', 'emergency beacon', 'broken beacon', 'transmitter'],
  },
  descriptions: {
    broken: {
      fr: "La balise de detresse de la navette — endommagee dans le crash. Le circuit d'emission est intact mais l'antenne est brisee.",
      en: "",
    },
    active: {
      fr: "La balise est reparee. Le signal pulse vers l'exterieur — quelqu'un, quelque part, pourrait le capter.",
      en: "",
    },
  },
  examineResult: {
    fr: "La balise de detresse de la navette — endommagee dans le crash. Le circuit d'emission est intact mais l'antenne est brisee.",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'broken', requiredItem: 'salvage_tool', stat: 'INT', dc: 11 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Antenne reconstruite avec des pieces de fortune. Le circuit d'emission reprend vie — un bip regulier. La portee est limitee, mais c'est un signal. Un espoir de secours exterieur.",
          en: "Antenna rebuilt from salvage. The emission circuit comes alive.",
        },
        flagSet: 'backup_beacon_active',
      },
      onFailure: {
        narrative: {
          fr: "Les composants ne s'emboitent pas correctement. L'antenne reste silencieuse.",
          en: "The components don't fit right.",
        },
      },
    },
    {
      trigger: { verb: 'EXAMINE', requiredState: 'broken', dc: null },
      onSuccess: {
        narrative: {
          fr: "Le circuit d'emission est intact — seule l'antenne est brisee. Avec un composant de remplacement compatible (meme gamme de frequences), la balise pourrait etre remise en service.",
          en: "The emission circuit is intact — only the antenna is broken.",
        },
      },
    },
  ],
};

// =====================================================================
// FEATURES — UNLOCK node
// =====================================================================

const collapsed_corridor: ScenarioFeatureDefinition = {
  id: 'collapsed_corridor',
  featureType: 'door',
  initialState: 'broken',
  extraProperties: ['metallic', 'large', 'broken'],
  aliases: {
    fr: ['couloir', 'couloir effondre', 'debris', 'passage', 'effondrement', 'decombres'],
    en: ['corridor', 'collapsed corridor', 'debris', 'passage', 'rubble'],
  },
  descriptions: {
    broken: {
      fr: "Le couloir s'est effondre sous le poids des debris. Des poutres metalliques bloquent le passage principal. La structure gemit encore — instable.",
      en: "",
    },
    open: {
      fr: "Les debris ont ete degages. Le passage est etroit mais praticable. Des traces de sang menent de l'autre cote.",
      en: "",
    },
  },
  examineResult: {
    fr: "Le couloir s'est effondre sous le poids des debris. Des poutres metalliques bloquent le passage principal.",
    en: "",
  },
  interactions: [
    // Path 1: FOR pure — clear rubble bare-handed
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'broken', stat: 'FOR', dc: 12 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Poutre par poutre, vous degagez le passage. Le metal mord vos mains, la sueur brule vos yeux. Mais le couloir s'ouvre enfin.",
          en: "Beam by beam, you clear the passage.",
        },
        revealsExit: 'unlock_to_reveal',
        consequences: [{ type: 'damage', amount: 1, targetId: 'player' }],
      },
      onFailure: {
        narrative: {
          fr: "Les poutres sont trop lourdes, trop enchevetrees. Vous vous epuisez sans resultat. Il faut une autre approche — ou un outil.",
          en: "The beams are too heavy, too tangled.",
        },
      },
    },
    // Path 2: FOR + salvage tool
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'broken', requiredItem: 'salvage_tool', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "L'outil de recuperation fait levier sur les poutres principales. Le metal cede proprement — le passage s'ouvre sans effort excessif.",
          en: "The salvage tool levers the main beams. The passage opens cleanly.",
        },
        revealsExit: 'unlock_to_reveal',
      },
    },
    // Path 3: PER — find maintenance detour
    {
      trigger: { verb: 'EXAMINE', requiredState: 'broken', stat: 'PER', dc: 11 },
      onSuccess: {
        narrative: {
          fr: "En examinant les murs autour de l'effondrement, vous reperez une trappe de maintenance partiellement cachee par les decombres. Un passage alternatif.",
          en: "Examining the walls, you spot a maintenance hatch partially hidden by debris.",
        },
        flagSet: 'detour_found',
      },
    },
    // Path 4: INT — cut with plasma (noisy)
    {
      trigger: { verb: 'USE', requiredState: 'broken', requiredItem: 'plasma_cutter', stat: 'INT', dc: 10 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Le decoupeur plasma tranche les poutres comme du beurre. Le passage s'ouvre dans une pluie d'etincelles et une odeur de metal brule. Efficace — mais le bruit a du porter loin.",
          en: "The plasma cutter slices through beams like butter. Effective — but loud.",
        },
        revealsExit: 'unlock_to_reveal',
        flagSet: 'noise_made_unlock',
      },
    },
    // Path 5: AGI failsafe — crawl through unstable rubble (anti-softlock)
    {
      trigger: { verb: 'CLIMB', requiredState: 'broken', stat: 'AGI', dc: 8 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Vous rampez entre les poutres tordues. Le m\u00e9tal mord votre peau, les d\u00e9bris s'effondrent derri\u00e8re vous. Trois m\u00e8tres de terreur pure. Mais vous passez.",
          en: "You crawl through the twisted beams. Metal bites your skin, debris collapses behind you. But you make it through.",
        },
        revealsExit: 'unlock_to_reveal',
        consequences: [{ type: 'damage', amount: 3, targetId: 'player' }],
      },
      onFailure: {
        narrative: {
          fr: "Vous tentez de ramper dans les d\u00e9combres mais une poutre glisse, manquant de vous \u00e9craser. Trop instable — il faut une autre approche.",
          en: "You try to crawl through but a beam shifts, nearly crushing you. Too unstable.",
        },
        consequences: [{ type: 'damage', amount: 1, targetId: 'player' }],
      },
    },
  ],
};

const maintenance_detour_hatch: ScenarioFeatureDefinition = {
  id: 'maintenance_detour_hatch',
  featureType: 'door',
  initialState: 'closed',
  extraProperties: ['metallic', 'small', 'openable'],
  aliases: {
    fr: ['trappe', 'trappe maintenance', 'detour', 'conduit', 'trappe acces'],
    en: ['hatch', 'maintenance hatch', 'detour', 'duct'],
  },
  descriptions: {
    closed: {
      fr: "Trappe d'acces vers les conduits de maintenance. Etroite mais praticable. Un chemin alternatif pour contourner l'effondrement.",
      en: "",
    },
    open: {
      fr: "La trappe est ouverte. Le conduit de maintenance est sombre et etroit, mais il mene de l'autre cote.",
      en: "",
    },
  },
  examineResult: {
    fr: "Trappe d'acces vers les conduits de maintenance. Etroite mais praticable.",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'OPEN', requiredState: 'closed', requiredFlag: 'detour_found', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "La trappe s'ouvre dans un grincement. Le conduit est etroit — il faudra ramper. Mais il mene de l'autre cote de l'effondrement, en silence.",
          en: "The hatch opens with a creak. The duct is narrow — you'll need to crawl.",
        },
        revealsExit: 'unlock_to_reveal',
      },
    },
    {
      trigger: { verb: 'OPEN', requiredState: 'closed', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "La trappe resiste un instant, puis cede. Le conduit de maintenance s'ouvre devant vous — un boyau sombre. Pas confortable, mais praticable.",
          en: "The hatch resists, then gives. A dark shaft opens before you.",
        },
        revealsExit: 'unlock_to_reveal',
      },
    },
  ],
};

const plasma_cutter_rack: ScenarioFeatureDefinition = {
  id: 'plasma_cutter_rack',
  featureType: 'container',
  initialState: 'intact',
  extraProperties: ['metallic'],
  contains: ['plasma_cutter'],
  aliases: {
    fr: ['rack', 'rack plasma', 'decoupeur', 'support'],
    en: ['rack', 'plasma cutter rack', 'cutter rack'],
  },
  descriptions: {
    intact: {
      fr: "Rack contenant un decoupeur plasma industriel. Puissant — mais le bruit attirerait l'attention de tout predateur dans les parages.",
      en: "",
    },
    empty: {
      fr: "Le rack est vide. Le decoupeur a ete pris.",
      en: "",
    },
  },
  examineResult: {
    fr: "Rack contenant un decoupeur plasma industriel. Puissant mais bruyant.",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'TAKE', requiredState: 'intact', dc: null },
      onSuccess: {
        newState: 'empty',
        narrative: {
          fr: "Le decoupeur plasma est lourd mais fonctionnel. La batterie est a 40% — assez pour quelques coupes. L'outil parfait pour les obstacles physiques, si vous acceptez le bruit.",
          en: "The plasma cutter is heavy but functional. 40% battery.",
        },
        revealsItems: ['plasma_cutter'],
      },
    },
  ],
};

// =====================================================================
// FEATURES — REVEAL node
// =====================================================================

const survivor_barricade: ScenarioFeatureDefinition = {
  id: 'survivor_barricade',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['metallic', 'large'],
  aliases: {
    fr: ['barricade', 'fortification', 'defense', 'abri'],
    en: ['barricade', 'fortification', 'barrier', 'shelter'],
  },
  descriptions: {
    intact: {
      fr: "Barricade improvisee — mobilier, plaques metalliques, cablage. Quelqu'un s'est retranche ici avec methode. Des traces de sang menent derriere.",
      en: "",
    },
    broken: {
      fr: "La barricade est en morceaux. Ca ne protegera plus personne.",
      en: "",
    },
  },
  examineResult: {
    fr: "Une barricade improvisee avec du mobilier et des plaques metalliques. Des traces de sang menent derriere.",
    en: "",
  },
  interactions: [
    // TALK/KNOCK — CHA approach (sets okonkwo_found)
    {
      trigger: { verb: 'TALK', requiredState: 'intact', stat: 'CHA', dc: 8 },
      onSuccess: {
        narrative: {
          fr: "\"Il y a quelqu'un ?\" Silence. Puis une voix, rauque, mefiante : \"Qui etes-vous ? Comment etes-vous arrive ici ?\" Des bruits de metal — la barricade s'entrouvre. Une femme blessee vous devisage. La Dr. Okonkwo.",
          en: "\"Anyone there?\" Silence. Then a hoarse voice: \"Who are you?\" Metal scrapes — the barricade opens a crack.",
        },
        flagSet: 'okonkwo_found',
      },
      onFailure: {
        narrative: {
          fr: "\"Allez-vous en !\" La voix derriere la barricade est terrifiee, pas hostile. Mais elle refuse d'ouvrir. Il faudra insister — ou trouver un autre moyen.",
          en: "\"Go away!\" The voice behind the barricade is terrified. She refuses to open.",
        },
      },
    },
    {
      trigger: { verb: 'EXAMINE', dc: null },
      onSuccess: {
        narrative: {
          fr: "Construction methodique — une scientifique a fait ca, pas un technicien panique. Les plaques sont soudees aux points de stress. Des rations vides indiquent que quelqu'un a survecu ici pendant au moins 48 heures.",
          en: "Methodical construction — a scientist built this, not a panicked tech.",
        },
      },
    },
    // BREAK — destructive approach (Okonkwo becomes hostile/scared)
    {
      trigger: { verb: 'BREAK', stat: 'FOR', dc: 8 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: "Vous demontez la barricade a coups de pied. Le metal s'effondre dans un fracas assourdissant. Derriere, une femme blessee recule, terrifiee — la Dr. Okonkwo. Votre entree en force n'inspire pas confiance.",
          en: "You kick down the barricade. Behind it, a wounded woman recoils in terror.",
        },
        flagSet: 'okonkwo_found',
      },
    },
  ],
};

const research_terminal: ScenarioFeatureDefinition = {
  id: 'research_terminal',
  featureType: 'terminal',
  initialState: 'damaged',
  extraProperties: ['electronic', 'damaged', 'readable', 'easily_repairable'],
  aliases: {
    fr: ['terminal', 'terminal recherche', 'ordinateur', 'console'],
    en: ['terminal', 'research terminal', 'computer', 'console'],
  },
  descriptions: {
    damaged: {
      fr: "Terminal de recherche partiellement detruit. L'ecran clignote — donnees fragmentaires recuperables.",
      en: "",
    },
    active: {
      fr: "Terminal restaure. Les donnees du Projet Chasseur s'affichent en entier — une horreur fascinante.",
      en: "",
    },
  },
  examineResult: {
    fr: "Terminal de recherche partiellement detruit. Les donnees recuperables montrent des resultats d'experiences genetiques.",
    en: "",
  },
  readableContent: {
    fr: "PROJET CHASSEUR — Dr. A. Okonkwo, Chercheuse Principale\n\n— Specimen Alpha : organisme synthetique a evolution acceleree\n— Sensibilite acoustique : hautes frequences (15-20 kHz) provoquent desorientation\n— Frequences > 20 kHz : douleur, paralysie temporaire\n— AVERTISSEMENT : le specimen apprend. Adaptation aux stimuli repetes en 3-5 expositions\n— Note finale : 'J'aurais du arreter au Stade 3. Je le savais. Pardon.'",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'READ', requiredState: 'damaged', dc: null },
      onSuccess: {
        narrative: {
          fr: "Donnees fragmentaires : 'Projet Chasseur — sensibilite acoustique extreme — frequences 15-20 kHz — desorientation confirmee'. Et une note personnelle : 'J'aurais du arreter au Stade 3. Pardon.'",
          en: "Fragmented data about Project Hunter and Okonkwo's guilt.",
        },
        flagSet: 'project_hunter_read',
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 11 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Le terminal reprend vie. Les donnees completes du Projet Chasseur s'affichent. Et un detail crucial : la creature APPREND. Elle s'adapte aux stimuli repetes en 3 a 5 expositions.",
          en: "Full Project Hunter data. Crucial detail: the creature LEARNS.",
        },
        flagSet: 'creature_learns_discovered',
      },
    },
    // READ active state — full data review
    {
      trigger: { verb: 'READ', requiredState: 'active', dc: null },
      onSuccess: {
        narrative: {
          fr: "Les donnees completes du Projet Chasseur. Sequences genetiques, courbes d'adaptation, rapports d'incidents. Tout est la — la preuve que la corporation savait ce qu'elle faisait.",
          en: "Full Project Hunter data. Gene sequences, adaptation curves, incident reports.",
        },
        flagSet: 'project_hunter_read',
      },
    },
  ],
};

// =====================================================================
// FEATURES — ESCALATION node
// =====================================================================

const acoustic_walls: ScenarioFeatureDefinition = {
  id: 'acoustic_walls',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['attached', 'reflective'],
  aliases: {
    fr: ['parois', 'murs acoustiques', 'panneaux', 'parois acoustiques'],
    en: ['walls', 'acoustic walls', 'panels', 'acoustic panels'],
  },
  descriptions: {
    intact: {
      fr: "Panneaux acoustiques recouvrant les parois — vestiges du laboratoire d'Okonkwo. Ils amplifient le son de maniere spectaculaire.",
      en: "",
    },
  },
  examineResult: {
    fr: "Les parois de cette zone sont recouvertes de panneaux acoustiques. Un emetteur sonique fonctionnerait ici avec une efficacite maximale.",
    en: "",
  },
  interactions: [
    // EXAMINE INT DC10 — scientific analysis reveals acoustic weakness (alt path to acoustic_info_received)
    {
      trigger: { verb: 'EXAMINE', stat: 'INT', dc: 10 },
      onSuccess: {
        narrative: {
          fr: "Les panneaux sont calibres pour 15-20 kHz — frequence de resonance maximale. Vous comprenez : un emetteur sonique a cette frequence, dans cette geometrie, creerait une cage acoustique infranchissable. La faiblesse de la creature, amplifiee par l'architecture.",
          en: "The panels are calibrated for 15-20 kHz. You understand: a sonic emitter here would create an impassable acoustic cage.",
        },
        flagSet: 'acoustic_info_received',
      },
    },
    // EXAMINE auto — simple narrative observation
    {
      trigger: { verb: 'EXAMINE', dc: null },
      onSuccess: {
        narrative: {
          fr: "Les panneaux sont concus pour une resonance maximale dans la gamme 15-20 kHz — exactement la frequence de sensibilite de la creature. Si vous avez le composant sonique, c'est ICI qu'il faut l'utiliser.",
          en: "The panels are designed for maximum resonance at 15-20 kHz — the creature's exact sensitivity range.",
        },
        flagSet: 'acoustic_potential_noted',
      },
    },
  ],
};

const distraction_rack: ScenarioFeatureDefinition = {
  id: 'distraction_rack',
  featureType: 'container',
  initialState: 'intact',
  extraProperties: ['metallic'],
  contains: ['distraction_device'],
  aliases: {
    fr: ['rack diversion', 'rack grenades', 'grenades', 'rack'],
    en: ['distraction rack', 'grenades', 'rack'],
  },
  descriptions: {
    intact: {
      fr: "Rack contenant des grenades flash et des generateurs de bruit. Utiles pour detourner l'attention d'un predateur.",
      en: "",
    },
    empty: {
      fr: "Le rack est vide. Les dispositifs de diversion ont ete pris.",
      en: "",
    },
  },
  examineResult: {
    fr: "Rack contenant des grenades flash et des generateurs de bruit. Utiles pour creer une diversion.",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'TAKE', requiredState: 'intact', dc: null },
      onSuccess: {
        newState: 'empty',
        narrative: {
          fr: "Vous prenez une grenade flash et un generateur de bruit portable. Des leurres — pas des armes. Mais dans un jeu de chat et de souris, le leurre peut faire toute la difference.",
          en: "You take a flash grenade and a portable noise generator. Decoys, not weapons.",
        },
        revealsItems: ['distraction_device'],
      },
    },
  ],
};

const blast_door_partial: ScenarioFeatureDefinition = {
  id: 'blast_door_partial',
  featureType: 'door',
  initialState: 'damaged',
  extraProperties: ['metallic', 'large', 'damaged', 'rigid', 'openable'],
  aliases: {
    fr: ['porte blindee', 'porte', 'porte endommagee', 'blast door'],
    en: ['blast door', 'door', 'damaged door'],
  },
  descriptions: {
    damaged: {
      fr: "Porte blindee coincee a mi-course. Des marques de griffes temoignent d'une force terrifiante. Le mecanisme est bloque.",
      en: "",
    },
    open: {
      fr: "Porte blindee forcee ouverte. Le passage vers le point d'extraction est libre.",
      en: "",
    },
  },
  examineResult: {
    fr: "Porte blindee partiellement ouverte. La creature a force le passage — les marques de griffes temoignent d'une force effrayante.",
    en: "",
  },
  interactions: [
    // Path 1: FOR pure — brute force
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', stat: 'FOR', dc: 13 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Vous agrippez le bord de la porte et poussez de toute votre force. Le mecanisme cede dans un grincement metallique. La porte s'ouvre — de l'autre cote, la baie d'extraction.",
          en: "You grip the door edge and push. The mechanism yields. Beyond — the extraction bay.",
        },
        revealsExit: 'escalation_to_boss',
      },
      onFailure: {
        narrative: {
          fr: "La porte refuse de bouger. Le mecanisme est solidement coince. Le metal vous entaille les mains. Il faudrait un levier, un outil, ou une approche differente.",
          en: "The door won't budge. The metal cuts your hands.",
        },
        consequences: [{ type: 'damage', amount: 1, targetId: 'player' }],
      },
    },
    // Path 2: FOR + salvage_tool — auto success
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', requiredItem: 'salvage_tool', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "L'outil de recuperation fait levier. Le mecanisme cede. La porte blindee coulisse — la baie d'extraction s'ouvre devant vous.",
          en: "The salvage tool levers the mechanism. The door slides open.",
        },
        revealsExit: 'escalation_to_boss',
        flagSet: 'blast_door_widened',
      },
    },
    // Path 3: INT — repair the mechanism
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 11 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Vous trouvez le mecanisme coince et realignez les rails. La porte coulisse — lentement, mais suffisamment.",
          en: "You find the jammed mechanism and realign the rails. The door slides open.",
        },
        revealsExit: 'escalation_to_boss',
      },
      onFailure: {
        narrative: {
          fr: "Le mecanisme est trop endommage pour une reparation rapide. Les rails sont desalignes a un angle impossible.",
          en: "The mechanism is too damaged for a quick repair.",
        },
      },
    },
  ],
};

// =====================================================================
// FEATURES — BOSS node
// =====================================================================

const shuttle_hatch: ScenarioFeatureDefinition = {
  id: 'shuttle_hatch',
  featureType: 'door',
  initialState: 'open',
  extraProperties: ['metallic', 'large'],
  aliases: {
    fr: ['ecoutille', 'navette', 'sas navette', 'hatch'],
    en: ['hatch', 'shuttle', 'shuttle hatch'],
  },
  descriptions: {
    open: {
      fr: "L'ecoutille de la navette d'evacuation. Le systeme est fonctionnel — la navette peut decoller des que tout le monde est a bord. Ou des que vous decidez qui monte.",
      en: "",
    },
  },
  examineResult: {
    fr: "L'ecoutille de la navette d'evacuation. Le systeme est fonctionnel — la navette peut decoller des que tout le monde est a bord.",
    en: "",
  },
  interactions: [
    // PRIMARY VICTORY: enter shuttle WITH escort active
    {
      trigger: { verb: 'MOVE_TO', requiredFlag: 'escort_active', dc: null },
      onSuccess: {
        narrative: {
          fr: "Vous aidez la Dr. Okonkwo a monter dans la navette. Elle s'accroche a vous, epuisee mais vivante. 'Merci', murmure-t-elle. Vous lancez le decollage.",
          en: "You help Dr. Okonkwo into the shuttle. 'Thank you,' she whispers. You launch.",
        },
        consequences: [
          { type: 'npc_relocate', npcId: 'dr_okonkwo', locationId: 'resolution' },
        ],
        flagSet: 'both_in_shuttle',
        revealsExit: 'boss_to_resolution',
      },
    },
    // ALTERNATIVE VICTORY: enter WITHOUT escort (dark choice)
    {
      trigger: { verb: 'MOVE_TO', dc: null },
      onSuccess: {
        narrative: {
          fr: "Vous montez dans la navette. Seul. Derriere vous, la Dr. Okonkwo vous regarde, incredule. 'Non... non, attendez !' Vous fermez l'ecoutille. Le moteur rugit.",
          en: "You board the shuttle. Alone. 'No... wait!' Her face disappears behind the glass.",
        },
        flagSet: 'okonkwo_abandoned',
        revealsExit: 'boss_to_resolution',
      },
    },
    // USE OKONKWO AS BAIT (very dark choice — CHA DC14 to manipulate)
    {
      trigger: { verb: ['USE', 'SACRIFICE'], requiredFlag: 'escort_active', stat: 'CHA', dc: 14 },
      onSuccess: {
        narrative: {
          fr: "\"Docteur, il faut distraire la creature. C'est vous qu'elle veut.\" Le visage d'Okonkwo se decompose. La comprehension, puis la resignation. \"Je l'ai creee. C'est ma responsabilite.\" Elle s'avance vers l'ombre, boitant.",
          en: "\"Doctor, the creature wants you.\" Her face crumbles. Understanding, then resignation. She limps toward the shadow.",
        },
        flagSet: 'okonkwo_used_as_bait',
        consequences: [
          { type: 'npc_relocate', npcId: 'dr_okonkwo', locationId: 'escalation' },
        ],
        flagUnset: 'escort_active',
      },
      onFailure: {
        narrative: {
          fr: "\"Non. NON ! Je refuse de mourir pour vos lachetees !\" Okonkwo recule, terrifiee. La manipulation a echoue — elle ne se sacrifiera pas volontairement.",
          en: "\"No. NO! I refuse to die for your cowardice!\" Okonkwo recoils. The manipulation failed.",
        },
      },
    },
  ],
};

const acoustic_trap_point: ScenarioFeatureDefinition = {
  id: 'acoustic_trap_point',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['reflective'],
  aliases: {
    fr: ['piege', 'piege acoustique', 'point piege', 'piege sonique'],
    en: ['trap', 'acoustic trap', 'trap point', 'sonic trap'],
  },
  descriptions: {
    intact: {
      fr: "Point ideal pour un piege acoustique. La geometrie concentre les ondes sonores comme un amplificateur naturel.",
      en: "",
    },
    activated: {
      fr: "Le piege acoustique est actif. Un mur de son invisible confine la creature. Piegee.",
      en: "",
    },
  },
  examineResult: {
    fr: "Point ideal pour un piege acoustique. La geometrie de la zone concentrerait les ondes sonores comme un amplificateur naturel.",
    en: "",
  },
  interactions: [
    // USE sonic emitter with acoustic_info_received flag
    {
      trigger: { verb: 'USE', requiredItem: 'sonic_emitter_component', requiredFlag: 'acoustic_info_received', dc: null },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: "Vous fixez le composant au point optimal. Activation. Le son explose — inaudible pour vous, apocalyptique pour la creature. Les murs acoustiques amplifient le signal x100. Une cage de son invisible. Confinee. Neutralisee. Pour toujours.",
          en: "You attach the component to the optimal point. Activation. Sound explodes. The creature is trapped.",
        },
        flagSet: 'creature_contained',
        consumeItem: true,
      },
    },
    // USE sonic emitter with project_hunter_read flag (alternative path — read the research)
    {
      trigger: { verb: 'USE', requiredItem: 'sonic_emitter_component', requiredFlag: 'project_hunter_read', dc: null },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: "Les notes de recherche vous ont appris la frequence exacte. Vous fixez le composant et calibrez l'emetteur. Le son explose — les murs acoustiques amplifient le signal x100. Une cage de resonance infranchissable. La creature est piegee. Pour toujours.",
          en: "The research notes taught you the exact frequency. You attach the component. The creature is trapped forever.",
        },
        flagSet: 'creature_contained',
        consumeItem: true,
      },
    },
    {
      trigger: { verb: 'EXAMINE', dc: null },
      onSuccess: {
        narrative: {
          fr: "La geometrie est parfaite — les murs forment un entonnoir acoustique naturel. Un emetteur sonique place ici creerait une zone de resonance infranchissable pour une creature sensible aux hautes frequences.",
          en: "Perfect geometry — a natural acoustic funnel.",
        },
      },
    },
  ],
};

const extraction_bay_door: ScenarioFeatureDefinition = {
  id: 'extraction_bay_door',
  featureType: 'door',
  initialState: 'damaged',
  extraProperties: ['metallic', 'large', 'damaged', 'easily_repairable'],
  aliases: {
    fr: ['porte extraction', 'porte baie', 'baie extraction'],
    en: ['bay door', 'extraction door'],
  },
  descriptions: {
    damaged: {
      fr: "Porte de la baie d'extraction. Le mecanisme est endommage — la porte est entrouverte mais pas assez pour passer.",
      en: "",
    },
    open: {
      fr: "Porte de la baie ouverte. La navette attend de l'autre cote.",
      en: "",
    },
  },
  examineResult: {
    fr: "Porte de la baie d'extraction. Le mecanisme est endommage mais reparable.",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 11 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Vous reconnectez le circuit hydraulique. La porte s'ouvre dans un sifflement pneumatique. La navette est la — le cockpit allume, les moteurs en veille.",
          en: "You reconnect the hydraulic circuit. The door opens with a pneumatic hiss.",
        },
        flagSet: 'extraction_door_opened',
      },
    },
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', stat: 'FOR', dc: 14 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Vous forcez la porte. Le mecanisme grince, proteste, puis cede. La navette d'extraction est enfin accessible.",
          en: "You force the door. The extraction shuttle is finally accessible.",
        },
        flagSet: 'extraction_door_opened',
      },
    },
    // Path 3: PER — find maintenance bypass
    {
      trigger: { verb: 'EXAMINE', requiredState: 'damaged', stat: 'PER', dc: 10 },
      onSuccess: {
        narrative: {
          fr: "Vous reperez un panneau de maintenance sur le cote. Les cables hydrauliques sont accessibles — un simple recablage et la porte devrait s'ouvrir.",
          en: "You spot a maintenance panel on the side. The hydraulic cables are accessible.",
        },
        flagSet: 'bay_door_bypass_found',
      },
    },
    // Path 3b: auto-REPAIR after finding bypass
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', requiredFlag: 'bay_door_bypass_found', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Le recablage fonctionne. La porte s'ouvre silencieusement — presque trop facilement.",
          en: "The rewiring works. The door opens silently.",
        },
        flagSet: 'extraction_door_opened',
      },
    },
  ],
};

// =====================================================================
// FEATURES — RESOLUTION node
// =====================================================================

const shuttle_cockpit: ScenarioFeatureDefinition = {
  id: 'shuttle_cockpit',
  featureType: 'terminal',
  initialState: 'active',
  decorative: true,
  aliases: {
    fr: ['cockpit', 'poste pilotage', 'commandes'],
    en: ['cockpit', 'controls'],
  },
  descriptions: {
    active: {
      fr: "Le cockpit de la navette d'evacuation. Systemes en ligne, moteurs prets. L'ecran affiche les coordonnees de retour vers la flotte. Un seul bouton : DECOLLAGE. Ce qui s'est passe — qui est monte, qui est reste — depend entierement de vos choix.",
      en: "",
    },
  },
  examineResult: {
    fr: "Le cockpit de la navette d'evacuation. Les systemes sont en ligne, les moteurs prets pour le decollage.",
    en: "",
  },
  interactions: [
    // ACTIVATE with escort — best ending (saved Okonkwo)
    {
      trigger: { verb: 'ACTIVATE', requiredFlag: 'both_in_shuttle', dc: null },
      onSuccess: {
        narrative: {
          fr: "Vous appuyez sur DECOLLAGE. La Dr. Okonkwo s'agrippe au siege copilote. Les moteurs rugissent. La station s'eloigne — avec ses secrets, ses monstres. Mais pas ses survivants. Pas cette fois.",
          en: "You press LAUNCH. Dr. Okonkwo grips the copilot seat. The station falls away — with its secrets, its monsters. But not its survivors. Not this time.",
        },
      },
    },
    // ACTIVATE with creature_contained — emergent victory (saved everyone, trapped creature)
    {
      trigger: { verb: 'ACTIVATE', requiredFlag: 'creature_contained', dc: null },
      onSuccess: {
        narrative: {
          fr: "Vous appuyez sur DECOLLAGE. La creature est confinee — le piege acoustique la retiendra pour toujours. La Dr. Okonkwo regarde la station s'eloigner. \"C'est fini\", murmure-t-elle. Pour la premiere fois, elle semble le croire.",
          en: "You press LAUNCH. The creature is trapped forever. 'It's over,' Okonkwo whispers.",
        },
      },
    },
    // ACTIVATE alone (abandoned Okonkwo) — dark ending
    {
      trigger: { verb: 'ACTIVATE', requiredFlag: 'okonkwo_abandoned', dc: null },
      onSuccess: {
        narrative: {
          fr: "Vous appuyez sur DECOLLAGE. Seul dans le cockpit. La station s'eloigne. Quelque part en bas, une femme que vous avez laissee derriere hurle peut-etre encore. Vous ne le saurez jamais.",
          en: "You press LAUNCH. Alone. Somewhere below, a woman you left behind may still be screaming. You'll never know.",
        },
      },
    },
    // ACTIVATE with bait used — darkest ending
    {
      trigger: { verb: 'ACTIVATE', requiredFlag: 'okonkwo_used_as_bait', dc: null },
      onSuccess: {
        narrative: {
          fr: "Vous appuyez sur DECOLLAGE. La Dr. Okonkwo a attire la creature — son sacrifice vous a ouvert la route. Les moteurs rugissent. La station s'eloigne. Vous etes vivant. C'est ce qui compte. N'est-ce pas ?",
          en: "You press LAUNCH. Dr. Okonkwo drew the creature away — her sacrifice cleared your path. You're alive. That's what matters. Isn't it?",
        },
      },
    },
    // ACTIVATE with backup beacon active — additional narrative flavor
    {
      trigger: { verb: 'ACTIVATE', requiredFlag: 'backup_beacon_active', dc: null },
      onSuccess: {
        narrative: {
          fr: "Vous appuyez sur DECOLLAGE. Les moteurs rugissent. En arriere-plan, le signal de la balise pulse — des secours arriveront peut-etre. La station s'eloigne en dessous, avec ses secrets, ses monstres.",
          en: "You press LAUNCH. The backup beacon pulses — help may come. The station falls away below.",
        },
      },
    },
    // ACTIVATE default fallback
    {
      trigger: { verb: 'ACTIVATE', dc: null },
      onSuccess: {
        narrative: {
          fr: "Vous appuyez sur DECOLLAGE. Les moteurs rugissent. La station s'eloigne en dessous — avec ses secrets, ses monstres, ses morts.",
          en: "You press LAUNCH. The engines roar. The station falls away below.",
        },
      },
    },
  ],
};


// ---------------------------------------------------------------------------
// Lore Pool — 15 fragments for lore micro-modules
// ---------------------------------------------------------------------------

const RESCUE_LORE_POOL: readonly LoreFragment[] = [
  {
    id: 'res_lore_expedition_log',
    text: ls('Journal d\'expédition, Dr. Okonkwo : "Les ruines sont plus anciennes que prévu — au moins 50 000 ans. La structure est organique. Elle semble... croître."'),
    compatibleSupports: ['data_terminal', 'physical_document'],
    validBeats: ['intro', 'rising'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_alien_builders',
    text: ls('Les glyphes racontent l\'histoire des Bâtisseurs : une espèce qui a fusionné biologie et architecture. Leurs structures ne sont pas construites — elles sont cultivées.'),
    compatibleSupports: ['environmental_trace'],
    validBeats: ['rising', 'midpoint'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_entity_origin',
    text: ls('Les inscriptions décrivent une "Présence" scellée au cœur de la structure. Les Bâtisseurs l\'ont emprisonnée ici il y a des millénaires. Les sceaux s\'affaiblissent.'),
    compatibleSupports: ['environmental_trace', 'data_terminal'],
    validBeats: ['midpoint', 'escalation'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_crystal_resonance',
    text: ls('Les cristaux résonnent à une fréquence que les instruments humains ne peuvent pas mesurer. Quand deux cristaux sont proches, ils "chantent" ensemble. L\'effet est... hypnotique.'),
    compatibleSupports: ['environmental_trace'],
    validBeats: ['rising', 'midpoint'],
    feedsBlackBox: false,
  },
  {
    id: 'res_lore_missing_team',
    text: ls('Dernier message de l\'équipe Gamma : "La structure a changé de configuration pendant la nuit. Le passage de retour n\'existe plus. On continue en avant. Envoyez de l\'aide."'),
    compatibleSupports: ['data_terminal'],
    validBeats: ['rising', 'midpoint'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_absorbed_explorer',
    text: ls('Un visage humain émerge du mur organique, figé dans une expression de surprise. Les yeux semblent suivre votre mouvement. La paroi pulse autour du visage — elle le digère lentement.'),
    compatibleSupports: ['environmental_trace'],
    validBeats: ['escalation', 'climax'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_gravity_research',
    text: ls('Notes de terrain : "Les puits de gravité ne sont pas naturels. Ils sont des organes de la structure — comme des cœurs qui pompent la gravité au lieu du sang. Fascinant et terrifiant."'),
    compatibleSupports: ['physical_document', 'data_terminal'],
    validBeats: ['midpoint', 'escalation'],
    feedsBlackBox: false,
  },
  {
    id: 'res_lore_psionic_interference',
    text: ls('"Jour 8 — Tout le monde fait le même rêve : un œil immense qui nous observe depuis le centre de la structure. Dr. Okonkwo dit que c\'est l\'interférence psionique. Elle a peur."'),
    compatibleSupports: ['physical_document', 'npc_testimony'],
    validBeats: ['midpoint', 'escalation'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_organic_growth_study',
    text: ls('Analyse biologique : la croissance organique est un réseau neural. Chaque filament est un neurone. La structure entière est un cerveau — et il est en train de se réveiller.'),
    compatibleSupports: ['data_terminal'],
    validBeats: ['escalation', 'climax'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_rescue_beacon',
    text: ls('La balise de détresse du Dr. Okonkwo émet depuis le cœur de la structure. Le signal est stable mais présente des modulations étranges — comme si la structure le relayait volontairement.'),
    compatibleSupports: ['data_terminal'],
    validBeats: ['rising', 'midpoint'],
    feedsBlackBox: false,
  },
  {
    id: 'res_lore_builder_warning',
    text: ls('Un glyphe massif traduit par l\'IA du vaisseau : "CE QUI DORT ICI NE DOIT PAS ÊTRE RÉVEILLÉ. SI VOUS LISEZ CECI, IL EST DÉJÀ TROP TARD. COUREZ."'),
    compatibleSupports: ['environmental_trace'],
    validBeats: ['escalation', 'climax'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_okonkwo_research',
    text: ls('Dr. Okonkwo, rapport audio : "La Présence communique par les cristaux. Elle n\'est pas hostile — elle est seule. Depuis 50 000 ans. Elle veut juste... parler. Mais son langage nous brise."'),
    compatibleSupports: ['data_terminal', 'npc_testimony'],
    validBeats: ['escalation'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_cocoon_analysis',
    text: ls('Analyse du cocon : l\'organisme à l\'intérieur est en cours de transformation. ADN humain mêlé à des séquences inconnues. Le sujet est vivant — son rythme cardiaque est régulier.'),
    compatibleSupports: ['data_terminal', 'environmental_trace'],
    validBeats: ['midpoint', 'escalation'],
    feedsBlackBox: true,
  },
  {
    id: 'res_lore_ancient_tech',
    text: ls('La technologie alien n\'utilise ni électricité ni mécanique. Tout fonctionne par résonance cristalline — des vibrations à des fréquences précises activent les systèmes. Comme de la musique.'),
    compatibleSupports: ['environmental_trace', 'data_terminal'],
    validBeats: ['rising', 'midpoint'],
    feedsBlackBox: false,
  },
  {
    id: 'res_lore_final_seal',
    text: ls('Le dernier sceau des Bâtisseurs est intact — mais il émet une lueur de plus en plus faible. À ce rythme, il cédera dans les prochaines heures. Ce qu\'il retient n\'a pas de nom dans nos langues.'),
    compatibleSupports: ['environmental_trace'],
    validBeats: ['escalation', 'climax'],
    feedsBlackBox: true,
  },
];


// =====================================================================
// SKELETON DEFINITION
// =====================================================================

export const RESCUE_SKELETON: CoreSkeleton = {
  id: 'rescue',
  nameKey: { fr: 'Dernier Signal', en: 'Last Signal' },
  descriptionKey: {
    fr: 'Station Orbitale Calypso — le signal de detresse pulse depuis 72 heures. Votre navette s\'est ecrasee a l\'approche, la coque percee. Quelqu\'un est encore en vie la-dedans — la Dr. Okonkwo, chercheuse principale du Projet Chasseur. Mais quelque chose d\'autre vit aussi dans ces couloirs. Quelque chose qui chasse. Trouvez la survivante. Stabilisez-la. Sortez-la de la. Avant que le chasseur ne vous trouve tous les deux.',
    en: 'Orbital Station Calypso — the distress signal has been pulsing for 72 hours. Your shuttle crashed on approach. Someone is still alive — Dr. Okonkwo, lead researcher on Project Hunter. But something else lives in those corridors. Something that hunts.',
  },

  nodes: [
    {
      id: 'start',
      role: 'entry',
      beat: 'intro',
      tension: 2,
      descriptionKey: {
        fr: 'Site de Crash. Votre navette s\'est ecrasee contre le dock d\'amarrage de la Station Calypso. La coque est percee, le cockpit deforme au-dela de toute reparation. De la fumee s\'echappe des circuits brules. La soute arriere contient peut-etre du materiel recuperable. Un signal de detresse pulse depuis les profondeurs de la station — regulier, insistant. Quelqu\'un est vivant la-dedans.',
        en: 'Crash Site — Your shuttle crashed into Station Calypso\'s docking bay. Hull breached, cockpit destroyed. A distress signal pulses from deeper inside.',
      },
    },
    {
      id: 'unlock',
      role: 'gate',
      beat: 'rising',
      tension: 4,
      descriptionKey: {
        fr: 'Point de Triage. Zone medicale devastee — civieres renversees, materiel chirurgical eparpille. Le couloir principal s\'est effondre sous le poids des poutres — des tonnes de metal bloquent le passage. Le signal de detresse est plus fort ici, juste de l\'autre cote. Une trappe de maintenance est visible au ras du sol. Un rack contient un decoupeur plasma industriel — puissant, mais le bruit attirerait l\'attention.',
        en: 'Triage Point — Devastated medical zone. The main corridor collapsed. The distress signal is stronger here — just on the other side.',
      },
    },
    {
      id: 'reveal',
      role: 'midpoint',
      beat: 'midpoint',
      tension: 6,
      descriptionKey: {
        fr: 'Laboratoire de la Dr. Okonkwo. Une barricade methodique bloque l\'entree — mobilier soude, plaques d\'acier. Derriere, une femme. Blessee. Consciente. Le terminal de recherche clignote a cote d\'elle, affichant des donnees fragmentaires du Projet Chasseur. Des rations vides indiquent qu\'elle survit ici depuis au moins 48 heures. Le chemin de sortie passe par le territoire de chasse de la creature.',
        en: 'Dr. Okonkwo\'s Lab — A methodical barricade blocks the entrance. Behind it, a wounded woman. The research terminal flickers with Project Hunter data.',
      },
    },
    {
      id: 'escalation',
      role: 'escalation',
      beat: 'escalation',
      tension: 8,
      descriptionKey: {
        fr: 'Zone de Traque. Les couloirs sont plus etroits ici — visibilite reduite, recoins sombres, points d\'embuscade. L\'air est plus mince. Les parois sont recouvertes de panneaux acoustiques — vestiges du laboratoire d\'Okonkwo. Un rack de diversion contient des grenades flash. Une porte blindee partiellement ouverte bloque le passage vers la baie d\'extraction. Des griffures profondes sur la porte — la creature est passee par la.',
        en: 'The Hunt Zone — Narrow corridors, reduced visibility, ambush points. Acoustic panels line the walls. A blast door blocks the way to extraction.',
      },
    },
    {
      id: 'boss',
      role: 'climax',
      beat: 'climax',
      tension: 10,
      descriptionKey: {
        fr: 'Baie d\'Extraction. La navette de secours est la — cabossee mais fonctionnelle, l\'ecoutille ouverte, les moteurs en veille. La liberte est a portee de main. Mais la creature se dresse entre vous et la navette. Biomasse sombre, griffes d\'acier, yeux trop intelligents. La geometrie de la baie forme un entonnoir acoustique naturel — un detail qui pourrait tout changer si vous avez les bons outils. Un choix impossible s\'impose.',
        en: 'Extraction Bay — The rescue shuttle is here. But the creature stands between you and freedom. An impossible choice looms.',
      },
    },
    {
      id: 'resolution',
      role: 'epilogue',
      beat: 'resolution',
      tension: 3,
      descriptionKey: {
        fr: 'Le cockpit de la navette d\'evacuation. Systemes en ligne, moteurs prets. L\'ecran affiche les coordonnees de retour vers la flotte. Un seul bouton : DECOLLAGE. Ce qui s\'est passe ensuite — qui est monte, qui est reste, ce qui est arrive a la creature — depend entierement de vos choix.',
        en: 'The evacuation shuttle cockpit. Systems online. One button: LAUNCH. What happens next depends entirely on your choices.',
      },
    },
  ],

  gateItem: 'medical_stabilizer',
  gateItemLocation: 'start',

  revelation: {
    fr: 'La Dr. Okonkwo n\'est pas une victime innocente — elle est la creatrice de la chose qui vous chasse. Projet Chasseur : un organisme synthetique a evolution acceleree, concu comme arme biologique. Elle connait sa faiblesse — les hautes frequences entre 15 et 20 kHz la desorientent, au-dessus de 20 kHz elle souffre. Mais la creature apprend. Elle s\'adapte aux stimuli repetes en 3 a 5 expositions. Okonkwo porte le poids de 47 morts sur les epaules. Sa culpabilite est votre meilleur atout — elle fera tout pour expier.',
    en: 'Dr. Okonkwo is not an innocent victim — she created the thing hunting you. Project Hunter: a synthetic organism designed as a bioweapon. She knows its weakness: high frequencies. But the creature learns.',
  },
  escalationTrigger: {
    fr: 'L\'escorte change tout. La Dr. Okonkwo peut marcher, mais lentement — chaque deplacement prend deux fois plus de temps. Le sang sur ses bandages laisse une piste olfactive que la creature suit comme un fil d\'Ariane. Vous l\'entendez maintenant — des griffes sur le metal, toujours un couloir derriere vous. Elle ne fonce plus aveuglement. Elle chasse. Elle apprend vos habitudes.',
    en: 'The escort changes everything. Dr. Okonkwo can walk, but slowly. Blood on her bandages leaves a scent trail. You hear it now — claws on metal, always one corridor behind.',
  },

  bossType: 'choice',

  primaryVictory: {
    type: 'escort_alive',
    npcId: 'dr_okonkwo',
    locationId: 'resolution',
  },
  alternativeVictory: {
    type: 'reach_location',
    locationId: 'resolution',
  },
  emergentVictoryHint: {
    fr: 'Le composant d\'emetteur sonique haute frequence, place au point de piege acoustique dans la baie d\'extraction, creerait une cage de resonance infranchissable pour la creature. Les parois acoustiques du laboratoire d\'Okonkwo amplifient le signal par un facteur 100. Il faut avoir compris la faiblesse sonore (via Okonkwo ou le terminal de recherche) ET avoir conserve le composant sans l\'utiliser sur la creature ou la balise. Le piege est permanent.',
    en: 'The sonic emitter component, placed at the acoustic trap point in the extraction bay, would create an impassable resonance cage. You need to have learned the sonic weakness AND kept the component unused.',
  },

  nodeLocations: {
    start: {
      locationRole: 'dead_end',
      items: [first_aid_kit, medical_stabilizer, salvage_tool],
      features: [crashed_shuttle, hull_breach, salvageable_parts, emergency_beacon_broken],
      exits: ['unlock'],
    },
    unlock: {
      locationRole: 'medical',
      items: [plasma_cutter],
      features: [collapsed_corridor, maintenance_detour_hatch, plasma_cutter_rack],
      exits: ['start', 'reveal'],
    },
    reveal: {
      locationRole: 'medical',
      items: [research_notes, sonic_emitter_component],
      npcs: [
        {
          id: 'dr_okonkwo',
          disposition: 'cooperative',
          hpOverride: 4,
          talkSuccess: {
            fr: '"Merci d\'etre venu. Je suis la Dr. Okonkwo — chercheuse principale. C\'est ma creature. Mon experience. Je sais, c\'est ma faute. Mais je connais sa faiblesse : les hautes frequences. Le son la desoriente. Il y a un composant d\'emetteur sonique dans mon labo. Utilisez-le. Et par pitie, sortez-moi d\'ici."',
            en: '',
          },
          talkFailure: {
            fr: 'La Dr. Okonkwo vous regarde avec mefiance. "Qui etes-vous ? Comment puis-je savoir que vous n\'etes pas envoye par la corporation pour me faire taire ?" Elle se recroqueville derriere sa barricade.',
            en: '',
          },
        },
      ],
      features: [survivor_barricade, research_terminal],
      exits: ['unlock', 'escalation'],
    },
    escalation: {
      locationRole: 'passage',
      atmosphere: 'low_oxygen',
      items: [distraction_device],
      npcs: [
        {
          id: 'creature_hunter',
          disposition: 'hostile',
          talkSuccess: {
            fr: 'La creature reagit a votre voix — un fremissement parcourt son corps. Elle hesite, inclinant la tete. Un instant de repit.',
            en: '',
          },
          talkFailure: {
            fr: 'Un grondement sourd est la seule reponse. La creature bondit en avant, toutes griffes dehors.',
            en: '',
          },
        },
      ],
      features: [acoustic_walls, distraction_rack, blast_door_partial],
      exits: ['reveal', 'boss'],
    },
    boss: {
      locationRole: 'airlock',
      items: [],
      npcs: [
        {
          id: 'creature_hunter',
          disposition: 'hostile',
          talkSuccess: {
            fr: 'La creature vous fixe, respirant lourdement. Votre voix a declenche quelque chose — un souvenir du labo, peut-etre. Elle hesite.',
            en: '',
          },
          talkFailure: {
            fr: 'La creature rugit, rejetant toute tentative de communication. Ses yeux sont fixes sur la Dr. Okonkwo derriere vous.',
            en: '',
          },
        },
      ],
      features: [shuttle_hatch, acoustic_trap_point, extraction_bay_door],
      exits: ['escalation', 'resolution'],
    },
    resolution: {
      locationRole: 'hub',
      items: [],
      features: [shuttle_cockpit],
      exits: ['boss'],
    },
  },

  additionalDefeatConditions: [
    { type: 'npc_death', npcId: 'dr_okonkwo' },
  ],

  theme: {
    id: 'alien_ruins',
    nameKey: { fr: 'Ruines Extraterrestres', en: 'Alien Ruins' },
    supportedRoles: [
      'passage', 'control_room', 'hub', 'dead_end', 'hazard_zone',
      'ritual_chamber', 'organic_growth', 'crystal_cave', 'gravity_well',
      'medical', 'airlock',
    ],
    locationNames: {
      passage: [
        ls('Tunnel organique'), ls('Couloir de spores'), ls('Passage de cristaux'),
        ls('Tunnel de bioluminescence'), ls('Couloir extraterrestre'), ls('Passage de membranes'),
        ls('Tunnel de lianes'), ls('Couloir de pulsations'), ls('Passage de filaments'),
        ls('Tunnel de sang noir'), ls('Couloir de nervures'), ls('Passage de spires'),
        ls('Tunnel de mycètes'), ls('Couloir de résine'), ls('Passage de cheiropodes'),
        ls('Tunnel de membranes pulsantes'), ls('Couloir de chairs'), ls('Passage de cristaux noirs'),
        ls('Tunnel d\'ossements'), ls('Couloir de plaques'), ls('Passage de spores denses'),
        ls('Tunnel de biovaisseaux'),
      ],
      control_room: [
        ls('Nexus de contrôle'), ls('Chambre de commandement extraterrestre'), ls('Nexus de pulsation'),
        ls('Salle du grand nexus'), ls('Centre de contrôle alien'), ls('Nexus de distribution'),
        ls('Chambre de relais'), ls('Nexus de communication'), ls('Centre de pulsation principale'),
        ls('Chambre de gouvernance'), ls('Nexus d\'énergie primaire'), ls('Salle de contrôle des flux'),
        ls('Chambre de commandement suprême'), ls('Nexus de fusion'), ls('Centre de calcul alien'),
        ls('Chambre de l\'entité'), ls('Nexus de contrôle secondaire'), ls('Salle de navigation alien'),
        ls('Centre de coordination psionique'), ls('Nexus de transmission'),
        ls('Chambre de la conscience'), ls('Nexus de l\'ancienne technologie'),
      ],
      hub: [
        ls('Chambre centrale'), ls('Carrefour alien'), ls('Nœud de distribution'),
        ls('Chambre de jonction'), ls('Centre de convergence'), ls('Carrefour des tunnels'),
        ls('Chambre de bifurcation'), ls('Nœud central'), ls('Centre de croisement'),
        ls('Carrefour de cristaux'), ls('Chambre d\'intersection'), ls('Nœud de dispersion'),
        ls('Centre de la ruche'), ls('Carrefour de membranes'), ls('Chambre de communication'),
        ls('Nœud de coordination'), ls('Centre biologique'), ls('Carrefour de spores'),
        ls('Chambre de convergence'), ls('Nœud central de la ruche'), ls('Carrefour des flux'),
        ls('Chambre de distribution alien'),
      ],
      dead_end: [
        ls('Alcôve cristalline'), ls('Impasse organique'), ls('Chambre aveugle'),
        ls('Alcôve de cristaux noirs'), ls('Impasse de membranes'), ls('Chambre dormante'),
        ls('Alcôve de spores'), ls('Impasse de filaments'), ls('Chambre d\'incubation'),
        ls('Alcôve pulsante'), ls('Impasse de chair'), ls('Chambre de gestation'),
        ls('Alcôve de bioluminescence'), ls('Impasse de cristaux'), ls('Chambre d\'absorption'),
        ls('Alcôve de mycorhizes'), ls('Impasse de résine'), ls('Chambre de stockage biologique'),
        ls('Alcôve de capsules'), ls('Impasse de membranes dormantes'),
        ls('Alcôve de cristaux de mémoire'), ls('Chambre d\'œufs'),
      ],
      hazard_zone: [
        ls('Puits gravitationnel'), ls('Zone de distorsion gravitationnelle'), ls('Puits de gravité aberrante'),
        ls('Chambre de flux gravitationnel'), ls('Zone de singularité'), ls('Puits de compression'),
        ls('Zone de déchirement spatial'), ls('Chambre de vide gravitationnel'), ls('Puits de torsion'),
        ls('Zone de gravité inversée'), ls('Puits de collapse'), ls('Zone de trou noir localisé'),
        ls('Chambre de pesanteur nulle'), ls('Puits d\'énergie sombre'), ls('Zone de flux incontrôlé'),
        ls('Chambre de déchirement temporel'), ls('Puits de radiation alien'), ls('Zone de dissolution matière'),
        ls('Chambre de singularité locale'), ls('Puits de néant'), ls('Zone de gravité variable'),
        ls('Puits d\'énergie alien'),
      ],
      ritual_chamber: [
        ls('Sanctuaire principal'), ls('Chambre rituelle'), ls('Sanctuaire de la ruche'),
        ls('Chambre de cérémonie'), ls('Sanctuaire alien primordial'), ls('Chambre de pulsation sacrée'),
        ls('Sanctuaire du grand œil'), ls('Chambre de communion'), ls('Sanctuaire de transformation'),
        ls('Chambre de l\'entité centrale'), ls('Sanctuaire de chair et de cristal'),
        ls('Chambre de vénération'), ls('Sanctuaire de mémoire alien'), ls('Chambre du sacrifice'),
        ls('Sanctuaire de cristaux vivants'), ls('Chambre de la conscience collective'),
        ls('Sanctuaire de l\'embryon'), ls('Chambre de régénération'), ls('Sanctuaire des anciens'),
        ls('Chambre de la reine'), ls('Sanctuaire de l\'éveil'), ls('Chambre d\'invocation'),
      ],
      organic_growth: [
        ls('Zone organique principale'), ls('Chambre de prolifération'), ls('Zone de croissance biologique'),
        ls('Masse de chairs pulsantes'), ls('Zone de prolifération mycologique'),
        ls('Chambre d\'expansion organique'), ls('Zone de tissus vivants'), ls('Masse de spores géantes'),
        ls('Zone de racines pulsantes'), ls('Chambre de progression biologique'),
        ls('Zone de membranes épaisses'), ls('Masse de filaments'), ls('Zone de pulsations biologiques'),
        ls('Chambre de croissance rapide'), ls('Zone de nodules vivants'), ls('Masse d\'organismes coloniaux'),
        ls('Zone de transformation biologique'), ls('Chambre de matière vivante'),
        ls('Zone de prolifération cellulaire'), ls('Masse d\'organismes entrelacés'),
        ls('Zone de chair active'), ls('Chambre de croissance exponentielle'),
      ],
      crystal_cave: [
        ls('Grotte cristalline'), ls('Caverne de cristaux noirs'), ls('Grotte de formation minérale alien'),
        ls('Caverne de géodes vivants'), ls('Grotte de cristaux pulsants'), ls('Caverne de cristaux translucides'),
        ls('Grotte de formations étranges'), ls('Caverne de cristaux lumineux'), ls('Grotte de formations inconnues'),
        ls('Caverne de cristaux géants'), ls('Grotte de cristaux de plasma'), ls('Caverne de structures cristallines'),
        ls('Grotte de formations minérales vivantes'), ls('Caverne de cristaux de mémoire'),
        ls('Grotte de formations de lumière'), ls('Caverne de cristaux sonar'),
        ls('Grotte de cristaux fractals'), ls('Caverne de formations prismatiques'),
        ls('Grotte de cristaux temporels'), ls('Caverne de cristaux dormants'),
        ls('Grotte de cristaux harmoniques'), ls('Caverne de cristaux vivants'),
      ],
      gravity_well: [
        ls('Puits de gravité central'), ls('Chambre de gravité aberrante'), ls('Puits de singularité locale'),
        ls('Zone de distorsion gravitationnelle intense'), ls('Puits de compression spatiale'),
        ls('Chambre de gravité inversée'), ls('Puits d\'attraction centrale'),
        ls('Zone de déchirement gravitationnel'), ls('Puits de force locale'),
        ls('Chambre de flux gravitationnel concentré'), ls('Puits d\'énergie sombre'),
        ls('Zone de gradient gravitationnel'), ls('Puits de torsion espace-temps'),
        ls('Chambre de singularité résiduelle'), ls('Puits de néant gravitationnel'),
        ls('Zone d\'écrasement spatial'), ls('Puits de condensation gravitationnelle'),
        ls('Chambre de vortex'), ls('Puits de champ de gravité alien'), ls('Zone de gravité variable'),
        ls('Puits de singularité en formation'), ls('Chambre de distorsion focalisée'),
      ],
      medical: [
        ls('Chambre de régénération'), ls('Alcôve de soins organiques'), ls('Bassin de guérison'),
        ls('Cocon de restauration'), ls('Chambre de symbiose médicale'), ls('Nid de cicatrisation'),
        ls('Cavité de régénération cellulaire'), ls('Chambre de fluides curatifs'),
        ls('Bassin de spores médicinales'), ls('Alcôve de bio-réparation'),
        ls('Chambre de chrysalide'), ls('Cavité de membranes curatives'),
        ls('Bassin de régénération alien'), ls('Chambre de pulsations vitales'),
        ls('Alcôve de restauration biologique'), ls('Nid de soins primitifs'),
        ls('Chambre de culture thérapeutique'), ls('Cavité de fluides régénérants'),
        ls('Bassin de guérison cristalline'), ls('Chambre de métabolisme accéléré'),
        ls('Alcôve de réparation organique'), ls('Nid de chrysalides médicales'),
      ],
      airlock: [
        ls('Sphincter de sortie'), ls('Membrane d\'expulsion'), ls('Orifice de transition'),
        ls('Valve de pressurisation organique'), ls('Sphincter d\'évacuation'),
        ls('Membrane de passage extérieur'), ls('Orifice de décompression'),
        ls('Valve de sortie alien'), ls('Sphincter de transfert'),
        ls('Membrane d\'accès au vide'), ls('Orifice d\'expulsion principal'),
        ls('Valve de séparation atmosphérique'), ls('Sphincter de transit'),
        ls('Membrane de sas organique'), ls('Orifice de sortie secondaire'),
        ls('Valve de décontamination alien'), ls('Sphincter de dépressurisation'),
        ls('Membrane d\'éjection'), ls('Orifice de passage pressurisé'),
        ls('Valve de transition externe'), ls('Sphincter de sortie principal'),
        ls('Membrane de fermeture hermétique'),
      ],
    },
    features: ['crystal_node', 'organic_wall', 'alien_terminal', 'gravity_well', 'bioluminescence', 'psionic_amplifier'],
    preferredItems: ['translator_device', 'void_shard', 'psionic_amplifier', 'ancient_key', 'sonic_emitter', 'research_notes'],
  },

  lorePool: RESCUE_LORE_POOL,
};
