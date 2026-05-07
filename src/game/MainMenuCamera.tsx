import { useFrame } from '@react-three/fiber';

export function MainMenuCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.1;
    state.camera.position.set(
      Math.sin(t) * 15,
      10,
      Math.cos(t) * 15
    );
    state.camera.lookAt(0, 5, 0);
  });
  return null;
}
