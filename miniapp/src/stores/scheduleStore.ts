// 星寰海 v2.0 - Zustand状态管理：日程/日历（完整实现）
import { create } from 'zustand';
import type { MoodTag, ContextTag, EmotionIntensity } from '../memory-body/types/memoryBodyTypes';
import { MiniProgramMemoryBodyStore } from '../memory-body/store/miniProgramMemoryBodyStore';

const memoryStore = new MiniProgramMemoryBodyStore();

/** 情绪风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** 日程事件 */
export interface ScheduleEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  emotionTag?: MoodTag;
  intensity?: EmotionIntensity;
  contextTags?: ContextTag[];
  riskLevel: RiskLevel;
  anxietyEstimate?: number;
  note?: string;
  createdAt: Date;
}

/** 月度统计 */
export interface MonthlyStats {
  totalEntries: number;
  mostCommonMood: MoodTag | null;
  avgIntensity: number;
  highRiskDays: number;
  trend: 'improving' | 'declining' | 'stable';
  dailyAverage: number;
}

interface ScheduleStoreState {
  events: ScheduleEvent[];
  isLoading: boolean;
  currentMonth: Date;
  selectedDate: string | null;

  // 事件操作
  addEvent: (event: Omit<ScheduleEvent, 'id' | 'createdAt'>) => Promise<void>;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, updates: Partial<Omit<ScheduleEvent, 'id'>>) => void;

  // 查询操作
  getEventsByDate: (date: string) => ScheduleEvent[];
  getEventsByMonth: (year: number, month: number) => ScheduleEvent[];
  getMonthlyStats: (year: number, month: number) => MonthlyStats;
  hasEntriesOnDate: (date: string) => boolean;
  getEntryCountForDate: (date: string) => number;

  // 导航
  setCurrentMonth: (date: Date) => void;
  setSelectedDate: (date: string | null) => void;
  navigateMonth: (direction: 'prev' | 'next') => void;

  // 持久化
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

/** 根据情绪强度计算风险等级 */
function calculateRiskLevel(intensity?: EmotionIntensity): RiskLevel {
  if (!intensity) return 'low';
  if (intensity >= 8) return 'critical';
  if (intensity >= 6) return 'high';
  if (intensity >= 4) return 'medium';
  return 'low';
}

/** 获取月份的天数 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export const useScheduleStore = create<ScheduleStoreState>((set, get) => ({
  events: [],
  isLoading: false,
  currentMonth: new Date(),
  selectedDate: null,

  addEvent: async (event) => {
    set({ isLoading: true });
    try {
      const newEvent: ScheduleEvent = {
        ...event,
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date(),
        riskLevel: event.riskLevel || calculateRiskLevel(event.intensity),
      };

      set((state) => ({
        events: [newEvent, ...state.events].slice(0, 1000),
      }));

      // 持久化到本地存储
      await memoryStore.saveScheduleEvent(newEvent);

      set({ isLoading: false });
    } catch (err) {
      console.error('[ScheduleStore] Save failed:', err);
      set({ isLoading: false });
    }
  },

  removeEvent: (id) => {
    set((state) => ({
      events: state.events.filter(e => e.id !== id),
    }));
  },

  updateEvent: (id, updates) => {
    set((state) => ({
      events: state.events.map(e =>
        e.id === id ? { ...e, ...updates, riskLevel: updates.intensity ? calculateRiskLevel(updates.intensity) : e.riskLevel } : e
      ),
    }));
  },

  getEventsByDate: (date) => {
    return get().events.filter(e => e.date === date);
  },

  getEventsByMonth: (year, month) => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`;
    return get().events.filter(e => e.date >= startDate && e.date <= endDate);
  },

  getMonthlyStats: (year, month) => {
    const monthEvents = get().getEventsByMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);

    if (monthEvents.length === 0) {
      return {
        totalEntries: 0,
        mostCommonMood: null,
        avgIntensity: 0,
        highRiskDays: 0,
        trend: 'stable',
        dailyAverage: 0,
      };
    }

    // 统计最常见情绪
    const moodCounts: Record<string, number> = {};
    let totalIntensity = 0;
    let highRiskDays = 0;
    const datesWithEntries = new Set<string>();

    monthEvents.forEach(event => {
      if (event.emotionTag) {
        moodCounts[event.emotionTag] = (moodCounts[event.emotionTag] || 0) + 1;
      }
      if (event.intensity) {
        totalIntensity += event.intensity;
      }
      if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
        highRiskDays++;
      }
      datesWithEntries.add(event.date);
    });

    // 找出最常见的情绪
    let mostCommonMood: MoodTag | null = null;
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMood = mood as MoodTag;
      }
    });

    // 计算平均强度
    const avgIntensity = totalIntensity / monthEvents.length;

    // 计算趋势（简化版：对比上半月和下半月）
    const midPoint = Math.floor(daysInMonth / 2);
    const firstHalfAvg = monthEvents
      .filter(e => parseInt(e.date.split('-')[2]) <= midPoint)
      .reduce((sum, e) => sum + (e.intensity || 0), 0) / monthEvents.filter(e => parseInt(e.date.split('-')[2]) <= midPoint).length;
    const secondHalfAvg = monthEvents
      .filter(e => parseInt(e.date.split('-')[2]) > midPoint)
      .reduce((sum, e) => sum + (e.intensity || 0), 0) / monthEvents.filter(e => parseInt(e.date.split('-')[2]) > midPoint).length;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfAvg < firstHalfAvg - 1) {
      trend = 'improving';
    } else if (secondHalfAvg > firstHalfAvg + 1) {
      trend = 'declining';
    }

    return {
      totalEntries: monthEvents.length,
      mostCommonMood,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      highRiskDays,
      trend,
      dailyAverage: Math.round((monthEvents.length / daysInMonth) * 10) / 10,
    };
  },

  hasEntriesOnDate: (date) => {
    return get().events.some(e => e.date === date);
  },

  getEntryCountForDate: (date) => {
    return get().events.filter(e => e.date === date).length;
  },

  setCurrentMonth: (date) => {
    set({ currentMonth: date });
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  navigateMonth: (direction) => {
    const current = get().currentMonth;
    const newMonth = new Date(current);
    if (direction === 'prev') {
      newMonth.setMonth(current.getMonth() - 1);
    } else {
      newMonth.setMonth(current.getMonth() + 1);
    }
    set({ currentMonth: newMonth });
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    try {
      const storedEvents = await memoryStore.loadScheduleEvents();
      if (storedEvents && Array.isArray(storedEvents)) {
        set({ events: storedEvents });
      }
      set({ isLoading: false });
    } catch (err) {
      console.error('[ScheduleStore] Load failed:', err);
      set({ isLoading: false });
    }
  },

  saveToStorage: async () => {
    try {
      await memoryStore.saveAllScheduleEvents(get().events);
    } catch (err) {
      console.error('[ScheduleStore] Save failed:', err);
    }
  },
}));
