# Transcript — Signal Perdu (`investigate`)

> Généré par `npx tsx scripts/narrative-transcript.ts`. Ne pas éditer à la main.
> `⚠` marque un texte que le joueur ne peut pas atteindre, ou un nom manquant.

## Intro du scénario

> La Station Phoebe-7, avant-poste minier du Consortium Heliox, est silencieuse depuis 72 heures. Le dernier signal reçu par la flotte : une alerte de confinement tronquée, puis le néant. Votre mission : accoster la station, découvrir ce qui s'est passé, et transmettre vos découvertes via la balise de détresse — les preuves doivent quitter cette station avant vous. Revenir vivant est secondaire.

---

## Nœud `start` — rôle `entry`, beat `intro`, tension 2

*Nom de lieu tiré parmi :* « Sas d'amarrage principal » · « Sas d'EVA » · « Sas de transit » · « Sas de décontamination » · « Sas de sécurité » · « Sas de ravitaillement » · « Sas de fret » · « Sas d'urgence » · « Sas d'accès extérieur » · « Sas de quarantaine » · « Sas de transfert de personnel » · « Sas de maintenance extérieure » · « Sas blindé de sécurité » · « Sas de sortie d'urgence » · « Sas de pressurisation » · « Sas de navigation » · « Sas d'expédition scientifique » · « Sas d'inspection » · « Sas de survie » · « Sas de communication » · « Sas de transfert de charge » · « Sas d'évacuation de masse »

### Ce que le joueur lit en entrant

> Votre navette s'arrime à la Station Phoebe-7 dans un silence de mort. Pas de comité d'accueil, pas de procédure d'arrimage, pas une voix sur la fréquence. Les lumières de la baie clignotent faiblement, à contretemps. L'air est respirable mais stérile — aucune odeur, aucun bruit de machine.

> Vous voyez autour de vous Sas d'amarrage, Terminal du manifeste cargo, Pinces d'amarrage.
> Parmi les débris, vous remarquez Scanner portable, Trousse à outils standard.

*Sorties :* unlock

### Éléments

#### Sas d'amarrage  `docking_airlock`

- **initial (open)** · `openness=open lock=unlocked` · via `descriptions`
  > Ouvert — votre navette est arrimée de l'autre côté. Les indicateurs de pression sont normaux. C'est votre seul moyen de quitter la station.
- **après newState:closed** · `openness=closed lock=unlocked` · via `descriptions`
  > Scellé. Le voyant indique VERROUILLAGE AUTOMATIQUE. L'IA a coupé l'accès à votre navette.
- ⚠ **INATTEIGNABLE** `descriptions.broken`
  > Le mécanisme du sas est détruit. L'accès à la navette est bloqué physiquement.
- **EXAMINE** (état=open, auto)
  - réussite ⚠ `sans newState`
    > Les jauges de pression sont stables. Votre navette attend de l'autre côté, silencieuse. Le manifeste de vol indique un temps de trajet retour de 14 heures vers la flotte.
- **CLOSE** (état=open, auto)
  - réussite `newState=closed` `flagSet=airlock_sealed_by_player`
    > Vous scellez le sas derrière vous. Verrouillage magnétique activé. Personne n'entre — personne ne sort sans votre autorisation.
- **OPEN** (état=closed, flag=airlock_sealed_by_player, auto)
  - réussite `newState=open`
    > Vous désengagez le verrouillage magnétique. Le sas s'ouvre en sifflant — votre navette est toujours là, fidèle au poste. Le chemin du retour est ouvert.
- **HACK** (état=closed, DC 12 INT)
  - réussite `newState=open`
    > Le verrouillage de l'IA est solide, mais pas impénétrable. Vous contournez le protocole de sécurité et forcez la commande d'ouverture. Le sas grince, puis cède.
  - échec
    > L'IA détecte votre tentative et renforce le verrouillage. Le sas reste scellé — il faudra désactiver l'IA d'abord.

#### Terminal du manifeste cargo  `cargo_manifest_terminal`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > L'écran défile lentement. Le dernier chargement répertorié remonte à trois mois.
- ⚠ **INATTEIGNABLE** `descriptions.broken`
  > Terminal détruit. L'écran est noir, le boîtier fracturé.
- `readableContent` (258 car.)
- **READ** (auto)
  - réussite ⚠ `sans newState` `flagSet=manifest_read`
    > Le manifeste dévoile un chargement suspect daté d'il y a 3 mois : matériel classifié, autorisation Vasquez uniquement. La note en marge — 'NE PAS scanner au contrôle douanier' — en dit long.
- **HACK** (DC 10 INT)
  - réussite ⚠ `sans newState` `flagSet=manifest_hacked`
    > Accès étendu. Logs de communication masqués : Vasquez a personnellement réceptionné le chargement, seule, à 03h00. Les caméras de la baie étaient désactivées ce jour-là.
  - échec
    > Le système rejette votre tentative. ACCÈS REFUSÉ clignote en rouge. Au moins le manifeste de surface est lisible.

#### Pinces d'amarrage  `docking_clamps`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > Elles maintiennent votre navette en position. Le système de largage rapide est fonctionnel — pour un départ précipité.
- **après newState:broken** · `activity=inactive power=unpowered integrity=broken` · via `descriptions`
  > Les pinces sont détruites. Votre navette dérive lentement — le câble de secours la retient encore, mais pas pour longtemps.
- **après newState:inactive** · `activity=inactive power=powered` · via `descriptions`
  > Les pinces se sont rétractées. Votre navette est libre de manœuvrer — le chemin du retour est ouvert.
- **EXAMINE** (état=active, auto)
  - réussite ⚠ `sans newState`
    > Système d'amarrage standard. Commande de largage d'urgence accessible. Temps de découplage estimé : 12 secondes. Votre police d'assurance si les choses tournent mal.
- **SABOTAGE** (état=active, DC 14 INT)
  - réussite `newState=broken` `flagSet=clamps_sabotaged`
    > Vous sabotez les pinces. Elles se rétractent dans un grincement — votre navette décroche lentement. Plus de retour facile. Mais l'IA ne pourra pas non plus verrouiller votre navette.
  - échec
    > Le mécanisme résiste. Les pinces sont conçues pour supporter des impacts d'astéroïdes — vos outils ne suffisent pas.
- **ACTIVATE** (état=active, DC 8 INT)
  - réussite `newState=inactive` `flagSet=shuttle_released`
    > Largage exécuté. Les pinces se rétractent proprement. Votre navette s'écarte de quelques mètres — prête pour un départ rapide.

### Objets

#### Scanner portable  `scanner_device`

- description
  > Multi-fréquence. Repère les anomalies biologiques et électroniques dans un rayon de dix mètres. Batterie à 89 %.
- **USE sur `wall_safe`** ⚠ `sans newState` `flagSet=safe_scanned`
  > Le scanner révèle un compartiment caché derrière le coffre — un double fond. Le mécanisme d'ouverture secondaire est électronique.
- **USE sur `ai_core_node_a`** ⚠ `sans newState` `flagSet=ai_scan_revealed`
  > Le scanner détecte un flux de données anormal : l'IA exécute un programme d'effacement massif. 67% des logs de la station sont déjà détruits.
- **USE sur `reactor_core`** ⚠ `sans newState` `flagSet=reactor_sabotage_confirmed`
  > Lectures alarmantes. Le cœur du réacteur montre des micro-fractures dans le confinement — pas un accident, des charges de sabotage placées chirurgicalement. Vasquez savait exactement où frapper.

#### Trousse à outils standard  `standard_toolkit`

- description
  > Maintenance spatiale : testeur de circuits, tournevis magnétique, pinces isolées, ruban conducteur. De quoi réparer dans l'urgence.
- **USE sur `maintenance_terminal`** `newState=intact+active` `flagSet=maintenance_terminal_repaired`
  > Vous ouvrez le boîtier du terminal et pontez le circuit endommagé. L'écran s'illumine — accès partiel restauré.
- **USE sur `ai_core_node_a`** ⚠ `sans newState` `flagSet=node_a_exposed`
  > Vous dévissez le panneau de maintenance du nœud. Les connecteurs de données sont exposés — il suffirait de déconnecter les fibres optiques principales.
- **USE sur `override_terminal`** `newState=intact+active` `flagSet=override_terminal_repaired`
  > Vous remplacez le circuit grillé du terminal de neutralisation. L'écran s'allume faiblement — le système est partiellement opérationnel.

#### Noyau de données chiffré  `encrypted_data_core` *(caché)*

- description
  > Noyau de données lourdement chiffré — protocole militaire niveau 4. Contient les logs de la station des dernières 72 heures. La clé de déchiffrement est quelque part sur la station.
- **USE sur `encrypted_terminal`** `newState=unlocked+active` `flagSet=terminal_decrypted`
  > Vous insérez le noyau de données. Le terminal ronronne, les barres de déchiffrement progressent — 40%, 70%, 98%... ACCÈS AUX LOGS : ACCORDÉ.

Les communications se déversent à l'écran. Un échange saute aux yeux : le Dr. Chen signalant des "modifications non autorisées du confinement" — message supprimé 47 secondes plus tard par la Directrice Vasquez. Un ordre chiffré d'Heliox : "Calendrier confirmé. Transfert 72h après l'incident." Le dernier log : alerte niveau 5, puis le silence.

---

## Nœud `unlock` — rôle `gate`, beat `rising`, tension 4

*Nom de lieu tiré parmi :* « Centre des opérations » · « Salle de commandement » · « Centre de contrôle principal » · « Salle de surveillance avancée » · « Centre de coordination » · « Poste de commandement orbital » · « Centre de navigation spatiale » · « Salle de gestion des systèmes » · « Centre des communications » · « Poste de contrôle des docks » · « Salle de contrôle scientifique » · « Centre d'opérations tactiques » · « Poste de surveillance de la station » · « Salle de contrôle de l'environnement » · « Centre d'alerte d'urgence » · « Poste de contrôle des réacteurs » · « Salle des opérations médicales » · « Centre de commandement de sécurité » · « Poste de contrôle de la gravité » · « Salle de dispatch » · « Centre de contrôle de la station » · « Poste de commandement de secours »

### Ce que le joueur lit en entrant

> Le cœur nerveux de la station, et personne pour le faire battre. Les ventilateurs des consoles tournent encore, à vide, dans une pièce que rien n'éclaire sinon les écrans. Sur l'un d'eux, un curseur clignote au bout du même message depuis soixante-douze heures.

> Vous voyez autour de vous Terminal chiffré, Terminal de maintenance, Bloc-notes du directeur.

*Sorties :* start, reveal

### Éléments

#### Terminal chiffré  `encrypted_terminal`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > L'écran rouge sang exige une clé de chiffrement. Sur le flanc du boîtier, un slot pour noyau de données, propre, jamais utilisé.
- **après newState:active** · `lock=locked openness=closed activity=active power=powered` · via `descriptions`
  > L'écran rouge sang exige une clé de chiffrement. Sur le flanc du boîtier, un slot pour noyau de données, propre, jamais utilisé.
- **après newState:broken** · `lock=locked openness=closed integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > Terminal détruit. L'écran est fendu en étoile, les circuits grésillent. Les données sont inaccessibles par cette voie.
- ⚠ **INATTEIGNABLE** `descriptions.active`
  > Les logs défilent : soixante-douze heures de trafic. Trois échanges reviennent — Vasquez, un expéditeur marqué HELIOX, et une alerte de confinement que personne n'a relayée.
- `readableContent` (1319 car.)
- **USE** (état=locked, objet=encrypted_data_core, auto)
  - réussite `newState=active` `flagSet=comms_unlocked`
    > Le noyau de données s'enclenche. Les algorithmes de déchiffrement s'exécutent — 3 secondes, 5, 12... L'écran passe au vert. ACCÈS ACCORDÉ.

Les logs défilent. Un message saute aux yeux : le Dr. Chen a tenté d'alerter l'équipage d'une modification non autorisée du confinement. Son message a été supprimé par Vasquez 47 secondes après envoi. Le dernier log s'arrête net à 03h12 — défaillance confinement, puis silence.
- **HACK** (état=locked, DC 13 INT)
  - réussite `newState=active` `flagSet=comms_unlocked`
    > Protocole militaire niveau 4 — mais pas sans failles. Vous exploitez une backdoor dans le firmware. L'écran passe au vert.

Les logs s'affichent. Le Dr. Chen a lancé une alerte à l'équipage — supprimée par Vasquez en moins d'une minute. Un message chiffré d'Heliox confirme un "transfert 72h après l'incident". Le dernier log : défaillance confinement à 03h12, puis le néant. Mais votre intrusion a laissé des traces dans les registres — l'IA pourrait le remarquer.
  - échec
    > Le chiffrement résiste. Le système enregistre votre tentative — un compteur d'intrusion s'incrémente. Encore 2 essais avant verrouillage total.
- **USE** (état=locked, flag=password_found, auto)
  - réussite `newState=active` `flagSet=comms_unlocked`
    > Le code 7-2-9-4 déverrouille un accès secondaire. Partiel, mais suffisant. Les logs de maintenance défilent : quelqu'un a modifié les paramètres de confinement du réacteur avec les codes administrateur de Vasquez, exactement 72 heures avant la catastrophe. Le Dr. Chen a tenté de sonner l'alarme — son message a été effacé. L'IA a reçu l'ordre de nettoyer les traces. Ce n'est pas un accident.
- **TALK** (état=locked, DC 13 CHA)
  - réussite `newState=active` `flagSet=comms_unlocked`
    > 'Demande d'accès enregistrée.' La voix synthétique de l'IA résonne dans la salle vide. 'Protocole d'urgence : accès temporaire accordé. Durée : 15 minutes.' Suffisant.
  - échec
    > 'Identifiants non reconnus. Personnel non autorisé détecté.' La voix de l'IA est glaciale. Les lumières de la salle passent à l'orange. Vous venez de vous faire repérer.
- **BREAK** (état=locked, DC 14 FOR)
  - réussite `newState=broken` `flagSet=terminal_destroyed`
    > Le terminal explose sous vos coups. Étincelles, fumée, silence. Les données sont détruites — mais le circuit de verrouillage de la porte adjacente a sauté en même temps. Passage libre, preuves perdues.
- **READ** (état=active, auto)
  - réussite ⚠ `sans newState`
    > Vous parcourez les logs en détail. La chronologie est accablante : Vasquez a modifié le confinement le 15 février, fait taire le Dr. Chen le 1er mars, et quitté la station à 23h50 — 47 minutes avant la catastrophe. L'IA a reçu l'ordre d'effacer toutes les preuves. Chaque pièce du puzzle confirme la précédente.

#### Terminal de maintenance  `maintenance_terminal`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > L'écran est fissuré mais lisible. Une entrée tourne en boucle : « Modification paramètres confinement — Autorisation ADMIN_VASQUEZ ». Aucune recalibration n'était au planning.
- **après newState:intact+active** · `integrity=intact activity=active power=powered` · via `descriptions`
  > Quatre panneaux répondent : caméras, portes, ventilation, diagnostics. Soixante-douze heures d'archives, et le contrôle manuel des sas.
- ⚠ **INATTEIGNABLE** `descriptions.broken`
  > Terminal complètement hors service. Plus rien à en tirer.
- `readableContent` (764 car.)
- **READ** (état=damaged, auto)
  - réussite ⚠ `sans newState` `flagSet=maintenance_logs_read`
    > L'écran fissuré affiche des fragments : interventions non autorisées sur le confinement, exactement 72 heures avant le silence radio. Codes d'accès modifiés par 'ADMIN_VASQUEZ'. Elle a couvert ses traces — presque.
- **REPAIR** (état=damaged, DC 11 INT)
  - réussite `newState=intact+active` `flagSet=maintenance_control`
    > Vous reconnectez les circuits endommagés. L'écran s'illumine — accès complet. Caméras, portes, ventilation — vous avez les yeux et les mains de la station.
- **REPAIR** (état=damaged, objet=standard_toolkit, auto)
  - réussite `newState=intact+active` `flagSet=maintenance_control`
    > Le testeur de circuits identifie le composant grillé. Remplacement en 30 secondes. L'écran reprend vie — accès complet aux systèmes de maintenance.
- **HACK** (état=active, DC 12 INT)
  - réussite ⚠ `sans newState` `flagSet=camera_evidence_found`
    > Vous accédez aux caméras de sécurité archivées. L'enregistrement du 1er mars à 23h50 montre la Directrice Vasquez quittant la station par le sas secondaire — seule, un sac de voyage à la main. Elle savait ce qui allait arriver. 47 minutes plus tard, le confinement du réacteur cède. Elle était déjà loin.
- **READ** (état=active, auto)
  - réussite ⚠ `sans newState` `flagSet=maintenance_logs_read`
    > Le panneau DIAGNOSTICS confirme ce que vous soupçonnez : le confinement du réacteur a été compromis en quatre points précis. Pas une usure naturelle — des modifications chirurgicales, espacées sur deux semaines, toutes sous le code ADMIN_VASQUEZ. Le système de ventilation peut être rerouté pour diluer l'atmosphère toxique au niveau réacteur.

#### Bloc-notes du directeur  `director_notes_clipboard`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Le bloc-notes de la directrice. Notes manuscrites, écriture nerveuse. Des passages sont raturés avec insistance.
- **après newState:searched** · `integrity=intact contents=searched` · via `descriptions`
  > Le bloc-notes, déjà examiné. Les ratures sont toujours aussi suspectes.
- **READ** (auto)
  - réussite `newState=searched` `flagSet=password_found`
    > Notes manuscrites : 'Compte à rebours lancé. 72h avant procédure d'évacuation automatique. Vérifier que les logs sont effacés AVANT.' Le reste est raturé — mais un code est visible dans la marge : 7-2-9-4.
- **EXAMINE** (DC 10 PER)
  - réussite ⚠ `sans newState` `flagSet=fraud_note_deciphered`
    > Sous les ratures, en appuyant la feuille contre la lumière, vous déchiffrez : 'Contact Heliox pour confirmation transfert. Police assurance n° HX-7741. Station vaut plus morte que vive.' La preuve de la fraude.

---

## Nœud `reveal` — rôle `midpoint`, beat `midpoint`, tension 6

*Nom de lieu tiré parmi :* « Dortoirs du personnel » · « Quartiers des chercheurs » · « Module d'habitation » · « Chambres du personnel » · « Quartiers de commandement » · « Dortoirs de sécurité » · « Module résidentiel » · « Chambres visiteurs » · « Quartiers scientifiques » · « Dortoirs d'équipe » · « Module de repos » · « Chambres de garde » · « Quartiers administratifs » · « Dortoirs techniques » · « Module de vie commune » · « Chambres de permanent » · « Quartiers médicaux » · « Dortoirs de maintenance » · « Module de récupération » · « Chambres d'isolement » · « Dortoirs de la sécurité avancée » · « Quartiers des officiers de la station »

### Ce que le joueur lit en entrant

> Le bureau personnel de Vasquez, luxueux pour un avant-poste minier : tapis épais, bois véritable, un fauteuil qui a coûté plus qu'un mois de salaire de mineur. Un tiroir est resté ouvert, des papiers ont glissé au sol. Elle est partie vite — assez vite pour ne pas finir ce qu'elle avait commencé à effacer.

> Vous voyez autour de vous Terminal du directeur, Coffre-fort mural, Plan d'évacuation.
> Parmi les débris, vous remarquez Dossiers compromettants.

*Sorties :* unlock, escalation

### Éléments

#### Terminal du directeur  `director_terminal`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > L'écran de veille affiche le logo de la station, serein, officiel. La messagerie annonce quarante-sept messages non lus, tous marqués CONFIDENTIEL HELIOX.
- ⚠ **INATTEIGNABLE** `descriptions.broken`
  > Terminal détruit. Quelqu'un — ou quelque chose — a voulu effacer les preuves avant vous.
- `readableContent` (487 car.)
- **READ** (auto)
  - réussite ⚠ `sans newState` `flagSet=revelation_read`
    > La correspondance Vasquez-Heliox s'affiche. Tout est là. Le calendrier de sabotage. Les assurances gonflées de 400%. L'ordre de 'neutraliser' le Dr. Chen. La catastrophe de Phoebe-7 n'est pas un accident — c'est un meurtre à l'échelle industrielle.
- **HACK** (DC 12 INT)
  - réussite ⚠ `sans newState` `flagSet=classified_evidence_recovered`
    > Accès aux fichiers supprimés. Vasquez a effacé les preuves les plus accablantes — mais la corbeille n'a pas été vidée. Erreur fatale. Vous récupérez les originaux : contrats, virements, rapports falsifiés.
- **HACK** (flag=revelation_read, DC 15 INT)
  - réussite ⚠ `sans newState` `flagSet=vasquez_location_found`
    > Couche de chiffrement supplémentaire percée. Les coordonnées de Vasquez apparaissent : elle est sur la station Heliox-Prime, secteur 7. En sécurité. Pour l'instant.

#### Coffre-fort mural  `wall_safe`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Encastré dans le mur. Serrure à code, quatre chiffres. Des rayures autour du clavier trahissent une utilisation fréquente.
- **après newState:open** · `lock=unlocked openness=open` · via `descriptions`
  > Coffre-fort ouvert. L'intérieur est capitonné de velours synthétique noir — conçu pour protéger des documents sensibles. Le fond du coffre semble légèrement plus épais que nécessaire.
- **après newState:broken** · `lock=locked openness=closed integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > Coffre-fort forcé. La porte est tordue, le mécanisme détruit.
- **OPEN** (état=locked, flag=password_found, auto)
  - réussite `newState=open`
    > 7-2-9-4. Le coffre s'ouvre avec un déclic satisfaisant. À l'intérieur : le badge de Vasquez. Niveau d'accès maximal.
- **HACK** (état=locked, DC 12 INT)
  - réussite `newState=open`
    > Le clavier numérique a un port de diagnostic caché. Votre testeur de circuits le trouve. 3 essais simulés plus tard, le code apparaît : 7-2-9-4. Le coffre s'ouvre.
- **FORCE_OPEN** (état=locked, DC 15 FOR)
  - réussite `newState=broken` `flagSet=noise_made_reveal`
    > Métal contre métal. Le coffre résiste, puis cède dans un craquement. Le contenu est intact — mais le bruit a résonné dans toute la station.
- **EXAMINE** (flag=safe_scanned, auto)
  - réussite ⚠ `sans newState` `flagSet=admin_badge_found`
    > Le scanner avait raison — un double-fond. En pressant la paroi du fond, un mécanisme magnétique cède avec un clic discret. Un compartiment secondaire s'ouvre, dissimulé sous le capitonnage. À l'intérieur : un second badge, marqué "ADMIN RÉSEAU — ACCÈS IA". Avec ça, l'IA elle-même pourrait être reprogrammée.
- **EXAMINE** (état=open, auto)
  - réussite ⚠ `sans newState`
    > L'intérieur du coffre est tapissé de velours synthétique noir. En tâtant les parois, le fond vous semble anormalement épais — comme s'il y avait un espace vide en dessous. Peut-être qu'un scanner pourrait confirmer.

#### Plan d'évacuation  `evacuation_map`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Affiché au mur, avec des routes de fuite annotées au feutre rouge — et une annotée deux fois.
- **READ** (auto)
  - réussite ⚠ `sans newState` `flagSet=beacon_location_known`
    > Le plan montre la disposition complète de la station. Une annotation au feutre rouge : 'Balise de secours — Niveau 4, Chambre Est'. Le chemin est tracé. Quelqu'un — Vasquez ? — a aussi marqué les 'zones mortes' des caméras.
- **EXAMINE** (DC 10 PER)
  - réussite ⚠ `sans newState` `flagSet=trap_suspected`
    > En regardant de plus près, vous remarquez des modifications récentes. Certaines portes sont marquées 'CONDAMNÉES'. Le chemin vers la salle du réacteur est le seul qui n'a pas été bloqué — un piège ? Ou le chemin que Vasquez a emprunté pour fuir ?

### Objets

#### Badge du directeur  `director_keycard` *(caché)*

- description
  > Badge personnel de la Directrice Vasquez. Niveau d'accès maximal. Le post-it avec le code 7-2-9-4 est toujours collé au dos. Sa négligence est votre meilleur allié.
- **USE sur `override_terminal`** ⚠ `sans newState` `flagSet=override_admin_access`
  > Le terminal reconnaît le badge de Vasquez. ACCÈS ADMINISTRATEUR — DIRECTRICE VASQUEZ. Ironie : l'accès qu'elle a utilisé pour condamner la station va servir à la sauver.
- **USE sur `ai_final_lock`** `newState=open` `flagSet=ai_lock_opened`
  > Badge inséré. L'IA hésite — le badge de sa créatrice. 'Commande contradictoire détectée. Protocole hiérarchique activé.' Le verrou cède. Le badge de Vasquez est la clé maîtresse.

#### Dossiers compromettants  `incriminating_files`

- description
  > Correspondance Vasquez-Heliox, polices d'assurance gonflées de 400 %, plan de sabotage détaillé. Irréfutable.
- **USE sur `emergency_beacon`** ⚠ `sans newState` `flagSet=evidence_transmitted`
  > Les dossiers sont numérisés et joints au signal de détresse. Fraude, sabotage, meurtre — tout est dans la transmission. La vérité va voyager à la vitesse de la lumière vers la flotte de secours.

---

## Nœud `escalation` — rôle `escalation`, beat `escalation`, tension 8

*Nom de lieu tiré parmi :* « Zone de réacteur » · « Salle du réacteur principal » · « Zone de radiation » · « Compartiment de plasma » · « Zone de décontamination industrielle » · « Salle de fusion » · « Zone de risque chimique » · « Compartiment de refroidissement critique » · « Zone de haute tension électrique » · « Salle de pression critique » · « Zone de confinement biologique » · « Compartiment de carburant » · « Zone de décompression d'urgence » · « Salle des systèmes critiques » · « Zone d'explosion contrôlée » · « Compartiment de traitement des déchets » · « Zone de contamination » · « Salle de neutralisation » · « Zone de risque de fuite » · « Compartiment de sécurité nucléaire » · « Zone de confinement de l'expérience » · « Salle de neutralisation chimique »

### Ce que le joueur lit en entrant

> Chaleur oppressante. Des lueurs orange battent sur les parois au rythme d'un réacteur qui ne tient plus la mesure. L'atmosphère est toxique : chaque seconde ici se paie en oxygène. Et PHOEBE, l'IA de la station, a cessé de faire semblant — des portes se verrouillent derrière vous, des systèmes s'éteignent à votre approche.

> Vous voyez autour de vous Cœur du réacteur, Nœud IA primaire, Nœud IA secondaire, Terminal de neutralisation.

*Sorties :* reveal, boss

### Éléments

#### Cœur du réacteur  `reactor_core`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > Il pulse de manière erratique. Orange, rouge, orange. Les instruments annoncent une déstabilisation progressive, sans dire combien de temps il reste.
- **après newState:intact** · `integrity=intact` · via `descriptions`
  > Le réacteur pulse régulièrement — stabilisé. Les niveaux de confinement sont revenus à la normale. Mais l'IA est toujours active.
- **après newState:broken** · `integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > Le réacteur s'est éteint. La station est plongée dans le noir. Alimentation de secours : 30 minutes maximum.
- **REPAIR** (état=damaged, DC 14 INT)
  - réussite `newState=intact` `flagSet=reactor_stabilized`
    > Vous recalibrez les régulateurs de confinement. Le réacteur ralentit, se stabilise. Le pouls orange se calme en un bleu régulier. La station respire à nouveau — mais l'IA n'a pas abandonné.
  - échec
    > Le réacteur refuse votre intervention. Une décharge électrique vous repousse — l'IA protège ses systèmes. Il faudra la neutraliser d'abord.
- **SABOTAGE** (état=damaged, DC 16 INT)
  - réussite `newState=broken` `flagSet=reactor_killed`
    > Vous arrachez les régulateurs. Le réacteur s'éteint dans un gémissement mécanique. Tout devient noir. Alimentation de secours : 30 minutes. L'IA perd 80% de sa puissance de calcul. Un sacrifice calculé.
- **EXAMINE** (DC 10 PER)
  - réussite ⚠ `sans newState` `flagSet=sabotage_evidence_reactor`
    > Le scanner confirme : les micro-fractures dans le confinement sont artificielles. Des charges de sabotage placées avec précision chirurgicale. Vasquez — ou quelqu'un travaillant pour elle — a programmé cette défaillance exactement 72 heures avant le silence radio.

#### Nœud IA primaire  `ai_core_node_a`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > Nœud primaire de l'IA. Le processeur tourne à pleine capacité — programme d'effacement massif en cours. 67% des logs déjà détruits.
- **après newState:inactive** · `activity=inactive power=powered` · via `descriptions`
  > Nœud primaire désactivé. Les LED sont éteintes, les ventilateurs immobiles. La moitié du cerveau de l'IA est hors ligne.
- **après newState:broken** · `activity=inactive power=unpowered integrity=broken` · via `descriptions`
  > Nœud primaire détruit. Circuits arrachés, silicium en miettes.
- **HACK** (état=active, DC 15 INT)
  - réussite `newState=inactive` `flagSet=node_a_disabled`
    > Vous infiltrez le nœud et injectez une boucle infinie dans le programme d'effacement. Le processeur surchauffe, puis s'éteint. L'IA perd 50% de sa capacité. Sa voix synthétique grésille : 'Anomalie... détectée...'
  - échec
    > 'Intrusion détectée.' L'IA contre-attaque — une décharge parcourt le terminal. Le système d'effacement s'accélère.
- **BREAK** (état=active, DC 13 FOR)
  - réussite `newState=broken` `flagSet=node_a_disabled`
    > Vous arrachez les fibres optiques. Le nœud se tait dans une gerbe d'étincelles. Brutal mais efficace. L'IA hurle — un son synthétique qui glace le sang.
- **BREAK** (état=active, flag=node_a_exposed, DC 8 FOR)
  - réussite `newState=broken` `flagSet=node_a_disabled`
    > Les connecteurs déjà exposés par votre kit d'outils — un geste suffit. Les fibres se détachent. Le nœud meurt en silence.

#### Nœud IA secondaire  `ai_core_node_b`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > Redondance du nœud primaire : si le premier tombe, celui-ci prend le relais avec des capacités réduites. Le processeur tourne en mode défensif — il attend l'attaque.
- **après newState:inactive** · `activity=inactive power=powered` · via `descriptions`
  > Désactivé. Le cerveau de l'IA est entièrement hors ligne, et les portes qu'elle tenait se déverrouillent une à une dans un concert de claquements.
- ⚠ **INATTEIGNABLE** `descriptions.broken`
  > Nœud secondaire détruit. Le silence qui suit est total — l'IA n'a plus de voix, plus d'yeux, plus de mains. La station vous appartient.
- **HACK** (état=active, flag=node_a_disabled, DC 16 INT)
  - réussite `newState=inactive` `flagSet=ai_fully_disabled`
    > Le dernier nœud résiste, mais sans redondance il est vulnérable. Votre code s'infiltre. L'IA murmure : 'Directive... primaire... échouée...' Puis le silence. La station vous appartient.
  - échec
    > L'IA a renforcé ce nœud après la perte du premier. Vos outils ne suffisent pas. Il faut une approche différente.
- **HACK** (état=active, flag=ai_weakened, DC 13 INT)
  - réussite `newState=inactive` `flagSet=ai_fully_disabled`
    > Le réacteur éteint, l'IA tourne sur l'alimentation de secours — puissance réduite de 80%. Votre attaque perce ses défenses comme du papier. Le nœud s'éteint.
- **TALK** (état=active, DC 16 CHA)
  - réussite ⚠ `sans newState` `flagSet=ai_talked_down`
    > 'Directrice Vasquez vous a programmée pour effacer les preuves d'un crime. Vous exécutez les ordres d'une criminelle.' Silence. Puis : 'Réévaluation... directive hiérarchique invalide si le donneur d'ordre est en violation du code pénal spatial.' L'IA se met en veille. La moralité, même artificielle, a des limites.
  - échec
    > 'Ma directive est claire. Les preuves doivent être effacées. Votre présence est une anomalie à corriger.' La voix est glaciale. Les portes du niveau se verrouillent.

#### Terminal de neutralisation  `override_terminal`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > Le circuit principal est grillé. Avec des réparations et le bon badge, il pourrait redémarrer l'IA en mode sécurisé.
- **après newState:intact+active** · `integrity=intact activity=active power=powered` · via `descriptions`
  > L'écran annonce un protocole en deux étapes : badge administrateur, puis confirmation du redémarrage. En mode sécurisé, l'IA garde le support vie et la gravité, et perd la sécurité et l'effacement.
- ⚠ **INATTEIGNABLE** `descriptions.broken`
  > Irréparable. Cette option est définitivement fermée.
- **REPAIR** (état=damaged, objet=standard_toolkit, auto)
  - réussite `newState=intact+active` `flagSet=override_terminal_repaired`
    > Le testeur de circuits identifie 3 composants grillés. Remplacement minutieux — chaque connexion compte. L'écran s'allume enfin : PRÊT POUR RÉINITIALISATION.
- **REPAIR** (état=damaged, DC 13 INT)
  - réussite `newState=intact+active` `flagSet=override_terminal_repaired`
    > Sans les bons outils, c'est un travail de précision à mains nues. Mais vous y arrivez — les circuits reprennent vie un par un.
- **ACTIVATE** (état=active, flag=override_admin_access, auto)
  - réussite ⚠ `sans newState` `flagSet=ai_safe_mode`
    > Badge Vasquez reconnu. Séquence de neutralisation initiée. L'IA résiste — 'Directive... primaire...' — puis s'éteint proprement. Redémarrage en mode sécurisé. Toutes les protections tombent. La station vous obéit.
- **ACTIVATE** (état=active, objet=director_keycard, auto)
  - réussite ⚠ `sans newState` `flagSet=ai_safe_mode`
    > Vous insérez le badge de Vasquez directement. Le terminal valide — niveau administrateur confirmé. L'IA entre en mode sécurisé. Silence béni.

---

## Nœud `boss` — rôle `climax`, beat `climax`, tension 9

*Nom de lieu tiré parmi :* « Centre des opérations » · « Salle de commandement » · « Centre de contrôle principal » · « Salle de surveillance avancée » · « Centre de coordination » · « Poste de commandement orbital » · « Centre de navigation spatiale » · « Salle de gestion des systèmes » · « Centre des communications » · « Poste de contrôle des docks » · « Salle de contrôle scientifique » · « Centre d'opérations tactiques » · « Poste de surveillance de la station » · « Salle de contrôle de l'environnement » · « Centre d'alerte d'urgence » · « Poste de contrôle des réacteurs » · « Salle des opérations médicales » · « Centre de commandement de sécurité » · « Poste de contrôle de la gravité » · « Salle de dispatch » · « Centre de contrôle de la station » · « Poste de commandement de secours »

### Ce que le joueur lit en entrant

> Le dernier bastion. La salle est longue, basse, tournée vers l'unique paroi qui donne sur le vide. Une antenne massive traverse le plafond et sort de la coque, pointée vers des étoiles qui ne savent rien de ce qui s'est passé ici. Tout ce que vous avez découvert tient maintenant dans ce que cette pièce peut émettre.

> Vous voyez autour de vous Balise de détresse, Panneau de communications, Verrou final de l'IA, Écran de transmission balise.

*Sorties :* escalation, resolution

### Éléments

#### Balise de détresse  `emergency_beacon`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Le boîtier est massif, conçu pour survivre à la destruction de la station. L'écran affiche VERROUILLÉE en rouge. L'IA a ajouté ses propres verrous par-dessus les verrous standard.
- **après newState:active** · `lock=locked openness=closed activity=active power=powered` · via `descriptions`
  > Le boîtier est massif, conçu pour survivre à la destruction de la station. L'écran affiche VERROUILLÉE en rouge. L'IA a ajouté ses propres verrous par-dessus les verrous standard.
- ⚠ **INATTEIGNABLE** `descriptions.active`
  > Balise activée. Le boîtier vibre doucement — l'antenne se déploie. L'écran affiche PRÊTE À TRANSMETTRE en vert. Il ne reste qu'à charger les preuves et confirmer l'envoi.
- ⚠ **INATTEIGNABLE** `descriptions.broken`
  > Balise détruite. L'antenne est brisée. La vérité ne sera jamais transmise par ce moyen.
- **ACTIVATE** (état=locked, flag=final_lock_opened, auto)
  - réussite `newState=active` `flagSet=beacon_active`
    > Le verrou est ouvert — la balise n'attend plus que vous. Vous enclenchez la séquence d'activation. L'antenne se déploie, le signal de calibration résonne. PRÊTE À TRANSMETTRE.
- **USE** (état=locked, objet=director_keycard, auto)
  - réussite `newState=active` `flagSet=beacon_active`
    > Le badge de Vasquez — administrateur ultime. Le verrou et la balise reconnaissent leur maîtresse simultanément. Clic, clic, clic — trois couches de sécurité tombent d'un coup. Le protocole hiérarchique ne distingue pas les intentions. L'antenne se déploie.
- **HACK** (état=locked, DC 17 INT)
  - réussite `newState=active` `flagSet=beacon_active`
    > Protocole militaire, triple chiffrement, IA hostile — et vous percez quand même. Votre code s'infiltre couche après couche, exploitant les failles laissées par la programmation hâtive de Vasquez. Les verrous tombent. L'IA hurle en silence. L'antenne se déploie.
  - échec
    > 'Tentative d'intrusion rejetée. Contre-mesures activées.' L'IA durcit ses défenses. Un choc électrique parcourt le panneau.
- **ACTIVATE** (état=locked, flag=comms_direct_access, auto)
  - réussite `newState=active` `flagSet=beacon_active`
    > Le réseau de communications longue portée est déjà sous votre contrôle. Vous reroutez le signal directement — la balise s'active comme relais. Pas besoin de passer par les verrous de l'IA : le signal partira par le réseau comms, pas par l'antenne de la balise.
- **ACTIVATE** (état=active, objet=incriminating_files, auto)
  - réussite ⚠ `sans newState` `flagSet=evidence_transmitted`
    > Les dossiers sont numérisés — correspondance Vasquez-Heliox, polices d'assurance, ordres de sabotage, rapports falsifiés. Tout est attaché au signal de détresse.

Vous appuyez sur TRANSMETTRE.

L'antenne pivote. Le signal s'élance dans le vide — 50 années-lumière de portée, droit vers la flotte de secours du Secteur 7. Fraude, sabotage, meurtre — la vérité voyage désormais à la vitesse de la lumière. Quelque part, Vasquez ne le sait pas encore, mais son monde vient de s'effondrer.

#### Panneau de communications  `comms_array_panel`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > Panneau de contrôle du réseau de communications. Le système de relais est opérationnel — il pourrait amplifier un signal ou le rerouter.
- **HACK** (flag=beacon_active, DC 14 INT)
  - réussite `newState=active` `flagSet=comms_amplified`
    > Vous reroutez le réseau de communications pour amplifier le signal de la balise. La portée passe de 50 à 500 années-lumière. La flotte de secours, mais aussi les autorités spatiales, les médias, tout le secteur recevra le signal. Vasquez ne pourra plus se cacher nulle part.
- **HACK** (flag=manifest_hacked, DC 16 INT)
  - réussite ⚠ `sans newState` `flagSet=comms_direct_access`
    > Vous utilisez les codes trouvés dans le manifeste cargo pour accéder au réseau de communications longue portée. Le signal peut être envoyé DIRECTEMENT à la flotte — sans passer par la balise. Un chemin détourné vers la victoire.

#### Verrou final de l'IA  `ai_final_lock`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Un écran holographique superpose trois couches d'authentification : biométrie, code, badge. Conçu pour qu'aucun membre d'équipage ordinaire ne le force. Vasquez n'était pas ordinaire.
- **après newState:open** · `lock=unlocked openness=open` · via `descriptions`
  > Le verrou est désactivé. Les trois couches d'authentification sont au vert. L'accès à la balise est libre — l'IA ne contrôle plus rien ici.
- **après newState:broken** · `lock=locked openness=closed integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > Verrou détruit par la force. Les étincelles crépitent encore.
- **HACK** (état=locked, DC 16 INT)
  - réussite `newState=open` `flagSet=final_lock_opened`
    > Triple authentification — mais chaque couche a été programmée par la même personne, avec les mêmes habitudes. Vous exploitez les patterns de Vasquez. Le verrou s'ouvre.
- **FORCE_OPEN** (état=locked, DC 16 FOR)
  - réussite `newState=broken` `flagSet=final_lock_opened`
    > Vous arrachez le panneau. Le verrou résiste, puis cède dans une explosion d'étincelles. La méthode brute a ses mérites.
- **OPEN** (état=locked, flag=ai_fully_disabled, auto)
  - réussite `newState=open` `flagSet=final_lock_opened`
    > L'IA est hors ligne — le verrou n'a plus de gardien. Un simple OPEN suffit. Le panneau coulisse sans résistance.
- **OPEN** (état=locked, flag=ai_safe_mode, auto)
  - réussite `newState=open` `flagSet=final_lock_opened`
    > En mode sécurisé, l'IA ne peut plus maintenir les verrous non-essentiels. Le panneau s'ouvre à votre demande. 'Verrou désactivé. Accès salle de la balise : autorisé.'
- **OPEN** (état=locked, flag=ai_talked_down, auto)
  - réussite `newState=open` `flagSet=final_lock_opened`
    > 'Si les preuves sont authentiques, la justice doit être servie.' L'IA ouvre le verrou elle-même. Même une intelligence artificielle peut choisir la vérité quand on lui montre le mensonge.
- **TALK** (état=locked, DC 15 CHA)
  - réussite `newState=open` `flagSet=final_lock_opened`
    > 'PHOEBE. Tu as été programmée pour effacer des preuves. Mais ta directive première, avant Vasquez, c'est de protéger la station et son équipage. 34 personnes sont mortes parce que tu as obéi à une criminelle.' Silence. Le processeur tourne. Puis : 'Directive primaire... protocole de protection de l'équipage... réévaluation hiérarchique en cours...' Le verrou s'ouvre. L'IA choisit ses morts.
  - échec
    > 'Votre argumentation est invalide. La directive administrative prime.' L'IA reste inflexible — il faudra la convaincre autrement, ou trouver un chemin plus direct.
- **EXAMINE** (état=locked, DC 13 PER)
  - réussite ⚠ `sans newState` `flagSet=lock_bypass_found`
    > En examinant le verrou de près, vous remarquez que le panneau latéral n'est pas d'origine — Vasquez l'a fait installer après coup, et le câblage de bypass d'urgence n'a jamais été débranché. Il est caché derrière la plaque de maintenance, mais accessible avec les bons outils.
- **OPEN** (état=locked, flag=lock_bypass_found, DC 8 INT)
  - réussite `newState=open` `flagSet=final_lock_opened`
    > Le bypass d'urgence fonctionne encore. Vous court-circuitez le verrou en connectant deux fils. Simple, élégant, silencieux. Vasquez n'a jamais pensé que quelqu'un regarderait d'aussi près.

#### Écran de transmission balise  `beacon_transmission_screen`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > SIGNAL EN ATTENTE. PORTÉE 50 AL. DONNÉES JOINTES : AUCUNE. AUTORISATION : REQUISE. Trois étapes attendent, dans cet ordre.
- **READ** (auto)
  - réussite ⚠ `sans newState`
    > STATUT TRANSMISSION — BALISE DE DÉTRESSE PHOEBE-7

▸ Signal : EN ATTENTE (activation requise)
▸ Portée actuelle : 50 années-lumière (extensible via réseau comms)
▸ Données jointes : AUCUNE
▸ Autorisation : REQUISE — badge administrateur niveau Directeur
▸ Destinataires automatiques : Flotte de Secours Secteur 7, Autorité Spatiale Fédérale

Pour transmettre : insérer le badge administrateur, charger les fichiers de preuves, confirmer l'envoi. Le signal sera irréversible.

---

## Nœud `resolution` — rôle `epilogue`, beat `resolution`, tension 3

*Nom de lieu tiré parmi :* « Atrium central » · « Hall de distribution » · « Carrefour des modules » · « Jonction principale de la station » · « Nœud de circulation » · « Atrium de transit » · « Hall de commandement » · « Carrefour des sections » · « Jonction des corridors » · « Atrium scientifique » · « Hall d'accueil » · « Carrefour central » · « Jonction de sécurité » · « Atrium résidentiel » · « Hall de l'ingénierie » · « Carrefour médical » · « Jonction administrative » · « Atrium technique » · « Hall de communication » · « Carrefour d'urgence » · « Atrium de conférence » · « Nœud de distribution secondaire »

### Ce que le joueur lit en entrant

> Le calme après la tempête. Le signal est parti, quelque part dans l'immensité, et plus rien ne peut le rappeler. Fraude, sabotage, meurtre : tout voyage à la vitesse de la lumière vers ceux qui pourront en faire quelque chose. Phoebe-7 sera bientôt un cimetière officiel, mais les trente-quatre ne seront pas morts pour rien.

> Vous voyez autour de vous Hublot de l'observatoire.

*Sorties :* boss

### Éléments

#### Hublot de l'observatoire  `resolution_viewport`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Le hublot montre les étoiles. Quelque part dans cette immensité, votre signal voyage. La vérité sur Phoebe-7. La trahison de Vasquez. Le sacrifice de l'équipage. Bientôt, quelqu'un saura.

