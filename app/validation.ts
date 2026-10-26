import type { ExportPartie } from '../engine';
import { attendreFin, ouvrir, requete } from './sauvegarde';

// Validation signée par le téléphone (C-10 §4, D-130, AP-04) : une clé ECDSA P-256 créée une fois par le jeu, privée et
// non exportable, gardée sur l'appareil ; chaque « je valide » signe une attestation qui lie la partie, la version et la PR.
// Le robot de la PR vérifie avec la partie publique enregistrée dans le dépôt (AP-07) ; le service ne décide jamais.
// Ce module ne dépend que de WebCrypto : le jeu signe, tools/reconnaitre-validation.ts vérifie, avec le même code.

const ALGORITHME = { name: 'ECDSA', namedCurve: 'P-256' } as const;
const SIGNATURE = { name: 'ECDSA', hash: 'SHA-256' } as const;

/** Partie publique d'une clé, au format JWK réduit à ce qui l'identifie (RFC 7638). */
export interface ClePublique {
  readonly kty: 'EC';
  readonly crv: 'P-256';
  readonly x: string;
  readonly y: string;
}

/** Ce que le téléphone signe. Chaque champ se recalcule depuis le commentaire de la PR, sauf la signature. */
export interface Attestation {
  readonly format: 'void-walker-validation';
  readonly v: 1;
  readonly pr: number;
  readonly commit: string;
  readonly version: string;
  readonly monde: string;
  readonly graine: number;
  readonly actions: number;
  /** Empreinte de l'état final (C-09). */
  readonly empreinte: string;
  /** Fin obtenue : seule une partie allée au bout peut valider (D-099). */
  readonly issue: 'evacuation' | 'defaite';
  /** SHA-256 de l'export entier, sérialisé de façon canonique. */
  readonly partie: string;
  readonly commentaire: string;
}

/** Bloc joint au rapport et recopié dans le commentaire de la PR. */
export interface Validation {
  readonly attestation: Attestation;
  /** Signature ECDSA brute (r ‖ s), en base64url. */
  readonly signature: string;
  readonly cle: ClePublique;
}

/** JSON aux clés triées, sans les valeurs absentes : le même texte au téléphone et dans le robot. */
export function canonique(valeur: unknown): string {
  if (Array.isArray(valeur)) return `[${valeur.map((element) => (element === undefined ? 'null' : canonique(element))).join(',')}]`;
  if (valeur !== null && typeof valeur === 'object') {
    const objet = valeur as Record<string, unknown>;
    return `{${Object.keys(objet)
      .filter((cle) => objet[cle] !== undefined)
      .sort()
      .map((cle) => `${JSON.stringify(cle)}:${canonique(objet[cle])}`)
      .join(',')}}`;
  }
  return JSON.stringify(valeur);
}

const octets = (texte: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(texte);

async function sha256(texte: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', octets(texte)));
}

const hexa = (donnees: Uint8Array): string => [...donnees].map((octet) => octet.toString(16).padStart(2, '0')).join('');

function base64url(donnees: Uint8Array): string {
  let binaire = '';
  for (const octet of donnees) binaire += String.fromCharCode(octet);
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function depuisBase64url(texte: string): Uint8Array<ArrayBuffer> {
  const binaire = atob(texte.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binaire, (caractere) => caractere.charCodeAt(0));
}

/** Empreinte d'une clé publique (RFC 7638), en hexadécimal. */
export async function empreinteCle(cle: ClePublique): Promise<string> {
  return hexa(await sha256(canonique({ crv: cle.crv, kty: cle.kty, x: cle.x, y: cle.y })));
}

/** Empreinte montrée au porteur : les 16 premiers caractères, par groupes de quatre (« 7F3A·91C2·0B4E·D815 »). */
export function empreinteLisible(empreinte: string): string {
  return (empreinte.slice(0, 16).toUpperCase().match(/.{1,4}/g) ?? []).join('·');
}

/** Empreinte de l'export : ce que l'attestation lie à la partie jointe. */
export async function empreintePartie(partie: unknown): Promise<string> {
  return hexa(await sha256(canonique(partie)));
}

export function estClePublique(valeur: unknown): valeur is ClePublique {
  if (typeof valeur !== 'object' || valeur === null) return false;
  const { kty, crv, x, y } = valeur as Record<string, unknown>;
  const coordonnee = (c: unknown): boolean => typeof c === 'string' && /^[A-Za-z0-9_-]{43}$/.test(c);
  return kty === 'EC' && crv === 'P-256' && coordonnee(x) && coordonnee(y);
}

/** Attestation d'une partie finie, envoyée depuis la version de test de la PR `pr` ; `null` si la partie n'est pas finie. */
export async function attester(partie: ExportPartie, construction: { readonly pr: number; readonly commit: string }, commentaire: string): Promise<Attestation | null> {
  const { issue, terminee } = partie.observation;
  if (!terminee || (issue !== 'evacuation' && issue !== 'defaite')) return null;
  return {
    format: 'void-walker-validation',
    v: 1,
    pr: construction.pr,
    commit: construction.commit,
    version: partie.version,
    monde: partie.monde,
    graine: partie.graine,
    actions: partie.actions.length,
    empreinte: partie.empreinte,
    issue,
    partie: await empreintePartie(partie),
    commentaire,
  };
}

/** Vérifie une signature avec une clé publique ; toute donnée illisible vaut une signature fausse. */
export async function verifier(cle: ClePublique, attestation: Attestation, signature: string): Promise<boolean> {
  try {
    const publique = await crypto.subtle.importKey('jwk', { ...cle, ext: true }, ALGORITHME, false, ['verify']);
    return await crypto.subtle.verify(SIGNATURE, publique, depuisBase64url(signature), octets(canonique(attestation)));
  } catch {
    return false;
  }
}

/** Clés du téléphone : la privée, non exportable, ne sort jamais de l'appareil (D-130). */
export interface ClesTelephone {
  readonly privee: CryptoKey;
  readonly publique: ClePublique;
}

/** Où le téléphone garde sa clé : à part de la partie, commune à toutes les versions publiées sur la même adresse. */
export interface Coffre {
  lire(): Promise<ClesTelephone | null>;
  ecrire(cles: ClesTelephone): Promise<void>;
}

export interface Signataire {
  /** Empreinte de la clé du téléphone, `null` si elle n'est pas encore créée. */
  empreinte(): Promise<string | null>;
  /** Signe l'attestation, en créant la clé la première fois. */
  signer(attestation: Attestation): Promise<Validation>;
}

export function creerSignataire(coffre: Coffre): Signataire {
  let creation: Promise<ClesTelephone> | null = null;
  const cles = (): Promise<ClesTelephone> => {
    creation ??= (async () => {
      const connues = await coffre.lire();
      if (connues !== null) return connues;
      const paire = await crypto.subtle.generateKey(ALGORITHME, false, ['sign', 'verify']);
      const { kty, crv, x, y } = await crypto.subtle.exportKey('jwk', paire.publicKey);
      const publique = { kty, crv, x, y };
      if (!estClePublique(publique)) throw new Error('Clé publique inattendue.');
      const nouvelles = { privee: paire.privateKey, publique };
      await coffre.ecrire(nouvelles);
      return nouvelles;
    })().catch((erreur: unknown) => {
      creation = null;
      throw erreur;
    });
    return creation;
  };
  return {
    async empreinte() {
      const connues = await coffre.lire();
      return connues === null ? null : empreinteCle(connues.publique);
    },
    async signer(attestation) {
      const { privee, publique } = await cles();
      const signature = new Uint8Array(await crypto.subtle.sign(SIGNATURE, privee, octets(canonique(attestation))));
      return { attestation, signature: base64url(signature), cle: publique };
    },
  };
}

const MAGASIN = 'cles';
const CLE = 'telephone';

/** Coffre IndexedDB : une base à part, la même pour la version publique et les versions de test de la même adresse. */
export function coffreIndexedDB(nom = 'void-walker:validation', fabrique: IDBFactory = indexedDB): Coffre {
  return {
    async lire() {
      const db = await ouvrir(fabrique, nom, MAGASIN);
      const valeur = (await requete(db.transaction(MAGASIN, 'readonly').objectStore(MAGASIN).get(CLE))) as ClesTelephone | undefined;
      db.close();
      return valeur ?? null;
    },
    async ecrire(cles) {
      const db = await ouvrir(fabrique, nom, MAGASIN);
      const transaction = db.transaction(MAGASIN, 'readwrite');
      transaction.objectStore(MAGASIN).put(cles, CLE);
      await attendreFin(transaction);
      db.close();
    },
  };
}
