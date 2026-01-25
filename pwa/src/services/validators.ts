/**
 * Void Walker PWA - Response Validators
 *
 * Validates LLM responses and enforces pacing rules.
 * Ported from cli/void_walker/llm/validators.py
 */

import type { GameResponse, SessionProgress, GameState } from '../types/game';

// Tension ranges per story beat
const TENSION_RANGES: Record<string, [number, number]> = {
  intro: [2, 5],
  rising: [4, 7],
  midpoint: [5, 8],
  escalation: [6, 9],
  climax: [8, 10],
  resolution: [3, 7],
};

/**
 * Validate and potentially fix a game response.
 * Ensures the LLM respects session structure.
 */
export function validateGameResponse(
  response: GameResponse,
  progress: SessionProgress,
  state?: GameState
): GameResponse {
  const validated = { ...response };

  // CRITICAL: Prevent premature endings aggressively
  // Only allow endings in climax (last 15%) or resolution phase
  const minScenesForEnding = Math.max(3, Math.floor(progress.totalScenes * 0.85));

  if (validated.isEnding) {
    if (progress.currentScene < minScenesForEnding) {
      // Too early for any ending
      validated.isEnding = false;
    } else if (progress.currentBeat !== 'climax' && progress.currentBeat !== 'resolution') {
      // Wrong story beat for ending
      validated.isEnding = false;
    }
  }

  // Force ending on final scene
  if (progress.currentScene >= progress.totalScenes) {
    if (!validated.isEnding) {
      validated.isEnding = true;
      validated.narrative += '\n\n[Votre temps est écoulé...]';
    }
  }

  // Clamp tension to reasonable range for beat
  const [minT, maxT] = TENSION_RANGES[progress.currentBeat] || [1, 10];
  validated.tensionLevel = Math.max(minT, Math.min(maxT, validated.tensionLevel));

  // Ensure suggestions list has reasonable content
  if (!validated.suggestions || validated.suggestions.length === 0) {
    validated.suggestions = generateFallbackSuggestions(state);
  }

  // Limit suggestions to 3
  validated.suggestions = validated.suggestions.slice(0, 3);

  return validated;
}

/**
 * Generate context-aware fallback suggestions.
 */
function generateFallbackSuggestions(state?: GameState): string[] {
  if (!state) {
    // No context available, use generic suggestions
    return [
      'Explorer les environs',
      'Examiner l\'environnement',
      'Avancer prudemment',
    ];
  }

  const suggestions: string[] = [];

  // Suggestion 1: Objective-oriented
  suggestions.push(`Chercher des indices sur ${state.scenario?.victoryCondition || 'la menace'}`);

  // Suggestion 2: Location-based (prefer unvisited)
  const currentLoc = state.scenario?.locations[state.currentLocation];
  if (currentLoc) {
    const unvisited = currentLoc.connections.filter(
      conn => !state.visitedLocations.includes(conn)
    );
    if (unvisited.length > 0) {
      const exitLoc = state.scenario?.locations[unvisited[0]];
      suggestions.push(`Explorer vers ${exitLoc?.name || unvisited[0]}`);
    } else if (currentLoc.connections.length > 0) {
      const exitLoc = state.scenario?.locations[currentLoc.connections[0]];
      suggestions.push(`Se diriger vers ${exitLoc?.name || currentLoc.connections[0]}`);
    } else {
      suggestions.push('Examiner les alentours attentivement');
    }

    // Suggestion 3: Interaction-based
    if (currentLoc.secrets.length > 0) {
      suggestions.push('Fouiller la zone pour des indices');
    } else if (currentLoc.npcs.length > 0) {
      suggestions.push(`Parler à ${currentLoc.npcs[0]}`);
    } else {
      suggestions.push('Inspecter l\'environnement');
    }
  } else {
    suggestions.push('Examiner les alentours');
    suggestions.push('Chercher une sortie');
  }

  return suggestions;
}

/**
 * Calculate the story beat based on progress percentage.
 */
export function calculateStoryBeat(currentScene: number, totalScenes: number): SessionProgress['currentBeat'] {
  const percentage = (currentScene / totalScenes) * 100;

  if (percentage < 10) return 'intro';
  if (percentage < 45) return 'rising';
  if (percentage < 55) return 'midpoint';
  if (percentage < 85) return 'escalation';
  if (percentage < 95) return 'climax';
  return 'resolution';
}

/**
 * Validate that a scenario is winnable (basic check).
 */
export function validateScenario(scenario: GameState['scenario']): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!scenario) {
    return { valid: false, issues: ['Scenario is null'] };
  }

  // Check minimum locations
  const locationCount = Object.keys(scenario.locations).length;
  if (locationCount < 3) {
    issues.push(`Too few locations: ${locationCount} (minimum 3)`);
  }

  // Check starting location exists
  const startExists = Object.values(scenario.locations).some(loc => loc.discovered);
  if (!startExists) {
    issues.push('No starting location marked as discovered');
  }

  // Check for orphaned locations (no connections)
  for (const [name, location] of Object.entries(scenario.locations)) {
    if (location.connections.length === 0) {
      // Check if any other location connects to this one
      const hasIncomingConnection = Object.values(scenario.locations).some(
        other => other.connections.includes(name)
      );
      if (!hasIncomingConnection) {
        issues.push(`Orphaned location: ${name}`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Check if HP is critically low (warning threshold).
 */
export function isHpCritical(hp: number, maxHp: number): boolean {
  return hp <= Math.ceil(maxHp * 0.25);
}

/**
 * Check if oxygen is critically low (warning threshold).
 */
export function isOxygenCritical(oxygen: number): boolean {
  return oxygen <= 25;
}
