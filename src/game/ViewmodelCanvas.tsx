import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore, GameState } from '../stores/useGameStore';

function Weapon() {
  const groupRef = useRef<THREE.Group>(null);
  const { gameState } = useGameStore();

  useFrame((state) => {
    if (!groupRef.current || gameState !== GameState.PLAYING) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = -0.5 + Math.sin(t * 8) * 0.02;
  });

  return (
    <group ref={groupRef} position={[0.4, -0.5, -0.8]}>
      <mesh>
        <boxGeometry args={[0.05, 0.05, 1.2]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.4]}>
        <boxGeometry args={[0.3, 0.08, 0.08]} />
        <meshStandardMaterial color="#b8860b" metalness={0.9} />
      </mesh>
      <mesh position={[0, 0, -0.5]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3]} />
        <meshStandardMaterial color="#3d2817" />
      </mesh>
    </group>
  );
}

export function ViewmodelCanvas() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      <Canvas camera={{ fov: 60, near: 0.01, far: 10 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[1, 1, 1]} intensity={1} />
        <Weapon />
      </Canvas>
    </div>
  );
}
