import type { Couche } from './types';

// Menace (13 §7.2) : la créature, ses bruits et ses coups, écrits à la main (C-07). Texte final non validé.

/** Radicaux propres à la menace : un mot du socle ou d'un morceau qui commence par l'un d'eux est une fuite. */
export const MOTS_MENACE: readonly string[] = ['créature', 'griff', 'gueule', 'masse'];

export const MENACE = {
  evenements: {
    bruit_creature: ['Quelque chose bouge derrière {le:passage}.', 'Derrière {le:passage}, quelque chose de lourd se déplace.'],
    creature_entre: ['Quelque chose surgit par {le:passage}.', 'Une masse sombre se coule par {le:passage}.'],
    pas_entendus: ['Vos pas ont dû porter : quelque chose se met en route.'],
    souffle_entendu: ['Même votre souffle semble porter : là-bas, quelque chose écoute.', 'Vous n’osez plus respirer : quelque chose, là-bas, tend l’oreille.'],
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
    porte_secouee: [
      'Des coups sourds ébranlent {le:passage} : de l’autre côté, quelque chose s’acharne.',
      '{Le:passage} tremble sous des chocs lourds ; le métal gémit et se creuse.',
    ],
    porte_enfoncee: [
      'Un dernier choc, un fracas de métal tordu : {le:passage} cède et s’ouvre en grand.',
      '{Le:passage} s’arrache de son cadre dans un hurlement de métal.',
    ],
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
  // Récit de fin (D-281 à D-283) : la créature nommée, ou reprise juste après une phrase qui l'a nommée. Ce que le passager
  // n'a pas vu reste « quelque chose » (NP-05).
  fin: {
    moments: {
      premier_contact: {
        ailleurs: 'Dans {le:piece}, vous avez vu la créature pour la première fois.',
        ici: 'Vous y avez vu la créature pour la première fois.',
        ailleursReprise: 'Dans {le:piece}, vous l’avez vue pour la première fois.',
        iciReprise: 'Vous l’y avez vue pour la première fois.',
      },
      creature_expulsee: {
        ailleurs: 'Dans {le:piece}, le vide a emporté la créature sous vos yeux.',
        ici: 'Le vide y a emporté la créature sous vos yeux.',
        ailleursReprise: 'Dans {le:piece}, le vide l’a emportée sous vos yeux.',
        iciReprise: 'Le vide l’a emportée sous vos yeux.',
      },
      creature_inerte: {
        ailleurs: 'Dans {le:piece}, le vide a figé la créature pour de bon.',
        ici: 'Le vide y a figé la créature pour de bon.',
        ailleursReprise: 'Dans {le:piece}, le vide l’a figée pour de bon.',
        iciReprise: 'Le vide l’a figée pour de bon.',
      },
      blesse_griffes: {
        ailleurs: 'Dans {le:piece}, la créature vous a blessé.',
        ici: 'La créature vous y a blessé.',
        ailleursReprise: 'Dans {le:piece}, elle vous a blessé.',
        iciReprise: 'Elle vous y a blessé.',
      },
      blesse_griffes_feu: {
        ailleurs: 'Dans {le:piece}, au milieu des flammes, la créature vous a blessé.',
        ici: 'Au milieu des flammes, la créature vous a blessé.',
        ailleursReprise: 'Dans {le:piece}, au milieu des flammes, elle vous a blessé.',
        iciReprise: 'Au milieu des flammes, elle vous a blessé.',
      },
      blesse_griffes_froid: {
        ailleurs: 'Dans {le:piece}, la créature vous a blessé ; le froid vous mordait déjà.',
        ici: 'La créature vous y a blessé ; le froid vous mordait déjà.',
        ailleursReprise: 'Dans {le:piece}, elle vous a blessé ; le froid vous mordait déjà.',
        iciReprise: 'Elle vous y a blessé ; le froid vous mordait déjà.',
      },
      critique_griffes: {
        ailleurs: 'Dans {le:piece}, la créature vous a grièvement blessé.',
        ici: 'Puis la créature vous a grièvement blessé.',
        ailleursReprise: 'Dans {le:piece}, elle vous a grièvement blessé.',
        iciReprise: 'Puis elle vous a grièvement blessé.',
      },
      critique_griffes_feu: {
        ailleurs: 'Dans {le:piece}, au milieu des flammes, la créature vous a grièvement blessé.',
        ici: 'Puis, au milieu des flammes, la créature vous a grièvement blessé.',
        ailleursReprise: 'Dans {le:piece}, au milieu des flammes, elle vous a grièvement blessé.',
        iciReprise: 'Puis, au milieu des flammes, elle vous a grièvement blessé.',
      },
      critique_griffes_froid: {
        ailleurs: 'Dans {le:piece}, la créature vous a grièvement blessé ; le froid vous mordait déjà.',
        ici: 'Puis la créature vous a grièvement blessé ; le froid vous mordait déjà.',
        ailleursReprise: 'Dans {le:piece}, elle vous a grièvement blessé ; le froid vous mordait déjà.',
        iciReprise: 'Puis elle vous a grièvement blessé ; le froid vous mordait déjà.',
      },
      pont_cede: { ici: '{Le:objet} a cédé sous un poids énorme ; quelque chose est tombé dans le vide.' },
      chute_entendue: { ici: 'Derrière {le:passage}, vous avez entendu quelque chose tomber.' },
      creature_glisse: { ici: 'Au pied {de:passage}, quelque chose a glissé sur l’huile.' },
      porte_enfoncee: { ici: '{Le:passage} a cédé sous les coups.' },
    },
    morts: {
      griffes: {
        ailleurs: 'Vous êtes mort dans {le:piece}, sous les griffes de la créature.',
        ici: 'Vous y êtes mort, sous les griffes de la créature.',
        ailleursReprise: 'Vous êtes mort dans {le:piece}, sous ses griffes.',
        iciReprise: 'Vous y êtes mort, sous ses griffes.',
      },
      griffes_feu: {
        ailleurs: 'Vous êtes mort dans {le:piece}, entre les griffes de la créature et les flammes.',
        ici: 'Vous y êtes mort, entre les griffes de la créature et les flammes.',
        ailleursReprise: 'Vous êtes mort dans {le:piece}, entre ses griffes et les flammes.',
        iciReprise: 'Vous y êtes mort, entre ses griffes et les flammes.',
      },
      griffes_froid: {
        ailleurs: 'Vous êtes mort dans {le:piece}, sous les griffes de la créature, transi de froid.',
        ici: 'Vous y êtes mort, sous les griffes de la créature, transi de froid.',
        ailleursReprise: 'Vous êtes mort dans {le:piece}, sous ses griffes, transi de froid.',
        iciReprise: 'Vous y êtes mort, sous ses griffes, transi de froid.',
      },
    },
    creature: {
      laissee: 'Vous laissez la créature derrière vous.',
      entendue: 'Vous avez entendu quelque chose bouger à bord, sans jamais le voir.',
      jamais: 'Vous n’avez jamais vu ce qui rôdait à bord.',
    },
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
