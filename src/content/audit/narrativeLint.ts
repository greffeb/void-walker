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
import type { VerbId } from '../../engine/verbs';
import { isEnrichedFeature, isEnrichedItem } from '../../engine/scenario';
import { makeEntityState, applyStateToken, stateMatchesToken } from '../../engine/entityState';
import { pickStateDescription } from '../../engine/featureState';
import { toStateTokens } from '../../engine/interactionResolver';
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

/**
 * Token sequences the engine can apply to ANY environment feature, with no
 * scenario interaction involved: `processTurn` turns a successful OPEN-like verb
 * into a state change directly (see `openingTokensFor`). A description reachable
 * only that way is still reachable.
 */
const GENERIC_OPENINGS: readonly (readonly StateId[])[] = [['open'], ['broken', 'open']];

/** Apply an ordered token list the way setFeatureState does. */
function applyTokens(start: EntityState, tokens: readonly StateId[]): EntityState {
  let s = start;
  for (const tk of tokens) s = applyStateToken(s, tk);
  return s;
}

/**
 * Successes that deliberately leave their target looking the same. A static rule
 * cannot tell a HACK that unlocks from a HACK that merely reads, so each
 * exception is declared here with its reason, the way KNOWN_ORPHANS works. The
 * list may only ever shrink.
 *
 * Keyed by the flag the interaction sets, which is unique per interaction.
 */
const UNCHANGED_BY_DESIGN: Readonly<Record<string, string>> = {
  manifest_hacked:               'étend l\'accès aux logs ; le terminal affiche toujours le manifeste',
  safe_scanned:                  'le scanner révèle un double-fond ; le coffre reste verrouillé',
  ai_scan_revealed:              'le scanner lit un flux ; le nœud tourne toujours',
  reactor_sabotage_confirmed:    'le scanner confirme un sabotage ; le réacteur est inchangé',
  node_a_exposed:                'dévisse un panneau ; le nœud reste actif, rien de visible ne bouge',
  camera_evidence_found:         'consulte les archives caméra ; le terminal réparé reste réparé',
  classified_evidence_recovered: 'récupère des fichiers supprimés ; l\'écran est le même',
  vasquez_location_found:        'perce une couche de chiffrement ; l\'écran est le même',
  override_admin_access:         'étape 1 du protocole en 2 étapes ; le terminal attend encore l\'étape 2',
  evidence_transmitted:          'la balise transmet ; c\'est la victoire, pas un changement d\'état',
  ai_safe_mode:                  'neutralise l\'IA, pas le terminal qui sert à la neutraliser',
};

/**
 * Verbs that only look. Learning something about an object is not changing it,
 * so these may set a flag without touching the object's state.
 */
const OBSERVING_VERBS: ReadonlySet<VerbId> = new Set<VerbId>([
  'EXAMINE', 'SCAN', 'READ', 'LISTEN', 'SMELL', 'TALK', 'INTERROGATE',
]);

/** True when at least one verb on the trigger acts on the world. */
function triggerActs(verb: VerbId | readonly VerbId[]): boolean {
  const verbs = typeof verb === 'string' ? [verb] : verb;
  return verbs.some(v => !OBSERVING_VERBS.has(v));
}

/** An interaction edge: applicable only from a state its trigger accepts. */
interface StateEdge {
  readonly requiredState: StateId | undefined;
  readonly tokens: readonly StateId[];
}

function stateEdges(feat: FeatureDefinition): readonly StateEdge[] {
  const edges: StateEdge[] = GENERIC_OPENINGS.map(tokens => ({ requiredState: undefined, tokens }));
  if (!isEnrichedFeature(feat)) return edges;
  // A container whose `contains` have all been taken is marked empty by
  // processTurn's markEmptiedContainers, with no interaction involved.
  if ((feat.contains ?? []).length > 0) {
    edges.push({ requiredState: undefined, tokens: ['empty'] });
  }
  for (const inter of feat.interactions ?? []) {
    for (const res of [inter.onSuccess, inter.onFailure]) {
      const tokens = toStateTokens(res?.newState);
      if (tokens.length > 0) edges.push({ requiredState: inter.trigger.requiredState, tokens });
    }
  }
  return edges;
}

/**
 * Every state the player can actually put this feature into, by walking the
 * interaction graph from the initial state. Honouring `requiredState` matters:
 * an unlock gated on `requiredState: 'locked'` stops being available once the
 * feature is open, so composing tokens blindly invents reachable states.
 */
function reachableStates(feat: FeatureDefinition): readonly EntityState[] {
  const edges = stateEdges(feat);
  const start = makeEntityState(feat.initialState);
  const seen = new Map<string, EntityState>([[JSON.stringify(start), start]]);
  const queue: EntityState[] = [start];

  while (queue.length > 0) {
    const state = queue.shift()!;
    for (const edge of edges) {
      if (edge.requiredState !== undefined && !stateMatchesToken(state, edge.requiredState)) continue;
      const next = applyTokens(state, edge.tokens);
      const key = JSON.stringify(next);
      if (seen.has(key)) continue;
      seen.set(key, next);
      queue.push(next);
    }
  }
  return [...seen.values()];
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
  const reachable = new Set<string>();
  for (const state of reachableStates(feat)) {
    const d = pickStateDescription(descriptions, state);
    if (d) reachable.add(d.fr);
  }
  for (const [state, ls] of entries) {
    if (!reachable.has(ls.fr)) {
      out.push({ rule: 'R7_etat_inatteignable', where, entity: `${feat.id}.${state}`, detail: 'jamais affichable' });
    }
  }

  // R8 — a success that changes the object but leaves it looking untouched.
  //
  // Scoped deliberately. Only successes: a failed attempt that changes nothing
  // is correct, and `onFailure` flags like `hack_attempt_logged` record the
  // attempt, not a change. And only verbs that act: reading a log or scanning a
  // safe teaches the player something without altering the thing, so those
  // legitimately set a flag and no state.
  if (isEnrichedFeature(feat) && entries.length >= 2) {
    for (const inter of feat.interactions ?? []) {
      const res = inter.onSuccess;
      if (res.flagSet === undefined || res.newState !== undefined) continue;
      if (!triggerActs(inter.trigger.verb)) continue;
      if (res.flagSet in UNCHANGED_BY_DESIGN) continue;
      out.push({ rule: 'R8_flag_sans_etat', where, entity: `${feat.id}.onSuccess`, detail: `flagSet=${res.flagSet} sans newState` });
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
    const res = use.interaction.onSuccess;
    if (res.flagSet !== undefined && res.newState === undefined && !(res.flagSet in UNCHANGED_BY_DESIGN)) {
      out.push({
        rule: 'R8_flag_sans_etat',
        where,
        entity: `${item.id}→${use.targetId}.onSuccess`,
        detail: `flagSet=${res.flagSet} sans newState`,
      });
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
