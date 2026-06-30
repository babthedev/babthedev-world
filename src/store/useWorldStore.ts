import { create } from 'zustand';

interface TourState {
  isTourActive: boolean;
  currentCheckpoint: string | null;
  tourWaypointIndex: number;
  currentDialogue: string | null;
  setTourActive: (active: boolean) => void;
  setCheckpoint: (checkpoint: string | null) => void;
  setTourWaypointIndex: (index: number) => void;
  setCurrentDialogue: (dialogue: string | null) => void;
}

interface PlayerState {
  position: [number, number, number];
  abdulrahmanPosition: [number, number, number];
  isReading: boolean;
  setPosition: (pos: [number, number, number]) => void;
  setAbdulrahmanPosition: (pos: [number, number, number]) => void;
  setIsReading: (reading: boolean) => void;
}

interface UIState {
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
}

interface WorldStore extends TourState, PlayerState, UIState {}

export const useWorldStore = create<WorldStore>((set) => ({
  // Tour Slice
  isTourActive: true,
  currentCheckpoint: null,
  tourWaypointIndex: 0,
  currentDialogue: null,
  setTourActive: (active) => set({ isTourActive: active }),
  setCheckpoint: (checkpoint) => set({ currentCheckpoint: checkpoint }),
  setTourWaypointIndex: (index) => set({ tourWaypointIndex: index }),
  setCurrentDialogue: (dialogue) => set({ currentDialogue: dialogue }),

  // Player Slice
  position: [0, 0, 0],
  abdulrahmanPosition: [0, 0, 0],
  isReading: false,
  setPosition: (pos) => set({ position: pos }),
  setAbdulrahmanPosition: (pos) => set({ abdulrahmanPosition: pos }),
  setIsReading: (reading) => set({ isReading: reading }),

  // UI Slice
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
