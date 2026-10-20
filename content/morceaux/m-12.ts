import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';

// M-12 — maquette V3, #232. Un obstacle matériel ne transforme jamais sa porte en cloison étanche.
// Atelier — poste — réserve
//    |         |
// Galerie — palier — quai
export const MORCEAU_M12: DefMorceau = {
  id: 'm-12', famille: 'chemin',
  pieces: [
    { id: 'p-atelier', nom: 'atelier_drone', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-galerie', nom: 'galerie_drone', plan: { x: 0, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-poste', nom: 'poste_drone', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-palier', nom: 'palier_chariot', plan: { x: 4, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-stockage', nom: 'stockage', plan: { x: 8, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-quai', nom: 'quai_chariot', plan: { x: 8, y: 3, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-atelier-poste', nom: 'porte', entre: ['p-atelier', 'p-poste'], ouverte: true },
    { id: 'l-atelier-galerie', nom: 'porte', entre: ['p-atelier', 'p-galerie'], ouverte: true },
    { id: 'l-galerie-palier', nom: 'porte', entre: ['p-galerie', 'p-palier'], ouverte: true },
    { id: 'l-poste-palier', nom: 'porte', entre: ['p-poste', 'p-palier'], ouverte: true },
    { id: 'l-poste-reserve', nom: 'porte', entre: ['p-poste', 'p-stockage'], ouverte: true },
    { id: 'l-palier-quai', nom: 'porte', entre: ['p-palier', 'p-quai'], ouverte: true },
  ],
  positions: [
    { id: 'pos-passage', nom: 'dans_passage', piece: 'p-palier' },
    { id: 'pos-rangement', nom: 'dans_rangement', piece: 'p-palier' },
  ],
  objets: [
    { id: 'o-drone', nom: 'drone', piece: 'p-atelier', portable: false, drone: { rail: 'l-atelier-poste', poignee: 'o-poignee' } },
    { id: 'o-poignee', nom: 'poignee_frein', piece: 'p-poste', portable: false, poignee: true },
    { id: 'o-chariot', nom: 'chariot', piece: 'p-palier', portable: false, deplacable: true, position: 'pos-passage',
      obstacle: { passage: 'l-palier-quai', rangement: 'pos-rangement', maintien: 'o-poignee' } },
  ],
  entree: 'p-atelier', sortie: { piece: 'p-quai', porte: { nom: 'porte' } },
  placesCreature: ['p-stockage'], demande: [], fournit: ['acces'],
  // Grandes stations (spec 2026-10-18 §6.1) : déclaré, pas encore tiré (13 §7.14, reprise de main).
  grande: { obstacle: 'materiel', accueillantes: { 'p-atelier': 'technique', 'p-galerie': 'circulation' }, avant: ['p-atelier', 'p-galerie', 'p-poste', 'p-palier', 'p-stockage'], coupe: ['l-palier-quai'] },
};

// Texte final non validé. Les descriptions restent vraies dans tous les états et toutes les compositions.
export const TEXTES_MORCEAU_M12: TextesMorceau = {
  noms: {
    atelier_drone: { texte: 'atelier de manutention', genre: 'm', nombre: 's', elision: true },
    galerie_drone: { texte: 'galerie de service', genre: 'f', nombre: 's', elision: false },
    poste_drone: { texte: 'poste de commande', genre: 'm', nombre: 's', elision: false },
    palier_chariot: { texte: 'palier du chariot', genre: 'm', nombre: 's', elision: false },
    stockage: { texte: 'réserve de manutention', genre: 'f', nombre: 's', elision: false },
    quai_chariot: { texte: 'quai de transfert', genre: 'm', nombre: 's', elision: false },
    drone: { texte: 'drone de manutention', genre: 'm', nombre: 's', elision: false },
    poignee_frein: { texte: 'poignée de frein', genre: 'f', nombre: 's', elision: false },
    chariot: { texte: 'chariot', genre: 'm', nombre: 's', elision: false },
    dans_passage: { texte: 'en travers du passage', genre: 'm', nombre: 's', elision: false },
    dans_rangement: { texte: 'dans son logement latéral', genre: 'm', nombre: 's', elision: false },
  },
  descriptions: {
    atelier_drone: ['Un atelier aux établis rayés. Un rail est boulonné au sol, entre les traces anciennes de graisse.', 'Des outils pendent à un panneau perforé. Une glissière métallique court sur le sol de l’atelier.'],
    galerie_drone: ['Une galerie étroite, bordée de câbles sous des plinthes démontables.', 'Des gaines longent les murs de la galerie. La peinture porte des marques de frottement.'],
    poste_drone: ['Un poste de commande aux plaques gravées. Une tringle de frein traverse le socle du pupitre.', 'Des commandes mécaniques, un bâti usé et des plaques de consigne vissées au mur.'],
    palier_chariot: ['Un palier au sol strié. Des rails de manutention bordent un renfoncement latéral.', 'Des traces de roues rayent le revêtement du palier. Une butée de caoutchouc garnit le renfoncement.'],
    stockage: ['Des rayonnages de pièces de rechange plongent dans l’ombre.', 'Des emballages déchirés, des pignons et des courroies sur des étagères métalliques.'],
    quai_chariot: ['Un quai de transfert, bordé de repères de chargement effacés.', 'Des anneaux d’arrimage affleurent le sol du quai. La peinture des repères s’écaille.'],
    drone: ['Un drone de manutention à roues guidées. Un bras articulé, un bouton de départ et un arrêt de sécurité occupent son châssis.', 'Un petit châssis motorisé, guidé par un rail. Il porte un bras de maintien, sans plateau de transport.'],
    poignee_frein: ['Une poignée à ressort, reliée à une tringle de frein. Une plaque porte la mention « Maintien continu ».', 'Un levier de frein à rappel mécanique. Sa poignée est polie par les mains.'],
    chariot: ['Un chariot chargé de pièces métalliques, monté sur des roues épaisses avec un frein à tringle.', 'Des pièces de machine sont sanglées sur un chariot lourd. Un mécanisme de freinage longe son essieu.'],
  },
  assistance: {},
};
