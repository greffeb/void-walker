import { useGameStore } from '../stores/gameStore';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InventoryModal({ isOpen, onClose }: InventoryModalProps) {
  const gameState = useGameStore((state) => state.gameState);

  if (!isOpen || !gameState) return null;

  const { player } = gameState;
  const items = player.inventory;

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'weapon': return '🔫';
      case 'tool': return '🔧';
      case 'consumable': return '💊';
      case 'keyItem': return '🔑';
      case 'data': return '💾';
      default: return '📦';
    }
  };

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
          <h2 className="text-lg font-bold">🎒 Inventaire</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-panel)]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Stats summary */}
        <div className="p-4 bg-[var(--color-void)] border-b border-[var(--color-panel)]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--color-accent)]">{player.stats.FOR}</div>
              <div className="text-xs text-[var(--color-text-dim)]">FORCE</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-success)]">{player.stats.INT}</div>
              <div className="text-xs text-[var(--color-text-dim)]">INTEL</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-warning)]">{player.stats.CHA}</div>
              <div className="text-xs text-[var(--color-text-dim)]">CHARISME</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {items.length === 0 ? (
            <p className="text-center text-[var(--color-text-dim)] py-8">
              Votre inventaire est vide
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="p-3 rounded-lg bg-[var(--color-panel)] border border-[var(--color-void)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getItemIcon(item.itemType)}</span>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-[var(--color-text-dim)]">
                        {item.description}
                      </p>

                      {/* Item details */}
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-[var(--color-void)] text-[var(--color-text-dim)]">
                          {item.itemType}
                        </span>

                        {item.statBonus && (
                          <span className="px-2 py-0.5 rounded bg-[var(--color-success)]/20 text-[var(--color-success)]">
                            +{item.statBonus.bonus} {item.statBonus.stat}
                          </span>
                        )}

                        {item.uses !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-[var(--color-warning)]/20 text-[var(--color-warning)]">
                            {item.uses} utilisation{item.uses > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-panel)] text-center text-xs text-[var(--color-text-dim)]">
          {items.length} objet{items.length > 1 ? 's' : ''} • {player.name} ({player.className})
        </div>
      </div>
    </div>
  );
}
