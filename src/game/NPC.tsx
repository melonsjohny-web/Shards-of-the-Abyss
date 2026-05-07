import { RigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { DialogState, useGameStore, GameState } from '../stores/useGameStore';

interface NPCProps {
  position: [number, number, number];
  name: string;
  dialogData: DialogState;
}

export function NPC({ position, name, dialogData }: NPCProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const { setInteractionPrompt, setDialog, gameState } = useGameStore();
  const [isNear, setIsNear] = useState(false);

  // Check distance to player
  useFrame(() => {
    if (!meshRef.current || gameState !== GameState.PLAYING) return;
    
    const dist = camera.position.distanceTo(meshRef.current.position);
    const near = dist < 4;
    
    if (near !== isNear) {
      setIsNear(near);
      if (near) {
        setInteractionPrompt('Talk to ' + name);
      } else {
        setInteractionPrompt(null);
      }
    }
  });

  // Handle interaction key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && isNear && gameState === GameState.PLAYING) {
        setDialog(dialogData);
        setInteractionPrompt(null);
        // We probably also need a way to release pointer lock here 
        // since we enter UI
        document.exitPointerLock?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, gameState, dialogData, setDialog, setInteractionPrompt]);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh ref={meshRef} castShadow receiveShadow position={[0, 1, 0]}>
        <capsuleGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#4a708b" />
      </mesh>
    </RigidBody>
  );
}
