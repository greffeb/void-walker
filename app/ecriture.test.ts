import { dejaEcrit, delaisEcriture, DUREE_ECRITURE_MS, marquerEcrit, numeroDe } from './ecriture';
import { CLE_REGLAGES, lireReglages } from './reglages';

describe('effet machine à écrire (D-186)', () => {
  it('environ 500 ms quelle que soit la longueur, dans l’ordre de lecture des blocs', () => {
    expect(DUREE_ECRITURE_MS).toBe(500);
    for (const blocs of [['> Regarder'], ['> Carnet · Prendre', 'Vous prenez le carnet.', 'x'.repeat(600)]]) {
      const delais = delaisEcriture(blocs).flat();
      expect(delais).toHaveLength(blocs.join('').length);
      expect(delais[0]).toBe(0);
      expect(delais.every((ms, rang) => rang === 0 || ms >= (delais[rang - 1] ?? 0))).toBe(true);
      expect(Math.max(...delais)).toBeLessThan(DUREE_ECRITURE_MS);
      expect(Math.max(...delais)).toBeGreaterThan(DUREE_ECRITURE_MS - DUREE_ECRITURE_MS / delais.length - 1);
    }
  });

  it('caractères comptés un à un, accents et symboles compris', () => {
    expect(delaisEcriture(['é▮', 'à'], 300)).toEqual([[0, 100], [200]]);
    expect(delaisEcriture([])).toEqual([]);
  });

  it('un texte affiché a son numéro ; un nouveau, même identique, en a un autre', () => {
    const premier = { recit: ['Rien.'] };
    const second = { recit: ['Rien.'] };
    expect(numeroDe(premier)).toBe(numeroDe(premier));
    expect(numeroDe(second)).not.toBe(numeroDe(premier));
  });

  it('un texte marqué écrit ne l’est qu’une fois', () => {
    const texte = {};
    expect(dejaEcrit(texte)).toBe(false);
    marquerEcrit(texte);
    expect(dejaEcrit(texte)).toBe(true);
  });
});

describe('réglage « Effet machine à écrire » gardé sur l’appareil', () => {
  const magasin = (valeur: string | null) => (cle: string) => (cle === CLE_REGLAGES ? valeur : null);

  it('[OUI] par défaut ; [NON] enregistré relu', () => {
    expect(lireReglages(magasin(null))).toEqual({ machineAEcrire: true });
    expect(lireReglages(magasin('{"machineAEcrire":false}'))).toEqual({ machineAEcrire: false });
    expect(lireReglages(magasin('{"machineAEcrire":true}'))).toEqual({ machineAEcrire: true });
  });

  it('réglages illisibles ou stockage refusé : [OUI]', () => {
    for (const valeur of ['pas du json', '42', '{}', '{"machineAEcrire":"non"}']) expect(lireReglages(magasin(valeur))).toEqual({ machineAEcrire: true });
    expect(
      lireReglages(() => {
        throw new Error('Stockage refusé.');
      }),
    ).toEqual({ machineAEcrire: true });
  });
});
