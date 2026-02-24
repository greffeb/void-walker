// ---------------------------------------------------------------------------
// src/content/templates/hints.ts — Gameplay hint templates (Layer 4 alt)
// ---------------------------------------------------------------------------
// Location-aware tips that replace atmosphere after 4+ turns in one place.
// ---------------------------------------------------------------------------

import type { GameplayHintTemplate } from '../../narration/types';

/** Gameplay hint templates by category */
export const HINT_TEMPLATES: readonly GameplayHintTemplate[] = [
  // === INTERACTABLE ITEM ===
  { id: 'hint_item_01', category: 'interactable_item', text: { fr: "Un objet attire votre attention. Ça pourrait être utile.", en: '' } },
  { id: 'hint_item_02', category: 'interactable_item', text: { fr: "Quelque chose brille faiblement dans un recoin. Ça vaut le détour.", en: '' } },
  { id: 'hint_item_03', category: 'interactable_item', text: { fr: "Vous remarquez un objet que vous n'aviez pas vu avant.", en: '' } },
  { id: 'hint_item_04', category: 'interactable_item', text: { fr: "Il y a quelque chose par terre. Peut-être abandonné intentionnellement.", en: '' } },
  { id: 'hint_item_05', category: 'interactable_item', text: { fr: "Un élément de l'environnement semble manipulable.", en: '' } },

  // === SEARCHABLE AREA ===
  { id: 'hint_search_01', category: 'searchable_area', text: { fr: "Cet endroit mérite une inspection plus approfondie.", en: '' } },
  { id: 'hint_search_02', category: 'searchable_area', text: { fr: "Vous avez le sentiment d'avoir manqué quelque chose ici.", en: '' } },
  { id: 'hint_search_03', category: 'searchable_area', text: { fr: "Un panneau mal fixé suggère un compartiment derrière.", en: '' } },
  { id: 'hint_search_04', category: 'searchable_area', text: { fr: "L'endroit cache peut-être des ressources que vous n'avez pas encore trouvées.", en: '' } },
  { id: 'hint_search_05', category: 'searchable_area', text: { fr: "Des marques au sol indiquent que quelqu'un a déplacé quelque chose récemment.", en: '' } },

  // === EXIT VISIBLE ===
  { id: 'hint_exit_01', category: 'exit_visible', text: { fr: "Un passage mène plus loin. Vous ne l'avez pas encore exploré.", en: '' } },
  { id: 'hint_exit_02', category: 'exit_visible', text: { fr: "La sortie est là, mais l'avez-vous remarquée ?", en: '' } },
  { id: 'hint_exit_03', category: 'exit_visible', text: { fr: "Il y a un chemin que vous n'avez pas emprunté.", en: '' } },
  { id: 'hint_exit_04', category: 'exit_visible', text: { fr: "Un couloir s'ouvre dans une direction que vous n'avez pas encore explorée.", en: '' } },
  { id: 'hint_exit_05', category: 'exit_visible', text: { fr: "Vous pourriez avancer. Rester ici ne changera rien.", en: '' } },

  // === EXIT HIDDEN ===
  { id: 'hint_hidden_01', category: 'exit_hidden', text: { fr: "Quelque chose ne colle pas dans l'architecture de cette pièce. Les dimensions sont... fausses.", en: '' } },
  { id: 'hint_hidden_02', category: 'exit_hidden', text: { fr: "Un courant d'air vient de là où il ne devrait pas y en avoir.", en: '' } },
  { id: 'hint_hidden_03', category: 'exit_hidden', text: { fr: "Les plans que vous avez consultés montrent un espace non comptabilisé derrière ce mur.", en: '' } },
  { id: 'hint_hidden_04', category: 'exit_hidden', text: { fr: "La ventilation aspire de l'air vers un endroit qui n'apparaît sur aucun plan.", en: '' } },

  // === NPC STATE ===
  { id: 'hint_npc_01', category: 'npc_state', text: { fr: "Quelqu'un dans les environs semble vouloir vous parler.", en: '' } },
  { id: 'hint_npc_02', category: 'npc_state', text: { fr: "Le comportement d'une personne proche a changé. Ça vaut la peine d'investiguer.", en: '' } },
  { id: 'hint_npc_03', category: 'npc_state', text: { fr: "Vous captez un regard furtif. Quelqu'un attend quelque chose de vous.", en: '' } },

  // === ENVIRONMENTAL CHANGE ===
  { id: 'hint_env_01', category: 'environmental_change', text: { fr: "L'environnement a changé depuis votre arrivée. Les conditions ne sont plus les mêmes.", en: '' } },
  { id: 'hint_env_02', category: 'environmental_change', text: { fr: "Quelque chose est différent ici. L'air, la lumière — quelque chose a bougé.", en: '' } },
  { id: 'hint_env_03', category: 'environmental_change', text: { fr: "Les conditions environnementales se sont modifiées. Adaptez-vous.", en: '' } },
];
