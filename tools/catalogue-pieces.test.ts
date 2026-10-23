import { describe, expect, it } from 'vitest';
import { validerMorceau } from '../engine';
import { CATALOGUE_PIECES, fuitesDuCatalogue, MORCEAUX, nomLisible, TABLE_BUTIN, TEXTES_CATALOGUE, UNIVERS } from '../content';
import { CATALOGUE } from './catalogue';
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

  it('élision des noms : « l’infirmerie », jamais « l’laboratoire »', () => {
    for (const [, { morceau, textes }] of ENTREES) {
      const nom = textes.noms[morceau.pieces[0]!.nom]!;
      expect(nom.elision, nom.texte).toBe(/^[aâeéèêiîoôuy]/i.test(nom.texte));
    }
  });

  it.each(ENTREES)('%s : clés de texte propres au catalogue', (_id, { textes }) => {
    for (const cle of [...Object.keys(textes.noms), ...Object.keys(textes.descriptions)]) expect(cle).toMatch(/^cat_/);
  });

  it('fuitesDuCatalogue relève un mot de la menace et un mot de trace', () => {
    const fuites = fuitesDuCatalogue({ noms: {}, descriptions: { cat_essai: ['Des griffures sur la porte. Du sang séché au sol.'] }, assistance: {} });
    expect(fuites).toHaveLength(2);
  });

  it('fuitesDuCatalogue lit aussi les noms, même quand une description porte la même clé', () => {
    const fuites = fuitesDuCatalogue({ noms: { cat_essai: { texte: 'salle griffée', genre: 'f', nombre: 's', elision: false } }, descriptions: { cat_essai: ['Une salle calme. Rien à signaler.'] }, assistance: {} });
    expect(fuites).toHaveLength(1);
  });
});

// Table de butin (spec §6.6, #207) : une trousse de soin et une burette de réserve, sans aucune qualité passive, aux noms qui
// ne reprennent jamais ceux des morceaux, de l'univers ni des pièces du catalogue (NP-04).

/** Qualités passives d'un objet : un butin n'en porte aucune (Global Constraints). */
const QUALITES_PASSIVES = ['encombrant', 'large', 'appui', 'pont', 'source', 'alimente', 'deverrouille', 'capsule', 'vitrageExterieur', 'machines', 'gravite', 'fermeture', 'avertisseur'];

describe('table de butin (#207, spec §6.6)', () => {
  it('vide 2, deux à trois salles ; la trousse (soin 1, poids 1) et la burette (glissant 1, poids 2, après M-04)', () => {
    expect(TABLE_BUTIN.vide).toBe(2);
    expect(TABLE_BUTIN.salles).toEqual([2, 3]);
    expect(TABLE_BUTIN.entrees.map(({ objet, poids, apresCoupeDe }) => [objet.nom, objet.soin, objet.glissant, poids, apresCoupeDe])).toEqual([
      ['cat_trousse', 1, undefined, 1, undefined],
      ['cat_burette_reserve', undefined, 1, 2, 'm-04'],
      ['cat_capteur', undefined, undefined, 2, undefined],
    ]);
  });

  it('aucun objet de la table ne porte une qualité passive', () => {
    for (const { objet } of TABLE_BUTIN.entrees) for (const qualite of QUALITES_PASSIVES) expect(objet, `${objet.nom} : ${qualite}`).not.toHaveProperty(qualite);
  });

  it('« trousse de soin » et « burette de réserve » : un nom que ni un morceau, ni l’univers, ni le catalogue ne portent', () => {
    const noms = TABLE_BUTIN.entrees.map(({ objet }) => TEXTES_CATALOGUE.noms[objet.nom]?.texte.toLocaleLowerCase('fr'));
    expect(noms).toEqual(['trousse de soin', 'burette de réserve', 'capteur de mouvement']);
    for (const nom of noms) expect(NOMS_PRIS.has(nom ?? '')).toBe(false);
    const ceuxDuCatalogue = ENTREES.map(([, { morceau, textes }]) => textes.noms[morceau.pieces[0]!.nom]!.texte.toLocaleLowerCase('fr'));
    for (const nom of noms) expect(ceuxDuCatalogue).not.toContain(nom);
  });

  it('nom et deux descriptions de chaque objet, sans chiffre, sans mot de la menace ni de trace', () => {
    for (const { objet } of TABLE_BUTIN.entrees) {
      const textes = { noms: { [objet.nom]: TEXTES_CATALOGUE.noms[objet.nom]! }, descriptions: { [objet.nom]: TEXTES_CATALOGUE.descriptions[objet.nom]! }, assistance: {} };
      expect(textes.descriptions[objet.nom]).toHaveLength(2);
      expect(fuitesDuCatalogue(textes)).toEqual([]);
      expect(JSON.stringify(textes)).not.toMatch(/[0-9]/);
    }
  });

  it('dans les vraies grandes stations, chaque objet de butin a son nom et sa description', () => {
    const compositions = CATALOGUE.grandes.filter((composition) => composition.refus === null);
    let butins = 0;
    for (let graine = 0; graine < 40; graine++) {
      const composition = compositions[(graine * 7) % compositions.length]!;
      const station = CATALOGUE.construireGrande(composition.id, graine);
      if ('refus' in station) continue;
      for (const objet of station.monde.objets.filter((candidat) => candidat.butin === true)) {
        butins++;
        expect(station.textes.noms[objet.nom], objet.nom).toBeDefined();
        expect(station.textes.descriptions[objet.nom], objet.nom).toBeDefined();
      }
    }
    expect(butins).toBeGreaterThan(0);
  });
});
