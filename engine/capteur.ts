import { assourdie, chambreFroide, creatureActive, type EtatPartie } from './etat';
import type { DefMonde } from './monde';
import { entier32 } from './rencontre';
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

// Seuils à mesurer (créature mobile lot 3) : par action, la créature détruit le capteur de sa pièce hors traque ; sinon il tombe en panne.
export const CHANCE_DESTRUCTION = 1 / 8;
export const CHANCE_PANNE = 1 / 300;

/** Tirage du capteur à cette action, entre 0 et 1 exclu, haché sur la graine et le numéro d'action, hors journal. */
export function tirageCapteur(graine: number, action: number): number {
  return entier32(`capteur:${graine}:${action}`) / 2 ** 32;
}

/** `apres`, avec la panne posée sur le capteur si le tirage le décide ; elle reste jusqu'à la fin (créature mobile lot 3). */
export function abimerCapteur(monde: DefMonde, avant: EtatPartie, apres: EtatPartie, graine: number, action: number): EtatPartie {
  const pose = capteurPose(monde, apres);
  if (pose === null || pose.etat === 'hs') return apres;
  const sur = (etat: EtatPartie): boolean => creatureActive(etat) && etat.creature?.contact !== true && etat.creature?.piece === pose.piece;
  const seuil = sur(avant) && sur(apres) ? CHANCE_DESTRUCTION : CHANCE_PANNE;
  if (tirageCapteur(graine, action) >= seuil) return apres;
  return { ...apres, objets: { ...apres.objets, [pose.objet]: { type: 'capteur', piece: pose.piece, hs: true } } };
}
