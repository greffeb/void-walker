import { jouer, nouvellePartie, type Commande, type Observation, type Partie } from '../engine';
import type { EntreeMonde } from '../content';
import type { Bot } from './bots';
import type { PasTemoin } from './verifier-grandes';

// Bots de référence (mesure 2026-11) : ils connaissent la solution de la station, son chemin prouvé. Ce ne sont pas des profils
// de joueur, et leurs chiffres se lisent à part : ils bornent ce qu'un joueur peut espérer, ils ne disent pas ce qu'il obtient.

/**
 * Rejoue le chemin prouvé (le témoin publié) sans regarder autour de lui, et abandonne au premier pas que le menu ne propose
 * plus. Il borne la durée minimale d'une partie et dit ce que la créature fait à quelqu'un qui marche droit vers la capsule.
 */
export function botTemoin(pas: readonly PasTemoin[]): Bot {
  let rang = 0;
  return {
    choisir({ observation }) {
      rang = sansPorteOuverte(pas, rang, observation);
      const [action, cible, parametre] = pas[rang++] ?? [];
      return observation.menu.find((option) => option.disponible && option.action === action && option.cible.id === cible && option.parametre?.id === parametre)?.commande ?? null;
    },
  };
}

/** Rang du prochain pas à jouer : « ouvrir » une porte que la créature a déjà ouverte ou enfoncée se saute. */
function sansPorteOuverte(pas: readonly PasTemoin[], rang: number, observation: Observation): number {
  const dejaOuverte = (suivant: PasTemoin | undefined): boolean => suivant?.[0] === 'ouvrir' && observation.passages.some((passage) => passage.id === suivant[1] && passage.ouvert);
  while (dejaOuverte(pas[rang])) rang++;
  return rang;
}

/** Coups du chemin prouvé que le voyant joue d'avance, et attentes qu'il essaie avant de renoncer à éviter le coup. */
export const HORIZON = 8;
export const PATIENCE = 6;

/**
 * OMNISCIENT. Suit le chemin prouvé et voit l'avenir : avant chaque pas, il joue d'avance les `horizon` pas suivants sur une
 * copie de la partie, hasard compris (le moteur est déterministe). Si le passager y est blessé, il essaie d'attendre d'abord,
 * de une à `patience` fois, et prend la plus courte attente qui l'évite ; sinon il avance quand même. Il ne sait rien faire
 * d'autre qu'attendre : c'est une borne basse de ce que vaut la clairvoyance, et la plus petite recherche arborescente possible.
 */
export function botVoyant(entree: EntreeMonde, graine: number, pas: readonly PasTemoin[], horizon = HORIZON, patience = PATIENCE): Bot {
  const { monde } = entree;
  // La copie rejoue chaque commande rendue : même monde, même graine, donc le même état que la vraie partie.
  let ombre = nouvellePartie(monde, { version: 'bot', graine });
  let rang = 0;
  const commandeDe = ([action, cible, parametre]: PasTemoin): Commande => ({ action, cible, ...(parametre === undefined ? {} : { parametre }) }) as Commande;
  const indemne = (attendre: Commande | null, attentes: number): boolean => {
    let partie: Partie = ombre;
    const suite = [...Array.from({ length: attentes }, () => attendre), ...pas.slice(rang, rang + horizon).map(commandeDe)];
    for (const commande of suite) {
      if (commande === null) return false;
      const resultat = jouer(monde, partie, commande);
      if (resultat.type !== 'engagee' || resultat.partie.etat.sante !== ombre.etat.sante) return false;
      partie = resultat.partie;
      if (partie.etat.fin !== null) return true;
    }
    return true;
  };
  const engager = (commande: Commande): Commande | null => {
    const resultat = jouer(monde, ombre, commande);
    if (resultat.type !== 'engagee') return null;
    ombre = resultat.partie;
    return commande;
  };
  return {
    choisir({ observation }) {
      rang = sansPorteOuverte(pas, rang, observation);
      const suivant = pas[rang];
      if (suivant === undefined) return null;
      const attendre = observation.menu.find((option) => option.disponible && option.action === 'attendre')?.commande ?? null;
      for (let attentes = 0; attentes <= patience; attentes++) {
        if (!indemne(attendre, attentes)) continue;
        if (attentes > 0 && attendre !== null) return engager(attendre);
        break;
      }
      rang++;
      return engager(commandeDe(suivant));
    },
  };
}
