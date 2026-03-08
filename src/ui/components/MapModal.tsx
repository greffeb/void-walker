// ---------------------------------------------------------------------------
// src/ui/components/MapModal.tsx — Canvas-based spatial map with fog-of-war
// ---------------------------------------------------------------------------
// Replaces the old text list. The layout is computed once per game (stored in
// Zustand) and visibility updates each render based on player exploration.
// Read-only: the player navigates via the parser, not by clicking the map.
// ---------------------------------------------------------------------------

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '@stores/gameStore';
import { Modal } from './Modal';
import { MAP_CONFIG } from '@ui/utils/mapLayout';
import type { MapLayoutResult, MapLocationData, MapConnector } from '@ui/utils/mapLayout';
import { computeVisibility, isConnectorVisible, isConnectorToAdjacent } from '@ui/utils/mapVisibility';
import type { RoomVisibility, VisibilityState } from '@ui/utils/mapVisibility';
import { isObstacleResolved } from '@engine/backtracking';
import type { GameState } from '@engine/types';
import type { LocationNode } from '@engine/scenario';

interface Props {
  readonly onClose: () => void;
}

// ---------------------------------------------------------------------------
// HIDDEN EXIT COMPUTATION
// ---------------------------------------------------------------------------

/**
 * Compute the set of exits that should NOT reveal adjacent rooms on the map.
 * An exit is hidden if:
 *   1. The source location has an unresolved blocking obstacle (forward exits blocked)
 *   2. The exit requires unlocking and hasn't been unlocked yet
 *
 * Returns a Set of "fromLocationId:toLocationId" keys.
 */
function computeHiddenExits(state: GameState): ReadonlySet<string> {
  const graph = state.scenario?.graph;
  if (!graph) return new Set<string>();

  const hidden = new Set<string>();

  // Build node lookup
  const nodeById = new Map<string, LocationNode>();
  for (const node of graph.nodes) {
    nodeById.set(node.id, node);
  }

  // For each visited/current location, check if its forward exits are blocked
  const visitedLocationIds = new Set(Object.keys(state.visitedLocations));
  if (state.playerLocationId) visitedLocationIds.add(state.playerLocationId);

  for (const locId of visitedLocationIds) {
    const node = nodeById.get(locId);
    if (!node) continue;

    // Check if this location has an unresolved blocking obstacle
    const visitState = state.visitedLocations[locId];
    const resolved = isObstacleResolved(visitState);
    const hasBlockingObstacle = !resolved && !!node.obstacle && node.obstacle.blocksExit !== false;

    if (hasBlockingObstacle) {
      // All forward exits (to unvisited locations) are hidden
      for (const edge of graph.edges) {
        if (edge.from === locId && !visitedLocationIds.has(edge.to)) {
          hidden.add(`${locId}:${edge.to}`);
        }
        if (edge.bidirectional && edge.to === locId && !visitedLocationIds.has(edge.from)) {
          hidden.add(`${locId}:${edge.from}`);
        }
      }
    }
  }

  // Check locked exits (unlockedExits: key = "from:to", value = true when unlocked)
  // An edge that needs explicit unlocking but hasn't been unlocked → hidden
  // We detect this by checking if any edge's "from:to" key exists in unlockedExits as false
  // Actually, unlockedExits only tracks unlocked ones (true), so locked exits are those
  // that WOULD need unlocking but aren't in the map yet.
  // The engine doesn't mark edges as "requires unlock" in the graph data model —
  // unlocking is driven by interactions. So we don't hide these exits beyond obstacle gating.

  return hidden;
}

// ---------------------------------------------------------------------------
// PALETTE — Amber Cassette Futurism design system
// ---------------------------------------------------------------------------

const PALETTE = {
  // Background
  bg: '#0a0a0c',
  gridLine: 'rgba(255, 176, 0, 0.04)',
  // Rooms
  currentFill: 'rgba(255, 176, 0, 0.15)',
  currentBorder: '#FFB000',
  currentText: '#FFB000',
  visitedFill: 'rgba(0, 255, 65, 0.06)',
  visitedBorder: '#00FF41',
  visitedText: '#00FF41',
  adjacentFill: 'rgba(255, 102, 0, 0.05)',
  adjacentBorder: '#FF6600',
  adjacentText: '#FF6600',
  // Connectors
  connectorVisited: '#00FF41',
  connectorAdjacent: 'rgba(255, 102, 0, 0.25)',
  // You-are-here
  pulseColor: '#FFB000',
  // Font
  fontMono: '"IBM Plex Mono", monospace',
  fontTitle: '"Orbitron", sans-serif',
} as const;

// ---------------------------------------------------------------------------
// DRAWING HELPERS
// ---------------------------------------------------------------------------

function drawGrid(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  cellSize: number,
): void {
  ctx.strokeStyle = PALETTE.gridLine;
  ctx.lineWidth = 1;
  const cols = Math.ceil(canvasWidth / cellSize) + 1;
  const rows = Math.ceil(canvasHeight / cellSize) + 1;
  for (let c = 0; c <= cols; c++) {
    const x = c * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = r * cellSize;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
}

function drawRoom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  visibility: RoomVisibility,
  _isCurrent: boolean,
): void {
  const pad = MAP_CONFIG.ROOM_PADDING;
  const rx = x * MAP_CONFIG.CELL_SIZE + pad;
  const ry = y * MAP_CONFIG.CELL_SIZE + pad;
  const rw = w * MAP_CONFIG.CELL_SIZE - pad * 2;
  const rh = h * MAP_CONFIG.CELL_SIZE - pad * 2;

  let fill: string;
  let border: string;
  let textColor: string;

  switch (visibility) {
    case 'current':
      fill = PALETTE.currentFill;
      border = PALETTE.currentBorder;
      textColor = PALETTE.currentText;
      break;
    case 'visited':
      fill = PALETTE.visitedFill;
      border = PALETTE.visitedBorder;
      textColor = PALETTE.visitedText;
      break;
    case 'adjacent':
      fill = PALETTE.adjacentFill;
      border = PALETTE.adjacentBorder;
      textColor = PALETTE.adjacentText;
      break;
    default:
      return; // hidden — draw nothing
  }

  // Fill
  ctx.fillStyle = fill;
  ctx.fillRect(rx, ry, rw, rh);

  // Border
  ctx.strokeStyle = border;
  ctx.lineWidth = visibility === 'current' ? 2 : 1;
  ctx.setLineDash(visibility === 'adjacent' ? [4, 4] : []);
  ctx.strokeRect(rx, ry, rw, rh);
  ctx.setLineDash([]);

  // Label text
  ctx.fillStyle = textColor;
  const fontSize = visibility === 'adjacent' ? 9 : 10;
  ctx.font = `${fontSize}px ${PALETTE.fontMono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (visibility === 'adjacent') {
    // Show the actual room name (player knows about it from exit narration)
    const maxWidth = rw - 10;
    const lineHeight = fontSize + 3;
    const words = label.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const totalHeight = lines.length * lineHeight;
    const startY = ry + (rh - totalHeight) / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, rx + rw / 2, startY + i * lineHeight, maxWidth);
    }
  } else {
    // Word-wrap the name inside the room box
    const maxWidth = rw - 10;
    const lineHeight = fontSize + 3;
    const words = label.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const totalHeight = lines.length * lineHeight;
    const startY = ry + (rh - totalHeight) / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, rx + rw / 2, startY + i * lineHeight, maxWidth);
    }
  }
}

function drawConnector(
  ctx: CanvasRenderingContext2D,
  connector: MapConnector,
  color: string,
  dashed: boolean,
): void {
  if (connector.path.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = MAP_CONFIG.CONNECTOR_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dashed ? [6, 6] : []);
  ctx.beginPath();
  ctx.moveTo(connector.path[0]!.x, connector.path[0]!.y);
  for (let i = 1; i < connector.path.length; i++) {
    ctx.lineTo(connector.path[i]!.x, connector.path[i]!.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPulse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  roomHeight: number,
  phase: number,
): void {
  const cx = x * MAP_CONFIG.CELL_SIZE + MAP_CONFIG.CELL_SIZE / 2;
  const cy = y * MAP_CONFIG.CELL_SIZE + (roomHeight * MAP_CONFIG.CELL_SIZE) / 2;
  const maxRadius = MAP_CONFIG.CELL_SIZE * 0.4;
  const radius = maxRadius * (0.15 + 0.85 * phase);
  const alpha = 0.5 * (1 - phase);
  ctx.strokeStyle = `rgba(255, 176, 0, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// CANVAS MAP COMPONENT
// ---------------------------------------------------------------------------

function MapCanvas({
  layoutResult,
  locations,
  currentLocationId,
  visitedLocationIds,
  hiddenExits,
}: {
  readonly layoutResult: MapLayoutResult;
  readonly locations: Record<string, MapLocationData>;
  readonly currentLocationId: string;
  readonly visitedLocationIds: ReadonlySet<string>;
  readonly hiddenExits: ReadonlySet<string>;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { layout, connectors } = layoutResult;
    const dpr = window.devicePixelRatio || 1;

    // Canvas dimensions in logical pixels
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;

    // Compute visibility
    const visibility = computeVisibility(currentLocationId, visitedLocationIds, locations, hiddenExits);

    // Compute view bounds (only visible + adjacent rooms)
    const visibleBounds = computeVisibleBounds(layout, visibility);

    // Scale + translate to fit visible area
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    if (visibleBounds) {
      const contentW = visibleBounds.maxX - visibleBounds.minX;
      const contentH = visibleBounds.maxY - visibleBounds.minY;
      const viewPad = MAP_CONFIG.CELL_SIZE * 0.5;
      const padW = contentW + viewPad * 2;
      const padH = contentH + viewPad * 2;
      const scaleX = logicalWidth / padW;
      const scaleY = logicalHeight / padH;
      const scale = Math.min(scaleX, scaleY, 1.5); // cap max zoom

      const scaledW = padW * scale;
      const scaledH = padH * scale;
      const offsetX = (logicalWidth - scaledW) / 2;
      const offsetY = (logicalHeight - scaledH) / 2;

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.translate(-visibleBounds.minX + viewPad, -visibleBounds.minY + viewPad);
    }

    // Grid
    const totalW = layout.gridSize.cols * MAP_CONFIG.CELL_SIZE;
    const totalH = layout.gridSize.rows * MAP_CONFIG.CELL_SIZE;
    drawGrid(ctx, totalW, totalH, MAP_CONFIG.CELL_SIZE);

    // Connectors (underneath rooms)
    for (const conn of connectors) {
      if (isConnectorVisible(conn.from, conn.to, visibility)) {
        drawConnector(ctx, conn, PALETTE.connectorVisited, false);
      } else if (isConnectorToAdjacent(conn.from, conn.to, visibility)) {
        drawConnector(ctx, conn, PALETTE.connectorAdjacent, true);
      }
    }

    // Rooms
    for (const [id, pos] of Object.entries(layout.positions)) {
      const size = layout.roomSizes[id];
      if (!size) continue;
      const vis = visibility.status[id] ?? 'hidden';
      const name = locations[id]?.name ?? id;
      drawRoom(ctx, pos.x, pos.y, size.width, size.height, name, vis, id === currentLocationId);
    }

    // Pulse on current location
    if (layout.positions[currentLocationId]) {
      const pos = layout.positions[currentLocationId];
      const size = layout.roomSizes[currentLocationId];
      const phase = (Math.sin(time / 1000) + 1) / 2;
      drawPulse(ctx, pos.x, pos.y, size?.height ?? 1, phase);
    }

    ctx.restore();

    animationRef.current = requestAnimationFrame(draw);
  }, [layoutResult, locations, currentLocationId, visitedLocationIds, hiddenExits]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = (): void => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(container);
    resizeCanvas();

    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '300px',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          position: 'absolute',
          inset: 0,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// VISIBLE BOUNDS COMPUTATION
// ---------------------------------------------------------------------------

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function computeVisibleBounds(
  layout: MapLayoutResult['layout'],
  visibility: VisibilityState,
): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasAny = false;

  for (const [id, pos] of Object.entries(layout.positions)) {
    const vis = visibility.status[id];
    if (!vis || vis === 'hidden') continue;
    const size = layout.roomSizes[id];
    if (!size) continue;

    hasAny = true;
    const rx = pos.x * MAP_CONFIG.CELL_SIZE;
    const ry = pos.y * MAP_CONFIG.CELL_SIZE;
    const rw = size.width * MAP_CONFIG.CELL_SIZE;
    const rh = size.height * MAP_CONFIG.CELL_SIZE;
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx + rw);
    maxY = Math.max(maxY, ry + rh);
  }

  return hasAny ? { minX, minY, maxX, maxY } : null;
}

// ---------------------------------------------------------------------------
// LEGEND
// ---------------------------------------------------------------------------

function MapLegend(): JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        padding: '8px 12px',
        background: 'rgba(10, 10, 12, 0.85)',
        borderTop: '1px solid rgba(255, 176, 0, 0.15)',
        fontSize: '10px',
        fontFamily: '"IBM Plex Mono", monospace',
        color: 'var(--amber-dim)',
      }}
    >
      <span>
        <span style={{ color: PALETTE.currentBorder }}>■</span> Actuel
      </span>
      <span>
        <span style={{ color: PALETTE.visitedBorder }}>■</span> Visité
      </span>
      <span>
        <span style={{ color: PALETTE.adjacentBorder }}>□</span> Adjacent
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export function MapModal({ onClose }: Props): JSX.Element {
  const gameState = useGameStore((s) => s.gameState);
  const mapLayout = useGameStore((s) => s.mapLayout);
  const mapLocations = useGameStore((s) => s.mapLocations);

  const playerLocationId = gameState.playerLocationId;
  const visitedLocationIds = new Set(Object.keys(gameState.visitedLocations));

  // Compute hidden exits: obstacle-blocked + locked exits
  const hiddenExits = useMemo(
    () => computeHiddenExits(gameState),
    [gameState],
  );

  if (!mapLayout || !mapLocations || !playerLocationId) {
    return (
      <Modal title="CARTE" icon="◈" onClose={onClose}>
        <p style={{ color: 'var(--amber-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          Aucune carte disponible.
        </p>
      </Modal>
    );
  }

  return (
    <Modal title="CARTE" icon="◈" onClose={onClose}>
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px' }}>
        <MapCanvas
          layoutResult={mapLayout}
          locations={mapLocations}
          currentLocationId={playerLocationId}
          visitedLocationIds={visitedLocationIds}
          hiddenExits={hiddenExits}
        />
        <MapLegend />
      </div>
    </Modal>
  );
}
