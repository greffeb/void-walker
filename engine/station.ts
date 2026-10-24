import { etendreGrande } from './grande';
import { validerMonde, type CategoriePiece, type DefAssistance, type DefLiaison, type DefMonde, type DefObjet, type DefPiece, type DefPosition, type FormeAnnexe } from './monde';
import { liensEnChaine, porteEntre, poserTuiles, prefixer, type Lien } from './pose';

export { prefixer };
export type { CategoriePiece, FormeAnnexe };

// Morceaux écrits à la main et leur assemblage en station (docs/13-morceaux-lancement.md, GP-01). Aucune règle de jeu ici :
// l'assembleur produit un monde ordinaire, revalidé par `validerMonde`.

/**
 * `carrefour` : couloir et sas de l'ordre libre, qui desservent deux morceaux de chemin puis le final (D-259). `annexe` : pièce
 * sans obstacle du catalogue, accrochée au chemin d'une grande station (spec 2026-10-18 §6.1).
 */
export type FamilleMorceau = 'depart' | 'chemin' | 'carrefour' | 'final' | 'annexe';
export type Apport = 'acces' | 'evacuation';

export interface DefAnnexe {
  readonly categorie: CategoriePiece;
  readonly forme: FormeAnnexe;
  /** Étiquettes lues par la pose des clés, du butin et des documents (spec §5.2) ; jamais un nom (D-078). */
  readonly etiquettes: readonly string[];
  /** Porte vers la pièce d'accroche au départ ; 'tiree' : ouverte une fois sur deux, selon la graine (spec §6.1). */
  readonly porte: 'ouverte' | 'fermee' | 'tiree';
  /** Ne s'accroche qu'à un couloir du catalogue qui dessert déjà une pièce portant cette étiquette (GE-10). */
  readonly surCouloirDe?: string;
}

/** Clé déplaçable d'un morceau (spec §6.5) : un objet portable qui résout un obstacle et peut attendre ailleurs que chez lui. */
export interface DefCle {
  /** Étiquettes de pièce du catalogue où la clé peut attendre (spec §5.2). */
  readonly etiquettes: readonly string[];
  /** Dans une grande station, un appui déplaçable devient portable et encombrant (la caisse, spec §6.5). */
  readonly portableEnGrande?: true;
}

/** Déclarations d'un morceau pour les grandes stations (spec §4.2, §6.3) ; jamais recopiées dans le monde. */
export interface DefGrandeMorceau {
  /** Chemin dont le seul obstacle est la créature, ou obstacle matériel (D-315) ; absent pour départ, carrefour et final. */
  readonly obstacle?: 'materiel' | 'creature';
  /** Pièces où une annexe peut s'accrocher, avec leur catégorie (GE-08, GE-09). */
  readonly accueillantes: Readonly<Record<string, CategoriePiece>>;
  /** Pièces situées avant la coupe de l'obstacle. */
  readonly avant: readonly string[];
  /** Liaisons intérieures à franchir pour passer d'avant à après ; 'sortie' désigne la porte de sortie du morceau. */
  readonly coupe: readonly string[];
  /** Clés déplaçables du morceau, par identifiant d'objet non préfixé (spec §6.5). */
  readonly cles?: Readonly<Record<string, DefCle>>;
}
/** Porte de sortie vers le morceau suivant, décrite par le morceau. */
export type DefPorteSortie = Omit<DefLiaison, 'id' | 'entre' | 'ouverte' | 'plan'>;

export interface DefMorceau {
  readonly id: string;
  readonly famille: FamilleMorceau;
  /** `plan` en coordonnées locales (tuile) ; sous-positions sans plan. */
  readonly pieces: readonly DefPiece[];
  /** Liaisons intérieures, sans `plan`. */
  readonly liaisons: readonly DefLiaison[];
  readonly objets: readonly DefObjet[];
  readonly positions?: readonly DefPosition[];
  /** Pièce d'entrée ; pour un départ, pièce du réveil. */
  readonly entree: string;
  /** Absente pour un final. */
  readonly sortie?: { readonly piece: string; readonly porte: DefPorteSortie };
  readonly placesCreature: readonly string[];
  readonly demande: readonly Apport[];
  readonly fournit: readonly Apport[];
  readonly assistance?: readonly DefAssistance[];
  /** Pour la famille `annexe` seulement. */
  readonly annexe?: DefAnnexe;
  readonly grande?: DefGrandeMorceau;
}

/** Porte qui accroche un morceau, par son entrée, à une pièce d'un morceau placé avant lui (ordre libre, D-259). */
export interface DefAccroche {
  /** Morceau d'où part la porte. */
  readonly depuis: string;
  /** Pièce de ce morceau, non préfixée. */
  readonly piece: string;
  /** Morceau accroché par son entrée. */
  readonly vers: string;
  readonly porte: DefPorteSortie;
}

/** Commande fixe de déverrouillage posée par l'assemblage dans la pièce d'un morceau (ordre libre, D-259, 13 §8.3). */
export interface DefCommande {
  /** Identifiant local, préfixé par le morceau. */
  readonly id: string;
  readonly nom: string;
  readonly morceau: string;
  /** Pièce de ce morceau, non préfixée. */
  readonly piece: string;
  /** Liaison de la station qu'elle déverrouille, déjà préfixée, ou porte entre deux morceaux. */
  readonly cloison: string;
}

export interface DefStation {
  /** Devient `monde.id`. */
  readonly id: string;
  /** Ordre du chemin ; le premier donne le départ, le dernier est un final. */
  readonly morceaux: readonly DefMorceau[];
  /** Pièce préfixée, ex. 'm-07/p-soute'. */
  readonly creature: string;
  /** Graine du plan. */
  readonly graine: number;
  readonly assistance?: readonly DefAssistance[];
  /** Stations de test : morceaux dont la porte de sortie est ouverte au départ. */
  readonly sortiesOuvertes?: readonly string[];
  /**
   * Ordre libre : chaque morceau après le premier accroché par une seule de ces portes, à un morceau qui le précède ; les
   * sorties des morceaux ne servent plus. Absent : en chaîne, chaque morceau par sa sortie vers le suivant.
   */
  readonly accroches?: readonly DefAccroche[];
  readonly commandes?: readonly DefCommande[];
  /** Grande station (spec 2026-10-18 §6) : annexes, boucles, piste et bruits de station, autour du chemin principal. */
  readonly grande?: DefStationGrande;
}

export interface DefStationGrande {
  /** Version du générateur, 1 pour ce lot (spec §4.3). */
  readonly version: number;
  /** Pièces du catalogue, morceaux de famille annexe. */
  readonly catalogue: readonly DefMorceau[];
  /** Annexes à poser (spec §4.1 : 24 moins les pièces dessinées des morceaux, de 6 à 10). */
  readonly annexes: number;
  /** Portes de boucle voulues, de 1 à 3 (spec §6.4). */
  readonly boucles: number;
  /** Pièces dessinées au moins (spec §4.1) : un plan qui en compte moins, reprise de couverture comprise, n'existe pas pour cette graine. */
  readonly piecesMin?: number;
  /** Butin des salles de butin (spec §6.6) ; absent : aucune salle de butin. */
  readonly butin?: TableButin;
  /** Réserve de documents à lire (spec §8.4) ; absente : aucun document. */
  readonly documents?: ReserveDocuments;
  /** Part des pièces que le territoire de départ de la créature atteint, de 0 à 1 ; absente ou 0 : aucune porte ouverte (spec créature mobile §territoire). */
  readonly etendue?: number;
  /**
   * Salle de surveillance (créature mobile lot 4, §4.3) : sur la part `part` des stations, tirée par identifiant, une impasse posée devient `salle`, et le
   * monde reçoit un post-it et des caméras ; absente : rien de tout cela.
   */
  readonly surveillance?: { readonly salle: DefMorceau; readonly part: number };
}

/** Les quatre couches d'écriture des documents (spec §8.4) : la vie d'avant, l'incident, une tentative sur un obstacle, une clé rangée. */
export type CoucheDocument = 'univers' | 'menace' | 'morceau' | 'rangement';

export { CLE_TROUSSE } from './documents';

/** Un document de la réserve du contenu et sa place (spec §8.4, §8.5) ; le texte vit dans la section `documents` du contenu. */
export interface EmplacementDocument {
  /** Clé de texte du document. */
  readonly id: string;
  readonly couche: CoucheDocument;
  /** Menace : l'étape de la piste où il se lit. */
  readonly etape?: 1 | 2 | 3 | 4;
  /** Univers : étiquettes de pièce du catalogue acceptées. */
  readonly etiquettes?: readonly string[];
  /** Morceau, rangement : le morceau du document. */
  readonly morceau?: string;
  /** Rangement : l'objet désigné (id d'objet du morceau, ou `CLE_TROUSSE` pour la trousse). */
  readonly cle?: string;
}

/** Réserve de documents du contenu : leurs places, et le nombre posé par station (bornes comprises). */
export interface ReserveDocuments {
  readonly emplacements: readonly EmplacementDocument[];
  readonly parStation: readonly [number, number];
}

/** Entrée de la table de butin (spec §6.6) : un objet sans qualité passive, son poids de tirage et sa condition de place. */
export interface EntreeButin {
  readonly objet: DefObjet;
  readonly poids: number;
  /** Ne se pose que dans un segment situé après la coupe de ce morceau, s'il est dans la station (la burette, après M-04). */
  readonly apresCoupeDe?: string;
}

/** Table de butin du contenu : entrées pondérées, poids de la salle vide, nombre de salles de butin (bornes comprises). */
export interface TableButin {
  readonly entrees: readonly EntreeButin[];
  /** Poids de la salle vide, dans le même tirage que les entrées. */
  readonly vide: number;
  readonly salles: readonly [number, number];
}

export type ResultatAssemblage =
  | { readonly type: 'station'; readonly monde: DefMonde }
  | { readonly type: 'sans_plan' }
  | { readonly type: 'invalide'; readonly erreurs: readonly string[] };

export type Assembleur = (station: DefStation) => ResultatAssemblage;

export function validerMorceau(morceau: DefMorceau): string[] {
  const erreurs: string[] = [];
  const pieces = new Set(morceau.pieces.map((piece) => piece.id));
  for (const piece of morceau.pieces) {
    const id = prefixer(morceau.id, piece.id);
    if (piece.sousPosition === true && piece.plan !== undefined) erreurs.push(`${id} : sous-position avec un plan.`);
    if (piece.sousPosition !== true && piece.plan === undefined) erreurs.push(`${id} : pièce sans plan.`);
  }
  for (const liaison of morceau.liaisons) if (liaison.plan !== undefined) erreurs.push(`${prefixer(morceau.id, liaison.id)} : liaison avec un plan.`);
  if (!pieces.has(morceau.entree)) erreurs.push(`${morceau.id} : entrée inconnue ${morceau.entree}.`);
  for (const place of morceau.placesCreature) if (!pieces.has(place)) erreurs.push(`${morceau.id} : place de la créature inconnue ${place}.`);
  if (morceau.famille === 'annexe') {
    if (morceau.annexe === undefined) erreurs.push(`${morceau.id} : famille annexe sans déclaration d’annexe.`);
    if (morceau.sortie !== undefined) erreurs.push(`${morceau.id} : annexe avec une sortie.`);
    if (morceau.pieces.length !== 1 || morceau.pieces[0]?.plan === undefined) erreurs.push(`${morceau.id} : une annexe a une seule pièce, dessinée.`);
    if (morceau.placesCreature.length > 0) erreurs.push(`${morceau.id} : annexe avec une place de créature.`);
  } else if (morceau.annexe !== undefined) erreurs.push(`${morceau.id} : déclaration d’annexe hors de la famille annexe.`);
  if (morceau.grande !== undefined) {
    const liaisons = new Set(morceau.liaisons.map((liaison) => liaison.id));
    for (const piece of [...Object.keys(morceau.grande.accueillantes), ...morceau.grande.avant]) {
      if (!pieces.has(piece)) erreurs.push(`${morceau.id} : pièce de grande station inconnue ${piece}.`);
    }
    for (const liaison of morceau.grande.coupe) if (liaison !== 'sortie' && !liaisons.has(liaison)) erreurs.push(`${morceau.id} : coupe inconnue ${liaison}.`);
    for (const [id, cle] of Object.entries(morceau.grande.cles ?? {})) {
      const objet = morceau.objets.find((candidat) => candidat.id === id);
      if (objet === undefined) erreurs.push(`${morceau.id} : clé qui n'est pas un objet du morceau ${id}.`);
      else if (objet.portable === false && cle.portableEnGrande !== true) erreurs.push(`${morceau.id} : clé qui ne se porte pas ${id}.`);
      if (cle.etiquettes.includes('')) erreurs.push(`${morceau.id} : clé ${id} avec une étiquette vide.`);
    }
  }
  if (morceau.famille === 'final') {
    if (morceau.sortie !== undefined) erreurs.push(`${morceau.id} : final avec une sortie.`);
    if (!morceau.fournit.includes('evacuation')) erreurs.push(`${morceau.id} : final qui ne fournit pas l’évacuation.`);
  } else if (morceau.famille !== 'annexe') {
    // Une annexe finit en cul-de-sac : son absence de sortie est contrôlée plus haut.
    if (morceau.sortie === undefined) erreurs.push(`${morceau.id} : morceau sans sortie.`);
    else if (!pieces.has(morceau.sortie.piece)) erreurs.push(`${morceau.id} : sortie depuis une pièce inconnue ${morceau.sortie.piece}.`);
  }
  // Aucune position ne peut se trouver sous la porte de sortie, dont l'identifiant n'est pas préfixé : elle ne s'ouvrirait jamais.
  if (morceau.sortie?.porte.haute !== undefined) erreurs.push(`${morceau.id} : porte de sortie haute.`);
  return erreurs;
}

/** `{ [cle]: référence préfixée }`, ou rien si la référence est absente. */
function ref<K extends string>(morceau: string, cle: K, id: string | undefined): Partial<Record<K, string>> {
  return id === undefined ? {} : ({ [cle]: prefixer(morceau, id) } as Record<K, string>);
}

function porteDe(morceau: string, porte: DefPorteSortie): DefPorteSortie {
  return { ...porte, ...ref(morceau, 'haute', porte.haute), ...ref(morceau, 'cachee', porte.cachee), ...ref(morceau, 'manoeuvre', porte.manoeuvre) };
}

function liaisonDe(morceau: string, liaison: DefLiaison): DefLiaison {
  const [a, b] = liaison.entre;
  return { ...liaison, ...porteDe(morceau, liaison), id: prefixer(morceau, liaison.id), entre: [prefixer(morceau, a), prefixer(morceau, b)] };
}

function objetDe(morceau: string, objet: DefObjet): DefObjet {
  const { capsule, avertisseur } = objet;
  return {
    ...objet,
    id: prefixer(morceau, objet.id),
    piece: prefixer(morceau, objet.piece),
    ...ref(morceau, 'position', objet.position),
    ...ref(morceau, 'alimente', objet.alimente),
    ...ref(morceau, 'depart', objet.depart),
    ...ref(morceau, 'machines', objet.machines),
    ...ref(morceau, 'gravite', objet.gravite),
    ...ref(morceau, 'fermeture', objet.fermeture),
    ...ref(morceau, 'deverrouille', objet.deverrouille),
    ...ref(morceau, 'exige', objet.exige),
    ...(objet.drone === undefined ? {} : { drone: { obstacle: prefixer(morceau, objet.drone.obstacle) } }),
    ...(objet.obstacle === undefined ? {} : { obstacle: {
      passage: prefixer(morceau, objet.obstacle.passage),
      rangement: prefixer(morceau, objet.obstacle.rangement),
    } }),
    ...(capsule === undefined ? {} : { capsule: { ...capsule, interieur: prefixer(morceau, capsule.interieur) } }),
    ...(avertisseur === undefined ? {} : { avertisseur: { ...avertisseur, piece: prefixer(morceau, avertisseur.piece) } }),
  };
}

function assistanceDe(morceau: string, message: DefAssistance): DefAssistance {
  return message.quand.type === 'arrivee' ? { ...message, quand: { ...message.quand, piece: prefixer(morceau, message.quand.piece) } } : message;
}

/** Erreurs de composition : morceaux, ordre des familles, apports, place de la créature. */
function erreursDeComposition(station: DefStation, depart: string): string[] {
  const { morceaux } = station;
  const erreurs = morceaux.flatMap(validerMorceau);
  const rangs = new Map(morceaux.map((morceau, rang) => [morceau.id, rang]));
  if (rangs.size !== morceaux.length) erreurs.push('Morceau en double dans la station.');
  if (station.accroches !== undefined) {
    for (const accroche of station.accroches) {
      const depuis = rangs.get(accroche.depuis);
      const vers = rangs.get(accroche.vers);
      if (depuis === undefined || vers === undefined) erreurs.push(`Accroche ${accroche.depuis} → ${accroche.vers} : morceau absent.`);
      else if (depuis >= vers) erreurs.push(`Accroche ${accroche.depuis} → ${accroche.vers} : vers un morceau placé avant.`);
      else if (!morceaux[depuis]?.pieces.some((piece) => piece.id === accroche.piece)) erreurs.push(`Accroche ${accroche.depuis} → ${accroche.vers} : pièce inconnue ${accroche.piece}.`);
    }
    morceaux.forEach((morceau, rang) => {
      const nombre = station.accroches?.filter((accroche) => accroche.vers === morceau.id).length ?? 0;
      if (rang > 0 && nombre !== 1) erreurs.push(`${morceau.id} : ${nombre} accroches au lieu d’une.`);
      if (rang === 0 && nombre > 0) erreurs.push(`${morceau.id} : premier morceau accroché.`);
    });
  }
  for (const commande of station.commandes ?? []) {
    const morceau = morceaux.find((candidat) => candidat.id === commande.morceau);
    if (morceau === undefined || !morceau.pieces.some((piece) => piece.id === commande.piece)) erreurs.push(`Commande ${commande.id} : pièce inconnue.`);
  }
  morceaux.forEach((morceau, rang) => {
    const dernier = rang === morceaux.length - 1;
    if (morceau.famille === 'final' && !dernier) erreurs.push(`${morceau.id} : final avant le dernier morceau.`);
    if (morceau.famille !== 'final' && dernier) erreurs.push(`${morceau.id} : dernier morceau qui n’est pas un final.`);
    if (morceau.famille === 'final' && station.accroches?.some((accroche) => accroche.depuis === morceau.id) === true) erreurs.push(`${morceau.id} : final qui dessert un morceau.`);
    const fournis = new Set(morceaux.slice(0, rang).flatMap((precedent) => precedent.fournit));
    for (const apport of morceau.demande) if (!fournis.has(apport)) erreurs.push(`${morceau.id} : demande ${apport}, qu’aucun morceau précédent ne fournit.`);
  });
  const places = new Set(morceaux.flatMap((morceau) => morceau.placesCreature.map((place) => prefixer(morceau.id, place))));
  if (!places.has(station.creature)) erreurs.push(`Créature hors des places des morceaux : ${station.creature}.`);
  if (station.creature === depart) erreurs.push(`Créature dans la pièce de départ : ${station.creature}.`);
  return erreurs;
}

/** Accroches de la chaîne : la sortie de chaque morceau vers l'entrée du suivant. */
function chaine(morceaux: readonly DefMorceau[]): DefAccroche[] {
  return morceaux.flatMap((morceau, rang): DefAccroche[] => {
    const suivant = morceaux[rang + 1];
    return morceau.sortie === undefined || suivant === undefined ? [] : [{ depuis: morceau.id, piece: morceau.sortie.piece, vers: suivant.id, porte: morceau.sortie.porte }];
  });
}

function exigerMorceau(morceaux: readonly DefMorceau[], id: string): DefMorceau {
  const morceau = morceaux.find((candidat) => candidat.id === id);
  if (morceau === undefined) throw new Error(`Morceau absent : ${id}.`);
  return morceau;
}

export const assemblerStation: Assembleur = (station) => {
  const { morceaux } = station;
  const premier = morceaux[0];
  if (premier === undefined) return { type: 'invalide', erreurs: ['Station sans morceau.'] };
  const depart = prefixer(premier.id, premier.entree);
  const composition = erreursDeComposition(station, depart);
  if (composition.length > 0) return { type: 'invalide', erreurs: composition };
  // Portes entre morceaux, chacune avec la pièce d'où elle part ; en chaîne, la sortie de chaque morceau vers le suivant.
  const portesEntre = (station.accroches ?? chaine(morceaux)).map((accroche) => ({
    ...accroche,
    id: porteEntre(accroche.depuis, accroche.vers),
    rang: morceaux.findIndex((morceau) => morceau.id === accroche.vers),
  }));
  const liens: Lien[] = portesEntre.map((porte) => ({ depuis: prefixer(porte.depuis, porte.piece), vers: porte.rang, porte: porte.id }));
  const pose = poserTuiles(morceaux, station.graine, station.accroches === undefined ? liensEnChaine(morceaux) : liens);
  if (pose === null) return { type: 'sans_plan' };
  const ouvertes = new Set(station.sortiesOuvertes ?? []);
  const entreMorceaux = portesEntre.map((porte): DefLiaison => {
    const vers = exigerMorceau(morceaux, porte.vers);
    const rang = pose.portes.get(porte.id);
    return {
      ...porteDe(porte.depuis, porte.porte),
      id: porte.id,
      entre: [prefixer(porte.depuis, porte.piece), prefixer(vers.id, vers.entree)],
      ouverte: ouvertes.has(porte.depuis),
      ...(rang === undefined ? {} : { plan: { rang } }),
    };
  });
  // Dans l'ordre d'avant L5 : les liaisons intérieures de chaque morceau, puis sa porte vers le morceau qu'il dessert.
  const liaisons = morceaux.flatMap((morceau): DefLiaison[] => [
    ...morceau.liaisons.map((liaison) => liaisonDe(morceau.id, liaison)),
    ...entreMorceaux.filter((_, indice) => portesEntre[indice]?.depuis === morceau.id),
  ]);
  const commandes = (station.commandes ?? []).map(
    (commande): DefObjet => ({ id: prefixer(commande.morceau, commande.id), nom: commande.nom, piece: prefixer(commande.morceau, commande.piece), portable: false, deverrouille: commande.cloison }),
  );
  const monde: DefMonde = {
    id: station.id,
    depart,
    pieces: morceaux.flatMap((morceau) =>
      morceau.pieces.map((piece) => {
        const id = prefixer(morceau.id, piece.id);
        const plan = pose.rects.get(id);
        return plan === undefined ? { ...piece, id } : { ...piece, id, plan };
      }),
    ),
    liaisons,
    objets: [...morceaux.flatMap((morceau) => morceau.objets.map((objet) => objetDe(morceau.id, objet))), ...commandes],
    positions: morceaux.flatMap((morceau) =>
      (morceau.positions ?? []).map((position) => ({
        ...position,
        id: prefixer(morceau.id, position.id),
        piece: prefixer(morceau.id, position.piece),
        ...ref(morceau.id, 'sous', position.sous),
      })),
    ),
    creature: { piece: station.creature },
    assistance: [...(station.assistance ?? []), ...morceaux.flatMap((morceau) => (morceau.assistance ?? []).map((message) => assistanceDe(morceau.id, message)))],
  };
  const final = station.grande === undefined ? monde : etendreGrande(monde, station, station.grande);
  if (final === null) return { type: 'sans_plan' };
  const erreurs = validerMonde(final);
  return erreurs.length > 0 ? { type: 'invalide', erreurs } : { type: 'station', monde: final };
};
