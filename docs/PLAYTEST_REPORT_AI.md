# Playtest Report — AI Player Perspective

> **Date:** 2025-07-21
> **Games:** 2 complete sessions (104+ combined turns)
> **Fixes applied before playtest:** 5 engine fixes (USE verb promotion, threat→combat wiring, location aliases, feature suggestions, bot nameKey display)

---

## Sessions Played

### Game 1: Escape — Marine — Derelict Ship (seed 42)
- **Turns:** 58 (died on turn 58)
- **Outcome:** DEFEAT (permadeath — killed by xenomorph during combat)
- **Locations visited:** 5 (jonction de maintenance, salle des opérations, centre de gestion, infirmerie de recherche, module de repos)
- **Beat progression:** intro → rising → midpoint
- **Combat triggered:** Yes (xenomorph at turn 48 via threat director)

### Game 2: Investigate — Engineer — Space Station (seed 1234)
- **Turns:** 46 (commands exhausted, stuck in 2-room loop)
- **Outcome:** STUCK (never left 2nd room, couldn't resolve movement)
- **Locations visited:** 2 (sas de maintenance extérieure, couloir de recherche)
- **Beat progression:** stayed at intro the entire game
- **Combat triggered:** No

---

## Critical Issues (Game-Breaking)

### 1. MOVEMENT FAILS SILENTLY — "aller vers sortie inexploré" doesn't actually move
**Severity:** CRITICAL
**Frequency:** Every time a vague movement command is used
**Description:** Commands like "aller vers sortie inexploré", "aller vers sortie", "aller vers sortie suivante" all resolve to `MOVE_TO environment` instead of actually moving to an exit. The parser can't match the vague destination concept to a specific connected location. The narrative says "Vous gagnez l'environment" (which is grammatically broken AND doesn't move the player). The player stays right where they are. This is the #1 reason the game gets stuck.
**Impact:** A real player who doesn't know exact room names will be unable to navigate.
**Fix:** The parser should resolve vague movement tokens ("sortie", "inexploré", "passage", "porte") to the best matching connected location. Unexplored locations should have higher priority.

### 2. "aller centre de gestion" actually moved to a module node, not the second room
**Severity:** CRITICAL
**Frequency:** When the target name doesn't match the actual connected location node name
**Description:** The exit to the next area was displayed as "centre de gestion" but the underlying node was `power_reroute_dilemma_01_main_0`. When I typed "aller centre de gestion", it worked — but the narrative said "Vous avancez vers le power reroute dilemma 01 main 0" exposing the internal ID to the player. This happens because the narrative uses the node ID instead of the French display name for movement narrative.
**Impact:** Immersion-breaking. Internal IDs should never be visible to the player.
**Fix:** Movement narrative should use the node's `nameKey.fr` display name, not the raw node ID.

### 3. "prendre tout" / "prendre objets" resolves as `TAKE environment`
**Severity:** HIGH
**Frequency:** Every time a batch pickup is attempted
**Description:** When I type "prendre tout", "prendre objets", "prendre objets visibles" — the parser resolves the target as `environment` (the abstract environment entity) instead of any actual item. The narrative says "l'environment passe de la surface froide du sol à vos mains" which is nonsensical. No items are actually taken.
**Impact:** Player can't use natural batch-pickup commands. Must name each item individually.
**Fix:** "tout" / "objets" should either pick up all items or at least show a reformulation asking which item.

### 4. OBS REROUTE verb ("reroute") is not recognized by the parser
**Severity:** HIGH
**Frequency:** At every obstacle that uses the REROUTE verb
**Description:** The suggestion says "reroute Panneau de distribution d'énergie" but when I type exactly that, the parser returns a reformulation ("Que tentez-vous exactement?"). The verb "reroute" is not a known French verb. The suggestions generate English verb text for some obstacle paths.
**Impact:** Player can't follow the game's own suggestions. Completely confusing.
**Fix:** Suggestion verbText must always be in French. Obstacles should use recognized French verbs ("rediriger", "détourner", "réacheminer") and these need to be in the verb alias table.

### 5. Obstacle suggestions show ENGLISH verbs: "heal wounded crew member", "search wounded crew member"
**Severity:** HIGH
**Frequency:** At every obstacle with English verb paths
**Description:** Several obstacle paths have English verb text in suggestions: "heal wounded crew member", "search wounded crew member", "crawl Porte bloquée", "hack Porte bloquée". These are mixing English verbs with French targets.
**Impact:** Confusing bilingual suggestions destroy player trust in the suggestion system.
**Fix:** All obstacle path verbs must be French. The data in scenario modules needs French verbs.

---

## Major Issues (Significant, Not Blocking)

### 6. Combat initiated but player can't fight or flee
**Severity:** HIGH
**Frequency:** Every combat encounter
**Description:** At turn 48, combat started (xenomorph HP:20/20 Round:1). However, there was NO indication to the player that combat had begun — no narrative about being attacked, no combat-specific suggestions. I continued issuing normal commands ("aller centre de gestion") and the NPC kept attacking me (-4 HP per round) while I had zero ability to fight back or flee. I died without ever being told I was in combat. The `displayScene` only shows a tiny line "⚔️ COMBAT" in the header.
**Impact:** Player dies without understanding what happened. No combat commands suggested.
**Fix:** When combat starts: (a) show dramatic narrative about the encounter, (b) show combat-specific suggestions (attaquer, fuir, esquiver), (c) make combat verbs (STRIKE, SHOOT, FLEE) available and obvious.

### 7. WAIT doesn't reset exhaustion — "attendre" has no rest benefit
**Severity:** MEDIUM-HIGH
**Frequency:** Always
**Description:** The WAIT verb is supposed to reset `actionsWithoutRest`, and I can see in the code that it does. However, the `exhausted` condition was never removed even after multiple WAIT turns. The condition persists permanently once triggered, draining HP every turn.
**Impact:** HP slowly drains with no player recourse. The exhaustion condition is a death sentence with no cure.
**Fix:** WAIT should clear exhaustion condition or at minimum prevent it from triggering. Also, conditions should expire — exhaustion should last a fixed number of turns.

### 8. "soigner" (heal) is not a recognized verb
**Severity:** MEDIUM-HIGH
**Frequency:** When trying to heal NPCs or self
**Description:** "soigner membre d'équipage blessé" triggers a reformulation. This is a natural verb that any French speaker would try, especially when the obstacle says the NPC is wounded and the suggestion says "heal".
**Impact:** Player can't heal NPCs despite having a medkit and the obstacle explicitly being about a wounded person.
**Fix:** Add "soigner" as a HEAL verb alias (or map it to USE with medical intent).

### 9. "{npc_name}" template variable leaked to player text
**Severity:** MEDIUM
**Frequency:** Multiple times per game
**Description:** The narrative occasionally shows raw template variables: "{npc_name} ne montre aucune réaction particulière". The template slot `{npc_name}` was not replaced with the actual NPC name.
**Impact:** Immersion-breaking. Raw template syntax visible to player.
**Fix:** Ensure all template slots are resolved before displaying. Add fallback for missing NPC data.

### 10. "L'interaction avec est immédiate" — missing target in WAIT narrative
**Severity:** MEDIUM
**Frequency:** Every WAIT command
**Description:** WAIT triggers the narrative "L'interaction avec est immédiate. Simple et efficace." — the preposition "avec" has no object. It should say "Vous attendez" or similar.
**Impact:** Grammatically broken narrative.
**Fix:** WAIT needs its own dedicated narrative template that doesn't reference a target.

### 11. "L'examen de le Panneau" — wrong French article contraction
**Severity:** MEDIUM
**Frequency:** Multiple examine commands
**Description:** "L'examen de le Panneau de sécurité porte ses fruits" should be "L'examen du Panneau" (de + le = du). The grammar engine's `de` contraction is not working correctly for masculine nouns.
**Impact:** Unnatural French. Every French speaker will notice.
**Fix:** The grammar engine's `de_target` slot must handle masculine article contraction (de + le → du, de + les → des).

### 12. "l'hasard" — bad elision on aspirated h
**Severity:** LOW-MEDIUM
**Frequency:** Rare
**Description:** "Trop régulier pour être l'hasard" should be "le hasard" ("hasard" has an aspirated h in French).
**Impact:** Minor but noticeable grammar error.
**Fix:** Add "hasard" to the aspirated-h exceptions list in the grammar engine.

---

## Minor Issues (Polish)

### 13. Inventory shows duplicate "Kit médical basique"
**Description:** In Game 1, I had a starting medkit AND found another. The deduplication guard prevented actual duplication, but narratively the game still claimed I picked it up ("Vous ramassez le Kit médical basique"). The TAKE auto-succeeds even when the item is already in inventory.
**Fix:** TAKE should check if item is already in inventory and say "Vous avez déjà cet objet."

### 14. Stalker events fire but are invisible — "🕐 Stalker: kill" with no narrative
**Description:** Stalker events (warning, threat_arrival, kill) fire frequently but have no narrative impact. The kill event especially should trigger dramatic consequences — HP damage, forced movement, or immediate danger.
**Fix:** Wire stalker events to actual game consequences and narrative descriptions.

### 15. "se reposer" resolves as PUSH (Strategy 4) — incorrect fallback
**Description:** "se reposer" generated `[PUSH environment S4]`. This is a natural French command for resting, but the parser matched the "re" prefix to some verb and "poser" to PUSH. It should trigger WAIT or a REST action.
**Fix:** Add "se reposer", "repos", "dormir" as WAIT aliases.

### 16. Atmosphere/sensory layer is repetitive
**Description:** The same sensory lines repeat frequently: "Des traces sur le sol. Pas humaines. Pas anciennes." appeared 15+ times. "Les caméras de sécurité ont cessé de fonctionner. L'une après l'autre." appeared 10+ times. The anti-repetition memory (buffer size 10) is clearly insufficient for the variety of sensory snippets available.
**Fix:** Increase anti-repetition buffer or add more sensory variety per tension tier / setting.

### 17. Examine specific features resolves as "examine environment"
**Description:** "examiner terminal", "examiner éléments", "examiner tout" all resolve to EXAMINE environment instead of the specific feature. This is because "terminal" or "éléments" are too vague for the parser to match a specific entity.
**Fix:** When multiple features match partially, pick the best one or offer disambiguation.

### 18. Beat never advances past "rising" in Game 2 (investigate)
**Description:** After 46 turns, the game was still at beat "intro". The beat only advances when the player visits a core node. Since the player was stuck in 2 rooms (start + first module), the beat never progressed.
**Impact:** Threat director stays dormant (intro has 0% encounter chance), so there's no tension at all.
**Fix:** Consider time-based beat progression as a fallback when the player is stuck.

---

## Summary of Positive Findings

1. **Scenario interactions work well:** Examining the status terminal gave a rich, story-relevant response with scenario override text. The bulkhead door interaction explained why it was locked.
2. **NPC dialogue is great:** Talking to the wounded crew member (Torres) delivered excellent story exposition with specific plot details.  
3. **Combat wiring works:** The threat director successfully spawned a xenomorph encounter at turn 48 (midpoint beat, 10% encounter chance). The NPC attacked correctly for -4 HP/round.
4. **Narration bridge produces good text:** The compose narrative 7-layer system produces varied, atmospheric text with sensory details and atmosphere hints.
5. **Item pickup works correctly:** Named items ("prendre lampe de secours", "prendre kit médical basique") are picked up and tracked in inventory.
6. **Scene description is useful:** The structured display (items, features, NPCs, exits) gives the player clear awareness of the environment.
7. **HP/conditions system works:** I gained the "exhausted" condition from sustained action, the "wounded" condition from low HP, and eventually died from accumulated damage.

---

## Priority Fix Ranking

| Priority | Issue # | Description | Effort |
|----------|---------|-------------|--------|
| P0 | 1 | Vague movement fails silently | Medium |
| P0 | 4+5 | English/unknown verbs in suggestions | Low |
| P0 | 6 | Combat has no player agency | High |
| P1 | 2 | Internal node IDs in narrative | Low |
| P1 | 3 | "prendre tout" doesn't work | Medium |
| P1 | 8 | "soigner" not recognized as verb | Low |
| P1 | 9 | {npc_name} template leak | Low |
| P1 | 10 | WAIT narrative is broken | Low |
| P2 | 7 | Exhaustion never clears | Low |
| P2 | 11 | de + le contraction broken | Low |
| P2 | 14 | Stalker events have no effect | Medium |
| P2 | 15 | "se reposer" → PUSH | Low |
| P3 | 12 | Aspirated h elision | Low |
| P3 | 13 | Duplicate TAKE no guard | Low |
| P3 | 16 | Sensory repetition | Low |
| P3 | 17 | Vague feature examine | Medium |
| P3 | 18 | Beat stuck in intro | Medium |
