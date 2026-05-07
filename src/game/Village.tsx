import { RigidBody } from '@react-three/rapier';

export function Village() {
  return (
    <group>
      {/* Ground */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[100, 1, 100]} />
          <meshStandardMaterial color="#3a5f3a" /> {/* Grass green */}
        </mesh>
      </RigidBody>

      {/* Tavern */}
      <RigidBody type="fixed" colliders="cuboid" position={[10, 2.5, 10]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[10, 5, 8]} />
          <meshStandardMaterial color="#5c4033" /> {/* Dark brown wood */}
        </mesh>
      </RigidBody>

      {/* House 1 */}
      <RigidBody type="fixed" colliders="cuboid" position={[-15, 2, 5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[6, 4, 6]} />
          <meshStandardMaterial color="#8b7355" />
        </mesh>
      </RigidBody>

      {/* House 2 */}
      <RigidBody type="fixed" colliders="cuboid" position={[-10, 2, -15]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[6, 4, 6]} />
          <meshStandardMaterial color="#8b7355" />
        </mesh>
      </RigidBody>

      {/* Fence / Wall around village */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 1.5, 25]}>
        <mesh castShadow>
          <boxGeometry args={[50, 3, 1]} />
          <meshStandardMaterial color="#4a3018" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 1.5, -25]}>
        <mesh castShadow>
          <boxGeometry args={[50, 3, 1]} />
          <meshStandardMaterial color="#4a3018" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[25, 1.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 3, 50]} />
          <meshStandardMaterial color="#4a3018" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[-25, 1.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 3, 50]} />
          <meshStandardMaterial color="#4a3018" />
        </mesh>
      </RigidBody>

      {/* Trees (Simple Cylinder + Cone) */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = Math.random() * 40 - 20;
        const z = Math.random() * 40 - 20;
        // Don't spawn right in the middle
        if (Math.abs(x) < 5 && Math.abs(z) < 5) return null;

        return (
          <group key={i} position={[x, 0, z]}>
            <RigidBody type="fixed" colliders="cuboid">
              <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.4, 3]} />
                <meshStandardMaterial color="#3d2817" />
              </mesh>
            </RigidBody>
            <mesh position={[0, 4, 0]} castShadow>
              <coneGeometry args={[2, 4, 8]} />
              <meshStandardMaterial color="#2d4c1e" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
