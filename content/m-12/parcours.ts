import type { Parcours } from '../types';

// Station d'essai `m-12` : départ dans la galerie, drone tiré dans l'atelier (graine 1 ; seule place hors du départ et du repaire), créature dans la réserve ouverte sur le palier.
export const PARCOURS_REPARATION_M12: Parcours = {
  nom: 'M-12 — Réserve laissée ouverte, drone renversé dans la galerie, redressé et relancé sous menace, fuite',
  etapes: [
    { action: 'aller', cible: 'porte', vers: 'palier_chariot' },
    { action: 'aller', cible: 'porte', vers: 'galerie_drone' },
    { action: 'aller', cible: 'porte', vers: 'atelier_drone' },
    { action: 'envoyer', cible: 'drone' },
    { action: 'attendre', cible: 'atelier_drone' },
    { action: 'attendre', cible: 'atelier_drone' },
    { action: 'aller', cible: 'porte', vers: 'galerie_drone' },
    { action: 'replacer', cible: 'drone' },
    { action: 'rearmer', cible: 'drone' },
    { action: 'aller', cible: 'porte', vers: 'palier_chariot' },
    { action: 'fermer', cible: 'porte', vers: 'galerie_drone' },
    { action: 'aller', cible: 'porte', vers: 'quai_chariot' },
    { action: 'fermer', cible: 'porte', vers: 'palier_chariot' },
    { action: 'ouvrir', cible: 'porte', vers: 'embarquement' },
    { action: 'aller', cible: 'porte', vers: 'embarquement' },
    { action: 'ouvrir', cible: 'ecoutille', vers: 'cabine' },
    { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
    { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
    { action: 'lancer', cible: 'pupitre' },
  ],
  attendu: { piece: 'cabine', objetsIci: ['pupitre'], inventaire: [], passagesOuverts: [], issue: 'evacuation', sante: 'critique', actions: 19 },
};

export const PARCOURS_M12: readonly Parcours[] = [{
  nom: 'M-12 — Voir le chariot, fermer la réserve, envoyer le drone, évacuer',
  etapes: [
    { action: 'aller', cible: 'porte', vers: 'palier_chariot' },
    { action: 'fermer', cible: 'porte', vers: 'stockage' },
    { action: 'aller', cible: 'porte', vers: 'galerie_drone' },
    { action: 'aller', cible: 'porte', vers: 'atelier_drone' },
    { action: 'envoyer', cible: 'drone' },
    { action: 'attendre', cible: 'atelier_drone' },
    { action: 'attendre', cible: 'atelier_drone' },
    { action: 'attendre', cible: 'atelier_drone' },
    { action: 'attendre', cible: 'atelier_drone' },
    { action: 'aller', cible: 'porte', vers: 'galerie_drone' },
    { action: 'aller', cible: 'porte', vers: 'palier_chariot' },
    { action: 'aller', cible: 'porte', vers: 'quai_chariot' },
    { action: 'ouvrir', cible: 'porte', vers: 'embarquement' },
    { action: 'aller', cible: 'porte', vers: 'embarquement' },
    { action: 'ouvrir', cible: 'ecoutille', vers: 'cabine' },
    { action: 'aller', cible: 'ecoutille', vers: 'cabine' },
    { action: 'fermer', cible: 'ecoutille', vers: 'embarquement' },
    { action: 'lancer', cible: 'pupitre' },
  ],
  attendu: { piece: 'cabine', objetsIci: ['pupitre'], inventaire: [], passagesOuverts: [], issue: 'evacuation', sante: 'indemne', sansDe: true, actions: 18 },
}, PARCOURS_REPARATION_M12];
