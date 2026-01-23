import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { StatusBar } from './StatusBar';
import { NarrativePanel } from './NarrativePanel';
import { SuggestionButtons } from './SuggestionButtons';
import { CustomActionInput } from './CustomActionInput';
import { DiceRoll } from './DiceRoll';
import { QuickActions } from './QuickActions';
import { MapModal } from './MapModal';
import { InventoryModal } from './InventoryModal';
import type { DiceResult, Scenario } from '../types/game';

// Mock scenario for testing without API
const MOCK_SCENARIO: Scenario = {
  title: "L'Éveil du Néant",
  intro: `Vous vous réveillez dans l'obscurité. Le bourdonnement familier des systèmes de survie est remplacé par un silence inquiétant.

La Station Erebus-7, votre foyer depuis trois ans, semble différente. Les lumières d'urgence projettent des ombres sanglantes sur les murs métalliques.

Votre terminal personnel affiche un message cryptique : "PROTOCOLE OMEGA INITIÉ - ÉVACUATION IMPOSSIBLE".

Quelque chose ne va pas. Très, très mal.`,
  setting: 'Station spatiale abandonnée',
  locations: {
    'Quartiers d\'équipage': {
      name: 'Quartiers d\'équipage',
      description: 'Votre cabine. Les affaires personnelles sont éparpillées comme après une lutte.',
      connections: ['Couloir principal', 'Infirmerie'],
      secrets: ['Un journal caché sous le matelas'],
      npcs: [],
      dangers: ['Systèmes de vie défaillants'],
      discovered: true
    },
    'Couloir principal': {
      name: 'Couloir principal',
      description: 'Un long corridor plongé dans l\'obscurité. Des marques de griffes strient les murs.',
      connections: ['Quartiers d\'équipage', 'Pont de commandement', 'Baie cargo'],
      secrets: [],
      npcs: [],
      dangers: ['Présence hostile détectée'],
      discovered: false
    },
    'Pont de commandement': {
      name: 'Pont de commandement',
      description: 'Le centre névralgique de la station. Les écrans clignotent de données corrompues.',
      connections: ['Couloir principal'],
      secrets: ['Codes d\'accès au réacteur'],
      npcs: ['IA de bord (dysfonctionnelle)'],
      dangers: [],
      discovered: false
    },
    'Infirmerie': {
      name: 'Infirmerie',
      description: 'L\'infirmerie de bord. Les lits sont vides mais des traces de sang maculent le sol.',
      connections: ['Quartiers d\'équipage'],
      secrets: ['Dossiers médicaux confidentiels'],
      npcs: [],
      dangers: [],
      discovered: false
    },
    'Baie cargo': {
      name: 'Baie cargo',
      description: 'Immense hangar rempli de conteneurs. Quelque chose bouge dans l\'ombre.',
      connections: ['Couloir principal', 'Sas d\'évacuation'],
      secrets: ['Capsule de sauvetage cachée'],
      npcs: [],
      dangers: ['Entité hostile'],
      discovered: false
    },
    'Sas d\'évacuation': {
      name: 'Sas d\'évacuation',
      description: 'Le seul moyen de quitter la station. Mais le sas semble verrouillé.',
      connections: ['Baie cargo'],
      secrets: [],
      npcs: [],
      dangers: [],
      discovered: false
    }
  },
  npcs: {},
  secrets: ['La station cache une expérience biologique secrète'],
  victoryCondition: 'Atteindre le sas d\'évacuation et quitter la station'
};

// Mock suggestions
const MOCK_SUGGESTIONS = [
  'Explorer les quartiers d\'équipage',
  'Vérifier le terminal personnel',
  'Écouter attentivement les bruits environnants'
];

export function GameScreen() {
  const phase = useGameStore((state) => state.phase);
  const gameState = useGameStore((state) => state.gameState);
  const isLoading = useGameStore((state) => state.isLoading);
  const startGame = useGameStore((state) => state.startGame);
  const setLoading = useGameStore((state) => state.setLoading);
  const setSuggestions = useGameStore((state) => state.setSuggestions);
  const setNarrative = useGameStore((state) => state.setNarrative);
  const setPendingDiceRoll = useGameStore((state) => state.setPendingDiceRoll);
  const applyStateChanges = useGameStore((state) => state.applyStateChanges);
  const setPhase = useGameStore((state) => state.setPhase);

  const [narrativeComplete, setNarrativeComplete] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // Start game with mock scenario on mount
  useEffect(() => {
    if (phase === 'scenario-generation' && gameState) {
      setLoading(true);

      // Simulate API call delay
      const timer = setTimeout(() => {
        startGame(MOCK_SCENARIO);
        setSuggestions(MOCK_SUGGESTIONS);
        setLoading(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [phase, gameState, startGame, setLoading, setSuggestions]);

  const handleAction = useCallback((action: string) => {
    setNarrativeComplete(false);
    setLoading(true);

    // Simulate LLM response
    setTimeout(() => {
      // 50% chance of needing a dice roll for demo purposes
      if (Math.random() > 0.5) {
        setPendingDiceRoll({
          difficulty: Math.floor(Math.random() * 10) + 8, // 8-17
          actionType: 'exploration',
          action
        });
        setLoading(false);
      } else {
        // Direct success
        const mockResponse = {
          narrative: `Vous décidez de ${action.toLowerCase()}.

Les ombres dansent sur les murs alors que vous avancez prudemment. Chaque pas résonne dans le silence oppressant de la station.

Soudain, un bruit métallique vous fait sursauter. Mais ce n'était qu'un panneau détaché qui oscille au gré des courants d'air recyclé.

Vous continuez votre exploration, tous vos sens en alerte...`,
          actionType: 'exploration' as const,
          requiresRoll: false,
          stateChanges: {
            oxygenChange: -2
          },
          suggestions: [
            'Continuer dans cette direction',
            'Revenir sur vos pas',
            'Chercher des indices'
          ],
          tensionLevel: 4,
          isEnding: false
        };

        applyStateChanges(mockResponse);
        setLoading(false);
      }
    }, 1000);
  }, [setLoading, setPendingDiceRoll, applyStateChanges]);

  const handleDiceComplete = useCallback((result: DiceResult) => {
    setLoading(true);

    // Simulate outcome narration
    setTimeout(() => {
      const success = result.success;
      const critical = result.critical;

      let narrative = '';
      if (critical && success) {
        narrative = `SUCCÈS CRITIQUE !

Avec une précision exceptionnelle, vous accomplissez votre action de manière parfaite. Tout se déroule exactement comme prévu, et même mieux que vous ne l'espériez.

Les dieux du hasard sont avec vous aujourd'hui...`;
      } else if (critical && !success) {
        narrative = `ÉCHEC CRITIQUE !

C'est un désastre. Non seulement votre action échoue lamentablement, mais elle déclenche une réaction en chaîne de catastrophes.

Un bruit inquiétant résonne dans les couloirs sombres...`;
      } else if (success) {
        narrative = `Votre action est couronnée de succès.

Malgré les difficultés, vous parvenez à accomplir ce que vous aviez prévu. La station semble un peu moins hostile pendant un bref instant.

Mais la prudence reste de mise...`;
      } else {
        narrative = `Votre tentative échoue.

Malgré vos efforts, quelque chose ne fonctionne pas comme prévu. Il faudra trouver une autre approche.

L'obscurité semble se refermer autour de vous...`;
      }

      const mockResponse = {
        narrative,
        actionType: 'exploration' as const,
        requiresRoll: false,
        stateChanges: {
          hpChange: critical && !success ? -2 : 0,
          oxygenChange: -2
        },
        suggestions: [
          'Essayer une autre approche',
          'Explorer les environs',
          'Se reposer un moment'
        ],
        tensionLevel: success ? 4 : 6,
        isEnding: false
      };

      applyStateChanges(mockResponse);
      setPhase('playing');
      setLoading(false);
    }, 500);
  }, [setLoading, applyStateChanges, setPhase]);

  // Game over check
  useEffect(() => {
    if (gameState && gameState.player.hp <= 0) {
      setPhase('game-over');
      setNarrative(`
GAME OVER

Votre aventure prend fin ici. L'obscurité vous a finalement rattrapé.

Les ténèbres du vide vous engloutissent...

[Appuyez sur le bouton pour recommencer]
      `);
    }
  }, [gameState?.player.hp, setPhase, setNarrative]);

  if (phase === 'game-over') {
    return (
      <div className="flex flex-col h-full">
        <NarrativePanel />
        <div className="p-4 bg-[var(--color-steel)]">
          <button
            className="w-full btn bg-[var(--color-accent)] text-white"
            onClick={() => useGameStore.getState().reset()}
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <NarrativePanel onNarrativeComplete={() => setNarrativeComplete(true)} />

      {/* Quick actions bar - always visible during play */}
      {(phase === 'playing' || phase === 'dice-roll') && (
        <QuickActions
          onMapClick={() => setShowMap(true)}
          onInventoryClick={() => setShowInventory(true)}
        />
      )}

      {phase === 'dice-roll' && <DiceRoll onComplete={handleDiceComplete} />}

      {phase === 'playing' && narrativeComplete && !isLoading && (
        <>
          <SuggestionButtons onSelect={handleAction} disabled={isLoading} />
          <CustomActionInput onSubmit={handleAction} disabled={isLoading} />
        </>
      )}

      {/* Modals */}
      <MapModal isOpen={showMap} onClose={() => setShowMap(false)} />
      <InventoryModal isOpen={showInventory} onClose={() => setShowInventory(false)} />
    </div>
  );
}
