import type { DefMonde } from '../../engine';

// AR-01 — Évacuation de la station (docs/08-aventure-reference.md §11) : sept pièces, deux sources d'énergie pour la capsule.
// Les règles lisent les qualités déclarées ici, jamais un nom ni un identifiant (D-078).
export const MONDE_AR01: DefMonde = {
  id: 'ar-01',
  depart: 'p-salon',
  pieces: [
    { id: 'p-salon', nom: 'salon' },
    { id: 'p-atelier', nom: 'atelier' },
    { id: 'p-galerie', nom: 'galerie', feu: true },
    { id: 'p-energie', nom: 'energie' },
    { id: 'p-observation', nom: 'observation' },
    { id: 'p-embarquement', nom: 'embarquement' },
    { id: 'p-cabine', nom: 'cabine' },
  ],
  liaisons: [
    { id: 'l-salon-atelier', nom: 'porte', entre: ['p-salon', 'p-atelier'], ouverte: true },
    { id: 'l-salon-galerie', nom: 'cloison', entre: ['p-salon', 'p-galerie'], ouverte: false },
    { id: 'l-galerie-energie', nom: 'cloison', entre: ['p-galerie', 'p-energie'], ouverte: false },
    {
      id: 'l-atelier-energie',
      nom: 'grille',
      entre: ['p-atelier', 'p-energie'],
      ouverte: false,
      etroite: true,
      sonAuTravers: true,
      haute: 'p-atelier',
      sansSignaletique: true,
    },
    { id: 'l-energie-observation', nom: 'cloison', entre: ['p-energie', 'p-observation'], ouverte: false, bruyante: true },
    { id: 'l-observation-embarquement', nom: 'cloison', entre: ['p-observation', 'p-embarquement'], ouverte: true },
    { id: 'l-energie-embarquement', nom: 'panneau', entre: ['p-energie', 'p-embarquement'], ouverte: false, etroite: true, cachee: 'p-embarquement' },
    { id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: true, manoeuvre: 'p-cabine' },
  ],
  positions: [
    { id: 'pos-sous-grille', nom: 'sous_grille', piece: 'p-atelier', sous: 'l-atelier-energie' },
    { id: 'pos-centre', nom: 'centre', piece: 'p-atelier' },
  ],
  objets: [
    { id: 'o-poste', nom: 'poste', piece: 'p-salon', portable: false },
    { id: 'o-signaletique', nom: 'signaletique', piece: 'p-salon', portable: false },
    { id: 'o-caisse', nom: 'caisse', piece: 'p-atelier', position: 'pos-centre', portable: false, deplacable: true, appui: true },
    { id: 'o-bidon', nom: 'bidon', piece: 'p-atelier', extinction: 1 },
    { id: 'o-burette', nom: 'burette', piece: 'p-atelier', glissant: 1 },
    { id: 'o-trousse', nom: 'trousse', piece: 'p-atelier', soin: 1 },
    { id: 'o-console', nom: 'console', piece: 'p-energie', portable: false, alimente: 'o-capsule' },
    { id: 'o-bloc', nom: 'bloc', piece: 'p-energie', large: true, source: true },
    { id: 'o-avertisseur', nom: 'avertisseur', piece: 'p-energie', portable: false, avertisseur: { piece: 'p-observation' } },
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine' } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  creature: { piece: 'p-observation' },
  assistance: [
    { id: 'reveil', quand: { type: 'reveil' } },
    { id: 'energie', quand: { type: 'arrivee', piece: 'p-energie' } },
    { id: 'depart', quand: { type: 'evacuation' } },
  ],
};
