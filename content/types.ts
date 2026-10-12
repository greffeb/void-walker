import type { DefMonde, IdAction, Sante } from '../engine';
import type { TextesMonde } from './textes/types';

/** Étape d'un parcours témoin, décrite comme un joueur la choisirait au menu : action, nom de la cible. */
export interface EtapeParcours {
  readonly action: IdAction;
  readonly cible: string;
  /** Destination du passage visé ; à omettre tant qu'elle est inconnue (le passage se vise alors par son seul nom). */
  readonly vers?: string;
  /** Paramètre comme le menu l'affiche : nom de la position, de la destination du passage, ou de la pièce visée. */
  readonly parametre?: string;
}

export interface Parcours {
  readonly nom: string;
  readonly etapes: readonly EtapeParcours[];
  /** Ce que l'observation publique doit montrer à la fin, par clés de nom. */
  readonly attendu: {
    readonly piece: string;
    readonly objetsIci: readonly string[];
    readonly inventaire: readonly string[];
    readonly passagesOuverts: readonly string[];
    readonly actions: number;
    readonly issue?: 'evacuation';
    readonly sante?: Sante;
    /** Aucun dé tiré de tout le parcours. */
    readonly sansDe?: true;
  };
}

export interface EntreeMonde {
  readonly monde: DefMonde;
  readonly textes: TextesMonde;
  readonly parcours: readonly Parcours[];
}
