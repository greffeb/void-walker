import type { TableButin } from '../../engine';

// Table de butin des grandes stations (spec 2026-10-18 §6.6, #207) : de deux à trois salles de butin, chacune vide ou garnie
// d'un objet sans aucune qualité passive. La salle vide pèse 2 ; la trousse, 1 ; la burette, 2, mais seulement au-delà de la
// coupe de M-04, dont la burette d'huile est la clé. `id` et `piece` sont repris par la pose, qui marque l'objet `butin`. Les
// noms et les descriptions sont ceux du catalogue (`cat_…`).
export const TABLE_BUTIN: TableButin = {
  vide: 2,
  salles: [2, 3],
  entrees: [
    { objet: { id: 'o-butin-trousse', nom: 'cat_trousse', piece: '', soin: 1 }, poids: 1 },
    { objet: { id: 'o-butin-burette', nom: 'cat_burette_reserve', piece: '', glissant: 1 }, poids: 2, apresCoupeDe: 'm-04' },
  ],
};
