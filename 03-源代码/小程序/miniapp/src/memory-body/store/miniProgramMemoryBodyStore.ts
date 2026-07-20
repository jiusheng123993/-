// 星寰海 v2.0 - memory-body 本地存储适配器（小程序版）
import { getStorage, setStorage } from '../../utils/storage';
import type { MoodEntry, EmotionPattern, ScheduleEvent } from '../types/memoryBodyTypes';

const STORAGE_KEYS = {
  MOOD_ENTRIES: 'mood_entries',
  EMOTION_PATTERNS: 'emotion_patterns',
  MEMORY_INDEX: 'memory_index',
  SCHEDULE_EVENTS: 'schedule_events'
};

/** 情绪索引 */
interface EmotionIndex {
  [date: string]: {
    mood: string;
    intensity: number;
    count: number;
  };
}

interface StoredMoodEntry {
  id: string;
  userId: string;
  mood: string;
  intensity: number;
  context?: string[];
  note?: string;
  createdAt: number;
}

interface StoredEmotionPattern {
  id: string;
  userId: string;
  patternType: 'weekly' | 'monthly' | 'trigger';
  description: string;
  confidence: number;
  createdAt: number;
}

export class MiniProgramMemoryBodyStore {
  saveMoodEntry(entry: MoodEntry): void {
    const storedEntry: StoredMoodEntry = {
      ...entry,
      createdAt: entry.createdAt instanceof Date ? entry.createdAt.getTime() : entry.createdAt,
    };
    const entries = this.getRawMoodEntries();
    entries.unshift(storedEntry);
    if (entries.length > 500) {
      entries.splice(500);
    }
    setStorage(STORAGE_KEYS.MOOD_ENTRIES, entries);
    this.updateEmotionIndex(entry);
  }

  private getRawMoodEntries(): StoredMoodEntry[] {
    return getStorage<StoredMoodEntry[]>(STORAGE_KEYS.MOOD_ENTRIES) || [];
  }

  getMoodEntries(): MoodEntry[] {
    return this.getRawMoodEntries().map(e => ({
      ...e,
      createdAt: new Date(e.createdAt),
    })) as MoodEntry[];
  }

  getRecentMoodEntries(days: number): MoodEntry[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.getMoodEntries().filter(e => e.createdAt.getTime() > cutoff);
  }

  /** 更新情绪索引 */
  private updateEmotionIndex(entry: MoodEntry): void {
    const index = getStorage<EmotionIndex>(STORAGE_KEYS.MEMORY_INDEX) || {};
    const dateKey = entry.createdAt.toISOString().split('T')[0];
    if (!index[dateKey]) {
      index[dateKey] = {
        mood: entry.mood,
        intensity: entry.intensity,
        count: 1
      };
    } else {
      index[dateKey].count++;
      // 取平均强度
      index[dateKey].intensity = Math.round(
        (index[dateKey].intensity * (index[dateKey].count - 1) + entry.intensity) / index[dateKey].count
      );
    }
    setStorage(STORAGE_KEYS.MEMORY_INDEX, index);
  }

  /** 获取情绪模式 */
  getEmotionPatterns(): EmotionPattern[] {
    return getStorage<EmotionPattern[]>(STORAGE_KEYS.EMOTION_PATTERNS) || [];
  }

  /** 保存情绪模式 */
  saveEmotionPattern(pattern: EmotionPattern): void {
    const patterns = this.getEmotionPatterns();
    patterns.unshift(pattern);
    setStorage(STORAGE_KEYS.EMOTION_PATTERNS, patterns.slice(0, 20));
  }

  /** 清空情绪记录 */
  clearMoodEntries(): void {
    setStorage(STORAGE_KEYS.MOOD_ENTRIES, []);
    setStorage(STORAGE_KEYS.MEMORY_INDEX, {});
  }

  /** 清空所有数据 */
  clearAll(): void {
    setStorage(STORAGE_KEYS.MOOD_ENTRIES, []);
    setStorage(STORAGE_KEYS.EMOTION_PATTERNS, []);
    setStorage(STORAGE_KEYS.MEMORY_INDEX, {});
    setStorage(STORAGE_KEYS.SCHEDULE_EVENTS, []);
  }

  // ========== 日程事件存储 ==========

  /** 保存单个日程事件 */
  saveScheduleEvent(event: ScheduleEvent): void {
    const events = this.getScheduleEvents();
    events.unshift(event);
    // 最多保留1000条
    if (events.length > 1000) {
      events.splice(1000);
    }
    setStorage(STORAGE_KEYS.SCHEDULE_EVENTS, events);
  }

  /** 获取所有日程事件 */
  getScheduleEvents(): ScheduleEvent[] {
    return getStorage<ScheduleEvent[]>(STORAGE_KEYS.SCHEDULE_EVENTS) || [];
  }

  /** 批量保存日程事件 */
  saveAllScheduleEvents(events: ScheduleEvent[]): void {
    setStorage(STORAGE_KEYS.SCHEDULE_EVENTS, events);
  }

  /** 加载日程事件 */
  loadScheduleEvents(): ScheduleEvent[] | null {
    const events = getStorage<ScheduleEvent[]>(STORAGE_KEYS.SCHEDULE_EVENTS);
    return events || null;
  }
}
