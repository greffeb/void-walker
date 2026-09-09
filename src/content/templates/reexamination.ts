// ---------------------------------------------------------------------------
// src/content/templates/reexamination.ts — Looking at the same thing again
// ---------------------------------------------------------------------------
// The narration bridge answered every repeated EXAMINE/SCAN/LISTEN/SMELL/READ
// with one hardcoded French sentence. Measured over 60 seeded runs, that single
// line was 208 of the 2170 narrated turns — the most repeated text in the game
// by a factor of sixteen, and the only French string left in the bridge.
//
// A second look is not a fifth one: `tier` grades how insistent the player is.
// ---------------------------------------------------------------------------

import type { LocaleString } from '../../engine/scenario';

export type ReexaminationTier = 'second' | 'third' | 'insistent';

export interface ReexaminationSnippet {
  readonly id: string;
  readonly tier: ReexaminationTier;
  /** Restricted to a sense when the wording only fits that one. */
  readonly sense?: 'sight' | 'sound' | 'smell' | 'read';
  readonly text: LocaleString;
}

export const REEXAMINATION_SNIPPETS: readonly ReexaminationSnippet[] = [
  // ── Second look: nothing new, but the look itself is described ──
  { id: 'rx_2_01', tier: 'second', text: { fr: "Vous ne remarquez rien de nouveau.", en: 'Nothing new catches your eye.' } },
  { id: 'rx_2_02', tier: 'second', text: { fr: "Rien n'a changé depuis votre dernier passage.", en: 'Nothing has changed since your last look.' } },
  { id: 'rx_2_03', tier: 'second', text: { fr: "Le second examen ne révèle rien que le premier n'ait déjà livré.", en: 'The second look yields nothing the first did not.' } },
  { id: 'rx_2_04', tier: 'second', text: { fr: "Vous cherchez un détail qui vous aurait échappé. Il n'y en a pas.", en: 'You look for a detail you might have missed. There is none.' } },
  { id: 'rx_2_05', tier: 'second', sense: 'sight', text: { fr: "Votre regard repasse sur les mêmes formes, dans le même ordre.", en: 'Your gaze retraces the same shapes, in the same order.' } },
  { id: 'rx_2_06', tier: 'second', sense: 'sound', text: { fr: "Vous tendez l'oreille. Les mêmes sons, à la même distance.", en: 'You listen again. The same sounds, at the same distance.' } },
  { id: 'rx_2_07', tier: 'second', sense: 'smell', text: { fr: "L'odeur est identique. Ni plus forte, ni plus proche.", en: 'The smell is identical. No stronger, no closer.' } },
  { id: 'rx_2_08', tier: 'second', sense: 'read', text: { fr: "Les mots n'ont pas bougé. Vous les relisez pour rien.", en: 'The words have not moved. You reread them for nothing.' } },

  // ── Third: the room starts pressing back ──
  { id: 'rx_3_01', tier: 'third', text: { fr: "Encore. Le même détail, la même absence de réponse.", en: 'Again. The same detail, the same lack of answer.' } },
  { id: 'rx_3_02', tier: 'third', text: { fr: "Vous insistez. L'objet, lui, n'a rien de plus à dire.", en: 'You insist. The thing has nothing more to say.' } },
  { id: 'rx_3_03', tier: 'third', text: { fr: "Rien de neuf — et le temps, lui, continue de passer.", en: 'Nothing new — and time keeps running.' } },
  { id: 'rx_3_04', tier: 'third', text: { fr: "Vous connaissez maintenant chaque défaut de sa surface. Cela ne vous avance pas.", en: 'You now know every flaw of its surface. It gets you nowhere.' } },
  { id: 'rx_3_05', tier: 'third', text: { fr: "Troisième passage. Toujours la même chose, sous le même angle.", en: 'Third pass. The same thing, from the same angle.' } },
  { id: 'rx_3_06', tier: 'third', text: { fr: "Vous espérez qu'un détail apparaisse. Il n'apparaît pas.", en: 'You hope a detail will surface. It does not.' } },
  { id: 'rx_3_07', tier: 'third', text: { fr: "Rien de plus. Ce que vous cherchez n'est pas là.", en: 'Nothing more. What you are looking for is not here.' } },
  { id: 'rx_3_08', tier: 'third', text: { fr: "L'attention que vous y mettez ne change pas ce qu'il y a à voir.", en: 'The attention you give it does not change what there is to see.' } },

  // ── Insistent: the game says it plainly ──
  { id: 'rx_i_01', tier: 'insistent', text: { fr: "Il n'y a plus rien à tirer d'ici. La réponse est ailleurs.", en: 'There is nothing left here. The answer is elsewhere.' } },
  { id: 'rx_i_02', tier: 'insistent', text: { fr: "Vous fixez la même chose depuis trop longtemps. Le vaisseau, lui, n'attend pas.", en: 'You have stared at this too long. The ship does not wait.' } },
  { id: 'rx_i_03', tier: 'insistent', text: { fr: "Rien. Toujours rien. Chaque seconde passée ici en est une de perdue.", en: 'Nothing. Still nothing. Every second here is a second lost.' } },
  { id: 'rx_i_04', tier: 'insistent', text: { fr: "Vous avez fait le tour. Continuer à regarder ne fera pas apparaître de porte.", en: 'You have seen it all. Staring will not conjure a door.' } },
  { id: 'rx_i_05', tier: 'insistent', text: { fr: "Assez. Ce qui doit être trouvé ne se trouve pas ici.", en: 'Enough. What must be found is not here.' } },
  { id: 'rx_i_06', tier: 'insistent', text: { fr: "Votre entêtement ne produit rien. Le silence, lui, s'épaissit.", en: 'Your stubbornness produces nothing. The silence thickens.' } },
  { id: 'rx_i_07', tier: 'insistent', text: { fr: "Toujours la même chose. Vous perdez un temps que vous n'avez pas.", en: 'The same thing again. You are losing time you do not have.' } },
  { id: 'rx_i_08', tier: 'insistent', text: { fr: "Rien de neuf. Peut-être faut-il agir plutôt que regarder.", en: 'Nothing new. Perhaps it is time to act rather than look.' } },
  { id: 'rx_i_09', tier: 'insistent', text: { fr: "Vous connaissez cet endroit par cœur, désormais. Ce n'est pas ce qui vous sortira d'ici.", en: 'You know this place by heart now. That is not what gets you out.' } },
];
