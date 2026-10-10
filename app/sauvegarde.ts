// Accès IndexedDB (AP-03) : une partie en cours, une écriture par action engagée.

export interface Stockage {
  lire(): Promise<unknown>;
  ecrire(donnees: unknown): Promise<void>;
}

const MAGASIN = 'parties';
const CLE = 'en-cours';

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
  return {
    async lire() {
      const db = await connexion();
      const valeur = await requete(db.transaction(MAGASIN, 'readonly').objectStore(MAGASIN).get(CLE));
      return valeur ?? null;
    },
    async ecrire(donnees) {
      const db = await connexion();
      const transaction = db.transaction(MAGASIN, 'readwrite');
      transaction.objectStore(MAGASIN).put(donnees, CLE);
      await new Promise<void>((resoudre, rejeter) => {
        transaction.oncomplete = () => resoudre();
        transaction.onerror = () => rejeter(transaction.error ?? new Error('Écriture refusée.'));
        transaction.onabort = () => rejeter(transaction.error ?? new Error('Écriture annulée.'));
      });
    },
  };
}
