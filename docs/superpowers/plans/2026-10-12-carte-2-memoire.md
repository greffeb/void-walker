# Carte, livraison 2 : mémoire du passager et carte publique — plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:subagent-driven-development (recommandée) ou superpowers:executing-plans, tâche par tâche. Les étapes se cochent (`- [ ]`).

**Goal :** le moteur garde ce que le passager a vu de chaque pièce et publie dans l'observation une carte limitée à ce savoir, géométrie comprise ; la CLI l'affiche en liste.

**Architecture :** un champ `memoire` de l'état sauvegardé reçoit, à la fin de chaque action et au réveil, le regard sur la pièce actuelle (`engine/memoire.ts`). Aucune règle ne lit cette mémoire : seule la carte publique (`engine/carte.ts`) s'en sert, avec les découvertes, les repères de la créature et l'air des voyants, pour construire `observation.carte`. Le contenu met cette carte en mots pour la vue LISTE (`content/textes/carte.ts`), que la CLI affiche par la commande `carte`.

**Tech Stack :** TypeScript strict, Vitest à globales, `npm run verify`.

**Spec :** [docs/14-carte.md](../../14-carte.md) §3 (et §2.5, §2.6, §2.8 pour ce que la carte publique doit porter) ; [C-06](../../contrats/C-06-observation-connaissances.md) §3, OP-03 à OP-05, K-01, K-02, K-05, K-07, K-08 ; D-202, D-203, D-212, D-213.

**Prérequis :** livraison 1 fusionnée (`engine/plan.ts`, plans des trois mondes, `content/textes/lisibilite.ts`).

**Essai à blanc :** le 2026-10-12, le code de ce plan, après celui de la livraison 1, a été appliqué tel quel dans une copie jetable : 447 tests, typage, lint, règles d'import et contrôle des textes verts (c'est cet essai qui a montré la nécessité de l'étape 6 de la tâche 2). Copie supprimée ; ce n'est pas une implémentation.

## Global Constraints

- `engine/` n'importe que `engine/` ; `content/` n'importe du moteur que des types ; pas de `Math.random`, `Date`, `performance` dans engine/ et content/ ; tests de engine/ et content/ à globales Vitest, sans paquet npm.
- Aucune règle ne lit la mémoire : deux états qui ne diffèrent que par elle ont le même avenir. La mémoire n'est écrite qu'en fin d'action engagée et au réveil ; un regard gratuit, un aperçu ou un refus ne la touchent pas (D-014).
- Ancienneté en paliers `instant` (1 action au plus), `moment` (2 à 5), `longtemps` (6 et plus) ; jamais un nombre d'actions dans l'observation (14 §3.2, D-151). La distance en passages sert à trier, jamais à afficher.
- La carte publique ne contient que ce que le passager sait (K-13) : jamais une pièce inconnue ni sa forme, ni un passage caché non découvert (K-05), ni la destination d'un passage sans signalétique non franchi (OP-03), ni une sous-position (C-02 §2).
- Feu : souvenir, mis à jour dans la pièce actuelle et à travers un passage ouvert dont la destination est connue (D-213). Vide : à jour, lu sur les voyants des portes étanches (OP-04). Créature : la dernière vue des repères (D-180), jamais un bruit (OP-05).
- Textes de la carte : aucun chiffre (12 §1), aucun identifiant ; même texte pour la CLI et l'appli (K-07).
- Commentaires en français avec la référence. Commits « #97 : … », terminés par la ligne Co-Authored-By de la session ; description de PR terminée par la ligne de génération de la session.
- Zone orange (moteur) : `npm run verify` vert, relecture indépendante, parcours CLI du playtester ; fusion seulement avec l'accord du porteur. Branche `moteur/97-memoire` depuis la principale à jour.

## Review Focus

- Passager dans la cabine (sous-position) : la carte reste centrée sur la salle d'embarquement, la cabine n'apparaît jamais (test en tâche 3).
- Passage sans signalétique entre deux pièces visitées, jamais franchi : « ? » des deux côtés, aucune destination nommée (test en tâche 3).
- Flammes vues par un passage sans signalétique ouvert : aucune pièce n'est apprise, aucun souvenir de feu (test en tâche 2).
- Regard gratuit et action refusée : mémoire inchangée (test en tâche 2).
- Reprise d'une partie sauvegardée : même mémoire et même carte (K-08, tests en tâches 2 et 3).

---

## Structure des fichiers

| Fichier | Rôle |
| --- | --- |
| `engine/anciennete.ts` (créé) | Paliers d'ancienneté partagés par la créature et la carte |
| `engine/etat.ts` | Types `ObjetSouvenir`, `SouvenirPiece`, `Memoire` ; champ `memoire` de `EtatPartie` ; mémoire vide au départ |
| `engine/memoire.ts` (créé) | `regarder` : regard de fin d'action |
| `engine/partie.ts` | Regard au réveil et à la fin de chaque action |
| `engine/creature.ts` | Ancienneté de la créature lue par les paliers partagés |
| `engine/vocabulaire.ts` | `PALIERS`, `Palier`, types de la carte publique, `Observation.carte` |
| `engine/plan.ts` | `entreeDeConduit` : bout d'un conduit du côté d'une pièce |
| `engine/carte.ts` (créé) | `carte(monde, etat)` : carte publique |
| `engine/observation.ts` | Carte dans l'observation (les types sortent par `export * from './vocabulaire'`) |
| `engine/anciennete.test.ts`, `engine/carte.test.ts` (créés) | Tests des paliers, de la mémoire et de la carte |
| `tools/ar-01.test.ts` | K-01 sur AR-01 ; comparaison K-05 qui tient compte de la carte |
| `tools/check-texts.ts` | Clé d'état sans la mémoire ; rendu de la carte en liste contrôlé |
| `tools/captures.ts`, `app/ecran.test.ts` | Clé d'état sans la mémoire dans leurs explorations |
| `content/textes/rendu.ts` | `nomPassage`, partagé par `nomDe` et la carte |
| `content/textes/carte.ts` (créé), `content/textes/carte.test.ts` (créé) | Vue LISTE en texte |
| `content/index.ts` | Exports |
| `cli/partie-cli.ts`, `cli/partie-cli.test.ts` | Commande `carte` |
| `docs/14-carte.md`, `docs/contrats/C-06-observation-connaissances.md`, `docs/00-lire-en-premier.md` | Statut |

---

### Task 1 : paliers d'ancienneté partagés

**Files :**
- Create : `engine/anciennete.ts`, `engine/anciennete.test.ts`
- Modify : `engine/vocabulaire.ts` (avant `TYPES_DANGER`), `engine/creature.ts` (constante `LONGTEMPS` et fonction `anciennete`)

**Interfaces :**
- Consumes : rien.
- Produces : `PALIERS = ['instant', 'moment', 'longtemps'] as const` et `type Palier` dans `engine/vocabulaire.ts` (exportés par `export * from './vocabulaire'`) ; `LONGTEMPS = 6` et `palier(ecart: number): Palier` dans `engine/anciennete.ts`.

- [ ] **Step 1 : écrire le test qui échoue**

Créer `engine/anciennete.test.ts` :

```ts
import { LONGTEMPS, palier } from './anciennete';

describe('ancienneté en paliers (D-151, 14 §3.2)', () => {
  it('une action au plus : à l’instant ; deux à cinq : un moment ; six et plus : longtemps', () => {
    expect([0, 1, 2, 5, 6, 40].map(palier)).toEqual(['instant', 'instant', 'moment', 'moment', 'longtemps', 'longtemps']);
    expect(LONGTEMPS).toBe(6);
  });
});
```

- [ ] **Step 2 : lancer le test, constater l'échec**

Run : `npx vitest run engine/anciennete.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : écrire les paliers**

Dans `engine/vocabulaire.ts`, juste avant `export const TYPES_DANGER = [` :

```ts
/** Ancienneté d'un regard, dite en mots (D-151) : jamais le nombre d'actions (14 §3.2). */
export const PALIERS = ['instant', 'moment', 'longtemps'] as const;
export type Palier = (typeof PALIERS)[number];

```

Créer `engine/anciennete.ts` :

```ts
import type { Palier } from './vocabulaire';

// Ancienneté d'un regard (D-151, 14 §3.2) : la même pour la dernière vue de la créature et pour la carte.

/** Seuil de « il y a longtemps », en actions confirmées. */
export const LONGTEMPS = 6;

/** 1 action au plus : à l'instant ; 2 à 5 : il y a un moment ; 6 et plus : il y a longtemps. */
export function palier(ecart: number): Palier {
  if (ecart <= 1) return 'instant';
  return ecart < LONGTEMPS ? 'moment' : 'longtemps';
}
```

- [ ] **Step 4 : la créature lit les mêmes paliers**

Dans `engine/creature.ts` :

1. Supprimer les deux lignes :

```ts
/** Seuil de « il y a longtemps », en actions confirmées (D-151). */
const LONGTEMPS = 6;
```

2. Ajouter en tête, après les imports existants : `import { LONGTEMPS, palier } from './anciennete';`, et ajouter `Palier` à l'import de types depuis `'./vocabulaire'` (`import type { Danger, Evenement, NiveauRisque, Palier } from './vocabulaire';`).

3. Remplacer la fonction `anciennete` par :

```ts
/** Ancienneté d'une vue (D-151), en type de danger. */
function anciennete(vue: VueCreature): `creature_vue_${Palier}` {
  return `creature_vue_${palier(vue.depuis)}` as const;
}
```

- [ ] **Step 5 : lancer les tests de la créature et des paliers**

Run : `npx vitest run engine/anciennete.test.ts engine/creature.test.ts`
Expected : PASS ; le comportement de la créature ne change pas.

- [ ] **Step 6 : lint, types, commit**

Run : `npx eslint engine --max-warnings 0 && npx tsc -b`

```bash
git add engine/anciennete.ts engine/anciennete.test.ts engine/vocabulaire.ts engine/creature.ts
git commit -m "#97 : paliers d'ancienneté partagés par la créature et la carte"
```

---

### Task 2 : mémoire du passager

**Files :**
- Modify : `engine/etat.ts` (types avant `EtatPartie`, champ `memoire`, `etatInitial`)
- Create : `engine/memoire.ts`
- Modify : `engine/partie.ts` (`nouvellePartie`, fin de `jouer`)
- Modify : `tools/check-texts.ts` (`cleEtat`), `tools/captures.ts` (`casApercus`), `app/ecran.test.ts` (`atteignables`)
- Test : `engine/carte.test.ts` (créé)

**Interfaces :**
- Consumes : rien de nouveau.
- Produces : dans `engine/etat.ts`, `ObjetSouvenir { objet: string; position?: string }`, `SouvenirPiece { regard?: number; feu?: { vu: boolean; actions: number }; objets?: readonly ObjetSouvenir[] }`, `Memoire { pieces: Record<string, SouvenirPiece>; liaisons: Record<string, boolean> }`, `EtatPartie.memoire: Memoire` ; dans `engine/memoire.ts`, `regarder(monde, etat): EtatPartie`. Le fichier de test `engine/carte.test.ts` définit le monde d'essai `MONDE`, la constante `VERSION`, le type `Geste` et les aides `partie`, `jouerGeste`, `suite`, que la tâche 3 réutilise.

- [ ] **Step 1 : écrire les tests qui échouent**

Créer `engine/carte.test.ts` :

```ts
import { idPublic, jouer, nouvellePartie, observer, reprendrePartie, type DefMonde, type IdAction, type OptionMenu, type Partie } from './index';

// Mémoire du passager et carte publique (docs/14-carte.md §3) : fixtures synthétiques avec plan ; les noms ne servent qu'à
// retrouver les options du menu (D-078).
//
//   ┌───────┬───────┐
//   │ quai  │ forge │   forge en feu ; porte qf fermée ; capsule au quai, cabine à bord par l'écoutille qc
//   ├───────┼───────┤
//   │ soute │ local │   porte qs ouverte ; grille sl sans signalétique, ouverte ; porte lf fermée ; panneau pn caché côté local
//   └───────┴───────┘
const MONDE: DefMonde = {
  id: 'essai-carte',
  depart: 'quai',
  pieces: [
    { id: 'quai', nom: 'quai', plan: { x: 0, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'forge', nom: 'forge', feu: true, plan: { x: 3, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'soute', nom: 'soute', plan: { x: 0, y: 2, largeur: 3, hauteur: 2 } },
    { id: 'local', nom: 'local', plan: { x: 3, y: 2, largeur: 3, hauteur: 2 } },
    { id: 'cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'qf', nom: 'porte', entre: ['quai', 'forge'], ouverte: false },
    { id: 'qs', nom: 'porte', entre: ['quai', 'soute'], ouverte: true },
    { id: 'sl', nom: 'grille', entre: ['soute', 'local'], ouverte: true, etroite: true, sansSignaletique: true },
    { id: 'lf', nom: 'porte', entre: ['local', 'forge'], ouverte: false },
    { id: 'pn', nom: 'panneau', entre: ['local', 'forge'], ouverte: false, cachee: 'local', plan: { rang: 5 } },
    { id: 'qc', nom: 'ecoutille', entre: ['quai', 'cabine'], ouverte: true },
  ],
  positions: [
    { id: 'mur', nom: 'mur', piece: 'soute' },
    { id: 'coin', nom: 'coin', piece: 'soute' },
  ],
  objets: [
    { id: 'carnet', nom: 'carnet', piece: 'quai' },
    { id: 'caisse', nom: 'caisse', piece: 'soute', position: 'mur', portable: false, deplacable: true },
    { id: 'capsule', nom: 'capsule', piece: 'quai', portable: false, capsule: { interieur: 'cabine' } },
  ],
};

const VERSION = 'essai-carte';

type Geste = readonly [IdAction, string];

function partie(monde: DefMonde = MONDE): Partie {
  return nouvellePartie(monde, { version: VERSION, graine: 7 });
}

/** Joue l'option du menu dont la cible, ou la destination d'un passage, porte ce nom. */
function jouerGeste(monde: DefMonde, courante: Partie, [action, nom]: Geste): Partie {
  const nomme = (cible: OptionMenu['cible']): boolean => cible.nom === nom || (cible.sorte === 'passage' && cible.vers?.nom === nom);
  const option = observer(monde, courante.etat).menu.find((choix) => choix.action === action && choix.disponible && nomme(choix.cible));
  if (option === undefined) throw new Error(`Option ${action} ${nom} absente.`);
  const resultat = jouer(monde, courante, option.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return resultat.partie;
}

function suite(gestes: readonly Geste[], monde: DefMonde = MONDE, depart: Partie = partie(monde)): Partie {
  return gestes.reduce((courante, geste) => jouerGeste(monde, courante, geste), depart);
}

describe('mémoire du passager (14 §3.1)', () => {
  it('au réveil : la pièce de départ, ses objets et ses liaisons perçues ; le feu d’en face seulement par un passage ouvert', () => {
    const { memoire } = partie().etat;
    expect(memoire.pieces.quai).toEqual({ regard: 0, feu: { vu: false, actions: 0 }, objets: [{ objet: 'carnet' }, { objet: 'capsule' }] });
    // La soute se voit par sa porte ouverte : pas de feu. La forge, derrière une porte fermée, reste sans souvenir.
    expect(memoire.pieces.soute).toEqual({ feu: { vu: false, actions: 0 } });
    expect(memoire.pieces.forge).toBeUndefined();
    expect(memoire.liaisons).toEqual({ qf: false, qs: true, qc: true });
  });

  it('à la fin de chaque action, la pièce actuelle remplace son souvenir ; les autres gardent le leur', () => {
    const { memoire } = suite([['aller', 'soute']]).etat;
    expect(memoire.pieces.soute).toEqual({ regard: 1, feu: { vu: false, actions: 1 }, objets: [{ objet: 'caisse', position: 'mur' }] });
    expect(memoire.pieces.quai).toEqual({ regard: 0, feu: { vu: false, actions: 1 }, objets: [{ objet: 'carnet' }, { objet: 'capsule' }] });
    expect(memoire.liaisons).toMatchObject({ qs: true, sl: true });
  });

  it('K-09 : une porte ouverte sur une pièce en feu jamais visitée en fait voir le feu (D-213)', () => {
    const { memoire } = suite([['ouvrir', 'forge']]).etat;
    expect(memoire.pieces.forge).toEqual({ feu: { vu: true, actions: 1 } });
    expect(memoire.liaisons.qf).toBe(true);
  });

  it('des flammes vues par un passage sans signalétique ne font connaître aucune pièce (OP-03)', () => {
    const brulant: DefMonde = { ...MONDE, pieces: MONDE.pieces.map((piece) => (piece.id === 'local' ? { ...piece, feu: true } : piece)) };
    expect(suite([['aller', 'soute']], brulant).etat.memoire.pieces.local).toBeUndefined();
  });

  it('K-10 : un objet emporté hors de vue reste dans le souvenir jusqu’au prochain regard', () => {
    const soute = suite([['aller', 'soute']]);
    // Une règle du monde emporte le carnet hors de vue (simulé).
    const emporte: Partie = { ...soute, etat: { ...soute.etat, objets: { ...soute.etat.objets, carnet: { type: 'piece', piece: 'local' } } } };
    expect(emporte.etat.memoire.pieces.quai?.objets).toEqual([{ objet: 'carnet' }, { objet: 'capsule' }]);
    expect(jouerGeste(MONDE, emporte, ['aller', 'quai']).etat.memoire.pieces.quai?.objets).toEqual([{ objet: 'capsule' }]);
  });

  it('un regard gratuit ou une action refusée ne touchent pas la mémoire (D-014)', () => {
    const depart = partie();
    const regarder = observer(MONDE, depart.etat).menu.find((choix) => choix.action === 'regarder');
    if (regarder === undefined) throw new Error('Regarder absent du menu.');
    expect(jouer(MONDE, depart, regarder.commande).partie).toBe(depart);
    expect(jouer(MONDE, depart, { action: 'aller', cible: idPublic(MONDE.id, 'lf') }).partie).toBe(depart);
  });

  it('K-08 : la mémoire se rejoue et se reprend à l’identique', () => {
    const fin = suite([['aller', 'soute'], ['aller', 'grille']]);
    const reprise = reprendrePartie(MONDE, JSON.parse(JSON.stringify(fin)) as unknown, VERSION);
    expect(reprise.etat.memoire).toEqual(fin.etat.memoire);
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run engine/carte.test.ts`
Expected : FAIL, « Cannot read properties of undefined (reading 'pieces') » (pas de mémoire).

- [ ] **Step 3 : types et état initial dans `engine/etat.ts`**

Juste avant `/** État complet d'une partie : sérialisable en JSON, jamais montré tel quel au joueur. */`, ajouter :

```ts
/** Objet vu dans une pièce au dernier regard, avec sa position s'il en a une (14 §3.1). */
export interface ObjetSouvenir {
  readonly objet: string;
  readonly position?: string;
}

/** Ce que le passager a vu d'une pièce (14 §3.1, D-213). */
export interface SouvenirPiece {
  /** Actions confirmées au dernier regard dans la pièce ; absent pour une pièce vue seulement par un passage ouvert. */
  readonly regard?: number;
  /** Feu vu ou non au dernier regard qui le montrait, dans la pièce ou par un passage ouvert, et quand. */
  readonly feu?: { readonly vu: boolean; readonly actions: number };
  /** Objets vus au dernier regard dans la pièce, dans l'ordre du monde. */
  readonly objets?: readonly ObjetSouvenir[];
}

/** Mémoire du passager (14 §3) : aucune règle ne la lit, seule la carte publique. */
export interface Memoire {
  readonly pieces: Readonly<Record<string, SouvenirPiece>>;
  /** Dernier état vu de chaque liaison perçue : vrai si elle était ouverte. */
  readonly liaisons: Readonly<Record<string, boolean>>;
}

```

Dans `EtatPartie`, après le champ `messages` :

```ts
  /** Ce que le passager a vu, pièce par pièce (14 §3.1). */
  readonly memoire: Memoire;
```

Dans `etatInitial`, après `messages: …,` :

```ts
    // Rempli par le regard du réveil (memoire.ts), une fois l'état initial posé.
    memoire: { pieces: {}, liaisons: {} },
```

- [ ] **Step 4 : écrire le regard**

Créer `engine/memoire.ts` :

```ts
import { autreCote, destinationConnue, enFeu, liaisonsVisibles, type EtatPartie, type ObjetSouvenir, type SouvenirPiece } from './etat';
import type { DefMonde } from './monde';

// Mémoire du passager (docs/14-carte.md §3.1, D-213) : ce qu'il a vu de chaque pièce, mis à jour au réveil puis à la fin de
// chaque action. Aucune règle ne la lit : seule la carte publique s'en sert. Deux états qui ne diffèrent que par la mémoire ont
// donc le même avenir.

/** Objets que le passager voit dans la pièce : au sol, posés à une position, installés dans une capsule de la pièce. */
function objetsVus(monde: DefMonde, etat: EtatPartie, piece: string): ObjetSouvenir[] {
  const capsules = monde.objets
    .filter((objet) => {
      const emplacement = etat.objets[objet.id];
      return objet.capsule !== undefined && emplacement?.type === 'piece' && emplacement.piece === piece;
    })
    .map((objet) => objet.id);
  return monde.objets.flatMap((objet): ObjetSouvenir[] => {
    const emplacement = etat.objets[objet.id];
    if (emplacement?.type === 'piece' && emplacement.piece === piece) {
      return [emplacement.position === undefined ? { objet: objet.id } : { objet: objet.id, position: emplacement.position }];
    }
    if (emplacement?.type === 'installe' && capsules.includes(emplacement.dans)) return [{ objet: objet.id }];
    return [];
  });
}

/**
 * Regard de fin d'action, et du réveil : la pièce actuelle remplace son souvenir (moment, feu, objets) et l'état de ses liaisons
 * perçues ; par un passage ouvert dont la destination est connue, le feu de la pièce d'en face, visitée ou non (D-213).
 */
export function regarder(monde: DefMonde, etat: EtatPartie): EtatPartie {
  const ici = etat.piece;
  const maintenant = etat.actions;
  const pieces: Record<string, SouvenirPiece> = { ...etat.memoire.pieces };
  const liaisons: Record<string, boolean> = { ...etat.memoire.liaisons };
  pieces[ici] = { regard: maintenant, feu: { vu: enFeu(etat, ici), actions: maintenant }, objets: objetsVus(monde, etat, ici) };
  for (const liaison of liaisonsVisibles(monde, etat, ici)) {
    const ouverte = etat.liaisons[liaison.id] === true;
    liaisons[liaison.id] = ouverte;
    if (!ouverte || !destinationConnue(etat, liaison)) continue;
    const voisine = autreCote(liaison, ici);
    pieces[voisine] = { ...pieces[voisine], feu: { vu: enFeu(etat, voisine), actions: maintenant } };
  }
  return { ...etat, memoire: { pieces, liaisons } };
}
```

- [ ] **Step 5 : regard au réveil et en fin d'action dans `engine/partie.ts`**

Ajouter l'import `import { regarder } from './memoire';` (après `import { indexer, type DefMonde } from './monde';`).

Dans `nouvellePartie`, remplacer `const etat = etatInitial(monde, options.graine);` par :

```ts
  // Au réveil, le passager voit sa pièce (14 §3.1).
  const etat = regarder(monde, etatInitial(monde, options.graine));
```

Dans `jouer`, remplacer `const etat: EtatPartie = { ...conclu, actions: partie.etat.actions + 1, generateur: session.etatFinal() };` par :

```ts
  // Le regard de fin d'action met à jour la mémoire du passager, avec le compte d'actions confirmées (14 §3.1).
  const etat: EtatPartie = regarder(monde, { ...conclu, actions: partie.etat.actions + 1, generateur: session.etatFinal() });
```

- [ ] **Step 6 : la mémoire ne multiplie pas les états des explorations**

Trois explorations en largeur dédoublonnent les états par une clé qui ignore le compteur et les dés. La mémoire porte des comptes d'actions : sans l'ignorer aussi, l'espace des états devient infini (le test d'écran épuise alors 4 Go de mémoire). Aucune règle ne la lit, l'ignorer ne perd aucun état de jeu.

Dans `tools/check-texts.ts`, remplacer la fonction `cleEtat` par :

```ts
/** Clé d'un état pour l'exploration : sans compteur, dés ni mémoire, qu'aucune règle ne lit (14 §3) ; sinon l'espace serait infini. */
function cleEtat(partie: Partie): string {
  return JSON.stringify({ ...partie.etat, actions: 0, generateur: null, memoire: null });
}
```

Dans `app/ecran.test.ts` (fonction `atteignables`) et dans `tools/captures.ts` (fonction `casApercus`), ajouter `memoire: null` à la clé de la même façon :

```ts
      const cle = JSON.stringify({ ...partie.etat, actions: 0, generateur: null, memoire: null });
```

```ts
      const etat = JSON.stringify({ ...partie.etat, actions: 0, generateur: null, memoire: null });
```

- [ ] **Step 7 : lancer les tests**

Run : `npx vitest run engine/carte.test.ts`
Expected : PASS, 7 tests.

Run : `npm test`
Expected : PASS, 447 tests environ. Le test « le monde de test reste exploré en entier » et les tests d'écran sur tous les états atteignables passent grâce à l'étape 6.

- [ ] **Step 8 : lint, types, commit**

Run : `npx eslint engine tools --max-warnings 0 && npx tsc -b`

```bash
git add engine/etat.ts engine/memoire.ts engine/partie.ts engine/carte.test.ts tools/check-texts.ts tools/captures.ts app/ecran.test.ts
git commit -m "#97 : mémoire du passager, regard au réveil et à la fin de chaque action"
```

---

### Task 3 : carte publique dans l'observation

**Files :**
- Modify : `engine/vocabulaire.ts` (types de la carte ; champ `carte` de `Observation`)
- Modify : `engine/plan.ts` (fonction `entreeDeConduit` en fin de fichier)
- Create : `engine/carte.ts`
- Modify : `engine/observation.ts`
- Test : `engine/carte.test.ts` (nouveau `describe`), `engine/plan.test.ts` (un test), `tools/ar-01.test.ts`

**Interfaces :**
- Consumes : tâche 1 (`palier`, `Palier`), tâche 2 (`etat.memoire`), livraison 1 (`emplacementDe`, `panDeCoque`, `ouvertureVers`, types du plan).
- Produces (dans `engine/vocabulaire.ts`, exportés) : `StatutPiece = 'actuelle' | 'visitee' | 'connue'` ; `DessinPassage = 'porte' | 'tirets'` ; `ObjetCarte { objet: RefObjet; position: RefPosition | null }` ; `PieceCarte { piece, statut, rect: RectPlan | null, regard: Palier | null, feu: Palier | null, vide: boolean, creature: Palier | null, objets: readonly ObjetCarte[], distance: number | null }` ; `PassageCarte { id, nom, vuDepuis: readonly RefPiece[], entre: readonly [RefPiece, RefPiece] | null, ouvert, dessin, voyant: 'air' | 'vide' | null, emplacement: EmplacementPassage | null }` ; `CapsuleCarte { objet: RefObjet; piece: RefPiece; pan: PanCoque }` ; `CartePublique { pieces, passages, capsules }` ; `Observation.carte: CartePublique`. Dans `engine/plan.ts`, `entreeDeConduit(monde, liaison, piece): EmplacementPassage | null`. Dans `engine/carte.ts`, `carte(monde, etat): CartePublique`. Les pièces et les passages sont dans l'ordre du monde.

- [ ] **Step 1 : écrire les tests qui échouent**

Dans `engine/plan.test.ts`, ajouter `entreeDeConduit` à l'import depuis `'./plan'`, et dans le test « PL-02 : un conduit relie… », après la ligne `expect(emplacementDe(conduit, …)).toEqual({ type: 'trace', … });` :

```ts
    // Tant que sa destination est inconnue, seul le bout du conduit se voit, dans le mur de la pièce d'où on le voit (14 §2.6).
    expect(entreeDeConduit(conduit, liaison(conduit, 'ab'), 'a')).toEqual({ type: 'mur', axe: 'v', ligne: 2, rang: 0 });
    expect(entreeDeConduit(conduit, liaison(conduit, 'ab'), 'b')).toEqual({ type: 'mur', axe: 'v', ligne: 4, rang: 0 });
```

Dans `engine/carte.test.ts`, compléter l'import depuis `'./index'` avec `type CartePublique, type PassageCarte, type PieceCarte, type RefObjet, type RefPiece, type RefPosition`, puis ajouter en fin de fichier :

```ts
// Une station qui peut perdre son air : la baie a un hublot.
//   ┌───────┬───────┐
//   │  sas  │  baie │   porte sb fermée
//   ├───────┴───────┤
//   │    couloir    │   porte sc fermée ; grille cb non étanche, fermée, entre le couloir et la baie
//   └───────────────┘
const VIDE: DefMonde = {
  id: 'essai-carte-vide',
  depart: 'sas',
  pieces: [
    { id: 'sas', nom: 'sas', plan: { x: 0, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'baie', nom: 'baie', plan: { x: 3, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'couloir', nom: 'couloir', plan: { x: 0, y: 2, largeur: 6, hauteur: 2 } },
  ],
  liaisons: [
    { id: 'sb', nom: 'porte', entre: ['sas', 'baie'], ouverte: false },
    { id: 'sc', nom: 'porte', entre: ['sas', 'couloir'], ouverte: false },
    { id: 'cb', nom: 'grille', entre: ['couloir', 'baie'], ouverte: false, etroite: true, nonEtanche: true },
  ],
  objets: [{ id: 'hublot', nom: 'hublot', piece: 'baie', portable: false, vitrageExterieur: true }],
};

const ref = (id: string, monde: DefMonde = MONDE): RefPiece => ({
  sorte: 'piece',
  id: idPublic(monde.id, id),
  nom: monde.pieces.find((piece) => piece.id === id)?.nom ?? id,
});
const objet = (id: string): RefObjet => ({ sorte: 'objet', id: idPublic(MONDE.id, id), nom: MONDE.objets.find((candidat) => candidat.id === id)?.nom ?? id });
const position = (id: string): RefPosition => ({ sorte: 'position', id: idPublic(MONDE.id, id), nom: id });

function carteDe(courante: Partie, monde: DefMonde = MONDE): CartePublique {
  return observer(monde, courante.etat).carte;
}

function pieceDe(carte: CartePublique, id: string, monde: DefMonde = MONDE): PieceCarte | undefined {
  return carte.pieces.find((vue) => vue.piece.id === idPublic(monde.id, id));
}

function passageDe(carte: CartePublique, id: string): PassageCarte | undefined {
  return carte.passages.find((vue) => vue.id === idPublic(MONDE.id, id));
}

describe('carte publique (14 §3.4)', () => {
  it('K-01 : au réveil, la pièce actuelle et ce que montrent ses sorties, rien d’autre ; la capsule arrimée dehors', () => {
    expect(carteDe(partie())).toEqual({
      pieces: [
        {
          piece: ref('quai'),
          statut: 'actuelle',
          rect: { x: 0, y: 0, largeur: 3, hauteur: 2 },
          regard: 'instant',
          feu: null,
          vide: false,
          creature: null,
          objets: [
            { objet: objet('carnet'), position: null },
            { objet: objet('capsule'), position: null },
          ],
          distance: 0,
        },
        { piece: ref('forge'), statut: 'connue', rect: { x: 3, y: 0, largeur: 3, hauteur: 2 }, regard: null, feu: null, vide: false, creature: null, objets: [], distance: 1 },
        { piece: ref('soute'), statut: 'connue', rect: { x: 0, y: 2, largeur: 3, hauteur: 2 }, regard: null, feu: null, vide: false, creature: null, objets: [], distance: 1 },
      ],
      passages: [
        {
          id: idPublic(MONDE.id, 'qf'),
          nom: 'porte',
          vuDepuis: [ref('quai')],
          entre: [ref('quai'), ref('forge')],
          ouvert: false,
          dessin: 'porte',
          voyant: null,
          emplacement: { type: 'mur', axe: 'v', ligne: 3, rang: 0 },
        },
        {
          id: idPublic(MONDE.id, 'qs'),
          nom: 'porte',
          vuDepuis: [ref('quai')],
          entre: [ref('quai'), ref('soute')],
          ouvert: true,
          dessin: 'porte',
          voyant: null,
          emplacement: { type: 'mur', axe: 'h', ligne: 2, rang: 1 },
        },
      ],
      capsules: [{ objet: objet('capsule'), piece: ref('quai'), pan: { cote: 'haut', debut: 0, fin: 3 } }],
    });
  });

  it('K-09 : la forge, connue par sa porte et jamais visitée, porte le feu vu par la porte ouverte', () => {
    expect(pieceDe(carteDe(suite([['ouvrir', 'forge']])), 'forge')).toMatchObject({ statut: 'connue', feu: 'instant', regard: null });
  });

  it('K-12 : un passage sans signalétique montre « ? », puis sa destination une fois franchi ; distance en passages connus', () => {
    const soute = carteDe(suite([['aller', 'soute']]));
    expect(passageDe(soute, 'sl')).toMatchObject({ vuDepuis: [ref('soute')], entre: null, dessin: 'tirets', emplacement: { type: 'mur', axe: 'v', ligne: 3, rang: 2 } });
    expect(pieceDe(soute, 'local')).toBeUndefined();
    const local = carteDe(suite([['aller', 'soute'], ['aller', 'grille']]));
    expect(passageDe(local, 'sl')).toMatchObject({ vuDepuis: [ref('soute'), ref('local')], entre: [ref('soute'), ref('local')] });
    expect(local.pieces.map((vue) => [vue.piece.nom, vue.statut, vue.distance])).toEqual([
      ['quai', 'visitee', 2],
      ['forge', 'connue', 1],
      ['soute', 'visitee', 1],
      ['local', 'actuelle', 0],
    ]);
  });

  it('passage sans signalétique entre deux pièces visitées, jamais franchi : « ? » des deux côtés', () => {
    const froid: DefMonde = { ...MONDE, pieces: MONDE.pieces.map((piece) => (piece.id === 'forge' ? { ...piece, feu: false } : piece)) };
    const fin = suite(
      [
        ['aller', 'soute'],
        ['aller', 'quai'],
        ['ouvrir', 'forge'],
        ['aller', 'forge'],
        ['ouvrir', 'local'],
        ['aller', 'local'],
      ],
      froid,
    );
    expect(passageDe(carteDe(fin, froid), 'sl')).toMatchObject({ vuDepuis: [ref('soute'), ref('local')], entre: null });
  });

  it('sous-position : dans la cabine, la carte reste sur le quai, sans la cabine ni son écoutille (C-02 §2)', () => {
    const carte = carteDe(suite([['aller', 'cabine']]));
    expect(pieceDe(carte, 'quai')?.statut).toBe('actuelle');
    expect(carte.pieces.some((vue) => vue.piece.nom === 'cabine')).toBe(false);
    expect(passageDe(carte, 'qc')).toBeUndefined();
  });

  it('créature : marquée là où elle a été vue en dernier, avec son ancienneté ; jamais dans une pièce inconnue (OP-05)', () => {
    const depart = partie();
    const vue = (piece: string, depuis: number): Partie => ({ ...depart, etat: { ...depart.etat, reperes: { vue: { piece, depuis }, entendue: null } } });
    expect(pieceDe(carteDe(vue('soute', 3)), 'soute')?.creature).toBe('moment');
    expect(carteDe(vue('local', 0))).toEqual(carteDe(depart));
  });

  it('voyants (OP-04) : l’air des pièces connues se lit à jour sur les portes étanches d’une station qui peut le perdre', () => {
    const debut = partie(VIDE);
    expect(carteDe(debut, VIDE).passages.map((vue) => vue.voyant)).toEqual(['air', 'air']);
    const perce: Partie = { ...debut, etat: { ...debut.etat, breches: ['hublot'] } };
    const carte = carteDe(perce, VIDE);
    expect(carte.passages.map((vue) => vue.voyant)).toEqual(['vide', 'vide']);
    expect(carte.pieces.map((vue) => [vue.piece.nom, vue.vide])).toEqual([
      ['sas', false],
      ['baie', true],
      ['couloir', true],
    ]);
    expect(carteDe(partie()).passages.every((vue) => vue.voyant === null)).toBe(true);
  });

  it('conduit sans signalétique : son seul bout se voit ; une fois franchi, tout son tracé', () => {
    const CONDUIT: DefMonde = {
      id: 'essai-carte-conduit',
      depart: 'a',
      pieces: [
        { id: 'a', nom: 'a', plan: { x: 0, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'b', nom: 'b', plan: { x: 4, y: 0, largeur: 2, hauteur: 2 } },
      ],
      liaisons: [
        { id: 'ab', nom: 'conduit', entre: ['a', 'b'], ouverte: true, etroite: true, sansSignaletique: true, plan: { trace: [{ x: 2, y: 0 }, { x: 3, y: 0 }] } },
      ],
      objets: [],
    };
    const debut = partie(CONDUIT);
    expect(carteDe(debut, CONDUIT).passages[0]?.emplacement).toEqual({ type: 'mur', axe: 'v', ligne: 2, rang: 0 });
    const passe = jouerGeste(CONDUIT, debut, ['aller', 'conduit']);
    expect(carteDe(passe, CONDUIT).passages[0]?.emplacement).toEqual({ type: 'trace', cases: [{ x: 2, y: 0 }, { x: 3, y: 0 }] });
  });

  it('K-11 : une, deux puis six actions après le dernier regard', () => {
    let courante = suite([['aller', 'soute']]);
    const paliers = [pieceDe(carteDe(courante), 'quai')?.regard];
    for (const geste of [
      ['fermer', 'quai'],
      ['ouvrir', 'quai'],
      ['fermer', 'quai'],
      ['ouvrir', 'quai'],
      ['fermer', 'quai'],
    ] as const) {
      courante = jouerGeste(MONDE, courante, geste);
      paliers.push(pieceDe(carteDe(courante), 'quai')?.regard);
    }
    expect(paliers).toEqual(['instant', 'moment', 'moment', 'moment', 'moment', 'longtemps']);
  });

  it('K-02 : le feu qui gagne une pièce visitée hors de vue n’apparaît qu’au regard suivant', () => {
    const quai = suite([['aller', 'soute'], ['aller', 'quai'], ['fermer', 'soute']]);
    // Le feu gagne la soute derrière sa porte fermée (simulé) : la carte garde l'ancien état.
    const brule: Partie = { ...quai, etat: { ...quai.etat, feu: ['forge', 'soute'] } };
    expect(pieceDe(carteDe(brule), 'soute')?.feu).toBeNull();
    expect(pieceDe(carteDe(jouerGeste(MONDE, brule, ['ouvrir', 'soute'])), 'soute')?.feu).toBe('instant');
  });

  it('K-10 : la carte garde l’ancienne position d’un objet déplacé hors de vue', () => {
    const quai = suite([['aller', 'soute'], ['aller', 'quai']]);
    const deplace: Partie = { ...quai, etat: { ...quai.etat, objets: { ...quai.etat.objets, caisse: { type: 'piece', piece: 'soute', position: 'coin' } } } };
    expect(pieceDe(carteDe(deplace), 'soute')?.objets).toEqual([{ objet: objet('caisse'), position: position('mur') }]);
    expect(pieceDe(carteDe(jouerGeste(MONDE, deplace, ['aller', 'soute'])), 'soute')?.objets).toEqual([{ objet: objet('caisse'), position: position('coin') }]);
  });

  it('K-13 : deux mondes qui ne diffèrent que par une pièce jamais connue donnent la même carte, octet pour octet', () => {
    const plus: DefMonde = {
      ...MONDE,
      pieces: [...MONDE.pieces, { id: 'reserve', nom: 'reserve', plan: { x: 6, y: 0, largeur: 2, hauteur: 2 } }],
      liaisons: [...MONDE.liaisons, { id: 'fr', nom: 'porte', entre: ['forge', 'reserve'], ouverte: false }],
    };
    const gestes: readonly Geste[] = [['aller', 'soute'], ['aller', 'grille']];
    expect(JSON.stringify(carteDe(suite(gestes, plus), plus))).toBe(JSON.stringify(carteDe(suite(gestes))));
    expect(JSON.stringify(carteDe(partie(plus), plus))).toBe(JSON.stringify(carteDe(partie())));
  });

  it('K-05 : vu de son côté caché, un passage caché ne laisse aucune trace sur la carte', () => {
    const sansPanneau: DefMonde = { ...MONDE, liaisons: MONDE.liaisons.filter((liaison) => liaison.id !== 'pn') };
    const gestes: readonly Geste[] = [['aller', 'soute'], ['aller', 'grille']];
    expect(carteDe(suite(gestes))).toEqual(carteDe(suite(gestes, sansPanneau), sansPanneau));
  });

  it('K-08 : la reprise redonne la même carte', () => {
    const fin = suite([['aller', 'soute'], ['aller', 'grille']]);
    const reprise = reprendrePartie(MONDE, JSON.parse(JSON.stringify(fin)) as unknown, VERSION);
    expect(carteDe(reprise)).toEqual(carteDe(fin));
  });
});
```

Dans `tools/ar-01.test.ts`, dans `describe('AR-01 : ce que sait le passager (C-06)')`, remplacer la ligne :

```ts
    expect(observer(MONDE, embarquement.etat)).toEqual(observer(sansPanneau, embarquement.etat));
```

par :

```ts
    // Le local énergie, visité, a montré le panneau comme un passage fermé sans destination : seule la carte le garde (14 §3.3).
    const { carte: avecLui, ...vu } = observer(MONDE, embarquement.etat);
    const { carte: sansLui, ...vuSans } = observer(sansPanneau, embarquement.etat);
    expect(vu).toEqual(vuSans);
    expect(avecLui.pieces).toEqual(sansLui.pieces);
    expect(avecLui.passages.filter((lien) => lien.id !== id('l-energie-embarquement'))).toEqual(sansLui.passages);
    expect(avecLui.passages.find((lien) => lien.id === id('l-energie-embarquement'))).toMatchObject({ entre: null, ouvert: false, dessin: 'tirets' });
```

et ajouter dans le même `describe` :

```ts
  it('K-01 : au départ, la carte montre le salon de transit et ses deux sorties, rien d’autre', () => {
    const { carte } = observer(MONDE, depart().etat);
    expect(carte.pieces.map((vue) => [vue.piece.nom, vue.statut])).toEqual([
      ['salon', 'actuelle'],
      ['atelier', 'connue'],
      ['galerie', 'connue'],
    ]);
    expect(carte.passages.map((vue) => vue.id)).toEqual([id('l-salon-atelier'), id('l-salon-galerie')]);
    // Le feu du local technique, derrière sa cloison fermée, n'a pas été vu.
    expect(carte.pieces.every((vue) => vue.feu === null)).toBe(true);
    expect(carte.capsules).toEqual([]);
  });
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run engine/carte.test.ts engine/plan.test.ts tools/ar-01.test.ts`
Expected : FAIL (`carte` absent de l'observation, `entreeDeConduit` introuvable).

- [ ] **Step 3 : types de la carte publique**

Dans `engine/vocabulaire.ts`, ajouter en tête :

```ts
import type { EmplacementPassage, PanCoque, RectPlan } from './plan';
```

Juste avant `/** Tout ce que le passager sait (C-06) ; seule sortie vers le joueur. */` :

```ts
/** Pièce actuelle, visitée, ou connue par une porte sans être visitée (D-202). */
export type StatutPiece = 'actuelle' | 'visitee' | 'connue';

/** Ouverture d'un passage : porte, ou tirets pour une grille, un conduit étroit, un panneau, un passage sans signalétique (14 §2.6). */
export type DessinPassage = 'porte' | 'tirets';

export interface ObjetCarte {
  readonly objet: RefObjet;
  readonly position: RefPosition | null;
}

/** Une pièce que le passager connaît, telle qu'il l'a vue (14 §3.4). */
export interface PieceCarte {
  readonly piece: RefPiece;
  readonly statut: StatutPiece;
  /** Rectangle en cases ; `null` dans un monde sans plan. */
  readonly rect: RectPlan | null;
  /** Ancienneté du dernier regard dans la pièce ; `null` si jamais visitée. */
  readonly regard: Palier | null;
  /** Feu vu au dernier regard qui le montrait, et son ancienneté ; `null` si aucun feu vu (D-213). */
  readonly feu: Palier | null;
  /** Plus d'air, à jour : la pièce du passager, ou lu sur le voyant d'une porte étanche (OP-04). */
  readonly vide: boolean;
  /** La créature a été vue ici en dernier, et quand (D-180) ; `null` sinon. */
  readonly creature: Palier | null;
  /** Objets vus au dernier regard, avec leur position (14 §3.1). */
  readonly objets: readonly ObjetCarte[];
  /** Passages connus depuis la pièce actuelle ; `null` si aucun chemin connu ne l'y relie. Sert à trier, jamais affiché. */
  readonly distance: number | null;
}

/** Un passage vu depuis une pièce visitée (14 §3.4). */
export interface PassageCarte {
  readonly id: string;
  readonly nom: string;
  /** Pièces visitées d'où il a été vu, dans l'ordre du monde. */
  readonly vuDepuis: readonly RefPiece[];
  /** Ses deux pièces quand sa destination est connue ; sinon `null`, un « ? » (OP-03). */
  readonly entre: readonly [RefPiece, RefPiece] | null;
  /** Ouvert au dernier regard. */
  readonly ouvert: boolean;
  readonly dessin: DessinPassage;
  /** Voyant d'une porte étanche, à jour (OP-04) ; `null` sans voyant. */
  readonly voyant: 'air' | 'vide' | null;
  /** Ouverture dans un mur, ou tracé d'un conduit découvert ; `null` dans un monde sans plan. */
  readonly emplacement: EmplacementPassage | null;
}

/** Capsule arrimée dehors, contre le pan de coque de sa salle visitée (14 §2.6). */
export interface CapsuleCarte {
  readonly objet: RefObjet;
  readonly piece: RefPiece;
  readonly pan: PanCoque;
}

/** Carte publique (14 §3.4) : seulement ce que le passager sait, géométrie comprise. */
export interface CartePublique {
  readonly pieces: readonly PieceCarte[];
  readonly passages: readonly PassageCarte[];
  readonly capsules: readonly CapsuleCarte[];
}

```

Dans l'interface `Observation`, après `readonly menu: readonly OptionMenu[];` :

```ts
  /** La carte : pièces connues, passages vus, capsule, telles que le passager les a vus (14 §3.4). */
  readonly carte: CartePublique;
```

- [ ] **Step 4 : bout d'un conduit dans `engine/plan.ts`**

En fin de fichier :

```ts
/** Bout d'un conduit du côté d'une pièce : l'ouverture dans son mur, seule montrée tant que sa destination est inconnue (14 §2.6). */
export function entreeDeConduit(monde: DefMonde, liaison: DefLiaison, piece: string): EmplacementPassage | null {
  const trace = liaison.plan?.trace;
  const rect = rectDe(monde, piece);
  if (trace === undefined || rect === undefined) return null;
  for (const etape of [trace[0], trace[trace.length - 1]]) {
    const ouverture = etape === undefined ? null : ouvertureVers(rect, etape);
    if (ouverture !== null) return ouverture;
  }
  return null;
}
```

- [ ] **Step 5 : écrire la carte publique**

Créer `engine/carte.ts` :

```ts
import { palier } from './anciennete';
import { autreCote, destinationConnue, perceptible, piecesSansAir, refObjet, refPiece, refPosition, signalee, type EtatPartie } from './etat';
import { idPublic, type DefLiaison, type DefMonde } from './monde';
import { emplacementDe, entreeDeConduit, panDeCoque } from './plan';
import type { CapsuleCarte, CartePublique, DessinPassage, PassageCarte, PieceCarte, StatutPiece } from './vocabulaire';

// Carte publique (docs/14-carte.md §3.4) : seulement ce que le passager sait, géométrie comprise. La forme d'une pièce inconnue
// n'y figure jamais (K-13) ; une pièce hors de vue garde l'état de son dernier regard (D-076), sauf l'air lu sur les voyants (OP-04).

/** Pièce de la carte où se tient le passager : la sienne, ou celle qui ouvre sur sa sous-position, jamais dessinée (C-02 §2). */
function pieceDeCarte(monde: DefMonde, piece: string): string {
  if (monde.pieces.find((candidate) => candidate.id === piece)?.sousPosition !== true) return piece;
  const acces = monde.liaisons.find((liaison) => liaison.entre.includes(piece));
  return acces === undefined ? piece : autreCote(acces, piece);
}

/** Grille, conduit étroit, panneau, passage sans signalétique : ouverture en tirets ; sinon une porte (14 §2.6). */
function dessinDe(liaison: DefLiaison): DessinPassage {
  return liaison.etroite === true || liaison.nonEtanche === true || !signalee(liaison) ? 'tirets' : 'porte';
}

/** Nombre de passages connus depuis la pièce de départ, en largeur. */
function distances(depart: string, aretes: readonly (readonly [string, string])[]): Map<string, number> {
  const resultat = new Map([[depart, 0]]);
  const file = [depart];
  for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
    const suivante = (resultat.get(piece) ?? 0) + 1;
    for (const [a, b] of aretes) {
      const voisine = a === piece ? b : b === piece ? a : undefined;
      if (voisine === undefined || resultat.has(voisine)) continue;
      resultat.set(voisine, suivante);
      file.push(voisine);
    }
  }
  return resultat;
}

export function carte(monde: DefMonde, etat: EtatPartie): CartePublique {
  const sousPositions = new Set(monde.pieces.filter((piece) => piece.sousPosition === true).map((piece) => piece.id));
  const ici = pieceDeCarte(monde, etat.piece);
  const visitees = monde.pieces.filter((piece) => !sousPositions.has(piece.id) && (piece.id === ici || etat.visitees.includes(piece.id))).map((piece) => piece.id);
  // Passages perçus depuis une pièce visitée (14 §3.3) ; ceux d'une sous-position ne se dessinent jamais.
  const vus = monde.liaisons.flatMap((liaison) => {
    if (liaison.entre.some((piece) => sousPositions.has(piece))) return [];
    const depuis = visitees.filter((piece) => liaison.entre.includes(piece) && perceptible(etat, liaison, piece));
    return depuis.length === 0 ? [] : [{ liaison, depuis, connue: destinationConnue(etat, liaison) }];
  });
  const connues = new Set(visitees);
  for (const { liaison, connue } of vus) if (connue) for (const piece of liaison.entre) connues.add(piece);
  const sansAir = piecesSansAir(monde, etat);
  // Une station qui peut perdre son air (un vitrage extérieur) porte des voyants sur ses portes étanches (OP-04, VP-03).
  const voyants = monde.objets.some((objet) => objet.vitrageExterieur === true);
  const avecVoyant = (liaison: DefLiaison, connue: boolean): boolean => voyants && connue && liaison.nonEtanche !== true;
  const passages = vus.map(({ liaison, depuis, connue }): PassageCarte => {
    const [premiere] = depuis;
    const conduitInconnu = !connue && premiere !== undefined && liaison.plan?.trace !== undefined;
    return {
      id: idPublic(monde.id, liaison.id),
      nom: liaison.nom,
      vuDepuis: depuis.map((piece) => refPiece(monde, piece)),
      entre: connue ? [refPiece(monde, liaison.entre[0]), refPiece(monde, liaison.entre[1])] : null,
      // Chaque pièce visitée a eu son regard : la liaison a été vue. À défaut, fermée : rien n'en dit plus.
      ouvert: etat.memoire.liaisons[liaison.id] ?? false,
      dessin: dessinDe(liaison),
      voyant: avecVoyant(liaison, connue) ? (liaison.entre.some((piece) => sansAir.includes(piece)) ? 'vide' : 'air') : null,
      emplacement: conduitInconnu ? entreeDeConduit(monde, liaison, premiere) : emplacementDe(monde, liaison),
    };
  });
  const parcours = distances(
    ici,
    vus.filter(({ connue }) => connue).map(({ liaison }) => liaison.entre),
  );
  const luSurVoyant = new Set(vus.filter(({ liaison, connue }) => avecVoyant(liaison, connue)).flatMap(({ liaison }) => liaison.entre));
  const vue = etat.reperes.vue;
  const pieces = monde.pieces
    .filter((piece) => connues.has(piece.id))
    .map((piece): PieceCarte => {
      const souvenir = etat.memoire.pieces[piece.id];
      const statut: StatutPiece = piece.id === ici ? 'actuelle' : visitees.includes(piece.id) ? 'visitee' : 'connue';
      return {
        piece: refPiece(monde, piece.id),
        statut,
        rect: piece.plan ?? null,
        regard: souvenir?.regard === undefined ? null : palier(etat.actions - souvenir.regard),
        feu: souvenir?.feu?.vu === true ? palier(etat.actions - souvenir.feu.actions) : null,
        vide: sansAir.includes(piece.id) && (piece.id === ici || luSurVoyant.has(piece.id)),
        creature: vue !== null && vue.piece === piece.id ? palier(vue.depuis) : null,
        objets: (souvenir?.objets ?? []).map(({ objet, position }) => ({
          objet: refObjet(monde, objet),
          position: position === undefined ? null : refPosition(monde, position),
        })),
        distance: parcours.get(piece.id) ?? null,
      };
    });
  const capsules = monde.objets.flatMap((objet): CapsuleCarte[] => {
    if (objet.capsule === undefined || !visitees.includes(objet.piece)) return [];
    const pan = panDeCoque(monde, objet.piece);
    return pan === null ? [] : [{ objet: refObjet(monde, objet.id), piece: refPiece(monde, objet.piece), pan }];
  });
  return { pieces, passages, capsules };
}
```

(`premiere` est défini quand `conduitInconnu` est vrai ; si le compilateur ne le déduit pas, écrire `conduitInconnu && premiere !== undefined ? entreeDeConduit(…) : …`.)

- [ ] **Step 6 : la carte dans l'observation**

Dans `engine/observation.ts`, ajouter l'import `import { carte } from './carte';` et, dans `observer`, après `menu: menu(monde, etat),` :

```ts
    carte: carte(monde, etat),
```

- [ ] **Step 7 : lancer les tests**

Run : `npx vitest run engine/carte.test.ts engine/plan.test.ts tools/ar-01.test.ts`
Expected : PASS.

Run : `npm test`
Expected : PASS. Les comparaisons d'observations entières (K-05 de `engine/evacuation.test.ts`, mondes identiques pour le passager dans `engine/creature.test.ts`, export de `engine/partie.test.ts`) restent vraies : la carte ne montre que le savoir du passager.

- [ ] **Step 8 : lint, types, imports, commit**

Run : `npx eslint engine tools --max-warnings 0 && npx tsc -b && npm run check:imports`

```bash
git add engine/vocabulaire.ts engine/plan.ts engine/plan.test.ts engine/carte.ts engine/observation.ts engine/carte.test.ts tools/ar-01.test.ts
git commit -m "#97 : carte publique dans l'observation (K-01, K-02, K-05, K-08 à K-13)"
```

---

### Task 4 : vue LISTE en texte

**Files :**
- Modify : `content/textes/rendu.ts` (`nomDe`)
- Create : `content/textes/carte.ts`, `content/textes/carte.test.ts`
- Modify : `content/index.ts`

**Interfaces :**
- Consumes : tâche 3 (types `CartePublique`, `PieceCarte`, `PassageCarte`, `Palier`), livraison 1 (`nomSurPlan`).
- Produces : dans `content/textes/rendu.ts`, `nomPassage(textes, nom: string, vers: RefPiece | null): Nom`. Dans `content/textes/carte.ts` : `MOTS_CARTE` (objet de chaînes : `ici`, `feu`, `vide`, `creature`, `blocIci`, `blocVisitees`, `blocConnues`, `aucune`, `parSaPorte`, `destinationInconnue`, `ouvert`, `ferme`, `air`, `videVoyant`), `ANCIENNETES: Record<Palier, string>`, `nomCarte(textes, piece: RefPiece): string`, `etatsDe(piece: PieceCarte): string[]`, `regardDe(piece: PieceCarte): string | null`, types `EntreeListe { titre; details }`, `BlocListe { titre; entrees }`, `rendreListeCarte(textes, carte): BlocListe[]`, `lignesListeCarte(blocs): string[]`. Tous exportés par `content/index.ts`. La livraison 3 ajoute d'autres mots et la fiche dans ce fichier.

- [ ] **Step 1 : écrire les tests qui échouent**

Créer `content/textes/carte.test.ts` :

```ts
import type { CartePublique, RefPiece } from '../../engine';
import { TEXTES_AR01 } from '../ar-01/textes';
import { lignesListeCarte, rendreListeCarte } from './carte';

// Vue LISTE (14 §2.8) sur une carte écrite à la main avec les noms d'AR-01 : le contenu n'importe que les types du moteur.

const piece = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });
const SALON = piece('salon');
const ATELIER = piece('atelier');
const GALERIE = piece('galerie');
const ENERGIE = piece('energie');
const EMBARQUEMENT = piece('embarquement');

const CARTE: CartePublique = {
  pieces: [
    { piece: SALON, statut: 'visitee', rect: null, regard: 'longtemps', feu: null, vide: false, creature: null, objets: [], distance: 1 },
    {
      piece: ATELIER,
      statut: 'actuelle',
      rect: null,
      regard: 'instant',
      feu: null,
      vide: false,
      creature: null,
      objets: [
        { objet: { sorte: 'objet', id: 'e-caisse', nom: 'caisse' }, position: { sorte: 'position', id: 'e-sous-grille', nom: 'sous_grille' } },
        { objet: { sorte: 'objet', id: 'e-burette', nom: 'burette' }, position: null },
      ],
      distance: 0,
    },
    { piece: GALERIE, statut: 'connue', rect: null, regard: null, feu: 'moment', vide: false, creature: null, objets: [], distance: 2 },
    { piece: ENERGIE, statut: 'visitee', rect: null, regard: 'instant', feu: null, vide: false, creature: 'moment', objets: [], distance: 2 },
    { piece: EMBARQUEMENT, statut: 'visitee', rect: null, regard: 'moment', feu: null, vide: true, creature: null, objets: [], distance: 1 },
  ],
  passages: [
    { id: 'e-p1', nom: 'porte', vuDepuis: [SALON, ATELIER], entre: [SALON, ATELIER], ouvert: true, dessin: 'porte', voyant: 'air', emplacement: null },
    { id: 'e-p2', nom: 'grille', vuDepuis: [ATELIER, ENERGIE], entre: null, ouvert: false, dessin: 'tirets', voyant: null, emplacement: null },
    { id: 'e-p3', nom: 'cloison', vuDepuis: [SALON], entre: [SALON, GALERIE], ouvert: false, dessin: 'porte', voyant: null, emplacement: null },
  ],
  capsules: [],
};

describe('vue LISTE de la carte (14 §2.8, D-212)', () => {
  it('ICI, puis les visitées de la plus proche, puis les connues ; positions en mots ici seulement ; aucun chiffre', () => {
    const lignes = lignesListeCarte(rendreListeCarte(TEXTES_AR01, CARTE));
    expect(lignes).toEqual([
      '── ICI ──',
      'ATELIER MAINTENANCE : @ vous',
      'porte du salon de transit : ouvert · AIR',
      'grille : destination ? · fermé',
      'Caisse : sous la grille',
      '── VISITÉES, DE LA PLUS PROCHE ──',
      'SALLE D’EMBARQUEMENT : vu il y a un moment · VIDE ○',
      'SALON DE TRANSIT : vu il y a longtemps',
      'LOCAL ÉNERGIE : vu à l’instant · CRÉATURE, vue il y a un moment · grille : destination ?',
      '── CONNUES, PAS ENCORE VISITÉES ──',
      'LOCAL TECHNIQUE : par sa porte · FEU, vu il y a un moment',
    ]);
    expect(lignes.join(' ')).not.toMatch(/\d/);
  });

  it('un bloc vide le dit', () => {
    expect(lignesListeCarte(rendreListeCarte(TEXTES_AR01, { pieces: [], passages: [], capsules: [] }))).toEqual([
      '── ICI ──',
      'aucune',
      '── VISITÉES, DE LA PLUS PROCHE ──',
      'aucune',
      '── CONNUES, PAS ENCORE VISITÉES ──',
      'aucune',
    ]);
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run content/textes/carte.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : nom d'un passage partagé**

Dans `content/textes/rendu.ts`, remplacer la fonction `nomDe` (et son commentaire) par :

```ts
/**
 * Nom public d'une cible ; un passage se nomme par sa destination (« la porte de l’atelier », C-06 OP-03), ou par son seul
 * nom tant que sa destination n'est pas connue (« la grille »).
 */
export function nomDe(textes: TextesMonde, cible: Cible): Nom {
  if (cible.sorte === 'passage') return nomPassage(textes, cible.nom, cible.vers);
  const nom = textes.noms[cible.nom];
  if (nom === undefined) throw new ErreurTexte(`Nom sans texte : ${cible.nom}.`);
  return nom;
}

/** Nom d'un passage par sa clé de nom et sa destination, si elle est connue ; partagé avec la carte (14 §2.8). */
export function nomPassage(textes: TextesMonde, nom: string, vers: RefPiece | null): Nom {
  const passage = textes.noms[nom];
  if (passage === undefined) throw new ErreurTexte(`Nom sans texte : ${nom}.`);
  return vers === null ? passage : { ...passage, texte: `${passage.texte} ${former('de', nomDe(textes, vers))}` };
}
```

- [ ] **Step 4 : écrire la vue LISTE**

Créer `content/textes/carte.ts` :

```ts
import type { CartePublique, Palier, PassageCarte, PieceCarte, RefPiece } from '../../engine';
import { former } from './gabarit';
import { nomSurPlan } from './lisibilite';
import { nomDe, nomPassage } from './rendu';
import type { TextesMonde } from './types';

// La carte en mots (14 §2) : vocabulaire fixe de l'instrument, le même dans toutes les stations, et vue LISTE, la même pour
// l'appli et la CLI (C-06 K-07). Aucun chiffre (12 §1) : l'ancienneté se dit en mots (D-151), la distance sert seulement à trier.

export const MOTS_CARTE = {
  ici: '@ vous',
  feu: 'FEU',
  vide: 'VIDE ○',
  creature: 'CRÉATURE',
  blocIci: 'ICI',
  blocVisitees: 'VISITÉES, DE LA PLUS PROCHE',
  blocConnues: 'CONNUES, PAS ENCORE VISITÉES',
  aucune: 'aucune',
  parSaPorte: 'par sa porte',
  destinationInconnue: 'destination ?',
  ouvert: 'ouvert',
  ferme: 'fermé',
  air: 'AIR',
  videVoyant: 'VIDE',
} as const;

export const ANCIENNETES: Readonly<Record<Palier, string>> = { instant: 'à l’instant', moment: 'il y a un moment', longtemps: 'il y a longtemps' };

const RANG: Readonly<Record<Palier, number>> = { instant: 0, moment: 1, longtemps: 2 };

/** Une entrée de la vue LISTE : un titre et ses détails, dans l'ordre d'affichage. */
export interface EntreeListe {
  readonly titre: string;
  readonly details: readonly string[];
}

export interface BlocListe {
  readonly titre: string;
  readonly entrees: readonly EntreeListe[];
}

/** Nom d'une pièce sur la carte, en capitales (14 §2.4). */
export function nomCarte(textes: TextesMonde, piece: RefPiece): string {
  return nomSurPlan(nomDe(textes, piece).texte);
}

/** États vus d'une pièce, avec leur ancienneté (14 §2.5) : feu, vide, créature. */
export function etatsDe(piece: PieceCarte): string[] {
  return [
    ...(piece.feu === null ? [] : [`${MOTS_CARTE.feu}, vu ${ANCIENNETES[piece.feu]}`]),
    ...(piece.vide ? [MOTS_CARTE.vide] : []),
    ...(piece.creature === null ? [] : [`${MOTS_CARTE.creature}, vue ${ANCIENNETES[piece.creature]}`]),
  ];
}

/** « vu il y a un moment » pour une pièce visitée ; rien pour la pièce actuelle ni une pièce pas encore visitée. */
export function regardDe(piece: PieceCarte): string | null {
  return piece.statut === 'visitee' && piece.regard !== null ? `vu ${ANCIENNETES[piece.regard]}` : null;
}

/** Passages vus depuis une pièce. */
function passagesDe(carte: CartePublique, piece: string): PassageCarte[] {
  return carte.passages.filter((passage) => passage.vuDepuis.some((depuis) => depuis.id === piece));
}

/** Nom d'un passage vu depuis une pièce : par sa destination, l'autre pièce, quand elle est connue. */
function nomVu(textes: TextesMonde, passage: PassageCarte, depuis: string): string {
  return nomPassage(textes, passage.nom, passage.entre?.find((piece) => piece.id !== depuis) ?? null).texte;
}

function rang(palier: Palier | null): number {
  return palier === null ? 3 : RANG[palier];
}

/** Vue LISTE (14 §2.8) : ICI, les pièces visitées de la plus proche, les pièces connues pas encore visitées. */
export function rendreListeCarte(textes: TextesMonde, carte: CartePublique): BlocListe[] {
  const actuelle = carte.pieces.find((piece) => piece.statut === 'actuelle');
  const ici: EntreeListe[] = [];
  if (actuelle !== undefined) {
    ici.push({ titre: nomCarte(textes, actuelle.piece), details: [MOTS_CARTE.ici, ...etatsDe(actuelle)] });
    for (const passage of passagesDe(carte, actuelle.piece.id)) {
      ici.push({
        titre: nomVu(textes, passage, actuelle.piece.id),
        details: [
          ...(passage.entre === null ? [MOTS_CARTE.destinationInconnue] : []),
          passage.ouvert ? MOTS_CARTE.ouvert : MOTS_CARTE.ferme,
          ...(passage.voyant === null ? [] : [passage.voyant === 'air' ? MOTS_CARTE.air : MOTS_CARTE.videVoyant]),
        ],
      });
    }
    // Positions en mots, ici seulement (D-212).
    for (const { objet, position } of actuelle.objets) {
      if (position !== null) ici.push({ titre: former('Nom', nomDe(textes, objet)), details: [nomDe(textes, position).texte] });
    }
  }
  const visitees = carte.pieces
    .map((piece, ordre) => ({ piece, ordre }))
    .filter(({ piece }) => piece.statut === 'visitee')
    .sort((a, b) => (a.piece.distance ?? Infinity) - (b.piece.distance ?? Infinity) || rang(a.piece.regard) - rang(b.piece.regard) || a.ordre - b.ordre)
    .map(({ piece }): EntreeListe => {
      const regard = regardDe(piece);
      const inconnus = passagesDe(carte, piece.piece.id).filter((passage) => passage.entre === null);
      return {
        titre: nomCarte(textes, piece.piece),
        details: [
          ...(regard === null ? [] : [regard]),
          ...etatsDe(piece),
          ...inconnus.map((passage) => `${nomVu(textes, passage, piece.piece.id)} : ${MOTS_CARTE.destinationInconnue}`),
        ],
      };
    });
  const connues = carte.pieces
    .filter((piece) => piece.statut === 'connue')
    .map((piece): EntreeListe => ({ titre: nomCarte(textes, piece.piece), details: [MOTS_CARTE.parSaPorte, ...etatsDe(piece)] }));
  return [
    { titre: MOTS_CARTE.blocIci, entrees: ici },
    { titre: MOTS_CARTE.blocVisitees, entrees: visitees },
    { titre: MOTS_CARTE.blocConnues, entrees: connues },
  ];
}

/** Vue LISTE en lignes de texte, pour la CLI (14 §3.5, K-07). */
export function lignesListeCarte(blocs: readonly BlocListe[]): string[] {
  return blocs.flatMap((bloc) => [
    `── ${bloc.titre} ──`,
    ...(bloc.entrees.length === 0
      ? [MOTS_CARTE.aucune]
      : bloc.entrees.map((entree) => (entree.details.length === 0 ? entree.titre : `${entree.titre} : ${entree.details.join(' · ')}`))),
  ]);
}
```

- [ ] **Step 5 : exporter depuis `content/index.ts`**

Ajouter `nomPassage,` à l'export depuis `'./textes/rendu'` (ordre alphabétique, après `nomDe,`), et :

```ts
export {
  ANCIENNETES,
  etatsDe,
  lignesListeCarte,
  MOTS_CARTE,
  nomCarte,
  regardDe,
  rendreListeCarte,
  type BlocListe,
  type EntreeListe,
} from './textes/carte';
```

- [ ] **Step 6 : lancer les tests, lint, types, commit**

Run : `npx vitest run content && npx eslint content --max-warnings 0 && npx tsc -b && npm run check:imports`
Expected : PASS ; aucune erreur.

```bash
git add content/textes/rendu.ts content/textes/carte.ts content/textes/carte.test.ts content/index.ts
git commit -m "#97 : vue liste de la carte en texte (ici, visitées de la plus proche, connues)"
```

---

### Task 5 : commande `carte` de la CLI et contrôle des textes de la carte

**Files :**
- Modify : `cli/partie-cli.ts` (`AIDE`, `executer`), `cli/partie-cli.test.ts`
- Modify : `tools/check-texts.ts` (`visiter`)

**Interfaces :**
- Consumes : tâche 4 (`rendreListeCarte`, `lignesListeCarte`), tâche 3 (`observation.carte`).
- Produces : commande `carte` (gratuite, sans écriture) ; le contrôle des textes rend la carte de chaque état exploré, sans chiffre ni identifiant.

- [ ] **Step 1 : écrire le test qui échoue**

Dans `cli/partie-cli.test.ts`, dans `describe('CLI')`, ajouter :

```ts
  it('carte : la vue liste, gratuite, sans chiffre ni identifiant (14 §3.5, K-07)', () => {
    const ctx = contexte();
    executer(['nouvelle', '--graine', '5'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    const sortie = executer(['carte'], ctx);
    expect(sortie).toEqual({
      lignes: [
        '── ICI ──',
        'CABINE : @ vous',
        'porte de l’atelier : fermé',
        'grille de la soute : fermé',
        '── VISITÉES, DE LA PLUS PROCHE ──',
        'aucune',
        '── CONNUES, PAS ENCORE VISITÉES ──',
        'ATELIER : par sa porte',
        'SOUTE : par sa porte',
      ],
      code: 0,
    });
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
    expect(executer(['aide'], ctx).lignes.some((ligne) => ligne.trimStart().startsWith('carte'))).toBe(true);
  });

  it('carte sans partie en cours : le dit, code d’erreur', () => {
    expect(executer(['carte'], contexte())).toEqual({ lignes: ['Aucune partie en cours. Commencez par : nouvelle'], code: 1 });
  });
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `npx vitest run cli/partie-cli.test.ts -t carte`
Expected : FAIL (« Commande inconnue : carte. »).

- [ ] **Step 3 : écrire la commande**

Dans `cli/partie-cli.ts` : ajouter `lignesListeCarte,` et `rendreListeCarte,` à l'import depuis `'../content'` (ordre alphabétique). Dans `AIDE`, après la ligne `voir [--ids] …` :

```ts
  '  carte                        Relire la carte : ici, pièces visitées et connues (gratuit).',
```

Dans `executer`, après le `case 'voir': { … }` :

```ts
    case 'carte': {
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      return { lignes: lignesListeCarte(rendreListeCarte(textes, observer(monde, partie.etat).carte)), code: 0 };
    }
```

- [ ] **Step 4 : la carte dans le contrôle des textes**

Dans `tools/check-texts.ts`, ajouter `lignesListeCarte,` et `rendreListeCarte,` à l'import depuis `'../content'`. Dans `visiter`, après la ligne `for (const ligne of rendreObservation(textes, observation)) rendre({ texte: ligne, ou: 'observation' });` :

```ts
  for (const ligne of lignesListeCarte(rendreListeCarte(textes, observation.carte))) rendre({ texte: ligne, ou: 'carte', sansChiffre: true });
```

- [ ] **Step 5 : lancer les tests et le contrôle des textes**

Run : `npx vitest run cli tools/check-texts.test.ts`
Expected : PASS.

Run : `npm run check:texts`
Expected : textes complets pour les trois mondes, aucune erreur « carte ».

- [ ] **Step 6 : essai à la main**

Run : `npm run cli -- nouvelle --graine 3 --monde ar-01 --partie .void-walker/essai-carte.json` puis `npm run cli -- carte --partie .void-walker/essai-carte.json`
Expected : le bloc ICI nomme le salon de transit, ses deux sorties fermées ou ouvertes ; atelier maintenance et local technique en « par sa porte ».

- [ ] **Step 7 : lint, types, commit**

Run : `npx eslint cli tools --max-warnings 0 && npx tsc -b`

```bash
git add cli/partie-cli.ts cli/partie-cli.test.ts tools/check-texts.ts
git commit -m "#97 : commande carte de la CLI ; textes de la carte contrôlés"
```

---

### Task 6 : documents, vérification complète, parcours du playtester, PR

**Files :**
- Modify : `docs/contrats/C-06-observation-connaissances.md` (ligne « Implémentation et tests »), `docs/14-carte.md` (ligne « Implémentation »), `docs/00-lire-en-premier.md` (reprise #97)

**Interfaces :**
- Consumes : tâches 1 à 5.
- Produces : documents de reprise à jour ; PR de la livraison 2.

- [ ] **Step 1 : statuts**

Dans C-06, ligne « **Implémentation et tests :** », remplacer « ; carte absente. » par « ; mémoire du passager et carte publique (K-01, K-02, K-05, K-07 en CLI, K-08 à K-13 de 14 §3.6) proposées par #97, livraison 2 ; écran de la carte absent. »

Dans `docs/14-carte.md`, ligne « **Implémentation :** », remplacer « mémoire et écran absents » par « livraison 2 (mémoire du passager, carte publique, commande `carte` de la CLI) proposée ; écran absent ».

Dans `docs/00-lire-en-premier.md`, à la fin du paragraphe de reprise #97, ajouter « Livraison 2 (mémoire et carte publique, commande `carte` de la CLI) proposée. » ; mettre la ligne « **Mise à jour :** » à la date du jour.

- [ ] **Step 2 : vérification complète**

Run : `npm run verify`
Expected : « Vérification complète : toutes les étapes sont vertes. »

- [ ] **Step 3 : commit**

```bash
git add docs/contrats/C-06-observation-connaissances.md docs/14-carte.md docs/00-lire-en-premier.md
git commit -m "#97 : statut de la livraison 2 (mémoire et carte publique)"
```

- [ ] **Step 4 : relecture indépendante et parcours CLI**

Demander au profil `relecteur` une relecture du diff contre la principale, avec `docs/14-carte.md` §3 et ce plan ; points à regarder en priorité : aucune fuite de pièce inconnue dans la carte, aucune règle qui lit `memoire`. Demander au profil `playtester` une partie d'AR-01 en CLI en relisant `carte` après chaque déplacement, à partir des seules observations publiques : la liste doit dire ce qu'il a vu, rien de plus. Traiter les points bloquants, relancer `npm run verify`.

- [ ] **Step 5 : PR, avec l'accord du porteur**

Demander au porteur s'il est d'accord pour pousser et ouvrir la PR. Après son accord :

```bash
git push -u origin moteur/97-memoire
gh pr create --title "#97 : carte, livraison 2 — mémoire du passager et carte publique" --body-file .void-walker/pr-97-memoire.md
```

Description, écrite dans ce fichier (dossier ignoré par git) : critères ↔ preuves (14 §3.1 souvenirs → tests « mémoire du passager » ; §3.2 paliers → K-11 et `engine/anciennete.test.ts` ; §3.3 pièces connues → K-09, K-12, sous-position, passage jamais franchi ; §3.4 carte publique → K-01, voyants, créature, conduit ; §3.5 sauvegarde et CLI → K-08, test `carte` de la CLI ; §3.6 → K-09 à K-13 ; C-06 K-01, K-02, K-05), compte rendu du playtester, limites (écran de la carte dans la livraison 3 ; positions du passager absentes du moteur, la liste donne celles des objets), « Zone orange (moteur) : fusion sur accord du porteur ».
