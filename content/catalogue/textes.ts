import type { TextesMorceau } from '../textes/types';

// Textes du catalogue (spec 2026-10-18 §5.3, C-07), couche univers : des pièces abandonnées en hâte, au ton froid et décalé des
// quartiers de l'univers. Descriptions calmes seulement : ni trace, ni mot de la menace, ni objet qui pourrait s'y trouver (il
// s'affiche en puce), ni pièce voisine. Une sur trois environ porte un bruit de station lointain, jamais celui de la créature.
// Écrits par l'assistant principal (D-243). Texte final non validé.

export const TEXTES_CATALOGUE: TextesMorceau = {
  noms: {
    cat_couchettes: { texte: 'couchettes', genre: 'f', nombre: 'p', elision: false },
    cat_sanitaires: { texte: 'sanitaires', genre: 'm', nombre: 'p', elision: false },
    cat_refectoire: { texte: 'réfectoire', genre: 'm', nombre: 's', elision: false },
    cat_cambuse: { texte: 'cambuse', genre: 'f', nombre: 's', elision: false },
    cat_infirmerie: { texte: 'infirmerie', genre: 'f', nombre: 's', elision: true },
    cat_buanderie: { texte: 'buanderie', genre: 'f', nombre: 's', elision: false },
    cat_outillage: { texte: 'salle d’outillage', genre: 'f', nombre: 's', elision: false },
    cat_consigne: { texte: 'consigne', genre: 'f', nombre: 's', elision: false },
    cat_depot: { texte: 'dépôt', genre: 'm', nombre: 's', elision: false },
    cat_vestiaire: { texte: 'salle des casiers', genre: 'f', nombre: 's', elision: false },
    cat_ventilation: { texte: 'salle de ventilation', genre: 'f', nombre: 's', elision: false },
    cat_couloir: { texte: 'couloir', genre: 'm', nombre: 's', elision: false },
    cat_plateforme: { texte: 'plateforme de fret', genre: 'f', nombre: 's', elision: false },
    cat_bureau_fret: { texte: 'bureau du fret', genre: 'm', nombre: 's', elision: false },
    cat_laboratoire: { texte: 'laboratoire', genre: 'm', nombre: 's', elision: false },
    // Objets du butin (spec §6.6) : leur nom n'est celui d'aucun morceau ni d'aucune pièce (NP-04).
    cat_trousse: { texte: 'trousse de soin', genre: 'f', nombre: 's', elision: false },
    cat_burette_reserve: { texte: 'burette de réserve', genre: 'f', nombre: 's', elision: false },
  },
  descriptions: {
    cat_couchettes: [
      'Deux rangées de couchettes superposées, rideaux tirés. Des sacs de voyage attendent au pied des échelles, encore fermés. L’éclairage de service teinte les draps de rouge.',
      'Des couchettes étroites, chacune avec sa liseuse et une photo glissée sous le cadre. Personne n’a pris le temps de faire son lit.',
      'Une chambrée de couchettes alignées, les oreillers encore creusés. Derrière la cloison, un ventilateur tourne à vide avec un cliquetis régulier.',
    ],
    cat_sanitaires: [
      'Des lavabos en inox, des cabines aux portes battantes. Un robinet goutte dans le silence, à intervalles réguliers.',
      'Des sanitaires carrelés de blanc, aux joints grisés par les années. Sur le miroir, quelqu’un a collé un planning de ménage, rempli à moitié.',
    ],
    cat_refectoire: [
      'De longues tables vissées au sol, des bancs alignés. Les plateaux sont restés en place, les repas à peine entamés.',
      'Un réfectoire aux néons fatigués. Un écran mural fait défiler les horaires de transit, sans le son.',
      'Des tables, des bancs, une odeur de café réchauffé. Quelque part dans les conduits, de l’eau gargouille, puis se tait.',
    ],
    cat_cambuse: [
      'Des étagères de conserves et de rations sous film. Une liste d’inventaire pend à un clou, cochée jusqu’à mi-page.',
      'La cambuse sent le carton et le café moulu. Sur la porte, un rappel tapé à la machine : une ration par repas, pas davantage.',
    ],
    cat_infirmerie: [
      'Deux lits médicalisés, un paravent, une armoire à pharmacie vitrée. Les draps sont tirés au cordeau ; aucun lit n’a servi.',
      'Une infirmerie étroite, carrelée de vert pâle. Un moniteur éteint veille au-dessus d’un lit vide. Au mur, un schéma du corps humain, annoté au feutre.',
    ],
    cat_buanderie: [
      'Des machines à laver, hublots ouverts, et une odeur de lessive qui flotte encore. Quelque part, une canalisation cogne à intervalles réguliers.',
      'Des chariots de linge plié, des sacs étiquetés au nom de leurs propriétaires. Une machine s’est arrêtée au milieu de son cycle, l’eau encore grise derrière le hublot.',
    ],
    cat_outillage: [
      'Des outils pendus à un panneau perforé, chacun devant sa silhouette peinte. Un établi propre, un étau fermé, une lampe articulée repliée.',
      'Des clés rangées par taille, des câbles enroulés, des gants de travail par paires. Quelqu’un tenait à l’ordre.',
    ],
    cat_consigne: [
      'Des casiers à bagages du sol au plafond, numérotés et cadenassés pour la plupart. Quelques valises attendent sur un chariot, jamais réclamées.',
      'La consigne des voyageurs en transit. Des étiquettes pendent aux poignées des valises ; certaines portent des noms de stations que vous ne connaissez pas.',
    ],
    cat_depot: [
      'Un dépôt de pièces de rechange : cartons cerclés sur des palettes, rouleaux de câble, plaques de tôle. Tout est couvert d’une fine poussière grise.',
      'Des rayonnages métalliques chargés de pièces détachées. Au fond, un chariot élévateur est resté les fourches levées.',
    ],
    cat_vestiaire: [
      'Des casiers métalliques, un banc au milieu. Les noms des titulaires sont écrits au feutre sur des bandes adhésives.',
      'Des casques alignés sur une étagère, des bottes par paires sous le banc. Un tableau rappelle les procédures d’évacuation, en lettres capitales.',
    ],
    cat_ventilation: [
      'Des gaines épaisses courent au plafond et plongent dans le sol. Les ventilateurs tournent lentement ; l’air siffle par une grille mal fixée.',
      'Une salle étouffante, pleine de conduits et de filtres. Le grondement des souffleries l’emplit, régulier, presque apaisant.',
    ],
    cat_couloir: [
      'Un couloir de service, bas de plafond. Des tuyaux courent le long des parois ; l’un d’eux claque de temps à autre en se dilatant.',
      'Un couloir étroit, aux néons espacés. Au sol, des flèches peintes s’effacent sous les passages des chariots.',
    ],
    cat_plateforme: [
      'Une plateforme de fret haute de plafond. Des rails de levage courent sous la voûte ; un conteneur vide est resté suspendu, à mi-course.',
      'Des palettes filmées, des élingues roulées au sol, des marquages jaunes à demi effacés. Le dernier déchargement est resté en plan.',
      'La plateforme de fret est déserte. Quelque part au-dessus, la charpente métallique craque longuement.',
    ],
    cat_bureau_fret: [
      'Un bureau encombré de bordereaux et de tampons. Sur l’écran, un manifeste de chargement s’est figé au milieu d’une ligne.',
      'Une petite pièce vitrée, une chaise à roulettes, un téléphone de service décroché. Une tasse a laissé un cercle brun sur un bon de livraison.',
    ],
    cat_laboratoire: [
      'Un laboratoire de contrôle sanitaire, paillasses blanches et hottes éteintes. Les flacons d’échantillons sont rangés par lots, étiquetés à la main.',
      'Des microscopes sous housse, une enceinte de confinement vide, sa vitre relevée. Le registre des contrôles est ouvert sur une page blanche.',
    ],
    cat_trousse: [
      'Une trousse de soin en toile, une croix blanche sur le rabat. Quelqu’un l’a manquée en fouillant.',
      'Une trousse de soin d’urgence, les attaches encore scellées. Elle a échappé à ceux qui sont passés avant vous.',
    ],
    cat_burette_reserve: [
      'Une burette de réserve, pleine, le bouchon encore plombé. L’étiquette précise : lubrifiant glissant, non inflammable.',
      'Une petite burette de réserve à bec court. L’étiquette précise : glissant, non inflammable.',
    ],
  },
  assistance: {},
};
