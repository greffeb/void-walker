import { describe, expect, it } from 'vitest';
import { VERSION_GENERATEUR, type EntreeMonde } from '../content';
import { idPublic, validerMonde } from '../engine';
import { CATALOGUE } from './catalogue';
import { actualiserVersionGrande, transposerTemoins } from './temoins-portables';
import { rejouerTemoin, type PasTemoin } from './verifier-grandes';

function petite(id: string): EntreeMonde {
  const reference = CATALOGUE.mondes['m-07'];
  if (reference === undefined) throw new Error('Monde m-07 absent.');
  return {
    ...reference,
    monde: {
      id,
      depart: 'a',
      pieces: [{ id: 'a', nom: 'quartiers' }, { id: 'quai', nom: 'embarquement' }, { id: 'cabine', nom: 'cabine', sousPosition: true }],
      liaisons: [
        { id: 'porte', nom: 'porte', entre: ['a', 'quai'], ouverte: false },
        { id: 'ecoutille', nom: 'ecoutille', entre: ['quai', 'cabine'], ouverte: false },
      ],
      objets: [
        { id: 'capsule', nom: 'capsule', piece: 'quai', portable: false, capsule: { interieur: 'cabine' } },
        { id: 'pupitre', nom: 'pupitre', piece: 'cabine', portable: false, depart: 'capsule' },
        { id: 'source', nom: 'source', piece: 'a', source: true },
        { id: 'caisse', nom: 'caisse', piece: 'a', portable: false, deplacable: true, position: 'centre' },
      ],
      positions: [{ id: 'centre', nom: 'centre', piece: 'a' }, { id: 'coin', nom: 'coin', piece: 'a' }],
    },
  };
}

const ETAPES: readonly PasTemoin[] = [
  ['attendre', 'a'],
  ['deplacer', 'caisse', 'coin'],
  ['prendre', 'source'],
  ['ouvrir', 'porte'],
  ['aller', 'porte'],
  ['installer', 'source'],
  ['ouvrir', 'ecoutille'],
  ['aller', 'ecoutille'],
  ['fermer', 'ecoutille'],
  ['lancer', 'pupitre'],
];

function enPublic(entree: EntreeMonde, etapes: readonly PasTemoin[]): PasTemoin[] {
  return etapes.map(([action, cible, parametre]) => parametre === undefined
    ? [action, idPublic(entree.monde.id, cible)]
    : [action, idPublic(entree.monde.id, cible), idPublic(entree.monde.id, parametre)]);
}

const SOURCE = petite('g1-portable-0');
const CIBLE = petite(`g${VERSION_GENERATEUR}-portable-0`);

describe('témoins portables (D-326)', () => {
  it('transpose pièces, passages, objets et positions puis évacue par les vraies règles', () => {
    expect(validerMonde(SOURCE.monde)).toEqual([]);
    expect(validerMonde(CIBLE.monde)).toEqual([]);
    const originaux = [enPublic(SOURCE, ETAPES)];
    const copie = structuredClone(originaux);
    const transposes = transposerTemoins(SOURCE, CIBLE, originaux);
    expect(originaux).toEqual(copie);
    expect(rejouerTemoin(CIBLE, originaux[0] ?? [])).toBeNull();
    if (transposes === null) throw new Error('Transposition refusée.');
    for (const temoin of originaux) expect(rejouerTemoin(SOURCE, temoin)).toEqual([]);
    for (const temoin of transposes) expect(rejouerTemoin(CIBLE, temoin)).toEqual([]);
  });

  it.each([
    ['pieces', 'a'],
    ['liaisons', 'porte'],
    ['objets', 'source'],
    ['positions', 'coin'],
  ] as const)('refuse une identité absente dans %s, même si son nom est conservé', (categorie, id) => {
    const cible = { ...CIBLE, monde: { ...CIBLE.monde, [categorie]: (CIBLE.monde[categorie] ?? []).map((entite) => entite.id === id ? { ...entite, id: `autre-${id}` } : entite) } };
    expect(transposerTemoins(SOURCE, cible, [enPublic(SOURCE, ETAPES)])).toBeNull();
  });

  it('refuse les références inconnues de la source, y compris une cible ou un paramètre vide', () => {
    for (const inconnu of ['', 'e00000000', idPublic(CIBLE.monde.id, 'source')]) {
      expect(transposerTemoins(SOURCE, CIBLE, [[['prendre', inconnu]]])).toBeNull();
      expect(transposerTemoins(SOURCE, CIBLE, [[['deplacer', idPublic(SOURCE.monde.id, 'caisse'), inconnu]]])).toBeNull();
    }
  });

  it('ne confond pas deux catégories d’entité', () => {
    const cible = { ...CIBLE, monde: { ...CIBLE.monde, objets: CIBLE.monde.objets.filter((objet) => objet.id !== 'source'), pieces: [...CIBLE.monde.pieces, { id: 'source', nom: 'source' }] } };
    expect(transposerTemoins(SOURCE, cible, [[['prendre', idPublic(SOURCE.monde.id, 'source')]]])).toBeNull();
  });

});

describe('actualisation de la version historique', () => {
  it('ne remplace que le préfixe de version, sans toucher à la composition ni à la graine', () => {
    expect(actualiserVersionGrande('g1-ol-m01-m02-m09-m06-cale-123')).toBe(`g${VERSION_GENERATEUR}-ol-m01-m02-m09-m06-cale-123`);
    expect(actualiserVersionGrande('g123-m01-g2-m06')).toBe(`g${VERSION_GENERATEUR}-m01-g2-m06`);
    for (const id of ['m01-m06-cale-123', 'prefixe-g1-m01', 'g-m01', '']) expect(actualiserVersionGrande(id)).toBe(id);
  });
});
