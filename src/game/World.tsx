import { RigidBody } from '@react-three/rapier';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Terrain } from './Terrain';
import { Chest } from './Chest';
import { MeshWobbleMaterial, MeshDistortMaterial } from '@react-three/drei';

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

const TREE_COUNT = 200;

export function World() {
  const treePositions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < TREE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 180;
      const z = (Math.random() - 0.5) * 180;
      // Leave center empty for village
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
      // Leave old ruins empty
      if (x > 30 && z < -30) continue;
      // Leave a path
      if (Math.abs(x) < 4 && z > 15) continue;
      // Level depends on terrain height - approximated randomly here
      const yStr = Math.random() * 2 - 1; 
      pos.push([x, yStr, z]);
    }
    return pos;
  }, []);

  const treeMeshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!treeMeshRef.current) return;
    const matrix = new THREE.Matrix4();
    const euler = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    treePositions.forEach((pos, i) => {
      matrix.setPosition(pos[0], pos[1] + 2.5, pos[2]);
      
      const scl = 0.8 + Math.random() * 0.4;
      scale.set(scl, scl, scl);
      
      euler.set(0, Math.random() * Math.PI, 0);
      quaternion.setFromEuler(euler);
      
      matrix.compose(new THREE.Vector3(pos[0], pos[1] + 2.5, pos[2]), quaternion, scale);
      treeMeshRef.current?.setMatrixAt(i, matrix);
    });
    treeMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [treePositions]);

  return (
    <group>
      <Terrain />

      <instancedMesh ref={treeMeshRef} args={[undefined, undefined, treePositions.length]} castShadow receiveShadow>
        <coneGeometry args={[2, 5, 5]} />
        <meshStandardMaterial color="#1e3b1c" roughness={0.9} />
      </instancedMesh>

      {/* Render invisible colliders for trees in Physics */}
      {treePositions.map((p, i) => (
        <RigidBody key={i} type="fixed" colliders="cylinder" position={[p[0], p[1] + 2.5, p[2]]}>
          <mesh visible={false}>
            <cylinderGeometry args={[0.5, 0.5, 5]} />
          </mesh>
        </RigidBody>
      ))}
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
        
        <Chest position={[8, 0.3, 13]} loot={[{ id: 'hp', name: 'HP Potion', type: 'consumable', value: 10 }]} gold={50} />
      </group>

      {/* The Forest */}
      <group>
        {/* Instanced trees replaced individual tree group */}
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
        <RuinPillar position={[14, 0, 0]} height={7} />
        <RuinPillar position={[-13, 0, 2]} height={4} />

        {/* Magic Altar */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.5, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[2, 2.5, 1, 8]} />
            <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
          </mesh>

          <mesh position={[0, 1.5, 0]}>
            <octahedronGeometry args={[0.5]} />
            <MeshDistortMaterial speed={2} distort={0.5} radius={1} color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, 1.5, 0]} color="#00ffff" distance={15} intensity={3} castShadow />
        </RigidBody>

        <Torch position={[5, 0, 0]} />
        <Torch position={[-5, 0, 0]} />
        
        <Chest position={[0, 1.3, -2]} loot={[{ id: 'magic_sword', name: 'Ruin Sword', type: 'weapon', value: 150, stats: { damage: 25 } }]} gold={200} />
      </group>

      {/* Old Tower Zone */}
      <group position={[-60, 0, -40]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 10, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[5, 6, 20, 8]} />
            <meshStandardMaterial color="#333" roughness={0.9} />
          </mesh>
        </RigidBody>
        <Torch position={[6, 0, 0]} />
        <Chest position={[0, 20.3, 0]} loot={[{ id: 'tower_shield', name: 'Tower Shield', type: 'armor', value: 300, stats: { defense: 40 } }]} gold={150} />
      </group>

      {/* Decor Lake */}
      <group position={[-40, -1, 50]}>
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <MeshWobbleMaterial factor={0.2} speed={1} color="#0066aa" opacity={0.8} transparent />
        </mesh>
      </group>
    </group>
  );
}
