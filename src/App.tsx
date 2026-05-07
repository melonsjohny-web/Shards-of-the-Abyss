import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Player } from './game/Player';
import { World } from './game/World';
import { DayNightEnvironment } from './game/DayNightEnvironment';
import { NPC } from './game/NPC';
import { Enemy } from './game/Enemy';
import { Effects } from './game/Effects';
import { ViewmodelCanvas } from './game/ViewmodelCanvas';
import { MainMenuCamera } from './game/MainMenuCamera';
import { useGameStore, GameState } from './stores/useGameStore';
import { MainMenu } from './ui/MainMenu';
import { CharacterCreation } from './ui/CharacterCreation';
import { HUD } from './ui/HUD';
import { DialogUI } from './ui/DialogUI';
import { DeadScreen } from './ui/DeadScreen';
import { PauseMenu } from './ui/PauseMenu';
import { InventoryScreen } from './ui/InventoryScreen';
import { LoadingScreen } from './ui/LoadingScreen';
import { Notifications } from './ui/Notifications';
import { SettingsMenu } from './ui/SettingsMenu';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense, useEffect } from 'react';
import { sounds } from './audio/sounds';

const elderDialog = {
  npcName: "Elder Marcus",
  currentNode: "start",
  nodes: {
    start: {
      text: "Traveler, you have arrived in difficult times...",
      options: [
        { text: "What happened?", next: "lore_01" },
        { text: "Do you have any work for me?", next: "quest_01" },
        { text: "Goodbye.", next: undefined }
      ]
    },
    lore_01: {
      text: "The old gods have vanished, and the shards of the abyss are spreading. The mist corrupts all it touches.",
      options: [
        { text: "I see. Goodbye.", next: undefined }
      ]
    },
    quest_01: {
      text: "Yes, the local merchant's supplies have been cut off. Go speak with him, perhaps you can help.",
      options: [
        { text: "I'll do that.", next: undefined },
        { text: "Not my problem.", next: undefined }
      ]
    }
  }
};

const merchantDialog = {
  npcName: "Emil the Merchant",
  currentNode: "start",
  nodes: {
    start: {
      text: "Ah! A new face! Looking to trade, or are you the mercenary the Elder sent?",
      options: [
        { text: "The Elder sent me.", next: "quest_01" },
        { text: "Just looking.", next: undefined }
      ]
    },
    quest_01: {
      text: "Perfect! Wolves have been attacking my supply carts. If you can clear out the den near the old ruins, I'll pay you handsomely.",
      options: [
        { 
          text: "Consider it done.", 
          next: undefined,
          action: () => {
             useGameStore.getState().acceptQuest({ 
               id: 'wolves', title: 'Wolf Threat', description: 'Kill 3 enemies near the ruins', target: 'enemy', required: 3, current: 0, completed: false, reward: { gold: 100, xp: 150 } 
             });
          }
        }
      ]
    }
  }
};

const keyboardMap = [
  { name: 'forward',  keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward',keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump',     keys: ['Space'] },
  { name: 'run',      keys: ['ShiftLeft'] },
];

export default function App() {
  const gameState = useGameStore(state => state.gameState);
  const setGameState = useGameStore(state => state.setGameState);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === GameState.PLAYING) {
          setGameState(GameState.PAUSED);
          document.exitPointerLock?.();
        } else if (gameState === GameState.PAUSED || gameState === GameState.INVENTORY) {
          setGameState(GameState.PLAYING);
        }
      }
      if (e.code === 'KeyI') {
        if (gameState === GameState.PLAYING) {
          setGameState(GameState.INVENTORY);
          document.exitPointerLock?.();
        } else if (gameState === GameState.INVENTORY) {
          setGameState(GameState.PLAYING);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, setGameState]);

  useEffect(() => {
    // Load settings globally
    const savedSet = localStorage.getItem('shards_settings');
    if (savedSet) {
      try {
        const s = JSON.parse(savedSet);
        if (s.fov) (window as any).__FOV = s.fov;
        if (s.sensitivity) (window as any).__SENSITIVITY = s.sensitivity;
        if (s.shadows) (window as any).__SHADOWS = s.shadows;
      } catch (e) {}
    }

    // Autosave every 3 minutes
    const saveInterval = setInterval(() => {
      const state = useGameStore.getState();
      if (state.gameState === GameState.PLAYING) {
        state.saveGame();
        console.log('Autosaved.');
      }
    }, 180000);
    return () => clearInterval(saveInterval);
  }, []);

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="w-screen h-screen bg-black overflow-hidden font-sans relative">
      {/* UI Layers */}
      {gameState === GameState.MAIN_MENU && <MainMenu />}
      {gameState === GameState.CHARACTER_CREATION && <CharacterCreation />}
      {gameState === GameState.SETTINGS && <SettingsMenu />}
      {gameState === GameState.LOADING && <LoadingScreen />}
      {gameState === GameState.DEAD && <DeadScreen />}
      {gameState === GameState.PAUSED && <PauseMenu />}
      {gameState === GameState.INVENTORY && <InventoryScreen />}
      
      <Notifications />
      
      {/* HUD goes on top of the 3D canvas but under other full-screen UI */}
      {gameState === GameState.PLAYING && (
        <HUD />
      )}
      
      <DialogUI />

      {/* Viewmodel layer */}
      {gameState === GameState.PLAYING && <ViewmodelCanvas />}

      {/* 3D World */}
      <Canvas 
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ fov: (window as any).__FOV || 85, position: [0, 2, 5] }}
        onPointerDown={(e) => {
           if (gameState === GameState.PLAYING) {
             (e.target as HTMLElement).requestPointerLock?.();
           }
        }}
      >
        <Suspense fallback={null}>
          <Effects />
          <DayNightEnvironment />
          
          {gameState === GameState.MAIN_MENU && (
            <>
              <MainMenuCamera />
              {/* Only render world to keep menu light-weight without physics for characters if not needed, or we just render physics */}
              <Physics gravity={[0, -20, 0]}>
                <World />
              </Physics>
            </>
          )}

          {gameState !== GameState.MAIN_MENU && (
            <Physics gravity={[0, -20, 0]}>
              <Player />
              <World />
              
              {/* Spawn some NPCs */}
              <NPC position={[5, 0, 5]} name="Elder Marcus" dialogData={elderDialog as any} />
              <NPC position={[-5, 0, 8]} name="Emil the Merchant" dialogData={merchantDialog as any} />

              {/* Spawn some Enemies */}
              <Enemy position={[35, 2, -45]} type="skeleton" />
              <Enemy position={[55, 2, -50]} type="skeleton" />
              <Enemy position={[48, 2, -60]} type="skeleton" />
              
              <Enemy position={[-50, 10, -35]} type="wolf" />
              <Enemy position={[-65, 10, -45]} type="wolf" />
            </Physics>
          )}
        </Suspense>
      </Canvas>
      </div>
    </KeyboardControls>
  );
}
