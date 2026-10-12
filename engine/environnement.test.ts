import {
  apercu,
  empreinteEtat,
  idPublic,
  jouer,
  nouvellePartie,
  observer,
  reprendrePartie,
  validerMonde,
  type DefMonde,
  type EtatCreature,
  type Evenement,
  type IdAction,
  type OptionMenu,
  type Partie,
} from './index';

// Feu, huile, avertisseur et appui stable (C-03 §5.1 à §5.3, C-02 §5, D-188 à D-190).
// Fixture réduite d'AR-01 ; les noms ne servent qu'à retrouver les options du menu : aucune règle ne lit un nom (D-078).
//
//   salon ══porte_sa══ atelier ══grille_ap (haute côté atelier, étroite)══ local ══cloison_po (grippée)══ observation ══porte_oe══ embarquement
//     ╚══cloison_sg══ galerie (en feu) ══cloison_gp══ local
const MONDE: DefMonde = {
  id: 'essai-environnement',
  depart: 'salon',
  pieces: [
    { id: 'salon', nom: 'salon' },
    { id: 'atelier', nom: 'atelier' },
    { id: 'galerie', nom: 'galerie', feu: true },
    { id: 'local', nom: 'local' },
    { id: 'observation', nom: 'observation' },
    { id: 'embarquement', nom: 'embarquement' },
  ],
  liaisons: [
    { id: 'sa', nom: 'porte_sa', entre: ['salon', 'atelier'], ouverte: true },
    { id: 'sg', nom: 'cloison_sg', entre: ['salon', 'galerie'], ouverte: false },
    { id: 'gp', nom: 'cloison_gp', entre: ['galerie', 'local'], ouverte: false },
    { id: 'ap', nom: 'grille_ap', entre: ['atelier', 'local'], ouverte: false, etroite: true, sonAuTravers: true, haute: 'atelier' },
    { id: 'po', nom: 'cloison_po', entre: ['local', 'observation'], ouverte: false, bruyante: true },
    { id: 'oe', nom: 'porte_oe', entre: ['observation', 'embarquement'], ouverte: true },
  ],
  positions: [
    { id: 'sous-grille', nom: 'sous_grille', piece: 'atelier', sous: 'ap' },
    { id: 'centre', nom: 'centre', piece: 'atelier' },
  ],
  objets: [
    { id: 'caisse', nom: 'caisse', piece: 'atelier', position: 'centre', portable: false, deplacable: true, appui: true },
    { id: 'eau', nom: 'eau', piece: 'atelier', extinction: 1 },
    { id: 'huile', nom: 'huile', piece: 'atelier', glissant: 1 },
    { id: 'test', nom: 'avertisseur', piece: 'local', portable: false, avertisseur: { piece: 'observation' } },
  ],
  creature: { piece: 'observation' },
};
const VERSION = 'environnement-1';

const CALME: Omit<EtatCreature, 'piece'> = { indice: null, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null };

function partie(monde: DefMonde = MONDE, graine = 7): Partie {
  return nouvellePartie(monde, { version: VERSION, graine });
}

/** Partie placée à la main : pièce du passager, objets portés, créature. */
function placee(monde: DefMonde, changement: Partial<Partie['etat']>): Partie {
  const depart = partie(monde);
  return { ...depart, etat: { ...depart.etat, ...changement } };
}

/** Option du menu public : action, cible nommée (un passage par lui-même ou sa destination), paramètre nommé le cas échéant. */
function option(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string): OptionMenu | undefined {
  const nomme = (cible: OptionMenu['cible'] | undefined, attendu: string): boolean =>
    cible !== undefined && (cible.nom === attendu || (cible.sorte === 'passage' && cible.vers?.nom === attendu));
  return observer(monde, courante.etat).menu.find(
    (choix) => choix.action === action && nomme(choix.cible, nom) && (parametre === undefined || nomme(choix.parametre, parametre)),
  );
}

function engager(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string): { partie: Partie; evenements: readonly Evenement[] } {
  const choix = option(monde, courante, action, nom, parametre);
  if (choix === undefined || !choix.disponible) throw new Error(`Option ${action} ${nom} ${parametre ?? ''} absente ou indisponible.`);
  const resultat = jouer(monde, courante, choix.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return { partie: resultat.partie, evenements: resultat.evenements };
}

type Geste = readonly [IdAction, string] | readonly [IdAction, string, string];

function suite(monde: DefMonde, depart: Partie, gestes: readonly Geste[]): { partie: Partie; evenements: (readonly Evenement[])[] } {
  let courante = depart;
  const evenements: (readonly Evenement[])[] = [];
  for (const [action, nom, parametre] of gestes) {
    const pas = engager(monde, courante, action, nom, parametre);
    courante = pas.partie;
    evenements.push(pas.evenements);
  }
  return { partie: courante, evenements };
}

function types(evenements: readonly Evenement[]): string[] {
  return evenements.map((evenement) => evenement.type);
}

function apercuDe(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string) {
  const choix = option(monde, courante, action, nom, parametre);
  if (choix === undefined) throw new Error(`Option ${action} ${nom} absente.`);
  const resultat = apercu(monde, courante, choix.commande);
  if (resultat.type !== 'apercu') throw new Error(`Aperçu ${action} ${nom} : ${resultat.type}.`);
  return resultat.apercu;
}

describe('monde : qualités et positions (C-02 §2, §5)', () => {
  it('la fixture est valide ; positions, qualités par dose et avertisseur sont contrôlés', () => {
    expect(validerMonde(MONDE)).toEqual([]);
    const casse: DefMonde = {
      ...MONDE,
      positions: [{ id: 'sous-grille', nom: 'sous_grille', piece: 'atelier', sous: 'po' }],
      objets: [
        { id: 'caisse', nom: 'caisse', piece: 'atelier', position: 'centre', deplacable: true },
        { id: 'eau', nom: 'eau', piece: 'atelier', extinction: 1, glissant: 1 },
        { id: 'test', nom: 'avertisseur', piece: 'local', avertisseur: { piece: 'nulle-part' } },
      ],
    };
    expect(validerMonde(casse)).toEqual([
      'sous-grille : sous une liaison qui n\'est pas haute de ce côté.',
      'caisse : déplaçable mais portable.',
      'caisse : position hors de sa pièce.',
      'eau : plus d\'une qualité par dose.',
      'test : émetteur dans une pièce inconnue.',
      'test : avertisseur portable.',
    ]);
  });

  it('une caisse ou un dispositif fixe ne se prend pas ; le menu propose une option par position possible', () => {
    const atelier = engager(MONDE, partie(), 'aller', 'atelier').partie;
    expect(option(MONDE, atelier, 'prendre', 'caisse')).toBeUndefined();
    const positions = observer(MONDE, atelier.etat).menu.filter((choix) => choix.action === 'deplacer').map((choix) => choix.parametre?.nom);
    expect(positions).toEqual(['sous_grille']);
    expect(observer(MONDE, atelier.etat).placements).toEqual([{ objet: expect.objectContaining({ nom: 'caisse' }), position: expect.objectContaining({ nom: 'centre' }) }]);
  });
});

describe('appui stable sous la grille haute (C-02 §5, AR-01 P-A, W-01)', () => {
  it('sans appui dessous, la grille est hors de portée ; déplacer la caisse, ouvrir, traverser : trois engagements', () => {
    const atelier = engager(MONDE, partie(), 'aller', 'atelier').partie;
    expect(option(MONDE, atelier, 'ouvrir', 'grille_ap')).toMatchObject({ disponible: false, raison: 'hors_de_portee' });
    const refus = jouer(MONDE, atelier, { action: 'ouvrir', cible: idPublic(MONDE.id, 'ap') });
    expect(refus).toMatchObject({ type: 'refus', raison: 'hors_de_portee' });
    const { partie: fin, evenements } = suite(MONDE, atelier, [
      ['deplacer', 'caisse', 'sous_grille'],
      ['ouvrir', 'grille_ap'],
      ['aller', 'local'],
    ]);
    expect(types(evenements[0] ?? [])).toEqual(['objet_deplace']);
    expect(fin.etat.piece).toBe('local');
    expect(fin.etat.actions).toBe(4);
    // Côté local, la grille n'est pas haute : on la ferme sans appui.
    expect(option(MONDE, fin, 'fermer', 'grille_ap')).toMatchObject({ disponible: true });
  });

  it('W-01 : un autre objet « appui stable » rend la grille atteignable ; sans la qualité, la caisse ne suffit pas', () => {
    const escabeau: DefMonde = {
      ...MONDE,
      objets: MONDE.objets.map((objet) => (objet.id === 'caisse' ? { ...objet, nom: 'escabeau' } : objet)),
    };
    const atelier = engager(escabeau, partie(escabeau), 'aller', 'atelier').partie;
    const pret = engager(escabeau, atelier, 'deplacer', 'escabeau', 'sous_grille').partie;
    expect(option(escabeau, pret, 'ouvrir', 'grille_ap')).toMatchObject({ disponible: true });

    const sansAppui: DefMonde = { ...MONDE, objets: MONDE.objets.map((objet) => (objet.id === 'caisse' ? { ...objet, appui: false } : objet)) };
    const dessous = engager(sansAppui, engager(sansAppui, partie(sansAppui), 'aller', 'atelier').partie, 'deplacer', 'caisse', 'sous_grille').partie;
    expect(option(sansAppui, dessous, 'ouvrir', 'grille_ap')).toMatchObject({ disponible: false, raison: 'hors_de_portee' });
  });

  it('un paramètre absent, inconnu ou impossible est refusé sans engagement', () => {
    const atelier = engager(MONDE, partie(), 'aller', 'atelier').partie;
    const caisse = idPublic(MONDE.id, 'caisse');
    for (const parametre of [undefined, 'e00000000', idPublic(MONDE.id, 'centre')]) {
      const resultat = jouer(MONDE, atelier, { action: 'deplacer', cible: caisse, ...(parametre === undefined ? {} : { parametre }) });
      expect(resultat).toMatchObject({ type: 'refus', raison: 'parametre_absent' });
      expect(resultat.partie).toBe(atelier);
    }
    expect(jouer(MONDE, atelier, { action: 'prendre', cible: idPublic(MONDE.id, 'eau'), parametre: caisse })).toMatchObject({
      type: 'refus',
      raison: 'commande_invalide',
    });
  });
});

describe('feu confiné et propagation (C-03 §5.3, D-188)', () => {
  /** Eau en main, au salon, la cloison de la galerie encore fermée. */
  const avecEau = (): Partie => suite(MONDE, partie(), [['aller', 'atelier'], ['prendre', 'eau'], ['aller', 'salon']]).partie;

  it('T-02 : ouvrir sur la galerie montre le feu ; l\'éteindre depuis le seuil au pas suivant : aucune extension au salon', () => {
    const ouvert = engager(MONDE, avecEau(), 'ouvrir', 'galerie');
    expect(types(ouvert.evenements)).toEqual(['passage_ouvert', 'feu_derriere']);
    expect(ouvert.partie.etat.expositions).toEqual(['sg']);
    expect(observer(MONDE, ouvert.partie.etat).passages.find((passage) => passage.nom === 'cloison_sg')).toMatchObject({ feu: true });
    expect(apercuDe(MONDE, ouvert.partie, 'arroser', 'eau', 'galerie').savoir).toEqual([
      { type: 'eteindra', piece: expect.objectContaining({ nom: 'galerie' }) },
      { type: 'videra', objet: expect.objectContaining({ nom: 'eau' }) },
    ]);
    const eteint = engager(MONDE, ouvert.partie, 'arroser', 'eau', 'galerie');
    expect(types(eteint.evenements)).toEqual(['feu_eteint']);
    expect(eteint.partie.etat.feu).toEqual([]);
    expect(eteint.partie.etat.expositions).toEqual([]);
    expect(eteint.partie.etat.doses.eau).toBe(0);
    expect(option(MONDE, eteint.partie, 'arroser', 'eau')).toBeUndefined();
    // Passage désormais sûr (AR-01 P-B pas 6).
    const galerie = engager(MONDE, eteint.partie, 'aller', 'galerie');
    expect(galerie.partie.etat.sante).toBe('indemne');
  });

  it('T-03 : ouvrir puis un autre geste : à la deuxième fin d\'action, seule la pièce voisine prend feu', () => {
    const { partie: fin, evenements } = suite(MONDE, avecEau(), [['ouvrir', 'galerie'], ['aller', 'atelier']]);
    expect(fin.etat.feu).toEqual(['salon', 'galerie']);
    // Le passager voit le salon par la porte ouverte.
    expect(types(evenements[1] ?? [])).toContain('feu_gagne');
    expect(fin.etat.sante).toBe('indemne');
    // Pièce nouvellement en feu : pas de propagation dans la même étape ; l'exposition vers l'atelier commence au pas suivant.
    expect(fin.etat.expositions).toEqual([]);
    const apres = engager(MONDE, fin, 'poser', 'eau').partie;
    expect(apres.etat.expositions).toEqual(['sa']);
    expect(apres.etat.feu).toEqual(['salon', 'galerie']);
  });

  it('fermer la cloison interrompt l\'exposition : rouvrir recommence le compte', () => {
    const { partie: fin } = suite(MONDE, avecEau(), [['ouvrir', 'galerie'], ['fermer', 'galerie'], ['ouvrir', 'galerie']]);
    expect(fin.etat.feu).toEqual(['galerie']);
    expect(fin.etat.expositions).toEqual(['sg']);
  });

  it('deux liaisons exposées gagnent leurs deux pièces dans la même mise à jour ; l\'aperçu ne dépend pas d\'une liaison cachée', () => {
    const ouverte = avecEau();
    const apercus = [true, false].map((cachee) => {
      const etat = { ...ouverte.etat, liaisons: { ...ouverte.etat.liaisons, sg: true, gp: cachee }, expositions: cachee ? ['gp', 'sg'] : ['sg'] };
      const courante = { ...ouverte, etat };
      const resultat = jouer(MONDE, courante, option(MONDE, courante, 'poser', 'eau')?.commande);
      if (resultat.type !== 'engagee') throw new Error('Poser non engagé.');
      return { apercu: apercuDe(MONDE, courante, 'poser', 'eau'), feu: resultat.partie.etat.feu };
    });
    expect(apercus.map(({ apercu }) => apercu.danger)).toEqual([{ type: 'brulure' }, { type: 'brulure' }]);
    expect(apercus.map(({ feu }) => feu)).toEqual([['salon', 'galerie', 'local'], ['salon', 'galerie']]);
  });

  it('D-188 : le feu gagne la pièce du passager : brûlure certaine, annoncée, puis une à chaque action tant qu\'il y reste', () => {
    const ouvert = engager(MONDE, avecEau(), 'ouvrir', 'galerie').partie;
    expect(apercuDe(MONDE, ouvert, 'poser', 'eau')).toMatchObject({ risque: 'certain', danger: { type: 'brulure' } });
    // Fermer la cloison ou éteindre évite la brûlure : rien n'est annoncé.
    expect(apercuDe(MONDE, ouvert, 'fermer', 'galerie')).toMatchObject({ risque: 'aucun', danger: null });
    expect(apercuDe(MONDE, ouvert, 'arroser', 'eau', 'galerie')).toMatchObject({ risque: 'aucun', danger: null });
    const brule = engager(MONDE, ouvert, 'poser', 'eau');
    expect(types(brule.evenements)).toEqual(['objet_pose', 'feu_gagne', 'aggravation_blesse']);
    expect(brule.evenements.at(-1)).toEqual({ type: 'aggravation_blesse', causes: ['feu'] });
    expect(observer(MONDE, brule.partie.etat).feu).toBe(true);
    expect(apercuDe(MONDE, brule.partie, 'prendre', 'eau')).toMatchObject({ risque: 'certain', danger: { type: 'brulure' } });
    const encore = engager(MONDE, brule.partie, 'prendre', 'eau');
    expect(encore.partie.etat.sante).toBe('critique');
    // Critique, une brûlure de plus serait fatale ; le feu, qui expose déjà l'atelier, l'y rattraperait.
    expect(apercuDe(MONDE, encore.partie, 'poser', 'eau')).toMatchObject({ risque: 'certain', danger: { type: 'brulure_mortelle' } });
    expect(apercuDe(MONDE, encore.partie, 'aller', 'atelier')).toMatchObject({ risque: 'certain', danger: { type: 'brulure_mortelle' } });
    // Sortir tout de suite vers une pièce que le feu n'expose pas encore ne brûle pas.
    expect(apercuDe(MONDE, brule.partie, 'aller', 'atelier')).toMatchObject({ risque: 'aucun' });
    const sorti = engager(MONDE, brule.partie, 'aller', 'atelier');
    expect(sorti.partie.etat.sante).toBe('blesse');
  });

  it('D-188 : entrer dans une pièce en feu est possible, la brûlure est annoncée certaine puis appliquée', () => {
    const ouvert = engager(MONDE, avecEau(), 'ouvrir', 'galerie').partie;
    expect(apercuDe(MONDE, ouvert, 'aller', 'galerie')).toMatchObject({ risque: 'certain', danger: { type: 'brulure' } });
    const dedans = engager(MONDE, ouvert, 'aller', 'galerie');
    expect(dedans.evenements.at(-1)).toEqual({ type: 'aggravation_blesse', causes: ['feu'] });
    // Éteindre la pièce où l'on est évite la brûlure de cette action ; le salon, gagné entre-temps, brûle toujours.
    expect(apercuDe(MONDE, dedans.partie, 'arroser', 'eau', 'galerie')).toMatchObject({ risque: 'aucun' });
    const eteint = engager(MONDE, dedans.partie, 'arroser', 'eau', 'galerie');
    expect(eteint.partie.etat.sante).toBe('blesse');
    expect(eteint.partie.etat.feu).toEqual(['salon']);
  });

  it('T-08 : fuite exposée vers le feu : un seul jet, une seule aggravation qui garde ses deux causes (C-04 §3, RSK-04)', () => {
    const exposes = Array.from({ length: 20 }, (_, graine) => {
      const depart = partie(MONDE, graine);
      const sous = {
        ...depart,
        etat: {
          ...depart.etat,
          liaisons: { ...depart.etat.liaisons, sg: true },
          creature: { ...CALME, piece: 'salon', contact: true },
        },
      };
      const resultat = jouer(MONDE, sous, option(MONDE, sous, 'aller', 'galerie')?.commande);
      if (resultat.type !== 'engagee') throw new Error('Fuite non engagée.');
      return resultat;
    });
    for (const resultat of exposes) {
      expect(resultat.tirages).toHaveLength(1);
      const aggravations = resultat.evenements.filter((evenement) => evenement.type.startsWith('aggravation') || evenement.type === 'defaite');
      expect(aggravations).toHaveLength(1);
      const atteint = (resultat.tirages[0] ?? 6) <= 3;
      expect(aggravations[0]).toEqual({ type: 'aggravation_blesse', causes: atteint ? ['griffes', 'feu'] : ['feu'] });
    }
    expect(new Set(exposes.map((resultat) => (resultat.tirages[0] ?? 6) <= 3)).size).toBe(2);
  });

  it('D-189 : la créature ne traverse jamais une pièce en feu ; elle attend du côté où elle est', () => {
    // Le seul chemin du bruit vers le salon passe par la galerie en feu.
    const monde: DefMonde = {
      ...MONDE,
      liaisons: MONDE.liaisons.map((liaison) => (['sg', 'gp'].includes(liaison.id) ? { ...liaison, ouverte: true } : liaison.id === 'sa' ? { ...liaison, bruyante: true, ouverte: false } : liaison)),
      creature: { piece: 'local' },
    };
    const bruit = engager(monde, partie(monde), 'ouvrir', 'atelier');
    expect(types(bruit.evenements)).toContain('bruit_mecanisme');
    expect(bruit.partie.etat.creature?.piece).toBe('local');
    expect(bruit.partie.etat.creature?.indice).toEqual({ piece: 'salon', par: null });
  });

  it('OP-03 : le feu gagne la pièce derrière une grille jamais franchie : flammes derrière la grille, pièce jamais nommée', () => {
    const grille: DefMonde = { ...MONDE, liaisons: MONDE.liaisons.map((liaison) => (liaison.id === 'ap' ? { ...liaison, sansSignaletique: true } : liaison)) };
    const ouverte = suite(grille, partie(grille), [['aller', 'atelier'], ['prendre', 'eau'], ['deplacer', 'caisse', 'sous_grille'], ['ouvrir', 'grille_ap']]).partie;
    // Placé à la main : la cloison entre la galerie en feu et le local, ouverte depuis une fin d'action (exposition déjà comptée).
    const exposee = (decouvertes: readonly string[]): Partie => ({
      ...ouverte,
      etat: { ...ouverte.etat, liaisons: { ...ouverte.etat.liaisons, gp: true }, expositions: ['gp'], decouvertes },
    });
    const gagne = engager(grille, exposee([]), 'prendre', 'huile');
    expect(gagne.partie.etat.feu).toEqual(['galerie', 'local']);
    expect(gagne.evenements.filter((evenement) => evenement.type.startsWith('feu'))).toEqual([
      { type: 'feu_derriere', passage: expect.objectContaining({ nom: 'grille_ap', vers: null, feu: true }) },
    ]);
    const arroser = option(grille, gagne.partie, 'arroser', 'eau', 'grille_ap');
    expect(arroser?.parametre).toMatchObject({ sorte: 'passage', vers: null });
    expect(apercuDe(grille, gagne.partie, 'arroser', 'eau', 'grille_ap').savoir[0]).toEqual({
      type: 'eteindra',
      piece: expect.objectContaining({ sorte: 'passage', nom: 'grille_ap', vers: null }),
    });
    const eteint = engager(grille, gagne.partie, 'arroser', 'eau', 'grille_ap');
    expect(eteint.partie.etat.feu).toEqual(['galerie']);
    expect(eteint.evenements).toEqual([{ type: 'feu_eteint', piece: expect.objectContaining({ sorte: 'passage', nom: 'grille_ap', vers: null }) }]);
    // Destination connue (déjà franchie) : la pièce se nomme.
    const connue = engager(grille, exposee(['ap']), 'prendre', 'huile');
    expect(connue.evenements.filter((evenement) => evenement.type.startsWith('feu'))).toEqual([
      { type: 'feu_gagne', piece: expect.objectContaining({ nom: 'local' }) },
    ]);
    expect(apercuDe(grille, connue.partie, 'arroser', 'eau', 'local').savoir[0]).toEqual({
      type: 'eteindra',
      piece: expect.objectContaining({ sorte: 'piece', nom: 'local' }),
    });
  });
});

describe('sol huilé et glissade (C-03 §5.2, D-190)', () => {
  /** Huile en main, au local ; la créature est dans l'observation, derrière la cloison grippée. */
  const auLocal = (): Partie => placee(MONDE, { piece: 'local', visitees: ['salon', 'local'], objets: { ...partie().etat.objets, huile: { type: 'passager' } } });

  it('verser au pied d\'une cloison fermée, de son côté : sol glissant connu, récipient vide', () => {
    const avant = auLocal();
    expect(apercuDe(MONDE, avant, 'verser', 'huile', 'cloison_po').savoir).toEqual([
      { type: 'huilera', passage: expect.objectContaining({ nom: 'cloison_po' }) },
      { type: 'videra', objet: expect.objectContaining({ nom: 'huile' }) },
    ]);
    const verse = engager(MONDE, avant, 'verser', 'huile', 'cloison_po');
    expect(types(verse.evenements)).toEqual(['huile_versee']);
    expect(verse.partie.etat.huile).toEqual([{ liaison: 'po', piece: 'local' }]);
    expect(observer(MONDE, verse.partie.etat).passages.find((passage) => passage.nom === 'cloison_po')).toMatchObject({ huile: true });
    expect(option(MONDE, verse.partie, 'verser', 'huile', 'cloison_po')).toBeUndefined();
    expect(option(MONDE, verse.partie, 'verser', 'huile', 'cloison_gp')).toMatchObject({ disponible: false, raison: 'vide' });
  });

  it('T-05 : elle se précipite au bruit, glisse au seuil : réaction 0 interrompue, 1 et 2 perdues, capacité retrouvée à 3', () => {
    const { partie: glissee, evenements } = suite(MONDE, auLocal(), [['verser', 'huile', 'cloison_po'], ['ouvrir', 'observation']]);
    expect(types(evenements[1] ?? [])).toEqual(['passage_ouvert', 'bruit_mecanisme', 'creature_glisse', 'premier_contact']);
    expect(glissee.etat.creature).toMatchObject({ piece: 'local', perdues: 2, connues: ['po@local'], alcove: false });
    expect(observer(MONDE, glissee.etat)).toMatchObject({ creatureVisible: true, creatureATerre: true });
    // Le passager reste sous ses yeux : réaction 1 perdue (et action libre après le premier contact).
    const r1 = jouer(MONDE, glissee, option(MONDE, glissee, 'fermer', 'observation')?.commande);
    if (r1.type !== 'engagee') throw new Error('Réaction 1 non engagée.');
    expect(types(r1.evenements)).not.toContain('menace');
    expect(r1.partie.etat.creature).toMatchObject({ piece: 'local', perdues: 1, repit: false });
    // Réaction 2 perdue : répit passé, mais glissée, elle ne peut pas l'intercepter ; même un bruit ne la fait pas bouger.
    const r2 = jouer(MONDE, r1.partie, option(MONDE, r1.partie, 'ouvrir', 'observation')?.commande);
    if (r2.type !== 'engagee') throw new Error('Réaction 2 non engagée.');
    expect(r2.tirages).toEqual([]);
    expect(types(r2.evenements)).not.toContain('menace');
    expect(r2.partie.etat.creature).toMatchObject({ piece: 'local', perdues: 0 });
    // Réaction 3 : capacité retrouvée, elle le voit : jet d'interception et menace ou blessure.
    const r3 = jouer(MONDE, r2.partie, option(MONDE, r2.partie, 'fermer', 'observation')?.commande);
    if (r3.type !== 'engagee') throw new Error('Réaction 3 non engagée.');
    expect(r3.tirages).toHaveLength(1);
    expect(observer(MONDE, r2.partie.etat).creatureATerre).toBe(false);
  });

  it('T-06 : sol connu du côté où elle arrive : elle s\'engage, puis franchit, sans nouvelle glissade (D-190)', () => {
    const depart = partie();
    const placeeDevant = {
      ...depart,
      etat: {
        ...depart.etat,
        piece: 'local',
        visitees: ['salon', 'local'],
        huile: [{ liaison: 'po', piece: 'local' }],
        creature: { ...CALME, piece: 'observation', contact: true, connues: ['po@local'] },
      },
    };
    const engagee = engager(MONDE, placeeDevant, 'ouvrir', 'observation');
    expect(engagee.partie.etat.creature).toMatchObject({ piece: 'observation', engagee: 'po', perdues: 0 });
    const franchie = engager(MONDE, engagee.partie, 'ouvrir', 'galerie');
    expect(types(franchie.evenements)).toContain('creature_entre');
    expect(types(franchie.evenements)).not.toContain('creature_glisse');
    expect(franchie.partie.etat.creature).toMatchObject({ piece: 'local', engagee: null, perdues: 0 });
  });

  it('le passager passe toujours par le bord sec, sans glisser ni dé (D-190)', () => {
    const { partie: glissee } = suite(MONDE, auLocal(), [['verser', 'huile', 'cloison_po'], ['ouvrir', 'observation']]);
    const resultat = jouer(MONDE, glissee, option(MONDE, glissee, 'aller', 'observation')?.commande);
    expect(resultat).toMatchObject({ type: 'engagee', tirages: [] });
    expect(resultat.partie.etat).toMatchObject({ piece: 'observation', sante: 'indemne' });
  });

  it('T-06 : seuil déjà connu : une réaction pour s\'y engager, une pour franchir, sans nouvelle glissade', () => {
    const { partie: remise } = suite(MONDE, auLocal(), [
      ['verser', 'huile', 'cloison_po'],
      ['ouvrir', 'observation'],
      ['aller', 'observation'],
      ['fermer', 'local'],
    ]);
    expect(remise.etat.creature).toMatchObject({ piece: 'local', perdues: 0 });
    const reouverte = engager(MONDE, remise, 'ouvrir', 'local');
    expect(reouverte.partie.etat.creature).toMatchObject({ piece: 'local', engagee: 'po', perdues: 0 });
    const franchie = engager(MONDE, reouverte.partie, 'fermer', 'embarquement');
    expect(types(franchie.evenements)).toContain('creature_entre');
    expect(franchie.partie.etat.creature).toMatchObject({ piece: 'observation', engagee: null, perdues: 0 });
  });

  it('T-10 : sauvegarder et reprendre entre deux réactions perdues : même compte, ni remise à zéro ni doublon', () => {
    // Depuis le départ, comme AR-01 P-C : l'huile, la caisse sous la grille, le local, le seuil huilé, la cloison grincée.
    const { partie: entre } = suite(MONDE, partie(), [
      ['aller', 'atelier'],
      ['prendre', 'huile'],
      ['deplacer', 'caisse', 'sous_grille'],
      ['ouvrir', 'grille_ap'],
      ['aller', 'local'],
      ['verser', 'huile', 'cloison_po'],
      ['ouvrir', 'observation'],
      ['aller', 'observation'],
    ]);
    expect(entre.etat.creature).toMatchObject({ piece: 'local', perdues: 1 });
    const reprise = reprendrePartie(MONDE, JSON.parse(JSON.stringify(entre)) as unknown, VERSION);
    expect(empreinteEtat(reprise.etat)).toBe(empreinteEtat(entre.etat));
    const suiteDirecte = engager(MONDE, entre, 'aller', 'embarquement').partie;
    const suiteReprise = engager(MONDE, reprise, 'aller', 'embarquement').partie;
    expect(empreinteEtat(suiteReprise.etat)).toBe(empreinteEtat(suiteDirecte.etat));
    expect(suiteReprise.etat.creature).toMatchObject({ piece: 'local', perdues: 0 });
  });
});

describe('test de l\'avertisseur (C-03 §5.1, T-04)', () => {
  const auLocal = (): Partie => placee(MONDE, { piece: 'local', visitees: ['salon', 'local'] });

  it('T-04 : réactions 0, 1 et 2 couvertes par le son ; fin après la deuxième suivante ; « test en cours » entre-temps', () => {
    const avant = auLocal();
    expect(apercuDe(MONDE, avant, 'declencher', 'avertisseur')).toMatchObject({
      risque: 'aucun',
      cout: 'aucun',
      savoir: [{ type: 'sonnera', piece: expect.objectContaining({ nom: 'observation' }) }],
    });
    const lance = engager(MONDE, avant, 'declencher', 'avertisseur');
    expect(types(lance.evenements)).toEqual(['alarme_declenchee']);
    // Réaction 0 : elle rejoint l'émetteur dans l'alcôve, repositionnement local.
    expect(lance.partie.etat.creature).toMatchObject({ piece: 'observation', alcove: true });
    expect(lance.partie.etat.alarme).toEqual({ objet: 'test', restant: 2 });
    expect(option(MONDE, lance.partie, 'declencher', 'avertisseur')).toMatchObject({ disponible: false, raison: 'test_en_cours' });
    // Réaction 1 : le grincement de la cloison est plus faible que l'avertisseur, elle continue de chercher.
    const ouvert = engager(MONDE, lance.partie, 'ouvrir', 'observation');
    expect(ouvert.partie.etat.creature).toMatchObject({ piece: 'observation', alcove: true });
    expect(ouvert.partie.etat.alarme).toEqual({ objet: 'test', restant: 1 });
    // Réaction 2 : le passager traverse l'observation hors de sa vue ; le son couvre encore cette réaction, puis s'arrête.
    const traverse = engager(MONDE, ouvert.partie, 'aller', 'observation');
    expect(observer(MONDE, traverse.partie.etat).creatureVisible).toBe(false);
    expect(types(traverse.evenements)).not.toContain('premier_contact');
    expect(traverse.partie.etat.alarme).toBeNull();
    // Elle n'a pas reçu la position du passager : sans indice, elle reste dans l'alcôve (AR-01 P-B pas 13).
    const sorti = engager(MONDE, traverse.partie, 'aller', 'embarquement');
    expect(sorti.partie.etat.creature).toMatchObject({ piece: 'observation', alcove: true, contact: false });
  });

  it('après le cycle, un nouveau test est possible contre un nouvel engagement', () => {
    const { partie: fin } = suite(MONDE, auLocal(), [
      ['declencher', 'avertisseur'],
      ['ouvrir', 'galerie'],
      ['fermer', 'galerie'],
    ]);
    expect(fin.etat.alarme).toBeNull();
    expect(option(MONDE, fin, 'declencher', 'avertisseur')).toMatchObject({ disponible: true });
  });

  it('un bruit de sa propre pièce la fait sortir de l\'alcôve : elle voit alors le passager', () => {
    const { partie: cachee } = suite(MONDE, auLocal(), [
      ['declencher', 'avertisseur'],
      ['ouvrir', 'observation'],
      ['aller', 'observation'],
    ]);
    expect(cachee.etat.creature).toMatchObject({ alcove: true });
    const bruit = engager(MONDE, { ...cachee, etat: { ...cachee.etat, liaisons: { ...cachee.etat.liaisons, po: false } } }, 'ouvrir', 'local');
    expect(bruit.partie.etat.creature).toMatchObject({ piece: 'observation', alcove: false, contact: true });
    expect(types(bruit.evenements)).toContain('premier_contact');
  });
});
