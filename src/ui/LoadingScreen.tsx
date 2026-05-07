import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, GameState } from '../stores/useGameStore';

const tips = [
  "Enemies near the ruins are especially dangerous at night...",
  "Sprinting uses stamina. Keep an eye on your meter.",
  "Speak with the merchant — he might have some work for you.",
  "You can find forgotten chests in the wilderness.",
];

export function LoadingScreen() {
  const { setGameState } = useGameStore();
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress(Math.min(100, (elapsed / duration) * 100));
      if (elapsed >= duration) {
        clearInterval(timer);
        setGameState(GameState.PLAYING);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [setGameState]);

  return (
    <div className="absolute inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center p-12 overflow-hidden text-neutral-300">
      <div className="absolute top-1/3 flex flex-col items-center">
        <motion.h1 
          className="text-4xl md:text-6xl font-serif text-white tracking-widest uppercase mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Village of Ashford
        </motion.h1>
      </div>

      <div className="absolute bottom-24 w-full max-w-2xl px-6 flex flex-col items-center">
        <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mb-8 relative">
          <motion.div 
            className="h-full bg-amber-600/80"
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
          />
        </div>
        <motion.p 
          className="text-sm font-serif text-neutral-400 text-center italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {tip}
        </motion.p>
      </div>
    </div>
  );
}
