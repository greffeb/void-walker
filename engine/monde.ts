import { hacher } from './hachage';

// Forme commune d'un monde (C-02). `nom` est une clé publique vers le texte ; `id` reste interne.

export interface DefPiece {
  readonly id: string;
  readonly nom: string;
}

export interface DefLiaison {
  readonly id: string;
  readonly nom: string;
  readonly entre: readonly [string, string];
  readonly ouverte: boolean;
}

export interface DefObjet {
  readonly id: string;
  readonly nom: string;
  readonly piece: string;
}

export interface DefMonde {
  readonly id: string;
  readonly depart: string;
  readonly pieces: readonly DefPiece[];
  readonly liaisons: readonly DefLiaison[];
  readonly objets: readonly DefObjet[];
}

export interface IndexMonde {
  readonly pieces: ReadonlyMap<string, DefPiece>;
  readonly liaisons: ReadonlyMap<string, DefLiaison>;
  readonly objets: ReadonlyMap<string, DefObjet>;
  readonly versPublic: ReadonlyMap<string, string>;
  readonly versInterne: ReadonlyMap<string, string>;
}

/** Identifiant public opaque (C-01 §3) : ne dépend que du monde et de l'entité elle-même. */
export function idPublic(monde: string, idInterne: string): string {
  return `e${hacher(`${monde}/${idInterne}`).slice(-8)}`;
}

export function validerMonde(monde: DefMonde): string[] {
  const erreurs: string[] = [];
  const vus = new Set<string>();
  const publics = new Map<string, string>();
  const entites = [...monde.pieces, ...monde.liaisons, ...monde.objets];
  for (const entite of entites) {
    if (entite.id === '') erreurs.push('Identifiant vide.');
    if (entite.nom === '') erreurs.push(`${entite.id} : nom vide.`);
    if (vus.has(entite.id)) erreurs.push(`${entite.id} : identifiant en double.`);
    vus.add(entite.id);
    const publicId = idPublic(monde.id, entite.id);
    const autre = publics.get(publicId);
    if (autre !== undefined && autre !== entite.id) erreurs.push(`${entite.id} et ${autre} : même identifiant public.`);
    publics.set(publicId, entite.id);
  }
  const pieces = new Set(monde.pieces.map((piece) => piece.id));
  if (!pieces.has(monde.depart)) erreurs.push(`Départ inconnu : ${monde.depart}.`);
  for (const liaison of monde.liaisons) {
    const [a, b] = liaison.entre;
    if (!pieces.has(a) || !pieces.has(b)) erreurs.push(`${liaison.id} : pièce inconnue.`);
    if (a === b) erreurs.push(`${liaison.id} : relie une pièce à elle-même.`);
  }
  for (const objet of monde.objets) {
    if (!pieces.has(objet.piece)) erreurs.push(`${objet.id} : pièce inconnue ${objet.piece}.`);
  }
  return erreurs;
}

const index = new WeakMap<DefMonde, IndexMonde>();

export function indexer(monde: DefMonde): IndexMonde {
  const existant = index.get(monde);
  if (existant !== undefined) return existant;
  const erreurs = validerMonde(monde);
  if (erreurs.length > 0) throw new Error(`Monde ${monde.id} invalide : ${erreurs.join(' ')}`);
  const versPublic = new Map<string, string>();
  const versInterne = new Map<string, string>();
  for (const entite of [...monde.pieces, ...monde.liaisons, ...monde.objets]) {
    const publicId = idPublic(monde.id, entite.id);
    versPublic.set(entite.id, publicId);
    versInterne.set(publicId, entite.id);
  }
  const resultat: IndexMonde = {
    pieces: new Map(monde.pieces.map((piece) => [piece.id, piece])),
    liaisons: new Map(monde.liaisons.map((liaison) => [liaison.id, liaison])),
    objets: new Map(monde.objets.map((objet) => [objet.id, objet])),
    versPublic,
    versInterne,
  };
  index.set(monde, resultat);
  return resultat;
}
