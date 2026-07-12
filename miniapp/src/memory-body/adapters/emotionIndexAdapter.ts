// 星寰海 v2.0 - 情绪索引适配器
// 负责情绪特征提取、情绪档案构建和情绪趋势分析

import { getStorage, setStorage } from '../../utils/storage';
import type { MoodEntry, EmotionProfile, EmotionTrendPoint, MoodTag, ContextTag } from '../types/memoryBodyTypes';

const STORAGE_KEYS = {
  MOOD_ENTRIES: 'mood_entries',
  EMOTION_INDEX: 'emotion_index',
  EMOTION_PROFILE: 'emotion_profile'
};

/** 情绪索引条目 */
interface EmotionIndexEntry {
  date: string;
  moods: Record<MoodTag, number>;
  avgIntensity: number;
  maxIntensity: number;
  contextCounts: Record<ContextTag, number>;
}

export class EmotionIndexAdapter {
  constructor(_userId: string) {
    // userId not used in current implementation
  }

  /**
   * 索引情绪条目，提取情绪特征
   * @param entry 情绪记录条目
   */
  indexMoodEntry(entry: MoodEntry): void {
    try {
      const entries = this.getMoodEntries();
      entries.unshift(entry);

      // 最多保留500条记录
      if (entries.length > 500) {
        entries.splice(500);
      }

      setStorage(STORAGE_KEYS.MOOD_ENTRIES, entries);
      this.updateEmotionIndex(entry);
    } catch (error) {
      console.error('[EmotionIndexAdapter] indexMoodEntry error:', error);
    }
  }

  /**
   * 更新情绪索引
   * @param entry 新的情绪记录
   */
  private updateEmotionIndex(entry: MoodEntry): void {
    const index = getStorage<Record<string, EmotionIndexEntry>>(STORAGE_KEYS.EMOTION_INDEX) || {};
    const dateKey = entry.createdAt.toISOString().split('T')[0];

    if (!index[dateKey]) {
      index[dateKey] = {
        date: dateKey,
        moods: {} as Record<MoodTag, number>,
        avgIntensity: entry.intensity,
        maxIntensity: entry.intensity,
        contextCounts: {} as Record<ContextTag, number>
      };
    }

    // 更新情绪计数
    const moods = index[dateKey].moods;
    moods[entry.mood] = (moods[entry.mood] || 0) + 1;

    // 更新平均强度
    const existingAvg = index[dateKey].avgIntensity;
    const count = Object.values(moods).reduce((a, b) => a + b, 0);
    index[dateKey].avgIntensity = Math.round((existingAvg * (count - 1) + entry.intensity) / count);

    // 更新最大强度
    index[dateKey].maxIntensity = Math.max(index[dateKey].maxIntensity, entry.intensity);

    // 更新情境计数
    if (entry.context) {
      entry.context.forEach(ctx => {
        index[dateKey].contextCounts[ctx] = (index[dateKey].contextCounts[ctx] || 0) + 1;
      });
    }

    setStorage(STORAGE_KEYS.EMOTION_INDEX, index);
  }

  /**
   * 获取所有情绪记录
   */
  getMoodEntries(): MoodEntry[] {
    return getStorage<MoodEntry[]>(STORAGE_KEYS.MOOD_ENTRIES) || [];
  }

  /**
   * 构建用户情绪档案
   * 聚合分析用户的情绪模式
   * @param days 分析天数，默认30天
   */
  buildEmotionProfile(days: number = 30): EmotionProfile {
    try {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const entries = this.getMoodEntries().filter(e => e.createdAt.getTime() > cutoff);

      // 计算主导情绪
      const moodCounts: Record<string, number> = {};
      const contextCounts: Record<string, number> = {};
      let totalIntensity = 0;

      entries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        totalIntensity += entry.intensity;

        if (entry.context) {
          entry.context.forEach(ctx => {
            contextCounts[ctx] = (contextCounts[ctx] || 0) + 1;
          });
        }
      });

      const totalEntries = entries.length;
      const dominantMoods = Object.entries(moodCounts)
        .map(([mood, count]) => ({
          mood: mood as MoodTag,
          count,
          percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 计算强度趋势（按日期分组）
      const intensityByDate: Record<string, { intensities: number[]; maxIntensity: number }> = {};
      entries.forEach(entry => {
        const dateKey = entry.createdAt.toISOString().split('T')[0];
        if (!intensityByDate[dateKey]) {
          intensityByDate[dateKey] = { intensities: [], maxIntensity: 0 };
        }
        intensityByDate[dateKey].intensities.push(entry.intensity);
        intensityByDate[dateKey].maxIntensity = Math.max(
          intensityByDate[dateKey].maxIntensity,
          entry.intensity
        );
      });

      const intensityTrend = Object.entries(intensityByDate)
        .map(([date, data]) => ({
          date,
          avgIntensity: Math.round(
            data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length
          ),
          maxIntensity: data.maxIntensity
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 找出最活跃的情境
      const mostActiveContext = Object.entries(contextCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as ContextTag | null;

      // 检测最近的情绪变化
      const recentChanges = this.detectRecentChanges(entries);

      const profile: EmotionProfile = {
        dominantMoods,
        intensityTrend,
        recentChanges,
        summary: {
          totalEntries,
          averateIntensity: totalEntries > 0 ? Math.round(totalIntensity / totalEntries) : 0,
          mostActiveContext
        }
      };

      // 缓存档案
      setStorage(STORAGE_KEYS.EMOTION_PROFILE, profile);

      return profile;
    } catch (error) {
      console.error('[EmotionIndexAdapter] buildEmotionProfile error:', error);
      return this.getEmptyProfile();
    }
  }

  /**
   * 检测最近的情绪变化
   */
  private detectRecentChanges(entries: MoodEntry[]): Array<{
    from: MoodTag;
    to: MoodTag;
    timestamp: Date;
  }> {
    const changes: Array<{ from: MoodTag; to: MoodTag; timestamp: Date }> = [];

    for (let i = 1; i < entries.length; i++) {
      if (entries[i].mood !== entries[i - 1].mood) {
        changes.push({
          from: entries[i - 1].mood,
          to: entries[i].mood,
          timestamp: entries[i].createdAt
        });
      }
    }

    return changes.slice(-10); // 返回最近10次变化
  }

  /**
   * 获取情绪趋势
   * @param days 趋势天数，默认7天
   */
  getEmotionTrend(days: number = 7): EmotionTrendPoint[] {
    try {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const entries = this.getMoodEntries().filter(e => e.createdAt.getTime() > cutoff);

      const trendByDate: Record<string, { intensities: number[]; distribution: Record<MoodTag, number> }> = {};

      entries.forEach(entry => {
        const dateKey = entry.createdAt.toISOString().split('T')[0];
        if (!trendByDate[dateKey]) {
          trendByDate[dateKey] = {
            intensities: [],
            distribution: {} as Record<MoodTag, number>
          };
        }
        trendByDate[dateKey].intensities.push(entry.intensity);
        trendByDate[dateKey].distribution[entry.mood] =
          (trendByDate[dateKey].distribution[entry.mood] || 0) + 1;
      });

      return Object.entries(trendByDate)
        .map(([date, data]) => ({
          date,
          avgIntensity: Math.round(
            data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length
          ),
          moodDistribution: data.distribution
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('[EmotionIndexAdapter] getEmotionTrend error:', error);
      return [];
    }
  }

  /**
   * 获取空档案模板
   */
  private getEmptyProfile(): EmotionProfile {
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

  /**
   * 清除数据
   */
  clear(): void {
    setStorage(STORAGE_KEYS.MOOD_ENTRIES, []);
    setStorage(STORAGE_KEYS.EMOTION_INDEX, {});
    setStorage(STORAGE_KEYS.EMOTION_PROFILE, null);
  }
}