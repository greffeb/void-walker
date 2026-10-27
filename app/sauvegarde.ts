// Accès IndexedDB (AP-03) : une partie en cours, une écriture par action engagée ; à côté, les messages d'IA Station lus (12 §3.9).

export interface Stockage {
  lire(): Promise<unknown>;
  /** `accepte` : écrit seulement si la partie déjà enregistrée le permet, lue dans la même transaction ; sinon `PartieRemplacee` (#278). */
  ecrire(donnees: unknown, accepte?: (enregistree: unknown) => boolean): Promise<void>;
  /** Messages lus : affichage seulement, hors de la partie, jamais rejoués. */
  lireLus(): Promise<unknown>;
  ecrireLus(donnees: unknown): Promise<void>;
  /** Retire la partie et ses messages lus, en une écriture : après un abandon, rien ne se reprend (D-013). */
  effacer(): Promise<void>;
}

const MAGASIN = 'parties';
const CLE = 'en-cours';
const CLE_LUS = 'messages-lus';

/** Une autre fenêtre de l'appli a fait avancer, remplacé ou abandonné la partie enregistrée (#278) ; jamais montrée telle quelle. */
export class PartieRemplacee extends Error {}

export function requete<T>(demande: IDBRequest<T>): Promise<T> {
  return new Promise((resoudre, rejeter) => {
    demande.onsuccess = () => resoudre(demande.result);
    demande.onerror = () => rejeter(demande.error ?? new Error('Erreur IndexedDB.'));
  });
}

export function ouvrir(fabrique: IDBFactory, nom: string, magasin: string = MAGASIN): Promise<IDBDatabase> {
  const demande = fabrique.open(nom, 1);
  demande.onupgradeneeded = () => {
    demande.result.createObjectStore(magasin);
  };
  return requete(demande);
}

/** Attend la fin d'une transaction d'écriture : validée, refusée ou annulée. */
export function attendreFin(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resoudre, rejeter) => {
    transaction.oncomplete = () => resoudre();
    transaction.onerror = () => rejeter(transaction.error ?? new Error('Écriture refusée.'));
    transaction.onabort = () => rejeter(transaction.error ?? new Error('Écriture annulée.'));
  });
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
  const ecrire = async (modifier: (magasin: IDBObjectStore) => void): Promise<void> => {
    const db = await connexion();
    const transaction = db.transaction(MAGASIN, 'readwrite');
    modifier(transaction.objectStore(MAGASIN));
    await attendreFin(transaction);
  };
  return {
    lire: () => lire(CLE),
    ecrire: async (donnees, accepte) => {
      let refusee = false;
      try {
        await ecrire((magasin) => {
          if (accepte === undefined) {
            magasin.put(donnees, CLE);
            return;
          }
          const actuelle = magasin.get(CLE);
          // Écrire dans le rappel de la lecture : un `await` ici laisserait la transaction se fermer.
          actuelle.onsuccess = () => {
            if (accepte(actuelle.result ?? null)) magasin.put(donnees, CLE);
            else {
              refusee = true;
              magasin.transaction.abort();
            }
          };
        });
      } catch (erreur) {
        throw refusee ? new PartieRemplacee() : erreur;
      }
    },
    lireLus: () => lire(CLE_LUS),
    ecrireLus: (donnees) => ecrire((magasin) => magasin.put(donnees, CLE_LUS)),
    effacer: () =>
      ecrire((magasin) => {
        magasin.delete(CLE);
        magasin.delete(CLE_LUS);
      }),
  };
}
