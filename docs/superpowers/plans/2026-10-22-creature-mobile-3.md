# Créature mobile, lot 3 : le capteur — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dans les grandes stations, un capteur de mouvement trouvé comme butin (au plus un par station). On le pose pour de bon dans la pièce où l'on est. La carte montre son état dans sa pièce (calme, mouvement, brouillé, panne), un « ! » sur CARTE signale chaque changement, et le récit bipe. La créature peut le détruire, et il peut tomber en panne.

**Architecture:** le capteur posé est un emplacement d'objet nouveau (`{ type: 'capteur', piece, hs? }`), hors de la pièce et hors de l'inventaire : on ne le reprend pas. Son état affiché se calcule à chaque lecture (panne, pièce aveugle, présence de la créature) par un module pur `engine/capteur.ts`. `jouer` compare l'état avant et après le pas pour raconter un changement. La panne et la destruction sont un tirage « hors dés », haché sur la graine et le numéro d'action comme le dé de rencontre. Rien n'entre au journal. La preuve des stations se fait sans butin (`sansButin`) et sans dé (`sansErrance`) : le capteur n'y joue pas. La carte publique porte l'état du capteur sur sa pièce ; l'appli dessine l'icône et le « ! ».

**Tech Stack:** TypeScript 6, Vitest 4, tsx ; moteur pur dans `engine/`, textes en couches dans `content/textes/`, appli React dans `app/`, sons dans `app/son/`.

**Spec:** [docs/superpowers/specs/2026-10-21-creature-mobile-design.md](../specs/2026-10-21-creature-mobile-design.md) (§4.2, et §4.6 pour le drone reporté). Maquettes : [capteur.html](../../maquette/capteur.html) (variantes A à D, écartées) et [capteur-carte.html](../../maquette/capteur-carte.html) (variante E, retenue).

## Ce que le porteur a tranché (2026-10-22, sur maquettes)

- **Le drone éclaireur est reporté.** Ce lot ne livre que le capteur.
- **Usage visé :** poser le capteur dans un cul-de-sac, laisser la porte ouverte, revenir fermer quand il dit qu'elle y est.
- **Au plus un capteur par station**, une ligne de la table de butin.
- **Posé dans la pièce où l'on est, pour de bon** : on ne le ramasse pas.
- **Affichage sur la carte (variante E)** : une icône losange dans sa pièce, avec quatre états :
  - calme : contour et point verts ;
  - mouvement : rouge plein, avec des ondes ;
  - brouillé : contour en pointillés, sans point ni vague ;
  - panne : barré.
- **« ! » sur le bouton CARTE à chaque changement d'état**, éteint quand on ouvre la carte. Pas de « ! » à la pose. Le bandeau (variante B) et les carrés près de BLESSÉ (variante D) sont écartés.
- **Le récit bipe** une fois à chaque changement.
- **Une panne s'annonce** et reste jusqu'à la fin.
- **La créature peut détruire le capteur.** Une destruction s'affiche comme une panne.
- **Pièce aveugle** (machines en marche, chambre froide) : on peut y poser le capteur, mais il est brouillé tant que la pièce l'est. Il revient quand les machines s'arrêtent.

## Choix de l'agent dans ce plan (à signaler au porteur)

- **Pas d'action nouvelle.** POSER, appliqué au capteur, le fixe pour de bon. L'aperçu reste « Le capteur restera dans la remise » : rien de plus, pour ne pas tenir la main.
- **Un seul capteur par monde**, vérifié à la validation du monde. Le moteur ne gère qu'un capteur.
- **La pièce du capteur est la pièce dessinée.** Posé dans une sous-position (cabine de capsule), il s'attache à la pièce qui l'ouvre, comme le passager sur la carte.
- **Présence, comme pour l'écoute (D-344)** : la créature compte dans l'alcôve ; inerte, elle ne compte pas. Le capteur ne détecte qu'elle, jamais le passager.
- **Panne et destruction : un seul tirage par action**, haché sur `capteur:<graine>:<action>`, seulement dans un monde à `rencontre`, et seulement pour un capteur ni en panne ni détruit.
  - Destruction : chance de **1/8** à chaque action où la créature, hors traque (`contact !== true`), était dans la pièce du capteur avant le pas et y est encore après.
  - Panne : sinon, chance de **1/300** par action. Soit environ 18 % sur 60 actions.
  - Ce sont des seuils à mesurer, montrés au porteur. Le réglage de difficulté (lot 4) les fera varier.
- **Poids du capteur dans la table de butin : 2**, sans condition de place, comme la burette. La part des stations qui ont un capteur est mesurée à la tâche 5.
- **`VERSION_GENERATEUR` passe à 3.** Le butin change dans toutes les grandes stations : elles sont toutes republiées (environ 1 h 30 en arrière-plan), et une partie sauvegardée avant la mise à jour est refusée (D-341), comme au lot 1.
- **Le bip a un son** : un signal `capteur`, deux bips courts, joué pour tout changement d'état. À essayer sur téléphone.
- **Un « mouvement » est en rouge dans le récit** (`alertesMenace`), comme un « net » d'écoute, et compte comme une perception de la créature à l'écran de fin. Il ne change pas l'aperçu de risque (conception §4.1) et ne pose pas de repère BRUIT.
- **Le « ! » de CARTE n'est pas gardé** quand on quitte l'écran de jeu (options, rechargement). Le récit et la carte disent toujours l'état. `shortcut:` à noter dans le code.
- **La vue LISTE de la carte, la fiche d'une pièce et la CLI** disent l'état du capteur en mots, par `etatsDe` (accessibilité comprise).

## Global Constraints

- Moteur pur et déterministe : aucun `Math.random`, aucune horloge. Le tirage passe par `hacher`, comme `faceRencontre`. Aucun tirage n'entre au journal.
- Un monde sans capteur donne exactement le même état, les mêmes événements et la même empreinte qu'avant. Le champ nouveau de `PieceCarte` est **absent** hors de la pièce du capteur, et un monde sans `rencontre` n'a ni panne ni destruction.
- Un indice ne ment jamais : « calme » n'est jamais affiché dans une pièce aveugle, et une panne ou une destruction se voit toujours. Aucun texte ne nomme la créature hors de la couche menace (`MOTS_MENACE`). Le capteur dit « MOUVEMENT », jamais « la créature ».
- Textes : vrai français, au ton du jeu, courts pour le téléphone, repris des maquettes. Texte final non validé par le porteur.
- Commentaires et noms en français, dans le style du fichier touché, avec la référence de décision entre parenthèses (D-349 et suivantes, tâche 7).
- Vérification de chaque tâche : `npm run typecheck`, `npm run lint`, `npx vitest run <fichiers touchés>` ; avant la PR : `npm run verify`.

## Review Focus

1. **Machines arrêtées puis relancées dans la pièce du capteur :** brouillé, puis calme (ou mouvement), puis brouillé à nouveau, avec un événement à chaque fois. Une chambre froide reste brouillée toute la partie. Test en tâche 2.
2. **Rejeu et reprise d'une partie avec un capteur en panne :** `rejouer` redonne la même empreinte, le capteur est toujours en panne, et les `tirages` sont ceux d'une même partie dans un monde sans `rencontre`. Test en tâche 2.
3. **Pas qui finit la partie** (vaincu ou évacuation) : aucun événement de capteur, aucune panne tirée. Test en tâche 2.
4. **Pose dans une sous-position** (cabine de capsule) : le capteur s'attache à la pièce qui l'ouvre ; la carte le montre là, et il voit la créature qui y entre. Test en tâche 1.
5. **Carte révélée** (option des versions de test) : l'icône du capteur y est aussi, au même état. Test en tâche 3.

---

### Avant la tâche 1 : branche et maquettes

- Worktree `C:\dev\void_walker-capteur` sur la branche `conception/creature-mobile-3`, depuis `main` (skill `superpowers:using-git-worktrees`).
- Premier commit de docs : la conception modifiée (§4.2, §4.6), `docs/maquette/capteur.html`, `docs/maquette/capteur-carte.html` et ce plan. Ils sont aujourd'hui non commités dans `C:\dev\void_walker`. Les y retirer une fois copiés.
  ```bash
  git commit -m "docs : maquettes du capteur et plan du lot 3 de la créature mobile"
  ```
- Préversion : ajouter à `.claude/launch.json` (ignoré par git) une configuration `capteur` comme `creature-pr`, sur `C:\dev\void_walker-capteur`, port 5181.

---

### Task 1: Poser le capteur pour de bon

**Files:**
- Modify: `engine/vocabulaire.ts` : `EtatCapteur` ; `capteur_pose` dans la liste des types (l. ~58) et dans l'union `Evenement` (l. ~255)
- Modify: `engine/monde.ts` : qualité `capteur?: true` de `DefObjet` (à côté de `butin`), validation l. ~285
- Modify: `engine/etat.ts` : variante d'`EmplacementObjet`
- Create: `engine/capteur.ts`
- Modify: `engine/actions.ts` : `poser.appliquer`
- Modify: `engine/carte.ts` : exporter `pieceDeCarte`
- Modify: `engine/index.ts` : exports
- Modify: `content/textes/types.ts`, `content/textes/menace.ts` : entrées vides exigées par TypeScript (`[]`) ; la tâche 4 les remplit
- Test: `engine/capteur.test.ts`

**Interfaces:**
- Produces :
  - `vocabulaire.ts` : `export type EtatCapteur = 'calme' | 'mouvement' | 'brouille' | 'hs'`
  - `vocabulaire.ts` : `{ readonly type: 'capteur_pose'; readonly objet: RefObjet; readonly piece: RefPiece; readonly etat: Exclude<EtatCapteur, 'hs'> }`
  - `etat.ts` : `| { readonly type: 'capteur'; readonly piece: string; readonly hs?: true }`, commentaire « Capteur posé pour de bon : ni au sol ni porté ; `hs` en panne ou détruit (lot 3) ».
  - `capteur.ts` : `export function capteurPose(monde: DefMonde, etat: EtatPartie): { readonly objet: string; readonly piece: string; readonly etat: EtatCapteur } | null`. Elle rend `null` sans capteur posé. Ordre de calcul : `hs` → `'hs'` ; sinon pièce `assourdie` ou `chambreFroide` → `'brouille'` ; sinon `creatureActive(etat)` et `etat.creature.piece === piece` → `'mouvement'` ; sinon `'calme'`.

Règles :
- `validerMonde` : un objet `capteur` est portable, non déplaçable, sans doses ; au plus un par monde. Messages : `<id> : capteur à qualités incompatibles.` et `capteurs multiples.`
- `poser.appliquer` sur un objet `capteur` : emplacement `{ type: 'capteur', piece: pieceDeCarte(monde, etat.piece) }` ; événement `capteur_pose` dont `etat` est `capteurPose(...)` après la pose (jamais `hs`). Les autres objets ne changent pas. `cibles`, `verifier` et `prevoir` ne changent pas. `objetsDans`, `objetsPortes` et la mémoire de regard ignorent d'eux-mêmes ce type : le capteur n'est plus ni dans la pièce ni dans l'inventaire.

- [ ] **Step 1: Écrire les tests qui échouent**

Sur un petit monde de test : une remise, une coursive, une salle des machines (`machines`) et une chambre froide (`froide`), avec un objet `capteur` porté et une créature.

```ts
it('poser le capteur le fixe : ni au sol ni en main, et la pose dit son état', () => {
  const r = jouer(MONDE, porteur('remise'), commande('poser', 'capteur'));
  expect(r.partie.etat.objets.capteur).toEqual({ type: 'capteur', piece: 'remise' });
  expect(r.evenements).toEqual([expect.objectContaining({ type: 'capteur_pose', etat: 'calme' })]);
  expect(observer(MONDE, r.partie.etat).menu.some((o) => o.cible.id === idPublic(MONDE.id, 'capteur'))).toBe(false);
});
```

Autres cas :
- `capteurPose` : `'brouille'` dans la salle des machines en marche et `'calme'` après `arreter` ; `'brouille'` dans la chambre froide ; `'mouvement'` avec la créature dans la pièce ou dans son alcôve ; `'calme'` avec la créature inerte ; `'hs'` dès que `hs` est posé, même dans une pièce aveugle.
- Posé dans une sous-position, il est attaché à la pièce qui l'ouvre (Review Focus 4).
- `validerMonde` refuse deux capteurs et un capteur `portable: false`.
- Un monde sans capteur : `capteurPose` rend `null`.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/capteur.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter**, puis laisser TypeScript lister les `switch` exhaustifs à compléter sur `Evenement['type']` et `EmplacementObjet['type']`.

- [ ] **Step 4: Relancer tout le moteur**

Run: `npx vitest run engine && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine content/textes
git commit -m "engine : poser le capteur le fixe pour de bon, son état se lit à chaque pas"
```

---

### Task 2: Bip, panne et destruction dans le pas

**Files:**
- Modify: `engine/vocabulaire.ts` : `capteur` dans la liste des types et dans `Evenement`
- Modify: `engine/capteur.ts`
- Modify: `engine/partie.ts` : `jouer`, après le bloc de l'écoute (l. ~407) et avant les traces fraîches
- Modify: `content/textes/types.ts`, `content/textes/menace.ts` : entrées vides
- Test: `engine/capteur.test.ts` (bloc `describe('dans le pas')`)

**Interfaces:**
- Consumes : `capteurPose` (tâche 1).
- Produces :
  - `{ readonly type: 'capteur'; readonly etat: EtatCapteur }`
  - `capteur.ts` : `export const CHANCE_DESTRUCTION = 1 / 8` et `export const CHANCE_PANNE = 1 / 300`, avec le commentaire « seuils à mesurer » ;
  - `capteur.ts` : `export function tirageCapteur(graine: number, action: number): number`, entre 0 et 1 exclu, `entier32(\`capteur:${graine}:${action}\`) / 2 ** 32` comme `rencontre.ts` ;
  - `capteur.ts` : `export function abimerCapteur(monde: DefMonde, avant: EtatPartie, apres: EtatPartie, graine: number, action: number): EtatPartie` : `apres`, avec `hs: true` sur l'emplacement si le tirage le décide.

Règle dans `jouer`, sur `conclu`, seulement si ni `vaincu` ni `conclu.fin !== null` (Review Focus 3) :
1. Si `monde.rencontre !== undefined` : `conclu = abimerCapteur(monde, partie.etat, conclu, graine, action)`. Le seuil est `CHANCE_DESTRUCTION` si la créature, active et hors traque, est dans la pièce du capteur avant le pas et après ; sinon `CHANCE_PANNE`.
2. `avant = capteurPose(monde, partie.etat)`, `apres = capteurPose(monde, conclu)`. Si les deux existent et que leurs `etat` diffèrent, pousser `{ type: 'capteur', etat: apres.etat }`. Au pas de la pose, `avant` est `null` : seul `capteur_pose` est dit.

- [ ] **Step 1: Écrire les tests qui échouent**

Sur le monde de la tâche 1, à `rencontre: { rythme: 1 }`, en cherchant les graines par `tirageCapteur` et `faceRencontre` :
- la créature entre dans la remise du capteur : un `capteur` `mouvement` ; elle en sort : `calme` ;
- rien ne change : aucun événement `capteur` ;
- `arreter` puis `relancer` les machines de sa pièce : `calme`, puis `brouille` (Review Focus 1) ;
- une graine où le tirage tombe sous `CHANCE_DESTRUCTION` avec elle dans la pièce, hors traque : `hs`, puis plus rien jusqu'à la fin ;
- en traque (`contact: true`) dans la pièce, même tirage : pas de destruction ;
- un monde sans `rencontre` : jamais `hs` sur 600 actions ;
- un pas où le passager est vaincu : ni panne ni événement `capteur` (Review Focus 3) ;
- `rejouer` d'une partie où le capteur est passé `hs` : même empreinte, encore `hs`, et `tirages` identiques à ceux de la même partie sans `rencontre` (Review Focus 2) ;
- sur 3 000 graines, la part de pannes en une action sans elle est entre 0,002 et 0,005, et la part de destructions avec elle entre 0,09 et 0,16.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/capteur.test.ts -t "dans le pas"`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

- [ ] **Step 4: Relancer tout le moteur**

Run: `npx vitest run engine && npm run typecheck`
Expected: PASS. Les tests existants de l'errance, de la face 2 et de l'écoute restent verts.

- [ ] **Step 5: Commit**

```bash
git add engine content/textes
git commit -m "engine : le capteur bipe à chaque changement, tombe en panne ou est détruit"
```

---

### Task 3: Le capteur sur la carte

**Files:**
- Modify: `engine/vocabulaire.ts` : `PieceCarte.capteur?: EtatCapteur`
- Modify: `engine/carte.ts` : `carte()`
- Modify: `content/textes/carte.ts` : `MOTS_CARTE.capteur` et `etatsDe`
- Modify: `app/carte/vue.ts` : `Icone`, `ICONE_HAUTEUR`, `iconesDe`
- Modify: `app/carte/PlanCarte.tsx` : composant `Capteur`
- Modify: `app/styles.css` : `.carte-traits .icone-capteur`, à la suite de `.icone-creature`
- Test: `engine/carte.test.ts`, `app/carte/carte.test.tsx`, `app/carte/revelee.test.ts`

**Interfaces:**
- Consumes : `capteurPose` (tâche 1).
- Produces :
  - `PieceCarte.capteur?: EtatCapteur`, présent seulement sur la pièce du capteur ;
  - `MOTS_CARTE.capteur: Readonly<Record<EtatCapteur, string>>` = `{ calme: 'CAPTEUR : calme', mouvement: 'CAPTEUR : MOUVEMENT', brouille: 'CAPTEUR : brouillé', hs: 'CAPTEUR : plus de signal' }` ;
  - `Icone = 'joueur' | 'creature' | 'drone' | 'capteur'`.

Règles :
- `carte()` ajoute `capteur` à la pièce de `capteurPose(monde, etat)` : l'état réel, à jour, même hors de vue, comme le pictogramme du drone envoyé.
- `etatsDe` ajoute `MOTS_CARTE.capteur[etat]` en dernier : la fiche, la vue LISTE, la CLI et le libellé lu au lecteur d'écran le disent.
- Icône dessinée autour de (0, 0), comme `Oeil`, d'après la maquette : losange `M0 -9 L9 0 L0 9 L-9 0 Z` et point de rayon 2,5.
  - calme : contour `--vert`, point `--vert` ;
  - mouvement : plein `--alerte`, point `--vert-fond`, deux ondes de chaque côté ;
  - brouillé : contour `--vert-secondaire` en tirets `2 2`, sans point ;
  - hs : contour `--vert-secondaire`, barre de (-11, -11) à (11, 11), sans point.
  - La forme dit l'état sans la couleur. Pas d'animation.

- [ ] **Step 1: Écrire les tests qui échouent**

- `engine/carte.test.ts` : après la pose dans la remise, `carte(...).pieces` donne `capteur: 'calme'` à la remise et à elle seule ; ailleurs, la clé est absente (`not.toHaveProperty('capteur')`). La créature y entre hors de vue : `'mouvement'`.
- `app/carte/carte.test.tsx` : le plan rendu contient `icone-capteur` avec `data-etat="mouvement"` dans la remise ; la vue LISTE contient `CAPTEUR : MOUVEMENT`.
- `app/carte/revelee.test.ts` : la carte révélée porte le même `capteur` (Review Focus 5).

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/carte.test.ts app/carte`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

- [ ] **Step 4: Relancer**

Run: `npx vitest run engine app/carte content && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine app content/textes/carte.ts
git commit -m "carte : le capteur dans sa pièce, quatre états dessinés et dits en mots"
```

---

### Task 4: Textes du capteur, et mouvement en rouge

**Files:**
- Modify: `content/textes/types.ts` : `TypeRecit` exclut `capteur` et `capteur_pose` ; champs `capteur: Readonly<Record<EtatCapteur, Variantes>>` et `capteurPose: Readonly<Record<Exclude<EtatCapteur, 'hs'>, Variantes>>`
- Modify: `content/textes/menace.ts` : les textes
- Modify: `content/textes/couches.ts` : `TEXTES_CAPTEUR`, `TEXTES_POSE_CAPTEUR`, repris de `reunir([])` comme `TEXTES_ECOUTE`
- Modify: `content/ar-01/textes.ts`, `content/ar-02/textes.ts`, `content/monde-test/textes.ts` : les reprendre
- Modify: `content/textes/rendu.ts` : `variantesDe`, `estMenaceOuDegat`
- Modify: `content/textes/fin.ts` : `capteur` `mouvement` compte comme perçue
- Modify: `content/catalogue/textes.ts` : nom et description de `cat_capteur`
- Modify: `tools/check-texts.ts` : gabarits sans paramètre pour `capteur` et `capteurPose`, comme `attenteEcoute`
- Test: `content/textes/rendu.test.ts`

**Interfaces:**
- Consumes : `capteur_pose` et `capteur` (tâches 1 et 2).
- Produces : `alertesMenace` inclut le rang d'un `capteur` dont `etat` vaut `mouvement`.

Textes de départ, deux variantes au moins par clé :

| Clé | Exemple |
| --- | --- |
| `capteurPose.calme` | « Vous fixez le capteur au mur. Un voyant vert clignote, puis s’éteint. CAPTEUR : EN SERVICE. » |
| `capteurPose.brouille` | « Vous fixez le capteur au mur. Le voyant hésite, puis clignote sans fin. CAPTEUR : SIGNAL BROUILLÉ. » |
| `capteurPose.mouvement` | « Vous fixez le capteur au mur. Le voyant passe aussitôt au rouge. CAPTEUR : MOUVEMENT. » |
| `capteur.mouvement` | « Votre terminal bipe deux fois. CAPTEUR : MOUVEMENT. » |
| `capteur.calme` | « Votre terminal bipe. CAPTEUR : PLUS DE MOUVEMENT. » |
| `capteur.brouille` | « Votre terminal grésille. CAPTEUR : SIGNAL BROUILLÉ. » |
| `capteur.hs` | « Votre terminal grésille. CAPTEUR : PLUS DE SIGNAL. » |
| `cat_capteur` (nom) | « capteur de mouvement », m, s |
| `cat_capteur` (description) | « Un capteur de mouvement de maintenance, gros comme un poing, une bande adhésive au dos. Son voyant s’allume quand on l’agite. » |

- [ ] **Step 1: Écrire les tests qui échouent**

- `[capteur_pose calme]` rend une variante de `capteurPose.calme` ; `alertesMenace` vaut `[]`.
- `[{ type: 'capteur', etat: 'mouvement' }]` : `alertesMenace` vaut `[0]`. Avec `hs`, `calme` ou `brouille` : `[]`.
- L'écran de fin d'une partie où seul un `capteur` `mouvement` l'a signalée dit qu'elle a été perçue.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run content/textes/rendu.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter et écrire les textes**

- [ ] **Step 4: Relancer**

Run: `npx vitest run content tools/check-texts.test.ts tools/couches.test.ts && npm run check:texts && npm run typecheck`
Expected: PASS, aucun mot de menace hors de sa couche.

- [ ] **Step 5: Commit**

```bash
git add content tools/check-texts.ts
git commit -m "textes : pose et bips du capteur, un mouvement en rouge"
```

---

### Task 5: Le capteur dans le butin, republication et mesures

**Files:**
- Modify: `content/catalogue/butin.ts` : entrée `{ objet: { id: 'o-butin-capteur', nom: 'cat_capteur', piece: '', capteur: true }, poids: 2 }` ; commentaire de tête mis à jour
- Modify: `content/stations/grandes.ts` : `VERSION_GENERATEUR = 3`
- Modify: `content/stations/grandes-publiees.ts`, `tools/grandes-temoins.json`, `tools/grandes-sans-station.json` : écrits par `publier:grandes`
- Test: `tools/grandes.test.ts`

**Interfaces:**
- Consumes : la qualité `capteur` (tâche 1) et le nom `cat_capteur` (tâche 4).

- [ ] **Step 1: Écrire le test qui échoue**

Sur les 200 premières grandes stations publiées, reconstruites par le catalogue : chacune a au plus un objet `capteur`, et la part des stations qui en ont un est entre 0,4 et 0,9. Une station sans capteur reste jouable : rien ne l'exige.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run tools/grandes.test.ts`
Expected: FAIL, aucun capteur.

- [ ] **Step 3: Implémenter, et mesurer `main` pendant ce temps**

Run, dans `C:\dev\void_walker` sur `main`, en arrière-plan : `npm run mesurer:difficulte`. Garder par profil les évacuations, défaites, abandons, la durée médiane en actions et la part des parties avec une rencontre.

- [ ] **Step 4: Republier, en arrière-plan**

Run: `npm run publier:grandes -- --processus=<cœurs - 1>` (environ 1 h 30 au dernier passage, 5 015 s).
Expected: un nombre de stations publiées proche des 1 971 actuelles, toutes en `g3-`. S'il y en a nettement moins, s'arrêter et le dire : la preuve se fait sans butin (`sansButin`), donc le capteur ne devrait rien changer.

- [ ] **Step 5: Vérifier et mesurer la branche**

Run: `npm run check:stations && npx vitest run tools/grandes.test.ts cli`
Expected: PASS.
Puis `npm run mesurer:difficulte` sur la branche, à comparer à celle de `main` (step 3). Le capteur ne doit rien dégrader : les bots le ramassent et le posent rarement. Avant la republication, la mesure ne peut pas tourner sur la branche : la liste publiée est encore en `g2-`, que la version 3 refuse.

- [ ] **Step 6: Commit**

```bash
git add content tools
git commit -m "contenu : un capteur dans le butin, grandes stations republiées (version 3)"
```

---

### Task 6: « ! » sur CARTE et son du capteur

**Files:**
- Modify: `app/jeu.ts` : `carteANouveau`
- Modify: `app/App.tsx` : écran `jeu` (l. 52, 160, 215, 229, 398) et rappel `voirCarte`, comme `lireMessages` (l. 238)
- Modify: `app/EcranJeu.tsx` : props `carteANouveau` et `voirCarte` ; bouton CARTE (l. ~407)
- Modify: `app/styles.css` : `.notification-carte`, à côté de `.notification-ia`
- Modify: `app/son/recettes.ts` : signal `capteur` dans `SIGNAUX`, après `ia`, et sa recette
- Modify: `app/son/declencheurs.ts` : `signauxApres`
- Test: `app/jeu.test.ts`, `app/EcranJeu.test.tsx`, `app/son/declencheurs.test.ts`, `app/son/recettes.test.ts`

**Interfaces:**
- Consumes : l'événement `capteur` (tâche 2) ; des stations publiées avec un capteur (tâche 5).
- Produces :
  - `export function carteANouveau(avant: boolean, evenements: readonly Evenement[]): boolean`, soit `avant || evenements.some((e) => e.type === 'capteur')`. `capteur_pose` n'allume rien.
  - Écran `jeu` d'`App` : champ `carteANouveau: boolean`, `false` au démarrage, à la reprise et au retour des options (shortcut: le « ! » se perd hors de l'écran de jeu ; à garder avec les messages lus si le porteur le regrette).
  - `EcranJeu` : `readonly carteANouveau: boolean; readonly voirCarte: () => void`. Ouvrir la carte appelle `voirCarte`, qui remet le champ à `false`.

Règles :
- Le « ! » de CARTE est celui d'IA STATION (même SVG, même animation, même règle de mouvement réduit), en `--vert`. Il est masqué au lecteur d'écran. Le bouton dit `aria-label="Carte, nouveau signal du capteur"`.
- Recette `capteur` : deux bips courts, comme ceux d'IA mais plus graves et plus espacés : `[0, 0.12].map((de) => ton(de, 0.05, 1100, { vol: 0.08 }))`. Elle sonne pour tout événement `capteur`.

- [ ] **Step 1: Écrire les tests qui échouent**

- `carteANouveau(false, [{ type: 'capteur', etat: 'hs' }])` vaut `true` ; `carteANouveau(false, [capteur_pose])` vaut `false` ; `carteANouveau(true, [])` vaut `true`.
- `EcranJeu` rendu avec `carteANouveau` : `nav-carte` contient `notification-carte` et le libellé ; sans : aucun des deux.
- `signauxApres(avant, apres, [{ type: 'capteur', etat: 'mouvement' }])` contient `'capteur'`, mais pas avec `capteur_pose`.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run app/jeu.test.ts app/EcranJeu.test.tsx app/son`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

- [ ] **Step 4: Relancer, puis regarder l'appli**

Run: `npx vitest run app && npm run typecheck`
Expected: PASS.
Puis lancer la préversion `capteur` (skill `run`), à 390 px. Jouer une grande station qui a un capteur (republiée à la tâche 5 ; la carte révélée aide à le trouver), le poser dans un cul-de-sac et attendre son bip. Prendre trois captures pour la PR : le « ! » sur CARTE, la carte ouverte avec l'icône rouge, et la panne barrée.

- [ ] **Step 5: Commit**

```bash
git add app
git commit -m "appli : « ! » sur CARTE à chaque changement du capteur, et son bip"
```

---

### Task 7: Décisions, docs et PR

**Files:**
- Modify: `docs/03-decisions.md` : D-349 et suivantes, statut « Validé » le 2026-10-22 sur maquette, avec renvoi aux maquettes et à ce plan :
  - D-349 le capteur : au plus un par station, posé pour de bon par POSER (précise D-336) ;
  - D-350 quatre états, et brouillé tant que la pièce est aveugle ;
  - D-351 sur la carte : l'icône dans sa pièce, le « ! » sur CARTE, le bip et son son ;
  - D-352 panne et destruction : un tirage hors journal, ses seuils, et pas de destruction en traque ;
  - D-353 le drone éclaireur est reporté (précise D-336).

  Les choix de l'agent sont marqués « [Détail de l'agent] ». Mettre à jour l'index des thèmes et la ligne de mise à jour en tête.
- Modify: `docs/14-carte.md` : l'icône du capteur et le « ! » de CARTE.
- Modify: `docs/15-son.md` : le signal `capteur`.
- Modify: `docs/contrats/C-03-temps-reactions.md` : le capteur dans le pas, après l'écoute.
- Modify: `docs/superpowers/specs/2026-10-21-creature-mobile-design.md` : §12 n° 7 et en-tête, avec renvoi à D-349.
- Modify: `docs/00-lire-en-premier.md` : une ligne d'état.

- [ ] **Step 1: Écrire les docs**

- [ ] **Step 2: Vérifier**

Run: `npm run verify`
Expected: PASS, liens et textes compris.

- [ ] **Step 3: Commit et PR, avec l'accord du porteur**

```bash
git add docs
git commit -m "docs : le capteur, décisions D-349 à D-353"
```

La PR cite la conception, les maquettes, le tableau des mesures, la part des stations avec un capteur, les captures de la tâche 6 et les choix de l'agent. Elle dit ce que le porteur doit essayer sur téléphone :
- si le piège du cul-de-sac marche en vraie partie ;
- si le « ! » et le bip se remarquent sans gêner ;
- si l'icône se lit sur le plan, à toutes les échelles ;
- si les chances de panne et de destruction sont justes.
