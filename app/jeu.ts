import { jouer, nouvellePartie, reprendrePartie, type Commande, type DefMonde, type Partie } from '../engine';
import { raconter, raconterDerniers, type TextesMonde } from '../content';
import type { Stockage } from './sauvegarde';

// Logique de l'écran, sans React : démarrer, reprendre, jouer, sauvegarder honnêtement (C-09 §2-§3).

export type EtatSauvegarde = 'sauvegardee' | 'echec';

export interface Jeu {
  readonly partie: Partie;
  readonly recit: readonly string[];
  readonly sauvegarde: EtatSauvegarde;
}

export type Demarrage = { readonly type: 'pret'; readonly jeu: Jeu } | { readonly type: 'incompatible'; readonly raison: string };

export interface Environnement {
  readonly monde: DefMonde;
  readonly textes: TextesMonde;
  readonly version: string;
  readonly stockage: Stockage;
  readonly graine: () => number;
}

async function enregistrer(env: Environnement, partie: Partie): Promise<EtatSauvegarde> {
  try {
    await env.stockage.ecrire(JSON.parse(JSON.stringify(partie)) as unknown);
    return 'sauvegardee';
  } catch {
    return 'echec';
  }
}

export async function commencer(env: Environnement): Promise<Jeu> {
  const partie = nouvellePartie(env.monde, { version: env.version, graine: env.graine() });
  return { partie, recit: raconterDerniers(env.textes, partie), sauvegarde: await enregistrer(env, partie) };
}

/** Reprend la partie enregistrée au dernier geste, ou en commence une si rien n'est enregistré. */
export async function demarrer(env: Environnement): Promise<Demarrage> {
  let donnees: unknown;
  try {
    donnees = await env.stockage.lire();
  } catch {
    return { type: 'pret', jeu: await commencer(env) };
  }
  if (donnees === null) return { type: 'pret', jeu: await commencer(env) };
  try {
    const partie = reprendrePartie(env.monde, donnees, env.version);
    return { type: 'pret', jeu: { partie, recit: raconterDerniers(env.textes, partie), sauvegarde: 'sauvegardee' } };
  } catch (erreur) {
    return { type: 'incompatible', raison: erreur instanceof Error ? erreur.message : String(erreur) };
  }
}

/** Joue une commande ; seule une action engagée écrit, et l'échec d'écriture reste signalé (C-09 §3). */
export async function jouerCommande(env: Environnement, jeu: Jeu, commande: Commande): Promise<Jeu> {
  const resultat = jouer(env.monde, jeu.partie, commande);
  const recit = raconter(env.textes, resultat);
  if (resultat.type !== 'engagee') return { ...jeu, recit };
  return { partie: resultat.partie, recit, sauvegarde: await enregistrer(env, resultat.partie) };
}
