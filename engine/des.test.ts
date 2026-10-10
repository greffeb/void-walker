import { generateurDepuisGraine, graineValide, jouer, nouvellePartie, observer, ouvrirDes, type DefMonde } from './index';

function suite(graine: number, nombre: number, faces = 6): number[] {
  const session = ouvrirDes(generateurDepuisGraine(graine));
  for (let i = 0; i < nombre; i++) session.des.lancer(faces);
  return [...session.tirages];
}

describe('générateur à graine (AP-02)', () => {
  it('même graine, même suite ; autre graine, autre suite', () => {
    expect(suite(7, 50)).toEqual(suite(7, 50));
    expect(suite(7, 50)).not.toEqual(suite(8, 50));
  });

  it('chaque tirage est noté, dans les bornes, et fait avancer le générateur', () => {
    const depart = generateurDepuisGraine(123);
    const copie = { ...depart };
    const session = ouvrirDes(depart);
    const valeurs = Array.from({ length: 600 }, () => session.des.lancer(6));
    expect(session.tirages).toEqual(valeurs);
    expect(new Set(valeurs)).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    expect(session.etatFinal()).not.toEqual(depart);
    expect(depart).toEqual(copie);
  });

  it('reprendre depuis l’état final continue la même suite', () => {
    const entiere = suite(99, 10);
    const premiere = ouvrirDes(generateurDepuisGraine(99));
    for (let i = 0; i < 4; i++) premiere.des.lancer(6);
    const seconde = ouvrirDes(premiere.etatFinal());
    for (let i = 0; i < 6; i++) seconde.des.lancer(6);
    expect([...premiere.tirages, ...seconde.tirages]).toEqual(entiere);
  });

  it('refuse une graine ou un dé invalide', () => {
    expect(graineValide(0)).toBe(true);
    expect(graineValide(0xffffffff)).toBe(true);
    for (const graine of [-1, 1.5, 2 ** 32, Number.NaN, '3']) expect(graineValide(graine)).toBe(false);
    expect(() => generateurDepuisGraine(-1)).toThrow(RangeError);
    expect(() => ouvrirDes(generateurDepuisGraine(1)).des.lancer(0)).toThrow(RangeError);
  });

  it('aucun tirage pour un refus ou une consultation', () => {
    const monde: DefMonde = {
      id: 'des',
      depart: 'a',
      pieces: [
        { id: 'a', nom: 'a' },
        { id: 'b', nom: 'b' },
      ],
      liaisons: [{ id: 'ab', nom: 'porte', entre: ['a', 'b'], ouverte: false }],
      objets: [],
    };
    const partie = nouvellePartie(monde, { version: 'v', graine: 5 });
    for (const choix of observer(monde, partie.etat).menu) {
      const resultat = jouer(monde, partie, choix.commande);
      if (resultat.type !== 'engagee') expect(resultat.partie.etat.generateur).toBe(partie.etat.generateur);
    }
  });
});
