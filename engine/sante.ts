import type { Des } from './des';
import { creatureEnVue, type EtatPartie } from './etat';
import type { Cause, Danger, Evenement, NiveauRisque, Sante } from './vocabulaire';

// Blessures, soin et interception (C-04 §2 à §4).

/** D-055 : un D6 ; de 1 à 3, une aggravation. */
const FACES = 6;
const ATTEINT_JUSQUA = 3;

const APRES_AGGRAVATION: Readonly<Record<Exclude<Sante, 'vaincu'>, Exclude<Sante, 'indemne'>>> = {
  indemne: 'blesse',
  blesse: 'critique',
  critique: 'vaincu',
};

const EVENEMENT_AGGRAVATION = {
  blesse: 'aggravation_blesse',
  critique: 'aggravation_critique',
  vaincu: 'defaite',
} as const;

/**
 * Le passager commence l'action sous les yeux de la créature, répit passé : elle peut l'intercepter (C-04 §4, D-183) ; pas
 * depuis l'alcôve, ni après une glissade tant qu'elle a des réactions perdues (C-03 §5.2).
 */
export function expose(etat: EtatPartie): boolean {
  const creature = etat.creature;
  return creature !== null && creatureEnVue(etat) && creature.contact && !creature.repit && creature.perdues === 0;
}

/** Le jet d'interception, enregistré (D-055) : vrai si elle l'atteint. */
export function intercepter(des: Des): boolean {
  return des.lancer(FACES) <= ATTEINT_JUSQUA;
}

/** Au plus une aggravation pour l'action, quelles qu'en soient les causes, toutes conservées (C-04 §3, D-053). */
export function aggraver(etat: EtatPartie, causes: readonly Cause[]): { etat: EtatPartie; evenements: Evenement[] } {
  if (causes.length === 0 || etat.sante === 'vaincu') return { etat, evenements: [] };
  const sante = APRES_AGGRAVATION[etat.sante];
  return { etat: { ...etat, sante }, evenements: [{ type: EVENEMENT_AGGRAVATION[sante], causes }] };
}

/** Risque connu d'agir sous ses yeux, selon la santé qu'il aura au moment du jet : élevé, mortel si une blessure de plus serait fatale (C-04 §4.3). */
export function risqueIci(etat: EtatPartie, sante: Sante): { risque: NiveauRisque; danger: Danger } | null {
  if (!expose(etat)) return null;
  return sante === 'critique' ? { risque: 'mortel', danger: { type: 'interception_mortelle' } } : { risque: 'eleve', danger: { type: 'interception' } };
}
