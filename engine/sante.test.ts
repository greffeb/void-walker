import {
  apercu,
  empreinteEtat,
  jouer,
  nouvellePartie,
  observer,
  reprendrePartie,
  type DefMonde,
  type EtatPartie,
  type IdAction,
  type Partie,
} from './index';
import { aggraver, ATTEINT_JUSQUA, FACES } from './sante';

// Blessures, soin et fuite exposée (C-04 §2 à §4 ; D-183 à D-185). Fixtures nommées par leur rôle.
//
//   salle_c ══porte_ac══ salle_a (départ, trousse, boite) ══porte_ab══ salle_b (créature, cle) ══porte_bd (fermée)══ salle_d
const MONDE: DefMonde = {
  id: 'essai-sante',
  depart: 'a',
  pieces: [
    { id: 'a', nom: 'salle_a' },
    { id: 'b', nom: 'salle_b' },
    { id: 'c', nom: 'salle_c' },
    { id: 'd', nom: 'salle_d' },
  ],
  liaisons: [
    { id: 'ab', nom: 'porte_ab', entre: ['a', 'b'], ouverte: true },
    { id: 'bd', nom: 'porte_bd', entre: ['b', 'd'], ouverte: false },
    { id: 'ac', nom: 'porte_ac', entre: ['a', 'c'], ouverte: true },
  ],
  objets: [
    { id: 'trousse', nom: 'trousse', piece: 'a', soin: 1 },
    { id: 'boite', nom: 'boite', piece: 'a' },
    { id: 'cle', nom: 'cle', piece: 'b' },
  ],
  creature: { piece: 'b' },
};
const VERSION = 'sante-1';

function partie(graine = 7): Partie {
  return nouvellePartie(MONDE, { version: VERSION, graine });
}

function commande(courante: Partie, action: IdAction, nom: string) {
  const option = observer(MONDE, courante.etat).menu.find(
    (choix) => choix.action === action && (choix.cible.nom === nom || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === nom)),
  );
  if (option === undefined) throw new Error(`Option ${action} ${nom} absente.`);
  return option.commande;
}

function engager(courante: Partie, action: IdAction, nom: string) {
  const resultat = jouer(MONDE, courante, commande(courante, action, nom));
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return resultat;
}

/** Contact en B, puis l'action libre qui suit (ici, prendre la clé) : le passager est exposé à la suivante. */
function expose(graine = 7): Partie {
  const contact = engager(partie(graine), 'aller', 'salle_b');
  expect(contact.evenements.map((evenement) => evenement.type)).toContain('premier_contact');
  return engager(contact.partie, 'prendre', 'cle').partie;
}

/** Première graine dont le jet d'interception, pour cette action depuis l'état exposé, vérifie `voulu`. */
function graineOu(action: IdAction, nom: string, voulu: (jet: number) => boolean, depart: (graine: number) => Partie = expose): number {
  for (let graine = 1; graine < 500; graine++) {
    const jet = engager(depart(graine), action, nom).tirages[0];
    if (jet !== undefined && voulu(jet)) return graine;
  }
  throw new Error('Aucune graine ne donne ce jet.');
}

const defavorable = (jet: number): boolean => jet <= ATTEINT_JUSQUA;
const favorable = (jet: number): boolean => jet > ATTEINT_JUSQUA;
/** Une face au moins laisse le passager indemne ; sans elle, chaque jet touche (variante V1 de #194). */
const ESQUIVE_POSSIBLE = ATTEINT_JUSQUA < FACES;
const types = (evenements: readonly { type: string }[]): string[] => evenements.map((evenement) => evenement.type);

/** État injecté : seule la santé change, pour atteindre « critique » sans dépendre des dés. */
function avecSante(courante: Partie, sante: EtatPartie['sante']): Partie {
  return { ...courante, etat: { ...courante.etat, sante } };
}

describe('fuite exposée (C-04 §4, D-052, D-055)', () => {
  it('RSK-02 : jet défavorable puis favorable, deux graines : destination atteinte, aggravation seulement dans le premier cas', () => {
    const blesse = engager(expose(graineOu('aller', 'salle_a', defavorable)), 'aller', 'salle_a');
    expect(blesse.tirages).toHaveLength(1);
    // Elle frappe au seuil, avant le déplacement : le récit ne la place pas dans la pièce d'arrivée.
    expect(types(blesse.evenements)).toEqual(['aggravation_blesse', 'deplacement']);
    expect(blesse.evenements[0]).toEqual({ type: 'aggravation_blesse', causes: ['griffes'] });
    expect(blesse.partie.etat).toMatchObject({ piece: 'a', sante: 'blesse' });
    if (!ESQUIVE_POSSIBLE) {
      expect(() => graineOu('aller', 'salle_a', favorable)).toThrow(/Aucune graine/);
      return;
    }
    const indemne = engager(expose(graineOu('aller', 'salle_a', favorable)), 'aller', 'salle_a');
    expect(types(indemne.evenements)).toEqual(['menace', 'deplacement']);
    expect(indemne.partie.etat).toMatchObject({ piece: 'a', sante: 'indemne' });
  });

  it('D-055 : chaque face du D6 enregistrée ; jusqu’au seuil une blessure, au-delà aucune', () => {
    for (let face = 1; face <= 6; face++) {
      const resultat = engager(expose(graineOu('aller', 'salle_a', (jet) => jet === face)), 'aller', 'salle_a');
      expect(resultat.tirages).toEqual([face]);
      expect(resultat.partie.etat.sante, `face ${face}`).toBe(face <= ATTEINT_JUSQUA ? 'blesse' : 'indemne');
    }
  });

  it('RSK-05 : le jet consomme sa réaction ; elle a vu le passage pris et le suit au pas suivant, sans attaquer en arrivant', () => {
    const fuite = engager(expose(), 'aller', 'salle_a');
    expect(fuite.partie.etat.creature).toMatchObject({ piece: 'b', indice: { piece: 'a', par: 'ab' } });
    const suite = engager(fuite.partie, 'prendre', 'boite');
    expect(suite.tirages).toEqual([]);
    expect(types(suite.evenements)).toEqual(['objet_pris', 'creature_entre']);
    expect(suite.partie.etat.sante).toBe(fuite.partie.etat.sante);
  });

  it('RSK-07 : critique, jet défavorable : déplacement enregistré puis défaite ; la partie est terminée', () => {
    const graine = graineOu('aller', 'salle_a', defavorable, (g) => avecSante(expose(g), 'critique'));
    const fin = engager(avecSante(expose(graine), 'critique'), 'aller', 'salle_a');
    expect(types(fin.evenements)).toEqual(['deplacement', 'defaite']);
    expect(fin.partie.etat).toMatchObject({ piece: 'a', sante: 'vaincu' });
    const observation = observer(MONDE, fin.partie.etat);
    expect(observation).toMatchObject({ terminee: true, sante: 'vaincu', menu: [] });
    expect(jouer(MONDE, fin.partie, { action: 'prendre', cible: observation.objets[0]?.id ?? '' })).toMatchObject({
      type: 'refus',
      raison: 'partie_terminee',
    });
  });

  it('RSK-03 : passage fermé depuis sa pièce : refus sans tirage, sans déplacement ni blessure', () => {
    const avant = expose();
    const option = observer(MONDE, avant.etat).menu.find((choix) => choix.action === 'aller' && choix.cible.nom === 'porte_bd');
    expect(option).toMatchObject({ disponible: false, raison: 'ferme' });
    const resultat = jouer(MONDE, avant, option?.commande);
    expect(resultat).toMatchObject({ type: 'refus', raison: 'ferme' });
    expect(resultat.partie).toBe(avant);
  });

  it('RSK-01 : séparé d’elle par une porte fermée, le même franchissement ne tire aucun dé, quelle que soit la graine', () => {
    // Préparation : la porte A–B fermée ; la créature, déjà rencontrée, ne peut ni voir ni intercepter.
    const separe: DefMonde = { ...MONDE, liaisons: MONDE.liaisons.map((liaison) => (liaison.id === 'ab' ? { ...liaison, ouverte: false } : liaison)) };
    const etats = [3, 11].map((graine) => {
      const debut = nouvellePartie(separe, { version: VERSION, graine });
      const vers = observer(separe, debut.etat).menu.find((choix) => choix.action === 'aller' && choix.cible.nom === 'porte_ac');
      const passage = jouer(separe, debut, vers?.commande);
      if (passage.type !== 'engagee') throw new Error('Franchissement non engagé.');
      expect(passage.tirages).toEqual([]);
      return { ...passage.partie.etat, generateur: null };
    });
    expect(etats[0]).toMatchObject({ piece: 'c', sante: 'indemne' });
    expect(etats[0]).toEqual(etats[1]);
  });
});

describe('rester sous ses yeux (D-183) et action libre après le premier contact (D-184)', () => {
  it('juste après le premier contact, fuir ou rester ne tire aucun dé et ne blesse pas', () => {
    const contact = engager(partie(), 'aller', 'salle_b').partie;
    const fuir = engager(contact, 'aller', 'salle_a');
    expect(fuir.tirages).toEqual([]);
    expect(types(fuir.evenements)).toEqual(['deplacement']);
    const rester = engager(contact, 'prendre', 'cle');
    expect(rester.tirages).toEqual([]);
    expect(types(rester.evenements)).toEqual(['objet_pris', 'menace']);
    expect(rester.partie.etat.sante).toBe('indemne');
  });

  it('ensuite, chaque action dans sa pièce passe par le même dé : jusqu’au seuil, une blessure', () => {
    const mal = engager(expose(graineOu('poser', 'cle', defavorable)), 'poser', 'cle');
    expect(types(mal.evenements)).toEqual(['objet_pose', 'aggravation_blesse']);
    if (!ESQUIVE_POSSIBLE) {
      expect(() => graineOu('poser', 'cle', favorable)).toThrow(/Aucune graine/);
      return;
    }
    const bien = engager(expose(graineOu('poser', 'cle', favorable)), 'poser', 'cle');
    expect(types(bien.evenements)).toEqual(['objet_pose', 'menace']);
    expect(bien.partie.etat.sante).toBe('indemne');
  });

  it('entrer de nouveau dans sa pièce : une menace, pas de dé ce pas-là', () => {
    // Sorti indemne si une face le permet ; blessé sinon, ce qui ne change rien à ce pas-là.
    const graine = graineOu('aller', 'salle_a', ESQUIVE_POSSIBLE ? favorable : () => true);
    const dehors = engager(expose(graine), 'aller', 'salle_a').partie;
    const retour = engager({ ...dehors, etat: { ...dehors.etat, creature: { piece: 'b', indice: null, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null } } }, 'aller', 'salle_b');
    expect(retour.tirages).toEqual([]);
    expect(types(retour.evenements)).toEqual(['deplacement', 'menace']);
  });
});

describe('aperçu du risque (C-04 §4.3, RSK-09)', () => {
  it('exposé : « élevé », la créature peut blesser ; critique : « mortel » ; consulter dix fois ne tire rien', () => {
    const exposee = expose();
    const avant = JSON.stringify(exposee);
    for (let fois = 0; fois < 10; fois++) {
      for (const choix of observer(MONDE, exposee.etat).menu.filter((option) => option.disponible && option.action !== 'regarder')) {
        expect(apercu(MONDE, exposee, choix.commande)).toMatchObject({ type: 'apercu', apercu: { risque: 'eleve', danger: { type: 'interception' } } });
      }
    }
    expect(JSON.stringify(exposee)).toBe(avant);
    expect(apercu(MONDE, avecSante(exposee, 'critique'), commande(exposee, 'aller', 'salle_a'))).toMatchObject({
      apercu: { risque: 'mortel', danger: { type: 'interception_mortelle' } },
    });
  });

  it('pendant l’action libre qui suit le premier contact, aucun risque annoncé', () => {
    const contact = engager(partie(), 'aller', 'salle_b').partie;
    expect(apercu(MONDE, contact, commande(contact, 'aller', 'salle_a'))).toMatchObject({ apercu: { risque: 'aucun', danger: null } });
  });
});

describe('blessures et soin (C-04 §2, §3 ; D-185)', () => {
  it('RSK-04 : deux causes dans un même pas, une seule aggravation, causes conservées', () => {
    const { etat, evenements } = aggraver(partie().etat, ['griffes', 'griffes']);
    expect(etat.sante).toBe('blesse');
    expect(evenements).toEqual([{ type: 'aggravation_blesse', causes: ['griffes', 'griffes'] }]);
  });

  it('chaîne indemne → blessé → critique → vaincu', () => {
    let etat = partie().etat;
    const suite: string[] = [];
    for (let fois = 0; fois < 4; fois++) {
      const resultat = aggraver(etat, ['griffes']);
      etat = resultat.etat;
      suite.push(etat.sante, ...types(resultat.evenements));
    }
    expect(suite).toEqual(['blesse', 'aggravation_blesse', 'critique', 'aggravation_critique', 'vaincu', 'defaite', 'vaincu']);
  });

  it('RSK-06 : blessé, à l’abri, trousse posée dans la pièce : indemne, dose consommée, créature inchangée', () => {
    // État injecté : blessé dans la salle A, créature hors de vue.
    const blesse = avecSante(partie(), 'blesse');
    const soin = engager(blesse, 'soigner', 'trousse');
    expect(soin.tirages).toEqual([]);
    expect(types(soin.evenements)).toEqual(['soin_indemne']);
    expect(soin.partie.etat).toMatchObject({ sante: 'indemne', doses: { trousse: 0 } });
    expect(soin.partie.etat.creature).toEqual(blesse.etat.creature);
    const vide = observer(MONDE, avecSante(soin.partie, 'blesse').etat).menu.find((option) => option.action === 'soigner');
    expect(vide).toMatchObject({ disponible: false, raison: 'vide' });
  });

  it('indemne : se soigner est indisponible, jamais gaspillé ; critique : on redevient blessé ; en main aussi', () => {
    const depart = partie();
    expect(observer(MONDE, depart.etat).menu.find((option) => option.action === 'soigner')).toMatchObject({ disponible: false, raison: 'pas_blesse' });
    expect(jouer(MONDE, depart, commande(depart, 'soigner', 'trousse'))).toMatchObject({ type: 'refus', raison: 'pas_blesse' });
    const enMain = engager(depart, 'prendre', 'trousse').partie;
    const soin = engager(avecSante(enMain, 'critique'), 'soigner', 'trousse');
    expect(types(soin.evenements)).toEqual(['soin_blesse']);
    expect(soin.partie.etat.sante).toBe('blesse');
    expect(apercu(MONDE, avecSante(enMain, 'critique'), commande(enMain, 'soigner', 'trousse'))).toMatchObject({
      apercu: { risque: 'aucun', savoir: [{ type: 'soignera' }, { type: 'videra', objet: { nom: 'trousse' } }] },
    });
  });

  it('se soigner sous ses yeux : le soin d’abord, puis le jet peut blesser dans le même pas (C-04 §3)', () => {
    // État injecté : trousse en main, critique, exposé dans la salle B.
    const avecTrousse = (graine: number): Partie => {
      const exposee = avecSante(expose(graine), 'critique');
      return { ...exposee, etat: { ...exposee.etat, objets: { ...exposee.etat.objets, trousse: { type: 'passager' } } } };
    };
    const graine = graineOu('soigner', 'trousse', defavorable, avecTrousse);
    const resultat = engager(avecTrousse(graine), 'soigner', 'trousse');
    expect(types(resultat.evenements)).toEqual(['soin_blesse', 'aggravation_critique']);
    expect(resultat.partie.etat.sante).toBe('critique');
    // L'aperçu tient compte du soin d'abord : « élevé », pas « mortel » ; partir reste « mortel ».
    const avant = avecTrousse(graine);
    expect(apercu(MONDE, avant, commande(avant, 'soigner', 'trousse'))).toMatchObject({ apercu: { risque: 'eleve', danger: { type: 'interception' } } });
    expect(apercu(MONDE, avant, commande(avant, 'aller', 'salle_a'))).toMatchObject({ apercu: { risque: 'mortel' } });
  });
});

describe('reprise (C-09, RSK-08)', () => {
  it('reprendre après un jet défavorable : même blessure, même destination, aucun nouveau dé', () => {
    const blesse = engager(expose(graineOu('aller', 'salle_a', defavorable)), 'aller', 'salle_a').partie;
    const sauvegarde = JSON.parse(JSON.stringify({ enregistrement: blesse.enregistrement, etat: blesse.etat })) as unknown;
    const reprise = reprendrePartie(MONDE, sauvegarde, VERSION);
    expect(empreinteEtat(reprise.etat)).toBe(empreinteEtat(blesse.etat));
    expect(reprise.etat).toMatchObject({ piece: 'a', sante: 'blesse' });
    expect(reprise.enregistrement.actions.at(-1)?.tirages).toEqual(blesse.enregistrement.actions.at(-1)?.tirages);
  });
});
