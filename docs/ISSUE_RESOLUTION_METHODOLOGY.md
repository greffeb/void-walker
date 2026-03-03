# Méthodologie de résolution des issues GitHub

> Ce document décrit le processus standard pour traiter un bug rapporté via une issue GitHub dans Void Walker.
> Il s'applique à toutes les issues de type `bug` ou `playtest`.

---

## Vue d'ensemble

```
Issue ouverte
     │
     ▼
1. Tentative de reproduction
     │
     ├─── Non reproduit ──► Fermer l'issue (non reproductible)
     │
     └─── Reproduit ──────► 2. Correction
                                  │
                                  ▼
                            3. Tests de non-régression
                                  │
                                  ▼
                            4. Tests unitaires (si nouveau code)
                                  │
                                  ▼
                            5. Vérification post-correction
                                  │
                                  ├─── Toujours présent ──► Retour en 2.
                                  │
                                  └─── Corrigé ──────────► 6. Fermer l'issue
```

---

## Étape 1 — Tentative de reproduction

### Objectif

Vérifier si le bug est encore présent dans l'état actuel du code avant d'investir du temps dans une correction.
Certains bugs sont silencieusement corrigés par des commits antérieurs.

### Procédure

Chaque issue de playtest contient un bloc de reproduction prêt à l'emploi. Le copier dans un fichier temporaire et l'exécuter **avec la seed exacte** de l'issue :

```bash
npx tsx --tsconfig tsconfig.json /tmp/repro_ISSUE_NR.ts
```

Le script doit rejouer exactement les mêmes inputs jusqu'au tour incriminé, puis vérifier l'état attendu vs l'état observé.

**Exemple de script de reproduction minimal :**

```typescript
import { createSeededRng } from "@engine/rng";
import { getSkeletonById } from "@content/scenarios";
import { getSettingById } from "@content/settings";
import { ALL_MODULES } from "@content/scenarios/modules";
import { assembleScenario } from "@engine/pacing";
import { initGame } from "@engine/game";
import { getSceneContext } from "@engine/scene";
import { processTurn } from "@engine/processTurn";
import { buildParserLocaleData } from "@content/parserData";

// ── Reproduction issue #XX ──────────────────────────────────────────────────
const rng    = createSeededRng(/* seed de l'issue */);
const skeleton = getSkeletonById(/* skeleton */)!;
const setting  = getSettingById(/* setting */)!;
const scenario = assembleScenario(skeleton, "standard", setting, ALL_MODULES, rng);
let state = initGame(scenario, /* class */, /* difficulty */, "Joueur", rng);
const parserData = buildParserLocaleData("fr");

// Rejouer tous les tours précédant le bug
const inputs = [/* tous les inputs de l'issue */];
for (const input of inputs) {
  const ctx = getSceneContext(state);
  const result = processTurn(state, input, ctx, parserData, rng);
  state = result.newState;
}

// Vérifier l'état au tour du bug
const bugInput = /* input incriminé */;
const ctx = getSceneContext(state);
const result = processTurn(state, bugInput, ctx, parserData, rng);
state = result.newState;

// Assertion : décrire ce qui DEVRAIT se passer
// Exemple : HP doit avoir augmenté, l'item ne doit plus être dans la scène, etc.
const observed = /* état observé */;
const expected = /* état attendu */;
if (observed === expected) {
  console.log("✓ Bug non reproduit — peut-être déjà corrigé");
} else {
  console.log("✗ Bug reproduit — correction nécessaire");
  console.log("  Attendu :", expected);
  console.log("  Obtenu  :", observed);
}
```

### Décision

| Résultat | Action |
|----------|--------|
| **Non reproduit** | Fermer l'issue avec le commentaire standard (§ 6a) |
| **Reproduit** | Passer à l'étape 2 |

---

## Étape 2 — Correction

### Analyse de la cause racine

Avant d'écrire une ligne de code, identifier **où** et **pourquoi** le bug se produit :

1. Lire le code en partant du point d'entrée (`processTurn` → `parser` → `resolver` → `consequences`…)
2. Tracer le flux de données jusqu'à l'état incorrect
3. Identifier la couche responsable (parser, resolver, engine, content, i18n)

### Règles de correction

- **Corriger à la bonne couche** — ne pas masquer un bug engine avec un patch narration
- **Pas de magic strings dans le code engine** — toute chaîne linguistique passe par i18n
- **Immutabilité** — toutes les transitions d'état retournent de nouveaux objets
- **Pas de sur-ingénierie** — corriger uniquement ce qui est cassé, sans refactoring périphérique
- **Respecter l'architecture** — les dépendances ne vont que vers le bas (Engine → Content → i18n, jamais l'inverse)

---

## Étape 3 — Tests de non-régression

### Principe

Tout bug corrigé **doit** être couvert par un test de régression pour qu'il ne réapparaisse jamais silencieusement.

### Emplacement

Ajouter le test dans `tests/unit/engine/regressions.test.ts` :

```typescript
// REG-0XX: Description courte du bug
describe('REG-0XX: description du bug', () => {
  it('description de la condition reproduisant le bug', () => {
    // Utiliser la seed exacte de l'issue
    const rng = createSeededRng(/* seed */);
    // ... setup minimal ...

    // Assert : l'état incorrect ne doit plus se produire
    expect(/* condition */).toBe(/* valeur attendue */);
  });
});
```

**Important :** les tests de régression ne sont **jamais supprimés**. Ils constituent la mémoire du projet.

### Vérification rapide

```bash
npx vitest run tests/unit/engine/regressions.test.ts
```

---

## Étape 4 — Tests unitaires pour le nouveau code (si applicable)

Si la correction introduit de **nouvelles fonctions, nouvelles branches ou nouveaux comportements**, les couvrir avec des tests unitaires dédiés.

### Localisation selon le type de code modifié

| Code modifié | Fichier de test |
|--------------|----------------|
| `src/engine/parser.ts` | `tests/unit/engine/parser.test.ts` |
| `src/engine/resolver.ts` | `tests/unit/engine/resolver.test.ts` |
| `src/engine/processTurn.ts` | `tests/unit/engine/processTurn.test.ts` |
| `src/engine/consequences.ts` | `tests/unit/engine/consequences.test.ts` |
| `src/content/scenarios/*.ts` | `tests/unit/content/scenarios/*Enriched.test.ts` |
| `src/i18n/` | `tests/unit/i18n/*.test.ts` |
| `src/content/parserData.ts` | `tests/unit/content/parserData.test.ts` |

### Commandes utiles

```bash
npm run test:watch                                       # Tests en mode watch pendant le développement
npx vitest run tests/unit/engine/parser.test.ts          # Un seul fichier de test
npm run typecheck                                        # Vérification TypeScript avant commit
npm run lint                                            # ESLint
```

---

## Étape 5 — Vérification post-correction

### Re-exécuter le script de reproduction

Relancer exactement le même script qu'à l'étape 1 :

```bash
npx tsx --tsconfig tsconfig.json /tmp/repro_ISSUE_NR.ts
```

Le script doit maintenant afficher `✓ Bug corrigé`.

### Passer la suite complète de tests

```bash
npm run check   # typecheck + lint + test:all (unité + stress + intégration)
```

Tous les tests doivent passer. Si des tests existants cassent :

1. Analyser pourquoi — s'agit-il d'un test qui reflétait le comportement bugué ?
2. Corriger le test pour refléter le comportement attendu, en documentant le changement
3. Ne jamais supprimer un test sans justification claire

### Décision

| Résultat | Action |
|----------|--------|
| Bug corrigé + tous les tests passent | Passer à l'étape 6 |
| Bug toujours présent | Retourner à l'étape 2 |
| Nouveaux tests échouent | Analyser + corriger avant de continuer |

---

## Étape 6 — Fermeture de l'issue

### 6a — Bug non reproduit (issue déjà résolue)

```bash
gh issue close NUMERO --comment "Impossible de reproduire ce bug avec la seed d'origine \
(SEED) dans l'état actuel du code. Le comportement attendu est correct : [décrire \
brièvement ce qui se passe maintenant]. Probablement résolu par un commit antérieur. \
Fermeture de l'issue."
```

### 6b — Bug corrigé

```bash
gh issue close NUMERO --comment "Corrigé.

**Cause racine :** [description concise de la cause]

**Correction :**
- [fichier modifié] : [ce qui a changé et pourquoi]
- [autre fichier] : [ce qui a changé]

**Tests :**
- Régression ajoutée dans regressions.test.ts (REG-0XX)
- [Autres tests ajoutés si applicable]

Tous les N tests passent."
```

---

## Référence rapide — Commandes

```bash
# Reproduction
npx tsx --tsconfig tsconfig.json /tmp/repro_XX.ts

# Tests ciblés
npx vitest run tests/unit/engine/regressions.test.ts
npx vitest run tests/unit/engine/FICHIER.test.ts

# Validation complète avant fermeture
npm run check

# Fermer une issue
gh issue close NUMERO --comment "MESSAGE"
```

---

## Notes importantes

- **La seed est sacrée** — toujours utiliser la seed exacte de l'issue pour la reproduction, jamais une seed aléatoire
- **Un bug non reproduit n'est pas un bug ignoré** — documenter pourquoi il n'est plus reproductible
- **Pas de correction sans test** — un bug sans test de régression reviendra
- **Respecter les Sacred Rules** (CLAUDE.md §Sacred Rules) — notamment : les résultats de dés sont sacrés, l'engine décide, le LLM narre
