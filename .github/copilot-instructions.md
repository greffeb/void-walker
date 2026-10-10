# Void Walker V2 — instructions pour Copilot

Jeu narratif d'horreur spatiale, PWA mobile, développé par des agents ; le porteur du projet décide du produit et valide sur téléphone.

## Avant toute chose

- Lire `00-lire-en-premier.md` (à la racine tant que le kit n'est pas déplacé dans `docs/` par le Bootstrap).
- Seules les décisions **Validé** de `03-decisions.md` font autorité. Une règle absente ne s'invente pas : la signaler et demander.
- Les contrats `contrats/C-01` à `C-10` et `10-architecture.md` décrivent ce que le code doit respecter.

## Règles de travail

- Une issue, une branche, une PR avec preuves. Workflow : `04-workflow-agentique.md`.
- Zones de fusion : `contrats/C-10-preuves-gouvernance.md` §6. Moteur, interface, équilibrage et format des scénarios attendent l'accord du porteur du projet.
- Jamais de validation humaine fabriquée : aucune case de partie sur téléphone cochée par un agent.
- Ne pas affaiblir un test pour le faire passer sans le dire dans la PR.
- Questions au porteur du projet : en langage courant, sans jargon ni numéros de décision.
- Textes du jeu en français, vouvoiement, écrits à la main (`contrats/C-07-textes.md`).
