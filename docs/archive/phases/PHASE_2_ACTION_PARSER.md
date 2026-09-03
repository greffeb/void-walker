# Phase 2 — Action Parser

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré.
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **Status:** PENDING
> **Duration:** 1 week
> **Prerequisites:** Phase 1 complete
> **Reference docs:** `PARSER_DESIGN.md` (full doc)

---

## Brainstorm Gate

- [ ] Confirm Snowball FR stemmer package (bundled or npm?)
- [ ] Confirm stop word list for French (articles, prepositions)
- [ ] Review compound action patterns ("tirer sur" vs "tirer")
- [ ] Decide on reformulation UX (how many suggestions to show)

## Deliverables

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Input normalization pipeline (lowercase, accents, apostrophes, stop words) | `src/engine/parser.ts` | Unit: "L'ennemi" -> tokens ["ennemi"] |
| 2 | Curated form table (~300 conjugated forms) | `src/engine/parser.ts` | Unit: "frappez" -> STRIKE, "pirate" -> HACK |
| 3 | Snowball French stemmer integration | `src/engine/snowball-fr.ts` | Unit: "fracassant" -> BREAK stem match |
| 4 | Prefix matching (4+ chars fallback) | `src/engine/parser.ts` | Unit: "fracas" -> BREAK |
| 5 | Verb matching (6-strategy priority cascade) | `src/engine/parser.ts` | Unit: all 6 strategies tested |
| 6 | Compound action detection ("arracher pour servir de massue") | `src/engine/parser.ts` | Unit: compound patterns resolve to multi-verb |
| 7 | Target resolver (inventory -> location -> NPC -> env -> abstract) | `src/engine/resolver.ts` | Unit: "bras du robot" -> robot_arm virtual object |
| 8 | Body part resolution (virtual objects with inherited props) | `src/engine/resolver.ts` | Unit: robot_arm has mechanical+metallic+attached |
| 9 | Difficulty calculation (base + verb + target + context modifiers) | `src/engine/difficulty.ts` | Unit: all modifier types applied correctly |
| 10 | Creativity detection (is action different from suggestions?) | `src/engine/difficulty.ts` | Unit: non-suggested actions get DC bonus |
| 11 | Semantic fallback (aggressive -> STRIKE, movement -> MOVE_TO) | `src/engine/parser.ts` | Unit: unknown aggressive input -> STRIKE |
| 12 | Reformulation prompt generation | `src/engine/parser.ts` | Unit: generates 2-3 interpretations |
| 13 | Stress test: 5000 fuzzed inputs | `tests/stress/parserFuzzing.test.ts` | No throws, no hangs (< 50ms each) |

## Acceptance Criteria

```bash
npm test                    # All unit tests pass
npm run test:stress         # 5000 fuzzed inputs: no throws, < 50ms each
```

## Key Design Decisions (Locked In)

- 6-strategy priority: curated forms -> aliases -> Snowball stem -> prefix -> semantic -> reformulation
- Parser accepts both FR and EN at all times (regardless of display locale)
- "tirer sur" -> SHOOT (not PULL) via compound detection
- Reformulation shows 2-3 best-guess interpretations, never refuses
- Difficulty caps: min 2, max 25
- Creativity bonus: -2 DC for non-suggested, -1 for novel combo, -3 for absurd
- The parser NEVER throws -- always returns a ParsedAction or Reformulation

## Definition of Done

- [ ] "frapper le robot" -> ParsedAction { verb: STRIKE, target: robot }
- [ ] "j'arrache le bras du robot" -> ParsedAction { verb: PULL, target: robot_arm }
- [ ] "tirer sur la vitre" -> SHOOT (not PULL)
- [ ] Random gibberish -> reformulation prompt (never throw)
- [ ] Conjugated forms ("frappez", "pirate", "courez") -> correct verbs
- [ ] 5000 fuzzed inputs: 0 throws, 0 hangs
- [ ] Difficulty always in [2, 25] range
- [ ] CLAUDE.md updated for Phase 3
