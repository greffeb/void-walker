// ---------------------------------------------------------------------------
// src/i18n/locales/en.ts — English locale
// ---------------------------------------------------------------------------

import type { LocaleStrings } from '../types';

export const en: LocaleStrings = {
  // UI chrome
  'ui.play': 'Play',
  'ui.newGame': 'New Game',
  'ui.continue': 'Continue',
  'ui.settings': 'Settings',
  'ui.quit': 'Quit',
  'ui.back': 'Back',
  'ui.confirm': 'Confirm',
  'ui.cancel': 'Cancel',
  'ui.loading': 'Loading...',
  'ui.save': 'Save',
  'ui.load': 'Load',

  // Character creation
  'creation.title': 'Character Creation',
  'creation.chooseName': 'Choose a name',
  'creation.chooseClass': 'Choose a class',
  'creation.distributePoints': 'Distribute your points',
  'creation.bonusPoints': 'Bonus points',
  'creation.start': 'Start',

  // Stats
  'stat.FOR': 'Strength',
  'stat.AGI': 'Agility',
  'stat.INT': 'Intelligence',
  'stat.PER': 'Perception',
  'stat.CHA': 'Charisma',
  'stat.LCK': 'Luck',
  'stat.FOR.description': 'Raw power, melee damage, physical force',
  'stat.AGI.description': 'Speed, evasion, stealth, combat initiative',
  'stat.INT.description': 'Technical actions, hacking, repair, puzzle-solving',
  'stat.PER.description': 'Observation, detection, environmental awareness',
  'stat.CHA.description': 'Persuasion, intimidation, deception, social interactions',
  'stat.LCK.description': 'Passive bonus to all rolls, loot quality, random events',

  // Classes
  'class.marine': 'Marine',
  'class.engineer': 'Engineer',
  'class.medic': 'Medic',
  'class.marine.description': 'Combat specialist. Strong and tough, but limited in technical skills.',
  'class.engineer.description': 'Technical expert. Can hack, repair and sabotage, but fragile in combat.',
  'class.medic.description': 'Support specialist. Heals wounds and stabilizes the team.',

  // Difficulty
  'difficulty.explorer': 'Explorer',
  'difficulty.survivor': 'Survivor',
  'difficulty.nightmare': 'Nightmare',
  'difficulty.explorer.description': 'For discovering the story. Easy combat, no permadeath.',
  'difficulty.survivor.description': 'The standard experience. Constant tension and danger.',
  'difficulty.nightmare.description': 'Permadeath. Every mistake can be fatal. Good luck.',

  // Game
  'game.turn': 'Turn',
  'game.hp': 'HP',
  'game.oxygen': 'Oxygen',
  'game.inventory': 'Inventory',
  'game.action': 'Action',
  'game.roll': 'Roll',
  'game.success': 'Success',
  'game.failure': 'Failure',
  'game.critical': 'Critical!',
  'game.fumble': 'Fumble!',
};
