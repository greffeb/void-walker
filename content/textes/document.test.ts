import type { Consultation, RefObjet, RefPiece } from '../../engine';
import { reunir } from './couches';
import { rendreDocument } from './document';
import { ErreurTexte } from './gabarit';
import { nomDe, rendreConsultation } from './rendu';
import type { Nom, SupportDocument, TexteDocument, TextesMonde, TextesMorceau } from './types';

// Rendu structuré d'un document (spec 2026-10-18 §8.5) : une fiche commune à l'appli et à la CLI. Les documents ci-dessous sont
// des fixtures de test, un par support et une note de rangement ; la vraie réserve s'écrit ailleurs.

const nom = (texte: string, genre: Nom['genre'] = 'm', elision = false): Nom => ({ texte, genre, nombre: 's', elision });

const NOTE: TexteDocument = {
  puce: nom('mot de Malik'),
  support: 'note',
  ou: 'scotchée au montant d’une couchette',
  corps: ['Je ne dors plus.', 'Si quelqu’un lit ceci, ne comptez pas sur la lumière.'],
  signature: 'Malik',
};
const JOURNAL: TexteDocument = {
  puce: nom('terminal de quart'),
  support: 'journal',
  ou: 'resté allumé sur un pupitre',
  corps: ['02:14  Sas arrière : pression nominale.', '02:31  Sas arrière : porte forcée, côté intérieur.', '03:05  Alimentation secondaire coupée.'],
};
const MESSAGE: TexteDocument = {
  puce: nom('enregistreur', 'm', true),
  support: 'message',
  ou: 'posé sur une tablette, sa diode clignote',
  corps: ['Allô ? [souffle court] Vous m’entendez ?', '[grésillement] Je suis dans le noir.', '[long silence]'],
};
const INSCRIPTION: TexteDocument = {
  puce: nom('inscription', 'f', true),
  support: 'inscription',
  ou: 'tracée à la main sur la cloison',
  corps: ['NE RESTEZ PAS LÀ.'],
};
const AFFICHE: TexteDocument = {
  puce: nom('affiche', 'f', true),
  support: 'affiche',
  ou: 'collée près du sas',
  corps: ['En cas d’alerte, rejoignez votre capsule.', 'Gardez votre calme.'],
};
const RANGEMENT: TexteDocument = {
  puce: nom('mot de Léa'),
  support: 'note',
  ou: 'glissée sous une patte de rangement',
  corps: ['J’ai rangé la planche dans {le:piece}.', 'La porte {de:piece} est lourde : poussez fort.', 'Rejoignez-moi {a:piece}.'],
  signature: 'Léa',
};

const documents = { note_malik: NOTE, journal_quart: JOURNAL, message_enregistreur: MESSAGE, inscription: INSCRIPTION, affiche: AFFICHE, mot_lea: RANGEMENT };
const MORCEAU: TextesMorceau = {
  noms: { coursive_a: nom('coursive A', 'f'), coursive_b: nom('coursive B', 'f'), atelier: nom('atelier', 'm', true) },
  descriptions: {},
  assistance: {},
  documents,
};
const TEXTES = reunir([MORCEAU]);

const objet = (id: string): RefObjet => ({ sorte: 'objet', id: `e${id}`, nom: id });
const piece = (id: string): RefPiece => ({ sorte: 'piece', id: `e${id}`, nom: id });
const regard = (id: string, designe?: string): Extract<Consultation, { type: 'regarder_document' }> => ({
  type: 'regarder_document',
  cible: objet(id),
  ...(designe === undefined ? {} : { designe: piece(designe) }),
});
const avec = (id: string, document: TexteDocument): TextesMonde => reunir([{ ...MORCEAU, documents: { [id]: document } }]);

describe('étiquette du support (spec 2026-10-18 §8.4)', () => {
  it.each<[string, SupportDocument, string]>([
    ['note_malik', 'note', 'Note manuscrite'],
    ['journal_quart', 'journal', 'Journal de terminal'],
    ['message_enregistreur', 'message', 'Message enregistré'],
    ['inscription', 'inscription', 'Inscription'],
    ['affiche', 'affiche', 'Affiche de la compagnie'],
  ])('%s : support %s, étiquette « %s »', (id, support, libelle) => {
    const rendu = rendreDocument(TEXTES, regard(id));
    expect(rendu.support).toBe(support);
    expect(rendu.libelleSupport).toBe(libelle);
  });

  it('tout jeu de textes porte les cinq étiquettes, même sans document', () => {
    expect(Object.keys(reunir([]).supports).sort()).toEqual(['affiche', 'inscription', 'journal', 'message', 'note']);
  });
});

describe('journal de terminal : une ligne par entrée, son heure à part', () => {
  const rendu = rendreDocument(TEXTES, regard('journal_quart'));

  it('chaque entrée garde son heure et son texte, sans les deux espaces', () => {
    expect(rendu.corps).toEqual([
      { heure: '02:14', texte: 'Sas arrière : pression nominale.' },
      { heure: '02:31', texte: 'Sas arrière : porte forcée, côté intérieur.' },
      { heure: '03:05', texte: 'Alimentation secondaire coupée.' },
    ]);
  });

  it('la ligne « où » est rendue telle quelle', () => {
    expect(rendu.ou).toBe('resté allumé sur un pupitre');
  });

  it('une entrée sans heure lève une erreur', () => {
    const textes = avec('journal_quart', { ...JOURNAL, corps: ['Sas arrière : pression nominale.'] });
    expect(() => rendreDocument(textes, regard('journal_quart'))).toThrow(ErreurTexte);
  });

  it('une heure suivie d’une seule espace lève une erreur', () => {
    const textes = avec('journal_quart', { ...JOURNAL, corps: ['02:14 Sas arrière.'] });
    expect(() => rendreDocument(textes, regard('journal_quart'))).toThrow(ErreurTexte);
  });
});

describe('message enregistré : les didascalies entre crochets sont des segments à part', () => {
  const rendu = rendreDocument(TEXTES, regard('message_enregistreur'));

  it('la parole et la didascalie se séparent, la didascalie garde ses crochets', () => {
    expect(rendu.corps).toEqual([
      { texte: 'Allô ?' },
      { texte: '[souffle court]', didascalie: true },
      { texte: 'Vous m’entendez ?' },
      { texte: '[grésillement]', didascalie: true },
      { texte: 'Je suis dans le noir.' },
      { texte: '[long silence]', didascalie: true },
    ]);
  });

  it('seul un message sépare ses didascalies : des crochets dans une note restent dans le texte', () => {
    const textes = avec('note_malik', { ...NOTE, corps: ['Il a dit [je crois] de rester.'] });
    expect(rendreDocument(textes, regard('note_malik')).corps).toEqual([{ texte: 'Il a dit [je crois] de rester.' }]);
  });
});

describe('note, inscription et affiche : un paragraphe par ligne du corps', () => {
  it('une note rend ses paragraphes et la signature de son auteur', () => {
    const rendu = rendreDocument(TEXTES, regard('note_malik'));
    expect(rendu.corps).toEqual([{ texte: 'Je ne dors plus.' }, { texte: 'Si quelqu’un lit ceci, ne comptez pas sur la lumière.' }]);
    expect(rendu.signature).toBe('Malik');
    expect(rendu.ou).toBe('scotchée au montant d’une couchette');
  });

  it('une inscription ou une affiche n’ont ni signature ni pièce', () => {
    for (const id of ['inscription', 'affiche']) {
      const rendu = rendreDocument(TEXTES, regard(id));
      expect(rendu).not.toHaveProperty('signature');
      expect(rendu).not.toHaveProperty('piece');
    }
    expect(rendreDocument(TEXTES, regard('affiche')).corps).toEqual([{ texte: 'En cas d’alerte, rejoignez votre capsule.' }, { texte: 'Gardez votre calme.' }]);
  });
});

describe('note de rangement : le trou {…:piece} prend la pièce désignée', () => {
  it('remplit le, de et a avec la pièce, lettre comprise', () => {
    const rendu = rendreDocument(TEXTES, regard('mot_lea', 'coursive_b'));
    expect(rendu.corps.map(({ texte }) => texte)).toEqual([
      'J’ai rangé la planche dans la coursive B.',
      'La porte de la coursive B est lourde : poussez fort.',
      'Rejoignez-moi à la coursive B.',
    ]);
    expect(rendu.piece).toBe('coursive B');
  });

  it('une pièce à élision s’accorde : l’atelier, de l’atelier, à l’atelier', () => {
    const rendu = rendreDocument(TEXTES, regard('mot_lea', 'atelier'));
    expect(rendu.corps.map(({ texte }) => texte)).toEqual(['J’ai rangé la planche dans l’atelier.', 'La porte de l’atelier est lourde : poussez fort.', 'Rejoignez-moi à l’atelier.']);
    expect(rendu.piece).toBe('atelier');
  });

  it('une même note nomme une autre pièce quand l’assemblage en désigne une autre', () => {
    const a = rendreDocument(TEXTES, regard('mot_lea', 'coursive_a'));
    const b = rendreDocument(TEXTES, regard('mot_lea', 'coursive_b'));
    expect([a.piece, b.piece]).toEqual(['coursive A', 'coursive B']);
  });

  it('le trou se remplit aussi dans la ligne « où » et dans la signature', () => {
    const textes = avec('mot_lea', { ...RANGEMENT, ou: 'glissée dans {le:piece}', signature: 'Léa, {de:piece}' });
    const rendu = rendreDocument(textes, regard('mot_lea', 'coursive_a'));
    expect([rendu.ou, rendu.signature]).toEqual(['glissée dans la coursive A', 'Léa, de la coursive A']);
  });

  it('un trou sans pièce désignée lève une erreur', () => {
    expect(() => rendreDocument(TEXTES, regard('mot_lea'))).toThrow(ErreurTexte);
  });

  it('une pièce désignée sans nom lève une erreur', () => {
    expect(() => rendreDocument(TEXTES, regard('mot_lea', 'inconnue'))).toThrow(ErreurTexte);
  });

  it.each(['{le:objet}', '{le:passage}', '{un:piece}', '{nom:piece}', '{e:piece}'])('un trou %s lève une erreur', (trou) => {
    const textes = avec('mot_lea', { ...RANGEMENT, corps: [`Voyez ${trou}.`] });
    expect(() => rendreDocument(textes, regard('mot_lea', 'coursive_a'))).toThrow(ErreurTexte);
  });

  it('une accolade isolée lève une erreur', () => {
    const textes = avec('mot_lea', { ...RANGEMENT, corps: ['Voyez {la coursive.'] });
    expect(() => rendreDocument(textes, regard('mot_lea', 'coursive_a'))).toThrow(ErreurTexte);
  });

  it('une forme à majuscule est permise : le début d’un paragraphe peut nommer la pièce', () => {
    const textes = avec('mot_lea', { ...RANGEMENT, corps: ['{Le:piece} est froide.'] });
    expect(rendreDocument(textes, regard('mot_lea', 'coursive_a')).corps).toEqual([{ texte: 'La coursive A est froide.' }]);
  });
});

describe('document sans texte', () => {
  it('un document absent de la section lève une erreur', () => {
    expect(() => rendreDocument(TEXTES, regard('document_inconnu'))).toThrow(ErreurTexte);
  });

  it('« toString » ou « constructor » ne sont pas des documents', () => {
    expect(() => rendreDocument(TEXTES, regard('toString'))).toThrow(ErreurTexte);
    expect(() => rendreDocument(TEXTES, regard('constructor'))).toThrow(ErreurTexte);
  });
});

describe('rendreConsultation : la chaîne du lecteur d’écran et de l’historique', () => {
  const cle = { graine: 1, action: 0 };

  it('dit le support, la ligne « où », puis le corps', () => {
    expect(rendreConsultation(TEXTES, regard('affiche'), cle)).toBe('Affiche de la compagnie collée près du sas En cas d’alerte, rejoignez votre capsule. Gardez votre calme.');
  });

  it('un journal dit « hh:mm texte », une entrée après l’autre', () => {
    expect(rendreConsultation(TEXTES, regard('journal_quart'), cle)).toBe(
      'Journal de terminal resté allumé sur un pupitre 02:14 Sas arrière : pression nominale. 02:31 Sas arrière : porte forcée, côté intérieur. 03:05 Alimentation secondaire coupée.',
    );
  });

  it('une note dit sa signature après son corps', () => {
    expect(rendreConsultation(TEXTES, regard('note_malik'), cle)).toBe(
      'Note manuscrite scotchée au montant d’une couchette Je ne dors plus. Si quelqu’un lit ceci, ne comptez pas sur la lumière. Malik',
    );
  });

  it('un message garde ses didascalies entre crochets', () => {
    expect(rendreConsultation(TEXTES, regard('message_enregistreur'), cle)).toContain('Allô ? [souffle court] Vous m’entendez ?');
  });

  it('une note de rangement dit la pièce désignée', () => {
    expect(rendreConsultation(TEXTES, regard('mot_lea', 'coursive_b'), cle)).toContain('J’ai rangé la planche dans la coursive B.');
  });

  it('le texte d’un document ne dépend ni de la graine ni de l’action', () => {
    expect(rendreConsultation(TEXTES, regard('affiche'), { graine: 9, action: 40 })).toBe(rendreConsultation(TEXTES, regard('affiche'), cle));
  });
});

describe('réunion des textes : le nom de puce est le nom du document', () => {
  it('la puce rejoint les noms sous la clé du document : nomDe et le nom affiché la trouvent', () => {
    expect(TEXTES.noms.note_malik).toEqual(NOTE.puce);
    expect(nomDe(TEXTES, objet('journal_quart'))).toEqual(JOURNAL.puce);
    expect(nomDe(TEXTES, objet('message_enregistreur')).elision).toBe(true);
  });

  it('seules les puces des documents s’ajoutent aux noms', () => {
    const sans = reunir([{ noms: MORCEAU.noms, descriptions: {}, assistance: {} }]);
    const ajoutees = Object.keys(TEXTES.noms).filter((cle) => !Object.hasOwn(sans.noms, cle));
    expect(ajoutees.sort()).toEqual(Object.keys(documents).sort());
  });

  it('un jeu de textes sans document a une section vide, et les noms d’objets restent', () => {
    const textes = reunir([{ noms: { atelier: nom('atelier', 'm', true) }, descriptions: {}, assistance: {} }]);
    expect(textes.documents).toEqual({});
    expect(textes.noms.atelier).toEqual(nom('atelier', 'm', true));
  });

  it('une clé de document définie deux fois avec deux textes différents lève l’erreur ordinaire', () => {
    const autre: TextesMorceau = { noms: {}, descriptions: {}, assistance: {}, documents: { note_malik: { ...NOTE, corps: ['Autre texte.'] } } };
    expect(() => reunir([MORCEAU, autre])).toThrow(/défini deux fois/);
  });

  it('une puce qui contredit un nom de même clé lève la même erreur', () => {
    const autre: TextesMorceau = { noms: { note_malik: nom('billet') }, descriptions: {}, assistance: {} };
    expect(() => reunir([MORCEAU, autre])).toThrow(/défini deux fois/);
  });

  it('le même document repris dans deux morceaux avec le même texte est permis', () => {
    expect(() => reunir([MORCEAU, { noms: {}, descriptions: {}, assistance: {}, documents: { note_malik: NOTE } }])).not.toThrow();
  });
});
