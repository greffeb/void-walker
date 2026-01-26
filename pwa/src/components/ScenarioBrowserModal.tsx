import { useEffect, useState } from 'react';
import type { ScenarioMetadata } from '../services/storage';
import {
  listScenarios,
  loadScenario,
  deleteScenario,
} from '../services/storage';
import { useGameStore } from '../stores/gameStore';

interface ScenarioBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScenarioBrowserModal({ isOpen, onClose }: ScenarioBrowserModalProps) {
  const [scenarios, setScenarios] = useState<ScenarioMetadata[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [viewingDetails, setViewingDetails] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startGame = useGameStore((state) => state.startGame);

  useEffect(() => {
    if (isOpen) {
      loadScenarios();
    }
  }, [isOpen]);

  const loadScenarios = async () => {
    try {
      const scenarioList = await listScenarios();
      setScenarios(scenarioList);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  };

  const handlePlayScenario = async (id: string) => {
    setIsLoading(true);
    try {
      const scenario = await loadScenario(id);
      if (scenario) {
        startGame(scenario);
        onClose();
      }
    } catch (error) {
      console.error('Failed to load scenario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete === id) {
      try {
        await deleteScenario(id);
        await loadScenarios(); // Refresh list
        setConfirmDelete(null);
      } catch (error) {
        console.error('Failed to delete scenario:', error);
      }
    } else {
      setConfirmDelete(id);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-steel)] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-void)]">
          <h2 className="text-lg font-bold text-[var(--color-text-bright)]">
            Bibliothèque de Scénarios
          </h2>
          <button
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-bright)] text-2xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {scenarios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-dim)] mb-4">
                Aucun scénario sauvegardé
              </p>
              <p className="text-xs text-[var(--color-text-dim)]">
                Les scénarios générés sont automatiquement sauvegardés ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  isSelected={selectedScenario === scenario.id}
                  isViewingDetails={viewingDetails === scenario.id}
                  isDeleting={confirmDelete === scenario.id}
                  isLoading={isLoading}
                  onSelect={() => setSelectedScenario(scenario.id)}
                  onViewDetails={() =>
                    setViewingDetails(
                      viewingDetails === scenario.id ? null : scenario.id
                    )
                  }
                  onPlay={() => handlePlayScenario(scenario.id)}
                  onDelete={() => handleDelete(scenario.id)}
                  onCancelDelete={() => setConfirmDelete(null)}
                  formatDate={formatDate}
                />
              ))}
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

interface ScenarioCardProps {
  scenario: ScenarioMetadata;
  isSelected: boolean;
  isViewingDetails: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  onPlay: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  formatDate: (date: string) => string;
}

function ScenarioCard({
  scenario,
  isViewingDetails,
  isDeleting,
  isLoading,
  onViewDetails,
  onPlay,
  onDelete,
  onCancelDelete,
  formatDate,
}: ScenarioCardProps) {
  return (
    <div className="bg-[var(--color-void)] rounded-lg p-3">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-[var(--color-text-bright)] mb-1">
            {scenario.title}
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-[var(--color-text-dim)]">
              {scenario.settingType}
            </span>
            <span className="text-[var(--color-text-dim)]">•</span>
            <span className="text-[var(--color-info)]">
              {scenario.locationCount} lieux
            </span>
            <span className="text-[var(--color-text-dim)]">•</span>
            <span
              className={`${
                scenario.estimatedDifficulty === 'easy'
                  ? 'text-green-400'
                  : scenario.estimatedDifficulty === 'hard'
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}
            >
              {scenario.estimatedDifficulty}
            </span>
          </div>
        </div>
        <span className="text-xs text-[var(--color-text-dim)] ml-2">
          {formatDate(scenario.savedAt)}
        </span>
      </div>

      {/* Details Section (collapsible) */}
      {isViewingDetails && (
        <div className="mb-3 p-2 bg-black/30 rounded text-xs text-[var(--color-text-dim)]">
          <p>
            <strong className="text-[var(--color-text)]">Type:</strong>{' '}
            {scenario.settingType}
          </p>
          <p>
            <strong className="text-[var(--color-text)]">Locations:</strong>{' '}
            {scenario.locationCount}
          </p>
          <p>
            <strong className="text-[var(--color-text)]">Difficulté:</strong>{' '}
            {scenario.estimatedDifficulty}
          </p>
          <p className="mt-1 text-[var(--color-text-dim)] italic">
            Sauvegardé le {formatDate(scenario.savedAt)}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isDeleting ? (
          <>
            <button
              className="flex-1 btn bg-red-700 text-white text-sm"
              onClick={onDelete}
              disabled={isLoading}
            >
              ⚠ Confirmer suppression
            </button>
            <button
              className="btn bg-[var(--color-steel)] text-[var(--color-text)] text-sm px-3"
              onClick={onCancelDelete}
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              className="flex-1 btn bg-[var(--color-accent)] text-white text-sm"
              onClick={onPlay}
              disabled={isLoading}
            >
              Jouer
            </button>
            <button
              className="btn bg-[var(--color-steel)] text-[var(--color-info)] text-sm px-3"
              onClick={onViewDetails}
              title="Voir les détails"
            >
              👁
            </button>
            <button
              className="btn bg-[var(--color-steel)] text-red-400 text-sm px-3"
              onClick={onDelete}
              disabled={isLoading}
              title="Supprimer"
            >
              🗑
            </button>
          </>
        )}
      </div>
    </div>
  );
}
