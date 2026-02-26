# Chantier 5 — Enrichissement RESCUE "Dernier Signal"

> **Référence d'implémentation pour Claude Code (Opus)**
> **Prérequis** : Chantiers 1–4 terminés (infrastructure, ESCAPE enrichi, câblage E2E, INVESTIGATE enrichi)
> **Durée estimée** : 1 semaine
> **Nature** : contenu pur — le pipeline C3 consomme automatiquement les définitions enrichies
> **Pattern** : identique aux Chantiers 2 et 4, appliqué au skeleton RESCUE
> **Particularité** : RESCUE est le skeleton le plus complexe mécaniquement — escorte NPC, créature physique avec faiblesse exploitable, choix moral irréversible

---

## 1. Identité de RESCUE

### 1.1 Positionnement des 3 Skeletons

| Dimension | ESCAPE (C2) | INVESTIGATE (C4) | RESCUE (C5) |
|-----------|-------------|-------------------|-------------|
| Fantasy | Survie, fuite | Enquête, vérité | Sauvetage, sacrifice |
| Verbes dominants | FORCE, OPEN, RUN | HACK, READ, TALK | HEAL, PROTECT, USE, GIVE |
| Antagoniste | Créature (fixe, territoriale) | IA (systémique, omniprésente) | Créature (mobile, chasseuse) |
| Tension dramatique | Asphyxie progressive | Compte à rebours + paranoïa | NPC fragile + prédateur actif |
| Gate mechanic | Badge → porte | Data core → décryptage | Stabilisateur → soigner NPC |
| Révélation | Arme biologique | Fraude industrielle | NPC = créatrice de la créature |
| Boss type | escape (fuite) | puzzle (logique) | choice (dilemme moral) |
| Ton narratif | Claustrophobie, urgence | Paranoïa, trahison | Empathie, culpabilité, sacrifice |
| Mécanique unique | O₂ progressif | Collection de preuves + états IA | **Escorte NPC + choix moral** |
| Stat prioritaire | FOR/AGI | INT/PER/CHA | FOR/CHA/INT (équilibré) |

### 1.2 Ce Qui Rend RESCUE Unique

**La créature n'est pas un obstacle statique — c'est un chasseur.** Elle traque activement le sang de la Dr. Okonkwo. Chaque déplacement avec le NPC est un risque calculé. Le stalker clock s'accélère après la révélation.

**Le NPC n'est pas un objet — c'est une personne avec des connaissances, de la culpabilité, et une fragilité.** La Dr. Okonkwo a 4 HP. Sans stabilisateur, elle meurt en quelques tours. Avec, elle tient mais reste vulnérable. Elle fournit des informations cruciales (faiblesse sonore de la créature) et offre une aide narrative (failsafe).

**Le choix final est irréversible et moralement pesant.** Au boss, le joueur peut :
- Sauver Okonkwo (victoire primaire — empathique)
- L'abandonner/l'utiliser comme appât (victoire alternative — sombre)
- Piéger la créature avec l'émetteur sonique (victoire émergente — ingénieuse)

Ces trois fins ont des poids narratifs radicalement différents. Le jeu ne juge pas — il montre les conséquences.

---

## 2. Mécanique d'Escorte NPC — Conception via Flags

**Contrainte fondamentale** : le moteur n'a pas de système d'escorte natif. Les NPC ne "suivent" pas le joueur automatiquement. On simule l'escorte via des **flags scénario** et des **interactions enrichies**.

### 2.1 Comment ça Marche

```
AVANT escorte (start → unlock → reveal) :
  - dr_okonkwo est dans le nœud 'reveal', locationId: 'reveal'
  - Le joueur explore librement, la créature est absente

DÉCLENCHEMENT escorte (flag 'okonkwo_stabilized') :
  - Le joueur utilise medical_stabilizer sur dr_okonkwo
  - Flag 'okonkwo_stabilized' → true
  - Flag 'escort_active' → true
  - npcStates.dr_okonkwo.locationId suit le joueur (via interactions MOVE)

PENDANT escorte (escalation → boss) :
  - Chaque MOVE_TO du joueur : une interaction scénario vérifie 'escort_active'
    et met à jour npcStates.dr_okonkwo.locationId = nouvelle position
  - La créature apparaît (creature_hunter dans escalation/boss)
  - Le stalker clock s'accélère (+2 par tour au lieu de +1)

FIN escorte :
  - Victoire primaire : MOVE_TO resolution avec escort_active
    → dr_okonkwo.locationId = 'resolution' → escort_alive satisfied
  - Victoire alternative : ACTIVATE shuttle SANS escort_active
    → joueur seul dans resolution → reach_location satisfied
  - Défaite NPC : dr_okonkwo.hp ≤ 0 → npc_death defeat
```

### 2.2 Simulation du Suivi NPC

Le NPC ne suit pas automatiquement. L'escorte est gérée par des **conséquences sur les interactions MOVE_TO** dans les nœuds escalation et boss :

```typescript
// Pseudo-code conceptuel — implémenté via interactions enrichies
// Quand le joueur fait MOVE_TO <exit> dans un nœud avec escort_active :
{
  trigger: { verb: 'MOVE_TO', requiredFlag: 'escort_active' },
  onSuccess: {
    // Le NPC suit automatiquement
    consequences: [{ type: 'npc_move', npcId: 'dr_okonkwo', locationId: '<target>' }],
    narrative: {
      fr: "La Dr. Okonkwo vous suit en boitant, une main sur votre épaule. Chaque pas lui coûte.",
      en: "Dr. Okonkwo follows, limping, one hand on your shoulder.",
    },
  },
}
```

**En pratique** : le câblage C3 gère les conséquences `npc_move` dans `applyInteractionResolution()`. Si ce type de conséquence n'existe pas encore, il doit être ajouté — c'est la **seule extension moteur** de ce chantier. Voir §2.3.

### 2.3 Extension Moteur Minimale : Conséquence `npc_relocate`

**Fichier** : `src/engine/consequences.ts` (ou `scenarioInteractionResolver.ts`)

```typescript
// Nouveau type de conséquence
case 'npc_relocate': {
  if (cons.npcId && cons.locationId) {
    const npcState = current.npcStates[cons.npcId];
    if (npcState && npcState.alive) {
      current = {
        ...current,
        npcStates: {
          ...current.npcStates,
          [cons.npcId]: { ...npcState, locationId: cons.locationId },
        },
      };
    }
  }
  break;
}
```

C'est la seule modification moteur. ~10 lignes. Le reste est du contenu déclaratif.

**Note pour Claude Code** : vérifier d'abord si un type `npc_relocate` ou `npc_move` existe déjà dans le système de conséquences. Si oui, l'utiliser directement.

### 2.4 Dégradation NPC : Timer de Restabilisation

La Dr. Okonkwo a besoin d'être restabilisée périodiquement. Sans action, son état se dégrade.

**Implémentation via flags + narrative** (pas de nouveau système) :

```
Tour N   : escort_active = true, okonkwo_stable = true
Tour N+6 : flag 'okonkwo_weakening' → true (narrative : "La Dr. Okonkwo pâlit...")
Tour N+10: flag 'okonkwo_critical' → true (narrative : "Elle s'effondre...")
Tour N+12: dr_okonkwo.hp → 0 → defeat (npc_death)
```

**En pratique** : le timer est géré par le **stalker clock** ou par des interactions conditionnelles dans les nœuds escalation/boss. Le joueur peut restabiliser avec `USE first_aid_kit ON dr_okonkwo` ou `HEAL dr_okonkwo`.

**Décision simplificatrice** : plutôt qu'un vrai timer, la dégradation est narrative. Les interactions dans escalation et boss vérifient le flag `okonkwo_stable` et ajustent les descriptions. Le joueur est averti narrativement qu'il doit agir, mais la mort du NPC ne survient que si la créature attaque directement Okonkwo (conséquence de certains échecs).

---

## 3. Enrichissement Nœud par Nœud

### 3.1 START — Site de Crash (intro, tension 2)

**Ambiance** : Débris éparpillés, lumière filtrant par la brèche de coque. L'odeur de métal brûlé et de câblage fondu. Au loin, un bip régulier — le signal de détresse. Quelqu'un est vivant là-dedans.

**Atmosphère** : `'low_oxygen'` — la brèche cause une fuite d'air lente.

#### Features Enrichies

**`crashed_shuttle`** — featureType: `'container'`
```typescript
{
  id: 'crashed_shuttle',
  featureType: 'container',
  initialState: 'damaged',
  extraProperties: ['metallic', 'large', 'damaged', 'container', 'vehicle'],
  contains: ['medical_stabilizer'],
  aliases: {
    fr: ['navette', 'shuttle', 'vaisseau', 'navette écrasée', 'épave'],
    en: ['shuttle', 'crashed shuttle', 'ship', 'wreck'],
  },
  descriptions: {
    damaged: "Votre navette, écrasée à l'approche. Le cockpit est déformé au-delà de toute réparation. La soute arrière est partiellement accessible — des débris bloquent l'accès complet.",
    open: "La soute de la navette est dégagée. Les compartiments de rangement sont accessibles. Le moteur principal est définitivement hors service.",
    broken: "L'épave est complètement effondrée. Plus rien à récupérer.",
  },
  interactions: [
    {
      trigger: { verb: 'EXAMINE', requiredState: 'damaged' },
      onSuccess: {
        narrative: {
          fr: "La soute arrière contient du matériel d'urgence. Un compartiment médical est visible mais coincé sous une poutre tordue. Le moteur principal est en miettes — il faudra trouver un autre moyen de partir.",
          en: "The rear cargo hold contains emergency supplies. A medical compartment is visible but jammed.",
        },
      },
    },
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', stat: 'FOR', dc: 10 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Vous arrachez la poutre tordue. Le métal grince, cède. Le compartiment médical s'ouvre — un stabilisateur médical de niveau hospitalier. Exactement ce qu'il faut pour une blessure grave.",
          en: "You wrench the twisted beam away. The medical compartment opens.",
        },
        revealsItems: ['medical_stabilizer'],
      },
      onFailure: {
        narrative: {
          fr: "La poutre refuse de bouger. Le métal est tordu à un angle impossible. Il faudra plus de force — ou un outil.",
          en: "The beam refuses to budge.",
        },
      },
    },
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', requiredItem: 'salvage_tool' },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "L'outil de récupération fait levier. La poutre se plie, libérant le compartiment médical. Le stabilisateur est intact, prêt à l'emploi.",
          en: "The salvage tool levers the beam aside.",
        },
        revealsItems: ['medical_stabilizer'],
      },
    },
    {
      trigger: { verb: 'SEARCH', requiredState: 'damaged', stat: 'PER', dc: 9 },
      onSuccess: {
        narrative: {
          fr: "Fouillant les débris du cockpit, vous trouvez un outil de récupération encore fonctionnel et la boîte noire de la navette — intacte. Le compartiment médical reste bloqué, mais l'outil pourrait aider.",
          en: "Searching the cockpit debris, you find a salvage tool and the shuttle's black box.",
        },
        revealsItems: ['salvage_tool'],
        flagSet: 'shuttle_searched',
      },
    },
  ],
}
```

**`hull_breach`** — featureType: `'panel'`
```typescript
{
  id: 'hull_breach',
  featureType: 'panel',
  initialState: 'open',
  extraProperties: ['metallic', 'dangerous', 'repairable', 'large'],
  aliases: {
    fr: ['brèche', 'trou', 'brèche coque', 'ouverture'],
    en: ['breach', 'hull breach', 'hole'],
  },
  descriptions: {
    open: "Une brèche béante dans la coque extérieure. Les bords sont déchiquetés — l'impact venait de dehors. L'air s'échappe lentement. La structure est fragilisée mais le passage vers l'intérieur est stable.",
    closed: "La brèche est colmatée. Un travail de fortune, mais l'air ne fuit plus. Le passage vers l'intérieur reste praticable.",
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'open', stat: 'INT', dc: 12 },
      onSuccess: {
        newState: 'closed',
        narrative: {
          fr: "Vous utilisez des plaques de débris et du câblage pour improviser un colmatage. Pas joli, mais étanche. La fuite d'air s'arrête — respiration plus facile.",
          en: "You improvise a patch from debris plates and wiring. The air leak stops.",
        },
        flagSet: 'breach_sealed',
        consequences: [{ type: 'atmosphere_change', atmosphereType: 'pressurized' }],
      },
      onFailure: {
        narrative: {
          fr: "Les plaques de débris ne tiennent pas. La brèche est trop irrégulière. Il faudrait de meilleurs matériaux — ou plus de compétences.",
          en: "The debris plates don't hold. The breach is too irregular.",
        },
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'open', requiredItem: 'salvage_tool' },
      onSuccess: {
        newState: 'closed',
        narrative: {
          fr: "L'outil de récupération découpe des plaques aux bonnes dimensions. Soudage de fortune — la brèche est scellée. L'atmosphère se stabilise.",
          en: "The salvage tool cuts plates to size. Makeshift welding seals the breach.",
        },
        flagSet: 'breach_sealed',
        consequences: [{ type: 'atmosphere_change', atmosphereType: 'pressurized' }],
      },
    },
    {
      trigger: { verb: 'EXAMINE', requiredState: 'open' },
      onSuccess: {
        narrative: {
          fr: "Les marques d'impact sont violentes — pas un astéroïde, quelque chose de biologique. Des griffures profondes dans le métal. Ce qui a percé cette coque ne venait pas de l'espace. Ça venait de l'intérieur.",
          en: "The impact marks are violent — not an asteroid, something biological.",
        },
        flagSet: 'breach_examined',
      },
    },
  ],
}
```

**`salvageable_parts`** — featureType: `'container'`
```typescript
{
  id: 'salvageable_parts',
  featureType: 'container',
  initialState: 'intact',
  extraProperties: ['metallic', 'small', 'liftable', 'tool_source'],
  contains: ['salvage_tool'],
  aliases: {
    fr: ['pièces', 'débris', 'composants', 'pièces récupérables', 'bric-à-brac'],
    en: ['parts', 'salvageable parts', 'debris', 'components'],
  },
  descriptions: {
    intact: "Pièces récupérables éparpillées dans les débris : câblage, composants électroniques, outils de fortune. De quoi improviser.",
    empty: "Les débris utiles ont déjà été récupérés. Il ne reste que de la ferraille inutile.",
  },
  interactions: [
    {
      trigger: { verb: 'SEARCH', stat: 'PER', dc: 8 },
      onSuccess: {
        newState: 'empty',
        narrative: {
          fr: "Vous fouilllez les débris méthodiquement. Un outil de récupération multifonction — encore opérationnel. Et des composants électroniques qui pourraient servir pour des réparations.",
          en: "You search the debris methodically. A multi-function salvage tool — still operational.",
        },
        revealsItems: ['salvage_tool'],
      },
    },
    {
      trigger: { verb: 'TAKE', requiredState: 'intact' },
      onSuccess: {
        newState: 'empty',
        narrative: {
          fr: "Vous ramassez ce qui semble utile : un outil de récupération, des câbles, quelques composants. Le reste est de la ferraille.",
          en: "You grab what looks useful.",
        },
        revealsItems: ['salvage_tool'],
      },
    },
  ],
}
```

**`emergency_beacon_broken`** — featureType: `'terminal'`
```typescript
{
  id: 'emergency_beacon_broken',
  featureType: 'terminal',
  initialState: 'broken',
  extraProperties: ['electronic', 'broken', 'repairable'],
  aliases: {
    fr: ['balise', 'balise détresse', 'balise cassée', 'émetteur'],
    en: ['beacon', 'emergency beacon', 'broken beacon', 'transmitter'],
  },
  descriptions: {
    broken: "La balise de détresse de la navette — endommagée dans le crash. Le circuit d'émission est intact mais l'antenne est brisée.",
    active: "La balise est réparée. Le signal pulse vers l'extérieur — quelqu'un, quelque part, pourrait le capter.",
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'broken', requiredItem: 'salvage_tool', stat: 'INT', dc: 11 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Antenne reconstruite avec des pièces de fortune. Le circuit d'émission reprend vie — un bip régulier. La portée est limitée, mais c'est un signal. Un espoir de secours extérieur.",
          en: "Antenna rebuilt from salvage. The emission circuit comes alive.",
        },
        flagSet: 'backup_beacon_active',
      },
      onFailure: {
        narrative: {
          fr: "Les composants ne s'emboîtent pas correctement. L'antenne reste silencieuse. Il manque quelque chose — ou vos mains ne sont pas assez précises.",
          en: "The components don't fit right.",
        },
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'broken', requiredItem: 'sonic_emitter_component', stat: 'INT', dc: 9 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Le composant sonique haute fréquence remplace parfaitement l'antenne brisée — même gamme de fréquences. La balise émet à nouveau. Mais vous venez d'utiliser le seul composant qui aurait pu neutraliser la créature.",
          en: "The sonic component replaces the broken antenna perfectly. But you just used the only thing that could neutralize the creature.",
        },
        flagSet: 'backup_beacon_active',
        consumeItem: true,
        flagUnset: 'has_sonic_emitter',
      },
    },
    {
      trigger: { verb: 'EXAMINE', requiredState: 'broken' },
      onSuccess: {
        narrative: {
          fr: "Le circuit d'émission est intact — seule l'antenne est brisée. Avec un composant de remplacement compatible (même gamme de fréquences), la balise pourrait être remise en service.",
          en: "The emission circuit is intact — only the antenna is broken.",
        },
      },
    },
  ],
}
```

#### Items Enrichis

**`first_aid_kit`** — itemType: `'consumable'`
```typescript
{
  id: 'first_aid_kit',
  itemType: 'consumable',
  extraProperties: ['medical', 'small', 'consumable'],
  aliases: {
    fr: ['trousse', 'premiers soins', 'kit médical', 'soins', 'trousse soins'],
    en: ['first aid', 'kit', 'medical kit', 'bandages'],
  },
  description: {
    fr: "Trousse de premiers soins récupérée de la navette. Compresses, désinfectant, garrot. Pas suffisant pour une blessure grave, mais utile en urgence.",
    en: "First aid kit from the shuttle. Not enough for serious injuries, but useful in emergencies.",
  },
  useOn: [
    {
      targetId: 'dr_okonkwo',
      onSuccess: {
        narrative: {
          fr: "Vous appliquez les compresses sur ses plaies les plus visibles. Le garrot stoppe un saignement au bras. Ce n'est pas suffisant pour la stabiliser — il faut un stabilisateur médical — mais elle respire un peu mieux.",
          en: "You apply bandages to the worst wounds. Not enough to stabilize, but she breathes a bit easier.",
        },
        consequences: [{ type: 'heal', amount: 2, targetId: 'dr_okonkwo' }],
        consumeItem: true,
        flagSet: 'okonkwo_patched',
      },
    },
  ],
}
```

**`medical_stabilizer`** — itemType: `'key_item'`, hidden
```typescript
{
  id: 'medical_stabilizer',
  itemType: 'key_item',
  hidden: true,
  revealedBy: { featureId: 'crashed_shuttle', requiredState: 'open' },
  extraProperties: ['medical', 'electronic', 'small', 'key'],
  aliases: {
    fr: ['stabilisateur', 'stabilisateur médical', 'stab', 'appareil médical'],
    en: ['stabilizer', 'medical stabilizer', 'med device'],
  },
  description: {
    fr: "Stabilisateur médical de niveau hospitalier. Maintient un patient en état stable pendant plusieurs heures. Exactement ce qu'il faut pour la survivante blessée.",
    en: "Hospital-grade medical stabilizer. Keeps a patient stable for hours.",
  },
  useOn: [
    {
      targetId: 'dr_okonkwo',
      requiredFlag: 'okonkwo_found',
      onSuccess: {
        narrative: {
          fr: "Vous activez le stabilisateur et le fixez sur sa blessure principale. Les moniteurs passent au vert. La Dr. Okonkwo ouvre les yeux plus grand, la douleur recule. 'Merci. Je... je peux marcher maintenant. Sortons d'ici — ensemble.'",
          en: "You activate the stabilizer. Her monitors turn green. 'Thank you. I can walk now. Let's get out — together.'",
        },
        flagSet: 'okonkwo_stabilized',
        consequences: [
          { type: 'heal', amount: 4, targetId: 'dr_okonkwo' },
          { type: 'flag_set', flag: 'escort_active' },
        ],
      },
    },
  ],
}
```

**`salvage_tool`** — itemType: `'tool'`, hidden
```typescript
{
  id: 'salvage_tool',
  itemType: 'tool',
  hidden: true,
  revealedBy: { featureId: 'salvageable_parts', requiredState: 'empty' },
  extraProperties: ['metallic', 'tool', 'mechanical', 'small'],
  aliases: {
    fr: ['outil', 'outil récupération', 'outil fortune', 'levier'],
    en: ['tool', 'salvage tool', 'lever'],
  },
  description: {
    fr: "Outil de récupération multifonction. Levier, coupeur, soudeur de fortune. L'allié du survivaliste.",
    en: "Multi-function salvage tool. Lever, cutter, makeshift welder.",
  },
  useOn: [
    {
      targetId: 'collapsed_corridor',
      onSuccess: {
        narrative: {
          fr: "L'outil de récupération fait levier sur les poutres effondrées. Le métal grince, cède. Un passage étroit mais praticable s'ouvre dans les décombres.",
          en: "The salvage tool levers the collapsed beams. A narrow passage opens.",
        },
        flagSet: 'corridor_cleared_tool',
      },
    },
    {
      targetId: 'blast_door_partial',
      onSuccess: {
        narrative: {
          fr: "Vous bloquez l'outil dans le mécanisme de la porte blindée et forcez. Le métal grince — la porte s'ouvre de 30 centimètres supplémentaires. Assez pour passer.",
          en: "You jam the tool into the blast door mechanism and force it.",
        },
        flagSet: 'blast_door_widened',
      },
    },
    {
      targetId: 'extraction_bay_door',
      onSuccess: {
        narrative: {
          fr: "L'outil sert de levier pour forcer le mécanisme endommagé. La porte de la baie d'extraction coulisse — la navette est de l'autre côté.",
          en: "The tool levers the damaged mechanism. The extraction bay door slides open.",
        },
        flagSet: 'extraction_door_opened',
      },
    },
  ],
}
```

---

### 3.2 UNLOCK — Point de Triage (rising, tension 4)

**Ambiance** : Zone médicale dévastée. Civières renversées, matériel chirurgical éparpillé. Un couloir principal s'est effondré — poutres métalliques et gravats bloquent le passage. Le signal de détresse est plus fort ici. De l'autre côté, quelqu'un attend.

#### Features Enrichies

**`collapsed_corridor`** — featureType: `'door'` — **GATE OBSTACLE**
```typescript
{
  id: 'collapsed_corridor',
  featureType: 'door',
  initialState: 'broken',
  extraProperties: ['metallic', 'large', 'broken', 'blocked', 'obstacle'],
  aliases: {
    fr: ['couloir', 'couloir effondré', 'débris', 'passage', 'effondrement', 'décombres'],
    en: ['corridor', 'collapsed corridor', 'debris', 'passage', 'rubble'],
  },
  descriptions: {
    broken: "Le couloir s'est effondré sous le poids des débris. Des poutres métalliques bloquent le passage principal. La structure gémit encore — instable.",
    open: "Les débris ont été dégagés. Le passage est étroit mais praticable. Des traces de sang mènent de l'autre côté.",
  },
  interactions: [
    // Chemin 1 : FOR pur — dégager les décombres à mains nues
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'broken', stat: 'FOR', dc: 12 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Poutre par poutre, vous dégagez le passage. Le métal mord vos mains, la sueur brûle vos yeux. Mais le couloir s'ouvre enfin. Le signal de détresse pulse plus fort de l'autre côté.",
          en: "Beam by beam, you clear the passage. The distress signal pulses louder on the other side.",
        },
        revealsExit: 'unlock_to_reveal',
        consequences: [{ type: 'damage', amount: 1 }],
      },
      onFailure: {
        narrative: {
          fr: "Les poutres sont trop lourdes, trop enchevêtrées. Vous vous épuisez sans résultat. Il faut une autre approche — ou un outil.",
          en: "The beams are too heavy, too tangled.",
        },
      },
    },
    // Chemin 2 : FOR + outil de récupération
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'broken', requiredItem: 'salvage_tool' },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "L'outil de récupération fait levier sur les poutres principales. Le métal cède proprement — le passage s'ouvre sans effort excessif. L'outil prouve sa valeur.",
          en: "The salvage tool levers the main beams. The passage opens cleanly.",
        },
        revealsExit: 'unlock_to_reveal',
      },
    },
    // Chemin 3 : PER — trouver le détour maintenance
    {
      trigger: { verb: 'EXAMINE', requiredState: 'broken', stat: 'PER', dc: 11 },
      onSuccess: {
        narrative: {
          fr: "En examinant les murs autour de l'effondrement, vous repérez une trappe de maintenance partiellement cachée par les décombres. Un passage alternatif.",
          en: "Examining the walls, you spot a maintenance hatch partially hidden by debris.",
        },
        flagSet: 'detour_found',
      },
    },
    // Chemin 4 : INT — découper au plasma (bruyant)
    {
      trigger: { verb: 'USE', requiredState: 'broken', requiredItem: 'plasma_cutter', stat: 'INT', dc: 10 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Le découpeur plasma tranche les poutres comme du beurre. Le passage s'ouvre dans une pluie d'étincelles et une odeur de métal brûlé. Efficace — mais le bruit a dû porter loin dans les couloirs silencieux.",
          en: "The plasma cutter slices through beams like butter. Effective — but loud.",
        },
        revealsExit: 'unlock_to_reveal',
        flagSet: 'noise_made_unlock',
        consequences: [{ type: 'stalker_clock_increment', amount: 2 }],
      },
    },
  ],
}
```

**`maintenance_detour_hatch`** — featureType: `'door'`
```typescript
{
  id: 'maintenance_detour_hatch',
  featureType: 'door',
  initialState: 'closed',
  extraProperties: ['metallic', 'small', 'openable'],
  aliases: {
    fr: ['trappe', 'trappe maintenance', 'détour', 'conduit', 'trappe accès'],
    en: ['hatch', 'maintenance hatch', 'detour', 'duct'],
  },
  descriptions: {
    closed: "Trappe d'accès vers les conduits de maintenance. Étroite mais praticable. Un chemin alternatif pour contourner l'effondrement.",
    open: "La trappe est ouverte. Le conduit de maintenance est sombre et étroit, mais il mène de l'autre côté.",
  },
  interactions: [
    {
      trigger: { verb: 'OPEN', requiredState: 'closed', requiredFlag: 'detour_found' },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "La trappe s'ouvre dans un grincement. Le conduit est étroit — il faudra ramper. Mais il mène de l'autre côté de l'effondrement, en silence.",
          en: "The hatch opens with a creak. The duct is narrow — you'll need to crawl.",
        },
        revealsExit: 'unlock_to_reveal',
      },
    },
    {
      trigger: { verb: 'OPEN', requiredState: 'closed' },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "La trappe résiste un instant, puis cède. Le conduit de maintenance s'ouvre devant vous — un boyau sombre. Pas confortable, mais praticable.",
          en: "The hatch resists, then gives. A dark shaft opens before you.",
        },
        revealsExit: 'unlock_to_reveal',
      },
    },
  ],
}
```

**`plasma_cutter_rack`** — featureType: `'container'`
```typescript
{
  id: 'plasma_cutter_rack',
  featureType: 'container',
  initialState: 'intact',
  extraProperties: ['metallic', 'tool_source'],
  contains: ['plasma_cutter'],
  aliases: {
    fr: ['rack', 'rack plasma', 'découpeur', 'support'],
    en: ['rack', 'plasma cutter rack', 'cutter rack'],
  },
  descriptions: {
    intact: "Rack contenant un découpeur plasma industriel. Puissant — mais le bruit attirerait l'attention de tout prédateur dans les parages.",
    empty: "Le rack est vide. Le découpeur a été pris.",
  },
  interactions: [
    {
      trigger: { verb: 'TAKE', requiredState: 'intact' },
      onSuccess: {
        newState: 'empty',
        narrative: {
          fr: "Le découpeur plasma est lourd mais fonctionnel. La batterie est à 40% — assez pour quelques coupes. L'outil parfait pour les obstacles physiques, si vous acceptez le bruit.",
          en: "The plasma cutter is heavy but functional. 40% battery.",
        },
        revealsItems: ['plasma_cutter'],
      },
    },
  ],
}
```

#### Item Enrichi Supplémentaire

**`plasma_cutter`** — itemType: `'tool'`
```typescript
{
  id: 'plasma_cutter',
  itemType: 'tool',
  revealedBy: { featureId: 'plasma_cutter_rack', requiredState: 'empty' },
  extraProperties: ['electronic', 'tool', 'large', 'powered', 'noisy', 'weapon'],
  aliases: {
    fr: ['découpeur', 'découpeur plasma', 'plasma', 'chalumeau'],
    en: ['cutter', 'plasma cutter', 'plasma'],
  },
  description: {
    fr: "Découpeur plasma industriel. Coupe le métal comme du beurre. Bruyant, limité en batterie, mais dévastateur.",
    en: "Industrial plasma cutter. Cuts metal like butter. Loud, battery-limited, devastating.",
  },
  useOn: [
    {
      targetId: 'collapsed_corridor',
      onSuccess: {
        narrative: {
          fr: "Le plasma tranche les poutres dans une gerbe d'étincelles bleues. Le passage s'ouvre — mais le rugissement du découpeur a résonné dans toute la station.",
          en: "Plasma slices through the beams in a shower of blue sparks.",
        },
        flagSet: 'corridor_plasma_cut',
        consequences: [{ type: 'stalker_clock_increment', amount: 2 }],
      },
    },
    {
      targetId: 'creature_hunter',
      onSuccess: {
        narrative: {
          fr: "Le faisceau plasma touche la créature. Elle hurle — un son qui vous transperce — et recule, la chair cauterisée. Blessée, pas vaincue. Mais vous avez gagné un répit.",
          en: "The plasma beam hits the creature. It screams and recoils, cauterized.",
        },
        consequences: [{ type: 'damage', amount: 4, targetId: 'creature_hunter' }],
      },
    },
  ],
}
```

---

### 3.3 REVEAL — Emplacement de la Survivante (midpoint, tension 6)

**Ambiance** : Laboratoire de recherche improvisé en refuge. Barricade de fortune. Derrière, une femme blessée, consciente, les yeux vifs malgré la douleur. La Dr. Okonkwo. Chercheuse principale. Créatrice de la créature qui vous traque. Le poids de sa culpabilité est palpable.

#### NPC Enrichi

**`dr_okonkwo`** — NPC coopérative, blessée
```typescript
{
  id: 'dr_okonkwo',
  disposition: 'cooperative',
  hpOverride: 4,
  extraProperties: ['alive', 'wounded', 'cooperative', 'knowledgeable'],
  aliases: {
    fr: ['docteur', 'okonkwo', 'dr okonkwo', 'survivante', 'chercheuse', 'scientifique', 'femme'],
    en: ['doctor', 'okonkwo', 'dr okonkwo', 'survivor', 'researcher', 'scientist', 'woman'],
  },
  interactions: [
    // TALK — première rencontre
    {
      trigger: { verb: 'TALK', stat: 'CHA', dc: 0 },
      onSuccess: {
        narrative: {
          fr: "\"Merci d'être venu. Je suis la Dr. Okonkwo — chercheuse principale.\" Elle grimace de douleur. \"C'est ma créature. Mon expérience. Le Projet Chasseur. Je sais, c'est ma faute. Mais je connais sa faiblesse : les hautes fréquences. Le son la désoriente. Il y a un composant d'émetteur sonique dans mon labo — là-bas.\" Elle pointe vers un rack d'équipement. \"Et par pitié, sortez-moi d'ici.\"",
          en: "She explains about Project Hunter, the creature's weakness, and begs for rescue.",
        },
        flagSet: 'okonkwo_found',
      },
    },
    // TALK — après stabilisation
    {
      trigger: { verb: 'TALK', requiredFlag: 'okonkwo_stabilized' },
      onSuccess: {
        narrative: {
          fr: "\"Le chemin de sortie passe par son territoire de chasse. Le couloir acoustique — c'est là que j'ai fait mes expériences. Les murs amplifient le son. Si vous avez le composant, c'est là qu'il sera le plus efficace.\" Elle s'accroche à votre bras. \"Je vous ralentirai. Mais je refuse de mourir ici. Pas comme ça.\"",
          en: "She explains the acoustic corridor and the best place to use the sonic emitter.",
        },
        flagSet: 'acoustic_info_received',
      },
    },
    // HEAL — utiliser stabilisateur
    {
      trigger: { verb: 'HEAL', requiredItem: 'medical_stabilizer' },
      onSuccess: {
        narrative: {
          fr: "Vous activez le stabilisateur. Les capteurs s'allument, évaluent, injectent. La Dr. Okonkwo serre les dents — puis se détend. La couleur revient sur son visage. \"Je peux marcher. Allons-y — ensemble.\"",
          en: "You activate the stabilizer. Color returns to her face. 'I can walk. Let's go — together.'",
        },
        flagSet: 'okonkwo_stabilized',
        consequences: [
          { type: 'heal', amount: 4, targetId: 'dr_okonkwo' },
          { type: 'flag_set', flag: 'escort_active' },
        ],
      },
    },
    // EXAMINE
    {
      trigger: { verb: 'EXAMINE' },
      onSuccess: {
        narrative: {
          fr: "La quarantaine, yeux sombres et déterminés malgré la douleur. Blessure profonde au flanc — lacération, pas coupure nette. Des griffures. La créature l'a déjà touchée. Sans stabilisateur médical, elle ne tiendra pas longtemps.",
          en: "Deep wound in her side — claw marks, not a clean cut. Without stabilization, she won't last.",
        },
      },
    },
  ],
}
```

#### Features Enrichies

**`survivor_barricade`** — featureType: `'panel'`
```typescript
{
  id: 'survivor_barricade',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['metallic', 'large', 'barrier'],
  aliases: {
    fr: ['barricade', 'fortification', 'défense', 'abri'],
    en: ['barricade', 'fortification', 'barrier', 'shelter'],
  },
  descriptions: {
    intact: "Barricade improvisée — mobilier, plaques métalliques, câblage. Quelqu'un s'est retranché ici avec méthode. Des traces de sang mènent derrière.",
    broken: "La barricade est en morceaux. Ça ne protégera plus personne.",
  },
  interactions: [
    {
      trigger: { verb: 'EXAMINE' },
      onSuccess: {
        narrative: {
          fr: "Construction méthodique — une scientifique a fait ça, pas un technicien paniqué. Les plaques sont soudées aux points de stress. Des rations vides indiquent que quelqu'un a survécu ici pendant au moins 48 heures. Des marques de griffes profondes sur le côté extérieur.",
          en: "Methodical construction — a scientist built this, not a panicked tech.",
        },
      },
    },
    {
      trigger: { verb: 'BREAK', stat: 'FOR', dc: 8 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: "Vous démontez la barricade pour récupérer les matériaux. Des plaques métalliques utiles et du câblage. La protection est perdue — mais vous n'en aurez plus besoin si vous bougez vite.",
          en: "You dismantle the barricade for materials.",
        },
        flagSet: 'barricade_dismantled',
      },
    },
  ],
}
```

**`research_terminal`** — featureType: `'terminal'`
```typescript
{
  id: 'research_terminal',
  featureType: 'terminal',
  initialState: 'damaged',
  extraProperties: ['electronic', 'damaged', 'readable', 'repairable'],
  aliases: {
    fr: ['terminal', 'terminal recherche', 'ordinateur', 'console'],
    en: ['terminal', 'research terminal', 'computer', 'console'],
  },
  descriptions: {
    damaged: "Terminal de recherche partiellement détruit. L'écran clignote — données fragmentaires récupérables.",
    active: "Terminal restauré. Les données du Projet Chasseur s'affichent en entier — une horreur fascinante.",
  },
  readableContent: {
    fr: "PROJET CHASSEUR — Dr. A. Okonkwo, Chercheuse Principale\n\n— Spécimen Alpha : organisme synthétique à évolution accélérée\n— Sensibilité acoustique : hautes fréquences (15-20 kHz) provoquent désorientation\n— Fréquences > 20 kHz : douleur, paralysie temporaire\n— AVERTISSEMENT : le spécimen apprend. Adaptation aux stimuli répétés en 3-5 expositions\n— Note finale : 'J'aurais dû arrêter au Stade 3. Je le savais. Pardon.'",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'READ', requiredState: 'damaged' },
      onSuccess: {
        narrative: {
          fr: "Données fragmentaires : 'Projet Chasseur — sensibilité acoustique extrême — fréquences 15-20 kHz — désorientation confirmée'. Et une note personnelle : 'J'aurais dû arrêter au Stade 3. Je le savais. Pardon.' La culpabilité de Okonkwo, noir sur blanc.",
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
          fr: "Le terminal reprend vie. Les données complètes du Projet Chasseur s'affichent — séquences génétiques, résultats d'expériences, rapports d'incidents. Et un détail crucial : la créature APPREND. Elle s'adapte aux stimuli répétés en 3 à 5 expositions. L'émetteur sonique ne marchera pas indéfiniment.",
          en: "Full Project Hunter data. Crucial detail: the creature LEARNS.",
        },
        flagSet: 'creature_learns_discovered',
      },
    },
  ],
}
```

#### Items Enrichis

**`research_notes`** — itemType: `'readable'`
```typescript
{
  id: 'research_notes',
  itemType: 'readable',
  extraProperties: ['paper', 'readable', 'small'],
  aliases: {
    fr: ['notes', 'notes recherche', 'cahier', 'carnet', 'rapport'],
    en: ['notes', 'research notes', 'journal', 'report'],
  },
  description: {
    fr: "Notes de recherche d'Okonkwo. Projet Chasseur — sensibilité acoustique extrême. Les hautes fréquences la désorientent. L'information qui pourrait vous sauver la vie.",
    en: "Okonkwo's research notes. Project Hunter — extreme sound sensitivity.",
  },
  useOn: [],
}
```

**`sonic_emitter_component`** — itemType: `'key_item'`
```typescript
{
  id: 'sonic_emitter_component',
  itemType: 'key_item',
  extraProperties: ['electronic', 'small', 'key', 'sonic'],
  aliases: {
    fr: ['émetteur', 'composant sonique', 'émetteur sonique', 'composant', 'sonique'],
    en: ['emitter', 'sonic emitter', 'sonic component', 'component'],
  },
  description: {
    fr: "Composant d'émetteur sonique haute fréquence. Utilisé dans les expériences d'Okonkwo. Combiné avec l'acoustique d'une zone confinée, il pourrait neutraliser la créature.",
    en: "High-frequency sonic emitter component. Combined with acoustics, could neutralize the creature.",
  },
  useOn: [
    {
      targetId: 'creature_hunter',
      onSuccess: {
        narrative: {
          fr: "Vous activez le composant sonique. Un hurlement ultrasonique — inaudible pour vous, dévastateur pour la créature. Elle se tord de douleur, recule, les mains sur les oreilles (a-t-elle des oreilles ?). Un répit précieux.",
          en: "You activate the sonic component. An ultrasonic shriek — devastating for the creature.",
        },
        consequences: [
          { type: 'damage', amount: 3, targetId: 'creature_hunter' },
          { type: 'stalker_clock_decrement', amount: 3 },
        ],
      },
    },
    {
      targetId: 'acoustic_trap_point',
      requiredFlag: 'acoustic_info_received',
      onSuccess: {
        narrative: {
          fr: "Vous fixez le composant sonique au point de piège acoustique. L'activation déclenche une cascade de résonance — les murs acoustiques amplifient le signal x100. Un mur de son invisible, infranchissable pour la créature. Elle est piégée. Confinée. Pour toujours.",
          en: "You attach the sonic component to the acoustic trap point. Resonance cascade. The creature is trapped. Permanently.",
        },
        flagSet: 'creature_contained',
        consumeItem: true,
        consequences: [{ type: 'victory', victoryType: 'emergent' }],
      },
    },
    {
      targetId: 'acoustic_walls',
      onSuccess: {
        narrative: {
          fr: "Vous activez le composant contre les parois acoustiques. Le son se répercute violemment — la créature hurle et s'enfuit du couloir. Le chemin est libre, temporairement. L'effet ne durera pas — elle apprend.",
          en: "You activate the component against the acoustic walls. The creature flees.",
        },
        flagSet: 'creature_repelled_escalation',
        consequences: [{ type: 'stalker_clock_decrement', amount: 5 }],
      },
    },
    {
      targetId: 'emergency_beacon_broken',
      onSuccess: {
        narrative: {
          fr: "Le composant sonique remplace l'antenne brisée — même gamme de fréquences. La balise émet à nouveau. Mais vous venez de sacrifier votre seule arme contre la créature.",
          en: "The sonic component replaces the broken antenna. But you just sacrificed your only weapon.",
        },
        flagSet: 'backup_beacon_active',
        consumeItem: true,
      },
    },
  ],
}
```

---

### 3.4 ESCALATION — La Traque (escalation, tension 8)

**Ambiance** : Couloir long et sombre. Les panneaux acoustiques sur les murs — vestiges du labo d'Okonkwo — donnent une résonance étrange à chaque pas. La Dr. Okonkwo boite à côté de vous, une main agrippée à votre épaule. Au bout du couloir, un mouvement. La créature sait que vous êtes là.

**Atmosphère** : `'low_oxygen'` — fuite d'air dans cette section.

#### NPC Enrichi

**`creature_hunter`** — NPC hostile (apparition ESCALATION)
```typescript
{
  id: 'creature_hunter',
  disposition: 'hostile',
  hpOverride: 12,
  extraProperties: ['alive', 'hostile', 'organic', 'predator', 'fast', 'sound_sensitive'],
  aliases: {
    fr: ['créature', 'chasseur', 'prédateur', 'bête', 'monstre', 'chose', 'ombre'],
    en: ['creature', 'hunter', 'predator', 'beast', 'monster', 'thing'],
  },
  interactions: [
    // COMBAT direct
    {
      trigger: { verb: 'STRIKE', stat: 'FOR', dc: 14 },
      onSuccess: {
        narrative: {
          fr: "Votre coup touche. La créature encaisse — chair synthétique, dure comme du cuir blindé — mais recule. Sang noir. Elle feule, blessée. Pas vaincue.",
          en: "Your blow connects. The creature absorbs it — synthetic flesh — but recoils.",
        },
        consequences: [{ type: 'damage', amount: 3, targetId: 'creature_hunter' }],
      },
      onFailure: {
        narrative: {
          fr: "Trop rapide. La créature esquive votre attaque et riposte — griffes acérées qui arrachent le tissu de votre combinaison. Vous saignez.",
          en: "Too fast. The creature dodges and retaliates.",
        },
        consequences: [{ type: 'damage', amount: 3 }],
      },
    },
    // TALK — tentative
    {
      trigger: { verb: 'TALK', stat: 'CHA', dc: 16 },
      onSuccess: {
        narrative: {
          fr: "Votre voix la fait hésiter. Un frémissement parcourt son corps — un souvenir du labo, de la voix humaine, du temps avant. Elle incline la tête. Un instant de répit. Ça ne durera pas.",
          en: "Your voice makes it hesitate. A tremor — a memory from the lab.",
        },
        consequences: [{ type: 'stalker_clock_decrement', amount: 2 }],
      },
      onFailure: {
        narrative: {
          fr: "Un grondement sourd. Elle bondit en avant, griffes dehors. Les mots ne sont que du bruit pour elle — un bruit qui confirme votre position.",
          en: "A low growl. Words are just noise — noise that confirms your position.",
        },
        consequences: [{ type: 'damage', amount: 2 }],
      },
    },
    // USE sonic emitter — déjà défini dans l'item
  ],
}
```

#### Features Enrichies

**`acoustic_walls`** — featureType: `'panel'`
```typescript
{
  id: 'acoustic_walls',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['wall_mounted', 'acoustic', 'resonant'],
  aliases: {
    fr: ['parois', 'murs acoustiques', 'panneaux', 'parois acoustiques'],
    en: ['walls', 'acoustic walls', 'panels', 'acoustic panels'],
  },
  descriptions: {
    intact: "Panneaux acoustiques recouvrant les parois — vestiges du laboratoire d'Okonkwo. Ils amplifient le son de manière spectaculaire. Un émetteur sonique ici serait dévastateur.",
  },
  interactions: [
    {
      trigger: { verb: 'EXAMINE' },
      onSuccess: {
        narrative: {
          fr: "Les panneaux sont conçus pour une résonance maximale dans la gamme 15-20 kHz — exactement la fréquence de sensibilité de la créature. Okonkwo a construit son labo autour de sa faiblesse. Si vous avez le composant sonique, c'est ICI qu'il faut l'utiliser.",
          en: "The panels are designed for maximum resonance at 15-20 kHz — the creature's exact sensitivity range.",
        },
        flagSet: 'acoustic_potential_noted',
      },
    },
  ],
}
```

**`distraction_rack`** — featureType: `'container'`
```typescript
{
  id: 'distraction_rack',
  featureType: 'container',
  initialState: 'intact',
  extraProperties: ['metallic', 'tool_source', 'container'],
  contains: ['distraction_device'],
  aliases: {
    fr: ['rack diversion', 'rack grenades', 'grenades', 'rack'],
    en: ['distraction rack', 'grenades', 'rack'],
  },
  descriptions: {
    intact: "Rack contenant des grenades flash et des générateurs de bruit. Utiles pour détourner l'attention d'un prédateur.",
    empty: "Le rack est vide. Les dispositifs de diversion ont été pris.",
  },
  interactions: [
    {
      trigger: { verb: 'TAKE', requiredState: 'intact' },
      onSuccess: {
        newState: 'empty',
        narrative: {
          fr: "Vous prenez une grenade flash et un générateur de bruit portable. Des leurres — pas des armes. Mais dans un jeu de chat et de souris, le leurre peut faire toute la différence.",
          en: "You take a flash grenade and a portable noise generator. Decoys, not weapons.",
        },
        revealsItems: ['distraction_device'],
      },
    },
  ],
}
```

**`blast_door_partial`** — featureType: `'door'`
```typescript
{
  id: 'blast_door_partial',
  featureType: 'door',
  initialState: 'damaged',
  extraProperties: ['metallic', 'large', 'damaged', 'reinforced', 'openable'],
  aliases: {
    fr: ['porte blindée', 'porte', 'porte endommagée', 'blast door'],
    en: ['blast door', 'door', 'damaged door'],
  },
  descriptions: {
    damaged: "Porte blindée coincée à mi-course. Des marques de griffes témoignent d'une force terrifiante. Le mécanisme est bloqué.",
    open: "Porte blindée forcée ouverte. Le passage vers le point d'extraction est libre.",
  },
  interactions: [
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', stat: 'FOR', dc: 13 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Vous agrippez le bord de la porte et poussez de toute votre force. Le mécanisme cède dans un grincement métallique. La porte s'ouvre — de l'autre côté, la baie d'extraction. La navette est proche.",
          en: "You grip the door edge and push. The mechanism yields. Beyond — the extraction bay.",
        },
        revealsExit: 'escalation_to_boss',
      },
      onFailure: {
        narrative: {
          fr: "La porte refuse de bouger. Le mécanisme est solidement coincé. Il faudrait un levier, un outil, ou une approche différente.",
          en: "The door won't budge.",
        },
      },
    },
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'damaged', requiredItem: 'salvage_tool' },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "L'outil de récupération fait levier. Le mécanisme cède. La porte blindée coulisse — la baie d'extraction s'ouvre devant vous.",
          en: "The salvage tool levers the mechanism. The door slides open.",
        },
        revealsExit: 'escalation_to_boss',
      },
    },
  ],
}
```

#### Item Enrichi

**`distraction_device`** — itemType: `'consumable'`
```typescript
{
  id: 'distraction_device',
  itemType: 'consumable',
  revealedBy: { featureId: 'distraction_rack', requiredState: 'empty' },
  extraProperties: ['electronic', 'small', 'consumable', 'noisy'],
  aliases: {
    fr: ['grenade', 'leurre', 'diversion', 'grenade flash', 'générateur bruit'],
    en: ['grenade', 'decoy', 'distraction', 'flash', 'noise maker'],
  },
  description: {
    fr: "Grenade flash + générateur de bruit. Combinés, ils créent une diversion parfaite — lumière aveuglante et son désorientant. Usage unique.",
    en: "Flash grenade + noise generator. A perfect distraction. Single use.",
  },
  useOn: [
    {
      targetId: 'creature_hunter',
      onSuccess: {
        narrative: {
          fr: "Flash ! Le blanc aveuglant se combine avec le hurlement du générateur de bruit. La créature se tord, désorientée, et s'éloigne en titubant vers les ombres. Le leurre a marché — vous avez une fenêtre de quelques minutes.",
          en: "Flash! Blinding white combines with the noise generator's scream. The creature staggers away.",
        },
        consumeItem: true,
        consequences: [{ type: 'stalker_clock_decrement', amount: 4 }],
      },
    },
  ],
}
```

---

### 3.5 BOSS — Point d'Extraction (climax, tension 10)

**Ambiance** : La baie d'extraction. Une navette de secours, cabossée mais fonctionnelle. L'écoutille est ouverte. Derrière vous, le couloir où la créature rôde. Devant vous, la liberté. Mais la créature se dresse entre vous et la navette. Et Okonkwo peut à peine se tenir debout.

**C'est le moment du choix.**

#### Features Enrichies

**`shuttle_hatch`** — featureType: `'door'` — **OBJECTIF**
```typescript
{
  id: 'shuttle_hatch',
  featureType: 'door',
  initialState: 'open',
  extraProperties: ['metallic', 'vehicle', 'critical'],
  aliases: {
    fr: ['écoutille', 'navette', 'sas navette', 'hatch'],
    en: ['hatch', 'shuttle', 'shuttle hatch'],
  },
  descriptions: {
    open: "L'écoutille de la navette d'évacuation. Le système est fonctionnel — la navette peut décoller dès que tout le monde est à bord. Ou dès que vous décidez qui monte.",
  },
  interactions: [
    // VICTOIRE PRIMAIRE : entrer dans la navette AVEC escorte active
    {
      trigger: { verb: 'ENTER', requiredFlag: 'escort_active' },
      onSuccess: {
        narrative: {
          fr: "Vous aidez la Dr. Okonkwo à monter dans la navette. Elle s'accroche à vous, épuisée mais vivante. \"Merci\", murmure-t-elle. Vous lancez le décollage. La créature hurle en contrebas, impuissante, tandis que la navette s'arrache au sol. Vous l'avez sauvée.",
          en: "You help Dr. Okonkwo into the shuttle. 'Thank you,' she whispers. You launch.",
        },
        consequences: [
          { type: 'npc_relocate', npcId: 'dr_okonkwo', locationId: 'resolution' },
          { type: 'flag_set', flag: 'both_in_shuttle' },
        ],
        revealsExit: 'boss_to_resolution',
      },
    },
    // VICTOIRE ALTERNATIVE : entrer SANS escorte (choix sombre)
    {
      trigger: { verb: 'ENTER' },
      onSuccess: {
        narrative: {
          fr: "Vous montez dans la navette. Seul. Derrière vous, la Dr. Okonkwo vous regarde, incrédule. \"Non... non, attendez !\" Vous fermez l'écoutille. Le moteur rugit. Son visage disparaît derrière la vitre. Vous êtes en vie. C'est ce qui compte. N'est-ce pas ?",
          en: "You board the shuttle. Alone. 'No... wait!' Her face disappears behind the glass.",
        },
        flagSet: 'okonkwo_abandoned',
        revealsExit: 'boss_to_resolution',
      },
    },
    // UTILISER OKONKWO COMME APPÂT (choix très sombre)
    {
      trigger: { verb: 'USE', requiredFlag: 'escort_active', stat: 'CHA', dc: 0 },
      onSuccess: {
        narrative: {
          fr: "\"Docteur, il faut distraire la créature. C'est vous qu'elle veut.\" Le visage d'Okonkwo se décompose. La compréhension. Puis, lentement, elle acquiesce. \"Je l'ai créée. C'est... juste.\" Elle s'éloigne vers le couloir, boitant. La créature se détourne de vous pour suivre sa créatrice. Le chemin vers la navette est libre.",
          en: "'Doctor, the creature wants you.' Her face crumbles. Then she nods. 'I created it. It's... fair.'",
        },
        flagSet: 'okonkwo_used_as_bait',
        consequences: [
          { type: 'npc_relocate', npcId: 'dr_okonkwo', locationId: 'escalation' },
          { type: 'flag_set', flag: 'escort_active_ended' },
          { type: 'flag_unset', flag: 'escort_active' },
        ],
      },
    },
  ],
}
```

**`acoustic_trap_point`** — featureType: `'panel'` — **VICTOIRE ÉMERGENTE**
```typescript
{
  id: 'acoustic_trap_point',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['acoustic', 'resonant', 'critical'],
  aliases: {
    fr: ['piège', 'piège acoustique', 'point piège', 'piège sonique'],
    en: ['trap', 'acoustic trap', 'trap point', 'sonic trap'],
  },
  descriptions: {
    intact: "Point idéal pour un piège acoustique. La géométrie concentre les ondes sonores comme un amplificateur naturel. Avec le composant sonique, vous pourriez confiner la créature ici — définitivement.",
    activated: "Le piège acoustique est actif. Un mur de son invisible confine la créature dans un périmètre de quelques mètres. Elle hurle, se cogne contre les murs sonores. Piégée.",
  },
  interactions: [
    {
      trigger: { verb: 'USE', requiredItem: 'sonic_emitter_component', requiredFlag: 'acoustic_info_received' },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: "Vous fixez le composant au point optimal. Activation. Le son explose — inaudible pour vous, apocalyptique pour la créature. Les murs acoustiques amplifient le signal x100. Une cage de son invisible. La créature se tord, hurle, tente de fuir — mais le son est partout. Confinée. Neutralisée. Pour toujours.",
          en: "You attach the component to the optimal point. Activation. Sound explodes. The creature is trapped.",
        },
        flagSet: 'creature_contained',
        consumeItem: true,
      },
    },
    {
      trigger: { verb: 'EXAMINE' },
      onSuccess: {
        narrative: {
          fr: "La géométrie est parfaite — les murs forment un entonnoir acoustique naturel. Un émetteur sonique placé ici créerait une zone de résonance infranchissable pour une créature sensible aux hautes fréquences. La Dr. Okonkwo a choisi cet endroit pour ses expériences pour une raison.",
          en: "Perfect geometry — a natural acoustic funnel.",
        },
      },
    },
  ],
}
```

**`extraction_bay_door`** — featureType: `'door'`
```typescript
{
  id: 'extraction_bay_door',
  featureType: 'door',
  initialState: 'damaged',
  extraProperties: ['metallic', 'large', 'damaged', 'repairable'],
  aliases: {
    fr: ['porte extraction', 'porte baie', 'baie extraction'],
    en: ['bay door', 'extraction door'],
  },
  descriptions: {
    damaged: "Porte de la baie d'extraction. Le mécanisme est endommagé — la porte est entrouverte mais pas assez pour passer.",
    open: "Porte de la baie ouverte. La navette attend de l'autre côté.",
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 11 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Vous reconnectez le circuit hydraulique. La porte s'ouvre dans un sifflement pneumatique. La navette est là — le cockpit allumé, les moteurs en veille.",
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
          fr: "Vous forcez la porte. Le mécanisme grince, proteste, puis cède. La navette d'extraction est enfin accessible.",
          en: "You force the door. The extraction shuttle is finally accessible.",
        },
        flagSet: 'extraction_door_opened',
      },
    },
  ],
}
```

---

### 3.6 RESOLUTION — Décollage (resolution, tension 3)

**`shuttle_cockpit`** — featureType: `'terminal'`, décoratif
```typescript
{
  id: 'shuttle_cockpit',
  featureType: 'terminal',
  initialState: 'active',
  decorative: true,
  aliases: {
    fr: ['cockpit', 'poste pilotage', 'commandes'],
    en: ['cockpit', 'controls'],
  },
  descriptions: {
    active: "Le cockpit de la navette. Systèmes en ligne, moteurs prêts. L'écran affiche les coordonnées de retour vers la flotte. Un bouton : DÉCOLLAGE.",
  },
  interactions: [
    {
      trigger: { verb: 'ACTIVATE' },
      onSuccess: {
        narrative: {
          fr: "Vous appuyez sur DÉCOLLAGE. Les moteurs rugissent. La station s'éloigne en dessous — avec ses secrets, ses monstres, ses morts. Ce qui s'est passé ensuite dépend de vos choix.",
          en: "You press LAUNCH. The engines roar. The station falls away below.",
        },
      },
    },
  ],
}
```

---

## 4. Conditions de Victoire — Détail

### Victoire Primaire : Escorte Vivante
```typescript
{
  type: 'escort_alive',
  npcId: 'dr_okonkwo',
  locationId: 'resolution',
}
```
**Chemin critique** : trouver stabilisateur → stabiliser Okonkwo → escorter → entrer navette ensemble → MOVE resolution.

**Ton narratif de résolution** : espoir. La culpabilité d'Okonkwo pèse, mais elle est vivante. Ses connaissances sur la créature pourraient sauver d'autres vies.

### Victoire Alternative : Atteindre la Navette (Seul)
```typescript
{
  type: 'reach_location',
  locationId: 'resolution',
}
```
**Chemin** : abandonner ou sacrifier Okonkwo → entrer navette seul → MOVE resolution.

**Ton narratif de résolution** : sombre. Le joueur a survécu, mais le poids du choix le suivra. Le Black Box du joueur racontera l'histoire complète.

### Victoire Émergente : Piège Acoustique
```typescript
// Mapped via containment — creature_hunter contained in escalation/boss
{
  type: 'containment',
  entityId: 'creature_hunter',
}
```
**Setup multi-étapes** (minimum 3 tours) :
1. Trouver le composant sonique (reveal)
2. Apprendre la faiblesse acoustique (TALK Okonkwo ou READ terminal)
3. Aller au point de piège (boss)
4. USE sonic_emitter_component ON acoustic_trap_point → creature_contained

**Mapping flags** (dans `scenarioFlagMapper.ts`) :
```typescript
case 'rescue':
  if (flags['creature_contained']) {
    effects.fullyContainedLocations.push('boss');
  }
  break;
```

---

## 5. Condition de Défaite Spécifique

```typescript
additionalDefeatConditions: [
  { type: 'npc_death', npcId: 'dr_okonkwo' },
]
```

La Dr. Okonkwo meurt si :
- La créature l'attaque directement (conséquence de certains échecs en escalation/boss)
- Le joueur ne la stabilise jamais et trop de tours passent dans les zones dangereuses
- Le joueur fait un choix catastrophique (BREAK la barricade avec Okonkwo derrière, etc.)

**Défaite narrative** : "La Dr. Okonkwo s'effondre. Le stabilisateur... trop tard. Le signal de détresse s'éteint. Vous avez échoué. La dernière personne qui connaissait la vérité sur le Projet Chasseur est morte."

---

## 6. Mapping scenarioFlagMapper.ts — Extension RESCUE

```typescript
case 'rescue':
  // Victoire émergente — créature piégée acoustiquement
  if (flags['creature_contained']) {
    effects.fullyContainedLocations.push('boss');
  }
  // Atmosphère : brèche scellée → pressurized dans start
  // (géré localement via consequence atmosphere_change, pas ici)
  break;
```

---

## 7. Dilemme Items : Le Triangle Sonique

Le composant sonique (`sonic_emitter_component`) a **3 utilisations possibles**, toutes mutuellement exclusives (consumeItem: true) :

```
                    sonic_emitter_component
                    /          |          \
                   /           |           \
    USE ON creature     USE ON trap_point     USE ON beacon_broken
    (dégâts + répit)    (VICTOIRE ÉMERGENTE)  (répare balise)
    
    Tactique immédiate   Stratégie brillante    Sacrifice pour
    mais non-permanente  qui neutralise la      espoir de secours
                         créature               extérieur
```

Le joueur doit choisir. S'il utilise le composant sur la créature directement, il gagne un répit mais perd la possibilité du piège acoustique. S'il répare la balise avec, il gagne un signal de secours mais perd toute défense sonique. Le piège acoustique est la "meilleure" option mais nécessite d'avoir parlé à Okonkwo + d'arriver au point de piège avec le composant intact.

**C'est du game design émergent pur** — le joueur découvre les options au fil du jeu, pas dans un menu.

---

## 8. Résumé du Contenu

### Compteurs

| Métrique | ESCAPE (C2) | INVESTIGATE (C4) | RESCUE (C5) |
|----------|-------------|-------------------|-------------|
| Features enrichies | 16 | 15 | 14 |
| Items enrichis | 8 | 5 | 7 |
| NPCs enrichis | — | — | 2 (Okonkwo + creature) |
| Interactions totales | ~50 | ~65 | ~55 |
| Flags scénario | ~8 | ~20 | ~15 |
| Chemins par obstacle | 3-4 | 4-5 | 3-4 |

### Flags Scénario RESCUE

```
shuttle_searched, breach_sealed, breach_examined, 
detour_found, corridor_cleared_tool, noise_made_unlock,
okonkwo_found, okonkwo_patched, okonkwo_stabilized, 
escort_active, project_hunter_read, creature_learns_discovered,
acoustic_info_received, acoustic_potential_noted,
creature_repelled_escalation, blast_door_widened,
extraction_door_opened, backup_beacon_active,
both_in_shuttle, okonkwo_abandoned, okonkwo_used_as_bait,
creature_contained, escort_active_ended, has_sonic_emitter
```

---

## 9. Plan de Tests

### 9.1 Tests Unitaires — Par Nœud

| Fichier | Vérifie | # Tests |
|---------|---------|---------|
| `tests/unit/content/scenarios/rescue/start.test.ts` | 4 features enrichies, 3 items, revealedBy, brèche → atmosphère | 10 |
| `tests/unit/content/scenarios/rescue/unlock.test.ts` | Gate obstacle 4 chemins, plasma cutter bruit, détour | 8 |
| `tests/unit/content/scenarios/rescue/reveal.test.ts` | NPC interactions, stabilisation, sonic emitter, terminal | 10 |
| `tests/unit/content/scenarios/rescue/escalation.test.ts` | Créature combat, acoustic walls, diversion, blast door | 8 |
| `tests/unit/content/scenarios/rescue/boss.test.ts` | 3 choix moraux, piège acoustique, extraction | 12 |

**Total unitaire : 48 tests**

### 9.2 Tests d'Intégration E2E

| # | Test | Chemin |
|---|------|--------|
| 1 | Playthrough primaire complet | stabiliser → escorter → navette ensemble → victoire primaire |
| 2 | Playthrough victoire alternative | ne pas stabiliser → navette seul → victoire alternative |
| 3 | Playthrough appât | stabiliser → escorter → utiliser comme appât → victoire alt sombre |
| 4 | Victoire émergente piège | sonic sur trap_point → creature_contained → victoire émergente |
| 5 | Triangle sonique : réparation balise | sonic sur beacon → balise active, pas de piège possible |
| 6 | Triangle sonique : usage direct | sonic sur créature → dégâts, pas de piège possible |
| 7 | Gate obstacle : FOR pur | FORCE_OPEN couloir → passage + dégâts |
| 8 | Gate obstacle : PER détour | EXAMINE → detour_found → OPEN trappe |
| 9 | Gate obstacle : plasma cutter | TAKE plasma → USE plasma → passage + stalker clock |
| 10 | NPC mort = défaite | créature attaque Okonkwo → npc_death defeat |
| 11 | Brèche scellée → atmosphère | REPAIR hull_breach → pressurized → drain O₂ = 0 |
| 12 | Escorte NPC suit le joueur | MOVE_TO escalation → dr_okonkwo.locationId = 'escalation' |

**Total intégration : 12 tests**

### 9.3 Tests de Stress

| # | Test |
|---|------|
| 1 | 500 tours random sans crash |
| 2 | 100 playthroughs guidés (primaire × 50, alt × 25, émergente × 25) |
| 3 | Aucun softlock (bot random × 1000) |

**Total stress : 3 tests**

### Résumé Tests

```
Tests unitaires     :  48
Tests intégration   :  12
Tests stress        :   3
─────────────────────────
TOTAL               :  63 nouveaux tests
```

---

## 10. Fichiers à Créer/Modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `src/content/scenarios/rescue_enriched.ts` | **NOUVEAU** | Tout le contenu enrichi |
| `src/content/scenarios/rescue.ts` | MODIFIÉ | Import depuis rescue_enriched ou remplacement |
| `src/engine/scenarioFlagMapper.ts` | MODIFIÉ | Ajouter case `'rescue'` |
| `src/engine/consequences.ts` | MODIFIÉ | Ajouter type `npc_relocate` (~10 lignes) |
| `tests/unit/content/scenarios/rescue/*.test.ts` | **NOUVEAU** | 5 fichiers, 48 tests |
| `tests/integration/rescueEndToEnd.test.ts` | **NOUVEAU** | 12 tests |
| `tests/stress/rescueFullStress.test.ts` | **NOUVEAU** | 3 tests |
| `CLAUDE.md` | MODIFIÉ | Status Chantier 5 |

**Total : 9 fichiers (4 nouveaux, 5 modifiés), ~63 tests, ~10 lignes de code moteur**

---

## 11. Critères d'Acceptation

```bash
npm run check                                        # ✅ 0 erreurs
npm test -- rescue/start                              # ✅ 10 tests
npm test -- rescue/unlock                             # ✅ 8 tests
npm test -- rescue/reveal                             # ✅ 10 tests
npm test -- rescue/escalation                         # ✅ 8 tests
npm test -- rescue/boss                               # ✅ 12 tests
npm test -- rescueEndToEnd                            # ✅ 12 tests
npm run test:stress -- rescueFullStress               # ✅ 3 tests stress
npm test                                             # ✅ TOUS tests existants passent
```

### Le Test Ultime — Le Playthrough Émotionnel

```
1. START — Site de Crash
   "fouiller les débris" → outil de récupération trouvé
   "forcer la navette" → stabilisateur médical révélé
   "prendre le stabilisateur"
   "réparer la brèche" → atmosphère stabilisée

2. UNLOCK — Point de Triage
   "examiner le couloir effondré" → détour repéré (PER DC 11)
   "ouvrir la trappe" → passage silencieux
   (alt: "utiliser le découpeur plasma" → passage bruyant, stalker +2)

3. REVEAL — Emplacement de la Survivante
   "parler à la survivante" → révélation Projet Chasseur
   "soigner okonkwo avec stabilisateur" → escorte activée
   "prendre le composant sonique" → arme clé en main
   "lire le terminal" → la créature apprend (détail crucial)

4. ESCALATION — La Traque
   "examiner les parois acoustiques" → potentiel noté
   La créature apparaît. "utiliser la grenade flash sur la créature" → répit
   "forcer la porte blindée" → passage vers l'extraction

5. BOSS — Point d'Extraction

   Chemin A (empathique) :
   "entrer dans la navette" (avec escorte) → victoire primaire
   "Merci", murmure-t-elle. La navette décolle.

   Chemin B (sombre) :
   "entrer dans la navette" (seul) → victoire alternative
   "Non... attendez !" Son visage disparaît derrière la vitre.

   Chemin C (ingénieux) :
   "utiliser composant sonique sur piège acoustique" → VICTOIRE ÉMERGENTE
   La créature est confinée. Tout le monde survit. Le meilleur dénouement.
```

---

## 12. Hors Périmètre

- ❌ Système d'escorte NPC natif (suivi automatique) — simulé via flags + conséquences `npc_relocate`
- ❌ Timer de restabilisation automatique — géré narrativement, pas mécaniquement
- ❌ Créature qui apprend dynamiquement (adaptation aux stimuli) — mentionné dans les textes, pas implémenté mécaniquement
- ❌ Modules universels enrichis (→ Chantier futur)
- ❌ Crafting combinatoire (assembler émetteur + pièces) — le composant est utilisable directement
- ❌ Fins multiples détaillées dans la résolution (→ chantier narratif futur, textes de fin étendus)

---

## 13. Note de Design : Pourquoi RESCUE est le Meilleur en Dernier

RESCUE teste les systèmes les plus exigeants du pipeline :
- **Interactions NPC** : TALK, HEAL, USE item ON npc — les 3 doivent fonctionner
- **Conséquences NPC** : `npc_relocate`, `heal targetId`, `npc_death` defeat
- **Choix moral** : interactions mutuellement exclusives sur le même objet (shuttle_hatch)
- **Item triangle** : 3 utilisations exclusives du même item (sonic_emitter_component)
- **Flag cascades** : `okonkwo_stabilized` → `escort_active` → `npc_relocate` sur MOVE → `escort_alive` victory

Si RESCUE fonctionne de bout en bout, **les 3 skeletons sont prouvés**. Le pipeline est complet. Le moteur est prêt pour les modules, le threat director, et le contenu additionnel.
