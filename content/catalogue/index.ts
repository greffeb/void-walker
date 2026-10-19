import type { EntreeMorceau } from '../morceaux';
import type { TextesMorceau } from '../textes/types';
import { PIECES_CATALOGUE } from './pieces';
import { TEXTES_CATALOGUE } from './textes';

export { PIECES_CATALOGUE } from './pieces';
export { TEXTES_CATALOGUE } from './textes';

/** Textes d'une pièce du catalogue : son nom et ses descriptions, sous ses clés `cat_…`. */
function textesDe(cle: string): TextesMorceau {
  const nom = TEXTES_CATALOGUE.noms[cle];
  const description = TEXTES_CATALOGUE.descriptions[cle];
  if (nom === undefined || description === undefined) throw new Error(`Texte du catalogue absent : ${cle}.`);
  return { noms: { [cle]: nom }, descriptions: { [cle]: description }, assistance: {} };
}

/** Pièces sans obstacle (spec 2026-10-18 §5.2), par identifiant d'annexe, avec leurs textes. */
export const CATALOGUE_PIECES: Readonly<Record<string, EntreeMorceau>> = Object.fromEntries(
  PIECES_CATALOGUE.map((morceau) => [morceau.id, { morceau, textes: textesDe(morceau.pieces[0]?.nom ?? '') }]),
);
