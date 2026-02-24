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

  // === RISING ===
  { id: 'th_rising_01', beat: 'rising', text: { fr: "Les anomalies s'accumulent. Coïncidence ou schéma ?", en: '' } },
  { id: 'th_rising_02', beat: 'rising', text: { fr: "Quelque chose ne va pas. Les indices sont là, éparpillés, attendant d'être assemblés.", en: '' } },
  { id: 'th_rising_03', beat: 'rising', text: { fr: "Un bruit dans les conduits. Trop gros pour être un rat. Trop régulier pour être le hasard.", en: '' } },
  { id: 'th_rising_04', beat: 'rising', text: { fr: "Les caméras de sécurité ont cessé de fonctionner. L'une après l'autre.", en: '' } },
  { id: 'th_rising_05', beat: 'rising', text: { fr: "Des traces sur le sol. Pas humaines. Pas anciennes.", en: '' } },

  // === MIDPOINT ===
  { id: 'th_mid_01', beat: 'midpoint', text: { fr: "Le schéma se révèle. Ce n'est pas aléatoire — c'est délibéré.", en: '' } },
  { id: 'th_mid_02', beat: 'midpoint', text: { fr: "Vous commencez à comprendre la nature de la menace. L'ignorance était plus confortable.", en: '' } },
  { id: 'th_mid_03', beat: 'midpoint', text: { fr: "Les pièces du puzzle s'assemblent. L'image qu'elles forment est terrifiante.", en: '' } },
  { id: 'th_mid_04', beat: 'midpoint', text: { fr: "La menace a un nom maintenant. Ça ne la rend pas moins dangereuse.", en: '' } },

  // === ESCALATION ===
  { id: 'th_esc_01', beat: 'escalation', text: { fr: "Il n'y a plus d'ambiguïté. La menace est réelle, proche, et elle sait que vous êtes là.", en: '' } },
  { id: 'th_esc_02', beat: 'escalation', text: { fr: "Les options se réduisent. Les sorties se ferment une à une.", en: '' } },
  { id: 'th_esc_03', beat: 'escalation', text: { fr: "La traque s'intensifie. Vous n'êtes plus le chasseur.", en: '' } },
  { id: 'th_esc_04', beat: 'escalation', text: { fr: "Chaque seconde d'inaction profite à la menace.", en: '' } },
  { id: 'th_esc_05', beat: 'escalation', text: { fr: "La situation se détériore à une vitesse alarmante.", en: '' } },

  // === CLIMAX ===
  { id: 'th_climax_01', beat: 'climax', text: { fr: "C'est maintenant. Pas de seconde chance.", en: '' } },
  { id: 'th_climax_02', beat: 'climax', text: { fr: "La menace est là. Face à vous. Impossible de fuir.", en: '' } },
  { id: 'th_climax_03', beat: 'climax', text: { fr: "Tout converge vers ce moment. Il n'y aura pas de meilleur timing.", en: '' } },
  { id: 'th_climax_04', beat: 'climax', text: { fr: "L'affrontement final est inévitable. Soyez prêt.", en: '' } },

  // === RESOLUTION ===
  { id: 'th_res_01', beat: 'resolution', text: { fr: "Le danger immédiat est passé. Mais le silence qui suit est lourd de sens.", en: '' } },
  { id: 'th_res_02', beat: 'resolution', text: { fr: "Le calme revient. Temporaire, comme toujours.", en: '' } },
  { id: 'th_res_03', beat: 'resolution', text: { fr: "Les échos de la crise résonnent encore. Vous êtes en vie. C'est un début.", en: '' } },
];
