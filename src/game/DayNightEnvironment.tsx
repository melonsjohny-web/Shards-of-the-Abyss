import { useFrame } from '@react-three/fiber';
import { useGameStore, GameState } from '../stores/useGameStore';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useEffect } from 'react';

export function DayNightEnvironment() {
  const { timeOfDay, setTimeOfDay, gameState } = useGameStore();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  // Time progresses
  useFrame((_, delta) => {
    if (gameState === GameState.PLAYING) { // PLAYING
      // 1 real minute = 30 game minutes
      // 60 seconds real = 0.5 hours game -> 1 sec = 0.00833 hours
      // delta is around 0.016s -> progressing by delta * 0.00833
      // let's speed it up a little bit for the demo: 1 real sec = 1 game hour -> delta * 1
      setTimeOfDay((timeOfDay + delta * 0.5) % 24);
    }

    if (dirLightRef.current) {
      // Map 0-24 to sun rotation. 6 AM is sunrise (0 deg), 12 PM is noon (90 deg), 18 PM is sunset (180 deg)
      // We want to calculate the angle based on time.
      const angle = ((timeOfDay - 6) / 12) * Math.PI;
      
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      const z = -0.5; // Slight tilt
      
      dirLightRef.current.position.set(x * 50, y * 50, z * 50);

      // Light intensity
      const isNight = timeOfDay < 5 || timeOfDay > 19;
      let intensity = 0;
      if (!isNight) {
        intensity = Math.max(0, Math.sin(angle) * 1.5);
      } else {
        // Moonlight
        intensity = 0.1;
      }
      dirLightRef.current.intensity = intensity;

      // Color
      if (timeOfDay > 5 && timeOfDay < 8) {
        dirLightRef.current.color.setHex(0xffaa55); // Sunrise
      } else if (timeOfDay > 17 && timeOfDay < 19) {
        dirLightRef.current.color.setHex(0xff5522); // Sunset
      } else if (isNight) {
        dirLightRef.current.color.setHex(0x5555bb); // Night
      } else {
        dirLightRef.current.color.setHex(0xffffff); // Day
      }
    }
  });

  const sunPosition = [
    Math.cos(((timeOfDay - 6) / 12) * Math.PI) * 100,
    Math.sin(((timeOfDay - 6) / 12) * Math.PI) * 100,
    -50
  ] as [number, number, number];

  return (
    <>
      <ambientLight intensity={timeOfDay > 6 && timeOfDay < 18 ? 0.25 : 0.05} />
      <directionalLight
        ref={dirLightRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <Sky
        distance={45000}
        sunPosition={sunPosition}
        inclination={0}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.7}
        rayleigh={timeOfDay > 6 && timeOfDay < 18 ? 1.5 : 0.1}
        turbidity={10}
      />
      <fog attach="fog" args={['#3a5a7a', 40, 150]} />
    </>
  );
}
