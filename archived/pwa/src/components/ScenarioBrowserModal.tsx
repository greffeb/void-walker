import { useEffect, useState } from 'react';
import type { Scenario } from '../types/game';
import type { ScenarioMetadata } from '../services/storage';
import {
  listScenarios,
  loadScenario,
  deleteScenario,
} from '../services/storage';
import { useGameStore } from '../stores/gameStore';
import { PRESET_SCENARIOS, loadPresetScenario } from '../data/presets';
import { FullScenarioModal } from './FullScenarioModal';

interface PresetScenarioMeta {
  id: string;
  title: string;
  description: string;
  filename: string;
  isPreset: true;
}

interface UserScenarioMeta extends ScenarioMetadata {
  isPreset: false;
}

type CombinedScenarioMeta = PresetScenarioMeta | UserScenarioMeta;

interface ScenarioBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScenarioBrowserModal({ isOpen, onClose }: ScenarioBrowserModalProps) {
  const [userScenarios, setUserScenarios] = useState<ScenarioMetadata[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fullScenario, setFullScenario] = useState<Scenario | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const startGame = useGameStore((state) => state.startGame);

  useEffect(() => {
    if (isOpen) {
      loadUserScenarios();
    }
  }, [isOpen]);

  const loadUserScenarios = async () => {
    try {
      const scenarioList = await listScenarios();
      setUserScenarios(scenarioList);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  };

  // Build combined list
  const presetMetas: PresetScenarioMeta[] = PRESET_SCENARIOS.map((preset, idx) => ({
    id: `preset_${idx}`,
    title: preset.title,
    description: preset.description,
    filename: preset.filename,
    isPreset: true as const,
  }));

  const userMetas: UserScenarioMeta[] = userScenarios.map((scenario) => ({
    ...scenario,
    isPreset: false as const,
  }));

  const allScenarios: CombinedScenarioMeta[] = [...presetMetas, ...userMetas];

  const handlePlayScenario = async (scenarioMeta: CombinedScenarioMeta) => {
    setIsLoading(true);
    try {
      let scenario: Scenario;

      if (scenarioMeta.isPreset) {
        scenario = await loadPresetScenario(scenarioMeta.filename);
      } else {
        const loaded = await loadScenario(scenarioMeta.id);
        if (!loaded) {
          throw new Error('Failed to load scenario');
        }
        scenario = loaded;
      }

      startGame(scenario);
      onClose();
    } catch (error) {
      console.error('Failed to load scenario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowFullDetails = async (scenarioMeta: CombinedScenarioMeta) => {
    setIsLoading(true);
    try {
      let scenario: Scenario;

      if (scenarioMeta.isPreset) {
        scenario = await loadPresetScenario(scenarioMeta.filename);
      } else {
        const loaded = await loadScenario(scenarioMeta.id);
        if (!loaded) {
          throw new Error('Failed to load scenario');
        }
        scenario = loaded;
      }

      setFullScenario(scenario);
      setShowFullDetails(true);
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
        await loadUserScenarios(); // Refresh list
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
    <>
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
            {/* Preset Scenarios */}
            {presetMetas.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-[var(--color-text-bright)] mb-3">
                  📚 Scénarios Prédéfinis
                </h3>
                <div className="space-y-3">
                  {presetMetas.map((scenario) => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      isDeleting={false}
                      isLoading={isLoading}
                      onPlay={() => handlePlayScenario(scenario)}
                      onShowFull={() => handleShowFullDetails(scenario)}
                      onDelete={() => {}}
                      onCancelDelete={() => {}}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* User Scenarios */}
            {userMetas.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-bright)] mb-3">
                  💾 Vos Scénarios
                </h3>
                <div className="space-y-3">
                  {userMetas.map((scenario) => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      isDeleting={confirmDelete === scenario.id}
                      isLoading={isLoading}
                      onPlay={() => handlePlayScenario(scenario)}
                      onShowFull={() => handleShowFullDetails(scenario)}
                      onDelete={() => handleDelete(scenario.id)}
                      onCancelDelete={() => setConfirmDelete(null)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {allScenarios.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[var(--color-text-dim)] mb-4">
                  Aucun scénario disponible
                </p>
                <p className="text-xs text-[var(--color-text-dim)]">
                  Les scénarios générés sont automatiquement sauvegardés ici.
                </p>
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

      {/* Full Details Modal */}
      <FullScenarioModal
        isOpen={showFullDetails}
        scenario={fullScenario}
        onClose={() => {
          setShowFullDetails(false);
          setFullScenario(null);
        }}
      />
    </>
  );
}

interface ScenarioCardProps {
  scenario: CombinedScenarioMeta;
  isDeleting: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onShowFull: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  formatDate: (date: string) => string;
}

function ScenarioCard({
  scenario,
  isDeleting,
  isLoading,
  onPlay,
  onShowFull,
  onDelete,
  onCancelDelete,
  formatDate,
}: ScenarioCardProps) {
  const isDeletable = !scenario.isPreset;

  return (
    <div className="bg-[var(--color-void)] rounded-lg p-3">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-[var(--color-text-bright)] mb-1">
            {scenario.title}
            {scenario.isPreset && (
              <span className="text-xs text-[var(--color-text-dim)] ml-2">(prédéfini)</span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {scenario.isPreset ? (
              <span className="text-[var(--color-text-dim)]">{scenario.description}</span>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        {!scenario.isPreset && (
          <span className="text-xs text-[var(--color-text-dim)] ml-2">
            {formatDate(scenario.savedAt)}
          </span>
        )}
      </div>

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
              className="btn bg-[var(--color-steel)] text-[var(--color-warning)] text-sm px-3"
              onClick={onShowFull}
              disabled={isLoading}
              title="Lire le scénario complet (spoilers!)"
            >
              📖
            </button>
            {isDeletable && (
              <button
                className="btn bg-[var(--color-steel)] text-red-400 text-sm px-3"
                onClick={onDelete}
                disabled={isLoading}
                title="Supprimer"
              >
                🗑
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
