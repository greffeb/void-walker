import { describe, expect, it } from 'vitest';
import { prefixer, type DefMonde, type DefObjet } from '../engine';
import { DOCUMENTS, EMPLACEMENTS_DOCUMENTS, MORCEAUX, RESERVE_DOCUMENTS, rendreDocument, texteDocument } from '../content';
import { CATALOGUE } from './catalogue';

// Réserve de documents branchée dans les grandes stations (spec 2026-10-18 §8.4, §8.5, #209) : chaque place de la réserve a son
// texte, chaque texte sa place, et une vraie grande station porte ses documents, chacun avec son texte rendu.

const ID_DES_MORCEAUX = Object.keys(MORCEAUX);
/** Textes de documents que portent les morceaux, par identifiant de morceau. */
const documentsDe = (morceau: string) => MORCEAUX[morceau]?.textes.documents ?? {};
const CLES_DECLAREES = Object.values(MORCEAUX).flatMap(({ morceau }) => Object.keys(morceau.grande?.cles ?? {}).map((cle) => ({ morceau: morceau.id, cle })));
const couche = (nom: 'univers' | 'menace' | 'morceau' | 'rangement') => EMPLACEMENTS_DOCUMENTS.filter((emplacement) => emplacement.couche === nom);

describe('réserve de documents du contenu (#209)', () => {
  it('la réserve se tire de tous les emplacements, de cinq à sept documents par station', () => {
    expect(RESERVE_DOCUMENTS.emplacements).toBe(EMPLACEMENTS_DOCUMENTS);
    expect(RESERVE_DOCUMENTS.parStation).toEqual([5, 7]);
  });

  it('chaque emplacement a un texte, dans les documents communs ou dans ceux de son morceau', () => {
    expect(new Set(EMPLACEMENTS_DOCUMENTS.map((emplacement) => emplacement.id)).size).toBe(EMPLACEMENTS_DOCUMENTS.length);
    for (const { id, couche: laCouche, morceau } of EMPLACEMENTS_DOCUMENTS) {
      if (laCouche === 'morceau' || (laCouche === 'rangement' && morceau !== undefined)) {
        expect(ID_DES_MORCEAUX, `${id} : morceau`).toContain(morceau);
        expect(documentsDe(morceau ?? '')[id], `${id} : texte du morceau ${morceau}`).toBeDefined();
        expect(DOCUMENTS[id], `${id} : un seul texte`).toBeUndefined();
      } else expect(DOCUMENTS[id], `${id} : texte commun`).toBeDefined();
    }
  });

  it('chaque texte de document a un emplacement', () => {
    const places = new Set(EMPLACEMENTS_DOCUMENTS.map((emplacement) => emplacement.id));
    const textes = [...Object.keys(DOCUMENTS), ...ID_DES_MORCEAUX.flatMap((morceau) => Object.keys(documentsDe(morceau)))];
    for (const id of textes) expect(places.has(id), `${id} : sans emplacement`).toBe(true);
    expect(new Set(textes).size, 'un texte défini deux fois').toBe(textes.length);
    expect(textes.length).toBe(EMPLACEMENTS_DOCUMENTS.length);
  });

  it('huit notes de rangement : une par clé déclarée (grande.cles) et la trousse', () => {
    const notes = couche('rangement');
    expect(notes).toHaveLength(8);
    expect(CLES_DECLAREES).toHaveLength(7);
    for (const { morceau, cle } of CLES_DECLAREES) expect(notes.filter((note) => note.morceau === morceau && note.cle === cle), `${morceau} ${cle}`).toHaveLength(1);
    expect(notes.filter((note) => note.cle === 'butin:soin' && note.morceau === undefined)).toHaveLength(1);
  });

  it('douze documents de la menace, trois par étape', () => {
    const menace = couche('menace');
    expect(menace).toHaveLength(12);
    for (const etape of [1, 2, 3, 4]) expect(menace.filter((emplacement) => emplacement.etape === etape), `étape ${etape}`).toHaveLength(3);
  });

  it('huit documents de l’univers sur des étiquettes, huit témoignages de morceaux', () => {
    expect(couche('univers')).toHaveLength(8);
    for (const emplacement of couche('univers')) expect(emplacement.etiquettes?.length, emplacement.id).toBeGreaterThan(0);
    expect(couche('morceau')).toHaveLength(8);
  });
});

describe('documents dans les grandes stations (#209)', () => {
  const COMPOSITIONS = CATALOGUE.grandes.filter((composition) => composition.refus === null);
  const objetDe = (monde: DefMonde, id: string): DefObjet | undefined => monde.objets.find((objet) => objet.id === id);

  it('une vraie grande station porte de cinq à sept documents, notes de rangement comprises, chacun avec son texte rendu', () => {
    let stations = 0;
    let rendus = 0;
    const lus = new Set<string>();
    for (let graine = 0; graine < 60; graine++) {
      const composition = COMPOSITIONS[(graine * 7) % COMPOSITIONS.length];
      if (composition === undefined) throw new Error('Aucune grande composition.');
      const entree = CATALOGUE.construireGrande(composition.id, graine);
      if ('refus' in entree) continue;
      stations++;
      const { monde, textes } = entree;
      const docs = monde.objets.filter((objet) => objet.document === true);
      const pillees = new Set(monde.pieces.filter((piece) => piece.pillee === true).map((piece) => piece.id));
      for (const doc of docs) expect(pillees.has(doc.piece), `${monde.id} : ${doc.nom} dans la salle pillée ${doc.piece}`).toBe(false);
      const notes = docs.filter((doc) => EMPLACEMENTS_DOCUMENTS.find((emplacement) => emplacement.id === doc.nom)?.couche === 'rangement');
      expect(docs.length, entree.monde.id).toBeGreaterThanOrEqual(5);
      expect(docs.length, entree.monde.id).toBeLessThanOrEqual(7 + notes.length);
      for (const doc of docs) {
        const emplacement = EMPLACEMENTS_DOCUMENTS.find((candidat) => candidat.id === doc.nom);
        if (emplacement === undefined) throw new Error(`${monde.id} : ${doc.nom} hors réserve.`);
        const designe = doc.designe === undefined ? undefined : monde.pieces.find((piece) => piece.id === doc.designe);
        if (emplacement.couche === 'rangement') {
          // La note désigne la pièce de sa clé, ou de la trousse.
          const cle = emplacement.cle === 'butin:soin' ? monde.objets.find((objet) => objet.soin !== undefined) : objetDe(monde, prefixer(emplacement.morceau ?? '', emplacement.cle ?? ''));
          expect(cle?.piece, `${monde.id} : ${doc.nom}`).toBe(doc.designe);
          expect(designe, `${monde.id} : ${doc.nom} : pièce désignée`).toBeDefined();
        } else expect(doc.designe, `${monde.id} : ${doc.nom}`).toBeUndefined();
        const rendu = rendreDocument(textes, {
          type: 'regarder_document',
          cible: { sorte: 'objet', id: doc.id, nom: doc.nom },
          ...(designe === undefined ? {} : { designe: { sorte: 'piece' as const, id: designe.id, nom: designe.nom } }),
        });
        expect(rendu.corps.length, `${monde.id} : ${doc.nom}`).toBeGreaterThan(0);
        expect(texteDocument(rendu), `${monde.id} : ${doc.nom}`).not.toMatch(/[{}]/);
        expect(textes.noms[doc.nom]?.texte, `${monde.id} : puce de ${doc.nom}`).toBeDefined();
        if (designe !== undefined) expect(rendu.piece, `${monde.id} : ${doc.nom}`).toBe(textes.noms[designe.nom]?.texte);
        lus.add(doc.nom);
        rendus++;
      }
    }
    expect(stations).toBeGreaterThan(30);
    expect(rendus).toBeGreaterThan(150);
    expect(lus.size).toBeGreaterThan(15);
  }, 120_000);

  it('les petites stations ne posent aucun document', () => {
    const petite = CATALOGUE.compositions.find((composition) => composition.refus === null);
    if (petite === undefined) throw new Error('Aucune composition.');
    const entree = CATALOGUE.construire(petite.id, 0);
    if ('refus' in entree) throw new Error(entree.refus);
    expect(entree.monde.objets.filter((objet) => objet.document === true)).toHaveLength(0);
    expect(Object.keys(entree.textes.documents).filter((id) => id in DOCUMENTS)).toHaveLength(0);
  });
});
