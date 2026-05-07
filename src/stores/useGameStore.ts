import { create } from 'zustand';

export enum GameState {
  MAIN_MENU,
  CHARACTER_CREATION,
  LOADING,
  PLAYING,
  PAUSED,
  DIALOGUE,
  INVENTORY,
  SETTINGS,
  DEAD
}

export type DialogNode = {
  text: string;
  options: { text: string; next?: string; action?: () => void }[];
};

export type DialogState = {
  npcName: string;
  nodes: Record<string, DialogNode>;
  currentNode: string;
} | null;

export type QuestObjective = {
  id: string;
  description: string;
  target: string;
  required: number;
  current: number;
  completed: boolean;
};

export type QuestStage = {
  id: string;
  description: string;
  objectives: QuestObjective[];
  nextStages: string[];
  reward?: { gold: number; xp: number };
};

export type Quest = {
  id: string;
  title: string;
  stages: Record<string, QuestStage>;
  currentStage: string;
  completed: boolean;
};

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type InventoryItem = {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'material';
  rarity: ItemRarity;
  value: number;
  stackable: boolean;
  quantity: number;
  stats?: {
    damage?: number; defense?: number; health?: number;
    stamina?: number; mana?: number;
    critChance?: number; attackSpeed?: number;
  };
  description: string;
  icon: string;
};

interface GameStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;

  selectedRace: 'northerner' | 'easterner' | 'midlander';
  setRace: (race: 'northerner' | 'easterner' | 'midlander') => void;
  applyRaceStats: () => void;

  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  mana: number;
  maxMana: number;
  
  modifyHealth: (amt: number) => void;
  modifyStamina: (amt: number) => void;
  modifyMana: (amt: number) => void;

  timeOfDay: number; // 0 to 24
  setTimeOfDay: (time: number) => void;

  currentDialog: DialogState;
  setDialog: (dialog: DialogState) => void;
  advanceDialog: (nextNode?: string) => void;

  interactionPrompt: string | null;
  setInteractionPrompt: (prompt: string | null) => void;

  inventory: (InventoryItem | null)[];
  gold: number;
  equipment: {
    head: InventoryItem | null;
    body: InventoryItem | null;
    weapon: InventoryItem | null;
    legs: InventoryItem | null;
  };
  equipItem: (invIndex: number, slot: keyof GameStore['equipment']) => void;
  unequipItem: (slot: keyof GameStore['equipment']) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;
  addGold: (amount: number) => void;
  addItem: (item: InventoryItem) => void;

  xp: number;
  level: number;
  xpToNextLevel: number;
  addXP: (amount: number) => void;

  quests: Quest[];
  completedQuests: string[];
  acceptQuest: (quest: Quest) => void;
  updateQuestProgress: (target: string, amount: number) => void;

  notifications: { id: number; text: string; type?: 'info'|'reward'|'quest'|'level' }[];
  addNotification: (text: string, type?: 'info'|'reward'|'quest'|'level') => void;
  removeNotification: (id: number) => void;

  saveGame: () => void;
  loadGame: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: GameState.MAIN_MENU,
  setGameState: (state) => set({ gameState: state }),

  selectedRace: 'midlander',
  setRace: (race) => set({ selectedRace: race }),
  applyRaceStats: () => set((state) => {
    const mods = {
      northerner: { maxHealth: 130, maxStamina: 90, maxMana: 40 },
      easterner:  { maxHealth: 90,  maxStamina: 120, maxMana: 60 },
      midlander:  { maxHealth: 100, maxStamina: 100, maxMana: 50 },
    };
    const m = mods[state.selectedRace] || mods.midlander;
    return { ...m, health: m.maxHealth, stamina: m.maxStamina, mana: m.maxMana };
  }),

  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  mana: 50,
  maxMana: 50,

  modifyHealth: (amt) => set((state) => {
    const newHealth = Math.max(0, Math.min(state.maxHealth, state.health + amt));
    if (newHealth <= 0) {
      document.exitPointerLock?.();
      return { health: 0, gameState: GameState.DEAD };
    }
    return { health: newHealth };
  }),
  modifyStamina: (amt) => set((state) => ({ stamina: Math.max(0, Math.min(state.maxStamina, state.stamina + amt)) })),
  modifyMana: (amt) => set((state) => ({ mana: Math.max(0, Math.min(state.maxMana, state.mana + amt)) })),

  timeOfDay: 8, // Start at 8 AM
  setTimeOfDay: (time) => set({ timeOfDay: time }),

  currentDialog: null,
  setDialog: (dialog) => set({ currentDialog: dialog, gameState: GameState.DIALOGUE }),
  advanceDialog: (nextNode) => {
    const dialog = get().currentDialog;
    if (!dialog) return;
    if (!nextNode) {
      set({ currentDialog: null, gameState: GameState.PLAYING });
      return;
    }
    set({ currentDialog: { ...dialog, currentNode: nextNode } });
  },

  interactionPrompt: null,
  setInteractionPrompt: (prompt) => set({ interactionPrompt: prompt }),

  inventory: new Array(25).fill(null),
  equipment: { head: null, body: null, weapon: null, legs: null },
  
  equipItem: (invIndex, slot) => set((state) => {
    const item = state.inventory[invIndex];
    if (!item) return state; // nothing to equip
    
    // Check type matching
    if (slot === 'weapon' && item.type !== 'weapon') return state;
    if (slot !== 'weapon' && item.type !== 'armor') return state;
    
    const newInv = [...state.inventory];
    const currentEquipped = state.equipment[slot];
    
    // Swap
    newInv[invIndex] = currentEquipped;
    const newEq = { ...state.equipment, [slot]: item };
    return { inventory: newInv, equipment: newEq };
  }),
  
  unequipItem: (slot) => set((state) => {
    const item = state.equipment[slot];
    if (!item) return state;
    
    const emptyIdx = state.inventory.findIndex(i => i === null);
    if (emptyIdx === -1) {
      state.addNotification('Inventory is full!', 'info');
      return state;
    }
    
    const newInv = [...state.inventory];
    newInv[emptyIdx] = item;
    const newEq = { ...state.equipment, [slot]: null };
    return { inventory: newInv, equipment: newEq };
  }),
  
  moveItem: (fromIndex, toIndex) => set((state) => {
    const newInv = [...state.inventory];
    const temp = newInv[fromIndex];
    newInv[fromIndex] = newInv[toIndex];
    newInv[toIndex] = temp;
    return { inventory: newInv };
  }),

  gold: 0,
  addGold: (amount) => set((state) => {
    state.addNotification(`Received ${amount} gold`, 'reward');
    return { gold: state.gold + amount };
  }),
  addItem: (item) => set((state) => {
    const emptyIdx = state.inventory.findIndex(i => i === null);
    if (emptyIdx === -1) {
       state.addNotification(`Inventory full! Could not loot ${item.name}`, 'info');
       return state;
    }
    state.addNotification(`Obtained: ${item.name}`, 'reward');
    const newInv = [...state.inventory];
    newInv[emptyIdx] = item;
    return { inventory: newInv };
  }),

  quests: [],
  completedQuests: [],
  acceptQuest: (quest) => set((state) => ({ quests: [...state.quests, quest] })),
  updateQuestProgress: (target, amount) => set((state) => {
    let goldReward = 0;
    let xpReward = 0;
    const completedIds: string[] = [];
    
    const newQuests = state.quests.map(q => {
      if (q.completed) return q;
      
      const stage = q.stages[q.currentStage];
      let stageCompleted = true;
      
      const newObjectives = stage.objectives.map(obj => {
        if (obj.target === target && !obj.completed) {
          const current = Math.min(obj.required, obj.current + amount);
          const completed = current >= obj.required;
          if (!completed) stageCompleted = false;
          return { ...obj, current, completed };
        }
        if (!obj.completed) stageCompleted = false;
        return obj;
      });

      if (stageCompleted) {
        if (stage.reward) {
          goldReward += stage.reward.gold;
          xpReward += stage.reward.xp;
        }
        // Advance stage or complete
        if (stage.nextStages && stage.nextStages.length > 0) {
          return {
            ...q,
            currentStage: stage.nextStages[0],
            stages: {
              ...q.stages,
              [q.currentStage]: { ...stage, objectives: newObjectives }
            }
          };
        } else {
          completedIds.push(q.id);
          return {
             ...q,
             completed: true,
             stages: {
              ...q.stages,
              [q.currentStage]: { ...stage, objectives: newObjectives }
            }
          };
        }
      }

      return {
        ...q,
        stages: {
          ...q.stages,
          [q.currentStage]: { ...stage, objectives: newObjectives }
        }
      };
    });

    if (goldReward > 0) state.addGold(goldReward);
    if (xpReward > 0) state.addXP(xpReward);

    return { 
      quests: newQuests,
      completedQuests: [...state.completedQuests, ...completedIds]
    };
  }),

  notifications: [],
  addNotification: (text, type = 'info') => set((state) => ({
    notifications: [...state.notifications, { id: Date.now() + Math.random(), text, type }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  xp: 0,
  level: 1,
  xpToNextLevel: 100,
  addXP: (amount) => set((state) => {
    let { xp, level, xpToNextLevel } = state;
    xp += amount;
    const levelsGained: number[] = [];
    while (xp >= xpToNextLevel) {
      xp -= xpToNextLevel;
      level++;
      xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
      levelsGained.push(level);
    }
    const bonuses = levelsGained.reduce((acc) => ({
      maxHealth: acc.maxHealth + 10,
      maxStamina: acc.maxStamina + 5,
    }), { maxHealth: state.maxHealth, maxStamina: state.maxStamina });
    
    // Set global event to show level up popup
    if (levelsGained.length > 0) {
      window.dispatchEvent(new CustomEvent('levelUp', { detail: { level } }));
      state.addNotification(`Level Up! Reached level ${level}`, 'level');
    }

    return { xp, level, xpToNextLevel, ...bonuses };
  }),

  saveGame: () => {
    const state = get();
    const save = {
      health: state.health, maxHealth: state.maxHealth,
      stamina: state.stamina, maxStamina: state.maxStamina,
      mana: state.mana, maxMana: state.maxMana,
      gold: state.gold, level: state.level, xp: state.xp, xpToNextLevel: state.xpToNextLevel,
      quests: state.quests, inventory: state.inventory,
      selectedRace: state.selectedRace,
      savedAt: Date.now(),
    };
    localStorage.setItem('shards_save', JSON.stringify(save));
  },

  loadGame: () => {
    const raw = localStorage.getItem('shards_save');
    if (!raw) return false;
    const save = JSON.parse(raw);
    set({ ...save, gameState: GameState.PLAYING });
    return true;
  },
}));
