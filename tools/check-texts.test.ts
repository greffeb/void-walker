import { CLE_TROUSSE, prefixer, type EmplacementDocument } from '../engine';
import { COMPOSITIONS_CONTROLEES, DOCUMENTS, EMPLACEMENTS_DOCUMENTS, GRAINE_GRANDE_MAX, MONDES, MORCEAUX, type EntreeMonde, type TexteDocument, type TextesMonde } from '../content';
import { TEXTES_AR01 } from '../content/ar-01/textes';
import { CATALOGUE } from './catalogue';
import {
  borneDe,
  compterPhrases,
  controlerEntree,
  controlerLot,
  controlerPhrases,
  controlerReserve,
  controlerTextes,
  controlerTextesCommuns,
  direBornes,
  entreeAControler,
  grandesAControler,
  idsAControler,
  MAX_ETATS,
  MAX_ETATS_GRANDE,
  MAX_ETATS_MONDE_TEST,
  PHRASES_REELLES,
  piecesPour,
  regrouperAvertissements,
  rendusDeLaReserve,
  SOURCES_RESERVE,
  tracesHorsPiste,
  verifierTextes,
  type SourcesReserve,
} from './check-texts';

const ENTREE = MONDES['monde-test'] as EntreeMonde;
const AR01 = MONDES['ar-01'] as EntreeMonde;

function avecTextes(modification: (textes: TextesMonde) => TextesMonde): EntreeMonde {
  return { ...ENTREE, textes: modification(ENTREE.textes) };
}

function sans<T extends object>(objet: T, cle: string): T {
  return Object.fromEntries(Object.entries(objet).filter(([nom]) => nom !== cle)) as T;
}

/**
 * Ces tests parcourent tous les états atteignables du monde de test : plusieurs dizaines de secondes sur la machine de
 * vérification de GitHub quand le jet touche toujours (variante V1 de #194, 89 183 états).
 */
const EXHAUSTIF = { timeout: 180_000 };

describe('contrôle des textes (C-07)', () => {
  it('lot de check:texts : le monde de test complet, sûr, exploré en entier ; repris du cache la seconde fois, sans nouvelle exploration (#180)', EXHAUSTIF, () => {
    const ids = idsAControler(CATALOGUE);
    expect(ids).toEqual([...Object.keys(CATALOGUE.mondes), ...COMPOSITIONS_CONTROLEES, ...grandesAControler(CATALOGUE)]);
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

  it('seul le lot 1 contrôle aussi les textes sans station : couches, traces, réserve de documents, pillages, traces et bruits (spec §11)', () => {
    const ids = idsAControler(CATALOGUE);
    // Un cache qui connaît toutes les entrées : le lot ne les explore pas, seul le contrôle des textes communs reste à voir.
    const repris = { lire: <T,>() => ({ lignes: [], erreurs: 0 }) as T, ecrire: () => undefined };
    const textes = (numero: number): string[] => controlerLot({ numero, total: ids.length }, CATALOGUE, repris).lignes.map(({ texte }) => texte);
    const lot1 = textes(1);
    expect(lot1).toEqual(controlerTextesCommuns().lignes.map(({ texte }) => texte));
    for (const ligne of ['couches : l’univers sans mot de la menace ni des traces, la menace sans « station ».', 'documents : toute la réserve rendue sans station ; structure, trous, couches, longueur, chiffres et puces sûrs.', 'phrases : pillages, traces et bruits de station sûrs.']) {
      expect(lot1).toContain(ligne);
    }
    expect(textes(2)).toEqual([]);
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

  it('le libellé de « poser » à une position est contrôlé : absent, ou avec un rôle inconnu, il fait échouer le contrôle', () => {
    const avec = (poserAPosition: string): EntreeMonde => ({ ...AR01, textes: { ...AR01.textes, poserAPosition } });
    expect(verifierTextes(avec(undefined as unknown as string))).toContain('libellé poser à une position : aucun texte (NP-01).');
    expect(verifierTextes(avec('Poser {le:cible} {nom:piece}'))).toContain('libellé poser à une position : rôle inconnu « piece ».');
  });

});

describe('textes calmes des grandes stations (spec 2026-10-18 §5.4)', () => {
  it('aucune description qu’une grande station montre ne porte un mot de trace : les traces viennent de la piste', () => {
    expect(tracesHorsPiste()).toEqual([]);
  });

  /** Première station, grande ou petite, d'une composition qui a un plan : la plupart des graines n'en ont pas. */
  function premiere(construire: (graine: number) => EntreeMonde | { readonly refus: string }): EntreeMonde {
    for (let graine = 0; graine < 200; graine++) {
      const station = construire(graine);
      if (!('refus' in station)) return station;
    }
    throw new Error('Aucune graine avec un plan.');
  }

  it('M-02 : la caisse des grandes stations ne dit plus qu’elle ne se porte pas ; en petite station, le texte d’AR-01', () => {
    const grande = CATALOGUE.grandes.find((composition) => composition.refus === null && [...composition.chemins, composition.final].includes('m-02'));
    expect(grande).toBeDefined();
    const station = premiere((graine) => CATALOGUE.construireGrande(grande?.id ?? '', graine));
    const variantes = station.textes.descriptions.caisse ?? [];
    expect(variantes.length).toBeGreaterThanOrEqual(2);
    for (const variante of variantes) expect(variante).not.toMatch(/(?<!\p{L})port(?:é|ée|és|ées|er)(?!\p{L})/u);
    expect(variantes).not.toEqual(TEXTES_AR01.descriptions.caisse);
    const petite = premiere((graine) => CATALOGUE.construire('m02-m06-embarquement', graine));
    expect(petite.textes.descriptions.caisse).toEqual(TEXTES_AR01.descriptions.caisse);
  });

  it('la description de la pièce d’origine de chaque clé ne nomme pas sa clé (spec §6.5)', () => {
    const cles = Object.values(MORCEAUX).flatMap(({ morceau }) => Object.keys(morceau.grande?.cles ?? {}).map((objet) => ({ id: morceau.id, objet })));
    expect(cles.length).toBeGreaterThanOrEqual(7);
    for (const { id, objet } of cles) {
      const composition = CATALOGUE.grandes.find((candidate) => candidate.refus === null && [...candidate.chemins, candidate.final].includes(id));
      expect(composition, id).toBeDefined();
      const { monde, textes } = premiere((graine) => CATALOGUE.construireGrande(composition?.id ?? '', graine));
      const cle = monde.objets.find((candidat) => candidat.id === prefixer(id, objet));
      const origine = monde.pieces.find((piece) => piece.id === prefixer(id, MORCEAUX[id]?.morceau.objets.find((candidat) => candidat.id === objet)?.piece ?? ''));
      expect(cle, `${id} ${objet}`).toBeDefined();
      expect(origine, `${id} ${objet}`).toBeDefined();
      const nom = textes.noms[cle?.nom ?? '']?.texte.split(/[\s’']+/)[0]?.toLocaleLowerCase('fr') ?? '';
      expect(nom, `${id} ${objet}`).not.toBe('');
      for (const description of textes.descriptions[origine?.nom ?? ''] ?? []) expect(description.toLocaleLowerCase('fr'), `${id} ${objet} : ${description}`).not.toContain(nom);
    }
  });
});

// Réserve de documents (spec 2026-10-18 §8.4, §8.5, §11, #209) : `check:texts` rend chaque document par `rendreDocument`, sans
// station de référence, et contrôle sa structure, ses trous, sa couche, sa longueur, ses chiffres et le nom de sa puce.

function commun(id: string): TexteDocument {
  const texte = DOCUMENTS[id];
  if (texte === undefined) throw new Error(`Document commun ${id} absent.`);
  return texte;
}

/** La réserve réelle, avec un texte commun modifié. */
function avecCommun(id: string, modification: Partial<TexteDocument>): SourcesReserve {
  return { ...SOURCES_RESERVE, communs: { ...DOCUMENTS, [id]: { ...commun(id), ...modification } } };
}

/** La réserve réelle, avec un texte de document du morceau `morceau` modifié. */
function avecDuMorceau(morceau: string, id: string, modification: Partial<TexteDocument>): SourcesReserve {
  const entree = MORCEAUX[morceau];
  const texte = entree?.textes.documents?.[id];
  if (entree === undefined || texte === undefined) throw new Error(`Document ${id} du morceau ${morceau} absent.`);
  const documents = { ...entree.textes.documents, [id]: { ...texte, ...modification } };
  return { ...SOURCES_RESERVE, morceaux: { ...MORCEAUX, [morceau]: { ...entree, textes: { ...entree.textes, documents } } } };
}

function avecEmplacement(id: string, remplacement: EmplacementDocument | null): SourcesReserve {
  return { ...SOURCES_RESERVE, emplacements: EMPLACEMENTS_DOCUMENTS.flatMap((emplacement) => (emplacement.id !== id ? [emplacement] : remplacement === null ? [] : [remplacement])) };
}

const puce = (texte: string) => ({ texte, genre: 'f', nombre: 's', elision: false }) as const;

describe('réserve de documents : structure (spec §8.4)', () => {
  it('toute la réserve réelle est propre : rendue sans erreur, sans trou restant', () => {
    expect(controlerReserve()).toEqual([]);
  });

  it('une place sans texte, un texte sans place, un texte défini deux fois font échouer le contrôle', () => {
    expect(controlerReserve({ ...SOURCES_RESERVE, emplacements: [...EMPLACEMENTS_DOCUMENTS, { id: 'doc_fantome', couche: 'univers', etiquettes: ['eau'] }] })).toContain('document doc_fantome : place sans texte.');
    expect(controlerReserve({ ...SOURCES_RESERVE, communs: { ...DOCUMENTS, doc_orphelin: commun('doc_carte_postale') } })).toContain('document doc_orphelin : texte sans place.');
    expect(controlerReserve(avecEmplacement('doc_carte_postale', null))).toContain('document doc_carte_postale : texte sans place.');
    expect(controlerReserve({ ...SOURCES_RESERVE, communs: { ...DOCUMENTS, doc_note_yann: commun('doc_carte_postale') } })).toContain('document doc_note_yann : texte défini deux fois.');
  });

  it('une note de rangement est une note manuscrite : tout autre support est refusé', () => {
    expect(controlerReserve(avecCommun('doc_papier_plie', { support: 'message' }))).toContain('document doc_papier_plie : note de rangement qui n’est pas une note manuscrite (support « message »).');
    expect(controlerReserve(avecDuMorceau('m-01', 'doc_note_scotchee', { support: 'journal' }))).toContain(
      'document doc_note_scotchee : note de rangement qui n’est pas une note manuscrite (support « journal »).',
    );
    // Les autres couches gardent leurs supports.
    expect(controlerReserve(avecCommun('doc_carte_postale', { support: 'message' })).filter((erreur) => erreur.includes('note manuscrite'))).toEqual([]);
  });

  it('une note de rangement a une clé, et un morceau sauf la trousse ; une clé inconnue du morceau est refusée', () => {
    expect(controlerReserve(avecEmplacement('doc_note_scotchee', { id: 'doc_note_scotchee', couche: 'rangement', morceau: 'm-01' }))).toContain('document doc_note_scotchee : note de rangement sans clé.');
    expect(controlerReserve(avecEmplacement('doc_papier_plie', { id: 'doc_papier_plie', couche: 'rangement' }))).toContain('document doc_papier_plie : note de rangement sans clé.');
    expect(controlerReserve(avecEmplacement('doc_bout_carton', { id: 'doc_bout_carton', couche: 'rangement', cle: 'o-caisse' }))).toContain('document doc_bout_carton : note de rangement sans morceau.');
    expect(controlerReserve(avecEmplacement('doc_note_scotchee', { id: 'doc_note_scotchee', couche: 'rangement', morceau: 'm-01', cle: 'o-inconnue' }))).toContain(
      'document doc_note_scotchee : clé « o-inconnue » inconnue du morceau m-01.',
    );
    expect(controlerReserve(avecEmplacement('doc_note_yann', { id: 'doc_note_yann', couche: 'morceau' }))).toContain('document doc_note_yann : document de morceau sans morceau.');
  });

  it('une entrée de journal sans « hh:mm  texte » fait échouer le rendu', () => {
    const erreurs = controlerReserve(avecCommun('doc_journal_maintenance', { corps: ['06:00 Prise de quart.'] }));
    expect(erreurs.some((erreur) => erreur.startsWith('document doc_journal_maintenance, rendu : ') && erreur.includes('entrée de journal sans « hh:mm  texte »'))).toBe(true);
  });
});

describe('réserve de documents : trous (spec §8.5)', () => {
  const INTERDIT = 'trou interdit : le seul trou est la pièce, dans le corps d’une note de rangement.';

  it('un trou dans un document hors d’une note de rangement est une erreur, dans le corps comme ailleurs', () => {
    expect(controlerReserve(avecCommun('doc_carte_postale', { corps: ['Agathe, je suis {a:piece}.'] }))).toContain(`document doc_carte_postale, corps [0] : ${INTERDIT}`);
    expect(controlerReserve(avecCommun('doc_journal_sanitaire', { corps: ['08:12  Rendez-vous {le:piece}.'] }))).toContain(`document doc_journal_sanitaire, corps [0] : ${INTERDIT}`);
    expect(controlerReserve(avecDuMorceau('m-01', 'doc_note_yann', { corps: ['Voyez {le:piece}.'] }))).toContain(`document doc_note_yann, corps [0] : ${INTERDIT}`);
  });

  it('un trou dans la puce, la ligne « où » ou la signature d’une note de rangement est une erreur ; dans son corps, le trou de la pièce est permis', () => {
    expect(controlerReserve(avecCommun('doc_papier_plie', { ou: 'glissée {a:piece}' }))).toContain(`document doc_papier_plie, ligne « où » : ${INTERDIT}`);
    expect(controlerReserve(avecCommun('doc_papier_plie', { signature: 'Odile, {de:piece}' }))).toContain(`document doc_papier_plie, signature : ${INTERDIT}`);
    expect(controlerReserve(avecCommun('doc_papier_plie', { puce: puce('papier {le:piece}') }))).toContain(`document doc_papier_plie, puce : ${INTERDIT}`);
    expect(controlerReserve(avecCommun('doc_papier_plie', { corps: ['{Le:piece} est ouvert.', 'La trousse est {a:piece}.', 'Le sas {de:piece} est ouvert.'] }))).toEqual([]);
  });

  it('un autre trou que la pièce, ou une forme autre que « le », « de » et « a », fait échouer le rendu d’une note de rangement', () => {
    for (const trou of ['{le:objet}', '{un:piece}', '{nom:piece}', 'la {piece}']) {
      const erreurs = controlerReserve(avecCommun('doc_papier_plie', { corps: [`Prenez la trousse ${trou}.`] }));
      expect(erreurs.some((erreur) => erreur.startsWith('document doc_papier_plie, rendu avec ')), trou).toBe(true);
    }
  });
});

describe('réserve de documents : la note de rangement nomme sa pièce (spec §8.4)', () => {
  const SANS_PIECE = 'note de rangement qui ne nomme pas la pièce.';

  it('une note de rangement sans trou {le|de|a:piece} dans son corps ne dit pas où est la clé : erreur', () => {
    expect(controlerReserve(avecCommun('doc_papier_plie', { corps: ['J’ai mis une trousse de soin de côté.', 'Prenez-la sans scrupule.'] }))).toContain(`document doc_papier_plie : ${SANS_PIECE}`);
    expect(controlerReserve(avecDuMorceau('m-01', 'doc_note_scotchee', { corps: ['J’ai emporté le bidon d’eau pour le remplir.'] }))).toContain(`document doc_note_scotchee : ${SANS_PIECE}`);
  });

  it('une forme à majuscule ou « de » suffit ; un autre document n’a pas à nommer de pièce', () => {
    expect(controlerReserve(avecCommun('doc_papier_plie', { corps: ['{Le:piece} garde une trousse.'] }))).toEqual([]);
    expect(controlerReserve(avecCommun('doc_papier_plie', { corps: ['La porte {de:piece} est lourde.'] }))).toEqual([]);
    expect(controlerReserve(avecCommun('doc_carte_postale', { corps: ['Rien à dire.'] }))).toEqual([]);
  });
});

describe('réserve de documents : un conflit de clé est une ligne d’erreur', () => {
  it('la puce d’un document qui reprend la clé d’un nom du catalogue avec un autre texte donne une erreur, pas une exception', () => {
    const sources: SourcesReserve = {
      ...SOURCES_RESERVE,
      emplacements: [...EMPLACEMENTS_DOCUMENTS, { id: 'cat_consigne', couche: 'univers', etiquettes: ['eau'] }],
      communs: { ...DOCUMENTS, cat_consigne: commun('doc_carte_postale') },
    };
    const erreurs = controlerReserve(sources);
    expect(erreurs).toContainEqual(expect.stringMatching(/^document cat_consigne, réunion des textes : .*cat_consigne.* défini deux fois/));
  });
});

describe('réserve de documents : couverture du rendu', () => {
  const rendus = rendusDeLaReserve();
  const etiquettesDe = ({ cle, morceau }: EmplacementDocument): readonly string[] | undefined =>
    cle === CLE_TROUSSE ? ['butin'] : MORCEAUX[morceau ?? '']?.morceau.grande?.cles?.[cle ?? '']?.etiquettes;

  it('piecesPour : les pièces du catalogue qui portent une des étiquettes', () => {
    expect(piecesPour(['butin']).map(({ nom }) => nom.texte)).toEqual(expect.arrayContaining(['consigne', 'infirmerie', 'laboratoire']));
    expect(piecesPour(['butin']).map(({ cle }) => cle)).toContain('cat_consigne');
    expect(piecesPour(['étiquette inconnue'])).toEqual([]);
  });

  it('la note de la trousse se rend avec la consigne, nommée puis lettrée', () => {
    const pieces = rendus.get('doc_papier_plie')?.map(({ piece }) => piece);
    expect(pieces).toEqual(expect.arrayContaining(['consigne', 'consigne B']));
  });

  it('chaque document est rendu ; une note de rangement avec chaque pièce où sa clé peut aller, sous son nom puis lettrée', () => {
    expect([...rendus.keys()].sort()).toEqual(EMPLACEMENTS_DOCUMENTS.map(({ id }) => id).sort());
    for (const emplacement of EMPLACEMENTS_DOCUMENTS) {
      const pieces = rendus.get(emplacement.id)?.map(({ piece }) => piece);
      if (emplacement.couche !== 'rangement') {
        expect(pieces, emplacement.id).toEqual([undefined]);
        continue;
      }
      const etiquettes = etiquettesDe(emplacement);
      expect(etiquettes, emplacement.id).toBeDefined();
      const attendues = piecesPour(etiquettes ?? []).flatMap(({ nom }) => [nom.texte, `${nom.texte} B`]);
      expect(attendues.length, emplacement.id).toBeGreaterThanOrEqual(2);
      expect(pieces, emplacement.id).toEqual(attendues);
    }
  });
});

describe('réserve de documents : couches et mots réservés (spec §8.4)', () => {
  it('l’univers ne dit ni mot de la menace ni mot de trace, partout dans le document, puce comprise', () => {
    expect(controlerReserve(avecCommun('doc_carte_postale', { corps: ['La créature dort.'] }))).toContain('document doc_carte_postale, corps [0] : « créature », mot de la menace.');
    expect(controlerReserve(avecCommun('doc_affiche_eau', { ou: 'collée sur une tache de sang' }))).toContain('document doc_affiche_eau, ligne « où » : « sang », mot réservé aux traces.');
    expect(controlerReserve(avecCommun('doc_note_punaisee', { signature: 'Bastien, lacéré' }))).toContain('document doc_note_punaisee, signature : « lacéré », mot réservé aux traces.');
    expect(controlerReserve(avecCommun('doc_mot_odile', { puce: puce('mot gueule') }))).toContain('document doc_mot_odile, puce : « gueule », mot de la menace.');
  });

  it('l’univers peut dire « station » ; la menace peut dire « créature » et une trace, mais jamais « station »', () => {
    expect(controlerReserve(avecCommun('doc_note_punaisee', { corps: ['La station ferme à minuit.'] }))).toEqual([]);
    expect(controlerReserve(avecCommun('doc_note_bastien', { corps: ['La créature griffe la porte, du sang sur le sol.'] }))).toEqual([]);
    expect(controlerReserve(avecCommun('doc_note_bastien', { corps: ['Toute la station dort.'] }))).toContain('document doc_note_bastien, corps [0] : « station », mot de l’univers.');
    expect(controlerReserve(avecCommun('doc_mot_remi', { signature: 'Nadia, de la Station' }))).toContain('document doc_mot_remi, signature : « Station », mot de l’univers.');
  });

  it('un morceau ou une note de rangement ne dit aucun mot réservé', () => {
    expect(controlerReserve(avecDuMorceau('m-01', 'doc_note_yann', { corps: ['La station brûle.'] }))).toContain('document doc_note_yann, corps [0] : « station », mot de l’univers.');
    expect(controlerReserve(avecDuMorceau('m-01', 'doc_note_yann', { corps: ['La créature est passée.'] }))).toContain('document doc_note_yann, corps [0] : « créature », mot de la menace.');
    expect(controlerReserve(avecDuMorceau('m-01', 'doc_note_scotchee', { corps: ['Une traînée mène {a:piece}.'] }))).toContain('document doc_note_scotchee, corps [0] : « traînée », mot réservé aux traces.');
    expect(controlerReserve(avecCommun('doc_papier_plie', { corps: ['La station a une trousse {a:piece}.'] }))).toContain('document doc_papier_plie, corps [0] : « station », mot de l’univers.');
  });
});

describe('réserve de documents : longueur (spec §8.4)', () => {
  const phrases = (nombre: number): string[] => Array.from({ length: nombre }, (_, rang) => `Phrase ${String.fromCharCode(97 + rang)}.`);

  it('une à cinq phrases, comptées sur le corps : six, ou aucune, font échouer le contrôle', () => {
    expect(controlerReserve(avecCommun('doc_carte_postale', { corps: phrases(5) }))).toEqual([]);
    expect(controlerReserve(avecCommun('doc_carte_postale', { corps: phrases(6) }))).toContain('document doc_carte_postale : 6 phrase(s), une à cinq attendues.');
    expect(controlerReserve(avecCommun('doc_carte_postale', { corps: ['Une. Deux. Trois.', 'Quatre. Cinq. Six.'] }))).toContain('document doc_carte_postale : 6 phrase(s), une à cinq attendues.');
    expect(controlerReserve(avecCommun('doc_carte_postale', { corps: [] }))).toContain('document doc_carte_postale : 0 phrase(s), une à cinq attendues.');
  });

  it('les didascalies d’un message ne comptent pas', () => {
    const corps = ['[Un rire. Un silence. Un soupir.] Allô ? Oui. Non. Peut-être. Bien. [Une porte. Un pas.]'];
    expect(controlerReserve(avecCommun('doc_message_wen', { corps }))).toEqual([]);
    expect(controlerReserve(avecCommun('doc_message_wen', { corps: [...corps, 'Et puis. Voilà.'] }))).toContain('document doc_message_wen : 7 phrase(s), une à cinq attendues.');
  });

  it('un journal : une à cinq lignes, sans compter ses phrases', () => {
    const ligne = '08:12  Une. Deux. Trois.';
    expect(controlerReserve(avecCommun('doc_journal_maintenance', { corps: Array<string>(5).fill(ligne) }))).toEqual([]);
    expect(controlerReserve(avecCommun('doc_journal_maintenance', { corps: Array<string>(6).fill(ligne) }))).toContain('document doc_journal_maintenance : 6 ligne(s) de journal, une à cinq attendues.');
    expect(controlerReserve(avecCommun('doc_journal_maintenance', { corps: [] }))).toContain('document doc_journal_maintenance : 0 ligne(s) de journal, une à cinq attendues.');
  });
});

describe('réserve de documents : chiffres (C-04 §4.3, D-300)', () => {
  it('aucun chiffre dans la puce, la ligne « où » ni la signature', () => {
    expect(controlerReserve(avecCommun('doc_mot_odile', { puce: puce('mot n° 2') }))).toContain('document doc_mot_odile, puce : chiffre ou pourcentage dans « mot n° 2 » (C-04 §4.3).');
    expect(controlerReserve(avecCommun('doc_affiche_eau', { ou: 'collée au-dessus du robinet 3' }))).toContain('document doc_affiche_eau, ligne « où » : chiffre ou pourcentage dans « collée au-dessus du robinet 3 » (C-04 §4.3).');
    expect(controlerReserve(avecCommun('doc_mot_remi', { signature: 'Nadia 2' }))).toContain('document doc_mot_remi, signature : chiffre ou pourcentage dans « Nadia 2 » (C-04 §4.3).');
  });

  it('le corps en a le droit : heures, températures, codes', () => {
    expect(controlerReserve(avecCommun('doc_note_punaisee', { corps: ['Rendez-vous à 12:30, code 4471, −18 °C, 100 % sûr.'] }))).toEqual([]);
  });
});

describe('réserve de documents : noms de puce distincts (bible §6)', () => {
  it('deux documents ne portent jamais le même nom de puce, casse ignorée', () => {
    expect(controlerReserve(avecCommun('doc_mot_odile', { puce: puce('Carte Postale') }))).toContain('document doc_mot_odile : nom de puce « Carte Postale » déjà celui du document doc_carte_postale.');
  });

  it('une puce ne reprend le nom d’aucune pièce ni d’aucun objet : morceaux, catalogue, univers', () => {
    const autre = 'déjà celui d’une pièce ou d’un objet.';
    expect(controlerReserve(avecCommun('doc_mot_odile', { puce: puce('Palier') }))).toContain(`document doc_mot_odile : nom de puce « Palier » ${autre}`);
    expect(controlerReserve(avecCommun('doc_mot_odile', { puce: puce('consigne') }))).toContain(`document doc_mot_odile : nom de puce « consigne » ${autre}`);
    expect(controlerReserve(avecCommun('doc_mot_odile', { puce: puce('capsule de secours') }))).toContain(`document doc_mot_odile : nom de puce « capsule de secours » ${autre}`);
  });
});

describe('phrases de pillage, de trace et de bruit de station (spec §5.4, §5.5, §6.6)', () => {
  it('les phrases réelles sont propres', () => {
    expect(controlerPhrases()).toEqual([]);
  });

  it('un pillage ne dit ni mot de la menace ni mot de trace', () => {
    const rang = PHRASES_REELLES.pillages.length;
    const pillages = [...PHRASES_REELLES.pillages, 'Une griffure sur le tiroir.', 'Du sang sur l’étagère.'];
    expect(controlerPhrases({ ...PHRASES_REELLES, pillages })).toEqual([`pillages [${rang}] : « griffure », mot de la menace.`, `pillages [${rang + 1}] : « sang », mot réservé aux traces.`]);
  });

  it('une trace ne dit jamais « station » ; elle peut dire une trace', () => {
    const traces = { legere: ['Du sang sur le mur.'], forte: ['Une odeur de station.'] };
    expect(controlerPhrases({ ...PHRASES_REELLES, traces })).toEqual(['traces.forte [0] : « station », mot de l’univers.']);
  });

  it('un bruit de station ne dit ni mot de la menace ni mot de trace', () => {
    expect(controlerPhrases({ ...PHRASES_REELLES, bruits: ['La créature approche.', 'Du sang goutte.'] })).toEqual([
      'bruits de station [0] : « créature », mot de la menace.',
      'bruits de station [1] : « sang », mot réservé aux traces.',
    ]);
  });

  it('chaque phrase est sans trou, non vide, et de une à quatre phrases', () => {
    const erreurs = controlerPhrases({
      pillages: ['Quelqu’un a pris {le:objet}.', ' ', 'Une. Deux. Trois. Quatre. Cinq.', 'Une. Deux. Trois. Quatre.'],
      traces: { legere: [], forte: ['Une trace.'] },
      bruits: [],
    });
    expect(erreurs).toEqual([
      'pillages [0] : rôle inconnu « objet ».',
      'pillages [1] : texte vide.',
      'pillages [2] : 5 phrase(s), une à quatre attendues.',
      'traces.legere : aucun texte (NP-01).',
      'bruits de station : aucun texte (NP-01).',
    ]);
  });
});

describe('contrôles sans station du lot 1 (couches, traces, documents, phrases)', () => {
  it('rendent leur compte, sans erreur, avec une ligne par contrôle', () => {
    const { lignes, erreurs } = controlerTextesCommuns();
    expect(erreurs).toBe(0);
    const dites = lignes.map(({ texte }) => texte);
    expect(dites).toContain('couches : aucun mot de l’univers ni de la menace dans le socle et les morceaux.');
    expect(dites).toContain('couches : l’univers sans mot de la menace ni des traces, la menace sans « station ».');
    expect(dites).toContain('documents : toute la réserve rendue sans station ; structure, trous, couches, longueur, chiffres et puces sûrs.');
    expect(dites).toContain('phrases : pillages, traces et bruits de station sûrs.');
    expect(lignes.every(({ niveau }) => niveau === 'log')).toBe(true);
  });
});

describe('grandes stations explorées par check:texts (spec §11, #209)', () => {
  const ID_GRANDE = /^(g\d+-.+)-(\d+)$/;
  const cleDeplacee = (id: string): boolean => {
    const entree = entreeAControler(CATALOGUE, id)[1];
    if ('refus' in entree) return false;
    return entree.monde.objets.some((objet) => objet.document === true && objet.designe !== undefined && EMPLACEMENTS_DOCUMENTS.find((emplacement) => emplacement.id === objet.nom)?.cle !== CLE_TROUSSE);
  };

  it('trois grandes stations publiées : une chaîne, une en ordre libre, une avec une clé déplacée ; les mêmes à chaque appel', () => {
    const grandes = grandesAControler(CATALOGUE);
    expect(grandes).toHaveLength(3);
    expect(new Set(grandes).size).toBe(3);
    for (const id of grandes) expect(CATALOGUE.publiees, id).toContain(id);
    const forme = (id: string): string | undefined => CATALOGUE.grandes.find((composition) => composition.id === ID_GRANDE.exec(id)?.[1])?.forme;
    expect(forme(grandes[0] ?? '')).toBe('chaine');
    expect(forme(grandes[1] ?? '')).toBe('libre');
    expect(cleDeplacee(grandes[2] ?? '')).toBe(true);
    expect(grandesAControler(CATALOGUE)).toEqual(grandes);
  });

  it('une station dont la publication est périmée est sautée, où qu’elle soit dans la liste : le choix est celui de la liste d’origine', () => {
    // Une graine hors de la plage se construit en refus : la composition existe, la station non, comme après un changement de plan.
    const perimee = (forme: 'chaine' | 'libre'): string => {
      const composition = CATALOGUE.grandes.find((candidate) => candidate.refus === null && candidate.forme === forme);
      if (composition === undefined) throw new Error(`Aucune grande composition en ${forme}.`);
      return `${composition.id}-${GRAINE_GRANDE_MAX + 1}`;
    };
    const [chaine, libre] = [perimee('chaine'), perimee('libre')];
    for (const id of [chaine, libre]) expect('refus' in entreeAControler(CATALOGUE, id)[1], id).toBe(true);
    const choix = grandesAControler(CATALOGUE);
    for (const publiees of [[chaine, libre, ...CATALOGUE.publiees], [...CATALOGUE.publiees, chaine, libre], [libre, ...CATALOGUE.publiees, chaine]]) {
      expect(grandesAControler({ ...CATALOGUE, publiees })).toEqual(choix);
    }
  });

  it('chaque grande station choisie se construit sous son identifiant, porte un document et passe l’exploration de check:texts, à sa borne', EXHAUSTIF, () => {
    for (const id of grandesAControler(CATALOGUE)) {
      const [identifiant, entree] = entreeAControler(CATALOGUE, id);
      if ('refus' in entree) throw new Error(`${id} : ${entree.refus}`);
      expect(identifiant).toBe(id);
      expect(entree.monde.id).toBe(id);
      expect(entree.monde.objets.some((objet) => objet.document === true), id).toBe(true);
      expect(borneDe(entree)).toBe(MAX_ETATS_GRANDE);
      const compte = controlerEntree(identifiant, entree);
      expect(compte.lignes.filter(({ niveau }) => niveau === 'error'), id).toEqual([]);
      expect(compte.lignes).toContainEqual({ niveau: 'log', texte: `${id} : textes complets, trous sûrs, aucun identifiant affiché.` });
      expect(compte.lignes.some(({ texte }) => texte.includes(`borne de ${MAX_ETATS_GRANDE} états atteinte`)), id).toBe(true);
    }
    expect(borneDe(ENTREE)).toBe(MAX_ETATS_MONDE_TEST);
    expect(borneDe(AR01)).toBe(MAX_ETATS);
  });
});

describe('documents dans l’exploration d’une station (spec §8.4, C-04 §4.3)', () => {
  const NOTE: TexteDocument = { puce: puce('note de bord'), support: 'note', ou: 'scotchée au montant d’une couchette', corps: ['Code 4471, relève à 12:30, −18 °C.'], signature: 'Léa' };
  const OBJET = { id: 'objet-note', nom: 'note_test', piece: 'piece-cabine', portable: false, document: true } as const;

  /** Le monde de test avec un document dans la cabine, où l'on se réveille : le regarder est une des premières consultations explorées. */
  function avecDocument(document: TexteDocument = NOTE): EntreeMonde {
    return {
      ...ENTREE,
      monde: { ...ENTREE.monde, objets: [...ENTREE.monde.objets, OBJET] },
      textes: { ...ENTREE.textes, noms: { ...ENTREE.textes.noms, note_test: document.puce }, documents: { ...ENTREE.textes.documents, note_test: document } },
    };
  }

  it('un document n’a pas de description, et le corps peut porter des chiffres', () => {
    expect(controlerTextes(avecDocument(), 'controle-textes', 300).erreurs).toEqual([]);
  });

  it('un document sans texte fait échouer la structure', () => {
    const entree = { ...avecDocument(), textes: { ...ENTREE.textes, noms: { ...ENTREE.textes.noms, note_test: NOTE.puce } } };
    expect(verifierTextes(entree)).toContain('document « note_test » : aucun texte (NP-01).');
  });

  it('un chiffre dans la ligne « où » ou dans la puce fait échouer l’exploration, jamais celui du corps', () => {
    const ou = controlerTextes(avecDocument({ ...NOTE, ou: 'scotchée à la couchette 3' }), 'controle-textes', 300).erreurs;
    expect(ou).toContain('document note_test, ligne « où » : chiffre ou pourcentage dans « scotchée à la couchette 3 » (C-04 §4.3).');
    const nom = controlerTextes(avecDocument({ ...NOTE, puce: puce('note n° 4') }), 'controle-textes', 300).erreurs;
    expect(nom).toContain('document note_test, puce : chiffre ou pourcentage dans « note n° 4 » (C-04 §4.3).');
    expect(ou.filter((erreur) => erreur.includes('4471'))).toEqual([]);
  });
});
