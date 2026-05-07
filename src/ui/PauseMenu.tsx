import { useGameStore, GameState } from '../stores/useGameStore';
import { motion } from 'framer-motion';

export function PauseMenu() {
  const { setGameState } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center pointer-events-auto"
    >
      <div className="flex flex-col items-center gap-6 border border-neutral-700 bg-neutral-950/90 p-12">
        <h2 className="text-3xl font-serif text-amber-500 tracking-widest mb-4">PAUSED</h2>
        {[
          { label: 'Resume', action: () => { setGameState(GameState.PLAYING); setTimeout(() => document.body.requestPointerLock?.(), 0); } },
          { label: 'Inventory (I)', action: () => setGameState(GameState.INVENTORY) },
          { label: 'Main Menu', action: () => setGameState(GameState.MAIN_MENU) },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="w-48 py-3 border border-neutral-700 text-white font-serif tracking-widest hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
