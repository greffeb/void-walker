# PWA Missing Features

This document lists CLI features not yet implemented in the PWA version, prioritized for future implementation.

---

## HIGH Priority

### 1. Guidance System
**CLI source**: `archived/cli/void_walker/core/guidance.py`

Helps players who are stuck by progressively revealing hints.

**Features**:
- **Stagnation detection**: Tracks `turns_since_progress` (resets on meaningful progress)
- **Wandering detection**: 4 moves in ≤2 locations = circular movement pattern
- **4-level hint system**:
  - Level 0: No hint (player making progress)
  - Level 1 (5-6 turns stuck): Subtle hints - mention interesting directions
  - Level 2 (7-8 turns): Moderate hints - include NPC/secret information
  - Level 3 (9+ turns): Direct guidance - explicit objective hints
- **Context-aware hints**: Uses unvisited locations, NPCs with knowledge, discovered secrets, victory conditions
- **Hint injection**: Hints injected into LLM gameplay prompt as narrative directives
- **Cooldown**: Minimum 3 turns between hints to avoid spamming

**Implementation notes**:
- Add `turnsWithoutProgress` and `locationHistory` to GameState
- Create `guidance.ts` utility with `calculateHintLevel()` and `buildHintContext()`
- Inject hint context into gameplay prompt when hint level > 0

---

### 2. Content Definitions
**CLI source**: `archived/cli/void_walker/content/items.py` + `settings.py`

Rich content templates for consistent game elements.

**Item Templates** (18 items):
| ID | Name | Type | Stat Bonus | Uses |
|----|------|------|------------|------|
| lampe_torche | Lampe torche | tool | INT +1 | - |
| multitool | Multitool | tool | INT +1 | - |
| scanner | Scanner portable | tool | - | - |
| combinaison_eva | Combinaison EVA | tool | - | - |
| pistolet_laser | Pistolet laser | weapon | FOR +1 | - |
| barre_metal | Barre de metal | weapon | - | - |
| couteau | Couteau utilitaire | weapon | - | - |
| trousse_medicale | Trousse medicale | consumable | - | 3 |
| stimulant | Stimulant | consumable | - | 1 |
| ration | Ration d'urgence | consumable | - | 1 |
| ruban_adhesif | Ruban adhesif | consumable | - | 3 |
| carte_acces | Carte d'acces | key_item | - | - |
| cle_vaisseau | Cle du vaisseau | key_item | - | - |
| datapad | Datapad | data | - | - |
| journal | Journal personnel | data | - | - |
| debris | Debris metallique | misc | - | - |
| cable | Cable electrique | misc | - | - |

**Setting Types** (8 types):
| Type | French Name | Atmosphere |
|------|-------------|------------|
| derelict_ship | Vaisseau abandonne | Couloirs sombres, systemes defaillants, silence oppressant |
| space_station | Station spatiale | Modules interconnectes, vues sur le vide, rotations artificielles |
| planetary_colony | Colonie planetaire | Environnement hostile, domes de survie, tempetes |
| asteroid_mine | Mine d'asteroide | Tunnels creuses, gravite faible, poussiere omnipresente |
| alien_ruins | Ruines extraterrestres | Architecture impossible, technologie incomprehensible |
| research_lab | Laboratoire de recherche | Equipement de pointe, experiences abandonnees |
| prison_transport | Transport penitentiaire | Cellules, couloirs etroits, systemes de controle |
| generation_ship | Vaisseau generation | Ecosystemes artificiels, generations oubliees, espaces immenses |

**Storytelling Elements**:
- Datapads: Journal personnel, rapport de maintenance, message d'urgence, logs medicaux
- Wall messages: Graffiti, symboles mystiques, fleches directionnelles, noms barres
- Radio comms: Transmissions fantomes, signaux de detresse, voix de l'IA corrompue
- Physical evidence: Traces de lutte, equipement abandonne, barricades, cadavres

**NPC Archetypes** (5 types):
| Type | Disposition | Knowledge |
|------|-------------|-----------|
| survivor | fearful | partial |
| android | neutral | technical |
| hostile | aggressive | none |
| corrupted | unstable | cryptic |
| authority | demanding | full |

**Implementation notes**:
- Already created in `shared/content/` as JSON files
- Can be loaded by PWA via import or fetch

---

## MEDIUM Priority

### 3. Intent Validation
**CLI source**: `archived/cli/void_walker/llm/intent.py`

Maps free-form player movement actions to valid locations.

**Features**:
- **Movement detection**: Checks if action contains movement keywords (aller, se diriger, entrer, etc.)
- **LLM matching**: Sends available exits to LLM for semantic matching
- **Confidence scoring**: Returns 0-100 confidence score
- **Clarification flow**: If confidence < 70%, show numbered exit list for player selection
- **Action rewrite**: Replace ambiguous location with matched location ID

**Implementation notes**:
- Add `validateMovementIntent()` function to llmClient.ts
- Show clarification modal when confidence is low
- Useful for preventing "invalid location" errors

---

### 4. Extended NPC System
**CLI source**: `archived/cli/void_walker/llm/prompts.py` + `core/state.py`

Richer NPC interactions with state tracking.

**Features**:
- **First encounter detection**: Track `encounteredNpcs` set in GameState
- **Cinematic introductions**: First meeting gets dramatic NPC description
- **Repeat encounters**: Subsequent meetings use simpler greeting
- **Patrol areas**: NPCs can move between locations
- **Trigger conditions**: Conditions for NPC to attack or help
- **Weaknesses**: Non-lethal solutions for hostile NPCs
- **Alive/dead tracking**: `isAlive` flag on NPC objects
- **Dedicated dialogue prompt**: `buildNpcDialoguePrompt()` for NPC conversations

**Implementation notes**:
- Add `encounteredNpcs: Set<string>` to GameState
- Add `isAlive`, `patrolArea`, `triggerCondition`, `weakness` to NPC type
- Create `buildNpcDialoguePrompt()` in prompts.ts

---

### 5. Extended Validation System
**CLI source**: `archived/cli/void_walker/llm/validators.py`

More sophisticated scenario validation with auto-correction.

**Features**:
- **Severity levels**: WARNING (display but allow play) vs ERROR (block play)
- **Issue categories**:
  - Correctable: MISSING_CONNECTION, ORPHANED_LOCATION, MISSING_ITEM, ONE_WAY_CONNECTION, MISSING_WEAKNESS
  - Fatal: NO_VICTORY_PATH, NO_START_LOCATION, TOO_FEW_LOCATIONS
- **Auto-correction**: Ask LLM to fix correctable issues
- **Regeneration**: Full regeneration for fatal issues
- **Path analysis**: BFS/DFS to verify victory path exists

**Implementation notes**:
- Enhance `validators.ts` with issue classification
- Add correction loop in scenario generation
- Show warnings panel for non-fatal issues

---

### 6. Response Validation Extensions
**CLI source**: `archived/cli/void_walker/llm/parser.py`

Additional game response validation rules.

**Features**:
- **Early defeat prevention**: Never allow `is_ending: true` with defeat in first 2 scenes
- **Tension clamping**: Force tension level within beat-specific ranges
- **Fallback suggestions**: Generate context-aware suggestions if LLM omits them

**Implementation notes**:
- Add `validateGameResponse()` function to validators.ts
- Check scene number before allowing defeat endings
- Clamp tension to beat ranges defined in pacing system

---

### 7. Additional Prompt Builders
**CLI source**: `archived/cli/void_walker/llm/prompts.ts`

Specialized prompts for different LLM interactions.

**Functions needed**:
- `buildNpcDialoguePrompt()`: Dedicated NPC conversation prompt with disposition, knowledge, encounter state
- `buildEnvironmentPrompt()`: Generate prose description of current location
- `buildLocationNamePrompt()`: Generate French name for hallucinated locations

**Implementation notes**:
- Add to `prompts.ts` as new functions
- NPC dialogue especially useful for immersive conversations

---

## LOW Priority

### 8. Hallucinated Locations
**CLI source**: `archived/cli/void_walker/core/state.py` + `llm/prompts.py`

Handle LLM-invented locations not in scenario.

**Features**:
- **Tracking**: `hallucinatedLocations: Set<string>` in GameState
- **Name generation**: LLM generates display name for invented locations
- **Caching**: Cache generated names to avoid redundant calls
- **UI indicator**: Show indicator when in hallucinated location

**Implementation notes**:
- Add hallucinated locations tracking to gameStore
- Generate display names lazily when needed

---

### 9. Environment Caching
**CLI source**: `archived/cli/void_walker/core/game.py`

Prevent redundant LLM calls for environment descriptions.

**Features**:
- **Cache key**: `${locationId}-${sceneElementsHash}`
- **Invalidation rules**: Clear on movement, item pickup, secret discovery
- **Cost reduction**: Avoid re-describing same environment

**Implementation notes**:
- Add `environmentCache: Map<string, string>` to gameStore
- Invalidate on relevant state changes

---

### 10. Session Scoring
**CLI source**: `archived/cli/void_walker/core/state.py`

End-of-session score calculation.

**Tracked metrics**:
- secrets_found
- enemies_defeated
- hp_remaining
- items_collected
- objectives_completed
- total_turns

**Ending multipliers**:
- victory: 1.5x
- escape: 1.0x
- mystery_solved: 1.25x
- defeat: 0.5x

**Implementation notes**:
- Add `SessionScore` type and calculate on game end
- Display score in game-over screen

---

### 11. Debug Mode
**CLI source**: `archived/cli/void_walker/__main__.py`

Developer debugging features.

**Features**:
- Debug flag toggle (URL param or settings)
- Verbose console logging
- Full prompt/response logging
- Instant dice (skip animation)
- Show raw LLM responses

**Implementation notes**:
- Add `debugMode` to settings
- Conditional logging in llmClient.ts
- Skip dice animation when debug enabled

---

### 12. Input History
**CLI source**: `archived/cli/void_walker/ui/input.py`

Command history navigation.

**Features**:
- Up/Down arrow navigation through past commands
- Max 50 commands stored
- Prevents duplicate consecutive commands

**Implementation notes**:
- Add `inputHistory: string[]` state
- Handle ArrowUp/ArrowDown in CustomActionInput
- Less critical for mobile (touch interface)

---

### 13. Logging System
**CLI source**: `archived/cli/void_walker/utils/logging.py`

Structured game logging.

**Event types**:
- game_start, game_end
- turn, user_action
- llm_response, llm_response_parsed
- dice_roll, state_change
- error

**Implementation notes**:
- Create `logger.ts` service
- Store logs in IndexedDB for debugging
- Optional export to file

---

### 14. UI Features
**CLI source**: `archived/cli/void_walker/ui/panels.py`

Additional UI panels from CLI.

**Panels**:
- **Help panel**: Control reference, action examples
- **Character panel**: Visual stat bars (not just numbers)
- **Scene elements panel**: List of visible/interactive elements
- **Validation warnings panel**: Show scenario generation warnings

**Implementation notes**:
- Help already accessible via ? icon
- Consider stat bars in StatusBar expansion
- Scene elements could enhance NarrativePanel

---

## Implementation Roadmap

### Phase 1 (Critical for parity)
1. Guidance System - Prevents player frustration
2. Content Definitions - Already done in shared/

### Phase 2 (Enhanced gameplay)
3. Intent Validation
4. Extended NPC System
5. Response Validation Extensions

### Phase 3 (Polish)
6. Extended Validation System
7. Additional Prompt Builders
8. Session Scoring

### Phase 4 (Nice to have)
9. Hallucinated Locations
10. Environment Caching
11. Debug Mode
12. Input History
13. Logging System
14. UI Features
