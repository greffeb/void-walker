# C-10 — Preuves, rapports et gouvernance

> **Statut :** CONTRAT ACCEPTÉ v1.0 — D-102 ; assemble D-001, D-010, D-092 à D-101, D-104 à D-108 et le [workflow agentique](../04-workflow-agentique.md) ; RP-01 à RP-05 acceptés par D-101.
> **Date :** 2026-10-10.
> **Implémentation et tests :** absents.

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
- Le jeu envoie le rapport à un service intermédiaire, qui crée une issue GitHub avec sa propre clé ; aucun compte n'est demandé (D-093/D-094).
- **RP-01 — Issue de bug :** version, partie exportée (C-09) jusqu'à l'action signalée, observation publique de cette action, commentaire. De quoi rejouer la situation exactement.
- **RP-02 — Issue d'envoi de partie :** partie exportée complète, fin obtenue, commentaire, et l'état de la case « je valide ».
- **RP-03 — Anti-abus :** limites de nombre, de délai et de doublons appliquées par le service, en plus du jeu ; un rapport non envoyé est gardé pour un nouvel essai (comme en V1).

## 4. Validation sur téléphone

**Ce que c'est.** Le porteur du projet a joué lui-même sur téléphone, avec une version précise du jeu, et confirme que l'aventure tient : elle fonctionne, se comprend et l'intéresse.

- **Ce qu'on valide (D-098) :** AR-01, AR-02, et chaque morceau du lancement au moins une fois dans une station assemblée. Une partie peut couvrir plusieurs morceaux.
- **Ce qu'il faut avoir fait (D-099) :** aller au bout, victoire ou défaite ; puis juger. Un abandon ne valide pas.
- **Durée (D-100) :** modifier l'aventure ou le morceau, ou changer le résultat d'un de ses parcours automatiques, annule la validation. Une correction du moteur sans effet sur ces résultats la conserve. La détection est automatique.

Une partie envoyée vaut validation seulement si la case « je valide » est cochée (D-096) et si le code personnel saisi est vérifié par le service (D-097).

- **RP-04 —** Le service marque alors l'issue d'une étiquette de validation que seul lui peut poser ; l'issue cite la version, l'aventure ou les morceaux couverts. Une case cochée sans code valide reste un simple retour.
- **RP-05 —** Le journal des parties humaines référence ces issues ; il n'est jamais rempli sans elles.

## 5. Sécurité imposée

- Clé GitHub et code personnel uniquement côté service, jamais dans le jeu, le dépôt, une issue ou une adresse web.
- Envoi en HTTPS, données dans le corps de la requête.
- Aucune donnée personnelle au-delà du commentaire saisi.
- Les agents n'ont accès ni au code personnel ni aux secrets du service.

## 6. Gouvernance du dépôt

| Zone | Contenu | Fusion |
| --- | --- | --- |
| Verte | Tests, outils, solveur, documentation — y compris un test, seuil ou contrat modifié (D-104) | Orchestrateur, après vérifications vertes et relecture par un autre agent (D-105) |
| Orange | Textes, interface, équilibrage, format des scénarios ; moteur de jeu tant qu'il est jeune (D-107) | Porteur du projet, sur preuves |
| Rouge | Déploiement, format de sauvegarde, IA | Porteur du projet, avec test manuel |

- **Branche principale :** pas de protection technique (D-106). La règle de travail demeure : un exécutant délégué ne pousse pas, l'orchestrateur fusionne après vérification.
- **Rôles :** un auteur de contenu et un auteur d'outils remplacent `script-writer` (D-108).
- **Validation humaine :** jamais par un agent, quelle que soit la zone (§4).

Restent ouverts : la zone d'une demande de fusion qui touche plusieurs zones, le moment où le moteur passe en zone verte, le budget et les reprises des agents.

## 7. Exemples à prouver

| ID | Cas | Attendu |
| --- | --- | --- |
| PR-01 | Bouton « bug » sans réseau | Rapport gardé, renvoyé plus tard, aucune perte de partie |
| PR-02 | Issue de bug rejouée par un agent | Même situation reproduite |
| PR-03 | « Je valide » coché, code faux | Issue créée sans étiquette de validation |
| PR-04 | « Je valide » coché, bon code | Étiquette de validation posée par le service |
| PR-05 | Recherche du code ou de la clé dans le build du jeu | Introuvable |
| PR-06 | Rafale de rapports identiques | Bloquée par le service |
| PR-07 | Morceau validé puis modifié | Validation retirée automatiquement, morceau à rejouer |
| PR-08 | Correction du moteur sans changement des parcours d'une aventure | Validation conservée |
