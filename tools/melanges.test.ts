import {
  empreinteEtat,
  jouer,
  nouvellePartie,
  observer,
  type DefMonde,
  type EtatCreature,
  type EtatPartie,
  type Evenement,
  type IdAction,
  type OptionMenu,
  type Partie,
} from '../engine';
import { piecesSansAir } from '../engine/etat';
import { CATALOGUE } from './catalogue';
import { trouverOption } from './rejouer-parcours';
import { chercherEtat, stationDeReference, verifierStation } from './verifier-station';

// Mélanges joués en station assemblée (spec L3 §5) : une station du catalogue, à sa graine de référence, jouée par le moteur.
// Les noms ne servent qu'à retrouver les options du menu : ce sont les clés de la station.

const CALME: Omit<EtatCreature, 'piece'> = { indice: null, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null };

function stationDe(composition: string): DefMonde {
  const reference = stationDeReference(CATALOGUE, composition);
  if ('refus' in reference) throw new Error(reference.refus);
  return reference.entree.monde;
}

function option(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string): OptionMenu | undefined {
  const nomme = (cible: OptionMenu['cible'] | undefined, attendu: string): boolean =>
    cible !== undefined && (cible.nom === attendu || (cible.sorte === 'passage' && cible.vers?.nom === attendu));
  return observer(monde, courante.etat).menu.find(
    (choix) => choix.action === action && nomme(choix.cible, nom) && (parametre === undefined || nomme(choix.parametre, parametre)),
  );
}

interface Pas {
  readonly partie: Partie;
  readonly evenements: readonly Evenement[];
  readonly tirages: readonly number[];
}

function engager(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string): Pas {
  const choix = option(monde, courante, action, nom, parametre);
  if (choix === undefined || !choix.disponible) throw new Error(`Option ${action} ${nom} ${parametre ?? ''} absente ou indisponible.`);
  const resultat = jouer(monde, courante, choix.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return resultat;
}

type Geste = readonly [IdAction, string] | readonly [IdAction, string, string];

function suite(monde: DefMonde, depart: Partie, gestes: readonly Geste[]): Pas[] {
  const pas: Pas[] = [];
  let courante = depart;
  for (const [action, nom, parametre] of gestes) {
    const suivant = engager(monde, courante, action, nom, parametre);
    pas.push(suivant);
    courante = suivant.partie;
  }
  return pas;
}

/** Une commande refusée laisse la partie intacte, sans engagement (C-01 §6, MP-03). */
function refusee(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string): string {
  const choix = option(monde, courante, action, nom, parametre);
  if (choix === undefined) throw new Error(`Option ${action} ${nom} absente.`);
  const resultat = jouer(monde, courante, choix.commande);
  if (resultat.type !== 'refus') throw new Error(`${action} ${nom} : ${resultat.type}, refus attendu.`);
  expect(resultat.partie).toBe(courante);
  expect(empreinteEtat(resultat.partie.etat)).toBe(empreinteEtat(courante.etat));
  return resultat.raison;
}

/** Fait passer le temps sans bruit : ouvrir puis fermer, l'une après l'autre, une porte de la pièce du passager. */
function attendre(monde: DefMonde, depart: Partie, porte: string, fois: number): Pas[] {
  const pas: Pas[] = [];
  let courante = depart;
  for (let i = 0; i < fois; i++) {
    const ouverte = option(monde, courante, 'fermer', porte)?.disponible === true;
    const suivant = engager(monde, courante, ouverte ? 'fermer' : 'ouvrir', porte);
    pas.push(suivant);
    courante = suivant.partie;
  }
  return pas;
}

describe('planche et bloc (D-169)', () => {
  it('m08-m03-magasin : planche en main, le bloc d’énergie est refusé sans coût ; planche posée, il se prend', () => {
    const monde = stationDe('m08-m03-magasin');
    const pas = suite(monde, nouvellePartie(monde, { version: 'melanges-test', graine: 7 }), [
      ['ouvrir', 'quartiers'],
      ['aller', 'quartiers'],
      ['aller', 'atelier'],
      ['prendre', 'planche'],
      ['aller', 'quartiers'],
      ['ouvrir', 'ouest'],
      ['aller', 'ouest'],
      ['placer', 'planche', 'est'],
      ['aller', 'est'],
      ['prendre', 'planche'],
      ['ouvrir', 'energie'],
      ['aller', 'energie'],
    ]);
    expect(pas.flatMap((un) => un.tirages)).toEqual([]);
    const local = pas.at(-1)?.partie;
    if (local === undefined) throw new Error('Aucun pas.');
    expect(local.etat).toMatchObject({ piece: 'm-03/p-energie', sante: 'indemne', objets: { 'm-08/o-planche': { type: 'passager' } } });

    // W-02 : refusé sans coût, le bloc reste où il était.
    expect(option(monde, local, 'prendre', 'bloc')).toMatchObject({ disponible: false, raison: 'encombre' });
    expect(refusee(monde, local, 'prendre', 'bloc')).toBe('encombre');
    expect(local.etat.objets['m-03/o-bloc']).toEqual({ type: 'piece', piece: 'm-03/p-energie' });

    const posee = engager(monde, local, 'poser', 'planche').partie;
    const pris = engager(monde, posee, 'prendre', 'bloc');
    expect(pris.tirages).toEqual([]);
    expect(pris.partie.etat.objets).toMatchObject({ 'm-03/o-bloc': { type: 'passager' }, 'm-08/o-planche': { type: 'piece', piece: 'm-03/p-energie' } });
  });
});

describe('MX-01 en station assemblée (D-174)', () => {
  it('m10-m09-m03-entrepot : ralentie, sa dérive sans gravité se compte sur les réactions qui restent', () => {
    const monde = stationDe('m10-m09-m03-entrepot');
    const depart = nouvellePartie(monde, { version: 'melanges-test', graine: 7 });
    // État préparé comme le test du moteur : l'amener ralentie par le froid jusqu'à la zone demanderait une longue poursuite.
    const interieures = Object.fromEntries(monde.liaisons.filter((liaison) => liaison.id.startsWith('m-09/')).map((liaison) => [liaison.id, true]));
    let courante: Partie = {
      ...depart,
      etat: {
        ...depart.etat,
        piece: 'm-09/p-sas-est',
        liaisons: { ...depart.etat.liaisons, ...interieures },
        creature: { piece: 'm-09/p-sas-ouest', ...CALME, indice: { piece: 'm-09/p-sas-est', par: null }, ralentie: { saute: false } },
      },
    };
    expect(courante.etat.apesanteur).toContain('m-09/p-transfert');
    let actions = 0;
    while (courante.etat.creature?.piece !== 'm-09/p-sas-est' && actions < 20) {
      courante = attendre(monde, courante, 'cale', 1)[0]?.partie ?? courante;
      actions += 1;
    }
    // Quatre réactions utiles (entrer, dériver deux fois, franchir), une sur deux : sept actions.
    expect(actions).toBe(7);
  });
});

describe('le vide gagne les nouveaux morceaux (D-246)', () => {
  /** État atteint depuis le départ, sans dé ni blessure, par la recherche du vérifieur. */
  function atteindre(composition: string, but: (monde: DefMonde, etat: EtatPartie) => boolean): EtatPartie {
    const reference = stationDeReference(CATALOGUE, composition);
    if ('refus' in reference) throw new Error(reference.refus);
    const { monde } = reference.entree;
    const recherche = chercherEtat(reference.entree, (etat) => but(monde, etat));
    expect(recherche.issue, `${composition} : ${recherche.etats} états`).toBe('trouve');
    if (recherche.partie === null) throw new Error(`${composition} : but non atteint.`);
    return recherche.partie.etat;
  }
  const exposees = (monde: DefMonde, etat: EtatPartie, pieces: readonly string[]): boolean =>
    etat.breches.length > 0 && pieces.every((piece) => piecesSansAir(monde, etat).includes(piece));

  it('m07-m09-m06-embarquement : baie percée, l’air quitte aussi la salle des machines et la coursive de transfert', () => {
    const etat = atteindre('m07-m09-m06-embarquement', (monde, courant) => exposees(monde, courant, ['m-07/p-machines', 'm-09/p-transfert']));
    expect(etat.sante).toBe('indemne');
  }, 60000);

  it('m10-m08-m06-embarquement : baie percée, l’air quitte les deux bords de la passerelle et la chambre froide', () => {
    const etat = atteindre('m10-m08-m06-embarquement', (monde, courant) => exposees(monde, courant, ['m-08/p-ouest', 'm-08/p-est', 'm-10/p-chambre']));
    expect(etat.sante).toBe('indemne');
  }, 60000);

  // Soute de M-07 ouverte sur les quartiers dès le départ : l'air la quitte sans porte à ouvrir sous les yeux de la créature.
  it('m07-m09-m06-soute : la créature, restée dans un chemin, devient inerte hors de la panoramique', () => {
    const etat = atteindre(
      'm07-m09-m06-soute',
      (_, courant) => courant.breches.length > 0 && courant.creature?.neutralisee === 'inerte' && courant.creature.piece !== 'm-06/p-panoramique',
    );
    expect(etat.creature?.piece?.startsWith('m-06/')).toBe(false);
  }, 60000);
});

const depart = (monde: DefMonde): Partie => nouvellePartie(monde, { version: 'melanges-test', graine: 7 });
const fin = (pas: readonly Pas[]): Partie => {
  const derniere = pas.at(-1)?.partie;
  if (derniere === undefined) throw new Error('Aucun pas.');
  return derniere;
};
const sansRisque = (pas: readonly Pas[]): void => {
  expect(pas.flatMap((un) => un.tirages)).toEqual([]);
  expect(pas.every((un) => un.partie.etat.sante === 'indemne')).toBe(true);
};

describe('parcours des chemins d’AR-01 (spec L4 §9)', () => {
  const prouvee = (composition: string) => {
    const reference = stationDeReference(CATALOGUE, composition);
    if ('refus' in reference) throw new Error(reference.refus);
    const rapport = verifierStation(reference.entree);
    expect(rapport.verdict, rapport.diagnostic).toBe('prouvee');
    if (rapport.parcours === null) throw new Error(`${composition} : pas de témoin.`);
    return rapport.parcours;
  };

  it('M-01 sûr, m01-m03-reserve : galerie arrosée depuis le seuil, traversée jusqu’au palier sans blessure', () => {
    const monde = stationDe('m01-m03-reserve');
    const avant = suite(monde, depart(monde), [
      ['ouvrir', 'poste_incendie'],
      ['aller', 'poste_incendie'],
      ['prendre', 'bidon'],
      ['ouvrir', 'galerie'],
      ['arroser', 'bidon', 'galerie'],
    ]);
    expect(fin(avant).etat.feu).not.toContain('m-01/p-galerie');
    const apres = suite(monde, fin(avant), [
      ['aller', 'galerie'],
      ['ouvrir', 'palier'],
      ['aller', 'palier'],
    ]);
    sansRisque([...avant, ...apres]);
    expect(fin(apres).etat).toMatchObject({ piece: 'm-01/p-palier', feu: [] });
  });

  it('M-01 risqué, m01-m03-reserve : cloison de la galerie laissée ouverte, le feu gagne le poste incendie (D-188)', () => {
    const monde = stationDe('m01-m03-reserve');
    const poste = suite(monde, depart(monde), [
      ['ouvrir', 'poste_incendie'],
      ['aller', 'poste_incendie'],
      ['ouvrir', 'galerie'],
    ]);
    expect(fin(poste).etat.feu).toEqual(['m-01/p-galerie']);
    const pas = attendre(monde, fin(poste), 'vestibule', 2);
    expect(fin(pas).etat.feu).toContain('m-01/p-poste');
  });

  it('M-02 sûr, m02-m03-reserve : caisse sous la grille, grille ouverte, salle des pompes atteinte', () => {
    const monde = stationDe('m02-m03-reserve');
    const pas = suite(monde, depart(monde), [
      ['ouvrir', 'atelier'],
      ['aller', 'atelier'],
      ['deplacer', 'caisse', 'sous_grille'],
      ['ouvrir', 'grille'],
      ['aller', 'grille'],
    ]);
    sansRisque(pas);
    expect(fin(pas).etat.piece).toBe('m-02/p-pompes');
  });

  it('M-02, créature dans l’atelier, m10-m02-m03-atelier : prouvée, la créature est retenue dans M-10 quand le passager arrive à l’atelier', () => {
    const reference = stationDeReference(CATALOGUE, 'm10-m02-m03-atelier');
    if ('refus' in reference) throw new Error(reference.refus);
    const { monde } = reference.entree;
    const { etapes } = prouvee('m10-m02-m03-atelier');
    const chambre = etapes.findIndex((etape) => etape.action === 'aller' && etape.vers === 'chambre');
    const atelier = etapes.findIndex((etape) => etape.action === 'aller' && etape.vers === 'atelier');
    expect(chambre).toBeGreaterThanOrEqual(0);
    expect(atelier).toBeGreaterThan(chambre);
    let courante = depart(monde);
    for (const etape of etapes.slice(0, atelier + 1)) {
      const choix = trouverOption(observer(monde, courante.etat), etape);
      if (choix === undefined) throw new Error(`Étape ${etape.action} ${etape.cible} absente.`);
      const resultat = jouer(monde, courante, choix.commande);
      if (resultat.type !== 'engagee') throw new Error(`${etape.action} ${etape.cible} : ${resultat.type}.`);
      expect(resultat.tirages, `${etape.action} ${etape.cible}`).toEqual([]);
      courante = resultat.partie;
    }
    expect(courante.etat.sante).toBe('indemne');
    expect(courante.etat.piece).toBe('m-02/p-atelier');
    expect(courante.etat.creature?.piece?.startsWith('m-10/')).toBe(true);
  }, 60000);

  it('M-04 sûr, m04-m03-observation : test de l’avertisseur, traversée hors de vue, sortie ouverte', () => {
    const monde = stationDe('m04-m03-observation');
    const pas = suite(monde, depart(monde), [
      ['ouvrir', 'controle'],
      ['aller', 'controle'],
      ['declencher', 'avertisseur'],
      ['ouvrir', 'observation'],
      ['aller', 'observation'],
      ['ouvrir', 'energie'],
      ['aller', 'energie'],
    ]);
    sansRisque(pas);
    expect(fin(pas).etat.piece).toBe('m-03/p-energie');
  });

  it('M-04 sûr, m04-m03-observation : seuil de l’observation huilé, traversée, sortie ouverte', () => {
    const monde = stationDe('m04-m03-observation');
    const pas = suite(monde, depart(monde), [
      ['ouvrir', 'controle'],
      ['aller', 'controle'],
      ['prendre', 'burette'],
      ['verser', 'burette', 'observation'],
      ['ouvrir', 'observation'],
      ['aller', 'observation'],
      ['ouvrir', 'energie'],
      ['aller', 'energie'],
    ]);
    sansRisque(pas);
    expect(fin(pas).etat.piece).toBe('m-03/p-energie');
  });

  it('M-04 risqué, m04-m03-observation : traverser exposé, sans rien préparer, demande un dé', () => {
    const monde = stationDe('m04-m03-observation');
    const pas = suite(monde, depart(monde), [
      ['ouvrir', 'controle'],
      ['aller', 'controle'],
      ['ouvrir', 'observation'],
      ['aller', 'observation'],
    ]);
    expect(pas.flatMap((un) => un.tirages).length).toBeGreaterThan(0);
  });

  it('M-05 sûr, m05-m03-tri : panneau ouvert, raccourci jusqu’au hall sans entrer dans la salle de tri', () => {
    const monde = stationDe('m05-m03-tri');
    const pas = suite(monde, depart(monde), [
      ['ouvrir', 'service'],
      ['aller', 'service'],
      ['ouvrir', 'panneau'],
      ['aller', 'quai'],
    ]);
    sansRisque(pas);
    expect(fin(pas).etat.piece).toBe('m-05/p-quai');
    expect(fin(pas).etat.visitees).not.toContain('m-05/p-tri');
  });

  it('M-05, panneau vu du mauvais côté : fermé sans destination du local ; absent du hall atteint par la salle de tri', () => {
    const monde = stationDe('m05-m03-tri');
    const service = fin(suite(monde, depart(monde), [
      ['ouvrir', 'service'],
      ['aller', 'service'],
    ]));
    const vue = observer(monde, service.etat);
    expect(vue.passages.filter((passage) => passage.nom === 'panneau')).toMatchObject([{ vers: null, ouvert: false }]);
    expect(vue.menu.some((choix) => choix.action === 'aller' && choix.cible.nom === 'panneau')).toBe(false);

    // Créature dans la réserve : quand elle attend dans la salle de tri, la recherche sans dé s'arrête au plafond.
    const reference = stationDeReference(CATALOGUE, 'm05-m03-reserve');
    if ('refus' in reference) throw new Error(reference.refus);
    const recherche = chercherEtat(reference.entree, (etat) => etat.piece === 'm-05/p-quai' && !etat.decouvertes.includes('m-05/l-service-quai'));
    expect(recherche.issue, `${recherche.etats} états`).toBe('trouve');
    if (recherche.partie === null) throw new Error('Hall non atteint par la salle de tri.');
    expect(recherche.partie.etat.visitees).toContain('m-05/p-tri');
    const quai = observer(reference.entree.monde, recherche.partie.etat);
    expect(quai.passages.some((passage) => passage.nom === 'panneau')).toBe(false);
    expect(quai.menu.filter((choix) => choix.cible.nom === 'panneau' || choix.parametre?.nom === 'panneau')).toEqual([]);
  });

  it('M-01, créature sur le palier, m07-m01-m03-palier : prouvée', () => {
    prouvee('m07-m01-m03-palier');
  }, 60000);
});

describe('mélanges des chemins d’AR-01 (spec L4 §5)', () => {
  /** Du contrôle de M-04 à sa sortie, burette en main ; `huiler` : seuil de l'observation huilé depuis le contrôle. */
  const parM04 = (sortie: string, huiler: boolean): Geste[] => [
    ['ouvrir', 'controle'],
    ['aller', 'controle'],
    ['prendre', 'burette'],
    ...(huiler ? [['verser', 'burette', 'observation'] as const] : []),
    ['ouvrir', 'observation'],
    ['aller', 'observation'],
    ['ouvrir', sortie],
    ['aller', sortie],
  ];
  /** Du couloir de M-06 à la panoramique, combinaison enfilée et découpeuse en main. */
  const equiperM06: readonly Geste[] = [
    ['aller', 'local'],
    ['enfiler', 'combinaison'],
    ['prendre', 'decoupeuse'],
    ['aller', 'couloir_securite'],
    ['ouvrir', 'panoramique'],
    ['aller', 'panoramique'],
  ];

  it('MX-02, m01-m06-embarquement : portes ouvertes de la baie percée jusqu’à la galerie en feu, le vide l’éteint et le palier sans air ne brûle pas', () => {
    const monde = stationDe('m01-m06-embarquement');
    const pas = suite(monde, depart(monde), [
      ['ouvrir', 'poste_incendie'],
      ['aller', 'poste_incendie'],
      ['prendre', 'bidon'],
      ['ouvrir', 'galerie'],
      ['arroser', 'bidon', 'galerie'],
      ['aller', 'galerie'],
      ['fermer', 'poste_incendie'],
      ['ouvrir', 'palier'],
      ['aller', 'palier'],
      ['fermer', 'galerie'],
      ['ouvrir', 'couloir_securite'],
      ['aller', 'couloir_securite'],
      ...equiperM06,
    ]);
    sansRisque(pas);
    // Galerie rallumée : on ne la traverse pas en feu sans blessure, et rien ne la rallume une fois arrosée.
    const equipe: Partie = { ...fin(pas), etat: { ...fin(pas).etat, feu: ['m-01/p-galerie'] } };
    const percee = suite(monde, equipe, [['percer', 'baie']]);
    expect(piecesSansAir(monde, fin(percee).etat)).toContain('m-01/p-palier');
    expect(piecesSansAir(monde, fin(percee).etat)).not.toContain('m-01/p-galerie');
    expect(fin(percee).etat.feu).toEqual(['m-01/p-galerie']);

    const retour = suite(monde, fin(percee), [
      ['aller', 'couloir_securite'],
      ['aller', 'palier'],
      ['ouvrir', 'galerie'],
    ]);
    sansRisque([...percee, ...retour]);
    expect(retour.at(-2)?.partie.etat.feu).toEqual(['m-01/p-galerie']);
    const ouverte = fin(retour).etat;
    expect(piecesSansAir(monde, ouverte)).toEqual(expect.arrayContaining(['m-06/p-panoramique', 'm-06/p-couloir', 'm-01/p-palier', 'm-01/p-galerie']));
    expect(ouverte.feu).toEqual([]);
    expect(ouverte.expositions).toEqual([]);
    expect(retour.at(-1)?.evenements).toContainEqual({ type: 'feu_eteint', piece: expect.objectContaining({ nom: 'galerie' }) });
  });

  it('MX-03, m04-m06-embarquement : seuil de l’observation huilé, l’air perdu jusqu’à l’observation, l’huile reste', () => {
    const monde = stationDe('m04-m06-embarquement');
    const huilee = suite(monde, depart(monde), parM04('couloir_securite', true));
    const zones = fin(huilee).etat.huile;
    expect(zones).toEqual([{ liaison: 'm-04/l-controle-observation', piece: 'm-04/p-controle' }]);
    const percee = suite(monde, fin(huilee), [...equiperM06, ['percer', 'baie']]);
    sansRisque([...huilee, ...percee]);
    expect(piecesSansAir(monde, fin(percee).etat)).toEqual(expect.arrayContaining(['m-04/p-observation', 'm-04/p-controle']));
    expect(fin(percee).etat.huile).toEqual(zones);
  });

  it('MX-04, m04-m09-m03-reserve : sans gravité, verser est refusé sans coût ; gravité rétablie, il redevient possible', () => {
    const monde = stationDe('m04-m09-m03-reserve');
    const pas = suite(monde, depart(monde), [...parM04('quartiers', false), ['ouvrir', 'sas_ouest'], ['aller', 'sas_ouest'], ['aller', 'transfert']]);
    sansRisque(pas);
    const coupee = fin(pas);
    expect(coupee.etat.apesanteur).toContain('m-09/p-transfert');
    expect(option(monde, coupee, 'verser', 'burette', 'sas_ouest')).toMatchObject({ disponible: false, raison: 'sans_gravite' });
    expect(refusee(monde, coupee, 'verser', 'burette', 'sas_ouest')).toBe('sans_gravite');

    const retour = suite(monde, coupee, [['aller', 'sas_ouest'], ['retablir', 'interrupteur_gravite'], ['aller', 'transfert']]);
    const retablie = fin(retour);
    expect(retablie.etat.apesanteur).toEqual([]);
    expect(option(monde, retablie, 'verser', 'burette', 'sas_ouest')).toMatchObject({ disponible: true });
    const versee = engager(monde, retablie, 'verser', 'burette', 'sas_ouest');
    sansRisque([...retour, versee]);
    expect(versee.partie.etat.huile).toContainEqual({ liaison: 'm-09/l-sas-ouest-transfert', piece: 'm-09/p-transfert' });
  });

  it('MX-05, m04-m10-m03-reserve : l’huile versée dans la chambre froide y reste glissante, sans autre effet', () => {
    const monde = stationDe('m04-m10-m03-reserve');
    const versee = suite(monde, depart(monde), [
      ...parM04('quartiers', false),
      ['aller', 'antichambre'],
      ['ouvrir', 'chambre'],
      ['aller', 'chambre'],
      ['verser', 'burette', 'entrepot'],
    ]);
    const zone = { liaison: 'm-10/l-chambre-entrepot', piece: 'm-10/p-chambre' };
    expect(fin(versee).etat.huile).toEqual([zone]);
    const sortie = suite(monde, fin(versee), [['aller', 'antichambre']]);
    const ensuite = attendre(monde, fin(sortie), 'chambre', 2);
    sansRisque([...versee, ...sortie, ...ensuite]);
    expect(fin(ensuite).etat.huile).toEqual([zone]);
    expect(fin(ensuite).etat.creature?.ralentie).toBeUndefined();
  });

  it('feu et passerelle (D-247), m08-m01-m03-reserve : le feu gagne le poste incendie, la galerie sud, puis la galerie nord par-dessus le vide', () => {
    const monde = stationDe('m08-m01-m03-reserve');
    const gestes = suite(monde, depart(monde), [
      ['ouvrir', 'quartiers'],
      ['aller', 'quartiers'],
      ['aller', 'atelier'],
      ['prendre', 'planche'],
      ['aller', 'quartiers'],
      ['ouvrir', 'ouest'],
      ['aller', 'ouest'],
      ['placer', 'planche', 'est'],
      ['aller', 'est'],
      ['ouvrir', 'poste_incendie'],
      ['aller', 'poste_incendie'],
      ['ouvrir', 'galerie'],
      ['aller', 'est'],
      ['aller', 'ouest'],
      ['aller', 'quartiers'],
      ['fermer', 'ouest'],
    ]);
    const pas = [...gestes, ...attendre(monde, fin(gestes), 'atelier', 1)];
    sansRisque(pas);
    const ordre: string[] = [];
    for (const un of pas) for (const piece of un.partie.etat.feu) if (!ordre.includes(piece)) ordre.push(piece);
    expect(ordre).toEqual(['m-01/p-galerie', 'm-01/p-poste', 'm-08/p-est', 'm-08/p-ouest']);
    expect(fin(pas).etat.liaisons).toMatchObject({ 'l-m-08-m-01': true, 'm-01/l-poste-galerie': true });
  });

  describe('vigilance 5 : bloc d’énergie ramené devant un passage étroit, « aller » trop large, refusé sans coût', () => {
    it('m02-m03-reserve : devant la grille ouverte', () => {
      const monde = stationDe('m02-m03-reserve');
      const pas = suite(monde, depart(monde), [
        ['ouvrir', 'atelier'],
        ['aller', 'atelier'],
        ['deplacer', 'caisse', 'sous_grille'],
        ['ouvrir', 'grille'],
        ['aller', 'grille'],
        ['ouvrir', 'energie'],
        ['aller', 'energie'],
        ['prendre', 'bloc'],
        ['aller', 'pompes'],
      ]);
      sansRisque(pas);
      const charge = fin(pas);
      expect(charge.etat.liaisons['m-02/l-atelier-pompes']).toBe(true);
      expect(option(monde, charge, 'aller', 'grille')).toMatchObject({ disponible: false, raison: 'trop_large' });
      expect(refusee(monde, charge, 'aller', 'grille')).toBe('trop_large');
    });

    it('m05-m03-reserve : devant le panneau ouvert', () => {
      const monde = stationDe('m05-m03-reserve');
      const pas = suite(monde, depart(monde), [
        ['ouvrir', 'service'],
        ['aller', 'service'],
        ['ouvrir', 'panneau'],
        ['aller', 'quai'],
        ['ouvrir', 'energie'],
        ['aller', 'energie'],
        ['prendre', 'bloc'],
        ['aller', 'quai'],
      ]);
      sansRisque(pas);
      const charge = fin(pas);
      expect(charge.etat.liaisons['m-05/l-service-quai']).toBe(true);
      expect(option(monde, charge, 'aller', 'panneau')).toMatchObject({ disponible: false, raison: 'trop_large' });
      expect(refusee(monde, charge, 'aller', 'panneau')).toBe('trop_large');
    });
  });
});
