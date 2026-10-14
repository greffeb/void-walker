# C-07 — Textes du jeu

> **Statut :** CONTRAT ACCEPTÉ v1.0 — D-117 ; assemble D-004, D-046, D-081, D-085/D-086, D-109 à D-116, C-01, C-05 et C-06 ; NP-01 à NP-05 acceptés par D-115.
> **Date :** 2026-10-10.
> **Implémentation et tests :** absents.

## 1. But

Dire ce que le texte affiché a le droit d'affirmer et comment il est écrit. Le texte raconte le jeu ; il ne le décide jamais.

## 2. Vérité du texte

- Le texte décrit uniquement ce qui a réellement été appliqué (C-05 §3). Changer un texte ne change aucun effet (C-05 E-10).
- Il ne révèle rien que le passager ne sait pas (C-06 §5) : ni position d'une créature non perçue, ni accès caché, ni effet secret.
- Un refus n'est pas raconté comme une tentative ; une tentative ratée dit ce qu'elle a coûté (C-01 §6).
- Le signal « plus aucune sortie » est exact et ne nomme jamais la sortie restante (D-085). Le récit de fin raconte les faits, sans score (D-086).
- Aucun texte n'est produit par un LLM (D-004).

## 3. Forme

| Règle | Décision |
| --- | --- |
| Français seulement au lancement | D-109 |
| Le joueur est vouvoyé : « Vous ouvrez la grille. » | D-110 |
| Deux à quatre phrases après une action ; plus long au réveil, au premier contact et à la fin | D-111 |
| Phrases écrites à la main ; le moteur ne remplit que des trous (noms) | D-112 |
| Quelques variantes par situation, sans effet sur le jeu | D-113 |
| Pas de chiffre de dé : le texte dit ce qui arrive ; le risque qualitatif est annoncé avant | D-114, D-020 |
| Assistance : ton froid et décalé, exacte sur les systèmes, seulement aux moments prévus | D-046, D-081 |

## 4. Règles acceptées (D-115, D-116)

- **NP-01 — Un événement, un texte.** Chaque événement visible appliqué a une phrase prévue ; aucune phrase sans événement. Un contrôle automatique repère les événements sans texte.
- **NP-02 — Trous sûrs.** Un trou ne reçoit qu'un nom public, jamais un identifiant interne. Chaque nom déclare son genre, son nombre et son élision (« l'atelier », « la grille »), pour des phrases correctes.
- **NP-03 — Variantes reproductibles.** Le choix d'une variante ne consomme pas les dés et reste identique quand on rejoue la même partie (C-09 S-03).
- **NP-04 — Un nom par chose.** Un objet ou une pièce porte le même nom dans les menus, la carte et le récit.
- **NP-05 — Pas de promesse.** Le texte n'annonce pas un effet non observé (« la créature est distraite ») ; il décrit ce que le passager voit ou entend.
- **Autonomie des agents (D-116).** Les textes sont en zone verte : les agents les écrivent et l'orchestrateur les fusionne après relecture indépendante. Les règles ci-dessus restent vérifiées automatiquement.

## 5. Exemples à prouver

| ID | Cas | Attendu |
| --- | --- | --- |
| N-01 | Remplacer toutes les variantes d'une phrase | Même état, mêmes options, même partie |
| N-02 | Événement appliqué sans phrase prévue | Contrôle automatique en échec |
| N-03 | Nom inconnu dans un trou | Contrôle en échec, aucun identifiant interne affiché |
| N-04 | Fuite exposée avec jet défavorable | Texte de blessure, aucun chiffre |
| N-05 | Rejouer un export | Mêmes variantes de texte |
| N-06 | Test sonore sans créature observée | Aucun « elle est distraite » |
| N-07 | Refus pour objet hors de portée | Raison publique, pas de récit d'effort |

## 6. Réserves

Textes définitifs, nom de la station, titre public, typographie et accessibilité de lecture restent à écrire ou maqueter. Les brouillons d'AR-01 §15 et d'AR-02 §10 ne sont pas des textes finaux.

Les documents à lire du lore léger (D-243) suivent le §2 : ils ne révèlent rien que le passager ne pourrait savoir et ne contredisent pas l'état réel. Leur forme (nombre, longueur, place, ce qu'ils peuvent révéler) se conçoit avant de les écrire ; la règle des deux à quatre phrases vise le récit d'une action, pas un document lu.
