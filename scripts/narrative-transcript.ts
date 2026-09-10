#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// scripts/narrative-transcript.ts — Everything the player can read, dumped
// ---------------------------------------------------------------------------
// Judging readability from TypeScript source is judging the ingredients, not
// the dish. This walks each scenario and writes out the assembled player-facing
// text: the room as it is entered, the enumeration, what an EXAMINE reveals per
// state, and what each interaction says — with the states an interaction can
// reach actually applied, so dead text shows up as dead.
//
// Usage:
//   npx tsx scripts/narrative-transcript.ts              # all skeletons
//   npx tsx scripts/narrative-transcript.ts investigate  # one
// Output: docs/transcripts/<skeleton>.md
// ---------------------------------------------------------------------------

import * as fs from 'node:fs';
import * as path from 'node:path';

import { LAUNCH_SKELETONS } from '../src/content/scenarios/index';
import { ALL_MODULES } from '../src/content/scenarios/modules/index';
import { ALL_MICRO_MODULES } from '../src/content/microModules/index';
import { isEnrichedFeature, isEnrichedItem } from '../src/engine/scenario';
import type { CoreSkeleton, FeatureDefinition, ItemDefinition, LocaleString } from '../src/engine/scenario';
import type { StateId, EntityState } from '../src/engine/entityState';
import { makeEntityState, applyStateToken } from '../src/engine/entityState';
import { pickStateDescription } from '../src/engine/featureState';
import { featureDisplayName, itemDisplayName, displayNameOrId } from '../src/content/featureNames';
import { reachableStates as reachableFeatureStates, triggerActs, UNCHANGED_BY_DESIGN } from '../src/content/audit/narrativeLint';
import { toStateTokens } from '../src/engine/interactionResolver';
import { narrateScene } from '../src/narration/scene';
import { flattenSceneToText } from '../src/stores/sceneHelpers';
import type { SceneDescription } from '../src/engine/types';

const OUT_DIR = path.join(process.cwd(), 'docs', 'transcripts');

function wanted(): readonly CoreSkeleton[] {
  const arg = process.argv[2];
  if (!arg) return LAUNCH_SKELETONS;
  const found = LAUNCH_SKELETONS.filter(s => s.id === arg);
  if (found.length === 0) {
    console.error(`squelette inconnu : ${arg} (connus : ${LAUNCH_SKELETONS.map(s => s.id).join(', ')})`);
    process.exit(1);
  }
  return found;
}

const fr = (ls: LocaleString | undefined): string => ls?.fr ?? '';

/** Compact rendering of the axes an EntityState actually has set. */
function describeState(state: EntityState): string {
  const parts = Object.entries(state)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${String(v)}`);
  return parts.length > 0 ? parts.join(' ') : 'neutre';
}

/**
 * The enumeration exactly as the player reads it — articles, elisions, "ainsi
 * que" and all — by running the real narrator over a synthetic scene. A
 * hand-rolled approximation here would be one more place for the transcript to
 * disagree with the game.
 */
function enumerate(
  features: readonly FeatureDefinition[],
  items: readonly ItemDefinition[],
  exits: readonly string[] = [],
): string {
  const sd: SceneDescription = {
    locationName: '',
    locationDescription: '',
    obstacleHint: null,
    visibleFeatures: features.map(f => ({
      id: f.id,
      name: displayNameOrId(featureDisplayName(f.id), f.id),
      stateDescription: null,
    })),
    visibleItems: items
      .filter(i => i.hidden !== true)
      .map(i => ({ id: i.id, name: displayNameOrId(itemDisplayName(i.id), i.id) })),
    visibleNpcs: [],
    exits: exits.map(name => ({ name, visited: false })),
  };
  const scene = narrateScene(sd, 'revisit', 'fr');
  // Drop the location intro line and the prompt: only the element lines matter.
  return flattenSceneToText(scene, 'full')
    .split('\n')
    .filter(line => line.length > 0 && !line.startsWith('Vous revenez') && !line.startsWith('Que faites'))
    .join('\n');
}

/**
 * Every state the player can reach, labelled. Shares the audit's walker so a
 * `⚠ INATTEIGNABLE` marker here means exactly what the lint means by it.
 */
function reachableStates(feat: FeatureDefinition): readonly { label: string; state: EntityState }[] {
  const init = makeEntityState(feat.initialState);
  const initKey = JSON.stringify(init);
  return reachableFeatureStates(feat).map(state => ({
    label: JSON.stringify(state) === initKey
      ? `initial (${feat.initialState ?? 'défaut'})`
      : 'atteignable',
    state,
  }));
}

function featureSection(feat: FeatureDefinition, indent = ''): string {
  const name = featureDisplayName(feat.id);
  const lines: string[] = [];
  lines.push(`${indent}#### ${name ?? `⚠ SANS NOM (${feat.id})`}  \`${feat.id}\``);
  lines.push('');

  // One row per distinct text the player can actually read. Several state
  // combinations select the same description (a broken door is broken whether it
  // was open or closed), and the generic OPEN/BREAK verbs can reach states the
  // content never wrote text for — the engine narrates the action itself there,
  // so an empty row is not a finding.
  const states = reachableStates(feat);
  const seenText = new Set<string>();
  for (const { label, state } of states) {
    const desc = pickStateDescription(feat.descriptions, state);
    const shown = desc ? desc.fr : fr(feat.examineResult);
    if (shown.length === 0 || seenText.has(shown)) continue;
    seenText.add(shown);
    const source = desc ? 'descriptions' : 'examineResult';
    lines.push(`${indent}- **${label}** · \`${describeState(state)}\` · via \`${source}\``);
    lines.push(`${indent}  > ${shown}`);
  }

  // A description no reachable state selects is text nobody will ever read.
  for (const [st, ls] of Object.entries(feat.descriptions ?? {})) {
    if (!seenText.has(ls.fr)) {
      lines.push(`${indent}- ⚠ **INATTEIGNABLE** \`descriptions.${st}\``);
      lines.push(`${indent}  > ${ls.fr}`);
    }
  }

  if (!isEnrichedFeature(feat)) { lines.push(''); return lines.join('\n'); }

  if (feat.readableContent) {
    lines.push(`${indent}- \`readableContent\` (${feat.readableContent.fr.length} car.)`);
  }
  for (const inter of feat.interactions ?? []) {
    const verbs = Array.isArray(inter.trigger.verb) ? inter.trigger.verb.join('/') : inter.trigger.verb;
    const gates = [
      inter.trigger.requiredState ? `état=${inter.trigger.requiredState}` : null,
      inter.trigger.requiredItem ? `objet=${inter.trigger.requiredItem}` : null,
      inter.trigger.requiredFlag ? `flag=${inter.trigger.requiredFlag}` : null,
      inter.trigger.dc === null ? 'auto' : `DC ${inter.trigger.dc}${inter.trigger.stat ? ' ' + inter.trigger.stat : ''}`,
    ].filter(Boolean).join(', ');
    lines.push(`${indent}- **${verbs}** (${gates})`);
    const flag = inter.onSuccess.flagSet ? ` \`flagSet=${inter.onSuccess.flagSet}\`` : '';
    const suspicious = inter.onSuccess.flagSet !== undefined
      && triggerActs(inter.trigger.verb)
      && Object.keys(feat.descriptions ?? {}).length >= 2
      && !(inter.onSuccess.flagSet in UNCHANGED_BY_DESIGN);
    const st = inter.onSuccess.newState
      ? ` \`newState=${toStateTokens(inter.onSuccess.newState).join('+')}\``
      : (suspicious ? ' ⚠ `sans newState`' : '');
    lines.push(`${indent}  - réussite${st}${flag}`);
    lines.push(`${indent}    > ${fr(inter.onSuccess.narrative) || '(templates génériques)'}`);
    if (inter.onFailure) {
      lines.push(`${indent}  - échec`);
      lines.push(`${indent}    > ${fr(inter.onFailure.narrative) || '(templates génériques)'}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Warn only where the audit would: the target must be a feature with states
 * worth describing. Using an item on an NPC, or on a one-state prop, changes
 * nothing describable and is not a finding.
 */
function itemSection(item: ItemDefinition, stateCount: ReadonlyMap<string, number> = new Map()): string {
  const name = itemDisplayName(item.id);
  const lines: string[] = [];
  lines.push(`#### ${name ?? `⚠ SANS NOM (${item.id})`}  \`${item.id}\`${item.hidden ? ' *(caché)*' : ''}`);
  lines.push('');
  if (isEnrichedItem(item) && item.description) lines.push(`- description\n  > ${item.description.fr}`);
  if (item.examineResult) lines.push(`- examineResult\n  > ${item.examineResult.fr}`);
  if (isEnrichedItem(item)) {
    for (const use of item.useOn ?? []) {
      const res = use.interaction.onSuccess;
      const describable = (stateCount.get(use.targetId) ?? 0) >= 2;
      const st = res.newState
        ? ` \`newState=${toStateTokens(res.newState).join('+')}\``
        : (describable && res.flagSet !== undefined && !(res.flagSet in UNCHANGED_BY_DESIGN)
            ? ' ⚠ `sans newState`' : '');
      const flag = use.interaction.onSuccess.flagSet ? ` \`flagSet=${use.interaction.onSuccess.flagSet}\`` : '';
      lines.push(`- **USE sur \`${use.targetId}\`**${st}${flag}`);
      lines.push(`  > ${fr(use.interaction.onSuccess.narrative) || '(templates génériques)'}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function skeletonTranscript(sk: CoreSkeleton): string {
  const L: string[] = [];
  L.push(`# Transcript — ${sk.nameKey.fr} (\`${sk.id}\`)`);
  L.push('');
  L.push('> Généré par `npx tsx scripts/narrative-transcript.ts`. Ne pas éditer à la main.');
  L.push('> `⚠` marque un texte que le joueur ne peut pas atteindre, ou un nom manquant.');
  L.push('');
  L.push('## Intro du scénario');
  L.push('');
  L.push(`> ${sk.descriptionKey.fr}`);
  L.push('');

  for (const node of sk.nodes) {
    const loc = sk.nodeLocations[node.id];
    const pool = sk.theme.locationNames[loc?.locationRole ?? ''] ?? [];
    L.push('---');
    L.push('');
    L.push(`## Nœud \`${node.id}\` — rôle \`${node.role}\`, beat \`${node.beat}\`, tension ${node.tension}`);
    L.push('');
    L.push(`*Nom de lieu tiré parmi :* ${pool.map(p => `« ${p.fr} »`).join(' · ') || '—'}`);
    L.push('');
    L.push('### Ce que le joueur lit en entrant');
    L.push('');
    L.push(`> ${node.descriptionKey.fr}`);
    L.push('');
    if (loc) {
      const stateCount = new Map<string, number>();
      for (const nl of Object.values(sk.nodeLocations)) {
        for (const f of nl.features) stateCount.set(f.id, Object.keys(f.descriptions ?? {}).length);
      }
      const enumeration = enumerate(loc.features, loc.items);
      if (enumeration) { L.push(`> ${enumeration.split('\n').join('\n> ')}`); L.push(''); }
      L.push(`*Sorties :* ${loc.exits.join(', ') || '—'}`);
      L.push('');
      if (loc.features.length > 0) {
        L.push('### Éléments');
        L.push('');
        for (const feat of loc.features) L.push(featureSection(feat));
      }
      if (loc.items.length > 0) {
        L.push('### Objets');
        L.push('');
        for (const item of loc.items) L.push(itemSection(item, stateCount));
      }
    }
  }
  return L.join('\n');
}

function modulesTranscript(): string {
  const L: string[] = [];
  L.push('# Transcript — modules de scénario');
  L.push('');
  L.push('> Généré par `npx tsx scripts/narrative-transcript.ts`. Ne pas éditer à la main.');
  L.push('');
  for (const mod of ALL_MODULES) {
    const stateCount = new Map<string, number>();
    for (const loc of mod.locations) {
      for (const f of loc.features) stateCount.set(f.id, Object.keys(f.descriptions ?? {}).length);
    }
    L.push('---');
    L.push('');
    L.push(`## \`${mod.id}\` — type \`${mod.type}\`, tension ${mod.tensionRange.join('–')}`);
    L.push('');
    for (const skin of mod.skins) {
      L.push(`### Peau \`${skin.tension}\``);
      L.push('');
      L.push(`- entrée\n  > ${skin.entryDescription.fr}`);
      L.push(`- retour\n  > ${skin.revisitDescription.fr}`);
      L.push(`- obstacle\n  > ${skin.obstacleDescription.fr}`);
      L.push(`- ambiance : ${skin.ambientSnippets.map(a => `« ${a.fr} »`).join(' · ')}`);
      L.push('');
    }
    if (mod.obstacle) {
      L.push(`### Obstacle sur \`${mod.obstacle.targetId}\``);
      L.push('');
      L.push(`> ${mod.obstacle.description.fr}`);
      L.push('');
      for (const p of mod.obstacle.paths) L.push(`- chemin : ${p.description.fr}`);
      L.push('');
    }
    for (const loc of mod.locations) {
      L.push(`### Lieu \`${loc.id}\` (rôle \`${loc.role}\`)`);
      L.push('');
      const enumeration = enumerate(loc.features, loc.items ?? []);
      if (enumeration) { L.push(`> ${enumeration.split('\n').join('\n> ')}`); L.push(''); }
      for (const feat of loc.features) L.push(featureSection(feat));
      for (const item of loc.items ?? []) L.push(itemSection(item, stateCount));
    }
  }
  return L.join('\n');
}

function microTranscript(): string {
  const L: string[] = [];
  L.push('# Transcript — micro-modules');
  L.push('');
  L.push('> Généré par `npx tsx scripts/narrative-transcript.ts`. Ne pas éditer à la main.');
  L.push('');
  for (const mm of ALL_MICRO_MODULES) {
    L.push('---');
    L.push('');
    L.push(`## \`${mm.id}\` — type \`${mm.type}\`, visibilité \`${mm.visibility}\``);
    L.push('');
    const f = mm.locale?.fr;
    if (f) {
      L.push(`- entrée\n  > ${f.description}`);
      L.push(`- indice\n  > ${f.hintText}`);
      L.push(`- retour\n  > ${f.revisitDescription}`);
      L.push('');
    }
    const enumeration = enumerate(mm.features ?? [], mm.items ?? []);
    if (enumeration) { L.push(`> ${enumeration.split('\n').join('\n> ')}`); L.push(''); }
    for (const feat of mm.features ?? []) L.push(featureSection(feat));
    if (mm.loreData) {
      L.push(`- lore (\`${mm.loreData.supportType}\`)\n  > ${mm.loreData.loreText.fr}`);
      if (mm.loreData.failureText) L.push(`- lore, échec\n  > ${mm.loreData.failureText.fr}`);
      L.push('');
    }
  }
  return L.join('\n');
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const written: string[] = [];
for (const sk of wanted()) {
  const file = path.join(OUT_DIR, `${sk.id}.md`);
  fs.writeFileSync(file, skeletonTranscript(sk) + '\n', 'utf-8');
  written.push(file);
}
if (process.argv[2] === undefined) {
  const m = path.join(OUT_DIR, 'modules.md');
  fs.writeFileSync(m, modulesTranscript() + '\n', 'utf-8');
  written.push(m);
  const mm = path.join(OUT_DIR, 'micro-modules.md');
  fs.writeFileSync(mm, microTranscript() + '\n', 'utf-8');
  written.push(mm);
}
for (const f of written) {
  const lines = fs.readFileSync(f, 'utf-8').split('\n').length;
  console.log(`${path.relative(process.cwd(), f)}  ${lines} lignes`);
}
