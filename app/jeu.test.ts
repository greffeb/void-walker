import { IDBFactory } from 'fake-indexeddb';
import { observer, type DefMonde } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { demarrer, jouerOption, mondeDemande, type Environnement, type Jeu } from './jeu';
import { stockageIndexedDB, type Stockage } from './sauvegarde';

const { monde, textes } = MONDES['monde-test'] as EntreeMonde;

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
  return jouerOption(env, jeu, option);
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
    expect(rouvert.rappel).toEqual(jeu.rappel);
    expect(rouvert.sauvegarde).toBe('sauvegardee');
  });

  it('le rappel de la dernière action suit le geste et se retrouve à la reprise (12 §3.3)', async () => {
    const env = environnement(stockageIndexedDB('rappel', fabrique));
    let jeu = await pret(env);
    expect(jeu.rappel).toBeNull();
    jeu = await choisir(env, jeu, 'prendre');
    expect(jeu.rappel).toEqual({ texte: 'Carnet · Prendre', capitales: false });
    jeu = await choisir(env, jeu, 'regarder');
    expect(jeu.rappel).toEqual({ texte: 'Regarder autour de vous', capitales: true });
    jeu = await choisir(env, jeu, 'ouvrir');
    expect((await pret(environnement(stockageIndexedDB('rappel', fabrique)))).rappel).toEqual(jeu.rappel);
    jeu = await choisir(env, jeu, 'aller');
    expect(jeu.rappel).toEqual({ texte: 'Aller vers · atelier', capitales: true });
    expect((await pret(environnement(stockageIndexedDB('rappel', fabrique)))).rappel).toEqual(jeu.rappel);
  });

  it('le parcours du monde de test se joue jusqu’au bout', async () => {
    const env = environnement(stockageIndexedDB('parcours', fabrique));
    let jeu = await pret(env);
    for (const action of ['prendre', 'ouvrir', 'aller', 'poser']) jeu = await choisir(env, jeu, action);
    const fin = await pret(environnement(stockageIndexedDB('parcours', fabrique)));
    const observation = observer(monde, fin.partie.etat);
    expect(observation.piece.nom).toBe('atelier');
    expect(observation.objets.map((objet) => objet.nom)).toEqual(['carnet', 'trousse']);
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
    expect(demarrage.type).toBe('reprise_impossible');
  });

  it('sauvegarde illisible : rien n’est écrasé, le joueur est prévenu', async () => {
    let ecritures = 0;
    const env = environnement({
      lire: () => Promise.reject(new Error('base verrouillée')),
      ecrire: () => {
        ecritures++;
        return Promise.resolve();
      },
    });
    const demarrage = await demarrer(env);
    expect(demarrage).toMatchObject({ type: 'reprise_impossible', raison: expect.stringContaining('base verrouillée') });
    expect(ecritures).toBe(0);
  });

  it('deux adresses publiées gardent des parties séparées', async () => {
    const principale = environnement(stockageIndexedDB('void-walker:/void-walker/', fabrique));
    const test = environnement(stockageIndexedDB('void-walker:/void-walker/pr-1/', fabrique));
    await choisir(principale, await pret(principale), 'prendre');
    expect((await pret(test)).partie.etat.actions).toBe(0);
  });
});

describe('appli : monde choisi par l’adresse', () => {
  it('« ?monde= » choisit un monde connu ; un id inconnu ou absent laisse le monde par défaut', () => {
    expect(mondeDemande('?monde=monde-test', MONDES, 'ar-01')).toBe('monde-test');
    expect(mondeDemande('?monde=ar-01', MONDES, 'monde-test')).toBe('ar-01');
    expect(mondeDemande('', MONDES, 'ar-01')).toBe('ar-01');
    expect(mondeDemande('?monde=', MONDES, 'ar-01')).toBe('ar-01');
    expect(mondeDemande('?monde=inconnu', MONDES, 'ar-01')).toBe('ar-01');
    expect(mondeDemande('?monde=toString', MONDES, 'ar-01')).toBe('ar-01');
  });
});

describe('appli : AR-01, rappel avec paramètre et parole d’IA Station à la reprise (#103)', () => {
  const ar01 = MONDES['ar-01'] as EntreeMonde;
  const P_C = ar01.parcours.find((parcours) => parcours.nom.startsWith('P-C'))?.etapes ?? [];
  let fabrique: IDBFactory;
  beforeEach(() => {
    fabrique = new IDBFactory();
  });
  const envAr01 = (): Environnement => ({ monde: ar01.monde, textes: ar01.textes, version: 'v-test', stockage: stockageIndexedDB('ar-01', fabrique), graine: () => 20261010 });

  async function etapes(env: Environnement, nombre: number): Promise<Jeu> {
    let jeu = await pret(env);
    for (const etape of P_C.slice(0, nombre)) {
      const option = observer(ar01.monde, jeu.partie.etat).menu.find(
        (choix) =>
          choix.action === etape.action &&
          choix.cible.nom === etape.cible &&
          (etape.vers === undefined || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === etape.vers)) &&
          (etape.parametre === undefined || (choix.parametre?.sorte === 'passage' ? choix.parametre.vers?.nom : choix.parametre?.nom) === etape.parametre),
      );
      if (option === undefined) throw new Error(`Option ${JSON.stringify(etape)} absente.`);
      jeu = await jouerOption(env, jeu, option);
    }
    return jeu;
  }

  it('déplacer la caisse : le rappel nomme la position, à chaud comme à la reprise', async () => {
    const jeu = await etapes(envAr01(), 3);
    expect(jeu.rappel).toEqual({ texte: 'Caisse · Déplacer · sous la grille', capitales: false });
    expect((await pret(envAr01())).rappel).toEqual(jeu.rappel);
  });

  it('verser la burette : le rappel nomme la cloison, à chaud comme à la reprise', async () => {
    const jeu = await etapes(envAr01(), 6);
    expect(jeu.rappel).toEqual({ texte: 'Burette d’huile · Verser · Cloison de la salle d’observation', capitales: false });
    expect((await pret(envAr01())).rappel).toEqual(jeu.rappel);
  });

  it('par la grille jamais franchie : le rappel nomme la pièce d’arrivée ; IA Station parle et reparle à la reprise', async () => {
    expect((await pret(envAr01())).assistance).toEqual([ar01.textes.assistance.reveil]);
    const jeu = await etapes(envAr01(), 5);
    expect(jeu.rappel).toEqual({ texte: 'Aller vers · local énergie', capitales: true });
    expect(jeu.assistance).toEqual([ar01.textes.assistance.energie]);
    const repris = await pret(envAr01());
    expect(repris.rappel).toEqual(jeu.rappel);
    expect(repris.assistance).toEqual(jeu.assistance);
  });
});
