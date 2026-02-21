import { useGameStore } from './stores/gameStore';
import { TitleScreen } from './components/TitleScreen';
import { ApiKeySetup } from './components/ApiKeySetup';
import { CharacterCreation } from './components/CharacterCreation';
import { GameScreen } from './components/GameScreen';

function App() {
  const phase = useGameStore((state) => state.phase);

  return (
    <div className="h-full max-w-md mx-auto bg-[var(--color-void)] overflow-hidden">
      {phase === 'title' && <TitleScreen />}
      {phase === 'api-key-setup' && <ApiKeySetup />}
      {phase === 'character-creation' && <CharacterCreation />}
      {(phase === 'scenario-generation' || phase === 'playing' || phase === 'dice-roll' || phase === 'game-over') && (
        <GameScreen />
      )}
    </div>
  );
}

export default App;
