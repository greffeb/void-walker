# Phase 3 — Resolution & Combat Engine

> **Status:** PENDING
> **Duration:** 2 weeks
> **Prerequisites:** Phase 2 complete
> **Reference docs:** `GAME_SYSTEMS.md` (SS1-SS7)

---

## Brainstorm Gate

- [ ] Confirm D20 roll formula: D20 + primary_stat + floor(LCK/2) vs DC
- [ ] Confirm critical hit/failure thresholds (nat 20 / nat 1)
- [ ] Review NPC aggression patterns (berserk scaling formula)
- [ ] Confirm condition stacking behavior (deliberate, min stat = 0)
- [ ] Confirm oxygen system triggers per zone type

## Week 1: Dice, Difficulty & Resolution

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Dice system (D20 + stat + LCK bonus vs DC) | `src/engine/dice.ts` | Unit: correct roll formula, nat 20/1 detection |
| 2 | Difficulty presets (Explorer/Survivor/Nightmare modifiers) | `src/engine/difficulty.ts` | Unit: DC modifiers applied per preset |
| 3 | Roll outcome classification (crit_success/success/failure/crit_failure) | `src/engine/dice.ts` | Unit: margin calculation, outcome categories |
| 4 | Item breakage on critical failure | `src/engine/durability.ts` | Unit: fragile items break on nat 1 |
| 5 | Improvised weapon degradation (breaks after 2 uses) | `src/engine/durability.ts` | Unit: non-weapon items break after 2 combat uses |
| 6 | Repair system (Engineer repairs all, non-engineer only easily_repairable) | `src/engine/durability.ts` | Unit: canRepairItem respects class passive |

## Week 2: Combat, Conditions, O2, Stalker Clock

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 7 | Player attack resolution (damage calc, weak points, crit multiplier) | `src/engine/combat.ts` | Unit: damage formula, weak point multiplier |
| 8 | NPC attack resolution (NPC roll vs player defense + armor) | `src/engine/combat.ts` | Unit: defense formula, armor reduction |
| 9 | Weak point discovery (4 methods: examine, scan, combat_hint, lore) | `src/engine/combat.ts` | Unit: auto-discover at round 3 |
| 10 | Fleeing mechanics (AGI + LCK vs fleeDC, no parting attack on success) | `src/engine/combat.ts` | Unit: flee always possible |
| 11 | NPC aggression patterns (aggressive, defensive, ambush, retreating, berserk) | `src/engine/combat.ts` | Unit: berserk gets +1 ATK per 25% HP lost |
| 12 | Status conditions (5 types: wounded, terrified, cold, poisoned, exhausted) | `src/engine/conditions.ts` | Unit: stat malus applied, stacking works |
| 13 | Condition triggers (HP threshold, encounter, cold zone, etc.) | `src/engine/conditions.ts` | Unit: wounded triggers below 30% HP |
| 14 | Condition tick (HP drain, timer decrement, cure methods) | `src/engine/conditions.ts` | Unit: poisoned drains 1 HP/action |
| 15 | Oxygen system (zone-based drain, depletion -> HP drain) | `src/engine/oxygen.ts` | Unit: O2 drain rates per zone |
| 16 | O2 restoration (pressurized zone, canister, EVA suit, repair) | `src/engine/oxygen.ts` | Unit: EVA suit halves drain |
| 17 | Stalker clock (hidden idle counter, warning/threat/kill thresholds) | `src/engine/stalkerClock.ts` | Unit: thresholds per difficulty |
| 18 | Stalker clock reset on node progression | `src/engine/stalkerClock.ts` | Unit: resets to 0 on new node |
| 19 | SHOOT verb implementation (AGI for accuracy, weapon damage) | `src/engine/combat.ts` | Unit: SHOOT uses AGI for roll, weapon for damage |
| 20 | Stress test: 1000 combat simulations | `tests/stress/combatSimulation.test.ts` | No NaN, no negative values, flee always possible |
| 21 | Stress test: condition stacking | `tests/stress/conditionStacking.test.ts` | 5 conditions simultaneous: stats never < 0 |
| 22 | Stress test: oxygen edge cases | `tests/stress/oxygenEdgeCases.test.ts` | O2 -> 0 -> HP drain transition smooth |

## Acceptance Criteria

```bash
npm test                    # All unit tests pass
npm run test:stress         # 1000 combat sims, condition stacking, O2 edge cases
```

## Key Design Decisions (Locked In)

- Roll formula: D20 + primary_stat + floor(LCK/2) vs DC
- Critical hit: nat 20 -> 1.5x damage multiplier
- Critical failure: nat 1 -> item breakage (if fragile), possible condition trigger
- NPC defense: D20 + npc.attack vs 10 + player.AGI + player.DEF + floor(LCK/2)
- Condition stacking is deliberate (horror = desperation), min stat floor = 0
- Oxygen only active in scenarios with relevant zones (not global)
- Stalker clock resets on node progression, not on any action
- Flee is ALWAYS possible (even if DC is 16+ for cornered)
- Equipment armor stacks with DEF: total_reduction = DEF + armorValue
- SHOOT: AGI for hit roll, weapon.damageBonus + floor(AGI/2) for damage

## Definition of Done

- [ ] D20 rolls produce correct outcomes with stat bonuses
- [ ] Combat resolves: player attack, NPC dodge, weak point, NPC retaliation
- [ ] All 5 conditions: triggers, malus, stacking, tick, cure
- [ ] O2 drains per zone, depletes to HP drain, restores in safe zones
- [ ] Stalker clock warns, spawns threat, resets correctly
- [ ] 1000 combat simulations: 0 errors, flee always possible
- [ ] All condition combos: stats >= 0
- [ ] CLAUDE.md updated for Phase 4
