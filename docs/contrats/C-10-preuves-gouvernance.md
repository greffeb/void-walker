# C-10 — Preuves, rapports et gouvernance

> **Statut :** CONTRAT ACCEPTÉ v1.1 — D-102 ; assemble D-001, D-010, D-092 à D-101, D-104 à D-108, D-116, D-125 à D-132 et le [workflow agentique](../04-workflow-agentique.md) ; RP-01 à RP-05 acceptés par D-101. v1.1 : validation signée par le téléphone (D-130) et passage par la PR (D-129, D-131, D-132).
> **Date :** 2026-10-10.
> **Implémentation et tests :** rapports (§3, PR-01, PR-02, PR-06, PR-09) livrés par #107 ; signature et reconnaissance des validations (§4, PR-03, PR-04, PR-05, PR-10) proposées par #108 ; attente de la vérification du commit signé (RP-06) proposée par #180 ; retrait automatique d'une validation (PR-07, PR-08) absent.

## 1. But

Dire qui peut déclarer une version prête, quelles preuves comptent, et comment les retours des joueurs arrivent aux agents sans permettre à quiconque de fabriquer une validation.

## 2. Niveaux de preuve

| Niveau | Qui le donne | Ce qu'il prouve |
| --- | --- | --- |
| Candidat | Agent, avec commande de vérification verte | Le code passe ses contrôles |
| Vérifié automatiquement | CI sur le bon build : tests, vérifieur, parcours témoins | Les règles et parcours tiennent dans le moteur |
| Validé sur téléphone | Le porteur du projet, par une validation authentifiée (§4) | Une vraie partie humaine sur cette version |

Un niveau n'implique jamais le suivant (D-010). Aucun agent ne coche une partie humaine.

## 3. Rapports des joueurs

- Boutons « bug » et « envoyer ma partie » dans toutes les versions, y compris publique (D-095).
- Le jeu envoie le rapport à un service intermédiaire, qui crée une issue GitHub avec sa propre clé ; aucun compte n'est demandé (D-093/D-094). Depuis une version de test, il publie un commentaire sur la PR testée (D-132).
- Les agents mettent à jour et déploient eux-mêmes le service, en même temps que la fonctionnalité du jeu qui en a besoin (D-125/D-127).
- **RP-01 — Issue de bug :** version, partie exportée (C-09) jusqu'à l'action signalée, observation publique de cette action, commentaire. De quoi rejouer la situation exactement.
- **RP-02 — Issue d'envoi de partie :** partie exportée complète, fin obtenue, commentaire, et l'état de la case « je valide ».
- **RP-03 — Anti-abus :** limites de nombre, de délai et de doublons appliquées par le service, en plus du jeu ; un rapport non envoyé est gardé pour un nouvel essai (comme en V1).

## 4. Validation sur téléphone

**Ce que c'est.** Le porteur du projet a joué lui-même sur téléphone, avec une version précise du jeu, et confirme que l'aventure tient : elle fonctionne, se comprend et l'intéresse.

- **Ce qu'on valide (D-098) :** AR-01, AR-02, et chaque morceau du lancement au moins une fois dans une station assemblée. Une partie peut couvrir plusieurs morceaux.
- **Ce qu'il faut avoir fait (D-099) :** aller au bout, victoire ou défaite ; puis juger. Un abandon ne valide pas.
- **Durée (D-100) :** modifier l'aventure ou le morceau, ou changer le résultat d'un de ses parcours automatiques, annule la validation. Une correction du moteur sans effet sur ces résultats la conserve. La détection est automatique.

**Déroulement (D-129, D-131, D-132).** L'agent ouvre la PR avec ses preuves (captures, extraits de texte) et la mention « validation humaine requise ». La PR est publiée à une adresse de test dont le lien y est posté. Le porteur du projet joue sur téléphone ; depuis cette version, il envoie sa partie, son commentaire et, s'il le coche, « je valide » : tout arrive en commentaire de la PR.

**Authentification (D-130).** Une validation compte seulement si elle porte la case « je valide » (D-096) et la signature du téléphone du porteur du projet. La clé de signature est créée une fois par le jeu sur ce téléphone et ne le quitte jamais ; le dépôt conserve sa partie publique et la vérification est automatique.

- **RP-04 —** Le contrôle automatique marque la validation reconnue d'une étiquette ; il cite la version, l'aventure ou les morceaux couverts. Une case cochée sans signature valide reste un simple retour.
- **RP-05 —** Le journal des parties humaines référence ces validations signées ; il n'est jamais rempli sans elles.
- **RP-06 — Pendant la vérification (D-272) :** la version de test est publiée avant la fin de la vérification automatique de son commit (D-271). Une validation signée pendant que cette vérification tourne reste valide si elle finit au vert ; elle n'est pas prise en compte si elle échoue. Le contrôle automatique attend la fin de la vérification du commit signé avant de poser l'étiquette : d'ici là, il répond « en attente » ; il revient sur la validation quand la vérification finit.

## 5. Sécurité imposée

- La clé de signature ne quitte jamais le téléphone ; aucun secret de validation n'existe dans le jeu, le dépôt ou le service.
- Changer la clé publique est réservé au porteur du projet ; la CI signale tout changement de ce fichier.
- La clé GitHub du service se limite à créer des issues et commentaires sur ce dépôt ; elle n'apparaît jamais dans le jeu, une issue ou une adresse web.
- Envoi en HTTPS, données dans le corps de la requête.
- Aucune donnée personnelle au-delà du commentaire saisi.

## 6. Gouvernance du dépôt

| Zone | Contenu | Fusion |
| --- | --- | --- |
| Verte | Tests, outils, solveur, documentation — y compris un test, seuil ou contrat modifié (D-104) ; textes du jeu (D-116) | Assistant principal dans son rôle d'orchestration, après vérifications vertes et relecture indépendante (D-105, D-199) |
| Orange | Interface, équilibrage, format des scénarios ; moteur de jeu tant qu'il est jeune (D-107) | Porteur du projet, sur preuves |
| Rouge | Déploiement, format de sauvegarde, IA — sauf le service de rapports, déployé par les agents (D-127) | Porteur du projet, avec test manuel |

- **Branche principale :** pas de protection technique (D-106). La règle de travail demeure : un exécutant délégué ne pousse pas ; l'assistant principal tient le rôle d'orchestration et fusionne après vérification (D-199).
- **Rôles :** un auteur de contenu et un auteur d'outils remplacent `script-writer` (D-108).
- **Validation humaine :** jamais par un agent, quelle que soit la zone (§4).

Restent ouverts : la zone d'une demande de fusion qui touche plusieurs zones, le moment où le moteur passe en zone verte, le budget et les reprises des agents.

## 7. Exemples à prouver

| ID | Cas | Attendu |
| --- | --- | --- |
| PR-01 | Bouton « bug » sans réseau | Rapport gardé, renvoyé plus tard, aucune perte de partie |
| PR-02 | Issue de bug rejouée par un agent | Même situation reproduite |
| PR-03 | « Je valide » coché sans signature valide | Commentaire publié, aucune validation reconnue |
| PR-04 | « Je valide » signé par le téléphone enregistré | Validation reconnue et étiquetée |
| PR-05 | Recherche d'un secret de validation dans le jeu, le dépôt ou le service | Introuvable |
| PR-06 | Rafale de rapports identiques | Bloquée par le service |
| PR-07 | Morceau validé puis modifié | Validation retirée automatiquement, morceau à rejouer |
| PR-08 | Correction du moteur sans changement des parcours d'une aventure | Validation conservée |
| PR-09 | Partie envoyée depuis la version de test d'une PR | Commentaire sur cette PR, avec fichier de partie |
| PR-10 | Modification du fichier de clé publique | Signalée par la CI |
