import { RigidBody } from '@react-three/rapier';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Simple low-poly tree
function Tree({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* Trunk */}
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.5, 3, 5]} />
          <meshStandardMaterial color="#3d2817" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* Leaves */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[2.5, 5, 5]} />
        <meshStandardMaterial color="#1e3b1c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <coneGeometry args={[2, 4, 5]} />
        <meshStandardMaterial color="#2d4c1e" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Torch with animated light
export function Torch({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const timeOffset = useMemo(() => Math.random() * 100, []);

  useFrame((state) => {
    if (lightRef.current) {
      // Flicker effect
      const t = state.clock.elapsedTime + timeOffset;
      const flicker = Math.sin(t * 10) * Math.cos(t * 13) * Math.sin(t * 7);
      lightRef.current.intensity = 2 + flicker * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Wooden Stick */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1]} />
        <meshStandardMaterial color="#3d2817" />
      </mesh>
      {/* Fire core placeholder */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.2, 0]} color="#ff7700" distance={15} castShadow shadow-bias={-0.001} />
    </group>
  );
}

function RuinPillar({ position, height = 4 }: { position: [number, number, number], height?: number }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, height, 1]} />
        <meshStandardMaterial color="#666" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.5, 1.5]} />
        <meshStandardMaterial color="#555" roughness={0.9} metalness={0.1} />
      </mesh>
    </RigidBody>
  );
}

export function World() {
  const treePositions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < 150; i++) {
      const x = (Math.random() - 0.5) * 180;
      const z = (Math.random() - 0.5) * 180;
      // Leave center empty for village
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
      // Leave a path
      if (Math.abs(x) < 4 && z > 15) continue;
      pos.push([x, 0, z]);
    }
    return pos;
  }, []);

  return (
    <group>
      {/* Main Ground */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 1, 200]} />
          <meshStandardMaterial color="#2c3c2c" roughness={1} />
        </mesh>
      </RigidBody>

      {/* Village Center (Tavern / Hub) */}
      <group position={[0, 0, 0]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[10, 2.5, 10]} castShadow receiveShadow>
            <boxGeometry args={[12, 5, 8]} />
            <meshStandardMaterial color="#3b2b1e" roughness={0.8} />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid">
           <mesh position={[-10, 2, -15]} castShadow receiveShadow>
            <boxGeometry args={[6, 4, 6]} />
            <meshStandardMaterial color="#4d3b2b" roughness={0.8} />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[-15, 2, 5]} castShadow receiveShadow>
            <boxGeometry args={[6, 4, 8]} />
            <meshStandardMaterial color="#4d3b2b" roughness={0.8} />
          </mesh>
        </RigidBody>

        {/* Walls */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 1.5, 25]} castShadow receiveShadow>
            <boxGeometry args={[50, 3, 1]} />
            <meshStandardMaterial color="#2d2015" />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 1.5, -25]} castShadow receiveShadow>
            <boxGeometry args={[50, 3, 1]} />
            <meshStandardMaterial color="#2d2015" />
          </mesh>
        </RigidBody>

        <Torch position={[4, 0, 4]} />
        <Torch position={[-4, 0, 4]} />
        <Torch position={[12, 0, 5]} />
        <Torch position={[-12, 0, 0]} />
      </group>

      {/* The Forest */}
      <group>
        {treePositions.map((pos, i) => (
          <Tree key={i} position={pos} scale={0.8 + Math.random() * 0.6} />
        ))}
      </group>

      {/* Ancient Ruins Zone */}
      <group position={[50, 0, -50]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, -0.4, 0]} receiveShadow>
            <boxGeometry args={[40, 1.1, 40]} />
            <meshStandardMaterial color="#444" roughness={0.9} />
          </mesh>
        </RigidBody>
        {/* Ruin Pillars */}
        <RuinPillar position={[10, 0, 10]} height={8} />
        <RuinPillar position={[-10, 0, 10]} height={3} />
        <RuinPillar position={[10, 0, -10]} height={6} />
        <RuinPillar position={[-10, 0, -10]} height={9} />
        <RuinPillar position={[0, 0, 15]} height={5} />
        
        {/* Magic Altar */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.5, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[2, 2.5, 1, 8]} />
            <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <octahedronGeometry args={[0.5]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, 1.5, 0]} color="#00ffff" distance={15} intensity={5} castShadow />
        </RigidBody>

        <Torch position={[5, 0, 0]} />
        <Torch position={[-5, 0, 0]} />
      </group>

    </group>
  );
}
