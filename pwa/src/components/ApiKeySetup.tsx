import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

export function ApiKeySetup() {
  const setApiKey = useGameStore((state) => state.setApiKey);
  const setPhase = useGameStore((state) => state.setPhase);

  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      setPhase('character-creation');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-void)]">
      {/* Header */}
      <div className="p-4 text-center border-b border-[var(--color-panel)]">
        <h1 className="text-xl font-bold text-[var(--color-accent)]">
          Configuration API
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <p className="text-[var(--color-text-dim)] mb-6 text-sm">
            Void Walker utilise l'API Google Gemini pour générer les scénarios.
            Vous pouvez obtenir une clé API gratuite sur Google AI Studio.
          </p>

          {/* Instructions */}
          <div className="bg-[var(--color-steel)] p-4 rounded-lg mb-6 text-sm">
            <h3 className="font-bold mb-2">Comment obtenir une clé :</h3>
            <ol className="list-decimal list-inside text-[var(--color-text-dim)] space-y-1">
              <li>Allez sur <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] underline"
                >
                  Google AI Studio
                </a>
              </li>
              <li>Connectez-vous avec votre compte Google</li>
              <li>Cliquez sur "Create API Key"</li>
              <li>Copiez la clé et collez-la ci-dessous</li>
            </ol>
          </div>

          {/* API Key input */}
          <div className="mb-6">
            <label className="block text-sm text-[var(--color-text-dim)] mb-2">
              Clé API Google
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-3 pr-12 bg-[var(--color-steel)] border border-[var(--color-panel)]
                           rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-dim)]
                           focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Security note */}
          <p className="text-xs text-[var(--color-text-dim)] mb-6">
            🔒 Votre clé est stockée localement dans votre navigateur et n'est jamais envoyée à nos serveurs.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-panel)]">
        <div className="flex gap-2">
          <button
            className="flex-1 btn bg-[var(--color-panel)] border border-[var(--color-text-dim)]
                       text-[var(--color-text-dim)]"
            onClick={() => setPhase('title')}
          >
            Retour
          </button>
          <button
            className="flex-1 btn bg-[var(--color-accent)] text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!key.trim()}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
