import { autreCote, destinationConnue, enFeu, liaisonsVisibles, type EtatPartie, type ObjetSouvenir, type SouvenirPiece } from './etat';
import { indexer, type DefMonde } from './monde';

// Mémoire du passager (docs/14-carte.md §3.1, D-213) : ce qu'il a vu de chaque pièce, mis à jour au réveil puis à la fin de
// chaque action. Aucune règle ne la lit : seule la carte publique s'en sert. Deux états qui ne diffèrent que par la mémoire ont
// donc le même avenir.

/** Objets que le passager voit dans la pièce : au sol, posés à une position, installés dans une capsule de la pièce, posés en travers d'un de ses vides. */
function objetsVus(monde: DefMonde, etat: EtatPartie, piece: string): ObjetSouvenir[] {
  const capsules = monde.objets
    .filter((objet) => {
      const emplacement = etat.objets[objet.id];
      return objet.capsule !== undefined && emplacement?.type === 'piece' && emplacement.piece === piece;
    })
    .map((objet) => objet.id);
  return monde.objets.flatMap((objet): ObjetSouvenir[] => {
    const emplacement = etat.objets[objet.id];
    if (emplacement?.type === 'piece' && emplacement.piece === piece) {
      return [emplacement.position === undefined ? { objet: objet.id } : { objet: objet.id, position: emplacement.position }];
    }
    if (emplacement?.type === 'installe' && capsules.includes(emplacement.dans)) return [{ objet: objet.id }];
    if (emplacement?.type === 'pont' && indexer(monde).liaisons.get(emplacement.liaison)?.entre.includes(piece) === true) return [{ objet: objet.id }];
    return [];
  });
}

/**
 * Regard de fin d'action, et du réveil : la pièce actuelle remplace son souvenir (moment, feu, objets) et l'état de ses liaisons
 * perçues ; par un passage ouvert dont la destination est connue, le feu de la pièce d'en face, visitée ou non (D-213).
 */
export function regarder(monde: DefMonde, etat: EtatPartie): EtatPartie {
  const ici = etat.piece;
  const maintenant = etat.actions;
  const pieces: Record<string, SouvenirPiece> = { ...etat.memoire.pieces };
  const liaisons: Record<string, boolean> = { ...etat.memoire.liaisons };
  pieces[ici] = { regard: maintenant, feu: { vu: enFeu(etat, ici), actions: maintenant }, objets: objetsVus(monde, etat, ici) };
  for (const liaison of liaisonsVisibles(monde, etat, ici)) {
    const ouverte = etat.liaisons[liaison.id] === true;
    liaisons[liaison.id] = ouverte;
    if (!ouverte || !destinationConnue(etat, liaison)) continue;
    const voisine = autreCote(liaison, ici);
    pieces[voisine] = { ...pieces[voisine], feu: { vu: enFeu(etat, voisine), actions: maintenant } };
  }
  return { ...etat, memoire: { pieces, liaisons } };
}
