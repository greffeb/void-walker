// ---------------------------------------------------------------------------
// src/content/templates/threats.ts — Threat hint snippets (Layer 6)
// ---------------------------------------------------------------------------
// Subtle foreshadowing that scales with story beat.
// ---------------------------------------------------------------------------

import type { ThreatHintSnippet } from '../../narration/types';

/** Threat hint snippets indexed by story beat */
export const THREAT_HINT_SNIPPETS: readonly ThreatHintSnippet[] = [
  // === INTRO ===
  { id: 'th_intro_01', beat: 'intro', text: { fr: "Un détail cloche, mais impossible de mettre le doigt dessus.", en: '' } },
  { id: 'th_intro_02', beat: 'intro', text: { fr: "Tout semble normal. C'est justement ce qui vous inquiète.", en: '' } },
  { id: 'th_intro_03', beat: 'intro', text: { fr: "Les systèmes affichent des valeurs nominales. Trop nominales.", en: '' } },
  { id: 'th_intro_04', beat: 'intro', text: { fr: "Un mauvais pressentiment s'installe, inexplicable mais tenace.", en: '' } },
  { id: 'th_intro_05', beat: 'intro', text: { fr: "Le silence ici a une texture. Épaisse. Presque solide.", en: '' } },
  { id: 'th_intro_06', beat: 'intro', text: { fr: "Quelque chose a changé récemment. Les traces sont fraîches.", en: '' } },
  { id: 'th_intro_07', beat: 'intro', text: { fr: "Vos sens sont en alerte malgré l'absence de danger visible.", en: '' } },
  { id: 'th_intro_08', beat: 'intro', text: { fr: "L'atmosphère est chargée d'une tension imperceptible, comme l'air avant l'orage.", en: '' } },

  // === RISING ===
  { id: 'th_rising_01', beat: 'rising', text: { fr: "Les anomalies s'accumulent. Coïncidence ou schéma ?", en: '' } },
  { id: 'th_rising_02', beat: 'rising', text: { fr: "Quelque chose ne va pas. Les indices sont là, éparpillés, attendant d'être assemblés.", en: '' } },
  { id: 'th_rising_03', beat: 'rising', text: { fr: "Un bruit dans les conduits. Trop gros pour être un rat. Trop régulier pour être le hasard.", en: '' } },
  { id: 'th_rising_04', beat: 'rising', text: { fr: "Les caméras de sécurité ont cessé de fonctionner. L'une après l'autre.", en: '' } },
  { id: 'th_rising_05', beat: 'rising', text: { fr: "Des traces sur le sol. Pas humaines. Pas anciennes.", en: '' } },
  { id: 'th_rising_06', beat: 'rising', text: { fr: "Les systèmes de détection donnent des lectures contradictoires. Comme si quelque chose brouillait les capteurs.", en: '' } },
  { id: 'th_rising_07', beat: 'rising', text: { fr: "Un journal de maintenance s'arrête en pleine phrase. L'auteur a été interrompu.", en: '' } },
  { id: 'th_rising_08', beat: 'rising', text: { fr: "Les animaux domestiques restants refusent d'approcher certaines zones. L'instinct ne ment pas.", en: '' } },
  { id: 'th_rising_09', beat: 'rising', text: { fr: "La fréquence des pannes augmente. Ce n'est pas de l'usure — c'est du sabotage.", en: '' } },
  { id: 'th_rising_10', beat: 'rising', text: { fr: "Un cadavre récent. La cause de la mort ne correspond à rien de connu.", en: '' } },

  // === MIDPOINT ===
  { id: 'th_mid_01', beat: 'midpoint', text: { fr: "Le schéma se révèle. Ce n'est pas aléatoire — c'est délibéré.", en: '' } },
  { id: 'th_mid_02', beat: 'midpoint', text: { fr: "Vous commencez à comprendre la nature de la menace. L'ignorance était plus confortable.", en: '' } },
  { id: 'th_mid_03', beat: 'midpoint', text: { fr: "Les pièces du puzzle s'assemblent. L'image qu'elles forment est terrifiante.", en: '' } },
  { id: 'th_mid_04', beat: 'midpoint', text: { fr: "La menace a un nom maintenant. Ça ne la rend pas moins dangereuse.", en: '' } },
  { id: 'th_mid_05', beat: 'midpoint', text: { fr: "Ce que vous avez pris pour des incidents isolés fait partie d'un plan plus vaste.", en: '' } },
  { id: 'th_mid_06', beat: 'midpoint', text: { fr: "La vérité se dessine, brutale. Rien ici n'est un accident.", en: '' } },
  { id: 'th_mid_07', beat: 'midpoint', text: { fr: "Vous n'êtes pas le premier à avoir découvert la menace. Les précédents n'ont pas survécu.", en: '' } },
  { id: 'th_mid_08', beat: 'midpoint', text: { fr: "La menace s'adapte. Elle apprend de chaque interaction. Le temps joue contre vous.", en: '' } },

  // === ESCALATION ===
  { id: 'th_esc_01', beat: 'escalation', text: { fr: "Il n'y a plus d'ambiguïté. La menace est réelle, proche, et elle sait que vous êtes là.", en: '' } },
  { id: 'th_esc_02', beat: 'escalation', text: { fr: "Les options se réduisent. Les sorties se ferment une à une.", en: '' } },
  { id: 'th_esc_03', beat: 'escalation', text: { fr: "La traque s'intensifie. Vous n'êtes plus le chasseur.", en: '' } },
  { id: 'th_esc_04', beat: 'escalation', text: { fr: "Chaque seconde d'inaction profite à la menace.", en: '' } },
  { id: 'th_esc_05', beat: 'escalation', text: { fr: "La situation se détériore à une vitesse alarmante.", en: '' } },
  { id: 'th_esc_06', beat: 'escalation', text: { fr: "La menace ne se cache plus. Elle vous traque ouvertement.", en: '' } },
  { id: 'th_esc_07', beat: 'escalation', text: { fr: "Vos alliés tombent un par un. Bientôt, vous serez seul.", en: '' } },
  { id: 'th_esc_08', beat: 'escalation', text: { fr: "Le piège se referme. Chaque chemin semble mener vers elle.", en: '' } },
  { id: 'th_esc_09', beat: 'escalation', text: { fr: "La créature a appris vos habitudes. Vos anciens refuges ne sont plus sûrs.", en: '' } },

  // === CLIMAX ===
  { id: 'th_climax_01', beat: 'climax', text: { fr: "C'est maintenant. Pas de seconde chance.", en: '' } },
  { id: 'th_climax_02', beat: 'climax', text: { fr: "La menace est là. Face à vous. Impossible de fuir.", en: '' } },
  { id: 'th_climax_03', beat: 'climax', text: { fr: "Tout converge vers ce moment. Il n'y aura pas de meilleur timing.", en: '' } },
  { id: 'th_climax_04', beat: 'climax', text: { fr: "L'affrontement final est inévitable. Soyez prêt.", en: '' } },
  { id: 'th_climax_05', beat: 'climax', text: { fr: "Le point de non-retour est franchi. Seule l'action compte désormais.", en: '' } },
  { id: 'th_climax_06', beat: 'climax', text: { fr: "Vaincre ou périr. Il n'y a plus de troisième option.", en: '' } },
  { id: 'th_climax_07', beat: 'climax', text: { fr: "La menace révèle sa forme finale. Tout ce qui précédait n'était qu'un prélude.", en: '' } },
  { id: 'th_climax_08', beat: 'climax', text: { fr: "Votre survie se joue dans les prochaines secondes. Pas les prochaines minutes — les prochaines secondes.", en: '' } },

  // === RESOLUTION ===
  { id: 'th_res_01', beat: 'resolution', text: { fr: "Le danger immédiat est passé. Mais le silence qui suit est lourd de sens.", en: '' } },
  { id: 'th_res_02', beat: 'resolution', text: { fr: "Le calme revient. Temporaire, comme toujours.", en: '' } },
  { id: 'th_res_03', beat: 'resolution', text: { fr: "Les échos de la crise résonnent encore. Vous êtes en vie. C'est un début.", en: '' } },
  { id: 'th_res_04', beat: 'resolution', text: { fr: "Les cicatrices de l'affrontement sont partout. Dans les murs. Dans votre esprit.", en: '' } },
  { id: 'th_res_05', beat: 'resolution', text: { fr: "Vous avez survécu. Mais à quel prix ?", en: '' } },
  { id: 'th_res_06', beat: 'resolution', text: { fr: "La menace s'est dissipée. Ou bien elle attend simplement le bon moment pour revenir.", en: '' } },
];
