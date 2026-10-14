# Verifieur de stations L1 (#151) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prouver une evacuation sans de ni blessure dans les six mondes existants, rejouer chaque temoin trouve et mesurer une exploration exhaustive avec les des.

**Architecture:** Recherche en largeur par `observer` et `jouer`, dedoublonnage par les seules donnees lues par les regles, plafond bloquant. Les chemins surs sont convertis en `Parcours` puis controles par `executerParcours`. Le mode de mesure enumere les issues de chaque tirage, sans remplacer les regles.

**Tech Stack:** TypeScript, Vitest, CLI tsx ; aucune dependance supplementaire.

**Spec:** Issue #151 ; docs/13-morceaux-lancement.md sections 7.1 et 7.3 ; C-08 sections 3 et 6.

## Global Constraints

- Pas d'assemblage ni de changement de l'appli ou des scenarios.
- Exception au perimetre initial autorisee explicitement par le porteur : petit acces aux des dans le moteur, sans changer les regles ; attendre son accord avant fusion.
- Un plafond atteint donne un resultat non prouve, jamais une absence de sortie.
- Le repit de premier contact reste permis ; tout de ou blessure exclut une transition sure.
- Aucune preuve automatique ne vaut une validation sur telephone.

## Review Focus

- Cle trop reduite : conserver toute donnee qui modifie les menus ou les consequences, en particulier les decouvertes et le repit.
- Des : enumerer toutes les faces, pas seulement deux graines ou les issues favorables.
- Blessures : ne pas accepter un parcours blesse puis soigne.
- Plafond : ne jamais confondre exploration incomplete et absence de solution.
- Temoin : utiliser les noms et parametres publics, controler l'export rejoue, pas seulement l'etat trouve par la recherche.

### Task 1: Acces controle aux des

**Files:** engine/des.ts, engine/des.test.ts, engine/partie.ts ; test dans engine/partie.test.ts si necessaire.

**Interface:** argument optionnel `Des` dans `ouvrirDes` et `jouer`, comportement ordinaire inchange ; chaque resultat impose est valide et journalise.

- [x] Ajouter les tests : les six faces imposees sont journalisees ; une face invalide est refusee ; sans argument le hasard et son rejeu restent identiques.
- [x] Executer les tests pour constater l'echec, puis implementer l'argument optionnel sans changement de regle.
- [x] Relancer les tests cibles.

### Task 2: Recherche sure, plafond et temoin rejouable

**Files:** tools/verifier-station.ts, tools/verifier-station.test.ts ; content/types.ts et tools/rejouer-parcours.ts pour des identifiants publics facultatifs de cible et parametre, sans affaiblir les controles existants.

**Interfaces:** `verifierStation(entree, options?)` produit verdict, etats, temps, diagnostic et parcours eventuel ; `cleEtatRegles(etat)` fournit la cle de dedoublonnage.

- [x] Tester avant implementation une petite station, une station sans issue, le plafond, les des et blessures refuses, et le premier contact permis.
- [x] Implementer la largeur, les parents du chemin et sa conversion en `Parcours` ; liberer les etats deja developpes et ne pas garder un journal complet par noeud.
- [x] Tester la cle contre les donnees de presentation ignorees et les donnees de regles conservees.
- [x] Prouver AR-01, AR-02, m-07 a m-10 et rejouer chaque temoin sans de et indemne.
- [x] Rejeter m-08 sans planche et AR-01 sans eau ni caisse ; accepter AR-01 sans eau seule.
- [x] Relecture : reproduire puis corriger la confusion entre deux portes homonymes sans signaletique ; conserver l'identite publique exacte dans le temoin.

### Task 3: Mesures exhaustives et verification du depot

**Files:** tools/verifier-station.ts, tools/verifier-station.test.ts, tools/verify.ts, package.json, docs/13-morceaux-lancement.md, docs/00-lire-en-premier.md.

**Interface:** `mesurerStation(entree, options?)` explore toutes les issues des des, rapporte si l'exploration est complete et ne produit aucune preuve sure a partir d'un chemin au de.

- [x] Tester un cas dont seule une issue favorable permet de sortir et un cas a plusieurs tirages ; implementer l'enumeration par l'acces de Task 1.
- [x] Mesurer les six mondes et les deux copies cassees ; inscrire etats, temps, plafonds et methode retenue pour L6 en 13 section 7.3.
- [x] Ajouter `check:stations` a `npm run verify`, avec un budget raisonnable et des plafonds explicites.
- [x] Executer `npm run verify` : neuf etapes vertes, puis relecture finale sans blocage ; 110 tests cibles et 13 anciens temoins controles independamment.

**Livraison :** branche `tools/151-verifieur-stations`, PR avec les tableaux et limites de docs/13 section 7.3 ; pas de fusion sans accord du porteur. Pas de playtest ajoute : aucun comportement normal ni texte du jeu n'est modifie.