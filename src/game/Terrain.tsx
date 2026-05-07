import { RigidBody } from '@react-three/rapier';
import { createNoise2D } from 'simplex-noise';
import { useMemo } from 'react';
import * as THREE from 'three';

export function Terrain() {
  const geometry = useMemo(() => {
    const noise2D = createNoise2D();
    const size = 1000;
    const segments = 250;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Multi-octave noise
      let h = 
        noise2D(x * 0.005, z * 0.005) * 20 +
        noise2D(x * 0.02, z * 0.02) * 5 +
        noise2D(x * 0.05,  z * 0.05)  * 1;
        
      // Mountain pass (North)
      if (z < -300) {
        h += Math.abs(z + 300) * 0.2;
      }
      // Swamp (South)
      if (z > 300) {
        h = Math.min(h, 2); // flatten out slightly
      }
      
      // Village center is flat
      const distFromCenter = Math.sqrt(x * x + z * z);
      const flatness = Math.min(1, distFromCenter / 50);
      
      positions.setY(i, (h * flatness) - 0.5);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow raycast={() => null}>
        <meshStandardMaterial color="#2c4a1e" roughness={1} />
      </mesh>
    </RigidBody>
  );
}
