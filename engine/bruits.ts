import { hacher } from './hachage';

// Bruits de station (spec 2026-10-18 §5.5) : avant la rencontre, une grande station fait entendre ses bruits (coque, ventilation,
// canalisations), une action sur sept environ. Le tirage ne lit que la graine de partie et le numéro d'action : rien n'entre dans
// l'état, ni la preuve, ni le rejeu, ni la sauvegarde ne changent.

export const FREQUENCE_BRUIT_STATION = 7;

export function bruitDeStation(graine: number, action: number): boolean {
  return Number.parseInt(hacher(`bruit:${graine}:${action}`).slice(-8), 16) % FREQUENCE_BRUIT_STATION === 0;
}
