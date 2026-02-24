// ---------------------------------------------------------------------------
// src/content/templates/secrets.ts — Secret verb templates
// ---------------------------------------------------------------------------
// Templates for hidden/Easter-egg verbs: PRAY, DANCE, NAME, SING,
// APOLOGIZE, WHISPER, REMEMBER, WAIT (special use), SACRIFICE (special use).
// ---------------------------------------------------------------------------

import type { SecretVerbTemplate } from '../../narration/types';

/** Secret verb templates */
export const SECRET_VERB_TEMPLATES: readonly SecretVerbTemplate[] = [
  // ──── PRAY ────
  { id: 'sv_pray_d_01', verb: 'PRAY', type: 'discovery', text: { fr: "Vos lèvres bougent en silence. Les mots ne trouvent aucun dieu dans le vide, mais le geste lui-même apporte un étrange réconfort.", en: '' } },
  { id: 'sv_pray_d_02', verb: 'PRAY', type: 'discovery', text: { fr: "Vous joignez les mains. L'univers ne répond pas, mais votre cœur bat un peu plus calmement.", en: '' } },
  { id: 'sv_pray_e_01', verb: 'PRAY', type: 'effect', text: { fr: "La prière s'élève dans le silence. Un frisson inexplicable vous parcourt. Quelque chose a entendu.", en: '' } },
  { id: 'sv_pray_e_02', verb: 'PRAY', type: 'effect', context: 'alien_ruins', text: { fr: "Vos prières résonnent étrangement dans les ruines. Les symboles sur les murs pulsent brièvement — coïncidence, sûrement.", en: '' } },
  { id: 'sv_pray_r_01', verb: 'PRAY', type: 'rejection', rejectionTier: 'annoyed', text: { fr: "Encore une prière ? Le silence reste votre seule réponse. Peut-être vaudrait-il mieux agir.", en: '' } },
  { id: 'sv_pray_r_02', verb: 'PRAY', type: 'rejection', rejectionTier: 'blocked', text: { fr: "Aucun dieu ne répond. Plus maintenant. Il est temps de compter sur vous-même.", en: '' } },

  // ──── DANCE ────
  { id: 'sv_dance_d_01', verb: 'DANCE', type: 'discovery', text: { fr: "Vos pieds se mettent en mouvement. Dans la lueur rouge des urgences, votre ombre dessine des formes étranges sur les murs.", en: '' } },
  { id: 'sv_dance_d_02', verb: 'DANCE', type: 'discovery', text: { fr: "Vous dansez. C'est absurde, inapproprié, et étrangement libérateur.", en: '' } },
  { id: 'sv_dance_e_01', verb: 'DANCE', type: 'effect', text: { fr: "La danse vous envahit. Pour un instant, les ténèbres reculent. Le stress s'allège.", en: '' } },
  { id: 'sv_dance_e_02', verb: 'DANCE', type: 'effect', context: 'alien_ruins', text: { fr: "Votre rythme corporel entre en résonance avec les pulsations des ruines. Les murs organiques réagissent à votre mouvement.", en: '' } },
  { id: 'sv_dance_r_01', verb: 'DANCE', type: 'rejection', rejectionTier: 'annoyed', text: { fr: "La danse a perdu de son charme. Vos muscles protestent. Le moment est passé.", en: '' } },

  // ──── NAME ────
  { id: 'sv_name_d_01', verb: 'NAME', type: 'discovery', text: { fr: "Vous prononcez un nom à voix haute. Le faire exister par le son lui donne une réalité nouvelle.", en: '' } },
  { id: 'sv_name_d_02', verb: 'NAME', type: 'discovery', text: { fr: "Donner un nom à l'innommable. C'est le premier pas pour reprendre le contrôle.", en: '' } },
  { id: 'sv_name_e_01', verb: 'NAME', type: 'effect', text: { fr: "Le nom résonne. Quelque chose réagit — comme si être nommé lui donnait forme.", en: '' } },
  { id: 'sv_name_r_01', verb: 'NAME', type: 'rejection', rejectionTier: 'annoyed', text: { fr: "Les noms n'ont plus de pouvoir ici. Le moment est passé pour la nomenclature.", en: '' } },

  // ──── SING ────
  { id: 'sv_sing_d_01', verb: 'SING', type: 'discovery', text: { fr: "Votre voix s'élève, fragile, dans le silence du vaisseau. L'écho la transforme en quelque chose de beau et de triste.", en: '' } },
  { id: 'sv_sing_d_02', verb: 'SING', type: 'discovery', text: { fr: "Vous chantez. Les paroles vous reviennent d'un monde qui semble très loin maintenant.", en: '' } },
  { id: 'sv_sing_e_01', verb: 'SING', type: 'effect', text: { fr: "La mélodie flotte dans l'air recyclé. Un capteur quelque part enregistre la vibration. Le vaisseau écoute.", en: '' } },
  { id: 'sv_sing_e_02', verb: 'SING', type: 'effect', context: 'derelict_ship', text: { fr: "La chanson résonne dans les conduits métalliques, réfractée, amplifiée, transformée en quelque chose d'étranger.", en: '' } },
  { id: 'sv_sing_r_01', verb: 'SING', type: 'rejection', rejectionTier: 'annoyed', text: { fr: "Votre voix se brise. Le moment n'est plus au chant.", en: '' } },
  { id: 'sv_sing_r_02', verb: 'SING', type: 'rejection', rejectionTier: 'blocked', text: { fr: "Silence. Chanter maintenant attirerait l'attention de choses que vous préférez ne pas croiser.", en: '' } },

  // ──── APOLOGIZE ────
  { id: 'sv_apol_d_01', verb: 'APOLOGIZE', type: 'discovery', text: { fr: "Les mots d'excuse sortent, maladroits mais sincères. Vous ne savez pas à qui vous les adressez.", en: '' } },
  { id: 'sv_apol_d_02', verb: 'APOLOGIZE', type: 'discovery', text: { fr: "« Pardon. » Le mot flotte dans l'air. À vous-même, peut-être. À ce qui était là avant.", en: '' } },
  { id: 'sv_apol_e_01', verb: 'APOLOGIZE', type: 'effect', text: { fr: "Les excuses semblent apaiser quelque chose. L'atmosphère se détend imperceptiblement.", en: '' } },
  { id: 'sv_apol_r_01', verb: 'APOLOGIZE', type: 'rejection', rejectionTier: 'annoyed', text: { fr: "Les excuses ne changent rien à la situation. Le temps des regrets est révolu.", en: '' } },

  // ──── WHISPER ────
  { id: 'sv_whisp_d_01', verb: 'WHISPER', type: 'discovery', text: { fr: "Vos lèvres bougent à peine. Les mots sont pour vous seul. Ou presque.", en: '' } },
  { id: 'sv_whisp_d_02', verb: 'WHISPER', type: 'discovery', text: { fr: "Vous chuchotez dans le silence. Les murs semblent se pencher pour écouter.", en: '' } },
  { id: 'sv_whisp_e_01', verb: 'WHISPER', type: 'effect', text: { fr: "Le murmure voyage plus loin qu'il ne devrait. Quelque chose dans les ténèbres incline la tête.", en: '' } },
  { id: 'sv_whisp_e_02', verb: 'WHISPER', type: 'effect', context: 'alien_ruins', text: { fr: "Vos chuchotements sont absorbés par les murs organiques. Ils semblent... satisfaits.", en: '' } },
  { id: 'sv_whisp_r_01', verb: 'WHISPER', type: 'rejection', rejectionTier: 'annoyed', text: { fr: "Personne n'écoute plus vos murmures.", en: '' } },

  // ──── REMEMBER ────
  { id: 'sv_rem_d_01', verb: 'REMEMBER', type: 'discovery', text: { fr: "Un souvenir remonte à la surface. La Terre. Le soleil. L'odeur de la pluie sur le béton chaud.", en: '' } },
  { id: 'sv_rem_d_02', verb: 'REMEMBER', type: 'discovery', text: { fr: "Vous fermez les yeux et vous rappelez. Un visage. Un nom. Une promesse de retour.", en: '' } },
  { id: 'sv_rem_e_01', verb: 'REMEMBER', type: 'effect', text: { fr: "Le souvenir vous redonne des forces. Pas physiquement — mais quelque chose de plus profond.", en: '' } },
  { id: 'sv_rem_r_01', verb: 'REMEMBER', type: 'rejection', rejectionTier: 'annoyed', text: { fr: "Les souvenirs s'effacent. Il ne reste que le présent, froid et immédiat.", en: '' } },
  { id: 'sv_rem_r_02', verb: 'REMEMBER', type: 'rejection', rejectionTier: 'blocked', text: { fr: "Votre mémoire est brouillée. Les visages sont flous. Le passé vous échappe.", en: '' } },

  // ──── WAIT (special use — not a secret verb, but has secret-like depth) ────
  { id: 'sv_wait_d_01', verb: 'WAIT', type: 'discovery', text: { fr: "Vous attendez. Le temps passe, indifférent à votre patience.", en: '' } },
  { id: 'sv_wait_d_02', verb: 'WAIT', type: 'discovery', text: { fr: "L'attente s'étire. Chaque seconde est un choix de ne rien faire.", en: '' } },
  { id: 'sv_wait_e_01', verb: 'WAIT', type: 'effect', text: { fr: "L'attente est récompensée. Quelque chose change dans l'environnement.", en: '' } },
  { id: 'sv_wait_r_01', verb: 'WAIT', type: 'rejection', rejectionTier: 'annoyed', text: { fr: "Attendre ne résout rien. Le temps n'est pas de votre côté.", en: '' } },

  // ──── SACRIFICE (special use — existing verb with deep narrative) ────
  { id: 'sv_sacr_d_01', verb: 'SACRIFICE', type: 'discovery', text: { fr: "Vous offrez quelque chose de précieux. Le geste est lourd de sens dans cet endroit désolé.", en: '' } },
  { id: 'sv_sacr_e_01', verb: 'SACRIFICE', type: 'effect', text: { fr: "Le sacrifice est accepté. Par qui, par quoi — la question reste ouverte.", en: '' } },
  { id: 'sv_sacr_e_02', verb: 'SACRIFICE', type: 'effect', context: 'alien_ruins', text: { fr: "Les ruines réagissent au sacrifice. Les murs pulsent plus fort, comme nourris par votre offrande.", en: '' } },
];
