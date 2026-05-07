import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Player } from './game/Player';
import { World } from './game/World';
import { DayNightEnvironment } from './game/DayNightEnvironment';
import { NPC } from './game/NPC';
import { Enemy } from './game/Enemy';
import { Effects } from './game/Effects';
import { useGameStore, GameState } from './stores/useGameStore';
import { MainMenu } from './ui/MainMenu';
import { CharacterCreation } from './ui/CharacterCreation';
import { HUD } from './ui/HUD';
import { DialogUI } from './ui/DialogUI';
import { Suspense } from 'react';

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
        { text: "Consider it done.", next: undefined }
      ]
    }
  }
};

export default function App() {
  const gameState = useGameStore(state => state.gameState);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden font-sans relative">
      {/* UI Layers */}
      {gameState === GameState.MAIN_MENU && <MainMenu />}
      {gameState === GameState.CHARACTER_CREATION && <CharacterCreation />}
      
      {/* HUD goes on top of the 3D canvas but under other full-screen UI */}
      {gameState !== GameState.MAIN_MENU && gameState !== GameState.CHARACTER_CREATION && (
        <HUD />
      )}
      
      <DialogUI />

      {/* 3D World */}
      <Canvas 
        shadows 
        camera={{ fov: 85, position: [0, 2, 5] }}
        onPointerDown={(e) => {
           if (gameState === GameState.PLAYING) {
             // Request pointer lock natively if controls didn't catch it
             (e.target as HTMLElement).requestPointerLock?.();
           }
        }}
      >
        <Suspense fallback={null}>
          <Effects />
          <DayNightEnvironment />
          {gameState !== GameState.MAIN_MENU && (
            <Physics gravity={[0, -20, 0]}>
              <Player />
              <World />
              
              {/* Spawn some NPCs */}
              <NPC position={[5, 0, 5]} name="Elder Marcus" dialogData={elderDialog} />
              <NPC position={[-5, 0, 8]} name="Emil the Merchant" dialogData={merchantDialog} />

              {/* Spawn some Enemies */}
              <Enemy position={[40, 5, -45]} />
              <Enemy position={[55, 5, -50]} />
              <Enemy position={[48, 5, -60]} />
            </Physics>
          )}
        </Suspense>
      </Canvas>
      
      {/* Target Crosshair Fix (handled in HUD) */}
    </div>
  );
}
