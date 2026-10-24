// Textes du drone et de l'obstacle qu'il dégage (#270, #271) : communs à tout monde qui les déclare. Texte final non validé.
export const EVENEMENTS_DRONE = {
  drone_envoye: ['Vous lancez {le:objet}. Son moteur gronde et il se met à rouler.'],
  drone_deraille: ['{Le:objet} bascule sur le flanc. Son moteur se coupe.'],
  drone_replace: ['Vous redressez {le:objet} sur ses roues. Son arrêt de sécurité reste enclenché.'],
  drone_rearme: ['Vous relancez {le:objet}. Son moteur repart en grondant.'],
  drone_arrete: ['Vous arrêtez {le:objet}. Son moteur se tait.'],
  drone_termine: ['{Le:objet} tire l’obstacle dans son logement, sur le côté, et coupe son moteur : le passage est libre.'],
  drone_bruit_arrete: ['Derrière {le:passage}, un choc métallique retentit. Le moteur se tait.'],
  passage_ouvert_encombre: ['Vous ouvrez {le:passage}. Un obstacle matériel barre encore le passage.'],
} as const;
export const REFUS_DRONE = {
  trop_lourd: 'Bien trop lourd pour être déplacé à la main : rien n’a été joué.',
  encombre_par_obstacle: 'Un obstacle matériel bloque le passage.',
} as const;
export const INDISPONIBILITES_DRONE = {
  trop_lourd: 'Bien trop lourd pour être déplacé à la main.',
  encombre_par_obstacle: 'Un obstacle matériel bloque le passage.',
} as const;
export const LIBELLES_DRONE = {
  envoyer: 'Envoyer {le:cible} dégager le passage',
  replacer: 'Redresser {le:cible}',
  rearmer: 'Relancer {le:cible}',
  arreter_drone: 'Arrêter {le:cible}',
  reprendre_drone: 'Relancer {le:cible}',
} as const;
export const VERBES_DRONE = {
  envoyer: 'Envoyer dégager le passage',
  replacer: 'Redresser', rearmer: 'Relancer',
  arreter_drone: 'Arrêter', reprendre_drone: 'Relancer',
} as const;
export const SAVOIR_DRONE = {
  enverra_drone: '{Le:objet} roulera seul jusqu’à l’obstacle et s’arrêtera devant chaque porte fermée. Son moteur fera du bruit en route.',
  replacera_drone: '{Le:objet} sera redressé{e:objet}, moteur coupé. Le relancer demandera un second geste.',
  rearmera_drone: '{Le:objet} reprendra sa route, moteur bruyant. Ce geste ne vous soigne pas.',
  arretera_drone: '{Le:objet} s’arrêtera sur place et coupera son moteur.',
} as const;
export const OBSERVATION_DRONE = {
  drone_veille: '{Le:objet} attend, moteur coupé.',
  drone_pret: '{Le:objet} attend, moteur coupé.',
  drone_trajet: '{Le:objet} est immobile, moteur en veille : il attend de pouvoir poursuivre sa route.',
  drone_roule: '{Le:objet} roule vers la pièce suivante ; son moteur gronde.',
  drone_traction: '{Le:objet} tire l’obstacle de toute la force de son moteur.',
  drone_deraille: '{Le:objet} est renversé sur le flanc, moteur coupé, son voyant de sécurité allumé.',
  drone_a_rearmer: '{Le:objet} est sur ses roues, moteur coupé. Il reste à le relancer.',
  drone_arrete: '{Le:objet} est arrêté{e:objet}, moteur coupé.',
  drone_termine: '{Le:objet} a terminé sa tâche. Le moteur est coupé.',
  obstacleBarre: '{Le:objet} barre {le:passage}.',
  obstacleRange: '{Le:passage} est dégagé{e:passage} : {le:objet} est rangé{e:objet} sur le côté.',
  passageEncombre: '{Le:passage} est ouvert{e:passage}, mais un obstacle matériel empêche de passer.',
} as const;
