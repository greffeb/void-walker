# 18 — Traduire le jeu : taille du chantier

> **Statut :** investigation (#239). Aucune décision prise : [D-109](03-decisions.md#d-109--français-seulement-au-lancement) (français seulement au lancement) reste valable.
> **Date :** 2026-10-23.
> **Portée :** recensement des textes affichés au joueur, volume, obstacles techniques, approche proposée, langues envisagées et estimation de l'effort.

## 1. En bref

- Environ **11 500 mots** sont vus par le joueur (≈ 1 470 chaînes) : 10 300 dans le contenu, 1 200 dans l'interface. 7 400 mots de plus vivent dans les stations de test et de référence (AR-01, AR-02, monde de test, M-07 à M-12 isolées), atteignables seulement par `?station=`.
- Le contenu est **déjà centralisé** dans `content/` et typé (`Couche`, `TextesMorceau`, `Nom`). L'interface, elle, a ses **≈ 330 chaînes écrites en dur** dans 19 fichiers de `app/`.
- Le vrai obstacle n'est pas le volume : c'est la **grammaire française codée dans les gabarits**. 814 trous `{forme:rôle}` (`{le:objet}`, `{de:passage}`, `{e:…}` pour l'accord) s'appuient sur 171 noms portant genre, nombre et élision ; `former` (`content/textes/gabarit.ts`) ne sait produire que des articles français.
- Les contrôles de texte (`tools/check-texts.ts`, fuites de mots réservés, lisibilité sur le plan) sont écrits pour le français.
- Le texte français n'est **pas final** (« Texte final non validé » en tête de chaque fichier). Traduire maintenant, c'est retraduire à chaque réécriture.

**Recommandation :** ne pas lancer la traduction avant que le texte français soit validé. Si le porteur veut préparer le terrain, la seule étape bon marché et sans regret est l'extraction des chaînes de l'interface (§5, étape 1).

## 2. Méthode de mesure

Un script lit l'arbre syntaxique TypeScript de `content/`, `app/`, `engine/` et `cli/` (fichiers de test exclus), garde les chaînes et textes JSX qui ressemblent à de la prose (espace, accent ou mot capitalisé ; pas les identifiants, chemins, clés ou classes CSS), écarte les messages d'erreur destinés au développeur (`new Erreur…`, `console.…`) et compte les mots, un trou de gabarit comptant pour un mot. Les chiffres sont donc à ± 10 %.

## 3. Recensement

### 3.1 Contenu joué (`content/`), ≈ 1 140 chaînes, 10 300 mots

| Bloc | Fichiers | Mots |
|---|---|---|
| Menace (créature, traces, rencontres) | `textes/menace.ts` | 1 480 |
| Socle (récit des actions, refus, libellés, savoir) | `textes/socle.ts` | 1 290 |
| Documents à lire (notes, journaux, affiches) | `textes/documents.ts` + section `documents` des morceaux | ≈ 1 000 + une part des morceaux |
| Morceaux de station (noms, descriptions, messages d'IA Station) | `morceaux/*.ts` | ≈ 3 000 |
| Butin et pièces du catalogue | `catalogue/textes.ts` | 790 |
| Paires de stations | `stations/paires.ts` | 730 |
| Libellés et aide des morceaux | `textes/morceaux.ts` | 720 |
| Univers (noms des lieux, IA Station) | `textes/univers.ts` | 500 |
| Drone | `textes/drone.ts` | 390 |
| Carte, fin de partie, rendu | `textes/carte.ts`, `fin.ts`, `rendu.ts`, `couches.ts` | ≈ 160 |

### 3.2 Interface (`app/`), ≈ 330 chaînes, 1 200 mots, toutes en dur

| Fichier | Chaînes | Mots |
|---|---|---|
| `EcranOptions.tsx` | 99 | 450 |
| `EcranJeu.tsx` | 83 | 230 |
| `PanneauRapport.tsx` | 22 | 150 |
| `intro.ts` | 29 | 90 |
| `App.tsx`, `EcranIntro.tsx`, `ecran.ts`, `bulle.tsx`, `carte/*`, `EcranFin.tsx`, autres | ≈ 100 | ≈ 280 |

Il faut y ajouter `index.html` (`lang="fr"`), le manifeste de la PWA (`vite.config.ts`, `lang: 'fr'`, nom et description) et les pluriels écrits à la main (« Un rapport attend… » / « N rapports attendent… »).

### 3.3 Hors joueur

- `engine/` : ≈ 200 chaînes, toutes des messages de validation de monde (« Passage absent. »). Jamais affichées au joueur : **rien à traduire**.
- `cli/` : 55 chaînes (365 mots) pour la partie en ligne de commande des bots. À laisser en français.
- Stations de test et de référence : 7 400 mots. À ne traduire que si on veut jouer ces stations dans une autre langue.

## 4. Ce qui rend le chantier plus gros que le volume

1. **Gabarits accordés.** Les phrases sont écrites avec des trous qui choisissent l'article et l'accord : « Vous ouvrez {le:passage} », « tirez sur la poignée {de:passage} », « blessé{e:joueur} ». Chaque langue cible a besoin de ses propres formes (`the`/`a`/`an` en anglais ; genre et cas en allemand ; genre en espagnol et en italien) et ses noms de ses propres attributs. Le type `Nom` et la fonction `former` deviennent propres à une langue.
2. **Contrôles de fuites.** `couches.ts` interdit aux textes du socle et de l'univers de contenir les mots de la menace (`MOTS_MENACE`, `MOTS_TRACES`) et inversement (13 §7.2). Ces listes de radicaux sont françaises : il faut les réécrire par langue, sinon le contrôle ne protège plus rien.
3. **Lisibilité sur le plan.** `lisibilite.ts` coupe et place les noms des pièces selon une largeur de caractère fixe ; des noms plus longs (allemand) peuvent ne plus tenir. Le contrôle existe, il faudra juste le passer par langue et raccourcir des noms.
4. **Variantes.** `choisirVariante` tire parmi les variantes par un hachage de la clé : si une langue en a moins, le choix diffère, sans danger pour le rejeu (06 : une modification de langue ne change pas l'identité de la commande), mais chaque langue doit avoir au moins une variante par entrée.
5. **Tests.** 13 fichiers de test relisent des phrases françaises exactes ; ils resteront valables pour le français mais une autre langue a besoin de ses propres épingles.
6. **Ton.** D-110 (vouvoiement), D-113 (variantes écrites à la main) et la remarque du porteur « du vrai français, pas de l'anglais traduit » (D-281) valent dans l'autre sens : la traduction est une réécriture littéraire, pas un passage dans un outil.

## 5. Approche technique proposée

Pas de bibliothèque d'i18n générique (i18next, FormatJS) : le contenu est déjà structuré et typé, et ces bibliothèques ne savent pas faire les accords des gabarits. On garde le modèle actuel en ajoutant une dimension « langue ».

1. **Interface.** Extraire les ≈ 330 chaînes de `app/` dans un module de libellés typé (`app/libelles/fr.ts`, puis `en.ts` avec le même type : TypeScript refuse une clé manquante). Pluriels avec `Intl.PluralRules`. Indépendant du reste ; ½ à 1 PR.
2. **Contenu.** Des modules TypeScript par langue, pas de JSON : `SOCLE`, `UNIVERS`, `MENACE`, `DOCUMENTS` et la section `textes` des morceaux existent en un exemplaire par langue, avec les types actuels. Le catalogue choisit le jeu de textes à l'assemblage ; le moteur ne change pas (il ne produit aucun texte joueur).
3. **Grammaire.** `former` et `Nom` deviennent propres à la langue (`gabarit/fr.ts`, `gabarit/en.ts`) ; `analyserGabarit` vérifie les formes permises par langue.
4. **Choix de la langue.** Détection par `navigator.languages` au premier lancement, puis réglage dans « Son et texte » des options, gardé avec les autres réglages (`reglages.ts`). `document.documentElement.lang` suit le réglage. Une partie en cours se poursuit dans la langue choisie (le journal ne garde que des commandes).
5. **Contrôles.** `check:texts` tourne pour chaque langue : gabarits, fuites (listes de mots réservées par langue), lisibilité, complétude des clés.

## 6. Langues envisagées

| Langue | Intérêt | Coût grammatical |
|---|---|---|
| **Anglais** | Public le plus large, premier choix naturel | Faible : pas de genre, articles `the`/`a`/`an`, l'accord `{e:…}` disparaît |
| Espagnol, italien | Publics larges | Moyen : genre et nombre comme en français, formes proches |
| Allemand | Public large | Élevé : trois genres et quatre cas ; noms longs sur le plan |

Le choix appartient au porteur ; l'anglais seul couvre l'essentiel pour un coût minimal.

## 7. Estimation de l'effort

**Refactor (une fois, quelle que soit la langue)**, en PR d'agent comparables à celles du projet :

| Étape | PR |
|---|---|
| Libellés de l'interface + réglage de langue | 1 à 2 |
| Contenu par langue (couches, morceaux, catalogue) | 2 |
| Grammaire des gabarits par langue | 1 |
| Contrôles par langue (`check:texts`, fuites, lisibilité, tests) | 1 à 2 |
| **Total** | **5 à 7 PR** |

**Traduction (par langue)** : ≈ 11 500 mots de prose littéraire, avec variantes, contraintes de fuites et vouvoiement adapté. Un premier jet par un agent est rapide ; ce qui coûte, c'est la relecture par un locuteur natif, qu'aucun contrôle ne remplace : compter **3 à 5 jours de relecture humaine** par langue, davantage pour une traduction professionnelle (≈ 5 à 6 jours de traducteur). Les 7 400 mots des stations de test ne sont pas comptés.

**Coût récurrent** : chaque nouveau morceau (≈ 200 à 400 mots, voir [17 — ajouter un morceau](17-ajouter-un-morceau.md)) et chaque réécriture du français devront être traduits et relus dans chaque langue avant publication. C'est la principale raison d'attendre un texte français validé.
