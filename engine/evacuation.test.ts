import {
  apercu,
  historique,
  idPublic,
  jouer,
  nouvellePartie,
  observer,
  validerMonde,
  type DefMonde,
  type EtatCreature,
  type Evenement,
  type IdAction,
  type OptionMenu,
  type Partie,
} from './index';

// Passages sans signalétique et cachés (K-05), gabarit large, circuit, source et capsule (AR-01 §11.2), messages de l'IA.
// Fixture réduite ; les noms ne servent qu'à retrouver les options du menu : aucune règle ne lit un nom (D-078).
//
//   cabine ══ecoutille (manoeuvrée de la cabine)══ quai ══grille (étroite, sans signalétique)══ local
//                                                   ╚══porte══ soute ══panneau (caché côté soute)══ local
const MONDE: DefMonde = {
  id: 'essai-evacuation',
  depart: 'quai',
  pieces: [
    { id: 'quai', nom: 'quai' },
    { id: 'local', nom: 'local' },
    { id: 'soute', nom: 'soute' },
    { id: 'cabine', nom: 'cabine' },
  ],
  liaisons: [
    { id: 'grille', nom: 'grille', entre: ['quai', 'local'], ouverte: true, etroite: true, sansSignaletique: true },
    { id: 'porte', nom: 'porte', entre: ['quai', 'soute'], ouverte: true },
    { id: 'panneau', nom: 'panneau', entre: ['local', 'soute'], ouverte: false, cachee: 'soute' },
    { id: 'ecoutille', nom: 'ecoutille', entre: ['quai', 'cabine'], ouverte: true, manoeuvre: 'cabine' },
  ],
  objets: [
    { id: 'console', nom: 'console', piece: 'local', portable: false, alimente: 'capsule' },
    { id: 'bloc', nom: 'bloc', piece: 'local', large: true, source: true },
    { id: 'capsule', nom: 'capsule', piece: 'quai', portable: false, capsule: { interieur: 'cabine' } },
    { id: 'pupitre', nom: 'pupitre', piece: 'cabine', portable: false, depart: 'capsule' },
  ],
  assistance: [
    { id: 'bienvenue', quand: { type: 'reveil' } },
    { id: 'local', quand: { type: 'arrivee', piece: 'local' } },
    { id: 'depart', quand: { type: 'evacuation' } },
    { id: 'patience', quand: { type: 'patience' } },
  ],
};
const VERSION = 'evacuation-1';

const CALME: Omit<EtatCreature, 'piece'> = { indice: null, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null };

function partie(monde: DefMonde = MONDE): Partie {
  return nouvellePartie(monde, { version: VERSION, graine: 7 });
}

function option(courante: Partie, action: IdAction, nom: string, monde: DefMonde = MONDE): OptionMenu | undefined {
  return observer(monde, courante.etat).menu.find((choix) => choix.action === action && choix.cible.nom === nom);
}

function engager(courante: Partie, action: IdAction, nom: string): { partie: Partie; evenements: readonly Evenement[]; tirages: readonly number[] } {
  const choix = option(courante, action, nom);
  if (choix === undefined || !choix.disponible) throw new Error(`Option ${action} ${nom} absente ou indisponible.`);
  const resultat = jouer(MONDE, courante, choix.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return resultat;
}

type Geste = readonly [IdAction, string];

function suite(depart: Partie, gestes: readonly Geste[]): Partie {
  return gestes.reduce((courante, [action, nom]) => engager(courante, action, nom).partie, depart);
}

function types(evenements: readonly Evenement[]): string[] {
  return evenements.map((evenement) => evenement.type);
}

function passage(courante: Partie, nom: string) {
  return observer(MONDE, courante.etat).passages.find((vu) => vu.nom === nom);
}

const VERS_LOCAL: readonly Geste[] = [['aller', 'grille']];
const BLOC_AU_QUAI: readonly Geste[] = [['aller', 'grille'], ['prendre', 'bloc'], ['ouvrir', 'panneau'], ['aller', 'panneau'], ['aller', 'porte']];
const A_BORD: readonly Geste[] = [['aller', 'ecoutille'], ['fermer', 'ecoutille']];

describe('monde : passages, capsule et messages (validation)', () => {
  it('la fixture est valide ; cachée, manoeuvre, capsule, console, pupitre et messages sont contrôlés', () => {
    expect(validerMonde(MONDE)).toEqual([]);
    const casse: DefMonde = {
      ...MONDE,
      liaisons: [
        { id: 'grille', nom: 'grille', entre: ['quai', 'local'], ouverte: false, cachee: 'cabine', manoeuvre: 'soute' },
        { id: 'porte', nom: 'porte', entre: ['quai', 'soute'], ouverte: true },
        { id: 'panneau', nom: 'panneau', entre: ['local', 'soute'], ouverte: true, cachee: 'soute' },
        { id: 'ecoutille', nom: 'ecoutille', entre: ['quai', 'cabine'], ouverte: true },
      ],
      objets: [
        { id: 'console', nom: 'console', piece: 'local', alimente: 'bloc' },
        { id: 'bloc', nom: 'bloc', piece: 'local', large: true, source: true },
        { id: 'capsule', nom: 'capsule', piece: 'quai', capsule: { interieur: 'quai' } },
        { id: 'pupitre', nom: 'pupitre', piece: 'local', portable: false, depart: 'capsule' },
      ],
      assistance: [
        { id: 'a', quand: { type: 'reveil' } },
        { id: 'a', quand: { type: 'arrivee', piece: 'nulle-part' } },
      ],
    };
    expect(validerMonde(casse)).toEqual([
      'grille : cachée d\'une pièce qu\'elle ne relie pas.',
      'grille : manoeuvrée d\'une pièce qu\'elle ne relie pas.',
      'panneau : cachée mais ouverte au départ.',
      'console : alimente autre chose qu\'une capsule.',
      'console : console portable.',
      'capsule : intérieur dans la pièce de la capsule.',
      'capsule : capsule portable.',
      'pupitre : pupitre hors de l\'intérieur de sa capsule.',
      'a : message d\'assistance en double.',
      'a : pièce inconnue nulle-part.',
    ]);
    const isolee: DefMonde = {
      ...MONDE,
      objets: [
        { id: 'capsule', nom: 'capsule', piece: 'local', portable: false, capsule: { interieur: 'cabine' } },
        { id: 'pupitre', nom: 'pupitre', piece: 'cabine', portable: false, depart: 'quai' },
        { id: 'console', nom: 'console', piece: 'local', portable: false, capsule: { interieur: 'nulle-part' } },
      ],
    };
    expect(validerMonde(isolee)).toEqual([
      'capsule : aucune liaison vers son intérieur.',
      'pupitre : lance autre chose qu\'une capsule.',
      'console : intérieur inconnu nulle-part.',
      'console : aucune liaison vers son intérieur.',
    ]);
  });

  it('sous-position : jamais pièce de départ', () => {
    const pieces = MONDE.pieces.map((piece) => (piece.id === 'cabine' ? { ...piece, sousPosition: true } : piece));
    expect(validerMonde({ ...MONDE, pieces })).toEqual([]);
    expect(validerMonde({ ...MONDE, pieces, depart: 'cabine' })).toContain('Départ dans une sous-position.');
  });
});

describe('sous-position (C-02 §2)', () => {
  it('y entrer ne découvre aucune pièce et ne l’ajoute pas aux pièces visitées ; le reste est inchangé', () => {
    const SOUS: DefMonde = { ...MONDE, pieces: MONDE.pieces.map((piece) => (piece.id === 'cabine' ? { ...piece, sousPosition: true } : piece)) };
    const depart = partie(SOUS);
    const choix = option(depart, 'aller', 'ecoutille', SOUS);
    if (choix === undefined) throw new Error('Option aller ecoutille absente.');
    const resultat = jouer(SOUS, depart, choix.commande);
    if (resultat.type !== 'engagee') throw new Error(`aller ecoutille : ${resultat.type}.`);
    expect(types(resultat.evenements)).toEqual(['deplacement']);
    const vue = observer(SOUS, resultat.partie.etat);
    expect(vue.piece.nom).toBe('cabine');
    expect(vue.visitees.map((piece) => piece.nom)).toEqual(['quai']);
    // Pièce ordinaire : la même entrée la découvre.
    expect(types(engager(depart, 'aller', 'ecoutille').evenements)).toEqual(['deplacement', 'piece_decouverte']);
  });
});

describe('passages sans signalétique et cachés (C-06 §3, K-05)', () => {
  it('sans signalétique : destination inconnue et sans risque annoncé, apprise des deux côtés en franchissant', () => {
    const depart = partie();
    expect(passage(depart, 'grille')).toMatchObject({ vers: null, signale: false, ouvert: true });
    expect(passage(depart, 'porte')).toMatchObject({ vers: { nom: 'soute' }, signale: true });
    const choix = option(depart, 'aller', 'grille');
    const prevu = choix === undefined ? null : apercu(MONDE, depart, choix.commande);
    expect(prevu).toMatchObject({ type: 'apercu', apercu: { risque: 'aucun', danger: null } });
    const { partie: local, evenements } = engager(depart, 'aller', 'grille');
    expect(types(evenements)).toEqual(['deplacement', 'piece_decouverte', 'assistance']);
    expect(passage(local, 'grille')).toMatchObject({ vers: { nom: 'quai' }, signale: false });
    expect(passage(engager(local, 'aller', 'grille').partie, 'grille')).toMatchObject({ vers: { nom: 'local' } });
  });

  it('caché : invisible de son côté caché, exactement comme s’il n’existait pas ; refusé sans le trahir', () => {
    const soute = suite(partie(), [['aller', 'porte']]);
    const sansPanneau: DefMonde = { ...MONDE, liaisons: MONDE.liaisons.filter((liaison) => liaison.id !== 'panneau') };
    expect(observer(MONDE, soute.etat)).toEqual(observer(sansPanneau, soute.etat));
    const panneau = idPublic(MONDE.id, 'panneau');
    for (const action of ['ouvrir', 'aller', 'regarder'] as const) {
      expect(jouer(MONDE, soute, { action, cible: panneau })).toMatchObject({ type: 'refus', raison: 'cible_absente', partie: soute });
    }
  });

  it('caché : vu fermé et sans destination de l’autre côté ; l’ouvrir le découvre, des deux côtés', () => {
    const local = suite(partie(), VERS_LOCAL);
    expect(passage(local, 'panneau')).toMatchObject({ vers: null, signale: false, ouvert: false });
    expect(option(local, 'aller', 'panneau')).toBeUndefined();
    const { partie: ouvert, evenements } = engager(local, 'ouvrir', 'panneau');
    expect(types(evenements)).toEqual(['passage_ouvert', 'passage_decouvert']);
    expect(evenements[1]).toMatchObject({ passage: { vers: { nom: 'soute' } } });
    const soute = engager(ouvert, 'aller', 'panneau').partie;
    expect(passage(soute, 'panneau')).toMatchObject({ vers: { nom: 'local' }, ouvert: true });
    expect(option(soute, 'fermer', 'panneau')?.disponible).toBe(true);
  });

  it('manoeuvre : l’écoutille ne s’ouvre ni ne se ferme que de l’intérieur', () => {
    const quai = partie();
    expect(option(quai, 'fermer', 'ecoutille')).toBeUndefined();
    expect(jouer(MONDE, quai, { action: 'fermer', cible: idPublic(MONDE.id, 'ecoutille') })).toMatchObject({ type: 'refus', raison: 'cible_absente' });
    const cabine = suite(quai, A_BORD);
    expect(passage(cabine, 'ecoutille')).toMatchObject({ ouvert: false });
    expect(option(cabine, 'ouvrir', 'ecoutille')?.disponible).toBe(true);
  });
});

describe('gabarit large (C-02 §3, D-044)', () => {
  it('un objet large porté ne passe pas un passage étroit, même sans destination connue ; refus sans effet', () => {
    const charge = suite(partie(), [['aller', 'grille'], ['prendre', 'bloc']]);
    expect(option(charge, 'aller', 'grille')).toMatchObject({ disponible: false, raison: 'trop_large' });
    const refus = jouer(MONDE, charge, { action: 'aller', cible: idPublic(MONDE.id, 'grille') });
    expect(refus).toMatchObject({ type: 'refus', raison: 'trop_large', partie: charge });
    const pose = engager(charge, 'poser', 'bloc').partie;
    expect(option(pose, 'aller', 'grille')?.disponible).toBe(true);
  });
});

describe('circuit, source et capsule (AR-01 §11.2)', () => {
  it('messages de l’IA : au réveil, à la première arrivée seulement', () => {
    const depart = partie();
    expect(types(depart.derniers)).toEqual(['reveil', 'assistance']);
    expect(observer(MONDE, depart.etat).messages).toEqual(['bienvenue']);
    const retour = suite(depart, [['aller', 'grille'], ['aller', 'grille']]);
    expect(types(engager(retour, 'aller', 'grille').evenements)).toEqual(['deplacement']);
    expect(observer(MONDE, retour.etat).messages).toEqual(['bienvenue', 'local']);
  });

  it('réarmer la console est bruyant et ne se refait pas', () => {
    const local = suite(partie(), VERS_LOCAL);
    const choix = option(local, 'activer', 'console');
    expect(choix === undefined ? null : apercu(MONDE, local, choix.commande)).toMatchObject({
      type: 'apercu',
      apercu: { cout: 'bruyant', savoir: [{ type: 'alimentera', objet: { nom: 'capsule' } }] },
    });
    const { partie: arme, evenements } = engager(local, 'activer', 'console');
    expect(types(evenements)).toEqual(['circuit_active']);
    expect(option(arme, 'activer', 'console')).toMatchObject({ disponible: false, raison: 'deja_actif' });
    expect(observer(MONDE, local.etat).actives).toEqual([]);
    expect(observer(MONDE, arme.etat).actives.map((objet) => objet.nom)).toEqual(['console']);
    // Visible là où se trouve la console seulement.
    expect(observer(MONDE, engager(arme, 'aller', 'grille').partie.etat).actives).toEqual([]);
  });

  it('installer : seulement une source portée, devant une capsule ; elle quitte les mains', () => {
    const local = suite(partie(), [['aller', 'grille'], ['prendre', 'bloc']]);
    expect(option(local, 'installer', 'bloc')).toBeUndefined();
    const quai = suite(partie(), BLOC_AU_QUAI);
    const { partie: installe, evenements } = engager(quai, 'installer', 'bloc');
    expect(evenements).toMatchObject([{ type: 'objet_installe', objet: { nom: 'bloc' }, capsule: { nom: 'capsule' } }]);
    expect(observer(MONDE, installe.etat).inventaire).toEqual([]);
    expect(observer(MONDE, installe.etat).objets.map((objet) => objet.nom)).toEqual(['capsule']);
    expect(option(installe, 'prendre', 'bloc')).toBeUndefined();
    expect(observer(MONDE, quai.etat).installes).toEqual([]);
    expect(observer(MONDE, installe.etat).installes).toMatchObject([{ objet: { nom: 'bloc' }, capsule: { nom: 'capsule' } }]);
    // Visible là où se trouve la capsule seulement.
    expect(observer(MONDE, engager(installe, 'aller', 'grille').partie.etat).installes).toEqual([]);
  });

  it('lancer : refusé sans alimentation, puis écoutille ouverte ; sinon évacuation sans dé, message une fois, partie close', () => {
    const vide = suite(partie(), [['aller', 'ecoutille']]);
    expect(option(vide, 'lancer', 'pupitre')).toMatchObject({ disponible: false, raison: 'non_alimentee' });
    const arme = suite(partie(), [['aller', 'grille'], ['activer', 'console'], ['aller', 'grille'], ['aller', 'ecoutille']]);
    expect(option(arme, 'lancer', 'pupitre')).toMatchObject({ disponible: false, raison: 'non_isolee' });
    expect(jouer(MONDE, arme, { action: 'lancer', cible: idPublic(MONDE.id, 'pupitre') })).toMatchObject({ type: 'refus', raison: 'non_isolee', partie: arme });
    const close = engager(arme, 'fermer', 'ecoutille').partie;
    const fin = engager(close, 'lancer', 'pupitre');
    expect(fin.tirages).toEqual([]);
    expect(fin.evenements).toEqual([{ type: 'evacuation', sources: ['circuit'] }, { type: 'assistance', message: 'depart' }]);
    const vue = observer(MONDE, fin.partie.etat);
    expect(vue).toMatchObject({ terminee: true, issue: 'evacuation', menu: [], messages: ['bienvenue', 'local', 'depart'] });
    expect(jouer(MONDE, fin.partie, { action: 'regarder', cible: idPublic(MONDE.id, 'cabine') })).toMatchObject({ type: 'refus', raison: 'partie_terminee' });
  });

  it('historique : chaque message reçu avec son moment prévu, dans l’ordre, sans heure (12 §3.9)', () => {
    expect(historique(MONDE, partie().etat)).toEqual([{ message: 'bienvenue', moment: { type: 'reveil', piece: { sorte: 'piece', id: idPublic(MONDE.id, 'quai'), nom: 'quai' } } }]);
    const fin = engager(suite(partie(), [['aller', 'grille'], ['activer', 'console'], ['aller', 'grille'], ...A_BORD]), 'lancer', 'pupitre').partie;
    expect(historique(MONDE, fin.etat)).toEqual([
      { message: 'bienvenue', moment: { type: 'reveil', piece: { sorte: 'piece', id: idPublic(MONDE.id, 'quai'), nom: 'quai' } } },
      { message: 'local', moment: { type: 'arrivee', piece: { sorte: 'piece', id: idPublic(MONDE.id, 'local'), nom: 'local' } } },
      { message: 'depart', moment: { type: 'evacuation' } },
    ]);
  });

  it('lancer : un bloc installé suffit ; circuit et bloc ensemble sont tous deux nommés', () => {
    const bloc = suite(partie(), [...BLOC_AU_QUAI, ['installer', 'bloc'], ...A_BORD]);
    expect(engager(bloc, 'lancer', 'pupitre').evenements[0]).toEqual({ type: 'evacuation', sources: ['bloc'] });
    const deux = suite(partie(), [
      ['aller', 'grille'],
      ['activer', 'console'],
      ['prendre', 'bloc'],
      ['ouvrir', 'panneau'],
      ['aller', 'panneau'],
      ['aller', 'porte'],
      ['installer', 'bloc'],
      ...A_BORD,
    ]);
    expect(engager(deux, 'lancer', 'pupitre').evenements[0]).toEqual({ type: 'evacuation', sources: ['circuit', 'bloc'] });
  });

  it('lancer : refusé quand la créature est à bord', () => {
    const avecCreature: DefMonde = { ...MONDE, creature: { piece: 'soute' } };
    const depart = partie(avecCreature);
    const etat = {
      ...depart.etat,
      piece: 'cabine',
      actives: ['console'],
      liaisons: { ...depart.etat.liaisons, ecoutille: false },
      creature: { piece: 'cabine', ...CALME },
    };
    const aBord: Partie = { ...depart, etat };
    expect(option(aBord, 'lancer', 'pupitre', avecCreature)).toMatchObject({ disponible: false, raison: 'creature_a_bord' });
  });
});

describe('message de patience (#225)', () => {
  const attendre = (courante: Partie, fois: number): { partie: Partie; messages: string[] } => {
    let suivante = courante;
    const messages: string[] = [];
    for (let rang = 0; rang < fois; rang += 1) {
      const pas = engager(suivante, 'attendre', 'quai');
      suivante = pas.partie;
      messages.push(...pas.evenements.flatMap((evenement) => (evenement.type === 'assistance' ? [`${rang + 1}:${evenement.message}`] : [])));
    }
    return { partie: suivante, messages };
  };

  it('à la 15e attente de suite seulement, une fois par partie, daté « en attendant » ; une autre action remet la série à zéro', () => {
    const coupee = attendre(engager(attendre(partie(), 14).partie, 'fermer', 'porte').partie, 14);
    expect(coupee.messages).toEqual([]);
    const longue = attendre(coupee.partie, 16);
    expect(longue.messages).toEqual(['1:patience']);
    expect(historique(MONDE, longue.partie.etat).at(-1)).toEqual({ message: 'patience', moment: { type: 'patience' } });
    expect(attendre(engager(longue.partie, 'ouvrir', 'porte').partie, 15).messages).toEqual([]);
  });
});
