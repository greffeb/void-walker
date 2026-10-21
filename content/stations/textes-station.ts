import type { EntreeMorceau } from '../morceaux';
import { reunir } from '../textes/couches';
import type { Nom, Variantes } from '../textes/types';
import type { EntreeMonde } from '../types';

// Textes d'une station assemblée : clés en conflit entre deux morceaux renommées, pièces de même nom numérotées par une lettre.

const COUCHES = reunir([]);

/**
 * Clé propre à deux morceaux de la station avec deux textes différents (spec L3 §4.2) : `<clé>_<morceau sans tiret>` dans
 * chacun (pièces, objets, liaisons, positions, porte de sortie, noms et descriptions). Une clé renommée garde son nom et sa
 * description, recopiés des couches s'ils en viennent. Un morceau sans telle clé est rendu tel quel ; aucun n'est modifié.
 */
export function sansConflit(entrees: readonly EntreeMorceau[]): EntreeMorceau[] {
  const propres = ({ textes }: EntreeMorceau): Set<string> => new Set([...Object.keys(textes.noms), ...Object.keys(textes.descriptions)]);
  const lu = <T>(table: Readonly<Record<string, T>>, cle: string): T | undefined => (Object.hasOwn(table, cle) ? table[cle] : undefined);
  const texteDe = ({ textes }: EntreeMorceau, cle: string) => ({
    nom: lu(textes.noms, cle) ?? lu(COUCHES.noms, cle),
    description: lu(textes.descriptions, cle) ?? lu(COUCHES.descriptions, cle),
  });
  const lus = new Map<string, Set<string>>();
  for (const entree of entrees) {
    for (const cle of propres(entree)) lus.set(cle, (lus.get(cle) ?? new Set<string>()).add(JSON.stringify(texteDe(entree, cle))));
  }
  const enConflit = new Set([...lus].filter(([, textes]) => textes.size > 1).map(([cle]) => cle));
  return entrees.map((entree) => {
    const { morceau, textes } = entree;
    const renommees = [...propres(entree)].filter((cle) => enConflit.has(cle));
    if (renommees.length === 0) return entree;
    const suffixe = morceau.id.replaceAll('-', '');
    const cle = (nom: string): string => (renommees.includes(nom) ? `${nom}_${suffixe}` : nom);
    const renomme = <T extends { readonly nom: string }>(element: T): T => ({ ...element, nom: cle(element.nom) });
    const noms: Record<string, Nom> = {};
    const descriptions: Record<string, Variantes> = {};
    for (const [nom, texte] of Object.entries(textes.noms)) noms[cle(nom)] = texte;
    for (const [nom, texte] of Object.entries(textes.descriptions)) descriptions[cle(nom)] = texte;
    for (const nom of renommees) {
      const { nom: texte, description } = texteDe(entree, nom);
      if (texte !== undefined) noms[cle(nom)] = texte;
      if (description !== undefined) descriptions[cle(nom)] = description;
    }
    return {
      morceau: {
        ...morceau,
        pieces: morceau.pieces.map(renomme),
        liaisons: morceau.liaisons.map(renomme),
        objets: morceau.objets.map(renomme),
        ...(morceau.positions === undefined ? {} : { positions: morceau.positions.map(renomme) }),
        ...(morceau.sortie === undefined ? {} : { sortie: { ...morceau.sortie, porte: renomme(morceau.sortie.porte) } }),
      },
      textes: { ...textes, noms, descriptions },
    };
  });
}

/**
 * Pièces du même nom affiché désignées par une lettre dans toute la station, dans l'ordre des pièces (D-208, spec L3 §4.2) :
 * `coursive` → `coursive_a`, « coursive A ». Pas de chiffre dans le nom affiché : la carte et l'écran de fin n'en montrent
 * aucun ; une clé interne renommée par `sansConflit` peut en avoir (`coursive_m07_a`).
 */
export function numeroter(entree: EntreeMonde): EntreeMonde {
  const { monde, textes } = entree;
  const nomDe = (cle: string): Nom | undefined => (Object.hasOwn(textes.noms, cle) ? textes.noms[cle] : undefined);
  const affiche = (cle: string): string => nomDe(cle)?.texte ?? cle;
  const total = new Map<string, number>();
  for (const { nom } of monde.pieces) total.set(affiche(nom), (total.get(affiche(nom)) ?? 0) + 1);
  if (monde.pieces.every(({ nom }) => total.get(affiche(nom)) === 1)) return entree;
  const noms: Record<string, Nom> = { ...textes.noms };
  const descriptions: Record<string, Variantes> = { ...textes.descriptions };
  const rangs = new Map<string, number>();
  const pieces = monde.pieces.map((piece) => {
    const texte = affiche(piece.nom);
    if (total.get(texte) === 1) return piece;
    const rang = rangs.get(texte) ?? 0;
    rangs.set(texte, rang + 1);
    const lettre = String.fromCharCode('A'.charCodeAt(0) + rang);
    const cle = `${piece.nom}_${lettre.toLowerCase()}`;
    const nom = nomDe(piece.nom);
    if (nom !== undefined) noms[cle] = { ...nom, texte: `${nom.texte} ${lettre}` };
    const description = Object.hasOwn(textes.descriptions, piece.nom) ? textes.descriptions[piece.nom] : undefined;
    if (description !== undefined) descriptions[cle] = description;
    return { ...piece, nom: cle };
  });
  return { ...entree, monde: { ...monde, pieces }, textes: { ...textes, noms, descriptions } };
}

