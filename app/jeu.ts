import { jouer, nouvellePartie, observer, reprendrePartie, type DefMonde, type OptionMenu, type Partie } from '../engine';
import { raconter, raconterDerniers, type TextesMonde } from '../content';
import { rappelDe, rappelRepris, texteRappel, type TexteRappel } from './ecran';
import type { Stockage } from './sauvegarde';

// Logique de l'écran, sans React : démarrer, reprendre, jouer, sauvegarder honnêtement (C-09 §2-§3).

export type EtatSauvegarde = 'sauvegardee' | 'echec';

export interface Jeu {
  readonly partie: Partie;
  readonly recit: readonly string[];
  /** Rappel de la dernière action choisie, en tête du récit ; `null` au début de la partie. */
  readonly rappel: TexteRappel | null;
  readonly sauvegarde: EtatSauvegarde;
}

export type Demarrage = { readonly type: 'pret'; readonly jeu: Jeu } | { readonly type: 'reprise_impossible'; readonly raison: string };

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
  return { partie, recit: raconterDerniers(env.textes, partie), rappel: null, sauvegarde: await enregistrer(env, partie) };
}

/** Reprend la partie enregistrée au dernier geste, ou en commence une si rien n'est enregistré. */
export async function demarrer(env: Environnement): Promise<Demarrage> {
  let donnees: unknown;
  try {
    donnees = await env.stockage.lire();
  } catch (erreur) {
    // Ne jamais écraser une sauvegarde qu'on n'a pas pu lire : le joueur décide.
    return { type: 'reprise_impossible', raison: `Lecture de la sauvegarde impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}` };
  }
  if (donnees === null) return { type: 'pret', jeu: await commencer(env) };
  try {
    const partie = reprendrePartie(env.monde, donnees, env.version);
    const repris = rappelRepris(partie, observer(env.monde, partie.etat));
    const rappel = repris === null ? null : texteRappel(env.textes, repris);
    return { type: 'pret', jeu: { partie, recit: raconterDerniers(env.textes, partie), rappel, sauvegarde: 'sauvegardee' } };
  } catch (erreur) {
    return { type: 'reprise_impossible', raison: erreur instanceof Error ? erreur.message : String(erreur) };
  }
}

/** Fiche d'une bulle : texte de la consultation, sans toucher à la partie, au récit ni à la sauvegarde (D-014). */
export function consulter(env: Pick<Environnement, 'monde' | 'textes'>, partie: Partie, option: OptionMenu): string[] {
  const resultat = jouer(env.monde, partie, option.commande);
  if (resultat.type === 'engagee') throw new Error(`« ${option.action} » engage le personnage : ce n’est pas une fiche.`);
  return raconter(env.textes, resultat);
}

/** Joue la commande d'une option ; seule une action engagée écrit, et l'échec d'écriture reste signalé (C-09 §3). */
export async function jouerOption(env: Environnement, jeu: Jeu, option: OptionMenu): Promise<Jeu> {
  const resultat = jouer(env.monde, jeu.partie, option.commande);
  const recit = raconter(env.textes, resultat);
  const rappel = texteRappel(env.textes, rappelDe(option));
  if (resultat.type !== 'engagee') return { ...jeu, recit, rappel };
  return { partie: resultat.partie, recit, rappel, sauvegarde: await enregistrer(env, resultat.partie) };
}
