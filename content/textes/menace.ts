import type { Couche } from './types';

// Menace (13 §7.2) : la créature, ses bruits et ses coups, écrits à la main (C-07). Texte final non validé.

/** Radicaux propres à la menace : un mot du socle ou d'un morceau qui commence par l'un d'eux est une fuite. */
export const MOTS_MENACE: readonly string[] = ['créature', 'griff', 'gueule', 'masse'];

/**
 * Radicaux réservés aux traces de la créature (spec 2026-10-18 §5.4) : une description calme n’en porte aucun, pour qu’une trace
 * dise toujours « elle est passée par ici » (grammaire des signes, §8.1). Un « $ » final : le mot exact (« sang », pas « sangle »).
 */
export const MOTS_TRACES: readonly string[] = ['sang$', 'sanglant', 'traînée', 'éventr', 'renvers', 'poiss', 'lacér', 'griff', 'douceâtre', 'éclabouss'];

export const MENACE = {
  evenements: {
    bruit_creature: ['Quelque chose bouge derrière {le:passage}.', 'Derrière {le:passage}, quelque chose de lourd se déplace.'],
    creature_entre: ['Quelque chose surgit par {le:passage}.', 'Une masse sombre se coule par {le:passage}.'],
    pas_entendus: ['Vos pas ont dû porter : quelque chose se met en route.'],
    souffle_entendu: ['Même votre souffle semble porter : là-bas, quelque chose écoute.', 'Vous n’osez plus respirer : quelque chose, là-bas, tend l’oreille.'],
    bruit_lointain: ['Très loin, quelque chose de lourd racle le sol, puis plus rien.', 'Au loin, un bruit mou et pesant, comme une chair frottée contre du métal. Puis le silence.', 'Très loin, un choc sourd et humide, deux fois. Rien ne suit.'],
    bruit_proche: ['Derrière {le:passage}, un souffle lourd, tout proche. Puis plus rien.', 'Contre {le:passage}, quelque chose de massif se déplace sans hâte. Le métal craque à peine.'],
traces_fraiches: ['Au sol, une traînée encore humide : quelque chose est passé ici il y a peu.', 'L’air garde une odeur douceâtre, toute fraîche. Quelque chose vient de passer.'],
    ecoute_couverte: ['Le vacarme des machines couvre tout : impossible d’entendre ce qui se passe derrière les portes.', 'Les machines grondent trop fort : inutile de tendre l’oreille, tout est couvert.'],
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
  // Écoute porte par porte (lot 2 de la créature mobile) : ce que le passager entend derrière un passage en attendant. « Net » et
  // « toujours » sont les seules phrases en rouge ; le grondement des machines est le seul indice qui ment, et sa cause se voit.
  ecoute: {
    net: [
      'Derrière {le:passage}, quelque chose bouge. Un poids qui se déplace, lentement.',
      'Derrière {le:passage}, quelque chose remue, pesant, sans se presser.',
    ],
    toujours: ['Derrière {le:passage}, ça bouge toujours.', 'Derrière {le:passage}, le poids se déplace toujours.'],
    vague: ['Derrière {le:passage}, peut-être un frottement. Ou le métal qui travaille.', 'Derrière {le:passage}, un craquement, peut-être. Rien de sûr.'],
    rien: ['Derrière {le:passage}, rien.', 'Derrière {le:passage}, le silence.'],
    plus_rien: ['Derrière {le:passage}, plus rien.', 'Derrière {le:passage}, le bruit s’est tu.'],
    machines: ['Derrière {le:passage}, le grondement des machines couvre tout ; on croit y entendre des coups, sans savoir lesquels.'],
    froid: ['Contre {le:passage}, le métal glacé ne laisse passer que le ronron du compresseur.'],
  },
  // Capteur de mouvement (lot 3 de la créature mobile) : seul « MOUVEMENT » est en rouge ; « calme » n'est dit que d'une pièce
  // dont il lit l'air, et une panne ou une destruction se dit toujours.
  capteurPose: {
    calme: [
      'Vous fixez le capteur au mur. Un voyant vert clignote, puis s’éteint. CAPTEUR : EN SERVICE.',
      'Vous collez le capteur au mur. Son voyant vert bat une fois, puis s’éteint. CAPTEUR : EN SERVICE.',
    ],
    brouille: [
      'Vous fixez le capteur au mur. Le voyant hésite, puis clignote sans fin. CAPTEUR : SIGNAL BROUILLÉ.',
      'Vous collez le capteur au mur. Son voyant tremble, sans jamais se fixer. CAPTEUR : SIGNAL BROUILLÉ.',
    ],
    mouvement: [
      'Vous fixez le capteur au mur. Le voyant passe aussitôt au rouge. CAPTEUR : MOUVEMENT.',
      'Vous collez le capteur au mur. Son voyant vire au rouge sur-le-champ. CAPTEUR : MOUVEMENT.',
    ],
  },
  capteur: {
    mouvement: ['Votre terminal bipe deux fois. CAPTEUR : MOUVEMENT.', 'Votre terminal sonne, sec, deux fois. CAPTEUR : MOUVEMENT.'],
    calme: ['Votre terminal bipe. CAPTEUR : PLUS DE MOUVEMENT.', 'Votre terminal bipe une fois, plus doucement. CAPTEUR : PLUS DE MOUVEMENT.'],
    brouille: ['Votre terminal grésille. CAPTEUR : SIGNAL BROUILLÉ.', 'Votre terminal crachote un parasite. CAPTEUR : SIGNAL BROUILLÉ.'],
    hs: ['Votre terminal grésille. CAPTEUR : PLUS DE SIGNAL.', 'Votre terminal crachote, puis se tait. CAPTEUR : PLUS DE SIGNAL.'],
  },
  attenteEcoute: ['Vous restez immobile, l’oreille tendue.', 'Vous retenez votre souffle et vous écoutez.'],
  // Traces de la piste (spec 2026-10-18 §5.4) : une phrase entière, vraie dans toute pièce où elle est passée. Légères loin de
  // son repaire, fortes à deux portes ou moins. Elles disent qu'elle est passée, jamais où elle est. Écrites par l'assistant
  // principal (D-243).
  traces: {
    legere: [
      'Des éraflures profondes zèbrent le bas de la porte, toutes dans le même sens.',
      'Une odeur douceâtre flotte ici, que la ventilation ne chasse pas.',
      'Une traînée sombre, déjà sèche, longe le mur jusqu’à la porte.',
      'Au sol, quelque chose de lourd a été traîné ; la marque se perd sous la porte.',
      'Des griffures marquent le chambranle, à hauteur d’homme et plus haut encore.',
      'Un panneau du faux plafond pend, arraché ; des fils dénudés oscillent encore.',
      'Par endroits, le sol colle sous vos semelles, d’un dépôt brunâtre.',
    ],
    forte: [
      'Une traînée sombre, encore poisseuse, file vers la porte.',
      'Du sang a éclaboussé la cloison à hauteur d’épaule, et il n’a pas fini de sécher.',
      'L’odeur, ici, est épaisse, douceâtre, presque chaude.',
      'Des griffures fraîches lacèrent la porte ; des éclats de peinture jonchent encore le sol.',
      'Un casier gît renversé, éventré, son contenu piétiné.',
      'Le sol est poisseux, et l’air sent la bête à vous lever le cœur.',
      'Sur le mur, de longues entailles parallèles montent jusqu’au plafond.',
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
