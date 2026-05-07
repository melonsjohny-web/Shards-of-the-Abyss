import { RigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore, InventoryItem, GameState } from '../stores/useGameStore';

interface ChestProps {
  position: [number, number, number];
  loot: InventoryItem[];
  gold: number;
}

export function Chest({ position, loot, gold }: ChestProps) {
  const [opened, setOpened] = useState(false);
  const { camera } = useThree();
  const { addItem, addGold, setInteractionPrompt, gameState } = useGameStore();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || gameState !== GameState.PLAYING) return;
    const dist = camera.position.distanceTo(meshRef.current.position);
    if (dist < 3 && !opened) setInteractionPrompt('Open chest [E]');
    else if (dist < 3.2 && !opened) setInteractionPrompt(null);
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;
      if (e.code !== 'KeyE' || opened) return;
      if (!meshRef.current) return;
      const dist = camera.position.distanceTo(meshRef.current.position);
      if (dist > 3) return;
      
      setOpened(true);
      setInteractionPrompt(null);
      loot.forEach(item => addItem(item));
      addGold(gold);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opened, gameState, loot, gold]);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.5]} />
        <meshStandardMaterial color={opened ? '#2a1a0a' : '#8B6914'} />
      </mesh>
    </RigidBody>
  );
}
