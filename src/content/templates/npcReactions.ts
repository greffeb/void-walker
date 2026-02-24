// ---------------------------------------------------------------------------
// src/content/templates/npcReactions.ts — NPC reaction snippets (Layer 7)
// ---------------------------------------------------------------------------
// NPC reactions based on disposition + action outcome.
// ---------------------------------------------------------------------------

import type { NpcReactionSnippet } from '../../narration/types';

// === HOSTILE ===

const HOSTILE_REACTIONS: readonly NpcReactionSnippet[] = [
  { id: 'npc_h_cs_01', disposition: 'hostile', outcome: 'crit_success', text: { fr: "{npc_name} recule, visiblement ébranlé. Pour la première fois, la peur passe dans son regard.", en: '' } },
  { id: 'npc_h_cs_02', disposition: 'hostile', outcome: 'crit_success', text: { fr: "{npc_name} gronde de frustration devant votre réussite.", en: '' } },
  { id: 'npc_h_s_01', disposition: 'hostile', outcome: 'success', text: { fr: "{npc_name} observe votre succès avec une hostilité à peine contenue.", en: '' } },
  { id: 'npc_h_s_02', disposition: 'hostile', outcome: 'success', text: { fr: "Les yeux de {npc_name} se plissent. Votre compétence le met mal à l'aise.", en: '' } },
  { id: 'npc_h_p_01', disposition: 'hostile', outcome: 'partial', text: { fr: "{npc_name} ricane à mi-voix. Pas assez bien, semble-t-il dire.", en: '' } },
  { id: 'npc_h_f_01', disposition: 'hostile', outcome: 'failure', text: { fr: "Un sourire mauvais étire les lèvres de {npc_name}. Votre échec le réjouit.", en: '' } },
  { id: 'npc_h_f_02', disposition: 'hostile', outcome: 'failure', text: { fr: "{npc_name} éclate d'un rire cruel.", en: '' } },
  { id: 'npc_h_cf_01', disposition: 'hostile', outcome: 'crit_failure', text: { fr: "{npc_name} savoure votre échec avec une joie non dissimulée.", en: '' } },
  { id: 'npc_h_cf_02', disposition: 'hostile', outcome: 'crit_failure', text: { fr: "Votre désastre arrache un sourire satisfait à {npc_name}.", en: '' } },
  { id: 'npc_h_as_01', disposition: 'hostile', outcome: 'auto_success', text: { fr: "{npc_name} vous observe avec méfiance.", en: '' } },
];

// === NEUTRAL ===

const NEUTRAL_REACTIONS: readonly NpcReactionSnippet[] = [
  { id: 'npc_n_cs_01', disposition: 'neutral', outcome: 'crit_success', text: { fr: "{npc_name} hausse un sourcil, impressionné malgré lui.", en: '' } },
  { id: 'npc_n_cs_02', disposition: 'neutral', outcome: 'crit_success', text: { fr: "Un hochement de tête approbateur de {npc_name}.", en: '' } },
  { id: 'npc_n_s_01', disposition: 'neutral', outcome: 'success', text: { fr: "{npc_name} observe le résultat sans commenter.", en: '' } },
  { id: 'npc_n_s_02', disposition: 'neutral', outcome: 'success', text: { fr: "{npc_name} acquiesce silencieusement.", en: '' } },
  { id: 'npc_n_p_01', disposition: 'neutral', outcome: 'partial', text: { fr: "{npc_name} penche la tête, évaluant votre résultat mitigé.", en: '' } },
  { id: 'npc_n_f_01', disposition: 'neutral', outcome: 'failure', text: { fr: "{npc_name} détourne le regard. Pas de commentaire.", en: '' } },
  { id: 'npc_n_f_02', disposition: 'neutral', outcome: 'failure', text: { fr: "Le visage de {npc_name} reste impassible face à votre échec.", en: '' } },
  { id: 'npc_n_cf_01', disposition: 'neutral', outcome: 'crit_failure', text: { fr: "{npc_name} grimace imperceptiblement.", en: '' } },
  { id: 'npc_n_as_01', disposition: 'neutral', outcome: 'auto_success', text: { fr: "{npc_name} ne montre aucune réaction particulière.", en: '' } },
];

// === FRIENDLY ===

const FRIENDLY_REACTIONS: readonly NpcReactionSnippet[] = [
  { id: 'npc_f_cs_01', disposition: 'friendly', outcome: 'crit_success', text: { fr: "{npc_name} laisse échapper un sifflement admiratif.", en: '' } },
  { id: 'npc_f_cs_02', disposition: 'friendly', outcome: 'crit_success', text: { fr: "Les yeux de {npc_name} s'illuminent. « Impressionnant. »", en: '' } },
  { id: 'npc_f_s_01', disposition: 'friendly', outcome: 'success', text: { fr: "{npc_name} hoche la tête avec un sourire encourageant.", en: '' } },
  { id: 'npc_f_s_02', disposition: 'friendly', outcome: 'success', text: { fr: "« Bien joué », murmure {npc_name}.", en: '' } },
  { id: 'npc_f_p_01', disposition: 'friendly', outcome: 'partial', text: { fr: "{npc_name} pose une main sur votre épaule. « C'est un début. »", en: '' } },
  { id: 'npc_f_p_02', disposition: 'friendly', outcome: 'partial', text: { fr: "{npc_name} grimace avec sympathie.", en: '' } },
  { id: 'npc_f_f_01', disposition: 'friendly', outcome: 'failure', text: { fr: "{npc_name} vous lance un regard compatissant. « On essaiera autrement. »", en: '' } },
  { id: 'npc_f_f_02', disposition: 'friendly', outcome: 'failure', text: { fr: "« Pas grave », dit {npc_name} sans conviction.", en: '' } },
  { id: 'npc_f_cf_01', disposition: 'friendly', outcome: 'crit_failure', text: { fr: "{npc_name} se précipite vers vous, inquiet.", en: '' } },
  { id: 'npc_f_cf_02', disposition: 'friendly', outcome: 'crit_failure', text: { fr: "Le visage de {npc_name} se décompose. « Ça va ? »", en: '' } },
  { id: 'npc_f_as_01', disposition: 'friendly', outcome: 'auto_success', text: { fr: "{npc_name} vous suit du regard avec bienveillance.", en: '' } },
];

// === FRIGHTENED ===

const FRIGHTENED_REACTIONS: readonly NpcReactionSnippet[] = [
  { id: 'npc_fr_cs_01', disposition: 'frightened', outcome: 'crit_success', text: { fr: "{npc_name} écarquille les yeux, partagé entre le soulagement et la stupeur.", en: '' } },
  { id: 'npc_fr_s_01', disposition: 'frightened', outcome: 'success', text: { fr: "{npc_name} laisse échapper un soupir de soulagement.", en: '' } },
  { id: 'npc_fr_s_02', disposition: 'frightened', outcome: 'success', text: { fr: "Les mains tremblantes de {npc_name} se détendent légèrement.", en: '' } },
  { id: 'npc_fr_p_01', disposition: 'frightened', outcome: 'partial', text: { fr: "{npc_name} se recroqueville davantage. Ce n'est pas assez pour se sentir en sécurité.", en: '' } },
  { id: 'npc_fr_f_01', disposition: 'frightened', outcome: 'failure', text: { fr: "La panique dans les yeux de {npc_name} s'intensifie.", en: '' } },
  { id: 'npc_fr_f_02', disposition: 'frightened', outcome: 'failure', text: { fr: "{npc_name} gémit doucement, au bord de la panique.", en: '' } },
  { id: 'npc_fr_cf_01', disposition: 'frightened', outcome: 'crit_failure', text: { fr: "{npc_name} pousse un cri de terreur et recule contre le mur.", en: '' } },
  { id: 'npc_fr_as_01', disposition: 'frightened', outcome: 'auto_success', text: { fr: "{npc_name} surveille nerveusement les environs.", en: '' } },
];

/** All NPC reaction snippets */
export const NPC_REACTION_SNIPPETS: readonly NpcReactionSnippet[] = [
  ...HOSTILE_REACTIONS,
  ...NEUTRAL_REACTIONS,
  ...FRIENDLY_REACTIONS,
  ...FRIGHTENED_REACTIONS,
];
