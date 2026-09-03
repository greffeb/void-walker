# Phase 7 — UI Production (Mobile-First PWA)

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — UI CRT, carte canvas, dés, PWA. Le polish UX reste ouvert (chantier **P4**).
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **Status:** BRAINSTORM COMPLETE — Ready for implementation
> **Estimated duration:** 3 weeks (7 sub-phases, independently executable)
> **Prerequisites:** Phase 6 complete, Phase 6B complete (game loop integration)
> **Art direction:** Cassette Futurism — Ambre Nostromo
> **Orientation:** Portrait only (pas de landscape)

---

## Table des matières

1. [Décisions verrouillées](#1-décisions-verrouillées)
2. [Direction artistique](#2-direction-artistique-cassette-futurism-ambre)
3. [Architecture technique](#3-architecture-technique)
4. [Sub-Phase 7.1 — Zustand Store & Game Hook](#4-sub-phase-71--zustand-store--game-hook)
5. [Sub-Phase 7.2 — Theme & Design System](#5-sub-phase-72--theme--design-system)
6. [Sub-Phase 7.3 — Title Screen & Character Creation](#6-sub-phase-73--title-screen--character-creation)
7. [Sub-Phase 7.4 — Game Screen Layout & Narrative](#7-sub-phase-74--game-screen-layout--narrative)
8. [Sub-Phase 7.5 — Dice Animation & Action Feedback](#8-sub-phase-75--dice-animation--action-feedback)
9. [Sub-Phase 7.6 — Modals (Map, Inventory, Settings)](#9-sub-phase-76--modals-map-inventory-settings)
10. [Sub-Phase 7.7 — Save/Load, End Screen & Polish](#10-sub-phase-77--saveload-end-screen--polish)
11. [Phase 7B — Future (Audio, Carte avancée, Polish)](#11-phase-7b--future)
12. [Acceptance Criteria globaux](#12-acceptance-criteria-globaux)

---

## 1. Décisions verrouillées

Ces décisions sont issues du brainstorm et ne doivent PAS être remises en question pendant l'implémentation.

| # | Décision | Valeur |
|---|----------|--------|
| 1 | Art direction | Cassette Futurism, palette ambre/Nostromo |
| 2 | Palette principale | Ambre (#FFB000) sur noir profond (#0A0A0A), rouge alarme pour danger |
| 3 | Typo narrative | Monospace (IBM Plex Mono ou Space Mono) |
| 4 | Typo titres | Orbitron ou Major Mono Display |
| 5 | State management | Zustand — store unique, propre, pas de bricolage |
| 6 | Animation dés — séquence | DC affiché (1s) → Dé roule (2s suspense) → Flash bord (0.5s) → Narratif |
| 7 | Animation dés — crits | NAT 20: flash intense doré. NAT 1: glitchs visuels |
| 8 | Animation dés — blocage | Joueur bloqué pendant toute l'animation |
| 9 | Actions sans dé | Pas d'animation dé, passage direct au narratif |
| 10 | Carte | Modal plein écran, nœuds du graphe, version simple |
| 11 | Inventaire | Modal avec interaction (utiliser/examiner/jeter via parser) |
| 12 | Audio | Placeholder Phase 7A : architecture ready, implémentation 7B |
| 13 | SFX | Placeholder Phase 7A : hooks prêts, sons en 7B |
| 14 | Clavier mobile | Le texte narratif remonte quand le clavier s'ouvre |
| 15 | Save/Load | IndexedDB via Dexie.js, 3 slots, auto-save, permadeath |
| 16 | Character creation | Difficulté → Classe → Bonus points → Nom → Lancer |
| 17 | Écran de fin | Récap victoire/défaite + preview Black Box |
| 18 | Typewriter | Vitesse rapide (~30ms/char), skippable au tap |
| 19 | Orientation | Portrait uniquement, pas de support landscape |
| 20 | Suggestions | 2 boutons contextuels (comme playtest actuel) |
| 21 | Flash résultat | Glow subtil depuis les bords : vert=succès, rouge=échec |
| 22 | Refactor base | useScenarioLoop → Zustand store propre, hooks légers |

---

## 2. Direction artistique : Cassette Futurism Ambre

### 2.1 Palette de couleurs

```
FOND / STRUCTURE
  --bg-deep:        #050505    Noir profond (fond principal)
  --bg-panel:       #0A0A0F    Panel backgrounds (légèrement bleuté)
  --bg-surface:     #111116    Surfaces surélevées (modals, cards)
  --bg-input:       #0D0D12    Champ de saisie

AMBRE (couleur principale — Nostromo)
  --amber-glow:     #FFB000    Ambre vif (texte principal, accents)
  --amber-mid:      #CC8800    Ambre moyen (texte secondaire)
  --amber-dim:      #805500    Ambre sombre (texte désactivé, bordures)
  --amber-bg:       #1A1200    Fond ambre très subtil (hover states)

STATUT
  --success:        #00FF41    Vert phosphore (succès, HP ok)
  --success-dim:    #00802A    Vert sombre
  --danger:         #FF2020    Rouge alarme (échec, danger, HP bas)
  --danger-dim:     #801010    Rouge sombre
  --warning:        #FF6600    Orange (conditions actives, avertissement)
  --crit-gold:      #FFD700    Or (critique succès, NAT 20)

TEXTE
  --text-primary:   #FFB000    Texte principal (ambre)
  --text-secondary: #998052    Texte secondaire (ambre délavé)
  --text-narrative: #E0A030    Texte narratif (ambre chaud, légèrement
                               différent du UI pour distinguer)
  --text-system:    #666666    Messages système (gris)
```

### 2.2 Typographie

```
TITRES & HEADERS
  Font: 'Orbitron', sans-serif (Google Fonts)
  Weight: 700 (bold)
  Letter-spacing: 0.15em (espacement large, style console)
  Text-transform: uppercase

NARRATIF & CONTENU
  Font: 'IBM Plex Mono', monospace (Google Fonts)
  Weight: 400 (regular), 600 (emphasis)
  Line-height: 1.6
  Font-size: 14px mobile, 16px desktop

UI LABELS (boutons, stats, menus)
  Font: 'IBM Plex Mono', monospace
  Weight: 500 (medium)
  Font-size: 12px
  Letter-spacing: 0.05em
  Text-transform: uppercase
```

### 2.3 Effets visuels CSS

```
SCANLINES (overlay global, très subtil)
  Repeating-linear-gradient sur le body
  2px transparent + 1px rgba(0,0,0,0.15)
  Pointer-events: none
  Opacité: 0.3

CRT GLOW (sur les textes ambre)
  text-shadow: 0 0 4px rgba(255,176,0,0.4)
  Appliqué uniquement sur --amber-glow, pas sur tout

BORDURES UI
  border: 1px solid var(--amber-dim)
  border-radius: 2px (coins très légèrement arrondis)
  Pas de box-shadow sauf hover/focus (glow ambre subtil)

BOUTONS (style touches de console physiques)
  Background: linear-gradient(180deg, #1A1500 0%, #0D0A00 100%)
  Border: 1px solid var(--amber-dim)
  Active: inset shadow (enfoncé)
  Hover: border-color → var(--amber-glow), très léger glow

ANIMATIONS DE BASE
  Transitions: 150ms ease-out (rapide, pas de lourdeur)
  Cursor blink: animation 1s step-end infinite
  Pulse subtil sur éléments actifs: opacity 0.7 → 1.0, 2s

GLITCH EFFECT (pour NAT 1 / erreurs critiques)
  Clip-path animation qui décale des slices horizontales
  RGB split (décalage rouge/bleu de 2-3px)
  Durée: 500ms, ease-in-out
  Appliqué au container principal, pas à tout l'écran
```

### 2.4 Iconographie

Pas de sprites ni d'images lourdes. Tout en ASCII/Unicode ou emoji minimaliste.

```
HP:     ♥ (plein) ♡ (vide)
O2:     ◉ (plein) ○ (vide)  — ou barre simple
Carte:  ◈ MAP
Inventaire: ◫ INV
Settings:   ⚙ (standard)
Conditions: Icônes emoji compactes
  Blessé:       🩸
  Empoisonné:   ☣
  Dans le noir:  ◌
  Dépressurisé: 💨
```

---

## 3. Architecture technique

### 3.1 Arborescence cible

```
src/ui/
├── App.tsx                      # Router principal (5 écrans)
├── screens/
│   ├── TitleScreen.tsx          # Menu principal
│   ├── CharacterCreation.tsx    # Flow de création en étapes
│   ├── GameScreen.tsx           # Orchestrateur de gameplay
│   └── EndScreen.tsx            # Récap victoire/défaite
├── components/
│   ├── StatusBar.tsx            # HP, O2, conditions (fixe en haut)
│   ├── NarrativePanel.tsx       # Zone de texte scrollable + typewriter
│   ├── ActionInput.tsx          # Champ texte + bouton Entrée
│   ├── SuggestionButtons.tsx    # 2 boutons contextuels
│   ├── DiceAnimation.tsx        # Séquence complète d'animation dé
│   ├── MapModal.tsx             # Carte plein écran (graphe de nœuds)
│   ├── InventoryModal.tsx       # Inventaire interactif
│   ├── SettingsModal.tsx        # Réglages (langue, son placeholder)
│   ├── Scanlines.tsx            # Overlay scanlines global
│   └── GlitchEffect.tsx        # Effet glitch (NAT 1, erreurs)
├── hooks/
│   ├── useGame.ts               # Connecte Zustand ↔ Engine
│   ├── useTypewriter.ts         # Révélation caractère par caractère
│   ├── useDiceAnimation.ts      # Orchestration séquence dé
│   ├── useKeyboardAdjust.ts     # Gestion clavier mobile
│   └── useAudioPlaceholder.ts   # Architecture audio (placeholder)
├── styles/
│   ├── theme.ts                 # Tokens de design exportés
│   ├── globals.css              # CSS global (scanlines, resets, fonts)
│   └── animations.css           # Keyframes (glitch, pulse, glow)
└── utils/
    └── formatters.ts            # Helpers d'affichage (HP bar, etc.)

src/stores/
└── gameStore.ts                 # Zustand store unique

src/services/
├── storage.ts                   # IndexedDB via Dexie.js
└── audio.ts                     # Service audio (placeholder)
```

### 3.2 Zustand Store — Structure

```typescript
interface GameStore {
  // === SCREEN ROUTING ===
  screen: 'title' | 'creation' | 'game' | 'end';
  setScreen: (s: GameStore['screen']) => void;

  // === CHARACTER CREATION ===
  creationStep: 'difficulty' | 'class' | 'bonus' | 'name';
  difficulty: DifficultyLevel | null;
  selectedClass: PlayerClassName | null;
  bonusPoints: Partial<Record<StatName, number>>;
  playerName: string;
  setDifficulty: (d: DifficultyLevel) => void;
  selectClass: (c: PlayerClassName) => void;
  setBonusPoints: (points: Partial<Record<StatName, number>>) => void;
  setPlayerName: (name: string) => void;
  advanceCreation: () => void;

  // === GAME STATE (from engine) ===
  gameState: GameState;
  sceneContext: SceneContext | null;
  sceneDescription: SceneDescription | null;

  // === TURN HISTORY ===
  turnHistory: TurnEntry[];
  currentNarrative: string;       // Texte à afficher avec typewriter

  // === UI STATE ===
  isProcessingTurn: boolean;      // Bloque l'input pendant le traitement
  isDiceAnimating: boolean;       // Bloque pendant l'animation dé
  pendingDiceResult: DiceResult | null;  // Résultat en attente d'animation
  pendingNarrative: string | null;       // Narratif en attente (après dé)
  activeModal: 'map' | 'inventory' | 'settings' | null;
  typewriterComplete: boolean;    // Typewriter a fini de jouer

  // === SUGGESTIONS ===
  suggestions: SuggestionCandidate[];

  // === SAVE SLOTS ===
  saveSlots: SaveSlotInfo[];      // Metadata des 3 slots

  // === ACTIONS ===
  startNewGame: () => void;              // Assemble scenario + initGame
  submitAction: (input: string) => void; // processTurn + animation pipeline
  submitSuggestion: (s: SuggestionCandidate) => void;
  skipTypewriter: () => void;
  openModal: (m: 'map' | 'inventory' | 'settings') => void;
  closeModal: () => void;
  saveGame: (slot: number) => Promise<void>;
  loadGame: (slot: number) => Promise<void>;
  restart: () => void;

  // === INTERNAL ===
  _rng: RngFn;                    // Seeded RNG instance
  _seed: number;                  // Current seed (for save/load)
  _parserData: ParserLocaleData;  // Cached parser data
}
```

### 3.3 Pipeline d'un tour (flow complet)

```
Joueur tape texte OU clique suggestion
        │
        ▼
  submitAction(input)
        │
        ├── isProcessingTurn = true
        ├── Appel processTurn(gameState, input, context, parserData, rng)
        ├── Récupère TurnResult { newState, trace, narrative }
        │
        ├── Le tour nécessite un jet de dé ?
        │       │
        │   OUI │                           NON
        │       ▼                            ▼
        │   isDiceAnimating = true      Passe directement au narratif
        │   pendingDiceResult = trace.dice
        │   pendingNarrative = narrative
        │       │
        │       ▼
        │   <DiceAnimation> joue la séquence :
        │     1. Affiche DC + stat (1s)
        │     2. Dé roule avec suspense (2s)
        │     3. Flash bord vert/rouge (0.5s)
        │     4. Si NAT 1 → glitch effect
        │     5. Si NAT 20 → golden flash
        │       │
        │       ▼
        │   onAnimationComplete()
        │   isDiceAnimating = false
        │       │
        │       ▼
        ├── currentNarrative = narrative
        ├── typewriterComplete = false
        ├── <NarrativePanel> joue le typewriter
        │       │
        │       ▼  (tap pour skip OU fin naturelle)
        ├── typewriterComplete = true
        ├── gameState = newState
        ├── sceneContext = getSceneContext(newState)
        ├── suggestions = context.scenarioSuggestions
        ├── Vérifie victoire/défaite → screen = 'end' si game over
        ├── isProcessingTurn = false
        └── Joueur peut agir à nouveau
```

### 3.4 Gestion du clavier mobile

```
Problème :
  Sur mobile, le clavier virtuel prend ~50% de l'écran.
  Si le NarrativePanel ne s'ajuste pas, le joueur ne voit
  plus le texte narratif pendant qu'il tape.

Solution — useKeyboardAdjust hook :
  1. Écoute window.visualViewport resize events
  2. Quand la hauteur du viewport diminue (clavier ouvert) :
     - Réduit la hauteur du NarrativePanel
     - Scroll automatiquement vers le bas du texte
     - Le StatusBar reste visible en haut
     - L'ActionInput reste visible en bas (il est poussé par le clavier)
  3. Quand la hauteur remonte (clavier fermé) :
     - Restore les dimensions normales

  Alternative CSS pure :
    Le layout utilise dvh (dynamic viewport height) au lieu de vh.
    Le NarrativePanel est en flex-grow dans un container flex-col.
    Le clavier réduit naturellement le viewport disponible.

  Recommandation : commencer par la solution CSS pure (dvh + flex),
  tester sur mobile réel, ajouter le hook JS si insuffisant.
```

---

## 4. Sub-Phase 7.1 — Zustand Store & Game Hook

> **Scope:** Remplacer useScenarioLoop par un Zustand store propre.
> **Prérequis:** Phase 6B complète (initGame, processTurn, getSceneContext fonctionnels)
> **Durée estimée:** 2-3 heures
> **Dépendances:** Aucune autre sub-phase

### Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `src/stores/gameStore.ts` | Zustand store complet (voir §3.2) |
| `src/ui/hooks/useGame.ts` | Hook léger qui expose le store pour les composants |
| `src/services/storage.ts` | Service IndexedDB (Dexie.js) pour save/load |
| `tests/unit/stores/gameStore.test.ts` | Tests unitaires du store |

### Détails d'implémentation

**gameStore.ts :**
- Implémente EXACTEMENT l'interface définie en §3.2
- Toute la logique de `useScenarioLoop` (assembly, initGame, processTurn) migre ici
- Le store est la SEULE source de vérité pour le game state
- Les actions sont synchrones sauf save/load (async)
- Le store ne contient AUCUNE logique de rendu
- Utilise `immer` middleware pour les updates immutables si nécessaire

**useGame.ts :**
- Hook ultra-léger : sélecteurs Zustand + memoization
- Expose des sous-ensembles du store par domaine :
  - `useGameState()` → gameState, sceneContext, suggestions
  - `useGameActions()` → submitAction, submitSuggestion, restart
  - `useUIState()` → isProcessingTurn, isDiceAnimating, activeModal
  - `useCreation()` → creation step state + actions

**storage.ts :**
- Dexie.js database avec table `saves`
- Schema : `{ slot: number, gameState: GameState, seed: number, timestamp: number, meta: SaveMeta }`
- `SaveMeta` : { playerName, className, difficulty, turn, locationName }
- 3 slots max (0, 1, 2)
- Auto-save sur slot 0 après chaque tour

### Acceptance Criteria

```bash
# Tests unitaires du store passent
npm test -- --grep gameStore

# Le store peut :
# ✅ Créer un nouveau jeu (assembly → initGame → state valide)
# ✅ Traiter un tour (submitAction → nouveau state)
# ✅ Sauvegarder/charger (3 slots, round-trip parfait)
# ✅ Détecter game over (victoire + défaite)
# ✅ Gérer la séquence dé (pending → animating → complete)
```

---

## 5. Sub-Phase 7.2 — Theme & Design System

> **Scope:** Système de design complet, sans aucun composant de jeu.
> **Prérequis:** Aucun
> **Durée estimée:** 2-3 heures
> **Dépendances:** Aucune (peut être fait en parallèle de 7.1)

### Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `src/ui/styles/theme.ts` | Design tokens TypeScript (couleurs, typos, spacing) |
| `src/ui/styles/globals.css` | Reset CSS, imports Google Fonts, scanlines, variables CSS |
| `src/ui/styles/animations.css` | Keyframes : glitch, pulse, glow, cursor-blink, dice-roll |
| `src/ui/components/Scanlines.tsx` | Composant overlay scanlines (pointer-events: none) |
| `src/ui/components/GlitchEffect.tsx` | Composant d'effet glitch réutilisable |

### Design Tokens (theme.ts)

```typescript
export const THEME = {
  colors: {
    // Reprend exactement la palette de §2.1
    bgDeep: '#050505',
    bgPanel: '#0A0A0F',
    bgSurface: '#111116',
    bgInput: '#0D0D12',
    amberGlow: '#FFB000',
    amberMid: '#CC8800',
    amberDim: '#805500',
    amberBg: '#1A1200',
    success: '#00FF41',
    successDim: '#00802A',
    danger: '#FF2020',
    dangerDim: '#801010',
    warning: '#FF6600',
    critGold: '#FFD700',
    textPrimary: '#FFB000',
    textSecondary: '#998052',
    textNarrative: '#E0A030',
    textSystem: '#666666',
  },
  fonts: {
    title: "'Orbitron', sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    typewriterSpeed: 30,       // ms par caractère
    dicePhase1Duration: 1000,  // Affichage DC
    dicePhase2Duration: 2000,  // Roll avec suspense
    dicePhase3Duration: 500,   // Flash résultat
  },
  borderRadius: '2px',
} as const;
```

### globals.css — Détails critiques

```css
/* Google Fonts imports */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Orbitron:wght@700&display=swap');

/* Variables CSS mappées depuis theme.ts pour usage en CSS pur */
:root {
  --bg-deep: #050505;
  --amber-glow: #FFB000;
  /* ... etc ... */
}

/* Reset mobile */
* { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body {
  background: var(--bg-deep);
  color: var(--amber-glow);
  font-family: 'IBM Plex Mono', monospace;
  overflow: hidden;            /* Pas de scroll sur le body */
  height: 100dvh;             /* Dynamic viewport height (clavier mobile) */
  -webkit-tap-highlight-color: transparent;
}

/* Scanlines overlay — appliqué via <Scanlines /> composant */
.scanlines::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0,0,0,0.12) 2px,
    rgba(0,0,0,0.12) 3px
  );
  opacity: 0.3;
}

/* CRT text glow pour les éléments ambre */
.crt-glow {
  text-shadow: 0 0 4px rgba(255,176,0,0.4);
}
```

### animations.css — Keyframes

```css
/* Cursor blink (pour le typewriter) */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Pulse subtil (éléments actifs) */
@keyframes pulse-amber {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Glitch effect (NAT 1) */
@keyframes glitch-slice {
  0% { clip-path: inset(0 0 0 0); }
  10% { clip-path: inset(20% 0 60% 0); transform: translateX(-3px); }
  20% { clip-path: inset(60% 0 10% 0); transform: translateX(3px); }
  30% { clip-path: inset(40% 0 30% 0); transform: translateX(-2px); }
  40% { clip-path: inset(0 0 80% 0); transform: translateX(4px); }
  50% { clip-path: inset(70% 0 5% 0); transform: translateX(-1px); }
  60% { clip-path: inset(15% 0 50% 0); transform: translateX(2px); }
  70%, 100% { clip-path: inset(0 0 0 0); transform: translateX(0); }
}

@keyframes glitch-rgb {
  0% { text-shadow: 2px 0 #ff0000, -2px 0 #0000ff; }
  25% { text-shadow: -2px 0 #ff0000, 2px 0 #0000ff; }
  50% { text-shadow: 1px 1px #ff0000, -1px -1px #0000ff; }
  75% { text-shadow: -1px 0 #ff0000, 1px 0 #0000ff; }
  100% { text-shadow: 0 0 transparent; }
}

/* Flash bords (succès/échec) */
@keyframes flash-success {
  0% { box-shadow: inset 0 0 0 0 transparent; }
  30% { box-shadow: inset 0 0 60px 10px rgba(0,255,65,0.15); }
  100% { box-shadow: inset 0 0 0 0 transparent; }
}

@keyframes flash-failure {
  0% { box-shadow: inset 0 0 0 0 transparent; }
  30% { box-shadow: inset 0 0 60px 10px rgba(255,32,32,0.15); }
  100% { box-shadow: inset 0 0 0 0 transparent; }
}

@keyframes flash-crit-success {
  0% { box-shadow: inset 0 0 0 0 transparent; }
  30% { box-shadow: inset 0 0 80px 15px rgba(255,215,0,0.25); }
  100% { box-shadow: inset 0 0 0 0 transparent; }
}

/* Dice number roll (chiffres qui défilent) */
@keyframes dice-spin {
  /* Géré en JS — les chiffres changent avec un setInterval qui ralentit */
}
```

### Acceptance Criteria

```
# ✅ globals.css importé, scanlines visibles sur fond noir
# ✅ Fonts Orbitron + IBM Plex Mono chargées
# ✅ <GlitchEffect> peut être trigger manuellement pour test
# ✅ Variables CSS fonctionnelles dans Tailwind ou CSS modules
# ✅ Aucun composant de jeu — uniquement le design system
```

---

## 6. Sub-Phase 7.3 — Title Screen & Character Creation

> **Scope:** Les 2 premiers écrans du jeu (avant le gameplay).
> **Prérequis:** 7.1 (store), 7.2 (theme)
> **Durée estimée:** 3-4 heures
> **Dépendances:** gameStore pour la navigation et les actions de création

### Fichiers à créer/modifier

| Fichier | Description |
|---------|-------------|
| `src/ui/App.tsx` | Router basé sur `store.screen` |
| `src/ui/screens/TitleScreen.tsx` | Menu principal |
| `src/ui/screens/CharacterCreation.tsx` | Flow multi-étapes |

### TitleScreen — Spécification

```
┌─────────────────────────────┐
│                             │
│     ╔═══════════════╗       │
│     ║  VOID WALKER  ║       │  ← Orbitron, grande taille, CRT glow
│     ╚═══════════════╝       │
│                             │
│   « Dans le vide, personne  │  ← IBM Plex Mono, italic, ambre dim
│     ne vous entend lancer   │
│     un D20. »               │
│                             │
│   ┌─────────────────────┐   │
│   │   NOUVELLE PARTIE   │   │  ← Bouton principal, bordure ambre
│   └─────────────────────┘   │
│   ┌─────────────────────┐   │
│   │     CONTINUER       │   │  ← Grisé si pas de save. Sinon : affiche
│   └─────────────────────┘   │    slot le plus récent (nom, classe, tour)
│   ┌─────────────────────┐   │
│   │   CHARGER PARTIE    │   │  ← Ouvre un sous-menu avec les 3 slots
│   └─────────────────────┘   │
│                             │
│              v0.7.0         │  ← Version en bas, très discret
└─────────────────────────────┘
```

**Comportement :**
- "CONTINUER" charge le slot d'auto-save (slot 0) s'il existe
- "CHARGER PARTIE" montre les 3 slots avec metadata
- Si aucun save n'existe, seul "NOUVELLE PARTIE" est actif
- Animation d'entrée : le titre apparaît lettre par lettre (typewriter lent, ~100ms/char)
- Background subtil : très léger effet de particules ou static noise (optionnel, pas prioritaire)

### CharacterCreation — Flow en 4 étapes

**Étape 1 : Difficulté**

```
┌─────────────────────────────┐
│   SÉLECTIONNEZ LA DIFFICULTÉ │
│                             │
│  ┌────────────────────────┐ │
│  │ ▸ EXPLORATEUR          │ │  ← Sélectionné = bordure ambre glow
│  │   Mode détente.        │ │    Description courte en dessous
│  │   HP bonus, pas de     │ │
│  │   permadeath.          │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │   SURVIVANT            │ │
│  │   L'expérience prévue. │ │
│  │   Permadeath activé.   │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │   CAUCHEMAR            │ │
│  │   Pas de filet de      │ │
│  │   sécurité. Bonne      │ │
│  │   chance.              │ │
│  └────────────────────────┘ │
│                             │
│          [SUIVANT ▸]        │
└─────────────────────────────┘
```

**Étape 2 : Classe**

```
┌─────────────────────────────┐
│      CHOISISSEZ VOTRE RÔLE  │
│                             │
│  ┌────────┐ ┌────────┐ ┌──────┐
│  │ MARINE │ │INGÉNIEUR│ │MÉDECIN│
│  │        │ │        │ │      │
│  │ FOR: 4 │ │ FOR: 2 │ │FOR: 2│  ← Barres visuelles
│  │ PER: 2 │ │ PER: 3 │ │PER: 3│    pour chaque stat
│  │ INT: 1 │ │ INT: 4 │ │INT: 2│
│  │ AGI: 3 │ │ AGI: 2 │ │AGI: 2│
│  │ CHA: 1 │ │ CHA: 1 │ │CHA: 2│
│  │ CON: 3 │ │ CON: 2 │ │CON: 3│
│  │        │ │        │ │      │
│  │ HP: 12 │ │ HP: 8  │ │HP: 10│
│  └────────┘ └────────┘ └──────┘
│                             │
│     [◂ RETOUR] [SUIVANT ▸]  │
└─────────────────────────────┘
```

Les cartes de classe utilisent des barres de stat ASCII-style :
```
FOR ████░░ 4/6
PER ██░░░░ 2/6
```

**Étape 3 : Points bonus**

```
┌─────────────────────────────┐
│   POINTS BONUS : 2 restants │
│                             │
│   FOR  ████░░  4  [-] [+]  │
│   PER  ██░░░░  2  [-] [+]  │
│   INT  █░░░░░  1  [-] [+]  │
│   AGI  ███░░░  3  [-] [+]  │
│   CHA  █░░░░░  1  [-] [+]  │
│   CON  ███░░░  3  [-] [+]  │
│                             │
│   Max par stat : 5          │
│                             │
│     [◂ RETOUR] [SUIVANT ▸]  │
└─────────────────────────────┘
```

- 2 points à distribuer (cf. BALANCE)
- Cap à 5 par stat
- Les boutons [-] [+] sont des touches de console cassette futurism
- Le bouton [SUIVANT] est disabled tant qu'il reste des points

**Étape 4 : Nom**

```
┌─────────────────────────────┐
│    IDENTIFICATION           │
│                             │
│    NOM : [_______________]  │
│                             │
│    [NOM ALÉATOIRE ⟳]       │  ← Génère un nom français
│                             │
│     [◂ RETOUR] [LANCER ▸]  │  ← "LANCER" au lieu de "SUIVANT"
└─────────────────────────────┘
```

- Le bouton "LANCER" lance la partie (appelle `store.startNewGame()`)
- Noms aléatoires : pool de prénoms français thématiques (sci-fi)
- Le nom est optionnel (un nom par défaut est pré-rempli)

### Acceptance Criteria

```
# ✅ TitleScreen s'affiche avec le bon style cassette futurism
# ✅ Navigation complète : Title → Difficulté → Classe → Bonus → Nom → Game
# ✅ Boutons Retour fonctionnels à chaque étape
# ✅ Points bonus respectent les contraintes (max 5, 2 points)
# ✅ "CONTINUER" charge correctement le save
# ✅ "LANCER" démarre une partie et affiche GameScreen
# ✅ Fonctionne sur 320px de large
```

---

## 7. Sub-Phase 7.4 — Game Screen Layout & Narrative

> **Scope:** L'écran de gameplay principal avec typewriter et gestion clavier.
> **Prérequis:** 7.1 (store), 7.2 (theme)
> **Durée estimée:** 4-5 heures
> **Dépendances:** Ne dépend PAS de 7.3 (peut afficher directement avec un state mocké)

### Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `src/ui/screens/GameScreen.tsx` | Layout orchestrateur |
| `src/ui/components/StatusBar.tsx` | Barre de statut fixe en haut |
| `src/ui/components/NarrativePanel.tsx` | Zone de texte scrollable |
| `src/ui/components/ActionInput.tsx` | Champ de saisie + Entrée |
| `src/ui/components/SuggestionButtons.tsx` | 2 boutons contextuels |
| `src/ui/hooks/useTypewriter.ts` | Hook de révélation progressive |
| `src/ui/hooks/useKeyboardAdjust.ts` | Gestion clavier mobile |
| `src/ui/utils/formatters.ts` | Helpers d'affichage |

### Layout GameScreen (portrait mobile)

```
┌─────────────────────────────┐ ─── 100dvh
│ ┌─────────────────────────┐ │
│ │ ♥♥♥♥♥♡♡  O2 ████░  T:5 │ │ ← StatusBar (fixe, ~48px)
│ │ 🩸 Blessé   ◌ Obscurité │ │   Conditions actives
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │ Vous pénétrez dans le   │ │ ← NarrativePanel (flex-grow)
│ │ couloir principal. Les  │ │   Scrollable, typewriter effect
│ │ lumières d'urgence      │ │
│ │ baignent tout d'une     │ │
│ │ lueur ambrée. L'air     │ │
│ │ sent le métal brûlé.█   │ │ ← Cursor qui clignote
│ │                         │ │
│ │ ── Tour 3 ──────────── │ │ ← Séparateur entre les tours
│ │ > examiner console      │ │   (input du joueur en dim)
│ │ Vos doigts dansent...  │ │   (réponse en ambre chaud)
│ │                         │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │[Forcer le sas][Hacker]  │ │ ← SuggestionButtons (2 boutons)
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │[________________][ENTER]│ │ ← ActionInput (champ + bouton)
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [◈ MAP] [◫ INV] [⚙]   │ │ ← ActionBar (boutons modaux)
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### StatusBar — Détails

```typescript
interface StatusBarProps {
  hp: number;
  maxHp: number;
  oxygen: number;          // 0-100
  turn: number;
  conditions: string[];    // IDs des conditions actives
  inCombat: boolean;
  weakPointDiscovered?: { name: string; verbs: string[] };
}
```

**Affichage HP :**
- > 60% : vert (#00FF41)
- 30-60% : orange (#FF6600)
- < 30% : rouge clignotant (#FF2020 + animation pulse)

**Affichage O2 :**
- Barre horizontale compacte
- Masquée si O2 = 100% (pas de pollution visuelle)
- Apparaît avec animation quand O2 descend sous 100%

**Conditions :**
- Affichées comme badges compacts avec emoji + nom court
- Max 3 visibles, "+N" si plus

### NarrativePanel — Détails

**Structure du texte :**
- Chaque tour est séparé par un séparateur fin (`── Tour N ──`)
- L'input du joueur est affiché en `--text-secondary` avec un `>` prefix
- Le texte narratif est en `--text-narrative` avec le typewriter
- Auto-scroll vers le bas à chaque nouveau texte
- Tout l'historique est scrollable vers le haut

**Typewriter hook :**
```typescript
interface UseTypewriterOptions {
  text: string;
  speed?: number;          // ms par caractère, default 30
  onComplete?: () => void;
}

interface UseTypewriterReturn {
  displayedText: string;   // Texte partiellement révélé
  isComplete: boolean;
  skip: () => void;        // Révèle tout instantanément
}
```

- Le tap/click n'importe où sur le NarrativePanel appelle `skip()`
- Quand isComplete = true, le store est notifié (`typewriterComplete = true`)
- Le cursor (`█`) est visible uniquement pendant le typewriter, puis disparaît

### ActionInput — Détails

- Champ texte avec placeholder : `"Que faites-vous ?"`
- Style : fond `--bg-input`, bordure `--amber-dim`, texte `--amber-glow`
- Focus : bordure → `--amber-glow` avec léger glow
- Bouton ENTER : icône `▸` ou texte "OK", style bouton console
- Disabled quand `isProcessingTurn || isDiceAnimating || !typewriterComplete`
- Sur Enter ou click bouton : appelle `store.submitAction(input)`
- Clear le champ après soumission

### SuggestionButtons — Détails

- 2 boutons côte à côte, largeur égale
- Texte tronqué avec ellipsis si trop long
- Style : fond `--bg-surface`, bordure `--amber-dim`
- Hover/tap : bordure `--amber-glow`
- Disabled quand `isProcessingTurn || isDiceAnimating || !typewriterComplete`
- Click : appelle `store.submitSuggestion(suggestion)`
- Masqués pendant l'animation de dé

### Acceptance Criteria

```
# ✅ Layout fonctionne sur 320px sans overflow
# ✅ Typewriter joue à ~30ms/char, skippable au tap
# ✅ Historique scrollable vers le haut
# ✅ Input disabled pendant animation/traitement
# ✅ Suggestions cliquables et fonctionnelles
# ✅ StatusBar affiche HP, O2, conditions correctement
# ✅ Sur clavier mobile ouvert : le texte narratif reste visible
# ✅ Plusieurs tours jouables sans bug d'affichage
```

---

## 8. Sub-Phase 7.5 — Dice Animation & Action Feedback

> **Scope:** L'animation complète de lancer de dé + feedback visuel.
> **Prérequis:** 7.2 (theme/animations), 7.4 (GameScreen pour intégration)
> **Durée estimée:** 3-4 heures
> **Dépendances:** Utilise les keyframes de animations.css

### Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `src/ui/components/DiceAnimation.tsx` | Composant full-sequence |
| `src/ui/hooks/useDiceAnimation.ts` | Orchestration timing |

### Séquence d'animation — 3 phases

**PHASE 1 — Affichage DC (durée : 1000ms)**

```
┌─────────────────────────────┐
│                             │
│                             │
│      ┌─────────────────┐    │
│      │  PERCEPTION + 2  │    │ ← Stat utilisée + modificateur
│      │                  │    │
│      │   DIFFICULTÉ     │    │
│      │      14          │    │ ← Grands chiffres LED-style
│      │                  │    │   (Orbitron, --amber-glow, glow)
│      └─────────────────┘    │
│                             │
│                             │
└─────────────────────────────┘
```

- Apparaît en fondu rapide (200ms)
- Les chiffres ont un glow ambre prononcé
- Le stat name est en `--amber-mid`, plus petit

**PHASE 2 — Dé qui roule (durée : 2000ms)**

```
┌─────────────────────────────┐
│                             │
│      DIFFICULTÉ: 14         │ ← DC reste visible, réduit en haut
│                             │
│      ┌─────────────┐       │
│      │             │       │
│      │     17      │       │ ← Chiffre qui change rapidement
│      │             │       │   puis ralentit
│      └─────────────┘       │
│                             │
│      PERCEPTION + 2         │ ← Rappel du stat+mod
│                             │
└─────────────────────────────┘
```

- Le chiffre du dé (1-20) change avec un `setInterval`
- Vitesse : commence à 50ms, ralentit progressivement (easing)
  - 0-800ms : change toutes les 50ms (rapide)
  - 800-1400ms : change toutes les 100ms (ralentit)
  - 1400-1800ms : change toutes les 200ms (lent)
  - 1800-2000ms : se fixe sur le résultat final
- Le chiffre final est le vrai résultat du dé (de `DiceResult.roll`)
- Le dé a une bordure qui pulse pendant le roll

**PHASE 3 — Résultat + Flash (durée : 500ms)**

Le résultat final s'affiche avec le traitement approprié :

```
SUCCÈS NORMAL:
  - Chiffre en --success (#00FF41)
  - Flash vert depuis les bords (animation flash-success)
  - Texte "SUCCÈS" apparaît sous le dé

ÉCHEC NORMAL:
  - Chiffre en --danger (#FF2020)
  - Flash rouge depuis les bords (animation flash-failure)
  - Texte "ÉCHEC" apparaît sous le dé

NAT 20 (CRITIQUE):
  - Chiffre en --crit-gold (#FFD700) avec glow intense
  - Flash doré depuis les bords (animation flash-crit-success)
  - Texte "CRITIQUE !" avec effet shake léger
  - Le chiffre "20" pulse 2 fois

NAT 1 (FUMBLE):
  - Tout l'écran subit un glitch effect (500ms)
  - Chiffre en rouge avec RGB split
  - Flash rouge intense
  - Texte "FUMBLE !" en rouge glitché
  - Son placeholder : bruit de static/erreur
```

### useDiceAnimation hook

```typescript
interface UseDiceAnimationOptions {
  diceResult: DiceResult | null;
  onComplete: () => void;
}

interface UseDiceAnimationReturn {
  isAnimating: boolean;
  phase: 'idle' | 'dc_display' | 'rolling' | 'result';
  displayedNumber: number;      // Le chiffre actuellement affiché
  finalResult: DiceResult | null;
  start: () => void;
}
```

- Le hook gère tout le timing avec `useEffect` + `setTimeout`/`setInterval`
- `onComplete` est appelé quand l'animation est totalement terminée
- Le store met `isDiceAnimating = false` dans le callback

### Intégration dans GameScreen

Le `DiceAnimation` est un overlay conditionnel dans `GameScreen` :
```tsx
{store.isDiceAnimating && store.pendingDiceResult && (
  <DiceAnimation
    diceResult={store.pendingDiceResult}
    onComplete={store.onDiceAnimationComplete}
  />
)}
```

L'overlay couvre le NarrativePanel mais PAS le StatusBar (le joueur voit toujours ses HP/O2 pendant le dé).

### Acceptance Criteria

```
# ✅ Séquence complète joue en ~3.5s (1s + 2s + 0.5s)
# ✅ Le chiffre du dé ralentit de manière convaincante
# ✅ Flash vert/rouge visible depuis les bords
# ✅ NAT 20 : flash doré + "CRITIQUE !"
# ✅ NAT 1 : glitch effect complet + "FUMBLE !"
# ✅ L'input est disabled pendant toute l'animation
# ✅ Après l'animation, le typewriter narratif commence
# ✅ Fonctionne sur mobile 320px
```

---

## 9. Sub-Phase 7.6 — Modals (Map, Inventory, Settings)

> **Scope:** Les 3 modals plein écran accessibles depuis la barre d'actions.
> **Prérequis:** 7.1 (store), 7.2 (theme)
> **Durée estimée:** 4-5 heures
> **Dépendances:** Peut être développé en parallèle de 7.4/7.5

### Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `src/ui/components/MapModal.tsx` | Carte du scénario |
| `src/ui/components/InventoryModal.tsx` | Inventaire interactif |
| `src/ui/components/SettingsModal.tsx` | Réglages |

### MapModal — Carte simple (nœuds du graphe)

**Layout :**
```
┌─────────────────────────────┐
│ [✕ FERMER]         ◈ CARTE  │
│─────────────────────────────│
│                             │
│   [Hangar]──────[Couloir]   │
│       │             │       │
│       │         [Salle de]  │
│       │         [contrôle]  │
│       │             │       │
│   [Armurerie]──[Réacteur]   │
│                   │         │
│              [▣ Vous êtes   │
│                 ici]        │
│                             │
│   ○ Non visité              │
│   ● Visité                  │
│   ▣ Position actuelle       │
│                             │
└─────────────────────────────┘
```

**Implémentation :**
- Lit `gameState.scenario.graph` pour les nœuds et edges
- Utilise `gameState.visitedLocations` pour le statut visité/non-visité
- Utilise `gameState.playerLocationId` pour la position
- Les nœuds sont positionnés via un layout simple (grille ou force-directed basique)
- CSS-only : des `<div>` positionnés avec des lignes SVG ou CSS borders pour les connexions
- Nœuds non découverts (jamais adjacents à une salle visitée) : masqués (`???`)
- Nœuds adjacents non visités : affichés en pointillés
- Nœud actuel : ambre glow + pulsation
- Nœuds visités : ambre dim, statiques

**Pas de pan/zoom pour la version simple.** Si le graphe ne tient pas à l'écran, un scroll suffit.

### InventoryModal — Inventaire interactif

**Layout :**
```
┌─────────────────────────────┐
│ [✕ FERMER]      ◫ INVENTAIRE│
│─────────────────────────────│
│                             │
│  ┌──────────────────────┐   │
│  │ 🔫 Pistolet laser    │   │ ← Item card
│  │ État : Fonctionnel   │   │
│  │ [UTILISER] [EXAMINER] │   │ ← Actions rapides
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │ 🔧 Tournevis         │   │
│  │ État : Fonctionnel   │   │
│  │ [UTILISER] [EXAMINER] │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │ 💊 Medikit            │   │
│  │ État : Cassé ⚠       │   │ ← Marqueur orange si cassé
│  │ [EXAMINER] [JETER]   │   │   Pas de UTILISER si cassé
│  └──────────────────────┘   │
│                             │
│  Slots : 3 / 8             │
│                             │
└─────────────────────────────┘
```

**Comportement interactif :**
- "UTILISER" → ferme le modal, injecte `"utiliser [item]"` dans l'ActionInput, soumet automatiquement
- "EXAMINER" → ferme le modal, injecte `"examiner [item]"` dans l'ActionInput, soumet automatiquement
- "JETER" → ferme le modal, injecte `"jeter [item]"` dans l'ActionInput, soumet automatiquement
- L'injection passe par `store.submitAction()` directement
- Les items cassés n'ont pas le bouton "UTILISER"
- Les items équipés ont un marqueur spécial (★)

**Données :**
- Lit `gameState.character.inventory` pour la liste des items
- Récupère les `ItemDefinition` depuis `ITEM_DEFINITIONS` pour les noms FR et propriétés
- Vérifie `gameState.character.brokenItems` pour les items cassés

### SettingsModal

```
┌─────────────────────────────┐
│ [✕ FERMER]      ⚙ RÉGLAGES │
│─────────────────────────────│
│                             │
│  Langue                     │
│  [FR ●] [EN ○]             │ ← Toggle, FR par défaut
│                             │
│  Son (bientôt)              │
│  [ON ○] [OFF ●]            │ ← Placeholder, disabled
│                             │
│  Musique (bientôt)          │
│  [Volume : ███░░░]          │ ← Placeholder slider
│                             │
│  ─────────────────────────  │
│                             │
│  [SAUVEGARDER LA PARTIE]    │
│  [QUITTER (menu principal)] │
│                             │
│  ─────────────────────────  │
│  Void Walker v0.7.0        │
│  Moteur : Phase 6          │
│                             │
└─────────────────────────────┘
```

### Modal — Composant de base partagé

Les 3 modals partagent un conteneur commun :
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  children: React.ReactNode;
}
```

- Plein écran (100dvh × 100vw)
- Fond `--bg-surface` avec légère transparence
- Transition d'ouverture : slide up (200ms)
- Fermeture : bouton ✕ + swipe down (optionnel, pas critique)
- Z-index au-dessus de GameScreen mais sous les overlays d'animation dé

### Acceptance Criteria

```
# ✅ Map affiche le graphe du scénario correctement
# ✅ Position du joueur clairement identifiable sur la carte
# ✅ Nœuds non découverts masqués
# ✅ Inventaire liste tous les items avec leur état
# ✅ Actions depuis l'inventaire (utiliser/examiner/jeter) fonctionnent
# ✅ Items cassés marqués et sans bouton "utiliser"
# ✅ Settings permettent de sauvegarder et quitter
# ✅ Les 3 modals s'ouvrent/ferment correctement
# ✅ Pas de conflit avec l'animation de dé
```

---

## 10. Sub-Phase 7.7 — Save/Load, End Screen & Polish

> **Scope:** Persistance, écran de fin, et polish global.
> **Prérequis:** 7.1 à 7.6 (tout le reste doit être fonctionnel)
> **Durée estimée:** 3-4 heures
> **Dépendances:** Tous les autres sub-phases

### Fichiers à créer/modifier

| Fichier | Description |
|---------|-------------|
| `src/ui/screens/EndScreen.tsx` | Écran victoire/défaite |
| `src/services/storage.ts` | Enrichir si nécessaire |
| Divers | Polish, bugfix, responsive final |

### Save/Load — Détails

**Auto-save :**
- Après chaque tour résolu, auto-save sur slot 0
- Silencieux, pas de notification UI
- Si le joueur meurt en mode Survivant/Cauchemar → slot 0 est SUPPRIMÉ (permadeath)

**Save manuel :**
- Accessible via Settings modal → "SAUVEGARDER"
- Propose les 3 slots avec preview (nom, classe, tour, timestamp)
- Confirmation avant écrasement d'un slot non-vide

**Load :**
- Depuis TitleScreen → "CONTINUER" (slot 0) ou "CHARGER" (choix du slot)
- Restore complète : gameState, seed, sceneContext, etc.
- Après load : l'écran passe à GameScreen avec le state restauré

**Structure IndexedDB (Dexie) :**
```typescript
interface SaveRecord {
  slot: number;           // 0, 1, 2
  gameState: GameState;   // State complet sérialisé
  seed: number;           // Pour reproduire le RNG
  timestamp: number;      // Date.now()
  meta: {
    playerName: string;
    className: PlayerClassName;
    difficulty: DifficultyLevel;
    turn: number;
    locationName: string;
    hp: number;
    maxHp: number;
  };
}
```

### EndScreen — Spécification

**Victoire :**
```
┌─────────────────────────────┐
│                             │
│      ╔═══════════════╗      │
│      ║   MISSION     ║      │
│      ║   ACCOMPLIE   ║      │  ← Orbitron, --crit-gold, glow
│      ╚═══════════════╝      │
│                             │
│   Type : Évasion réussie    │
│   Classe : Marine           │
│   Difficulté : Survivant    │
│   Tours : 23                │
│   HP final : 5/12           │
│                             │
│   ── BOÎTE NOIRE ────────  │
│   "Le dernier journal du    │  ← Preview Black Box (1 entrée)
│    vaisseau mentionne un    │
│    survivant..."            │
│                             │
│   [NOUVELLE PARTIE]         │
│   [MENU PRINCIPAL]          │
│                             │
└─────────────────────────────┘
```

**Défaite :**
```
┌─────────────────────────────┐
│                             │
│      ╔═══════════════╗      │
│      ║   MISSION     ║      │
│      ║   ÉCHOUÉE     ║      │  ← Orbitron, --danger, glitch subtil
│      ╚═══════════════╝      │
│                             │
│   Cause : HP à zéro        │
│   Dernier acte : Attaquer   │
│   le xénomorphe à mains     │
│   nues.                     │
│                             │
│   Tours survécus : 12       │
│   Ennemis vaincus : 2       │
│                             │
│   [RECOMMENCER]             │  ← Même scénario, nouveau seed
│   [NOUVELLE PARTIE]         │  ← Nouveau scénario complet
│   [MENU PRINCIPAL]          │
│                             │
└─────────────────────────────┘
```

### Polish final — Checklist

- [ ] Tester sur viewport 320px (plus petit Android courant)
- [ ] Tester sur viewport 375px (iPhone SE)
- [ ] Tester sur viewport 390px (iPhone 14)
- [ ] Vérifier que le clavier mobile ne cache pas le texte
- [ ] Vérifier les transitions entre écrans (pas de flash blanc)
- [ ] S'assurer que le scrollback narratif fonctionne sur 20+ tours
- [ ] Vérifier que les conditions s'affichent correctement dans StatusBar
- [ ] Tester un cycle complet : Title → Création → 10 tours → Victory/Defeat → Title
- [ ] Vérifier save/load round-trip (save → refresh → load → state identique)
- [ ] Vérifier permadeath (mourir en Survivant → save supprimé)
- [ ] Supprimer le PlaytestScreen obsolète (ou le garder derrière un flag debug)

### Acceptance Criteria

```
# ✅ Save/load fonctionne avec 3 slots
# ✅ Auto-save silencieux après chaque tour
# ✅ Permadeath supprime le save en Survivant/Cauchemar
# ✅ EndScreen affiche le bon récap (victoire ou défaite)
# ✅ Black Box preview visible sur l'écran de victoire
# ✅ Cycle complet jouable sans bug
# ✅ Responsive 320px-768px vérifié
```

---

## 11. Phase 7B — Future

Ces éléments sont explicitement reportés et ne font PAS partie de la Phase 7A :

| Élément | Raison du report |
|---------|-----------------|
| Carte avancée (pan, zoom, animation) | Trop complexe, la carte simple suffit pour le MVP |
| Audio : musique d'ambiance | Nécessite un asset audio libre de droits, architecture prête |
| Audio : SFX (dé, terminal, erreur) | Hooks placeholders prêts, implémentation quand assets dispo |
| Animations de transition entre écrans | Polish, pas bloquant |
| Écran de création : portrait du personnage | Nice-to-have |
| Haptic feedback (vibration mobile) | Nice-to-have |
| Tutorial / onboarding | Après les premiers playtests |
| Score / leaderboard | Après les premiers playtests |
| Accessibilité avancée (screen reader) | Important mais post-MVP |

---

## 12. Acceptance Criteria globaux

### Phase 7A complète quand :

```bash
npm run build               # ✅ Production build sans erreur
npm run dev                 # ✅ Jeu jouable à localhost:5173
npm test                    # ✅ Tous les tests passent (engine + store)
```

### Tests manuels obligatoires :

- [ ] Cycle complet sur Chrome mobile (Android) en viewport 360px
- [ ] Cycle complet sur Safari mobile (iOS) en viewport 375px
- [ ] Cycle complet sur Chrome desktop en viewport 768px
- [ ] 10 tours minimum sans crash ni bug d'affichage
- [ ] Animation de dé visible et convaincante (succès + échec + crit)
- [ ] Save → fermer onglet → rouvrir → Continuer → state correct
- [ ] Carte affiche correctement les salles visitées et la position
- [ ] Inventaire permet d'utiliser un objet (l'action arrive au parser)
- [ ] Typewriter skippable au tap
- [ ] Clavier mobile ne masque pas le dernier texte narratif

### Métriques cibles :

| Métrique | Cible |
|----------|-------|
| Build size (gzip) | < 500KB |
| First paint | < 1.5s |
| Time to interactive | < 3s |
| Lighthouse PWA score | > 80 (cible 90 en Phase 8) |

---

## Résumé des sub-phases

| Sub-phase | Nom | Durée est. | Dépendances | Parallélisable |
|-----------|-----|-----------|-------------|----------------|
| 7.1 | Zustand Store & Game Hook | 2-3h | Aucune | ✅ avec 7.2 |
| 7.2 | Theme & Design System | 2-3h | Aucune | ✅ avec 7.1 |
| 7.3 | Title Screen & Char Creation | 3-4h | 7.1, 7.2 | ✅ avec 7.4 |
| 7.4 | Game Screen & Narrative | 4-5h | 7.1, 7.2 | ✅ avec 7.3, 7.6 |
| 7.5 | Dice Animation & Feedback | 3-4h | 7.2, 7.4 | ❌ (besoin du GameScreen) |
| 7.6 | Modals (Map, Inv, Settings) | 4-5h | 7.1, 7.2 | ✅ avec 7.3, 7.4 |
| 7.7 | Save/Load, End Screen, Polish | 3-4h | Tous | ❌ (dernière étape) |

**Total estimé : 22-28 heures de développement**

---

> *"Le vide ne pardonne pas les interfaces mal pensées."*
> — Journal de bord, entrée finale
