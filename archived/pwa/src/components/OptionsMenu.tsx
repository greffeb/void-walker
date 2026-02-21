import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSettings, saveSettings, clearApiKey, type AppSettings } from '../services/storage';

interface OptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OptionsMenu({ isOpen, onClose }: OptionsMenuProps) {
  const reset = useGameStore((state) => state.reset);
  const gameState = useGameStore((state) => state.gameState);
  const saveCurrentGame = useGameStore((state) => state.saveCurrentGame);

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showClearApiConfirm, setShowClearApiConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings({ [key]: value });
  };

  const handleRestart = async () => {
    if (showRestartConfirm) {
      reset();
      onClose();
    } else {
      setShowRestartConfirm(true);
    }
  };

  const handleClearApiKey = async () => {
    if (showClearApiConfirm) {
      await clearApiKey();
      reset();
      onClose();
    } else {
      setShowClearApiConfirm(true);
    }
  };

  const handleSaveAndQuit = async () => {
    if (gameState) {
      await saveCurrentGame();
    }
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-steel)] rounded-lg w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-void)]">
          <h2 className="text-lg font-bold text-[var(--color-text-bright)]">
            Options
          </h2>
          <button
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-bright)] text-2xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Typewriter Speed */}
          {settings && (
            <div>
              <label className="block text-sm text-[var(--color-text-dim)] mb-2">
                Vitesse du texte
              </label>
              <div className="flex gap-2">
                {(['slow', 'normal', 'fast', 'instant'] as const).map((speed) => (
                  <button
                    key={speed}
                    className={`flex-1 btn text-xs ${
                      settings.typewriterSpeed === speed
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-void)] text-[var(--color-text)]'
                    }`}
                    onClick={() => updateSetting('typewriterSpeed', speed)}
                  >
                    {speed === 'slow' && 'Lent'}
                    {speed === 'normal' && 'Normal'}
                    {speed === 'fast' && 'Rapide'}
                    {speed === 'instant' && 'Instant'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Auto-save Toggle */}
          {settings && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-dim)]">
                Sauvegarde automatique
              </span>
              <button
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoSave
                    ? 'bg-[var(--color-accent)]'
                    : 'bg-[var(--color-void)]'
                }`}
                onClick={() => updateSetting('autoSave', !settings.autoSave)}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.autoSave ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[var(--color-void)] pt-4">
            {/* Save and Quit */}
            {gameState && (
              <button
                className="w-full btn bg-[var(--color-void)] text-[var(--color-text)] mb-2"
                onClick={handleSaveAndQuit}
              >
                Sauvegarder et quitter
              </button>
            )}

            {/* Restart Game */}
            <button
              className={`w-full btn mb-2 ${
                showRestartConfirm
                  ? 'bg-red-700 text-white'
                  : 'bg-[var(--color-void)] text-[var(--color-warning)]'
              }`}
              onClick={handleRestart}
            >
              {showRestartConfirm ? 'Confirmer le redémarrage' : 'Recommencer la partie'}
            </button>

            {showRestartConfirm && (
              <button
                className="w-full btn bg-[var(--color-void)] text-[var(--color-text-dim)] text-sm mb-2"
                onClick={() => setShowRestartConfirm(false)}
              >
                Annuler
              </button>
            )}

            {/* Clear API Key */}
            <button
              className={`w-full btn text-sm ${
                showClearApiConfirm
                  ? 'bg-red-700 text-white'
                  : 'bg-[var(--color-void)] text-red-400'
              }`}
              onClick={handleClearApiKey}
            >
              {showClearApiConfirm
                ? 'Confirmer la suppression'
                : 'Effacer la clé API'}
            </button>

            {showClearApiConfirm && (
              <button
                className="w-full btn bg-[var(--color-void)] text-[var(--color-text-dim)] text-sm mt-2"
                onClick={() => setShowClearApiConfirm(false)}
              >
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-void)]">
          <button
            className="w-full btn bg-[var(--color-accent)] text-white"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
