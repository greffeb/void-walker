import type { DefMorceau } from '../../engine';
import { TEXTES_AR02 } from '../ar-02/textes';
import { repris } from '../textes/couches';
import type { TextesMorceau } from '../textes/types';
import { TEXTES_MORCEAU_ESSAI } from './essai';

// M-06 — Baie et vide (13 §3, D-246, D-249), morceau final repris d'AR-02. Le couloir de sécurité ouvre sur le local, où
// sont la combinaison et la découpeuse, et sur la salle panoramique, dont la baie est un vitrage extérieur. La porte grippée
// de la panoramique mène à la salle d'embarquement, où attend la créature devant la capsule, déjà alimentée. Les règles
// lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   (entrée) ══ couloir de sécurité ══porte══ local
//                    ╚══porte══ salle panoramique ══porte grippée══ salle d'embarquement ══écoutille══ cabine
export const MORCEAU_M06: DefMorceau = {
  id: 'm-06',
  famille: 'final',
  // Tuile (14 §4.3) : celle d'AR-02, le couloir de sécurité à la place des cabines du personnel.
  pieces: [
    { id: 'p-couloir', nom: 'couloir_securite', plan: { x: 3, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-local', nom: 'local', plan: { x: 0, y: 0, largeur: 3, hauteur: 3 } },
    { id: 'p-panoramique', nom: 'panoramique', plan: { x: 7, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 7, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'l-couloir-local', nom: 'porte', entre: ['p-couloir', 'p-local'], ouverte: true },
    { id: 'l-couloir-panoramique', nom: 'porte', entre: ['p-couloir', 'p-panoramique'], ouverte: false },
    { id: 'l-panoramique-embarquement', nom: 'porte_grippee', entre: ['p-panoramique', 'p-embarquement'], ouverte: false, bruyante: true },
    { id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false },
  ],
  objets: [
    { id: 'o-signaletique', nom: 'signaletique', piece: 'p-couloir', portable: false },
    { id: 'o-casier', nom: 'casier', piece: 'p-local', portable: false },
    { id: 'o-combinaison', nom: 'combinaison', piece: 'p-local', protection: true },
    { id: 'o-decoupeuse', nom: 'decoupeuse', piece: 'p-local', perce: true },
    { id: 'o-baie', nom: 'baie', piece: 'p-panoramique', portable: false, vitrageExterieur: true },
    { id: 'o-kit', nom: 'kit', piece: 'p-panoramique', portable: false, rebouche: 1 },
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  entree: 'p-couloir',
  placesCreature: ['p-embarquement'],
  demande: ['acces'],
  fournit: ['evacuation'],
  // Grandes stations (spec 2026-10-18 §6.1, §6.3) : pièces où une annexe peut s’accrocher, côté avant et coupe de l’obstacle.
  grande: { accueillantes: { 'p-couloir': 'circulation' }, avant: ['p-couloir', 'p-local'], coupe: ['l-couloir-panoramique'], cles: { 'o-combinaison': { etiquettes: ['securite'] }, 'o-decoupeuse': { etiquettes: ['securite'] } } },
};

// Textes du morceau (C-07) : local, panoramique et leurs objets repris d'AR-02 ; la capsule alimentée de l'embarquement
// d'essai ; le couloir de sécurité écrit pour ce morceau, ses voyants d'air au-dessus des portes. Aucun message d'IA Station.
// Texte final non validé.
export const TEXTES_MORCEAU_M06: TextesMorceau = {
  noms: {
    couloir_securite: { texte: 'couloir de sécurité', genre: 'm', nombre: 's', elision: false },
    local: repris(TEXTES_AR02.noms, 'local'),
    panoramique: repris(TEXTES_AR02.noms, 'panoramique'),
    signaletique: repris(TEXTES_AR02.noms, 'signaletique'),
    casier: repris(TEXTES_AR02.noms, 'casier'),
    combinaison: repris(TEXTES_AR02.noms, 'combinaison'),
    decoupeuse: repris(TEXTES_AR02.noms, 'decoupeuse'),
    baie: repris(TEXTES_AR02.noms, 'baie'),
    kit: repris(TEXTES_AR02.noms, 'kit'),
  },
  descriptions: {
    couloir_securite: [
      'Un couloir étroit, sous des plafonniers blafards. Au-dessus de chaque porte, un voyant dit s’il reste de l’air de l’autre côté.',
      'Le couloir de sécurité est nu, ses parois peintes en gris. Chaque porte a son petit voyant d’air, au-dessus du cadre.',
    ],
    local: repris(TEXTES_AR02.descriptions, 'local'),
    panoramique: repris(TEXTES_AR02.descriptions, 'panoramique'),
    signaletique: repris(TEXTES_AR02.descriptions, 'signaletique'),
    casier: repris(TEXTES_AR02.descriptions, 'casier'),
    combinaison: repris(TEXTES_AR02.descriptions, 'combinaison'),
    decoupeuse: repris(TEXTES_AR02.descriptions, 'decoupeuse'),
    baie: repris(TEXTES_AR02.descriptions, 'baie'),
    kit: repris(TEXTES_AR02.descriptions, 'kit'),
    capsule: repris(TEXTES_MORCEAU_ESSAI.descriptions, 'capsule'),
  },
  // Documents des grandes stations (bible docs/17-univers.md §5) : les notes de la combinaison et de la découpeuse déplacées ;
  // un final n'a pas de témoignage.
  documents: {
    doc_bon_rangement: {
      puce: { texte: 'bon de rangement', genre: 'm', nombre: 's', elision: false },
      support: 'note',
      ou: 'scotchée à la paroi, sous film plastique',
      corps: ['Combinaison étanche récupérée et rangée {a:piece}, conformément à la procédure.', 'Ne pas l’emprunter sans signer le registre.'],
      signature: 'Sami',
    },
    doc_note_helene: {
      puce: { texte: 'note d’Hélène', genre: 'f', nombre: 's', elision: false },
      support: 'note',
      ou: 'sur papier à en-tête, scotchée à la paroi',
      corps: ['La découpeuse n’a rien à faire en libre-service.', 'Je l’ai fait ranger {a:piece} ; adressez-vous à la sûreté pour l’emprunter.'],
      signature: 'Hélène',
    },
  },
  assistance: {},
};
