import type { Nom } from './types';

// Gabarits : phrases écrites à la main avec des trous {forme:rôle} remplis par des noms publics (C-07 NP-02).
export const FORMES = ['le', 'Le', 'de', 'De', 'a', 'A', 'un', 'Un', 'nom', 'Nom', 'e'] as const;
type Forme = (typeof FORMES)[number];

const TROU = /\{([^{}:]*):([^{}]*)\}/g;

export class ErreurTexte extends Error {
  override readonly name = 'ErreurTexte';
}

function estForme(forme: string): forme is Forme {
  return (FORMES as readonly string[]).includes(forme);
}

/** Erreurs d'un gabarit : forme ou rôle inconnu, accolade isolée, texte vide. */
export function analyserGabarit(gabarit: string, roles: readonly string[]): string[] {
  const erreurs: string[] = [];
  if (gabarit.trim() === '') erreurs.push('texte vide');
  const reste = gabarit.replace(TROU, (_trou, forme: string, role: string) => {
    if (!estForme(forme)) erreurs.push(`forme inconnue « ${forme} »`);
    if (!roles.includes(role)) erreurs.push(`rôle inconnu « ${role} »`);
    return '';
  });
  if (/[{}]/.test(reste)) erreurs.push('accolade isolée');
  return erreurs;
}

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function minuscule(forme: Forme): Exclude<Forme, 'Le' | 'De' | 'A' | 'Un' | 'Nom'> {
  switch (forme) {
    case 'Le':
      return 'le';
    case 'De':
      return 'de';
    case 'A':
      return 'a';
    case 'Un':
      return 'un';
    case 'Nom':
      return 'nom';
    default:
      return forme;
  }
}

export function former(forme: Forme, nom: Nom): string {
  const { texte, genre, nombre, elision } = nom;
  const pluriel = nombre === 'p';
  let resultat: string;
  switch (minuscule(forme)) {
    case 'le':
      resultat = pluriel ? `les ${texte}` : elision ? `l’${texte}` : genre === 'm' ? `le ${texte}` : `la ${texte}`;
      break;
    case 'de':
      resultat = pluriel ? `des ${texte}` : elision ? `de l’${texte}` : genre === 'm' ? `du ${texte}` : `de la ${texte}`;
      break;
    case 'a':
      resultat = pluriel ? `aux ${texte}` : elision ? `à l’${texte}` : genre === 'm' ? `au ${texte}` : `à la ${texte}`;
      break;
    case 'un':
      resultat = pluriel ? `des ${texte}` : genre === 'm' ? `un ${texte}` : `une ${texte}`;
      break;
    case 'nom':
      resultat = texte;
      break;
    case 'e':
      resultat = `${genre === 'f' ? 'e' : ''}${pluriel ? 's' : ''}`;
      break;
  }
  return forme === minuscule(forme) ? resultat : majuscule(resultat);
}

function joindre(elements: readonly string[]): string {
  if (elements.length <= 1) return elements.join('');
  return `${elements.slice(0, -1).join(', ')} et ${elements[elements.length - 1] ?? ''}`;
}

/** Remplit un gabarit ; un trou sans valeur ou une forme inconnue lève une erreur, jamais un identifiant affiché. */
export function remplir(gabarit: string, valeurs: Readonly<Record<string, Nom | readonly Nom[]>>): string {
  const texte = gabarit.replace(TROU, (_trou, forme: string, role: string) => {
    const valeur = valeurs[role];
    if (!estForme(forme)) throw new ErreurTexte(`Forme inconnue « ${forme} » dans « ${gabarit} ».`);
    if (valeur === undefined) throw new ErreurTexte(`Rôle sans valeur « ${role} » dans « ${gabarit} ».`);
    if (!Array.isArray(valeur)) return former(forme, valeur as Nom);
    const liste = valeur as readonly Nom[];
    const elements = liste.map((nom, index) => former(index === 0 ? forme : minuscule(forme), nom));
    return joindre(elements);
  });
  if (/[{}]/.test(texte)) throw new ErreurTexte(`Accolade isolée dans « ${gabarit} ».`);
  return texte;
}

/** Choix de variante par calcul fixe, sans les dés : identique au rejeu (C-07 NP-03). */
export function choisirVariante(variantes: readonly [string, ...string[]], cle: string): string {
  let hache = 0x811c9dc5;
  for (let i = 0; i < cle.length; i++) {
    hache ^= cle.charCodeAt(i);
    hache = Math.imul(hache, 0x01000193);
  }
  return variantes[(hache >>> 0) % variantes.length] ?? variantes[0];
}
