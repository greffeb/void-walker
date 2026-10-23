import type { DefAnnexe, DefMorceau } from '../../engine';

// Catalogue des pièces sans obstacle (spec 2026-10-18 §5.2, #206) : une station de transit et de fret. Chaque pièce est un
// morceau `annexe` d'une seule pièce, que l'assembleur accroche au chemin d'une grande station. Les étiquettes disent ce qu'elle
// peut recevoir (document, butin, clé plausible) ; les règles les lisent, jamais un nom (D-078).

function annexe(id: string, nom: string, largeur: number, hauteur: number, declaration: DefAnnexe): DefMorceau {
  return {
    id,
    famille: 'annexe',
    pieces: [{ id: 'p-piece', nom, plan: { x: 0, y: 0, largeur, hauteur } }],
    liaisons: [],
    objets: [],
    entree: 'p-piece',
    placesCreature: [],
    demande: [],
    fournit: [],
    annexe: declaration,
  };
}

export const PIECES_CATALOGUE: readonly DefMorceau[] = [
  annexe('a-couchettes', 'cat_couchettes', 4, 3, { categorie: 'vie', forme: 'impasse', etiquettes: ['couchage', 'document', 'butin'], porte: 'tiree' }),
  annexe('a-sanitaires', 'cat_sanitaires', 3, 3, { categorie: 'vie', forme: 'impasse', etiquettes: ['eau', 'document'], porte: 'tiree', surCouloirDe: 'couchage' }),
  annexe('a-refectoire', 'cat_refectoire', 6, 3, { categorie: 'vie', forme: 'passage', etiquettes: ['document'], porte: 'tiree' }),
  annexe('a-cambuse', 'cat_cambuse', 3, 3, { categorie: 'vie', forme: 'impasse', etiquettes: ['eau', 'document', 'butin'], porte: 'tiree' }),
  annexe('a-infirmerie', 'cat_infirmerie', 4, 3, { categorie: 'vie', forme: 'impasse', etiquettes: ['soin', 'document', 'butin'], porte: 'fermee' }),
  annexe('a-buanderie', 'cat_buanderie', 4, 3, { categorie: 'vie', forme: 'impasse', etiquettes: ['eau', 'document', 'butin'], porte: 'tiree' }),
  annexe('a-outillage', 'cat_outillage', 4, 3, { categorie: 'technique', forme: 'impasse', etiquettes: ['outillage', 'rangement', 'document'], porte: 'tiree' }),
  annexe('a-consigne', 'cat_consigne', 4, 3, { categorie: 'technique', forme: 'impasse', etiquettes: ['rangement', 'lourd', 'document', 'butin'], porte: 'fermee' }),
  annexe('a-depot', 'cat_depot', 4, 3, { categorie: 'technique', forme: 'impasse', etiquettes: ['rangement', 'lourd', 'document'], porte: 'fermee' }),
  annexe('a-vestiaire', 'cat_vestiaire', 3, 3, { categorie: 'technique', forme: 'impasse', etiquettes: ['securite', 'document'], porte: 'tiree' }),
  annexe('a-ventilation', 'cat_ventilation', 4, 3, { categorie: 'technique', forme: 'impasse', etiquettes: ['outillage', 'document'], porte: 'fermee' }),
  annexe('a-couloir', 'cat_couloir', 8, 2, { categorie: 'circulation', forme: 'couloir', etiquettes: ['document'], porte: 'tiree' }),
  annexe('a-plateforme', 'cat_plateforme', 6, 4, { categorie: 'fret', forme: 'passage', etiquettes: ['origine', 'lourd', 'document'], porte: 'tiree' }),
  annexe('a-bureau-fret', 'cat_bureau_fret', 3, 3, { categorie: 'commandement', forme: 'impasse', etiquettes: ['document'], porte: 'tiree' }),
  annexe('a-laboratoire', 'cat_laboratoire', 4, 3, { categorie: 'science', forme: 'impasse', etiquettes: ['document', 'butin'], porte: 'fermee' }),
];

/**
 * Salle de surveillance (créature mobile lot 4, §4.3) : une impasse du catalogue déjà posée la devient, sur une part des grandes
 * stations, sans changer ni son rectangle ni sa porte. Hors de `PIECES_CATALOGUE` : la pose des annexes ne la tire jamais. Sans
 * étiquette, elle ne reçoit ni clé, ni butin, ni document de l'univers ; son terminal exige le post-it posé ailleurs.
 */
export const SALLE_SURVEILLANCE: DefMorceau = {
  ...annexe('a-surveillance', 'cat_surveillance', 3, 3, { categorie: 'commandement', forme: 'impasse', etiquettes: [], porte: 'tiree' }),
  objets: [{ id: 'o-terminal', nom: 'cat_terminal', piece: 'p-piece', portable: false, terminal: true, exige: 'o-post-it' }],
};
