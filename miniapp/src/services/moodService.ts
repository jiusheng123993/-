// 星寰海 v2.0 - 情绪记录服务
import type { MoodEntry, EmotionProfile } from '../memory-body/types/memoryBodyTypes';
import { MiniProgramMemoryBodyStore } from '../memory-body/store/miniProgramMemoryBodyStore';

const memoryStore = new MiniProgramMemoryBodyStore();

/** 保存情绪记录到本地 */
export async function saveMoodEntry(entry: Omit<MoodEntry, 'id' | 'createdAt'>): Promise<MoodEntry> {
  const newEntry: MoodEntry = {
    ...entry,
    id: `entry_${Date.now()}`,
    createdAt: new Date()
  };

  // 保存到本地存储
  memoryStore.saveMoodEntry(newEntry);

  return newEntry;
}

/** 获取情绪报告（7天趋势） */
export async function getMoodReport(days: number = 7): Promise<{
  averageIntensity: number;
  mostCommonMood: string;
  trend: 'up' | 'down' | 'stable';
}> {
  const entries = memoryStore.getRecentMoodEntries(days);

  if (entries.length === 0) {
    return {
      averageIntensity: 5,
      mostCommonMood: 'calm',
      trend: 'stable'
    };
  }

  // 计算平均强度
  const avgIntensity = entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length;

  // 找出最常见的情绪
  const moodCounts: Record<string, number> = {};
  entries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });
  const mostCommonMood = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a])[0];

  // 简单趋势判断：比较前半段和后半段的平均强度
  const half = Math.floor(entries.length / 2);
  const firstHalfAvg = entries.slice(0, half).reduce((sum, e) => sum + e.intensity, 0) / half;
  const secondHalfAvg = entries.slice(half).reduce((sum, e) => sum + e.intensity, 0) / (entries.length - half);

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (secondHalfAvg > firstHalfAvg + 0.5) trend = 'up';
  else if (secondHalfAvg < firstHalfAvg - 0.5) trend = 'down';

  return {
    averageIntensity: Math.round(avgIntensity * 10) / 10,
    mostCommonMood,
    trend
  };
}

/** 获取情绪档案 */
export async function getEmotionProfile(): Promise<EmotionProfile> {
  const entries = memoryStore.getMoodEntries();

  if (entries.length === 0) {
    return {
      dominantMoods: [],
      intensityTrend: [],
      recentChanges: [],
      summary: {
        totalEntries: 0,
        averateIntensity: 0,
        mostActiveContext: null
      }
    };
  }

  // 计算主导情绪
  const moodCounts: Record<string, { count: number; percentage: number }> = {};
  entries.forEach(e => {
    if (!moodCounts[e.mood]) {
      moodCounts[e.mood] = { count: 0, percentage: 0 };
    }
    moodCounts[e.mood].count++;
  });

  const total = entries.length;
  const dominantMoods = Object.entries(moodCounts)
    .map(([mood, data]) => ({
      mood: mood as MoodEntry['mood'],
      count: data.count,
      percentage: Math.round((data.count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // 计算强度趋势（按日期分组）
  const dateGroups: Record<string, { avgIntensity: number; maxIntensity: number; count: number }> = {};
  entries.forEach(e => {
    const dateKey = e.createdAt.toISOString().split('T')[0];
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = { avgIntensity: 0, maxIntensity: 0, count: 0 };
    }
    dateGroups[dateKey].avgIntensity += e.intensity;
    dateGroups[dateKey].maxIntensity = Math.max(dateGroups[dateKey].maxIntensity, e.intensity);
    dateGroups[dateKey].count++;
  });

  const intensityTrend = Object.entries(dateGroups)
    .map(([date, data]) => ({
      date,
      avgIntensity: Math.round((data.avgIntensity / data.count) * 10) / 10,
      maxIntensity: data.maxIntensity
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 计算最近变化
  const recentChanges = [];
  for (let i = 1; i < Math.min(entries.length, 10); i++) {
    if (entries[i].mood !== entries[i - 1].mood) {
      recentChanges.push({
        from: entries[i - 1].mood,
        to: entries[i].mood,
        timestamp: entries[i].createdAt
      });
    }
  }

  // 计算统计摘要
  const avgIntensity = entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length;

  const contextCounts: Record<string, number> = {};
  entries.forEach(e => {
    if (e.context) {
      e.context.forEach(c => {
        contextCounts[c] = (contextCounts[c] || 0) + 1;
      });
    }
  });
  const mostActiveContext = Object.keys(contextCounts).sort((a, b) => contextCounts[b] - contextCounts[a])[0] || null;

  return {
    dominantMoods,
    intensityTrend,
    recentChanges,
    summary: {
      totalEntries: entries.length,
      averateIntensity: Math.round(avgIntensity * 10) / 10,
      mostActiveContext: mostActiveContext as EmotionProfile['summary']['mostActiveContext']
    }
  };
}
