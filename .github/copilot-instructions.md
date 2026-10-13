# Void Walker V2 — instructions pour Copilot

Jeu narratif d'horreur spatiale, PWA mobile, développé par des agents ; le porteur du projet décide du produit et valide sur téléphone.

## Avant toute chose

- Lire `docs/00-lire-en-premier.md`.
- Seules les décisions **Validé** de `docs/03-decisions.md` font autorité. Une règle absente ne s'invente pas : la signaler et demander.
- Les contrats `docs/contrats/C-01` à `C-10` et `docs/10-architecture.md` décrivent ce que le code doit respecter.

## Règles de travail

- Une issue, une branche, une PR avec preuves. Workflow : `docs/04-workflow-agentique.md`.
- Captures de PR : seulement ce qui a changé et sert à valider, désigné par une ligne `Captures : motif ; motif` dans le corps de la PR.
- Pour gérer une issue, suivre `.github/instructions/gestion-issues.instructions.md` dans la conversation principale ; ne pas lancer de sous-agent orchestrateur.
- Zones de fusion : `docs/contrats/C-10-preuves-gouvernance.md` §6. Moteur, interface, équilibrage et format des scénarios attendent l'accord du porteur du projet.
- Jamais de validation humaine fabriquée : aucune case de partie sur téléphone cochée par un agent.
- Ne pas affaiblir un test pour le faire passer sans le dire dans la PR.
- Questions au porteur du projet : en langage courant, sans jargon ni numéros de décision.
- Textes du jeu en français, vouvoiement, écrits à la main (`docs/contrats/C-07-textes.md`).
