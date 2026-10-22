# Créature mobile, lot 2 : écouter en attendant — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dans les grandes stations, ATTENDRE écoute aussi à toutes les portes de la pièce, ouvertes ou fermées. Chaque porte donne net, vague ou rien. Les pièces aveugles ne répondent que par leur bruit. Aux attentes suivantes, seul ce qui a changé est redit, et un « net » s'affiche en rouge avec le repère BRUIT.

**Architecture:** le jet d'écoute est un tirage « hors dés », haché sur la graine, le numéro d'action et la liaison, comme le dé de rencontre (`engine/rencontre.ts`). Rien n'entre au journal, et la preuve, qui retire `rencontre` (`sansErrance`), ne change pas. Il n'y a donc pas de republication. Un module pur `engine/ecoute.ts` calcule les jets et ce qu'il faut raconter. `jouer` (`engine/partie.ts`) les branche après les signes de la face 2 et garde le dernier résultat dans un champ d'état absent ailleurs. Les textes vivent dans la couche menace et sont repris par les mondes écrits en entier.

**Tech Stack:** TypeScript 6, Vitest 4, tsx ; moteur pur dans `engine/`, textes en couches dans `content/textes/`, appli React dans `app/`.

**Spec:** [docs/superpowers/specs/2026-10-21-creature-mobile-design.md](../specs/2026-10-21-creature-mobile-design.md) (§4.1, §4.4). Maquette validée : [docs/maquette/ecouter.html](../../maquette/ecouter.html).

## Ce que le porteur a tranché (2026-10-22, sur maquette)

- **Q-2 : fusion avec ATTENDRE.** Il n'y a pas de bouton Écouter. ATTENDRE fait passer un tour et écoute. Raison donnée par le porteur : « un joueur prudent écoutera systématiquement à toutes les portes ». Regarder reste gratuit et n'écoute pas.
- **Toutes les portes**, ouvertes comme fermées.
- **Récit porte par porte** à la première attente.
- **Ensuite, seul ce qui a changé est redit** (onglets 1 à 6 de la maquette).
- **Un « net » en rouge.** Le mouvement entendu par une porte ouverte (`bruit_creature`, OP-01), qui arrive sans qu'on attende, s'affiche aussi en rouge.

## Choix de l'agent dans ce plan (à signaler au porteur)

- **Grandes stations seulement** (monde à `rencontre`), comme le lot 1 (D-342). Ailleurs, ATTENDRE reste tel quel.
- **Tables du jet** (seuils à mesurer), un d6 par porte :

  | Derrière la porte | net | vague | rien |
  | --- | --- | --- | --- |
  | elle est là, porte fermée | 1–3 | 4–5 | 6 |
  | elle est là, porte ouverte | 1–5 | 6 | — |
  | elle n'y est pas | — | 1 | 2–6 |

  « Vague » arrive aussi sans elle, sinon ce résultat serait une certitude. « Net » n'arrive jamais sans elle. Seule la pièce juste derrière la porte compte.
- **Pièces aveugles :** une salle des machines en marche (`assourdie`) ou une chambre froide (`chambreFroide`). Pas de jet. Le récit dit le grondement (« on croit y entendre des coups, sans savoir lesquels ») ou le compresseur. Ce bruit est constant : dit une fois, jamais redit. C'est le seul « mensonge », et sa cause est visible.
- **Joueur dans une salle des machines en marche :** une seule phrase, « le vacarme couvre tout », à la première attente. Ensuite, plus rien.
- **Redire un « net » à chaque attente** sous une forme courte (« ça bouge toujours »). Sinon, le repère BRUIT tomberait alors que le danger est là. Un « net » ou un « vague » qui cesse se dit « plus rien ».
- **Repère BRUIT et aperçu :** un « net » (ou « toujours ») est retenu comme un bruit entendu (`reperes.entendue`, D-181), comme le bruit proche de la face 2. Il pose le repère BRUIT jusqu'à l'action suivante (D-267). Le bruit proche de la face 2 (`bruit_proche`) pose aussi BRUIT et passe aussi en rouge, par cohérence : c'est un « net » donné par le dé.
- **Rouge sur la phrase entière** (« Derrière la porte de la cuisine, quelque chose bouge. ») et non sur sa seconde moitié comme dans la maquette. C'est le mécanisme existant des phrases d'alerte (`alertesMenace`). Écart à montrer au porteur.
- **Pas d'écoute quand le pas la perçoit déjà** (`SIGNES_CREATURE` de `partie.ts`), ni quand elle est en vue : le récit dit déjà où elle est. Le dernier résultat gardé ne change pas.
- **Pas de son nouveau :** il n'y a pas d'action nouvelle, et ATTENDRE garde son son.
- **Sauvegardes : rien à coder.** Une autre version est déjà refusée (`reprendrePartie` compare `version`, D-341).

## Global Constraints

- Moteur pur et déterministe : aucun `Math.random`, aucune horloge. Le jet passe par `hacher`, comme `faceRencontre`. Aucun tirage n'entre au journal.
- Un monde sans `rencontre` donne exactement le même état, les mêmes événements et la même empreinte qu'avant.
- Le champ d'état nouveau est **absent** tant qu'il ne sert pas, comme `enfoncees` dans `engine/etat.ts`. On le retire par déstructuration, sans écrire `undefined` (exactOptionalPropertyTypes).
- Un indice ne ment jamais, sauf le grondement des machines, à cause visible. On ne nomme jamais la créature hors de la couche menace (`MOTS_MENACE`). On ne dit jamais « elle est derrière cette porte » : « quelque chose bouge » suffit.
- Textes : vrai français, au ton du jeu, courts pour le téléphone. Exemples tirés de la maquette ; texte final non validé par le porteur.
- Commentaires et noms en français, dans le style du fichier touché, avec la référence de décision entre parenthèses (D-343 et suivantes, tâche 6).
- Vérification de chaque tâche : `npm run typecheck`, `npm run lint`, `npx vitest run <fichiers touchés>` ; avant la PR : `npm run verify`.

## Review Focus

1. **Attentes du message de patience (D-289).** Quand rien n'a changé, ATTENDRE ne doit rendre que `attente`. Sinon, les textes de la 5e et de la 10e attente et le message de la 15e ne viennent plus jamais en grande station. Test en tâche 2.
2. **Rejeu et reprise d'une partie qui a écouté :** `rejouer` redonne la même empreinte, et les tirages du journal ne changent pas. Test en tâche 2.
3. **Changement de pièce entre deux attentes** (ou toute autre action) : la première attente qui suit redit tout. Elle ne compare jamais avec les portes d'une autre pièce. Test en tâche 2.
4. **Porte enfoncée ou ouverte entre deux attentes :** la table « ouverte » s'applique dès l'attente suivante, et le récit ne dit que ce qui a changé. Test en tâche 1.
5. **Créature dans l'alcôve de la pièce voisine, ou inerte :** dans l'alcôve, elle compte comme présente ; inerte (neutralisée), comme absente. Test en tâche 1.

---

### Task 1: Le jet d'écoute

**Files:**
- Create: `engine/ecoute.ts`
- Modify: `engine/vocabulaire.ts` (les deux types, à côté des événements, pour que `etat.ts` et `vocabulaire.ts` n'importent pas `ecoute.ts`)
- Test: `engine/ecoute.test.ts`
- Modify: `engine/index.ts` (exports)

**Interfaces:**
- Produces:
  - dans `engine/vocabulaire.ts` : `export type Entendu = 'net' | 'vague' | 'rien' | 'machines' | 'froid'`
  - dans `engine/vocabulaire.ts` : `export type EntenduRecit = Entendu | 'toujours' | 'plus_rien'`
  - `export function faceEcoute(graine: number, action: number, liaison: string): number` : 1 à 6, `entier32(\`ecoute:${graine}:${action}:${liaison}\`)` comme dans `rencontre.ts`.
  - `export function ecouterPortes(monde: DefMonde, etat: EtatPartie, graine: number, action: number): Readonly<Record<string, Entendu>>` : une entrée par liaison de `liaisonsVisibles(monde, etat, etat.piece)` sauf les vides (`gouffre`). Elle rend `{}` si la pièce du joueur est `assourdie`.
  - `export function aRaconter(avant: Readonly<Record<string, Entendu>> | undefined, maintenant: Readonly<Record<string, Entendu>>): { readonly liaison: string; readonly entendu: EntenduRecit }[]`, dans l'ordre des clés de `maintenant`.

Règles de `ecouterPortes` : pièce voisine `machines` si `assourdie`, `froid` si `chambreFroide`, sinon un jet selon la table des choix de l'agent. La table est en constante exportée, `TABLE_ECOUTE`, avec un commentaire « seuils à mesurer ». « Elle est là » : `creatureActive(etat)` et `etat.creature.piece` est la pièce voisine, alcôve comprise. Porte ouverte : `etat.liaisons[id] === true`.

Règles de `aRaconter` :
- `avant === undefined` : tout, tel quel.
- Une liaison absente de `avant` : telle quelle.
- `net` après `net` donne `toujours`.
- `rien` après `net` ou `vague` donne `plus_rien`.
- Tout autre changement : tel quel.
- Sans changement : rien.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
describe('aRaconter (lot 2, maquette ecouter.html)', () => {
  it('première attente : tout', () => {
    expect(aRaconter(undefined, { a: 'rien', m: 'machines' })).toEqual([{ liaison: 'a', entendu: 'rien' }, { liaison: 'm', entendu: 'machines' }]);
  });
  it('rien de changé : rien ; machines et froid jamais redits', () => {
    expect(aRaconter({ a: 'rien', m: 'machines', f: 'froid' }, { a: 'rien', m: 'machines', f: 'froid' })).toEqual([]);
  });
  it('net redit en « toujours » ; net puis rien : « plus rien »', () => {
    expect(aRaconter({ a: 'net' }, { a: 'net' })).toEqual([{ liaison: 'a', entendu: 'toujours' }]);
    expect(aRaconter({ a: 'net' }, { a: 'rien' })).toEqual([{ liaison: 'a', entendu: 'plus_rien' }]);
    expect(aRaconter({ a: 'vague' }, { a: 'rien' })).toEqual([{ liaison: 'a', entendu: 'plus_rien' }]);
  });
});
```

Pour `ecouterPortes`, sur un petit monde de test à deux portes, l'une fermée et l'autre ouverte, avec une salle des machines voisine et une chambre froide voisine, sur 600 actions :
- jamais `net` derrière une porte sans elle ;
- `net` et `vague` tous deux présents derrière sa porte fermée ;
- jamais `rien` derrière sa porte ouverte ;
- `machines` et `froid` constants ;
- inerte (`neutralisee`), jamais `net` ; dans l'alcôve, présente ;
- `{}` quand le joueur est dans une salle des machines en marche ;
- la même porte passée de fermée à ouverte entre deux appels prend la table « ouverte » (Review Focus 4) ;
- même entrée, même résultat (déterminisme) ;
- la part de `net` derrière la porte fermée est entre 0,4 et 0,6.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/ecoute.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Implémenter `engine/ecoute.ts`**, puis exporter `ecouterPortes`, `aRaconter`, `faceEcoute`, `TABLE_ECOUTE`, `Entendu` et `EntenduRecit` depuis `engine/index.ts`.

- [ ] **Step 4: Relancer**

Run: `npx vitest run engine/ecoute.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine/ecoute.ts engine/ecoute.test.ts engine/index.ts
git commit -m "engine : jet d'écoute aux portes, net, vague ou rien, pièces aveugles"
```

---

### Task 2: ATTENDRE écoute, dans le pas

**Files:**
- Modify: `engine/vocabulaire.ts` : liste des types (l. ~66) et union `Evenement` (l. ~257)
- Modify: `engine/etat.ts` : champ `ecoutees` de `EtatPartie`, à côté de `enfoncees`
- Modify: `engine/partie.ts` : `jouer`, après la face 2 (l. ~385) et avant les traces fraîches
- Test: `engine/ecoute.test.ts` (bloc `describe('dans le pas')`)

**Interfaces:**
- Consumes: `ecouterPortes`, `aRaconter` (tâche 1).
- Produces:
  - `{ readonly type: 'ecoute'; readonly passage: RefPassage; readonly entendu: EntenduRecit }`
  - `{ readonly type: 'ecoute_couverte' }`
  - `EtatPartie.ecoutees?: Readonly<Record<string, Entendu>>` : le dernier résultat d'écoute, présent seulement juste après un ATTENDRE qui a écouté.

Règle dans `jouer`, seulement si `monde.rencontre !== undefined` :
1. Si la commande n'est pas `attendre`, retirer `ecoutees` s'il est présent. C'est fini pour ce pas.
2. L'écoute se calcule après la face 2. Ne rien faire si la partie est finie (vaincu, `fin`), si elle est en vue (`creatureEnVue`), ou si un événement du pas la situe déjà : un type de `SIGNES_CREATURE` ou le `bruit_proche` de la face 2. Dans ce cas, `ecoutees` reste tel quel. Un `bruit_lointain` ne la situe pas : l'écoute a lieu.
3. Sinon, calculer `maintenant = ecouterPortes(monde, conclu, graine, action)`.
   - Si `maintenant` est vide et que la pièce est `assourdie` : `ecoute_couverte`, seulement si `ecoutees` était absent.
   - Sinon, un événement `ecoute` par entrée de `aRaconter(conclu.ecoutees, maintenant)`, avec `refPassage(monde, conclu, liaison, conclu.piece)`.
   - Sur un `net` ou un `toujours`, poser `reperes.entendue = { piece: autre côté, par: liaison }`, comme `bruit_proche`.
   - Enfin, `ecoutees = maintenant`.

Les traces fraîches ne viennent qu'en changeant de pièce : elles ne croisent jamais l'écoute.

- [ ] **Step 1: Écrire les tests qui échouent**

Sur un monde à `rencontre: { rythme: 1 }`, en cherchant les graines par `faceEcoute` et `faceRencontre` :
- première ATTENDRE : un `ecoute` par porte, `attente` en tête ;
- deuxième ATTENDRE sans changement : les événements sont exactement `[{ type: 'attente' }]` (Review Focus 1) ;
- un `net` pose `reperes.entendue` sur sa liaison ;
- ATTENDRE, puis `aller`, puis ATTENDRE : la seconde redit tout et `ecoutees` est absent après `aller` (Review Focus 3) ;
- un monde sans `rencontre` : même empreinte et mêmes événements qu'avant (`[{ type: 'attente' }]`) ;
- `rejouer` d'une partie à dix ATTENDRE : même empreinte, et `tirages` identiques à ceux d'une partie identique dans un monde sans `rencontre` (Review Focus 2) ;
- joueur dans une salle des machines en marche : `ecoute_couverte` à la première attente, seulement `attente` à la suivante.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/ecoute.test.ts -t "dans le pas"`
Expected: FAIL.

- [ ] **Step 3: Implémenter**, puis laisser TypeScript lister les `switch` exhaustifs à compléter sur `Evenement['type']`.

- [ ] **Step 4: Relancer tout le moteur**

Run: `npx vitest run engine && npm run typecheck`
Expected: PASS. Les tests existants de l'errance et de la face 2 restent verts.

- [ ] **Step 5: Commit**

```bash
git add engine
git commit -m "engine : en grande station, attendre écoute aux portes et ne redit que ce qui change"
```

---

### Task 3: Textes de l'écoute et phrases en rouge

**Files:**
- Modify: `content/textes/types.ts` : `TypeRecit` exclut `ecoute` ; nouveaux champs `ecoute: Readonly<Record<EntenduRecit, Variantes>>` (gabarit `{le:passage}`) et `attenteEcoute: Variantes` ; `ecoute_couverte: []` dans la table des valeurs
- Modify: `content/textes/menace.ts` : textes de `ecoute`, `ecoute_couverte`, `attenteEcoute`
- Modify: `content/textes/couches.ts` : `export const TEXTES_ECOUTE` et `ATTENTE_ECOUTE` (pas `ECOUTE`, déjà pris par `engine/creature.ts`), repris de `reunir([])` comme `TRACES`
- Modify: `content/ar-01/textes.ts`, `content/ar-02/textes.ts`, `content/monde-test/textes.ts` : reprendre `TEXTES_ECOUTE` et `ATTENTE_ECOUTE`
- Modify: `content/textes/rendu.ts` : `variantesDe`, `valeursEvenement`, `rendreEvenements`, `estMenaceOuDegat`
- Modify: `content/textes/fin.ts` : `PERCUE` compte un `ecoute` net ou toujours
- Modify: `tools/check-texts.ts` : vérifier les gabarits de `ecoute` (paramètre `passage`) et de `attenteEcoute` (aucun), comme `attentesLongues` (l. 213)
- Test: `content/textes/rendu.test.ts`

**Interfaces:**
- Consumes: `Evenement` `ecoute` et `ecoute_couverte` (tâche 2).
- Produces: `alertesMenace(evenements)` inclut le rang des `ecoute` net ou toujours, de `bruit_creature` et de `bruit_proche`.

Règles de rendu :
- `variantesDe` : `ecoute` donne `textes.ecoute[evenement.entendu]`.
- Dans `rendreEvenements`, une `attente` suivie d'un `ecoute` ou d'un `ecoute_couverte` prend `textes.attenteEcoute` au lieu de `evenements.attente`. Sinon, « Rien ne bouge. » contredirait la suite.

Textes de départ, à reprendre de la maquette (deux variantes au moins pour `net`, `rien` et `attenteEcoute`) :

| Clé | Exemple |
| --- | --- |
| `attenteEcoute` | « Vous restez immobile, l’oreille tendue. » |
| `net` | « Derrière {le:passage}, quelque chose bouge. Un poids qui se déplace, lentement. » |
| `toujours` | « Derrière {le:passage}, ça bouge toujours. » |
| `vague` | « Derrière {le:passage}, peut-être un frottement. Ou le métal qui travaille. » |
| `rien` | « Derrière {le:passage}, rien. » |
| `plus_rien` | « Derrière {le:passage}, plus rien. » |
| `machines` | « Derrière {le:passage}, le grondement des machines couvre tout ; on croit y entendre des coups, sans savoir lesquels. » |
| `froid` | « Contre {le:passage}, le métal glacé ne laisse passer que le ronron du compresseur. » |
| `ecoute_couverte` | « Le vacarme des machines couvre tout : impossible d’entendre ce qui se passe derrière les portes. » |

« Derrière » se lit aussi pour une porte ouverte (« derrière la porte du sas »), et `{le:passage}` nomme le passage avec sa destination.

- [ ] **Step 1: Écrire les tests qui échouent**

- `[{ type: 'attente' }, ecoute net sur la cuisine]` rend deux phrases. La première est une variante de `attenteEcoute`, la seconde contient le nom du passage. `alertesMenace` vaut `[1]`.
- `[{ type: 'attente' }]` seul garde les textes de la 5e et de la 10e attente (test D-289 existant, inchangé).
- `alertesMenace([{ type: 'bruit_creature', passage }])` vaut `[0]`. Même chose pour `bruit_proche`. Un `ecoute` vague donne `[]`.

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
git commit -m "textes : écoute porte par porte, net et bruit de la créature en rouge"
```

---

### Task 4: Repère BRUIT dans l'appli

**Files:**
- Modify: `app/ecran.ts` : la fonction des passages entendus au dernier pas (l. 121-123)
- Test: `app/ecran.test.ts`

**Interfaces:**
- Consumes: `Evenement` `ecoute` (tâche 2).

Règle : le repère BRUIT d'un passage vient de `partie.derniers`, avec `bruit_creature` (comme aujourd'hui), `bruit_proche`, et `ecoute` dont `entendu` est `net` ou `toujours`. Il dure jusqu'à l'action suivante (D-267). Rien ne change dans le dock : ATTENDRE garde sa place à côté de Regarder (D-274).

- [ ] **Step 1: Écrire le test qui échoue**

Une partie dont `derniers` contient `ecoute` net sur le passage P : la ligne de P porte `'bruit'`. Avec `ecoute` vague, elle ne le porte pas. Avec `bruit_proche`, elle le porte.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run app/ecran.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

- [ ] **Step 4: Relancer, puis regarder l'appli**

Run: `npx vitest run app && npm run typecheck`
Expected: PASS.
Puis lancer l'appli en préversion (skill `run`), jouer une grande station à 390 px, attendre devant une porte fermée et faire une capture du rouge et du repère BRUIT pour la PR. Les options des versions de test révèlent la carte et la créature, ce qui aide à se placer.

- [ ] **Step 5: Commit**

```bash
git add app
git commit -m "appli : repère BRUIT pour un net entendu en attendant et pour le bruit proche"
```

---

### Task 5: Le bot averti écoute, et les mesures

**Files:**
- Modify: `tools/bots.ts` : `botExplorateur`, profil `averti`
- Test: `tools/bots.test.ts`

**Interfaces:**
- Consumes: le repère d'aperçu (`vue.apercu(option).risque`), qui monte à `modere` après un net (D-181) ; `Evenement` `ecoute`.

Règle : averti, à sa première arrivée dans une pièce qui a au moins un passage fermé vers une pièce pas encore visitée, il joue ATTENDRE une fois avant tout autre choix. Le malus de risque existant fait le reste. Les autres profils ne changent pas.

- [ ] **Step 1: Écrire le test qui échoue**

Le bot averti, dans un petit monde à `rencontre` dont la première pièce a une porte fermée vers l'inconnu : son premier choix est `attendre`. Le bot prudent, non.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run tools/bots.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

- [ ] **Step 4: Mesurer avant et après, en arrière-plan**

Run: `npm run mesurer:difficulte` sur `main`, puis sur la branche.
Garder, par profil : évacuations, défaites, abandons, durée médiane en actions et part des parties avec une rencontre. Comparer l'averti au prudent et au pressé. Critères de la conception : un prudent qui écoute s'en sort mieux qu'un pressé, et une partie au moins aussi longue qu'aujourd'hui. Mesurer aussi, sur la branche, la part des attentes avec un net quand elle est derrière une porte fermée. Si l'averti ne gagne rien, le dire au porteur avec les chiffres plutôt que de retoucher la table en silence.

- [ ] **Step 5: Vérifier que les stations ne bougent pas**

Run: `npm run check:stations`
Expected: PASS, sans republication. La preuve retire `rencontre`, donc l'écoute n'y joue pas. Si ce n'est pas le cas, s'arrêter et le dire.

- [ ] **Step 6: Commit**

```bash
git add tools
git commit -m "outils : le bot averti écoute avant d'ouvrir vers l'inconnu"
```

---

### Task 6: Décisions, contrat et PR

**Files:**
- Modify: `docs/03-decisions.md` : D-343 et suivantes, statut « Validé » le 2026-10-22 sur maquette, avec renvoi à la maquette et à ce plan :
  - D-343 ATTENDRE écoute à toutes les portes, pas de bouton Écouter (Q-2 tranchée) ;
  - D-344 jet net, vague ou rien et sa table, seulement la pièce voisine, hors journal ;
  - D-345 pièces aveugles, et le vacarme de la salle des machines du joueur ;
  - D-346 ne redire que ce qui change, net redit, « plus rien » ;
  - D-347 en rouge et avec BRUIT : net, mouvement entendu par une porte ouverte, bruit proche.

  Les choix de l'agent sont marqués « [Détail de l'agent] ». Mettre à jour l'index des thèmes (l. 31) et la ligne de mise à jour en tête.
- Modify: `docs/contrats/C-03-temps-reactions.md` : l'écoute dans la section créature mobile du lot 1.
- Modify: `docs/superpowers/specs/2026-10-21-creature-mobile-design.md` : Q-2 tranchée (§4.1, §11), avec renvoi à D-343.
- Modify: `docs/00-lire-en-premier.md` : une ligne d'état.
- Add: `docs/maquette/ecouter.html` (déjà sur la branche).

- [ ] **Step 1: Écrire les docs**

- [ ] **Step 2: Vérifier**

Run: `npm run verify`
Expected: PASS, liens et textes compris.

- [ ] **Step 3: Commit et PR, avec l'accord du porteur**

```bash
git add docs
git commit -m "docs : écoute en attendant, décisions D-343 à D-347"
```

La PR cite la conception, la maquette, le tableau des mesures, la capture de la tâche 4, les choix de l'agent et ce que le porteur doit essayer sur téléphone. Il doit dire :
- si attendre devant une porte devient un réflexe utile ;
- si net, vague et rien se lisent bien ;
- si le rouge aide sans tenir la main ;
- si le texte reste court quand on attend plusieurs fois.
