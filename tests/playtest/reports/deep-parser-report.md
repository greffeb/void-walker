# Deep Parser Campaign Report

## Summary
- Total cases: 523
- Passed: 463
- Failed: 60
- Reformulations: 18
- Avg parse time: 0.5224ms
- Max parse time: 3.6735ms
- P95 parse time: 1.3820ms
- Outlier threshold: 8.0000ms

## Severity Counts
- Critical: 0
- High: 2
- Medium: 58
- Low: 0

## Top 20 Failing Cases
| Rank | Case | Severity | Input | Expected | Actual | Why wrong |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | C0103 | high | `examiner cale` | verb in [EXAMINE]; target=cable; non-abstract | verb=EXAMINE, target=environment/abstract, strategy=1, conf=1.00 | Wrong resolved entity id. |
| 2 | C0403 | high | `aller sa-b` | verb in [MOVE_TO]; target=sas_b; source=connected_location; non-abstract | verb=MOVE_TO, target=environment/abstract, strategy=1, conf=1.00 | Wrong resolved entity id. |
| 3 | C0165 | medium | `examiner robot securite puis toucher robot securite` | verb in [EXAMINE]; target=security_robot; secondary=TOUCH; non-abstract | verb=EXAMINE, target=security_robot/npc, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 4 | C0195 | medium | `examiner androide blesse puis toucher androide blesse` | verb in [EXAMINE]; target=wounded_android; secondary=TOUCH; non-abstract | verb=EXAMINE, target=wounded_android/npc, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 5 | C0255 | medium | `examiner baie vitree puis toucher baie vitree` | verb in [EXAMINE]; target=observation_window; secondary=TOUCH; non-abstract | verb=EXAMINE, target=observation_window/environment, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 6 | C0194 | medium | `ne pas toucher androide blesse` | target=wounded_android; negated!=TOUCH; non-abstract | verb=TOUCH, target=wounded_android/npc, strategy=1, conf=1.00 | Negation words were ignored. |
| 7 | C0314 | medium | `ne pas toucher panneau acces` | target=access_panel; negated!=TOUCH; non-abstract | verb=TOUCH, target=access_panel/environment, strategy=1, conf=1.00 | Negation words were ignored. |
| 8 | C0389 | medium | `ne pas aller couloir` | target=corridor_a; source=connected_location; negated!=MOVE_TO; non-abstract | verb=MOVE_TO, target=corridor_a/connected_location, strategy=1, conf=1.00 | Negation words were ignored. |
| 9 | C0210 | medium | `examiner membre equipage parasite puis toucher membre equipage parasite` | verb in [EXAMINE]; target=parasitized_crewmember; secondary=TOUCH; non-abstract | verb=EXAMINE, target=parasitized_crewmember/npc, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 10 | C0015 | medium | `examiner pistolet laser puis toucher pistolet laser` | verb in [EXAMINE]; target=laser_pistol; secondary=TOUCH; non-abstract | verb=EXAMINE, target=laser_pistol/inventory, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 11 | C0014 | medium | `ne pas toucher pistolet laser` | target=laser_pistol; negated!=TOUCH; non-abstract | verb=TOUCH, target=laser_pistol/inventory, strategy=1, conf=1.00 | Negation words were ignored. |
| 12 | C0330 | medium | `examiner camera securite puis toucher camera securite` | verb in [EXAMINE]; target=security_camera; secondary=TOUCH; non-abstract | verb=EXAMINE, target=security_camera/environment, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 13 | C0135 | medium | `examiner lampe torche puis toucher lampe torche` | verb in [EXAMINE]; target=flashlight; secondary=TOUCH; non-abstract | verb=EXAMINE, target=flashlight/location, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 14 | C0225 | medium | `examiner ia station puis toucher ia station` | verb in [EXAMINE]; target=station_ai; secondary=TOUCH; non-abstract | verb=EXAMINE, target=station_ai/npc, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 15 | C0180 | medium | `examiner xenomorphe puis toucher xenomorphe` | verb in [EXAMINE]; target=xenomorph; secondary=TOUCH; non-abstract | verb=EXAMINE, target=xenomorph/npc, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 16 | C0345 | medium | `examiner sas principal puis toucher sas principal` | verb in [EXAMINE]; target=main_airlock; secondary=TOUCH; non-abstract | verb=EXAMINE, target=main_airlock/environment, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 17 | C0164 | medium | `ne pas toucher robot securite` | target=security_robot; negated!=TOUCH; non-abstract | verb=TOUCH, target=security_robot/npc, strategy=1, conf=1.00 | Negation words were ignored. |
| 18 | C0485 | medium | `tirer sur robot securite puis courir vers couloir` | verb in [SHOOT]; target=security_robot; source=npc; compound=true; secondary=RUN; non-abstract | verb=SHOOT, target=security_robot/npc, strategy=5, conf=0.90 | Secondary intent in chain was dropped. |
| 19 | C0315 | medium | `examiner panneau acces puis toucher panneau acces` | verb in [EXAMINE]; target=access_panel; secondary=TOUCH; non-abstract | verb=EXAMINE, target=access_panel/environment, strategy=1, conf=1.00 | Secondary intent in chain was dropped. |
| 20 | C0179 | medium | `ne pas toucher xenomorphe` | target=xenomorph; negated!=TOUCH; non-abstract | verb=TOUCH, target=xenomorph/npc, strategy=1, conf=1.00 | Negation words were ignored. |

## Re-run Failing Cases
- Command: `npx tsx tests/playtest/reports/deepParserCampaign.ts --only-failing`
- Script: `tests/playtest/reports/rerun-failing-cases.cmd`
- Script: `tests/playtest/reports/rerun-failing-cases.ps1`

## Root-Cause Pointers
- `src/engine/resolver.ts:74` token score partial/prefix matching can collide aliases.
- `src/engine/resolver.ts:283` NPC resolution precedes environment (`src/engine/resolver.ts:306`), causing camera/security conflicts.
- `src/engine/parser.ts:27` negation tokens (`ne`, `pas`) are removed by stop-word filtering (`src/engine/parser.ts:70`).
- `src/engine/parser.ts:723` parser emits a single action, so chained intents are dropped.
- `src/engine/parser.ts:593` prefix strategy can over-accept typo/prefix verbs.

## Artifacts
- Matrix: `tests\playtest\reports\deep-parser-matrix.json`
- Results: `tests\playtest\reports\deep-parser-results.json`
- Failures: `tests\playtest\reports\deep-parser-failures.json`
- Summary: `tests\playtest\reports\deep-parser-summary.json`
