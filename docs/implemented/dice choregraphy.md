# Phase 7.5 — Dice Roll Choreography: Spécification Complète d'Implémentation

> **Objectif :** Transformer le lancer de dé en une expérience *satisfaisante* — un suspense en 4 actes avec reveal progressif des modificateurs, retour haptique, et moments clutch.
> **Prérequis :** Sub-Phase 7.2 (theme/animations) en place
> **Durée estimée :** 6-8 heures
> **Principe :** Aucune chaîne FR/EN en dur dans le moteur. Uniquement des `StringKey`.

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble — La Chorégraphie en 4 Actes](#1-vue-densemble)
2. [Étape 1 — Nouveaux StringKeys (i18n)](#2-étape-1--stringkeys)
3. [Étape 2 — Traductions FR + EN](#3-étape-2--traductions)
4. [Étape 3 — Changement moteur `terrified` → DC](#4-étape-3--terrified)
5. [Étape 4 — Type `DifficultyLine` + `namedLines`](#5-étape-4--types)
6. [Étape 5 — Construction `namedLines` dans `calculateDifficulty()`](#6-étape-5--namedlines)
7. [Étape 6 — Ship Memory dans `processTurn.ts`](#7-étape-6--shipmemory)
8. [Étape 7 — Store Zustand (pendingDifficultyBreakdown)](#8-étape-7--store)
9. [Étape 8 — Hook `useDiceAnimation.ts` (refonte complète)](#9-étape-8--hook)
10. [Étape 9 — Composant `DiceAnimation.tsx` (refonte complète)](#10-étape-9--composant)
11. [Étape 10 — Haptic Feedback](#11-étape-10--haptic)
12. [Étape 11 — Skip-to-Result](#12-étape-11--skip)
13. [Étape 12 — CSS & Animations](#13-étape-12--css)
14. [Étape 13 — Intégration GameScreen / Game Loop](#14-étape-13--intégration)
15. [Tests à réaliser](#15-tests)
16. [Acceptance Criteria](#16-acceptance-criteria)

---

## 1. Vue d'ensemble — La Chorégraphie en 4 Actes {#1-vue-densemble}

L'animation du lancer de dé est une **chorégraphie cinématique en 4 actes** qui maximise le suspense. Chaque acte a un rôle émotionnel distinct.

### Timing global

| Acte | Nom | Durée | Rôle émotionnel |
|------|-----|-------|-----------------|
| 1 | L'Accumulation | ~150-200ms × N lignes + 300ms pause | Le joueur voit le DC monter/baisser ligne par ligne |
| 2 | Le Verdict DC | ~600ms | Impact visuel fort : "voilà ce que tu dois battre" |
| 3 | Le Lancer | ~2000ms | Le dé roule avec ralentissement progressif + haptic |
| 4 | Le Sauvetage | ~150-200ms × N lignes + 500ms résultat | Bonus révélés un par un → suspense "est-ce que ça passe ?" |

**Durée totale typique :** ~4.5-6 secondes (selon nombre de modificateurs)

### Exceptions : NAT 1 et NAT 20

- **NAT 20 :** Dès que le `20` se fixe à l'Acte 3 → explosion flash doré immédiate + `CRITIQUE !`. On **skip l'Acte 4** entièrement (les bonus sont inutiles).
- **NAT 1 :** Dès que le `1` se fixe → glitch effect immédiat + `FUMBLE !`. On **skip l'Acte 4** (les bonus ne sauvent rien).

### Skip-to-Result (tap pour accélérer)

- **Première partie d'une session :** Pas de skip, animation complète obligatoire.
- **Après le premier lancer complet :** Un tap n'importe où pendant l'animation saute directement au résultat final (Acte 4, dernière frame).
- Le skip est géré par un flag `hasSeenFullAnimation` persisté dans le store Zustand (reset à chaque nouvelle partie).

### Pas de son — Haptique uniquement

Aucun son. Toute la sensation passe par `navigator.vibrate()` :
- Acte 1 : micro-buzz 10ms à chaque ligne qui apparaît
- Acte 2 : buzz moyen 50ms quand le DC total apparaît
- Acte 3 : micro-buzz 5ms à chaque tick du dé (s'espace en ralentissant)
- Acte 4 : micro-buzz 10ms par ligne de bonus, puis 80ms au résultat final

---

## 2. Étape 1 — Nouveaux StringKeys {#2-étape-1--stringkeys}

**Fichier :** `src/i18n/types.ts`

Ajouter ces clés dans l'union `StringKey` :

```typescript
// --- Décomposition DC — modificateurs ---
| 'dice.modifier.incompatible'
| 'dice.modifier.noTool'
| 'dice.modifier.toolAdapted'
| 'dice.modifier.toolWrong'
| 'dice.modifier.dark'
| 'dice.modifier.zeroG'
| 'dice.modifier.timePressure'
| 'dice.modifier.targetHostile'
| 'dice.modifier.targetArmored'
| 'dice.modifier.targetCooperative'
| 'dice.modifier.targetAttached'
| 'dice.modifier.wounded'
| 'dice.modifier.terrified'
| 'dice.modifier.highStat'       // paramètre {stat} requis
| 'dice.modifier.creative'
| 'dice.modifier.shipMemory'

// --- Décomposition DC — labels structurels ---
| 'dice.dc.toBeat'

// --- Décomposition jet — labels ---
| 'dice.roll.luck'
| 'dice.roll.total'

// --- Résultat ---
| 'dice.result.success'
| 'dice.result.failure'
| 'dice.result.critSuccess'
| 'dice.result.critFailure'
```

**Vérification :** TypeScript doit compiler sans erreur après cet ajout. Les nouvelles clés doivent être utilisables avec `t()`.

---

## 3. Étape 2 — Traductions FR + EN {#3-étape-2--traductions}

### Fichier `src/i18n/locales/fr.ts`

```typescript
'dice.modifier.incompatible':      'Action incompatible',
'dice.modifier.noTool':            'Outil absent',
'dice.modifier.toolAdapted':       'Outil adapté',
'dice.modifier.toolWrong':         'Mauvais outil',
'dice.modifier.dark':              'Obscurité',
'dice.modifier.zeroG':             'Apesanteur',
'dice.modifier.timePressure':      'Pression temporelle',
'dice.modifier.targetHostile':     'Cible hostile',
'dice.modifier.targetArmored':     'Cible blindée',
'dice.modifier.targetCooperative': 'Cible coopérative',
'dice.modifier.targetAttached':    'Membre attaché',
'dice.modifier.wounded':           'Blessé',
'dice.modifier.terrified':         'Terrifié',
'dice.modifier.highStat':          '{stat} élevé',
'dice.modifier.creative':          'Créatif',
'dice.modifier.shipMemory':        'Mémoire du vaisseau',

'dice.dc.toBeat':                  'À battre',

'dice.roll.luck':                  'Chance',
'dice.roll.total':                 'Total',

'dice.result.success':             'SUCCÈS',
'dice.result.failure':             'ÉCHEC',
'dice.result.critSuccess':         'CRITIQUE !',
'dice.result.critFailure':         'FUMBLE !',
```

### Fichier `src/i18n/locales/en.ts`

```typescript
'dice.modifier.incompatible':      'Incompatible action',
'dice.modifier.noTool':            'No tool',
'dice.modifier.toolAdapted':       'Right tool',
'dice.modifier.toolWrong':         'Wrong tool',
'dice.modifier.dark':              'Darkness',
'dice.modifier.zeroG':             'Zero gravity',
'dice.modifier.timePressure':      'Time pressure',
'dice.modifier.targetHostile':     'Hostile target',
'dice.modifier.targetArmored':     'Armored target',
'dice.modifier.targetCooperative': 'Cooperative target',
'dice.modifier.targetAttached':    'Attached limb',
'dice.modifier.wounded':           'Wounded',
'dice.modifier.terrified':         'Terrified',
'dice.modifier.highStat':          'High {stat}',
'dice.modifier.creative':          'Creative',
'dice.modifier.shipMemory':        'Ship memory',

'dice.dc.toBeat':                  'To beat',

'dice.roll.luck':                  'Luck',
'dice.roll.total':                 'Total',

'dice.result.success':             'SUCCESS',
'dice.result.failure':             'FAILURE',
'dice.result.critSuccess':         'CRITICAL!',
'dice.result.critFailure':         'FUMBLE!',
```

**Vérification :** `npm run build` doit passer. Le type-checker s'assure que chaque `StringKey` a une entrée dans les deux locales.

---

## 4. Étape 3 — Changement moteur `terrified` → DC {#4-étape-3--terrified}

### Problème actuel

Dans `processTurn.ts`, `terrified` est un modificateur de **jet** (`conditionRollMod = -1`). On veut le déplacer côté **DC** pour qu'il soit visible dans la décomposition UI.

### 4.1 — `src/engine/constants.ts`

Ajouter dans `BALANCE.CONTEXT_MODIFIERS` :

```typescript
TERRIFIED_PLAYER: 1,
```

Juste après `WOUNDED_PLAYER: 1,`.

### 4.2 — `src/engine/difficulty.ts` → `getPlayerConditionMods()`

Ajouter **après** le bloc `wounded` dans cette fonction :

```typescript
// Terrified penalty (DC +1)
if (playerConditions.includes('terrified')) {
  mod += BALANCE.CONTEXT_MODIFIERS.TERRIFIED_PLAYER;
  details.push('terrified'); // clé interne, PAS de texte FR
}
```

### 4.3 — `src/engine/processTurn.ts` → Retirer `conditionRollMod`

**SUPPRIMER** ces lignes (aux alentours de la section "Calculate DC") :

```typescript
const conditionRollMod = current.character!.conditions.some(
  c => c.id === 'terrified',
) ? -1 : 0;
```

**MODIFIER** l'appel `rollCheck` pour passer `0` au lieu de `conditionRollMod` :

```typescript
// AVANT :
diceRoll = rollCheck(statId, statValue, lck, effectiveDC, conditionRollMod, rng);

// APRÈS :
diceRoll = rollCheck(statId, statValue, lck, effectiveDC, 0, rng);
```

### 4.4 — `src/engine/conditions.ts` → Nettoyage optionnel

La fonction `getConditionRollModifier()` existe dans `conditions.ts` et gère le `ALL_ROLLS_MINUS_1` pour terrified. Si `processTurn.ts` n'utilisait pas cette fonction mais faisait le check inline (ce qui est le cas dans le code actuel), alors cette fonction peut être marquée `@deprecated` ou laissée pour rétrocompatibilité. **Ne pas la supprimer** si d'autres endroits l'utilisent — vérifier d'abord avec un grep.

**Test immédiat :** `npm test` doit passer. Le test `difficulty.test.ts` doit montrer que `terrified` augmente désormais le DC.

---

## 5. Étape 4 — Type `DifficultyLine` + extension `DifficultyBreakdown` {#5-étape-4--types}

**Fichier :** `src/engine/types.ts`

### 5.1 — Ajouter le type `DifficultyLine`

```typescript
/** A single named line in the DC decomposition, for UI display */
export interface DifficultyLine {
  /**
   * Clé i18n — JAMAIS de texte en dur.
   * L'UI appellera t(labelKey) ou t(labelKey, labelParams).
   * Pour la ligne de base, utiliser VERB_REGISTRY[verb].nameKey.
   */
  labelKey: StringKey;

  /**
   * Paramètres optionnels pour interpolation i18n.
   * Ex: 'dice.modifier.highStat' → { stat: 'INT' }
   * La clé FR '{stat} élevé' deviendra 'INT élevé' dans l'UI.
   */
  labelParams?: Record<string, string>;

  /** Valeur signée (+2, -3, etc.) — les lignes avec value === 0 sont omises */
  value: number;

  /** Catégorie pour le styling couleur dans l'UI */
  category: 'base' | 'penalty' | 'bonus';
}
```

### 5.2 — Étendre `DifficultyBreakdown`

Ajouter le champ `namedLines` à l'interface existante :

```typescript
export interface DifficultyBreakdown {
  // Champs existants — NE PAS MODIFIER
  readonly base: number;
  readonly verbMod: number;
  readonly compatibilityPenalty: number;
  readonly contextMods: number;
  readonly creativityMod: number;
  readonly difficultyPresetMod: number;
  readonly total: number;
  readonly details: readonly string[];

  // NOUVEAU — lignes nommées pour l'UI de décomposition
  readonly namedLines: readonly DifficultyLine[];
}
```

**IMPORTANT :** Le champ `details: string[]` existant est conservé pour rétrocompatibilité (utilisé par le CLI, les traces debug, le testModule). `namedLines` est un champ **additionnel** et indépendant.

**IMPORTANT :** Tous les endroits qui construisent un `DifficultyBreakdown` littéral doivent maintenant inclure `namedLines`. Faire un grep de `DifficultyBreakdown` dans tout le codebase et ajouter `namedLines: []` là où c'est un breakdown vide/auto (ex : auto-verbs, mock data dans `useGameLoop.ts`).

Endroits probables à patcher :
- `calculateDifficulty()` → cas auto-verbs retourne `namedLines: []`
- `useGameLoop.ts` → le `autoResolution` mock breakdown → ajouter `namedLines: []`
- `useReplEngine.ts` → si un breakdown est construit manuellement
- Tous les fichiers de test qui créent un `DifficultyBreakdown` littéral

**Vérification :** `npm run build` doit passer sans erreur TypeScript.

---

## 6. Étape 5 — Construction `namedLines` dans `calculateDifficulty()` {#6-étape-5--namedlines}

**Fichier :** `src/engine/difficulty.ts`

À la fin de `calculateDifficulty()`, **avant** le `return` final et **après** le clamp du total, ajouter la construction des `namedLines`. Les variables locales nécessaires (`base`, `verbMod`, `compatibilityPenalty`, `toolResult`, `envResult`, `disposition`, `creativityMod`, `difficultyPresetMod`) sont déjà dans le scope.

```typescript
// === NAMED LINES FOR UI DECOMPOSITION ===
const namedLines: DifficultyLine[] = [];

// 1. Ligne de base : nameKey du verbe + valeur combinée (base + verbMod + preset)
//    VERB_REGISTRY[verb].nameKey est déjà un StringKey valide.
const baseTotal = base + verbMod + difficultyPresetMod;
namedLines.push({
  labelKey: VERB_REGISTRY[input.verb].nameKey,
  value: baseTotal,
  category: 'base',
});

// 2. Incompatibilité
if (compatibilityPenalty > 0) {
  namedLines.push({
    labelKey: 'dice.modifier.incompatible',
    value: compatibilityPenalty,
    category: 'penalty',
  });
}

// 3. Outil
if (toolResult.mod !== 0) {
  if (toolResult.mod < 0) {
    namedLines.push({
      labelKey: 'dice.modifier.toolAdapted',
      value: toolResult.mod,
      category: 'bonus',
    });
  } else {
    const toolKey: StringKey = toolResult.mod >= 5
      ? 'dice.modifier.noTool'
      : 'dice.modifier.toolWrong';
    namedLines.push({
      labelKey: toolKey,
      value: toolResult.mod,
      category: 'penalty',
    });
  }
}

// 4. Conditions d'environnement — une ligne par condition active
const envKeyMap: Partial<Record<EnvironmentCondition, StringKey>> = {
  dark:          'dice.modifier.dark',
  zero_g:        'dice.modifier.zeroG',
  time_pressure: 'dice.modifier.timePressure',
};
for (const condition of input.environmentConditions ?? []) {
  const key = envKeyMap[condition];
  if (key) {
    // Chaque condition a son propre mod dans BALANCE.CONTEXT_MODIFIERS
    const singleEnvMod =
      condition === 'dark' ? BALANCE.CONTEXT_MODIFIERS.IN_DARKNESS
      : condition === 'zero_g' ? BALANCE.CONTEXT_MODIFIERS.ZERO_GRAVITY
      : BALANCE.CONTEXT_MODIFIERS.TIME_PRESSURE;
    namedLines.push({ labelKey: key, value: singleEnvMod, category: 'penalty' });
  }
}

// 5. Disposition de la cible
if (disposition.mod !== 0) {
  // Mapper la detail string interne vers un StringKey
  const dispKeyMap: Record<string, StringKey> = {
    'cible coopérative': 'dice.modifier.targetCooperative',
    'cible hostile':     'dice.modifier.targetHostile',
    'cible fortifiée':   'dice.modifier.targetArmored',
  };
  // Normaliser la clé (le detail peut varier en casse)
  const normalizedDetail = disposition.detail.toLowerCase();
  let dispKey: StringKey = 'dice.modifier.targetHostile'; // fallback
  for (const [pattern, skey] of Object.entries(dispKeyMap)) {
    if (normalizedDetail.includes(pattern)) {
      dispKey = skey;
      break;
    }
  }
  namedLines.push({
    labelKey: dispKey,
    value: disposition.mod,
    category: disposition.mod > 0 ? 'penalty' : 'bonus',
  });
}

// 6. Cible attachée (body parts)
if (input.target?.properties.includes('attached' as PropertyId)) {
  namedLines.push({
    labelKey: 'dice.modifier.targetAttached',
    value: 3,
    category: 'penalty',
  });
}

// 7. Conditions joueur
if (input.playerConditions?.includes('wounded')) {
  namedLines.push({
    labelKey: 'dice.modifier.wounded',
    value: BALANCE.CONTEXT_MODIFIERS.WOUNDED_PLAYER,
    category: 'penalty',
  });
}
if (input.playerConditions?.includes('terrified')) {
  namedLines.push({
    labelKey: 'dice.modifier.terrified',
    value: BALANCE.CONTEXT_MODIFIERS.TERRIFIED_PLAYER,
    category: 'penalty',
  });
}

// 8. Stat élevée
const nlStatId = VERB_STATS[input.verb] as StatId | undefined;
if (nlStatId && input.playerStats[nlStatId] >= BALANCE.CONTEXT_MODIFIERS.HIGH_RELEVANT_STAT_THRESHOLD) {
  namedLines.push({
    labelKey: 'dice.modifier.highStat',
    labelParams: { stat: nlStatId },
    value: BALANCE.CONTEXT_MODIFIERS.HIGH_RELEVANT_STAT_BONUS,
    category: 'bonus',
  });
}

// 9. Créativité
if (creativityMod !== 0) {
  namedLines.push({
    labelKey: 'dice.modifier.creative',
    value: creativityMod,
    category: 'bonus',
  });
}

// NOTE : Ship Memory est injecté depuis processTurn.ts (voir Étape 6)
// NOTE : Failsafe n'est JAMAIS affiché — il reste silencieux
```

Puis modifier le `return` pour inclure `namedLines` :

```typescript
return {
  base, verbMod, compatibilityPenalty, contextMods, creativityMod,
  difficultyPresetMod, total, details,
  namedLines,  // ← NOUVEAU
};
```

Et le cas auto-verbs (début de la fonction) :

```typescript
if (AUTO_VERBS.has(input.verb)) {
  return {
    base: 0, verbMod: 0, compatibilityPenalty: 0,
    contextMods: 0, creativityMod: 0, difficultyPresetMod: 0,
    total: 0, details: ['Action automatique (DC 0)'],
    namedLines: [],  // ← NOUVEAU
  };
}
```

**Import nécessaire :** S'assurer que `DifficultyLine` et `StringKey` sont importés dans `difficulty.ts`. `StringKey` vient de `@i18n/types`.

---

## 7. Étape 6 — Ship Memory dans `processTurn.ts` {#7-étape-6--shipmemory}

**Fichier :** `src/engine/processTurn.ts`

Le `shipMemoryMod` est calculé **après** `calculateDifficulty()` (il dépend du targetId). L'injecter dans `breakdown.namedLines` :

```typescript
// Après le calcul de shipMemoryMod, AVANT le rollCheck :
if (shipMemoryMod !== 0) {
  // breakdown.namedLines est readonly, il faut le cast ou utiliser une copie mutable
  (breakdown.namedLines as DifficultyLine[]).push({
    labelKey: 'dice.modifier.shipMemory',
    value: shipMemoryMod,
    category: 'bonus',
  });
}
```

**Alternative plus propre :** si le type `readonly` pose problème, changer `namedLines` en mutable dans le type interne et ne le rendre `readonly` que dans l'interface exportée. Ou bien construire un nouveau breakdown :

```typescript
if (shipMemoryMod !== 0) {
  breakdown = {
    ...breakdown,
    namedLines: [
      ...breakdown.namedLines,
      {
        labelKey: 'dice.modifier.shipMemory' as StringKey,
        value: shipMemoryMod,
        category: 'bonus' as const,
      },
    ],
  };
}
```

Le **failsafe (`failsafeMod`)** n'est **JAMAIS** ajouté aux namedLines. Il reste entièrement silencieux.

---

## 8. Étape 7 — Store Zustand {#8-étape-7--store}

**Fichier :** le store Zustand principal (probablement `src/ui/store/gameStore.ts` ou équivalent)

### Nouveaux champs

```typescript
// Ajouter au state :
pendingDifficultyBreakdown: DifficultyBreakdown | null;
hasSeenFullAnimation: boolean;  // pour le skip-to-result

// Ajouter aux actions :
setDiceAnimation: (result: DiceResult, breakdown: DifficultyBreakdown) => void;
onDiceAnimationComplete: () => void;
```

### Implémentation

```typescript
setDiceAnimation: (result, breakdown) => set({
  pendingDiceResult: result,
  pendingDifficultyBreakdown: breakdown,
  isDiceAnimating: true,
}),

onDiceAnimationComplete: () => set((state) => ({
  pendingDiceResult: null,
  pendingDifficultyBreakdown: null,
  isDiceAnimating: false,
  hasSeenFullAnimation: true,  // première animation vue → skip autorisé
})),
```

**ATTENTION :** `hasSeenFullAnimation` est remis à `false` quand on lance une nouvelle partie.

---

## 9. Étape 8 — Hook `useDiceAnimation.ts` (refonte complète) {#9-étape-8--hook}

**Fichier :** `src/ui/hooks/useDiceAnimation.ts`

### Nouveau type de phases

```typescript
export type DicePhase =
  | 'idle'
  | 'dc_lines'       // Acte 1 : lignes DC une par une
  | 'dc_total'       // Acte 2 : score à battre avec impact
  | 'rolling'        // Acte 3 : dé qui roule
  | 'roll_lines'     // Acte 4 : bonus du jet ligne par ligne
  | 'result';        // Résultat final (succès/échec/crit/fumble)
```

### Interface d'entrée étendue

```typescript
interface UseDiceAnimationOptions {
  readonly diceResult: DiceResult | null;
  readonly difficultyBreakdown: DifficultyBreakdown | null;
  readonly canSkip: boolean;  // = store.hasSeenFullAnimation
  readonly onComplete: () => void;
}
```

### Interface de sortie étendue

```typescript
interface UseDiceAnimationReturn {
  readonly phase: DicePhase;
  readonly visibleDcLines: number;         // Combien de DC lines sont visibles (0..N)
  readonly showDcTotal: boolean;           // Acte 2 affiché ?
  readonly displayedDieNumber: number;     // Chiffre affiché pendant le roll (1-20)
  readonly visibleRollLines: number;       // Combien de roll bonus lines visibles (0..N)
  readonly showResult: boolean;            // Résultat final affiché ?
  readonly handleSkipTap: () => void;      // Callback pour skip au tap
}
```

### Logique de séquencement (pseudo-code)

```
Quand diceResult + breakdown deviennent non-null → démarrer la séquence :

1. phase = 'dc_lines'
   - Pour chaque ligne dans breakdown.namedLines (filtrées value !== 0) :
     - Attendre LINE_DELAY (150ms)
     - Incrémenter visibleDcLines
     - Appeler haptic(10)
   - Attendre PAUSE_AFTER_LINES (300ms)

2. phase = 'dc_total'
   - showDcTotal = true
   - Appeler haptic(50)
   - Attendre DC_TOTAL_HOLD (600ms)

3. phase = 'rolling'
   - Dé qui roule avec setInterval :
     - 0-800ms : tick toutes les 50ms (rapide)
     - 800-1400ms : tick toutes les 100ms (ralentit)
     - 1400-1800ms : tick toutes les 200ms (lent)
     - 1800-2000ms : se fixe sur diceResult.natural
   - À chaque tick : displayedDieNumber = random 1-20, haptic(5)
   - Au fix final : haptic(30)

   → SI natural === 20 : SAUTER À phase = 'result' (skip Acte 4)
     - Flash doré immédiat, haptic(80)
   → SI natural === 1 : SAUTER À phase = 'result' (skip Acte 4)
     - Glitch immédiat, haptic(80)

4. phase = 'roll_lines' (seulement si PAS nat 1/20)
   - Construire les lignes de bonus :
     Ligne 1 : stat (labelKey: t('stat.' + diceResult.stat), value: diceResult.statValue)
     Ligne 2 : luck (labelKey: 'dice.roll.luck', value: diceResult.luckBonus) — MASQUÉE si === 0
   - Pour chaque ligne visible :
     - Attendre LINE_DELAY (150ms)
     - Incrémenter visibleRollLines
     - Appeler haptic(10)
   - Attendre PAUSE_AFTER_LINES (200ms)
   - Afficher le total : t('dice.roll.total')
   - Attendre RESULT_DELAY (300ms)

5. phase = 'result'
   - showResult = true
   - Appeler haptic(80)
   - Attendre RESULT_HOLD (1500ms) — le joueur lit le résultat
   - Appeler onComplete()
```

### Constantes de timing

```typescript
const TIMING = {
  LINE_DELAY: 150,          // ms entre chaque ligne qui apparaît
  PAUSE_AFTER_DC_LINES: 300, // ms de silence avant le DC total
  DC_TOTAL_HOLD: 600,       // ms où le DC total est affiché seul
  ROLL_DURATION: 2000,      // ms de roulement du dé
  PAUSE_AFTER_ROLL_LINES: 200,
  RESULT_DELAY: 300,        // ms avant affichage du résultat
  RESULT_HOLD: 1500,        // ms avant onComplete
  CRIT_HOLD: 2000,          // ms pour nat 1/20 (plus long car spectaculaire)
} as const;
```

### Skip au tap

```typescript
const handleSkipTap = useCallback(() => {
  if (!canSkip || phase === 'idle' || phase === 'result') return;

  // Annuler tous les timers en cours
  cleanup();

  // Sauter directement au résultat final
  setVisibleDcLines(filteredDcLines.length);
  setShowDcTotal(true);
  setDisplayedDieNumber(diceResult!.natural);
  setVisibleRollLines(rollLines.length);
  setShowResult(true);
  setPhase('result');

  // Compléter après un court délai pour que le joueur voie le résultat
  timerRef.current = setTimeout(() => {
    onCompleteRef.current();
  }, 800);
}, [canSkip, phase, cleanup, diceResult, filteredDcLines, rollLines]);
```

---

## 10. Étape 9 — Composant `DiceAnimation.tsx` (refonte complète) {#10-étape-9--composant}

**Fichier :** `src/ui/components/DiceAnimation.tsx`

### Props

```typescript
interface DiceAnimationProps {
  readonly diceResult: DiceResult;
  readonly difficultyBreakdown: DifficultyBreakdown;
  readonly canSkip: boolean;
  readonly onComplete: () => void;
}
```

### Structure du composant

```tsx
export function DiceAnimation({
  diceResult, difficultyBreakdown, canSkip, onComplete,
}: DiceAnimationProps): JSX.Element {

  const {
    phase, visibleDcLines, showDcTotal, displayedDieNumber,
    visibleRollLines, showResult, handleSkipTap,
  } = useDiceAnimation({
    diceResult, difficultyBreakdown, canSkip, onComplete,
  });

  // Filtrer les namedLines avec value !== 0
  const dcLines = difficultyBreakdown.namedLines.filter(l => l.value !== 0);

  // Construire les lignes du jet (Acte 4)
  const rollLines: DifficultyLine[] = [];
  // Stat du personnage
  rollLines.push({
    labelKey: ('stat.' + diceResult.stat) as StringKey,
    value: diceResult.statValue,
    category: 'bonus',
  });
  // Luck (masqué si 0)
  if (diceResult.luckBonus > 0) {
    rollLines.push({
      labelKey: 'dice.roll.luck',
      value: diceResult.luckBonus,
      category: 'bonus',
    });
  }

  // DC effectif (après clamp)
  const effectiveDC = diceResult.difficulty;

  // Total affiché (cap visuel failsafe)
  const displayTotal = diceResult.total > 20 ? '≥ 20' : String(diceResult.total);

  // Résultat
  const isCrit = diceResult.critical;
  const isFumble = diceResult.fumble;
  const isSuccess = diceResult.success;

  let resultKey: StringKey;
  let resultColorClass: string;
  let flashClass: string;

  if (isCrit) {
    resultKey = 'dice.result.critSuccess';
    resultColorClass = 'dice-result--crit';
    flashClass = 'animate-flash-crit';
  } else if (isFumble) {
    resultKey = 'dice.result.critFailure';
    resultColorClass = 'dice-result--fumble';
    flashClass = 'animate-flash-failure';
  } else if (isSuccess) {
    resultKey = 'dice.result.success';
    resultColorClass = 'dice-result--success';
    flashClass = 'animate-flash-success';
  } else {
    resultKey = 'dice.result.failure';
    resultColorClass = 'dice-result--failure';
    flashClass = 'animate-flash-failure';
  }

  return (
    <GlitchEffect active={isFumble && showResult} duration={500}>
      <div
        className={`dice-overlay ${showResult ? flashClass : ''}`}
        onClick={handleSkipTap}
        role="button"
        tabIndex={0}
        aria-label="Skip dice animation"
      >
        {/* === SECTION DC (Actes 1+2) === */}
        <div className="dice-section dice-section--dc">
          {/* Lignes DC — apparaissent une par une */}
          {dcLines.slice(0, visibleDcLines).map((line, i) => (
            <DcLine key={i} line={line} isNew={i === visibleDcLines - 1} />
          ))}

          {/* Séparateur + Total DC (Acte 2) */}
          {showDcTotal && (
            <>
              <hr className="dc-separator" />
              <div className="dc-line dc-total animate-impact-large">
                <span>{t('dice.dc.toBeat')}</span>
                <span>{effectiveDC}</span>
              </div>
            </>
          )}
        </div>

        {/* === SECTION DÉ (Acte 3) === */}
        {(phase === 'rolling' || phase === 'roll_lines' || phase === 'result') && (
          <div className="dice-section dice-section--roll">
            {/* DC rappel grisé */}
            <div className="dc-reminder">DC: {effectiveDC}</div>

            {/* Le dé */}
            <div className={`dice-number ${showResult ? resultColorClass : ''}`}>
              🎲 {displayedDieNumber}
            </div>
          </div>
        )}

        {/* === SECTION BONUS JET (Acte 4) === */}
        {(phase === 'roll_lines' || phase === 'result') && !isCrit && !isFumble && (
          <div className="dice-section dice-section--bonuses">
            {rollLines.slice(0, visibleRollLines).map((line, i) => (
              <DcLine key={i} line={line} isNew={i === visibleRollLines - 1} />
            ))}

            {/* Total du jet */}
            {visibleRollLines >= rollLines.length && (
              <>
                <hr className="dc-separator" />
                <div className="dc-line dc-total">
                  <span>{t('dice.roll.total')}</span>
                  <span>{displayTotal}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* === RÉSULTAT FINAL === */}
        {showResult && (
          <div className={`dice-result ${resultColorClass} ${isCrit ? 'animate-shake' : ''}`}>
            {t(resultKey)}
            {!isCrit && !isFumble && (
              <span className="dice-result-margin">
                ({isSuccess ? '+' : ''}{diceResult.total - effectiveDC})
              </span>
            )}
          </div>
        )}
      </div>
    </GlitchEffect>
  );
}
```

### Sous-composant `DcLine`

```tsx
function DcLine({ line, isNew }: { line: DifficultyLine; isNew: boolean }) {
  const label = line.labelParams
    ? t(line.labelKey, line.labelParams)
    : t(line.labelKey);
  const sign = line.value > 0 ? '+' : '';
  const colorClass =
    line.category === 'penalty' ? 'dc-line--penalty'
    : line.category === 'bonus'  ? 'dc-line--bonus'
    : 'dc-line--base';

  return (
    <div className={`dc-line ${colorClass} ${isNew ? 'animate-impact-small' : ''}`}>
      <span className="dc-label">{label}</span>
      <span className="dc-value">{sign}{line.value}</span>
    </div>
  );
}
```

**IMPORTANT :** Le composant ne contient **AUCUNE** chaîne FR/EN en dur. Tout passe par `t()`.

---

## 11. Étape 10 — Haptic Feedback {#11-étape-10--haptic}

**Fichier :** `src/ui/hooks/useHaptic.ts` (créer si inexistant)

```typescript
/**
 * Haptic feedback — vibration uniquement, pas de son.
 * Silencieux si non supporté (desktop, vieux navigateurs).
 */
export function haptic(durationMs: number): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(durationMs);
    }
  } catch {
    // Silencieux — haptic n'est jamais critique
  }
}
```

### Utilisation dans le hook

Le hook `useDiceAnimation` appelle `haptic()` aux moments précis :

| Moment | Durée vibration |
|--------|----------------|
| Chaque ligne DC qui apparaît (Acte 1) | `haptic(10)` |
| DC total apparaît (Acte 2) | `haptic(50)` |
| Chaque tick du dé (Acte 3) | `haptic(5)` |
| Dé se fixe sur le résultat naturel | `haptic(30)` |
| Chaque ligne bonus qui apparaît (Acte 4) | `haptic(10)` |
| Résultat final affiché | `haptic(80)` |
| NAT 20 flash doré | `haptic(80)` |
| NAT 1 glitch | `haptic(80)` |

---

## 12. Étape 11 — Skip-to-Result {#12-étape-11--skip}

### Règle

- **`hasSeenFullAnimation === false`** → le tap ne fait rien, animation complète forcée
- **`hasSeenFullAnimation === true`** → un tap n'importe où sur le `dice-overlay` saute au résultat

### Implémentation

Le flag `hasSeenFullAnimation` est dans le store Zustand :
- Initialisé à `false` quand on lance une nouvelle partie
- Mis à `true` quand `onDiceAnimationComplete` est appelé pour la première fois
- Le composant `DiceAnimation` reçoit `canSkip={store.hasSeenFullAnimation}`

Le skip :
1. Annule tous les timers/intervals
2. Met immédiatement toutes les lignes visibles
3. Affiche le résultat final
4. Attend 800ms pour que le joueur puisse lire, puis appelle `onComplete()`

---

## 13. Étape 12 — CSS & Animations {#13-étape-12--css}

**Fichier :** `src/ui/styles/animations.css` (ajouter) + styles inline ou CSS modules

### Nouvelles animations

```css
/* Impact petit — chaque ligne DC/bonus qui apparaît */
@keyframes impact-small {
  0%   { transform: scale(1.06); opacity: 0.7; }
  100% { transform: scale(1);    opacity: 1; }
}
.animate-impact-small {
  animation: impact-small 120ms ease-out;
}

/* Impact grand — DC total + résultat */
@keyframes impact-large {
  0%   { transform: scale(1.15); opacity: 0.5; }
  50%  { transform: scale(1.02); }
  100% { transform: scale(1);    opacity: 1; }
}
.animate-impact-large {
  animation: impact-large 300ms ease-out;
}

/* Pulse pour le dé qui roule */
@keyframes die-tick {
  0%   { transform: scale(1.03); }
  100% { transform: scale(1); }
}
.animate-die-tick {
  animation: die-tick 80ms ease-out;
}

/* Flash crit (doré) */
@keyframes flash-crit {
  0%   { box-shadow: inset 0 0 0 3px var(--crit-gold); }
  50%  { box-shadow: inset 0 0 60px 10px var(--crit-gold); }
  100% { box-shadow: inset 0 0 0 0 transparent; }
}
.animate-flash-crit {
  animation: flash-crit 600ms ease-out;
}

/* Flash succès (vert) */
@keyframes flash-success {
  0%   { box-shadow: inset 0 0 0 3px var(--success); }
  50%  { box-shadow: inset 0 0 40px 8px var(--success); }
  100% { box-shadow: inset 0 0 0 0 transparent; }
}
.animate-flash-success {
  animation: flash-success 500ms ease-out;
}

/* Flash échec (rouge) */
@keyframes flash-failure {
  0%   { box-shadow: inset 0 0 0 3px var(--danger); }
  50%  { box-shadow: inset 0 0 40px 8px var(--danger); }
  100% { box-shadow: inset 0 0 0 0 transparent; }
}
.animate-flash-failure {
  animation: flash-failure 500ms ease-out;
}
```

### Styles du dice overlay

```css
.dice-overlay {
  position: absolute;
  inset: 0;
  top: 48px; /* en dessous du StatusBar */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(5, 5, 5, 0.94);
  z-index: 100;
  font-family: var(--font-mono);
  padding: 24px 20px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  cursor: pointer; /* indique que c'est tappable pour skip */
}

.dice-section { width: 100%; max-width: 320px; }

.dc-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  padding: 2px 0;
  letter-spacing: 0.05em;
}
.dc-line--base {
  font-size: 15px;
  color: var(--amber-glow);
  font-weight: bold;
  margin-bottom: 4px;
}
.dc-line--penalty .dc-value { color: var(--danger); }
.dc-line--bonus   .dc-value { color: var(--success); }

.dc-total {
  font-size: 20px;
  font-weight: bold;
  color: var(--amber-glow);
  text-shadow: 0 0 12px var(--amber-glow);
  letter-spacing: 0.1em;
}
.dc-separator {
  border: none;
  border-top: 1px solid var(--text-system);
  margin: 6px 0;
  opacity: 0.4;
}

.dc-reminder {
  font-size: 12px;
  color: var(--text-system);
  opacity: 0.5;
  text-align: center;
  margin-bottom: 8px;
}

.dice-number {
  font-size: 48px;
  font-family: var(--font-display); /* Orbitron */
  color: var(--amber-glow);
  text-align: center;
  text-shadow: 0 0 20px var(--amber-glow);
  margin: 12px 0;
}

.dice-result {
  font-size: 24px;
  font-family: var(--font-display);
  text-align: center;
  letter-spacing: 0.15em;
  margin-top: 12px;
}
.dice-result--success { color: var(--success); text-shadow: 0 0 10px var(--success); }
.dice-result--failure { color: var(--danger); text-shadow: 0 0 10px var(--danger); }
.dice-result--crit    { color: var(--crit-gold); text-shadow: 0 0 20px var(--crit-gold); }
.dice-result--fumble  { color: var(--danger); text-shadow: 0 0 20px var(--danger); }

.dice-result-margin {
  font-size: 14px;
  opacity: 0.6;
  margin-left: 8px;
}
```

### Scroll interne si beaucoup de lignes

Le `dice-overlay` a déjà `overflow-y: auto`. Si le contenu dépasse (cas rare : nightmare + toutes pénalités + environnement), le scroll est possible. Tester avec > 8 lignes.

### Mobile 320px

Toutes les valeurs en px/em sont choisies pour fonctionner sur 320px de large minimum. Le `max-width: 320px` sur `.dice-section` garantit un layout centré sur tablette/desktop.

---

## 14. Étape 13 — Intégration GameScreen / Game Loop {#14-étape-13--intégration}

### Dans le game loop hook (ou là où le store est alimenté)

Quand `processTurn()` retourne un résultat avec un jet de dé, passer **à la fois** le `DiceResult` et le `DifficultyBreakdown` au store :

```typescript
// Après processTurn() :
if (turnResult.diceResult && turnResult.difficultyBreakdown) {
  store.setDiceAnimation(turnResult.diceResult, turnResult.difficultyBreakdown);
}
```

**IMPORTANT :** Vérifier que `TurnResult` expose bien `difficultyBreakdown`. Si ce n'est pas le cas, l'ajouter au type `TurnResult` dans `types.ts` et le populer dans `processTurn.ts` (le `traceDifficultyBreakdown` existe déjà, il suffit de l'exposer).

Vérifier aussi dans `useGameLoop.ts` — le `ResolutionData` a déjà un `difficultyBreakdown` mais avec un type simplifié. Il faut s'assurer que le `DifficultyBreakdown` complet (avec `namedLines`) est transmis.

### Dans GameScreen.tsx

```tsx
{store.isDiceAnimating && store.pendingDiceResult && store.pendingDifficultyBreakdown && (
  <DiceAnimation
    diceResult={store.pendingDiceResult}
    difficultyBreakdown={store.pendingDifficultyBreakdown}
    canSkip={store.hasSeenFullAnimation}
    onComplete={store.onDiceAnimationComplete}
  />
)}
```

L'overlay couvre le NarrativePanel mais **PAS** le StatusBar (HP/O2 restent visibles).

---

## 15. Tests à réaliser {#15-tests}

### 15.1 — Tests unitaires moteur

**Fichier :** `tests/unit/engine/difficulty.test.ts`

```
TEST 1 : terrified augmente le DC de TERRIFIED_PLAYER (1)
  - Input avec playerConditions: ['terrified']
  - Vérifier result.total > result sans terrified
  - Vérifier result.contextMods inclut la valeur

TEST 2 : terrified apparaît dans namedLines
  - Input avec playerConditions: ['terrified']
  - Vérifier qu'une DifficultyLine avec labelKey 'dice.modifier.terrified'
    existe dans result.namedLines
  - Vérifier value === BALANCE.CONTEXT_MODIFIERS.TERRIFIED_PLAYER

TEST 3 : namedLines ne contient que des lignes avec value !== 0
  - Input basique (pas d'env, pas de conditions, pas de créativité)
  - Vérifier que toutes les lignes dans namedLines ont value !== 0

TEST 4 : namedLines contient la ligne de base avec le verb nameKey
  - Input avec verb HACK
  - Vérifier namedLines[0].labelKey === VERB_REGISTRY.HACK.nameKey
  - Vérifier namedLines[0].category === 'base'

TEST 5 : namedLines — outil adapté → bonus
  - Input avec SHOOT + outil ranged
  - Vérifier une ligne 'dice.modifier.toolAdapted' avec category 'bonus'

TEST 6 : namedLines — pas d'outil → pénalité
  - Input avec SHOOT sans outil
  - Vérifier une ligne 'dice.modifier.noTool' avec category 'penalty'

TEST 7 : namedLines — darkness → pénalité
  - Input avec environmentConditions: ['dark']
  - Vérifier une ligne 'dice.modifier.dark'

TEST 8 : namedLines — stat élevée → bonus avec labelParams
  - Input avec verb HACK, playerStats: { INT: 5, ... }
  - Vérifier une ligne 'dice.modifier.highStat' avec labelParams: { stat: 'INT' }

TEST 9 : namedLines — créativité → bonus
  - Input avec creative: true et suggestions différentes
  - Vérifier une ligne 'dice.modifier.creative'

TEST 10 : auto verbs → namedLines est vide
  - Input avec verb TAKE
  - Vérifier result.namedLines.length === 0

TEST 11 : total des namedLines.value === breakdown.total
  - Pour n'importe quel input, la somme de toutes les namedLines values
    doit correspondre au total avant clamp.
  - Attention : le clamp peut faire diverger le total final.
    Le test vérifie la somme AVANT clamp (ou vérifie la cohérence logique).
```

### 15.2 — Test d'intégration terrified → DC (plus roll modifier)

**Fichier :** `tests/unit/engine/processTurn.test.ts` (ou test existant)

```
TEST : terrified ne modifie plus le roll, mais augmente le DC
  - Setup : état avec character ayant condition terrified
  - Exécuter processTurn avec un input valide
  - Vérifier que diceRoll.modifier === 0 (plus de conditionRollMod)
  - Vérifier que effectiveDC est plus élevé qu'avec le même setup sans terrified
```

### 15.3 — Tests i18n

```
TEST : Chaque nouveau StringKey a une traduction FR
  - Itérer sur les nouvelles clés dice.modifier.*, dice.dc.*, dice.roll.*, dice.result.*
  - Vérifier t(key) !== `[${key}]` en locale FR

TEST : Chaque nouveau StringKey a une traduction EN
  - Même chose en locale EN

TEST : dice.modifier.highStat avec interpolation
  - t('dice.modifier.highStat', { stat: 'INT' }) === 'INT élevé' (FR)
  - t('dice.modifier.highStat', { stat: 'INT' }) === 'High INT' (EN)
```

### 15.4 — Tests visuels manuels (checklist)

```
□ Lancer avec 1 seul modificateur DC → 1 ligne apparaît puis DC total
□ Lancer avec 6+ modificateurs → scroll si nécessaire sur mobile 320px
□ NAT 20 → flash doré immédiat, pas d'Acte 4, texte "CRITIQUE !"
□ NAT 1 → glitch effect immédiat, pas d'Acte 4, texte "FUMBLE !"
□ Succès serré (total = DC exactement) → suspense correct, "SUCCÈS (+0)"
□ Échec d'un cheveu (total = DC - 1) → "ÉCHEC (-1)"
□ Failsafe actif (total > 20) → affiche "≥ 20" pas le vrai total
□ Luck bonus = 0 → ligne Chance masquée dans l'Acte 4
□ Skip au tap fonctionne APRÈS le premier lancer complet
□ Skip au tap NE FONCTIONNE PAS sur le premier lancer
□ Haptic perceptible sur Android Chrome (si device le supporte)
□ Animation fluide 60fps sur mobile
□ StatusBar (HP/O2) reste visible pendant l'animation
□ L'input est disabled pendant toute la durée de l'animation
□ Après l'animation, le texte narratif commence en typewriter
```

---

## 16. Acceptance Criteria {#16-acceptance-criteria}

```
✅ Aucune chaîne FR/EN en dur dans le moteur ou les types
✅ Tous les nouveaux labels sont des StringKey déclarés dans types.ts
✅ fr.ts et en.ts ont une entrée pour chaque nouveau StringKey
✅ terrified est une pénalité DC (+1), PLUS un modificateur de jet
✅ namedLines ne contient que des lignes avec value !== 0
✅ La ligne de base utilise VERB_REGISTRY[verb].nameKey (déjà un StringKey)
✅ Ship Memory apparaît dans namedLines si shipMemoryMod !== 0
✅ Le failsafe n'apparaît JAMAIS dans l'UI
✅ Si total > 20, l'UI affiche '≥ 20'
✅ La chorégraphie en 4 actes joue correctement avec les timings décrits
✅ NAT 20 et NAT 1 skipent l'Acte 4 et jouent leur animation spéciale
✅ Haptic feedback fonctionne sur mobile, silencieux sur desktop
✅ Skip-to-result fonctionne après le premier lancer complet d'une session
✅ Scroll interne fonctionnel si > 8 lignes DC
✅ Animation fluide sur mobile 320px
✅ npm test passe (tous les tests engine + i18n + nouveaux tests namedLines)
✅ npm run build passe sans erreur TypeScript
```

---

## ORDRE D'IMPLÉMENTATION RECOMMANDÉ

Exécuter dans cet ordre exact, chaque étape doit compiler avant de passer à la suivante :

| # | Étape | Fichier(s) | Validation |
|---|-------|-----------|------------|
| 1 | StringKeys | `src/i18n/types.ts` | `npm run build` |
| 2 | Traductions FR | `src/i18n/locales/fr.ts` | `npm run build` |
| 3 | Traductions EN | `src/i18n/locales/en.ts` | `npm run build` |
| 4 | TERRIFIED_PLAYER constant | `src/engine/constants.ts` | `npm run build` |
| 5 | DifficultyLine type + namedLines | `src/engine/types.ts` | `npm run build` (patcher tous les endroits qui construisent un DifficultyBreakdown) |
| 6 | terrified dans getPlayerConditionMods | `src/engine/difficulty.ts` | `npm test` |
| 7 | namedLines dans calculateDifficulty | `src/engine/difficulty.ts` | `npm test` |
| 8 | Retirer conditionRollMod + Ship Memory | `src/engine/processTurn.ts` | `npm test` |
| 9 | Nouveaux tests namedLines | `tests/unit/engine/difficulty.test.ts` | `npm test` |
| 10 | useHaptic hook | `src/ui/hooks/useHaptic.ts` | `npm run build` |
| 11 | Store Zustand updates | store file | `npm run build` |
| 12 | useDiceAnimation refonte | `src/ui/hooks/useDiceAnimation.ts` | `npm run build` |
| 13 | DiceAnimation refonte | `src/ui/components/DiceAnimation.tsx` | `npm run build` |
| 14 | CSS animations | `src/ui/styles/animations.css` + styles | `npm run build` |
| 15 | Intégration GameScreen | `src/ui/screens/GameScreen.tsx` + game loop | `npm run build` + test manuel |
| 16 | Tests manuels visuels | — | Checklist §15.4 |
