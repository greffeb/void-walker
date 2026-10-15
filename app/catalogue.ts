import { assemblerStation } from '../engine';
import { creerCatalogue, type Catalogue } from '../content';

/** Catalogue des mondes, stations assemblées par le moteur. */
export const CATALOGUE: Catalogue = creerCatalogue(assemblerStation);
