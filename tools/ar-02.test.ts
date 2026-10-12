import {
  apercu,
  idPublic,
  jouer,
  nouvellePartie,
  observer,
  reprendrePartie,
  type Apercu,
  type Evenement,
  type OptionMenu,
  type Partie,
} from '../engine';
import { piecesSansAir } from '../engine/etat';
import { MONDES, rendreApercu, rendreEvenements, rendreObservation, type EntreeMonde, type EtapeParcours } from '../content';
import { trouverOption } from './rejouer-parcours';

// Cas à prouver d'AR-02 (docs/09-aventure-reference-vide.md §9) et tests de contrat du vide (C-03 T-11 à T-14, C-04 RSK-10/11),
// joués par le menu public depuis une nouvelle partie. T-18 et MX-03 : engine/vide.test.ts (fixture synthétique).

const ENTREE = MONDES['ar-02'] as EntreeMonde;
const MONDE = ENTREE.monde;
const VERSION = 'ar-02-test';

function depart(): Partie {
  return nouvellePartie(MONDE, { version: VERSION, graine: 20261010 });
}

function etapes(prefixe: string): readonly EtapeParcours[] {
  const parcours = ENTREE.parcours.find((candidat) => candidat.nom.startsWith(prefixe));
  if (parcours === undefined) throw new Error(`Parcours ${prefixe} absent.`);
  return parcours.etapes;
}

function choix(partie: Partie, etape: EtapeParcours): OptionMenu | undefined {
  return trouverOption(observer(MONDE, partie.etat), etape);
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

function types(evenements: readonly Evenement[]): string[] {
  return evenements.map((evenement) => evenement.type);
}

function sansAir(partie: Partie): string[] {
  return piecesSansAir(MONDE, partie.etat);
}

function apercuDe(partie: Partie, etape: EtapeParcours): Apercu {
  const option = choix(partie, etape);
  if (option === undefined) throw new Error(`Option ${JSON.stringify(etape)} absente.`);
  const resultat = apercu(MONDE, partie, option.commande);
  if (resultat.type !== 'apercu') throw new Error(`Aperçu ${JSON.stringify(etape)} : ${resultat.type}.`);
  return resultat.apercu;
}

/** Refus sans effet : même partie, même état, même compteur (C-01 §4). */
function refuse(partie: Partie, commande: { action: string; cible: string }, raison: string): void {
  const resultat = jouer(MONDE, partie, commande);
  expect(resultat).toMatchObject({ type: 'refus', raison });
  expect(resultat.partie).toBe(partie);
  expect(resultat.partie.etat.actions).toBe(partie.etat.actions);
}

const P_V1 = etapes('P-V1');
const P_V2 = etapes('P-V2');
const PERCER: EtapeParcours = { action: 'percer', cible: 'baie' };
const REBOUCHER: EtapeParcours = { action: 'reboucher', cible: 'kit' };
const ENFILER: EtapeParcours = { action: 'enfiler', cible: 'combinaison' };
const RETIRER: EtapeParcours = { action: 'retirer', cible: 'combinaison' };
/** Passager équipé dans la salle panoramique, C–B ouverte, B–E fermée (P-V1 pas 1 à 6). */
const EQUIPE = P_V1.slice(0, 6);
/** Découpeuse en main, sans combinaison, dans la salle panoramique. */
const SANS_COMBINAISON: readonly EtapeParcours[] = [
  { action: 'aller', cible: 'porte', vers: 'local' },
  { action: 'prendre', cible: 'decoupeuse' },
  { action: 'aller', cible: 'porte', vers: 'coursive' },
  { action: 'ouvrir', cible: 'porte', vers: 'panoramique' },
  { action: 'aller', cible: 'porte', vers: 'panoramique' },
];

describe('AR-02 : passer en force (D-195, D-196)', () => {
  const CONTACT = etapes('P-V3').slice(0, 3);

  it('après le premier contact, se faufiler par la porte grippée est annoncé élevé ; fuir par la coursive reste libre', () => {
    const contact = apres(depart(), CONTACT);
    expect(contact.etat.creature).toMatchObject({ piece: 'p-panoramique', repit: true, garde: 'l-panoramique-embarquement' });
    expect(apercuDe(contact, { action: 'aller', cible: 'porte_grippee', vers: 'embarquement' })).toMatchObject({ risque: 'eleve', danger: { type: 'interception' } });
    expect(apercuDe(contact, { action: 'aller', cible: 'porte', vers: 'coursive' })).toMatchObject({ risque: 'aucun', danger: null });
    const [faufile] = suite(contact, [{ action: 'aller', cible: 'porte_grippee', vers: 'embarquement' }]);
    expect(faufile?.tirages).toHaveLength(1);
    const [fuite] = suite(contact, [{ action: 'aller', cible: 'porte', vers: 'coursive' }]);
    expect(fuite?.tirages).toEqual([]);
  });

  it('l’écoutille est fermée au départ et s’ouvre depuis l’embarquement', () => {
    const neuve = depart();
    expect(neuve.etat.liaisons['l-embarquement-cabine']).toBe(false);
    const embarquement = apres(neuve, P_V1.slice(0, 9));
    expect(choix(embarquement, { action: 'aller', cible: 'ecoutille', vers: 'cabine' })).toMatchObject({ disponible: false });
    expect(choix(embarquement, { action: 'ouvrir', cible: 'ecoutille', vers: 'cabine' })).toMatchObject({ disponible: true });
  });
});

describe('AR-02 : percer (C-03 §5.4, C-04 §3.1)', () => {
  it('VN-01, RSK-10 : sans combinaison, aperçu mortel ; engagé, défaite sans dé, rien ensuite', () => {
    const panoramique = apres(depart(), SANS_COMBINAISON);
    expect(apercuDe(panoramique, PERCER)).toMatchObject({ risque: 'mortel', danger: { type: 'asphyxie' } });
    const perce = engager(panoramique, PERCER);
    expect(perce.tirages).toEqual([]);
    expect(perce.evenements.at(-1)).toEqual({ type: 'defaite', causes: ['vide'] });
    expect(observer(MONDE, perce.partie.etat)).toMatchObject({ terminee: true, issue: 'defaite', menu: [] });
    refuse(perce.partie, { action: 'regarder', cible: id('p-panoramique') }, 'partie_terminee');
    expect(rendreEvenements(ENTREE.textes, perce.evenements, { graine: 1, action: 6 }).join(' ')).toMatch(/air vous quitte|vide vous arrache/);
  });

  it('T-11 : deux portes ouvertes en chaîne, trois pièces sans air à la même mise à jour (P-V1 pas 7)', () => {
    const perce = engager(apres(depart(), EQUIPE), PERCER);
    expect(sansAir(perce.partie)).toEqual(['p-coursive', 'p-local', 'p-panoramique']);
    expect(perce.tirages).toEqual([]);
  });

  it('VN-02 : C–B fermée, seule la salle panoramique perd son air', () => {
    const fermee = apres(depart(), [...EQUIPE, { action: 'fermer', cible: 'porte', vers: 'coursive' }]);
    expect(sansAir(engager(fermee, PERCER).partie)).toEqual(['p-panoramique']);
    // B–E ouverte (P-V2) : l'embarquement le perd aussi.
    expect(sansAir(apres(depart(), P_V2.slice(0, 8)))).toContain('p-embarquement');
  });

  it('VN-03 : B–E fermée, créature intacte, rien entendu', () => {
    const equipe = apres(depart(), EQUIPE);
    const perce = engager(equipe, PERCER);
    expect(perce.partie.etat.creature).toEqual(equipe.etat.creature);
    expect(perce.partie.etat.reperes).toEqual(equipe.etat.reperes);
    expect(types(perce.evenements)).toEqual(['breche_ouverte', 'air_perdu']);
  });

  it('T-12, VN-04, VN-05 : refermer C–B rend l’air à C et L ; rouvrir le leur reprend aussitôt', () => {
    const perce = apres(depart(), [...EQUIPE, PERCER]);
    const fermee = engager(perce, { action: 'fermer', cible: 'porte', vers: 'coursive' });
    expect(sansAir(fermee.partie)).toEqual(['p-panoramique']);
    expect(fermee.evenements).toContainEqual({ type: 'air_revenu', pieces: ['coursive', 'local'].map((nom) => expect.objectContaining({ nom })) });
    const rouverte = engager(fermee.partie, { action: 'ouvrir', cible: 'porte', vers: 'coursive' });
    expect(sansAir(rouverte.partie)).toEqual(['p-coursive', 'p-local', 'p-panoramique']);
    expect(rouverte.evenements).toContainEqual({ type: 'air_perdu', pieces: ['coursive', 'local'].map((nom) => expect.objectContaining({ nom })) });
  });

  it('T-13, RSK-11 : percer au pas qui suit l’entrée de la créature, expulsée avant sa réaction, aucune attaque ni dé (P-V2 pas 8)', () => {
    const [entree, perce] = suite(depart(), P_V2.slice(0, 8)).slice(-2);
    expect(types(entree?.evenements ?? [])).toContain('premier_contact');
    expect(perce?.tirages).toEqual([]);
    expect(types(perce?.evenements ?? [])).toEqual(['breche_ouverte', 'air_perdu', 'creature_expulsee']);
    expect(perce?.partie.etat.creature).toMatchObject({ piece: null, neutralisee: 'expulsee' });
    expect(perce?.partie.etat.sante).toBe('indemne');
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('RSK-11 : percer en combinaison sous ses yeux, action libre passée (graine %i) : aucun dé, aucune menace, indemne', (graine) => {
    const neuve = nouvellePartie(MONDE, { version: VERSION, graine });
    const libre = apres(neuve, [...P_V2.slice(0, 7), { action: 'fermer', cible: 'porte', vers: 'coursive' }]);
    expect(libre.etat.creature).toMatchObject({ piece: 'p-panoramique', repit: false });
    expect(apercuDe(libre, PERCER)).toMatchObject({ risque: 'aucun', danger: null });
    const perce = engager(libre, PERCER);
    expect(perce.tirages).toEqual([]);
    expect(types(perce.evenements)).toEqual(['breche_ouverte', 'air_perdu', 'creature_expulsee']);
    expect(perce.partie.etat.sante).toBe('indemne');
  });

  it('VP-01 : percer sans combinaison sous ses yeux : aucun dé, la brèche puis la défaite, sans menace', () => {
    const libre = apres(depart(), [...P_V2.slice(0, 7), { action: 'fermer', cible: 'porte', vers: 'coursive' }, RETIRER]);
    expect(libre.etat.creature).toMatchObject({ piece: 'p-panoramique', repit: false });
    expect(apercuDe(libre, PERCER)).toMatchObject({ risque: 'mortel', danger: { type: 'asphyxie' } });
    const perce = engager(libre, PERCER);
    expect(perce.tirages).toEqual([]);
    expect(types(perce.evenements)).toEqual(['breche_ouverte', 'air_perdu', 'creature_expulsee', 'defaite']);
  });

  it('VP-01 : ouvrir vers la zone sans air sous ses yeux : inerte sur place, aucun dé, aucune menace', () => {
    const isolee = apres(depart(), [...EQUIPE, PERCER, { action: 'aller', cible: 'porte', vers: 'coursive' }, { action: 'fermer', cible: 'porte', vers: 'panoramique' }]);
    const creature = isolee.etat.creature;
    if (creature === null) throw new Error('Créature absente.');
    // État construit : elle est dans la coursive avec le passager, contact passé, répit épuisé.
    const enVue: Partie = { ...isolee, etat: { ...isolee.etat, creature: { ...creature, piece: 'p-coursive', contact: true, repit: false } } };
    const ouvrir: EtapeParcours = { action: 'ouvrir', cible: 'porte', vers: 'panoramique' };
    expect(apercuDe(enVue, ouvrir)).toMatchObject({ risque: 'aucun', danger: null });
    const ouverte = engager(enVue, ouvrir);
    expect(ouverte.tirages).toEqual([]);
    expect(types(ouverte.evenements)).toEqual(['passage_ouvert', 'air_perdu', 'creature_inerte']);
    expect(ouverte.partie.etat.creature).toMatchObject({ piece: 'p-coursive', neutralisee: 'inerte' });
    expect(ouverte.partie.etat.sante).toBe('indemne');
  });

  it('P-V1 : la créature exposée hors de la pièce percée devient inerte, découverte en arrivant', () => {
    const pas = suite(depart(), P_V1.slice(0, 9));
    expect(pas[7]?.partie.etat.creature).toMatchObject({ piece: 'p-embarquement', neutralisee: 'inerte' });
    expect(types(pas[7]?.evenements ?? [])).not.toContain('creature_inerte');
    expect(types(pas[8]?.evenements ?? [])).toContain('creature_inerte');
    expect(types(pas[8]?.evenements ?? [])).not.toContain('premier_contact');
  });
});

describe('AR-02 : indisponible, sans coût (VN-06, VN-08)', () => {
  it('enfiler deux fois, percer une baie percée, reboucher sans brèche : absents du menu, refus sans effet', () => {
    const equipe = apres(depart(), EQUIPE);
    const menu = (partie: Partie): string[] => observer(MONDE, partie.etat).menu.map((option) => option.action);
    expect(menu(equipe)).not.toContain('enfiler');
    refuse(equipe, { action: 'enfiler', cible: id('o-combinaison') }, 'deja_enfilee');
    expect(menu(equipe)).not.toContain('reboucher');
    refuse(equipe, { action: 'reboucher', cible: id('o-kit') }, 'sans_breche');
    const perce = engager(equipe, PERCER).partie;
    expect(menu(perce)).not.toContain('percer');
    refuse(perce, { action: 'percer', cible: id('o-baie') }, 'deja_percee');
  });

  it('VN-08 : repercer après la rustine rouvre une brèche ; aucune seconde rustine', () => {
    const rebouche = apres(depart(), [...EQUIPE, PERCER, REBOUCHER]);
    expect(sansAir(rebouche)).toEqual([]);
    expect(observer(MONDE, rebouche.etat).rebouchees).toEqual([expect.objectContaining({ nom: 'baie' })]);
    const reperce = engager(rebouche, PERCER);
    expect(sansAir(reperce.partie)).toEqual(['p-coursive', 'p-local', 'p-panoramique']);
    expect(choix(reperce.partie, REBOUCHER)).toMatchObject({ disponible: false, raison: 'vide' });
    refuse(reperce.partie, { action: 'reboucher', cible: id('o-kit') }, 'vide');
  });
});

describe('AR-02 : rustine, écoutille et reprise', () => {
  it.each([
    ['P-V1', P_V1, 'inerte'],
    ['P-V2', P_V2, 'expulsee'],
  ] as const)('VN-07, T-14 : reboucher après %s rend l’air partout ; la créature reste %s, même après reprise', (_nom, gestes, neutralisee) => {
    const rebouche = engager(apres(depart(), gestes.slice(0, 8)), REBOUCHER);
    expect(sansAir(rebouche.partie)).toEqual([]);
    expect(types(rebouche.evenements)).toEqual(['breche_rebouchee', 'air_revenu']);
    expect(rebouche.partie.etat.creature).toMatchObject({ neutralisee });
    const reprise = reprendrePartie(MONDE, JSON.parse(JSON.stringify(rebouche.partie)) as unknown, VERSION);
    expect(reprise.etat).toEqual(rebouche.partie.etat);
    expect(reprise.etat.creature).toMatchObject({ neutralisee });
  });

  it('VN-09 : l’écoutille fermée rend l’air à la cabine, rouverte le lui reprend', () => {
    const cabine = apres(depart(), P_V1.slice(0, 10));
    expect(sansAir(cabine)).toContain('p-cabine');
    const fermee = engager(cabine, { action: 'fermer', cible: 'ecoutille' });
    expect(sansAir(fermee.partie)).not.toContain('p-cabine');
    expect(fermee.evenements).toContainEqual({ type: 'air_revenu', pieces: [expect.objectContaining({ nom: 'cabine' })] });
    const rouverte = engager(fermee.partie, { action: 'ouvrir', cible: 'ecoutille' });
    expect(sansAir(rouverte.partie)).toContain('p-cabine');
    expect(rouverte.evenements).toContainEqual({ type: 'air_perdu', pieces: [expect.objectContaining({ nom: 'cabine' })] });
  });

  it.each([
    ['après la brèche', [...EQUIPE, PERCER]],
    ['après l’expulsion', P_V2.slice(0, 8)],
    ['après la rustine', [...P_V1.slice(0, 8), REBOUCHER]],
  ])('VN-10 : reprise %s, même air, même créature, aucun nouveau tirage', (_cas, gestes) => {
    const partie = apres(depart(), gestes);
    const reprise = reprendrePartie(MONDE, JSON.parse(JSON.stringify(partie)) as unknown, VERSION);
    expect(reprise.etat).toEqual(partie.etat);
    expect(sansAir(reprise)).toEqual(sansAir(partie));
    expect(reprise.enregistrement).toEqual(partie.enregistrement);
    expect(reprise.etat.generateur).toEqual(partie.etat.generateur);
  });
});

describe('AR-02 : aperçu et combinaison (C-06)', () => {
  it('VN-11 : l’aperçu de « percer » ne coûte rien, annonce les pièces connues, rien sur la créature non perçue', () => {
    const equipe = apres(depart(), EQUIPE);
    const lus = [apercuDe(equipe, PERCER), apercuDe(equipe, PERCER), apercuDe(equipe, PERCER)];
    expect(lus[1]).toEqual(lus[0]);
    expect(lus[2]).toEqual(lus[0]);
    expect(equipe.etat.actions).toBe(6);
    expect(lus[0]).toMatchObject({ risque: 'aucun', danger: null });
    expect(lus[0]?.savoir).toContainEqual({ type: 'perdront_air', pieces: ['coursive', 'local', 'panoramique'].map((nom) => expect.objectContaining({ nom })) });
    const texte = Object.values(rendreApercu(ENTREE.textes, lus[0] as Apercu)).flat().map(String).join(' ');
    expect(texte).toContain('Le vide gagnera la coursive des cabines, le local de sécurité et la salle panoramique.');
    expect(texte).not.toMatch(/créature|embarquement/i);
  });

  it('VN-12 : retirer la combinaison sans air est annoncé mortel ; engagé, défaite', () => {
    const perce = apres(depart(), [...EQUIPE, PERCER]);
    expect(apercuDe(perce, RETIRER)).toMatchObject({ risque: 'mortel', danger: { type: 'asphyxie' } });
    const retire = engager(perce, RETIRER);
    expect(retire.tirages).toEqual([]);
    expect(retire.evenements.at(-1)).toEqual({ type: 'defaite', causes: ['vide'] });
    expect(observer(MONDE, retire.partie.etat).issue).toBe('defaite');
  });

  it('VN-13 : retirer puis remettre la combinaison avec de l’air : deux actions, rien de perdu, protection rétablie', () => {
    const local = apres(depart(), P_V1.slice(0, 2));
    expect(observer(MONDE, local.etat).enfilee).toMatchObject({ nom: 'combinaison' });
    const [retire, remis] = suite(local, [RETIRER, ENFILER]);
    expect(observer(MONDE, retire?.partie.etat ?? local.etat)).toMatchObject({ enfilee: null, inventaire: [expect.objectContaining({ nom: 'combinaison' })] });
    expect(remis?.partie.etat.actions).toBe(local.etat.actions + 2);
    expect(observer(MONDE, remis?.partie.etat ?? local.etat).enfilee).toMatchObject({ nom: 'combinaison' });
    expect(rendreObservation(ENTREE.textes, observer(MONDE, remis?.partie.etat ?? local.etat))).toContain(
      'Votre casque est verrouillé : la combinaison étanche vous protège du vide.',
    );
  });
});
