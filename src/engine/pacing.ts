// ---------------------------------------------------------------------------
// src/engine/pacing.ts — Phase 6: Scenario Assembly & Pacing Algorithm
// ---------------------------------------------------------------------------
// assembleScenario(), isModuleCompatible(), buildLocationGraph(),
// validateAssembledScenario(), selectSkin(), assignTensionValues()
// ---------------------------------------------------------------------------

import type { RngFn, StoryBeat } from './types';
import type {
  CoreSkeleton,
  CoreNodeId,
  ScenarioModule,
  SessionLength,
  SegmentId,
  PlacedModule,
  NarrativeSkin,
  LocationNode,
  LocationEdge,
  LocationGraph,
  AssembledScenario,
  ValidationResult,
  ModuleLocationDef,
  LocaleString,
  MicroModule,
} from './scenario';
import {
  fillMicroModuleSlots,
  buildMicroModuleNodes,
} from './microModules';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

/** Module count ranges per session length */
const MODULE_COUNTS: Record<SessionLength, { min: number; max: number }> = {
  quick: { min: 0, max: 0 },
  standard: { min: 3, max: 5 },
  extended: { min: 8, max: 12 },
};

/** Weights for distributing modules across segments */
const SEGMENT_WEIGHTS: Record<SegmentId, number> = {
  'start-unlock': 0.20,
  'unlock-reveal': 0.35,
  'reveal-escalation': 0.25,
  'escalation-boss': 0.20,
};

/** Tension range per skeleton segment */
const SEGMENT_TENSION_RANGES: Record<SegmentId, { min: number; max: number }> = {
  'start-unlock': { min: 2, max: 5 },
  'unlock-reveal': { min: 4, max: 7 },
  'reveal-escalation': { min: 6, max: 8 },
  'escalation-boss': { min: 7, max: 9 },
};

/** Default tension for each core node */
const CORE_NODE_TENSIONS: Record<CoreNodeId, number> = {
  start: 2,
  unlock: 4,
  reveal: 6,
  escalation: 8,
  boss: 10,
  resolution: 3,
};

/** Segments and their start/end core nodes */
const SEGMENTS: Array<{ id: SegmentId; startNode: CoreNodeId; endNode: CoreNodeId }> = [
  { id: 'start-unlock', startNode: 'start', endNode: 'unlock' },
  { id: 'unlock-reveal', startNode: 'unlock', endNode: 'reveal' },
  { id: 'reveal-escalation', startNode: 'reveal', endNode: 'escalation' },
  { id: 'escalation-boss', startNode: 'escalation', endNode: 'boss' },
];

// ---------------------------------------------------------------------------
// RANDOM UTILITIES
// ---------------------------------------------------------------------------

/** Pick a random element from an array using the given RNG */
function rngPick<T>(rng: RngFn, arr: readonly T[]): T {
  // Non-null assertion: callers must ensure arr is non-empty
  return arr[Math.floor(rng() * arr.length)] as T;
}

/** Generate an integer in [min, max] inclusive */
function rngIntBetween(rng: RngFn, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick a weighted segment using the segment weight table */
function pickWeightedSegment(rng: RngFn): SegmentId {
  const r = rng();
  let cumulative = 0;
  for (const [id, weight] of Object.entries(SEGMENT_WEIGHTS) as [SegmentId, number][]) {
    cumulative += weight;
    if (r < cumulative) return id;
  }
  return 'unlock-reveal'; // fallback
}

// ---------------------------------------------------------------------------
// SKIN SELECTION
// ---------------------------------------------------------------------------

/** Select a narrative skin based on assigned tension */
export function selectSkin(module: ScenarioModule, assignedTension: number): NarrativeSkin {
  if (assignedTension <= 4) return module.skins[0]; // low
  if (assignedTension <= 7) return module.skins[1]; // mid
  return module.skins[2];                           // high
}

// ---------------------------------------------------------------------------
// COMPATIBILITY CHECK
// ---------------------------------------------------------------------------

/** Check if a module is compatible with a given skeleton */
export function isModuleCompatible(module: ScenarioModule, skeleton: CoreSkeleton): boolean {
  const compat = module.compatibility;

  // Layer 1: compatibility filter
  if (!compat.universal) {
    if (!compat.skeletons?.includes(skeleton.id)) return false;
  }

  // Layer 2: every location role the module needs must exist in the skeleton's theme
  const allRoles = [
    ...module.locations.map(l => l.role),
    ...module.sideRooms.map(l => l.role),
  ];
  for (const role of allRoles) {
    if (!skeleton.theme.supportedRoles.includes(role)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// TENSION VALUE ASSIGNMENT
// ---------------------------------------------------------------------------

/** Assign tension values to each placed module based on segment position */
export function assignTensionValues(
  placed: readonly PlacedModule[],
  rng: RngFn,
): readonly PlacedModule[] {
  return placed.map(pm => {
    const range = SEGMENT_TENSION_RANGES[pm.segment];
    const tension = rngIntBetween(rng, range.min, range.max);
    return { ...pm, assignedTension: tension, activeSkin: selectSkin(pm.module, tension) };
  });
}

// ---------------------------------------------------------------------------
// LOCATION NAME RESOLUTION
// ---------------------------------------------------------------------------

/** Resolve an abstract location role to a theme-specific name */
export function resolveLocationName(
  role: string,
  skeleton: CoreSkeleton,
  rng: RngFn,
  usedNames: Set<string>,
): LocaleString {
  const pool = skeleton.theme.locationNames[role];
  if (!pool || pool.length === 0) {
    return { fr: `Zone inconnue (${role})`, en: '' };
  }

  // Try to avoid reusing names (shuffle through pool)
  const available = pool.filter(n => !usedNames.has(n.fr));
  const names = available.length > 0 ? available : pool;
  const chosen = rngPick(rng, names);
  usedNames.add(chosen.fr);
  return chosen;
}

// ---------------------------------------------------------------------------
// BEAT FROM SEGMENT
// ---------------------------------------------------------------------------

/** Get the story beat for a module placed in a given segment */
function beatFromSegment(segment: SegmentId): StoryBeat {
  switch (segment) {
    case 'start-unlock': return 'rising';
    case 'unlock-reveal': return 'midpoint';
    case 'reveal-escalation': return 'escalation';
    case 'escalation-boss': return 'climax';
  }
}

// ---------------------------------------------------------------------------
// GRAPH CONSTRUCTION
// ---------------------------------------------------------------------------

/** Build a LocationNode from a skeleton core node */
function createNodeFromSkeleton(
  skeleton: CoreSkeleton,
  nodeId: CoreNodeId,
  rng: RngFn,
  usedNames: Set<string>,
): LocationNode {
  const nodeDef = skeleton.nodes.find(n => n.id === nodeId)!;
  const locationDef = skeleton.nodeLocations[nodeId];
  const name = resolveLocationName(locationDef.locationRole, skeleton, rng, usedNames);

  return {
    id: nodeId,
    nameKey: name,
    role: locationDef.locationRole,
    beat: nodeDef.beat,
    tension: CORE_NODE_TENSIONS[nodeId],
    isCoreNode: true,
    coreNodeId: nodeId,
    onCriticalPath: true,
    items: locationDef.items,
    npcs: locationDef.npcs ?? [],
    features: locationDef.features,
    atmosphere: locationDef.atmosphere ?? 'pressurized',
  };
}

/** Build a LocationNode from a module location definition */
function createNodeFromModule(
  loc: ModuleLocationDef,
  pm: PlacedModule,
  moduleIndex: number,
  skeleton: CoreSkeleton,
  rng: RngFn,
  usedNames: Set<string>,
): LocationNode {
  const name = resolveLocationName(loc.role, skeleton, rng, usedNames);
  const beat = beatFromSegment(pm.segment);

  return {
    id: `${pm.module.id}_${loc.id}_${pm.index}`,
    nameKey: name,
    role: loc.role,
    beat,
    tension: pm.assignedTension,
    isCoreNode: false,
    moduleId: pm.module.id,
    onCriticalPath: loc.onCriticalPath,
    items: loc.items ?? [],
    npcs: loc.npcs ?? [],
    features: loc.features,
    obstacle: loc.onCriticalPath ? pm.module.obstacle : undefined,
    atmosphere: loc.atmosphere ?? 'pressurized',
    activeSkin: pm.activeSkin,
  };
}

/** Build the location graph from skeleton + placed modules */
export function buildLocationGraph(
  skeleton: CoreSkeleton,
  modules: readonly PlacedModule[],
  rng: RngFn,
): LocationGraph {
  const nodes: LocationNode[] = [];
  const edges: LocationEdge[] = [];
  const usedNames = new Set<string>();

  // Process each of the 4 segments
  for (const segment of SEGMENTS) {
    // Add the segment's start core node (if not already added by previous segment's end)
    if (!nodes.some(n => n.id === segment.startNode)) {
      nodes.push(createNodeFromSkeleton(skeleton, segment.startNode, rng, usedNames));
    }

    const segmentModules = modules
      .filter(pm => pm.segment === segment.id)
      .sort((a, b) => a.index - b.index);

    let prevNodeId: string = segment.startNode;

    for (const pm of segmentModules) {
      let firstCriticalPathId: string | null = null;

      // Add critical path locations
      for (const loc of pm.module.locations.filter(l => l.onCriticalPath)) {
        const node = createNodeFromModule(loc, pm, pm.index, skeleton, rng, usedNames);
        nodes.push(node);
        // Bidirectional edge to previous
        edges.push({ from: prevNodeId, to: node.id, bidirectional: true });
        edges.push({ from: node.id, to: prevNodeId, bidirectional: true });
        if (firstCriticalPathId === null) firstCriticalPathId = node.id;
        prevNodeId = node.id;
      }

      // Add side rooms (connected to first critical path node, or module's first location)
      const anchorId = firstCriticalPathId ?? prevNodeId;
      for (const side of pm.module.sideRooms) {
        const sideNode = createNodeFromModule(side, pm, pm.index, skeleton, rng, usedNames);
        nodes.push(sideNode);
        edges.push({ from: anchorId, to: sideNode.id, bidirectional: true });
        edges.push({ from: sideNode.id, to: anchorId, bidirectional: true });
      }

      // Also add non-critical-path locations in module (if any)
      for (const loc of pm.module.locations.filter(l => !l.onCriticalPath)) {
        const node = createNodeFromModule(loc, pm, pm.index, skeleton, rng, usedNames);
        nodes.push(node);
        edges.push({ from: anchorId, to: node.id, bidirectional: true });
        edges.push({ from: node.id, to: anchorId, bidirectional: true });
      }
    }

    // Ensure end node exists and is connected
    if (!nodes.some(n => n.id === segment.endNode)) {
      nodes.push(createNodeFromSkeleton(skeleton, segment.endNode, rng, usedNames));
    }
    // Connect last module/node to segment end (if not already there)
    if (prevNodeId !== segment.endNode && !edges.some(e => e.from === prevNodeId && e.to === segment.endNode)) {
      edges.push({ from: prevNodeId, to: segment.endNode, bidirectional: true });
      edges.push({ from: segment.endNode, to: prevNodeId, bidirectional: true });
    }
  }

  // Add the resolution node (final 6th node)
  if (!nodes.some(n => n.id === 'resolution')) {
    nodes.push(createNodeFromSkeleton(skeleton, 'resolution', rng, usedNames));
  }
  // Connect boss → resolution
  if (!edges.some(e => e.from === 'boss' && e.to === 'resolution')) {
    edges.push({ from: 'boss', to: 'resolution', bidirectional: true });
    edges.push({ from: 'resolution', to: 'boss', bidirectional: true });
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// GRAPH VALIDATION
// ---------------------------------------------------------------------------

/** BFS from a start node — returns all reachable node IDs */
function bfs(graph: LocationGraph, startId: string): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const neighbors = graph.edges
      .filter(e => e.from === current)
      .map(e => e.to);
    queue.push(...neighbors);
  }
  return visited;
}

/** Check if a path exists from one node to another */
function pathExists(graph: LocationGraph, fromId: string, toId: string): boolean {
  return bfs(graph, fromId).has(toId);
}

/** Check if a node is reachable before another (using BFS that stops at barrier) */
function isReachableBefore(graph: LocationGraph, targetId: string, barrierId: string): boolean {
  // BFS from start, but we must reach targetId without going through barrierId
  const visited = new Set<string>();
  const queue: string[] = ['start'];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    if (current === barrierId) continue; // stop at barrier
    visited.add(current);
    if (current === targetId) return true;
    const neighbors = graph.edges
      .filter(e => e.from === current)
      .map(e => e.to);
    queue.push(...neighbors);
  }
  return false;
}

/** Get tension values for all nodes in order */
function getNodeTensions(graph: LocationGraph): number[] {
  // Only check the 6 core nodes in their canonical order.
  // Module nodes within a segment may vary freely within the segment's range —
  // validating them in BFS order produces false positives when two modules in
  // the same segment happen to be assigned in descending tension order.
  const CORE_ORDER: CoreNodeId[] = ['start', 'unlock', 'reveal', 'escalation', 'boss', 'resolution'];
  return CORE_ORDER
    .map(id => graph.nodes.find(n => n.coreNodeId === id))
    .filter((n): n is LocationNode => n !== undefined)
    .map(n => n.tension);
}

/** Validate that the tension curve is monotonically non-decreasing to climax */
function validateTensionCurve(tensions: number[]): { issues: string[] } {
  const issues: string[] = [];
  if (tensions.length === 0) return { issues };

  const maxTension = Math.max(...tensions);
  if (maxTension < 9) {
    issues.push(`Peak tension ${maxTension} is below required minimum of 9`);
  }

  // Check for drops > 2 in tension (excluding the resolution drop)
  for (let i = 1; i < tensions.length - 1; i++) {
    const drop = (tensions[i - 1] ?? 0) - (tensions[i] ?? 0);
    if (drop > 2) {
      issues.push(`Tension drop of ${drop} between positions ${i - 1} and ${i} (max allowed: 2)`);
    }
  }

  return { issues };
}

/** Validate a fully assembled scenario (6 checks) */
export function validateAssembledScenario(
  graph: LocationGraph,
  skeleton: CoreSkeleton,
): ValidationResult {
  const issues: string[] = [];

  // 1. No orphan nodes (every node reachable from start)
  const reachable = bfs(graph, 'start');
  const orphans = graph.nodes.filter(n => !reachable.has(n.id));
  if (orphans.length > 0) {
    issues.push(`Orphan nodes: ${orphans.map(n => n.id).join(', ')}`);
  }

  // 2. Victory reachable: path exists from start to boss
  if (!pathExists(graph, 'start', 'boss')) {
    issues.push('No path from start to boss');
  }

  // 3. Gate item reachable before gate (unlock node)
  const gateItemLocation = skeleton.gateItemLocation;
  if (!isReachableBefore(graph, gateItemLocation, 'unlock')) {
    issues.push(`Gate item location '${gateItemLocation}' not reachable before unlock node`);
  }

  // 4. Tension curve valid
  const tensions = getNodeTensions(graph);
  const curveResult = validateTensionCurve(tensions);
  issues.push(...curveResult.issues);

  // 5. Every obstacle has 3+ resolution paths
  for (const node of graph.nodes) {
    if (node.obstacle && node.obstacle.paths.length < 3) {
      issues.push(`Node ${node.id}: obstacle has only ${node.obstacle.paths.length} paths (need 3+)`);
    }
  }

  // 6. All edges in critical path are bidirectional
  const criticalNodes = graph.nodes.filter(n => n.onCriticalPath).map(n => n.id);
  for (const nodeId of criticalNodes) {
    const outgoing = graph.edges.filter(e => e.from === nodeId && criticalNodes.includes(e.to));
    for (const edge of outgoing) {
      const hasReturn = graph.edges.some(e => e.from === edge.to && e.to === nodeId);
      if (!hasReturn) {
        issues.push(`One-way edge: ${edge.from} → ${edge.to} (backtracking broken)`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// MAIN ASSEMBLY
// ---------------------------------------------------------------------------

/** Assemble a full scenario from skeleton + session length */
export function assembleScenario(
  skeleton: CoreSkeleton,
  sessionLength: SessionLength,
  allModules: readonly ScenarioModule[],
  rng: RngFn,
  allMicroModules: readonly MicroModule[] = [],
): AssembledScenario {
  // 1. Determine module count
  const countRange = MODULE_COUNTS[sessionLength];
  const moduleCount = rngIntBetween(rng, countRange.min, countRange.max);

  // 2. Get compatible module pool
  const pool = allModules.filter(m => isModuleCompatible(m, skeleton));

  // 3. Distribute modules across segments (weighted)
  const placed: PlacedModule[] = [];
  let attemptCount = 0;
  const maxAttempts = moduleCount * 10;

  while (placed.length < moduleCount && attemptCount < maxAttempts) {
    attemptCount++;
    const segment = pickWeightedSegment(rng);
    const candidates = pool.filter(m =>
      m.validSegments.includes(segment)
      && !placed.some(p => p.module.id === m.id)
    );
    if (candidates.length === 0) continue;

    const module = rngPick(rng, candidates);
    placed.push({
      module,
      segment,
      index: placed.filter(p => p.segment === segment).length,
      assignedTension: 5, // placeholder, reassigned in step 4
      activeSkin: module.skins[1], // placeholder
    });
  }

  // 4. Assign tension values and select skins
  const placedWithTension = assignTensionValues(placed, rng) as PlacedModule[];

  // 5. Build location graph
  const graph = buildLocationGraph(skeleton, placedWithTension, rng);

  // 6. Place micro-modules into slots across the graph
  const placedMicroModules = fillMicroModuleSlots(
    graph, skeleton, allMicroModules, sessionLength, rng,
  );

  // 7. Build micro-module graph nodes and edges
  const usedNames = new Set<string>(graph.nodes.map(n => n.nameKey.fr));
  const mmGraph = buildMicroModuleNodes(
    placedMicroModules, skeleton, graph.nodes, rng, usedNames,
  );

  // 8. Merge micro-module nodes/edges into the main graph
  const mergedGraph: LocationGraph = {
    nodes: [...graph.nodes, ...mmGraph.nodes],
    edges: [...graph.edges, ...mmGraph.edges],
  };

  return {
    skeleton,
    modules: placedWithTension,
    graph: mergedGraph,
    sessionLength,
    placedMicroModules,
  };
}
