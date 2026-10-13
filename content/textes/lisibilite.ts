// Lisibilité des noms sur le plan (14 §4.2 PL-04, §2.4) : capitales de 13 px en 600, interlettrage de 0,04 em, police à chasse
// fixe. Mêmes mesures pour le vérifieur des plans et pour l'écran de la carte, qui masque un nom qui ne tient plus (14 §2.3).

/** Largeur d'un caractère : 13 × 0,6 px de chasse et 13 × 0,04 px d'interlettrage. */
export const CARACTERE_PX = 8.32;
export const MARGE_PX = 8;
export const LIGNE_PX = 17;
/** Une case du plan à la taille de texte STANDARD (14 §2.3). */
export const CASE_PX = 34;

export function caracteresParLigne(largeurPx: number): number {
  return Math.floor((largeurPx - 2 * MARGE_PX) / CARACTERE_PX);
}

/** Coupe un texte en lignes de mots entiers qui tiennent dans la largeur ; `null` si un mot seul dépasse. */
export function couperTexte(texte: string, largeurPx: number): string[] | null {
  const max = caracteresParLigne(largeurPx);
  const lignes: string[] = [];
  for (const mot of texte.split(/\s+/).filter((morceau) => morceau !== '')) {
    if ([...mot].length > max) return null;
    const derniere = lignes[lignes.length - 1];
    if (derniere !== undefined && [...derniere].length + 1 + [...mot].length <= max) lignes[lignes.length - 1] = `${derniere} ${mot}`;
    else lignes.push(mot);
  }
  return lignes;
}

/** Nom d'une pièce tel que le plan l'écrit : en capitales (14 §2.4). */
export function nomSurPlan(texte: string): string {
  return texte.toLocaleUpperCase('fr-FR');
}

/** Lignes du nom dans la pièce et lignes restantes pour les états ; `null` si le nom ne tient pas à cette taille de case. */
export function placeDuNom(
  texte: string,
  largeur: number,
  hauteur: number,
  casePx: number = CASE_PX,
): { readonly lignes: readonly string[]; readonly libres: number } | null {
  const lignes = couperTexte(nomSurPlan(texte), largeur * casePx);
  if (lignes === null) return null;
  const total = Math.floor((hauteur * casePx - 2 * MARGE_PX) / LIGNE_PX);
  return lignes.length > total ? null : { lignes, libres: total - lignes.length };
}

/** PL-04 : à 34 px par case, le nom tient avec la place d'une ligne d'état. */
export function nomLisible(texte: string, largeur: number, hauteur: number): boolean {
  return (placeDuNom(texte, largeur, hauteur)?.libres ?? 0) >= 1;
}
