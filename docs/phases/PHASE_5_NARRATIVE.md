# Phase 5 — Narrative Templates

> **Status:** PENDING
> **Duration:** 1.5 weeks
> **Prerequisites:** Phase 4 complete
> **Reference docs:** `SCENARIO_DESIGN.md` (SS7), `GAME_SYSTEMS.md` (SS11)

---

## Brainstorm Gate

- [ ] Confirm 7-layer composition order and probability thresholds
- [ ] Review template slot system ({target}, {fluid}, {sound}, etc.)
- [ ] Confirm sensory detail pool size per setting (is 3-4 enough per condition?)
- [ ] Review secret verb narratives -- do they feel rewarding enough?
- [ ] Decide on French grammar handling (article agreement, gender)

## Deliverables

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Template slot engine ({actor}, {target}, {tool_used}, etc.) | `src/narration/templateEngine.ts` | Unit: all slot types render correctly |
| 2 | French grammar utils (articles, accords, conjugation helpers) | `src/narration/french.ts` | Unit: "le datapad" vs "la trousse" |
| 3 | 7-layer narrative composer | `src/narration/composer.ts` | Unit: produces output with 1-7 layers |
| 4 | Recently-used buffer (anti-repetition) | `src/narration/memory.ts` | Unit: same template not picked within 10 uses |
| 5 | Action templates: top 15 verbs (225 templates: 15 x 5 outcomes x 3 tensions) | `src/content/templates/physical.ts`, `technical.ts`, `social.ts` | Unit: every verb x outcome x tension has a template |
| 6 | Action templates: next 15 verbs (90 templates, fallback to generic) | Same files | Unit: fallback works for missing specific templates |
| 7 | Generic fallback templates (4 categories x 5 outcomes x 3 tensions = 60) | `src/content/templates/creative.ts` | Unit: every category x outcome has fallback |
| 8 | Absurd action templates (15) | `src/content/templates/absurd.ts` | Unit: absurd actions produce valid narrative |
| 9 | Environmental consequence templates (20) | `src/content/templates/environmental.ts` | Unit: depressurize, fire, flood, power cut |
| 10 | Sensory detail pools per setting (120 snippets) | `src/content/templates/sensory.ts` | Unit: every setting has default + condition pools |
| 11 | Player state snippets (low HP, conditions) | `src/content/templates/conditions.ts` | Unit: wounded, poisoned, terrified snippets exist |
| 12 | NPC reaction snippets | `src/content/templates/social.ts` | Unit: friendly/hostile x outcome combinations |
| 13 | Secret verb narratives (PRAY, DANCE, NAME, SING, APOLOGIZE, SACRIFICE) | `src/content/templates/secrets.ts` | Unit: each secret verb has discovery + context effects |
| 14 | Secret verb parser integration (secret: true flag, excluded from suggestions) | `src/engine/verbs.ts` (update) | Unit: secret verbs never in suggestion list |
| 15 | Tension-aware template selection (priority cascade: specific -> verb -> category -> fallback) | `src/narration/composer.ts` | Unit: correct template selected per priority |
| 16 | Template selection with NarrationMemory | `src/narration/composer.ts` | Integration: 20 sequential calls produce varied output |

## Acceptance Criteria

```bash
npm test                    # All unit tests pass
npm run test:stress         # Every verb x outcome has template coverage
npm run test:integration    # 20 sequential narratives: no exact repeats
```

## Key Design Decisions (Locked In)

- 7-layer composition: Action + Sensory + Consequence + Atmosphere + Player state + Threat hint + NPC reaction
- Layer selection probabilities: Action 100%, Sensory 80%, Consequence (if state changed), Atmosphere 30-80% (scales with tension), Player state (if HP < 30% or condition), Threat (from director), NPC (if present)
- Template priority cascade: verb+target+outcome+tension -> verb+outcome+tension -> category+outcome+tension -> generic fallback
- Anti-repetition buffer size: 10 (per layer)
- All templates in French (primary). EN structure ready but content deferred to post-launch.
- Secret verbs have `secret: true` flag and are NEVER included in suggestion generation
- Template slots: {actor}, {target}, {target_part}, {tool_used}, {location}, {sound}, {fluid}, {damage_desc}, {emotion}, {npc_name}

## Definition of Done

- [ ] `composeNarrative(context)` produces 1-7 layer output
- [ ] Top 15 verbs: full template coverage (225 templates)
- [ ] Generic fallbacks cover every remaining verb category
- [ ] Secret verbs: discovery narrative + context-specific effects
- [ ] NarrationMemory prevents repeats within 10 consecutive calls
- [ ] French grammar: correct articles and basic agreement
- [ ] 20 sequential narrative calls: 0 exact repeats
- [ ] CLAUDE.md updated for Phase 6
