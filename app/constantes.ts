// Valeurs vides partagées par les écrans : une seule référence, stable d'un rendu à l'autre.

import type { Signal } from './son/recettes';

export const AUCUN_SIGNAL: readonly Signal[] = [];
export const SANS_ABONNEMENT = (): (() => void) => () => undefined;
