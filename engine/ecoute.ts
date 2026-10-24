import { hacher } from './hachage';
import { assourdie, autreCote, chambreFroide, creatureActive, liaisonsVisibles, type EtatPartie } from './etat';
import type { DefMonde } from './monde';
import type { Entendu, EntenduRecit } from './vocabulaire';

// Jet d'écoute aux portes (créature mobile, lot 2, D-343 et suivantes) : en ATTENDANT, un d6 par porte dit ce qu'on perçoit
// derrière. Comme le dé de rencontre, le tirage ne lit que la graine et le numéro d'action : rien n'entre au journal. Sans elle
// derrière, la porte répond pareil toute la partie, sans le numéro d'action : pas de changement fantôme (D-344, revue finale).

/** Faces du d6 donnant chaque résultat selon ce qu'il y a derrière la porte ; seuils à mesurer. */
export const TABLE_ECOUTE = {
  fermee: { net: 3, vague: 5 },
  ouverte: { net: 5, vague: 6 },
  absente: { net: 0, vague: 1 },
} as const;

/** Face du d6 (1 à 6) pour cette porte à cette action ; `undefined` : la face de la porte pour toute la partie. */
export function faceEcoute(graine: number, action: number | undefined, liaison: string): number {
  const cle = action === undefined ? `ecoute:${graine}:${liaison}` : `ecoute:${graine}:${action}:${liaison}`;
  return 1 + (Number.parseInt(hacher(cle).slice(-8), 16) % 6);
}

/** Ce qu'on entend derrière chaque porte de la pièce du joueur ; rien du tout si le vacarme des machines couvre tout. */
export function ecouterPortes(monde: DefMonde, etat: EtatPartie, graine: number, action: number): Readonly<Record<string, Entendu>> {
  if (assourdie(monde, etat, etat.piece)) return {};
  const entendus: Record<string, Entendu> = {};
  for (const liaison of liaisonsVisibles(monde, etat, etat.piece)) {
    if (liaison.gouffre === true) continue;
    const voisine = autreCote(liaison, etat.piece);
    if (assourdie(monde, etat, voisine)) entendus[liaison.id] = 'machines';
    else if (chambreFroide(monde, voisine)) entendus[liaison.id] = 'froid';
    else {
      const elleEstLa = creatureActive(etat) && etat.creature?.piece === voisine;
      const table = !elleEstLa ? TABLE_ECOUTE.absente : etat.liaisons[liaison.id] === true ? TABLE_ECOUTE.ouverte : TABLE_ECOUTE.fermee;
      const face = faceEcoute(graine, elleEstLa ? action : undefined, liaison.id);
      entendus[liaison.id] = face <= table.net ? 'net' : face <= table.vague ? 'vague' : 'rien';
    }
  }
  return entendus;
}

/** Ce que le récit dit de l'écoute : tout la première fois, ensuite seulement ce qui change (un « net » se redit court). */
export function aRaconter(
  avant: Readonly<Record<string, Entendu>> | undefined,
  maintenant: Readonly<Record<string, Entendu>>,
): { readonly liaison: string; readonly entendu: EntenduRecit }[] {
  const dits: { liaison: string; entendu: EntenduRecit }[] = [];
  for (const [liaison, entendu] of Object.entries(maintenant)) {
    const ancien = avant?.[liaison];
    if (ancien === undefined) dits.push({ liaison, entendu });
    else if (entendu === 'net' && ancien === 'net') dits.push({ liaison, entendu: 'toujours' });
    else if (entendu === 'rien' && (ancien === 'net' || ancien === 'vague')) dits.push({ liaison, entendu: 'plus_rien' });
    else if (entendu !== ancien) dits.push({ liaison, entendu });
  }
  return dits;
}

/** Ce que le récit dit d'une écoute : une porte, des portes silencieuses ensemble, ou le rappel des portes inchangées (#261, #266). */
export type DitEcoute =
  | { readonly sorte: 'une'; readonly liaison: string; readonly entendu: EntenduRecit }
  | { readonly sorte: 'groupe'; readonly liaisons: readonly string[]; readonly entendu: 'rien' | 'plus_rien'; readonly toutes: boolean }
  | { readonly sorte: 'rappel'; readonly autres: boolean };

/** `aRaconter`, les silences groupés à la place du premier (D-363), puis le rappel s'il reste des portes non dites (D-362). */
export function recitEcoute(avant: Readonly<Record<string, Entendu>> | undefined, maintenant: Readonly<Record<string, Entendu>>): DitEcoute[] {
  const dits = aRaconter(avant, maintenant);
  const total = Object.keys(maintenant).length;
  const recit: DitEcoute[] = [];
  for (const { liaison, entendu } of dits) {
    if (entendu !== 'rien' && entendu !== 'plus_rien') recit.push({ sorte: 'une', liaison, entendu });
    else if (!recit.some((dit) => dit.sorte === 'groupe' && dit.entendu === entendu)) {
      const liaisons = dits.filter((dit) => dit.entendu === entendu).map((dit) => dit.liaison);
      const [seule] = liaisons;
      if (liaisons.length === 1 && seule !== undefined) recit.push({ sorte: 'une', liaison: seule, entendu });
      else recit.push({ sorte: 'groupe', liaisons, entendu, toutes: entendu === 'rien' && liaisons.length === total && total >= 4 && total <= 12 });
    }
  }
  if (avant !== undefined && dits.length < total) recit.push({ sorte: 'rappel', autres: dits.length > 0 });
  return recit;
}
