import { useGameStore, GameState } from '../stores/useGameStore';
import { motion } from 'framer-motion';

export function MainMenu() {
  const { setGameState } = useGameStore();

  return (
    <div className="absolute inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/30 via-neutral-950 to-neutral-950"></div>
        <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animation-slow-pan"></div>
      </div>

      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,1)]"></div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 text-center mb-16"
      >
        <h1 className="text-6xl md:text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-700 tracking-widest font-bold drop-shadow-[0_0_20px_rgba(217,119,6,0.6)]">
          SHARDS OF THE ABYSS
        </h1>
        <p className="text-amber-500/80 font-serif tracking-[0.4em] mt-6 uppercase text-sm drop-shadow-md">
          A First-Person RPG Experience
        </p>
      </motion.div>

      <div className="flex flex-col gap-6 relative z-10 w-72">
        {[
          { label: "New Game", action: () => setGameState(GameState.CHARACTER_CREATION) },
          { label: "Load Game", action: () => alert("Not implemented in demo") },
          { label: "Settings", action: () => alert("Not implemented in demo") },
        ].map((btn, i) => (
          <motion.button
            key={btn.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
            onClick={btn.action}
            className="group relative px-6 py-4 border border-amber-900/50 bg-black/60 hover:bg-amber-900/30 transition-all overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 w-0 bg-gradient-to-r from-amber-600/30 to-transparent transition-all duration-300 group-hover:w-full"></div>
            <span className="relative z-10 font-serif text-amber-100 tracking-[0.2em] uppercase text-sm shadow-black drop-shadow-md">{btn.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
