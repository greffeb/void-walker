import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';

// M-12 — chariot trop lourd et drone à retrouver (#232, refondu par #270). Un obstacle matériel ne transforme jamais sa porte en
// cloison étanche ; seul le drone de manutention le range, et l'assemblage le pose n'importe où avant lui.
// Atelier     Réserve
//    |           |
// Galerie — Palier ═chariot═ Quai
export const MORCEAU_M12: DefMorceau = {
  id: 'm-12', famille: 'chemin',
  pieces: [
    { id: 'p-galerie', nom: 'galerie_drone', plan: { x: 0, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-atelier', nom: 'atelier_drone', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-palier', nom: 'palier_chariot', plan: { x: 4, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-stockage', nom: 'stockage', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-quai', nom: 'quai_chariot', plan: { x: 8, y: 3, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-galerie-atelier', nom: 'porte', entre: ['p-galerie', 'p-atelier'], ouverte: true },
    { id: 'l-galerie-palier', nom: 'porte', entre: ['p-galerie', 'p-palier'], ouverte: true },
    { id: 'l-palier-reserve', nom: 'porte', entre: ['p-palier', 'p-stockage'], ouverte: true },
    { id: 'l-palier-quai', nom: 'porte', entre: ['p-palier', 'p-quai'], ouverte: true },
  ],
  positions: [
    { id: 'pos-passage', nom: 'dans_passage', piece: 'p-palier' },
    { id: 'pos-rangement', nom: 'dans_rangement', piece: 'p-palier' },
  ],
  objets: [
    { id: 'o-drone', nom: 'drone', piece: 'p-atelier', portable: false, drone: { obstacle: 'o-chariot' } },
    { id: 'o-chariot', nom: 'chariot', piece: 'p-palier', portable: false, deplacable: true, position: 'pos-passage',
      obstacle: { passage: 'l-palier-quai', rangement: 'pos-rangement' } },
  ],
  entree: 'p-galerie', sortie: { piece: 'p-quai', porte: { nom: 'porte' } },
  placesCreature: ['p-stockage'], demande: [], fournit: ['acces'],
  grande: { obstacle: 'materiel', accueillantes: { 'p-atelier': 'technique', 'p-galerie': 'circulation' }, avant: ['p-galerie', 'p-atelier', 'p-palier', 'p-stockage'], coupe: ['l-palier-quai'] },
};

// Texte final non validé. Les descriptions restent vraies dans tous les états et toutes les compositions.
export const TEXTES_MORCEAU_M12: TextesMorceau = {
  noms: {
    atelier_drone: { texte: 'atelier de manutention', genre: 'm', nombre: 's', elision: true },
    galerie_drone: { texte: 'galerie de service', genre: 'f', nombre: 's', elision: false },
    palier_chariot: { texte: 'palier du chariot', genre: 'm', nombre: 's', elision: false },
    stockage: { texte: 'réserve de manutention', genre: 'f', nombre: 's', elision: false },
    quai_chariot: { texte: 'quai de transfert', genre: 'm', nombre: 's', elision: false },
    drone: { texte: 'drone de manutention', genre: 'm', nombre: 's', elision: false },
    chariot: { texte: 'chariot', genre: 'm', nombre: 's', elision: false },
    dans_passage: { texte: 'en travers du passage', genre: 'm', nombre: 's', elision: false },
    dans_rangement: { texte: 'dans son logement latéral', genre: 'm', nombre: 's', elision: false },
  },
  descriptions: {
    atelier_drone: ['Un atelier aux établis rayés, entre les traces anciennes de graisse.', 'Des outils pendent à un panneau perforé. Une borne de recharge attend contre le mur.'],
    galerie_drone: ['Une galerie étroite, bordée de câbles sous des plinthes démontables.', 'Des gaines longent les murs de la galerie. La peinture porte des marques de frottement.'],
    palier_chariot: ['Un palier au sol strié. Des rails de manutention bordent un renfoncement latéral.', 'Des traces de roues rayent le revêtement du palier. Une butée de caoutchouc garnit le renfoncement.'],
    stockage: ['Des rayonnages de pièces de rechange plongent dans l’ombre.', 'Des emballages déchirés, des pignons et des courroies sur des étagères métalliques.'],
    quai_chariot: ['Un quai de transfert, bordé de repères de chargement effacés.', 'Des anneaux d’arrimage affleurent le sol du quai. La peinture des repères s’écaille.'],
    drone: ['Un drone de manutention sur roues épaisses. Un bras de traction, un bouton de départ et un arrêt de sécurité occupent son châssis.', 'Un petit châssis motorisé, monté sur des roues increvables. Son bras articulé se termine par un crochet de traction.'],
    chariot: ['Un chariot chargé de pièces métalliques, bien trop lourd pour être bougé à la main. À l’avant, un crochet attend un drone de manutention.', 'Des pièces de machine sont sanglées sur un chariot énorme. Une plaque prévient : « Déplacement par drone de manutention uniquement ».'],
  },
  // Documents des grandes stations (bible docs/17-univers.md §5) : un témoignage sur l'obstacle ; le chariot ne se porte pas.
  documents: {
    doc_message_clara: {
      puce: { texte: 'message de Clara', genre: 'm', nombre: 's', elision: false },
      support: 'message',
      ou: 'sur un enregistreur de poche, accroché à la paroi par sa dragonne',
      corps: [
        '[essoufflée] Le chariot ne bouge pas d’un pouce. Sans drone de manutention pour le tirer, on peut toujours pousser.',
        '[un moteur qui grince] J’en ai retrouvé un et je l’ai lancé : il fait plus de bruit qu’une équipe de nuit.',
        '[plus bas] Elle est venue et l’a jeté sur le flanc.',
        '[un temps] Je l’ai redressé, je l’ai relancé, et il a fini par tirer le chariot sur le côté.',
      ],
    },
  },
  assistance: {},
};
