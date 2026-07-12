// 星寰海 v2.0 - memory-body 记忆检索与相关性评分
import type { MoodEntry, EmotionPattern } from '../types/memoryBodyTypes';
import { loadConfig } from '../core/memoryBodyConfig';

/** 检索条件接口 */
export interface RetrieveOptions {
  // 时间范围（毫秒）
  timeRange?: number;
  startTime?: Date;
  endTime?: Date;

  // 情绪标签过滤
  moodTags?: string[];

  // 情境过滤
  contextTags?: string[];

  // 最小强度
  minIntensity?: number;

  // 最大返回数量
  limit?: number;

  // 是否应用衰减
  applyDecay?: boolean;
}

/** 检索结果项 */
export interface RetrievedMemory<T> {
  data: T;
  relevanceScore: number;
  decayedScore: number;
  createdAt: Date;
}

/** MemoryRetriever 类 - 负责记忆的检索和排序 */
export class MemoryRetriever {
  private config = loadConfig();

  /** 检索情绪记录 */
  retrieveMoodEntries(entries: MoodEntry[], options: RetrieveOptions): RetrievedMemory<MoodEntry>[] {
    let filtered = [...entries];

    // 1. 时间范围过滤
    if (options.startTime) {
      filtered = filtered.filter(e => e.createdAt >= options.startTime!);
    }
    if (options.endTime) {
      filtered = filtered.filter(e => e.createdAt <= options.endTime!);
    } else if (options.timeRange) {
      const cutoff = Date.now() - options.timeRange;
      filtered = filtered.filter(e => e.createdAt.getTime() > cutoff);
    }

    // 2. 情绪标签过滤
    if (options.moodTags && options.moodTags.length > 0) {
      filtered = filtered.filter(e => options.moodTags!.includes(e.mood));
    }

    // 3. 情境过滤
    if (options.contextTags && options.contextTags.length > 0) {
      filtered = filtered.filter(e =>
        e.context && e.context.some(c => options.contextTags!.includes(c))
      );
    }

    // 4. 强度过滤
    if (options.minIntensity) {
      filtered = filtered.filter(e => e.intensity >= options.minIntensity!);
    }

    // 5. 计算相关性分数并排序
    const scored = filtered.map(entry => {
      const relevanceScore = this.calculateRelevanceScore(entry);
      const decayedScore = options.applyDecay !== false
        ? this.applyDecayFactor(relevanceScore, entry.createdAt)
        : relevanceScore;

      return {
        data: entry,
        relevanceScore,
        decayedScore,
        createdAt: entry.createdAt,
      };
    });

    // 6. 按分数降序排序
    scored.sort((a, b) => b.decayedScore - a.decayedScore);

    // 7. 限制返回数量
    if (options.limit) {
      return scored.slice(0, options.limit);
    }

    return scored;
  }

  /** 检索情绪模式 */
  retrievePatterns(patterns: EmotionPattern[], query?: string): RetrievedMemory<EmotionPattern>[] {
    let filtered = [...patterns];

    // 关键词过滤
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(p =>
        p.description.toLowerCase().includes(lowerQuery) ||
        p.patternType.toLowerCase().includes(lowerQuery)
      );
    }

    // 按置信度排序
    return filtered
      .map(pattern => ({
        data: pattern,
        relevanceScore: pattern.confidence,
        decayedScore: pattern.confidence,
        createdAt: pattern.createdAt,
      }))
      .sort((a, b) => b.decayedScore - a.decayedScore);
  }

  /** 计算相关性分数 */
  private calculateRelevanceScore(entry: MoodEntry): number {
    let score = 0;

    // 基础分：强度权重（越高越相关）
    score += (entry.intensity / 10) * 0.4;

    // 时间权重：最近的更相关
    const daysAgo = (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const timeWeight = Math.max(0, 1 - daysAgo / 30); // 30天内线性衰减
    score += timeWeight * 0.3;

    // 内容丰富度：有备注的更相关
    if (entry.note && entry.note.length > 0) {
      score += 0.15;
    }

    // 情境多样性：多个情境的更相关
    if (entry.context && entry.context.length > 0) {
      score += Math.min(entry.context.length * 0.05, 0.15);
    }

    return Math.min(score, 1.0);
  }

  /** 应用衰减因子 */
  private applyDecayFactor(score: number, createdAt: Date): number {
    const now = Date.now();
    const elapsedMs = now - createdAt.getTime();
    const elapsedWeeks = elapsedMs / (1000 * 60 * 60 * 24 * 7);

    // 每周衰减 ratePerWeek
    const decayed = score * Math.pow(this.config.decayRatePerWeek, elapsedWeeks);

    // 确保不低于最低分数
    return Math.max(decayed, this.config.minRelevanceScore);
  }

  /** 获取最近N天的情绪趋势 */
  getRecentTrend(entries: MoodEntry[], days: number): Array<{
    date: string;
    avgIntensity: number;
    count: number;
    dominantMood: string;
  }> {
    const trendMap = new Map<string, { total: number; count: number; intensities: number[]; moods: Record<string, number> }>();

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentEntries = entries.filter(e => e.createdAt.getTime() > cutoff);

    for (const entry of recentEntries) {
      const dateKey = entry.createdAt.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { total: 0, count: 0, intensities: [], moods: {} });
      }
      const dayData = trendMap.get(dateKey)!;
      dayData.total += entry.intensity;
      dayData.count++;
      dayData.intensities.push(entry.intensity);
      dayData.moods[entry.mood] = (dayData.moods[entry.mood] || 0) + 1;
    }

    return Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        avgIntensity: Math.round(data.total / data.count),
        count: data.count,
        dominantMood: Object.entries(data.moods).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /** 查找相似情绪记录 */
  findSimilarEntries(entries: MoodEntry[], target: MoodEntry, threshold: number = 0.5): MoodEntry[] {
    return entries
      .filter(e => e.id !== target.id)
      .map(entry => ({
        entry,
        similarity: this.calculateSimilarity(target, entry),
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.entry);
  }

  /** 计算两个条目的相似度 */
  private calculateSimilarity(a: MoodEntry, b: MoodEntry): number {
    let similarity = 0;

    // 情绪标签相同
    if (a.mood === b.mood) similarity += 0.4;

    // 强度接近
    const intensityDiff = Math.abs(a.intensity - b.intensity);
    similarity += Math.max(0, 0.3 - intensityDiff * 0.03);

    // 情境重叠
    if (a.context && b.context) {
      const overlap = a.context.filter(c => b.context!.includes(c));
      similarity += overlap.length * 0.1;
    }

    // 时间接近（7天内）
    const timeDiff = Math.abs(a.createdAt.getTime() - b.createdAt.getTime());
    if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
      similarity += 0.2;
    }

    return Math.min(similarity, 1.0);
  }
}
