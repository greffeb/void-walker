import {
  empreinteEtat,
  jouer,
  nouvellePartie,
  observer,
  type DefMonde,
  type EtatCreature,
  type Evenement,
  type IdAction,
  type OptionMenu,
  type Partie,
} from '../engine';
import { CATALOGUE } from './catalogue';
import { stationDeReference } from './verifier-station';

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
