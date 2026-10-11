import {
  apercu,
  idPublic,
  jouer,
  nouvellePartie,
  observer,
  reprendrePartie,
  type DefMonde,
  type Evenement,
  type OptionMenu,
  type Partie,
} from '../engine';
import { libelleOption, MONDES, raconter, rendreApercu, rendreObservation, type EntreeMonde, type EtapeParcours } from '../content';
import { trouverOption } from './rejouer-parcours';

// Cas négatifs d'AR-01 (docs/08-aventure-reference.md §10) et contrats C-02, C-06, C-09, joués par le menu public depuis une
// nouvelle partie. Ces tests sont ici et non dans content/ : content n'importe que les types du moteur.

const ENTREE = MONDES['ar-01'] as EntreeMonde;
const MONDE = ENTREE.monde;
const VERSION = 'ar-01-test';

function depart(): Partie {
  return nouvellePartie(MONDE, { version: VERSION, graine: 20261010 });
}

function etapes(prefixe: string): readonly EtapeParcours[] {
  const parcours = ENTREE.parcours.find((candidat) => candidat.nom.startsWith(prefixe));
  if (parcours === undefined) throw new Error(`Parcours ${prefixe} absent.`);
  return parcours.etapes;
}

function choix(partie: Partie, etape: EtapeParcours, monde: DefMonde = MONDE): OptionMenu | undefined {
  return trouverOption(observer(monde, partie.etat), etape);
}

interface Pas {
  readonly partie: Partie;
  readonly evenements: readonly Evenement[];
  readonly tirages: readonly number[];
}

function engager(partie: Partie, etape: EtapeParcours): Pas {
  const option = choix(partie, etape);
  if (option === undefined || !option.disponible) throw new Error(`Option ${JSON.stringify(etape)} absente ou indisponible.`);
  const resultat = jouer(MONDE, partie, option.commande);
  if (resultat.type !== 'engagee') throw new Error(`${JSON.stringify(etape)} : ${resultat.type}.`);
  return resultat;
}

/** Joue les étapes dans l'ordre ; renvoie chaque pas. */
function suite(partie: Partie, gestes: readonly EtapeParcours[]): Pas[] {
  const pas: Pas[] = [];
  let courante = partie;
  for (const geste of gestes) {
    const suivant = engager(courante, geste);
    pas.push(suivant);
    courante = suivant.partie;
  }
  return pas;
}

function apres(partie: Partie, gestes: readonly EtapeParcours[]): Partie {
  return suite(partie, gestes).at(-1)?.partie ?? partie;
}

function id(interne: string): string {
  return idPublic(MONDE.id, interne);
}

function noms(liste: readonly { nom: string }[]): string[] {
  return liste.map((element) => element.nom);
}

function passage(partie: Partie, nom: string, monde: DefMonde = MONDE) {
  return observer(monde, partie.etat).passages.filter((vu) => vu.nom === nom);
}

/** Refus sans effet : même état, même compteur (C-01 §4). */
function refuse(partie: Partie, commande: { action: string; cible: string; parametre?: string }, raison: string): void {
  const resultat = jouer(MONDE, partie, commande);
  expect(resultat).toMatchObject({ type: 'refus', raison });
  expect(resultat.partie.etat).toEqual(partie.etat);
  expect(resultat.partie.enregistrement.actions).toHaveLength(partie.enregistrement.actions.length);
}

const P_A = etapes('P-A');
const P_B = etapes('P-B');
const P_C = etapes('P-C');

describe('AR-01 : ressources et passages (§10)', () => {
  it('ressource absente : pas d’arroser sans bidon ; le bidon vidé reste porté et se dit vide', () => {
    const feu = apres(depart(), [{ action: 'ouvrir', cible: 'cloison', vers: 'galerie' }]);
    expect(observer(MONDE, feu.etat).menu.some((option) => option.action === 'arroser')).toBe(false);
    refuse(feu, { action: 'arroser', cible: id('o-bidon'), parametre: id('l-salon-galerie') }, 'pas_en_main');
    const vide = apres(depart(), P_B.slice(0, 5));
    expect(noms(observer(MONDE, vide.etat).inventaire)).toEqual(['bidon']);
    refuse(vide, { action: 'arroser', cible: id('o-bidon'), parametre: id('l-salon-galerie') }, 'vide');
  });

  it('passage fermé : aller du salon à la galerie au départ est refusé, sans effet', () => {
    const partie = depart();
    const option = choix(partie, { action: 'aller', cible: 'cloison', vers: 'galerie' });
    expect(option).toMatchObject({ disponible: false, raison: 'ferme' });
    refuse(partie, { action: 'aller', cible: id('l-salon-galerie') }, 'ferme');
  });

  it('bloc trop large : ni par la grille ni par le panneau ; posé, il reste au local ; le circuit suffit ensuite', () => {
    // P-A jusqu'au retour dans le local énergie, cloison de l'observation fermée.
    const local = apres(depart(), P_A.slice(0, 8));
    const charge = engager(local, { action: 'prendre', cible: 'bloc' }).partie;
    for (const [nom, interne] of [['grille', 'l-atelier-energie'], ['panneau', 'l-energie-embarquement']] as const) {
      expect(choix(charge, { action: 'aller', cible: nom })).toMatchObject({ disponible: false, raison: 'trop_large' });
      refuse(charge, { action: 'aller', cible: id(interne) }, 'trop_large');
    }
    expect(noms(observer(MONDE, charge.etat).inventaire)).toEqual(['bloc']);
    const pose = engager(charge, { action: 'poser', cible: 'bloc' }).partie;
    expect(noms(observer(MONDE, pose.etat).objets)).toContain('bloc');
    const fin = suite(pose, P_A.slice(8)).at(-1);
    expect(fin?.evenements[0]).toEqual({ type: 'evacuation', sources: ['circuit'] });
  });

  it('appui déplacé : caisse remise au centre, grille hors de portée de l’atelier ; le retour du local reste possible', () => {
    const allerRetour = apres(depart(), [
      { action: 'aller', cible: 'porte', vers: 'atelier' },
      { action: 'prendre', cible: 'bidon' },
      { action: 'deplacer', cible: 'caisse', parametre: 'sous_grille' },
      { action: 'ouvrir', cible: 'grille' },
      { action: 'aller', cible: 'grille' },
      { action: 'aller', cible: 'grille', vers: 'atelier' },
      { action: 'deplacer', cible: 'caisse', parametre: 'centre' },
    ]);
    expect(choix(allerRetour, { action: 'aller', cible: 'grille', vers: 'energie' })).toMatchObject({ disponible: false, raison: 'hors_de_portee' });
    refuse(allerRetour, { action: 'aller', cible: id('l-atelier-energie') }, 'hors_de_portee');
    // Par la galerie, comme P-B, jusqu'au local énergie : la grille ouverte ramène à l'atelier sans appui de ce côté.
    const local = apres(allerRetour, [
      { action: 'aller', cible: 'porte', vers: 'salon' },
      { action: 'ouvrir', cible: 'cloison', vers: 'galerie' },
      { action: 'arroser', cible: 'bidon', parametre: 'galerie' },
      { action: 'aller', cible: 'cloison', vers: 'galerie' },
      { action: 'ouvrir', cible: 'cloison', vers: 'energie' },
      { action: 'aller', cible: 'cloison', vers: 'energie' },
    ]);
    const retour = engager(local, { action: 'aller', cible: 'grille', vers: 'atelier' }).partie;
    expect(observer(MONDE, retour.etat).piece.nom).toBe('atelier');
  });

  it('menace ailleurs : l’avertisseur ne téléporte pas la créature ; une liaison par réaction, alcôve seulement sur place', () => {
    // P-C jusqu'à la glissade : la créature est à terre dans le local énergie, l'avertisseur à portée.
    const glissade = apres(depart(), P_C.slice(0, 8));
    expect(glissade.etat.creature?.piece).toBe('p-energie');
    const voisines = (a: string, b: string): boolean => a === b || MONDE.liaisons.some((liaison) => liaison.entre.includes(a) && liaison.entre.includes(b));
    let avant = glissade;
    for (const geste of [
      { action: 'declencher', cible: 'avertisseur' },
      { action: 'aller', cible: 'cloison', vers: 'observation' },
      { action: 'aller', cible: 'cloison', vers: 'embarquement' },
      { action: 'fermer', cible: 'cloison', vers: 'observation' },
    ] as const) {
      const pas = engager(avant, geste);
      const [de, vers] = [avant.etat.creature, pas.partie.etat.creature];
      expect(de !== null && vers !== null && voisines(de.piece, vers.piece)).toBe(true);
      if (vers?.alcove === true) expect(vers.piece).toBe('p-observation');
      if (geste.action === 'declencher') expect(vers).toMatchObject({ piece: 'p-energie', alcove: false });
      avant = pas.partie;
    }
  });
});

describe('AR-01 : combinaisons non adaptées (§10)', () => {
  it('l’huile n’éteint pas, l’eau ne se verse pas comme glissant', () => {
    const atelier = apres(depart(), [
      { action: 'aller', cible: 'porte', vers: 'atelier' },
      { action: 'prendre', cible: 'burette' },
      { action: 'prendre', cible: 'bidon' },
      { action: 'aller', cible: 'porte', vers: 'salon' },
      { action: 'ouvrir', cible: 'cloison', vers: 'galerie' },
    ]);
    const menu = observer(MONDE, atelier.etat).menu;
    expect(menu.filter((option) => option.action === 'arroser').map((option) => option.cible.nom)).toEqual(['bidon']);
    expect(menu.filter((option) => option.action === 'verser').map((option) => option.cible.nom).every((nom) => nom === 'burette')).toBe(true);
    refuse(atelier, { action: 'arroser', cible: id('o-burette'), parametre: id('l-salon-galerie') }, 'cible_absente');
    refuse(atelier, { action: 'verser', cible: id('o-bidon'), parametre: id('l-salon-galerie') }, 'cible_absente');
  });

  it('lancer : indisponible sans alimentation, puis écoutille ouverte', () => {
    const sansCourant = apres(depart(), [...P_A.slice(0, 8), ...P_A.slice(9, 11)]);
    expect(choix(sansCourant, { action: 'lancer', cible: 'pupitre' })).toMatchObject({ disponible: false, raison: 'non_alimentee' });
    refuse(sansCourant, { action: 'lancer', cible: id('o-pupitre') }, 'non_alimentee');
    const ouverte = apres(depart(), P_A.slice(0, 11));
    expect(choix(ouverte, { action: 'lancer', cible: 'pupitre' })).toMatchObject({ disponible: false, raison: 'non_isolee' });
    refuse(ouverte, { action: 'lancer', cible: id('o-pupitre') }, 'non_isolee');
  });

  it('installer : absent hors de la pièce de la capsule', () => {
    const local = apres(depart(), [...P_B.slice(0, 9)]);
    expect(noms(observer(MONDE, local.etat).inventaire)).toContain('bloc');
    expect(observer(MONDE, local.etat).menu.some((option) => option.action === 'installer')).toBe(false);
    refuse(local, { action: 'installer', cible: id('o-bloc') }, 'cible_absente');
  });

  it('écoutille : ni ouverte ni fermée depuis l’embarquement', () => {
    const embarquement = apres(depart(), P_A.slice(0, 6));
    const menu = observer(MONDE, embarquement.etat).menu;
    expect(menu.some((option) => option.cible.nom === 'ecoutille' && (option.action === 'fermer' || option.action === 'ouvrir'))).toBe(false);
    refuse(embarquement, { action: 'fermer', cible: id('l-embarquement-cabine') }, 'cible_absente');
  });
});

describe('AR-01 : ce que sait le passager (C-06)', () => {
  it('passage caché : depuis l’embarquement, tout se voit comme sans lui ; depuis le local, ni destination ni « aller »', () => {
    const embarquement = apres(depart(), P_B.slice(0, 13));
    expect(observer(MONDE, embarquement.etat).piece.nom).toBe('embarquement');
    const sansPanneau: DefMonde = { ...MONDE, liaisons: MONDE.liaisons.filter((liaison) => liaison.id !== 'l-energie-embarquement') };
    expect(observer(MONDE, embarquement.etat)).toEqual(observer(sansPanneau, embarquement.etat));
    refuse(embarquement, { action: 'ouvrir', cible: id('l-energie-embarquement') }, 'cible_absente');

    const local = apres(depart(), P_A.slice(0, 4));
    expect(passage(local, 'panneau')).toMatchObject([{ vers: null, ouvert: false }]);
    expect(observer(MONDE, local.etat).menu.some((option) => option.action === 'aller' && option.cible.nom === 'panneau')).toBe(false);
  });

  it('passage caché : l’ouvrir le découvre des deux côtés ; le refermer ne le fait pas oublier', () => {
    const local = apres(depart(), P_A.slice(0, 4));
    const ouvert = engager(local, { action: 'ouvrir', cible: 'panneau' });
    expect(ouvert.evenements.map((evenement) => evenement.type)).toEqual(['passage_ouvert', 'passage_decouvert']);
    expect(passage(ouvert.partie, 'panneau')).toMatchObject([{ vers: { nom: 'embarquement' } }]);
    const embarquement = engager(ouvert.partie, { action: 'aller', cible: 'panneau', vers: 'embarquement' }).partie;
    expect(passage(embarquement, 'panneau')).toMatchObject([{ vers: { nom: 'energie' }, ouvert: true }]);
    const referme = engager(embarquement, { action: 'fermer', cible: 'panneau', vers: 'energie' }).partie;
    expect(passage(referme, 'panneau')).toMatchObject([{ vers: { nom: 'energie' }, ouvert: false }]);
  });

  it('grille sans signalétique : destination inconnue jusqu’au premier passage, connue ensuite des deux côtés', () => {
    const ouverte = apres(depart(), P_A.slice(0, 3));
    expect(passage(ouverte, 'grille')).toMatchObject([{ vers: null, ouvert: true }]);
    const local = engager(ouverte, { action: 'aller', cible: 'grille' }).partie;
    expect(passage(local, 'grille')).toMatchObject([{ vers: { nom: 'atelier' } }]);
    const retour = engager(local, { action: 'aller', cible: 'grille', vers: 'atelier' }).partie;
    expect(passage(retour, 'grille')).toMatchObject([{ vers: { nom: 'energie' } }]);
  });

  it('feu derrière la grille jamais franchie : aucun texte ne nomme le local énergie (OP-03, NP-05)', () => {
    const ouverte = apres(depart(), [
      { action: 'aller', cible: 'porte', vers: 'atelier' },
      { action: 'prendre', cible: 'bidon' },
      { action: 'deplacer', cible: 'caisse', parametre: 'sous_grille' },
      { action: 'ouvrir', cible: 'grille' },
    ]);
    // Placé à la main : la cloison entre la galerie en feu et le local énergie, ouverte depuis une fin d'action.
    const exposee: Partie = {
      ...ouverte,
      etat: { ...ouverte.etat, liaisons: { ...ouverte.etat.liaisons, 'l-galerie-energie': true }, expositions: ['l-galerie-energie'] },
    };
    const textes: string[] = [];
    const lire = (partie: Partie): void => {
      const observation = observer(MONDE, partie.etat);
      textes.push(...rendreObservation(ENTREE.textes, observation));
      for (const option of observation.menu) {
        const { libelle, raison } = libelleOption(ENTREE.textes, option);
        textes.push(libelle, raison ?? '');
        const resultat = option.disponible ? apercu(MONDE, partie, option.commande) : null;
        if (resultat?.type === 'apercu') textes.push(...Object.values(rendreApercu(ENTREE.textes, resultat.apercu)).flat().map(String));
        const lu = jouer(MONDE, partie, option.commande);
        if (lu.type === 'consultation') textes.push(...raconter(ENTREE.textes, lu));
      }
    };
    const gagne = jouer(MONDE, exposee, (choix(exposee, { action: 'prendre', cible: 'burette' }) as OptionMenu).commande);
    if (gagne.type !== 'engagee') throw new Error('Prendre la burette non engagé.');
    expect(gagne.partie.etat.feu).toContain('p-energie');
    expect(gagne.evenements.filter((evenement) => evenement.type.startsWith('feu'))).toEqual([
      { type: 'feu_derriere', passage: expect.objectContaining({ nom: 'grille', vers: null }) },
    ]);
    textes.push(...raconter(ENTREE.textes, gagne));
    lire(gagne.partie);
    const arroser = observer(MONDE, gagne.partie.etat).menu.find((option) => option.action === 'arroser' && option.parametre?.nom === 'grille');
    if (arroser === undefined) throw new Error('Arroser par la grille absent.');
    const eteint = jouer(MONDE, gagne.partie, arroser.commande);
    if (eteint.type !== 'engagee') throw new Error('Arroser non engagé.');
    expect(eteint.partie.etat.feu).not.toContain('p-energie');
    textes.push(...raconter(ENTREE.textes, eteint));
    lire(eteint.partie);
    expect(textes.join('\n')).toContain('grille');
    expect(textes.filter((texte) => /énergie/i.test(texte))).toEqual([]);
  });
});

describe('AR-01 : reprise et fin (C-09, AR-01 §11.2)', () => {
  it.each([
    ['après la découverte du panneau', P_A.slice(0, 5)],
    ['après le réarmement de la console', P_A.slice(0, 9)],
    ['après l’installation du bloc', P_B.slice(0, 15)],
    ['après la glissade', P_C.slice(0, 8)],
  ])('reprise %s : même état, aucune nouvelle découverte ni nouveau tirage', (_cas, gestes) => {
    const partie = apres(depart(), gestes);
    const reprise = reprendrePartie(MONDE, JSON.parse(JSON.stringify(partie)) as unknown, VERSION);
    expect(reprise.etat).toEqual(partie.etat);
    expect(reprise.derniers).toEqual(partie.derniers);
    expect(reprise.enregistrement).toEqual(partie.enregistrement);
  });

  it.each([
    ['P-A', P_A, ['circuit']],
    ['P-B', P_B, ['bloc']],
    ['P-C', P_C, ['bloc']],
  ] as const)('fin de %s : sources dites, menu vide, toute commande refusée, messages une fois chacun', (_nom, gestes, sources) => {
    const pas = suite(depart(), gestes);
    const fin = pas.at(-1);
    if (fin === undefined) throw new Error('Parcours vide.');
    expect(fin.evenements).toEqual([{ type: 'evacuation', sources }, { type: 'assistance', message: 'depart' }]);
    expect(pas.flatMap((etape) => etape.tirages)).toEqual([]);
    const vue = observer(MONDE, fin.partie.etat);
    expect(vue).toMatchObject({ terminee: true, issue: 'evacuation', menu: [], messages: ['reveil', 'energie', 'depart'] });
    for (const commande of [
      { action: 'regarder', cible: id('p-cabine') },
      { action: 'lancer', cible: id('o-pupitre') },
      { action: 'ouvrir', cible: id('l-embarquement-cabine') },
    ]) {
      refuse(fin.partie, commande, 'partie_terminee');
    }
  });

  it('circuit et bloc ensemble : les deux sources sont dites', () => {
    // P-B, la console réarmée juste après l'avertisseur.
    const gestes = [...P_B.slice(0, 10), { action: 'activer', cible: 'console' } as const, ...P_B.slice(10)];
    const fin = suite(depart(), gestes).at(-1);
    expect(fin?.evenements[0]).toEqual({ type: 'evacuation', sources: ['circuit', 'bloc'] });
  });
});
