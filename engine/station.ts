import { validerMonde, type DefAssistance, type DefLiaison, type DefMonde, type DefObjet, type DefPiece, type DefPosition } from './monde';
import { liensEnChaine, porteEntre, poserTuiles, prefixer, type Lien } from './pose';

export { prefixer };

// Morceaux écrits à la main et leur assemblage en station (docs/13-morceaux-lancement.md, GP-01). Aucune règle de jeu ici :
// l'assembleur produit un monde ordinaire, revalidé par `validerMonde`.

/** `carrefour` : couloir et sas de l'ordre libre, qui desservent deux morceaux de chemin puis le final (D-259). */
export type FamilleMorceau = 'depart' | 'chemin' | 'carrefour' | 'final';
export type Apport = 'acces' | 'evacuation';
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
  if (morceau.famille === 'final') {
    if (morceau.sortie !== undefined) erreurs.push(`${morceau.id} : final avec une sortie.`);
    if (!morceau.fournit.includes('evacuation')) erreurs.push(`${morceau.id} : final qui ne fournit pas l’évacuation.`);
  } else if (morceau.sortie === undefined) erreurs.push(`${morceau.id} : morceau sans sortie.`);
  else if (!pieces.has(morceau.sortie.piece)) erreurs.push(`${morceau.id} : sortie depuis une pièce inconnue ${morceau.sortie.piece}.`);
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
  const erreurs = validerMonde(monde);
  return erreurs.length > 0 ? { type: 'invalide', erreurs } : { type: 'station', monde };
};
