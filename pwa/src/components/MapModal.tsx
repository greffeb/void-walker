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
  const locations = Object.values(scenario.locations);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-steel)] w-full max-w-md max-h-[80vh] rounded-t-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-panel)]">
          <h2 className="text-lg font-bold">🗺️ Carte</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-panel)]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-2">
            {locations.map((location) => {
              const isCurrentLocation = location.name === currentLocation;
              const isVisited = visitedLocations.includes(location.name);
              const isDiscovered = location.discovered || isVisited;

              return (
                <div
                  key={location.name}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${isCurrentLocation
                      ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]'
                      : isDiscovered
                        ? 'bg-[var(--color-panel)] border-[var(--color-panel)]'
                        : 'bg-[var(--color-void)] border-[var(--color-void)] opacity-50'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {isCurrentLocation && <span>📍</span>}
                    {!isCurrentLocation && isVisited && <span className="text-[var(--color-success)]">✓</span>}
                    {!isDiscovered && <span>❓</span>}
                    <span className={`font-medium ${!isDiscovered ? 'text-[var(--color-text-dim)]' : ''}`}>
                      {isDiscovered ? location.name : '???'}
                    </span>
                  </div>

                  {isDiscovered && (
                    <>
                      <p className="text-sm text-[var(--color-text-dim)] mt-1">
                        {location.description}
                      </p>

                      {/* Connections */}
                      {location.connections.length > 0 && (
                        <div className="mt-2 text-xs text-[var(--color-text-dim)]">
                          <span>Connecté à : </span>
                          {location.connections.map((conn, i) => (
                            <span key={conn}>
                              <span className={visitedLocations.includes(conn) ? 'text-[var(--color-success)]' : ''}>
                                {conn}
                              </span>
                              {i < location.connections.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dangers indicator */}
                      {location.dangers.length > 0 && (
                        <div className="mt-1 text-xs text-[var(--color-accent)]">
                          ⚠️ Zone dangereuse
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-[var(--color-panel)] text-xs text-[var(--color-text-dim)]">
            <div className="flex gap-4">
              <span>📍 Position actuelle</span>
              <span className="text-[var(--color-success)]">✓ Visité</span>
              <span>❓ Inconnu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
