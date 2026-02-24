// ---------------------------------------------------------------------------
// src/content/templates/conditions.ts — Player state snippets (Layer 5)
// ---------------------------------------------------------------------------
// Describes how the player's physical condition affects them in-narrative.
// ---------------------------------------------------------------------------

import type { PlayerStateSnippet } from '../../narration/types';

// === LOW HP (< 30%) ===

const LOW_HP_SNIPPETS: readonly PlayerStateSnippet[] = [
  { id: 'ps_lhp_01', type: 'low_hp', text: { fr: "La douleur pulse dans votre corps à chaque battement de cœur.", en: '' } },
  { id: 'ps_lhp_02', type: 'low_hp', text: { fr: "Votre vision se brouille par intermittence. Rester debout est un exploit.", en: '' } },
  { id: 'ps_lhp_03', type: 'low_hp', text: { fr: "Du sang coule le long de votre bras. Pas le temps de s'en occuper.", en: '' } },
  { id: 'ps_lhp_04', type: 'low_hp', text: { fr: "Chaque mouvement vous coûte. Votre corps proteste et menace de vous lâcher.", en: '' } },
  { id: 'ps_lhp_05', type: 'low_hp', text: { fr: "Les bords de votre champ visuel s'assombrissent. Pas bon signe.", en: '' } },
  { id: 'ps_lhp_06', type: 'low_hp', text: { fr: "Un goût de fer dans la bouche. Vos mains tremblent.", en: '' } },
];

// === MILD FATIGUE (30-50% HP) ===

const MILD_FATIGUE_SNIPPETS: readonly PlayerStateSnippet[] = [
  { id: 'ps_mf_01', type: 'mild_fatigue', text: { fr: "La fatigue commence à se faire sentir. Vos gestes sont un peu moins précis.", en: '' } },
  { id: 'ps_mf_02', type: 'mild_fatigue', text: { fr: "Des élancements sourds parcourent vos muscles malmenés.", en: '' } },
  { id: 'ps_mf_03', type: 'mild_fatigue', text: { fr: "Vous respirez plus fort qu'avant. Le corps accuse les coups.", en: '' } },
  { id: 'ps_mf_04', type: 'mild_fatigue', text: { fr: "Une douleur lancinante vous rappelle que vous n'êtes pas invulnérable.", en: '' } },
];

// === CONDITION-SPECIFIC ===

const CONDITION_SNIPPETS: readonly PlayerStateSnippet[] = [
  // wounded
  { id: 'ps_c_wounded_01', type: 'condition', condition: 'wounded', text: { fr: "Votre blessure saigne encore. Il faudrait la traiter.", en: '' } },
  { id: 'ps_c_wounded_02', type: 'condition', condition: 'wounded', text: { fr: "La plaie tire à chaque mouvement. Vous serrez les dents.", en: '' } },
  { id: 'ps_c_wounded_03', type: 'condition', condition: 'wounded', text: { fr: "Le pansement improvisé tient à peine. Du sang s'infiltre entre les bandes.", en: '' } },

  // terrified
  { id: 'ps_c_terrified_01', type: 'condition', condition: 'terrified', text: { fr: "La peur vous étreint. Vos mains refusent de rester stables.", en: '' } },
  { id: 'ps_c_terrified_02', type: 'condition', condition: 'terrified', text: { fr: "Votre cœur bat si fort qu'il doit être audible dans le couloir.", en: '' } },
  { id: 'ps_c_terrified_03', type: 'condition', condition: 'terrified', text: { fr: "L'adrénaline vous donne des ailes, mais la terreur les plombe.", en: '' } },

  // cold
  { id: 'ps_c_cold_01', type: 'condition', condition: 'cold', text: { fr: "Le froid s'insinue dans vos articulations. Vos doigts s'engourdissent.", en: '' } },
  { id: 'ps_c_cold_02', type: 'condition', condition: 'cold', text: { fr: "Vous grelottez. Impossible de garder les mains stables.", en: '' } },

  // poisoned
  { id: 'ps_c_poisoned_01', type: 'condition', condition: 'poisoned', text: { fr: "La nausée monte par vagues. Le poison fait son œuvre.", en: '' } },
  { id: 'ps_c_poisoned_02', type: 'condition', condition: 'poisoned', text: { fr: "Votre peau a pris une teinte grisâtre. Les toxines circulent.", en: '' } },

  // exhausted
  { id: 'ps_c_exhausted_01', type: 'condition', condition: 'exhausted', text: { fr: "L'épuisement vous submerge. Chaque pas demande un effort de volonté.", en: '' } },
  { id: 'ps_c_exhausted_02', type: 'condition', condition: 'exhausted', text: { fr: "Vos paupières sont lourdes. Le corps réclame du repos que vous ne pouvez pas lui accorder.", en: '' } },
];

/** All player state snippets */
export const PLAYER_STATE_SNIPPETS: readonly PlayerStateSnippet[] = [
  ...LOW_HP_SNIPPETS,
  ...MILD_FATIGUE_SNIPPETS,
  ...CONDITION_SNIPPETS,
];
