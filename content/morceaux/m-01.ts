import type { DefMorceau } from '../../engine';
import { TEXTES_AR01 } from '../ar-01/textes';
import { repris } from '../textes/couches';
import type { TextesMorceau } from '../textes/types';

// M-01 — Galerie en feu (13 §3, D-188, D-244, D-258), morceau de chemin repris d'AR-01. Le poste incendie garde le bidon
// d'eau ; derrière sa cloison, le tunnel technique brûle ; une seconde cloison mène au palier, où attend la créature, et au
// morceau suivant. Laissée ouverte, une cloison laisse le feu gagner la pièce voisine. Les règles lisent les qualités
// déclarées ici, jamais un nom (D-078).
//
//   poste incendie ══cloison══ tunnel technique (feu) ══cloison══ palier ══cloison══ (suite)
export const MORCEAU_M01: DefMorceau = {
  id: 'm-01',
  famille: 'chemin',
  // Tuile (14 §4.3) : les trois pièces en rang.
  pieces: [
    { id: 'p-poste', nom: 'poste_incendie', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-galerie', nom: 'galerie', feu: true, plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-palier', nom: 'palier', plan: { x: 8, y: 0, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-poste-galerie', nom: 'cloison', entre: ['p-poste', 'p-galerie'], ouverte: false },
    { id: 'l-galerie-palier', nom: 'cloison', entre: ['p-galerie', 'p-palier'], ouverte: false },
  ],
  objets: [{ id: 'o-bidon', nom: 'bidon', piece: 'p-poste', extinction: 1 }],
  entree: 'p-poste',
  sortie: { piece: 'p-palier', porte: { nom: 'cloison' } },
  placesCreature: ['p-palier'],
  demande: [],
  fournit: ['acces'],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { obstacle: 'materiel', accueillantes: { 'p-poste': 'technique', 'p-palier': 'circulation' }, avant: ['p-poste'], coupe: ['l-poste-galerie'], cles: { 'o-bidon': { etiquettes: ['eau'] } } },
};

// Textes du morceau (C-07) : le bidon et la cloison repris d'AR-01 ; le poste incendie, le tunnel technique et le palier écrits
// pour ce morceau, sans « galerie », que M-08 emploie, ni rien qui nomme une pièce voisine. Aucun message d'IA Station. Texte
// final non validé.
export const TEXTES_MORCEAU_M01: TextesMorceau = {
  noms: {
    poste_incendie: { texte: 'poste incendie', genre: 'm', nombre: 's', elision: false },
    galerie: { texte: 'tunnel technique', genre: 'm', nombre: 's', elision: false },
    palier: { texte: 'palier', genre: 'm', nombre: 's', elision: false },
    cloison: repris(TEXTES_AR01.noms, 'cloison'),
    bidon: repris(TEXTES_AR01.noms, 'bidon'),
  },
  descriptions: {
    poste_incendie: [
      'Un poste incendie exigu, peint en rouge. Les supports muraux sont presque tous vides.',
      'Des râteliers rouges, des crochets nus, un dévidoir sans tuyau. Le poste incendie a été presque vidé.',
    ],
    galerie: [
      'Un tunnel technique bas et long, tapissé de chemins de câbles. Une plaque signale un risque d’incendie dans ce compartiment.',
      'Des câbles et des conduites courent tout le long du tunnel. Une plaque rouge signale un risque d’incendie.',
    ],
    palier: [
      'Un palier étroit au sol de caillebotis. Une rangée de veilleuses l’éclaire à peine.',
      'Un palier de métal nu, sous des veilleuses pâles. Une rambarde court le long du caillebotis.',
    ],
    bidon: repris(TEXTES_AR01.descriptions, 'bidon'),
  },
  assistance: {},
};
