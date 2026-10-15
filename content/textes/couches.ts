import { MENACE, MOTS_MENACE } from './menace';
import { SOCLE } from './socle';
import type { Couche, TextesMonde, TextesMorceau } from './types';
import { MOTS_UNIVERS, UNIVERS } from './univers';

// Textes par couches (13 §7.2) : socle, univers, menace et morceaux réunis en un seul jeu de textes, et contrôle qu'aucun mot
// de l'univers ni de la menace ne se glisse dans le socle ou un morceau.

function estSection(valeur: unknown): valeur is object {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

/** Ajoute `source` à `cible` section par section, sans toucher aux couches ; une clé déjà définie garde le même texte. */
function ajouter(cible: Record<string, unknown>, source: object, chemin: string): void {
  for (const [cle, valeur] of Object.entries(source) as [string, unknown][]) {
    const ou = chemin === '' ? cle : `${chemin}.${cle}`;
    const deja = cible[cle];
    if (estSection(valeur) && (deja === undefined || estSection(deja))) {
      const section = (deja ?? {}) as Record<string, unknown>;
      cible[cle] = section;
      ajouter(section, valeur, ou);
    } else if (deja === undefined) {
      cible[cle] = valeur;
    } else if (JSON.stringify(deja) !== JSON.stringify(valeur)) {
      throw new Error(`Texte « ${ou} » défini deux fois, avec deux textes différents.`);
    }
  }
}

/** Texte d'une clé repris tel quel d'un autre jeu de textes, celui d'une station de test ; une clé absente lève une erreur. */
export function repris<T>(table: Readonly<Record<string, T>>, cle: string): T {
  const texte = Object.hasOwn(table, cle) ? table[cle] : undefined;
  if (texte === undefined) throw new Error(`Texte « ${cle} » absent : rien à reprendre.`);
  return texte;
}

/** Socle + univers + menace + morceaux (+ messages propres à la station) ; une clé définie deux fois avec deux textes différents lève une erreur. */
export function reunir(morceaux: readonly TextesMorceau[], assistance: Readonly<Record<string, string>> = {}): TextesMonde {
  const textes: Record<string, unknown> = {};
  for (const couche of [SOCLE, UNIVERS, MENACE, ...morceaux, { assistance }]) ajouter(textes, couche, '');
  return textes as unknown as TextesMonde;
}

function minuscules(texte: string): string {
  return texte.normalize('NFC').toLocaleLowerCase('fr');
}

/** Mots d'un texte, sans ses trous : `{le:objet}` n'est pas un mot. */
function mots(texte: string): string[] {
  return texte.replace(/\{[^}]*\}/g, ' ').match(/\p{L}+/gu) ?? [];
}

const RADICAUX = [
  ...MOTS_UNIVERS.map((radical) => ({ radical: minuscules(radical), couche: 'l’univers' })),
  ...MOTS_MENACE.map((radical) => ({ radical: minuscules(radical), couche: 'la menace' })),
];

/** Fuites : un mot du socle ou d'un morceau qui commence par un radical de l'univers ou de la menace, casse ignorée. */
export function fuitesDeCouches(morceaux: Readonly<Record<string, TextesMorceau>>, socle: Couche = SOCLE): string[] {
  const fuites: string[] = [];
  const lire = (ou: string, chemin: string, valeur: unknown): void => {
    if (typeof valeur === 'string') {
      for (const mot of mots(valeur)) {
        const fuite = RADICAUX.find(({ radical }) => minuscules(mot).startsWith(radical));
        if (fuite !== undefined) fuites.push(`${ou}, ${chemin} : « ${mot} », mot de ${fuite.couche}.`);
      }
    } else if (Array.isArray(valeur)) {
      valeur.forEach((variante: unknown, index) => lire(ou, `${chemin} [${index}]`, variante));
    } else if (estSection(valeur)) {
      for (const [cle, sous] of Object.entries(valeur) as [string, unknown][]) lire(ou, chemin === '' ? cle : `${chemin}.${cle}`, sous);
    }
  };
  lire('socle', '', socle);
  for (const [id, textes] of Object.entries(morceaux)) lire(`morceau ${id}`, '', textes);
  return fuites;
}
