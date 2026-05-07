import { useGameStore, GameState } from '../stores/useGameStore';
import { motion } from 'framer-motion';

export function DeadScreen() {
  const { setGameState, modifyHealth, modifyStamina, modifyMana } = useGameStore();

  const handleRespawn = () => {
    modifyHealth(1000); // Reset max
    modifyStamina(1000);
    modifyMana(1000);
    setGameState(GameState.PLAYING);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-8"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 1.5 }}
        className="text-6xl font-serif text-red-700 tracking-widest"
      >
        YOU DIED
      </motion.h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="flex gap-6"
      >
        <button
          onClick={handleRespawn}
          className="px-8 py-3 border border-red-900/50 text-white font-serif tracking-widest hover:bg-red-900/30 transition-colors cursor-pointer"
        >
          RESPAWN
        </button>
        <button
          onClick={() => setGameState(GameState.MAIN_MENU)}
          className="px-8 py-3 border border-neutral-700 text-neutral-400 font-serif tracking-widest hover:bg-neutral-900 transition-colors cursor-pointer"
        >
          MAIN MENU
        </button>
      </motion.div>
    </motion.div>
  );
}
