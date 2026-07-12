// 星寰海 v2.0 - 情绪记录Hook
import { useCallback } from 'react';
import { useMoodStore } from '../stores/moodStore';
import type { MoodTag, ContextTag, EmotionIntensity, MoodEntry } from '../memory-body/types/memoryBodyTypes';

export function useMood() {
  const { entries, isSaving, saveError, addEntry, getRecentEntries, clearEntries } = useMoodStore();

  const recordMood = useCallback(async (
    mood: MoodTag,
    intensity: EmotionIntensity,
    context?: ContextTag[],
    note?: string
  ): Promise<MoodEntry | null> => {
    try {
      const entryData: Omit<MoodEntry, 'id' | 'createdAt'> = {
        userId: '', // 从auth store获取，暂时留空
        mood,
        intensity,
        context,
        note
      };

      await addEntry(entryData);
      return entries[0] || null;
    } catch (err) {
      console.error('[useMood] Record failed:', err);
      return null;
    }
  }, [addEntry, entries]);

  return {
    entries,
    isSaving,
    saveError,
    recordMood,
    getRecentEntries,
    clearEntries
  };
}
