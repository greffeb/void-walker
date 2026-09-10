// ---------------------------------------------------------------------------
// src/content/audit/narrativeLint.ts — Readability rules over scenario text
// ---------------------------------------------------------------------------
// The scene enumeration shows a NAME; the description of a state is what an
// EXAMINE reveals; a node's prose sets the mood. When those roles blur, the
// player reads the same paragraph three times in one turn.
//
// These rules decide, statically, where the roles are blurred. Each returns
// findings rather than throwing, so both the CLI report and the regression
// test read from one implementation.
// ---------------------------------------------------------------------------

import type { CoreSkeleton, ScenarioModule, MicroModule, LocaleString, FeatureDefinition, ItemDefinition } from '../../engine/scenario';
import type { StateId, EntityState } from '../../engine/entityState';
import { isEnrichedFeature, isEnrichedItem } from '../../engine/scenario';
import { makeEntityState, applyStateToken } from '../../engine/entityState';
import { pickStateDescription } from '../../engine/featureState';
import { featureDisplayName, itemDisplayName } from '../featureNames';

export type RuleId =
  | 'R1_nom_redit'
  | 'R2_desc_trop_longue'
  | 'R3_etat_muet'
  | 'R4_noeud_titre'
  | 'R5_noeud_inventaire'
  | 'R6_coaching'
  | 'R7_etat_inatteignable'
  | 'R8_flag_sans_etat'
  | 'R9_sans_nom_fr'
  | 'R10_ponctuation';

export interface Finding {
  readonly rule: RuleId;
  readonly where: string;
  readonly entity: string;
  readonly detail: string;
}

/** Longest a state description may be: it is read on every examine. */
export const MAX_STATE_DESCRIPTION = 200;

/** Phrases that tell the player what to do instead of showing them the room. */
export const COACHING_PATTERNS: readonly RegExp[] = [
  /il suffit de/i,
  /toutes les r[eé]ponses sont/i,
  /premier r[eé]flexe/i,
  /il faudra(it)? (trouver|chercher|pirater|forcer)/i,
  /vous devez (trouver|chercher|atteindre)/i,
  /c'est ici que vous trouverez/i,
  /ne touchez [aà] rien, observez tout/i,
];

// --- text normalisation -----------------------------------------------------

/** Lowercase, strip accents and punctuation: compares meaning, not typography. */
export function normalise(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Overlap of 4-word shingles — catches "said twice in other words". */
export function shingleOverlap(a: string, b: string): number {
  const shingles = (s: string): Set<string> => {
    const words = normalise(s).split(' ').filter(w => w.length > 0);
    const out = new Set<string>();
    for (let i = 0; i + 4 <= words.length; i++) out.add(words.slice(i, i + 4).join(' '));
    return out;
  };
  const sa = shingles(a);
  const sb = shingles(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const sh of sa) if (sb.has(sh)) shared++;
  return shared / Math.min(sa.size, sb.size);
}

// --- feature-level rules ---------------------------------------------------

/** Every state token an interaction on this feature can set. */
function settableTokens(feat: FeatureDefinition): readonly StateId[] {
  if (!isEnrichedFeature(feat)) return [];
  const tokens = new Set<StateId>();
  for (const inter of feat.interactions ?? []) {
    for (const res of [inter.onSuccess, inter.onFailure]) {
      for (const tk of toTokenList(res?.newState)) tokens.add(tk);
    }
  }
  return [...tokens];
}

/** `newState` accepts one token or an ordered list; normalise to a list. */
export function toTokenList(newState: StateId | readonly StateId[] | undefined): readonly StateId[] {
  if (newState === undefined) return [];
  return typeof newState === 'string' ? [newState] : newState;
}

/** Apply an ordered token list the way setFeatureState does. */
function applyTokens(start: EntityState, tokens: readonly StateId[]): EntityState {
  let s = start;
  for (const tk of tokens) s = applyStateToken(s, tk);
  return s;
}

function checkFeature(feat: FeatureDefinition, where: string, siblingNames: readonly string[]): readonly Finding[] {
  const out: Finding[] = [];
  const name = featureDisplayName(feat.id);
  const descriptions = feat.descriptions;

  // R9 — a feature the player can see must have a French name, not an id.
  if (name === null) {
    out.push({ rule: 'R9_sans_nom_fr', where, entity: feat.id, detail: 'aucune clé i18n env.' + feat.id });
  }

  if (!descriptions) return out;
  const entries = Object.entries(descriptions) as readonly [StateId, LocaleString][];

  for (const [state, ls] of entries) {
    const fr = ls?.fr ?? '';
    if (fr.length === 0) continue;

    // R1 — a description must not restate the name the enumeration already gave.
    if (name !== null && normalise(fr).includes(normalise(name))) {
      out.push({ rule: 'R1_nom_redit', where, entity: `${feat.id}.${state}`, detail: `redit « ${name} »` });
    }

    // R2 — length.
    if (fr.length > MAX_STATE_DESCRIPTION) {
      out.push({ rule: 'R2_desc_trop_longue', where, entity: `${feat.id}.${state}`, detail: `${fr.length} > ${MAX_STATE_DESCRIPTION} car.` });
    }

    // R6 — coaching.
    for (const pat of COACHING_PATTERNS) {
      if (pat.test(fr)) {
        out.push({ rule: 'R6_coaching', where, entity: `${feat.id}.${state}`, detail: `« ${pat.source} »` });
        break;
      }
    }

    // R10 — a fragment meant for assembly must not carry a double terminator.
    if (/\.\s*\.|\.\s*,/.test(fr)) {
      out.push({ rule: 'R10_ponctuation', where, entity: `${feat.id}.${state}`, detail: 'ponctuation doublée' });
    }
  }

  // R3 — two states that say the same thing: one of them is not worth a description.
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]!;
      const b = entries[j]!;
      if (shingleOverlap(a[1].fr, b[1].fr) >= 0.8) {
        out.push({ rule: 'R3_etat_muet', where, entity: `${feat.id}.${a[0]}/${b[0]}`, detail: 'états quasi identiques' });
      }
    }
  }

  // R7 — a description the player can never reach.
  const init = makeEntityState(feat.initialState);
  const reachable = new Set<string>();
  const initDesc = pickStateDescription(descriptions, init);
  if (initDesc) reachable.add(initDesc.fr);
  const tokens = settableTokens(feat);
  // Every ordered subset is overkill; every prefix-from-initial plus every
  // single token covers the paths content actually writes.
  for (const tk of tokens) {
    const d = pickStateDescription(descriptions, applyTokens(init, [tk]));
    if (d) reachable.add(d.fr);
    for (const tk2 of tokens) {
      const d2 = pickStateDescription(descriptions, applyTokens(init, [tk, tk2]));
      if (d2) reachable.add(d2.fr);
    }
  }
  for (const [state, ls] of entries) {
    if (!reachable.has(ls.fr)) {
      out.push({ rule: 'R7_etat_inatteignable', where, entity: `${feat.id}.${state}`, detail: 'jamais affichable' });
    }
  }

  // R8 — an interaction that flags progress but leaves the object looking untouched.
  if (isEnrichedFeature(feat) && entries.length >= 2) {
    for (const inter of feat.interactions ?? []) {
      for (const [key, res] of [['onSuccess', inter.onSuccess], ['onFailure', inter.onFailure]] as const) {
        if (res?.flagSet !== undefined && res.newState === undefined) {
          out.push({ rule: 'R8_flag_sans_etat', where, entity: `${feat.id}.${key}`, detail: `flagSet=${res.flagSet} sans newState` });
        }
      }
    }
  }

  void siblingNames;
  return out;
}

// --- item rules ------------------------------------------------------------

/**
 * An item's `useOn` is where a scenario's real progress lives: the data core on
 * the terminal, the keycard on the panel. When such an interaction sets a flag
 * but no state, the world advances while the room keeps describing the old one.
 */
function checkItem(
  item: ItemDefinition,
  where: string,
  featureStateCount: ReadonlyMap<string, number>,
): readonly Finding[] {
  const out: Finding[] = [];
  const name = itemDisplayName(item.id);

  if (name === null) {
    out.push({ rule: 'R9_sans_nom_fr', where, entity: item.id, detail: 'aucune clé i18n item.' + item.id });
  }

  const texts: readonly (readonly [string, string])[] = [
    ['examineResult', item.examineResult?.fr ?? ''],
    ...(isEnrichedItem(item) ? [['description', item.description?.fr ?? ''] as const] : []),
  ];
  for (const [field, fr] of texts) {
    if (fr.length === 0) continue;
    if (name !== null && normalise(fr).includes(normalise(name))) {
      out.push({ rule: 'R1_nom_redit', where, entity: `${item.id}.${field}`, detail: `redit « ${name} »` });
    }
    for (const pat of COACHING_PATTERNS) {
      if (pat.test(fr)) {
        out.push({ rule: 'R6_coaching', where, entity: `${item.id}.${field}`, detail: `« ${pat.source} »` });
        break;
      }
    }
  }

  if (!isEnrichedItem(item)) return out;
  for (const use of item.useOn ?? []) {
    const states = featureStateCount.get(use.targetId) ?? 0;
    if (states < 2) continue;
    for (const [key, res] of [['onSuccess', use.interaction.onSuccess], ['onFailure', use.interaction.onFailure]] as const) {
      if (res?.flagSet !== undefined && res.newState === undefined) {
        out.push({
          rule: 'R8_flag_sans_etat',
          where,
          entity: `${item.id}→${use.targetId}.${key}`,
          detail: `flagSet=${res.flagSet} sans newState`,
        });
      }
    }
  }
  return out;
}

// --- node / skin rules -----------------------------------------------------

function checkNodeProse(fr: string, where: string, entity: string, siblingNames: readonly string[]): readonly Finding[] {
  const out: Finding[] = [];

  // R4 — the prose must not open with its own title: the location name is
  // already printed right before it.
  const titled = /^([^—.]{3,60})\s—\s/.exec(fr);
  if (titled) {
    out.push({ rule: 'R4_noeud_titre', where, entity, detail: `titre en tête : « ${titled[1]!.trim()} »` });
  }

  // R5 — the prose must not inventory the room: the enumeration does that.
  const hay = normalise(fr);
  const named = siblingNames.filter(n => hay.includes(normalise(n)));
  if (named.length > 0) {
    out.push({ rule: 'R5_noeud_inventaire', where, entity, detail: `énumère : ${named.join(', ')}` });
  }

  // R6 — coaching.
  for (const pat of COACHING_PATTERNS) {
    if (pat.test(fr)) {
      out.push({ rule: 'R6_coaching', where, entity, detail: `« ${pat.source} »` });
      break;
    }
  }

  return out;
}

// --- entry point -----------------------------------------------------------

export function lintNarrative(
  skeletons: readonly CoreSkeleton[],
  modules: readonly ScenarioModule[],
  microModules: readonly MicroModule[],
): readonly Finding[] {
  const out: Finding[] = [];

  for (const sk of skeletons) {
    // An item's useOn names a feature by id; R8 needs to know whether that
    // feature has states worth describing.
    const stateCount = new Map<string, number>();
    for (const loc of Object.values(sk.nodeLocations)) {
      for (const f of loc.features) stateCount.set(f.id, Object.keys(f.descriptions ?? {}).length);
    }

    // Feature names per node, so R5 knows what the enumeration will list.
    const namesByNode = new Map<string, readonly string[]>();
    for (const [nodeId, loc] of Object.entries(sk.nodeLocations)) {
      const names = loc.features
        .map(f => featureDisplayName(f.id))
        .filter((n): n is string => n !== null);
      namesByNode.set(nodeId, names);
    }

    for (const node of sk.nodes) {
      out.push(...checkNodeProse(
        node.descriptionKey.fr,
        sk.id,
        `node.${node.id}`,
        namesByNode.get(node.id) ?? [],
      ));
    }

    for (const [nodeId, loc] of Object.entries(sk.nodeLocations)) {
      for (const feat of loc.features) {
        out.push(...checkFeature(feat, sk.id, namesByNode.get(nodeId) ?? []));
      }
      for (const item of loc.items) {
        out.push(...checkItem(item, sk.id, stateCount));
      }
    }
  }

  for (const mod of modules) {
    const stateCount = new Map<string, number>();
    for (const loc of mod.locations) {
      for (const f of loc.features) stateCount.set(f.id, Object.keys(f.descriptions ?? {}).length);
    }
    const names = mod.locations
      .flatMap(l => l.features)
      .map(f => featureDisplayName(f.id))
      .filter((n): n is string => n !== null);

    for (const skin of mod.skins) {
      out.push(...checkNodeProse(skin.entryDescription.fr, `mod:${mod.id}`, `skin.${skin.tension}.entry`, names));
      out.push(...checkNodeProse(skin.revisitDescription.fr, `mod:${mod.id}`, `skin.${skin.tension}.revisit`, names));
    }
    for (const loc of mod.locations) {
      for (const feat of loc.features) {
        out.push(...checkFeature(feat, `mod:${mod.id}`, names));
      }
      for (const item of loc.items ?? []) {
        out.push(...checkItem(item, `mod:${mod.id}`, stateCount));
      }
    }
  }

  for (const mm of microModules) {
    const names = (mm.features ?? [])
      .map(f => featureDisplayName(f.id))
      .filter((n): n is string => n !== null);
    for (const feat of mm.features ?? []) {
      out.push(...checkFeature(feat, `micro:${mm.id}`, names));
    }
    const fr = mm.locale?.fr;
    if (fr?.description) {
      out.push(...checkNodeProse(fr.description, `micro:${mm.id}`, 'locale.description', names));
    }
  }

  return out;
}

/** Findings grouped by rule, for a report or a budget assertion. */
export function countByRule(findings: readonly Finding[]): Readonly<Record<RuleId, number>> {
  const counts: Record<string, number> = {};
  for (const f of findings) counts[f.rule] = (counts[f.rule] ?? 0) + 1;
  return counts as Record<RuleId, number>;
}
