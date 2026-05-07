import { EffectComposer, Bloom, Vignette, N8AO, DepthOfField } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useGameStore, GameState } from '../stores/useGameStore';

export function Effects() {
  const { gameState } = useGameStore();

  return (
    <EffectComposer>
      <N8AO
        aoRadius={2}
        intensity={1}
      />
      <Bloom
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        intensity={0.5}
        height={300}
      />
      <Vignette offset={0.3} darkness={0.6} />
      {gameState === GameState.MAIN_MENU && (
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
      )}
    </EffectComposer>
  );
}
