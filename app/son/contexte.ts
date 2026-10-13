// Son dans React (15 §6) : les écrans disent quel geste a eu lieu, jamais comment il sonne.

import { createContext, useContext } from 'react';
import { SILENCE, type Son } from './moteur';
import { GESTES, type Geste, type Signal } from './recettes';

export const SonContexte = createContext<Son>(SILENCE);

export function useSon(): Son {
  return useContext(SonContexte);
}

/** Élément touché, vu par `closest` : un élément du navigateur, ou dans les tests un objet qui l'imite. */
interface Touche {
  readonly tagName?: string;
  closest(selecteur: string): { getAttribute(nom: string): string | null } | null;
}

/**
 * Son d'un toucher (15 §2.1) : le `data-son` de l'élément touché ou de son plus proche parent. Un champ ne sonne pas : toucher
 * l'étiquette d'un segment fait aussi cliquer son bouton radio, qui sonnerait une seconde fois ; un rail sonne au relâché.
 */
export function sonDuToucher(cible: unknown): Geste | null {
  if (typeof cible !== 'object' || cible === null || !('closest' in cible)) return null;
  const element = cible as Touche;
  if (element.tagName === 'INPUT') return null;
  const valeur = element.closest('[data-son]')?.getAttribute('data-son');
  return GESTES.find((geste) => geste === valeur) ?? null;
}

/**
 * Son d'Échap (D-226) : celui de la bulle qui a le focus, marquée `data-son-fermer` (inventaire, carte, IA Station) ; sinon le tic
 * des bulles.
 */
export function sonDeFermeture(cible: unknown): Geste {
  if (typeof cible !== 'object' || cible === null || !('closest' in cible)) return 'fermer';
  const valeur = (cible as Touche).closest('[data-son-fermer]')?.getAttribute('data-son-fermer');
  return GESTES.find((geste) => geste === valeur) ?? 'fermer';
}

const annonces = new WeakSet<object>();

/** Annonce un texte affiché une seule fois, même si l'effet se rejoue (mode strict, retour des options) (15 §2.3, §2.4). */
export function annoncerTexte(son: Son, texte: object, ecriture: boolean, signaux: readonly Signal[]): void {
  if (annonces.has(texte)) return;
  annonces.add(texte);
  son.nouveauTexte(ecriture, signaux);
}
