# Transcript — Dernier Signal (`rescue`)

> Généré par `npx tsx scripts/narrative-transcript.ts`. Ne pas éditer à la main.
> `⚠` marque un texte que le joueur ne peut pas atteindre, ou un nom manquant.

## Intro du scénario

> Station Orbitale Calypso — le signal de detresse pulse depuis 72 heures. Votre navette s'est ecrasee a l'approche, la coque percee. Quelqu'un est encore en vie la-dedans — la Dr. Okonkwo, chercheuse principale du Projet Chasseur. Mais quelque chose d'autre vit aussi dans ces couloirs. Quelque chose qui chasse. Trouvez la survivante. Stabilisez-la. Sortez-la de la. Avant que le chasseur ne vous trouve tous les deux.

---

## Nœud `start` — rôle `entry`, beat `intro`, tension 2

*Nom de lieu tiré parmi :* « Alcôve cristalline » · « Impasse organique » · « Chambre aveugle » · « Alcôve de cristaux noirs » · « Impasse de membranes » · « Chambre dormante » · « Alcôve de spores » · « Impasse de filaments » · « Chambre d'incubation » · « Alcôve pulsante » · « Impasse de chair » · « Chambre de gestation » · « Alcôve de bioluminescence » · « Impasse de cristaux » · « Chambre d'absorption » · « Alcôve de mycorhizes » · « Impasse de résine » · « Chambre de stockage biologique » · « Alcôve de capsules » · « Impasse de membranes dormantes » · « Alcôve de cristaux de mémoire » · « Chambre d'œufs »

### Ce que le joueur lit en entrant

> Site de Crash. Votre navette s'est ecrasee contre le dock d'amarrage de la Station Calypso. La coque est percee, le cockpit deforme au-dela de toute reparation. De la fumee s'echappe des circuits brules. La soute arriere contient peut-etre du materiel recuperable. Un signal de detresse pulse depuis les profondeurs de la station — regulier, insistant. Quelqu'un est vivant la-dedans.

> Vous voyez autour de vous Navette écrasée, Brèche de coque, Pièces récupérables, Balise de détresse endommagée.
> Parmi les débris, vous remarquez Trousse de premiers soins.

*Sorties :* unlock

### Éléments

#### Navette écrasée  `crashed_shuttle`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > Votre navette, ecrasee a l'approche. Le cockpit est deforme au-dela de toute reparation. La soute arriere est partiellement accessible — des debris bloquent l'acces complet.
- **après newState:open** · `integrity=damaged openness=open lock=unlocked` · via `descriptions`
  > Votre navette, ecrasee a l'approche. Le cockpit est deforme au-dela de toute reparation. La soute arriere est partiellement accessible — des debris bloquent l'acces complet.
- ⚠ **INATTEIGNABLE** `descriptions.open`
  > La soute de la navette est dégagée. De la fumée s'échappe encore des circuits brûlés. Les compartiments de rangement sont ouverts — la plupart vides ou détruits. Le moteur principal est en miettes, le réservoir percé. Cette navette ne redécollera jamais.
- **EXAMINE** (état=damaged, auto)
  - réussite ⚠ `sans newState`
    > La soute arriere contient du materiel d'urgence. Un compartiment medical est visible mais coince sous une poutre tordue. Le moteur principal est en miettes — il faudra trouver un autre moyen de partir.
- **FORCE_OPEN** (état=damaged, DC 10 FOR)
  - réussite `newState=open`
    > Vous arrachez la poutre tordue. Le metal grince, cede. Le compartiment medical s'ouvre — un stabilisateur medical de niveau hospitalier.
  - échec
    > La poutre refuse de bouger. Le metal est tordu a un angle impossible. Il faudra plus de force — ou un outil.
- **FORCE_OPEN** (état=damaged, objet=salvage_tool, auto)
  - réussite `newState=open`
    > L'outil de recuperation fait levier. La poutre se plie, liberant le compartiment medical. Le stabilisateur est intact, pret a l'emploi.
- **SCAN** (état=damaged, DC 9 PER)
  - réussite ⚠ `sans newState` `flagSet=shuttle_searched`
    > Fouillant les débris du cockpit, vous trouvez un outil de récupération encore fonctionnel. Le compartiment médical reste bloqué, mais l'outil pourrait aider à faire levier.

#### Brèche de coque  `hull_breach`

- **initial (open)** · `openness=open lock=unlocked` · via `descriptions`
  > Une breche beante dans la coque exterieure. Les bords sont dechiquetes — l'impact venait de dehors. L'air s'echappe lentement.
- **après newState:closed** · `openness=closed lock=unlocked` · via `descriptions`
  > La breche est colmatee. Un travail de fortune, mais l'air ne fuit plus.
- **REPAIR** (état=open, DC 12 INT)
  - réussite `newState=closed` `flagSet=breach_sealed`
    > Vous utilisez des plaques de debris et du cablage pour improviser un colmatage. Pas joli, mais etanche. La fuite d'air s'arrete.
  - échec
    > Les plaques de debris ne tiennent pas. La breche est trop irreguliere. Il faudrait de meilleurs materiaux.
- **REPAIR** (état=open, objet=salvage_tool, auto)
  - réussite `newState=closed` `flagSet=breach_sealed`
    > L'outil de recuperation decoupe des plaques aux bonnes dimensions. Soudage de fortune — la breche est scellee. L'atmosphere se stabilise.
- **EXAMINE** (état=open, auto)
  - réussite ⚠ `sans newState` `flagSet=breach_examined`
    > Les marques d'impact sont violentes — pas un asteroide, quelque chose de biologique. Des griffures profondes dans le metal. Ce qui a perce cette coque ne venait pas de l'espace. Ca venait de l'interieur.

#### Pièces récupérables  `salvageable_parts`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Pieces recuperables eparpillees dans les debris : cablage, composants electroniques, outils de fortune. De quoi improviser.
- **après newState:empty** · `integrity=intact contents=empty` · via `descriptions`
  > Les debris utiles ont deja ete recuperes. Il ne reste que de la ferraille inutile.
- **SCAN** (DC 8 PER)
  - réussite `newState=empty`
    > Vous fouillez les debris methodiquement. Un outil de recuperation multifonction — encore operationnel. Et des composants electroniques qui pourraient servir pour des reparations.
- **TAKE** (état=intact, auto)
  - réussite `newState=empty`
    > Vous ramassez ce qui semble utile : un outil de recuperation, des cables, quelques composants. Le reste est de la ferraille.

#### Balise de détresse endommagée  `emergency_beacon_broken`

- **initial (broken)** · `integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > La balise de detresse de la navette — endommagee dans le crash. Le circuit d'emission est intact mais l'antenne est brisee.
- **après newState:intact+active** · `integrity=intact activity=active power=powered` · via `descriptions`
  > La balise est reparee. Le signal pulse vers l'exterieur — quelqu'un, quelque part, pourrait le capter.
- **REPAIR** (état=broken, objet=salvage_tool, DC 11 INT)
  - réussite `newState=intact+active` `flagSet=backup_beacon_active`
    > Antenne reconstruite avec des pieces de fortune. Le circuit d'emission reprend vie — un bip regulier. La portee est limitee, mais c'est un signal. Un espoir de secours exterieur.
  - échec
    > Les composants ne s'emboitent pas correctement. L'antenne reste silencieuse.
- **EXAMINE** (état=broken, auto)
  - réussite ⚠ `sans newState`
    > Le circuit d'emission est intact — seule l'antenne est brisee. Avec un composant de remplacement compatible (meme gamme de frequences), la balise pourrait etre remise en service.

### Objets

#### Trousse de premiers soins  `first_aid_kit`

- description
  > Trousse de premiers soins recuperee de la navette. Compresses, desinfectant, garrot. Pas suffisant pour une blessure grave, mais utile en urgence.
- examineResult
  > Trousse de premiers soins recuperee de la navette. Compresses, desinfectant, garrot. Pas suffisant pour stabiliser une blessure grave.
- **USE sur `self`** ⚠ `sans newState`
  > Vous appliquez les compresses et le desinfectant sur vos blessures. Le garrot ralentit un saignement. Ce n'est pas grand chose, mais suffisant pour tenir.
- **USE sur `dr_okonkwo`** ⚠ `sans newState` `flagSet=okonkwo_patched`
  > Vous appliquez les compresses sur ses plaies les plus visibles. Le garrot stoppe un saignement au bras. Ce n'est pas suffisant pour la stabiliser — il faut un stabilisateur medical — mais elle respire un peu mieux.

#### Stabilisateur médical  `medical_stabilizer` *(caché)*

- description
  > Stabilisateur medical de niveau hospitalier. Maintient un patient en etat stable pendant plusieurs heures. Exactement ce qu'il faut pour la survivante blessee.
- examineResult
  > Stabilisateur medical de niveau hospitalier. Ce dispositif peut maintenir un patient en etat stable pendant plusieurs heures — exactement ce qu'il faut pour la survivante blessee.
- **USE sur `dr_okonkwo`** ⚠ `sans newState` `flagSet=escort_active`
  > Vous activez le stabilisateur et le fixez sur sa blessure principale. Les moniteurs passent au vert. La Dr. Okonkwo ouvre les yeux plus grand, la douleur recule. 'Merci. Je... je peux marcher maintenant. Sortons d'ici — ensemble.'

#### Outil de récupération  `salvage_tool` *(caché)*

- description
  > Outil de recuperation multifonction. Levier, coupeur, soudeur de fortune. L'allie du survivaliste.
- examineResult
  > Outil de recuperation multifonction. Levier, coupeur, soudeur de fortune.
- **USE sur `collapsed_corridor`** `newState=intact+open` `flagSet=corridor_cleared_tool`
  > L'outil de recuperation fait levier sur les poutres effondrees. Le metal grince, cede. Un passage etroit mais praticable s'ouvre dans les decombres.
- **USE sur `blast_door_partial`** `newState=intact+open` `flagSet=blast_door_widened`
  > Vous bloquez l'outil dans le mecanisme de la porte blindee et forcez. Le metal grince — la porte s'ouvre de 30 centimetres supplementaires. Assez pour passer.
- **USE sur `extraction_bay_door`** `newState=intact+open` `flagSet=extraction_door_opened`
  > L'outil sert de levier pour forcer le mecanisme endommage. La porte de la baie d'extraction coulisse — la navette est de l'autre cote.

---

## Nœud `unlock` — rôle `gate`, beat `rising`, tension 4

*Nom de lieu tiré parmi :* « Chambre de régénération » · « Alcôve de soins organiques » · « Bassin de guérison » · « Cocon de restauration » · « Chambre de symbiose médicale » · « Nid de cicatrisation » · « Cavité de régénération cellulaire » · « Chambre de fluides curatifs » · « Bassin de spores médicinales » · « Alcôve de bio-réparation » · « Chambre de chrysalide » · « Cavité de membranes curatives » · « Bassin de régénération alien » · « Chambre de pulsations vitales » · « Alcôve de restauration biologique » · « Nid de soins primitifs » · « Chambre de culture thérapeutique » · « Cavité de fluides régénérants » · « Bassin de guérison cristalline » · « Chambre de métabolisme accéléré » · « Alcôve de réparation organique » · « Nid de chrysalides médicales »

### Ce que le joueur lit en entrant

> Point de Triage. Zone medicale devastee — civieres renversees, materiel chirurgical eparpille. Le couloir principal s'est effondre sous le poids des poutres — des tonnes de metal bloquent le passage. Le signal de detresse est plus fort ici, juste de l'autre cote. Une trappe de maintenance est visible au ras du sol. Un rack contient un decoupeur plasma industriel — puissant, mais le bruit attirerait l'attention.

> Vous voyez autour de vous Couloir effondré, Trappe de déviation maintenance, Rack de découpeur plasma.

*Sorties :* start, reveal

### Éléments

#### Couloir effondré  `collapsed_corridor`

- **initial (broken)** · `integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > Le couloir s'est effondre sous le poids des debris. Des poutres metalliques bloquent le passage principal. La structure gemit encore — instable.
- **après newState:intact+open** · `integrity=intact activity=inactive power=unpowered openness=open lock=unlocked` · via `descriptions`
  > Les debris ont ete degages. Le passage est etroit mais praticable. Des traces de sang menent de l'autre cote.
- **FORCE_OPEN** (état=broken, DC 12 FOR)
  - réussite `newState=intact+open`
    > Poutre par poutre, vous degagez le passage. Le metal mord vos mains, la sueur brule vos yeux. Mais le couloir s'ouvre enfin.
  - échec
    > Les poutres sont trop lourdes, trop enchevetrees. Vous vous epuisez sans resultat. Il faut une autre approche — ou un outil.
- **FORCE_OPEN** (état=broken, objet=salvage_tool, auto)
  - réussite `newState=intact+open`
    > L'outil de recuperation fait levier sur les poutres principales. Le metal cede proprement — le passage s'ouvre sans effort excessif.
- **EXAMINE** (état=broken, DC 11 PER)
  - réussite ⚠ `sans newState` `flagSet=detour_found`
    > En examinant les murs autour de l'effondrement, vous reperez une trappe de maintenance partiellement cachee par les decombres. Un passage alternatif.
- **USE** (état=broken, objet=plasma_cutter, DC 10 INT)
  - réussite `newState=intact+open` `flagSet=noise_made_unlock`
    > Le decoupeur plasma tranche les poutres comme du beurre. Le passage s'ouvre dans une pluie d'etincelles et une odeur de metal brule. Efficace — mais le bruit a du porter loin.
- **CLIMB** (état=broken, DC 8 AGI)
  - réussite `newState=intact+open`
    > Vous rampez entre les poutres tordues. Le métal mord votre peau, les débris s'effondrent derrière vous. Trois mètres de terreur pure. Mais vous passez.
  - échec
    > Vous tentez de ramper dans les décombres mais une poutre glisse, manquant de vous écraser. Trop instable — il faut une autre approche.

#### Trappe de déviation maintenance  `maintenance_detour_hatch`

- **initial (closed)** · `openness=closed` · via `descriptions`
  > Trappe d'acces vers les conduits de maintenance. Etroite mais praticable. Un chemin alternatif pour contourner l'effondrement.
- **après newState:open** · `openness=open lock=unlocked` · via `descriptions`
  > La trappe est ouverte. Le conduit de maintenance est sombre et etroit, mais il mene de l'autre cote.
- **OPEN** (état=closed, flag=detour_found, auto)
  - réussite `newState=open`
    > La trappe s'ouvre dans un grincement. Le conduit est etroit — il faudra ramper. Mais il mene de l'autre cote de l'effondrement, en silence.
- **OPEN** (état=closed, auto)
  - réussite `newState=open`
    > La trappe resiste un instant, puis cede. Le conduit de maintenance s'ouvre devant vous — un boyau sombre. Pas confortable, mais praticable.

#### Rack de découpeur plasma  `plasma_cutter_rack`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Rack contenant un decoupeur plasma industriel. Puissant — mais le bruit attirerait l'attention de tout predateur dans les parages.
- **après newState:empty** · `integrity=intact contents=empty` · via `descriptions`
  > Le rack est vide. Le decoupeur a ete pris.
- **TAKE** (état=intact, auto)
  - réussite `newState=empty`
    > Le decoupeur plasma est lourd mais fonctionnel. La batterie est a 40% — assez pour quelques coupes. L'outil parfait pour les obstacles physiques, si vous acceptez le bruit.

### Objets

#### Découpeur plasma  `plasma_cutter` *(caché)*

- description
  > Decoupeur plasma industriel. Coupe le metal comme du beurre. Bruyant, limite en batterie, mais devastateur.
- examineResult
  > Decoupeur plasma industriel. Puissant assez pour couper a travers les poutres effondrees, mais le bruit attirerait l'attention.
- **USE sur `collapsed_corridor`** `newState=intact+open` `flagSet=corridor_plasma_cut`
  > Le plasma tranche les poutres dans une gerbe d'etincelles bleues. Le passage s'ouvre — mais le rugissement du decoupeur a resonne dans toute la station.
- **USE sur `creature_hunter`** ⚠ `sans newState`
  > Le faisceau plasma touche la creature. Elle hurle — un son qui vous transperce — et recule, la chair cauterisee. Blessee, pas vaincue. Mais vous avez gagne un repit.

---

## Nœud `reveal` — rôle `midpoint`, beat `midpoint`, tension 6

*Nom de lieu tiré parmi :* « Chambre de régénération » · « Alcôve de soins organiques » · « Bassin de guérison » · « Cocon de restauration » · « Chambre de symbiose médicale » · « Nid de cicatrisation » · « Cavité de régénération cellulaire » · « Chambre de fluides curatifs » · « Bassin de spores médicinales » · « Alcôve de bio-réparation » · « Chambre de chrysalide » · « Cavité de membranes curatives » · « Bassin de régénération alien » · « Chambre de pulsations vitales » · « Alcôve de restauration biologique » · « Nid de soins primitifs » · « Chambre de culture thérapeutique » · « Cavité de fluides régénérants » · « Bassin de guérison cristalline » · « Chambre de métabolisme accéléré » · « Alcôve de réparation organique » · « Nid de chrysalides médicales »

### Ce que le joueur lit en entrant

> Laboratoire de la Dr. Okonkwo. Une barricade methodique bloque l'entree — mobilier soude, plaques d'acier. Derriere, une femme. Blessee. Consciente. Le terminal de recherche clignote a cote d'elle, affichant des donnees fragmentaires du Projet Chasseur. Des rations vides indiquent qu'elle survit ici depuis au moins 48 heures. Le chemin de sortie passe par le territoire de chasse de la creature.

> Vous voyez autour de vous Barricade de survivant, Terminal de recherche.
> Parmi les débris, vous remarquez Notes de recherche, Composant d'émetteur sonique.

*Sorties :* unlock, escalation

### Éléments

#### Barricade de survivant  `survivor_barricade`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Barricade improvisee — mobilier, plaques metalliques, cablage. Quelqu'un s'est retranche ici avec methode. Des traces de sang menent derriere.
- **après newState:broken** · `integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > La barricade est en morceaux. Ca ne protegera plus personne.
- **TALK** (état=intact, DC 8 CHA)
  - réussite ⚠ `sans newState` `flagSet=okonkwo_found`
    > "Il y a quelqu'un ?" Silence. Puis une voix, rauque, mefiante : "Qui etes-vous ? Comment etes-vous arrive ici ?" Des bruits de metal — la barricade s'entrouvre. Une femme blessee vous devisage. La Dr. Okonkwo.
  - échec
    > "Allez-vous en !" La voix derriere la barricade est terrifiee, pas hostile. Mais elle refuse d'ouvrir. Il faudra insister — ou trouver un autre moyen.
- **EXAMINE** (auto)
  - réussite ⚠ `sans newState`
    > Construction methodique — une scientifique a fait ca, pas un technicien panique. Les plaques sont soudees aux points de stress. Des rations vides indiquent que quelqu'un a survecu ici pendant au moins 48 heures.
- **BREAK** (DC 8 FOR)
  - réussite `newState=broken` `flagSet=okonkwo_found`
    > Vous demontez la barricade a coups de pied. Le metal s'effondre dans un fracas assourdissant. Derriere, une femme blessee recule, terrifiee — la Dr. Okonkwo. Votre entree en force n'inspire pas confiance.

#### Terminal de recherche  `research_terminal`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > Terminal de recherche partiellement detruit. L'ecran clignote — donnees fragmentaires recuperables.
- **après newState:intact+active** · `integrity=intact activity=active power=powered` · via `descriptions`
  > Terminal restaure. Les donnees du Projet Chasseur s'affichent en entier — une horreur fascinante.
- `readableContent` (417 car.)
- **READ** (état=damaged, auto)
  - réussite ⚠ `sans newState` `flagSet=project_hunter_read`
    > Donnees fragmentaires : 'Projet Chasseur — sensibilite acoustique extreme — frequences 15-20 kHz — desorientation confirmee'. Et une note personnelle : 'J'aurais du arreter au Stade 3. Pardon.'
- **REPAIR** (état=damaged, DC 11 INT)
  - réussite `newState=intact+active` `flagSet=creature_learns_discovered`
    > Le terminal reprend vie. Les donnees completes du Projet Chasseur s'affichent. Et un detail crucial : la creature APPREND. Elle s'adapte aux stimuli repetes en 3 a 5 expositions.
- **READ** (état=active, auto)
  - réussite ⚠ `sans newState` `flagSet=project_hunter_read`
    > Les donnees completes du Projet Chasseur. Sequences genetiques, courbes d'adaptation, rapports d'incidents. Tout est la — la preuve que la corporation savait ce qu'elle faisait.

### Objets

#### Notes de recherche  `research_notes`

- description
  > Notes de recherche d'Okonkwo. Projet Chasseur — sensibilite acoustique extreme. Les hautes frequences la desorientent. L'information qui pourrait vous sauver la vie.
- examineResult
  > Notes de recherche detaillant le Projet Chasseur — une creature modifiee genetiquement. Point cle : sensibilite acoustique extreme.

#### Composant d'émetteur sonique  `sonic_emitter_component`

- description
  > Composant d'emetteur sonique haute frequence. Utilise dans les experiences d'Okonkwo. Combine avec l'acoustique d'une zone confinee, il pourrait neutraliser la creature.
- examineResult
  > Composant d'emetteur sonique haute frequence. Combine avec l'acoustique d'une zone confinee, il pourrait neutraliser ou pieger la creature.
- **USE sur `creature_hunter`** ⚠ `sans newState` `flagSet=creature_repelled_escalation`
  > Vous activez le composant sonique. Un hurlement ultrasonique — inaudible pour vous, devastateur pour la creature. Elle se tord de douleur, recule. Un repit precieux.
- **USE sur `acoustic_trap_point`** `newState=active` `flagSet=creature_contained`
  > Vous fixez le composant sonique au point de piege acoustique. L'activation declenche une cascade de resonance — les murs acoustiques amplifient le signal x100. Un mur de son invisible, infranchissable pour la creature. Confinee. Neutralisee. Pour toujours.
- **USE sur `acoustic_walls`** ⚠ `sans newState` `flagSet=creature_repelled_escalation`
  > Vous activez le composant contre les parois acoustiques. Le son se repercute violemment — la creature hurle et s'enfuit du couloir. Le chemin est libre, temporairement.
- **USE sur `emergency_beacon_broken`** `newState=intact+active` `flagSet=backup_beacon_active`
  > Le composant sonique remplace l'antenne brisee — meme gamme de frequences. La balise emet a nouveau. Mais vous venez de sacrifier votre seule arme contre la creature.

---

## Nœud `escalation` — rôle `escalation`, beat `escalation`, tension 8

*Nom de lieu tiré parmi :* « Tunnel organique » · « Couloir de spores » · « Passage de cristaux » · « Tunnel de bioluminescence » · « Couloir extraterrestre » · « Passage de membranes » · « Tunnel de lianes » · « Couloir de pulsations » · « Passage de filaments » · « Tunnel de sang noir » · « Couloir de nervures » · « Passage de spires » · « Tunnel de mycètes » · « Couloir de résine » · « Passage de cheiropodes » · « Tunnel de membranes pulsantes » · « Couloir de chairs » · « Passage de cristaux noirs » · « Tunnel d'ossements » · « Couloir de plaques » · « Passage de spores denses » · « Tunnel de biovaisseaux »

### Ce que le joueur lit en entrant

> Zone de Traque. Les couloirs sont plus etroits ici — visibilite reduite, recoins sombres, points d'embuscade. L'air est plus mince. Les parois sont recouvertes de panneaux acoustiques — vestiges du laboratoire d'Okonkwo. Un rack de diversion contient des grenades flash. Une porte blindee partiellement ouverte bloque le passage vers la baie d'extraction. Des griffures profondes sur la porte — la creature est passee par la.

> Vous voyez autour de vous Parois acoustiques, Rack de diversion, Porte blindée partiellement ouverte.

*Sorties :* reveal, boss

### Éléments

#### Parois acoustiques  `acoustic_walls`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Panneaux acoustiques recouvrant les parois — vestiges du laboratoire d'Okonkwo. Ils amplifient le son de maniere spectaculaire.
- **EXAMINE** (DC 10 INT)
  - réussite ⚠ `sans newState` `flagSet=acoustic_info_received`
    > Les panneaux sont calibres pour 15-20 kHz — frequence de resonance maximale. Vous comprenez : un emetteur sonique a cette frequence, dans cette geometrie, creerait une cage acoustique infranchissable. La faiblesse de la creature, amplifiee par l'architecture.
- **EXAMINE** (auto)
  - réussite ⚠ `sans newState` `flagSet=acoustic_potential_noted`
    > Les panneaux sont concus pour une resonance maximale dans la gamme 15-20 kHz — exactement la frequence de sensibilite de la creature. Si vous avez le composant sonique, c'est ICI qu'il faut l'utiliser.

#### Rack de diversion  `distraction_rack`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Rack contenant des grenades flash et des generateurs de bruit. Utiles pour detourner l'attention d'un predateur.
- **après newState:empty** · `integrity=intact contents=empty` · via `descriptions`
  > Le rack est vide. Les dispositifs de diversion ont ete pris.
- **TAKE** (état=intact, auto)
  - réussite `newState=empty`
    > Vous prenez une grenade flash et un generateur de bruit portable. Des leurres — pas des armes. Mais dans un jeu de chat et de souris, le leurre peut faire toute la difference.

#### Porte blindée partiellement ouverte  `blast_door_partial`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > Porte blindee coincee a mi-course. Des marques de griffes temoignent d'une force terrifiante. Le mecanisme est bloque.
- **après newState:open** · `integrity=damaged openness=open lock=unlocked` · via `descriptions`
  > Porte blindee coincee a mi-course. Des marques de griffes temoignent d'une force terrifiante. Le mecanisme est bloque.
- ⚠ **INATTEIGNABLE** `descriptions.open`
  > Porte blindee forcee ouverte. Le passage vers le point d'extraction est libre.
- **FORCE_OPEN** (état=damaged, DC 13 FOR)
  - réussite `newState=open`
    > Vous agrippez le bord de la porte et poussez de toute votre force. Le mecanisme cede dans un grincement metallique. La porte s'ouvre — de l'autre cote, la baie d'extraction.
  - échec
    > La porte refuse de bouger. Le mecanisme est solidement coince. Le metal vous entaille les mains. Il faudrait un levier, un outil, ou une approche differente.
- **FORCE_OPEN** (état=damaged, objet=salvage_tool, auto)
  - réussite `newState=open` `flagSet=blast_door_widened`
    > L'outil de recuperation fait levier. Le mecanisme cede. La porte blindee coulisse — la baie d'extraction s'ouvre devant vous.
- **REPAIR** (état=damaged, DC 11 INT)
  - réussite `newState=open`
    > Vous trouvez le mecanisme coince et realignez les rails. La porte coulisse — lentement, mais suffisamment.
  - échec
    > Le mecanisme est trop endommage pour une reparation rapide. Les rails sont desalignes a un angle impossible.

### Objets

#### Dispositif de diversion  `distraction_device` *(caché)*

- description
  > Grenade flash + generateur de bruit. Combines, ils creent une diversion parfaite — lumiere aveuglante et son desorientant. Usage unique.
- examineResult
  > Grenade flash et generateur de bruit. Utiles pour creer une diversion et detourner la creature.
- **USE sur `creature_hunter`** ⚠ `sans newState` `flagSet=creature_distracted`
  > Flash ! Le blanc aveuglant se combine avec le hurlement du generateur de bruit. La creature se tord, desorientee, et s'eloigne en titubant vers les ombres. Le leurre a marche — vous avez une fenetre de quelques minutes.

---

## Nœud `boss` — rôle `climax`, beat `climax`, tension 10

*Nom de lieu tiré parmi :* « Sphincter de sortie » · « Membrane d'expulsion » · « Orifice de transition » · « Valve de pressurisation organique » · « Sphincter d'évacuation » · « Membrane de passage extérieur » · « Orifice de décompression » · « Valve de sortie alien » · « Sphincter de transfert » · « Membrane d'accès au vide » · « Orifice d'expulsion principal » · « Valve de séparation atmosphérique » · « Sphincter de transit » · « Membrane de sas organique » · « Orifice de sortie secondaire » · « Valve de décontamination alien » · « Sphincter de dépressurisation » · « Membrane d'éjection » · « Orifice de passage pressurisé » · « Valve de transition externe » · « Sphincter de sortie principal » · « Membrane de fermeture hermétique »

### Ce que le joueur lit en entrant

> Baie d'Extraction. La navette de secours est la — cabossee mais fonctionnelle, l'ecoutille ouverte, les moteurs en veille. La liberte est a portee de main. Mais la creature se dresse entre vous et la navette. Biomasse sombre, griffes d'acier, yeux trop intelligents. La geometrie de la baie forme un entonnoir acoustique naturel — un detail qui pourrait tout changer si vous avez les bons outils. Un choix impossible s'impose.

> Vous voyez autour de vous Écoutille de navette, Point de piège acoustique, Porte de baie d'extraction.

*Sorties :* escalation, resolution

### Éléments

#### Écoutille de navette  `shuttle_hatch`

- **initial (open)** · `openness=open lock=unlocked` · via `descriptions`
  > L'ecoutille de la navette d'evacuation. Le systeme est fonctionnel — la navette peut decoller des que tout le monde est a bord. Ou des que vous decidez qui monte.
- **MOVE_TO** (flag=escort_active, auto)
  - réussite ⚠ `sans newState` `flagSet=both_in_shuttle`
    > Vous aidez la Dr. Okonkwo a monter dans la navette. Elle s'accroche a vous, epuisee mais vivante. 'Merci', murmure-t-elle. Vous lancez le decollage.
- **MOVE_TO** (auto)
  - réussite ⚠ `sans newState` `flagSet=okonkwo_abandoned`
    > Vous montez dans la navette. Seul. Derriere vous, la Dr. Okonkwo vous regarde, incredule. 'Non... non, attendez !' Vous fermez l'ecoutille. Le moteur rugit.
- **USE/SACRIFICE** (flag=escort_active, DC 14 CHA)
  - réussite ⚠ `sans newState` `flagSet=okonkwo_used_as_bait`
    > "Docteur, il faut distraire la creature. C'est vous qu'elle veut." Le visage d'Okonkwo se decompose. La comprehension, puis la resignation. "Je l'ai creee. C'est ma responsabilite." Elle s'avance vers l'ombre, boitant.
  - échec
    > "Non. NON ! Je refuse de mourir pour vos lachetees !" Okonkwo recule, terrifiee. La manipulation a echoue — elle ne se sacrifiera pas volontairement.

#### Point de piège acoustique  `acoustic_trap_point`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Point ideal pour un piege acoustique. La geometrie concentre les ondes sonores comme un amplificateur naturel.
- **après newState:active** · `integrity=intact activity=active power=powered` · via `descriptions`
  > Le piege acoustique est actif. Un mur de son invisible confine la creature. Piegee.
- **USE** (objet=sonic_emitter_component, flag=acoustic_info_received, auto)
  - réussite `newState=active` `flagSet=creature_contained`
    > Vous fixez le composant au point optimal. Activation. Le son explose — inaudible pour vous, apocalyptique pour la creature. Les murs acoustiques amplifient le signal x100. Une cage de son invisible. Confinee. Neutralisee. Pour toujours.
- **USE** (objet=sonic_emitter_component, flag=project_hunter_read, auto)
  - réussite `newState=active` `flagSet=creature_contained`
    > Les notes de recherche vous ont appris la frequence exacte. Vous fixez le composant et calibrez l'emetteur. Le son explose — les murs acoustiques amplifient le signal x100. Une cage de resonance infranchissable. La creature est piegee. Pour toujours.
- **EXAMINE** (auto)
  - réussite ⚠ `sans newState`
    > La geometrie est parfaite — les murs forment un entonnoir acoustique naturel. Un emetteur sonique place ici creerait une zone de resonance infranchissable pour une creature sensible aux hautes frequences.

#### Porte de baie d'extraction  `extraction_bay_door`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > Porte de la baie d'extraction. Le mecanisme est endommage — la porte est entrouverte mais pas assez pour passer.
- **après newState:open** · `integrity=damaged openness=open lock=unlocked` · via `descriptions`
  > Porte de la baie d'extraction. Le mecanisme est endommage — la porte est entrouverte mais pas assez pour passer.
- ⚠ **INATTEIGNABLE** `descriptions.open`
  > Porte de la baie ouverte. La navette attend de l'autre cote.
- **REPAIR** (état=damaged, DC 11 INT)
  - réussite `newState=open` `flagSet=extraction_door_opened`
    > Vous reconnectez le circuit hydraulique. La porte s'ouvre dans un sifflement pneumatique. La navette est la — le cockpit allume, les moteurs en veille.
- **FORCE_OPEN** (état=damaged, DC 14 FOR)
  - réussite `newState=open` `flagSet=extraction_door_opened`
    > Vous forcez la porte. Le mecanisme grince, proteste, puis cede. La navette d'extraction est enfin accessible.
- **EXAMINE** (état=damaged, DC 10 PER)
  - réussite ⚠ `sans newState` `flagSet=bay_door_bypass_found`
    > Vous reperez un panneau de maintenance sur le cote. Les cables hydrauliques sont accessibles — un simple recablage et la porte devrait s'ouvrir.
- **REPAIR** (état=damaged, flag=bay_door_bypass_found, auto)
  - réussite `newState=open` `flagSet=extraction_door_opened`
    > Le recablage fonctionne. La porte s'ouvre silencieusement — presque trop facilement.

---

## Nœud `resolution` — rôle `epilogue`, beat `resolution`, tension 3

*Nom de lieu tiré parmi :* « Chambre centrale » · « Carrefour alien » · « Nœud de distribution » · « Chambre de jonction » · « Centre de convergence » · « Carrefour des tunnels » · « Chambre de bifurcation » · « Nœud central » · « Centre de croisement » · « Carrefour de cristaux » · « Chambre d'intersection » · « Nœud de dispersion » · « Centre de la ruche » · « Carrefour de membranes » · « Chambre de communication » · « Nœud de coordination » · « Centre biologique » · « Carrefour de spores » · « Chambre de convergence » · « Nœud central de la ruche » · « Carrefour des flux » · « Chambre de distribution alien »

### Ce que le joueur lit en entrant

> Le cockpit de la navette d'evacuation. Systemes en ligne, moteurs prets. L'ecran affiche les coordonnees de retour vers la flotte. Un seul bouton : DECOLLAGE. Ce qui s'est passe ensuite — qui est monte, qui est reste, ce qui est arrive a la creature — depend entierement de vos choix.

> Vous voyez autour de vous Cockpit de navette.

*Sorties :* boss

### Éléments

#### Cockpit de navette  `shuttle_cockpit`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > Le cockpit de la navette d'evacuation. Systemes en ligne, moteurs prets. L'ecran affiche les coordonnees de retour vers la flotte. Un seul bouton : DECOLLAGE. Ce qui s'est passe — qui est monte, qui est reste — depend entierement de vos choix.
- **ACTIVATE** (flag=both_in_shuttle, auto)
  - réussite ⚠ `sans newState`
    > Vous appuyez sur DECOLLAGE. La Dr. Okonkwo s'agrippe au siege copilote. Les moteurs rugissent. La station s'eloigne — avec ses secrets, ses monstres. Mais pas ses survivants. Pas cette fois.
- **ACTIVATE** (flag=creature_contained, auto)
  - réussite ⚠ `sans newState`
    > Vous appuyez sur DECOLLAGE. La creature est confinee — le piege acoustique la retiendra pour toujours. La Dr. Okonkwo regarde la station s'eloigner. "C'est fini", murmure-t-elle. Pour la premiere fois, elle semble le croire.
- **ACTIVATE** (flag=okonkwo_abandoned, auto)
  - réussite ⚠ `sans newState`
    > Vous appuyez sur DECOLLAGE. Seul dans le cockpit. La station s'eloigne. Quelque part en bas, une femme que vous avez laissee derriere hurle peut-etre encore. Vous ne le saurez jamais.
- **ACTIVATE** (flag=okonkwo_used_as_bait, auto)
  - réussite ⚠ `sans newState`
    > Vous appuyez sur DECOLLAGE. La Dr. Okonkwo a attire la creature — son sacrifice vous a ouvert la route. Les moteurs rugissent. La station s'eloigne. Vous etes vivant. C'est ce qui compte. N'est-ce pas ?
- **ACTIVATE** (flag=backup_beacon_active, auto)
  - réussite ⚠ `sans newState`
    > Vous appuyez sur DECOLLAGE. Les moteurs rugissent. En arriere-plan, le signal de la balise pulse — des secours arriveront peut-etre. La station s'eloigne en dessous, avec ses secrets, ses monstres.
- **ACTIVATE** (auto)
  - réussite ⚠ `sans newState`
    > Vous appuyez sur DECOLLAGE. Les moteurs rugissent. La station s'eloigne en dessous — avec ses secrets, ses monstres, ses morts.

