// ---------------------------------------------------------------------------
// src/content/templates/actionPhrases.ts — Verb text for action phrase (Layer 1)
// ---------------------------------------------------------------------------
// Maps VerbId → infinitive form ("Vous tentez de [inf]…")
//           → direct/conjugated form ("Vous [conj]…" on auto_success)
// ---------------------------------------------------------------------------

import type { VerbId } from '../../engine/verbs';
import type { Locale } from '../../i18n/types';

interface VerbForms {
  readonly infinitive: { readonly fr: string; readonly en: string };
  readonly direct:     { readonly fr: string; readonly en: string };
}

const VERB_FORMS: Readonly<Record<VerbId, VerbForms>> = {
  // FOR
  STRIKE:           { infinitive: { fr: 'frapper',                   en: 'strike' },            direct: { fr: 'frappez',                   en: 'strike' } },
  PUSH:             { infinitive: { fr: 'pousser',                   en: 'push' },              direct: { fr: 'poussez',                   en: 'push' } },
  PULL:             { infinitive: { fr: 'tirer',                     en: 'pull' },              direct: { fr: 'tirez',                     en: 'pull' } },
  LIFT:             { infinitive: { fr: 'soulever',                  en: 'lift' },              direct: { fr: 'soulevez',                  en: 'lift' } },
  KICK:             { infinitive: { fr: 'donner un coup de pied à',  en: 'kick' },              direct: { fr: 'donnez un coup de pied à',  en: 'kick' } },
  BREAK:            { infinitive: { fr: 'briser',                    en: 'break' },             direct: { fr: 'brisez',                    en: 'break' } },
  BEND:             { infinitive: { fr: 'tordre',                    en: 'bend' },              direct: { fr: 'tordez',                    en: 'bend' } },
  CUT:              { infinitive: { fr: 'couper',                    en: 'cut' },               direct: { fr: 'coupez',                    en: 'cut' } },
  FORCE_OPEN:       { infinitive: { fr: 'forcer',                    en: 'force open' },        direct: { fr: 'forcez',                    en: 'force open' } },
  BITE:             { infinitive: { fr: 'mordre',                    en: 'bite' },              direct: { fr: 'mordez',                    en: 'bite' } },
  SQUEEZE:          { infinitive: { fr: 'comprimer',                 en: 'squeeze' },           direct: { fr: 'comprimez',                 en: 'squeeze' } },
  IMPROVISE_WEAPON: { infinitive: { fr: 'improviser une arme avec',  en: 'improvise a weapon from' }, direct: { fr: 'improvisez une arme avec', en: 'improvise a weapon from' } },
  SACRIFICE:        { infinitive: { fr: 'sacrifier',                 en: 'sacrifice' },         direct: { fr: 'sacrifiez',                 en: 'sacrifice' } },
  SELF_HARM:        { infinitive: { fr: 'vous blesser',              en: 'harm yourself' },     direct: { fr: 'vous blessez',              en: 'harm yourself' } },
  // DEF
  BLOCK:            { infinitive: { fr: 'bloquer',                   en: 'block' },             direct: { fr: 'bloquez',                   en: 'block' } },
  IMPROVISE_SHIELD: { infinitive: { fr: 'improviser un bouclier avec', en: 'improvise a shield from' }, direct: { fr: 'improvisez un bouclier avec', en: 'improvise a shield from' } },
  BARRICADE:        { infinitive: { fr: 'barricader',                en: 'barricade' },         direct: { fr: 'barricadez',                en: 'barricade' } },
  // INT
  READ:             { infinitive: { fr: 'lire',                      en: 'read' },              direct: { fr: 'lisez',                     en: 'read' } },
  HACK:             { infinitive: { fr: 'pirater',                   en: 'hack' },              direct: { fr: 'piratez',                   en: 'hack' } },
  REPAIR:           { infinitive: { fr: 'réparer',                   en: 'repair' },            direct: { fr: 'réparez',                   en: 'repair' } },
  DISASSEMBLE:      { infinitive: { fr: 'démonter',                  en: 'disassemble' },       direct: { fr: 'démontez',                  en: 'disassemble' } },
  ASSEMBLE:         { infinitive: { fr: 'assembler',                 en: 'assemble' },          direct: { fr: 'assemblez',                 en: 'assemble' } },
  ACTIVATE:         { infinitive: { fr: 'activer',                   en: 'activate' },          direct: { fr: 'activez',                   en: 'activate' } },
  DEACTIVATE:       { infinitive: { fr: 'désactiver',                en: 'deactivate' },        direct: { fr: 'désactivez',                en: 'deactivate' } },
  REPROGRAM:        { infinitive: { fr: 'reprogrammer',              en: 'reprogram' },         direct: { fr: 'reprogrammez',              en: 'reprogram' } },
  LOCK:             { infinitive: { fr: 'verrouiller',               en: 'lock' },              direct: { fr: 'verrouillez',               en: 'lock' } },
  UNLOCK:           { infinitive: { fr: 'déverrouiller',             en: 'unlock' },            direct: { fr: 'déverrouillez',             en: 'unlock' } },
  WELD:             { infinitive: { fr: 'souder',                    en: 'weld' },              direct: { fr: 'soudez',                    en: 'weld' } },
  PLUG:             { infinitive: { fr: 'brancher',                  en: 'plug in' },           direct: { fr: 'branchez',                  en: 'plug in' } },
  OVERRIDE:         { infinitive: { fr: 'outrepasser',               en: 'override' },          direct: { fr: 'outrepassez',               en: 'override' } },
  SABOTAGE:         { infinitive: { fr: 'saboter',                   en: 'sabotage' },          direct: { fr: 'sabotez',                   en: 'sabotage' } },
  SET_TRAP:         { infinitive: { fr: 'poser un piège',            en: 'set a trap' },        direct: { fr: 'posez un piège',            en: 'set a trap' } },
  IMPROVISE_TOOL:   { infinitive: { fr: 'improviser un outil avec',  en: 'improvise a tool from' }, direct: { fr: 'improvisez un outil avec', en: 'improvise a tool from' } },
  WEDGE:            { infinitive: { fr: 'caler',                     en: 'wedge' },             direct: { fr: 'calez',                     en: 'wedge' } },
  IGNITE:           { infinitive: { fr: 'enflammer',                 en: 'ignite' },            direct: { fr: 'enflammez',                 en: 'ignite' } },
  FLOOD:            { infinitive: { fr: 'inonder',                   en: 'flood' },             direct: { fr: 'inondez',                   en: 'flood' } },
  ELECTRIFY:        { infinitive: { fr: 'électrifier',               en: 'electrify' },         direct: { fr: 'électrifiez',               en: 'electrify' } },
  TIE:              { infinitive: { fr: 'attacher',                  en: 'tie' },               direct: { fr: 'attachez',                  en: 'tie' } },
  COVER:            { infinitive: { fr: 'couvrir',                   en: 'cover' },             direct: { fr: 'couvrez',                   en: 'cover' } },
  // PER
  EXAMINE:          { infinitive: { fr: 'examiner',                  en: 'examine' },           direct: { fr: 'examinez',                  en: 'examine' } },
  LISTEN:           { infinitive: { fr: 'écouter',                   en: 'listen to' },         direct: { fr: 'écoutez',                   en: 'listen to' } },
  SMELL:            { infinitive: { fr: 'sentir',                    en: 'smell' },             direct: { fr: 'sentez',                    en: 'smell' } },
  SCAN:             { infinitive: { fr: 'scanner',                   en: 'scan' },              direct: { fr: 'scannez',                   en: 'scan' } },
  // CHA
  TALK:             { infinitive: { fr: 'parler à',                  en: 'talk to' },           direct: { fr: 'parlez à',                  en: 'talk to' } },
  PERSUADE:         { infinitive: { fr: 'persuader',                 en: 'persuade' },          direct: { fr: 'persuadez',                 en: 'persuade' } },
  INTIMIDATE:       { infinitive: { fr: 'intimider',                 en: 'intimidate' },        direct: { fr: 'intimidez',                 en: 'intimidate' } },
  DECEIVE:          { infinitive: { fr: 'tromper',                   en: 'deceive' },           direct: { fr: 'trompez',                   en: 'deceive' } },
  DISTRACT:         { infinitive: { fr: 'distraire',                 en: 'distract' },          direct: { fr: 'distrayez',                 en: 'distract' } },
  BARTER:           { infinitive: { fr: 'marchander avec',           en: 'barter with' },       direct: { fr: 'marchandez avec',           en: 'barter with' } },
  SEDUCE:           { infinitive: { fr: 'séduire',                   en: 'seduce' },            direct: { fr: 'séduisez',                  en: 'seduce' } },
  COMMAND:          { infinitive: { fr: 'commander',                 en: 'command' },           direct: { fr: 'commandez',                 en: 'command' } },
  CALM:             { infinitive: { fr: 'calmer',                    en: 'calm' },              direct: { fr: 'calmez',                    en: 'calm' } },
  PROVOKE:          { infinitive: { fr: 'provoquer',                 en: 'provoke' },           direct: { fr: 'provoquez',                 en: 'provoke' } },
  PLEAD:            { infinitive: { fr: 'implorer',                  en: 'plead with' },        direct: { fr: 'implorez',                  en: 'plead with' } },
  INTERROGATE:      { infinitive: { fr: 'interroger',                en: 'interrogate' },       direct: { fr: 'interrogez',                en: 'interrogate' } },
  SIGNAL:           { infinitive: { fr: 'signaler',                  en: 'signal' },            direct: { fr: 'signalez',                  en: 'signal' } },
  LURE:             { infinitive: { fr: 'attirer',                   en: 'lure' },              direct: { fr: 'attirez',                   en: 'lure' } },
  // AGI
  THROW:            { infinitive: { fr: 'lancer',                    en: 'throw' },             direct: { fr: 'lancez',                    en: 'throw' } },
  SHOOT:            { infinitive: { fr: 'tirer sur',                 en: 'shoot' },             direct: { fr: 'tirez sur',                 en: 'shoot' } },
  CLIMB:            { infinitive: { fr: 'escalader',                 en: 'climb' },             direct: { fr: 'escaladez',                 en: 'climb' } },
  JUMP:             { infinitive: { fr: 'sauter',                    en: 'jump' },              direct: { fr: 'sautez',                    en: 'jump' } },
  DODGE:            { infinitive: { fr: 'esquiver',                  en: 'dodge' },             direct: { fr: 'esquivez',                  en: 'dodge' } },
  SWIM:             { infinitive: { fr: 'nager',                     en: 'swim' },              direct: { fr: 'nagez',                     en: 'swim' } },
  RUN:              { infinitive: { fr: 'courir',                    en: 'run' },               direct: { fr: 'courez',                    en: 'run' } },
  HIDE:             { infinitive: { fr: 'vous cacher',               en: 'hide' },              direct: { fr: 'vous cachez',               en: 'hide' } },
  STACK:            { infinitive: { fr: 'empiler',                   en: 'stack' },             direct: { fr: 'empilez',                   en: 'stack' } },
  // Interaction / Auto
  USE:              { infinitive: { fr: 'utiliser',                  en: 'use' },               direct: { fr: 'utilisez',                  en: 'use' } },
  OPEN:             { infinitive: { fr: 'ouvrir',                    en: 'open' },              direct: { fr: 'ouvrez',                    en: 'open' } },
  CLOSE:            { infinitive: { fr: 'fermer',                    en: 'close' },             direct: { fr: 'fermez',                    en: 'close' } },
  TAKE:             { infinitive: { fr: 'ramasser',                  en: 'take' },              direct: { fr: 'ramassez',                  en: 'take' } },
  DROP:             { infinitive: { fr: 'poser',                     en: 'drop' },              direct: { fr: 'posez',                     en: 'drop' } },
  GIVE:             { infinitive: { fr: 'donner',                    en: 'give' },              direct: { fr: 'donnez',                    en: 'give' } },
  EQUIP:            { infinitive: { fr: 'équiper',                   en: 'equip' },             direct: { fr: 'équipez',                   en: 'equip' } },
  EAT:              { infinitive: { fr: 'consommer',                 en: 'eat' },               direct: { fr: 'consommez',                 en: 'eat' } },
  DRINK:            { infinitive: { fr: 'boire',                     en: 'drink' },             direct: { fr: 'buvez',                     en: 'drink' } },
  MOVE_TO:          { infinitive: { fr: 'vous diriger vers',         en: 'move to' },           direct: { fr: 'vous dirigez vers',         en: 'move to' } },
  WAIT:             { infinitive: { fr: 'attendre',                  en: 'wait' },              direct: { fr: 'attendez',                  en: 'wait' } },
  TOUCH:            { infinitive: { fr: 'toucher',                   en: 'touch' },             direct: { fr: 'touchez',                   en: 'touch' } },
};

/** Returns the infinitive form for "Vous tentez de [inf] [target]." */
export function getInfinitiveVerbText(verb: VerbId, locale: Locale): string {
  return VERB_FORMS[verb]?.infinitive[locale] ?? verb.toLowerCase();
}

/** Returns the direct/conjugated form for "Vous [direct] [target]." on auto_success. */
export function getDirectVerbText(verb: VerbId, locale: Locale): string {
  return VERB_FORMS[verb]?.direct[locale] ?? VERB_FORMS[verb]?.infinitive[locale] ?? verb.toLowerCase();
}
