import { useGameStore, GameState } from '../stores/useGameStore';

export function InventoryScreen() {
  const { setGameState, inventory, gold, health, maxHealth, stamina, maxStamina, mana, maxMana } = useGameStore();

  return (
    <div className="absolute inset-0 z-50 bg-neutral-950/95 flex p-8 pointer-events-auto">
      {/* Left panel: Stats */}
      <div className="w-1/3 flex flex-col border border-amber-900/50 bg-black/80 p-6 mr-8">
        <h2 className="text-3xl text-amber-500 font-serif mb-6 tracking-widest">CHARACTER</h2>
        <div className="flex flex-col gap-4 font-serif text-amber-100">
          <div><span className="text-amber-700">Health:</span> {health} / {maxHealth}</div>
          <div><span className="text-amber-700">Stamina:</span> {Math.floor(stamina)} / {maxStamina}</div>
          <div><span className="text-amber-700">Mana:</span> {mana} / {maxMana}</div>
          <div className="mt-8 pt-4 border-t border-amber-900/50 text-xl">
            <span className="text-yellow-600">Gold:</span> {gold}
          </div>
        </div>
        <button 
          onClick={() => setGameState(GameState.PLAYING)}
          className="mt-auto py-3 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors font-serif uppercase tracking-widest"
        >
          Close (I / Esc)
        </button>
      </div>

      {/* Right panel: Grid */}
      <div className="flex-1 border border-amber-900/50 bg-black/80 flex flex-col p-6">
        <h2 className="text-3xl text-amber-500 font-serif mb-6 tracking-widest">INVENTORY</h2>
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 25 }).map((_, i) => {
            const item = inventory[i];
            return (
              <div key={i} className="aspect-square border border-neutral-800 bg-neutral-900 hover:border-amber-700/50 relative group transition-colors">
                {item && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-100 p-2 text-center text-xs">
                    <span className="font-serif font-bold text-sm text-amber-400 mb-1">{item.name}</span>
                    <span className="text-[10px] text-neutral-400">{item.type}</span>
                  </div>
                )}
                {!item && <div className="w-full h-full bg-neutral-900/50"></div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
