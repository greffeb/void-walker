import { caracteresParLigne, couperTexte, nomLisible, nomSurPlan, placeDuNom } from './lisibilite';

describe('lisibilité des noms sur le plan (14 §4.2 PL-04)', () => {
  it('8,32 px par caractère, 8 px de marge de chaque côté', () => {
    expect(caracteresParLigne(4 * 34)).toBe(14);
    expect(caracteresParLigne(3 * 34)).toBe(10);
    expect(caracteresParLigne(2 * 34)).toBe(6);
  });

  it('capitales françaises ; accents et apostrophe typographique comptent pour un caractère', () => {
    expect(nomSurPlan('salle d’embarquement')).toBe('SALLE D’EMBARQUEMENT');
    expect(couperTexte('SALLE D’EMBARQUEMENT', 4 * 34)).toEqual(['SALLE', 'D’EMBARQUEMENT']);
    expect(couperTexte('LOCAL ÉNERGIE', 4 * 34)).toEqual(['LOCAL ÉNERGIE']);
  });

  it('coupe aux espaces, jamais dans un mot', () => {
    expect(couperTexte('SALON DE TRANSIT', 4 * 34)).toEqual(['SALON DE', 'TRANSIT']);
    expect(couperTexte('ATELIER MAINTENANCE', 3 * 34)).toBeNull();
  });

  it('garde la place d’une ligne d’état : deux cases de haut portent deux lignes de nom', () => {
    expect(placeDuNom('salle d’embarquement', 4, 2)).toEqual({ lignes: ['SALLE', 'D’EMBARQUEMENT'], libres: 1 });
    expect(nomLisible('salle d’embarquement', 4, 2)).toBe(true);
    expect(nomLisible('salle d’embarquement', 3, 3)).toBe(false);
    expect(nomLisible('cabines du personnel', 2, 2)).toBe(false);
    expect(nomLisible('cabine de repos prolongé', 3, 2)).toBe(false);
  });

  it('à l’écran, un nom qui ne tient plus au zoom courant disparaît (14 §2.3)', () => {
    expect(placeDuNom('cabine', 3, 2, 34)).toEqual({ lignes: ['CABINE'], libres: 2 });
    expect(placeDuNom('cabine', 3, 2, 17)).toBeNull();
  });
});
