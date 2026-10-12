// Accès IndexedDB (AP-03) : une partie en cours, une écriture par action engagée ; à côté, les messages d'IA Station lus (12 §3.9).

export interface Stockage {
  lire(): Promise<unknown>;
  ecrire(donnees: unknown): Promise<void>;
  /** Messages lus : affichage seulement, hors de la partie, jamais rejoués. */
  lireLus(): Promise<unknown>;
  ecrireLus(donnees: unknown): Promise<void>;
}

const MAGASIN = 'parties';
const CLE = 'en-cours';
const CLE_LUS = 'messages-lus';

function requete<T>(demande: IDBRequest<T>): Promise<T> {
  return new Promise((resoudre, rejeter) => {
    demande.onsuccess = () => resoudre(demande.result);
    demande.onerror = () => rejeter(demande.error ?? new Error('Erreur IndexedDB.'));
  });
}

function ouvrir(fabrique: IDBFactory, nom: string): Promise<IDBDatabase> {
  const demande = fabrique.open(nom, 1);
  demande.onupgradeneeded = () => {
    demande.result.createObjectStore(MAGASIN);
  };
  return requete(demande);
}

/** Une base par adresse publiée : la version principale et chaque version de test gardent des parties séparées. */
export function stockageIndexedDB(nom: string, fabrique: IDBFactory = indexedDB): Stockage {
  let base: Promise<IDBDatabase> | null = null;
  const connexion = (): Promise<IDBDatabase> => {
    base ??= ouvrir(fabrique, nom).catch((erreur: unknown) => {
      base = null;
      throw erreur;
    });
    return base;
  };
  const lire = async (cle: string): Promise<unknown> => {
    const db = await connexion();
    const valeur = await requete(db.transaction(MAGASIN, 'readonly').objectStore(MAGASIN).get(cle));
    return valeur ?? null;
  };
  const ecrire = async (cle: string, donnees: unknown): Promise<void> => {
    const db = await connexion();
    const transaction = db.transaction(MAGASIN, 'readwrite');
    transaction.objectStore(MAGASIN).put(donnees, cle);
    await new Promise<void>((resoudre, rejeter) => {
      transaction.oncomplete = () => resoudre();
      transaction.onerror = () => rejeter(transaction.error ?? new Error('Écriture refusée.'));
      transaction.onabort = () => rejeter(transaction.error ?? new Error('Écriture annulée.'));
    });
  };
  return {
    lire: () => lire(CLE),
    ecrire: (donnees) => ecrire(CLE, donnees),
    lireLus: () => lire(CLE_LUS),
    ecrireLus: (donnees) => ecrire(CLE_LUS, donnees),
  };
}
