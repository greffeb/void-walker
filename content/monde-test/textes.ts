import type { TextesMonde } from '../textes/types';

// Textes écrits à la main (C-07) : vouvoiement, phrases courtes, aucune promesse d'effet non observé.
export const TEXTES_MONDE_TEST: TextesMonde = {
  noms: {
    cabine: { texte: 'cabine', genre: 'f', nombre: 's', elision: false },
    atelier: { texte: 'atelier', genre: 'm', nombre: 's', elision: true },
    soute: { texte: 'soute', genre: 'f', nombre: 's', elision: false },
    porte: { texte: 'porte', genre: 'f', nombre: 's', elision: false },
    grille: { texte: 'grille', genre: 'f', nombre: 's', elision: false },
    carnet: { texte: 'carnet', genre: 'm', nombre: 's', elision: false },
    trousse: { texte: 'trousse de soin', genre: 'f', nombre: 's', elision: false },
  },
  descriptions: {
    cabine: [
      'Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.',
      'Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.',
    ],
    atelier: [
      'Des établis vissés au sol, des outils rangés dans leurs logements. Tout est en ordre, comme si l’équipe venait de sortir.',
      'L’atelier sent l’huile froide. Sur les établis, chaque outil est à sa place, sous une fine couche de poussière.',
    ],
    soute: [
      'Une soute basse, encombrée de caisses arrimées. L’air y est plus froid et sent l’humidité.',
      'Des rayonnages vides, des sangles qui pendent. Au sol, des traînées sombres que vous évitez de regarder.',
    ],
    carnet: [
      'Un carnet à couverture souple, aux coins cornés. Les pages sont vierges.',
      'Un petit carnet de papier, un luxe à bord. Personne n’y a rien écrit.',
    ],
    trousse: [
      'Une trousse de soin à fermeture éclair, marquée d’une croix blanche.',
      'Une petite trousse de secours en toile, aux coins usés, une croix blanche sur le rabat.',
    ],
  },
  evenements: {
    reveil: [
      'Vous ouvrez les yeux dans {le:piece}. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.',
      'Vous vous réveillez dans {le:piece}, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.',
    ],
    objet_pris: [
      'Vous prenez {le:objet}. Le contact est froid sous vos doigts.',
      'Vous ramassez {le:objet}. Vos mains tremblent un peu.',
    ],
    objet_pose: [
      'Vous posez {le:objet} au sol, près de la cloison. Vos mains sont libres.',
      'Vous déposez {le:objet} à vos pieds. Vous gardez les mains libres.',
    ],
    passage_ouvert: [
      'Vous tirez sur la poignée de {le:passage}. Le passage s’ouvre devant vous.',
      'Vous appuyez sur le bouton d’ouverture. {Le:passage} s’efface dans la cloison.',
    ],
    passage_ferme: [
      'Vous fermez {le:passage}. Le joint se plaque contre le cadre avec un bruit mat.',
      'Vous refermez {le:passage}. Le silence revient d’un coup.',
    ],
    deplacement: [
      'Vous franchissez le seuil et entrez dans {le:piece}. Vos pas résonnent sur le plancher métallique.',
      'Vous passez dans {le:piece}, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.',
    ],
    piece_decouverte: ['Vous n’aviez encore jamais mis les pieds ici.', 'Rien, ici, ne vous est familier.'],
    bruit_mecanisme: [
      '{Le:passage} a grincé si fort que le bruit a dû porter loin.',
      'Le mécanisme grippé a hurlé tout du long ; l’écho met longtemps à mourir.',
    ],
    bruit_creature: ['Quelque chose bouge derrière {le:passage}.', 'Derrière {le:passage}, quelque chose de lourd se déplace.'],
    creature_entre: ['Quelque chose surgit par {le:passage}.', 'Une masse sombre se glisse par {le:passage}.'],
    premier_contact: [
      'Une silhouette se déplie devant vous, plus haute qu’un homme, la peau luisante. Une tête sans yeux se tourne vers vous et s’immobilise. Elle vous a repéré. Il vous reste un instant pour réagir.',
      'La chose se redresse lentement, à quelques pas de vous. Pas d’yeux, seulement une gueule entrouverte qui hume l’air. Elle s’est figée dans votre direction. Vous avez un instant, pas plus.',
    ],
    menace: ['La créature se jette sur vous ; vous vous dérobez de justesse.', 'Des griffes fendent l’air à un souffle de votre visage.'],
    aggravation_blesse: [
      'Des griffes vous lacèrent l’épaule : vous êtes blessé.',
      'Une griffe vous entaille le flanc ; vous êtes blessé.',
    ],
    aggravation_critique: [
      'Les griffes vous atteignent de nouveau : vous êtes grièvement blessé.',
      'Un coup vous projette contre la cloison ; grièvement blessé, vous tenez à peine debout.',
    ],
    defaite: [
      'Les griffes vous ont atteint une fois de trop. Vos jambes cèdent ; le plancher froid vient à votre rencontre. Vous n’entendez plus que votre souffle, puis plus rien.',
      'Vous ne sentez presque pas le dernier coup. Le plancher vient à votre rencontre. La lumière de veille grésille encore, très loin.',
    ],
    soin_indemne: [
      'Vous puisez dans {le:objet} et pansez votre plaie. La douleur reflue ; vous êtes d’aplomb.',
      'Vous ouvrez {le:objet} et serrez un pansement sur la blessure. Vos mains cessent de trembler.',
    ],
    soin_blesse: [
      'Vous puisez dans {le:objet} et serrez un pansement sur la pire de vos plaies. Vous tenez debout, mais vous restez blessé.',
      'Vous ouvrez {le:objet} et colmatez ce que vous pouvez. Vous allez un peu mieux ; vous restez blessé.',
    ],
  },
  passages: {
    ouvert: ['{Le:passage} est ouvert{e:passage}. Vous apercevez {le:vers} de l’autre côté.'],
    ferme: ['{Le:passage} est fermé{e:passage}. Une plaque indique « {Nom:vers} ».'],
  },
  refus: {
    commande_invalide: 'Commande illisible : rien n’a été joué.',
    action_inconnue: 'Cette action n’existe pas : rien n’a été joué.',
    cible_absente: 'Cette action ne peut pas viser cela ici.',
    pas_en_main: 'Vous n’avez pas cela en main.',
    deja_ouvert: 'C’est déjà ouvert.',
    deja_ferme: 'C’est déjà fermé.',
    ferme: 'Ce passage est fermé : vous ne pouvez pas le franchir.',
    pas_blesse: 'Vous n’êtes pas blessé : rien n’a été joué.',
    vide: 'Il n’y a plus rien à utiliser : rien n’a été joué.',
    partie_terminee: 'Cette partie est terminée : rien n’a été joué.',
  },
  indisponibilites: {
    ferme: '{Le:cible} est fermé{e:cible}.',
    pas_blesse: 'Vous n’êtes pas blessé.',
    vide: '{Le:cible} est vide.',
  },
  libelles: {
    regarder: 'Regarder {le:cible}',
    prendre: 'Prendre {le:cible}',
    poser: 'Poser {le:cible}',
    ouvrir: 'Ouvrir {le:cible}',
    fermer: 'Fermer {le:cible}',
    aller: 'Aller dans {le:vers}',
    soigner: 'Se soigner avec {le:cible}',
  },
  verbes: {
    regarder: 'Regarder',
    prendre: 'Prendre',
    poser: 'Poser',
    ouvrir: 'Ouvrir',
    fermer: 'Fermer',
    aller: 'Aller vers',
    soigner: 'Se soigner',
  },
  observation: {
    lieu: 'Vous êtes dans {le:piece}.',
    objets: 'Vous voyez ici {un:liste}.',
    aucunObjet: 'Rien ne traîne ici.',
    passageOuvert: '{Le:passage} est ouvert{e:passage}.',
    passageFerme: '{Le:passage} est fermé{e:passage}.',
    inventaire: 'Vous portez {le:liste}.',
    inventaireVide: 'Vous ne portez rien.',
    creature: 'La créature est là, tout près de vous.',
    blesse: 'Vous êtes blessé.',
    critique: 'Vous êtes grièvement blessé.',
    terminee: 'Cette partie est terminée. Elle ne peut pas être reprise.',
  },
  apercu: {
    risques: {
      aucun: 'aucun risque connu',
      faible: 'faible',
      modere: 'modéré',
      eleve: 'élevé',
      mortel: 'mortel',
      certain: 'certain',
    },
    dangers: {
      interception: 'la créature peut vous blesser',
      interception_mortelle: 'une blessure de plus vous serait fatale',
      creature_vue_instant: 'vous venez de voir la créature dans {le:piece}',
      creature_vue_moment: 'vous avez vu la créature dans {le:piece} il y a un moment',
      creature_vue_longtemps: 'vous avez vu la créature dans {le:piece} il y a longtemps',
      creature_entendue: 'quelque chose bougeait derrière {le:passage}',
    },
    couts: { aucun: 'aucun', bruyant: '[bruyant]' },
    savoir: {
      portera: 'Vous aurez {le:objet} en main.',
      laissera: '{Le:objet} restera dans {le:piece}.',
      ouvrira: '{Le:passage} sera ouvert{e:passage}.',
      fermera: '{Le:passage} sera fermé{e:passage}.',
      quittera: 'Vous quitterez {le:piece}.',
      soignera: 'Votre état s’améliorera d’un cran.',
      videra: '{Le:objet} sera vide.',
    },
  },
};
