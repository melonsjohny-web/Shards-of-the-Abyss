import { EffectComposer, Bloom, Vignette, DepthOfField, ColorAverage } from '@react-three/postprocessing';
import { useGameStore, GameState } from '../stores/useGameStore';

export function Effects() {
  const { gameState } = useGameStore();

  return (
    <EffectComposer disableNormalPass>
      <Bloom 
        luminanceThreshold={0.5} 
        luminanceSmoothing={0.9} 
        height={300} 
        intensity={1.2} 
      />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
      {gameState === GameState.MAIN_MENU && (
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
      )}
    </EffectComposer>
  );
}
