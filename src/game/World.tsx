import { RigidBody } from '@react-three/rapier';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Terrain } from './Terrain';
import { Enemy } from './Enemy';
import { Chest } from './Chest';
import { NPC } from './NPC';
import { MeshWobbleMaterial, MeshDistortMaterial } from '@react-three/drei';
import { getTerrainHeight } from './terrainUtils';
import { useGameStore } from '../stores/useGameStore';

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
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[1, height, 1]} />
        <meshStandardMaterial color="#666" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[1.5, 0.5, 1.5]} />
        <meshStandardMaterial color="#555" roughness={0.9} metalness={0.1} />
      </mesh>
    </RigidBody>
  );
}

const TREE_COUNT = 500;

export function World() {
  const treePositions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < TREE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 950;
      const z = (Math.random() - 0.5) * 950;
      // Leave center empty for village
      if (Math.abs(x) < 40 && Math.abs(z) < 40) continue;
      // Leave old ruins empty
      if (x > 150 && z < -150) continue;
      // Leave a path
      if (Math.abs(x) < 4 && z > 15) continue;
      // Level depends on terrain height
      const yStr = getTerrainHeight(x, z); 
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

  // ... (previous useMemo calls)
  const enemySpawns = useMemo(() => {
    const list: { pos: [number, number, number], type: 'wolf'|'skeleton'|'goblin' }[] = [];
    
    // Wolves in forest (away from center)
    for (let i = 0; i < 15; i++) {
        const x = (Math.random() - 0.5) * 60;
        const z = -20 - Math.random() * 60;
        list.push({ pos: [x, getTerrainHeight(x, z) + 2, z], type: 'wolf' });
    }
    
    // Skeletons in ruins
    for(let i=0; i< 10; i++) {
        const x = 50 + (Math.random() - 0.5) * 35;
        const z = -50 + (Math.random() - 0.5) * 35;
        list.push({ pos: [x, getTerrainHeight(x, z) + 2, z], type: 'skeleton' });
    }

    // Goblins near tower
    for(let i=0; i< 8; i++) {
        const x = -60 + (Math.random() - 0.5) * 30;
        const z = -40 + (Math.random() - 0.5) * 30;
        list.push({ pos: [x, getTerrainHeight(x, z) + 2, z], type: 'goblin' });
    }

    return list;
  }, []);

  return (
    <group>
      <Terrain />

      {/* Enemies */}
      {enemySpawns.map((spawn, i) => (
        <Enemy key={i} position={spawn.pos} type={spawn.type} />
      ))}

      <instancedMesh ref={treeMeshRef} args={[undefined, undefined, treePositions.length]} castShadow receiveShadow raycast={() => null}>
        <coneGeometry args={[2, 5, 5]} />
        <meshStandardMaterial color="#1e3b1c" roughness={0.9} />
      </instancedMesh>

      <group position={[0, 0, 0]}>
        <RigidBody type="fixed" colliders="cuboid" position={[10, getTerrainHeight(10, 10) + 2.5, 10]}>
          <mesh castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[12, 5, 8]} />
            <meshStandardMaterial color="#3b2b1e" roughness={0.8} />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[-10, getTerrainHeight(-10, -15) + 2, -15]}>
           <mesh castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[6, 4, 6]} />
            <meshStandardMaterial color="#4d3b2b" roughness={0.8} />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[-15, getTerrainHeight(-15, 5) + 2, 5]}>
          <mesh castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[6, 4, 8]} />
            <meshStandardMaterial color="#4d3b2b" roughness={0.8} />
          </mesh>
        </RigidBody>

        {/* Walls */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, getTerrainHeight(0, 25) + 1.5, 25]}>
          <mesh castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[50, 3, 1]} />
            <meshStandardMaterial color="#2d2015" />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[0, getTerrainHeight(0, -25) + 1.5, -25]}>
          <mesh castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[50, 3, 1]} />
            <meshStandardMaterial color="#2d2015" />
          </mesh>
        </RigidBody>

        <Torch position={[4, getTerrainHeight(4, 4), 4]} />
        <Torch position={[-4, getTerrainHeight(-4, 4), 4]} />
        <Torch position={[12, getTerrainHeight(12, 5), 5]} />
        <Torch position={[-12, getTerrainHeight(-12, 0), 0]} />
        
        <Chest position={[8, getTerrainHeight(8, 13), 13]} loot={[{ id: 'hp', name: 'HP Potion', type: 'consumable', rarity: 'common', stackable: true, quantity: 1, description: 'Heals 20 HP', icon: '💊', value: 10 }]} gold={50} />

        <NPC 
          position={[0, 0, 5]} 
          name="Elder Teryn"
          getDialog={() => {
            const store = useGameStore.getState();
            const q = store.quests.find(q => q.id === 'wolf_hunt');
            if (q?.completed) {
              return {
                npcName: "Elder Teryn",
                currentNode: 'thanks',
                nodes: {
                  thanks: { text: "Thank you for clearing the forest! The village is safe now.", options: [{ text: "Farewell." }] }
                }
              };
            }
            if (q) {
              return {
                npcName: "Elder Teryn",
                currentNode: 'waiting',
                nodes: {
                  waiting: { text: "Have you cleared out the wolves yet? Our hunters are scared.", options: [{ text: "I'm still working on it." }] }
                }
              };
            }
            return {
              npcName: "Elder Teryn",
              currentNode: 'start',
              nodes: {
                start: { 
                  text: "Ah, a traveler. The woods have become dangerous lately. The wolves are attacking our livestock.", 
                  options: [
                    { text: "I can handle them.", next: "give_quest", action: () => {
                        useGameStore.getState().acceptQuest({
                          id: 'wolf_hunt',
                          title: 'Clear the Forest',
                          currentStage: 'stage_1',
                          completed: false,
                          stages: {
                             stage_1: {
                               id: 'stage_1',
                               description: 'Defeat 5 wolves in the nearby forest.',
                               objectives: [{ id: 'wolf_1', description: 'Wolves defeated', target: 'enemy', required: 5, current: 0, completed: false }],
                               nextStages: [],
                               reward: { gold: 100, xp: 200 }
                             }
                          }
                        });
                        useGameStore.getState().addNotification('Quest Accepted: Clear the Forest', 'quest');
                    }},
                    { text: "Not my problem.", next: "rudeness" }
                  ]
                },
                give_quest: {
                  text: "Excellent. May the light guide you. Come back when you've dealt with 5 of them.",
                  options: [{ text: "I will return." }]
                },
                rudeness: {
                  text: "A pity. Let me know if you change your mind.",
                  options: [{ text: "Bye." }]
                }
              }
            };
          }}
        />
      </group>

      {/* The Forest */}
      <group>
        {/* Instanced trees replaced individual tree group */}
      </group>

      {/* Ancient Ruins Zone */}
      <group position={[50, 0, -50]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, getTerrainHeight(50, -50) - 0.4, 0]}>
          <mesh receiveShadow raycast={() => null}>
            <boxGeometry args={[40, 1.1, 40]} />
            <meshStandardMaterial color="#444" roughness={0.9} />
          </mesh>
        </RigidBody>
        {/* Ruin Pillars */}
        <RuinPillar position={[10, getTerrainHeight(60, -40), 10]} height={8} />
        <RuinPillar position={[-10, getTerrainHeight(40, -40), 10]} height={3} />
        <RuinPillar position={[10, getTerrainHeight(60, -60), -10]} height={6} />
        <RuinPillar position={[-10, getTerrainHeight(40, -60), -10]} height={9} />
        <RuinPillar position={[0, getTerrainHeight(50, -35), 15]} height={5} />
        <RuinPillar position={[14, getTerrainHeight(64, -50), 0]} height={7} />
        <RuinPillar position={[-13, getTerrainHeight(37, -48), 2]} height={4} />

        {/* Magic Altar */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, getTerrainHeight(50, -50) + 0.5, 0]}>
          <mesh castShadow receiveShadow raycast={() => null}>
            <cylinderGeometry args={[2, 2.5, 1, 8]} />
            <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
          </mesh>

          <mesh position={[0, 1.5, 0]}>
            <octahedronGeometry args={[0.5]} />
            <MeshDistortMaterial speed={2} distort={0.5} radius={1} color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, 1.5, 0]} color="#00ffff" distance={15} intensity={3} castShadow />
        </RigidBody>

        <Torch position={[5, getTerrainHeight(55, -50), 0]} />
        <Torch position={[-5, getTerrainHeight(45, -50), 0]} />
        
        <Chest position={[0, getTerrainHeight(50, -52) + 1.3, -2]} loot={[{ id: 'magic_sword', name: 'Ruin Sword', type: 'weapon', rarity: 'rare', stackable: false, quantity: 1, description: 'An ancient sword.', icon: '🗡️', value: 150, stats: { damage: 25 } }]} gold={200} />
      </group>

      {/* Old Tower Zone */}
      <group position={[-60, 0, -40]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, getTerrainHeight(-60, -40) + 10, 0]}>
          <mesh castShadow receiveShadow raycast={() => null}>
            <cylinderGeometry args={[5, 6, 20, 8]} />
            <meshStandardMaterial color="#333" roughness={0.9} />
          </mesh>
        </RigidBody>
        <Torch position={[6, getTerrainHeight(-54, -40), 0]} />
        <Chest position={[0, getTerrainHeight(-60, -40) + 20.3, 0]} loot={[{ id: 'tower_shield', name: 'Tower Shield', type: 'armor', rarity: 'uncommon', stackable: false, quantity: 1, description: 'Heavy shield.', icon: '🛡️', value: 300, stats: { defense: 40 } }]} gold={150} />
      </group>

      {/* Decor Lake */}
      <group position={[-40, -1, 50]}>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, getTerrainHeight(-40, 50) + 0.1, 0]} receiveShadow raycast={() => null}>
          <planeGeometry args={[40, 40]} />
          <MeshWobbleMaterial factor={0.2} speed={1} color="#0066aa" opacity={0.8} transparent />
        </mesh>
      </group>
    </group>
  );
}
