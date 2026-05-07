import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RapierRigidBody, useRapier, RigidBody, CapsuleCollider } from '@react-three/rapier';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, GameState } from '../stores/useGameStore';

const SPEED = 5;
const SPRINT_MULTIPLIER = 1.8;
const JUMP_FORCE = 6;

function usePlayerControls() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    interact: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setKeys((k) => ({ ...k, forward: true })); break;
        case 'KeyS': setKeys((k) => ({ ...k, backward: true })); break;
        case 'KeyA': setKeys((k) => ({ ...k, left: true })); break;
        case 'KeyD': setKeys((k) => ({ ...k, right: true })); break;
        case 'Space': setKeys((k) => ({ ...k, jump: true })); break;
        case 'ShiftLeft': setKeys((k) => ({ ...k, sprint: true })); break;
        case 'KeyE': setKeys((k) => ({ ...k, interact: true })); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setKeys((k) => ({ ...k, forward: false })); break;
        case 'KeyS': setKeys((k) => ({ ...k, backward: false })); break;
        case 'KeyA': setKeys((k) => ({ ...k, left: false })); break;
        case 'KeyD': setKeys((k) => ({ ...k, right: false })); break;
        case 'Space': setKeys((k) => ({ ...k, jump: false })); break;
        case 'ShiftLeft': setKeys((k) => ({ ...k, sprint: false })); break;
        case 'KeyE': setKeys((k) => ({ ...k, interact: false })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
}

export function Player() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const controlsRef = useRef<any>(null);
  const { rapier, world } = useRapier();
  const { camera } = useThree();
  const controls = usePlayerControls();
  const { gameState, setInteractionPrompt, modifyStamina, stamina } = useGameStore();

  const weaponRef = useRef<THREE.Group>(null);
  const [isAttacking, setIsAttacking] = useState(false);

  const direction = new THREE.Vector3();

  useEffect(() => {
    if (gameState !== GameState.PLAYING && controlsRef.current) {
      controlsRef.current.unlock();
    }
  }, [gameState]);

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING || !bodyRef.current) return;

    // Movement
    const velocity = bodyRef.current.linvel();
    const frontVector = new THREE.Vector3(0, 0, (controls.backward ? 1 : 0) - (controls.forward ? 1 : 0));
    const sideVector = new THREE.Vector3((controls.left ? 1 : 0) - (controls.right ? 1 : 0), 0, 0);

    let isSprinting = controls.sprint && stamina > 0;
    const currentSpeed = isSprinting ? SPEED * SPRINT_MULTIPLIER : SPEED;
    
    // Sprint logic
    const isMoving = controls.forward || controls.backward || controls.left || controls.right;
    if (isSprinting && isMoving) {
      modifyStamina(-10 * delta); // drain stamina
    } else if (!isSprinting && stamina < 100) {
      modifyStamina(5 * delta); // recover stamina
    }

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(currentSpeed)
      .applyEuler(camera.rotation);

    bodyRef.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);

    // Jump
    const grounded = Math.abs(velocity.y) < 0.1;
    if (controls.jump && grounded && stamina >= 15) {
      bodyRef.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
      modifyStamina(-15);
    }

    // Camera following body with bobbing
    const translation = bodyRef.current.translation();
    let bob = 0;
    if (isMoving && grounded) {
      const time = state.clock.getElapsedTime();
      bob = Math.sin(time * (isSprinting ? 12 : 8)) * 0.08;
    }
    camera.position.set(translation.x, translation.y + 0.8 + bob, translation.z);

    // Weapon Animation
    if (weaponRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Sway
      if (isMoving && !isAttacking) {
        weaponRef.current.position.y = -0.5 + Math.sin(time * 10) * 0.05 + bob * 0.2;
        weaponRef.current.position.x = 0.5 + Math.cos(time * 5) * 0.05;
        weaponRef.current.rotation.z = Math.sin(time * 10) * 0.05;
      } else if (!isAttacking) {
        weaponRef.current.position.y = THREE.MathUtils.lerp(weaponRef.current.position.y, -0.5, 0.1);
        weaponRef.current.position.x = THREE.MathUtils.lerp(weaponRef.current.position.x, 0.5, 0.1);
        weaponRef.current.rotation.z = THREE.MathUtils.lerp(weaponRef.current.rotation.z, 0, 0.1);
        weaponRef.current.rotation.x = THREE.MathUtils.lerp(weaponRef.current.rotation.x, 0, 0.1);
        weaponRef.current.position.z = THREE.MathUtils.lerp(weaponRef.current.position.z, -0.8, 0.1);
      }

      // Attack Animation Hack
      if (isAttacking) {
        weaponRef.current.rotation.x = THREE.MathUtils.lerp(weaponRef.current.rotation.x, -1.5, 0.4);
        weaponRef.current.rotation.z = THREE.MathUtils.lerp(weaponRef.current.rotation.z, 1.5, 0.4);
        weaponRef.current.position.z = THREE.MathUtils.lerp(weaponRef.current.position.z, -1.2, 0.4);
        weaponRef.current.position.x = THREE.MathUtils.lerp(weaponRef.current.position.x, 0, 0.4);
      }
    }
  });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (gameState !== GameState.PLAYING) return;
      if (e.button === 0 && !isAttacking && stamina >= 10) {
        setIsAttacking(true);
        modifyStamina(-10);
        setTimeout(() => setIsAttacking(false), 250);
      }
    };
    window.addEventListener('mousedown', handleMouse);
    return () => window.removeEventListener('mousedown', handleMouse);
  }, [gameState, isAttacking, stamina, modifyStamina]);

  return (
    <>
      <RigidBody ref={bodyRef} colliders={false} mass={1} type="dynamic" position={[0, 2, 0]} enabledRotations={[false, false, false]}>
        <CapsuleCollider args={[0.5, 0.5]} />
      </RigidBody>

      {gameState === GameState.PLAYING && <PointerLockControls ref={controlsRef} />}

      {/* Viewmodel Weapon */}
      <group>
        <primitive object={camera}>
          <group ref={weaponRef} position={[0.5, -0.5, -0.8]}>
            <mesh castShadow>
              <boxGeometry args={[0.05, 0.05, 1.2]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Guard */}
            <mesh position={[0, 0, -0.4]} castShadow>
              <boxGeometry args={[0.3, 0.08, 0.08]} />
              <meshStandardMaterial color="#b8860b" metalness={0.9} roughness={0.3} /> {/* gold handle */}
            </mesh>
            <mesh position={[0, 0, -0.5]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.3]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color="#3d2817" />
            </mesh>
          </group>
        </primitive>
      </group>
    </>
  );
}
