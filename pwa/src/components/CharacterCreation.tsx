import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { CHARACTER_CLASSES, type CharacterClass } from '../types/game';

export function CharacterCreation() {
  const createCharacter = useGameStore((state) => state.createCharacter);

  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);

  const handleCreate = () => {
    if (name.trim() && selectedClass) {
      createCharacter(name.trim(), selectedClass);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-void)]">
      {/* Header */}
      <div className="p-4 text-center border-b border-[var(--color-panel)]">
        <h1 className="text-xl font-bold text-[var(--color-accent)]">
          Création de personnage
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Name input */}
        <div className="mb-6">
          <label className="block text-sm text-[var(--color-text-dim)] mb-2">
            Nom du personnage
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Entrez un nom..."
            className="w-full p-3 bg-[var(--color-steel)] border border-[var(--color-panel)]
                       rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-dim)]
                       focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Class selection */}
        <div className="mb-6">
          <label className="block text-sm text-[var(--color-text-dim)] mb-2">
            Classe
          </label>
          <div className="flex flex-col gap-2">
            {CHARACTER_CLASSES.map((charClass) => (
              <button
                key={charClass.name}
                className={`
                  p-4 text-left rounded-lg border transition-all
                  ${selectedClass?.name === charClass.name
                    ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]'
                    : 'bg-[var(--color-steel)] border-[var(--color-panel)] hover:border-[var(--color-accent)]/50'}
                `}
                onClick={() => setSelectedClass(charClass)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{charClass.name}</h3>
                    <p className="text-sm text-[var(--color-text-dim)]">
                      {charClass.description}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[var(--color-text-dim)]">
                    <div>❤️ {charClass.hp}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-2 text-sm">
                  <span className={charClass.stats.FOR >= 4 ? 'text-[var(--color-success)]' : ''}>
                    FOR: {charClass.stats.FOR}
                  </span>
                  <span className={charClass.stats.INT >= 4 ? 'text-[var(--color-success)]' : ''}>
                    INT: {charClass.stats.INT}
                  </span>
                  <span className={charClass.stats.CHA >= 4 ? 'text-[var(--color-success)]' : ''}>
                    CHA: {charClass.stats.CHA}
                  </span>
                </div>

                {/* Starting items */}
                <div className="mt-2 text-xs text-[var(--color-text-dim)]">
                  🎒 {charClass.startingInventory.join(', ')}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-panel)]">
        <button
          className="w-full btn bg-[var(--color-accent)] text-white
                     disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreate}
          disabled={!name.trim() || !selectedClass}
        >
          Commencer l'aventure
        </button>
      </div>
    </div>
  );
}
