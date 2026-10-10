import { IDBFactory } from 'fake-indexeddb';
import { observer, type DefMonde } from '../engine';
import { MONDE_PAR_DEFAUT, MONDES, type EntreeMonde } from '../content';
import { demarrer, jouerCommande, type Environnement, type Jeu } from './jeu';
import { stockageIndexedDB, type Stockage } from './sauvegarde';

const { monde, textes } = MONDES[MONDE_PAR_DEFAUT] as EntreeMonde;

function environnement(stockage: Stockage, version = 'v-test'): Environnement {
  return { monde, textes, version, stockage, graine: () => 31 };
}

async function pret(env: Environnement): Promise<Jeu> {
  const demarrage = await demarrer(env);
  if (demarrage.type !== 'pret') throw new Error(demarrage.raison);
  return demarrage.jeu;
}

async function choisir(env: Environnement, jeu: Jeu, action: string, disponible = true): Promise<Jeu> {
  const option = observer(monde as DefMonde, jeu.partie.etat).menu.find((choix) => choix.action === action && choix.disponible === disponible);
  if (option === undefined) throw new Error(`Option ${action} absente.`);
  return jouerCommande(env, jeu, option.commande);
}

describe('appli : sauvegarde et reprise (AP-03, C-09)', () => {
  let fabrique: IDBFactory;
  beforeEach(() => {
    fabrique = new IDBFactory();
  });

  it('première ouverture : nouvelle partie sauvegardée ; réouverture : même partie, même récit', async () => {
    const env = environnement(stockageIndexedDB('essai', fabrique));
    let jeu = await pret(env);
    expect(jeu.sauvegarde).toBe('sauvegardee');
    jeu = await choisir(env, jeu, 'prendre');
    jeu = await choisir(env, jeu, 'ouvrir');
    expect(jeu.partie.etat.actions).toBe(2);

    const rouvert = await pret(environnement(stockageIndexedDB('essai', fabrique)));
    expect(rouvert.partie).toEqual(jeu.partie);
    expect(rouvert.recit).toEqual(jeu.recit);
    expect(rouvert.sauvegarde).toBe('sauvegardee');
  });

  it('le parcours du monde de test se joue jusqu’au bout', async () => {
    const env = environnement(stockageIndexedDB('parcours', fabrique));
    let jeu = await pret(env);
    for (const action of ['prendre', 'ouvrir', 'aller', 'poser']) jeu = await choisir(env, jeu, action);
    const fin = await pret(environnement(stockageIndexedDB('parcours', fabrique)));
    const observation = observer(monde, fin.partie.etat);
    expect(observation.piece.nom).toBe('atelier');
    expect(observation.objets.map((objet) => objet.nom)).toEqual(['carnet']);
    expect(fin.partie.etat.actions).toBe(4);
  });

  it('refus et consultation n’écrivent rien et ne changent pas la partie', async () => {
    const reel = stockageIndexedDB('refus', fabrique);
    let ecritures = 0;
    const env = environnement({ lire: () => reel.lire(), ecrire: async (donnees) => { ecritures++; await reel.ecrire(donnees); } });
    const jeu = await pret(env);
    const apresDepart = ecritures;
    const refuse = await choisir(env, jeu, 'aller', false);
    expect(refuse.recit).toEqual(['Ce passage est fermé : vous ne pouvez pas le franchir.']);
    expect(refuse.partie).toBe(jeu.partie);
    const regarde = await choisir(env, jeu, 'regarder');
    expect(regarde.partie).toBe(jeu.partie);
    expect(ecritures).toBe(apresDepart);
  });

  it('écriture refusée : échec signalé, jeu possible, nouvel essai à l’action suivante (C-09 §3)', async () => {
    const reel = stockageIndexedDB('panne', fabrique);
    let enPanne = false;
    const env = environnement({ lire: () => reel.lire(), ecrire: (donnees) => (enPanne ? Promise.reject(new Error('quota')) : reel.ecrire(donnees)) });
    let jeu = await pret(env);
    enPanne = true;
    jeu = await choisir(env, jeu, 'prendre');
    expect(jeu.sauvegarde).toBe('echec');
    expect(jeu.partie.etat.actions).toBe(1);
    jeu = await choisir(env, jeu, 'regarder');
    expect(jeu.sauvegarde).toBe('echec');
    enPanne = false;
    jeu = await choisir(env, jeu, 'ouvrir');
    expect(jeu.sauvegarde).toBe('sauvegardee');
    expect((await pret(environnement(reel))).partie).toEqual(jeu.partie);
  });

  it('partie d’une autre version : le jeu le dit au lieu de reprendre (C-09 §4)', async () => {
    const stockage = stockageIndexedDB('version', fabrique);
    await pret(environnement(stockage, 'ancienne'));
    const demarrage = await demarrer(environnement(stockage, 'nouvelle'));
    expect(demarrage.type).toBe('incompatible');
  });

  it('deux adresses publiées gardent des parties séparées', async () => {
    const principale = environnement(stockageIndexedDB('void-walker:/void-walker/', fabrique));
    const test = environnement(stockageIndexedDB('void-walker:/void-walker/pr-1/', fabrique));
    await choisir(principale, await pret(principale), 'prendre');
    expect((await pret(test)).partie.etat.actions).toBe(0);
  });
});
