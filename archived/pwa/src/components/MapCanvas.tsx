import { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  MAP_CONFIG,
  generateLayoutWithConnectors,
  buildLocationGraphFromScenario,
  normalizeLocationName,
  type Connector
} from '../utils/mapLayout';
import type { Scenario } from '../types/game';

interface MapCanvasProps {
  scenario: Scenario;
  currentLocation: string;
  visitedLocations: string[];
  revealedLocations?: string[];
}

type RoomVisibility = 'current' | 'visited' | 'adjacent' | 'unknown';

const PALETTE = {
  unknown: { bg: '#1a1a1a', border: '#303030', text: '#6e6e6e' },
  adjacent: { bg: '#141414', border: '#e6e6e6', text: '#f2f2f2' },
  visited: { bg: '#1a5c32', border: '#2d9651', text: '#a8f0be' },
  current: { bg: '#1a5c32', border: '#6bff9a', text: '#eafff1' }
};

const CONNECTOR_COLOR = '#f2f2f2';
const BACKGROUND_COLOR = '#08080c';
const GRID_COLOR = '#1a1a24';

export function MapCanvas({
  scenario,
  currentLocation,
  visitedLocations,
  revealedLocations = []
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build layout data from scenario
  const layoutData = useMemo(() => {
    const { locations, displayNames, meta } = buildLocationGraphFromScenario(scenario);
    if (Object.keys(locations).length === 0) return null;

    const result = generateLayoutWithConnectors(locations, { totalTries: 10 });
    return { result, displayNames, meta, locations };
  }, [scenario]);

  // Get current location connections for adjacency detection
  const currentConnections = useMemo(() => {
    if (!layoutData) return new Set<string>();
    const normalizedCurrent = normalizeLocationName(currentLocation);
    const connections = layoutData.locations[normalizedCurrent]?.connections || [];
    return new Set(connections.map(normalizeLocationName));
  }, [layoutData, currentLocation]);

  // Normalize sets for quick lookup
  const normalizedVisited = useMemo(
    () => new Set(visitedLocations.map(normalizeLocationName)),
    [visitedLocations]
  );
  const normalizedRevealed = useMemo(
    () => new Set(revealedLocations.map(normalizeLocationName)),
    [revealedLocations]
  );
  const normalizedCurrent = useMemo(
    () => normalizeLocationName(currentLocation),
    [currentLocation]
  );

  // Helper to determine room visibility
  const getVisibility = useCallback((name: string): RoomVisibility => {
    if (name === normalizedCurrent) return 'current';
    if (normalizedVisited.has(name)) return 'visited';
    if (currentConnections.has(name) || normalizedRevealed.has(name)) return 'adjacent';
    return 'unknown';
  }, [normalizedCurrent, normalizedVisited, normalizedRevealed, currentConnections]);

  // Draw function
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!layoutData) return;

    const { result, displayNames, meta } = layoutData;
    const { layout, connectors } = result;
    const { CELL_SIZE, ROOM_PADDING, CONNECTOR_WIDTH } = MAP_CONFIG;

    // Calculate canvas dimensions from grid
    const canvasWidth = layout.gridSize.cols * CELL_SIZE;
    const canvasHeight = layout.gridSize.rows * CELL_SIZE;

    // Scale to fit container while maintaining aspect ratio
    const scaleX = width / canvasWidth;
    const scaleY = height / canvasHeight;
    const scale = Math.min(scaleX, scaleY);

    // Clear canvas
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Center the map
    const offsetX = (width - canvasWidth * scale) / 2;
    const offsetY = (height - canvasHeight * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw grid (subtle debug lines)
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let x = 0; x <= layout.gridSize.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, layout.gridSize.rows * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= layout.gridSize.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(layout.gridSize.cols * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw connectors
    const drawConnector = (conn: Connector) => {
      const { path, fromPoint, toPoint } = conn;

      ctx.strokeStyle = CONNECTOR_COLOR;
      ctx.lineWidth = Math.max(4, CONNECTOR_WIDTH + 2);
      ctx.lineCap = 'square';

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();

      // Connection points
      ctx.fillStyle = CONNECTOR_COLOR;
      const dotSize = CONNECTOR_WIDTH + 2;
      ctx.fillRect(fromPoint.x - dotSize / 2, fromPoint.y - dotSize / 2, dotSize, dotSize);
      ctx.fillRect(toPoint.x - dotSize / 2, toPoint.y - dotSize / 2, dotSize, dotSize);
    };

    for (const conn of connectors) {
      drawConnector(conn);
    }

    // Draw scanlines helper
    const drawScanlines = (x: number, y: number, w: number, h: number) => {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#000000';
      for (let i = 0; i < h; i += 4) {
        ctx.fillRect(x, y + i, w, 1);
      }
      ctx.restore();
    };

    // Draw rooms
    const drawRoom = (
      name: string,
      gridX: number,
      gridY: number,
      height: number,
      visibility: RoomVisibility,
      dangerLevel: number
    ) => {
      const x = gridX * CELL_SIZE + ROOM_PADDING;
      const y = gridY * CELL_SIZE + ROOM_PADDING;
      const w = CELL_SIZE - ROOM_PADDING * 2;
      const h = CELL_SIZE * height - ROOM_PADDING * 2;

      const colors = PALETTE[visibility];

      // Background
      ctx.fillStyle = colors.bg;
      ctx.fillRect(x, y, w, h);

      // Border
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = visibility === 'current' ? 3 : 2;
      ctx.strokeRect(x, y, w, h);

      // Scanlines effect
      drawScanlines(x, y, w, h);

      // Text
      ctx.fillStyle = colors.text;
      ctx.font = '11px "JetBrains Mono", Consolas, Monaco, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const label = visibility === 'unknown' ? '[ ? ? ? ]' : name.toUpperCase();
      const words = label.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      const maxWidth = w - 10;

      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = 14;
      const startY = y + h / 2 - (lines.length - 1) * lineHeight / 2;

      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x + w / 2, startY + i * lineHeight);
      }

      // Danger indicator
      if ((visibility === 'current' || visibility === 'visited') && dangerLevel > 0) {
        const size = 8;
        const pad = 4;
        ctx.fillStyle = '#8f2d2d';
        ctx.fillRect(x + w - size - pad, y + pad, size, size);
      }
    };

    // Render each room
    for (const [name, pos] of Object.entries(layout.positions)) {
      const height = layout.roomSizes[name]?.height || 1;
      const visibility = getVisibility(name);
      const displayName = displayNames?.[name] || name;
      const dangerLevel = meta?.[name]?.dangers?.length || 0;

      drawRoom(displayName, pos.x, pos.y, height, visibility, dangerLevel);
    }

    ctx.restore();
  }, [layoutData, getVisibility]);

  // Canvas resize and redraw effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeAndDraw = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size with device pixel ratio for sharp rendering
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      draw(ctx, rect.width, rect.height);
    };

    resizeAndDraw();

    // Observe container resize
    const resizeObserver = new ResizeObserver(resizeAndDraw);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [draw]);

  if (!layoutData) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-dim)]">
        Aucune carte disponible
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
