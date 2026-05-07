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

export type Quest = {
  id: string;
  title: string;
  description: string;
  target: string;       // target type, e.g., 'enemy'
  required: number;     // amount to reach
  current: number;      // current progress
  completed: boolean;
  reward: { gold: number; xp: number };
};

export type InventoryItem = {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable';
  value: number;
  stats?: { damage?: number; defense?: number; health?: number };
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

  inventory: InventoryItem[];
  gold: number;
  addGold: (amount: number) => void;
  addItem: (item: InventoryItem) => void;

  xp: number;
  level: number;
  xpToNextLevel: number;
  addXP: (amount: number) => void;

  quests: Quest[];
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

  inventory: [],
  gold: 0,
  addGold: (amount) => set((state) => {
    state.addNotification(`Received ${amount} gold`, 'reward');
    return { gold: state.gold + amount };
  }),
  addItem: (item) => set((state) => {
    state.addNotification(`Obtained: ${item.name}`, 'reward');
    return { inventory: [...state.inventory, item] };
  }),

  quests: [],
  acceptQuest: (quest) => set((state) => ({ quests: [...state.quests, quest] })),
  updateQuestProgress: (target, amount) => set((state) => ({
    quests: state.quests.map(q => {
      if (q.target !== target || q.completed) return q;
      const current = Math.min(q.required, q.current + amount);
      const completed = current >= q.required;
      if (completed) {
        state.addGold(q.reward.gold);
        state.addXP(q.reward.xp);
        return { ...q, current, completed };
      }
      return { ...q, current };
    })
  })),

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
