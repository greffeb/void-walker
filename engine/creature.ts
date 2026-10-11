import { autreCote, liaisonsDe, refPassage, type EtatCreature, type EtatPartie, type Indice } from './etat';
import type { DefLiaison, DefMonde } from './monde';
import type { Evenement } from './vocabulaire';

// Réaction de la créature (C-03 §3 étape 4, §4) : perception réelle, une réaction par action engagée, sans patrouille.

export type Intensite = 'normal' | 'fort';

/** Son produit pendant l'action, actif pendant la réaction de ce pas. */
export interface SonEmis {
  readonly piece: string;
  readonly intensite: Intensite;
}

const FORCE: Readonly<Record<Intensite, number>> = { normal: 1, fort: 2 };

function laissePasserLeSon(etat: EtatPartie, liaison: DefLiaison): boolean {
  return etat.liaisons[liaison.id] === true || liaison.sonAuTravers === true;
}

/** La créature est large : elle ne franchit qu'une liaison ouverte et non étroite, jamais une cloison fermée (D-044, D-047). */
function praticable(etat: EtatPartie, liaison: DefLiaison): boolean {
  return etat.liaisons[liaison.id] === true && liaison.etroite !== true;
}

/** Plus court chemin de liaisons acceptées, dans l'ordre stable du monde ; `null` si aucun. */
function chemin(monde: DefMonde, depart: string, arrivee: string, accepte: (liaison: DefLiaison) => boolean): DefLiaison[] | null {
  const venu = new Map<string, DefLiaison | null>([[depart, null]]);
  const file = [depart];
  for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
    if (piece === arrivee) break;
    for (const liaison of liaisonsDe(monde, piece)) {
      const voisine = autreCote(liaison, piece);
      if (venu.has(voisine) || !accepte(liaison)) continue;
      venu.set(voisine, liaison);
      file.push(voisine);
    }
  }
  if (!venu.has(arrivee)) return null;
  const pas: DefLiaison[] = [];
  for (let piece = arrivee, liaison = venu.get(piece); liaison !== null && liaison !== undefined; liaison = venu.get(piece)) {
    pas.unshift(liaison);
    piece = autreCote(liaison, piece);
  }
  return pas;
}

/** Son actif retenu (C-03 §4.2) : le plus fort parmi ceux qui arrivent jusqu'à elle ; à égalité, le plus récent. */
export function sonRetenu(monde: DefMonde, etat: EtatPartie, depuis: string, sons: readonly SonEmis[]): SonEmis | undefined {
  let retenu: SonEmis | undefined;
  for (const son of sons) {
    if (chemin(monde, depuis, son.piece, (liaison) => laissePasserLeSon(etat, liaison)) === null) continue;
    if (retenu === undefined || FORCE[son.intensite] >= FORCE[retenu.intensite]) retenu = son;
  }
  return retenu;
}

/**
 * Un pas vers l'indice : par une voie réellement praticable, sinon le long du chemin du son jusqu'à la
 * séparation qui la bloque (C-03 §4.3). Au plus une liaison franchie.
 */
function pasVers(monde: DefMonde, etat: EtatPartie, depuis: string, cible: string): DefLiaison | undefined {
  const voie = chemin(monde, depuis, cible, (liaison) => praticable(etat, liaison));
  if (voie !== null) return voie[0];
  const premier = chemin(monde, depuis, cible, (liaison) => laissePasserLeSon(etat, liaison))?.[0];
  return premier !== undefined && praticable(etat, premier) ? premier : undefined;
}

/** Ce que le passager perçoit d'un mouvement : il le voit entrer, ou l'entend bouger dans une pièce voisine (OP-01). */
function percuParLePassager(monde: DefMonde, etat: EtatPartie, liaison: DefLiaison, depart: string, arrivee: string): Evenement | undefined {
  if (arrivee === etat.piece) return { type: 'creature_entre', passage: refPassage(monde, etat, liaison, etat.piece) };
  for (const piece of [arrivee, depart]) {
    const voisine = liaisonsDe(monde, etat.piece).find((lien) => autreCote(lien, etat.piece) === piece && laissePasserLeSon(etat, lien));
    if (voisine !== undefined) return { type: 'bruit_creature', passage: refPassage(monde, etat, voisine, etat.piece) };
  }
  return undefined;
}

/** Une réaction (C-03 §4.2) : joueur visible, sinon son actif, sinon dernier indice, sinon attendre. */
function reaction(
  monde: DefMonde,
  etat: EtatPartie,
  creature: EtatCreature,
  sons: readonly SonEmis[],
  avant: string,
): { creature: EtatCreature; evenements: Evenement[] } {
  if (creature.piece === etat.piece) {
    // L'avertissement donne une action pour réagir avant toute conséquence hostile (C-03 §4.4).
    return { creature: { ...creature, indice: null }, evenements: creature.contact ? [{ type: 'menace' }] : [] };
  }
  if (creature.piece === avant) {
    // Elle l'a vu partir : sa réaction est de retenir le passage pris, qu'elle suivra au pas suivant (D-177).
    const par = liaisonsDe(monde, avant).find((liaison) => autreCote(liaison, avant) === etat.piece && etat.liaisons[liaison.id] === true);
    return { creature: { ...creature, indice: { piece: etat.piece, par: par?.id ?? null } }, evenements: [] };
  }
  const son = sonRetenu(monde, etat, creature.piece, sons);
  const indice: Indice | null = son === undefined ? creature.indice : { piece: son.piece, par: null };
  if (indice === null) return { creature, evenements: [] };
  if (indice.piece === creature.piece) return { creature: { ...creature, indice: null }, evenements: [] };
  const liaison = indice.par === null ? pasVers(monde, etat, creature.piece, indice.piece) : passageSuivi(monde, etat, creature.piece, indice);
  if (liaison === undefined) return { creature: { ...creature, indice }, evenements: [] };
  const arrivee = autreCote(liaison, creature.piece);
  const percu = percuParLePassager(monde, etat, liaison, creature.piece, arrivee);
  return { creature: { piece: arrivee, indice: arrivee === indice.piece ? null : indice, contact: creature.contact }, evenements: percu === undefined ? [] : [percu] };
}

/** Le passage qu'elle l'a vu prendre, s'il lui est encore praticable : une porte refermée ou un passage étroit l'arrête (D-177). */
function passageSuivi(monde: DefMonde, etat: EtatPartie, depuis: string, indice: Indice): DefLiaison | undefined {
  const liaison = liaisonsDe(monde, depuis).find((lien) => lien.id === indice.par && autreCote(lien, depuis) === indice.piece);
  return liaison !== undefined && praticable(etat, liaison) ? liaison : undefined;
}

/** Étapes 4 et 5 d'un pas (C-03 §3) : la réaction, puis l'annonce du premier contact si la créature et le passager se retrouvent. */
export function reagir(monde: DefMonde, etat: EtatPartie, sons: readonly SonEmis[], avant: string = etat.piece): { etat: EtatPartie; evenements: Evenement[] } {
  if (etat.creature === null) return { etat, evenements: [] };
  const { creature, evenements } = reaction(monde, etat, etat.creature, sons, avant);
  if (creature.piece === etat.piece && !creature.contact) {
    return { etat: { ...etat, creature: { ...creature, contact: true } }, evenements: [...evenements, { type: 'premier_contact' }] };
  }
  return { etat: { ...etat, creature }, evenements };
}
