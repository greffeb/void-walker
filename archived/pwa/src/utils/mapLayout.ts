// ============================================================================
// MAP LAYOUT ALGORITHM - Spatial room placement and connector routing
// ============================================================================

// Configuration
export const MAP_CONFIG = {
  CELL_SIZE: 100,      // Size of a grid cell
  ROOM_PADDING: 10,    // Space between cell edge and room
  CONNECTOR_WIDTH: 6,  // Thickness of connectors
};

// ============================================================================
// TYPES
// ============================================================================

export interface LocationGraph {
  [name: string]: {
    connections: string[];
  };
}

export interface Position {
  x: number;
  y: number;
}

export interface RoomSize {
  width: number;
  height: number;
}

export interface GridSize {
  cols: number;
  rows: number;
}

export interface RoomPort {
  x: number;
  y: number;
  side: 'left' | 'right' | 'top' | 'bottom';
  portKey: string;
  targetGrid: Position;
}

export interface Connector {
  from: string;
  to: string;
  path: Position[];
  fromPoint: RoomPort;
  toPoint: RoomPort;
}

export interface ConnectorRoom {
  cell: Position;
  type: 'I' | 'L';
  orientation: string;
  entry: string;
  exit: string;
}

export interface Layout {
  positions: Record<string, Position>;
  roomSizes: Record<string, RoomSize>;
  hubName: string;
  gridSize: GridSize;
}

export interface LayoutResult {
  layout: Layout;
  connectors: Connector[];
  connectorRooms: ConnectorRoom[];
  allConnected: boolean;
  spacing: number;
  missingConnections: Array<{ from: string; to: string }>;
}

// ============================================================================
// LAYOUT ALGORITHM
// ============================================================================

export function generateLayout(
  locations: LocationGraph,
  options: { spacing?: number } = {}
): Layout {
  const spacing = Math.max(0, Math.floor(options.spacing || 0));
  const scale = spacing + 1;
  const names = Object.keys(locations);

  // Calculate room sizes (height based on connection count)
  const roomSizes: Record<string, RoomSize> = {};
  for (const [name, loc] of Object.entries(locations)) {
    const connCount = loc.connections?.length || 0;
    let height = 1;
    if (connCount >= 5) height = 2;
    if (connCount >= 7) height = 3;
    if (connCount >= 9) height = 4;
    roomSizes[name] = { width: 1, height };
  }

  // Find the hub (room with most connections)
  let hubName = names[0];
  let maxConn = 0;
  for (const [name, loc] of Object.entries(locations)) {
    if (loc.connections.length > maxConn) {
      maxConn = loc.connections.length;
      hubName = name;
    }
  }

  const isOccupiedFactory = (occupied: Set<string>) => (x: number, y: number, h: number): boolean => {
    for (let dy = 0; dy < h; dy++) {
      if (occupied.has(`${x},${y + dy}`)) return true;
    }
    return false;
  };

  const occupyFactory = (occupied: Set<string>) => (x: number, y: number, h: number): void => {
    for (let dy = 0; dy < h; dy++) {
      occupied.add(`${x},${y + dy}`);
    }
  };

  const estimateConnectorLength = (
    posA: Position,
    sizeA: RoomSize,
    posB: Position,
    sizeB: RoomSize
  ): number => {
    const ax = posA.x + 0.5;
    const ay = posA.y + sizeA.height / 2;
    const bx = posB.x + 0.5;
    const by = posB.y + sizeB.height / 2;
    return Math.abs(ax - bx) + Math.abs(ay - by);
  };

  const getAdjacentCandidates = (
    basePos: Position,
    baseSize: RoomSize,
    targetHeight: number
  ): Position[] => {
    const candidates: Position[] = [];
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
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const computeLayoutCost = (positions: Record<string, Position>): number => {
    let cost = 0;
    const seen = new Set<string>();
    for (const [from, loc] of Object.entries(locations)) {
      for (const to of loc.connections) {
        const key = [from, to].sort().join('<->');
        if (seen.has(key)) continue;
        seen.add(key);
        if (!positions[from] || !positions[to]) continue;

        const posA = positions[from];
        const sizeA = roomSizes[from];
        const posB = positions[to];
        const sizeB = roomSizes[to];

        const ax1 = posA.x;
        const ay1 = posA.y;
        const ay2 = posA.y + sizeA.height - 1;
        const bx1 = posB.x;
        const by1 = posB.y;
        const by2 = posB.y + sizeB.height - 1;

        const dx = ax1 < bx1 ? bx1 - ax1 : bx1 < ax1 ? ax1 - bx1 : 0;
        const dy = ay2 < by1 ? by1 - ay2 : by2 < ay1 ? ay1 - by2 : 0;
        cost += dx + dy;
      }
    }
    return cost;
  };

  const buildLayoutAttempt = (): Record<string, Position> | null => {
    const positions: Record<string, Position> = {};
    const occupied = new Set<string>();
    const isOccupied = isOccupiedFactory(occupied);
    const occupy = occupyFactory(occupied);

    const placed = new Set<string>();
    positions[hubName] = { x: 3, y: 3 };
    occupy(3, 3, roomSizes[hubName].height);
    placed.add(hubName);

    const remaining = new Set(names.filter(n => n !== hubName));
    let searchRadius = 1;

    while (remaining.size > 0) {
      const candidateNames = Array.from(remaining).map(name => {
        const connectedPlaced = locations[name].connections.filter(c => placed.has(c)).length;
        const degree = locations[name].connections.length || 0;
        return { name, score: connectedPlaced * 10 + degree + Math.random() };
      });
      candidateNames.sort((a, b) => b.score - a.score);
      const name = candidateNames[0].name;

      const size = roomSizes[name];
      let bestPos: Position | null = null;
      let bestCost = Infinity;

      const connectedPlaced = locations[name].connections.filter(c => placed.has(c));
      const anchors = connectedPlaced.length > 0 ? connectedPlaced : Array.from(placed);

      const candidateSet = new Map<string, Position>();
      for (const anchor of anchors) {
        const anchorPos = positions[anchor];
        const anchorSize = roomSizes[anchor];
        for (const cand of getAdjacentCandidates(anchorPos, anchorSize, size.height)) {
          const key = `${cand.x},${cand.y}`;
          if (!candidateSet.has(key)) candidateSet.set(key, cand);
        }
      }

      for (let r = 1; r <= searchRadius; r++) {
        for (const anchor of anchors) {
          const anchorPos = positions[anchor];
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
        if (isOccupied(cand.x, cand.y, size.height)) continue;

        let cost = 0;
        for (const conn of connectedPlaced) {
          cost += estimateConnectorLength(cand, size, positions[conn], roomSizes[conn]);
        }

        if (connectedPlaced.length === 0) {
          for (const other of placed) {
            cost += estimateConnectorLength(cand, size, positions[other], roomSizes[other]) * 0.25;
          }
        }

        cost += Math.abs(cand.x - 3) * 0.05 + Math.abs(cand.y - 3) * 0.05;
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
      occupy(bestPos.x, bestPos.y, size.height);
      placed.add(name);
      remaining.delete(name);
    }

    return positions;
  };

  const ATTEMPTS = 100;
  let bestPositions: Record<string, Position> | null = null;
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

  const positions = bestPositions || buildLayoutAttempt() || {};

  // Apply spacing to leave corridors between rooms
  if (scale !== 1) {
    for (const pos of Object.values(positions)) {
      pos.x *= scale;
      pos.y *= scale;
    }
  }

  // Compact: shift so the top-left occupied cell sits at (0,0)
  let minX = Infinity;
  let minY = Infinity;
  for (const pos of Object.values(positions)) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
  }
  for (const pos of Object.values(positions)) {
    pos.x -= minX;
    pos.y -= minY;
  }

  // Tight bounding box + 1-cell border for connector routing
  let maxX = 0;
  let maxY = 0;
  for (const [n, pos] of Object.entries(positions)) {
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y + (roomSizes[n].height - 1));
  }

  const GRID_PADDING = 1;
  for (const pos of Object.values(positions)) {
    pos.x += GRID_PADDING;
    pos.y += GRID_PADDING;
  }

  return {
    positions,
    roomSizes,
    hubName,
    gridSize: { cols: maxX + 1 + GRID_PADDING * 2, rows: maxY + 1 + GRID_PADDING * 2 }
  };
}

// ============================================================================
// CONNECTOR COMPUTATION
// ============================================================================

function makeRoomPort(
  gridX: number,
  gridY: number,
  height: number,
  side: 'left' | 'right' | 'top' | 'bottom',
  row: number = 0
): RoomPort {
  const { CELL_SIZE, ROOM_PADDING } = MAP_CONFIG;

  if (side === 'left' || side === 'right') {
    const safeRow = Math.max(0, Math.min(height - 1, row));
    const y = (gridY + safeRow) * CELL_SIZE + CELL_SIZE / 2;
    const x = side === 'left'
      ? gridX * CELL_SIZE + ROOM_PADDING
      : gridX * CELL_SIZE + CELL_SIZE - ROOM_PADDING;
    return {
      x,
      y,
      side,
      portKey: `${side}:${safeRow}`,
      targetGrid: { x: gridX + (side === 'left' ? -1 : 1), y: gridY + safeRow }
    };
  }

  const x = gridX * CELL_SIZE + CELL_SIZE / 2;
  const y = side === 'top'
    ? gridY * CELL_SIZE + ROOM_PADDING
    : gridY * CELL_SIZE + CELL_SIZE * height - ROOM_PADDING;
  return {
    x,
    y,
    side,
    portKey: `${side}:0`,
    targetGrid: { x: gridX, y: gridY + (side === 'top' ? -1 : height) }
  };
}

function getConnectionPoints(gridX: number, gridY: number, height: number): RoomPort[] {
  const points: RoomPort[] = [];

  points.push(makeRoomPort(gridX, gridY, height, 'top', 0));
  points.push(makeRoomPort(gridX, gridY, height, 'bottom', 0));

  for (let row = 0; row < height; row++) {
    points.push(makeRoomPort(gridX, gridY, height, 'left', row));
    points.push(makeRoomPort(gridX, gridY, height, 'right', row));
  }

  return points;
}

export function computeConnectors(
  locations: LocationGraph,
  layout: Layout
): {
  connectors: Connector[];
  connectorRooms: ConnectorRoom[];
  allConnected: boolean;
  missingConnections: Array<{ from: string; to: string }>;
} {
  const connectors: Connector[] = [];
  const connectorRooms: ConnectorRoom[] = [];
  const processed = new Set<string>();
  const roomPoints: Record<string, RoomPort[]> = {};
  const usedPorts: Record<string, Set<string>> = {};
  const roomBlocked = new Set<string>();
  const connectorBlockedCells = new Set<string>();
  const connectorBlockedEdges = new Set<string>();
  const missingConnections: Array<{ from: string; to: string }> = [];

  const cellKey = (x: number, y: number) => `${x},${y}`;
  const edgeKey = (a: Position, b: Position) => {
    const k1 = cellKey(a.x, a.y);
    const k2 = cellKey(b.x, b.y);
    return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
  };

  const sideOpposite = (side: string): string => {
    if (side === 'left') return 'right';
    if (side === 'right') return 'left';
    if (side === 'top') return 'bottom';
    return 'top';
  };

  const sideToDir = (side: string): string => {
    if (side === 'right') return 'right';
    if (side === 'left') return 'left';
    if (side === 'bottom') return 'down';
    return 'up';
  };

  const dirBetween = (a: Position, b: Position): string => {
    if (b.x > a.x) return 'right';
    if (b.x < a.x) return 'left';
    if (b.y > a.y) return 'down';
    return 'up';
  };

  const edgeCenter = (cell: Position, side: string): Position => {
    const { CELL_SIZE } = MAP_CONFIG;
    const x = cell.x * CELL_SIZE;
    const y = cell.y * CELL_SIZE;
    if (side === 'left') return { x: x, y: y + CELL_SIZE / 2 };
    if (side === 'right') return { x: x + CELL_SIZE, y: y + CELL_SIZE / 2 };
    if (side === 'top') return { x: x + CELL_SIZE / 2, y: y };
    return { x: x + CELL_SIZE / 2, y: y + CELL_SIZE };
  };

  for (const [name, pos] of Object.entries(layout.positions)) {
    const h = layout.roomSizes[name]?.height || 1;
    for (let dy = 0; dy < h; dy++) {
      roomBlocked.add(cellKey(pos.x, pos.y + dy));
    }
  }

  const findGridPath = (start: Position, goal: Position): Position[] | null => {
    const cols = layout.gridSize.cols;
    const rows = layout.gridSize.rows;
    if (!start || !goal) return null;
    if (start.x < 0 || start.y < 0 || goal.x < 0 || goal.y < 0) return null;
    if (start.x >= cols || start.y >= rows || goal.x >= cols || goal.y >= rows) return null;

    const deltas = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];

    interface PathNode {
      x: number;
      y: number;
      dir: number;
      steps: number;
      turns: number;
    }

    const startNode: PathNode = { x: start.x, y: start.y, dir: -1, steps: 0, turns: 0 };
    const open: PathNode[] = [startNode];
    const bestScore = new Map<string, number>();
    const cameFrom = new Map<string, string>();

    const scoreOf = (node: PathNode) => node.steps * 1000 + node.turns * 10;
    bestScore.set(`${start.x},${start.y},-1`, 0);

    let goalKey: string | null = null;
    let goalNode: PathNode | null = null;

    while (open.length > 0) {
      let bestIndex = 0;
      let bestValue = scoreOf(open[0]);
      for (let i = 1; i < open.length; i++) {
        const val = scoreOf(open[i]);
        if (val < bestValue) {
          bestValue = val;
          bestIndex = i;
        }
      }

      const current = open.splice(bestIndex, 1)[0];
      if (current.x === goal.x && current.y === goal.y) {
        goalNode = current;
        goalKey = `${current.x},${current.y},${current.dir}`;
        break;
      }

      for (let d = 0; d < deltas.length; d++) {
        if (current.dir !== -1 && (d + 2) % 4 === current.dir) continue;

        const next = { x: current.x + deltas[d].x, y: current.y + deltas[d].y };
        if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows) continue;

        const nextKey = cellKey(next.x, next.y);
        if (roomBlocked.has(nextKey) && !(next.x === goal.x && next.y === goal.y)) continue;
        if (connectorBlockedCells.has(nextKey) && !(next.x === goal.x && next.y === goal.y)) continue;

        const eKey = edgeKey(current, next);
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

    if (!goalNode) return null;

    const path: Position[] = [{ x: goalNode.x, y: goalNode.y }];
    let cursorKey: string | null = goalKey;
    while (cursorKey) {
      const prevKey = cameFrom.get(cursorKey);
      if (!prevKey) break;
      const [px, py] = prevKey.split(',').map(v => parseInt(v, 10));
      path.push({ x: px, y: py });
      cursorKey = prevKey;
    }
    path.reverse();
    return path;
  };

  const addConnectorRooms = (gridPath: Position[], fromPoint: RoomPort, toPoint: RoomPort): void => {
    if (!gridPath || gridPath.length === 0) return;

    const entrySide = sideOpposite(fromPoint.side);
    const exitSide = sideOpposite(toPoint.side);

    for (let i = 0; i < gridPath.length; i++) {
      const cell = gridPath[i];
      const prev = i === 0 ? null : gridPath[i - 1];
      const next = i === gridPath.length - 1 ? null : gridPath[i + 1];

      const enterDir = prev
        ? dirBetween(prev, cell)
        : sideToDir(entrySide);
      const exitDir = next
        ? dirBetween(cell, next)
        : sideToDir(exitSide);

      const straight = enterDir === exitDir;
      let type: 'I' | 'L' = 'I';
      let orientation = enterDir === 'left' || enterDir === 'right' ? 'horizontal' : 'vertical';
      if (!straight) {
        type = 'L';
        const turn = `${enterDir}->${exitDir}`;
        const rightTurns = new Set(['up->right', 'right->down', 'down->left', 'left->up']);
        orientation = rightTurns.has(turn) ? 'right' : 'left';
      }

      connectorRooms.push({
        cell: { x: cell.x, y: cell.y },
        type,
        orientation,
        entry: enterDir,
        exit: exitDir
      });
    }
  };

  const buildConnectorPath = (gridPath: Position[] | null, fromPoint: RoomPort, toPoint: RoomPort): Position[] => {
    const path: Position[] = [];
    const pushPoint = (pt: Position) => {
      const last = path[path.length - 1];
      if (!last || last.x !== pt.x || last.y !== pt.y) path.push(pt);
    };

    pushPoint({ x: fromPoint.x, y: fromPoint.y });

    if (gridPath && gridPath.length > 0) {
      const entrySide = sideOpposite(fromPoint.side);
      const exitSide = sideOpposite(toPoint.side);

      const firstCell = gridPath[0];
      pushPoint(edgeCenter(firstCell, entrySide));

      for (let i = 0; i < gridPath.length - 1; i++) {
        const cell = gridPath[i];
        const next = gridPath[i + 1];
        const dir = dirBetween(cell, next);
        const side = dir === 'right' ? 'right' : dir === 'left' ? 'left' : dir === 'down' ? 'bottom' : 'top';
        pushPoint(edgeCenter(cell, side));
      }

      const lastCell = gridPath[gridPath.length - 1];
      pushPoint(edgeCenter(lastCell, exitSide));
    }

    pushPoint({ x: toPoint.x, y: toPoint.y });
    return path;
  };

  const getDirectAdjacency = (from: string, to: string): {
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
    rows?: number[];
  } | null => {
    const fromPos = layout.positions[from];
    const toPos = layout.positions[to];
    if (!fromPos || !toPos) return null;

    const fromH = layout.roomSizes[from]?.height || 1;
    const toH = layout.roomSizes[to]?.height || 1;

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

  let expectedConnections = 0;
  for (const [, loc] of Object.entries(locations)) {
    for (const to of loc.connections) {
      const key = [, to].sort().join('<->');
      if (processed.has(key)) continue;
      processed.add(key);
      expectedConnections += 1;
    }
  }

  processed.clear();

  for (const [from, loc] of Object.entries(locations)) {
    for (const to of loc.connections) {
      const key = [from, to].sort().join('<->');
      if (processed.has(key)) continue;
      processed.add(key);

      const fromPos = layout.positions[from];
      const toPos = layout.positions[to];
      if (!fromPos || !toPos) continue;

      const fromH = layout.roomSizes[from]?.height || 1;
      const toH = layout.roomSizes[to]?.height || 1;

      if (!roomPoints[from]) roomPoints[from] = getConnectionPoints(fromPos.x, fromPos.y, fromH);
      if (!roomPoints[to]) roomPoints[to] = getConnectionPoints(toPos.x, toPos.y, toH);
      if (!usedPorts[from]) usedPorts[from] = new Set();
      if (!usedPorts[to]) usedPorts[to] = new Set();

      const adjacency = getDirectAdjacency(from, to);
      if (adjacency) {
        if (adjacency.left && adjacency.right) {
          const leftPos = layout.positions[adjacency.left];
          const rightPos = layout.positions[adjacency.right];
          const leftH = layout.roomSizes[adjacency.left]?.height || 1;
          const rightH = layout.roomSizes[adjacency.right]?.height || 1;

          const rows = adjacency.rows || [];
          const targetRow = rows.length > 0 ? rows[Math.floor(rows.length / 2)] : leftPos.y;
          const leftRow = Math.max(0, Math.min(leftH - 1, targetRow - leftPos.y));
          const rightRow = Math.max(0, Math.min(rightH - 1, targetRow - rightPos.y));

          const leftPort = makeRoomPort(leftPos.x, leftPos.y, leftH, 'right', leftRow);
          const rightPort = makeRoomPort(rightPos.x, rightPos.y, rightH, 'left', rightRow);

          if (!usedPorts[adjacency.left].has(leftPort.portKey) && !usedPorts[adjacency.right].has(rightPort.portKey)) {
            usedPorts[adjacency.left].add(leftPort.portKey);
            usedPorts[adjacency.right].add(rightPort.portKey);
            connectors.push({
              from: adjacency.left,
              to: adjacency.right,
              path: [leftPort, rightPort],
              fromPoint: leftPort,
              toPoint: rightPort
            });
            continue;
          }
        } else if (adjacency.top && adjacency.bottom) {
          const topPos = layout.positions[adjacency.top];
          const bottomPos = layout.positions[adjacency.bottom];
          const topH = layout.roomSizes[adjacency.top]?.height || 1;
          const bottomH = layout.roomSizes[adjacency.bottom]?.height || 1;
          const topPort = makeRoomPort(topPos.x, topPos.y, topH, 'bottom', 0);
          const bottomPort = makeRoomPort(bottomPos.x, bottomPos.y, bottomH, 'top', 0);

          if (!usedPorts[adjacency.top].has(topPort.portKey) && !usedPorts[adjacency.bottom].has(bottomPort.portKey)) {
            usedPorts[adjacency.top].add(topPort.portKey);
            usedPorts[adjacency.bottom].add(bottomPort.portKey);
            connectors.push({
              from: adjacency.top,
              to: adjacency.bottom,
              path: [topPort, bottomPort],
              fromPoint: topPort,
              toPoint: bottomPort
            });
            continue;
          }
        }
      }

      const fromPoints = roomPoints[from];
      const toPoints = roomPoints[to];

      let bestFromIndex = -1;
      let bestToIndex = -1;
      let bestPathLen = Infinity;
      let bestTurns = Infinity;
      let bestGridPath: Position[] | null = null;

      const countTurns = (path: Position[]): number => {
        let turns = 0;
        for (let i = 2; i < path.length; i++) {
          const dirA = dirBetween(path[i - 2], path[i - 1]);
          const dirB = dirBetween(path[i - 1], path[i]);
          if (dirA !== dirB) turns++;
        }
        return turns;
      };

      const tryPair = (i: number, j: number): void => {
        const fp = fromPoints[i];
        const tp = toPoints[j];
        if (!fp?.targetGrid || !tp?.targetGrid) return;
        if (usedPorts[from].has(fp.portKey)) return;
        if (usedPorts[to].has(tp.portKey)) return;

        const startKey = cellKey(fp.targetGrid.x, fp.targetGrid.y);
        const endKey = cellKey(tp.targetGrid.x, tp.targetGrid.y);
        if (roomBlocked.has(startKey) || roomBlocked.has(endKey)) return;
        if (connectorBlockedCells.has(startKey) || connectorBlockedCells.has(endKey)) return;

        const gridPath = findGridPath(fp.targetGrid, tp.targetGrid);
        if (!gridPath) return;

        const len = gridPath.length;
        const turns = countTurns(gridPath);
        if (len < bestPathLen || (len === bestPathLen && turns < bestTurns)) {
          bestPathLen = len;
          bestTurns = turns;
          bestFromIndex = i;
          bestToIndex = j;
          bestGridPath = gridPath;
        }
      };

      for (let i = 0; i < fromPoints.length; i++) {
        for (let j = 0; j < toPoints.length; j++) {
          tryPair(i, j);
        }
      }

      if (!bestGridPath) {
        missingConnections.push({ from, to });
        continue;
      }

      // Create a const reference for TypeScript narrowing
      const finalGridPath: Position[] = bestGridPath;

      const bestFrom = fromPoints[bestFromIndex] || fromPoints[0];
      const bestTo = toPoints[bestToIndex] || toPoints[0];

      usedPorts[from].add(bestFrom.portKey);
      usedPorts[to].add(bestTo.portKey);

      for (let i = 0; i < finalGridPath.length; i++) {
        connectorBlockedCells.add(cellKey(finalGridPath[i].x, finalGridPath[i].y));
        if (i > 0) {
          connectorBlockedEdges.add(edgeKey(finalGridPath[i - 1], finalGridPath[i]));
        }
      }

      addConnectorRooms(finalGridPath, bestFrom, bestTo);
      const path = buildConnectorPath(finalGridPath, bestFrom, bestTo);
      connectors.push({ from, to, path, fromPoint: bestFrom, toPoint: bestTo });
    }
  }

  const allConnected = missingConnections.length === 0 && connectors.length === expectedConnections;
  return { connectors, connectorRooms, allConnected, missingConnections };
}

// ============================================================================
// POST-ROUTING TRIM: shrink grid to the occupied bounding box
// ============================================================================

function trimToOccupied(result: LayoutResult): LayoutResult {
  const { layout, connectors, connectorRooms } = result;
  const { positions, roomSizes } = layout;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const [name, pos] of Object.entries(positions)) {
    const h = roomSizes[name]?.height || 1;
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y + h - 1);
  }
  for (const cr of connectorRooms) {
    minX = Math.min(minX, cr.cell.x);
    minY = Math.min(minY, cr.cell.y);
    maxX = Math.max(maxX, cr.cell.x);
    maxY = Math.max(maxY, cr.cell.y);
  }

  if (minX === Infinity) return result;
  if (minX === 0 && minY === 0 &&
      maxX + 1 === layout.gridSize.cols &&
      maxY + 1 === layout.gridSize.rows) return result;

  const newPositions: Record<string, Position> = {};
  for (const [name, pos] of Object.entries(positions)) {
    newPositions[name] = { x: pos.x - minX, y: pos.y - minY };
  }

  const pxOffX = minX * MAP_CONFIG.CELL_SIZE;
  const pxOffY = minY * MAP_CONFIG.CELL_SIZE;

  return {
    ...result,
    layout: {
      ...layout,
      positions: newPositions,
      gridSize: { cols: maxX - minX + 1, rows: maxY - minY + 1 }
    },
    connectors: connectors.map(c => ({
      ...c,
      path: c.path.map(p => ({ x: p.x - pxOffX, y: p.y - pxOffY })),
      fromPoint: { ...c.fromPoint, x: c.fromPoint.x - pxOffX, y: c.fromPoint.y - pxOffY },
      toPoint:   { ...c.toPoint,   x: c.toPoint.x   - pxOffX, y: c.toPoint.y   - pxOffY }
    }))
  };
}

// ============================================================================
// COMBINED LAYOUT WITH CONNECTORS
// ============================================================================

export function generateLayoutWithConnectors(
  locations: LocationGraph,
  options: { totalTries?: number; spacingLevels?: number[] } = {}
): LayoutResult {
  const totalTries = Math.max(1, options.totalTries || 50);
  const spacingLevels = options.spacingLevels || [0, 1, 2];
  let bestResult: LayoutResult | null = null;
  let bestLength = Infinity;

  const connectorLengthSum = (connectors: Connector[]): number => {
    let total = 0;
    for (const conn of connectors) {
      for (let i = 1; i < conn.path.length; i++) {
        const a = conn.path[i - 1];
        const b = conn.path[i];
        total += Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      }
    }
    return total;
  };

  for (let i = 0; i < totalTries; i++) {
    const spacing = spacingLevels[i % spacingLevels.length];
    const layout = generateLayout(locations, { spacing });
    const result = computeConnectors(locations, layout);
    const lengthSum = connectorLengthSum(result.connectors);
    const candidate: LayoutResult = {
      layout,
      connectors: result.connectors,
      connectorRooms: result.connectorRooms,
      allConnected: result.allConnected,
      spacing,
      missingConnections: result.missingConnections
    };

    const isBetter = (bestResult === null)
      || (candidate.allConnected && !bestResult.allConnected)
      || (candidate.allConnected === bestResult.allConnected && lengthSum < bestLength);

    if (isBetter) {
      bestResult = candidate;
      bestLength = lengthSum;
    }
  }

  return trimToOccupied(bestResult || {
    layout: generateLayout(locations),
    connectors: [],
    connectorRooms: [],
    allConnected: false,
    spacing: 0,
    missingConnections: []
  });
}

// ============================================================================
// UTILITY: Normalize location name for comparison
// ============================================================================

const FRENCH_ARTICLES = new Set(['du', 'de', 'la', 'le', 'les', 'des', 'l', 'd']);

export function normalizeLocationName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics first so é→e before splitting
    .split(/[_\s'\u2019\u02bc]+/)      // split on separators incl. apostrophes
    .filter(w => w && !FRENCH_ARTICLES.has(w))
    .join('');
}

// ============================================================================
// UTILITY: Build location graph from scenario
// ============================================================================

export interface LocationMeta {
  name?: string;
  description?: string;
  connections?: string[];
  dangers?: string[];
  secrets?: string[];
  npcs?: string[];
  discovered?: boolean;
}

export function buildLocationGraphFromScenario(scenario: {
  locations?: Record<string, LocationMeta>;
}): {
  locations: LocationGraph;
  displayNames: Record<string, string>;
  meta: Record<string, LocationMeta>;
} {
  const rawLocations = scenario?.locations || {};
  const normalizedMap = new Map<string, string>();
  const displayNames: Record<string, string> = {};
  const meta: Record<string, LocationMeta> = {};

  for (const [key, loc] of Object.entries(rawLocations)) {
    const displayName = loc?.name || key;
    const normalized = normalizeLocationName(displayName);
    normalizedMap.set(normalizeLocationName(key), normalized);
    normalizedMap.set(normalized, normalized);
    displayNames[normalized] = displayName;
    meta[normalized] = loc || {};
  }

  const locations: LocationGraph = {};
  for (const [key, loc] of Object.entries(rawLocations)) {
    const displayName = loc?.name || key;
    const normalized = normalizeLocationName(displayName);
    const connections = Array.isArray(loc?.connections) ? loc.connections : [];
    const normalizedConnections: string[] = [];
    for (const conn of connections) {
      const normalizedConn = normalizedMap.get(normalizeLocationName(conn)) || normalizeLocationName(conn);
      if (normalizedConn && normalizedConn !== normalized) normalizedConnections.push(normalizedConn);
    }
    locations[normalized] = {
      connections: Array.from(new Set(normalizedConnections))
    };
  }

  return { locations, displayNames, meta };
}
