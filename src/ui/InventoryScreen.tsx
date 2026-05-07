import { useGameStore, GameState } from '../stores/useGameStore';
import React, { useState } from 'react';

export function InventoryScreen() {
  const { 
    setGameState, 
    inventory, 
    equipment, 
    gold, 
    health, maxHealth, 
    stamina, maxStamina, 
    mana, maxMana,
    moveItem,
    equipItem,
    unequipItem
  } = useGameStore();

  const [hoverItem, setHoverItem] = useState<any>(null);

  const handleDragStart = (e: React.DragEvent, type: 'inventory' | 'equipment', indexOrSlot: number | string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, indexOrSlot }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetType: 'inventory' | 'equipment', targetIndexOrSlot: number | string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    if (data.type === 'inventory' && targetType === 'inventory') {
      moveItem(data.indexOrSlot, targetIndexOrSlot as number);
    } 
    else if (data.type === 'inventory' && targetType === 'equipment') {
      equipItem(data.indexOrSlot, targetIndexOrSlot as any);
    }
    else if (data.type === 'equipment' && targetType === 'inventory') {
      unequipItem(data.indexOrSlot as any);
      // It auto-puts it to first empty slot, ideally we could put it in specific targetIndex
      // but we haven't implemented specific slot tracking when unequipping yet.
    }
  };

  const renderTooltip = () => {
    if (!hoverItem) return null;
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 border border-amber-500/50 bg-black/95 p-4 z-50 w-64 pointer-events-none text-serif shadow-2xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{hoverItem.icon}</span>
          <h3 className={`text-lg font-bold ${
            hoverItem.rarity === 'common' ? 'text-gray-300' :
            hoverItem.rarity === 'uncommon' ? 'text-green-400' :
            hoverItem.rarity === 'rare' ? 'text-blue-400' :
            hoverItem.rarity === 'epic' ? 'text-purple-400' :
            'text-orange-400'
          }`}>{hoverItem.name}</h3>
        </div>
        <p className="text-xs text-neutral-400 italic mb-2">{hoverItem.description}</p>
        <div className="text-xs text-amber-200 mb-2">Type: {hoverItem.type}</div>
        {hoverItem.stats && (
          <div className="border-t border-white/10 pt-2 mb-2 text-xs">
            {Object.entries(hoverItem.stats).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-neutral-400 capitalize">{k}</span>
                <span className="text-green-400">+{v}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between text-xs font-bold text-yellow-600 mt-2">
          <span>Value:</span>
          <span>{hoverItem.value}g</span>
        </div>
      </div>
    );
  };

  const renderEquipSlot = (slot: string, label: string) => {
    const item = equipment[slot as keyof typeof equipment];
    return (
      <div 
        className="w-16 h-16 border-2 border-neutral-700 bg-black/50 relative flex items-center justify-center cursor-pointer hover:border-amber-500 transition shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'equipment', slot)}
        onMouseEnter={() => setHoverItem(item)}
        onMouseLeave={() => setHoverItem(null)}
        draggable={!!item}
        onDragStart={(e) => handleDragStart(e, 'equipment', slot)}
      >
        <span className="absolute bottom-1 left-0 right-0 text-[9px] text-center text-neutral-600 uppercase font-bold tracking-widest">{label}</span>
        {item && <span className="text-3xl relative z-10 filter drop-shadow-md">{item.icon}</span>}
      </div>
    );
  };

  const handleRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const item = inventory[index];
    if (!item) return;

    if (item.type === 'consumable') {
      if (item.stats?.health) {
        useGameStore.getState().modifyHealth(item.stats.health);
      }
      
      const newInv = [...inventory];
      if (item.quantity > 1) {
        newInv[index] = { ...item, quantity: item.quantity - 1 };
      } else {
        newInv[index] = null;
      }
      useGameStore.setState({ inventory: newInv });
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-neutral-950/95 flex p-8 pointer-events-auto">
      {renderTooltip()}
      
      {/* Left panel: Stats & Equipment */}
      <div className="w-1/3 flex flex-col border border-amber-900/50 bg-black/80 p-6 mr-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-700 to-transparent"></div>
        <h2 className="text-3xl text-amber-500 font-serif mb-6 tracking-widest text-center shadow-black drop-shadow-md">CHARACTER</h2>
        
        <div className="flex gap-6 justify-center mb-8 pb-8 border-b border-white/10">
          <div className="flex flex-col gap-4">
            {renderEquipSlot('head', 'Head')}
            {renderEquipSlot('weapon', 'Weapon')}
          </div>
          <div className="w-32 bg-neutral-900 border border-neutral-800 rounded-sm p-2 silhouette-box opacity-50 flex items-center justify-center overflow-hidden">
             {/* Character silhouette placeholder */}
             <div className="w-full h-full border-2 border-dashed border-neutral-700 rounded-full flex items-center justify-center text-neutral-600 text-xs text-center font-bold font-serif opacity-30 uppercase tracking-widest">
               Hero
             </div>
          </div>
          <div className="flex flex-col gap-4">
            {renderEquipSlot('body', 'Body')}
            {renderEquipSlot('legs', 'Legs')}
          </div>
        </div>

        <div className="flex flex-col gap-4 font-serif text-amber-100 bg-black/40 p-4 border border-white/5 rounded-sm">
          <div className="flex items-center justify-between"><span className="text-amber-700">Health</span> <span>{health} / {maxHealth}</span></div>
          <div className="flex items-center justify-between"><span className="text-amber-700">Stamina</span> <span>{Math.floor(stamina)} / {maxStamina}</span></div>
          <div className="flex items-center justify-between"><span className="text-amber-700">Mana</span> <span>{mana} / {maxMana}</span></div>
          
          <div className="mt-4 pt-4 border-t border-amber-900/50 text-xl flex justify-between tracking-widest">
            <span className="text-yellow-600 font-bold">Gold</span> <span>{gold}</span>
          </div>
        </div>
        
        <button 
          onClick={() => setGameState(GameState.PLAYING)}
          className="mt-auto py-3 border border-amber-900/50 text-neutral-400 hover:text-amber-400 hover:bg-amber-900/20 transition-all font-serif uppercase tracking-widest font-bold tracking-widest"
        >
          Close (I / Esc)
        </button>
      </div>

      {/* Right panel: Grid */}
      <div className="flex-1 border border-amber-900/50 bg-black/80 flex flex-col p-6 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-700 to-transparent"></div>
        <h2 className="text-3xl text-amber-500 font-serif mb-6 tracking-widest text-center drop-shadow-md shadow-black">INVENTORY</h2>
        
        <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-amber-900 scrollbar-track-black">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] gap-2">
            {inventory.map((item, i) => (
              <div 
                key={i} 
                className={`aspect-square border-2 ${item ? 'border-neutral-700 bg-neutral-900 cursor-pointer hover:border-amber-500' : 'border-neutral-800 bg-black/50'} relative flex items-center justify-center transition-all shadow-inner`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'inventory', i)}
                onMouseEnter={() => item && setHoverItem(item)}
                onMouseLeave={() => setHoverItem(null)}
                draggable={!!item}
                onDragStart={(e) => handleDragStart(e, 'inventory', i)}
                onContextMenu={(e) => handleRightClick(e, i)}
              >
                {item && (
                  <span className="text-4xl filter drop-shadow-md">{item.icon}</span>
                )}
                {item?.quantity && item.quantity > 1 && (
                  <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white drop-shadow-md">x{item.quantity}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
