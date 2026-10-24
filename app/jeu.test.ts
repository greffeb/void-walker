import { IDBFactory } from 'fake-indexeddb';
import { assemblerStation, empreinteEtat, lireExport, nouvellePartie, observer, rejouer, type DefMonde, type Partie } from '../engine';
import { alertesMenace, creerCatalogue, dangersDuRecit, MONDES, numeroter, PAIRES, type EntreeMonde } from '../content';
import { CATALOGUE } from './catalogue';
import {
  abandonner,
  camerasChangees,
  carteANouveau,
  charger,
  cleStockage,
  commencer,
  demandeDe,
  demarrer,
  fermerPoste,
  recitPoste,
  fichierPartie,
  historiqueAffiche,
  jouerOption,
  lireLus,
  marquerLus,
  preparerLancement,
  sauvegardePresente,
  type Environnement,
  type Jeu,
} from './jeu';
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

/** Hasard qui avance : un tirage différent à chaque appel, la même suite pour un même départ. */
function hasardDepuis(depart: number): () => number {
  let valeur = depart;
  return () => {
    valeur = (Math.imul(valeur, 1664525) + 1013904223) >>> 0;
    return valeur;
  };
}

function enMemoire(depart: unknown = null): { readonly stockage: Stockage; readonly ecritures: () => number } {
  let donnees = depart;
  let lus: unknown = null;
  let ecritures = 0;
  return {
    stockage: {
      lire: () => Promise.resolve(donnees),
      ecrire: (nouvelles) => {
        ecritures++;
        donnees = nouvelles;
        return Promise.resolve();
      },
      lireLus: () => Promise.resolve(lus),
      ecrireLus: (nouveaux) => {
        ecritures++;
        lus = nouveaux;
        return Promise.resolve();
      },
      effacer: () => {
        ecritures++;
        donnees = null;
        lus = null;
        return Promise.resolve();
      },
    },
    ecritures: () => ecritures,
  };
}

describe('appli : monde choisi par l’adresse', () => {
  it('« ?monde= » choisit un monde connu ; un id inconnu ou absent donne une station tirée ; « ?station= » l’emporte', () => {
    expect(demandeDe('?monde=monde-test', CATALOGUE.mondes)).toEqual({ type: 'monde', id: 'monde-test' });
    expect(demandeDe('?monde=ar-01', CATALOGUE.mondes)).toEqual({ type: 'monde', id: 'ar-01' });
    expect(demandeDe('', CATALOGUE.mondes)).toEqual({ type: 'tirage' });
    expect(demandeDe('?monde=', CATALOGUE.mondes)).toEqual({ type: 'tirage' });
    expect(demandeDe('?monde=inconnu', CATALOGUE.mondes)).toEqual({ type: 'tirage' });
    expect(demandeDe('?monde=toString', CATALOGUE.mondes)).toEqual({ type: 'tirage' });
    expect(demandeDe('?monde=__proto__', CATALOGUE.mondes)).toEqual({ type: 'tirage' });
    expect(demandeDe('?station=m07-m03-soute', CATALOGUE.mondes)).toEqual({ type: 'station', id: 'm07-m03-soute' });
    expect(demandeDe('?station=x&monde=ar-01', CATALOGUE.mondes)).toEqual({ type: 'station', id: 'x' });
    expect(demandeDe('?monde=ar-01&station=x', CATALOGUE.mondes)).toEqual({ type: 'station', id: 'x' });
    expect(demandeDe('?station=', CATALOGUE.mondes)).toEqual({ type: 'station', id: '' });
  });

  it('l’adresse nue, chaque « ?monde= » et chaque « ?station= » gardent leur partie à part', () => {
    const base = 'void-walker:/void-walker/';
    expect(cleStockage(base, { type: 'tirage' })).toBe('void-walker:/void-walker/');
    expect(cleStockage(base, { type: 'monde', id: 'ar-01' })).toBe('void-walker:/void-walker/?monde=ar-01');
    expect(cleStockage(base, { type: 'station', id: 'm07-m03-soute' })).toBe('void-walker:/void-walker/?station=m07-m03-soute');
  });
});

describe('appli : station tirée au lancement et à chaque nouvelle partie (#152)', () => {
  const STATION = 'm07-m03-soute-2718281828';
  /** Composition d'une station tirée : ce qui précède la graine décimale, sans zéro de tête ; à chercher parmi les publiées. */
  const compositionTiree = (station: string | undefined): string | undefined => /^([a-z0-9-]+)-(0|[1-9][0-9]*)$/.exec(station ?? '')?.[1];
  const id = (entree: EntreeMonde | null): string | undefined => entree?.monde.id;
  const envSur = (entree: EntreeMonde, stockage: Stockage): Environnement => ({ monde: entree.monde, textes: entree.textes, version: 'v-test', stockage, graine: () => 31 });
  const resolue = (station: string): EntreeMonde => {
    const entree = CATALOGUE.resoudre(station);
    if ('refus' in entree) throw new Error(entree.refus);
    return entree;
  };
  /** Grande station que donne `tirerGrande` pour un hasard parti de `depart` (D-313 : NOUVELLE PARTIE tire une grande station). */
  const tiree = (depart: number): string => {
    const entree = CATALOGUE.tirerGrande(hasardDepuis(depart));
    if ('refus' in entree) throw new Error(entree.refus);
    return entree.monde.id;
  };

  it('adresse nue sans partie : station tirée avec le hasard fourni ; NOUVELLE PARTIE en tire une autre ; rien n’est écrit', async () => {
    const { stockage, ecritures } = enMemoire();
    const lancement = await preparerLancement({ type: 'tirage' }, CATALOGUE, stockage, hasardDepuis(1));
    expect(lancement.refus).toBeNull();
    expect(id(lancement.entree)).toBe(tiree(1));
    expect(CATALOGUE.publiees).toContain(id(lancement.entree));
    const suivantes = [lancement.suivante(), lancement.suivante()].map((entree) => entree.monde.id);
    for (const suivante of suivantes) expect(CATALOGUE.publiees).toContain(suivante);
    expect(new Set([id(lancement.entree), ...suivantes]).size).toBe(3);
    expect(ecritures()).toBe(0);
  });

  it('adresse nue : une partie enregistrée se reprend sur son monde, AR-01, une petite ou une grande station ; NOUVELLE PARTIE tire une grande station', async () => {
    for (const entree of [CATALOGUE.mondes['ar-01'] as EntreeMonde, resolue(STATION), resolue(CATALOGUE.publiees[0] ?? '')]) {
      const { stockage } = enMemoire();
      await commencer(envSur(entree, stockage));
      const lancement = await preparerLancement({ type: 'tirage' }, CATALOGUE, stockage, hasardDepuis(1));
      expect(id(lancement.entree)).toBe(entree.monde.id);
      expect((await charger(envSur(lancement.entree ?? entree, stockage))).type).toBe('pret');
      const suivante = lancement.suivante().monde.id;
      expect(CATALOGUE.publiees).toContain(suivante);
      expect(suivante).not.toBe(entree.monde.id);
    }
  });

  it('adresse nue, partie enregistrée sur un monde qui ne se résout pas : station tirée, reprise impossible, sauvegarde intacte', async () => {
    const ancien = enMemoire();
    await commencer(envSur(resolue(STATION), ancien.stockage));
    const sauvegarde = (await ancien.stockage.lire()) as { readonly enregistrement: Record<string, unknown> };
    // g0- : une grande station d'une version précédente du générateur (spec 2026-10-18 §4.3).
    for (const monde of ['m99-m03-x-1', 'texte quelconque', 'm07-m03-soute-01', 42, `g0-${(CATALOGUE.publiees[0] ?? '').slice(3)}`]) {
      const ancienne = { ...sauvegarde, enregistrement: { ...sauvegarde.enregistrement, monde } };
      const { stockage, ecritures } = enMemoire(ancienne);
      const lancement = await preparerLancement({ type: 'tirage' }, CATALOGUE, stockage, hasardDepuis(2));
      expect(lancement.refus).toBeNull();
      expect(id(lancement.entree)).toBe(tiree(2));
      const env = envSur(lancement.entree as EntreeMonde, stockage);
      expect(await charger(env)).toMatchObject({ type: 'reprise_impossible' });
      expect(await demarrer(env)).toMatchObject({ type: 'reprise_impossible' });
      expect(await stockage.lire()).toEqual(ancienne);
      expect(ecritures()).toBe(0);
    }
    // Sauvegarde illisible : une station tirée quand même, sans exception.
    const illisible: Stockage = { ...enMemoire().stockage, lire: () => Promise.reject(new Error('base verrouillée')) };
    expect(id((await preparerLancement({ type: 'tirage' }, CATALOGUE, illisible, hasardDepuis(2))).entree)).toBe(tiree(2));
  });

  it('grande station : une sauvegarde dont l’état ne correspond plus au journal rejoué n’est pas reprise, rien n’est écrit, la sauvegarde reste intacte (#202, #207)', async () => {
    const grande = resolue(CATALOGUE.publiees[0] ?? '');
    const { stockage } = enMemoire();
    const env = envSur(grande, stockage);
    let jeu = await commencer(env);
    for (let pas = 0; pas < 4; pas++) {
      const option = observer(grande.monde, jeu.partie.etat).menu.find((choix) => choix.disponible && choix.action !== 'regarder');
      if (option === undefined) throw new Error('Aucune option jouable.');
      jeu = await jouerOption(env, jeu, option);
    }
    expect(jeu.partie.etat.actions).toBe(4);
    const sauvegarde = (await stockage.lire()) as { readonly enregistrement: { readonly actions: readonly unknown[] }; readonly etat: { readonly piece: string } };
    // Témoin : intacte, la sauvegarde se reprend.
    expect((await charger(env)).type).toBe('pret');
    const ailleurs = grande.monde.pieces.find((piece) => piece.id !== sauvegarde.etat.piece)?.id;
    const alterees = {
      'état sauvegardé déplacé': { ...sauvegarde, etat: { ...sauvegarde.etat, piece: ailleurs } },
      'journal sans sa dernière action': { ...sauvegarde, enregistrement: { ...sauvegarde.enregistrement, actions: sauvegarde.enregistrement.actions.slice(0, -1) } },
    };
    for (const [cas, alteree] of Object.entries(alterees)) {
      const { stockage: lu, ecritures } = enMemoire(alteree);
      const env2 = envSur(grande, lu);
      expect(await charger(env2), cas).toMatchObject({ type: 'reprise_impossible', raison: expect.stringContaining('incohérente') });
      expect(await demarrer(env2), cas).toMatchObject({ type: 'reprise_impossible' });
      expect(await lu.lire(), cas).toEqual(alteree);
      expect(ecritures(), cas).toBe(0);
    }
  });

  it('grande station : la sauvegarde d’une partie de la livraison 1 (même station, sans son butin) n’est pas reprise, rien n’est écrit, la sauvegarde reste intacte (#207)', async () => {
    const grande = resolue(CATALOGUE.publiees[0] ?? '');
    // Le monde d'avant la livraison 2 : le même identifiant, sans ses objets de butin.
    const ancienne: EntreeMonde = { ...grande, monde: { ...grande.monde, objets: grande.monde.objets.filter((objet) => objet.butin !== true) } };
    expect(ancienne.monde.objets.length).toBeLessThan(grande.monde.objets.length);
    const { stockage: ecrit } = enMemoire();
    const envAncienne = envSur(ancienne, ecrit);
    let jeu = await commencer(envAncienne);
    for (let pas = 0; pas < 3; pas++) {
      const option = observer(ancienne.monde, jeu.partie.etat).menu.find((choix) => choix.disponible && choix.action !== 'regarder');
      if (option === undefined) throw new Error('Aucune option jouable.');
      jeu = await jouerOption(envAncienne, jeu, option);
    }
    const sauvegarde = await ecrit.lire();
    expect((await charger(envAncienne)).type).toBe('pret');
    const { stockage, ecritures } = enMemoire(sauvegarde);
    const env = envSur(grande, stockage);
    expect(await charger(env)).toMatchObject({ type: 'reprise_impossible', raison: expect.stringContaining('incohérente') });
    expect(await demarrer(env)).toMatchObject({ type: 'reprise_impossible' });
    expect(await stockage.lire()).toEqual(sauvegarde);
    expect(ecritures()).toBe(0);
  });

  it('grande station : la sauvegarde d’une partie faite sans les documents (même station, sans sa réserve) n’est pas reprise, rien n’est écrit, la sauvegarde reste intacte (#209)', async () => {
    const grande = resolue(CATALOGUE.publiees[0] ?? '');
    const tiret = grande.monde.id.lastIndexOf('-');
    const definie = CATALOGUE.definirGrande(grande.monde.id.slice(0, tiret), Number(grande.monde.id.slice(tiret + 1)));
    if ('refus' in definie) throw new Error(definie.refus);
    // Le monde d'avant la livraison 3 : le même identifiant, assemblé sans la réserve de documents.
    const sans = assemblerStation({ ...definie, grande: definie.grande === undefined ? undefined : { ...definie.grande, documents: undefined } });
    if (sans.type !== 'station') throw new Error('Station sans documents non assemblée.');
    const ancienne = numeroter({ ...grande, monde: sans.monde });
    expect(grande.monde.objets.some((objet) => objet.document === true)).toBe(true);
    expect(ancienne.monde.objets.some((objet) => objet.document === true)).toBe(false);
    const { stockage: ecrit } = enMemoire();
    const envAncienne = envSur(ancienne, ecrit);
    let jeu = await commencer(envAncienne);
    for (let pas = 0; pas < 3; pas++) {
      const option = observer(ancienne.monde, jeu.partie.etat).menu.find((choix) => choix.disponible && choix.action !== 'regarder');
      if (option === undefined) throw new Error('Aucune option jouable.');
      jeu = await jouerOption(envAncienne, jeu, option);
    }
    const sauvegarde = await ecrit.lire();
    expect((await charger(envAncienne)).type).toBe('pret');
    const { stockage, ecritures } = enMemoire(sauvegarde);
    const env = envSur(grande, stockage);
    expect(await charger(env)).toMatchObject({ type: 'reprise_impossible', raison: expect.stringContaining('incohérente') });
    expect(await demarrer(env)).toMatchObject({ type: 'reprise_impossible' });
    expect(await stockage.lire()).toEqual(sauvegarde);
    expect(ecritures()).toBe(0);
  });

  it('« ?station= » refusé : son motif, aucune station, jamais d’exception ; rien n’est écrit', async () => {
    const { stockage, ecritures } = enMemoire();
    expect(await preparerLancement({ type: 'station', id: 'm07-m03-inconnue-1' }, CATALOGUE, stockage, hasardDepuis(3))).toEqual({
      entree: null,
      refus: 'Station inconnue : m07-m03-inconnue-1.',
      suivante: expect.any(Function),
    });
    for (const station of ['', 'M07-M03-SOUTE', 'toString', '__proto__', 'm07-m03-soute-4294967296', 'm07-m03-soute-01', 'm07-m03-cale']) {
      const lancement = await preparerLancement({ type: 'station', id: station }, CATALOGUE, stockage, hasardDepuis(3));
      expect(lancement.entree).toBeNull();
      expect(lancement.refus).toEqual(expect.any(String));
    }
    expect(ecritures()).toBe(0);
  });

  it('G-02 : sans la paire M-03 + M-07 dans la table, « ?station= » est refusé avec le motif de la table', async () => {
    const catalogue = creerCatalogue(assemblerStation, PAIRES.filter((ligne) => !(ligne.a === 'M-03' && ligne.b === 'M-07')));
    for (const station of ['m07-m03-soute', STATION]) {
      expect(await preparerLancement({ type: 'station', id: station }, catalogue, enMemoire().stockage, hasardDepuis(3))).toMatchObject({
        entree: null,
        refus: 'Paire M-03 + M-07 absente de la table : refusée par défaut.',
      });
    }
  });

  it('« ?station=<composition> » : plan tiré, NOUVELLE PARTIE garde la composition et change le plan ; sa partie enregistrée se reprend', async () => {
    const { stockage } = enMemoire();
    const forcee = await preparerLancement({ type: 'station', id: 'm07-m03-soute' }, CATALOGUE, stockage, hasardDepuis(4));
    const premiere = forcee.entree as EntreeMonde;
    const suivante = forcee.suivante().monde.id;
    for (const station of [premiere.monde.id, suivante]) expect(station).toMatch(/^m07-m03-soute-(0|[1-9][0-9]*)$/);
    expect(suivante).not.toBe(premiere.monde.id);
    await commencer(envSur(premiere, stockage));
    expect(id((await preparerLancement({ type: 'station', id: 'm07-m03-soute' }, CATALOGUE, stockage, hasardDepuis(5))).entree)).toBe(premiere.monde.id);
    // La partie d'une autre composition ne se reprend pas à cette adresse : un plan tiré.
    const autre = enMemoire();
    const m10 = CATALOGUE.tirer(hasardDepuis(6), 'm10-m03-entrepot');
    if ('refus' in m10) throw new Error(m10.refus);
    await commencer(envSur(m10, autre.stockage));
    const tiree10 = await preparerLancement({ type: 'station', id: 'm07-m03-soute' }, CATALOGUE, autre.stockage, hasardDepuis(5));
    expect(id(tiree10.entree)).toMatch(/^m07-m03-soute-(0|[1-9][0-9]*)$/);
  });

  it('« ?station=<grande composition> » : une grande station publiée de cette composition, à chaque nouvelle partie', async () => {
    const station = CATALOGUE.publiees[0] ?? '';
    const composition = compositionTiree(station) ?? '';
    const forcee = await preparerLancement({ type: 'station', id: composition }, CATALOGUE, enMemoire().stockage, hasardDepuis(4));
    expect(forcee.refus).toBeNull();
    for (const tiree of [id(forcee.entree), forcee.suivante().monde.id]) {
      expect(CATALOGUE.publiees).toContain(tiree);
      expect(compositionTiree(tiree)).toBe(composition);
    }
  });

  it('« ?station=<identifiant> » : cette station exacte, à chaque nouvelle partie', async () => {
    const exacte = await preparerLancement({ type: 'station', id: STATION }, CATALOGUE, enMemoire().stockage, hasardDepuis(4));
    expect(exacte.refus).toBeNull();
    expect(id(exacte.entree)).toBe(STATION);
    expect(exacte.suivante().monde.id).toBe(STATION);
  });

  it('« ?monde= » : le monde fixe, à chaque nouvelle partie', async () => {
    const ar01 = CATALOGUE.mondes['ar-01'];
    const lancement = await preparerLancement({ type: 'monde', id: 'ar-01' }, CATALOGUE, enMemoire().stockage, hasardDepuis(5));
    expect(lancement).toMatchObject({ entree: ar01, refus: null });
    expect(lancement.suivante()).toBe(ar01);
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

describe('appli : danger apparu signalé dans le récit (#138, D-233)', () => {
  const ar01 = MONDES['ar-01'] as EntreeMonde;
  const P_B = ar01.parcours.find((parcours) => parcours.nom.startsWith('P-B'))?.etapes ?? [];
  let fabrique: IDBFactory;
  beforeEach(() => {
    fabrique = new IDBFactory();
  });
  const envAr01 = (): Environnement => ({ monde: ar01.monde, textes: ar01.textes, version: 'v-test', stockage: stockageIndexedDB('ar-01', fabrique), graine: () => 20261010 });

  async function etapes(env: Environnement, nombre: number): Promise<Jeu> {
    let jeu = await pret(env);
    for (const etape of P_B.slice(0, nombre)) {
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

  it('phrases du récit, sans les messages d’assistance : le feu qui se montre ou gagne une pièce, l’air perdu', () => {
    const evenements = [{ type: 'assistance' }, { type: 'passage_ouvert' }, { type: 'feu_gagne' }, { type: 'feu_eteint' }, { type: 'feu_derriere' }, { type: 'air_perdu' }];
    expect(dangersDuRecit(evenements as Parameters<typeof dangersDuRecit>[0])).toEqual([null, 'feu', null, 'feu', 'vide']);
  });

  it('phrases du récit en rouge pour la créature : arrivée, premier contact, attaque ratée (menace), dégâts subis (griffes, feu, froid), bruit de la créature', () => {
    const evenements = [
      { type: 'assistance' },
      { type: 'creature_entre' },
      { type: 'premier_contact' },
      { type: 'menace' },
      { type: 'aggravation_blesse', causes: ['griffes'] },
      { type: 'aggravation_critique', causes: ['feu'] },
      { type: 'defaite', causes: ['froid', 'griffes'] },
      { type: 'bruit_creature' },
    ];
    expect(alertesMenace(evenements as Parameters<typeof alertesMenace>[0])).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('aucune alerte avant la découverte du feu', async () => {
    expect((await pret(envAr01())).alertes).toEqual([]);
    expect((await etapes(envAr01(), 3)).alertes).toEqual([]);
  });

  it('ouvrir la porte du local technique : seule la phrase du feu est signalée, à chaud comme à la reprise', async () => {
    const jeu = await etapes(envAr01(), 4);
    expect(jeu.alertes).toHaveLength(1);
    expect(jeu.recit[jeu.alertes[0] ?? -1]).toMatch(/flammes|brûle/);
    expect(jeu.recit.filter((_, rang) => !jeu.alertes.includes(rang)).some((autre) => /flammes|brûle/.test(autre))).toBe(false);
    const repris = await pret(envAr01());
    expect(repris.recit).toEqual(jeu.recit);
    expect(repris.alertes).toEqual(jeu.alertes);
  });

  it('l’action suivante ne garde pas l’alerte quand elle ne montre aucun nouveau danger', async () => {
    const jeu = await etapes(envAr01(), 5);
    expect(jeu.alertes).toEqual([]);
  });
});

describe('appli : regard automatique à l’arrivée (#177)', () => {
  const ar01 = MONDES['ar-01'] as EntreeMonde;
  const P_B = ar01.parcours.find((parcours) => parcours.nom.startsWith('P-B'))?.etapes ?? [];
  const env = (fabrique: IDBFactory): Environnement => ({ monde: ar01.monde, textes: ar01.textes, version: 'v-test', stockage: stockageIndexedDB('ar-01', fabrique), graine: () => 20261010 });

  it('une pièce jamais vue ajoute sa description sous le déplacement ; une pièce déjà vue, rien ; la reprise relit le même récit', async () => {
    const fabrique = new IDBFactory();
    const e = env(fabrique);
    let jeu = await pret(e);
    const arrivees: { nouvelle: boolean; decrite: boolean; menace: boolean }[] = [];
    for (const etape of P_B) {
      const avant = observer(ar01.monde, jeu.partie.etat);
      const option = avant.menu.find(
        (choix) =>
          choix.action === etape.action &&
          choix.cible.nom === etape.cible &&
          (etape.vers === undefined || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === etape.vers)) &&
          (etape.parametre === undefined || (choix.parametre?.sorte === 'passage' ? choix.parametre.vers?.nom : choix.parametre?.nom) === etape.parametre),
      );
      if (option === undefined) throw new Error(`Option ${JSON.stringify(etape)} absente.`);
      jeu = await jouerOption(e, jeu, option);
      if (etape.action !== 'aller') continue;
      const apres = observer(ar01.monde, jeu.partie.etat);
      const descriptions: readonly string[] = ar01.textes.descriptions[apres.piece.nom] ?? [];
      arrivees.push({
        nouvelle: !avant.visitees.some((piece) => piece.id === apres.piece.id),
        decrite: jeu.recit.some((ligne) => descriptions.includes(ligne)),
        menace: apres.creatureVisible || jeu.alertes.length > 0,
      });
      expect((await pret(e)).recit).toEqual(jeu.recit);
    }
    expect(arrivees.length).toBeGreaterThan(0);
    for (const { nouvelle, decrite, menace } of arrivees) if (!menace) expect(decrite).toBe(nouvelle);
    expect(arrivees.some(({ nouvelle, menace }) => nouvelle && !menace)).toBe(true);
  });
});

describe('appli : vide apparu signalé avec son alarme (D-233)', () => {
  const ar02 = MONDES['ar-02'] as EntreeMonde;
  const P_V1 = ar02.parcours.find((parcours) => parcours.nom.startsWith('P-V1'))?.etapes ?? [];
  let fabrique: IDBFactory;
  beforeEach(() => {
    fabrique = new IDBFactory();
  });
  const envAr02 = (): Environnement => ({ monde: ar02.monde, textes: ar02.textes, version: 'v-test', stockage: stockageIndexedDB('ar-02', fabrique), graine: () => 20261010 });

  /** Récit et alertes après chaque étape de P-V1, jusqu'à la première étape qui vérifie `cherche`. */
  async function jusqua(env: Environnement, cherche: (etape: (typeof P_V1)[number]) => boolean): Promise<Jeu> {
    let jeu = await pret(env);
    for (const etape of P_V1) {
      const option = observer(ar02.monde, jeu.partie.etat).menu.find(
        (choix) =>
          choix.action === etape.action &&
          choix.cible.nom === etape.cible &&
          (etape.vers === undefined || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === etape.vers)) &&
          (etape.parametre === undefined || (choix.parametre?.sorte === 'passage' ? choix.parametre.vers?.nom : choix.parametre?.nom) === etape.parametre),
      );
      if (option === undefined) throw new Error(`Option ${JSON.stringify(etape)} absente.`);
      jeu = await jouerOption(env, jeu, option);
      if (cherche(etape)) return jeu;
    }
    throw new Error('Étape cherchée absente de P-V1.');
  }

  it('percer la baie : la phrase de l’air perdu est signalée, à chaud comme à la reprise', async () => {
    const jeu = await jusqua(envAr02(), (etape) => etape.action === 'percer');
    expect(jeu.alertes).toHaveLength(1);
    expect(jeu.recit[jeu.alertes[0] ?? -1]).toMatch(/plus d’air/i);
    const repris = await pret(envAr02());
    expect(repris.recit).toEqual(jeu.recit);
    expect(repris.alertes).toEqual(jeu.alertes);
  });

  it('entrer dans une pièce sans air : aucune phrase ne le dit, la ligne de « Regarder » est ajoutée et signalée', async () => {
    const jeu = await jusqua(envAr02(), (etape) => etape.action === 'aller' && etape.vers === 'cabine');
    const vide = ar02.textes.observation.sansAir;
    expect(jeu.recit.at(-1)).toBe(vide);
    expect(jeu.alertes).toEqual([jeu.recit.length - 1]);
    const repris = await pret(envAr02());
    expect(repris.recit).toEqual(jeu.recit);
    expect(repris.alertes).toEqual(jeu.alertes);
  });
});

describe('« ! » sur CARTE (créature mobile lot 3)', () => {
  it('un changement du capteur l’allume, le dépôt non, et il reste allumé jusqu’à l’ouverture', () => {
    expect(carteANouveau(false, [{ type: 'capteur', etat: 'hs' }])).toBe(true);
    expect(carteANouveau(false, [{ type: 'capteur_pose', objet: { sorte: 'objet', id: 'c', nom: 'capteur' }, piece: { sorte: 'piece', id: 'p', nom: 'pièce' }, etat: 'calme' }])).toBe(false);
    expect(carteANouveau(true, [])).toBe(true);
  });
});

describe('fenêtre du poste : caméras changées et fermeture (lot 4)', () => {
  const remise = { sorte: 'piece', id: 'e-remise', nom: 'remise' } as const;
  const machines = { sorte: 'piece', id: 'e-machines', nom: 'machines' } as const;

  it('camerasChangees : seule la remise, passée de calme à mouvement ; sans avant, ce qui n’est pas calme', () => {
    const avant = [{ piece: remise, etat: 'calme' as const }, { piece: machines, etat: 'brouille' as const }];
    const apres = [{ piece: remise, etat: 'mouvement' as const }, { piece: machines, etat: 'brouille' as const }];
    expect(camerasChangees(avant, apres)).toEqual([{ piece: remise, etat: 'mouvement' }]);
    expect(camerasChangees(apres, apres)).toEqual([]);
    expect(camerasChangees(undefined, avant)).toEqual([{ piece: machines, etat: 'brouille' }]);
    expect(camerasChangees(avant, undefined)).toEqual([]);
  });

  const porte = { sorte: 'passage', id: 'p-x', nom: 'porte', ouvert: false, vers: null, signale: true, feu: false, huile: false, vide: false, gouffre: false } as const;

  const dansLaSalle = () => ({ ...observer(monde, nouvellePartie(monde, { version: 'v-test', graine: 1 }).etat), cameras: [{ piece: remise, etat: 'calme' as const }] });

  it('fermerPoste : vraie sans caméras, à la fin, sur un danger dans la salle, quand la créature y entre ou s’y montre (D-359)', () => {
    const observation = observer(monde, nouvellePartie(monde, { version: 'v-test', graine: 1 }).etat);
    expect(fermerPoste(observation, [{ type: 'attente' }])).toBe(true);
    expect(fermerPoste({ ...dansLaSalle(), terminee: true }, [{ type: 'attente' }])).toBe(true);
    expect(fermerPoste({ ...dansLaSalle(), feu: true }, [{ type: 'attente' }])).toBe(true);
    expect(fermerPoste({ ...dansLaSalle(), sansAir: true }, [{ type: 'attente' }])).toBe(true);
    expect(fermerPoste({ ...dansLaSalle(), creatureVisible: true }, [{ type: 'attente' }])).toBe(true);
    expect(fermerPoste(dansLaSalle(), [{ type: 'attente' }, { type: 'creature_entre', passage: porte }])).toBe(true);
  });

  it('fermerPoste : écoute, porte secouée, message ou connexion bruyante → reste ouverte, le récit va sur la ligne du bas (D-359)', () => {
    expect(fermerPoste(dansLaSalle(), [{ type: 'attente' }])).toBe(false);
    expect(fermerPoste(dansLaSalle(), [{ type: 'attente', vacarme: true }])).toBe(false);
    expect(fermerPoste(dansLaSalle(), [{ type: 'attente' }, { type: 'ecoute', passage: porte, entendu: 'net' }])).toBe(false);
    expect(fermerPoste(dansLaSalle(), [{ type: 'attente' }, { type: 'porte_secouee', passage: porte }])).toBe(false);
    expect(fermerPoste(dansLaSalle(), [{ type: 'assistance', message: 'm-x' }])).toBe(false);
    expect(fermerPoste(dansLaSalle(), [{ type: 'terminal_connecte' }, { type: 'ecoute', passage: porte, entendu: 'vague' }])).toBe(false);
  });

  it('recitPoste : rien pour une attente ou une connexion seules ; sinon tout le récit, alertes en rouge', () => {
    const partie = nouvellePartie(monde, { version: 'v-test', graine: 1 });
    const pas = (derniers: Partie['derniers']) => ({ partie: { ...partie, derniers }, recit: ['Vous attendez.', 'Un raclement.'], alertes: [1] });
    expect(recitPoste(pas([{ type: 'attente' }, { type: 'assistance', message: 'm-x' }]))).toEqual([]);
    expect(recitPoste(pas([{ type: 'terminal_connecte' }]))).toEqual([]);
    expect(recitPoste(pas([{ type: 'attente' }, { type: 'porte_secouee', passage: porte }]))).toEqual([
      { texte: 'Vous attendez.', alerte: false },
      { texte: 'Un raclement.', alerte: true },
    ]);
  });
});
