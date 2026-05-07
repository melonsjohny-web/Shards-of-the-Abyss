import { RigidBody } from '@react-three/rapier';
import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, GameState, DialogState } from '../stores/useGameStore';
import { getTerrainHeight } from './terrainUtils';

export function NPC({ position, name, getDialog }: { position: [number, number, number], name: string, getDialog: () => DialogState }) {
  const { camera } = useThree();
  const { setDialog, currentDialog, setInteractionPrompt, gameState } = useGameStore();
  const [hovered, setHovered] = useState(false);
  const bodyRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Stick to terrain 
  // Normally physics does this, but for static NPCs we can just set Y.
  const y = getTerrainHeight(position[0], position[2]);

  useFrame(() => {
    if (!meshRef.current || gameState !== GameState.PLAYING) return;
    
    // Get true world pos of mesh
    const wp = new THREE.Vector3();
    meshRef.current.getWorldPosition(wp);
    
    const dist = camera.position.distanceTo(wp);
    if (dist < 4) {
      if (!hovered) {
        setHovered(true);
        setInteractionPrompt(`Talk to ${name} [E]`);
      }
    } else {
      if (hovered) {
        setHovered(false);
        setInteractionPrompt(null);
      }
    }
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Very simple 'E' to interact.
      if (e.code === 'KeyE' && hovered && gameState === GameState.PLAYING) {
         // Create a simple beep using Web Audio API for mumble effect
         try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150 + Math.random() * 50, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
         } catch(err) {}

         setDialog(getDialog());
         setInteractionPrompt(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hovered, gameState, getDialog, setDialog, setInteractionPrompt]);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={[position[0], y + 1, position[2]]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
        <meshStandardMaterial color="#88aaff" roughness={0.8} />
      </mesh>
      
      <Billboard position={[0, 1.2, 0]}>
        <Text fontSize={0.3} color="white" outlineWidth={0.02} outlineColor="black" anchorY="bottom">
          {name}
        </Text>
      </Billboard>
    </RigidBody>
  );
}
