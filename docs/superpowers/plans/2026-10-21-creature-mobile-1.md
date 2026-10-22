# Créature mobile, lot 1 : la créature bouge — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dans les grandes stations, la créature erre seule dans son territoire au rythme d'un dé de rencontre, laisse des signes et des traces fraîches, et force lentement une porte vers un bruit fort ; les stations restent prouvées.

**Architecture:** le dé de rencontre est un tirage « hors dés », haché sur la graine de partie et le numéro d'action, comme les bruits de station (`engine/bruits.ts`) : rien n'entre au journal des tirages, le rejeu et la preuve « sans dé ni blessure » tiennent. L'errance est une branche de plus de `reaction()` dans `engine/creature.ts`, prise seulement là où la créature attendrait. Le monde porte `rencontre` ; l'assemblage d'une grande station le pose et ouvre des portes au départ pour donner un territoire ; le vérifieur retire `rencontre` avant de prouver.

**Tech Stack:** TypeScript 6, Vitest 4, tsx ; moteur pur dans `engine/`, textes en couches dans `content/textes/`.

**Spec:** [docs/superpowers/specs/2026-10-21-creature-mobile-design.md](../specs/2026-10-21-creature-mobile-design.md)

## Découpage de la conception

Ce plan couvre le lot 1 de la conception (§13), sauf l'écoute. Les autres lots auront chacun leur plan :

| Lot | Contenu | Prérequis |
| --- | --- | --- |
| **1 (ce plan)** | Territoire, errance au dé, signe « bruit lointain », traces fraîches, forcer lentement, portes ouvertes au départ, preuve | — |
| 2 | Écouter à une porte (§4.1), pièces aveugles (§4.4) | maquettes téléphone de Q-2 |
| 3 | Capteurs et drone éclaireur en butin (§4.2, §4.6) | maquettes |
| 4 | Poste de sécurité (§4.3, #241), messages d'IA Station (§4.5) | maquettes |
| 5 | Réglage de difficulté (§7), plusieurs créatures et état en liste (§8, #217) | essais des lots 1 à 4 |

## Choix de l'agent dans ce plan (à signaler au porteur)

- **Grandes stations seulement.** Les petites stations, AR-01, AR-02 et les mondes de test n'ont pas `rencontre` et ne changent pas.
- **Départ inchangé** (écart à la conception §3.2, à valider par le porteur). La créature part de la place de sa composition (D-315, D-316 tiennent, §3.1). L'errance la disperse dans le territoire avant que le joueur arrive. Un départ tiré en plus ferait varier le monde selon la graine de partie, et la preuve devrait alors couvrir chaque départ possible. On reverra ce choix après l'essai de l'étendue.
- **Portes ouvertes, pas forcées.** L'étendue ouvre des portes au départ, et ces portes se referment. Une porte « forcée au départ » comme signe viendra avec les signes du lot 4.
- **Garantie de la preuve (§10).** On prouve chaque station sans errance **et sans forçage lent**, comme aujourd'hui : les deux tiennent à `rencontre`, que `sansErrance` retire. C'est acceptable parce que le forçage lent ne naît que d'un bruit fort que le joueur provoque ; une station rendue difficile par un forçage lent n'est pas détectée par la preuve. Choix de l'agent, à valider par le porteur. Deux règles, testées, bornent ensuite l'errance :
  1. elle n'entre jamais dans la pièce du joueur sans qu'il l'ait entendue dans sa pièce actuelle, par la liaison qu'elle prend ;
  2. son entrée suit les règles actuelles : un répit au premier contact (D-184), un avertissement ensuite (C-03 §4.4).

  La conception le permettait (« le constructeur peut en proposer une meilleure »). Des mesures par bots complètent la garantie (tâche 8).
- **Forcer lentement : seulement dans un monde à `rencontre`.** Les preuves des petites stations ne bougent pas.
- **Sauvegardes : rien à coder.** Une sauvegarde d'une autre version est déjà refusée (`reprendrePartie` compare `version` ; l'appli répond `reprise_impossible`). §9 est donc déjà tenu.
- **Pas de son nouveau** dans ce lot. Les événements nouveaux passent par la narration.

## Global Constraints

- Moteur pur et déterministe : aucun `Math.random`, aucune horloge. Tout hasard passe par `ouvrirDes` (au journal) ou par `hacher` sur la graine et le numéro d'action (hors journal).
- Un monde sans `rencontre` donne exactement le même état, les mêmes événements et la même empreinte qu'avant. Le test existant « sans indice, la créature attend au même endroit : aucune patrouille » reste vert.
- Un champ d'état nouveau est **absent** tant qu'il ne sert pas, pour que l'empreinte ne change pas ailleurs, comme `verrous` et `enfoncees` dans `engine/etat.ts`.
- Textes : vrai français, au ton du jeu, courts pour le téléphone, sans nommer la créature hors de la couche menace (`MOTS_MENACE`). Un signe ne ment jamais. Texte final non validé par le porteur.
- Ne pas tenir la main : aucun signe ne dit où est la créature ni ne change l'aperçu de risque (D-180, D-181 inchangés).
- IA Station ne parle pas dans ce lot.
- Commentaires et noms en français, dans le style du fichier touché, avec la référence de décision entre parenthèses.
- Vérification de chaque tâche : `npm run typecheck`, `npm run lint`, `npx vitest run <fichiers touchés>` ; avant la PR : `npm run verify`.

## Review Focus

1. **Joueur dans la salle des machines en marche** : il n'entend rien, donc la créature voisine ne peut pas entrer chez lui par errance. Test en tâche 3.
2. **Rejeu et reprise d'une partie où la créature a erré** : `rejouer` redonne la même empreinte. Test en tâche 3.
3. **Errance vers un vide de passerelle** : jamais par un gouffre, même avec un pont posé. Sinon la passerelle se résout par chance. Test en tâche 3.
4. **Porte ouverte au départ qui touche une pièce en feu, froide, à gravité commutable ou de machines** : jamais. Sinon les énigmes des morceaux changent. Test en tâche 7.
5. **Pendant la traque** (écoute ouverte, indice, porte en cours de forçage, fouille pas encore faite), le dé ne la déplace pas. Test en tâche 3.

---

### Task 1: Territoire de la créature

**Files:**
- Modify: `engine/creature.ts` (près de `praticable`, l. 72)
- Test: `engine/creature.test.ts` (nouveau `describe('territoire (spec créature mobile §3.1)')`)

**Interfaces:**
- Produces: `export function territoire(monde: DefMonde, etat: EtatPartie, depuis: string): string[]` : les pièces atteintes depuis `depuis` par des liaisons `praticable(...)` et non `gouffre`, `depuis` comprise, dans l'ordre de `monde.pieces`.
- Produces: `function errable(monde: DefMonde, etat: EtatPartie, liaison: DefLiaison, depuis: string): boolean` = `praticable(...) && liaison.gouffre !== true`, réutilisée par la tâche 3.

- [ ] **Step 1: Écrire les tests qui échouent**

Sur la fixture `MONDE` du fichier (a ═ab fermée═ b ═bc ouverte═ c ═cd ouverte═ d) :
```ts
it('le territoire suit les passages ouverts et praticables', () => {
  expect(territoire(MONDE, partie().etat, 'c')).toEqual(['b', 'c', 'd']);
});
it('une porte fermée, une grille étroite, une pièce en feu ou un vide le bornent', () => {
  const ferme = liaisons(MONDE, { bc: { ouverte: false } });
  expect(territoire(ferme, partie(ferme).etat, 'c')).toEqual(['c', 'd']);
  const feu = avec({ pieces: MONDE.pieces.map((p) => (p.id === 'd' ? { ...p, feu: true } : p)) });
  expect(territoire(feu, partie(feu).etat, 'c')).toEqual(['b', 'c']);
});
```
Plus un cas avec un `gouffre: true` portant un pont posé : la pièce de l'autre bord est exclue.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/creature.test.ts -t territoire`
Expected: FAIL, `territoire` n'est pas exporté.

- [ ] **Step 3: Implémenter `territoire` et `errable`**

Parcours en largeur sur `liaisonsDe`, comme `piecesSansAir` dans `engine/etat.ts`.

- [ ] **Step 4: Relancer**

Run: `npx vitest run engine/creature.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine/creature.ts engine/creature.test.ts
git commit -m "engine: territoire de la créature, pièces atteintes par des passages praticables"
```

---

### Task 2: Dé de rencontre hors journal

**Files:**
- Create: `engine/rencontre.ts`
- Create: `engine/rencontre.test.ts`
- Modify: `engine/monde.ts` (`DefMonde`, l. 189 ; `validerMonde`, près de l. 358)
- Modify: `engine/index.ts` (export)

**Interfaces:**
- Produces, dans `engine/monde.ts` : `DefMonde.rencontre?: { readonly rythme: number }`. Absent, la créature n'erre pas.
- Produces, dans `engine/rencontre.ts` :
  - `export const RYTHME_RENCONTRE = 3;` (Normal, seuil à mesurer ; porté à 1 après l’essai du porteur) ;
  - `export const FACES_RENCONTRE = 6;` ;
  - `export function faceRencontre(graine: number, action: number, rythme: number): number | null` : `null` si `action % rythme !== 0`, sinon `1 + (Number.parseInt(hacher(\`rencontre:${graine}:${action}\`).slice(-8), 16) % 6)` ;
  - `export function tirageErrance(graine: number, action: number): number` : entier 32 bits tiré de `hacher(\`errance:${graine}:${action}\`)`, pour choisir parmi les pièces voisines.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
it('hors du rythme, pas de jet', () => {
  expect(faceRencontre(7, 4, 3)).toBeNull();
});
it('même graine, même action : même face', () => {
  expect(faceRencontre(7, 6, 3)).toBe(faceRencontre(7, 6, 3));
});
it('les six faces sortent à peu près autant', () => {
  const comptes = [0, 0, 0, 0, 0, 0];
  for (let action = 1; action <= 6000; action++) comptes[(faceRencontre(11, action, 1) ?? 0) - 1]++;
  for (const compte of comptes) expect(compte).toBeGreaterThan(850);
});
```
Dans `engine/monde.test.ts` ou à côté : `validerMonde` refuse `rencontre: { rythme: 0 }` et un rythme non entier, avec le message `'Rencontre : rythme invalide.'`.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/rencontre.test.ts`
Expected: FAIL, module absent.

- [ ] **Step 3: Implémenter**

En tête de `engine/rencontre.ts`, un commentaire calqué sur celui de `bruits.ts` : le tirage ne lit que la graine et le numéro d'action, et rien n'entre au journal, donc ni la preuve ni le rejeu ne changent.

- [ ] **Step 4: Relancer**

Run: `npx vitest run engine/rencontre.test.ts engine/monde.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine/rencontre.ts engine/rencontre.test.ts engine/monde.ts engine/index.ts engine/monde.test.ts
git commit -m "engine: dé de rencontre haché sur la graine et l'action, hors journal"
```

---

### Task 3: Errance (face 1)

**Files:**
- Modify: `engine/creature.ts` (`reaction`, l. 283 ; `reagir`, l. 414 ; `fouiller`, l. 376 et son commentaire sur D-048)
- Modify: `engine/partie.ts` (`jouer`, juste avant `reagir`, l. 307)
- Test: `engine/creature.test.ts` (nouveau `describe('errance au dé de rencontre (spec créature mobile §3.2)')`)

**Interfaces:**
- Consumes: `errable`, `faceRencontre`, `tirageErrance`, `DefMonde.rencontre`.
- Produces: `reagir(monde, etat, sons, depuis, franchie, interceptee, errance: number | null = null)`, où `errance` vaut la valeur de `tirageErrance` quand la face est 1, et `null` sinon. `jouer` calcule la face une fois et la passe. La tâche 4 lit la même face.

Règles, toutes à tester :
- Elle n'erre que là où elle attendrait aujourd'hui : pas de joueur visible, pas de son retenu, `indice === null`, ni dans l'alcôve, `perdues === 0`, sans `force` ni `ecoute`. Après le contact, seulement si `fouille === true` : la fouille de D-276 passe avant, le dé se tait pendant la traque.
- Pièces candidates : celles au bout d'une liaison `errable` depuis sa pièce, triées par id de liaison. La pièce du joueur n'est candidate que si `etat.reperes.entendue?.piece === creature.piece`.
- Choix : `candidates[errance % candidates.length]`. Le pas passe par `franchir(...)` avec l'indice `{ piece: destination, par: liaison.id }` : huile, perception par le passager (OP-01), `venue` et premier contact s'appliquent tels quels.
- Le commentaire de `fouiller` qui cite D-048 dit désormais que la patrouille vient du dé de rencontre, dans un monde à `rencontre` seulement.

- [ ] **Step 1: Écrire les tests qui échouent**

Fixture : `MONDE` avec `rencontre: { rythme: 1 }`. Un helper `graineAvecFace(face, action)` cherche, de 0 à 10 000, une graine dont `faceRencontre(graine, action, 1) === face`.
```ts
it('face 1 : elle passe dans une pièce voisine de son territoire', () => { /* attendre une fois depuis a ; creature.piece passe de c à b ou d */ });
it('jamais dans la pièce du joueur sans qu’il l’ait entendue là où elle est', () => { /* joueur en b, porte bc ouverte, aucun bruit retenu : sur 50 graines à face 1, jamais b */ });
it('entendue dans sa pièce, elle peut entrer chez le joueur ; premier contact et répit comme aujourd’hui', () => {});
it('le joueur dans une salle des machines en marche ne l’entend pas : elle n’entre pas chez lui', () => {});
it('jamais par un vide, même avec un pont posé', () => {});
it('pendant la traque (écoute, indice, porte forcée, fouille à faire), le dé ne la déplace pas', () => {});
it('sans rencontre dans le monde, elle ne bouge jamais', () => {});
it('rejouer une partie où elle a erré redonne la même empreinte', () => { /* exporter puis rejouer, comparer empreinteEtat */ });
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/creature.test.ts -t errance`
Expected: FAIL.

- [ ] **Step 3: Implémenter `errer(monde, etat, creature: CreatureActive, errance: number): Reponse | undefined` dans `engine/creature.ts`, et l'appeler dans `reaction` à la branche `indice === null`, quand `fouiller` ne la ferait pas bouger**

Dans `jouer`, l'action comptée est `partie.etat.actions + 1` et la graine est `partie.enregistrement.graine`.

- [ ] **Step 4: Relancer tous les tests du moteur**

Run: `npx vitest run engine`
Expected: PASS, aucun test existant cassé.

- [ ] **Step 5: Commit**

```bash
git add engine/creature.ts engine/partie.ts engine/creature.test.ts
git commit -m "engine: la créature erre dans son territoire au dé de rencontre, jamais chez le joueur sans signe"
```

---

### Task 4: Signe « bruit lointain » (face 2)

**Files:**
- Modify: `engine/vocabulaire.ts` (liste des types, l. ~66 ; union `Evenement`, l. ~257)
- Modify: `engine/partie.ts` (`jouer`, à côté du bruit de station, l. 361)
- Modify: `content/textes/menace.ts`, `content/textes/types.ts`, `content/textes/rendu.ts` (le `case` de `pas_entendus`), et chaque fichier de textes qui déclare `pas_entendus` (`content/ar-01/textes.ts`, `content/ar-02/textes.ts`, `content/monde-test/textes.ts`)
- Test: `engine/creature.test.ts` ou `engine/rencontre.test.ts` ; `tools/check-texts.test.ts` reste vert

**Interfaces:**
- Produces: `{ readonly type: 'bruit_lointain' }`, sans paramètre.

Règle : sur la face 2, l'événement est ajouté en fin de pas si la créature est active, hors de la pièce du joueur, si la pièce du joueur n'est pas assourdie et si aucun événement de ce pas ne la perçoit déjà (`bruit_creature`, `creature_entre`, `creature_glisse`, `porte_secouee`, `porte_enfoncee`, `pas_entendus`, `souffle_entendu`). Il est ajouté aux événements, pas aux `alertes` de `app/jeu.ts`, ni à `MENACES` de `tools/bots.ts`.

Textes : deux ou trois phrases, avec quelque chose d'organique et de lourd, au loin et sans direction. Elles doivent se distinguer des bruits de station du socle (la coque, l'air, l'eau). Exemple : « Très loin, quelque chose de lourd racle le sol, puis plus rien. »

- [ ] **Step 1: Écrire le test qui échoue**

Avec une graine à face 2 : après une attente, `bruit_lointain` est dans les événements. À face 2 avec la créature dans la pièce du joueur : absent.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine -t "bruit lointain"`
Expected: FAIL.

- [ ] **Step 3: Implémenter, puis ajouter les textes et le cas de rendu**

- [ ] **Step 4: Relancer**

Run: `npx vitest run engine content tools/check-texts.test.ts tools/couches.test.ts && npm run check:texts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine content
git commit -m "engine, textes : signe du dé de rencontre, un bruit lourd au loin"
```

---

### Task 5: Traces fraîches

**Files:**
- Modify: `engine/etat.ts` (`EtatCreature`, l. 25)
- Modify: `engine/creature.ts` (`reagir` : noter le passage quand `reponse.franchie` est défini)
- Modify: `engine/partie.ts` (`jouer` : événement à l'arrivée du joueur)
- Modify: `engine/vocabulaire.ts`, `content/textes/menace.ts`, `content/textes/types.ts`, `content/textes/rendu.ts`, et les fichiers de textes qui déclarent `pas_entendus`
- Test: `engine/creature.test.ts`

**Interfaces:**
- Produces: `EtatCreature.passages?: readonly { readonly piece: string; readonly action: number }[]`. Ce sont les trois dernières pièces où elle est entrée, la plus récente en dernier. Le champ n'existe que dans un monde à `rencontre`.
- Produces: `export const FRAICHEUR = 6;` dans `engine/rencontre.ts` (seuil à mesurer).
- Produces: événement `{ readonly type: 'traces_fraiches' }`, ajouté quand le joueur entre (`effet.franchie !== undefined`) dans une pièce où la créature n'est pas et où elle est passée il y a `FRAICHEUR` actions ou moins.

Textes : couche menace, avec un mot de `MOTS_TRACES`, mais plus frais que les traces fixes de la piste. Exemple : « Au sol, une traînée encore humide : quelque chose est passé ici il y a peu. »

- [ ] **Step 1: Écrire les tests qui échouent**

- elle erre de c à d, puis le joueur entre en c dans les six actions : `traces_fraiches` ;
- le joueur entre au-delà de ce délai : rien ;
- le joueur entre là où elle se trouve : rien, il la voit ;
- sans `rencontre` : `passages` est absent de l'état.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/creature.test.ts -t traces`
Expected: FAIL.

- [ ] **Step 3: Implémenter, puis ajouter les textes**

- [ ] **Step 4: Relancer**

Run: `npx vitest run engine content tools/check-texts.test.ts && npm run check:texts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine content
git commit -m "engine, textes : traces fraîches là où la créature vient de passer"
```

---

### Task 6: Forcer lentement vers un bruit fort, avant le contact

**Files:**
- Modify: `engine/creature.ts` (`REACTIONS_FORCER`, l. 59 ; `reaction`, l. 337 ; `forcer`, l. 362)
- Test: `engine/creature.test.ts`

**Interfaces:**
- Produces: `export const REACTIONS_FORCER_LENT = 4;` (seuil à mesurer).
- Change: `forcer(monde, etat, creature, porte, indice, total: number)`. `reaction` passe `REACTIONS_FORCER` en poursuite (`contact`) et `REACTIONS_FORCER_LENT` sinon.

Règle : dans un monde à `rencontre` seulement, `versLaPiste` est aussi tenté sans contact quand le son retenu est `fort`, ou quand `creature.force` est déjà en cours, pour qu'elle continue une fois l'alarme finie. Les pas du passager ne la font jamais forcer avant le contact : `pas` n'existe qu'après lui (D-276).

- [ ] **Step 1: Écrire les tests qui échouent**

- monde à `rencontre`, porte `ab` fermée, alarme dans `a`, créature en `b` : `porte_secouee` trois fois, puis `porte_enfoncee` à la quatrième réaction, même si l'alarme s'est tue entre-temps ;
- le même monde sans `rencontre` : elle ne force pas (comportement actuel) ;
- en poursuite, elle cède toujours en `REACTIONS_FORCER` réactions.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/creature.test.ts -t lentement`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

- [ ] **Step 4: Relancer**

Run: `npx vitest run engine`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine/creature.ts engine/creature.test.ts
git commit -m "engine: alertée par un bruit fort, la créature force lentement une porte avant le contact"
```

---

### Task 7: Étendue du territoire à l'assemblage des grandes stations

**Files:**
- Create: `engine/territoire.ts` (ouverture des portes au départ)
- Create: `engine/territoire.test.ts`
- Modify: `engine/station.ts` (`DefStationGrande`, l. 120)
- Modify: `engine/pose.ts` (`sousGraine` : étape `'territoire'`)
- Modify: `engine/grande.ts` (`etendreUneFois`, l. 200 : appeler l'ouverture sur `toutes` avant `disperserCles`, et poser `rencontre` à côté de `bruitsStation`)
- Modify: `content/stations/grandes.ts` (`grande: { ... }`, l. 119 : `etendue: ETENDUE_TERRITOIRE` ; `VERSION_GENERATEUR` passe à 2)
- Test: `tools/grandes.test.ts` (contrôle sur le catalogue)

**Interfaces:**
- Produces: `DefStationGrande.etendue?: number`, la part des pièces de la station que le territoire de départ doit atteindre, de 0 à 1. Absent ou 0 : aucune porte ouverte.
- Produces, dans `content/stations/grandes.ts` : `export const ETENDUE_TERRITOIRE = 0.5;` (« seconde moitié », valeur d'essai pour le porteur, Q-1).
- Produces, dans `engine/territoire.ts` :
  ```ts
  export interface PlanTerritoire {
    readonly pieces: readonly DefPiece[];      // pièces des morceaux et annexes
    readonly objets: readonly DefObjet[];
    readonly liaisons: readonly DefLiaison[];  // `toutes`, boucles comprises
    readonly depart: string;
    readonly creature: string;
    readonly segments: ReadonlyMap<string, number>;
  }
  export function ouvrirTerritoire(plan: PlanTerritoire, etendue: number, graine: number): DefLiaison[];
  ```
  Elle rend `plan.liaisons`, certaines passées à `ouverte: true`. Dans `etendreUneFois`, on l'appelle juste après `const toutes = ...`, avec `[...monde.pieces, ...piecesAnnexes]`, `segments` et `sousGraine(graine, 'territoire')`. Le résultat remplace `toutes` pour la suite : clés, butin, documents et monde rendu.

Algorithme :
```
territoire := pièces atteintes depuis creature par liaisons ouvertes, non étroites, non gouffre (statique, sans état)
cible := ceil(etendue × nombre de pièces)
pour tour = 0, 1, 2… tant que |territoire| < cible :
  bord := liaisons fermées ayant exactement un côté dans territoire, éligibles, triées par id
  si bord vide : arrêter
  ouvrir bord[Number.parseInt(hacher(`${graine}:${tour}`).slice(-8), 16) % |bord|] ; recalculer territoire
```
Une liaison est **éligible** si :
- elle n'est ni `etroite`, ni `gouffre`, ni `blindee`, ni `verrouillee`, ni `nonEtanche` ;
- elle n'a ni `manoeuvre`, ni `cachee`, ni `haute`, et aucun objet n'a `obstacle.passage` égal à son id ;
- elle n'est pas l'écoutille d'une capsule (`capsule.interieur` d'un objet) ;
- aucun de ses deux côtés n'est `depart`, une pièce de segment 0, une pièce `feu`, `froide`, `machines` ou à `gravite`, ni une pièce qui contient un objet `vitrageExterieur`.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `engine/territoire.test.ts`, sur un petit monde en ligne :
- `etendue: 0` : rien ne change ;
- `etendue: 1` : toutes les portes éligibles s'ouvrent, jamais une porte vers le départ ou vers une pièce en feu ;
- même graine : mêmes portes ;
- aucune porte éligible au bord : on s'arrête sans erreur.

Dans `tools/grandes.test.ts` : sur 20 grandes stations publiées, réassemblées, aucune liaison ouverte au départ ne touche une pièce `feu`, `froide`, `machines`, à `gravite` ou de segment 0, et `monde.rencontre` vaut `{ rythme: RYTHME_RENCONTRE }`.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run engine/territoire.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter, brancher dans `etendreUneFois`, passer `VERSION_GENERATEUR` à 2**

- [ ] **Step 4: Relancer**

Run: `npx vitest run engine tools/grandes.test.ts`
Expected: PASS. Les tests qui comparent des stations publiées peuvent échouer tant que la tâche 8 n'a pas republié : noter lesquels.

- [ ] **Step 5: Commit**

```bash
git add engine content/stations/grandes.ts tools/grandes.test.ts
git commit -m "engine: grandes stations, portes ouvertes au départ jusqu'à l'étendue du territoire"
```

---

### Task 8: Preuve sans errance, republication et mesures

**Files:**
- Modify: `tools/verifier-grandes.ts` (à côté de `sansButin`, l. 95)
- Modify: chaque site d'appel de `sansButin` qui prépare une preuve ou un rejeu de témoin, ainsi que `tools/verifier-station.ts` (`verifierStation`, l. 287)
- Regenerate: `content/stations/grandes-publiees.ts`, `tools/grandes-temoins.json`, `tools/grandes-sans-station.json`
- Test: `tools/grandes.test.ts` ou `tools/verifier-station` (tests existants)

**Interfaces:**
- Produces: `export function sansErrance(entree: EntreeMonde): EntreeMonde`, qui retire `monde.rencontre` par déstructuration, sans écrire `undefined` (exactOptionalPropertyTypes).

- [ ] **Step 1: Écrire le test qui échoue**

Un petit monde à `rencontre: { rythme: 1 }` dont un témoin sans errance existe : `verifierStation(entree).verdict === 'prouvee'`, et `sansErrance(entree).monde.rencontre === undefined`.

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run tools -t errance`
Expected: FAIL.

- [ ] **Step 3: Implémenter et brancher**

- [ ] **Step 4: Republier les grandes stations, en arrière-plan (environ 5 000 s)**

Run: `npm run publier:grandes -- --tout`
Expected : la liste et les témoins sont réécrits. Noter le nombre de stations publiées avant et après. S'il baisse de plus de 10 %, s'arrêter et le dire au porteur avant de continuer.

- [ ] **Step 5: Vérifier**

Run: `npm run check:stations && npm run test`
Expected: PASS.

- [ ] **Step 6: Mesurer avant et après**

Run: `npm run mesurer:difficulte` sur `main`, puis sur la branche.
Garder, par profil (B2 prudent, B4 averti en priorité) : évacuations, défaites, abandons, durée médiane en actions, part des parties avec une rencontre. Critères de la conception : une partie au moins aussi longue qu'aujourd'hui, et un prudent qui s'en sort mieux qu'un pressé. Le tableau va dans la PR.

- [ ] **Step 7: Commit**

```bash
git add tools content/stations/grandes-publiees.ts
git commit -m "outils : preuve sans errance ; grandes stations republiées avec le territoire"
```

---

### Task 9: Décisions, contrat et PR

**Files:**
- Modify: `docs/03-decisions.md` : consigner les décisions de la conception (§12), à partir de D-330, statut « Validé » le 2026-10-21, avec renvoi à la conception. Ajouter les choix de l'agent de ce plan, marqués « [Détail de l'agent] ». Mettre D-048 en « Remplacée ».
- Modify: `docs/contrats/C-03-temps-reactions.md` : nouvelle section errance, signe, traces, forçage lent, citée en tête du contrat, et mention de D-048 remplacée dans §4.
- Modify: `docs/00-lire-en-premier.md` : une ligne d'état.
- Modify: `docs/superpowers/specs/2026-10-21-creature-mobile-design.md` : statut « Approuvée par le porteur le 2026-10-21 ».

- [ ] **Step 1: Écrire les docs**

- [ ] **Step 2: Vérifier**

Run: `npm run verify`
Expected: PASS, liens et textes compris.

- [ ] **Step 3: Commit et PR**

```bash
git add docs
git commit -m "docs : créature mobile, décisions D-330 et suivantes, contrat C-03"
```
La PR cite la conception, le tableau des mesures, les choix de l'agent et ce que le porteur doit essayer sur téléphone. Il doit jouer une grande station jusqu'au bout, et dire :
- si la créature se sent vivante ;
- si l'étendue de 0,5 lui convient ;
- si les signes et les traces aident sans tenir la main.
