#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { parseAction } from '../../../src/engine/parser';
import { BODY_PARTS } from '../../../src/engine/resolver';
import {
  isReformulation,
  type SceneContext,
  type ResolvedTarget,
  type NpcInstance,
  type EnvironmentFeatureInstance,
  type BodyPartDefinition,
  type TargetSource,
} from '../../../src/engine/types';
import type { VerbId } from '../../../src/engine/verbs';
import { ITEM_LIST, ITEM_DEFINITIONS, resolveItemProperties } from '../../../src/content/items';
import { NPC_LIST, NPC_DEFINITIONS, resolveNPCProperties } from '../../../src/content/npcs';
import {
  ENVIRONMENT_FEATURE_LIST,
  ENVIRONMENT_FEATURE_DEFINITIONS,
  resolveEnvironmentProperties,
} from '../../../src/content/environments';
import { getEntityAliases } from '../../../src/content/helpers';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type ElementType = 'inventory' | 'location' | 'npc' | 'environment' | 'exit';

interface ElementDescriptor {
  id: string;
  type: ElementType;
  ref: string;
  alt: string;
  accentRef?: string;
}

interface CaseExpectation {
  verbs?: readonly VerbId[];
  targetId?: string;
  targetSource?: TargetSource;
  expectReformulation?: boolean;
  expectCompound?: boolean;
  expectBodyPart?: boolean;
  negatedVerb?: VerbId;
  multiIntentSecondVerb?: VerbId;
  requireNonAbstract?: boolean;
}

interface CampaignCase {
  id: string;
  input: string;
  category: string;
  subcategory: string;
  clearIntent: boolean;
  expectation: CaseExpectation;
  elementId?: string;
  elementType?: ElementType;
}

interface Finding {
  severity: Severity;
  code: string;
  expected: string;
  actual: string;
  whyWrong: string;
}

interface CaseResult {
  id: string;
  input: string;
  category: string;
  subcategory: string;
  elementId: string | null;
  elementType: ElementType | null;
  clearIntent: boolean;
  expected: CaseExpectation;
  verbOrReformulation: string;
  verb: VerbId | null;
  isReformulation: boolean;
  targetId: string | null;
  targetSource: TargetSource | null;
  strategy: number | null;
  confidence: number | null;
  isCompound: boolean | null;
  tokens: readonly string[];
  parseMs: number;
  findings: readonly Finding[];
  severity: Severity | null;
  passed: boolean;
  error: string | null;
}

const REPORT_DIR = path.resolve(process.cwd(), 'tests/playtest/reports');
const MATRIX_PATH = path.join(REPORT_DIR, 'deep-parser-matrix.json');
const RESULTS_PATH = path.join(REPORT_DIR, 'deep-parser-results.json');
const FAILURES_PATH = path.join(REPORT_DIR, 'deep-parser-failures.json');
const FAILING_IDS_PATH = path.join(REPORT_DIR, 'deep-parser-failing-case-ids.json');
const SUMMARY_PATH = path.join(REPORT_DIR, 'deep-parser-summary.json');
const REPORT_MD_PATH = path.join(REPORT_DIR, 'deep-parser-report.md');
const RERUN_CMD_PATH = path.join(REPORT_DIR, 'rerun-failing-cases.cmd');
const RERUN_PS1_PATH = path.join(REPORT_DIR, 'rerun-failing-cases.ps1');

const SEVERITY_RANK: Readonly<Record<Severity, number>> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const ELEMENTS: readonly ElementDescriptor[] = [
  { id: 'laser_pistol', type: 'inventory', ref: 'pistolet laser', alt: 'blaster' },
  { id: 'metal_bar', type: 'inventory', ref: 'barre metal', alt: 'levier' },
  { id: 'knife', type: 'inventory', ref: 'couteau', alt: 'poignard' },
  { id: 'metal_tube', type: 'inventory', ref: 'tube metallique', alt: 'tuyau' },
  { id: 'datapad', type: 'inventory', ref: 'datapad', alt: 'tablette' },
  { id: 'duct_tape', type: 'location', ref: 'ruban adhesif', alt: 'chatterton' },
  { id: 'cable', type: 'location', ref: 'cable', alt: 'fil' },
  { id: 'scanner', type: 'location', ref: 'scanner', alt: 'detecteur' },
  { id: 'flashlight', type: 'location', ref: 'lampe torche', alt: 'lampe' },
  { id: 'multitool', type: 'location', ref: 'multitool', alt: 'pince' },
  { id: 'security_robot', type: 'npc', ref: 'robot securite', alt: 'sentinelle' },
  { id: 'xenomorph', type: 'npc', ref: 'xenomorphe', alt: 'alien' },
  { id: 'wounded_android', type: 'npc', ref: 'androide blesse', alt: 'android', accentRef: 'andro\u00EFde blesse' },
  { id: 'parasitized_crewmember', type: 'npc', ref: 'membre equipage parasite', alt: 'infecte' },
  { id: 'station_ai', type: 'npc', ref: 'ia station', alt: 'ordinateur' },
  { id: 'blast_door', type: 'environment', ref: 'porte blindee', alt: 'portail' },
  { id: 'observation_window', type: 'environment', ref: 'baie vitree', alt: 'hublot' },
  { id: 'command_terminal', type: 'environment', ref: 'terminal commande', alt: 'console' },
  { id: 'maintenance_vent', type: 'environment', ref: 'bouche ventilation', alt: 'grille' },
  { id: 'coolant_pipe', type: 'environment', ref: 'conduite refroidissement', alt: 'canalisation' },
  { id: 'access_panel', type: 'environment', ref: 'panneau acces', alt: 'trappe' },
  { id: 'security_camera', type: 'environment', ref: 'camera securite', alt: 'cam', accentRef: 'cam\u00E9ra securit\u00E9' },
  { id: 'main_airlock', type: 'environment', ref: 'sas principal', alt: 'airlock' },
  { id: 'supply_locker', type: 'environment', ref: 'casier ravitaillement', alt: 'armoire' },
  { id: 'exposed_wiring', type: 'environment', ref: 'cablage expose', alt: 'fils' },
  { id: 'corridor_a', type: 'exit', ref: 'couloir', alt: 'corridor' },
  { id: 'sas_b', type: 'exit', ref: 'sas-b', alt: 'airlock' },
  { id: 'infirmerie', type: 'exit', ref: 'infirmerie', alt: 'medbay' },
];

const PART_ALIAS_TO_ID: Readonly<Record<string, string>> = {
  tete: 'head',
  bras: 'arm',
  jambe: 'leg',
  griffe: 'claw',
  queue: 'tail',
  antenne: 'antenna',
  torse: 'torso',
};

function buildDefaultScene(): SceneContext {
  const itemIds = ITEM_LIST.map((item) => item.id);
  const inventory: ResolvedTarget[] = itemIds.slice(0, 5).flatMap((id) => {
    const def = ITEM_DEFINITIONS[id];
    if (!def) return [];
    return [{
      id,
      nameKey: def.nameKey,
      properties: resolveItemProperties(id),
      isVirtual: false,
      source: 'inventory' as const,
      aliases: [...getEntityAliases(def.aliasesKey, def.nameKey), ...id.replace(/_/g, ' ').split(' ')],
    }];
  });
  const locationItems: ResolvedTarget[] = itemIds.slice(5, 10).flatMap((id) => {
    const def = ITEM_DEFINITIONS[id];
    if (!def) return [];
    return [{
      id,
      nameKey: def.nameKey,
      properties: resolveItemProperties(id),
      isVirtual: false,
      source: 'location' as const,
      aliases: [...getEntityAliases(def.aliasesKey, def.nameKey), ...id.replace(/_/g, ' ').split(' ')],
    }];
  });
  const npcs: NpcInstance[] = NPC_LIST.flatMap((n) => {
    const def = NPC_DEFINITIONS[n.id];
    if (!def) return [];
    return [{
      id: n.id,
      definitionId: n.id,
      nameKey: def.nameKey,
      aliases: [...getEntityAliases(def.aliasesKey, def.nameKey), ...n.id.replace(/_/g, ' ').split(' ')],
      properties: resolveNPCProperties(n.id),
      hp: def.hp,
    }];
  });
  const environmentFeatures: EnvironmentFeatureInstance[] = ENVIRONMENT_FEATURE_LIST.flatMap((f) => {
    const def = ENVIRONMENT_FEATURE_DEFINITIONS[f.id];
    if (!def) return [];
    return [{
      id: f.id,
      definitionId: f.id,
      nameKey: def.nameKey,
      aliases: [...getEntityAliases(def.aliasesKey, def.nameKey), ...f.id.replace(/_/g, ' ').split(' ')],
      properties: resolveEnvironmentProperties(f.id),
    }];
  });
  const bodyParts: BodyPartDefinition[] = [...BODY_PARTS.entries()].map(([, def]) => ({
    id: def.id,
    nameKey: def.nameKey,
    aliases: getEntityAliases(`${def.nameKey}.aliases` as import('../../../src/i18n/types').StringKey, def.nameKey as import('../../../src/i18n/types').StringKey),
    baseProperties: [...def.baseProperties],
  }));
  return {
    inventory,
    locationItems,
    npcs,
    environmentFeatures,
    connectedLocations: [
      { id: 'corridor_a', aliases: ['corridor', 'couloir'] },
      { id: 'sas_b', aliases: ['sas', 'airlock', 'sas-b'] },
      { id: 'infirmerie', aliases: ['infirmerie', 'medbay'] },
    ],
    suggestions: [],
    environmentConditions: [],
    bodyParts,
  };
}

function typoMutatePhrase(text: string): string {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return text;
  let idx = 0;
  for (let i = 1; i < words.length; i++) if (words[i]!.length > words[idx]!.length) idx = i;
  const base = words[idx]!;
  if (base.length <= 3) return text;
  const cut = Math.max(1, Math.floor(base.length / 2));
  words[idx] = `${base.slice(0, cut)}${base.slice(cut + 1)}`;
  return words.join(' ');
}

function percentile(values: readonly number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor((pct / 100) * sorted.length)));
  return sorted[i] ?? 0;
}

function highestSeverity(findings: readonly Finding[]): Severity | null {
  if (findings.length === 0) return null;
  return [...findings].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0]?.severity ?? null;
}

function expectationToString(exp: CaseExpectation): string {
  const parts: string[] = [];
  if (exp.verbs?.length) parts.push(`verb in [${exp.verbs.join(', ')}]`);
  if (exp.targetId) parts.push(`target=${exp.targetId}`);
  if (exp.targetSource) parts.push(`source=${exp.targetSource}`);
  if (exp.expectReformulation) parts.push('reformulation=true');
  if (exp.expectCompound) parts.push('compound=true');
  if (exp.expectBodyPart) parts.push('bodypart=true');
  if (exp.negatedVerb) parts.push(`negated!=${exp.negatedVerb}`);
  if (exp.multiIntentSecondVerb) parts.push(`secondary=${exp.multiIntentSecondVerb}`);
  if (exp.requireNonAbstract) parts.push('non-abstract');
  return parts.join('; ');
}

function buildCases(): CampaignCase[] {
  const out: CampaignCase[] = [];
  let n = 1;
  const add = (c: Omit<CampaignCase, 'id'>): void => {
    out.push({ id: `C${String(n).padStart(4, '0')}`, ...c });
    n += 1;
  };
  const addElem = (
    e: ElementDescriptor,
    category: string,
    subcategory: string,
    input: string,
    expectation: CaseExpectation,
    clearIntent = true,
  ): void => add({ input, category, subcategory, clearIntent, expectation, elementId: e.id, elementType: e.type });

  const addEdges = (e: ElementDescriptor): void => {
    const ref = e.ref;
    const accent = e.accentRef ?? e.ref;
    const hyphen = ref.replace(/\s+/g, '-');
    const typoTarget = typoMutatePhrase(ref);
    if (e.type === 'exit') {
      addElem(e, 'element_edge', 'polite', `s'il te plait, va vers ${accent}`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_edge', 'whitespace', `   aller    ${ref}    `, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_edge', 'punct_hyphen', `!!! aller---${hyphen} ???`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_edge', 'typo_verb', `allerr ${ref}`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_edge', 'typo_target', `aller ${typoTarget}`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_edge', 'negation', `ne pas aller ${ref}`, { targetId: e.id, targetSource: 'connected_location', negatedVerb: 'MOVE_TO', requireNonAbstract: true });
      addElem(e, 'element_edge', 'multi_intent', `aller ${ref} puis attendre`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', multiIntentSecondVerb: 'WAIT', requireNonAbstract: true });
      return;
    }
    addElem(e, 'element_edge', 'polite', `s'il te plait, examine ${accent}, merci`, { verbs: ['EXAMINE'], targetId: e.id, requireNonAbstract: true });
    addElem(e, 'element_edge', 'whitespace', `   inspecte    ${ref}    `, { verbs: ['EXAMINE'], targetId: e.id, requireNonAbstract: true });
    addElem(e, 'element_edge', 'punct_hyphen', `!!! regarde---${hyphen} ???`, { verbs: ['EXAMINE'], targetId: e.id, requireNonAbstract: true });
    addElem(e, 'element_edge', 'typo_verb', `examner ${ref}`, { verbs: ['EXAMINE'], targetId: e.id, requireNonAbstract: true });
    addElem(e, 'element_edge', 'typo_target', `examiner ${typoTarget}`, { verbs: ['EXAMINE'], targetId: e.id, requireNonAbstract: true });
    addElem(e, 'element_edge', 'negation', `ne pas toucher ${ref}`, { targetId: e.id, negatedVerb: 'TOUCH', requireNonAbstract: true });
    addElem(e, 'element_edge', 'multi_intent', `examiner ${ref} puis toucher ${ref}`, { verbs: ['EXAMINE'], targetId: e.id, multiIntentSecondVerb: 'TOUCH', requireNonAbstract: true });
  };

  for (const e of ELEMENTS) {
    if (e.type === 'npc') {
      addElem(e, 'element_typical', 'combat', `frappe ${e.ref}`, { verbs: ['STRIKE'], targetId: e.id, targetSource: 'npc', requireNonAbstract: true });
      addElem(e, 'element_typical', 'combat_synonym', `attaque ${e.ref}`, { verbs: ['STRIKE'], targetId: e.id, targetSource: 'npc', requireNonAbstract: true });
      addElem(e, 'element_typical', 'compound_shoot', `tirer sur ${e.ref}`, { verbs: ['SHOOT'], targetId: e.id, targetSource: 'npc', expectCompound: true, requireNonAbstract: true });
      addElem(e, 'element_typical', 'inspection', `examine ${e.ref}`, { verbs: ['EXAMINE'], targetId: e.id, targetSource: 'npc', requireNonAbstract: true });
      addElem(e, 'element_typical', 'talk', `parle ${e.ref}`, { verbs: ['TALK'], targetId: e.id, targetSource: 'npc', requireNonAbstract: true });
      addElem(e, 'element_typical', 'intimidate', `menace ${e.ref}`, { verbs: ['INTIMIDATE'], targetId: e.id, targetSource: 'npc', requireNonAbstract: true });
      addElem(e, 'element_typical', 'interrogate', `interroge ${e.ref}`, { verbs: ['INTERROGATE'], targetId: e.id, targetSource: 'npc', requireNonAbstract: true });
      addElem(e, 'element_typical', 'tie', `attache ${e.ref}`, { verbs: ['TIE'], targetId: e.id, targetSource: 'npc', requireNonAbstract: true });
      addEdges(e);
      continue;
    }
    if (e.type === 'environment') {
      addElem(e, 'element_typical', 'inspection', `examine ${e.ref}`, { verbs: ['EXAMINE'], targetId: e.id, targetSource: 'environment', requireNonAbstract: true });
      addElem(e, 'element_typical', 'inspect_synonym', `inspecte ${e.ref}`, { verbs: ['EXAMINE'], targetId: e.id, targetSource: 'environment', requireNonAbstract: true });
      addElem(e, 'element_typical', 'touch', `touche ${e.ref}`, { verbs: ['TOUCH'], targetId: e.id, targetSource: 'environment', requireNonAbstract: true });
      addElem(e, 'element_typical', 'open', `ouvre ${e.ref}`, { verbs: ['OPEN', 'UNLOCK'], targetId: e.id, targetSource: 'environment', requireNonAbstract: true });
      addElem(e, 'element_typical', 'close', `ferme ${e.ref}`, { verbs: ['CLOSE', 'LOCK'], targetId: e.id, targetSource: 'environment', requireNonAbstract: true });
      addElem(e, 'element_typical', 'hack', `pirate ${e.ref}`, { verbs: ['HACK'], targetId: e.id, targetSource: 'environment', requireNonAbstract: true });
      addElem(e, 'element_typical', 'deactivate', `desactive ${e.ref}`, { verbs: ['DEACTIVATE'], targetId: e.id, targetSource: 'environment', requireNonAbstract: true });
      addElem(e, 'element_typical', 'sabotage', `sabote ${e.ref}`, { verbs: ['SABOTAGE'], targetId: e.id, targetSource: 'environment', requireNonAbstract: true });
      addEdges(e);
      continue;
    }
    if (e.type === 'exit') {
      addElem(e, 'element_typical', 'go_verb', `vais ${e.ref}`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_typical', 'go_infinitive', `aller ${e.ref}`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_typical', 'compound_move', `se deplacer vers ${e.ref}`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', expectCompound: true, requireNonAbstract: true });
      addElem(e, 'element_typical', 'compound_rendre', `se rendre ${e.ref}`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', expectCompound: true, requireNonAbstract: true });
      addElem(e, 'element_typical', 'run', `cours vers ${e.ref}`, { verbs: ['RUN'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_typical', 'flee', `fuis vers ${e.ref}`, { verbs: ['RUN'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_typical', 'climb', `grimpe vers ${e.ref}`, { verbs: ['CLIMB'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addElem(e, 'element_typical', 'move_synonym', `deplace toi vers ${e.ref}`, { verbs: ['MOVE_TO'], targetId: e.id, targetSource: 'connected_location', requireNonAbstract: true });
      addEdges(e);
      continue;
    }
    addElem(e, 'element_typical', 'inspection', `examine ${e.ref}`, { verbs: ['EXAMINE'], targetId: e.id, targetSource: e.type, requireNonAbstract: true });
    addElem(e, 'element_typical', 'inspect_synonym', `inspecte ${e.ref}`, { verbs: ['EXAMINE'], targetId: e.id, targetSource: e.type, requireNonAbstract: true });
    addElem(e, 'element_typical', 'use', `utilise ${e.ref}`, { verbs: ['USE'], targetId: e.id, targetSource: e.type, requireNonAbstract: true });
    addElem(e, 'element_typical', 'touch', `touche ${e.ref}`, { verbs: ['TOUCH'], targetId: e.id, targetSource: e.type, requireNonAbstract: true });
    addElem(e, 'element_typical', 'take', `prends ${e.ref}`, { verbs: ['TAKE'], targetId: e.id, targetSource: e.type, requireNonAbstract: true });
    addElem(e, 'element_typical', 'throw', `lance ${e.ref}`, { verbs: ['THROW'], targetId: e.id, targetSource: e.type, requireNonAbstract: true });
    addElem(e, 'element_typical', 'scan', `scanne ${e.ref}`, { verbs: ['SCAN'], targetId: e.id, targetSource: e.type, requireNonAbstract: true });
    addElem(e, 'element_typical', 'repair', `repare ${e.ref}`, { verbs: ['REPAIR'], targetId: e.id, targetSource: e.type, requireNonAbstract: true });
    addEdges(e);
  }

  const npcParts: Readonly<Record<string, readonly string[]>> = {
    security_robot: ['tete', 'bras', 'torse', 'antenne'],
    xenomorph: ['tete', 'griffe', 'queue', 'torse'],
    wounded_android: ['tete', 'bras', 'torse'],
    parasitized_crewmember: ['tete', 'bras', 'jambe', 'torse'],
    station_ai: ['antenne', 'torse'],
  };
  for (const [npcId, partAliases] of Object.entries(npcParts)) {
    const npc = ELEMENTS.find((e) => e.id === npcId);
    if (!npc) continue;
    for (const partAlias of partAliases) {
      const partId = PART_ALIAS_TO_ID[partAlias];
      if (!partId) continue;
      add({ input: `frappe la ${partAlias} de ${npc.ref}`, category: 'body_part', subcategory: 'strike', clearIntent: true, elementId: npcId, elementType: 'npc', expectation: { verbs: ['STRIKE'], targetId: `${npcId}_${partId}`, targetSource: 'npc_part', expectBodyPart: true, requireNonAbstract: true } });
      add({ input: `tirer sur la ${partAlias} de ${npc.ref}`, category: 'body_part', subcategory: 'compound_shoot', clearIntent: true, elementId: npcId, elementType: 'npc', expectation: { verbs: ['SHOOT'], targetId: `${npcId}_${partId}`, targetSource: 'npc_part', expectBodyPart: true, expectCompound: true, requireNonAbstract: true } });
      add({ input: `coupe la ${partAlias} de ${npc.ref}`, category: 'body_part', subcategory: 'cut', clearIntent: true, elementId: npcId, elementType: 'npc', expectation: { verbs: ['CUT'], targetId: `${npcId}_${partId}`, targetSource: 'npc_part', expectBodyPart: true, requireNonAbstract: true } });
    }
  }

  const extras: readonly Omit<CampaignCase, 'id'>[] = [
    { input: 'exam robot securite', category: 'prefix', subcategory: 'verb_prefix', clearIntent: true, elementId: 'security_robot', elementType: 'npc', expectation: { verbs: ['EXAMINE'], targetId: 'security_robot', targetSource: 'npc', requireNonAbstract: true } },
    { input: 'interro robot securite', category: 'prefix', subcategory: 'verb_prefix', clearIntent: true, elementId: 'security_robot', elementType: 'npc', expectation: { verbs: ['INTERROGATE'], targetId: 'security_robot', targetSource: 'npc', requireNonAbstract: true } },
    { input: 'deverroui panneau acces', category: 'prefix', subcategory: 'verb_prefix', clearIntent: true, elementId: 'access_panel', elementType: 'environment', expectation: { verbs: ['UNLOCK'], targetId: 'access_panel', targetSource: 'environment', requireNonAbstract: true } },
    { input: 'pirat terminal commande', category: 'prefix', subcategory: 'verb_prefix', clearIntent: true, elementId: 'command_terminal', elementType: 'environment', expectation: { verbs: ['HACK'], targetId: 'command_terminal', targetSource: 'environment', requireNonAbstract: true } },
    { input: 'scann camera securite', category: 'prefix', subcategory: 'verb_prefix', clearIntent: true, elementId: 'security_camera', elementType: 'environment', expectation: { verbs: ['SCAN'], targetId: 'security_camera', targetSource: 'environment', requireNonAbstract: true } },
    { input: 'mate le robot securite', category: 'slang', subcategory: 'inspect_slang', clearIntent: true, elementId: 'security_robot', elementType: 'npc', expectation: { verbs: ['EXAMINE'], targetId: 'security_robot', targetSource: 'npc', requireNonAbstract: true } },
    { input: 'defonce la porte blindee', category: 'slang', subcategory: 'break_slang', clearIntent: true, elementId: 'blast_door', elementType: 'environment', expectation: { verbs: ['BREAK'], targetId: 'blast_door', targetSource: 'environment', requireNonAbstract: true } },
    { input: 'papote avec ia station', category: 'slang', subcategory: 'talk_slang', clearIntent: true, elementId: 'station_ai', elementType: 'npc', expectation: { verbs: ['TALK'], targetId: 'station_ai', targetSource: 'npc', requireNonAbstract: true } },
    { input: 'foutre le feu cablage expose', category: 'slang', subcategory: 'ignite_slang', clearIntent: true, elementId: 'exposed_wiring', elementType: 'environment', expectation: { verbs: ['IGNITE'], targetId: 'exposed_wiring', targetSource: 'environment', requireNonAbstract: true } },
    { input: 'examiner la cam\u00E9ra s\u00E9curit\u00E9', category: 'orthography', subcategory: 'accented_target', clearIntent: true, elementId: 'security_camera', elementType: 'environment', expectation: { verbs: ['EXAMINE'], targetId: 'security_camera', targetSource: 'environment', requireNonAbstract: true } },
    { input: "tirer sur l'alien", category: 'orthography', subcategory: 'apostrophe', clearIntent: true, elementId: 'xenomorph', elementType: 'npc', expectation: { verbs: ['SHOOT'], targetId: 'xenomorph', targetSource: 'npc', expectCompound: true, requireNonAbstract: true } },
    { input: 'parler a l\u2019andro\u00EFde blesse', category: 'orthography', subcategory: 'unicode_apostrophe', clearIntent: true, elementId: 'wounded_android', elementType: 'npc', expectation: { verbs: ['TALK'], targetId: 'wounded_android', targetSource: 'npc', requireNonAbstract: true } },
    { input: 'aller sas-b puis attendre', category: 'multi_intent', subcategory: 'move_then_wait', clearIntent: true, elementId: 'sas_b', elementType: 'exit', expectation: { verbs: ['MOVE_TO'], targetId: 'sas_b', targetSource: 'connected_location', multiIntentSecondVerb: 'WAIT', requireNonAbstract: true } },
    { input: 'tirer sur robot securite puis courir vers couloir', category: 'multi_intent', subcategory: 'combat_then_move', clearIntent: true, elementId: 'security_robot', elementType: 'npc', expectation: { verbs: ['SHOOT'], targetId: 'security_robot', targetSource: 'npc', expectCompound: true, multiIntentSecondVerb: 'RUN', requireNonAbstract: true } },
  ];
  for (const e of extras) add(e);

  const gibberish = ['', ' ', '   \t   ', '12345', '00000', '\u{1F916}', '\u{1F525}\u{1F525}', '....', '---', '???', '@@@', 'xyzzy plugh', 'blorb snargle', 'qwerty asdfgh', 'lol', 'mdr', 'abcdefghijk', 'r2d2 c3po'];
  for (const input of gibberish) add({ input, category: 'gibberish', subcategory: 'noise', clearIntent: false, expectation: { expectReformulation: true } });

  for (let i = 0; i < 10; i++) {
    const fill = Array.from({ length: 300 }, (_, j) => `mot${i}_${j}`).join(' ');
    add({ input: `examiner camera securite ${fill}`, category: 'long_input', subcategory: 'prefix_clear', clearIntent: true, elementId: 'security_camera', elementType: 'environment', expectation: { verbs: ['EXAMINE'], targetId: 'security_camera', targetSource: 'environment', requireNonAbstract: true } });
    add({ input: `${fill} tirer sur robot securite`, category: 'long_input', subcategory: 'suffix_clear', clearIntent: true, elementId: 'security_robot', elementType: 'npc', expectation: { verbs: ['SHOOT'], targetId: 'security_robot', targetSource: 'npc', expectCompound: true, requireNonAbstract: true } });
  }

  if (out.length < 500) throw new Error(`Matrix too small: ${out.length}`);
  return out;
}

function actualSummary(result: ReturnType<typeof parseAction> | null, error: string | null): string {
  if (error) return `error=${error}`;
  if (!result) return 'result=null';
  if (isReformulation(result)) {
    const ints = result.interpretations.map((i) => `${i.verb}${i.target ? `->${i.target.id}` : ''}`).join(', ');
    return `reformulation (${ints})`;
  }
  const t = result.target ? `${result.target.id}/${result.target.source}` : 'null';
  return `verb=${result.verb}, target=${t}, strategy=${result.verbMatch.strategy}, conf=${result.verbMatch.confidence.toFixed(2)}`;
}

function evaluate(tc: CampaignCase, result: ReturnType<typeof parseAction> | null, error: string | null): Finding[] {
  const exp = tc.expectation;
  const findings: Finding[] = [];
  const actual = actualSummary(result, error);
  if (error) return [{ severity: 'critical', code: 'PARSE_THROW', expected: expectationToString(exp), actual, whyWrong: 'Parser threw error.' }];
  if (!result) return [{ severity: 'critical', code: 'PARSE_NULL', expected: expectationToString(exp), actual, whyWrong: 'Parser returned null-like result.' }];
  if (exp.expectReformulation) {
    if (!isReformulation(result)) findings.push({ severity: 'medium', code: 'EXPECTED_REFORMULATION', expected: expectationToString(exp), actual, whyWrong: 'Noise-like input should reformulate.' });
    return findings;
  }
  if (isReformulation(result)) {
    if (tc.clearIntent || exp.verbs || exp.targetId) findings.push({ severity: tc.clearIntent ? 'high' : 'medium', code: 'UNEXPECTED_REFORMULATION', expected: expectationToString(exp), actual, whyWrong: 'Clear intent was not parsed into action.' });
    return findings;
  }
  if (exp.verbs?.length && !exp.verbs.includes(result.verb)) findings.push({ severity: tc.clearIntent ? 'high' : 'medium', code: 'WRONG_VERB', expected: expectationToString(exp), actual, whyWrong: 'Wrong verb class for explicit intent.' });
  if (exp.targetId && result.target?.id !== exp.targetId) findings.push({ severity: tc.clearIntent ? 'high' : 'medium', code: 'WRONG_TARGET_ID', expected: expectationToString(exp), actual, whyWrong: 'Wrong resolved entity id.' });
  if (exp.targetSource && result.target?.source !== exp.targetSource) findings.push({ severity: tc.clearIntent ? 'high' : 'medium', code: 'WRONG_TARGET_SOURCE', expected: expectationToString(exp), actual, whyWrong: 'Wrong resolved target source.' });
  if (exp.expectBodyPart && result.target?.source !== 'npc_part') findings.push({ severity: 'high', code: 'BODY_PART_NOT_RESOLVED', expected: expectationToString(exp), actual, whyWrong: 'Explicit body part did not resolve to npc_part.' });
  if (exp.expectCompound && !result.verbMatch.isCompound) findings.push({ severity: 'medium', code: 'COMPOUND_NOT_DETECTED', expected: expectationToString(exp), actual, whyWrong: 'Compound intent missed by compound strategy.' });
  if (exp.requireNonAbstract && result.target?.source === 'abstract') findings.push({ severity: tc.clearIntent ? 'high' : 'medium', code: 'ABSTRACT_FALLBACK_ON_KNOWN_ENTITY', expected: expectationToString(exp), actual, whyWrong: 'Known entity collapsed to abstract target.' });
  if (exp.negatedVerb && result.verb === exp.negatedVerb) findings.push({ severity: 'medium', code: 'NEGATION_IGNORED', expected: expectationToString(exp), actual, whyWrong: 'Negation words were ignored.' });
  if (exp.multiIntentSecondVerb) findings.push({ severity: 'medium', code: 'MULTI_INTENT_SECONDARY_DROPPED', expected: expectationToString(exp), actual, whyWrong: 'Secondary intent in chain was dropped.' });
  if (tc.clearIntent && result.verbMatch.strategy === 6 && result.verbMatch.confidence <= 0.4) findings.push({ severity: 'medium', code: 'LOW_CONFIDENCE_FALLBACK', expected: expectationToString(exp), actual, whyWrong: 'Semantic fallback selected on clear intent.' });
  if (tc.clearIntent && (exp.verbs?.includes(result.verb) ?? false) && result.verbMatch.confidence < 0.6) findings.push({ severity: 'medium', code: 'SUSPICIOUS_LOW_CONFIDENCE', expected: expectationToString(exp), actual, whyWrong: 'Expected verb matched but confidence is low.' });
  return findings;
}

function toResult(tc: CampaignCase, parseMs: number, parsed: ReturnType<typeof parseAction> | null, error: string | null, findings: readonly Finding[]): CaseResult {
  const severity = highestSeverity(findings);
  const passed = findings.length === 0;
  if (error || !parsed) {
    return { id: tc.id, input: tc.input, category: tc.category, subcategory: tc.subcategory, elementId: tc.elementId ?? null, elementType: tc.elementType ?? null, clearIntent: tc.clearIntent, expected: tc.expectation, verbOrReformulation: 'error', verb: null, isReformulation: false, targetId: null, targetSource: null, strategy: null, confidence: null, isCompound: null, tokens: [], parseMs, findings, severity, passed, error };
  }
  if (isReformulation(parsed)) {
    return { id: tc.id, input: tc.input, category: tc.category, subcategory: tc.subcategory, elementId: tc.elementId ?? null, elementType: tc.elementType ?? null, clearIntent: tc.clearIntent, expected: tc.expectation, verbOrReformulation: 'reformulation', verb: null, isReformulation: true, targetId: null, targetSource: null, strategy: null, confidence: null, isCompound: null, tokens: [], parseMs, findings, severity, passed, error: null };
  }
  return { id: tc.id, input: tc.input, category: tc.category, subcategory: tc.subcategory, elementId: tc.elementId ?? null, elementType: tc.elementType ?? null, clearIntent: tc.clearIntent, expected: tc.expectation, verbOrReformulation: parsed.verb, verb: parsed.verb, isReformulation: false, targetId: parsed.target?.id ?? null, targetSource: parsed.target?.source ?? null, strategy: parsed.verbMatch.strategy, confidence: parsed.verbMatch.confidence, isCompound: parsed.verbMatch.isCompound, tokens: parsed.tokens, parseMs, findings, severity, passed, error: null };
}

function summarize(results: readonly CaseResult[]) {
  const parseTimes = results.map((r) => r.parseMs);
  const mean = parseTimes.reduce((a, b) => a + b, 0) / Math.max(1, parseTimes.length);
  const variance = parseTimes.reduce((a, b) => a + ((b - mean) ** 2), 0) / Math.max(1, parseTimes.length);
  const stdev = Math.sqrt(variance);
  const p95 = percentile(parseTimes, 95);
  const outlierThreshold = Math.max(8, p95 * 2, mean + (3 * stdev));
  const sev: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of results) if (r.severity) sev[r.severity] += 1;
  return {
    totalCases: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    reformulations: results.filter((r) => r.isReformulation).length,
    avgParseMs: mean,
    maxParseMs: parseTimes.length ? Math.max(...parseTimes) : 0,
    p95ParseMs: p95,
    outlierThresholdMs: outlierThreshold,
    severityCounts: sev,
  };
}

function markOutliers(results: CaseResult[], threshold: number): void {
  for (let i = 0; i < results.length; i++) {
    const r = results[i]!;
    if (r.parseMs <= threshold) continue;
    const outlierFinding: Finding = { severity: 'medium', code: 'PARSE_TIME_OUTLIER', expected: `<=${threshold.toFixed(3)}ms`, actual: `${r.parseMs.toFixed(3)}ms`, whyWrong: 'Parse time outlier.' };
    const findings = [...r.findings, outlierFinding];
    results[i] = { ...r, findings, passed: false, severity: highestSeverity(findings) };
  }
}

function buildReport(summary: ReturnType<typeof summarize>, results: readonly CaseResult[]): string {
  const failures = results.filter((r) => !r.passed).sort((a, b) => (SEVERITY_RANK[b.severity ?? 'low'] - SEVERITY_RANK[a.severity ?? 'low']) || (b.parseMs - a.parseMs));
  const top20 = failures.slice(0, 20);
  const lines: string[] = [];
  lines.push('# Deep Parser Campaign Report', '', '## Summary');
  lines.push(`- Total cases: ${summary.totalCases}`, `- Passed: ${summary.passed}`, `- Failed: ${summary.failed}`, `- Reformulations: ${summary.reformulations}`, `- Avg parse time: ${summary.avgParseMs.toFixed(4)}ms`, `- Max parse time: ${summary.maxParseMs.toFixed(4)}ms`, `- P95 parse time: ${summary.p95ParseMs.toFixed(4)}ms`, `- Outlier threshold: ${summary.outlierThresholdMs.toFixed(4)}ms`, '');
  lines.push('## Severity Counts', `- Critical: ${summary.severityCounts.critical}`, `- High: ${summary.severityCounts.high}`, `- Medium: ${summary.severityCounts.medium}`, `- Low: ${summary.severityCounts.low}`, '');
  lines.push('## Top 20 Failing Cases', '| Rank | Case | Severity | Input | Expected | Actual | Why wrong |', '| --- | --- | --- | --- | --- | --- | --- |');
  for (let i = 0; i < top20.length; i++) {
    const r = top20[i]!;
    const f = [...r.findings].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
    lines.push(`| ${i + 1} | ${r.id} | ${f?.severity ?? ''} | \`${r.input.replace(/\|/g, '\\|')}\` | ${f?.expected ?? ''} | ${f?.actual ?? ''} | ${f?.whyWrong ?? ''} |`);
  }
  lines.push('', '## Re-run Failing Cases', '- Command: `npx tsx tests/playtest/reports/deepParserCampaign.ts --only-failing`', '- Script: `tests/playtest/reports/rerun-failing-cases.cmd`', '- Script: `tests/playtest/reports/rerun-failing-cases.ps1`', '', '## Root-Cause Pointers');
  lines.push('- `src/engine/resolver.ts:74` token score partial/prefix matching can collide aliases.');
  lines.push('- `src/engine/resolver.ts:283` NPC resolution precedes environment (`src/engine/resolver.ts:306`), causing camera/security conflicts.');
  lines.push('- `src/engine/parser.ts:27` negation tokens (`ne`, `pas`) are removed by stop-word filtering (`src/engine/parser.ts:70`).');
  lines.push('- `src/engine/parser.ts:723` parser emits a single action, so chained intents are dropped.');
  lines.push('- `src/engine/parser.ts:593` prefix strategy can over-accept typo/prefix verbs.');
  lines.push('', '## Artifacts', `- Matrix: \`${path.relative(process.cwd(), MATRIX_PATH)}\``, `- Results: \`${path.relative(process.cwd(), RESULTS_PATH)}\``, `- Failures: \`${path.relative(process.cwd(), FAILURES_PATH)}\``, `- Summary: \`${path.relative(process.cwd(), SUMMARY_PATH)}\``);
  return `${lines.join('\n')}\n`;
}

function main(): void {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const onlyFailing = process.argv.includes('--only-failing');
  const scene = buildDefaultScene();
  const allCases = buildCases();
  fs.writeFileSync(MATRIX_PATH, JSON.stringify(allCases, null, 2), 'utf8');
  const failIds = (onlyFailing && fs.existsSync(FAILING_IDS_PATH)) ? new Set(JSON.parse(fs.readFileSync(FAILING_IDS_PATH, 'utf8')) as string[]) : null;
  const cases = failIds ? allCases.filter((c) => failIds.has(c.id)) : allCases;
  const activeCases = cases.length > 0 ? cases : allCases;
  const results: CaseResult[] = [];
  for (const tc of activeCases) {
    let parsed: ReturnType<typeof parseAction> | null = null;
    let err: string | null = null;
    const start = performance.now();
    try { parsed = parseAction(tc.input, scene); } catch (e) { err = e instanceof Error ? e.stack ?? e.message : String(e); }
    const parseMs = performance.now() - start;
    const findings = evaluate(tc, parsed, err);
    results.push(toResult(tc, parseMs, parsed, err, findings));
  }
  const firstSummary = summarize(results);
  markOutliers(results, firstSummary.outlierThresholdMs);
  const summary = summarize(results);
  const failures = results.filter((r) => !r.passed);
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf8');
  fs.writeFileSync(FAILURES_PATH, JSON.stringify(failures, null, 2), 'utf8');
  fs.writeFileSync(FAILING_IDS_PATH, JSON.stringify(failures.map((f) => f.id), null, 2), 'utf8');
  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');
  fs.writeFileSync(REPORT_MD_PATH, buildReport(summary, results), 'utf8');
  fs.writeFileSync(RERUN_CMD_PATH, '@echo off\r\nnpx tsx tests/playtest/reports/deepParserCampaign.ts --only-failing\r\n', 'utf8');
  fs.writeFileSync(RERUN_PS1_PATH, 'npx tsx tests/playtest/reports/deepParserCampaign.ts --only-failing\n', 'utf8');
  console.log(`Campaign mode: ${onlyFailing ? 'only-failing' : 'full'}`);
  console.log(`Total cases run: ${results.length}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Reformulations: ${summary.reformulations}`);
  console.log(`Avg parse ms: ${summary.avgParseMs.toFixed(4)}`);
  console.log(`Max parse ms: ${summary.maxParseMs.toFixed(4)}`);
  console.log(`Results: ${path.relative(process.cwd(), RESULTS_PATH)}`);
  console.log(`Report: ${path.relative(process.cwd(), REPORT_MD_PATH)}`);
}

main();
