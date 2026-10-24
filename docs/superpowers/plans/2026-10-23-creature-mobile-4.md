# Créature mobile, lot 4 : salle de surveillance et messages d'IA Station — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dans 20 % des grandes stations, une salle de surveillance dont le terminal, débloqué par un post-it trouvé ailleurs, révèle la carte pour de bon et montre en direct les caméras de la station. Dans toutes les grandes stations, la face 2 du dé de rencontre donne parfois un message d'IA Station qui nomme une pièce, sans jamais nommer la menace.

**Architecture:** le moteur gagne un objet `terminal` (qui `exige` le post-it), une liste de caméras dans le monde et un module pur `engine/surveillance.ts`. Il calcule ce que lit chaque caméra, comme `capteurPose`. Une action nouvelle, `surveiller`, connecte le terminal et révèle la station en écrivant `visitees`, `decouvertes` et la mémoire. L'observation porte les caméras seulement quand le passager est connecté dans la salle. Les messages d'IA Station de la face 2 sont des messages d'assistance d'un genre nouveau (`signe-<n>`), dont les faits sont gardés dans `etat.signes`. L'assembleur des grandes stations change une impasse posée en salle de surveillance, pose le post-it et les caméras, et `VERSION_GENERATEUR` passe à 4. L'appli ajoute la fenêtre plein cadre du poste (variante A) et l'icône de caméra.

**Tech Stack:** TypeScript 6, Vitest 4, tsx ; moteur pur dans `engine/`, textes en couches dans `content/textes/`, appli React dans `app/`.

**Spec:** [docs/superpowers/specs/2026-10-21-creature-mobile-design.md](../specs/2026-10-21-creature-mobile-design.md), §4.3 (salle de surveillance) et §4.5 (messages d'IA Station, lot 4). Maquettes : [poste.html](../../maquette/poste.html) (variante A, retenue) et [ia-signes.html](../../maquette/ia-signes.html).

## Ce que le porteur a tranché (2026-10-23, sur maquettes)

- **Une salle à part**, qui n'est pas le poste de sécurité de M-11, dans **20 % des grandes stations**.
- **Le terminal demande un mot de passe.** Le mot de passe est sur un **post-it** posé au hasard dans une autre pièce, que le joueur garde.
- **La carte est révélée pour de bon.** Le plan et les portes restent **figés à la consultation**, jusqu'à ce qu'on repasse devant ou qu'on revienne au terminal. On voit **le feu et le vide d'air**, mais **pas le contenu des pièces**.
- **Les caméras, seulement dans la fenêtre du poste, en direct.** Une caméra dans **une pièce sur trois**, et **un tiers** d'entre elles en panne au départ. La créature **peut les détruire**.
- **La fenêtre est en plein cadre (variante A)**, avec ATTENDRE et QUITTER.
- **IA Station peut nommer des pièces.** Elle a quatre sortes de messages : porte, matériel, passage, présence. Elle parle **une ou deux fois par partie** en grande station.

## Choix de l'agent dans ce plan (repris de la conception, à signaler au porteur)

- **Nom et pièce.** La pièce s'appelle « salle de surveillance ». C'est une **impasse du catalogue déjà posée**, changée en salle de surveillance après la pose des annexes. Elle n'est jamais dans le segment de la capsule ni dans le repaire de la créature. Le plan de la station ne bouge pas.
- **Le post-it.** C'est un objet portable sans qualité, posé dans une annexe : pas la salle, pas le repaire, pas le segment de la capsule, et pas une pièce qui garde déjà une clé. Le code est écrit dans sa description, dont chaque variante porte un code différent.
- **Sans le post-it, `surveiller` est refusé** avec la raison `sans_mot_de_passe`, comme le lecteur de carte de M-11 (`sans_carte`). C'est un refus, pas une action : le temps ne passe pas.
- **`surveiller` coûte une action et fait le même bruit qu'un geste discret.** On peut le rejouer, et chaque fois le plan se remet à jour. QUITTER ne coûte rien, c'est l'appli qui ferme la fenêtre.
- **Une caméra est un emplacement du monde (`DefMonde.cameras`), pas un objet.** On ne la prend pas et on ne la voit pas dans la pièce. Ses pannes et ses destructions en cours de partie vont dans `etat.camerasHs`. Le tirage est haché par caméra (`camera:<graine>:<action>:<piece>`), avec les seuils du capteur (D-353).
- **Révélation.** Toutes les pièces passent dans `visitees`. Toutes les liaisons sauf les liaisons `cachee` passent dans `decouvertes`. La mémoire reçoit l'état de toutes ces liaisons, et pour chaque pièce un souvenir sans objet, avec le feu du moment (`objets: []`). Le vide suit les voyants (14, OP-04).
- **Ligne du bas de la fenêtre.** Elle dit les caméras qui ont changé, calculées par l'appli entre deux observations. La fenêtre **se ferme d'elle-même** si le pas a une alerte de menace ou un danger, ou si le passager n'est plus connecté dans la salle : le récit montre alors tout.
- **Messages d'IA Station.**
  - Ils viennent à la place du `bruit_lointain`, aux mêmes conditions que lui.
  - Écart et plafond : au moins `SIGNES_ECART = 30` actions entre deux messages, et `SIGNES_MAX = 2` par partie.
  - La sorte est tirée hors journal (`signe:<graine>:<action>`) parmi celles qui ont un fait neuf à dire.
  - Faits :
    - porte : `etat.enfoncees` ;
    - matériel : `etat.camerasHs` et le capteur `hs` ;
    - passage : `creature.passages` de moins de `FRAICHEUR` actions, hors pièce du passager ;
    - présence : `creature.piece`.
  - Un fait déjà dit n'est pas redit. La présence et le passage gardent toujours un fait possible.
- **`VERSION_GENERATEUR` passe à 4.** Toutes les grandes stations sont republiées (44 090 s au dernier passage complet ; garder le PC éveillé), et une partie sauvegardée avant la mise à jour est refusée (D-341).
- **Pas de son nouveau.** Un message d'IA Station garde le son d'arrivée d'aujourd'hui. La fenêtre du poste n'a pas de son.

## Global Constraints

- Moteur pur et déterministe : aucun `Math.random`, aucune horloge. Tout tirage passe par `entier32`/`hacher`, hors journal, comme `faceRencontre` et `tirageCapteur`.
- **Un monde sans terminal ni caméras donne exactement le même état, les mêmes événements et la même empreinte qu'avant**, à une exception près : la face 2 des mondes à `rencontre`, où un message d'IA Station peut remplacer le bruit lointain. Les champs nouveaux de l'état (`connecte`, `camerasHs`, `signes`) sont **absents** tant qu'ils ne servent pas.
- Un indice ne ment jamais. Une caméra n'affiche jamais « calme » dans une pièce aveugle, et une panne se voit toujours. IA Station dit un fait vrai au moment où elle parle. Elle ne nomme jamais la menace et ne donne aucun chiffre (12 §1.5). Le code du post-it est la seule exception, parce que c'est un support écrit (17-univers §6).
- La caméra dit « MOUVEMENT », jamais « la créature ». Aucun texte ne nomme la créature hors de la couche menace (`MOTS_MENACE`). Les messages d'IA Station vont dans la couche univers, sans mot de la menace ni des traces.
- Textes : vrai français, au ton du jeu, courts pour le téléphone, repris des maquettes. Texte final non validé par le porteur.
- Commentaires et noms en français, dans le style du fichier touché, avec la décision entre parenthèses (D-355 et suivantes, tâche 7).
- Vérification de chaque tâche : `npm run typecheck`, `npm run lint`, puis `npx vitest run <fichiers touchés>`. Avant la PR : `npm run verify`.

## Review Focus

1. **La créature entre dans la salle pendant qu'on regarde :** la fenêtre se ferme, et le récit montre l'entrée et l'avertissement. Rien n'est masqué. Test en tâche 6.
2. **Machines relancées dans une pièce à caméra après la connexion :** la caméra passe à `brouille`, jamais à `calme`. Une caméra en panne au départ reste `hs` toute la partie. Test en tâche 1.
3. **Une porte forcée après la consultation, loin du passager :** la carte la montre toujours fermée, puis à jour après un nouveau `surveiller`. Test en tâche 1.
4. **Rejeu et reprise après un message d'IA Station et une caméra détruite :** `rejouer` redonne la même empreinte, le même `etat.signes`, le même historique de messages, et les mêmes `tirages`. Test en tâche 3.
5. **Le passage caché de M-05 après la connexion :** il reste absent de la carte et des boutons « Se déplacer vers ». Test en tâche 1.

---

### Avant la tâche 1 : branche et maquettes

- Worktree `C:\dev\void_walker-surveillance` sur la branche `conception/creature-mobile-4`, créée depuis `main` (skill `superpowers:using-git-worktrees`).
- Premier commit de docs : la conception modifiée (§4.3, §4.5, §6, §7, §9, §11), `docs/maquette/poste.html`, `docs/maquette/ia-signes.html` et ce plan. Ils sont aujourd'hui non commités dans `C:\dev\void_walker`. Les y retirer une fois copiés.
  ```bash
  git commit -m "docs : maquettes du poste et des messages d'IA Station, plan du lot 4 de la créature mobile"
  ```
- Préversion : dans `.claude/launch.json` (ignoré par git), ajouter une configuration `surveillance` comme `capteur`, sur `C:\dev\void_walker-surveillance`, port 5182.

---

### Task 1: Terminal, caméras et révélation dans le moteur

**Files:**
- Modify: `engine/monde.ts` : `DefObjet.terminal?: true`, `DefCamera`, `DefMonde.cameras`, et `validerMonde`
- Modify: `engine/etat.ts` : `EtatPartie.connecte?: true` et `EtatPartie.camerasHs?: readonly string[]`
- Create: `engine/surveillance.ts`
- Modify: `engine/vocabulaire.ts` : `'surveiller'` dans `ACTIONS`, `'sans_mot_de_passe'` dans les raisons (à côté de `sans_carte`, l. ~167 et ~192), l'événement `terminal_connecte` et `Observation.cameras`
- Modify: `engine/actions.ts` : l'action `surveiller`
- Modify: `engine/observation.ts` : `cameras`
- Modify: `engine/index.ts` : les exports
- Modify: `content/textes/types.ts`, `content/textes/univers.ts`, `content/textes/morceaux.ts` : des entrées vides exigées par TypeScript ; la tâche 4 les remplit
- Test: `engine/surveillance.test.ts`

**Interfaces:**
- Produces :
  - `monde.ts` : `export interface DefCamera { readonly piece: string; readonly hs?: true }`, `DefMonde.cameras?: readonly DefCamera[]`, `DefObjet.terminal?: true`.
  - `etat.ts` : `connecte?: true`, commenté « Terminal de surveillance connecté pour la partie (lot 4) » ; `camerasHs?: readonly string[]`, commenté « Pièces dont la caméra est tombée en panne ou a été détruite en cours de partie, dans l'ordre où c'est arrivé (lot 4) ».
  - `surveillance.ts` :
    - `export function lireMouvement(monde: DefMonde, etat: EtatPartie, piece: string, hs: boolean): EtatCapteur` : la règle de `capteurPose` (hs, puis aveugle, puis présence, puis calme), que `capteurPose` appelle désormais ;
    - `export function camerasLues(monde: DefMonde, etat: EtatPartie): readonly { readonly piece: string; readonly etat: EtatCapteur }[]` : toutes les caméras, dans l'ordre du monde ; `hs` si `DefCamera.hs` ou si la pièce est dans `camerasHs` ;
    - `export function salleDeSurveillance(monde: DefMonde): string | null` : la pièce du terminal ;
    - `export function reveler(monde: DefMonde, etat: EtatPartie): EtatPartie`.
  - `vocabulaire.ts` : `{ readonly type: 'terminal_connecte' }` ; `Observation.cameras?: readonly { readonly piece: RefPiece; readonly etat: EtatCapteur }[]`.

Règles :
- `validerMonde` :
  - au plus un `terminal` par monde. Le terminal n'est pas portable, il `exige` un objet portable, et c'est un objet sans autre qualité. Messages : `terminaux multiples.` et `<id> : terminal à qualités incompatibles.` ;
  - `cameras` : des pièces connues, sans doublon, jamais la pièce du terminal, et seulement s'il y a un terminal. Messages : `<piece> : caméra dans une pièce inconnue.`, `<piece> : caméra en double.`, `<piece> : caméra dans la salle de surveillance.` et `caméras sans terminal.`.
- `surveiller` (`engage: true`, `cibles` : le terminal de la pièce) :
  - `verifier` : `sans_mot_de_passe` si l'objet `exige` n'est pas porté ;
  - `prevoir` : sans danger, coût discret ;
  - `appliquer` : `reveler(monde, { ...etat, connecte: true })`, puis l'événement `terminal_connecte`.
- `reveler` :
  - `visitees` reçoit toutes les pièces du monde, dans l'ordre du monde ;
  - `decouvertes` reçoit toutes les liaisons sans `cachee`, dans l'ordre du monde ;
  - `memoire.liaisons` reçoit l'état de ces liaisons ;
  - `memoire.pieces[p]` est remplacé pour chaque pièce, sauf celle du passager (le regard de fin d'action l'écrira), par `{ regard: etat.actions, feu: { vu: enFeu(etat, p), actions: etat.actions }, objets: [] }`. Un souvenir déjà plus riche (des objets vus) garde ses objets.
- `observer` : `cameras` n'est présent que si `etat.connecte === true` et que le passager est dans `salleDeSurveillance(monde)` (une sous-position compte). Les références sont publiques.

- [ ] **Step 1: Écrire les tests qui échouent**

Le monde de test est petit : une salle de surveillance (avec le terminal), une coursive, une remise (avec une caméra), une salle des machines (avec une caméra), une cambuse (avec le post-it) et une créature. Il a un passage caché entre la coursive et la remise.

```ts
it('sans le post-it, le terminal se refuse et le temps ne passe pas', () => {
  const r = valider(MONDE, depart('surveillance'), commande('surveiller', 'terminal'));
  expect(r).toEqual(expect.objectContaining({ raison: 'sans_mot_de_passe' }));
});

it('post-it en main, la connexion révèle toute la station sauf le passage caché', () => {
  const r = jouer(MONDE, porteur('surveillance', 'post-it'), commande('surveiller', 'terminal'));
  expect(r.evenements).toContainEqual({ type: 'terminal_connecte' });
  expect(r.partie.etat.visitees).toEqual(MONDE.pieces.map((p) => p.id));
  expect(r.partie.etat.decouvertes).not.toContain('l-cache');
  expect(observer(MONDE, r.partie.etat).cameras).toHaveLength(2);
});
```

Autres cas :
- Après `aller coursive`, `observer(...).cameras` est absent.
- Une caméra en panne au départ (`hs: true`) reste `hs`, même dans une pièce aveugle.
- Machines relancées dans la pièce d'une caméra : `brouille`, jamais `calme` (Review Focus 2).
- Une porte enfoncée après la connexion reste fermée dans `carte(...)`. Après un second `surveiller`, elle est ouverte (Review Focus 3).
- Le passage caché n'apparaît ni dans `carte(...)` ni dans les `passages` de l'observation (Review Focus 5).
- La carte ne montre aucun objet d'une pièce jamais regardée. Une pièce en feu montre son feu.
- `validerMonde` refuse deux terminaux, une caméra dans la salle de surveillance, et des caméras sans terminal.
- `capteurPose` donne toujours les mêmes résultats (les tests de `engine/capteur.test.ts` restent verts).

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/surveillance.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter**, puis laisser TypeScript lister les `switch` exhaustifs sur `Evenement['type']` et sur les actions.

- [ ] **Step 4: Relancer tout le moteur**

Run: `npx vitest run engine && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine content/textes
git commit -m "engine : terminal à mot de passe, caméras et révélation de la station"
```

---

### Task 2: Pannes et destructions des caméras dans le pas

**Files:**
- Modify: `engine/surveillance.ts`
- Modify: `engine/partie.ts` : `jouer`, dans le bloc du capteur (l. ~411), sous la même condition (ni `vaincu` ni fin)
- Test: `engine/surveillance.test.ts` (bloc `describe('dans le pas')`)

**Interfaces:**
- Consumes : `camerasLues` (tâche 1), `CHANCE_DESTRUCTION` et `CHANCE_PANNE` de `capteur.ts`.
- Produces : `export function abimerCameras(monde: DefMonde, avant: EtatPartie, apres: EtatPartie, graine: number, action: number): EtatPartie`. Elle tire une fois par caméra qui marche, sur `entier32(\`camera:${graine}:${action}:${piece}\`) / 2 ** 32`. Elle ajoute à `camerasHs` les pièces touchées, dans l'ordre du monde. Elle donne la destruction si la créature, active et hors traque, est dans la pièce avant le pas et après ; sinon la panne.

Règle : seulement dans un monde à `rencontre` qui a des caméras. Aucun événement de récit : une caméra perdue ne se voit qu'au poste, ou par IA Station (tâche 3).

- [ ] **Step 1: Écrire les tests qui échouent**

- Avec une graine dont le tirage tombe sous `CHANCE_DESTRUCTION`, et la créature dans la remise hors traque : la remise entre dans `camerasHs`. En traque, avec le même tirage : pas de destruction.
- Un monde sans `rencontre` ne donne jamais de `camerasHs` sur 600 actions.
- Au pas qui finit la partie, rien n'est tiré.
- Sur 3 000 graines, la part de pannes en une action sans elle est entre 0,002 et 0,005.
- Un monde sans caméra a la même empreinte qu'avant ce lot, sur une partie de 80 actions.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/surveillance.test.ts -t "dans le pas"`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

- [ ] **Step 4: Relancer**

Run: `npx vitest run engine && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine
git commit -m "engine : les caméras tombent en panne ou sont détruites, hors journal"
```

---

### Task 3: Messages d'IA Station sur la face 2

**Files:**
- Modify: `engine/vocabulaire.ts` : `SigneIA`, `SignePublic`, `MomentMessage` `{ type: 'signe' }`, `MessageRecu.signe?` et `assistance.signe?`
- Modify: `engine/etat.ts` : `EtatPartie.signes?`
- Create: `engine/signes.ts`
- Modify: `engine/partie.ts` : le bloc de la face 2 (l. ~378), et le rejeu des messages au réveil (l. ~88)
- Modify: `engine/observation.ts` : `historique`
- Test: `engine/signes.test.ts`

**Interfaces:**
- Consumes : `camerasLues` (tâche 1), `capteurPose`, `FRAICHEUR`, `entier32`.
- Produces :
  - `etat.ts` : `export type SigneIA = { readonly sorte: 'porte'; readonly liaison: string } | { readonly sorte: 'materiel'; readonly piece: string; readonly appareil: 'camera' | 'capteur' } | { readonly sorte: 'passage' | 'presence'; readonly piece: string }` ; `signes?: readonly (SigneIA & { readonly action: number })[]`, présent après le premier message.
  - `vocabulaire.ts` : `SignePublic`, la même union avec `RefPassage` pour la porte et `RefPiece` pour les pièces ; `MessageRecu.signe?: SignePublic` ; `{ readonly type: 'assistance'; readonly message: string; readonly signe?: SignePublic }`.
  - `signes.ts` :
    - `export const SIGNES_ECART = 30` et `export const SIGNES_MAX = 2`, avec le commentaire « seuils du porteur : un ou deux messages par partie » ;
    - `export function signePermis(etat: EtatPartie): boolean` ;
    - `export function faitsNeufs(monde: DefMonde, etat: EtatPartie): readonly SigneIA[]`, dans l'ordre porte, matériel, passage, présence, sans ceux déjà dans `etat.signes` (comparés sans `action`) ;
    - `export function choisirSigne(faits: readonly SigneIA[], graine: number, action: number): SigneIA`, tiré sur `entier32(\`signe:${graine}:${action}\`)`.
  - Identifiant du message : `signe-<n>`, où `n` est le rang dans `etat.signes`, à partir de 1.

Règles :
- Dans `jouer`, là où la face 2 pousse aujourd'hui `bruit_lointain` (créature plus loin qu'une pièce voisine) : si `signePermis` est vrai et que `faitsNeufs` n'est pas vide, on ajoute le signe à `etat.signes` avec l'action, `signe-<n>` à `etat.messages`, et on pousse `{ type: 'assistance', message, signe }`. Sinon, on pousse `bruit_lointain` comme aujourd'hui. Le bruit proche ne change pas.
- Faits :
  - porte : chaque liaison de `etat.enfoncees` ;
  - matériel : chaque pièce de `etat.camerasHs`, puis le capteur s'il est `hs` (les caméras en panne au départ ne comptent pas) ;
  - passage : les pièces de `creature.passages` à moins de `FRAICHEUR` actions, sans la pièce du passager ni celle de la créature ;
  - présence : la pièce de la créature.
- `historique` : un message `signe-<n>` rend `{ message, moment: { type: 'signe' }, signe }` avec les références publiques. Les autres messages ne changent pas.

- [ ] **Step 1: Écrire les tests qui échouent**

Sur un monde à `rencontre: { rythme: 1 }`, en cherchant les graines par `faceRencontre` et `choisirSigne` :
- face 2 avec la créature loin : un `assistance` avec `signe.sorte === 'presence'` et la pièce de la créature ; `etat.messages` finit par `signe-1` ;
- une seconde face 2 moins de 30 actions plus tard : `bruit_lointain` ;
- après deux messages, plus aucun, même 200 actions plus tard ;
- une porte enfoncée pendant la partie donne un fait `porte` ; une porte ouverte au départ n'en donne pas ;
- une caméra en panne au départ ne donne pas de fait `materiel`, mais une caméra perdue en cours de partie en donne un ;
- un même fait n'est jamais redit ;
- face 2 avec la créature dans une pièce voisine : `bruit_proche`, sans message ;
- `rejouer` redonne la même empreinte, le même `etat.signes` et le même `historique` (Review Focus 4) ;
- dans un monde sans `rencontre`, `signes` est absent sur 300 actions.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/signes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

- [ ] **Step 4: Relancer tout le moteur**

Run: `npx vitest run engine && npm run typecheck`
Expected: PASS. Les tests de la face 2 du lot 1 qui attendent `bruit_lointain` peuvent devoir changer de graine : dans ce cas, garder ce qu'ils vérifient et le dire dans le commit.

- [ ] **Step 5: Commit**

```bash
git add engine
git commit -m "engine : sur la face 2, IA Station signale parfois un fait vrai, une ou deux fois par partie"
```

---

### Task 4: Textes du poste et des messages d'IA Station

**Files:**
- Modify: `content/textes/types.ts` : `TypeRecit` (`terminal_connecte`) ; champs `signesIA` et `momentSigne` ; raison `sans_mot_de_passe`
- Modify: `content/textes/univers.ts` : les messages d'IA Station (couche univers) et le récit de la connexion
- Modify: `content/textes/morceaux.ts` : les deux textes de la raison `sans_mot_de_passe` (comme `sans_carte`, l. 99 et 110)
- Modify: `content/catalogue/textes.ts` : les noms et descriptions de `cat_surveillance`, `cat_terminal` et `cat_post_it`
- Modify: `content/textes/rendu.ts` : `texteAssistance(textes, message, signe?)`, `rendreMoment` pour `signe`
- Modify: `content/textes/fin.ts` : un message de signe compte comme un signe perçu, comme `bruit_lointain`
- Modify: `tools/check-texts.ts` : les gabarits des signes (`{piece}`, `{passage}`) et de la connexion
- Test: `content/textes/rendu.test.ts`, `content/textes/fin.test.ts`

**Interfaces:**
- Consumes : `terminal_connecte` (tâche 1), `SignePublic` et `MomentMessage` `signe` (tâche 3).
- Produces : `texteAssistance(textes: TextesMonde, message: string, signe?: SignePublic): string`. Avec un signe, elle choisit une variante de `textes.signesIA[signe.sorte]` (pour `materiel`, selon l'appareil) et remplit `{piece}` ou `{passage}` avec `nomDe`.

Textes de départ, deux variantes au moins par clé (sauf celles du post-it, une par code) :

| Clé | Exemple |
| --- | --- |
| `signesIA.porte` | « {passage:Porte} : intégrité compromise. Une intervention de maintenance a été planifiée. Merci de votre patience. » (le passage dit ses deux pièces, « Porte entre la remise et la coursive B ») |
| `signesIA.materiel.camera` | « Caméra {de:piece} : liaison perdue. Un technicien sera dépêché dès que possible. » |
| `signesIA.materiel.capteur` | « Capteur de maintenance {de:piece} : liaison perdue. Aucune action n’est requise de votre part. » |
| `signesIA.passage` | « {Piece} : détecteur de présence déclenché, puis rétabli. Aucune action n’est requise. » |
| `signesIA.presence` | « {Piece} : obstruction de la ventilation signalée. Merci de ne pas encombrer les bouches d’aération. » ; aussi l'éclairage, un capteur de porte, une variation de pression |
| `momentSigne` | « en cours de route » |
| `terminal_connecte` | « Vous tapez le code du post-it. ACCÈS AUTORISÉ. PLAN DE LA STATION CHARGÉ. » |
| `sans_mot_de_passe` | « Le terminal demande un mot de passe : rien n’a été joué. » ; « {le:cible} demande un mot de passe. » |
| `cat_surveillance` | « salle de surveillance », f, s ; « Un comptoir, trois écrans, une chaise qui tourne encore. Un terminal attend qu’on le touche. » |
| `cat_terminal` | « terminal », m, s ; « Un terminal de sécurité. Écran de connexion : IDENTIFIANT AGENT DE GARDE, MOT DE PASSE ________. » |
| `cat_post_it` | « post-it », m, s ; « Un post-it jaune, une écriture pressée : « garde — K7-ORION ». » (six variantes, six codes) |

Les gabarits exacts (`{de:piece}`, la majuscule en tête) suivent ceux qui existent déjà dans `rendu.ts`. Si un gabarit manque, on le crée dans le style des autres.

- [ ] **Step 1: Écrire les tests qui échouent**

- `texteAssistance` avec `{ sorte: 'presence', piece: <dortoir> }` donne une variante qui contient « Dortoir », sans aucun mot de `MOTS_MENACE`.
- Le récit de `terminal_connecte` contient « ACCÈS AUTORISÉ ».
- L'écran de fin d'une partie où seul un message de signe l'a signalée dit qu'elle a été perçue.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run content/textes`
Expected: FAIL.

- [ ] **Step 3: Implémenter et écrire les textes**

- [ ] **Step 4: Relancer**

Run: `npx vitest run content tools/check-texts.test.ts tools/couches.test.ts && npm run check:texts && npm run typecheck`
Expected: PASS. Aucun mot de menace n'est hors de sa couche, et les messages d'IA Station sont sans chiffre.

- [ ] **Step 5: Commit**

```bash
git add content tools/check-texts.ts
git commit -m "textes : salle de surveillance, post-it et messages d'IA Station"
```

---

### Task 5: La salle dans les grandes stations, republication et mesures

**Files:**
- Modify: `content/catalogue/pieces.ts` : `export const SALLE_SURVEILLANCE: DefMorceau`, une annexe `a-surveillance` (`commandement`, `impasse`, étiquettes `[]`, porte `tiree`) avec l'objet `o-terminal` (`portable: false`, `terminal: true`, `exige: 'o-post-it'`). Elle ne va **pas** dans `PIECES_CATALOGUE`.
- Modify: `engine/station.ts` : `DefStationGrande.surveillance?: { readonly salle: DefMorceau; readonly part: number }`
- Modify: `engine/grande.ts` : `etendreUneFois`
- Modify: `content/stations/grandes.ts` : `surveillance: { salle: SALLE_SURVEILLANCE, part: PART_SURVEILLANCE }`, `PART_SURVEILLANCE = 0.2` au départ, et `VERSION_GENERATEUR = 4`
- Modify: `tools/controles-grande.ts` : admettre le terminal, le post-it et les caméras, et contrôler leurs règles
- Modify: `content/stations/grandes-publiees.ts`, `tools/grandes-temoins.json`, `tools/grandes-sans-station.json` : écrits par `publier:grandes`
- Test: `engine/grande.test.ts`, `tools/grandes.test.ts`

**Interfaces:**
- Consumes : `DefObjet.terminal`, `DefMonde.cameras` (tâche 1) ; les noms `cat_surveillance`, `cat_terminal`, `cat_post_it` (tâche 4).

Règles dans `etendreUneFois`, toutes tirées par `sousGraine(graine, …)` :
1. **La salle.** Juste après `poserAnnexes`, si `entier32(sousGraine(graine, 'surveillance')) / 2 ** 32 < part` : parmi les annexes posées de forme `impasse`, on garde celles qui ne sont ni dans le segment de la pièce de la capsule ni dans la pièce de départ de la créature. On en tire une, et on remplace son `annexe` par la salle. Le rectangle et la porte ne changent pas. Sans candidate, pas de salle. Le reste (clés, butin, documents) lit ensuite les étiquettes vides de la salle : elle ne reçoit ni clé, ni butin, ni document de l'univers.
2. **Le post-it**, après `disperserCles`. Il va dans une annexe qui n'est pas la salle, pas le repaire, pas dans le segment de la capsule, et qui ne garde aucune clé. Objet `{ id: 'o-post-it', nom: 'cat_post_it', piece, portable: true }`. Il est ajouté aux `objets` avant le butin : son impasse ne devient pas une salle de butin.
3. **Les caméras**, à la fin. Parmi les pièces dessinées, sauf la salle, on en tire `Math.round(n / 3)`. Les `Math.round(nombre / 3)` premières tirées sont `hs: true`. Elles vont dans `DefMonde.cameras`.
4. Sans salle, il n'y a ni post-it ni caméras.

`controles-grande.ts` vérifie :
- au plus un terminal, dans une impasse du catalogue, hors du segment de la capsule ;
- un post-it seulement avec un terminal, jamais dans la salle ni le repaire ;
- des caméras seulement avec un terminal, à environ un tiers des pièces (±1), dont un tiers en panne (±1).

Le lot 3 a perdu une republication entière parce que `CHAMPS_BUTIN` refusait le capteur : relire tous les contrôles d'objets et de pièces de ce fichier avant de republier.

- [ ] **Step 1: Écrire les tests qui échouent**

- `engine/grande.test.ts` : pour une graine sous la part, le monde a une pièce `cat_surveillance` avec le terminal, un post-it ailleurs, et des caméras sur environ un tiers des pièces. Pour une graine au-dessus, il n'a ni terminal, ni post-it, ni caméras, et ses pièces, liaisons et objets sont ceux du même assemblage sans `surveillance`.
- `tools/grandes.test.ts` : sur les 400 premières stations publiées, reconstruites par le catalogue, la part qui a un terminal est entre 0,15 et 0,25. Chacune passe `controles-grande`. Une station sans salle reste jouable.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/grande.test.ts tools/grandes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter, et mesurer `main` pendant ce temps**

Run, dans `C:\dev\void_walker` sur `main`, en arrière-plan : `npm run mesurer:difficulte`. Garder par profil les évacuations, défaites, abandons, la durée médiane en actions et la part des parties avec une rencontre.

- [ ] **Step 4: Régler la part avant de republier**

Sur les graines de la liste publiée actuelle (`g3-…-<graine>`), compter celles que le tirage `'surveillance'` met sous la part. Si la part obtenue sort de 0,17 à 0,23, ajuster `PART_SURVEILLANCE` jusqu'à y entrer, et noter la valeur retenue. Au lot 3, le tirage seul donnait 0,62 et la liste publiée 0,19 : c'est la liste qui compte.

- [ ] **Step 5: Republier, en arrière-plan, PC tenu éveillé**

Run: `npm run publier:grandes -- --tout --processus=<cœurs - 1>` (44 090 s au dernier passage complet).
Expected: un nombre de stations publiées proche des 1 971 actuelles, toutes en `g4-`. S'il y en a nettement moins, s'arrêter et le dire : la salle ne change ni le plan ni la preuve.

- [ ] **Step 6: Vérifier et mesurer la branche**

Run: `npm run check:stations && npx vitest run tools/grandes.test.ts cli`
Expected: PASS.
Puis `npm run mesurer:difficulte` sur la branche, à comparer à `main` (step 3). Les bots n'utilisent pas le terminal. Seuls les messages d'IA Station, qui remplacent des bruits lointains, peuvent changer les chiffres, et de peu.

- [ ] **Step 7: Commit**

```bash
git add engine content tools
git commit -m "contenu : salle de surveillance, post-it et caméras dans les grandes stations (version 4)"
```

---

### Task 6: La fenêtre du poste, l'icône de caméra, les messages et la CLI

**Files:**
- Create: `app/FenetrePoste.tsx`
- Modify: `app/EcranJeu.tsx` : l'ouverture de la fenêtre sur `terminal_connecte`, sa fermeture, et `ModaleIA` pour les signes
- Modify: `app/jeu.ts` : `historiqueAffiche` (les signes), `camerasChangees`, `fermerPoste`
- Modify: `app/carte/vue.ts`, `app/carte/PlanCarte.tsx` : l'icône `camera` et la prop `cameras`
- Modify: `app/styles.css` : `.fenetre-poste` (comme la bulle de carte), `.icone-camera` (à la suite de `.icone-capteur`), `.repere-direct`
- Modify: `app/libelles/fr.ts` : `poste: { titre: 'SURVEILLANCE', direct: '● DIRECT', attendre: 'Attendre', quitter: 'Quitter', aucun: 'Aucun mouvement.' }`
- Modify: `cli/` : la commande `surveiller`, et les caméras listées en mots quand l'observation les porte
- Test: `app/jeu.test.ts`, `app/FenetrePoste.test.tsx`, `app/EcranJeu.test.tsx`, `app/carte/carte.test.tsx`, `cli/*.test.ts`

**Interfaces:**
- Consumes : `Observation.cameras`, `terminal_connecte` (tâche 1) ; `texteAssistance` avec un signe (tâche 4).
- Produces :
  - `jeu.ts` :
    - `export function camerasChangees(avant: Observation['cameras'], apres: Observation['cameras']): readonly { readonly piece: RefPiece; readonly etat: EtatCapteur }[]` ;
    - `export function fermerPoste(observation: Observation, alertes: readonly number[], dangers: readonly unknown[]): boolean`. Elle est vraie si `observation.cameras` est absent ou si le pas a une alerte de menace ou un danger (Review Focus 1).
  - `FenetrePoste` : `{ readonly carte: CartePublique; readonly cameras: NonNullable<Observation['cameras']>; readonly ligne: readonly { readonly texte: string; readonly alerte: boolean }[]; readonly attendre: () => void; readonly quitter: () => void; readonly textes: TextesMonde }`.
  - `PlanCarte` : prop `cameras?: ReadonlyMap<string, EtatCapteur>` (par identifiant public de pièce), absente hors de la fenêtre du poste.

Règles :
- **Fenêtre (variante A).** Elle est plein cadre, comme la bulle de carte, verte. En-tête : `SURVEILLANCE` et `● DIRECT` en `--alerte`, qui clignote doucement (fixe en mouvement réduit). Au milieu, le plan de `observation.carte`, avec les caméras. En bas, la ligne, puis ATTENDRE (plein) et QUITTER.
  - ATTENDRE joue l'option `attendre` du menu.
  - QUITTER ferme la fenêtre sans jouer.
  - La ligne dit `<PIÈCE> : MOUVEMENT.` en rouge pour une caméra passée à `mouvement`, et `<PIÈCE> : calme.`, `brouillée.` ou `plus de signal.` pour les autres changements. Sinon, elle dit `Aucun mouvement.`.
- **Ouverture et fermeture.** La fenêtre s'ouvre après le pas qui contient `terminal_connecte`. Après chaque pas, elle se ferme si `fermerPoste` est vrai.
- **Icône de caméra**, dessinée autour de (0, 0) d'après la maquette : un carré de 14 de côté, avec un objectif de rayon 3.
  - calme : contour et objectif `--vert` ;
  - mouvement : plein `--alerte`, objectif `--vert-fond`, deux ondes de chaque côté ;
  - brouillée : contour `--vert-secondaire` en tirets `2 2`, sans objectif ;
  - hs : contour `--vert-secondaire`, barre de (-10, -10) à (10, 10).
  - L'attribut `data-etat` porte l'état, et la forme le dit sans la couleur.
- **Lecteur d'écran.** La fenêtre est un `dialog` titré « Surveillance ». Chaque caméra est lue « Caméra de la remise : mouvement ». La ligne est dans une région `aria-live="polite"`.
- **Messages d'IA Station.** `historiqueAffiche` rend un signe par `texteAssistance(textes, message, signe)`, avec le moment « en cours de route ». Le « ! » d'IA STATION et le son d'arrivée viennent du système d'aujourd'hui : rien à ajouter.
- **Le refus `sans_mot_de_passe`** s'affiche comme `sans_carte` aujourd'hui.

- [ ] **Step 1: Écrire les tests qui échouent**

- `camerasChangees` : la remise passe de `calme` à `mouvement`, et seule la remise est rendue.
- `fermerPoste` : vraie sans `cameras` ; vraie avec une alerte de menace ; fausse pour une attente calme dans la salle.
- `FenetrePoste` rendue : `dialog` « Surveillance », deux `icone-camera` dont l'une a `data-etat="mouvement"`, la ligne « REMISE : MOUVEMENT. » en rouge (classe d'alerte), et les boutons ATTENDRE et QUITTER.
- `EcranJeu` : après `terminal_connecte`, la fenêtre est ouverte. Après un pas où la créature entre dans la salle, elle est fermée et le récit montre l'entrée (Review Focus 1).
- `ModaleIA` affiche le texte d'un signe `presence` avec le nom de la pièce.
- La CLI accepte `surveiller terminal` et liste les caméras en mots une fois connectée.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run app cli`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

- [ ] **Step 4: Relancer, puis regarder l'appli**

Run: `npx vitest run app cli && npm run typecheck`
Expected: PASS.
Puis lancer la préversion `surveillance` (skill `run`), à 390 px. Jouer une grande station republiée avec une salle de surveillance (la carte révélée aide à la trouver) :
- toucher le terminal sans le post-it ;
- prendre le post-it ;
- se connecter, attendre jusqu'à un mouvement, puis quitter et ouvrir la carte.

Prendre quatre captures pour la PR : le refus, la fenêtre avec une caméra rouge, la carte révélée, et un message d'IA Station.

- [ ] **Step 5: Commit**

```bash
git add app cli
git commit -m "appli : fenêtre du poste en direct, icône de caméra et messages d'IA Station"
```

---

### Task 7: Décisions, docs et PR

**Files:**
- Modify: `docs/03-decisions.md` : D-355 et suivantes, statut « Validé » le 2026-10-23 sur maquette, avec renvoi aux maquettes et à ce plan :
  - D-355 : salle de surveillance, à part, dans 20 % des grandes stations, terminal à mot de passe sur post-it (précise D-337, #241) ;
  - D-356 : la connexion révèle la carte pour de bon ; portes et feu figés à la consultation ; ni objets ni passage caché ;
  - D-357 : les caméras, en direct dans la fenêtre seulement, une pièce sur trois, un tiers en panne au départ, pannes et destructions comme le capteur ;
  - D-358 : la fenêtre plein cadre (variante A), ATTENDRE et QUITTER, et sa fermeture d'elle-même ;
  - D-359 : les messages d'IA Station de la face 2 : quatre sortes, pièces nommées, un ou deux par partie (précise D-338, D-046).

  Les choix de l'agent sont marqués « [Détail de l'agent] », avec la part retenue (`PART_SURVEILLANCE`), la durée de la republication et le tableau des mesures. Mettre à jour l'index des thèmes et la ligne de mise à jour en tête. Vérifier d'abord que D-355 est libre sur `main`, et renuméroter sinon.
- Modify: `docs/14-carte.md` : la carte révélée par le poste et l'icône de caméra.
- Modify: `docs/12-interface-ecrans.md` : la fenêtre du poste.
- Modify: `docs/17-univers.md` §7 : IA Station nomme des pièces dans les messages de la face 2.
- Modify: `docs/contrats/C-03-temps-reactions.md` : caméras et signes dans le pas.
- Modify: `docs/superpowers/specs/2026-10-21-creature-mobile-design.md` : en-tête et §12 n° 8 et 10, avec renvoi à D-355.
- Modify: `docs/00-lire-en-premier.md` : une ligne d'état.

- [ ] **Step 1: Écrire les docs**

- [ ] **Step 2: Vérifier**

Run: `npm run verify`
Expected: PASS, liens et textes compris.

- [ ] **Step 3: Commit, puis PR seulement avec l'accord du porteur**

```bash
git add docs
git commit -m "docs : salle de surveillance et messages d'IA Station, décisions D-355 à D-359"
```

La PR cite la conception, les maquettes, le tableau des mesures, la part des stations avec une salle, les captures de la tâche 6 et les choix de l'agent. Elle dit ce que le porteur doit essayer sur téléphone :
- si chercher le post-it est un bon moment ;
- si la fenêtre du direct se lit à 390 px et si attendre devant les caméras est tendu ;
- si la carte révélée se lit avec les portes figées ;
- si un ou deux messages d'IA Station par partie se remarquent et restent justes, sans tenir la main ;
- si les chances de panne et de destruction des caméras sont justes.
