import {
  autreCote,
  corpsIci,
  creatureActive,
  creatureEnVue,
  destinationConnue,
  liaisonsVisibles,
  piecesSansAir,
  protectionEnfilee,
  refPassage,
  refPiece,
  type EtatPartie,
} from './etat';
import { indexer, type DefMonde } from './monde';
import type { Evenement, RefPiece } from './vocabulaire';

// Vide (C-03 §5.4, D-061/D-062/D-067) : étape 3 du pas, avant le feu et avant toute réaction de la créature.

export interface Vide {
  readonly etat: EtatPartie;
  readonly evenements: Evenement[];
  /** Pièces sans air à cette mise à jour, dans l'ordre du monde. */
  readonly sansAir: readonly string[];
  /** Le passager finit l'action sans combinaison dans une pièce sans air : vaincu, hors plafond, sans jet (C-04 §3.1). */
  readonly asphyxie: boolean;
}

/** Pièce dont le passager voit l'état : la sienne, ou une voisine par un passage ouvert dont il connaît la destination. */
function voitEtNomme(monde: DefMonde, etat: EtatPartie, piece: string): boolean {
  if (piece === etat.piece) return true;
  return liaisonsVisibles(monde, etat, etat.piece).some(
    (liaison) => etat.liaisons[liaison.id] === true && autreCote(liaison, etat.piece) === piece && destinationConnue(etat, liaison),
  );
}

/** Foyer éteint par le vide, tel que le passager le voit : la pièce nommée, ou le passage seul tant que sa destination est inconnue (C-06 OP-03). */
function foyerEteintVu(monde: DefMonde, etat: EtatPartie, piece: string): Evenement[] {
  if (voitEtNomme(monde, etat, piece)) return [{ type: 'feu_eteint', piece: refPiece(monde, piece) }];
  const par = liaisonsVisibles(monde, etat, etat.piece).find((liaison) => etat.liaisons[liaison.id] === true && autreCote(liaison, etat.piece) === piece);
  return par === undefined ? [] : [{ type: 'feu_eteint', piece: refPassage(monde, etat, par, etat.piece) }];
}

/** Pièces que le passager connaît : visitées, ou nommées par un passage de sa pièce (C-04 §3.1, VP-02). */
export function piecesConnues(monde: DefMonde, etat: EtatPartie): string[] {
  const nommees = liaisonsVisibles(monde, etat, etat.piece)
    .filter((liaison) => destinationConnue(etat, liaison))
    .map((liaison) => autreCote(liaison, etat.piece));
  return monde.pieces.filter((piece) => piece.id === etat.piece || etat.visitees.includes(piece.id) || nommees.includes(piece.id)).map((piece) => piece.id);
}

function refs(monde: DefMonde, pieces: readonly string[]): RefPiece[] {
  return pieces.map((piece) => refPiece(monde, piece));
}

/**
 * Recalcule l'air après l'effet de l'action (`etat`) par rapport au début du pas (`avant`) : le vide éteint les foyers qu'il
 * atteint (MX-02) ; la créature active exposée est expulsée si elle est dans une pièce percée, inerte ailleurs, pour de bon
 * (D-062). Le passager apprend l'air perdu ou revenu dans les pièces connues, comme l'aperçu (VP-02, VP-03) ; il découvre un corps inerte en arrivant.
 */
export function actualiserVide(monde: DefMonde, avant: EtatPartie, etat: EtatPartie): Vide {
  const sansAir = piecesSansAir(monde, etat);
  const precedent = piecesSansAir(monde, avant);
  const evenements: Evenement[] = [];
  // Mêmes pièces que l'aperçu (VP-02), plus celles que le passager découvre en changeant de pièce.
  const connues = new Set([...piecesConnues(monde, avant), ...piecesConnues(monde, etat)]);
  const perdues = sansAir.filter((piece) => !precedent.includes(piece) && connues.has(piece));
  const revenues = precedent.filter((piece) => !sansAir.includes(piece) && connues.has(piece));
  if (perdues.length > 0) evenements.push({ type: 'air_perdu', pieces: refs(monde, perdues) });
  if (revenues.length > 0) evenements.push({ type: 'air_revenu', pieces: refs(monde, revenues) });
  let suite = etat;
  const eteintes = etat.feu.filter((piece) => sansAir.includes(piece));
  if (eteintes.length > 0) {
    const liaisons = indexer(monde).liaisons;
    suite = {
      ...suite,
      feu: suite.feu.filter((piece) => !sansAir.includes(piece)),
      expositions: suite.expositions.filter((id) => !liaisons.get(id)?.entre.some((piece) => eteintes.includes(piece))),
    };
    evenements.push(...eteintes.flatMap((piece) => foyerEteintVu(monde, suite, piece)));
  }
  const creature = suite.creature;
  if (creature !== null && creatureActive(suite) && creature.piece !== null && sansAir.includes(creature.piece)) {
    const percees = monde.objets.filter((objet) => suite.breches.includes(objet.id)).map((objet) => objet.piece);
    const expulsee = percees.includes(creature.piece);
    const vue = creatureEnVue(suite);
    const neutre = { ...creature, indice: null, engagee: null, alcove: false, repit: false };
    suite = { ...suite, creature: expulsee ? { ...neutre, piece: null, neutralisee: 'expulsee' } : { ...neutre, neutralisee: 'inerte' } };
    if (vue) evenements.push({ type: expulsee ? 'creature_expulsee' : 'creature_inerte' });
  } else if (avant.piece !== suite.piece && corpsIci(suite)) {
    evenements.push({ type: 'creature_inerte' });
  }
  return { etat: suite, evenements, sansAir, asphyxie: sansAir.includes(suite.piece) && protectionEnfilee(monde, suite) === undefined };
}
