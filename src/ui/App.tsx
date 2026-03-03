// ---------------------------------------------------------------------------
// src/ui/App.tsx — Root component with screen router
// ---------------------------------------------------------------------------

import { useGameStore } from '@stores/gameStore';
import { Scanlines } from './components/Scanlines';
import { TitleScreen } from './screens/TitleScreen';
import { CharacterCreation } from './screens/CharacterCreation';
import { GameScreen } from './screens/GameScreen';
import { EndScreen } from './screens/EndScreen';

export function App(): JSX.Element {
  const screen = useGameStore((s) => s.screen);

  return (
    <>
      {screen === 'title' && <TitleScreen />}
      {screen === 'creation' && <CharacterCreation />}
      {screen === 'game' && <GameScreen />}
      {screen === 'end' && <EndScreen />}
      <Scanlines />
    </>
  );
}
