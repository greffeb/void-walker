# C-09 — Sauvegarde, reprise, replay et export

> **Statut :** CONTRAT ACCEPTÉ v1.0 — D-102 ; assemble D-013, D-022, D-087 à D-092, D-103 et C-05 §7 ; SP-01, SP-02, SP-04, SP-05 acceptés par D-101 ; SP-03 non retenu (D-103).
> **Date :** 2026-10-10.
> **Implémentation et tests :** absents.

## 1. But

Une partie se reprend exactement là où elle était, se rejoue à l'identique à partir de son export, et ne permet jamais de revenir annuler une décision.

## 2. Partie en cours

Une seule partie en cours (D-089), enregistrée après chaque action engagée (D-022). Lire, consulter et fermer l'application ne changent rien.

- **SP-01 — Contenu enregistré :** version du jeu, identifiant de la station et de son état de départ, liste des actions engagées avec leurs tirages, état courant et connaissances du passager (C-06 §6).
- **SP-02 — Une action, une écriture :** l'état et le résultat d'une action sont enregistrés ensemble ; une action n'est jamais appliquée deux fois.

## 3. Échec d'enregistrement

Le jeu prévient et laisse continuer (D-091). Il n'annonce jamais « sauvegardé » sans écriture réussie, garde l'avertissement visible et retente l'écriture à chaque action. Une action déjà résolue n'est pas relancée avec un nouveau tirage.

## 4. Mise à jour du jeu

La partie reprend si la nouvelle version le permet ; sinon, le jeu le dit et propose une nouvelle partie (D-090). L'ancienne partie est perdue, sans export ni rapport automatique (D-103).

## 5. Replay et export

- Rejouer les actions enregistrées depuis l'état de départ, avec les mêmes tirages, sur la même version, redonne le même état et le même récit (C-05 E-08).
- L'export est un fichier qui rejoue toute la partie (D-092).
- **SP-04 — Contenu de l'export :** version, station et état de départ, actions et tirages, observation publique de la dernière action, commentaire éventuel. Rien qui identifie le joueur.
- **SP-05 —** L'export d'une partie en cours ne la modifie pas et ne la termine pas.

## 6. Rejouer une station

Nouvelle partie, même état de départ, nouveaux tirages (D-087/D-088). Distinct du replay, qui reproduit les tirages d'origine.

## 7. Exemples à prouver

| ID | Cas | Attendu |
| --- | --- | --- |
| S-01 | Fermer l'application au milieu d'une partie, puis rouvrir | Même état, même carte, aucun nouveau tirage |
| S-02 | Écriture refusée par le stockage | Avertissement visible, jeu possible, pas de « sauvegardé » |
| S-03 | Rejouer un export sur la même version | État final et récit identiques |
| S-04 | Partie incompatible après mise à jour | Message et nouvelle partie proposée |
| S-05 | Défaite puis réouverture | Écran de fin, pas de reprise avant la défaite |
| S-06 | Export en cours de partie | Partie inchangée |

## 8. Réserves

Format du fichier, technique de stockage du navigateur, compression et critère de compatibilité relèvent de l'architecture. Aucun anti-triche n'est demandé (D-022).
