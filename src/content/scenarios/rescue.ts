// ---------------------------------------------------------------------------
// src/content/scenarios/rescue.ts — RESCUE skeleton: "Dernier Signal"
// ---------------------------------------------------------------------------
// Fantasy: Someone is alive in there. Get them out.
// 6 core nodes, gate item: medical_stabilizer, boss type: choice
// Enriched in Chantier 5: features, items, NPCs with full interactions.
// ---------------------------------------------------------------------------

import type { CoreSkeleton, ScenarioFeatureDefinition, ScenarioItemDefinition } from '@engine/scenario';

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
      targetId: 'dr_okonkwo',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: "Vous appliquez les compresses sur ses plaies les plus visibles. Le garrot stoppe un saignement au bras. Ce n'est pas suffisant pour la stabiliser — il faut un stabilisateur medical — mais elle respire un peu mieux.",
            en: "You apply bandages to the worst wounds. Not enough to stabilize, but she breathes a bit easier.",
          },
          consequences: [{ type: 'heal', amount: 2, targetId: 'player' }],
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
          flagSet: 'okonkwo_stabilized',
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
          consequences: [{ type: 'damage', amount: 4, targetId: 'player' }],
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
          consequences: [{ type: 'damage', amount: 3, targetId: 'player' }],
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
      fr: "La soute de la navette est degagee. Les compartiments de rangement sont accessibles. Le moteur principal est definitivement hors service.",
      en: "",
    },
    broken: {
      fr: "L'epave est completement effondree. Plus rien a recuperer.",
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
          fr: "Fouillant les debris du cockpit, vous trouvez un outil de recuperation encore fonctionnel et la boite noire de la navette — intacte. Le compartiment medical reste bloque, mais l'outil pourrait aider.",
          en: "Searching the cockpit debris, you find a salvage tool and the shuttle's black box.",
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
    {
      trigger: { verb: 'EXAMINE', dc: null },
      onSuccess: {
        narrative: {
          fr: "Construction methodique — une scientifique a fait ca, pas un technicien panique. Les plaques sont soudees aux points de stress. Des rations vides indiquent que quelqu'un a survecu ici pendant au moins 48 heures.",
          en: "Methodical construction — a scientist built this, not a panicked tech.",
        },
      },
    },
    {
      trigger: { verb: 'BREAK', stat: 'FOR', dc: 8 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: "Vous demontez la barricade pour recuperer les materiaux. Des plaques metalliques utiles et du cablage. La protection est perdue — mais vous n'en aurez plus besoin si vous bougez vite.",
          en: "You dismantle the barricade for materials.",
        },
        flagSet: 'barricade_dismantled',
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
          fr: "La porte refuse de bouger. Le mecanisme est solidement coince. Il faudrait un levier, un outil, ou une approche differente.",
          en: "The door won't budge.",
        },
      },
    },
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', requiredItem: 'salvage_tool', dc: null },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "L'outil de recuperation fait levier. Le mecanisme cede. La porte blindee coulisse — la baie d'extraction s'ouvre devant vous.",
          en: "The salvage tool levers the mechanism. The door slides open.",
        },
        revealsExit: 'escalation_to_boss',
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
    // USE OKONKWO AS BAIT (very dark choice)
    {
      trigger: { verb: 'USE', requiredFlag: 'escort_active', stat: 'CHA', dc: 0 },
      onSuccess: {
        narrative: {
          fr: "'Docteur, il faut distraire la creature. C'est vous qu'elle veut.' Le visage d'Okonkwo se decompose. Puis, lentement, elle acquiesce. 'Je l'ai creee. C'est... juste.' Elle s'eloigne vers le couloir, boitant.",
          en: "'Doctor, the creature wants you.' Her face crumbles. Then she nods. 'I created it. It's... fair.'",
        },
        flagSet: 'okonkwo_used_as_bait',
        consequences: [
          { type: 'npc_relocate', npcId: 'dr_okonkwo', locationId: 'escalation' },
        ],
        flagUnset: 'escort_active',
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
      fr: "Le cockpit de la navette. Systemes en ligne, moteurs prets. L'ecran affiche les coordonnees de retour vers la flotte. Un bouton : DECOLLAGE.",
      en: "",
    },
  },
  examineResult: {
    fr: "Le cockpit de la navette d'evacuation. Les systemes sont en ligne, les moteurs prets pour le decollage.",
    en: "",
  },
  interactions: [
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

// =====================================================================
// SKELETON DEFINITION
// =====================================================================

export const RESCUE_SKELETON: CoreSkeleton = {
  id: 'rescue',
  nameKey: { fr: 'Dernier Signal', en: 'Last Signal' },
  descriptionKey: {
    fr: 'Un signal de detresse pulse depuis les profondeurs. Quelqu\'un est encore en vie. Allez le chercher.',
    en: 'A distress signal pulses from the depths. Someone is still alive. Go get them.',
  },

  nodes: [
    {
      id: 'start',
      role: 'entry',
      beat: 'intro',
      tension: 2,
      descriptionKey: {
        fr: 'Site de Crash — Votre navette s\'est ecrasee a l\'approche. Coque percee. Un signal de detresse pulse depuis l\'interieur.',
        en: 'Crash Site — Your shuttle crashed on approach. Hull breached. A distress signal pulses from deeper inside.',
      },
    },
    {
      id: 'unlock',
      role: 'gate',
      beat: 'rising',
      tension: 4,
      descriptionKey: {
        fr: 'Point de Triage — Un couloir effondre bloque le passage. Il faut un stabilisateur medical pour soigner la survivante — et un chemin pour y arriver.',
        en: 'Triage Point — A collapsed corridor blocks the way. Need a medical stabilizer to treat the survivor — and a path to reach her.',
      },
    },
    {
      id: 'reveal',
      role: 'midpoint',
      beat: 'midpoint',
      tension: 6,
      descriptionKey: {
        fr: 'Emplacement de la Survivante — La Dr. Okonkwo. Blessee, consciente. Elle connait la faiblesse de la creature. Et l\'unique chemin de sortie traverse son territoire de chasse.',
        en: 'Survivor\'s Location — Dr. Okonkwo. Wounded but conscious. She knows the creature\'s weakness. And the only exit goes through its hunting ground.',
      },
    },
    {
      id: 'escalation',
      role: 'escalation',
      beat: 'escalation',
      tension: 8,
      descriptionKey: {
        fr: 'La Traque — Vous escortez une blessee. Chaque deplacement est calcule. La creature a detecte le sang de la Dr. Okonkwo.',
        en: 'The Hunt Begins — You\'re escorting a wounded NPC. Movement is calculated. The creature has detected Dr. Okonkwo\'s blood.',
      },
    },
    {
      id: 'boss',
      role: 'climax',
      beat: 'climax',
      tension: 10,
      descriptionKey: {
        fr: 'Point d\'Extraction — La navette est en vue. La creature vous coupe la route. Un choix impossible s\'impose.',
        en: 'Exit Point — The shuttle is in sight. The creature cuts you off. An impossible choice looms.',
      },
    },
    {
      id: 'resolution',
      role: 'epilogue',
      beat: 'resolution',
      tension: 3,
      descriptionKey: {
        fr: 'Decollage — La navette decolle. Ce qui s\'est passe ensuite depend de vos choix.',
        en: 'Liftoff — The shuttle takes off. What happened next depends on your choices.',
      },
    },
  ],

  gateItem: 'medical_stabilizer',
  gateItemLocation: 'start',

  revelation: {
    fr: 'La Dr. Okonkwo est la chercheuse principale — et la creature etait son experience. Elle connait sa faiblesse : la sensibilite sonore. La culpabilite la rend prete a tout pour aider.',
    en: 'Dr. Okonkwo is the lead researcher — and the creature was her experiment. She knows its weakness: sound sensitivity. Guilt makes her ready to help at any cost.',
  },
  escalationTrigger: {
    fr: 'Vous escortez maintenant une blessee. Les deplacements sont ralentis. La creature a detecte l\'odeur du sang. La chasse commence.',
    en: 'You\'re now escorting a wounded NPC. Movement is slower. The creature has detected the scent of blood. The hunt begins.',
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
    fr: 'L\'emetteur sonique combine avec l\'acoustique de la zone pourrait confiner la creature...',
    en: 'The sonic emitter combined with the zone\'s acoustics could permanently trap the creature...',
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
};
