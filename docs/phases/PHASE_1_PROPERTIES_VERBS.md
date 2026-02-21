# Phase 1 — Properties, Verbs & Character Data

> **Status:** PENDING
> **Duration:** 1 week
> **Prerequisites:** Phase 0 complete
> **Reference docs:** `PARSER_DESIGN.md` (SS1-SS2), `GAME_SYSTEMS.md` (SS1)

---

## Brainstorm Gate

- [ ] Confirm all 60+ property IDs are correct and complete
- [ ] Confirm all 50+ verb IDs with 6-stat mappings
- [ ] Confirm 3 class stat distributions feel balanced
- [ ] Decide on item JSON format (inline TS constants vs external JSON)

## Deliverables

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Property registry (60+ properties with metadata) | `src/engine/properties.ts` | Unit: every property has valid type |
| 2 | Property inheritance system (type -> base props + overrides) | `src/engine/properties.ts` | Unit: tool inherits tangible+liftable+holdable+small+usable |
| 3 | Verb registry (50+ verbs, FR+EN aliases, stat mapping, requirements) | `src/engine/verbs.ts` | Unit: STRIKE maps to ATK, SHOOT maps to AGI |
| 4 | Verb compatibility checker (verb requirements vs target properties) | `src/engine/compatibility.ts` | Unit: HACK needs electronic+secured, THROW needs liftable OR small |
| 5 | Item definitions (20+ items with properties, damage, repair flags) | `src/content/items.ts` | Unit: every item resolves all properties correctly |
| 6 | NPC archetypes (5+ with properties, combat stats) | `src/content/npcs.ts` | Unit: every NPC has valid stat values |
| 7 | Environment feature definitions (door, window, terminal, etc.) | `src/content/environments.ts` | Unit: every feature has base properties |
| 8 | Class definitions (Marine, Engineer, Medic with stats, items, passives) | `src/content/classes.ts` | Unit: all classes total 15 stat points |
| 9 | Character creation validation (2 bonus points, max stat 5) | `src/engine/types.ts` + validation | Unit: invalid allocations rejected |
| 10 | Stress test: all verbs x all items combinatorial | `tests/stress/allVerbsAllItems.test.ts` | 500K+ combos return valid compatibility result |

## Acceptance Criteria

```bash
npm test                    # All unit tests pass
npm run test:stress         # 500K+ verb-item combos: no throws, valid difficulty range
```

## Key Design Decisions (Locked In)

- Properties are string literal unions, not enums (better for extensibility)
- Item definitions use type inheritance + per-item overrides (PARSER_DESIGN.md SS2.2)
- All verbs mapped to 6-stat system (GAME_SYSTEMS.md SS1.3)
- SHOOT verb added (AGI stat, requires `ranged` weapon)
- Engineer passive: `REPAIR_ALL_BROKEN` (can repair any broken item)
- Non-engineers: can only repair `easily_repairable` items
- Verb aliases include both FR and EN at all times
- Locale fields on all player-facing strings: `{ fr: string; en: string }`

## Definition of Done

- [ ] 60+ properties defined with descriptions
- [ ] 50+ verbs with FR/EN aliases and 6-stat mappings
- [ ] Property inheritance produces correct merged sets
- [ ] Compatibility checker handles OR clauses and blocking conditions
- [ ] 20+ items fully defined with properties and locale strings
- [ ] 3 classes defined with balanced stats (15 points each)
- [ ] 500K+ stress test combos pass without throws
- [ ] CLAUDE.md updated for Phase 2
