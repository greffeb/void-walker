import type { TextesMonde } from '../textes/types';

// Textes écrits à la main (C-07) : vouvoiement, phrases courtes, aucune promesse d'effet non observé.
export const TEXTES_MONDE_TEST: TextesMonde = {
  noms: {
    cabine: { texte: 'cabine', genre: 'f', nombre: 's', elision: false },
    atelier: { texte: 'atelier', genre: 'm', nombre: 's', elision: true },
    porte: { texte: 'porte', genre: 'f', nombre: 's', elision: false },
    carnet: { texte: 'carnet', genre: 'm', nombre: 's', elision: false },
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
    carnet: [
      'Un carnet à couverture souple, aux coins cornés. Les pages sont vierges.',
      'Un petit carnet de papier, un luxe à bord. Personne n’y a rien écrit.',
    ],
  },
  evenements: {
    reveil: [
      'Vous ouvrez les yeux dans {le:piece}. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Vous appelez : personne ne répond.',
      'Vous vous réveillez dans {le:piece}, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.',
    ],
    objet_pris: [
      'Vous prenez {le:objet}. Le contact est froid sous vos doigts.',
      'Vous ramassez {le:objet}. Vos mains tremblent un peu.',
    ],
    objet_pose: [
      'Vous posez {le:objet} au sol. Le bruit résonne un instant dans {le:piece}.',
      'Vous déposez {le:objet} à vos pieds. Vos mains sont de nouveau libres.',
    ],
    passage_ouvert: [
      'Vous ouvrez {le:passage}. Le mécanisme grince, puis cède.',
      'Vous actionnez la commande. {Le:passage} glisse dans la cloison avec un souffle d’air tiède.',
    ],
    passage_ferme: [
      'Vous fermez {le:passage}. Le joint se plaque contre le cadre avec un bruit mat.',
      '{Le:passage} se referme. Le silence revient d’un coup.',
    ],
    deplacement: [
      'Vous franchissez le seuil et entrez dans {le:piece}. Vos pas résonnent sur le plancher métallique.',
      'Vous passez dans {le:piece}, une main sur la cloison. Le métal est froid sous vos doigts.',
    ],
    piece_decouverte: ['Vous n’aviez encore jamais mis les pieds ici.', 'Rien, ici, ne vous est familier.'],
  },
  passages: {
    ouvert: ['{Le:passage} est ouvert{e:passage}. Vous apercevez {le:vers} de l’autre côté.'],
    ferme: ['{Le:passage} est fermé{e:passage}. Une plaque indique : {Nom:vers}.'],
  },
  refus: {
    commande_invalide: 'Commande illisible : rien n’a été joué.',
    action_inconnue: 'Cette action n’existe pas : rien n’a été joué.',
    cible_absente: 'Ce que vous visez n’est pas à votre portée.',
    pas_en_main: 'Vous n’avez pas cela en main.',
    deja_ouvert: 'C’est déjà ouvert.',
    deja_ferme: 'C’est déjà fermé.',
    ferme: 'Le passage est fermé.',
  },
  indisponibilites: {
    ferme: '{Le:cible} est fermé{e:cible}.',
  },
  libelles: {
    regarder: 'Regarder {le:cible}',
    prendre: 'Prendre {le:cible}',
    poser: 'Poser {le:cible}',
    ouvrir: 'Ouvrir {le:cible}',
    fermer: 'Fermer {le:cible}',
    aller: 'Aller dans {le:vers}',
  },
  observation: {
    lieu: 'Vous êtes dans {le:piece}.',
    objets: 'Vous voyez ici {un:liste}.',
    aucunObjet: 'Rien ne traîne ici.',
    passageOuvert: '{Le:passage} est ouvert{e:passage}.',
    passageFerme: '{Le:passage} est fermé{e:passage}.',
    inventaire: 'Vous portez {le:liste}.',
    inventaireVide: 'Vous ne portez rien.',
  },
};
