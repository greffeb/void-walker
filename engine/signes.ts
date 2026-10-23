import { capteurPose } from './capteur';
import { refPiece, type EtatPartie, type SigneIA } from './etat';
import { indexer, type DefMonde } from './monde';
import { FRAICHEUR, entier32 } from './rencontre';
import type { SignePublic } from './vocabulaire';

// Messages d'IA Station (lot 4) : sur la face 2, à la place du bruit lointain, un fait vrai sur la station, sans nommer la menace.

// Seuils du porteur : un ou deux messages par partie.
export const SIGNES_ECART = 30;
export const SIGNES_MAX = 2;

/** IA Station peut parler à l'action en cours (`etat.actions + 1`, comme dans `jouer`) : moins de deux messages, le dernier assez loin. */
export function signePermis(etat: EtatPartie): boolean {
  const signes = etat.signes ?? [];
  const dernier = signes.at(-1);
  return signes.length < SIGNES_MAX && (dernier === undefined || etat.actions + 1 - dernier.action >= SIGNES_ECART);
}

/** Ce qui distingue un fait, sans l'action où il a été dit. */
function cle(signe: SigneIA): string {
  return signe.sorte === 'porte' ? `porte:${signe.liaison}` : `${signe.sorte}:${signe.piece}:${signe.sorte === 'materiel' ? signe.appareil : ''}`;
}

/**
 * Faits vrais pas encore dits, dans l'ordre porte, matériel, passage, présence : les portes forcées et les caméras perdues en cours
 * de partie (jamais celles du départ), le capteur hors service, ses passages encore frais hors de la pièce du passager, sa pièce.
 */
export function faitsNeufs(monde: DefMonde, etat: EtatPartie): readonly SigneIA[] {
  const ou = etat.creature?.piece;
  const capteur = capteurPose(monde, etat);
  const passees = (etat.creature?.passages ?? [])
    .filter((p) => etat.actions + 1 - p.action <= FRAICHEUR && p.piece !== etat.piece && p.piece !== ou)
    .map((p) => p.piece);
  const faits: SigneIA[] = [
    ...(etat.enfoncees ?? []).map((liaison) => ({ sorte: 'porte', liaison }) as const),
    ...(etat.camerasHs ?? []).map((piece) => ({ sorte: 'materiel', piece, appareil: 'camera' }) as const),
    ...(capteur?.etat === 'hs' ? [{ sorte: 'materiel', piece: capteur.piece, appareil: 'capteur' } as const] : []),
    ...[...new Set(passees)].map((piece) => ({ sorte: 'passage', piece }) as const),
    ...(typeof ou === 'string' ? [{ sorte: 'presence', piece: ou } as const] : []),
  ];
  const dits = new Set((etat.signes ?? []).map(cle));
  return faits.filter((fait) => !dits.has(cle(fait)));
}

/** La sorte est tirée parmi celles qui ont un fait neuf, puis le fait dans la sorte, hors journal. */
export function choisirSigne(faits: readonly SigneIA[], graine: number, action: number): SigneIA {
  const tirage = entier32(`signe:${graine}:${action}`);
  const sortes = [...new Set(faits.map((fait) => fait.sorte))];
  const sorte = sortes[tirage % sortes.length];
  const candidats = faits.filter((fait) => fait.sorte === sorte);
  const fait = candidats[Math.floor(tirage / sortes.length) % candidats.length];
  if (fait === undefined) throw new Error('Aucun fait à signaler.');
  return fait;
}

/** Rang dans `etat.signes` d'un message `signe-<n>`, à partir de 1 ; `null` pour un autre message. */
export function rangSigne(message: string): number | null {
  const rang = /^signe-(\d+)$/.exec(message)?.[1];
  return rang === undefined ? null : Number(rang);
}

/** Le fait en références publiques ; une porte par ses deux pièces, que le passager les connaisse ou non, sans état qui vieillisse. */
export function signePublic(monde: DefMonde, signe: SigneIA): SignePublic {
  if (signe.sorte === 'materiel') return { sorte: 'materiel', piece: refPiece(monde, signe.piece), appareil: signe.appareil };
  if (signe.sorte !== 'porte') return { sorte: signe.sorte, piece: refPiece(monde, signe.piece) };
  const liaison = indexer(monde).liaisons.get(signe.liaison);
  if (liaison === undefined) throw new Error(`Liaison inconnue : ${signe.liaison}.`);
  return { sorte: 'porte', pieces: [refPiece(monde, liaison.entre[0]), refPiece(monde, liaison.entre[1])] };
}
