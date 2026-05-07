import { create } from 'zustand';

export enum GameState {
  MAIN_MENU,
  CHARACTER_CREATION,
  PLAYING,
  PAUSED,
  DIALOGUE,
  INVENTORY,
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

interface GameStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;

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

  inventory: any[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: GameState.MAIN_MENU,
  setGameState: (state) => set({ gameState: state }),

  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  mana: 50,
  maxMana: 50,

  modifyHealth: (amt) => set((state) => ({ health: Math.max(0, Math.min(state.maxHealth, state.health + amt)) })),
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
}));
