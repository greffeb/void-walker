// ---------------------------------------------------------------------------
// src/ui/utils/mapLayout.ts — Spatial map layout engine
// ---------------------------------------------------------------------------
// Pure layout algorithm extracted from the PoC.  Converts a location graph
// into grid positions + orthogonal connectors ready for Canvas rendering.
// Generates once per game start; the result is cached in the Zustand store.
// ---------------------------------------------------------------------------

import type { LocationGraph } from '@engine/scenario';

// ---------------------------------------------------------------------------
// PUBLIC TYPES
// ---------------------------------------------------------------------------

export interface MapConfig {
  readonly CELL_SIZE: number;
  readonly ROOM_PADDING: number;
  readonly CONNECTOR_WIDTH: number;
}

export const MAP_CONFIG: MapConfig = {
  CELL_SIZE: 140,
  ROOM_PADDING: 15,
  CONNECTOR_WIDTH: 6,
};

export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export interface MapRoomSize {
  readonly width: number;
  readonly height: number;
}

export interface MapRoomPort extends MapPoint {
  readonly side: 'left' | 'right' | 'top' | 'bottom';
  readonly portKey: string;
  readonly targetGrid: MapPoint;
}

export interface MapConnector {
  readonly from: string;
  readonly to: string;
  readonly path: readonly MapPoint[];
  readonly fromPoint: MapRoomPort;
  readonly toPoint: MapRoomPort;
}

export interface MapLayout {
  readonly positions: Record<string, { x: number; y: number }>;
  readonly roomSizes: Record<string, MapRoomSize>;
  readonly hubName: string;
  readonly gridSize: { readonly cols: number; readonly rows: number };
}

export interface MapLayoutResult {
  readonly layout: MapLayout;
  readonly connectors: readonly MapConnector[];
  readonly allConnected: boolean;
  readonly missingConnections: readonly { from: string; to: string }[];
}

/** Simplified location data expected by the layout algorithm */
export interface MapLocationData {
  readonly connections: readonly string[];
  readonly name: string;
}

// ---------------------------------------------------------------------------
// GRAPH → LOCATION DATA BRIDGE
// ---------------------------------------------------------------------------

/**
 * Convert a LocationGraph into the flat record the layout engine expects.
 * Each edge produces a bidirectional connection entry.
 */
export function buildMapLocations(
  graph: LocationGraph,
  locale: 'fr' | 'en' = 'fr',
): Record<string, MapLocationData> {
  const result: Record<string, { connections: string[]; name: string }> = {};

  for (const node of graph.nodes) {
    result[node.id] = {
      connections: [],
      name: node.nameKey[locale] || node.nameKey.en || node.id,
    };
  }

  for (const edge of graph.edges) {
    const fromEntry = result[edge.from];
    const toEntry = result[edge.to];
    if (fromEntry && !fromEntry.connections.includes(edge.to)) {
      fromEntry.connections.push(edge.to);
    }
    if (edge.bidirectional && toEntry && !toEntry.connections.includes(edge.from)) {
      toEntry.connections.push(edge.from);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// LAYOUT ALGORITHM
// ---------------------------------------------------------------------------

type LayoutMode = 'vertical' | 'standard';

interface LayoutOptions {
  readonly spacing?: number;
  readonly layoutMode?: LayoutMode;
}

interface MutablePos { x: number; y: number }

function generateLayout(
  locations: Record<string, MapLocationData>,
  options: LayoutOptions = {},
): MapLayout {
  const spacing = Math.max(0, Math.floor(options.spacing ?? 0));
  const layoutMode: LayoutMode = options.layoutMode ?? 'vertical';
  const scale = spacing + 1;
  const names = Object.keys(locations);

  // Room sizes (height based on connection count)
  const roomSizes: Record<string, MapRoomSize> = {};
  for (const [name, loc] of Object.entries(locations)) {
    const connCount = loc.connections.length;
    let height = 1;
    if (connCount >= 5) height = 2;
    if (connCount >= 7) height = 3;
    if (connCount >= 9) height = 4;
    roomSizes[name] = { width: 1, height };
  }

  // Hub = room with most connections
  let hubName = names[0] ?? '';
  let maxConn = 0;
  for (const [name, loc] of Object.entries(locations)) {
    if (loc.connections.length > maxConn) {
      maxConn = loc.connections.length;
      hubName = name;
    }
  }

  const isOccupied = (occupied: Set<string>, x: number, y: number, h: number): boolean => {
    for (let dy = 0; dy < h; dy++) {
      if (occupied.has(`${x},${y + dy}`)) return true;
    }
    return false;
  };

  const occupy = (occupied: Set<string>, x: number, y: number, h: number): void => {
    for (let dy = 0; dy < h; dy++) {
      occupied.add(`${x},${y + dy}`);
    }
  };

  const estimateConnectorLength = (
    posA: MutablePos, sizeA: MapRoomSize,
    posB: MutablePos, sizeB: MapRoomSize,
  ): number => {
    const ax = posA.x + 0.5;
    const ay = posA.y + sizeA.height / 2;
    const bx = posB.x + 0.5;
    const by = posB.y + sizeB.height / 2;
    return Math.abs(ax - bx) + Math.abs(ay - by);
  };

  const roomDistance = (
    posA: MutablePos, sizeA: MapRoomSize,
    posB: MutablePos, sizeB: MapRoomSize,
  ): number => {
    const ax1 = posA.x, ax2 = posA.x;
    const ay1 = posA.y, ay2 = posA.y + sizeA.height - 1;
    const bx1 = posB.x, bx2 = posB.x;
    const by1 = posB.y, by2 = posB.y + sizeB.height - 1;
    const dx = ax2 < bx1 ? bx1 - ax2 : bx2 < ax1 ? ax1 - bx2 : 0;
    const dy = ay2 < by1 ? by1 - ay2 : by2 < ay1 ? ay1 - by2 : 0;
    return dx + dy;
  };

  const getAdjacentCandidates = (
    basePos: MutablePos, baseSize: MapRoomSize, targetHeight: number,
  ): MutablePos[] => {
    const candidates: MutablePos[] = [];
    const topY = basePos.y - targetHeight;
    const bottomY = basePos.y + baseSize.height;
    candidates.push({ x: basePos.x - 1, y: basePos.y });
    candidates.push({ x: basePos.x + 1, y: basePos.y });
    candidates.push({ x: basePos.x, y: topY });
    candidates.push({ x: basePos.x, y: bottomY });
    for (let dy = 0; dy < baseSize.height; dy++) {
      candidates.push({ x: basePos.x - 1, y: basePos.y + dy - (targetHeight - 1) });
      candidates.push({ x: basePos.x + 1, y: basePos.y + dy - (targetHeight - 1) });
    }
    return candidates;
  };

  const shuffle = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j]!, array[i]!];
    }
    return array;
  };

  const computeLayoutCost = (positions: Record<string, MutablePos>): number => {
    let cost = 0;
    const seen = new Set<string>();

    if (layoutMode === 'vertical') {
      let minX = Infinity;
      let maxX = -Infinity;
      for (const [name, pos] of Object.entries(positions)) {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x + roomSizes[name]!.width - 1);
      }
      const gridWidth = (maxX - minX) + 1;
      if (gridWidth > 2) {
        cost += (gridWidth - 2) * 200;
      }
    }

    for (const [from, loc] of Object.entries(locations)) {
      for (const to of loc.connections) {
        const key = [from, to].sort().join('<->');
        if (seen.has(key)) continue;
        seen.add(key);
        if (!positions[from] || !positions[to]) continue;
        cost += roomDistance(positions[from], roomSizes[from]!, positions[to], roomSizes[to]!);
      }
    }
    return cost;
  };

  const buildLayoutAttempt = (): Record<string, MutablePos> | null => {
    const positions: Record<string, MutablePos> = {};
    const occupied = new Set<string>();
    const placed = new Set<string>();

    positions[hubName] = { x: 3, y: 3 };
    occupy(occupied, 3, 3, roomSizes[hubName]!.height);
    placed.add(hubName);

    const remaining = new Set(names.filter(n => n !== hubName));
    let searchRadius = 1;

    while (remaining.size > 0) {
      const candidateNames = Array.from(remaining).map(name => {
        const connectedPlaced = locations[name]!.connections.filter(c => placed.has(c)).length;
        const degree = locations[name]!.connections.length;
        return { name, score: connectedPlaced * 10 + degree + Math.random() };
      });
      candidateNames.sort((a, b) => b.score - a.score);
      const name = candidateNames[0]!.name;

      const size = roomSizes[name]!;
      let bestPos: MutablePos | null = null;
      let bestCost = Infinity;

      const connectedPlaced = locations[name]!.connections.filter(c => placed.has(c));
      const anchors = connectedPlaced.length > 0 ? connectedPlaced : Array.from(placed);

      const candidateSet = new Map<string, MutablePos>();
      for (const anchor of anchors) {
        const anchorPos = positions[anchor]!;
        const anchorSize = roomSizes[anchor]!;
        for (const cand of getAdjacentCandidates(anchorPos, anchorSize, size.height)) {
          const key = `${cand.x},${cand.y}`;
          if (!candidateSet.has(key)) candidateSet.set(key, cand);
        }
      }

      for (let r = 1; r <= searchRadius; r++) {
        for (const anchor of anchors) {
          const anchorPos = positions[anchor]!;
          for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
              const cand = { x: anchorPos.x + dx, y: anchorPos.y + dy };
              const key = `${cand.x},${cand.y}`;
              if (!candidateSet.has(key)) candidateSet.set(key, cand);
            }
          }
        }
      }

      const candidateArray = shuffle(Array.from(candidateSet.values()));
      for (const cand of candidateArray) {
        if (cand.x < 0 || cand.y < 0) continue;
        if (isOccupied(occupied, cand.x, cand.y, size.height)) continue;

        let cost = 0;
        for (const conn of connectedPlaced) {
          cost += estimateConnectorLength(cand, size, positions[conn]!, roomSizes[conn]!);
        }

        if (connectedPlaced.length === 0) {
          for (const other of placed) {
            cost += estimateConnectorLength(cand, size, positions[other]!, roomSizes[other]!) * 0.25;
          }
        }

        if (layoutMode === 'vertical') {
          const xDist = Math.abs(cand.x - 3);
          const xPenalty = xDist <= 1 ? xDist * 0.5 : xDist * 10.0;
          cost += xPenalty + Math.abs(cand.y - 3) * 0.5;
        } else {
          cost += Math.abs(cand.x - 3) * 0.05 + Math.abs(cand.y - 3) * 0.05;
        }
        cost += Math.random() * 0.05;

        if (cost < bestCost) {
          bestCost = cost;
          bestPos = cand;
        }
      }

      if (!bestPos) {
        searchRadius += 1;
        if (searchRadius > 8) return null;
        continue;
      }

      positions[name] = bestPos;
      occupy(occupied, bestPos.x, bestPos.y, size.height);
      placed.add(name);
      remaining.delete(name);
    }

    return positions;
  };

  // Run many attempts, keep best
  const ATTEMPTS = 100;
  let bestPositions: Record<string, MutablePos> | null = null;
  let bestCost = Infinity;

  for (let i = 0; i < ATTEMPTS; i++) {
    const attempt = buildLayoutAttempt();
    if (!attempt) continue;
    const cost = computeLayoutCost(attempt);
    if (cost < bestCost) {
      bestCost = cost;
      bestPositions = attempt;
    }
  }

  const positions = bestPositions ?? buildLayoutAttempt() ?? {};

  // Centre hub in grid with symmetric padding
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [n, pos] of Object.entries(positions)) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y + (roomSizes[n]!.height - 1));
  }

  const hubPos = positions[hubName];
  if (hubPos) {
    const leftDist = hubPos.x - minX;
    const rightDist = maxX - hubPos.x;
    const topDist = hubPos.y - minY;
    const bottomDist = maxY - hubPos.y;
    const targetHubX = Math.max(leftDist, rightDist);
    const targetHubY = Math.max(topDist, bottomDist);
    const offsetX = targetHubX - hubPos.x;
    const offsetY = targetHubY - hubPos.y;
    for (const pos of Object.values(positions)) {
      pos.x += offsetX;
      pos.y += offsetY;
    }
  }

  // Apply spacing
  if (scale !== 1) {
    for (const pos of Object.values(positions)) {
      pos.x *= scale;
      pos.y *= scale;
    }
  }

  // Compute grid size
  maxX = 0;
  maxY = 0;
  for (const [n, pos] of Object.entries(positions)) {
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y + (roomSizes[n]!.height - 1));
  }

  const GRID_PADDING = 2;
  for (const pos of Object.values(positions)) {
    pos.x += GRID_PADDING;
    pos.y += GRID_PADDING;
  }

  return {
    positions,
    roomSizes,
    hubName,
    gridSize: { cols: maxX + 1 + GRID_PADDING * 2, rows: maxY + 1 + GRID_PADDING * 2 },
  };
}

// ---------------------------------------------------------------------------
// CONNECTOR COMPUTATION
// ---------------------------------------------------------------------------

function makeRoomPort(
  gridX: number, gridY: number, height: number,
  side: 'left' | 'right' | 'top' | 'bottom', row = 0,
): MapRoomPort {
  const { CELL_SIZE, ROOM_PADDING } = MAP_CONFIG;
  if (side === 'left' || side === 'right') {
    const safeRow = Math.max(0, Math.min(height - 1, row));
    const y = (gridY + safeRow) * CELL_SIZE + CELL_SIZE / 2;
    const x = side === 'left'
      ? gridX * CELL_SIZE + ROOM_PADDING
      : gridX * CELL_SIZE + CELL_SIZE - ROOM_PADDING;
    return {
      x, y, side,
      portKey: `${side}:${safeRow}`,
      targetGrid: { x: gridX + (side === 'left' ? -1 : 1), y: gridY + safeRow },
    };
  }
  const x = gridX * CELL_SIZE + CELL_SIZE / 2;
  const y = side === 'top'
    ? gridY * CELL_SIZE + ROOM_PADDING
    : gridY * CELL_SIZE + CELL_SIZE * height - ROOM_PADDING;
  return {
    x, y, side,
    portKey: `${side}:0`,
    targetGrid: { x: gridX, y: gridY + (side === 'top' ? -1 : height) },
  };
}

function getConnectionPoints(gridX: number, gridY: number, height: number): MapRoomPort[] {
  const points: MapRoomPort[] = [];
  points.push(makeRoomPort(gridX, gridY, height, 'top', 0));
  points.push(makeRoomPort(gridX, gridY, height, 'bottom', 0));
  for (let row = 0; row < height; row++) {
    points.push(makeRoomPort(gridX, gridY, height, 'left', row));
    points.push(makeRoomPort(gridX, gridY, height, 'right', row));
  }
  return points;
}

type Side = 'left' | 'right' | 'top' | 'bottom';
type Dir = 'left' | 'right' | 'up' | 'down';

const sideOpposite = (side: Side): Side => {
  if (side === 'left') return 'right';
  if (side === 'right') return 'left';
  if (side === 'top') return 'bottom';
  return 'top';
};

const _sideToDir = (side: Side): Dir => {
  if (side === 'right') return 'right';
  if (side === 'left') return 'left';
  if (side === 'bottom') return 'down';
  return 'up';
};

const dirBetween = (a: MapPoint, b: MapPoint): Dir => {
  if (b.x > a.x) return 'right';
  if (b.x < a.x) return 'left';
  if (b.y > a.y) return 'down';
  return 'up';
};

const edgeCenter = (cell: MapPoint, side: Side): MapPoint => {
  const { CELL_SIZE } = MAP_CONFIG;
  const x = cell.x * CELL_SIZE;
  const y = cell.y * CELL_SIZE;
  if (side === 'left') return { x, y: y + CELL_SIZE / 2 };
  if (side === 'right') return { x: x + CELL_SIZE, y: y + CELL_SIZE / 2 };
  if (side === 'top') return { x: x + CELL_SIZE / 2, y };
  return { x: x + CELL_SIZE / 2, y: y + CELL_SIZE };
};

function computeConnectors(
  locations: Record<string, MapLocationData>,
  layout: MapLayout,
): {
  connectors: MapConnector[];
  allConnected: boolean;
  missingConnections: { from: string; to: string }[];
} {
  const connectors: MapConnector[] = [];
  const processed = new Set<string>();
  const roomPoints: Record<string, MapRoomPort[]> = {};
  const usedPorts: Record<string, Set<string>> = {};
  const roomBlocked = new Set<string>();
  const connectorBlockedCells = new Set<string>();
  const connectorBlockedEdges = new Set<string>();
  const missingConnections: { from: string; to: string }[] = [];

  const cellKey = (x: number, y: number): string => `${x},${y}`;
  const edgeKeyFn = (a: MapPoint, b: MapPoint): string => {
    const k1 = cellKey(a.x, a.y);
    const k2 = cellKey(b.x, b.y);
    return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
  };

  // Mark all room cells as blocked
  for (const [name, pos] of Object.entries(layout.positions)) {
    const h = layout.roomSizes[name]?.height ?? 1;
    for (let dy = 0; dy < h; dy++) {
      roomBlocked.add(cellKey(pos.x, pos.y + dy));
    }
  }

  // Grid pathfinding (A*)
  const findGridPath = (start: MapPoint, goal: MapPoint): MapPoint[] | null => {
    const cols = layout.gridSize.cols;
    const rows = layout.gridSize.rows;
    if (start.x < 0 || start.y < 0 || goal.x < 0 || goal.y < 0) return null;
    if (start.x >= cols || start.y >= rows || goal.x >= cols || goal.y >= rows) return null;

    const deltas = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

    interface SearchNode { x: number; y: number; dir: number; steps: number; turns: number }
    const startNode: SearchNode = { x: start.x, y: start.y, dir: -1, steps: 0, turns: 0 };
    const open: SearchNode[] = [startNode];
    const bestScore = new Map<string, number>();
    const cameFrom = new Map<string, string>();

    const scoreOf = (node: SearchNode): number => node.steps * 1000 + node.turns * 10;
    bestScore.set(`${start.x},${start.y},-1`, 0);

    let goalNode: SearchNode | null = null;
    let goalKey: string | null = null;

    while (open.length > 0) {
      let bestIndex = 0;
      let bestValue = scoreOf(open[0]!);
      for (let i = 1; i < open.length; i++) {
        const val = scoreOf(open[i]!);
        if (val < bestValue) { bestValue = val; bestIndex = i; }
      }

      const current = open.splice(bestIndex, 1)[0]!;
      if (current.x === goal.x && current.y === goal.y) {
        goalNode = current;
        goalKey = `${current.x},${current.y},${current.dir}`;
        break;
      }

      for (let d = 0; d < deltas.length; d++) {
        if (current.dir !== -1 && (d + 2) % 4 === current.dir) continue;
        const next = { x: current.x + deltas[d]!.x, y: current.y + deltas[d]!.y };
        if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows) continue;

        const nextKey = cellKey(next.x, next.y);
        if (roomBlocked.has(nextKey) && !(next.x === goal.x && next.y === goal.y)) continue;
        if (connectorBlockedCells.has(nextKey) && !(next.x === goal.x && next.y === goal.y)) continue;

        const eKey = edgeKeyFn(current, next);
        if (connectorBlockedEdges.has(eKey)) continue;

        const turns = current.turns + (current.dir === -1 || current.dir === d ? 0 : 1);
        const steps = current.steps + 1;
        const nodeKey = `${next.x},${next.y},${d}`;
        const nodeScore = steps * 1000 + turns * 10;

        if (!bestScore.has(nodeKey) || nodeScore < bestScore.get(nodeKey)!) {
          bestScore.set(nodeKey, nodeScore);
          cameFrom.set(nodeKey, `${current.x},${current.y},${current.dir}`);
          open.push({ x: next.x, y: next.y, dir: d, steps, turns });
        }
      }
    }

    if (!goalNode || !goalKey) return null;

    const path: MapPoint[] = [{ x: goalNode.x, y: goalNode.y }];
    let cursorKey: string | undefined = goalKey;
    while (cursorKey) {
      const prevKey = cameFrom.get(cursorKey);
      if (!prevKey) break;
      const parts = prevKey.split(',').map(v => parseInt(v, 10));
      path.push({ x: parts[0]!, y: parts[1]! });
      cursorKey = prevKey;
    }
    path.reverse();
    return path;
  };

  // Build connector pixel path from grid path
  const buildConnectorPath = (
    gridPath: MapPoint[], fromPoint: MapRoomPort, toPoint: MapRoomPort,
  ): MapPoint[] => {
    const path: MapPoint[] = [];
    const pushPoint = (pt: MapPoint): void => {
      if (path.length > 0) {
        const last = path[path.length - 1]!;
        if (last.x === pt.x && last.y === pt.y) return;
      }
      path.push({ x: pt.x, y: pt.y });
    };

    pushPoint({ x: fromPoint.x, y: fromPoint.y });

    if (gridPath.length > 0) {
      const entrySide = sideOpposite(fromPoint.side);
      const exitSide = sideOpposite(toPoint.side);
      const firstCell = gridPath[0]!;
      pushPoint(edgeCenter(firstCell, entrySide));

      const entryCenter = edgeCenter(firstCell, entrySide);
      const firstCellCenter = {
        x: firstCell.x * MAP_CONFIG.CELL_SIZE + MAP_CONFIG.CELL_SIZE / 2,
        y: firstCell.y * MAP_CONFIG.CELL_SIZE + MAP_CONFIG.CELL_SIZE / 2,
      };

      if (entrySide === 'left' || entrySide === 'right') {
        pushPoint({ x: firstCellCenter.x, y: entryCenter.y });
      } else {
        pushPoint({ x: entryCenter.x, y: firstCellCenter.y });
      }
      pushPoint(firstCellCenter);

      for (const cell of gridPath) {
        pushPoint({
          x: cell.x * MAP_CONFIG.CELL_SIZE + MAP_CONFIG.CELL_SIZE / 2,
          y: cell.y * MAP_CONFIG.CELL_SIZE + MAP_CONFIG.CELL_SIZE / 2,
        });
      }

      const lastCell = gridPath[gridPath.length - 1]!;
      const exitCenter = edgeCenter(lastCell, exitSide);
      const lastCellCenter = {
        x: lastCell.x * MAP_CONFIG.CELL_SIZE + MAP_CONFIG.CELL_SIZE / 2,
        y: lastCell.y * MAP_CONFIG.CELL_SIZE + MAP_CONFIG.CELL_SIZE / 2,
      };

      if (exitSide === 'left' || exitSide === 'right') {
        pushPoint({ x: lastCellCenter.x, y: exitCenter.y });
      } else {
        pushPoint({ x: exitCenter.x, y: lastCellCenter.y });
      }
      pushPoint(exitCenter);
    }

    pushPoint({ x: toPoint.x, y: toPoint.y });

    // Clean up collinear points
    const finalPath: MapPoint[] = [];
    for (const pt of path) {
      if (finalPath.length >= 2) {
        const p1 = finalPath[finalPath.length - 2]!;
        const p2 = finalPath[finalPath.length - 1]!;
        if ((p1.y === p2.y && p2.y === pt.y) || (p1.x === p2.x && p2.x === pt.x)) {
          finalPath.pop();
        }
      }
      finalPath.push(pt);
    }

    return finalPath;
  };

  const getDirectAdjacency = (from: string, to: string): {
    left?: string; right?: string; top?: string; bottom?: string; rows?: number[];
  } | null => {
    const fromPos = layout.positions[from];
    const toPos = layout.positions[to];
    if (!fromPos || !toPos) return null;

    const fromH = layout.roomSizes[from]?.height ?? 1;
    const toH = layout.roomSizes[to]?.height ?? 1;

    const overlapStart = Math.max(fromPos.y, toPos.y);
    const overlapEnd = Math.min(fromPos.y + fromH - 1, toPos.y + toH - 1);
    const overlapRows: number[] = [];
    for (let r = overlapStart; r <= overlapEnd; r++) overlapRows.push(r);

    if (fromPos.x + 1 === toPos.x && overlapRows.length > 0) {
      return { left: from, right: to, rows: overlapRows };
    }
    if (toPos.x + 1 === fromPos.x && overlapRows.length > 0) {
      return { left: to, right: from, rows: overlapRows };
    }
    if (fromPos.y + fromH === toPos.y && fromPos.x === toPos.x) {
      return { top: from, bottom: to };
    }
    if (toPos.y + toH === fromPos.y && fromPos.x === toPos.x) {
      return { top: to, bottom: from };
    }
    return null;
  };

  // Count expected connections
  let expectedConnections = 0;
  const countSeen = new Set<string>();
  for (const [from, loc] of Object.entries(locations)) {
    for (const to of loc.connections) {
      const key = [from, to].sort().join('<->');
      if (countSeen.has(key)) continue;
      countSeen.add(key);
      expectedConnections++;
    }
  }

  // Process each connection
  for (const [from, loc] of Object.entries(locations)) {
    for (const to of loc.connections) {
      const key = [from, to].sort().join('<->');
      if (processed.has(key)) continue;
      processed.add(key);

      const fromPos = layout.positions[from];
      const toPos = layout.positions[to];
      if (!fromPos || !toPos) continue;

      const fromH = layout.roomSizes[from]?.height ?? 1;
      const toH = layout.roomSizes[to]?.height ?? 1;

      if (!roomPoints[from]) roomPoints[from] = getConnectionPoints(fromPos.x, fromPos.y, fromH);
      if (!roomPoints[to]) roomPoints[to] = getConnectionPoints(toPos.x, toPos.y, toH);
      if (!usedPorts[from]) usedPorts[from] = new Set();
      if (!usedPorts[to]) usedPorts[to] = new Set();

      // Try direct adjacency first
      const adjacency = getDirectAdjacency(from, to);
      if (adjacency) {
        if (adjacency.left && adjacency.right) {
          const leftPos = layout.positions[adjacency.left]!;
          const rightPos = layout.positions[adjacency.right]!;
          const leftH = layout.roomSizes[adjacency.left]?.height ?? 1;
          const rightH = layout.roomSizes[adjacency.right]?.height ?? 1;
          const rows = adjacency.rows ?? [];
          const targetRow = rows.length > 0 ? rows[Math.floor(rows.length / 2)]! : leftPos.y;
          const leftRow = Math.max(0, Math.min(leftH - 1, targetRow - leftPos.y));
          const rightRow = Math.max(0, Math.min(rightH - 1, targetRow - rightPos.y));
          const leftPort = makeRoomPort(leftPos.x, leftPos.y, leftH, 'right', leftRow);
          const rightPort = makeRoomPort(rightPos.x, rightPos.y, rightH, 'left', rightRow);

          if (!usedPorts[adjacency.left]!.has(leftPort.portKey) && !usedPorts[adjacency.right]!.has(rightPort.portKey)) {
            usedPorts[adjacency.left]!.add(leftPort.portKey);
            usedPorts[adjacency.right]!.add(rightPort.portKey);
            connectors.push({ from: adjacency.left, to: adjacency.right, path: [leftPort, rightPort], fromPoint: leftPort, toPoint: rightPort });
            continue;
          }
        } else if (adjacency.top && adjacency.bottom) {
          const topPos = layout.positions[adjacency.top]!;
          const bottomPos = layout.positions[adjacency.bottom]!;
          const topH = layout.roomSizes[adjacency.top]?.height ?? 1;
          const bottomH = layout.roomSizes[adjacency.bottom]?.height ?? 1;
          const topPort = makeRoomPort(topPos.x, topPos.y, topH, 'bottom', 0);
          const bottomPort = makeRoomPort(bottomPos.x, bottomPos.y, bottomH, 'top', 0);

          if (!usedPorts[adjacency.top]!.has(topPort.portKey) && !usedPorts[adjacency.bottom]!.has(bottomPort.portKey)) {
            usedPorts[adjacency.top]!.add(topPort.portKey);
            usedPorts[adjacency.bottom]!.add(bottomPort.portKey);
            connectors.push({ from: adjacency.top, to: adjacency.bottom, path: [topPort, bottomPort], fromPoint: topPort, toPoint: bottomPort });
            continue;
          }
        }
      }

      // A* grid path
      const fromPoints = roomPoints[from];
      const toPoints = roomPoints[to];

      let bestFromIndex = -1;
      let bestToIndex = -1;
      let bestPathLen = Infinity;
      let bestTurns = Infinity;
      let bestGridPath: MapPoint[] | null = null;

      const countTurns = (path: MapPoint[]): number => {
        let turns = 0;
        for (let i = 2; i < path.length; i++) {
          const dirA = dirBetween(path[i - 2]!, path[i - 1]!);
          const dirB = dirBetween(path[i - 1]!, path[i]!);
          if (dirA !== dirB) turns++;
        }
        return turns;
      };

      for (let i = 0; i < fromPoints.length; i++) {
        for (let j = 0; j < toPoints.length; j++) {
          const fp = fromPoints[i]!;
          const tp = toPoints[j]!;
          if (!fp.targetGrid || !tp.targetGrid) continue;
          if (usedPorts[from].has(fp.portKey)) continue;
          if (usedPorts[to].has(tp.portKey)) continue;

          const startKey = cellKey(fp.targetGrid.x, fp.targetGrid.y);
          const endKey = cellKey(tp.targetGrid.x, tp.targetGrid.y);
          if (roomBlocked.has(startKey) || roomBlocked.has(endKey)) continue;
          if (connectorBlockedCells.has(startKey) || connectorBlockedCells.has(endKey)) continue;

          const gridPath = findGridPath(fp.targetGrid, tp.targetGrid);
          if (!gridPath) continue;

          const len = gridPath.length;
          const turns = countTurns(gridPath);
          if (len < bestPathLen || (len === bestPathLen && turns < bestTurns)) {
            bestPathLen = len;
            bestTurns = turns;
            bestFromIndex = i;
            bestToIndex = j;
            bestGridPath = gridPath;
          }
        }
      }

      if (!bestGridPath) {
        missingConnections.push({ from, to });
        continue;
      }

      const bestFrom = fromPoints[bestFromIndex] ?? fromPoints[0]!;
      const bestTo = toPoints[bestToIndex] ?? toPoints[0]!;

      usedPorts[from].add(bestFrom.portKey);
      usedPorts[to].add(bestTo.portKey);

      for (let i = 0; i < bestGridPath.length; i++) {
        connectorBlockedCells.add(cellKey(bestGridPath[i]!.x, bestGridPath[i]!.y));
        if (i > 0) {
          connectorBlockedEdges.add(edgeKeyFn(bestGridPath[i - 1]!, bestGridPath[i]!));
        }
      }

      const path = buildConnectorPath(bestGridPath, bestFrom, bestTo);
      connectors.push({ from, to, path, fromPoint: bestFrom, toPoint: bestTo });
    }
  }

  const allConnected = missingConnections.length === 0 && connectors.length === expectedConnections;
  return { connectors, allConnected, missingConnections };
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  readonly layoutMode?: LayoutMode;
  readonly totalTries?: number;
  readonly spacingLevels?: readonly number[];
}

/** Generate a complete map layout with connectors. Call once per game start. */
export function generateMapLayout(
  locations: Record<string, MapLocationData>,
  options: GenerateOptions = {},
): MapLayoutResult {
  const totalTries = Math.max(1, options.totalTries ?? 50);
  const spacingLevels = options.spacingLevels ?? [0, 1, 2];
  let bestResult: MapLayoutResult | null = null;
  let bestLength = Infinity;

  const connectorLengthSum = (conns: readonly MapConnector[]): number => {
    let total = 0;
    for (const conn of conns) {
      for (let i = 1; i < conn.path.length; i++) {
        const a = conn.path[i - 1]!;
        const b = conn.path[i]!;
        total += Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      }
    }
    return total;
  };

  for (let i = 0; i < totalTries; i++) {
    const spacing = spacingLevels[i % spacingLevels.length]!;
    const layout = generateLayout(locations, { spacing, layoutMode: options.layoutMode });
    const result = computeConnectors(locations, layout);
    const lengthSum = connectorLengthSum(result.connectors);
    const candidate: MapLayoutResult = {
      layout,
      connectors: result.connectors,
      allConnected: result.allConnected,
      missingConnections: result.missingConnections,
    };

    const isBetter = !bestResult
      || (candidate.allConnected && !bestResult.allConnected)
      || (candidate.allConnected === bestResult.allConnected && lengthSum < bestLength);

    if (isBetter) {
      bestResult = candidate;
      bestLength = lengthSum;
    }
  }

  return bestResult ?? {
    layout: generateLayout(locations, { layoutMode: options.layoutMode }),
    connectors: [],
    allConnected: false,
    missingConnections: [],
  };
}
