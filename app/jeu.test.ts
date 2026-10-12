import { IDBFactory } from 'fake-indexeddb';
import { empreinteEtat, lireExport, observer, rejouer, type DefMonde } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { abandonner, charger, commencer, demarrer, fichierPartie, historiqueAffiche, jouerOption, lireLus, marquerLus, mondeDemande, sauvegardePresente, type Environnement, type Jeu } from './jeu';
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

  it('lire la sauvegarde à l’accueil ne crée pas de partie et ne modifie pas une sauvegarde existante', async () => {
    const reel = stockageIndexedDB('accueil-lecture', fabrique);
    let ecritures = 0;
    const env = environnement({ ...reel, ecrire: async (donnees) => { ecritures++; await reel.ecrire(donnees); } });

    expect(await sauvegardePresente(env)).toBe(false);
    expect(await reel.lire()).toBeNull();
    expect(ecritures).toBe(0);

    await commencer(env);
    const sauvegarde = await reel.lire();
    expect(await sauvegardePresente(env)).toBe(true);
    expect(await reel.lire()).toEqual(sauvegarde);
    expect(ecritures).toBe(1);
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
    const env = environnement({ ...reel, ecrire: async (donnees) => { ecritures++; await reel.ecrire(donnees); } });
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
    const env = environnement({ ...reel, ecrire: (donnees) => (enPanne ? Promise.reject(new Error('quota')) : reel.ecrire(donnees)) });
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
      lireLus: () => Promise.reject(new Error('base verrouillée')),
      ecrireLus: () => {
        ecritures++;
        return Promise.resolve();
      },
      effacer: () => {
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

describe('appli : options, téléchargement et abandon (#96, C-09 §5, C-08 §4)', () => {
  let fabrique: IDBFactory;
  beforeEach(() => {
    fabrique = new IDBFactory();
  });

  it('les options lisent la partie sans en créer ni la modifier', async () => {
    const reel = stockageIndexedDB('options', fabrique);
    let ecritures = 0;
    const env = environnement({ ...reel, ecrire: async (donnees) => { ecritures++; await reel.ecrire(donnees); } });
    expect(await charger(env)).toEqual({ type: 'absente' });
    expect(await reel.lire()).toBeNull();
    const jeu = await choisir(env, await pret(env), 'prendre');
    const avant = { sauvegarde: await reel.lire(), ecritures };
    const charge = await charger(env);
    expect(charge.type === 'pret' && charge.jeu.partie).toEqual(jeu.partie);
    expect({ sauvegarde: await reel.lire(), ecritures }).toEqual(avant);
  });

  it('le fichier téléchargé est l’export de la partie, sans la modifier (SP-05) ; nom daté', async () => {
    const env = environnement(stockageIndexedDB('export', fabrique));
    const jeu = await choisir(env, await pret(env), 'prendre');
    const copie = structuredClone(jeu.partie);
    const { nom, contenu } = fichierPartie(env, jeu.partie, new Date(2026, 9, 12, 9, 5));
    expect(nom).toBe('void-walker-monde-test-2026-10-12-0905.json');
    expect(JSON.parse(contenu)).toMatchObject({ version: 'v-test', monde: monde.id, graine: 31, actions: jeu.partie.enregistrement.actions });
    expect(jeu.partie).toEqual(copie);
    // Rejoué comme le fait `npm run rejouer` : même état final et même observation finale (C-09 S-03).
    const fichier = lireExport(JSON.parse(contenu) as unknown);
    const rejoue = rejouer(monde, fichier, 'v-test').partie;
    expect(empreinteEtat(rejoue.etat)).toBe(fichier.empreinte);
    expect(JSON.stringify(observer(monde, rejoue.etat))).toBe(JSON.stringify(fichier.observation));
    expect(fichier.empreinte).toBe(empreinteEtat(jeu.partie.etat));
  });

  it('abandon : la partie et ses messages lus quittent l’appareil ; plus rien à reprendre (D-013)', async () => {
    const stockage = stockageIndexedDB('abandon', fabrique);
    const env = environnement(stockage);
    const jeu = await choisir(env, await pret(env), 'prendre');
    await marquerLus(env, jeu.partie);
    expect(await abandonner(env)).toBe(true);
    expect(await sauvegardePresente(env)).toBe(false);
    expect(await charger(env)).toEqual({ type: 'absente' });
    expect(await stockage.lireLus()).toBeNull();
  });

  it('abandon refusé par le stockage : signalé, la partie reste enregistrée', async () => {
    const stockage = stockageIndexedDB('abandon-refuse', fabrique);
    const env = environnement(stockage);
    await choisir(env, await pret(env), 'prendre');
    const refuse = environnement({ ...stockage, effacer: () => Promise.reject(new Error('quota')) });
    expect(await abandonner(refuse)).toBe(false);
    expect(await sauvegardePresente(env)).toBe(true);
  });

  it('rejouer après abandon : même état de départ, nouveaux tirages (D-087, D-088)', async () => {
    const stockage = stockageIndexedDB('rejouer', fabrique);
    const graines = [31, 77];
    const env: Environnement = { ...environnement(stockage), graine: () => graines.shift() ?? 0 };
    const premiere = await choisir(env, await pret(env), 'prendre');
    expect(await abandonner(env)).toBe(true);
    const rejouee = await commencer(env);
    const depart = (await commencer({ ...env, graine: () => 31 })).partie;
    expect(rejouee.partie.enregistrement.graine).toBe(77);
    expect(rejouee.partie.enregistrement.graine).not.toBe(premiere.partie.enregistrement.graine);
    expect({ ...rejouee.partie.etat, generateur: null }).toEqual({ ...depart.etat, generateur: null });
    expect(rejouee.partie.etat.generateur).not.toEqual(depart.etat.generateur);
  });
});

describe('appli : IA Station, historique et messages lus (#98, 12 §3.9)', () => {
  let fabrique: IDBFactory;
  beforeEach(() => {
    fabrique = new IDBFactory();
  });

  it('historique : chaque message reçu avec son repère, sans heure ; seulement ceux déjà reçus (K-06)', async () => {
    const env = environnement(stockageIndexedDB('historique', fabrique));
    let jeu = await pret(env);
    expect(historiqueAffiche(env, jeu.partie)).toEqual([{ message: 'reveil', repere: 'au réveil · Cabine', texte: textes.assistance.reveil }]);
    for (const action of ['prendre', 'ouvrir', 'aller']) jeu = await choisir(env, jeu, action);
    expect(historiqueAffiche(env, jeu.partie)).toEqual([
      { message: 'reveil', repere: 'au réveil · Cabine', texte: textes.assistance.reveil },
      { message: 'atelier', repere: 'en arrivant · Atelier', texte: textes.assistance.atelier },
    ]);
  });

  it('lire ne change pas la partie ; après reprise, même historique et mêmes non-lus', async () => {
    const stockage = stockageIndexedDB('lus', fabrique);
    const env = environnement(stockage);
    let jeu = await pret(env);
    expect(await lireLus(env, jeu.partie)).toEqual([]);
    const avant = await stockage.lire();
    await marquerLus(env, jeu.partie);
    expect(await stockage.lire()).toEqual(avant);
    expect(await lireLus(env, jeu.partie)).toEqual(['reveil']);
    for (const action of ['prendre', 'ouvrir', 'aller']) jeu = await choisir(env, jeu, action);
    expect(await lireLus(env, jeu.partie)).toEqual(['reveil']);

    const rouvert = environnement(stockageIndexedDB('lus', fabrique));
    const repris = await pret(rouvert);
    expect(historiqueAffiche(rouvert, repris.partie)).toEqual(historiqueAffiche(env, jeu.partie));
    expect(await lireLus(rouvert, repris.partie)).toEqual(['reveil']);
    await marquerLus(rouvert, repris.partie);
    expect(await lireLus(environnement(stockageIndexedDB('lus', fabrique)), repris.partie)).toEqual(['reveil', 'atelier']);
  });

  it('messages lus d’une autre partie ou illisibles : aucun ; panne de stockage sans effet sur le jeu', async () => {
    const stockage = stockageIndexedDB('autre', fabrique);
    const env = environnement(stockage);
    const jeu = await pret(env);
    await marquerLus(env, jeu.partie);
    const nouvelle = await commencer({ ...env, graine: () => 32 });
    expect(await lireLus(env, nouvelle.partie)).toEqual([]);
    for (const brut of [null, 'abc', { monde: monde.id, graine: 31, lus: 1 }, { monde: 'ar-01', graine: 31, lus: ['reveil'] }]) {
      await stockage.ecrireLus(brut);
      expect(await lireLus(env, jeu.partie)).toEqual([]);
    }
    await stockage.ecrireLus({ monde: monde.id, graine: 31, lus: ['reveil', 3] });
    expect(await lireLus(env, jeu.partie)).toEqual(['reveil']);
    const enPanne = environnement({ ...stockage, lireLus: () => Promise.reject(new Error('base verrouillée')), ecrireLus: () => Promise.reject(new Error('quota')) });
    expect(await lireLus(enPanne, jeu.partie)).toEqual([]);
    await expect(marquerLus(enPanne, jeu.partie)).resolves.toBeUndefined();
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
    expect(jeu.rappel).toEqual({ texte: 'Burette d’huile · Verser · Cloison de la baie d’observation', capitales: false });
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
