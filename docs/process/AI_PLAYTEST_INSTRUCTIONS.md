# Instructions de playtest IA — Void Walker

> **Statut :** MÉTHODOLOGIE ACTIVE — à suivre pour ce type de travail.
>
> **Où on en est :** [`docs/STATUS.md`](../STATUS.md) est la source unique de vérité.

Ce document explique comment une IA (Claude Code ou équivalent) doit conduire
un playtest interactif de Void Walker en jouant elle-même, tour par tour.

---

## Principe général

L'IA joue le jeu comme un vrai joueur : elle lit la narration, raisonne sur
la situation, choisit une action, l'envoie au moteur, lit le résultat, et
recommence. Elle documente chaque étape dans un rapport Markdown.

Le script de jeu est `scripts/ai-playtest.ts`. Il maintient l'état de la
partie entre les appels dans `scripts/.ai-playtest-state.json`. Chaque
commande est un appel CLI indépendant.

---

## Démarrage d'une partie

```bash
npx tsx scripts/ai-playtest.ts new-game \
  --seed=<N> \
  --class=<marine|engineer|medic> \
  --difficulty=<explorer|survivor|nightmare>
```

Choisir seed, classe et difficulté de façon délibérée (pas au hasard) :
- **seed** : un entier quelconque — le noter dans le rapport
- **class** : choisir en fonction de l'angle de jeu voulu (marine = combat,
  engineer = technique, medic = soin/exploration)
- **difficulty** : `explorer` pour observer le moteur, `survivor` pour un
  vrai challenge, `nightmare` pour tester les limites

---

## Envoyer une commande

```bash
npx tsx scripts/ai-playtest.ts --cmd "<commande en français>"
```

Exemples valides :
```bash
npx tsx scripts/ai-playtest.ts --cmd "prendre trousse"
npx tsx scripts/ai-playtest.ts --cmd "examiner balise"
npx tsx scripts/ai-playtest.ts --cmd "réparer balise avec pièces"
npx tsx scripts/ai-playtest.ts --cmd "aller salle maintenance"
npx tsx scripts/ai-playtest.ts --cmd "forcer casier"
```

Les commandes sont en **français naturel**. Le moteur parse le verbe, la
cible, et l'outil optionnel. Pas besoin de syntaxe exacte.

---

## Processus de décision à chaque tour

À chaque tour, l'IA doit suivre ce processus en trois temps :

### 1. Lire la scène

Identifier ce qui est disponible :
- **Objets visibles** (`Vous remarquez :`) → à prendre si utiles
- **Environnement** (`L'environnement :`) → à examiner, activer, forcer,
  réparer selon le contexte
- **Sorties** avec leur statut `[inexplore]` / `[exploré]`
- **Narration** → indices sur la tension, les dangers, les obstacles

### 2. Raisonner comme un joueur

Se poser les bonnes questions :
- Quelle est ma situation immédiate ? (HP, O₂, conditions, combat actif ?)
- Quel est mon objectif du moment ? (survivre / explorer / résoudre un obstacle)
- Qu'est-ce que je ne comprends pas encore ? (examiner avant d'agir)
- Quel risque est acceptable maintenant ?

Principes de jeu à respecter :
- Sécuriser les ressources vitales en premier (soins, lumière, oxygène)
- Examiner avant d'agir en aveugle sur un élément inconnu
- Ne pas rester bloqué : si une action échoue, essayer une variante ou passer à autre chose
- Explorer les sorties non visitées progressivement
- Utiliser la classe choisie de façon cohérente (medic répare et soigne,
  marine force et combat, engineer hack et démonte)

### 3. Formuler la commande

Écrire la commande en français naturel, du plus simple au plus élaboré :
- Action simple : `prendre objet`
- Action sur l'environnement : `examiner terminal`, `activer panneau`
- Action avec outil : `réparer balise avec pièces`, `ouvrir casier avec badge`
- Déplacement : `aller [nom de la salle]`

---

## Format du rapport de playtest

Le rapport suit ce modèle exact, un bloc par tour :

```markdown
# AI Playtest Detailed Log N

Date: YYYY-MM-DD
Seed: <N>
Class: <classe>
Difficulty: <difficulté>

---

## Tour 0
Décision: Démarrage d'une nouvelle partie.
Commande: new-game --seed=<N> --class=<classe> --difficulty=<difficulté>

Sortie:
<copier-coller exact de la sortie du script>

---

## Tour 1
Réflexion: <raisonnement du joueur-IA — 2 à 5 phrases expliquant pourquoi
cette action plutôt qu'une autre>
Décision: <une phrase résumant le choix>
Commande: <commande envoyée>

Sortie:
<copier-coller exact de la sortie du script>

---

## Tour N
...

---

## Bilan

**Situation finale :** <état du joueur et de la partie>

**Observations moteur :**
- <bug ou comportement inattendu observé>
- <formulation qui n'a pas été parsée correctement>
- <répétition de narration suspecte>
- <incohérence entre état affiché et état réel>

**Prochain tour suggéré :** <ce que ferait le joueur-IA au tour suivant>
```

---

## Ce qu'il faut observer et signaler

L'IA ne joue pas uniquement pour gagner — elle joue aussi pour **tester le
moteur**. À chaque tour, elle doit noter :

### Problèmes de parsing
- La commande a-t-elle été comprise ? (vérifier le verbe résolu en sortie)
- Une formulation naturelle a-t-elle échoué alors qu'elle aurait dû marcher ?
- Le moteur a-t-il proposé une reformulation ? Était-elle pertinente ?

### Problèmes d'état affiché
- Un objet récupéré disparaît-il correctement de la scène ?
- Un obstacle résolu change-t-il son label dans `L'environnement :` ?
- Les sorties passent-elles correctement de `[inexplore]` à `[exploré]` ?

### Problèmes de narration
- La même phrase apparaît-elle deux fois en peu de tours ?
- La narration contient-elle des caractères mal encodés (ex : `├Ç` au lieu de `À`) ?
- Le ton est-il cohérent avec la tension de la scène ?

### Problèmes de cohérence logique
- Une action réussit-elle alors qu'elle ne devrait pas (ex : réparer sans outil) ?
- Une action échoue-t-elle alors qu'elle devrait réussir (ex : prendre un objet accessible) ?
- Le moteur répond-il `résolution` là où le résultat devrait être automatique ?

### Softlock potentiel
- L'IA se retrouve-t-elle sans action possible pendant plusieurs tours ?
- Une seule sortie est-elle bloquée par un obstacle infranchissable sans outil introuvable ?

---

## Règles de bonne conduite du playtest

1. **Jouer honnêtement** — ne pas chercher à exploiter des bugs intentionnellement,
   jouer comme un vrai joueur qui veut progresser

2. **Une action par tour** — ne pas enchaîner plusieurs `--cmd` sans documenter
   chacun dans le rapport

3. **Documenter même les échecs** — un échec (`résolution` avec jet raté) est aussi
   informatif qu'un succès

4. **Ne pas relancer la partie** si bloqué — noter le softlock et continuer d'essayer
   des alternatives (c'est un test de robustesse)

5. **Copier-coller la sortie exacte** — ne pas paraphraser la sortie du moteur, la
   copier telle quelle avec les éventuels artefacts d'encodage

6. **Nommer le fichier** `scripts/playtest-detailed-N.md` où N est le numéro
   séquentiel suivant

---

## Exemples de bonnes décisions commentées

```
Réflexion: La scène montre un casier verrouillé. Je ne sais pas ce qu'il
contient. J'essaie d'abord d'ouvrir normalement — si ça résiste, je forcerai.
Tenter la force en premier serait gaspiller de l'énergie inutilement.
Décision: J'essaie d'ouvrir le casier avant de le forcer.
Commande: ouvrir casier
```

```
Réflexion: Le terminal semble lié à l'obstacle principal. En tant qu'ingénieur
(INT élevé), je devrais avoir l'avantage ici. Avant d'agir, j'examine pour
comprendre ce que le terminal contrôle — éviter une mauvaise manipulation.
Décision: J'examine le terminal de contrôle.
Commande: examiner terminal
```

```
Réflexion: Deux sorties disponibles. L'une mène à une salle déjà visitée
(exploré), l'autre est inconnue (inexplore). Je n'ai aucune raison de revenir
en arrière maintenant — j'avance vers l'inconnu.
Décision: J'explore la sortie non visitée.
Commande: aller [nom de la sortie inexploree]
```

---

## Référence rapide des commandes utiles

| Intention | Commandes à essayer |
|-----------|---------------------|
| Prendre un objet | `prendre <objet>`, `ramasser <objet>` |
| Examiner | `examiner <cible>`, `inspecter <cible>`, `regarder <cible>` |
| Ouvrir | `ouvrir <cible>`, `forcer <cible>` |
| Activer | `activer <cible>`, `utiliser <cible>`, `déclencher <cible>` |
| Réparer | `réparer <cible>`, `réparer <cible> avec <outil>` |
| Se soigner | `utiliser trousse`, `soigner`, `se soigner` |
| Se déplacer | `aller <salle>`, `avancer vers <salle>` |
| Attaquer | `frapper <ennemi>`, `tirer sur <ennemi>`, `attaquer <ennemi>` |
| Parler | `parler à <pnj>`, `interroger <pnj>` |
| Chercher | `fouiller <zone>`, `chercher dans <zone>` |
