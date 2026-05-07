import { useGameStore, GameState } from '../stores/useGameStore';
import { Heart, Shield, Zap, Compass, Flame, Star } from 'lucide-react';
import { useCameraAngle } from '../hooks/useCameraAngle';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../audio/sounds';

function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    let animId: number;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const playerPos = (window as any).__playerPos || { x: 0, z: 0 };
      
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, 120, 120);
      
      // Enemies
      const enemies = (window as any).__enemyPositions || [];
      ctx.fillStyle = 'red';
      enemies.forEach((e: any) => {
        const dx = (e.x - playerPos.x) / 2 + 60;
        const dz = (e.z - playerPos.z) / 2 + 60;
        if (dx > 0 && dx < 120 && dz > 0 && dz < 120) {
          ctx.fillRect(dx - 2, dz - 2, 4, 4);
        }
      });
      
      // Player always in center
      ctx.fillStyle = 'white';
      ctx.fillRect(58, 58, 4, 4);
      
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas ref={canvasRef} width={120} height={120} 
      className="mb-4 shadow-xl pointer-events-auto"
      style={{ border: '1px solid rgba(217,119,6,0.3)', borderRadius: 4 }} />
  );
}

function WeaponHUD() {
  const [isAttacking, setIsAttacking] = useState(false);

  useEffect(() => {
    const onAttack = () => {
      setIsAttacking(true);
      setTimeout(() => setIsAttacking(false), 250);
    };
    window.addEventListener('player-attack', onAttack);
    return () => window.removeEventListener('player-attack', onAttack);
  }, []);

  return (
    <div className="absolute -bottom-20 right-[5%] w-[300px] h-[500px] pointer-events-none z-0 origin-bottom-right">
      <motion.div
        animate={
          isAttacking
            ? { rotate: -60, x: -100, y: 50, scale: 1.1 }
            : { rotate: 10, x: 0, y: 0, scale: 1 }
        }
        transition={{ duration: 0.15 }}
        style={{ originX: 0.5, originY: 1, width: '100%', height: '100%' }}
      >
        <svg viewBox="0 0 100 400" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
          {/* Blade base */}
          <path d="M40,280 L60,280 L55,50 L50,20 L45,50 Z" fill="#9ca3af" />
          {/* Blade highlight */}
          <path d="M50,20 L55,50 L50,280 Z" fill="#d1d5db" />
          {/* Crossguard */}
          <rect x="25" y="280" width="50" height="15" rx="2" fill="#374151" />
          <path d="M25,280 L75,280 L70,295 L30,295 Z" fill="#1f2937" />
          {/* Grip */}
          <rect x="42" y="295" width="16" height="70" fill="#78350f" />
          <path d="M42,295 L50,295 L50,365 L42,365 Z" fill="#92400e" />
          {/* Pommel */}
          <circle cx="50" cy="375" r="12" fill="#374151" />
          <circle cx="50" cy="375" r="6" fill="#fbbf24" />
        </svg>
      </motion.div>
    </div>
  );
}

export function HUD() {
  const { gameState, health, maxHealth, stamina, maxStamina, mana, maxMana, interactionPrompt, timeOfDay, quests, level, xp, xpToNextLevel } = useGameStore();
  const angle = useCameraAngle();
  
  const [levelUpMsg, setLevelUpMsg] = useState<{level: number} | null>(null);

  useEffect(() => {
    const onLevelUp = (e: any) => {
      setLevelUpMsg({ level: e.detail.level });
      sounds.levelUp.play();
      setTimeout(() => setLevelUpMsg(null), 3000);
    };
    window.addEventListener('levelUp', onLevelUp);
    return () => window.removeEventListener('levelUp', onLevelUp);
  }, []);

  if (gameState !== GameState.PLAYING) return null;

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const activeQuests = quests.filter(q => !q.completed);
  // Compass offset: multiply angle by some factor to move the compass bar.
  // angle is in radians, -PI to PI. We want to convert this to pixels.
  // Let's say 2PI rads = 800px.
  const compassOffset = -(angle / (Math.PI * 2)) * 800;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      
      {/* Top Left: Notifications / Info */}
      <div className="flex flex-col gap-2 w-64">
        <div className="bg-black/50 text-white px-4 py-2 rounded font-serif max-w-fit border border-amber-900/50">
          <span className="text-amber-400">Day 1</span> - {formatTime(timeOfDay)}
        </div>
      </div>

      {/* Top Center: Compass */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-64 h-8 bg-neutral-900/80 border-t border-b border-amber-700/50 flex items-center overflow-hidden">
        <div 
          className="flex items-center gap-12 text-neutral-400 font-serif text-sm tracking-widest absolute"
          style={{ transform: `translateX(calc(-50% + ${compassOffset}px))`, left: '50%' }}
        >
          {/* We repeat the markers to allow wrapping effect */}
          <span>N</span><span>E</span><span>S</span><span>W</span>
          <span>N</span><span>E</span><span>S</span><span>W</span>
          <span>N</span><span>E</span><span>S</span><span>W</span>
        </div>
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-500/80 -translate-x-1/2 h-full z-10"></div>
      </div>

      {/* Top Right: Quests */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 max-w-xs">
        {activeQuests.map(q => {
          const stage = q.stages[q.currentStage];
          if (!stage) return null;
          return (
          <div key={q.id} className="bg-black/60 border border-amber-900/30 p-3 font-serif backdrop-blur-sm shadow-xl">
            <div className="text-amber-400 text-sm font-bold">{q.title}</div>
            <div className="text-neutral-300 text-xs mt-1 leading-relaxed">{stage.description}</div>
            {stage.objectives.map(obj => (
            <div key={obj.id} className="text-amber-600 text-xs mt-2 font-bold tracking-widest flex justify-between">
              <span>{obj.description}</span>
              <span>{obj.current}/{obj.required}</span>
            </div>
            ))}
          </div>
        )})}
      </div>

      {/* Center: Crosshair & Interaction */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
        <AnimatePresence>
          {levelUpMsg && (
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: -80, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute text-5xl font-serif text-amber-500 font-bold drop-shadow-[0_0_15px_rgba(217,119,6,0.8)] whitespace-nowrap"
            >
              LEVEL UP! ({levelUpMsg.level})
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-1.5 h-1.5 bg-white/50 backdrop-blur-md rounded-full shadow-[0_0_4px_black]"></div>
        {interactionPrompt && (
          <div className="bg-black/70 text-white px-4 py-1.5 rounded-sm font-serif border border-white/10 shadow-lg mt-8 flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-sans font-bold">E</span>
            {interactionPrompt}
          </div>
        )}
      </div>

      {/* Bottom Left: Vitals */}
      <div className="flex flex-col gap-3 w-64 relative">
        <Minimap />
        
        {/* Level Badge */}
        <div className="absolute top-[100px] -right-2 bg-black/80 border border-amber-600/50 px-3 py-1 rounded text-amber-500 font-serif font-bold text-sm flex items-center gap-2">
          <Star className="w-3 h-3" />
          Lvl {level}
        </div>

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

        {/* XP */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-950 flex items-center justify-center border border-amber-800 shadow-lg shadow-amber-900/20">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex-1 bg-black/60 h-2 rounded-full overflow-hidden border border-neutral-800 relative">
            <div 
              className="h-full bg-gradient-to-r from-amber-700 to-amber-400 transition-all duration-200"
              style={{ width: `${(xp / xpToNextLevel) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/50 mix-blend-overlay">
              {xp} / {xpToNextLevel}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Right: Quick slots */}
      <div className="absolute bottom-6 right-6 flex gap-2 z-10">
        {[1, 2, 3, 4].map((slot) => (
          <div key={slot} className="w-12 h-12 bg-neutral-900/80 border-2 border-neutral-700 rounded-sm flex items-center justify-center relative shadow-lg">
            <span className="absolute top-0.5 left-1 text-[10px] text-neutral-400 font-bold">{slot}</span>
            {slot === 1 && <div className="w-6 h-6 bg-neutral-600 rounded-sm rotate-45 transform"></div>}
          </div>
        ))}
      </div>

      <WeaponHUD />
    </div>
  );
}
