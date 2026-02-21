import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { SaveMetadata } from '../services/storage';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveLoadModal({ isOpen, onClose }: SaveLoadModalProps) {
  const saves = useGameStore((state) => state.saves);
  const refreshSaves = useGameStore((state) => state.refreshSaves);
  const loadSavedGame = useGameStore((state) => state.loadSavedGame);
  const deleteSavedGame = useGameStore((state) => state.deleteSavedGame);
  const isLoading = useGameStore((state) => state.isLoading);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshSaves();
    }
  }, [isOpen, refreshSaves]);

  if (!isOpen) return null;

  const handleLoad = async (sessionId: string) => {
    await loadSavedGame(sessionId);
    onClose();
  };

  const handleDelete = async (sessionId: string) => {
    if (confirmDelete === sessionId) {
      await deleteSavedGame(sessionId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(sessionId);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-steel)] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-void)]">
          <h2 className="text-lg font-bold text-[var(--color-text-bright)]">
            Sauvegardes
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
          {saves.length === 0 ? (
            <p className="text-center text-[var(--color-text-dim)] py-8">
              Aucune sauvegarde trouvée
            </p>
          ) : (
            <div className="space-y-3">
              {saves.map((save) => (
                <SaveCard
                  key={save.sessionId}
                  save={save}
                  isDeleting={confirmDelete === save.sessionId}
                  isLoading={isLoading}
                  onLoad={() => handleLoad(save.sessionId)}
                  onDelete={() => handleDelete(save.sessionId)}
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

interface SaveCardProps {
  save: SaveMetadata;
  isDeleting: boolean;
  isLoading: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  formatDate: (date: string) => string;
}

function SaveCard({
  save,
  isDeleting,
  isLoading,
  onLoad,
  onDelete,
  onCancelDelete,
  formatDate
}: SaveCardProps) {
  return (
    <div className="bg-[var(--color-void)] rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-[var(--color-text-bright)]">
            {save.playerName}
          </h3>
          <p className="text-xs text-[var(--color-text-dim)]">
            {save.className} - {save.scenarioTitle}
          </p>
        </div>
        <span className="text-xs text-[var(--color-text-dim)]">
          {formatDate(save.savedAt)}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="text-[var(--color-danger)]">
          PV: {save.hp}/{save.maxHp}
        </span>
        <span className="text-[var(--color-info)]">
          Progression: {save.progress}%
        </span>
        <span className="text-[var(--color-text-dim)]">
          Tour {save.turnNumber}
        </span>
      </div>

      <div className="flex gap-2">
        {isDeleting ? (
          <>
            <button
              className="flex-1 btn bg-red-700 text-white text-sm"
              onClick={onDelete}
              disabled={isLoading}
            >
              Confirmer
            </button>
            <button
              className="flex-1 btn bg-[var(--color-steel)] text-[var(--color-text)] text-sm"
              onClick={onCancelDelete}
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              className="flex-1 btn bg-[var(--color-accent)] text-white text-sm"
              onClick={onLoad}
              disabled={isLoading}
            >
              Charger
            </button>
            <button
              className="btn bg-[var(--color-steel)] text-red-400 text-sm px-3"
              onClick={onDelete}
              disabled={isLoading}
            >
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
