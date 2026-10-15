import { reunir } from './couches';
import type { Nom, TextesMonde, Variantes } from './types';
import { UNIVERS } from './univers';

// Textes communs aux stations de test des nouveaux morceaux (#105) : la réunion du socle, de l'univers et de la menace
// (13 §7.2). Chaque station y ajoute ses noms, ses descriptions et ses messages d'IA Station.

/** Noms des pièces et objets que toutes les stations de test partagent : départ, embarquement, capsule. */
export const NOMS_STATION_ESSAI: Readonly<Record<string, Nom>> = UNIVERS.noms;

export const DESCRIPTIONS_STATION_ESSAI: Readonly<Record<string, Variantes>> = UNIVERS.descriptions;

/** Tout ce qui ne dépend pas d'une station de test : récit, aperçu, menus, pièces communes. */
export const TEXTES_STATION_ESSAI: TextesMonde = reunir([]);
