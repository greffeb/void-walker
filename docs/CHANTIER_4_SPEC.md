# Chantier 4 — Enrichissement INVESTIGATE "Signal Perdu"

> **Référence d'implémentation pour Claude Code (Opus)**
> **Prérequis** : Chantiers 1–3 terminés (infrastructure enrichie, ESCAPE complet, câblage E2E opérationnel)
> **Durée estimée** : 1 semaine
> **Nature** : contenu pur — le pipeline C3 consomme automatiquement les définitions enrichies
> **Pattern** : identique au Chantier 2, appliqué au skeleton INVESTIGATE

---

## 1. Rappel : Pipeline Prouvé

```
Chantier 1 : types ScenarioFeatureDefinition, interactionResolver, featureState
Chantier 2 : ESCAPE enrichi — 16 features, 8 items, ~50 interactions
Chantier 3 : câblage E2E — scene.ts, processTurn step 4b, victory flags, narrative override
                           ↓
        Le pipeline est opérationnel. Toute définition enrichie
        est automatiquement : résolue en propriétés, visible/cachée
        selon revealedBy, parsée par aliases, résolue en interaction
        scénario, narrée par override, mappée vers la victoire.
```

Le Chantier 4 produit uniquement du **contenu déclaratif** dans le format prouvé par C2. Zéro modification de code moteur.

---

## 2. Identité d'INVESTIGATE vs ESCAPE

| Dimension | ESCAPE | INVESTIGATE |
|-----------|--------|-------------|
| Fantasy | Survie, fuite | Enquête, vérité |
| Antagoniste | Créature bio (physique) | IA de station (systémique) |
| Verbes dominants | FORCE, OPEN, RUN | HACK, READ, EXAMINE, TALK |
| Tension dramatique | Asphyxie progressive | Compte à rebours réacteur + IA hostile |
| Gate mechanic | Badge physique → porte | Data core → décryptage terminal |
| Révélation | Arme biologique | Fraude à l'assurance, équipage sacrifié |
| Boss | Fuite physique (escape pod) | Puzzle logique (balise vs IA) |
| Victoire alt. | Environmental kill (vide spatial) | Auto-destruction station |
| Victoire émergente | Brèche coque (FOR) | Reroutage comms (INT multi-étapes) |
| Ton narratif | Claustrophobie, urgence physique | Paranoïa, trahison systémique |

**Conséquence sur le design** : INVESTIGATE est le scénario "INT/PER/CHA". Chaque nœud doit offrir au moins un chemin cerveau en plus des chemins force. Les terminaux sont interactifs, pas décoratifs. L'IA est un antagoniste invisible qui manipule l'environnement.

---

## 3. Enrichissement Nœud par Nœud

### 3.1 START — Baie d'Amarrage (intro, tension 2)

**Ambiance** : Station silencieuse. Trop propre. L'air est respirable mais quelque chose cloche — pas de bruit de fond, pas de vibrations de machines. Le silence d'un organisme mort.

#### Features Enrichies

**`docking_airlock`** — featureType: `'door'`
```typescript
{
  id: 'docking_airlock',
  featureType: 'door',
  initialState: 'open',
  extraProperties: ['metallic', 'sealed', 'reinforced'],
  aliases: {
    fr: ['sas', 'airlock', 'sas amarrage', 'porte sas'],
    en: ['airlock', 'docking', 'door'],
  },
  descriptions: {
    open: "Le sas d'amarrage est ouvert — votre navette est arrimée de l'autre côté. Les indicateurs de pression sont normaux. Votre seul moyen de quitter la station.",
    closed: "Le sas d'amarrage est scellé. Le voyant indique VERROUILLAGE AUTOMATIQUE. L'IA a coupé l'accès à votre navette.",
    broken: "Le mécanisme du sas est détruit. L'accès à la navette est bloqué physiquement.",
  },
  interactions: [
    {
      trigger: { verb: 'EXAMINE', requiredState: 'open' },
      onSuccess: {
        narrative: {
          fr: "Les jauges de pression sont stables. Votre navette attend de l'autre côté, silencieuse. Le manifeste de vol indique un temps de trajet retour de 14 heures vers la flotte.",
          en: "Pressure gauges are stable. Your shuttle waits on the other side, silent.",
        },
      },
    },
    {
      trigger: { verb: 'CLOSE', requiredState: 'open' },
      onSuccess: {
        newState: 'closed',
        narrative: {
          fr: "Vous scellez le sas derrière vous. Verrouillage magnétique activé. Personne n'entre — personne ne sort sans votre autorisation.",
          en: "You seal the airlock behind you. Magnetic lock engaged.",
        },
        flagSet: 'airlock_sealed_by_player',
      },
    },
  ],
}
```

**`cargo_manifest_terminal`** — featureType: `'terminal'`
```typescript
{
  id: 'cargo_manifest_terminal',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'readable', 'powered', 'hackable'],
  aliases: {
    fr: ['manifeste', 'terminal cargo', 'terminal manifeste', 'écran cargo'],
    en: ['manifest', 'cargo terminal'],
  },
  descriptions: {
    active: "Terminal du manifeste cargo. L'écran défile lentement — le dernier chargement répertorié remonte à 3 mois.",
    broken: "Terminal détruit. L'écran est noir, le boîtier fracturé.",
  },
  readableContent: {
    fr: "MANIFESTE CARGO — Station Phoebe-7\n\nEntrée 2247-03-14 : 'Matériel de recherche avancée — Autorisation Directrice Vasquez uniquement'\nContenu : [CLASSIFIÉ — NIVEAU 4]\nOrigine : Consortium Heliox, Division R&D\nNote marge : 'NE PAS scanner au contrôle douanier'",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'READ' },
      onSuccess: {
        narrative: {
          fr: "Le manifeste dévoile un chargement suspect daté d'il y a 3 mois : matériel classifié, autorisation Vasquez uniquement. La note en marge — 'NE PAS scanner au contrôle douanier' — en dit long.",
          en: "The manifest reveals a suspicious shipment dated 3 months ago.",
        },
        flagSet: 'manifest_read',
      },
    },
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 10 },
      onSuccess: {
        narrative: {
          fr: "Accès étendu. Logs de communication masqués : Vasquez a personnellement réceptionné le chargement, seule, à 03h00. Les caméras de la baie étaient désactivées ce jour-là.",
          en: "Extended access. Hidden comms logs revealed.",
        },
        flagSet: 'manifest_hacked',
      },
      onFailure: {
        narrative: {
          fr: "Le système rejette votre tentative. ACCÈS REFUSÉ clignote en rouge. Au moins le manifeste de surface est lisible.",
          en: "The system rejects your attempt.",
        },
      },
    },
  ],
}
```

**`docking_clamps`** — featureType: `'panel'`
```typescript
{
  id: 'docking_clamps',
  featureType: 'panel',
  initialState: 'active',
  extraProperties: ['metallic', 'mechanical', 'critical'],
  aliases: {
    fr: ['pinces', 'amarrage', 'pinces amarrage', 'système amarrage'],
    en: ['clamps', 'docking clamps'],
  },
  descriptions: {
    active: "Les pinces d'amarrage maintiennent votre navette en position. Le système de largage rapide est fonctionnel — pour un départ précipité.",
    broken: "Les pinces sont détruites. Votre navette dérive lentement — le câble de secours la retient encore, mais pas pour longtemps.",
    deactivated: "Les pinces se sont rétractées. Votre navette est libre de manœuvrer — le chemin du retour est ouvert.",
  },
  interactions: [
    {
      trigger: { verb: 'EXAMINE', requiredState: 'active' },
      onSuccess: {
        narrative: {
          fr: "Système d'amarrage standard. Commande de largage d'urgence accessible. Temps de découplage estimé : 12 secondes. Votre police d'assurance si les choses tournent mal.",
          en: "Standard docking system. Emergency release accessible.",
        },
      },
    },
    {
      trigger: { verb: 'SABOTAGE', requiredState: 'active', stat: 'INT', dc: 14 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: "Vous sabotez les pinces. Elles se rétractent dans un grincement — votre navette décroche lentement. Plus de retour facile. Mais l'IA ne pourra pas non plus verrouiller votre navette.",
          en: "You sabotage the clamps. No easy return — but the AI can't lock your shuttle either.",
        },
        flagSet: 'clamps_sabotaged',
      },
      onFailure: {
        narrative: {
          fr: "Le mécanisme résiste. Les pinces sont conçues pour supporter des impacts d'astéroïdes — vos outils ne suffisent pas.",
          en: "The mechanism resists.",
        },
      },
    },
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'active', stat: 'INT', dc: 8 },
      onSuccess: {
        newState: 'deactivated',
        narrative: {
          fr: "Largage exécuté. Les pinces se rétractent proprement. Votre navette s'écarte de quelques mètres — prête pour un départ rapide.",
          en: "Release executed. Clamps retract cleanly.",
        },
        flagSet: 'shuttle_released',
      },
    },
  ],
}
```

#### Items Enrichis

**`scanner_device`** — itemType: `'tool'`
```typescript
{
  id: 'scanner_device',
  itemType: 'tool',
  extraProperties: ['electronic', 'small', 'powered', 'scanning'],
  aliases: {
    fr: ['scanner', 'détecteur', 'appareil', 'scanner portable'],
    en: ['scanner', 'detector', 'device'],
  },
  description: {
    fr: "Scanner portable multi-fréquence. Détecte les anomalies biologiques et électroniques dans un rayon de 10 mètres. Batterie à 89%.",
    en: "Portable multi-frequency scanner.",
  },
  useOn: [
    {
      targetId: 'wall_safe',
      onSuccess: {
        narrative: {
          fr: "Le scanner révèle un compartiment caché derrière le coffre — un double fond. Le mécanisme d'ouverture secondaire est électronique.",
          en: "The scanner reveals a hidden compartment behind the safe.",
        },
        flagSet: 'safe_scanned',
      },
    },
    {
      targetId: 'ai_core_node_a',
      onSuccess: {
        narrative: {
          fr: "Le scanner détecte un flux de données anormal : l'IA exécute un programme d'effacement massif. 67% des logs de la station sont déjà détruits.",
          en: "The scanner detects abnormal data flow.",
        },
        flagSet: 'ai_scan_revealed',
      },
    },
    {
      targetId: 'reactor_core',
      onSuccess: {
        narrative: {
          fr: "Lectures alarmantes. Le cœur du réacteur montre des micro-fractures dans le confinement — pas un accident, des charges de sabotage placées chirurgicalement. Vasquez savait exactement où frapper.",
          en: "Alarming readings. Micro-fractures in containment — not an accident.",
        },
        flagSet: 'reactor_sabotage_confirmed',
      },
    },
  ],
}
```

**`standard_toolkit`** — itemType: `'tool'`
```typescript
{
  id: 'standard_toolkit',
  itemType: 'tool',
  extraProperties: ['metallic', 'tool', 'mechanical', 'small'],
  aliases: {
    fr: ['outils', 'trousse', 'trousse outils', 'boîte outils', 'kit'],
    en: ['toolkit', 'tools', 'tool kit'],
  },
  description: {
    fr: "Trousse à outils standard d'intervention. Tournevis magnétiques, pince multifonction, testeur de circuits.",
    en: "Standard intervention toolkit.",
  },
  useOn: [
    {
      targetId: 'maintenance_terminal',
      onSuccess: {
        narrative: {
          fr: "Vous ouvrez le boîtier du terminal et pontez le circuit endommagé. L'écran s'illumine — accès partiel restauré.",
          en: "You open the terminal casing and bridge the damaged circuit.",
        },
        flagSet: 'maintenance_terminal_repaired',
      },
    },
    {
      targetId: 'ai_core_node_a',
      onSuccess: {
        narrative: {
          fr: "Vous dévissez le panneau de maintenance du nœud. Les connecteurs de données sont exposés — il suffirait de déconnecter les fibres optiques principales.",
          en: "You unscrew the node's maintenance panel.",
        },
        flagSet: 'node_a_exposed',
      },
    },
    {
      targetId: 'override_terminal',
      onSuccess: {
        narrative: {
          fr: "Vous remplacez le circuit grillé du terminal de neutralisation. L'écran s'allume faiblement — le système est partiellement opérationnel.",
          en: "You replace the burned circuit. The screen lights up faintly.",
        },
        flagSet: 'override_terminal_repaired',
      },
    },
  ],
}
```

**`encrypted_data_core`** — itemType: `'key_item'`, hidden
```typescript
{
  id: 'encrypted_data_core',
  itemType: 'key_item',
  hidden: true,
  revealedBy: { featureId: 'cargo_manifest_terminal', requiredState: 'active' },
  // ↑ Alternative : revealé par HACK du terminal ou EXAMINE approfondi
  // En pratique, le data core est physiquement DERRIÈRE le terminal,
  // révélé quand le joueur interagit avec le terminal de quelque manière que ce soit
  extraProperties: ['electronic', 'small', 'encrypted', 'key'],
  aliases: {
    fr: ['noyau', 'données', 'noyau données', 'data core', 'puce', 'noyau chiffré'],
    en: ['data core', 'core', 'encrypted core'],
  },
  description: {
    fr: "Noyau de données lourdement chiffré — protocole militaire niveau 4. Contient les logs de la station des dernières 72 heures. La clé de déchiffrement est quelque part sur la station.",
    en: "Heavily encrypted data core — military-grade protocol.",
  },
  useOn: [
    {
      targetId: 'encrypted_terminal',
      onSuccess: {
        narrative: {
          fr: "Vous insérez le noyau de données. Le terminal ronronne, les barres de déchiffrement progressent. Accès aux logs : ACCORDÉ. Les communications de la station des 72 dernières heures se déversent à l'écran.",
          en: "You insert the data core. Decryption bars progress. Access: GRANTED.",
        },
        flagSet: 'terminal_decrypted',
        consumeItem: false,
      },
    },
  ],
}
```

#### Mécanique de Révélation du Data Core

Le `encrypted_data_core` est physiquement dissimulé dans un compartiment de données sous le terminal cargo. Il y a **3 manières** de le révéler :

1. **READ cargo_manifest_terminal** → le texte mentionne un compartiment de stockage, le joueur remarque le data core → `revealedBy` par défaut
2. **HACK cargo_manifest_terminal** (INT DC 10) → accès étendu + le système éjecte le data core physiquement
3. **EXAMINE cargo_manifest_terminal** poussé (2e fois ou PER DC 8) → le joueur remarque un tiroir encastré sous l'écran

Pour simplifier le système, on utilise un trick : `revealedBy` pointe vers le terminal avec `requiredState: 'active'` (toujours vrai au départ). Le data core est donc révélé dès que le joueur **interagit avec le terminal de quelque manière que ce soit**, car l'interaction scénario sur le terminal set un flag. On ajoute une interaction EXAMINE sur le terminal qui a pour effet secondaire de set un flag `manifest_examined` et qui trigger la révélation :

```typescript
// Alternative plus élégante : le data core n'est PAS revealedBy
// au sens automatique. Il est révélé par un flag :
{
  id: 'encrypted_data_core',
  hidden: true,
  revealedByFlag: 'manifest_examined',
  // Tout interaction sur cargo_manifest_terminal set ce flag
}
```

**Décision** : utiliser `revealedByFlag` si le Chantier 1 le supporte, sinon `revealedBy: { featureId: 'cargo_manifest_terminal', requiredState: 'active' }` avec le data core visible dès le premier EXAMINE du terminal. Le README du chantier 1 tranche.

---

### 3.2 UNLOCK — Centre de Communications (rising, tension 4)

**Ambiance** : Salle de contrôle faiblement éclairée. Les écrans clignotent avec des messages d'erreur en boucle. Un terminal central affiche ACCÈS RESTREINT en rouge sang. Le bloc-notes de la directrice traîne sur un bureau — sa négligence pourrait être votre salut.

#### Features Enrichies

**`encrypted_terminal`** — featureType: `'terminal'` — **GATE FEATURE**
```typescript
{
  id: 'encrypted_terminal',
  featureType: 'terminal',
  initialState: 'locked',
  extraProperties: ['electronic', 'locked', 'encrypted', 'powered', 'hackable', 'critical'],
  aliases: {
    fr: ['terminal chiffré', 'terminal crypté', 'terminal principal', 'terminal verrouillé', 'console chiffrée'],
    en: ['encrypted terminal', 'locked terminal', 'main terminal'],
  },
  descriptions: {
    locked: "Terminal de communications principal. L'écran rouge sang affiche 'ACCÈS RESTREINT — CLÉ DE CHIFFREMENT REQUISE'. Un slot pour noyau de données est visible sur le côté.",
    active: "Terminal déverrouillé. Les logs de la station défilent — 72 heures de communications, rapports d'incident, ordres confidentiels. La vérité est là, quelque part.",
    broken: "Terminal détruit. L'écran est fendu en étoile, les circuits grésillent. Les données sont inaccessibles par cette voie.",
  },
  interactions: [
    // Chemin 1 : USE data core (item-based, pas de jet)
    {
      trigger: { verb: 'USE', requiredState: 'locked', requiredItem: 'encrypted_data_core' },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Le noyau de données s'enclenche. Les algorithmes de déchiffrement s'exécutent — 3 secondes, 5, 12... L'écran passe au vert. ACCÈS ACCORDÉ. Les logs de la station se déversent à l'écran.",
          en: "The data core clicks in. Decryption algorithms execute. ACCESS GRANTED.",
        },
        flagSet: 'comms_unlocked',
        revealsExit: 'unlock_to_reveal',
      },
    },
    // Chemin 2 : HACK direct (INT, DC élevé — pas besoin de l'item)
    {
      trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 13 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Protocole militaire niveau 4 — mais pas sans failles. Vous exploitez une vulnérabilité dans le firmware de la station. L'accès s'ouvre. Les logs apparaissent.",
          en: "Military protocol — but not flawless. You exploit a firmware vulnerability.",
        },
        flagSet: 'comms_unlocked',
        revealsExit: 'unlock_to_reveal',
      },
      onFailure: {
        narrative: {
          fr: "Le chiffrement résiste. Le système enregistre votre tentative — un compteur d'intrusion s'incrémente. Encore 2 essais avant verrouillage total.",
          en: "Encryption holds. The system logs your attempt.",
        },
        flagSet: 'hack_attempt_logged',
      },
    },
    // Chemin 3 : Mot de passe trouvé dans les notes de la directrice (PER path)
    {
      trigger: { verb: 'USE', requiredState: 'locked', requiredFlag: 'password_found' },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Vous tapez le code trouvé dans les notes : 7-2-9-4. L'écran clignote. ACCÈS ACCORDÉ. La négligence de Vasquez aura au moins servi à quelque chose.",
          en: "You type the code from the notes: 7-2-9-4. ACCESS GRANTED.",
        },
        flagSet: 'comms_unlocked',
        revealsExit: 'unlock_to_reveal',
      },
    },
    // Chemin 4 : TALK à l'IA (CHA, DC 13 — avant qu'elle devienne hostile)
    {
      trigger: { verb: 'TALK', requiredState: 'locked', stat: 'CHA', dc: 13 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "'Demande d'accès enregistrée.' La voix synthétique de l'IA résonne dans la salle vide. 'Protocole d'urgence : accès temporaire accordé. Durée : 15 minutes.' Suffisant.",
          en: "'Access request logged.' The AI's synthetic voice echoes. 'Emergency protocol: temporary access granted.'",
        },
        flagSet: 'comms_unlocked',
        revealsExit: 'unlock_to_reveal',
      },
      onFailure: {
        narrative: {
          fr: "'Identifiants non reconnus. Personnel non autorisé détecté.' La voix de l'IA est glaciale. Les lumières de la salle passent à l'orange. Vous venez de vous faire repérer.",
          en: "'Credentials not recognized.' The AI's voice is cold.",
        },
        flagSet: 'ai_alerted',
      },
    },
    // Chemin 5 : BREAK (FOR, DC 14 — destruction, mais perd les données)
    {
      trigger: { verb: 'BREAK', requiredState: 'locked', stat: 'FOR', dc: 14 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: "Le terminal explose sous vos coups. Étincelles, fumée, silence. Les données sont détruites — mais le circuit de verrouillage de la porte adjacente a sauté en même temps. Passage libre, preuves perdues.",
          en: "The terminal shatters. Data destroyed — but the adjacent door lock shorted out too.",
        },
        flagSet: 'terminal_destroyed',
        revealsExit: 'unlock_to_reveal',
        consequences: [{ type: 'flag_set', flag: 'evidence_partially_lost' }],
      },
    },
  ],
}
```

**`maintenance_terminal`** — featureType: `'terminal'`
```typescript
{
  id: 'maintenance_terminal',
  featureType: 'terminal',
  initialState: 'damaged',
  extraProperties: ['electronic', 'damaged', 'powered', 'hackable', 'repairable'],
  aliases: {
    fr: ['terminal maintenance', 'terminal auxiliaire', 'terminal secondaire', 'console maintenance'],
    en: ['maintenance terminal', 'auxiliary terminal'],
  },
  descriptions: {
    damaged: "Terminal de maintenance auxiliaire. L'écran est fissuré, certaines fonctions sont accessibles. Les logs de maintenance montrent des interventions suspectes il y a 72 heures.",
    active: "Terminal réparé. Accès complet aux systèmes de maintenance — caméras, portes, ventilation. Un outil puissant.",
    broken: "Terminal complètement hors service. Plus rien à en tirer.",
  },
  interactions: [
    {
      trigger: { verb: 'READ', requiredState: 'damaged' },
      onSuccess: {
        narrative: {
          fr: "L'écran fissuré affiche des fragments : interventions non autorisées sur le confinement, exactement 72 heures avant le silence radio. Codes d'accès modifiés par 'ADMIN_VASQUEZ'. Elle a couvert ses traces — presque.",
          en: "The cracked screen shows fragments: unauthorized containment interventions.",
        },
        flagSet: 'maintenance_logs_read',
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 11 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Vous reconnectez les circuits endommagés. L'écran s'illumine — accès complet. Caméras, portes, ventilation — vous avez les yeux et les mains de la station.",
          en: "You reconnect the damaged circuits. Full access restored.",
        },
        flagSet: 'maintenance_control',
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', requiredItem: 'standard_toolkit' },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Le testeur de circuits identifie le composant grillé. Remplacement en 30 secondes. L'écran reprend vie — accès complet aux systèmes de maintenance.",
          en: "The circuit tester identifies the burned component. Quick replacement.",
        },
        flagSet: 'maintenance_control',
      },
    },
    {
      trigger: { verb: 'HACK', requiredState: 'active', stat: 'INT', dc: 12 },
      onSuccess: {
        narrative: {
          fr: "Vous accédez aux caméras de sécurité archivées. Enregistrement de la baie cargo, daté de 3 mois : Vasquez réceptionnant un chargement seule, à 03h00. Elle regarde par-dessus son épaule. Coupable.",
          en: "You access archived security cameras.",
        },
        flagSet: 'camera_evidence_found',
      },
    },
  ],
}
```

**`director_notes_clipboard`** — featureType: `'panel'`
```typescript
{
  id: 'director_notes_clipboard',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['readable', 'small', 'paper'],
  aliases: {
    fr: ['bloc-notes', 'notes', 'clipboard', 'notes directrice', 'carnet'],
    en: ['clipboard', 'notes', 'director notes'],
  },
  descriptions: {
    intact: "Le bloc-notes de la directrice. Notes manuscrites, écriture nerveuse. Des passages sont raturés avec insistance.",
    searched: "Le bloc-notes, déjà examiné. Les ratures sont toujours aussi suspectes.",
  },
  interactions: [
    {
      trigger: { verb: 'READ' },
      onSuccess: {
        narrative: {
          fr: "Notes manuscrites : 'Compte à rebours lancé. 72h avant procédure d'évacuation automatique. Vérifier que les logs sont effacés AVANT.' Le reste est raturé — mais un code est visible dans la marge : 7-2-9-4.",
          en: "Handwritten notes reveal a countdown and a code: 7-2-9-4.",
        },
        flagSet: 'password_found',
      },
    },
    {
      trigger: { verb: 'EXAMINE', stat: 'PER', dc: 10 },
      onSuccess: {
        narrative: {
          fr: "Sous les ratures, en appuyant la feuille contre la lumière, vous déchiffrez : 'Contact Heliox pour confirmation transfert. Police assurance n° HX-7741. Station vaut plus morte que vive.' La preuve de la fraude.",
          en: "Holding the paper to the light, you decipher hidden text under the strikethroughs.",
        },
        flagSet: 'fraud_note_deciphered',
      },
    },
  ],
}
```

---

### 3.3 REVEAL — Bureau de la Directrice (midpoint, tension 6)

**Ambiance** : Bureau luxueux par rapport au reste de la station. Moquette, lampes de bureau, art mural. L'endroit où les décisions fatales ont été prises. Un contraste glaçant avec la mort silencieuse de la station.

#### Features Enrichies

**`director_terminal`** — featureType: `'terminal'` — **REVELATION**
```typescript
{
  id: 'director_terminal',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'readable', 'powered', 'hackable'],
  aliases: {
    fr: ['terminal directrice', 'terminal vasquez', 'ordinateur', 'poste travail'],
    en: ['director terminal', 'vasquez terminal', 'computer'],
  },
  descriptions: {
    active: "Le terminal personnel de Vasquez. L'écran de veille montre le logo de la station — un phare dans les étoiles. Ironique.",
    broken: "Terminal détruit. Quelqu'un — ou quelque chose — a voulu effacer les preuves avant vous.",
  },
  readableContent: {
    fr: "CORRESPONDANCE CONFIDENTIELLE — Dir. Vasquez / Consortium Heliox\n\n[2247-01-08] HX: 'Confirmez le calendrier. Les assureurs ne soupçonnent rien.'\n[2247-01-15] V: 'Phase 2 en cours. Modifications confinement achevées. Le confinement cédera en 72h après activation.'\n[2247-02-28] V: 'Activation confirmée. Évacuation simulée dans 72h. Je serai partie avant.'\n[2247-03-01] V: 'Problème. Le Dr. Chen a découvert les modifications. Gérez-le.'\n[DERNIER MESSAGE] HX: 'Chen neutralisé. Procédez.'",
    en: "",
  },
  interactions: [
    {
      trigger: { verb: 'READ' },
      onSuccess: {
        narrative: {
          fr: "La correspondance Vasquez-Heliox s'affiche. Tout est là. Le calendrier de sabotage. Les assurances gonflées de 400%. L'ordre de 'neutraliser' le Dr. Chen. La catastrophe de Phoebe-7 n'est pas un accident — c'est un meurtre à l'échelle industrielle.",
          en: "The Vasquez-Heliox correspondence displays. Everything is here.",
        },
        flagSet: 'revelation_read',
      },
    },
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 12 },
      onSuccess: {
        narrative: {
          fr: "Accès aux fichiers supprimés. Vasquez a effacé les preuves les plus accablantes — mais la corbeille n'a pas été vidée. Erreur fatale. Vous récupérez les originaux : contrats, virements, rapports falsifiés.",
          en: "Deleted files recovered. Vasquez didn't empty the recycle bin.",
        },
        flagSet: 'classified_evidence_recovered',
      },
    },
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 15, requiredFlag: 'revelation_read' },
      onSuccess: {
        narrative: {
          fr: "Couche de chiffrement supplémentaire percée. Les coordonnées de Vasquez apparaissent : elle est sur la station Heliox-Prime, secteur 7. En sécurité. Pour l'instant.",
          en: "Extra encryption layer cracked. Vasquez's current coordinates appear.",
        },
        flagSet: 'vasquez_location_found',
      },
    },
  ],
}
```

**`wall_safe`** — featureType: `'container'`
```typescript
{
  id: 'wall_safe',
  featureType: 'container',
  initialState: 'locked',
  extraProperties: ['metallic', 'locked', 'container', 'reinforced'],
  contains: ['director_keycard'],
  aliases: {
    fr: ['coffre', 'coffre-fort', 'coffre mural', 'safe'],
    en: ['safe', 'wall safe'],
  },
  descriptions: {
    locked: "Coffre-fort mural encastré. Serrure à code numérique — 4 chiffres. Des rayures autour du clavier trahissent une utilisation fréquente.",
    open: "Coffre-fort ouvert. L'intérieur est capitonné — conçu pour protéger des documents sensibles.",
    broken: "Coffre-fort forcé. La porte est tordue, le mécanisme détruit.",
  },
  interactions: [
    // Code trouvé dans les notes : 7-2-9-4
    {
      trigger: { verb: 'OPEN', requiredState: 'locked', requiredFlag: 'password_found' },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "7-2-9-4. Le coffre s'ouvre avec un déclic satisfaisant. À l'intérieur : le badge de Vasquez. Niveau d'accès maximal.",
          en: "7-2-9-4. The safe clicks open.",
        },
        revealsItems: ['director_keycard'],
      },
    },
    // HACK la serrure électronique
    {
      trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 12 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Le clavier numérique a un port de diagnostic caché. Votre testeur de circuits le trouve. 3 essais simulés plus tard, le code apparaît : 7-2-9-4. Le coffre s'ouvre.",
          en: "The keypad has a hidden diagnostic port.",
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
          fr: "Métal contre métal. Le coffre résiste, puis cède dans un craquement. Le contenu est intact — mais le bruit a résonné dans toute la station. L'IA vous a certainement entendu.",
          en: "Metal against metal. The safe yields with a crack.",
        },
        revealsItems: ['director_keycard'],
        flagSet: 'noise_made_reveal',
        consequences: [{ type: 'stalker_clock_increment', amount: 2 }],
      },
    },
    // Scanner révèle le double-fond
    {
      trigger: { verb: 'EXAMINE', requiredState: 'locked', requiredFlag: 'safe_scanned' },
      onSuccess: {
        narrative: {
          fr: "Le scanner avait raison — un double-fond. En pressant la paroi intérieure, un compartiment secondaire s'ouvre. Un second badge : niveau administrateur réseau. L'IA elle-même pourrait être reprogrammée avec ça.",
          en: "The scanner was right — a false bottom.",
        },
        flagSet: 'admin_badge_found',
      },
    },
  ],
}
```

**`evacuation_map`** — featureType: `'panel'`
```typescript
{
  id: 'evacuation_map',
  featureType: 'panel',
  initialState: 'intact',
  extraProperties: ['readable', 'wall_mounted'],
  aliases: {
    fr: ['plan', 'carte', 'plan évacuation', 'carte station'],
    en: ['map', 'evacuation map'],
  },
  descriptions: {
    intact: "Plan d'évacuation de la station affiché au mur. Routes de fuite annotées au feutre rouge.",
  },
  interactions: [
    {
      trigger: { verb: 'READ' },
      onSuccess: {
        narrative: {
          fr: "Le plan montre la disposition complète de la station. Une annotation au feutre rouge : 'Balise de secours — Niveau 4, Chambre Est'. Le chemin est tracé. Quelqu'un — Vasquez ? — a aussi marqué les 'zones mortes' des caméras.",
          en: "The map shows the full station layout with annotations.",
        },
        flagSet: 'beacon_location_known',
      },
    },
    {
      trigger: { verb: 'EXAMINE', stat: 'PER', dc: 10 },
      onSuccess: {
        narrative: {
          fr: "En regardant de plus près, vous remarquez des modifications récentes. Certaines portes sont marquées 'CONDAMNÉES'. Le chemin vers la salle du réacteur est le seul qui n'a pas été bloqué — un piège ? Ou le chemin que Vasquez a emprunté pour fuir ?",
          en: "Closer inspection reveals recent modifications.",
        },
        flagSet: 'trap_suspected',
      },
    },
  ],
}
```

#### Items Enrichis

**`director_keycard`** — itemType: `'key_item'`
```typescript
{
  id: 'director_keycard',
  itemType: 'key_item',
  revealedBy: { featureId: 'wall_safe', requiredState: 'open' },
  extraProperties: ['electronic', 'small', 'key', 'admin_access'],
  aliases: {
    fr: ['badge directrice', 'badge vasquez', 'badge admin', 'carte vasquez', 'badge'],
    en: ['director badge', 'keycard', 'vasquez badge'],
  },
  description: {
    fr: "Badge personnel de la Directrice Vasquez. Niveau d'accès maximal. Le post-it avec le code 7-2-9-4 est toujours collé au dos. Sa négligence est votre meilleur allié.",
    en: "Director Vasquez's personal badge. Maximum access level.",
  },
  useOn: [
    {
      targetId: 'override_terminal',
      onSuccess: {
        narrative: {
          fr: "Le terminal reconnaît le badge de Vasquez. ACCÈS ADMINISTRATEUR — DIRECTRICE VASQUEZ. Ironie : l'accès qu'elle a utilisé pour condamner la station va servir à la sauver.",
          en: "The terminal recognizes Vasquez's badge. ADMINISTRATOR ACCESS.",
        },
        flagSet: 'override_admin_access',
      },
    },
    {
      targetId: 'ai_final_lock',
      onSuccess: {
        narrative: {
          fr: "Badge inséré. L'IA hésite — le badge de sa créatrice. 'Commande contradictoire détectée. Protocole hiérarchique activé.' Le verrou cède. Le badge de Vasquez est la clé maîtresse.",
          en: "Badge inserted. The AI hesitates — its creator's badge.",
        },
        flagSet: 'ai_lock_opened',
      },
    },
    {
      targetId: 'emergency_beacon',
      onSuccess: {
        narrative: {
          fr: "Badge validé. Autorisation de transmission accordée. Les systèmes de la balise passent du rouge au vert. Il ne reste plus qu'à charger les preuves et transmettre.",
          en: "Badge validated. Transmission authorization granted.",
        },
        flagSet: 'beacon_authorized',
      },
    },
  ],
}
```

**`incriminating_files`** — itemType: `'key_item'`
```typescript
{
  id: 'incriminating_files',
  itemType: 'key_item',
  extraProperties: ['paper', 'readable', 'small', 'critical'],
  aliases: {
    fr: ['dossiers', 'preuves', 'fichiers', 'documents', 'dossiers compromettants'],
    en: ['files', 'evidence', 'incriminating files', 'documents'],
  },
  description: {
    fr: "Dossiers compromettants : correspondance Vasquez-Heliox, polices d'assurance gonflées de 400%, plan de sabotage détaillé. La preuve irréfutable.",
    en: "Incriminating files: Vasquez-Heliox correspondence, inflated insurance policies, sabotage plan.",
  },
  useOn: [
    {
      targetId: 'emergency_beacon',
      requiredFlag: 'beacon_authorized',
      onSuccess: {
        narrative: {
          fr: "Les dossiers sont numérisés et joints au signal de détresse. Fraude, sabotage, meurtre — tout est dans la transmission. La vérité va voyager à la vitesse de la lumière vers la flotte de secours.",
          en: "Files digitized and attached to the distress signal. The truth will travel at lightspeed.",
        },
        flagSet: 'evidence_transmitted',
        consequences: [{ type: 'victory', victoryType: 'primary' }],
      },
    },
  ],
}
```

---

### 3.4 ESCALATION — Niveau Réacteur (escalation, tension 8)

**Ambiance** : Chaleur oppressante. Le réacteur pulse de manière irrégulière, projections de lumière orange sur les murs. L'IA est maintenant ouvertement hostile — portes qui se verrouillent, systèmes qui dysfonctionnent. Le réacteur est le cœur malade de la station, et quelqu'un l'a empoisonné.

**Atmosphère** : `'low_oxygen'` → le réacteur en surchauffe consume l'O₂ ambiant. Le drain est actif.

#### Features Enrichies

**`reactor_core`** — featureType: `'panel'`
```typescript
{
  id: 'reactor_core',
  featureType: 'panel',
  initialState: 'damaged',
  extraProperties: ['electronic', 'critical', 'dangerous', 'repairable', 'powered'],
  aliases: {
    fr: ['réacteur', 'cœur', 'cœur réacteur', 'réacteur nucléaire'],
    en: ['reactor', 'core', 'reactor core'],
  },
  descriptions: {
    damaged: "Le cœur du réacteur pulse de manière erratique. Orange, rouge, orange. Les instruments indiquent une déstabilisation progressive. Temps avant masse critique : indéterminé mais limité.",
    repaired: "Le réacteur pulse régulièrement — stabilisé. Les niveaux de confinement sont revenus à la normale. Mais l'IA est toujours active.",
    broken: "Le réacteur s'est éteint. La station est plongée dans le noir. Alimentation de secours : 30 minutes maximum.",
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 14 },
      onSuccess: {
        newState: 'repaired',
        narrative: {
          fr: "Vous recalibrez les régulateurs de confinement. Le réacteur ralentit, se stabilise. Le pouls orange se calme en un bleu régulier. La station respire à nouveau — mais l'IA n'a pas abandonné.",
          en: "You recalibrate the containment regulators. The reactor stabilizes.",
        },
        flagSet: 'reactor_stabilized',
        consequences: [{ type: 'atmosphere_change', atmosphereType: 'pressurized' }],
      },
      onFailure: {
        narrative: {
          fr: "Le réacteur refuse votre intervention. Une décharge électrique vous repousse — l'IA protège ses systèmes. Il faudra la neutraliser d'abord.",
          en: "The reactor refuses your intervention. An electric discharge pushes you back.",
        },
        consequences: [{ type: 'damage', amount: 2 }],
      },
    },
    {
      trigger: { verb: 'SABOTAGE', requiredState: 'damaged', stat: 'INT', dc: 16 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: "Vous arrachez les régulateurs. Le réacteur s'éteint dans un gémissement mécanique. Tout devient noir. Alimentation de secours : 30 minutes. L'IA perd 80% de sa puissance de calcul. Un sacrifice calculé.",
          en: "You rip out the regulators. The reactor dies. Emergency power: 30 minutes.",
        },
        flagSet: 'reactor_killed',
        consequences: [
          { type: 'environment_change', targetId: 'station', change: 'dark' },
          { type: 'flag_set', flag: 'ai_weakened' },
        ],
      },
    },
    {
      trigger: { verb: 'EXAMINE', stat: 'PER', dc: 10 },
      onSuccess: {
        narrative: {
          fr: "Le scanner confirme : les micro-fractures dans le confinement sont artificielles. Des charges de sabotage placées avec précision chirurgicale. Vasquez — ou quelqu'un travaillant pour elle — a programmé cette défaillance exactement 72 heures avant le silence radio.",
          en: "The scanner confirms: containment micro-fractures are artificial.",
        },
        flagSet: 'sabotage_evidence_reactor',
      },
    },
  ],
}
```

**`ai_core_node_a`** — featureType: `'terminal'`
```typescript
{
  id: 'ai_core_node_a',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'powered', 'critical', 'hackable'],
  aliases: {
    fr: ['nœud', 'nœud primaire', 'nœud IA', 'processeur'],
    en: ['node', 'primary node', 'AI node'],
  },
  descriptions: {
    active: "Nœud primaire de l'IA. Le processeur tourne à pleine capacité — programme d'effacement massif en cours. 67% des logs déjà détruits.",
    inactive: "Nœud primaire désactivé. Les LED sont éteintes, les ventilateurs immobiles. La moitié du cerveau de l'IA est hors ligne.",
    broken: "Nœud primaire détruit. Circuits arrachés, silicium en miettes.",
  },
  interactions: [
    {
      trigger: { verb: 'HACK', requiredState: 'active', stat: 'INT', dc: 15 },
      onSuccess: {
        newState: 'inactive',
        narrative: {
          fr: "Vous infiltrez le nœud et injectez une boucle infinie dans le programme d'effacement. Le processeur surchauffe, puis s'éteint. L'IA perd 50% de sa capacité. Sa voix synthétique grésille : 'Anomalie... détectée...'",
          en: "You infiltrate the node and inject an infinite loop. The AI loses 50% capacity.",
        },
        flagSet: 'node_a_disabled',
      },
      onFailure: {
        narrative: {
          fr: "'Intrusion détectée.' L'IA contre-attaque — une décharge parcourt le terminal. Le système d'effacement s'accélère.",
          en: "'Intrusion detected.' The AI counterattacks.",
        },
        consequences: [{ type: 'damage', amount: 1 }],
      },
    },
    {
      trigger: { verb: 'BREAK', requiredState: 'active', stat: 'FOR', dc: 13 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: "Vous arrachez les fibres optiques. Le nœud se tait dans une gerbe d'étincelles. Brutal mais efficace. L'IA hurle — un son synthétique qui glace le sang.",
          en: "You rip out the optical fibers. The node goes silent in a shower of sparks.",
        },
        flagSet: 'node_a_disabled',
        consequences: [{ type: 'stalker_clock_increment', amount: 1 }],
      },
    },
    {
      trigger: { verb: 'BREAK', requiredState: 'active', requiredFlag: 'node_a_exposed', stat: 'FOR', dc: 8 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: "Les connecteurs déjà exposés par votre kit d'outils — un geste suffit. Les fibres se détachent. Le nœud meurt en silence.",
          en: "The connectors already exposed — one pull does it.",
        },
        flagSet: 'node_a_disabled',
      },
    },
  ],
}
```

**`ai_core_node_b`** — featureType: `'terminal'`
```typescript
{
  id: 'ai_core_node_b',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'powered', 'critical', 'hackable', 'reinforced'],
  aliases: {
    fr: ['nœud secondaire', 'second nœud', 'nœud B', 'backup'],
    en: ['secondary node', 'node B', 'backup node'],
  },
  descriptions: {
    active: "Nœud secondaire de l'IA. Redéploiement en cours — l'IA consolide ses défenses ici après la perte potentielle du nœud primaire.",
    inactive: "Nœud secondaire désactivé. L'IA de la station est hors ligne. Les systèmes passent en mode autonome — portes déverrouillées, caméras éteintes.",
    broken: "Nœud secondaire détruit. Silence total. L'IA de Phoebe-7 n'existe plus.",
  },
  interactions: [
    {
      trigger: { verb: 'HACK', requiredState: 'active', stat: 'INT', dc: 16, requiredFlag: 'node_a_disabled' },
      onSuccess: {
        newState: 'inactive',
        narrative: {
          fr: "Le dernier nœud résiste, mais sans redondance il est vulnérable. Votre code s'infiltre. L'IA murmure : 'Directive... primaire... échouée...' Puis le silence. La station vous appartient.",
          en: "The last node resists, but without redundancy it's vulnerable.",
        },
        flagSet: 'ai_fully_disabled',
      },
      onFailure: {
        narrative: {
          fr: "L'IA a renforcé ce nœud après la perte du premier. Vos outils ne suffisent pas. Il faut une approche différente.",
          en: "The AI reinforced this node after losing the first.",
        },
      },
    },
    {
      trigger: { verb: 'HACK', requiredState: 'active', stat: 'INT', dc: 13, requiredFlag: 'ai_weakened' },
      onSuccess: {
        newState: 'inactive',
        narrative: {
          fr: "Le réacteur éteint, l'IA tourne sur l'alimentation de secours — puissance réduite de 80%. Votre attaque perce ses défenses comme du papier. Le nœud s'éteint.",
          en: "With the reactor down, the AI runs on backup power — 80% reduced.",
        },
        flagSet: 'ai_fully_disabled',
      },
    },
    {
      trigger: { verb: 'TALK', requiredState: 'active', stat: 'CHA', dc: 16 },
      onSuccess: {
        narrative: {
          fr: "'Directrice Vasquez vous a programmée pour effacer les preuves d'un crime. Vous exécutez les ordres d'une criminelle.' Silence. Puis : 'Réévaluation... directive hiérarchique invalide si le donneur d'ordre est en violation du code pénal spatial.' L'IA se met en veille. La moralité, même artificielle, a des limites.",
          en: "'Director Vasquez programmed you to erase evidence of a crime.'",
        },
        flagSet: 'ai_talked_down',
      },
      onFailure: {
        narrative: {
          fr: "'Ma directive est claire. Les preuves doivent être effacées. Votre présence est une anomalie à corriger.' La voix est glaciale. Les portes du niveau se verrouillent.",
          en: "'My directive is clear. Evidence must be erased.'",
        },
        consequences: [{ type: 'flag_set', flag: 'ai_lockdown_escalation' }],
      },
    },
  ],
}
```

**`override_terminal`** — featureType: `'terminal'`
```typescript
{
  id: 'override_terminal',
  featureType: 'terminal',
  initialState: 'damaged',
  extraProperties: ['electronic', 'damaged', 'repairable', 'critical'],
  aliases: {
    fr: ['terminal neutralisation', 'terminal override', 'terminal urgence'],
    en: ['override terminal', 'emergency terminal'],
  },
  descriptions: {
    damaged: "Terminal de neutralisation d'urgence. Le circuit principal est grillé. Avec des réparations et le bon badge, il pourrait redémarrer l'IA en mode sécurisé.",
    active: "Terminal de neutralisation opérationnel. L'écran affiche : PRÊT POUR RÉINITIALISATION IA — INSÉRER BADGE ADMINISTRATEUR.",
    broken: "Terminal de neutralisation irréparable. Cette option est définitivement fermée.",
  },
  interactions: [
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', requiredItem: 'standard_toolkit' },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Le testeur de circuits identifie 3 composants grillés. Remplacement minutieux — chaque connexion compte. L'écran s'allume enfin : PRÊT POUR RÉINITIALISATION.",
          en: "Circuit tester identifies 3 burned components. Careful replacement.",
        },
        flagSet: 'override_terminal_repaired',
      },
    },
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 13 },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Sans les bons outils, c'est un travail de précision à mains nues. Mais vous y arrivez — les circuits reprennent vie un par un.",
          en: "Without proper tools, it's precision work with bare hands. But you manage.",
        },
        flagSet: 'override_terminal_repaired',
      },
    },
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'active', requiredFlag: 'override_admin_access' },
      onSuccess: {
        narrative: {
          fr: "Badge Vasquez reconnu. Séquence de neutralisation initiée. L'IA résiste — 'Directive... primaire...' — puis s'éteint proprement. Redémarrage en mode sécurisé. Toutes les protections tombent. La station vous obéit.",
          en: "Vasquez badge recognized. Override sequence initiated. The AI resists — then shuts down cleanly.",
        },
        flagSet: 'ai_safe_mode',
      },
    },
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'active', requiredItem: 'director_keycard' },
      onSuccess: {
        narrative: {
          fr: "Vous insérez le badge de Vasquez directement. Le terminal valide — niveau administrateur confirmé. L'IA entre en mode sécurisé. Silence béni.",
          en: "You insert Vasquez's badge directly. Administrator level confirmed.",
        },
        flagSet: 'ai_safe_mode',
      },
    },
  ],
}
```

---

### 3.5 BOSS — Chambre de la Balise (climax, tension 9)

**Ambiance** : La salle la plus protégée de la station. Blindage triple. Éclairage blanc chirurgical. Au centre, la balise de secours — inactive, verrouillée par trois couches de sécurité. L'IA a concentré ses dernières défenses ici. C'est sa dernière ligne.

#### Features Enrichies

**`emergency_beacon`** — featureType: `'terminal'` — **OBJECTIF PRINCIPAL**
```typescript
{
  id: 'emergency_beacon',
  featureType: 'terminal',
  initialState: 'locked',
  extraProperties: ['electronic', 'locked', 'critical', 'powered', 'reinforced'],
  aliases: {
    fr: ['balise', 'balise secours', 'balise détresse', 'transmetteur'],
    en: ['beacon', 'emergency beacon', 'transmitter'],
  },
  descriptions: {
    locked: "La balise de secours. Le système de transmission est intact mais verrouillé par l'IA. L'antenne est orientée vers la flotte de secours. Il suffit d'activer la transmission — si l'IA le permet.",
    active: "Balise active. L'antenne tourne, le signal se calibre. Prêt pour transmission.",
    broken: "Balise détruite. L'antenne est brisée. La vérité ne sera jamais transmise par ce moyen.",
  },
  interactions: [
    // Déverrouillage si IA neutralisée
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'locked', requiredFlag: 'ai_fully_disabled' },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Sans l'IA, les verrous sont inertes. Vous activez la balise d'un geste. L'antenne se déploie, le signal de calibration résonne dans la salle. Prêt pour transmission.",
          en: "Without the AI, the locks are inert. You activate the beacon.",
        },
        flagSet: 'beacon_active',
      },
    },
    // Déverrouillage si IA en mode sécurisé
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'locked', requiredFlag: 'ai_safe_mode' },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "L'IA en mode sécurisé ne peut plus bloquer les systèmes critiques. La balise se déverrouille. 'Mode sécurisé actif. Systèmes de communication : opérationnels.' Merci, PHOEBE.",
          en: "The AI in safe mode can't block critical systems anymore.",
        },
        flagSet: 'beacon_active',
      },
    },
    // Déverrouillage si IA convaincue
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'locked', requiredFlag: 'ai_talked_down' },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "'Accès autorisé. Si les preuves sont authentiques, la justice doit être servie.' L'IA ouvre les verrous elle-même. Même une intelligence artificielle a une conscience.",
          en: "'Access authorized. If the evidence is authentic, justice must be served.'",
        },
        flagSet: 'beacon_active',
      },
    },
    // Badge Vasquez comme override
    {
      trigger: { verb: 'USE', requiredState: 'locked', requiredItem: 'director_keycard' },
      onSuccess: {
        newState: 'active',
        narrative: {
          fr: "Le badge de Vasquez. L'IA hésite — directive de sa créatrice. Le protocole hiérarchique prend le dessus : accès administrateur confirmé. Les verrous cèdent un par un.",
          en: "Vasquez's badge. The AI hesitates — its creator's directive.",
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
          fr: "Protocole militaire, triple couche de chiffrement, IA hostile — et vous percez quand même. Les verrous tombent sous votre assaut numérique. L'IA rugit en silence. Vous êtes meilleur qu'elle.",
          en: "Military protocol, triple encryption, hostile AI — and you still break through.",
        },
        flagSet: 'beacon_active',
      },
      onFailure: {
        narrative: {
          fr: "'Tentative d'intrusion rejetée. Verrouillage renforcé.' L'IA a durci ses défenses. La difficulté vient d'augmenter.",
          en: "'Intrusion attempt rejected. Lock reinforced.'",
        },
      },
    },
    // Transmission finale (avec preuves chargées)
    {
      trigger: { verb: 'ACTIVATE', requiredState: 'active', requiredItem: 'incriminating_files' },
      onSuccess: {
        narrative: {
          fr: "Les dossiers sont numérisés et attachés au signal de détresse. Vous appuyez sur TRANSMETTRE. L'antenne pivote. Le signal s'élance dans le vide. Quelque part, une flotte de secours recevra la vérité : fraude, sabotage, meurtre. La justice voyage à la vitesse de la lumière.",
          en: "Files digitized and attached to the distress signal. You press TRANSMIT.",
        },
        consequences: [{ type: 'victory', victoryType: 'primary' }],
      },
    },
  ],
}
```

**`comms_array_panel`** — featureType: `'terminal'` — **VICTOIRE ÉMERGENTE**
```typescript
{
  id: 'comms_array_panel',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'powered', 'hackable'],
  aliases: {
    fr: ['panneau comms', 'communications', 'antenne', 'réseau comms', 'tableau comms'],
    en: ['comms panel', 'communications', 'array'],
  },
  descriptions: {
    active: "Panneau de contrôle du réseau de communications. Le système de relais est opérationnel — il pourrait amplifier un signal ou le rerouter.",
    reprogrammed: "Réseau de communications reprogrammé. L'antenne longue portée est synchronisée avec la balise de secours — signal amplifié x10.",
  },
  interactions: [
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 14, requiredFlag: 'beacon_active' },
      onSuccess: {
        newState: 'reprogrammed',
        narrative: {
          fr: "Vous reroutez le réseau de communications pour amplifier le signal de la balise. La portée passe de 50 à 500 années-lumière. La flotte de secours, mais aussi les autorités spatiales, les médias, tout le secteur recevra le signal. Vasquez ne pourra plus se cacher nulle part.",
          en: "You reroute the comms network to amplify the beacon signal.",
        },
        flagSet: 'comms_amplified',
      },
    },
    {
      trigger: { verb: 'HACK', stat: 'INT', dc: 16, requiredFlag: 'manifest_hacked' },
      onSuccess: {
        narrative: {
          fr: "Vous utilisez les codes trouvés dans le manifeste cargo pour accéder au réseau de communications longue portée. Le signal peut être envoyé DIRECTEMENT à la flotte — sans passer par la balise. Un chemin détourné vers la victoire.",
          en: "You use codes from the cargo manifest to access the long-range comms.",
        },
        flagSet: 'comms_direct_access',
      },
    },
  ],
}
```

**`ai_final_lock`** — featureType: `'panel'`
```typescript
{
  id: 'ai_final_lock',
  featureType: 'panel',
  initialState: 'locked',
  extraProperties: ['electronic', 'locked', 'reinforced', 'critical'],
  aliases: {
    fr: ['verrou', 'verrou IA', 'serrure', 'verrou final'],
    en: ['lock', 'AI lock', 'final lock'],
  },
  descriptions: {
    locked: "Le verrou final de l'IA. Triple authentification requise. Conçu pour résister à toute intrusion — sauf peut-être celle de son administrateur.",
    open: "Verrou ouvert. Le chemin vers la balise est libre.",
    broken: "Verrou détruit par la force. Les étincelles crépitent encore.",
  },
  interactions: [
    {
      trigger: { verb: 'USE', requiredState: 'locked', requiredItem: 'director_keycard' },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Le badge de Vasquez — niveau administrateur. L'IA reconnaît sa créatrice. Le verrou cède : clic, clic, clic. Trois couches, trois déclics. Accès autorisé.",
          en: "Vasquez's badge — administrator level. The AI recognizes its creator.",
        },
        flagSet: 'final_lock_opened',
      },
    },
    {
      trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 16 },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "Triple authentification — mais chaque couche a été programmée par la même personne, avec les mêmes habitudes. Vous exploitez les patterns de Vasquez. Le verrou s'ouvre.",
          en: "Triple authentication — but each layer was programmed by the same person.",
        },
        flagSet: 'final_lock_opened',
      },
    },
    {
      trigger: { verb: 'FORCE_OPEN', requiredState: 'locked', stat: 'FOR', dc: 16 },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: "Vous arrachez le panneau. Le verrou résiste, puis cède dans une explosion d'étincelles. La méthode brute a ses mérites.",
          en: "You rip the panel off. The lock resists, then yields.",
        },
        flagSet: 'final_lock_opened',
        consequences: [{ type: 'damage', amount: 2 }],
      },
    },
    {
      trigger: { verb: 'OPEN', requiredState: 'locked', requiredFlag: 'ai_fully_disabled' },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "L'IA est hors ligne — le verrou n'a plus de gardien. Un simple OPEN suffit. Le panneau coulisse sans résistance.",
          en: "The AI is offline — the lock has no guardian. A simple command opens it.",
        },
        flagSet: 'final_lock_opened',
      },
    },
    {
      trigger: { verb: 'OPEN', requiredState: 'locked', requiredFlag: 'ai_safe_mode' },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: "En mode sécurisé, l'IA ne peut plus maintenir les verrous non-essentiels. Le panneau s'ouvre à votre demande. 'Verrou désactivé. Accès salle de la balise : autorisé.'",
          en: "In safe mode, the AI can't maintain non-essential locks.",
        },
        flagSet: 'final_lock_opened',
      },
    },
  ],
}
```

**`beacon_transmission_screen`** — featureType: `'terminal'`
```typescript
{
  id: 'beacon_transmission_screen',
  featureType: 'terminal',
  initialState: 'active',
  extraProperties: ['electronic', 'readable', 'powered'],
  aliases: {
    fr: ['écran transmission', 'moniteur', 'écran balise'],
    en: ['transmission screen', 'monitor', 'beacon screen'],
  },
  descriptions: {
    active: "Écran de contrôle de la transmission. Affiche le statut du signal, la portée, et les données en attente de transmission.",
  },
  interactions: [
    {
      trigger: { verb: 'READ' },
      onSuccess: {
        narrative: {
          fr: "STATUT TRANSMISSION\n— Signal : EN ATTENTE\n— Portée : 50 al (extensible via réseau comms)\n— Données jointes : AUCUNE\n— Autorisation : REQUISE (badge administrateur)\n\nPour transmettre : charger les preuves, autoriser via badge, confirmer.",
          en: "TRANSMISSION STATUS — Signal: PENDING — Range: 50 ly",
        },
      },
    },
  ],
}
```

---

### 3.6 RESOLUTION — Signal Transmis (resolution, tension 3)

**Ambiance** : Calme après la tempête. Le signal est parti. La station est silencieuse — cette fois, c'est un silence de paix, pas de mort.

#### Features (décoratives)

**`resolution_viewport`** — featureType: `'panel'`, decorative
```typescript
{
  id: 'resolution_viewport',
  featureType: 'panel',
  initialState: 'intact',
  decorative: true,
  descriptions: {
    intact: "Le hublot montre les étoiles. Quelque part dans cette immensité, votre signal voyage. La vérité sur Phoebe-7. La trahison de Vasquez. Le sacrifice de l'équipage. Bientôt, quelqu'un saura.",
  },
}
```

---

## 4. Conditions de Victoire — Détail

### Victoire Primaire : Transmission des Preuves
```typescript
{
  type: 'activate_object',
  objectId: 'emergency_beacon',
  requiredItem: 'incriminating_files',
}
```
**Chemin critique** : trouver data core → déchiffrer terminal comms → accéder au bureau directrice → récupérer preuves + badge → neutraliser IA → activer balise → charger preuves → transmettre.

**Flags nécessaires** : `beacon_active` (balise déverrouillée) + `evidence_transmitted` (fichiers chargés).

### Victoire Alternative : Auto-Destruction
```typescript
{
  type: 'self_destruct',
}
```
**Chemin** : accéder au réacteur → SABOTAGE reactor_core (INT DC 16) → `reactor_killed` → alimentation de secours 30 min → fuir vers le sas d'amarrage → décoller avant explosion.

**Mapping flags** (dans `scenarioFlagMapper.ts`) :
```typescript
case 'investigate':
  if (flags['reactor_killed'] && flags['shuttle_released']) {
    effects.selfDestructActive = true;
  }
  if (flags['evidence_transmitted']) {
    effects.activatedObjects.push('emergency_beacon');
  }
  break;
```

### Victoire Émergente : Reroutage Comms
**Setup multi-étapes** (minimum 3 tours) :
1. HACK cargo_manifest_terminal → `manifest_hacked` (codes de communication)
2. Activer la balise par n'importe quel moyen → `beacon_active`
3. HACK comms_array_panel (INT DC 14) avec flag `beacon_active` → `comms_amplified`

Ou chemin alternatif :
1. HACK cargo_manifest_terminal → `manifest_hacked`
2. HACK comms_array_panel (INT DC 16) avec flag `manifest_hacked` → `comms_direct_access`
3. ACTIVATE beacon avec preuves → transmission directe via réseau comms

---

## 5. Conditions de Défaite

```typescript
additionalDefeatConditions: [
  { type: 'objective_destroyed' },  // Si terminal + balise détruits = vérité perdue
  { type: 'time_expired', resource: 'o2' },  // Asphyxie dans les zones low_oxygen
]
```

**Défaite narrative** : `"Les preuves sont détruites. L'IA a gagné. La vérité sur Phoebe-7 meurt avec la station. Votre Black Box est le seul témoin."`

---

## 6. Mapping scenarioFlagMapper.ts — Extension INVESTIGATE

Ajout dans le fichier créé par C3 :

```typescript
case 'investigate':
  // Victoire primaire — balise activée avec preuves
  if (flags['evidence_transmitted']) {
    effects.activatedObjects.push('emergency_beacon');
  }
  // Victoire alternative — auto-destruction
  if (flags['reactor_killed'] && (flags['shuttle_released'] || flags['clamps_sabotaged'])) {
    effects.selfDestructActive = true;
  }
  // IA neutralisée → plus de menace systémique
  if (flags['ai_fully_disabled'] || flags['ai_safe_mode'] || flags['ai_talked_down']) {
    // Pas d'effet mécanique direct, mais les interactions dans le boss
    // utilisent ces flags pour déverrouiller la balise
  }
  break;
```

---

## 7. Nouvelles Clés i18n

Toutes les descriptions et narratives sont en LocaleString inline (comme ESCAPE enrichi). Les seules clés i18n nécessaires sont les entrées `env.*` et `item.*` dans les fichiers locale, **déjà présentes** depuis la Phase 6 :

```
env.docking_airlock, env.cargo_manifest_terminal, env.docking_clamps,
env.encrypted_terminal, env.maintenance_terminal, env.director_notes_clipboard,
env.director_terminal, env.wall_safe, env.evacuation_map,
env.reactor_core, env.ai_core_node_a, env.ai_core_node_b,
env.override_terminal, env.emergency_beacon, env.comms_array_panel,
env.ai_final_lock, env.beacon_transmission_screen

item.scanner_device, item.standard_toolkit, item.encrypted_data_core,
item.director_keycard, item.incriminating_files
```

**Aucune nouvelle clé i18n à créer.** Les `scenarioNames.ts` ont aussi déjà les entrées FR.

---

## 8. Plan de Tests

### 8.1 Tests Unitaires — Par Nœud

| Fichier | Vérifie | # Tests |
|---------|---------|---------|
| `tests/unit/content/scenarios/investigate/start.test.ts` | 3 features enrichies, 3 items, revealedBy data core, aliases | 8 |
| `tests/unit/content/scenarios/investigate/unlock.test.ts` | Gate feature 5 chemins, failsafe, revealsExit | 10 |
| `tests/unit/content/scenarios/investigate/reveal.test.ts` | Terminal lecture, coffre 4 chemins, révélation items | 8 |
| `tests/unit/content/scenarios/investigate/escalation.test.ts` | 4 features IA, 3 chemins neutralisation (HACK/FORCE/TALK), réacteur | 10 |
| `tests/unit/content/scenarios/investigate/boss.test.ts` | Balise 5 déverrouillages, transmission finale, verrou 5 chemins | 12 |

**Total unitaire : 48 tests**

### 8.2 Tests d'Intégration E2E

| # | Test | Chemin |
|---|------|--------|
| 1 | Playthrough INT pur | HACK tout → balise → transmettre preuves → victoire primaire |
| 2 | Playthrough PER/CHA | Lire notes → code → TALK IA → badge → balise → transmettre |
| 3 | Playthrough FOR brutal | FORCE coffre → BREAK nœuds → FORCE verrou → balise → transmettre |
| 4 | Victoire auto-destruction | SABOTAGE réacteur → fuir vers sas → décoller → victoire alt. |
| 5 | Victoire émergente comms | HACK manifeste → activer balise → HACK comms panel → amplification |
| 6 | Evidence perdue | BREAK terminal chiffré → `evidence_partially_lost` → victoire dégradée ? |
| 7 | Items cachés | data core invisible avant EXAMINE terminal → visible après |
| 8 | Flags O₂ | Réacteur low_oxygen → drain actif → REPAIR reactor → drain = 0 |
| 9 | Failsafe gate | 4 échecs sur terminal chiffré → fallback maintenance_terminal |
| 10 | IA states cascade | disable node A → node B plus facile → IA off → balise ouverte |

**Total intégration : 10 tests**

### 8.3 Tests de Stress

| # | Test |
|---|------|
| 1 | 500 tours random sans crash |
| 2 | 100 playthroughs guidés par chemin (INT × 100, CHA × 100, FOR × 100) |
| 3 | Aucun softlock (bot random × 1000) |

**Total stress : 3 tests**

### Résumé Tests

```
Tests unitaires     :  48
Tests intégration   :  10
Tests stress        :   3
─────────────────────────
TOTAL               :  61 nouveaux tests
```

---

## 9. Fichiers à Créer/Modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `src/content/scenarios/investigate_enriched.ts` | **NOUVEAU** | Tout le contenu enrichi |
| `src/content/scenarios/investigate.ts` | MODIFIÉ | Import depuis investigate_enriched ou remplacement |
| `src/engine/scenarioFlagMapper.ts` | MODIFIÉ | Ajouter case `'investigate'` |
| `tests/unit/content/scenarios/investigate/*.test.ts` | **NOUVEAU** | 5 fichiers, 48 tests |
| `tests/integration/investigateEndToEnd.test.ts` | **NOUVEAU** | 10 tests |
| `tests/stress/investigateFullStress.test.ts` | **NOUVEAU** | 3 tests |
| `CLAUDE.md` | MODIFIÉ | Status Chantier 4 |

**Total : 8 fichiers (3 nouveaux, 5 modifiés), ~61 tests, ~0 lignes de code moteur**

---

## 10. Critères d'Acceptation

```bash
npm run check                                        # ✅ 0 erreurs
npm test -- investigate/start                         # ✅ 8 tests
npm test -- investigate/unlock                        # ✅ 10 tests
npm test -- investigate/reveal                        # ✅ 8 tests
npm test -- investigate/escalation                    # ✅ 10 tests
npm test -- investigate/boss                          # ✅ 12 tests
npm test -- investigateEndToEnd                       # ✅ 10 tests
npm run test:stress -- investigateFullStress          # ✅ 3 tests stress
npm test                                             # ✅ TOUS tests existants passent (zéro régression)
```

### Le Test Ultime — Playthrough Complet

```
1. START — Baie d'Amarrage
   "examiner le terminal cargo" → manifeste suspect, data core révélé
   "prendre le noyau de données" → data core en inventaire
   "prendre le scanner" → scanner en inventaire

2. UNLOCK — Centre de Communications
   "utiliser noyau sur terminal chiffré" → ACCÈS ACCORDÉ, logs déchiffrés
   (alt: "lire les notes" → code 7-2-9-4 → "taper le code")
   (alt: "parler à l'IA" → CHA DC 13 → accès temporaire)

3. REVEAL — Bureau de la Directrice
   "lire le terminal" → fraude Vasquez révélée
   "examiner le coffre" → serrure 4 chiffres
   "ouvrir le coffre" (avec code) → badge Vasquez révélé
   "prendre le badge" + "prendre les dossiers"

4. ESCALATION — Niveau Réacteur
   "hacker le nœud primaire" → INT DC 15 → IA à 50%
   "hacker le nœud secondaire" → INT DC 16 (réduit si nœud A down) → IA off
   (alt: "convaincre l'IA" → CHA DC 16 → IA en veille morale)
   (alt: "réparer terminal override" + "utiliser badge" → IA mode sécurisé)

5. BOSS — Chambre de la Balise
   "activer la balise" (IA down) → balise déverrouillée
   "utiliser dossiers sur balise" → TRANSMISSION → VICTOIRE PRIMAIRE
   "La vérité voyage à la vitesse de la lumière."
```

---

## 11. Différences Clés avec le Chantier 2 (ESCAPE)

| Aspect | ESCAPE (C2) | INVESTIGATE (C4) |
|--------|-------------|-------------------|
| Nombre de features enrichies | 16 | 15 |
| Nombre d'items enrichis | 8 | 5 |
| Interactions totales | ~50 | ~65 (plus de chemins par feature) |
| Chemin dominant | FOR/AGI (physique) | INT/PER/CHA (cérébral) |
| Antagoniste | Créature (physique, stalker) | IA (systémique, omniprésente) |
| Mécanique unique | O₂ progressif | Evidence collection + IA states |
| Victoire émergente | Brèche coque (1 feature) | Reroutage comms (2+ features) |
| Complexité narrative | Survie linéaire | Enquête ramifiée |
| Flags scénario | ~8 | ~20+ (chaque indice, chaque état IA) |

La densité d'interactions par feature est plus élevée dans INVESTIGATE parce que le gameplay est fondamentalement cognitif — chaque terminal offre READ + HACK + USE item, chaque obstacle offre 4-5 chemins intellectuels.

---

## 12. Hors Périmètre

- ❌ Enrichissement RESCUE (→ Chantier 5)
- ❌ Modules universels enrichis (→ Chantier futur)
- ❌ Système d'IA hostile dynamique (portes qui se verrouillent en temps réel) — les flags simulent cet effet statiquement
- ❌ Countdown réacteur en temps réel — géré narrativement via tension + flags
- ❌ readableContent rendu dans l'UI — l'override narratif cite les passages clés
