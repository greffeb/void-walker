import type { Couche } from './types';

// Menace (13 §7.2) : la créature, ses bruits et ses coups, écrits à la main (C-07). Texte final non validé.

/** Radicaux propres à la menace : un mot du socle ou d'un morceau qui commence par l'un d'eux est une fuite. */
export const MOTS_MENACE: readonly string[] = ['créature', 'griff', 'gueule', 'masse'];

export const MENACE = {
  evenements: {
    bruit_creature: ['Quelque chose bouge derrière {le:passage}.', 'Derrière {le:passage}, quelque chose de lourd se déplace.'],
    creature_entre: ['Quelque chose surgit par {le:passage}.', 'Une masse sombre se coule par {le:passage}.'],
    premier_contact: [
      'Vous la voyez enfin : plus haute qu’un homme, la peau luisante, une tête sans yeux. Sa gueule hume l’air ; ses griffes raclent le sol. Elle s’est tournée vers vous. Il vous reste un instant pour réagir.',
      'La chose est là, plus haute qu’un homme, la peau luisante. Pas d’yeux : une gueule qui hume l’air, des griffes au bout de longs bras. Elle vous a repéré. Vous avez un instant, pas plus.',
    ],
    menace: ['La créature se jette sur vous ; vous vous dérobez de justesse.', 'Des griffes fendent l’air à un souffle de votre visage.'],
    aggravation_blesse: ['Des griffes vous lacèrent l’épaule : vous êtes blessé.', 'Une griffe vous entaille le flanc ; vous êtes blessé.'],
    aggravation_critique: [
      'Les griffes vous atteignent de nouveau : vous êtes grièvement blessé.',
      'Un coup vous projette contre la paroi ; grièvement blessé, vous tenez à peine debout.',
    ],
    defaite: [
      'Les griffes vous atteignent une fois de trop. Vos jambes cèdent. Le sol froid vient à votre rencontre, puis plus rien.',
      'Vous ne sentez presque pas le dernier coup. Le sol vient à votre rencontre. Au plafond, les lumières rouges clignotent encore.',
    ],
    creature_glisse: ['Quelque chose franchit {le:passage} et part en glissade.', 'Une masse lourde dérape au pied {de:passage} et s’effondre.'],
    creature_expulsee: ['La créature est arrachée du sol, happée par la brèche, et disparaît dans le noir.'],
    creature_inerte: ['Au sol, une masse plus haute qu’un homme, sans yeux, ne bouge plus.'],
    pont_cede: [
      'Un craquement sec : {le:objet} cède sous un poids énorme, et quelque chose bascule dans le vide.',
      '{Le:objet} se brise avec un claquement de bois mort ; une masse lourde tombe dans le noir, sans un cri.',
    ],
  },
  brulures: {
    griffes_feu: {
      aggravation_blesse: ['Des griffes et des flammes à la fois : vous êtes blessé.'],
      aggravation_critique: ['Griffé, brûlé, vous tenez à peine debout : vous êtes grièvement blessé.'],
      defaite: ['Les griffes vous jettent dans les flammes. Vous ne vous relevez pas.'],
    },
  },
  gelures: {
    griffes_froid: {
      aggravation_blesse: ['Des griffes, et ce froid qui mord : vous êtes blessé.'],
      aggravation_critique: ['Griffé, transi, vous tenez à peine debout : vous êtes grièvement blessé.'],
      defaite: ['Les griffes vous jettent sur le sol givré. Vous ne vous relevez pas.'],
    },
  },
  refus: { creature_a_bord: 'La créature est à bord : rien n’a été joué.' },
  indisponibilites: { creature_a_bord: 'La créature est à bord.' },
  observation: {
    creatureInerte: 'Une créature gît ici, inerte.',
    creature: 'La créature est là, tout près de vous.',
    creatureATerre: 'La créature est à terre, tout près de vous ; elle peine à se relever.',
    creatureRalentie: 'Le givre la couvre ; elle bouge avec lenteur.',
    creatureEngourdie: 'Le givre la couvre ; engourdie, elle reste figée un instant.',
  },
  apercu: {
    dangers: {
      interception: 'le temps de faire cela, la créature peut vous frapper',
      interception_mortelle: 'le temps de faire cela, la créature peut vous frapper ; un coup de plus vous serait fatal',
      creature_vue_instant: 'vous venez de voir la créature dans {le:piece}',
      creature_vue_moment: 'vous avez vu la créature dans {le:piece} il y a un moment',
      creature_vue_longtemps: 'vous avez vu la créature dans {le:piece} il y a longtemps',
      creature_entendue: 'quelque chose bougeait derrière {le:passage}',
    },
  },
} satisfies Couche;
