import {
  empreinteEtat,
  ErreurRejeu,
  exporter,
  jouer,
  lireExport,
  nouvellePartie,
  observer,
  rejouer,
  reprendrePartie,
  validerMonde,
  type DefMonde,
  type IdAction,
  type Observation,
  type OptionMenu,
  type Partie,
} from './index';

const MONDE: DefMonde = {
  id: 'essai',
  depart: 'p-a',
  pieces: [
    { id: 'p-a', nom: 'salle_a' },
    { id: 'p-b', nom: 'salle_b' },
    { id: 'p-c', nom: 'salle_c' },
  ],
  liaisons: [
    { id: 'l-ab', nom: 'porte', entre: ['p-a', 'p-b'], ouverte: false },
    { id: 'l-bc', nom: 'grille', entre: ['p-b', 'p-c'], ouverte: true },
  ],
  objets: [
    { id: 'o-1', nom: 'boite', piece: 'p-a' },
    { id: 'o-2', nom: 'cle', piece: 'p-b' },
  ],
};
const IDS_INTERNES = ['essai', 'p-a', 'p-b', 'p-c', 'l-ab', 'l-bc', 'o-1', 'o-2'];
const VERSION = 'test-1';

function partieNeuve(graine = 42): Partie {
  return nouvellePartie(MONDE, { version: VERSION, graine });
}

function option(observation: Observation, action: IdAction, nom: string): OptionMenu {
  const trouvee = observation.menu.find((candidate) => candidate.action === action && candidate.cible.nom === nom);
  if (trouvee === undefined) throw new Error(`Option ${action} ${nom} absente du menu.`);
  return trouvee;
}

function engager(partie: Partie, action: IdAction, nom: string): Partie {
  const resultat = jouer(MONDE, partie, option(observer(MONDE, partie.etat), action, nom).commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}`);
  return resultat.partie;
}

function attendreRefusSansEffet(partie: Partie, commande: unknown, raison: string): void {
  const avant = empreinteEtat(partie.etat);
  const resultat = jouer(MONDE, partie, commande);
  expect(resultat.type).toBe('refus');
  if (resultat.type === 'refus') expect(resultat.raison).toBe(raison);
  expect(resultat.partie).toBe(partie);
  expect(empreinteEtat(resultat.partie.etat)).toBe(avant);
}

function cleDeLieux({ etat }: Partie): string {
  return JSON.stringify({ piece: etat.piece, objets: etat.objets, liaisons: etat.liaisons, visitees: etat.visitees });
}

/** Tous les états atteignables par des actions engagées disponibles, jusqu'à une profondeur donnée. */
function etatsAtteignables(profondeur: number): Partie[] {
  const vus = new Map<string, Partie>([[cleDeLieux(partieNeuve()), partieNeuve()]]);
  let frontiere = [partieNeuve()];
  for (let niveau = 0; niveau < profondeur; niveau++) {
    const suivante: Partie[] = [];
    for (const partie of frontiere) {
      for (const choix of observer(MONDE, partie.etat).menu) {
        if (!choix.disponible || choix.action === 'regarder') continue;
        const resultat = jouer(MONDE, partie, choix.commande);
        if (resultat.type !== 'engagee') continue;
        const cle = cleDeLieux(resultat.partie);
        if (!vus.has(cle)) {
          vus.set(cle, resultat.partie);
          suivante.push(resultat.partie);
        }
      }
    }
    frontiere = suivante;
  }
  return [...vus.values()];
}

function chaines(valeur: unknown): string[] {
  if (typeof valeur === 'string') return [valeur];
  if (Array.isArray(valeur)) return valeur.flatMap(chaines);
  if (valeur !== null && typeof valeur === 'object') return Object.values(valeur).flatMap(chaines);
  return [];
}

describe('monde', () => {
  it('accepte un monde cohérent', () => {
    expect(validerMonde(MONDE)).toEqual([]);
  });

  it('refuse doublons et références inconnues', () => {
    const erreurs = validerMonde({
      ...MONDE,
      depart: 'p-z',
      liaisons: [{ id: 'l-x', nom: 'porte', entre: ['p-a', 'p-z'], ouverte: false }],
      objets: [
        { id: 'o-1', nom: 'boite', piece: 'p-z' },
        { id: 'p-a', nom: 'doublon', piece: 'p-a' },
      ],
    });
    expect(erreurs).toEqual(
      expect.arrayContaining([
        'Départ inconnu : p-z.',
        'l-x : pièce inconnue.',
        'o-1 : pièce inconnue p-z.',
        'p-a : identifiant en double.',
      ]),
    );
  });
});

describe('observation', () => {
  it('montre au départ la pièce, ses objets, ses passages et un menu', () => {
    const observation = observer(MONDE, partieNeuve().etat);
    expect(observation.piece.nom).toBe('salle_a');
    expect(observation.objets.map((objet) => objet.nom)).toEqual(['boite']);
    expect(observation.passages).toEqual([expect.objectContaining({ nom: 'porte', ouvert: false, vers: expect.objectContaining({ nom: 'salle_b' }) })]);
    expect(observation.inventaire).toEqual([]);
    expect(observation.visitees.map((piece) => piece.nom)).toEqual(['salle_a']);
    expect(observation.actions).toBe(0);
    expect(option(observation, 'aller', 'porte')).toMatchObject({ disponible: false, raison: 'ferme' });
    expect(observation.menu.some((choix) => choix.action === 'fermer')).toBe(false);
  });

  it("n'expose aucun identifiant interne, sur tous les états atteignables", () => {
    for (const partie of etatsAtteignables(8)) {
      const visibles = chaines(observer(MONDE, partie.etat));
      expect(visibles.filter((texte) => IDS_INTERNES.includes(texte))).toEqual([]);
    }
  });

  it('donne le même identifiant public à une entité, quel que soit le reste du monde', () => {
    const autre: DefMonde = { ...MONDE, objets: [{ id: 'o-cache', nom: 'cache', piece: 'p-c' }, ...MONDE.objets] };
    const a = observer(MONDE, partieNeuve().etat);
    const b = observer(autre, nouvellePartie(autre, { version: VERSION, graine: 42 }).etat);
    expect(b).toEqual(a);
  });

  it('observer dix fois ne change ni l’état ni le générateur (C-01 A-01)', () => {
    const partie = partieNeuve();
    const avant = empreinteEtat(partie.etat);
    const premiere = observer(MONDE, partie.etat);
    for (let i = 0; i < 10; i++) expect(observer(MONDE, partie.etat)).toEqual(premiere);
    expect(empreinteEtat(partie.etat)).toBe(avant);
  });
});

describe('refus', () => {
  it('aller par une porte fermée : refus, rien ne change', () => {
    const partie = partieNeuve();
    attendreRefusSansEffet(partie, option(observer(MONDE, partie.etat), 'aller', 'porte').commande, 'ferme');
    expect(partie.etat.actions).toBe(0);
    expect(partie.enregistrement.actions).toEqual([]);
  });

  it('commande mal formée, action ou cible inconnue : refus explicite sans effet', () => {
    const partie = partieNeuve();
    const cible = observer(MONDE, partie.etat).objets[0]?.id ?? '';
    attendreRefusSansEffet(partie, null, 'commande_invalide');
    attendreRefusSansEffet(partie, 'prendre boite', 'commande_invalide');
    attendreRefusSansEffet(partie, { action: 'prendre' }, 'commande_invalide');
    attendreRefusSansEffet(partie, { action: 'lancer', cible }, 'action_inconnue');
    attendreRefusSansEffet(partie, { action: 'prendre', cible: 'e00000000' }, 'cible_absente');
    attendreRefusSansEffet(partie, { action: 'prendre', cible: 'o-1' }, 'cible_absente');
  });

  it('cible ailleurs ou mauvaise sorte : refus', () => {
    const partie = partieNeuve();
    const ailleurs = engager(engager(partieNeuve(), 'ouvrir', 'porte'), 'aller', 'porte');
    const cle = observer(MONDE, ailleurs.etat).objets[0]?.id ?? '';
    attendreRefusSansEffet(partie, { action: 'prendre', cible: cle }, 'cible_absente');
    attendreRefusSansEffet(partie, { action: 'regarder', cible: cle }, 'cible_absente');
    const porte = observer(MONDE, partie.etat).passages[0]?.id ?? '';
    attendreRefusSansEffet(partie, { action: 'prendre', cible: porte }, 'cible_absente');
    attendreRefusSansEffet(partie, { action: 'poser', cible: porte }, 'pas_en_main');
    attendreRefusSansEffet(partie, { action: 'fermer', cible: porte }, 'deja_ferme');
  });

  it('commande périmée : refusée dans le nouvel état', () => {
    const partie = partieNeuve();
    const prendre = option(observer(MONDE, partie.etat), 'prendre', 'boite').commande;
    const ouvrir = option(observer(MONDE, partie.etat), 'ouvrir', 'porte').commande;
    const apres = engager(engager(partie, 'prendre', 'boite'), 'ouvrir', 'porte');
    attendreRefusSansEffet(apres, prendre, 'cible_absente');
    attendreRefusSansEffet(apres, ouvrir, 'deja_ouvert');
    expect(apres.etat.actions).toBe(2);
    expect(apres.enregistrement.actions).toHaveLength(2);
  });
});

describe('actions', () => {
  it('regarder est gratuit : partie inchangée, pas de journal', () => {
    const partie = engager(partieNeuve(), 'prendre', 'boite');
    const regards = observer(MONDE, partie.etat).menu.filter((choix) => choix.action === 'regarder');
    expect(regards.map((choix) => choix.cible.sorte).sort()).toEqual(['objet', 'passage', 'piece']);
    for (const regard of regards) {
      const resultat = jouer(MONDE, partie, regard.commande);
      expect(resultat.type).toBe('consultation');
      expect(resultat.partie).toBe(partie);
    }
  });

  it('prendre puis poser : un seul emplacement à la fois', () => {
    const portee = engager(partieNeuve(), 'prendre', 'boite');
    let observation = observer(MONDE, portee.etat);
    expect(observation.inventaire.map((objet) => objet.nom)).toEqual(['boite']);
    expect(observation.objets).toEqual([]);
    const posee = engager(engager(engager(portee, 'ouvrir', 'porte'), 'aller', 'porte'), 'poser', 'boite');
    observation = observer(MONDE, posee.etat);
    expect(observation.inventaire).toEqual([]);
    expect(observation.objets.map((objet) => objet.nom)).toEqual(['boite', 'cle']);
    expect(Object.values(posee.etat.objets).filter((lieu) => lieu.type === 'passager')).toEqual([]);
  });

  it('une liaison a le même état des deux côtés', () => {
    const dansB = engager(engager(partieNeuve(), 'ouvrir', 'porte'), 'aller', 'porte');
    const vueDeB = observer(MONDE, dansB.etat).passages.find((passage) => passage.nom === 'porte');
    const vueDeA = observer(MONDE, engager(partieNeuve(), 'ouvrir', 'porte').etat).passages[0];
    expect(vueDeB).toMatchObject({ ouvert: true, id: vueDeA?.id, vers: { nom: 'salle_a' } });
    const fermeeDepuisB = engager(dansB, 'fermer', 'porte');
    expect(option(observer(MONDE, fermeeDepuisB.etat), 'aller', 'porte')).toMatchObject({ disponible: false, raison: 'ferme' });
    expect(Object.keys(fermeeDepuisB.etat.liaisons)).toEqual(['l-ab', 'l-bc']);
  });

  it('aller marque la pièce visitée et ne la découvre qu’une fois', () => {
    const premier = jouer(MONDE, engager(partieNeuve(), 'ouvrir', 'porte'), option(observer(MONDE, engager(partieNeuve(), 'ouvrir', 'porte').etat), 'aller', 'porte').commande);
    expect(premier.type === 'engagee' && premier.evenements.map((evenement) => evenement.type)).toEqual(['deplacement', 'piece_decouverte']);
    const retour = engager(premier.partie, 'aller', 'porte');
    const encore = jouer(MONDE, retour, option(observer(MONDE, retour.etat), 'aller', 'porte').commande);
    expect(encore.type === 'engagee' && encore.evenements.map((evenement) => evenement.type)).toEqual(['deplacement']);
    expect(observer(MONDE, encore.partie.etat).visitees.map((piece) => piece.nom)).toEqual(['salle_a', 'salle_b']);
  });

  it('menu et validation sont cohérents sur tous les états atteignables', () => {
    const etats = etatsAtteignables(8);
    expect(etats.length).toBeGreaterThan(10);
    for (const partie of etats) {
      for (const choix of observer(MONDE, partie.etat).menu) {
        const resultat = jouer(MONDE, partie, choix.commande);
        if (choix.disponible) {
          expect(resultat.type).not.toBe('refus');
        } else {
          expect(resultat).toMatchObject({ type: 'refus', raison: choix.raison });
        }
      }
    }
  });
});

describe('journal, rejeu et export', () => {
  const COUPS: readonly [IdAction, string][] = [
    ['prendre', 'boite'],
    ['ouvrir', 'porte'],
    ['aller', 'porte'],
    ['poser', 'boite'],
    ['aller', 'grille'],
  ];

  function jouerCoups(graine = 42): Partie {
    return COUPS.reduce((partie, [action, nom]) => engager(partie, action, nom), partieNeuve(graine));
  }

  it('mêmes commandes, même graine : même état', () => {
    expect(empreinteEtat(jouerCoups().etat)).toBe(empreinteEtat(jouerCoups().etat));
    expect(jouerCoups().etat.actions).toBe(5);
    expect(jouerCoups().enregistrement.actions).toHaveLength(5);
  });

  it('rejouer redonne le même état et les mêmes événements', () => {
    const partie = jouerCoups();
    const { partie: rejouee, etapes } = rejouer(MONDE, partie.enregistrement, VERSION);
    expect(empreinteEtat(rejouee.etat)).toBe(empreinteEtat(partie.etat));
    expect(rejouee).toEqual(partie);
    expect(etapes).toHaveLength(5);
    expect(etapes[4]).toEqual(partie.derniers);
  });

  it('rejouer refuse une autre version, un autre monde, une action refusée ou des tirages divergents', () => {
    const { enregistrement } = jouerCoups();
    expect(() => rejouer(MONDE, enregistrement, 'autre')).toThrow(ErreurRejeu);
    expect(() => rejouer({ ...MONDE, id: 'ailleurs' }, enregistrement, VERSION)).toThrow(/monde/);
    const inverse = { ...enregistrement, actions: [...enregistrement.actions].reverse() };
    expect(() => rejouer(MONDE, inverse, VERSION)).toThrow(/refusée/);
    const [premiere, ...reste] = enregistrement.actions;
    if (premiere === undefined) throw new Error('Journal vide.');
    const triche = { ...enregistrement, actions: [{ ...premiere, tirages: [3] }, ...reste] };
    expect(() => rejouer(MONDE, triche, VERSION)).toThrow(/tirages divergents/);
  });

  it("l'export rejoue la partie et ne la modifie pas (C-09 SP-04, SP-05)", () => {
    const partie = jouerCoups();
    const avant = JSON.stringify(partie);
    const fichier = JSON.parse(JSON.stringify(exporter(MONDE, partie, 'Essai'))) as unknown;
    expect(JSON.stringify(partie)).toBe(avant);
    const relu = lireExport(fichier);
    expect(relu.commentaire).toBe('Essai');
    expect(relu.observation).toEqual(observer(MONDE, partie.etat));
    expect(empreinteEtat(rejouer(MONDE, relu, VERSION).partie.etat)).toBe(relu.empreinte);
    expect(exporter(MONDE, partie)).not.toHaveProperty('commentaire');
  });

  it('lireExport refuse un fichier mal formé', () => {
    const correct = JSON.parse(JSON.stringify(exporter(MONDE, jouerCoups()))) as Record<string, unknown>;
    expect(() => lireExport(null)).toThrow(ErreurRejeu);
    expect(() => lireExport({ ...correct, format: 2 })).toThrow(/Format/);
    expect(() => lireExport({ ...correct, graine: -1 })).toThrow(/Graine/);
    expect(() => lireExport({ ...correct, actions: [{ commande: 'prendre', tirages: [] }] })).toThrow(/commande/);
    expect(() => lireExport({ ...correct, empreinte: undefined })).toThrow(/Empreinte/);
  });

  it('reprendre une sauvegarde redonne la même partie ; une sauvegarde incohérente est refusée', () => {
    const partie = jouerCoups();
    const sauvegarde = JSON.parse(JSON.stringify(partie)) as unknown;
    expect(reprendrePartie(MONDE, sauvegarde, VERSION)).toEqual(partie);
    const alteree = { ...partie, etat: { ...partie.etat, piece: 'p-a' } };
    expect(() => reprendrePartie(MONDE, JSON.parse(JSON.stringify(alteree)), VERSION)).toThrow(/incohérente/);
    expect(() => reprendrePartie(MONDE, sauvegarde, 'autre')).toThrow(/version/);
  });
});
