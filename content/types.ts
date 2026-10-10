import type { DefMonde, IdAction } from '../engine';
import type { TextesMonde } from './textes/types';

/** Étape d'un parcours témoin, décrite comme un joueur la choisirait au menu : action, nom de la cible. */
export interface EtapeParcours {
  readonly action: IdAction;
  readonly cible: string;
  readonly vers?: string;
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
  };
}

export interface EntreeMonde {
  readonly monde: DefMonde;
  readonly textes: TextesMonde;
  readonly parcours: Parcours;
}
