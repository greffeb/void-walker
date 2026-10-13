# Void Walker V2 — architecture

> **Statut :** ARCHITECTURE ACCEPTÉE v1.0 — pile par D-122 à D-135, organisation AP-01 à AP-10 par D-136.
> **Date :** 2026-10-10.
> **Code :** aucun. Ce document guide l'issue de Bootstrap.

## 1. Choix acceptés

| Sujet | Choix | Décision |
| --- | --- | --- |
| Dépôt | `greffeb/void_walker`, ce kit en devient la documentation | D-122 |
| Langage, outils | TypeScript, Vite, PWA | D-123/D-133 |
| Écran | React | D-133 |
| Hébergement | GitHub Pages, une version de test par PR | D-124/D-131 |
| Service de rapports | Cloudflare Workers, déployé par les agents | D-127/D-134 |
| Validation | Signée par le téléphone du porteur du projet | D-130 |
| Agents | GitHub Copilot, éditeur ou terminal du PC | D-126/D-128 |
| Preuves en PR | Captures automatiques sur écran de téléphone simulé | D-135 |

## 2. Principes imposés par les contrats

- Un moteur sans écran, déterministe, partagé par l'appli, la CLI, les bots et le vérificateur (C-01 §2, C-08 GP-05).
- Une seule définition des actions pour menus et validation des commandes (C-01).
- L'observation publique est la seule sortie vers le joueur ; le vérificateur seul lit l'état complet (C-06).
- Replay exact : mêmes actions, mêmes tirages, même version → même état et même texte (C-09, C-07 NP-03).
- Les règles lisent des qualités déclarées, jamais un nom (C-02, D-078).
- Les textes sont des données écrites à la main, séparées du moteur (C-07).
- Pas de LLM, de compte, de serveur de jeu ni de suivi des joueurs.

## 3. Découpage (AP-01)

| Dossier | Rôle | Peut utiliser |
| --- | --- | --- |
| `engine/` | Règles C-01 à C-10 : état, actions, temps, dangers, risques, observation, sauvegarde, replay. Sans DOM, sans texte | Rien d'autre |
| `content/` | AR-01, AR-02, morceaux, qualités, textes français | Types du moteur |
| `app/` | PWA React : écran, carte, menus, sauvegarde, rapports, signature | `engine`, `content` |
| `cli/` | Même partie en ligne de commande, pour les agents et le playtester | `engine`, `content` |
| `tools/` | Vérificateur de stations, bots, rejoueur d'export, contrôles des textes, captures | `engine`, `content`, `app` pour les captures, `report-service` pour rejouer un rapport |
| `report-service/` | Worker Cloudflare : reçoit les rapports, crée issues et commentaires ; [déploiement](../report-service/README.md) | Rien d'autre : il ne connaît l'export que par sa forme |
| `docs/` | Ce kit | — |

Ces règles d'import sont vérifiées automatiquement ; une violation fait échouer la vérification.

## 4. Choix techniques acceptés

- **AP-02 — Hasard.** Un générateur à graine, propre à la partie, injecté dans le moteur ; chaque tirage est enregistré. Aucun appel au hasard global. Les variantes de texte se choisissent par un calcul fixe, sans ce générateur (C-07 NP-03).
- **AP-03 — Sauvegarde.** IndexedDB du navigateur ; une écriture par action, contenant l'état et le journal des actions ; « sauvegardé » affiché seulement après succès (C-09).
- **AP-04 — Signature.** Clé générée par l'API de chiffrement du navigateur (WebCrypto), privée et non exportable, conservée sur le téléphone. La clé publique est dans `docs/validation-key.json`, fichier surveillé par la CI (D-130).
- **AP-05 — Versions de test.** GitHub Pages publie la version principale à la racine et chaque PR dans `/pr-<numéro>/`, supprimé à la fermeture. Chaque version de test connaît son numéro de PR pour y envoyer les retours (D-132). La V1 publiait autrement ; le mode de publication du dépôt sera changé au Bootstrap.
- **AP-06 — Service de rapports.** Requêtes POST en HTTPS ; issue pour la version publique, commentaire de PR pour une version de test ; limites de nombre, de délai et de doublons ; clé GitHub limitée aux issues et commentaires de ce dépôt. Déploiement et secrets : [report-service/README.md](../report-service/README.md).
- **AP-07 — Reconnaissance d'une validation.** Une action GitHub, déclenchée par un commentaire de validation, vérifie la signature avec la clé publique du dépôt et pose l'étiquette. Le service ne décide jamais d'une validation.
- **AP-08 — Vérification complète.** Une commande unique : contrôle du code, types, tests unitaires, parcours témoins d'AR-01 et AR-02 rejoués par le moteur, vérificateur de stations, contrôles des textes, build. La même en local et en CI.
- **AP-09 — Captures.** Un navigateur automatisé joue les parcours témoins sur un écran de téléphone simulé ; captures et texte affiché sont joints à la PR (D-135).
- **AP-10 — CI.** Sur chaque PR : vérification complète, captures, publication de la version de test. Sur la branche principale : publication du jeu. Le service de rapports est déployé par les agents depuis le PC (D-127).

## 5. Hors architecture

Nom de la station, direction visuelle, sons et icônes relèvent de la maquette. Le choix précis des bibliothèques secondaires appartient aux agents, dans le respect des règles ci-dessus.
