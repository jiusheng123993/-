// 星寰海 v2.0 - Zustand状态管理：情绪记录
import { create } from 'zustand';
import type { MoodEntry } from '../memory-body/types/memoryBodyTypes';
import { MiniProgramMemoryBodyStore } from '../memory-body/store/miniProgramMemoryBodyStore';

const memoryStore = new MiniProgramMemoryBodyStore();

interface MoodStoreState {
  entries: MoodEntry[];
  isSaving: boolean;
  saveError: string | null;
  addEntry: (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => Promise<void>;
  getRecentEntries: (days: number) => MoodEntry[];
  clearEntries: () => void;
}

export const useMoodStore = create<MoodStoreState>((set, get) => ({
  entries: [],
  isSaving: false,
  saveError: null,

  addEntry: async (entry) => {
    set({ isSaving: true, saveError: null });
    try {
      const newEntry: MoodEntry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date(),
        ...entry
      };

      // 保存到Zustand store
      set((state) => ({
        entries: [newEntry, ...state.entries].slice(0, 500)
      }));

      // 持久化到本地存储
      memoryStore.saveMoodEntry(newEntry);

      set({ isSaving: false });
    } catch (err) {
      console.error('[MoodStore] Save failed:', err);
      set({
        isSaving: false,
        saveError: err instanceof Error ? err.message : '保存失败'
      });
    }
  },

  getRecentEntries: (days) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return get().entries.filter(e => e.createdAt.getTime() > cutoff);
  },

  clearEntries: () => set({ entries: [] })
}));

/** 从本地存储加载情绪记录 */
export function loadMoodEntriesFromStorage(): MoodEntry[] {
  return memoryStore.getMoodEntries();
}
