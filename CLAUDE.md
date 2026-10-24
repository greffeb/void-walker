# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Void Walker : jeu narratif d'horreur spatiale, PWA mobile (TypeScript, React, Vite), développé par des agents. Le porteur du projet décide du produit et valide en jouant sur téléphone. Tout le dépôt (code, identifiants, commentaires, docs, textes du jeu) est en français.

## Avant de travailler

- Lire `docs/00-lire-en-premier.md` (point de reprise, ordre de lecture). Pour une issue : `.github/instructions/gestion-issues.instructions.md`, puis `docs/04-workflow-agentique.md`.
- Seules les décisions **Validé** de `docs/03-decisions.md` font autorité (chercher par l'index, ne pas tout charger). Une règle absente ne s'invente pas : la signaler et demander. Un changement de comportement cite la décision qui l'autorise.
- Les contrats `docs/contrats/C-01` à `C-10` et `docs/10-architecture.md` décrivent ce que le code doit respecter.
- Ajouter un morceau de station : suivre `docs/17-ajouter-un-morceau.md` (tout ce qu'il touche, dans l'ordre, avec les pièges connus).
- `docs/08`, `09` et `17-univers.md` contiennent les secrets et solutions : ne jamais les donner au rôle `playtester`.

## Commandes

Node ≥ 22.13 (`engines` du `package.json`).

```bash
npm run verify              # vérification complète (lint, typecheck, check:imports, check:links, check:texts, check:stations, check:sortie, test, parcours, build), s'arrête au premier échec
npm run verify:complet      # facultatif, hors CI : sans cache, catalogue prouvé deux fois, 1 000 plans par chemin
npm run verify -- --sauf=check:stations,check:sortie   # sauter des étapes
npx vitest run engine/creature.test.ts                  # un seul fichier de test
npx vitest run engine/creature.test.ts -t "fragment du nom"
npx vite                    # serveur de dev (racine app/) ; ?monde=<id> ou ?station=<id> choisit le monde
npm run cli -- aide         # la même partie en ligne de commande (nouvelle, voir, jouer <n>, apercu <n>, carte…)
npm run cli -- --station m07-m03-soute nouvelle --graine 1
npm run captures            # captures Playwright des étapes (celles désignées par `Captures :` en PR)
```

- `check:stations` et `check:texts` gardent leurs verdicts dans `.cache/verifs/` tant que l'empreinte du code importé ne change pas ; `--sans-cache` les ignore. Ils acceptent `--processus=<n>` et `--lot=k/n`.
- `tools/verify.ts` liste les étapes ; la CI (`.github/workflows/verification.yml`) lance les mêmes en jobs parallèles, et `tools/verify.test.ts` vérifie qu'aucune n'est oubliée. Une nouvelle étape s'ajoute aux deux.
- Le service de rapports (`report-service/`, Worker Cloudflare) se déploie depuis le PC : `report-service/README.md`. Ne pas déployer sans accord.

## Architecture

Découpage imposé et vérifié par `check:imports` (`tools/check-imports.ts`) :

| Dossier | Rôle | Peut importer |
| --- | --- | --- |
| `engine/` | Règles : état, actions, temps, dangers, risques, observation, sauvegarde, replay. Sans DOM ni texte | `engine/` seul, aucun paquet npm |
| `content/` | Mondes fixes (AR-01, AR-02, monde-test), morceaux de station (`morceaux/`), assemblage et catalogue (`stations/`, `catalogue/`), textes français | `content/` et les **types** de `engine/` |
| `app/` | PWA React : écrans, carte (`carte/`), son (`son/`), sauvegarde IndexedDB, rapports, signature | `app/`, `engine/`, `content/`, paquets npm |
| `cli/` | Partie en ligne de commande pour agents et playtester | `engine/`, `content/`, Node |
| `tools/` | Vérificateur de stations, bots, mesures, rejoueurs, contrôles de textes, captures Playwright | tout sauf l'inverse |
| `report-service/` | Worker : reçoit les rapports et crée issues / commentaires de PR | lui-même seul |

Principes qui traversent plusieurs fichiers :

- **Moteur déterministe partagé** par l'appli, la CLI, les bots et le vérificateur. Le hasard passe par un générateur à graine propre à la partie, chaque tirage est enregistré ; jamais de `Math.random`. Replay exact : mêmes actions + même version → même état et même texte. Les variantes de texte se choisissent par calcul fixe, pas par le générateur.
- **Une seule définition des actions** sert aux menus et à la validation des commandes. Lire, regarder, un aperçu ou une action refusée ne coûtent rien ; seules les actions engagées avancent le monde et sont sauvegardées.
- **L'observation publique** (`engine/observation.ts`) est la seule sortie vers le joueur ; seul le vérificateur lit l'état complet.
- **Les règles lisent des qualités déclarées**, jamais le nom d'un objet ou d'une pièce.
- **Textes = données** écrites à la main dans `content/`, séparées du moteur (`docs/contrats/C-07-textes.md`) : français, vouvoiement, courts, aucun chiffre de dé affiché. Libellés de l'interface dans `app/libelles/fr.ts` uniquement : `tools/phrases-en-dur.test.ts` refuse une phrase écrite en dur ailleurs dans `app/`.
- **Stations** : assemblées depuis des morceaux écrits à la main ; chaque composition est prouvée par `check:stations` (toujours un chemin sûr au départ, 100 plans par chemin). Les grandes stations publiées sont figées (`publier:grandes`, `VERSION_GENERATEUR`) ; un changement du générateur change le catalogue. `publier:grandes` dure plus d'une heure : le lancer en arrière-plan.

## Règles de travail

- Une issue, une branche, une PR avec preuves. Corps de PR : une ligne `Captures : motif ; motif` (fragments de titres d'étapes, seulement ce qui change) et une ligne `Tester : id ; id` (ex. `m-12 ; m12-m03-stockage`) pour les liens de la version de test publiée dans `/pr-<n>/`.
- Zones de fusion (`docs/contrats/C-10-preuves-gouvernance.md` §6) : tests, outils, docs et textes sont verts ; moteur, interface, équilibrage et format des scénarios attendent l'accord du porteur.
- Jamais de validation humaine fabriquée : aucune partie sur téléphone déclarée ni cochée par un agent. « Vérifié automatiquement » n'est pas une validation.
- Ne pas affaiblir un test ni un seuil sans le dire dans la PR.
- Deux échecs sur le même blocage : s'arrêter, décrire les tentatives, demander.
- Questions au porteur du projet : en langage courant, sans jargon ni numéros de décision.
- Après un résultat, mettre à jour les documents de reprise touchés (`docs/00-lire-en-premier.md`, décisions, roadmap).
