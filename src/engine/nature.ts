// ---------------------------------------------------------------------------
// src/engine/nature.ts — What kind of thing a target is, and what it could bear
// ---------------------------------------------------------------------------
// Decision F. An action is graded on the *distance* between what the verb needs
// and what the target could conceivably have:
//
//   compatible — the target already satisfies the verb's clause
//   unsuited   — the missing properties are conceivable here (+3 DC each)
//   absurd     — the missing properties are inconceivable here (needs a critical)
//
// "Conceivable" is decided by two bounded tables, never by per-case exceptions:
// a target's NATURE (5 values), and whether that nature can bear a property
// FAMILY (7 values). A target that already exhibits a property of the required
// family always counts as conceivable, whatever its nature — that is what
// separates an unwilling android (has `sentient`, seduction is merely unsuited)
// from a door (has nothing of the kind, seduction is absurd).
// ---------------------------------------------------------------------------

import type { PropertyId } from './properties';
import { PROPERTY_IDS } from './properties';

// === NATURE ===

/** The kind of thing a target fundamentally is. */
export type Nature = 'inert' | 'machine' | 'organic' | 'data' | 'space';

export const NATURES: readonly Nature[] = ['inert', 'machine', 'organic', 'data', 'space'] as const;

// === PROPERTY FAMILY ===

/**
 * What kind of affordance a property expresses.
 * Grouped by what a thing must *be* to bear it, not by where it was declared.
 */
export type PropertyFamily =
  | 'form'        // shape, size, integrity
  | 'matter'      // what it is made of
  | 'mechanism'   // moving, opening, locking parts
  | 'circuitry'   // electronics, software, information
  | 'sustenance'  // can enter a body
  | 'being'       // is, or was, an agent
  | 'place';      // is a volume you stand in

export const PROPERTY_FAMILIES: readonly PropertyFamily[] = [
  'form', 'matter', 'mechanism', 'circuitry', 'sustenance', 'being', 'place',
] as const;

/** Every property belongs to exactly one family. */
export const PROPERTY_FAMILY: Readonly<Record<PropertyId, PropertyFamily>> = {
  // form
  tangible: 'form', visible: 'form', small: 'form', liftable: 'form', holdable: 'form',
  heavy: 'form', rigid: 'form', flexible: 'form', soft: 'form', fragile: 'form',
  breakable: 'form', malleable: 'form', flat: 'form', sharp: 'form', blunt: 'form',
  pointed: 'form', hollow: 'form', transparent: 'form', reflective: 'form',
  cuttable: 'form', large: 'form', bladed: 'form',
  // An inscription is a surface, not a circuit: a crate can be read.
  readable: 'form',

  // matter
  metallic: 'matter', organic: 'matter', synthetic: 'matter', conductive: 'matter',
  flammable: 'matter', corrosive: 'matter', toxic: 'matter', radioactive: 'matter',
  liquid: 'matter', sticky: 'matter',

  // mechanism
  sealed: 'mechanism', mechanical: 'mechanism',
  openable: 'mechanism', lockable: 'mechanism', component: 'mechanism',
  climbable: 'mechanism', attached: 'mechanism', port: 'mechanism',
  coverable: 'mechanism', easily_repairable: 'mechanism', equippable: 'mechanism',
  usable: 'mechanism', ranged: 'mechanism',

  // circuitry
  electronic: 'circuitry', programmable: 'circuitry',
  data_storage: 'circuitry', power_source: 'circuitry', light_source: 'circuitry',
  heat_source: 'circuitry',
  // Access control belongs with what enforces it, so hacking stays conceivable
  // on anything that can carry a lockdown — a door as much as a datapad.
  secured: 'circuitry',

  // sustenance
  edible: 'sustenance', drinkable: 'sustenance', injectable: 'sustenance',
  organic_compatible: 'sustenance', liquid_source: 'sustenance',

  // being
  sentient: 'being', robotic: 'being',

  // place
  dark: 'place', lit: 'place', pressurized: 'place', depressurized: 'place',
  flooded: 'place', on_fire: 'place', zero_g: 'place', cramped: 'place',
  open_space: 'place',
};

// === NATURE DETECTION ===

/**
 * Ordered signatures. First match wins, so the list reads as a priority:
 * a volume before an object, a body before a device, a device before a file.
 */
const NATURE_SIGNATURES: readonly { readonly nature: Nature; readonly markers: readonly PropertyId[] }[] = [
  { nature: 'space',   markers: ['open_space', 'cramped'] },
  { nature: 'organic', markers: ['organic', 'edible', 'drinkable'] },
  { nature: 'machine', markers: ['electronic', 'mechanical', 'robotic', 'programmable', 'power_source'] },
  { nature: 'data',    markers: ['data_storage'] },
];

/** Classify a target from the properties it carries. Defaults to `inert`. */
export function natureOf(props: readonly PropertyId[]): Nature {
  const set = new Set(props);
  for (const signature of NATURE_SIGNATURES) {
    if (signature.markers.some(marker => set.has(marker))) return signature.nature;
  }
  return 'inert';
}

// === PLAUSIBILITY MATRIX (5 natures × 7 families) ===

/**
 * Can a target of this nature plausibly acquire a property of this family?
 * Read as "is it even conceivable", not "is it currently true".
 */
export const NATURE_BEARS_FAMILY: Readonly<Record<Nature, Readonly<Record<PropertyFamily, boolean>>>> = {
  inert:   { form: true,  matter: true,  mechanism: true,  circuitry: false, sustenance: false, being: false, place: false },
  machine: { form: true,  matter: true,  mechanism: true,  circuitry: true,  sustenance: false, being: false, place: false },
  organic: { form: true,  matter: true,  mechanism: false, circuitry: false, sustenance: true,  being: true,  place: false },
  data:    { form: false, matter: false, mechanism: false, circuitry: true,  sustenance: false, being: false, place: false },
  space:   { form: true,  matter: true,  mechanism: true,  circuitry: false, sustenance: false, being: false, place: true  },
};

/**
 * Is a property conceivable on this target?
 * True when its nature can bear the family, or when the target already exhibits
 * another property of that same family.
 */
export function canBear(
  props: readonly PropertyId[],
  property: PropertyId,
  nature: Nature = natureOf(props),
): boolean {
  const family = PROPERTY_FAMILY[property];
  if (NATURE_BEARS_FAMILY[nature][family]) return true;
  return props.some(p => PROPERTY_FAMILY[p] === family);
}

/** Every property must be classified — guards against a new property slipping through. */
export function findUnclassifiedProperties(): readonly PropertyId[] {
  return PROPERTY_IDS.filter(id => PROPERTY_FAMILY[id] === undefined);
}
