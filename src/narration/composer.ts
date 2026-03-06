// ---------------------------------------------------------------------------
// src/narration/composer.ts — 7-layer narrative composition + budget system
// ---------------------------------------------------------------------------
// Composes atmospheric French narrative text from up to 7 independent layers,
// each selected based on different contextual dimensions.
// ---------------------------------------------------------------------------

import type {
  NarrativeContext, NarrativeSettings, ActionTemplate, ScoredLayer,
  LayerType, Outcome, TensionTier, VerbCategory, LocationNarrationState,
  PlayerStateSnippet,
} from './types';
import { tensionTier, NARRATIVE_PRESETS } from './types';
import { renderTemplate, detectSelfReference, getGrammarEngine } from './templateEngine';
import { NarrationMemory } from './memory';
import { selectGameplayHint } from './hints';
import type { Locale } from '../i18n/types';
import { getLocale } from '../i18n/index';
import type { VerbId } from '../engine/verbs';
import type { PropertyId } from '../engine/properties';

// === TEMPLATE IMPORTS ===

import { ACTION_TEMPLATES, GENERIC_FALLBACKS } from '../content/templates/actionTemplates';
import { SENSORY_POOLS } from '../content/templates/sensory';
import { ATMOSPHERE_SNIPPETS } from '../content/templates/atmosphere';
import { PLAYER_STATE_SNIPPETS } from '../content/templates/conditions';
import { NPC_REACTION_SNIPPETS } from '../content/templates/npcReactions';
import { CONSEQUENCE_SNIPPETS } from '../content/templates/environmental';
import { THREAT_HINT_SNIPPETS } from '../content/templates/threats';

// === INJECTABLE RNG ===

export type ComposerRngFn = () => number;

// === COMPOSER STATE ===

/** Location narration state tracker */
const locationStates: Map<string, LocationNarrationState> = new Map();

/** Narration memory (anti-repetition) */
const composerMemory = new NarrationMemory();

// === LOCATION STATE MANAGEMENT ===

export function getLocationNarrationState(locationId: string): LocationNarrationState {
  let state = locationStates.get(locationId);
  if (!state) {
    state = {
      locationId,
      turnsSpentHere: 0,
      atmosphereShownCount: 0,
      sensoryIdsUsedHere: new Set(),
      hintsShown: new Set(),
      environmentVersion: 0,
    };
    locationStates.set(locationId, state);
  }
  return state;
}

export function incrementLocationTurn(locationId: string): void {
  const state = getLocationNarrationState(locationId);
  state.turnsSpentHere++;
}

export function resetLocationState(locationId: string): void {
  locationStates.delete(locationId);
}

export function resetAllLocationStates(): void {
  locationStates.clear();
}

export function resetLocationOnEnvironmentChange(locationId: string): void {
  const state = locationStates.get(locationId);
  if (state) {
    state.turnsSpentHere = 0;
    state.atmosphereShownCount = 0;
    state.environmentVersion++;
  }
}

// === VERB CATEGORY MAPPING ===

const VERB_CATEGORY_MAP: Readonly<Record<VerbId, VerbCategory>> = {
  // FOR — physical
  STRIKE: 'physical', PUSH: 'physical', PULL: 'physical', LIFT: 'physical',
  KICK: 'physical', BREAK: 'physical', BEND: 'physical', CUT: 'physical',
  FORCE_OPEN: 'physical', BITE: 'physical', SQUEEZE: 'physical',
  IMPROVISE_WEAPON: 'physical', SACRIFICE: 'physical', SELF_HARM: 'physical',
  // DEF — physical
  BLOCK: 'physical', IMPROVISE_SHIELD: 'physical', BARRICADE: 'physical',
  // INT — technical
  READ: 'technical', HACK: 'technical', REPAIR: 'technical',
  DISASSEMBLE: 'technical', ASSEMBLE: 'technical', ACTIVATE: 'technical',
  DEACTIVATE: 'technical', REPROGRAM: 'technical', LOCK: 'technical',
  UNLOCK: 'technical', WELD: 'technical', PLUG: 'technical',
  OVERRIDE: 'technical', SABOTAGE: 'technical', SET_TRAP: 'technical',
  IMPROVISE_TOOL: 'technical', WEDGE: 'technical', IGNITE: 'technical',
  FLOOD: 'technical', ELECTRIFY: 'technical', TIE: 'technical', COVER: 'technical',
  // PER — perception
  EXAMINE: 'perception', LISTEN: 'perception', SMELL: 'perception', SCAN: 'perception',
  // CHA — social
  TALK: 'social', PERSUADE: 'social', INTIMIDATE: 'social',
  DECEIVE: 'social', DISTRACT: 'social', BARTER: 'social',
  SEDUCE: 'social', COMMAND: 'social', CALM: 'social',
  PROVOKE: 'social', PLEAD: 'social', INTERROGATE: 'social',
  SIGNAL: 'social', LURE: 'social',
  // AGI — physical
  THROW: 'physical', SHOOT: 'physical', CLIMB: 'physical', JUMP: 'physical',
  DODGE: 'physical', SWIM: 'physical', RUN: 'physical', HIDE: 'physical', STACK: 'physical',
  // Interaction / Auto
  USE: 'interaction', OPEN: 'interaction', CLOSE: 'interaction', TAKE: 'interaction',
  DROP: 'interaction', GIVE: 'interaction', EQUIP: 'interaction', EAT: 'interaction',
  DRINK: 'interaction', MOVE_TO: 'interaction', WAIT: 'interaction', TOUCH: 'interaction',
};

/** Get the verb category for a verb ID */
export function getVerbCategory(verb: VerbId): VerbCategory {
  return VERB_CATEGORY_MAP[verb] ?? 'creative';
}

// === TEMPLATE SELECTION (Priority Cascade) ===

/**
 * Find a template matching the given criteria.
 * Uses priority cascade: specific → verb+outcome → category+outcome → generic fallback.
 */
/**
 * For EAT verb, pick the best PropertyId to use as targetType for template selection.
 * Mirrors getEatTier() in consequences.ts but returns the PropertyId used in templates.
 */
function selectEatTargetProperty(properties: readonly PropertyId[]): PropertyId | undefined {
  if (properties.includes('edible')) return 'edible';
  if (properties.includes('drinkable')) return 'drinkable';
  if (properties.includes('alive') || properties.includes('sentient')) return 'alive';
  if (properties.includes('heavy') && !properties.includes('small')) return 'heavy';
  if (properties.includes('toxic') || properties.includes('corrosive') || properties.includes('radioactive')) return 'toxic';
  if (properties.includes('sharp') || properties.includes('bladed') || properties.includes('pointed')) return 'sharp';
  if (properties.includes('metallic') || properties.includes('synthetic') || properties.includes('electronic')) return 'metallic';
  if (properties.includes('dead') && properties.includes('organic')) return 'dead';
  return undefined;
}

export function selectActionTemplate(ctx: NarrativeContext): ActionTemplate {
  const tier = tensionTier(ctx.tension);
  // EAT uses tier-based property selection for precise template matching
  // Other verbs: prefer 'alive' so NPC-specific templates take priority
  const targetType: PropertyId | undefined = ctx.verb === 'EAT'
    ? selectEatTargetProperty(ctx.target?.properties ?? [])
    : ctx.target?.properties.includes('alive')
      ? 'alive'
      : ctx.target?.properties[0];

  // PRIORITY 1: Specific — verb + target type + outcome + tension tier
  let template = findTemplate(ctx.verb, targetType ?? null, ctx.outcome, tier, ctx.verbCategory);

  // PRIORITY 2: Verb + outcome (any target)
  if (!template) {
    template = findTemplate(ctx.verb, null, ctx.outcome, tier, ctx.verbCategory);
  }

  // PRIORITY 3: Verb category + outcome (generic)
  if (!template) {
    template = findTemplateByCategory(ctx.verbCategory, ctx.outcome, tier);
  }

  // PRIORITY 4: Ultimate fallback
  if (!template) {
    template = getGenericFallback(ctx.outcome);
  }

  return template;
}

function findTemplate(
  verb: VerbId,
  targetType: PropertyId | null,
  outcome: Outcome,
  tension: TensionTier,
  _category: VerbCategory,
): ActionTemplate | null {
  // Collect ALL matching templates first, then let memory pick to avoid repetition
  const exactCandidates = ACTION_TEMPLATES.filter(t =>
    t.verb === verb &&
    (t.targetType === null || t.targetType === targetType) &&
    t.outcome === outcome &&
    t.tension === tension
  );
  if (exactCandidates.length > 0) {
    return composerMemory.select(exactCandidates, 'action');
  }

  // Try without tension tier constraint
  const relaxedCandidates = ACTION_TEMPLATES.filter(t =>
    t.verb === verb &&
    (t.targetType === null || t.targetType === targetType) &&
    t.outcome === outcome
  );
  if (relaxedCandidates.length > 0) {
    return composerMemory.select(relaxedCandidates, 'action');
  }

  return null;
}

function findTemplateByCategory(
  category: VerbCategory,
  outcome: Outcome,
  tension: TensionTier,
): ActionTemplate | null {
  const candidates = ACTION_TEMPLATES.filter(t =>
    t.verb === null && t.category === category && t.outcome === outcome && t.tension === tension
  );
  if (candidates.length > 0) {
    return composerMemory.select(candidates, 'action');
  }

  // Try without tension constraint
  const fallbackCandidates = ACTION_TEMPLATES.filter(t =>
    t.verb === null && t.category === category && t.outcome === outcome
  );
  if (fallbackCandidates.length > 0) {
    return composerMemory.select(fallbackCandidates, 'action');
  }

  return null;
}

function getGenericFallback(outcome: Outcome): ActionTemplate {
  const fallback = GENERIC_FALLBACKS[outcome];
  if (fallback) return fallback;

  // Ultimate last resort
  return {
    id: 'generic_any_any_any_any',
    verb: null,
    targetType: null,
    outcome,
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'Vous tentez une action.',
      en: 'You attempt an action.',
    },
  };
}

// === LAYER SCORING ===

/** Score how relevant a layer is to the current context */
export function scoreLayerRelevance(layer: LayerType, ctx: NarrativeContext): number {
  switch (layer) {
    case 'consequence':
      return (ctx.stateChanges?.length ?? 0) > 0 ? 100 : 0;
    case 'sensory':
      return ctx.outcome === 'auto_success' ? 20 : 60;
    case 'atmosphere':
      return ctx.beat === 'climax' ? 90 : 30 + ctx.tension * 5;
    case 'player_state':
      return ctx.playerHpPercent < 0.3 ? 85
        : ctx.playerConditions.size > 0 ? 50
        : 0;
    case 'threat':
      return hasThreatHint(ctx) ? 70 : 0;
    case 'npc_reaction': {
      const directlyInvolved = ctx.npcsPresent.some(npc => npc.id === ctx.target?.id);
      return directlyInvolved ? 75 : 40;
    }
  }
}

// === SENSORY DETAIL SELECTION ===

function selectSensoryDetail(ctx: NarrativeContext, locale: Locale): string | null {
  const settingPool = SENSORY_POOLS[ctx.settingId];
  if (!settingPool) return null;

  // If an environmental condition is active, pick from the condition pool
  const activeConditions = [...ctx.environmentConditions];
  if (activeConditions.length > 0) {
    const conditionKey = activeConditions[Math.floor(Math.random() * activeConditions.length)];
    if (conditionKey !== undefined) {
      const conditionPool = settingPool[conditionKey];
      if (conditionPool && conditionPool.length > 0) {
        const selected = composerMemory.select(conditionPool, `sensory_${ctx.settingId}_${conditionKey}`);
        if (selected) return locale === 'fr' ? selected.text.fr : selected.text.en;
      }
    }
  }

  // Otherwise, pick from default pool
  const defaultPool = settingPool['default'];
  if (!defaultPool || defaultPool.length === 0) return null;

  const selected = composerMemory.select(defaultPool, `sensory_${ctx.settingId}`);
  return selected ? (locale === 'fr' ? selected.text.fr : selected.text.en) : null;
}

// === ATMOSPHERE SELECTION ===

function selectAtmosphereSnippet(ctx: NarrativeContext, locale: Locale): string | null {
  const tier = ctx.beat === 'climax' ? 'climax' : tensionTier(ctx.tension);
  const candidates = ATMOSPHERE_SNIPPETS.filter(s =>
    s.setting === ctx.settingId && s.tensionTier === tier
  );
  if (candidates.length === 0) {
    // Fallback: any tension tier for this setting
    const fallbackCandidates = ATMOSPHERE_SNIPPETS.filter(s => s.setting === ctx.settingId);
    if (fallbackCandidates.length === 0) return null;
    const selected = composerMemory.select(fallbackCandidates, `atmosphere_${ctx.settingId}`);
    return selected ? (locale === 'fr' ? selected.text.fr : selected.text.en) : null;
  }

  const selected = composerMemory.select(candidates, `atmosphere_${ctx.settingId}`);
  return selected ? (locale === 'fr' ? selected.text.fr : selected.text.en) : null;
}

// === PLAYER STATE SELECTION ===

function selectPlayerStateSnippet(ctx: NarrativeContext, locale: Locale): string | null {
  let candidates: readonly PlayerStateSnippet[];

  if (ctx.playerHpPercent < 0.30) {
    candidates = PLAYER_STATE_SNIPPETS.filter(s => s.type === 'low_hp');
  } else if (ctx.playerHpPercent < 0.50) {
    candidates = PLAYER_STATE_SNIPPETS.filter(s => s.type === 'mild_fatigue');
  } else {
    // Find condition-specific snippets
    const conditionsArr = [...ctx.playerConditions];
    if (conditionsArr.length === 0) return null;
    candidates = PLAYER_STATE_SNIPPETS.filter(s =>
      s.type === 'condition' && s.condition && conditionsArr.includes(s.condition)
    );
  }

  if (candidates.length === 0) return null;
  const selected = composerMemory.select(candidates, 'player_state');
  return selected ? (locale === 'fr' ? selected.text.fr : selected.text.en) : null;
}

// === NPC REACTION SELECTION ===

function selectNpcReaction(ctx: NarrativeContext, locale: Locale): string | null {
  if (ctx.npcsPresent.length === 0) return null;
  if (detectSelfReference(ctx)) return null;

  const npc = ctx.npcsPresent[0];
  if (!npc) return null;
  const candidates = NPC_REACTION_SNIPPETS.filter(s =>
    s.disposition === npc.disposition && s.outcome === ctx.outcome
  );

  if (candidates.length === 0) {
    // Fallback: match disposition only
    const fallback = NPC_REACTION_SNIPPETS.filter(s => s.disposition === npc.disposition);
    if (fallback.length === 0) return null;
    const selected = composerMemory.select(fallback, `npc_${npc.disposition}`);
    return selected ? (locale === 'fr' ? selected.text.fr : selected.text.en) : null;
  }

  const selected = composerMemory.select(candidates, `npc_${npc.disposition}`);
  return selected ? (locale === 'fr' ? selected.text.fr : selected.text.en) : null;
}

// === CONSEQUENCE SELECTION ===

function selectConsequenceNarrative(ctx: NarrativeContext, locale: Locale): string | null {
  if (!ctx.stateChanges || ctx.stateChanges.length === 0) return null;

  const firstChange = ctx.stateChanges[0];
  if (!firstChange) return null;
  const changeType = firstChange.type;
  const candidates = CONSEQUENCE_SNIPPETS.filter(s => s.stateChangeType === changeType);

  if (candidates.length === 0) {
    const genericCandidates = CONSEQUENCE_SNIPPETS.filter(s => s.stateChangeType === 'generic');
    if (genericCandidates.length === 0) return null;
    const selected = composerMemory.select(genericCandidates, 'consequence');
    return selected ? (locale === 'fr' ? selected.text.fr : selected.text.en) : null;
  }

  const selected = composerMemory.select(candidates, 'consequence');
  return selected ? (locale === 'fr' ? selected.text.fr : selected.text.en) : null;
}

// === THREAT HINT ===

function hasThreatHint(ctx: NarrativeContext): boolean {
  return THREAT_HINT_SNIPPETS.some(s => s.beat === ctx.beat);
}

function selectThreatHint(ctx: NarrativeContext, locale: Locale): string | null {
  const candidates = THREAT_HINT_SNIPPETS.filter(s => s.beat === ctx.beat);
  if (candidates.length === 0) return null;

  const selected = composerMemory.select(candidates, `threat_${ctx.beat}`);
  return selected ? (locale === 'fr' ? selected.text.fr : selected.text.en) : null;
}

// === MAIN COMPOSITION FUNCTION ===

/**
 * Compose a full narrative output from the 7-layer system.
 *
 * @param ctx - The 12-dimension narrative context
 * @param settings - Narrative length preset
 * @param rng - Optional injectable RNG for testing
 * @param locale - Optional locale override
 * @returns Composed narrative string
 */
export function composeNarrative(
  ctx: NarrativeContext,
  settings?: NarrativeSettings,
  rng?: ComposerRngFn,
  locale?: Locale,
): string {
  const effectiveSettings = settings ?? NARRATIVE_PRESETS.standard;
  const effectiveRng = rng ?? Math.random;
  const effectiveLocale = locale ?? getLocale();
  const budget = effectiveSettings.maxLayers;
  const candidates: ScoredLayer[] = [];

  // Update location tracking
  incrementLocationTurn(ctx.location.id);
  const locationState = getLocationNarrationState(ctx.location.id);

  // ── LAYER 1: ACTION RESULT (mandatory, always included) ──
  const actionTemplate = selectActionTemplate(ctx);
  const actionText = effectiveLocale === 'fr' ? actionTemplate.text.fr : actionTemplate.text.en;
  const parts: string[] = [renderTemplate(actionText, ctx, effectiveLocale)];

  // ── Score all optional layers ──

  // Layer 2: SENSORY DETAIL
  const sensoryProb = ctx.outcome === 'auto_success' ? 0.50 : 0.90;
  if (effectiveRng() < sensoryProb) {
    candidates.push({
      layer: 'sensory',
      score: scoreLayerRelevance('sensory', ctx),
      render: () => selectSensoryDetail(ctx, effectiveLocale),
    });
  }

  // Layer 3: CONSEQUENCE
  if (ctx.stateChanges && ctx.stateChanges.length > 0) {
    candidates.push({
      layer: 'consequence',
      score: scoreLayerRelevance('consequence', ctx),
      render: () => selectConsequenceNarrative(ctx, effectiveLocale),
    });
  }

  // Layer 4: ATMOSPHERE or GAMEPLAY HINT
  const atmosProb = ctx.beat === 'climax' ? 0.95 : 0.3 + ctx.tension * 0.05;
  const effectiveAtmosProb = locationState.turnsSpentHere >= 4
    ? atmosProb * 0.5
    : locationState.turnsSpentHere <= 1
    ? 1.0
    : atmosProb;

  if (effectiveRng() < effectiveAtmosProb) {
    if (locationState.turnsSpentHere >= 4) {
      // Replace atmosphere with gameplay hint
      candidates.push({
        layer: 'atmosphere',
        score: scoreLayerRelevance('atmosphere', ctx),
        render: () => selectGameplayHint(ctx, locationState.turnsSpentHere, effectiveLocale),
      });
    } else {
      candidates.push({
        layer: 'atmosphere',
        score: scoreLayerRelevance('atmosphere', ctx),
        render: () => selectAtmosphereSnippet(ctx, effectiveLocale),
      });
    }
  }

  // Layer 5: PLAYER STATE
  const stateProb = ctx.playerHpPercent < 0.30 ? 0.80
    : ctx.playerHpPercent < 0.50 ? 0.30
    : ctx.playerConditions.size > 0 ? 0.50
    : 0;
  if (effectiveRng() < stateProb) {
    candidates.push({
      layer: 'player_state',
      score: scoreLayerRelevance('player_state', ctx),
      render: () => selectPlayerStateSnippet(ctx, effectiveLocale),
    });
  }

  // Layer 6: THREAT HINT
  if (hasThreatHint(ctx)) {
    candidates.push({
      layer: 'threat',
      score: scoreLayerRelevance('threat', ctx),
      render: () => selectThreatHint(ctx, effectiveLocale),
    });
  }

  // Layer 7: NPC REACTION
  if (ctx.npcsPresent.length > 0 && !detectSelfReference(ctx)) {
    const directlyInvolved = ctx.npcsPresent.some(npc => npc.id === ctx.target?.id);
    const isCrit = ctx.outcome === 'crit_success' || ctx.outcome === 'crit_failure';
    const npcProb = directlyInvolved || isCrit ? 1.0 : 0.65;
    if (effectiveRng() < npcProb) {
      candidates.push({
        layer: 'npc_reaction',
        score: scoreLayerRelevance('npc_reaction', ctx),
        render: () => selectNpcReaction(ctx, effectiveLocale),
      });
    }
  }

  // ── Select top layers within budget ──
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const selected = sorted.slice(0, budget - 1); // -1 because action already used

  for (const layer of selected) {
    const rawText = layer.render();
    if (rawText) {
      // Render template slots in layer snippets (e.g., {npc_name} in NPC reactions)
      parts.push(renderTemplate(rawText, ctx, effectiveLocale));
    }
  }

  const grammar = getGrammarEngine(effectiveLocale);
  return grammar.postProcess(parts.join(' '));
}

// === COMPOSER RESETS ===

/** Reset all composer state (new game) */
export function resetComposer(): void {
  composerMemory.reset();
  locationStates.clear();
}

/** Reset composer state for a specific setting (entering new world) */
export function resetComposerForSetting(settingId: string): void {
  composerMemory.resetLayer(`sensory_${settingId}`);
  composerMemory.resetLayer(`atmosphere_${settingId}`);
}
