import type { EmplacementDocument, ReserveDocuments } from '../../engine';
import type { Nom, TexteDocument } from './types';

// Réserve de documents des grandes stations (spec 2026-10-18 §8.4, §8.5, bible docs/17-univers.md) : la vie d'avant (univers),
// l'incident (menace) et la note de la trousse ; les documents des morceaux et les notes de leurs clés sont dans leur morceau.
// La ligne « où » s'accorde avec le libellé du support et reste vraie partout où le document peut être posé. Écrits par
// l'assistant principal (D-243). Texte final non validé.

const puce = (texte: string, genre: Nom['genre'], elision = false, nombre: Nom['nombre'] = 's'): Nom => ({ texte, genre, nombre, elision });

/** Univers : la vie de la station avant l'incident, dans les pièces du catalogue de leurs étiquettes ; ni mot de la menace ni des traces. */
const UNIVERS: Readonly<Record<string, TexteDocument>> = {
  doc_carte_postale: {
    puce: puce('carte postale', 'f'),
    support: 'note',
    ou: 'glissée sous le cadre d’une couchette',
    corps: [
      'Agathe, ici il fait toujours nuit, et le café a un goût de tuyau.',
      'On dort à six par chambrée, les rideaux ferment mal, et celui du dessus ronfle comme une turbine.',
      'Je rentre avec la relève, promis.',
    ],
    signature: 'Clara',
  },
  doc_affiche_eau: {
    puce: puce('affiche sur l’eau', 'f', true),
    support: 'affiche',
    ou: 'collée au-dessus d’un robinet',
    corps: [
      'Chaque goutte compte.',
      'L’eau de la station est recyclée sept fois avant d’être renouvelée.',
      'Signalez tout robinet qui fuit au service technique.',
      'La Direction du transit vous remercie de votre civisme.',
    ],
  },
  doc_journal_maintenance: {
    puce: puce('journal de maintenance', 'm'),
    support: 'journal',
    ou: 'sur l’écran d’un terminal mural, près de la porte',
    corps: [
      '06:00  Prise de quart. Rien à signaler.',
      '07:40  Filtre F-12 remplacé. Le ventilateur du hangar 6 chante, à surveiller.',
      '09:15  Clé dynamométrique empruntée sans signature. Encore.',
      '11:30  Clé retrouvée dans un bac à couverts. Aucun commentaire.',
      '14:00  Fin de quart.',
    ],
  },
  doc_note_punaisee: {
    puce: puce('note punaisée', 'f'),
    support: 'note',
    ou: 'punaisée sur un panneau de liège, au dos de la porte',
    corps: [
      'Ce qui sort d’ici s’inscrit au cahier, et ce qui revient se range à sa place, pas à côté.',
      'La prochaine clé de douze qui disparaît, je fouille les casiers un par un.',
    ],
    signature: 'Bastien',
  },
  doc_affiche_securite: {
    puce: puce('affiche de sécurité', 'f', true),
    support: 'affiche',
    ou: 'collée à l’intérieur d’une porte de casier',
    corps: [
      'Équipement obligatoire',
      'Casque, gants, chaussures de sécurité : sans eux, pas d’accès au fret.',
      'Un accident sur trois commence par « juste une minute ».',
      'Votre sécurité est notre première cargaison.',
      'La Direction du transit',
    ],
  },
  doc_mot_odile: {
    puce: puce('mot d’Odile', 'm'),
    support: 'note',
    ou: 'scotchée sur la vitre de l’armoire à pharmacie',
    corps: ['Pas de somnifères sans passer par moi, même pour supporter la navette.', 'Les pansements, servez-vous, mais dites-le-moi.', 'Et Malik, une écharde n’est pas une urgence.'],
    signature: 'Odile',
  },
  doc_note_service: {
    puce: puce('note de service', 'f'),
    support: 'affiche',
    ou: 'collée sur la paroi, près de la porte',
    corps: [
      'Note de service n° 12',
      'Tout colis au manifeste incomplet est signalé au contrôle sanitaire avant déchargement.',
      'En cas de doute, n’ouvrez pas.',
      'Votre sécurité est notre priorité.',
      'La Direction du transit',
    ],
  },
  doc_message_wen: {
    puce: puce('message de Wen', 'm'),
    support: 'message',
    ou: 'sur la messagerie d’un casque radio, oublié dans un coin',
    corps: [
      '[des annonces de départ, au loin] Mei, c’est moi. La relève est encore retardée, six jours de plus.',
      '[un rire] Je sais, je sais. Je te rapporte du thé de la boutique de transit, du vrai cette fois.',
    ],
  },
};

/** Menace : l'incident, trois documents par étape, posés dans l'ordre du trajet ; jamais le mot « station ». */
const MENACE: Readonly<Record<string, TexteDocument>> = {
  // Étape 1 : premiers signes.
  doc_journal_sanitaire: {
    puce: puce('journal sanitaire', 'm'),
    support: 'journal',
    ou: 'sur une tablette de service, coincée contre la paroi',
    corps: [
      '08:12  Conteneur CT-4471, hangar 6 : dix-neuvième jour sans inspection. Scellés intacts.',
      '08:30  Expéditeur toujours injoignable. Inspectrice attendue avec la relève, retardée une fois de plus.',
      '21:05  Groupe froid du conteneur en défaut. Intérieur : −18 °C.',
      '23:40  Intérieur : +2 °C. L’équipe de nuit signale des bruits sourds.',
      '23:55  Réparation du groupe froid demandée. Sans réponse.',
    ],
  },
  doc_mot_remi: {
    puce: puce('mot pour Rémi', 'm'),
    support: 'note',
    ou: 'pliée en quatre, coincée dans une fente de la paroi',
    corps: ['Rémi, arrête de cogner sur le conteneur du six pour faire peur aux nouveaux.', 'Ce n’était déjà pas drôle la première fois.', 'Cette nuit, vers 2 h, quelque chose a cogné en retour.'],
    signature: 'Nadia',
  },
  doc_message_malik: {
    puce: puce('message de Malik', 'm'),
    support: 'message',
    ou: 'sur un enregistreur de poche, calé dans un recoin',
    corps: [
      '[rire étouffé] Le frigo du six est habité, je te jure.',
      '[le grondement d’un chariot, puis des coups sourds, tout près] Écoute. Chaque fois qu’un chariot passe, ça cogne là-dedans.',
      '[un long silence] Et quand on se tait, ça se tait aussi.',
    ],
  },
  // Étape 2 : disparition.
  doc_terminal_quart: {
    puce: puce('terminal de quart', 'm'),
    support: 'journal',
    ou: 'sur un terminal portable, resté allumé',
    corps: [
      '23:48  R. Varga signale des coups au hangar 6. Part vérifier seul.',
      '00:06  Plus de réponse radio de R. Varga.',
      '00:31  Hangar 6 : conteneur CT-4471 ouvert, scellés arrachés de l’intérieur.',
      '00:40  Aucune trace de R. Varga. Grilles des conduits vissées, intactes.',
      '06:58  R. Varga absent à la prise de quart. Badge jamais ressorti.',
    ],
  },
  doc_mot_malik: {
    puce: puce('mot de Malik', 'm'),
    support: 'note',
    ou: 'scotchée à la paroi, à hauteur des yeux',
    corps: [
      'Rémi n’a pris aucune navette : son sac est encore dans son placard.',
      'Il n’est pas parti à pied, pas d’ici.',
      'C’est lui qui cognait le plus fort sur le frigo du six, et c’est lui qu’on ne retrouve pas.',
      'Ceux qui disent qu’il a filé n’ont qu’à venir le chercher avec moi, cette nuit.',
    ],
    signature: 'Malik',
  },
  doc_annonce_helene: {
    puce: puce('annonce d’Hélène', 'f', true),
    support: 'message',
    ou: 'sur un enregistreur de poche, fixé à la paroi par un bout d’adhésif',
    corps: [
      '[voix posée] Ici Hélène. Rémi Varga n’a pas reparu depuis qu’il est allé seul au hangar six, cette nuit.',
      '[un temps] L’expéditeur du conteneur ne répond pas, et nous savons maintenant que son adresse n’existe pas.',
      'Jusqu’à nouvel ordre, personne ne va seul au hangar, et personne n’ouvre ce qui est fermé.',
    ],
  },
  // Étape 3 : confinement.
  doc_avis_confinement: {
    puce: puce('avis de confinement', 'm', true),
    support: 'affiche',
    ou: 'imprimée à la hâte, collée de travers sur la paroi',
    corps: [
      'Avis de confinement',
      'Une fuite a été détectée dans le secteur fret.',
      'Regagnez votre poste et fermez les portes derrière vous.',
      'Ne cherchez pas à quitter votre secteur.',
      'La Direction du transit vous remercie de votre patience.',
    ],
  },
  doc_note_bastien: {
    puce: puce('note de Bastien', 'f'),
    support: 'note',
    ou: 'écrite au dos d’un bon de livraison, scotchée à la paroi',
    corps: [
      'Une gaine de câbles a pris feu entre elle et nous.',
      'Elle est restée de l’autre côté à aller et venir, sans jamais entrer dans les flammes.',
      'Une porte, elle finit par la forcer ; le feu, jamais.',
    ],
    signature: 'Bastien',
  },
  doc_releves_ines: {
    puce: puce('relevés d’Inès', 'm', false, 'p'),
    support: 'journal',
    ou: 'sur l’écran d’une tablette de mesure, abandonnée là',
    corps: [
      '14:02  Sonde de mouvement, secteur réfrigéré : activité.',
      '14:05  Température abaissée à −12 °C. Activité ralentie.',
      '14:11  À −20 °C, presque plus rien ne bouge.',
      '16:30  Retour à +4 °C. Activité toujours ralentie.',
      '16:31  Le froid ne la tue pas : il l’engourdit, et pour longtemps.',
    ],
  },
  // Étape 4 : derniers mots.
  doc_inscription: {
    puce: puce('inscription', 'f', true),
    support: 'inscription',
    ou: 'grattée dans la peinture de la paroi',
    corps: ['Pas un bruit.', 'Elle écoute.'],
  },
  doc_enregistreur: {
    puce: puce('enregistreur', 'm', true),
    support: 'message',
    ou: 'sur un enregistreur de poche, glissé dans une fente de la paroi',
    corps: [
      '[voix basse, très près du micro] Lucie, c’est papa : ils parlent d’une fuite, on est confinés, mais j’ai de quoi manger pour une semaine, ne t’inquiète pas.',
      '[un long silence] Il ne faut pas faire de bruit, ici. Ça n’a pas d’yeux, mais si tu bouges devant, ça le sent.',
      'Je vais attendre que ça passe, et je te… [fin de l’enregistrement]',
    ],
  },
  doc_main_courante: {
    puce: puce('main courante', 'f'),
    support: 'journal',
    ou: 'sur un terminal portable à l’écran fendu',
    corps: [
      '03:52  Repli au poste de sûreté, cinq personnes. Porte verrouillée.',
      '03:58  Coups contre la porte. Personne ne parle.',
      '04:03  La porte cède. Repli par la trappe du conduit.',
      '04:05  Elle ne passe pas dans le conduit : trop large.',
      '04:20  Elle gratte encore au bout. Nous ne bougeons plus.',
    ],
  },
};

/** Note de la trousse de soin du butin (spec §6.6) : le trou désigne la pièce de la trousse. */
const TROUSSE: Readonly<Record<string, TexteDocument>> = {
  doc_papier_plie: {
    puce: puce('papier plié', 'm'),
    support: 'note',
    ou: 'glissée dans une fente de la paroi',
    corps: ['J’ai mis une trousse de soin de côté, {a:piece}, pour qui en aura besoin.', 'Prenez-la sans scrupule.'],
    signature: 'Odile',
  },
};

/** Textes des documents de l'univers, de la menace et de la trousse. */
export const DOCUMENTS: Readonly<Record<string, TexteDocument>> = { ...UNIVERS, ...MENACE, ...TROUSSE };

const univers = (id: string, etiquette: string): EmplacementDocument => ({ id, couche: 'univers', etiquettes: [etiquette] });
const menace = (id: string, etape: 1 | 2 | 3 | 4): EmplacementDocument => ({ id, couche: 'menace', etape });
const morceau = (id: string, de: string): EmplacementDocument => ({ id, couche: 'morceau', morceau: de });
const rangement = (id: string, de: string, cle: string): EmplacementDocument => ({ id, couche: 'rangement', morceau: de, cle });

/**
 * Places de toute la réserve, documents des morceaux compris (bible §5) : huit de l'univers, sur les étiquettes de la réserve
 * d'essai qui a mesuré la couverture ; douze de la menace, trois par étape ; dix des morceaux ; neuf notes de rangement.
 */
export const EMPLACEMENTS_DOCUMENTS: readonly EmplacementDocument[] = [
  univers('doc_carte_postale', 'couchage'),
  univers('doc_affiche_eau', 'eau'),
  univers('doc_journal_maintenance', 'outillage'),
  univers('doc_note_punaisee', 'rangement'),
  univers('doc_affiche_securite', 'securite'),
  univers('doc_mot_odile', 'soin'),
  univers('doc_note_service', 'document'),
  univers('doc_message_wen', 'document'),
  menace('doc_journal_sanitaire', 1),
  menace('doc_mot_remi', 1),
  menace('doc_message_malik', 1),
  menace('doc_terminal_quart', 2),
  menace('doc_mot_malik', 2),
  menace('doc_annonce_helene', 2),
  menace('doc_avis_confinement', 3),
  menace('doc_note_bastien', 3),
  menace('doc_releves_ines', 3),
  menace('doc_inscription', 4),
  menace('doc_enregistreur', 4),
  menace('doc_main_courante', 4),
  morceau('doc_note_yann', 'm-01'),
  morceau('doc_note_clara', 'm-02'),
  morceau('doc_message_sami', 'm-04'),
  morceau('doc_note_joel', 'm-05'),
  morceau('doc_mot_bastien', 'm-07'),
  morceau('doc_message_odile', 'm-08'),
  morceau('doc_journal_wen', 'm-09'),
  morceau('doc_message_helene', 'm-10'),
  morceau('doc_journal_ines', 'm-11'),
  morceau('doc_message_clara', 'm-12'),
  rangement('doc_note_scotchee', 'm-01', 'o-bidon'),
  rangement('doc_bout_carton', 'm-02', 'o-caisse'),
  rangement('doc_fiche_volante', 'm-03', 'o-bloc'),
  rangement('doc_pense_bete', 'm-04', 'o-burette'),
  rangement('doc_bon_rangement', 'm-06', 'o-combinaison'),
  rangement('doc_note_helene', 'm-06', 'o-decoupeuse'),
  rangement('doc_mot_nadia', 'm-08', 'o-planche'),
  rangement('doc_fiche_pret', 'm-11', 'o-carte'),
  // Valeur de `CLE_TROUSSE` (engine/station.ts) : le contenu n'importe que des types du moteur ; tools/documents.test.ts garde l'égalité.
  { id: 'doc_papier_plie', couche: 'rangement', cle: 'butin:soin' },
];

/** Réserve des grandes stations : toutes les places, de cinq à sept documents posés par station (spec §8.4). */
export const RESERVE_DOCUMENTS: ReserveDocuments = { emplacements: EMPLACEMENTS_DOCUMENTS, parStation: [5, 7] };
