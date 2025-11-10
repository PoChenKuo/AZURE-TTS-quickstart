import { create } from "zustand";

type UIState = {
  lastCleanupRun?: string;
  setLastCleanupRun: (iso: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  lastCleanupRun: undefined,
  setLastCleanupRun: (iso: string) => set({ lastCleanupRun: iso }),
}));
