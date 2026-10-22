import { carte, creatureActive, type CartePublique, type DefMonde, type EtatPartie } from '../../engine';

// Carte révélée, outil des versions de test seulement : la carte publique calculée comme si le passager avait tout vu, toutes les
// portes dans leur état réel et la créature vue à l'instant là où elle est. Filtre d'affichage : la partie n'en sait rien.

/** L'état tel que la carte le lirait si le passager savait tout ; jamais joué ni enregistré. */
export function etatRevele(monde: DefMonde, etat: EtatPartie): EtatPartie {
  const piece = etat.creature?.piece;
  return {
    ...etat,
    visitees: monde.pieces.map((p) => p.id),
    decouvertes: monde.liaisons.map((liaison) => liaison.id),
    memoire: { ...etat.memoire, liaisons: etat.liaisons },
    reperes: { ...etat.reperes, vue: creatureActive(etat) && piece != null ? { piece, depuis: 0 } : null },
  };
}

export function carteRevelee(monde: DefMonde, etat: EtatPartie): CartePublique {
  return carte(monde, etatRevele(monde, etat));
}
