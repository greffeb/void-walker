# L3 (#153) — Baie, passerelle, sans gravité : plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans, tâche par tâche. Les étapes se suivent par cases à cocher (`- [ ]`).

**But :** NOUVELLE PARTIE tire aussi la baie (M-06) en final, la passerelle (M-08) et la zone sans gravité (M-09) en chemin, et des stations à deux morceaux de chemin ; toutes prouvées à la construction.

**Architecture :** aucun fichier du moteur ne change. L'assembleur de L2 (`engine/station.ts`) enchaîne déjà autant de morceaux qu'on veut. Le contenu gagne trois morceaux et des compositions à un ou deux chemins. Il règle aussi les clés de texte en conflit et met une lettre aux pièces de même nom affiché. Le vérifieur (`tools/verifier-station.ts`) développe d'abord les états du morceau le plus avancé, sur le même graphe. `check:texts` contrôle une série fixe de stations.

**Pile :** TypeScript 6, React 19, Vitest 4, tsx ; aucun paquet ajouté.

**Spec :** [docs/superpowers/specs/2026-10-15-baie-passerelle-gravite-design.md](../specs/2026-10-15-baie-passerelle-gravite-design.md), approuvée par le porteur, à lire avec ce plan. Format de L2 : [spec L2](../specs/2026-10-15-premiere-station-tiree-design.md), [plan L2](2026-10-15-premiere-station-tiree.md). Maquette jetable (référence, pas à recopier telle quelle) : `.void-walker/spike-l3/mesure.ts`.

## Contraintes globales

- **Imports** (`docs/10-architecture.md` §3, `npm run check:imports`) : `content/` n'importe que `content/` et des **types** de `engine/` ; `tools/`, `app/`, `cli/` importent `engine/` et `content/`.
- **Moteur intouché :** aucun fichier de `engine/` ne change, ni règle de jeu, ni assembleur, ni format de sauvegarde (`FORMAT_ENREGISTREMENT = 1`).
- **Identifiants :**
  - station : `<composition>-<graine>`, motif `^[a-z0-9-]{1,40}$` ;
  - composition : `<chemins>-<final>-<place>`, chemins et final sans tiret (`m07`), dans l'ordre de la station, par exemple `m07-m08-m06-embarquement`.
  - Une composition a au plus 29 caractères.
- **Places de la créature**, une par morceau :

  | Morceau | Pièce | Nom affiché |
  | --- | --- | --- |
  | M-07 | `p-soute` | soute |
  | M-10 | `p-entrepot` | entrepôt |
  | M-03 | `p-reserve` | réserve |
  | M-06 | `p-embarquement` | salle d'embarquement |
  | M-08 | `p-magasin` | « magasin », m. |
  | M-09 | `p-cale` | « cale », f. |

  Dans une composition, deux places ne portent jamais le même nom.
- **Nouvelles clés de texte :**
  - `couloir_securite`, « couloir de sécurité », m. ;
  - `interrupteur_gravite`, « interrupteur de gravité », m., élision.
- **Morceaux de L2 :** M-07, M-10, M-03 et le vestibule ne changent pas (même empreinte). Les quatre compositions de L2 gardent leur identifiant et donnent la même station à graine égale.
- **Stations écrites en entier :** `m-08`, `m-09`, AR-02 restent telles quelles, parcours compris.
- **Vérifieur :** plafond par défaut 150 000 états, inchangé. Aucune assertion de temps.
- **Plans** (14 §5.6) : au moins 95 % de plans sur 1 000 graines par chaîne de tuiles.
- **Textes** en français, au vouvoiement, écrits à la main (C-07). Aucun texte de morceau ne nomme une pièce hors du morceau.
- **Tests :** ne pas affaiblir un test sans le dire dans la PR.
- **Commits :** messages sans accents. Vérification complète : `npm run verify`.

## Points de vigilance

Entrées que la spec implique sans qu'une tâche les exerce d'office ; chacune a son test dans la tâche indiquée.

1. **Deux pièces de même nom affiché sans lettre** dans une station publiée : le joueur ne peut pas les distinguer. Cas typique : deux clés différentes qui affichent le même texte. Attendu : des noms affichés tous distincts. → Tâche 2, test sur chaque composition publiée.
2. **Partie de L2 enregistrée** (`m07-m03-soute-2718281828`…). Attendu : la station reconstruite est identique, à l'empreinte du monde près. → Tâche 2.
3. **`?station=` / `--station` d'une composition mal formée :**
   - morceau répété (`m07-m07-m03-soute`) ;
   - final en tête (`m03-m07-m03-soute`) ;
   - trois chemins ;
   - final inconnu.

   Attendu : refus avec motif, sans exception ni assemblage. → Tâche 2.
4. **Rapport envoyé depuis une station à trois obstacles avec la baie :** l'export passe `lireDemande` du service de rapports. → Tâche 4.
5. **Texte d'un nouveau morceau** qui garde une trace de sa station de test : le touret dans l'atelier, la burette, « cabines du personnel », le terminal personnel. → Tâche 3 et tâche 4, tests sur les textes du morceau.

---

### Tâche 1 : Vérifieur — d'abord le morceau le plus avancé

**Fichiers :**
- Modifier : `tools/verifier-station.ts`
- Test : `tools/verifier-station.test.ts`

**Interfaces :**
- Produit :

```ts
/** Rang du morceau de chaque pièce, dans l'ordre de `monde.pieces` (préfixe avant « / ») ; 0 pour une pièce sans préfixe. */
export function rangsDesMorceaux(monde: DefMonde): (piece: string) => number;
export interface Recherche {
  readonly issue: 'trouve' | 'epuise' | 'plafond';
  /** Premier état qui satisfait le but, journal vidé ; `null` sinon. */
  readonly partie: Partie | null;
  readonly etats: number;
}
/** Recherche sans dé ni blessure (mêmes transitions que `verifierStation`), d'abord dans le morceau le plus avancé (spec L3 §6.2). */
export function chercherEtat(entree: EntreeMonde, but: (etat: EtatPartie) => boolean, options?: OptionsVerification): Recherche;
```

`verifierStation` garde sa signature et son rapport. Elle partage avec `chercherEtat` la même boucle, avec le but `etat.fin === 'evacuation'`.

**Ordre :** un seau par rang. On développe toujours le premier nœud non développé du seau de rang le plus haut, en file dans chaque seau. Sans préfixe, tout est au rang 0 : c'est la largeur d'aujourd'hui.

**Inchangé :** clé `cleEtatRegles`, transitions écartées (dé, blessure, consultation), plafond, conversion en témoin et rejeu.

- [ ] **Étape 1 : écrire les tests qui échouent :**
  - `rangsDesMorceaux` :
    - sur `CATALOGUE.resoudre('m07-m03-soute-2718281828')`, `vestibule/p-vestibule` → 0, `m-07/p-soute` → 1, `m-03/p-cabine` → 2 ;
    - sur AR-01, toutes les pièces → 0.
  - `chercherEtat` :
    - sur la même station, avec le but « passager dans `m-03/p-energie` » : `issue: 'trouve'`, et `partie.etat.piece` vaut `m-03/p-energie` ;
    - avec un but jamais atteint, sur la station de test du fichier (`station()`) : `issue: 'epuise'` ;
    - avec `maxEtats: 1` : `issue: 'plafond'`.
  - Une copie de `m07-m03-soute` sans `m-03/o-console` ni `m-03/o-bloc` donne `sans_sortie_sure` : l'épuisement vaut toujours en station assemblée.
  - Les tests existants restent verts tels quels. En particulier, « trouve un chemin minimal » a toujours ses 6 actions : le monde n'a pas de préfixe.
- [ ] **Étape 2 : lancer** `npx vitest run tools/verifier-station.test.ts`. Attendu : échec, exports absents.
- [ ] **Étape 3 : implémenter.** Garder un tableau de nœuds parallèle à `parents` : la partie, libérée une fois développée. Les seaux sont des tableaux d'indices, chacun avec une tête.
- [ ] **Étape 4 : lancer** les tests, puis `npm run check:stations`. Attendu : vert. Les quatre compositions de L2 et `m-07`, `m-10` sont prouvées ; noter états et longueurs de témoin.
- [ ] **Étape 5 : commit** `tools: le verifieur developpe d'abord le morceau le plus avance (#153)`.

### Tâche 2 : Compositions à un ou deux chemins

**Fichiers :**
- Modifier :
  - `content/stations/catalogue.ts`, `content/index.ts` ;
  - `tools/verifier-station.ts` (`morceauxDe`, `mesurerPlans`) ;
  - `tools/check-texts.ts` (`entreesAControler`) ;
  - `tools/captures.ts` (`composition.chemin` → `chemins`, sans autre changement ici).
- Tests :
  - `tools/stations.test.ts`, `tools/verifier-station.test.ts`, `tools/check-texts.test.ts` ;
  - `cli/partie-cli.test.ts`, s'il cite `chemin`.

**Interfaces :**
- Consomme : `MORCEAUX`, `EntreeMorceau` ; `reunir` et ses couches.
- Produit, dans `content/stations/catalogue.ts`, exporté par `content/index.ts` :

```ts
export interface Composition {
  readonly id: string;                 // 'm07-m08-m06-embarquement'
  readonly chemins: readonly string[]; // un ou deux morceaux de chemin distincts, dans l'ordre : ['m-07', 'm-08']
  readonly final: string;
  readonly creature: string;           // pièce préfixée
  readonly refus: string | null;       // première paire refusée de la station, dans l'ordre des morceaux
}
export const COMPOSITIONS_PUBLIEES: readonly string[];  // triées, égales aux compositions prouvées
/** Compositions publiées que `check:texts` explore (spec L3 §6.4). */
export const COMPOSITIONS_CONTROLEES: readonly string[];
/** Clé propre à deux morceaux de la station avec deux textes différents : `<clé>_<morceau sans tiret>` dans chacun (pièces, objets, liaisons, porte de sortie, noms et descriptions). */
export function sansConflit(entrees: readonly EntreeMorceau[]): EntreeMorceau[];
/** Pièces de même **nom affiché** : une lettre dans l'ordre des pièces (D-208). */
export function numeroter(entree: EntreeMonde): EntreeMonde;
```

**Règles :**
- Compositions = chaque suite d'un ou deux chemins distincts × chaque final (sauf `essai`) × chaque place des morceaux de la station, triées par identifiant.
- Toutes les paires de la station passent par la table : chemin–chemin, puis chaque chemin–final.
- Une clé renommée garde son nom et sa description. S'ils viennent des couches (`reunir([])`), ils sont recopiés sous la nouvelle clé.
- `resoudre` découpe l'identifiant comme aujourd'hui : composition = tout avant le dernier tiret.
- `COMPOSITIONS_CONTROLEES`, à cette tâche : les quatre de L2 et les deux qui existent maintenant à deux chemins, `m07-m10-m03-soute` et `m10-m07-m03-entrepot`. Elles seront remplacées par la série finale en tâche 4.

- [ ] **Étape 1 : relever l'existant.** Avant tout changement, imprimer avec un script jetable sous `.void-walker/` `empreinte(monde)` des stations `m07-m03-reserve-2718281828`, `m07-m03-soute-2718281828`, `m10-m03-entrepot-2718281828`, `m10-m03-reserve-2718281828`. Garder les valeurs.
- [ ] **Étape 2 : écrire les tests qui échouent** (`tools/stations.test.ts`) :
  - **Compositions :**
    - 4 compositions à un chemin et 6 à deux chemins (M-07 et M-10 dans les deux ordres, 3 places), toutes sans refus ;
    - identifiants uniques, triés, de 29 caractères au plus ;
    - places distinctes par composition.
  - **Vigilance 2 :** les quatre identifiants de l'étape 1 donnent exactement les empreintes relevées.
  - **G-02 :** avec la table sans M-07 + M-10, `m07-m10-m03-soute` est refusée, motif « Paire M-07 + M-10 absente de la table : refusée par défaut. », sans appel à l'assembleur.
  - **Vigilance 3 :** `resoudre` refuse sans exception ni assemblage :
    - `m07-m07-m03-soute-1`, `m03-m07-m03-soute-1` ;
    - `m07-m10-m07-m03-soute-1` (trois chemins) ;
    - `m07-m10-m99-soute-1`.
  - **Clés en conflit :** `sansConflit` sur M-07 et M-10 renomme `coursive` en `coursive_m07` et `coursive_m10` ; chaque morceau garde ses propres descriptions. Une station `m07-m10-m03-soute` se résout sans erreur.
  - **Vigilance 1 :** dans la station `m07-m10-m03-soute-2718281828`, les pièces se lisent « coursive A » et « coursive B » ; aucun nom affiché n'apparaît deux fois, ici et dans chaque composition publiée à sa graine de référence.
  - **D-208 :** `numeroter` met une lettre à deux clés différentes qui affichent le même texte. Le test existant « deux coursives » reste vert.
  - **GP-04** (`it.each(COMPOSITIONS_PUBLIEES)`) : la sortie mène à `<premier chemin>/p-quartiers`.
  - **Tirage :** « 3 000 tirages : chacune au moins une fois » remplace le test des 200 tirages.
  - **Contrôle des textes** (`tools/check-texts.test.ts`) : `entreesAControler` rend les mondes du catalogue, puis une station par `COMPOSITIONS_CONTROLEES`, dans cet ordre.
- [ ] **Étape 3 : lancer** `npx vitest run tools/stations.test.ts`. Attendu : échec.
- [ ] **Étape 4 : implémenter** les compositions, `sansConflit` (appelé avant l'assembleur dans `assemblerPrevue`), `numeroter` par nom affiché et `COMPOSITIONS_CONTROLEES`. Dans `check:texts`, `entreesAControler` lit `COMPOSITIONS_CONTROLEES`. `morceauxDe` et `mesurerPlans` suivent `chemins`.
- [ ] **Étape 5 : lancer** `npm run check:stations`. Ajouter à `COMPOSITIONS_PUBLIEES` les compositions prouvées, et seulement elles. Si l'une ne l'est pas, s'arrêter et le signaler.
- [ ] **Étape 6 : lancer** `npx vitest run tools cli app` puis `npm run check:texts`, `npm run lint`, `npm run typecheck`. Attendu : vert ; noter le temps de `check:texts`.
- [ ] **Étape 7 : commit** `content: compositions a un ou deux chemins, cles en conflit, lettres par nom affiche (#153)`.

### Tâche 3 : Morceaux M-08 et M-09 ; planche et bloc ; MX-01

**Fichiers :**
- Créer : `content/morceaux/m-08.ts`, `content/morceaux/m-09.ts`, `tools/melanges.test.ts`
- Modifier : `content/morceaux/index.ts`, `content/stations/catalogue.ts` (`COMPOSITIONS_PUBLIEES`, `COMPOSITIONS_CONTROLEES`)
- Test : `tools/stations.test.ts`, `tools/melanges.test.ts`

**Interfaces :**
- Consomme : `DefMorceau` (type), `TextesMorceau` ; `TEXTES_PROPRES_M08`, `TEXTES_PROPRES_M09` (noms et descriptions repris par import) ; `chercherEtat` (tâche 1).
- Produit : `MORCEAU_M08`, `TEXTES_MORCEAU_M08`, `MORCEAU_M09`, `TEXTES_MORCEAU_M09`, inscrits dans `MORCEAUX`.

**Données.** Tuiles, liaisons et objets de la maquette (`M08`, `M09` de `.void-walker/spike-l3/mesure.ts`).

**M-08 :**

| Champ | Valeur |
| --- | --- |
| Pièces | `p-quartiers` (4,0), `p-atelier` (0,0), `p-ouest` (8,0), `p-est` (8,3), `p-magasin` (12,3) ; toutes 4 × 3 |
| Liaisons | quartiers–atelier ouverte ; quartiers–ouest `porte_grippee` fermée, bruyante ; ouest–est `vide` ouverte `gouffre` ; est–magasin `porte` fermée |
| Objets | `o-planche` (pont, encombrant) dans l'atelier |
| Entrée, sortie | entrée `p-quartiers` ; sortie `{ piece: 'p-est', porte: { nom: 'porte' } }` |
| Créature | `['p-magasin']` |
| Apports | fournit `acces` |
| IA Station | `passerelle` à l'arrivée en `p-ouest` |

Textes de M-08 :
- noms et descriptions de `ouest`, `est`, `vide`, `planche` et message `passerelle`, repris de `TEXTES_PROPRES_M08` ;
- `atelier` réécrit sans le touret ;
- `magasin` écrit à neuf : deux variantes, sans « réserve ».

**M-09 :**

| Champ | Valeur |
| --- | --- |
| Pièces | `p-quartiers` (0,0), `p-sas-ouest` (4,0), `p-transfert` (8,0, 6 × 3, `gravite: 'coupee'`), `p-sas-est` (14,0), `p-cale` (18,0) |
| Liaisons | quartiers–sas ouest fermée ; sas ouest–transfert ouverte ; transfert–sas est ouverte ; sas est–cale fermée |
| Objets | `o-interrupteur-ouest` et `o-interrupteur-est`, nom `interrupteur_gravite`, `gravite: 'p-transfert'` |
| Entrée, sortie | entrée `p-quartiers` ; sortie `{ piece: 'p-sas-est', porte: { nom: 'porte' } }` |
| Créature | `['p-cale']` |
| Apports | fournit `acces` |
| IA Station | `gravite` à l'arrivée en `p-sas-ouest` |

Textes de M-09 :
- `sas_ouest`, `transfert`, `sas_est` et message `gravite`, repris de `TEXTES_PROPRES_M09` ;
- `interrupteur_gravite` : nom et descriptions de l'`interrupteur` de M-09 ;
- `cale` écrite à neuf, sans « soute ».

- [ ] **Étape 1 : écrire les tests qui échouent :**
  - **Morceaux** (`tools/stations.test.ts`) :
    - `validerMorceau` vide pour M-08 et M-09 ;
    - places `p-magasin` et `p-cale` ;
    - pas de touret ni de burette ;
    - planche `pont` et `encombrant` ;
    - deux interrupteurs de gravité, hors de la coursive ;
    - **vigilance 5** : aucun texte de M-08 ne contient « touret », aucun de M-09 « burette » ni « soute » ;
    - `fuitesDeCouches(MORCEAUX_TEXTES)` vide.
  - **Planche et bloc** (`tools/melanges.test.ts`, D-169), station `m08-m03-magasin` à sa graine de référence, depuis le départ, par les options publiques. Copier les aides `option`, `engager`, `refusee` et `attendre` du haut de `engine/morceaux.test.ts`. Gestes, sans dé :
    - ouvrir la porte du vestibule, entrer dans les quartiers, puis dans l'atelier ;
    - prendre la planche, revenir aux quartiers ;
    - ouvrir et passer la porte grippée ;
    - poser la planche en travers, traverser, reprendre la planche ;
    - ouvrir la sortie et entrer dans le local énergie.

    Ensuite :
    - « prendre le bloc » est refusé sans coût, état intact (W-02) ;
    - après « poser la planche », « prendre le bloc » est engagé et le bloc est en main.
  - **MX-01** (`tools/melanges.test.ts`), station `m10-m09-m03-entrepot`, depuis un état préparé, comme `MX-01 : ralentie, sa dérive…` du moteur :
    - passager dans `m-09/p-sas-est` ;
    - créature dans `m-09/p-sas-ouest`, `ralentie: { saute: false }`, indice vers `m-09/p-sas-est` ;
    - portes intérieures de M-09 ouvertes.

    Faire passer le temps (`attendre` sur la porte de la cale) jusqu'à ce que la créature atteigne `m-09/p-sas-est`. Attendu : **7** actions. Un commentaire d'une ligne dit pourquoi l'état est préparé.
- [ ] **Étape 2 : lancer** `npx vitest run tools/stations.test.ts tools/melanges.test.ts`. Attendu : échec.
- [ ] **Étape 3 : implémenter** les morceaux et leurs textes ; les inscrire dans `MORCEAUX`.
- [ ] **Étape 4 : lancer** `npm run check:stations`. Publier exactement les compositions prouvées : 4 chemins × M-03 à ce stade, soit 4 × 2 + 12 × 3 = 44 compositions. Si l'une n'est pas prouvée, s'arrêter et le signaler.
- [ ] **Étape 5 : `COMPOSITIONS_CONTROLEES`** devient `m07-m03-soute`, `m08-m07-m03-magasin`, `m10-m03-reserve`, `m10-m09-m03-entrepot` : la série finale, sans les compositions avec M-06. Lancer `npx vitest run tools cli app`, `npm run check:texts`, `npm run lint`, `npm run typecheck`. Attendu : vert.
- [ ] **Étape 6 : commit** `content: morceaux M-08 et M-09, planche et bloc, MX-01 en station assemblee (#153)`.

### Tâche 4 : Morceau M-06, pile ou face, vide dans les nouveaux morceaux

**Fichiers :**
- Créer : `content/morceaux/m-06.ts`
- Modifier : `content/morceaux/index.ts`, `content/stations/catalogue.ts` (`COMPOSITIONS_PUBLIEES`, `COMPOSITIONS_CONTROLEES` finale)
- Test : `tools/stations.test.ts`, `tools/melanges.test.ts`, `tools/check-texts.test.ts`

**Interfaces :**
- Consomme : `TEXTES_AR02` (noms et descriptions repris par import), `TEXTES_MORCEAU_ESSAI.descriptions.capsule` ; `chercherEtat` (tâche 1) ; `piecesSansAir` de `engine/etat.ts`.
- Produit : `MORCEAU_M06`, `TEXTES_MORCEAU_M06`, inscrits dans `MORCEAUX`.

**Données de M-06** (final) :

| Champ | Valeur |
| --- | --- |
| Pièces | `p-couloir` (3,0, 4 × 3, nom `couloir_securite`), `p-local` (0,0, 3 × 3), `p-panoramique` (7,0, 4 × 3), `p-embarquement` (7,3, 4 × 3), `p-cabine` sous-position |
| Liaisons | couloir–local ouverte ; couloir–panoramique `porte` fermée ; panoramique–embarquement `porte_grippee` fermée, bruyante ; embarquement–cabine `ecoutille` fermée |
| Objets | `o-signaletique` (couloir), `o-casier`, `o-combinaison` (protection), `o-decoupeuse` (perce) dans le local ; `o-baie` (vitrage extérieur), `o-kit` (rebouche 1) dans la panoramique ; `o-capsule` **alimentée** ; `o-pupitre` |
| Entrée | `p-couloir` |
| Créature | `['p-embarquement']` |
| Apports | demande `acces`, fournit `evacuation` |
| IA Station | aucun message |

Textes de M-06 :
- noms et descriptions d'AR-02 pour `local`, `panoramique`, `signaletique`, `casier`, `combinaison`, `decoupeuse`, `baie`, `kit` ;
- `capsule` : la description de l'embarquement d'essai ;
- `couloir_securite` écrit à neuf : deux variantes, avec les voyants d'air au-dessus des portes.

**`COMPOSITIONS_CONTROLEES` finale**, dans l'ordre :
1. `m07-m03-soute`
2. `m07-m08-m06-embarquement`
3. `m08-m07-m03-magasin`
4. `m09-m10-m06-cale`
5. `m10-m03-reserve`
6. `m10-m09-m03-entrepot`

- [ ] **Étape 1 : écrire les tests qui échouent :**
  - **Morceau** (`tools/stations.test.ts`) :
    - `validerMorceau` vide pour M-06 ;
    - place `p-embarquement`, capsule alimentée, écoutille fermée ;
    - **vigilance 5** : aucun texte de M-06 ne contient « cabines du personnel » ni « terminal » ;
    - aucun message d'assistance dans le morceau.
  - **Compositions :**
    - 88 compositions, 44 par final, 16 à un chemin, 72 à deux ;
    - aucune ne réunit M-03 et M-06.
  - **Pile ou face** (D-253) :
    - `tirer(suiteDe(0, …))` rend une station dont le final est `m-03` ;
    - `tirer(suiteDe(1, …))` rend une station dont le final est `m-06`.

    Le test « le tirage consomme le hasard dans l'ordre » prend ses nouvelles valeurs, sans changer ce qu'il montre.
  - **Vigilance 4 :** l'export d'une partie neuve de `m08-m09-m06-embarquement-2718281828` passe `lireDemande`.
  - **Couverture de `COMPOSITIONS_CONTROLEES`** (`tools/check-texts.test.ts`). Toutes sont publiées et couvrent :
    - chaque morceau ;
    - chaque place, au sens de `composition.creature` ;
    - chaque chemin en première et en seconde position ;
    - la paire M-09 + M-10 ;
    - la paire M-08 + M-03 ;
    - M-06 avec chacun de M-07, M-08, M-09, M-10.
  - **Vide** (`tools/melanges.test.ts`, D-246), par `chercherEtat` depuis le départ, sans dé ni blessure :
    - dans `m07-m09-m06-embarquement`, le but est une brèche ouverte, avec `piecesSansAir` qui contient `m-07/p-machines` et `m-09/p-transfert` ;
    - dans `m10-m08-m06-embarquement`, le but contient `m-08/p-ouest`, `m-08/p-est` et `m-10/p-chambre` ;
    - dans une station à deux chemins où la créature attend dans un chemin, le but est une brèche ouverte et la créature `neutralisee: 'inerte'` hors de `m-06/p-panoramique`. Essayer `m07-m08-m06-magasin` puis `m09-m10-m06-cale`.

    Chaque recherche rend `issue: 'trouve'`. Si aucune ne trouve sous le plafond, s'arrêter et le signaler.
- [ ] **Étape 2 : lancer** `npx vitest run tools/stations.test.ts tools/melanges.test.ts tools/check-texts.test.ts`. Attendu : échec.
- [ ] **Étape 3 : implémenter** M-06 et ses textes ; l'inscrire dans `MORCEAUX`.
- [ ] **Étape 4 : lancer** `npm run check:stations`. Publier exactement les 88 compositions prouvées. Si l'une ne l'est pas, s'arrêter et le signaler.
- [ ] **Étape 5 : lancer** `npx vitest run tools cli app`, `npm run check:texts`, `npm run lint`, `npm run typecheck`. Attendu : vert ; noter le temps de `check:texts`, autour de deux minutes visé.
- [ ] **Étape 6 : commit** `content: morceau M-06, pile ou face des finals, vide dans les nouveaux morceaux (#153)`.

### Tâche 5 : Rapport de `check:stations` — témoins, plans, statistiques

**Fichiers :**
- Modifier : `tools/verifier-station.ts`
- Test : `tools/verifier-station.test.ts`

**Interfaces :**
- Produit :

```ts
export interface LigneCatalogue { /* champs actuels, plus : */ readonly actions: number | null } // longueur du témoin, `null` si non prouvée
export interface MesureTirages {
  readonly tirages: number; readonly reussis: number; readonly msMoyenne: number; readonly msMax: number;
  readonly finals: Readonly<Record<string, number>>;      // 'm-03', 'm-06'
  readonly chemins: Readonly<Record<string, number>>;     // '1', '2' : nombre de morceaux de chemin
  readonly morceaux: Readonly<Record<string, number>>;    // chaque morceau de chemin et final
  readonly places: Readonly<Record<string, number>>;      // `composition.creature`
}
```

`MesurePlans.chemin` reste « vestibule + m-07 + m-08 + m-06 » pour chaque chaîne de morceaux permise : 32 chaînes.

- [ ] **Étape 1 : écrire les tests qui échouent :**
  - `verifierCatalogue(CATALOGUE)` :
    - 88 lignes `prouvee`, chacune avec `actions` entre 1 et 60, égal à la longueur du témoin annoncée dans le diagnostic ;
    - l'ensemble prouvé égale `COMPOSITIONS_PUBLIEES`.
  - `mesurerPlans(1000)` : 32 chaînes, chacune `trouves ≥ 950`.
  - `mesurerTirages(1000)` :
    - `reussis` 1 000 ;
    - `finals['m-03'] + finals['m-06'] === 1000`, chacun entre 400 et 600 ;
    - `chemins['1'] + chemins['2'] === 1000` ;
    - chaque place présente.
- [ ] **Étape 2 : lancer** `npx vitest run tools/verifier-station.test.ts`. Attendu : échec.
- [ ] **Étape 3 : implémenter**, avec une ligne JSON de statistiques dans la sortie de `npm run check:stations`.
- [ ] **Étape 4 : lancer** `npm run check:stations`. Garder la sortie complète pour les documents : verdicts, états, temps, témoins, empreintes de M-06, M-08, M-09, plans, statistiques.
- [ ] **Étape 5 : commit** `tools: temoins, plans et statistiques de tirage du catalogue (#153)`.

### Tâche 6 : Captures

**Fichiers :**
- Modifier : `tools/captures.ts`

- [ ] **Étape 1 : dans `capturerStations`** (étape « Stations tirées »), ajouter `?station=m08-m09-m06-embarquement-2718281828`, dans un contexte neuf, avec les mêmes contrôles que `STATION_CAPTUREE` :
  - partie sur cet identifiant ;
  - parole de réveil ;
  - départ ;
  - écran ;
  - plan au départ.

  Captures : réveil et plan.
- [ ] **Étape 2 : galerie des plans.** Six stations tirées pour chacun des quatre groupes (un ou deux chemins × M-03 ou M-06), au lieu de six par chemin, au hasard à graine fixe. Le texte de l'étape le dit.
- [ ] **Étape 3 : lancer** `npm run build` puis `npm run captures`. Attendu : réussi, nouvelles images présentes, aucune troncature.
- [ ] **Étape 4 : commit** `captures: station a trois obstacles avec la baie, galerie par groupe (#153)`.

### Tâche 7 : Vérification complète et documents de reprise (conversation principale)

- [ ] **Étape 1 :** `npm run verify`. Attendu : vert ; noter les temps de `check:stations` et `check:texts`.
- [ ] **Étape 2 : documents.**
  - 13 §3 : fiches M-06 (entrée, place), M-08 (magasin), M-09 (cale) ;
  - 13 §7.3 : ordre de recherche ;
  - 13, nouveau §7.6 : tableau du catalogue, empreintes, plans, statistiques, questions et réponses du porteur ;
  - 14 §5.6 : plans à quatre tuiles ;
  - 03 : réponses du porteur du 2026-10-15 et détails de l'agent ;
  - 00-lire-en-premier : reprise.
- [ ] **Étape 3 : commit** `docs: L3 de #106, mesures et reprise (#153)`.
