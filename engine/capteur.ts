import { assourdie, chambreFroide, creatureActive, type EtatPartie } from './etat';
import type { DefMonde } from './monde';
import type { EtatCapteur } from './vocabulaire';

/** Le capteur posé, la pièce qui le porte et ce qu'il lit ; `null` s'il n'est pas posé (créature mobile lot 3). */
export function capteurPose(monde: DefMonde, etat: EtatPartie): { readonly objet: string; readonly piece: string; readonly etat: EtatCapteur } | null {
  for (const objet of monde.objets) {
    const emplacement = etat.objets[objet.id];
    if (emplacement?.type !== 'capteur') continue;
    const { piece } = emplacement;
    const lu: EtatCapteur =
      emplacement.hs === true
        ? 'hs'
        : assourdie(monde, etat, piece) || chambreFroide(monde, piece)
          ? 'brouille'
          : creatureActive(etat) && etat.creature?.piece === piece
            ? 'mouvement'
            : 'calme';
    return { objet: objet.id, piece, etat: lu };
  }
  return null;
}
