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
  { id: 'atm_ds_l_05', setting: 'derelict_ship', tensionTier: 'low', text: { fr: "La poussière flotte dans un rayon de lumière artificielle. Personne ne l'a dérangée depuis longtemps.", en: '' } },
  { id: 'atm_ds_l_06', setting: 'derelict_ship', tensionTier: 'low', text: { fr: "Un écran de contrôle affiche des données obsolètes. L'équipage n'est plus là pour les lire.", en: '' } },
  { id: 'atm_ds_l_07', setting: 'derelict_ship', tensionTier: 'low', text: { fr: "L'odeur de métal froid et de lubrifiant usé imprègne chaque recoin.", en: '' } },
  { id: 'atm_ds_l_08', setting: 'derelict_ship', tensionTier: 'low', text: { fr: "Vos pas résonnent dans le couloir vide. L'écho est votre seule compagnie.", en: '' } },

  // Mid tension
  { id: 'atm_ds_m_01', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Quelque part dans les entrailles du vaisseau, un métal grince. Pas le vent — il n'y a pas de vent ici.", en: '' } },
  { id: 'atm_ds_m_02', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Les néons clignotent. Un, deux, trois secondes d'obscurité. Puis la lumière revient. Pour l'instant.", en: '' } },
  { id: 'atm_ds_m_03', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "L'horloge du vaisseau affiche une heure impossible. Personne n'a réglé la date depuis longtemps.", en: '' } },
  { id: 'atm_ds_m_04', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Un courant d'air glacé traverse le couloir. La ventilation ne devrait pas souffler dans cette direction.", en: '' } },
  { id: 'atm_ds_m_05', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Vous avez l'impression d'être observé. Difficulté de calibration de vos sens, ou instinct de survie.", en: '' } },
  { id: 'atm_ds_m_06', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Un panneau d'accès pend, arraché de ses gonds. Quelque chose est passé par là.", en: '' } },
  { id: 'atm_ds_m_07', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Le recycleur d'air émet un sifflement intermittent. Comme un souffle rauque dans le silence.", en: '' } },
  { id: 'atm_ds_m_08', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Des câbles pendent du plafond éventré. Le vaisseau montre ses entrailles.", en: '' } },
  { id: 'atm_ds_m_09', setting: 'derelict_ship', tensionTier: 'mid', text: { fr: "Une tache sombre sur la cloison. Rouille ou autre chose — vous préférez ne pas savoir.", en: '' } },

  // High tension
  { id: 'atm_ds_h_01', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Le vaisseau tremble. Les vibrations remontent dans vos os comme un présage.", en: '' } },
  { id: 'atm_ds_h_02', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Les alarmes se sont tues. Ce qui les a déclenchées, non.", en: '' } },
  { id: 'atm_ds_h_03', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Votre pouls bat dans vos tempes. Chaque seconde d'inaction est un luxe que vous ne pouvez pas vous permettre.", en: '' } },
  { id: 'atm_ds_h_04', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Quelque chose approche. Vous ne l'avez pas encore vu, mais votre corps le sait.", en: '' } },
  { id: 'atm_ds_h_05', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "L'éclairage d'urgence baigne tout en rouge sang. Les ombres dansent sur les cloisons.", en: '' } },
  { id: 'atm_ds_h_06', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Un impact sourd résonne dans la coque. Puis un autre plus proche.", en: '' } },
  { id: 'atm_ds_h_07', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "La pression atmosphérique chute. Quelque part, une brèche s'ouvre lentement.", en: '' } },
  { id: 'atm_ds_h_08', setting: 'derelict_ship', tensionTier: 'high', text: { fr: "Des griffures profondes marquent le sol métallique. Elles mènent dans votre direction.", en: '' } },

  // Climax
  { id: 'atm_ds_c_01', setting: 'derelict_ship', tensionTier: 'climax', text: { fr: "C'est maintenant ou jamais. Le vaisseau est en train de mourir autour de vous.", en: '' } },
  { id: 'atm_ds_c_02', setting: 'derelict_ship', tensionTier: 'climax', text: { fr: "La structure gémit. Les cloisons se déforment. Le temps est compté.", en: '' } },
  { id: 'atm_ds_c_03', setting: 'derelict_ship', tensionTier: 'climax', text: { fr: "Tout converge vers ce moment. L'air vibre d'une tension insoutenable.", en: '' } },
  { id: 'atm_ds_c_04', setting: 'derelict_ship', tensionTier: 'climax', text: { fr: "Le réacteur hurle. La coque se fissure. Chaque seconde est empruntée au néant.", en: '' } },
  { id: 'atm_ds_c_05', setting: 'derelict_ship', tensionTier: 'climax', text: { fr: "Les lumières meurent une à une. Bientôt, il ne restera que l'obscurité.", en: '' } },
];

// === ALIEN RUINS ===

const RUINS_ATMOSPHERE: readonly AtmosphereSnippet[] = [
  // Low tension
  { id: 'atm_ar_l_01', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "Les ruines sont silencieuses. Un silence ancien, patient, qui n'a rien d'humain.", en: '' } },
  { id: 'atm_ar_l_02', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "La lumière bioluminescente pulse doucement. Presque hypnotique.", en: '' } },
  { id: 'atm_ar_l_03', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "Cet endroit existe depuis des millénaires. Votre présence est insignifiante.", en: '' } },
  { id: 'atm_ar_l_04', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "Des spores luminescentes dérivent dans l'air immobile. Leur trajectoire défie la gravité.", en: '' } },
  { id: 'atm_ar_l_05', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "Les parois organiques respirent imperceptiblement. Un rythme lent, millénaire.", en: '' } },
  { id: 'atm_ar_l_06', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "La roche ici n'est pas minérale. Elle est douce, tiède, presque vivante.", en: '' } },
  { id: 'atm_ar_l_07', setting: 'alien_ruins', tensionTier: 'low', text: { fr: "Des motifs fractals couvrent chaque surface. Leur complexité donne le vertige.", en: '' } },

  // Mid tension
  { id: 'atm_ar_m_01', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "Les symboles sur les murs semblent réagir à votre présence. Ils brillent plus fort quand vous approchez.", en: '' } },
  { id: 'atm_ar_m_02', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "Un son bas, presque inaudible, résonne dans les ruines. Comme un chant lointain dans une langue morte.", en: '' } },
  { id: 'atm_ar_m_03', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "L'architecture est impossible. Des escaliers mènent nulle part. Des portes s'ouvrent sur des murs.", en: '' } },
  { id: 'atm_ar_m_04', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "La température change brusquement d'un mètre à l'autre. Quelque chose perturbe les lois de la physique ici.", en: '' } },
  { id: 'atm_ar_m_05', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "Un liquide sombre suinte des glyphes gravés dans la pierre. Pas de l'eau.", en: '' } },
  { id: 'atm_ar_m_06', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "Votre ombre se comporte étrangement. Elle bouge avec un temps de retard, comme si elle hésitait.", en: '' } },
  { id: 'atm_ar_m_07', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "Les couloirs se ramifient à l'infini. La géométrie de cet endroit n'obéit pas aux lois euclidiennes.", en: '' } },
  { id: 'atm_ar_m_08', setting: 'alien_ruins', tensionTier: 'mid', text: { fr: "Un bourdonnement profond émane du sol. Comme un cœur qui bat dans les fondations.", en: '' } },

  // High tension
  { id: 'atm_ar_h_01', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "Les murs organiques se contractent. Les ruines s'éveillent.", en: '' } },
  { id: 'atm_ar_h_02', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "Quelque chose de très ancien vient de remarquer votre existence.", en: '' } },
  { id: 'atm_ar_h_03', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "Vos pensées se brouillent. Les ruines chuchotent dans une fréquence que votre cerveau ne devrait pas percevoir.", en: '' } },
  { id: 'atm_ar_h_04', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "La bioluminescence vire au rouge sang. Les ruines montrent leur vrai visage.", en: '' } },
  { id: 'atm_ar_h_05', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "Le sol tremble sous vos pieds. Quelque chose de colossal se déplace dans les profondeurs.", en: '' } },
  { id: 'atm_ar_h_06', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "Les glyphes s'embrasent d'une lumière aveuglante. Un mécanisme ancien s'active.", en: '' } },
  { id: 'atm_ar_h_07', setting: 'alien_ruins', tensionTier: 'high', text: { fr: "L'air vibre d'une énergie invisible. Vos cheveux se dressent. Votre peau picote.", en: '' } },

  // Climax
  { id: 'atm_ar_c_01', setting: 'alien_ruins', tensionTier: 'climax', text: { fr: "Les ruines vibrent d'une énergie primordiale. Ce qui dormait ici se réveille.", en: '' } },
  { id: 'atm_ar_c_02', setting: 'alien_ruins', tensionTier: 'climax', text: { fr: "Le voile entre les dimensions se déchire. La réalité n'est plus qu'une suggestion.", en: '' } },
  { id: 'atm_ar_c_03', setting: 'alien_ruins', tensionTier: 'climax', text: { fr: "Les ruines hurlent. Un cri silencieux qui résonne directement dans votre crâne.", en: '' } },
  { id: 'atm_ar_c_04', setting: 'alien_ruins', tensionTier: 'climax', text: { fr: "La structure entière pulse comme un organe vivant. Vous êtes à l'intérieur de quelque chose.", en: '' } },
  { id: 'atm_ar_c_05', setting: 'alien_ruins', tensionTier: 'climax', text: { fr: "L'espace se replie sur lui-même. Haut et bas n'ont plus de sens.", en: '' } },
];

// === SPACE STATION ===

const STATION_ATMOSPHERE: readonly AtmosphereSnippet[] = [
  // Low tension
  { id: 'atm_ss_l_01', setting: 'space_station', tensionTier: 'low', text: { fr: "La station bourdonne de ses mille systèmes. Un organisme mécanique en pilote automatique.", en: '' } },
  { id: 'atm_ss_l_02', setting: 'space_station', tensionTier: 'low', text: { fr: "Par le hublot, les étoiles sont immobiles. Le temps semble suspendu.", en: '' } },
  { id: 'atm_ss_l_03', setting: 'space_station', tensionTier: 'low', text: { fr: "Le calme de la station est artificiel. Manufacturé. Comme tout le reste ici.", en: '' } },
  { id: 'atm_ss_l_04', setting: 'space_station', tensionTier: 'low', text: { fr: "Les couloirs blancs et aseptisés s'étirent à l'infini. L'architecture est conçue pour rassurer. Elle échoue.", en: '' } },
  { id: 'atm_ss_l_05', setting: 'space_station', tensionTier: 'low', text: { fr: "Un panneau d'affichage défile les protocoles de sécurité. Personne ne les lit plus.", en: '' } },
  { id: 'atm_ss_l_06', setting: 'space_station', tensionTier: 'low', text: { fr: "La ventilation souffle un air recyclé mille fois. Il a un goût de métal et de solitude.", en: '' } },
  { id: 'atm_ss_l_07', setting: 'space_station', tensionTier: 'low', text: { fr: "Des photos personnelles sont encore accrochées dans un quartier d'habitation. Des visages souriants, figés dans un passé révolu.", en: '' } },

  // Mid tension
  { id: 'atm_ss_m_01', setting: 'space_station', tensionTier: 'mid', text: { fr: "Un message automatique résonne dans les haut-parleurs. Il tourne en boucle depuis des heures.", en: '' } },
  { id: 'atm_ss_m_02', setting: 'space_station', tensionTier: 'mid', text: { fr: "Les portes automatiques s'ouvrent et se ferment sans raison apparente. La station a ses propres priorités.", en: '' } },
  { id: 'atm_ss_m_03', setting: 'space_station', tensionTier: 'mid', text: { fr: "Des traces de sang séché forment un chemin vers un sas. Quelqu'un a essayé de fuir.", en: '' } },
  { id: 'atm_ss_m_04', setting: 'space_station', tensionTier: 'mid', text: { fr: "L'IA de la station marmonne des diagnostics incompréhensibles. Sa voix synthétique est presque rassurante.", en: '' } },
  { id: 'atm_ss_m_05', setting: 'space_station', tensionTier: 'mid', text: { fr: "Un plateau-repas intact est posé sur une table. Le café est encore tiède. Quelqu'un est parti en urgence.", en: '' } },
  { id: 'atm_ss_m_06', setting: 'space_station', tensionTier: 'mid', text: { fr: "Les caméras de surveillance pivotent lentement. Quelqu'un — ou quelque chose — les contrôle encore.", en: '' } },
  { id: 'atm_ss_m_07', setting: 'space_station', tensionTier: 'mid', text: { fr: "Un journal de bord ouvert sur un terminal. Les dernières entrées sont de plus en plus incohérentes.", en: '' } },
  { id: 'atm_ss_m_08', setting: 'space_station', tensionTier: 'mid', text: { fr: "Les indicateurs de qualité d'air virent au jaune dans certains secteurs. La station se dégrade.", en: '' } },

  // High tension
  { id: 'atm_ss_h_01', setting: 'space_station', tensionTier: 'high', text: { fr: "Les systèmes de survie émettent des alertes en cascade. La station se meurt, module par module.", en: '' } },
  { id: 'atm_ss_h_02', setting: 'space_station', tensionTier: 'high', text: { fr: "La gravité artificielle fluctue. Vos pas deviennent incertains, légers, puis trop lourds.", en: '' } },
  { id: 'atm_ss_h_03', setting: 'space_station', tensionTier: 'high', text: { fr: "Un compte à rebours s'affiche sur chaque écran. Vous ne savez pas ce qui se passera quand il atteindra zéro.", en: '' } },
  { id: 'atm_ss_h_04', setting: 'space_station', tensionTier: 'high', text: { fr: "Les sas d'urgence se verrouillent un par un. La station se compartimente comme un sous-marin en perdition.", en: '' } },
  { id: 'atm_ss_h_05', setting: 'space_station', tensionTier: 'high', text: { fr: "L'IA annonce l'évacuation. Mais les navettes sont parties depuis longtemps.", en: '' } },
  { id: 'atm_ss_h_06', setting: 'space_station', tensionTier: 'high', text: { fr: "La coque grince sous la pression du vide. Un son qui vous rappelle que rien ne vous sépare de l'espace.", en: '' } },
  { id: 'atm_ss_h_07', setting: 'space_station', tensionTier: 'high', text: { fr: "Les lumières passent en mode urgence. Le rouge envahit chaque recoin.", en: '' } },

  // Climax
  { id: 'atm_ss_c_01', setting: 'space_station', tensionTier: 'climax', text: { fr: "La station est en train de se désintégrer. Les explosions se rapprochent.", en: '' } },
  { id: 'atm_ss_c_02', setting: 'space_station', tensionTier: 'climax', text: { fr: "Plus de temps. Plus de marge. Chaque décision est la dernière chance.", en: '' } },
  { id: 'atm_ss_c_03', setting: 'space_station', tensionTier: 'climax', text: { fr: "L'oxygène chute. Les systèmes critiques tombent en cascade. La fin est proche.", en: '' } },
  { id: 'atm_ss_c_04', setting: 'space_station', tensionTier: 'climax', text: { fr: "La station tremble dans son agonie. Chaque vibration pourrait être la dernière.", en: '' } },
  { id: 'atm_ss_c_05', setting: 'space_station', tensionTier: 'climax', text: { fr: "Le vide spatial est à quelques centimètres de votre peau. Seule une cloison fissurée vous en sépare.", en: '' } },
];

/** All atmosphere snippets */
export const ATMOSPHERE_SNIPPETS: readonly AtmosphereSnippet[] = [
  ...DERELICT_ATMOSPHERE,
  ...RUINS_ATMOSPHERE,
  ...STATION_ATMOSPHERE,
];
