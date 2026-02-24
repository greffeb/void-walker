// ---------------------------------------------------------------------------
// src/content/templates/environmental.ts — Consequence snippets (Layer 3)
// ---------------------------------------------------------------------------
// Narrate state changes triggered by the consequence engine.
// ---------------------------------------------------------------------------

import type { ConsequenceSnippet } from '../../narration/types';

/** Consequence snippets indexed by state change type */
export const CONSEQUENCE_SNIPPETS: readonly ConsequenceSnippet[] = [
  // === HP CHANGE ===
  { id: 'con_hp_loss_01', stateChangeType: 'hp_loss', text: { fr: "Vous sentez la douleur irradier à travers votre corps.", en: '' } },
  { id: 'con_hp_loss_02', stateChangeType: 'hp_loss', text: { fr: "Le choc provoque une onde de douleur sourde.", en: '' } },
  { id: 'con_hp_loss_03', stateChangeType: 'hp_loss', text: { fr: "Vous encaissez le coup. Du sang perle.", en: '' } },
  { id: 'con_hp_gain_01', stateChangeType: 'hp_gain', text: { fr: "La douleur recule. Votre corps se répare, lentement.", en: '' } },
  { id: 'con_hp_gain_02', stateChangeType: 'hp_gain', text: { fr: "Un soupir de soulagement. Ça va mieux.", en: '' } },

  // === OXYGEN CHANGE ===
  { id: 'con_o2_loss_01', stateChangeType: 'oxygen_loss', text: { fr: "L'air se raréfie. Chaque inspiration demande plus d'effort.", en: '' } },
  { id: 'con_o2_loss_02', stateChangeType: 'oxygen_loss', text: { fr: "Votre réserve d'oxygène diminue. Le temps est compté.", en: '' } },
  { id: 'con_o2_gain_01', stateChangeType: 'oxygen_gain', text: { fr: "De l'air frais emplit vos poumons. Les points noirs devant vos yeux disparaissent.", en: '' } },

  // === ITEM CHANGES ===
  { id: 'con_item_gain_01', stateChangeType: 'item_gained', text: { fr: "Un nouvel objet s'ajoute à votre inventaire.", en: '' } },
  { id: 'con_item_gain_02', stateChangeType: 'item_gained', text: { fr: "Vous rangez l'objet soigneusement. Ça pourrait servir.", en: '' } },
  { id: 'con_item_lost_01', stateChangeType: 'item_lost', text: { fr: "L'objet vous échappe et disparaît dans l'obscurité.", en: '' } },
  { id: 'con_item_lost_02', stateChangeType: 'item_lost', text: { fr: "Vous ne reverrez pas cet objet. Il est perdu.", en: '' } },
  { id: 'con_item_broken_01', stateChangeType: 'item_broken', text: { fr: "L'objet se brise avec un craquement sinistre.", en: '' } },
  { id: 'con_item_broken_02', stateChangeType: 'item_broken', text: { fr: "Les morceaux tombent au sol. Irréparable.", en: '' } },

  // === CONDITION CHANGES ===
  { id: 'con_cond_gain_01', stateChangeType: 'condition_gained', text: { fr: "Quelque chose a changé dans votre état. Vous le sentez dans vos os.", en: '' } },
  { id: 'con_cond_gain_02', stateChangeType: 'condition_gained', text: { fr: "Un nouveau symptôme s'installe. Pas le moment d'y penser.", en: '' } },
  { id: 'con_cond_lost_01', stateChangeType: 'condition_removed', text: { fr: "Le poids sur vos épaules s'allège. Vous allez mieux.", en: '' } },
  { id: 'con_cond_lost_02', stateChangeType: 'condition_removed', text: { fr: "L'effet s'estompe enfin. Votre corps vous remercie.", en: '' } },

  // === ENVIRONMENT CHANGES ===
  { id: 'con_env_dark_01', stateChangeType: 'lights_off', text: { fr: "Les lumières s'éteignent. L'obscurité est immédiate et totale.", en: '' } },
  { id: 'con_env_dark_02', stateChangeType: 'lights_off', text: { fr: "Un claquement sec et le noir vous engloutit.", en: '' } },
  { id: 'con_env_light_01', stateChangeType: 'lights_on', text: { fr: "La lumière revient, aveuglante après l'obscurité.", en: '' } },
  { id: 'con_env_fire_01', stateChangeType: 'fire_started', text: { fr: "Des flammes jaillissent. La chaleur est immédiate.", en: '' } },
  { id: 'con_env_fire_02', stateChangeType: 'fire_started', text: { fr: "L'incendie se propage avec une rapidité alarmante.", en: '' } },
  { id: 'con_env_fire_ext_01', stateChangeType: 'fire_extinguished', text: { fr: "Les flammes meurent dans un sifflement. De la fumée âcre s'élève.", en: '' } },
  { id: 'con_env_depress_01', stateChangeType: 'depressurized', text: { fr: "La brèche aspire l'air avec violence. Les objets non arrimés s'envolent vers le vide.", en: '' } },
  { id: 'con_env_flood_01', stateChangeType: 'flooded', text: { fr: "L'eau s'engouffre par la brèche. Le niveau monte vite.", en: '' } },

  // === DOOR/PATH CHANGES ===
  { id: 'con_door_open_01', stateChangeType: 'door_opened', text: { fr: "Le passage s'ouvre. De nouvelles possibilités se révèlent.", en: '' } },
  { id: 'con_door_open_02', stateChangeType: 'door_opened', text: { fr: "Un clic, un glissement. Le chemin est libre.", en: '' } },
  { id: 'con_door_lock_01', stateChangeType: 'door_locked', text: { fr: "Le verrou s'enclenche avec un bruit définitif.", en: '' } },
  { id: 'con_door_lock_02', stateChangeType: 'door_locked', text: { fr: "La porte se verrouille. Pas de retour en arrière.", en: '' } },
  { id: 'con_path_reveal_01', stateChangeType: 'path_revealed', text: { fr: "Un passage jusque-là invisible se révèle.", en: '' } },

  // === COMBAT CHANGES ===
  { id: 'con_combat_start_01', stateChangeType: 'combat_started', text: { fr: "Le combat s'engage. Plus le temps de réfléchir.", en: '' } },
  { id: 'con_combat_end_01', stateChangeType: 'combat_ended', text: { fr: "Le combat est terminé. Le silence revient, assourdissant.", en: '' } },
  { id: 'con_enemy_down_01', stateChangeType: 'enemy_defeated', text: { fr: "La menace est neutralisée. Pour l'instant.", en: '' } },
  { id: 'con_enemy_down_02', stateChangeType: 'enemy_defeated', text: { fr: "L'adversaire s'effondre. Le danger n'est pas écarté pour autant.", en: '' } },

  // === NPC CHANGES ===
  { id: 'con_npc_disp_01', stateChangeType: 'npc_disposition_changed', text: { fr: "Quelque chose vient de changer dans la dynamique entre vous.", en: '' } },
  { id: 'con_npc_disp_02', stateChangeType: 'npc_disposition_changed', text: { fr: "Le regard de votre interlocuteur a changé. À vous de déterminer si c'est en bien.", en: '' } },
  { id: 'con_npc_fled_01', stateChangeType: 'npc_fled', text: { fr: "Votre interlocuteur prend la fuite sans un mot de plus.", en: '' } },
  { id: 'con_npc_joined_01', stateChangeType: 'npc_joined', text: { fr: "Un allié de plus. Dans cette situation, chaque allié compte.", en: '' } },

  // === STALKER CLOCK ===
  { id: 'con_stalker_01', stateChangeType: 'stalker_advanced', text: { fr: "Quelque chose se rapproche. Vous le sentez.", en: '' } },
  { id: 'con_stalker_02', stateChangeType: 'stalker_advanced', text: { fr: "Un frisson parcourt votre échine. Pas le froid. L'instinct.", en: '' } },
  { id: 'con_stalker_03', stateChangeType: 'stalker_advanced', text: { fr: "Le danger se resserre autour de vous comme un étau invisible.", en: '' } },

  // === GENERIC ===
  { id: 'con_generic_01', stateChangeType: 'generic', text: { fr: "L'environnement a changé. Restez sur vos gardes.", en: '' } },
  { id: 'con_generic_02', stateChangeType: 'generic', text: { fr: "Le monde autour de vous s'est modifié. Rien n'est permanent ici.", en: '' } },
];
