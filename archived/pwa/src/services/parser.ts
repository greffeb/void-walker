/**
 * Void Walker PWA - Response Parser
 *
 * Handles parsing and validation of LLM responses.
 * Ported from cli/void_walker/llm/parser.py
 */

import type { GameResponse, Scenario, StateChanges, Item, Location, NPC } from '../types/game';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Try to extract JSON from a text that might contain other content.
 */
export function extractJson(text: string): Record<string, unknown> | null {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Continue to extraction methods
  }

  // Look for JSON block markers (various formats)
  const patterns = [
    /```json\s*\n([\s\S]*?)\n```/,  // ```json ... ```
    /```\s*\n(\{[\s\S]*?\})\s*\n```/,  // ``` { } ```
    /```json\s*(\{[\s\S]*\})/,  // ```json { } (no closing)
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        continue;
      }
    }
  }

  // Look for { ... } pattern with balanced braces
  const start = text.indexOf('{');
  if (start >= 0) {
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = start; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
      } else if (!inString) {
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            const jsonStr = text.slice(start, i + 1);
            try {
              return JSON.parse(jsonStr);
            } catch {
              // Try to repair common issues
              const repaired = repairJson(jsonStr);
              if (repaired) {
                return repaired;
              }
            }
            break;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Attempt to repair common JSON issues.
 */
function repairJson(jsonStr: string): Record<string, unknown> | null {
  // Try original first
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Continue with repairs
  }

  let fixed = jsonStr;

  // Fix trailing commas
  fixed = fixed.replace(/,\s*}/g, '}');
  fixed = fixed.replace(/,\s*]/g, ']');

  try {
    return JSON.parse(fixed);
  } catch {
    // Continue
  }

  // Fix unquoted keys
  fixed = jsonStr.replace(/(\{|,)\s*(\w+)\s*:/g, '$1"$2":');

  try {
    return JSON.parse(fixed);
  } catch {
    return null;
  }
}

/**
 * Parse LLM response into GameResponse.
 */
export function parseGameResponse(responseText: string): GameResponse {
  const data = extractJson(responseText);
  if (!data) {
    throw new ParseError(`Could not extract JSON from response: ${responseText.slice(0, 200)}`);
  }

  // Parse state_changes
  let stateChanges: StateChanges = {};
  if (data.state_changes && typeof data.state_changes === 'object') {
    const sc = data.state_changes as Record<string, unknown>;
    stateChanges = {
      hpChange: typeof sc.hp_change === 'number' ? sc.hp_change : undefined,
      oxygenChange: typeof sc.oxygen_change === 'number' ? sc.oxygen_change : undefined,
      locationChange: typeof sc.location_change === 'string' ? sc.location_change : undefined,
      itemsAdded: parseItemsAdded(sc.items_added),
      itemsRemoved: Array.isArray(sc.items_removed)
        ? sc.items_removed.filter((x): x is string => typeof x === 'string')
        : undefined,
      objectivesCompleted: Array.isArray(sc.objectives_completed)
        ? sc.objectives_completed.filter((x): x is string => typeof x === 'string')
        : sc.objective_completed
          ? [sc.objective_completed as string]
          : undefined,
    };
  }

  return {
    narrative: String(data.narrative || ''),
    actionType: mapActionType(data.action_type),
    requiresRoll: Boolean(data.requires_roll),
    difficulty: typeof data.difficulty === 'number' ? data.difficulty : undefined,
    stateChanges,
    suggestions: Array.isArray(data.suggestions)
      ? data.suggestions.filter((x): x is string => typeof x === 'string').slice(0, 3)
      : [],
    tensionLevel: typeof data.tension_level === 'number' ? data.tension_level : 5,
    isEnding: Boolean(data.is_ending),
  };
}

function mapActionType(type: unknown): GameResponse['actionType'] {
  const typeMap: Record<string, GameResponse['actionType']> = {
    exploration: 'exploration',
    interaction: 'social',
    social: 'social',
    technical: 'technical',
    skill_check: 'technical',
    combat: 'combat',
    dialogue: 'social',
  };

  if (typeof type === 'string' && type in typeMap) {
    return typeMap[type];
  }
  return 'other';
}

function parseItemsAdded(items: unknown): Item[] | undefined {
  if (!Array.isArray(items)) return undefined;

  const parsed: Item[] = [];
  for (const item of items) {
    if (typeof item === 'string') {
      parsed.push({
        name: item,
        description: 'Un objet',
        itemType: 'tool',
      });
    } else if (typeof item === 'object' && item !== null) {
      const i = item as Record<string, unknown>;
      parsed.push({
        name: String(i.name || i.id || 'Unknown'),
        description: String(i.description || 'Un objet'),
        itemType: mapItemType(i.item_type || i.itemType),
        statBonus: parseStatBonus(i.stat_bonus || i.statBonus),
        uses: typeof i.uses === 'number' ? i.uses : undefined,
      });
    }
  }

  return parsed.length > 0 ? parsed : undefined;
}

function mapItemType(type: unknown): Item['itemType'] {
  const typeMap: Record<string, Item['itemType']> = {
    tool: 'tool',
    weapon: 'weapon',
    consumable: 'consumable',
    key_item: 'keyItem',
    keyItem: 'keyItem',
    data: 'data',
  };

  if (typeof type === 'string' && type in typeMap) {
    return typeMap[type];
  }
  return 'tool';
}

function parseStatBonus(bonus: unknown): Item['statBonus'] | undefined {
  if (!bonus || typeof bonus !== 'object') return undefined;

  const b = bonus as Record<string, unknown>;

  // Handle {"stat": bonus} format
  for (const key of ['FOR', 'INT', 'CHA']) {
    if (typeof b[key] === 'number') {
      return { stat: key as 'FOR' | 'INT' | 'CHA', bonus: b[key] as number };
    }
  }

  // Handle {stat: "FOR", bonus: 1} format
  if (typeof b.stat === 'string' && typeof b.bonus === 'number') {
    const stat = b.stat.toUpperCase();
    if (stat === 'FOR' || stat === 'INT' || stat === 'CHA') {
      return { stat, bonus: b.bonus };
    }
  }

  return undefined;
}

/**
 * Parse world generation response into Scenario.
 */
export function parseScenario(responseText: string): Scenario {
  const data = extractJson(responseText);
  if (!data) {
    throw new ParseError(`Could not extract JSON from response: ${responseText.slice(0, 300)}`);
  }

  // Parse locations
  const locationsArray = data.locations as Array<Record<string, unknown>> || [];
  const locations: Record<string, Location> = {};

  for (const loc of locationsArray) {
    const name = String(loc.name || loc.id || 'Unknown');

    // Parse items in location
    const items: string[] = [];
    if (Array.isArray(loc.items)) {
      for (const item of loc.items) {
        if (typeof item === 'string') {
          items.push(item);
        } else if (typeof item === 'object' && item !== null) {
          items.push((item as Record<string, unknown>).name as string || 'Unknown item');
        }
      }
    }

    locations[name] = {
      name,
      description: String(loc.description || ''),
      connections: Array.isArray(loc.connections)
        ? loc.connections.map(c => String(c))
        : [],
      secrets: Array.isArray(loc.secrets) ? loc.secrets.map(s => String(s)) : [],
      npcs: [],
      dangers: Array.isArray(loc.threats) ? loc.threats.map(t => String(t)) : [],
      discovered: loc.id === data.starting_location,
    };
  }

  // Parse NPCs and assign to locations
  const npcsArray = data.npcs as Array<Record<string, unknown>> || [];
  const npcs: Record<string, NPC> = {};

  for (const npc of npcsArray) {
    const name = String(npc.name || 'Unknown');
    const locationId = String(npc.location || '');

    npcs[name] = {
      name,
      description: String(npc.description || ''),
      disposition: mapDisposition(npc.disposition),
      location: locationId,
    };

    // Add NPC to location
    const locName = Object.keys(locations).find(key =>
      key.toLowerCase().replace(/\s+/g, '_') === locationId.toLowerCase().replace(/\s+/g, '_')
    );
    if (locName && locations[locName]) {
      locations[locName].npcs.push(name);
    }
  }

  // Parse secrets
  const secretsArray = data.secrets as Array<Record<string, unknown>> || [];
  const secrets = secretsArray.map(s => String(s.revelation || s.description || ''));

  // Get starting location
  const startingLocationId = String(data.starting_location || Object.keys(locations)[0] || '');
  const startingLocation = Object.keys(locations).find(key =>
    key.toLowerCase().replace(/\s+/g, '_') === startingLocationId.toLowerCase().replace(/\s+/g, '_')
  ) || Object.keys(locations)[0];

  // Mark starting location as discovered
  if (startingLocation && locations[startingLocation]) {
    locations[startingLocation].discovered = true;
  }

  return {
    title: String(data.title || 'Sans titre'),
    intro: String(data.premise || ''),
    setting: String(data.setting_name || data.setting_type || 'Unknown'),
    locations,
    npcs,
    secrets,
    victoryCondition: typeof data.victory_condition === 'object'
      ? String((data.victory_condition as Record<string, unknown>).description || 'Survivre et s\'échapper')
      : String(data.victory_condition || 'Survivre et s\'échapper'),
  };
}

function mapDisposition(disp: unknown): NPC['disposition'] {
  const map: Record<string, NPC['disposition']> = {
    friendly: 'friendly',
    fearful: 'neutral',
    neutral: 'neutral',
    hostile: 'hostile',
    unpredictable: 'hostile',
  };

  if (typeof disp === 'string' && disp in map) {
    return map[disp];
  }
  return 'neutral';
}

/**
 * Parse action assessment response.
 */
export function parseActionAssessment(responseText: string): {
  requiresRoll: boolean;
  difficulty: number | null;
  relevantStat: 'FOR' | 'INT' | 'CHA' | null;
  suggestedModifier: number;
  reasoning: string;
} {
  const data = extractJson(responseText);

  if (!data) {
    // Default to requiring a roll if we can't parse
    return {
      requiresRoll: true,
      difficulty: 12,
      relevantStat: 'INT',
      suggestedModifier: 0,
      reasoning: 'Évaluation par défaut',
    };
  }

  const stat = String(data.relevant_stat || '').toUpperCase();
  const validStat = stat === 'FOR' || stat === 'INT' || stat === 'CHA' ? stat : null;

  return {
    requiresRoll: Boolean(data.requires_roll ?? true),
    difficulty: typeof data.difficulty === 'number' ? data.difficulty : null,
    relevantStat: validStat,
    suggestedModifier: typeof data.suggested_modifier === 'number' ? data.suggested_modifier : 0,
    reasoning: String(data.reasoning || ''),
  };
}

/**
 * Create a short summary of a narrative for event history.
 */
export function summarizeNarrative(narrative: string, maxLength: number = 100): string {
  // Take first sentence or truncate
  const sentences = narrative.split('.');
  if (sentences.length > 0) {
    const summary = sentences[0].trim();
    if (summary.length > maxLength) {
      return summary.slice(0, maxLength - 3) + '...';
    }
    return summary;
  }

  if (narrative.length > maxLength) {
    return narrative.slice(0, maxLength - 3) + '...';
  }
  return narrative;
}
