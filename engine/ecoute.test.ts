import { describe, expect, it } from 'vitest';
import { aRaconter, ecouterPortes, faceEcoute, nouvellePartie, type DefMonde, type EtatPartie } from './index';

// Pièce du joueur 'a' ; portes : af (fermée, vers f), ao (ouverte, vers o), am (vers la salle des machines m), ac (vers la chambre froide c).
const MONDE: DefMonde = {
  id: 'essai-ecoute',
  depart: 'a',
  pieces: [
    { id: 'a', nom: 'salle_a' },
    { id: 'f', nom: 'salle_f' },
    { id: 'o', nom: 'salle_o' },
    { id: 'm', nom: 'salle_m', machines: true },
    { id: 'c', nom: 'salle_c', froide: true },
  ],
  liaisons: [
    { id: 'af', nom: 'porte_af', entre: ['a', 'f'], ouverte: false },
    { id: 'ao', nom: 'porte_ao', entre: ['a', 'o'], ouverte: true },
    { id: 'am', nom: 'porte_am', entre: ['a', 'm'], ouverte: false },
    { id: 'ac', nom: 'porte_ac', entre: ['a', 'c'], ouverte: false },
  ],
  objets: [],
  creature: { piece: 'f' },
};

function etatAvec(creature: Partial<NonNullable<EtatPartie['creature']>> | null, changement: Partial<EtatPartie> = {}): EtatPartie {
  const base = nouvellePartie(MONDE, { version: 'ecoute-1', graine: 7 }).etat;
  return { ...base, ...changement, creature: creature === null ? null : { ...base.creature!, ...creature } };
}

const ACTIONS = Array.from({ length: 600 }, (_, i) => i);
const jets = (etat: EtatPartie, liaison: string): string[] => ACTIONS.map((i) => ecouterPortes(MONDE, etat, 7, i)[liaison]!);

describe('ecouterPortes', () => {
  it('jamais net sans elle ; vague parfois ; le reste est rien', () => {
    const vus = new Set(jets(etatAvec({ piece: 'o' }), 'af'));
    expect([...vus].sort()).toEqual(['rien', 'vague']);
  });
  it('porte fermée avec elle : net et vague, environ la moitié de net', () => {
    const r = jets(etatAvec({ piece: 'f' }), 'af');
    expect(new Set(r)).toEqual(new Set(['net', 'vague', 'rien']));
    const part = r.filter((x) => x === 'net').length / r.length;
    expect(part).toBeGreaterThan(0.4);
    expect(part).toBeLessThan(0.6);
  });
  it('porte ouverte avec elle : jamais rien, et la même porte change de table en s\'ouvrant', () => {
    const ouverte = etatAvec({ piece: 'f' }, { liaisons: { ...etatAvec(null).liaisons, af: true } });
    const r = jets(ouverte, 'af');
    expect(r).not.toContain('rien');
    expect(r).toContain('net');
    expect(jets(etatAvec({ piece: 'f' }), 'af')).toContain('rien');
  });
  it('machines et froid constants', () => {
    const etat = etatAvec({ piece: 'f' });
    expect(new Set(jets(etat, 'am'))).toEqual(new Set(['machines']));
    expect(new Set(jets(etat, 'ac'))).toEqual(new Set(['froid']));
  });
  it('inerte : jamais net ; alcôve : présente', () => {
    expect(jets(etatAvec({ piece: 'f', neutralisee: 'inerte' }), 'af')).not.toContain('net');
    expect(jets(etatAvec({ piece: 'f', alcove: true }), 'af')).toContain('net');
  });
  it('dans une salle des machines en marche : rien à entendre', () => {
    expect(ecouterPortes(MONDE, etatAvec({ piece: 'f' }, { piece: 'm' }), 7, 1)).toEqual({});
  });
  it('déterministe', () => {
    const etat = etatAvec({ piece: 'f' });
    expect(ecouterPortes(MONDE, etat, 7, 42)).toEqual(ecouterPortes(MONDE, etat, 7, 42));
    expect(faceEcoute(7, 42, 'af')).toBe(faceEcoute(7, 42, 'af'));
  });
});

describe('aRaconter (lot 2, maquette ecouter.html)', () => {
  it('première attente : tout', () => {
    expect(aRaconter(undefined, { a: 'rien', m: 'machines' })).toEqual([{ liaison: 'a', entendu: 'rien' }, { liaison: 'm', entendu: 'machines' }]);
  });
  it('rien de changé : rien ; machines et froid jamais redits', () => {
    expect(aRaconter({ a: 'rien', m: 'machines', f: 'froid' }, { a: 'rien', m: 'machines', f: 'froid' })).toEqual([]);
  });
  it('net redit en « toujours » ; net puis rien : « plus rien »', () => {
    expect(aRaconter({ a: 'net' }, { a: 'net' })).toEqual([{ liaison: 'a', entendu: 'toujours' }]);
    expect(aRaconter({ a: 'net' }, { a: 'rien' })).toEqual([{ liaison: 'a', entendu: 'plus_rien' }]);
    expect(aRaconter({ a: 'vague' }, { a: 'rien' })).toEqual([{ liaison: 'a', entendu: 'plus_rien' }]);
  });
  it('autre changement et liaison nouvelle : tels quels', () => {
    expect(aRaconter({ a: 'rien' }, { a: 'vague', b: 'net' })).toEqual([{ liaison: 'a', entendu: 'vague' }, { liaison: 'b', entendu: 'net' }]);
  });
});
