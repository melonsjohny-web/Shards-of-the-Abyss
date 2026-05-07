import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RapierRigidBody, RigidBody, CapsuleCollider } from '@react-three/rapier';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, GameState } from '../stores/useGameStore';

const SPEED = 5;
const SPRINT_SPEED = 9;
const JUMP_FORCE = 7;

export function Player() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const { camera, scene } = useThree();
  const { gameState, modifyStamina, stamina, modifyHealth } = useGameStore();
  const [isAttacking, setIsAttacking] = useState(false);
  
  const keys = useRef({ w: false, s: false, a: false, d: false, space: false, shift: false });
  const isGrounded = useRef(false);
  const lastVelocityY = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') keys.current.w = true;
      if (e.code === 'KeyS') keys.current.s = true;
      if (e.code === 'KeyA') keys.current.a = true;
      if (e.code === 'KeyD') keys.current.d = true;
      if (e.code === 'Space') keys.current.space = true;
      if (e.code === 'ShiftLeft') keys.current.shift = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') keys.current.w = false;
      if (e.code === 'KeyS') keys.current.s = false;
      if (e.code === 'KeyA') keys.current.a = false;
      if (e.code === 'KeyD') keys.current.d = false;
      if (e.code === 'Space') keys.current.space = false;
      if (e.code === 'ShiftLeft') keys.current.shift = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Attack logic
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (gameState !== GameState.PLAYING || e.button !== 0 || isAttacking || stamina < 10) return;
      
      setIsAttacking(true);
      modifyStamina(-10);

      // Trigger weapon swing event for DOM UI
      window.dispatchEvent(new Event('player-attack'));

      // Attack Raycast
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      const weapon = useGameStore.getState().equipment.weapon;
      const damage = weapon?.stats?.damage || 5;
      
      for (const hit of intersects) {
        if (hit.object.userData?.isEnemy && hit.distance < 3.5) {
          hit.object.userData.takeDamage?.(damage);
          break;
        }
        if (hit.distance > 3.5) break;
      }

      setTimeout(() => setIsAttacking(false), 250);
    };
    window.addEventListener('mousedown', handleMouse);
    return () => window.removeEventListener('mousedown', handleMouse);
  }, [gameState, isAttacking, stamina, modifyStamina, camera, scene]);


  useFrame((state, delta) => {
    if (!bodyRef.current || gameState !== GameState.PLAYING) return;

    const velocity = bodyRef.current.linvel();
    const velY = velocity.y;
    
    // Grounded check
    isGrounded.current = Math.abs(velY) < 0.15 && Math.abs(lastVelocityY.current) < 0.15;
    lastVelocityY.current = velY;

    const k = keys.current;
    const isSprinting = k.shift && stamina > 0;
    const speed = isSprinting ? SPRINT_SPEED : SPEED;

    // Movement relative to camera
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.copy(forward).cross(new THREE.Vector3(0, 1, 0)).normalize();
    
    const dir = new THREE.Vector3();
    if (k.w) dir.add(forward);
    if (k.s) dir.sub(forward);
    if (k.a) dir.sub(right);
    if (k.d) dir.add(right);
    
    if (dir.lengthSq() > 0) dir.normalize();

    bodyRef.current.setLinvel({
      x: dir.x * speed,
      y: velY,
      z: dir.z * speed
    }, true);

    // Jump
    if (k.space && isGrounded.current && stamina >= 15) {
      bodyRef.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
      modifyStamina(-15);
      keys.current.space = false; // one-shot
    }

    // Stamina
    const isMoving = k.w || k.s || k.a || k.d;
    if (isSprinting && isMoving) modifyStamina(-12 * delta);
    else if (stamina < 100) modifyStamina(6 * delta);

    // Camera following body
    const pos = bodyRef.current.translation();
    const bob = isMoving && isGrounded.current 
      ? Math.sin(state.clock.elapsedTime * (isSprinting ? 14 : 9)) * 0.06 
      : 0;
    camera.position.set(pos.x, pos.y + 0.8 + bob, pos.z);

    // Update global data for minimap
    (window as any).__playerPos = { x: pos.x, z: pos.z };
    (window as any).__cameraAngle = camera.rotation.y;
  });

  if (gameState !== GameState.PLAYING) return null;

  return (
    <>
      <PointerLockControls makeDefault pointerSpeed={(window as any).__SENSITIVITY || 1.0} />
      <RigidBody
        ref={bodyRef}
        colliders={false}
        mass={70}
        type="dynamic"
        position={[0, 15, 0]}
        enabledRotations={[false, false, false]}
        linearDamping={8}
        angularDamping={1}
      >
        <CapsuleCollider args={[0.5, 0.3]} />
      </RigidBody>
    </>
  );
}

