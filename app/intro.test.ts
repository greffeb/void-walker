import { COMPOSITIONS_PUBLIEES, GRANDES_PUBLIEES, MONDES, type EntreeMonde } from '../content';
import { CATALOGUE } from './catalogue';
import { AMBIANCE, compositionDe, creerIntro, dependancesPubliees, lignesDuTirage, numeroDe, pasLigne, planDe, type DependancesIntro } from './intro';

/** Hasard rejouable : même graine, mêmes tirages. */
function lcg(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (Math.imul(etat, 1664525) + 1013904223) >>> 0;
    return etat / 2 ** 32;
  };
}

function deps(): DependancesIntro {
  return {
    compositions: COMPOSITIONS_PUBLIEES,
    construire: (composition, graine) => CATALOGUE.construire(composition, graine),
    hasard: lcg(1),
    mouvementReduit: () => false,
  };
}

describe('intro de NOUVELLE PARTIE (12 §4.1 bis, D-308 à D-312)', () => {
  it('numéro : rang de la composition parmi les stations publiées, sans la graine du plan ; aucun pour un monde fixe', () => {
    const [premiere] = COMPOSITIONS_PUBLIEES;
    const derniere = COMPOSITIONS_PUBLIEES.at(-1);
    expect(compositionDe('m01-m03-reserve-5')).toBe('m01-m03-reserve');
    expect(numeroDe(COMPOSITIONS_PUBLIEES, `${premiere}-0`)).toBe(1);
    expect(numeroDe(COMPOSITIONS_PUBLIEES, `${derniere}-4294967295`)).toBe(COMPOSITIONS_PUBLIEES.length);
    expect(numeroDe(COMPOSITIONS_PUBLIEES, `${premiere}-12`)).toBe(numeroDe(COMPOSITIONS_PUBLIEES, `${premiere}-99`));
    for (const fixe of ['ar-01', 'ar-02', 'monde-test', 'm-07']) expect(numeroDe(COMPOSITIONS_PUBLIEES, fixe), fixe).toBeNull();
    expect(numeroDe(COMPOSITIONS_PUBLIEES, 'm99-m03-reserve-3')).toBeNull();
  });

  it('plan : les rectangles des pièces dessinées ; le défilé pioche de vraies stations publiées', () => {
    const intro = creerIntro(deps());
    expect(intro.total).toBe(COMPOSITIONS_PUBLIEES.length);
    const plans = Array.from({ length: 6 }, () => intro.plan()).filter((plan) => plan !== null);
    expect(plans.length).toBeGreaterThan(0);
    for (const plan of plans) {
      expect(plan.length).toBeGreaterThan(3);
      for (const rect of plan) expect(rect.largeur * rect.hauteur).toBeGreaterThan(0);
    }
    const { monde } = MONDES['monde-test'] as EntreeMonde;
    expect(planDe(monde)).toHaveLength(monde.pieces.filter((piece) => piece.plan !== undefined).length);
  });

  it('petites et grandes stations publiées : un numéro chacune, par composition, et de vrais plans au défilé (D-312, D-313)', () => {
    const publiees = dependancesPubliees(COMPOSITIONS_PUBLIEES, GRANDES_PUBLIEES, (composition, graine) => CATALOGUE.construire(composition, graine), (id) => CATALOGUE.resoudre(id));
    const intro = creerIntro({ ...publiees, hasard: lcg(7), mouvementReduit: () => false });
    const grandes = new Set(GRANDES_PUBLIEES.map(compositionDe));
    expect(new Set(publiees.compositions).size).toBe(publiees.compositions.length);
    expect(intro.total).toBe(COMPOSITIONS_PUBLIEES.length + grandes.size);
    expect(intro.numero(`${COMPOSITIONS_PUBLIEES[0]}-5`)).toBe(1);
    for (const id of GRANDES_PUBLIEES.slice(0, 20)) expect(intro.numero(id), id).toBe(publiees.compositions.indexOf(compositionDe(id)) + 1);
    expect(intro.numero(GRANDES_PUBLIEES[0]!)).toBeGreaterThan(COMPOSITIONS_PUBLIEES.length);
    const tiree = CATALOGUE.tirerGrande(() => 12345);
    expect('refus' in tiree).toBe(false);
    if (!('refus' in tiree)) expect(intro.numero(tiree.monde.id)).not.toBeNull();
    const grande = publiees.construire([...grandes][0]!, 3);
    expect('refus' in grande ? 0 : planDe(grande.monde).length).toBeGreaterThan(20);
    expect('refus' in publiees.construire('g1-inconnue', 0)).toBe(true);
  });

  it('lignes : départ, passage et final, trois textes d’ambiance distincts tirés au hasard, capsule et sortie (D-309)', () => {
    for (let graine = 0; graine < 50; graine += 1) {
      const lignes = lignesDuTirage(lcg(graine));
      expect(lignes).toHaveLength(8);
      expect(lignes.slice(0, 3).map(({ libelle }) => libelle)).toEqual(['Section de départ', 'Sections de passage', 'Section finale']);
      expect(lignes.slice(-2).map(({ libelle }) => libelle)).toEqual(['Arrimage de la capsule', 'Vérification de la sortie']);
      const ambiance = lignes.slice(3, 6).map(({ libelle }) => libelle);
      expect(new Set(ambiance).size).toBe(3);
      const connues = AMBIANCE.map((texte) => texte(lcg(0)).libelle);
      for (const libelle of ambiance) expect(connues).toContain(libelle);
    }
    expect(lignesDuTirage(lcg(3))).toEqual(lignesDuTirage(lcg(3)));
  });

  it('pas des lignes irrégulier : rafales de 25 à 60 ms, pas de 80 à 180 ms, temps de traitement de 240 à 400 ms', () => {
    const hasard = lcg(42);
    const pas = Array.from({ length: 2000 }, () => pasLigne(hasard));
    for (const delai of pas) expect((delai >= 25 && delai < 60) || (delai >= 80 && delai < 180) || (delai >= 240 && delai < 400), String(delai)).toBe(true);
    expect(pas.some((delai) => delai < 60)).toBe(true);
    expect(pas.some((delai) => delai >= 240)).toBe(true);
  });
});
