// ---------------------------------------------------------------------------
// src/content/templates/sensory.ts — Sensory detail pools (Layer 2)
// ---------------------------------------------------------------------------
// Indexed by setting → condition → SensorySnippet[]
// ---------------------------------------------------------------------------

import type { SensorySnippet } from '../../narration/types';

type SensoryPool = Readonly<Record<string, readonly SensorySnippet[]>>;

// === DERELICT SHIP ===

const DERELICT_DEFAULT: readonly SensorySnippet[] = [
  { id: 'ds_d_01', setting: 'derelict_ship', condition: 'default', text: { fr: "L'air recyclé a un goût métallique qui colle à la langue.", en: '' } },
  { id: 'ds_d_02', setting: 'derelict_ship', condition: 'default', text: { fr: "Le bourdonnement grave des générateurs vibre dans votre cage thoracique.", en: '' } },
  { id: 'ds_d_03', setting: 'derelict_ship', condition: 'default', text: { fr: "Des câbles pendent du plafond comme des intestins arrachés.", en: '' } },
  { id: 'ds_d_04', setting: 'derelict_ship', condition: 'default', text: { fr: "La lumière des néons projette des ombres qui semblent respirer.", en: '' } },
  { id: 'ds_d_05', setting: 'derelict_ship', condition: 'default', text: { fr: "Quelque chose coule le long d'une cloison. Condensation, probablement.", en: '' } },
  { id: 'ds_d_06', setting: 'derelict_ship', condition: 'default', text: { fr: "Le sol grille vibre sous vos bottes. Le vaisseau tremble.", en: '' } },
  { id: 'ds_d_07', setting: 'derelict_ship', condition: 'default', text: { fr: "Une odeur de plastique brûlé flotte dans le corridor.", en: '' } },
  { id: 'ds_d_08', setting: 'derelict_ship', condition: 'default', text: { fr: "Le silence est ponctué par le tic-tac irrégulier d'un mécanisme inconnu.", en: '' } },
  { id: 'ds_d_09', setting: 'derelict_ship', condition: 'default', text: { fr: "Des traces de griffures profondes strient le mur à hauteur d'épaule.", en: '' } },
  { id: 'ds_d_10', setting: 'derelict_ship', condition: 'default', text: { fr: "Un écran fissuré clignote faiblement, projetant des ombres bleues.", en: '' } },
];

const DERELICT_DARK: readonly SensorySnippet[] = [
  { id: 'ds_dk_01', setting: 'derelict_ship', condition: 'dark', text: { fr: "L'obscurité est totale. Chaque bruit prend une ampleur terrifiante.", en: '' } },
  { id: 'ds_dk_02', setting: 'derelict_ship', condition: 'dark', text: { fr: "Vos yeux cherchent des repères dans le noir. Ils n'en trouvent pas.", en: '' } },
  { id: 'ds_dk_03', setting: 'derelict_ship', condition: 'dark', text: { fr: "Quelque chose frôle votre cheville dans les ténèbres. Câble ou... autre chose.", en: '' } },
  { id: 'ds_dk_04', setting: 'derelict_ship', condition: 'dark', text: { fr: "Dans le noir, votre respiration semble assourdissante.", en: '' } },
  { id: 'ds_dk_05', setting: 'derelict_ship', condition: 'dark', text: { fr: "Un point lumineux rougeâtre palpite au loin, trop faible pour éclairer quoi que ce soit.", en: '' } },
];

const DERELICT_ON_FIRE: readonly SensorySnippet[] = [
  { id: 'ds_f_01', setting: 'derelict_ship', condition: 'on_fire', text: { fr: "La chaleur est suffocante. Des flammes lèchent les panneaux muraux.", en: '' } },
  { id: 'ds_f_02', setting: 'derelict_ship', condition: 'on_fire', text: { fr: "La fumée âcre brûle vos poumons. Chaque respiration est un combat.", en: '' } },
  { id: 'ds_f_03', setting: 'derelict_ship', condition: 'on_fire', text: { fr: "Le plastique fond et goutte du plafond comme de la lave artificielle.", en: '' } },
  { id: 'ds_f_04', setting: 'derelict_ship', condition: 'on_fire', text: { fr: "Les alarmes incendie hurlent. Personne ne viendra les éteindre.", en: '' } },
];

const DERELICT_DEPRESSURIZED: readonly SensorySnippet[] = [
  { id: 'ds_dp_01', setting: 'derelict_ship', condition: 'depressurized', text: { fr: "Le vide aspire tout son. Un silence de mort absolu.", en: '' } },
  { id: 'ds_dp_02', setting: 'derelict_ship', condition: 'depressurized', text: { fr: "Sans pression atmosphérique, vos mouvements sont à la fois légers et mortellement lents.", en: '' } },
  { id: 'ds_dp_03', setting: 'derelict_ship', condition: 'depressurized', text: { fr: "Des cristaux de givre flottent dans l'air, scintillant comme de la poussière d'étoiles.", en: '' } },
];

const DERELICT_FLOODED: readonly SensorySnippet[] = [
  { id: 'ds_fl_01', setting: 'derelict_ship', condition: 'flooded', text: { fr: "L'eau noire monte jusqu'aux chevilles. Elle est glacée.", en: '' } },
  { id: 'ds_fl_02', setting: 'derelict_ship', condition: 'flooded', text: { fr: "Le clapotis de l'eau contaminée résonne dans le couloir inondé.", en: '' } },
  { id: 'ds_fl_03', setting: 'derelict_ship', condition: 'flooded', text: { fr: "Des bulles remontent à la surface de l'eau stagnante. Quelque chose respire en dessous.", en: '' } },
];

// === ALIEN RUINS ===

const RUINS_DEFAULT: readonly SensorySnippet[] = [
  { id: 'ar_d_01', setting: 'alien_ruins', condition: 'default', text: { fr: "Les murs organiques pulsent doucement, comme s'ils respiraient.", en: '' } },
  { id: 'ar_d_02', setting: 'alien_ruins', condition: 'default', text: { fr: "Une lueur bioluminescente teinte tout d'un vert maladif.", en: '' } },
  { id: 'ar_d_03', setting: 'alien_ruins', condition: 'default', text: { fr: "L'air est chargé de spores qui chatoient dans la lumière.", en: '' } },
  { id: 'ar_d_04', setting: 'alien_ruins', condition: 'default', text: { fr: "Des symboles gravés dans la pierre semblent changer quand on ne les regarde pas directement.", en: '' } },
  { id: 'ar_d_05', setting: 'alien_ruins', condition: 'default', text: { fr: "Le sol spongieux absorbe le bruit de vos pas.", en: '' } },
  { id: 'ar_d_06', setting: 'alien_ruins', condition: 'default', text: { fr: "Une odeur douceâtre et écœurante émane des parois.", en: '' } },
  { id: 'ar_d_07', setting: 'alien_ruins', condition: 'default', text: { fr: "Des filaments organiques s'étirent entre les structures comme des toiles d'araignée.", en: '' } },
  { id: 'ar_d_08', setting: 'alien_ruins', condition: 'default', text: { fr: "Un bourdonnement subsonique fait trembler vos dents.", en: '' } },
  { id: 'ar_d_09', setting: 'alien_ruins', condition: 'default', text: { fr: "La géométrie de l'endroit défie la logique. Les angles sont... faux.", en: '' } },
  { id: 'ar_d_10', setting: 'alien_ruins', condition: 'default', text: { fr: "Des veines sombres parcourent le plafond organique, pulsant au rythme d'un cœur invisible.", en: '' } },
];

const RUINS_DARK: readonly SensorySnippet[] = [
  { id: 'ar_dk_01', setting: 'alien_ruins', condition: 'dark', text: { fr: "La bioluminescence a disparu. Les ruines sont plongées dans un noir organique.", en: '' } },
  { id: 'ar_dk_02', setting: 'alien_ruins', condition: 'dark', text: { fr: "Quelque chose se déplace dans l'obscurité des ruines. Quelque chose de grand.", en: '' } },
  { id: 'ar_dk_03', setting: 'alien_ruins', condition: 'dark', text: { fr: "Sans lumière, les textures organiques sont encore plus dérangeantes sous les doigts.", en: '' } },
];

const RUINS_TOXIC: readonly SensorySnippet[] = [
  { id: 'ar_tx_01', setting: 'alien_ruins', condition: 'toxic', text: { fr: "L'air est saturé d'un gaz verdâtre qui brûle les muqueuses.", en: '' } },
  { id: 'ar_tx_02', setting: 'alien_ruins', condition: 'toxic', text: { fr: "Des pustules sur les murs éclatent en libérant des vapeurs âcres.", en: '' } },
  { id: 'ar_tx_03', setting: 'alien_ruins', condition: 'toxic', text: { fr: "Vos yeux larmoient. Chaque inspiration est un poison.", en: '' } },
];

// === SPACE STATION ===

const STATION_DEFAULT: readonly SensorySnippet[] = [
  { id: 'ss_d_01', setting: 'space_station', condition: 'default', text: { fr: "L'éclairage fluorescent grésille, projetant une lumière clinique sur les surfaces aseptisées.", en: '' } },
  { id: 'ss_d_02', setting: 'space_station', condition: 'default', text: { fr: "Le système de ventilation souffle un air tiède et humide qui sent le désinfectant.", en: '' } },
  { id: 'ss_d_03', setting: 'space_station', condition: 'default', text: { fr: "Des écrans d'information défilent des données incompréhensibles sur les murs.", en: '' } },
  { id: 'ss_d_04', setting: 'space_station', condition: 'default', text: { fr: "Le ronronnement constant de la station est presque réconfortant. Presque.", en: '' } },
  { id: 'ss_d_05', setting: 'space_station', condition: 'default', text: { fr: "Une baie vitrée montre l'immensité du vide spatial. Vertigineux.", en: '' } },
  { id: 'ss_d_06', setting: 'space_station', condition: 'default', text: { fr: "Le sol métallique résonne sous chaque pas, trahissant votre position.", en: '' } },
  { id: 'ss_d_07', setting: 'space_station', condition: 'default', text: { fr: "Des fils de données optiques courent le long des murs comme des artères lumineuses.", en: '' } },
  { id: 'ss_d_08', setting: 'space_station', condition: 'default', text: { fr: "L'odeur de café froid émane d'un gobelet renversé. Quelqu'un était là il n'y a pas longtemps.", en: '' } },
];

const STATION_DARK: readonly SensorySnippet[] = [
  { id: 'ss_dk_01', setting: 'space_station', condition: 'dark', text: { fr: "Les lumières de secours rouges donnent au couloir un air de cauchemar éveillé.", en: '' } },
  { id: 'ss_dk_02', setting: 'space_station', condition: 'dark', text: { fr: "Dans l'obscurité, les bruits de la station prennent une qualité organique, presque vivante.", en: '' } },
  { id: 'ss_dk_03', setting: 'space_station', condition: 'dark', text: { fr: "L'éclairage de secours projette des ombres allongées qui semblent ramper.", en: '' } },
];

const STATION_DEPRESSURIZED: readonly SensorySnippet[] = [
  { id: 'ss_dp_01', setting: 'space_station', condition: 'depressurized', text: { fr: "Le sifflement de la dépressurisation est le son de votre espérance de vie qui diminue.", en: '' } },
  { id: 'ss_dp_02', setting: 'space_station', condition: 'depressurized', text: { fr: "Les objets non arrimés flottent lentement vers la brèche.", en: '' } },
  { id: 'ss_dp_03', setting: 'space_station', condition: 'depressurized', text: { fr: "Le froid du vide spatial s'infiltre par la brèche. Vos doigts s'engourdissent.", en: '' } },
];

// ── Build the pools index ──

const DERELICT_POOL: SensoryPool = {
  default: DERELICT_DEFAULT,
  dark: DERELICT_DARK,
  on_fire: DERELICT_ON_FIRE,
  depressurized: DERELICT_DEPRESSURIZED,
  flooded: DERELICT_FLOODED,
};

const RUINS_POOL: SensoryPool = {
  default: RUINS_DEFAULT,
  dark: RUINS_DARK,
  toxic: RUINS_TOXIC,
};

const STATION_POOL: SensoryPool = {
  default: STATION_DEFAULT,
  dark: STATION_DARK,
  depressurized: STATION_DEPRESSURIZED,
};

/** Sensory pools indexed by setting ID → condition → snippets */
export const SENSORY_POOLS: Readonly<Record<string, SensoryPool>> = {
  derelict_ship: DERELICT_POOL,
  alien_ruins: RUINS_POOL,
  space_station: STATION_POOL,
};
