// ---------------------------------------------------------------------------
// src/ui/components/MapModal.tsx — Location map modal
// ---------------------------------------------------------------------------
// Shows the assembled scenario graph with visited/current/unvisited statuses.
// Nodes are positioned in a simple vertical list grouped by story beat.
// ---------------------------------------------------------------------------

import { useGameStore } from '@stores/gameStore';
import { Modal } from './Modal';
import type { LocationNode } from '@engine/scenario';

interface Props {
  readonly onClose: () => void;
}

const BEAT_LABELS: Record<string, string> = {
  intro: 'INTRO',
  rising: 'EXPLORATION',
  midpoint: 'TOURNANT',
  escalation: 'ESCALADE',
  climax: 'CLIMAX',
  resolution: 'RÉSOLUTION',
};

export function MapModal({ onClose }: Props): JSX.Element {
  const gameState = useGameStore((s) => s.gameState);
  const graph = gameState.scenario?.graph;
  const playerLocationId = gameState.playerLocationId;
  const visitedLocations = gameState.visitedLocations;

  if (!graph) {
    return (
      <Modal title="CARTE" icon="◈" onClose={onClose}>
        <p style={{ color: 'var(--amber-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          Aucune carte disponible.
        </p>
      </Modal>
    );
  }

  // Group nodes by story beat
  const beats = ['intro', 'rising', 'midpoint', 'escalation', 'climax', 'resolution'];
  const nodesByBeat = new Map<string, LocationNode[]>();
  for (const beat of beats) nodesByBeat.set(beat, []);

  for (const node of graph.nodes) {
    const group = nodesByBeat.get(node.beat) ?? [];
    group.push(node);
    nodesByBeat.set(node.beat, group);
  }

  // Build adjacency for the current node to know reachable locations
  const adjacentIds = new Set<string>();
  if (playerLocationId) {
    for (const edge of graph.edges) {
      if (edge.from === playerLocationId) adjacentIds.add(edge.to);
      if (edge.bidirectional && edge.to === playerLocationId) adjacentIds.add(edge.from);
    }
  }

  return (
    <Modal title="CARTE" icon="◈" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {beats.map((beat) => {
          const nodes = nodesByBeat.get(beat) ?? [];
          if (nodes.length === 0) return null;

          return (
            <div key={beat}>
              {/* Beat header */}
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  color: 'var(--amber-dim)',
                  fontFamily: 'var(--font-title)',
                  marginBottom: '6px',
                  borderBottom: '1px solid var(--amber-dim)',
                  paddingBottom: '2px',
                }}
              >
                {BEAT_LABELS[beat] ?? beat.toUpperCase()}
              </div>

              {/* Location nodes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {nodes.map((node) => {
                  const isCurrent = node.id === playerLocationId;
                  const isVisited = node.id in visitedLocations;
                  const isAdjacent = adjacentIds.has(node.id);
                  const isRevealed = isVisited || isAdjacent || isCurrent;

                  return (
                    <NodeEntry
                      key={node.id}
                      node={node}
                      isCurrent={isCurrent}
                      isVisited={isVisited}
                      isAdjacent={isAdjacent}
                      isRevealed={isRevealed}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '10px',
          borderTop: '1px solid var(--amber-dim)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--amber-dim)',
        }}
      >
        <span>
          <span style={{ color: 'var(--amber-glow)' }}>▸</span> Actuel
        </span>
        <span>
          <span style={{ color: 'var(--success)' }}>●</span> Visité
        </span>
        <span>
          <span style={{ color: 'var(--warning)' }}>○</span> Adjacent
        </span>
        <span>
          <span style={{ color: 'var(--amber-dim)' }}>?</span> Inconnu
        </span>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface NodeEntryProps {
  readonly node: LocationNode;
  readonly isCurrent: boolean;
  readonly isVisited: boolean;
  readonly isAdjacent: boolean;
  readonly isRevealed: boolean;
}

function NodeEntry({ node, isCurrent, isVisited, isAdjacent, isRevealed }: NodeEntryProps): JSX.Element {
  const name = node.nameKey.fr || node.nameKey.en || node.id;

  let color = 'var(--amber-dim)';
  let prefix = '?';
  if (isCurrent) {
    color = 'var(--amber-glow)';
    prefix = '▸';
  } else if (isVisited) {
    color = 'var(--success)';
    prefix = '●';
  } else if (isAdjacent) {
    color = 'var(--warning)';
    prefix = '○';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        borderRadius: '2px',
        background: isCurrent ? 'rgba(255, 176, 0, 0.08)' : 'transparent',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
      }}
    >
      <span style={{ color, fontWeight: isCurrent ? 'bold' : 'normal', width: '14px', textAlign: 'center' }}>
        {prefix}
      </span>
      <span style={{ color: isRevealed ? color : 'var(--amber-dim)', opacity: isRevealed ? 1 : 0.4 }}>
        {isRevealed ? name : '???'}
      </span>
      {isCurrent && (
        <span style={{ fontSize: '9px', color: 'var(--amber-dim)', marginLeft: 'auto' }}>
          VOUS ÊTES ICI
        </span>
      )}
    </div>
  );
}
