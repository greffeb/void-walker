import { MONDES, type EntreeMonde, type TextesMonde } from '../content';
import { compterPhrases, verifierTextes } from './check-texts';

const ENTREE = Object.values(MONDES)[0] as EntreeMonde;

function avecTextes(modification: (textes: TextesMonde) => TextesMonde): EntreeMonde {
  return { ...ENTREE, textes: modification(ENTREE.textes) };
}

function sans<T extends object>(objet: T, cle: string): T {
  return Object.fromEntries(Object.entries(objet).filter(([nom]) => nom !== cle)) as T;
}

describe('contrôle des textes (C-07)', () => {
  it('les textes du monde de test sont complets et sûrs', () => {
    expect(verifierTextes(ENTREE)).toEqual([]);
  });

  it('un événement sans texte fait échouer le contrôle (N-02)', () => {
    const entree = avecTextes((textes) => ({ ...textes, evenements: sans(textes.evenements, 'objet_pris') }));
    expect(verifierTextes(entree)).toContain('événement objet_pris : aucun texte (NP-01).');
  });

  it('un refus sans texte fait échouer le contrôle', () => {
    const entree = avecTextes((textes) => ({ ...textes, refus: { ...textes.refus, ferme: undefined as unknown as string } }));
    expect(verifierTextes(entree)).toContain('refus ferme : aucun texte (NP-01).');
  });

  it('un trou inconnu fait échouer le contrôle (N-03)', () => {
    const entree = avecTextes((textes) => ({
      ...textes,
      evenements: { ...textes.evenements, objet_pose: ['Vous posez {le:cle} au sol. Rien ne bouge.'] },
    }));
    expect(verifierTextes(entree)).toContain('événement objet_pose [0] : rôle inconnu « cle ».');
  });

  it('un nom sans texte fait échouer le contrôle, sans afficher d’identifiant (NP-02)', () => {
    const entree = avecTextes((textes) => ({ ...textes, noms: sans(textes.noms, 'carnet') }));
    expect(verifierTextes(entree)).toContain('nom « carnet » sans texte (NP-02).');
  });

  it('un texte qui affiche un identifiant interne fait échouer le contrôle', () => {
    const entree = avecTextes((textes) => ({ ...textes, observation: { ...textes.observation, aucunObjet: 'Rien dans piece-atelier.' } }));
    expect(verifierTextes(entree).some((erreur) => erreur.includes('identifiant affiché'))).toBe(true);
  });

  it('une action racontée en une seule phrase fait échouer le contrôle (D-111)', () => {
    const entree = avecTextes((textes) => ({ ...textes, evenements: { ...textes.evenements, objet_pris: ['Vous prenez {le:objet}.'] } }));
    expect(verifierTextes(entree).some((erreur) => erreur.includes('D-111'))).toBe(true);
  });

  it('compte les phrases', () => {
    expect(compterPhrases('Vous ouvrez. Le mécanisme grince, puis cède.')).toBe(2);
    expect(compterPhrases('Une plaque indique : Atelier.')).toBe(1);
  });
});
