import type { Scenario } from '../types/game';

interface FullScenarioModalProps {
  isOpen: boolean;
  scenario: Scenario | null;
  onClose: () => void;
}

export function FullScenarioModal({ isOpen, scenario, onClose }: FullScenarioModalProps) {
  if (!isOpen || !scenario) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-steel)] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-void)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-bright)]">
              Détails Complets du Scénario
            </h2>
            <p className="text-xs text-red-400">⚠️ ATTENTION: SPOILERS!</p>
          </div>
          <button
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-bright)] text-2xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Basic Info */}
          <div>
            <h3 className="text-base font-bold text-[var(--color-text-bright)] mb-2">
              Informations Générales
            </h3>
            <div className="bg-[var(--color-void)] p-3 rounded space-y-1 text-sm">
              <p>
                <strong className="text-[var(--color-text)]">Titre:</strong>{' '}
                {scenario.title}
              </p>
              <p>
                <strong className="text-[var(--color-text)]">Lieu:</strong>{' '}
                {scenario.setting}
              </p>
              <p>
                <strong className="text-[var(--color-text)]">Condition de victoire:</strong>{' '}
                {scenario.victoryCondition}
              </p>
              <p className="text-[var(--color-text-dim)] mt-2">{scenario.intro}</p>
            </div>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-base font-bold text-[var(--color-text-bright)] mb-2">
              Lieux ({Object.keys(scenario.locations || {}).length})
            </h3>
            <div className="space-y-2">
              {Object.entries(scenario.locations || {}).map(([id, location]) => (
                <div key={id} className="bg-[var(--color-void)] p-3 rounded text-sm">
                  <h4 className="font-semibold text-[var(--color-text-bright)]">
                    {location.name}
                    <span className="text-xs text-[var(--color-text-dim)] ml-2">
                      ({id})
                    </span>
                  </h4>
                  <p className="text-[var(--color-text-dim)] text-xs mt-1">
                    {location.description.substring(0, 200)}...
                  </p>
                  {location.connections && location.connections.length > 0 && (
                    <p className="text-xs text-[var(--color-info)] mt-1">
                      Connexions: {location.connections.join(', ')}
                    </p>
                  )}
                  {location.npcs && location.npcs.length > 0 && (
                    <p className="text-xs text-[var(--color-success)] mt-1">
                      PNJs: {location.npcs.join(', ')}
                    </p>
                  )}
                  {location.secrets && location.secrets.length > 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Secrets: {location.secrets.length} secret(s)
                    </p>
                  )}
                  {location.dangers && location.dangers.length > 0 && (
                    <p className="text-xs text-red-400 mt-1">
                      Dangers: {location.dangers.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* NPCs */}
          {scenario.npcs && Object.keys(scenario.npcs).length > 0 && (
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-bright)] mb-2">
                PNJs ({Object.keys(scenario.npcs).length})
              </h3>
              <div className="space-y-2">
                {Object.entries(scenario.npcs).map(([id, npc]) => (
                  <div key={id} className="bg-[var(--color-void)] p-3 rounded text-sm">
                    <h4 className="font-semibold text-[var(--color-text-bright)]">
                      {npc.name}
                      <span className="text-xs text-[var(--color-text-dim)] ml-2">
                        ({id})
                      </span>
                    </h4>
                    <p className="text-[var(--color-text-dim)] text-xs mt-1">
                      {npc.description}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-[var(--color-text-dim)]">
                        Position: {npc.location}
                      </span>
                      <span
                        className={`${
                          npc.disposition === 'friendly'
                            ? 'text-green-400'
                            : npc.disposition === 'hostile'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {npc.disposition}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secrets */}
          {scenario.secrets && scenario.secrets.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-bright)] mb-2">
                Secrets ({scenario.secrets.length})
              </h3>
              <div className="space-y-2">
                {scenario.secrets.map((secret, idx) => (
                  <div key={idx} className="bg-[var(--color-void)] p-3 rounded text-sm">
                    <p className="text-[var(--color-text-dim)]">{secret}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-void)]">
          <button
            className="w-full btn bg-[var(--color-void)] text-[var(--color-text)]"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
