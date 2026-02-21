# Phase 7 — UI (Mobile-First PWA)

> **Status:** PENDING
> **Duration:** 2 weeks
> **Prerequisites:** Phase 6 complete (ENGINE COMPLETE)
> **Reference docs:** `GAME_SYSTEMS.md` (SS9)

---

## Brainstorm Gate

- [ ] Confirm mobile-first breakpoints (320px min width?)
- [ ] Review horror UI aesthetic (color palette, typography, animations)
- [ ] Confirm Zustand store structure (single store vs multiple slices?)
- [ ] Review character creation flow (3 steps: class -> bonus -> name -> difficulty)
- [ ] Confirm dice animation approach (CSS animation vs canvas?)
- [ ] Decide on typewriter effect speed for narrative text

## Week 1: Core Screens & Game Loop

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Zustand game store (single source of truth) | `src/stores/gameStore.ts` | Unit: state transitions correct |
| 2 | `useGame` hook (connects engine to React) | `src/ui/hooks/useGame.ts` | Unit: processTurn integrates correctly |
| 3 | Title screen (New Game / Continue / Settings) | `src/ui/screens/TitleScreen.tsx` | Manual: renders, navigates |
| 4 | Character creation: class selection (3 cards with stat bars) | `src/ui/screens/CharacterCreation.tsx` | Manual: cards display, selection works |
| 5 | Character creation: bonus points (+/- buttons, cap at 5) | `src/ui/screens/CharacterCreation.tsx` | Manual: allocation validates |
| 6 | Character creation: name entry + random name button | `src/ui/screens/CharacterCreation.tsx` | Manual: name saved |
| 7 | Character creation: difficulty selection | `src/ui/screens/CharacterCreation.tsx` | Manual: 3 presets described |
| 8 | Game screen layout (status bar + narrative + input + suggestions) | `src/ui/screens/GameScreen.tsx` | Manual: mobile layout fits |
| 9 | Status bar (HP, O2, 6 stats, condition icons) | `src/ui/components/StatusBar.tsx` | Unit: displays correct values |
| 10 | Narrative panel (scrollable, typewriter effect) | `src/ui/components/NarrativePanel.tsx` | Manual: text animates |
| 11 | `useTypewriter` hook | `src/ui/hooks/useTypewriter.ts` | Unit: text reveals character by character |

## Week 2: Interaction, Modals, Save/Load

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 12 | Action input (text field + submit) | `src/ui/components/ActionInput.tsx` | Manual: input sends to engine |
| 13 | Suggestion buttons (3 contextual actions) | `src/ui/components/SuggestionButtons.tsx` | Manual: tap sends action |
| 14 | Dice animation (D20 roll visual) | `src/ui/components/DiceAnimation.tsx`, `src/ui/hooks/useDiceAnimation.ts` | Manual: animation plays |
| 15 | Creativity bonus indicator | `src/ui/components/ActionInput.tsx` | Manual: shows "Creativite! [DC -2]" |
| 16 | Weak point indicator (when discovered) | `src/ui/components/StatusBar.tsx` | Manual: shows weak point + target verbs |
| 17 | Inventory modal | `src/ui/components/InventoryModal.tsx` | Manual: items listed, broken items marked |
| 18 | Map modal (explored rooms, exits, progress) | `src/ui/components/MapModal.tsx` | Manual: rooms displayed, connections visible |
| 19 | Settings modal (language switcher, sound toggle) | `src/ui/components/SettingsModal.tsx` | Manual: language switch works |
| 20 | Save/Load system (3 slots, auto-save, IndexedDB) | `src/services/storage.ts`, `src/engine/save.ts` | Unit: save/load preserves state |
| 21 | Save slot UI (continue, delete, death recap) | `src/ui/screens/TitleScreen.tsx` | Manual: slots display correctly |
| 22 | Permadeath save deletion (on death in Survivor/Nightmare) | `src/engine/save.ts` | Unit: save deleted on permadeath |
| 23 | End screen (victory recap, death recap, Black Box preview) | `src/ui/screens/EndScreen.tsx` | Manual: displays outcome |
| 24 | Horror theme (dark palette, typography, ambient CSS) | `src/ui/styles/theme.ts` | Manual: looks atmospheric |
| 25 | Mobile responsive (320px - 768px primary, 768px+ desktop) | All UI files | Manual: tested on phone viewport |

## Acceptance Criteria

```bash
npm run build              # Production build succeeds
npm run dev                # Dev server shows playable game
```

Manual testing:
- [ ] Complete character creation flow on phone viewport
- [ ] Play 5+ turns with text input and suggestion buttons
- [ ] See dice roll animation
- [ ] Open inventory and map modals
- [ ] Save game, close, reload, continue from save
- [ ] Die in Survivor mode, verify save is deleted

## Key Design Decisions (Locked In)

- Single Zustand store (no Redux, no multiple stores)
- Mobile-first: primary design target is 320-768px width
- Horror aesthetic: dark backgrounds, monospace text, muted reds/greens
- Typewriter effect on narrative text (skippable by tapping)
- Dice animation: CSS-based (no canvas dependency)
- Status bar always visible at top
- Narrative panel is the main content area (scrollable)
- Input + suggestions at bottom (thumb-reachable on mobile)
- Save system uses IndexedDB via Dexie.js
- Language switcher in settings (changes display, parser stays bilingual)

## Definition of Done

- [ ] Full game loop playable in browser (create character -> play -> win/die)
- [ ] Mobile layout works on 320px width
- [ ] Save/load functional with 3 slots
- [ ] Permadeath deletes save on death
- [ ] All engine features visible in UI (conditions, O2, weak points, creativity bonus)
- [ ] Horror aesthetic applied (not just default white)
- [ ] CLAUDE.md updated for Phase 8
