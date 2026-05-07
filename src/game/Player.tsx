import { useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, GameState } from '../stores/useGameStore';
import { sounds } from '../audio/sounds';
import Ecctrl from 'ecctrl';

function PlayerLogic() {
  const { gameState, modifyStamina, stamina } = useGameStore();
  const { camera } = useThree();
  const [isAttacking, setIsAttacking] = useState(false);
  const [, getKeys] = useKeyboardControls();
  
  // Update minimap & compass
  useFrame((state, delta) => {
    (window as any).__cameraAngle = camera.rotation.y;
    (window as any).__playerPos = { x: camera.position.x, z: camera.position.z };

    if (gameState !== GameState.PLAYING) return;

    const keys = getKeys();
    const isMoving = keys.forward || keys.backward || keys.leftward || keys.rightward;
    const isSprinting = keys.run && isMoving && stamina > 0;

    // Stamina logic
    if (isSprinting) {
      modifyStamina(-10 * delta); // drain stamina
    } else if (!isSprinting && stamina < 100) {
      modifyStamina(5 * delta); // recover stamina
    }

    // Sound logic
    if (isMoving) {
      const time = state.clock.getElapsedTime();
      const frequency = isSprinting ? 12 : 8;
      if (Math.sin(time * frequency) > 0.95) {
         if (!sounds.footstep.playing()) sounds.footstep.play();
      }
    }
  });

  // Attack logic
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (gameState !== GameState.PLAYING || e.button !== 0 || isAttacking || stamina < 10) return;
      
      setIsAttacking(true);
      modifyStamina(-10);
      sounds.swing.play();

      // Attack Raycast
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(camera.parent?.children || [], true);
      
      for (const hit of intersects) {
        if (hit.object.userData?.isEnemy && hit.distance < 3.5) {
          hit.object.userData.takeDamage?.(15);
          break;
        }
        if (hit.distance > 3.5) break;
      }

      setTimeout(() => setIsAttacking(false), 250);
    };
    window.addEventListener('mousedown', handleMouse);
    return () => window.removeEventListener('mousedown', handleMouse);
  }, [gameState, isAttacking, stamina, modifyStamina, camera]);

  return null;
}

export function Player() {
  const { gameState } = useGameStore();

  return (
    <>
      {gameState === GameState.PLAYING && (
        <>
          <PointerLockControls pointerSpeed={(window as any).__SENSITIVITY || 1.0} />
          <Ecctrl
            camInitDis={-0.01}
            camMaxDis={-0.01}
            floatHeight={0}
            characterInitDir={Math.PI}
            followLight
            disableFollowCam={false}
            capsuleHalfHeight={0.5}
            capsuleRadius={0.3}
            floatingDis={0.3}
            springK={1.5}
            dampingC={0.1}
            autoBalance={false}
            jumpVel={5}
            sprintMult={1.8}
            position={[0, 2, 0]}
          >
            <mesh castShadow>
              <capsuleGeometry args={[0.3, 1]} />
              <meshStandardMaterial visible={false} />
            </mesh>
          </Ecctrl>
          <PlayerLogic />
        </>
      )}
    </>
  );
}
