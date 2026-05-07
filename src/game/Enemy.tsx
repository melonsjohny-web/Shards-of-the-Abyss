import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore, GameState } from '../stores/useGameStore';
import { sounds } from '../audio/sounds';

export type EnemyType = 'wolf' | 'skeleton' | 'goblin';

const ENEMY_CONFIG = {
  wolf:     { color: '#4a4a4a', health: 40, damage: 8,  speed: 5, xp: 30,  size: [1, 1, 1.5] },
  skeleton: { color: '#c8c8aa', health: 60, damage: 12, speed: 3, xp: 50,  size: [0.8, 1.7, 0.8] },
  goblin:   { color: '#3a6b3a', health: 25, damage: 6,  speed: 6, xp: 20,  size: [0.7, 1.2, 0.7] },
};

function HitEffect({ position }: { position: THREE.Vector3 }) {
  const particles = useMemo(() => 
    Array.from({ length: 8 }, () => ({
      pos: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 3 + 2,
        (Math.random() - 0.5) * 6
      ),
    })), [position]
  );

  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    particles.forEach((p, i) => {
      p.velocity.y -= 9.8 * delta; // gravity
      p.pos.addScaledVector(p.velocity, delta);
      const child = groupRef.current!.children[i];
      if (child) {
        child.position.copy(p.pos);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      ))}
    </group>
  );
}

export function Enemy({ position, type = 'goblin' }: { position: [number, number, number], type?: EnemyType }) {
  const cfg = ENEMY_CONFIG[type];
  const meshRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<RapierRigidBody>(null);
  const [health, setHealth] = useState(cfg.health);
  const { gameState, modifyHealth } = useGameStore();
  const [color, setColor] = useState(cfg.color);
  const { camera } = useThree();
  
  const [hitParticles, setHitParticles] = useState<{id: number, pos: THREE.Vector3}[]>([]);
  const baseSpeed = useMemo(() => cfg.speed + (Math.random() - 0.5), [cfg.speed]);

  const [aiState, setAiState] = useState<'patrol' | 'chase' | 'attack'>('patrol');
  const patrolTarget = useRef(new THREE.Vector3(
    position[0] + (Math.random() - 0.5) * 20,
    position[1],
    position[2] + (Math.random() - 0.5) * 20
  ));
  
  const lastAttack = useRef(0);
  const [dead, setDead] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<{id: number, value: number, y: number, startX: number, startY: number, startZ: number}[]>([]);

  useFrame((state, delta) => {
    if (damageNumbers.length > 0) {
      setDamageNumbers(prev => prev.map(dn => ({ ...dn, y: dn.y + delta * 2 })));
    }

    if (dead) return;
    if (gameState !== GameState.PLAYING || !bodyRef.current) return;
    
    const pos = bodyRef.current.translation();
    const currPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    
    // update minimap
    const enemies = (window as any).__enemyPositions || [];
    const idx = enemies.findIndex((e: any) => e.body === bodyRef.current);
    if (idx >= 0) {
      enemies[idx] = { x: pos.x, z: pos.z, body: bodyRef.current };
    } else {
      enemies.push({ x: pos.x, z: pos.z, body: bodyRef.current });
      (window as any).__enemyPositions = enemies;
    }
    
    const dist = currPos.distanceTo(camera.position);

    if (dist < 2.5) {
      setAiState('attack');
    } else if (dist < 20) {
      setAiState('chase');
      // Update patrol target to player pos (last known position)
      patrolTarget.current.copy(camera.position);
    } else {
      setAiState('patrol');
    }
    
    let target = patrolTarget.current;
    
    if (aiState === 'patrol') {
      if (currPos.distanceTo(target) < 2) {
        patrolTarget.current.set(
          pos.x + (Math.random() - 0.5) * 15,
          pos.y,
          pos.z + (Math.random() - 0.5) * 15
        );
      }
    }

    if (aiState === 'patrol' || aiState === 'chase') {
      const dir = new THREE.Vector3().subVectors(target, currPos);
      dir.y = 0; // Don't fly
      if (dir.lengthSq() > 0.1) {
        dir.normalize();
        const velocity = bodyRef.current.linvel();
        const currentSpeed = aiState === 'chase' ? baseSpeed : baseSpeed * 0.4;
        bodyRef.current.setLinvel({
          x: dir.x * currentSpeed,
          y: velocity.y,
          z: dir.z * currentSpeed
        }, true);
      }
    }

    if (aiState === 'attack') {
      const now = state.clock.elapsedTime;
      if (now - lastAttack.current > 1.5) {
        lastAttack.current = now;
        modifyHealth(-cfg.damage);
        
        // Attack visual (hop)
        bodyRef.current.applyImpulse({ x: 0, y: 3, z: 0 }, true);
      }
    }
  });

  const takeDamage = (amount: number = 15) => {
    if (gameState !== GameState.PLAYING || dead) return;
    
    // sounds.hit.play(); // disable annoyng sound
    const newHealth = Math.max(0, health - amount);
    setHealth(newHealth);
    
    let currentX = position[0];
    let currentY = position[1];
    let currentZ = position[2];
    if (bodyRef.current) {
      const pos = bodyRef.current.translation();
      currentX = pos.x;
      currentY = pos.y;
      currentZ = pos.z;
    }
    
    const dId = Date.now() + Math.random();
    setDamageNumbers(prev => [...prev, { id: dId, value: amount, y: 0, startX: currentX, startY: currentY, startZ: currentZ }]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(dn => dn.id !== dId));
    }, 1000);

    setColor("#ffffff");
    setTimeout(() => setColor(cfg.color), 100);

    if (bodyRef.current) {
      bodyRef.current.applyImpulse({ x: 0, y: 2, z: -1 }, true);
      const pId = Date.now() + Math.random();
      setHitParticles(prev => [...prev, { id: pId, pos: new THREE.Vector3(currentX, currentY, currentZ) }]);
      setTimeout(() => {
         setHitParticles(prev => prev.filter(p => p.id !== pId));
      }, 500);
    }
    
    if (newHealth <= 0 && !dead) {
      setDead(true);
      const store = useGameStore.getState();
      store.updateQuestProgress('enemy', 1);
      store.addXP(cfg.xp);
      store.addGold(Math.floor(Math.random() * 15) + 5);
      if (Math.random() < 0.3) {
        store.addItem({ id: 'health_potion_' + Date.now(), name: 'Health Potion', type: 'consumable', rarity: 'common', stackable: true, quantity: 1, description: 'Restores 30 Health.', icon: '💊', value: 20, stats: { health: 30 } });
      }
      
      // Cleanup minimap
      const enemies = (window as any).__enemyPositions || [];
      (window as any).__enemyPositions = enemies.filter((e: any) => e.body !== bodyRef.current);
    }
  };

  return (
    <>
      {!dead && (
        <RigidBody ref={bodyRef} type="dynamic" colliders="cuboid" position={position} mass={5} enabledRotations={[false, false, false]}>
          <mesh ref={meshRef} userData={{ isEnemy: true, takeDamage }} castShadow receiveShadow>
            <boxGeometry args={cfg.size as [number, number, number]} />
            <meshStandardMaterial color={color} roughness={0.7} />
            
            <Billboard position={[0, cfg.size[1]/2 + 0.5, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
              {/* Background */}
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[1.2, 0.15]} />
                <meshBasicMaterial color="black" side={THREE.DoubleSide} />
              </mesh>
              {/* Health fill */}
              <mesh position={[-0.6 + (1.2 * (health / cfg.health)) / 2, 0, 0.01]}>
                <planeGeometry args={[1.2 * (health / cfg.health), 0.12]} />
                <meshBasicMaterial color="red" side={THREE.DoubleSide} />
              </mesh>
            </Billboard>
          </mesh>
        </RigidBody>
      )}
      {damageNumbers.map(dn => (
        <Billboard key={dn.id} position={[dn.startX, dn.startY + cfg.size[1] + 1 + dn.y, dn.startZ]}>
          <Text color="yellow" fontSize={0.6} font="https://fonts.gstatic.com/s/cinzel/v19/8vIJ7ww63mVu7gtR-kwk.woff" outlineWidth={0.05} outlineColor="#000000">
            -{dn.value}
          </Text>
        </Billboard>
      ))}
      {hitParticles.map(p => (
        <HitEffect key={p.id} position={p.pos} />
      ))}
    </>
  );
}
