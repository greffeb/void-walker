# Transcript — micro-modules

> Généré par `npx tsx scripts/narrative-transcript.ts`. Ne pas éditer à la main.

---

## `mm_loot_emergency_kit` — type `loot`, visibilité `open`

- entrée
  > Un petit local technique, à peine plus large qu'un placard. La peinture jaune du marquage de sécurité disparaît sous la crasse.
- indice
  > Une porte de service avec un marquage d'urgence jaune.
- retour
  > Le local technique. Le casier d'urgence est ouvert.

> Vous voyez autour de vous un casier d'urgence.
> À portée de main, vous remarquez un kit médical basique.

#### Casier d'urgence  `mm_emergency_locker`

- **initial (closed)** · `openness=closed` · via `examineResult`
  > Un casier d'urgence standard. Le scellé est intact.

---

## `mm_loot_corpse_stash` — type `loot`, visibilité `open`

- entrée
  > Un cul-de-sac sombre. Un corps est affalé contre le mur, sa combinaison déchirée. Il serre encore un pied-de-biche dans sa main crispée.
- indice
  > Une alcôve sombre. Une odeur métallique en provient.
- retour
  > Le cul-de-sac avec le cadavre. Vous avez déjà fouillé les lieux.

> Vous voyez autour de vous un cadavre en combinaison.
> À portée de main, vous remarquez un pry bar.

#### Cadavre en combinaison  `mm_corpse`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un cadavre en combinaison. Les poches contiennent peut-être quelque chose d'utile.

---

## `mm_loot_locked_cabinet` — type `loot`, visibilité `open`

- entrée
  > Un réduit de stockage, plus profond qu'il n'en a l'air. Contre le mur du fond, un voyant rouge clignote — la seule chose encore vivante ici.
- indice
  > Une porte menant à un local de stockage.
- retour
  > Le réduit avec l'armoire blindée, maintenant ouverte.

> Vous voyez autour de vous une armoire blindée.
> À portée de main, vous remarquez un repair kit.

#### Armoire blindée  `mm_cabinet`

- **initial (locked)** · `lock=locked openness=closed` · via `examineResult`
  > Une armoire blindée avec un verrou électronique. Le panneau clignote faiblement.

---

## `mm_loot_hidden_compartment` — type `loot`, visibilité `hidden`

- entrée
  > Un minuscule espace derrière un faux panneau. Quelqu'un y a caché des provisions d'urgence.
- indice
  > Vous remarquez un panneau de maintenance mal fixé...
- retour
  > Le compartiment secret. Les provisions ont été prises.

> Vous voyez autour de vous un panneau dissimulé.
> À portée de main, vous remarquez un stimulant.

#### Panneau dissimulé  `mm_hidden_panel`

- **initial (closed)** · `openness=closed` · via `examineResult`
  > Un panneau de maintenance dissimulé. Derrière, un espace étroit.

---

## `mm_loot_supply_cache` — type `loot`, visibilité `open`

- entrée
  > Un petit entrepôt de fournitures. Les étagères sont en désordre, mais certains articles semblent encore utilisables.
- indice
  > Une porte ouverte menant à un local de stockage.
- retour
  > L'entrepôt de fournitures. Les étagères sont presque vides.

> Vous voyez autour de vous des étagères de fournitures.
> À portée de main, vous remarquez un ruban adhésif.

#### Étagères de fournitures  `mm_supply_shelf`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des étagères de fournitures. La plupart sont vides ou renversées.

---

## `mm_loot_escape_toolbox` — type `loot`, visibilité `open`

- entrée
  > Un atelier de maintenance encombré de débris. Les supports muraux ont été vidés à la hâte — presque tous.
- indice
  > Un accès obstrué par des débris vers un atelier.
- retour
  > L'atelier de maintenance. La boîte à outils est ouverte.

> Vous voyez autour de vous une boîte à outils.
> À portée de main, vous remarquez un welder.

#### Boîte à outils  `mm_toolbox`

- **initial (closed)** · `openness=closed` · via `examineResult`
  > Une boîte à outils de maintenance de bord. Certains outils ont disparu.

---

## `mm_loot_escape_eva_suit` — type `loot`, visibilité `hidden`

- entrée
  > Un vestiaire EVA oublié. Les casiers sont pour la plupart vides, sauf un dont le voyant vert indique une combinaison opérationnelle.
- indice
  > Vous remarquez un passage vers un vestiaire EVA...
- retour
  > Le vestiaire EVA. Le casier fonctionnel est ouvert.

> Vous voyez autour de vous un casier de combinaisons.
> À portée de main, vous remarquez un space suit.

#### Casier de combinaisons  `mm_suit_locker`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un casier de combinaisons EVA. Un seul semble encore fonctionnel.

---

## `mm_loot_investigate_scanner` — type `loot`, visibilité `open`

- entrée
  > Un bureau annexe, occupé jusqu'au dernier jour. Des notes éparpillées, une chaise repoussée en vitesse, un café à moitié bu.
- indice
  > Un accès vers un bureau de recherche.
- retour
  > Le bureau de recherche. Le scanner a été récupéré.

> Vous voyez autour de vous un bureau de recherche.
> À portée de main, vous remarquez un scanner.

#### Bureau de recherche  `mm_research_desk`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un bureau de recherche couvert de notes. Un scanner portable est posé dessus.

---

## `mm_loot_investigate_keycard` — type `loot`, visibilité `hidden`

- entrée
  > Un petit bureau personnel. Les effets personnels sont éparpillés, comme si le propriétaire était parti en hâte.
- indice
  > Vous apercevez l'entrée d'un bureau...
- retour
  > Le bureau personnel. Vous avez déjà fouillé le tiroir.

> Vous voyez autour de vous un tiroir de bureau.
> À portée de main, vous remarquez un keycard.

#### Tiroir de bureau  `mm_desk_drawer`

- **initial (closed)** · `openness=closed` · via `examineResult`
  > Un tiroir de bureau. Un badge d'accès est coincé sous des papiers.

---

## `mm_lore_terminal_logs` — type `lore`, visibilité `open`

- entrée
  > Un poste de travail isolé. L'écran du terminal clignote faiblement, des lignes de texte défilent automatiquement.
- indice
  > Un terminal actif derrière une porte latérale.
- retour
  > Le poste de travail. Le terminal affiche toujours les mêmes données.

> Vous voyez autour de vous un terminal de données.

#### Terminal de données  `mm_data_terminal`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > Un terminal encore actif. Les logs système défilent à l'écran.

- lore (`data_terminal`)
  > Les logs révèlent une séquence d'alertes ignorées. Quelqu'un a délibérément désactivé les capteurs de proximité six heures avant l'incident.
- lore, échec
  > L'écran affiche des données corrompues. Vous distinguez des timestamps mais pas le contenu des messages.

---

## `mm_lore_personal_effects` — type `lore`, visibilité `open`

- entrée
  > Une cabine personnelle. Le lit est défait, des effets personnels sont éparpillés. Un carnet est posé sur la table de nuit.
- indice
  > Une porte de cabine entrouverte.
- retour
  > La cabine personnelle. Le carnet est toujours sur la table.

> Vous voyez autour de vous une photo de famille.

#### Photo de famille  `mm_personal_photo`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Une photo de famille collée au mur. Au dos, un message : "On revient bientôt."

- lore (`physical_document`)
  > Un carnet personnel. Les dernières entrées parlent de bruits dans les murs et de cauchemars partagés par tout l'équipage. La dernière page est arrachée.

---

## `mm_lore_bloodstains` — type `lore`, visibilité `hidden`

- entrée
  > Un recoin sombre du couloir. Des traces sombres maculent le sol et les murs. L'air a une odeur de cuivre.
- indice
  > Vous remarquez des traces sombres menant vers une alcôve...
- retour
  > L'alcôve aux traces de sang. Rien n'a changé.

> Vous voyez autour de vous des traces de sang.

#### Traces de sang  `mm_bloodstains`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des traces de sang séché forment un motif sur le sol. Comme si quelqu'un avait rampé.

- lore (`environmental_trace`)
  > Les traces de griffures sur le mur racontent une histoire : quelqu'un a tenté de s'échapper en rampant. Les marques s'arrêtent brusquement au milieu du couloir.
- lore, échec
  > Des traces sombres sur le sol et les murs. Difficile de déterminer ce qui s'est passé ici.

---

## `mm_lore_emergency_recording` — type `lore`, visibilité `open`

- entrée
  > Un poste de communication d'urgence. L'enregistreur clignote en rouge, signalant un message non lu.
- indice
  > Un poste de communication avec un voyant rouge.
- retour
  > Le poste de communication. L'enregistrement a déjà été écouté.

> Vous voyez autour de vous un enregistreur d'urgence.

#### Enregistreur d'urgence  `mm_recorder`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > Un enregistreur d'urgence. Le voyant rouge indique un message en attente.

- lore (`data_terminal`)
  > "Ici Dr. Vasquez, protocole urgence Sigma-7. Si vous entendez ceci... ne faites pas confiance aux systèmes automatiques. Ils sont compromis. Repeat—" L'enregistrement se coupe dans un cri.
- lore, échec
  > L'enregistrement est trop dégradé pour être compris. Vous captez des bribes : "...protocole... compromis..."

---

## `mm_lore_survivor_note` — type `lore`, visibilité `hidden`

- entrée
  > Un cul-de-sac. Le mur du fond est couvert de griffures et de marques. Certaines semblent intentionnelles.
- indice
  > Vous remarquez des griffures étranges sur un mur...
- retour
  > Le cul-de-sac aux inscriptions. Les mots gravés sont toujours là.

> Vous voyez autour de vous un mur gravé.

#### Mur gravé  `mm_scratched_wall`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des mots gravés dans le métal du mur. Écrits avec un objet pointu.

- lore (`environmental_trace`)
  > Gravés dans le métal : "JOUR 7 — Plus de radio. Plus d'eau. J'entends ÇA dans les conduits. Si vous lisez ceci, NE DESCENDEZ PAS AU NIVEAU -2."
- lore, échec
  > Des marques dans le métal. Certaines ressemblent à des lettres mais vous ne parvenez pas à les déchiffrer.

---

## `mm_lore_escape_captain_log` — type `lore`, visibilité `open`

- entrée
  > Le bureau privé du capitaine. Son terminal est encore actif, le journal de bord affiché à l'écran.
- indice
  > Un accès vers le bureau du capitaine.
- retour
  > Le bureau du capitaine. Le terminal affiche toujours le journal.

> Vous voyez autour de vous un terminal du capitaine.

#### Terminal du capitaine  `mm_captain_terminal`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > Le terminal du capitaine. Le journal de bord est toujours accessible.

- lore (`data_terminal`)
  > "Journal du Cpt. Moreau, J-2 : Le fret de la cale 7 émet des lectures biologiques anormales. Weyland-Mori refuse d'ouvrir une enquête. Je note pour le rapport." L'entrée suivante est corrompue.
- lore, échec
  > Le journal est protégé par un chiffrement partiel. Vous ne lisez que des fragments : "...cale 7... anormales... refuse..."

---

## `mm_lore_escape_incident_report` — type `lore`, visibilité `hidden`

- entrée
  > Un réduit d'archivage. Des dossiers physiques sont empilés sur des étagères métalliques. Un dossier rouge attire l'attention.
- indice
  > Vous apercevez des classeurs dans une pièce attenante...
- retour
  > Le réduit d'archivage. Le dossier confidentiel a été lu.

> Vous voyez autour de vous un dossier confidentiel.

#### Dossier confidentiel  `mm_sealed_report`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un dossier physique avec un tampon "CONFIDENTIEL". Les pages sont froissées.

- lore (`physical_document`)
  > Rapport d'incident #447 : "Rupture de confinement biologique, cale 7. L'échantillon XB-9 a franchi trois couches d'isolation. Protocole d'incinération recommandé. REFUSÉ par directive corporative."

---

## `mm_lore_escape_distress_call` — type `lore`, visibilité `open`

- entrée
  > Une cabine de communication. Un appel de détresse tourne en boucle, la voix désespérée se répète inlassablement.
- indice
  > Vous entendez une voix étouffée provenant d'une cabine...
- retour
  > La cabine de communication. L'appel de détresse continue de tourner.

> Vous voyez autour de vous un relais de communication.

#### Relais de communication  `mm_comm_relay`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > Un relais de communication. Un appel de détresse tourne en boucle.

- lore (`data_terminal`)
  > "Mayday, mayday, ici USCSS Nostromo-7. L'équipage est décimé. La créature est dans le système de ventilation. Envoyez des secours. Position—" Le signal se brouille avant les coordonnées.
- lore, échec
  > L'appel de détresse est trop parasité. Vous distinguez "mayday" et "créature" mais le reste est inaudible.

---

## `mm_lore_escape_personal_message` — type `lore`, visibilité `open`

- entrée
  > Un coin repos entre deux couchettes. Une tablette avec un écran fissuré est posée sur un oreiller.
- indice
  > Une cabine avec la porte entrebâillée.
- retour
  > Le coin repos. La tablette affiche toujours le même message.

> Vous voyez autour de vous une tablette personnelle.

#### Tablette personnelle  `mm_tablet`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Une tablette personnelle. L'écran fissuré affiche encore un message vidéo.

- lore (`physical_document`)
  > Un message vidéo non envoyé : une femme souriante dit au revoir à ses enfants. "Encore deux semaines et maman rentre. Soyez sages." La date est d'il y a trois mois.

---

## `mm_lore_investigate_research_data` — type `lore`, visibilité `open`

- entrée
  > Un laboratoire annexe. Les écrans des moniteurs de recherche clignotent dans la pénombre.
- indice
  > Un accès vers un laboratoire secondaire.
- retour
  > Le laboratoire annexe. Les écrans affichent toujours les mêmes données.

> Vous voyez autour de vous un terminal de recherche.

#### Terminal de recherche  `mm_research_terminal`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > Un terminal de recherche. Les données expérimentales sont partiellement accessibles.

- lore (`data_terminal`)
  > Données du Protocole Lazarus : "Sujet 7 montre une régénération cellulaire 400% supérieure à la normale. Effets secondaires : agressivité extrême, mutations osseuses. Note : NE PAS réveiller le Sujet 8."
- lore, échec
  > Les données sont cryptées. Vous interceptez des mots-clés : "Protocole Lazarus", "régénération", "mutations".

---

## `mm_lore_investigate_whistleblower` — type `lore`, visibilité `hidden`

- entrée
  > Une cabine au désordre suspect. Quelqu'un a fouillé les lieux — tiroirs ouverts, matelas retourné.
- indice
  > Vous remarquez qu'une cabine a été fouillée récemment...
- retour
  > La cabine fouillée. Le disque "ASSURANCE" a été récupéré.

> Vous voyez autour de vous un disque caché.

#### Disque caché  `mm_hidden_drive`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un disque de stockage caché sous le matelas. Il porte une étiquette : "ASSURANCE".

- lore (`data_terminal`)
  > Un témoignage anonyme enregistré clandestinement : "La direction sait. Les sujets de test sont des membres d'équipage involontaires. J'ai les preuves. Si je disparais, cherchez le serveur B7."
- lore, échec
  > Le disque est partiellement corrompu. Vous entendez des bribes : "...la direction sait... involontaires..."

---

## `mm_lore_investigate_emails` — type `lore`, visibilité `open`

- entrée
  > Une salle serveur secondaire. Les indicateurs clignotent, la température est élevée.
- indice
  > Un accès vers une salle serveur.
- retour
  > La salle serveur. Les emails sont toujours affichés.

> Vous voyez autour de vous un serveur de messagerie.

#### Serveur de messagerie  `mm_email_server`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > Un serveur de messagerie. Les emails internes n'ont pas été effacés.

- lore (`data_terminal`)
  > Email du Dr. Chen au Directeur Park : "Sujet 8 est RÉVEILLÉ. Je vous avais prévenu. Le confinement ne tiendra pas. Procédure d'évacuation lancée." Réponse de Park : "Évacuation annulée. Trop d'investissement pour abandonner."
- lore, échec
  > Le serveur résiste au piratage. Vous ne lisez qu'un fragment : "RÉVEILLÉ... confinement ne tiendra pas... Évacuation annulée."

---

## `mm_lore_rescue_alien_inscription` — type `lore`, visibilité `open`

- entrée
  > Une alcôve dans la matière organique. Les parois sont couvertes de glyphes luminescents qui pulsent faiblement.
- indice
  > Des glyphes luminescents brillent dans une alcôve.
- retour
  > L'alcôve aux glyphes. Ils pulsent toujours au même rythme.

> Vous voyez autour de vous des glyphes aliens.

#### Glyphes aliens  `mm_alien_glyphs`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des glyphes alien gravés dans la matière organique. Ils semblent suivre un motif répétitif.

- lore (`environmental_trace`)
  > Les glyphes racontent une histoire en images : une espèce construisant, prospérant, puis confrontée à quelque chose venu de l'intérieur. Les derniers symboles montrent une fuite massive.
- lore, échec
  > Les glyphes sont trop abstraits pour être déchiffrés. Vous reconnaissez des formes vaguement humanoïdes mais le sens vous échappe.

---

## `mm_lore_rescue_explorer_journal` — type `lore`, visibilité `hidden`

- entrée
  > Un cul-de-sac où un sac à dos d'exploration humain gît abandonné. Son propriétaire n'est nulle part.
- indice
  > Vous remarquez un équipement humain dans un recoin...
- retour
  > Le cul-de-sac avec le sac d'exploration. Le journal a été lu.

> Vous voyez autour de vous un sac d'exploration.

#### Sac d'exploration  `mm_explorer_pack`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un sac à dos d'exploration humain. Il contient un journal de terrain.

- lore (`physical_document`)
  > Journal de l'Explorateur Ikeda : "Jour 12 — La structure est VIVANTE. Les murs changent de configuration la nuit. Je retrouve des passages là où il n'y en avait pas. Je commence à douter de ma propre mémoire."

---

## `mm_lore_rescue_npc_testimony` — type `lore`, visibilité `open`

- entrée
  > Un espace de repos improvisé. Un survivant est recroquevillé dans un coin, enveloppé dans une couverture de survie. Il tremble.
- indice
  > Vous entendez quelqu'un murmurer dans une pièce adjacente.
- retour
  > Le survivant est toujours là, mais il ne parle plus.

> Vous voyez autour de vous un survivant hébété.

#### Survivant hébété  `mm_npc_survivor`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un survivant recroquevillé dans un coin. Il marmonne des phrases incompréhensibles.

- lore (`npc_testimony`)
  > "Ils... ils ne sont pas morts. L'entité les a... absorbés. J'ai vu le Dr. Ikeda fondu dans le mur. Il respirait encore. Il m'a dit de courir." Le survivant se tait, les yeux perdus dans le vide.
- lore, échec
  > Le survivant vous regarde sans vous voir. Il marmonne des bribes : "...absorbés... respirait encore..." mais refuse de parler.

---

## `mm_encounter_wounded_survivor` — type `encounter`, visibilité `open`

- entrée
  > Un abri de fortune. Un survivant blessé s'est barricadé ici. Des emballages de rations vides jonchent le sol — il survit depuis un moment.
- indice
  > Vous entendez des gémissements derrière une porte barricadée.
- retour
  > L'abri du survivant. Il semble un peu plus calme.

> Vous voyez autour de vous une barricade de fortune.

#### Barricade de fortune  `mm_makeshift_barricade`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Une barricade de fortune faite de meubles empilés.

---

## `mm_encounter_creature_lair` — type `encounter`, visibilité `hidden`

- entrée
  > Un espace confiné saturé d'une odeur fétide. Le sol est jonché de restes organiques. Ceci est un nid.
- indice
  > Une forte odeur organique émane d'un passage étroit...
- retour
  > Le nid. L'odeur est toujours aussi atroce.

> Vous voyez autour de vous des restes de nid.

#### Restes de nid  `mm_nest_remains`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des restes organiques et des fragments osseux. Quelque chose niche ici.

---

## `mm_encounter_panicked_crewmember` — type `encounter`, visibilité `open`

- entrée
  > Un tronçon de couloir. Un membre d'équipage paniqué se tient au milieu, brandissant une arme improvisée. Ses yeux sont fous de terreur.
- indice
  > Des cris hystériques proviennent d'un couloir latéral.
- retour
  > Le couloir. Le marin s'est effondré contre le mur, épuisé.

> Vous voyez autour de vous une arme abandonnée.

#### Arme abandonnée  `mm_dropped_weapon`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Une arme improvisée — un tuyau métallique taché de sang.

---

## `mm_encounter_environmental_trap` — type `encounter`, visibilité `open`

- entrée
  > Un espace envahi par un gaz verdâtre. Des conduites endommagées sifflent, libérant des vapeurs toxiques dans l'air confiné.
- indice
  > Un sifflement et une odeur chimique proviennent d'un accès latéral.
- retour
  > La zone toxique. Le gaz s'est partiellement dissipé.

> Vous voyez autour de vous des conduites percées.

#### Conduites percées  `mm_leaking_pipes`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > Des conduites endommagées laissent échapper un gaz verdâtre. L'atmosphère est toxique ici.

---

## `mm_encounter_escape_facehugger_nest` — type `encounter`, visibilité `hidden`

- entrée
  > Un espace envahi par une matière organique pulsante. Des cocons translucides tapissent les murs. Quelque chose bouge à l'intérieur.
- indice
  > Une substance organique suinte d'un passage condamné...
- retour
  > Le nid. Les cocons vides pendent mollement.

> Vous voyez autour de vous des cocons organiques.
> À portée de main, vous remarquez un mm acid sample.

#### Cocons organiques  `mm_organic_pods`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des cocons organiques translucides. Quelque chose bouge à l'intérieur.

---

## `mm_encounter_escape_malfunctioning_android` — type `encounter`, visibilité `open`

- entrée
  > Un poste de contrôle secondaire. Un androïde endommagé se tient debout, la tête penchée à un angle anormal. Du fluide blanc coule de son cou.
- indice
  > Des bruits mécaniques saccadés proviennent d'un poste de contrôle.
- retour
  > Le poste de contrôle. L'androïde est inactif.

> Vous voyez autour de vous des pièces d'androïde.

#### Pièces d'androïde  `mm_android_parts`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des pièces d'androïde éparpillées. Du fluide blanc laiteux tache le sol.

---

## `mm_encounter_investigate_containment_breach` — type `encounter`, visibilité `hidden`

- entrée
  > Une cellule de confinement éventrée. Le verre renforcé a cédé de l'intérieur. Des traces de griffures profondes marquent le métal.
- indice
  > Du verre brisé craque sous vos pieds. Quelque chose a forcé un mur...
- retour
  > La cellule éventrée. Les marques de griffures témoignent de ce qui s'est passé.

> Vous voyez autour de vous une cellule de confinement brisée.

#### Cellule de confinement brisée  `mm_broken_containment`

- **initial (broken)** · `integrity=broken activity=inactive power=unpowered` · via `examineResult`
  > Une cellule de confinement fracturée de l'intérieur. Du verre renforcé brisé jonche le sol.

---

## `mm_encounter_investigate_lab_hazard` — type `encounter`, visibilité `open`

- entrée
  > Un laboratoire dévasté. Le verre craque sous vos pas, et des flaques fumantes rongent lentement le revêtement du sol.
- indice
  > Des vapeurs chimiques s'échappent d'un labo adjacent.
- retour
  > Le labo dévasté. Les vapeurs se sont dissipées.

> Vous voyez autour de vous des réactifs renversés.
> À portée de main, vous remarquez un mm chemical sample.

#### Réactifs renversés  `mm_spilled_chemicals`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > Des réactifs chimiques renversés. Le mélange produit des vapeurs corrosives.

---

## `mm_encounter_rescue_organic_growth` — type `encounter`, visibilité `hidden`

- entrée
  > Une cavité organique. Les parois pulsent comme un cœur géant. Des vrilles bioméchaniques ondulent lentement dans l'air.
- indice
  > Les parois organiques semblent s'épaissir vers un renfoncement...
- retour
  > La cavité organique. Les vrilles sont rétractées.

> Vous voyez autour de vous une masse pulsante.

#### Masse pulsante  `mm_pulsating_mass`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > Une masse organique pulsante. Elle réagit à votre présence.

---

## `mm_encounter_rescue_gravity_anomaly` — type `encounter`, visibilité `open`

- entrée
  > Une zone de perturbation gravitationnelle. Des débris flottent en orbite chaotique. Le sol et le plafond semblent interchangeables.
- indice
  > Des objets flottent de manière anormale dans un couloir latéral.
- retour
  > La zone de gravité instable. Les fluctuations se sont atténuées.

> Vous voyez autour de vous une distorsion gravitationnelle.

#### Distorsion gravitationnelle  `mm_gravity_distortion`

- **initial (active)** · `activity=active power=powered` · via `examineResult`
  > L'espace est déformé ici. Des objets flottent de manière erratique.

---

## `mm_ambiance_observation_window` — type `ambiance`, visibilité `open`

- entrée
  > Une alcôve d'observation avec une large baie vitrée. L'espace infini s'étend au dehors, parsemé d'étoiles froides et distantes.
- indice
  > La lumière des étoiles filtre par une baie d'observation.
- retour
  > L'alcôve d'observation. Les étoiles n'ont pas bougé.

> Vous voyez autour de vous une baie d'observation.

#### Baie d'observation  `mm_viewport`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Une grande baie d'observation. L'immensité de l'espace s'étend devant vous, indifférente.

---

## `mm_ambiance_abandoned_meal` — type `ambiance`, visibilité `open`

- entrée
  > Un coin repas. Un plateau est posé sur la table, le café encore dans la tasse — froid depuis longtemps. Quelqu'un est parti au milieu de son repas et n'est jamais revenu.
- indice
  > L'odeur de nourriture rance provient d'un coin repas.
- retour
  > Le coin repas abandonné. Rien n'a changé.

> Vous voyez autour de vous un plateau-repas froid.

#### Plateau-repas froid  `mm_cold_food`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un plateau-repas à moitié entamé. La nourriture a séché depuis longtemps. Deux chaises, une seule personne est partie.

---

## `mm_ambiance_flickering_lights` — type `ambiance`, visibilité `open`

- entrée
  > Un tronçon de couloir où les lumières agonisent. Chaque clignotement projette des ombres dansantes sur les murs. Le panneau électrique émet des étincelles bleues à intervalles irréguliers.
- indice
  > Des lumières clignotent de façon erratique dans un couloir.
- retour
  > Le couloir aux lumières mourantes. Elles clignotent toujours.

> Vous voyez autour de vous un panneau qui crépite.

#### Panneau qui crépite  `mm_sparking_panel`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Un panneau électrique endommagé crépite. Les lumières clignotent au rythme des courts-circuits.

---

## `mm_ambiance_memorial_wall` — type `ambiance`, visibilité `open`

- entrée
  > Un mur transformé en mémorial de fortune. Des photos d'équipage, des messages griffonnés et des bougies éteintes. Quelqu'un a pris le temps d'honorer les morts.
- indice
  > Des bougies éteintes et des photos sont disposées sur un mur.
- retour
  > Le mémorial. Les visages des disparus vous regardent en silence.

> Vous voyez autour de vous un mémorial improvisé.

#### Mémorial improvisé  `mm_memorial_photos`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des photos d'équipage, des messages d'adieu, des bougies éteintes. Un mémorial improvisé.

---

## `mm_ambiance_escape_airlock_view` — type `ambiance`, visibilité `open`

- entrée
  > Un sas d'observation donne sur le vide. Des débris flottent lentement de l'autre côté de la vitre. L'un d'eux ressemble à un corps en combinaison.
- indice
  > Un sas donne sur le vide spatial et des débris flottants.
- retour
  > Le sas d'observation. Les débris ont dérivé un peu plus loin.

> Vous voyez autour de vous une coque arrachée.

#### Coque arrachée  `mm_space_view`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Le sas donne sur un morceau de coque arrachée. L'espace flotte, indifférent, au-delà.

---

## `mm_ambiance_escape_cryopod_room` — type `ambiance`, visibilité `open`

- entrée
  > Une salle de cryogénie. Les douze pods sont ouverts, le givre encore visible sur les parois internes. Réveil d'urgence — tout le monde est parti en même temps.
- indice
  > De la condensation s'échappe d'une salle de cryogénie.
- retour
  > La salle de cryogénie. Le givre a fondu.

> Vous voyez autour de vous des cryopods vides.

#### Cryopods vides  `mm_empty_cryopods`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Douze cryopods. Tous ouverts. Tous vides. Les procédures de réveil ont été déclenchées d'un coup.

---

## `mm_ambiance_escape_cat_collar` — type `ambiance`, visibilité `hidden`

- entrée
  > Un recoin sous une couchette, à l'abri des regards. Un bol d'eau vide est renversé sur le sol. Quelqu'un, ici, n'était pas tout à fait seul.
- indice
  > Vous entendez un miaulement étouffé... ou était-ce votre imagination ?
- retour
  > Le coin du chat disparu. Le bol est toujours vide.

> Vous voyez autour de vous un collier de chat.

#### Collier de chat  `mm_pet_collar`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un collier de chat avec une médaille gravée "Jonesy". Le collier est intact, mais pas de chat en vue.

---

## `mm_ambiance_investigate_test_chamber` — type `ambiance`, visibilité `open`

- entrée
  > Une chambre de test. Une cage en acier renforcé a été forcée de l'intérieur — les barreaux pliés comme du papier. Au sol, des marques de griffes profondes mènent vers le conduit de ventilation.
- indice
  > Un accès vers une chambre de test au silence oppressant.
- retour
  > La chambre de test. La cage ouverte est un rappel silencieux.

> Vous voyez autour de vous une cage ouverte.

#### Cage ouverte  `mm_empty_cage`

- **initial (broken)** · `integrity=broken activity=inactive power=unpowered` · via `examineResult`
  > Une cage en acier renforcé, ouverte de l'intérieur. Les barreaux sont pliés vers l'extérieur.

---

## `mm_ambiance_investigate_specimen_jars` — type `ambiance`, visibilité `open`

- entrée
  > Un laboratoire de stockage. Des étagères de bocaux contiennent des spécimens flottant dans du formol. Certains semblent vous regarder. L'un d'eux est brisé, son contenu absent.
- indice
  > Une lumière verdâtre filtre d'un laboratoire de stockage.
- retour
  > Le laboratoire aux spécimens. L'un des bocaux semble avoir légèrement changé de position.

> Vous voyez autour de vous une collection de spécimens.

#### Collection de spécimens  `mm_specimen_collection`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des dizaines de bocaux contenant des spécimens biologiques. Certains ont des formes presque humaines.

---

## `mm_ambiance_investigate_quarantine` — type `ambiance`, visibilité `open`

- entrée
  > Une zone de quarantaine violée. Le sas hermétique est grand ouvert, les voyants passés au rouge. Des combinaisons de protection déchirées gisent au sol.
- indice
  > Un voyant rouge de quarantaine clignote près d'un sas.
- retour
  > La quarantaine violée. Le sas reste ouvert, le danger dispersé.

> Vous voyez autour de vous un panneau de quarantaine.

#### Panneau de quarantaine  `mm_quarantine_sign`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un panneau "QUARANTAINE - NIVEAU 4". Le sas est grand ouvert. La quarantaine n'a pas tenu.

---

## `mm_ambiance_rescue_crystal_garden` — type `ambiance`, visibilité `open`

- entrée
  > Un jardin de cristaux naturels. Des formations minérales irisées émergent du sol, projetant des arcs-en-ciel sur les parois. L'air vibre d'un bourdonnement harmonique — presque apaisant.
- indice
  > Des reflets irisés dansent sur les murs depuis une cavité.
- retour
  > Le jardin de cristaux. Le bourdonnement harmonique n'a pas changé.

> Vous voyez autour de vous des formations de cristaux.

#### Formations de cristaux  `mm_crystal_formations`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Des cristaux aux reflets irisés poussent du sol et des murs. Ils émettent un bourdonnement à peine audible.

---

## `mm_ambiance_rescue_organic_cocoon` — type `ambiance`, visibilité `hidden`

- entrée
  > Un renfoncement organique. Un cocon translucide est suspendu au plafond. À travers la membrane, vous distinguez une silhouette humanoïde immobile — en hibernation ou en transformation.
- indice
  > Un murmure biologique s'échappe d'un renfoncement dans la paroi.
- retour
  > Le cocon. La silhouette à l'intérieur semble avoir bougé imperceptiblement.

> Vous voyez autour de vous un cocon biomécanique.

#### Cocon biomécanique  `mm_bio_cocoon`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Un cocon biomécanique translucide. À l'intérieur, une silhouette humanoïde figée dans une pose de sommeil.

