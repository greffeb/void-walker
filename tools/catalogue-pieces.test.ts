import { describe, expect, it } from 'vitest';
import { validerMorceau } from '../engine';
import { CATALOGUE_PIECES, fuitesDuCatalogue, MORCEAUX, nomLisible, UNIVERS } from '../content';
import { compterPhrases } from './check-texts';

// Catalogue des pièces sans obstacle (spec 2026-10-18 §5, #206) : quinze pièces d'une station de transit et de fret, chacune
// un morceau `annexe`, aux noms qui ne reprennent jamais ceux des morceaux et aux descriptions calmes, sans trace ni menace.

const ENTREES = Object.entries(CATALOGUE_PIECES);

/** Noms affichés des pièces des morceaux et de l'univers, en minuscules. */
const NOMS_PRIS = new Set(
  [...Object.values(MORCEAUX).flatMap(({ textes }) => Object.values(textes.noms)), ...Object.values(UNIVERS.noms)].map((nom) => nom.texte.toLocaleLowerCase('fr')),
);
/** Mots des pièces des morceaux, ou réservés à l'embarquement, qu'aucun nom du catalogue ne reprend (spec §5.2). */
const MOTS_DES_MORCEAUX = ['réserve', 'poste', 'coursive', 'atelier', 'magasin', 'entrepôt', 'soute', 'cabine', 'quai'];
/** Objets qui peuvent se trouver dans une pièce : une description ne les nomme jamais, ils s'affichent en puce (spec §6.5). */
const OBJETS = ['bidon', 'planche', 'caisse', 'burette', 'combinaison', 'découpeuse', 'bloc', 'trousse'];

describe('catalogue des pièces sans obstacle (#206, spec §5)', () => {
  it('quinze pièces de famille annexe, chacune valide', () => {
    expect(ENTREES).toHaveLength(15);
    for (const [id, { morceau }] of ENTREES) {
      expect(morceau.id).toBe(id);
      expect(morceau.famille).toBe('annexe');
      expect(validerMorceau(morceau)).toEqual([]);
    }
  });

  it.each(ENTREES)('%s : le nom tient dans la pièce (PL-04)', (_id, { morceau, textes }) => {
    const piece = morceau.pieces[0]!;
    const nom = textes.noms[piece.nom];
    expect(nom).toBeDefined();
    expect(nomLisible(nom!.texte, piece.plan!.largeur, piece.plan!.hauteur)).toBe(true);
  });

  it.each(ENTREES)('%s : deux ou trois descriptions de deux ou trois phrases', (_id, { morceau, textes }) => {
    const descriptions = textes.descriptions[morceau.pieces[0]!.nom] ?? [];
    expect(descriptions.length).toBeGreaterThanOrEqual(2);
    expect(descriptions.length).toBeLessThanOrEqual(3);
    for (const description of descriptions) expect([2, 3]).toContain(compterPhrases(description));
  });

  it.each(ENTREES)('%s : le nom ne reprend aucun nom de morceau', (_id, { morceau, textes }) => {
    const texte = textes.noms[morceau.pieces[0]!.nom]!.texte.toLocaleLowerCase('fr');
    expect(NOMS_PRIS.has(texte)).toBe(false);
    for (const mot of MOTS_DES_MORCEAUX) expect(texte.split(/[\s’']+/)).not.toContain(mot);
  });

  it('les noms du catalogue sont tous différents', () => {
    const noms = ENTREES.map(([, { morceau, textes }]) => textes.noms[morceau.pieces[0]!.nom]!.texte);
    expect(new Set(noms).size).toBe(noms.length);
  });

  it.each(ENTREES)('%s : ni mot de la menace, ni trace, ni chiffre, ni objet nommé', (_id, { textes }) => {
    expect(fuitesDuCatalogue(textes)).toEqual([]);
    const tout = JSON.stringify(textes);
    expect(tout).not.toMatch(/[0-9]/);
    for (const objet of OBJETS) expect(tout.toLocaleLowerCase('fr')).not.toContain(objet);
  });

  it.each(ENTREES)('%s : clés de texte propres au catalogue', (_id, { textes }) => {
    for (const cle of [...Object.keys(textes.noms), ...Object.keys(textes.descriptions)]) expect(cle).toMatch(/^cat_/);
  });

  it('fuitesDuCatalogue relève un mot de la menace et un mot de trace', () => {
    const fuites = fuitesDuCatalogue({ noms: {}, descriptions: { cat_essai: ['Des griffures sur la porte. Du sang séché au sol.'] }, assistance: {} });
    expect(fuites).toHaveLength(2);
  });
});
