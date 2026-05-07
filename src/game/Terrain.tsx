import { RigidBody } from '@react-three/rapier';
import { createNoise2D } from 'simplex-noise';
import { useMemo } from 'react';
import * as THREE from 'three';

export function Terrain() {
  const geometry = useMemo(() => {
    const noise2D = createNoise2D();
    const geo = new THREE.PlaneGeometry(200, 200, 100, 100);
    geo.rotateX(-Math.PI / 2);
    
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Multi-octave noise
      const h = 
        noise2D(x * 0.01, z * 0.01) * 8 +
        noise2D(x * 0.05, z * 0.05) * 2 +
        noise2D(x * 0.1,  z * 0.1)  * 0.5;
      
      // Village center is flat
      const distFromCenter = Math.sqrt(x * x + z * z);
      const flatness = Math.min(1, distFromCenter / 30);
      
      // Subtly raise the base height so trees don't float completely or we shift the baseline
      positions.setY(i, (h * flatness) - 0.5);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#2c4a1e" roughness={1} />
      </mesh>
    </RigidBody>
  );
}
