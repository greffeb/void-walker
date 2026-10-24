import type { Consultation, Evenement, OptionMenu, RefPassage } from '../../engine';
import { MONDES } from '../index';
import { fuitesDuCatalogue, reunir } from './couches';
import { MOTS_MENACE } from './menace';
import { alertesMenace, libelleOption, rendreConsultation, rendreEvenements, rendreMoment, texteAssistance } from './rendu';

// Une pièce marquée par la piste de la créature (spec 2026-10-18 §5.4) : sa description, puis une phrase de trace de la couche
// menace, la même pendant toute la partie.

const DESCRIPTION = 'Une salle nue. Rien de plus.';
const TEXTES = reunir([{ noms: { salle: { texte: 'salle', genre: 'f', nombre: 's', elision: false } }, descriptions: { salle: [DESCRIPTION] }, assistance: {} }]);
const regard = (trace?: 'legere' | 'forte'): Consultation => ({ type: 'regarder_piece', cible: { sorte: 'piece', id: 'e00000001', nom: 'salle' }, ...(trace === undefined ? {} : { trace }) });

describe('trace d’une pièce (spec 2026-10-18 §5.4)', () => {
  it.each(['legere', 'forte'] as const)('trace %s : la description, puis une phrase de trace de cette intensité', (intensite) => {
    const texte = rendreConsultation(TEXTES, regard(intensite), { graine: 3, action: 0 });
    expect(texte.startsWith(`${DESCRIPTION} `)).toBe(true);
    expect(TEXTES.traces[intensite]).toContain(texte.slice(DESCRIPTION.length + 1));
  });

  it('une pièce sans trace garde sa description seule', () => {
    expect(rendreConsultation(TEXTES, regard(), { graine: 3, action: 0 })).toBe(DESCRIPTION);
  });

  it('même partie, même phrase ; une autre partie peut en tirer une autre', () => {
    const premiere = rendreConsultation(TEXTES, regard('forte'), { graine: 3, action: 0 });
    expect(rendreConsultation(TEXTES, regard('forte'), { graine: 3, action: 9 })).toBe(premiere);
    const autres = new Set(Array.from({ length: 30 }, (_, graine) => rendreConsultation(TEXTES, regard('forte'), { graine, action: 0 })));
    expect(autres.size).toBeGreaterThan(1);
  });

  it('chaque phrase de trace est une phrase entière, sans chiffre ni trou', () => {
    for (const phrase of [...TEXTES.traces.legere, ...TEXTES.traces.forte]) {
      expect(phrase).toMatch(/^[A-ZÀ-Ý].*\.$/u);
      expect(phrase).not.toMatch(/[0-9{}]/);
      expect(phrase.split(/[.!?…]+(?:\s|$)/).filter((morceau) => morceau.trim() !== '')).toHaveLength(1);
    }
  });
});

// Une pièce pillée (spec 2026-10-18 §6.6) : sa description, sa trace s'il y en a une, puis une phrase de pillage de la couche
// univers, la même pendant toute la partie.

const regardPillee = (trace?: 'legere' | 'forte'): Consultation => ({ type: 'regarder_piece', cible: { sorte: 'piece', id: 'e00000001', nom: 'salle' }, pillee: true, ...(trace === undefined ? {} : { trace }) });

describe('pièce pillée (spec 2026-10-18 §6.6)', () => {
  it('sans trace : la description, puis une phrase de pillage', () => {
    const texte = rendreConsultation(TEXTES, regardPillee(), { graine: 3, action: 0 });
    expect(texte.startsWith(`${DESCRIPTION} `)).toBe(true);
    expect(TEXTES.pillages).toContain(texte.slice(DESCRIPTION.length + 1));
  });

  it.each(['legere', 'forte'] as const)('trace %s : la description, la trace, puis le pillage', (intensite) => {
    const texte = rendreConsultation(TEXTES, regardPillee(intensite), { graine: 3, action: 0 });
    expect(texte.startsWith(`${DESCRIPTION} `)).toBe(true);
    const reste = texte.slice(DESCRIPTION.length + 1);
    const trace = TEXTES.traces[intensite].find((phrase) => reste.startsWith(`${phrase} `));
    expect(trace).toBeDefined();
    expect(TEXTES.pillages).toContain(reste.slice((trace?.length ?? 0) + 1));
  });

  it('une pièce non pillée ne dit rien du pillage', () => {
    for (const phrase of TEXTES.pillages) expect(rendreConsultation(TEXTES, regard('forte'), { graine: 3, action: 0 })).not.toContain(phrase);
    expect(rendreConsultation(TEXTES, regard(), { graine: 3, action: 0 })).toBe(DESCRIPTION);
  });

  it('même partie, même phrase de pillage ; une autre partie peut en tirer une autre', () => {
    const premiere = rendreConsultation(TEXTES, regardPillee(), { graine: 3, action: 0 });
    expect(rendreConsultation(TEXTES, regardPillee(), { graine: 3, action: 9 })).toBe(premiere);
    const autres = new Set(Array.from({ length: 30 }, (_, graine) => rendreConsultation(TEXTES, regardPillee(), { graine, action: 0 })));
    expect(autres.size).toBeGreaterThan(1);
  });

  it('au moins six phrases, chacune entière, sans chiffre ni trou, sans mot de trace ni de menace', () => {
    expect(TEXTES.pillages.length).toBeGreaterThanOrEqual(6);
    for (const phrase of TEXTES.pillages) {
      expect(phrase).toMatch(/^[A-ZÀ-Ý].*\.$/u);
      expect(phrase).not.toMatch(/[0-9{}]/);
      expect(phrase.split(/[.!?…]+(?:\s|$)/).filter((morceau) => morceau.trim() !== '')).toHaveLength(1);
    }
    // Mêmes radicaux que le catalogue : la trace dit « elle est passée par ici », le pillage « quelqu'un a pris ».
    expect(fuitesDuCatalogue({ noms: {}, descriptions: { pillage: TEXTES.pillages }, assistance: {} })).toEqual([]);
  });
});

describe('bruit de station et attentes à la suite (spec 2026-10-18 §5.5, D-289)', () => {
  it('à la 5e et à la 10e attente, le texte de la station reste, même si un bruit de station tombe sur la même action', () => {
    for (const attentes of [5, 10] as const) {
      const cle = { graine: 3, action: attentes, attentes };
      expect(rendreEvenements(TEXTES, [{ type: 'attente' }, { type: 'bruit_station' }], cle)).toEqual([TEXTES.attentesLongues[attentes]]);
      expect(rendreEvenements(TEXTES, [{ type: 'attente' }], cle)).toEqual([TEXTES.attentesLongues[attentes]]);
    }
  });

  it('une attente dans le vacarme des machines ne parle jamais de silence (#251)', () => {
    for (let action = 0; action < 20; action += 1) {
      const [phrase] = rendreEvenements(TEXTES, [{ type: 'attente', vacarme: true }], { graine: 1, action });
      expect(TEXTES.attenteVacarme).toContain(phrase);
      expect(phrase).not.toMatch(/silenc|rien ne bouge/i);
    }
  });

  it('une attente suivie d’un bruit de la créature ou d’un bip du capteur ne dit pas « Rien ne bouge »', () => {
    for (let action = 0; action < 20; action += 1) {
      for (const suite of [{ type: 'bruit_creature', passage: { id: 'p', nom: 'porte' } }, { type: 'capteur', etat: 'mouvement' }] as unknown as Evenement[]) {
        const [phrase] = rendreEvenements(TEXTES, [{ type: 'attente' }, suite], { graine: 1, action });
        expect(TEXTES.attenteEcoute).toContain(phrase);
        expect(phrase).not.toMatch(/rien ne bouge|silence/i);
      }
    }
  });

  it('ailleurs, le bruit de station se raconte après l’attente', () => {
    const texte = rendreEvenements(TEXTES, [{ type: 'attente' }, { type: 'bruit_station' }], { graine: 3, action: 4, attentes: 4 });
    expect(texte).toHaveLength(2);
    expect(TEXTES.evenements.bruit_station).toContain(texte[1]);
  });
});

// Poser un appui porté à une position de la pièce (demande du porteur, grandes stations) : « Vous posez la caisse sous la grille. »

const NOMS_POSE = reunir([
  {
    noms: {
      caisse: { texte: 'caisse', genre: 'f', nombre: 's', elision: false },
      sous_grille: { texte: 'sous la grille', genre: 'f', nombre: 's', elision: false },
    },
    descriptions: {},
    assistance: {},
  },
]);
const POSE_SOUS_LA_GRILLE: Evenement = {
  type: 'objet_pose_position',
  objet: { sorte: 'objet', id: 'e00000002', nom: 'caisse' },
  position: { sorte: 'position', id: 'e00000003', nom: 'sous_grille' },
};
const TEXTES_POSE = ['Vous posez {le:objet} {nom:position}. Vos mains sont libres.', 'Vous déposez {le:objet} {nom:position}, bien d’aplomb. Vous gardez les mains libres.'];

describe('pose à une position (demande du porteur, grandes stations)', () => {
  it('le socle donne les deux textes de l’événement, avec l’objet et la position', () => {
    expect(NOMS_POSE.evenements.objet_pose_position).toEqual(TEXTES_POSE);
  });

  it('se raconte avec le nom de l’objet et celui de la position, sous l’une ou l’autre forme', () => {
    const phrases = new Set(Array.from({ length: 30 }, (_, graine) => rendreEvenements(NOMS_POSE, [POSE_SOUS_LA_GRILLE], { graine, action: 0 })[0]));
    expect([...phrases].sort()).toEqual([
      'Vous déposez la caisse sous la grille, bien d’aplomb. Vous gardez les mains libres.',
      'Vous posez la caisse sous la grille. Vos mains sont libres.',
    ]);
  });

  it('AR-01, AR-02 et le monde de test, écrits en entier, reprennent les mêmes textes', () => {
    for (const id of ['ar-01', 'ar-02', 'monde-test']) expect(MONDES[id]?.textes.evenements.objet_pose_position, id).toEqual(TEXTES_POSE);
  });
});

describe('libellé de « Poser » à une position (demande du porteur, menu de la CLI)', () => {
  const caisse = { sorte: 'objet', id: 'e00000002', nom: 'caisse' } as const;
  const sousLaGrille = { sorte: 'position', id: 'e00000003', nom: 'sous_grille' } as const;
  const poser = (parametre?: typeof sousLaGrille): OptionMenu => ({
    action: 'poser',
    cible: caisse,
    commande: { action: 'poser', cible: caisse.id, ...(parametre === undefined ? {} : { parametre: parametre.id }) },
    disponible: true,
    ...(parametre === undefined ? {} : { parametre }),
  });

  it('avec une position, le libellé la nomme ; sans position, il ne change pas', () => {
    expect(libelleOption(NOMS_POSE, poser(sousLaGrille)).libelle).toBe('Poser la caisse sous la grille');
    expect(libelleOption(NOMS_POSE, poser()).libelle).toBe('Poser la caisse');
  });

  it('même forme que « Déplacer » ; les mondes écrits en entier reprennent le même libellé', () => {
    expect(NOMS_POSE.poserAPosition).toBe('Poser {le:cible} {nom:position}');
    expect(libelleOption(NOMS_POSE, { ...poser(sousLaGrille), action: 'deplacer' }).libelle).toBe('Déplacer la caisse sous la grille');
    for (const id of ['ar-01', 'ar-02', 'monde-test']) expect(MONDES[id]?.textes.poserAPosition, id).toBe(NOMS_POSE.poserAPosition);
  });
});

describe('écoute porte par porte (lot 2 de la créature mobile)', () => {
  const textes = reunir([
    {
      noms: {
        porte: { texte: 'porte', genre: 'f', nombre: 's', elision: false },
        cuisine: { texte: 'cuisine', genre: 'f', nombre: 's', elision: false },
      },
      descriptions: {},
      assistance: {},
    },
  ]);
  const passage: RefPassage = {
    sorte: 'passage',
    id: 'e00000004',
    nom: 'porte',
    ouvert: false,
    vers: { sorte: 'piece', id: 'e00000005', nom: 'cuisine' },
    signale: true,
    feu: false,
    huile: false,
    vide: false,
    gouffre: false,
  };
  const net: Evenement = { type: 'ecoute', passage, entendu: 'net' };

  it('une attente suivie d’une écoute prend sa phrase d’attente, puis nomme le passage', () => {
    const phrases = rendreEvenements(textes, [{ type: 'attente' }, net], { graine: 1, action: 0 });
    expect(phrases).toHaveLength(2);
    expect(textes.attenteEcoute).toContain(phrases[0]);
    expect(phrases[1]).toContain('la porte de la cuisine');
  });

  it('même chose devant une écoute couverte ; une attente seule garde ses textes', () => {
    const [attente, couverte] = rendreEvenements(textes, [{ type: 'attente' }, { type: 'ecoute_couverte' }], { graine: 1, action: 0 });
    expect(textes.attenteEcoute).toContain(attente);
    expect(textes.evenements.ecoute_couverte).toContain(couverte);
    expect(rendreEvenements(textes, [{ type: 'attente' }], { graine: 1, action: 0, attentes: 5 })).toEqual([textes.attentesLongues[5]]);
  });

  it('un bruit de station entre l’attente et l’écoute ne rend pas à l’attente sa phrase ordinaire', () => {
    const phrases = rendreEvenements(textes, [{ type: 'attente' }, { type: 'bruit_station' }, net], { graine: 1, action: 0 });
    expect(textes.attenteEcoute).toContain(phrases[0]);
    expect(phrases[phrases.length - 1]).toContain('la porte de la cuisine');
  });

  it('en rouge : un net ou un toujours, le bruit de la créature et le bruit proche ; pas un vague', () => {
    expect(alertesMenace([{ type: 'attente' }, net])).toEqual([1]);
    expect(alertesMenace([{ type: 'ecoute', passage, entendu: 'toujours' }])).toEqual([0]);
    expect(alertesMenace([{ type: 'ecoute', passage, entendu: 'vague' }])).toEqual([]);
    expect(alertesMenace([{ type: 'bruit_creature', passage }])).toEqual([0]);
    expect(alertesMenace([{ type: 'bruit_proche', passage }])).toEqual([0]);
  });
});

describe('rappel d’écoute et silences groupés (#261, #266)', () => {
  const textes = reunir([
    {
      noms: {
        porte: { texte: 'porte', genre: 'f', nombre: 's', elision: false },
        cuisine: { texte: 'cuisine', genre: 'f', nombre: 's', elision: false },
        atelier: { texte: 'atelier', genre: 'm', nombre: 's', elision: true },
        infirmerie: { texte: 'infirmerie', genre: 'f', nombre: 's', elision: true },
      },
      descriptions: {},
      assistance: {},
    },
  ]);
  const porte = (id: string, nom: string): RefPassage => ({
    sorte: 'passage',
    id,
    nom: 'porte',
    ouvert: false,
    vers: { sorte: 'piece', id: `p${id}`, nom },
    signale: true,
    feu: false,
    huile: false,
    vide: false,
    gouffre: false,
  });
  const cuisine = porte('e1', 'cuisine');
  const quatre = [cuisine, porte('e2', 'atelier'), porte('e3', 'infirmerie'), porte('e4', 'cuisine')];
  const rappel: Evenement = { type: 'ecoute_rappel', autres: false };

  it('les silences ensemble, nommés en liste', () => {
    const [attente, groupe] = rendreEvenements(textes, [{ type: 'attente' }, { type: 'ecoute_groupee', passages: quatre.slice(0, 2), entendu: 'rien', toutes: false }], { graine: 1, action: 0 });
    expect(textes.attenteEcoute).toContain(attente);
    expect(groupe).toContain('la porte de la cuisine et la porte de l’atelier');
  });

  it('toutes : « les quatre portes »', () => {
    expect(rendreEvenements(textes, [{ type: 'ecoute_groupee', passages: quatre, entendu: 'rien', toutes: true }], { graine: 1, action: 0 })).toEqual(['Derrière les quatre portes, le silence.']);
  });

  it('le rappel, et « aux autres portes » après une porte dite', () => {
    const [attente, phrase] = rendreEvenements(textes, [{ type: 'attente' }, rappel], { graine: 1, action: 0 });
    expect(textes.attenteEcoute).toContain(attente);
    expect(textes.ecouteRappel.portes).toContain(phrase);
    const phrases = rendreEvenements(textes, [{ type: 'attente' }, { type: 'ecoute', passage: cuisine, entendu: 'net' }, { type: 'ecoute_rappel', autres: true }], { graine: 1, action: 0 });
    expect(phrases[2]).toBe('Aux autres portes, rien de nouveau.');
  });

  it('5e et 10e attente : la patience, puis le rappel ou le vacarme ; un bruit de station se tait', () => {
    const [patience, phrase] = rendreEvenements(textes, [{ type: 'attente' }, { type: 'bruit_station' }, rappel], { graine: 1, action: 0, attentes: 5 });
    expect(patience).toBe(textes.attentesLongues[5]);
    expect(textes.ecouteRappel.portes).toContain(phrase);
    const vacarme = rendreEvenements(textes, [{ type: 'attente', vacarme: true }, { type: 'ecoute_couverte' }], { graine: 1, action: 0, attentes: 10 });
    expect(vacarme[0]).toBe(textes.attentesLongues[10]);
    expect(textes.evenements.ecoute_couverte).toContain(vacarme[1]);
  });

  it('une porte qui change n’est pas un calme : pas de patience', () => {
    const phrases = rendreEvenements(textes, [{ type: 'attente' }, { type: 'ecoute', passage: cuisine, entendu: 'vague' }, { type: 'ecoute_rappel', autres: true }], { graine: 1, action: 0, attentes: 5 });
    expect(textes.attenteEcoute).toContain(phrases[0]);
  });

  it('en rouge : le net seulement, pas le groupe ni le rappel', () => {
    expect(alertesMenace([{ type: 'attente' }, { type: 'ecoute', passage: cuisine, entendu: 'net' }, { type: 'ecoute_rappel', autres: true }])).toEqual([1]);
    expect(alertesMenace([{ type: 'ecoute_groupee', passages: quatre, entendu: 'rien', toutes: true }, rappel])).toEqual([]);
  });
});

describe('capteur de mouvement (lot 3 de la créature mobile)', () => {
  const textes = reunir([]);
  const piece = { sorte: 'piece', id: 'e00000005', nom: 'cuisine' } as const;
  const objet = { sorte: 'objet', id: 'e00000006', nom: 'cat_capteur' } as const;

  it('la pose prend ses phrases selon l’état lu, sans alerte quand tout est calme', () => {
    const evenement: Evenement = { type: 'capteur_pose', objet, piece, etat: 'calme' };
    const [phrase] = rendreEvenements(textes, [evenement], { graine: 1, action: 0 });
    expect(textes.capteurPose.calme).toContain(phrase);
    expect(alertesMenace([evenement])).toEqual([]);
  });

  it('un bip prend ses phrases selon l’état ; le mouvement seul est en rouge', () => {
    for (const etat of ['calme', 'mouvement', 'brouille', 'hs'] as const) {
      const [phrase] = rendreEvenements(textes, [{ type: 'capteur', etat }], { graine: 1, action: 0 });
      expect(textes.capteur[etat], etat).toContain(phrase);
      expect(alertesMenace([{ type: 'capteur', etat }]), etat).toEqual(etat === 'mouvement' ? [0] : []);
    }
    expect(alertesMenace([{ type: 'attente' }, { type: 'capteur', etat: 'mouvement' }])).toEqual([1]);
  });

  it('une pose qui lit un mouvement est en rouge aussi', () => {
    expect(alertesMenace([{ type: 'capteur_pose', objet, piece, etat: 'mouvement' }])).toEqual([0]);
  });

  it('les mondes écrits en entier reprennent ces textes', () => {
    for (const id of ['ar-01', 'ar-02', 'monde-test']) {
      expect(MONDES[id]?.textes.capteur, id).toEqual(textes.capteur);
      expect(MONDES[id]?.textes.capteurPose, id).toEqual(textes.capteurPose);
    }
  });
});

describe('salle de surveillance et messages d’IA Station (lot 4)', () => {
  const nom = (texte: string, genre: 'm' | 'f') => ({ texte, genre, nombre: 's', elision: false }) as const;
  const textes = reunir([{ noms: { dortoir: nom('dortoir', 'm'), remise: nom('remise', 'f') }, descriptions: {}, assistance: {} }]);
  const DORTOIR = { sorte: 'piece', id: 'e00000007', nom: 'dortoir' } as const;
  const REMISE = { sorte: 'piece', id: 'e00000008', nom: 'remise' } as const;
  const sansMenace = (texte: string): void => {
    for (const mot of texte.toLocaleLowerCase('fr').match(/\p{L}+/gu) ?? []) expect(MOTS_MENACE.some((radical) => mot.startsWith(radical)), `${mot} dans « ${texte} »`).toBe(false);
  };
  const messages = Array.from({ length: 12 }, (_, rang) => `signe-${rang + 1}`);

  it('une présence nomme la pièce en tête, sans mot de la menace ni chiffre dans le texte', () => {
    for (const message of messages) {
      const texte = texteAssistance(textes, message, { sorte: 'presence', piece: DORTOIR });
      expect(texte).toContain('Dortoir');
      expect(texte).not.toMatch(/\d/);
      expect(textes.signesIA.presence).toContain(texte.replace('Dortoir', '{Nom:piece}'));
      sansMenace(texte);
    }
  });

  it('chaque sorte prend ses variantes ; une porte nomme ses deux pièces, le matériel suit l’appareil', () => {
    const porte = new Set(messages.map((message) => texteAssistance(textes, message, { sorte: 'porte', pieces: [REMISE, DORTOIR] })));
    expect(porte.size).toBeGreaterThan(1);
    for (const texte of porte) expect(texte).toMatch(/la remise.*le dortoir/);
    expect(texteAssistance(textes, 'signe-1', { sorte: 'materiel', piece: DORTOIR, appareil: 'camera' })).toMatch(/^Caméra du dortoir/);
    expect(texteAssistance(textes, 'signe-1', { sorte: 'materiel', piece: DORTOIR, appareil: 'capteur' })).toMatch(/^Capteur .* du dortoir/);
    expect(texteAssistance(textes, 'signe-2', { sorte: 'passage', piece: REMISE })).toContain('Remise');
  });

  it('un message de signe sans son fait lève une erreur, jamais un texte inventé', () => {
    expect(() => texteAssistance(textes, 'signe-1')).toThrow();
  });

  it('le repère d’un signe : en cours de route', () => {
    expect(rendreMoment(textes, { type: 'signe' })).toBe('en cours de route');
  });

  it('le code du post-it dit l’accès autorisé, la connexion charge le plan (D-356)', () => {
    const [code] = rendreEvenements(textes, [{ type: 'terminal_deverrouille' }], { graine: 1, action: 0 });
    expect(code).toContain('ACCÈS AUTORISÉ');
    const [phrase] = rendreEvenements(textes, [{ type: 'terminal_connecte' }], { graine: 1, action: 0 });
    expect(phrase).toContain('PLAN DE LA STATION CHARGÉ');
  });

  it('les mondes écrits en entier reprennent ces textes', () => {
    for (const id of ['ar-01', 'ar-02', 'monde-test']) {
      expect(MONDES[id]?.textes.signesIA, id).toEqual(textes.signesIA);
      expect(MONDES[id]?.textes.observation.momentSigne, id).toBe(textes.observation.momentSigne);
    }
  });
});
