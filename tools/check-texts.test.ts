import { COMPOSITIONS_CONTROLEES, MONDES, type EntreeMonde, type TextesMonde } from '../content';
import { CATALOGUE } from './catalogue';
import { compterPhrases, controlerEntree, controlerLot, controlerTextes, direBornes, idsAControler, regrouperAvertissements, verifierTextes } from './check-texts';

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
  it('lot de check:texts : le monde de test complet, sûr, exploré en entier ; repris du cache la seconde fois, sans nouvelle exploration (#180)', EXHAUSTIF, () => {
    const ids = idsAControler(CATALOGUE);
    expect(ids).toEqual([...Object.keys(CATALOGUE.mondes), ...COMPOSITIONS_CONTROLEES]);
    const lot = { numero: ids.indexOf('monde-test') + 1, total: ids.length };
    const valeurs = new Map<string, unknown>();
    const cache = { lire: <T,>(cle: string) => valeurs.get(cle) as T | undefined, ecrire: (cle: string, valeur: unknown) => void valeurs.set(cle, valeur) };
    const premier = controlerLot(lot, CATALOGUE, cache);
    expect(premier).toMatchObject({ erreurs: 0, repris: 0 });
    expect(premier.lignes).toContainEqual({ niveau: 'log', texte: 'monde-test : textes complets, trous sûrs, aucun identifiant affiché.' });
    expect(premier.lignes.some(({ texte }) => texte.startsWith('monde-test : ') && texte.includes('(exploration complète'))).toBe(true);
    expect([...valeurs.keys()]).toEqual(['entree monde-test']);
    const second = controlerLot(lot, CATALOGUE, cache);
    expect(second).toMatchObject({ erreurs: 0, repris: 1 });
    expect(second.lignes.filter(({ texte }) => texte.endsWith('(repris du cache)'))).toHaveLength(1);
  });

  it('une entrée en erreur n’est pas gardée : elle sera contrôlée de nouveau (#180)', () => {
    const casse = avecTextes((textes) => ({ ...textes, evenements: sans(textes.evenements, 'objet_pris') }));
    const compte = controlerEntree('monde-test', casse);
    expect(compte.erreurs).toBeGreaterThan(0);
    expect(compte.lignes).toContainEqual({ niveau: 'error', texte: 'monde-test : événement objet_pris : aucun texte (NP-01).' });
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

  it('un nom de pièce trop long pour son plan fait échouer le contrôle (PL-04)', () => {
    const long = avecTextes((textes) => ({
      ...textes,
      noms: { ...textes.noms, cabine: { texte: 'cabine de repos prolongé', genre: 'f', nombre: 's', elision: false } },
    }));
    expect(verifierTextes(long)).toContain('plan : « cabine de repos prolongé » ne tient pas dans sa pièce de 3 × 2 cases (PL-04).');
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

  // Doublon de check:texts sur AR-01 (#180) : rejoué seulement en mode complet ; check:texts échoue déjà si un événement
  // d'un parcours témoin n'est jamais rendu.
  it.runIf(process.env.VERIFY_COMPLET === '1')('les textes d’AR-01 sont complets et sûrs, évacuation et assistance comprises', { timeout: 120_000 }, () => {
    const { erreurs, couverture } = controlerTextes(AR01);
    expect(erreurs).toEqual([]);
    expect(couverture?.rendus).toEqual(expect.arrayContaining(['circuit_active', 'objet_installe', 'passage_decouvert', 'evacuation', 'assistance']));
  });

  it('un récit de plus de quatre phrases dans un pas joué par un parcours témoin reste une erreur (D-111)', EXHAUSTIF, () => {
    const long = 'Vous prenez {le:objet}. Deux. Trois. Quatre. Cinq.';
    const entree = avecTextes((textes) => ({ ...textes, evenements: { ...textes.evenements, objet_pris: [long] } }));
    expect(controlerTextes(entree).erreurs).toContain('action prendre (objet_pris) : 5 phrase(s) ; 2 à 4 attendues (D-111).');
  });

  it('un récit de plus de quatre phrases : avertissement hors des pas des parcours témoins, erreur dans un pas de parcours (D-111)', EXHAUSTIF, () => {
    const long = 'Vous posez {le:objet}. Deux. Trois. Quatre. Cinq.';
    const entree = avecTextes((textes) => ({ ...textes, evenements: { ...textes.evenements, objet_pose: [long] } }));
    const message = 'action poser (objet_pose) : 5 phrase(s) ; 2 à 4 attendues (D-111).';

    const horsParcours = controlerTextes({ ...entree, parcours: [] });
    expect(horsParcours.erreurs.filter((erreur) => erreur.includes('D-111'))).toEqual([]);
    expect(horsParcours.avertissements).toContainEqual({ combinaison: 'objet_pose', bornes: '5 phrase(s)', message });

    // Poser le carnet est la dernière étape du parcours témoin (la créature menace à ce moment-là), jouée depuis un état
    // d’abord atteint comme voisin d’un autre. Le même récit hors de cette étape reste un avertissement.
    const dansParcours = controlerTextes(entree);
    expect(dansParcours.erreurs).toEqual(['action poser (objet_pose + menace) : 6 phrase(s) ; 2 à 4 attendues (D-111).']);
    expect(dansParcours.avertissements).toContainEqual({ combinaison: 'objet_pose', bornes: '5 phrase(s)', message });
  });

  it('dit les bornes de phrases sans contradiction, moments forts compris', () => {
    expect(direBornes({ minimum: 3, maximum: 3, momentFort: false })).toBe('3 phrase(s)');
    expect(direBornes({ minimum: 4, maximum: 6, momentFort: false })).toBe('de 4 à 6 phrase(s) selon les variantes');
    // Le minimum compte le moment fort, pas le maximum : « de 9 à 5 » ne doit plus s’afficher.
    expect(direBornes({ minimum: 9, maximum: 5, momentFort: true })).toBe('au moins 9 phrase(s), au plus 5 hors moment fort');
  });

  it('regroupe les avertissements par combinaison d’événements, la plus fréquente en tête', () => {
    const avertissement = (combinaison: string, bornes: string) => ({ combinaison, bornes, message: `action x (${combinaison}) : ${bornes}` });
    const groupes = regrouperAvertissements([
      avertissement('feu_gagne + menace', 'au moins 3 phrase(s), au plus 5 hors moment fort'),
      avertissement('objet_pose', '5 phrase(s)'),
      avertissement('objet_pose', '5 phrase(s)'),
      avertissement('feu_gagne + menace', 'de 4 à 6 phrase(s) selon les variantes'),
      avertissement('objet_pose', '5 phrase(s)'),
    ]);
    expect(groupes).toEqual([
      { combinaison: 'objet_pose', occurrences: 3, bornes: ['5 phrase(s)'] },
      {
        combinaison: 'feu_gagne + menace',
        occurrences: 2,
        bornes: ['au moins 3 phrase(s), au plus 5 hors moment fort', 'de 4 à 6 phrase(s) selon les variantes'],
      },
    ]);
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
