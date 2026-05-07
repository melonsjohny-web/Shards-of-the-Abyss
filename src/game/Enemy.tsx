import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore, GameState } from '../stores/useGameStore';

export function Enemy({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<RapierRigidBody>(null);
  const [health, setHealth] = useState(50);
  const { gameState, modifyHealth } = useGameStore();
  const [color, setColor] = useState("#8b0000"); // Dark red
  const { camera } = useThree();
  
  const speed = useMemo(() => 2 + Math.random() * 2, []); // 2-4 m/s
  const [lastAttack, setLastAttack] = useState(0);

  useFrame((state) => {
    if (gameState !== GameState.PLAYING || !bodyRef.current || health <= 0) return;
    
    const pos = bodyRef.current.translation();
    const currPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    
    // distance to player
    const dist = currPos.distanceTo(camera.position);

    if (dist < 20 && dist > 2) {
      // Move towards player
      const dir = new THREE.Vector3().subVectors(camera.position, currPos);
      dir.y = 0; // Don't fly
      dir.normalize();
      
      const velocity = bodyRef.current.linvel();
      bodyRef.current.setLinvel({
        x: dir.x * speed,
        y: velocity.y,
        z: dir.z * speed
      }, true);
    }

    if (dist <= 2.5) {
      // Attack player
      const now = state.clock.elapsedTime;
      if (now - lastAttack > 1.5) {
        setLastAttack(now);
        modifyHealth(-10); // deal damage to player
        
        // Attack visual (hop)
        bodyRef.current.applyImpulse({ x: 0, y: 1.5, z: 0 }, true);
      }
    }
  });

  const takeDamage = () => {
    if (gameState !== GameState.PLAYING) return;
    
    setHealth(h => Math.max(0, h - 15));
    
    setColor("#ffffff");
    setTimeout(() => {
      setColor("#8b0000");
    }, 100);

    if (bodyRef.current) {
      bodyRef.current.applyImpulse({ x: 0, y: 2, z: -2 }, true);
    }
  };

  if (health <= 0) return null;

  return (
    <RigidBody ref={bodyRef} type="dynamic" colliders="cuboid" position={position} mass={5} enabledRotations={[false, false, false]}>
      <mesh ref={meshRef} castShadow receiveShadow onClick={(e) => {
        e.stopPropagation();
        takeDamage();
      }}>
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial color={color} />
        
        <Billboard position={[0, 1.2, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.2, 0.2]} />
            <meshBasicMaterial color="black" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.6 + (health / 50) * 0.6, 0, 0.01]}>
            <planeGeometry args={[1.2 * (health / 50), 0.15]} />
            <meshBasicMaterial color="red" side={THREE.DoubleSide} />
          </mesh>
        </Billboard>
      </mesh>
    </RigidBody>
  );
}
