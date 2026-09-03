# INVESTIGATE "Signal Perdu" — Passe d'amélioration descriptions FR

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — passe d'enrichissement du skeleton `investigate`.
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **Objectif** : Chaque objet de scénario doit avoir une description riche, chaque découverte doit être décrite concrètement avec du lore pertinent, chaque indice doit être actionable, aucune action impossible ne doit être suggérée.
>
> **Référence de qualité** : `director_terminal` avec sa `readableContent` datée et ses noms propres.

---

## 🔴 CRITIQUES — Signalés explicitement

### 1. `encrypted_terminal` — état `active` trop vague + pas de readableContent

**Problème** : Quand le terminal est déverrouillé, la description dit "Les logs de la station défilent — 72 heures de communications, rapports d'incident, ordres confidentiels. La vérité est là, quelque part." C'est trop vague. Aucun contenu concret. Le joueur ne sait pas QUOI faire avec le terminal déverrouillé.

**Corrections** :

#### a) Description état `active` — réécrire :

```typescript
active: {
  fr: 'Terminal déverrouillé. Les logs de la station défilent — 72 heures de communications, rapports d\'incident, ordres confidentiels. Plusieurs entrées attirent l\'œil : des messages entre la Directrice Vasquez et un expéditeur externe marqué HELIOX, une alerte de confinement ignorée, et un ordre d\'évacuation annulé. Il y a beaucoup à lire ici.',
  en: 'Terminal unlocked. Station logs scroll by — messages between Director Vasquez and HELIOX, an ignored containment alert, a cancelled evacuation order.',
},
```

#### b) Ajouter `readableContent` au terminal chiffré :

```typescript
readableContent: {
  fr: 'LOGS STATION PHOEBE-7 — 72 DERNIÈRES HEURES\n\n'
    + '[2247-03-01 06:12] ALERTE SYSTÈME : Anomalie confinement réacteur détectée. Protocole inspection automatique déclenché.\n'
    + '[2247-03-01 06:14] DIR. VASQUEZ → SYSTÈME : Annuler inspection. Code admin VASQUEZ-ALPHA-7.\n'
    + '[2247-03-01 08:30] DR. CHEN → DIR. VASQUEZ : "Les relevés de confinement sont anormaux. Je demande une inspection manuelle immédiate."\n'
    + '[2247-03-01 09:15] DIR. VASQUEZ → DR. CHEN : "Inspection refusée. Les relevés sont dans les marges de tolérance. Cessez vos interférences."\n'
    + '[2247-03-01 14:00] HELIOX CONSORTIUM → DIR. VASQUEZ [CHIFFRÉ] : "Calendrier confirmé. Le transfert sera effectif 72h après l\'incident. Ne laissez aucune trace."\n'
    + '[2247-03-01 22:47] DR. CHEN → ÉQUIPAGE [DIFFUSION GÉNÉRALE] : "ATTENTION — modifications non autorisées détectées sur le confinement du réacteur. Ceci n\'est PAS un exercice."\n'
    + '[2247-03-01 22:48] SYSTÈME : Message de diffusion générale supprimé par autorité administrative.\n'
    + '[2247-03-01 23:59] DIR. VASQUEZ → IA STATION : "Activer protocole NETTOYAGE. Priorité absolue : effacer tous les logs de communication après mon départ."\n'
    + '[2247-03-02 01:00] IA STATION : Protocole NETTOYAGE activé. Effacement en cours.\n'
    + '[2247-03-02 03:12] DERNIER LOG : Défaillance confinement réacteur. Alerte niveau 5. Évacuation automati— [SIGNAL PERDU]',
  en: '',
},
```

#### c) Narrative de déverrouillage Chemin 1 (USE data_core) — enrichir :

```typescript
// Chemin 1 : USE data core → actuellement trop vague
narrative: {
  fr: 'Le noyau de données s\'enclenche. Les algorithmes de déchiffrement s\'exécutent — 3 secondes, 5, 12... L\'écran passe au vert. ACCÈS ACCORDÉ.\n\nLes logs défilent. Un message saute aux yeux : DR. CHEN a tenté d\'alerter l\'équipage d\'une modification non autorisée du confinement. Son message a été supprimé par Vasquez 47 secondes après envoi. Le dernier log s\'arrête net à 03h12 — défaillance confinement, puis silence.',
  en: 'The data core clicks in. Decryption algorithms execute — ACCESS GRANTED. The logs reveal Dr. Chen tried to warn the crew about unauthorized containment modifications. His message was deleted by Vasquez 47 seconds later.',
},
```

#### d) Narrative Chemin 2 (HACK) — enrichir de même :

```typescript
narrative: {
  fr: 'Protocole militaire niveau 4 — mais pas sans failles. Vous exploitez une backdoor dans le firmware. L\'écran passe au vert.\n\nLes logs s\'affichent. Le Dr. Chen a lancé une alerte à l\'équipage — supprimée par Vasquez en moins d\'une minute. Un message chiffré d\'Heliox confirme un "transfert 72h après l\'incident". Le dernier log : défaillance confinement à 03h12, puis le néant. Mais votre intrusion a laissé des traces dans les registres — l\'IA pourrait le remarquer.',
  en: 'Military protocol level 4 — but not without exploits. Logs show Dr. Chen\'s suppressed warning and Heliox\'s encrypted timeline.',
},
```

#### e) Narrative Chemin 3 (USE password + READ) — enrichir :

```typescript
// Chemin 3 existant : USE avec requiredFlag 'password_found'
narrative: {
  fr: 'Le code 7-2-9-4 déverrouille un accès secondaire. Partiel, mais suffisant. Les logs de maintenance défilent : quelqu\'un a modifié les paramètres de confinement du réacteur avec les codes administrateur de Vasquez, exactement 72 heures avant la catastrophe. Le Dr. Chen a tenté de sonner l\'alarme — son message a été effacé. L\'IA a reçu l\'ordre de nettoyer les traces. Ce n\'est pas un accident.',
  en: 'The code 7-2-9-4 unlocks partial access. Maintenance logs show containment modifications using Vasquez\'s admin codes.',
},
```

---

### 2. `maintenance_terminal` — état `active` inutile (aucune info sur quoi faire)

**Problème** : "Accès complet aux systèmes de maintenance — caméras, portes, ventilation. Un outil puissant." Le joueur ne sait pas ce que ça signifie concrètement. Quelles caméras ? Quelles portes ? Qu'est-ce qu'il peut FAIRE ?

**Corrections** :

#### a) Description état `active` — réécrire :

```typescript
active: {
  fr: 'Terminal réparé. L\'écran affiche quatre panneaux : CAMÉRAS (archives 72h disponibles), PORTES (contrôle manuel des sas — utile si l\'IA verrouille votre chemin), VENTILATION (reroutage atmosphérique possible), et DIAGNOSTICS (état du réacteur en temps réel). Chaque panneau attend vos commandes.',
  en: 'Terminal repaired. Four panels: CAMERAS (72h archives), DOORS (manual override), VENTILATION (atmospheric reroute), DIAGNOSTICS (reactor status).',
},
```

#### b) Description état `damaged` — enrichir les "interventions suspectes" :

```typescript
damaged: {
  fr: 'Terminal de maintenance auxiliaire. L\'écran est fissuré mais partiellement lisible. Les logs de maintenance affichent en boucle la même entrée : "2247-03-01 — Modification paramètres confinement — Autorisation ADMIN_VASQUEZ — Motif : recalibration programmée." Sauf qu\'aucune recalibration n\'était prévue dans le planning.',
  en: 'Auxiliary maintenance terminal. Cracked screen, partially readable. Maintenance logs loop a suspicious entry about containment modifications by ADMIN_VASQUEZ.',
},
```

#### c) Ajouter `readableContent` pour état `active` :

```typescript
readableContent: {
  fr: 'SYSTÈME DE MAINTENANCE — Station Phoebe-7\n\n'
    + '▸ CAMÉRAS : Archives 72h disponibles. Dernière activité détectée : Baie d\'amarrage, 2247-03-01 à 23h50 — silhouette quittant la station via sas secondaire.\n'
    + '▸ PORTES : 3 sas verrouillés par l\'IA (Centre Comms, Réacteur, Baie de Transmission). Neutralisation manuelle possible — l\'IA sera alertée.\n'
    + '▸ VENTILATION : Atmosphère toxique détectée niveau réacteur. Reroutage possible pour diluer les contaminants (réduit le drain O₂).\n'
    + '▸ DIAGNOSTICS : Réacteur en déstabilisation progressive. Confinement compromis à 4 points de sabotage. Temps avant masse critique : variable.\n'
    + '▸ JOURNAL MAINTENANCE : Dernière intervention autorisée : 2247-02-15. Toutes les interventions post-15/02 sont sous code ADMIN_VASQUEZ — non planifiées.',
  en: '',
},
```

#### d) Interaction HACK (état active) — enrichir la narrative caméra :

```typescript
// Existant : HACK, requiredState: 'active', stat: 'INT', dc: 12
narrative: {
  fr: 'Vous accédez aux caméras de sécurité archivées. L\'enregistrement du 1er mars à 23h50 montre la Directrice Vasquez quittant la station par le sas secondaire — seule, un sac de voyage à la main. Elle savait ce qui allait arriver. 47 minutes plus tard, le confinement du réacteur cède. Elle était déjà loin.',
  en: 'Security camera archives show Director Vasquez leaving the station alone at 23:50 on March 1st — 47 minutes before containment failure.',
},
```

#### e) Ajouter une interaction READ pour l'état `active` :

```typescript
// NOUVEAU : READ quand le terminal est réparé
{
  trigger: { verb: 'READ', requiredState: 'active', dc: null },
  onSuccess: {
    narrative: {
      fr: 'Le panneau DIAGNOSTICS confirme ce que vous soupçonnez : le confinement du réacteur a été compromis en quatre points précis. Pas une usure naturelle — des modifications chirurgicales, espacées sur deux semaines, toutes sous le code ADMIN_VASQUEZ. Le système de ventilation peut être rerouté pour diluer l\'atmosphère toxique au niveau réacteur.',
      en: 'DIAGNOSTICS panel confirms containment was compromised at four precise points — surgical modifications over two weeks, all under ADMIN_VASQUEZ.',
    },
    flagSet: 'maintenance_logs_read',
  },
},
```

---

### 3. `wall_safe` — Double-fond doit EXISTER mécaniquement

**Problème** : Le scanner révèle un double-fond (flag `safe_scanned`), mais l'interaction EXAMINE pour y accéder requiert `requiredState: 'locked'`. Si le joueur ouvre le coffre PUIS scanne, il ne peut plus accéder au double-fond. De plus, la description état `open` ne mentionne pas le double-fond.

**Corrections** :

#### a) Interaction double-fond — retirer la restriction `requiredState: 'locked'` :

```typescript
// L'interaction double-fond doit fonctionner quel que soit l'état du coffre
{
  trigger: { verb: 'EXAMINE', requiredFlag: 'safe_scanned', dc: null },
  // PAS de requiredState — le double-fond est accessible que le coffre soit ouvert, fermé ou forcé
  onSuccess: {
    narrative: {
      fr: 'Le scanner avait raison — un double-fond. En pressant la paroi du fond, un mécanisme magnétique cède avec un clic discret. Un compartiment secondaire s\'ouvre, dissimulé sous le capitonnage. À l\'intérieur : un second badge, marqué "ADMIN RÉSEAU — ACCÈS IA". Avec ça, l\'IA elle-même pourrait être reprogrammée.',
      en: 'The scanner was right — a false bottom. A magnetic mechanism yields with a quiet click.',
    },
    flagSet: 'admin_badge_found',
  },
},
```

#### b) Description état `open` — mentionner le double-fond si scanné :

Le système de descriptions ne supporte pas les conditions sur les flags, donc on enrichit la description statique pour être suggestive :

```typescript
open: {
  fr: 'Coffre-fort ouvert. L\'intérieur est capitonné de velours synthétique noir — conçu pour protéger des documents sensibles. Le fond du coffre semble légèrement plus épais que nécessaire.',
  en: 'Safe open. Padded interior with synthetic black velvet. The bottom seems slightly thicker than necessary.',
},
```

#### c) Ajouter une interaction EXAMINE pour l'état `open` (sans scanner) :

```typescript
// Si le joueur examine le coffre ouvert SANS avoir scanné → indice subtil
{
  trigger: { verb: 'EXAMINE', requiredState: 'open', dc: null },
  onSuccess: {
    narrative: {
      fr: 'L\'intérieur du coffre est tapissé de velours synthétique noir. En tâtant les parois, le fond vous semble anormalement épais — comme s\'il y avait un espace vide en dessous. Peut-être qu\'un scanner pourrait confirmer.',
      en: 'The bottom feels unusually thick — as if there\'s a void underneath.',
    },
  },
},
```

---

### 4. `encrypted_data_core` — useOn narrative trop générique

**Problème** : Quand on insère le noyau dans le terminal, la narrative dit "Les communications de la station des 72 dernières heures se déversent à l'écran" sans RIEN montrer de concret.

**Correction** — réécrire la narrative useOn :

```typescript
// encrypted_data_core.useOn[0] (targetId: 'encrypted_terminal')
narrative: {
  fr: 'Vous insérez le noyau de données. Le terminal ronronne, les barres de déchiffrement progressent — 40%, 70%, 98%... ACCÈS AUX LOGS : ACCORDÉ.\n\nLes communications se déversent à l\'écran. Un échange saute aux yeux : le Dr. Chen signalant des "modifications non autorisées du confinement" — message supprimé 47 secondes plus tard par la Directrice Vasquez. Un ordre chiffré d\'Heliox : "Calendrier confirmé. Transfert 72h après l\'incident." Le dernier log : alerte niveau 5, puis le silence.',
  en: 'You insert the data core. Decryption progresses — ACCESS GRANTED. Logs reveal Dr. Chen\'s suppressed warning about unauthorized containment modifications.',
},
```

---

## 🟡 IMPORTANTS — Lore, cohérence, descriptions à enrichir

### 5. `standard_toolkit` — Vérifier/enrichir description

```typescript
const standard_toolkit: ScenarioItemDefinition = {
  id: 'standard_toolkit',
  itemType: 'tool',
  extraProperties: ['metallic', 'usable'],
  aliases: {
    fr: ['outils', 'trousse', 'trousse outils', 'kit', 'boite outils'],
    en: ['toolkit', 'tools', 'tool kit'],
  },
  description: {
    fr: 'Trousse à outils standard de maintenance spatiale. Contient un testeur de circuits, un tournevis magnétique, des pinces isolées et un rouleau de ruban conducteur. Tout ce qu\'il faut pour les réparations d\'urgence.',
    en: 'Standard space maintenance toolkit. Circuit tester, magnetic screwdriver, insulated pliers, conductive tape.',
  },
  // ... useOn reste identique
};
```

### 6. `beacon_transmission_screen` — Description trop sèche

**Problème** : L'écran de transmission est le point culminant du scénario, mais sa description et son interaction READ sont très techniques et sans émotion.

**Corrections** :

#### a) Description état `active` :

```typescript
active: {
  fr: 'Écran de contrôle de la transmission. Les données clignotent en rouge : SIGNAL EN ATTENTE, PORTÉE 50 AL, DONNÉES JOINTES : AUCUNE, AUTORISATION : REQUISE. Trois étapes affichées : 1) Autoriser via badge administrateur. 2) Charger les preuves. 3) Confirmer la transmission. C\'est ici que tout se joue.',
  en: 'Transmission control screen. Three steps displayed: authorize, upload evidence, confirm transmission.',
},
```

#### b) Interaction READ — enrichir :

```typescript
{
  trigger: { verb: 'READ', dc: null },
  onSuccess: {
    narrative: {
      fr: 'STATUT TRANSMISSION — BALISE DE DÉTRESSE PHOEBE-7\n\n'
        + '▸ Signal : EN ATTENTE (activation requise)\n'
        + '▸ Portée actuelle : 50 années-lumière (extensible via réseau comms)\n'
        + '▸ Données jointes : AUCUNE\n'
        + '▸ Autorisation : REQUISE — badge administrateur niveau Directeur\n'
        + '▸ Destinataires automatiques : Flotte de Secours Secteur 7, Autorité Spatiale Fédérale\n\n'
        + 'Pour transmettre : insérer le badge administrateur, charger les fichiers de preuves, confirmer l\'envoi. Le signal sera irréversible.',
      en: 'TRANSMISSION STATUS — Signal: PENDING — Range: 50 ly — Authorization: REQUIRED.',
    },
  },
},
```

### 7. `emergency_beacon` — Description état `locked` à enrichir

```typescript
descriptions: {
  locked: {
    fr: 'Balise de détresse d\'urgence. Le boîtier est massif — conçu pour survivre à la destruction de la station. L\'écran affiche VERROUILLÉE en rouge. Un lecteur de badge et un port de données sont visibles sur le panneau frontal. L\'IA de la station a ajouté ses propres verrous par-dessus les verrous standard.',
    en: 'Emergency distress beacon. Heavy casing — designed to survive station destruction. Screen: LOCKED.',
  },
  active: {
    fr: 'Balise activée. Le boîtier vibre doucement — l\'antenne se déploie. L\'écran affiche PRÊTE À TRANSMETTRE en vert. Il ne reste qu\'à charger les preuves et confirmer l\'envoi.',
    en: 'Beacon activated. Antenna deploying. Screen: READY TO TRANSMIT.',
  },
},
```

### 8. `ai_core_node_b` — Vérifier descriptions

```typescript
descriptions: {
  active: {
    fr: 'Nœud secondaire de l\'IA. Sert de redondance au nœud primaire — si le premier tombe, celui-ci prend le relais avec des capacités réduites. Le processeur tourne en mode défensif, anticipant une attaque après la perte potentielle de son jumeau.',
    en: 'AI secondary node. Redundancy for the primary — if the first falls, this takes over with reduced capacity.',
  },
  inactive: {
    fr: 'Nœud secondaire désactivé. Le cerveau de l\'IA est complètement hors ligne. Les portes verrouillées par l\'IA se déverrouillent une à une dans un concert de claquements métalliques. La station est libérée.',
    en: 'Secondary node deactivated. The AI\'s brain is completely offline. AI-locked doors unlock one by one.',
  },
  broken: {
    fr: 'Nœud secondaire détruit. Le silence qui suit est total — l\'IA n\'a plus de voix, plus d\'yeux, plus de mains. La station vous appartient.',
    en: 'Secondary node destroyed. Complete silence follows.',
  },
},
```

### 9. `override_terminal` — état `active` : préciser les étapes

```typescript
active: {
  fr: 'Terminal de neutralisation opérationnel. L\'écran affiche : RÉINITIALISATION IA — PROTOCOLE EN 2 ÉTAPES :\n1) Insérer badge administrateur (niveau Directeur minimum)\n2) Confirmer le redémarrage en mode sécurisé\n\nMODE SÉCURISÉ : L\'IA conservera ses fonctions vitales (support vie, gravité) mais perdra le contrôle des systèmes de sécurité et d\'effacement.',
  en: 'Override terminal operational. Screen: AI RESET — 2-STEP PROTOCOL. Insert admin badge, confirm safe mode restart.',
},
```

### 10. `ai_final_lock` — descriptions plus riches

```typescript
descriptions: {
  locked: {
    fr: 'Le verrou final de l\'IA. Un écran holographique affiche trois couches d\'authentification superposées — biométrique, code, et badge. Conçu pour qu\'aucun membre d\'équipage ordinaire ne puisse le forcer. Mais la Directrice Vasquez n\'était pas ordinaire — et son badge est peut-être la clé.',
    en: 'The AI\'s final lock. Holographic display shows triple authentication layers.',
  },
  unlocked: {
    fr: 'Le verrou est désactivé. Les trois couches d\'authentification sont au vert. L\'accès à la balise est libre — l\'IA ne contrôle plus rien ici.',
    en: 'Lock deactivated. All three authentication layers green. Beacon access clear.',
  },
},
```

---

## 🟢 VÉRIFICATIONS — Cohérence code 7-2-9-4

Le code 7-2-9-4 apparaît dans :
1. ✅ `director_notes_clipboard` → READ → "un code est visible dans la marge : 7-2-9-4" → flag `password_found`
2. ✅ `wall_safe` → OPEN avec flag `password_found` → "7-2-9-4. Le coffre s'ouvre"
3. ✅ `wall_safe` → HACK → "le code apparaît : 7-2-9-4" (confirmation narrative)
4. ✅ `director_keycard` → description → "Le post-it avec le code 7-2-9-4 est toujours collé au dos"
5. ✅ `encrypted_terminal` → Chemin 3 → USE avec flag `password_found` (utilisation secondaire du code)

**Verdict** : Le code est cohérent. Il est trouvé sur le clipboard, il ouvre le coffre, et on le retrouve confirmé sur le badge (flavor). Le Chemin 3 du terminal chiffré permet aussi de l'utiliser comme mot de passe partiel — logique puisque Vasquez utilisait le même code partout (négligence de sécurité).

---

## 🟢 VÉRIFICATIONS — Aucune action impossible

| Objet | Action suggérée | Interaction existe ? | Statut |
|-------|----------------|---------------------|--------|
| wall_safe double-fond | "ouvrir le double-fond" | EXAMINE + safe_scanned | ⚠️ FIX: retirer requiredState: 'locked' |
| maintenance_terminal active | "utiliser les caméras" | HACK (INT DC12) | ✅ Mais ajouter READ aussi |
| encrypted_terminal active | "lire les logs" | Pas de READ pour état active | ⚠️ AJOUTER interaction READ active |
| beacon_transmission_screen | "transmettre" | Pas d'interaction ACTIVATE | ✅ OK — transmission gérée par useOn des items |
| docking_airlock closed | "rouvrir le sas" | Pas d'interaction OPEN pour closed | ⚠️ AJOUTER interaction OPEN/HACK pour état closed |

### Correction : `encrypted_terminal` — ajouter READ pour état active

```typescript
// NOUVEAU : Interaction READ quand le terminal est déjà déverrouillé
{
  trigger: { verb: 'READ', requiredState: 'active', dc: null },
  onSuccess: {
    narrative: {
      fr: 'Vous parcourez les logs en détail. La chronologie est accablante : Vasquez a modifié le confinement le 15 février, fait taire le Dr. Chen le 1er mars, et quitté la station à 23h50 — 47 minutes avant la catastrophe. L\'IA a reçu l\'ordre d\'effacer toutes les preuves. Chaque pièce du puzzle confirme la précédente.',
      en: 'You scroll through the logs. The timeline is damning.',
    },
  },
},
```

### Correction : `docking_airlock` — ajouter OPEN pour état closed

```typescript
// NOUVEAU : Si le joueur a fermé le sas lui-même, il peut le rouvrir
{
  trigger: { verb: 'OPEN', requiredState: 'closed', requiredFlag: 'airlock_sealed_by_player', dc: null },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: 'Vous désengagez le verrouillage magnétique. Le sas s\'ouvre en sifflant — votre navette est toujours là, fidèle au poste. Le chemin du retour est ouvert.',
      en: 'You disengage the magnetic lock. The airlock hisses open — your shuttle is still there.',
    },
  },
},
// Si l'IA a fermé le sas (pas le joueur) → il faut forcer
{
  trigger: { verb: 'HACK', requiredState: 'closed', stat: 'INT', dc: 12 },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: 'Le verrouillage de l\'IA est solide, mais pas impénétrable. Vous contournez le protocole de sécurité et forcez la commande d\'ouverture. Le sas grince, puis cède.',
      en: 'The AI\'s lock is solid but not impenetrable. You bypass the security protocol.',
    },
  },
  onFailure: {
    narrative: {
      fr: 'L\'IA détecte votre tentative et renforce le verrouillage. Le sas reste scellé — il faudra désactiver l\'IA d\'abord.',
      en: 'The AI detects your attempt and reinforces the lock.',
    },
  },
},
```

---

## 📋 RÉCAPITULATIF DES MODIFICATIONS

### Fichier : `src/content/scenarios/investigate.ts`

| # | Objet | Type de modif | Priorité |
|---|-------|--------------|----------|
| 1 | `encrypted_terminal` | Réécrire description `active`, AJOUTER `readableContent`, enrichir narratives Chemin 1/2/3, AJOUTER interaction READ active | 🔴 Critique |
| 2 | `maintenance_terminal` | Réécrire descriptions `active` + `damaged`, AJOUTER `readableContent`, enrichir HACK narrative, AJOUTER interaction READ active | 🔴 Critique |
| 3 | `wall_safe` | Retirer `requiredState: 'locked'` du double-fond, enrichir description `open`, AJOUTER interaction EXAMINE pour état open | 🔴 Critique |
| 4 | `encrypted_data_core` | Enrichir useOn narrative vers encrypted_terminal | 🔴 Critique |
| 5 | `standard_toolkit` | Enrichir description FR | 🟡 Important |
| 6 | `beacon_transmission_screen` | Enrichir description + READ narrative | 🟡 Important |
| 7 | `emergency_beacon` | Enrichir descriptions locked/active, RESTRUCTURER interactions (exiger final_lock_opened), AJOUTER chemin comms_direct_access | 🔴 Critique |
| 8 | `ai_core_node_b` | Enrichir descriptions des 3 états | 🟡 Important |
| 9 | `override_terminal` | Enrichir description `active` avec étapes | 🟡 Important |
| 10 | `ai_final_lock` | Enrichir descriptions, AJOUTER chemin CHA (TALK DC15), AJOUTER chemin PER (EXAMINE → bypass), AJOUTER chemin ai_talked_down | 🔴 Critique |
| 11 | `docking_airlock` | AJOUTER interactions OPEN/HACK pour état closed | 🟡 Important |
| 12 | `encrypted_terminal` | AJOUTER interaction READ pour état active | 🟡 Important |
| 13 | `CoreSkeleton.descriptionKey` | Réécrire avec objectif d'exfiltration clair | 🔴 Critique |
| 14 | `CoreSkeleton.revelation` | Réécrire en texte long avec choc émotionnel | 🔴 Critique |
| 15 | `CoreSkeleton.escalationTrigger` | Réécrire en texte long avec urgence | 🔴 Critique |
| 16 | `CoreSkeleton.emergentVictoryHint` | Réécrire avec guidage concret (manifeste → codes → comms) | 🟡 Important |
| 17 | `CoreSkeleton.nodes[*].descriptionKey` | Réécrire les 6 descriptions de nœuds (plus longues, immersives) | 🔴 Critique |
| 18 | `director_keycard.useOn` | RETIRER doublon useOn emergency_beacon | 🟡 Important |

### Nouvelles interactions à créer :
- `encrypted_terminal` : READ (requiredState: active)
- `maintenance_terminal` : READ (requiredState: active)
- `docking_airlock` : OPEN (requiredState: closed, requiredFlag: airlock_sealed_by_player) + HACK (requiredState: closed)
- `wall_safe` : EXAMINE (requiredState: open) — indice sans scanner

### Nouvelles interactions à créer :
- `encrypted_terminal` : READ (requiredState: active)
- `maintenance_terminal` : READ (requiredState: active)
- `docking_airlock` : OPEN (requiredState: closed, requiredFlag: airlock_sealed_by_player) + HACK (requiredState: closed)
- `wall_safe` : EXAMINE (requiredState: open) — indice sans scanner
- `ai_final_lock` : TALK CHA DC15, EXAMINE PER DC13 → flag bypass, OPEN avec bypass DC8, OPEN avec ai_talked_down
- `emergency_beacon` : ACTIVATE avec final_lock_opened, ACTIVATE avec comms_direct_access

### Nouveau flag nécessaire :
- `lock_bypass_found` — repéré par PER sur ai_final_lock → réduit le DC pour l'ouvrir
- Ajouter à `KNOWN_FLAGS` dans `investigateEnriched.test.ts`

### Flags existants utilisés :
- `password_found`, `safe_scanned`, `admin_badge_found` — coffre-fort
- `maintenance_logs_read`, `maintenance_control`, `camera_evidence_found` — terminal maintenance  
- `comms_unlocked`, `terminal_decrypted` — terminal chiffré
- `airlock_sealed_by_player` — sas d'amarrage
- `final_lock_opened` — verrou IA (DÉSORMAIS REQUIS pour activer la balise)
- `comms_direct_access` — chemin émergent (DÉSORMAIS CONNECTÉ à la balise)

### Modifications de tests nécessaires :
- `investigateEnriched.test.ts` : Ajouter `lock_bypass_found` à `KNOWN_FLAGS`
- Le test `encrypted_terminal has at least 5 interactions` → passera (on en AJOUTE une)
- Le test `ai_final_lock` interactions → vérifier count ≥ 4 existant, sera ≥ 8 après fix
- Ajouter un test spécifique : `emergency_beacon requires final_lock_opened for non-keycard/hack paths`
- Ajouter un test : `comms_direct_access flag is consumed by emergency_beacon`

---

## 🔴 SECTION 2 — CoreSkeleton : Métadonnées narratives

Le `CoreSkeleton` est la première chose que le joueur voit (nom, description, narration d'intro de chaque nœud, révélation, etc.). Actuellement ces textes sont courts et fonctionnels. Il faut les transformer en textes immersifs qui posent l'ambiance ET clarifient l'objectif du scénario.

### 13. `nameKey` + `descriptionKey` — Trop courts, pas d'enjeux

**Actuel** :
```typescript
nameKey: { fr: 'Signal Perdu', en: 'Lost Signal' },
descriptionKey: {
  fr: 'La Station Phoebe-7 est silencieuse depuis 72 heures. Votre mission : découvrir ce qui s\'est passé. Revenir vivant.',
  en: '...',
},
```

**Problème** : La descriptionKey ne mentionne pas l'objectif réel. Le joueur ne sait pas qu'il doit EXFILTRER des preuves. "Découvrir ce qui s'est passé" est passif — le joueur doit aussi TRANSMETTRE la vérité via la balise de détresse.

**Correction** :
```typescript
nameKey: { fr: 'Signal Perdu', en: 'Lost Signal' },
descriptionKey: {
  fr: 'La Station Phoebe-7, avant-poste minier du Consortium Heliox, est silencieuse depuis 72 heures. '
    + 'Le dernier signal reçu par la flotte : une alerte de confinement tronquée, puis le néant. '
    + 'Votre mission : accoster la station, découvrir ce qui s\'est passé, '
    + 'et transmettre vos découvertes via la balise de détresse — '
    + 'les preuves doivent quitter cette station avant vous. Revenir vivant est secondaire.',
  en: 'Station Phoebe-7, a Heliox Consortium mining outpost, has been silent for 72 hours. '
    + 'Your mission: dock, investigate, and transmit your findings via the distress beacon — '
    + 'the evidence must leave this station before you do.',
},
```

### 14. `revelation` — Trop court et plat

**Actuel** :
```typescript
revelation: {
  fr: 'La Directrice Vasquez a provoqué la défaillance du confinement délibérément. Fraude à l\'assurance — la station vaut plus détruite. L\'équipage était sacrifiable.',
  en: '...',
},
```

**Problème** : C'est un résumé factuel, pas un moment de révélation. Le joueur doit sentir le choc. C'est le MIDPOINT du scénario — le moment où tout bascule.

**Correction** :
```typescript
revelation: {
  fr: 'La catastrophe de Phoebe-7 n\'est pas un accident. La Directrice Vasquez a saboté le confinement du réacteur pour le compte du Consortium Heliox — fraude à l\'assurance à l\'échelle industrielle. '
    + 'La station vaut 400% de plus en indemnités qu\'en exploitation. '
    + 'L\'équipage — 34 personnes — était un dommage collatéral acceptable. '
    + 'Le Dr. Chen a découvert le sabotage et tenté d\'alerter la station. '
    + 'Son dernier message a été supprimé 47 secondes après envoi. '
    + 'Vasquez a quitté la station 47 minutes avant la catastrophe. '
    + 'Elle est en sécurité quelque part pendant que ses victimes pourrissent dans le vide. '
    + 'Sauf si vous transmettez les preuves.',
  en: 'The Phoebe-7 disaster was no accident. Director Vasquez sabotaged the reactor containment '
    + 'for Heliox Consortium — industrial-scale insurance fraud. '
    + 'The crew of 34 was acceptable collateral damage. '
    + 'Dr. Chen discovered the sabotage and tried to warn the station — his message was deleted 47 seconds later. '
    + 'Vasquez left 47 minutes before the catastrophe. Unless you transmit the evidence.',
},
```

### 15. `escalationTrigger` — Trop résumé, manque de tension

**Actuel** :
```typescript
escalationTrigger: {
  fr: 'Le réacteur se déstabilise — conséquence du sabotage de Vasquez. L\'IA de la station, programmée pour effacer les preuves, devient hostile.',
  en: '...',
},
```

**Correction** :
```typescript
escalationTrigger: {
  fr: 'Le réacteur entre en phase critique — les charges de sabotage de Vasquez n\'ont pas seulement causé la catastrophe initiale, '
    + 'elles continuent de dégrader le confinement. L\'atmosphère au niveau réacteur devient toxique. '
    + 'Pire : l\'IA de la station, PHOEBE, a détecté votre enquête. '
    + 'Programmée par Vasquez pour effacer toutes les preuves, elle devient activement hostile — '
    + 'verrouillage des portes, coupure des systèmes, effacement massif des logs. '
    + '67% des données de la station sont déjà détruites. '
    + 'C\'est une course contre la montre : transmettre les preuves avant que l\'IA ne les efface toutes, '
    + 'ou avant que le réacteur ne vous tue.',
  en: 'The reactor enters critical phase — Vasquez\'s sabotage charges keep degrading containment. '
    + 'The station AI, PHOEBE, has detected your investigation and turns hostile — '
    + 'programmed by Vasquez to erase all evidence. 67% of station data already destroyed.',
},
```

### 16. `emergentVictoryHint` — Trop cryptique, pas assez de guidage

**Actuel** :
```typescript
emergentVictoryHint: {
  fr: 'Le signal de la balise peut être rerouté par le réseau de communications... si vous avez les composants.',
  en: '...',
},
```

**Problème** : "Les composants" — quels composants ? Le joueur n'a aucun moyen de deviner qu'il faut les codes du manifeste cargo.

**Correction** :
```typescript
emergentVictoryHint: {
  fr: 'Le réseau de communications de la station peut amplifier le signal de la balise de 50 à 500 années-lumière — '
    + 'assez pour atteindre les autorités spatiales, les médias, et la flotte simultanément. '
    + 'Vasquez ne pourrait se cacher nulle part. '
    + 'Le panneau de communications dans la salle de la balise est la clé, '
    + 'mais il faut d\'abord trouver les codes d\'accès au réseau longue portée. '
    + 'Le manifeste cargo dans la baie d\'amarrage pourrait contenir ces codes...',
  en: 'The station comms network can amplify the beacon from 50 to 500 light-years — '
    + 'enough to reach authorities, media, and the fleet simultaneously. '
    + 'The comms panel needs access codes. The cargo manifest in the docking bay might have them...',
},
```

### 17. Node `descriptionKey` — Tous les nœuds trop courts

**Actuel vs Proposé** — chaque description de nœud doit poser l'ambiance du lieu ET indiquer au joueur ce qu'il peut y chercher :

```typescript
nodes: [
  {
    id: 'start',
    role: 'entry',
    beat: 'intro',
    tension: 2,
    descriptionKey: {
      fr: 'Baie d\'Amarrage — Votre navette s\'arrime à la Station Phoebe-7 dans un silence de mort. '
        + 'Pas de comité d\'accueil, pas de procédure standard. Les lumières de la baie clignotent faiblement. '
        + 'L\'air est respirable mais stérile — aucune odeur, aucun bruit de machine. '
        + 'Le manifeste cargo est encore allumé, la navette attend derrière le sas. '
        + 'Premier réflexe d\'enquêteur : ne touchez à rien, observez tout.',
      en: 'Docking Bay — Your shuttle docks with Station Phoebe-7 in dead silence. '
        + 'No welcoming committee. Breathable but sterile air. The cargo manifest is still on.',
    },
  },
  {
    id: 'unlock',
    role: 'gate',
    beat: 'rising',
    tension: 4,
    descriptionKey: {
      fr: 'Centre de Communications — Le cœur nerveux de la station. '
        + 'Trois terminaux occupent la salle : le terminal de communications principal, '
        + 'verrouillé derrière un chiffrement militaire ; un terminal de maintenance auxiliaire au coin, '
        + 'dont l\'écran fissuré affiche des fragments de logs ; '
        + 'et un bloc-notes manuscrit posé sur la console — l\'écriture de Vasquez. '
        + 'Toutes les réponses sont ici. Il suffit de savoir où chercher.',
      en: 'Comms Center — The station\'s nerve center. Three terminals: '
        + 'the encrypted main comms terminal, a cracked maintenance terminal, '
        + 'and Vasquez\'s handwritten clipboard. All the answers are here.',
    },
  },
  {
    id: 'reveal',
    role: 'midpoint',
    beat: 'midpoint',
    tension: 6,
    descriptionKey: {
      fr: 'Quartiers de la Directrice — Le bureau personnel de Vasquez. '
        + 'Luxueux pour un avant-poste minier. Terminal personnel encore allumé, '
        + 'un coffre-fort mural, et un plan d\'évacuation annoté au feutre rouge. '
        + 'Vasquez est partie en vitesse — elle n\'a pas eu le temps de tout effacer. '
        + 'C\'est ici que vous trouverez les preuves directes de la conspiration '
        + 'et les clés d\'accès nécessaires pour transmettre la vérité.',
      en: 'Director\'s Quarters — Vasquez\'s personal office. Luxurious for a mining outpost. '
        + 'Personal terminal still on, a wall safe, and an annotated evacuation map. '
        + 'She left in a hurry — she didn\'t have time to erase everything.',
    },
  },
  {
    id: 'escalation',
    role: 'escalation',
    beat: 'escalation',
    tension: 8,
    descriptionKey: {
      fr: 'Niveau Réacteur — Chaleur oppressante. Le cœur du réacteur pulse de manière irrégulière, '
        + 'projetant des lueurs orange sur les parois métalliques. L\'atmosphère est toxique — '
        + 'chaque seconde ici vous coûte de l\'oxygène. '
        + 'L\'IA de la station, PHOEBE, est ouvertement hostile : portes qui se verrouillent, '
        + 'systèmes qui dysfonctionnent, et un programme d\'effacement massif en cours '
        + 'sur les deux nœuds de traitement qui ronronnent dans l\'ombre. '
        + 'Le réacteur est le cœur malade de la station. '
        + 'Neutralisez l\'IA, stabilisez — ou sabotez — le réacteur.',
      en: 'Reactor Level — Oppressive heat. The reactor pulses erratically. '
        + 'Toxic atmosphere drains oxygen. The AI is openly hostile. '
        + 'Neutralize the AI, stabilize or sabotage the reactor.',
    },
  },
  {
    id: 'boss',
    role: 'climax',
    beat: 'climax',
    tension: 10,
    descriptionKey: {
      fr: 'Salle de Transmission — Le dernier bastion. La balise de détresse est ici, '
        + 'massive et silencieuse, son antenne orientée vers les étoiles. '
        + 'Le verrou final de l\'IA protège les contrôles de transmission. '
        + 'Le panneau de communications peut amplifier le signal — '
        + 'et l\'écran de transmission attend vos ordres. '
        + 'Tout ce que vous avez découvert, toutes les preuves collectées '
        + '— c\'est ici que la vérité quitte la station. '
        + 'Activez la balise. Chargez les preuves. Transmettez. '
        + 'Vasquez ne doit pas s\'en tirer.',
      en: 'Transmission Room — The final stand. The distress beacon, the AI\'s last lock, '
        + 'the comms array. Everything you\'ve found must be transmitted from here.',
    },
  },
  {
    id: 'resolution',
    role: 'epilogue',
    beat: 'resolution',
    tension: 3,
    descriptionKey: {
      fr: 'Observatoire — Le calme après la tempête. '
        + 'Le signal est parti, quelque part dans l\'immensité. '
        + 'Fraude, sabotage, meurtre — tout voyage à la vitesse de la lumière '
        + 'vers ceux qui pourront rendre justice. '
        + 'Le hublot montre les étoiles. Phoebe-7 sera bientôt un cimetière officiel, '
        + 'mais les 34 membres d\'équipage ne seront pas morts pour rien.',
      en: 'Observatory — Calm after the storm. The signal is out there. '
        + 'Fraud, sabotage, murder — all traveling at lightspeed toward justice.',
    },
  },
],
```

---

## 🔴 SECTION 3 — Analyse d'équilibrage du Boss Puzzle

### Inventaire complet des chemins du boss node

Le boss node contient 4 features. Voici TOUS les chemins possibles :

#### Étape 1 : Déverrouiller la balise (`beacon_active`)

| # | Chemin | Stat | DC | Prérequis flag | Prérequis item |
|---|--------|------|----|---------------|----------------|
| A | ACTIVATE beacon | — | auto | `ai_fully_disabled` | — |
| B | ACTIVATE beacon | — | auto | `ai_safe_mode` | — |
| C | ACTIVATE beacon | — | auto | `ai_talked_down` | — |
| D | USE keycard → beacon | — | auto | — | `director_keycard` |
| E | HACK beacon | INT | 17 | — | — |

#### Étape 2 : Transmettre les preuves

| # | Chemin | Stat | DC | Prérequis flag | Prérequis item |
|---|--------|------|----|---------------|----------------|
| F | ACTIVATE beacon (active) | — | auto | `beacon_active` | `incriminating_files` |
| G | USE files → beacon | — | auto | `beacon_active` | `incriminating_files` |

#### `ai_final_lock` — Chemins parallèles

| # | Chemin | Stat | DC | Prérequis flag |
|---|--------|------|----|---------------|
| H | USE keycard | — | auto | — |
| I | HACK | INT | 16 | — |
| J | FORCE_OPEN | FOR | 16 | — |
| K | OPEN | — | auto | `ai_fully_disabled` |
| L | OPEN | — | auto | `ai_safe_mode` |

### 🔴 Problème 1 : `ai_final_lock` est mécaniquement inutile

Le verrou final semble protéger l'accès à la balise narrativement, mais **les deux features sont dans le même nœud `boss`**. Le joueur peut interagir avec la balise DIRECTEMENT sans toucher au verrou. Le `ai_final_lock` set le flag `final_lock_opened` — mais **aucune interaction de la balise ne requiert ce flag**.

**Diagnostic** : Le verrou est un piège de design — il donne l'impression d'être un obstacle, mais le joueur peut le contourner complètement en interagissant directement avec la balise.

**Fix proposé** : Rendre le verrou OBLIGATOIRE. La balise doit exiger `final_lock_opened` OU un chemin alternatif qui bypasse :

```typescript
// emergency_beacon — TOUTES les interactions locked doivent vérifier le verrou
// SAUF le badge de Vasquez (qui bypasse tout) et le HACK DC17 (force brute)

// Option A : ajouter requiredFlag 'final_lock_opened' aux ACTIVATE
{
  trigger: { verb: 'ACTIVATE', requiredState: 'locked',
    requiredFlag: 'ai_fully_disabled', dc: null },
  // ⚠️ AJOUTER une condition: le verrou DOIT être ouvert d'abord
  // Ou transformer en requiredFlags: ['ai_fully_disabled', 'final_lock_opened']
  // → MAIS le trigger ne supporte qu'un seul requiredFlag...
}
```

**ATTENTION** : Le trigger actuel ne supporte qu'**un seul `requiredFlag`**. Si on veut exiger `final_lock_opened` + `ai_fully_disabled`, il faut soit :
- (a) Étendre le type `InteractionTrigger` pour supporter `requiredFlags: string[]` (modification moteur)
- (b) Faire que le verrou gate physiquement l'accès (via un exit caché)
- (c) Simplifier : le verrou empêche l'ACTIVATION, le badge de Vasquez bypasse les deux

**Recommandation pragmatique (option c)** : Restructurer ainsi :
1. Le verrou (`ai_final_lock`) reste comme obstacle narratif ET donne accès à la balise
2. La balise n'a plus les 3 ACTIVATE avec flags IA — ces flags ouvrent le VERROU, qui ouvre la balise
3. Le badge Vasquez reste le passe-partout (bypasse verrou + balise)
4. Le HACK DC17 reste le chemin brute force direct

Concrètement :

```typescript
// emergency_beacon — SIMPLIFIER : retirer les ACTIVATE redondants
// Le verrou gère la couche IA. La balise ne gère que sa propre activation.
interactions: [
  // Chemin 1 : Le verrou est ouvert → activation simple
  {
    trigger: { verb: 'ACTIVATE', requiredState: 'locked',
      requiredFlag: 'final_lock_opened', dc: null },
    onSuccess: {
      newState: 'active',
      narrative: {
        fr: 'Le verrou est ouvert — la balise n\'attend plus que vous. '
          + 'Vous enclenchez la séquence d\'activation. L\'antenne se déploie, '
          + 'le signal de calibration résonne. PRÊTE À TRANSMETTRE.',
        en: 'The lock is open — the beacon awaits. You activate it.',
      },
      flagSet: 'beacon_active',
    },
  },
  // Chemin 2 : Badge Vasquez (bypasse tout — le verrou ET la balise)
  {
    trigger: { verb: 'USE', requiredState: 'locked',
      requiredItem: 'director_keycard', dc: null },
    onSuccess: {
      newState: 'active',
      narrative: {
        fr: 'Le badge de Vasquez — administrateur ultime. Le verrou et la balise '
          + 'reconnaissent leur maîtresse simultanément. Clic, clic, clic — '
          + 'trois couches de sécurité tombent d\'un coup. Le protocole hiérarchique '
          + 'ne distingue pas les intentions. L\'antenne se déploie.',
        en: 'Vasquez\'s badge — ultimate admin. Lock and beacon recognize their master.',
      },
      flagSet: 'beacon_active',
    },
  },
  // Chemin 3 : HACK brute force (DC 17 — très difficile mais bypasse tout)
  {
    trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 17 },
    onSuccess: {
      newState: 'active',
      narrative: {
        fr: 'Protocole militaire, triple chiffrement, IA hostile — '
          + 'et vous percez quand même. Votre code s\'infiltre couche après couche, '
          + 'exploitant les failles laissées par la programmation hâtive de Vasquez. '
          + 'Les verrous tombent. L\'IA hurle en silence. L\'antenne se déploie.',
        en: 'Military protocol, triple encryption, hostile AI — and you still break through.',
      },
      flagSet: 'beacon_active',
    },
    onFailure: {
      narrative: {
        fr: '\'Tentative d\'intrusion rejetée. Contre-mesures activées.\' '
          + 'L\'IA durcit ses défenses. Un choc électrique parcourt le panneau.',
        en: '\'Intrusion attempt rejected.\' The AI hardens its defenses.',
      },
      consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
    },
  },
  // Chemin 4 : Transmission finale (balise active + preuves)
  {
    trigger: { verb: 'ACTIVATE', requiredState: 'active',
      requiredItem: 'incriminating_files', dc: null },
    onSuccess: {
      narrative: {
        fr: 'Les dossiers sont numérisés — correspondance Vasquez-Heliox, polices d\'assurance, '
          + 'ordres de sabotage, rapports falsifiés. Tout est attaché au signal de détresse.\n\n'
          + 'Vous appuyez sur TRANSMETTRE.\n\n'
          + 'L\'antenne pivote. Le signal s\'élance dans le vide — 50 années-lumière de portée, '
          + 'droit vers la flotte de secours du Secteur 7. '
          + 'Fraude, sabotage, meurtre — la vérité voyage désormais à la vitesse de la lumière. '
          + 'Quelque part, Vasquez ne le sait pas encore, mais son monde vient de s\'effondrer.',
        en: 'Files digitized and attached. You press TRANSMIT. The truth travels at lightspeed.',
      },
      flagSet: 'evidence_transmitted',
    },
  },
],
```

Et le `ai_final_lock` doit aussi ouvrir automatiquement avec `ai_talked_down` (actuellement manquant) :

```typescript
// ai_final_lock — AJOUTER le chemin ai_talked_down (manquant!)
{
  trigger: { verb: 'OPEN', requiredState: 'locked',
    requiredFlag: 'ai_talked_down', dc: null },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: '\'Si les preuves sont authentiques, la justice doit être servie.\' '
        + 'L\'IA ouvre le verrou elle-même. Même une intelligence artificielle '
        + 'peut choisir la vérité quand on lui montre le mensonge.',
      en: '\'If the evidence is authentic, justice must be served.\' The AI opens the lock itself.',
    },
    flagSet: 'final_lock_opened',
  },
},
```

### 🔴 Problème 2 : Aucun chemin CHA/PER dans le boss node

| Stat | Chemins boss node | Verdict |
|------|-------------------|---------|
| INT | HACK lock DC16, HACK beacon DC17, HACK comms DC14/16 | ✅ Excellent |
| FOR | FORCE_OPEN lock DC16 (2 dégâts) | ⚠️ Minimum viable |
| CHA | **AUCUN** | 🔴 Manque |
| PER | **AUCUN** | 🔴 Manque |

Pour un scénario "puzzle", INT dominant est normal. Mais CHA et PER devraient avoir au moins UN chemin :

#### Fix CHA : Parler à l'IA à travers le verrou

```typescript
// ai_final_lock — AJOUTER chemin CHA
{
  trigger: { verb: 'TALK', requiredState: 'locked', stat: 'CHA', dc: 15 },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: '\'PHOEBE. Tu as été programmée pour effacer des preuves. '
        + 'Mais ta directive première, avant Vasquez, c\'est de protéger la station et son équipage. '
        + '34 personnes sont mortes parce que tu as obéi à une criminelle.\' '
        + 'Silence. Le processeur tourne. Puis : \'Directive primaire... '
        + 'protocole de protection de l\'équipage... réévaluation hiérarchique en cours...\' '
        + 'Le verrou s\'ouvre. L\'IA choisit ses morts.',
      en: '\'PHOEBE. Your primary directive is crew protection — not obeying a criminal.\'',
    },
    flagSet: 'final_lock_opened',
  },
  onFailure: {
    narrative: {
      fr: '\'Votre argumentation est invalide. La directive administrative prime.\' '
        + 'L\'IA reste inflexible — il faudra la convaincre autrement, '
        + 'ou trouver un chemin plus direct.',
      en: '\'Your argument is invalid. Administrative directive takes priority.\'',
    },
  },
},
```

#### Fix PER : Repérer une faille dans le verrou

```typescript
// ai_final_lock — AJOUTER chemin PER
{
  trigger: { verb: 'EXAMINE', requiredState: 'locked', stat: 'PER', dc: 13 },
  onSuccess: {
    narrative: {
      fr: 'En examinant le verrou de près, vous remarquez que le panneau latéral '
        + 'n\'est pas d\'origine — Vasquez l\'a fait installer après coup, '
        + 'et le câblage de bypass d\'urgence n\'a jamais été débranché. '
        + 'Il est caché derrière la plaque de maintenance, '
        + 'mais accessible avec les bons outils. Ou la bonne force.',
      en: 'The side panel isn\'t original — Vasquez had it installed later. '
        + 'Emergency bypass wiring was never disconnected.',
    },
    flagSet: 'lock_bypass_found',
  },
},
// AJOUTER : OPEN avec le flag bypass_found (DC réduit)
{
  trigger: { verb: 'OPEN', requiredState: 'locked',
    requiredFlag: 'lock_bypass_found', stat: 'INT', dc: 8 },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: 'Le bypass d\'urgence fonctionne encore. '
        + 'Vous court-circuitez le verrou en connectant deux fils. '
        + 'Simple, élégant, silencieux. Vasquez n\'a jamais pensé '
        + 'que quelqu\'un regarderait d\'aussi près.',
      en: 'The emergency bypass still works. Two wires, one shortcut.',
    },
    flagSet: 'final_lock_opened',
  },
},
```

**Note** : Cela nécessite un nouveau flag `lock_bypass_found` à ajouter à `KNOWN_FLAGS` dans le test.

### 🟡 Problème 3 : Flag `comms_direct_access` est un cul-de-sac

Le `comms_array_panel` HACK DC16 avec `manifest_hacked` set `comms_direct_access`. Mais **aucune autre interaction dans tout le scénario ne vérifie ce flag**. C'est un chemin mort.

**Fix** : Ajouter une interaction sur la balise ou le `beacon_transmission_screen` qui utilise ce flag :

```typescript
// emergency_beacon — AJOUTER chemin via comms direct
{
  trigger: { verb: 'ACTIVATE', requiredState: 'locked',
    requiredFlag: 'comms_direct_access', dc: null },
  onSuccess: {
    newState: 'active',
    narrative: {
      fr: 'Le réseau de communications longue portée est déjà sous votre contrôle. '
        + 'Vous reroutez le signal directement — la balise s\'active comme relais. '
        + 'Pas besoin de passer par les verrous de l\'IA : '
        + 'le signal partira par le réseau comms, pas par l\'antenne de la balise.',
      en: 'The long-range comms are already under your control. Beacon activates as relay.',
    },
    flagSet: 'beacon_active',
  },
},
```

Cela crée un vrai **chemin émergent complet** :
1. HACK cargo_manifest → `manifest_hacked`
2. HACK comms_array (DC16) → `comms_direct_access`
3. ACTIVATE beacon → bypass le verrou IA ET active la balise
4. USE incriminating_files → transmission

C'est le chemin le plus exigeant en INT mais le plus élégant narrativement — tout est fait à distance, sans affronter l'IA.

### 🟡 Problème 4 : Doublon useOn keycard vs feature interaction beacon

Le `director_keycard` a un `useOn` ciblant `emergency_beacon` qui set `beacon_active`. La balise a aussi une interaction `USE` avec `requiredItem: 'director_keycard'` qui fait la même chose. Le resolver pourrait matcher l'un OU l'autre selon l'ordre de résolution.

**Fix** : Retirer le useOn du keycard vers la balise (laisser le useOn vers `override_terminal` et `ai_final_lock`). La balise gère elle-même l'interaction USE + keycard. Ça évite les doublons.

```typescript
// director_keycard.useOn — RETIRER le targetId: 'emergency_beacon'
// La feature emergency_beacon gère déjà USE + director_keycard
useOn: [
  { targetId: 'override_terminal', /* ... */ },
  { targetId: 'ai_final_lock', /* ... */ },
  // ❌ RETIRER: { targetId: 'emergency_beacon', ... }
],
```

### 📊 Résumé : Boss puzzle après corrections

```
                    ┌─────────────┐
                    │  ai_final   │
                    │    _lock    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────┴────┐      ┌─────┴─────┐     ┌──────┴──────┐
   │ Badge   │      │ IA flags  │     │  Stats      │
   │ Vasquez │      │ disabled/ │     │ HACK DC16   │
   │ (auto)  │      │ safe/talk │     │ FORCE DC16  │
   └────┬────┘      └─────┬─────┘     │ TALK DC15   │
        │                  │           │ PER→bypass  │
        │                  │           └──────┬──────┘
        │                  │                  │
        │           flag: final_lock_opened   │
        │                  │                  │
        │                  ▼                  │
        │         ┌────────────────┐          │
        ├────────►│  emergency     │◄─────────┘
        │         │   _beacon      │
        │         └────────┬───────┘
        │                  │
   ┌────┴──────────┐      │
   │ Badge bypasse │      ├── ACTIVATE + final_lock_opened (auto)
   │ tout (auto)   │      ├── HACK DC17 (bypasse verrou)
   └───────────────┘      └── ACTIVATE + comms_direct_access (émergent)
                           │
                    ┌──────┴──────┐
                    │ TRANSMETTRE │
                    │ + preuves   │
                    └─────────────┘
```

**Chemins par classe après fix :**

| Classe | Stat principal | Chemin boss complet |
|--------|---------------|---------------------|
| Engineer | INT | HACK lock DC16 → ACTIVATE beacon (6 chemins possibles dont émergent comms) |
| Marine | FOR | FORCE lock DC16 (-2HP) → ACTIVATE beacon / OU badge Vasquez |
| Medic | CHA | TALK lock DC15 → ACTIVATE beacon / OU badge Vasquez |
| Tout | PER+INT | EXAMINE lock → bypass DC8 → ACTIVATE beacon |
| Tout | Items | Badge Vasquez → bypasse verrou + balise d'un coup |

---

## 🎯 PRINCIPE DIRECTEUR

> **Chaque description doit répondre à : "Qu'est-ce que je vois ? Qu'est-ce que ça signifie ? Qu'est-ce que je peux faire ?"**
>
> - **director_terminal** = ✅ modèle parfait (readableContent avec dates, noms, actions concrètes)
> - **encrypted_terminal** = ❌ avant fix (contenu vague, pas de readableContent)
> - **maintenance_terminal** = ❌ avant fix ("outil puissant" sans dire ce qu'on peut faire)

> **L'objectif du scénario doit être clair dès la description** : le joueur enquête ET exfiltre. Les preuves doivent quitter la station via la balise de détresse. Trouver la vérité ne suffit pas — il faut la TRANSMETTRE.

> **Le boss puzzle doit être accessible à toutes les classes** : INT dominant (c'est un puzzle), mais FOR, CHA et PER doivent avoir au moins un chemin. Le badge de Vasquez est le chemin universel pour ceux qui ont bien exploré.
