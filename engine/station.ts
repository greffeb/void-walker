import { validerMonde, type DefAssistance, type DefLiaison, type DefMonde, type DefObjet, type DefPiece, type DefPosition } from './monde';
import { porteEntre, poserTuiles, prefixer } from './pose';

export { prefixer };

// Morceaux écrits à la main et leur assemblage en station (docs/13-morceaux-lancement.md, GP-01). Aucune règle de jeu ici :
// l'assembleur produit un monde ordinaire, revalidé par `validerMonde`.

export type FamilleMorceau = 'depart' | 'chemin' | 'final';
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
  morceaux.forEach((morceau, rang) => {
    const dernier = rang === morceaux.length - 1;
    if (morceau.famille === 'final' && !dernier) erreurs.push(`${morceau.id} : final avant le dernier morceau.`);
    if (morceau.famille !== 'final' && dernier) erreurs.push(`${morceau.id} : dernier morceau qui n’est pas un final.`);
    const fournis = new Set(morceaux.slice(0, rang).flatMap((precedent) => precedent.fournit));
    for (const apport of morceau.demande) if (!fournis.has(apport)) erreurs.push(`${morceau.id} : demande ${apport}, qu’aucun morceau précédent ne fournit.`);
  });
  const places = new Set(morceaux.flatMap((morceau) => morceau.placesCreature.map((place) => prefixer(morceau.id, place))));
  if (!places.has(station.creature)) erreurs.push(`Créature hors des places des morceaux : ${station.creature}.`);
  if (station.creature === depart) erreurs.push(`Créature dans la pièce de départ : ${station.creature}.`);
  return erreurs;
}

export const assemblerStation: Assembleur = (station) => {
  const { morceaux } = station;
  const premier = morceaux[0];
  if (premier === undefined) return { type: 'invalide', erreurs: ['Station sans morceau.'] };
  const depart = prefixer(premier.id, premier.entree);
  const composition = erreursDeComposition(station, depart);
  if (composition.length > 0) return { type: 'invalide', erreurs: composition };
  const pose = poserTuiles(morceaux, station.graine);
  if (pose === null) return { type: 'sans_plan' };
  const ouvertes = new Set(station.sortiesOuvertes ?? []);
  const liaisons = morceaux.flatMap((morceau, rang): DefLiaison[] => {
    const interieures = morceau.liaisons.map((liaison) => liaisonDe(morceau.id, liaison));
    const suivant = morceaux[rang + 1];
    if (morceau.sortie === undefined || suivant === undefined) return interieures;
    const id = porteEntre(morceau.id, suivant.id);
    const porte = pose.portes.get(id);
    const liaison: DefLiaison = {
      ...porteDe(morceau.id, morceau.sortie.porte),
      id,
      entre: [prefixer(morceau.id, morceau.sortie.piece), prefixer(suivant.id, suivant.entree)],
      ouverte: ouvertes.has(morceau.id),
      ...(porte === undefined ? {} : { plan: { rang: porte } }),
    };
    return [...interieures, liaison];
  });
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
    objets: morceaux.flatMap((morceau) => morceau.objets.map((objet) => objetDe(morceau.id, objet))),
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
