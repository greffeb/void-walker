# Bootstrap — issue de démarrage du dépôt V2

> **Statut :** TEXTE DE L'ISSUE DE DÉMARRAGE — publié comme [issue #89](https://github.com/greffeb/void-walker/issues/89) (D-138). Exécution seulement sur lancement explicite du porteur du projet.
> **Date :** 2026-10-10.

Le texte ci-dessous est celui de l'issue. Il s'appuie sur [l'architecture](10-architecture.md), le [workflow](04-workflow-agentique.md) et les contrats acceptés.

---

## Objectif

Poser le socle du dépôt V2 : organisation du code, commande unique de vérification, CI, publication et versions de test, sur un minuscule monde de test réellement jouable. Aucun gameplay d'AR-01 ou d'AR-02 dans cette issue.

## Décisions qui l'autorisent

D-002, D-122 à D-137 ; architecture AP-01 à AP-10 (D-136) ; zones de fusion (C-10 §6).

## Périmètre

1. **Kit dans `docs/`.** Déplacer les documents du kit dans `docs/` et corriger tous les liens, y compris `.github/copilot-instructions.md` et les profils d'agents.
2. **Organisation du code (AP-01).** `engine/`, `content/`, `app/`, `cli/`, `tools/`, avec TypeScript strict. Règles d'import vérifiées automatiquement : `engine` n'importe rien d'autre.
3. **Monde de test minuscule.** Deux pièces, une porte, un objet portable, défini dans `content/`. Actions : regarder, prendre, poser, ouvrir, fermer, aller. Une seule définition d'actions pour menus et validation (C-01).
4. **Moteur minimal.** État, commandes structurées, refus sans coût, observation publique (C-06), générateur de dés à graine enregistré (AP-02), journal d'actions et replay exact (C-09).
5. **CLI.** Jouer le monde de test et exporter la partie.
6. **Appli PWA React.** Afficher l'observation et les actions du monde de test ; sauvegarde IndexedDB après chaque action (AP-03) ; installable.
7. **Commande unique de vérification (AP-08).** Contrôle du code, types, tests, règles d'import, replay du parcours de test, build. Identique en local et en CI.
8. **CI GitHub Actions (AP-10).** Sur chaque PR : vérification complète, captures sur écran de téléphone simulé du parcours de test (AP-09), publication dans `/pr-<numéro>/` (AP-05) avec lien posté dans la PR. Sur la branche principale : publication à la racine. Changer le mode de publication GitHub Pages si nécessaire.

## Hors périmètre

Contenu d'AR-01/AR-02, créature, dangers, service de rapports (Cloudflare), signature des validations, carte. Chacun aura son issue.

## Critères d'acceptation

- [ ] Le kit est dans `docs/`, aucun lien cassé.
- [ ] Une violation des règles d'import fait échouer la vérification.
- [ ] Le parcours du monde de test (prendre l'objet, ouvrir, passer, poser) passe dans la CLI et dans l'appli.
- [ ] Une commande refusée ne change ni l'état ni le compteur d'actions.
- [ ] Rejouer l'export de la CLI redonne le même état final.
- [ ] Fermer puis rouvrir l'appli reprend la partie au dernier geste.
- [ ] La vérification complète est la même commande en local et en CI.
- [ ] Une PR de démonstration volontairement cassée est bloquée par la CI, puis retirée.
- [ ] Une PR affiche ses captures et le lien de sa version de test ; la version principale est publiée sur GitHub Pages.
- [ ] Aucune validation humaine n'est revendiquée.

## Zone et fusion

Mixte : outillage et docs (vert), moteur et interface (orange), publication (rouge). Fusion après accord du porteur du projet.

## Preuves attendues dans la PR

Sorties de la vérification complète, lien de la PR cassée bloquée, captures, lien de la version de test, export de partie rejoué.
