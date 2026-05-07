import { useState } from 'react';
import { useGameStore, GameState } from '../stores/useGameStore';
import { motion } from 'framer-motion';

const races = [
  { name: "Northerner", desc: "+15% frost resistance. Starts with Iron Sword.", Region: "Ice Lands" },
  { name: "Easterner", desc: "+10% attack speed. Starts with Curved Blade.", Region: "Eastern Lands" },
  { name: "Midlander", desc: "Balanced stats. Good for beginners.", Region: "Middle Earth" },
];

export function CharacterCreation() {
  const { setGameState, setRace, applyRaceStats } = useGameStore();
  const [selectedRace, setSelectedRace] = useState(2); // Default to Midlander
  const [name, setName] = useState("");

  const handleStart = () => {
    if (!name) return;
    setRace(races[selectedRace].name.toLowerCase() as 'northerner' | 'easterner' | 'midlander');
    applyRaceStats();

    // Give Starting weapon
    let wpnName = "Basic Sword";
    if (selectedRace === 0) wpnName = "Iron Sword";
    if (selectedRace === 1) wpnName = "Curved Blade";
    
    useGameStore.getState().addItem({
      id: 'start_wpn',
      name: wpnName,
      type: 'weapon',
      rarity: 'common',
      stackable: false,
      quantity: 1,
      description: 'A basic weapon.',
      icon: '🗡️',
      value: 10,
      stats: { damage: selectedRace === 2 ? 10 : 15 }
    });

    useGameStore.getState().equipItem(0, 'weapon'); // Attempt to auto-equip

    // Give some basic potions
    useGameStore.getState().addItem({
      id: 'hp_start',
      name: 'HP Potion',
      type: 'consumable',
      rarity: 'common',
      stackable: true,
      quantity: 3,
      description: 'Restores 30 Health.',
      icon: '💊',
      value: 15,
      stats: { health: 30 }
    });

    setGameState(GameState.LOADING);
  };

  return (
    <div className="absolute inset-0 z-50 bg-neutral-900 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] flex items-center justify-center p-8">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-black/80 border border-amber-900/50 p-8 shadow-2xl flex flex-col h-[600px]"
      >
        <h2 className="text-3xl text-amber-500 font-serif tracking-widest text-center border-b border-amber-900/50 pb-4 mb-6">
          CREATE YOUR LEGEND
        </h2>

        <div className="flex-1 flex gap-8">
          
          {/* Left panel: Races */}
          <div className="w-1/3 flex flex-col gap-4">
            <h3 className="text-amber-100 font-serif tracking-widest text-sm mb-2">ORIGIN</h3>
            {races.map((race, i) => (
              <button
                key={race.name}
                onClick={() => setSelectedRace(i)}
                className={`text-left p-4 border font-serif cursor-pointer transition-all duration-200
                  ${selectedRace === i 
                    ? 'border-amber-500 bg-amber-900/20 text-white' 
                    : 'border-neutral-700 bg-black/40 text-neutral-400 hover:border-amber-700/50 hover:text-amber-100'}`}
              >
                <div className="text-lg font-bold">{race.name}</div>
                <div className="text-xs mt-1 text-amber-500/80">From: {race.Region}</div>
              </button>
            ))}
          </div>

          {/* Right panel: Details */}
          <div className="flex-1 flex flex-col p-6 bg-black/40 border border-neutral-800">
            <h3 className="text-2xl text-amber-300 font-serif mb-4">{races[selectedRace].name}</h3>
            <p className="text-neutral-300 font-serif leading-relaxed mb-8">
              {races[selectedRace].desc}
            </p>

            <div className="mt-auto flex flex-col gap-4">
              <div>
                <label className="block text-amber-100/60 font-serif text-sm mb-2 uppercase tracking-widest">Character Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 font-serif focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Enter name..."
                />
              </div>

              <button
                onClick={handleStart}
                disabled={!name}
                className="mt-4 w-full py-4 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 font-serif tracking-[0.2em] text-white uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Begin Journey
              </button>
            </div>
          </div>

        </div>
      </motion.div>

    </div>
  );
}
