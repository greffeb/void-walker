// ---------------------------------------------------------------------------
// src/i18n/locales/fr.ts — French locale (primary)
// ---------------------------------------------------------------------------

import type { LocaleStrings } from '../types';

export const fr: LocaleStrings = {
  // UI chrome
  'ui.play': 'Jouer',
  'ui.newGame': 'Nouvelle partie',
  'ui.continue': 'Continuer',
  'ui.settings': 'Paramètres',
  'ui.quit': 'Quitter',
  'ui.back': 'Retour',
  'ui.confirm': 'Confirmer',
  'ui.cancel': 'Annuler',
  'ui.loading': 'Chargement...',
  'ui.save': 'Sauvegarder',
  'ui.load': 'Charger',

  // Character creation
  'creation.title': 'Création de personnage',
  'creation.chooseName': 'Choisissez un nom',
  'creation.chooseClass': 'Choisissez une classe',
  'creation.distributePoints': 'Distribuez vos points',
  'creation.bonusPoints': 'Points bonus',
  'creation.start': 'Commencer',

  // Stats
  'stat.FOR': 'Force',
  'stat.AGI': 'Agilité',
  'stat.INT': 'Intelligence',
  'stat.PER': 'Perception',
  'stat.CHA': 'Charisme',
  'stat.LCK': 'Chance',
  'stat.FOR.description': 'Puissance brute, dégâts de mêlée, force physique',
  'stat.AGI.description': 'Vitesse, évasion, discrétion, initiative au combat',
  'stat.INT.description': 'Actions techniques, piratage, réparation, résolution de puzzles',
  'stat.PER.description': 'Observation, détection, conscience de l\'environnement',
  'stat.CHA.description': 'Persuasion, intimidation, tromperie, interactions sociales',
  'stat.LCK.description': 'Bonus passif à tous les jets, qualité du butin, événements aléatoires',

  // Classes
  'class.marine': 'Marine',
  'class.engineer': 'Ingénieur',
  'class.medic': 'Médecin',
  'class.marine.description': 'Spécialiste du combat. Fort et résistant, mais limité en technique.',
  'class.engineer.description': 'Expert technique. Peut pirater, réparer et saboter, mais fragile au combat.',
  'class.medic.description': 'Spécialiste du soutien. Soigne les blessures et stabilise l\'équipe.',

  // Difficulty
  'difficulty.explorer': 'Explorateur',
  'difficulty.survivor': 'Survivant',
  'difficulty.nightmare': 'Cauchemar',
  'difficulty.explorer.description': 'Pour découvrir l\'histoire. Combats faciles, pas de permadeath.',
  'difficulty.survivor.description': 'L\'expérience standard. Tension et danger constants.',
  'difficulty.nightmare.description': 'Permadeath. Chaque erreur peut être fatale. Bonne chance.',

  // Game
  'game.turn': 'Tour',
  'game.hp': 'PV',
  'game.oxygen': 'Oxygène',
  'game.inventory': 'Inventaire',
  'game.action': 'Action',
  'game.roll': 'Jet',
  'game.success': 'Réussite',
  'game.failure': 'Échec',
  'game.critical': 'Critique !',
  'game.fumble': 'Fumble !',
};
