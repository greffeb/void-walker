import { useGameStore } from '../stores/gameStore';
import { MapCanvas } from './MapCanvas';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MapModal({ isOpen, onClose }: MapModalProps) {
  const gameState = useGameStore((state) => state.gameState);

  if (!isOpen || !gameState) return null;

  const { scenario, currentLocation, visitedLocations } = gameState;

  // Get revealed locations (adjacent to visited locations)
  const revealedLocations = Object.values(scenario.locations)
    .filter(loc => loc.discovered)
    .map(loc => loc.name);

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-fade-in"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-[var(--color-panel)] bg-[var(--color-void)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[var(--color-text)]">Carte</h2>
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-panel)] text-[var(--color-text)] hover:bg-[var(--color-steel)] transition-colors"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Map Canvas - Full height */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <MapCanvas
          scenario={scenario}
          currentLocation={currentLocation}
          visitedLocations={visitedLocations}
          revealedLocations={revealedLocations}
        />
      </div>

      {/* Legend */}
      <div
        className="p-4 border-t border-[var(--color-panel)] bg-[var(--color-void)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--color-text-dim)]">
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: '#1a5c32',
                borderColor: '#6bff9a'
              }}
            />
            <span>Position actuelle</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: '#1a5c32',
                borderColor: '#2d9651'
              }}
            />
            <span>Lieu explore</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: '#141414',
                borderColor: '#e6e6e6'
              }}
            />
            <span>Lieu adjacent</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: '#1a1a1a',
                borderColor: '#303030'
              }}
            />
            <span>Inconnu</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: '#8f2d2d' }}
            />
            <span>Zone dangereuse</span>
          </div>
        </div>
      </div>
    </div>
  );
}
