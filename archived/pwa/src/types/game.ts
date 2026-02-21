// Core game types - ported from Python Pydantic models

export type StatName = 'FOR' | 'INT' | 'CHA';

export interface Stats {
  FOR: number; // 1-5, Force (strength/physical)
  INT: number; // 1-5, Intelligence (technical)
  CHA: number; // 1-5, Charisme (social)
}

export interface Item {
  name: string;
  description: string;
  itemType: 'tool' | 'weapon' | 'consumable' | 'keyItem' | 'data';
  statBonus?: {
    stat: StatName;
    bonus: number;
  };
  uses?: number; // For consumables
}

export interface Player {
  name: string;
  className: string;
  stats: Stats;
  maxHp: number;
  hp: number;
  oxygen: number; // 0-100
  inventory: Item[];
  statProgress: Record<StatName, number>; // XP per stat
}

export interface Location {
  name: string;
  description: string;
  connections: string[];
  secrets: string[];
  npcs: string[];
  dangers: string[];
  discovered: boolean;
}

export interface NPC {
  name: string;
  description: string;
  disposition: 'friendly' | 'neutral' | 'hostile';
  location: string;
}

export interface Scenario {
  title: string;
  intro: string;
  setting: string;
  locations: Record<string, Location>;
  npcs: Record<string, NPC>;
  secrets: string[];
  victoryCondition: string;
}

export type StoryBeat = 'intro' | 'rising' | 'midpoint' | 'escalation' | 'climax' | 'resolution';

export interface SessionProgress {
  currentScene: number;
  totalScenes: number;
  targetMinutes: number;
  objectivesCompleted: string[];
  hintsGiven: number;
  currentBeat: StoryBeat;
}

export interface GameState {
  sessionId: string;
  player: Player;
  scenario: Scenario;
  currentLocation: string;
  visitedLocations: string[];
  progress: SessionProgress;
  recentEvents: string[];
  turnNumber: number;
  startTime: string;
}

export type ActionType = 'exploration' | 'social' | 'technical' | 'combat' | 'other';

export interface StateChanges {
  hpChange?: number;
  oxygenChange?: number;
  locationChange?: string;
  itemsAdded?: Item[];
  itemsRemoved?: string[];
  objectivesCompleted?: string[];
}

export interface GameResponse {
  narrative: string;
  actionType: ActionType;
  requiresRoll: boolean;
  difficulty?: number; // 1-20
  relevantStat?: StatName; // For dice rolls
  suggestedModifier?: number; // -5 to +5
  stateChanges: StateChanges;
  suggestions: string[];
  tensionLevel: number; // 0-10
  isEnding: boolean;
  endingType?: 'victory' | 'defeat' | 'escape' | 'mystery_solved';
}

export interface DiceResult {
  roll: number; // 1-20 (natural roll)
  total: number; // roll + stat + modifier
  success: boolean;
  critical: boolean; // Natural 1 or 20
  stat: StatName;
  statValue: number;
  modifier: number;
  difficulty: number;
}

// Character class definitions
export interface CharacterClass {
  name: string;
  stats: Stats;
  hp: number;
  description: string;
  startingInventory: string[];
}

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    name: 'Technicien',
    stats: { FOR: 2, INT: 4, CHA: 2 },
    hp: 8,
    description: 'Expert en systèmes et réparations',
    startingInventory: ['Multitool', 'Scanner portable']
  },
  {
    name: 'Marine',
    stats: { FOR: 4, INT: 2, CHA: 2 },
    hp: 12,
    description: 'Combattant aguerri et endurant',
    startingInventory: ['Pistolet laser', 'Armure légère']
  },
  {
    name: 'Diplomate',
    stats: { FOR: 2, INT: 2, CHA: 4 },
    hp: 8,
    description: 'Négociateur et manipulateur',
    startingInventory: ['Traducteur universel', 'Communicateur crypté']
  },
  {
    name: 'Médecin',
    stats: { FOR: 2, INT: 3, CHA: 3 },
    hp: 10,
    description: 'Soigneur et scientifique',
    startingInventory: ['Kit médical', 'Stimulants']
  },
  {
    name: 'Pilote',
    stats: { FOR: 3, INT: 3, CHA: 2 },
    hp: 10,
    description: 'Polyvalent et adaptable',
    startingInventory: ['Combinaison de vol', 'Balise de détresse']
  }
];

// Game phase for UI state
export type GamePhase =
  | 'title'
  | 'api-key-setup'
  | 'character-creation'
  | 'scenario-generation'
  | 'playing'
  | 'dice-roll'
  | 'game-over';
