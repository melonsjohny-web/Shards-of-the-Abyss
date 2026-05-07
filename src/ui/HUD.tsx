import { useGameStore, GameState } from '../stores/useGameStore';
import { Heart, Shield, Zap, Compass, Flame } from 'lucide-react';

export function HUD() {
  const { gameState, health, maxHealth, stamina, maxStamina, mana, maxMana, interactionPrompt, timeOfDay } = useGameStore();

  if (gameState !== GameState.PLAYING) return null;

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      
      {/* Top Left: Notifications / Info */}
      <div className="flex flex-col gap-2">
        <div className="bg-black/50 text-white px-4 py-2 rounded font-serif max-w-fit border border-amber-900/50">
          <span className="text-amber-400">Day 1</span> - {formatTime(timeOfDay)}
        </div>
      </div>

      {/* Top Center: Compass */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-64 h-8 bg-neutral-900/80 border-t border-b border-amber-700/50 flex items-center justify-center overflow-hidden">
        <div className="flex items-center gap-8 text-neutral-400 font-serif text-sm tracking-widest relative">
          <span>W</span>
          <span className="text-amber-500 font-bold text-base scale-110">N</span>
          <span>E</span>
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-500/50 -translate-x-1/2 h-full"></div>
        </div>
      </div>

      {/* Center: Crosshair & Interaction */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
        <div className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-[0_0_4px_black]"></div>
        {interactionPrompt && (
          <div className="bg-black/70 text-white px-4 py-1.5 rounded-sm font-serif border border-white/10 shadow-lg mt-8 flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-sans font-bold">E</span>
            {interactionPrompt}
          </div>
        )}
      </div>

      {/* Bottom Left: Vitals */}
      <div className="flex flex-col gap-3 w-64">
        {/* Health */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-950 flex items-center justify-center border border-red-800 shadow-lg shadow-red-900/20">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </div>
          <div className="flex-1 bg-black/60 h-4 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-200"
              style={{ width: `${(health / maxHealth) * 100}%` }}
            />
          </div>
        </div>

        {/* Stamina */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-950 flex items-center justify-center border border-green-800 shadow-lg shadow-green-900/20">
            <Zap className="w-4 h-4 text-green-500 fill-green-500" />
          </div>
          <div className="flex-1 bg-black/60 h-3 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className="h-full bg-gradient-to-r from-green-700 to-green-500 transition-all duration-200"
              style={{ width: `${(stamina / maxStamina) * 100}%` }}
            />
          </div>
        </div>

        {/* Mana */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center border border-blue-800 shadow-lg shadow-blue-900/20">
            <Flame className="w-4 h-4 text-blue-500 fill-blue-500" />
          </div>
          <div className="flex-1 bg-black/60 h-3 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-200"
              style={{ width: `${(mana / maxMana) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Bottom Right: Quick slots */}
      <div className="absolute bottom-6 right-6 flex gap-2">
        {[1, 2, 3, 4].map((slot) => (
          <div key={slot} className="w-12 h-12 bg-neutral-900/80 border-2 border-neutral-700 rounded-sm flex items-center justify-center relative shadow-lg">
            <span className="absolute top-0.5 left-1 text-[10px] text-neutral-400 font-bold">{slot}</span>
            {slot === 1 && <div className="w-6 h-6 bg-neutral-600 rounded-sm rotate-45 transform"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
