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
import { featureDisplayName, itemDisplayName } from '../src/content/featureNames';
import { toTokenList } from '../src/content/audit/narrativeLint';

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

/** The enumeration as the player reads it: names, nothing else. */
function enumerate(features: readonly FeatureDefinition[], items: readonly ItemDefinition[]): string {
  const names = features.map(f => featureDisplayName(f.id) ?? `⚠ ${f.id}`);
  const itemNames = items.filter(i => i.hidden !== true).map(i => itemDisplayName(i.id) ?? `⚠ ${i.id}`);
  const lines: string[] = [];
  if (names.length > 0) lines.push(`Vous voyez autour de vous ${names.join(', ')}.`);
  if (itemNames.length > 0) lines.push(`Parmi les débris, vous remarquez ${itemNames.join(', ')}.`);
  return lines.join('\n');
}

/** Every state an interaction on this feature can put it into, from initial. */
function reachableStates(feat: FeatureDefinition): readonly { label: string; state: EntityState }[] {
  const init = makeEntityState(feat.initialState);
  const out = [{ label: `initial (${feat.initialState ?? 'défaut'})`, state: init }];
  if (!isEnrichedFeature(feat)) return out;
  const seen = new Set<string>([JSON.stringify(init)]);
  for (const inter of feat.interactions ?? []) {
    for (const res of [inter.onSuccess, inter.onFailure]) {
      const tokens = toTokenList(res?.newState);
      if (tokens.length === 0) continue;
      let s = init;
      for (const tk of tokens) s = applyStateToken(s, tk as StateId);
      const key = JSON.stringify(s);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ label: `après newState:${tokens.join('+')}`, state: s });
    }
  }
  return out;
}

function featureSection(feat: FeatureDefinition, indent = ''): string {
  const name = featureDisplayName(feat.id);
  const lines: string[] = [];
  lines.push(`${indent}#### ${name ?? `⚠ SANS NOM (${feat.id})`}  \`${feat.id}\``);
  lines.push('');

  const states = reachableStates(feat);
  for (const { label, state } of states) {
    const desc = pickStateDescription(feat.descriptions, state);
    const shown = desc ? desc.fr : fr(feat.examineResult);
    const source = desc ? 'descriptions' : (feat.examineResult ? 'examineResult' : '—');
    lines.push(`${indent}- **${label}** · \`${describeState(state)}\` · via \`${source}\``);
    lines.push(`${indent}  > ${shown || '⚠ RIEN À MONTRER'}`);
  }

  // Any description no reachable state selects is text nobody will ever read.
  const shownTexts = new Set(states.map(s => pickStateDescription(feat.descriptions, s.state)?.fr).filter(Boolean));
  for (const [st, ls] of Object.entries(feat.descriptions ?? {})) {
    if (!shownTexts.has(ls.fr)) {
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
    const st = inter.onSuccess.newState ? ` \`newState=${toTokenList(inter.onSuccess.newState).join('+')}\`` : ' ⚠ `sans newState`';
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

function itemSection(item: ItemDefinition): string {
  const name = itemDisplayName(item.id);
  const lines: string[] = [];
  lines.push(`#### ${name ?? `⚠ SANS NOM (${item.id})`}  \`${item.id}\`${item.hidden ? ' *(caché)*' : ''}`);
  lines.push('');
  if (isEnrichedItem(item) && item.description) lines.push(`- description\n  > ${item.description.fr}`);
  if (item.examineResult) lines.push(`- examineResult\n  > ${item.examineResult.fr}`);
  if (isEnrichedItem(item)) {
    for (const use of item.useOn ?? []) {
      const st = use.interaction.onSuccess.newState
        ? ` \`newState=${toTokenList(use.interaction.onSuccess.newState).join('+')}\``
        : ' ⚠ `sans newState`';
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
        for (const item of loc.items) L.push(itemSection(item));
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
      for (const item of loc.items ?? []) L.push(itemSection(item));
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
