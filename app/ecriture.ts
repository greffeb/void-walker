// Effet machine à écrire sur le nouveau texte (D-186) : affichage seulement, ni temps de jeu ni tirage (C-03).

/** Durée de l'écriture d'un nouveau texte, quelle que soit sa longueur ; le curseur apparaît ensuite. */
export const DUREE_ECRITURE_MS = 500;

/** Moment d'apparition de chaque caractère (ms), dans l'ordre de lecture des blocs, réparti sur la durée. */
export function delaisEcriture(blocs: readonly string[], duree: number = DUREE_ECRITURE_MS): number[][] {
  const caracteres = blocs.map((bloc) => [...bloc]);
  const total = caracteres.reduce((somme, bloc) => somme + bloc.length, 0);
  let rang = 0;
  return caracteres.map((bloc) =>
    bloc.map(() => {
      const delai = Math.floor((rang * duree) / total);
      rang += 1;
      return delai;
    }),
  );
}

// Mémoire de l'affichage : rouvrir une bulle ou revenir d'un autre écran ne réécrit pas un texte déjà affiché.
const ecrits = new WeakSet<object>();
const numeros = new WeakMap<object, number>();
let prochain = 0;

export function dejaEcrit(texte: object): boolean {
  return ecrits.has(texte);
}

export function marquerEcrit(texte: object): void {
  ecrits.add(texte);
}

/** Numéro propre à chaque texte affiché, même identique au précédent : il relance l'écriture. */
export function numeroDe(texte: object): number {
  const connu = numeros.get(texte);
  if (connu !== undefined) return connu;
  prochain += 1;
  numeros.set(texte, prochain);
  return prochain;
}
