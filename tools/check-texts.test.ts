import { MONDES, type EntreeMonde, type TextesMonde } from '../content';
import { compterPhrases, controlerTextes, verifierTextes } from './check-texts';

const ENTREE = MONDES['monde-test'] as EntreeMonde;
const AR01 = MONDES['ar-01'] as EntreeMonde;

function avecTextes(modification: (textes: TextesMonde) => TextesMonde): EntreeMonde {
  return { ...ENTREE, textes: modification(ENTREE.textes) };
}

function sans<T extends object>(objet: T, cle: string): T {
  return Object.fromEntries(Object.entries(objet).filter(([nom]) => nom !== cle)) as T;
}

/** Ces tests parcourent tous les états atteignables : plusieurs secondes sur la machine de vérification de GitHub. */
const EXHAUSTIF = { timeout: 30_000 };

describe('contrôle des textes (C-07)', () => {
  it('les textes du monde de test sont complets et sûrs', EXHAUSTIF, () => {
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

  it('une action sans verbe pour le rappel fait échouer le contrôle', () => {
    const entree = avecTextes((textes) => ({ ...textes, verbes: sans(textes.verbes, 'prendre') }));
    expect(verifierTextes(entree)).toContain('verbe prendre : aucun texte (NP-01).');
  });

  it('un verbe vide ou avec un trou fait échouer le contrôle', () => {
    const vide = avecTextes((textes) => ({ ...textes, verbes: { ...textes.verbes, poser: ' ' } }));
    expect(verifierTextes(vide)).toContain('verbe poser : texte vide.');
    const trou = avecTextes((textes) => ({ ...textes, verbes: { ...textes.verbes, ouvrir: 'Ouvrir {le:cible}' } }));
    expect(verifierTextes(trou)).toContain('verbe ouvrir : rôle inconnu « cible ».');
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

  it('un texte qui affiche un identifiant interne fait échouer le contrôle', EXHAUSTIF, () => {
    const entree = avecTextes((textes) => ({ ...textes, observation: { ...textes.observation, aucunObjet: 'Rien dans piece-atelier.' } }));
    expect(verifierTextes(entree).some((erreur) => erreur.includes('identifiant affiché'))).toBe(true);
  });

  it('une action racontée en une seule phrase fait échouer le contrôle (D-111)', EXHAUSTIF, () => {
    const entree = avecTextes((textes) => ({ ...textes, evenements: { ...textes.evenements, objet_pris: ['Vous prenez {le:objet}.'] } }));
    expect(verifierTextes(entree).some((erreur) => erreur.includes('D-111'))).toBe(true);
  });

  it('premier contact : plus long permis (D-111), mais garde-fou de quatre phrases pour lui seul', () => {
    const long = 'Une. Deux. Trois. Quatre. Cinq.';
    const entree = avecTextes((textes) => ({ ...textes, evenements: { ...textes.evenements, premier_contact: [long] } }));
    expect(verifierTextes(entree)).toContain('événement premier_contact : plus de quatre phrases (garde-fou du contrôle).');
  });

  it('aperçu : un niveau de risque sans mot, une phrase sans texte ou un chiffre font échouer le contrôle (C-04 §4.3)', EXHAUSTIF, () => {
    const sansMot = avecTextes((textes) => ({ ...textes, apercu: { ...textes.apercu, risques: sans(textes.apercu.risques, 'mortel') } }));
    expect(verifierTextes(sansMot)).toContain('risque mortel : aucun texte (NP-01).');
    const sansPhrase = avecTextes((textes) => ({ ...textes, apercu: { ...textes.apercu, savoir: sans(textes.apercu.savoir, 'quittera') } }));
    expect(verifierTextes(sansPhrase)).toContain('aperçu quittera : aucun texte (NP-01).');
    const chiffre = avecTextes((textes) => ({ ...textes, apercu: { ...textes.apercu, risques: { ...textes.apercu.risques, aucun: '0 %' } } }));
    expect(verifierTextes(chiffre)).toContain('aperçu : chiffre ou pourcentage dans « 0 % » (C-04 §4.3).');
    const rendu = avecTextes((textes) => ({ ...textes, apercu: { ...textes.apercu, savoir: { ...textes.apercu.savoir, portera: 'Vous aurez {le:objet} en main, 1 sur 6.' } } }));
    expect(verifierTextes(rendu)).toContain('aperçu prendre : chiffre ou pourcentage dans « Vous aurez le carnet en main, 1 sur 6. » (C-04 §4.3).');
  });

  it('compte les phrases', () => {
    expect(compterPhrases('Vous ouvrez. Le mécanisme grince, puis cède.')).toBe(2);
    expect(compterPhrases('Une plaque indique : Atelier.')).toBe(1);
  });

  it('le monde de test reste exploré en entier', EXHAUSTIF, () => {
    const { couverture } = controlerTextes(ENTREE);
    expect(couverture?.complete).toBe(true);
  });

  it('les textes d’AR-01 sont complets et sûrs, évacuation et assistance comprises', { timeout: 120_000 }, () => {
    const { erreurs, avertissements, couverture } = controlerTextes(AR01);
    expect(erreurs).toEqual([]);
    expect(couverture?.rendus).toEqual(expect.arrayContaining(['circuit_active', 'objet_installe', 'passage_decouvert', 'evacuation', 'assistance']));
    // Hors parcours, feu, blessure et menace cumulés dépassent quatre phrases : signalé, à arbitrer (D-111).
    expect(avertissements.length).toBeGreaterThan(0);
    expect(avertissements.every((avertissement) => avertissement.endsWith('2 à 4 attendues (D-111).'))).toBe(true);
  });

  it('un récit de plus de quatre phrases depuis un état d’un parcours témoin reste une erreur (D-111)', EXHAUSTIF, () => {
    const long = 'Vous prenez {le:objet}. Deux. Trois. Quatre. Cinq.';
    const entree = avecTextes((textes) => ({ ...textes, evenements: { ...textes.evenements, objet_pris: [long] } }));
    expect(controlerTextes(entree).erreurs).toContain('action prendre (objet_pris) : de 5 à 5 phrase(s) selon les variantes, 2 à 4 attendues (D-111).');
  });

  it('évacuation : plus longue permise, mais garde-fou de quatre phrases', () => {
    const long = 'Une. Deux. Trois. Quatre. Cinq.';
    const entree = { ...AR01, textes: { ...AR01.textes, evacuations: { ...AR01.textes.evacuations, bloc: [long] as const } } };
    expect(verifierTextes(entree)).toContain('événement evacuation : plus de quatre phrases (garde-fou du contrôle).');
  });

  it('un message d’assistance absent, à trou ou chiffré fait échouer le contrôle', () => {
    const avecAssistance = (assistance: Record<string, string>): EntreeMonde => ({ ...AR01, textes: { ...AR01.textes, assistance } });
    expect(verifierTextes(avecAssistance(sans(AR01.textes.assistance, 'energie')))).toContain('assistance « energie » : aucun texte (NP-01).');
    expect(verifierTextes(avecAssistance({ ...AR01.textes.assistance, depart: 'Départ depuis {le:piece}.' }))).toContain(
      'assistance « depart » : rôle inconnu « piece ».',
    );
    expect(verifierTextes(avecAssistance({ ...AR01.textes.assistance, reveil: 'Capsule 2 disponible.' }))).toContain(
      'assistance « reveil » : chiffre dans « Capsule 2 disponible. ».',
    );
  });

  it('un passage sans destination connue sans texte fait échouer le contrôle', () => {
    const entree = { ...AR01, textes: { ...AR01.textes, allerSansDestination: undefined as unknown as string } };
    expect(verifierTextes(entree)).toContain('libellé aller sans destination connue : aucun texte (NP-01).');
  });
});
