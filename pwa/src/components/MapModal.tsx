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

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-steel)] w-full max-w-md max-h-[80vh] rounded-t-2xl overflow-hidden animate-fade-in flex flex-col"
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

        {/* Spatial map canvas */}
        <div className="flex-1 min-h-[200px]">
          <MapCanvas
            scenario={scenario}
            currentLocation={currentLocation}
            visitedLocations={visitedLocations}
          />
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-[var(--color-panel)] text-xs text-[var(--color-text-dim)] flex gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 border-2 border-[#6bff9a] bg-[#1a5c32] rounded-sm" />
            Position actuelle
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 border-2 border-[#2d9651] bg-[#1a5c32] rounded-sm" />
            Visité
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 border-2 border-[#e6e6e6] bg-[#141414] rounded-sm" />
            Adjacent
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 border border-[#303030] bg-[#1a1a1a] rounded-sm" />
            Inconnu
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-[#8f2d2d] rounded-sm" />
            Danger
          </span>
        </div>
      </div>
    </div>
  );
}
