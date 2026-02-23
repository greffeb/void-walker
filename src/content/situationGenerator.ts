// ---------------------------------------------------------------------------
// src/content/situationGenerator.ts — Random situation generator for game loop
// ---------------------------------------------------------------------------
// Generates random situations from existing content data (NPCs, items,
// environments). Each situation provides a scene context for the parser,
// a French description, and metadata for the feedback system.
// ---------------------------------------------------------------------------

import { t } from '@i18n/index';
import type { StringKey } from '@i18n/types';
import type {
  SceneContext,
  ResolvedTarget,
  NpcInstance,
  EnvironmentFeatureInstance,
  EnvironmentCondition,
} from '@engine/types';
import { ITEM_LIST, ITEM_DEFINITIONS, resolveItemProperties } from './items';
import { NPC_LIST, NPC_DEFINITIONS, resolveNPCProperties } from './npcs';
import {
  ENVIRONMENT_FEATURE_LIST,
  ENVIRONMENT_FEATURE_DEFINITIONS,
  resolveEnvironmentProperties,
} from './environments';
import { getEntityAliases } from './helpers';
import { BODY_PARTS } from '@engine/resolver';
import type { BodyPartDefinition } from '@engine/types';

// === SITUATION TYPES ===

/** The kind of situation generated */
export type SituationType =
  | 'exploration'
  | 'combat'
  | 'environmental'
  | 'discovery';

/** A generated situation for one turn of the game loop */
export interface Situation {
  /** Unique ID for this situation instance */
  readonly id: string;
  /** Type of situation */
  readonly type: SituationType;
  /** French text describing the situation */
  readonly description: string;
  /** The location name (French) */
  readonly locationName: string;
  /** Scene context for the parser */
  readonly scene: SceneContext;
  /** NPC definition ID if combat situation */
  readonly npcId: string | null;
  /** The main element the situation highlights */
  readonly focusElement: string;
  /** Short label for the situation type */
  readonly typeLabel: string;
}

// === LOCATION POOL ===

interface LocationTemplate {
  readonly id: string;
  readonly name: string;
  readonly conditions: readonly EnvironmentCondition[];
}

const LOCATIONS: readonly LocationTemplate[] = [
  { id: 'corridor_principal', name: 'Couloir principal', conditions: [] },
  { id: 'salle_des_machines', name: 'Salle des machines', conditions: [] },
  { id: 'infirmerie', name: 'Infirmerie', conditions: [] },
  { id: 'pont_de_commandement', name: 'Pont de commandement', conditions: [] },
  { id: 'soute_cargo', name: 'Soute cargo', conditions: ['dark'] },
  { id: 'laboratoire', name: 'Laboratoire', conditions: [] },
  { id: 'section_endommagee', name: 'Section endommagee', conditions: ['dark', 'time_pressure'] },
  { id: 'sas_principal', name: 'Sas principal', conditions: [] },
  { id: 'quartiers_equipage', name: "Quartiers de l'equipage", conditions: [] },
  { id: 'armurerie', name: 'Armurerie', conditions: [] },
  { id: 'reacteur', name: 'Salle du reacteur', conditions: ['time_pressure'] },
  { id: 'ventilation', name: 'Conduits de ventilation', conditions: ['dark'] },
];

// === HELPERS ===

/** Safe translation wrapper for dynamic keys */
function ts(key: string): string {
  return t(key as StringKey);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

let situationCounter = 0;

function nextId(): string {
  situationCounter += 1;
  return `sit_${Date.now()}_${situationCounter}`;
}

// === ENTITY RESOLUTION ===

function resolveItem(id: string, source: 'inventory' | 'location'): ResolvedTarget | null {
  const def = ITEM_DEFINITIONS[id];
  if (!def) return null;
  return {
    id,
    nameKey: def.nameKey,
    properties: resolveItemProperties(id),
    isVirtual: false,
    source,
    aliases: [
      ...getEntityAliases(def.aliasesKey, def.nameKey),
      ...id.replace(/_/g, ' ').split(' '),
    ],
  };
}

function resolveNPC(npcId: string): NpcInstance | null {
  const def = NPC_DEFINITIONS[npcId];
  if (!def) return null;
  return {
    id: npcId,
    definitionId: npcId,
    nameKey: def.nameKey,
    aliases: [
      ...getEntityAliases(def.aliasesKey, def.nameKey),
      ...npcId.replace(/_/g, ' ').split(' '),
    ],
    properties: resolveNPCProperties(npcId),
    hp: def.hp,
  };
}

function resolveEnvFeature(featureId: string): EnvironmentFeatureInstance | null {
  const def = ENVIRONMENT_FEATURE_DEFINITIONS[featureId];
  if (!def) return null;
  return {
    id: featureId,
    definitionId: featureId,
    nameKey: def.nameKey,
    aliases: [
      ...getEntityAliases(def.aliasesKey, def.nameKey),
      ...featureId.replace(/_/g, ' ').split(' '),
    ],
    properties: resolveEnvironmentProperties(featureId),
  };
}

function resolveBodyParts(): BodyPartDefinition[] {
  return [...BODY_PARTS.entries()].map(([_id, def]) => ({
    id: def.id,
    nameKey: def.nameKey,
    aliases: getEntityAliases(
      `${def.nameKey}.aliases` as StringKey,
      def.nameKey as StringKey,
    ),
    baseProperties: [...def.baseProperties],
  }));
}

// === SITUATION GENERATORS ===

function generateExploration(inventoryIds: readonly string[]): Situation {
  const location = pick(LOCATIONS);
  const features = pickN(ENVIRONMENT_FEATURE_LIST, 2);
  const locationItems = pickN(
    ITEM_LIST.filter((i) => !inventoryIds.includes(i.id)),
    2,
  );
  const focusFeature = features[0];
  const focusName = focusFeature ? ts(focusFeature.nameKey) : 'un objet';

  const descriptions = [
    `${location.name}. ${focusName} attire votre attention. L'air est charge d'une tension palpable.`,
    `Vous avancez dans ${location.name.toLowerCase()}. ${focusName} se dresse devant vous, silencieux.`,
    `${location.name} — le silence n'est brise que par le bourdonnement des systemes. ${focusName} semble fonctionnel.`,
    `L'eclairage faiblit dans ${location.name.toLowerCase()}. ${focusName} projette une lueur intermittente.`,
  ];

  const inventoryResolved = inventoryIds
    .map((id) => resolveItem(id, 'inventory'))
    .filter((r): r is ResolvedTarget => r !== null);

  const scene: SceneContext = {
    inventory: inventoryResolved,
    locationItems: locationItems
      .map((item) => resolveItem(item.id, 'location'))
      .filter((r): r is ResolvedTarget => r !== null),
    npcs: [],
    environmentFeatures: features
      .map((f) => resolveEnvFeature(f.id))
      .filter((r): r is EnvironmentFeatureInstance => r !== null),
    connectedLocations: [
      { id: 'corridor_a', aliases: ['corridor', 'couloir'] },
    ],
    suggestions: [],
    environmentConditions: [...location.conditions],
    bodyParts: resolveBodyParts(),
  };

  return {
    id: nextId(),
    type: 'exploration',
    description: pick(descriptions),
    locationName: location.name,
    scene,
    npcId: null,
    focusElement: focusFeature?.id ?? 'unknown',
    typeLabel: 'EXPLORATION',
  };
}

function generateCombat(inventoryIds: readonly string[]): Situation {
  const location = pick(LOCATIONS);
  const hostileNpcs = NPC_LIST.filter((n) => {
    const def = NPC_DEFINITIONS[n.id];
    return def && (def.extra_props.includes('hostile') || def.aggressionPattern === 'aggressive');
  });
  const npcDef = pick(hostileNpcs.length > 0 ? hostileNpcs : NPC_LIST);
  const npcName = ts(npcDef.nameKey);

  const descriptions = [
    `${location.name}. Un ${npcName} surgit de l'ombre ! Il bloque votre passage.`,
    `ALERTE — ${npcName} detecte dans ${location.name.toLowerCase()}. Il vous a repere.`,
    `Le sol tremble. Un ${npcName} emerge dans ${location.name.toLowerCase()}, grondant de rage.`,
    `Vous entrez dans ${location.name.toLowerCase()} et tombez nez a nez avec un ${npcName}. Ses yeux brillent.`,
  ];

  const inventoryResolved = inventoryIds
    .map((id) => resolveItem(id, 'inventory'))
    .filter((r): r is ResolvedTarget => r !== null);

  const npcInstance = resolveNPC(npcDef.id);
  const features = pickN(ENVIRONMENT_FEATURE_LIST, 1);

  const scene: SceneContext = {
    inventory: inventoryResolved,
    locationItems: [],
    npcs: npcInstance ? [npcInstance] : [],
    environmentFeatures: features
      .map((f) => resolveEnvFeature(f.id))
      .filter((r): r is EnvironmentFeatureInstance => r !== null),
    connectedLocations: [
      { id: 'corridor_a', aliases: ['corridor', 'couloir'] },
    ],
    suggestions: [],
    environmentConditions: [...location.conditions],
    bodyParts: resolveBodyParts(),
  };

  return {
    id: nextId(),
    type: 'combat',
    description: pick(descriptions),
    locationName: location.name,
    scene,
    npcId: npcDef.id,
    focusElement: npcDef.id,
    typeLabel: 'COMBAT',
  };
}

function generateEnvironmental(inventoryIds: readonly string[]): Situation {
  const location = pick(LOCATIONS);

  const hazards = [
    { condition: 'dark' as EnvironmentCondition, label: 'Obscurite totale', desc: `${location.name} — les lumieres sont mortes. L'obscurite est totale. Vous devez agir a l'aveugle.` },
    { condition: 'zero_g' as EnvironmentCondition, label: 'Gravite zero', desc: `${location.name} — la gravite artificielle est en panne. Tout flotte autour de vous, y compris les debris.` },
    { condition: 'time_pressure' as EnvironmentCondition, label: 'Urgence', desc: `${location.name} — une alarme retentit. Vous avez peu de temps avant que la section ne soit scellée.` },
  ];

  const hazard = pick(hazards);
  const features = pickN(ENVIRONMENT_FEATURE_LIST, 2);

  const inventoryResolved = inventoryIds
    .map((id) => resolveItem(id, 'inventory'))
    .filter((r): r is ResolvedTarget => r !== null);

  const scene: SceneContext = {
    inventory: inventoryResolved,
    locationItems: [],
    npcs: [],
    environmentFeatures: features
      .map((f) => resolveEnvFeature(f.id))
      .filter((r): r is EnvironmentFeatureInstance => r !== null),
    connectedLocations: [
      { id: 'corridor_a', aliases: ['corridor', 'couloir'] },
    ],
    suggestions: [],
    environmentConditions: [hazard.condition, ...location.conditions.filter((c) => c !== hazard.condition)],
    bodyParts: resolveBodyParts(),
  };

  return {
    id: nextId(),
    type: 'environmental',
    description: hazard.desc,
    locationName: location.name,
    scene,
    npcId: null,
    focusElement: hazard.condition,
    typeLabel: hazard.label.toUpperCase(),
  };
}

function generateDiscovery(inventoryIds: readonly string[]): Situation {
  const location = pick(LOCATIONS);
  const availableItems = ITEM_LIST.filter((i) => !inventoryIds.includes(i.id));
  const item = pick(availableItems.length > 0 ? availableItems : ITEM_LIST);
  const itemName = ts(item.nameKey);

  const descriptions = [
    `${location.name}. Vous repérez ${itemName} au sol, a moitie dissimule sous des debris.`,
    `Dans ${location.name.toLowerCase()}, quelque chose brille — ${itemName} est la, abandonné.`,
    `${location.name} — un casier entrouvert revele ${itemName}. Qu'en faites-vous ?`,
    `Vous fouillez ${location.name.toLowerCase()} et decouvrez ${itemName} dans un compartiment.`,
  ];

  const inventoryResolved = inventoryIds
    .map((id) => resolveItem(id, 'inventory'))
    .filter((r): r is ResolvedTarget => r !== null);

  const itemTarget = resolveItem(item.id, 'location');
  const features = pickN(ENVIRONMENT_FEATURE_LIST, 1);

  const scene: SceneContext = {
    inventory: inventoryResolved,
    locationItems: itemTarget ? [itemTarget] : [],
    npcs: [],
    environmentFeatures: features
      .map((f) => resolveEnvFeature(f.id))
      .filter((r): r is EnvironmentFeatureInstance => r !== null),
    connectedLocations: [
      { id: 'corridor_a', aliases: ['corridor', 'couloir'] },
    ],
    suggestions: [],
    environmentConditions: [...location.conditions],
    bodyParts: resolveBodyParts(),
  };

  return {
    id: nextId(),
    type: 'discovery',
    description: pick(descriptions),
    locationName: location.name,
    scene,
    npcId: null,
    focusElement: item.id,
    typeLabel: 'DECOUVERTE',
  };
}

// === PUBLIC API ===

/**
 * Generate a random situation for the game loop.
 * Combat has a ~30% chance, other types split the remaining 70%.
 */
export function generateSituation(inventoryIds: readonly string[]): Situation {
  const roll = Math.random();
  if (roll < 0.30) return generateCombat(inventoryIds);
  if (roll < 0.55) return generateExploration(inventoryIds);
  if (roll < 0.78) return generateDiscovery(inventoryIds);
  return generateEnvironmental(inventoryIds);
}

/**
 * Generate a specific type of situation (for testing or forced encounters).
 */
export function generateSituationOfType(
  type: SituationType,
  inventoryIds: readonly string[],
): Situation {
  switch (type) {
    case 'combat': return generateCombat(inventoryIds);
    case 'exploration': return generateExploration(inventoryIds);
    case 'discovery': return generateDiscovery(inventoryIds);
    case 'environmental': return generateEnvironmental(inventoryIds);
  }
}
