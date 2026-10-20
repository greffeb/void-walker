// Textes des qualités de maintien : communs à tout monde qui les déclare.
export const EVENEMENTS_DRONE = {
  drone_envoye: ['Vous lancez le moteur {de:objet}. Il gronde sur son rail.'],
  drone_maintient: ['{Le:objet} abaisse la poignée. Le moteur force pour la garder en position.'],
  drone_deraille: ['{Le:objet} bascule hors du rail. La poignée remonte et le moteur se coupe.'],
  drone_replace: ['Vous redressez {le:objet} et remettez ses roues sur le rail. Son arrêt de sécurité reste enclenché.'],
  drone_rearme: ['Vous réarmez {le:objet}. Le moteur repart et la poignée reste abaissée.'],
  drone_arrete: ['Vous arrêtez {le:objet}. La poignée remonte ; le frein se resserre.'],
  drone_termine: ['{Le:objet} relâche la poignée et coupe son moteur : le passage reste dégagé.'],
  drone_bruit_arrete: ['Derrière {le:passage}, un choc métallique retentit. Le moteur se tait.'],
  poignee_tenue: ['Vous abaissez {le:objet} et la gardez en main. Vous devez rester ici.'],
  poignee_lachee: ['Vous lâchez {le:objet}. Le maintien de votre main cesse.'],
  passage_ouvert_encombre: ['Vous ouvrez {le:passage}. Un obstacle matériel barre encore le passage.'],
} as const;
export const REFUS_DRONE = {
  lacher_poignee: 'Vous devez d’abord lâcher la poignée.',
  frein_serre: 'Le frein est serré. La poignée doit rester abaissée pendant que vous poussez.',
  encombre_par_obstacle: 'Un obstacle matériel bloque le passage.',
} as const;
export const LIBELLES_DRONE = {
  envoyer: 'Envoyer {le:cible} tenir la poignée',
  tenir: 'Tenir {le:cible}',
  lacher: 'Lâcher {le:cible}',
  replacer: 'Remettre {le:cible} sur le rail',
  rearmer: 'Réarmer et relancer {le:cible}',
  arreter_drone: 'Arrêter {le:cible}',
  reprendre_drone: 'Reprendre le maintien avec {le:cible}',
} as const;
export const VERBES_DRONE = {
  envoyer: 'Envoyer tenir la poignée', tenir: 'Tenir', lacher: 'Lâcher',
  replacer: 'Remettre sur le rail', rearmer: 'Réarmer et relancer',
  arreter_drone: 'Arrêter', reprendre_drone: 'Reprendre le maintien',
} as const;
export const SAVOIR_DRONE = {
  enverra_drone: '{Le:objet} rejoindra la poignée par son rail, puis la tiendra à votre prochain geste. Son moteur restera bruyant.',
  tiendra: 'Vous tiendrez {le:objet} sur place. Partir la relâchera ; les autres manipulations demandent de lâcher.',
  lachera: 'Vous lâcherez {le:objet}. Votre main ne maintiendra plus le mécanisme.',
  replacera_drone: '{Le:objet} sera remis{e:objet} sur son rail, moteur coupé. Réarmer demandera un second geste.',
  rearmera_drone: '{Le:objet} reprendra le maintien, moteur bruyant. Ce geste ne vous soigne pas.',
  arretera_drone: '{Le:objet} lâchera la poignée et coupera son moteur.',
} as const;
export const OBSERVATION_DRONE = {
  drone_veille: '{Le:objet} attend sur son rail. Son trajet se limite à la poignée.',
  drone_trajet: '{Le:objet} est en route sur le rail ; il ne tient pas encore la poignée.',
  drone_maintien: '{Le:objet} garde la poignée abaissée. Son moteur gronde sans cesse.',
  drone_deraille: '{Le:objet} est renversé hors du rail, moteur coupé. Il faut le replacer, puis le réarmer.',
  drone_a_rearmer: '{Le:objet} est sur le rail, moteur coupé. Il reste à lever son arrêt de sécurité.',
  drone_arrete: '{Le:objet} est arrêté{e:objet} au poste, sans tenir la poignée.',
  drone_termine: '{Le:objet} a terminé sa tâche. Le moteur est coupé.',
  poigneeTenue: 'Vous tenez {le:objet}. Partir vous obligera à lâcher.',
  freinSerre: 'Le frein {de:objet} est serré. Il faut maintenir la poignée depuis le poste.',
  freinDesserre: 'Le frein {de:objet} est desserré. Vous pouvez pousser pendant le maintien.',
  passageEncombre: '{Le:passage} est ouvert{e:passage}, mais un obstacle matériel empêche de passer.',
} as const;
