interface QuickActionsProps {
  onMapClick: () => void;
  onInventoryClick: () => void;
}

export function QuickActions({ onMapClick, onInventoryClick }: QuickActionsProps) {
  return (
    <div className="flex gap-2 p-2 bg-[var(--color-steel)] border-t border-[var(--color-panel)]">
      <button
        className="flex-1 btn bg-[var(--color-panel)] border border-[var(--color-accent)]/30
                   hover:bg-[var(--color-accent)]/20 text-sm"
        onClick={onMapClick}
      >
        🗺️ Carte
      </button>
      <button
        className="flex-1 btn bg-[var(--color-panel)] border border-[var(--color-accent)]/30
                   hover:bg-[var(--color-accent)]/20 text-sm"
        onClick={onInventoryClick}
      >
        🎒 Inventaire
      </button>
    </div>
  );
}
