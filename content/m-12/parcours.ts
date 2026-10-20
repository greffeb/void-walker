import type { Parcours } from '../types';

export const PARCOURS_REPARATION_M12: Parcours = {
  nom: 'M-12 — Panne, remise sur rail, détour sous menace et réarmement',
  etapes: [
    { action: 'envoyer', cible: 'drone' },
    { action: 'aller', cible: 'porte', vers: 'galerie_drone' },
    { action: 'aller', cible: 'porte', vers: 'atelier_drone' },
    { action: 'aller', cible: 'porte', vers: 'poste_drone' },
    { action: 'replacer', cible: 'drone' },
    { action: 'aller', cible: 'porte', vers: 'stockage' },
    { action: 'attendre', cible: 'stockage' },
    { action: 'aller', cible: 'porte', vers: 'poste_drone' },
    { action: 'fermer', cible: 'porte', vers: 'stockage' },
    { action: 'rearmer', cible: 'drone' },
    { action: 'aller', cible: 'porte', vers: 'palier_chariot' },
    { action: 'deplacer', cible: 'chariot', parametre: 'dans_rangement' },
    { action: 'aller', cible: 'porte', vers: 'quai_chariot' },
    { action: 'ouvrir', cible: 'porte', vers: 'embarquement' },
    { action: 'fermer', cible: 'porte', vers: 'palier_chariot' },
    { action: 'aller', cible: 'porte', vers: 'embarquement' },
    { action: 'ouvrir', cible: 'ecoutille', vers: 'cabine' },
    { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
    { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
    { action: 'lancer', cible: 'pupitre' },
  ],
  attendu: { piece: 'cabine', objetsIci: ['pupitre'], inventaire: [], passagesOuverts: [], issue: 'evacuation', sante: 'critique', actions: 20 },
};

export const PARCOURS_M12: readonly Parcours[] = [{
  nom: 'M-12 — Fermer la réserve, coopérer avec le drone, évacuer',
  etapes: [
    { action: 'aller', cible: 'porte', vers: 'poste_drone' },
    { action: 'fermer', cible: 'porte', vers: 'stockage' },
    { action: 'aller', cible: 'porte', vers: 'atelier_drone' },
    { action: 'envoyer', cible: 'drone' },
    { action: 'aller', cible: 'porte', vers: 'galerie_drone' },
    { action: 'aller', cible: 'porte', vers: 'palier_chariot' },
    { action: 'deplacer', cible: 'chariot', parametre: 'dans_rangement' },
    { action: 'aller', cible: 'porte', vers: 'quai_chariot' },
    { action: 'ouvrir', cible: 'porte', vers: 'embarquement' },
    { action: 'aller', cible: 'porte', vers: 'embarquement' },
    { action: 'ouvrir', cible: 'ecoutille', vers: 'cabine' },
    { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
    { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
    { action: 'lancer', cible: 'pupitre' },
  ],
  attendu: { piece: 'cabine', objetsIci: ['pupitre'], inventaire: [], passagesOuverts: [], issue: 'evacuation', sante: 'indemne', sansDe: true, actions: 14 },
}, PARCOURS_REPARATION_M12];
