# Deep Parser Campaign Report

## Summary
- Total cases: 523
- Passed: 490
- Failed: 33
- Reformulations: 19
- Avg parse time: 0.3458ms
- Max parse time: 8.4220ms
- P95 parse time: 0.8997ms
- Outlier threshold: 8.0000ms

## Severity Counts
- Critical: 0
- High: 2
- Medium: 31
- Low: 0

## Top 20 Failing Cases
| Rank | Case | Severity | Input | Expected | Actual | Why wrong |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | C0103 | high | `examiner cale` | verb in [EXAMINE]; target=cable; non-abstract | verb=EXAMINE, target=null, strategy=1 | Wrong resolved entity id. |
| 2 | C0403 | high | `aller sa-b` | verb in [MOVE_TO]; target=sas_b; source=connected_location; non-abstract | reformulation () | Clear intent was not parsed into action. |
| 3 | C0505 | medium | `mot0_0 mot0_1 mot0_2 mot0_3 mot0_4 mot0_5 mot0_6 mot0_7 mot0_8 mot0_9 mot0_10 mot0_11 mot0_12 mot0_13 mot0_14 mot0_15 mot0_16 mot0_17 mot0_18 mot0_19 mot0_20 mot0_21 mot0_22 mot0_23 mot0_24 mot0_25 mot0_26 mot0_27 mot0_28 mot0_29 mot0_30 mot0_31 mot0_32 mot0_33 mot0_34 mot0_35 mot0_36 mot0_37 mot0_38 mot0_39 mot0_40 mot0_41 mot0_42 mot0_43 mot0_44 mot0_45 mot0_46 mot0_47 mot0_48 mot0_49 mot0_50 mot0_51 mot0_52 mot0_53 mot0_54 mot0_55 mot0_56 mot0_57 mot0_58 mot0_59 mot0_60 mot0_61 mot0_62 mot0_63 mot0_64 mot0_65 mot0_66 mot0_67 mot0_68 mot0_69 mot0_70 mot0_71 mot0_72 mot0_73 mot0_74 mot0_75 mot0_76 mot0_77 mot0_78 mot0_79 mot0_80 mot0_81 mot0_82 mot0_83 mot0_84 mot0_85 mot0_86 mot0_87 mot0_88 mot0_89 mot0_90 mot0_91 mot0_92 mot0_93 mot0_94 mot0_95 mot0_96 mot0_97 mot0_98 mot0_99 mot0_100 mot0_101 mot0_102 mot0_103 mot0_104 mot0_105 mot0_106 mot0_107 mot0_108 mot0_109 mot0_110 mot0_111 mot0_112 mot0_113 mot0_114 mot0_115 mot0_116 mot0_117 mot0_118 mot0_119 mot0_120 mot0_121 mot0_122 mot0_123 mot0_124 mot0_125 mot0_126 mot0_127 mot0_128 mot0_129 mot0_130 mot0_131 mot0_132 mot0_133 mot0_134 mot0_135 mot0_136 mot0_137 mot0_138 mot0_139 mot0_140 mot0_141 mot0_142 mot0_143 mot0_144 mot0_145 mot0_146 mot0_147 mot0_148 mot0_149 mot0_150 mot0_151 mot0_152 mot0_153 mot0_154 mot0_155 mot0_156 mot0_157 mot0_158 mot0_159 mot0_160 mot0_161 mot0_162 mot0_163 mot0_164 mot0_165 mot0_166 mot0_167 mot0_168 mot0_169 mot0_170 mot0_171 mot0_172 mot0_173 mot0_174 mot0_175 mot0_176 mot0_177 mot0_178 mot0_179 mot0_180 mot0_181 mot0_182 mot0_183 mot0_184 mot0_185 mot0_186 mot0_187 mot0_188 mot0_189 mot0_190 mot0_191 mot0_192 mot0_193 mot0_194 mot0_195 mot0_196 mot0_197 mot0_198 mot0_199 mot0_200 mot0_201 mot0_202 mot0_203 mot0_204 mot0_205 mot0_206 mot0_207 mot0_208 mot0_209 mot0_210 mot0_211 mot0_212 mot0_213 mot0_214 mot0_215 mot0_216 mot0_217 mot0_218 mot0_219 mot0_220 mot0_221 mot0_222 mot0_223 mot0_224 mot0_225 mot0_226 mot0_227 mot0_228 mot0_229 mot0_230 mot0_231 mot0_232 mot0_233 mot0_234 mot0_235 mot0_236 mot0_237 mot0_238 mot0_239 mot0_240 mot0_241 mot0_242 mot0_243 mot0_244 mot0_245 mot0_246 mot0_247 mot0_248 mot0_249 mot0_250 mot0_251 mot0_252 mot0_253 mot0_254 mot0_255 mot0_256 mot0_257 mot0_258 mot0_259 mot0_260 mot0_261 mot0_262 mot0_263 mot0_264 mot0_265 mot0_266 mot0_267 mot0_268 mot0_269 mot0_270 mot0_271 mot0_272 mot0_273 mot0_274 mot0_275 mot0_276 mot0_277 mot0_278 mot0_279 mot0_280 mot0_281 mot0_282 mot0_283 mot0_284 mot0_285 mot0_286 mot0_287 mot0_288 mot0_289 mot0_290 mot0_291 mot0_292 mot0_293 mot0_294 mot0_295 mot0_296 mot0_297 mot0_298 mot0_299 tirer sur robot securite` | <=8.000ms | 8.422ms | Parse time outlier. |
| 4 | C0255 | medium | `examiner baie vitree puis toucher baie vitree` | verb in [EXAMINE]; target=observation_window; secondary=TOUCH; non-abstract | verb=EXAMINE, target=observation_window/environment, strategy=1 | Secondary intent in chain was dropped. |
| 5 | C0195 | medium | `examiner androide blesse puis toucher androide blesse` | verb in [EXAMINE]; target=wounded_android; secondary=TOUCH; non-abstract | verb=EXAMINE, target=wounded_android/npc, strategy=1 | Secondary intent in chain was dropped. |
| 6 | C0015 | medium | `examiner pistolet laser puis toucher pistolet laser` | verb in [EXAMINE]; target=laser_pistol; secondary=TOUCH; non-abstract | verb=EXAMINE, target=laser_pistol/inventory, strategy=1 | Secondary intent in chain was dropped. |
| 7 | C0030 | medium | `examiner barre metal puis toucher barre metal` | verb in [EXAMINE]; target=metal_bar; secondary=TOUCH; non-abstract | verb=EXAMINE, target=metal_bar/inventory, strategy=1 | Secondary intent in chain was dropped. |
| 8 | C0210 | medium | `examiner membre equipage parasite puis toucher membre equipage parasite` | verb in [EXAMINE]; target=parasitized_crewmember; secondary=TOUCH; non-abstract | verb=EXAMINE, target=parasitized_crewmember/npc, strategy=1 | Secondary intent in chain was dropped. |
| 9 | C0165 | medium | `examiner robot securite puis toucher robot securite` | verb in [EXAMINE]; target=security_robot; secondary=TOUCH; non-abstract | verb=EXAMINE, target=security_robot/npc, strategy=1 | Secondary intent in chain was dropped. |
| 10 | C0225 | medium | `examiner ia station puis toucher ia station` | verb in [EXAMINE]; target=station_ai; secondary=TOUCH; non-abstract | verb=EXAMINE, target=station_ai/npc, strategy=1 | Secondary intent in chain was dropped. |
| 11 | C0300 | medium | `examiner conduite refroidissement puis toucher conduite refroidissement` | verb in [EXAMINE]; target=coolant_pipe; secondary=TOUCH; non-abstract | verb=EXAMINE, target=coolant_pipe/environment, strategy=1 | Secondary intent in chain was dropped. |
| 12 | C0060 | medium | `examiner tube metallique puis toucher tube metallique` | verb in [EXAMINE]; target=metal_tube; secondary=TOUCH; non-abstract | verb=EXAMINE, target=metal_tube/inventory, strategy=1 | Secondary intent in chain was dropped. |
| 13 | C0075 | medium | `examiner datapad puis toucher datapad` | verb in [EXAMINE]; target=datapad; secondary=TOUCH; non-abstract | verb=EXAMINE, target=datapad/inventory, strategy=1 | Secondary intent in chain was dropped. |
| 14 | C0240 | medium | `examiner porte blindee puis toucher porte blindee` | verb in [EXAMINE]; target=blast_door; secondary=TOUCH; non-abstract | verb=EXAMINE, target=blast_door/environment, strategy=1 | Secondary intent in chain was dropped. |
| 15 | C0045 | medium | `examiner couteau puis toucher couteau` | verb in [EXAMINE]; target=knife; secondary=TOUCH; non-abstract | verb=EXAMINE, target=knife/inventory, strategy=1 | Secondary intent in chain was dropped. |
| 16 | C0485 | medium | `tirer sur robot securite puis courir vers couloir` | verb in [SHOOT]; target=security_robot; source=npc; compound=true; secondary=RUN; non-abstract | verb=SHOOT, target=security_robot/npc, strategy=5 | Secondary intent in chain was dropped. |
| 17 | C0285 | medium | `examiner bouche ventilation puis toucher bouche ventilation` | verb in [EXAMINE]; target=maintenance_vent; secondary=TOUCH; non-abstract | verb=EXAMINE, target=maintenance_vent/environment, strategy=1 | Secondary intent in chain was dropped. |
| 18 | C0090 | medium | `examiner ruban adhesif puis toucher ruban adhesif` | verb in [EXAMINE]; target=duct_tape; secondary=TOUCH; non-abstract | verb=EXAMINE, target=duct_tape/location, strategy=1 | Secondary intent in chain was dropped. |
| 19 | C0270 | medium | `examiner terminal commande puis toucher terminal commande` | verb in [EXAMINE]; target=command_terminal; secondary=TOUCH; non-abstract | verb=EXAMINE, target=command_terminal/environment, strategy=1 | Secondary intent in chain was dropped. |
| 20 | C0180 | medium | `examiner xenomorphe puis toucher xenomorphe` | verb in [EXAMINE]; target=xenomorph; secondary=TOUCH; non-abstract | verb=EXAMINE, target=xenomorph/npc, strategy=1 | Secondary intent in chain was dropped. |

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
