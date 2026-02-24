// ---------------------------------------------------------------------------
// src/narration/templateEngine.ts — Slot parser + grammar-aware rendering
// ---------------------------------------------------------------------------
// Parses template strings like:
//   "Vous frappez {def_target}{?tool_used: avec {def_tool}|à mains nues}."
// and resolves slots using the grammar engine + narrative context.
// ---------------------------------------------------------------------------

import type { GrammarEngine, GrammaticalInfo } from '../i18n/grammar/interface';
import type { NarrativeContext } from './types';
import type { Locale } from '../i18n/types';
import { getLocale } from '../i18n/index';
import { frenchGrammar } from '../i18n/grammar/fr';
import { englishGrammar } from '../i18n/grammar/en';

// === DEFAULT GRAMMAR INFO ===

const DEFAULT_GRAMMAR: GrammaticalInfo = {
  gender: 'M',
  startsWithVowel: false,
  plural: false,
};

// === GRAMMAR ENGINE ACCESSOR ===

/** Get the active grammar engine for the current or specified locale */
export function getGrammarEngine(locale?: Locale): GrammarEngine {
  const effectiveLocale = locale ?? getLocale();
  return effectiveLocale === 'fr' ? frenchGrammar : englishGrammar;
}

// === SLOT RESOLUTION ===

/** All known slot values derived from a NarrativeContext */
interface SlotValues {
  readonly actor: string | null;
  readonly target: string | null;
  readonly targetGrammar: GrammaticalInfo;
  readonly tool_used: string | null;
  readonly toolGrammar: GrammaticalInfo;
  readonly npc_name: string | null;
  readonly npcGrammar: GrammaticalInfo;
  readonly location: string | null;
  readonly direction: string | null;
  readonly sound: string | null;
  readonly fluid: string | null;
  readonly damage_desc: string | null;
  readonly emotion: string | null;
  readonly target_part: string | null;
}

/** Build slot values from narrative context */
function buildSlotValues(ctx: NarrativeContext | null): SlotValues {
  if (!ctx) {
    return {
      actor: 'Vous', target: null, targetGrammar: DEFAULT_GRAMMAR,
      tool_used: null, toolGrammar: DEFAULT_GRAMMAR,
      npc_name: null, npcGrammar: DEFAULT_GRAMMAR,
      location: null, direction: null, sound: null, fluid: null,
      damage_desc: null, emotion: null, target_part: null,
    };
  }

  const firstNpc = ctx.npcsPresent.length > 0 ? ctx.npcsPresent[0] : null;

  return {
    actor: 'Vous',
    target: ctx.target?.name ?? null,
    targetGrammar: ctx.target?.grammar ?? DEFAULT_GRAMMAR,
    tool_used: ctx.toolUsed?.name ?? null,
    toolGrammar: ctx.toolUsed?.grammar ?? DEFAULT_GRAMMAR,
    npc_name: firstNpc?.name ?? null,
    npcGrammar: firstNpc?.grammar ?? DEFAULT_GRAMMAR,
    location: ctx.location.name,
    direction: null,     // Filled by scenario-specific data
    sound: null,         // Filled by sensory pool selection
    fluid: null,         // Filled by sensory pool selection
    damage_desc: null,   // Filled by consequence data
    emotion: null,       // Filled by player state
    target_part: ctx.target?.bodyPart ?? null,
  };
}

// === SLOT PREFIX MAPPING ===

type SlotPrefix = 'def' | 'indef' | 'de' | 'a' | 'part';

/** Map of prefixed slot names to their base slot and modifier */
const PREFIXED_SLOTS: Readonly<Record<string, { base: 'target' | 'tool' | 'npc'; prefix: SlotPrefix }>> = {
  'def_target':   { base: 'target', prefix: 'def' },
  'indef_target': { base: 'target', prefix: 'indef' },
  'de_target':    { base: 'target', prefix: 'de' },
  'a_target':     { base: 'target', prefix: 'a' },
  'part_target':  { base: 'target', prefix: 'part' },
  'def_tool':     { base: 'tool',   prefix: 'def' },
  'def_npc':      { base: 'npc',    prefix: 'def' },
};

/** Maps prefix abbreviations to SlotModifier from grammar interface */
function prefixToModifier(prefix: SlotPrefix): 'def' | 'indef' | 'de' | 'a' | 'partitive' {
  if (prefix === 'part') return 'partitive';
  return prefix;
}

/** Resolve a simple slot name to its string value */
function resolveSimpleSlot(
  name: string,
  slots: SlotValues,
  grammar: GrammarEngine,
): string | null {
  // Check prefixed slots first
  const prefixed = PREFIXED_SLOTS[name];
  if (prefixed) {
    const noun = prefixed.base === 'target' ? slots.target
      : prefixed.base === 'tool' ? slots.tool_used
      : slots.npc_name;
    if (!noun) return null;

    const info = prefixed.base === 'target' ? slots.targetGrammar
      : prefixed.base === 'tool' ? slots.toolGrammar
      : slots.npcGrammar;

    return grammar.resolveSlot(prefixToModifier(prefixed.prefix), noun, info);
  }

  // Check target_article special case
  if (name === 'target_article') {
    return grammar.article('definite', slots.targetGrammar);
  }

  // Check adjective agreement: target_adj:adjective
  if (name.startsWith('target_adj:')) {
    const adj = name.slice('target_adj:'.length);
    return grammar.agree(adj, slots.targetGrammar);
  }

  // Simple named slots
  switch (name) {
    case 'actor': return slots.actor;
    case 'target': return slots.target;
    case 'tool_used': return slots.tool_used;
    case 'npc_name': return slots.npc_name;
    case 'location': return slots.location;
    case 'direction': return slots.direction;
    case 'sound': return slots.sound;
    case 'fluid': return slots.fluid;
    case 'damage_desc': return slots.damage_desc;
    case 'emotion': return slots.emotion;
    case 'target_part': return slots.target_part;
    default: return null;
  }
}

// === CONDITIONAL BLOCK PARSING ===

/**
 * Process conditional blocks: {?slot_name:text if present|text if absent}
 * Nested slots within the conditional are also resolved.
 */
function processConditionals(
  template: string,
  slots: SlotValues,
  grammar: GrammarEngine,
): string {
  // Pattern: {?slotName:trueText|falseText}
  const conditionalRegex = /\{\?(\w+):([^}]*?)\|([^}]*?)\}/g;

  return template.replace(conditionalRegex, (_match, slotName: string, trueText: string, falseText: string) => {
    const slotValue = resolveSimpleSlot(slotName, slots, grammar);
    const hasValue = slotValue !== null && slotValue !== '';
    const chosen = hasValue ? trueText : falseText;
    // Recursively resolve any slots within the chosen branch
    return resolveSlots(chosen, slots, grammar);
  });
}

// === SLOT RESOLUTION ===

/** Resolve all {slot} references in a template string */
function resolveSlots(
  template: string,
  slots: SlotValues,
  grammar: GrammarEngine,
): string {
  // Simple slot pattern: {slotName} or {target_adj:adjective}
  return template.replace(/\{([^?}][^}]*)\}/g, (_match, slotExpr: string) => {
    const resolved = resolveSimpleSlot(slotExpr, slots, grammar);
    return resolved ?? '';
  });
}

// === MAIN RENDER FUNCTION ===

/**
 * Render a template string with grammar-aware slot resolution.
 *
 * @param template - Raw template string with {slots} and {?conditionals}
 * @param ctx - Narrative context (null for context-free rendering)
 * @param locale - Override locale (defaults to current)
 * @returns Fully resolved, post-processed string
 */
export function renderTemplate(
  template: string,
  ctx: NarrativeContext | null = null,
  locale?: Locale,
): string {
  const grammar = getGrammarEngine(locale);
  const slots = buildSlotValues(ctx);

  // 1. Process conditionals first (they may contain nested slots)
  let result = processConditionals(template, slots, grammar);

  // 2. Resolve remaining simple slots
  result = resolveSlots(result, slots, grammar);

  // 3. Language-specific post-processing
  result = grammar.postProcess(result);

  return result;
}

/**
 * Render a template with explicit slot overrides (useful for testing
 * and for rendering snippets that don't have a full NarrativeContext).
 */
export function renderTemplateWithSlots(
  template: string,
  slotOverrides: Partial<SlotValues>,
  locale?: Locale,
): string {
  const grammar = getGrammarEngine(locale);
  const baseSlots = buildSlotValues(null);
  const slots: SlotValues = { ...baseSlots, ...slotOverrides };

  let result = processConditionals(template, slots, grammar);
  result = resolveSlots(result, slots, grammar);
  result = grammar.postProcess(result);

  return result;
}

/**
 * Detect if an NPC is the same entity as the action target.
 * Used to suppress NPC reaction layer when NPC IS the target.
 */
export function detectSelfReference(ctx: NarrativeContext): boolean {
  if (!ctx.target) return false;
  return ctx.npcsPresent.some(npc => npc.id === ctx.target?.id);
}
