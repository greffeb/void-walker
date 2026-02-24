// ---------------------------------------------------------------------------
// src/content/templates/atmosphere.ts — Atmosphere snippets (Layer 4)
// ---------------------------------------------------------------------------
// Setting-specific atmosphere text by tension tier.
// ---------------------------------------------------------------------------

import type { AtmosphereSnippet } from '../../narration/types';

// === DERELICT SHIP ===

const DERELICT_ATMOSPHERE: readonly AtmosphereSnippet[] = [
  // Low tension
  { id: 'atm_ds_l_01', setting: 'derelict_ship', tensionTier: 'low', text: { fr: "Le vaisseau craque doucement autour de vous, comme un vieillard dans son sommeil.", en: '' } },
  { id: 'atm_ds_l_02', setting: 'derelict_ship', tensionTier: 'low', text: { fr: "Pour l'instant, le calme règne. C'est presque pire.", en: '' } },
  { id: 'atm_ds_l_03', setting: 'derelict_ship', tensionTier: 'low', text: { fr: "Le vaisseau dérive. Vous aussi.", en: '' } },
  { id: 'atm_ds_l_04', setting: 'derelict_ship', tensionTier: 'low', text: { fr: "Un silence relatif. Les systèmes automatiques ronronnent, indifférents.", en: '' } },

  // Mid tension
  { id: 'atm_ds_m_01', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Quelque part dans les entrailles du vaisseau, un métal grince. Pas le vent — il n'y a pas de vent ici.", en: '' } },
  { id: 'atm_ds_m_02', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Les néons clignotent. Un, deux, trois secondes d'obscurité. Puis la lumière revient. Pour l'instant.", en: '' } },
  { id: 'atm_ds_m_03', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "L'horloge du vaisseau affiche une heure impossible. Personne n'a réglé la date depuis longtemps.", en: '' } },
  { id: 'atm_ds_m_04', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Un courant d'air glacé traverse le couloir. La ventilation ne devrait pas souffler dans cette direction.", en: '' } },
  { id: 'atm_ds_m_05', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Vous avez l'impression d'être observé. Difficulté de calibration de vos sens, ou instinct de survie.", en: '' } },

  // High tension
  { id: 'atm_ds_h_01', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Le vaisseau tremble. Les vibrations remontent dans vos os comme un présage.", en: '' } },
  { id: 'atm_ds_h_02', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Les alarmes se sont tues. Ce qui les a déclenchées, non.", en: '' } },
  { id: 'atm_ds_h_03', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Votre pouls bat dans vos tempes. Chaque seconde d'inaction est un luxe que vous ne pouvez pas vous permettre.", en: '' } },
  { id: 'atm_ds_h_04', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Quelque chose approche. Vous ne l'avez pas encore vu, mais votre corps le sait.", en: '' } },

  // Climax
  { id: 'atm_ds_c_01', setting: 'derelict_ship', tensionTier: 'climax', text: { fr: "C'est maintenant ou jamais. Le vaisseau est en train de mourir autour de vous.", en: '' } },
  { id: 'atm_ds_c_02', setting: 'derelict_ship', tensionTier: 'climax', text: { fr: "La structure gémit. Les cloisons se déforment. Le temps est compté.", en: '' } },
  { id: 'atm_ds_c_03', setting: 'derelict_ship', tensionTier: 'climax', text: { fr: "Tout converge vers ce moment. L'air vibre d'une tension insoutenable.", en: '' } },
];

// === ALIEN RUINS ===

const RUINS_ATMOSPHERE: readonly AtmosphereSnippet[] = [
  // Low tension
  { id: 'atm_ar_l_01', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "Les ruines sont silencieuses. Un silence ancien, patient, qui n'a rien d'humain.", en: '' } },
  { id: 'atm_ar_l_02', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "La lumière bioluminescente pulse doucement. Presque hypnotique.", en: '' } },
  { id: 'atm_ar_l_03', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "Cet endroit existe depuis des millénaires. Votre présence est insignifiante.", en: '' } },

  // Mid tension
  { id: 'atm_ar_m_01', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "Les symboles sur les murs semblent réagir à votre présence. Ils brillent plus fort quand vous approchez.", en: '' } },
  { id: 'atm_ar_m_02', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "Un son bas, presque inaudible, résonne dans les ruines. Comme un chant lointain dans une langue morte.", en: '' } },
  { id: 'atm_ar_m_03', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "L'architecture est impossible. Des escaliers mènent nulle part. Des portes s'ouvrent sur des murs.", en: '' } },
  { id: 'atm_ar_m_04', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "La température change brusquement d'un mètre à l'autre. Quelque chose perturbe les lois de la physique ici.", en: '' } },

  // High tension
  { id: 'atm_ar_h_01', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "Les murs organiques se contractent. Les ruines s'éveillent.", en: '' } },
  { id: 'atm_ar_h_02', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "Quelque chose de très ancien vient de remarquer votre existence.", en: '' } },
  { id: 'atm_ar_h_03', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "Vos pensées se brouillent. Les ruines chuchotent dans une fréquence que votre cerveau ne devrait pas percevoir.", en: '' } },

  // Climax
  { id: 'atm_ar_c_01', setting: 'alien_ruins', tensionTier: 'climax', text: { fr: "Les ruines vibrent d'une énergie primordiale. Ce qui dormait ici se réveille.", en: '' } },
  { id: 'atm_ar_c_02', setting: 'alien_ruins', tensionTier: 'climax', text: { fr: "Le voile entre les dimensions se déchire. La réalité n'est plus qu'une suggestion.", en: '' } },
];

// === SPACE STATION ===

const STATION_ATMOSPHERE: readonly AtmosphereSnippet[] = [
  // Low tension
  { id: 'atm_ss_l_01', setting: 'space_station', tensionTier: 'low', text: { fr: "La station bourdonne de ses mille systèmes. Un organisme mécanique en pilote automatique.", en: '' } },
  { id: 'atm_ss_l_02', setting: 'space_station', tensionTier: 'low', text: { fr: "Par le hublot, les étoiles sont immobiles. Le temps semble suspendu.", en: '' } },
  { id: 'atm_ss_l_03', setting: 'space_station', tensionTier: 'low', text: { fr: "Le calme de la station est artificiel. Manufacturé. Comme tout le reste ici.", en: '' } },

  // Mid tension
  { id: 'atm_ss_m_01', setting: 'space_station', tensionTier: 'mid', text: { fr: "Un message automatique résonne dans les haut-parleurs. Il tourne en boucle depuis des heures.", en: '' } },
  { id: 'atm_ss_m_02', setting: 'space_station', tensionTier: 'mid', text: { fr: "Les portes automatiques s'ouvrent et se ferment sans raison apparente. La station a ses propres priorités.", en: '' } },
  { id: 'atm_ss_m_03', setting: 'space_station', tensionTier: 'mid', text: { fr: "Des traces de sang séché forment un chemin vers un sas. Quelqu'un a essayé de fuir.", en: '' } },
  { id: 'atm_ss_m_04', setting: 'space_station', tensionTier: 'mid', text: { fr: "L'IA de la station marmonne des diagnostics incompréhensibles. Sa voix synthétique est presque rassurante.", en: '' } },

  // High tension
  { id: 'atm_ss_h_01', setting: 'space_station', tensionTier: 'high', text: { fr: "Les systèmes de survie émettent des alertes en cascade. La station se meurt, module par module.", en: '' } },
  { id: 'atm_ss_h_02', setting: 'space_station', tensionTier: 'high', text: { fr: "La gravité artificielle fluctue. Vos pas deviennent incertains, légers, puis trop lourds.", en: '' } },
  { id: 'atm_ss_h_03', setting: 'space_station', tensionTier: 'high', text: { fr: "Un compte à rebours s'affiche sur chaque écran. Vous ne savez pas ce qui se passera quand il atteindra zéro.", en: '' } },

  // Climax
  { id: 'atm_ss_c_01', setting: 'space_station', tensionTier: 'climax', text: { fr: "La station est en train de se désintégrer. Les explosions se rapprochent.", en: '' } },
  { id: 'atm_ss_c_02', setting: 'space_station', tensionTier: 'climax', text: { fr: "Plus de temps. Plus de marge. Chaque décision est la dernière chance.", en: '' } },
];

/** All atmosphere snippets */
export const ATMOSPHERE_SNIPPETS: readonly AtmosphereSnippet[] = [
  ...DERELICT_ATMOSPHERE,
  ...RUINS_ATMOSPHERE,
  ...STATION_ATMOSPHERE,
];
