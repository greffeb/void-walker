import type { Des } from './des';
import { etatInitial, type EtatPartie } from './etat';
import { apercu, jouer, nouvellePartie, observer, validerMonde, type DefMonde, type IdAction, type OptionMenu, type Partie } from './index';

// Cloison verrouillée et commande de déverrouillage de l'ordre libre (D-259, spec L5 §3.1), sur une fixture réduite. Les noms
// ne servent qu'à retrouver les options du menu : aucune règle ne lit un nom (D-078).
//
//   fond (créature) ══porte══ aile (commande) ══porte══ couloir (départ) ══cloison verrouillée══ sas (feu)
//                                                         ╚══porte══ réduit
const MONDE: DefMonde = {
  id: 'verrous-1',
  depart: 'p-couloir',
  pieces: [
    { id: 'p-couloir', nom: 'couloir' },
    { id: 'p-aile', nom: 'aile' },
    { id: 'p-fond', nom: 'fond' },
    { id: 'p-reduit', nom: 'reduit' },
    { id: 'p-sas', nom: 'sas', feu: true },
  ],
  liaisons: [
    { id: 'l-couloir-aile', nom: 'porte_aile', entre: ['p-couloir', 'p-aile'], ouverte: false },
    { id: 'l-aile-fond', nom: 'porte_fond', entre: ['p-aile', 'p-fond'], ouverte: true },
    { id: 'l-couloir-reduit', nom: 'porte_reduit', entre: ['p-couloir', 'p-reduit'], ouverte: false },
    { id: 'l-cloison', nom: 'cloison', entre: ['p-couloir', 'p-sas'], ouverte: false, verrouillee: true },
  ],
  objets: [
    { id: 'o-commande', nom: 'commande', piece: 'p-aile', portable: false, deverrouille: 'l-cloison' },
    { id: 'o-bidon', nom: 'bidon', piece: 'p-reduit', extinction: 1 },
  ],
  creature: { piece: 'p-fond' },
};

function partie(monde: DefMonde = MONDE): Partie {
  return nouvellePartie(monde, { version: 'verrous-1', graine: 3 });
}

function option(courante: Partie, action: IdAction, nom: string, monde: DefMonde = MONDE): OptionMenu | undefined {
  return observer(monde, courante.etat).menu.find(
    (choix) => choix.action === action && (choix.cible.nom === nom || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === nom)),
  );
}

function engager(courante: Partie, action: IdAction, nom: string, monde: DefMonde = MONDE): Partie {
  const choix = option(courante, action, nom, monde);
  if (choix === undefined || !choix.disponible) throw new Error(`Option ${action} ${nom} absente ou indisponible.`);
  const resultat = jouer(monde, courante, choix.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return resultat.partie;
}

/** Toutes les issues d'une commande, une par suite de faces de dés possible. */
function issues(courante: Partie, commande: OptionMenu['commande']): Partie[] {
  const parties: Partie[] = [];
  const prefixes: number[][] = [[]];
  for (let prefixe = prefixes.pop(); prefixe !== undefined; prefixe = prefixes.pop()) {
    let position = 0;
    let demande: number | null = null;
    const des: Des = {
      lancer: (faces) => {
        const face = prefixe[position++];
        if (face !== undefined) return face;
        demande = faces;
        throw new Error('dé à explorer');
      },
    };
    try {
      const resultat = jouer(MONDE, courante, commande, des);
      if (resultat.type === 'engagee') parties.push(resultat.partie);
    } catch (erreur) {
      if (demande === null) throw erreur;
      for (let face = 1; face <= demande; face++) prefixes.push([...prefixe, face]);
    }
  }
  return parties;
}

describe('cloison verrouillée (D-259)', () => {
  it('se ferme au départ et s’annonce verrouillée : ouvrir est indisponible et refusé sans coût', () => {
    const depart = partie();
    expect(depart.etat.verrous).toEqual(['l-cloison']);
    const ouvrir = option(depart, 'ouvrir', 'cloison');
    expect(ouvrir).toMatchObject({ disponible: false, raison: 'verrouillee' });
    const resultat = jouer(MONDE, depart, ouvrir?.commande);
    expect(resultat).toMatchObject({ type: 'refus', raison: 'verrouillee' });
    expect(resultat.partie).toBe(depart);
  });

  it('se déverrouille par sa commande, d’une action discrète, sans s’ouvrir seule', () => {
    const dansAile = engager(engager(partie(), 'ouvrir', 'aile'), 'aller', 'aile');
    const choix = option(dansAile, 'actionner', 'commande');
    expect(choix?.disponible).toBe(true);
    expect(apercu(MONDE, dansAile, choix?.commande)).toMatchObject({
      type: 'apercu',
      apercu: { cout: 'aucun', risque: 'aucun', savoir: [{ type: 'deverrouillera', objet: { nom: 'commande' } }] },
    });
    const resultat = jouer(MONDE, dansAile, choix?.commande);
    if (resultat.type !== 'engagee') throw new Error(resultat.type);
    expect(resultat.evenements.map((evenement) => evenement.type)).toContain('cloison_deverrouillee');
    expect(resultat.tirages).toEqual([]);
    expect(resultat.partie.etat.verrous).toEqual([]);
    expect(resultat.partie.etat.liaisons['l-cloison']).toBe(false);
    // Une seule fois : la commande disparaît du menu, et la rejouer est refusé.
    expect(option(resultat.partie, 'actionner', 'commande')).toBeUndefined();
    expect(jouer(MONDE, resultat.partie, choix?.commande)).toMatchObject({ type: 'refus', raison: 'deja_fait' });
  });

  it('déverrouillée, elle s’ouvre et se ferme comme une porte ordinaire', () => {
    const leve = engager(engager(engager(engager(partie(), 'ouvrir', 'aile'), 'aller', 'aile'), 'actionner', 'commande'), 'aller', 'couloir');
    expect(option(leve, 'ouvrir', 'cloison')?.disponible).toBe(true);
    const ouverte = engager(leve, 'ouvrir', 'cloison');
    expect(ouverte.etat.liaisons['l-cloison']).toBe(true);
    expect(engager(ouverte, 'fermer', 'cloison').etat.liaisons['l-cloison']).toBe(false);
  });

  it('ne s’ouvre par rien d’autre : toutes les commandes sauf la sienne, toutes les faces de dés, créature et feu compris', () => {
    const vus = new Set<string>();
    const file: Partie[] = [partie()];
    const cle = (etat: EtatPartie): string => JSON.stringify({ ...etat, actions: 0, generateur: null, memoire: null, reperes: null, messages: [], visitees: [] });
    let explores = 0;
    for (let courante = file.pop(); courante !== undefined; courante = file.pop()) {
      explores++;
      for (const choix of observer(MONDE, courante.etat).menu) {
        if (!choix.disponible || choix.action === 'regarder' || choix.action === 'actionner') continue;
        for (const suivante of issues(courante, choix.commande)) {
          expect(suivante.etat.liaisons['l-cloison']).toBe(false);
          expect(suivante.etat.verrous).toEqual(['l-cloison']);
          if (suivante.etat.sante === 'vaincu') continue;
          const etat = cle(suivante.etat);
          if (vus.has(etat)) continue;
          vus.add(etat);
          file.push({ ...suivante, enregistrement: { ...suivante.enregistrement, actions: [] } });
        }
      }
    }
    // Le graphe est fini et complet : le passager s'y bat, fuit, se soigne, et le feu reste derrière la cloison.
    expect(explores).toBeGreaterThan(50);
    // Exploration complète : plusieurs secondes sur la machine de vérification de GitHub depuis que la créature force les portes (D-279).
  }, 60_000);

  it('est refusée par la validation hors de sa forme', () => {
    const avec = (changement: Partial<DefMonde>): string[] => validerMonde({ ...MONDE, ...changement });
    expect(avec({})).toEqual([]);
    const cloison = MONDE.liaisons[3];
    if (cloison === undefined) throw new Error('Cloison absente.');
    const autres = MONDE.liaisons.slice(0, 3);
    expect(avec({ liaisons: [...autres, { ...cloison, ouverte: true }] })).toContain('l-cloison : verrouillée mais ouverte au départ.');
    expect(avec({ liaisons: [...autres, { ...cloison, sonAuTravers: true }] })).toContain('l-cloison : cloison verrouillée qui n\'est pas une porte pleine.');
    expect(avec({ objets: MONDE.objets.slice(1) })).toContain('l-cloison : verrouillée sans commande.');
    expect(avec({ objets: [{ id: 'o-commande', nom: 'commande', piece: 'p-aile', deverrouille: 'l-cloison' }, ...MONDE.objets.slice(1)] })).toContain(
      'o-commande : commande portable.',
    );
    expect(
      avec({ objets: [...MONDE.objets, { id: 'o-autre', nom: 'autre', piece: 'p-aile', portable: false, deverrouille: 'l-couloir-aile' }] }),
    ).toContain('o-autre : déverrouille autre chose qu\'une cloison verrouillée.');
  });

  it('n’ajoute rien à l’état d’un monde sans cloison verrouillée', () => {
    const sans: DefMonde = { ...MONDE, liaisons: MONDE.liaisons.slice(0, 3), objets: MONDE.objets.slice(1) };
    expect(Object.hasOwn(etatInitial(sans, 1), 'verrous')).toBe(false);
  });
});

// Porte blindée et lecteur de carte (#203), sur une fixture réduite :
//
//   remise (créature) ══porte══ couloir (départ, lecteur) ══porte══ vestiaire (carte)
//                                  ╚══porte blindée verrouillée══ sas (capsule) ══écoutille══ cabine (pupitre)
const SAS: DefMonde = {
  id: 'sas-1',
  depart: 'p-couloir',
  pieces: [
    { id: 'p-couloir', nom: 'couloir' },
    { id: 'p-vestiaire', nom: 'vestiaire' },
    { id: 'p-remise', nom: 'remise' },
    { id: 'p-sas', nom: 'sas' },
    { id: 'p-cabine', nom: 'cabine' },
  ],
  liaisons: [
    { id: 'l-couloir-vestiaire', nom: 'porte_vestiaire', entre: ['p-couloir', 'p-vestiaire'], ouverte: true },
    { id: 'l-couloir-remise', nom: 'porte_remise', entre: ['p-couloir', 'p-remise'], ouverte: false },
    { id: 'l-blindee', nom: 'porte_blindee', entre: ['p-couloir', 'p-sas'], ouverte: false, verrouillee: true, blindee: true },
    { id: 'l-sas-cabine', nom: 'ecoutille', entre: ['p-sas', 'p-cabine'], ouverte: false },
  ],
  objets: [
    { id: 'o-lecteur', nom: 'lecteur', piece: 'p-couloir', portable: false, deverrouille: 'l-blindee', exige: 'o-carte' },
    { id: 'o-carte', nom: 'carte', piece: 'p-vestiaire' },
    { id: 'o-capsule', nom: 'capsule', piece: 'p-sas', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  creature: { piece: 'p-remise' },
};

describe('porte blindée et lecteur de carte (#203)', () => {
  const depart = (): Partie => nouvellePartie(SAS, { version: 'sas-1', graine: 3 });
  const avecCarte = (): Partie => engager(engager(engager(depart(), 'aller', 'vestiaire', SAS), 'prendre', 'carte', SAS), 'aller', 'couloir', SAS);

  it('sans la carte en main, le lecteur reste au menu, indisponible, et l’actionner est refusé sans coût', () => {
    const debut = depart();
    const lecteur = option(debut, 'actionner', 'lecteur', SAS);
    expect(lecteur).toMatchObject({ disponible: false, raison: 'sans_carte' });
    const resultat = jouer(SAS, debut, lecteur?.commande);
    expect(resultat).toMatchObject({ type: 'refus', raison: 'sans_carte' });
    expect(resultat.partie).toBe(debut);
  });

  it('carte en main, le lecteur lève le verrou pour de bon ; la porte reste fermée et la carte reste en main', () => {
    const resultat = jouer(SAS, avecCarte(), option(avecCarte(), 'actionner', 'lecteur', SAS)?.commande);
    if (resultat.type !== 'engagee') throw new Error(resultat.type);
    expect(resultat.evenements.map((evenement) => evenement.type)).toContain('cloison_deverrouillee');
    expect(resultat.partie.etat.verrous).toEqual([]);
    expect(resultat.partie.etat.liaisons['l-blindee']).toBe(false);
    expect(resultat.partie.etat.objets['o-carte']).toEqual({ type: 'passager' });
    expect(option(resultat.partie, 'ouvrir', 'porte_blindee', SAS)?.disponible).toBe(true);
  });

  it('la sortie compte sur la carte : à portée, la capsule reste atteignable ; hors de portée, plus aucune sortie', () => {
    expect(observer(SAS, depart().etat).sansSortie).toBe(false);
    const objets = SAS.objets.map((objet) => (objet.id === 'o-carte' ? { ...objet, piece: 'p-sas' } : objet));
    const enfermee: DefMonde = { ...SAS, objets };
    expect(validerMonde(enfermee)).toEqual([]);
    expect(observer(enfermee, etatInitial(enfermee, 1)).sansSortie).toBe(true);
  });

  it('est refusée par la validation hors de sa forme', () => {
    const avec = (changement: Partial<DefMonde>): string[] => validerMonde({ ...SAS, ...changement });
    expect(avec({})).toEqual([]);
    const [vestiaire, remise, blindee, ecoutille] = SAS.liaisons;
    const [lecteur, carte, ...autres] = SAS.objets;
    if (vestiaire === undefined || remise === undefined || blindee === undefined || ecoutille === undefined || lecteur === undefined || carte === undefined) {
      throw new Error('Fixture incomplète.');
    }
    expect(avec({ liaisons: [vestiaire, remise, { ...blindee, verrouillee: false, ouverte: true, gouffre: true }, ecoutille] })).toContain(
      'l-blindee : porte blindée qui n\'est pas une porte pleine.',
    );
    expect(avec({ objets: [lecteur, { ...carte, portable: false }, ...autres] })).toContain('o-lecteur : exige un objet inconnu ou non portable.');
    expect(avec({ objets: [lecteur, { ...carte, exige: 'o-carte' }, ...autres] })).toContain('o-carte : exige sans être une commande.');
  });
});
