import { useGameStore } from '../stores/gameStore';

export function StatusBar() {
  const gameState = useGameStore((state) => state.gameState);

  if (!gameState) return null;

  const { player, currentLocation, progress } = gameState;
  const hpPercent = (player.hp / player.maxHp) * 100;
  const oxygenPercent = player.oxygen;
  const progressPercent = Math.round((progress.currentScene / progress.totalScenes) * 100);

  return (
    <div className="bg-[var(--color-steel)] border-b border-[var(--color-panel)] px-3 py-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {/* HP */}
        <div className="status-item">
          <span className={hpPercent <= 30 ? 'text-[var(--color-accent)]' : ''}>
            {hpPercent <= 30 ? '💔' : '❤️'}
          </span>
          <span className={hpPercent <= 30 ? 'text-[var(--color-accent)]' : ''}>
            {player.hp}/{player.maxHp}
          </span>
        </div>

        {/* Oxygen */}
        <div className="status-item">
          <span className={oxygenPercent <= 30 ? 'text-[var(--color-warning)]' : ''}>
            🫁
          </span>
          <span className={oxygenPercent <= 30 ? 'text-[var(--color-warning)]' : ''}>
            {oxygenPercent}%
          </span>
        </div>

        {/* Location */}
        <div className="status-item">
          <span>📍</span>
          <span className="truncate">{currentLocation}</span>
        </div>

        {/* Inventory count */}
        <div className="status-item">
          <span>🎒</span>
          <span>{player.inventory.length}</span>
        </div>

        {/* Progress bar */}
        <div className="col-span-2 mt-1">
          <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-dim)]">
            <span>{progress.currentBeat.toUpperCase()}</span>
            <div className="flex-1 h-1 bg-[var(--color-void)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{progressPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
