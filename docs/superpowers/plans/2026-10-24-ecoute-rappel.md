# Écoute : rappel quand rien ne change, silences groupés — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** en grande station, chaque ATTENDRE dit quelque chose des portes, même quand rien n'a changé, et les portes silencieuses sont dites ensemble (retours #261, #262, #266).

**Architecture:** le moteur garde un événement par phrase (les rangs de `alertesMenace` et `dangersDuRecit` restent alignés). `engine/ecoute.ts` gagne `recitEcoute`, qui part de `aRaconter` et rend des « dits » : une porte, un groupe de portes silencieuses, ou un rappel. `engine/partie.ts` les change en trois événements : `ecoute` (inchangé), `ecoute_groupee` et `ecoute_rappel`. Le rendu leur donne leurs textes et laisse le message de patience remplacer la phrase d'attente sans effacer le rappel. Les règles ne changent pas : `ecoutees`, le jet, les repères BRUIT et le journal restent les mêmes.

**Tech Stack:** TypeScript, Vitest, tsx ; moteur pur dans `engine/`, textes en couches dans `content/textes/`.

**Spec:** les choix du porteur ci-dessous, pris sur [ecouter-rappel.html](../../maquette/ecouter-rappel.html) (onglets 1 à 6) ; D-343 à D-346 dans [03-decisions.md](../../03-decisions.md).

## Ce que le porteur a tranché (2026-10-24, sur maquette)

- **Rappel à chaque attente** (onglets 2 et 3) : rien de changé → « Derrière les portes, rien de nouveau. » ; une porte change → elle est dite, puis « Aux autres portes, rien de nouveau. »
- **Patience** (onglet 4) : aux 5e et 10e attentes, le message de patience (#225) remplace « Vous restez immobile… », et le rappel suit.
- **Silences groupés** (onglets 1 et 5) : les portes silencieuses en une phrase, les bruyantes à part. Toutes silencieuses, et au moins quatre : « Derrière les quatre portes, le silence. » ; deux ou trois : on les nomme.
- **Vacarme** (onglet 6) : dans une salle des machines en marche, « le vacarme couvre tout » à chaque attente.
- **#262** : Regarder reste gratuit et n'écoute pas, Attendre écoute ; pas de renommage.

## Choix de l'agent dans ce plan (à signaler au porteur)

- **Liste simple des noms** : « Derrière la porte du dortoir, la porte de l'infirmerie et la porte du réfectoire, le silence. » (le `joindre` de `gabarit.ts`). La forme de la maquette, « les portes du dortoir, de l'infirmerie et du réfectoire », demanderait le pluriel des noms de passage, qui n'existe pas ; à reprendre si le porteur la veut.
- **« Plus rien » groupé de même** quand au moins deux portes se taisent au même pas ; jamais « toutes ».
- **Le groupe prend la place de sa première porte** dans l'ordre des liaisons ; le rappel vient en dernier.
- **Machines et chambre froide** restent dites une par une à la première attente ; ensuite, elles comptent dans « rien de nouveau ».
- **Nombres en lettres** de quatre à douze ; au-delà, liste simple des noms.

## Global Constraints

- Grandes stations seulement (monde à `rencontre`) ; ailleurs, ATTENDRE ne change pas.
- Une phrase par événement raconté (C-07 NP-01) : ne jamais fusionner des phrases au rendu.
- Textes en français juste, vouvoiement, apostrophe typographique `’`, rien qui nomme la créature.
- Le journal, les tirages et `empreinteEtat` ne changent pas : aucun rejeu ni `check:stations` ne doit bouger.
- Numéros de décision : **D-362 à D-365** (D-361 est pris par #258, pas encore fusionné).

## Review Focus

- Rappel après « plus rien » d'une seule porte, les autres inchangées : la porte puis « Aux autres portes, rien de nouveau. » (Tâche 1).
- Pièce où l'on écoute une seule porte : jamais de groupe ; rappel « Derrière les portes… » quand elle ne change pas (Tâche 1).
- Seul un « toujours » à dire et aucune autre porte : pas de rappel (toutes les portes sont dites) (Tâche 1).
- 5e attente dans une salle des machines : patience, puis le vacarme (Tâche 2).
- Regarder entre deux attentes (consultation, ne coûte rien) : l'écoute est gardée, la 2e attente donne le rappel ; après une action qui engage, la première attente redit tout, sans rappel (Tâche 1).

---

### Task 1 : le moteur dit le rappel et groupe les silences

**Files:**
- Modify: `engine/vocabulaire.ts` (`TYPES_EVENEMENT`, union `Evenement`)
- Modify: `engine/ecoute.ts`
- Modify: `engine/partie.ts:411-431`
- Modify: `engine/index.ts` si `aRaconter` y est exporté (exporter `recitEcoute` de même)
- Test: `engine/ecoute.test.ts`

**Interfaces:**
- Produces (vocabulaire) :
  ```ts
  | { readonly type: 'ecoute_groupee'; readonly passages: readonly RefPassage[]; readonly entendu: 'rien' | 'plus_rien'; readonly toutes: boolean }
  | { readonly type: 'ecoute_rappel'; readonly autres: boolean }
  ```
  `'ecoute_groupee'` et `'ecoute_rappel'` ajoutés à `TYPES_EVENEMENT` après `'ecoute_couverte'`.
- Produces (ecoute.ts) :
  ```ts
  export type DitEcoute =
    | { readonly sorte: 'une'; readonly liaison: string; readonly entendu: EntenduRecit }
    | { readonly sorte: 'groupe'; readonly liaisons: readonly string[]; readonly entendu: 'rien' | 'plus_rien'; readonly toutes: boolean }
    | { readonly sorte: 'rappel'; readonly autres: boolean };
  export function recitEcoute(avant: Readonly<Record<string, Entendu>> | undefined, maintenant: Readonly<Record<string, Entendu>>): DitEcoute[];
  ```
  Règles : partir de `aRaconter` ; les dits `rien` (resp. `plus_rien`), s'il y en a au moins deux, deviennent un seul `groupe` à la place du premier ; `toutes` = groupe `rien` qui couvre toutes les clés de `maintenant` et en compte de 4 à 12 ; un `rappel` en dernier quand `avant !== undefined` et que moins de portes sont dites que `Object.keys(maintenant).length`, avec `autres` = au moins une porte dite.

- [ ] **Step 1 : tests de `recitEcoute`** dans un `describe('recitEcoute (#261, #266)')` :
  - `recitEcoute(undefined, { a: 'rien', b: 'rien', c: 'vague' })` → `[{ sorte: 'groupe', liaisons: ['a', 'b'], entendu: 'rien', toutes: false }, { sorte: 'une', liaison: 'c', entendu: 'vague' }]`
  - `recitEcoute(undefined, { a: 'rien', b: 'rien', c: 'rien', d: 'rien' })` → un seul groupe, `toutes: true` ; même chose avec trois portes → `toutes: false`
  - `recitEcoute(undefined, { a: 'rien', m: 'machines' })` → deux `une` (un seul `rien`, pas de groupe)
  - `recitEcoute({ a: 'rien', b: 'vague' }, { a: 'rien', b: 'vague' })` → `[{ sorte: 'rappel', autres: false }]`
  - `recitEcoute({ a: 'rien', b: 'rien' }, { a: 'net', b: 'rien' })` → `[{ sorte: 'une', liaison: 'a', entendu: 'net' }, { sorte: 'rappel', autres: true }]`
  - `recitEcoute({ a: 'net' }, { a: 'net' })` → `[{ sorte: 'une', liaison: 'a', entendu: 'toujours' }]` (pas de rappel)
  - `recitEcoute({ a: 'net', b: 'vague', c: 'rien' }, { a: 'rien', b: 'rien', c: 'rien' })` → `[{ sorte: 'groupe', liaisons: ['a', 'b'], entendu: 'plus_rien', toutes: false }, { sorte: 'rappel', autres: true }]`

- [ ] **Step 2 : lancer** `npx vitest run engine/ecoute.test.ts` → échec (`recitEcoute` absent).

- [ ] **Step 3 : écrire `recitEcoute` et les deux types d'événement** comme ci-dessus ; `aRaconter` reste tel quel.

- [ ] **Step 4 : brancher dans `partie.ts`** : remplacer la boucle sur `aRaconter` par une boucle sur `recitEcoute` ; `une` → `ecoute` comme aujourd'hui (repère BRUIT compris) ; `groupe` → `ecoute_groupee` avec les `refPassage` des liaisons trouvées (ignorer celles que `liaisonsDe` ne trouve pas, comme aujourd'hui ; plus de passage du tout → rien) ; `rappel` → `ecoute_rappel`. Retirer la condition `conclu.ecoutees === undefined` devant `ecoute_couverte` : il est poussé à chaque attente. Mettre à jour le commentaire d'en-tête du bloc.

- [ ] **Step 5 : tests « dans le pas »** : mettre à jour les attentes de `engine/ecoute.test.ts:168`, `:177` et `:240` (deuxième attente sans changement → `[{ type: 'attente' }, { type: 'ecoute_rappel', autres: false }]` ; machines → `ecoute_couverte` aussi à la deuxième attente), et ajouter :
  - `'attendre, regarder, attendre : le rappel, pas de redite'` : `regarder` est une consultation (`engage: false`), l'écoute gardée ne s'oublie pas ; c'est le chemin de #261.
  - `'attendre, aller, attendre : tout est redit, sans rappel'` : compléter le test de `:208` (aucun `ecoute_rappel`).
  - `'quatre portes sans elle : une seule phrase, toutes'` sur un monde de test à quatre liaisons depuis la pièce de départ (graine calme) : `evenements` → `['attente', 'ecoute_groupee']`, `toutes: true`.
  Ligne `:220` (monde sans `rencontre`) inchangée.

- [ ] **Step 6 : lancer** `npx vitest run engine` puis `npm run typecheck` → vert, hors erreurs des textes (Tâche 2) si le typecheck les signale.

- [ ] **Step 7 : commit** `moteur : l'écoute rappelle les portes inchangées et groupe les silences (#261, #266)`.

### Task 2 : textes et rendu

**Files:**
- Modify: `content/textes/types.ts` (`TypeRecit`, `TextesMonde`, liste vide de `evenements` vers `:340`)
- Modify: `content/textes/menace.ts` (textes), `content/textes/couches.ts` (exports, comme `TEXTES_ECOUTE`)
- Modify: `content/ar-01/textes.ts`, `content/ar-02/textes.ts`, `content/monde-test/textes.ts` (brancher les nouvelles tables où l'est `ecoute`)
- Modify: `content/textes/rendu.ts` (`valeursEvenement`, `variantesDe`, `rendreEvenements`)
- Modify: `tools/check-texts.ts:135` (exclure les deux types de `TYPES_RECIT`)
- Test: `content/textes/rendu.test.ts`

**Interfaces:**
- Consumes : les deux événements de la Tâche 1.
- Produces (TextesMonde) :
  ```ts
  readonly ecouteGroupee: Readonly<Record<'rien' | 'plus_rien' | 'toutes', Variantes>>;
  readonly ecouteRappel: Readonly<Record<'portes' | 'autres', Variantes>>;
  ```
  `TypeRecit` exclut aussi `'ecoute_groupee'` et `'ecoute_rappel'`.
- Textes (menace.ts, à côté de `ecoute`) :
  - `ecouteGroupee.rien` : `['Derrière {le:passages}, le silence.', 'Derrière {le:passages}, rien.']`
  - `ecouteGroupee.plus_rien` : `['Derrière {le:passages}, plus rien.', 'Derrière {le:passages}, le bruit s’est tu.']`
  - `ecouteGroupee.toutes` : `['Derrière les {nom:nombre} portes, le silence.']`
  - `ecouteRappel.portes` : `['Derrière les portes, rien de nouveau.', 'Rien de nouveau derrière les portes.']`
  - `ecouteRappel.autres` : `['Aux autres portes, rien de nouveau.']`
- Valeurs : `ecoute_groupee` → `{ passages: passages.map(nomDe), nombre }` où `nombre` est un `Nom` `{ texte, genre: 'f', nombre: 'p', elision: false }` ; `texte` de `'quatre'` à `'douze'`. `toutes` n'est vrai que de 4 à 12 portes (règle dans `recitEcoute`) ; au-delà, liste simple. `ecoute_rappel` → `{}`.

- [ ] **Step 1 : tests de rendu** dans le `describe` de l'écoute de `rendu.test.ts` :
  - `[attente, ecoute_groupee(rien, [cuisine, dortoir], toutes: false)]` → phrase 0 dans `textes.attenteEcoute`, phrase 1 contient `'la porte de la cuisine et la porte du dortoir'` (adapter aux noms du test).
  - `toutes: true` avec 4 passages → `'Derrière les quatre portes, le silence.'`
  - `[attente, ecoute_rappel(false)]` → phrase 0 dans `attenteEcoute`, phrase 1 dans `ecouteRappel.portes` ; avec `attentes: 5` → `[textes.attentesLongues[5], <phrase de ecouteRappel.portes>]`.
  - `[{ type: 'attente', vacarme: true }, ecoute_couverte]` avec `attentes: 10` → `[attentesLongues[10], <ecoute_couverte>]`.
  - `[attente]` seule, `attentes: 5` → toujours `[attentesLongues[5]]` (petits mondes).
  - `alertesMenace([attente, ecoute(net), ecoute_rappel(true)])` → `[1]` ; `alertesMenace` d'un groupe → `[]`.

- [ ] **Step 2 : lancer** `npx vitest run content/textes/rendu.test.ts` → échec.

- [ ] **Step 3 : écrire les tables et le rendu.** Dans `rendreEvenements`, « calme » = les événements du récit hors `attente`, `bruit_station`, `ecoute_rappel` et `ecoute_couverte` sont vides ; si calme et `attentes` vaut 5 ou 10, la phrase de l'`attente` est `attentesLongues[attentes]` et les autres événements se rendent normalement. La phrase d'attente prend `attenteEcoute` devant tout événement d'écoute (les quatre types). Garder le chemin actuel quand l'attente est vraiment seule.

- [ ] **Step 4 : lancer** `npx vitest run content` puis `npm run check:texts` → vert.

- [ ] **Step 5 : commit** `textes : rappel d'écoute, silences groupés, patience suivie du rappel (#261, #266)`.

### Task 3 : décisions, vérification complète, essai

**Files:**
- Modify: `docs/03-decisions.md` (en-tête « Mise à jour », ligne d'index « Créature, blessures et dangers », D-343 à D-346, nouvelles D-362 à D-365)
- Add: `docs/maquette/ecouter-rappel.html` (déjà dans le worktree)

- [ ] **Step 1 : décisions.** D-362 « Chaque attente rappelle les portes » (rappel, « aux autres portes », vacarme redit) ; D-363 « Silences groupés, toutes au-delà de trois » ; D-364 « Patience, puis rappel » ; D-365 « #262 : Regarder n'écoute pas, Attendre ne change pas de nom ». Origine : #261, #262, #266, le porteur sur `ecouter-rappel.html` le 2026-10-24. Dans D-343, D-345 et D-346, barrer d'un « Remplacé par D-36x » les limites contredites (« ne rend que `attente` », « dit une fois, jamais redit », « vacarme… à la première attente, puis plus rien »). Reprendre les « Choix de l'agent » de ce plan en `[Détail de l'agent]`.

- [ ] **Step 2 : vérifier** `npm run verify` → vert ; `npm run check:stations` → 194 verdicts, inchangé.

- [ ] **Step 3 : essai en CLI** sur la partie de #261 : `npm run rejouer -- https://github.com/greffeb/void-walker/issues/261` ; la 2e attente et les suivantes dans la coursive disent « rien de nouveau » ; montrer le récit au porteur.

- [ ] **Step 4 : commit** `décisions D-362 à D-365, maquette du rappel d'écoute`, puis PR vers `main` qui ferme #261, #262 et #266. Attendre CI, téléphone et accord de fusion.
